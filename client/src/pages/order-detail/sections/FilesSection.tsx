import { FilesTab } from "@/components/FilesTab";
import type { useOrderDetailData } from "../hooks/useOrderDetailData";

interface FilesSectionProps {
  orderId: string;
  data: ReturnType<typeof useOrderDetailData>;
}

export default function FilesSection({ orderId, data }: FilesSectionProps) {
  return (
    <div className="space-y-6">
      <FilesTab
        orderId={orderId}
        products={data.orderItems.map((item: any) => ({
          id: item.id,
          productName: item.productName,
          color: item.color,
          size: item.size,
          quantity: item.quantity,
        }))}
        artworkItems={data.allArtworkItems}
      />
    </div>
  );
}
