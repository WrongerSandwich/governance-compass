/** @vitest-environment jsdom */
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { sourceFiles } from "../helpers/source-files";
import { readFileSync } from "node:fs";
import { relative, resolve } from "node:path";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const { session } = vi.hoisted(() => ({
  session: { user: { id: "user-1", email: "user@example.com" } },
}));
const accountState = vi.hoisted(() => ({ lastResults: null as string | null }));

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: session, status: "authenticated" }),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => createElement("a", { href }, children),
}));
vi.mock("@/lib/last-results", () => ({
  hasUnsavedResults: (value: string | null) => value !== null,
  lastResultsProfileId: () => null,
  saveLastResults: vi.fn(),
  useLastResults: () => accountState.lastResults,
}));

const { default: AccountPage } = await import("@/app/account/page");

// `vmForks` (vitest.config.ts) shares one module registry per worker, and a
// hoisted `vi.mock` stays registered for the worker's lifetime — not just
// this file. AccountPage now renders through `@/components/Button`, which
// itself imports `next/link`; without retiring these mocks, whichever test
// file runs next in the same worker (e.g. button.test.ts) can receive this
// file's stubbed `next/link` — one that drops `className` — instead of the
// real module. This file registered the mocks, so it owns unregistering them.
afterAll(() => {
  vi.doUnmock("next-auth/react");
  vi.doUnmock("next/navigation");
  vi.doUnmock("next/link");
  vi.doUnmock("@/lib/last-results");
});

const views: { root: Root; container: HTMLDivElement }[] = [];

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

function render() {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(createElement(AccountPage)));
  views.push({ root, container });
  return container;
}

