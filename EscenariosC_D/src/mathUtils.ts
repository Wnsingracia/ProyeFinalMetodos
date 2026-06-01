/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Point } from './types';

/**
 * Filter duplicate x-values and sort points by day
 */
export function getSortedPoints(points: Point[]): Point[] {
  // Use map to keep first instance of duplicates, or average them
  const cleaned: { [key: number]: number } = {};
  points.forEach((p) => {
    cleaned[p.x] = p.y;
  });

  return Object.keys(cleaned)
    .map((k) => ({ x: Number(k), y: cleaned[Number(k)] }))
    .sort((a, b) => a.x - b.x);
}

/**
 * Evaluates the Lagrange Interpolating Polynomial at any given point xVal
 */
export function evaluateLagrange(points: Point[], xVal: number): number {
  const sorted = getSortedPoints(points);
  const n = sorted.length;
  if (n === 0) return 0;
  if (n === 1) return sorted[0].y;

  let totalSum = 0;
  for (let i = 0; i < n; i++) {
    let term = sorted[i].y;
    for (let j = 0; j < n; j++) {
      if (j !== i) {
        const den = sorted[i].x - sorted[j].x;
        if (den !== 0) {
          term *= (xVal - sorted[j].x) / den;
        }
      }
    }
    totalSum += term;
  }
  return totalSum;
}

/**
 * Computes Newton Divided Differences.
 * Returns coefficients, the full table matrix, and the sorted points.
 */
export function computeNewtonTable(points: Point[]) {
  const sorted = getSortedPoints(points);
  const n = sorted.length;
  if (n === 0) return { coefs: [], table: [], sorted: [] };

  // Initialize n x n table filled with 0
  const table: number[][] = [];
  for (let i = 0; i < n; i++) {
    table[i] = new Array(n).fill(0);
    table[i][0] = sorted[i].y; // Column 0 are y values
  }

  // Build the divided difference table
  for (let j = 1; j < n; j++) {
    for (let i = j; i < n; i++) {
      const den = sorted[i].x - sorted[i - j].x;
      if (den !== 0) {
        table[i][j] = (table[i][j - 1] - table[i - 1][j - 1]) / den;
      } else {
        table[i][j] = 0;
      }
    }
  }

  // Coefficients are the diagonals (element table[i][i])
  const coefs: number[] = [];
  for (let i = 0; i < n; i++) {
    coefs.push(table[i][i]);
  }

  return { coefs, table, sorted };
}

/**
 * Evaluates the Newton Interpolating Polynomial at xVal
 */
export function evaluateNewton(points: Point[], xVal: number): number {
  const { coefs, sorted } = computeNewtonTable(points);
  const n = coefs.length;
  if (n === 0) return 0;
  if (n === 1) return sorted[0].y;

  let result = coefs[0];
  let product = 1;

  for (let i = 1; i < n; i++) {
    product *= (xVal - sorted[i - 1].x);
    result += coefs[i] * product;
  }

  return result;
}

/**
 * Solves the Natural Cubic Spline System (S''(x0) = S''(xn) = 0)
 * returns sorted points, h interval widths, and M array of second derivatives
 */
export function computeNaturalCubicSplines(points: Point[]) {
  const sorted = getSortedPoints(points);
  const n = sorted.length - 1; // Number of intervals
  if (sorted.length < 2) return null;

  const h: number[] = [];
  for (let i = 0; i < n; i++) {
    h.push(sorted[i + 1].x - sorted[i].x);
  }

  const M = new Array(sorted.length).fill(0); // Second derivatives: M0 = 0, Mn = 0

  if (n > 1) {
    const size = n - 1;
    const a = new Array(size).fill(0); // Sub-diagonal (M_{i-1})
    const b = new Array(size).fill(0); // Main-diagonal (M_i)
    const c = new Array(size).fill(0); // Super-diagonal (M_{i+1})
    const d = new Array(size).fill(0); // RHS vector

    for (let i = 0; i < size; i++) {
      const idx = i + 1; // actual index in node list
      a[i] = h[idx - 1] / 6;
      b[i] = (h[idx - 1] + h[idx]) / 3;
      c[i] = h[idx] / 6;
      d[i] = (sorted[idx + 1].y - sorted[idx].y) / h[idx] - (sorted[idx].y - sorted[idx - 1].y) / h[idx - 1];
    }

    // Thomas Algorithm helper arrays
    const cp = new Array(size).fill(0);
    const dp = new Array(size).fill(0);

    // Initialization
    cp[0] = c[0] / b[0];
    dp[0] = d[0] / b[0];

    // Forward sweep
    for (let i = 1; i < size; i++) {
      const den = b[i] - a[i] * cp[i - 1];
      if (den !== 0) {
        cp[i] = c[i] / den;
        dp[i] = (d[i] - a[i] * dp[i - 1]) / den;
      }
    }

    // Back substitution
    const solvedM = new Array(size).fill(0);
    solvedM[size - 1] = dp[size - 1];
    for (let i = size - 2; i >= 0; i--) {
      solvedM[i] = dp[i] - cp[i] * solvedM[i + 1];
    }

    // Put standard values back in second derivatives array
    for (let i = 0; i < size; i++) {
      M[i + 1] = solvedM[i];
    }
  }

  return { sorted, h, M };
}

/**
 * Evaluates the Cubic Spline Interpolation at xVal
 */
