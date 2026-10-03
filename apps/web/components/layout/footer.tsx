import Image from "next/image";
import Link from "next/link";
import { Phone, Smartphone, Mail, type LucideIcon } from "lucide-react";
import { branding as store } from "@ecommerce/contracts";
import branding from "@/content/branding.json";

const ICONS: Record<string, LucideIcon> = { Phone, Smartphone, Mail };

const serviceLinks = [
  "Shipping & Returns",
  "Secure Shopping",
  "International Shipping",
  "Affiliates",
  "Contact",
];
const infoLinks = [
  "Our Blog",
  "About Our Shop",
  "Secure Shopping",
  "Privacy Policy",
  "Delivery information",
];
const paymentBadges = ["VISA", "MC", "DISC", "AMEX", "PayPal"];

const contacts = branding.footer.contacts.map(({ icon, text }) => ({
  key: icon,
  Icon: ICONS[icon]!,
  text,
}));

export function Footer() {
  return (
    <footer className="bg-footer text-muted text-[13px]">
      <div className="max-w-300 mx-auto px-4 pt-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pb-12">
          <div>
            <Image
              src={store.logo}
              alt={store.storeName}
              width={150}
              height={60}
              className="mb-5 brightness-0 invert"
              style={{ height: 44, width: "auto" }}
            />
            {contacts.map(({ key, Icon, text }) => (
              <div key={key} className="flex items-center bg-wash/5 mb-0.5">
                <span className="inline-flex items-center justify-center w-10 h-10 bg-wash/8 shrink-0">
                  <Icon size={14} className="text-muted" />
                </span>
                <span className="px-4 py-2 text-[13px]">{text}</span>
              </div>
            ))}
          </div>

          <div>
            <h4 className="text-[13px] font-bold text-wash uppercase tracking-widest mb-5 pb-3 border-b border-wash/10">
              {branding.footer.social.heading}
            </h4>
            <p className="text-[13px] leading-relaxed">
              {branding.footer.social.body}
            </p>
          </div>

          <div>
            <h4 className="text-[13px] font-bold text-wash uppercase tracking-widest mb-5 pb-3 border-b border-wash/10">
              OUR SERVICES
            </h4>
            <ul className="list-none m-0 p-0">
              {serviceLinks.map((l) => (
                <li key={l}>
                  <Link
                    href="#"
                    className="flex items-center gap-2 py-1.5 border-b border-wash/5 text-muted hover:text-accent transition-colors no-underline"
                  >
                    <span className="text-[10px]">○</span>
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[13px] font-bold text-wash uppercase tracking-widest mb-5 pb-3 border-b border-wash/10">
              INFORMATION
            </h4>
            <ul className="list-none m-0 p-0">
              {infoLinks.map((l) => (
                <li key={l}>
                  <Link
                    href="#"
                    className="flex items-center gap-2 py-1.5 border-b border-wash/5 text-muted hover:text-accent transition-colors no-underline"
                  >
                    <span className="text-[10px]">○</span>
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-wash/8 py-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs m-0">
            COPYRIGHT © {branding.footer.copyright.year}{" "}
            <Link href="#" className="text-accent no-underline">
              {store.storeName}
            </Link>
            . ALL RIGHTS RESERVED.
          </p>
          <div className="flex gap-1.5">
            {paymentBadges.map((b) => (
              <span
                key={b}
                className="inline-flex items-center justify-center w-[46px] h-7 bg-wash/10 rounded-sm text-[9px] font-bold text-muted shadow-sm"
              >
                {b}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
