import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, AlertCircle, DollarSign, TrendingUp, BarChart3, PieChart } from "lucide-react";
import { PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertErrorSchema, type Error, type InsertError } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// Sample data for charts and analytics
const sampleErrors: Error[] = [
  {
    id: "1",
    orderNumber: "ORD-2024-001",
    errorType: "printing",
    description: "Incorrect ink color used on t-shirts",
    responsibleParty: "lsd",
    costToLsd: "150.00",
    isResolved: true,
    orderRep: "Sarah Johnson",
    productionRep: "Mike Chen",
    createdAt: "2024-03-15T10:30:00Z",
    updatedAt: "2024-03-16T09:15:00Z"
  },
  {
    id: "2", 
    orderNumber: "ORD-2024-002",
    errorType: "shipping",
    description: "Vendor delayed shipment by 3 days",
    responsibleParty: "vendor",
    costToLsd: "75.50",
    isResolved: false,
    orderRep: "Emily Davis",
    productionRep: "David Wilson",
    createdAt: "2024-03-18T14:20:00Z",
    updatedAt: "2024-03-18T14:20:00Z"
  },
  {
    id: "3",
    orderNumber: "ORD-2024-003", 
    errorType: "other",
    description: "Customer ordered 100 but received 75 units",
    responsibleParty: "customer",
    costToLsd: "0.00",
    isResolved: true,
    orderRep: "Alex Rodriguez",
    productionRep: "Lisa Thompson",
    createdAt: "2024-03-20T11:45:00Z",
    updatedAt: "2024-03-21T16:30:00Z"
  },
  {
    id: "4",
    orderNumber: "ORD-2024-004",
    errorType: "pricing",
    description: "Defective materials used in production",
    responsibleParty: "vendor",
    costToLsd: "340.25",
    isResolved: false,
    orderRep: "James Wilson",
    productionRep: "Sarah Johnson",
    createdAt: "2024-03-22T09:00:00Z",
    updatedAt: "2024-03-22T09:00:00Z"
  },
  {
    id: "5",
    orderNumber: "ORD-2024-005",
    errorType: "artwork_proofing",
    description: "Logo placement incorrect on merchandise",
    responsibleParty: "lsd",
    costToLsd: "125.00",
    isResolved: true,
    orderRep: "Mike Chen",
    productionRep: "Emily Davis",
    createdAt: "2024-03-25T13:15:00Z",
    updatedAt: "2024-03-26T10:45:00Z"
  }
];

