import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
// Note: This component is used within the CRM layout, so no separate Layout needed
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserAvatar } from "@/components/UserAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Search, 
  Plus, 
  Building2, 
  Phone, 
  Mail, 
  Globe, 
  Star,
  Trash2,
  Edit,
  DollarSign,
  Calendar,
  Package,
  Grid,
  List,
  MoreHorizontal,
  Eye,
  Clock,
  MapPin,
  Gift,
  TrendingUp,
  Target,
  Award,
  Percent
} from "lucide-react";
import { CRMViewToggle } from "@/components/CRMViewToggle";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";

interface Vendor {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  contactPerson?: string;
  paymentTerms?: string;
  notes?: string;
  isPreferred?: boolean;
  doNotOrder?: boolean;
  ytdSpend?: number;
  lastYearSpend?: number;
  lastOrderDate?: string;
  apiIntegrationStatus?: string;
  createdAt?: string;
  updatedAt?: string;
  // Preferred vendor benefits
  eqpPricing?: number; // percentage discount
  rebatePercentage?: number;
  freeSetups?: boolean;
  reducedSpecSamples?: boolean;
  freeSpecSamples?: boolean;
  reducedSelfPromo?: boolean;
  freeSelfPromo?: boolean;
  // Preferred vendor tracking
  ytdEqpSavings?: number;
  ytdRebates?: number;
  selfPromosSent?: number;
  specSamplesSent?: number;
}

