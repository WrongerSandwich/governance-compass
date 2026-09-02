import { describe, it, expect, vi, beforeEach } from "vitest";

// The route reads its source files through `fs.promises.readFile`; every test
// drives that seam so we can force a transient failure without touching disk.
const readFile = vi.fn<(p: string, enc: string) => Promise<string>>();

vi.mock("fs", () => ({
  default: { promises: { readFile: (p: string, enc: string) => readFile(p, enc) } },
  promises: { readFile: (p: string, enc: string) => readFile(p, enc) },
}));

const AXIS_KEY = "1_economic_model";

const FILES: Record<string, string> = {
  "personas.json": JSON.stringify({
    personas: [{ id: "P0001", name: "Test Persona", region: "Western Europe" }],
  }),
  "scored_profiles.json": JSON.stringify({
    profiles: [
      {
        persona_id: "P0001",
        model: "claude",
        axis_scores: { [AXIS_KEY]: -0.2 },
        modality_scores: { [AXIS_KEY]: { fc: -1, sc: -0.25, bg: 0.9329 } },
        tensions: [{ axis: 1, magnitude: 1.6329, level: "strong" }],
        super_dimensions: { economic: -0.2, cultural: 0.1 },
        confidence: { [AXIS_KEY]: { spread: 0.4, level: "moderate" } },
      },
    ],
  }),
  "claude_responses.json": JSON.stringify({
    responses: [
      {
        persona_id: "P0001",
        fc_responses: [{ item: "FC-01", choice: "A" }],
        sc_responses: [{ item: "SC-01", choice: 3 }],
        budget: { health: 20 },
      },
    ],
  }),
  "gemini_responses.json": JSON.stringify({ responses: [] }),
  "cluster_labels.csv": [
    "persona_id,axis_1,axis_2,axis_3,axis_4,axis_5,axis_6,axis_7,axis_8,axis_9,axis_10,axis_11,axis_12,n_models,cluster",
    "P0001,-0.2,0.1,0,0,0,0,0,0,0,0,0,0,1,0",
  ].join("\n"),
  "cluster_centroids.json": JSON.stringify([
    {
      cluster: 0,
      axis_1: -0.2, axis_2: 0.1, axis_3: 0, axis_4: 0, axis_5: 0, axis_6: 0,
      axis_7: 0, axis_8: 0, axis_9: 0, axis_10: 0, axis_11: 0, axis_12: 0,
    },
  ]),
  "personas_slim.json": JSON.stringify([{ id: "P0001", country_iso: "FRA" }]),
};

function serveFromFixtures() {
  readFile.mockImplementation(async (filePath: string) => {
    const name = filePath.split(/[\\/]/).pop() as string;
    const contents = FILES[name];
    if (contents === undefined) {
      throw new Error(`ENOENT: no such file or directory, open '${filePath}'`);
    }
    return contents;
  });
}

async function loadRoute() {
  return import("@/app/api/study/persona/[id]/route");
}

function request(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("GET /api/study/persona/[id]", () => {
  beforeEach(() => {
    vi.resetModules();
    readFile.mockReset();
    vi.restoreAllMocks();
  });

  it("rejects an id that does not match the persona format", async () => {
    serveFromFixtures();
    const { GET } = await loadRoute();

    const res = await GET(new Request("http://test/"), request("../../etc/passwd"));

    expect(res.status).toBe(400);
  });

  it("returns 404 for a well-formed id that is not in the dataset", async () => {
    serveFromFixtures();
    const { GET } = await loadRoute();

    const res = await GET(new Request("http://test/"), request("P9999"));

    expect(res.status).toBe(404);
  });

  it("does not leak filesystem paths or raw error text on failure", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    readFile.mockRejectedValue(
      new Error("ENOENT: no such file or directory, open '/app/data/synthetic_study/personas.json'")
    );
    const { GET } = await loadRoute();

    const res = await GET(new Request("http://test/"), request("P0001"));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(JSON.stringify(body)).not.toContain("/app/data");
    expect(JSON.stringify(body)).not.toContain("ENOENT");
    expect(consoleError).toHaveBeenCalled();
  });

  it("recovers on the next request after a transient load failure", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    let failNext = true;
    readFile.mockImplementation(async (filePath: string) => {
      if (failNext) throw new Error("EMFILE: too many open files");
      const name = filePath.split(/[\\/]/).pop() as string;
      return FILES[name];
    });
    const { GET } = await loadRoute();

    const failed = await GET(new Request("http://test/"), request("P0001"));
    expect(failed.status).toBe(500);

    failNext = false;
    const recovered = await GET(new Request("http://test/"), request("P0001"));
    expect(recovered.status).toBe(200);
  });

  it("surfaces tension magnitude and a populated description", async () => {
    serveFromFixtures();
    const { GET } = await loadRoute();

    const res = await GET(new Request("http://test/"), request("P0001"));
    const body = await res.json();

    expect(res.status).toBe(200);
    const [tension] = body.administrations[0].tensions;
    expect(tension.axis).toBe(1);
    expect(tension.severity).toBe("strong");
    expect(tension.magnitude).toBeCloseTo(1.6329, 4);
    expect(typeof tension.description).toBe("string");
    expect(tension.description.length).toBeGreaterThan(0);
    expect(tension.description).toContain("collective provision");
  });
});
