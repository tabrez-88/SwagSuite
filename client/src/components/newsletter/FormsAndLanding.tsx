import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  Plus, 
  Eye, 
  Edit, 
  Copy, 
  Share,
  Code,
  Palette,
  Settings,
  BarChart3,
  FileText,
  Layout,
  Link,
  Globe,
  Users,
  TrendingUp,
  MousePointer
} from "lucide-react";

interface SignupForm {
  id: string;
  name: string;
  title: string;
  description: string;
  isActive: boolean;
  conversions: number;
  views: number;
  conversionRate: number;
  embedCode: string;
  createdAt: Date;
}

interface LandingPage {
  id: string;
  name: string;
  title: string;
  description: string;
  isPublished: boolean;
  views: number;
  conversions: number;
  conversionRate: number;
  url: string;
  createdAt: Date;
}

export function FormsAndLanding() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCreateLanding, setShowCreateLanding] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewType, setPreviewType] = useState<"form" | "landing">("form");

  // Mock data
  const signupForms: SignupForm[] = [
    {
      id: "1",
      name: "Newsletter Signup",
      title: "Stay Updated with SwagSuite",
      description: "Get the latest promotional product trends and exclusive offers",
      isActive: true,
      conversions: 1250,
      views: 18500,
      conversionRate: 6.8,
      embedCode: '<div id="swagsuite-form-1"></div><script src="https://forms.swagsuite.com/embed.js"></script>',
      createdAt: new Date("2024-12-01")
    },
    {
      id: "2",
      name: "VIP Customer Form",
      title: "Join Our VIP Program",
      description: "Exclusive access to premium products and special pricing",
      isActive: true,
      conversions: 340,
      views: 2800,
      conversionRate: 12.1,
      embedCode: '<div id="swagsuite-form-2"></div><script src="https://forms.swagsuite.com/embed.js"></script>',
      createdAt: new Date("2024-11-15")
    },
    {
      id: "3",
      name: "Event Registration",
      title: "Register for SwagSuite Live",
      description: "Don't miss our virtual product showcase event",
      isActive: false,
      conversions: 890,
      views: 5200,
      conversionRate: 17.1,
      embedCode: '<div id="swagsuite-form-3"></div><script src="https://forms.swagsuite.com/embed.js"></script>',
      createdAt: new Date("2024-10-20")
    }
  ];

  const landingPages: LandingPage[] = [
    {
      id: "1",
      name: "Holiday Promotion",
      title: "Holiday Special - 40% Off Custom Apparel",
      description: "Limited time offer on all custom branded merchandise",
      isPublished: true,
      views: 8500,
      conversions: 650,
      conversionRate: 7.6,
      url: "https://swagsuite.com/holiday-special",
      createdAt: new Date("2024-12-01")
    },
    {
      id: "2",
      name: "Product Showcase",
      title: "Discover Our Latest Product Collection",
      description: "Explore trending promotional products for 2025",
      isPublished: true,
      views: 12400,
      conversions: 950,
      conversionRate: 7.7,
      url: "https://swagsuite.com/new-products",
      createdAt: new Date("2024-11-20")
    },
    {
      id: "3",
      name: "Trade Show Landing",
      title: "Meet Us at Trade Show 2025",
      description: "Schedule a meeting and get exclusive show specials",
      isPublished: false,
      views: 0,
      conversions: 0,
      conversionRate: 0,
      url: "https://swagsuite.com/trade-show-2025",
      createdAt: new Date("2024-12-15")
    }
  ];

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // In a real app, you'd show a toast notification here
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="forms" className="space-y-6">
        <TabsList>
          <TabsTrigger value="forms" data-testid="tab-forms">Signup Forms</TabsTrigger>
          <TabsTrigger value="landing" data-testid="tab-landing">Landing Pages</TabsTrigger>
          <TabsTrigger value="surveys" data-testid="tab-surveys">Surveys</TabsTrigger>
        </TabsList>

        <TabsContent value="forms" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Signup Forms</h3>
            <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-form">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Form
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Signup Form</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="form-name">Form Name</Label>
                    <Input id="form-name" placeholder="Newsletter Signup" data-testid="input-form-name" />
                  </div>
                  
                  <div>
                    <Label htmlFor="form-title">Form Title</Label>
                    <Input id="form-title" placeholder="Stay Updated with SwagSuite" data-testid="input-form-title" />
                  </div>
                  
                  <div>
                    <Label htmlFor="form-description">Description</Label>
                    <Textarea 
                      id="form-description" 
                      placeholder="Get the latest promotional product trends..."
                      data-testid="textarea-form-description"
                    />
                  </div>

                  <div>
                    <Label htmlFor="subscriber-list">Target List</Label>
                    <Select>
                      <SelectTrigger data-testid="select-target-list">
                        <SelectValue placeholder="Select list" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="main">Main List</SelectItem>
                        <SelectItem value="vip">VIP Customers</SelectItem>
                        <SelectItem value="new">New Subscribers</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">Form Fields</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Email Address</Label>
                          <p className="text-sm text-muted-foreground">Required field</p>
                        </div>
                        <Switch checked disabled />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>First Name</Label>
                          <p className="text-sm text-muted-foreground">Optional field</p>
                        </div>
                        <Switch data-testid="switch-first-name" />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Last Name</Label>
                          <p className="text-sm text-muted-foreground">Optional field</p>
                        </div>
                        <Switch data-testid="switch-last-name" />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Company</Label>
                          <p className="text-sm text-muted-foreground">Optional field</p>
                        </div>
                        <Switch data-testid="switch-company" />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                      Cancel
                    </Button>
                    <Button data-testid="button-save-form">Create Form</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {signupForms.map((form) => (
              <Card key={form.id} data-testid={`card-form-${form.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-lg" data-testid={`text-form-name-${form.id}`}>
                          {form.name}
                        </h4>
                        <Badge className={getStatusColor(form.isActive)}>
                          {form.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      
                      <p className="text-muted-foreground mb-4" data-testid={`text-form-title-${form.id}`}>
                        {form.title}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                        <div>
                          <span className="text-muted-foreground">Views:</span>
                          <div className="font-medium" data-testid={`text-form-views-${form.id}`}>
                            {form.views.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Conversions:</span>
                          <div className="font-medium" data-testid={`text-form-conversions-${form.id}`}>
                            {form.conversions.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Conversion Rate:</span>
                          <div className="font-medium" data-testid={`text-form-rate-${form.id}`}>
                            {form.conversionRate}%
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-50 dark:bg-gray-900 rounded p-2 text-sm font-mono text-muted-foreground">
                          {form.embedCode.substring(0, 60)}...
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => copyToClipboard(form.embedCode)}
                          data-testid={`button-copy-embed-${form.id}`}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setPreviewType("form");
                          setShowPreview(true);
                        }}
                        data-testid={`button-preview-form-${form.id}`}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" data-testid={`button-edit-form-${form.id}`}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" data-testid={`button-analytics-form-${form.id}`}>
                        <BarChart3 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="landing" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Landing Pages</h3>
            <Dialog open={showCreateLanding} onOpenChange={setShowCreateLanding}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-landing">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Landing Page
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Landing Page</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="page-name">Page Name</Label>
                    <Input id="page-name" placeholder="Holiday Promotion" data-testid="input-page-name" />
                  </div>
                  
                  <div>
                    <Label htmlFor="page-title">Page Title</Label>
                    <Input id="page-title" placeholder="Holiday Special - 40% Off" data-testid="input-page-title" />
                  </div>
                  
                  <div>
                    <Label htmlFor="page-description">Description</Label>
                    <Textarea 
                      id="page-description" 
                      placeholder="Limited time offer on all custom branded merchandise..."
                      data-testid="textarea-page-description"
                    />
                  </div>

                  <div>
                    <Label htmlFor="page-url">URL Slug</Label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 text-sm text-muted-foreground bg-muted border border-r-0 border-input rounded-l-md">
                        swagsuite.com/
                      </span>
                      <Input 
                        id="page-url" 
                        placeholder="holiday-special" 
                        className="rounded-l-none"
                        data-testid="input-page-url"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="page-template">Template</Label>
                    <Select>
                      <SelectTrigger data-testid="select-page-template">
                        <SelectValue placeholder="Choose a template" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="promotion">Promotion Page</SelectItem>
                        <SelectItem value="product">Product Showcase</SelectItem>
                        <SelectItem value="event">Event Registration</SelectItem>
                        <SelectItem value="custom">Custom Design</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowCreateLanding(false)}>
                      Cancel
                    </Button>
                    <Button data-testid="button-save-landing">Create Page</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {landingPages.map((page) => (
              <Card key={page.id} data-testid={`card-landing-${page.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-lg" data-testid={`text-landing-name-${page.id}`}>
                          {page.name}
                        </h4>
                        <Badge className={getStatusColor(page.isPublished)}>
                          {page.isPublished ? "Published" : "Draft"}
                        </Badge>
                      </div>
                      
                      <p className="text-muted-foreground mb-3" data-testid={`text-landing-title-${page.id}`}>
                        {page.title}
                      </p>

                      <div className="flex items-center gap-2 mb-4">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <a 
                          href={page.url} 
                          className="text-sm text-blue-600 hover:underline" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          data-testid={`link-landing-url-${page.id}`}
                        >
                          {page.url}
                        </a>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => copyToClipboard(page.url)}
                          data-testid={`button-copy-url-${page.id}`}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Views:</span>
                          <div className="font-medium" data-testid={`text-landing-views-${page.id}`}>
                            {page.views.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Conversions:</span>
                          <div className="font-medium" data-testid={`text-landing-conversions-${page.id}`}>
                            {page.conversions.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Conversion Rate:</span>
                          <div className="font-medium" data-testid={`text-landing-rate-${page.id}`}>
                            {page.conversionRate}%
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setPreviewType("landing");
                          setShowPreview(true);
                        }}
                        data-testid={`button-preview-landing-${page.id}`}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" data-testid={`button-edit-landing-${page.id}`}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" data-testid={`button-share-landing-${page.id}`}>
                        <Share className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" data-testid={`button-analytics-landing-${page.id}`}>
                        <BarChart3 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="surveys">
          <Card data-testid="card-surveys-placeholder">
            <CardHeader>
              <CardTitle>Surveys & Polls</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Survey builder coming soon</h3>
                <p className="text-muted-foreground">Create engaging surveys and polls to gather customer feedback</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              {previewType === "form" ? "Form Preview" : "Landing Page Preview"}
            </DialogTitle>
          </DialogHeader>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-8">
            {previewType === "form" ? (
              <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
                <h3 className="text-xl font-bold mb-2">Stay Updated with SwagSuite</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Get the latest promotional product trends and exclusive offers
                </p>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="preview-email">Email Address *</Label>
                    <Input id="preview-email" type="email" placeholder="your@email.com" />
                  </div>
                  <div>
                    <Label htmlFor="preview-name">First Name</Label>
                    <Input id="preview-name" placeholder="Your first name" />
                  </div>
                  <Button className="w-full">Subscribe Now</Button>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  We respect your privacy. Unsubscribe at any time.
                </p>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg p-8 text-center">
                  <h1 className="text-4xl font-bold mb-4">Holiday Special - 40% Off Custom Apparel</h1>
                  <p className="text-xl mb-6">Limited time offer on all custom branded merchandise</p>
                  <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                    Shop Now
                  </Button>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-b-lg p-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Layout className="w-8 h-8 text-blue-600" />
                      </div>
                      <h3 className="font-semibold mb-2">Custom Design</h3>
                      <p className="text-sm text-gray-600">Professional design services included</p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <TrendingUp className="w-8 h-8 text-green-600" />
                      </div>
                      <h3 className="font-semibold mb-2">Fast Turnaround</h3>
                      <p className="text-sm text-gray-600">Quick production and shipping</p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-purple-600" />
                      </div>
                      <h3 className="font-semibold mb-2">Bulk Discounts</h3>
                      <p className="text-sm text-gray-600">Save more on larger orders</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}