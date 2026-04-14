import { Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/constants";
import PageLoader from "@/components/shared/PageLoader";

const Landing = lazy(() => import("@/pages/Landing"));

export default function RootRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <PageLoader />;

  if (isAuthenticated) {
    const redirectTo = sessionStorage.getItem("redirectAfterLogin");
    if (redirectTo) {
      sessionStorage.removeItem("redirectAfterLogin");
      return <Navigate to={redirectTo} replace />;
    }
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Landing />
    </Suspense>
  );
}
