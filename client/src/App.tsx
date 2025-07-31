import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import CRM from "@/pages/crm";
import Orders from "@/pages/orders";
import Products from "@/pages/products";
import ProductionReport from "@/pages/production-report";
import Suppliers from "@/pages/suppliers";
import Reports from "@/pages/reports";
import KnowledgeBase from "@/pages/knowledge-base";
import Settings from "@/pages/settings";
import ArtworkPage from "@/pages/artwork";
import MockupBuilderPage from "@/pages/mockup-builder";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/crm" component={CRM} />
          <Route path="/orders" component={Orders} />
          <Route path="/production-report" component={ProductionReport} />
          <Route path="/products" component={Products} />
          <Route path="/suppliers" component={Suppliers} />
          <Route path="/artwork" component={ArtworkPage} />
          <Route path="/mockup-builder" component={MockupBuilderPage} />
          <Route path="/reports" component={Reports} />
          <Route path="/knowledge-base" component={KnowledgeBase} />
          <Route path="/settings" component={Settings} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
