import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type RenderHarnessOptions = {
  wrap?: (element: ReactNode) => ReactNode;
};

type MountedView = {
  container: HTMLDivElement;
  root: Root;
};

/** Whole class tokens for HTML and SVG elements. */
export function classes(element: Element): string[] {
  return Array.from(element.classList);
}

/**
 * Creates a jsdom render harness whose roots and containers are owned by one
 * test module. Register `cleanup` with that module's `afterEach` hook.
 */
export function createRenderHarness({
  wrap = (element) => element,
}: RenderHarnessOptions = {}) {
  const mounted: MountedView[] = [];

  function render(element: ReactNode): HTMLDivElement {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    // Register before rendering so a render-time throw cannot strand the root.
    mounted.push({ container, root });
    act(() => root.render(wrap(element)));
    return container;
  }

  function rerender(container: HTMLDivElement, element: ReactNode): void {
    const view = mounted.find((entry) => entry.container === container);
    if (!view) throw new Error("Cannot rerender a container this harness did not mount");
    act(() => view.root.render(wrap(element)));
  }

  function cleanup(): void {
    const errors: unknown[] = [];
    while (mounted.length) {
      const { container, root } = mounted.pop()!;
      try {
        act(() => root.unmount());
      } catch (error) {
        errors.push(error);
      } finally {
        container.remove();
      }
    }
    if (errors.length === 1) throw errors[0];
    if (errors.length > 1) {
      throw new AggregateError(errors, "Multiple React roots failed to unmount");
    }
  }

  return { cleanup, render, rerender };
}