// Form schema for vendor creation
const vendorFormSchema = z.object({
  name: z.string().min(1, "Vendor name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  address: z.string().optional(),
  contactPerson: z.string().optional(),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
  isPreferred: z.boolean().default(false),
  eqpPricing: z.number().optional(),
  rebatePercentage: z.number().optional(),
  freeSetups: z.boolean().default(false),
  freeSpecSamples: z.boolean().default(false),
  freeSelfPromo: z.boolean().default(false),
  reducedSpecSamples: z.boolean().default(false),
});

type VendorFormData = z.infer<typeof vendorFormSchema>;

export default function Vendors() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filterPreferred, setFilterPreferred] = useState<string>("all");
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [isVendorDetailOpen, setIsVendorDetailOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("all");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<VendorFormData>({
    resolver: zodResolver(vendorFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      website: "",
      address: "",
      contactPerson: "",
      paymentTerms: "",
      notes: "",
      isPreferred: false,
      eqpPricing: undefined,
      rebatePercentage: undefined,
      freeSetups: false,
      freeSpecSamples: false,
      freeSelfPromo: false,
      reducedSpecSamples: false,
    },
  });

  const { data: vendors = [], isLoading } = useQuery<Vendor[]>({
    queryKey: ["/api/suppliers"],
  });

  const createVendorMutation = useMutation({
    mutationFn: async (data: VendorFormData) => {
      return await apiRequest("/api/suppliers", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Vendor created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      setIsCreateModalOpen(false);
      form.reset();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create vendor. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteVendorMutation = useMutation({
    mutationFn: async (vendorId: string) => {
      return await apiRequest(`/api/suppliers/${vendorId}`, "DELETE");
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Vendor deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete vendor. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: VendorFormData) => {
    createVendorMutation.mutate(data);
  };

  const handleDeleteVendor = (vendorId: string) => {
    if (confirm("Are you sure you want to delete this vendor?")) {
      deleteVendorMutation.mutate(vendorId);
    }
  };

  // Toggle preferred vendor status
  const togglePreferredMutation = useMutation({
    mutationFn: async ({ vendorId, isPreferred }: { vendorId: string; isPreferred: boolean }) => {
      return apiRequest(`/api/suppliers/${vendorId}`, "PATCH", { isPreferred });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Vendor preference updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update vendor preference. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleTogglePreferred = (vendor: Vendor) => {
    togglePreferredMutation.mutate({
      vendorId: vendor.id,
      isPreferred: !vendor.isPreferred
    });
  };

  // Filter vendors based on search and tab selection
  const filteredVendors = vendors.filter((vendor: Vendor) => {
    const matchesSearch = !searchQuery || 
      vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.contactPerson?.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === "all") {
      return matchesSearch;
    } else if (activeTab === "preferred") {
      return matchesSearch && vendor.isPreferred;
    }
    
    return matchesSearch;
  });

  // Get preferred vendors specifically
  const preferredVendors = vendors.filter((vendor: Vendor) => vendor.isPreferred);

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-swag-navy">Vendors</h1>
            <p className="text-muted-foreground">
              Manage your supplier relationships and vendor information
            </p>
          </div>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-swag-primary hover:bg-swag-primary/90">
                <Plus className="mr-2" size={16} />
                Add Vendor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Vendor</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vendor Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter vendor name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="contactPerson"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Person</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter contact person" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Enter email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter phone number" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input type="url" placeholder="https://example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Enter vendor address" rows={2} {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="paymentTerms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Terms</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Net 30, COD" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Preferred Vendor Settings */}
                  <div className="space-y-4 p-4 border rounded-lg bg-yellow-50/50">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-600" />
                      <h3 className="font-medium text-sm">Preferred Vendor Settings</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="isPreferred"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                              <FormLabel>Mark as Preferred</FormLabel>
                              <p className="text-xs text-muted-foreground">
                                Enable special tracking and benefits
                              </p>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Preferred vendor benefits - show only when preferred is enabled */}
                    {form.watch("isPreferred") && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="eqpPricing"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>EQP Pricing %</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    placeholder="e.g., 15" 
                                    {...field} 
                                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="rebatePercentage"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Rebate %</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    placeholder="e.g., 5" 
                                    {...field}
                                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <FormField
                            control={form.control}
                            name="freeSetups"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm">Free Setups</FormLabel>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="freeSpecSamples"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm">Free Spec Samples</FormLabel>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="freeSelfPromo"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm">Free Self Promo</FormLabel>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="reducedSpecSamples"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm">Reduced Spec Samples</FormLabel>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Additional notes about this vendor" rows={3} {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCreateModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createVendorMutation.isPending}
                      className="bg-swag-primary hover:bg-swag-primary/90"
                    >
                      {createVendorMutation.isPending ? "Creating..." : "Create Vendor"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between mb-6">
            <TabsList className="grid w-auto grid-cols-2">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                All Vendors ({vendors.length})
              </TabsTrigger>
              <TabsTrigger value="preferred" className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                Preferred ({preferredVendors.length})
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                <Input
                  placeholder="Search vendors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="search-vendors"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <CRMViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
              <Badge variant="outline" className="whitespace-nowrap">
                {filteredVendors.length} vendors
              </Badge>
            </div>
          </div>

          {/* Tab Content - All Vendors */}
          <TabsContent value="all" className="space-y-6">

        {/* Vendors Display */}
        {isLoading ? (
          viewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full mb-2" />
                    <Skeleton className="h-3 w-1/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Contact Info</TableHead>
                      <TableHead>Terms</TableHead>
                      <TableHead>YTD Spend</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )
        ) : filteredVendors.length > 0 ? (
          <>
            {/* Cards View */}
            {viewMode === 'cards' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVendors.map((vendor: Vendor) => (
              <Card 
                key={vendor.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => {
                  setSelectedVendor(vendor);
                  setIsVendorDetailOpen(true);
                }}
                data-testid={`vendor-card-${vendor.id}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg text-swag-navy">{vendor.name}</CardTitle>
                        {vendor.isPreferred && (
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        )}
                      </div>
                      {vendor.contactPerson && (
                        <p className="text-sm text-muted-foreground">{vendor.contactPerson}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTogglePreferred(vendor);
                        }}
                        className={vendor.isPreferred 
                          ? "text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50" 
                          : "text-muted-foreground hover:text-yellow-600 hover:bg-yellow-50"
                        }
                        disabled={togglePreferredMutation.isPending}
                        title={vendor.isPreferred ? "Remove from preferred" : "Add to preferred"}
                      >
                        <Star size={14} className={vendor.isPreferred ? "fill-current" : ""} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteVendor(vendor.id);
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    {vendor.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{vendor.email}</span>
                      </div>
                    )}
                    {vendor.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{vendor.phone}</span>
                      </div>
                    )}
                    {vendor.website && (
                      <div className="flex items-center gap-2 text-sm">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <a 
                          href={vendor.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Website
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Show benefits for preferred vendors */}
                  {vendor.isPreferred && (
                    <div className="bg-yellow-50 rounded-md p-3 space-y-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Star className="h-3 w-3 text-yellow-600 fill-current" />
                        <span className="text-xs font-medium text-yellow-800">Preferred Benefits</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {vendor.eqpPricing && (
                          <div className="flex items-center gap-2 text-xs">
                            <Percent className="h-3 w-3 text-green-600" />
                            <span>{vendor.eqpPricing}% EQP</span>
                          </div>
                        )}
                        {vendor.rebatePercentage && (
                          <div className="flex items-center gap-2 text-xs">
                            <Gift className="h-3 w-3 text-blue-600" />
                            <span>{vendor.rebatePercentage}% Rebate</span>
                          </div>
                        )}
                        {vendor.freeSetups && (
                          <div className="flex items-center gap-2 text-xs">
                            <Award className="h-3 w-3 text-purple-600" />
                            <span>Free Setups</span>
                          </div>
                        )}
                        {vendor.freeSpecSamples && (
                          <div className="flex items-center gap-2 text-xs">
                            <Target className="h-3 w-3 text-indigo-600" />
                            <span>Free Samples</span>
                          </div>
                        )}
                      </div>
                      {(vendor.ytdEqpSavings || vendor.ytdRebates) && (
                        <div className="pt-2 border-t border-yellow-200 space-y-1">
                          {vendor.ytdEqpSavings && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">YTD Savings:</span>
                              <span className="font-medium text-green-600">
                                ${vendor.ytdEqpSavings.toLocaleString()}
                              </span>
                            </div>
                          )}
                          {vendor.ytdRebates && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">YTD Rebates:</span>
                              <span className="font-medium text-blue-600">
                                ${vendor.ytdRebates.toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {vendor.paymentTerms && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{vendor.paymentTerms}</Badge>
                    </div>
                  )}

                  {vendor.ytdSpend && (
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="text-muted-foreground">YTD: ${vendor.ytdSpend.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      {vendor.apiIntegrationStatus === "active" && (
                        <Badge className="bg-green-100 text-green-800">API Connected</Badge>
                      )}
                      {/* Add to Preferred Button for non-preferred vendors */}
                      {!vendor.isPreferred && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTogglePreferred(vendor);
                          }}
                          disabled={togglePreferredMutation.isPending}
                          className="text-xs hover:bg-yellow-50 hover:border-yellow-300"
                        >
                          <Star className="h-3 w-3 mr-1" />
                          Add to Preferred
                        </Button>
                      )}
                    </div>
                    <Button variant="outline" size="sm">
                      <Package className="mr-1" size={12} />
                      View Products
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
              </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Contact Info</TableHead>
                        <TableHead>Terms</TableHead>
                        <TableHead>YTD Spend</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredVendors.map((vendor: Vendor) => (
                        <TableRow 
                          key={vendor.id} 
                          className="hover:bg-muted/50 cursor-pointer"
                          onClick={() => {
                            setSelectedVendor(vendor);
                            setIsVendorDetailOpen(true);
                          }}
                          data-testid={`vendor-row-${vendor.id}`}
                        >
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <UserAvatar name={vendor.name} size="sm" />
                              <div>
                                <div className="font-medium text-swag-navy flex items-center gap-2">
                                  {vendor.name}
                                  {vendor.isPreferred && (
                                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                                  )}
                                </div>
                                {vendor.contactPerson && (
                                  <div className="text-sm text-muted-foreground">{vendor.contactPerson}</div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {vendor.email && (
                                <div className="flex items-center gap-1 text-sm">
                                  <Mail className="h-3 w-3 text-muted-foreground" />
                                  <span className="truncate">{vendor.email}</span>
                                </div>
                              )}
                              {vendor.phone && (
                                <div className="flex items-center gap-1 text-sm">
                                  <Phone className="h-3 w-3 text-muted-foreground" />
                                  <span>{vendor.phone}</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {vendor.paymentTerms && (
                              <Badge variant="secondary" className="text-xs">
                                {vendor.paymentTerms}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {vendor.ytdSpend && (
                              <div className="flex items-center gap-1 text-sm font-medium">
                                <DollarSign className="h-3 w-3 text-muted-foreground" />
                                ${vendor.ytdSpend.toLocaleString()}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              {vendor.isPreferred && (
                                <Badge className="bg-yellow-100 text-yellow-800 text-xs">Preferred</Badge>
                              )}
                              {vendor.apiIntegrationStatus === "active" && (
                                <Badge className="bg-green-100 text-green-800 text-xs">API Connected</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={(e) => e.stopPropagation()}
                                  data-testid={`vendor-actions-${vendor.id}`}
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedVendor(vendor);
                                  setIsVendorDetailOpen(true);
                                }}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  // Add edit functionality
                                }}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteVendor(vendor.id);
                                  }}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                No vendors found
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery 
                  ? "Try adjusting your search terms or create a new vendor."
                  : "Get started by adding your first vendor to manage supplier relationships."
                }
              </p>
              <Button onClick={() => setIsCreateModalOpen(true)} className="bg-swag-primary hover:bg-swag-primary/90">
                <Plus className="mr-2" size={16} />
                Add Vendor
              </Button>
            </CardContent>
          </Card>
        )}
          </TabsContent>

          {/* Tab Content - Preferred Vendors */}
          <TabsContent value="preferred" className="space-y-6">
            {/* Preferred Vendors Display */}
            {isLoading ? (
              viewMode === 'cards' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i}>
                      <CardHeader>
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-3 w-1/2" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-20 w-full mb-2" />
                        <Skeleton className="h-3 w-1/3" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Preferred Vendor</TableHead>
                          <TableHead>Benefits</TableHead>
                          <TableHead>YTD Savings</TableHead>
                          <TableHead>YTD Rebates</TableHead>
                          <TableHead>Promos Sent</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Array.from({ length: 3 }).map((_, i) => (
                          <TableRow key={i}>
                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )
            ) : preferredVendors.length > 0 ? (
              <>
                {/* Cards View - Preferred */}
                {viewMode === 'cards' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {preferredVendors.map((vendor: Vendor) => (
                      <Card 
                        key={vendor.id} 
                        className="hover:shadow-lg transition-shadow cursor-pointer border-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-50"
                        onClick={() => {
                          setSelectedVendor(vendor);
                          setIsVendorDetailOpen(true);
                        }}
                        data-testid={`preferred-vendor-card-${vendor.id}`}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <CardTitle className="text-lg text-swag-navy flex items-center gap-2">
                                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                  {vendor.name}
                                </CardTitle>
                              </div>
                              {vendor.contactPerson && (
                                <p className="text-sm text-muted-foreground">{vendor.contactPerson}</p>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {/* Benefits Summary */}
                          <div className="grid grid-cols-2 gap-3">
                            {vendor.eqpPricing && (
                              <div className="flex items-center gap-2 text-sm bg-green-100 rounded-md p-2">
                                <Percent className="h-4 w-4 text-green-600" />
                                <span className="font-medium">{vendor.eqpPricing}% EQP</span>
                              </div>
                            )}
                            {vendor.rebatePercentage && (
                              <div className="flex items-center gap-2 text-sm bg-blue-100 rounded-md p-2">
                                <Gift className="h-4 w-4 text-blue-600" />
                                <span className="font-medium">{vendor.rebatePercentage}% Rebate</span>
                              </div>
                            )}
                          </div>

                          {/* YTD Tracking */}
                          <div className="space-y-2 pt-2 border-t">
                            {vendor.ytdEqpSavings && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">YTD EQP Savings:</span>
                                <span className="font-medium text-green-600">
                                  ${vendor.ytdEqpSavings.toLocaleString()}
                                </span>
                              </div>
                            )}
                            {vendor.ytdRebates && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">YTD Rebates:</span>
                                <span className="font-medium text-blue-600">
                                  ${vendor.ytdRebates.toLocaleString()}
                                </span>
                              </div>
                            )}
                            {vendor.selfPromosSent !== undefined && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Self Promos:</span>
                                <span className="font-medium">{vendor.selfPromosSent}</span>
                              </div>
                            )}
                            {vendor.specSamplesSent !== undefined && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Spec Samples:</span>
                                <span className="font-medium">{vendor.specSamplesSent}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-2">
                            <Badge className="bg-yellow-100 text-yellow-800">
                              <Star className="h-3 w-3 mr-1 fill-current" />
                              Preferred
                            </Badge>
                            {vendor.ytdSpend && (
                              <span className="text-sm font-medium text-swag-navy">
                                ${vendor.ytdSpend.toLocaleString()} YTD
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* List View - Preferred */}
                {viewMode === 'list' && (
                  <Card className="border-yellow-200">
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Preferred Vendor</TableHead>
                            <TableHead>Benefits</TableHead>
                            <TableHead>YTD Savings</TableHead>
                            <TableHead>YTD Rebates</TableHead>
                            <TableHead>Promos Sent</TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {preferredVendors.map((vendor: Vendor) => (
                            <TableRow 
                              key={vendor.id} 
                              className="hover:bg-yellow-50 cursor-pointer bg-gradient-to-r from-yellow-50/50 to-transparent"
                              onClick={() => {
                                setSelectedVendor(vendor);
                                setIsVendorDetailOpen(true);
                              }}
                              data-testid={`preferred-vendor-row-${vendor.id}`}
                            >
                              <TableCell>
                                <div className="flex items-center space-x-3">
                                  <UserAvatar name={vendor.name} size="sm" />
                                  <div>
                                    <div className="font-medium text-swag-navy flex items-center gap-2">
                                      <Star className="h-3 w-3 text-yellow-500 fill-current" />
                                      {vendor.name}
                                    </div>
                                    {vendor.contactPerson && (
                                      <div className="text-sm text-muted-foreground">{vendor.contactPerson}</div>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {vendor.eqpPricing && (
                                    <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                                      {vendor.eqpPricing}% EQP
                                    </Badge>
                                  )}
                                  {vendor.rebatePercentage && (
                                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                                      {vendor.rebatePercentage}% Rebate
                                    </Badge>
                                  )}
                                  {vendor.freeSetups && (
                                    <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs">
                                      Free Setups
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {vendor.ytdEqpSavings && (
                                  <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                                    <TrendingUp className="h-3 w-3" />
                                    ${vendor.ytdEqpSavings.toLocaleString()}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                {vendor.ytdRebates && (
                                  <div className="flex items-center gap-1 text-sm font-medium text-blue-600">
                                    <Gift className="h-3 w-3" />
                                    ${vendor.ytdRebates.toLocaleString()}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {vendor.selfPromosSent !== undefined && (
                                    <div>Self: {vendor.selfPromosSent}</div>
                                  )}
                                  {vendor.specSamplesSent !== undefined && (
                                    <div>Samples: {vendor.specSamplesSent}</div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={(e) => e.stopPropagation()}
                                      data-testid={`preferred-vendor-actions-${vendor.id}`}
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedVendor(vendor);
                                      setIsVendorDetailOpen(true);
                                    }}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={(e) => {
                                      e.stopPropagation();
                                      // Add edit functionality
                                    }}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit Benefits
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Star className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                    No preferred vendors found
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Mark vendors as preferred to track special benefits, EQP pricing, and rebates.
                  </p>
                  <Button onClick={() => setIsCreateModalOpen(true)} className="bg-swag-primary hover:bg-swag-primary/90">
                    <Plus className="mr-2" size={16} />
                    Add Preferred Vendor
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Vendor Detail Modal */}
        <Dialog open={isVendorDetailOpen} onOpenChange={setIsVendorDetailOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <UserAvatar name={selectedVendor?.name || ""} size="md" />
                <div>
                  <div className="flex items-center gap-2">
                    {selectedVendor?.name}
                    {selectedVendor?.isPreferred && (
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    )}
                  </div>
                  {selectedVendor?.contactPerson && (
                    <p className="text-sm text-muted-foreground font-normal">
                      Contact: {selectedVendor.contactPerson}
                    </p>
                  )}
                </div>
              </DialogTitle>
            </DialogHeader>

            {selectedVendor && (
              <div className="space-y-6">
                {/* Preferred Vendor Benefits (if applicable) */}
                {selectedVendor.isPreferred && (
                  <Card className="border-yellow-200 bg-gradient-to-r from-yellow-50 to-amber-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        Preferred Vendor Benefits & Tracking
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Benefits */}
                        <div className="space-y-4">
                          <h4 className="font-medium text-sm">Benefits & Pricing</h4>
                          <div className="space-y-3">
                            {selectedVendor.eqpPricing && (
                              <div className="flex items-center gap-3">
                                <Percent className="h-4 w-4 text-green-600" />
                                <div>
                                  <p className="text-sm font-medium">EQP Pricing</p>
                                  <p className="text-sm text-muted-foreground">{selectedVendor.eqpPricing}% discount</p>
                                </div>
                              </div>
                            )}
                            {selectedVendor.rebatePercentage && (
                              <div className="flex items-center gap-3">
                                <Gift className="h-4 w-4 text-blue-600" />
                                <div>
                                  <p className="text-sm font-medium">Rebate Program</p>
                                  <p className="text-sm text-muted-foreground">{selectedVendor.rebatePercentage}% rebate</p>
                                </div>
                              </div>
                            )}
                            {selectedVendor.freeSetups && (
                              <div className="flex items-center gap-3">
                                <Award className="h-4 w-4 text-purple-600" />
                                <div>
                                  <p className="text-sm font-medium">Free Setups</p>
                                  <p className="text-sm text-muted-foreground">No setup charges</p>
                                </div>
                              </div>
                            )}
                            {(selectedVendor.freeSpecSamples || selectedVendor.reducedSpecSamples) && (
                              <div className="flex items-center gap-3">
                                <Target className="h-4 w-4 text-indigo-600" />
                                <div>
                                  <p className="text-sm font-medium">Spec Samples</p>
                                  <p className="text-sm text-muted-foreground">
                                    {selectedVendor.freeSpecSamples ? "Free samples" : "Reduced pricing"}
                                  </p>
                                </div>
                              </div>
                            )}
                            {(selectedVendor.freeSelfPromo || selectedVendor.reducedSelfPromo) && (
                              <div className="flex items-center gap-3">
                                <Package className="h-4 w-4 text-teal-600" />
                                <div>
                                  <p className="text-sm font-medium">Self Promo</p>
                                  <p className="text-sm text-muted-foreground">
                                    {selectedVendor.freeSelfPromo ? "Free self promo" : "Reduced pricing"}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* YTD Tracking */}
                        <div className="space-y-4">
                          <h4 className="font-medium text-sm">Year-to-Date Tracking</h4>
                          <div className="space-y-3">
                            {selectedVendor.ytdEqpSavings && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">EQP Savings:</span>
                                <span className="text-sm font-semibold text-green-600">
                                  ${selectedVendor.ytdEqpSavings.toLocaleString()}
                                </span>
                              </div>
                            )}
                            {selectedVendor.ytdRebates && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Rebates Earned:</span>
                                <span className="text-sm font-semibold text-blue-600">
                                  ${selectedVendor.ytdRebates.toLocaleString()}
                                </span>
                              </div>
                            )}
                            {selectedVendor.selfPromosSent !== undefined && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Self Promos Sent:</span>
                                <span className="text-sm font-medium">{selectedVendor.selfPromosSent}</span>
                              </div>
                            )}
                            {selectedVendor.specSamplesSent !== undefined && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Spec Samples Sent:</span>
                                <span className="text-sm font-medium">{selectedVendor.specSamplesSent}</span>
                              </div>
                            )}
                            {selectedVendor.ytdSpend && (
                              <div className="flex items-center justify-between pt-2 border-t">
                                <span className="text-sm text-muted-foreground">Total YTD Spend:</span>
                                <span className="text-sm font-semibold text-swag-navy">
                                  ${selectedVendor.ytdSpend.toLocaleString()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Contact Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {selectedVendor.email && (
                        <div className="flex items-center gap-3">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Email</p>
                            <a 
                              href={`mailto:${selectedVendor.email}`}
                              className="text-swag-primary hover:underline"
                            >
                              {selectedVendor.email}
                            </a>
                          </div>
                        </div>
                      )}
                      {selectedVendor.phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Phone</p>
                            <a 
                              href={`tel:${selectedVendor.phone}`}
                              className="text-swag-primary hover:underline"
                            >
                              {selectedVendor.phone}
                            </a>
                          </div>
                        </div>
                      )}
                      {selectedVendor.website && (
                        <div className="flex items-center gap-3">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Website</p>
                            <a 
                              href={selectedVendor.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-swag-primary hover:underline"
                            >
                              {selectedVendor.website}
                            </a>
                          </div>
                        </div>
                      )}
                      {selectedVendor.address && (
                        <div className="flex items-center gap-3">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Address</p>
                            <p className="text-muted-foreground">{selectedVendor.address}</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Financial Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {selectedVendor.paymentTerms && (
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Payment Terms</p>
                            <Badge variant="secondary">{selectedVendor.paymentTerms}</Badge>
                          </div>
                        </div>
                      )}
                      {selectedVendor.ytdSpend && (
                        <div className="flex items-center gap-3">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">YTD Spend</p>
                            <p className="text-lg font-semibold text-green-600">
                              ${selectedVendor.ytdSpend.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      )}
                      {selectedVendor.lastYearSpend && (
                        <div className="flex items-center gap-3">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Last Year Spend</p>
                            <p className="text-lg font-medium text-muted-foreground">
                              ${selectedVendor.lastYearSpend.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      )}
                      {selectedVendor.lastOrderDate && (
                        <div className="flex items-center gap-3">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Last Order Date</p>
                            <p className="text-muted-foreground">
                              {new Date(selectedVendor.lastOrderDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Status and Integration */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Vendor Status & Integration
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3 mb-4">
                      {selectedVendor.isPreferred && (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          <Star className="h-3 w-3 mr-1 fill-current" />
                          Preferred Vendor
                        </Badge>
                      )}
                      {selectedVendor.doNotOrder && (
                        <Badge variant="destructive">
                          Do Not Order
                        </Badge>
                      )}
                      {selectedVendor.apiIntegrationStatus === "active" && (
                        <Badge className="bg-green-100 text-green-800">
                          API Connected
                        </Badge>
                      )}
                    </div>
                    {selectedVendor.notes && (
                      <div className="mt-4">
                        <p className="text-sm font-medium mb-2">Notes</p>
                        <div className="bg-muted p-3 rounded-md">
                          <p className="text-muted-foreground whitespace-pre-wrap">
                            {selectedVendor.notes}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Vendor
                  </Button>
                  <Button variant="outline" size="sm">
                    <Package className="h-4 w-4 mr-2" />
                    View Orders
                  </Button>
                  <Button variant="outline" size="sm">
                    <Mail className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
  );
}