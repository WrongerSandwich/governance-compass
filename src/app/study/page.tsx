import Link from "next/link";
import fs from "node:fs";
import path from "node:path";

interface DownloadMeta {
  fileSizeBytes: number;
  version: string;
  path: string;
}

const downloadMeta: DownloadMeta = JSON.parse(
  fs.readFileSync(
    path.join(process.cwd(), "public/study/derived/download_meta.json"),
    "utf8"
  )
);

function formatFileSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  if (mb >= 10) {
    return `~${Math.round(mb)} MB`;
  }
  return `~${mb.toFixed(1)} MB`;
}

const fileSizeLabel = formatFileSize(downloadMeta.fileSizeBytes);

const KEY_FIGURES = [
  { n: "1,002", label: "Personas" },
  { n: "1,152", label: "Administrations" },
  { n: "150", label: "Shared" },
  { n: "6", label: "Clusters" },
  { n: "12", label: "Archetypes" },
];

const DEEP_LINKS = [
  {
    href: "/study/personas",
    number: "01",
    title: "Personas",
    description:
      "Browse all 1,002 individually, filter by region or attribute, view full profiles.",
  },
  {
    href: "/study/patterns",
    number: "02",
    title: "Patterns",
    description:
      "How personas cluster in the 12-axis space, how clusters map to the twelve archetypes, and how axis profiles vary by region and demographic.",
  },
  {
    href: "/study/model-agreement",
    number: "03",
    title: "Model Agreement",
    description:
      "Where Claude and Gemini converged, where they split, and on which axes the split patterns with persona attributes.",
  },
];

