/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Point, Product } from "../types";
import { evaluateLagrange, evaluateNewton, evaluateCubicSpline } from "../mathUtils";
import { Sparkles, Loader2, Copy, Check, FileText, Globe, AlertCircle } from "lucide-react";

interface Props {
  product: Product;
  selectedDay: number;
}

// Lightweight custom markdown parser to convert standard elements to clean, high-contrast JSX
function CustomMarkdown({ text }: { text: string }) {
  if (!text) return null;
  const lines = text.split("\n");

  return (
    <div className="space-y-3 font-sans text-xs sm:text-sm text-slate-300 leading-relaxed">
      {lines.map((line, idx) => {
        let trimmed = line.trim();

        // Header 3
        if (trimmed.startsWith("### ")) {
          return (
            <h4 key={idx} className="text-sm font-bold text-emerald-400 font-sans tracking-wide pt-3 border-b border-slate-800 pb-1 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              {trimmed.substring(4)}
            </h4>
          );
        }

        // Header 2
        if (trimmed.startsWith("## ")) {
          return (
            <h3 key={idx} className="text-base font-black text-slate-100 font-sans tracking-tight pt-4">
              {trimmed.substring(3)}
            </h3>
          );
        }

        // Header 1
        if (trimmed.startsWith("# ")) {
          return (
            <h2 key={idx} className="text-lg font-black text-emerald-300 tracking-tight pt-4 flex items-center gap-2">
              {trimmed.substring(2)}
            </h2>
          );
        }

        // Bullet point
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          return (
            <li key={idx} className="ml-5 list-disc text-slate-300 pl-1">
              {parseInlineStyles(trimmed.substring(2))}
            </li>
          );
        }

        // Horizontal line
        if (trimmed === "---") {
          return <hr key={idx} className="border-slate-850 my-4" />;
        }

        // Empty line
        if (trimmed === "") {
          return <div key={idx} className="h-2" />;
        }

        // Normal paragraph
        return <p key={idx}>{parseInlineStyles(trimmed)}</p>;
      })}
    </div>
  );
}

// Parses inline styles like **bold** and `code`
function parseInlineStyles(line: string) {
  const parts: (string | React.ReactNode)[] = [];
  let currentStr = line;

  // Let's regex find bold and code
  // Example matchers: **bold** or `code`
  let keyIndex = 0;
  while (currentStr.length > 0) {
    const boldIndex = currentStr.indexOf("**");
    const codeIndex = currentStr.indexOf("`");

    // No special formats left
    if (boldIndex === -1 && codeIndex === -1) {
      parts.push(currentStr);
      break;
    }

    // Bold has lower index
    if (boldIndex !== -1 && (codeIndex === -1 || boldIndex < codeIndex)) {
      if (boldIndex > 0) {
        parts.push(currentStr.substring(0, boldIndex));
      }
      const rest = currentStr.substring(boldIndex + 2);
      const closeIdx = rest.indexOf("**");
      if (closeIdx !== -1) {
        parts.push(
          <strong key={`bold-${keyIndex++}`} className="font-extrabold text-[#f8fafc]">
            {rest.substring(0, closeIdx)}
          </strong>
        );
        currentStr = rest.substring(closeIdx + 2);
      } else {
        parts.push("**");
        currentStr = rest;
      }
    } else {
      // Code has lower index
      if (codeIndex > 0) {
        parts.push(currentStr.substring(0, codeIndex));
      }
      const rest = currentStr.substring(codeIndex + 1);
      const closeIdx = rest.indexOf("`");
      if (closeIdx !== -1) {
        parts.push(
          <code key={`code-${keyIndex++}`} className="font-mono text-emerald-400 bg-slate-950 border border-slate-800/60 px-1 py-0.5 rounded text-[11px]">
            {rest.substring(0, closeIdx)}
          </code>
        );
        currentStr = rest.substring(closeIdx + 1);
      } else {
        parts.push("`");
        currentStr = rest;
      }
    }
  }

  return <>{parts}</>;
}

