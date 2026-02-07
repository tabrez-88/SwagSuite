import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Layout, 
  Plus, 
  Eye, 
  Save, 
  Copy, 
  Trash2,
  Edit,
  Image,
  Type,
  Square,
  Columns,
  AlignLeft,
  AlignCenter,
  Bold,
  Italic,
  Link,
  Palette
} from "lucide-react";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  previewText: string;
  htmlContent: string;
  thumbnailUrl: string;
  category: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface EditorElement {
  id: string;
  type: "text" | "image" | "button" | "divider" | "columns";
  content: {
    text?: string;
    imageUrl?: string;
    buttonText?: string;
    buttonUrl?: string;
    style?: any;
  };
}

export function EmailTemplateEditor() {
  const [activeTemplate, setActiveTemplate] = useState<EmailTemplate | null>(null);
  const [elements, setElements] = useState<EditorElement[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);

  // Mock templates
  const mockTemplates: EmailTemplate[] = [
    {
      id: "1",
      name: "Welcome Email",
      subject: "Welcome to SwagSuite!",
      previewText: "Get started with your new account",
      htmlContent: "<p>Welcome to our platform!</p>",
      thumbnailUrl: "/templates/welcome.png",
      category: "onboarding",
      isPublic: true,
      createdAt: new Date("2024-12-01"),
      updatedAt: new Date("2025-01-01")
    },
    {
      id: "2", 
      name: "Product Launch",
      subject: "Introducing Our Latest Product",
      previewText: "Check out what's new",
      htmlContent: "<p>We're excited to announce...</p>",
      thumbnailUrl: "/templates/product-launch.png",
      category: "promotional",
      isPublic: true,
      createdAt: new Date("2024-11-15"),
      updatedAt: new Date("2024-12-01")
    },
    {
      id: "3",
      name: "Newsletter Template",
      subject: "Weekly Updates",
      previewText: "Your weekly dose of industry news",
      htmlContent: "<p>This week in promotional products...</p>",
      thumbnailUrl: "/templates/newsletter.png",
      category: "newsletter",
      isPublic: false,
      createdAt: new Date("2024-10-20"),
      updatedAt: new Date("2024-12-15")
    }
  ];

  const addElement = (type: EditorElement["type"]) => {
    const newElement: EditorElement = {
      id: `element-${Date.now()}`,
      type,
      content: getDefaultContent(type)
    };
    setElements([...elements, newElement]);
  };

  const getDefaultContent = (type: EditorElement["type"]) => {
    switch (type) {
      case "text":
        return { text: "Your text content here..." };
      case "image":
        return { imageUrl: "", style: { width: "100%", maxWidth: "600px" } };
      case "button":
        return { buttonText: "Click Here", buttonUrl: "#", style: { backgroundColor: "#007bff", color: "#ffffff" } };
      case "divider":
        return { style: { height: "1px", backgroundColor: "#e0e0e0", margin: "20px 0" } };
      case "columns":
        return { style: { columns: 2 } };
      default:
        return {};
    }
  };

  const updateElement = (elementId: string, content: any) => {
    setElements(elements.map(el => 
      el.id === elementId ? { ...el, content: { ...el.content, ...content } } : el
    ));
  };

  const removeElement = (elementId: string) => {
    setElements(elements.filter(el => el.id !== elementId));
    setSelectedElement(null);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "onboarding": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "promotional": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "newsletter": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "transactional": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const renderElement = (element: EditorElement) => {
    const isSelected = selectedElement === element.id;
    const baseClasses = `relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
      isSelected ? "border-blue-500 bg-blue-50 dark:bg-blue-950" : "border-gray-200 hover:border-gray-300"
    }`;

    switch (element.type) {
      case "text":
        return (
          <div 
            key={element.id} 
            className={baseClasses}
            onClick={() => setSelectedElement(element.id)}
            data-testid={`element-text-${element.id}`}
          >
            <div className="prose max-w-none">
              <p>{element.content.text || "Text content"}</p>
            </div>
            {isSelected && (
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={(e) => {
                  e.stopPropagation();
                  removeElement(element.id);
                }}
                data-testid={`button-remove-${element.id}`}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        );
      
      case "image":
        return (
          <div 
            key={element.id} 
            className={baseClasses}
            onClick={() => setSelectedElement(element.id)}
            data-testid={`element-image-${element.id}`}
          >
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-8 text-center">
              <Image className="w-12 h-12 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">Image placeholder</p>
            </div>
            {isSelected && (
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={(e) => {
                  e.stopPropagation();
                  removeElement(element.id);
                }}
                data-testid={`button-remove-${element.id}`}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        );

      case "button":
        return (
          <div 
            key={element.id} 
            className={baseClasses}
            onClick={() => setSelectedElement(element.id)}
            data-testid={`element-button-${element.id}`}
          >
            <div className="text-center">
              <Button 
                className="pointer-events-none"
                style={{
                  backgroundColor: element.content.style?.backgroundColor || "#007bff",
                  color: element.content.style?.color || "#ffffff"
                }}
              >
                {element.content.buttonText || "Button"}
              </Button>
            </div>
            {isSelected && (
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={(e) => {
                  e.stopPropagation();
                  removeElement(element.id);
                }}
                data-testid={`button-remove-${element.id}`}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        );

      case "divider":
        return (
          <div 
            key={element.id} 
            className={baseClasses}
            onClick={() => setSelectedElement(element.id)}
            data-testid={`element-divider-${element.id}`}
          >
            <div 
              className="w-full"
              style={{
                height: element.content.style?.height || "1px",
                backgroundColor: element.content.style?.backgroundColor || "#e0e0e0"
              }}
            />
            {isSelected && (
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={(e) => {
                  e.stopPropagation();
                  removeElement(element.id);
                }}
                data-testid={`button-remove-${element.id}`}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="templates" className="space-y-6">
        <TabsList>
          <TabsTrigger value="templates" data-testid="tab-templates">Templates</TabsTrigger>
          <TabsTrigger value="editor" data-testid="tab-editor">Editor</TabsTrigger>
          <TabsTrigger value="gallery" data-testid="tab-gallery">Gallery</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Email Templates</h3>
            <Button data-testid="button-create-template">
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockTemplates.map((template) => (
              <Card key={template.id} data-testid={`card-template-${template.id}`}>
                <CardHeader className="p-0">
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-t-lg h-32 flex items-center justify-center">
                    <Layout className="w-8 h-8 text-gray-400" />
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium" data-testid={`text-template-name-${template.id}`}>
                      {template.name}
                    </h4>
                    <Badge className={getCategoryColor(template.category)}>
                      {template.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3" data-testid={`text-template-subject-${template.id}`}>
                    {template.subject}
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => setActiveTemplate(template)}
                      data-testid={`button-edit-template-${template.id}`}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" data-testid={`button-preview-template-${template.id}`}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" data-testid={`button-copy-template-${template.id}`}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="editor" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Elements Toolbar */}
            <Card data-testid="card-elements-toolbar">
              <CardHeader>
                <CardTitle className="text-base">Elements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => addElement("text")}
                  data-testid="button-add-text"
                >
                  <Type className="w-4 h-4 mr-2" />
                  Text Block
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => addElement("image")}
                  data-testid="button-add-image"
                >
                  <Image className="w-4 h-4 mr-2" />
                  Image
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => addElement("button")}
                  data-testid="button-add-button"
                >
                  <Square className="w-4 h-4 mr-2" />
                  Button
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => addElement("divider")}
                  data-testid="button-add-divider"
                >
                  <div className="w-4 h-4 mr-2 border-t border-gray-400" />
                  Divider
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => addElement("columns")}
                  data-testid="button-add-columns"
                >
                  <Columns className="w-4 h-4 mr-2" />
                  Columns
                </Button>
              </CardContent>
            </Card>

            {/* Canvas */}
            <div className="lg:col-span-2">
              <Card data-testid="card-email-canvas">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Email Canvas</CardTitle>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" data-testid="button-preview-email">
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </Button>
                      <Button size="sm" data-testid="button-save-template">
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 min-h-96 border-2 border-dashed border-gray-200 rounded-lg p-4">
                    {elements.length === 0 ? (
                      <div className="flex items-center justify-center h-64 text-center">
                        <div>
                          <Layout className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-600 mb-2">Start Building Your Email</h3>
                          <p className="text-gray-500">Drag elements from the toolbar to create your email template</p>
                        </div>
                      </div>
                    ) : (
                      elements.map(renderElement)
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Properties Panel */}
            <Card data-testid="card-properties-panel">
              <CardHeader>
                <CardTitle className="text-base">Properties</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedElement ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Editing: {elements.find(el => el.id === selectedElement)?.type} element
                    </p>
                    {/* Dynamic property controls based on element type would go here */}
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="element-text">Content</Label>
                        <Textarea 
                          id="element-text" 
                          placeholder="Element content..."
                          data-testid="input-element-content"
                        />
                      </div>
                      <div>
                        <Label htmlFor="element-style">Style</Label>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" data-testid="button-bold">
                            <Bold className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" data-testid="button-italic">
                            <Italic className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" data-testid="button-link">
                            <Link className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" data-testid="button-color">
                            <Palette className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Select an element to edit its properties
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="gallery">
          <Card data-testid="card-template-gallery">
            <CardHeader>
              <CardTitle>Template Gallery</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <Layout className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Professional template gallery coming soon</h3>
                <p className="text-muted-foreground">Browse and import professionally designed email templates</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}