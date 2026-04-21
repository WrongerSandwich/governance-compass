import type { RegionKey } from "../../src/lib/study/types";
import type { PersonaRecord } from "../../src/lib/study/types";
import { normalizeLocation } from "./country-name-normalization";

export const COUNTRY_REGION_MAP: Record<string, RegionKey> = {
  // East Asia
  CHN: "east_asia",
  HKG: "east_asia",
  JPN: "east_asia",
  KOR: "east_asia",
  MAC: "east_asia",
  MNG: "east_asia",
  PRK: "east_asia",
  TWN: "east_asia",

  // Eastern Europe & Central Asia
  ALB: "eastern_europe_central_asia",
  ARM: "eastern_europe_central_asia",
  AZE: "eastern_europe_central_asia",
  BGR: "eastern_europe_central_asia",
  BIH: "eastern_europe_central_asia",
  BLR: "eastern_europe_central_asia",
  CZE: "eastern_europe_central_asia",
  EST: "eastern_europe_central_asia",
  GEO: "eastern_europe_central_asia",
  HRV: "eastern_europe_central_asia",
  HUN: "eastern_europe_central_asia",
  KAZ: "eastern_europe_central_asia",
  KGZ: "eastern_europe_central_asia",
  LTU: "eastern_europe_central_asia",
  LVA: "eastern_europe_central_asia",
  MDA: "eastern_europe_central_asia",
  MKD: "eastern_europe_central_asia",
  POL: "eastern_europe_central_asia",
  ROU: "eastern_europe_central_asia",
  RUS: "eastern_europe_central_asia",
  SRB: "eastern_europe_central_asia",
  SVK: "eastern_europe_central_asia",
  TJK: "eastern_europe_central_asia",
  UKR: "eastern_europe_central_asia",
  UZB: "eastern_europe_central_asia",

  // Latin America
  ARG: "latin_america",
  BOL: "latin_america",
  BRA: "latin_america",
  CHL: "latin_america",
  COL: "latin_america",
  CRI: "latin_america",
  CUB: "latin_america",
  DOM: "latin_america",
  ECU: "latin_america",
  GTM: "latin_america",
  GUY: "latin_america",
  HND: "latin_america",
  HTI: "latin_america",
  JAM: "latin_america",
  MEX: "latin_america",
  NIC: "latin_america",
  PAN: "latin_america",
  PER: "latin_america",
  PRY: "latin_america",
  SLV: "latin_america",
  TTO: "latin_america",
  URY: "latin_america",
  VEN: "latin_america",

  // Middle East & North Africa
  ARE: "middle_east_north_africa",
  BHR: "middle_east_north_africa",
  DZA: "middle_east_north_africa",
  EGY: "middle_east_north_africa",
  IRN: "middle_east_north_africa",
  IRQ: "middle_east_north_africa",
  ISR: "middle_east_north_africa",
  JOR: "middle_east_north_africa",
  KWT: "middle_east_north_africa",
  LBN: "middle_east_north_africa",
  LBY: "middle_east_north_africa",
  MAR: "middle_east_north_africa",
  OMN: "middle_east_north_africa",
  PSE: "middle_east_north_africa",
  QAT: "middle_east_north_africa",
  SAU: "middle_east_north_africa",
  SDN: "middle_east_north_africa",
  SYR: "middle_east_north_africa",
  TUN: "middle_east_north_africa",
  TUR: "middle_east_north_africa",
  YEM: "middle_east_north_africa",

  // North America
  CAN: "north_america",
  USA: "north_america",

  // Oceania & Small States
  AUS: "oceania_small_states",
  COK: "oceania_small_states",
  FJI: "oceania_small_states",
  FSM: "oceania_small_states",
  KIR: "oceania_small_states",
  MHL: "oceania_small_states",
  NIU: "oceania_small_states",
  NRU: "oceania_small_states",
  NZL: "oceania_small_states",
  PLW: "oceania_small_states",
  PNG: "oceania_small_states",
  SLB: "oceania_small_states",
  TON: "oceania_small_states",
  TUV: "oceania_small_states",
  VUT: "oceania_small_states",
  WLF: "oceania_small_states",
  WSM: "oceania_small_states",

  // South & Southeast Asia
  BGD: "south_southeast_asia",
  IDN: "south_southeast_asia",
  IND: "south_southeast_asia",
  KHM: "south_southeast_asia",
  LAO: "south_southeast_asia",
  LKA: "south_southeast_asia",
  MMR: "south_southeast_asia",
  MYS: "south_southeast_asia",
  NPL: "south_southeast_asia",
  PAK: "south_southeast_asia",
  PHL: "south_southeast_asia",
  SGP: "south_southeast_asia",
  THA: "south_southeast_asia",
  VNM: "south_southeast_asia",

  // Sub-Saharan Africa
  AGO: "sub_saharan_africa",
  BEN: "sub_saharan_africa",
  BWA: "sub_saharan_africa",
  CIV: "sub_saharan_africa",
  CMR: "sub_saharan_africa",
  COD: "sub_saharan_africa",
  ERI: "sub_saharan_africa",
  ETH: "sub_saharan_africa",
  GHA: "sub_saharan_africa",
  GMB: "sub_saharan_africa",
  KEN: "sub_saharan_africa",
  MLI: "sub_saharan_africa",
  MOZ: "sub_saharan_africa",
  MWI: "sub_saharan_africa",
  NAM: "sub_saharan_africa",
  NER: "sub_saharan_africa",
  NGA: "sub_saharan_africa",
  RWA: "sub_saharan_africa",
  SEN: "sub_saharan_africa",
  SLE: "sub_saharan_africa",
  SOM: "sub_saharan_africa",
  SSD: "sub_saharan_africa",
  TZA: "sub_saharan_africa",
  UGA: "sub_saharan_africa",
  ZAF: "sub_saharan_africa",
  ZMB: "sub_saharan_africa",
  ZWE: "sub_saharan_africa",

  // Western Europe
  AUT: "western_europe",
  BEL: "western_europe",
  CHE: "western_europe",
  DEU: "western_europe",
  DNK: "western_europe",
  ESP: "western_europe",
  FIN: "western_europe",
  FRA: "western_europe",
  GBR: "western_europe",
  GRC: "western_europe",
  IRL: "western_europe",
  ITA: "western_europe",
  NLD: "western_europe",
  NOR: "western_europe",
  PRT: "western_europe",
  SWE: "western_europe",
};

