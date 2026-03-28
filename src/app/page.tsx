import Link from "next/link";

// Static example compass plot — gives visitors a taste of the cartographic aesthetic
function CompassPreview() {
  const SIZE = 200;
  const PAD = 30;
  const INNER = SIZE - PAD * 2;
  const CX = SIZE / 2;
  const CY = SIZE / 2;

  // Example position: slight collective-progressive lean
  const dotX = PAD + (((-0.28) + 1) / 2) * INNER;
  const dotY = PAD + ((1 - 0.15) / 2) * INNER;

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="w-full max-w-[180px] mx-auto"
      aria-hidden="true"
    >
      <rect x={PAD} y={PAD} width={INNER} height={INNER} rx={4} style={{ fill: 'var(--surface-1)' }} />

      {/* Contour lines */}
      <path d={`M ${PAD+5} ${PAD+INNER*0.35} Q ${CX-15} ${PAD+INNER*0.32}, ${SIZE-PAD-5} ${PAD+INNER*0.38}`} fill="none" style={{ stroke: 'var(--stone-600)', opacity: 'var(--contour-opacity)' }} strokeWidth={0.5} />
      <path d={`M ${PAD+5} ${PAD+INNER*0.6} Q ${CX+10} ${PAD+INNER*0.57}, ${SIZE-PAD-5} ${PAD+INNER*0.63}`} fill="none" style={{ stroke: 'var(--stone-600)', opacity: 'var(--contour-opacity)' }} strokeWidth={0.5} />

      {/* Crosshairs */}
      <line x1={CX} y1={PAD} x2={CX} y2={SIZE-PAD} style={{ stroke: 'var(--border-tertiary)' }} strokeWidth={0.5} />
      <line x1={PAD} y1={CY} x2={SIZE-PAD} y2={CY} style={{ stroke: 'var(--border-tertiary)' }} strokeWidth={0.5} />

      {/* Pulse rings */}
      <circle cx={dotX} cy={dotY} r={10} fill="none" style={{ stroke: 'var(--stone-600)' }} strokeWidth={0.5} opacity={0.2} />
      <circle cx={dotX} cy={dotY} r={6} fill="none" style={{ stroke: 'var(--stone-600)' }} strokeWidth={0.5} opacity={0.4} />
      <circle cx={dotX} cy={dotY} r={3} style={{ fill: 'var(--stone-600)' }} />

      {/* Cardinal labels */}
      <text x={CX} y={PAD-4} fontSize={6} style={{ fill: 'var(--text-tertiary)' }} textAnchor="middle" letterSpacing="0.08em">TRADITIONAL</text>
      <text x={CX} y={SIZE-PAD+10} fontSize={6} style={{ fill: 'var(--text-tertiary)' }} textAnchor="middle" letterSpacing="0.08em">PROGRESSIVE</text>
      <text x={PAD-4} y={CY} fontSize={6} style={{ fill: 'var(--text-tertiary)' }} textAnchor="end" dominantBaseline="middle" letterSpacing="0.08em">COLLECTIVE</text>
      <text x={SIZE-PAD+4} y={CY} fontSize={6} style={{ fill: 'var(--text-tertiary)' }} dominantBaseline="middle" letterSpacing="0.08em">MARKET</text>
    </svg>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen px-4 py-20">
      <div className="max-w-[640px] mx-auto text-center">
        {/* Compass preview — visual hook */}
        <div className="mb-6 opacity-80">
          <CompassPreview />
        </div>

        <h1 className="text-[22px] font-serif font-medium text-text-primary mb-4">
          The governance compass
        </h1>
        <p className="text-sm text-text-secondary mb-3 leading-relaxed">
          Explore where you stand across 12 governance axes — from
          economic philosophy to international engagement. A research-backed
          assessment that goes far beyond left and right.
        </p>
        <p className="text-sm text-text-tertiary mb-8 leading-relaxed">
          Compare your positions with friends axis by axis. See where
          you align, where you diverge, and gain a deeper understanding of each
          other&apos;s perspectives on how society should be governed.
        </p>
        <Link
          href="/quiz"
          className="inline-block bg-stone-600 text-white py-3 px-8 rounded-[12px] text-sm font-medium hover:bg-stone-700 transition-colors duration-150"
        >
          Begin assessment
        </Link>
        <p className="mt-3 text-xs font-serif italic text-text-tertiary">
          ~20 minutes &middot; 3 question modalities &middot; No account required
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-16 pb-20">
        <div className="grid min-[560px]:grid-cols-3 gap-5">
          <div className="bg-surface-1 rounded-[12px] border border-border-secondary p-6">
            <h3 className="text-[17px] font-serif font-medium text-text-primary mb-2">
              12 axes
            </h3>
            <p className="text-text-secondary text-sm leading-relaxed">
              Your positions mapped across 12 governance axes spanning
              economic, political, social, and international domains. No
              oversimplified quadrants.
            </p>
          </div>
          <div className="bg-surface-1 rounded-[12px] border border-border-secondary p-6">
            <h3 className="text-[17px] font-serif font-medium text-text-primary mb-2">
              Compare and discuss
            </h3>
            <p className="text-text-secondary text-sm leading-relaxed">
              Share your results and compare side-by-side with friends. Create
              groups to see where your circle stands on each axis.
            </p>
          </div>
          <div className="bg-surface-1 rounded-[12px] border border-border-secondary p-6">
            <h3 className="text-[17px] font-serif font-medium text-text-primary mb-2">
              Living profile
            </h3>
            <p className="text-text-secondary text-sm leading-relaxed">
              Add annotations explaining your reasoning on any axis.
              Revisit your results and share nuanced context with others.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