function change(input: HTMLInputElement, value: string) {
  act(() => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    if (!setter) throw new Error("expected input value setter");
    setter.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

function click(button: HTMLButtonElement | HTMLInputElement) {
  act(() => button.dispatchEvent(new MouseEvent("click", { bubbles: true })));
}

beforeEach(() => {
  accountState.lastResults = null;
  vi.stubGlobal("fetch", vi.fn((url: string) => {
    if (url === "/api/account/data") {
      return Promise.resolve({
        json: async () => ({
          axisVisibility: [{ axisId: 1, axisName: "Authority", domain: "Power", hidden: false }],
          groups: [],
        }),
      });
    }
    return Promise.resolve(new Response("", { status: 500 }));
  }));
});

afterEach(() => {
  while (views.length) {
    const view = views.pop();
    if (!view) continue;
    act(() => view.root.unmount());
    view.container.remove();
  }
  vi.unstubAllGlobals();
  // A fresh module graph for whatever imports next, so the eventual
  // `doUnmock()` calls below actually take effect on re-import rather than
  // handing back an already-cached module still bound to this file's mocks.
  vi.resetModules();
});

async function settle() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe("AccountPage failures", () => {
  it("disables a visibility setting while its request is pending and restores it after failure", async () => {
    const pending = deferred<Response>();
    vi.stubGlobal("fetch", vi.fn((url: string) => {
      if (url === "/api/account/data") {
        return Promise.resolve({
          json: async () => ({
            axisVisibility: [{ axisId: 1, axisName: "Authority", domain: "Power", hidden: false }],
            groups: [],
          }),
        });
      }
      return pending.promise;
    }));
    const container = render();
    await settle();
    const visibility = container.querySelector<HTMLInputElement>('input[type="checkbox"]');
    if (!visibility) throw new Error("expected privacy checkbox");

    click(visibility);
    expect(visibility.disabled).toBe(true);
    await act(async () => {
      pending.resolve(new Response("", { status: 500 }));
      await Promise.resolve();
    });
    await settle();

    expect(visibility.checked).toBe(true);
    expect(container.textContent).toContain("Could not update axis visibility. Please try again.");
  });

  it("reports a network failure while saving results", async () => {
    accountState.lastResults = "encoded-results";
    const fetch = vi.fn((url: string) => {
      if (url === "/api/account/data") {
        return Promise.resolve({ json: async () => ({ axisVisibility: [], groups: [] }) });
      }
      if (url === "/api/profile/materialize") return Promise.reject(new Error("network down"));
      return Promise.resolve(new Response("", { status: 500 }));
    });
    vi.stubGlobal("fetch", fetch);
    const container = render();
    await settle();
    const save = [...container.querySelectorAll("button")].find((button) =>
      button.textContent?.includes("Save current results")
    );
    if (!save) throw new Error("expected save-results button");

    click(save);
    await settle();

    expect(container.textContent).toContain("Failed to save results. Please try again.");
  });

  it("explains when creating a group fails", async () => {
    const container = render();
    await settle();
    const name = container.querySelector<HTMLInputElement>('input[placeholder="Group name"]');
    const create = [...container.querySelectorAll("button")].find((button) => button.textContent === "Create");
    if (!name || !create) throw new Error("expected group create controls");

    change(name, "Reading group");
    click(create);
    await settle();

    expect(container.textContent).toContain("Could not create group. Please try again.");
  });

  it("explains when joining a group fails", async () => {
    const container = render();
    await settle();
    const code = container.querySelector<HTMLInputElement>('input[placeholder^="Invite code"]');
    const join = [...container.querySelectorAll("button")].find((button) => button.textContent === "Join");
    if (!code || !join) throw new Error("expected group join controls");

    change(code, "BAD-CODE");
    click(join);
    await settle();

    expect(container.textContent).toContain("Could not join group. Check the invite code and try again.");
  });
});

describe("account and auth controls (design delta phase 5)", () => {
  const files = [
    "src/app/account/page.tsx",
    "src/app/auth/signin/page.tsx",
    "src/app/auth/signup/page.tsx",
    "src/components/annotations/AnnotationEditor.tsx",
  ];

  it("routes every control through the button primitive", () => {
    const offenders = files.flatMap((file) => {
      const text = readFileSync(resolve(process.cwd(), file), "utf8");
      // The hand-rolled secondary: an outlined Stone 600 control with a
      // near-white hover fill. Nine copies, none of which invert.
      return /border-stone-600|hover:bg-stone-100/.test(text) ? [file] : [];
    });

    expect(offenders).toEqual([]);
  });

  it("imports the button primitive wherever it renders a control", () => {
    for (const file of files) {
      const text = readFileSync(resolve(process.cwd(), file), "utf8");
      expect(text).toContain('from "@/components/Button"');
    }
  });

  it("keeps no frozen Stone ramp class on any of them", () => {
    const offenders = files.flatMap((file) => {
      const text = readFileSync(resolve(process.cwd(), file), "utf8");
      const match = text.match(/(?:text|bg|border)-stone-\d{2,3}(?![\w-])/);
      return match ? [`${file}: ${match[0]}`] : [];
    });

    expect(offenders).toEqual([]);
  });

  it("routes every error state through the warning ink", () => {
    const offenders = files.flatMap((file) => {
      const text = readFileSync(resolve(process.cwd(), file), "utf8");
      return /text-red-\d{3}/.test(text) ? [file] : [];
    });

    expect(offenders).toEqual([]);
  });

  it("gives the saved-group card a hover that is actually a change", () => {
    const text = readFileSync(
      resolve(process.cwd(), "src/app/account/page.tsx"),
      "utf8",
    );

    // The card's resting ground is `bg-surface-2`. The pre-delta hover was
    // `hover:bg-stone-100`, and the literal swap in the plan's Step 3 sent it
    // to `hover:bg-surface-2` — the colour it already was. A hover state that
    // resolves to the base is invisible, and nothing else in the suite looks
    // at a `:hover` variant, so it would have shipped silently.
    expect(text).toContain("bg-surface-2 rounded-sharp p-3 hover:bg-surface-1");
    expect(text).not.toContain("hover:bg-surface-2 transition-colors");
  });

  it("leaves no red utility anywhere in src", () => {
    // The six sites were spread across four features. A per-file list goes
    // stale; this one closes the class of defect rather than the instances.
    const offenders = sourceFiles(resolve(process.cwd(), "src")).flatMap((file) => {
      const match = readFileSync(file, "utf8").match(/(?:text|bg|border)-red-\d{2,3}(?![\w-])/);
      return match ? [`${relative(process.cwd(), file)}: ${match[0]}`] : [];
    });

    expect(offenders).toEqual([]);
  });

  it("pairs every warning-ink error message with an alert role or a live region", () => {
    // D16 claims every text-red-600 site already has role="alert" or sits in
    // an aria-live region, which justifies desaturating it to the amber
    // warning ink without losing severity. That premise was false at the
    // signin/signup error paragraphs (no role, no live region) until this
    // task added role="alert" there. This asserts the pairing going forward
    // rather than assuming it.
    const offenders = files.flatMap((file) => {
      const text = readFileSync(resolve(process.cwd(), file), "utf8");
      const errorSpanPattern = /<(?:p|span)[^>]*text-warning-text[^>]*>/g;
      const matches = text.match(errorSpanPattern) ?? [];
      const badMatches = matches.filter(
        (tag) => !/role="alert"/.test(tag) && !/aria-live/.test(tag)
      );
      return badMatches.length > 0 ? [`${file}: ${badMatches.join(", ")}`] : [];
    });

    expect(offenders).toEqual([]);
  });
});
