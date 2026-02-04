import type { ReactNode } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh">
      <Header />
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        {children}
      </main>
      <Footer />
    </div>
  );
}

