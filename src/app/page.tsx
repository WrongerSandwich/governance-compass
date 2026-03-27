import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          PoliticalPlatform
        </h1>
        <p className="text-xl text-gray-600 mb-4 max-w-2xl mx-auto">
          Discover the nuances of your political views. Take a research-backed
          questionnaire and get a detailed, multi-dimensional profile — not
          just a simple left-right label.
        </p>
        <p className="text-gray-500 mb-10 max-w-xl mx-auto">
          Compare your positions with friends topic by topic. See where you
          align, where you diverge, and gain a deeper understanding of each
          other&apos;s perspectives.
        </p>
        <Link
          href="/quiz"
          className="inline-block bg-indigo-600 text-white py-3 px-8 rounded-lg text-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          Take the Quiz
        </Link>
        <p className="mt-4 text-sm text-gray-400">
          ~15-20 minutes &middot; No account required
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Multi-Dimensional
            </h3>
            <p className="text-gray-600 text-sm">
              See your positions across 12 distinct topics — from healthcare to
              technology policy. No oversimplified quadrants.
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Compare & Discuss
            </h3>
            <p className="text-gray-600 text-sm">
              Share your results and compare side-by-side with friends. Create
              groups to see where your circle stands.
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Living Profile
            </h3>
            <p className="text-gray-600 text-sm">
              Revisit and refine your answers over time. Add annotations
              explaining your reasoning on any topic.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
