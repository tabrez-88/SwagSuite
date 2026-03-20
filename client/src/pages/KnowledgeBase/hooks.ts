import { useState } from "react";

interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  author: string;
  lastUpdated: string;
  views: number;
  rating: number;
  type: string;
}

interface Category {
  value: string;
  label: string;
}

interface NewArticle {
  title: string;
  content: string;
  category: string;
  tags: string;
}

export function useKnowledgeBase() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddArticleOpen, setIsAddArticleOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [newArticle, setNewArticle] = useState<NewArticle>({
    title: "",
    content: "",
    category: "",
    tags: "",
  });

  // Mock data for knowledge base articles
  const articles: Article[] = [
    {
      id: "1",
      title: "How to Process a Sales Order",
      content: "Step-by-step guide for processing sales orders from quote to delivery...",
      category: "Orders",
      tags: ["orders", "process", "workflow"],
      author: "System Admin",
      lastUpdated: "2024-01-15",
      views: 145,
      rating: 4.8,
      type: "article",
    },
    {
      id: "2",
      title: "Artwork Requirements and Guidelines",
      content: "Complete guide on artwork specifications, file formats, and quality requirements...",
      category: "Artwork",
      tags: ["artwork", "files", "specifications"],
      author: "Design Team",
      lastUpdated: "2024-01-12",
      views: 98,
      rating: 4.9,
      type: "article",
    },
    {
      id: "3",
      title: "Supplier Approval Process",
      content: "How to evaluate and approve new suppliers for your vendor network...",
      category: "Suppliers",
      tags: ["suppliers", "approval", "vendors"],
      author: "Purchasing Manager",
      lastUpdated: "2024-01-10",
      views: 67,
      rating: 4.6,
      type: "article",
    },
    {
      id: "4",
      title: "Customer Onboarding Video",
      content: "Video tutorial showing how to onboard new customers in the CRM system...",
      category: "CRM",
      tags: ["crm", "customers", "onboarding"],
      author: "Training Team",
      lastUpdated: "2024-01-08",
      views: 234,
      rating: 4.7,
      type: "video",
    },
    {
      id: "5",
      title: "Pricing Strategy Best Practices",
      content: "Guidelines for setting competitive pricing while maintaining healthy margins...",
      category: "Sales",
      tags: ["pricing", "strategy", "margins"],
      author: "Sales Director",
      lastUpdated: "2024-01-05",
      views: 189,
      rating: 4.9,
      type: "article",
    },
    {
      id: "6",
      title: "Quality Control Checklist",
      content: "Comprehensive checklist for ensuring product quality before shipment...",
      category: "Quality",
      tags: ["quality", "checklist", "production"],
      author: "QC Manager",
      lastUpdated: "2024-01-03",
      views: 112,
      rating: 4.5,
      type: "article",
    },
  ];

  const categories: Category[] = [
    { value: "all", label: "All Categories" },
    { value: "Orders", label: "Orders" },
    { value: "Artwork", label: "Artwork" },
    { value: "Suppliers", label: "Suppliers" },
    { value: "CRM", label: "CRM" },
    { value: "Sales", label: "Sales" },
    { value: "Quality", label: "Quality" },
    { value: "Reporting", label: "Reporting" },
  ];

  const recentQueries = [
    "How to handle rush orders?",
    "What are the payment terms for suppliers?",
    "How to upload artwork files?",
    "Customer approval process steps",
    "Setting up automatic notifications",
  ];

  const handleAISearch = () => {
    if (searchQuery.trim()) {
      alert(
        `AI Search: "${searchQuery}"\n\nThis would return intelligent search results from your knowledge base, order history, and system documentation.`
      );
    }
  };

  const handleAddArticle = () => {
    alert("Article would be added to knowledge base with proper categorization and indexing");
    setIsAddArticleOpen(false);
  };

  const filteredArticles = articles.filter((article) => {
    const matchesSearch =
      searchQuery === "" ||
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === "all" || article.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return "video" as const;
      case "article":
        return "article" as const;
      default:
        return "default" as const;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "video":
        return "bg-red-100 text-red-600";
      case "article":
        return "bg-blue-100 text-blue-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const avgRating = (articles.reduce((sum, a) => sum + a.rating, 0) / articles.length).toFixed(1);
  const videoCount = articles.filter((a) => a.type === "video").length;
  const categoryCount = categories.length - 1;

  return {
    searchQuery,
    setSearchQuery,
    isAddArticleOpen,
    setIsAddArticleOpen,
    selectedCategory,
    setSelectedCategory,
    newArticle,
    setNewArticle,
    articles,
    categories,
    recentQueries,
    filteredArticles,
    avgRating,
    videoCount,
    categoryCount,
    handleAISearch,
    handleAddArticle,
    getTypeIcon,
    getTypeColor,
  };
}
