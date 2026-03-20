import { useEffect, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import ProjectHeader from "./components/ProjectHeader";
import ProjectNestedSidebar from "./components/ProjectNestedSidebar";
import { useProjectData } from "./hooks";
import { useLockStatus } from "@/hooks/useLockStatus";

// Sections
import OverviewSection from "./sections/OverviewSection";
import PresentationSection from "./sections/PresentationSection";
import PresentationPreviewPage from "./sections/PresentationPreviewPage";
import QuoteSection from "./sections/QuoteSection";
import SalesOrderSection from "./sections/SalesOrderSection";
import ShippingSection from "@/components/sections/ShippingSection";
import PurchaseOrdersSection from "@/components/sections/PurchaseOrdersSection";
import InvoiceSection from "./sections/InvoiceSection";
import BillsSection from "./sections/BillsSection";
import FeedbackSection from "./sections/FeedbackSection";
import AddProductPage from "@/components/sections/AddProductPage";

export default function ProjectDetailPage() {
  const params = useParams();
  const orderId = params.orderId || params[0];
  const [location, setLocation] = useLocation();

  const queryClient = useQueryClient();
  const data = useProjectData(orderId);
  const lockStatus = useLockStatus(data);

  const getActiveSection = () => {
    if (!orderId) return "overview";
    const prefix = `/project/${orderId}/`;
    if (location.startsWith(prefix)) {
      const rest = location.slice(prefix.length);
      if (rest.startsWith("sales-order/add")) return "sales-order/add";
      if (rest.startsWith("sales-order")) return "sales-order";
      if (rest.startsWith("quote/add")) return "quote/add";
      if (rest.startsWith("presentation/add")) return "presentation/add";
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

  // Auto-recalculate totals once when order loads (ensures DB totals are in sync)
  const hasRecalculated = useRef(false);
  useEffect(() => {
    if (data.order && orderId && !hasRecalculated.current) {
      hasRecalculated.current = true;
      fetch(`/api/orders/${orderId}/recalculate-total`, {
        method: "POST",
        credentials: "include",
      }).then(res => {
        if (res.ok) queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
      }).catch(() => {});
    }
  }, [data.order, orderId, queryClient]);

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

  // Determine if overview fields should be locked (invoice is paid)
  const overviewLocked = lockStatus.invoice.isLocked;

  const renderSection = () => {
    switch (activeSection) {
      case "overview":
        return <OverviewSection orderId={orderId!} data={data} isLocked={overviewLocked} />;
      case "presentation":
        return <PresentationSection orderId={orderId!} data={data} />;
      case "presentation/preview":
        return <PresentationPreviewPage orderId={orderId!} data={data} />;
      case "quote":
        return <QuoteSection orderId={orderId!} data={data} lockStatus={lockStatus.quote} />;
      case "sales-order":
        return <SalesOrderSection orderId={orderId!} data={data} lockStatus={lockStatus.salesOrder} />;
      case "presentation/add":
      case "quote/add":
      case "sales-order/add":
        return <AddProductPage orderId={orderId!} data={data} />;
      case "shipping":
        return <ShippingSection orderId={orderId!} data={data} isLocked={lockStatus.shipping.isLocked} />;
      case "pos":
        return <PurchaseOrdersSection orderId={orderId!} data={data} isLocked={lockStatus.pos.isLocked} />;
      case "invoice":
        return <InvoiceSection orderId={orderId!} data={data} lockStatus={lockStatus.invoice} />;
      case "bills":
        return <BillsSection orderId={orderId!} data={data} />;
      case "feedback":
        return <FeedbackSection orderId={orderId!} data={data} />;
      default:
        return <OverviewSection orderId={orderId!} data={data} isLocked={overviewLocked} />;
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
        isRushOrder={data.isRushOrder}
        businessStage={data.businessStage}
      />

      <div className="flex flex-1 overflow-hidden">
        <ProjectNestedSidebar
          orderId={orderId!}
          orderItemsCount={data.orderItems.length}
          currentStage={data.businessStage?.stage.id}
          salesOrderStatus={data.order?.salesOrderStatus ?? undefined}
        />

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {renderSection()}
        </div>
      </div>
    </div>
  );
}
