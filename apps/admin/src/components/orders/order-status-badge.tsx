import type { OrderStatus } from "@ecommerce/contracts";
import { Badge } from "@/components/ui/badge";

const LABEL: Record<OrderStatus, string> = {
  pending: "Verify payment",
  processing: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const variant =
    status === "pending"
      ? "default"
      : status === "cancelled"
        ? "destructive"
        : "secondary";
  return <Badge variant={variant}>{LABEL[status]}</Badge>;
}
