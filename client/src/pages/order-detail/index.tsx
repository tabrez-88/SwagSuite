import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import OrderHeader from "./OrderHeader";
import OrderNestedSidebar from "./OrderNestedSidebar";
import { useOrderDetailData } from "./hooks/useOrderDetailData";
import OrderModal from "@/components/OrderModal";

// Lazy-load sections to keep bundle manageable
import DetailsSection from "./sections/DetailsSection";
import ProductsSection from "./sections/ProductsSection";
import ShippingSection from "./sections/ShippingSection";
import PurchaseOrdersSection from "./sections/PurchaseOrdersSection";
import FilesSection from "./sections/FilesSection";
import DocumentsSection from "./sections/DocumentsSection";
import ActivitiesSection from "./sections/ActivitiesSection";
import EmailSection from "./sections/EmailSection";
import VendorSection from "./sections/VendorSection";
import AddProductPage from "./sections/AddProductPage";

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.orderId || params[0];
  const [location, setLocation] = useLocation();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const data = useOrderDetailData(orderId);

  // Determine the active section from the URL
  const getActiveSection = () => {
    if (!orderId) return "details";
    const prefix = `/orders/${orderId}/`;
    if (location.startsWith(prefix)) {
      const rest = location.slice(prefix.length);
      // Handle nested routes like products/add
      if (rest.startsWith("products/add")) return "products/add";
      const section = rest.split("/")[0];
      return section || "details";
    }
    return "details";
  };

  const activeSection = getActiveSection();

  // Redirect bare /orders/:orderId to /orders/:orderId/details
  useEffect(() => {
    if (orderId && location === `/orders/${orderId}`) {
      setLocation(`/orders/${orderId}/details`, { replace: true });
    }
  }, [orderId, location, setLocation]);

  if (data.orderLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order...</p>
        </div>
      </div>
    );
  }

  if (!data.order) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-600">Order not found</p>
        </div>
      </div>
    );
  }

  const renderSection = () => {
    switch (activeSection) {
      case "details":
        return <DetailsSection orderId={orderId!} data={data} />;
      case "products":
        return <ProductsSection orderId={orderId!} data={data} />;
      case "products/add":
        return <AddProductPage orderId={orderId!} data={data} />;
      case "shipping":
        return <ShippingSection orderId={orderId!} data={data} />;
      case "pos":
        return <PurchaseOrdersSection orderId={orderId!} data={data} />;
      case "files":
        return <FilesSection orderId={orderId!} data={data} />;
      case "documents":
        return <DocumentsSection orderId={orderId!} data={data} />;
      case "activities":
        return <ActivitiesSection orderId={orderId!} data={data} />;
      case "email":
        return <EmailSection orderId={orderId!} data={data} />;
      case "vendor":
        return <VendorSection orderId={orderId!} data={data} />;
      default:
        return <DetailsSection orderId={orderId!} data={data} />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <OrderHeader
        order={data.order}
        statusLabel={data.statusLabel}
        statusClass={data.statusClass}
        isRushOrder={data.isRushOrder}
        onEditOrder={() => setIsEditModalOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        <OrderNestedSidebar
          orderId={orderId!}
          orderItemsCount={data.orderItems.length}
        />

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {renderSection()}
        </div>
      </div>

      {/* Edit Order Modal */}
      <OrderModal
        open={isEditModalOpen}
        onOpenChange={(open) => {
          setIsEditModalOpen(open);
          if (!open) {
            queryClient.invalidateQueries({
              queryKey: [`/api/orders/${orderId}/items`],
            });
            queryClient.invalidateQueries({
              queryKey: [`/api/orders/${orderId}`],
            });
          }
        }}
        order={data.order}
      />
    </div>
  );
}
