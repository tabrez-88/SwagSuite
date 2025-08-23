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
  MapPin
} from "lucide-react";
import { CRMViewToggle } from "@/components/CRMViewToggle";

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
  isPreferred: z.boolean().optional(),
});

type VendorFormData = z.infer<typeof vendorFormSchema>;

export default function Vendors() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filterPreferred, setFilterPreferred] = useState<string>("all");
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [isVendorDetailOpen, setIsVendorDetailOpen] = useState(false);

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

  const filteredVendors = vendors.filter((vendor: Vendor) => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.contactPerson?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterPreferred === "all" || 
      (filterPreferred === "preferred" && vendor.isPreferred) ||
      (filterPreferred === "regular" && !vendor.isPreferred);
    
    return matchesSearch && matchesFilter;
  });

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

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="Search vendors by name, email, or contact person..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === 'cards' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('cards')}
                className="rounded-r-none"
                data-testid="view-cards"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
                data-testid="view-list"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-8" />

            <Select value={filterPreferred} onValueChange={setFilterPreferred}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vendors</SelectItem>
                <SelectItem value="preferred">Preferred</SelectItem>
                <SelectItem value="regular">Regular</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="outline" className="whitespace-nowrap">
              {filteredVendors.length} vendors
            </Badge>
          </div>
        </div>

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