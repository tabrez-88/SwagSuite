import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import TopBar from "@/components/layout/TopBar";
import Sidebar from "@/components/layout/Sidebar";
import { SlackSidebar } from "@/components/feature/SlackSidebar";
import { SidebarProvider, SidebarInset, useSidebar } from "@/components/ui/sidebar";

// Auto-collapse sidebar on project detail pages (they have their own nested sidebar).
function SidebarAutoCollapse() {
  const { pathname } = useLocation();
  const { setOpen, open } = useSidebar();
  const prevOpenRef = useRef(open);
  const wasAutoCollapsed = useRef(false);

  const isProjectDetail = /^\/projects\/[^/]+/.test(pathname);

  useEffect(() => {
    if (isProjectDetail && open) {
      prevOpenRef.current = true;
      wasAutoCollapsed.current = true;
      setOpen(false);
    } else if (!isProjectDetail && wasAutoCollapsed.current) {
      wasAutoCollapsed.current = false;
      setOpen(prevOpenRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProjectDetail]);

  return null;
}

function RedirectAfterLogin() {
  const navigate = useNavigate();
  useEffect(() => {
    const target = sessionStorage.getItem("redirectAfterLogin");
    if (target) {
      sessionStorage.removeItem("redirectAfterLogin");
      navigate(target, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

export default function AuthenticatedLayout() {
  const [isSlackMinimized, setIsSlackMinimized] = useState(true);

  return (
    <SidebarProvider>
      <RedirectAfterLogin />
      <SidebarAutoCollapse />
      <Sidebar />
      <SidebarInset className="flex flex-col">
        <TopBar />
        <main className="flex-1 relative bg-gray-50">
          <Outlet />
        </main>
      </SidebarInset>
      <SlackSidebar
        isMinimized={isSlackMinimized}
        onToggleMinimize={() => setIsSlackMinimized(!isSlackMinimized)}
      />
    </SidebarProvider>
  );
}
