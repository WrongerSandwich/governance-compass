import Link from "next/link";
import { archetypes } from "@/data/archetypes";
import { axes } from "@/data/axes";

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
          These prototypes are theoretically derived, not empirically clustered
          from response data. They serve as interpretive anchors, not statistical
          categories.
        </p>

        {/* Spoiler notice */}
        <div className="bg-surface-2 border-l-2 rounded-[8px] px-4 py-3 mb-10" style={{ borderLeftColor: "#85735e" }}>
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
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
            {sortedArchetypes.map((a) => (
              <a
                key={a.id}
                href={`#${a.id}`}
                className="text-text-tertiary hover:text-text-secondary transition-colors duration-150"
              >
                {a.name.replace("The ", "")}
              </a>
            ))}
          </div>
        </nav>

        {/* Archetype entries */}
        <div className="space-y-10">
          {sortedArchetypes.map((archetype) => (
            <section key={archetype.id} id={archetype.id}>
              <h2 className="text-[17px] font-serif font-medium text-text-primary mb-1">
                {archetype.name}
              </h2>
              <p className="text-sm text-text-secondary leading-relaxed mb-3">
                {archetype.description}
              </p>

              {/* Characteristic tension */}
              <div className="border-l-2 border-border-secondary pl-3 mb-4">
                <p className="text-[11px] uppercase tracking-[0.08em] text-text-tertiary font-medium mb-1">
                  Characteristic tension
                </p>
                <p className="text-xs text-text-tertiary leading-relaxed">
                  {archetype.characteristicTension}
                </p>
              </div>

              {/* Prototype vector */}
              <details className="group">
                <summary className="text-[11px] uppercase tracking-[0.08em] text-text-tertiary font-medium cursor-pointer hover:text-text-secondary transition-colors duration-150 select-none">
                  Prototype vector
                </summary>
                <div className="mt-2 space-y-0.5">
                  {archetype.prototype.map((value, i) => {
                    const axis = axes.find((a) => a.id === i + 1)!;
                    const poleLabel =
                      value < 0
                        ? axis.poleALabel
                        : value > 0
                          ? axis.poleBLabel
                          : "Neutral";
                    return (
                      <div key={axis.id} className="flex items-center gap-2">
                        <span className="w-36 shrink-0 text-xs text-text-secondary truncate">
                          {axis.name}
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
                        <span className="w-20 shrink-0 text-right">
                          <span className="text-[11px] font-mono text-text-tertiary tabular-nums">
                            {value > 0 ? "+" : ""}{value.toFixed(1)}
                          </span>
                          <span className="text-[10px] text-text-tertiary ml-1 hidden min-[480px]:inline">
                            {poleLabel}
                          </span>
                        </span>
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
