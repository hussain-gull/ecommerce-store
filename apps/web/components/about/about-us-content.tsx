"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import {
  Award,
  Globe,
  Users,
  Leaf,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { AboutUsContent as AboutUsContentType } from "@ecommerce/contracts";
import { branding } from "@ecommerce/contracts";

const ICONS: Record<string, LucideIcon> = {
  Award,
  Globe,
  Users,
  Leaf,
  ShieldCheck,
  Sparkles,
};

function FadeIn({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.45, delay }}
    >
      {children}
    </motion.div>
  );
}

export function AboutUsContent({ content }: { content: AboutUsContentType }) {
  const { story, stats: STATS, values: VALUES_RAW, whyChoose, cta } = content;
  const VALUES = VALUES_RAW.map(({ icon, title, body }) => ({
    Icon: ICONS[icon] ?? Sparkles,
    title,
    body,
  }));
  const WHY_CHOOSE_ITEMS = whyChoose.items.map(({ icon, title, body }) => ({
    Icon: ICONS[icon] ?? Sparkles,
    title,
    body,
  }));

  return (
    <div className="max-w-300 mx-auto px-4 py-10 space-y-20">
      {/* ── Hero intro ── */}
      <section>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <FadeIn>
            <p className="text-[11px] font-bold uppercase tracking-[4px] text-accent mb-3">
              {story.eyebrow}
            </p>
            <h2 className="text-[clamp(24px,4vw,40px)] font-black text-foreground uppercase tracking-widest leading-tight mb-5">
              {story.heading[0]}
              <br />
              {story.heading[1]}
            </h2>
            {story.paragraphs.map((p, i) => (
              <p
                key={p}
                className={`text-[15px] text-secondary leading-[1.85] ${i === story.paragraphs.length - 1 ? "mb-7" : "mb-5"}`}
              >
                {p}
              </p>
            ))}
            <Link
              href="/shop"
              className="inline-flex items-center h-11 px-8 bg-foreground text-white text-xs font-bold tracking-[2px] uppercase no-underline hover:bg-accent transition-colors"
            >
              {story.cta}
            </Link>
          </FadeIn>

          {/* Story image — falls back to a branded placeholder when unset */}
          <FadeIn delay={0.1}>
            <div className="relative aspect-[4/3] bg-surface border border-line overflow-hidden">
              {story.imageUrl ? (
                <img
                  src={story.imageUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center">
                    <Globe size={28} className="text-white" />
                  </div>
                  <p className="text-[11px] font-bold uppercase tracking-[3px] text-accent">
                    Since {story.sinceYear}
                  </p>
                  <p className="text-2xl font-black text-foreground uppercase tracking-widest">
                    {branding.storeName}
                  </p>
                  <p className="text-[13px] text-secondary leading-relaxed max-w-64">
                    {story.tagline}
                  </p>
                </div>
              )}
              {/* Decorative corner accents */}
              <span className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-accent" />
              <span className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-accent" />
              <span className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-accent" />
              <span className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-accent" />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <FadeIn>
        <section className="bg-foreground">
          <div className="grid grid-cols-2 lg:grid-cols-4">
            {STATS.map(({ value, label }, i) => (
              <div
                key={label}
                className={`py-10 px-6 text-center ${i < STATS.length - 1 ? "border-r border-white/10" : ""}`}
              >
                <p className="text-[clamp(28px,4vw,42px)] font-black text-accent leading-none mb-2">
                  {value}
                </p>
                <p className="text-[11px] font-bold uppercase tracking-[2px] text-white/60">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </section>
      </FadeIn>

      {/* ── Values ── */}
      <section>
        <FadeIn>
          <div className="text-center mb-10">
            <h2 className="text-xl font-bold text-foreground uppercase tracking-widest">
              <span className="text-secondary mr-1.5">/</span>
              {content.valuesHeading}
              <span className="text-accent">.</span>
            </h2>
          </div>
        </FadeIn>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {VALUES.map(({ Icon, title, body }, i) => (
            <FadeIn key={title} delay={i * 0.08}>
              <div className="bg-surface border border-line p-8 h-full">
                <div className="w-12 h-12 bg-accent flex items-center justify-center mb-5">
                  <Icon size={20} className="text-white" />
                </div>
                <h3 className="text-[13px] font-bold uppercase tracking-widest text-foreground mb-3">
                  {title}
                </h3>
                <p className="text-[13px] text-secondary leading-[1.8]">
                  {body}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── Why choose us ── */}
      <section>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <FadeIn>
            <div className="space-y-5">
              {WHY_CHOOSE_ITEMS.map(({ Icon, title, body }) => (
                <div key={title} className="flex gap-5 items-start">
                  <div className="w-11 h-11 bg-surface border border-line flex items-center justify-center shrink-0">
                    <Icon size={18} className="text-accent" />
                  </div>
                  <div>
                    <h3 className="text-[12px] font-bold uppercase tracking-widest text-foreground mb-1">
                      {title}
                    </h3>
                    <p className="text-[13px] text-secondary leading-[1.8]">
                      {body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="text-center mb-10">
              <h2 className="text-xl font-bold text-foreground uppercase tracking-widest mb-3">
                <span className="text-secondary mr-1.5">/</span>
                {whyChoose.heading}
                <span className="text-accent">.</span>
              </h2>
              <p className="text-[13px] text-secondary leading-relaxed max-w-md mx-auto">
                {whyChoose.body}
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── CTA strip ── */}
      <FadeIn>
        <section className="bg-surface border border-line px-8 py-12 text-center">
          <h2 className="text-xl font-bold text-foreground uppercase tracking-widest mb-3">
            {cta.heading}
            <span className="text-accent">.</span>
          </h2>
          <p className="text-[13px] text-secondary mb-7 max-w-md mx-auto leading-relaxed">
            {cta.body}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/shop"
              className="inline-flex items-center h-11 px-8 bg-foreground text-white text-xs font-bold tracking-[2px] uppercase no-underline hover:bg-accent transition-colors"
            >
              {cta.primaryCta}
            </Link>
            <Link
              href="/contact-us"
              className="inline-flex items-center h-11 px-8 border border-line text-foreground text-[11px] font-bold tracking-widest uppercase no-underline hover:border-accent hover:text-accent transition-colors"
            >
              {cta.secondaryCta}
            </Link>
          </div>
        </section>
      </FadeIn>
    </div>
  );
}
