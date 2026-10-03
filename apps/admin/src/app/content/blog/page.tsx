import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  blogContentSchema,
  BLOG_CONTENT_LIMITS,
  type BlogContent,
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
import { useBlogContent, useUpdateBlogContent } from "@/lib/hooks/use-content";
import { CharCount } from "@/components/content/char-count";
import { MediaListField } from "@/components/content/media-list-field";
import type { AdminRoute } from "@/lib/routes";

function fieldErrors(message?: string) {
  return message ? [{ message }] : undefined;
}

function PostParagraphs({
  control,
  index,
}: {
  // ponytail: nested array-of-array paths (posts[].body[]) blow past RHF's
  // path-inference depth, so this inner component is typed loosely on purpose.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: import("react-hook-form").Control<any>;
  index: number;
}) {
  const paragraphs = useFieldArray({ control, name: `posts.${index}.body` });
  return (
    <div className="sm:col-span-2 space-y-2">
      <div className="flex items-center justify-between">
        <FieldLabel>Body paragraphs</FieldLabel>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => paragraphs.append("")}
        >
          <PlusIcon />
          Add paragraph
        </Button>
      </div>
      {paragraphs.fields.map((field, pIndex) => (
        <div key={field.id} className="space-y-1">
          <div className="flex items-start gap-2">
            <Controller
              control={control}
              name={`posts.${index}.body.${pIndex}`}
              render={({ field: f }) => (
                <Textarea
                  rows={3}
                  maxLength={BLOG_CONTENT_LIMITS.postParagraph}
                  {...f}
                />
              )}
            />
            {paragraphs.fields.length > 1 && (
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => paragraphs.remove(pIndex)}
              >
                <Trash2Icon />
                <span className="sr-only">Remove paragraph</span>
              </Button>
            )}
          </div>
          <CharCount
            control={control}
            name={`posts.${index}.body.${pIndex}`}
            max={BLOG_CONTENT_LIMITS.postParagraph}
          />
        </div>
      ))}
    </div>
  );
}

