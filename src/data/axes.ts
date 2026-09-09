export interface AxisData {
  id: number;
  name: string;
  poleALabel: string;
  poleBLabel: string;
  tagline: string;
  domain: string;
  domainOrder: number;
  order: number;
  /** One sentence on what a wide gap between two respondents means here. */
  divergenceNote: string;
}

export const axes: AxisData[] = [
  // DOMAIN A: ECONOMIC ORGANIZATION
  {
    id: 1,
    name: "Economic Model",
    poleALabel: "Collective Provision",
    poleBLabel: "Market Allocation",
    tagline: "How much should the state shape economic outcomes?",
    domain: "Economic Organization",
    domainOrder: 1,
    order: 1,
    divergenceNote:
      "One would have the state shape outcomes directly; the other leaves allocation to markets.",
  },
  {
    id: 2,
    name: "Environmental Policy",
    poleALabel: "Ecological Limits",
    poleBLabel: "Growth Imperative",
    tagline: "Can prosperity and planetary limits coexist?",
    domain: "Economic Organization",
    domainOrder: 2,
    order: 2,
    divergenceNote:
      "A gap over whether ecological limits bind growth, or growth can be reconciled with them.",
  },
  // DOMAIN B: POWER AND AUTHORITY
  {
    id: 3,
    name: "Governance Structure",
    poleALabel: "Distributed Governance",
    poleBLabel: "Centralized Governance",
    tagline: "Should power sit locally or nationally?",
    domain: "Power and Authority",
    domainOrder: 1,
    order: 3,
    divergenceNote:
      "One would push decisions down to local bodies; the other keeps them national.",
  },
  {
    id: 4,
    name: "Decision Authority",
    poleALabel: "Popular Sovereignty",
    poleBLabel: "Institutional Authority",
    tagline: "Whose judgment should guide policy \u2014 the public\u2019s or the experts\u2019?",
    domain: "Power and Authority",
    domainOrder: 2,
    order: 4,
    divergenceNote:
      "One respondent trusts public judgment; the other places weight on institutional expertise.",
  },
  {
    id: 5,
    name: "Rights Balance",
    poleALabel: "Liberty",
    poleBLabel: "Security",
    tagline: "When freedom and safety conflict, which wins?",
    domain: "Power and Authority",
    domainOrder: 3,
    order: 5,
    divergenceNote:
      "A wide gap on how much liberty a state may trade away for security.",
  },
  {
    id: 6,
    name: "Legitimacy Basis",
    poleALabel: "Electoral Process",
    poleBLabel: "Performance Outcomes",
    tagline: "Does legitimacy come from elections or from results?",
    domain: "Power and Authority",
    domainOrder: 4,
    order: 6,
    divergenceNote:
      "One grounds authority in how leaders are chosen; the other in what they deliver.",
  },
  // DOMAIN C: SOCIETY AND IDENTITY
  {
    id: 7,
    name: "Social Change",
    poleALabel: "Progressive Change",
    poleBLabel: "Continuity and Tradition",
    tagline: "Should inherited institutions be reformed or preserved?",
    domain: "Society and Identity",
    domainOrder: 1,
    order: 7,
    divergenceNote:
      "Disagreement over whether inherited institutions should be reformed or preserved.",
  },
  {
    id: 8,
    name: "Cultural Diversity",
    poleALabel: "Pluralism",
    poleBLabel: "Cohesion",
    tagline: "Is diversity or shared identity more essential?",
    domain: "Society and Identity",
    domainOrder: 2,
    order: 8,
    divergenceNote:
      "One treats plurality as a strength; the other prioritises a shared civic identity.",
  },
  {
    id: 9,
    name: "Human Nature",
    poleALabel: "Constructivism",
    poleBLabel: "Essentialism",
    tagline: "Is human nature mostly shaped by culture, or mostly fixed?",
    domain: "Society and Identity",
    domainOrder: 3,
    order: 9,
    divergenceNote:
      "Disagreement over how far behaviour is shaped by culture rather than fixed.",
  },
  // DOMAIN D: THE STATE IN THE WORLD
  {
    id: 10,
    name: "International Engagement",
    poleALabel: "Internationalism",
    poleBLabel: "Sovereignty",
    tagline: "Should nations cooperate deeply or govern independently?",
    domain: "The State in the World",
    domainOrder: 1,
    order: 10,
    divergenceNote:
      "One would bind the nation into deeper cooperation; the other guards independent action.",
  },
  {
    id: 11,
    name: "Military Policy",
    poleALabel: "Non-Interventionism",
    poleBLabel: "Interventionism",
    tagline: "Should a nation\u2019s military role extend beyond its own borders?",
    domain: "The State in the World",
    domainOrder: 2,
    order: 11,
    divergenceNote:
      "A wide gap on whether force has a legitimate role beyond national borders.",
  },
  {
    id: 12,
    name: "Technology Governance",
    poleALabel: "Precautionary",
    poleBLabel: "Innovation-First",
    tagline: "Restrict new technology until safe, or build and correct?",
    domain: "The State in the World",
    domainOrder: 3,
    order: 12,
    divergenceNote:
      "One would restrain new technology until it is proven safe; the other would build and correct.",
  },
];
