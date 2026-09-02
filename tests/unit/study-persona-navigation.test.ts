/**
 * Cover for the modal prev/next footer when the open persona is not part of
 * the current filter result — e.g. someone opens a `?persona=` deep link while
 * a region filter excludes that persona. Before the fix, `indexOf` returned -1
 * and "Next" navigated to `filteredIds[0]`, which is not the persona after the
 * one on screen.
 */
import { describe, it, expect } from "vitest";
import { personaNeighbors } from "@/lib/study/personaNavigation";

const IDS = ["P0001", "P0002", "P0003"];

describe("personaNeighbors", () => {
  it("reports both neighbours in the middle of the list", () => {
    expect(personaNeighbors(IDS, "P0002")).toEqual({
      index: 1,
      prev: "P0001",
      next: "P0003",
    });
  });

  it("has no previous at the head of the list", () => {
    expect(personaNeighbors(IDS, "P0001")).toEqual({
      index: 0,
      prev: null,
      next: "P0002",
    });
  });

  it("has no next at the tail of the list", () => {
    expect(personaNeighbors(IDS, "P0003")).toEqual({
      index: 2,
      prev: "P0002",
      next: null,
    });
  });

  it("offers no neighbours when the persona is outside the filtered list", () => {
    expect(personaNeighbors(IDS, "P0999")).toEqual({
      index: -1,
      prev: null,
      next: null,
    });
  });

  it("offers no neighbours when the filtered list is empty", () => {
    expect(personaNeighbors([], "P0001")).toEqual({
      index: -1,
      prev: null,
      next: null,
    });
  });

  it("is the only member of a single-persona list", () => {
    expect(personaNeighbors(["P0001"], "P0001")).toEqual({
      index: 0,
      prev: null,
      next: null,
    });
  });
});
