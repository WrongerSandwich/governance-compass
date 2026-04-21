// Case-sensitivity contract: lookup is exact-case by design because the pipeline outputs title-cased names; if that contract changes, convert ALIAS_MAP keys + inputs to .normalize("NFC").toLowerCase().

export type NormalizedCountry = {
  name: string;
  iso3: string;
};

const ALIAS_MAP: Record<string, NormalizedCountry> = {
  // United States variants
  "USA": { name: "United States", iso3: "USA" },
  "United States": { name: "United States", iso3: "USA" },
  "United States of America": { name: "United States", iso3: "USA" },
  "U.S.": { name: "United States", iso3: "USA" },
  "U.S.A.": { name: "United States", iso3: "USA" },
  "America": { name: "United States", iso3: "USA" },
  "US": { name: "United States", iso3: "USA" },

  // Democratic Republic of Congo
  "DR Congo": { name: "Democratic Republic of the Congo", iso3: "COD" },
  "DRC": { name: "Democratic Republic of the Congo", iso3: "COD" },
  "Democratic Republic of Congo": { name: "Democratic Republic of the Congo", iso3: "COD" },
  "Democratic Republic of the Congo": { name: "Democratic Republic of the Congo", iso3: "COD" },

  // Côte d'Ivoire
  "Cote d'Ivoire": { name: "Côte d'Ivoire", iso3: "CIV" },
  "Côte d'Ivoire": { name: "Côte d'Ivoire", iso3: "CIV" },
  "Ivory Coast": { name: "Côte d'Ivoire", iso3: "CIV" },

  // United Kingdom variants
  "United Kingdom": { name: "United Kingdom", iso3: "GBR" },
  "UK": { name: "United Kingdom", iso3: "GBR" },
  "England": { name: "United Kingdom", iso3: "GBR" },
  "Scotland": { name: "United Kingdom", iso3: "GBR" },
  "Wales": { name: "United Kingdom", iso3: "GBR" },
  "Great Britain": { name: "United Kingdom", iso3: "GBR" },

  // Standard country names (ISO 3166 alpha-3)
  "Afghanistan": { name: "Afghanistan", iso3: "AFG" },
  "Albania": { name: "Albania", iso3: "ALB" },
  "Algeria": { name: "Algeria", iso3: "DZA" },
  "Angola": { name: "Angola", iso3: "AGO" },
  "Argentina": { name: "Argentina", iso3: "ARG" },
  "Armenia": { name: "Armenia", iso3: "ARM" },
  "Australia": { name: "Australia", iso3: "AUS" },
  "Austria": { name: "Austria", iso3: "AUT" },
  "Azerbaijan": { name: "Azerbaijan", iso3: "AZE" },
  "Bahrain": { name: "Bahrain", iso3: "BHR" },
  "Bangladesh": { name: "Bangladesh", iso3: "BGD" },
  "Belarus": { name: "Belarus", iso3: "BLR" },
  "Belgium": { name: "Belgium", iso3: "BEL" },
  "Benin": { name: "Benin", iso3: "BEN" },
  "Bolivia": { name: "Bolivia", iso3: "BOL" },
  "Bosnia and Herzegovina": { name: "Bosnia and Herzegovina", iso3: "BIH" },
  "Botswana": { name: "Botswana", iso3: "BWA" },
  "Brazil": { name: "Brazil", iso3: "BRA" },
  "Bulgaria": { name: "Bulgaria", iso3: "BGR" },
  "Cambodia": { name: "Cambodia", iso3: "KHM" },
  "Cameroon": { name: "Cameroon", iso3: "CMR" },
  "Canada": { name: "Canada", iso3: "CAN" },
  "Chile": { name: "Chile", iso3: "CHL" },
  "China": { name: "China", iso3: "CHN" },
  "Colombia": { name: "Colombia", iso3: "COL" },
  "Cook Islands": { name: "Cook Islands", iso3: "COK" },
  "Costa Rica": { name: "Costa Rica", iso3: "CRI" },
  "Croatia": { name: "Croatia", iso3: "HRV" },
  "Cuba": { name: "Cuba", iso3: "CUB" },
  "Czech Republic": { name: "Czech Republic", iso3: "CZE" },
  "Denmark": { name: "Denmark", iso3: "DNK" },
  "Dominican Republic": { name: "Dominican Republic", iso3: "DOM" },
  "Ecuador": { name: "Ecuador", iso3: "ECU" },
  "Egypt": { name: "Egypt", iso3: "EGY" },
  "El Salvador": { name: "El Salvador", iso3: "SLV" },
  "Eritrea": { name: "Eritrea", iso3: "ERI" },
  "Estonia": { name: "Estonia", iso3: "EST" },
  "Ethiopia": { name: "Ethiopia", iso3: "ETH" },
  "Federated States of Micronesia": { name: "Federated States of Micronesia", iso3: "FSM" },
  "FSM": { name: "Federated States of Micronesia", iso3: "FSM" },
  "Fiji": { name: "Fiji", iso3: "FJI" },
  "Finland": { name: "Finland", iso3: "FIN" },
  "France": { name: "France", iso3: "FRA" },
  "Gambia": { name: "Gambia", iso3: "GMB" },
  "Georgia": { name: "Georgia", iso3: "GEO" },
  "Germany": { name: "Germany", iso3: "DEU" },
  "Ghana": { name: "Ghana", iso3: "GHA" },
  "Greece": { name: "Greece", iso3: "GRC" },
  "Guatemala": { name: "Guatemala", iso3: "GTM" },
  "Guinea": { name: "Guinea", iso3: "GIN" },
  "Guyana": { name: "Guyana", iso3: "GUY" },
  "Haiti": { name: "Haiti", iso3: "HTI" },
  "Honduras": { name: "Honduras", iso3: "HND" },
  "Hong Kong": { name: "Hong Kong", iso3: "HKG" },
  "Hungary": { name: "Hungary", iso3: "HUN" },
  "India": { name: "India", iso3: "IND" },
  "Indonesia": { name: "Indonesia", iso3: "IDN" },
  "Iran": { name: "Iran", iso3: "IRN" },
  "Iraq": { name: "Iraq", iso3: "IRQ" },
  "Iraqi Kurdistan": { name: "Iraq", iso3: "IRQ" },
  "Ireland": { name: "Ireland", iso3: "IRL" },
  "Israel": { name: "Israel", iso3: "ISR" },
  "Italy": { name: "Italy", iso3: "ITA" },
  "Jamaica": { name: "Jamaica", iso3: "JAM" },
  "Japan": { name: "Japan", iso3: "JPN" },
  "Jordan": { name: "Jordan", iso3: "JOR" },
  "Kazakhstan": { name: "Kazakhstan", iso3: "KAZ" },
  "Kenya": { name: "Kenya", iso3: "KEN" },
  "Kiribati": { name: "Kiribati", iso3: "KIR" },
  "Kuwait": { name: "Kuwait", iso3: "KWT" },
  "Kyrgyzstan": { name: "Kyrgyzstan", iso3: "KGZ" },
  "Laos": { name: "Laos", iso3: "LAO" },
  "Latvia": { name: "Latvia", iso3: "LVA" },
  "Lebanon": { name: "Lebanon", iso3: "LBN" },
  "Libya": { name: "Libya", iso3: "LBY" },
  "Lithuania": { name: "Lithuania", iso3: "LTU" },
  "Macau": { name: "Macau", iso3: "MAC" },
  "Madagascar": { name: "Madagascar", iso3: "MDG" },
  "Malawi": { name: "Malawi", iso3: "MWI" },
  "Malaysia": { name: "Malaysia", iso3: "MYS" },
  "Mali": { name: "Mali", iso3: "MLI" },
  "Marshall Islands": { name: "Marshall Islands", iso3: "MHL" },
  "Mexico": { name: "Mexico", iso3: "MEX" },
  "Moldova": { name: "Moldova", iso3: "MDA" },
  "Mongolia": { name: "Mongolia", iso3: "MNG" },
  "Morocco": { name: "Morocco", iso3: "MAR" },
  "Mozambique": { name: "Mozambique", iso3: "MOZ" },
  "Myanmar": { name: "Myanmar", iso3: "MMR" },
  "Namibia": { name: "Namibia", iso3: "NAM" },
  "Nauru": { name: "Nauru", iso3: "NRU" },
  "Nepal": { name: "Nepal", iso3: "NPL" },
  "Netherlands": { name: "Netherlands", iso3: "NLD" },
  "New Zealand": { name: "New Zealand", iso3: "NZL" },
  "Nicaragua": { name: "Nicaragua", iso3: "NIC" },
  "Niger": { name: "Niger", iso3: "NER" },
  "Nigeria": { name: "Nigeria", iso3: "NGA" },
  "Niue": { name: "Niue", iso3: "NIU" },
  "North Korea": { name: "North Korea", iso3: "PRK" },
  "North Macedonia": { name: "North Macedonia", iso3: "MKD" },
  "Norway": { name: "Norway", iso3: "NOR" },
  "Oman": { name: "Oman", iso3: "OMN" },
  "Pakistan": { name: "Pakistan", iso3: "PAK" },
  "Palau": { name: "Palau", iso3: "PLW" },
  "Palestine": { name: "Palestine", iso3: "PSE" },
  "Panama": { name: "Panama", iso3: "PAN" },
  "Papua New Guinea": { name: "Papua New Guinea", iso3: "PNG" },
  "Paraguay": { name: "Paraguay", iso3: "PRY" },
  "Peru": { name: "Peru", iso3: "PER" },
  "Philippines": { name: "Philippines", iso3: "PHL" },
  "Poland": { name: "Poland", iso3: "POL" },
  "Portugal": { name: "Portugal", iso3: "PRT" },
  "Qatar": { name: "Qatar", iso3: "QAT" },
  "Romania": { name: "Romania", iso3: "ROU" },
  "Russia": { name: "Russia", iso3: "RUS" },
  "Rwanda": { name: "Rwanda", iso3: "RWA" },
  "Samoa": { name: "Samoa", iso3: "WSM" },
  "Saudi Arabia": { name: "Saudi Arabia", iso3: "SAU" },
  "Senegal": { name: "Senegal", iso3: "SEN" },
  "Serbia": { name: "Serbia", iso3: "SRB" },
  "Sierra Leone": { name: "Sierra Leone", iso3: "SLE" },
  "Singapore": { name: "Singapore", iso3: "SGP" },
  "Slovakia": { name: "Slovakia", iso3: "SVK" },
  "Solomon Islands": { name: "Solomon Islands", iso3: "SLB" },
  "Somalia": { name: "Somalia", iso3: "SOM" },
  "Somaliland": { name: "Somalia", iso3: "SOM" },
  "South Africa": { name: "South Africa", iso3: "ZAF" },
  "South Korea": { name: "South Korea", iso3: "KOR" },
  "South Sudan": { name: "South Sudan", iso3: "SSD" },
  "Spain": { name: "Spain", iso3: "ESP" },
  "Sri Lanka": { name: "Sri Lanka", iso3: "LKA" },
  "Sudan": { name: "Sudan", iso3: "SDN" },
  "Sweden": { name: "Sweden", iso3: "SWE" },
  "Switzerland": { name: "Switzerland", iso3: "CHE" },
  "Syria": { name: "Syria", iso3: "SYR" },
  "Taiwan": { name: "Taiwan", iso3: "TWN" },
  "Tajikistan": { name: "Tajikistan", iso3: "TJK" },
  "Tanzania": { name: "Tanzania", iso3: "TZA" },
  "Thailand": { name: "Thailand", iso3: "THA" },
  "Tonga": { name: "Tonga", iso3: "TON" },
  "Trinidad and Tobago": { name: "Trinidad and Tobago", iso3: "TTO" },
  "Tunisia": { name: "Tunisia", iso3: "TUN" },
  "Turkey": { name: "Turkey", iso3: "TUR" },
  "Tuvalu": { name: "Tuvalu", iso3: "TUV" },
  "Uganda": { name: "Uganda", iso3: "UGA" },
  "Ukraine": { name: "Ukraine", iso3: "UKR" },
  "UAE": { name: "United Arab Emirates", iso3: "ARE" },
  "United Arab Emirates": { name: "United Arab Emirates", iso3: "ARE" },
  "Uruguay": { name: "Uruguay", iso3: "URY" },
  "Uzbekistan": { name: "Uzbekistan", iso3: "UZB" },
  "Vanuatu": { name: "Vanuatu", iso3: "VUT" },
  "Venezuela": { name: "Venezuela", iso3: "VEN" },
  "Vietnam": { name: "Vietnam", iso3: "VNM" },
  "Wallis and Futuna": { name: "Wallis and Futuna", iso3: "WLF" },
  "West Bank": { name: "Palestine", iso3: "PSE" },
  "Gaza Strip": { name: "Palestine", iso3: "PSE" },
  "Yemen": { name: "Yemen", iso3: "YEM" },
  "Zambia": { name: "Zambia", iso3: "ZMB" },
  "Zimbabwe": { name: "Zimbabwe", iso3: "ZWE" },
};

