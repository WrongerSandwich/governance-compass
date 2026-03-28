import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen px-4 py-20">
      <div className="max-w-[640px] mx-auto text-center">
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
