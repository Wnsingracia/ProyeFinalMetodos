/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Point } from "../types";
import { evaluateLagrange, evaluateNewton, evaluateCubicSpline } from "../mathUtils";
import { Gauge, HelpCircle, Activity, Play, Zap, Shield, Sparkles } from "lucide-react";

interface Props {
  points: Point[];
  selectedDay: number;
  setSelectedDay: (day: number) => void;
  unit: string;
}

export default function PricePredictionCalculator({ points, selectedDay, setSelectedDay, unit }: Props) {
  const sorted = [...points].sort((a, b) => a.x - b.x);
  const minX = sorted[0]?.x || 1;
  const maxX = sorted[sorted.length - 1]?.x || 30;

  // Evaluate values
  const yLagrange = evaluateLagrange(points, selectedDay);
  const yNewton = evaluateNewton(points, selectedDay);
  const ySpline = evaluateCubicSpline(points, selectedDay);

  // Check if current day is interpolation or extrapolation
  const isInterpolation = selectedDay >= minX && selectedDay <= maxX;
  const isKnot = points.some((p) => Math.abs(p.x - selectedDay) < 0.05);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Gauge className="w-5 h-5 text-emerald-400" />
          <h3 className="text-base font-semibold text-slate-100">
            🔮 Estimador y Calculadora en Días Sin Dato
          </h3>
        </div>
        
        <p className="text-xs text-slate-400 mb-5 leading-relaxed">
          Usa la barra deslizadora para calcular y comparar el coste estimado del alimento en cualquier día del mes. Compara cómo simula cada método la curva continua de precios.
        </p>

        {/* Selected Day Controller Slider */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 mb-5">
          <div className="flex justify-between items-center mb-2.5">
            <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">
              Día de consulta:
            </span>
            <span className="text-sm font-mono font-black text-emerald-400 bg-emerald-950/40 border border-emerald-900/60 px-2.5 py-0.5 rounded-md">
              Día {selectedDay.toFixed(1)}
            </span>
          </div>

          <input
            type="range"
            min="1"
            max="30"
            step="0.5"
            value={selectedDay}
            onChange={(e) => setSelectedDay(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-2">
            <span>Día 1</span>
            <span>Día 10</span>
            <span>Día 20</span>
            <span>Día 30</span>
          </div>
        </div>

        {/* Comparison HUD of Methods */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          
          {/* Cubic Spline Result Card (Recommended) */}
          <div className="bg-slate-950/80 border border-emerald-800/40 rounded-xl p-3.5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 bg-emerald-500 text-slate-950 text-[8px] font-bold tracking-widest px-1.5 py-0.5 uppercase rounded-bl font-mono">
              RECOMENDADO
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-400 block mb-1">
              🍀 Trazadores Cúbicos
            </span>
            <div className="text-xl font-mono font-black text-emerald-400">
              {ySpline.toFixed(2)} <span className="text-xs font-semibold text-slate-400">Bs</span>
            </div>
            <p className="text-[10px] text-emerald-500 mt-1.5 font-mono flex items-center gap-1">
              <Shield className="w-3 h-3 text-emerald-500" />
              Estable y suave (C2)
            </p>
          </div>

          {/* Lagrange Result Card */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 relative">
            <span className="text-[10px] font-mono font-bold text-slate-400 block mb-1">
              🔷 Polinomial Lagrange
            </span>
            <div className="text-xl font-mono font-black text-blue-400">
              {Math.abs(yLagrange) > 500 ? (
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">Explosión</span>
              ) : (
                `${yLagrange.toFixed(2)} Bs`
              )}
            </div>
            <p className="text-[10px] text-slate-500 mt-1.5 font-mono">
              Grado {points.length - 1} • {yLagrange > 500 ? "Inestable (Extremos)" : "Polinomio único"}
            </p>
          </div>

          {/* Newton Result Card */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 relative">
            <span className="text-[10px] font-mono font-bold text-slate-400 block mb-1">
              🔺 Interpolación Newton
            </span>
            <div className="text-xl font-mono font-black text-pink-400">
              {Math.abs(yNewton) > 500 ? (
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">Explosión</span>
              ) : (
                `${yNewton.toFixed(2)} Bs`
              )}
            </div>
            <p className="text-[10px] text-slate-500 mt-1.5 font-mono">
              Mismo resultado general • Formato difs. divididas
            </p>
          </div>
        </div>
      </div>

      {/* Numerical Diagnostics Footer */}
      <div className="bg-slate-950/50 border border-slate-800/60 p-3 rounded-xl">
        <span className="text-[9px] font-mono font-bold tracking-widest text-slate-500 uppercase block mb-1.5">
          Estado del Cálculo en el Dominio
        </span>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {isKnot ? (
            <span className="bg-emerald-950/60 text-emerald-400 px-2 py-0.5 rounded border border-emerald-900/60 font-mono text-[10px]">
              ● PUNTO MUERTO (DATO REGISTRADO)
            </span>
          ) : isInterpolation ? (
            <span className="bg-blue-950/60 text-blue-400 px-2 py-0.5 rounded border border-blue-900/60 font-mono text-[10px]">
              ● INTERPOLACIÓN (DÍA SIN DATO)
            </span>
          ) : (
            <span className="bg-amber-950/60 text-amber-500 px-2 py-0.5 rounded border border-amber-900/60 font-mono text-[10px] animate-pulse">
              ⚠️ EXTRAPOLACIÓN (ZONA DE RIESGO DE ERROR)
            </span>
          )}
          
          <span className="text-slate-400 text-xs">
            {isKnot ? (
              "El precio coincide exactamente con el valor directo tabulado."
            ) : isInterpolation ? (
              "Predicción altamente confiable por trazadores, pero sujeta a oscilaciones de Runge en Lagrange en extremos."
            ) : (
              "Calcular fuera del intervalo de muestreo eleva drásticamente el error polinomial."
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
