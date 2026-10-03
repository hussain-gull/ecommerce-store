import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  contactUsContentSchema,
  CONTACT_CONTENT_LIMITS,
  type ContactUsContent,
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
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useContactContent,
  useUpdateContactContent,
} from "@/lib/hooks/use-content";
import { CharCount } from "@/components/content/char-count";
import { IconSelect } from "@/components/content/icon-select";
import type { AdminRoute } from "@/lib/routes";

const ICON_OPTIONS = ["MapPin", "Phone", "Mail", "Clock"];

function fieldErrors(message?: string) {
  return message ? [{ message }] : undefined;
}

function ContactInfoLines({
  control,
  index,
}: {
  // ponytail: nested array-of-array paths (info[].lines[]) blow past RHF's
  // path-inference depth, so this inner component is typed loosely on purpose.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: import("react-hook-form").Control<any>;
  index: number;
}) {
  const lines = useFieldArray({
    control,
    name: `info.${index}.lines`,
  });
  return (
    <div className="sm:col-span-3 space-y-2">
      <div className="flex items-center justify-between">
        <FieldLabel>Lines</FieldLabel>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => lines.append("")}
        >
          <PlusIcon />
          Add line
        </Button>
      </div>
      {lines.fields.map((field, lineIndex) => (
        <div key={field.id} className="space-y-1">
          <div className="flex items-center gap-2">
            <Controller
              control={control}
              name={`info.${index}.lines.${lineIndex}`}
              render={({ field: f }) => (
                <Input maxLength={CONTACT_CONTENT_LIMITS.infoLine} {...f} />
              )}
            />
            {lines.fields.length > 1 && (
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => lines.remove(lineIndex)}
              >
                <Trash2Icon />
                <span className="sr-only">Remove line</span>
              </Button>
            )}
          </div>
          <CharCount
            control={control}
            name={`info.${index}.lines.${lineIndex}`}
            max={CONTACT_CONTENT_LIMITS.infoLine}
          />
        </div>
      ))}
    </div>
  );
}

