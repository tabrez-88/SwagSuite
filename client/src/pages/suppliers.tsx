import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
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
import { Truck, Search, Plus, Mail, Phone, Globe, AlertTriangle, Star } from "lucide-react";
import type { Supplier } from "@shared/schema";

export default function Suppliers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    name: "",
    email: "",
    phone: "",
    website: "",
    address: "",
    contactPerson: "",
    paymentTerms: "",
    notes: "",
    isPreferred: false,
    doNotOrder: false,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ["/api/suppliers"],
  });

  const createSupplierMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/suppliers", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Supplier created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      setIsCreateModalOpen(false);
      setNewSupplier({
        name: "",
        email: "",
        phone: "",
        website: "",
        address: "",
        contactPerson: "",
        paymentTerms: "",
        notes: "",
        isPreferred: false,
        doNotOrder: false,
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
        description: "Failed to create supplier",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newSupplier.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Supplier name is required",
        variant: "destructive",
      });
      return;
    }

    createSupplierMutation.mutate(newSupplier);
  };

  const filteredSuppliers = suppliers?.filter((supplier: Supplier) =>
    supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.contactPerson?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const preferredSuppliers = filteredSuppliers.filter((s: Supplier) => s.isPreferred);
  const doNotOrderSuppliers = filteredSuppliers.filter((s: Supplier) => s.doNotOrder);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Suppliers</h1>
            <p className="text-gray-600 mt-1">Manage your supplier relationships and vendor network</p>
          </div>
          
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-swag-primary hover:bg-swag-primary/90">
                <Plus className="mr-2" size={20} />
                Add Supplier
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Supplier</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Supplier Name *</Label>
                    <Input
                      id="name"
                      value={newSupplier.name}
                      onChange={(e) => setNewSupplier(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter supplier name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactPerson">Contact Person</Label>
                    <Input
                      id="contactPerson"
                      value={newSupplier.contactPerson}
                      onChange={(e) => setNewSupplier(prev => ({ ...prev, contactPerson: e.target.value }))}
                      placeholder="Primary contact name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newSupplier.email}
                      onChange={(e) => setNewSupplier(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="supplier@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={newSupplier.phone}
                      onChange={(e) => setNewSupplier(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={newSupplier.website}
                      onChange={(e) => setNewSupplier(prev => ({ ...prev, website: e.target.value }))}
                      placeholder="https://example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="paymentTerms">Payment Terms</Label>
                    <Input
                      id="paymentTerms"
                      value={newSupplier.paymentTerms}
                      onChange={(e) => setNewSupplier(prev => ({ ...prev, paymentTerms: e.target.value }))}
                      placeholder="Net 30, etc."
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={newSupplier.address}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Full address"
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={newSupplier.notes}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes about this supplier"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isPreferred"
                      checked={newSupplier.isPreferred}
                      onCheckedChange={(checked) => setNewSupplier(prev => ({ ...prev, isPreferred: checked }))}
                    />
                    <Label htmlFor="isPreferred">Preferred Supplier</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="doNotOrder"
                      checked={newSupplier.doNotOrder}
                      onCheckedChange={(checked) => setNewSupplier(prev => ({ ...prev, doNotOrder: checked }))}
                    />
                    <Label htmlFor="doNotOrder">Do Not Order From</Label>
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-swag-primary hover:bg-swag-primary/90"
                    disabled={createSupplierMutation.isPending}
                  >
                    {createSupplierMutation.isPending ? "Creating..." : "Create Supplier"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Supplier Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Truck className="text-blue-600" size={20} />
                <div>
                  <p className="text-sm text-gray-600">Total Suppliers</p>
                  <p className="text-xl font-bold">{suppliers?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Star className="text-yellow-600" size={20} />
                <div>
                  <p className="text-sm text-gray-600">Preferred</p>
                  <p className="text-xl font-bold">{preferredSuppliers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="text-red-600" size={20} />
                <div>
                  <p className="text-sm text-gray-600">Do Not Order</p>
                  <p className="text-xl font-bold">{doNotOrderSuppliers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Mail className="text-green-600" size={20} />
                <div>
                  <p className="text-sm text-gray-600">With Contact Info</p>
                  <p className="text-xl font-bold">
                    {suppliers?.filter((s: Supplier) => s.email || s.phone).length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Search suppliers..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Suppliers Grid */}
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
        ) : filteredSuppliers.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Truck className="mx-auto mb-4 text-gray-400" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? "No suppliers found" : "No suppliers yet"}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchQuery 
                  ? `No suppliers match "${searchQuery}"`
                  : "Start building your supplier network by adding your first supplier"
                }
              </p>
              {!searchQuery && (
                <Button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-swag-primary hover:bg-swag-primary/90"
                >
                  <Plus className="mr-2" size={20} />
                  Add First Supplier
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSuppliers.map((supplier: Supplier) => (
              <Card key={supplier.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{supplier.name}</CardTitle>
                      <div className="flex gap-2 mt-2">
                        {supplier.isPreferred && (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            <Star size={12} className="mr-1" />
                            Preferred
                          </Badge>
                        )}
                        {supplier.doNotOrder && (
                          <Badge variant="destructive">
                            <AlertTriangle size={12} className="mr-1" />
                            Do Not Order
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {supplier.contactPerson && (
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="font-medium mr-2">Contact:</span>
                        {supplier.contactPerson}
                      </div>
                    )}
                    {supplier.email && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail size={16} className="mr-2" />
                        {supplier.email}
                      </div>
                    )}
                    {supplier.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone size={16} className="mr-2" />
                        {supplier.phone}
                      </div>
                    )}
                    {supplier.website && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Globe size={16} className="mr-2" />
                        <a 
                          href={supplier.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-swag-primary hover:underline"
                        >
                          Website
                        </a>
                      </div>
                    )}
                    {supplier.paymentTerms && (
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="font-medium mr-2">Terms:</span>
                        {supplier.paymentTerms}
                      </div>
                    )}
                    {supplier.notes && (
                      <div className="pt-2 border-t">
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {supplier.notes}
                        </p>
                      </div>
                    )}
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