export default function StudyOverviewPage() {
  return (
    <main className="min-h-screen px-4 py-12">
      <article className="mx-auto max-w-xl">
        <p className="text-[11px] uppercase tracking-[0.08em] text-text-tertiary font-medium mb-1">
          Synthetic Study
        </p>
        <h1 className="text-[clamp(32px,5vw,38px)] font-serif font-medium text-text-primary leading-tight mb-6 text-balance">
          The Synthetic Study
        </h1>

        <p className="text-[15px] text-text-secondary leading-relaxed mb-8">
          In April 2026, we asked a language model to generate biographies for 1,002 fictional
          people, administered the Governance Compass to each via two different models, and
          clustered the results. This section makes that dataset available for browsing,
          analysis, and download.
        </p>

        {/* Key figures — atlas-style frontmatter */}
        <section aria-label="Study at a glance" className="mb-12">
          <dl
            className="grid grid-cols-2 min-[500px]:[grid-template-columns:repeat(auto-fit,minmax(90px,1fr))] items-baseline gap-x-6 gap-y-5 border-t border-b border-border-secondary py-5"
            style={{
              borderTopWidth: "0.5px",
              borderBottomWidth: "0.5px",
            }}
          >
            {KEY_FIGURES.map((f) => (
              <div key={f.label} className="flex flex-col">
                <dt className="text-[28px] font-serif font-medium text-text-primary leading-none tabular-nums">
                  {f.n}
                </dt>
                <dd className="text-[10px] uppercase tracking-[0.08em] text-text-tertiary font-medium mt-1.5">
                  {f.label}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-[12px] text-text-tertiary">
            <a
              href="/data/synthetic_study_v1.json"
              download
              className="underline underline-offset-4 decoration-dotted decoration-border-secondary hover:text-text-secondary hover:decoration-text-tertiary transition-colors duration-150"
            >
              <span aria-hidden="true">↓</span> Full dataset — {fileSizeLabel}{" "}
              JSON
            </a>
            {/* Separator + version kept together so they never orphan on wrap */}
            <span className="whitespace-nowrap">
              <span aria-hidden="true" className="mx-2 text-border-secondary">
                ·
              </span>
              <span>version {downloadMeta.version}</span>
            </span>
          </p>
          {/* Quiet pointer to child pages — surfaces discoverability without
              stealing attention from the prose sections below. The full
              editorial handoff with descriptions still lives at page bottom. */}
          <p className="mt-1.5 text-[12px] text-text-tertiary">
            <span className="mr-1.5">Browse:</span>
            {DEEP_LINKS.map((link, i) => (
              <span key={link.href}>
                {i > 0 && (
                  <span
                    aria-hidden="true"
                    className="mx-1.5 text-border-secondary"
                  >
                    ·
                  </span>
                )}
                <Link
                  href={link.href}
                  className="hover:text-text-secondary underline underline-offset-4 decoration-border-secondary hover:decoration-text-tertiary transition-colors duration-150"
                >
                  {link.title}
                </Link>
              </span>
            ))}
          </p>
        </section>

        <div className="text-[15px] text-text-secondary leading-relaxed">
          {/* Section: How it was built */}
          <section className="mb-10">
            <h2 className="text-[20px] font-serif font-medium text-text-primary mb-3 text-balance">
              How it was built
            </h2>
            <div className="space-y-4">
              <p>
                The 1,002 personas were generated by Google&apos;s Gemini 2.5 Flash, stratified
                across ten regions: Western Europe, Eastern Europe and Central Asia, East Asia,
                Latin America, the Middle East and North Africa, sub-Saharan Africa, North America,
                South and Southeast Asia, Oceania small states, and a transnational diaspora
                category. Each persona came with a biographical narrative, demographic attributes
                (age, gender, occupation, education, economic position, religious tradition,
                governance experience), and a statement of the tensions the persona carries.
              </p>
              <p>
                The instrument was administered twice to 150 personas &mdash; once by Claude Sonnet
                4.6, once by Gemini 2.5 Flash &mdash; and once to the remaining 852, split evenly
                between the two models. That produced 1,152 administrations across 1,002 personas:
                576 by Claude, 576 by Gemini, 150 shared.
              </p>
              <p>
                Scored profiles were clustered in the 12-dimensional axis space using k-means. Six
                clusters emerged as the silhouette peak across k=6 through k=18. Those six clusters
                were then compared against the twelve hand-crafted archetypes; the comparison
                informed the archetype revision documented on the Archetypes page.
              </p>
            </div>
          </section>

          {/* Section: What this study can support */}
          <section className="mb-10">
            <h2 className="text-[20px] font-serif font-medium text-text-primary mb-3 text-balance">
              What this study can support
            </h2>
            <div className="space-y-4">
              <p>
                The clusters are empirical &mdash; they emerge from the scored axis profiles, not
                from theoretical archetype definitions. Which hand-crafted archetypes survive
                contact with the data, and which get revised, can be asked and answered.
              </p>
              <p>
                The 150 shared personas support model-level comparison: where Claude and Gemini
                agreed, where they diverged, and whether disagreement correlates with persona
                attributes.
              </p>
              <p>
                The tensions &mdash; places where a persona&apos;s forced-choice, scaled, and
                budget responses pull in different directions &mdash; can be located axis by axis
                and cluster by cluster. That tells us something about which axes the instrument
                measures cleanly and which create internal conflict in respondents.
              </p>
            </div>
          </section>

          {/* Section: What this study cannot support */}
          <section className="mb-14">
            <h2 className="text-[20px] font-serif font-medium text-text-primary mb-3 text-balance">
              What this study cannot support
            </h2>
            <div className="space-y-4">
              <p>
                These personas are synthetic. The regional and demographic distributions reflect
                how Gemini was prompted to generate them, not the actual distribution of humans in
                those regions. The cluster shares (16% for C0, 21% for C2, and so on) say
                something about the shape of the 12-axis space as traversed by these specific
                personas &mdash; not about the prevalence of any governance philosophy in the real
                world.
              </p>
              <p>
                Per-country analysis runs into the same limit: most countries have too few personas
                to support inference. Regional aggregates are on firmer ground, but
                &ldquo;firmer&rdquo; here means descriptive of this dataset, not extrapolable to
                the populations behind it.
              </p>
              <p>
                The study can tell us about the instrument. It cannot tell us how real populations
                would answer it.
              </p>
            </div>
          </section>

          {/* Section: Download and explore */}
          <section>
            <h2 className="text-[20px] font-serif font-medium text-text-primary mb-3 text-balance">
              Download and explore
            </h2>
            <div className="space-y-4">
              <p>
                The full dataset is available as a single JSON file:{" "}
                <a
                  href="/data/synthetic_study_v1.json"
                  download
                  className="text-text-secondary underline underline-offset-2 decoration-border-secondary hover:text-text-primary transition-colors duration-150"
                >
                  download the dataset ({fileSizeLabel})
                </a>
                . It contains every persona&apos;s demographic attributes, biographical narrative,
                raw responses from both administering models where applicable, scored axis profile,
                cluster assignment, and nearest-archetype mapping. Three pages go deeper:
              </p>
            </div>

            <nav aria-label="Synthetic study sections" className="mt-6">
              <ol className="space-y-7">
                {DEEP_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group flex items-baseline gap-5"
                    >
                      <span className="text-[14px] text-text-tertiary tabular-nums font-medium shrink-0">
                        {link.number}
                      </span>
                      <span className="flex-1">
                        <span className="flex items-baseline justify-between gap-3">
                          <span className="text-[17px] font-serif font-medium text-text-primary group-hover:underline decoration-border-secondary underline-offset-4">
                            {link.title}
                          </span>
                          <span
                            aria-hidden="true"
                            className="text-text-tertiary group-hover:text-text-secondary transition-colors duration-150 shrink-0"
                          >
                            →
                          </span>
                        </span>
                        <span className="block text-[14px] text-text-secondary leading-relaxed mt-1">
                          {link.description}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            </nav>
          </section>
        </div>
      </article>
    </main>
  );
}
