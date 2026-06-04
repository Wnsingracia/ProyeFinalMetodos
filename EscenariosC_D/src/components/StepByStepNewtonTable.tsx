/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { computeNewtonTable } from "../mathUtils";
import { Point } from "../types";
import { HelpCircle, Layers } from "lucide-react";

interface Props {
  points: Point[];
}

export default function StepByStepNewtonTable({ points }: Props) {
  const { coefs, table, sorted } = computeNewtonTable(points);
  const n = sorted.length;

  if (n === 0) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center gap-2 mb-3">
        <Layers className="w-5 h-5 text-pink-400" />
        <h3 className="text-base font-semibold text-slate-100">
          📐 Tabla de Diferencias Divididas de Newton
        </h3>
      </div>
      
      <p className="text-xs text-slate-400 mb-4 leading-relaxed">
        El método de Newton calcula coeficientes incrementales de diferencias divididas. Los términos de la <strong>diagonal principal (resaltados en fucsia)</strong> son los coeficientes definitivos del polinomio interpolador global:
      </p>

      {/* Newton equation display */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 mb-4 overflow-x-auto">
        <div className="text-[11px] font-mono whitespace-nowrap text-slate-300">
          <span className="text-pink-400 font-bold">P(x)</span> ={" "}
          {coefs.map((c, idx) => {
            if (idx === 0) return <span key={idx} className="text-pink-400 font-bold">{c.toFixed(4)}</span>;
            const termsStr = sorted
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
      <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950/40">
        <table className="w-full text-left border-collapse text-xs font-mono">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 uppercase tracking-widest text-[9px] font-bold">
              <th className="py-2.5 px-3">i</th>
              <th className="py-2.5 px-3">x_i (Día)</th>
              <th className="py-2.5 px-3">y_i (Bs)</th>
              {Array.from({ length: n - 1 }).map((_, j) => (
                <th key={j} className="py-2.5 px-3 whitespace-nowrap">
                  {j === 0 ? "f[x_i, x_{i-1}]" : `Orden ${j + 1}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((p, i) => (
              <tr key={p.x} className="border-b border-slate-800/50 hover:bg-slate-900/40">
                <td className="py-2 px-3 text-slate-500 font-bold">{i}</td>
                <td className="py-2 px-3 text-slate-300 font-bold">{p.x}</td>
                <td className={`py-2 px-3 font-semibold ${i === 0 ? "bg-pink-950/20 text-pink-400 border border-pink-900/30 font-bold" : "text-slate-100"}`}>
                  {p.y.toFixed(2)}
                </td>
                {Array.from({ length: n - 1 }).map((_, j) => {
                  const orderCol = j + 1;
                  const isDiagonalOfNewton = i === orderCol;
                  const value = table[i]?.[orderCol];

                  // If element doesn't exist in triangular form, leave it blank
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
    </div>
  );
}
