/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Point, Product } from "../types";
import { Plus, Trash2, RotateCcw, AlertTriangle, Calendar, DollarSign, HelpCircle } from "lucide-react";

interface Props {
  product: Product;
  onPointsChange: (updatedPoints: Point[]) => void;
  onReset: () => void;
}

export default function DataPointsTable({ product, onPointsChange, onReset }: Props) {
  const [newX, setNewX] = useState<string>("");
  const [newY, setNewY] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const sortedPoints = [...product.points].sort((a, b) => a.x - b.x);

  const handleAddPoint = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const xVal = parseInt(newX);
    const yVal = parseFloat(newY);

    if (isNaN(xVal) || isNaN(yVal)) {
      setErrorMsg("Por favor complete ambos campos con números válidos.");
      return;
    }

    if (xVal < 1 || xVal > 30) {
      setErrorMsg("El día debe estar entre el rango usual de 1 de 30.");
      return;
    }

    if (yVal <= 0) {
      setErrorMsg("El precio del alimento debe ser mayor que 0 Bs.");
      return;
    }

    // Check duplicate days
    if (product.points.some((p) => p.x === xVal)) {
      setErrorMsg(`Ya existe un precio registrado para el día ${xVal}. Modifícalo de la tabla o bórralo.`);
      return;
    }

    const updated = [...product.points, { x: xVal, y: yVal }];
    onPointsChange(updated);
    setNewX("");
    setNewY("");
  };

  const handleDeletePoint = (xVal: number) => {
    if (product.points.length <= 3) {
      setErrorMsg("Se requieren mínimo 3 puntos de muestreo para calcular Trazadores Cúbicos y diferencias divididas.");
      return;
    }
    const updated = product.points.filter((p) => p.x !== xVal);
    onPointsChange(updated);
    setErrorMsg(null);
  };

  const handleInlineEdit = (xVal: number, newYStr: string) => {
    const val = parseFloat(newYStr);
    if (!isNaN(val) && val > 0) {
      const updated = product.points.map((p) => (p.x === xVal ? { ...p, y: val } : p));
      onPointsChange(updated);
      setErrorMsg(null);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            📊 Datos Registrados para {product.name}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Días de muestreo y coste real en bolivianos ({product.unit}).
          </p>
        </div>

        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 hover:bg-emerald-900/40 px-2.5 py-1.5 rounded-lg font-medium transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restablecer sugeridos</span>
        </button>
      </div>

      {errorMsg && (
        <div className="mb-4 bg-rose-950/40 border border-rose-900/50 py-2 px-3 rounded-lg flex items-center gap-2.5 text-xs text-rose-300">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Grid of registered points */}
      <div className="max-h-[240px] overflow-y-auto mb-4 border border-slate-800/80 rounded-xl bg-slate-950/40">
        <table className="w-full text-left border-collapse text-xs font-mono">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px]">
              <th className="py-2.5 px-4 font-semibold">Día (Mes)</th>
              <th className="py-2.5 px-4 font-semibold">Precio de Mercado</th>
              <th className="py-2.5 px-4 text-center font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {sortedPoints.map((p) => (
              <tr key={p.x} className="border-b border-slate-800/60 hover:bg-slate-900/50 transition">
                <td className="py-2 px-4 text-slate-200 font-bold">Día {p.x}</td>
                <td className="py-2 px-4">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="0.1"
                      value={p.y}
                      onChange={(e) => handleInlineEdit(p.x, e.target.value)}
                      className="w-20 bg-slate-800 text-emerald-400 px-2 py-1 rounded border border-slate-700/80 text-right font-bold focus:outline-none focus:border-emerald-500"
                    />
                    <span className="text-slate-400">Bs</span>
                  </div>
                </td>
                <td className="py-px px-4 text-center">
                  <button
                    onClick={() => handleDeletePoint(p.x)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded transition"
                    title="Eliminar punto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Form to insert new points */}
      <form onSubmit={handleAddPoint} className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
        <span className="text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase block mb-2">
          ➕ Agregar o Actualizar Día Individual
        </span>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg px-2 py-1">
            <Calendar className="w-3.5 h-3.5 text-slate-500 mr-2" />
            <input
              type="number"
              min="1"
              max="30"
              placeholder="Día (1-30)"
              value={newX}
              onChange={(e) => setNewX(e.target.value)}
              className="w-full bg-transparent text-slate-100 text-xs focus:outline-none focus:ring-0"
            />
          </div>
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg px-2 py-1">
            <DollarSign className="w-3.5 h-3.5 text-slate-500 mr-1" />
            <input
              type="number"
              step="0.1"
              min="0.1"
              placeholder="Precio Bs"
              value={newY}
              onChange={(e) => setNewY(e.target.value)}
              className="w-full bg-transparent text-emerald-400 font-semibold text-xs focus:outline-none focus:ring-0"
            />
          </div>
        </div>
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold text-xs py-2 rounded-lg transition shadow-md"
        >
          <Plus className="w-4 h-4 text-slate-950 stroke-[3]" />
          <span>Insertar Punto de Muestreo</span>
        </button>
      </form>
    </div>
  );
}
