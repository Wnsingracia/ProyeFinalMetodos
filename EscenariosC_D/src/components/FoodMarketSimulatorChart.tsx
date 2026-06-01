/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { Point, Product } from "../types";
import { evaluateLagrange, evaluateNewton, evaluateCubicSpline } from "../mathUtils";
import { Info, Lock, ArrowUpRight, HelpCircle, Eye, EyeOff } from "lucide-react";

interface Props {
  product: Product;
  selectedDay: number;
  setSelectedDay: (day: number) => void;
  showLagrange: boolean;
  showNewton: boolean;
  showSpline: boolean;
  clampOscillations: boolean;
  setClampOscillations: (clamp: boolean) => void;
}

export default function FoodMarketSimulatorChart({
  product,
  selectedDay,
  setSelectedDay,
  showLagrange,
  showNewton,
  showSpline,
  clampOscillations,
  setClampOscillations,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; yLagrange: number; yNewton: number; ySpline: number; screenX: number; screenY: number } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      setDimensions({
        width: Math.max(width, 300),
        height: Math.max(height || 360, 320),
      });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const points = product.points;
  const xValues = points.map((p) => p.x);
  const yValues = points.map((p) => p.y);

  const xMin = 1;
  const xMax = 30; // standard month 30 days
  const maxInputY = Math.max(...yValues, 5);

  // Compute values for sampling to check if values oscillate wildy
  const step = 0.2;
  const samples: { x: number; lagrange: number; newton: number; spline: number }[] = [];
  
  for (let x = xMin; x <= xMax; x = Number((x + step).toFixed(2))) {
    samples.push({
      x,
      lagrange: evaluateLagrange(points, x),
      newton: evaluateNewton(points, x),
      spline: evaluateCubicSpline(points, x),
    });
  }

  // Find max Y for drawing
  let activeYMin = 0;
  let activeYMax = maxInputY * 1.25;

  if (!clampOscillations) {
    // If we want to see Runge's extreme oscillations, look at real values
    let extremeMax = activeYMax;
    samples.forEach((s) => {
      if (showLagrange && s.lagrange > extremeMax && s.lagrange < 500) extremeMax = s.lagrange;
      if (showNewton && s.newton > extremeMax && s.newton < 500) extremeMax = s.newton;
      if (showSpline && s.spline > extremeMax) extremeMax = s.spline;
    });
    activeYMax = extremeMax;

    // Check under-shoot oscillations
    let extremeMin = 0;
    samples.forEach((s) => {
      if (showLagrange && s.lagrange < extremeMin) extremeMin = s.lagrange;
      if (showNewton && s.newton < extremeMin) extremeMin = s.newton;
    });
    activeYMin = Math.max(-50, extremeMin);
  }

  // Margins for SVG Plotting
  const margin = { top: 30, right: 30, bottom: 50, left: 55 };
  const plotW = dimensions.width - margin.left - margin.right;
  const plotH = dimensions.height - margin.top - margin.bottom;

  // Coordinate Conversion Helpers
  const toScreenX = (x: number) => margin.left + plotW * ((x - xMin) / (xMax - xMin || 1));
  const toScreenY = (y: number) => {
    const relativePos = (y - activeYMin) / (activeYMax - activeYMin || 1);
    return margin.top + plotH * (1 - relativePos); // Invert Y axis
  };

  const fromScreenX = (screenX: number) => {
    const xFraction = (screenX - margin.left) / plotW;
    return xMin + xFraction * (xMax - xMin);
  };

  // Generate continuous SVG paths
  const getPathData = (pointsData: { x: number; y: number }[]) => {
    if (pointsData.length === 0) return "";
    return pointsData
      .map((p, idx) => {
        const sx = toScreenX(p.x);
        const sy = toScreenY(p.y);
        // Clamp SVG coords to avoid blowing up the renderer
        const safeX = isNaN(sx) ? 0 : Math.max(-1000, Math.min(3000, sx));
        const safeY = isNaN(sy) ? 0 : Math.max(-1000, Math.min(3000, sy));
        return `${idx === 0 ? "M" : "L"} ${safeX} ${safeY}`;
      })
      .join(" ");
  };

  const lagrangePathData = getPathData(samples.map((s) => ({ x: s.x, y: s.lagrange })));
  const newtonPathData = getPathData(samples.map((s) => ({ x: s.x, y: s.newton })));
  const splinePathData = getPathData(samples.map((s) => ({ x: s.x, y: s.spline })));

  // Mouse interactivity on chart
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseXInBounds = Math.max(margin.left, Math.min(dimensions.width - margin.right, mouseX));

    const simDay = fromScreenX(mouseXInBounds);
    const clampedDay = Math.max(1, Math.min(30, Number(simDay.toFixed(1))));

    const yLagrange = evaluateLagrange(points, clampedDay);
    const yNewton = evaluateNewton(points, clampedDay);
    const ySpline = evaluateCubicSpline(points, clampedDay);

    setHoveredPoint({
      x: clampedDay,
      yLagrange,
      yNewton,
      ySpline,
      screenX: mouseXInBounds,
      screenY: toScreenY(showSpline ? ySpline : showLagrange ? yLagrange : yNewton),
    });
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  const handleChartClick = () => {
    if (hoveredPoint) {
      setSelectedDay(hoveredPoint.x);
    }
  };

  // Grid tick numbers
  const xTicks = [1, 5, 10, 15, 20, 25, 30];
  const yTicksCount = 6;
  const yTicks = Array.from({ length: yTicksCount }, (_, i) => {
    return Number((activeYMin + ((activeYMax - activeYMin) / (yTicksCount - 1)) * i).toFixed(1));
  });

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden p-5 shadow-2xl relative">
      {/* Chart Title / Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div>
          <span className="text-xs font-mono font-medium tracking-widest text-emerald-400 bg-emerald-950/50 border border-emerald-900 px-2 py-0.5 rounded-full uppercase">
            MODELADO EN TIEMPO REAL
          </span>
          <h3 className="text-lg font-sans font-semibold text-slate-100 flex items-center gap-2 mt-1">
            Visualizador de Curvas Continuas • {product.name}
          </h3>
        </div>

        {/* Oscillating Toggle */}
        <button
          onClick={() => setClampOscillations(!clampOscillations)}
          className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg transition-all border ${
            clampOscillations
              ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
              : "bg-amber-950/40 hover:bg-amber-900/40 text-amber-300 border-amber-900/50"
          }`}
          title="Toggla entre capar las ondas gigantes de Lagrange o verlas en escala real"
        >
          {clampOscillations ? (
            <>
              <Eye className="w-3.5 h-3.5" />
              <span>Ver oscilaciones extremas</span>
            </>
          ) : (
            <>
              <EyeOff className="w-3.5 h-3.5" />
              <span>Filtro de estabilidad (Zoom)</span>
            </>
          )}
        </button>
      </div>

      {/* Actual SVG Chart container */}
      <div id="price-simulation-chart" ref={containerRef} className="relative flex-grow min-h-[300px] w-full cursor-crosshair rounded-xl bg-slate-950/65 border border-slate-800/40">
        <svg
          width={dimensions.width}
          height={dimensions.height}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleChartClick}
          className="absolute inset-0 select-none overflow-visible"
        >
          {/* Subtle definitions */}
          <defs>
            <linearGradient id="splineGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(51, 65, 85, 0.04)" strokeWidth="0.5" />
            </pattern>
          </defs>

          {/* Background grid pattern */}
          <rect x={margin.left} y={margin.top} width={plotW} height={plotH} fill="url(#grid)" />

          {/* Draw Gridlines and Labels */}
          {/* Vertical Guides (Days) */}
          {xTicks.map((xVal) => {
            const sx = toScreenX(xVal);
            return (
              <g key={`x-grid-${xVal}`}>
                <line
                  x1={sx}
                  y1={margin.top}
                  x2={sx}
                  y2={dimensions.height - margin.bottom}
                  stroke="#1e293b"
                  strokeWidth="1"
                  strokeDasharray={xVal === 30 || xVal === 1 ? "" : "3,3"}
                />
                <text
                  x={sx}
                  y={dimensions.height - margin.bottom + 20}
                  textAnchor="middle"
                  className="text-[11px] font-mono fill-slate-400 font-medium"
                >
                  Día {xVal}
                </text>
              </g>
            );
          })}

          {/* Horizontal Guides (Price Bs) */}
          {yTicks.map((yVal, i) => {
            const sy = toScreenY(yVal);
            return (
              <g key={`y-grid-${yVal}-${i}`}>
                <line
                  x1={margin.left}
                  y1={sy}
                  x2={dimensions.width - margin.right}
                  stroke="#1e293b"
                  strokeWidth="1"
                  strokeDasharray="3,3"
                />
                <text
                  x={margin.left - 10}
                  y={sy + 4}
                  textAnchor="end"
                  className="text-[11px] font-mono fill-slate-400 font-medium"
                >
                  {yVal} Bs
                </text>
              </g>
            );
          })}

          {/* Visual Shadow Gradient under Cubic Spline (representing area under curve bounds) */}
          {showSpline && samples.length > 0 && (
            <path
              d={`${splinePathData} L ${toScreenX(xMax)} ${toScreenY(activeYMin)} L ${toScreenX(xMin)} ${toScreenY(activeYMin)} Z`}
              fill="url(#splineGlow)"
            />
          )}

          {/* Dynamic continuous interpolation curves */}
          {/* Lagrange Polynomial Curve (Blue dashed line with glow effects) */}
          {showLagrange && (
            <>
              <path
                d={lagrangePathData}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="4"
                strokeOpacity="0.15"
              />
              <path
                d={lagrangePathData}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                strokeDasharray="4,3"
              />
            </>
          )}

          {/* Newton Polynomial Curve (Magenta dashed line) */}
          {showNewton && (
            <>
              <path
                d={newtonPathData}
                fill="none"
                stroke="#ec4899"
                strokeWidth="4"
                strokeOpacity="0.1"
              />
              <path
                d={newtonPathData}
                fill="none"
                stroke="#ec4899"
                strokeWidth="1.5"
                strokeDasharray="2,2"
              />
            </>
          )}

          {/* Cubic Splines Curve (Solid emerald green line, smooth!) */}
          {showSpline && (
            <>
              <path
                d={splinePathData}
                fill="none"
                stroke="#10b981"
                strokeWidth="5"
                strokeOpacity="0.2"
              />
              <path
                d={splinePathData}
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
              />
            </>
          )}

          {/* Vertical scrubber line at CURRENT SELECTED DAY */}
          <line
            x1={toScreenX(selectedDay)}
            y1={margin.top}
            x2={toScreenX(selectedDay)}
            y2={dimensions.height - margin.bottom}
            stroke="#10b981"
            strokeWidth="1.5"
            strokeDasharray="4,4"
            opacity="0.8"
          />
          {/* Little badge showing current day on axis */}
          <rect
            x={toScreenX(selectedDay) - 24}
            y={margin.top - 20}
            width="48"
            height="16"
            rx="4"
            fill="#10b981"
          />
          <text
            x={toScreenX(selectedDay)}
            y={margin.top - 8}
            textAnchor="middle"
            className="text-[10px] font-mono font-bold fill-slate-950"
          >
            Día {selectedDay}
          </text>

          {/* Plotting Discrete Data Points (Knots) */}
          {points.map((p, idx) => {
            const sx = toScreenX(p.x);
            const sy = toScreenY(p.y);
            return (
              <g key={`point-${idx}`} className="group/dot cursor-pointer">
                {/* Glow ring */}
                <circle
                  cx={sx}
                  cy={sy}
                  r="8"
                  className="fill-emerald-400 opacity-0 group-hover/dot:opacity-20 transition-opacity"
                />
                {/* Main dot */}
                <circle
                  cx={sx}
                  cy={sy}
                  r="5"
                  className="fill-slate-950 stroke-emerald-400 stroke-[3.5] shadow-lg"
                />
                {/* Tiny value label above dot */}
                <text
                  x={sx}
                  y={sy - 10}
                  textAnchor="middle"
                  className="text-[10px] font-mono font-bold fill-slate-100 bg-slate-950/80 drop-shadow"
                >
                  {p.y} Bs
                </text>
              </g>
            );
          })}

          {/* Mouse Scrubber Position Visualizer */}
          {hoveredPoint && (
            <g>
              <line
                x1={hoveredPoint.screenX}
                y1={margin.top}
                x2={hoveredPoint.screenX}
                y2={dimensions.height - margin.bottom}
                stroke="rgba(148, 163, 184, 0.3)"
                strokeWidth="1"
              />
              <circle
                cx={hoveredPoint.screenX}
                cy={hoveredPoint.screenY}
                r="6"
                fill="#f1f5f9"
                stroke="#10b981"
                strokeWidth="3"
                className="animate-ping"
              />
            </g>
          )}
        </svg>

        {/* Floating Scrubber Values HUD Card */}
        {hoveredPoint && (
          <div
            className="absolute z-10 pointer-events-none p-3 bg-slate-950/95 border border-slate-800 rounded-xl shadow-2xl flex flex-col gap-1.5 max-w-[190px] text-xs font-mono"
            style={{
              left: Math.min(hoveredPoint.screenX + 15, dimensions.width - 200),
              top: Math.min(Math.max(10, hoveredPoint.screenY - 50), dimensions.height - 150),
            }}
          >
            <div className="text-emerald-400 border-b border-slate-800 pb-1 font-bold flex items-center justify-between">
              <span>Día {hoveredPoint.x}</span>
              <span className="text-[10px] text-slate-500 font-normal">Hacer click para fijar</span>
            </div>
            {showSpline && (
              <div className="flex justify-between gap-3 text-slate-200">
                <span>🍀 Splines:</span>
                <span className="font-bold text-emerald-400">{hoveredPoint.ySpline.toFixed(2)} Bs</span>
              </div>
            )}
            {showLagrange && (
              <div className="flex justify-between gap-3 text-slate-400">
                <span>🔷 Lagrange:</span>
                <span className="font-bold text-blue-400">
                  {hoveredPoint.yLagrange > 1000 ? "Explosión" : `${hoveredPoint.yLagrange.toFixed(2)} Bs`}
                </span>
              </div>
            )}
            {showNewton && (
              <div className="flex justify-between gap-3 text-slate-400">
                <span>🔺 Newton:</span>
                <span className="font-bold text-pink-400">
                  {hoveredPoint.yNewton > 1000 ? "Explosión" : `${hoveredPoint.yNewton.toFixed(2)} Bs`}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dynamic Lagrange Oscillation HUD explanation */}
      {!clampOscillations && (showLagrange || showNewton) && samples.some(s => s.lagrange < -5 || s.lagrange > maxInputY * 2.5) && (
        <div className="mt-3 bg-amber-950/30 border border-amber-900/50 p-2.5 rounded-xl flex items-center gap-2.5 text-xs text-amber-300">
          <Info className="w-5 h-5 flex-shrink-0 text-amber-400 animate-pulse" />
          <p>
            <strong>Efecto Runge Visible:</strong> La curva de Lagrange/Newton oscila violentamente hacia valores extremos e irreales porque intentamos forzar un polinomio de alto grado sobre puntos dispersos. Activa el <strong>Filtro de estabilidad</strong> arriba para hacer zoom sobre los datos reales.
          </p>
        </div>
      )}
    </div>
  );
}
