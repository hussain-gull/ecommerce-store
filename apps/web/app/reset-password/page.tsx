import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { Header } from "@/components/layout/header";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { Footer } from "@/components/layout/footer";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { branding } from "@ecommerce/contracts";

export const metadata: Metadata = {
  title: `Set New Password — ${branding.storeName}`,
  description: `Choose a new password for your ${branding.storeName} account.`,
  robots: { index: false, follow: true },
};

type Props = {
  searchParams: Promise<{ token?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token } = await searchParams;

  // Guard: if no token in URL, redirect to forgot-password so the user requests a fresh link.
  if (!token) {
    redirect("/forgot-password");
  }

  return (
    <div className="font-sans bg-white text-secondary">
      <TopBar />
      <Header />
      <Breadcrumb
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Sign In", href: "/login" },
          { label: "Set New Password" },
        ]}
      />

      <div className="max-w-300 mx-auto px-4 py-14">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-xl font-bold text-foreground uppercase tracking-widest mb-2">
              <span className="text-secondary mr-1.5">/</span>Set New Password
              <span className="text-accent">.</span>
            </h1>
            <p className="text-[13px] text-secondary">
              Choose a strong password for your account.
            </p>
          </div>

          <div className="bg-surface border border-line p-8">
            <ResetPasswordForm token={token} />
            <p className="text-center text-[13px] text-secondary mt-6">
              Link not working?{" "}
              <Link
                href="/forgot-password"
                className="text-accent font-semibold no-underline hover:text-accent-dark transition-colors"
              >
                Request a new one
              </Link>
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
