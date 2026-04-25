import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { marginColorClass } from "@/hooks/useMarginSettings";
import type { Order } from "@shared/schema";
import { useFinancialSummaryCard } from "./hooks";

interface FinancialSummaryCardProps {
  order: Order;
  marginSettings: { minimumMargin: number; defaultMargin: number };
}

export default function FinancialSummaryCard({
  order,
  marginSettings,
}: FinancialSummaryCardProps) {
  const { taxCodes } = useFinancialSummaryCard();

  const taxAmount = Number(order.tax || 0);
  const activeTaxCode = taxCodes?.find((tc) => String(tc.id) === order?.defaultTaxCodeId);

  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Financial Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Subtotal</span>
          <span>${Number(order.subtotal || 0).toFixed(2)}</span>
        </div>
        {Number(order?.shipping || 0) > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Shipping</span>
            <span>${Number(order.shipping || 0).toFixed(2)}</span>
          </div>
        )}
        <div className={`flex justify-between text-sm items-center ${taxAmount > 0 ? "bg-amber-50 -mx-6 px-6 py-1.5 rounded" : ""}`}>
          <span className="text-gray-500 flex items-center gap-1.5">
            Tax
            {activeTaxCode && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-normal">
                {activeTaxCode.isExempt ? "Exempt" : `${activeTaxCode.label} · ${activeTaxCode.rate}%`}
              </Badge>
            )}
          </span>
          <span className={taxAmount > 0 ? "font-medium text-amber-700" : ""}>
            ${taxAmount.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between text-sm font-bold border-t pt-2">
          <span>Total</span>
          <span>${Number(order.total || 0).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm" title={`Min: ${marginSettings.minimumMargin}% | Target: ${marginSettings.defaultMargin}%`}>
          <span className="text-gray-500">Margin</span>
          <span className={`font-medium ${marginColorClass(Number(order?.margin || 0), marginSettings)}`}>
            {Number(order?.margin || 0).toFixed(1)}%
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
