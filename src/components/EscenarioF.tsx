/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { resolverEscenarioF, AnalisisSensibilidadF } from "../mathUtils";
import { AlertTriangle, TrendingUp, ShieldAlert, HelpCircle } from "lucide-react";

export default function EscenarioF_SistemasTab() {
  const [sliderVal, setSliderVal] = useState<number>(5); // Por defecto un incremento del 5%
  const [reporte, setReporte] = useState<AnalisisSensibilidadF | null>(null);

  useEffect(() => {
    setReporte(resolverEscenarioF(sliderVal));
  }, [sliderVal]);

  // Clasificación cualitativa del estado de desinformación
  const obtenerNivelRumor = (val: number) => {
    if (val <= 2) return { texto: "Rumor Bajo - Leve especulación", color: "text-blue-400" };
    if (val <= 7) return { texto: "Rumor Medio - Compras preventivas", color: "text-amber-400" };
    if (val <= 15) return { texto: "Rumor Alto - Alerta de escasez", color: "text-orange-400" };
    return { texto: "Pánico de Compra masivo", color: "text-red-500 font-black animate-pulse" };
  };

  if (!reporte) return null;
  const nivel = obtenerNivelRumor(sliderVal);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Panel de Control Principal */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-3">
          <AlertTriangle className="w-5 h-5 text-orange-400" />
          <h2 className="text-lg font-bold text-slate-100 uppercase tracking-tight">
            Escenario F: Rumores y Estabilidad de Redes de Distribución
          </h2>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
          Este módulo simula cómo la percepción social y los rumores de escasez inyectan perturbaciones en la demanda de los mercados, afectando el stock de distribución física a través de un sistema de ecuaciones lineales mal condicionado[cite: 110, 111, 112].
        </p>

        {/* Slider HUD */}
        <div className="mt-6 bg-slate-950 p-5 rounded-xl border border-slate-800/60 max-w-xl space-y-4">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="font-bold text-slate-400 uppercase">Magnitud del Rumor (Perturbación en $\Delta B$):</span>
            <span className="text-sm font-black text-orange-400">+{sliderVal.toFixed(1)}%</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="25"
            step="0.5"
            value={sliderVal}
            onChange={(e) => setSliderVal(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
          <div className="text-[11px] font-mono flex items-center gap-1.5">
            <span className="text-slate-500">Estado de Percepción:</span>
            <span className={`${nivel.color}`}>{nivel.texto}</span>
          </div>
        </div>
      </div>

      {/* Resultados HUD y Dashboard de Respuestas Obligatorias */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Tabla Comparativa */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-orange-400" /> Impacto Vectorial en los Flujos de Transporte
            </h3>
            <div className="overflow-x-auto rounded-xl border border-slate-800 text-xs font-mono">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <th className="p-3">Destino Logístico</th>
                    <th className="p-3 text-center">Asignación Base</th>
                    <th className="p-3 text-center">Asignación Perturbada</th>
                    <th className="p-3 text-center">Efecto Neto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  <tr className="hover:bg-slate-950/20 transition">
                    <td className="p-3 font-bold text-slate-400">Zona Norte ($x_1$)</td>
                    <td className="p-3 text-center">{reporte.x_base[0].toFixed(2)} u.</td>
                    <td className="p-3 text-center">{reporte.x_pert[0].toFixed(2)} u.</td>
                    <td className="p-3 text-center font-black text-rose-400">
                      {reporte.var_x[0] > 0 ? "+" : ""}{reporte.var_x[0].toFixed(1)}%
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-950/20 transition">
                    <td className="p-3 font-bold text-slate-400">Zona Sur ($x_2$)</td>
                    <td className="p-3 text-center">{reporte.x_base[1].toFixed(2)} u.</td>
                    <td className="p-3 text-center">{reporte.x_pert[1].toFixed(2)} u.</td>
                    <td className="p-3 text-center font-black text-emerald-400">
                      {reporte.var_x[1] > 0 ? "+" : ""}{reporte.var_x[1].toFixed(1)}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 p-3 bg-slate-950 border border-slate-850 rounded-xl flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
            <div className="text-[11px] font-mono leading-relaxed text-slate-400">
              <span className="font-bold text-slate-200 block mb-0.5">Estudio de Sensibilidad Estructural:</span>
              Número de Condición de la Red: $\kappa(A) = $ **{reporte.kappa}**. Al superar con creces el umbral crítico ($\kappa \gg 100$), el sistema logístico se diagnostica matemáticamente como **Altamente Mal Condicionado**[cite: 112, 129].
            </div>
          </div>
        </div>

        {/* Cuestionario Académico Resuelto de la Guía */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-orange-400" /> Respuestas al Cuestionario Científico
            </h3>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                <span className="text-[10px] font-mono text-slate-500 block font-bold">1. ¿Qué pasa si la demanda aumenta solo un 5%? [cite: 127]</span>
                <p className="text-slate-300 mt-1 leading-normal text-justify">
                  El vector de flujos entra en caos. La Zona Norte sufre una amputación drástica del **{Math.abs(reporte.var_x[0]).toFixed(1)}%** de su suministro teórico para compensar el desvío artificial hacia el otro nodo[cite: 120].
                </p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                <span className="text-[10px] font-mono text-slate-500 block font-bold">2. ¿La solución cambia poco o demasiado? [cite: 128]</span>
                <p className="text-slate-300 mt-1 leading-normal text-justify">
                  Cambia **demasiado**. Una variación de entrada minúscula del {sliderVal}% gatilla una distorsión de salida masiva de casi **{Math.abs(reporte.var_x[0]).toFixed(0)}%**, lo que demuestra una amplificación de error extrema.
                </p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                <span className="text-[10px] font-mono text-slate-500 block font-bold">3. ¿Qué zona o mercado es más vulnerable? [cite: 131]</span>
                <p className="text-slate-300 mt-1 leading-normal text-justify">
                  La **Zona Norte ($x_1$)** se convierte en el eslabón más vulnerable[cite: 43, 131]. Sufre una escasez severa inducida no por falta de producto real en las plantas, sino por el desvío provocado por el pánico de compra en la Zona Sur[cite: 111, 119, 120].
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}