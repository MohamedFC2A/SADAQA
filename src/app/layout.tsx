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
  title: "MADDAD | منصة التبرعات وطلبات المساعدة",
  description: "MADDAD منصة عربية للتبرعات وطلبات المساعدة مع خصوصية وشفافية.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themeScript = `
  (function () {
    try {
      var stored = localStorage.getItem("theme");
      var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      var theme = stored || (prefersDark ? "dark" : "light");
      if (theme === "dark") document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
    } catch (e) {}
  })();
  `;

  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${cairo.variable} ${brand.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
