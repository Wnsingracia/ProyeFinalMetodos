import React, { useState } from 'react';
import { resolverGaussSeidel, IteracionGS } from '../mathUtils';

export const EscenarioA: React.FC = () => {
  const [solucion, setSolucion] = useState<number[]>([]);
  const [iteraciones, setIteraciones] = useState<IteracionGS[]>([]);

  const calcular = () => {
    // Ejemplo: 3 Zonas, 3 Plantas (Matriz diagonalmente dominante)
    const A = [
      [5, 1, 1],
      [1, 4, 1],
      [2, 1, 5]
    ];
    const B = [10, 12, 14]; // Demandas
    const x0 = [0, 0, 0];

    const resultado = resolverGaussSeidel(A, B, x0);
    setSolucion(resultado.solucion);
    setIteraciones(resultado.iteraciones);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">Escenario A: Abastecimiento (Gauss-Seidel)</h2>
      <button onClick={calcular} className="bg-blue-500 text-white px-4 py-2 mt-2 rounded">
        Calcular Distribución
      </button>

      {solucion.length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold">Solución Final:</h3>
          <p>Zona Norte: {solucion[0].toFixed(2)}</p>
          <p>Zona Centro: {solucion[1].toFixed(2)}</p>
          <p>Zona Sur: {solucion[2].toFixed(2)}</p>
        </div>
      )}
    </div>
  );
};
export default EscenarioA;
