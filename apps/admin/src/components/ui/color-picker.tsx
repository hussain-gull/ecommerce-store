"use client";

import { useState } from "react";
import { HexColorPicker } from "react-colorful";
import { cn } from "cn";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const HEX = /^#[0-9a-fA-F]{6}$/;

/** Swatch button → popover with a colour area, hue slider and hex input. Value is "#rrggbb". */
function ColorPicker({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (hex: string) => void;
  className?: string;
}) {
  // Local text so a half-typed hex doesn't fight the controlled value.
  const [draft, setDraft] = useState<string | null>(null);

  return (
    <Popover onOpenChange={() => setDraft(null)}>
      <PopoverTrigger
        aria-label="Pick colour"
        className={cn(
          "size-8 shrink-0 cursor-pointer rounded-md border",
          className,
        )}
        style={{ backgroundColor: HEX.test(value) ? value : "#000000" }}
      />
      <PopoverContent className="w-56 gap-3">
        <HexColorPicker
          color={value}
          onChange={onChange}
          style={{ width: "100%" }}
        />
        <Input
          aria-label="Hex colour"
          value={draft ?? value}
          maxLength={7}
          onChange={(e) => {
            const v = e.target.value.startsWith("#")
              ? e.target.value
              : `#${e.target.value}`;
            setDraft(v);
            if (HEX.test(v)) onChange(v.toLowerCase());
          }}
          onBlur={() => setDraft(null)}
        />
      </PopoverContent>
    </Popover>
  );
}

export { ColorPicker };
