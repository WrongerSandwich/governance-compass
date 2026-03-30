"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import type { GlossaryEntry } from "@/data/glossary";

interface GlossaryTermProps {
  entry: GlossaryEntry;
  children: React.ReactNode;
}

export function GlossaryTerm({ entry, children }: GlossaryTermProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  // Position the tooltip below the trigger
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPos({
      top: rect.bottom + window.scrollY + 4,
      left: rect.left + rect.width / 2 + window.scrollX,
    });
  }, []);

  useEffect(() => {
    if (open) updatePosition();
  }, [open, updatePosition]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        tooltipRef.current?.contains(e.target as Node)
      ) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <>
      <span ref={triggerRef} className="relative inline">
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            setOpen((prev) => !prev);
            sessionStorage.setItem("glossary-hint-seen", "1");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.stopPropagation();
              setOpen((prev) => !prev);
              sessionStorage.setItem("glossary-hint-seen", "1");
            }
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
        </span>
      </span>
      {open && typeof document !== "undefined" && createPortal(
        <div
          ref={tooltipRef}
          className="fixed z-[9999] max-w-[calc(100vw-2rem)] w-[280px] rounded-[8px] border border-border-secondary p-3 shadow-sm text-left bg-surface-1"
          style={{
            top: pos.top,
            left: pos.left,
            transform: "translateX(-50%)",
            position: "absolute",
          }}
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
            onClick={(e) => e.stopPropagation()}
          >
            Learn more on Wikipedia &rarr;
          </a>
        </div>,
        document.body
      )}
    </>
  );
}
