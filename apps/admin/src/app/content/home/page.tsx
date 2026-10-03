import {
  useForm,
  useFieldArray,
  useWatch,
  type Control,
  type UseFormSetValue,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  homeContentSchema,
  HOME_CONTENT_LIMITS,
  type HomeContent,
} from "@ecommerce/contracts";
import { PlusIcon, Trash2Icon, Loader2Icon, SaveIcon } from "lucide-react";
import { AdminLayout } from "@/components/admin-layout";
import { ImageUploadField } from "@/components/content/image-upload-field";
import { CharCount } from "@/components/content/char-count";
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
import { useHomeContent, useUpdateHomeContent } from "@/lib/hooks/use-content";
import type { AdminRoute } from "@/lib/routes";

function fieldErrors(message?: string) {
  return message ? [{ message }] : undefined;
}

function CategoryImageField({
  control,
  index,
  setValue,
}: {
  control: Control<HomeContent>;
  index: number;
  setValue: UseFormSetValue<HomeContent>;
}) {
  const value = useWatch({
    control,
    name: `categorySection.categories.${index}.imageUrl`,
  });
  return (
    <ImageUploadField
      category="home-category"
      value={value}
      onChange={(url) =>
        setValue(`categorySection.categories.${index}.imageUrl`, url, {
          shouldDirty: true,
        })
      }
    />
  );
}

