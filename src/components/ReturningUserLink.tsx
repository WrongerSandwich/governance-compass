"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function ReturningUserLink() {
  const [resultsHref, setResultsHref] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("lastResults");
    if (!stored) return;
    if (stored.startsWith("id:")) {
      setResultsHref(`/results/${stored.slice(3)}`);
    } else {
      setResultsHref(`/results?r=${stored}`);
    }
  }, []);

  if (!resultsHref) return null;

  return (
    <p className="mt-2">
      <Link
        href={resultsHref}
        className="text-xs text-text-tertiary hover:text-text-secondary transition-colors duration-150"
      >
        or view your existing results
      </Link>
    </p>
  );
}
