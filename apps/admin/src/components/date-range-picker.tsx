import { useState } from "react";
import { endOfDay, format, startOfMonth, subDays } from "date-fns";
import { CalendarIcon, XIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const PRESETS: { label: string; range: () => DateRange }[] = [
  { label: "Today", range: () => ({ from: new Date(), to: new Date() }) },
  {
    label: "Last 7 days",
    range: () => ({ from: subDays(new Date(), 6), to: new Date() }),
  },
  {
    label: "Last 30 days",
    range: () => ({ from: subDays(new Date(), 29), to: new Date() }),
  },
  {
    label: "This month",
    range: () => ({ from: startOfMonth(new Date()), to: new Date() }),
  },
];

// The shadcn Date Picker (Popover + Calendar, "Range Picker" example) with
// presets. base-ui triggers take `render`, where the Radix docs use `asChild`.
export function DateRangePicker({
  value,
  onChange,
  placeholder = "Pick dates",
  className,
}: {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  const label = value?.from
    ? value.to && value.to.getTime() !== value.from.getTime()
      ? `${format(value.from, "LLL dd, y")} - ${format(value.to, "LLL dd, y")}`
      : format(value.from, "LLL dd, y")
    : null;

  return (
    <div className={`flex items-center gap-1 ${className ?? ""}`}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              data-empty={!label}
              className="h-8 justify-start px-2.5 font-normal data-[empty=true]:text-muted-foreground"
            />
          }
        >
          <CalendarIcon />
          {label ?? <span>{placeholder}</span>}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex flex-col sm:flex-row">
            <div className="flex flex-row gap-1 border-b p-2 sm:flex-col sm:border-r sm:border-b-0">
              {PRESETS.map((p) => (
                <Button
                  key={p.label}
                  variant="ghost"
                  size="sm"
                  className="justify-start"
                  onClick={() => {
                    onChange(p.range());
                    setOpen(false);
                  }}
                >
                  {p.label}
                </Button>
              ))}
            </div>
            <Calendar
              mode="range"
              defaultMonth={value?.from}
              selected={value}
              onSelect={onChange}
              numberOfMonths={2}
              disabled={{ after: endOfDay(new Date()) }}
            />
          </div>
        </PopoverContent>
      </Popover>
      {value?.from && (
        <Button
          variant="ghost"
          size="icon"
          aria-label="Clear dates"
          onClick={() => onChange(undefined)}
        >
          <XIcon />
        </Button>
      )}
    </div>
  );
}
