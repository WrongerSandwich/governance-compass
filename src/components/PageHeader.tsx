import type { ReactNode } from "react";
import Link from "next/link";

interface PageHeaderProps {
  /** The line above the title. Rendered as a link when `kickerHref` is set. */
  kicker: string;
  /** Makes the kicker a back-link. Omit for a plain eyebrow. */
  kickerHref?: string;
  title: string;
  /** Intro paragraphs, at mock 7c's 15px. Omit for a bare header. */
  lead?: string[];
}

/**
 * The opener five pages share: a mono kicker, a `display-page` title, and an
 * optional run of intro paragraphs.
 *
 * `kicker` + optional `kickerHref` rather than two props or a `ReactNode`,
 * because the eyebrow and the back-link are the same line typographically and
 * differ only in whether it is interactive. Handing callers a `ReactNode`
 * invites a third spelling, and a third spelling is how the pre-delta version
 * of this ended up with `tracking-[0.08em]` on four pages and the delta's
 * `0.14em` on none of them.
 */
export function PageHeader({ kicker, kickerHref, title, lead }: PageHeaderProps) {
  return (
    <>
      <p data-page-kicker className="label-eyebrow text-text-label mb-4">
        {kickerHref ? (
          <Link
            href={kickerHref}
            className="label-eyebrow no-underline hover:text-text-primary transition-colors duration-150 focus-ring"
          >
            {kicker}
          </Link>
        ) : (
          kicker
        )}
      </p>
      <h1 className="display-page text-text-primary mb-[18px]">{title}</h1>
      {lead?.map((paragraph, i) => (
        <p
          key={i}
          data-page-lead
          className="text-[15px] leading-[1.65] text-text-secondary mb-3.5 last:mb-0"
        >
          {paragraph}
        </p>
      ))}
    </>
  );
}

interface SpoilerNoteProps {
  /** Serif italic opener, in the warning ink. */
  leadIn?: string;
  children: ReactNode;
}

/**
 * The advisory stripe: 2px of `--warning` down the left, no fill.
 *
 * No background. `/questions` drew this same advisory over an
 * `rgba(181, 148, 46, 0.08)` wash keyed to a hex outside the palette, and the
 * wash is the part that cannot survive a dark ground — a fixed low-alpha warm
 * tint reads as a smear on Stone 900. Mock 7c draws the stripe alone, and the
 * stripe is the whole device. Spelling it `border-warning` rather than an
 * inline `borderLeftColor` keeps it inside the token namespace the guards
 * scan.
 */
export function SpoilerNote({ leadIn, children }: SpoilerNoteProps) {
  return (
    <div data-spoiler-note className="border-l-2 border-warning pl-4 py-1.5">
      <p className="text-sm leading-[1.65] text-text-secondary">
        {leadIn && (
          <>
            <em className="font-serif italic text-warning-text">{leadIn}</em>{" "}
          </>
        )}
        {children}
      </p>
    </div>
  );
}
