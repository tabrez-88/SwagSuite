import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/UserAvatar";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Search, 
  Plus, 
  User, 
  Phone, 
  Mail, 
  Building2, 
  Globe,
  MapPin,
  Calendar,
  DollarSign,
  Trash2,
  Edit,
  Star,
  FileText,
  Activity,
  CreditCard,
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  ExternalLink,
  Clock,
  AlertCircle,
  Eye,
  MessageSquare,
  Grid,
  List,
  MoreHorizontal
} from "lucide-react";
import { CRMViewToggle } from "@/components/CRMViewToggle";

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  industry?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  website?: string;
  preferredContact: string;
  clientType: string;
  status: string;
  notes?: string;
  totalOrders?: number;
  totalSpent?: number;
  lastOrderDate?: string;
  accountManager?: string;
  creditLimit?: number;
  paymentTerms?: string;
  // Social media integration
  socialMediaLinks?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
    other?: string;
  };
  socialMediaPosts?: Array<{
    platform: string;
    content: string;
    timestamp: string;
    url: string;
    isExcitingNews?: boolean;
  }>;
  lastSocialMediaSync?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Form schema for client creation
const clientFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  company: z.string().optional(),
  title: z.string().optional(),
  industry: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  preferredContact: z.string().min(1, "Preferred contact method is required"),
  clientType: z.string().min(1, "Client type is required"),
  status: z.string().min(1, "Client status is required"),
  notes: z.string().optional(),
  creditLimit: z.string().optional().transform((val) => val ? parseFloat(val) : undefined),
  paymentTerms: z.string().optional(),
  // Social media links
  linkedinUrl: z.string().url().optional().or(z.literal("")),
  twitterUrl: z.string().url().optional().or(z.literal("")),
  facebookUrl: z.string().url().optional().or(z.literal("")),
  instagramUrl: z.string().url().optional().or(z.literal("")),
  otherSocialUrl: z.string().url().optional().or(z.literal("")),
});

type ClientFormData = z.infer<typeof clientFormSchema>;

const PREFERRED_CONTACT = ["Email", "Phone", "Text", "In-Person"];
const CLIENT_TYPES = ["Corporate", "Small Business", "Non-Profit", "Government", "Educational", "Individual"];
const CLIENT_STATUSES = ["active", "inactive", "prospect", "former", "on-hold"];

const STATUS_COLORS = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-800",
  prospect: "bg-blue-100 text-blue-800",
  former: "bg-red-100 text-red-800",
  "on-hold": "bg-yellow-100 text-yellow-800"
};

