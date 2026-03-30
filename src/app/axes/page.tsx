import Link from "next/link";
import { DOMAIN_COLORS, type DomainKey } from "@/lib/design-tokens";

const DOMAINS = [
  {
    key: "economic" as const,
    axes: [
      {
        name: "Collective provision \u2194 Market allocation",
        question: "What role should organized society play in determining economic outcomes and ensuring material welfare?",
        poleA: "The collective provision pole holds that organized society bears responsibility for ensuring no one falls below a dignified standard of living. It favors redistribution, public services, and constraints on the accumulation of private economic power \u2014 not out of hostility toward individual achievement, but from the conviction that unregulated markets produce inequalities that are neither efficient nor just. Real-world governance traditions at this pole include Nordic social democracy, postwar European welfare states, and socialist economic planning.",
        poleB: "The market allocation pole holds that voluntary exchange, private ownership, and price signals produce better outcomes than central direction. It favors minimal state intervention in the economy \u2014 not from indifference to poverty, but from the conviction that market mechanisms generate prosperity more reliably than bureaucratic allocation, and that the freedom to keep what you earn is a fundamental right. Real-world governance traditions at this pole include laissez-faire capitalism, free-trade city-states like historical Hong Kong, and supply-side economic policy.",
        note: "This is the single most empirically robust dimension in political science. It appears in every major framework for mapping political ideology and consistently emerges as the primary factor in analyses of political attitudes worldwide.",
      },
      {
        name: "Ecological limits \u2194 Growth imperative",
        question: "Is continuous economic expansion compatible with a finite planet, and should governance prioritize sustainability over prosperity?",
        poleA: "The ecological limits pole holds that there are hard physical boundaries to how much humanity can produce and consume. It argues that governance must prioritize sustainability, sufficiency, and ecological health \u2014 even if this means accepting less material wealth or deliberately reducing aggregate economic output. This isn\u2019t anti-prosperity; it\u2019s the conviction that genuine prosperity requires a livable planet.",
        poleB: "The growth imperative pole holds that economic expansion remains essential for human flourishing and that innovation can decouple prosperity from environmental degradation. It argues that growth is not the enemy of sustainability \u2014 it\u2019s the mechanism that funds clean technology, lifts people out of poverty, and provides the resources to address environmental problems.",
        note: "This axis is independent from Axis 1. A committed socialist and a committed capitalist can both be productivists. A degrowth advocate and a green-technology optimist can both care deeply about the environment but disagree fundamentally about whether limits are necessary.",
      },
    ],
  },
  {
    key: "power" as const,
    axes: [
      {
        name: "Distributed governance \u2194 Centralized governance",
        question: "How should political and administrative power be distributed across geographic and institutional levels?",
        poleA: "The distributed governance pole favors maximum devolution of power \u2014 local autonomy, federated structures, subsidiarity. It holds that the people closest to a problem are best positioned to solve it, and that distant central authorities inevitably produce one-size-fits-all solutions that fit nobody well.",
        poleB: "The centralized governance pole favors a strong national authority that imposes uniform standards across all territory. It holds that consistency, efficiency, and fairness require central coordination \u2014 without it, regions diverge in ways that create inequality and threaten national cohesion.",
        note: "This axis is independent of whether a state is democratic or autocratic. A centralized democracy (like France) and a centralized autocracy sit on the same pole for different reasons.",
      },
      {
        name: "Popular sovereignty \u2194 Institutional authority",
        question: "Should governance be guided primarily by the expressed will of ordinary people, or by the judgment of trained specialists and established institutions?",
        poleA: "The popular sovereignty pole holds that the collective wisdom of ordinary people \u2014 grounded in lived experience, common sense, and practical knowledge \u2014 is a more trustworthy guide to good governance than the theories of credentialed experts. It favors direct participation, referenda, and deep skepticism of elite institutions.",
        poleB: "The institutional authority pole holds that modern governance is too complex for popular intuition. It favors delegation to trained specialists, established bureaucratic institutions, and evidence-based policy processes. Good governance requires knowledge that most citizens don\u2019t have time to acquire.",
        note: "This is the populism-technocracy axis, and it has become one of the most important political cleavages worldwide. Both poles can be democratic.",
      },
      {
        name: "Liberty \u2194 Security",
        question: "When individual freedom and collective safety conflict, which should the state prioritize?",
        poleA: "The liberty pole demands strict limits on state power. It prioritizes individual privacy, freedom of expression, robust constraints on surveillance and policing, and strong constitutional protections against government overreach \u2014 even if these protections occasionally allow threats to go undetected.",
        poleB: "The security pole prioritizes the state\u2019s duty to protect its people. It endorses robust law enforcement, surveillance capabilities, and decisive intervention against threats \u2014 even at the cost of some individual privacy and autonomy. Safety is the precondition for all other freedoms.",
        note: "This is the Hobbesian tradeoff \u2014 one of the oldest and most persistent tensions in political philosophy.",
      },
      {
        name: "Electoral process \u2194 Performance outcomes",
        question: "Does a government\u2019s legitimacy come primarily from how it was chosen, or from what it delivers?",
        poleA: "The electoral process pole holds that a government\u2019s right to govern derives from the free consent of the governed. Elections, rule of law, peaceful transfer of power, and institutional accountability are not just useful mechanisms \u2014 they are the source of legitimate authority.",
        poleB: "The performance outcomes pole holds that a government\u2019s right to govern derives from results. A government that delivers sustained prosperity, personal safety, effective public services, and national dignity has earned its authority \u2014 regardless of how its leaders were selected.",
        note: "This axis is absent from every other popular political quiz. Its absence is what makes most political assessments structurally Western-centric. Including it doesn\u2019t endorse any particular governance model \u2014 it simply measures where people actually stand.",
      },
    ],
  },
  {
    key: "society" as const,
    axes: [
      {
        name: "Progressive change \u2194 Continuity and tradition",
        question: "Should a society actively reform its inherited norms and institutions, or preserve them as sources of stability and meaning?",
        poleA: "The progressive change pole holds that inherited customs, hierarchies, and institutions should be continuously re-examined in light of new knowledge and evolving moral understanding. Social progress is real \u2014 moral knowledge advances, just as scientific knowledge does \u2014 and institutions should advance with it.",
        poleB: "The continuity and tradition pole holds that inherited institutions represent the accumulated practical wisdom of generations who faced real challenges. They were not designed by theory; they were tested by survival. Discarding them because they conflict with contemporary intellectual fashion is arrogant and dangerous.",
        note: "This is the second of the two empirically robust \u201Csuper-dimensions\u201D in political science. It\u2019s also the axis where people are most likely to feel their position is obviously correct and the other pole is obviously wrong.",
      },
      {
        name: "Pluralism \u2194 Cohesion",
        question: "When a society contains diverse groups, should the state protect that diversity or cultivate a unified identity?",
        poleA: "The pluralism pole views a society with many distinct cultural traditions, languages, and ways of life as inherently richer and more resilient. It argues that the state should actively protect and accommodate this diversity.",
        poleB: "The cohesion pole holds that a functional society requires a shared language, a shared set of civic values, and a shared cultural identity. Without it, society fractures along group lines into mutual incomprehension and sectarian competition.",
        note: "Both poles believe they\u2019re describing the conditions for a stable, flourishing society. They disagree about whether diversity or unity is the more important ingredient. Canada\u2019s official multiculturalism sits at one end; France\u2019s la\u00EFcit\u00E9 and civic universalism sit at the other.",
      },
      {
        name: "Constructivism \u2194 Essentialism",
        question: "Are human behavior and social hierarchies primarily shaped by culture and institutions, or by durable features of human nature?",
        poleA: "The constructivism pole holds that most of what we call \u201Chuman nature\u201D is primarily the product of culture, upbringing, and institutional design. If these are constructed, they can be reconstructed. Change the structures, and you change the outcomes.",
        poleB: "The essentialism pole holds that human beings have a durable nature shaped by biology, evolutionary history, or divine design. Social structures that ignore this nature will fail, because they are fighting against something more fundamental than policy.",
        note: "This is the deepest and most philosophical axis in the instrument. It sits underneath many of the other axes \u2014 your position here influences how you think about economic inequality, social change, and group outcomes.",
      },
    ],
  },
  {
    key: "world" as const,
    axes: [
      {
        name: "Internationalism \u2194 Sovereignty",
        question: "Should the state participate deeply in international cooperation, or prioritize its own independence and self-determination?",
        poleA: "The internationalism pole holds that the most serious challenges facing humanity \u2014 climate change, pandemics, economic instability \u2014 cannot be solved by any single nation acting alone. States must be willing to pool sovereignty and accept binding international agreements.",
        poleB: "The sovereignty pole holds that a nation\u2019s first duty is to its own citizens, and that binding international agreements inevitably transfer decision-making power to distant institutions that are not accountable to the people they affect.",
        note: "The genuine tension is real: international cooperation requires giving up some self-determination, and national sovereignty requires accepting that some global problems go unsolved.",
      },
      {
        name: "Non-interventionism \u2194 Interventionism",
        question: "Should the state project military force abroad, or commit to strict non-intervention?",
        poleA: "The non-interventionism pole holds that military force \u2014 even when used with good intentions \u2014 almost always causes more suffering than it prevents. A nation should maintain only enough military capability for self-defense.",
        poleB: "The interventionism pole holds that military strength and the credible willingness to use it are essential tools of statecraft. Defending allies, deterring aggression, and stopping atrocities are legitimate uses of military power.",
        note: "This axis is independent from Axis 10. A nation can be deeply engaged in international institutions while opposing military intervention, or sovereignty-focused while maintaining a powerful military.",
      },
      {
        name: "Precautionary \u2194 Innovation-first",
        question: "When powerful new technologies carry uncertain risks, should the state restrict them until proven safe, or permit them until proven harmful?",
        poleA: "The precautionary pole holds that when a powerful technology carries uncertain risks \u2014 particularly risks that could be catastrophic or irreversible \u2014 it should not be deployed at scale until those risks are well understood. The burden of proof falls on innovators to demonstrate safety.",
        poleB: "The innovation-first pole holds that technological progress is humanity\u2019s most powerful tool for solving problems, and that excessive caution has costs too. Every year a beneficial technology is held back is a year its benefits are denied. The burden of proof should fall on those who want to restrict.",
        note: "This axis becomes more important with every passing year. AI governance, genetic engineering, autonomous weapons, synthetic biology \u2014 all domains where the precautionary/innovation tension is the primary structuring question.",
      },
    ],
  },
];

