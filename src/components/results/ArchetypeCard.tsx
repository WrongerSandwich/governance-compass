"use client";

import { useState } from "react";

interface ArchetypeCardProps {
  primary: {
    name: string;
    matchPercentage: number;
    summary: string;
    description: string;
    tension: string;
  };
  secondary: {
    name: string;
    matchPercentage: number;
    summary: string;
  };
  isBlended: boolean;
}

export function ArchetypeCard({
  primary,
  secondary,
  isBlended,
}: ArchetypeCardProps) {
  const [expanded, setExpanded] = useState(false);
  const lowMatch = primary.matchPercentage < 55;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      {isBlended && (
        <div className="mb-4">
          <span className="inline-block bg-purple-100 text-purple-700 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide">
            Blended Type
          </span>
          <p className="mt-1 text-sm text-purple-700">
            Your profile draws nearly equally from both types
          </p>
        </div>
      )}

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <h2 className="text-2xl font-bold text-gray-900">{primary.name}</h2>
        <span className="inline-block bg-indigo-100 text-indigo-700 text-sm font-semibold px-3 py-1 rounded-full whitespace-nowrap">
          {primary.matchPercentage}% match
        </span>
      </div>

      {lowMatch && (
        <p className="mt-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          Your profile is unusually distributed and doesn&apos;t map cleanly to
          any single governance philosophy.
        </p>
      )}

      <p className="mt-3 text-gray-700">{primary.summary}</p>

      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="mt-3 flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
        aria-expanded={expanded}
      >
        {expanded ? "Show less" : "Learn more"}
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          <p className="text-gray-700 text-sm leading-relaxed">
            {primary.description}
          </p>
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Characteristic Tension
            </h3>
            <p className="text-gray-700 text-sm">{primary.tension}</p>
          </div>
        </div>
      )}

      <hr className="my-5 border-gray-200" />

      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          Adjacent Type
        </p>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <span className="font-semibold text-gray-800">{secondary.name}</span>
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            {secondary.matchPercentage}% match
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">Your second-closest match</p>
        {secondary.summary && (
          <p className="text-sm text-gray-600 mt-2">{secondary.summary}</p>
        )}
      </div>
    </div>
  );
}