export default function Clients() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isClientDetailOpen, setIsClientDetailOpen] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      company: "",
      title: "",
      industry: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      website: "",
      preferredContact: "",
      clientType: "",
      status: "active",
      notes: "",
      creditLimit: "",
      paymentTerms: "",
      // Social media links
      linkedinUrl: "",
      twitterUrl: "",
      facebookUrl: "",
      instagramUrl: "",
      otherSocialUrl: "",
    },
  });

  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const createClientMutation = useMutation({
    mutationFn: async (data: ClientFormData) => {
      return await apiRequest("/api/clients", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Client created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
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
        description: "Failed to create client. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteClientMutation = useMutation({
    mutationFn: async (clientId: string) => {
      return await apiRequest(`/api/clients/${clientId}`, "DELETE");
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Client deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
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
        description: "Failed to delete client. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ClientFormData) => {
    createClientMutation.mutate(data);
  };

  const handleDeleteClient = (clientId: string) => {
    if (confirm("Are you sure you want to delete this client?")) {
      deleteClientMutation.mutate(clientId);
    }
  };

  const filteredClients = clients.filter((client: Client) => {
    const matchesSearch = client.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.company?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || client.status === filterStatus;
    const matchesType = filterType === "all" || client.clientType === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-swag-navy">Clients</h1>
            <p className="text-muted-foreground">
              Manage your client relationships and customer accounts
            </p>
          </div>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-swag-primary hover:bg-swag-primary/90">
                <Plus className="mr-2" size={16} />
                Add Client
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Client</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter first name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter last name" {...field} />
                          </FormControl>
                          <FormMessage />
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

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="company"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter company name" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Job Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter job title" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="industry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Industry</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter industry" {...field} />
                          </FormControl>
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
                  </div>

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter street address" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter city" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter state" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="zipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ZIP Code</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter ZIP code" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name="preferredContact"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Contact *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select method" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {PREFERRED_CONTACT.map((method) => (
                                <SelectItem key={method} value={method}>
                                  {method}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="clientType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Client Type *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {CLIENT_TYPES.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {CLIENT_STATUSES.map((status) => (
                                <SelectItem key={status} value={status}>
                                  {status.charAt(0).toUpperCase() + status.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="creditLimit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Credit Limit</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="paymentTerms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Terms</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Net 30, COD, Credit Card" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Social Media Links Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pt-4">
                      <MessageSquare className="w-4 h-4" />
                      <h3 className="font-medium">Social Media Links</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="linkedinUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Linkedin className="w-4 h-4" />
                              LinkedIn URL
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="https://linkedin.com/company/..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="twitterUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Twitter className="w-4 h-4" />
                              Twitter URL
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="https://twitter.com/..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="facebookUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Facebook className="w-4 h-4" />
                              Facebook URL
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="https://facebook.com/..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="instagramUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Instagram className="w-4 h-4" />
                              Instagram URL
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="https://instagram.com/..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="otherSocialUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Globe className="w-4 h-4" />
                            Other Social Media URL
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="https://..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Additional notes about this client" rows={3} {...field} />
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
                      disabled={createClientMutation.isPending}
                      className="bg-swag-primary hover:bg-swag-primary/90"
                    >
                      {createClientMutation.isPending ? "Creating..." : "Create Client"}
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
              placeholder="Search clients by name, email, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <CRMViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {CLIENT_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {CLIENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant="outline" className="whitespace-nowrap">
              {filteredClients.length} clients
            </Badge>
          </div>
        </div>

        {/* Clients Display */}
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
                      <TableHead>Client</TableHead>
                      <TableHead>Contact Info</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Credit Limit</TableHead>
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
        ) : filteredClients.length > 0 ? (
          <>
            {/* Cards View */}
            {viewMode === 'cards' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClients.map((client: Client) => (
              <Card key={client.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <UserAvatar 
                        name={`${client.firstName} ${client.lastName}`}
                        size="md"
                      />
                      <div>
                        <CardTitle className="text-lg text-swag-navy">
                          {client.firstName} {client.lastName}
                        </CardTitle>
                        {client.company && (
                          <p className="text-sm text-muted-foreground">{client.company}</p>
                        )}
                        {client.title && (
                          <p className="text-xs text-muted-foreground">{client.title}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={STATUS_COLORS[client.status as keyof typeof STATUS_COLORS]}>
                        {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClient(client.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    {client.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{client.email}</span>
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{client.phone}</span>
                      </div>
                    )}
                    {client.website && (
                      <div className="flex items-center gap-2 text-sm">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <a 
                          href={client.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Website
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{client.clientType}</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>{client.preferredContact}</span>
                    </div>
                  </div>

                  {client.totalSpent && (
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="text-muted-foreground">
                        Total: ${client.totalSpent.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {client.lastOrderDate && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <span className="text-muted-foreground">
                        Last Order: {new Date(client.lastOrderDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => window.location.href = `/crm/clients/${client.id}`}
                      className="bg-swag-primary hover:bg-swag-primary/90"
                    >
                      <Eye className="mr-1" size={12} />
                      View Details
                    </Button>
                    <Button variant="outline" size="sm">
                      <FileText className="mr-1" size={12} />
                      Orders
                    </Button>
                    <Button variant="outline" size="sm">
                      <Activity className="mr-1" size={12} />
                      Activity
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
                        <TableHead>Client</TableHead>
                        <TableHead>Contact Info</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Credit Limit</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClients.map((client: Client) => (
                        <TableRow 
                          key={client.id} 
                          className="hover:bg-muted/50 cursor-pointer"
                          data-testid={`client-row-${client.id}`}
                        >
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <UserAvatar name={`${client.firstName} ${client.lastName}`} size="sm" />
                              <div>
                                <div className="font-medium text-swag-navy">
                                  {client.firstName} {client.lastName}
                                </div>
                                {client.company && (
                                  <div className="text-sm text-muted-foreground">{client.company}</div>
                                )}
                                {client.title && (
                                  <div className="text-xs text-muted-foreground">{client.title}</div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {client.email && (
                                <div className="flex items-center gap-1 text-sm">
                                  <Mail className="h-3 w-3 text-muted-foreground" />
                                  <span className="truncate">{client.email}</span>
                                </div>
                              )}
                              {client.phone && (
                                <div className="flex items-center gap-1 text-sm">
                                  <Phone className="h-3 w-3 text-muted-foreground" />
                                  <span>{client.phone}</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                              {client.clientType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {client.creditLimit && (
                              <div className="flex items-center gap-1 text-sm font-medium">
                                <DollarSign className="h-3 w-3 text-muted-foreground" />
                                ${client.creditLimit.toLocaleString()}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={STATUS_COLORS[client.status as keyof typeof STATUS_COLORS]}>
                              {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  data-testid={`client-actions-${client.id}`}
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteClient(client.id)}
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
              <User className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                No clients found
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery 
                  ? "Try adjusting your search terms or create a new client."
                  : "Get started by adding your first client to manage customer relationships."
                }
              </p>
              <Button onClick={() => setIsCreateModalOpen(true)} className="bg-swag-primary hover:bg-swag-primary/90">
                <Plus className="mr-2" size={16} />
                Add Client
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
  );
}