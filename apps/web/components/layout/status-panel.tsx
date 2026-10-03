import type { ReactNode } from "react";

type StatusPanelProps = {
  /** Big label, e.g. "404" or "Oops". */
  eyebrow: string;
  title: string;
  message: string;
  /** Buttons/links. */
  children?: ReactNode;
  /** Error digest — lets support match the user's report to server logs. */
  digest?: string;
};

// The one visual used for "not found", "content unavailable" and "something
// went wrong" so every failure state looks like part of the site.
export function StatusPanel({
  eyebrow,
  title,
  message,
  children,
  digest,
}: StatusPanelProps) {
  return (
    <div role="status" className="max-w-xl mx-auto px-4 py-20 text-center">
      <p className="text-[11px] font-bold uppercase tracking-[4px] text-accent mb-3">
        {eyebrow}
      </p>
      <h1 className="text-[clamp(22px,4vw,32px)] font-black text-foreground uppercase tracking-widest leading-tight mb-4">
        {title}
      </h1>
      <p className="text-[14px] text-secondary leading-[1.8] mb-8">{message}</p>
      {children && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {children}
        </div>
      )}
      {digest && (
        <p className="mt-8 text-[11px] text-subtle">Reference: {digest}</p>
      )}
    </div>
  );
}

export const primaryBtn =
  "inline-flex items-center h-11 px-8 bg-foreground text-white text-[11px] font-bold tracking-[2px] uppercase no-underline border-none cursor-pointer hover:bg-accent transition-colors";
export const secondaryBtn =
  "inline-flex items-center h-11 px-8 bg-transparent border border-line text-foreground text-[11px] font-bold tracking-[2px] uppercase no-underline cursor-pointer hover:border-accent hover:text-accent transition-colors";
