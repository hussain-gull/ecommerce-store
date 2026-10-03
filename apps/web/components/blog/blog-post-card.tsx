import Link from "next/link";
import type { BlogContentPost } from "@ecommerce/contracts";
import { BlogMedia } from "./blog-media";

export function BlogPostCard({ post }: { post: BlogContentPost }) {
  const date = new Date(`${post.publishedAt}T00:00:00Z`);
  const href = `/blog/${post.slug}`;

  return (
    <article className="flex flex-col">
      <Link
        href={href}
        className="relative block overflow-hidden mb-4 aspect-4/3 group bg-surface border border-line"
      >
        {post.media[0] && (
          <BlogMedia media={post.media[0]} alt={post.title} preview />
        )}
        <div className="absolute top-3 left-3 bg-accent text-white text-center px-2.5 py-1.5 min-w-11">
          <div className="text-xl font-bold leading-none">
            {date.getUTCDate()}
          </div>
          <div className="text-[10px] uppercase tracking-widest">
            {date.toLocaleDateString("en-GB", {
              month: "short",
              timeZone: "UTC",
            })}
          </div>
        </div>
      </Link>
      <p className="text-[11px] text-accent uppercase tracking-widest font-bold mb-2">
        {post.category}
      </p>
      <h3 className="text-sm font-bold text-foreground uppercase tracking-widest mb-2.5">
        <Link
          href={href}
          className="no-underline text-foreground hover:text-accent transition-colors"
        >
          {post.title}
        </Link>
      </h3>
      <p className="text-[13px] text-secondary leading-relaxed mb-3.5">
        {post.excerpt}
      </p>
      <Link
        href={href}
        className="mt-auto self-start text-xs font-bold text-foreground uppercase tracking-widest no-underline border-b border-foreground pb-0.5 hover:text-accent hover:border-accent transition-colors"
      >
        Read More
      </Link>
    </article>
  );
}
