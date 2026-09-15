import type { ReactNode } from "react";
import { ButtonLink } from "@/components/Button";

interface ReferenceCtaProps {
  /** Button copy. Mock 7c's archetype page says "Begin the assessment". */
  label?: string;
  /** The line under the button — usually one link. Pass null for none. */
  secondary: ReactNode;
  /**
   * Renders the secondary line as `<nav aria-label={secondaryLabel}>` instead
   * of `<p>`. Only worth it where the line is genuinely a set of destinations:
   * /archetypes carries three and replaced a hand-rolled
   * `<nav aria-label="Page navigation">`, so omitting the landmark there took
   * one away from anybody navigating by landmark. The single-link consumers
   * pass nothing — a landmark around one link is noise.
   */
  secondaryLabel?: string;
}

/**
 * The closing call four reference pages repeat.
 *
 * `primary`, not `secondary`, and that is a rule rather than a preference:
 * CLAUDE.md reserves the filled button for "beginning or resuming the
 * assessment", which is exactly what every one of these four buttons does.
 * The markup it replaces was a hand-rolled Stone-600 fill over hard-coded
 * white ink — duplicated verbatim at all four sites, including the half of it
 * that does not invert. (Naming those two classes in prose rather than as
 * literals keeps the phase 5 ramp guard a plain text scan, with no
 * comment-stripping step of its own to go wrong.)
 */
export function ReferenceCta({
  label = "Begin the assessment",
  secondary,
  secondaryLabel,
}: ReferenceCtaProps) {
  const SecondaryTag = secondaryLabel ? "nav" : "p";
  return (
    <div className="border-t border-border-secondary mt-12 pt-8 text-center">
      <p data-reference-cta>
        <ButtonLink href="/quiz" variant="primary">
          {label}
        </ButtonLink>
      </p>
      {secondary && (
        <SecondaryTag
          data-reference-secondary
          aria-label={secondaryLabel}
          className="mt-4 mono-meta text-text-label"
        >
          {secondary}
        </SecondaryTag>
      )}
    </div>
  );
}
