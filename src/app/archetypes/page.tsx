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

function TraditionsSection({ traditions }: { traditions: string }) {
  return (
    <div className="mb-4">
      <p className="text-[11px] uppercase tracking-[0.08em] text-text-tertiary font-medium mb-1">
        Traditions
      </p>
      <p className="text-xs text-text-tertiary leading-relaxed mb-2 italic">
        {TRADITIONS_INTRO}
      </p>
      <div className="text-xs text-text-secondary leading-relaxed">
        <ReactMarkdown
          components={{
            p: ({ children }) => <p>{children}</p>,
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
      </div>
    </div>
  );
}

const EMERGENCE_BADGE_STYLES: Record<
  ArchetypeEmergence,
  { backgroundColor: string; color: string; borderColor: string }
> = {
  empirical: {
    backgroundColor: "rgba(133, 115, 94, 0.16)",
    color: "var(--stone-700)",
    borderColor: "rgba(133, 115, 94, 0.4)",
  },
  refined: {
    backgroundColor: "rgba(133, 115, 94, 0.08)",
    color: "var(--stone-600)",
    borderColor: "rgba(133, 115, 94, 0.25)",
  },
  theoretical: {
    backgroundColor: "transparent",
    color: "var(--text-tertiary)",
    borderColor: "var(--border-secondary)",
  },
};

function EmergenceBadge({ emergence }: { emergence: ArchetypeEmergence }) {
  const style = EMERGENCE_BADGE_STYLES[emergence];
  return (
    <span
      title={EMERGENCE_TOOLTIPS[emergence]}
      className="inline-flex items-center text-[10px] uppercase tracking-[0.08em] font-medium rounded-[3px] px-1.5 py-0.5 border whitespace-nowrap cursor-help"
      style={style}
    >
      {EMERGENCE_LABELS[emergence]}
    </span>
  );
}

const RADAR_SIZE = 56;
const RADAR_CX = RADAR_SIZE / 2;
const RADAR_CY = RADAR_SIZE / 2;
const RADAR_R = 22;
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
  return (
    <svg
      viewBox={`0 0 ${RADAR_SIZE} ${RADAR_SIZE}`}
      className="w-14 h-14 shrink-0"
      aria-hidden="true"
    >
      {/* Outer ring */}
      <polygon
        points={Array.from({ length: AXIS_COUNT }, (_, i) => {
          const angle = (i / AXIS_COUNT) * 2 * Math.PI - Math.PI / 2;
          return `${RADAR_CX + RADAR_R * Math.cos(angle)},${RADAR_CY + RADAR_R * Math.sin(angle)}`;
        }).join(" ")}
        fill="none"
        style={{ stroke: "var(--border-secondary)" }}
        strokeWidth={0.5}
        opacity={0.5}
      />
      {/* Prototype shape */}
      <polygon
        points={radarPoints(prototype)}
        style={{ fill: "var(--stone-600)", stroke: "var(--stone-600)" }}
        fillOpacity={0.12}
        strokeOpacity={0.5}
        strokeWidth={1}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ArchetypesPage() {
  const sortedArchetypes = [...archetypes].sort(
    (a, b) => a.displayOrder - b.displayOrder
  );

  return (
    <main className="min-h-screen px-4 py-12">
      <article className="mx-auto max-w-2xl">
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
          Most prototypes are theoretically derived from comparative political
          philosophy. A subset have been refined toward — or in one case
          identified directly from — empirical clusters surfaced in an April
          2026 synthetic population study. A small tag on each archetype
          indicates its provenance.
        </p>

        {/* Spoiler notice */}
        <div className="border-l-2 rounded-[8px] px-4 py-3 mb-10" style={{ borderLeftColor: "#b5942e", backgroundColor: "rgba(181, 148, 46, 0.08)" }}>
          <p className="text-sm text-text-secondary leading-relaxed">
            Reading archetype descriptions before taking the assessment may
            influence how you respond. If you haven&apos;t taken it yet, we
            recommend{" "}
            <Link
              href="/quiz"
              className="text-text-primary font-medium hover:text-text-secondary transition-colors duration-150"
            >
              completing it first
            </Link>
            .
          </p>
        </div>

        {/* Archetype nav */}
        <nav className="mb-10" aria-label="Archetype list">
          <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 text-xs">
            {sortedArchetypes.map((a, i) => (
              <a
                key={a.id}
                href={`#${a.id}`}
                className="text-text-tertiary hover:text-text-secondary transition-colors duration-150 flex items-baseline gap-1.5"
              >
                <span className="font-mono tabular-nums text-[10px] opacity-50">{i + 1}</span>
                {a.name.replace("The ", "")}
              </a>
            ))}
          </div>
        </nav>

        {/* Archetype entries */}
        <div className="space-y-2">
          {sortedArchetypes.map((archetype, i) => (
            <section
              key={archetype.id}
              id={archetype.id}
              className={`rounded-[8px] px-4 py-5 ${i % 2 === 1 ? "bg-surface-2" : ""}`}
            >
              <div className="flex gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <h2 className="text-[17px] font-serif font-medium text-text-primary mb-1">
                    <span className="font-mono text-[13px] text-text-tertiary mr-2 tabular-nums">{i + 1}</span>
                    {archetype.name}
                  </h2>
                  <div className="mb-2">
                    <EmergenceBadge emergence={archetype.emergence} />
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {archetype.description}
                  </p>
                </div>
                <MiniRadar prototype={archetype.prototype} />
              </div>

              {/* Characteristic tension */}
              <div className="border-l-2 border-border-secondary pl-3 mb-4">
                <p className="text-[11px] uppercase tracking-[0.08em] text-text-tertiary font-medium mb-1">
                  Internal tension
                </p>
                <p className="text-xs text-text-tertiary leading-relaxed">
                  {archetype.characteristicTension}
                </p>
              </div>

              {/* Traditions */}
              <TraditionsSection traditions={archetype.traditions} />

              {/* Prototype vector */}
              <details className="group">
                <summary className="text-[11px] uppercase tracking-[0.08em] text-text-tertiary font-medium cursor-pointer hover:text-text-secondary transition-colors duration-150 select-none">
                  Axis positions
                </summary>
                <div className="mt-2 space-y-1">
                  {archetype.prototype.map((value, idx) => {
                    const axis = axes.find((a) => a.id === idx + 1)!;
                    return (
                      <div key={axis.id}>
                        <div className="flex items-baseline justify-between mb-0.5">
                          <span className="text-xs text-text-secondary">
                            {axis.name}
                          </span>
                          <span className="text-[11px] font-mono text-text-tertiary tabular-nums">
                            {value > 0 ? "+" : ""}{value.toFixed(1)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="hidden min-[480px]:inline w-16 shrink-0 text-[10px] text-text-tertiary text-right truncate">
                            {axis.poleALabel.split(" ")[0]}
                          </span>
                          {/* Bar */}
                          <div className="flex-1 h-[6px] rounded-[3px] relative overflow-hidden"
                            style={{ backgroundColor: "var(--border-secondary)" }}
                          >
                            {value !== 0 && (
                              <div
                                className="absolute top-0 h-full rounded-[3px]"
                                style={{
                                  backgroundColor: "var(--stone-600)",
                                  opacity: 0.4,
                                  left: value < 0 ? `${50 + value * 50}%` : "50%",
                                  width: `${Math.abs(value) * 50}%`,
                                }}
                              />
                            )}
                            {/* Center line */}
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

        {/* Footer */}
        <div className="border-t border-border-secondary mt-12 pt-6">
          <div className="text-center">
            <Link
              href="/quiz"
              className="inline-block bg-stone-600 text-white py-3 px-8 rounded-[12px] text-sm font-medium hover:bg-stone-700 transition-colors duration-150"
            >
              Take the assessment
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
          </div>
        </div>
      </article>
    </main>
  );
}
