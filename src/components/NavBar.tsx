"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { GovernanceCompassMark } from "./GovernanceCompassMark";

export function NavBar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [resultsHref, setResultsHref] = useState<string | null>(null);

  // Re-check localStorage on every navigation (covers post-quiz redirect)
  useEffect(() => {
    const stored = localStorage.getItem("lastResults");
    if (!stored) {
      setResultsHref(null);
    } else if (stored.startsWith("id:")) {
      setResultsHref(`/results/${stored.slice(3)}`);
    } else {
      setResultsHref(`/results?r=${stored}`);
    }
  }, [pathname]);

  const REFERENCE_PATHS = ["/references", "/axes", "/questions", "/archetypes"];

  function linkClasses(href: string, alsoActive?: string[]): string {
    const isActive =
      pathname === href ||
      (href !== "/" && pathname.startsWith(href)) ||
      (alsoActive?.some((p) => pathname === p || pathname.startsWith(p)) ?? false);

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
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity duration-150"
          aria-current={pathname === "/" ? "page" : undefined}
        >
          <GovernanceCompassMark size={24} />
          <span className="hidden min-[480px]:inline text-[17px] font-serif font-medium text-text-primary">
            Governance Compass
          </span>
        </Link>
        <div className="flex items-center gap-4">
          {!resultsHref && (
            <Link
              href="/quiz"
              className={linkClasses("/quiz")}
              aria-current={pathname.startsWith("/quiz") ? "page" : undefined}
            >
              Quiz
            </Link>
          )}
          {resultsHref && (
            <Link
              href={resultsHref}
              className={linkClasses("/results")}
              aria-current={pathname.startsWith("/results") ? "page" : undefined}
            >
              Results
            </Link>
          )}
          <Link
            href="/methodology"
            className={linkClasses("/methodology")}
            aria-current={pathname === "/methodology" ? "page" : undefined}
          >
            Methodology
          </Link>
          <Link
            href="/study"
            className={linkClasses("/study")}
            aria-current={pathname.startsWith("/study") ? "page" : undefined}
          >
            Synthetic Study
          </Link>
          <Link
            href="/references"
            className={linkClasses("/references", REFERENCE_PATHS)}
            aria-current={pathname === "/references" || pathname === "/axes" || pathname === "/questions" || pathname === "/archetypes" ? "page" : undefined}
          >
            References
          </Link>
          {/* Account UI hidden for v1 — re-enable when account features are ready */}
        </div>
      </div>
    </nav>
  );
}
