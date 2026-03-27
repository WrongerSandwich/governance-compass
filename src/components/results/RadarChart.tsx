"use client";

import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

interface RadarChartProps {
  scores: { topicName: string; score: number }[];
  color?: string;
}

export function RadarChart({
  scores,
  color = "#6366f1",
}: RadarChartProps) {
  const data = scores.map((s) => ({
    topic: s.topicName,
    value: s.score,
  }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <RechartsRadarChart data={data}>
        <PolarGrid stroke="#e2e8f0" />
        <PolarAngleAxis
          dataKey="topic"
          tick={{ fill: "#64748b", fontSize: 12 }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tick={{ fill: "#94a3b8", fontSize: 10 }}
        />
        <Radar
          dataKey="value"
          stroke={color}
          fill={color}
          fillOpacity={0.2}
          strokeWidth={2}
        />
      </RechartsRadarChart>
    </ResponsiveContainer>
  );
}
