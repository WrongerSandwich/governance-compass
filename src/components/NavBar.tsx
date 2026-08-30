"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { GovernanceCompassMark } from "./GovernanceCompassMark";
import { lastResultsHref, useLastResults } from "@/lib/last-results";

const RESEARCH_PATHS = [
  "/methodology",
  "/study",
  "/references",
  "/axes",
  "/questions",
  "/archetypes",
];

function matchesAny(pathname: string, paths: string[]): boolean {
  return paths.some((p) => pathname === p || pathname.startsWith(p));
}

export function NavBar() {
  const pathname = usePathname();
  // Subscribed rather than re-read per navigation: the post-quiz write goes
  // through `saveLastResults`, which notifies this reader directly.
  const resultsHref = lastResultsHref(useLastResults());

  function linkClasses(href: string, alsoActive?: string[]): string {
    const isActive =
      pathname === href ||
      (href !== "/" && pathname.startsWith(href)) ||
      (alsoActive?.some((p) => pathname === p || pathname.startsWith(p)) ?? false);

    const base = "py-2 text-sm transition-colors duration-150";

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
          {/* Keyed on the path so navigating remounts the menu closed —
              cheaper to reason about than an effect that closes it. */}
          <ResearchMenu key={pathname} pathname={pathname} />
          {/* Account UI hidden for v1 — re-enable when account features are ready */}
        </div>
      </div>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Research dropdown — groups Methodology, Synthetic Study, References
// ---------------------------------------------------------------------------

function ResearchMenu({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const isActive = matchesAny(pathname, RESEARCH_PATHS);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const base = "py-2 text-sm transition-colors duration-150 flex items-baseline gap-1";
  const activeClasses = isActive
    ? "text-text-primary border-b-2 border-stone-600"
    : "text-text-secondary hover:text-text-primary";

  const ITEMS = [
    { href: "/methodology", label: "Methodology" },
    { href: "/study", label: "Synthetic Study" },
    { href: "/references", label: "References" },
  ];

  return (
    <div ref={wrapRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        className={`${base} ${activeClasses}`}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((prev) => !prev)}
      >
        Research
        <span
          aria-hidden="true"
          className="text-[10px] leading-none"
          style={{
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 120ms ease",
            display: "inline-block",
          }}
        >
          ▾
        </span>
      </button>
      {open && (
        <div
          role="menu"
          aria-label="Research sections"
          className="absolute right-0 top-full mt-1 min-w-[180px] bg-surface-1 border border-border-secondary py-1"
        >
          {ITEMS.map((item) => {
            const itemActive =
              pathname === item.href ||
              pathname.startsWith(item.href + "/") ||
              (item.href === "/references" &&
                matchesAny(pathname, ["/axes", "/questions", "/archetypes"]));
            return (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                className="block px-4 py-2 text-sm transition-colors duration-150 text-text-secondary hover:text-text-primary hover:bg-surface-2"
                style={{
                  color: itemActive ? "var(--text-primary)" : undefined,
                  fontWeight: itemActive ? 500 : undefined,
                }}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
