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

/** The legend's one-line gloss per tier.
 *
 *  Deliberately not `EMERGENCE_TOOLTIPS`, which is the long form the glyph's
 *  `title` carries — three of those in a row is a wall of prose where mock 7c
 *  draws three lines. Same facts, legend length. */
const PROVENANCE_BLURB: Record<ArchetypeEmergence, string> = {
  empirical: "identified from an empirical cluster in the April 2026 synthetic study",
  refined: "hand-crafted, then adjusted toward a matching empirical centroid",
  theoretical: "grounded in comparative political philosophy, no empirical match surfaced",
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

      <div className="mx-auto max-w-reference px-6">
        <p data-provenance-label className="label-eyebrow text-text-label mb-3">
          Provenance
        </p>
        <div className="flex flex-col gap-[7px] mb-[30px]">
          {EMERGENCE_ORDER.map((tier) => (
            <p
              key={tier}
              data-provenance-row
              className="text-[13px] leading-[1.6] text-text-secondary"
            >
              <span aria-hidden="true" className="text-mark-primary">
                {EMERGENCE_GLYPH[tier]}
              </span>{" "}
              <span data-provenance-tier className="label-nav font-medium text-text-primary">
                {EMERGENCE_LABELS[tier]}
              </span>
              {" — "}
              {PROVENANCE_BLURB[tier]}
            </p>
          ))}
        </div>

        <p className="label-eyebrow text-text-label mb-3">
          {sortedArchetypes.length === 12 ? "Twelve archetypes" : "The archetypes"}
        </p>
        <nav
          data-archetype-index
          className="grid grid-cols-2 gap-x-7 gap-y-1.5 mb-2"
          aria-label="Archetype list"
        >
          {sortedArchetypes.map((a) => (
            <a
              key={a.id}
              href={`#${a.id}`}
              className="flex items-baseline gap-2 text-[13px] text-text-secondary no-underline py-[3px] hover:text-text-primary transition-colors duration-150 focus-ring"
            >
              <span data-index-number className="font-mono text-[11px] text-text-label tabular-nums">
                {String(numberFor.get(a.id)).padStart(2, "0")}
              </span>
              <span>{a.name.replace(/^The\s+/, "")}</span>
              <EmergenceGlyph emergence={a.emergence} />
            </a>
          ))}
        </nav>
      </div>

      <div data-archetypes-band className="mt-7 border-t border-border-secondary">
        {sortedArchetypes.map((archetype, i) => (
          <section
            key={archetype.id}
            id={archetype.id}
            data-archetype-entry
            className={`border-b border-border-secondary scroll-mt-20 ${
              i % 2 === 1 ? "bg-surface-2" : ""
            }`}
          >
            <div data-entry-inner className="mx-auto max-w-reference px-6 pt-[30px] pb-8">
              <header className="flex gap-5 items-start mb-3.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2.5 flex-wrap">
                    <span className="font-mono text-xs text-text-label tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h2 className="display-entry text-text-primary">{archetype.name}</h2>
                    <EmergenceGlyph emergence={archetype.emergence} />
                  </div>
                  <p data-entry-tier className="label-nav text-text-label mt-1.5">
                    {EMERGENCE_LABELS[archetype.emergence]}
                  </p>
                </div>
                <MiniRadar prototype={archetype.prototype} />
              </header>

              <p className="text-[14.5px] leading-[1.65] text-text-secondary mb-3">
                {archetype.description}
              </p>

              <p className="body-s text-text-secondary mb-3">
                <em data-lead-in className="font-serif italic text-text-primary">Internal tension.</em>{" "}
                {archetype.characteristicTension}
              </p>

              <TraditionsProse
                traditions={archetype.traditions}
                leadIn={
                  <>
                    <em data-lead-in className="font-serif italic text-text-primary">Traditions.</em>{" "}
                  </>
                }
              />

              <details className="group mt-4">
                <summary className="list-none inline-flex items-center gap-1.5 label text-text-label font-medium cursor-pointer hover:text-text-secondary transition-colors duration-150 select-none focus-ring">
                  <span
                    aria-hidden="true"
                    className="inline-block text-[13px] leading-none transition-transform duration-150 group-open:rotate-90"
                  >
                    ▸
                  </span>
                  Axis positions
                </summary>
                <div className="mt-3 space-y-1">
                  {archetype.prototype.map((value, idx) => {
                    const axis = axes.find((a) => a.id === idx + 1)!;
                    return (
                      <div key={axis.id}>
                        <div className="flex items-baseline justify-between mb-0.5">
                          <span className="text-xs text-text-secondary">{axis.name}</span>
                          <span className="mono-meta text-text-label tabular-nums">
                            {value > 0 ? "+" : ""}
                            {value.toFixed(1)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="hidden min-[480px]:inline w-16 shrink-0 text-[11px] text-text-label text-right truncate">
                            {axis.poleALabel.split(" ")[0]}
                          </span>
                          <div
                            className="flex-1 h-[6px] rounded-[3px] relative overflow-hidden"
                            style={{ backgroundColor: "var(--border-secondary)" }}
                          >
                            {value !== 0 && (
                              <div
                                className="absolute top-0 h-full rounded-[3px]"
                                style={{
                                  backgroundColor: "var(--mark-primary)",
                                  opacity: 0.4,
                                  left: value < 0 ? `${50 + value * 50}%` : "50%",
                                  width: `${Math.abs(value) * 50}%`,
                                }}
                              />
                            )}
                            <div
                              className="absolute top-0 h-full"
                              style={{
                                left: "50%",
                                width: "1px",
                                backgroundColor: "var(--border-primary)",
                              }}
                            />
                          </div>
                          <span className="hidden min-[480px]:inline w-16 shrink-0 text-[11px] text-text-label truncate">
                            {axis.poleBLabel.split(" ")[0]}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </details>
            </div>
          </section>
        ))}
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
