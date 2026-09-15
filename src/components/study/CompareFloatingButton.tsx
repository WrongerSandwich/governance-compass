"use client";

import { Button } from "@/components/Button";

export interface CompareFloatingButtonProps {
  count: number; // number of pinned personas (must be ≥ 2 to render)
  onOpen: () => void;
  onClear: () => void;
}

/**
 * Fixed floating tray that appears when ≥2 personas are pinned.
 * "Compare (N)" opens the compare view; "×" clears all pins.
 * Both are separate focusable targets (no nesting).
 *
 * The tray was a 999px pill with `overflow: hidden` framing two borderless
 * children. Both had to go with the `Button` primitive: an outline is clipped
 * by an ancestor's overflow clip, so the variant's focus ring would have been
 * declared and never painted — the same defect class this task exists to fix —
 * and a rounded-sharp button inside a pill reads as two competing frames. The
 * separator rule went with them: `Button`'s own border now divides the two.
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
        gap: "4px",
        padding: "4px",
        borderRadius: "var(--radius)",
        backgroundColor: "var(--surface-1)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
      }}
    >
      {/* Compare button — the one page-level call in /study (D27), so it is
          the one control here routed through the `Button` primitive. No
          `className`: the variant owns padding, colour and display, and an
          appended class does not beat it. */}
      <Button
        variant="secondary"
        onClick={onOpen}
        aria-label={`Compare ${count} pinned personas`}
      >
        Compare ({count})
      </Button>

      {/* Clear button */}
      <button
        className="focus-ring text-text-label"
        onClick={onClear}
        aria-label="Clear all pinned personas"
        title="Clear all pins"
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
