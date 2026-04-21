export function computeEuclideanDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) throw new Error("Vectors must have equal length");
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
}

export function computeHistogram(
  values: number[],
  min: number,
  max: number,
  bins: number
): number[] {
  const counts = new Array<number>(bins).fill(0);
  const range = max - min;
  for (const v of values) {
    let bin = Math.floor(((v - min) / range) * bins);
    if (bin === bins) bin = bins - 1; // clamp exactly-max into last bin
    if (bin < 0 || bin >= bins) continue;
    counts[bin]++;
  }
  return counts;
}

export function computePearson(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n < 2) return 0;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let dx2 = 0;
  let dy2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx;
    const dy = ys[i] - my;
    num += dx * dy;
    dx2 += dx * dx;
    dy2 += dy * dy;
  }
  const denom = Math.sqrt(dx2 * dy2);
  // Convention: returns 0 when either series has zero variance (mathematically undefined); the UI renders this as "—" or similar.
  if (denom === 0) return 0;
  return num / denom;
}

export function computeCorrelationMatrix(rowsOfAxes: number[][]): number[][] {
  const n = rowsOfAxes[0].length;
  const cols: number[][] = Array.from({ length: n }, (_, j) =>
    rowsOfAxes.map((row) => row[j])
  );
  // Compute lower triangle + diagonal (78 calls for 12×12) and mirror to upper
  const matrix: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    matrix[i][i] = 1.0;
    for (let j = 0; j < i; j++) {
      const r = computePearson(cols[i], cols[j]);
      matrix[i][j] = r;
      matrix[j][i] = r;
    }
  }
  return matrix;
}

export function bucketMatchStrength(
  distance: number
): "strong" | "moderate" | "close" | "weak" {
  if (distance < 1.0) return "strong";
  if (distance < 1.5) return "moderate";
  if (distance < 2.0) return "close";
  return "weak";
}

export function computeMedian(sorted: number[]): number {
  const n = sorted.length;
  if (n === 0) return 0;
  const mid = Math.floor(n / 2);
  return n % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function computePercentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(sorted.length - 1, idx))];
}
