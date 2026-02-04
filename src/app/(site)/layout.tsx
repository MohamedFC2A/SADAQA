import type { ReactNode } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-32 right-[-10%] h-80 w-80 rounded-full bg-pal-gold/20 blur-3xl dark:bg-pal-gold/10" />
        <div className="absolute -top-40 left-[-15%] h-96 w-96 rounded-full bg-pal-green/15 blur-3xl dark:bg-pal-green/10" />
        <div className="absolute bottom-[-20%] right-[-10%] h-[28rem] w-[28rem] rounded-full bg-pal-red/10 blur-3xl dark:bg-pal-red/10" />
      </div>
      <Header />
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        {children}
      </main>
      <Footer />
    </div>
  );
}
