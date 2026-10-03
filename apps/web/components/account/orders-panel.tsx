"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Check,
  ChevronDown,
  Clock,
  MapPin,
  Package,
  Truck,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  formatMoney,
  type CustomerOrder,
  type OrderStatus,
} from "@ecommerce/contracts";
import { useMyOrders } from "@/lib/hooks/use-orders";
import { useAuthStore } from "@/lib/store/auth.store";

const STATUS: Record<OrderStatus, { label: string; cls: string }> = {
  pending: { label: "Verifying payment", cls: "bg-wash text-foreground" },
  processing: { label: "Accepted", cls: "bg-foreground text-white" },
  shipped: { label: "Shipped", cls: "bg-foreground text-white" },
  delivered: { label: "Delivered", cls: "bg-accent text-white" },
  cancelled: { label: "Cancelled", cls: "bg-red-50 text-red-700" },
};

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export function OrdersPanel() {
  const user = useAuthStore((s) => s.user);
  const { data: orders = null, isError: failed } = useMyOrders();
  // The newest order starts open — it's the one people come to check on.
  const [picked, setPicked] = useState<string | null | undefined>(undefined);
  const open = picked === undefined ? (orders?.[0]?.id ?? null) : picked;
  const setOpen = setPicked;

  return (
    <div>
      <h2 className="text-xs font-bold tracking-widest uppercase text-foreground mb-6 pb-3 border-b border-line">
        Order History
      </h2>

      {!user ? (
        <p className="text-[13px] text-secondary">
          Sign in to see your orders.
        </p>
      ) : failed ? (
        <p role="alert" className="text-[13px] text-accent">
          Couldn&apos;t load your orders. Please refresh the page.
        </p>
      ) : orders === null ? (
        <div className="flex flex-col gap-3" aria-busy>
          {[0, 1].map((i) => (
            <div
              key={i}
              className="h-20 bg-surface border border-line animate-pulse"
            />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-surface border border-line">
          <Package size={36} className="text-muted mx-auto mb-4" />
          <p className="text-foreground font-bold text-[13px] uppercase tracking-widest mb-2">
            No orders yet
          </p>
          <p className="text-[13px] text-secondary mb-5">
            When you place an order it will appear here.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center h-10 px-6 bg-foreground text-white text-[11px] font-bold tracking-[2px] uppercase no-underline hover:bg-accent transition-colors"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <ul className="list-none m-0 p-0 flex flex-col gap-4">
          {orders.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              open={open === o.id}
              onToggle={() => setOpen(open === o.id ? null : o.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function OrderCard({
  order: o,
  open,
  onToggle,
}: {
  order: CustomerOrder;
  open: boolean;
  onToggle: () => void;
}) {
  const a = o.shippingAddress;
  const count = o.items.reduce((n, i) => n + i.quantity, 0);
  const subtotal = Number(o.totalPrice) - Number(o.shippingCost);
  const s = STATUS[o.status];
  const panelId = `order-${o.id}`;

  return (
    <li className="border border-line bg-white">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="w-full flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-4 bg-transparent border-none cursor-pointer text-left hover:bg-surface transition-colors"
      >
        <div className="min-w-24">
          <div className="text-[10px] font-bold uppercase tracking-widest text-secondary">
            Order
          </div>
          <div className="text-[14px] font-bold text-foreground">
            #{o.id.slice(-8)}
          </div>
        </div>
        <div className="min-w-28">
          <div className="text-[10px] font-bold uppercase tracking-widest text-secondary">
            Placed
          </div>
          <div className="text-[13px] text-foreground">
            {new Date(o.createdAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-secondary">
            Total
          </div>
          <div className="text-[13px] font-semibold text-foreground">
            {formatMoney(o.totalPrice)}{" "}
            <span className="font-normal text-secondary">
              · {count} {count === 1 ? "item" : "items"}
            </span>
          </div>
        </div>
        <span
          className={`ml-auto inline-block text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 ${s.cls}`}
        >
          {s.label}
        </span>
        <ChevronDown
          size={16}
          aria-hidden
          className={`text-secondary transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          id={panelId}
          className="grid gap-8 px-5 pb-6 pt-5 border-t border-line md:grid-cols-[1fr_1fr]"
        >
          <section aria-label="Order progress">
            <h3 className="m-0 mb-4 text-[11px] font-bold uppercase tracking-widest text-foreground">
              Order progress
            </h3>
            <Timeline order={o} />
          </section>

          <section aria-label="Order details" className="flex flex-col gap-5">
            <div>
              <h3 className="m-0 mb-3 text-[11px] font-bold uppercase tracking-widest text-foreground">
                Items
              </h3>
              <ul className="list-none m-0 p-0 flex flex-col gap-2">
                {o.items.map((i, idx) => (
                  <li
                    key={idx}
                    className="flex justify-between gap-4 text-[13px]"
                  >
                    <span className="text-foreground">
                      {i.name}
                      <span className="text-secondary">
                        {" "}
                        × {i.quantity}
                        {i.size && ` · Size ${i.size}`}
                        {i.color && ` · ${i.color}`}
                      </span>
                    </span>
                    <span className="shrink-0 text-foreground">
                      {formatMoney(String(Number(i.price) * i.quantity))}
                    </span>
                  </li>
                ))}
              </ul>
              <dl className="m-0 mt-3 pt-3 border-t border-line text-[13px] grid grid-cols-[1fr_auto] gap-y-1">
                <dt className="text-secondary">Subtotal</dt>
                <dd className="m-0 text-right">
                  {formatMoney(String(subtotal))}
                </dd>
                <dt className="text-secondary">
                  Shipping ({o.shippingMethod})
                </dt>
                <dd className="m-0 text-right">
                  {formatMoney(o.shippingCost)}
                </dd>
                <dt className="font-bold text-foreground">Total paid</dt>
                <dd className="m-0 text-right font-bold text-foreground">
                  {formatMoney(o.totalPrice)}
                </dd>
              </dl>
            </div>

            <div className="text-[13px]">
              <h3 className="m-0 mb-2 text-[11px] font-bold uppercase tracking-widest text-foreground">
                Delivering to
              </h3>
              <p className="m-0 flex gap-2 text-secondary">
                <MapPin size={14} className="mt-0.5 shrink-0" aria-hidden />
                <span>
                  {a.firstName} {a.lastName}
                  <br />
                  {a.line1}
                  {a.line2 ? `, ${a.line2}` : ""}
                  <br />
                  {a.city} {a.postcode}, {a.country}
                </span>
              </p>
            </div>
          </section>
        </div>
      )}
    </li>
  );
}

type Step = {
  key: string;
  title: string;
  note?: string;
  at?: string;
  state: "done" | "current" | "todo" | "failed";
  Icon: LucideIcon;
};

// Builds the timeline from the recorded status events: placement → payment
// verification → accepted → shipped → delivered, with a red terminal step when
// the order was cancelled (and the steps after it dropped).
export function buildSteps(o: CustomerOrder): Step[] {
  const at = (s: OrderStatus) => o.events.find((e) => e.status === s)?.at;
  const placed = at("pending") ?? o.createdAt;
  const accepted = at("processing");
  const shipped = at("shipped");
  const delivered = at("delivered");
  const cancelled = at("cancelled");
  // Cancelled before it was ever accepted = the payment wasn't accepted.
  const rejected = !!cancelled && !accepted;

  const steps: Step[] = [
    {
      key: "placed",
      title: "Order placed",
      note: "We received your order and payment screenshot.",
      at: placed,
      state: "done",
      Icon: Check,
    },
    {
      key: "verify",
      title: rejected ? "Payment not verified" : "Payment verification",
      note: rejected
        ? "We couldn't verify your JazzCash payment, so the order was cancelled and your items released. Contact us if you think this is a mistake."
        : accepted || cancelled
          ? "Your JazzCash payment was verified."
          : "We're checking your JazzCash payment. This usually takes a short while.",
      at: rejected ? cancelled : accepted,
      state: rejected ? "failed" : accepted || cancelled ? "done" : "current",
      Icon: rejected ? X : accepted || cancelled ? Check : Clock,
    },
  ];
  if (rejected) return steps;

  steps.push({
    key: "accepted",
    title: "Order accepted",
    note: "Your order is confirmed and being prepared.",
    at: accepted,
    state: accepted ? "done" : "todo",
    Icon: Package,
  });
  if (cancelled) {
    steps.push({
      key: "cancelled",
      title: "Order cancelled",
      note: "This order was cancelled and the items returned to stock.",
      at: cancelled,
      state: "failed",
      Icon: X,
    });
    return steps;
  }
  steps.push(
    {
      key: "shipped",
      title: "Shipped",
      note: "On its way to you.",
      at: shipped,
      state: shipped ? "done" : "todo",
      Icon: Truck,
    },
    {
      key: "delivered",
      title: "Delivered",
      at: delivered,
      state: delivered ? "done" : "todo",
      Icon: Check,
    },
  );
  // The first not-done step after the last done one is "current".
  const next = steps.findIndex((s) => s.state === "todo");
  if (next > 0 && steps[next - 1]!.state === "done") {
    steps[next]!.state = "current";
  }
  return steps;
}

const DOT: Record<Step["state"], string> = {
  done: "bg-foreground text-white border-foreground",
  current: "bg-white text-accent border-accent",
  todo: "bg-white text-muted border-line",
  failed: "bg-red-600 text-white border-red-600",
};

function Timeline({ order }: { order: CustomerOrder }) {
  const steps = buildSteps(order);
  return (
    <ol className="list-none m-0 p-0">
      {steps.map((s, i) => (
        <li key={s.key} className="relative flex gap-3 pb-5 last:pb-0">
          {i < steps.length - 1 && (
            <span
              aria-hidden
              className={`absolute left-[13px] top-7 bottom-0 w-px ${
                s.state === "done" ? "bg-foreground" : "bg-line"
              }`}
            />
          )}
          <span
            className={`relative z-1 flex size-7 shrink-0 items-center justify-center rounded-full border ${DOT[s.state]} ${
              s.state === "current" ? "ring-4 ring-accent/15" : ""
            }`}
          >
            <s.Icon size={13} aria-hidden />
          </span>
          <div className="min-w-0 pt-0.5">
            <div
              className={`text-[13px] font-semibold ${
                s.state === "todo"
                  ? "text-muted"
                  : s.state === "failed"
                    ? "text-red-700"
                    : "text-foreground"
              }`}
            >
              {s.title}
              <span className="sr-only"> — {s.state}</span>
            </div>
            {s.at && (
              <div className="text-[12px] text-secondary">{when(s.at)}</div>
            )}
            {s.note && s.state !== "todo" && (
              <p className="m-0 mt-1 text-[12px] leading-relaxed text-secondary">
                {s.note}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
