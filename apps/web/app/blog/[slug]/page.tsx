import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { Header } from "@/components/layout/header";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { Footer } from "@/components/layout/footer";
import { BlogMedia } from "@/components/blog/blog-media";
import { formatPostDate, getBlogContent } from "@/lib/api/blog.api";
import {
  ContentUnavailable,
  unavailableMetadata,
} from "@/components/layout/content-unavailable";
import { branding } from "@ecommerce/contracts";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

// available=false → blog content isn't set up (show "unavailable", not a 404);
// available=true + no post → that slug doesn't exist (404).
async function getPost(slug: string) {
  const content = await getBlogContent();
  return {
    available: content !== null,
    post: content?.posts.find((p) => p.slug === slug),
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { available, post } = await getPost((await params).slug);
  if (!available) return unavailableMetadata("Blog");
  return {
    title: post ? `${post.title} — ${branding.storeName}` : "Post Not Found",
    description: post?.excerpt ?? "",
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { available, post } = await getPost((await params).slug);

  if (!available) {
    return (
      <div className="font-sans bg-white text-secondary">
        <TopBar />
        <Header />
        <Breadcrumb
          crumbs={[
            { label: "Home", href: "/" },
            { label: "Blog", href: "/blog" },
          ]}
        />
        <main>
          <ContentUnavailable />
        </main>
        <Footer />
      </div>
    );
  }
  if (!post) notFound();

  return (
    <div className="font-sans bg-white text-secondary">
      <TopBar />
      <Header />
      <Breadcrumb
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Blog", href: "/blog" },
          { label: post.title },
        ]}
      />

      <main className="max-w-3xl mx-auto px-4 py-10">
        <article>
          <p className="text-[11px] font-bold uppercase tracking-[4px] text-accent mb-3">
            {post.category}
          </p>
          <h1 className="text-[clamp(22px,3.5vw,34px)] font-black text-foreground uppercase tracking-widest leading-tight mb-4">
            {post.title}
          </h1>
          <p className="text-xs uppercase tracking-widest text-subtle mb-8">
            By {post.author} ·{" "}
            <time dateTime={post.publishedAt}>
              {formatPostDate(post.publishedAt)}
            </time>
          </p>

          {post.media[0] && (
            <div className="relative aspect-video bg-surface border border-line overflow-hidden mb-8">
              <BlogMedia media={post.media[0]} alt={post.title} priority />
            </div>
          )}

          {post.body.map((p) => (
            <p
              key={p}
              className="text-[15px] text-secondary leading-[1.85] mb-5"
            >
              {p}
            </p>
          ))}

          {post.media.length > 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
              {post.media.slice(1).map((m, i) => (
                <div
                  key={m.url}
                  className="relative aspect-4/3 bg-surface border border-line overflow-hidden group"
                >
                  <BlogMedia media={m} alt={`${post.title} — ${i + 2}`} />
                </div>
              ))}
            </div>
          )}
        </article>

        <Link
          href="/blog"
          className="inline-flex items-center h-11 px-8 mt-6 bg-foreground text-white text-xs font-bold tracking-[2px] uppercase no-underline hover:bg-accent transition-colors"
        >
          Back to Blog
        </Link>
      </main>

      <Footer />
    </div>
  );
}
