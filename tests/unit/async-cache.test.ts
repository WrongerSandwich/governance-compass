import { describe, it, expect, vi } from "vitest";
import { createAsyncCache } from "@/lib/async-cache";

describe("createAsyncCache", () => {
  it("loads once and reuses the resolved value", async () => {
    const load = vi.fn(async () => ({ n: 1 }));
    const get = createAsyncCache(load);

    const a = await get();
    const b = await get();

    expect(load).toHaveBeenCalledTimes(1);
    expect(a).toBe(b);
  });

  it("de-duplicates concurrent callers into a single load", async () => {
    let resolve!: (v: string) => void;
    const load = vi.fn(() => new Promise<string>((r) => { resolve = r; }));
    const get = createAsyncCache(load);

    const pending = Promise.all([get(), get(), get()]);
    resolve("loaded");

    expect(await pending).toEqual(["loaded", "loaded", "loaded"]);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("does not poison the cache when a load rejects", async () => {
    const load = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error("EMFILE"))
      .mockResolvedValue("recovered");
    const get = createAsyncCache(load);

    await expect(get()).rejects.toThrow("EMFILE");
    await expect(get()).resolves.toBe("recovered");
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("rejects every concurrent caller of a failed load, then retries once", async () => {
    const load = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error("transient"))
      .mockResolvedValue("recovered");
    const get = createAsyncCache(load);

    const results = await Promise.allSettled([get(), get()]);
    expect(results.every((r) => r.status === "rejected")).toBe(true);
    expect(load).toHaveBeenCalledTimes(1);

    await expect(get()).resolves.toBe("recovered");
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("caches a falsy resolved value instead of reloading it", async () => {
    const load = vi.fn(async () => null);
    const get = createAsyncCache(load);

    await get();
    await get();

    expect(load).toHaveBeenCalledTimes(1);
  });
});
