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
  isLast?: boolean;
  className?: string;
}

/**
 * Gazetteer-style cluster entry. Two-column on desktop (radar left, text
 * right), stacked on mobile. Hairline separator beneath each entry except
 * the last. No card chrome — the radar anchors the entry visually, and
 * prose density does the rest.
 */
export function ClusterCard({
  clusterId,
  centroidAxisScores,
  clusterData,
  topAxesProse,
  isLast = false,
  className,
}: ClusterCardProps) {
  const colorVar = clusterData.colorVar;
  const matchStrength = bucketMatchStrength(clusterData.matchDistance);
  const shareFormatted = (clusterData.share * 100).toFixed(1);

  return (
    <section
      id={`cluster-${clusterId}`}
      className={`cluster-entry ${className ?? ""}`}
      style={{
        scrollMarginTop: "72px",
        paddingTop: "24px",
        paddingBottom: "24px",
        borderBottom: isLast ? undefined : "0.5px solid var(--border-secondary)",
      }}
    >
      <div
        className="cluster-entry-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "20px",
          alignItems: "start",
        }}
      >
        {/* Radar thumbnail */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Radar
            scores={centroidAxisScores}
            size={200}
            colorVar={colorVar}
          />
        </div>

        {/* Text column */}
        <div>
          <p
            style={{
              fontSize: "17px",
              fontFamily: "var(--font-serif)",
              fontWeight: 500,
              color: "var(--text-primary)",
              lineHeight: 1.3,
              marginBottom: "4px",
            }}
          >
            <span style={{ color: `var(${colorVar})` }}>{clusterData.code}</span>
            {" — "}
            {clusterData.label}
          </p>

          {/* Size + share — sans, not mono */}
          <p
            style={{
              fontSize: "12px",
              color: "var(--text-tertiary)",
              marginBottom: "14px",
            }}
          >
            {clusterData.size} personas · {shareFormatted}%
          </p>

          {/* Nearest archetype */}
          <div style={{ marginBottom: "14px" }}>
            <p
              style={{
                fontSize: "10px",
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
                fontSize: "10px",
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
                    fontSize: "13px",
                    color: "var(--text-secondary)",
                    lineHeight: 1.5,
                    paddingLeft: "12px",
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
      </div>

      {/* Two-column layout above the md breakpoint. */}
      <style>{`
        @media (min-width: 720px) {
          .cluster-entry-grid {
            grid-template-columns: 220px 1fr !important;
            gap: 32px !important;
          }
          .cluster-entry-grid > div:first-child {
            justify-content: flex-start !important;
          }
        }
      `}</style>
    </section>
  );
}
