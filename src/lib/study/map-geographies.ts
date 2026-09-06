"use client";

import { useEffect, useState } from "react";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import { createAsyncCache } from "@/lib/async-cache";

/**
 * Shared, process-wide cache for the study maps' TopoJSON files.
 *
 * `react-simple-maps`' own `useGeographies` fetches and parses on every mount
 * with no cache, so each `<Geographies geography="/geo/...">` costs a fresh
 * network round trip plus a TopoJSON→GeoJSON conversion. The study pages mount
 * several map layers at once (regions, country overlay, selected-region
 * outline) and the patterns page mounts three maps, so the 715 KB region file
 * was being fetched and parsed once per layer — and again on every region
 * selection, which made the selection outline pop in a beat late.
 *
 * Passing the parsed object to `<Geographies geography={obj}>` instead of a URL
 * is not a fix: the library derives its effect key with `JSON.stringify(obj)`
 * on every render, which would re-serialise the whole topology on each hover.
 * So we own the fetch/parse and hand `<Geography>` pre-projected features.
 */

export type MapFeature = Feature<Geometry, Record<string, unknown>>;

/** Resolved features by URL, for synchronous reads during render. */
const resolved = new Map<string, MapFeature[]>();

/** One memoized loader per URL. */
const loaders = new Map<string, () => Promise<MapFeature[]>>();

/**
 * Normalize a fetched map payload into GeoJSON features.
 *
 * Both shapes the study ships are accepted, matching what `react-simple-maps`
 * does: a TopoJSON topology (`/geo/world-110m.json`, whose first object is
 * used) or a plain GeoJSON FeatureCollection (`/geo/world-regions-110m.json`).
 * `properties` is defaulted to an empty object so callers can read it without
 * a null check.
 */
export function featuresFrom(data: unknown): MapFeature[] {
  const payload = data as Topology | FeatureCollection | null;

  let features: Array<Feature<Geometry>>;
  if (payload && payload.type === "Topology") {
    const firstKey = Object.keys(payload.objects ?? {})[0];
    if (!firstKey) throw new Error("TopoJSON topology has no objects");
    features = feature(payload, payload.objects[firstKey] as GeometryCollection)
      .features;
  } else if (payload && payload.type === "FeatureCollection") {
    features = payload.features;
  } else {
    throw new Error(
      "Expected a TopoJSON topology or a GeoJSON FeatureCollection"
    );
  }

  return features.map((f) => ({
    ...f,
    properties: (f.properties ?? {}) as Record<string, unknown>,
  }));
}

/**
 * Fetch and parse a TopoJSON file at most once per URL. Concurrent callers
 * share the in-flight request; a failed load is not remembered.
 */
export function loadMapFeatures(url: string): Promise<MapFeature[]> {
  let load = loaders.get(url);
  if (!load) {
    load = createAsyncCache(async () => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load ${url}: ${response.statusText}`);
      }
      const features = featuresFrom(await response.json());
      resolved.set(url, features);
      return features;
    });
    loaders.set(url, load);
  }
  return load();
}

/** Already-resolved features for a URL, or null if it has not loaded yet. */
export function peekMapFeatures(url: string): MapFeature[] | null {
  return resolved.get(url) ?? null;
}

const EMPTY: MapFeature[] = [];

/**
 * Subscribe to a TopoJSON file's features. Returns the cached features
 * synchronously on the first render once any other layer has loaded them, so
 * remounting layers do not flash empty.
 */
export function useMapFeatures(url: string): MapFeature[] {
  // The url is carried alongside the features so a url change does not render
  // the previous file's features for a frame while the new one resolves.
  const [entry, setEntry] = useState<{
    url: string;
    features: MapFeature[] | null;
  }>(() => ({ url, features: peekMapFeatures(url) }));

  useEffect(() => {
    let cancelled = false;
    loadMapFeatures(url)
      .then((features) => {
        if (!cancelled) setEntry({ url, features });
      })
      .catch((error: unknown) => {
        console.error(`Map geography load failed for ${url}`, error);
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  return entry.url === url ? (entry.features ?? EMPTY) : EMPTY;
}
