"use client";

import React, { createContext, useContext } from "react";

/**
 * Context providing the ordered, filtered list of persona IDs currently
 * visible in the Personas page grid. Used by PersonaModal for prev/next
 * navigation without prop-drilling through multiple layers.
 */
export interface PersonasContextValue {
  /** All IDs in the current filtered set (order matches grid order). */
  filteredIds: string[];
}

const PersonasContext = createContext<PersonasContextValue>({
  filteredIds: [],
});

export function PersonasProvider({
  filteredIds,
  children,
}: PersonasContextValue & { children: React.ReactNode }) {
  return (
    <PersonasContext.Provider value={{ filteredIds }}>
      {children}
    </PersonasContext.Provider>
  );
}

export function usePersonasContext(): PersonasContextValue {
  return useContext(PersonasContext);
}
