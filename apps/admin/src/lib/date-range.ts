import { addDays, startOfDay } from "date-fns";
import type { DateRange } from "react-day-picker";

/** Local calendar days → ISO instants for the API: [start of first day, start of the day after the last). */
export function toIsoRange(range: DateRange | undefined): {
  from?: string;
  to?: string;
} {
  if (!range?.from) return {};
  const to = addDays(startOfDay(range.to ?? range.from), 1);
  return { from: startOfDay(range.from).toISOString(), to: to.toISOString() };
}
