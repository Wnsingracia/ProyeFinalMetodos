/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { resolverBiseccion, resolverNewtonRaphson, resolverSecante, IteracionRaiz } from "../mathUtils";
import { Target, Calculator, Shield, Zap, HelpCircle } from "lucide-react";

export default function EscenarioE_RaicesTab() {
  const [modeloSeleccionado, setModeloSeleccionado] = useState<"f1" | "f2" | "f3">("f2");
  const [metodo, setMetodo] = useState<"biseccion" | "newton" | "secante">("newton");
  
  // Parámetros físicos configurables
  const [paramA, setParamA] = useState<number>(12); // Pánico para f2
  const [ingreso, setIngreso] = useState<number>(2500); // Ingreso para f1
  const [resistencia, setResistencia] = useState<number>(2.5); // Theta para f3

  // Condiciones iniciales del sistema
  const [x0, setX0] = useState<number>(1);
  const [x1, setX1] = useState<number>(6);
  const [iteraciones, setIteraciones] = useState<IteracionRaiz[]>([]);
  const [raiz, setRaiz] = useState<number | null>(null);

  // Definición analítica de funciones y derivadas
  const obtenerFunciones = () => {
    switch (modeloSeleccionado) {
      case "f1":
        return {
          f: (x: number) => 150 * Math.exp(0.12 * x) - ingreso,
          df: (x: number) => 150 * 0.12 * Math.exp(0.12 * x),
          label: "Costo Acumulado vs Ingreso Familiar",
          rango: [1, 30]
        };
      case "f2":
        return {
          f: (x: number) => Math.pow(x, 3) - 5 * Math.pow(x, 2) - paramA,
          df: (x: number) => 3 * Math.pow(x, 2) - 10 * x,
          label: "Tasa Crítica de Reposición de Carburante",
          rango: [0, 7]
        };
      case "f3":
        return {
          f: (x: number) => Math.tanh(x - resistencia) - x / 5,
          df: (x: number) => {
            const sech = 1 / Math.cosh(x - resistencia);
            return Math.pow(sech, 2) - 1 / 5;
          },
          label: "Umbral de Masificación del Descontento Social",
          rango: [0, 8]
        };
    }
  };

  const ejecutarSimulacion = () => {
    const { f, df } = obtenerFunciones();
    let raras: IteracionRaiz[] = [];

    if (metodo === "biseccion") {
      raras = resolverBiseccion(f, x0, x1);
    } else if (metodo === "newton") {
      raras = resolverNewtonRaphson(f, df, x0);
    } else {
      raras = resolverSecante(f, x0, x1);
    }

    setIteraciones(raras);
    if (raras.length > 0) {
      setRaiz(raras[raras.length - 1].xn);
    } else {
      setRaiz(null);
    }
  };

  // Ejecución controlada por dependencias reactivas
  useEffect(() => { 
    ejecutarSimulacion(); 
  }, [modeloSeleccionado, metodo, paramA, ingreso, resistencia, x0, x1]);

  // Estimación empírica del factor de convergencia: e_{i} / e_{i-1}
  const calcularFactorConvergencia = (index: number) => {
    if (index < 1 || index >= iteraciones.length) return "-";
    
    const errorAnterior = iteraciones[index - 1].err;
    const errorActual = iteraciones[index].err;
    
    if (errorAnterior === 0) return "-";
    
    return (errorActual / errorAnterior).toFixed(4);
  };

  // Renderizado dinámico del gráfico de la función mediante SVG nativo
  const { f, rango, label } = obtenerFunciones();
  const widthSVG = 500;
  const heightSVG = 220;
  const margin = { top: 15, right: 20, bottom: 30, left: 50 };
  
  const puntosGrafico: [number, number][] = [];
  const pasosX = 40;
  const deltaX = (rango[1] - rango[0]) / pasosX;
  for (let i = 0; i <= pasosX; i++) {
    const cx = rango[0] + i * deltaX;
    puntosGrafico.push([cx, f(cx)]);
  }

  const efeY = puntosGrafico.map(p => p[1]);
  const minY = Math.min(...efeY, -5);
  const maxY = Math.max(...efeY, 5);

  const transX = (x: number) => margin.left + ((x - rango[0]) / (rango[1] - rango[0])) * (widthSVG - margin.left - margin.right);
  const transY = (y: number) => margin.top + (1 - (y - minY) / (maxY - minY)) * (heightSVG - margin.top - margin.bottom);

  let pathD = "";
  puntosGrafico.forEach((p, idx) => {
    const sx = transX(p[0]);
    const sy = transY(p[1]);
    if (idx === 0) pathD += `M ${sx} ${sy}`;
    else pathD += ` L ${sx} ${sy}`;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* Columna Izquierda: Parametrización HUD */}
      <div className="lg:col-span-4 space-y-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <span className="text-[10px] font-mono font-bold tracking-widest text-red-400 uppercase block mb-3">
            🎯 Selección de Fenómeno No Lineal
          </span>
          <div className="space-y-2">
            <button onClick={() => setModeloSeleccionado("f1")} className={`w-full text-left p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-between ${modeloSeleccionado === "f1" ? "bg-red-950/40 border-red-500 text-red-400" : "bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200"}`}>
              <span>Gasto Familiar vs Ingresos</span>
              <span className="text-[10px] font-mono opacity-60">f1(x)</span>
            </button>
            <button onClick={() => setModeloSeleccionado("f2")} className={`w-full text-left p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-between ${modeloSeleccionado === "f2" ? "bg-red-950/40 border-red-500 text-red-400" : "bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200"}`}>
              <span>Reposición de Carburantes</span>
              <span className="text-[10px] font-mono opacity-60">f2(x)</span>
            </button>
            <button onClick={() => setModeloSeleccionado("f3")} className={`w-full text-left p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-between ${modeloSeleccionado === "f3" ? "bg-red-950/40 border-red-500 text-red-400" : "bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200"}`}>
              <span>Masificación de Descontento</span>
              <span className="text-[10px] font-mono opacity-60">f3(x)</span>
            </button>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase block">
            🎛️ Parámetros y Condiciones Iniciales
          </span>
          
          {modeloSeleccionado === "f1" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Ingreso Familiar Mensual (Bs)</label>
              <input type="number" value={ingreso} onChange={e => setIngreso(parseFloat(e.target.value))} className="bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs font-mono text-slate-200" />
            </div>
          )}
          {modeloSeleccionado === "f2" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Parámetro de Pánico Operativo (A)</label>
              <input type="number" value={paramA} onChange={e => setParamA(parseFloat(e.target.value))} className="bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs font-mono text-slate-200" />
            </div>
          )}
          {modeloSeleccionado === "f3" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Umbral de Resistencia Social (θ)</label>
              <input type="number" step="0.1" value={resistencia} onChange={e => setResistencia(parseFloat(e.target.value))} className="bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs font-mono text-slate-200" />
            </div>
          )}

          <div className="flex border-t border-slate-800 pt-3 gap-2">
            <div className="flex-grow flex flex-col gap-1.5">
              <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Aprox X0</label>
              <input type="number" step="0.1" value={x0} onChange={e => setX0(parseFloat(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs font-mono text-slate-200" />
            </div>
            <div className="flex-grow flex flex-col gap-1.5">
              <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Sup X1 (Sec/Bis)</label>
              <input type="number" step="0.1" value={x1} onChange={e => setX1(parseFloat(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs font-mono text-slate-200" />
            </div>
          </div>
        </div>
      </div>

      {/* Columna Derecha: Gráfico, Métodos y Tablas de Iteración */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* Selector de Algoritmo Numérico */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex gap-2 overflow-x-auto">
          {["biseccion", "newton", "secante"].map(m => (
            <button key={m} onClick={() => setMetodo(m as any)} className={`px-4 py-2 rounded-xl font-mono text-xs font-bold uppercase transition ${metodo === m ? "bg-red-600 text-white" : "bg-slate-950 text-slate-400 hover:text-slate-200"}`}>
              {m}
            </button>
          ))}
        </div>

        {/* Renderizado de Gráfico de la Función con raíz señalada */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col items-center">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold self-start mb-2">📈 Gráfico Técnico de la función: {label}</span>
          <div className="bg-slate-950 border border-slate-850 p-2 rounded-xl overflow-hidden">
            <svg width={widthSVG} height={heightSVG} className="overflow-visible font-mono">
              {/* Eje X Cero de Referencia */}
              <line x1={margin.left} y1={transY(0)} x2={widthSVG - margin.right} y2={transY(0)} stroke="#334155" strokeWidth="1.5" />
              {/* Curva de la función */}
              <path d={pathD} fill="none" stroke="#ef4444" strokeWidth="2.5" />
              {/* Nodo de Raíz Señalado */}
              {raiz !== null && raiz >= rango[0] && raiz <= rango[1] && (
                <g>
                  <circle cx={transX(raiz)} cy={transY(0)} r="6" fill="#f43f5e" />
                  <line x1={transX(raiz)} y1={transY(0)} x2={transX(raiz)} y2={heightSVG - margin.bottom} stroke="#f43f5e" strokeDasharray="3,3" />
                  <text x={transX(raiz)} y={transY(0) - 10} textAnchor="middle" className="text-[10px] fill-rose-400 font-bold">Raíz: {raiz.toFixed(4)}</text>
                </g>
              )}
              {/* Etiquetas límites */}
              <text x={margin.left} y={heightSVG - margin.bottom + 15} textAnchor="middle" className="text-[9px] fill-slate-500">x: {rango[0]}</text>
              <text x={widthSVG - margin.right} y={heightSVG - margin.bottom + 15} textAnchor="middle" className="text-[9px] fill-slate-500">x: {rango[1]}</text>
            </svg>
          </div>
        </div>

        {/* Tabla de convergencia estimada e iteraciones */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <Calculator className="w-4 h-4 text-red-500" /> Tabla de Análisis de Errores e Iteraciones
          </h3>
          {iteraciones.length === 0 ? (
            <p className="text-xs text-amber-400 font-mono">Advertencia: Las condiciones iniciales dadas no convergen en una raíz real en el rango.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <th className="p-2.5">Iter</th>
                    <th className="p-2.5">Aproximación ($x_n$)</th>
                    <th className="p-3">$f(x_n)$</th>
                    <th className="p-2.5">Error Absoluto</th>
                    <th className="p-2.5">Factor Conv {"$e_{i}/e_{i-1}$"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {iteraciones.map((it, idx) => (
                    <tr key={it.iter} className="hover:bg-slate-950/40">
                      <td className="p-2.5 text-slate-500 font-bold">{it.iter}</td>
                      <td className="p-2.5 text-slate-200 font-bold">{it.xn.toFixed(5)}</td>
                      <td className="p-3 text-slate-400">{it.fxn.toExponential(4)}</td>
                      <td className="p-2.5 text-red-400">{it.err.toExponential(4)}</td>
                      <td className="p-2.5 text-slate-400">{calcularFactorConvergencia(idx)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Métricas e Idea del Modelo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex gap-3">
            <Zap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-slate-200 uppercase font-mono">Estudio de Velocidad</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed mt-1 text-justify">
                El método ejecutado cerró la aproximación en **{iteraciones.length} iteraciones**. Newton-Raphson demuestra convergencia cuadrática asintótica, mientras que Secante opera a un ritmo súper-lineal sin requerir cálculo diferencial explícito.
              </p>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex gap-3">
            <Shield className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-slate-200 uppercase font-mono">Análisis de Robustez</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed mt-1 text-justify">
                Frente a la extrema sensibilidad a la condición inicial de Newton, Bisección se mantiene como el modelo más robusto, inmune a oscilaciones caóticas o derivadas nulas en entornos de crisis social.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}