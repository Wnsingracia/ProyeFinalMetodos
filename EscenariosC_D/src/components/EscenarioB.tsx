import React, { useState } from 'react';
import { simularReserva, RegistroReserva } from '../mathUtils';

export const EscenarioB: React.FC = () => {
  const [datos, setDatos] = useState<RegistroReserva[]>([]);
  const [reservaInicial, setReservaInicial] = useState(1000);
  const [consumo, setConsumo] = useState(150);
  const [entrada, setEntrada] = useState(50);

  const calcular = () => {
    const resultado = simularReserva(reservaInicial, entrada, consumo, 30, "rk4");
    setDatos(resultado);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">Escenario B: Vaciado de Reservas (RK4)</h2>
      
      <div className="flex gap-2 my-2">
        <input type="number" value={reservaInicial} onChange={e => setReservaInicial(Number(e.target.value))} placeholder="Reserva Inicial" className="border p-1" />
        <input type="number" value={entrada} onChange={e => setEntrada(Number(e.target.value))} placeholder="Entrada Diaria" className="border p-1" />
        <input type="number" value={consumo} onChange={e => setConsumo(Number(e.target.value))} placeholder="Consumo Diario" className="border p-1" />
      </div>

      <button onClick={calcular} className="bg-red-500 text-white px-4 py-2 rounded">
        Simular Vaciado
      </button>

      {datos.length > 0 && (
        <table className="mt-4 border-collapse border border-gray-400 w-full">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">Día</th>
              <th className="border p-2">Reserva Disponible</th>
            </tr>
          </thead>
          <tbody>
            {datos.map((d, i) => (
              <tr key={i} className={d.reserva === 0 ? "bg-red-100" : ""}>
                <td className="border p-2 text-center">{d.dia}</td>
                <td className="border p-2 text-center">{d.reserva.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
export default EscenarioB;
