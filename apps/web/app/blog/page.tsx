import type { Metadata } from "next";
import { TopBar } from "@/components/layout/top-bar";
import { Header } from "@/components/layout/header";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { Footer } from "@/components/layout/footer";
import { BlogPostCard } from "@/components/blog/blog-post-card";
import { getBlogContent } from "@/lib/api/blog.api";
import {
  ContentUnavailable,
  unavailableMetadata,
} from "@/components/layout/content-unavailable";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const content = await getBlogContent();
  return content ? content.meta : unavailableMetadata("Blog");
}

export default async function BlogPage() {
  const content = await getBlogContent();
  const crumbs = [{ label: "Home", href: "/" }, { label: "Blog" }];

  if (!content) {
    return (
      <div className="font-sans bg-white text-secondary">
        <TopBar />
        <Header />
        <Breadcrumb crumbs={crumbs} />
        <main>
          <ContentUnavailable />
        </main>
        <Footer />
      </div>
    );
  }

  const posts = [...content.posts].sort((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt),
  );

  return (
    <div className="font-sans bg-white text-secondary">
      <TopBar />
      <Header />
      <Breadcrumb crumbs={crumbs} />

      <main className="max-w-300 mx-auto px-4 py-10">
        <header className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-[11px] font-bold uppercase tracking-[4px] text-accent mb-3">
            {content.eyebrow}
          </p>
          <h1 className="text-[clamp(24px,4vw,40px)] font-black text-foreground uppercase tracking-widest leading-tight mb-4">
            {content.heading}
          </h1>
          <p className="text-[15px] text-secondary leading-[1.85]">
            {content.intro}
          </p>
        </header>

        {posts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <BlogPostCard key={post.slug} post={post} />
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-subtle py-16">
            No posts yet — check back soon.
          </p>
        )}
      </main>

      <Footer />
    </div>
  );
}
