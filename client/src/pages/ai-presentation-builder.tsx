import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Presentation, 
  Plus, 
  Upload, 
  FileText, 
  Zap, 
  Download, 
  Eye,
  Edit3,
  Trash2,
  RefreshCw,
  ExternalLink,
  FileImage,
  FilePlus,
  Brain,
  Target,
  DollarSign,
  Package,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react";

type PresentationStatus = "draft" | "generating" | "completed" | "error";

interface PresentationData {
  id: string;
  title: string;
  description?: string;
  dealNotes?: string;
  hubspotDealId?: string;
  suggestedProducts: any[];
  slides: any[];
  status: PresentationStatus;
  createdAt: string;
  updatedAt: string;
}

interface SuggestedProduct {
  id: string;
  productName: string;
  suggestedPrice: number;
  suggestedQuantity: number;
  reasoning: string;
  isIncluded: boolean;
}

export default function AIPresentationBuilder() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isHubspotModalOpen, setIsHubspotModalOpen] = useState(false);
  const [selectedPresentation, setSelectedPresentation] = useState<PresentationData | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [newPresentation, setNewPresentation] = useState({
    title: "",
    description: "",
    dealNotes: ""
  });
  const [hubspotDealId, setHubspotDealId] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch presentations
  const { data: presentations = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/presentations'],
  });

  // Create presentation mutation
  const createPresentationMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/presentations', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "Presentation Created",
        description: "Your AI presentation is being generated with product suggestions.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/presentations'] });
      setIsCreateModalOpen(false);
      setNewPresentation({ title: "", description: "", dealNotes: "" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create presentation. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Import from HubSpot mutation
  const importHubspotMutation = useMutation({
    mutationFn: async (dealId: string) => {
      return apiRequest('/api/presentations/import-hubspot', {
        method: 'POST',
        body: JSON.stringify({ hubspotDealId: dealId })
      });
    },
    onSuccess: () => {
      toast({
        title: "HubSpot Import Started",
        description: "Deal notes are being imported and analyzed by AI.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/presentations'] });
      setIsHubspotModalOpen(false);
      setHubspotDealId("");
    },
    onError: () => {
      toast({
        title: "Import Failed",
        description: "Could not import from HubSpot. Check your deal ID and try again.",
        variant: "destructive"
      });
    }
  });

  // Generate presentation mutation
  const generatePresentationMutation = useMutation({
    mutationFn: async (presentationId: string) => {
      return apiRequest(`/api/presentations/${presentationId}/generate`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      toast({
        title: "Generation Started",
        description: "AI is analyzing your notes and suggesting products.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/presentations'] });
    }
  });

  // Delete presentation mutation
  const deletePresentationMutation = useMutation({
    mutationFn: async (presentationId: string) => {
      return apiRequest(`/api/presentations/${presentationId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      toast({
        title: "Presentation Deleted",
        description: "The presentation has been removed.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/presentations'] });
    }
  });

  const handleCreatePresentation = async () => {
    if (!newPresentation.title.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a title for your presentation.",
        variant: "destructive"
      });
      return;
    }

    const formData = new FormData();
    formData.append('title', newPresentation.title);
    formData.append('description', newPresentation.description);
    formData.append('dealNotes', newPresentation.dealNotes);
    
    uploadedFiles.forEach((file) => {
      formData.append('files', file);
    });

    try {
      const response = await fetch('/api/presentations', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) throw new Error('Failed to create presentation');
      
      toast({
        title: "Presentation Created",
        description: "Your AI presentation is being generated with product suggestions.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/presentations'] });
      setIsCreateModalOpen(false);
      setNewPresentation({ title: "", description: "", dealNotes: "" });
      setUploadedFiles([]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create presentation. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validTypes = ['.ai', '.eps', '.jpeg', '.jpg', '.png', '.pdf', '.psd', '.svg'];
    
    const validFiles = files.filter(file => {
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      return validTypes.includes(extension);
    });

    if (validFiles.length !== files.length) {
      toast({
        title: "Invalid Files",
        description: "Some files were skipped. Only AI, EPS, JPEG, PNG, PDF, PSD, and SVG files are supported.",
        variant: "destructive"
      });
    }

    setUploadedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getStatusIcon = (status: PresentationStatus) => {
    switch (status) {
      case "completed": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "generating": return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      case "error": return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: PresentationStatus) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "generating": return "bg-blue-100 text-blue-800";
      case "error": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Presentation className="mr-3 text-swag-primary" size={32} />
            AI Presentation Builder
          </h1>
          <p className="text-gray-600 mt-1">Create intelligent product presentations from deal notes with AI-powered suggestions</p>
        </div>
        
        <div className="flex gap-3">
          <Dialog open={isHubspotModalOpen} onOpenChange={setIsHubspotModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <ExternalLink className="mr-2" size={16} />
                Import from HubSpot
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Import HubSpot Deal</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="dealId">HubSpot Deal ID</Label>
                  <Input
                    id="dealId"
                    placeholder="Enter deal ID"
                    value={hubspotDealId}
                    onChange={(e) => setHubspotDealId(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Find the deal ID in your HubSpot deal URL
                  </p>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsHubspotModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => importHubspotMutation.mutate(hubspotDealId)}
                    disabled={!hubspotDealId.trim() || importHubspotMutation.isPending}
                    className="bg-swag-primary hover:bg-swag-primary/90"
                  >
                    {importHubspotMutation.isPending ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Import Deal
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-swag-primary hover:bg-swag-primary/90">
                <Plus className="mr-2" size={16} />
                Create Presentation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New AI Presentation</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="title">Presentation Title *</Label>
                    <Input
                      id="title"
                      placeholder="Q1 2024 Promotional Campaign"
                      value={newPresentation.title}
                      onChange={(e) => setNewPresentation(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      placeholder="Brief description of the presentation purpose"
                      value={newPresentation.description}
                      onChange={(e) => setNewPresentation(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="dealNotes">Deal Notes</Label>
                    <Textarea
                      id="dealNotes"
                      placeholder="Enter your deal notes here. Include information about quantities needed, budget range, preferred products, timeline, and any specific requirements..."
                      rows={6}
                      value={newPresentation.dealNotes}
                      onChange={(e) => setNewPresentation(prev => ({ ...prev, dealNotes: e.target.value }))}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      AI will analyze these notes to suggest relevant products with pricing and quantities
                    </p>
                  </div>
                </div>

                {/* File Upload Section */}
                <div className="border-t pt-4">
                  <Label>Supporting Files</Label>
                  <div className="mt-2">
                    <div 
                      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600 mb-1">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        AI, EPS, JPEG, PNG, PDF, PSD, SVG files up to 10MB each
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".ai,.eps,.jpeg,.jpg,.png,.pdf,.psd,.svg"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>

                  {/* Uploaded Files List */}
                  {uploadedFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <Label className="text-sm font-medium">Uploaded Files:</Label>
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center">
                            <FileImage className="h-4 w-4 text-gray-500 mr-2" />
                            <span className="text-sm font-medium">{file.name}</span>
                            <span className="text-xs text-gray-500 ml-2">({formatFileSize(file.size)})</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => {
                    setIsCreateModalOpen(false);
                    setNewPresentation({ title: "", description: "", dealNotes: "" });
                    setUploadedFiles([]);
                  }}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreatePresentation}
                    disabled={createPresentationMutation.isPending}
                    className="bg-swag-primary hover:bg-swag-primary/90"
                  >
                    {createPresentationMutation.isPending ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Brain className="mr-2 h-4 w-4" />}
                    Create & Analyze
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Presentation className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Presentations</p>
                <p className="text-2xl font-bold text-gray-900">{presentations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {presentations.filter((p: PresentationData) => p.status === 'completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <RefreshCw className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Generating</p>
                <p className="text-2xl font-bold text-gray-900">
                  {presentations.filter((p: PresentationData) => p.status === 'generating').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Products/Presentation</p>
                <p className="text-2xl font-bold text-gray-900">
                  {presentations.length > 0 
                    ? Math.round(presentations.reduce((acc: number, p: PresentationData) => 
                        acc + (p.suggestedProducts?.length || 0), 0) / presentations.length)
                    : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Presentations Grid/List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Your Presentations</h2>
          <div className="flex gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              Grid
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              List
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-16 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : presentations.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Presentation className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No presentations yet</h3>
              <p className="text-gray-600 text-center mb-6 max-w-md">
                Create your first AI-powered presentation to get intelligent product suggestions based on your deal notes.
              </p>
              <Button onClick={() => setIsCreateModalOpen(true)} className="bg-swag-primary hover:bg-swag-primary/90">
                <Plus className="mr-2" size={16} />
                Create Your First Presentation
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className={viewMode === "grid" 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
            : "space-y-4"
          }>
            {presentations.map((presentation: PresentationData) => (
              <Card key={presentation.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                        {presentation.title}
                      </CardTitle>
                      {presentation.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {presentation.description}
                        </p>
                      )}
                    </div>
                    <Badge className={getStatusColor(presentation.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(presentation.status)}
                        {presentation.status}
                      </div>
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {/* Progress for generating presentations */}
                    {presentation.status === "generating" && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Analyzing deal notes...</span>
                          <span>75%</span>
                        </div>
                        <Progress value={75} className="h-2" />
                      </div>
                    )}

                    {/* Product suggestions preview */}
                    {presentation.suggestedProducts && presentation.suggestedProducts.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Suggested Products</span>
                          <Badge variant="secondary">
                            {presentation.suggestedProducts.length} items
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {presentation.suggestedProducts.slice(0, 3).map((product: any, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {product.name || `Product ${index + 1}`}
                            </Badge>
                          ))}
                          {presentation.suggestedProducts.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{presentation.suggestedProducts.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Created {new Date(presentation.createdAt).toLocaleDateString()}</span>
                      {presentation.hubspotDealId && (
                        <span className="flex items-center">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          HubSpot
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex gap-2">
                        {presentation.status === "completed" && (
                          <>
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button size="sm" variant="outline">
                              <Download className="h-4 w-4 mr-1" />
                              Export
                            </Button>
                          </>
                        )}
                        {presentation.status === "draft" && (
                          <Button 
                            size="sm" 
                            onClick={() => generatePresentationMutation.mutate(presentation.id)}
                            disabled={generatePresentationMutation.isPending}
                            className="bg-swag-primary hover:bg-swag-primary/90"
                          >
                            <Zap className="h-4 w-4 mr-1" />
                            Generate
                          </Button>
                        )}
                      </div>
                      
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost">
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => deletePresentationMutation.mutate(presentation.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}