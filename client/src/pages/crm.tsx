import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { UserPlus, Search, Building, Mail, Phone, Globe } from "lucide-react";
import type { Company } from "@shared/schema";

export default function CRM() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: "",
    email: "",
    phone: "",
    website: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    industry: "",
    notes: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: companies, isLoading } = useQuery({
    queryKey: ["/api/companies"],
  });

  const createCompanyMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/companies", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Company created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      setIsCreateModalOpen(false);
      setNewCompany({
        name: "",
        email: "",
        phone: "",
        website: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        industry: "",
        notes: "",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create company",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCompany.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Company name is required",
        variant: "destructive",
      });
      return;
    }

    createCompanyMutation.mutate(newCompany);
  };

  const filteredCompanies = companies?.filter((company: Company) =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.industry?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">CRM</h1>
            <p className="text-gray-600 mt-1">Manage your customers and relationships</p>
          </div>
          
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-swag-primary hover:bg-swag-primary/90">
                <UserPlus className="mr-2" size={20} />
                Add Company
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Company</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Company Name *</Label>
                    <Input
                      id="name"
                      value={newCompany.name}
                      onChange={(e) => setNewCompany(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter company name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newCompany.email}
                      onChange={(e) => setNewCompany(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="company@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={newCompany.phone}
                      onChange={(e) => setNewCompany(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={newCompany.website}
                      onChange={(e) => setNewCompany(prev => ({ ...prev, website: e.target.value }))}
                      placeholder="https://example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="industry">Industry</Label>
                    <Input
                      id="industry"
                      value={newCompany.industry}
                      onChange={(e) => setNewCompany(prev => ({ ...prev, industry: e.target.value }))}
                      placeholder="Technology, Healthcare, etc."
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={newCompany.city}
                      onChange={(e) => setNewCompany(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="City"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={newCompany.address}
                    onChange={(e) => setNewCompany(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Street address"
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={newCompany.notes}
                    onChange={(e) => setNewCompany(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes about this company"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-swag-primary hover:bg-swag-primary/90"
                    disabled={createCompanyMutation.isPending}
                  >
                    {createCompanyMutation.isPending ? "Creating..." : "Create Company"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Search companies..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Companies Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredCompanies.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Building className="mx-auto mb-4 text-gray-400" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? "No companies found" : "No companies yet"}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchQuery 
                  ? `No companies match "${searchQuery}"`
                  : "Start building your customer database by adding your first company"
                }
              </p>
              {!searchQuery && (
                <Button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-swag-primary hover:bg-swag-primary/90"
                >
                  <UserPlus className="mr-2" size={20} />
                  Add First Company
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompanies.map((company: Company) => (
              <Card key={company.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{company.name}</CardTitle>
                      {company.industry && (
                        <Badge variant="secondary" className="mt-1">
                          {company.industry}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {company.email && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail size={16} className="mr-2" />
                        {company.email}
                      </div>
                    )}
                    {company.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone size={16} className="mr-2" />
                        {company.phone}
                      </div>
                    )}
                    {company.website && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Globe size={16} className="mr-2" />
                        <a 
                          href={company.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-swag-primary hover:underline"
                        >
                          Website
                        </a>
                      </div>
                    )}
                    {(company.city || company.state) && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Building size={16} className="mr-2" />
                        {[company.city, company.state].filter(Boolean).join(", ")}
                      </div>
                    )}
                    <div className="pt-2 border-t">
                      <p className="text-sm text-gray-600">
                        YTD Spend: <span className="font-medium">${Number(company.ytdSpend || 0).toLocaleString()}</span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
