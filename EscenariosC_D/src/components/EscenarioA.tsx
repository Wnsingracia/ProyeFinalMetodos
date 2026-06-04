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
