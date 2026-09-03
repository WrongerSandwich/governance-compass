"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { STUDY_SESSION_KEY } from "@/app/study/layout";
import type { RegionKey, ClusterId, UrbanRural } from "@/lib/study/types";

export interface StudyFilters {
  region?: RegionKey;
  cluster?: ClusterId;
  archetype?: string; // archetype id
  governance?: string; // governance_experience category
  economic?: string; // economic_position category
  urban_rural?: UrbanRural;
  education?: string;
  age_min?: number;
  age_max?: number;
  gender?: string;
  shared?: "all" | "shared_only" | "non_shared_only";
  q?: string; // name search
  sort?: "name" | "age" | "region" | "cluster";
  page?: number; // 1-indexed
}

// Params that belong to the modal/compare UI — not managed by this hook
const IGNORED_PARAMS = new Set(["persona", "compare", "compareView", "model"]);

export const DEFAULT_FILTERS: Required<
  Pick<StudyFilters, "shared" | "sort" | "page">
> = {
  shared: "all",
  sort: "name",
  page: 1,
};

// ---------------------------------------------------------------------------
// Serialization helpers
// ---------------------------------------------------------------------------

export function filtersFromSearchParams(params: URLSearchParams): StudyFilters {
  const filters: StudyFilters = {};

  const region = params.get("region");
  if (region) filters.region = region as RegionKey;

  const cluster = params.get("cluster");
  if (cluster !== null) {
    const n = parseInt(cluster, 10);
    if (!isNaN(n) && n >= 0 && n <= 5) filters.cluster = n as ClusterId;
  }

  const archetype = params.get("archetype");
  if (archetype) filters.archetype = archetype;

  const governance = params.get("governance");
  if (governance) filters.governance = governance;

  const economic = params.get("economic");
  if (economic) filters.economic = economic;

  const urban_rural = params.get("urban_rural");
  if (urban_rural) filters.urban_rural = urban_rural as UrbanRural;

  const education = params.get("education");
  if (education) filters.education = education;

  const age_min = params.get("age_min");
  if (age_min !== null) {
    const n = parseInt(age_min, 10);
    if (!isNaN(n)) filters.age_min = n;
  }

  const age_max = params.get("age_max");
  if (age_max !== null) {
    const n = parseInt(age_max, 10);
    if (!isNaN(n)) filters.age_max = n;
  }

  const gender = params.get("gender");
  if (gender) filters.gender = gender;

  const shared = params.get("shared");
  if (shared === "shared_only" || shared === "non_shared_only" || shared === "all") {
    filters.shared = shared;
  }

  const q = params.get("q");
  if (q) filters.q = q;

  const sort = params.get("sort");
  if (sort === "name" || sort === "age" || sort === "region" || sort === "cluster") {
    filters.sort = sort;
  }

  const page = params.get("page");
  if (page !== null) {
    const n = parseInt(page, 10);
    if (!isNaN(n) && n >= 1) filters.page = n;
  }

  return filters;
}

export function filtersToSearchParams(filters: StudyFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.region !== undefined) params.set("region", filters.region);
  if (filters.cluster !== undefined) params.set("cluster", String(filters.cluster));
  if (filters.archetype !== undefined) params.set("archetype", filters.archetype);
  if (filters.governance !== undefined) params.set("governance", filters.governance);
  if (filters.economic !== undefined) params.set("economic", filters.economic);
  if (filters.urban_rural !== undefined) params.set("urban_rural", filters.urban_rural);
  if (filters.education !== undefined) params.set("education", filters.education);
  if (filters.age_min !== undefined) params.set("age_min", String(filters.age_min));
  if (filters.age_max !== undefined) params.set("age_max", String(filters.age_max));
  if (filters.gender !== undefined) params.set("gender", filters.gender);
  if (filters.shared !== undefined) params.set("shared", filters.shared);
  if (filters.q !== undefined) params.set("q", filters.q);
  if (filters.sort !== undefined) params.set("sort", filters.sort);
  if (filters.page !== undefined) params.set("page", String(filters.page));

  return params;
}

/**
 * Apply one filter change to a live query string and return the new one.
 *
 * The delta is taken against the query string as it stands at commit time, not
 * against the `filters` object the component rendered with: the debounced text
 * inputs commit up to 300 ms after the keystroke that queued them, and a
 * dropdown chosen inside that window is not in the render snapshot yet.
 * Rebuilding from the snapshot would silently drop it. Params this hook does
 * not own (the modal and compare state) are carried across untouched, for the
 * same reason. See `liveSearch` for what "as it stands" resolves to.
 *
 * Pure so the merge rules are testable without a router.
 */
export function applyFilterChange<K extends keyof StudyFilters>(
  currentSearch: string,
  key: K,
  value: StudyFilters[K] | undefined
): string {
  const current = new URLSearchParams(currentSearch);
  const updated = filtersFromSearchParams(current);

  if (value === undefined) delete updated[key];
  else updated[key] = value;
  // Any filter change other than paging returns to the first page
  if (key !== "page") updated.page = 1;

  const next = filtersToSearchParams(updated);
  current.forEach((v, k) => {
    if (IGNORED_PARAMS.has(k)) next.set(k, v);
  });
  return next.toString();
}

