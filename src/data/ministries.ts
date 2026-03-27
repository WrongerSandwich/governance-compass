export interface MinistryData {
  id: number;
  name: string;
  description: string;
  belowBaselineWarning: string;
}

export interface MinistryAxisMappingData {
  ministryId: number;
  axisId: number;
  direction: -1 | 1;
}

export const ministries: MinistryData[] = [
  {
    id: 1,
    name: "Social Welfare & Public Health",
    description:
      "Provides cash transfers to those in poverty, pensions for the elderly, disability support, public hospitals and clinics, epidemic preparedness, and maternal/child health programs.",
    belowBaselineWarning:
      "Funding below baseline may compromise poverty relief, disability support, and public health capacity.",
  },
  {
    id: 2,
    name: "Economic Development & Trade",
    description:
      "Funds business incentives, trade agreement negotiation, workforce retraining, industrial policy, small business support, and management of trade relationships with other nations.",
    belowBaselineWarning:
      "Funding below baseline may compromise trade competitiveness, workforce retraining, and industrial development.",
  },
  {
    id: 3,
    name: "Ecological Transition & Conservation",
    description:
      "Funds emissions reduction programs, habitat and biodiversity protection, renewable energy development, pollution monitoring and enforcement, and climate adaptation infrastructure.",
    belowBaselineWarning:
      "Funding below baseline may compromise emissions targets, habitat protection, and climate adaptation capacity.",
  },
  {
    id: 4,
    name: "Defense & Military",
    description:
      "Maintains armed forces, weapons systems, military research and development, veterans' support, and border defense infrastructure.",
    belowBaselineWarning:
      "Funding below baseline may compromise national defense readiness, veterans' support, and border security.",
  },
  {
    id: 5,
    name: "Domestic Security & Law Enforcement",
    description:
      "Funds police forces, criminal courts, prison systems, border immigration control, counter-terrorism, and public surveillance systems.",
    belowBaselineWarning:
      "Funding below baseline may compromise law enforcement capacity, criminal court operations, and counter-terrorism.",
  },
  {
    id: 6,
    name: "Education & Research",
    description:
      "Funds public schools, universities, vocational training, basic scientific research, public media and libraries, and adult education programs.",
    belowBaselineWarning:
      "Funding below baseline may compromise school quality, university access, and scientific research capacity.",
  },
  {
    id: 7,
    name: "Cultural Heritage & National Identity",
    description:
      "Supports historic site preservation, language and cultural programs, religious institution partnerships, national arts funding, public monuments, and civic ceremonies.",
    belowBaselineWarning:
      "Funding below baseline may compromise cultural preservation, heritage sites, and national civic programs.",
  },
  {
    id: 8,
    name: "Infrastructure & Technology",
    description:
      "Builds and maintains roads, rail, power grids, water systems, broadband networks, digital government platforms, and civilian technology research.",
    belowBaselineWarning:
      "Funding below baseline may compromise infrastructure maintenance, digital services, and technology development.",
  },
  {
    id: 9,
    name: "Foreign Affairs & International Cooperation",
    description:
      "Funds embassies and diplomatic staff, foreign development aid, contributions to international organizations, treaty negotiations, and humanitarian assistance abroad.",
    belowBaselineWarning:
      "Funding below baseline may compromise diplomatic capacity, international commitments, and humanitarian programs.",
  },
  {
    id: 10,
    name: "Civil Liberties & Judicial Independence",
    description:
      "Funds constitutional courts, independent judicial oversight, civil rights enforcement, privacy protection agencies, legal aid for citizens, election administration, and government transparency offices.",
    belowBaselineWarning:
      "Funding below baseline may compromise judicial independence, civil rights enforcement, and election administration.",
  },
];

export const ministryAxisMappings: MinistryAxisMappingData[] = [
  // Social Welfare & Public Health → Axis 1 (Collective Provision, A)
  { ministryId: 1, axisId: 1, direction: -1 },
  // Economic Development & Trade → Axis 1 (Market Allocation, B)
  { ministryId: 2, axisId: 1, direction: 1 },
  // Economic Development & Trade → Axis 2 (Growth Imperative, B)
  { ministryId: 2, axisId: 2, direction: 1 },
  // Ecological Transition & Conservation → Axis 2 (Ecological Limits, A)
  { ministryId: 3, axisId: 2, direction: -1 },
  // Defense & Military → Axis 11 (Interventionism, B)
  { ministryId: 4, axisId: 11, direction: 1 },
  // Domestic Security & Law Enforcement → Axis 5 (Security, B)
  { ministryId: 5, axisId: 5, direction: 1 },
  // Education & Research → Axis 4 (Institutional Authority, B)
  { ministryId: 6, axisId: 4, direction: 1 },
  // Education & Research → Axis 12 (Innovation-First, B)
  { ministryId: 6, axisId: 12, direction: 1 },
  // Cultural Heritage & National Identity → Axis 7 (Continuity and Tradition, B)
  { ministryId: 7, axisId: 7, direction: 1 },
  // Cultural Heritage & National Identity → Axis 8 (Cohesion, B)
  { ministryId: 7, axisId: 8, direction: 1 },
  // Infrastructure & Technology → Axis 2 (Growth Imperative, B)
  { ministryId: 8, axisId: 2, direction: 1 },
  // Infrastructure & Technology → Axis 12 (Innovation-First, B)
  { ministryId: 8, axisId: 12, direction: 1 },
  // Foreign Affairs & International Cooperation → Axis 10 (Internationalism, A)
  { ministryId: 9, axisId: 10, direction: -1 },
  // Civil Liberties & Judicial Independence → Axis 5 (Liberty, A)
  { ministryId: 10, axisId: 5, direction: -1 },
  // Civil Liberties & Judicial Independence → Axis 6 (Electoral Process, A)
  { ministryId: 10, axisId: 6, direction: -1 },
];
