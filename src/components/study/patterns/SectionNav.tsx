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
    <nav
      aria-label="Sections on this page"
      className="patterns-section-nav mb-14 flex flex-wrap gap-x-6 gap-y-2 text-[11px] text-text-tertiary leading-relaxed"
    >
      {sections.map((item) => {
        const isActive = activeId === item.id;
        return (
          <a
            key={item.id}
            href={`#${item.id}`}
            aria-current={isActive ? "location" : undefined}
            className={`whitespace-nowrap transition-colors duration-150 ${
              isActive
                ? "text-text-primary font-medium"
                : "hover:text-text-secondary"
            }`}
          >
            <span className="tabular-nums mr-1.5">{item.num}</span>
            <span className="section-nav-full">{item.label}</span>
            <span className="section-nav-short">{item.short}</span>
          </a>
        );
      })}
    </nav>
  );
}
