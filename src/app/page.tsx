import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          The Governance Compass
        </h1>
        <p className="text-xl text-gray-600 mb-4 max-w-2xl mx-auto">
          Explore where you stand across 12 governance dimensions — from
          economic philosophy to international engagement. A research-backed
          assessment that goes far beyond left and right.
        </p>
        <p className="text-gray-500 mb-10 max-w-xl mx-auto">
          Compare your positions with friends dimension by dimension. See where
          you align, where you diverge, and gain a deeper understanding of each
          other&apos;s perspectives on how society should be governed.
        </p>
        <Link
          href="/quiz"
          className="inline-block bg-indigo-600 text-white py-3 px-8 rounded-lg text-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          Take the Assessment
        </Link>
        <p className="mt-4 text-sm text-gray-400">
          ~20 minutes &middot; 3 question modalities &middot; No account required
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              12 Dimensions
            </h3>
            <p className="text-gray-600 text-sm">
              Measure your positions across 12 governance axes spanning
              economic, political, social, and international domains. No
              oversimplified quadrants.
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Compare &amp; Discuss
            </h3>
            <p className="text-gray-600 text-sm">
              Share your results and compare side-by-side with friends. Create
              groups to see where your circle stands on each dimension.
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Living Profile
            </h3>
            <p className="text-gray-600 text-sm">
              Add annotations explaining your reasoning on any dimension.
              Revisit your results and share nuanced context with others.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
