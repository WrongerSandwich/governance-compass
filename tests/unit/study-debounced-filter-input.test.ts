/**
 * @vitest-environment jsdom
 *
 * Regression cover for issue #63 part 2: the name search and the age inputs
 * were bound straight to URL state and committed on every keystroke, so typing
 * "sofia" left five history entries and the controlled value round-tripped
 * through async navigation while the user was still typing.
 *
 * The buffered input hook keeps the keystrokes local and commits once the
 * typing settles, while still adopting external URL changes (Back/forward,
 * "Clear all").
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useDebouncedFilterInput } from "@/lib/study/useDebouncedFilterInput";

// React 19 wants this flag set for act() to be recognized.
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

type Harness = {
  draft: () => string;
  type: (value: string) => void;
  setUrlValue: (value: string) => void;
  commits: string[];
  unmount: () => void;
};

function mount(initial: string, delayMs = 300): Harness {
  const commits: string[] = [];
  let latestDraft = "";
  let setDraftFromInput: (v: string) => void = () => {};
  let rerenderWith: (v: string) => void = () => {};

  const container = document.createElement("div");
  document.body.appendChild(container);
  let root: Root;

  function Probe({ urlValue }: { urlValue: string }) {
    const [draft, onChange] = useDebouncedFilterInput(
      urlValue,
      (v) => commits.push(v),
      delayMs
    );
    latestDraft = draft;
    setDraftFromInput = onChange;
    return null;
  }

  act(() => {
    root = createRoot(container);
    root.render(createElement(Probe, { urlValue: initial }));
  });
  rerenderWith = (v: string) => {
    act(() => {
      root.render(createElement(Probe, { urlValue: v }));
    });
  };

  return {
    draft: () => latestDraft,
    type: (value) => act(() => setDraftFromInput(value)),
    setUrlValue: rerenderWith,
    commits,
    unmount: () =>
      act(() => {
        root.unmount();
        container.remove();
      }),
  };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useDebouncedFilterInput", () => {
  it("shows the URL value on mount", () => {
    const h = mount("sofia");
    expect(h.draft()).toBe("sofia");
    h.unmount();
  });

  it("renders each keystroke immediately without committing", () => {
    const h = mount("");
    h.type("s");
    h.type("so");
    h.type("sof");
    expect(h.draft()).toBe("sof");
    expect(h.commits).toEqual([]);
    h.unmount();
  });

  it("commits once after typing settles", () => {
    const h = mount("");
    for (const v of ["s", "so", "sof", "sofi", "sofia"]) h.type(v);
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(h.commits).toEqual(["sofia"]);
    h.unmount();
  });

  it("adopts an external URL change, such as Clear all", () => {
    const h = mount("sofia");
    h.setUrlValue("");
    expect(h.draft()).toBe("");
    h.unmount();
  });

  it("drops a queued commit when the URL changes underneath it", () => {
    const h = mount("");
    h.type("sof");
    h.setUrlValue("maria"); // e.g. Back navigation lands mid-typing
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(h.draft()).toBe("maria");
    expect(h.commits).toEqual([]);
    h.unmount();
  });

  it("keeps the draft while its own commit lands in the URL", () => {
    const h = mount("");
    h.type("sofia");
    act(() => {
      vi.advanceTimersByTime(300);
    });
    h.setUrlValue("sofia"); // the commit round-tripping back through the URL
    expect(h.draft()).toBe("sofia");
    expect(h.commits).toEqual(["sofia"]);
    h.unmount();
  });

  it("does not commit after unmount", () => {
    const h = mount("");
    h.type("sofia");
    h.unmount();
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(h.commits).toEqual([]);
  });
});
