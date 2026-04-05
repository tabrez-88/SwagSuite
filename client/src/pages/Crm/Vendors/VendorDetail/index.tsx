import { AlertCircle, ArrowLeft, Edit, Star, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useState } from "react";
import { useDeleteVendor, useTogglePreferred } from "@/services/suppliers";
import { SupplierAddressesManager } from "@/components/feature/SupplierAddressesManager";
import { useVendorDetail } from "./hooks";
import OverviewTab from "./sections/OverviewTab";
import ContactsTab from "./sections/ContactsTab";
import ProductsTab from "./sections/ProductsTab";
import EditVendorModal from "./EditVendorModal";

export default function VendorDetail() {
  const {
    vendor,
    vendorId,
    isLoading,
    error,
    activeTab,
    setActiveTab,
    vendorProducts,
    isLoadingProducts,
    vendorContacts,
    isLoadingContacts,
    getInitials,
    setLocation,
  } = useVendorDetail();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const deleteMutation = useDeleteVendor();
  const togglePreferredMutation = useTogglePreferred();

  const handleDelete = () => {
    if (vendorId) {
      deleteMutation.mutate(vendorId, {
        onSuccess: () => setLocation("/crm"),
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-40" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold">Vendor not found</h2>
        <p className="text-muted-foreground">
          The vendor you're looking for doesn't exist or has been removed.
        </p>
        <Button onClick={() => setLocation("/crm")} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to CRM
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/crm")}
            className="h-8 w-8 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="text-sm font-semibold bg-gray-200">
                {getInitials(vendor.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-swag-navy">{vendor.name}</h1>
                {vendor.isPreferred && (
                  <Star className="h-5 w-5 text-yellow-500 fill-current" />
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {(vendor as any).accountNumber && <span>#{(vendor as any).accountNumber}</span>}
                {vendor.paymentTerms && (
                  <>
                    {(vendor as any).accountNumber && <span>·</span>}
                    <span>{vendor.paymentTerms}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {vendor.isPreferred && (
            <Badge className="bg-yellow-100 text-yellow-800">
              <Star className="h-3 w-3 mr-1 fill-current" />
              Preferred
            </Badge>
          )}
          {vendor.doNotOrder && (
            <Badge variant="destructive">Do Not Order</Badge>
          )}
          {vendor.apiIntegrationStatus === "active" && (
            <Badge className="bg-green-100 text-green-800">API Connected</Badge>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => togglePreferredMutation.mutate({ vendorId: vendor.id, isPreferred: !vendor.isPreferred })}
            className={vendor.isPreferred ? "text-yellow-600" : "text-muted-foreground"}
            disabled={togglePreferredMutation.isPending}
          >
            <Star size={16} className={vendor.isPreferred ? "fill-current" : ""} />
          </Button>
          <Button size="sm" className="bg-swag-primary hover:bg-swag-primary/90" onClick={() => setIsEditOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Vendor
          </Button>
          <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => setIsDeleteOpen(true)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="addresses">Addresses</TabsTrigger>
          <TabsTrigger value="products">Products ({vendor.productCount || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <OverviewTab vendor={vendor} vendorContacts={vendorContacts} />
        </TabsContent>

        <TabsContent value="contacts" className="space-y-6">
          <ContactsTab
            vendorId={vendor.id}
            vendorName={vendor.name}
            contacts={vendorContacts}
            isLoading={isLoadingContacts}
          />
        </TabsContent>

        <TabsContent value="addresses" className="space-y-6">
          <SupplierAddressesManager supplierId={vendor.id} supplierName={vendor.name} />
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <ProductsTab
            products={vendorProducts}
            isLoading={isLoadingProducts}
            productCount={vendor.productCount || 0}
          />
        </TabsContent>
      </Tabs>

      {/* Edit Modal */}
      <EditVendorModal
        vendor={vendor}
        isOpen={isEditOpen}
        setIsOpen={setIsEditOpen}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vendor?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {vendor.name}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>
              {deleteMutation.isPending ? "Deleting..." : "Delete Vendor"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
