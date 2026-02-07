import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, ShoppingCart, Percent, Users, TrendingUp, TrendingDown } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative";
  icon: "dollar" | "cart" | "percentage" | "users";
  loading?: boolean;
}

const iconMap = {
  dollar: DollarSign,
  cart: ShoppingCart,
  percentage: Percent,
  users: Users,
};

const iconColorMap = {
  dollar: "text-green-600 bg-green-100",
  cart: "text-blue-600 bg-blue-100",
  percentage: "text-yellow-600 bg-yellow-100",
  users: "text-purple-600 bg-purple-100",
};

export default function KPICard({ title, value, change, changeType, icon, loading }: KPICardProps) {
  const IconComponent = iconMap[icon];
  const iconColors = iconColorMap[icon];

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="w-12 h-12 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className={`text-sm mt-1 flex items-center ${
              changeType === "positive" ? "text-green-600" : "text-red-600"
            }`}>
              {changeType === "positive" ? (
                <TrendingUp size={16} className="mr-1" />
              ) : (
                <TrendingDown size={16} className="mr-1" />
              )}
              {change}
            </p>
          </div>
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${iconColors}`}>
            <IconComponent size={24} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
