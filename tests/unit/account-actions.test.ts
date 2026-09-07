/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";

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