export default function AxesPage() {
  return (
    <main className="min-h-screen px-4 py-12">
      <article className="mx-auto max-w-2xl">
        <p className="text-[11px] uppercase tracking-[0.08em] text-text-tertiary font-medium mb-1">
          Reference
        </p>
        <h1 className="text-[28px] font-serif font-medium text-text-primary leading-tight mb-3">
          The twelve axes
        </h1>
        <p className="text-sm text-text-secondary leading-relaxed mb-4">
          The Governance Compass measures your political philosophy across twelve independent dimensions, organized into four domains. Each axis represents a genuine tension in how human societies can be organized &mdash; not a right answer and a wrong answer, but two defensible priorities that pull in different directions.
        </p>

        <nav className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-tertiary mb-10" aria-label="Domain sections">
          {(["economic", "power", "society", "world"] as DomainKey[]).map((key, i) => (
            <span key={key}>
              <a
                href={`#${key}`}
                className="hover:text-text-secondary transition-colors duration-150"
                style={{ color: DOMAIN_COLORS[key][600] }}
              >
                {DOMAIN_COLORS[key].name}
              </a>
              {i < 3 && <span className="ml-3 opacity-30">&middot;</span>}
            </span>
          ))}
        </nav>

        <div className="space-y-12">
          {DOMAINS.map((domain) => (
            <section key={domain.key} id={domain.key}>
              <h2
                className="text-[11px] uppercase tracking-[0.08em] font-medium border-b border-border-secondary pb-1.5 mb-6"
                style={{ color: DOMAIN_COLORS[domain.key][600] }}
              >
                {DOMAIN_COLORS[domain.key].name}
              </h2>

              <div className="space-y-10">
                {domain.axes.map((axis) => (
                  <div key={axis.name}>
                    <h3 className="text-[17px] font-serif font-medium text-text-primary mb-1">
                      {axis.name}
                    </h3>
                    <p className="text-xs font-serif italic text-text-tertiary mb-4">
                      {axis.question}
                    </p>
                    <div className="space-y-3 text-sm text-text-secondary leading-relaxed">
                      <p>{axis.poleA}</p>
                      <p>{axis.poleB}</p>
                      {axis.note && (
                        <p className="text-xs text-text-tertiary leading-relaxed border-l-2 border-border-secondary pl-3">
                          {axis.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="border-t border-border-secondary mt-12 pt-6">
          <p className="text-xs text-text-tertiary leading-relaxed mb-8">
            No axis has a correct answer. The value of The Governance Compass is not in telling you which pole is right &mdash; it&apos;s in showing you where you stand across all twelve, where your commitments are strong, where you&apos;re genuinely ambivalent, and where your positions connect to each other in ways you might not have expected.
          </p>
          <div className="text-center">
            <Link
              href="/quiz"
              className="inline-block bg-stone-600 text-white py-3 px-8 rounded-[12px] text-sm font-medium hover:bg-stone-700 transition-colors duration-150"
            >
              Take the assessment
            </Link>
            <p className="mt-3 text-xs text-text-tertiary">
              or{" "}
              <Link href="/methodology" className="hover:text-text-secondary transition-colors duration-150">
                read the methodology
              </Link>
            </p>
          </div>
        </div>
      </article>
    </main>
  );
}
