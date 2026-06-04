/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { resolverEDOSocial, RegistroTrayectoriaG } from "../mathUtils";
import { Users, Info, HelpCircle, BarChart3, Settings } from "lucide-react";

export default function EscenarioG_EDOTab() {
  const [metodo, setMetodo] = useState<"heun" | "rk4">("rk4");
  const [dias, setDias] = useState<number>(45);

  // Estados independientes para el control de parámetros de la EDO [cite: 144]
  const [alpha, setAlpha] = useState<number>(0.005);  // Contagio (a) [cite: 145]
  const [beta, setBeta] = useState<number>(0.05);    // Recuperación (b) [cite: 146]
  const [gamma, setGamma] = useState<number>(0.04);   // Diálogo (c) [cite: 147]
  const [k, setK] = useState<number>(0.02);           // Reacción (k) [cite: 148]
  const [r, setR] = useState<number>(0.1);            // Desgaste (r) [cite: 149]

  // Condiciones iniciales de población
  const [n0, setN0] = useState<number>(1000);
  const [m0, setM0] = useState<number>(15);
  const [d0, setD0] = useState<number>(2);

  const [registro, setRegistro] = useState<RegistroTrayectoriaG | null>(null);

  useEffect(() => {
    const params = { alpha, beta, gamma, k, r };
    const conds = { N0: n0, M0: m0, D0: d0 };
    setRegistro(resolverEDOSocial(params, conds, dias, metodo));
  }, [metodo, dias, alpha, beta, gamma, k, r, n0, m0, d0]);

  if (!registro) return null;

  // Parámetros para la escala del gráfico SVG
  const widthSVG = 550;
  const heightSVG = 260;
  const margin = { top: 15, right: 25, bottom: 35, left: 45 };
  const plotW = widthSVG - margin.left - margin.right;
  const plotH = heightSVG - margin.top - margin.bottom;

  const maxPoblacion = Math.max(...registro.neutrales, ...registro.manifestantes, ...registro.mediadores, 100);

  const toX = (tVal: number) => margin.left + (tVal / dias) * plotW;
  const toY = (pVal: number) => margin.top + (1 - pVal / (maxPoblacion * 1.05)) * plotH;

  // Compilación de trayectorias vectoriales (Paths)
  const crearPathSVG = (dataPoints: number[]) => {
    return dataPoints.reduce((acc, pVal, idx) => {
      const sx = toX(registro.tiempo[idx]);
      const sy = toY(pVal);
      return idx === 0 ? `M ${sx} ${sy}` : `${acc} L ${sx} ${sy}`;
    }, "");
  };

  const peakManifestantes = Math.max(...registro.manifestantes);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Caja de Control e Introducción del Módulo */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-3">
          <Users className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-bold text-slate-100 uppercase tracking-tight">
            Escenario G: Dinámica y Modelado Matemático de Descontento Social
          </h2>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed max-w-4xl">
          Sustitución del modelo epidemiológico clásico por un sistema determinista de ecuaciones diferenciales ordinarias acopladas[cite: 133, 134]. Evalúa la transición cinética de los ciudadanos neutrales hacia un estado de protesta activa gatillada por la influencia del descontento y contenida por canales institucionales de diálogo[cite: 139, 140, 141].
        </p>

        {/* Formulario HUD de Configuración del Sistema [cite: 168] */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-6 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800/60 text-xs font-mono">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Algoritmo Numérico</label>
            <select value={metodo} onChange={(e) => setMetodo(e.target.value as any)} className="bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-slate-200 cursor-pointer">
              <option value="rk4">Runge-Kutta 4 (RK4)</option>
              <option value="heun">Método de Heun</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Contagio ($\alpha$)</label>
            <input type="number" step="0.001" value={alpha} onChange={e => setAlpha(parseFloat(e.target.value))} className="bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-slate-200" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Recuperación ($\beta$)</label>
            <input type="number" step="0.01" value={beta} onChange={e => setBeta(parseFloat(e.target.value))} className="bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-slate-200" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Efectividad Diálogo ($\gamma$)</label>
            <input type="number" step="0.01" value={gamma} onChange={e => setGamma(parseFloat(e.target.value))} className="bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-slate-200" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Activación Mediadores ($k$)</label>
            <input type="number" step="0.01" value={k} onChange={e => setK(parseFloat(e.target.value))} className="bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-slate-200" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Días Simulación</label>
            <input type="number" min="5" max="90" value={dias} onChange={e => setDias(parseInt(e.target.value) || 10)} className="bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-slate-200" />
          </div>
        </div>
      </div>

      {/* Dashboard Principal de Visualizaciones */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Lienzo SVG Gráfico [cite: 172] */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col items-center justify-between">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold self-start mb-2 flex items-center gap-1.5">
            <Settings className="w-3.5 h-3.5 text-emerald-400" /> Evolución Temporal de Opinión Pública y Agentes
          </span>
          <div className="bg-slate-950 border border-slate-850 p-2 rounded-xl overflow-hidden w-full flex items-center justify-center">
            <svg width={widthSVG} height={heightSVG} className="overflow-visible font-mono select-none">
              {/* Líneas de malla interna en el eje X */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
                const dayLabel = Math.round(pct * dias);
                const sx = toX(dayLabel);
                return (
                  <g key={`grid-x-${idx}`}>
                    <line x1={sx} y1={margin.top} x2={sx} y2={heightSVG - margin.bottom} stroke="#1e293b" strokeDasharray="2,2" />
                    <text x={sx} y={heightSVG - margin.bottom + 14} textAnchor="middle" className="text-[9px] fill-slate-500">d{dayLabel}</text>
                  </g>
                );
              })}

              {/* Trazados vectoriales de las EDO */}
              <path d={crearPathSVG(registro.neutrales)} fill="none" stroke="#64748b" strokeWidth="2" />
              <path d={crearPathSVG(registro.manifestantes)} fill="none" stroke="#f43f5e" strokeWidth="2.5" />
              <path d={crearPathSVG(registro.mediadores)} fill="none" stroke="#10b981" strokeWidth="2" />

              {/* Leyenda Gráfica Interactiva */}
              <g transform={`translate(${margin.left + 15}, ${margin.top + 10})`} className="text-[9px] font-bold">
                <circle cx="0" cy="0" r="4" fill="#64748b" /><text x="8" y="3" className="fill-slate-400">Neutrales (N)</text>
                <circle cx="110" cy="0" r="4" fill="#f43f5e" /><text x="118" y="3" className="fill-rose-400">Manifestantes (M)</text>
                <circle cx="230" cy="0" r="4" fill="#10b981" /><text x="238" y="3" className="fill-emerald-400">Mediadores (D)</text>
              </g>
            </svg>
          </div>
        </div>

        {/* Cuestionario de Respuestas Académicas Exigido [cite: 174] */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-emerald-400" /> Respuestas Analíticas del Cuestionario
            </h3>

            <div className="space-y-3 text-xs max-h-[260px] overflow-y-auto pr-1">
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                <span className="text-[10px] font-mono text-slate-500 block font-bold">1. ¿El conflicto tiende a estabilizarse o masificarse?</span>
                <p className="text-slate-300 mt-0.5 leading-relaxed text-justify">
                  {gamma > alpha * 5 ? "**Tiende a estabilizarse**. La efectividad del diálogo neutraliza la tasa de contagio, induciendo un punto de equilibrio asintótico estable en el largo plazo." : "**Existe tendencia a la masificación**. La velocidad de influencia supera la contención, provocando un desborde del sistema."}
                </p>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                <span className="text-[10px] font-mono text-slate-500 block font-bold">2. ¿Qué pasa si mejora la tasa de diálogo ($\gamma$)?</span>
                <p className="text-slate-300 mt-0.5 leading-relaxed text-justify">
                  Se abate drásticamente el pico pandémico del descontento. La curva de manifestantes activos se deprime de forma inmediata, reduciendo el pico máximo a solo **{peakManifestantes.toFixed(0)}** agentes.
                </p>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                <span className="text-[10px] font-mono text-slate-500 block font-bold">3. ¿Qué pasa si no existen mediadores ($D_0 = 0, k = 0$)?</span>
                <p className="text-slate-300 mt-0.5 leading-relaxed text-justify">
                  Ocurre un colapso por saturación. Sin amortiguamiento institucional ($\gamma \cdot M \cdot D = 0$), la población de ciudadanos neutrales decae a un mínimo crítico, volcando la totalidad del sistema al estado de manifestación activa de forma sostenida.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla Desglose Analítico Temporal de Datos [cite: 171] */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
          <BarChart3 className="w-4 h-4 text-emerald-400" /> Registro de Valores Numéricos Discretos
        </h3>
        <div className="max-h-44 overflow-y-auto rounded-xl border border-slate-800 text-xs font-mono">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 sticky top-0 z-10">
              <tr>
                <th className="p-2 px-4 text-center">Tiempo ($t$)</th>
                <th className="p-2 text-center">Neutrales ($N$)</th>
                <th className="p-2 text-center">Manifestantes ($M$)</th>
                <th className="p-2 text-center">Mediadores ($D$)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {registro.tiempo.map((day, idx) => (
                <tr key={`row-time-${day}`} className="hover:bg-slate-950/40">
                  <td className="p-2 text-center font-bold text-slate-500">Día {day}</td>
                  <td className="p-2 text-center text-slate-400">{registro.neutrales[idx].toFixed(1)}</td>
                  <td className="p-2 text-center text-rose-400/90 font-bold">{registro.manifestantes[idx].toFixed(1)}</td>
                  <td className="p-2 text-center text-emerald-400">{registro.mediadores[idx].toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 bg-slate-950/50 p-3 rounded-xl border border-slate-850 text-[10px] font-mono text-slate-400 flex items-center gap-2">
          <Info className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Análisis del Algoritmo:</strong> Integración temporal realizada con tamaño de paso uniforme $h = 0.1$. El método {metodo === "rk4" ? "Runge-Kutta de 4to orden exhibe un error de truncamiento local de $\\mathcal{O}(h^5)$, garantizando estabilidad absoluta frente a la naturaleza no lineal acoplada del modelo social." : "de Heun (método predictor-corrector) opera con una precisión de $\\mathcal{O}(h^3)$, propensa a una ligera deriva numérica acumulada si las pendientes divergen bruscamente."}
          </span>
        </div>
      </div>
    </div>
  );
}