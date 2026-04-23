"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export const STUDY_SESSION_KEY = "study:filters"; // reserved; actual filters code is Phase 4a

export default function StudyLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    // When the user leaves /study/*, clear any persisted filter state
    return () => {
      if (!window.location.pathname.startsWith("/study")) {
        sessionStorage.removeItem(STUDY_SESSION_KEY);
      }
    };
  }, [pathname]);

  return <>{children}</>;
}
