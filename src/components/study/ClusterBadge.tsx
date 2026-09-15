import Link from "next/link";
import { getCluster } from "@/data/syntheticStudyClusters";
import type { ClusterId } from "@/lib/study/types";

export interface ClusterBadgeProps {
  clusterId: ClusterId;
  showLabel?: boolean;
  /** Explicit href. Pass `null` to render a plain span (no interactive element). */
  href?: string | null;
  className?: string;
}

export function ClusterBadge({
  clusterId,
  showLabel = true,
  href,
  className,
}: ClusterBadgeProps) {
  const cluster = getCluster(clusterId);
  const colorVar = cluster.colorVar;
  const defaultHref = `/study/patterns#cluster-${clusterId}`;
  const resolvedHref = href === null ? null : (href ?? defaultHref);

  const inner = (
    <>
      <span className="font-medium" style={{ fontVariant: "normal" }}>
        {cluster.code}
      </span>
      {showLabel && (
        <span className="ml-1 font-normal">{cluster.label}</span>
      )}
    </>
  );

  // `body-xs` rather than the mono label layer: the chip carries a cluster
  // descriptor ("Distributed governance") beside its code, and a label role is
  // for a key, not a phrase. The colour stays inline because it is computed
  // from the cluster. Composed with the caller's class, never overwriting it.
  const chipClass = className ? `body-xs ${className}` : "body-xs";

  const chipStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "baseline",
    gap: 0,
    padding: "1px 6px",
    borderRadius: "var(--radius)",
    border: `0.5px solid var(${colorVar})`,
    color: `var(${colorVar})`,
    backgroundColor: `color-mix(in srgb, var(${colorVar}) 10%, transparent)`,
    textDecoration: "none",
    whiteSpace: "nowrap",
  };

  if (resolvedHref === null) {
    return (
      <span style={chipStyle} className={chipClass}>
        {inner}
      </span>
    );
  }

  return (
    <Link
      href={resolvedHref}
      style={chipStyle}
      className={chipClass}
    >
      {inner}
    </Link>
  );
}
