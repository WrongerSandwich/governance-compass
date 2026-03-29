import type { Metadata } from "next";
import { Newsreader } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/SessionProvider";
import { NavBar } from "@/components/NavBar";
import { DevRandomResults } from "@/components/DevRandomResults";
import { Analytics } from "@vercel/analytics/next";

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-newsreader",
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
    <html lang="en" className={newsreader.variable}>
      <body>
        <SessionProvider>
          <NavBar />
          {children}
          <DevRandomResults />
          <Analytics />
        </SessionProvider>
      </body>
    </html>
  );
}
