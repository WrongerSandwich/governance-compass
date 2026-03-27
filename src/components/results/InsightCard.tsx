import type { Insight } from "@/lib/insights";

const TYPE_STYLES = {
  "per-topic": "border-l-indigo-500",
  "cross-topic": "border-l-purple-500",
  divergence: "border-l-amber-500",
};

const TYPE_LABELS = {
  "per-topic": "Topic",
  "cross-topic": "Pattern",
  divergence: "Notable",
};

export function InsightCard({ insight }: { insight: Insight }) {
  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 border-l-4 ${TYPE_STYLES[insight.type]} p-4 shadow-sm`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-medium text-gray-400 uppercase">
          {TYPE_LABELS[insight.type]}
        </span>
      </div>
      <h4 className="font-semibold text-gray-900">{insight.title}</h4>
      <p className="text-gray-600 text-sm mt-1">{insight.description}</p>
    </div>
  );
}
