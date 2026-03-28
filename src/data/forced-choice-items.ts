export interface ForcedChoiceItemData {
  id: string;
  axisId: number;
  itemNumber: number;
  questionType: "FC" | "PT";
  abstractionLevel: "P" | "I" | "S";
  statementA: string;
  statementB: string;
}

export const forcedChoiceItems: ForcedChoiceItemData[] = [
  // --- AXIS 1: Economic Model ---
  {
    id: "fc-1-1",
    axisId: 1,
    itemNumber: 1,
    questionType: "FC",
    abstractionLevel: "P",
    statementA:
      "A just society guarantees that no person falls below a dignified standard of living — even if this requires substantial redistribution from those who have more to those who have less.",
    statementB:
      "A just society protects each person's right to keep what they earn and exchange freely — even if this means some people will have far more than others and some will struggle.",
  },
  {
    id: "fc-1-2",
    axisId: 1,
    itemNumber: 2,
    questionType: "FC",
    abstractionLevel: "I",
    statementA:
      "The state should directly provide essential services — healthcare, housing, education — as universal public goods funded through taxation, because markets will always leave some people behind.",
    statementB:
      "Essential services are delivered more effectively when individuals choose among competing private providers — the state's role should be limited to helping those who truly cannot help themselves.",
  },
  {
    id: "fc-1-3",
    axisId: 1,
    itemNumber: 3,
    questionType: "FC",
    abstractionLevel: "S",
    statementA:
      "When a major industry fails and thousands face unemployment, the state should intervene — nationalizing the industry if necessary — to protect workers and communities from devastation.",
    statementB:
      "When a major industry fails, the state should allow it to fail — propping up unviable enterprises with public funds delays necessary adaptation and wastes resources that could be better used elsewhere.",
  },

  // --- AXIS 2: Environmental Policy ---
  {
    id: "fc-2-1",
    axisId: 2,
    itemNumber: 1,
    questionType: "FC",
    abstractionLevel: "P",
    statementA:
      "There are hard physical limits to how much humanity can produce and consume — a responsible society must learn to thrive within ecological boundaries, even if this means accepting less material wealth.",
    statementB:
      "Human ingenuity has always found ways to do more with less — the path to sustainability runs through innovation and growth, not through accepting scarcity and reduced living standards.",
  },
  {
    id: "fc-2-2",
    axisId: 2,
    itemNumber: 2,
    questionType: "FC",
    abstractionLevel: "I",
    statementA:
      "Economic policy should be evaluated primarily by whether it maintains or restores ecological health — GDP growth is a misleading measure of genuine societal progress.",
    statementB:
      "Economic growth remains the most reliable way to fund environmental protection, lift people out of poverty, and develop the clean technologies the planet needs — shrinking the economy would make every problem harder to solve.",
  },
  {
    id: "fc-2-3",
    axisId: 2,
    itemNumber: 3,
    questionType: "FC",
    abstractionLevel: "S",
    statementA:
      "If a nation's primary export industry is profitable but ecologically destructive, the government should phase it out over a defined timeline — even if no replacement industry is yet available — because continued environmental damage will ultimately cost more than the economic disruption.",
    statementB:
      "If a nation's primary export industry is profitable but ecologically destructive, the government should invest heavily in making that industry cleaner rather than shutting it down — abrupt economic disruption harms the very people environmentalism claims to protect.",
  },

  // --- AXIS 3: Governance Structure ---
  {
    id: "fc-3-1",
    axisId: 3,
    itemNumber: 1,
    questionType: "FC",
    abstractionLevel: "P",
    statementA:
      "The people closest to a problem are best positioned to solve it — governance should be as local as possible, with power flowing upward only when absolutely necessary.",
    statementB:
      "Local governance produces inconsistency, duplication, and inequality between regions — a strong central authority ensures that standards are uniform and resources are allocated where they're most needed.",
  },
  {
    id: "fc-3-2",
    axisId: 3,
    itemNumber: 2,
    questionType: "FC",
    abstractionLevel: "I",
    statementA:
      "Different regions within a nation should have the authority to set their own laws on most domestic matters — even if this means neighboring regions have very different rules on the same issues.",
    statementB:
      "A nation's laws should be uniform across all its territory — allowing regions to diverge creates confusion, inequality, and undermines national identity.",
  },
  {
    id: "fc-3-3",
    axisId: 3,
    itemNumber: 3,
    questionType: "FC",
    abstractionLevel: "S",
    statementA:
      "When a national government and a local community disagree about how land should be used — for example, whether to build infrastructure that benefits the nation but disrupts the community — the local community's wishes should prevail.",
    statementB:
      "When a national government and a local community disagree about land use, the national interest should prevail — individual communities cannot be allowed to block projects that benefit the broader population.",
  },

  // --- AXIS 4: Decision Authority ---
  {
    id: "fc-4-1",
    axisId: 4,
    itemNumber: 1,
    questionType: "FC",
    abstractionLevel: "P",
    statementA:
      "The collective wisdom of ordinary people — grounded in lived experience and common sense — is a more trustworthy guide to good governance than the theories of credentialed experts, who are often disconnected from the realities most people face.",
    statementB:
      "The challenges of modern governance are too complex for popular intuition alone — societies are better served when policy is shaped by people with deep specialized knowledge, even when their conclusions are unpopular.",
  },
  {
    id: "fc-4-2",
    axisId: 4,
    itemNumber: 2,
    questionType: "FC",
    abstractionLevel: "I",
    statementA:
      "Major policy decisions should be put directly to the population through referenda and public votes whenever possible — elected representatives and bureaucrats should implement the people's will, not substitute their own judgment.",
    statementB:
      "Major policy decisions should be made by elected representatives advised by subject-matter experts — direct popular votes on complex technical issues produce worse outcomes than informed deliberation.",
  },
  {
    id: "fc-4-3",
    axisId: 4,
    itemNumber: 3,
    questionType: "FC",
    abstractionLevel: "S",
    statementA:
      "When scientific consensus on a policy issue contradicts strongly held public opinion, the government should follow public opinion — in a society that serves its people, the people's values must take precedence over any expert recommendation.",
    statementB:
      "When scientific consensus on a policy issue contradicts strongly held public opinion, the government should follow the science — governing well sometimes means making decisions that are unpopular because they are correct.",
  },

  // --- AXIS 5: Rights Balance ---
  {
    id: "fc-5-1",
    axisId: 5,
    itemNumber: 1,
    questionType: "FC",
    abstractionLevel: "P",
    statementA:
      "It is better that some genuinely dangerous individuals go undetected than that the state acquires the power to monitor the private lives of ordinary people.",
    statementB:
      "It is better that ordinary people sacrifice some privacy than that genuinely dangerous individuals remain free to cause catastrophic harm.",
  },
  {
    id: "fc-5-2",
    axisId: 5,
    itemNumber: 2,
    questionType: "FC",
    abstractionLevel: "I",
    statementA:
      "Constitutional protections for individual rights — speech, privacy, assembly, due process — should be nearly absolute, even during emergencies. A state that suspends rights under pressure will always find new reasons to keep them suspended.",
    statementB:
      "Constitutional protections must be balanced against the state's duty to protect its people. During genuine crises, temporary restrictions on individual rights are not only acceptable but necessary — a state that cannot act decisively when threatened will not survive to protect anyone's rights.",
  },
  {
    id: "fc-5-3",
    axisId: 5,
    itemNumber: 3,
    questionType: "FC",
    abstractionLevel: "S",
    statementA:
      "If intelligence agencies report that broad surveillance of digital communications could prevent rare but devastating attacks, the government should refuse — the certainty of mass privacy violation outweighs the possibility of preventing harm.",
    statementB:
      "If intelligence agencies report that broad surveillance of digital communications could prevent rare but devastating attacks, the government should authorize it — the duty to prevent catastrophic loss of life outweighs the cost to individual privacy.",
  },

  // --- AXIS 6: Legitimacy Basis ---
  {
    id: "fc-6-1",
    axisId: 6,
    itemNumber: 1,
    questionType: "PT",
    abstractionLevel: "P",
    statementA:
      "Person A believes that a government's right to govern comes from the free choice of the people — a government that was not chosen through fair, competitive elections is never fully legitimate, no matter how well it performs.",
    statementB:
      "Person B believes that a government's right to govern comes from results — a government that delivers prosperity, safety, and effective services is legitimate regardless of how its leaders were selected.",
  },
  {
    id: "fc-6-2",
    axisId: 6,
    itemNumber: 2,
    questionType: "FC",
    abstractionLevel: "I",
    statementA:
      "A society should always maintain competitive elections, independent courts, and free press — even when these institutions slow decision-making and sometimes produce poor leaders — because the process of choosing is more important than the quality of who is chosen.",
    statementB:
      "A society should be structured to identify and empower the most capable leaders — even if this means limiting electoral competition — because the quality of governance matters more than the method of selecting governors.",
  },
  {
    id: "fc-6-3",
    axisId: 6,
    itemNumber: 3,
    questionType: "FC",
    abstractionLevel: "S",
    statementA:
      "A freely elected government that presides over economic decline, rising crime, and deteriorating public services is still more legitimate than an unelected government that delivers prosperity and safety — because legitimacy is about consent, not outcomes.",
    statementB:
      "An unelected government that delivers prosperity, safety, and effective services has earned more practical legitimacy than an elected government that has failed to govern well — because people need good governance more than they need to have chosen their governors.",
  },

  // --- AXIS 7: Social Change ---
  {
    id: "fc-7-1",
    axisId: 7,
    itemNumber: 1,
    questionType: "FC",
    abstractionLevel: "P",
    statementA:
      "Inherited customs, hierarchies, and institutions should be continuously re-examined in light of new knowledge and evolving moral understanding — what was once accepted is not automatically worth preserving.",
    statementB:
      "Inherited customs, hierarchies, and institutions represent the accumulated wisdom of generations who faced real challenges — they should not be discarded simply because they conflict with contemporary fashions in thought.",
  },
  {
    id: "fc-7-2",
    axisId: 7,
    itemNumber: 2,
    questionType: "FC",
    abstractionLevel: "I",
    statementA:
      "Laws and social norms should evolve as society's understanding evolves — when evidence shows that an established practice causes unnecessary harm or exclusion, the state has an obligation to change it.",
    statementB:
      "Laws and social norms should change slowly and cautiously — rapid reform driven by intellectual movements risks destroying functional social structures before their value is understood, causing more harm than it prevents.",
  },
  {
    id: "fc-7-3",
    axisId: 7,
    itemNumber: 3,
    questionType: "FC",
    abstractionLevel: "S",
    statementA:
      "When a longstanding cultural practice comes into conflict with principles of individual equality and autonomy, the practice should give way — no tradition justifies the restriction of a person's fundamental rights.",
    statementB:
      "When a longstanding cultural practice comes into conflict with contemporary notions of equality, society should proceed with great caution — the practice may serve social functions that are not immediately visible, and imposing abstract principles on living communities often backfires.",
  },

  // --- AXIS 8: Cultural Diversity ---
  {
    id: "fc-8-1",
    axisId: 8,
    itemNumber: 1,
    questionType: "FC",
    abstractionLevel: "P",
    statementA:
      "A society is strengthened by containing many distinct cultural traditions, languages, and ways of life — the state should actively protect and accommodate this diversity rather than pressing everyone toward a single mold.",
    statementB:
      "A society functions best when its members share a common language, set of civic values, and cultural reference points — the state should cultivate shared identity rather than institutionalizing permanent division along group lines.",
  },
  {
    id: "fc-8-2",
    axisId: 8,
    itemNumber: 2,
    questionType: "FC",
    abstractionLevel: "I",
    statementA:
      "The state should provide public services in multiple languages, recognize diverse cultural practices in law, and ensure that all cultural communities can maintain their distinct identities while participating fully in civic life.",
    statementB:
      "The state should establish a common civic culture and expect all residents to learn the shared language and adopt shared civic norms — public institutions should unite people around what they have in common, not formalize their differences.",
  },
  {
    id: "fc-8-3",
    axisId: 8,
    itemNumber: 3,
    questionType: "PT",
    abstractionLevel: "S",
    statementA:
      "Person A believes that when immigrants arrive in a new country, the receiving society should adapt to include them — making space for their languages, traditions, and cultural practices in schools, workplaces, and public life.",
    statementB:
      "Person B believes that when immigrants arrive in a new country, they should make the primary effort to adapt — learning the common language, adopting local civic norms, and integrating into the existing cultural fabric.",
  },

  // --- AXIS 9: Human Nature ---
  {
    id: "fc-9-1",
    axisId: 9,
    itemNumber: 1,
    questionType: "FC",
    abstractionLevel: "P",
    statementA:
      "Most of what we consider \"human nature\" — including differences in behavior between groups — is shaped by culture, upbringing, and social structures. Change the structures, and you change the outcomes.",
    statementB:
      "Human beings have a durable nature shaped by biology and deep history. Social structures that ignore this nature — however well-intentioned — will fail, because they are fighting against something more fundamental than policy.",
  },
  {
    id: "fc-9-2",
    axisId: 9,
    itemNumber: 2,
    questionType: "FC",
    abstractionLevel: "I",
    statementA:
      "When certain groups are persistently underrepresented in positions of power or prosperity, the most likely explanation is structural barriers that policy should actively dismantle — the goal of governance should be to equalize outcomes.",
    statementB:
      "When certain groups achieve different outcomes, this may reflect genuine differences in preferences, aptitudes, or cultural priorities rather than structural barriers — the goal of governance should be to equalize access and opportunity, then accept the outcomes that emerge.",
  },
  {
    id: "fc-9-3",
    axisId: 9,
    itemNumber: 3,
    questionType: "FC",
    abstractionLevel: "S",
    statementA:
      "A well-designed education system can dramatically reshape society within a generation — if children are raised in the right environment with the right values, most social problems can be solved.",
    statementB:
      "Education can improve individual lives, but it cannot fundamentally reshape human nature or eliminate all social problems — expecting schools to engineer a new kind of person places an impossible burden on them and ignores deeper realities.",
  },

  // --- AXIS 10: International Engagement ---
  {
    id: "fc-10-1",
    axisId: 10,
    itemNumber: 1,
    questionType: "FC",
    abstractionLevel: "P",
    statementA:
      "The most serious challenges facing humanity — climate change, pandemics, economic instability — cannot be solved by any single nation. States must be willing to pool sovereignty and accept binding international agreements, even when those agreements impose costs.",
    statementB:
      "A nation's first duty is to its own citizens, and binding international agreements inevitably transfer power to distant institutions that are not accountable to the people they affect. Cooperation is valuable, but sovereignty must not be compromised.",
  },
  {
    id: "fc-10-2",
    axisId: 10,
    itemNumber: 2,
    questionType: "FC",
    abstractionLevel: "I",
    statementA:
      "International courts, trade organizations, and cooperative bodies should have real authority to enforce agreements and resolve disputes between nations — without enforcement mechanisms, international cooperation is meaningless.",
    statementB:
      "International bodies should serve as forums for negotiation and coordination, but should never have binding authority over sovereign nations — enforcement power that supersedes national law is a threat to self-determination.",
  },
  {
    id: "fc-10-3",
    axisId: 10,
    itemNumber: 3,
    questionType: "FC",
    abstractionLevel: "S",
    statementA:
      "If an international climate agreement requires your nation to make economic sacrifices that other nations are not required to make — because your nation historically contributed more to the problem — your government should accept those terms as a matter of global responsibility.",
    statementB:
      "If an international climate agreement imposes disproportionate costs on your nation, your government should reject those terms and negotiate for equal treatment — accepting unequal burdens sets a precedent that undermines national interests.",
  },

  // --- AXIS 11: Military Policy ---
  {
    id: "fc-11-1",
    axisId: 11,
    itemNumber: 1,
    questionType: "FC",
    abstractionLevel: "P",
    statementA:
      "Military force — even when used with good intentions — almost always causes more suffering than it prevents. The history of foreign intervention is overwhelmingly a history of unintended consequences, civilian casualties, and prolonged instability.",
    statementB:
      "Military strength and the credible willingness to use it are essential to maintaining peace and deterring aggression. A world where aggressive states face no consequences is more dangerous than one where capable nations enforce a baseline of order.",
  },
  {
    id: "fc-11-2",
    axisId: 11,
    itemNumber: 2,
    questionType: "FC",
    abstractionLevel: "I",
    statementA:
      "A nation should maintain only the military capacity needed for self-defense and should never deploy forces beyond its own borders — foreign conflicts are not its responsibility.",
    statementB:
      "A capable nation has both the right and the obligation to maintain military forces that can be projected abroad — to defend allies, protect shipping routes, deter aggression, and uphold international norms.",
  },
  {
    id: "fc-11-3",
    axisId: 11,
    itemNumber: 3,
    questionType: "FC",
    abstractionLevel: "S",
    statementA:
      "When a foreign government is committing atrocities against its own civilians, other nations should respond through diplomacy, sanctions, and humanitarian aid — military intervention, even to stop atrocities, violates sovereignty and historically creates more problems than it solves.",
    statementB:
      "When a foreign government is committing atrocities against its own civilians, capable nations have a moral obligation to intervene militarily if diplomacy fails — sovereignty does not include the right to massacre your own people.",
  },

  // --- AXIS 12: Technology Governance ---
  {
    id: "fc-12-1",
    axisId: 12,
    itemNumber: 1,
    questionType: "FC",
    abstractionLevel: "P",
    statementA:
      "When a powerful new technology carries uncertain risks, it should not be deployed at scale until those risks are well understood — some harms, once done, cannot be undone, and caution is the only responsible default.",
    statementB:
      "When a powerful new technology could produce enormous benefits but carries uncertain risks, society should move forward and correct problems as they emerge — excessive caution has costs too, and delay itself causes suffering by withholding solutions to known problems.",
  },
  {
    id: "fc-12-2",
    axisId: 12,
    itemNumber: 2,
    questionType: "FC",
    abstractionLevel: "I",
    statementA:
      "The burden of proof should fall on those who develop powerful new technologies — they must demonstrate safety before deployment, just as pharmaceutical companies must prove drugs are safe before they reach patients.",
    statementB:
      "The burden of proof should fall on those who want to restrict new technologies — innovation should proceed by default, and regulation should respond to demonstrated harms rather than hypothetical ones.",
  },
  {
    id: "fc-12-3",
    axisId: 12,
    itemNumber: 3,
    questionType: "FC",
    abstractionLevel: "S",
    statementA:
      "If an AI system could dramatically improve government decision-making but its internal reasoning is not fully explainable, the government should not deploy it — decisions affecting people's lives must be made through processes that can be understood and challenged.",
    statementB:
      "If an AI system could dramatically improve government decision-making, the government should deploy it even if its reasoning isn't fully explainable — the quality of outcomes matters more than whether the process is transparent, especially if the alternative is worse human decision-making.",
  },
];
