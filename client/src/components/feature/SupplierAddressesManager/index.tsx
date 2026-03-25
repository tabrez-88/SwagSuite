import { useState } from "react";
import {
  MapPin,
  Plus,
  Edit,
  Trash2,
  Star,
  Building,
  Truck,
  AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";

import {
  useSupplierAddresses,
  useCreateSupplierAddress,
  useUpdateSupplierAddress,
  useDeleteSupplierAddress,
  type SupplierAddress,
  type CreateSupplierAddress,
} from "@/services/supplier-addresses";

interface SupplierAddressesManagerProps {
  supplierId: string;
  supplierName: string;
}

const ADDRESS_TYPE_CONFIG = {
  billing: { label: "Billing", icon: Building, color: "bg-blue-100 text-blue-800" },
  shipping: { label: "Shipping", icon: Truck, color: "bg-green-100 text-green-800" },
  both: { label: "Billing & Shipping", icon: MapPin, color: "bg-purple-100 text-purple-800" },
};

const emptyForm: CreateSupplierAddress = {
  addressName: "",
  companyNameOnDocs: "",
  street: "",
  street2: "",
  city: "",
  state: "",
  zipCode: "",
  country: "US",
  addressType: "both",
  isDefault: false,
};

export function SupplierAddressesManager({ supplierId, supplierName }: SupplierAddressesManagerProps) {
  const { data: addresses = [], isLoading } = useSupplierAddresses(supplierId);
  const createMutation = useCreateSupplierAddress(supplierId);
  const updateMutation = useUpdateSupplierAddress(supplierId);
  const deleteMutation = useDeleteSupplierAddress(supplierId);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SupplierAddress | null>(null);
  const [formData, setFormData] = useState<CreateSupplierAddress>(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openCreate = () => {
    setEditingAddress(null);
    setFormData(emptyForm);
    setIsDialogOpen(true);
  };

  const openEdit = (address: SupplierAddress) => {
    setEditingAddress(address);
    setFormData({
      addressName: address.addressName || "",
      companyNameOnDocs: address.companyNameOnDocs || "",
      street: address.street || "",
      street2: address.street2 || "",
      city: address.city || "",
      state: address.state || "",
      zipCode: address.zipCode || "",
      country: address.country || "US",
      addressType: address.addressType,
      isDefault: address.isDefault || false,
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (editingAddress) {
      updateMutation.mutate(
        { addressId: editingAddress.id, data: formData },
        { onSuccess: () => setIsDialogOpen(false) }
      );
    } else {
      createMutation.mutate(formData, {
        onSuccess: () => setIsDialogOpen(false),
      });
    }
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, {
        onSuccess: () => setDeleteId(null),
      });
    }
  };

  const updateField = (field: keyof CreateSupplierAddress, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const formatAddress = (addr: SupplierAddress) => {
    return [addr.street, addr.street2, addr.city, addr.state, addr.zipCode, addr.country]
      .filter(Boolean)
      .join(", ");
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Addresses
          </CardTitle>
          <Button variant="outline" size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" />
            Add Address
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {addresses.length === 0 ? (
            <p className="text-sm text-muted-foreground italic text-center py-4">
              No addresses yet. Click "Add Address" to add one.
            </p>
          ) : (
            addresses.map((address) => {
              const typeConfig = ADDRESS_TYPE_CONFIG[address.addressType] || ADDRESS_TYPE_CONFIG.both;
              const TypeIcon = typeConfig.icon;
              return (
                <div
                  key={address.id}
                  className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="mt-0.5">
                      <TypeIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {address.addressName || "Unnamed"}
                        </span>
                        <Badge className={`text-xs ${typeConfig.color}`}>
                          {typeConfig.label}
                        </Badge>
                        {address.isDefault && (
                          <Badge variant="outline" className="text-xs">
                            <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                            Default
                          </Badge>
                        )}
                      </div>
                      {address.companyNameOnDocs && (
                        <p className="text-xs text-muted-foreground mb-0.5">
                          On docs: {address.companyNameOnDocs}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground truncate">
                        {formatAddress(address) || "No address details"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => openEdit(address)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => setDeleteId(address.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>
              {editingAddress ? "Edit Address" : "Add Address"}
            </DialogTitle>
            <DialogDescription>
              {editingAddress
                ? "Update this address for " + supplierName
                : "Add a new address for " + supplierName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Address Label</label>
                <Input
                  placeholder="e.g., Main Warehouse, East Coast"
                  value={formData.addressName || ""}
                  onChange={(e) => updateField("addressName", e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Address Type</label>
                <Select
                  value={formData.addressType}
                  onValueChange={(v) => updateField("addressType", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">Billing & Shipping</SelectItem>
                    <SelectItem value="billing">Billing Only</SelectItem>
                    <SelectItem value="shipping">Shipping Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Vendor Name on Documents</label>
              <Input
                placeholder={supplierName + " (leave blank to use vendor name)"}
                value={formData.companyNameOnDocs || ""}
                onChange={(e) => updateField("companyNameOnDocs", e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Override the vendor name that appears on POs and other external documents for this address
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">Street Address</label>
              <AddressAutocomplete
                value={formData.street || ""}
                onChange={(v) => updateField("street", v)}
                onAddressSelect={(addr) => {
                  updateField("street", addr.street);
                  updateField("city", addr.city);
                  updateField("state", addr.state);
                  updateField("zipCode", addr.zipCode);
                  updateField("country", addr.country);
                }}
                placeholder="123 Warehouse Blvd"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Street Address 2</label>
              <Input
                placeholder="Suite, Floor, Unit"
                value={formData.street2 || ""}
                onChange={(e) => updateField("street2", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-sm font-medium">City</label>
                <Input
                  placeholder="City"
                  value={formData.city || ""}
                  onChange={(e) => updateField("city", e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">State</label>
                <Input
                  placeholder="State"
                  value={formData.state || ""}
                  onChange={(e) => updateField("state", e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">ZIP</label>
                <Input
                  placeholder="ZIP"
                  value={formData.zipCode || ""}
                  onChange={(e) => updateField("zipCode", e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Country</label>
                <Select
                  value={formData.country || "US"}
                  onValueChange={(v) => updateField("country", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="US">United States</SelectItem>
                    <SelectItem value="CA">Canada</SelectItem>
                    <SelectItem value="MX">Mexico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                checked={formData.isDefault || false}
                onCheckedChange={(v) => updateField("isDefault", !!v)}
              />
              <label className="text-sm">Set as default address</label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Saving..."
                  : editingAddress
                  ? "Update Address"
                  : "Add Address"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Delete Address?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this address? Existing POs referencing this address will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
