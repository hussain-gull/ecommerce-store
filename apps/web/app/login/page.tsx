import type { Metadata } from "next";
import Link from "next/link";
import { TopBar } from "@/components/layout/top-bar";
import { Header } from "@/components/layout/header";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { Footer } from "@/components/layout/footer";
import { safeNext } from "@/lib/utils/safe-next";
import { LoginForm } from "@/components/auth/login-form";
import { branding } from "@ecommerce/contracts";

export const metadata: Metadata = {
  title: `Sign In — ${branding.storeName}`,
  description: `Sign in to your ${branding.storeName} account to access orders, wishlist, and more.`,
  robots: { index: false, follow: true },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const redirectTo = safeNext(next);
  return (
    <div className="font-sans bg-white text-secondary">
      <TopBar />
      <Header />
      <Breadcrumb
        crumbs={[{ label: "Home", href: "/" }, { label: "Sign In" }]}
      />

      <div className="max-w-300 mx-auto px-4 py-14">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-xl font-bold text-foreground uppercase tracking-widest mb-2">
              <span className="text-secondary mr-1.5">/</span>Sign In
              <span className="text-accent">.</span>
            </h1>
            <p className="text-[13px] text-secondary">
              Welcome back. Please sign in to continue.
            </p>
          </div>

          <div className="bg-surface border border-line p-8">
            <LoginForm redirectTo={redirectTo} />
            <p className="text-center text-[13px] text-secondary mt-6">
              Don&apos;t have an account?{" "}
              <Link
                href={
                  redirectTo === "/account"
                    ? "/signup"
                    : `/signup?next=${encodeURIComponent(redirectTo)}`
                }
                className="text-accent font-semibold no-underline hover:text-accent-dark transition-colors"
              >
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