export function evaluateCubicSpline(points: Point[], xVal: number): number {
  const splineData = computeNaturalCubicSplines(points);
  if (!splineData) return 0;

  const { sorted, h, M } = splineData;
  const n = sorted.length - 1;

  // Under boundaries or extrapolation: handle linearly
  if (xVal <= sorted[0].x) {
    const h0 = h[0];
    const slope = - (M[0] * h0) / 3 - (M[1] * h0) / 6 + (sorted[1].y - sorted[0].y) / h0;
    return sorted[0].y + slope * (xVal - sorted[0].x);
  }

  if (xVal >= sorted[sorted.length - 1].x) {
    const lastIdx = n - 1;
    const hn = h[lastIdx];
    const slope = (M[lastIdx] * hn) / 6 + (M[lastIdx + 1] * hn) / 3 + (sorted[sorted.length - 1].y - sorted[sorted.length - 2].y) / hn;
    return sorted[sorted.length - 1].y + slope * (xVal - sorted[sorted.length - 1].x);
  }

  // Find the sub-interval index
  let idx = 0;
  for (let i = 0; i < n; i++) {
    if (xVal >= sorted[i].x && xVal <= sorted[i + 1].x) {
      idx = i;
      break;
    }
  }

  const xi = sorted[idx].x;
  const xip1 = sorted[idx + 1].x;
  const yi = sorted[idx].y;
  const yip1 = sorted[idx + 1].y;
  const hi = h[idx];
  const Mi = M[idx];
  const Mip1 = M[idx + 1];

  // Evaluate cubic spline formula for segment idx
  const term1 = (Mi / (6 * hi)) * Math.pow(xip1 - xVal, 3);
  const term2 = (Mip1 / (6 * hi)) * Math.pow(xVal - xi, 3);
  const term3 = (yi / hi - (hi * Mi) / 6) * (xip1 - xVal);
  const term4 = (yip1 / hi - (hi * Mip1) / 6) * (xVal - xi);

  return term1 + term2 + term3 + term4;
}

/**
 * Evaluates the smoothness / curvature index: Integral of S''(x)^2
 * Higher values indicate more noise or sharper curves.
 */
export function calculateSplineSmoothnessMetric(points: Point[]): { isStable: boolean; metricVal: number } {
  const sorted = getSortedPoints(points);
  if (sorted.length < 3) return { isStable: true, metricVal: 0 };
  const splineData = computeNaturalCubicSplines(points);
  if (!splineData) return { isStable: true, metricVal: 0 };

  const { h, M } = splineData;
  let integralOfMDoublePrimeSq = 0;
  for (let i = 0; i < h.length; i++) {
    const Mi = M[i];
    const Mip1 = M[i + 1];
    // S''(x) is linear on [x_i, x_{i+1}]: S''(x) = Mi * (xip1 - x)/hi + Mip1 * (x - xi)/hi
    // Integral of [S''(x)]^2 from xi to xip1 is: (hi / 3) * (Mi^2 + Mi*Mip1 + Mip1^2)
    const hi = h[i];
    integralOfMDoublePrimeSq += (hi / 3) * (Mi * Mi + Mi * Mip1 + Mip1 * Mip1);
  }

  // Lagrange checking: evaluate Lagrange at intermediate points and see if it oscillates too much
  let maxLagrangeOscillation = 0;
  for (let i = 0; i < sorted.length - 1; i++) {
    const midPoint = (sorted[i].x + sorted[i + 1].x) / 2;
    const yLagrange = evaluateLagrange(points, midPoint);
    const yBaseline = (sorted[i].y + sorted[i+1].y) / 2;
    const diff = Math.abs(yLagrange - yBaseline);
    if (diff > maxLagrangeOscillation) {
      maxLagrangeOscillation = diff;
    }
  }

  // An oscillation limit based on range of data
  const yValues = sorted.map(p => p.y);
  const yRange = Math.max(...yValues) - Math.min(...yValues);
  const rungeWarning = maxLagrangeOscillation > yRange * 1.5;

  return {
    isStable: !rungeWarning,
    metricVal: integralOfMDoublePrimeSq
  };
}

/**
 * Composite Trapezoidal Rule
 * h: interval width
 * y: array of N+1 values: y0, y1, ..., yN
 */
export function integrateTrapezoidal(y: number[], h: number): number {
  const n = y.length - 1;
  if (n <= 0) return 0;
  let sum = y[0] + y[n];
  for (let i = 1; i < n; i++) {
    sum += 2 * y[i];
  }
  return (h / 2) * sum;
}

/**
 * Composite Simpson's 1/3 Rule
 * Requires N (y.length - 1) to be an EVEN number
 */
export function integrateSimpson13(y: number[], h: number): number {
  const n = y.length - 1;
  if (n <= 0) return 0;
  if (n % 2 !== 0) {
    // If odd intervals, fallback to trapezoid for last step or print warning
    // For standard sample N is chosen to be even
  }
  let sum = y[0] + y[n];
  for (let i = 1; i < n; i++) {
    if (i % 2 === 1) {
      sum += 4 * y[i];
    } else {
      sum += 2 * y[i];
    }
  }
  return (h / 3) * sum;
}

/**
 * Composite Simpson's 3/8 Rule
 * Requires N (y.length - 1) to be a MULTIPLE of 3
 */
export function integrateSimpson38(y: number[], h: number): number {
  const n = y.length - 1;
  if (n <= 0) return 0;
  if (n % 3 !== 0) {
    // Standard multiple of 3 matching N
  }
  let sum = y[0] + y[n];
  for (let i = 1; i < n; i++) {
    if (i % 3 === 0) {
      sum += 2 * y[i];
    } else {
      sum += 3 * y[i];
    }
  }
  return ((3 * h) / 8) * sum;
}

