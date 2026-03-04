import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import ProjectHeader from "./ProjectHeader";
import ProjectNestedSidebar from "./ProjectNestedSidebar";
import { useProjectData } from "./hooks/useProjectData";
import OrderModal from "@/components/OrderModal";

// Sections
import OverviewSection from "./sections/OverviewSection";
import PresentationSection from "./sections/PresentationSection";
import PresentationPreviewPage from "./sections/PresentationPreviewPage";
import EstimateSection from "./sections/EstimateSection";
import SalesOrderSection from "./sections/SalesOrderSection";
import ShippingSection from "@/pages/order-detail/sections/ShippingSection";
import PurchaseOrdersSection from "@/pages/order-detail/sections/PurchaseOrdersSection";
import InvoiceSection from "./sections/InvoiceSection";
import BillsSection from "./sections/BillsSection";
import FeedbackSection from "./sections/FeedbackSection";
import AddProductPage from "@/pages/order-detail/sections/AddProductPage";

export default function ProjectDetailPage() {
  const params = useParams();
  const orderId = params.orderId || params[0];
  const [location, setLocation] = useLocation();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const data = useProjectData(orderId);

  const getActiveSection = () => {
    if (!orderId) return "overview";
    const prefix = `/project/${orderId}/`;
    if (location.startsWith(prefix)) {
      const rest = location.slice(prefix.length);
      if (rest.startsWith("sales-order/add")) return "sales-order/add";
      if (rest.startsWith("sales-order")) return "sales-order";
      if (rest.startsWith("presentation/preview")) return "presentation/preview";
      if (rest.startsWith("presentation")) return "presentation";
      const section = rest.split("/")[0];
      return section || "overview";
    }
    return "overview";
  };

  const activeSection = getActiveSection();

  // Redirect bare /project/:orderId to /project/:orderId/overview
  useEffect(() => {
    if (orderId && location === `/project/${orderId}`) {
      setLocation(`/project/${orderId}/overview`, { replace: true });
    }
  }, [orderId, location, setLocation]);

  if (data.orderLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!data.order) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-600">Project not found</p>
        </div>
      </div>
    );
  }

  const renderSection = () => {
    switch (activeSection) {
      case "overview":
        return <OverviewSection orderId={orderId!} data={data} />;
      case "presentation":
        return <PresentationSection orderId={orderId!} data={data} />;
      case "presentation/preview":
        return <PresentationPreviewPage orderId={orderId!} data={data} />;
      case "estimate":
        return <EstimateSection orderId={orderId!} data={data} />;
      case "sales-order":
        return <SalesOrderSection orderId={orderId!} data={data} />;
      case "sales-order/add":
        return <AddProductPage orderId={orderId!} data={data as any} />;
      case "shipping":
        return <ShippingSection orderId={orderId!} data={data as any} />;
      case "pos":
        return <PurchaseOrdersSection orderId={orderId!} data={data as any} />;
      case "invoice":
        return <InvoiceSection orderId={orderId!} data={data} />;
      case "bills":
        return <BillsSection orderId={orderId!} data={data} />;
      case "feedback":
        return <FeedbackSection orderId={orderId!} data={data} />;
      default:
        return <OverviewSection orderId={orderId!} data={data} />;
    }
  };

  // Presentation preview is fullscreen — no header/sidebar
  if (activeSection === "presentation/preview") {
    return (
      <div className="h-full overflow-y-auto">
        <PresentationPreviewPage orderId={orderId!} data={data} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <ProjectHeader
        order={data.order}
        statusLabel={data.statusLabel}
        statusClass={data.statusClass}
        isRushOrder={data.isRushOrder}
        businessStage={data.businessStage}
        onEditOrder={() => setIsEditModalOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        <ProjectNestedSidebar
          orderId={orderId!}
          orderItemsCount={data.orderItems.length}
          currentStage={data.businessStage?.stage.id}
        />

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {renderSection()}
        </div>
      </div>

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
