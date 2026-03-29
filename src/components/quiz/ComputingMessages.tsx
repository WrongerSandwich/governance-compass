"use client";

import { useEffect, useState } from "react";

const MESSAGES = [
  "Scoring your dilemma choices\u2026",
  "Weighting your scale responses\u2026",
  "Analyzing your budget allocation\u2026",
  "Detecting tensions between stated and revealed preferences\u2026",
  "Matching your profile across 12 governance archetypes\u2026",
];

export function ComputingMessages() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 1400);
    return () => clearInterval(interval);
  }, []);

  return (
    <p
      className="text-sm text-text-tertiary transition-opacity duration-200"
      key={index}
    >
      {MESSAGES[index]}
    </p>
  );
}
