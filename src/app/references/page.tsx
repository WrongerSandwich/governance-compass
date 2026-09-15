import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { ReferenceCta } from "@/components/ReferenceCta";

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
      "Every question in the assessment with scoring annotations showing which axis and pole each item maps to, including the Chancellor’s Budget ministry-to-axis mappings.",
  },
  {
    href: "/archetypes",
    title: "Governance archetypes",
    description:
      "The 12 archetype prototypes used to characterize your profile — their descriptions, characteristic tensions, and prototype vectors.",
  },
];

export default function ReferencesPage() {
  return (
    <main className="min-h-screen px-6 pt-11 pb-10">
      <article className="mx-auto max-w-reference">
        <PageHeader
          kicker="Reference"
          title="References"
          lead={[
            "Background material on the assessment — how the axes are defined, how each question maps to scoring, and the methodology behind the instrument.",
          ]}
        />

        <div className="space-y-6 mt-9">
          {PAGES.map((page) => (
            <Link
              key={page.href}
              href={page.href}
              className="block rounded-sharp border border-border-secondary px-5 py-4 hover:bg-surface-2 transition-colors duration-150 focus-ring"
            >
              <h2 className="display-s text-text-primary mb-1">{page.title}</h2>
              <p className="body-s text-text-secondary">{page.description}</p>
            </Link>
          ))}
        </div>

        <ReferenceCta label="Take the assessment" secondary={null} />
      </article>
    </main>
  );
}
