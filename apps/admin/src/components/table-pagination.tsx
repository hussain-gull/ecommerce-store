import {
  ChevronsLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsRightIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50];

export interface TablePaginationProps {
  /** Total number of items after filtering */
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  pageCount: number;
  onPageChange: (index: number) => void;
  onPageSizeChange: (size: number) => void;
  /** Shown in the left summary, e.g. "message" → "3 messages" */
  itemLabel?: string;
  /** Optional extra detail appended to the count, e.g. 'matching "shoes"' */
  countSuffix?: string;
}

export function TablePagination({
  totalCount,
  pageIndex,
  pageSize,
  pageCount,
  onPageChange,
  onPageSizeChange,
  itemLabel = "item",
  countSuffix,
}: TablePaginationProps) {
  const safeIndex = Math.min(pageIndex, Math.max(0, pageCount - 1));
  const plural = totalCount === 1 ? itemLabel : `${itemLabel}s`;

  return (
    <div className="flex items-center justify-between px-4">
      {/* Left: count summary */}
      <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
        {totalCount} {plural}
        {countSuffix && ` ${countSuffix}`}
      </div>

      <div className="flex w-full items-center gap-8 lg:w-fit">
        {/* Rows per page */}
        <div className="hidden items-center gap-2 lg:flex">
          <Label htmlFor="rpp" className="text-sm font-medium">
            Rows per page
          </Label>
          <Select
            value={`${pageSize}`}
            onValueChange={(v) => {
              if (!v) return;
              onPageSizeChange(Number(v));
              onPageChange(0);
            }}
            items={PAGE_SIZE_OPTIONS.map((n) => ({
              label: `${n}`,
              value: `${n}`,
            }))}
          >
            <SelectTrigger size="sm" className="w-20" id="rpp">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              <SelectGroup>
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <SelectItem key={n} value={`${n}`}>
                    {n}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {/* Page info */}
        <div className="flex w-fit items-center justify-center text-sm font-medium">
          Page {safeIndex + 1} of {pageCount}
        </div>

        {/* Navigation */}
        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => onPageChange(0)}
            disabled={safeIndex === 0}
          >
            <span className="sr-only">First page</span>
            <ChevronsLeftIcon />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => onPageChange(Math.max(0, safeIndex - 1))}
            disabled={safeIndex === 0}
          >
            <span className="sr-only">Previous page</span>
            <ChevronLeftIcon />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => onPageChange(Math.min(pageCount - 1, safeIndex + 1))}
            disabled={safeIndex >= pageCount - 1}
          >
            <span className="sr-only">Next page</span>
            <ChevronRightIcon />
          </Button>
          <Button
            variant="outline"
            className="hidden size-8 lg:flex"
            size="icon"
            onClick={() => onPageChange(pageCount - 1)}
            disabled={safeIndex >= pageCount - 1}
          >
            <span className="sr-only">Last page</span>
            <ChevronsRightIcon />
          </Button>
        </div>
      </div>
    </div>
  );
}
