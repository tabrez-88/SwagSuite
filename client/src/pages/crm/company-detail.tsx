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
  Clock
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import OrderModal from "@/components/OrderModal";
import { ContactsManager } from "@/components/ContactsManager";

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
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const companyId = params.id;

  const { data: company, isLoading, error } = useQuery<Company>({
    queryKey: ["/api/companies", companyId],
    enabled: !!companyId,
  });

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
    if (company?.email) {
      window.location.href = `mailto:${company.email}?subject=Follow up with ${company.name}`;
    } else {
      toast({
        title: "No Email Available",
        description: "This company doesn't have an email address on file.",
        variant: "destructive",
      });
    }
  };

  const handleCallCompany = () => {
    if (company?.phone) {
      window.location.href = `tel:${company.phone}`;
    } else {
      toast({
        title: "No Phone Number Available",
        description: "This company doesn't have a phone number on file.",
        variant: "destructive",
      });
    }
  };

  const handleViewContacts = () => {
    // Navigate to contacts page with company filter
    setLocation(`/crm/contacts?company=${companyId}`);
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
            className="bg-swag-orange hover:bg-swag-orange/90"
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
                    Company Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {company.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Email</p>
                          <a href={`mailto:${company.email}`} className="text-sm text-swag-orange hover:underline">
                            {company.email}
                          </a>
                        </div>
                      </div>
                    )}
                    {company.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Phone</p>
                          <a href={`tel:${company.phone}`} className="text-sm text-muted-foreground hover:text-swag-orange">
                            {company.phone}
                          </a>
                        </div>
                      </div>
                    )}
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
                  </div>

                  {company.notes && (
                    <div className="pt-4 border-t">
                      <p className="text-sm font-medium mb-2">Notes</p>
                      <p className="text-sm text-muted-foreground">{company.notes}</p>
                    </div>
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
                disabled={!company.email}
              >
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={handleCallCompany}
                disabled={!company.phone}
              >
                <Phone className="h-4 w-4 mr-2" />
                Call Company
              </Button>
              {/* <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={handleViewContacts}
              >
                <Users className="h-4 w-4 mr-2" />
                View Contactsk
              </Button> */}
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={handleCreateQuote}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Create Order
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Order Modal for Creating Quote */}
      <OrderModal 
        open={isOrderModalOpen} 
        onOpenChange={setIsOrderModalOpen}
        order={null}
        initialCompanyId={company.id}
      />
    </div>
  );
}