// Substring fallback: last resort; longer keys win to avoid prefix collisions.
const ALIAS_KEYS_BY_LENGTH = Object.keys(ALIAS_MAP).sort((a, b) => b.length - a.length);

function stripParenthetical(location: string): string {
  return location.replace(/\s*\([^)]*\)/g, "").trim();
}

function extractCountryFromLocation(raw: string): string | null {
  const stripped = stripParenthetical(raw);

  const parts = stripped.split(",").map((p) => p.trim());

  for (let i = parts.length - 1; i >= 0; i--) {
    const candidate = parts[i];
    if (ALIAS_MAP[candidate]) return candidate;
  }

  for (let i = parts.length - 1; i >= 0; i--) {
    const candidate = parts[i];
    for (const alias of ALIAS_KEYS_BY_LENGTH) {
      if (candidate.includes(alias)) return alias;
    }
  }

  return null;
}

export function normalizeLocation(raw: string): NormalizedCountry | null {
  const cleaned = raw.trim();

  const countryKey = extractCountryFromLocation(cleaned);
  if (countryKey) return ALIAS_MAP[countryKey];

  const direct = ALIAS_MAP[cleaned];
  if (direct) return direct;

  console.warn(`[country-normalization] Could not normalize location: "${raw}"`);
  return null;
}

export function normalizeLocationBatch(
  locations: string[]
): Map<string, NormalizedCountry | null> {
  const result = new Map<string, NormalizedCountry | null>();
  for (const loc of locations) {
    if (!result.has(loc)) {
      result.set(loc, normalizeLocation(loc));
    }
  }
  return result;
}
