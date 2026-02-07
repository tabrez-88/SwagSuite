import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import TopBar from "@/components/TopBar";
import Sidebar from "@/components/Sidebar";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import CRM from "@/pages/crm";
import ClientDetail from "@/pages/crm/client-detail";
import CompanyDetail from "@/pages/crm/company-detail";
import Orders from "@/pages/orders";
import Products from "@/pages/products";
import ProductionReport from "@/pages/production-report";
import Suppliers from "@/pages/suppliers";
import Reports from "@/pages/reports";
import KnowledgeBase from "@/pages/knowledge-base";
import Settings from "@/pages/settings";
import SequenceBuilder from "@/pages/sequence-builder";
import Newsletter from "@/pages/newsletter";
import TeamPerformance from "@/pages/team-performance";
import ProjectPage from "@/pages/project";
import ArtworkPage from "@/pages/artwork";
import MockupBuilderPage from "@/pages/mockup-builder";
import AIPresentationBuilder from "@/pages/ai-presentation-builder";
import SsActivewearPage from "@/pages/ss-activewear";
import ErrorsPage from "@/pages/errors";
import UsersPage from "@/pages/settings/users";
import ProfilePage from "@/pages/profile";
import VendorApprovals from "@/pages/vendor-approvals";
import OrderDetailsPage from "@/pages/order-details";
import NotificationsPage from "@/pages/notifications";
import NotFound from "@/pages/not-found";
import ApprovalPage from "@/pages/approval";
import QuoteApprovalPage from "@/pages/quote-approval";
import AcceptInvitation from "@/pages/accept-invitation";
import { SlackSidebar } from "@/components/SlackSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { useState } from 'react';

// Layout component for authenticated pages
function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const [isSlackMinimized, setIsSlackMinimized] = useState(true);

  return (
    <SidebarProvider>
      <Sidebar />
      <SidebarInset className="flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-scroll bg-gray-50">
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

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

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

  return (
    <Switch>
      {/* Public approval route - accessible without authentication */}
      <Route path="/approval/:token" component={ApprovalPage} />
      
      {/* Public quote approval route - accessible without authentication */}
      <Route path="/quote-approval/:token" component={QuoteApprovalPage} />
      
      {/* Public invitation acceptance route */}
      <Route path="/accept-invitation" component={AcceptInvitation} />
      
      {!isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <AuthenticatedLayout>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/crm" component={CRM} />
            <Route path="/crm/clients/:id" component={ClientDetail} />
            <Route path="/crm/companies/:id" component={CompanyDetail} />
            <Route path="/orders" component={Orders} />
            <Route path="/orders/:orderId" component={OrderDetailsPage} />
            <Route path="/production-report" component={ProductionReport} />
            <Route path="/products" component={Products} />
            <Route path="/suppliers" component={Suppliers} />
            <Route path="/artwork" component={ArtworkPage} />
            <Route path="/mockup-builder" component={MockupBuilderPage} />
            <Route path="/ai-presentation-builder" component={AIPresentationBuilder} />
            <Route path="/reports" component={Reports} />
            <Route path="/knowledge-base" component={KnowledgeBase} />
            <Route path="/sequence-builder" component={SequenceBuilder} />
            <Route path="/newsletter" component={Newsletter} />
            <Route path="/team-performance" component={TeamPerformance} />
            <Route path="/project/:orderId" component={ProjectPage} />
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
