"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface ComparisonRadarProps {
  data: { topic: string; scoreA: number; scoreB: number }[];
  labelA: string;
  labelB: string;
}

export function ComparisonRadar({
  data,
  labelA,
  labelB,
}: ComparisonRadarProps) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <RadarChart data={data}>
        <PolarGrid stroke="#e2e8f0" />
        <PolarAngleAxis
          dataKey="topic"
          tick={{ fill: "#64748b", fontSize: 12 }}
        />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
        <Radar
          name={labelA}
          dataKey="scoreA"
          stroke="#6366f1"
          fill="#6366f1"
          fillOpacity={0.15}
          strokeWidth={2}
        />
        <Radar
          name={labelB}
          dataKey="scoreB"
          stroke="#f43f5e"
          fill="#f43f5e"
          fillOpacity={0.15}
          strokeWidth={2}
        />
        <Legend />
      </RadarChart>
    </ResponsiveContainer>
  );
}
