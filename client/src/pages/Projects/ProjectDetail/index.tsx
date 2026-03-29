import { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import ProjectHeader from "./components/ProjectHeader";
import ProjectNestedSidebar from "./components/ProjectNestedSidebar";
import { useProjectData } from "./hooks";
import { useLockStatus } from "@/hooks/useLockStatus";

// Sections
import OverviewSection from "./sections/OverviewSection";
import PresentationSection from "./sections/PresentationSection";
import QuoteSection from "./sections/QuoteSection";
import SalesOrderSection from "./sections/SalesOrderSection";
import ShippingSection from "./sections/ShippingSection";
import PurchaseOrdersSection from "./sections/PurchaseOrdersSection";
import InvoiceSection from "./sections/InvoiceSection";
import BillsSection from "./sections/BillsSection";
import FeedbackSection from "./sections/FeedbackSection";
import AddProductPage from "@/components/sections/AddProductPage";
import EditProductPage from "@/components/sections/EditProductPage";
import PresentationPreviewPage from "./sections/PresentationSection/PresentationPreviewPage";

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.projectId || params[0];
  const [location, setLocation] = useLocation();

  const getActiveSection = () => {
    if (!projectId) return "overview";
    const prefix = `/projects/${projectId}/`;
    if (location.startsWith(prefix)) {
      const rest = location.slice(prefix.length);
      if (rest.startsWith("sales-order/add")) return "sales-order/add";
      if (rest.startsWith("sales-order/edit/")) return "sales-order/edit";
      if (rest.startsWith("sales-order")) return "sales-order";
      if (rest.startsWith("quote/add")) return "quote/add";
      if (rest.startsWith("quote/edit/")) return "quote/edit";
      if (rest.startsWith("presentation/add")) return "presentation/add";
      if (rest.startsWith("presentation/preview")) return "presentation/preview";
      if (rest.startsWith("presentation")) return "presentation";
      const section = rest.split("/")[0];
      return section || "overview";
    }
    return "overview";
  };

  const activeSection = getActiveSection();

  // Extract itemId for edit routes
  const getEditItemId = () => {
    if (!projectId) return null;
    const prefix = `/projects/${projectId}/`;
    if (location.startsWith(prefix)) {
      const rest = location.slice(prefix.length);
      const editMatch = rest.match(/(?:sales-order|quote)\/edit\/(.+)/);
      if (editMatch) return editMatch[1];
    }
    return null;
  };
  const editItemId = getEditItemId();

  // Map edit sections to their parent for data loading
  const dataSection = activeSection.includes("/edit") ? activeSection.replace("/edit", "") : activeSection;
  const data = useProjectData(projectId, dataSection);
  const lockStatus = useLockStatus(data);

  // Redirect bare /project/:projectId to /project/:projectId/overview
  useEffect(() => {
    if (projectId && location === `/projects/${projectId}`) {
      setLocation(`/projects/${projectId}/overview`, { replace: true });
    }
  }, [projectId, location, setLocation]);

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
        return <OverviewSection projectId={projectId!} data={data} isLocked={overviewLocked} />;
      case "presentation":
        return <PresentationSection projectId={projectId!} data={data} />;
      case "presentation/preview":
        return <PresentationPreviewPage projectId={projectId!} data={data} />;
      case "quote":
        return <QuoteSection projectId={projectId!} data={data} lockStatus={lockStatus.quote} />;
      case "sales-order":
        return <SalesOrderSection projectId={projectId!} data={data} lockStatus={lockStatus.salesOrder} />;
      case "presentation/add":
      case "quote/add":
      case "sales-order/add":
        return <AddProductPage projectId={projectId!} data={data} />;
      case "quote/edit":
      case "sales-order/edit":
        return editItemId ? <EditProductPage projectId={projectId!} itemId={editItemId} data={data} /> : null;
      case "shipping":
        return <ShippingSection projectId={projectId!} data={data} isLocked={lockStatus.shipping.isLocked} />;
      case "pos":
        return <PurchaseOrdersSection projectId={projectId!} data={data} isLocked={lockStatus.pos.isLocked} />;
      case "invoice":
        return <InvoiceSection projectId={projectId!} data={data} lockStatus={lockStatus.invoice} />;
      case "bills":
        return <BillsSection projectId={projectId!} data={data} />;
      case "feedback":
        return <FeedbackSection projectId={projectId!} data={data} />;
      default:
        return <OverviewSection projectId={projectId!} data={data} isLocked={overviewLocked} />;
    }
  };

  // Presentation preview is fullscreen — no header/sidebar
  if (activeSection === "presentation/preview") {
    return (
      <div className="h-full overflow-y-auto">
        <PresentationPreviewPage projectId={projectId!} data={data} />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <ProjectHeader
        order={data.order}
        isRushOrder={data.isRushOrder}
        businessStage={data.businessStage}
      />

      <div className="flex relative bg-white h-full">
        <ProjectNestedSidebar
          projectId={projectId!}
          orderItemsCount={data.orderItems.length}
          currentStage={data.businessStage?.stage.id}
          salesOrderStatus={data.order?.salesOrderStatus ?? undefined}
        />

        <div className="flex-1 p-6 pb-24 bg-gray-50">
          {renderSection()}
        </div>
      </div>
    </div>
  );
}
