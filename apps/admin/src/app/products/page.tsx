import { useEffect, useRef, useState, type RefObject } from "react";
import {
  useFieldArray,
  useForm,
  useWatch,
  Controller,
  type Control,
  type FieldErrors,
  type UseFormRegister,
  type UseFormSetValue,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PackageIcon, PlusIcon, Trash2Icon } from "lucide-react";
import type { AdminProduct } from "@ecommerce/contracts";
import {
  createProductSchema,
  type CreateProductFormValues,
} from "@ecommerce/contracts";
import { AdminLayout } from "@/components/admin-layout";
import { MediaListField } from "@/components/content/media-list-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { ColorPicker } from "@/components/ui/color-picker";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { TablePagination } from "@/components/table-pagination";
import {
  useCreateProduct,
  useDeleteProduct,
  useProductCounts,
  useProducts,
  useUpdateProduct,
} from "@/lib/hooks/use-products";
import { useFilterOptionsByKind } from "@/lib/hooks/use-filter-options";
import { colorNameFromHex } from "@/lib/color-name";
import type { AdminRoute } from "@/lib/routes";
import { LOW_STOCK_THRESHOLD, type FilterOption } from "@ecommerce/contracts";

type TabKey = "all" | "published" | "draft";

const emptyValues: CreateProductFormValues = {
  slug: "",
  name: "",
  description: "",
  price: "",
  sku: "",
  category: "",
  tags: [],
  isPublished: true,
  // Size and colour are mandatory on every variant (see productVariantSchema).
  variants: [{ size: "", colorName: "", colorHex: "", stock: 0 }],
  media: [],
};

// Limits come from the shared Zod schema so the counters can't drift from it.
const LIMITS = {
  name: createProductSchema.shape.name.maxLength,
  slug: 200, // slugSchema isn't exported; keep in sync with product.schema.ts
  description: createProductSchema.shape.description.maxLength,
  sku: createProductSchema.shape.sku.maxLength,
  metaTitle: createProductSchema.shape.metaTitle.unwrap().maxLength,
  metaDescription: createProductSchema.shape.metaDescription.unwrap().maxLength,
} as const;

function CharCount({
  control,
  name,
}: {
  control: Control<CreateProductFormValues>;
  name: keyof typeof LIMITS;
}) {
  const len = useWatch({ control, name })?.length ?? 0;
  const max = LIMITS[name];
  return (
    <p
      className={`-mt-1.5 text-right text-xs leading-none ${max !== null && len > max ? "text-destructive" : "text-muted-foreground"}`}
    >
      {len}/{max}
    </p>
  );
}