function BlogContentEditor({ content }: { content: BlogContent }) {
  const { mutate: save, isPending } = useUpdateBlogContent();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<BlogContent>({
    resolver: zodResolver(blogContentSchema),
    defaultValues: content,
  });

  const posts = useFieldArray({ control, name: "posts" });

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
                maxLength={BLOG_CONTENT_LIMITS.metaTitle}
                {...register("meta.title")}
              />
              <CharCount
                control={control}
                name="meta.title"
                max={BLOG_CONTENT_LIMITS.metaTitle}
              />
              <FieldError errors={fieldErrors(errors.meta?.title?.message)} />
            </Field>
            <Field data-invalid={!!errors.meta?.description}>
              <FieldLabel htmlFor="meta-description">Description</FieldLabel>
              <Textarea
                id="meta-description"
                rows={2}
                maxLength={BLOG_CONTENT_LIMITS.metaDescription}
                {...register("meta.description")}
              />
              <CharCount
                control={control}
                name="meta.description"
                max={BLOG_CONTENT_LIMITS.metaDescription}
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
          <CardTitle>Page header</CardTitle>
          <CardDescription>Shown above the list of posts.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={!!errors.eyebrow}>
                <FieldLabel htmlFor="eyebrow">Eyebrow</FieldLabel>
                <Input
                  id="eyebrow"
                  maxLength={BLOG_CONTENT_LIMITS.eyebrow}
                  {...register("eyebrow")}
                />
                <CharCount
                  control={control}
                  name="eyebrow"
                  max={BLOG_CONTENT_LIMITS.eyebrow}
                />
                <FieldError errors={fieldErrors(errors.eyebrow?.message)} />
              </Field>
              <Field data-invalid={!!errors.heading}>
                <FieldLabel htmlFor="heading">Heading</FieldLabel>
                <Input
                  id="heading"
                  maxLength={BLOG_CONTENT_LIMITS.heading}
                  {...register("heading")}
                />
                <CharCount
                  control={control}
                  name="heading"
                  max={BLOG_CONTENT_LIMITS.heading}
                />
                <FieldError errors={fieldErrors(errors.heading?.message)} />
              </Field>
            </div>
            <Field data-invalid={!!errors.intro}>
              <FieldLabel htmlFor="intro">Intro</FieldLabel>
              <Textarea
                id="intro"
                rows={3}
                maxLength={BLOG_CONTENT_LIMITS.intro}
                {...register("intro")}
              />
              <CharCount
                control={control}
                name="intro"
                max={BLOG_CONTENT_LIMITS.intro}
              />
              <FieldError errors={fieldErrors(errors.intro?.message)} />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Posts</CardTitle>
          <CardDescription>
            Shown newest first. Each post is available at /blog/&lt;slug&gt;.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                {posts.fields.length} post
                {posts.fields.length === 1 ? "" : "s"}
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  posts.prepend({
                    slug: "",
                    title: "",
                    category: "",
                    author: "",
                    publishedAt: new Date().toISOString().slice(0, 10),
                    excerpt: "",
                    body: [""],
                    media: [],
                  })
                }
              >
                <PlusIcon />
                Add post
              </Button>
            </div>
            <FieldError errors={fieldErrors(errors.posts?.root?.message)} />
            {posts.fields.map((field, index) => {
              const postErrors = errors.posts?.[index];
              return (
                <div
                  key={field.id}
                  className="relative rounded-md border border-border p-3"
                >
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    className="absolute right-2 top-2 text-destructive hover:text-destructive"
                    onClick={() => posts.remove(index)}
                  >
                    <Trash2Icon />
                    <span className="sr-only">Remove post</span>
                  </Button>
                  <div className="grid gap-3 pr-8 sm:grid-cols-2">
                    <Field
                      className="sm:col-span-2"
                      data-invalid={!!postErrors?.title}
                    >
                      <FieldLabel htmlFor={`post-title-${index}`}>
                        Title
                      </FieldLabel>
                      <Input
                        id={`post-title-${index}`}
                        maxLength={BLOG_CONTENT_LIMITS.postTitle}
                        {...register(`posts.${index}.title`)}
                      />
                      <CharCount
                        control={control}
                        name={`posts.${index}.title`}
                        max={BLOG_CONTENT_LIMITS.postTitle}
                      />
                      <FieldError
                        errors={fieldErrors(postErrors?.title?.message)}
                      />
                    </Field>
                    <Field data-invalid={!!postErrors?.slug}>
                      <FieldLabel htmlFor={`post-slug-${index}`}>
                        Slug
                      </FieldLabel>
                      <Input
                        id={`post-slug-${index}`}
                        placeholder="e.g. caring-for-your-boots"
                        maxLength={BLOG_CONTENT_LIMITS.slug}
                        {...register(`posts.${index}.slug`)}
                      />
                      <FieldError
                        errors={fieldErrors(postErrors?.slug?.message)}
                      />
                    </Field>
                    <Field data-invalid={!!postErrors?.category}>
                      <FieldLabel htmlFor={`post-category-${index}`}>
                        Category
                      </FieldLabel>
                      <Input
                        id={`post-category-${index}`}
                        maxLength={BLOG_CONTENT_LIMITS.postCategory}
                        {...register(`posts.${index}.category`)}
                      />
                      <FieldError
                        errors={fieldErrors(postErrors?.category?.message)}
                      />
                    </Field>
                    <Field data-invalid={!!postErrors?.author}>
                      <FieldLabel htmlFor={`post-author-${index}`}>
                        Author
                      </FieldLabel>
                      <Input
                        id={`post-author-${index}`}
                        maxLength={BLOG_CONTENT_LIMITS.postAuthor}
                        {...register(`posts.${index}.author`)}
                      />
                      <FieldError
                        errors={fieldErrors(postErrors?.author?.message)}
                      />
                    </Field>
                    <Field data-invalid={!!postErrors?.publishedAt}>
                      <FieldLabel htmlFor={`post-date-${index}`}>
                        Publish date
                      </FieldLabel>
                      <Input
                        id={`post-date-${index}`}
                        type="date"
                        {...register(`posts.${index}.publishedAt`)}
                      />
                      <FieldError
                        errors={fieldErrors(postErrors?.publishedAt?.message)}
                      />
                    </Field>
                    <Field
                      className="sm:col-span-2"
                      data-invalid={!!postErrors?.excerpt}
                    >
                      <FieldLabel htmlFor={`post-excerpt-${index}`}>
                        Excerpt
                      </FieldLabel>
                      <Textarea
                        id={`post-excerpt-${index}`}
                        rows={2}
                        maxLength={BLOG_CONTENT_LIMITS.postExcerpt}
                        {...register(`posts.${index}.excerpt`)}
                      />
                      <CharCount
                        control={control}
                        name={`posts.${index}.excerpt`}
                        max={BLOG_CONTENT_LIMITS.postExcerpt}
                      />
                      <FieldError
                        errors={fieldErrors(postErrors?.excerpt?.message)}
                      />
                    </Field>
                    <Field
                      className="sm:col-span-2"
                      data-invalid={!!postErrors?.media}
                    >
                      <FieldLabel>Images & videos</FieldLabel>
                      <Controller
                        control={control}
                        name={`posts.${index}.media`}
                        render={({ field: f }) => (
                          <MediaListField
                            category="blog"
                            value={f.value}
                            onChange={f.onChange}
                            max={BLOG_CONTENT_LIMITS.postMedia}
                          />
                        )}
                      />
                      <FieldError
                        errors={fieldErrors(postErrors?.media?.message)}
                      />
                    </Field>
                    <PostParagraphs control={control as never} index={index} />
                  </div>
                </div>
              );
            })}
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

export default function BlogContentPage({
  onNavigate,
}: {
  onNavigate: (route: AdminRoute) => void;
}) {
  const { data, isLoading, isError } = useBlogContent();

  return (
    <AdminLayout
      title="Blog Content"
      activeRoute="content-blog"
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
          Failed to load Blog content.
        </p>
      )}
      {data && <BlogContentEditor content={data} />}
    </AdminLayout>
  );
}
