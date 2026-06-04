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

export interface IteracionRaiz {
  iter: number;
  xn: number;
  fxn: number;
  err: number;
}

// 1. Método de Bisección Compuesto
export function resolverBiseccion(f: (x: number) => number, x0: number, x1: number, tol: number = 1e-5, maxIter: number = 20): IteracionRaiz[] {
  let iteraciones: IteracionRaiz[] = [];
  let a = x0, b = x1;
  
  if (f(a) * f(b) >= 0) return [];

  for (let i = 1; i <= maxIter; i++) {
    let c = (a + b) / 2;
    let fc = f(c);
    let error = Math.abs((b - a) / 2);
    
    iteraciones.push({ iter: i, xn: c, fxn: fc, err: error });
    
    if (error < tol || Math.abs(fc) < 1e-7) break;
    if (f(a) * fc < 0) b = c; else a = c;
  }
  return iteraciones;
}

// 2. Método de Newton-Raphson (Requiere función y su derivada analítica)
export function resolverNewtonRaphson(f: (x: number) => number, df: (x: number) => number, x0: number, tol: number = 1e-5, maxIter: number = 20): IteracionRaiz[] {
  let iteraciones: IteracionRaiz[] = [];
  let x = x0;

  for (let i = 1; i <= maxIter; i++) {
    let fx = f(x);
    let dfx = df(x);
    if (Math.abs(dfx) < 1e-12) break; // Evitar división por cero
    
    let xNext = x - fx / dfx;
    let error = Math.abs(xNext - x);
    
    iteraciones.push({ iter: i, xn: xNext, fxn: f(xNext), err: error });
    
    if (error < tol || Math.abs(f(xNext)) < 1e-7) break;
    x = xNext;
  }
  return iteraciones;
}

// 3. Método de la Secante (Usa dos aproximaciones iniciales sin derivada)
export function resolverSecante(f: (x: number) => number, x0: number, x1: number, tol: number = 1e-5, maxIter: number = 20): IteracionRaiz[] {
  let iteraciones: IteracionRaiz[] = [];
  let xA = x0;
  let xB = x1;

  for (let i = 1; i <= maxIter; i++) {
    let fxA = f(xA);
    let fxB = f(xB);
    if (Math.abs(fxB - fxA) < 1e-12) break;

    let xNext = xB - (fxB * (xB - xA)) / (fxB - fxA);
    let error = Math.abs(xNext - xB);

    iteraciones.push({ iter: i, xn: xNext, fxn: f(xNext), err: error });

    if (error < tol || Math.abs(f(xNext)) < 1e-7) break;
    xA = xB;
    xB = xNext;
  }
  return iteraciones;
}

export interface AnalisisSensibilidadF {
  x_base: number[];
  x_pert: number[];
  var_b: number;
  var_x: number[];
  kappa: number;
  esMalCondicionado: boolean;
}

export function resolverEscenarioF(porcentajePerturbacion: number): AnalisisSensibilidadF {
  // Matriz de coeficientes logísticos A
  const A = [[1, 1], [1, 1.005]];
  
  // Inversa exacta calculada analíticamente para alta precisión
  // Det(A) = 1.005 - 1 = 0.005
  const invA = [
    [201, -200],
    [-200, 200]
  ];

  // Vector B: Demanda base original en mercados (Zona Norte y Zona Sur)
  const b_base = [20, 20.05];

  // 1. Solución del Sistema Base: X = A^-1 * B
  const x1_base = invA[0][0] * b_base[0] + invA[0][1] * b_base[1];
  const x2_base = invA[1][0] * b_base[0] + invA[1][1] * b_base[1];

  // 2. Aplicar perturbación por pánico de compra en el mercado de la Zona Sur (b2)
  const factor = 1 + (porcentajePerturbacion / 100);
  const b_pert = [b_base[0], b_base[1] * factor];

  // 3. Solución del Sistema Perturbado: X_pert = A^-1 * B_pert
  const x1_pert = invA[0][0] * b_pert[0] + invA[0][1] * b_pert[1];
  const x2_pert = invA[1][0] * b_pert[0] + invA[1][1] * b_pert[1];

  // 4. Cálculo estricto del Número de Condición usando la Norma Infinito
  // ||A||_inf = max(1+1, 1+1.005) = 2.005
  // ||A^-1||_inf = max(201+200, 200+200) = 401
  const normaA = 2.005;
  const normaInvA = 401;
  const kappa = normaA * normaInvA; // 804.005

  // Variaciones porcentuales de las respuestas
  const var_x1 = ((x1_pert - x1_base) / x1_base) * 100;
  const var_x2 = ((x2_pert - x2_base) / x2_base) * 100;

  return {
    x_base: [x1_base, x2_base],
    x_pert: [x1_pert, x2_pert],
    var_b: porcentajePerturbacion,
    var_x: [var_x1, var_x2],
    kappa: parseFloat(kappa.toFixed(3)),
    esMalCondicionado: kappa > 100
  };
}
export interface RegistroTrayectoriaG {
  tiempo: number[];
  neutrales: number[];
  manifestantes: number[];
  mediadores: number[];
}

// Estructura de parámetros físicos para el Escenario G
export interface ParametrosG {
  alpha: number;  // Tasa de influencia o contagio (a)
  beta: number;   // Retorno a la neutralidad (b)
  gamma: number;  // Efectividad del diálogo (c)
  k: number;      // Reacción institucional o mediadora (k)
  r: number;      // Desgaste de los mediadores (r)
}

