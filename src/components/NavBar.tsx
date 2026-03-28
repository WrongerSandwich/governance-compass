"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";

export function NavBar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [profileId, setProfileId] = useState<string | null>(null);

  // Re-check localStorage on every navigation (covers post-quiz redirect)
  useEffect(() => {
    setProfileId(localStorage.getItem("profileId"));
  }, [pathname]);

  function linkClasses(href: string): string {
    const isActive =
      pathname === href || (href !== "/" && pathname.startsWith(href));

    const base =
      "py-2 text-sm transition-colors duration-150";

    if (isActive) {
      return `${base} text-text-primary border-b-2 border-stone-600`;
    }
    return `${base} text-text-secondary hover:text-text-primary`;
  }

  return (
    <nav className="bg-surface-1 border-b border-border-secondary px-4">
      <div className="max-w-4xl mx-auto flex items-center justify-between h-11">
        <Link
          href="/"
          className="text-[17px] font-serif font-medium text-text-primary hover:text-stone-600 transition-colors duration-150"
          aria-current={pathname === "/" ? "page" : undefined}
        >
          Governance Compass
        </Link>
        <div className="flex items-center gap-5">
          <Link
            href="/quiz"
            className={linkClasses("/quiz")}
            aria-current={pathname.startsWith("/quiz") ? "page" : undefined}
          >
            Quiz
          </Link>
          {profileId && (
            <Link
              href={`/results/${profileId}`}
              className={linkClasses("/results")}
              aria-current={pathname.startsWith("/results") ? "page" : undefined}
            >
              Results
            </Link>
          )}
          {status === "authenticated" && session?.user ? (
            <>
              <Link
                href="/account"
                className={linkClasses("/account")}
                aria-current={pathname === "/account" ? "page" : undefined}
              >
                {session.user.name || session.user.email || "Account"}
              </Link>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="py-2 text-xs text-text-tertiary hover:text-text-secondary transition-colors duration-150"
              >
                Sign out
              </button>
            </>
          ) : status === "unauthenticated" ? (
            <Link
              href="/auth/signin"
              className={linkClasses("/auth/signin")}
              aria-current={pathname.startsWith("/auth") ? "page" : undefined}
            >
              Sign in
            </Link>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