export default function ErrorsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedError, setSelectedError] = useState<Error | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Use sample data
  const errors = sampleErrors;
  const isLoading = false;

  // Calculate statistics from sample data
  const totalErrors = errors.length;
  const resolvedErrors = errors.filter(e => e.isResolved).length;
  const unresolvedErrors = totalErrors - resolvedErrors;
  const totalCost = errors.reduce((sum, e) => sum + parseFloat(e.costToLsd || '0'), 0);

  // Chart data
  const errorsByType = errors.reduce((acc, error) => {
    acc[error.errorType] = (acc[error.errorType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const errorsByParty = errors.reduce((acc, error) => {
    acc[error.responsibleParty] = (acc[error.responsibleParty] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const typeChartData = Object.entries(errorsByType).map(([name, value]) => ({ 
    name: formatErrorType(name), 
    value 
  }));
  
  const partyChartData = Object.entries(errorsByParty).map(([name, value]) => ({ 
    name: name.charAt(0).toUpperCase() + name.slice(1), 
    value 
  }));

  const costData = Object.entries(errorsByParty).map(([party, count]) => ({
    party: party.charAt(0).toUpperCase() + party.slice(1),
    cost: errors
      .filter(e => e.responsibleParty === party)
      .reduce((sum, e) => sum + parseFloat(e.costToLsd || '0'), 0)
  }));

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];

  // Create error mutation
  const createErrorMutation = useMutation({
    mutationFn: async (data: InsertError) => {
      return await apiRequest("/api/errors", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/errors"] });
      setIsCreateModalOpen(false);
      toast({
        title: "Error Created",
        description: "Error has been successfully created.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create error.",
        variant: "destructive",
      });
    },
  });

  // Update error mutation
  const updateErrorMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<InsertError> }) => {
      return await apiRequest(`/api/errors/${data.id}`, "PUT", data.updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/errors"] });
      setSelectedError(null);
      toast({
        title: "Error Updated",
        description: "Error has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update error.",
        variant: "destructive",
      });
    },
  });

  // Resolve error mutation
  const resolveErrorMutation = useMutation({
    mutationFn: async (errorId: string) => {
      return await apiRequest(`/api/errors/${errorId}/resolve`, "POST");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/errors"] });
      toast({
        title: "Error Resolved",
        description: "Error has been marked as resolved.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to resolve error.",
        variant: "destructive",
      });
    },
  });

  const form = useForm<InsertError>({
    resolver: zodResolver(insertErrorSchema.omit({ createdBy: true })),
    defaultValues: {
      errorType: "other",
      responsibleParty: "lsd",
      resolution: "other",
      costToLsd: "0",
      isResolved: false,
    },
  });

  const onSubmit = (data: InsertError) => {
    if (selectedError) {
      updateErrorMutation.mutate({ id: selectedError.id, updates: data });
    } else {
      createErrorMutation.mutate(data);
    }
  };

  function formatErrorType(type: string) {
    const types: { [key: string]: string } = {
      pricing: 'Pricing Error',
      in_hands_date: 'In-Hands Date Issue',
      shipping: 'Shipping Error',
      printing: 'Printing Error',
      artwork_proofing: 'Artwork/Proofing',
      oos: 'Out of Stock',
      other: 'Other'
    };
    return types[type] || type;
  }

  function formatResponsibleParty(party: string) {
    const parties: { [key: string]: string } = {
      customer: 'Customer',
      vendor: 'Vendor',
      lsd: 'LSD'
    };
    return parties[party] || party;
  }

  function getErrorTypeColor(type: string) {
    const colors: { [key: string]: string } = {
      pricing: '#ef4444',
      in_hands_date: '#f59e0b',
      shipping: '#3b82f6',
      printing: '#8b5cf6',
      artwork_proofing: '#10b981',
      oos: '#f97316',
      other: '#6b7280'
    };
    return colors[type] || '#6b7280';
  }

  function getErrorTypeBadge(type: string) {
    const colors = {
      pricing: "bg-red-100 text-red-800",
      in_hands_date: "bg-yellow-100 text-yellow-800",
      shipping: "bg-blue-100 text-blue-800",
      printing: "bg-purple-100 text-purple-800",
      artwork_proofing: "bg-green-100 text-green-800",
      oos: "bg-orange-100 text-orange-800",
      other: "bg-gray-100 text-gray-800",
    };
    return colors[type as keyof typeof colors] || colors.other;
  }

  function getResponsiblePartyBadge(party: string) {
    const colors = {
      customer: "bg-blue-100 text-blue-800",
      vendor: "bg-yellow-100 text-yellow-800",
      lsd: "bg-red-100 text-red-800",
    };
    return colors[party as keyof typeof colors] || colors.lsd;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading error data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Error Tracking</h1>
          <p className="text-gray-600">Manage and track errors across your orders and projects</p>
        </div>
        <div className="flex space-x-4">
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Report Error
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{selectedError ? "Edit Error" : "Report New Error"}</DialogTitle>
              </DialogHeader>
              <ErrorForm
                form={form}
                onSubmit={onSubmit}
                isLoading={createErrorMutation.isPending || updateErrorMutation.isPending}
                selectedError={selectedError}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Errors</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalErrors}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{resolvedErrors}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Issues</CardTitle>
            <FileText className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{unresolvedErrors}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${totalCost.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Errors by Type Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="mr-2 h-5 w-5" />
              Errors by Type
            </CardTitle>
            <CardDescription>Distribution of error types across all incidents</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={typeChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {typeChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Errors by Responsible Party Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5" />
              Errors by Responsible Party
            </CardTitle>
            <CardDescription>Who is responsible for reported errors</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={partyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Cost by Responsible Party Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="mr-2 h-5 w-5" />
              Cost Impact by Responsible Party
            </CardTitle>
            <CardDescription>Financial impact of errors by responsible party</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={costData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="party" />
                <YAxis />
                <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, 'Cost']} />
                <Bar dataKey="cost" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Errors List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Errors</CardTitle>
          <CardDescription>Latest error reports and their current status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {errors.map((error) => (
              <div key={error.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Badge className={getErrorTypeBadge(error.errorType)}>
                        {formatErrorType(error.errorType)}
                      </Badge>
                      <Badge className={getResponsiblePartyBadge(error.responsibleParty)}>
                        {formatResponsibleParty(error.responsibleParty)}
                      </Badge>
                      <Badge 
                        variant={error.isResolved ? "default" : "destructive"}
                        className={error.isResolved ? "bg-green-100 text-green-800" : ""}
                      >
                        {error.isResolved ? "Resolved" : "Open"}
                      </Badge>
                    </div>
                    <div>
                      <h3 className="font-semibold">Order: {error.orderNumber}</h3>
                      <p className="text-gray-600">{error.description}</p>
                      <p className="text-sm text-gray-500">
                        Cost: ${parseFloat(error.costToLsd || '0').toFixed(2)} | 
                        Rep: {error.orderRep} | 
                        Production: {error.productionRep}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedError(error);
                        form.reset({
                          orderNumber: error.orderNumber,
                          errorType: error.errorType as any,
                          description: error.description,
                          responsibleParty: error.responsibleParty as any,
                          costToLsd: error.costToLsd,
                          orderRep: error.orderRep,
                          productionRep: error.productionRep,
                          isResolved: error.isResolved,
                        });
                        setIsCreateModalOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    {!error.isResolved && (
                      <Button
                        size="sm"
                        onClick={() => resolveErrorMutation.mutate(error.id)}
                        disabled={resolveErrorMutation.isPending}
                      >
                        Resolve
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Error Form Component
function ErrorForm({ 
  form, 
  onSubmit, 
  isLoading, 
  selectedError 
}: { 
  form: any; 
  onSubmit: (data: InsertError) => void; 
  isLoading: boolean; 
  selectedError: Error | null; 
}) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="orderNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Order Number</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="ORD-2024-001" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="errorType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Error Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select error type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pricing">Pricing Error</SelectItem>
                    <SelectItem value="in_hands_date">In-Hands Date Issue</SelectItem>
                    <SelectItem value="shipping">Shipping Error</SelectItem>
                    <SelectItem value="printing">Printing Error</SelectItem>
                    <SelectItem value="artwork_proofing">Artwork/Proofing</SelectItem>
                    <SelectItem value="oos">Out of Stock</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Describe the error in detail" rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="responsibleParty"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Responsible Party</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select responsible party" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="lsd">LSD</SelectItem>
                    <SelectItem value="vendor">Vendor</SelectItem>
                    <SelectItem value="customer">Customer</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="costToLsd"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cost to LSD</FormLabel>
                <FormControl>
                  <Input {...field} type="number" min="0" step="0.01" placeholder="0.00" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="orderRep"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Order Rep</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Sales representative name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="productionRep"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Production Rep</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Production representative name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : selectedError ? "Update Error" : "Create Error"}
          </Button>
        </div>
      </form>
    </Form>
  );
}