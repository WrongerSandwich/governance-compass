"use client";

import { useState, useRef, useEffect } from "react";
import type { GlossaryEntry } from "@/data/glossary";

interface GlossaryTermProps {
  entry: GlossaryEntry;
  children: React.ReactNode;
}

export function GlossaryTerm({ entry, children }: GlossaryTermProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <span ref={ref} className="relative inline">
      <button
        type="button"
        onClick={() => {
          setOpen((prev) => !prev);
          sessionStorage.setItem("glossary-hint-seen", "1");
        }}
        className="font-medium cursor-help"
        style={{
          color: "inherit",
          textDecoration: "underline",
          textDecorationStyle: "dotted",
          textDecorationColor: "#C4A84A",
          textUnderlineOffset: "2px",
        }}
        aria-expanded={open}
        aria-label={`Definition of ${entry.term}`}
      >
        {children}
      </button>
      {open && (
        <span
          className="absolute z-50 left-1/2 -translate-x-1/2 mt-1 w-[280px] rounded-[8px] border border-border-secondary p-3 shadow-sm text-left"
          style={{ backgroundColor: "#FFFEF8", top: "100%" }}
          role="tooltip"
        >
          <span className="block text-xs font-medium text-text-primary mb-1">
            {entry.term}
          </span>
          <span className="block text-xs text-text-secondary leading-relaxed mb-2">
            {entry.definition}
          </span>
          <a
            href={entry.wikipedia}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-stone-600 hover:text-stone-800 transition-colors duration-150"
          >
            Learn more on Wikipedia &rarr;
          </a>
        </span>
      )}
    </span>
  );
}
