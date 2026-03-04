import { Link, useLocation } from "wouter";
import {
  Calculator,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Lock,
  Presentation,
  Receipt,
  ShoppingCart,
  Star,
  Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type BusinessStage, STAGE_ORDER } from "@/lib/businessStages";

interface ProjectNestedSidebarProps {
  orderId: string;
  orderItemsCount?: number;
  currentStage?: BusinessStage;
}

interface NavItem {
  name: string;
  href: string;
  icon: any;
  showCount?: boolean;
  stageGate?: BusinessStage;
}

const navItems: NavItem[] = [
  { name: "Overview", href: "overview", icon: LayoutDashboard },
  { name: "Presentation", href: "presentation", icon: Presentation },
  { name: "Estimate", href: "estimate", icon: Calculator, stageGate: "estimate" },
  { name: "Sales Order", href: "sales-order", icon: ShoppingCart, showCount: true, stageGate: "sales_order" },
  { name: "Shipping", href: "shipping", icon: Truck, stageGate: "sales_order" },
  { name: "POs", href: "pos", icon: ClipboardList, stageGate: "sales_order" },
  { name: "Invoice", href: "invoice", icon: Receipt, stageGate: "invoice" },
  { name: "Bills", href: "bills", icon: FileText, stageGate: "invoice" },
  { name: "Feedback", href: "feedback", icon: Star },
];

function isStageUnlocked(stageGate: BusinessStage | undefined, currentStage: BusinessStage | undefined): boolean {
  if (!stageGate) return true;
  if (!currentStage) return false;
  const gateIndex = STAGE_ORDER.indexOf(stageGate);
  const currentIndex = STAGE_ORDER.indexOf(currentStage);
  return currentIndex >= gateIndex;
}

export default function ProjectNestedSidebar({ orderId, orderItemsCount, currentStage }: ProjectNestedSidebarProps) {
  const [location] = useLocation();

  const getActiveSection = () => {
    const prefix = `/project/${orderId}/`;
    if (location.startsWith(prefix)) {
      const rest = location.slice(prefix.length);
      if (rest.startsWith("sales-order")) return "sales-order";
      if (rest.startsWith("presentation")) return "presentation";
      const section = rest.split("/")[0];
      return section || "overview";
    }
    if (location === `/project/${orderId}`) {
      return "overview";
    }
    return "overview";
  };

  const activeSection = getActiveSection();

  return (
    <div className="w-52 flex-shrink-0 border-r border-gray-200 bg-white min-h-full">
      <div className="p-3 border-b border-gray-100">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Project
        </h3>
      </div>
      <nav className="p-2 space-y-0.5">
        {navItems.map((item) => {
          const isActive = activeSection === item.href;
          const isLocked = !isStageUnlocked(item.stageGate, currentStage);

          if (isLocked) {
            return (
              <div
                key={item.href}
                className="flex items-center justify-between gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-300 cursor-not-allowed"
              >
                <div className="flex items-center gap-2">
                  <item.icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </div>
                <Lock className="w-3.5 h-3.5" />
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={`/project/${orderId}/${item.href}`}
              className={cn(
                "flex items-center justify-between gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <div className="flex items-center gap-2">
                <item.icon className="w-4 h-4" />
                <span>{item.name}</span>
              </div>
              {item.showCount && orderItemsCount !== undefined && (
                <span className={cn(
                  "text-xs px-1.5 py-0.5 rounded-full",
                  isActive ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"
                )}>
                  {orderItemsCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
