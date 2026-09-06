import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// A minimal but valid TopoJSON topology: one object collection holding two
// polygons, each carrying the `region` property WorldMap reads.
const TOPOLOGY = {
  type: "Topology",
  objects: {
    regions: {
      type: "GeometryCollection",
      geometries: [
        {
          type: "Polygon",
          arcs: [[0]],
          properties: { region: "north_america" },
        },
        {
          type: "Polygon",
          arcs: [[1]],
          properties: { region: "western_europe" },
        },
      ],
    },
  },
  arcs: [
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
      [0, 0],
    ],
    [
      [2, 2],
      [3, 2],
      [3, 3],
      [2, 3],
      [2, 2],
    ],
  ],
};

const POLYGON_GEOMETRY = {
  type: "Polygon",
  coordinates: [
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
      [0, 0],
    ],
  ],
};

const FEATURE_COLLECTION = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { region: "unmapped" },
      geometry: POLYGON_GEOMETRY,
    },
  ],
};

function jsonResponse(body: unknown, ok = true, statusText = "OK") {
  return {
    ok,
    statusText,
    json: async () => body,
  } as unknown as Response;
}

/** Fresh module registry per test — the cache is module-scoped by design. */
async function freshModule() {
  vi.resetModules();
  return import("@/lib/study/map-geographies");
}

const originalFetch = globalThis.fetch;

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("featuresFrom", () => {
  it("converts the first topology object into GeoJSON features", async () => {
    const { featuresFrom } = await freshModule();

    const features = featuresFrom(TOPOLOGY);

    expect(features).toHaveLength(2);
    expect(features[0].properties.region).toBe("north_america");
    expect(features[1].properties.region).toBe("western_europe");
    expect(features[0].geometry.type).toBe("Polygon");
  });

  it("passes a GeoJSON FeatureCollection through", async () => {
    const { featuresFrom } = await freshModule();

    // /geo/world-regions-110m.json ships as a FeatureCollection, not a
    // topology — reading only topologies silently blanks the region layer.
    const features = featuresFrom(FEATURE_COLLECTION);

    expect(features).toHaveLength(1);
    expect(features[0].properties.region).toBe("unmapped");
  });

  it("defaults null properties to an empty object", async () => {
    const { featuresFrom } = await freshModule();

    const features = featuresFrom({
      type: "FeatureCollection",
      features: [
        { type: "Feature", properties: null, geometry: POLYGON_GEOMETRY },
      ],
    });

    expect(features[0].properties).toEqual({});
  });

  it("rejects payloads that are neither a topology nor a collection", async () => {
    const { featuresFrom } = await freshModule();

    expect(() => featuresFrom({ type: "Feature" })).toThrow(/Expected a/);
  });
});

describe("loadMapFeatures", () => {
  it("fetches and parses a URL only once, however many callers ask", async () => {
    const { loadMapFeatures } = await freshModule();
    const fetchMock = vi.fn(async () => jsonResponse(TOPOLOGY));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const first = await loadMapFeatures("/geo/world-regions-110m.json");
    const second = await loadMapFeatures("/geo/world-regions-110m.json");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    // Same array identity, so downstream useMemo keys stay stable.
    expect(second).toBe(first);
  });

  it("de-duplicates concurrent callers into a single fetch", async () => {
    const { loadMapFeatures } = await freshModule();
    const fetchMock = vi.fn(async () => jsonResponse(TOPOLOGY));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const [a, b, c] = await Promise.all([
      loadMapFeatures("/geo/world-regions-110m.json"),
      loadMapFeatures("/geo/world-regions-110m.json"),
      loadMapFeatures("/geo/world-regions-110m.json"),
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(a).toBe(b);
    expect(b).toBe(c);
  });

  it("keeps separate entries per URL", async () => {
    const { loadMapFeatures } = await freshModule();
    const fetchMock = vi.fn(async () => jsonResponse(TOPOLOGY));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const regions = await loadMapFeatures("/geo/world-regions-110m.json");
    const countries = await loadMapFeatures("/geo/world-110m.json");

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(regions).not.toBe(countries);
  });

  it("does not cache a failed load", async () => {
    const { loadMapFeatures } = await freshModule();
    const fetchMock = vi
      .fn<() => Promise<Response>>()
      .mockResolvedValueOnce(jsonResponse(null, false, "Not Found"))
      .mockResolvedValue(jsonResponse(TOPOLOGY));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await expect(loadMapFeatures("/geo/world-110m.json")).rejects.toThrow(
      /Not Found/
    );
    await expect(loadMapFeatures("/geo/world-110m.json")).resolves.toHaveLength(
      2
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe("peekMapFeatures", () => {
  it("returns null before the URL has resolved and the features after", async () => {
    const { loadMapFeatures, peekMapFeatures } = await freshModule();
    globalThis.fetch = vi.fn(async () =>
      jsonResponse(TOPOLOGY)
    ) as unknown as typeof fetch;

    expect(peekMapFeatures("/geo/world-regions-110m.json")).toBeNull();

    const features = await loadMapFeatures("/geo/world-regions-110m.json");

    // The synchronous peek is what lets a re-mounted layer (the selected-region
    // outline) paint in the same commit instead of popping in a frame later.
    expect(peekMapFeatures("/geo/world-regions-110m.json")).toBe(features);
  });
});
