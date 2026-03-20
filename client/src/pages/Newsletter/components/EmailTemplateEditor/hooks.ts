import { useState } from "react";
import type { EmailTemplate, EditorElement } from "./types";

export function useEmailTemplateEditor() {
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

  return {
    activeTemplate,
    setActiveTemplate,
    elements,
    showPreview,
    setShowPreview,
    selectedElement,
    setSelectedElement,
    mockTemplates,
    addElement,
    updateElement,
    removeElement,
    getCategoryColor,
  };
}
