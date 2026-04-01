import Link from "next/link";

const PAGES = [
  {
    href: "/axes",
    title: "The twelve axes",
    description:
      "Each axis represents a genuine tension in how human societies can be organized. Pole descriptions, independence notes, and the domain structure that groups them.",
  },
  {
    href: "/questions",
    title: "Question bank",
    description:
      "Every question in the assessment with scoring annotations showing which axis and pole each item maps to, including the Chancellor\u2019s Budget ministry-to-axis mappings.",
  },
  {
    href: "/methodology",
    title: "How the Governance Compass works",
    description:
      "Three question formats, scoring pipeline, cross-cultural design choices, and the instrument\u2019s limitations.",
  },
];

export default function ReferencesPage() {
  return (
    <main className="min-h-screen px-4 py-12">
      <article className="mx-auto max-w-2xl">
        <p className="text-[11px] uppercase tracking-[0.08em] text-text-tertiary font-medium mb-1">
          Reference
        </p>
        <h1 className="text-[28px] font-serif font-medium text-text-primary leading-tight mb-3">
          References
        </h1>
        <p className="text-sm text-text-secondary leading-relaxed mb-10">
          Background material on the assessment &mdash; how the axes are
          defined, how each question maps to scoring, and the methodology behind
          the instrument.
        </p>

        <div className="space-y-6">
          {PAGES.map((page) => (
            <Link
              key={page.href}
              href={page.href}
              className="block rounded-[8px] border border-border-secondary px-5 py-4 hover:bg-surface-2 transition-colors duration-150"
            >
              <h2 className="text-[17px] font-serif font-medium text-text-primary mb-1">
                {page.title}
              </h2>
              <p className="text-sm text-text-secondary leading-relaxed">
                {page.description}
              </p>
            </Link>
          ))}
        </div>

        <div className="border-t border-border-secondary mt-12 pt-6">
          <div className="text-center">
            <Link
              href="/quiz"
              className="inline-block bg-stone-600 text-white py-3 px-8 rounded-[12px] text-sm font-medium hover:bg-stone-700 transition-colors duration-150"
            >
              Take the assessment
            </Link>
          </div>
        </div>
      </article>
    </main>
  );
}
