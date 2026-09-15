"use client";

export interface CompareFloatingButtonProps {
  count: number; // number of pinned personas (must be ≥ 2 to render)
  onOpen: () => void;
  onClear: () => void;
}

/**
 * Fixed floating pill that appears when ≥2 personas are pinned.
 * "Compare (N)" opens the compare view; "×" clears all pins.
 * Both are separate focusable targets (no nesting).
 */
export function CompareFloatingButton({
  count,
  onOpen,
  onClear,
}: CompareFloatingButtonProps) {
  if (count < 2) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 20,
        display: "flex",
        alignItems: "center",
        gap: "0",
        borderRadius: "999px",
        border: "1px solid var(--border-primary)",
        backgroundColor: "var(--surface-1)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
        overflow: "hidden",
      }}
    >
      {/* Compare button */}
      <button
        onClick={onOpen}
        aria-label={`Compare ${count} pinned personas`}
        className="control text-mark-primary"
        style={{
          minWidth: "44px",
          minHeight: "44px",
          padding: "0 16px",
          background: "none",
          border: "none",
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        Compare ({count})
      </button>

      {/* Separator */}
      <div
        aria-hidden="true"
        style={{
          width: "1px",
          height: "20px",
          backgroundColor: "var(--border-primary)",
          flexShrink: 0,
        }}
      />

      {/* Clear button */}
      <button
        onClick={onClear}
        aria-label="Clear all pinned personas"
        title="Clear all pins"
        className="text-text-label"
        style={{
          minWidth: "44px",
          minHeight: "44px",
          padding: "0 12px",
          background: "none",
          border: "none",
          cursor: "pointer",
          lineHeight: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "color 120ms ease",
        }}
      >
        ×
      </button>
    </div>
  );
}
