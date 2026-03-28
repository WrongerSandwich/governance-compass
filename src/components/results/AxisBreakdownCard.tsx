"use client";

import { useState } from "react";
import { ScoreBar } from "./ScoreBar";

export interface AxisBreakdownCardProps {
  axisId: number;
  name: string;
  poleALabel: string;
  poleBLabel: string;
  domain: string;
  finalScore: number;
  confidence: string;
  tension: {
    detected: boolean;
    level: string;
    direction: string | null;
    narrative: string | null;
  };
  components: {
    fc: number;
    sc: number;
    bg: number | null;
  };
}

const CONFIDENCE_CONFIG: Record<
  string,
  { icon: React.ReactNode; text: string; className: string }
> = {
  high: {
    icon: (
      <svg
        className="w-4 h-4 text-green-500 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
    text: "High confidence — all modalities agree",
    className: "text-green-700",
  },
  moderate: {
    icon: (
      <span
        className="w-2.5 h-2.5 rounded-full bg-yellow-400 shrink-0 mt-0.5"
        aria-hidden="true"
      />
    ),
    text: "Moderate confidence",
    className: "text-yellow-700",
  },
  low: {
    icon: (
      <span
        className="w-2.5 h-2.5 rounded-full bg-orange-400 shrink-0 mt-0.5"
        aria-hidden="true"
      />
    ),
    text: "Low confidence — modalities diverge",
    className: "text-orange-700",
  },
  conflicted: {
    icon: (
      <svg
        className="w-4 h-4 text-red-500 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
        />
      </svg>
    ),
    text: "Conflicted — significant modality disagreement",
    className: "text-red-700",
  },
};

const TENSION_LEVEL_COLORS: Record<string, string> = {
  low: "bg-yellow-100 text-yellow-800",
  moderate: "bg-orange-100 text-orange-800",
  high: "bg-red-100 text-red-800",
};

function formatScore(val: number | null): string {
  if (val === null) return "N/A";
  const clamped = Math.max(-1, Math.min(1, val));
  return (clamped > 0 ? "+" : "") + clamped.toFixed(2);
}

export function AxisBreakdownCard({
  axisId,
  name,
  poleALabel,
  poleBLabel,
  domain,
  finalScore,
  confidence,
  tension,
  components,
}: AxisBreakdownCardProps) {
  const [expanded, setExpanded] = useState(false);

  const confidenceKey = confidence.toLowerCase();
  const confidenceConfig =
    CONFIDENCE_CONFIG[confidenceKey] ?? CONFIDENCE_CONFIG.low;

  const tensionBadgeClass =
    TENSION_LEVEL_COLORS[tension.level?.toLowerCase()] ??
    "bg-gray-100 text-gray-700";

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
      {/* Heading */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
            {domain} &middot; Axis {axisId}
          </p>
          <h3 className="text-base font-bold text-gray-900">{name}</h3>
        </div>
      </div>

      {/* Score bar */}
      <ScoreBar
        score={finalScore}
        poleALabel={poleALabel}
        poleBLabel={poleBLabel}
      />

      {/* Confidence indicator */}
      <div className="flex items-start gap-2">
        {confidenceConfig.icon}
        <span className={`text-sm ${confidenceConfig.className}`}>
          {confidenceConfig.text}
        </span>
      </div>

      {/* Tension block */}
      {tension.detected && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-1.5">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-amber-600 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${tensionBadgeClass}`}
            >
              {tension.level} tension
            </span>
          </div>
          {tension.narrative && (
            <p className="text-sm text-amber-800">{tension.narrative}</p>
          )}
          <p className="text-xs text-amber-700 font-medium">
            Stated preference vs. budget allocation divergence
          </p>
        </div>
      )}

      {/* Expandable scoring breakdown */}
      <div>
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
          aria-expanded={expanded}
        >
          {expanded ? "Hide breakdown" : "Show scoring breakdown"}
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
          <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Forced Choice</p>
                <p className="text-sm font-semibold text-gray-800 tabular-nums">
                  {formatScore(components.fc)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Calibrated Scale</p>
                <p className="text-sm font-semibold text-gray-800 tabular-nums">
                  {formatScore(components.sc)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Budget</p>
                <p className="text-sm font-semibold text-gray-800 tabular-nums">
                  {formatScore(components.bg)}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-400 text-center border-t border-gray-200 pt-2">
              Weights applied: FC 40% &bull; Scale 40% &bull; Budget 20%
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
