import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Building2,
  Globe,
  MapPin,
  Calendar,
  DollarSign,
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
  RefreshCw,
  TrendingUp,
  MessageSquare
} from "lucide-react";

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

const STATUS_COLORS = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-800",
  prospect: "bg-blue-100 text-blue-800",
  former: "bg-red-100 text-red-800",
  "on-hold": "bg-yellow-100 text-yellow-800"
};

const SOCIAL_MEDIA_ICONS = {
  linkedin: Linkedin,
  twitter: Twitter,
  facebook: Facebook,
  instagram: Instagram,
  other: Globe
};

export default function ClientDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const [refreshingSocial, setRefreshingSocial] = useState(false);

  const { data: client, isLoading, error } = useQuery<Client>({
    queryKey: ['/api/clients', params.id],
    enabled: !!params.id,
  });

  const handleRefreshSocialMedia = async () => {
    setRefreshingSocial(true);
    try {
      // Simulate API call to refresh social media posts
      await new Promise(resolve => setTimeout(resolve, 2000));
      // In real implementation, this would call the backend to refresh social media posts
    } catch (error) {
      console.error('Error refreshing social media:', error);
    } finally {
      setRefreshingSocial(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">Client Not Found</h3>
          <p className="text-sm text-red-700 mb-4">
            The client you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Button onClick={() => setLocation('/crm')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to CRM
          </Button>
        </div>
      </div>
    );
  }

  const socialMediaPosts = client.socialMediaPosts || [];
  const excitingNewsPosts = socialMediaPosts.filter(post => post.isExcitingNews);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setLocation('/crm')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to CRM
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-swag-navy">
              {client.firstName} {client.lastName}
            </h1>
            <p className="text-muted-foreground">
              {client.title && client.company ? `${client.title} at ${client.company}` : 
               client.company ? client.company : 
               client.title ? client.title : 'Client Details'}
            </p>
          </div>
        </div>
        <Badge className={STATUS_COLORS[client.status as keyof typeof STATUS_COLORS]}>
          {client.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client Info Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {client.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">{client.email}</span>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">{client.phone}</span>
                </div>
              )}
              {client.website && (
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-gray-500" />
                  <a 
                    href={client.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Website
                  </a>
                </div>
              )}
              {(client.address || client.city || client.state) && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                  <div className="text-sm">
                    {client.address && <div>{client.address}</div>}
                    {(client.city || client.state || client.zipCode) && (
                      <div>
                        {client.city}{client.city && client.state ? ', ' : ''}
                        {client.state} {client.zipCode}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Social Media Links */}
          {client.socialMediaLinks && Object.keys(client.socialMediaLinks).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Social Media
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(client.socialMediaLinks).map(([platform, url]) => {
                  if (!url) return null;
                  const IconComponent = SOCIAL_MEDIA_ICONS[platform as keyof typeof SOCIAL_MEDIA_ICONS] || Globe;
                  return (
                    <div key={platform} className="flex items-center gap-2">
                      <IconComponent className="w-4 h-4 text-gray-500" />
                      <a 
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline capitalize flex-1"
                      >
                        {platform}
                      </a>
                      <ExternalLink className="w-3 h-3 text-gray-400" />
                    </div>
                  );
                })}
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    Last sync: {client.lastSocialMediaSync ? 
                      new Date(client.lastSocialMediaSync).toLocaleDateString() : 
                      'Never'}
                  </span>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={handleRefreshSocialMedia}
                    disabled={refreshingSocial}
                  >
                    <RefreshCw className={`w-3 h-3 ${refreshingSocial ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Business Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Business Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Orders</span>
                <span className="font-semibold">{client.totalOrders || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Spent</span>
                <span className="font-semibold">${(client.totalSpent || 0).toLocaleString()}</span>
              </div>
              {client.lastOrderDate && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Order</span>
                  <span className="text-sm">{new Date(client.lastOrderDate).toLocaleDateString()}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Client Type</span>
                <Badge variant="outline" className="text-xs">{client.clientType}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="social" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="social">Social Posts</TabsTrigger>
              <TabsTrigger value="exciting">Exciting News</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="social" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5" />
                      Recent Social Media Posts
                    </span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={handleRefreshSocialMedia}
                      disabled={refreshingSocial}
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${refreshingSocial ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {socialMediaPosts.length > 0 ? (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {socialMediaPosts.map((post, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {SOCIAL_MEDIA_ICONS[post.platform as keyof typeof SOCIAL_MEDIA_ICONS] && (
                                <div className="flex items-center gap-1">
                                  {React.createElement(SOCIAL_MEDIA_ICONS[post.platform as keyof typeof SOCIAL_MEDIA_ICONS], {
                                    className: "w-4 h-4 text-gray-500"
                                  })}
                                  <span className="text-sm text-gray-500 capitalize">{post.platform}</span>
                                </div>
                              )}
                              {post.isExcitingNews && (
                                <Badge variant="destructive" className="text-xs">
                                  Exciting News
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-500">
                                {new Date(post.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm mb-2">{post.content}</p>
                          <a 
                            href={post.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                          >
                            View Post <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">No Social Media Posts</h3>
                      <p className="text-sm text-gray-500">
                        No recent posts found. Add social media links and refresh to see content.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="exciting" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-orange-500" />
                    Exciting News Alerts
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Posts flagged as containing "exciting news" that may impact your business relationship.
                  </p>
                </CardHeader>
                <CardContent>
                  {excitingNewsPosts.length > 0 ? (
                    <div className="space-y-4">
                      {excitingNewsPosts.map((post, index) => (
                        <div key={index} className="border-l-4 border-orange-500 bg-orange-50 p-4 rounded-r-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {SOCIAL_MEDIA_ICONS[post.platform as keyof typeof SOCIAL_MEDIA_ICONS] && (
                                <div className="flex items-center gap-1">
                                  {React.createElement(SOCIAL_MEDIA_ICONS[post.platform as keyof typeof SOCIAL_MEDIA_ICONS], {
                                    className: "w-4 h-4 text-orange-600"
                                  })}
                                  <span className="text-sm text-orange-600 capitalize font-medium">{post.platform}</span>
                                </div>
                              )}
                            </div>
                            <span className="text-xs text-orange-600">
                              {new Date(post.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-orange-800 mb-2">{post.content}</p>
                          <a 
                            href={post.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-orange-600 hover:underline flex items-center gap-1"
                          >
                            View Post <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">No Exciting News</h3>
                      <p className="text-sm text-gray-500">
                        No posts flagged as "exciting news" found for this client.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="orders" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Order History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">Order History</h3>
                    <p className="text-sm text-gray-500">
                      Order management integration coming soon.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notes" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Client Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {client.notes ? (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">{client.notes}</p>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">No Notes</h3>
                      <p className="text-sm text-gray-500">
                        No notes have been added for this client yet.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}