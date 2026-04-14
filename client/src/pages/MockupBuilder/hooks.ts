import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  useMockupTemplates,
  searchMockupProducts,
  downloadMockups,
  emailMockups,
  generateAiTemplates,
} from "@/services/mockup-builder";
import { useMutation } from "@tanstack/react-query";
import type { Product, Logo, Template } from "./types";

export function useMockupBuilder() {
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
  const { data: apiTemplates = [] } = useMockupTemplates<Template[]>();

  // Search products from API
  const searchProducts = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);

    try {
      const products = (await searchMockupProducts(query)) as Product[];
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
    mutationFn: () =>
      downloadMockups({
        mockupData: { product: selectedProduct, logos, template: selectedTemplate },
      }),
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
    mutationFn: (emailData: { recipients: string[]; subject?: string; message?: string }) =>
      emailMockups({
        mockupData: { product: selectedProduct, logos, template: selectedTemplate },
        emailData,
      }),
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
    mutationFn: (customerInfo?: { name: string; industry?: string }) =>
      generateAiTemplates({ customerInfo }),
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

  return {
    // State
    productQuery,
    setProductQuery,
    selectedProduct,
    logos,
    selectedLogo,
    setSelectedLogo,
    selectedTemplate,
    setSelectedTemplate,
    isSearching,
    searchResults,
    colorMode,
    setColorMode,
    colorValue,
    setColorValue,
    pmsValue,
    setPmsValue,

    // Refs
    logoFileRef,
    canvasRef,

    // Data
    apiTemplates,

    // Handlers
    searchProducts,
    selectProduct,
    handleLogoUpload,
    updateLogo,
    removeLogo,
    applyColorToLogo,
    removeBackground,

    // Mutations
    downloadMutation,
    emailMutation,
    generateAITemplatesMutation,
  };
}
