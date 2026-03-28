import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "@/components/SessionProvider";
import Link from "next/link";

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
    <html lang="en">
      <body>
        <SessionProvider>
          <nav className="bg-surface-1 border-b border-border-secondary px-4 py-3">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <Link
                href="/"
                className="text-[17px] font-serif font-medium text-text-primary hover:text-stone-600 transition-colors duration-150"
              >
                Governance Compass
              </Link>
              <div className="flex items-center gap-4 text-sm">
                <Link
                  href="/quiz"
                  className="text-text-secondary hover:text-text-primary transition-colors duration-150"
                >
                  Quiz
                </Link>
                <Link
                  href="/account"
                  className="text-text-secondary hover:text-text-primary transition-colors duration-150"
                >
                  Account
                </Link>
              </div>
            </div>
          </nav>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
