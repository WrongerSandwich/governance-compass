import { ButtonLink } from "@/components/Button";
import { PairedAxisScale } from "@/components/PairedAxisScale";
import { ReturningUserLink } from "@/components/ReturningUserLink";
import { axes } from "@/data/axes";
import { DOMAIN_COLORS, getDomainForAxis, type DomainKey } from "@/lib/design-tokens";
// Read at build time from committed derived JSON. This is a server component,
// so `data/synthetic_study/` never reaches a client bundle. The two respondents
// are real personas held anonymous — the panel says "Illustrative profile" and
// names them A and B, because a persona's identity means nothing outside the
// study section.
import homeSample from "../../public/study/derived/home_sample_pair.json";

const DOMAIN_ORDER: DomainKey[] = ["economic", "power", "society", "world"];

const axisById = new Map(axes.map((axis) => [axis.id, axis]));
const shortPole = (label: string) => label.split(" ")[0];
const axisNumber = (axisId: number) => String(axisId).padStart(2, "0");

export default function Home() {
  const { respondent_a: a, respondent_b: b } = homeSample;
  const diverging = homeSample.divergent_axis_ids.map((id) => axisById.get(id)!);
  const tensionAxis = axisById.get(homeSample.tension_axis_id)!;

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <div className="max-w-shell mx-auto px-[18px] min-[560px]:px-14 pt-[66px]">
        <div className="max-w-[800px]">
          <p className="label-eyebrow text-text-label mb-[22px]">
            A twelve-axis self-assessment
          </p>
          <h1 className="display-l min-[560px]:display-xl max-w-[11em] mb-[26px]">
            Locating a political position across twelve axes.
          </h1>
          <p className="body-lead text-text-secondary max-w-[34em] mb-5">
            Economic organization, the distribution of authority, social and
            cultural questions, and a state&apos;s conduct abroad &mdash; each
            measured separately, reported with its reasoning, and comparable
            with another respondent&apos;s.
          </p>
          <p className="text-sm leading-[1.62] text-text-label max-w-[34em] mb-8">
            Fifteen minutes of applied dilemmas, calibration scales, and budget
            allocations produce a surveyed position on all twelve axes.
          </p>
          <div className="flex flex-col min-[560px]:flex-row min-[560px]:items-center gap-2.5 min-[560px]:gap-5">
            <ButtonLink href="/quiz" className="w-full min-[560px]:w-auto max-w-xs">
              Begin the assessment
            </ButtonLink>
            {/* Mock 6a switches variant at 560px, so both render and CSS picks
                one. The hiding class has to out-order the variant's own
                `inline-block`: `min-[560px]:hidden` and `max-[560px]:hidden`
                are both emitted after it, but a bare `hidden` is not — it
                lands earlier in the sheet and never wins. */}
            <ButtonLink
              href="/methodology"
              variant="secondary"
              className="w-full min-[560px]:hidden max-w-xs"
            >
              Methodology
            </ButtonLink>
            <ButtonLink
              href="/methodology"
              variant="tertiary"
              className="max-[560px]:hidden"
            >
              Methodology
            </ButtonLink>
            <span className="caption-italic">~15 min &middot; no account required</span>
          </div>
          <ReturningUserLink />
        </div>
      </div>

      {/* Payoff block — a real pair of respondents, one row per axis */}
      <div className="max-w-shell mx-auto px-[18px] min-[560px]:px-14 pt-11 pb-[52px] grid grid-cols-1 min-[900px]:grid-cols-[1fr_356px] gap-5 min-[900px]:gap-7 items-start">
        <div className="bg-surface-1 border border-border-secondary rounded-sharp px-[26px] py-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2 pb-3 border-b border-stone-900 mb-3.5">
            <p className="label-eyebrow text-text-label">Illustrative profile</p>
            <div className="flex gap-[18px] label text-text-secondary tracking-[0.02em]">
              <span className="flex items-center gap-1.5">
                <span className="h-[9px] w-[9px] rounded-full bg-stone-900" />
                Respondent A
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-[9px] w-[9px] rounded-full border-[1.5px] border-text-label" />
                Respondent B
              </span>
            </div>
          </div>
          <div className="flex flex-col">
            {axes.map((axis) => (
              <div
                key={axis.id}
                className="py-2.5 border-t border-stone-50 min-[560px]:grid min-[560px]:grid-cols-[24px_1fr_158px] min-[560px]:gap-3.5 min-[560px]:items-center"
              >
                {/* Below 560px this wrapper is a row above the scale. At and
                    above it the wrapper dissolves, so the index and the name
                    become direct grid items and the name is ordered last —
                    index, scale, name across the three columns. */}
                <div className="flex items-baseline gap-2 mb-1.5 min-[560px]:contents">
                  <p className="label text-text-label">{axisNumber(axis.id)}</p>
                  <p className="text-[12.5px] leading-[1.3] min-[560px]:order-last">
                    {axis.name}
                  </p>
                </div>
                <PairedAxisScale
                  axisId={axis.id}
                  poleALabel={shortPole(axis.poleALabel)}
                  poleBLabel={shortPole(axis.poleBLabel)}
                  scoreA={a.axis_scores[axis.id - 1]}
                  scoreB={b.axis_scores[axis.id - 1]}
                  endpoints="below"
                  label={`${axis.name}: ${axis.poleALabel} to ${axis.poleBLabel}`}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div
            data-divergence
            className="bg-surface-1 border border-border-secondary rounded-sharp p-[22px]"
          >
            <p className="label-eyebrow text-text-label pb-3 border-b border-stone-900 mb-3.5">
              Where the two diverge
            </p>
            <div className="flex flex-col gap-4">
              {diverging.map((axis) => (
                <div
                  key={axis.id}
                  data-divergence-item
                  className="border-l-2 pl-3"
                  style={{ borderColor: DOMAIN_COLORS[getDomainForAxis(axis.id)][600] }}
                >
                  <p className="font-serif font-medium text-sm">{axis.name}</p>
                  <p className="mt-1 text-[12.5px] leading-[1.55] text-text-secondary">
                    {axis.divergenceNote}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-surface-2 border border-border-secondary rounded-sharp p-[22px]">
            <p className="label-eyebrow text-text-label mb-3">Internal tension</p>
            <p className="text-[13px] leading-[1.6] text-text-secondary">
              One respondent&apos;s stated and revealed preferences pull against
              each other on {tensionAxis.name.toLowerCase()}. The report names
              the conflict and shows the items that produced it.
            </p>
          </div>
        </div>
      </div>

      {/* Domain footer */}
      <div className="bg-surface-1 border-t border-border-secondary">
        <div className="max-w-shell mx-auto px-[18px] min-[560px]:px-14 pt-7 pb-12">
          <p className="label-eyebrow text-text-label mb-[26px]">
            The twelve axes, by domain
          </p>
          <div className="grid grid-cols-1 min-[560px]:grid-cols-4 gap-[22px] min-[560px]:gap-[30px]">
            {DOMAIN_ORDER.map((key, index) => {
              const domain = DOMAIN_COLORS[key];
              return (
                <div
                  key={key}
                  data-domain={key}
                  className="border-t-2 pt-3.5"
                  style={{ borderColor: domain[600] }}
                >
                  <p className="label-nav text-text-label mb-1">
                    {axisNumber(index + 1)}
                  </p>
                  <p className="font-serif font-medium text-[15px] mb-2.5">
                    {domain.name}
                  </p>
                  <p className="text-[12.5px] leading-[1.55] text-text-secondary mb-3.5">
                    {domain.blurb}
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {domain.axes.map((axisId) => {
                      const axis = axisById.get(axisId)!;
                      return (
                        <p key={axisId} className="label text-text-label leading-[1.4]">
                          {axisNumber(axis.id)}&nbsp;&nbsp;
                          {shortPole(axis.poleALabel)} &larr;&rarr;{" "}
                          {shortPole(axis.poleBLabel)}
                        </p>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
