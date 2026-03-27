import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/SessionProvider";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PoliticalPlatform",
  description: "Discover the nuances of your political views",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <nav className="bg-white border-b border-gray-200 px-4 py-3">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <Link
                href="/"
                className="text-lg font-bold text-gray-900 hover:text-indigo-600 transition-colors"
              >
                PoliticalPlatform
              </Link>
              <div className="flex items-center gap-4 text-sm">
                <Link
                  href="/quiz"
                  className="text-gray-600 hover:text-gray-900"
                >
                  Quiz
                </Link>
                <Link
                  href="/account"
                  className="text-gray-600 hover:text-gray-900"
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
