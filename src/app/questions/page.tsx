import Link from "next/link";
import { axes } from "@/data/axes";
import { forcedChoiceItems } from "@/data/forced-choice-items";
import { scaledItems } from "@/data/scaled-items";
import { ministries, ministryAxisMappings } from "@/data/ministries";
import { DOMAIN_COLORS, type DomainKey } from "@/lib/design-tokens";

const DOMAIN_KEYS: DomainKey[] = ["economic", "power", "society", "world"];

const ABSTRACTION_LABELS: Record<string, string> = {
  P: "Principle",
  I: "Institutional",
  S: "Specific",
};

function getDomainKeyForAxis(axisId: number): DomainKey {
  for (const [key, config] of Object.entries(DOMAIN_COLORS)) {
    if (config.axes.includes(axisId)) return key as DomainKey;
  }
  return "economic";
}

export default function QuestionsPage() {
  // Group axes by domain
  const domainGroups = DOMAIN_KEYS.map((key) => ({
    key,
    axes: axes
      .filter((a) => getDomainKeyForAxis(a.id) === key)
      .sort((a, b) => a.order - b.order),
  }));

  // Index items by axis
  const fcByAxis = new Map<number, typeof forcedChoiceItems>();
  for (const item of forcedChoiceItems) {
    const list = fcByAxis.get(item.axisId) ?? [];
    list.push(item);
    fcByAxis.set(item.axisId, list);
  }
  const scByAxis = new Map<number, typeof scaledItems>();
  for (const item of scaledItems) {
    const list = scByAxis.get(item.axisId) ?? [];
    list.push(item);
    scByAxis.set(item.axisId, list);
  }

  // Build ministry → axis mappings for budget section
  const ministryMappings = ministries.map((m) => ({
    ministry: m,
    mappings: ministryAxisMappings
      .filter((mapping) => mapping.ministryId === m.id)
      .map((mapping) => {
        const axis = axes.find((a) => a.id === mapping.axisId)!;
        const pole = mapping.direction === -1 ? axis.poleALabel : axis.poleBLabel;
        return { axis, pole, direction: mapping.direction };
      }),
  }));

  return (
    <main className="min-h-screen px-4 py-12">
      <article className="mx-auto max-w-2xl">
        <p className="text-[11px] uppercase tracking-[0.08em] text-text-tertiary font-medium mb-1">
          Reference
        </p>
        <h1 className="text-[28px] font-serif font-medium text-text-primary leading-tight mb-3">
          Question bank
        </h1>

        {/* Spoiler notice */}
        <div className="border border-border-secondary rounded-[8px] px-4 py-3 mb-8">
          <p className="text-sm text-text-secondary leading-relaxed">
            This page lists every question in the assessment and shows how each
            one maps to the scoring model. If you haven&apos;t taken the quiz
            yet, we recommend{" "}
            <Link
              href="/quiz"
              className="text-text-primary font-medium hover:text-text-secondary transition-colors duration-150"
            >
              completing it first
            </Link>{" "}
            &mdash; seeing the questions in advance may influence your responses.
          </p>
        </div>

        {/* Axis nav */}
        <nav
          className="mb-10 space-y-3"
          aria-label="Page sections"
        >
          {domainGroups.map((domain) => (
            <div key={domain.key}>
              <a
                href={`#${domain.key}`}
                className="text-[11px] uppercase tracking-[0.08em] font-medium hover:opacity-80 transition-opacity duration-150"
                style={{ color: DOMAIN_COLORS[domain.key][600] }}
              >
                {DOMAIN_COLORS[domain.key].name}
              </a>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 pl-3 text-xs">
                {domain.axes.map((axis) => (
                  <a
                    key={axis.id}
                    href={`#axis-${axis.id}`}
                    className="text-text-tertiary hover:text-text-secondary transition-colors duration-150"
                  >
                    {axis.name}
                  </a>
                ))}
              </div>
            </div>
          ))}
          <div>
            <a
              href="#budget"
              className="text-[11px] uppercase tracking-[0.08em] font-medium text-text-tertiary hover:text-text-secondary transition-colors duration-150"
            >
              Chancellor&apos;s Budget
            </a>
          </div>
        </nav>

        {/* Questions by domain and axis */}
        <div className="space-y-12">
          {domainGroups.map((domain) => (
            <section key={domain.key} id={domain.key}>
              <h2
                className="text-[11px] uppercase tracking-[0.08em] font-medium border-b border-border-secondary pb-1.5 mb-6"
                style={{ color: DOMAIN_COLORS[domain.key][600] }}
              >
                {DOMAIN_COLORS[domain.key].name}
              </h2>

              <div className="space-y-10">
                {domain.axes.map((axis) => {
                  const fcItems = fcByAxis.get(axis.id) ?? [];
                  const scItems = scByAxis.get(axis.id) ?? [];

                  return (
                    <div key={axis.id} id={`axis-${axis.id}`}>
                      <h3 className="text-[17px] font-serif font-medium text-text-primary mb-0.5">
                        {axis.name}
                      </h3>
                      <p className="text-xs font-serif italic text-text-tertiary mb-5">
                        {axis.poleALabel} &harr; {axis.poleBLabel}
                      </p>

                      {/* Forced-choice items */}
                      {fcItems.length > 0 && (
                        <div className="mb-6">
                          <p className="text-[11px] uppercase tracking-[0.08em] text-text-tertiary font-medium mb-3">
                            Forced-choice items
                          </p>
                          <div className="space-y-4">
                            {fcItems.map((fc) => (
                              <div
                                key={fc.id}
                                className="border border-border-secondary rounded-[8px] px-4 py-3 border-l-2"
                                style={{ borderLeftColor: DOMAIN_COLORS[domain.key][600] }}
                              >
                                <p className="text-[11px] uppercase tracking-[0.08em] text-text-tertiary mb-2.5">
                                  {ABSTRACTION_LABELS[fc.abstractionLevel]}
                                </p>
                                <div className="space-y-3">
                                  <div>
                                    <p className="text-sm font-medium text-text-primary">
                                      {fc.headlineA}
                                    </p>
                                    <p className="text-sm text-text-secondary leading-relaxed mt-0.5">
                                      {fc.bodyA}
                                    </p>
                                    <p className="mt-1.5">
                                      <span className="inline-block text-[11px] font-mono text-text-tertiary bg-surface-2 rounded px-1.5 py-0.5">
                                        &rarr; {axis.poleALabel} (&minus;1.0)
                                      </span>
                                    </p>
                                  </div>
                                  <div className="border-t border-border-secondary" />
                                  <div>
                                    <p className="text-sm font-medium text-text-primary">
                                      {fc.headlineB}
                                    </p>
                                    <p className="text-sm text-text-secondary leading-relaxed mt-0.5">
                                      {fc.bodyB}
                                    </p>
                                    <p className="mt-1.5">
                                      <span className="inline-block text-[11px] font-mono text-text-tertiary bg-surface-2 rounded px-1.5 py-0.5">
                                        &rarr; {axis.poleBLabel} (+1.0)
                                      </span>
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Scaled items */}
                      {scItems.length > 0 && (
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.08em] text-text-tertiary font-medium mb-3">
                            Scaled items
                          </p>
                          <div className="space-y-4">
                            {scItems.map((sc) => (
                              <div
                                key={sc.id}
                                className="border border-border-secondary rounded-[8px] px-4 py-3"
                              >
                                <p className="text-sm font-medium text-text-primary mb-3">
                                  {sc.questionStem}
                                </p>
                                <div className="space-y-1.5">
                                  {[1, 2, 3, 4, 5].map((n) => {
                                    const label =
                                      sc[`option${n}Label` as keyof typeof sc] as string;
                                    const detail =
                                      sc[`option${n}Detail` as keyof typeof sc] as string;
                                    const score = n - 3; // -2, -1, 0, +1, +2
                                    const scoreLabel =
                                      score < 0
                                        ? `${axis.poleALabel} (${score / 2})`
                                        : score > 0
                                          ? `${axis.poleBLabel} (+${score / 2})`
                                          : "Neutral (0)";
                                    return (
                                      <div
                                        key={n}
                                        className="flex gap-3 text-sm"
                                      >
                                        <span className="shrink-0 w-5 text-xs text-text-tertiary tabular-nums pt-0.5 text-right">
                                          {n}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                          <span className="font-medium text-text-primary">
                                            {label}
                                          </span>
                                          {detail && (
                                            <span className="text-text-secondary">
                                              {" "}
                                              &mdash; {detail}
                                            </span>
                                          )}
                                          <span className="inline-block text-[11px] font-mono text-text-tertiary bg-surface-2 rounded px-1.5 py-0.5 ml-1.5 align-middle">
                                            {scoreLabel}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {/* Chancellor's Budget section */}
        <section id="budget" className="mt-12">
          <h2
            className="text-[11px] uppercase tracking-[0.08em] font-medium border-b border-border-secondary pb-1.5 mb-6"
            style={{ color: "#85735e" }}
          >
            Chancellor&apos;s Budget
          </h2>

          <p className="text-sm text-text-secondary leading-relaxed mb-2">
            The third phase of the assessment asks you to allocate 50 points
            across 7 government ministries. There isn&apos;t enough to fund
            everything well &mdash; the resulting allocation reveals operational
            priorities that often diverge from questionnaire responses.
          </p>
          <p className="text-sm text-text-secondary leading-relaxed mb-6">
            Each ministry&apos;s allocation feeds into the scoring model for one
            or more axes. Some axes receive signal from two opposing ministries
            (bidirectional), others from a single ministry (unidirectional), and
            four axes have no budget mapping at all. See the{" "}
            <Link
              href="/methodology#scoring"
              className="text-text-primary font-medium hover:text-text-secondary transition-colors duration-150"
            >
              scoring methodology
            </Link>{" "}
            for details on how budget allocations are weighted.
          </p>

          <div className="space-y-4">
            {ministryMappings.map(({ ministry, mappings }) => (
              <div
                key={ministry.id}
                className="border border-border-secondary rounded-[8px] px-4 py-3"
              >
                <p className="text-sm font-medium text-text-primary">
                  {ministry.name}
                </p>
                <p className="text-xs text-text-secondary mt-0.5">
                  {ministry.description}
                </p>
                {mappings.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                    {mappings.map(({ axis, pole }) => (
                      <span
                        key={axis.id}
                        className="inline-block text-[11px] font-mono text-text-tertiary bg-surface-2 rounded px-1.5 py-0.5"
                      >
                        &rarr; {axis.name} &mdash; toward {pole}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <p className="text-xs text-text-tertiary leading-relaxed border-l-2 border-border-secondary pl-3 mt-6">
            Axes without budget mapping (3: Governance Structure, 7: Social
            Change, 8: Cultural Diversity, 9: Human Nature) are scored entirely
            from forced-choice and scaled responses.
          </p>
        </section>

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
                href="/methodology"
                className="hover:text-text-secondary transition-colors duration-150"
              >
                read the methodology
              </Link>
            </p>
          </div>
        </div>
      </article>
    </main>
  );
}
