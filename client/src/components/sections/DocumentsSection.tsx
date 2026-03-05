import { DocumentsTab } from "@/components/DocumentsTab";
import type { ProjectData } from "@/types/project-types";

interface DocumentsSectionProps {
  orderId: string;
  data: ProjectData;
}

// Replicate the helper functions needed by DocumentsTab
function getEditedItem(_id: string, item: any) {
  return {
    id: item.id,
    productId: item.productId,
    productName: item.productName,
    productSku: item.productSku,
    supplierId: item.supplierId,
    color: item.color || "",
    quantity: item.quantity || 0,
    unitPrice: parseFloat(item.unitPrice) || 0,
    cost: parseFloat(item.cost || 0),
    decorationCost: parseFloat(item.decorationCost || 0),
    charges: parseFloat(item.charges || 0),
    margin: 44,
    sizePricing: item.sizePricing || {},
  };
}

function calculateItemTotals(item: any) {
  const { quantity, unitPrice, decorationCost, charges, cost, uomFactory } = item;
  const productTotal = quantity * unitPrice;
  const decorationPercent = decorationCost || 0;
  const chargesPercent = charges || 0;
  const decorationTotal = (decorationPercent / 100) * productTotal;
  const subtotalAfterDecoration = productTotal + decorationTotal;
  const chargesTotal = (chargesPercent / 100) * subtotalAfterDecoration;
  const total = productTotal + decorationTotal + chargesTotal;
  const productCostTotal = (cost || 0) * quantity;
  const productMargin = productTotal > 0 ? ((productTotal - productCostTotal) / productTotal) * 100 : 0;
  const totalCost = productCostTotal + decorationTotal + chargesTotal;
  const totalMargin = total > 0 ? ((total - totalCost) / total) * 100 : 0;
  const factoryQuantity = uomFactory && uomFactory > 0 ? Math.ceil(quantity / uomFactory) : quantity;

  return { productTotal, decorationTotal, chargesTotal, total, productMargin, totalMargin, factoryQuantity };
}

export default function DocumentsSection({ orderId, data }: DocumentsSectionProps) {
  return (
    <div className="space-y-6">
      <DocumentsTab
        orderId={orderId}
        order={data.order as any}
        orderItems={data.orderItems}
        companyName={data.companyName}
        primaryContact={data.primaryContact}
        orderVendors={data.orderVendors}
        getEditedItem={getEditedItem}
        calculateItemTotals={calculateItemTotals}
      />
    </div>
  );
}
