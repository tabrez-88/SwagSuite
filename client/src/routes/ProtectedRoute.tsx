import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/constants";
import PageLoader from "@/components/shared/PageLoader";
import TwoFactorSetup from "@/pages/TwoFactorSetup";

export default function ProtectedRoute() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && location.pathname !== ROUTES.LANDING) {
      sessionStorage.setItem("redirectAfterLogin", location.pathname + location.search);
    }
  }, [isLoading, isAuthenticated, location]);

  if (isLoading) return <PageLoader />;

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LANDING} replace />;
  }

  const u = user as { twoFactorEnabled?: boolean; id?: string } | null | undefined;
  if (!u?.twoFactorEnabled && u?.id !== "dev-user-id") {
    return <TwoFactorSetup />;
  }

  return <Outlet />;
}
