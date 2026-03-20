import { useState } from "react";
import type { SignupForm, LandingPage } from "./types";

export function useFormsAndLanding() {
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
  };

  return {
    showCreateForm,
    setShowCreateForm,
    showCreateLanding,
    setShowCreateLanding,
    showPreview,
    setShowPreview,
    previewType,
    setPreviewType,
    signupForms,
    landingPages,
    getStatusColor,
    copyToClipboard,
  };
}
