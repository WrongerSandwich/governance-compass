import type { ReactNode } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import {
  archetypes,
  EMERGENCE_LABELS,
  EMERGENCE_TOOLTIPS,
  type ArchetypeEmergence,
} from "@/data/archetypes";
import { axes } from "@/data/axes";
import { ExternalLink, isExternalHref } from "@/components/ExternalLink";
import { ReturningUserLink } from "@/components/ReturningUserLink";
import { PageHeader, SpoilerNote } from "@/components/PageHeader";

const EMERGENCE_GLYPH: Record<ArchetypeEmergence, string> = {
  empirical: "●",
  refined: "◐",
  theoretical: "○",
};

function EmergenceGlyph({ emergence }: { emergence: ArchetypeEmergence }) {
  const fullLabel = `${EMERGENCE_LABELS[emergence]}. ${EMERGENCE_TOOLTIPS[emergence]}`;
  return (
    <span
      role="img"
      title={fullLabel}
      aria-label={fullLabel}
      className="text-[14px] leading-none cursor-help"
      style={{ color: "var(--stone-600)" }}
    >
      {EMERGENCE_GLYPH[emergence]}
    </span>
  );
}

const RADAR_SIZE = 72;
const RADAR_CX = RADAR_SIZE / 2;
const RADAR_CY = RADAR_SIZE / 2;
const RADAR_R = 30;
const AXIS_COUNT = 12;

function radarPoints(prototype: number[]): string {
  return prototype
    .map((score, i) => {
      const angle = (i / AXIS_COUNT) * 2 * Math.PI - Math.PI / 2;
      const r = ((score + 1) / 2) * RADAR_R;
      return `${RADAR_CX + r * Math.cos(angle)},${RADAR_CY + r * Math.sin(angle)}`;
    })
    .join(" ");
}

function MiniRadar({ prototype }: { prototype: number[] }) {
  const ringPoints = Array.from({ length: AXIS_COUNT }, (_, i) => {
    const angle = (i / AXIS_COUNT) * 2 * Math.PI - Math.PI / 2;
    return `${RADAR_CX + RADAR_R * Math.cos(angle)},${RADAR_CY + RADAR_R * Math.sin(angle)}`;
  }).join(" ");

  const midRingPoints = Array.from({ length: AXIS_COUNT }, (_, i) => {
    const angle = (i / AXIS_COUNT) * 2 * Math.PI - Math.PI / 2;
    const r = RADAR_R * 0.5;
    return `${RADAR_CX + r * Math.cos(angle)},${RADAR_CY + r * Math.sin(angle)}`;
  }).join(" ");

  return (
    <svg
      viewBox={`0 0 ${RADAR_SIZE} ${RADAR_SIZE}`}
      className="w-[72px] h-[72px] shrink-0"
      aria-hidden="true"
    >
      <polygon
        points={ringPoints}
        fill="none"
        style={{ stroke: "var(--border-secondary)" }}
        strokeWidth={0.5}
        opacity={0.6}
      />
      <polygon
        points={midRingPoints}
        fill="none"
        style={{ stroke: "var(--border-secondary)" }}
        strokeWidth={0.4}
        strokeDasharray="1.5 1.5"
        opacity={0.35}
      />
      <polygon
        points={radarPoints(prototype)}
        style={{ fill: "var(--stone-600)", stroke: "var(--stone-600)" }}
        fillOpacity={0.14}
        strokeOpacity={0.6}
        strokeWidth={1}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TraditionsProse({
  traditions,
  leadIn,
}: {
  traditions: string;
  leadIn?: ReactNode;
}) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => (
          <p className="text-[13px] text-text-secondary leading-relaxed mb-3">
            {leadIn}
            {children}
          </p>
        ),
        a: ({ href, children, ...rest }) => {
          if (href && isExternalHref(href)) {
            return (
              <ExternalLink href={href} {...rest}>
                {children}
              </ExternalLink>
            );
          }
          return (
            <a href={href} {...rest}>
              {children}
            </a>
          );
        },
        em: ({ children }) => <em className="italic">{children}</em>,
      }}
    >
      {traditions}
    </ReactMarkdown>
  );
}

const EMERGENCE_ORDER: ArchetypeEmergence[] = ["empirical", "refined", "theoretical"];

export default function ArchetypesPage() {
  const sortedArchetypes = [...archetypes].sort(
    (a, b) => a.displayOrder - b.displayOrder
  );

  // Map each archetype to its 1-based position (01..12) in displayOrder so the
  // number stays stable across grouped / flat presentations.
  const numberFor = new Map<string, number>(
    sortedArchetypes.map((a, i) => [a.id, i + 1])
  );

  const navGroups = EMERGENCE_ORDER.map((tier) => ({
    tier,
    items: sortedArchetypes.filter((a) => a.emergence === tier),
  })).filter((g) => g.items.length > 0);

  return (
    <main id="top" className="min-h-screen pt-11 pb-10">
      <div data-archetypes-header className="mx-auto max-w-reference px-6">
        <PageHeader
          kicker="← Reference"
          kickerHref="/references"
          title="Governance archetypes"
          lead={[
            `After scoring, your twelve-axis profile is compared against ${archetypes.length} archetype prototypes — idealized profiles representing coherent governance philosophies. You are assigned to the nearest, and shown your degree of match, your second-nearest, and a description of each archetype's internal logic.`,
            "Each entry lists the traditions and movements that have historically expressed that orientation. Most prototypes are derived from comparative political philosophy; a subset have been refined toward — or in one case identified directly from — empirical clusters in an April 2026 synthetic population study.",
          ]}
        />

        <div className="mt-[26px] mb-[30px]">
          <SpoilerNote leadIn="A note before reading —">
            archetype descriptions may influence how you answer. If you
            haven&apos;t taken the assessment yet, we recommend{" "}
            <Link
              href="/quiz"
              className="text-text-primary font-medium underline decoration-border-primary underline-offset-2 hover:decoration-text-secondary transition-colors duration-150 focus-ring"
            >
              completing it first
            </Link>
            .
          </SpoilerNote>
        </div>
      </div>

      <div data-archetypes-band className="border-t border-border-secondary">
        {/* Provenance legend, index and entries land here in Task 4. */}
      </div>

      {/* Footer — ghost CTA above a single inline row of tertiary nav links */}
      <div className="border-t border-border-secondary mt-12 pt-6 text-center">
        <Link
          href="/quiz"
          className="inline-block border border-border-primary text-text-primary py-2.5 px-7 rounded-sharp text-sm font-medium hover:border-text-secondary hover:text-text-primary transition-colors duration-150"
        >
          Begin assessment
        </Link>
        <nav
          aria-label="Page navigation"
          className="mt-4 flex flex-wrap justify-center items-baseline gap-x-2 text-xs text-text-tertiary"
        >
          <Link
            href="/references"
            className="hover:text-text-secondary transition-colors duration-150"
          >
            back to references
          </Link>
          <span aria-hidden="true" className="text-text-tertiary/60">·</span>
          <a
            href="#top"
            className="hover:text-text-secondary transition-colors duration-150"
          >
            ↑ back to top
          </a>
          <ReturningUserLink
            as="span"
            wrapperClassName="inline-flex items-baseline gap-x-2"
            className="hover:text-text-secondary transition-colors duration-150"
            label="← back to your results"
            prefix={
              <span aria-hidden="true" className="text-text-tertiary/60">·</span>
            }
          />
        </nav>
      </div>
    </main>
  );
}