function VariantsEditor({
  control,
  register,
  setValue,
  sizes,
  colours,
  errors,
}: {
  control: Control<CreateProductFormValues>;
  register: UseFormRegister<CreateProductFormValues>;
  setValue: UseFormSetValue<CreateProductFormValues>;
  sizes: FilterOption[];
  colours: FilterOption[];
  errors: FieldErrors<CreateProductFormValues>;
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants",
  });

  // Size: must be chosen from the Filters page options (no "none" entry).
  const sizePick = (i: number) => (
    <Controller
      control={control}
      name={`variants.${i}.size`}
      render={({ field }) => {
        // A saved size whose option was deleted must stay visible/selectable.
        const orphan =
          !!field.value && !sizes.some((o) => o.slug === field.value);
        return (
          <Select
            value={field.value || null}
            onValueChange={(v) => field.onChange(v ?? "")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select size">
                {(v: string | null) =>
                  orphan && v === field.value
                    ? `${v} (removed)`
                    : (sizes.find((o) => o.slug === v)?.name ?? "Select size")
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {orphan && (
                <SelectItem value={field.value}>
                  {field.value} (removed)
                </SelectItem>
              )}
              {sizes.map((o) => (
                <SelectItem key={o.id} value={o.slug}>
                  {o.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      }}
    />
  );

  // Colour: the picker names the hex (colorNameFromHex) and that name shows in
  // this dropdown; choosing a saved colour option sets both name and hex.
  const colourPick = (i: number) => (
    <Controller
      control={control}
      name={`variants.${i}.colorName`}
      render={({ field }) => {
        const known = colours.some((o) => o.name === field.value);
        return (
          <Select
            value={field.value || null}
            onValueChange={(v) => {
              field.onChange(v ?? "");
              const hex = colours.find((o) => o.name === v)?.hex;
              if (hex)
                setValue(`variants.${i}.colorHex`, hex, {
                  shouldValidate: true,
                });
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pick a colour" />
            </SelectTrigger>
            <SelectContent>
              {!!field.value && !known && (
                <SelectItem value={field.value}>{field.value}</SelectItem>
              )}
              {colours.map((o) => (
                <SelectItem key={o.id} value={o.name}>
                  {o.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      }}
    />
  );

  return (
    <Field>
      <FieldLabel>Variants (size, colour, stock — all required)</FieldLabel>
      {fields.map((f, i) => (
        <div key={f.id} className="space-y-1">
          <div className="flex items-center gap-2">
            {sizePick(i)}
            {colourPick(i)}
            <Controller
              control={control}
              name={`variants.${i}.colorHex`}
              render={({ field }) => (
                <ColorPicker
                  value={field.value || "#000000"}
                  onChange={(hex) => {
                    field.onChange(hex);
                    setValue(`variants.${i}.colorName`, colorNameFromHex(hex), {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                />
              )}
            />
            <Input
              type="number"
              min={0}
              aria-label="Stock"
              className="w-24 shrink-0"
              {...register(`variants.${i}.stock`, { valueAsNumber: true })}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Remove variant"
              disabled={fields.length === 1}
              onClick={() => remove(i)}
            >
              <Trash2Icon />
            </Button>
          </div>
          <FieldError
            errors={fieldErrors(
              errors.variants?.[i]?.size?.message ??
                errors.variants?.[i]?.colorName?.message ??
                errors.variants?.[i]?.colorHex?.message,
            )}
          />
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        onClick={() =>
          append({ size: "", colorName: "", colorHex: "", stock: 0 })
        }
      >
        <PlusIcon /> Add variant
      </Button>
      <FieldError errors={fieldErrors(errors.variants?.root?.message)} />
    </Field>
  );
}

function fieldErrors(message?: string) {
  return message ? [{ message }] : undefined;
}

function ProductForm({
  editing,
  categories,
  brands,
  surfaces,
  conditions,
  sizes,
  colours,
  onClose,
  dirtyRef,
}: {
  editing: AdminProduct | null;
  categories: FilterOption[];
  brands: FilterOption[];
  surfaces: FilterOption[];
  conditions: FilterOption[];
  sizes: FilterOption[];
  colours: FilterOption[];
  onClose: () => void;
  dirtyRef: RefObject<boolean>;
}) {
  const { mutate: create, isPending: isCreating } = useCreateProduct();
  const { mutate: update, isPending: isUpdating } = useUpdateProduct();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isDirty },
  } = useForm<CreateProductFormValues>({
    resolver: zodResolver(createProductSchema),
    defaultValues: editing
      ? {
          slug: editing.slug,
          name: editing.name,
          description: editing.description,
          price: editing.price,
          salePrice: editing.salePrice,
          sku: editing.sku,
          category: editing.category,
          brand: editing.brand,
          gender: editing.gender,
          surface: editing.surface,
          conditionId: editing.conditionId,
          tags: editing.tags,
          isPublished: editing.isPublished,
          metaTitle: editing.metaTitle,
          metaDescription: editing.metaDescription,
          // baseStock lets the server apply only what the admin changed, so
          // orders placed while this form is open are never overwritten.
          variants: editing.variants.length
            ? editing.variants.map((v) => ({ ...v, baseStock: v.stock }))
            : [{ size: "", colorName: "", colorHex: "", stock: 0 }],
          media: editing.media,
        }
      : emptyValues,
  });

  // Lets the parent's sheet (Esc / overlay click) know there are unsaved edits.
  dirtyRef.current = isDirty;
  useEffect(() => {
    if (!isDirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  function onSubmit(raw: CreateProductFormValues) {
    const values = raw;
    const onSuccess = () => {
      dirtyRef.current = false;
      onClose();
    };
    if (editing) {
      update({ id: editing.id, payload: values }, { onSuccess });
    } else {
      create(values, { onSuccess });
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-1 flex-col overflow-y-auto"
    >
      <SheetHeader>
        <SheetTitle>{editing ? "Edit product" : "New product"}</SheetTitle>
      </SheetHeader>
      <FieldGroup className="gap-2 px-6 pb-6">
        <Field>
          <FieldLabel htmlFor="name">Name</FieldLabel>
          <Input id="name" {...register("name")} />
          <CharCount control={control} name="name" />
          <FieldError errors={fieldErrors(errors.name?.message)} />
        </Field>
        <Field>
          <FieldLabel htmlFor="slug">Slug</FieldLabel>
          <Input id="slug" {...register("slug")} />
          <CharCount control={control} name="slug" />
          <FieldError errors={fieldErrors(errors.slug?.message)} />
        </Field>
        <Field>
          <FieldLabel htmlFor="description">Description</FieldLabel>
          <Textarea id="description" rows={4} {...register("description")} />
          <CharCount control={control} name="description" />
          <FieldError errors={fieldErrors(errors.description?.message)} />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field>
            <FieldLabel htmlFor="price">Price</FieldLabel>
            <Input id="price" placeholder="49.99" {...register("price")} />
            <FieldError errors={fieldErrors(errors.price?.message)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="salePrice">Sale price</FieldLabel>
            <Input
              id="salePrice"
              placeholder="39.99"
              {...register("salePrice", {
                setValueAs: (v: string) => v?.trim() || undefined,
              })}
            />
            <FieldError errors={fieldErrors(errors.salePrice?.message)} />
          </Field>
        </div>
        <VariantsEditor
          control={control}
          register={register}
          setValue={setValue}
          sizes={sizes}
          colours={colours}
          errors={errors}
        />
        <div className="grid grid-cols-2 gap-2">
          <Field>
            <FieldLabel htmlFor="sku">SKU</FieldLabel>
            <Input id="sku" {...register("sku")} />
            <CharCount control={control} name="sku" />
            <FieldError errors={fieldErrors(errors.sku?.message)} />
          </Field>
          <Field>
            <FieldLabel>Category</FieldLabel>
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.slug}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError errors={fieldErrors(errors.category?.message)} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Field>
            <FieldLabel>Brand</FieldLabel>
            <Controller
              control={control}
              name="brand"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((b) => (
                      <SelectItem key={b.id} value={b.slug}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field>
            <FieldLabel>Gender</FieldLabel>
            <Controller
              control={control}
              name="gender"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Men">Men</SelectItem>
                    <SelectItem value="Women">Women</SelectItem>
                    <SelectItem value="Kids">Kids</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        </div>
        <Field>
          <FieldLabel>Surface</FieldLabel>
          <Controller
            control={control}
            name="surface"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a surface" />
                </SelectTrigger>
                <SelectContent>
                  {surfaces.map((s) => (
                    <SelectItem key={s.id} value={s.slug}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        <Field>
          <FieldLabel>Condition</FieldLabel>
          <Controller
            control={control}
            name="conditionId"
            render={({ field }) => (
              <Select
                value={field.value ?? undefined}
                onValueChange={field.onChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a condition">
                    {(id: string | null) =>
                      conditions.find((c) => c.id === id)?.name
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {conditions.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        <Field orientation="horizontal">
          <Controller
            control={control}
            name="isPublished"
            render={({ field }) => (
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <FieldLabel>Published</FieldLabel>
        </Field>
        <Field>
          <FieldLabel htmlFor="metaTitle">Meta title</FieldLabel>
          <Input id="metaTitle" {...register("metaTitle")} />
          <CharCount control={control} name="metaTitle" />
        </Field>
        <Field>
          <FieldLabel htmlFor="metaDescription">Meta description</FieldLabel>
          <Textarea
            id="metaDescription"
            rows={2}
            {...register("metaDescription")}
          />
          <CharCount control={control} name="metaDescription" />
        </Field>
        <Field>
          <FieldLabel>Images & videos</FieldLabel>
          <Controller
            control={control}
            name="media"
            render={({ field }) => (
              <MediaListField
                category="product"
                value={field.value ?? []}
                onChange={field.onChange}
                max={10}
              />
            )}
          />
        </Field>
      </FieldGroup>
      <SheetFooter className="flex-row justify-end gap-2 border-t">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isCreating || isUpdating}>
          {editing ? "Save changes" : "Create product"}
        </Button>
      </SheetFooter>
    </form>
  );
}

function ProductsEmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <PackageIcon className="size-10 text-muted-foreground/30" />
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

const colCount = 6; // name + sku + category + price + published + actions

const STOCK_ITEMS = [
  { value: "all", label: "Any stock" },
  { value: "in", label: "In stock" },
  { value: "low", label: `Low (≤ ${LOW_STOCK_THRESHOLD})` },
  { value: "out", label: "Sold out" },
];
const SORT_ITEMS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name", label: "Name A–Z" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
];

// A compact select over {value,label} items, with an "all" entry first.
function FilterSelect({
  value,
  onChange,
  items,
  className = "w-36",
}: {
  value: string;
  onChange: (v: string) => void;
  items: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(v ?? "all")}
      items={items}
    >
      <SelectTrigger size="sm" className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((i) => (
          <SelectItem key={i.value} value={i.value}>
            {i.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const withAll = (label: string, options: FilterOption[], by: "slug" | "id") => [
  { value: "all", label },
  ...options.map((o) => ({
    value: by === "slug" ? o.slug : o.id,
    label: o.name,
  })),
];

function ProductsTable({
  categories,
  brands,
  conditions,
  onEdit,
  onDelete,
}: {
  categories: FilterOption[];
  brands: FilterOption[];
  conditions: FilterOption[];
  onEdit: (product: AdminProduct) => void;
  onDelete: (id: string) => void;
}) {
  const [tab, setTab] = useState<TabKey>("all");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [category, setCategory] = useState("all");
  const [brand, setBrand] = useState("all");
  const [condition, setCondition] = useState("all");
  const [stock, setStock] = useState("all");
  const [onSale, setOnSale] = useState(false);
  const [sort, setSort] = useState("newest");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Wait for a pause in typing before hitting the API.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const none = (v: string) => (v === "all" ? undefined : v);
  const { data, isLoading, isPlaceholderData } = useProducts({
    status: tab === "all" ? undefined : tab,
    q: debounced,
    category: none(category),
    brand: none(brand),
    conditionId: none(condition),
    stock: none(stock) as "in" | "low" | "out" | undefined,
    onSale: onSale ? "1" : undefined,
    sort: sort as "newest",
    page: pageIndex + 1,
    limit: pageSize,
  });
  const { data: counts } = useProductCounts();

  const pageRows = data?.products ?? [];
  const total = data?.meta.total ?? 0;
  const pageCount = data?.meta.totalPages ?? 1;
  const filtersActive =
    !!debounced ||
    category !== "all" ||
    brand !== "all" ||
    condition !== "all" ||
    stock !== "all" ||
    onSale;

  // Any filter change returns to the first page.
  const reset =
    <T,>(set: (v: T) => void) =>
    (v: T) => {
      set(v);
      setPageIndex(0);
    };

  function clearFilters() {
    setSearch("");
    setCategory("all");
    setBrand("all");
    setCondition("all");
    setStock("all");
    setOnSale(false);
    setPageIndex(0);
  }

  const tabBadge = (n: number | undefined) =>
    !!n && (
      <Badge variant="secondary" className="ml-1.5">
        {n}
      </Badge>
    );

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={tab}
          onValueChange={(v) => {
            if (!v) return;
            setTab(v as TabKey);
            setPageIndex(0);
          }}
        >
          <TabsList>
            <TabsTrigger value="all">All{tabBadge(counts?.all)}</TabsTrigger>
            <TabsTrigger value="published">
              Published{tabBadge(counts?.published)}
            </TabsTrigger>
            <TabsTrigger value="draft">
              Draft{tabBadge(counts?.draft)}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Input
          placeholder="Search name, SKU or slug…"
          value={search}
          onChange={(e) => reset(setSearch)(e.target.value)}
          className="h-8 w-48 lg:w-64"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect
          value={category}
          onChange={reset(setCategory)}
          items={withAll(
            "All categories",
            categories.filter((c) => !c.parentId),
            "slug",
          )}
        />
        <FilterSelect
          value={brand}
          onChange={reset(setBrand)}
          items={withAll("All brands", brands, "slug")}
        />
        <FilterSelect
          value={condition}
          onChange={reset(setCondition)}
          items={withAll("Any condition", conditions, "id")}
        />
        <FilterSelect
          value={stock}
          onChange={reset(setStock)}
          items={STOCK_ITEMS}
        />
        <Button
          size="sm"
          variant={onSale ? "default" : "outline"}
          aria-pressed={onSale}
          onClick={() => reset(setOnSale)(!onSale)}
        >
          On sale
        </Button>
        <FilterSelect
          value={sort}
          onChange={reset(setSort)}
          items={SORT_ITEMS}
          className="w-44"
        />
        {filtersActive && (
          <Button size="sm" variant="ghost" onClick={clearFilters}>
            Clear filters
          </Button>
        )}
      </div>

      <div
        className={`overflow-hidden rounded-lg border transition-opacity ${isPlaceholderData ? "opacity-60" : ""}`}
      >
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted">
            <TableRow className="h-10">
              <TableHead className="pl-4">Name</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Published</TableHead>
              <TableHead className="pr-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={colCount}
                  className="text-center text-muted-foreground"
                >
                  Loading…
                </TableCell>
              </TableRow>
            ) : pageRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colCount} className="h-40 p-0">
                  <ProductsEmptyState
                    label={
                      filtersActive
                        ? "No products match your filters."
                        : tab === "published"
                          ? "No published products."
                          : tab === "draft"
                            ? "No draft products."
                            : "No products yet."
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((product) => (
                <TableRow key={product.id} className="h-12">
                  <TableCell className="pl-4 font-medium">
                    <button
                      type="button"
                      onClick={() => onEdit(product)}
                      className="cursor-pointer hover:underline"
                    >
                      {product.name}
                    </button>
                  </TableCell>
                  <TableCell>{product.sku}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>{product.price}</TableCell>
                  <TableCell>
                    <Badge
                      variant={product.isPublished ? "default" : "outline"}
                    >
                      {product.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex justify-end gap-2 pr-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEdit(product)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="destructive"
                      onClick={() => onDelete(product.id)}
                    >
                      <Trash2Icon className="size-3.5" />
                    </Button>
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
        itemLabel="product"
        countSuffix={debounced ? `matching "${debounced}"` : undefined}
      />
    </div>
  );
}

export default function ProductsPage({
  onNavigate,
}: {
  onNavigate: (route: AdminRoute) => void;
}) {
  const { data: categories } = useFilterOptionsByKind("category");
  const { data: brands } = useFilterOptionsByKind("brand");
  const { data: surfaces } = useFilterOptionsByKind("surface");
  const { data: conditions } = useFilterOptionsByKind("condition");
  const { data: sizes } = useFilterOptionsByKind("size");
  const { data: colours } = useFilterOptionsByKind("colour");
  const { mutate: deleteProduct } = useDeleteProduct();
  const [sheetOpen, setSheetOpen] = useState(false);
  const dirtyRef = useRef(false);

  function requestClose() {
    if (
      dirtyRef.current &&
      !window.confirm(
        "You have unsaved changes. If you close now, everything you entered will be lost. Discard changes?",
      )
    )
      return;
    dirtyRef.current = false;
    setSheetOpen(false);
  }

  const [editing, setEditing] = useState<AdminProduct | null>(null);

  function openCreate() {
    setEditing(null);
    setSheetOpen(true);
  }

  function openEdit(product: AdminProduct) {
    setEditing(product);
    setSheetOpen(true);
  }

  return (
    <AdminLayout
      title="Products"
      activeRoute="products"
      onNavigate={onNavigate}
    >
      <div className="@container/main flex flex-1 flex-col gap-4 p-4 md:p-6">
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onNavigate("filters")}
          >
            Manage filters
          </Button>
          <Button size="sm" onClick={openCreate}>
            <PlusIcon /> New product
          </Button>
        </div>
        <ProductsTable
          categories={categories ?? []}
          brands={brands ?? []}
          conditions={conditions ?? []}
          onEdit={openEdit}
          onDelete={deleteProduct}
        />
      </div>
      <Sheet
        open={sheetOpen}
        onOpenChange={(o) => (o ? setSheetOpen(true) : requestClose())}
      >
        <SheetContent side="right" className="w-full sm:max-w-lg">
          {sheetOpen && (
            <ProductForm
              editing={editing}
              categories={categories}
              brands={brands}
              surfaces={surfaces}
              conditions={conditions}
              sizes={sizes}
              colours={colours}
              onClose={requestClose}
              dirtyRef={dirtyRef}
            />
          )}
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
}
