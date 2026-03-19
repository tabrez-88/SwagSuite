import { FilesTab } from "@/components/feature/FilesTab";
import type { ProjectData } from "@/types/project-types";

interface FilesSectionProps {
  orderId: string;
  data: ProjectData;
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