export function getRegionForIso3(iso3: string): RegionKey | null {
  return COUNTRY_REGION_MAP[iso3] ?? null;
}

export type VerificationWarning = {
  persona_id: string;
  location: string;
  country_iso: string;
  authored_region: RegionKey;
  mapped_region: RegionKey;
};

export type VerificationResult = {
  warnings: VerificationWarning[];
  coverage: number;
};

export function verifyCountryRegionMapping(
  personas: PersonaRecord[]
): VerificationResult {
  const warnings: VerificationWarning[] = [];
  let covered = 0;

  for (const persona of personas) {
    const normalized = normalizeLocation(persona.location);
    if (!normalized) continue;

    const mappedRegion = getRegionForIso3(normalized.iso3);
    if (!mappedRegion) continue;

    covered++;

    if (mappedRegion !== (persona.region as RegionKey)) {
      const warning: VerificationWarning = {
        persona_id: persona.id,
        location: persona.location,
        country_iso: normalized.iso3,
        authored_region: persona.region as RegionKey,
        mapped_region: mappedRegion,
      };
      warnings.push(warning);
      console.warn(
        `[country-region] Conflict: ${persona.id} at "${persona.location}" ` +
          `(${normalized.iso3}) — authored region "${persona.region}", ` +
          `mapped region "${mappedRegion}". Trusting authored region.`
      );
    }
  }

  return {
    warnings,
    coverage: covered / personas.length,
  };
}
