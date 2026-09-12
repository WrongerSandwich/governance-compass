/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  describeGap,
  describePosition,
  PairedAxisScale,
  scoreToTrackPercent,
} from "@/components/PairedAxisScale";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mounted: { container: HTMLDivElement; root: Root }[] = [];

function render(element: React.ReactNode) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(element));
  mounted.push({ container, root });
  return container;
}

afterEach(() => {
  while (mounted.length) {
    const entry = mounted.pop()!;
    act(() => entry.root.unmount());
    entry.container.remove();
  }
});

describe("scoreToTrackPercent", () => {
  it("maps the poles inside the track so a dot never clips its end", () => {
    // -1..1 maps to 6%..94%, per delta 05.
    expect(scoreToTrackPercent(-1)).toBe(6);
    expect(scoreToTrackPercent(1)).toBe(94);
    expect(scoreToTrackPercent(0)).toBe(50);
  });

  it("is linear between the poles", () => {
    expect(scoreToTrackPercent(0.5)).toBe(72);
    expect(scoreToTrackPercent(-0.5)).toBe(28);
  });

  it("clamps scores outside the range rather than overflowing the track", () => {
    expect(scoreToTrackPercent(1.4)).toBe(94);
    expect(scoreToTrackPercent(-2)).toBe(6);
  });
});

describe("PairedAxisScale", () => {
  const base = {
    axisId: 3,
    poleALabel: "Distributed",
    poleBLabel: "Centralized",
    scoreA: -0.5,
  };

  it("renders both endpoint labels", () => {
    const container = render(createElement(PairedAxisScale, base));

    expect(container.textContent).toContain("Distributed");
    expect(container.textContent).toContain("Centralized");
  });

  it("positions respondent A from its score", () => {
    const container = render(createElement(PairedAxisScale, base));
    const dotA = container.querySelector("[data-respondent='a']") as HTMLElement;

    expect(dotA.style.left).toBe("28%");
  });

  it("omits the outlined dot when there is no second respondent", () => {
    const container = render(createElement(PairedAxisScale, base));

    expect(container.querySelector("[data-respondent='b']")).toBeNull();
  });

  it("renders both dots when a second respondent is given", () => {
    const container = render(
      createElement(PairedAxisScale, { ...base, scoreB: 0.5 }),
    );

    expect((container.querySelector("[data-respondent='a']") as HTMLElement).style.left).toBe("28%");
    expect((container.querySelector("[data-respondent='b']") as HTMLElement).style.left).toBe("72%");
  });

  it("colours the track from the axis's domain", () => {
    // Axis 3 is Power and Authority — Slate. The track uses the 400 tone.
    const container = render(createElement(PairedAxisScale, base));
    const track = container.querySelector("[data-track]") as HTMLElement;

    expect(track.style.backgroundColor).toBe("rgb(157, 174, 187)");
  });

  it("states each respondent's position and their relationship, not just the poles", () => {
    const container = render(
      createElement(PairedAxisScale, {
        ...base,
        axisName: "Governance Structure",
        scoreA: -0.5,
        scoreB: -0.9,
      }),
    );
    const label = container.querySelector("[role='img']")!.getAttribute("aria-label")!;

    // The old label was "Distributed to Centralized" — an axis inventory the
    // domain footer already gives in cleaner form, twelve times over. Both
    // dots are aria-hidden, so this string is the ONLY path to the data.
    expect(label).toContain("Governance Structure");
    expect(label).toContain("Respondent A moderately toward Distributed");
    expect(label).toContain("Respondent B strongly toward Distributed");
    // These two sit 0.4 apart, which is `describeGap`'s second bucket. The
    // thresholds are ComparisonScoreBar's shipped ones and are pinned below,
    // so the gap phrase follows from them rather than the other way round.
    expect(label).toContain("some distance");
    // The whole sentence, so the separator before the gap phrase is pinned.
    // Every assertion above is a `toContain`, which a lone em dash slips
    // straight through — and an em dash is what this used to be.
    expect(label).toBe(
      "Governance Structure: Respondent A moderately toward Distributed, " +
        "Respondent B strongly toward Distributed; some distance",
    );
  });

  it("names the respondents as the caller does", () => {
    const container = render(
      createElement(PairedAxisScale, {
        ...base,
        axisName: "Governance Structure",
        scoreB: 0.9,
        respondentALabel: "You",
        respondentBLabel: "Them",
      }),
    );
    const label = container.querySelector("[role='img']")!.getAttribute("aria-label")!;

    expect(label).toContain("You moderately toward Distributed");
    expect(label).toContain("Them strongly toward Centralized");
    expect(label).toContain("far apart");
    expect(label).not.toContain("Respondent");
  });

  it("describes the single-respondent variant without inventing a relationship", () => {
    const container = render(
      createElement(PairedAxisScale, { ...base, axisName: "Governance Structure" }),
    );
    const label = container.querySelector("[role='img']")!.getAttribute("aria-label")!;

    expect(label).toBe("Governance Structure: moderately toward Distributed");
    // No second respondent, so no gap phrase to append. The separator is a
    // semicolon rather than an em dash because most synthesizers speak nothing
    // for U+2014 and do not reliably pause on it.
    expect(label).not.toContain(";");
    expect(label).not.toContain("—");
  });

  it("keeps the label prop as the escape hatch", () => {
    const container = render(
      createElement(PairedAxisScale, { ...base, axisName: "Ignored", label: "Custom" }),
    );

    expect(container.querySelector("[role='img']")!.getAttribute("aria-label")).toBe("Custom");
  });

  it("drops the prefix entirely when the caller omits axisName", () => {
    // The earlier fallback named the poles, which the position phrase then
    // named again: "Distributed to Centralized: moderately toward
    // Distributed". Dropped rather than kept-and-pinned, because the axis name
    // is rendered OUTSIDE this component's role="img" subtree at every call
    // site — it is already in the accessibility tree, and repeating it in the
    // label buys a screen-reader user nothing but a longer string.
    const container = render(createElement(PairedAxisScale, base));
    const label = container.querySelector("[role='img']")!.getAttribute("aria-label")!;

    expect(label).toBe("moderately toward Distributed");
    expect(label).not.toContain("Distributed to Centralized");
  });

  it("keeps both dots out of the accessibility tree", () => {
    // Carried over from the test this block replaced: the dots are decoration
    // once the aria-label carries the data, and must stay that way.
    const container = render(
      createElement(PairedAxisScale, { ...base, scoreB: 0.5 }),
    );

    expect(container.querySelector("[data-respondent='a']")!.getAttribute("aria-hidden")).toBe("true");
    expect(container.querySelector("[data-respondent='b']")!.getAttribute("aria-hidden")).toBe("true");
  });

  it("steps respondent A's dot to its domain mark rather than a fixed hex", () => {
    // Domain 600 goes muddy on a dark ground (delta 06). A hex read from
    // DOMAIN_COLORS cannot invert, so this must be the custom property — and
    // in LIGHT mode the two render identically, which is exactly why the
    // assertion is on the declaration rather than the computed colour.
    const container = render(createElement(PairedAxisScale, base));
    const dotA = container.querySelector("[data-respondent='a']") as HTMLElement;

    expect(dotA.style.backgroundColor).toBe("var(--domain-power)");
  });
});

