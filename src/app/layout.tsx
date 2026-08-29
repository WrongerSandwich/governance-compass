import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SessionProvider } from "@/components/SessionProvider";
import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { DevRandomResults } from "@/components/DevRandomResults";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

// Self-hosted from src/app/fonts/ rather than next/font/google so the build
// never reaches the network. Latin subset only, variable across the 400-500
// range the design system uses.
const sourceSerif = localFont({
  src: [
    {
      path: "./fonts/SourceSerif4-latin-variable.woff2",
      weight: "400 500",
      style: "normal",
    },
    {
      path: "./fonts/SourceSerif4-latin-variable-italic.woff2",
      weight: "400 500",
      style: "italic",
    },
  ],
  display: "swap",
  variable: "--font-source-serif",
});

export const metadata: Metadata = {
  title: "The Governance Compass",
  description: "Discover the nuances of your political views",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={sourceSerif.variable}>
      <body>
        <SessionProvider>
          <NavBar />
          {children}
          <Footer />
          <DevRandomResults />
          <Analytics />
          <SpeedInsights />
        </SessionProvider>
      </body>
    </html>
  );
}
