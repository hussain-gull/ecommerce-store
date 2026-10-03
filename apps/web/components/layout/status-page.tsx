import type { ComponentProps } from "react";
import { TopBar } from "@/components/layout/top-bar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { StatusPanel } from "@/components/layout/status-panel";

// Full-page shell (header + footer) around a StatusPanel — for not-found and
// error boundaries, which replace the whole page including its own header.
export function StatusPage(props: ComponentProps<typeof StatusPanel>) {
  return (
    <div className="font-sans bg-white text-secondary">
      <TopBar />
      <Header />
      <main>
        <StatusPanel {...props} />
      </main>
      <Footer />
    </div>
  );
}
