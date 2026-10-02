import type { Metadata } from "next";
import Script from "next/script";
import { Inter, Newsreader } from "next/font/google";
import { APP_NAME } from "@/lib/config";
import { AnalyticsBeacon } from "@/components/AnalyticsBeacon";
import "./globals.css";

const sans = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const serif = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${APP_NAME} — Compose a page in conversation`,
  description:
    "Guided prompts on the left. A printed preview on the right. The first page is free; the files are delivered after a one-time payment.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${sans.variable} ${serif.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-paper text-ink">
        <Script id="pb-theme" strategy="beforeInteractive">
          {`(function(){try{var t=localStorage.getItem("pb-theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t);}catch(e){}})();`}
        </Script>
        {children}
        <AnalyticsBeacon />
      </body>
    </html>
  );
}
