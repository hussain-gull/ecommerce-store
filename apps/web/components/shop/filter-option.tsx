"use client";

import { ShopLink } from "./shop-view";
import { Check } from "lucide-react";

type FilterOptionProps = {
  href: string;
  label: string;
  count: number;
  selected: boolean;
  display: "list" | "grid";
};

export function FilterOption(props: FilterOptionProps) {
  const { href, label, count, selected, display } = props;

  if (display === "grid" && count === 0 && !selected) {
    return (
      <span
        aria-disabled="true"
        title="Out of stock"
        className="w-11 h-11 lg:w-9 lg:h-9 flex items-center justify-center border border-line text-[12px] font-semibold text-subtle line-through opacity-50 cursor-not-allowed"
      >
        {label}
      </span>
    );
  }

  return (
    <ShopLink
      href={href}
      role="checkbox"
      aria-checked={selected}
      aria-label={display === "grid" ? `Size ${label}` : undefined}
      className="no-underline"
    >
      {display === "grid" ? (
        <GridBox label={label} selected={selected} />
      ) : (
        <ListRow label={label} count={count} selected={selected} />
      )}
    </ShopLink>
  );
}

function GridBox({ label, selected }: { label: string; selected: boolean }) {
  return (
    <span
      className={`w-11 h-11 lg:w-9 lg:h-9 flex items-center justify-center border text-[12px] font-semibold transition-colors ${
        selected
          ? "bg-foreground text-wash border-foreground"
          : "border-line text-foreground hover:bg-foreground hover:text-wash hover:border-foreground"
      }`}
    >
      {label}
    </span>
  );
}

function ListRow({
  label,
  count,
  selected,
}: {
  label: string;
  count: number;
  selected: boolean;
}) {
  return (
    <span
      className={`group flex items-center gap-2.5 py-1.5 min-h-11 lg:min-h-0 text-[13px] transition-colors ${
        selected ? "text-accent" : "text-secondary hover:text-accent"
      }`}
    >
      <span
        aria-hidden
        className={`w-4 h-4 shrink-0 border flex items-center justify-center transition-colors ${
          selected ? "bg-accent border-accent text-wash" : "border-line bg-wash"
        }`}
      >
        {selected && <Check size={11} strokeWidth={3} />}
      </span>
      <span className="flex-1">{label}</span>
      <span className="bg-wash text-subtle text-[11px] px-2 py-0.5 rounded-full">
        {count}
      </span>
    </span>
  );
}
