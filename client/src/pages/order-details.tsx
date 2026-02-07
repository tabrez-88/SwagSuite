import { useParams } from "wouter";
import OrderDetailsModal from "@/components/OrderDetailsModal";

export default function OrderDetailsPage() {
  const { orderId } = useParams<{ orderId: string }>();

  return (
    <OrderDetailsModal
      open={false}
      onOpenChange={() => {}}
      orderId={orderId || null}
      pageMode
    />
  );
}
