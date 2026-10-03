import type { Metadata } from "next";
import Link from "next/link";
import { TopBar } from "@/components/layout/top-bar";
import { Header } from "@/components/layout/header";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { Footer } from "@/components/layout/footer";
import { safeNext } from "@/lib/utils/safe-next";
import { SignupForm } from "@/components/auth/signup-form";
import { branding } from "@ecommerce/contracts";

export const metadata: Metadata = {
  title: `Create Account — ${branding.storeName}`,
  description: `Create a ${branding.storeName} account to track orders, save your wishlist, and check out faster.`,
  robots: { index: false, follow: true },
};

export default async function SignupPage({
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
        crumbs={[{ label: "Home", href: "/" }, { label: "Create Account" }]}
      />

      <div className="max-w-300 mx-auto px-4 py-14">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-xl font-bold text-foreground uppercase tracking-widest mb-2">
              <span className="text-secondary mr-1.5">/</span>Create Account
              <span className="text-accent">.</span>
            </h1>
            <p className="text-[13px] text-secondary">
              Join ${branding.storeName} and enjoy a personalised shopping
              experience.
            </p>
          </div>

          <div className="bg-surface border border-line p-8">
            <SignupForm redirectTo={redirectTo} />
            <p className="text-center text-[13px] text-secondary mt-6">
              Already have an account?{" "}
              <Link
                href={
                  redirectTo === "/account"
                    ? "/login"
                    : `/login?next=${encodeURIComponent(redirectTo)}`
                }
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
