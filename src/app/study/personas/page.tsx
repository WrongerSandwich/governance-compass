import fs from "node:fs/promises";
import path from "node:path";
import { PersonasPageClient } from "@/components/study/PersonasPageClient";
import type {
  PersonaSlim,
  RegionalAggregate,
  CountryAggregate,
} from "@/lib/study/types";

// This is a server component that loads all catalog data server-side and
// passes it as props to the client component. Avoids client-side data
// waterfalling and ensures the catalog is always synchronously available.

const DERIVED_DIR = path.join(process.cwd(), "public", "study", "derived");

export const metadata = {
  title: "Personas — Synthetic Study",
  description:
    "Browse all 1,002 synthetic personas from the April 2026 Governance Compass study.",
};

export default async function PersonasPage() {
  const [catalogRaw, regionalRaw, countryRaw] = await Promise.all([
    fs.readFile(path.join(DERIVED_DIR, "personas_slim.json"), "utf-8"),
    fs.readFile(path.join(DERIVED_DIR, "regional_aggregates.json"), "utf-8"),
    fs.readFile(path.join(DERIVED_DIR, "country_aggregates.json"), "utf-8"),
  ]);

  const catalog = JSON.parse(catalogRaw) as PersonaSlim[];
  const regionalAggregates = JSON.parse(regionalRaw) as RegionalAggregate[];
  const countryAggregates = JSON.parse(countryRaw) as CountryAggregate[];

  return (
    <PersonasPageClient
      catalog={catalog}
      regionalAggregates={regionalAggregates}
      countryAggregates={countryAggregates}
    />
  );
}
