import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import TopBar from "@/components/layout/TopBar";
import Sidebar from "@/components/layout/Sidebar";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import CRM from "@/pages/Crm";
import ContactDetail from "@/pages/Crm/Contacts/ContactDetail";
import CompanyDetail from "@/pages/Crm/Companies/CompanyDetail";
import VendorDetail from "@/pages/Crm/Vendors/VendorDetail";
import ProjectsPage from "@/pages/Projects";
import ProjectDetailPage from "@/pages/Projects/ProjectDetail";
import Products from "@/pages/Products";
import ProductionReport from "@/pages/ProductionReport";
import Suppliers from "@/pages/Suppliers";
import Reports from "@/pages/Reports";
import KnowledgeBase from "@/pages/KnowledgeBase";
import Settings from "@/pages/Settings";
import SequenceBuilder from "@/pages/SequenceBuilder";
import Newsletter from "@/pages/Newsletter";
import TeamPerformance from "@/pages/TeamPerformance";
import ArtworkPage from "@/pages/Artwork";
import MockupBuilderPage from "@/pages/MockupBuilder";
import AIPresentationBuilder from "@/pages/AiPresentationBuilder";
import SsActivewearPage from "@/pages/SsActivewear";
import ErrorsPage from "@/pages/Errors";
import UsersPage from "@/pages/Settings/users";
import ProfilePage from "@/pages/Profile";
import VendorApprovals from "@/pages/VendorApprovals";
import NotificationsPage from "@/pages/Notifications";
import NotFound from "@/pages/NotFound";
import TwoFactorSetup from "@/pages/TwoFactorSetup";
import ApprovalPage from "@/pages/Artwork/Approval";
import QuoteApprovalPage from "@/pages/Projects/ProjectDetail/sections/QuoteSection/QuoteApproval";
import AcceptInvitation from "@/pages/AcceptInvitation";
import CustomerPortalPage from "@/pages/CustomerPortal";
import PublicPresentationPage from "@/pages/Projects/ProjectDetail/sections/PresentationSection/PublicPresentation";
import MediaLibraryPage from "@/pages/MediaLibrary";
import POConfirmationPage from "@/pages/Projects/ProjectDetail/sections/PurchaseOrdersSection/PoConfirmation";
import { SlackSidebar } from "@/components/feature/SlackSidebar";
import { SidebarProvider, SidebarInset, useSidebar } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { useState, useEffect, useRef } from 'react';

// Auto-collapse sidebar on project detail pages (they have their own nested sidebar)
function SidebarAutoCollapse() {
  const [location] = useLocation();
  const { setOpen, open } = useSidebar();
  const prevOpenRef = useRef(open);
  const wasAutoCollapsed = useRef(false);

  const isProjectDetail = /^\/projects\/[^/]+/.test(location);

  useEffect(() => {
    if (isProjectDetail && open) {
      prevOpenRef.current = true;
      wasAutoCollapsed.current = true;
      setOpen(false);
    } else if (!isProjectDetail && wasAutoCollapsed.current) {
      wasAutoCollapsed.current = false;
      setOpen(prevOpenRef.current);
    }
  }, [isProjectDetail]);

  return null;
}

// Layout component for authenticated pages
function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const [isSlackMinimized, setIsSlackMinimized] = useState(true);

  return (
    <SidebarProvider>
      <SidebarAutoCollapse />
      <Sidebar />
      <SidebarInset className="flex flex-col">
        <TopBar />
        <main className="flex-1 relative bg-gray-50">
          {children}
        </main>
      </SidebarInset>
      <SlackSidebar
        isMinimized={isSlackMinimized}
        onToggleMinimize={() => setIsSlackMinimized(!isSlackMinimized)}
      />
    </SidebarProvider>
  );
}

// Redirects unauthenticated users to landing page, preserving intended URL
function RedirectToLanding() {
  const [location] = useLocation();
  if (location !== "/") {
    sessionStorage.setItem("redirectAfterLogin", location);
    return <Redirect to="/" replace />;
  }
  return <Landing />;
}

function Router() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // After login, redirect to the originally requested URL if stored
  // Only redirect if 2FA is already set up (otherwise show 2FA setup first)
  if (isAuthenticated && (user as any)?.twoFactorEnabled) {
    const redirectTo = sessionStorage.getItem("redirectAfterLogin");
    if (redirectTo) {
      sessionStorage.removeItem("redirectAfterLogin");
      return <Redirect to={redirectTo} replace />;
    }
  }

  return (
    <Switch>
      {/* Public approval route - accessible without authentication */}
      <Route path="/approval/:token" component={ApprovalPage} />

      {/* Public quote/SO approval route - accessible without authentication */}
      <Route path="/client-approval/:token" component={QuoteApprovalPage} />
      {/* Legacy redirect for old quote-approval links */}
      <Route path="/quote-approval/:token" component={QuoteApprovalPage} />

      {/* Public invitation acceptance route */}
      <Route path="/accept-invitation" component={AcceptInvitation} />

      {/* Public PO confirmation portal - vendor confirmation */}
      <Route path="/po-confirmation/:token" component={POConfirmationPage} />

      {/* Public customer portal - order tracking */}
      <Route path="/portal/:token" component={CustomerPortalPage} />
      {/* Public presentation page - no auth */}
      <Route path="/presentation/:token" component={PublicPresentationPage} />

      {!isAuthenticated ? (
        <Route component={RedirectToLanding} />
      ) : !(user as any)?.twoFactorEnabled && (user as any)?.id !== "dev-user-id" ? (
        <Route component={TwoFactorSetup} />
      ) : (
        <AuthenticatedLayout>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/crm" component={CRM} />
            <Route path="/crm/contacts/:id" component={ContactDetail} />
            <Route path="/crm/companies/:id" component={CompanyDetail} />
            <Route path="/crm/vendors/:id" component={VendorDetail} />
            <Route path="/projects" component={ProjectsPage} />
            <Route path="/projects/:projectId" component={ProjectDetailPage} />
            <Route path="/projects/:projectId/*" component={ProjectDetailPage} />
            <Route path="/production-report" component={ProductionReport} />
            <Route path="/products" component={Products} />
            <Route path="/media-library" component={MediaLibraryPage} />
            <Route path="/suppliers" component={Suppliers} />
            <Route path="/artwork" component={ArtworkPage} />
            <Route path="/mockup-builder" component={MockupBuilderPage} />
            <Route path="/ai-presentation-builder" component={AIPresentationBuilder} />
            <Route path="/reports" component={Reports} />
            <Route path="/knowledge-base" component={KnowledgeBase} />
            <Route path="/sequence-builder" component={SequenceBuilder} />
            <Route path="/newsletter" component={Newsletter} />
            <Route path="/team-performance" component={TeamPerformance} />
            <Route path="/ss-activewear" component={SsActivewearPage} />
            <Route path="/errors" component={ErrorsPage} />
            <Route path="/notifications" component={NotificationsPage} />
            <Route path="/vendor-approvals" component={VendorApprovals} />
            <Route path="/settings" component={Settings} />
            <Route path="/settings/users" component={UsersPage} />
            <Route path="/profile" component={ProfilePage} />
            <Route component={NotFound} />
          </Switch>
        </AuthenticatedLayout>
      )}
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
