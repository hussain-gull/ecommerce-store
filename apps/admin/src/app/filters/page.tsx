import React, { Fragment, useMemo, useState } from "react";
import { ListFilterIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import type { FilterOption, FilterOptionKind } from "@ecommerce/contracts";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { ColorPicker } from "@/components/ui/color-picker";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TablePagination } from "@/components/table-pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useFilterOptionsByKind,
  useFilterOptionUsage,
  useCreateFilterOption,
  useUpdateFilterOption,
  useDeleteFilterOption,
} from "@/lib/hooks/use-filter-options";
import type { AdminRoute } from "@/lib/routes";

function FilterEmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <ListFilterIcon className="size-8 text-muted-foreground/30" />
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

// This page is the single place shop filters (apps/web/components/shop/filters-panel.tsx)
// are curated. "category" gets a dedicated tree section (parent/subcategory); the other
// four kinds share one row-editor component since they're flat lists in the same table.
const FLAT_FILTER_KINDS: { kind: FilterOptionKind; label: string }[] = [
  { kind: "brand", label: "Brands" },
  { kind: "surface", label: "Surfaces" },
  { kind: "size", label: "Sizes" },
  { kind: "colour", label: "Colours" },
  { kind: "condition", label: "Conditions" },
];

/** Row with inline rename — click the pencil to edit the name, save/cancel to commit. */
function OptionRow({
  option,
  onDelete,
  extraCell,
}: {
  option: FilterOption;
  onDelete: (id: string) => void;
  extraCell?: React.ReactNode;
}) {
  const { mutate: updateOption, isPending } = useUpdateFilterOption();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(option.name);
  const [hex, setHex] = useState(option.hex ?? "#000000");
  const isColour = option.kind === "colour";

  function onSave(e: React.FormEvent) {
    e.preventDefault();
    const unchanged =
      name.trim() === option.name && (!isColour || hex === option.hex);
    if (!name.trim() || unchanged) {
      setEditing(false);
      return;
    }
    updateOption(
      {
        id: option.id,
        payload: {
          name: name.trim(),
          parentId: option.parentId,
          ...(isColour ? { hex } : {}),
        },
      },
      { onSuccess: () => setEditing(false) },
    );
  }

  return (
    <TableRow>
      <TableCell>
        {editing ? (
          <form onSubmit={onSave} className="flex gap-2">
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-8 max-w-52"
            />
            {isColour && <ColorPicker value={hex} onChange={setHex} />}
            <Button type="submit" size="sm" disabled={isPending}>
              Save
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setName(option.name);
                setHex(option.hex ?? "#000000");
                setEditing(false);
              }}
            >
              Cancel
            </Button>
          </form>
        ) : (
          <span className="flex items-center gap-2">
            {isColour && option.hex && (
              <span
                className="size-4 rounded-full border"
                style={{ backgroundColor: option.hex }}
              />
            )}
            {option.name}
          </span>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground">{option.slug}</TableCell>
      {extraCell}
      <TableCell className="flex justify-end gap-2">
        {!editing && (
          <Button
            size="icon-sm"
            variant="outline"
            onClick={() => setEditing(true)}
          >
            <PencilIcon className="size-3.5" />
          </Button>
        )}
        <Button
          size="icon-sm"
          variant="destructive"
          onClick={() => onDelete(option.id)}
        >
          <Trash2Icon className="size-3.5" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

function CategoriesSection() {
  const { data } = useFilterOptionsByKind("category");
  const { mutate: createOption, isPending } = useCreateFilterOption();
  const { mutate: deleteOption } = useDeleteFilterOption();
  const [name, setName] = useState("");
  const [subNameByParent, setSubNameByParent] = useState<
    Record<string, string>
  >({});
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const categories = data ?? [];
  const childrenOf = (parentId: string) =>
    categories.filter((c) => c.parentId === parentId);

  const filteredTopLevel = useMemo(() => {
    const topLevel = categories.filter((c) => !c.parentId);
    if (!search.trim()) return topLevel;
    const q = search.toLowerCase();
    return topLevel.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.slug.includes(q) ||
        childrenOf(c.id).some(
          (sub) => sub.name.toLowerCase().includes(q) || sub.slug.includes(q),
        ),
    );
  }, [categories, search]);

  const pageCount = Math.max(1, Math.ceil(filteredTopLevel.length / pageSize));
  const safePageIndex = Math.min(pageIndex, pageCount - 1);
  const pageRows = filteredTopLevel.slice(
    safePageIndex * pageSize,
    safePageIndex * pageSize + pageSize,
  );

  function onAddTopLevel(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    createOption(
      { kind: "category", name: name.trim() },
      { onSuccess: () => setName("") },
    );
  }

  function onAddSub(parentId: string, e: React.FormEvent) {
    e.preventDefault();
    const subName = subNameByParent[parentId]?.trim();
    if (!subName) return;
    createOption(
      { kind: "category", name: subName, parentId },
      {
        onSuccess: () => setSubNameByParent((s) => ({ ...s, [parentId]: "" })),
      },
    );
  }

  function handleSearch(value: string) {
    setSearch(value);
    setPageIndex(0);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">Categories</p>
        <div className="flex gap-2">
          <Input
            placeholder="Search categories…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="h-8 w-48"
          />
          <form onSubmit={onAddTopLevel} className="flex gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="New category"
              className="h-8 max-w-52"
            />
            <Button
              type="submit"
              size="lg"
              variant="outline"
              disabled={isPending}
            >
              <PlusIcon /> Add
            </Button>
          </form>
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted">
            <TableRow className="h-10">
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Used by</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 p-0">
                  <FilterEmptyState
                    label={
                      search
                        ? "No categories match your search."
                        : "No categories yet."
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((c) => (
                <Fragment key={c.id}>
                  <OptionRow option={c} onDelete={deleteOption} />
                  {childrenOf(c.id).map((sub) => (
                    <TableRow key={sub.id} className="bg-muted/40">
                      <TableCell className="pl-8 text-sm">
                        ↳ {sub.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {sub.slug}
                      </TableCell>
                      <TableCell className="flex justify-end">
                        <SubcategoryActions sub={sub} onDelete={deleteOption} />
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow key={`${c.id}-add`} className="bg-muted/20">
                    <TableCell colSpan={3}>
                      <form
                        onSubmit={(e) => onAddSub(c.id, e)}
                        className="flex items-center gap-2 pl-8"
                      >
                        <Input
                          value={subNameByParent[c.id] ?? ""}
                          onChange={(e) =>
                            setSubNameByParent((s) => ({
                              ...s,
                              [c.id]: e.target.value,
                            }))
                          }
                          placeholder={`New subcategory under "${c.name}"`}
                          className="h-6 max-w-60 text-xs"
                        />
                        <Button
                          type="submit"
                          size="icon-sm"
                          variant="outline"
                          disabled={isPending}
                        >
                          <PlusIcon className="size-3" />
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                </Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <TablePagination
        totalCount={filteredTopLevel.length}
        pageIndex={safePageIndex}
        pageSize={pageSize}
        pageCount={pageCount}
        onPageChange={setPageIndex}
        onPageSizeChange={(s) => {
          setPageSize(s);
          setPageIndex(0);
        }}
        itemLabel="category"
        countSuffix={search ? `matching "${search}"` : undefined}
      />
    </div>
  );
}

function SubcategoryActions({
  sub,
  onDelete,
}: {
  sub: FilterOption;
  onDelete: (id: string) => void;
}) {
  const { mutate: updateOption, isPending } = useUpdateFilterOption();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(sub.name);

  function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || name.trim() === sub.name) {
      setEditing(false);
      return;
    }
    updateOption(
      { id: sub.id, payload: { name: name.trim(), parentId: sub.parentId } },
      { onSuccess: () => setEditing(false) },
    );
  }

  if (editing) {
    return (
      <form onSubmit={onSave} className="flex gap-2">
        <Input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-6 max-w-40 text-xs"
        />
        <Button type="submit" size="sm" disabled={isPending}>
          Save
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setEditing(false)}
        >
          Cancel
        </Button>
      </form>
    );
  }

  return (
    <div className="flex gap-2">
      <Button size="icon-sm" variant="outline" onClick={() => setEditing(true)}>
        <PencilIcon className="size-3.5" />
      </Button>
      <Button
        size="icon-sm"
        variant="destructive"
        onClick={() => onDelete(sub.id)}
      >
        <Trash2Icon className="size-3.5" />
      </Button>
    </div>
  );
}

const USAGE_ITEMS = [
  { value: "all", label: "All" },
  { value: "used", label: "In use" },
  { value: "unused", label: "Unused" },
];

function UsageCell({ count }: { count?: number }) {
  return (
    <TableCell className="text-muted-foreground">
      {count === undefined
        ? "…"
        : count === 0
          ? "Unused"
          : `${count} product${count === 1 ? "" : "s"}`}
    </TableCell>
  );
}

function FlatFilterSection({
  kind,
  label,
}: {
  kind: FilterOptionKind;
  label: string;
}) {
  const { data } = useFilterOptionsByKind(kind);
  const { mutate: createOption, isPending } = useCreateFilterOption();
  const { mutate: deleteOption } = useDeleteFilterOption();
  const [name, setName] = useState("");
  const [hex, setHex] = useState("#000000");
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [usageFilter, setUsageFilter] = useState("all");
  const { data: usage } = useFilterOptionUsage();

  const options = data ?? [];
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return options.filter(
      (o) =>
        (!q || o.name.toLowerCase().includes(q) || o.slug.includes(q)) &&
        (usageFilter === "all" ||
          // Until usage loads, don't hide anything.
          !usage ||
          (usageFilter === "unused") === !usage[o.id]),
    );
  }, [options, search, usageFilter, usage]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePageIndex = Math.min(pageIndex, pageCount - 1);
  const pageRows = filtered.slice(
    safePageIndex * pageSize,
    safePageIndex * pageSize + pageSize,
  );

  function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    createOption(
      { kind, name: name.trim(), ...(kind === "colour" ? { hex } : {}) },
      { onSuccess: () => setName("") },
    );
  }

  function handleSearch(value: string) {
    setSearch(value);
    setPageIndex(0);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{label}</p>
        <div className="flex gap-2">
          <Select
            value={usageFilter}
            onValueChange={(v) => {
              setUsageFilter(v ?? "all");
              setPageIndex(0);
            }}
            items={USAGE_ITEMS}
          >
            <SelectTrigger size="sm" className="w-32 data-[size=sm]:h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {USAGE_ITEMS.map((i) => (
                <SelectItem key={i.value} value={i.value}>
                  {i.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder={`Search ${label.toLowerCase()}…`}
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="h-8 w-48"
          />
          <form onSubmit={onAdd} className="flex gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`New ${label.toLowerCase().replace(/s$/, "")}`}
              className="h-8 max-w-52"
            />
            {kind === "colour" && <ColorPicker value={hex} onChange={setHex} />}
            <Button
              type="submit"
              size="lg"
              variant="outline"
              disabled={isPending}
            >
              <PlusIcon /> Add
            </Button>
          </form>
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted">
            <TableRow className="h-10">
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-32 p-0">
                  <FilterEmptyState
                    label={
                      search || usageFilter !== "all"
                        ? `No ${label.toLowerCase()} match your filters.`
                        : `No ${label.toLowerCase()} yet.`
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((o) => (
                <OptionRow
                  key={o.id}
                  option={o}
                  onDelete={deleteOption}
                  extraCell={<UsageCell count={usage?.[o.id]} />}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <TablePagination
        totalCount={filtered.length}
        pageIndex={safePageIndex}
        pageSize={pageSize}
        pageCount={pageCount}
        onPageChange={setPageIndex}
        onPageSizeChange={(s) => {
          setPageSize(s);
          setPageIndex(0);
        }}
        itemLabel={label.toLowerCase().replace(/s$/, "")}
        countSuffix={search ? `matching "${search}"` : undefined}
      />
    </div>
  );
}

export default function FiltersPage({
  onNavigate,
}: {
  onNavigate: (route: AdminRoute) => void;
}) {
  return (
    <AdminLayout
      title="Shop filters"
      activeRoute="filters"
      onNavigate={onNavigate}
    >
      <div className="@container/main flex flex-1 flex-col gap-4 p-4 md:p-6">
        <p className="text-sm text-muted-foreground">
          Manages every admin-curated shop filter facet (category, brand,
          surface, size, colour) shown in the storefront's filter panel.{" "}
          <code>gender</code> is a fixed 3-option field and isn't managed here.
        </p>
        <CategoriesSection />
        {FLAT_FILTER_KINDS.map(({ kind, label }) => (
          <FlatFilterSection key={kind} kind={kind} label={label} />
        ))}
      </div>
    </AdminLayout>
  );
}
