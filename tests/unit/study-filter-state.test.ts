import { describe, it, expect } from "vitest";
import {
  filtersFromSearchParams,
  filtersToSearchParams,
  DEFAULT_FILTERS,
} from "@/lib/study/filterState";
import type { StudyFilters } from "@/lib/study/filterState";

// ---------------------------------------------------------------------------
// filtersFromSearchParams
// ---------------------------------------------------------------------------

describe("filtersFromSearchParams", () => {
  it("returns empty filters for empty params", () => {
    const result = filtersFromSearchParams(new URLSearchParams());
    expect(result).toEqual({});
  });

  it("parses region", () => {
    const result = filtersFromSearchParams(
      new URLSearchParams("region=western_europe")
    );
    expect(result.region).toBe("western_europe");
  });

  it("parses cluster as a number", () => {
    const result = filtersFromSearchParams(new URLSearchParams("cluster=3"));
    expect(result.cluster).toBe(3);
  });

  it("ignores invalid cluster values", () => {
    const result = filtersFromSearchParams(new URLSearchParams("cluster=99"));
    expect(result.cluster).toBeUndefined();
  });

  it("parses archetype", () => {
    const result = filtersFromSearchParams(
      new URLSearchParams("archetype=radical-egalitarian")
    );
    expect(result.archetype).toBe("radical-egalitarian");
  });

  it("parses age_min and age_max", () => {
    const result = filtersFromSearchParams(
      new URLSearchParams("age_min=25&age_max=45")
    );
    expect(result.age_min).toBe(25);
    expect(result.age_max).toBe(45);
  });

  it("parses shared filter values", () => {
    const r1 = filtersFromSearchParams(new URLSearchParams("shared=shared_only"));
    expect(r1.shared).toBe("shared_only");

    const r2 = filtersFromSearchParams(new URLSearchParams("shared=non_shared_only"));
    expect(r2.shared).toBe("non_shared_only");

    const r3 = filtersFromSearchParams(new URLSearchParams("shared=all"));
    expect(r3.shared).toBe("all");
  });

  it("ignores invalid shared values", () => {
    const result = filtersFromSearchParams(new URLSearchParams("shared=bogus"));
    expect(result.shared).toBeUndefined();
  });

  it("parses sort values", () => {
    const r1 = filtersFromSearchParams(new URLSearchParams("sort=age"));
    expect(r1.sort).toBe("age");

    const r2 = filtersFromSearchParams(new URLSearchParams("sort=cluster"));
    expect(r2.sort).toBe("cluster");
  });

  it("ignores invalid sort values", () => {
    const result = filtersFromSearchParams(new URLSearchParams("sort=bogus"));
    expect(result.sort).toBeUndefined();
  });

  it("parses page as 1-indexed integer", () => {
    const result = filtersFromSearchParams(new URLSearchParams("page=5"));
    expect(result.page).toBe(5);
  });

  it("ignores page=0 (invalid)", () => {
    const result = filtersFromSearchParams(new URLSearchParams("page=0"));
    expect(result.page).toBeUndefined();
  });

  it("parses q (name search)", () => {
    const result = filtersFromSearchParams(new URLSearchParams("q=Eleanor"));
    expect(result.q).toBe("Eleanor");
  });

  it("parses education, governance, economic, urban_rural, gender", () => {
    const result = filtersFromSearchParams(
      new URLSearchParams(
        "education=university&governance=stable_democracy&economic=middle_class&urban_rural=rural&gender=female"
      )
    );
    expect(result.education).toBe("university");
    expect(result.governance).toBe("stable_democracy");
    expect(result.economic).toBe("middle_class");
    expect(result.urban_rural).toBe("rural");
    expect(result.gender).toBe("female");
  });
});

// ---------------------------------------------------------------------------
// filtersToSearchParams
// ---------------------------------------------------------------------------

describe("filtersToSearchParams", () => {
  it("returns empty params for empty filters", () => {
    const result = filtersToSearchParams({});
    expect(result.toString()).toBe("");
  });

  it("serializes region", () => {
    const result = filtersToSearchParams({ region: "east_asia" });
    expect(result.get("region")).toBe("east_asia");
  });

  it("serializes cluster as string", () => {
    const result = filtersToSearchParams({ cluster: 2 });
    expect(result.get("cluster")).toBe("2");
  });

  it("serializes age_min and age_max independently", () => {
    const r1 = filtersToSearchParams({ age_min: 30 });
    expect(r1.get("age_min")).toBe("30");
    expect(r1.has("age_max")).toBe(false);

    const r2 = filtersToSearchParams({ age_max: 60 });
    expect(r2.has("age_min")).toBe(false);
    expect(r2.get("age_max")).toBe("60");
  });

  it("serializes page", () => {
    const result = filtersToSearchParams({ page: 3 });
    expect(result.get("page")).toBe("3");
  });

  it("round-trips a complete filter object", () => {
    const filters: StudyFilters = {
      region: "latin_america",
      cluster: 1,
      archetype: "social-democrat",
      governance: "stable_democracy",
      economic: "working_class",
      urban_rural: "urban",
      education: "university",
      age_min: 20,
      age_max: 50,
      gender: "female",
      shared: "shared_only",
      q: "Maria",
      sort: "age",
      page: 2,
    };

    const params = filtersToSearchParams(filters);
    const restored = filtersFromSearchParams(params);
    expect(restored).toEqual(filters);
  });
});

// ---------------------------------------------------------------------------
// DEFAULT_FILTERS
// ---------------------------------------------------------------------------

describe("DEFAULT_FILTERS", () => {
  it("has the expected shape", () => {
    expect(DEFAULT_FILTERS.shared).toBe("all");
    expect(DEFAULT_FILTERS.sort).toBe("name");
    expect(DEFAULT_FILTERS.page).toBe(1);
  });
});
