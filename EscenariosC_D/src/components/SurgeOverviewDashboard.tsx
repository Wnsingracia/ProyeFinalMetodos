/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product } from "../types";
import { TrendingUp, AlertOctagon, Scale, ShieldAlert, Sparkles, CheckCircle2 } from "lucide-react";
import { calculateSplineSmoothnessMetric } from "../mathUtils";

interface Props {
  products: Product[];
  activeProductIndex: number;
  setActiveProductIndex: (idx: number) => void;
  onInjectNoise: () => void;
}

export default function SurgeOverviewDashboard({
  products,
  activeProductIndex,
  setActiveProductIndex,
  onInjectNoise,
}: Props) {
  // Compute price surge metrics for each product
  const summaries = products.map((prod) => {
    const sorted = [...prod.points].sort((a, b) => a.x - b.x);
    const firstY = sorted[0]?.y || 1;
    const lastY = sorted[sorted.length - 1]?.y || 1;
    const absolute = lastY - firstY;
    const percentage = (absolute / firstY) * 100;

    // Smoothness analysis metrics
    const { isStable, metricVal } = calculateSplineSmoothnessMetric(prod.points);

    return {
      productName: prod.name,
      emoji: prod.emoji,
      initial: firstY,
      final: lastY,
      absolute,
      percentage,
      isStable,
      complexity: prod.points.length,
      smoothnessIdx: metricVal,
    };
  });

  // Determine which product has the maximum percentage increase
  const highestSurge = [...summaries].sort((a, b) => b.percentage - a.percentage)[0];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-emerald-400" />
        <h3 className="text-base font-semibold text-slate-100">
          📈 Monitoreo de Incremento y Estabilidad Metódica
        </h3>
      </div>

      {/* Answer Badge: Which product surged the most? */}
      {highestSurge && (
        <div className="bg-amber-950/40 border border-amber-900/60 rounded-xl p-4 mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex gap-3">
            <div className="bg-amber-900/50 p-2.5 rounded-xl border border-amber-800 shrink-0">
              <span className="text-2xl">{highestSurge.emoji}</span>
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-amber-400 uppercase">
                🚨 ALIMENTO CON MAYOR INCREMENTO DE PRECIO
              </span>
              <h4 className="text-sm font-extrabold text-slate-100 mt-0.5">
                {highestSurge.productName} — Incremento del {highestSurge.percentage.toFixed(1)}%
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Subió un total neto de <span className="text-amber-400 font-bold">{highestSurge.absolute.toFixed(1)} Bs</span> ({highestSurge.initial.toFixed(1)} Bs → {highestSurge.final.toFixed(1)} Bs) durante el período de muestreo.
              </p>
            </div>
          </div>

          <button
            onClick={onInjectNoise}
            className="flex items-center gap-2 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-slate-950 text-xs font-black px-4 py-2.5 rounded-xl transition shadow-lg w-full sm:w-auto shrink-0 uppercase select-none cursor-pointer"
            title="Introduce oscilaciones extremas de ejemplo para ver cómo colapsan Lagrange/Newton"
          >
            <ShieldAlert className="w-4 h-4 text-slate-950 animate-bounce" />
            <span>Simular Estrés de Precios</span>
          </button>
        </div>
      )}

      {/* Product Grid selection */}
      <span className="text-[10px] font-mono font-bold tracking-wider text-slate-500 uppercase block mb-3">
        Selecciona un alimento para graficar e interpolar:
      </span>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        {products.map((prod, idx) => {
          const isSelected = idx === activeProductIndex;
          const summary = summaries[idx];

          return (
            <button
              key={prod.id}
              onClick={() => setActiveProductIndex(idx)}
              className={`text-left p-4 rounded-xl border transition-all flex flex-col justify-between cursor-pointer ${
                isSelected
                  ? "bg-slate-950 border-emerald-500 shadow-lg text-slate-100"
                  : "bg-slate-950/40 border-slate-800 hover:bg-slate-950 text-slate-400"
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-2xl">{prod.emoji}</span>
                  {isSelected ? (
                    <span className="bg-emerald-500 text-slate-950 text-[9px] font-black font-mono px-1.5 py-0.5 rounded uppercase">
                      Activo
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-600 font-mono">Día 1-30</span>
                  )}
                </div>

                <h4 className={`text-sm font-bold ${isSelected ? "text-emerald-400" : "text-slate-200"}`}>
                  {prod.name}
                </h4>
                <div className="text-[10px] font-mono mt-1 text-slate-400">
                  Cambio: +{summary.absolute.toFixed(1)} Bs (+{summary.percentage.toFixed(0)}%)
                </div>
              </div>

              {/* Mathematical Stability warning indicator inside item card */}
              <div className="mt-3 pt-2.5 border-t border-slate-850 flex items-center justify-between text-[10px] font-mono">
                <span className="text-slate-500">Estabilidad:</span>
                {summary.isStable ? (
                  <span className="text-emerald-400 bg-emerald-950/20 px-1.5 py-0.2 rounded border border-emerald-900/40 flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                    Alta
                  </span>
                ) : (
                  <span className="text-amber-400 bg-amber-950/20 px-1.5 py-0.2 rounded border border-amber-900/40 flex items-center gap-1 animate-pulse">
                    <AlertOctagon className="w-2.5 h-2.5 text-amber-400" />
                    Inestable
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