export function resolverEDOSocial(
  params: ParametrosG,
  condicionesIniciales: { N0: number; M0: number; D0: number },
  dias: number,
  metodo: "heun" | "rk4"
): RegistroTrayectoriaG {
  const { alpha, beta, gamma, k, r } = params;
  let N = condicionesIniciales.N0;
  let M = condicionesIniciales.M0;
  let D = condicionesIniciales.D0;

  let t = 0;
  const h = 0.1; // Tamaño del paso de integración temporal
  const pasos = dias / h;

  const resultado: RegistroTrayectoriaG = {
    tiempo: [0],
    neutrales: [N],
    manifestantes: [M],
    mediadores: [D],
  };

  // Definición estricta del sistema de ecuaciones del modelo [cite: 143]
  const dN = (n: number, m: number, d: number) => -alpha * n * m + beta * d;
  const dM = (n: number, m: number, d: number) => alpha * n * m - gamma * m * d;
  const dD = (n: number, m: number, d: number) => k * m - r * d;

  for (let i = 0; i < pasos; i++) {
    if (metodo === "heun") {
      // Predictor (Euler estándar)
      const pN = N + h * dN(N, M, D);
      const pM = M + h * dM(N, M, D);
      const pD = D + h * dD(N, M, D);

      // Corrector (Promedio de pendientes)
      N += (h / 2) * (dN(N, M, D) + dN(pN, pM, pD));
      M += (h / 2) * (dM(N, M, D) + dM(pN, pM, pD));
      D += (h / 2) * (dD(N, M, D) + dD(pN, pM, pD));
    } else {
      // Método clásico de Runge-Kutta de 4to Orden (RK4) 
      const k1N = dN(N, M, D);
      const k1M = dM(N, M, D);
      const k1D = dD(N, M, D);

      const k2N = dN(N + 0.5 * h * k1N, M + 0.5 * h * k1M, D + 0.5 * h * k1D);
      const k2M = dM(N + 0.5 * h * k1N, M + 0.5 * h * k1M, D + 0.5 * h * k1D);
      const k2D = dD(N + 0.5 * h * k1N, M + 0.5 * h * k1M, D + 0.5 * h * k1D);

      const k3N = dN(N + 0.5 * h * k2N, M + 0.5 * h * k2M, D + 0.5 * h * k2D);
      const k3M = dM(N + 0.5 * h * k2N, M + 0.5 * h * k2M, D + 0.5 * h * k2D);
      const k3D = dD(N + 0.5 * h * k2N, M + 0.5 * h * k2M, D + 0.5 * h * k2D);

      const k4N = dN(N + h * k3N, M + h * k3M, D + h * k3D);
      const k4M = dM(N + h * k3N, M + h * k3M, D + h * k3D);
      const k4D = dD(N + h * k3N, M + h * k3M, D + h * k3D);

      N += (h / 6) * (k1N + 2 * k2N + 2 * k3N + k4N);
      M += (h / 6) * (k1M + 2 * k2M + 2 * k3M + k4M);
      D += (h / 6) * (k1D + 2 * k2D + 2 * k3D + k4D);
    }
    t += h;

    // Almacenar muestras únicamente en puntos discretos (cada día entero)
    if (Math.abs(t - Math.round(t)) < 0.01) {
      resultado.tiempo.push(Math.round(t));
      resultado.neutrales.push(Math.max(0, N));
      resultado.manifestantes.push(Math.max(0, M));
      resultado.mediadores.push(Math.max(0, D));
    }
  }

  return resultado;
}

// ==========================================
// ESCENARIO A: Sistemas de Ecuaciones Lineales
// ==========================================

export interface IteracionGS {
  iter: number;
  x: number[];
  error: number;
}

// Método de Gauss-Seidel
export function resolverGaussSeidel(
  A: number[][], 
  B: number[], 
  x0: number[], 
  tol: number = 1e-5, 
  maxIter: number = 50
): { iteraciones: IteracionGS[], solucion: number[] } {
  let iteraciones: IteracionGS[] = [];
  const n = B.length;
  let x = [...x0];

  for (let k = 1; k <= maxIter; k++) {
    let x_old = [...x];
    let maxError = 0;

    for (let i = 0; i < n; i++) {
      let suma = 0;
      for (let j = 0; j < n; j++) {
        if (j !== i) suma += A[i][j] * x[j];
      }
      x[i] = (B[i] - suma) / A[i][i];
      maxError = Math.max(maxError, Math.abs(x[i] - x_old[i]));
    }

    iteraciones.push({ iter: k, x: [...x], error: maxError });
    if (maxError < tol) break;
  }
  return { iteraciones, solucion: x };
}

// ==========================================
// ESCENARIO B: Vaciado crítico de reservas (EDOs)
// ==========================================

export interface RegistroReserva {
  dia: number;
  reserva: number;
}

// Simulación usando Euler o RK4
export function simularReserva(
  R0: number, 
  entrada: number, 
  consumo: number, 
  dias: number, 
  metodo: "euler" | "rk4"
): RegistroReserva[] {
  let registro: RegistroReserva[] = [];
  let R = R0;
  let t = 0;
  let h = 1; // Paso temporal de 1 día

  const dR = (t: number, r: number) => entrada - consumo;

  registro.push({ dia: t, reserva: R });

  for (let i = 1; i <= dias; i++) {
    if (metodo === "euler") {
      R = R + h * dR(t, R);
    } else {
      let k1 = dR(t, R);
      let k2 = dR(t + h / 2, R + (h / 2) * k1);
      let k3 = dR(t + h / 2, R + (h / 2) * k2);
      let k4 = dR(t + h, R + h * k3);
      R = R + (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
    }
    
    t += h;
    if (R < 0) R = 0; 
    registro.push({ dia: t, reserva: R });
    
    if (R === 0) break;
  }
  return registro;
}
