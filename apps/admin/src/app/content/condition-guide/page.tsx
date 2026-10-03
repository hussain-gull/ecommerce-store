import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  conditionGuideContentSchema,
  CONDITION_GUIDE_LIMITS,
  type ConditionGuideContent,
} from "@ecommerce/contracts";
import { PlusIcon, Trash2Icon, Loader2Icon, SaveIcon } from "lucide-react";
import { AdminLayout } from "@/components/admin-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useConditionGuideContent,
  useUpdateConditionGuideContent,
} from "@/lib/hooks/use-content";
import { CharCount } from "@/components/content/char-count";
import type { AdminRoute } from "@/lib/routes";

function ConditionGuideEditor({ content }: { content: ConditionGuideContent }) {
  const { mutate: save, isPending } = useUpdateConditionGuideContent();

  const {
    register,
    control,
    handleSubmit,
    formState: { isDirty },
  } = useForm<ConditionGuideContent>({
    resolver: zodResolver(conditionGuideContentSchema),
    defaultValues: content,
  });

  const items = useFieldArray({ control, name: "items" });

  return (
    <form
      onSubmit={handleSubmit((v) => save(v))}
      className="flex flex-col gap-6 px-4 py-4 lg:px-6 md:py-6"
    >
      <Card>
        <CardHeader>
          <CardTitle>Condition guide</CardTitle>
          <CardDescription>
            Shown at the bottom of every product page, in this order.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Conditions
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => items.append({ label: "", description: "" })}
              >
                <PlusIcon />
                Add condition
              </Button>
            </div>
            {items.fields.map((field, index) => (
              <div
                key={field.id}
                className="relative rounded-md border border-border p-3"
              >
                {items.fields.length > 1 && (
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    className="absolute right-2 top-2 text-destructive hover:text-destructive"
                    onClick={() => items.remove(index)}
                  >
                    <Trash2Icon />
                    <span className="sr-only">Remove condition</span>
                  </Button>
                )}
                <div className="grid gap-3 pr-8 sm:grid-cols-3">
                  <Field>
                    <FieldLabel htmlFor={`items-label-${index}`}>
                      Label
                    </FieldLabel>
                    <Input
                      id={`items-label-${index}`}
                      maxLength={CONDITION_GUIDE_LIMITS.label}
                      {...register(`items.${index}.label`)}
                    />
                    <CharCount
                      control={control}
                      name={`items.${index}.label`}
                      max={CONDITION_GUIDE_LIMITS.label}
                    />
                  </Field>
                  <Field className="sm:col-span-2">
                    <FieldLabel htmlFor={`items-description-${index}`}>
                      Description
                    </FieldLabel>
                    <Textarea
                      id={`items-description-${index}`}
                      maxLength={CONDITION_GUIDE_LIMITS.description}
                      className="h-7 min-h-7 resize-y py-0.5 field-sizing-fixed"
                      {...register(`items.${index}.description`)}
                    />
                    <CharCount
                      control={control}
                      name={`items.${index}.description`}
                      max={CONDITION_GUIDE_LIMITS.description}
                    />
                  </Field>
                </div>
              </div>
            ))}
          </FieldGroup>
        </CardContent>
      </Card>

      <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-border bg-background/95 py-4 backdrop-blur">
        {isDirty && (
          <span className="text-xs text-muted-foreground">Unsaved changes</span>
        )}
        <Button type="submit" disabled={isPending || !isDirty}>
          {isPending ? <Loader2Icon className="animate-spin" /> : <SaveIcon />}
          {isPending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

export default function ConditionGuideContentPage({
  onNavigate,
}: {
  onNavigate: (route: AdminRoute) => void;
}) {
  const { data, isLoading, isError } = useConditionGuideContent();

  return (
    <AdminLayout
      title="Condition Guide"
      activeRoute="content-condition-guide"
      onNavigate={onNavigate}
    >
      {isLoading && (
        <div className="flex flex-col gap-4 px-4 py-4 lg:px-6 md:py-6">
          <Skeleton className="h-40 w-full" />
        </div>
      )}
      {isError && (
        <p className="px-4 py-6 text-sm text-destructive lg:px-6">
          Failed to load condition guide content.
        </p>
      )}
      {data && <ConditionGuideEditor content={data} />}
    </AdminLayout>
  );
}
