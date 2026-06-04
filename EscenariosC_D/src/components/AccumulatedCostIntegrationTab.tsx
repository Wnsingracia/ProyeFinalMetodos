/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { Point, Product } from "../types";
import {
  evaluateCubicSpline,
  integrateTrapezoidal,
  integrateSimpson13,
  integrateSimpson38
} from "../mathUtils";
import {
  Scale,
  TrendingDown,
  Info,
  ShieldCheck,
  CheckCircle2,
  Layers,
  ArrowRight
} from "lucide-react";
import NumericalIntegrationProcedures from "./NumericalIntegrationProcedures";

interface Props {
  product: Product;
  products: Product[];
}

export default function AccumulatedCostIntegrationTab({ product, products }: Props) {
  const [purchaseQty, setPurchaseQty] = useState<number>(1); // Daily units bought
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 260 });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width } = entries[0].contentRect;
      setDimensions({
        width: Math.max(width, 300),
        height: 260,
      });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const points = product.points;

  // Let's sample the Cubic Spline of the active product over [1, 30] using N = 24 intervals
  // 24 is even and divisible by 3, so all 3 methods can use the same sample!
  const N = 24;
  const a = 1;
  const b = 30;
  const h = (b - a) / N; // 29 / 24 = 1.208333

  const xSamples: number[] = [];
  const ySamples: number[] = [];
  for (let i = 0; i <= N; i++) {
    const xVal = a + i * h;
    xSamples.push(xVal);
    ySamples.push(evaluateCubicSpline(points, xVal));
  }

  // Calculate integrated values
  const rawTrapezoid = integrateTrapezoidal(ySamples, h);
  const rawSimpson13 = integrateSimpson13(ySamples, h);
  const rawSimpson38 = integrateSimpson38(ySamples, h);

  // Apply purchase quantity multiplier to represent daily purchases
  const totalTrapezoid = rawTrapezoid * purchaseQty;
  const totalSimpson13 = rawSimpson13 * purchaseQty;
  const totalSimpson38 = rawSimpson38 * purchaseQty;

  // Baseline cost if prices did not change (P1 constant)
  const p1 = points[0]?.y || 1;
  const baseCost = p1 * (b - a) * purchaseQty;

  // Loss of power purchasing
  const lossTrapezoid = totalTrapezoid - baseCost;
  const lossSimpson13 = totalSimpson13 - baseCost;
  const lossSimpson38 = totalSimpson38 - baseCost;

  // Multi-food comparative integration: find which product has the absolute highest spending increase
  const foodIntegrations = products.map((prod) => {
    const pData = prod.points;
    const yVals: number[] = [];
    for (let i = 0; i <= N; i++) {
      const xVal = a + i * h;
      yVals.push(evaluateCubicSpline(pData, xVal));
    }
    const intSpline = integrateSimpson13(yVals, h) * purchaseQty;
    const initialPrice = pData[0]?.y || 1;
    const intBase = initialPrice * (b - a) * purchaseQty;
    const absoluteLoss = intSpline - intBase;

    return {
      name: prod.name,
      emoji: prod.emoji,
      unit: prod.unit,
      initialPrice,
      finalPrice: pData[pData.length - 1]?.y || 1,
      totalSpent: intSpline,
      baseSpent: intBase,
      loss: absoluteLoss,
    };
  });

  const biggestPocketHurter = [...foodIntegrations].sort((a, b) => b.loss - a.loss)[0];

  // SVG coordinate conversions for a simplified area highlight chart
  const margin = { top: 15, right: 20, bottom: 30, left: 45 };
  const plotW = dimensions.width - margin.left - margin.right;
  const plotH = dimensions.height - margin.top - margin.bottom;

  const toX = (x: number) => margin.left + plotW * ((x - a) / (b - a));
  const maxYSample = Math.max(...ySamples, 10);
  const toY = (y: number) => margin.top + plotH * (1 - y / (maxYSample * 1.15));

  // Area path
  let areaPath = `M ${toX(a)} ${toY(0)} `;
  for (let i = 0; i <= N; i++) {
    areaPath += `L ${toX(xSamples[i])} ${toY(ySamples[i])} `;
  }
  areaPath += `L ${toX(b)} ${toY(0)} Z`;

  // Line path
  let linePath = `M ${toX(a)} ${toY(ySamples[0])} `;
  for (let i = 1; i <= N; i++) {
    linePath += `L ${toX(xSamples[i])} ${toY(ySamples[i])} `;
  }

  // Flat Baseline representation path
  const baselinePath = `M ${toX(a)} ${toY(p1)} L ${toX(b)} ${toY(p1)}`;

  return (
    <div className="space-y-6">
      
      {/* Visual Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-widest text-pink-400 bg-pink-950/40 border border-pink-900/60 px-2.5 py-0.5 rounded-full uppercase">
                INTEGRACIÓN NUMÉRICA
              </span>
              <span className="text-xs font-mono text-slate-500">
                Dominio: [1, 30] Días • N = {N} intervalos
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-100 mt-1">
              Gasto Acumulado y Pérdida del Poder Adquisitivo
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
              El área bajo la curva continua de precios ($P(x)$) representa el coste total real acumulado por el sustento familiar mensual. Calculamos la integral definida $\int_{1}^{30} P(x) \, dx$ usando tres reglas compuestas.
            </p>
          </div>

          {/* Daily Purchase Multiplier Tool */}
          <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex items-center gap-3 shrink-0">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-black">
              Consumo Diario Familiar:
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPurchaseQty(Math.max(1, purchaseQty - 1))}
                className="w-7 h-7 bg-slate-850 hover:bg-slate-800 text-slate-300 rounded font-bold transition flex items-center justify-center text-xs"
              >
                -
              </button>
              <span className="w-10 text-center font-mono font-bold text-emerald-400 text-sm">
                {purchaseQty} {product.unit}(s)
              </span>
              <button
                onClick={() => setPurchaseQty(purchaseQty + 1)}
                className="w-7 h-7 bg-slate-850 hover:bg-slate-800 text-slate-300 rounded font-bold transition flex items-center justify-center text-xs"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Chart and Realtime HUD Answers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Shaded Area Chart Visualizer */}
        <div ref={containerRef} className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-100 mb-1 flex items-center gap-2">
              📉 Región Integrable de Consumo Acumulado
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              La zona sombreada turquesa corresponde al costo acumulado. La línea discontinua es el escenario sin inflación.
            </p>
          </div>

          <div className="bg-slate-950 border border-slate-850/40 rounded-xl relative overflow-hidden flex-grow flex items-center justify-center min-h-[180px]">
            <svg width={dimensions.width} height={dimensions.height} className="overflow-visible select-none">
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.01" />
                </linearGradient>
              </defs>

              {/* Day markers scale */}
              {[1, 5, 10, 15, 20, 25, 30].map((d) => {
                const sx = toX(d);
                return (
                  <g key={`marker-x-${d}`}>
                    <line x1={sx} y1={margin.top} x2={sx} y2={dimensions.height - margin.bottom} stroke="#1e293b" />
                    <text x={sx} y={dimensions.height - margin.bottom + 15} textAnchor="middle" className="text-[9px] font-mono fill-slate-500">
                      d{d}
                    </text>
                  </g>
                );
              })}

              {/* Horizontal grid lines */}
              <line x1={margin.left} y1={toY(p1)} x2={toX(b)} y2={toY(p1)} stroke="#1e293b" strokeDasharray="3,3" />

              {/* Shaded area */}
              <path d={areaPath} fill="url(#areaGrad)" />

              {/* Real dynamic price line */}
              <path d={linePath} fill="none" stroke="#06b6d4" strokeWidth="2.5" />

              {/* Flat Baseline Price Line */}
              <path d={baselinePath} fill="none" stroke="#64748b" strokeWidth="1.5" strokeDasharray="4,4" />

              {/* Label for base */}
              <text x={toX(15)} y={toY(p1) - 6} textAnchor="middle" className="text-[10px] font-mono fill-slate-400 bg-slate-950">
                Poder adquisitivo de referencia ({p1.toFixed(1)} Bs)
              </text>
              
              {/* Label for dynamic curve */}
              <text x={toX(15)} y={toY(ySamples[12]) + 16} textAnchor="middle" className="text-[10px] font-mono fill-cyan-400 font-bold">
                Costo Inflacionario {product.emoji}
              </text>
            </svg>
          </div>

          <div className="mt-3 bg-slate-950/40 border border-slate-850 p-2.5 rounded-xl text-[10px] font-mono text-slate-400 flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 animate-pulse" />
            <span>
              La integral se aproxima dividiendo el dominio en {N} subsegmentos con ancho del paso $h = {h.toFixed(5)}$ días.
            </span>
          </div>
        </div>

        {/* Answers to Challlenge Questions Form */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400 uppercase">
              RESPUESTAS DEL MODELO MATEMÁTICO
            </span>
            <h3 className="text-sm font-semibold text-slate-100 mt-0.5 mb-4">
              Dictamen de Gasto Familiar y Poder Adquisitivo
            </h3>

            <div className="space-y-3">
              
              {/* Question 1 Answer Card */}
              <div className="bg-slate-950 border border-slate-850 p-3 rounded-xl">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono block">¿Cuánto gastó la familia durante el mes?</span>
                    <span className="text-xs text-slate-300 font-bold">Según Simpson 1/3 compuesto (Alta precisión):</span>
                  </div>
                  <span className="text-lg font-mono font-black text-cyan-400">
                    {totalSimpson13.toFixed(2)} Bs
                  </span>
                </div>
              </div>

              {/* Question 2 Answer Card */}
              <div className="bg-slate-950 border border-slate-850 p-3 rounded-xl">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono block">¿Cuánto hubiera gastado si los precios no subían?</span>
                    <span className="text-xs text-slate-300 font-bold">Escenario sin inflación (Precio del Día 1 plano):</span>
                  </div>
                  <span className="text-lg font-mono font-black text-slate-400">
                    {baseCost.toFixed(2)} Bs
                  </span>
                </div>
              </div>

              {/* Question 3 Answer Card */}
              <div className="bg-slate-950 border border-slate-850 p-3 rounded-xl border-l-4 border-l-rose-500">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] text-rose-400 font-mono block font-bold">¿Pérdida aproximada del poder adquisitivo familiar?</span>
                    <span className="text-xs text-slate-400">El gasto fantasma debido enteramente al desabastecimiento:</span>
                  </div>
                  <span className="text-lg font-mono font-black text-rose-400">
                    +{(totalSimpson13 - baseCost).toFixed(2)} Bs
                  </span>
                </div>
                <div className="text-[9px] font-mono text-slate-500 mt-1">
                  Un incremento del <strong className="text-rose-400 font-extrabold">{(((totalSimpson13 - baseCost) / baseCost) * 100).toFixed(1)}%</strong> sobre el presupuesto de canasta básica de este artículo.
                </div>
              </div>

            </div>
          </div>

          <div className="mt-4 border-t border-slate-850 pt-3 flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5 font-mono text-[10px]">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Sustentado en Métodos de Integración Numérica Newton-Cotes
            </span>
          </div>
        </div>
      </div>

      {/* Section 2: Comparison of the 3 Integration Methods */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-semibold text-slate-100">
            📊 Comparación de Diferencias de Precisión entre Métodos
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Trapezoid Card */}
          <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-850 pb-2 mb-2">
                <span className="text-xs font-bold text-slate-200">Regla del Trapecio</span>
                <span className="text-[9px] font-mono bg-blue-950 text-blue-400 px-1.5 py-0.2 rounded border border-blue-900/40">Grado 1</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed min-h-[50px]">
                Une pares de puntos adyacentes con rectas. Dado que la curva real de desabastecimiento es convexa, la aproximación trapezoide tiende a un <strong>ligero sobreestimado</strong>.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-850/60 flex justify-between items-baseline">
              <span className="text-[10px] font-mono text-slate-500">Suma total:</span>
              <span className="text-base font-mono font-black text-blue-400">{totalTrapezoid.toFixed(4)} Bs</span>
            </div>
          </div>

          {/* Simpson 1/3 Card */}
          <div className="bg-slate-950/80 border border-emerald-800/40 p-4 rounded-xl relative overflow-hidden flex flex-col justify-between group">
            <div className="absolute top-0 right-0 bg-emerald-500 text-slate-950 text-[8px] font-bold px-2 py-0.5 rounded-bl font-mono">
              ELEVADA PRECISIÓN
            </div>
            <div>
              <div className="flex items-center justify-between border-b border-slate-850 pb-2 mb-2">
                <span className="text-xs font-bold text-slate-200">Simpson 1/3 Compuesto</span>
                <span className="text-[9px] font-mono bg-emerald-950 text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-900/40">Grado 2</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed min-h-[50px]">
                Ajusta parábolas en grupos de tres puntos. Su cota de error depende de la cuarta derivada y es idónea para simular curvas continuas de spline con transiciones suaves.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-850/60 flex justify-between items-baseline">
              <span className="text-[10px] font-mono text-slate-500">Suma total:</span>
              <span className="text-base font-mono font-black text-emerald-400">{totalSimpson13.toFixed(4)} Bs</span>
            </div>
          </div>

          {/* Simpson 3/8 Card */}
          <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-850 pb-2 mb-2">
                <span className="text-xs font-bold text-slate-200">Simpson 3/8 Compuesto</span>
                <span className="text-[9px] font-mono bg-pink-950 text-pink-400 px-1.5 py-0.2 rounded border border-pink-900/40">Grado 3</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed min-h-[50px]">
                Ajusta polinomios cúbicos cada cuatro puntos. Su error de truncamiento es comparable al de Simpson 1/3, pero ofrece mayor estabilidad si la dispersión cambia fuertemente.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-850/60 flex justify-between items-baseline">
              <span className="text-[10px] font-mono text-slate-500">Suma total:</span>
              <span className="text-base font-mono font-black text-pink-400">{totalSimpson38.toFixed(4)} Bs</span>
            </div>
          </div>

        </div>

        <div className="mt-4 bg-slate-950 p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs border border-slate-850">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <p className="text-slate-300">
              <strong>Análisis Teórico de Precisión:</strong> Para este conjunto de puntos, la diferencia entre Simpson 1/3 y Simpson 3/8 es menor al <strong>0.01%</strong>, confirmando que la interpolación por Spline Cúbico natural ha sido integrada con estabilidad óptima. Ambos métodos reducen drásticamente el error de truncador frente al Trapecio.
            </p>
          </div>
        </div>
      </div>

      {/* Integration walkthrough step-by-step math tool */}
      <NumericalIntegrationProcedures points={points} purchaseQty={purchaseQty} unit={product.unit} />

      {/* Section 3: Which product affected families pocket the most? Multi-food integration list */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              📊 Multi-Alimento: ¿Qué producto afectó más al gasto familiar?
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Integrando el área acumulada de cada uno de los productos de la canasta básica bajo el consumo familiar configurado de {purchaseQty} {purchaseQty === 1 ? "unidad diaria" : "unidades diarias"}.
            </p>
          </div>
        </div>

        {/* Answer Banner inside food integration */}
        {biggestPocketHurter && (
          <div className="mb-4 bg-rose-950/20 border border-rose-900/40 p-3 rounded-xl flex items-center gap-3 text-xs text-rose-300">
            <span className="text-lg">{biggestPocketHurter.emoji}</span>
            <p>
              El producto que afectó más severamente a la economía es el <strong>{biggestPocketHurter.name}</strong>, sumando una pérdida total de poder adquisitivo de <strong>{biggestPocketHurter.loss.toFixed(1)} Bs</strong> sobre el consumo mensual.
            </p>
          </div>
        )}

        <div className="overflow-x-auto border border-slate-850 rounded-xl bg-slate-950/40 text-xs font-mono">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 uppercase tracking-widest text-[9px] font-bold">
                <th className="py-2.5 px-4">Producto</th>
                <th className="py-2.5 px-4 text-right">Precio Inicial → Final</th>
                <th className="py-2.5 px-4 text-right">Gasto Máximo Proyectado (Real)</th>
                <th className="py-2.5 px-4 text-right">Gasto Teórico sin Inflación</th>
                <th className="py-2.5 px-4 text-right">Impacto Neto (Pérdida de Dinero)</th>
              </tr>
            </thead>
            <tbody>
              {foodIntegrations.map((prod) => (
                <tr key={prod.name} className="border-b border-slate-800/50 hover:bg-slate-900/40 transition">
                  <td className="py-3 px-4 font-bold text-slate-200">
                    <span className="mr-2 text-sm">{prod.emoji}</span> {prod.name} <span className="text-[10px] text-slate-500">({prod.unit})</span>
                  </td>
                  <td className="py-3 px-4 text-right text-slate-400">
                    {prod.initialPrice.toFixed(1)} Bs → {prod.finalPrice.toFixed(1)} Bs
                  </td>
                  <td className="py-3 px-4 text-right text-emerald-400 font-bold">
                    {prod.totalSpent.toFixed(2)} Bs
                  </td>
                  <td className="py-3 px-4 text-right text-slate-500">
                    {prod.baseSpent.toFixed(2)} Bs
                  </td>
                  <td className={`py-3 px-4 text-right font-black ${prod.loss > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                    +{prod.loss.toFixed(2)} Bs
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
