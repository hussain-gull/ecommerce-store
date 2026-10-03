import type { Facet, ShopResult } from "@/lib/shop/query";
import { shopHref, toggleValue, type ShopFilters } from "@/lib/shop/params";
import { FilterOption } from "./filter-option";
import { PriceFilter } from "./price-filter";

const VISIBLE_OPTIONS = 5;
// Facet values are slugs ("running-shoes"); display them as "Running Shoes".
const displayLabel = (value: string) =>
  value.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const headingClass =
  "text-base font-bold uppercase text-foreground pb-2.5 border-b-1 border-muted";

type ShopSidebarProps = { filters: ShopFilters; result: ShopResult };

export function ShopSidebar({ filters, result }: ShopSidebarProps) {
  return (
    <div className="space-y-6">
      {result.facets.map((facet) => (
        <FacetGroup key={facet.key} facet={facet} filters={filters} />
      ))}
      <details
        open={filters.minPrice !== undefined || filters.maxPrice !== undefined}
        className="group"
      >
        <GroupSummary label="Price" />
        <div className="pt-3.5">
          <PriceFilter filters={filters} bounds={result.priceBounds} />
        </div>
      </details>
    </div>
  );
}

function GroupSummary({
  label,
  selectedCount = 0,
}: {
  label: string;
  selectedCount?: number;
}) {
  return (
    <summary
      className={`${headingClass} flex items-center justify-between cursor-pointer list-none [&::-webkit-details-marker]:hidden`}
    >
      <span>
        {label}
        {selectedCount > 0 && (
          <span className="text-accent ml-1">({selectedCount})</span>
        )}
      </span>
      <span
        aria-hidden
        className="text-secondary text-lg leading-none transition-transform group-open:rotate-45"
      >
        +
      </span>
    </summary>
  );
}

function FacetGroup({
  facet,
  filters,
}: {
  facet: Facet;
  filters: ShopFilters;
}) {
  if (facet.options.length === 0) return null;

  const selectedCount = facet.options.filter((o) => o.selected).length;
  const isGrid = facet.display === "grid";
  // Size grids are compact — show them whole; long lists collapse after 5.
  const visible = isGrid
    ? facet.options
    : facet.options.slice(0, VISIBLE_OPTIONS);
  const hidden = isGrid ? [] : facet.options.slice(VISIBLE_OPTIONS);

  const renderOptions = (options: Facet["options"]) =>
    options.map((o) => (
      <li key={o.value} className="group/sub">
        <FilterOption
          href={shopHref(filters, {
            [facet.key]: toggleValue(filters[facet.key], o.value),
          })}
          label={facet.display === "grid" ? o.value : displayLabel(o.value)}
          count={o.count}
          selected={o.selected}
          display={facet.display}
        />
        {o.children && o.children.length > 0 && (
          // Opens on hover/focus (desktop) and stays open once picked (touch).
          // The hover delay stops lists snapping open as the wheel scrolls past.
          <div
            className={`grid transition-[grid-template-rows] duration-200 ${
              o.selected || o.children.some((c) => c.selected)
                ? "grid-rows-[1fr]"
                : "grid-rows-[0fr] group-hover/sub:grid-rows-[1fr] group-hover/sub:delay-300 group-focus-within/sub:grid-rows-[1fr]"
            }`}
          >
            <ul className="min-h-0 overflow-hidden list-none m-0 pl-6.5 border-l border-line ml-2">
              {o.children.map((c) => (
                <li key={c.value}>
                  <FilterOption
                    // Picking a surface also picks its category.
                    href={shopHref(filters, {
                      category: o.selected
                        ? filters.category
                        : [...filters.category, o.value],
                      surface: toggleValue(filters.surface, c.value),
                    })}
                    label={displayLabel(c.value)}
                    count={c.count}
                    selected={c.selected}
                    display="list"
                  />
                </li>
              ))}
            </ul>
          </div>
        )}
      </li>
    ));

  const listClass = isGrid
    ? "flex flex-wrap gap-2 list-none m-0 p-0"
    : "list-none m-0 p-0";

  return (
    <details open={facet.defaultOpen || selectedCount > 0} className="group">
      <GroupSummary label={facet.label} selectedCount={selectedCount} />
      <fieldset className="border-none m-0 p-0 pt-3.5">
        <legend className="sr-only">{facet.label}</legend>
        <ul className={listClass}>{renderOptions(visible)}</ul>
        {hidden.length > 0 && (
          <details open={hidden.some((o) => o.selected)} className="group/more">
            <summary className="list-none [&::-webkit-details-marker]:hidden cursor-pointer text-xs font-bold uppercase tracking-widest text-foreground hover:text-accent py-2 group-open/more:hidden">
              + Show {hidden.length} more
            </summary>
            <ul className={listClass}>{renderOptions(hidden)}</ul>
          </details>
        )}
      </fieldset>
    </details>
  );
}
