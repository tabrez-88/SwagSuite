import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Ungroup,
  Gauge,
  Users,
  ShoppingCart,
  Box,
  Truck,
  ChartBar,
  Brain,
  Settings,
  Factory,
  Palette,
  Wand2,
  Presentation,
  Package,
  Zap,
  AlertCircle,
  ShieldAlert,
} from "lucide-react";
import { PacmanGame } from "./PacmanGame";
import { useTheme } from "@/providers/ThemeProvider";
import {
  Sidebar as SidebarRoot,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

const navigation = [
  { name: "Dashboard", href: "/", icon: Gauge },
  { name: "CRM", href: "/crm", icon: Users },
  { name: "Orders", href: "/orders", icon: ShoppingCart },
  { name: "Production Report", href: "/production-report", icon: Factory },
  { name: "Products", href: "/products", icon: Box },
  { name: "Suppliers", href: "/suppliers", icon: Truck },
  { name: "Artwork", href: "/artwork", icon: Palette },
  { name: "Errors", href: "/errors", icon: AlertCircle },
  { name: "Vendor Approvals", href: "/vendor-approvals", icon: ShieldAlert },
  { name: "Reports", href: "/reports", icon: ChartBar },
  { name: "Newsletter", href: "/newsletter", icon: Package },
  { name: "Team Performance", href: "/team-performance", icon: ChartBar },
  { name: "Knowledge Base", href: "/knowledge-base", icon: Brain },
  { name: "Mock-up Builder", href: "/mockup-builder", icon: Wand2 },
  { name: "Sequence Builder", href: "/sequence-builder", icon: Zap },
  { name: "AI Presentation Builder", href: "/ai-presentation-builder", icon: Presentation },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const [location] = useLocation();
  const [isPacmanOpen, setIsPacmanOpen] = useState(false);
  const { theme } = useTheme();
  const { setOpenMobile } = useSidebar();

  return (
    <>
      <SidebarRoot collapsible="icon">
        {/* Logo Section */}
        <SidebarHeader className="p-4 border-b border-sidebar-border">
          <div
            className="flex items-center gap-3 cursor-pointer hover:bg-sidebar-accent rounded-lg p-2 transition-colors group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-1"
            onClick={() => setIsPacmanOpen(true)}
            data-testid="swagsuite-logo"
          >
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
              {theme?.logoUrl ? (
                <img src={theme.logoUrl} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <Ungroup className="text-sidebar-foreground" size={20} />
              )}
            </div>
            <div className="group-data-[collapsible=icon]:hidden overflow-hidden">
              <h1 className="text-base font-bold text-sidebar-foreground truncate">
                {theme?.companyName || "SwagSuite"}
              </h1>
              <p className="text-xs text-sidebar-foreground/70 truncate">
                {theme?.tagline || "by Liquid Screen Design"}
              </p>
            </div>
          </div>
        </SidebarHeader>

        {/* Navigation Menu */}
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigation.map((item) => {
                  const isActive = location === item.href;
                  return (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.name}
                        className={isActive ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 hover:text-sidebar-primary-foreground" : ""}
                      >
                        <Link href={item.href} onClick={() => setOpenMobile(false)}>
                          <item.icon size={20} />
                          <span>{item.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarRail />
      </SidebarRoot>

      {/* Pacman Game Modal */}
      <PacmanGame
        isOpen={isPacmanOpen}
        onClose={() => setIsPacmanOpen(false)}
      />
    </>
  );
}
