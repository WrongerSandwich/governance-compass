/**
 * Build script: derive region-level TopoJSON from Natural Earth 110m countries.
 *
 * Usage: npm run build:geo
 * Output: public/geo/world-regions-110m.json
 */

import * as fs from "fs";
import * as path from "path";
import { merge } from "topojson-client";
import type { Topology, GeometryCollection, Polygon, MultiPolygon } from "topojson-specification";
import { COUNTRY_REGION_MAP } from "./data/country-region-mapping";
import type { RegionKey } from "../src/lib/study/types";

// ---------------------------------------------------------------------------
// Numeric ISO 3166-1 → Alpha-3 mapping
// Covers all 177 geometries in the Natural Earth 110m file.
// ---------------------------------------------------------------------------
const NUMERIC_TO_ALPHA3: Record<string, string> = {
  "004": "AFG",
  "008": "ALB",
  "012": "DZA",
  "024": "AGO",
  "031": "AZE",
  "032": "ARG",
  "036": "AUS",
  "040": "AUT",
  "044": "BHS",
  "050": "BGD",
  "051": "ARM",
  "056": "BEL",
  "064": "BTN",
  "068": "BOL",
  "070": "BIH",
  "072": "BWA",
  "076": "BRA",
  "084": "BLZ",
  "096": "BRN",
  "100": "BGR",
  "104": "MMR",
  "108": "BDI",
  "112": "BLR",
  "116": "KHM",
  "120": "CMR",
  "124": "CAN",
  "140": "CAF",
  "144": "LKA",
  "148": "TCD",
  "152": "CHL",
  "156": "CHN",
  "158": "TWN",
  "170": "COL",
  "178": "COG",
  "180": "COD",
  "188": "CRI",
  "191": "HRV",
  "192": "CUB",
  "196": "CYP",
  "203": "CZE",
  "204": "BEN",
  "208": "DNK",
  "214": "DOM",
  "218": "ECU",
  "222": "SLV",
  "226": "GNQ",
  "231": "ETH",
  "232": "ERI",
  "233": "EST",
  "238": "FLK",
  "242": "FJI",
  "246": "FIN",
  "250": "FRA",
  "260": "ATF",
  "262": "DJI",
  "266": "GAB",
  "268": "GEO",
  "270": "GMB",
  "275": "PSE",
  "276": "DEU",
  "288": "GHA",
  "300": "GRC",
  "304": "GRL",
  "320": "GTM",
  "324": "GIN",
  "328": "GUY",
  "332": "HTI",
  "340": "HND",
  "348": "HUN",
  "352": "ISL",
  "356": "IND",
  "360": "IDN",
  "364": "IRN",
  "368": "IRQ",
  "372": "IRL",
  "376": "ISR",
  "380": "ITA",
  "384": "CIV",
  "388": "JAM",
  "392": "JPN",
  "398": "KAZ",
  "400": "JOR",
  "404": "KEN",
  "408": "PRK",
  "410": "KOR",
  "414": "KWT",
  "417": "KGZ",
  "418": "LAO",
  "422": "LBN",
  "426": "LSO",
  "428": "LVA",
  "430": "LBR",
  "434": "LBY",
  "440": "LTU",
  "442": "LUX",
  "450": "MDG",
  "454": "MWI",
  "458": "MYS",
  "466": "MLI",
  "478": "MRT",
  "484": "MEX",
  "496": "MNG",
  "498": "MDA",
  "499": "MNE",
  "504": "MAR",
  "508": "MOZ",
  "512": "OMN",
  "516": "NAM",
  "524": "NPL",
  "528": "NLD",
  "540": "NCL",
  "548": "VUT",
  "554": "NZL",
  "558": "NIC",
  "562": "NER",
  "566": "NGA",
  "578": "NOR",
  "586": "PAK",
  "591": "PAN",
  "598": "PNG",
  "600": "PRY",
  "604": "PER",
  "608": "PHL",
  "616": "POL",
  "620": "PRT",
  "624": "GNB",
  "626": "TLS",
  "630": "PRI",
  "634": "QAT",
  "642": "ROU",
  "643": "RUS",
  "646": "RWA",
  "682": "SAU",
  "686": "SEN",
  "688": "SRB",
  "694": "SLE",
  "703": "SVK",
  "704": "VNM",
  "705": "SVN",
  "706": "SOM",
  "710": "ZAF",
  "716": "ZWE",
  "724": "ESP",
  "728": "SSD",
  "729": "SDN",
  "732": "ESH",
  "090": "SLB",
  "740": "SUR",
  "748": "SWZ",
  "752": "SWE",
  "756": "CHE",
  "760": "SYR",
  "762": "TJK",
  "764": "THA",
  "768": "TGO",
  "780": "TTO",
  "784": "ARE",
  "788": "TUN",
  "792": "TUR",
  "795": "TKM",
  "800": "UGA",
  "804": "UKR",
  "807": "MKD",
  "818": "EGY",
  "826": "GBR",
  "834": "TZA",
  "840": "USA",
  "854": "BFA",
  "858": "URY",
  "860": "UZB",
  "862": "VEN",
  "887": "YEM",
  "894": "ZMB",
  // numeric IDs that are sometimes strings without leading zeros
  "10": "ATA",  // Antarctica — intentionally unmapped
};

