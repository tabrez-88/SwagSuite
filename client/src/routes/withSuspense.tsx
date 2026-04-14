import { Suspense, type ComponentType } from "react";
import PageLoader from "@/components/shared/PageLoader";

export function withSuspense(Component: ComponentType) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  );
}
