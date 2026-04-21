import { Radar } from "@/components/study/Radar";
import { ArchetypeBadgeStudy } from "@/components/study/ArchetypeBadgeStudy";
import { bucketMatchStrength } from "@/lib/study/matchStrength";
import type { SyntheticStudyCluster } from "@/data/syntheticStudyClusters";
import type { ClusterId } from "@/lib/study/types";

export interface ClusterCardProps {
  clusterId: ClusterId;
  centroidAxisScores: number[];
  clusterData: SyntheticStudyCluster;
  topAxesProse: string[];
  className?: string;
}

export function ClusterCard({
  clusterId,
  centroidAxisScores,
  clusterData,
  topAxesProse,
  className,
}: ClusterCardProps) {
  const colorVar = clusterData.colorVar;
  const matchStrength = bucketMatchStrength(clusterData.matchDistance);
  const shareFormatted = (clusterData.share * 100).toFixed(1);

  return (
    <section
      id={`cluster-${clusterId}`}
      style={{
        border: "1px solid var(--border-secondary)",
        borderRadius: "6px",
        background: `color-mix(in oklab, var(${colorVar}) 5%, transparent)`,
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
      }}
      className={className}
    >
      {/* Radar thumbnail */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <Radar
          scores={centroidAxisScores}
          size={220}
          colorVar={colorVar}
        />
      </div>

      {/* Cluster header */}
      <div>
        <p
          style={{
            fontSize: "15px",
            fontFamily: "var(--font-serif)",
            fontWeight: 500,
            color: "var(--text-primary)",
            lineHeight: 1.4,
            marginBottom: "4px",
          }}
        >
          <span style={{ color: `var(${colorVar})` }}>{clusterData.code}</span>
          {" — "}
          {clusterData.label}
        </p>

        {/* Size + share */}
        <p
          style={{
            fontSize: "12px",
            fontFamily: "var(--font-mono)",
            color: "var(--text-tertiary)",
            marginBottom: "10px",
          }}
        >
          {clusterData.size} personas · {shareFormatted}%
        </p>

        {/* Nearest archetype */}
        <div style={{ marginBottom: "10px" }}>
          <p
            style={{
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--text-tertiary)",
              fontWeight: 500,
              marginBottom: "5px",
            }}
          >
            Nearest archetype
          </p>
          <ArchetypeBadgeStudy
            archetypeId={clusterData.nearestArchetypeId}
            archetypeName={clusterData.nearestArchetypeName}
            emergence={clusterData.nearestArchetypeEmergence}
            matchStrength={matchStrength}
            clusterId={clusterId}
          />
        </div>

        {/* Defining axes */}
        <div>
          <p
            style={{
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--text-tertiary)",
              fontWeight: 500,
              marginBottom: "5px",
            }}
          >
            Defining axes
          </p>
          <ul
            style={{
              margin: 0,
              padding: 0,
              listStyle: "none",
              display: "flex",
              flexDirection: "column",
              gap: "3px",
            }}
          >
            {topAxesProse.map((axis, i) => (
              <li
                key={i}
                style={{
                  fontSize: "12px",
                  fontFamily: "var(--font-sans)",
                  color: "var(--text-secondary)",
                  lineHeight: 1.5,
                  paddingLeft: "10px",
                  position: "relative",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    color: "var(--text-tertiary)",
                  }}
                >
                  ·
                </span>
                {axis}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