// Geographic regions we care about (excludes diaspora_transnational)
const GEO_REGIONS: RegionKey[] = [
  "western_europe",
  "eastern_europe_central_asia",
  "east_asia",
  "latin_america",
  "middle_east_north_africa",
  "sub_saharan_africa",
  "north_america",
  "south_southeast_asia",
  "oceania_small_states",
];

// Countries intentionally excluded from any region (non-sovereign territories, disputed, etc.)
// These will be logged but not fail the build.
const EXPECTED_UNMAPPED = new Set([
  "AFG", // Afghanistan — not in persona dataset
  "ATA", // Antarctica
  "ATF", // French Southern and Antarctic Lands
  "BDI", // Burundi — not in country-region map
  "BFA", // Burkina Faso — not in persona dataset
  "BHS", // Bahamas — not in persona dataset
  "BLZ", // Belize — not in country-region map
  "BRN", // Brunei — not in country-region map
  "BTN", // Bhutan — not in country-region map
  "CAF", // Central African Rep. — not in country-region map
  "COG", // Congo (Republic) — not in country-region map (COD is, COG is not)
  "CYP", // Cyprus
  "DJI", // Djibouti
  "ESH", // Western Sahara
  "FLK", // Falkland Islands — overseas territory
  "GAB", // Gabon — not in persona dataset
  "GIN", // Guinea — not in country-region map
  "GNB", // Guinea-Bissau
  "GNQ", // Equatorial Guinea
  "GRL", // Greenland — overseas territory of Denmark
  "ISL", // Iceland — not in country-region map
  "LBR", // Liberia — not in country-region map
  "LSO", // Lesotho — not in country-region map
  "LUX", // Luxembourg — not in country-region map
  "MDG", // Madagascar — not in country-region map
  "MNE", // Montenegro — not in country-region map
  "MRT", // Mauritania — not in country-region map
  "NCL", // New Caledonia — overseas collectivity of France
  "PRI", // Puerto Rico — US territory
  "SLB", // Solomon Islands
  "SOM", // Somalia — not in country-region map
  "SUR", // Suriname — not in country-region map
  "SVN", // Slovenia — not in country-region map
  "SWZ", // eSwatini — not in country-region map
  "TCD", // Chad — not in persona dataset
  "TGO", // Togo — not in country-region map
  "TKM", // Turkmenistan — not in country-region map
  "TLS", // Timor-Leste — not in country-region map
  "TTO", // Trinidad and Tobago — not in persona dataset
  "VUT", // Vanuatu — not in country-region map
]);

interface CountryGeometry {
  type: string;
  id: string | number;
  properties: { name: string };
  arcs: unknown;
}

interface RegionFeature {
  type: "Feature";
  properties: { region: string };
  geometry: ReturnType<typeof merge>;
}