describe("describePosition", () => {
  it("buckets magnitude into four phrases, with the midpoint naming no pole", () => {
    expect(describePosition(0.05, "Liberty", "Security")).toBe("near the midpoint");
    expect(describePosition(0.3, "Liberty", "Security")).toBe("slightly toward Security");
    expect(describePosition(-0.6, "Liberty", "Security")).toBe("moderately toward Liberty");
    expect(describePosition(0.95, "Liberty", "Security")).toBe("strongly toward Security");
  });

  it("puts each boundary in the bucket above it", () => {
    // Stated explicitly because an off-by-one here is silent: the phrase is
    // still grammatical and still names the right pole.
    expect(describePosition(0.15, "A", "B")).toBe("slightly toward B");
    expect(describePosition(0.45, "A", "B")).toBe("moderately toward B");
    expect(describePosition(0.75, "A", "B")).toBe("strongly toward B");

    // And the value just below stays in the bucket below. Same reason the gap
    // buckets are pinned from both sides: the on-boundary values above catch a
    // widened threshold but not a narrowed one, since `0.45` is "moderately"
    // under both `< 0.45` and `< 0.40`.
    expect(describePosition(0.14, "A", "B")).toBe("near the midpoint");
    expect(describePosition(0.44, "A", "B")).toBe("slightly toward B");
    expect(describePosition(0.74, "A", "B")).toBe("moderately toward B");
  });
});

describe("describeGap", () => {
  it("keeps ComparisonScoreBar's shipped thresholds", () => {
    // These four buckets were ComparisonScoreBar's `deltaLabel`. They move
    // here so the visible label and the accessible description are the same
    // computation and cannot drift apart.
    // No bucket carries an article: Task 6 renders this bare as a badge on the
    // axis-name line, where "a significant gap" would sit oddly beside
    // "far apart". Three of the four are the shipped strings verbatim; only
    // "very close" was reworded, to "close agreement".
    expect(describeGap(0.2)).toBe("close agreement");
    expect(describeGap(0.5)).toBe("some distance");
    expect(describeGap(1.0)).toBe("significant gap");
    expect(describeGap(1.5)).toBe("far apart");

    // Each boundary is pinned from BOTH sides, because the two directions fail
    // differently and one assertion only catches one of them. The boundary
    // value itself catches a <= -> < flip; it does NOT catch a widened
    // threshold, since `describeGap(0.7)` is still "some distance" under
    // `<= 0.8`. Measured: with only the on-boundary values, `<= 0.7` -> `<= 0.8`
    // and `<= 1.2` -> `<= 1.3` both left the whole suite green. Task 6
    // converges ComparisonScoreBar's visible label onto this function, so a
    // silent boundary shift in either direction would move on-screen copy with
    // nothing to catch it.
    expect(describeGap(0.3)).toBe("close agreement");
    expect(describeGap(0.31)).toBe("some distance");
    expect(describeGap(0.7)).toBe("some distance");
    expect(describeGap(0.71)).toBe("significant gap");
    expect(describeGap(1.2)).toBe("significant gap");
    expect(describeGap(1.21)).toBe("far apart");
  });

  it("takes an unsigned gap and is symmetric in its arguments", () => {
    expect(describeGap(Math.abs(-0.5 - 0.9))).toBe(describeGap(Math.abs(0.9 - -0.5)));
  });
});
