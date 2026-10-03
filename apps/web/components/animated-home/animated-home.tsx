"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { motion, useInView } from "framer-motion";
import { ArrowRight, ShoppingBag, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { HomeContent, Product } from "@ecommerce/contracts";
import Image from "next/image";

gsap.registerPlugin(SplitText);

// ─── Shared utilities ────────────────────────────────────────────────────────

function FadeIn({
  children,
  delay = 0,
  y = 28,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Hero ────────────────────────────────────────────────────────────────────

function HeroSection({
  home,
  products,
}: {
  home: HomeContent;
  products: Product[];
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const h1Ref = useRef<HTMLHeadingElement>(null);
  const imageWrapRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const heroImg = home.hero.imageUrl ?? products[0]?.img;

  useEffect(() => {
    if (!sectionRef.current || !h1Ref.current) return;

    let ctx: ReturnType<typeof gsap.context> | undefined;
    let split: InstanceType<typeof SplitText> | undefined;

    // Defer past React Strict Mode's synchronous cleanup/re-invoke cycle.
    // rAF fires on the next paint frame — by that point Strict Mode's
    // simulated unmount has already run and cancelled the first rAF id.
    const rafId = requestAnimationFrame(() => {
      if (!h1Ref.current || !sectionRef.current) return;

      split = new SplitText(h1Ref.current, {
        type: "chars,words",
        charsClass: "hero-char",
        wordsClass: "hero-word",
      });

      // Colour the last word (PITCH.) in accent
      const lastWord = split.words[split.words.length - 1] as
        HTMLElement | undefined;
      if (lastWord) lastWord.style.color = "var(--color-accent)";

      ctx = gsap.context(() => {
        const tl = gsap.timeline();

        tl.from(".hero-eyebrow", {
          opacity: 0,
          y: 18,
          duration: 0.5,
          ease: "power3.out",
        })
          .from(
            split!.chars,
            {
              opacity: 0,
              y: 80,
              duration: 0.5,
              stagger: 0.022,
              ease: "power4.out",
            },
            "-=0.2",
          )
          .from(
            ".hero-body",
            {
              opacity: 0,
              y: 22,
              duration: 0.5,
              ease: "power2.out",
            },
            "-=0.5",
          )
          .from(
            imageWrapRef.current,
            {
              opacity: 0,
              y: 60,
              scale: 0.82,
              duration: 0.9,
              ease: "power3.out",
            },
            0.3,
          )
          .to(
            imgRef.current,
            {
              y: -14,
              duration: 2.4,
              ease: "sine.inOut",
              yoyo: true,
              repeat: -1,
            },
            ">",
          );
      }, sectionRef);
    });

    return () => {
      cancelAnimationFrame(rafId);
      ctx?.revert();
      split?.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen bg-hero flex items-center overflow-hidden"
    >
      {/* Ambient glows */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-1/3 left-[15%] w-[500px] h-[500px] rounded-full bg-accent/[0.08] blur-[140px]" />
        <div className="absolute bottom-1/4 right-[20%] w-80 h-80 rounded-full bg-accent/[0.05] blur-[100px]" />
      </div>

      <div className="max-w-300 mx-auto px-4 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-28">
        {/* ── Left ── */}
        <div>
          <p className="hero-eyebrow text-[10px] font-black tracking-[5px] uppercase text-accent mb-7">
            {home.hero.eyebrow}
          </p>

          {/* SplitText target — GSAP wraps each char in its own span */}
          <h1
            ref={h1Ref}
            className="text-[clamp(3.5rem,9vw,6.5rem)] font-black text-white uppercase leading-[0.95] tracking-tight mb-8"
          >
            {home.hero.heading}
          </h1>

          <div className="hero-body">
            <p className="text-[14px] text-white/55 leading-[1.85] max-w-[420px] mb-9">
              {home.hero.body}
            </p>

            <div className="flex items-center gap-5 mb-12">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2.5 h-12 px-8 bg-accent text-white text-[11px] font-black tracking-[2px] uppercase hover:bg-accent-dark transition-colors"
              >
                <ShoppingBag size={14} strokeWidth={2.5} />
                {home.hero.primaryCta}
              </Link>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 text-[11px] font-black tracking-[2px] uppercase text-white/60 hover:text-accent transition-colors"
              >
                {home.hero.secondaryCta} <ArrowRight size={13} />
              </Link>
            </div>

            <div className="flex items-center gap-8 pt-8 border-t border-white/10">
              {home.hero.stats.map(({ value, label }) => (
                <div key={label}>
                  <p className="text-2xl font-black text-white leading-none mb-1">
                    {value}
                  </p>
                  <p className="text-[10px] tracking-[3px] uppercase text-white/35">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right — featured boot ── */}
        <div
          ref={imageWrapRef}
          className="relative flex items-center justify-center"
        >
          {/* Glow orb */}
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            aria-hidden
          >
            <div className="w-72 h-72 rounded-full bg-accent/25 blur-[70px]" />
          </div>

          <div className="relative z-10 w-full max-w-120 aspect-square">
            {heroImg && (
              <Image
                ref={imgRef}
                src={heroImg}
                alt="Featured football boot"
                fill
                className="object-contain drop-shadow-2xl"
              />
            )}
          </div>

          <div className="absolute top-6 right-6 bg-accent text-white px-4 py-2 text-[9px] font-black tracking-[4px] uppercase">
            {home.hero.badge}
          </div>
        </div>
      </div>

      {/* fade into ticker */}
      <div
        className="absolute bottom-0 inset-x-0 h-20 bg-linear-to-t from-black/30 to-transparent pointer-events-none"
        aria-hidden
      />
    </section>
  );
}

// ─── Ticker ──────────────────────────────────────────────────────────────────

function TickerStrip({ home }: { home: HomeContent }) {
  return (
    <div className="bg-accent overflow-hidden py-4 select-none">
      <style>{`@keyframes js-ticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>
      <div
        style={{
          animation: "js-ticker 30s linear infinite",
          display: "flex",
          width: "max-content",
        }}
      >
        {[0, 1].map((i) => (
          <span
            key={i}
            className="text-white text-[10px] font-black tracking-[5px] uppercase whitespace-nowrap"
          >
            {home.ticker}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Category cards ──────────────────────────────────────────────────────────

function CategorySection({
  home,
  products,
}: {
  home: HomeContent;
  products: Product[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const CATEGORIES = home.categorySection.categories.map((cat, i) => ({
    ...cat,
    img: cat.imageUrl ?? products[i + 1]?.img,
  }));

  return (
    <section className="bg-foreground py-20">
      <div className="max-w-300 mx-auto px-4">
        <FadeIn className="mb-12">
          <p className="text-[10px] font-black tracking-[5px] uppercase text-accent mb-3">
            {home.categorySection.eyebrow}
          </p>
          <h2 className="text-[clamp(1.75rem,3vw,2.5rem)] font-black text-white uppercase tracking-tight">
            {home.categorySection.heading}
            <span className="text-accent">.</span>
          </h2>
        </FadeIn>

        <div ref={ref} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {CATEGORIES.map((cat, i) => (
            <motion.div
              key={cat.code}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.6,
                delay: i * 0.12,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
            >
              <Link
                href="/shop"
                className="group block relative overflow-hidden aspect-[3/4]"
              >
                {cat.img && (
                  <Image
                    src={cat.img}
                    alt={cat.label}
                    fill
                    className="object-cover opacity-25 group-hover:opacity-45 group-hover:scale-105 transition-all duration-500"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-900/80 to-neutral-800/40" />

                <div className="relative h-full p-8 flex flex-col justify-between">
                  <div>
                    <span className="inline-block text-[9px] font-black tracking-[5px] uppercase text-accent border border-accent/30 px-3 py-1.5 mb-5">
                      {cat.code}
                    </span>
                    <h3 className="text-2xl font-black text-white uppercase leading-tight mb-2">
                      {cat.label}
                    </h3>
                    <p className="text-[11px] font-bold text-accent/75 tracking-widest uppercase mb-4">
                      {cat.tagline}
                    </p>
                    <p className="text-[13px] text-white/45 leading-relaxed">
                      {cat.desc}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] font-black tracking-[2px] uppercase text-white/50 group-hover:text-accent transition-colors duration-300">
                    Shop {cat.label} <ChevronRight size={13} />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Bestsellers ─────────────────────────────────────────────────────────────

function ProductGrid({
  home,
  products,
}: {
  home: HomeContent;
  products: Product[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const FEATURED = products.slice(0, 4);

  return (
    <section className="bg-white py-20">
      <div className="max-w-300 mx-auto px-4">
        <FadeIn className="mb-12">
          <p className="text-[10px] font-black tracking-[5px] uppercase text-accent mb-3">
            {home.bestsellers.eyebrow}
          </p>
          <h2 className="text-[clamp(1.75rem,3vw,2.5rem)] font-black text-foreground uppercase tracking-tight">
            {home.bestsellers.heading}
            <span className="text-accent">.</span>
          </h2>
        </FadeIn>

        <div ref={ref} className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {FEATURED.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.5,
                delay: i * 0.1,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
            >
              <Link href={`/products/${product.slug}`} className="group block">
                <div className="relative bg-surface overflow-hidden mb-3 aspect-square">
                  {product.img && (
                    <Image
                      src={product.img}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  )}
                  {product.sale && (
                    <span className="absolute top-3 left-3 bg-accent text-white text-[9px] font-black tracking-widest uppercase px-2 py-1">
                      Sale
                    </span>
                  )}
                  <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-foreground">
                    <span className="flex items-center justify-center h-10 text-white text-[10px] font-black tracking-[2px] uppercase">
                      Quick Add
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-muted mb-0.5">
                  {product.category}
                </p>
                <p className="text-[13px] font-bold text-foreground leading-snug mb-1">
                  {product.name}
                </p>
                <p className="text-[13px] font-black text-accent">
                  {product.price}
                </p>
              </Link>
            </motion.div>
          ))}
        </div>

        <FadeIn delay={0.3} className="mt-10 text-center">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 h-11 px-8 border border-foreground text-foreground text-[11px] font-black tracking-[2px] uppercase hover:bg-foreground hover:text-white transition-colors"
          >
            {home.bestsellers.viewAllCta} <ArrowRight size={13} />
          </Link>
        </FadeIn>
      </div>
    </section>
  );
}

// ─── Stats ───────────────────────────────────────────────────────────────────

function StatsSection({ home }: { home: HomeContent }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section ref={ref} className="bg-wash py-20 border-y border-line">
      <div className="max-w-300 mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-10">
        {home.stats.map(({ value, label }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, scale: 0.75 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{
              duration: 0.5,
              delay: i * 0.1,
              ease: [0.34, 1.56, 0.64, 1],
            }}
            className="text-center"
          >
            <p className="text-[clamp(2.5rem,5vw,3.5rem)] font-black text-foreground leading-none mb-2">
              {value}
            </p>
            <p className="text-[10px] font-bold tracking-[3px] uppercase text-secondary">
              {label}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ─── CTA strip ───────────────────────────────────────────────────────────────

function CtaStrip({ home }: { home: HomeContent }) {
  return (
    <section className="bg-foreground py-24 text-center">
      <FadeIn>
        <p className="text-[10px] font-black tracking-[5px] uppercase text-accent mb-4">
          {home.cta.eyebrow}
        </p>
        <h2 className="text-[clamp(2rem,4vw,3rem)] font-black text-white uppercase tracking-tight mb-6">
          {home.cta.heading}
          <span className="text-accent">.</span>
        </h2>
        <p className="text-[14px] text-white/45 max-w-[400px] mx-auto mb-10 leading-[1.85]">
          {home.cta.body}
        </p>
        <Link
          href="/shop"
          className="inline-flex items-center gap-2.5 h-12 px-10 bg-accent text-white text-[11px] font-black tracking-[2px] uppercase hover:bg-accent-dark transition-colors"
        >
          {home.cta.ctaText} <ArrowRight size={13} />
        </Link>
      </FadeIn>
    </section>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function AnimatedHome({
  home,
  products,
}: {
  home: HomeContent;
  products: Product[];
}) {
  return (
    <div className="font-sans">
      <HeroSection home={home} products={products} />
      <TickerStrip home={home} />
      {home.categorySection.categories.length > 0 && (
        <CategorySection home={home} products={products} />
      )}
      {products.length > 0 && <ProductGrid home={home} products={products} />}
      <StatsSection home={home} />
      <CtaStrip home={home} />
    </div>
  );
}