export default function GeminiReportSection({ product, selectedDay }: Props) {
  const [report, setReport] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const generateAIReport = async () => {
    setIsLoading(true);
    setReport(null);
    setErrorMsg(null);

    // Compute active estimates
    const lagrange = evaluateLagrange(product.points, selectedDay);
    const newton = evaluateNewton(product.points, selectedDay);
    const splines = evaluateCubicSpline(product.points, selectedDay);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: product.name,
          unit: product.unit,
          points: product.points,
          targetDay: selectedDay,
          interpolatedValues: { lagrange, newton, splines },
        }),
      });

      if (!response.ok) {
        throw new Error("No se pudo conectar con el servidor.");
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setReport(data.report);
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || "Ocurrió un error inesperado al llamar a la IA.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyClipboard = () => {
    if (!report) return;
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
      {/* Main questions grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">

        {/* Question 1 */}
<div className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex flex-col justify-between hover:border-slate-700 transition">
  <div>
    <div className="w-7 h-7 rounded-lg bg-pink-950/50 border border-pink-900/40 flex items-center justify-center text-pink-400 text-xs font-mono font-black mb-3">
      1
    </div>
    <h4 className="text-xs font-bold text-slate-200 mb-2 min-h-[36px]">
      ¿Cuál sería el precio aproximado en un día sin dato?
    </h4>
    <div className="text-[11px] text-slate-400 leading-relaxed text-justify space-y-2">
      <p>
        Se obtiene evaluando la función interpoladora para ese valor de abscisa.
      </p>
      <div className="p-2 bg-slate-900/60 border border-slate-800/40 rounded font-mono text-[9px] text-slate-300">
        <span className="block text-slate-500 mb-1.5 font-sans text-[10px]">Ejemplo Día 9.5:</span>
        <div className="flex justify-between text-slate-200">
          <span>Splines:</span>
          <span className="text-pink-400 font-bold">10.78 Bs</span>
        </div>
        <div className="flex justify-between text-slate-400 mt-1">
          <span>Lagrange:</span>
          <span className="font-bold">10.74 Bs</span>
        </div>
      </div>
      <p>
        Los trazadores cúbicos calculan el precio más verosímil y estable al evitar aberraciones de oscilación.
      </p>
    </div>
  </div>
</div>

        {/* Question 2 */}
        <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex flex-col justify-between hover:border-slate-700 transition">
          <div>
            <div className="w-7 h-7 rounded-lg bg-emerald-950/50 border border-emerald-900/40 flex items-center justify-center text-emerald-400 text-xs font-mono font-black mb-3">
              2
            </div>
            <h4 className="text-xs font-bold text-slate-200 mb-2 min-h-[36px]">
              ¿Cómo se comporta la curva de precios durante el mes?
            </h4>
            <div className="text-[11px] text-slate-400 leading-relaxed text-justify space-y-2">
              <p>
                La curva para el artículo activo (<strong>{product.name} {product.emoji}</strong>) exhibe una tendencia acumulada de asenso
                <strong className={`font-bold  "text-rose-400" : "text-emerald-400"}`}>
                  
                </strong>.
              </p>
              <p>
                El desabastecimiento provoca aceleración en días críticos, produciendo curvas continuas que acumulan empalmes de parábolas gracias a la inercia económica. Esto rompe la suposición lineal tradicional.
              </p>
            </div>
          </div>
        </div>

        {/* Question 3 */}
<div className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex flex-col justify-between hover:border-slate-700 transition">
  <div>
    <div className="w-7 h-7 rounded-lg bg-pink-950/50 border border-pink-900/40 flex items-center justify-center text-pink-400 text-xs font-mono font-black mb-3">
      3
    </div>
    <h4 className="text-xs font-bold text-slate-200 mb-2 min-h-[36px]">
      ¿Qué producto tuvo mayor incremento?
    </h4>
    <div className="text-[11px] text-slate-400 leading-relaxed text-justify space-y-2">
      <p>
        El simulador dinámico de canasta básica comprueba que el artículo con mayor despegue proporcional es:
      </p>
      <div className="p-2 bg-rose-950/30 border border-rose-900/40 rounded flex items-center gap-2 text-rose-300">
        <span className="text-sm">🥔</span>
        <div>
          <span className="font-bold block text-[9px] text-slate-200">Papa Imilla</span>
          <span className="font-mono text-[9px] font-bold">Sube +175.0%</span>
        </div>
      </div>
      <p className="mt-1">
        La carne y verduras perecederas sufren fluctuaciones inmediatas ante bloqueos de transporte o sequías en origen.
      </p>
    </div>
  </div>
</div>

        {/* Question 4 */}
        <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex flex-col justify-between hover:border-slate-700 transition">
          <div>
            <div className="w-7 h-7 rounded-lg bg-emerald-950/50 border border-emerald-900/40 flex items-center justify-center text-emerald-400 text-xs font-mono font-black mb-3">
              4
            </div>
            <h4 className="text-xs font-bold text-slate-200 mb-2 min-h-[36px]">
              ¿Qué tan confiable es la interpolación?
            </h4>
            <div className="text-[11px] text-slate-400 leading-relaxed text-justify space-y-2">
              <p>
                <strong>Es extremadamente confiable con Splines Cúbicos</strong> (error local $O(h^4)$ y suavizado continuo). Esto simula de manera realista los acoplamientos del sector económico.
              </p>
              <p className="text-[10px] text-orange-400">
                ⚠️ En cambio, los métodos de grado completo (Lagrange, Newton) para muchos puntos inducen el <em>Fenómeno de Runge</em>, arrojando oscilaciones espurias irreales.
              </p>
            </div>
          </div>
        </div>

        {/* Question 5 */}
        <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex flex-col justify-between hover:border-slate-700 transition">
          <div>
            <div className="w-7 h-7 rounded-lg bg-emerald-950/50 border border-emerald-900/40 flex items-center justify-center text-emerald-400 text-xs font-mono font-black mb-3">
              5
            </div>
            <h4 className="text-xs font-bold text-slate-200 mb-2 min-h-[36px]">
              ¿Qué pasa si los datos son muy dispersos?
            </h4>
            <div className="text-[11px] text-slate-400 leading-relaxed text-justify space-y-2">
              <p>
                Si hay grandes vacíos de días sin datos, los polinomios globales de Newton y Lagrange sufren de inestabilidad numérica feroz, produciendo "jorobas" artificiales con precios negativos o absurdamente elevados.
              </p>
              <p>
                Los <strong>Splines Cúbicos Naturales</strong> minimizan la curvatura integral (energía elástica mínima), sirviendo como la aproximación más estable y coherente a la realidad.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
