export interface ConsequenceTier {
  range: [number, number]; // [min, max] inclusive
  text: string;
}

export interface MinistryData {
  id: number;
  name: string;
  description: string;
  consequences: ConsequenceTier[];
}

export interface MinistryAxisMappingData {
  ministryId: number;
  axisId: number;
  direction: -1 | 1;
}

function tier(min: number, max: number, text: string): ConsequenceTier {
  return { range: [min, max], text };
}

export const ministries: MinistryData[] = [
  {
    id: 1,
    name: "Defense",
    description: "Military capability, border security, and national defense",
    consequences: [
      tier(1, 2, "Your nation cannot defend its borders without relying entirely on allied support."),
      tier(3, 5, "A small defensive force exists, but has no capacity to respond to serious threats."),
      tier(6, 8, "A credible military that can defend borders and honor basic alliance commitments."),
      tier(9, 12, "A capable force that can project power regionally and lead coalition operations."),
      tier(13, 25, "A global military presence with decisive superiority in your region."),
    ],
  },
  {
    id: 2,
    name: "Public Welfare",
    description: "Healthcare, housing, unemployment support, disability, pensions, and social safety net",
    consequences: [
      tier(1, 2, "No universal healthcare. Poverty rates soar. The elderly and disabled are unprotected."),
      tier(3, 5, "Basic emergency healthcare only. Long wait times. A thin safety net with major gaps."),
      tier(6, 8, "Functional public healthcare and a reliable safety net for those in need."),
      tier(9, 12, "Comprehensive healthcare with short wait times. Robust support for vulnerable populations."),
      tier(13, 25, "World-class universal healthcare. Generous pensions, housing support, and family services."),
    ],
  },
  {
    id: 3,
    name: "Economy & Growth",
    description: "Business development, trade, infrastructure, transportation, and job creation",
    consequences: [
      tier(1, 2, "Crumbling roads and bridges. Businesses leave. Unemployment rises steadily."),
      tier(3, 5, "Aging infrastructure. Slow economic growth. Limited support for new industries."),
      tier(6, 8, "Maintained infrastructure and steady economic development. Competitive but not leading."),
      tier(9, 12, "Modern infrastructure. Strong business climate. Active investment in emerging industries."),
      tier(13, 25, "Cutting-edge infrastructure. A global hub for commerce, innovation, and trade."),
    ],
  },
  {
    id: 4,
    name: "Education & Research",
    description: "Schools, universities, vocational training, and scientific research",
    consequences: [
      tier(1, 2, "Overcrowded classrooms. Teacher shortages. Scientific research effectively halted."),
      tier(3, 5, "Underfunded schools. Limited university access. Research funding restricted to essentials."),
      tier(6, 8, "Functional public education system. Competitive universities. Steady research output."),
      tier(9, 12, "Well-resourced schools. Accessible higher education. Your nation attracts global researchers."),
      tier(13, 25, "World-leading education at every level. A global center for scientific discovery."),
    ],
  },
  {
    id: 5,
    name: "Environment",
    description: "Conservation, pollution control, climate policy, and natural resource management",
    consequences: [
      tier(1, 2, "No enforcement of environmental standards. Pollution goes unchecked. Ecosystems degrade."),
      tier(3, 5, "Basic pollution controls only. Conservation is underfunded. Climate commitments are unmet."),
      tier(6, 8, "Environmental standards are maintained and enforced. Steady progress on climate goals."),
      tier(9, 12, "Strong conservation programs. Ambitious climate policy. Clean energy investment accelerates."),
      tier(13, 25, "Global leader in environmental protection. A model for sustainable development."),
    ],
  },
  {
    id: 6,
    name: "Justice & Civil Liberties",
    description: "Courts, legal aid, policing, constitutional rights protection, and civil liberties oversight",
    consequences: [
      tier(1, 2, "Courts are backlogged for years. Legal aid is nonexistent. Civil liberties oversight collapses."),
      tier(3, 5, "Slow justice system. Limited public defense. Rights protections are inconsistently enforced."),
      tier(6, 8, "Courts function reasonably. Citizens have access to legal aid. Rights are protected in practice."),
      tier(9, 12, "Efficient courts. Strong public defense. Active civil liberties monitoring and enforcement."),
      tier(13, 25, "A gold-standard justice system. Rigorous rights protections. A model for rule of law globally."),
    ],
  },
  {
    id: 7,
    name: "Foreign Affairs",
    description: "Diplomacy, international organizations, foreign aid, and treaty obligations",
    consequences: [
      tier(1, 2, "Embassies close. Treaty obligations go unmet. Your nation is absent from international forums."),
      tier(3, 5, "Minimal diplomatic presence. Limited ability to negotiate or influence international policy."),
      tier(6, 8, "A functional diplomatic corps. Your nation participates in major international institutions."),
      tier(9, 12, "Active diplomacy. Meaningful influence in international negotiations. Robust foreign aid program."),
      tier(13, 25, "A dominant diplomatic force. Your nation shapes global policy and leads international coalitions."),
    ],
  },
];

export function getConsequenceText(ministry: MinistryData, value: number): string {
  for (const tier of ministry.consequences) {
    if (value >= tier.range[0] && value <= tier.range[1]) {
      return tier.text;
    }
  }
  return ministry.consequences[ministry.consequences.length - 1].text;
}

export const ministryAxisMappings: MinistryAxisMappingData[] = [
  // Defense → Axis 5 (Security, B) and Axis 11 (Interventionism, B)
  { ministryId: 1, axisId: 5, direction: 1 },
  { ministryId: 1, axisId: 11, direction: 1 },
  // Public Welfare → Axis 1 (Collective Provision, A)
  { ministryId: 2, axisId: 1, direction: -1 },
  // Economy & Growth → Axis 1 (Market Allocation, B) and Axis 2 (Growth Imperative, B)
  { ministryId: 3, axisId: 1, direction: 1 },
  { ministryId: 3, axisId: 2, direction: 1 },
  // Education & Research → Axis 4 (Institutional Authority, B) and Axis 12 (Innovation, B)
  { ministryId: 4, axisId: 4, direction: 1 },
  { ministryId: 4, axisId: 12, direction: 1 },
  // Environment → Axis 2 (Ecological Limits, A)
  { ministryId: 5, axisId: 2, direction: -1 },
  // Justice & Civil Liberties → Axis 5 (Liberty, A) and Axis 6 (Electoral Process, A)
  { ministryId: 6, axisId: 5, direction: -1 },
  { ministryId: 6, axisId: 6, direction: -1 },
  // Foreign Affairs → Axis 10 (Internationalism, A)
  { ministryId: 7, axisId: 10, direction: -1 },
];
