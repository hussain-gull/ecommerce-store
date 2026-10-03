import type { Metadata } from "next";
import { TopBar } from "@/components/layout/top-bar";
import { Header } from "@/components/layout/header";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { Footer } from "@/components/layout/footer";
import { AboutUsContent } from "@/components/about/about-us-content";
import { getAboutContentApi } from "@/lib/api/content.api";
import {
  ContentUnavailable,
  unavailableMetadata,
} from "@/components/layout/content-unavailable";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const content = await getAboutContentApi();
  return content ? content.meta : unavailableMetadata("About Us");
}

export default async function AboutUsPage() {
  const content = await getAboutContentApi();

  return (
    <div className="font-sans bg-white text-secondary">
      <TopBar />
      <Header />
      <Breadcrumb
        crumbs={[{ label: "Home", href: "/" }, { label: "About Us" }]}
      />

      <main>
        {content ? (
          <AboutUsContent content={content} />
        ) : (
          <ContentUnavailable />
        )}
      </main>

      <Footer />
    </div>
  );
}
