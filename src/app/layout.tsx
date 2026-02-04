import type { Metadata } from "next";
import { Cairo, Reem_Kufi_Fun } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-sans",
});

const brand = Reem_Kufi_Fun({
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  variable: "--font-brand",
});

export const metadata: Metadata = {
  title: "SADAQA | منصة التبرعات وطلبات المساعدة",
  description: "منصة عربية للتبرعات وطلبات المساعدة مع خصوصية وشفافية.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${cairo.variable} ${brand.variable}`}
    >
      <body className="min-h-dvh bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
