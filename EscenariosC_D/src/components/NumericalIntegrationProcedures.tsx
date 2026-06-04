/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Point } from "../types";
import { evaluateCubicSpline } from "../mathUtils";
import {
  Calculator,
  ChevronDown,
  ChevronUp,
  Cpu,
  Bookmark,
  CheckCircle,
  Hash
} from "lucide-react";

interface Props {
  points: Point[];
  purchaseQty: number;
  unit: string;
}

export default function NumericalIntegrationProcedures({ points, purchaseQty, unit }: Props) {
  const [activeTab, setActiveTab] = useState<"trapezoid" | "simpson13" | "simpson38">("simpson13");

  const N = 24;
  const a = 1;
  const b = 30;
  const h = (b - a) / N; // 29 / 24 = 1.208333

  // Sample prices along the spline
  const xSamples: number[] = [];
  const ySamples: number[] = [];
  for (let i = 0; i <= N; i++) {
    const xVal = a + i * h;
    xSamples.push(xVal);
    ySamples.push(evaluateCubicSpline(points, xVal));
  }

  // Extreme points
  const y0 = ySamples[0];
  const yN = ySamples[N];
  const extremesSum = y0 + yN;

  // Trapezoidal sums
  let trapInnerSum = 0;
  for (let i = 1; i < N; i++) {
    trapInnerSum += ySamples[i];
  }
  const trapRawIntegral = (h / 2) * (extremesSum + 2 * trapInnerSum);
  const trapFinalCost = trapRawIntegral * purchaseQty;

  // Simpson 1/3 sums
  let simp13OddsSum = 0;
  let simp13EvensSum = 0;
  for (let i = 1; i < N; i++) {
    if (i % 2 === 1) {
      simp13OddsSum += ySamples[i];
    } else {
      simp13EvensSum += ySamples[i];
    }
  }
  const simp13RawIntegral = (h / 3) * (extremesSum + 4 * simp13OddsSum + 2 * simp13EvensSum);
  const simp13FinalCost = simp13RawIntegral * purchaseQty;

  // Simpson 3/8 sums
  let simp38Div3Sum = 0;
  let simp38OthersSum = 0;
  for (let i = 1; i < N; i++) {
    if (i % 3 === 0) {
      simp38Div3Sum += ySamples[i];
    } else {
      simp38OthersSum += ySamples[i];
    }
  }
  const simp38RawIntegral = ((3 * h) / 8) * (extremesSum + 3 * simp38OthersSum + 2 * simp38Div3Sum);
  const simp38FinalCost = simp38RawIntegral * purchaseQty;

  // Baseline cost (no inflation)
  const baseCost = y0 * (b - a) * purchaseQty;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-850 pb-3">
        <div>
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-pink-400" />
            Desglose Matemático de Integración (Escenario D)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Analiza paso a paso los coeficientes y las sumas compuestas aplicadas para {purchaseQty} {purchaseQty === 1 ? "unidad" : "unidades"} diarias.
          </p>
        </div>

        {/* Tab switcher inside component */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
          {(["trapezoid", "simpson13", "simpson38"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all select-none cursor-pointer uppercase font-mono ${
                activeTab === tab
                  ? "bg-pink-600 text-slate-950 font-black"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab === "trapezoid" ? "Trapecio" : tab === "simpson13" ? "S 1/3" : "S 3/8"}
            </button>
          ))}
        </div>
      </div>

      {/* Grid summarizing core values loaded */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850 text-center">
          <span className="text-[10px] text-slate-500 font-mono uppercase block">Intervalos (N)</span>
          <span className="text-sm font-mono font-bold text-slate-200">{N}</span>
        </div>
        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850 text-center">
          <span className="text-[10px] text-slate-500 font-mono uppercase block">Tamaño paso (h)</span>
          <span className="text-sm font-mono font-bold text-pink-400">~{h.toFixed(5)}</span>
        </div>
        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850 text-center">
          <span className="text-[10px] text-slate-500 font-mono uppercase block">Extremos (y0 + y24)</span>
          <span className="text-sm font-mono font-bold text-slate-200">{(y0 + yN).toFixed(3)} Bs</span>
        </div>
        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850 text-center col-span-2 sm:col-span-1">
          <span className="text-[10px] text-slate-500 font-mono uppercase block">Multiplicador</span>
          <span className="text-sm font-mono font-bold text-emerald-400">{purchaseQty} {unit}/día</span>
        </div>
      </div>

      {/* Tabs description and equations walkthrough */}
      {activeTab === "trapezoid" && (
        <div className="space-y-4 animate-fade-in text-xs">
          <div className="text-slate-400 leading-relaxed space-y-2">
            <p>
              La <strong>regla del trapecio compuesta</strong> divide el intervalo $[1, 30]$ en {N} trapecios de igual ancho. La fórmula matemática de aproximación es:
            </p>
            <div className="bg-slate-950/40 p-2 rounded border border-slate-850 text-center font-mono text-blue-400">
              {"I \\approx \\frac{h}{2} \\left[ y_0 + y_N + 2 \\cdot \\sum_{i=1}^{N-1} y_i \\right]"}
            </div>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl space-y-3 font-mono border border-slate-850">
            <span className="text-[10px] text-slate-500 uppercase font-black tracking-wide block">Desarrollo de Sumandos:</span>
            <div className="space-y-1.5 text-slate-300">
              <div className="flex justify-between border-b border-slate-850/60 pb-1.5">
                <span>Cálculo paso h/2:</span>
                <span className="text-blue-400">{(h / 2).toFixed(6)}</span>
              </div>
              <div className="flex justify-between border-b border-slate-850/60 pb-1.5">
                <span>Extremos (y_0 + y_24) = {y0.toFixed(2)} + {yN.toFixed(2)}:</span>
                <span className="text-slate-100">{extremesSum.toFixed(4)} Bs</span>
              </div>
              <div className="flex justify-between border-b border-slate-850/60 pb-1.5">
                <span>Suma de puntos intermedios:</span>
                <span className="text-slate-100">{trapInnerSum.toFixed(4)} Bs</span>
              </div>
              <div className="flex justify-between border-b border-slate-850/60 pb-1.5 font-bold">
                <span>Ecuación evaluada:</span>
                <span className="text-blue-300">
                  {h.toFixed(4)}/2 · [{extremesSum.toFixed(2)} + 2 · {trapInnerSum.toFixed(2)}]
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-850/60 pb-1.5">
                <span>Integral aproximada (Raw):</span>
                <span className="text-cyan-400 font-bold">{trapRawIntegral.toFixed(5)} Bs·Días</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-slate-100">
                <span>Gasto final ({purchaseQty} x {trapRawIntegral.toFixed(2)}):</span>
                <span className="text-emerald-400 text-sm font-black">{trapFinalCost.toFixed(4)} Bs <span className="text-[10px] text-slate-400">(Esperado)</span></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "simpson13" && (
        <div className="space-y-4 animate-fade-in text-xs">
          <div className="text-slate-400 leading-relaxed space-y-2">
            <p>
              La <strong>regla de Simpson 1/3 compuesta</strong> aproxima la curva mediante parábolas de segundo grado. Requiere que el número de subintervalos $N$ sea par (nuestro $N = 24$ es par). Se multiplica alternativamente por 4 (índices impares) y por 2 (índices pares):
            </p>
            <div className="bg-slate-950/40 p-2 rounded border border-slate-850 text-center font-mono text-emerald-400">
              {"I \\approx \\frac{h}{3} \\left[ y_0 + y_N + 4 \\cdot \\sum_{i \\in \\text{impares}} y_i + 2 \\cdot \\sum_{i \\in \\text{pares}} y_i \\right]"}
            </div>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl space-y-3 font-mono border border-slate-850">
            <span className="text-[10px] text-slate-500 uppercase font-black tracking-wide block">Desarrollo de Sumandos:</span>
            <div className="space-y-1.5 text-slate-300">
              <div className="flex justify-between border-b border-slate-850/60 pb-1.5">
                <span>Cálculo paso h/3:</span>
                <span className="text-emerald-400">{(h / 3).toFixed(6)}</span>
              </div>
              <div className="flex justify-between border-b border-slate-850/60 pb-1.5">
                <span>Extremos (y_0 + y_24):</span>
                <span className="text-slate-100">{extremesSum.toFixed(4)} Bs</span>
              </div>
              <div className="flex justify-between border-b border-slate-850/60 pb-1.5">
                <span>Suma impares (multiplicado por 4):</span>
                <span className="text-slate-100">4 · {simp13OddsSum.toFixed(4)} = {(4 * simp13OddsSum).toFixed(4)} Bs</span>
              </div>
              <div className="flex justify-between border-b border-slate-850/60 pb-1.5">
                <span>Suma pares (multiplicado por 2):</span>
                <span className="text-slate-100">2 · {simp13EvensSum.toFixed(4)} = {(2 * simp13EvensSum).toFixed(4)} Bs</span>
              </div>
              <div className="flex justify-between border-b border-slate-850/60 pb-1.5 font-bold">
                <span>Ecuación evaluada:</span>
                <span className="text-emerald-300">
                  {h.toFixed(4)}/3 · [{extremesSum.toFixed(2)} + {(4 * simp13OddsSum).toFixed(1)} + {(2 * simp13EvensSum).toFixed(1)}]
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-850/60 pb-1.5">
                <span>Integral aproximada (Raw):</span>
                <span className="text-cyan-400 font-bold">{simp13RawIntegral.toFixed(5)} Bs·Días</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-slate-100">
                <span>Gasto final ({purchaseQty} x {simp13RawIntegral.toFixed(2)}):</span>
                <span className="text-emerald-400 text-sm font-black">{simp13FinalCost.toFixed(4)} Bs <span className="text-[10px] text-slate-400">(Esperado)</span></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "simpson38" && (
        <div className="space-y-4 animate-fade-in text-xs">
          <div className="text-slate-400 leading-relaxed space-y-2">
            <p>
              La <strong>regla de Simpson 3/8 compuesta</strong> (segunda regla de Simpson) aproxima mediante polinomios cúbicos. Requiere que $N$ sea múltiplo de 3 ($N = 24$ es divisible por 3). Se pondera por 3 para coeficientes no múltiplos de 3, y por 2 para múltiplos de 3:
            </p>
            <div className="bg-slate-950/40 p-2 rounded border border-slate-850 text-center font-mono text-pink-400">
              {"I \\approx \\frac{3h}{8} \\left[ y_0 + y_N + 3 \\cdot \\sum_{i \\nmid 3} y_i + 2 \\cdot \\sum_{i \\mid 3} y_i \\right]"}
            </div>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl space-y-3 font-mono border border-slate-850">
            <span className="text-[10px] text-slate-500 uppercase font-black tracking-wide block">Desarrollo de Sumandos:</span>
            <div className="space-y-1.5 text-slate-300">
              <div className="flex justify-between border-b border-slate-850/60 pb-1.5">
                <span>Cálculo paso 3h/8:</span>
                <span className="text-pink-400">{((3 * h) / 8).toFixed(6)}</span>
              </div>
              <div className="flex justify-between border-b border-slate-850/60 pb-1.5">
                <span>Extremos (y_0 + y_24):</span>
                <span className="text-slate-100">{extremesSum.toFixed(4)} Bs</span>
              </div>
              <div className="flex justify-between border-b border-slate-850/60 pb-1.5">
                <span>Suma de no múltiplos de 3 (x3):</span>
                <span className="text-slate-100">3 · {simp38OthersSum.toFixed(4)} = {(3 * simp38OthersSum).toFixed(4)} Bs</span>
              </div>
              <div className="flex justify-between border-b border-slate-850/60 pb-1.5">
                <span>Suma de múltiplos de 3 (x2):</span>
                <span className="text-slate-100">2 · {simp38Div3Sum.toFixed(4)} = {(2 * simp38Div3Sum).toFixed(4)} Bs</span>
              </div>
              <div className="flex justify-between border-b border-slate-850/60 pb-1.5 font-bold">
                <span>Ecuación evaluada:</span>
                <span className="text-pink-300">
                  {((3 * h) / 8).toFixed(4)} · [{extremesSum.toFixed(2)} + {(3 * simp38OthersSum).toFixed(1)} + {(2 * simp38Div3Sum).toFixed(1)}]
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-850/60 pb-1.5">
                <span>Integral aproximada (Raw):</span>
                <span className="text-cyan-400 font-bold">{simp38RawIntegral.toFixed(5)} Bs·Días</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-slate-100">
                <span>Gasto final ({purchaseQty} x {simp38RawIntegral.toFixed(2)}):</span>
                <span className="text-emerald-400 text-sm font-black">{simp38FinalCost.toFixed(4)} Bs <span className="text-[10px] text-slate-400">(Esperado)</span></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Underlining Expected Results */}
      <div className="bg-emerald-950/20 border border-emerald-900/30 p-4 rounded-xl space-y-2">
        <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-2 uppercase tracking-wider">
          <Bookmark className="w-4 h-4" />
          Resultados Esperados del Desafío Final
        </h4>
        <div className="text-xs text-slate-300 space-y-1">
          <p>
            Al realizar el consumo mensual dinámico del artículo <strong>Días 1 al 30 (ciclo de 29 días)</strong>:
          </p>
          <ul className="list-disc pl-4 space-y-1 text-slate-400 text-[11px] font-mono">
            <li>
              Costo total esperado de referencia (sin inflación): <strong className="text-slate-300">{baseCost.toFixed(2)} Bs</strong>
            </li>
            <li>
              Gasto real estimado acumulado (Regla Simpson 1/3): <strong className="text-emerald-400">{simp13FinalCost.toFixed(2)} Bs</strong>
            </li>
            <li>
              Pérdida monetaria directa esperada (Poder Adquisitivo): <strong className="text-rose-400">+{(simp13FinalCost - baseCost).toFixed(2)} Bs</strong> (Aumento relativo del <strong className="text-rose-400 font-extrabold">{(((simp13FinalCost - baseCost) / baseCost) * 100).toFixed(1)}%</strong>)
            </li>
          </ul>
        </div>
      </div>

    </div>
  );
}
