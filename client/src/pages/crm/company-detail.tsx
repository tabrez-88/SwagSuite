import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { 
  Building, 
  ArrowLeft, 
  Edit, 
  Mail, 
  Phone, 
  Globe, 
  MapPin,
  Calendar,
  DollarSign,
  Users,
  ExternalLink,
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  MessageSquare,
  AlertCircle,
  TrendingUp,
  Clock,
  Plus,
  Trash2,
  Package
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import NewProjectWizard from "@/components/modals/NewProjectWizard";
import SendEmailDialog from "@/components/modals/SendEmailDialog";
import { ContactsManager } from "@/components/ContactsManager";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { apiRequest } from "@/lib/queryClient";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";

// Normalize various country name/code formats to standard 2-letter codes
function normalizeCountryCode(country: string): string {
  if (!country) return "US";
  const c = country.trim().toUpperCase();
  if (c === "US" || c === "CA" || c === "MX") return c;
  const mapping: Record<string, string> = {
    "USA": "US", "U.S.": "US", "U.S.A.": "US",
    "UNITED STATES": "US", "UNITED STATES OF AMERICA": "US",
    "CANADA": "CA", "CAN": "CA",
    "MEXICO": "MX", "MEX": "MX", "MÉXICO": "MX",
  };
  return mapping[c] || "US";
}

// Industry options
const INDUSTRY_OPTIONS = [
  "Technology",
  "Healthcare",
  "Finance",
  "Education",
  "Manufacturing",
  "Retail",
  "Non-Profit",
  "Government",
  "Entertainment",
  "Real Estate",
  "Construction",
  "Transportation",
  "Food & Beverage",
  "Professional Services",
  "Other"
];

// Form schema for company editing
const companyFormSchema = z.object({
  name: z.string().min(1, "Company name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  industry: z.string().optional(),
  notes: z.string().optional(),
  linkedinUrl: z.string().url("Invalid LinkedIn URL").optional().or(z.literal("")),
  twitterUrl: z.string().url("Invalid Twitter URL").optional().or(z.literal("")),
  facebookUrl: z.string().url("Invalid Facebook URL").optional().or(z.literal("")),
  instagramUrl: z.string().url("Invalid Instagram URL").optional().or(z.literal("")),
  otherSocialUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
});

type CompanyFormData = z.infer<typeof companyFormSchema>;

// Define the Company type with social media posts
interface Company {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  industry?: string;
  notes?: string;
  ytdSpend?: string;
  socialMediaLinks?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
    other?: string;
  };
  customerScore?: number;
  engagementLevel?: string;
  createdAt?: string;
  updatedAt?: string;
  socialMediaPosts?: Array<{
    platform: string;
    content: string;
    timestamp: string;
    url: string;
    isExcitingNews: boolean;
  }>;
  lastSocialMediaSync?: string;
  shippingAddresses?: Array<{
    label?: string;
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  }>;
  billingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  customFields?: Record<string, string>;
}

// Engagement level colors
const ENGAGEMENT_COLORS = {
  high: "bg-green-100 text-green-800 hover:bg-green-200",
  medium: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
  low: "bg-red-100 text-red-800 hover:bg-red-200",
  undefined: "bg-gray-100 text-gray-800 hover:bg-gray-200"
};

export default function CompanyDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [editShippingAddresses, setEditShippingAddresses] = useState<Array<{
    label?: string; street?: string; city?: string; state?: string; zipCode?: string; country?: string;
  }>>([]);
  const [editCustomFields, setEditCustomFields] = useState<Record<string, string>>({});
  const [newCustomFieldKey, setNewCustomFieldKey] = useState("");
  const [newCustomFieldValue, setNewCustomFieldValue] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      website: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
      industry: "",
      notes: "",
      linkedinUrl: "",
      twitterUrl: "",
      facebookUrl: "",
      instagramUrl: "",
      otherSocialUrl: "",
    },
  });

  const companyId = params.id;

  const { data: company, isLoading, error } = useQuery<Company>({
    queryKey: ["/api/companies", companyId],
    enabled: !!companyId,
  });

  const { data: companyContacts = [] } = useQuery<any[]>({
    queryKey: ["/api/contacts", { companyId }],
    queryFn: async () => {
      const res = await fetch(`/api/contacts?companyId=${companyId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch contacts");
      return res.json();
    },
    enabled: !!companyId,
  });

  const updateCompanyMutation = useMutation({
    mutationFn: async (data: Partial<CompanyFormData> & { shippingAddresses?: any[]; customFields?: Record<string, string> }) => {
      const { linkedinUrl, twitterUrl, facebookUrl, instagramUrl, otherSocialUrl, shippingAddresses, customFields, ...rest } = data;
      const formattedData = {
        ...rest,
        ...(shippingAddresses !== undefined ? { shippingAddresses } : {}),
        ...(customFields !== undefined ? { customFields } : {}),
        ...(linkedinUrl !== undefined || twitterUrl !== undefined || facebookUrl !== undefined || instagramUrl !== undefined || otherSocialUrl !== undefined ? {
          socialMediaLinks: {
            linkedin: linkedinUrl || "",
            twitter: twitterUrl || "",
            facebook: facebookUrl || "",
            instagram: instagramUrl || "",
            other: otherSocialUrl || ""
          }
        } : {})
      };
      const response = await apiRequest("PATCH", `/api/companies/${companyId}`, formattedData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      setIsEditModalOpen(false);
      toast({
        title: "Company updated",
        description: "The company has been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to update company: ${error.message || "Please try again."}`,
        variant: "destructive",
      });
    },
  });

  const handleEditCompany = () => {
    if (!company) return;
    
    form.reset({
      name: company.name,
      email: "", // No longer editable
      phone: "", // No longer editable
      website: company.website || "",
      address: company.address || "",
      city: company.city || "",
      state: company.state || "",
      zipCode: company.zipCode || "",
      country: normalizeCountryCode(company.country || ""),
      industry: company.industry || "",
      notes: company.notes || "",
      linkedinUrl: company.socialMediaLinks?.linkedin || "",
      twitterUrl: company.socialMediaLinks?.twitter || "",
      facebookUrl: company.socialMediaLinks?.facebook || "",
      instagramUrl: company.socialMediaLinks?.instagram || "",
      otherSocialUrl: company.socialMediaLinks?.other || "",
    });
    
    setEditShippingAddresses(company.shippingAddresses ? [...company.shippingAddresses] : []);
    setEditCustomFields(company.customFields ? { ...company.customFields } : {});
    setNewCustomFieldKey("");
    setNewCustomFieldValue("");
    setIsEditModalOpen(true);
  };

  const handleUpdateCompany = (data: CompanyFormData) => {
    updateCompanyMutation.mutate({
      ...data,
      shippingAddresses: editShippingAddresses,
      customFields: editCustomFields,
    } as any);
  };

  const formatCurrency = (amount: string | undefined) => {
    if (!amount) return "$0";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(parseFloat(amount));
  };

  const getSocialMediaIcon = (platform: string) => {
    switch (platform) {
      case 'linkedin': return <Linkedin className="h-4 w-4" />;
      case 'twitter': return <Twitter className="h-4 w-4" />;
      case 'facebook': return <Facebook className="h-4 w-4" />;
      case 'instagram': return <Instagram className="h-4 w-4" />;
      default: return <ExternalLink className="h-4 w-4" />;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'linkedin': return 'text-blue-600';
      case 'twitter': return 'text-sky-500';
      case 'facebook': return 'text-blue-700';
      case 'instagram': return 'text-pink-600';
      default: return 'text-gray-600';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  // Quick Action Handlers
  const handleSendEmail = () => {
    const contactsWithEmail = companyContacts.filter((c: any) => c.email);
    if (contactsWithEmail.length === 0) {
      toast({
        title: "No Contacts with Email",
        description: "This company has no contacts with an email address.",
        variant: "destructive",
      });
      return;
    }
    setIsEmailDialogOpen(true);
  };

  const handleCreateQuote = () => {
    setIsOrderModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-40" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-40" />
            <Skeleton className="h-60" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-40" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold">Company not found</h2>
        <p className="text-muted-foreground">The company you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => setLocation("/crm")} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to CRM
        </Button>
      </div>
    );
  }

  const excitingNewsPosts = company.socialMediaPosts?.filter(post => post.isExcitingNews) || [];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setLocation("/crm")}
            className="h-8 w-8 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-swag-navy">{company.name}</h1>
            {company.industry && (
              <p className="text-muted-foreground">{company.industry}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {company.engagementLevel && (
            <Badge className={ENGAGEMENT_COLORS[company.engagementLevel as keyof typeof ENGAGEMENT_COLORS] || ENGAGEMENT_COLORS.undefined}>
              {company.engagementLevel.charAt(0).toUpperCase() + company.engagementLevel.slice(1)} Engagement
            </Badge>
          )}
          <Button 
            size="sm"
            className="bg-swag-primary hover:bg-swag-primary/90"
            onClick={handleEditCompany}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Company
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="contacts">Contacts</TabsTrigger>
              <TabsTrigger value="social">Social Media</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Company Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Business Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {company.website && (
                      <div className="flex items-center gap-3">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Website</p>
                          <a 
                            href={company.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-swag-orange hover:underline"
                          >
                            {company.website.replace(/^https?:\/\//, '')}
                          </a>
                        </div>
                      </div>
                    )}
                    {(company.address || company.city || company.state) && (
                      <div className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Address</p>
                          <p className="text-sm text-muted-foreground">
                            {[company.address, company.city, company.state, company.zipCode].filter(Boolean).join(', ')}
                          </p>
                        </div>
                      </div>
                    )}
                    {company.industry && (
                      <div className="flex items-center gap-3">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Industry</p>
                          <p className="text-sm text-muted-foreground">{company.industry}</p>
                        </div>
                      </div>
                    )}
                    {company.country && (
                      <div className="flex items-center gap-3">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Country</p>
                          <p className="text-sm text-muted-foreground">{company.country}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Info box about contacts */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                    <p className="text-sm text-blue-900">
                      <strong>Contact Information:</strong> View and manage all contact persons for this company in the <button onClick={() => setActiveTab("contacts")} className="text-blue-700 underline hover:text-blue-800">Contacts tab</button>.
                    </p>
                  </div>

                  {company.notes && (
                    <div className="pt-4 border-t">
                      <p className="text-sm font-medium mb-2">Notes</p>
                      <p className="text-sm text-muted-foreground">{company.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Addresses */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Addresses
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Billing Address */}
                  <div>
                    <p className="text-sm font-medium mb-1">Billing Address</p>
                    {company.billingAddress && (company.billingAddress.street || company.billingAddress.city || company.billingAddress.state) ? (
                      <p className="text-sm text-muted-foreground">
                        {[company.billingAddress.street, company.billingAddress.city, company.billingAddress.state, company.billingAddress.zipCode, company.billingAddress.country].filter(Boolean).join(', ')}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No billing address set</p>
                    )}
                  </div>

                  {/* Shipping Addresses */}
                  <div>
                    <p className="text-sm font-medium mb-1">Shipping Addresses</p>
                    {company.shippingAddresses && company.shippingAddresses.length > 0 ? (
                      <div className="space-y-2">
                        {company.shippingAddresses.map((addr, idx) => (
                          <div key={idx} className="border rounded-md p-2">
                            {addr.label && (
                              <p className="text-xs font-semibold text-swag-navy">{addr.label}</p>
                            )}
                            <p className="text-sm text-muted-foreground">
                              {[addr.street, addr.city, addr.state, addr.zipCode, addr.country].filter(Boolean).join(', ')}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No shipping addresses</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Custom Fields */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Custom Fields</CardTitle>
                </CardHeader>
                <CardContent>
                  {company.customFields && Object.keys(company.customFields).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(company.customFields).map(([key, value]) => (
                        <div key={key} className="border rounded-md p-2">
                          <p className="text-xs font-medium text-muted-foreground">{key}</p>
                          <p className="text-sm">{value}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No custom fields</p>
                  )}
                </CardContent>
              </Card>

              {/* Company Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-2xl font-bold">{formatCurrency(company.ytdSpend)}</p>
                        <p className="text-xs text-muted-foreground">YTD Spending</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {company.customerScore !== undefined && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-2xl font-bold">{company.customerScore}</p>
                          <p className="text-xs text-muted-foreground">Customer Score</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-purple-600" />
                      <div>
                        <p className="text-sm font-medium">
                          {company.createdAt ? new Date(company.createdAt).toLocaleDateString() : 'N/A'}
                        </p>
                        <p className="text-xs text-muted-foreground">Customer Since</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="contacts" className="space-y-6">
              <ContactsManager companyId={company.id} companyName={company.name} />
            </TabsContent>

            <TabsContent value="social" className="space-y-6">
              {/* Social Media Posts */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Recent Social Media Activity
                    </CardTitle>
                    {company.lastSocialMediaSync && (
                      <p className="text-xs text-muted-foreground">
                        Last synced: {new Date(company.lastSocialMediaSync).toLocaleString()}
                      </p>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {company.socialMediaPosts && company.socialMediaPosts.length > 0 ? (
                    <div className="space-y-4">
                      {company.socialMediaPosts.map((post, index) => (
                        <div key={index} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`${getPlatformColor(post.platform)}`}>
                                {getSocialMediaIcon(post.platform)}
                              </div>
                              <span className="text-sm font-medium capitalize">{post.platform}</span>
                              {post.isExcitingNews && (
                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                  Exciting News
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {new Date(post.timestamp).toLocaleDateString()}
                            </p>
                          </div>
                          <p className="text-sm">{post.content}</p>
                          <a 
                            href={post.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-swag-orange hover:underline flex items-center gap-1"
                          >
                            View original post <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold text-muted-foreground mb-2">No social media activity</h3>
                      <p className="text-sm text-muted-foreground">
                        No social media posts found for this company.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="space-y-6">
              {/* Activity Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Activity Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold text-muted-foreground mb-2">No recent activity</h3>
                    <p className="text-sm text-muted-foreground">
                      Activity timeline will be available once interactions are recorded.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Company Avatar and Quick Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <Avatar className="h-20 w-20 mx-auto">
                  <AvatarFallback className="text-lg font-semibold bg-swag-orange text-blue bg-gray-200">
                    {getInitials(company.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{company.name}</h3>
                  {company.industry && (
                    <p className="text-sm text-muted-foreground">{company.industry}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Social Media Links */}
          {company.socialMediaLinks && Object.values(company.socialMediaLinks).some(link => link) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Social Media</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(company.socialMediaLinks).map(([platform, url]) => (
                  url && (
                    <div key={platform} className="flex items-center gap-3">
                      <div className={`${getPlatformColor(platform)}`}>
                        {getSocialMediaIcon(platform)}
                      </div>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-swag-orange hover:underline capitalize flex-1"
                      >
                        {platform}
                      </a>
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </div>
                  )
                ))}
              </CardContent>
            </Card>
          )}

          {/* Exciting News Alert */}
          {excitingNewsPosts.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2 text-yellow-800">
                  <AlertCircle className="h-4 w-4" />
                  Exciting News Alert
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-yellow-700 mb-2">
                  This company has shared {excitingNewsPosts.length} exciting news update{excitingNewsPosts.length > 1 ? 's' : ''} recently.
                </p>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setActiveTab("social")}
                  className="w-full text-yellow-800 border-yellow-300 hover:bg-yellow-100"
                >
                  View Details
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={handleSendEmail}
                disabled={companyContacts.filter((c: any) => c.email).length === 0}
              >
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={handleCreateQuote}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Create New Project
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Order Modal for Creating Quote */}
      <NewProjectWizard
        open={isOrderModalOpen}
        onOpenChange={setIsOrderModalOpen}
        initialCompanyId={company.id}
      />

      {/* Send Email Dialog */}
      <SendEmailDialog
        open={isEmailDialogOpen}
        onOpenChange={setIsEmailDialogOpen}
        contacts={companyContacts}
        companyName={company.name}
        defaultSubject={`Follow up with ${company.name}`}
      />

      {/* Edit Company Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Company</DialogTitle>
            <DialogDescription>
              Update the company information in your CRM system.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleUpdateCompany)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="ACME Corporation" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industry</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select industry" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {INDUSTRY_OPTIONS.map((industry) => (
                            <SelectItem key={industry} value={industry}>
                              {industry}
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
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input placeholder="https://company.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <Select
                        value={field.value || "US"}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="US">United States</SelectItem>
                          <SelectItem value="CA">Canada</SelectItem>
                          <SelectItem value="MX">Mexico</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900 mb-2">
                  <strong>Contact Management:</strong> Use the Contacts tab to manage all contact persons for this company.
                </p>
                <p className="text-xs text-blue-700">
                  The legacy Email and Phone fields have been moved to the Contacts system for better organization.
                </p>
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <AddressAutocomplete
                        value={field.value || ""}
                        onChange={field.onChange}
                        onAddressSelect={(addr) => {
                          form.setValue("city", addr.city);
                          form.setValue("state", addr.state);
                          form.setValue("zipCode", addr.zipCode);
                          form.setValue("country", addr.country);
                        }}
                        placeholder="123 Business Ave"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="New York" {...field} />
                      </FormControl>
                      <FormMessage />
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
                        <Input placeholder="NY" {...field} />
                      </FormControl>
                      <FormMessage />
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
                        <Input placeholder="10001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Social Media Links */}
              <div className="space-y-3">
                <h4 className="font-medium">Social Media Links</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="linkedinUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>LinkedIn</FormLabel>
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
                        <FormLabel>Twitter</FormLabel>
                        <FormControl>
                          <Input placeholder="https://twitter.com/..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="facebookUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Facebook</FormLabel>
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
                        <FormLabel>Instagram</FormLabel>
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
                      <FormLabel>Other Social Media</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Shipping Addresses */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Shipping Addresses</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEditShippingAddresses([...editShippingAddresses, { label: "", street: "", city: "", state: "", zipCode: "", country: "US" }])}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Address
                  </Button>
                </div>
                {editShippingAddresses.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">No shipping addresses. Click "Add Address" to add one.</p>
                )}
                {editShippingAddresses.map((addr, idx) => (
                  <div key={idx} className="border rounded-lg p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Address {idx + 1}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 w-7 p-0"
                        onClick={() => {
                          const updated = [...editShippingAddresses];
                          updated.splice(idx, 1);
                          setEditShippingAddresses(updated);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Input
                      placeholder="Label (e.g., Warehouse, HQ)"
                      value={addr.label || ""}
                      onChange={(e) => {
                        const updated = [...editShippingAddresses];
                        updated[idx] = { ...updated[idx], label: e.target.value };
                        setEditShippingAddresses(updated);
                      }}
                    />
                    <Input
                      placeholder="Street address"
                      value={addr.street || ""}
                      onChange={(e) => {
                        const updated = [...editShippingAddresses];
                        updated[idx] = { ...updated[idx], street: e.target.value };
                        setEditShippingAddresses(updated);
                      }}
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        placeholder="City"
                        value={addr.city || ""}
                        onChange={(e) => {
                          const updated = [...editShippingAddresses];
                          updated[idx] = { ...updated[idx], city: e.target.value };
                          setEditShippingAddresses(updated);
                        }}
                      />
                      <Input
                        placeholder="State"
                        value={addr.state || ""}
                        onChange={(e) => {
                          const updated = [...editShippingAddresses];
                          updated[idx] = { ...updated[idx], state: e.target.value };
                          setEditShippingAddresses(updated);
                        }}
                      />
                      <Input
                        placeholder="ZIP"
                        value={addr.zipCode || ""}
                        onChange={(e) => {
                          const updated = [...editShippingAddresses];
                          updated[idx] = { ...updated[idx], zipCode: e.target.value };
                          setEditShippingAddresses(updated);
                        }}
                      />
                    </div>
                    <Select
                      value={addr.country || "US"}
                      onValueChange={(val) => {
                        const updated = [...editShippingAddresses];
                        updated[idx] = { ...updated[idx], country: val };
                        setEditShippingAddresses(updated);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="US">United States</SelectItem>
                        <SelectItem value="CA">Canada</SelectItem>
                        <SelectItem value="MX">Mexico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              {/* Custom Fields */}
              <div className="space-y-3">
                <h4 className="font-medium">Custom Fields</h4>
                {Object.keys(editCustomFields).length > 0 && (
                  <div className="space-y-2">
                    {Object.entries(editCustomFields).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <Input value={key} disabled className="flex-1 bg-muted" />
                        <Input
                          value={value}
                          className="flex-1"
                          onChange={(e) => {
                            setEditCustomFields({ ...editCustomFields, [key]: e.target.value });
                          }}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                          onClick={() => {
                            const updated = { ...editCustomFields };
                            delete updated[key];
                            setEditCustomFields(updated);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground">Field Name</label>
                    <Input
                      placeholder="e.g., Account Manager"
                      value={newCustomFieldKey}
                      onChange={(e) => setNewCustomFieldKey(e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground">Value</label>
                    <Input
                      placeholder="e.g., John Smith"
                      value={newCustomFieldValue}
                      onChange={(e) => setNewCustomFieldValue(e.target.value)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9"
                    disabled={!newCustomFieldKey.trim()}
                    onClick={() => {
                      if (newCustomFieldKey.trim()) {
                        setEditCustomFields({ ...editCustomFields, [newCustomFieldKey.trim()]: newCustomFieldValue });
                        setNewCustomFieldKey("");
                        setNewCustomFieldValue("");
                      }
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
                {Object.keys(editCustomFields).length === 0 && (
                  <p className="text-sm text-muted-foreground italic">No custom fields. Add key-value pairs above.</p>
                )}
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional notes about the company..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateCompanyMutation.isPending}
                  className="bg-swag-primary hover:bg-swag-primary/90"
                >
                  {updateCompanyMutation.isPending ? "Updating..." : "Update Company"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}