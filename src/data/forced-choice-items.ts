export interface ForcedChoiceItemData {
  id: string;
  axisId: number;
  itemNumber: number;
  questionType: "FC" | "PT";
  abstractionLevel: "P" | "I" | "S";
  headlineA: string;
  bodyA: string;
  headlineB: string;
  bodyB: string;
}

export const forcedChoiceItems: ForcedChoiceItemData[] = [
  // --- AXIS 1: Economic Model ---
  {
    id: "fc-1-1",
    axisId: 1,
    itemNumber: 1,
    questionType: "FC",
    abstractionLevel: "P",
    headlineA:
      "No one should fall below a dignified standard of living",
    bodyA:
      "Even if this requires substantial redistribution from those who have more to those who have less.",
    headlineB:
      "People should keep what they earn and exchange freely",
    bodyB:
      "Even if this means some people will have far more than others and some will struggle.",
  },
  {
    id: "fc-1-2",
    axisId: 1,
    itemNumber: 2,
    questionType: "FC",
    abstractionLevel: "I",
    headlineA:
      "The state should provide essential services as universal public goods",
    bodyA:
      "Healthcare, housing, and education funded through taxation — because markets will always leave some people behind.",
    headlineB:
      "Essential services work better through competing private providers",
    bodyB:
      "The state's role should be limited to helping those who truly cannot help themselves.",
  },
  {
    id: "fc-1-3",
    axisId: 1,
    itemNumber: 3,
    questionType: "FC",
    abstractionLevel: "S",
    headlineA:
      "When an industry fails, the state should intervene to protect workers",
    bodyA:
      "Nationalizing the industry if necessary to protect workers and communities from devastation.",
    headlineB:
      "When an industry fails, the state should let it fail",
    bodyB:
      "Propping up unviable enterprises delays necessary adaptation and wastes resources.",
  },

  // --- AXIS 2: Environmental Policy ---
  {
    id: "fc-2-1",
    axisId: 2,
    itemNumber: 1,
    questionType: "FC",
    abstractionLevel: "P",
    headlineA:
      "There are hard limits to how much humanity can produce and consume",
    bodyA:
      "A responsible society must learn to thrive within ecological boundaries, even if this means less material wealth.",
    headlineB:
      "Human ingenuity always finds ways to do more with less",
    bodyB:
      "The path to sustainability runs through innovation and growth, not through accepting scarcity.",
  },
  {
    id: "fc-2-2",
    axisId: 2,
    itemNumber: 2,
    questionType: "FC",
    abstractionLevel: "I",
    headlineA:
      "GDP growth is a misleading measure of genuine progress",
    bodyA:
      "Economic policy should be evaluated primarily by whether it maintains or restores ecological health.",
    headlineB:
      "Economic growth is the most reliable way to fund environmental protection",
    bodyB:
      "Shrinking the economy would make every problem — including environmental ones — harder to solve.",
  },
  {
    id: "fc-2-3",
    axisId: 2,
    itemNumber: 3,
    questionType: "FC",
    abstractionLevel: "S",
    headlineA:
      "Phase out a profitable but destructive industry, even without a replacement",
    bodyA:
      "Continued environmental damage will ultimately cost more than the economic disruption of transition.",
    headlineB:
      "Invest in making a destructive industry cleaner rather than shutting it down",
    bodyB:
      "Abrupt economic disruption harms the very people environmentalism claims to protect.",
  },

  // --- AXIS 3: Governance Structure ---
  {
    id: "fc-3-1",
    axisId: 3,
    itemNumber: 1,
    questionType: "FC",
    abstractionLevel: "P",
    headlineA:
      "The people closest to a problem are best positioned to solve it",
    bodyA:
      "Governance should be as local as possible, with power flowing upward only when absolutely necessary.",
    headlineB:
      "A strong central authority ensures uniform standards and fairness",
    bodyB:
      "Local governance produces inconsistency, duplication, and inequality between regions.",
  },
  {
    id: "fc-3-2",
    axisId: 3,
    itemNumber: 2,
    questionType: "FC",
    abstractionLevel: "I",
    headlineA:
      "Different regions should be free to set their own laws on most matters",
    bodyA:
      "Even if this means neighboring regions have very different rules on the same issues.",
    headlineB:
      "A nation's laws should be uniform across all its territory",
    bodyB:
      "Allowing regions to diverge creates confusion, inequality, and undermines national identity.",
  },
  {
    id: "fc-3-3",
    axisId: 3,
    itemNumber: 3,
    questionType: "FC",
    abstractionLevel: "S",
    headlineA:
      "When a community and the national government disagree, the community should prevail",
    bodyA:
      "For example, blocking infrastructure that benefits the nation but disrupts the local community.",
    headlineB:
      "When a community and the national government disagree, the nation should prevail",
    bodyB:
      "Individual communities cannot be allowed to block projects that benefit the broader population.",
  },

  // --- AXIS 4: Decision Authority ---
  {
    id: "fc-4-1",
    axisId: 4,
    itemNumber: 1,
    questionType: "FC",
    abstractionLevel: "P",
    headlineA:
      "The collective wisdom of ordinary people is the most trustworthy guide",
    bodyA:
      "Lived experience and common sense outweigh the theories of credentialed experts who are often disconnected from reality.",
    headlineB:
      "Modern governance is too complex for popular intuition alone",
    bodyB:
      "Societies are better served when policy is shaped by people with deep specialized knowledge, even when their conclusions are unpopular.",
  },
  {
    id: "fc-4-2",
    axisId: 4,
    itemNumber: 2,
    questionType: "FC",
    abstractionLevel: "I",
    headlineA:
      "Major decisions should be put directly to the population through referenda",
    bodyA:
      "Elected officials and bureaucrats should implement the people's will, not substitute their own judgment.",
    headlineB:
      "Major decisions should be made by representatives advised by experts",
    bodyB:
      "Direct popular votes on complex technical issues produce worse outcomes than informed deliberation.",
  },
  {
    id: "fc-4-3",
    axisId: 4,
    itemNumber: 3,
    questionType: "FC",
    abstractionLevel: "S",
    headlineA:
      "When science and public opinion conflict, follow the public",
    bodyA:
      "In a society that serves its people, the people's values must take precedence over any expert recommendation.",
    headlineB:
      "When science and public opinion conflict, follow the science",
    bodyB:
      "Governing well sometimes means making decisions that are unpopular because they are correct.",
  },

  // --- AXIS 5: Rights Balance ---
  {
    id: "fc-5-1",
    axisId: 5,
    itemNumber: 1,
    questionType: "FC",
    abstractionLevel: "P",
    headlineA:
      "Better that some threats go undetected",
    bodyA:
      "Protecting ordinary people's privacy is more important than giving the state the power to catch every dangerous individual.",
    headlineB:
      "Better that people sacrifice some privacy",
    bodyB:
      "Preventing catastrophic harm is more important than preserving the absolute privacy of every individual's communications.",
  },
  {
    id: "fc-5-2",
    axisId: 5,
    itemNumber: 2,
    questionType: "FC",
    abstractionLevel: "I",
    headlineA:
      "Constitutional rights should be nearly absolute, even during emergencies",
    bodyA:
      "A state that suspends rights under pressure will always find new reasons to keep them suspended.",
    headlineB:
      "Constitutional rights must be balanced against the duty to protect",
    bodyB:
      "A state that cannot act decisively when threatened will not survive to protect anyone's rights.",
  },
  {
    id: "fc-5-3",
    axisId: 5,
    itemNumber: 3,
    questionType: "FC",
    abstractionLevel: "S",
    headlineA:
      "Refuse broad surveillance even if it could prevent rare catastrophic attacks",
    bodyA:
      "The certainty of mass privacy violation outweighs the possibility of preventing harm.",
    headlineB:
      "Authorize broad surveillance if it could prevent rare catastrophic attacks",
    bodyB:
      "The duty to prevent catastrophic loss of life outweighs the cost to individual privacy.",
  },

  // --- AXIS 6: Legitimacy Basis ---
  {
    id: "fc-6-1",
    axisId: 6,
    itemNumber: 1,
    questionType: "PT",
    abstractionLevel: "P",
    headlineA:
      "The freedom to elect your leaders is sacred, even when the people choose poorly",
    bodyA:
      "A government that was not chosen through fair, competitive elections is never fully legitimate, no matter how well it performs.",
    headlineB:
      "Results are what matter, regardless of how leaders were selected",
    bodyB:
      "A government that delivers prosperity, safety, and effective services is legitimate regardless of how its leaders were selected.",
  },
  {
    id: "fc-6-2",
    axisId: 6,
    itemNumber: 2,
    questionType: "FC",
    abstractionLevel: "I",
    headlineA:
      "Always maintain elections and free press, even when they slow things down",
    bodyA:
      "The process of choosing is more important than the quality of who is chosen.",
    headlineB:
      "Structure society to identify and empower the most capable leaders",
    bodyB:
      "The quality of governance matters more than the method of selecting governors.",
  },
  {
    id: "fc-6-3",
    axisId: 6,
    itemNumber: 3,
    questionType: "FC",
    abstractionLevel: "S",
    headlineA:
      "An elected government that fails is still more legitimate than an unelected one that succeeds",
    bodyA:
      "Legitimacy is about consent, not outcomes.",
    headlineB:
      "An unelected government that delivers is more legitimate than an elected one that fails",
    bodyB:
      "People need good governance more than they need to have chosen their governors.",
  },

  // --- AXIS 7: Social Change ---
  {
    id: "fc-7-1",
    axisId: 7,
    itemNumber: 1,
    questionType: "FC",
    abstractionLevel: "P",
    headlineA:
      "Inherited institutions should be continuously re-examined and reformed",
    bodyA:
      "What was once accepted is not automatically worth preserving — new knowledge demands new norms.",
    headlineB:
      "Inherited institutions represent accumulated wisdom tested by time",
    bodyB:
      "They should not be discarded simply because they conflict with contemporary fashions in thought.",
  },
  {
    id: "fc-7-2",
    axisId: 7,
    itemNumber: 2,
    questionType: "FC",
    abstractionLevel: "I",
    headlineA:
      "When evidence shows a practice causes harm, the state should change it",
    bodyA:
      "Laws and norms should evolve as society's understanding evolves.",
    headlineB:
      "Rapid reform risks destroying structures before their value is understood",
    bodyB:
      "Slow, cautious change prevents unintended consequences that cause more harm than the original problem.",
  },
  {
    id: "fc-7-3",
    axisId: 7,
    itemNumber: 3,
    questionType: "FC",
    abstractionLevel: "S",
    headlineA:
      "No tradition justifies restricting a person's fundamental rights",
    bodyA:
      "When cultural practices conflict with individual equality and autonomy, the practice should give way.",
    headlineB:
      "A longstanding practice may serve functions that aren't immediately visible",
    bodyB:
      "Imposing abstract principles on living communities often backfires — proceed with great caution.",
  },

  // --- AXIS 8: Cultural Diversity ---
  {
    id: "fc-8-1",
    axisId: 8,
    itemNumber: 1,
    questionType: "FC",
    abstractionLevel: "P",
    headlineA:
      "Many distinct traditions make a society stronger",
    bodyA:
      "The state should actively protect and accommodate cultural diversity rather than pressing everyone toward a single mold.",
    headlineB:
      "Shared identity makes a society stronger",
    bodyB:
      "The state should cultivate common values and reference points rather than institutionalizing permanent division along group lines.",
  },
  {
    id: "fc-8-2",
    axisId: 8,
    itemNumber: 2,
    questionType: "FC",
    abstractionLevel: "I",
    headlineA:
      "Provide public services in multiple languages and recognize diverse practices",
    bodyA:
      "Ensure all cultural communities can maintain their distinct identities while participating fully in civic life.",
    headlineB:
      "Establish a common civic culture and shared civic norms for all residents",
    bodyB:
      "Public institutions should unite people around what they have in common, not formalize their differences.",
  },
  {
    id: "fc-8-3",
    axisId: 8,
    itemNumber: 3,
    questionType: "PT",
    abstractionLevel: "S",
    headlineA:
      "The receiving society should adapt to include newcomers",
    bodyA:
      "Making space for immigrants' languages, traditions, and cultural practices in schools, workplaces, and public life.",
    headlineB:
      "Newcomers should make the primary effort to adapt",
    bodyB:
      "Learning the common language, adopting local civic norms, and integrating into the existing cultural fabric.",
  },

  // --- AXIS 9: Human Nature ---
  {
    id: "fc-9-1",
    axisId: 9,
    itemNumber: 1,
    questionType: "FC",
    abstractionLevel: "P",
    headlineA:
      "Most of \"human nature\" is shaped by culture and is changeable",
    bodyA:
      "Differences in behavior between groups are shaped by culture, upbringing, and social structures. Change the structures, change the outcomes.",
    headlineB:
      "Human nature is durable and policy must work within it",
    bodyB:
      "Social structures that ignore biological and historical realities — however well-intentioned — will fail.",
  },
  {
    id: "fc-9-2",
    axisId: 9,
    itemNumber: 2,
    questionType: "FC",
    abstractionLevel: "I",
    headlineA:
      "Persistent underrepresentation points to structural barriers to dismantle",
    bodyA:
      "The goal of governance should be to equalize outcomes by removing barriers.",
    headlineB:
      "Different outcomes may reflect genuine differences in preferences and priorities",
    bodyB:
      "The goal of governance should be to equalize access and opportunity, then accept the outcomes that emerge.",
  },
  {
    id: "fc-9-3",
    axisId: 9,
    itemNumber: 3,
    questionType: "FC",
    abstractionLevel: "S",
    headlineA:
      "The right education system can reshape society within a generation",
    bodyA:
      "If children are raised in the right environment with the right values, most social problems can be solved.",
    headlineB:
      "Education improves lives but can't fundamentally reshape human nature",
    bodyB:
      "Expecting schools to engineer a new kind of person places an impossible burden on them.",
  },

  // --- AXIS 10: International Engagement ---
  {
    id: "fc-10-1",
    axisId: 10,
    itemNumber: 1,
    questionType: "FC",
    abstractionLevel: "P",
    headlineA:
      "The biggest challenges require pooling sovereignty across nations",
    bodyA:
      "States must accept binding international agreements even when they impose costs — climate change, pandemics, and instability don't respect borders.",
    headlineB:
      "A nation's first duty is to its own citizens, not international bodies",
    bodyB:
      "Binding agreements inevitably transfer power to distant institutions that aren't accountable to the people they affect.",
  },
  {
    id: "fc-10-2",
    axisId: 10,
    itemNumber: 2,
    questionType: "FC",
    abstractionLevel: "I",
    headlineA:
      "International bodies should have real authority to enforce agreements",
    bodyA:
      "Without enforcement mechanisms, international cooperation is meaningless.",
    headlineB:
      "International bodies should advise but never bind sovereign nations",
    bodyB:
      "Enforcement power that supersedes national law is a threat to self-determination.",
  },
  {
    id: "fc-10-3",
    axisId: 10,
    itemNumber: 3,
    questionType: "FC",
    abstractionLevel: "S",
    headlineA:
      "Accept disproportionate costs in a climate agreement if your nation caused more harm",
    bodyA:
      "Global responsibility means accepting unequal burdens when you contributed more to the problem.",
    headlineB:
      "Reject disproportionate costs and negotiate for equal treatment",
    bodyB:
      "Accepting unequal burdens sets a precedent that undermines national interests.",
  },

  // --- AXIS 11: Military Policy ---
  {
    id: "fc-11-1",
    axisId: 11,
    itemNumber: 1,
    questionType: "FC",
    abstractionLevel: "P",
    headlineA:
      "Military force almost always causes more suffering than it prevents",
    bodyA:
      "The history of foreign intervention is overwhelmingly one of unintended consequences and prolonged instability.",
    headlineB:
      "Military strength is essential to maintaining peace and deterring aggression",
    bodyB:
      "A world where aggressive states face no consequences is more dangerous than one where capable nations enforce order.",
  },
  {
    id: "fc-11-2",
    axisId: 11,
    itemNumber: 2,
    questionType: "FC",
    abstractionLevel: "I",
    headlineA:
      "A nation should maintain only enough military for self-defense",
    bodyA:
      "Foreign conflicts are not your nation's responsibility — never deploy forces beyond your own borders.",
    headlineB:
      "A capable nation should project military force to defend allies and uphold norms",
    bodyB:
      "Defending allies, protecting trade routes, and deterring aggression are legitimate uses of military power.",
  },
  {
    id: "fc-11-3",
    axisId: 11,
    itemNumber: 3,
    questionType: "FC",
    abstractionLevel: "S",
    headlineA:
      "Even to stop atrocities abroad, respond with diplomacy — not military force",
    bodyA:
      "Military intervention violates sovereignty and historically creates more problems than it solves.",
    headlineB:
      "When diplomacy fails to stop atrocities, capable nations must intervene militarily",
    bodyB:
      "Sovereignty does not include the right to massacre your own people.",
  },

  // --- AXIS 12: Technology Governance ---
  {
    id: "fc-12-1",
    axisId: 12,
    itemNumber: 1,
    questionType: "FC",
    abstractionLevel: "P",
    headlineA:
      "Don't deploy powerful technology until the risks are well understood",
    bodyA:
      "Some harms, once done, cannot be undone — caution is the only responsible default.",
    headlineB:
      "Move forward and correct problems as they emerge",
    bodyB:
      "Excessive caution has costs too — delay itself causes suffering by withholding solutions to known problems.",
  },
  {
    id: "fc-12-2",
    axisId: 12,
    itemNumber: 2,
    questionType: "FC",
    abstractionLevel: "I",
    headlineA:
      "Innovators must prove their technology is safe before deployment",
    bodyA:
      "The burden of proof falls on developers, just as it does for pharmaceutical companies.",
    headlineB:
      "Those who want to restrict technology must prove it's dangerous",
    bodyB:
      "Innovation should proceed by default — regulation should respond to demonstrated harms.",
  },
  {
    id: "fc-12-3",
    axisId: 12,
    itemNumber: 3,
    questionType: "FC",
    abstractionLevel: "S",
    headlineA:
      "Don't deploy AI in government if its reasoning can't be explained",
    bodyA:
      "Decisions affecting people's lives must be made through processes that can be understood and challenged.",
    headlineB:
      "Deploy AI in government even if its reasoning isn't fully transparent",
    bodyB:
      "The quality of outcomes matters more than whether the process is transparent, especially if the alternative is worse human decision-making.",
  },
];
