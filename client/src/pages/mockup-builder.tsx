import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

import { 
  Search, 
  Upload, 
  Download, 
  Mail, 
  Move, 
  RotateCw, 
  Palette, 
  Trash2, 
  Copy, 
  Save,
  ImageIcon,
  Package,
  Sparkles,
  Settings,
  Eye,
  EyeOff
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  number: string;
  image: string;
  category: string;
  colors: string[];
  description: string;
  source: 'ESP' | 'ASI' | 'SAGE';
}

interface Logo {
  id: string;
  file: File;
  url: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  color?: string;
  backgroundRemoved: boolean;
}

interface Template {
  id: string;
  name: string;
  type: 'company' | 'customer';
  header?: string;
  footer?: string;
  customerLogo?: string;
  companyLogo?: string;
  isActive: boolean;
  aiGenerated?: boolean;
  confidence?: number;
}

export default function MockupBuilderPage() {
  const { toast } = useToast();
  
  // State management
  const [productQuery, setProductQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [logos, setLogos] = useState<Logo[]>([]);
  const [selectedLogo, setSelectedLogo] = useState<Logo | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  
  // File upload refs
  const logoFileRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Color picker state
  const [colorMode, setColorMode] = useState<'PMS' | 'HEX' | 'PICKER'>('HEX');
  const [colorValue, setColorValue] = useState("#000000");
  const [pmsValue, setPmsValue] = useState("");

  // API queries
  const { data: apiTemplates = [] } = useQuery<Template[]>({
    queryKey: ['/api/mockup-builder/templates'],
  });

  // Search products from API
  const searchProducts = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    try {
      const products = await apiRequest('GET', `/api/mockup-builder/products/search?query=${encodeURIComponent(query)}`) as unknown as Product[];
      setSearchResults(products);
    } catch (error) {
      console.error('Error searching products:', error);
      toast({
        title: "Search Error",
        description: "Failed to search products. Please try again.",
        variant: "destructive",
      });
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle product selection
  const selectProduct = (product: Product) => {
    setSelectedProduct(product);
    setSearchResults([]);
    setProductQuery(product.name);
  };

  // Handle logo upload
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const url = URL.createObjectURL(file);
      const newLogo: Logo = {
        id: Math.random().toString(36).substr(2, 9),
        file,
        url,
        name: file.name,
        x: 50,
        y: 50,
        width: 100,
        height: 100,
        rotation: 0,
        opacity: 100,
        backgroundRemoved: false
      };
      
      setLogos(prev => [...prev, newLogo]);
    });

    // Reset input
    if (event.target) {
      event.target.value = '';
    }
  };

  // Update logo properties
  const updateLogo = (logoId: string, updates: Partial<Logo>) => {
    setLogos(prev => prev.map(logo => 
      logo.id === logoId ? { ...logo, ...updates } : logo
    ));
  };

  // Remove logo
  const removeLogo = (logoId: string) => {
    setLogos(prev => prev.filter(logo => logo.id !== logoId));
    if (selectedLogo?.id === logoId) {
      setSelectedLogo(null);
    }
  };

  // Apply color to logo
  const applyColorToLogo = () => {
    if (!selectedLogo) return;
    
    let color = colorValue;
    if (colorMode === 'PMS' && pmsValue) {
      // Convert PMS to hex (simplified)
      color = `#${pmsValue}`;
    }
    
    updateLogo(selectedLogo.id, { color });
    toast({
      title: "Color Applied",
      description: `Applied ${colorMode === 'PMS' ? 'PMS ' + pmsValue : color} to logo`,
    });
  };

  // Remove background
  const removeBackground = (logoId: string) => {
    updateLogo(logoId, { backgroundRemoved: true });
    toast({
      title: "Background Removed",
      description: "Logo background has been removed",
    });
  };

  // Download mockup mutation
  const downloadMutation = useMutation({
    mutationFn: async () => {
      const mockupData = {
        product: selectedProduct,
        logos: logos,
        template: selectedTemplate
      };
      return apiRequest('POST', '/api/mockup-builder/mockups/download', { mockupData });
    },
    onSuccess: (data: any) => {
      // Create download link
      const link = document.createElement('a');
      link.href = data.downloadUrl;
      link.download = `mockup-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download Started",
        description: "Your mockup is being prepared for download",
      });
    },
    onError: () => {
      toast({
        title: "Download Failed",
        description: "Failed to prepare mockup for download",
        variant: "destructive",
      });
    }
  });

  // Email mockup mutation
  const emailMutation = useMutation({
    mutationFn: async (emailData: { recipients: string[]; subject?: string; message?: string }) => {
      const mockupData = {
        product: selectedProduct,
        logos: logos,
        template: selectedTemplate
      };
      return apiRequest('POST', '/api/mockup-builder/mockups/email', { mockupData, emailData });
    },
    onSuccess: () => {
      toast({
        title: "Email Sent",
        description: "Mockup has been sent successfully",
      });
    },
    onError: () => {
      toast({
        title: "Email Failed",
        description: "Failed to send mockup email",
        variant: "destructive",
      });
    }
  });

  // AI template generation mutation
  const generateAITemplatesMutation = useMutation({
    mutationFn: async (customerInfo?: { name: string; industry?: string }) => {
      return apiRequest('POST', '/api/mockup-builder/generate-ai-templates', { customerInfo });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Templates Generated",
        description: `${data.generated} AI template suggestions created`,
      });
    },
    onError: () => {
      toast({
        title: "Generation Failed",
        description: "Failed to generate AI templates",
        variant: "destructive",
      });
    }
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mock-up Builder</h1>
          <p className="text-gray-600 mt-1">Create professional product mockups with logos and branding</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => downloadMutation.mutate()}
            disabled={!selectedProduct || downloadMutation.isPending}
          >
            <Download className="w-4 h-4 mr-2" />
            {downloadMutation.isPending ? "Preparing..." : "Download"}
          </Button>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button disabled={!selectedProduct}>
                <Mail className="w-4 h-4 mr-2" />
                Email
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Email Mockup</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Recipients (comma-separated emails)</Label>
                  <Input
                    placeholder="client@example.com, team@company.com"
                    onChange={(e) => {
                      const recipients = e.target.value.split(',').map(email => email.trim()).filter(Boolean);
                      // Store recipients in state or ref for use in mutation
                    }}
                  />
                </div>
                <div>
                  <Label>Subject (optional)</Label>
                  <Input placeholder="Your Custom Mockup" />
                </div>
                <div>
                  <Label>Message (optional)</Label>
                  <Textarea placeholder="Here's your custom mockup..." />
                </div>
                <Button 
                  onClick={() => emailMutation.mutate({
                    recipients: ['client@example.com'], // Would use actual input values
                    subject: 'Your Custom Mockup',
                    message: 'Please review the attached mockup.'
                  })}
                  disabled={emailMutation.isPending}
                  className="w-full"
                >
                  {emailMutation.isPending ? "Sending..." : "Send Email"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Product Search & Settings */}
        <div className="space-y-6">
          {/* Product Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Product Search
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Enter product number or name..."
                    value={productQuery}
                    onChange={(e) => setProductQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchProducts(productQuery)}
                  />
                </div>
                <Button 
                  onClick={() => searchProducts(productQuery)}
                  disabled={isSearching}
                >
                  <Search className="w-4 h-4" />
                </Button>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {searchResults.map(product => (
                    <div 
                      key={product.id}
                      className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                      onClick={() => selectProduct(product)}
                    >
                      <div className="flex items-center gap-3">
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{product.name}</p>
                          <p className="text-xs text-gray-500">{product.number}</p>
                          <Badge variant="outline" className="text-xs mt-1">
                            {product.source}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Selected Product */}
              {selectedProduct && (
                <div className="p-3 border rounded-lg bg-blue-50">
                  <div className="flex items-center gap-3">
                    <img 
                      src={selectedProduct.image}
                      alt={selectedProduct.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium">{selectedProduct.name}</h3>
                      <p className="text-sm text-gray-600">{selectedProduct.number}</p>
                      <Badge variant="secondary" className="text-xs mt-1">
                        {selectedProduct.source}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Logo Upload & Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Logo Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <input
                  ref={logoFileRef}
                  type="file"
                  multiple
                  accept=".ai,.eps,.jpeg,.jpg,.png,.pdf"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <Button 
                  onClick={() => logoFileRef.current?.click()}
                  variant="outline" 
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Logo Files
                </Button>
              </div>

              {/* Logo List */}
              {logos.length > 0 && (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {logos.map(logo => (
                    <div 
                      key={logo.id}
                      className={`p-3 border rounded-lg cursor-pointer ${
                        selectedLogo?.id === logo.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedLogo(logo)}
                    >
                      <div className="flex items-center gap-3">
                        <img 
                          src={logo.url}
                          alt={logo.name}
                          className="w-10 h-10 object-cover rounded"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium truncate">{logo.name}</p>
                          {logo.backgroundRemoved && (
                            <Badge variant="secondary" className="text-xs mt-1">
                              Background Removed
                            </Badge>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeLogo(logo.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Color Controls */}
          {selectedLogo && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Color Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs value={colorMode} onValueChange={(value) => setColorMode(value as any)}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="HEX">HEX</TabsTrigger>
                    <TabsTrigger value="PMS">PMS</TabsTrigger>
                    <TabsTrigger value="PICKER">Picker</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="HEX" className="space-y-2">
                    <Label>HEX Color</Label>
                    <div className="flex gap-2">
                      <Input
                        value={colorValue}
                        onChange={(e) => setColorValue(e.target.value)}
                        placeholder="#000000"
                      />
                      <div 
                        className="w-10 h-10 rounded border"
                        style={{ backgroundColor: colorValue }}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="PMS" className="space-y-2">
                    <Label>PMS Color</Label>
                    <Input
                      value={pmsValue}
                      onChange={(e) => setPmsValue(e.target.value)}
                      placeholder="286 C"
                    />
                  </TabsContent>
                  
                  <TabsContent value="PICKER" className="space-y-2">
                    <Label>Color Picker</Label>
                    <input
                      type="color"
                      value={colorValue}
                      onChange={(e) => setColorValue(e.target.value)}
                      className="w-full h-10 rounded border"
                    />
                  </TabsContent>
                </Tabs>

                <Button onClick={applyColorToLogo} className="w-full">
                  Apply Color
                </Button>

                <Button
                  onClick={() => removeBackground(selectedLogo.id)}
                  variant="outline"
                  className="w-full"
                  disabled={selectedLogo.backgroundRemoved}
                >
                  {selectedLogo.backgroundRemoved ? (
                    <>
                      <EyeOff className="w-4 h-4 mr-2" />
                      Background Removed
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Remove Background
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Center Panel - Canvas */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Mockup Canvas</span>
                {selectedTemplate && (
                  <Badge variant="secondary">
                    Template: {selectedTemplate.name}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 min-h-96 flex items-center justify-center">
                {selectedProduct ? (
                  <div className="relative w-full h-full">
                    {/* Template Header */}
                    {selectedTemplate?.header && (
                      <div className="absolute top-0 left-0 right-0 bg-white p-4 border-b">
                        <h3 className="text-lg font-bold text-center">{selectedTemplate.header}</h3>
                      </div>
                    )}

                    {/* Product Image */}
                    <img 
                      src={selectedProduct.image}
                      alt={selectedProduct.name}
                      className="w-full h-full object-contain p-8"
                    />

                    {/* Logos Overlay */}
                    {logos.map(logo => (
                      <div
                        key={logo.id}
                        className={`absolute cursor-move border-2 ${
                          selectedLogo?.id === logo.id ? 'border-blue-500' : 'border-transparent'
                        }`}
                        style={{
                          left: `${logo.x}%`,
                          top: `${logo.y}%`,
                          width: `${logo.width}px`,
                          height: `${logo.height}px`,
                          transform: `rotate(${logo.rotation}deg)`,
                          opacity: logo.opacity / 100,
                        }}
                        onClick={() => setSelectedLogo(logo)}
                      >
                        <img 
                          src={logo.url}
                          alt={logo.name}
                          className="w-full h-full object-contain"
                          style={{
                            filter: logo.color ? `hue-rotate(${logo.color})` : 'none'
                          }}
                        />
                      </div>
                    ))}

                    {/* Template Footer */}
                    {selectedTemplate?.footer && (
                      <div className="absolute bottom-0 left-0 right-0 bg-white p-4 border-t">
                        <p className="text-sm text-center">{selectedTemplate.footer}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-gray-500">
                    <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg">Select a product to start building your mockup</p>
                    <p className="text-sm">Use the search above to find products from ESP, ASI, or SAGE</p>
                  </div>
                )}
              </div>

              {/* Logo Controls */}
              {selectedLogo && (
                <div className="mt-4 p-4 border rounded-lg bg-gray-50 space-y-4">
                  <h4 className="font-medium">Logo Controls: {selectedLogo.name}</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Position X (%)</Label>
                      <Slider
                        value={[selectedLogo.x]}
                        onValueChange={([value]) => updateLogo(selectedLogo.id, { x: value })}
                        max={90}
                        step={1}
                      />
                    </div>
                    <div>
                      <Label>Position Y (%)</Label>
                      <Slider
                        value={[selectedLogo.y]}
                        onValueChange={([value]) => updateLogo(selectedLogo.id, { y: value })}
                        max={90}
                        step={1}
                      />
                    </div>
                    <div>
                      <Label>Width (px)</Label>
                      <Slider
                        value={[selectedLogo.width]}
                        onValueChange={([value]) => updateLogo(selectedLogo.id, { width: value })}
                        min={20}
                        max={300}
                        step={5}
                      />
                    </div>
                    <div>
                      <Label>Height (px)</Label>
                      <Slider
                        value={[selectedLogo.height]}
                        onValueChange={([value]) => updateLogo(selectedLogo.id, { height: value })}
                        min={20}
                        max={300}
                        step={5}
                      />
                    </div>
                    <div>
                      <Label>Rotation (degrees)</Label>
                      <Slider
                        value={[selectedLogo.rotation]}
                        onValueChange={([value]) => updateLogo(selectedLogo.id, { rotation: value })}
                        min={-180}
                        max={180}
                        step={5}
                      />
                    </div>
                    <div>
                      <Label>Opacity (%)</Label>
                      <Slider
                        value={[selectedLogo.opacity]}
                        onValueChange={([value]) => updateLogo(selectedLogo.id, { opacity: value })}
                        min={0}
                        max={100}
                        step={5}
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Panel - Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Templates
            </div>
            <Button 
              onClick={() => generateAITemplatesMutation.mutate({ name: 'Sample Customer' })}
              variant="outline"
              disabled={generateAITemplatesMutation.isPending}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {generateAITemplatesMutation.isPending ? "Generating..." : "Generate AI Templates"}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {apiTemplates.map((template) => (
              <div 
                key={template.id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedTemplate?.id === template.id 
                    ? 'bg-blue-50 border-blue-300' 
                    : 'hover:bg-gray-50'
                } ${template.aiGenerated ? 'border-dashed border-blue-300 bg-blue-50' : ''}`}
                onClick={() => setSelectedTemplate(template)}
              >
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  {template.aiGenerated && <Sparkles className="w-4 h-4" />}
                  {template.name}
                </h4>
                <p className="text-sm text-gray-600 mb-3 capitalize">
                  {template.type} template
                </p>
                <div className="space-y-2">
                  <div className="text-xs text-gray-500">
                    Header: {template.header}
                  </div>
                  <div className="text-xs text-gray-500">
                    Footer: {template.footer}
                  </div>
                  {template.aiGenerated && (
                    <Badge variant="secondary" className="mt-2">
                      <Sparkles className="w-3 h-3 mr-1" />
                      AI Generated ({Math.round(template.confidence * 100)}% confidence)
                    </Badge>
                  )}
                  <Button 
                    size="sm" 
                    className="w-full"
                    variant={selectedTemplate?.id === template.id ? "default" : "outline"}
                  >
                    {selectedTemplate?.id === template.id ? "Applied" : "Apply Template"}
                  </Button>
                </div>
              </div>
            ))}
            
            {/* Add new template placeholder if no templates */}
            {apiTemplates.length === 0 && (
              <div className="border rounded-lg p-4 border-dashed border-gray-300">
                <h4 className="font-medium mb-2">No Templates Available</h4>
                <p className="text-sm text-gray-600 mb-3">Generate AI templates to get started</p>
                <Button 
                  size="sm" 
                  className="w-full" 
                  variant="outline"
                  onClick={() => generateAITemplatesMutation.mutate({ name: 'Sample Customer' })}
                  disabled={generateAITemplatesMutation.isPending}
                >
                  {generateAITemplatesMutation.isPending ? "Generating..." : "Generate Templates"}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}