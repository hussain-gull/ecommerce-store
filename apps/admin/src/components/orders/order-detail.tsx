import React, { useState } from "react";
import { formatMoney, type AdminOrder } from "@ecommerce/contracts";
import {
  ClockIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  UserIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";
import { DetailField } from "@/components/detail-field";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { PaymentProofAdvisory } from "@/components/orders/payment-proof-advisory";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  useConfirmOrder,
  useCancelOrder,
  useSetOrderStatus,
} from "@/lib/hooks/use-orders";
import { formatDate } from "@/lib/utils";

export function OrderDetail({
  order,
  open,
  onOpenChange,
}: {
  order: AdminOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isMobile = useIsMobile();
  const confirm = useConfirmOrder();
  const cancel = useCancelOrder();
  const setStatus = useSetOrderStatus();
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  const close = () => {
    setConfirmingCancel(false);
    onOpenChange(false);
  };

  return (
    <Drawer
      open={open}
      onOpenChange={(o) => (o ? onOpenChange(o) : close())}
      swipeDirection={isMobile ? "down" : "right"}
    >
      <DrawerContent
        style={{ "--drawer-content-width": "560px" } as React.CSSProperties}
      >
        {order && (
          <>
            <DrawerHeader className="gap-1">
              <div className="flex items-center justify-between gap-3">
                <DrawerTitle>Order #{order.id.slice(-8)}</DrawerTitle>
                <OrderStatusBadge status={order.status} />
              </div>
              <DrawerDescription>
                Total {formatMoney(order.totalPrice)} (shipping{" "}
                {formatMoney(order.shippingCost)}, {order.shippingMethod})
              </DrawerDescription>
            </DrawerHeader>

            <div className="flex flex-col gap-4 overflow-y-auto px-4 pb-6 text-sm">
              <Separator className="mt-2" />

              <div className="grid grid-cols-2 gap-4">
                <DetailField icon={UserIcon} label="Customer">
                  {order.shippingAddress.firstName}{" "}
                  {order.shippingAddress.lastName}
                </DetailField>
                <DetailField icon={MailIcon} label="Email">
                  <a
                    href={`mailto:${order.contactEmail}`}
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    {order.contactEmail}
                  </a>
                </DetailField>
                {order.contactPhone && (
                  <DetailField icon={PhoneIcon} label="Phone">
                    <a
                      href={`tel:${order.contactPhone}`}
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      {order.contactPhone}
                    </a>
                  </DetailField>
                )}
                <DetailField icon={ClockIcon} label="Placed">
                  {formatDate(order.createdAt)}
                </DetailField>
              </div>

              <DetailField icon={MapPinIcon} label="Ship to">
                {[
                  order.shippingAddress.line1,
                  order.shippingAddress.line2,
                  order.shippingAddress.city,
                  order.shippingAddress.postcode,
                  order.shippingAddress.country,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </DetailField>

              <Separator />

              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Items
                </span>
                <ul className="flex flex-col gap-1.5">
                  {order.items.map((i, idx) => (
                    <li key={idx} className="flex justify-between gap-3">
                      <span>
                        {i.quantity} × {i.name}
                        {(i.size || i.color) &&
                          ` (${[i.size, i.color].filter(Boolean).join(", ")})`}
                      </span>
                      <span className="shrink-0">{formatMoney(i.price)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Separator />

              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  JazzCash payment screenshot
                  {order.paymentSubmittedAt &&
                    ` — ${formatDate(order.paymentSubmittedAt)}`}
                </span>
                {order.paymentScreenshotUrl ? (
                  <a
                    href={order.paymentScreenshotUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <img
                      src={order.paymentScreenshotUrl}
                      alt="Payment screenshot"
                      className="max-h-96 w-full rounded-md border object-contain"
                    />
                  </a>
                ) : (
                  <p className="text-muted-foreground">No screenshot.</p>
                )}
                {order.status === "pending" && order.paymentScreenshotUrl && (
                  <PaymentProofAdvisory order={order} />
                )}
              </div>
            </div>

            <DrawerFooter>
              {order.status === "pending" && (
                <Button
                  disabled={confirm.isPending}
                  onClick={() => confirm.mutate(order.id, { onSuccess: close })}
                >
                  {confirm.isPending
                    ? "Confirming…"
                    : "Confirm order (payment verified)"}
                </Button>
              )}
              {order.status === "processing" && (
                <Button
                  disabled={setStatus.isPending}
                  onClick={() =>
                    setStatus.mutate({ id: order.id, status: "shipped" })
                  }
                >
                  Mark shipped
                </Button>
              )}
              {(order.status === "processing" ||
                order.status === "shipped") && (
                <Button
                  variant={order.status === "shipped" ? "default" : "outline"}
                  disabled={setStatus.isPending}
                  onClick={() =>
                    setStatus.mutate({ id: order.id, status: "delivered" })
                  }
                >
                  Mark delivered
                </Button>
              )}
              {(order.status === "pending" || order.status === "processing") &&
                (confirmingCancel ? (
                  <Button
                    variant="destructive"
                    disabled={cancel.isPending}
                    onClick={() =>
                      cancel.mutate(order.id, { onSuccess: close })
                    }
                  >
                    {cancel.isPending
                      ? "Cancelling…"
                      : "Click again to cancel & restock"}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setConfirmingCancel(true)}
                  >
                    Cancel order
                  </Button>
                ))}
              <DrawerClose render={<Button variant="outline" />}>
                Close
              </DrawerClose>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
