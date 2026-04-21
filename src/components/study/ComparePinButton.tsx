"use client";

import { Bookmark } from "lucide-react";

export interface ComparePinButtonProps {
  personaId: string;
  personaName: string;
  isPinned: boolean;
  canPin: boolean; // false when 4 already pinned and this is not one of them
  onToggle: (personaId: string) => void;
  className?: string;
}

export function ComparePinButton({
  personaId,
  personaName,
  isPinned,
  canPin,
  onToggle,
  className,
}: ComparePinButtonProps) {
  const isDisabled = !canPin && !isPinned;

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!isDisabled) {
      onToggle(personaId);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      aria-pressed={isPinned}
      aria-label={
        isPinned
          ? `Unpin ${personaName} from comparison`
          : `Pin ${personaName} for comparison`
      }
      title={
        isDisabled
          ? "Maximum 4 pinned"
          : isPinned
          ? "Unpin from comparison"
          : "Pin for comparison"
      }
      className={className}
      style={{
        background: "none",
        border: "none",
        cursor: isDisabled ? "not-allowed" : "pointer",
        color: isPinned ? "var(--stone-600)" : "var(--text-tertiary)",
        lineHeight: 1,
        borderRadius: "3px",
        transition: "color 120ms ease",
        opacity: isDisabled ? 0.4 : 1,
        padding: "4px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Bookmark
        size={14}
        fill={isPinned ? "currentColor" : "none"}
        strokeWidth={1.5}
      />
    </button>
  );
}