function main() {
  const inputPath = path.join(process.cwd(), "public/geo/world-110m.json");
  const outputPath = path.join(process.cwd(), "public/geo/world-regions-110m.json");

  console.log("Reading", inputPath);
  const topo = JSON.parse(fs.readFileSync(inputPath, "utf8")) as Topology;
  const countriesCollection = topo.objects.countries as GeometryCollection;
  const geometries = countriesCollection.geometries as CountryGeometry[];

  // Group geometry indices by region. A synthetic "unmapped" bucket
  // collects countries that aren't part of any persona region — those
  // still render on the world map, with a neutral no-data fill, so the
  // viewer sees a complete globe rather than gaps of missing land.
  const regionGeomIndices: Record<string, number[]> = {};
  for (const region of GEO_REGIONS) {
    regionGeomIndices[region] = [];
  }
  regionGeomIndices["unmapped"] = [];

  const unmapped: string[] = [];

  geometries.forEach((geom, idx) => {
    const rawId = String(geom.id).padStart(3, "0");
    const alpha3 = NUMERIC_TO_ALPHA3[rawId] ?? NUMERIC_TO_ALPHA3[String(geom.id)];

    if (!alpha3) {
      // No numeric mapping (e.g., Kosovo, Somaliland, N. Cyprus with undefined id)
      const name = geom.properties?.name ?? "(unnamed)";
      console.warn(`  [skip] No numeric→alpha3 mapping for id=${geom.id} (${name})`);
      // Still include on the map as unmapped land so we don't leave holes.
      regionGeomIndices["unmapped"].push(idx);
      return;
    }

    const region = COUNTRY_REGION_MAP[alpha3];

    if (!region) {
      if (!EXPECTED_UNMAPPED.has(alpha3)) {
        unmapped.push(`${alpha3} (${geom.properties?.name ?? geom.id})`);
      }
      // Expected-unmapped countries get merged into the synthetic
      // "unmapped" region so they render with a no-data fill.
      regionGeomIndices["unmapped"].push(idx);
      return;
    }

    regionGeomIndices[region].push(idx);
  });

  if (unmapped.length > 0) {
    console.error("\n[build-geo] FATAL: Unexpected unmapped countries:");
    unmapped.forEach((c) => console.error("  " + c));
    process.exit(1);
  }

  // Build region features by merging country geometries. The 9 persona
  // regions are emitted in the configured order; "unmapped" is emitted
  // last so it renders underneath (lower z in the SVG stack, though
  // react-simple-maps renders in source order → earlier = drawn first).
  const regionFeatures: RegionFeature[] = [];

  const allRegionKeys: string[] = [...GEO_REGIONS, "unmapped"];

  for (const region of allRegionKeys) {
    const indices = regionGeomIndices[region];
    if (!indices || indices.length === 0) {
      console.warn(`  [warn] No geometries for region: ${region}`);
      continue;
    }

    const regionGeometries = indices.map((i) => countriesCollection.geometries[i]);
    // topojson-client merge produces a GeoJSON MultiPolygon
    const merged = merge(topo, regionGeometries as (Polygon | MultiPolygon)[]);

    regionFeatures.push({
      type: "Feature",
      properties: { region },
      geometry: merged,
    });

    console.log(`  ${region}: merged ${indices.length} countries`);
  }

  // Ensure "unmapped" is the FIRST feature in the output so it renders
  // below the persona regions. react-simple-maps draws in array order;
  // earlier features sit behind later ones.
  const unmappedIdx = regionFeatures.findIndex(
    (f) => f.properties.region === "unmapped"
  );
  if (unmappedIdx > 0) {
    const [u] = regionFeatures.splice(unmappedIdx, 1);
    regionFeatures.unshift(u);
  }

  // Write as a TopoJSON-like structure with objects.regions
  // Actually: write as a GeoJSON FeatureCollection (react-simple-maps accepts both)
  // We'll wrap it to match the expected format with objects.regions.geometries
  // react-simple-maps accepts a URL to either TopoJSON or GeoJSON

  // Write as GeoJSON FeatureCollection — simpler and react-simple-maps accepts it
  const output = {
    type: "FeatureCollection",
    features: regionFeatures,
  };

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`\nWrote ${regionFeatures.length} region features to ${outputPath}`);
  console.log(`File size: ${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB`);
}

main();
