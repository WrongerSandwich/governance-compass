"use client";

import { useEffect, useState } from "react";

interface SectionNavItem {
  num: string;
  label: string;
  short: string;
  id: string;
}

export interface SectionNavProps {
  sections: SectionNavItem[];
}

const THRESHOLD_PX = 120;

export function SectionNav({ sections }: SectionNavProps) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const update = () => {
      let current = "";
      for (const s of sections) {
        const el = document.getElementById(s.id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= THRESHOLD_PX && rect.bottom > THRESHOLD_PX) {
          current = s.id;
          break;
        }
      }
      setActiveId(current);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [sections]);

  return (
    <>
      <nav
        aria-label="Sections on this page"
        className="patterns-section-nav mb-14 flex flex-wrap gap-x-6 gap-y-2"
      >
        {sections.map((item) => {
          const isActive = activeId === item.id;
          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              aria-current={isActive ? "location" : undefined}
              className={`label-nav whitespace-nowrap transition-colors duration-150 focus-ring ${
                isActive
                  ? "text-text-primary font-medium"
                  : "text-text-label hover:text-text-primary"
              }`}
            >
              <span className="tabular-nums mr-1.5">{item.num}</span>
              <span className="section-nav-full">{item.label}</span>
              <span className="section-nav-short">{item.short}</span>
            </a>
          );
        })}
      </nav>

      {/* Full+short labels swap on width. Lives with the component rather
          than in a consumer page's <style> block, so every consumer gets it. */}
      <style>{`
        .section-nav-short { display: none; }
        @media (max-width: 767px) {
          .section-nav-full { display: none; }
          .section-nav-short { display: inline; }
        }
      `}</style>
    </>
  );
}
