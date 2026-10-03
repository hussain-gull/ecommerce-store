import {
  useWatch,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";

// Isolates the re-render to just the counter span on every keystroke instead
// of the whole form, since react-hook-form's register() doesn't re-render.
export function CharCount<T extends FieldValues>({
  control,
  name,
  max,
}: {
  control: Control<T>;
  name: Path<T>;
  max: number;
}) {
  const value = useWatch({ control, name }) as string | undefined;
  return (
    <p className="text-right text-[11px] text-muted-foreground tabular-nums">
      {value?.length ?? 0}/{max}
    </p>
  );
}
