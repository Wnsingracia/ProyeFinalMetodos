/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Point } from "../types";
import {
  getSortedPoints,
  computeNewtonTable,
  computeNaturalCubicSplines
} from "../mathUtils";
import {
  Layers,
  HelpCircle,
  TrendingDown,
  Percent,
  Calculator,
  Binary,
  Cpu,
  Bookmark
} from "lucide-react";

interface Props {
  points: Point[];
  selectedDay: number;
}

export default function NumericalMethodsProcedures({ points, selectedDay }: Props) {
  const [activeTab, setActiveTab] = useState<"lagrange" | "newton" | "spline">("lagrange");
  const sorted = getSortedPoints(points);
  const n = sorted.length;

  if (n === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-400">
        Inserta puntos de datos para ver el procedimiento matemático interactivo.
      </div>
    );
  }

  // Define Lagrange calculations evaluated at selectedDay
  // L_i(x) = \prod_{j \neq i} (x - x_j) / (x_i - x_j)
  const lagrangeDetails = sorted.map((p, i) => {
    let numStr = "";
    let denStr = "";
    let numVal = 1;
    let denVal = 1;

    sorted.forEach((otherP, j) => {
      if (i !== j) {
        numStr += (numStr ? " · " : "") + `(${selectedDay.toFixed(1)} - ${otherP.x})`;
        denStr += (denStr ? " · " : "") + `(${p.x} - ${otherP.x})`;
        numVal *= (selectedDay - otherP.x);
        denVal *= (p.x - otherP.x);
      }
    });

    const lValue = denVal !== 0 ? numVal / denVal : 0;
    const termValue = p.y * lValue;

    return {
      index: i,
      x: p.x,
      y: p.y,
      numStr,
      denStr,
      numVal,
      denVal,
      lValue,
      termValue,
    };
  });

  const lagrangeSum = lagrangeDetails.reduce((acc, curr) => acc + curr.termValue, 0);

  // Newton Divided Differences
  const { coefs, table, sorted: newtonSorted } = computeNewtonTable(points);

  // Cubic Splines details
  const splineData = computeNaturalCubicSplines(points);
  
  // Find which interval contains selectedDay
  let activeIntervalIdx = -1;
  if (splineData) {
    const sn = splineData.sorted.length - 1;
    for (let i = 0; i < sn; i++) {
      if (selectedDay >= splineData.sorted[i].x && selectedDay <= splineData.sorted[i + 1].x) {
        activeIntervalIdx = i;
        break;
      }
    }
    // Edge cases
    if (activeIntervalIdx === -1) {
      if (selectedDay < splineData.sorted[0].x) activeIntervalIdx = 0;
      else activeIntervalIdx = sn - 1;
    }
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      
      {/* Element Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-850 pb-3">
        <div>
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-400" />
            Metodología y Procesos de Solución de Interpolación
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Analiza paso a paso el desarrollo de cada método evaluado para el <strong>Día {selectedDay.toFixed(2)}</strong>.
          </p>
        </div>

        {/* Tab switcher inside component */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
          {(["lagrange", "newton", "spline"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all select-none cursor-pointer uppercase font-mono ${
                activeTab === tab
                  ? "bg-emerald-600 text-slate-950 font-black"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab === "lagrange" ? "Lagrange" : tab === "newton" ? "Newton" : "Splines"}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === "lagrange" && (
        <div className="space-y-4 animate-fade-in">
          <div className="text-xs text-slate-400 leading-relaxed space-y-2">
            <p>
              El polinomio de interpolación de Lagrange representa el polinomio único de grado <strong className="text-slate-200">{n - 1}</strong> que pasa por todos los puntos. Se construye como una combinación lineal de polinomios base $L_i(x)$:
            </p>
            <div className="bg-slate-950/40 p-2 rounded border border-slate-850 text-center font-mono text-emerald-300">
              {"P(x) = \\sum_{i=0}^{n-1} y_i \\cdot L_i(x) \\quad ; \\quad L_i(x) = \\prod_{j \\neq i} \\frac{x - x_j}{x_i - x_j}"}
            </div>
          </div>

          <div className="text-xs font-mono text-slate-400">
            Cálculo detallado de los coeficientes de Lagrange en $x = {selectedDay.toFixed(2)}$:
          </div>

          <div className="overflow-x-auto border border-slate-850 rounded-xl bg-slate-950/40 text-[11px] font-mono">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 uppercase tracking-widest text-[9px] font-bold">
                  <th className="py-2 px-3">i</th>
                  <th className="py-2 px-3">Nodo (x_i, y_i)</th>
                  <th className="py-2 px-3 text-center">Fórmula L_i({selectedDay.toFixed(1)})</th>
                  <th className="py-2 px-3 text-right">Valor L_i(x)</th>
                  <th className="py-2 px-3 text-right">Término (y_i · L_i)</th>
                </tr>
              </thead>
              <tbody>
                {lagrangeDetails.map((det) => (
                  <tr key={det.index} className="border-b border-slate-800/40 hover:bg-slate-900/45">
                    <td className="py-2.5 px-3 text-slate-500 font-bold">{det.index}</td>
                    <td className="py-2.5 px-3 text-slate-200">
                      ({det.x}, {det.y.toFixed(1)})
                    </td>
                    <td className="py-2.5 px-3 text-center text-[10px] text-slate-400 max-w-xs truncate">
                      <div className="text-slate-300">{det.numStr}</div>
                      <div className="border-t border-slate-800 w-full my-0.5"></div>
                      <div className="text-slate-500">{det.denStr}</div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-blue-400">
                      {det.lValue.toFixed(5)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-100">
                      {det.termValue.toFixed(4)} Bs
                    </td>
                  </tr>
                ))}
                {/* Total sum line */}
                <tr className="bg-slate-950/80 border-t border-slate-800 font-bold">
                  <td colSpan={3} className="py-3 px-3 text-right text-slate-400 uppercase font-mono tracking-wide text-[10px]">
                    Suma total $P({selectedDay.toFixed(2)}) = \sum y_i L_i(x)$:
                  </td>
                  <td colSpan={2} className="py-3 px-3 text-right text-emerald-400 text-xs font-black">
                    {lagrangeSum.toFixed(4)} Bs
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-blue-950/20 border border-blue-900/30 rounded-xl text-[11px] text-slate-400 leading-relaxed flex gap-2.5">
            <span className="text-xs">💡</span>
            <span>
              <strong>Observación Analítica:</strong> Cada base $L_i(x)$ vale exactamente <strong className="text-blue-300">1</strong> en su propio nodo $x_i$ y <strong className="text-blue-300">0</strong> en cualquier otro nodo $x_j$ para garantizar un encaje polinomial impecable.
            </span>
          </div>
        </div>
      )}

      {activeTab === "newton" && (
        <div className="space-y-4 animate-fade-in">
          <div className="text-xs text-slate-400 leading-relaxed space-y-2">
            <p>
              La interpolación de Newton implementa diferencias divididas finitas, ofreciendo un método jerárquico acumulativo idóneo para añadir nodos dinámicamente:
            </p>
            <div className="bg-slate-950/40 p-2.5 rounded border border-slate-850 text-center font-mono text-pink-300 text-[10px]">
              {"P(x) = f[x_0] + f[x_0, x_1](x - x_0) + f[x_0, x_1, x_2](x - x_0)(x - x_1) + ..."}
            </div>
          </div>

          {/* Newton process coefficients string formula representation */}
          <div className="bg-slate-950 border border-slate-850 p-3 rounded-xl">
            <span className="text-[9px] font-mono text-slate-500 block uppercase font-bold mb-1.5">
              Polinomio resultante por Newton para los {n} puntos:
            </span>
            <div className="text-[11px] font-mono overflow-x-auto text-slate-300 whitespace-nowrap scrollbar-thin">
              <span className="text-pink-400 font-bold">P(x)</span> ={" "}
              {coefs.map((c, idx) => {
                if (idx === 0) return <span key={idx} className="text-pink-400 font-bold">{c.toFixed(4)}</span>;
                const termsStr = newtonSorted
                  .slice(0, idx)
                  .map((p) => `(x - ${p.x})`)
                  .join("");
                const sign = c >= 0 ? " + " : " ";
                return (
                  <span key={idx}>
                    {sign}
                    <span className="text-pink-400 font-bold">{c.toFixed(4)}</span>
                    <span className="text-slate-500 font-medium">{termsStr}</span>
                  </span>
                );
              })}
            </div>
          </div>

          {/* Divided difference table render */}
          <div className="overflow-x-auto border border-slate-850 rounded-xl bg-slate-950/40 font-mono text-[11px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 uppercase tracking-widest text-[9px] font-bold">
                  <th className="py-2 px-3">i</th>
                  <th className="py-2 px-3">x_i (Día)</th>
                  <th className="py-2 px-3">f[x_i] (y_i)</th>
                  {Array.from({ length: n - 1 }).map((_, j) => (
                    <th key={j} className="py-2 px-3 whitespace-nowrap">
                      {j === 0 ? "f[x_i, x_{i-1}]" : `Orden ${j + 1}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {newtonSorted.map((p, i) => (
                  <tr key={p.x} className="border-b border-slate-800/50 hover:bg-slate-900/40">
                    <td className="py-2 px-3 text-slate-500 font-bold">{i}</td>
                    <td className="py-2 px-3 text-slate-300 font-bold">{p.x}</td>
                    <td className={`py-2 px-3 font-semibold ${i === 0 ? "bg-pink-950/20 text-pink-400 border border-pink-900/30" : "text-slate-100"}`}>
                      {p.y.toFixed(2)}
                    </td>
                    {Array.from({ length: n - 1 }).map((_, j) => {
                      const orderCol = j + 1;
                      const isDiagonalOfNewton = i === orderCol;
                      const value = table[i]?.[orderCol];

                      if (i < orderCol) {
                        return <td key={j} className="py-2 px-3 bg-slate-900/10"></td>;
                      }

                      return (
                        <td
                          key={j}
                          className={`py-2 px-3 font-semibold ${
                            isDiagonalOfNewton
                              ? "bg-pink-950/30 text-pink-400 border border-pink-900/40 font-bold"
                              : "text-slate-400"
                          }`}
                        >
                          {value !== undefined ? value.toFixed(4) : "-"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-pink-950/20 border border-pink-900/30 rounded-xl text-[11px] text-slate-400 leading-relaxed flex gap-2.5">
            <span className="text-xs">💡</span>
            <span>
              La diagonal resaltada en <strong className="text-pink-400">fucsia</strong> representa los coeficientes $a_k$ utilizados para calcular $P({selectedDay.toFixed(1)})$. Ambos Lagrange y Newton resultan en polinomios idénticos.
            </span>
          </div>
        </div>
      )}

      {activeTab === "spline" && (
        <div className="space-y-4 animate-fade-in">
          <div className="text-xs text-slate-400 leading-relaxed space-y-2">
            <p>
              El método de trazadores cúbicos (Splines) calcula curvas dividiendo el dominio en polinomios de grado 3 para cada intervalo {"[x_i, x_{i+1}]"}. Evita el fenómeno de Runge garantizando que la primera S' y segunda derivada S'' coincidan en los nexos intermedios.
            </p>
          </div>

          {splineData ? (
            <div className="space-y-4">
              {/* Matrix or Interval list */}
              <div className="text-xs font-mono text-slate-400">
                Segmentos y derivadas de Thomas calculadas ($S''(x_0) = S''(x_n) = 0$ natural):
              </div>

              <div className="overflow-x-auto border border-slate-850 rounded-xl bg-slate-950/40 font-mono text-[11px]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 uppercase tracking-widest text-[9px] font-bold">
                      <th className="py-2.5 px-3">Segmento i</th>
                      <th className="py-2.5 px-3">Intervalo [x_i, x_i+1]</th>
                      <th className="py-2.5 px-3 text-right">Ancho h_i</th>
                      <th className="py-2.5 px-3 text-right">Segunda Derivada M_i</th>
                      <th className="py-2.5 px-3 text-center">Estado de Target</th>
                    </tr>
                  </thead>
                  <tbody>
                    {splineData.h.map((hi, i) => {
                      const xi = splineData.sorted[i].x;
                      const xip1 = splineData.sorted[i + 1].x;
                      const isActiveSegment = i === activeIntervalIdx;

                      return (
                        <tr
                          key={i}
                          className={`border-b border-slate-800/40 hover:bg-slate-900/40 ${
                            isActiveSegment ? "bg-emerald-950/20 text-emerald-400 border border-emerald-900/40 font-bold" : ""
                          }`}
                        >
                          <td className="py-2 px-3 font-semibold text-slate-400">S_{i}(x)</td>
                          <td className="py-2 px-3">
                            [{xi.toFixed(1)}, {xip1.toFixed(1)}]
                          </td>
                          <td className="py-2 px-3 text-right text-slate-300">
                            {hi.toFixed(3)}
                          </td>
                          <td className="py-2 px-3 text-right">
                            {splineData.M[i].toFixed(4)}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {isActiveSegment ? (
                              <span className="bg-emerald-500/20 text-emerald-400 text-[9px] px-1.5 py-0.5 rounded border border-emerald-500/30 uppercase font-bold animate-pulse">
                                Target adentro
                              </span>
                            ) : (
                              <span className="text-slate-600 text-[10px]">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* The active spline formula */}
              {activeIntervalIdx !== -1 && (
                <div className="bg-slate-950 border border-slate-850 p-3 rounded-xl">
                  <span className="text-[10px] font-mono text-emerald-400 font-bold block mb-1">
                    Ecuación Evaluada del Segmento S_{activeIntervalIdx}(x) para el Día {selectedDay.toFixed(1)}:
                  </span>
                  <div className="text-[11px] font-mono text-slate-300 leading-relaxed space-y-1">
                    <div>
                      {"S_i(x) = \\frac{M_i}{6h_i}(x_{i+1}-x)^3 + \\frac{M_{i+1}}{6h_i}(x-x_i)^3 + C_i(x_{i+1}-x) + D_i(x-x_i)"}
                    </div>
                    <div className="text-slate-400 text-[10px] pt-1">
                      Donde $M_{activeIntervalIdx} = {splineData.M[activeIntervalIdx].toFixed(4)}$ y $M_{activeIntervalIdx+1} = {splineData.M[activeIntervalIdx + 1].toFixed(4)}$.
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-slate-400">
              Inserta al menos 2 puntos ordenados para calcular trazadores cúbicos.
            </div>
          )}
        </div>
      )}

    </div>
  );
}
