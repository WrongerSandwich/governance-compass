import Link from "next/link";

const SECTIONS = [
  { id: "formats", label: "Three ways of asking" },
  { id: "scoring", label: "Scoring" },
  { id: "crosscultural", label: "Cross-cultural design" },
  { id: "limitations", label: "Limitations" },
];

export default function MethodologyPage() {
  return (
    <main className="min-h-screen px-4 py-12">
      <article className="mx-auto max-w-2xl">
        <p className="text-[11px] uppercase tracking-[0.08em] text-text-tertiary font-medium mb-1">
          Methodology
        </p>
        <h1 className="text-[28px] font-serif font-medium text-text-primary leading-tight mb-4">
          How The Governance Compass works
        </h1>

        <nav className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-tertiary mb-8" aria-label="Page sections">
          {SECTIONS.map((s, i) => (
            <span key={s.id}>
              <a href={`#${s.id}`} className="hover:text-text-secondary transition-colors duration-150">{s.label}</a>
              {i < SECTIONS.length - 1 && <span className="ml-3 opacity-30">&middot;</span>}
            </span>
          ))}
        </nav>

        <div className="space-y-10 text-sm text-text-secondary leading-relaxed">
          {/* Section 1 */}
          <section id="formats">
            <h2 className="text-[18px] font-serif font-medium text-text-primary mb-3">
              Three ways of asking
            </h2>
            <div className="space-y-4">
              <p>
                The Governance Compass uses three distinct question formats, each designed to capture something the others can&apos;t.
              </p>
              <p>
                <span className="font-medium text-text-primary">Forced-choice tradeoffs</span>{" "}
                form the backbone of the assessment. Each of the 36 forced-choice items presents two statements representing opposite poles of a single axis. There is no neutral option, no &ldquo;both,&rdquo; and no scale. The respondent chooses which statement comes closer to their view.
              </p>
              <p>
                <span className="font-medium text-text-primary">Nuanced scales</span>{" "}
                complement the forced-choice items by capturing intensity. The 24 scaled items each pose a question with five response options specific to that question &mdash; not generic &ldquo;agree/disagree&rdquo; anchors. The response options themselves communicate the spectrum, making the gradient visible at a glance.
              </p>
              <p>
                <span className="font-medium text-text-primary">The Chancellor&apos;s Budget</span>{" "}
                is a single interactive exercise that captures something no questionnaire can: revealed preferences under scarcity. The respondent allocates 50 points across 7 government ministries &mdash; and there isn&apos;t enough to fund everything well. The resulting allocation often diverges from questionnaire responses, and that divergence is captured in scoring.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section id="scoring">
            <h2 className="text-[18px] font-serif font-medium text-text-primary mb-3">
              How scoring works
            </h2>
            <div className="space-y-4">
              <p>
                Each of the 12 axes produces a final score from -1.0 to +1.0, with 0.0 representing genuine ambivalence or a balanced position. The score is a weighted composite of the three formats: forced-choice responses receive the highest weight, scaled responses capture intensity and nuance, and the budget allocation reveals operational priorities. The exact weights vary by axis depending on how directly the budget maps to each dimension.
              </p>
              <p>
                Some axes receive strong budget signal from two opposing ministries. Others receive partial signal from a single ministry. And some axes have no direct budget mapping at all &mdash; those are scored entirely from the questionnaire formats.
              </p>
              <p>
                One of the instrument&apos;s most distinctive features is its contradiction detection system. After scoring, the algorithm compares each axis&apos;s stated preference (from forced-choice and scaled items) against its revealed preference (from budget allocation). When these diverge significantly, the system flags the discrepancy as a &ldquo;tension.&rdquo; Tensions are reported as informative features, not errors. The tension between what you believe in principle and what you prioritize in practice is often where the most interesting self-knowledge lives.
              </p>
              <p>
                Finally, the 12-axis profile is matched against a set of governance archetype prototypes &mdash; idealized profiles representing coherent governance philosophies. The respondent is assigned to the closest archetype and shown their degree of match, their second-closest archetype, and a description of each archetype&apos;s internal logic and characteristic tensions.
              </p>
              <p>
                Archetypes in the Governance Compass fall into three categories, indicated by a small tag on each archetype: <span className="font-medium text-text-primary">theoretically derived</span> (hand-crafted from comparative political philosophy), <span className="font-medium text-text-primary">refined</span> (hand-crafted, then adjusted using empirical data), and <span className="font-medium text-text-primary">empirical</span> (identified through a synthetic population study and named after the fact). The April 2026 synthetic population study &mdash; in which roughly 1,000 biographical personas, generated by a separate language model, took the full Governance Compass instrument &mdash; surfaced one archetype that was not in the original hand-crafted set and informed refinements to five others. The synthetic study is informative but is not a substitute for empirical validation with real respondents; LLM-generated personas may also under-represent ideologically sharp profiles in favor of narratively conflicted ones.
              </p>
              <p>
                Each archetype&apos;s entry on the{" "}
                <Link href="/archetypes" className="text-text-primary hover:text-text-secondary transition-colors duration-150 underline underline-offset-2 decoration-border-secondary">
                  archetypes page
                </Link>{" "}
                includes a short section describing governance traditions and movements that express the orientation, with links to further reading. These are illustrations, not defining examples &mdash; individual movements rarely align perfectly with any single archetype, and many traditions sit across two or more.
              </p>
            </div>
          </section>

          {/* Section 5 */}
          <section id="crosscultural">
            <h2 className="text-[18px] font-serif font-medium text-text-primary mb-3">
              Designing for cross-cultural portability
            </h2>
            <div className="space-y-4">
              <p>
                No question in the instrument references a specific country, political leader, party, policy by name, constitutional provision, or institutional structure. Concepts that carry specific cultural freight &mdash; &ldquo;liberal,&rdquo; &ldquo;conservative,&rdquo; &ldquo;left,&rdquo; &ldquo;right&rdquo; &mdash; never appear in question text. Each is decomposed into its underlying governance tension.
              </p>
              <p>
                For culturally sensitive items, the instrument uses the portrait method, adapted from Schwartz&apos;s Portrait Values Questionnaire. Rather than asking &ldquo;Do you believe X?&rdquo; the question describes a hypothetical person, giving respondents permission to identify with positions that might feel uncomfortable to endorse directly.
              </p>
              <p>
                Most critically, the instrument includes an axis on legitimacy basis. Including this axis allows the instrument to treat non-democratic governance as a coherent position rather than a failure state.
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section id="limitations">
            <h2 className="text-[18px] font-serif font-medium text-text-primary mb-3">
              Limitations and what comes next
            </h2>
            <div className="space-y-4">
              <p>
                The Governance Compass is a v1 instrument. Its dimensional structure is grounded in political science theory and comparative governance research, but it has not undergone formal psychometric validation. The 12 axes have not been confirmed through exploratory factor analysis on response data. Test-retest reliability has not been measured. Cross-cultural measurement invariance has not been tested.
              </p>
              <p>
                This matters. It means the instrument should be used as a tool for structured self-reflection &mdash; a way to think about your governance philosophy across more dimensions than you&apos;ve probably considered &mdash; not as a scientific diagnostic or a validated psychometric measure.
              </p>
              <p>
                The 12 governance archetypes are interpretive anchors, not statistical categories. Most are theoretically derived from comparative political philosophy; a subset have been refined toward &mdash; or in one case identified directly from &mdash; clusters surfaced in a synthetic population study. As response data from real respondents accumulates, empirically grounded clustering may further refine or replace them.
              </p>
              <p>
                The roadmap toward greater rigor is concrete: internal consistency testing, exploratory factor analysis, test-retest reliability assessment, and ultimately multi-group measurement invariance testing with respondents from diverse cultural contexts.
              </p>
              <p>
                A note on how this was built: the research synthesis, question drafting, scoring design, and methodology content on this site were developed collaboratively with AI tools, with human editorial direction and review throughout. The empirical claims and citations in this document have been editorially reviewed but have not been independently verified by a credentialed psychometrician. This transparency is consistent with the project&apos;s broader commitment to showing its work.
              </p>
              <p>
                The April 2026 synthetic population study had roughly 1,000 biographical personas (generated by Gemini) take the full instrument, with responses collected from Claude and Gemini administering it independently. The resulting clusters informed refinements to five hand-crafted archetypes, surfaced one the original set had missed &mdash; the Popular Egalitarian &mdash; and indicated that two earlier archetypes were better captured as a single type. What this does not do is validate the instrument against actual human responses. Language-model personas reflect their generating model&apos;s priors and tend to under-produce ideologically sharp profiles, which is part of why several archetypes (Free Marketeer, Libertarian Individualist, Authoritarian Traditionalist) did not surface empirically despite being well-attested in real political life. The study is useful for checking internal coherence &mdash; whether the archetype set spans what the instrument measures and whether archetypes overlap in practice &mdash; but does not confirm that any particular archetype is common or correctly drawn in the real world.
              </p>
            </div>
          </section>
        </div>

        <div className="border-t border-border-secondary mt-12 pt-8 text-center">
          <p className="text-sm text-text-secondary mb-4">
            Ready to see where you stand?
          </p>
          <Link
            href="/quiz"
            className="inline-block bg-stone-600 text-white py-3 px-8 rounded-[12px] text-sm font-medium hover:bg-stone-700 transition-colors duration-150"
          >
            Begin the assessment
          </Link>
          <p className="mt-3 text-xs text-text-tertiary">
            or{" "}
            <Link href="/questions" className="hover:text-text-secondary transition-colors duration-150">
              view the complete question bank
            </Link>
          </p>
        </div>
      </article>
    </main>
  );
}
