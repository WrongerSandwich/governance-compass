/**
 * @vitest-environment jsdom
 *
 * Regression cover for the budget steppers: the assessment has to be
 * completable without a pointing device, and a hold that runs into a bound
 * must not leave a timer behind that keeps stepping on its own.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, createElement, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { BudgetSimulator } from "@/components/quiz/BudgetSimulator";
import { ministries } from "@/data/ministries";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const TOTAL_BUDGET = 50;
const MAX_ALLOCATION = 25;
const HOLD_DELAY_MS = 200;

/**
 * Drives BudgetSimulator the way QuizFlow does — it is a controlled component,
 * so the repeat loop only sees a new value if the parent writes one back.
 */
function Harness({
  initial,
  onAllocate,
}: {
  initial: Record<number, number>;
  onAllocate: (ministryId: number, amount: number) => void;
}) {
  const [allocations, setAllocations] = useState(initial);
  return createElement(BudgetSimulator, {
    ministries,
    allocations,
    onAllocate: (ministryId: number, amount: number) => {
      onAllocate(ministryId, amount);
      setAllocations((prev) => ({ ...prev, [ministryId]: amount }));
    },
    onFinalize: () => {},
  });
}

const flat = (): Record<number, number> =>
  Object.fromEntries(ministries.map((m) => [m.id, 1]));

/** Allocations leaving exactly `remaining` points unspent. */
function withRemaining(remaining: number): Record<number, number> {
  const allocations = flat();
  let spare = TOTAL_BUDGET - ministries.length - remaining;
  for (let i = 1; i < ministries.length && spare > 0; i++) {
    const add = Math.min(spare, MAX_ALLOCATION - 1);
    allocations[ministries[i].id] = 1 + add;
    spare -= add;
  }
  return allocations;
}

let container: HTMLDivElement;
let root: Root;

function mount(initial: Record<number, number>, onAllocate: (id: number, amount: number) => void) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(createElement(Harness, { initial, onAllocate }));
  });
}

function stepper(direction: "Increase" | "Decrease", index = 0): HTMLButtonElement {
  const label = `${direction} ${ministries[index].name} allocation`;
  const button = container.querySelector<HTMLButtonElement>(`[aria-label="${label}"]`);
  if (!button) throw new Error(`No stepper found for "${label}"`);
  return button;
}

/** `detail: 0` is what a browser reports for Enter/Space activation. */
function keyboardClick(button: HTMLButtonElement) {
  act(() => {
    button.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 0 }));
  });
}

/** A press with the primary button, as a real tap or hold begins. */
function press(button: HTMLButtonElement, init: PointerEventInit = {}) {
  act(() => {
    button.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, button: 0, isPrimary: true, ...init }),
    );
  });
}

function release(button: HTMLButtonElement) {
  act(() => {
    button.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));
    button.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
  });
}

function pointerTap(button: HTMLButtonElement) {
  press(button);
  release(button);
}

/**
 * Advances in slices so React commits between repeat ticks — the loop reads the
 * next value off a re-render, exactly as it does in the browser.
 */
function advance(ms: number) {
  for (let elapsed = 0; elapsed < ms; elapsed += 25) {
    act(() => {
      vi.advanceTimersByTime(25);
    });
  }
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.useRealTimers();
});

