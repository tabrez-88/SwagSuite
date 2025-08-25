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
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PacmanGame } from "./PacmanGame";

const navigation = [
  { name: "Dashboard", href: "/", icon: Gauge },
  { name: "CRM", href: "/crm", icon: Users },
  { name: "Orders", href: "/orders", icon: ShoppingCart },
  { name: "Production Report", href: "/production-report", icon: Factory },
  { name: "Errors", href: "/errors", icon: AlertCircle },
  { name: "Products", href: "/products", icon: Box },
  { name: "Suppliers", href: "/suppliers", icon: Truck },
  { name: "Artwork", href: "/artwork", icon: Palette },
  { name: "Mock-up Builder", href: "/mockup-builder", icon: Wand2 },
  { name: "AI Presentation Builder", href: "/ai-presentation-builder", icon: Presentation },
  { name: "Reports", href: "/reports", icon: ChartBar },
  { name: "Knowledge Base", href: "/knowledge-base", icon: Brain },
  { name: "Sequence Builder", href: "/sequence-builder", icon: Zap },
  { name: "Team Performance", href: "/team-performance", icon: ChartBar },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const [location] = useLocation();
  const [isPacmanOpen, setIsPacmanOpen] = useState(false);

  return (
    <div className="w-64 bg-swag-dark text-white flex-shrink-0 transition-all duration-300">
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-700">
        <div 
          className="flex items-center space-x-3 cursor-pointer hover:bg-gray-700/50 rounded-lg p-2 -m-2 transition-colors"
          onClick={() => setIsPacmanOpen(true)}
          data-testid="swagsuite-logo"
        >
          <div className="w-10 h-10 bg-swag-primary rounded-lg flex items-center justify-center">
            <Ungroup className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold">SwagSuite</h1>
            <p className="text-xs text-gray-400">by Liquid Screen Design</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="mt-6 px-4">
        {navigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <div
                className={cn(
                  "flex items-center px-4 py-3 text-sm font-medium rounded-lg mb-1 transition-colors cursor-pointer",
                  isActive
                    ? "bg-swag-primary/20 text-swag-primary nav-item active"
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                )}
              >
                <item.icon className="mr-3" size={20} />
                {item.name}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Pacman Game Modal */}
      <PacmanGame 
        isOpen={isPacmanOpen} 
        onClose={() => setIsPacmanOpen(false)} 
      />
    </div>
  );
}
