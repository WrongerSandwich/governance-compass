import type { ReactNode } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import {
  archetypes,
  EMERGENCE_LABELS,
  EMERGENCE_TOOLTIPS,
  TRADITIONS_INTRO,
  type ArchetypeEmergence,
} from "@/data/archetypes";
import { axes } from "@/data/axes";
import { ExternalLink, isExternalHref } from "@/components/ExternalLink";
import { ReturningUserLink } from "@/components/ReturningUserLink";

const EMERGENCE_GLYPH: Record<ArchetypeEmergence, string> = {
  empirical: "●",
  refined: "◐",
  theoretical: "○",
};

function EmergenceMark({ emergence }: { emergence: ArchetypeEmergence }) {
  const fullLabel = `${EMERGENCE_LABELS[emergence]}. ${EMERGENCE_TOOLTIPS[emergence]}`;
  return (
    <span
      title={fullLabel}
      aria-label={fullLabel}
      className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.08em] font-medium text-text-tertiary whitespace-nowrap cursor-help"
    >
      <span
        aria-hidden="true"
        className="text-[11px] leading-none"
        style={{ color: "var(--stone-600)" }}
      >
        {EMERGENCE_GLYPH[emergence]}
      </span>
      {EMERGENCE_LABELS[emergence]}
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
    <main className="min-h-screen px-4 py-12">
      <article id="top" className="mx-auto max-w-2xl">
        <p className="text-[11px] uppercase tracking-[0.08em] text-text-tertiary font-medium mb-1">
          Reference
        </p>
        <h1 className="text-[28px] font-serif font-medium text-text-primary leading-tight mb-3">
          Governance archetypes
        </h1>
        <p className="text-sm text-text-secondary leading-relaxed mb-4">
          After scoring, your 12-axis profile is compared against {archetypes.length} archetype
          prototypes &mdash; idealized profiles representing coherent governance
          philosophies. You are assigned to the nearest archetype and shown your
          degree of match, your second-nearest, and a description of each
          archetype&apos;s internal logic.
        </p>
        <p className="text-sm text-text-secondary leading-relaxed mb-4">
          {TRADITIONS_INTRO.replace(/:$/, ".")} Each entry also lists the
          governance traditions and movements that have historically expressed
          that orientation.
        </p>
        <p className="text-sm text-text-secondary leading-relaxed mb-6">
          Most prototypes are theoretically derived from comparative political
          philosophy; a subset have been refined toward — or in one case
          identified directly from — empirical clusters surfaced in an
          April 2026 synthetic population study. A mark on each archetype
          indicates its provenance.
        </p>

        {/* Spoiler notice — flat, border-stripe only, to match the full-bleed surface system */}
        <div
          className="border-l-2 pl-4 py-1 my-8"
          style={{ borderLeftColor: "var(--warning)" }}
        >
          <p className="text-sm text-text-secondary leading-relaxed">
            <em className="font-serif italic text-warning-text">A note before reading —</em>{" "}
            archetype descriptions may influence how you answer. If you
            haven&apos;t taken the assessment yet, we recommend{" "}
            <Link
              href="/quiz"
              className="text-text-primary font-medium underline decoration-border-primary underline-offset-2 hover:decoration-text-secondary transition-colors duration-150"
            >
              completing it first
            </Link>
            .
          </p>
        </div>

        {/* Provenance legend — scannable key for the \u25cf/\u25d0/\u25cb marks */}
        <div className="mb-8">
          <p className="text-[11px] uppercase tracking-[0.08em] text-text-tertiary font-medium mb-2">
            Provenance
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-text-secondary">
            <li className="inline-flex items-baseline gap-1.5">
              <span aria-hidden="true" style={{ color: "var(--stone-600)" }}>●</span>
              <span>
                <span className="font-medium text-text-primary">Emerged from data</span>
                {" — "}identified from an empirical cluster in the April 2026 synthetic study
              </span>
            </li>
            <li className="inline-flex items-baseline gap-1.5">
              <span aria-hidden="true" style={{ color: "var(--stone-600)" }}>◐</span>
              <span>
                <span className="font-medium text-text-primary">Refined with data</span>
                {" — "}hand-crafted, then adjusted toward a matching empirical centroid
              </span>
            </li>
            <li className="inline-flex items-baseline gap-1.5">
              <span aria-hidden="true" style={{ color: "var(--stone-600)" }}>○</span>
              <span>
                <span className="font-medium text-text-primary">Theoretically derived</span>
                {" — "}grounded in comparative political philosophy, no empirical match surfaced
              </span>
            </li>
          </ul>
        </div>

        {/* Archetype nav — grouped by provenance tier */}
        <nav className="mb-10 space-y-5" aria-label="Archetype list">
          {navGroups.map(({ tier, items }) => (
            <div key={tier}>
              <p className="text-[11px] uppercase tracking-[0.08em] text-text-tertiary font-medium mb-2 inline-flex items-baseline gap-1.5">
                <span
                  aria-hidden="true"
                  className="text-[11px]"
                  style={{ color: "var(--stone-600)" }}
                >
                  {EMERGENCE_GLYPH[tier]}
                </span>
                {EMERGENCE_LABELS[tier]}
              </p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                {items.map((a) => (
                  <a
                    key={a.id}
                    href={`#${a.id}`}
                    className="text-text-tertiary hover:text-text-primary transition-colors duration-150 flex items-baseline gap-1.5"
                  >
                    <span className="font-mono tabular-nums text-[10px] opacity-50">
                      {String(numberFor.get(a.id)).padStart(2, "0")}
                    </span>
                    {a.name.replace(/^The\s+/, "")}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Archetype entries — full-bleed zebra rows, no card radius */}
        <div className="archetype-list -mx-4">
          {sortedArchetypes.map((archetype, i) => (
            <section
              key={archetype.id}
              id={archetype.id}
              className={`archetype-entry px-4 py-6 scroll-mt-20 ${
                i % 2 === 1 ? "bg-surface-2" : ""
              }`}
            >
              <header className="flex gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-mono text-[13px] text-text-tertiary tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h2 className="text-[18px] font-serif font-medium text-text-primary leading-tight">
                      {archetype.name}
                    </h2>
                  </div>
                  <div className="mb-2">
                    <EmergenceMark emergence={archetype.emergence} />
                  </div>
                </div>
                <MiniRadar prototype={archetype.prototype} />
              </header>

              <p className="text-sm text-text-secondary leading-relaxed mb-3">
                {archetype.description}
              </p>

              {/* Internal tension — serif italic lead-in */}
              <p className="text-[13px] text-text-secondary leading-relaxed mb-3">
                <em className="font-serif italic text-text-primary">
                  Internal tension.
                </em>{" "}
                {archetype.characteristicTension}
              </p>

              {/* Traditions — serif italic lead-in injected into the markdown <p> */}
              <TraditionsProse
                traditions={archetype.traditions}
                leadIn={
                  <>
                    <em className="font-serif italic text-text-primary">
                      Traditions.
                    </em>{" "}
                  </>
                }
              />


              {/* Axis positions — disclosure with caret */}
              <details className="group mt-3">
                <summary className="list-none inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.08em] text-text-tertiary font-medium cursor-pointer hover:text-text-secondary transition-colors duration-150 select-none">
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
                          <span className="text-xs text-text-secondary">
                            {axis.name}
                          </span>
                          <span className="text-[11px] font-mono text-text-tertiary tabular-nums">
                            {value > 0 ? "+" : ""}
                            {value.toFixed(1)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="hidden min-[480px]:inline w-16 shrink-0 text-[10px] text-text-tertiary text-right truncate">
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
                                  backgroundColor: "var(--stone-600)",
                                  opacity: 0.4,
                                  left:
                                    value < 0
                                      ? `${50 + value * 50}%`
                                      : "50%",
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
                          <span className="hidden min-[480px]:inline w-16 shrink-0 text-[10px] text-text-tertiary truncate">
                            {axis.poleBLabel.split(" ")[0]}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </details>
            </section>
          ))}
        </div>

        {/* Back-to-top + footer */}
        <div className="mt-6 text-right">
          <a
            href="#top"
            className="text-[11px] uppercase tracking-[0.08em] text-text-tertiary hover:text-text-secondary transition-colors duration-150"
          >
            ↑ Back to top
          </a>
        </div>

        <div className="border-t border-border-secondary mt-8 pt-6 text-center">
          <Link
            href="/quiz"
            className="inline-block border border-border-primary text-text-primary py-2.5 px-7 rounded-[8px] text-sm font-medium hover:border-text-secondary hover:text-text-primary transition-colors duration-150"
          >
            Begin assessment
          </Link>
          <p className="mt-3 text-xs text-text-tertiary">
            or{" "}
            <Link
              href="/references"
              className="hover:text-text-secondary transition-colors duration-150"
            >
              back to references
            </Link>
          </p>
          <ReturningUserLink
            label="← Back to your results"
            wrapperClassName="mt-1 text-center"
            className="text-xs text-text-tertiary hover:text-text-secondary transition-colors duration-150"
          />
        </div>
      </article>
    </main>
  );
}
