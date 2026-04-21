export type MatchStrength = "strong" | "moderate" | "close" | "weak";

export function bucketMatchStrength(distance: number): MatchStrength {
  if (distance < 1.0) return "strong";
  if (distance < 1.5) return "moderate";
  if (distance < 2.0) return "close";
  return "weak";
}
