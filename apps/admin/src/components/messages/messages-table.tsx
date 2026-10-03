import { useEffect, useState } from "react";
import type { DateRange } from "react-day-picker";
import { MailIcon, MailOpenIcon, InboxIcon } from "lucide-react";
import type { ContactMessage } from "@ecommerce/contracts";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";
import { DateRangePicker } from "@/components/date-range-picker";
import { toIsoRange } from "@/lib/date-range";
import { useContactMessages, useMessageCounts } from "@/lib/hooks/use-messages";
import { TablePagination } from "@/components/table-pagination";

// ─── Types ────────────────────────────────────────────────────────────────────

type TabKey = "all" | "new" | "read";

// ─── Internal helpers ─────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="flex flex-col gap-0">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-4 border-b px-4 py-3">
          <Skeleton className="size-4 rounded-sm" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="ml-auto h-4 w-32" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <InboxIcon className="size-10 text-muted-foreground/30" />
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export interface MessagesTableProps {
  onOpen: (msg: ContactMessage) => void;
}

export function MessagesTable({ onOpen }: MessagesTableProps) {
  const [tab, setTab] = useState<TabKey>("all");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [dates, setDates] = useState<DateRange | undefined>();
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Wait for a pause in typing before hitting the API.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, isError, isPlaceholderData } = useContactMessages({
    status: tab === "all" ? undefined : tab,
    q: debounced,
    ...toIsoRange(dates),
    page: pageIndex + 1,
    limit: pageSize,
  });
  const { data: counts } = useMessageCounts();

  const pageRows = data?.messages ?? [];
  const filteredTotal = data?.meta.total ?? 0;
  const pageCount = data?.meta.totalPages ?? 1;
  const total = counts?.all ?? 0;
  const unreadCount = counts?.new ?? 0;

  const colCount = 7; // icon + subject + description + name + phone + email + received

  function handleSearch(value: string) {
    setSearch(value);
    setPageIndex(0);
  }

  function handleTab(value: string | null) {
    if (!value) return;
    setTab(value as TabKey);
    setPageIndex(0);
  }

  return (
    <Tabs
      value={tab}
      onValueChange={handleTab}
      className="w-full flex-col justify-start gap-6"
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 lg:px-6">
        <TabsList className="hidden @4xl/main:flex">
          <TabsTrigger value="all">
            All
            {total > 0 && (
              <Badge variant="secondary" className="ml-1.5">
                {total}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="new">
            Unread
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-1.5">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="read">Read</TabsTrigger>
        </TabsList>

        <Select
          value={tab}
          onValueChange={handleTab}
          items={[
            { label: "All", value: "all" },
            { label: "Unread", value: "new" },
            { label: "Read", value: "read" },
          ]}
        >
          <SelectTrigger className="flex w-fit @4xl/main:hidden" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="new">Unread</SelectItem>
              <SelectItem value="read">Read</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        <div className="flex flex-wrap items-center gap-2">
          <DateRangePicker
            value={dates}
            onChange={(r) => {
              setDates(r);
              setPageIndex(0);
            }}
            placeholder="Received on any date"
          />
          <Input
            placeholder="Search name, email, phone, subject…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="h-8 w-48 lg:w-72"
          />
        </div>
      </div>

      {/* Table panel — same content for every tab, filtered by the API */}
      {(["all", "new", "read"] as TabKey[]).map((t) => (
        <TabsContent
          key={t}
          value={t}
          className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
        >
          <div
            className={`overflow-hidden rounded-lg border transition-opacity ${isPlaceholderData ? "opacity-60" : ""}`}
          >
            {isLoading ? (
              <TableSkeleton />
            ) : isError ? (
              <div className="px-6 py-4">
                <p className="text-sm text-destructive">
                  Failed to load messages. Please try again.
                </p>
              </div>
            ) : (
              <Table className="[&_tr>*:first-child]:pl-6 [&_tr>*:last-child]:pr-6">
                <TableHeader className="sticky top-0 z-10 bg-muted">
                  <TableRow className="h-10">
                    <TableHead className="w-8" />
                    <TableHead>Subject</TableHead>
                    <TableHead className="max-w-xs">Description</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="w-36">Received</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="**:data-[slot=table-cell]:first:w-8">
                  {pageRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={colCount} className="h-40 p-0">
                        <EmptyState
                          label={
                            debounced || dates
                              ? "No messages match your filters."
                              : t === "new"
                                ? "No unread messages."
                                : t === "read"
                                  ? "No read messages yet."
                                  : "No messages yet."
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    pageRows.map((msg) => (
                      <TableRow
                        key={msg.id}
                        className="h-12"
                        data-unread={msg.status === "new"}
                      >
                        <TableCell className="w-8">
                          {msg.status === "new" ? (
                            <MailIcon className="size-4 text-primary" />
                          ) : (
                            <MailOpenIcon className="size-4 text-muted-foreground" />
                          )}
                        </TableCell>

                        <TableCell className="max-w-50">
                          <span
                            onClick={() => onOpen(msg)}
                            className="flex min-w-0 cursor-pointer items-center gap-2"
                          >
                            <span
                              className={`truncate underline underline-offset-2 decoration-transparent hover:decoration-current transition-colors${msg.status === "new" ? " font-semibold" : ""}`}
                            >
                              {msg.subject}
                            </span>
                            {msg.status === "new" && (
                              <Badge
                                variant="default"
                                className="shrink-0 text-xs"
                              >
                                New
                              </Badge>
                            )}
                          </span>
                        </TableCell>

                        <TableCell className="max-w-xs overflow-hidden">
                          <span className="block truncate text-sm text-muted-foreground">
                            {msg.message}
                          </span>
                        </TableCell>

                        <TableCell className="max-w-35 overflow-hidden">
                          <span
                            className={`block truncate${msg.status === "new" ? " font-semibold" : ""}`}
                          >
                            {msg.name}
                          </span>
                        </TableCell>

                        <TableCell className="text-sm text-muted-foreground">
                          {msg.phone || "—"}
                        </TableCell>

                        <TableCell className="max-w-45 overflow-hidden text-sm text-muted-foreground">
                          <span className="block truncate">{msg.email}</span>
                        </TableCell>

                        <TableCell className="w-36 text-sm text-muted-foreground">
                          {formatDate(msg.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>

          <TablePagination
            totalCount={filteredTotal}
            pageIndex={pageIndex}
            pageSize={pageSize}
            pageCount={pageCount}
            onPageChange={setPageIndex}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setPageIndex(0);
            }}
            itemLabel="message"
            countSuffix={debounced ? `matching "${debounced}"` : undefined}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}
