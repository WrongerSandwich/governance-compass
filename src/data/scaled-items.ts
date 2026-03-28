export interface ScaledItemData {
  id: string;
  axisId: number;
  itemNumber: number;
  questionStem: string;
  option1Text: string; // Strong Pole A (-2)
  option2Text: string; // Moderate Pole A (-1)
  option3Text: string; // Midpoint (0)
  option4Text: string; // Moderate Pole B (+1)
  option5Text: string; // Strong Pole B (+2)
}

export const scaledItems: ScaledItemData[] = [
  // --- AXIS 1: Economic Model ---
  {
    id: "sc-1-1",
    axisId: 1,
    itemNumber: 1,
    questionStem:
      "How large a role should the state play in determining how a society's wealth is distributed?",
    option1Text:
      "Dominant — the state should directly control most economic activity",
    option2Text:
      "Major — heavy taxation and comprehensive public services",
    option3Text:
      "Moderate — a market economy with meaningful regulation and a safety net",
    option4Text:
      "Limited — light regulation with targeted help only for extreme need",
    option5Text:
      "Minimal — the state should have almost no role in economic distribution",
  },
  {
    id: "sc-1-2",
    axisId: 1,
    itemNumber: 2,
    questionStem:
      "When private companies become so large that they dominate an entire sector of the economy, how should the state respond?",
    option1Text:
      "Break them up and transfer key functions to public ownership",
    option2Text: "Break them up and heavily regulate successors",
    option3Text:
      "Regulate them firmly but allow them to continue operating",
    option4Text:
      "Monitor them but intervene only if consumers are clearly harmed",
    option5Text:
      "Leave them alone — dominance earned through competition is legitimate",
  },
  {
    id: "sc-1-3",
    axisId: 1,
    itemNumber: 3,
    questionStem:
      "When the state collects taxes, what principle should guide how much each person pays?",
    option1Text:
      "Those with more wealth should pay a sharply increasing share — the gap between rich and poor is itself a harm to address",
    option2Text:
      "Those with more should pay proportionally more — a graduated approach balancing fairness with incentive",
    option3Text:
      "Everyone should pay the same percentage of income — equal proportional treatment is fairest",
    option4Text:
      "Everyone should pay a modest flat contribution toward essential services only",
    option5Text:
      "Taxation should be as close to zero as possible — people should keep what they earn",
  },

  // --- AXIS 2: Environmental Policy ---
  {
    id: "sc-2-1",
    axisId: 2,
    itemNumber: 1,
    questionStem:
      "If economic growth and environmental protection come into direct conflict, which should a government prioritize?",
    option1Text:
      "Environment, always — ecological health is a precondition for everything else",
    option2Text:
      "Environment in most cases — with exceptions only for preventing severe human hardship",
    option3Text:
      "Balance both — neither should consistently override the other",
    option4Text:
      "Growth in most cases — prosperity provides the resources to address environmental problems later",
    option5Text:
      "Growth, always — economic development is the most urgent priority for human welfare",
  },
  {
    id: "sc-2-2",
    axisId: 2,
    itemNumber: 2,
    questionStem:
      "How strictly should the state limit industrial activity that damages the natural environment?",
    option1Text:
      "Strictly prohibit any activity with significant ecological impact, even if economically costly",
    option2Text:
      "Impose firm limits with strong enforcement and penalties",
    option3Text:
      "Regulate with meaningful standards but balance against economic needs",
    option4Text:
      "Set voluntary guidelines and incentivize compliance rather than mandating it",
    option5Text:
      "Minimal intervention — environmental issues are best addressed through innovation and market demand",
  },
  {
    id: "sc-2-3",
    axisId: 2,
    itemNumber: 3,
    questionStem:
      "Should a nation's measure of success include ecological health alongside economic output?",
    option1Text:
      "Ecological health should replace economic output as the primary measure of national success",
    option2Text:
      "Ecological measures should be weighted equally with economic ones",
    option3Text:
      "Both matter, but economic output remains the more practical benchmark",
    option4Text:
      "Ecological metrics are useful supplements but shouldn't drive policy",
    option5Text:
      "National success is best measured by economic output — ecology is a separate concern",
  },

  // --- AXIS 3: Governance Structure ---
  {
    id: "sc-3-1",
    axisId: 3,
    itemNumber: 1,
    questionStem:
      "How much authority should local communities have to set their own laws, even when those laws differ from national standards?",
    option1Text:
      "Near-total — local communities should be essentially self-governing",
    option2Text:
      "Extensive — on nearly all issues except defense and currency",
    option3Text:
      "Moderate — on most domestic issues with national minimum standards",
    option4Text: "Limited — on minor local matters only",
    option5Text:
      "Almost none — national standards should be uniform everywhere",
  },
  {
    id: "sc-3-2",
    axisId: 3,
    itemNumber: 2,
    questionStem:
      "When a policy problem spans multiple regions — such as river pollution or transportation networks — who should have primary authority to address it?",
    option1Text:
      "Local communities should negotiate solutions among themselves",
    option2Text: "Regional bodies should coordinate, with local input",
    option3Text: "A mix of national direction and regional implementation",
    option4Text:
      "The national government should lead, consulting regions as needed",
    option5Text:
      "The national government should decide and implement directly",
  },
  {
    id: "sc-3-3",
    axisId: 3,
    itemNumber: 3,
    questionStem:
      "How important is it that all citizens of a nation live under the same basic rules and standards?",
    option1Text:
      "Not very — diversity of local governance is a strength",
    option2Text:
      "Somewhat — a few core standards are needed but most rules should vary locally",
    option3Text:
      "Moderately — a meaningful common framework with room for local variation",
    option4Text:
      "Very — most rules should be consistent, with limited local exceptions",
    option5Text:
      "Essential — uniform standards are fundamental to national fairness and cohesion",
  },

  // --- AXIS 4: Decision Authority ---
  {
    id: "sc-4-1",
    axisId: 4,
    itemNumber: 1,
    questionStem:
      "When experts and the general public disagree about the right course of action, whose judgment should carry more weight in government policy?",
    option1Text:
      "The public's — always. Governance exists to serve the people's expressed wishes",
    option2Text:
      "The public's — in most cases, with narrow exceptions for technical emergencies",
    option3Text: "Both should carry equal weight",
    option4Text:
      "The experts' — in most cases, with public input on values and priorities",
    option5Text:
      "The experts' — always. Complex governance requires specialized knowledge",
  },
  {
    id: "sc-4-2",
    axisId: 4,
    itemNumber: 2,
    questionStem:
      "How much direct control should ordinary citizens have over day-to-day government policy?",
    option1Text:
      "Maximum — citizens should vote directly on major issues regularly",
    option2Text:
      "Substantial — through frequent referenda and strong recall mechanisms",
    option3Text:
      "Moderate — through elected representatives who are accountable at election time",
    option4Text:
      "Limited — citizens choose leaders who then govern using expert advice",
    option5Text:
      "Minimal — governance is best handled by qualified professionals with broad authority",
  },
  {
    id: "sc-4-3",
    axisId: 4,
    itemNumber: 3,
    questionStem:
      "When a government agency staffed by specialists makes a decision that most citizens oppose, what should happen?",
    option1Text:
      "The decision should be immediately reversed — public opposition invalidates it",
    option2Text:
      "The decision should be suspended and put to a public vote",
    option3Text:
      "The decision should be reviewed, with public concerns given serious weight",
    option4Text:
      "The decision should stand unless there are clear errors — expertise should be trusted",
    option5Text:
      "The decision should stand — insulating technical governance from popular pressure produces better outcomes",
  },

  // --- AXIS 5: Rights Balance ---
  {
    id: "sc-5-1",
    axisId: 5,
    itemNumber: 1,
    questionStem:
      "How much power should law enforcement have to investigate and detain individuals suspected of planning serious harm?",
    option1Text:
      "Strictly limited — strong protections for suspects are essential even if some threats go undetected",
    option2Text:
      "Somewhat limited — with firm judicial oversight at every stage",
    option3Text:
      "Moderate — balanced powers with meaningful but not absolute safeguards",
    option4Text:
      "Broad — with general oversight but operational flexibility for authorities",
    option5Text:
      "Expansive — public safety requires giving law enforcement wide latitude to act on suspicion",
  },
  {
    id: "sc-5-2",
    axisId: 5,
    itemNumber: 2,
    questionStem:
      "How acceptable is it for a government to restrict freedom of expression when speech may incite violence or undermine social stability?",
    option1Text:
      "Never acceptable — expression must be protected regardless of content or consequence",
    option2Text:
      "Rarely — only in cases of direct, immediate incitement to specific violence",
    option3Text:
      "Sometimes — when there is a clear and demonstrable risk to public safety",
    option4Text:
      "Often — maintaining social order justifies meaningful limits on provocative or destabilizing speech",
    option5Text:
      "Almost always — the state has a duty to prevent speech that threatens social cohesion",
  },
  {
    id: "sc-5-3",
    axisId: 5,
    itemNumber: 3,
    questionStem:
      "In your view, which poses a greater long-term threat to a good society?",
    option1Text:
      "A state with too much power is always the greater danger",
    option2Text:
      "A state with too much power is usually the greater danger",
    option3Text: "Both are roughly equal threats",
    option4Text:
      "Unchecked disorder and crime are usually the greater danger",
    option5Text:
      "Unchecked disorder and crime are always the greater danger",
  },

  // --- AXIS 6: Legitimacy Basis ---
  {
    id: "sc-6-1",
    axisId: 6,
    itemNumber: 1,
    questionStem:
      "If a government that was not freely elected consistently delivered excellent public services, economic growth, and personal safety, how legitimate would you consider it?",
    option1Text:
      "Completely illegitimate — only governments chosen by the people have the right to govern",
    option2Text:
      "Mostly illegitimate — good results don't justify unelected power",
    option3Text:
      "Somewhat legitimate — competence matters, but so does consent",
    option4Text:
      "Mostly legitimate — results matter more, though elections would be preferable",
    option5Text:
      "Fully legitimate — what a government delivers matters more than how it came to power",
  },
  {
    id: "sc-6-2",
    axisId: 6,
    itemNumber: 2,
    questionStem:
      "How important is it that citizens have the power to remove their leaders through elections?",
    option1Text:
      "Absolutely essential — this is the foundation of legitimate governance",
    option2Text:
      "Very important — the primary mechanism, though not the only one",
    option3Text:
      "Important — one of several factors that make governance legitimate",
    option4Text:
      "Somewhat important — but competent governance matters more",
    option5Text:
      "Not essential — there are other valid ways to ensure accountability",
  },
  {
    id: "sc-6-3",
    axisId: 6,
    itemNumber: 3,
    questionStem:
      "When a government faces a long-term challenge that requires unpopular decisions over many years, what approach is most appropriate?",
    option1Text:
      "Leaders should always follow public opinion, even if experts believe the public is wrong — that is what consent of the governed means",
    option2Text:
      "Leaders should explain their reasoning and persuade the public, proceeding only with public support",
    option3Text:
      "Leaders should balance expert advice with public opinion, accepting some compromise on both sides",
    option4Text:
      "Leaders should make the expert-recommended decision and accept the electoral consequences",
    option5Text:
      "Leaders should be insulated from short-term public opinion so they can govern for the long term",
  },

  // --- AXIS 7: Social Change ---
  {
    id: "sc-7-1",
    axisId: 7,
    itemNumber: 1,
    questionStem:
      "How quickly should a society change its social norms and cultural institutions?",
    option1Text:
      "As rapidly as evidence and moral reasoning demand — delay perpetuates harm",
    option2Text:
      "At a steady pace — actively pursuing reform while monitoring consequences",
    option3Text:
      "Gradually — significant changes should be tested in limited contexts before broad adoption",
    option4Text:
      "Slowly — only when problems are severe and alternatives are well-proven",
    option5Text:
      "Very reluctantly — the default should be preservation unless the case for change is overwhelming",
  },
  {
    id: "sc-7-2",
    axisId: 7,
    itemNumber: 2,
    questionStem:
      "When established religious or cultural institutions hold views that conflict with newer social values, how should the state respond?",
    option1Text:
      "Actively challenge those institutions and restrict practices that conflict with contemporary principles",
    option2Text:
      "Withhold public support or recognition from institutions that resist reform",
    option3Text:
      "Remain neutral — neither promoting nor restricting the institutions' traditional views",
    option4Text:
      "Protect those institutions' right to maintain their traditional positions, even when controversial",
    option5Text:
      "Actively support and preserve traditional institutions as vital sources of social cohesion",
  },
  {
    id: "sc-7-3",
    axisId: 7,
    itemNumber: 3,
    questionStem:
      "In your view, is the general trajectory of social change over the past century best described as:",
    option1Text:
      "Overwhelmingly positive — a story of expanding freedom, inclusion, and understanding",
    option2Text:
      "Mostly positive — with meaningful gains, though not every change has been beneficial",
    option3Text:
      "Mixed — some changes have been clearly good, others clearly harmful",
    option4Text:
      "Mostly concerning — important things have been lost in the pursuit of novelty",
    option5Text:
      "Deeply troubling — foundational values and institutions have been eroded in damaging ways",
  },

  // --- AXIS 8: Cultural Diversity ---
  {
    id: "sc-8-1",
    axisId: 8,
    itemNumber: 1,
    questionStem:
      "When cultural or religious practices of a minority group conflict with the majority culture's norms, how should the state respond?",
    option1Text:
      "Actively protect the minority practice — cultural diversity is a fundamental right",
    option2Text:
      "Accommodate the minority practice in most cases, seeking compromise where needed",
    option3Text: "Evaluate case by case — no general rule applies",
    option4Text:
      "Expect the minority group to adapt in most cases, making exceptions only for core religious obligations",
    option5Text:
      "Expect full adaptation to the majority culture's norms — national cohesion requires shared standards",
  },
  {
    id: "sc-8-2",
    axisId: 8,
    itemNumber: 2,
    questionStem:
      "Should public schools primarily teach children about the traditions and history of many cultures, or primarily transmit the shared national culture?",
    option1Text:
      "Primarily many cultures — preparing children for diversity is more important than reinforcing a single identity",
    option2Text:
      "Mostly many cultures — with some shared national content",
    option3Text: "A balance of both",
    option4Text:
      "Mostly shared national culture — with respectful acknowledgment of diversity",
    option5Text:
      "Primarily shared national culture — schools are where a common identity is formed",
  },
  {
    id: "sc-8-3",
    axisId: 8,
    itemNumber: 3,
    questionStem:
      "In a society with multiple ethnic or cultural groups, what level of group distinctiveness is healthiest in the long run?",
    option1Text:
      "Strong distinct identities are a permanent source of strength and should be maintained",
    option2Text:
      "Distinct identities should be preserved but with strong bridges between groups",
    option3Text:
      "Some blending is natural and healthy, though distinct identities will and should persist",
    option4Text:
      "A gradual blending into a shared culture, while respecting heritage, produces the most stable society",
    option5Text:
      "A unified common identity is essential — strong group distinctions inevitably breed conflict",
  },

  // --- AXIS 9: Human Nature ---
  {
    id: "sc-9-1",
    axisId: 9,
    itemNumber: 1,
    questionStem:
      "How much can deliberate policy change the fundamental patterns of human social behavior?",
    option1Text:
      "Almost entirely — social structures determine behavior, and better structures produce better behavior",
    option2Text:
      "Substantially — though change takes time and sustained effort",
    option3Text:
      "Moderately — policy can shift behavior within limits set by human nature",
    option4Text:
      "Somewhat — but human nature constrains what policy can realistically achieve",
    option5Text:
      "Very little — human nature is relatively fixed, and policy should work with it rather than against it",
  },
  {
    id: "sc-9-2",
    axisId: 9,
    itemNumber: 2,
    questionStem:
      "When a society observes persistent differences in outcomes between groups, what is the most productive response?",
    option1Text:
      "Redesign institutions until outcomes are equal — persistent differences prove the system is failing",
    option2Text:
      "Actively reform institutions to remove barriers while tracking outcomes as a measure of progress",
    option3Text:
      "Ensure equal access and opportunity, then accept that outcomes may vary for many reasons",
    option4Text:
      "Focus on protecting individual rights and freedoms rather than measuring group outcomes",
    option5Text:
      "Accept that different outcomes are a natural feature of diverse societies — forced equalization creates new problems",
  },
  {
    id: "sc-9-3",
    axisId: 9,
    itemNumber: 3,
    questionStem:
      "To what extent are social hierarchies an inevitable feature of human societies?",
    option1Text:
      "Not at all — hierarchies are entirely constructed and can be entirely eliminated through better design",
    option2Text:
      "Mostly not — most current hierarchies are unjust and can be dismantled, though some coordination structures are needed",
    option3Text:
      "Partially — some hierarchy may be natural, but much of it is socially constructed and changeable",
    option4Text:
      "Mostly — hierarchies emerge naturally in all human groups, though their specific form can be made more humane",
    option5Text:
      "Entirely — social hierarchy is a fundamental feature of human nature that governance must accommodate",
  },

  // --- AXIS 10: International Engagement ---
  {
    id: "sc-10-1",
    axisId: 10,
    itemNumber: 1,
    questionStem:
      "How willing should a nation be to accept constraints on its own policies in exchange for the benefits of international cooperation?",
    option1Text:
      "Very willing — global coordination requires real compromise from every nation",
    option2Text:
      "Mostly willing — with protections against agreements that cause severe domestic harm",
    option3Text:
      "Selectively willing — depending on whether the specific agreement serves the national interest",
    option4Text:
      "Reluctant — only for the most critical global emergencies",
    option5Text:
      "Very reluctant — sovereignty should be compromised only in the most extreme circumstances",
  },
  {
    id: "sc-10-2",
    axisId: 10,
    itemNumber: 2,
    questionStem:
      "How open should a nation's borders be to the movement of people?",
    option1Text:
      "Fully open — freedom of movement is a fundamental human right",
    option2Text:
      "Broadly open — with basic screening but a presumption of entry",
    option3Text:
      "Selectively open — managed immigration based on national needs and humanitarian obligations",
    option4Text:
      "Restricted — limited immigration with priority for economic contribution and cultural compatibility",
    option5Text:
      "Highly restricted — a nation's borders define its identity and should be firmly controlled",
  },
  {
    id: "sc-10-3",
    axisId: 10,
    itemNumber: 3,
    questionStem:
      "When a wealthier nation and a poorer nation negotiate a trade agreement, what principle should guide the terms?",
    option1Text:
      "The wealthier nation should make deliberate concessions to reduce global inequality",
    option2Text:
      "Terms should moderately favor the poorer nation to promote development",
    option3Text:
      "Terms should be mutually beneficial and equally binding",
    option4Text:
      "Each nation should pursue its own best deal — negotiations are inherently competitive",
    option5Text:
      "The wealthier nation should use its leverage to secure the best possible terms for its own citizens",
  },

  // --- AXIS 11: Military Policy ---
  {
    id: "sc-11-1",
    axisId: 11,
    itemNumber: 1,
    questionStem:
      "How much should a nation spend on its military relative to other priorities?",
    option1Text:
      "As little as possible — only enough for minimal border defense",
    option2Text:
      "Modestly — enough for credible self-defense but no power projection",
    option3Text:
      "Moderately — sufficient for self-defense and limited alliance commitments",
    option4Text:
      "Substantially — enough to project force regionally and support allies",
    option5Text:
      "As much as needed — military superiority is essential to national security and global stability",
  },
  {
    id: "sc-11-2",
    axisId: 11,
    itemNumber: 2,
    questionStem:
      "Under what circumstances is it acceptable for a nation to use military force beyond its own borders?",
    option1Text:
      "Never — military force should be used only in direct self-defense",
    option2Text:
      "Only in response to a direct, imminent attack on the nation or its closest allies",
    option3Text:
      "When authorized by a legitimate international body to stop an ongoing humanitarian catastrophe",
    option4Text:
      "When national strategic interests are seriously threatened, even without imminent attack",
    option5Text:
      "Whenever the nation's leaders determine it serves the national interest — military force is a normal tool of statecraft",
  },
  {
    id: "sc-11-3",
    axisId: 11,
    itemNumber: 3,
    questionStem:
      "When another nation is building military capability that could threaten your nation in the future — but has not yet acted aggressively — what is the appropriate response?",
    option1Text:
      "Pursue diplomacy and disarmament — military buildups are often responses to perceived threats on the other side",
    option2Text:
      "Strengthen alliances and diplomatic pressure while maintaining defensive readiness",
    option3Text:
      "Match their buildup proportionally to maintain deterrence",
    option4Text:
      "Build a decisive military advantage to ensure they never act on their capability",
    option5Text:
      "Consider preemptive action to neutralize the threat before it matures",
  },

  // --- AXIS 12: Technology Governance ---
  {
    id: "sc-12-1",
    axisId: 12,
    itemNumber: 1,
    questionStem:
      "When a government must decide whether to permit a powerful but poorly understood new technology, where should the burden of proof fall?",
    option1Text:
      "Entirely on innovators — nothing should be deployed until proven safe",
    option2Text:
      "Mostly on innovators — with a presumption of restriction until safety is demonstrated",
    option3Text: "Balanced — both sides should make their case",
    option4Text:
      "Mostly on those who want to restrict — with a presumption of permission unless clear dangers are shown",
    option5Text:
      "Entirely on those who want to restrict — innovation should be the default",
  },
  {
    id: "sc-12-2",
    axisId: 12,
    itemNumber: 2,
    questionStem:
      "How should the state relate to technologies that could dramatically change human life — such as artificial intelligence, genetic engineering, or autonomous systems?",
    option1Text:
      "Strictly control development and restrict deployment until long-term effects are well understood",
    option2Text:
      "Regulate proactively — establish safety frameworks before technologies mature",
    option3Text:
      "Regulate reactively — allow development and intervene when specific harms emerge",
    option4Text:
      "Encourage development with minimal regulation — innovation is how societies solve problems",
    option5Text:
      "Actively fund and accelerate development — the faster these technologies mature, the better",
  },
  {
    id: "sc-12-3",
    axisId: 12,
    itemNumber: 3,
    questionStem:
      "When government-funded scientific research produces a discovery that could be used for both enormous benefit and significant harm, what should happen?",
    option1Text:
      "The research should be classified or suppressed — some knowledge is too dangerous to release",
    option2Text:
      "The research should be published only to vetted institutions with strict controls on application",
    option3Text:
      "The findings should be published with clear guidelines on responsible use, but no restrictions on access",
    option4Text:
      "The findings should be fully published — open knowledge produces better outcomes than controlled knowledge",
    option5Text:
      "The findings should be published and actively promoted — accelerating adoption maximizes benefit",
  },
];
