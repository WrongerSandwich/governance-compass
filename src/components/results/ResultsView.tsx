"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CompassPlot } from "./CompassPlot";
import { ArchetypeCard } from "./ArchetypeCard";
import { RadarChart } from "./RadarChart";
import { AxisBreakdownCard } from "./AxisBreakdownCard";
import { Button } from "@/components/Button";
import { DOMAIN_COLORS, DOMAIN_MARK_VARS, type DomainKey } from "@/lib/design-tokens";
import { FadeInSection } from "@/components/FadeInSection";
import type {
  AxisConfidence,
  TensionDirection,
  TensionLevel,
} from "@/lib/scoring-types";

export interface AxisDisplayData {
  axisId: number;
  name: string;
  poleALabel: string;
  poleBLabel: string;
  tagline: string;
  domain: string;
  finalScore: number;
  /** The scoring engine's unions, not bare `string`s. An unrecognised
   *  confidence used to fall through to `AxisBreakdownCard`'s default branch
   *  and render "Low confidence"; an unrecognised `direction` falls through
   *  the narrative ladder below and renders a titled tension panel with no
   *  explanation at all. Both are silent-wrong-output failures that only a
   *  type can catch, since neither throws and both render plausibly. */
  confidence: AxisConfidence;
  tension: {
    detected: boolean;
    level: TensionLevel;
    direction: TensionDirection | null;
  };
  components: { fc: number; sc: number; bg: number | null };
}

export interface ResultsViewProps {
  axisData: AxisDisplayData[];
  compass: { economic: number; cultural: number };
  archetype: {
    primary: {
      id: string;
      name: string;
      matchPercentage: number;
      summary: string;
      description: string;
      tension: string;
      prototype: number[];
    };
    secondary: {
      name: string;
      matchPercentage: number;
    };
    isBlended: boolean;
    isDistinctive: boolean;
  };
  encoded?: string;
}

function CopyLinkButton() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement("input");
      input.value = window.location.href;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Button variant="secondary" onClick={handleCopy}>
      {copied ? "Copied!" : "Copy link"}
    </Button>
  );
}

function CompareInput({ myEncoded }: { myEncoded: string }) {
  const [open, setOpen] = useState(false);
  const [link, setLink] = useState("");
  const router = useRouter();

  const handleCompare = () => {
    // Extract the ?r= param from a pasted URL, or use the raw value
    const match = link.match(/[?&]r=([A-Za-z0-9_-]+)/);
    const theirEncoded = match ? match[1] : link.trim();
    if (!theirEncoded) return;
    router.push(`/compare?a=${myEncoded}&b=${theirEncoded}`);
  };

  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Compare with someone
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2 w-full">
      <input
        type="text"
        value={link}
        onChange={(e) => setLink(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleCompare()}
        placeholder="Paste their results link"
        autoFocus
        className="flex-1 min-w-0 rounded-sharp border border-border-primary px-3 py-2 body-s bg-surface-1 text-text-primary placeholder:text-text-label focus-ring"
      />
      <Button variant="secondary" onClick={handleCompare} disabled={!link.trim()}>
        Compare
      </Button>
      <Button variant="tertiary" onClick={() => { setOpen(false); setLink(""); }}>
        Cancel
      </Button>
    </div>
  );
}

const SECTION_IDS = {
  archetype: "archetype",
  radar: "radar",
  tensions: "tensions",
  breakdown: "breakdown",
  compass: "compass",
};

const PANEL = "bg-surface-1 border border-border-secondary rounded-sharp";

/** Eyebrow, heading and caption — the same three-line opener on four sections. */
function SectionHead({ eyebrow, title, caption }: { eyebrow: string; title: string; caption: string }) {
  return (
    <>
      <p className="label-eyebrow text-text-label mb-1.5">{eyebrow}</p>
      <h2 className="display-m text-text-primary mb-1.5">{title}</h2>
      <p className="caption-italic max-w-[60ch] mb-[18px]">{caption}</p>
    </>
  );
}

/** Sentence-cases a tension grade for display.
 *
 *  In JS rather than a `capitalize` class, for two reasons. `text-transform`
 *  does not touch `textContent`, so a CSS-only capital is invisible to a
 *  screen reader and to anything the respondent copies out of the page; and
 *  the title carries the `label` role, which sets `text-transform` itself, so
 *  layering a second one on it would leave the rendered case decided by
 *  Tailwind's emitted order. */
function sentenceCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function ResultsView({ axisData, compass, archetype, encoded }: ResultsViewProps) {
  const domainKeys: DomainKey[] = ["economic", "power", "society", "world"];
  const domains = domainKeys.map((key) => ({
    key,
    name: DOMAIN_COLORS[key].name,
    mark: DOMAIN_MARK_VARS[key],
    axes: axisData.filter((a) => a.domain === DOMAIN_COLORS[key].name),
  }));

  const tensionAxes = axisData.filter((a) => a.tension.detected);
  const [showScoring, setShowScoring] = useState(false);

  return (
    <main className="min-h-screen pt-12 pb-14 px-[18px] min-[560px]:px-7 overflow-x-hidden">
      <div data-results-column className="mx-auto max-w-results">
        {/* Page header */}
        <FadeInSection>
          <div>
            <p className="label-eyebrow text-text-label mb-3.5">Assessment results</p>
            {archetype.isDistinctive ? (
              <>
                <h1 className="display-page text-text-primary mb-2">A distinctive profile</h1>
                <p data-results-sub className="text-base leading-[1.6] text-text-secondary mb-5">
                  Your positions don&apos;t map to a single governance philosophy — nearest match is {archetype.primary.name} at {archetype.primary.matchPercentage}%.
                </p>
              </>
            ) : (
              <>
                <h1 className="display-page text-text-primary mb-2">{archetype.primary.name}</h1>
                <p data-results-sub className="text-base leading-[1.6] text-text-secondary mb-5">
                  {archetype.primary.matchPercentage}% match — your compass across twelve axes.
                </p>
              </>
            )}
          </div>
        </FadeInSection>

        {/* Section jump links */}
        <FadeInSection delay={100}>
          <nav
            className="flex flex-wrap gap-x-5 gap-y-2 py-3 border-y border-border-secondary label-nav text-text-label"
            aria-label="Page sections"
          >
            <a href={`#${SECTION_IDS.archetype}`} className="hover:text-text-primary transition-colors duration-150 focus-ring">Archetype</a>
            <a href={`#${SECTION_IDS.radar}`} className="hover:text-text-primary transition-colors duration-150 focus-ring">Radar</a>
            <a href={`#${SECTION_IDS.tensions}`} className="hover:text-text-primary transition-colors duration-150 focus-ring">Tensions</a>
            <a href={`#${SECTION_IDS.breakdown}`} className="hover:text-text-primary transition-colors duration-150 focus-ring">Breakdown</a>
            <a href={`#${SECTION_IDS.compass}`} className="hover:text-text-primary transition-colors duration-150 focus-ring">Compass</a>
          </nav>
        </FadeInSection>

        {/* 1. Archetype panel */}
        <FadeInSection delay={200}>
          <section id={SECTION_IDS.archetype} className={`${PANEL} p-[26px] mt-8`}>
            <ArchetypeCard
              primary={archetype.primary}
              secondary={archetype.secondary}
              isBlended={archetype.isBlended}
              isDistinctive={archetype.isDistinctive}
              userScores={axisData}
              actions={
                <>
                  <CopyLinkButton />
                  {/* Save to account hidden for v1 */}
                  {encoded && <CompareInput myEncoded={encoded} />}
                </>
              }
            />
          </section>
        </FadeInSection>

        {/* 2. Radar */}
        <FadeInSection>
          <section id={SECTION_IDS.radar} className="mt-10">
            <SectionHead
              eyebrow="Full profile"
              title="Twelve-axis radar"
              caption="Each spoke runs from one governance pole at the centre to its counterpart at the perimeter. The dashed ring is neutral; colour groups the axes by domain."
            />
            <div className={`${PANEL} p-7 flex justify-center`}>
              <RadarChart axisScores={axisData} />
            </div>
          </section>
        </FadeInSection>

        {/* 3. Tensions.
            Rendered unconditionally, where the parent commit hid the whole
            section when no tension was detected. The plan made the jump nav a
            fixed five-item row and accepted that `Tensions` would then resolve
            to nothing — but an inert item sitting in a rendered nav is not the
            same as an unused `:target`: clicking it sets the hash, scrolls
            nowhere and moves focus nowhere, and nothing distinguishes it from
            the four links that work. The empty state also says something the
            respondent wants to know. "Describe, don't prescribe": the absence
            of tension is itself a result, not silence. */}
        <FadeInSection>
          <section id={SECTION_IDS.tensions} className="mt-10">
            <SectionHead
              eyebrow="Detected tensions"
              title="Principles against priorities"
              caption="A tension is recorded when stated views and budget choices pull in different directions. It is common, and often the most informative part of a profile."
            />
            {tensionAxes.length === 0 ? (
              <div className={`${PANEL} px-[22px] py-5`}>
                <p data-tension-empty className="body-s text-text-secondary">
                  No tensions recorded: your stated views and budget priorities point the same way on all twelve axes.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {tensionAxes.map((axis) => {
                  // Exhaustive over TensionDirection, so the two arms cannot be
                  // reached by a value the ladder does not describe. A drifted
                  // direction used to fall through to "" and render a titled
                  // panel with no explanation; a SWAPPED pair renders the exact
                  // opposite of what the respondent answered, which is why both
                  // arms are pinned by name in the suite.
                  let narrative = "";
                  if (axis.tension.direction === "principles_B_but_budget_A") {
                    narrative = `Your questionnaire responses lean toward ${axis.poleBLabel}, but your budget priorities suggest ${axis.poleALabel}.`;
                  } else if (axis.tension.direction === "principles_A_but_budget_B") {
                    narrative = `Your questionnaire responses lean toward ${axis.poleALabel}, but your budget priorities suggest ${axis.poleBLabel}.`;
                  }

                  return (
                    <div
                      key={axis.axisId}
                      data-tension-panel
                      className={`${PANEL} border-l-2 border-l-warning px-[22px] py-5`}
                    >
                      <p data-tension-title className="label font-medium text-warning-text mb-1.5">
                        {sentenceCase(axis.tension.level)} tension · {axis.name}
                      </p>
                      {narrative && (
                        <p data-tension-narrative className="body-s text-text-secondary">
                          {narrative}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </FadeInSection>

        {/* 4. Axis breakdown by domain */}
        <FadeInSection>
          <section id={SECTION_IDS.breakdown} className="mt-10">
            <div className="flex items-baseline justify-between gap-4 flex-wrap">
              <h2 className="display-m text-text-primary mb-1.5">Axis breakdown</h2>
              <Button
                variant="tertiary"
                data-scoring-toggle
                onClick={() => setShowScoring((prev) => !prev)}
              >
                {showScoring ? "Hide scoring details" : "Show scoring details"}
              </Button>
            </div>
            <p className="caption-italic max-w-[60ch] mb-[22px]">
              Each axis is scored from −1.00 to +1.00 between its poles, weighted across dilemma choices, scale responses, and the budget allocation.
            </p>

            <div className="flex flex-col gap-[26px]">
              {domains.map((domain) => (
                <div key={domain.key}>
                  <div
                    data-domain-head
                    className="border-t-2 pt-2.5 mb-1.5 flex items-baseline justify-between gap-3"
                    style={{ borderTopColor: domain.mark }}
                  >
                    <p data-domain-name className="label font-medium" style={{ color: domain.mark }}>
                      {domain.name}
                    </p>
                    <p data-domain-count className="mono-meta text-text-label">
                      {domain.axes.length} axes
                    </p>
                  </div>
                  {domain.axes.map((axis) => (
                    <AxisBreakdownCard key={axis.axisId} {...axis} showScoring={showScoring} />
                  ))}
                </div>
              ))}
            </div>
          </section>
        </FadeInSection>

        {/* 5. Compass plot */}
        <FadeInSection>
          <section id={SECTION_IDS.compass} className="mt-10">
            <SectionHead
              eyebrow="Two-dimensional summary"
              title="Compass plot"
              caption="A simplified projection onto two super-dimensions. The twelve-axis radar above remains the primary output."
            />
            <div className={`${PANEL} p-6 flex justify-center`}>
              <CompassPlot
                economic={compass.economic}
                cultural={compass.cultural}
                primaryArchetypeId={archetype.isDistinctive ? undefined : archetype.primary.id}
              />
            </div>
          </section>
        </FadeInSection>
      </div>
    </main>
  );
}
