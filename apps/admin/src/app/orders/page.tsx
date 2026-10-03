import React, { useEffect, useState } from "react";
import {
  formatMoney,
  type AdminOrder,
  type OrderStatus,
} from "@ecommerce/contracts";
import { PackageIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/date-range-picker";
import { toIsoRange } from "@/lib/date-range";
import { AdminLayout } from "@/components/admin-layout";
import { OrderDetail } from "@/components/orders/order-detail";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { TablePagination } from "@/components/table-pagination";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminOrders, useOrderCounts } from "@/lib/hooks/use-orders";
import { formatDate } from "@/lib/utils";
import type { AdminRoute } from "@/lib/routes";

type TabKey = "all" | OrderStatus;

const TABS: { value: TabKey; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Verify payment" },
  { value: "processing", label: "Confirmed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const SHIPPING = [
  { value: "all", label: "Any shipping" },
  { value: "standard", label: "Standard" },
  { value: "express", label: "Express" },
  { value: "next-day", label: "Next day" },
] as const;

const COL_COUNT = 5; // order + customer + total + status + placed

export default function OrdersPage({
  onNavigate,
}: {
  onNavigate: (route: AdminRoute) => void;
}): React.ReactElement {
  const [tab, setTab] = useState<TabKey>("all");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [dates, setDates] = useState<DateRange | undefined>();
  const [shipping, setShipping] = useState<string>("all");
  // Oldest-first suits the Verify payment queue (longest wait first); the admin can override.
  const [sortChoice, setSortChoice] = useState<"newest" | "oldest" | null>(
    null,
  );

  // Wait for a pause in typing before hitting the API.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, isError, isPlaceholderData } = useAdminOrders({
    status: tab === "all" ? undefined : tab,
    q: debounced,
    ...toIsoRange(dates),
    shippingMethod: shipping === "all" ? undefined : (shipping as never),
    sort: sortChoice ?? (tab === "pending" ? "oldest" : "newest"),
    page: pageIndex + 1,
    limit: pageSize,
  });
  const { data: counts } = useOrderCounts();

  const rows = data?.orders ?? [];
  const total = data?.meta.total ?? 0;
  const pageCount = data?.meta.totalPages ?? 1;

  // Keep a snapshot so the drawer survives its order leaving the current page
  // (e.g. "Mark shipped" while the Confirmed tab is open); fresh data wins.
  const [snapshot, setSnapshot] = useState<AdminOrder | null>(null);
  const selected = snapshot
    ? (rows.find((o) => o.id === snapshot.id) ?? snapshot)
    : null;

  return (
    <AdminLayout title="Orders" activeRoute="orders" onNavigate={onNavigate}>
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs
            value={tab}
            onValueChange={(v) => {
              setTab(v as TabKey);
              setPageIndex(0);
            }}
            className="max-w-full overflow-x-auto"
          >
            <TabsList>
              {TABS.map((t) => (
                <TabsTrigger key={t.value} value={t.value}>
                  {t.label}
                  {!!counts?.[t.value] && (
                    <Badge variant="secondary" className="ml-1.5">
                      {counts[t.value]}
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <Input
            placeholder="Search name, email, phone or order id"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPageIndex(0);
            }}
            className="h-8 w-48 lg:w-72"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <DateRangePicker
            value={dates}
            onChange={(r) => {
              setDates(r);
              setPageIndex(0);
            }}
            placeholder="Placed on any date"
          />
          <Select
            value={shipping}
            onValueChange={(v) => {
              setShipping(v ?? "all");
              setPageIndex(0);
            }}
            items={SHIPPING as unknown as { value: string; label: string }[]}
          >
            <SelectTrigger size="sm" className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SHIPPING.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={sortChoice ?? (tab === "pending" ? "oldest" : "newest")}
            onValueChange={(v) => {
              setSortChoice(v as "newest" | "oldest");
              setPageIndex(0);
            }}
            items={[
              { value: "newest", label: "Newest first" },
              { value: "oldest", label: "Oldest first" },
            ]}
          >
            <SelectTrigger size="sm" className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div
          className={`overflow-hidden rounded-lg border transition-opacity ${isPlaceholderData ? "opacity-60" : ""}`}
        >
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted">
              <TableRow className="h-10">
                <TableHead className="pl-4">Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-4">Placed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [0, 1, 2, 3].map((i) => (
                  <TableRow key={i} className="h-12">
                    <TableCell colSpan={COL_COUNT} className="px-4">
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell
                    colSpan={COL_COUNT}
                    className="h-40 text-center text-muted-foreground"
                  >
                    Couldn&apos;t load orders.
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={COL_COUNT} className="h-40 p-0">
                    <div className="flex flex-col items-center gap-3 py-16 text-center">
                      <PackageIcon className="size-10 text-muted-foreground/30" />
                      <p className="text-sm font-medium text-muted-foreground">
                        {debounced ||
                        tab !== "all" ||
                        dates ||
                        shipping !== "all"
                          ? "No orders match."
                          : "No orders yet."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((o) => (
                  <TableRow key={o.id} className="h-12">
                    <TableCell className="pl-4 font-medium">
                      <button
                        type="button"
                        onClick={() => setSnapshot(o)}
                        className="cursor-pointer hover:underline"
                      >
                        #{o.id.slice(-8)}
                      </button>
                    </TableCell>
                    <TableCell>
                      {o.shippingAddress.firstName} {o.shippingAddress.lastName}
                      <div className="text-xs text-muted-foreground">
                        {o.contactEmail}
                      </div>
                    </TableCell>
                    <TableCell>{formatMoney(o.totalPrice)}</TableCell>
                    <TableCell>
                      <OrderStatusBadge status={o.status} />
                    </TableCell>
                    <TableCell className="pr-4">
                      {formatDate(o.createdAt)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <TablePagination
          totalCount={total}
          pageIndex={pageIndex}
          pageSize={pageSize}
          pageCount={pageCount}
          onPageChange={setPageIndex}
          onPageSizeChange={(s) => {
            setPageSize(s);
            setPageIndex(0);
          }}
          itemLabel="order"
          countSuffix={debounced ? `matching "${debounced}"` : undefined}
        />
      </div>

      <OrderDetail
        order={selected}
        open={selected !== null}
        onOpenChange={(open) => !open && setSnapshot(null)}
      />
    </AdminLayout>
  );
}
