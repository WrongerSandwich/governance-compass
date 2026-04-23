"use client";

import { useEffect, useRef } from "react";
import { PersonaCard } from "@/components/study/PersonaCard";
import { useStudyFilters, DEFAULT_FILTERS } from "@/lib/study/filterState";
import type { PersonaSlim } from "@/lib/study/types";

export interface PersonaGridProps {
  personas: PersonaSlim[]; // full filtered list
  pinned: string[];
  onTogglePin: (id: string) => void;
  canPin: boolean;
  pageSize?: number; // default 60
}

export function PersonaGrid({
  personas,
  pinned,
  onTogglePin,
  canPin,
  pageSize = 60,
}: PersonaGridProps) {
  const { filters, setFilter, clearAll, activeCount } = useStudyFilters();

  const rawPage = filters.page ?? DEFAULT_FILTERS.page;
  const totalPages = Math.max(1, Math.ceil(personas.length / pageSize));
  const page = rawPage < 1 || rawPage > totalPages ? 1 : rawPage;

  const start = (page - 1) * pageSize;
  const end = Math.min(start + pageSize, personas.length);
  const pagePersonas = personas.slice(start, end);

  // Scroll the grid into view when the page changes, so clicking "Next →"
  // on mobile doesn't leave the user stranded below the new page.
  const rootRef = useRef<HTMLDivElement>(null);
  const prevPageRef = useRef(page);
  useEffect(() => {
    if (prevPageRef.current !== page && rootRef.current) {
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      rootRef.current.scrollIntoView({
        behavior: reduced ? "auto" : "smooth",
        block: "start",
      });
    }
    prevPageRef.current = page;
  }, [page]);

  function goToPage(p: number) {
    setFilter("page", p);
  }

  return (
    <div ref={rootRef} style={{ scrollMarginTop: "64px" }}>
      {/* Results count / status line */}
      {personas.length > 0 && (
        <p
          style={{
            fontSize: "12px",
            color: "var(--text-tertiary)",
            marginBottom: "8px",
            borderTop: "0.5px solid var(--border-secondary)",
            paddingTop: "6px",
          }}
        >
          {personas.length.toLocaleString()} personas · showing{" "}
          <span style={{ fontVariantNumeric: "tabular-nums" }}>
            {start + 1}–{end}
          </span>
        </p>
      )}

      {/* Gazetteer-style index */}
      <div
        className="persona-gazetteer"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(1, 1fr)",
          columnGap: "32px",
        }}
      >
        {pagePersonas.map((persona) => (
          <PersonaCard
            key={persona.id}
            persona={persona}
            isPinned={pinned.includes(persona.id)}
            canPin={canPin || pinned.includes(persona.id)}
            onTogglePin={onTogglePin}
          />
        ))}
      </div>

      {/* Empty state */}
      {personas.length === 0 && (
        <div
          style={{
            padding: "3rem 1rem",
            textAlign: "center",
            color: "var(--text-secondary)",
            fontSize: "14px",
            lineHeight: 1.6,
          }}
        >
          <p style={{ marginBottom: "10px" }}>
            No personas match the current filters.
          </p>
          {activeCount > 0 && (
            <button
              onClick={() => clearAll()}
              style={{
                background: "none",
                border: "none",
                color: "var(--stone-600)",
                fontSize: "13px",
                cursor: "pointer",
                textDecoration: "underline",
                textUnderlineOffset: "3px",
                textDecorationColor: "var(--border-secondary)",
              }}
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Text-only pagination */}
      {totalPages > 1 && (
        <nav
          aria-label="Pagination"
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "center",
            gap: "14px",
            marginTop: "28px",
            fontSize: "13px",
            color: "var(--text-tertiary)",
          }}
        >
          <button
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
            style={{
              background: "none",
              border: "none",
              cursor: page <= 1 ? "default" : "pointer",
              color:
                page <= 1 ? "var(--border-primary)" : "var(--text-secondary)",
              fontSize: "13px",
              padding: 0,
            }}
          >
            ← Previous
          </button>
          <span aria-hidden="true" style={{ opacity: 0.5 }}>
            ·
          </span>
          <span style={{ fontVariantNumeric: "tabular-nums" }}>
            Page {page} of {totalPages}
          </span>
          <span aria-hidden="true" style={{ opacity: 0.5 }}>
            ·
          </span>
          <button
            onClick={() => goToPage(page + 1)}
            disabled={page >= totalPages}
            style={{
              background: "none",
              border: "none",
              cursor: page >= totalPages ? "default" : "pointer",
              color:
                page >= totalPages
                  ? "var(--border-primary)"
                  : "var(--text-secondary)",
              fontSize: "13px",
              padding: 0,
            }}
          >
            Next →
          </button>
        </nav>
      )}

      <style>{`
        @media (min-width: 960px) {
          .persona-gazetteer {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (min-width: 1280px) {
          .persona-gazetteer {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
        /* Hover: subtle surface tint frames the whole row including the
           pin area. Transition matches site motion spec (120ms). */
        .persona-entry {
          transition: background-color 120ms ease;
        }
        .persona-entry:hover {
          background-color: var(--surface-2);
        }
        /* Pin button: hidden by default, revealed on row hover.
           Touch devices and already-pinned rows override to stay visible. */
        .persona-entry .persona-pin-slot {
          opacity: 0;
          transition: opacity 120ms ease;
        }
        .persona-entry:hover .persona-pin-slot,
        .persona-entry:focus-within .persona-pin-slot,
        .persona-entry .persona-pin-slot.is-pinned {
          opacity: 1;
        }
        /* Touch devices: no hover state exists, so pins stay visible but
           muted. Pinned rows promote to full opacity. */
        @media (hover: none) {
          .persona-entry .persona-pin-slot {
            opacity: 0.4;
          }
          .persona-entry .persona-pin-slot.is-pinned {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
