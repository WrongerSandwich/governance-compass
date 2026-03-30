export default function MethodologyPage() {
  return (
    <main className="min-h-screen px-4 py-12">
      <article className="mx-auto max-w-2xl">
        <p className="text-[11px] uppercase tracking-[0.08em] text-text-tertiary font-medium mb-1">
          Methodology
        </p>
        <h1 className="text-[28px] font-serif font-medium text-text-primary leading-tight mb-8">
          How The Governance Compass works
        </h1>

        <div className="space-y-10 text-sm text-text-secondary leading-relaxed">
          {/* Section 1 */}
          <section>
            <h2 className="text-[18px] font-serif font-medium text-text-primary mb-3">
              Why existing political quizzes fall short
            </h2>
            <div className="space-y-4">
              <p>
                If you&apos;ve ever taken a political quiz online, you&apos;ve probably had the experience of getting a result that felt partially right and partially absurd. You land somewhere on a 2D grid and think: &ldquo;Sure, I&apos;m roughly there on economics, but this completely misses how I feel about surveillance, or immigration, or whether experts or ordinary people should drive policy.&rdquo; The result captures a shadow of your worldview &mdash; recognizable in outline, missing in substance.
              </p>
              <p>
                This isn&apos;t a failure of execution. It&apos;s a failure of architecture. The dominant model for mapping political beliefs &mdash; a two-dimensional plane with an economic axis and a social axis &mdash; was a genuine breakthrough when it emerged. It showed millions of people that politics has more than one dimension, which is a real insight. But two dimensions cannot represent the full space of governance philosophy any more than latitude and longitude can describe the shape of a mountain. You need elevation data. You need contour lines.
              </p>
              <p>
                The problem goes deeper than dimensionality. Nearly every popular political quiz asks you to rate your agreement with a series of statements: &ldquo;Strongly agree, agree, disagree, strongly disagree.&rdquo; This format has a well-documented flaw called acquiescence bias &mdash; the tendency to agree with whatever statement is put in front of you, regardless of content. Research has shown this bias can inflate attitude measurements by up to 50% and in some cases reverse the apparent direction of a person&apos;s beliefs.
              </p>
              <p>
                And then there&apos;s the problem of cultural portability. Most quizzes embed assumptions about Western democratic institutions so deeply that they become invisible to their designers. The word &ldquo;liberal&rdquo; means free-market in Australia and progressive in America. Questions about gun control, healthcare systems, or immigration policy assume specific institutional contexts that billions of people don&apos;t share. A quiz that only works in one political culture isn&apos;t measuring governance philosophy &mdash; it&apos;s measuring where you sit within a particular national debate.
              </p>
              <p>
                None of this means existing quizzes are worthless. The Political Compass introduced the two-axis model to a mass audience. 8values and 9axes expanded the dimensional space. ISideWith made issue-based candidate matching practical. The Pew Research Center&apos;s Political Typology set a gold standard for methodological rigor. The Governance Compass builds on what all of them started &mdash; and tries to address what they left unfinished.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-[18px] font-serif font-medium text-text-primary mb-3">
              Twelve dimensions, not two
            </h2>
            <div className="space-y-4">
              <p>
                Political science has spent decades studying the structure of political ideology, and the research converges on a few key findings. First, there are at minimum two robust, independent dimensions: an economic dimension and a cultural dimension. These two dimensions appear in virtually every major framework &mdash; the Chapel Hill Expert Survey, the World Values Survey, Moral Foundations Theory.
              </p>
              <p>
                But two dimensions are a validated floor, not a ceiling. Populism versus institutional trust has become one of the most important political cleavages globally &mdash; and it&apos;s orthogonal to both the economic and cultural dimensions. Attitudes toward international cooperation versus national sovereignty structure party competition across Europe in ways that the economic axis alone can&apos;t explain. Attitudes toward emerging technology governance are rapidly becoming a structuring political question with no natural home on a traditional left-right spectrum.
              </p>
              <p>
                The Governance Compass measures 12 dimensions organized into four domains: Economic Organization (2 axes), Power and Authority (4 axes), Society and Identity (3 axes), and The State in the World (3 axes). This count reflects a deliberate balance. Fewer axes would sacrifice distinctions that matter. More axes would introduce redundancy and respondent fatigue without adding discriminant validity.
              </p>
              <p>
                For quick visual comparison, the 12 axes are also reduced to two super-dimensions that produce a familiar compass-style plot. But the compass plot is always presented as a simplification &mdash; a concession to shareability, not the real result. The full 12-axis radar chart is the instrument&apos;s primary output.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-[18px] font-serif font-medium text-text-primary mb-3">
              Three ways of asking
            </h2>
            <div className="space-y-4">
              <p>
                The Governance Compass doesn&apos;t just ask more questions than a typical political quiz &mdash; it asks them differently. Three distinct question formats are used, each designed to capture something the others can&apos;t.
              </p>
              <p>
                <span className="font-medium text-text-primary">Forced-choice tradeoffs</span>{" "}
                form the backbone of the assessment. Each of the 36 forced-choice items presents two statements representing opposite poles of a single axis. The respondent must choose which statement comes closer to their view. There is no neutral option, no &ldquo;both,&rdquo; and no scale. This format eliminates acquiescence bias and mirrors how governance actually works: political decisions are almost never about whether something is good or bad in a vacuum. They&apos;re about which competing good to prioritize when you can&apos;t have both.
              </p>
              <p>
                <span className="font-medium text-text-primary">Nuanced scales</span>{" "}
                complement the forced-choice items by capturing intensity. The 36 scaled items each pose a question with five response options specific to that question &mdash; not generic &ldquo;agree/disagree&rdquo; anchors. The response options themselves communicate the spectrum, making the gradient visible at a glance.
              </p>
              <p>
                <span className="font-medium text-text-primary">The Chancellor&apos;s Budget</span>{" "}
                is a single interactive exercise that captures something no questionnaire can: revealed preferences under scarcity. The respondent allocates a fixed national budget across 10 government ministries. There isn&apos;t enough to fully fund everything &mdash; that&apos;s the point. A person who claims to prioritize environmental protection but consistently funds economic growth over ecological transition has revealed something their questionnaire answers obscured.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-[18px] font-serif font-medium text-text-primary mb-3">
              How scoring works
            </h2>
            <div className="space-y-4">
              <p>
                Each of the 12 axes produces a final score from -1.0 to +1.0, with 0.0 representing genuine ambivalence or a balanced position. The score is a weighted composite of the three formats: forced-choice responses receive the highest weight (40%), scaled responses capture intensity and nuance (35%), and the budget allocation reveals operational priorities (25%).
              </p>
              <p>
                The weights vary by axis depending on how directly the budget exercise maps to that axis. Some axes get full budget weighting; others receive their scores entirely from the questionnaire formats.
              </p>
              <p>
                One of the instrument&apos;s most distinctive features is its contradiction detection system. After scoring, the algorithm compares each axis&apos;s stated preference (from forced-choice and scaled items) against its revealed preference (from budget allocation). When these diverge significantly, the system flags the discrepancy as a &ldquo;tension.&rdquo; Tensions are reported as informative features, not errors. The tension between what you believe in principle and what you prioritize in practice is often where the most interesting self-knowledge lives.
              </p>
              <p>
                Finally, the 12-axis profile is matched against a set of governance archetype prototypes &mdash; idealized profiles representing coherent governance philosophies. The respondent is assigned to the closest archetype and shown their degree of match, their second-closest archetype, and a description of each archetype&apos;s internal logic and characteristic tensions.
              </p>
              <p>
                The scoring does not tell you who to vote for. It does not assume any pole of any axis is the correct answer. It shows you where you stand, how consistently you stand there, and what governance tradition your overall profile most resembles.
              </p>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-[18px] font-serif font-medium text-text-primary mb-3">
              Designing for cross-cultural validity
            </h2>
            <div className="space-y-4">
              <p>
                No question in the instrument references a specific country, political leader, party, policy by name, constitutional provision, or institutional structure. Concepts that carry specific cultural freight &mdash; &ldquo;liberal,&rdquo; &ldquo;conservative,&rdquo; &ldquo;left,&rdquo; &ldquo;right&rdquo; &mdash; never appear in question text. Each is decomposed into its underlying governance tension.
              </p>
              <p>
                For culturally sensitive items, the instrument uses the portrait method, adapted from Schwartz&apos;s Portrait Values Questionnaire. Rather than asking &ldquo;Do you believe X?&rdquo; the question describes a hypothetical person, giving respondents permission to identify with positions that might feel uncomfortable to endorse directly.
              </p>
              <p>
                Most critically, the instrument includes an axis that explicitly treats non-democratic governance as a coherent position rather than a failure state. This axis is absent from every other popular political quiz, and its absence is what makes those quizzes Western-centric at a structural level. Including it doesn&apos;t endorse any particular governance model &mdash; it simply measures where people actually stand.
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section>
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
                The roadmap toward greater rigor is concrete: internal consistency testing, exploratory factor analysis, test-retest reliability assessment, and ultimately multi-group measurement invariance testing with respondents from diverse cultural contexts.
              </p>
              <p>
                A note on how this was built: the research synthesis, question drafting, scoring design, and methodology content on this site were developed collaboratively with AI tools, with human editorial direction and review throughout. The empirical claims and citations in this document have been editorially reviewed but have not been independently verified by a credentialed psychometrician. This transparency is consistent with the project&apos;s broader commitment to showing its work.
              </p>
            </div>
          </section>
        </div>
      </article>
    </main>
  );
}
