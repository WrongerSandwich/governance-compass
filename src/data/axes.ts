export interface AxisData {
  id: number;
  name: string;
  poleALabel: string;
  poleBLabel: string;
  domain: string;
  domainOrder: number;
  order: number;
}

export const axes: AxisData[] = [
  // DOMAIN A: ECONOMIC ORGANIZATION
  {
    id: 1,
    name: "Economic Model",
    poleALabel: "Collective Provision",
    poleBLabel: "Market Allocation",
    domain: "Economic Organization",
    domainOrder: 1,
    order: 1,
  },
  {
    id: 2,
    name: "Environmental Policy",
    poleALabel: "Ecological Limits",
    poleBLabel: "Growth Imperative",
    domain: "Economic Organization",
    domainOrder: 2,
    order: 2,
  },
  // DOMAIN B: POWER AND AUTHORITY
  {
    id: 3,
    name: "Governance Structure",
    poleALabel: "Distributed Governance",
    poleBLabel: "Centralized Governance",
    domain: "Power and Authority",
    domainOrder: 1,
    order: 3,
  },
  {
    id: 4,
    name: "Decision Authority",
    poleALabel: "Popular Sovereignty",
    poleBLabel: "Institutional Authority",
    domain: "Power and Authority",
    domainOrder: 2,
    order: 4,
  },
  {
    id: 5,
    name: "Rights Balance",
    poleALabel: "Liberty",
    poleBLabel: "Security",
    domain: "Power and Authority",
    domainOrder: 3,
    order: 5,
  },
  {
    id: 6,
    name: "Legitimacy Basis",
    poleALabel: "Electoral Process",
    poleBLabel: "Performance Outcomes",
    domain: "Power and Authority",
    domainOrder: 4,
    order: 6,
  },
  // DOMAIN C: SOCIETY AND IDENTITY
  {
    id: 7,
    name: "Social Change",
    poleALabel: "Progressive Change",
    poleBLabel: "Continuity and Tradition",
    domain: "Society and Identity",
    domainOrder: 1,
    order: 7,
  },
  {
    id: 8,
    name: "Cultural Diversity",
    poleALabel: "Pluralism",
    poleBLabel: "Cohesion",
    domain: "Society and Identity",
    domainOrder: 2,
    order: 8,
  },
  {
    id: 9,
    name: "Human Nature",
    poleALabel: "Constructivism",
    poleBLabel: "Essentialism",
    domain: "Society and Identity",
    domainOrder: 3,
    order: 9,
  },
  // DOMAIN D: THE STATE IN THE WORLD
  {
    id: 10,
    name: "International Engagement",
    poleALabel: "Internationalism",
    poleBLabel: "Sovereignty",
    domain: "The State in the World",
    domainOrder: 1,
    order: 10,
  },
  {
    id: 11,
    name: "Military Policy",
    poleALabel: "Non-Interventionism",
    poleBLabel: "Interventionism",
    domain: "The State in the World",
    domainOrder: 2,
    order: 11,
  },
  {
    id: 12,
    name: "Technology Governance",
    poleALabel: "Precautionary",
    poleBLabel: "Innovation-First",
    domain: "The State in the World",
    domainOrder: 3,
    order: 12,
  },
];
