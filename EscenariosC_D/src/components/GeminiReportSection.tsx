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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            Informe Analítico Socioeconómico e Interpolación
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Genera un diagnóstico académico y científico del desabastecimiento usando IA.
          </p>
        </div>

        {report && (
          <button
            onClick={handleCopyClipboard}
            className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg font-medium transition select-none"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copiar informe</span>
              </>
            )}
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="mb-4 bg-rose-950/40 border border-rose-900/50 p-3 rounded-xl flex items-start gap-3 text-rose-300 text-xs">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
          <div>
            <span className="font-bold block">Error al generar informe</span>
            <span>{errorMsg}</span>
          </div>
        </div>
      )}

      {/* Report Container */}
      {!report && !isLoading ? (
        <div className="border border-dashed border-slate-800 rounded-xl p-8 text-center flex flex-col items-center justify-center bg-slate-950/20">
          <Globe className="w-12 h-12 text-slate-600 mb-3" />
          <h4 className="text-sm font-semibold text-slate-400 mb-2">¿Listo para un análisis riguroso de Métodos Numéricos?</h4>
          <p className="text-xs text-slate-500 max-w-md mb-5 leading-relaxed">
            Haciendo click en el botón de abajo, analizaremos tus datos e interpolaciones del producto <strong>{product.name}</strong> para generar un dictamen profundo, seguro y despartidizado.
          </p>
          <button
            onClick={generateAIReport}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs px-6 py-2.5 rounded-xl transition shadow-lg shrink-0"
          >
            <Sparkles className="w-4 h-4 fill-slate-950" />
            <span>Generar Reporte Científico</span>
          </button>
        </div>
      ) : isLoading ? (
        <div className="border border-slate-800 rounded-xl p-12 text-center flex flex-col items-center justify-center bg-slate-950/45">
          <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mb-4" />
          <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest animate-pulse">
            Ejecutando modelo gemini-3.5-flash...
          </span>
          <p className="text-[11px] text-slate-500 mt-2 max-w-sm">
            Escribiendo informe de interpolación trilateral • Redactando diagnóstico de precios bolivianos • Analizando estabilidad de trazadores...
          </p>
        </div>
      ) : (
        <div className="border border-slate-800/80 rounded-xl p-5 bg-slate-950/60 max-h-[460px] overflow-y-auto">
          {report && <CustomMarkdown text={report} />}
          
          <div className="border-t border-slate-800 mt-5 pt-4 text-[10px] text-slate-500 font-mono text-center">
            Este reporte fue estructurado mediante el modelado de Lagrange, Newton, y Splines y ampliado mediante IA. No incurre en sesgos políticos individuales.
          </div>
        </div>
      )}
    </div>
  );
}
