import type { Metadata } from "next";
import Link from "next/link";
import { TopBar } from "@/components/layout/top-bar";
import { Header } from "@/components/layout/header";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { Footer } from "@/components/layout/footer";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { branding } from "@ecommerce/contracts";

export const metadata: Metadata = {
  title: `Forgot Password — ${branding.storeName}`,
  description: `Reset your ${branding.storeName} account password.`,
  robots: { index: false, follow: true },
};

export default function ForgotPasswordPage() {
  return (
    <div className="font-sans bg-white text-secondary">
      <TopBar />
      <Header />
      <Breadcrumb
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Sign In", href: "/login" },
          { label: "Forgot Password" },
        ]}
      />

      <div className="max-w-300 mx-auto px-4 py-14">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-xl font-bold text-foreground uppercase tracking-widest mb-2">
              <span className="text-secondary mr-1.5">/</span>Forgot Password
              <span className="text-accent">.</span>
            </h1>
            <p className="text-[13px] text-secondary">
              Enter your email address and we&rsquo;ll send you a secure reset
              link.
            </p>
          </div>

          <div className="bg-surface border border-line p-8">
            <ForgotPasswordForm />
            <p className="text-center text-[13px] text-secondary mt-6">
              Remember your password?{" "}
              <Link
                href="/login"
                className="text-accent font-semibold no-underline hover:text-accent-dark transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