describe("BudgetSimulator steppers", () => {
  it("steps on keyboard activation, which fires click and never pointerdown", () => {
    const onAllocate = vi.fn();
    mount(flat(), onAllocate);

    keyboardClick(stepper("Increase"));
    expect(onAllocate).toHaveBeenLastCalledWith(ministries[0].id, 2);

    keyboardClick(stepper("Increase"));
    expect(onAllocate).toHaveBeenLastCalledWith(ministries[0].id, 3);

    keyboardClick(stepper("Decrease"));
    expect(onAllocate).toHaveBeenLastCalledWith(ministries[0].id, 2);
  });

  it("counts a pointer tap once, not twice", () => {
    const onAllocate = vi.fn();
    mount(flat(), onAllocate);

    pointerTap(stepper("Increase"));

    expect(onAllocate.mock.calls).toEqual([[ministries[0].id, 2]]);
  });

  it("does not add a trailing step when a hold ends", () => {
    const onAllocate = vi.fn();
    mount(flat(), onAllocate);

    const button = stepper("Increase");
    press(button);
    advance(HOLD_DELAY_MS + 250);

    const duringHold = onAllocate.mock.calls.length;
    expect(duringHold).toBeGreaterThan(1);

    release(button);
    expect(onAllocate).toHaveBeenCalledTimes(duringHold);
  });

  it("stops repeating once the step is a no-op, leaving no timer behind", () => {
    const onAllocate = vi.fn();
    mount(withRemaining(2), onAllocate);

    // Hold "+" until the budget runs dry. The button is disabled at that point,
    // and browsers that suppress pointer events on disabled controls never
    // deliver pointerup — so the loop has to end itself.
    press(stepper("Increase"));
    advance(HOLD_DELAY_MS + 1000);

    expect(onAllocate.mock.calls.map(([, amount]) => amount)).toEqual([2, 3]);
    expect(stepper("Increase").getAttribute("aria-disabled")).toBe("true");

    // Freeing a point must not resurrect the hold on the first ministry.
    onAllocate.mockClear();
    keyboardClick(stepper("Decrease", 1));
    advance(1000);

    expect(onAllocate).toHaveBeenCalledTimes(1);
    expect(onAllocate.mock.calls[0][0]).toBe(ministries[1].id);
  });

  it("ignores a non-primary press instead of holding on it", () => {
    const onAllocate = vi.fn();
    mount(flat(), onAllocate);

    // A right-press opens the context menu, which swallows the release — if it
    // started the hold, nothing would stop it before the bound.
    press(stepper("Increase"), { button: 2 });
    advance(HOLD_DELAY_MS + 1000);

    expect(onAllocate).not.toHaveBeenCalled();
  });

  it("ends a hold when the release lands outside the button", () => {
    const onAllocate = vi.fn();
    mount(flat(), onAllocate);

    press(stepper("Increase"));
    advance(HOLD_DELAY_MS + 100);
    const duringHold = onAllocate.mock.calls.length;
    expect(duringHold).toBeGreaterThan(0);

    // Released over another element, or after an alt-tab: the button's own
    // pointerup never fires, so the window-level listener has to catch it.
    act(() => {
      window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));
    });
    advance(1000);

    expect(onAllocate).toHaveBeenCalledTimes(duringHold);
  });

  it("keeps a stepper focusable at its bound so focus is not thrown away", () => {
    const onAllocate = vi.fn();
    mount(withRemaining(1), onAllocate);

    const button = stepper("Increase");
    button.focus();
    keyboardClick(button);

    // The last point is spent, so every "+" is at its bound. The button the
    // user just pressed must still hold focus and stay reachable by Tab.
    const bounded = stepper("Increase");
    expect(bounded.getAttribute("aria-disabled")).toBe("true");
    expect(bounded.hasAttribute("disabled")).toBe(false);
    expect(document.activeElement).toBe(bounded);

    // And activating it again is simply inert.
    onAllocate.mockClear();
    keyboardClick(bounded);
    expect(onAllocate).not.toHaveBeenCalled();
  });

  it("scales the track fill against the real maximum", () => {
    const initial = flat();
    initial[ministries[0].id] = 13;
    initial[ministries[1].id] = MAX_ALLOCATION;
    mount(initial, vi.fn());

    const fills = Array.from(
      container.querySelectorAll<HTMLElement>("[style*='--stone-600']"),
    ).map((el) => el.style.width);

    // 13 of 25 is halfway; only 25 fills the track.
    expect(fills[0]).toBe("50%");
    expect(fills[1]).toBe("100%");
  });
});
