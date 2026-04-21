"use client";

import { PersonaCard } from "@/components/study/PersonaCard";
import { useStudyFilters, DEFAULT_FILTERS } from "@/lib/study/filterState";
import type { PersonaSlim } from "@/lib/study/types";

export interface PersonaGridProps {
  personas: PersonaSlim[]; // full filtered list
  pinned: Set<string>;
  onTogglePin: (id: string) => void;
  pageSize?: number; // default 60
}

export function PersonaGrid({
  personas,
  pinned,
  onTogglePin,
  pageSize = 60,
}: PersonaGridProps) {
  const { filters, setFilter } = useStudyFilters();

  const rawPage = filters.page ?? DEFAULT_FILTERS.page;
  const totalPages = Math.max(1, Math.ceil(personas.length / pageSize));
  // Clamp to valid range without erroring
  const page = rawPage < 1 || rawPage > totalPages ? 1 : rawPage;

  const start = (page - 1) * pageSize;
  const end = Math.min(start + pageSize, personas.length);
  const pagePersonas = personas.slice(start, end);

  function goToPage(p: number) {
    setFilter("page", p);
  }

  return (
    <div>
      {/* Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(1, 1fr)",
          gap: "8px",
        }}
        className="persona-grid"
      >
        {pagePersonas.map((persona) => (
          <PersonaCard
            key={persona.id}
            persona={persona}
            isPinned={pinned.has(persona.id)}
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
            color: "var(--text-tertiary)",
            fontSize: "0.875rem",
          }}
        >
          No personas match the current filters.
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
            marginTop: "24px",
            fontSize: "0.875rem",
            color: "var(--text-secondary)",
          }}
        >
          <button
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
            style={{
              background: "none",
              border: "1px solid var(--border-primary)",
              borderRadius: "3px",
              padding: "4px 12px",
              cursor: page <= 1 ? "default" : "pointer",
              color: page <= 1 ? "var(--text-tertiary)" : "var(--text-primary)",
              fontSize: "0.875rem",
            }}
          >
            Previous
          </button>

          <span>
            Page {page} of {totalPages}
          </span>

          <button
            onClick={() => goToPage(page + 1)}
            disabled={page >= totalPages}
            style={{
              background: "none",
              border: "1px solid var(--border-primary)",
              borderRadius: "3px",
              padding: "4px 12px",
              cursor: page >= totalPages ? "default" : "pointer",
              color:
                page >= totalPages ? "var(--text-tertiary)" : "var(--text-primary)",
              fontSize: "0.875rem",
            }}
          >
            Next
          </button>
        </div>
      )}

      {/* Results count */}
      {personas.length > 0 && (
        <div
          style={{
            marginTop: "8px",
            textAlign: "center",
            fontSize: "0.75rem",
            color: "var(--text-tertiary)",
          }}
        >
          Showing {start + 1}–{end} of {personas.length} personas
        </div>
      )}

      <style>{`
        @media (min-width: 768px) {
          .persona-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (min-width: 1024px) {
          .persona-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}
