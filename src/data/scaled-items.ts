export interface ScaledItemData {
  id: string;
  axisId: number;
  itemNumber: number;
  questionStem: string;
  option1Label: string; // Strong Pole A (-2)
  option1Detail: string;
  option2Label: string; // Moderate Pole A (-1)
  option2Detail: string;
  option3Label: string; // Midpoint (0)
  option3Detail: string;
  option4Label: string; // Moderate Pole B (+1)
  option4Detail: string;
  option5Label: string; // Strong Pole B (+2)
  option5Detail: string;
}

export const scaledItems: ScaledItemData[] = [
  // --- AXIS 1: Economic Model ---
  {
    id: "sc-1-1",
    axisId: 1,
    itemNumber: 1,
    questionStem:
      "How large a role should the state play in determining how wealth is distributed?",
    option1Label: "Dominant",
    option1Detail:
      "The state should directly control most economic activity and resource distribution.",
    option2Label: "Major",
    option2Detail:
      "Heavy taxation funding comprehensive public services and a robust welfare system.",
    option3Label: "Moderate",
    option3Detail:
      "A market economy with meaningful regulation and a safety net for those in need.",
    option4Label: "Limited",
    option4Detail:
      "Light regulation with targeted help only for people in extreme need.",
    option5Label: "Minimal",
    option5Detail:
      "The state should have almost no role in economic distribution.",
  },
  {
    id: "sc-1-2",
    axisId: 1,
    itemNumber: 2,
    questionStem:
      "When private companies become so large they dominate an entire sector, how should the state respond?",
    option1Label: "Public ownership",
    option1Detail:
      "Break them up and transfer key functions to public ownership.",
    option2Label: "Break up and regulate",
    option2Detail:
      "Break them up and heavily regulate the successor companies.",
    option3Label: "Regulate firmly",
    option3Detail:
      "Allow them to continue operating under firm regulatory oversight.",
    option4Label: "Monitor only",
    option4Detail:
      "Intervene only if consumers are clearly being harmed.",
    option5Label: "Leave them alone",
    option5Detail:
      "Market dominance earned through competition is legitimate.",
  },
  {
    id: "sc-1-3",
    axisId: 1,
    itemNumber: 3,
    questionStem:
      "What principle should guide how much each person pays in taxes?",
    option1Label: "Sharply progressive",
    option1Detail:
      "Those with more wealth should pay a sharply increasing share — the gap itself is a harm.",
    option2Label: "Graduated",
    option2Detail:
      "Those with more should pay proportionally more, balancing fairness with incentive.",
    option3Label: "Flat percentage",
    option3Detail:
      "Everyone pays the same percentage of income — equal treatment is fairest.",
    option4Label: "Flat contribution",
    option4Detail:
      "Everyone pays a modest flat amount toward essential services only.",
    option5Label: "Near zero",
    option5Detail:
      "Taxation should be as close to zero as possible — people should keep what they earn.",
  },

  // --- AXIS 2: Environmental Policy ---
  {
    id: "sc-2-1",
    axisId: 2,
    itemNumber: 1,
    questionStem:
      "If economic growth and environmental protection come into direct conflict, which should a government prioritize?",
    option1Label: "Environment, always",
    option1Detail:
      "Ecological health is a precondition for everything else — it must always come first.",
    option2Label: "Environment, usually",
    option2Detail:
      "Prioritize the environment in most cases, with exceptions only for severe human hardship.",
    option3Label: "Balance both",
    option3Detail:
      "Neither should consistently override the other — context determines the right call.",
    option4Label: "Growth, usually",
    option4Detail:
      "Prosperity provides the resources to address environmental problems later.",
    option5Label: "Growth, always",
    option5Detail:
      "Economic development is the most urgent priority for human welfare.",
  },
  {
    id: "sc-2-2",
    axisId: 2,
    itemNumber: 2,
    questionStem:
      "How strictly should the state limit industrial activity that damages the natural environment?",
    option1Label: "Strict prohibition",
    option1Detail:
      "Prohibit any activity with significant ecological impact, even if economically costly.",
    option2Label: "Firm limits",
    option2Detail:
      "Impose firm limits with strong enforcement and penalties for violations.",
    option3Label: "Balanced regulation",
    option3Detail:
      "Regulate with meaningful standards but balance against economic needs.",
    option4Label: "Voluntary guidelines",
    option4Detail:
      "Set voluntary guidelines and incentivize compliance rather than mandating it.",
    option5Label: "Minimal intervention",
    option5Detail:
      "Environmental issues are best addressed through innovation and market demand, not regulation.",
  },
  {
    id: "sc-2-3",
    axisId: 2,
    itemNumber: 3,
    questionStem:
      "Should a nation's measure of success include ecological health alongside economic output?",
    option1Label: "Replace GDP",
    option1Detail:
      "Ecological health should replace economic output as the primary measure of national success.",
    option2Label: "Equal weight",
    option2Detail:
      "Ecological measures should be weighted equally with economic ones.",
    option3Label: "Useful supplement",
    option3Detail:
      "Both matter, but economic output remains the more practical day-to-day benchmark.",
    option4Label: "Secondary metric",
    option4Detail:
      "Ecological metrics are useful supplements but shouldn't drive policy decisions.",
    option5Label: "Separate concern",
    option5Detail:
      "National success is best measured by economic output — ecology is a separate matter.",
  },

  // --- AXIS 3: Governance Structure ---
  {
    id: "sc-3-1",
    axisId: 3,
    itemNumber: 1,
    questionStem:
      "How much authority should local communities have to set their own laws, even when those differ from national standards?",
    option1Label: "Near-total",
    option1Detail:
      "Local communities should be essentially self-governing on all but defense and currency.",
    option2Label: "Extensive",
    option2Detail:
      "Authority on nearly all domestic issues with only broad national guidelines.",
    option3Label: "Moderate",
    option3Detail:
      "Authority on most domestic issues with national minimum standards.",
    option4Label: "Limited",
    option4Detail:
      "Only on minor local matters — most policy should be set nationally.",
    option5Label: "Almost none",
    option5Detail:
      "National standards should be uniform everywhere for fairness and cohesion.",
  },
  {
    id: "sc-3-2",
    axisId: 3,
    itemNumber: 2,
    questionStem:
      "When a policy problem spans multiple regions, who should have primary authority to address it?",
    option1Label: "Local negotiation",
    option1Detail:
      "Local communities should negotiate solutions among themselves.",
    option2Label: "Regional coordination",
    option2Detail:
      "Regional bodies should coordinate, with local input prioritized.",
    option3Label: "Shared authority",
    option3Detail:
      "A mix of national direction and regional implementation.",
    option4Label: "National lead",
    option4Detail:
      "The national government should lead, consulting regions as needed.",
    option5Label: "National control",
    option5Detail:
      "The national government should decide and implement directly.",
  },
  {
    id: "sc-3-3",
    axisId: 3,
    itemNumber: 3,
    questionStem:
      "How important is it that all citizens of a nation live under the same basic rules?",
    option1Label: "Not very",
    option1Detail:
      "Diversity of local governance is a strength, not a problem.",
    option2Label: "Somewhat",
    option2Detail:
      "A few core standards are needed, but most rules should vary locally.",
    option3Label: "Moderately",
    option3Detail:
      "A meaningful common framework with room for local variation.",
    option4Label: "Very",
    option4Detail:
      "Most rules should be consistent, with limited local exceptions.",
    option5Label: "Essential",
    option5Detail:
      "Uniform standards are fundamental to national fairness and cohesion.",
  },

  // --- AXIS 4: Decision Authority ---
  {
    id: "sc-4-1",
    axisId: 4,
    itemNumber: 1,
    questionStem:
      "When experts and the general public disagree about the right course of action, whose judgment should carry more weight?",
    option1Label: "The public's, always",
    option1Detail:
      "Governance exists to serve the people's expressed wishes — full stop.",
    option2Label: "The public's, usually",
    option2Detail:
      "With narrow exceptions for technical emergencies requiring specialized knowledge.",
    option3Label: "Equal weight",
    option3Detail:
      "Both perspectives should carry equal weight in policy decisions.",
    option4Label: "The experts', usually",
    option4Detail:
      "With public input on values and priorities, but expert judgment on implementation.",
    option5Label: "The experts', always",
    option5Detail:
      "Complex governance requires specialized knowledge that popular opinion cannot replace.",
  },
  {
    id: "sc-4-2",
    axisId: 4,
    itemNumber: 2,
    questionStem:
      "How much direct control should ordinary citizens have over day-to-day government policy?",
    option1Label: "Maximum",
    option1Detail:
      "Citizens should vote directly on major issues regularly through referenda.",
    option2Label: "Substantial",
    option2Detail:
      "Frequent referenda and strong recall mechanisms keep power with the people.",
    option3Label: "Moderate",
    option3Detail:
      "Elected representatives who are accountable at election time, but govern between them.",
    option4Label: "Limited",
    option4Detail:
      "Citizens choose leaders who then govern using expert advice between elections.",
    option5Label: "Minimal",
    option5Detail:
      "Governance is best handled by qualified professionals with broad authority to act.",
  },
  {
    id: "sc-4-3",
    axisId: 4,
    itemNumber: 3,
    questionStem:
      "When a specialist government agency makes a decision that most citizens oppose, what should happen?",
    option1Label: "Reverse immediately",
    option1Detail:
      "Public opposition invalidates any expert decision — period.",
    option2Label: "Suspend and vote",
    option2Detail:
      "The decision should be suspended and put to a public vote.",
    option3Label: "Review seriously",
    option3Detail:
      "The decision should be reviewed, with public concerns given serious weight.",
    option4Label: "Let it stand, usually",
    option4Detail:
      "It should stand unless there are clear errors — expertise should be trusted.",
    option5Label: "Insulate fully",
    option5Detail:
      "Technical governance should be insulated from popular pressure for better outcomes.",
  },

  // --- AXIS 5: Rights Balance ---
  {
    id: "sc-5-1",
    axisId: 5,
    itemNumber: 1,
    questionStem:
      "How much power should law enforcement have to investigate and detain individuals suspected of planning serious harm?",
    option1Label: "Strictly limited",
    option1Detail:
      "Strong protections for suspects are essential even if some threats go undetected.",
    option2Label: "Somewhat limited",
    option2Detail:
      "Firm judicial oversight required at every stage of investigation and detention.",
    option3Label: "Balanced",
    option3Detail:
      "Meaningful safeguards that don't prevent authorities from acting when needed.",
    option4Label: "Broad",
    option4Detail:
      "General oversight but operational flexibility for authorities to act on credible threats.",
    option5Label: "Expansive",
    option5Detail:
      "Public safety requires giving law enforcement wide latitude to act on suspicion.",
  },
  {
    id: "sc-5-2",
    axisId: 5,
    itemNumber: 2,
    questionStem:
      "How acceptable is it for a government to restrict expression when speech may incite violence or undermine stability?",
    option1Label: "Never acceptable",
    option1Detail:
      "Expression must be protected regardless of content or consequence.",
    option2Label: "Rarely",
    option2Detail:
      "Only in cases of direct, immediate incitement to specific acts of violence.",
    option3Label: "Sometimes",
    option3Detail:
      "When there is a clear and demonstrable risk to public safety.",
    option4Label: "Often",
    option4Detail:
      "Maintaining social order justifies meaningful limits on destabilizing speech.",
    option5Label: "Almost always",
    option5Detail:
      "The state has a duty to prevent speech that threatens social cohesion.",
  },
  {
    id: "sc-5-3",
    axisId: 5,
    itemNumber: 3,
    questionStem:
      "Which poses a greater long-term threat to a good society?",
    option1Label: "Too much state power, always",
    option1Detail:
      "An overpowered state is always the greater danger to human flourishing.",
    option2Label: "Too much state power, usually",
    option2Detail:
      "In most circumstances, state overreach is the more serious threat.",
    option3Label: "Both equally",
    option3Detail:
      "Both excessive state power and unchecked disorder are roughly equal threats.",
    option4Label: "Too much disorder, usually",
    option4Detail:
      "In most circumstances, crime and instability are the more serious threat.",
    option5Label: "Too much disorder, always",
    option5Detail:
      "Unchecked disorder is always the greater danger to human flourishing.",
  },

  // --- AXIS 6: Legitimacy Basis ---
  {
    id: "sc-6-1",
    axisId: 6,
    itemNumber: 1,
    questionStem:
      "If an unelected government consistently delivered excellent services, growth, and safety, how legitimate would you consider it?",
    option1Label: "Completely illegitimate",
    option1Detail:
      "Only governments chosen by the people have the right to govern.",
    option2Label: "Mostly illegitimate",
    option2Detail:
      "Good results don't justify the absence of electoral consent.",
    option3Label: "Somewhat legitimate",
    option3Detail:
      "Competence matters, but so does the consent of the governed.",
    option4Label: "Mostly legitimate",
    option4Detail:
      "Results matter more than process, though elections would be preferable.",
    option5Label: "Fully legitimate",
    option5Detail:
      "What a government delivers matters more than how it came to power.",
  },
  {
    id: "sc-6-2",
    axisId: 6,
    itemNumber: 2,
    questionStem:
      "How important is it that citizens can remove their leaders through elections?",
    option1Label: "Absolutely essential",
    option1Detail:
      "This is the foundation of legitimate governance — nothing substitutes for it.",
    option2Label: "Very important",
    option2Detail:
      "The primary accountability mechanism, though not the only one.",
    option3Label: "Important",
    option3Detail:
      "One of several factors that make governance legitimate.",
    option4Label: "Somewhat important",
    option4Detail:
      "Competent governance matters more, but elections are a useful check.",
    option5Label: "Not essential",
    option5Detail:
      "There are other valid ways to ensure accountability besides elections.",
  },
  {
    id: "sc-6-3",
    axisId: 6,
    itemNumber: 3,
    questionStem:
      "When a government faces a long-term challenge requiring unpopular decisions, what approach is most appropriate?",
    option1Label: "Always follow the public",
    option1Detail:
      "The people's expressed wishes define legitimate governance, even if experts disagree.",
    option2Label: "Persuade first",
    option2Detail:
      "Explain the reasoning and proceed only with public support.",
    option3Label: "Balance both",
    option3Detail:
      "Compromise between expert advice and public opinion on both sides.",
    option4Label: "Decide, accept consequences",
    option4Detail:
      "Make the expert-recommended decision and face voters at the next election.",
    option5Label: "Insulate leaders",
    option5Detail:
      "Leaders should be insulated from short-term opinion to govern for the long term.",
  },

  // --- AXIS 7: Social Change ---
  {
    id: "sc-7-1",
    axisId: 7,
    itemNumber: 1,
    questionStem:
      "How quickly should a society change its social norms and cultural institutions?",
    option1Label: "As fast as evidence demands",
    option1Detail:
      "Delay perpetuates harm — reform should be pursued as soon as the case is clear.",
    option2Label: "At a steady pace",
    option2Detail:
      "Actively pursue reform while monitoring consequences along the way.",
    option3Label: "Gradually",
    option3Detail:
      "Test significant changes in limited contexts before broad adoption.",
    option4Label: "Slowly",
    option4Detail:
      "Only when problems are severe and alternatives have been well-proven.",
    option5Label: "Very reluctantly",
    option5Detail:
      "The default should be preservation unless the case for change is overwhelming.",
  },
  {
    id: "sc-7-2",
    axisId: 7,
    itemNumber: 2,
    questionStem:
      "When religious or cultural institutions hold views that conflict with newer social values, how should the state respond?",
    option1Label: "Actively challenge",
    option1Detail:
      "Restrict practices that conflict with contemporary principles of equality and inclusion.",
    option2Label: "Withhold support",
    option2Detail:
      "Withdraw public recognition or funding from institutions that resist reform.",
    option3Label: "Stay neutral",
    option3Detail:
      "Neither promote nor restrict the institutions' traditional positions.",
    option4Label: "Protect their right",
    option4Detail:
      "Protect institutions' right to maintain traditional positions, even when controversial.",
    option5Label: "Actively preserve",
    option5Detail:
      "Support and preserve traditional institutions as vital sources of social cohesion and meaning.",
  },
  {
    id: "sc-7-3",
    axisId: 7,
    itemNumber: 3,
    questionStem:
      "How would you characterize the general trajectory of social change over the past century?",
    option1Label: "Overwhelmingly positive",
    option1Detail:
      "A story of expanding freedom, inclusion, and moral understanding.",
    option2Label: "Mostly positive",
    option2Detail:
      "Meaningful gains on balance, though not every change has been beneficial.",
    option3Label: "Mixed",
    option3Detail:
      "Some changes have been clearly good, others clearly harmful.",
    option4Label: "Mostly concerning",
    option4Detail:
      "Important things have been lost in the pursuit of novelty and disruption.",
    option5Label: "Deeply troubling",
    option5Detail:
      "Foundational values and institutions have been eroded in damaging ways.",
  },

  // --- AXIS 8: Cultural Diversity ---
  {
    id: "sc-8-1",
    axisId: 8,
    itemNumber: 1,
    questionStem:
      "When a minority group's practices conflict with the majority culture's norms, how should the state respond?",
    option1Label: "Protect the practice",
    option1Detail:
      "Cultural diversity is a fundamental right — minority practices should be actively protected.",
    option2Label: "Accommodate usually",
    option2Detail:
      "Seek compromise where needed, but the default should be accommodation.",
    option3Label: "Case by case",
    option3Detail:
      "No general rule applies — evaluate each situation on its merits.",
    option4Label: "Expect adaptation, usually",
    option4Detail:
      "The minority group should adapt in most cases, with exceptions for core religious obligations.",
    option5Label: "Expect full adaptation",
    option5Detail:
      "National cohesion requires shared standards — no group gets permanent exceptions.",
  },
  {
    id: "sc-8-2",
    axisId: 8,
    itemNumber: 2,
    questionStem:
      "Should public schools primarily teach many cultures, or primarily transmit the shared national culture?",
    option1Label: "Primarily many cultures",
    option1Detail:
      "Preparing children for diversity is more important than reinforcing a single identity.",
    option2Label: "Mostly many cultures",
    option2Detail:
      "With some shared national content alongside diverse perspectives.",
    option3Label: "Balance of both",
    option3Detail:
      "Equal emphasis on shared national identity and diverse cultural understanding.",
    option4Label: "Mostly national culture",
    option4Detail:
      "With respectful acknowledgment of diversity, but national identity comes first.",
    option5Label: "Primarily national culture",
    option5Detail:
      "Schools are where a common identity is formed — that is their primary purpose.",
  },
  {
    id: "sc-8-3",
    axisId: 8,
    itemNumber: 3,
    questionStem:
      "In a society with multiple ethnic or cultural groups, what level of distinctiveness is healthiest long-term?",
    option1Label: "Strong distinct identities",
    option1Detail:
      "Permanent cultural distinctiveness is a source of strength and should be maintained.",
    option2Label: "Preserve with bridges",
    option2Detail:
      "Distinct identities should be preserved but with strong connections between groups.",
    option3Label: "Natural blending",
    option3Detail:
      "Some blending is natural and healthy, though distinct identities will and should persist.",
    option4Label: "Gradual unification",
    option4Detail:
      "A gradual blending into a shared culture, while respecting heritage, produces the most stable society.",
    option5Label: "Unified common identity",
    option5Detail:
      "Strong group distinctions inevitably breed conflict — shared identity is essential.",
  },

  // --- AXIS 9: Human Nature ---
  {
    id: "sc-9-1",
    axisId: 9,
    itemNumber: 1,
    questionStem:
      "How much can deliberate policy change the fundamental patterns of human social behavior?",
    option1Label: "Almost entirely",
    option1Detail:
      "Social structures determine behavior — better structures produce better outcomes.",
    option2Label: "Substantially",
    option2Detail:
      "Change takes sustained effort, but policy can reshape behavior meaningfully over time.",
    option3Label: "Moderately",
    option3Detail:
      "Policy can shift behavior within limits set by human nature.",
    option4Label: "Somewhat",
    option4Detail:
      "Human nature constrains what policy can realistically achieve.",
    option5Label: "Very little",
    option5Detail:
      "Human nature is relatively fixed — policy should work with it, not against it.",
  },
  {
    id: "sc-9-2",
    axisId: 9,
    itemNumber: 2,
    questionStem:
      "When a society observes persistent differences in outcomes between groups, what is the most productive response?",
    option1Label: "Equalize outcomes",
    option1Detail:
      "Redesign institutions until outcomes are equal — persistent gaps prove the system is failing.",
    option2Label: "Reform actively",
    option2Detail:
      "Reform institutions to remove barriers, tracking outcomes as a measure of progress.",
    option3Label: "Ensure equal access",
    option3Detail:
      "Ensure equal access and opportunity, then accept that outcomes may vary for many reasons.",
    option4Label: "Protect individual rights",
    option4Detail:
      "Focus on protecting individual rights and freedoms rather than measuring group outcomes.",
    option5Label: "Accept variation",
    option5Detail:
      "Different outcomes are a natural feature of diverse societies — forced equalization creates new problems.",
  },
  {
    id: "sc-9-3",
    axisId: 9,
    itemNumber: 3,
    questionStem:
      "To what extent are social hierarchies an inevitable feature of human societies?",
    option1Label: "Not at all",
    option1Detail:
      "Hierarchies are entirely constructed and can be entirely eliminated through better design.",
    option2Label: "Mostly not",
    option2Detail:
      "Most current hierarchies are unjust and can be dismantled, though some coordination structures are needed.",
    option3Label: "Partially",
    option3Detail:
      "Some hierarchy may be natural, but much of it is socially constructed and changeable.",
    option4Label: "Mostly inevitable",
    option4Detail:
      "Hierarchies emerge naturally in all human groups, though their specific form can be made more humane.",
    option5Label: "Entirely inevitable",
    option5Detail:
      "Social hierarchy is a fundamental feature of human nature that governance must accommodate.",
  },

  // --- AXIS 10: International Engagement ---
  {
    id: "sc-10-1",
    axisId: 10,
    itemNumber: 1,
    questionStem:
      "How willing should a nation be to accept constraints on its policies in exchange for international cooperation?",
    option1Label: "Very willing",
    option1Detail:
      "Global coordination requires real compromise from every nation, including yours.",
    option2Label: "Mostly willing",
    option2Detail:
      "With protections against agreements that cause severe domestic harm.",
    option3Label: "Selectively",
    option3Detail:
      "Depending on whether the specific agreement serves the national interest on balance.",
    option4Label: "Reluctant",
    option4Detail:
      "Only for the most critical global emergencies with clear benefits.",
    option5Label: "Very reluctant",
    option5Detail:
      "Sovereignty should be compromised only in the most extreme circumstances, if ever.",
  },
  {
    id: "sc-10-2",
    axisId: 10,
    itemNumber: 2,
    questionStem:
      "How open should a nation's borders be to the movement of people?",
    option1Label: "Fully open",
    option1Detail:
      "Freedom of movement is a fundamental human right — borders shouldn't restrict it.",
    option2Label: "Broadly open",
    option2Detail:
      "Basic screening but a presumption of entry for anyone who wants to come.",
    option3Label: "Selectively open",
    option3Detail:
      "Managed immigration based on national needs and humanitarian obligations.",
    option4Label: "Restricted",
    option4Detail:
      "Limited immigration with priority for economic contribution and cultural compatibility.",
    option5Label: "Highly restricted",
    option5Detail:
      "Borders define a nation's identity and should be firmly controlled.",
  },
  {
    id: "sc-10-3",
    axisId: 10,
    itemNumber: 3,
    questionStem:
      "When a wealthier and a poorer nation negotiate a trade agreement, what principle should guide the terms?",
    option1Label: "Favor the poorer nation",
    option1Detail:
      "The wealthier nation should make deliberate concessions to reduce global inequality.",
    option2Label: "Moderately favor poorer",
    option2Detail:
      "Terms should somewhat favor the poorer nation to promote development.",
    option3Label: "Mutually beneficial",
    option3Detail:
      "Terms should be equally beneficial and binding for both sides.",
    option4Label: "Each pursues best deal",
    option4Detail:
      "Negotiations are inherently competitive — each side should seek its own advantage.",
    option5Label: "Use leverage",
    option5Detail:
      "The wealthier nation should use its leverage to secure the best terms for its own citizens.",
  },

  // --- AXIS 11: Military Policy ---
  {
    id: "sc-11-1",
    axisId: 11,
    itemNumber: 1,
    questionStem:
      "How much should a nation spend on its military relative to other priorities?",
    option1Label: "As little as possible",
    option1Detail:
      "Only enough for minimal border defense — nothing more.",
    option2Label: "Modestly",
    option2Detail:
      "Enough for credible self-defense but no power projection beyond borders.",
    option3Label: "Moderately",
    option3Detail:
      "Sufficient for self-defense and limited alliance commitments.",
    option4Label: "Substantially",
    option4Detail:
      "Enough to project force regionally and actively support allies.",
    option5Label: "As much as needed",
    option5Detail:
      "Military superiority is essential to national security and global stability.",
  },
  {
    id: "sc-11-2",
    axisId: 11,
    itemNumber: 2,
    questionStem:
      "Under what circumstances is military force beyond your own borders acceptable?",
    option1Label: "Never",
    option1Detail:
      "Military force should only ever be used in direct self-defense of your own territory.",
    option2Label: "Imminent attack only",
    option2Detail:
      "Only in response to a direct, imminent attack on the nation or its closest allies.",
    option3Label: "Authorized humanitarian",
    option3Detail:
      "When authorized by a legitimate international body to stop an ongoing humanitarian catastrophe.",
    option4Label: "Strategic interests",
    option4Detail:
      "When national strategic interests are seriously threatened, even without imminent attack.",
    option5Label: "Whenever determined",
    option5Detail:
      "Whenever the nation's leaders determine it serves the national interest — force is a normal tool.",
  },
  {
    id: "sc-11-3",
    axisId: 11,
    itemNumber: 3,
    questionStem:
      "When another nation is building threatening military capability but hasn't yet acted aggressively, what's appropriate?",
    option1Label: "Pursue diplomacy",
    option1Detail:
      "Military buildups are often responses to perceived threats — de-escalate.",
    option2Label: "Strengthen alliances",
    option2Detail:
      "Diplomatic pressure and defensive readiness, but no offensive posture.",
    option3Label: "Match proportionally",
    option3Detail:
      "Build capability to maintain deterrence — match their buildup.",
    option4Label: "Build decisive advantage",
    option4Detail:
      "Ensure they can never act on their capability by maintaining clear superiority.",
    option5Label: "Consider preemption",
    option5Detail:
      "Neutralize the threat before it matures — waiting is the greater risk.",
  },

  // --- AXIS 12: Technology Governance ---
  {
    id: "sc-12-1",
    axisId: 12,
    itemNumber: 1,
    questionStem:
      "When a government must decide whether to permit a powerful but poorly understood new technology, where should the burden of proof fall?",
    option1Label: "Entirely on innovators",
    option1Detail:
      "Nothing should be deployed until conclusively proven safe.",
    option2Label: "Mostly on innovators",
    option2Detail:
      "Presume restriction until safety is demonstrated through rigorous testing.",
    option3Label: "Balanced",
    option3Detail:
      "Both those pushing for adoption and those pushing for restriction should make their case.",
    option4Label: "Mostly on restrictors",
    option4Detail:
      "Presume permission unless clear, specific dangers are demonstrated.",
    option5Label: "Entirely on restrictors",
    option5Detail:
      "Innovation should be the default — restriction requires strong justification.",
  },
  {
    id: "sc-12-2",
    axisId: 12,
    itemNumber: 2,
    questionStem:
      "How should the state relate to technologies that could dramatically change human life?",
    option1Label: "Strictly control",
    option1Detail:
      "Restrict development and deployment until long-term effects are well understood.",
    option2Label: "Regulate proactively",
    option2Detail:
      "Establish safety frameworks before technologies mature and deploy widely.",
    option3Label: "Regulate reactively",
    option3Detail:
      "Allow development and intervene when specific harms emerge in practice.",
    option4Label: "Encourage with light touch",
    option4Detail:
      "Minimal regulation — innovation is how societies solve their hardest problems.",
    option5Label: "Actively accelerate",
    option5Detail:
      "Fund and accelerate development — the faster these technologies mature, the better for everyone.",
  },
  {
    id: "sc-12-3",
    axisId: 12,
    itemNumber: 3,
    questionStem:
      "When government-funded research produces a discovery with both enormous benefit and significant harm potential, what should happen?",
    option1Label: "Classify or suppress",
    option1Detail:
      "Some knowledge is too dangerous to release — restrict access entirely.",
    option2Label: "Publish to vetted groups",
    option2Detail:
      "Share only with vetted institutions under strict controls on application.",
    option3Label: "Publish with guidelines",
    option3Detail:
      "Full publication with clear guidelines on responsible use, but no access restrictions.",
    option4Label: "Fully open",
    option4Detail:
      "Open knowledge produces better outcomes than controlled knowledge — publish everything.",
    option5Label: "Publish and promote",
    option5Detail:
      "Actively promote adoption — accelerating the benefits outweighs the risks.",
  },
];
