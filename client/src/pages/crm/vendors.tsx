import { useState, useEffect } from "react";
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
  Percent,
  Users
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
  productCount?: number;
  lastOrderDate?: string;
  apiIntegrationStatus?: string;
  createdAt?: string;
  updatedAt?: string;
  preferredBenefits?: {
    eqpPricing?: number; // percentage discount
    rebatePercentage?: number;
    freeSetups?: boolean;
    reducedSpecSamples?: boolean;
    freeSpecSamples?: boolean;
    reducedSelfPromo?: boolean;
    freeSelfPromo?: boolean;
    ytdEqpSavings?: number;
    ytdRebates?: number;
    selfPromosSent?: number;
    specSamplesSent?: number;
  };
}

interface VendorContact {
  id: string;
  supplierId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  title?: string;
  isPrimary?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Contact form schema
const contactFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  title: z.string().optional(),
  isPrimary: z.boolean().default(false),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

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
  const [isEditBenefitsOpen, setIsEditBenefitsOpen] = useState(false);
  const [isEditVendorOpen, setIsEditVendorOpen] = useState(false);
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [isEditContactOpen, setIsEditContactOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<VendorContact | null>(null);

  // Benefits form state
  const [benefitsForm, setBenefitsForm] = useState({
    eqpPricing: 0,
    rebatePercentage: 0,
    freeSetups: false,
    freeSpecSamples: false,
    reducedSpecSamples: false,
    freeSelfPromo: false,
    reducedSelfPromo: false,
    ytdEqpSavings: 0,
    ytdRebates: 0,
    selfPromosSent: 0,
    specSamplesSent: 0,
  });

  // Fetch products for selected vendor
  const { data: vendorProducts, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["/api/products", "vendor", selectedVendor?.id],
    enabled: !!selectedVendor && isVendorDetailOpen,
    queryFn: async () => {
      if (!selectedVendor) return [];
      console.log('Fetching products for vendor:', selectedVendor.id);
      const res = await fetch(`/api/products?supplierId=${selectedVendor.id}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      console.log('Received products:', data.length);
      return data;
    },
  });

  // Fetch contacts for selected vendor
  const { data: vendorContacts = [], isLoading: isLoadingContacts } = useQuery<VendorContact[]>({
    queryKey: ["/api/contacts", "vendor", selectedVendor?.id],
    enabled: !!selectedVendor && isVendorDetailOpen,
    queryFn: async () => {
      if (!selectedVendor) return [];
      const res = await fetch(`/api/contacts?supplierId=${selectedVendor.id}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch contacts");
      return res.json();
    },
  });

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

  const contactForm = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      title: "",
      isPrimary: false,
    },
  });

  const { data: vendors = [], isLoading } = useQuery<Vendor[]>({
    queryKey: ["/api/suppliers"],
  });

  const createVendorMutation = useMutation({
    mutationFn: async (data: VendorFormData) => {
      const response = await apiRequest("POST", "/api/suppliers", data);
      return response.json();
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

  const updateVendorMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<VendorFormData> }) => {
      // Format data for API, converting benefit fields to preferredBenefits object
      const apiData: any = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        website: data.website,
        address: data.address,
        contactPerson: data.contactPerson,
        paymentTerms: data.paymentTerms,
        notes: data.notes,
        isPreferred: data.isPreferred,
      };

      // If vendor is preferred, include benefits
      if (data.isPreferred) {
        apiData.preferredBenefits = {
          eqpPricing: data.eqpPricing || 0,
          rebatePercentage: data.rebatePercentage || 0,
          freeSetups: data.freeSetups || false,
          freeSpecSamples: data.freeSpecSamples || false,
          reducedSpecSamples: data.reducedSpecSamples || false,
          freeSelfPromo: data.freeSelfPromo || false,
          reducedSelfPromo: false, // not in form but keep for consistency
          ytdEqpSavings: 0,
          ytdRebates: 0,
          selfPromosSent: 0,
          specSamplesSent: 0,
        };
      }

      const response = await apiRequest("PATCH", `/api/suppliers/${id}`, apiData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Vendor updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      setIsEditVendorOpen(false);
      setSelectedVendor(null);
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
        description: "Failed to update vendor. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteVendorMutation = useMutation({
    mutationFn: async (vendorId: string) => {
      const response = await apiRequest("DELETE", `/api/suppliers/${vendorId}`);
      return response;
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

  const onUpdateSubmit = (data: VendorFormData) => {
    if (selectedVendor) {
      updateVendorMutation.mutate({
        id: selectedVendor.id,
        data
      });
    }
  };

  const handleEditVendor = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    form.reset({
      name: vendor.name || "",
      email: "", // No longer editable, use Contacts system
      phone: "", // No longer editable, use Contacts system
      website: vendor.website || "",
      address: vendor.address || "",
      contactPerson: "", // No longer editable, use Contacts system
      paymentTerms: vendor.paymentTerms || "",
      notes: vendor.notes || "",
      isPreferred: vendor.isPreferred || false,
      eqpPricing: vendor.preferredBenefits?.eqpPricing || undefined,
      rebatePercentage: vendor.preferredBenefits?.rebatePercentage || undefined,
      freeSetups: vendor.preferredBenefits?.freeSetups || false,
      freeSpecSamples: vendor.preferredBenefits?.freeSpecSamples || false,
      freeSelfPromo: vendor.preferredBenefits?.freeSelfPromo || false,
      reducedSpecSamples: vendor.preferredBenefits?.reducedSpecSamples || false,
    });
    setIsEditVendorOpen(true);
  };

  const handleDeleteVendor = (vendorId: string) => {
    if (confirm("Are you sure you want to delete this vendor?")) {
      deleteVendorMutation.mutate(vendorId);
    }
  };

  // Toggle preferred vendor status
  const togglePreferredMutation = useMutation({
    mutationFn: async ({ vendorId, isPreferred }: { vendorId: string; isPreferred: boolean }) => {
      console.log('Toggling preferred for vendor:', vendorId, 'to:', isPreferred);
      const response = await apiRequest("PATCH", `/api/suppliers/${vendorId}`, { isPreferred });
      return response.json();
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

  // Update preferred benefits
  // Initialize benefits form when vendor is selected
  useEffect(() => {
    if (selectedVendor?.preferredBenefits) {
      setBenefitsForm({
        eqpPricing: selectedVendor.preferredBenefits.eqpPricing || 0,
        rebatePercentage: selectedVendor.preferredBenefits.rebatePercentage || 0,
        freeSetups: selectedVendor.preferredBenefits.freeSetups || false,
        freeSpecSamples: selectedVendor.preferredBenefits.freeSpecSamples || false,
        reducedSpecSamples: selectedVendor.preferredBenefits.reducedSpecSamples || false,
        freeSelfPromo: selectedVendor.preferredBenefits.freeSelfPromo || false,
        reducedSelfPromo: selectedVendor.preferredBenefits.reducedSelfPromo || false,
        ytdEqpSavings: selectedVendor.preferredBenefits.ytdEqpSavings || 0,
        ytdRebates: selectedVendor.preferredBenefits.ytdRebates || 0,
        selfPromosSent: selectedVendor.preferredBenefits.selfPromosSent || 0,
        specSamplesSent: selectedVendor.preferredBenefits.specSamplesSent || 0,
      });
    }
  }, [selectedVendor, isEditBenefitsOpen]);

  const updateBenefitsMutation = useMutation({
    mutationFn: async (data: { vendorId: string; preferredBenefits: any }) => {
      console.log('Updating benefits for vendor:', data.vendorId, 'with:', data.preferredBenefits);
      const response = await apiRequest("PATCH", `/api/suppliers/${data.vendorId}`, {
        preferredBenefits: data.preferredBenefits
      });
      return response.json();
    },
    onSuccess: async (updatedVendor) => {
      // Update selectedVendor with fresh data
      if (selectedVendor) {
        setSelectedVendor({
          ...selectedVendor,
          preferredBenefits: updatedVendor.preferredBenefits || benefitsForm
        });
      }

      toast({
        title: "Success",
        description: "Vendor benefits updated successfully",
      });

      // Refetch all vendors to update the list
      await queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      setIsEditBenefitsOpen(false);
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
        description: "Failed to update vendor benefits. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Contact mutations
  const createContactMutation = useMutation({
    mutationFn: async (data: ContactFormData & { supplierId: string }) => {
      const response = await apiRequest("POST", "/api/contacts", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Contact added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts", "vendor", selectedVendor?.id] });
      setIsAddContactOpen(false);
      contactForm.reset();
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
        description: "Failed to add contact. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateContactMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ContactFormData> }) => {
      const response = await apiRequest("PATCH", `/api/contacts/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Contact updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts", "vendor", selectedVendor?.id] });
      setIsEditContactOpen(false);
      setSelectedContact(null);
      contactForm.reset();
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
        description: "Failed to update contact. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteContactMutation = useMutation({
    mutationFn: async (contactId: string) => {
      const response = await apiRequest("DELETE", `/api/contacts/${contactId}`);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Contact deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts", "vendor", selectedVendor?.id] });
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
        description: "Failed to delete contact. Please try again.",
        variant: "destructive",
      });
    },
  });

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

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900 mb-2">
                    <strong>Contact Management:</strong> After creating the vendor, you can add contacts through the vendor details page.
                  </p>
                  <p className="text-xs text-blue-700">
                    Each vendor can have multiple contacts with their own email, phone, and role information.
                  </p>
                </div>

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
                        <TableHead>Products</TableHead>
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
                            </div>
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
                          {vendor.address && (
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground text-xs truncate">{vendor.address}</span>
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
                              {vendor.preferredBenefits?.eqpPricing && (
                                <div className="flex items-center gap-2 text-xs">
                                  <Percent className="h-3 w-3 text-green-600" />
                                  <span>{vendor.preferredBenefits.eqpPricing}% EQP</span>
                                </div>
                              )}
                              {vendor.preferredBenefits?.rebatePercentage && (
                                <div className="flex items-center gap-2 text-xs">
                                  <Gift className="h-3 w-3 text-blue-600" />
                                  <span>{vendor.preferredBenefits.rebatePercentage}% Rebate</span>
                                </div>
                              )}
                              {vendor.preferredBenefits?.freeSetups && (
                                <div className="flex items-center gap-2 text-xs">
                                  <Award className="h-3 w-3 text-purple-600" />
                                  <span>Free Setups</span>
                                </div>
                              )}
                              {vendor.preferredBenefits?.freeSpecSamples && (
                                <div className="flex items-center gap-2 text-xs">
                                  <Target className="h-3 w-3 text-indigo-600" />
                                  <span>Free Samples</span>
                                </div>
                              )}
                            </div>
                            {(vendor.preferredBenefits?.ytdEqpSavings || vendor.preferredBenefits?.ytdRebates) && (
                              <div className="pt-2 border-t border-yellow-200 space-y-1">
                                {vendor.preferredBenefits?.ytdEqpSavings && (
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">YTD Savings:</span>
                                    <span className="font-medium text-green-600">
                                      ${vendor.preferredBenefits.ytdEqpSavings.toLocaleString()}
                                    </span>
                                  </div>
                                )}
                                {vendor.preferredBenefits?.ytdRebates && (
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">YTD Rebates:</span>
                                    <span className="font-medium text-blue-600">
                                      ${vendor.preferredBenefits.ytdRebates.toLocaleString()}
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

                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {vendor.productCount !== undefined && (
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-blue-600" />
                              <span className="text-muted-foreground">{vendor.productCount} products</span>
                            </div>
                          )}

                          {vendor.ytdSpend && (
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-green-600" />
                              <span className="text-muted-foreground">YTD: ${vendor.ytdSpend.toLocaleString()}</span>
                            </div>
                          )}
                        </div>

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
                          <TableHead>Products</TableHead>
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
                                    {/* {vendor.isPreferred && (
                                      <Star className="h-3 w-3 text-yellow-500 fill-current" />
                                    )} */}
                                  </div>
                                  {vendor.contactPerson && (
                                    <div className="text-sm text-muted-foreground">{vendor.contactPerson}</div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {vendor.website && (
                                  <div className="flex items-center gap-1 text-sm">
                                    <Globe className="h-3 w-3 text-muted-foreground" />
                                    <a
                                      href={vendor.website}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      Website
                                    </a>
                                  </div>
                                )}
                                {vendor.apiIntegrationStatus === "active" && (
                                  <Badge className="bg-green-100 text-green-800 text-xs">API Active</Badge>
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
                              {vendor.productCount !== undefined && (
                                <div className="flex items-center gap-1 text-sm">
                                  <Package className="h-3 w-3 text-blue-600" />
                                  <span>{vendor.productCount}</span>
                                </div>
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
                                    handleEditVendor(vendor);
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
                                {vendor.name}
                              </CardTitle>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {/* Benefits Summary */}
                        <div className="grid grid-cols-2 gap-3">
                          {vendor.preferredBenefits?.eqpPricing && (
                            <div className="flex items-center gap-2 text-sm bg-green-100 rounded-md p-2">
                              <Percent className="h-4 w-4 text-green-600" />
                              <span className="font-medium">{vendor.preferredBenefits.eqpPricing}% EQP</span>
                            </div>
                          )}
                          {vendor.preferredBenefits?.rebatePercentage && (
                            <div className="flex items-center gap-2 text-sm bg-blue-100 rounded-md p-2">
                              <Gift className="h-4 w-4 text-blue-600" />
                              <span className="font-medium">{vendor.preferredBenefits.rebatePercentage}% Rebate</span>
                            </div>
                          )}
                        </div>

                        {/* YTD Tracking */}
                        <div className="space-y-2 pt-2 border-t">
                          {vendor.preferredBenefits?.ytdEqpSavings && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">YTD EQP Savings:</span>
                              <span className="font-medium text-green-600">
                                ${vendor.preferredBenefits.ytdEqpSavings.toLocaleString()}
                              </span>
                            </div>
                          )}
                          {vendor.preferredBenefits?.ytdRebates && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">YTD Rebates:</span>
                              <span className="font-medium text-blue-600">
                                ${vendor.preferredBenefits.ytdRebates.toLocaleString()}
                              </span>
                            </div>
                          )}
                          {vendor.preferredBenefits?.selfPromosSent !== undefined && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Self Promos:</span>
                              <span className="font-medium">{vendor.preferredBenefits.selfPromosSent}</span>
                            </div>
                          )}
                          {vendor.preferredBenefits?.specSamplesSent !== undefined && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Spec Samples:</span>
                              <span className="font-medium">{vendor.preferredBenefits.specSamplesSent}</span>
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
                                {vendor.preferredBenefits?.eqpPricing && (
                                  <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                                    {vendor.preferredBenefits.eqpPricing}% EQP
                                  </Badge>
                                )}
                                {vendor.preferredBenefits?.rebatePercentage && (
                                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                                    {vendor.preferredBenefits.rebatePercentage}% Rebate
                                  </Badge>
                                )}
                                {vendor.preferredBenefits?.freeSetups && (
                                  <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs">
                                    Free Setups
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {vendor.preferredBenefits?.ytdEqpSavings && (
                                <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                                  <TrendingUp className="h-3 w-3" />
                                  ${vendor.preferredBenefits.ytdEqpSavings.toLocaleString()}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {vendor.preferredBenefits?.ytdRebates && (
                                <div className="flex items-center gap-1 text-sm font-medium text-blue-600">
                                  <Gift className="h-3 w-3" />
                                  ${vendor.preferredBenefits.ytdRebates.toLocaleString()}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {vendor.preferredBenefits?.selfPromosSent !== undefined && (
                                  <div>Self: {vendor.preferredBenefits.selfPromosSent}</div>
                                )}
                                {vendor.preferredBenefits?.specSamplesSent !== undefined && (
                                  <div>Samples: {vendor.preferredBenefits.specSamplesSent}</div>
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
                                    handleEditVendor(vendor);
                                  }}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Vendor
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedVendor(vendor);
                                    setIsEditBenefitsOpen(true);
                                  }}>
                                    <Star className="h-4 w-4 mr-2" />
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
              {/* Preferred Vendor Benefits */}
              {selectedVendor.isPreferred && (
                <Card className="border-yellow-200 col-span-2 bg-yellow-50/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-yellow-800">
                        <Star className="h-5 w-5 fill-yellow-500" />
                        Preferred Vendor Benefits & Tracking
                      </CardTitle>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setIsEditBenefitsOpen(true);
                        }}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit Benefits
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Benefits Section */}
                    <div>
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <Gift className="h-4 w-4" />
                        Benefits Received
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedVendor.preferredBenefits?.eqpPricing && (
                          <div className="flex items-center gap-2 p-2 bg-white rounded border">
                            <Percent className="h-4 w-4 text-green-600" />
                            <div>
                              <p className="text-xs text-muted-foreground">EQP Pricing</p>
                              <p className="font-semibold text-green-600">{selectedVendor.preferredBenefits.eqpPricing}% discount</p>
                            </div>
                          </div>
                        )}
                        {selectedVendor.preferredBenefits?.rebatePercentage && (
                          <div className="flex items-center gap-2 p-2 bg-white rounded border">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <div>
                              <p className="text-xs text-muted-foreground">Rebate</p>
                              <p className="font-semibold text-green-600">{selectedVendor.preferredBenefits.rebatePercentage}%</p>
                            </div>
                          </div>
                        )}
                        {selectedVendor.preferredBenefits?.freeSetups && (
                          <Badge className="bg-blue-100 text-blue-800 justify-center">Free Setups</Badge>
                        )}
                        {selectedVendor.preferredBenefits?.freeSpecSamples && (
                          <Badge className="bg-blue-100 text-blue-800 justify-center">Free Spec Samples</Badge>
                        )}
                        {selectedVendor.preferredBenefits?.reducedSpecSamples && (
                          <Badge className="bg-blue-100 text-blue-800 justify-center">Reduced Spec Samples</Badge>
                        )}
                        {selectedVendor.preferredBenefits?.freeSelfPromo && (
                          <Badge className="bg-blue-100 text-blue-800 justify-center">Free Self-Promo</Badge>
                        )}
                        {selectedVendor.preferredBenefits?.reducedSelfPromo && (
                          <Badge className="bg-blue-100 text-blue-800 justify-center">Reduced Self-Promo</Badge>
                        )}
                      </div>
                    </div>

                    {/* Tracking Metrics */}
                    <div>
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        YTD Performance Tracking
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-3 bg-white rounded-lg border">
                          <p className="text-xs text-muted-foreground mb-1">EQP Savings</p>
                          <p className="text-lg font-bold text-green-600">
                            ${selectedVendor.preferredBenefits?.ytdEqpSavings?.toLocaleString() || '0'}
                          </p>
                        </div>
                        <div className="p-3 bg-white rounded-lg border">
                          <p className="text-xs text-muted-foreground mb-1">YTD Rebates</p>
                          <p className="text-lg font-bold text-green-600">
                            ${selectedVendor.preferredBenefits?.ytdRebates?.toLocaleString() || '0'}
                          </p>
                        </div>
                        <div className="p-3 bg-white rounded-lg border">
                          <p className="text-xs text-muted-foreground mb-1">Self-Promos</p>
                          <p className="text-lg font-bold text-blue-600">
                            {selectedVendor.preferredBenefits?.selfPromosSent || 0}
                          </p>
                        </div>
                        <div className="p-3 bg-white rounded-lg border">
                          <p className="text-xs text-muted-foreground mb-1">Spec Samples</p>
                          <p className="text-lg font-bold text-blue-600">
                            {selectedVendor.preferredBenefits?.specSamplesSent || 0}
                          </p>
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
                      <Building2 className="h-4 w-4" />
                      Company Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
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
                    {selectedVendor.apiIntegrationStatus && (
                      <div className="flex items-center gap-3">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">API Integration</p>
                          <Badge className={selectedVendor.apiIntegrationStatus === "active" ? "bg-green-100 text-green-800" : ""}>
                            {selectedVendor.apiIntegrationStatus}
                          </Badge>
                        </div>
                      </div>
                    )}
                    {/* Legacy fields - show only if no contacts exist */}
                    {vendorContacts.length === 0 && (
                      <>
                        {selectedVendor.email && (
                          <div className="flex items-center gap-3 opacity-60">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Legacy Email</p>
                              <a
                                href={`mailto:${selectedVendor.email}`}
                                className="text-sm text-swag-primary hover:underline"
                              >
                                {selectedVendor.email}
                              </a>
                              <p className="text-xs text-muted-foreground mt-1">
                                Consider adding this to a contact
                              </p>
                            </div>
                          </div>
                        )}
                        {selectedVendor.phone && (
                          <div className="flex items-center gap-3 opacity-60">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Legacy Phone</p>
                              <a
                                href={`tel:${selectedVendor.phone}`}
                                className="text-sm text-swag-primary hover:underline"
                              >
                                {selectedVendor.phone}
                              </a>
                              <p className="text-xs text-muted-foreground mt-1">
                                Consider adding this to a contact
                              </p>
                            </div>
                          </div>
                        )}
                      </>
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

              {/* Vendor Contacts */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Contacts ({vendorContacts.length})
                    </CardTitle>
                    <Button
                      size="sm"
                      onClick={() => setIsAddContactOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Contact
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingContacts ? (
                    <div className="space-y-2">
                      {Array.from({ length: 2 }).map((_, i) => (
                        <Skeleton key={i} className="h-20 w-full" />
                      ))}
                    </div>
                  ) : vendorContacts && vendorContacts.length > 0 ? (
                    <div className="space-y-3">
                      {vendorContacts.map((contact) => (
                        <Card key={contact.id} className="border">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3 flex-1">
                                <UserAvatar
                                  name={`${contact.firstName} ${contact.lastName}`}
                                  size="sm"
                                />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-medium">
                                      {contact.firstName} {contact.lastName}
                                    </h4>
                                    {contact.isPrimary && (
                                      <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                                        Primary
                                      </Badge>
                                    )}
                                  </div>
                                  {contact.title && (
                                    <p className="text-sm text-muted-foreground">{contact.title}</p>
                                  )}
                                  <div className="mt-2 space-y-1">
                                    {contact.email && (
                                      <div className="flex items-center gap-2 text-sm">
                                        <Mail className="h-3 w-3 text-muted-foreground" />
                                        <a
                                          href={`mailto:${contact.email}`}
                                          className="text-swag-primary hover:underline"
                                        >
                                          {contact.email}
                                        </a>
                                      </div>
                                    )}
                                    {contact.phone && (
                                      <div className="flex items-center gap-2 text-sm">
                                        <Phone className="h-3 w-3 text-muted-foreground" />
                                        <a
                                          href={`tel:${contact.phone}`}
                                          className="text-swag-primary hover:underline"
                                        >
                                          {contact.phone}
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedContact(contact);
                                    contactForm.reset({
                                      firstName: contact.firstName,
                                      lastName: contact.lastName,
                                      email: contact.email || "",
                                      phone: contact.phone || "",
                                      title: contact.title || "",
                                      isPrimary: contact.isPrimary || false,
                                    });
                                    setIsEditContactOpen(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (confirm("Are you sure you want to delete this contact?")) {
                                      deleteContactMutation.mutate(contact.id);
                                    }
                                  }}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No contacts found for this vendor</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => setIsAddContactOpen(true)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add First Contact
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

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

              {/* Products List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Products ({selectedVendor.productCount || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingProducts ? (
                    <div className="space-y-2">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : vendorProducts && vendorProducts.length > 0 ? (
                    <div className="space-y-2">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product Name</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Min Qty</TableHead>
                            <TableHead>Lead Time</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {vendorProducts.map((product: any) => (
                            <TableRow key={product.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {product.imageUrl && (
                                    <img
                                      src={product.imageUrl}
                                      alt={product.name}
                                      className="w-10 h-10 object-cover rounded"
                                    />
                                  )}
                                  <div>
                                    <p className="font-medium">{product.name}</p>
                                    {product.description && (
                                      <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                                        {product.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <code className="text-xs bg-muted px-2 py-1 rounded">
                                  {product.sku || product.supplierSku || '-'}
                                </code>
                              </TableCell>
                              <TableCell>
                                {product.basePrice ? (
                                  <span className="font-medium text-green-600">
                                    ${parseFloat(product.basePrice).toFixed(2)}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {product.minimumQuantity || 1}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {product.leadTime ? (
                                  <span className="text-sm text-muted-foreground">
                                    {product.leadTime} days
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No products found for this vendor</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handleEditVendor(selectedVendor);
                    setIsVendorDetailOpen(false);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Vendor
                </Button>
                {selectedVendor.isPreferred && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditBenefitsOpen(true);
                    }}
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Edit Benefits
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handleDeleteVendor(selectedVendor.id);
                    setIsVendorDetailOpen(false);
                  }}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Vendor
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Preferred Benefits Dialog */}
      <Dialog open={isEditBenefitsOpen} onOpenChange={setIsEditBenefitsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-600" />
              Edit Preferred Vendor Benefits - {selectedVendor?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedVendor && (
            <div className="space-y-6">
              {/* Benefits Section */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Gift className="h-4 w-4" />
                  Benefits Configuration
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">EQP Pricing (%)</label>
                    <Input
                      type="number"
                      placeholder="e.g., 15"
                      value={benefitsForm.eqpPricing}
                      onChange={(e) => setBenefitsForm({ ...benefitsForm, eqpPricing: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Rebate (%)</label>
                    <Input
                      type="number"
                      placeholder="e.g., 5"
                      value={benefitsForm.rebatePercentage}
                      onChange={(e) => setBenefitsForm({ ...benefitsForm, rebatePercentage: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <label className="text-sm font-medium">Free Setups</label>
                    <Switch
                      checked={benefitsForm.freeSetups}
                      onCheckedChange={(checked) => setBenefitsForm({ ...benefitsForm, freeSetups: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <label className="text-sm font-medium">Free Spec Samples</label>
                    <Switch
                      checked={benefitsForm.freeSpecSamples}
                      onCheckedChange={(checked) => setBenefitsForm({ ...benefitsForm, freeSpecSamples: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <label className="text-sm font-medium">Reduced Spec Samples</label>
                    <Switch
                      checked={benefitsForm.reducedSpecSamples}
                      onCheckedChange={(checked) => setBenefitsForm({ ...benefitsForm, reducedSpecSamples: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <label className="text-sm font-medium">Free Self-Promo</label>
                    <Switch
                      checked={benefitsForm.freeSelfPromo}
                      onCheckedChange={(checked) => setBenefitsForm({ ...benefitsForm, freeSelfPromo: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <label className="text-sm font-medium">Reduced Self-Promo</label>
                    <Switch
                      checked={benefitsForm.reducedSelfPromo}
                      onCheckedChange={(checked) => setBenefitsForm({ ...benefitsForm, reducedSelfPromo: checked })}
                    />
                  </div>
                </div>
              </div>

              {/* Tracking Section */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Tracking Metrics (Optional)
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">YTD EQP Savings ($)</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={benefitsForm.ytdEqpSavings}
                      onChange={(e) => setBenefitsForm({ ...benefitsForm, ytdEqpSavings: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">YTD Rebates ($)</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={benefitsForm.ytdRebates}
                      onChange={(e) => setBenefitsForm({ ...benefitsForm, ytdRebates: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Self-Promos Sent</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={benefitsForm.selfPromosSent}
                      onChange={(e) => setBenefitsForm({ ...benefitsForm, selfPromosSent: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Spec Samples Sent</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={benefitsForm.specSamplesSent}
                      onChange={(e) => setBenefitsForm({ ...benefitsForm, specSamplesSent: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsEditBenefitsOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    console.log('Saving benefits form:', benefitsForm);
                    updateBenefitsMutation.mutate({
                      vendorId: selectedVendor.id,
                      preferredBenefits: benefitsForm
                    });
                  }}
                >
                  <Star className="h-4 w-4 mr-2" />
                  Save Benefits
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Vendor Dialog */}
      <Dialog open={isEditVendorOpen} onOpenChange={setIsEditVendorOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Vendor - {selectedVendor?.name}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onUpdateSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Basic Information</h3>
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
              </div>

              {/* Contact Information */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input placeholder="https://vendor.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Legacy Fields Notice */}

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Full address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900 mb-2">
                    <strong>Contact Management:</strong> Use the "Contacts" tab in vendor details to manage all contact persons for this vendor.
                  </p>
                  <p className="text-xs text-blue-700">
                    The legacy Contact Person, Email, and Phone fields have been moved to the Contacts system for better organization.
                  </p>
                </div>
              </div>

              {/* Business Terms */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Business Terms
                </h3>
                <FormField
                  control={form.control}
                  name="paymentTerms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Terms</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Net 30" {...field} />
                      </FormControl>
                      <FormMessage />
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
                        <Textarea
                          placeholder="Additional notes about this vendor"
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Preferred Status */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Vendor Status
                </h3>
                <FormField
                  control={form.control}
                  name="isPreferred"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <FormLabel>Preferred Vendor</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Mark this vendor as preferred for priority treatment
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

              {/* Show benefits fields if preferred */}
              {form.watch("isPreferred") && (
                <div className="space-y-4 pt-4 border-t bg-yellow-50/50 p-4 rounded-lg">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Gift className="h-4 w-4 text-yellow-600" />
                    Preferred Benefits
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="eqpPricing"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>EQP Pricing (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="e.g., 15"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="rebatePercentage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rebate (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="e.g., 5"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="freeSetups"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between p-3 border rounded-lg bg-white">
                          <FormLabel>Free Setups</FormLabel>
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="freeSpecSamples"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between p-3 border rounded-lg bg-white">
                          <FormLabel>Free Spec Samples</FormLabel>
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="reducedSpecSamples"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between p-3 border rounded-lg bg-white">
                          <FormLabel>Reduced Spec Samples</FormLabel>
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="freeSelfPromo"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between p-3 border rounded-lg bg-white">
                          <FormLabel>Free Self-Promo</FormLabel>
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditVendorOpen(false);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateVendorMutation.isPending}>
                  {updateVendorMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add Contact Dialog */}
      <Dialog open={isAddContactOpen} onOpenChange={setIsAddContactOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Contact - {selectedVendor?.name}
            </DialogTitle>
          </DialogHeader>
          <Form {...contactForm}>
            <form onSubmit={contactForm.handleSubmit((data) => {
              if (selectedVendor) {
                createContactMutation.mutate({
                  ...data,
                  supplierId: selectedVendor.id
                });
              }
            })} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={contactForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={contactForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={contactForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={contactForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={contactForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title/Position</FormLabel>
                    <FormControl>
                      <Input placeholder="Sales Manager" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={contactForm.control}
                name="isPrimary"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <FormLabel>Primary Contact</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Mark as the main point of contact
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
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddContactOpen(false);
                    contactForm.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createContactMutation.isPending}>
                  {createContactMutation.isPending ? "Adding..." : "Add Contact"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Contact Dialog */}
      <Dialog open={isEditContactOpen} onOpenChange={setIsEditContactOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Contact
            </DialogTitle>
          </DialogHeader>
          <Form {...contactForm}>
            <form onSubmit={contactForm.handleSubmit((data) => {
              if (selectedContact) {
                updateContactMutation.mutate({
                  id: selectedContact.id,
                  data
                });
              }
            })} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={contactForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={contactForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={contactForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={contactForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={contactForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title/Position</FormLabel>
                    <FormControl>
                      <Input placeholder="Sales Manager" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={contactForm.control}
                name="isPrimary"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <FormLabel>Primary Contact</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Mark as the main point of contact
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
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditContactOpen(false);
                    setSelectedContact(null);
                    contactForm.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateContactMutation.isPending}>
                  {updateContactMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}