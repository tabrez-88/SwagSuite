import {
  Building,
  ArrowLeft,
  Edit,
  Mail,
  Globe,
  Calendar,
  DollarSign,
  ExternalLink,
  MessageSquare,
  AlertCircle,
  TrendingUp,
  Clock,
  Plus,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import NewProjectWizard from "@/components/modals/NewProjectWizard";
import SendEmailDialog from "@/components/modals/SendEmailDialog";
import { ContactsManager } from "@/components/feature/ContactsManager";
import { CompanyAddressesManager } from "@/components/feature/CompanyAddressesManager";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCompanyDetail } from "./hooks";
import { INDUSTRY_OPTIONS, ENGAGEMENT_COLORS } from "./types";

export default function CompanyDetail() {
  const {
    company,
    companyId,
    companyContacts,
    isLoading,
    error,
    excitingNewsPosts,
    form,
    activeTab,
    setActiveTab,
    isOrderModalOpen,
    setIsOrderModalOpen,
    isEditModalOpen,
    setIsEditModalOpen,
    isEmailDialogOpen,
    setIsEmailDialogOpen,
    editCustomFields,
    newCustomFieldKey,
    setNewCustomFieldKey,
    newCustomFieldValue,
    setNewCustomFieldValue,
    updateCompanyMutation,
    handleEditCompany,
    handleUpdateCompany,
    handleSendEmail,
    handleCreateQuote,
    updateCustomFieldValue,
    removeCustomField,
    addCustomField,
    formatCurrency,
    getSocialMediaIcon,
    getPlatformColor,
    getInitials,
    setLocation,
  } = useCompanyDetail();

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
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="addresses">Addresses</TabsTrigger>
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
                    {company.industry && (
                      <div className="flex items-center gap-3">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Industry</p>
                          <p className="text-sm text-muted-foreground">{company.industry}</p>
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

            <TabsContent value="addresses" className="space-y-6">
              <CompanyAddressesManager companyId={companyId!} companyName={company.name} />
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
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
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

              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900 mb-2">
                  <strong>Contacts & Addresses:</strong> Use the Contacts tab and the Addresses section on the Overview tab to manage contacts and addresses.
                </p>
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
                          onChange={(e) => updateCustomFieldValue(key, e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                          onClick={() => removeCustomField(key)}
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
                    onClick={addCustomField}
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
