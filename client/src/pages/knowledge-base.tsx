import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Brain, 
  Search, 
  Plus, 
  BookOpen, 
  FileText, 
  Video, 
  HelpCircle,
  Star,
  Clock,
  User
} from "lucide-react";

export default function KnowledgeBase() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddArticleOpen, setIsAddArticleOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [newArticle, setNewArticle] = useState({
    title: "",
    content: "",
    category: "",
    tags: "",
  });

  // Mock data for knowledge base articles
  const articles = [
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
      type: "article"
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
      type: "article"
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
      type: "article"
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
      type: "video"
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
      type: "article"
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
      type: "article"
    }
  ];

  const categories = [
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
    "Setting up automatic notifications"
  ];

  const handleAISearch = () => {
    if (searchQuery.trim()) {
      // This would integrate with AI search functionality
      alert(`AI Search: "${searchQuery}"\n\nThis would return intelligent search results from your knowledge base, order history, and system documentation.`);
    }
  };

  const handleAddArticle = () => {
    // This would add a new article to the knowledge base
    alert("Article would be added to knowledge base with proper categorization and indexing");
    setIsAddArticleOpen(false);
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = searchQuery === "" || 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === "all" || article.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video": return Video;
      case "article": return FileText;
      default: return BookOpen;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "video": return "bg-red-100 text-red-600";
      case "article": return "bg-blue-100 text-blue-600";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Brain className="mr-3 text-swag-primary" size={32} />
              Knowledge Base
            </h1>
            <p className="text-gray-600 mt-1">AI-powered search through company knowledge and documentation</p>
          </div>
          
          <Dialog open={isAddArticleOpen} onOpenChange={setIsAddArticleOpen}>
            <DialogTrigger asChild>
              <Button className="bg-swag-primary hover:bg-swag-primary/90">
                <Plus className="mr-2" size={20} />
                Add Article
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Knowledge Article</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newArticle.title}
                    onChange={(e) => setNewArticle(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Article title"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={newArticle.category} 
                    onValueChange={(value) => setNewArticle(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.slice(1).map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={newArticle.content}
                    onChange={(e) => setNewArticle(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Article content..."
                    rows={8}
                  />
                </div>
                <div>
                  <Label htmlFor="tags">Tags (comma separated)</Label>
                  <Input
                    id="tags"
                    value={newArticle.tags}
                    onChange={(e) => setNewArticle(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="tag1, tag2, tag3"
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsAddArticleOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAddArticle}
                    className="bg-swag-primary hover:bg-swag-primary/90"
                  >
                    Add Article
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* AI Search */}
        <Card className="border-swag-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <Input
                    placeholder="Ask me anything about your business... (e.g., 'How do I handle a customer complaint about late delivery?')"
                    className="pl-10 pr-20 py-3 text-lg"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAISearch()}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Badge className="bg-swag-secondary text-swag-dark">AI</Badge>
                  </div>
                </div>
              </div>
              <Button 
                onClick={handleAISearch}
                className="bg-swag-primary hover:bg-swag-primary/90"
              >
                <Brain className="mr-2" size={20} />
                Search
              </Button>
            </div>
            
            {/* Recent Queries */}
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">Recent queries:</p>
              <div className="flex flex-wrap gap-2">
                {recentQueries.map((query, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setSearchQuery(query)}
                    className="text-xs"
                  >
                    {query}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex items-center space-x-4">
          <Label htmlFor="category">Filter by category:</Label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Knowledge Base Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <BookOpen className="text-blue-600" size={20} />
                <div>
                  <p className="text-sm text-gray-600">Total Articles</p>
                  <p className="text-xl font-bold">{articles.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Video className="text-red-600" size={20} />
                <div>
                  <p className="text-sm text-gray-600">Video Tutorials</p>
                  <p className="text-xl font-bold">{articles.filter(a => a.type === 'video').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <HelpCircle className="text-green-600" size={20} />
                <div>
                  <p className="text-sm text-gray-600">Categories</p>
                  <p className="text-xl font-bold">{categories.length - 1}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Star className="text-yellow-600" size={20} />
                <div>
                  <p className="text-sm text-gray-600">Avg. Rating</p>
                  <p className="text-xl font-bold">
                    {(articles.reduce((sum, a) => sum + a.rating, 0) / articles.length).toFixed(1)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Articles */}
        {filteredArticles.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <BookOpen className="mx-auto mb-4 text-gray-400" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? "No articles found" : "No articles yet"}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchQuery 
                  ? `No articles match "${searchQuery}"`
                  : "Start building your knowledge base by adding your first article"
                }
              </p>
              {!searchQuery && (
                <Button 
                  onClick={() => setIsAddArticleOpen(true)}
                  className="bg-swag-primary hover:bg-swag-primary/90"
                >
                  <Plus className="mr-2" size={20} />
                  Add First Article
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article) => {
              const TypeIcon = getTypeIcon(article.type);
              return (
                <Card key={article.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getTypeColor(article.type)}`}>
                            <TypeIcon size={16} />
                          </div>
                          <Badge variant="outline">{article.category}</Badge>
                        </div>
                        <CardTitle className="text-lg line-clamp-2">{article.title}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {article.content}
                      </p>
                      
                      <div className="flex flex-wrap gap-1">
                        {article.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center space-x-2">
                          <User size={12} />
                          <span>{article.author}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock size={12} />
                          <span>{new Date(article.lastUpdated).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                        <div className="flex items-center space-x-1">
                          <Star size={12} className="text-yellow-500" />
                          <span>{article.rating.toFixed(1)}</span>
                        </div>
                        <span>{article.views} views</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
    </div>
  );
}
