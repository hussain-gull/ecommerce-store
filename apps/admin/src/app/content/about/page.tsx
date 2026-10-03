import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  aboutUsContentSchema,
  ABOUT_CONTENT_LIMITS,
  type AboutUsContent,
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
  useAboutContent,
  useUpdateAboutContent,
} from "@/lib/hooks/use-content";
import { ImageUploadField } from "@/components/content/image-upload-field";
import { CharCount } from "@/components/content/char-count";
import { IconSelect } from "@/components/content/icon-select";
import type { AdminRoute } from "@/lib/routes";

const ICON_OPTIONS = [
  "Award",
  "Sparkles",
  "Leaf",
  "ShieldCheck",
  "Globe",
  "Users",
];

function fieldErrors(message?: string) {
  return message ? [{ message }] : undefined;
}

function AboutContentEditor({ content }: { content: AboutUsContent }) {
  const { mutate: save, isPending } = useUpdateAboutContent();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isDirty },
  } = useForm<AboutUsContent>({
    resolver: zodResolver(aboutUsContentSchema),
    defaultValues: content,
  });

  const paragraphs = useFieldArray({
    control,
    name: "story.paragraphs" as never,
  });
  const stats = useFieldArray({ control, name: "stats" });
  const values = useFieldArray({ control, name: "values" });
  const whyChooseItems = useFieldArray({ control, name: "whyChoose.items" });

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
                maxLength={ABOUT_CONTENT_LIMITS.metaTitle}
                {...register("meta.title")}
              />
              <CharCount
                control={control}
                name="meta.title"
                max={ABOUT_CONTENT_LIMITS.metaTitle}
              />
              <FieldError errors={fieldErrors(errors.meta?.title?.message)} />
            </Field>
            <Field data-invalid={!!errors.meta?.description}>
              <FieldLabel htmlFor="meta-description">Description</FieldLabel>
              <Textarea
                id="meta-description"
                rows={2}
                maxLength={ABOUT_CONTENT_LIMITS.metaDescription}
                {...register("meta.description")}
              />
              <CharCount
                control={control}
                name="meta.description"
                max={ABOUT_CONTENT_LIMITS.metaDescription}
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
          <CardTitle>Story</CardTitle>
          <CardDescription>Hero intro block.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel>Story image</FieldLabel>
              <ImageUploadField
                category="about-story"
                value={useWatch({ control, name: "story.imageUrl" })}
                onChange={(url) =>
                  setValue("story.imageUrl", url, { shouldDirty: true })
                }
              />
            </Field>

            <Field data-invalid={!!errors.story?.eyebrow}>
              <FieldLabel htmlFor="story-eyebrow">Eyebrow</FieldLabel>
              <Input
                id="story-eyebrow"
                maxLength={ABOUT_CONTENT_LIMITS.storyEyebrow}
                {...register("story.eyebrow")}
              />
              <CharCount
                control={control}
                name="story.eyebrow"
                max={ABOUT_CONTENT_LIMITS.storyEyebrow}
              />
              <FieldError
                errors={fieldErrors(errors.story?.eyebrow?.message)}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={!!errors.story?.heading?.[0]}>
                <FieldLabel htmlFor="story-heading-0">
                  Heading line 1
                </FieldLabel>
                <Input
                  id="story-heading-0"
                  maxLength={ABOUT_CONTENT_LIMITS.storyHeading}
                  {...register("story.heading.0")}
                />
                <CharCount
                  control={control}
                  name="story.heading.0"
                  max={ABOUT_CONTENT_LIMITS.storyHeading}
                />
              </Field>
              <Field data-invalid={!!errors.story?.heading?.[1]}>
                <FieldLabel htmlFor="story-heading-1">
                  Heading line 2
                </FieldLabel>
                <Input
                  id="story-heading-1"
                  maxLength={ABOUT_CONTENT_LIMITS.storyHeading}
                  {...register("story.heading.1")}
                />
                <CharCount
                  control={control}
                  name="story.heading.1"
                  max={ABOUT_CONTENT_LIMITS.storyHeading}
                />
              </Field>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Paragraphs
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => paragraphs.append("" as never)}
              >
                <PlusIcon />
                Add paragraph
              </Button>
            </div>
            {paragraphs.fields.map((field, index) => (
              <div
                key={field.id}
                className="relative rounded-md border border-border p-3"
              >
                {paragraphs.fields.length > 1 && (
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    className="absolute right-2 top-2 text-destructive hover:text-destructive"
                    onClick={() => paragraphs.remove(index)}
                  >
                    <Trash2Icon />
                    <span className="sr-only">Remove paragraph</span>
                  </Button>
                )}
                <Textarea
                  rows={3}
                  className="pr-8"
                  maxLength={ABOUT_CONTENT_LIMITS.storyParagraph}
                  {...register(`story.paragraphs.${index}`)}
                />
                <CharCount
                  control={control}
                  name={`story.paragraphs.${index}`}
                  max={ABOUT_CONTENT_LIMITS.storyParagraph}
                />
              </div>
            ))}

            <div className="grid gap-4 sm:grid-cols-3">
              <Field data-invalid={!!errors.story?.cta}>
                <FieldLabel htmlFor="story-cta">CTA text</FieldLabel>
                <Input
                  id="story-cta"
                  maxLength={ABOUT_CONTENT_LIMITS.storyCta}
                  {...register("story.cta")}
                />
                <CharCount
                  control={control}
                  name="story.cta"
                  max={ABOUT_CONTENT_LIMITS.storyCta}
                />
              </Field>
              <Field data-invalid={!!errors.story?.sinceYear}>
                <FieldLabel htmlFor="story-since">Since year</FieldLabel>
                <Input
                  id="story-since"
                  type="number"
                  {...register("story.sinceYear", { valueAsNumber: true })}
                />
              </Field>
              <Field data-invalid={!!errors.story?.tagline}>
                <FieldLabel htmlFor="story-tagline">Tagline</FieldLabel>
                <Input
                  id="story-tagline"
                  maxLength={ABOUT_CONTENT_LIMITS.storyTagline}
                  {...register("story.tagline")}
                />
                <CharCount
                  control={control}
                  name="story.tagline"
                  max={ABOUT_CONTENT_LIMITS.storyTagline}
                />
              </Field>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stats</CardTitle>
          <CardDescription>Trust stats bar.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Stats
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => stats.append({ value: "", label: "" })}
              >
                <PlusIcon />
                Add stat
              </Button>
            </div>
            {stats.fields.map((field, index) => (
              <div
                key={field.id}
                className="relative rounded-md border border-border p-3"
              >
                {stats.fields.length > 1 && (
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    className="absolute right-2 top-2 text-destructive hover:text-destructive"
                    onClick={() => stats.remove(index)}
                  >
                    <Trash2Icon />
                    <span className="sr-only">Remove stat</span>
                  </Button>
                )}
                <div className="grid gap-3 pr-8 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor={`stat-value-${index}`}>
                      Value
                    </FieldLabel>
                    <Input
                      id={`stat-value-${index}`}
                      {...register(`stats.${index}.value`)}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor={`stat-label-${index}`}>
                      Label
                    </FieldLabel>
                    <Input
                      id={`stat-label-${index}`}
                      {...register(`stats.${index}.label`)}
                    />
                  </Field>
                </div>
              </div>
            ))}
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Values</CardTitle>
          <CardDescription>What we stand for.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field data-invalid={!!errors.valuesHeading}>
              <FieldLabel htmlFor="values-heading">Section heading</FieldLabel>
              <Input
                id="values-heading"
                maxLength={ABOUT_CONTENT_LIMITS.sectionHeading}
                {...register("valuesHeading")}
              />
              <CharCount
                control={control}
                name="valuesHeading"
                max={ABOUT_CONTENT_LIMITS.sectionHeading}
              />
            </Field>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Values
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  values.append({ icon: ICON_OPTIONS[0]!, title: "", body: "" })
                }
              >
                <PlusIcon />
                Add value
              </Button>
            </div>
            {values.fields.map((field, index) => (
              <div
                key={field.id}
                className="relative rounded-md border border-border p-3"
              >
                {values.fields.length > 1 && (
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    className="absolute right-2 top-2 text-destructive hover:text-destructive"
                    onClick={() => values.remove(index)}
                  >
                    <Trash2Icon />
                    <span className="sr-only">Remove value</span>
                  </Button>
                )}
                <div className="grid gap-3 pr-8 sm:grid-cols-3">
                  <Field>
                    <FieldLabel>Icon</FieldLabel>
                    <IconSelect
                      control={control}
                      name={`values.${index}.icon`}
                      options={ICON_OPTIONS}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor={`value-title-${index}`}>
                      Title
                    </FieldLabel>
                    <Input
                      id={`value-title-${index}`}
                      maxLength={ABOUT_CONTENT_LIMITS.iconTitle}
                      {...register(`values.${index}.title`)}
                    />
                    <CharCount
                      control={control}
                      name={`values.${index}.title`}
                      max={ABOUT_CONTENT_LIMITS.iconTitle}
                    />
                  </Field>
                  <Field className="sm:col-span-3">
                    <FieldLabel htmlFor={`value-body-${index}`}>
                      Body
                    </FieldLabel>
                    <Textarea
                      id={`value-body-${index}`}
                      rows={2}
                      maxLength={ABOUT_CONTENT_LIMITS.iconBody}
                      {...register(`values.${index}.body`)}
                    />
                    <CharCount
                      control={control}
                      name={`values.${index}.body`}
                      max={ABOUT_CONTENT_LIMITS.iconBody}
                    />
                  </Field>
                </div>
              </div>
            ))}
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Why choose us</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={!!errors.whyChoose?.heading}>
                <FieldLabel htmlFor="why-heading">Heading</FieldLabel>
                <Input
                  id="why-heading"
                  maxLength={ABOUT_CONTENT_LIMITS.sectionHeading}
                  {...register("whyChoose.heading")}
                />
                <CharCount
                  control={control}
                  name="whyChoose.heading"
                  max={ABOUT_CONTENT_LIMITS.sectionHeading}
                />
              </Field>
              <Field data-invalid={!!errors.whyChoose?.body}>
                <FieldLabel htmlFor="why-body">Body</FieldLabel>
                <Input
                  id="why-body"
                  maxLength={ABOUT_CONTENT_LIMITS.ctaBody}
                  {...register("whyChoose.body")}
                />
                <CharCount
                  control={control}
                  name="whyChoose.body"
                  max={ABOUT_CONTENT_LIMITS.ctaBody}
                />
              </Field>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Items
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  whyChooseItems.append({
                    icon: ICON_OPTIONS[0]!,
                    title: "",
                    body: "",
                  })
                }
              >
                <PlusIcon />
                Add item
              </Button>
            </div>
            {whyChooseItems.fields.map((field, index) => (
              <div
                key={field.id}
                className="relative rounded-md border border-border p-3"
              >
                {whyChooseItems.fields.length > 1 && (
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    className="absolute right-2 top-2 text-destructive hover:text-destructive"
                    onClick={() => whyChooseItems.remove(index)}
                  >
                    <Trash2Icon />
                    <span className="sr-only">Remove item</span>
                  </Button>
                )}
                <div className="grid gap-3 pr-8 sm:grid-cols-3">
                  <Field>
                    <FieldLabel>Icon</FieldLabel>
                    <IconSelect
                      control={control}
                      name={`whyChoose.items.${index}.icon`}
                      options={ICON_OPTIONS}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor={`why-title-${index}`}>
                      Title
                    </FieldLabel>
                    <Input
                      id={`why-title-${index}`}
                      maxLength={ABOUT_CONTENT_LIMITS.iconTitle}
                      {...register(`whyChoose.items.${index}.title`)}
                    />
                    <CharCount
                      control={control}
                      name={`whyChoose.items.${index}.title`}
                      max={ABOUT_CONTENT_LIMITS.iconTitle}
                    />
                  </Field>
                  <Field className="sm:col-span-3">
                    <FieldLabel htmlFor={`why-item-body-${index}`}>
                      Body
                    </FieldLabel>
                    <Textarea
                      id={`why-item-body-${index}`}
                      rows={2}
                      maxLength={ABOUT_CONTENT_LIMITS.iconBody}
                      {...register(`whyChoose.items.${index}.body`)}
                    />
                    <CharCount
                      control={control}
                      name={`whyChoose.items.${index}.body`}
                      max={ABOUT_CONTENT_LIMITS.iconBody}
                    />
                  </Field>
                </div>
              </div>
            ))}
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Closing CTA</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={!!errors.cta?.heading}>
                <FieldLabel htmlFor="cta-heading">Heading</FieldLabel>
                <Input
                  id="cta-heading"
                  maxLength={ABOUT_CONTENT_LIMITS.sectionHeading}
                  {...register("cta.heading")}
                />
                <CharCount
                  control={control}
                  name="cta.heading"
                  max={ABOUT_CONTENT_LIMITS.sectionHeading}
                />
              </Field>
              <Field data-invalid={!!errors.cta?.body}>
                <FieldLabel htmlFor="cta-body">Body</FieldLabel>
                <Input
                  id="cta-body"
                  maxLength={ABOUT_CONTENT_LIMITS.ctaBody}
                  {...register("cta.body")}
                />
                <CharCount
                  control={control}
                  name="cta.body"
                  max={ABOUT_CONTENT_LIMITS.ctaBody}
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={!!errors.cta?.primaryCta}>
                <FieldLabel htmlFor="cta-primary">Primary CTA</FieldLabel>
                <Input
                  id="cta-primary"
                  maxLength={ABOUT_CONTENT_LIMITS.ctaText}
                  {...register("cta.primaryCta")}
                />
                <CharCount
                  control={control}
                  name="cta.primaryCta"
                  max={ABOUT_CONTENT_LIMITS.ctaText}
                />
              </Field>
              <Field data-invalid={!!errors.cta?.secondaryCta}>
                <FieldLabel htmlFor="cta-secondary">Secondary CTA</FieldLabel>
                <Input
                  id="cta-secondary"
                  maxLength={ABOUT_CONTENT_LIMITS.ctaText}
                  {...register("cta.secondaryCta")}
                />
                <CharCount
                  control={control}
                  name="cta.secondaryCta"
                  max={ABOUT_CONTENT_LIMITS.ctaText}
                />
              </Field>
            </div>
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

export default function AboutContentPage({
  onNavigate,
}: {
  onNavigate: (route: AdminRoute) => void;
}) {
  const { data, isLoading, isError } = useAboutContent();

  return (
    <AdminLayout
      title="About Us Content"
      activeRoute="content-about"
      onNavigate={onNavigate}
    >
      {isLoading && (
        <div className="flex flex-col gap-4 px-4 py-4 lg:px-6 md:py-6">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      )}
      {isError && (
        <p className="px-4 py-6 text-sm text-destructive lg:px-6">
          Failed to load About Us content.
        </p>
      )}
      {data && <AboutContentEditor content={data} />}
    </AdminLayout>
  );
}