function ContactContentEditor({ content }: { content: ContactUsContent }) {
  const { mutate: save, isPending } = useUpdateContactContent();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ContactUsContent>({
    resolver: zodResolver(contactUsContentSchema),
    defaultValues: content,
  });

  const info = useFieldArray({ control, name: "info" });

  return (
    <form
      onSubmit={handleSubmit((v) => save(v))}
      className="flex flex-col gap-6 px-4 py-4 lg:px-6 md:py-6"
    >
      <Card>
        <CardHeader>
          <CardTitle>Page meta</CardTitle>
          <CardDescription>
            Browser tab title and search description.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field data-invalid={!!errors.meta?.title}>
              <FieldLabel htmlFor="meta-title">Title</FieldLabel>
              <Input
                id="meta-title"
                maxLength={CONTACT_CONTENT_LIMITS.metaTitle}
                {...register("meta.title")}
              />
              <CharCount
                control={control}
                name="meta.title"
                max={CONTACT_CONTENT_LIMITS.metaTitle}
              />
              <FieldError errors={fieldErrors(errors.meta?.title?.message)} />
            </Field>
            <Field data-invalid={!!errors.meta?.description}>
              <FieldLabel htmlFor="meta-description">Description</FieldLabel>
              <Textarea
                id="meta-description"
                rows={2}
                maxLength={CONTACT_CONTENT_LIMITS.metaDescription}
                {...register("meta.description")}
              />
              <CharCount
                control={control}
                name="meta.description"
                max={CONTACT_CONTENT_LIMITS.metaDescription}
              />
              <FieldError
                errors={fieldErrors(errors.meta?.description?.message)}
              />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Page copy</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field data-invalid={!!errors.heading}>
              <FieldLabel htmlFor="heading">Page heading</FieldLabel>
              <Input
                id="heading"
                maxLength={CONTACT_CONTENT_LIMITS.heading}
                {...register("heading")}
              />
              <CharCount
                control={control}
                name="heading"
                max={CONTACT_CONTENT_LIMITS.heading}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={!!errors.getInTouch?.heading}>
                <FieldLabel htmlFor="gt-heading">
                  "Get in touch" heading
                </FieldLabel>
                <Input
                  id="gt-heading"
                  maxLength={CONTACT_CONTENT_LIMITS.getInTouchHeading}
                  {...register("getInTouch.heading")}
                />
                <CharCount
                  control={control}
                  name="getInTouch.heading"
                  max={CONTACT_CONTENT_LIMITS.getInTouchHeading}
                />
              </Field>
              <Field data-invalid={!!errors.formHeading}>
                <FieldLabel htmlFor="form-heading">Form heading</FieldLabel>
                <Input
                  id="form-heading"
                  maxLength={CONTACT_CONTENT_LIMITS.formHeading}
                  {...register("formHeading")}
                />
                <CharCount
                  control={control}
                  name="formHeading"
                  max={CONTACT_CONTENT_LIMITS.formHeading}
                />
              </Field>
            </div>
            <Field data-invalid={!!errors.getInTouch?.body}>
              <FieldLabel htmlFor="gt-body">"Get in touch" body</FieldLabel>
              <Textarea
                id="gt-body"
                rows={3}
                maxLength={CONTACT_CONTENT_LIMITS.getInTouchBody}
                {...register("getInTouch.body")}
              />
              <CharCount
                control={control}
                name="getInTouch.body"
                max={CONTACT_CONTENT_LIMITS.getInTouchBody}
              />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact methods</CardTitle>
          <CardDescription>
            Shown in the sidebar of the contact page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Methods
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  info.append({
                    icon: ICON_OPTIONS[0]!,
                    label: "",
                    lines: [""],
                  })
                }
              >
                <PlusIcon />
                Add method
              </Button>
            </div>
            {info.fields.map((field, index) => (
              <div
                key={field.id}
                className="relative rounded-md border border-border p-3"
              >
                {info.fields.length > 1 && (
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    className="absolute right-2 top-2 text-destructive hover:text-destructive"
                    onClick={() => info.remove(index)}
                  >
                    <Trash2Icon />
                    <span className="sr-only">Remove method</span>
                  </Button>
                )}
                <div className="grid gap-3 pr-8 sm:grid-cols-3">
                  <Field>
                    <FieldLabel>Icon</FieldLabel>
                    <IconSelect
                      control={control}
                      name={`info.${index}.icon`}
                      options={ICON_OPTIONS}
                    />
                  </Field>
                  <Field className="sm:col-span-2">
                    <FieldLabel htmlFor={`info-label-${index}`}>
                      Label
                    </FieldLabel>
                    <Input
                      id={`info-label-${index}`}
                      maxLength={CONTACT_CONTENT_LIMITS.infoLabel}
                      {...register(`info.${index}.label`)}
                    />
                    <CharCount
                      control={control}
                      name={`info.${index}.label`}
                      max={CONTACT_CONTENT_LIMITS.infoLabel}
                    />
                  </Field>
                  <ContactInfoLines control={control as never} index={index} />
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

export default function ContactContentPage({
  onNavigate,
}: {
  onNavigate: (route: AdminRoute) => void;
}) {
  const { data, isLoading, isError } = useContactContent();

  return (
    <AdminLayout
      title="Contact Us Content"
      activeRoute="content-contact"
      onNavigate={onNavigate}
    >
      {isLoading && (
        <div className="flex flex-col gap-4 px-4 py-4 lg:px-6 md:py-6">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      )}
      {isError && (
        <p className="px-4 py-6 text-sm text-destructive lg:px-6">
          Failed to load Contact Us content.
        </p>
      )}
      {data && <ContactContentEditor content={data} />}
    </AdminLayout>
  );
}
