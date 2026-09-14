import type { ReactNode } from "react";
import { ButtonLink } from "@/components/Button";

interface ReferenceCtaProps {
  /** Button copy. Mock 7c's archetype page says "Begin the assessment". */
  label?: string;
  /** The line under the button — usually one link. Pass null for none. */
  secondary: ReactNode;
}

/**
 * The closing call four reference pages repeat.
 *
 * `primary`, not `secondary`, and that is a rule rather than a preference:
 * CLAUDE.md reserves the filled button for "beginning or resuming the
 * assessment", which is exactly what every one of these four buttons does.
 * The markup it replaces was a hand-rolled `bg-stone-600 text-white` fill —
 * duplicated verbatim at all four sites, including the half of it that does
 * not invert.
 */
export function ReferenceCta({ label = "Begin the assessment", secondary }: ReferenceCtaProps) {
  return (
    <div className="border-t border-border-secondary mt-12 pt-8 text-center">
      <p data-reference-cta>
        <ButtonLink href="/quiz" variant="primary">
          {label}
        </ButtonLink>
      </p>
      {secondary && (
        <p data-reference-secondary className="mt-4 mono-meta text-text-label">
          {secondary}
        </p>
      )}
    </div>
  );
}