// Count filters that differ from the default (for the "Clear all" badge)
function countActiveFilters(filters: StudyFilters): number {
  let count = 0;

  if (filters.region !== undefined) count++;
  if (filters.cluster !== undefined) count++;
  if (filters.archetype !== undefined) count++;
  if (filters.governance !== undefined) count++;
  if (filters.economic !== undefined) count++;
  if (filters.urban_rural !== undefined) count++;
  if (filters.education !== undefined) count++;
  if (filters.age_min !== undefined) count++;
  if (filters.age_max !== undefined) count++;
  if (filters.gender !== undefined) count++;
  if (filters.shared !== undefined && filters.shared !== DEFAULT_FILTERS.shared) count++;
  if (filters.q !== undefined && filters.q !== "") count++;
  if (filters.sort !== undefined && filters.sort !== DEFAULT_FILTERS.sort) count++;

  return count;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * How a filter change enters browser history. Keystroke-granular changes
 * (the name search, the age inputs) use "replace" so Back does not have to
 * walk one entry per character; discrete choices use "push".
 */
export type HistoryMode = "push" | "replace";

export interface SetFilterOptions {
  history?: HistoryMode;
}

export function useStudyFilters(): {
  filters: StudyFilters;
  setFilter: <K extends keyof StudyFilters>(
    key: K,
    value: StudyFilters[K],
    options?: SetFilterOptions
  ) => void;
  clearFilter: (key: keyof StudyFilters, options?: SetFilterOptions) => void;
  clearAll: () => void;
  activeCount: number;
} {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = filtersFromSearchParams(searchParams);
  const activeCount = countActiveFilters(filters);

  // On mount: if URL has no filter params AND sessionStorage has saved state
  // AND we're on the personas page, restore from sessionStorage.
  useEffect(() => {
    if (!pathname.startsWith("/study/personas")) return;

    // Check if URL has any filter params (ignoring modal params)
    let hasFilterParams = false;
    searchParams.forEach((_, key) => {
      if (!IGNORED_PARAMS.has(key)) hasFilterParams = true;
    });

    if (!hasFilterParams) {
      try {
        const saved = sessionStorage.getItem(STUDY_SESSION_KEY);
        if (saved) {
          const savedParams = new URLSearchParams(saved);
          let hasSaved = false;
          savedParams.forEach(() => { hasSaved = true; });
          if (hasSaved) {
            // `replace`, not `push`: the restore is not a navigation the user
            // made, and pushing it means Back returns to the bare URL, which
            // immediately restores again.
            router.replace(`${pathname}?${savedParams.toString()}`, { scroll: false });
          }
        }
      } catch {
        // sessionStorage unavailable (SSR or private mode)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mirror current filter state to sessionStorage on every change
  useEffect(() => {
    if (!pathname.startsWith("/study/personas")) return;
    try {
      // Only save filter params, not modal params
      const filterParams = new URLSearchParams();
      searchParams.forEach((value, key) => {
        if (!IGNORED_PARAMS.has(key)) filterParams.set(key, value);
      });
      // Writing the empty string on clean URLs is intentional — it mirrors the "no filters" state so subsequent mounts don't falsely restore stale state.
      sessionStorage.setItem(STUDY_SESSION_KEY, filterParams.toString());
    } catch {
      // sessionStorage unavailable
    }
  }, [searchParams, pathname]);

  // The query string a handler should build its change on top of.
  //
  // `searchParams` is a render snapshot, and the App Router only updates the
  // address bar once a navigation commits, so both trail an in-flight one.
  // Between the two sits the URL we last asked for: while a navigation is
  // still in flight that intent is the freshest thing there is, and the
  // debounced text inputs commit up to 300 ms after the keystroke that queued
  // them — long enough for a dropdown chosen in between to be lost otherwise.
  const requestedSearchRef = useRef<string | null>(null);
  const searchKey = searchParams.toString();

  useEffect(() => {
    // A new snapshot means what we asked for has either landed or been
    // superseded (Back/forward, a link), so stop preferring it.
    requestedSearchRef.current = null;
  }, [searchKey]);

  const liveSearch = useCallback(() => {
    if (requestedSearchRef.current !== null) return requestedSearchRef.current;
    return typeof window !== "undefined" ? window.location.search : searchKey;
  }, [searchKey]);

  const navigate = useCallback(
    (search: string, history: HistoryMode = "push") => {
      requestedSearchRef.current = search;
      const url = `${pathname}?${search}`;
      if (history === "replace") router.replace(url, { scroll: false });
      else router.push(url, { scroll: false });
    },
    [router, pathname]
  );

  const setFilter = useCallback(
    <K extends keyof StudyFilters>(
      key: K,
      value: StudyFilters[K],
      options?: SetFilterOptions
    ) => {
      navigate(applyFilterChange(liveSearch(), key, value), options?.history);
    },
    [navigate, liveSearch]
  );

  const clearFilter = useCallback(
    (key: keyof StudyFilters, options?: SetFilterOptions) => {
      navigate(applyFilterChange(liveSearch(), key, undefined), options?.history);
    },
    [navigate, liveSearch]
  );

  const clearAll = useCallback(() => {
    // Preserve modal params
    const preserved = new URLSearchParams();
    new URLSearchParams(liveSearch()).forEach((value, key) => {
      if (IGNORED_PARAMS.has(key)) preserved.set(key, value);
    });
    navigate(preserved.toString());
  }, [navigate, liveSearch]);

  return { filters, setFilter, clearFilter, clearAll, activeCount };
}
