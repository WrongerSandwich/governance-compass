"use client";

import { Histogram } from "@/components/study/Histogram";
import { HorizontalBarChart } from "@/components/study/HorizontalBarChart";
import type { HorizontalBarChartRow } from "@/components/study/HorizontalBarChart";
import { DisagreementByAttribute } from "@/components/study/model-agreement/DisagreementByAttribute";
import type { AttributePanel } from "@/components/study/model-agreement/DisagreementByAttribute";
import { CaseStudy } from "@/components/study/model-agreement/CaseStudy";
import type { CaseStudyProps } from "@/components/study/model-agreement/CaseStudy";

// ---------------------------------------------------------------------------
// Types matching server-passed props
// ---------------------------------------------------------------------------

export interface PerAxisEntry {
  axis: number;
  axisName: string;
  pearson_r: number;
  mean_diff_gemini_minus_claude: number;
}

export interface DistanceStats {
  mean: number;
  median: number;
  p90: number;
  max: number;
  distances: number[];
}

export interface ModelAgreementClientProps {
  perAxis: PerAxisEntry[];
  distanceStats: DistanceStats;
  attributePanels: AttributePanel[];
  caseStudies: CaseStudyProps[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildHistogramBins(
  distances: number[],
  min: number,
  max: number,
  nBins: number
): number[] {
  const bins = new Array<number>(nBins).fill(0);
  const span = max - min;
  for (const d of distances) {
    const idx = Math.min(Math.floor(((d - min) / span) * nBins), nBins - 1);
    if (idx >= 0) bins[idx]++;
  }
  return bins;
}

function rColor(r: number): string {
  if (r >= 0.8) return "var(--axis-gradient-positive-strong)";
  if (r >= 0.7) return "var(--axis-gradient-neutral)";
  return "var(--axis-gradient-negative-mild)";
}

function driftColor(diff: number): string {
  if (diff > 0) return "var(--model-gemini)";
  return "var(--model-claude)";
}

// ---------------------------------------------------------------------------
// Stat — atlas-style, rule-framed (no card chrome)
// ---------------------------------------------------------------------------

function StatFigure({
  value,
  label,
  note,
}: {
  value: string;
  label: string;
  note?: string;
}) {
  return (
    <div className="flex flex-col">
      <div className="text-[32px] font-serif font-medium text-text-primary leading-none tabular-nums">
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-[0.08em] text-text-tertiary font-medium mt-2">
        {label}
      </div>
      {note && (
        <div className="text-[11px] text-text-tertiary mt-1 leading-snug">
          {note}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main client component
// ---------------------------------------------------------------------------

export function ModelAgreementClient({
  perAxis,
  distanceStats,
  attributePanels,
  caseStudies,
}: ModelAgreementClientProps) {
  const { mean, median, p90, max, distances } = distanceStats;

  // Build histogram bins: range 0–3.5, 28 bins (0.125 each)
  const HIST_MIN = 0;
  const HIST_MAX = 3.5;
  const N_BINS = 28;
  const histBins = buildHistogramBins(distances, HIST_MIN, HIST_MAX, N_BINS);

  // Per-axis r chart rows
  const rRows: HorizontalBarChartRow[] = perAxis.map((a) => ({
    label: `${a.axis}. ${a.axisName}`,
    value: a.pearson_r,
    color: rColor(a.pearson_r),
    secondaryLabel: a.pearson_r.toFixed(2),
  }));

  // Drift chart rows (diverging)
  const driftRows: HorizontalBarChartRow[] = perAxis.map((a) => ({
    label: `${a.axis}. ${a.axisName}`,
    value: a.mean_diff_gemini_minus_claude,
    color: driftColor(a.mean_diff_gemini_minus_claude),
    secondaryLabel:
      (a.mean_diff_gemini_minus_claude >= 0 ? "+" : "") +
      a.mean_diff_gemini_minus_claude.toFixed(3),
  }));

  // Count how many axes Gemini > Claude
  const geminiHigherCount = perAxis.filter(
    (a) => a.mean_diff_gemini_minus_claude > 0
  ).length;

  // Top 3 largest positive drifts
  const top3 = [...perAxis]
    .filter((a) => a.mean_diff_gemini_minus_claude > 0)
    .sort(
      (a, b) =>
        b.mean_diff_gemini_minus_claude - a.mean_diff_gemini_minus_claude
    )
    .slice(0, 3);

  const sqrtMax = Math.sqrt(48);
  const pctOfMax = Math.round((mean / sqrtMax) * 100);
  const countAbove25 = distances.filter((d) => d > 2.5).length;

  return (
    <div>
      {/* ------------------------------------------------------------------ */}
      {/* Section 1 — Overall agreement                                       */}
      {/* ------------------------------------------------------------------ */}
      <section
        id="section-1"
        className="mb-16"
        style={{ scrollMarginTop: "72px" }}
      >
        <div className="mx-auto max-w-3xl mb-8">
          <h2 className="text-[22px] font-serif font-medium text-text-primary">
            Overall agreement
          </h2>
        </div>

        {/* Stat figures + histogram */}
        <div
          className="mx-auto"
          style={{ maxWidth: "1120px", padding: "0 1rem" }}
        >
          {/* Atlas-style stat row — rules above and below, no card chrome */}
          <div
            className="grid items-baseline gap-x-8 gap-y-6 border-t border-b border-border-secondary py-6 mb-10"
            style={{
              borderTopWidth: "0.5px",
              borderBottomWidth: "0.5px",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            }}
          >
            <StatFigure
              value={mean.toFixed(2)}
              label="Mean Euclidean distance"
              note="across 150 shared personas"
            />
            <StatFigure
              value={median.toFixed(2)}
              label="Median distance"
              note={`90th percentile: ${p90.toFixed(2)}`}
            />
            <StatFigure
              value={`√48 ≈ ${sqrtMax.toFixed(2)}`}
              label="Maximum possible"
              note={`typical ≈ ${pctOfMax}% of max`}
            />
          </div>

          {/* Histogram — centered within its container to avoid orphaned gutter */}
          <div style={{ maxWidth: "640px", margin: "0 auto" }}>
            <p
              style={{
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--text-tertiary)",
                fontFamily: "var(--font-sans)",
                marginBottom: "8px",
              }}
            >
              Distribution of per-persona Euclidean distances (n=150)
            </p>
            <Histogram
              bins={histBins}
              range={[HIST_MIN, HIST_MAX]}
              xLabel="Euclidean distance"
              yLabel="Personas"
              height={180}
              barColor="var(--stone-600)"
              overlays={[
                {
                  value: mean,
                  label: `mean ${mean.toFixed(2)}`,
                  color: "var(--model-claude)",
                },
                {
                  value: median,
                  label: `median ${median.toFixed(2)}`,
                  color: "var(--model-gemini)",
                  dashed: true,
                },
              ]}
              ariaLabel="Histogram of per-persona Euclidean distances between Claude and Gemini scores"
            />
          </div>
        </div>

        {/* Prose */}
        <div className="mx-auto max-w-3xl mt-8 text-sm text-text-secondary leading-relaxed space-y-4">
          <p>
            Across the 150 shared personas, Claude and Gemini score the same
            persona at a mean Euclidean distance of {mean.toFixed(2)} in the
            12-dimensional axis space, with a median of {median.toFixed(2)} and
            a 90th-percentile distance of {p90.toFixed(2)}. The theoretical
            maximum distance in this space is √48 ≈ {sqrtMax.toFixed(2)}, so
            typical disagreement lands at roughly {pctOfMax}% of the maximum
            possible. Most personas cluster in the low-to-middle range of the
            distribution; a small tail of {countAbove25} personas shows
            distances above 2.5, and the maximum single-persona disagreement is{" "}
            {max.toFixed(2)}.
          </p>
          <p>
            This is not close agreement. It&apos;s also not wild disagreement.
            Two independent administrations of the instrument produce profiles
            that share the same broad shape — the 12-axis radar charts are
            recognizably similar for most personas — but with meaningful
            axis-level variation around that shape.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section 2a — Per-axis correlation                                   */}
      {/* ------------------------------------------------------------------ */}
      <section
        id="section-2a"
        className="mb-16"
        style={{ scrollMarginTop: "72px" }}
      >
        <div className="mx-auto max-w-3xl mb-8">
          <h2 className="text-[22px] font-serif font-medium text-text-primary">
            Per-axis correlation
          </h2>
        </div>

        <div
          className="mx-auto overflow-x-auto"
          style={{ maxWidth: "1120px", padding: "0 1rem" }}
        >
          {/* Color key */}
          <div
            style={{
              display: "flex",
              gap: "20px",
              marginBottom: "12px",
              flexWrap: "wrap",
            }}
          >
            {[
              {
                color: "var(--axis-gradient-positive-strong)",
                label: "r ≥ 0.80 — strong agreement",
              },
              {
                color: "var(--axis-gradient-neutral)",
                label: "0.70 ≤ r < 0.80 — moderate",
              },
              {
                color: "var(--axis-gradient-negative-mild)",
                label: "r < 0.70 — weaker",
              },
            ].map(({ color, label }) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    background: color,
                    borderRadius: "2px",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: "11px",
                    color: "var(--text-tertiary)",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>

          <HorizontalBarChart
            rows={rRows}
            range={[0, 1]}
            barHeight={24}
            ariaLabel="Pearson r between Claude and Gemini scores per axis"
          />
        </div>

        {/* Prose — verified against data */}
        <div className="mx-auto max-w-3xl mt-8 text-sm text-text-secondary leading-relaxed space-y-4">
          <p>
            Agreement varies substantially by axis. Four axes reach Pearson r
            above 0.80:{" "}
            {perAxis
              .filter((a) => a.pearson_r >= 0.8)
              .sort((a, b) => b.pearson_r - a.pearson_r)
              .map(
                (a) =>
                  `Axis ${a.axis} (${a.axisName}, r=${a.pearson_r.toFixed(2)})`
              )
              .join(", ")}
            . On these, the models converge on where a persona sits even if they
            don&apos;t agree on the exact score.
          </p>
          <p>
            Five axes fall below r=0.70:{" "}
            {perAxis
              .filter((a) => a.pearson_r < 0.7)
              .sort((a, b) => a.pearson_r - b.pearson_r)
              .map(
                (a) =>
                  `Axis ${a.axis} (${a.axisName}, r=${a.pearson_r.toFixed(2)})`
              )
              .join(", ")}
            . On these, model identity contributes meaningfully to the scored
            output — two administrations of the same persona can land noticeably
            differently.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section 2b — Directional drift (callout: rule-framed)               */}
      {/* ------------------------------------------------------------------ */}
      <section
        id="section-2b"
        className="mb-16 border-t border-b py-10"
        style={{
          scrollMarginTop: "72px",
          borderTopColor: "var(--warning-border)",
          borderBottomColor: "var(--warning-border)",
          borderTopWidth: "0.5px",
          borderBottomWidth: "0.5px",
        }}
      >
        <div className="mx-auto max-w-3xl mb-8">
          <p className="text-[10px] uppercase tracking-[0.1em] text-warning-text font-medium mb-2">
            Load-bearing finding
          </p>
          <h2 className="text-[22px] font-serif font-medium text-text-primary">
            Directional drift
          </h2>
          <p
            className="text-sm text-text-secondary leading-relaxed mt-3"
            style={{ maxWidth: "42rem" }}
          >
            Beyond per-axis correlation, there&apos;s a second finding worth
            flagging on its own: the two models don&apos;t just disagree
            noisily, they drift systematically in a specific direction.
          </p>
        </div>

        <div className="mx-auto overflow-x-auto" style={{ maxWidth: "1120px" }}>
          {/* Color key for drift */}
          <div
            style={{
              display: "flex",
              gap: "20px",
              marginBottom: "12px",
              flexWrap: "wrap",
            }}
          >
            {[
              {
                color: "var(--model-gemini)",
                label: "Gemini scores higher",
              },
              {
                color: "var(--model-claude)",
                label: "Claude scores higher",
              },
            ].map(({ color, label }) => (
              <div
                key={label}
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    background: color,
                    borderRadius: "2px",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: "11px",
                    color: "var(--text-tertiary)",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>

          <HorizontalBarChart
            rows={driftRows}
            diverging={true}
            range={[-0.4, 0.4]}
            barHeight={24}
            ariaLabel="Mean Gemini-minus-Claude score difference per axis"
          />
        </div>

        {/* Prose — verified: 11/12 corrected from spec's 10/12 */}
        <div className="mx-auto max-w-3xl mt-8 text-sm text-text-secondary leading-relaxed space-y-4">
          <p>
            Gemini scores personas higher than Claude on {geminiHigherCount} of
            the twelve axes. The only exception is Axis 4 (Decision Authority,
            where Gemini scores{" "}
            {Math.abs(
              perAxis.find((a) => a.axis === 4)
                ?.mean_diff_gemini_minus_claude ?? 0
            ).toFixed(2)}{" "}
            lower). Axis 2 (Environmental Policy) is essentially tied at +
            {perAxis
              .find((a) => a.axis === 2)
              ?.mean_diff_gemini_minus_claude.toFixed(3)}
            .
          </p>
          <p>
            The three largest drifts are Axis {top3[0].axis} ({top3[0].axisName}
            , Gemini +{top3[0].mean_diff_gemini_minus_claude.toFixed(2)} toward{" "}
            {top3[0].axis === 7
              ? "continuity/tradition"
              : top3[0].axis === 10
              ? "sovereignty"
              : "alternative legitimacy"}
            ), Axis {top3[1].axis} ({top3[1].axisName}, +
            {top3[1].mean_diff_gemini_minus_claude.toFixed(2)} toward{" "}
            {top3[1].axis === 10
              ? "sovereignty"
              : top3[1].axis === 7
              ? "continuity/tradition"
              : "alternative legitimacy"}
            ), and Axis {top3[2].axis} ({top3[2].axisName}, +
            {top3[2].mean_diff_gemini_minus_claude.toFixed(2)} toward{" "}
            {top3[2].axis === 6
              ? "alternative legitimacy"
              : top3[2].axis === 9
              ? "essentialism"
              : "higher scores"}
            ). Taken together, this is a coherent pattern rather than scattered
            noise: for a given persona, Gemini reads toward tradition,
            sovereignty, and alternative legitimacy sources more strongly than
            Claude does, while Claude reads slightly more toward institutional
            authority than Gemini.
          </p>
          <p>
            This shapes how the rest of this page — and the rest of the
            Synthetic Study — should be read. Claude administered 576 personas
            in this dataset, Gemini administered 576, and only 150 overlap. The
            non-shared administrations carry a model-specific drift that the
            shared-persona comparison makes visible but does not correct for.
            When reading regional aggregates or cluster characterizations,
            remember that each cluster contains a roughly even mix of
            Claude-scored and Gemini-scored personas, and those two halves are
            systematically different in the directions described above.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section 3 — Where disagreement concentrates                         */}
      {/* ------------------------------------------------------------------ */}
      <section
        id="section-3"
        className="mb-16"
        style={{ scrollMarginTop: "72px" }}
      >
        <div className="mx-auto max-w-3xl mb-8">
          <h2 className="text-[22px] font-serif font-medium text-text-primary">
            Where disagreement concentrates
          </h2>
        </div>

        {/* Scoping prose */}
        <div className="mx-auto max-w-3xl mb-10 text-sm text-text-secondary leading-relaxed space-y-4">
          <p>
            The following analysis examines whether the size of Claude-Gemini
            disagreement varies with who the persona is. Before the findings:
            the sample size is 150 personas, and when this is split across 10
            regions or 6 governance-experience categories, individual category
            means rest on fewer than 25 personas each. The patterns below are
            suggestive of where the two models may process context differently,
            not conclusive evidence of model bias against specific populations.
          </p>
        </div>

        {/* Small multiples — DisagreementByAttribute */}
        <div
          className="mx-auto overflow-x-auto"
          style={{ maxWidth: "1120px", padding: "0 1rem" }}
        >
          <DisagreementByAttribute
            panels={attributePanels}
            overallMean={mean}
          />
        </div>

        {/* Findings prose — rewritten from data */}
        <div className="mx-auto max-w-3xl mt-10 text-sm text-text-secondary leading-relaxed space-y-4">
          <p>
            With that scope in mind:
          </p>
          <p>
            Regional variation is substantial. Western Europe sits at the low
            end (mean distance 1.11), followed by East Asia (1.26) and North
            America (1.33). The highest disagreement appears in Oceania/small
            states (1.96, though n=5), Diaspora/transnational (1.89), and
            Sub-Saharan Africa (1.83). Eastern Europe and Central Asia (1.79)
            and South/Southeast Asia (1.67) also run well above the overall
            mean of {mean.toFixed(2)}.
          </p>
          <p>
            Governance experience shows the clearest pattern: the more
            politically contested or repressive the governance context a persona
            was generated under, the further apart Claude and Gemini score that
            persona. Stable democracy (1.16) sits lowest by a wide margin.
            Conflict zones (1.86) sit highest, followed by hybrid regimes
            (1.75) and flawed democracies (1.70). Authoritarian states (1.53)
            sit closer to the middle — between stable democracy and the other
            contested categories — which may reflect the clearer internal logic
            those personas project, despite high political stakes.
          </p>
          <p>
            Urban/rural shows meaningful differentiation: rural personas
            average 1.35, urban 1.51, and peri-urban 1.70 — a spread of 0.35.
            Economic position shows a smaller gradient among the main
            categories (working class 1.43, middle class 1.48, struggling
            1.68, affluent 1.64), with the four wealthy personas as an outlier
            at 0.70 on very small n. Education shows a modest spread from
            university-educated (1.42) to postgraduate (1.71), but the ordering
            is non-monotonic. Gender shows moderate differentiation: non-binary
            (1.34) and male (1.45) personas sit below the mean, female personas
            slightly above (1.60).
          </p>

          {/* Closing interpretation paragraphs — verbatim from spec */}
          <p>
            Two interpretations are available for the governance-experience
            pattern, and the data alone doesn&apos;t distinguish between them.
            One: the models genuinely process context from politically complex
            environments differently, with one or both models reading persona
            narratives from those environments through divergent frames. Two:
            personas from complex governance environments simply have more
            internally contradictory content (someone from a conflict zone is
            more likely to carry tensions between survival, freedom, authority,
            and community that any given model will resolve differently),
            producing more score variance independent of any real model-level
            difference.
          </p>
          <p>
            What the data supports: model-level variation matters more for some
            kinds of personas than others. What it does not support: a claim
            that either model is &ldquo;more accurate&rdquo; or &ldquo;less
            biased&rdquo; — neither model is being compared to ground truth,
            because there is no ground truth. Both models are responding to the
            same synthetic biographical text, and both are valid measurements
            of that text under their respective priors.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section 4 — Individual cases                                        */}
      {/* ------------------------------------------------------------------ */}
      <section
        id="section-4"
        className="mb-16"
        style={{ scrollMarginTop: "72px" }}
      >
        <div className="mx-auto max-w-3xl mb-8">
          <h2 className="text-[22px] font-serif font-medium text-text-primary">
            Individual cases
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed mt-4" style={{ maxWidth: "42rem" }}>
            The aggregate statistics smooth over what individual disagreements
            actually look like. These four personas illustrate the range: one
            where the models agree closely, one near the typical midpoint, one
            where they diverge significantly, and one where the drift is
            consistent and directional rather than noisy.
          </p>
        </div>

        <div
          className="mx-auto"
          style={{ maxWidth: "1120px", padding: "0 1rem" }}
        >
          {caseStudies.map((cs, i) => (
            <div key={cs.personaId}>
              <CaseStudy {...cs} />
              {i < caseStudies.length - 1 && (
                <hr
                  style={{
                    border: "none",
                    borderTop: "0.5px solid var(--border-secondary)",
                    margin: "40px 0",
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section 5 — What this means for the instrument                      */}
      {/* ------------------------------------------------------------------ */}
      <section
        id="section-5"
        className="mb-16"
        style={{ scrollMarginTop: "72px" }}
      >
        <div className="mx-auto max-w-3xl">
          <h2 className="text-[22px] font-serif font-medium text-text-primary mb-8">
            What this means for the instrument
          </h2>
          <div className="text-sm text-text-secondary leading-relaxed space-y-4">
            <p>
              The shared-persona comparison tells us something about the
              instrument and something about large language models as survey
              respondents. On the instrument: axes 1, 2, 4, and 8 produce the
              most consistent scoring across models, and are the ones readers
              can place the most weight on when interpreting individual results.
              Axes 10, 12, and 6 produce meaningfully more model-dependent
              scoring, and individual scores on those axes carry more noise.
            </p>
            <p>
              On LLMs as respondents: two frontier models, given the same
              persona description and the same instrument, will produce profiles
              that are broadly similar but meaningfully distinct. The model
              matters. This is worth naming when any claim is made about what
              &ldquo;AI models think&rdquo; on a given governance question — the
              answer depends on which model you asked. The 150-persona comparison
              here is small, and it&apos;s on synthetic personas rather than
              neutral responses, but the direction of the finding is clear enough
              to carry that caveat.
            </p>
            <p>
              For real users taking the Governance Compass, this analysis has
              limited direct relevance — the instrument administers to human
              respondents, not to LLMs. But if the tool is ever used by people
              to explore how language models would score hypothetical profiles (a
              use we don&apos;t endorse but can&apos;t prevent), knowing that
              model choice substantially affects the scoring for three axes is
              material.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
