"use client";

import { useEffect, useRef } from "react";

/**
 * Window-level Escape handling for stacked UI layers.
 *
 * The study pages layer overlays over one another — an interactive map with a
 * region selection, a compare view over that, a persona modal over that. When
 * each layer owned a plain `window.addEventListener("keydown", ...)`, a single
 * Escape press ran all of them: closing the modal also cleared the map's
 * region selection behind it, and which layer "won" depended on listener
 * registration order.
 *
 * This hook keeps one listener and a LIFO stack of subscribers, so Escape is
 * delivered only to the layer mounted most recently — the topmost one.
 * Handlers are read through a ref, so a layer that rebuilds its callback on
 * every render (the map closes over a fresh `mode` object) keeps its position
 * in the stack instead of jumping back to the top.
 */
type HandlerRef = { current: () => void };

const stack: HandlerRef[] = [];
let listening = false;

function handleKeyDown(event: KeyboardEvent) {
  if (event.key !== "Escape") return;
  const top = stack[stack.length - 1];
  if (top) top.current();
}

export function useEscapeKey(onEscape: () => void, enabled = true): void {
  const handlerRef = useRef(onEscape);

  // Synced in an effect rather than during render: writing to a ref mid-render
  // is an impurity the React Compiler rejects.
  useEffect(() => {
    handlerRef.current = onEscape;
  });

  useEffect(() => {
    if (!enabled) return;

    const entry = handlerRef;
    stack.push(entry);
    if (!listening) {
      window.addEventListener("keydown", handleKeyDown);
      listening = true;
    }

    return () => {
      const index = stack.lastIndexOf(entry);
      if (index !== -1) stack.splice(index, 1);
      if (stack.length === 0 && listening) {
        window.removeEventListener("keydown", handleKeyDown);
        listening = false;
      }
    };
  }, [enabled]);
}
