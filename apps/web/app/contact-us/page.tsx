import type { Metadata } from "next";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Info,
  type LucideIcon,
} from "lucide-react";
import { TopBar } from "@/components/layout/top-bar";
import { Header } from "@/components/layout/header";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { Footer } from "@/components/layout/footer";
import { ContactForm } from "@/components/contact/contact-form";
import { getContactContentApi } from "@/lib/api/content.api";
import {
  ContentUnavailable,
  unavailableMetadata,
} from "@/components/layout/content-unavailable";

const ICONS: Record<string, LucideIcon> = { MapPin, Phone, Mail, Clock };

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const contactUs = await getContactContentApi();
  return contactUs ? contactUs.meta : unavailableMetadata("Contact Us");
}

export default async function ContactUsPage() {
  const contactUs = await getContactContentApi();
  const crumbs = [{ label: "Home", href: "/" }, { label: "Contact Us" }];

  if (!contactUs) {
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

  // An unknown icon name (edited/legacy row) falls back to a generic icon.
  const INFO = contactUs.info.map(({ icon, label, lines }) => ({
    Icon: ICONS[icon] ?? Info,
    label,
    lines,
  }));

  return (
    <div className="font-sans bg-white text-secondary">
      <TopBar />
      <Header />
      <Breadcrumb crumbs={crumbs} />

      <main className="max-w-300 mx-auto px-4 py-10">
        <h1 className="text-xl font-bold text-foreground uppercase tracking-widest mb-10">
          <span className="text-secondary mr-1.5">/</span>
          {contactUs.heading}
          <span className="text-accent">.</span>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-10 items-start">
          {/* ── Left: contact info ── */}
          <aside>
            <div className="bg-surface border border-line p-7 mb-6">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-foreground mb-5 pb-3 border-b border-line">
                {contactUs.getInTouch.heading}
              </h2>
              <p className="text-[13px] text-secondary leading-[1.8] mb-0">
                {contactUs.getInTouch.body}
              </p>
            </div>

            <div className="space-y-0">
              {INFO.map(({ Icon, label, lines }, i) => (
                <div
                  key={label}
                  className={`flex items-start gap-4 p-5 bg-surface border-x border-b border-line ${i === 0 ? "border-t" : ""}`}
                >
                  <div className="w-10 h-10 bg-foreground flex items-center justify-center shrink-0">
                    <Icon size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-foreground mb-1">
                      {label}
                    </p>
                    {lines.map((line) => (
                      <p
                        key={line}
                        className="text-[13px] text-secondary leading-relaxed"
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* ── Right: form ── */}
          <section aria-labelledby="contact-form-heading">
            <div className="bg-surface border border-line p-7 mb-6">
              <h2
                id="contact-form-heading"
                className="text-[11px] font-bold uppercase tracking-widest text-foreground mb-5 pb-3 border-b border-line"
              >
                {contactUs.formHeading}
              </h2>
              <ContactForm />
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
