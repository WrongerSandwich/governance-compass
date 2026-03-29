export interface ArchetypeData {
  id: string;
  name: string;
  summary: string;
  description: string;
  characteristicTension: string;
  prototype: number[]; // 12-element array, axis scores -1.0 to +1.0
  displayOrder: number;
}

export const archetypes: ArchetypeData[] = [
  {
    id: "civic-institutionalist",
    name: "The Civic Institutionalist",
    summary:
      "Believes in democratic process above all. Favors moderate redistribution, distributed governance, and strong civil liberties.",
    description:
      "Believes in democratic process above all. Favors moderate redistribution, distributed governance, and strong civil liberties. Trusts institutions and expertise but insists they be democratically accountable. Moderate on cultural issues, neither strongly progressive nor traditional. Cautiously internationalist.",
    characteristicTension:
      "Commitment to democratic process can conflict with trust in institutional expertise when popular will produces policy that experts consider harmful.",
    prototype: [-0.3, -0.2, -0.3, 0.3, -0.5, -0.7, -0.2, 0.0, 0.0, -0.3, 0.0, 0.0],
    displayOrder: 1,
  },
  {
    id: "social-democrat",
    name: "The Social Democrat",
    summary:
      "Strongly favors collective provision, redistribution, and public services within a democratic framework.",
    description:
      "Strongly favors collective provision, redistribution, and public services within a democratic framework. Progressive on cultural issues, moderately pluralist, leans constructivist. Internationalist but not radically so. Trusts institutions and expertise to implement an egalitarian agenda. Moderate on governance structure.",
    characteristicTension:
      "Desire for comprehensive public services requires centralized state capacity, which can conflict with progressive commitments to distributed power and individual autonomy.",
    prototype: [-0.7, -0.3, 0.0, 0.2, -0.2, -0.5, -0.5, -0.3, -0.4, -0.4, -0.2, 0.0],
    displayOrder: 2,
  },
  {
    id: "free-marketeer",
    name: "The Free Marketeer",
    summary:
      "Strongly favors market allocation, economic growth, and individual economic liberty.",
    description:
      "Strongly favors market allocation, economic growth, and individual economic liberty. Skeptical of state intervention in the economy. Strongly pro-innovation. Distributed governance as a check on state power. Moderate to neutral on cultural issues — economics is the primary lens. Leans slightly toward sovereignty over internationalism.",
    characteristicTension:
      "Belief in individual liberty can conflict with acceptance of the corporate power that unregulated markets produce — market dominance is its own form of centralized authority.",
    prototype: [0.8, 0.5, -0.3, 0.0, -0.6, -0.3, 0.0, 0.0, 0.2, 0.2, 0.0, 0.6],
    displayOrder: 3,
  },
  {
    id: "communitarian-steward",
    name: "The Communitarian Steward",
    summary:
      "Envisions small-scale, rooted, sustainable communities with local self-determination.",
    description:
      "Envisions small-scale, rooted, sustainable communities. Favors ecological limits, distributed governance, and local self-determination. Culturally traditional and values social cohesion, but skeptical of centralized state power. Populist — trusts community wisdom over expert authority. Non-interventionist and precautionary toward technology. Moderate on economics — not strongly market or collectivist, but oriented toward local sufficiency.",
    characteristicTension:
      "Commitment to local autonomy can conflict with desire for cultural cohesion when different communities develop in divergent directions.",
    prototype: [-0.4, -0.8, -0.7, -0.5, -0.2, -0.3, 0.5, 0.4, 0.3, 0.3, -0.6, -0.5],
    displayOrder: 4,
  },
  {
    id: "cosmopolitan-technologist",
    name: "The Cosmopolitan Technologist",
    summary:
      "Believes global coordination and technological progress can solve most problems.",
    description:
      "Believes global coordination and technological progress can solve most problems. Strongly internationalist, pro-innovation, progressive, and pluralist. Trusts expert institutions and favors some centralization for coordination. Moderately market-oriented but comfortable with state investment in research and infrastructure. Leans constructivist.",
    characteristicTension:
      "Faith in expert governance can conflict with progressive values when technocratic recommendations cut against cultural inclusivity or individual autonomy.",
    prototype: [0.2, 0.4, 0.2, 0.6, -0.2, -0.3, -0.6, -0.5, -0.4, -0.8, 0.2, 0.8],
    displayOrder: 5,
  },
  {
    id: "developmental-modernizer",
    name: "The Developmental Modernizer",
    summary:
      "Favors strong centralized state capacity directed toward rapid modernization.",
    description:
      "Favors strong centralized state capacity directed toward rapid modernization. Pro-growth, pro-innovation, performance-legitimacy oriented. Comfortable with security over liberty tradeoffs in service of development. Culturally moderate — modernization is the priority, not cultural reform per se. Slightly interventionist and sovereignty-oriented. Trusts institutional expertise over popular input.",
    characteristicTension:
      "Performance-based legitimacy works while performance is strong — this archetype has no stable fallback when the developmental model hits limits or fails to deliver.",
    prototype: [0.3, 0.7, 0.7, 0.7, 0.4, 0.6, 0.0, 0.3, 0.2, 0.2, 0.3, 0.7],
    displayOrder: 6,
  },
  {
    id: "authoritarian-traditionalist",
    name: "The Authoritarian Traditionalist",
    summary:
      "Favors strong centralized authority, cultural cohesion, traditional values, and robust security.",
    description:
      "Favors strong centralized authority, cultural cohesion, traditional values, and robust security. Essentialist view of human nature. Performance-legitimacy oriented — distrustful of democratic process as chaotic and corrosive to social order. Moderately interventionist and sovereignty-focused. Somewhat precautionary toward technology that disrupts social structures. Populist in rhetoric (claims to speak for \"the people\") but favors institutional authority in practice. Neutral to moderate on economics.",
    characteristicTension:
      "Claims to represent ordinary people's values while concentrating power in ways that limit ordinary people's agency.",
    prototype: [0.0, 0.3, 0.8, -0.3, 0.8, 0.7, 0.9, 0.8, 0.8, 0.6, 0.4, -0.2],
    displayOrder: 7,
  },
  {
    id: "radical-egalitarian",
    name: "The Radical Egalitarian",
    summary:
      "Deeply committed to economic equality, progressive social change, and constructivist transformation.",
    description:
      "Deeply committed to economic equality, progressive social change, and constructivist transformation of society. Favors strong collective provision, distributed governance, and robust democratic process. Internationalist and non-interventionist. Somewhat precautionary. Sees most social hierarchies as constructed and unjust, and believes policy can and should dismantle them.",
    characteristicTension:
      "Transformative egalitarian goals often require concentrated state power to implement, conflicting with commitments to distributed governance and individual liberty.",
    prototype: [-0.9, -0.5, -0.5, -0.4, -0.3, -0.5, -0.8, -0.5, -0.8, -0.5, -0.5, -0.3],
    displayOrder: 8,
  },
  {
    id: "libertarian-individualist",
    name: "The Libertarian Individualist",
    summary:
      "Individual liberty is the paramount value. Deeply skeptical of state power in all forms.",
    description:
      "Individual liberty is the paramount value. Deeply skeptical of state power in all forms — economic, security, cultural. Favors market allocation, distributed governance, minimal law enforcement, and strong constitutional constraints. Pro-innovation but wary of government-directed technology. Non-interventionist. Neutral to slightly progressive on cultural issues — not deeply invested in social transformation, but opposed to the state enforcing traditional norms. Slightly essentialist — skeptical of social engineering.",
    characteristicTension:
      "Radical decentralization and minimal state capacity can leave individuals vulnerable to private concentrations of power that function much like the state authority they oppose.",
    prototype: [0.6, 0.3, -0.7, -0.4, -0.9, -0.4, -0.2, 0.0, 0.2, 0.3, -0.5, 0.5],
    displayOrder: 9,
  },
  {
    id: "nationalist-populist",
    name: "The Nationalist Populist",
    summary:
      "Strongly sovereignty-oriented and culturally cohesive, trusts ordinary people over elites.",
    description:
      "Strongly sovereignty-oriented and culturally cohesive. Deeply skeptical of both international institutions and domestic elites — trusts the common sense of ordinary people over credentialed expertise. Favors cultural assimilation and traditional values. Moderate on economics — not ideologically committed to either markets or redistribution, but oriented toward whatever serves the national working population. Somewhat security-oriented. Moderately interventionist when national interests are at stake.",
    characteristicTension:
      "Anti-elite populism coexists with support for strong state authority, requiring trust in leaders who claim to embody the people's will rather than institutional checks.",
    prototype: [0.0, 0.3, 0.3, -0.7, 0.4, 0.3, 0.5, 0.8, 0.5, 0.8, 0.2, 0.0],
    displayOrder: 10,
  },
  {
    id: "green-communalist",
    name: "The Green Communalist",
    summary:
      "Ecological sustainability is the organizing principle with radical decentralization.",
    description:
      "Ecological sustainability is the organizing principle. Favors degrowth or post-growth economics, radical decentralization, local self-sufficiency, and collective provision at the community level. Non-interventionist, precautionary toward technology, and moderately progressive. Skeptical of both state and market as drivers of ecological destruction. Internationalist in sympathy but localist in practice.",
    characteristicTension:
      "Ecological goals at planetary scale require coordination that conflicts with deep commitment to local autonomy and anti-centralization.",
    prototype: [-0.6, -0.9, -0.8, -0.5, -0.3, -0.4, -0.4, -0.2, -0.3, -0.4, -0.7, -0.6],
    displayOrder: 11,
  },
  {
    id: "pragmatic-centrist",
    name: "The Pragmatic Centrist",
    summary:
      "Sits near the midpoint on most axes, reflecting genuine moderation or contextual judgment.",
    description:
      "Sits near the midpoint on most or all axes. This may reflect genuine moderation — a considered view that most governance questions require balance and context rather than strong ideological commitments. It may also reflect low engagement or indecision. The archetype description should acknowledge both possibilities.",
    characteristicTension:
      "Pragmatic balance can be mistaken for — or can actually be — an absence of strong convictions. This archetype is defined by what it doesn't strongly favor, which can make it feel less like a worldview and more like a default.",
    // Prototype has small non-zero values reflecting characteristic centrist
    // positions (slight market lean, institutional trust, incrementalism) rather
    // than all-zeros. An all-zero prototype has a structural distance advantage
    // over every other archetype, causing "opinionated but mixed" users to match
    // centrist even when they have clear positions that cancel in Euclidean space.
    //
    // If centrist over-matching persists with real users, consider:
    //   (a) Adding a spread/variance penalty to the distance calc for this
    //       archetype — high-variance profiles are opinionated, not centrist.
    //   (b) Using the low-match threshold (55%) more aggressively: if centrist
    //       wins but the user's axis scores have high standard deviation, surface
    //       a "mixed profile" result instead of forcing the centrist label.
    prototype: [0.1, 0.1, 0.1, 0.15, 0.05, -0.1, 0.1, 0.1, 0.05, -0.1, -0.1, 0.1],
    displayOrder: 12,
  },
];
