import { Link, useLocation } from "wouter";
import {
  Activity,
  ClipboardList,
  FileText,
  FolderOpen,
  Mail,
  MessageSquare,
  Package,
  Truck,
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderNestedSidebarProps {
  orderId: string;
  orderItemsCount?: number;
}

const navItems = [
  { name: "Details", href: "details", icon: FileText },
  { name: "Products", href: "products", icon: Package, showCount: true },
  { name: "Shipping", href: "shipping", icon: Truck },
  { name: "Purchase Orders", href: "pos", icon: ClipboardList },
  { name: "Files", href: "files", icon: FolderOpen },
  { name: "Documents", href: "documents", icon: FileText },
  { name: "Activities", href: "activities", icon: Activity },
  { name: "Client Email", href: "email", icon: Mail },
  { name: "Vendor Email", href: "vendor", icon: Store },
];

export default function OrderNestedSidebar({ orderId, orderItemsCount }: OrderNestedSidebarProps) {
  const [location] = useLocation();

  const getActiveSection = () => {
    const prefix = `/orders/${orderId}/`;
    if (location.startsWith(prefix)) {
      const section = location.slice(prefix.length).split("/")[0];
      return section || "details";
    }
    // Default for /orders/:orderId (no trailing section)
    if (location === `/orders/${orderId}`) {
      return "details";
    }
    return "details";
  };

  const activeSection = getActiveSection();

  return (
    <div className="w-52 flex-shrink-0 border-r border-gray-200 bg-white min-h-full">
      <div className="p-3 border-b border-gray-100">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Order Navigation
        </h3>
      </div>
      <nav className="p-2 space-y-0.5">
        {navItems.map((item) => {
          const isActive = activeSection === item.href;
          return (
            <Link
              key={item.href}
              href={`/orders/${orderId}/${item.href}`}
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