function HomeContentEditor({ content }: { content: HomeContent }) {
  const { mutate: save, isPending } = useUpdateHomeContent();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isDirty },
  } = useForm<HomeContent>({
    resolver: zodResolver(homeContentSchema),
    defaultValues: content,
  });

  const heroStats = useFieldArray({ control, name: "hero.stats" });
  const categories = useFieldArray({
    control,
    name: "categorySection.categories",
  });
  const stats = useFieldArray({ control, name: "stats" });

  return (
    <form
      onSubmit={handleSubmit((values) => save(values))}
      className="flex flex-col gap-6 px-4 py-4 lg:px-6 md:py-6"
    >
      <Card>
        <CardHeader>
          <CardTitle>Hero</CardTitle>
          <CardDescription>The first thing visitors see.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel>Hero image</FieldLabel>
              <ImageUploadField
                category="home-hero"
                value={useWatch({ control, name: "hero.imageUrl" })}
                onChange={(url) =>
                  setValue("hero.imageUrl", url, { shouldDirty: true })
                }
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={!!errors.hero?.eyebrow}>
                <FieldLabel htmlFor="hero-eyebrow">Eyebrow</FieldLabel>
                <Input
                  id="hero-eyebrow"
                  maxLength={HOME_CONTENT_LIMITS.heroEyebrow}
                  {...register("hero.eyebrow")}
                />
                <CharCount
                  control={control}
                  name="hero.eyebrow"
                  max={HOME_CONTENT_LIMITS.heroEyebrow}
                />
                <FieldError
                  errors={fieldErrors(errors.hero?.eyebrow?.message)}
                />
              </Field>
              <Field data-invalid={!!errors.hero?.badge}>
                <FieldLabel htmlFor="hero-badge">Badge</FieldLabel>
                <Input
                  id="hero-badge"
                  maxLength={HOME_CONTENT_LIMITS.heroBadge}
                  {...register("hero.badge")}
                />
                <CharCount
                  control={control}
                  name="hero.badge"
                  max={HOME_CONTENT_LIMITS.heroBadge}
                />
                <FieldError errors={fieldErrors(errors.hero?.badge?.message)} />
              </Field>
            </div>

            <Field data-invalid={!!errors.hero?.heading}>
              <FieldLabel htmlFor="hero-heading">Heading</FieldLabel>
              <Input
                id="hero-heading"
                maxLength={HOME_CONTENT_LIMITS.heroHeading}
                {...register("hero.heading")}
              />
              <CharCount
                control={control}
                name="hero.heading"
                max={HOME_CONTENT_LIMITS.heroHeading}
              />
              <FieldError errors={fieldErrors(errors.hero?.heading?.message)} />
            </Field>

            <Field data-invalid={!!errors.hero?.body}>
              <FieldLabel htmlFor="hero-body">Body</FieldLabel>
              <Textarea
                id="hero-body"
                rows={3}
                maxLength={HOME_CONTENT_LIMITS.heroBody}
                {...register("hero.body")}
              />
              <CharCount
                control={control}
                name="hero.body"
                max={HOME_CONTENT_LIMITS.heroBody}
              />
              <FieldError errors={fieldErrors(errors.hero?.body?.message)} />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={!!errors.hero?.primaryCta}>
                <FieldLabel htmlFor="hero-primary-cta">Primary CTA</FieldLabel>
                <Input
                  id="hero-primary-cta"
                  maxLength={HOME_CONTENT_LIMITS.heroCta}
                  {...register("hero.primaryCta")}
                />
                <CharCount
                  control={control}
                  name="hero.primaryCta"
                  max={HOME_CONTENT_LIMITS.heroCta}
                />
                <FieldError
                  errors={fieldErrors(errors.hero?.primaryCta?.message)}
                />
              </Field>
              <Field data-invalid={!!errors.hero?.secondaryCta}>
                <FieldLabel htmlFor="hero-secondary-cta">
                  Secondary CTA
                </FieldLabel>
                <Input
                  id="hero-secondary-cta"
                  maxLength={HOME_CONTENT_LIMITS.heroCta}
                  {...register("hero.secondaryCta")}
                />
                <CharCount
                  control={control}
                  name="hero.secondaryCta"
                  max={HOME_CONTENT_LIMITS.heroCta}
                />
                <FieldError
                  errors={fieldErrors(errors.hero?.secondaryCta?.message)}
                />
              </Field>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Stats
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => heroStats.append({ value: "", label: "" })}
              >
                <PlusIcon />
                Add stat
              </Button>
            </div>
            {heroStats.fields.map((field, index) => (
              <div
                key={field.id}
                className="relative rounded-md border border-border p-3"
              >
                {heroStats.fields.length > 1 && (
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    className="absolute right-2 top-2 text-destructive hover:text-destructive"
                    onClick={() => heroStats.remove(index)}
                  >
                    <Trash2Icon />
                    <span className="sr-only">Remove stat</span>
                  </Button>
                )}
                <div className="grid gap-3 pr-8 sm:grid-cols-2">
                  <Field data-invalid={!!errors.hero?.stats?.[index]?.value}>
                    <FieldLabel htmlFor={`hero-stat-value-${index}`}>
                      Value
                    </FieldLabel>
                    <Input
                      id={`hero-stat-value-${index}`}
                      maxLength={HOME_CONTENT_LIMITS.statValue}
                      {...register(`hero.stats.${index}.value`)}
                    />
                    <CharCount
                      control={control}
                      name={`hero.stats.${index}.value`}
                      max={HOME_CONTENT_LIMITS.statValue}
                    />
                    <FieldError
                      errors={fieldErrors(
                        errors.hero?.stats?.[index]?.value?.message,
                      )}
                    />
                  </Field>
                  <Field data-invalid={!!errors.hero?.stats?.[index]?.label}>
                    <FieldLabel htmlFor={`hero-stat-label-${index}`}>
                      Label
                    </FieldLabel>
                    <Input
                      id={`hero-stat-label-${index}`}
                      maxLength={HOME_CONTENT_LIMITS.statLabel}
                      {...register(`hero.stats.${index}.label`)}
                    />
                    <CharCount
                      control={control}
                      name={`hero.stats.${index}.label`}
                      max={HOME_CONTENT_LIMITS.statLabel}
                    />
                    <FieldError
                      errors={fieldErrors(
                        errors.hero?.stats?.[index]?.label?.message,
                      )}
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
          <CardTitle>Ticker</CardTitle>
          <CardDescription>Scrolling strip beneath the hero.</CardDescription>
        </CardHeader>
        <CardContent>
          <Field data-invalid={!!errors.ticker}>
            <FieldLabel htmlFor="ticker">Ticker text</FieldLabel>
            <Textarea
              id="ticker"
              rows={2}
              maxLength={HOME_CONTENT_LIMITS.ticker}
              {...register("ticker")}
            />
            <CharCount
              control={control}
              name="ticker"
              max={HOME_CONTENT_LIMITS.ticker}
            />
            <FieldError errors={fieldErrors(errors.ticker?.message)} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Category Section</CardTitle>
          <CardDescription>Ground-type category cards.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={!!errors.categorySection?.eyebrow}>
                <FieldLabel htmlFor="category-eyebrow">Eyebrow</FieldLabel>
                <Input
                  id="category-eyebrow"
                  maxLength={HOME_CONTENT_LIMITS.sectionEyebrow}
                  {...register("categorySection.eyebrow")}
                />
                <CharCount
                  control={control}
                  name="categorySection.eyebrow"
                  max={HOME_CONTENT_LIMITS.sectionEyebrow}
                />
                <FieldError
                  errors={fieldErrors(errors.categorySection?.eyebrow?.message)}
                />
              </Field>
              <Field data-invalid={!!errors.categorySection?.heading}>
                <FieldLabel htmlFor="category-heading">Heading</FieldLabel>
                <Input
                  id="category-heading"
                  maxLength={HOME_CONTENT_LIMITS.sectionHeading}
                  {...register("categorySection.heading")}
                />
                <CharCount
                  control={control}
                  name="categorySection.heading"
                  max={HOME_CONTENT_LIMITS.sectionHeading}
                />
                <FieldError
                  errors={fieldErrors(errors.categorySection?.heading?.message)}
                />
              </Field>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Categories
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  categories.append({
                    code: "",
                    label: "",
                    tagline: "",
                    desc: "",
                  })
                }
              >
                <PlusIcon />
                Add category
              </Button>
            </div>
            {categories.fields.map((field, index) => (
              <div
                key={field.id}
                className="relative rounded-md border border-border p-3"
              >
                {categories.fields.length > 1 && (
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    className="absolute right-2 top-2 text-destructive hover:text-destructive"
                    onClick={() => categories.remove(index)}
                  >
                    <Trash2Icon />
                    <span className="sr-only">Remove category</span>
                  </Button>
                )}
                <div className="mb-3">
                  <CategoryImageField
                    control={control}
                    index={index}
                    setValue={setValue}
                  />
                </div>
                <div className="grid gap-3 pr-8 sm:grid-cols-2">
                  <Field
                    data-invalid={
                      !!errors.categorySection?.categories?.[index]?.code
                    }
                  >
                    <FieldLabel htmlFor={`cat-code-${index}`}>Code</FieldLabel>
                    <Input
                      id={`cat-code-${index}`}
                      maxLength={HOME_CONTENT_LIMITS.categoryCode}
                      {...register(`categorySection.categories.${index}.code`)}
                    />
                    <CharCount
                      control={control}
                      name={`categorySection.categories.${index}.code`}
                      max={HOME_CONTENT_LIMITS.categoryCode}
                    />
                    <FieldError
                      errors={fieldErrors(
                        errors.categorySection?.categories?.[index]?.code
                          ?.message,
                      )}
                    />
                  </Field>
                  <Field
                    data-invalid={
                      !!errors.categorySection?.categories?.[index]?.label
                    }
                  >
                    <FieldLabel htmlFor={`cat-label-${index}`}>
                      Label
                    </FieldLabel>
                    <Input
                      id={`cat-label-${index}`}
                      maxLength={HOME_CONTENT_LIMITS.categoryLabel}
                      {...register(`categorySection.categories.${index}.label`)}
                    />
                    <CharCount
                      control={control}
                      name={`categorySection.categories.${index}.label`}
                      max={HOME_CONTENT_LIMITS.categoryLabel}
                    />
                    <FieldError
                      errors={fieldErrors(
                        errors.categorySection?.categories?.[index]?.label
                          ?.message,
                      )}
                    />
                  </Field>
                  <Field
                    data-invalid={
                      !!errors.categorySection?.categories?.[index]?.tagline
                    }
                  >
                    <FieldLabel htmlFor={`cat-tagline-${index}`}>
                      Tagline
                    </FieldLabel>
                    <Input
                      id={`cat-tagline-${index}`}
                      maxLength={HOME_CONTENT_LIMITS.categoryTagline}
                      {...register(
                        `categorySection.categories.${index}.tagline`,
                      )}
                    />
                    <CharCount
                      control={control}
                      name={`categorySection.categories.${index}.tagline`}
                      max={HOME_CONTENT_LIMITS.categoryTagline}
                    />
                    <FieldError
                      errors={fieldErrors(
                        errors.categorySection?.categories?.[index]?.tagline
                          ?.message,
                      )}
                    />
                  </Field>
                  <Field
                    data-invalid={
                      !!errors.categorySection?.categories?.[index]?.desc
                    }
                    className="sm:col-span-2"
                  >
                    <FieldLabel htmlFor={`cat-desc-${index}`}>
                      Description
                    </FieldLabel>
                    <Textarea
                      id={`cat-desc-${index}`}
                      rows={2}
                      maxLength={HOME_CONTENT_LIMITS.categoryDesc}
                      {...register(`categorySection.categories.${index}.desc`)}
                    />
                    <CharCount
                      control={control}
                      name={`categorySection.categories.${index}.desc`}
                      max={HOME_CONTENT_LIMITS.categoryDesc}
                    />
                    <FieldError
                      errors={fieldErrors(
                        errors.categorySection?.categories?.[index]?.desc
                          ?.message,
                      )}
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
          <CardTitle>Bestsellers</CardTitle>
          <CardDescription>Top-picks products grid.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={!!errors.bestsellers?.eyebrow}>
                <FieldLabel htmlFor="bestsellers-eyebrow">Eyebrow</FieldLabel>
                <Input
                  id="bestsellers-eyebrow"
                  maxLength={HOME_CONTENT_LIMITS.sectionEyebrow}
                  {...register("bestsellers.eyebrow")}
                />
                <CharCount
                  control={control}
                  name="bestsellers.eyebrow"
                  max={HOME_CONTENT_LIMITS.sectionEyebrow}
                />
                <FieldError
                  errors={fieldErrors(errors.bestsellers?.eyebrow?.message)}
                />
              </Field>
              <Field data-invalid={!!errors.bestsellers?.heading}>
                <FieldLabel htmlFor="bestsellers-heading">Heading</FieldLabel>
                <Input
                  id="bestsellers-heading"
                  maxLength={HOME_CONTENT_LIMITS.sectionHeading}
                  {...register("bestsellers.heading")}
                />
                <CharCount
                  control={control}
                  name="bestsellers.heading"
                  max={HOME_CONTENT_LIMITS.sectionHeading}
                />
                <FieldError
                  errors={fieldErrors(errors.bestsellers?.heading?.message)}
                />
              </Field>
            </div>
            <Field data-invalid={!!errors.bestsellers?.viewAllCta}>
              <FieldLabel htmlFor="bestsellers-cta">View all CTA</FieldLabel>
              <Input
                id="bestsellers-cta"
                maxLength={HOME_CONTENT_LIMITS.viewAllCta}
                {...register("bestsellers.viewAllCta")}
              />
              <CharCount
                control={control}
                name="bestsellers.viewAllCta"
                max={HOME_CONTENT_LIMITS.viewAllCta}
              />
              <FieldError
                errors={fieldErrors(errors.bestsellers?.viewAllCta?.message)}
              />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stats Strip</CardTitle>
          <CardDescription>
            Trust stats shown below bestsellers.
          </CardDescription>
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
                  <Field data-invalid={!!errors.stats?.[index]?.value}>
                    <FieldLabel htmlFor={`stat-value-${index}`}>
                      Value
                    </FieldLabel>
                    <Input
                      id={`stat-value-${index}`}
                      maxLength={HOME_CONTENT_LIMITS.statValue}
                      {...register(`stats.${index}.value`)}
                    />
                    <CharCount
                      control={control}
                      name={`stats.${index}.value`}
                      max={HOME_CONTENT_LIMITS.statValue}
                    />
                    <FieldError
                      errors={fieldErrors(
                        errors.stats?.[index]?.value?.message,
                      )}
                    />
                  </Field>
                  <Field data-invalid={!!errors.stats?.[index]?.label}>
                    <FieldLabel htmlFor={`stat-label-${index}`}>
                      Label
                    </FieldLabel>
                    <Input
                      id={`stat-label-${index}`}
                      maxLength={HOME_CONTENT_LIMITS.statLabel}
                      {...register(`stats.${index}.label`)}
                    />
                    <CharCount
                      control={control}
                      name={`stats.${index}.label`}
                      max={HOME_CONTENT_LIMITS.statLabel}
                    />
                    <FieldError
                      errors={fieldErrors(
                        errors.stats?.[index]?.label?.message,
                      )}
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
          <CardDescription>Final call-to-action strip.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={!!errors.cta?.eyebrow}>
                <FieldLabel htmlFor="cta-eyebrow">Eyebrow</FieldLabel>
                <Input
                  id="cta-eyebrow"
                  maxLength={HOME_CONTENT_LIMITS.sectionEyebrow}
                  {...register("cta.eyebrow")}
                />
                <CharCount
                  control={control}
                  name="cta.eyebrow"
                  max={HOME_CONTENT_LIMITS.sectionEyebrow}
                />
                <FieldError
                  errors={fieldErrors(errors.cta?.eyebrow?.message)}
                />
              </Field>
              <Field data-invalid={!!errors.cta?.ctaText}>
                <FieldLabel htmlFor="cta-text">CTA text</FieldLabel>
                <Input
                  id="cta-text"
                  maxLength={HOME_CONTENT_LIMITS.ctaText}
                  {...register("cta.ctaText")}
                />
                <CharCount
                  control={control}
                  name="cta.ctaText"
                  max={HOME_CONTENT_LIMITS.ctaText}
                />
                <FieldError
                  errors={fieldErrors(errors.cta?.ctaText?.message)}
                />
              </Field>
            </div>
            <Field data-invalid={!!errors.cta?.heading}>
              <FieldLabel htmlFor="cta-heading">Heading</FieldLabel>
              <Input
                id="cta-heading"
                maxLength={HOME_CONTENT_LIMITS.sectionHeading}
                {...register("cta.heading")}
              />
              <CharCount
                control={control}
                name="cta.heading"
                max={HOME_CONTENT_LIMITS.sectionHeading}
              />
              <FieldError errors={fieldErrors(errors.cta?.heading?.message)} />
            </Field>
            <Field data-invalid={!!errors.cta?.body}>
              <FieldLabel htmlFor="cta-body">Body</FieldLabel>
              <Textarea
                id="cta-body"
                rows={3}
                maxLength={HOME_CONTENT_LIMITS.ctaBody}
                {...register("cta.body")}
              />
              <CharCount
                control={control}
                name="cta.body"
                max={HOME_CONTENT_LIMITS.ctaBody}
              />
              <FieldError errors={fieldErrors(errors.cta?.body?.message)} />
            </Field>
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

export default function HomeContentPage({
  onNavigate,
}: {
  onNavigate: (route: AdminRoute) => void;
}) {
  const { data, isLoading, isError } = useHomeContent();

  return (
    <AdminLayout
      title="Home Page Content"
      activeRoute="content-home"
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
          Failed to load home page content.
        </p>
      )}
      {data && <HomeContentEditor content={data} />}
    </AdminLayout>
  );
}
