/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { Point, Product } from "./types";
import { Sparkles, Brain, Scale, ShieldCheck, Database, FileSpreadsheet, Play, GitBranch, ArrowRight, BookOpen, Calculator, LineChart, Landmark, AlertTriangle, Users, Target } from "lucide-react";
import FoodMarketSimulatorChart from "./components/FoodMarketSimulatorChart";
import DataPointsTable from "./components/DataPointsTable";
import PricePredictionCalculator from "./components/PricePredictionCalculator";
import StepByStepNewtonTable from "./components/StepByStepNewtonTable";
import NumericalMethodsProcedures from "./components/NumericalMethodsProcedures";
import GeminiReportSection from "./components/GeminiReportSection";
import SurgeOverviewDashboard from "./components/SurgeOverviewDashboard";
import AccumulatedCostIntegrationTab from "./components/AccumulatedCostIntegrationTab";

import EscenarioE_RaicesTab from "./components/EscenarioE";
import EscenarioF_SistemasTab from "./components/EscenarioF";
import EscenarioG_EDOTab from "./components/EscenarioG";

// Default suggestions in Bolivian markets (Escenario C)
const DEFAULT_PRODUCTS: Product[] = [
  {
    id: "papa",
    name: "Papa Imilla",
    emoji: "🥔",
    unit: "Arroba",
    description: "Alimento básico de la canasta familiar boliviana. Registra alta volatilidad según bloqueos.",
    points: [
      { x: 1, y: 8.0 },
      { x: 5, y: 10.0 },
      { x: 10, y: 13.0 },
      { x: 15, y: 16.0 },
      { x: 20, y: 19.0 },
      { x: 30, y: 22.0 },
    ],
  },
  {
    id: "pollo",
    name: "Pollo Fresco",
    emoji: "🍗",
    unit: "Kilo",
    description: "Muy sensible a la escasez de granos y bloqueos en las rutas de transporte nacionales.",
    points: [
      { x: 1, y: 15.0 },
      { x: 5, y: 17.0 },
      { x: 11, y: 24.0 },
      { x: 16, y: 22.0 },
      { x: 22, y: 18.0 },
      { x: 30, y: 25.0 },
    ],
  },
  {
    id: "aceite",
    name: "Aceite Vegetal",
    emoji: "🛢️",
    unit: "Litro",
    description: "Sujeto a mayor especulación por incremento del dólar y pérdida de poder adquisitivo diario.",
    points: [
      { x: 1, y: 12.0 },
      { x: 6, y: 15.0 },
      { x: 12, y: 18.0 },
      { x: 18, y: 24.0 },
      { x: 24, y: 28.0 },
      { x: 30, y: 32.0 },
    ],
  },
  {
    id: "arroz",
    name: "Arroz Grano de Oro",
    emoji: "🌾",
    unit: "Kila",
    description: "Alimento seco no perecedero con demanda acumulativa y rumores recurrentes de escasez.",
    points: [
      { x: 1, y: 7.0 },
      { x: 4, y: 9.0 },
      { x: 10, y: 11.0 },
      { x: 15, y: 14.0 },
      { x: 20, y: 15.0 },
      { x: 30, y: 18.0 },
    ],
  },
];

export default function App() {
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [selectedDay, setSelectedDay] = useState<number>(12.5); // Default is a day without points!
  // Modifica el tipo permitido en el useState para incluir las letras 'escenarioE', 'escenarioF' y 'escenarioG'
const [activeTab, setActiveTab] = useState<"escenarioC" | "escenarioD" | "escenarioE" | "escenarioF" | "escenarioG">("escenarioC");

  // Active interpolation curves visibility toggles
  const [showLagrange, setShowLagrange] = useState<boolean>(true);
  const [showNewton, setShowNewton] = useState<boolean>(true);
  const [showSpline, setShowSpline] = useState<boolean>(true);
  const [clampOscillations, setClampOscillations] = useState<boolean>(true);

  const activeProduct = products[activeIdx];

  const handlePointsChange = (updatedPoints: Point[]) => {
    const updatedProducts = products.map((p, idx) =>
      idx === activeIdx ? { ...p, points: updatedPoints } : p
    );
    setProducts(updatedProducts);
  };

  const handleResetProduct = () => {
    const original = DEFAULT_PRODUCTS[activeIdx];
    const updatedProducts = products.map((p, idx) =>
      idx === activeIdx ? { ...p, points: [...original.points] } : p
    );
    setProducts(updatedProducts);
  };

  // Stress tests simulator (inject random, highly noisy points to trigger Runge's Phenomenon)
  const handleSimulateStress = () => {
    // Highly dispersed values to demonstrate Runge's phenomenon
    const noisyPoints: Point[] = [
      { x: 1, y: 8.0 },
      { x: 3, y: 29.0 },   // Spike
      { x: 8, y: 4.0 },    // Crash
      { x: 14, y: 32.0 },  // Spike
      { x: 20, y: 10.0 },  // Crash
      { x: 26, y: 35.0 },  // Spike
      { x: 30, y: 12.0 },
    ];
    const updatedProducts = products.map((p, idx) =>
      idx === activeIdx ? { ...p, points: noisyPoints } : p
    );
    setProducts(updatedProducts);
    setClampOscillations(false); // Disable clamp so oscillations are instantly visible on chart!
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-900 border-t-4 border-emerald-500">
      
      {/* Upper Navigation & Academic Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur sticky top-0 z-40 px-4 sm:px-8 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500 fill-slate-950 text-slate-950 p-2.5 rounded-xl border border-emerald-400">
            <Brain className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <span className="text-[10px] font-mono tracking-widest text-emerald-400 font-black uppercase flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              SISTEMA DE ANALÍTICA NUMÉRICA
            </span>
            <h1 className="text-xl font-black font-sans text-slate-100 tracking-tight mt-0.5 uppercase">
              Escenarios C y D: Desafío Final de Métodos Numéricos
            </h1>
          </div>
        </div>

        {/* Informative Academic Badges */}
        <div className="flex flex-wrap gap-2 text-xs font-mono">
          <span className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-300 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            C: Lagrange, Newton y Splines
          </span>
          <span className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-300 flex items-center gap-1.5">
            <Calculator className="w-3.5 h-3.5 text-pink-400" />
            D: Trapecio, Simpson 1/3 y 3/8
          </span>
          <span className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-300 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            Canasta Básica Boliviana
          </span>
        </div>
      </header>

      {/* Main Container Layout */}
      <main className="flex-grow p-4 sm:p-8 flex flex-col gap-6 max-w-7xl w-full mx-auto">
        
        {/* Context and Instructions Alert banner */}
        <section className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Scale className="w-48 h-48 text-emerald-400" />
          </div>
          <div className="flex items-start gap-3.5 relative z-10">
            <div className="bg-emerald-950/60 p-2 rounded-xl border border-emerald-900/40 shrink-0">
              <span className="text-emerald-400 text-lg font-bold">📖</span>
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                Simulación Científica para la Toma de Decisiones Estratégicas
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Este simulador permite desmenuzar matemáticamente la fluctuación económica de mercados reales en Bolivia con datos dispersos. Contrasta interactiva de la estabilidad de los métodos numéricos clásicos (Lagrange, Newton, Splines en el Escenario C), y calcula el impacto total de pérdidas del bolsillo familiar (Trapecio, Simpson 1/3 y Simpson 3/8 en el Escenario D) determinando la pérdida real de poder adquisitivo.
              </p>
            </div>
          </div>
        </section>

        {/* Tab selection bar */}
        <div className="flex border-b border-slate-950 gap-2 overflow-x-auto pb-px">
          <button
            onClick={() => setActiveTab("escenarioC")}
            className={`pb-3 px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition select-none cursor-pointer whitespace-nowrap ${
              activeTab === "escenarioC"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <LineChart className="w-4 h-4" />
            <span>Escenario C: Interpolación de Precios Dispersos</span>
          </button>
          <button
            onClick={() => setActiveTab("escenarioD")}
            className={`pb-3 px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition select-none cursor-pointer whitespace-nowrap ${
              activeTab === "escenarioD"
                ? "border-pink-500 text-pink-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Landmark className="w-4 h-4" />
            <span>Escenario D: Costo Acumulado e Integración</span>
          </button>
          <button
    onClick={() => setActiveTab("escenarioE")}
    className={`pb-3 px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition select-none cursor-pointer whitespace-nowrap ${
      activeTab === "escenarioE"
        ? "border-red-500 text-red-400"
        : "border-transparent text-slate-400 hover:text-slate-200"
    }`}
  >
    <Target className="w-4 h-4" />
    <span>Escenario E: Umbrales Críticos (Raíces)</span>
  </button>

  {/* NUEVO: Botón Escenario F */}
  <button
    onClick={() => setActiveTab("escenarioF")}
    className={`pb-3 px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition select-none cursor-pointer whitespace-nowrap ${
      activeTab === "escenarioF"
        ? "border-orange-500 text-orange-400"
        : "border-transparent text-slate-400 hover:text-slate-200"
    }`}
  >
    <AlertTriangle className="w-4 h-4" />
    <span>Escenario F: Rumores (Mal Condicionado)</span>
  </button>

  {/* NUEVO: Botón Escenario G */}
  <button
    onClick={() => setActiveTab("escenarioG")}
    className={`pb-3 px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition select-none cursor-pointer whitespace-nowrap ${
      activeTab === "escenarioG"
        ? "border-cyan-500 text-cyan-400"
        : "border-transparent text-slate-400 hover:text-slate-200"
    }`}
  >
    <Users className="w-4 h-4" />
    <span>Escenario G: Dinámica Social (EDO)</span>
  </button>
        </div>

        {/* Section 1: Dashboard for overall surge comparisons */}
        <section>
          <SurgeOverviewDashboard
            products={products}
            activeProductIndex={activeIdx}
            setActiveProductIndex={setActiveIdx}
            onInjectNoise={handleSimulateStress}
          />
        </section>

        {/* RENDERIZADO CONDICIONAL DE LOS ESCENARIOS (Reemplazo del operador ternario) */}
        <div className="w-full">
          {(() => {
            switch (activeTab) {
              case "escenarioC":
                return (
                  <>
                    {/* Section 2: Chart Visualizer & Control Sidebar */}
                    <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                      
                      {/* SVG Plotting Engine Widget (Large Grid block) */}
                      <div className="lg:col-span-8 flex flex-col h-full">
                        <FoodMarketSimulatorChart
                          product={activeProduct}
                          selectedDay={selectedDay}
                          setSelectedDay={setSelectedDay}
                          showLagrange={showLagrange}
                          showNewton={showNewton}
                          showSpline={showSpline}
                          clampOscillations={clampOscillations}
                          setClampOscillations={setClampOscillations}
                        />
                      </div>

                      {/* Side Control Centre (Calculator, parameters, points editor) */}
                      <div className="lg:col-span-4 flex flex-col gap-6">
                        
                        {/* Realtime numerical toggles HUD */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                          <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase block mb-3">
                            🎛️ Capas y Funciones de Métodos
                          </span>
                          <div className="flex flex-col gap-2">
                            {/* Cubic Splines Toggle */}
                            <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl bg-slate-950/50 hover:bg-slate-950 border border-slate-800/40 transition">
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                                <span className="text-xs font-bold text-slate-200">Splines Cúbicos</span>
                              </div>
                              <input
                                type="checkbox"
                                checked={showSpline}
                                onChange={(e) => setShowSpline(e.target.checked)}
                                className="w-4 h-4 rounded text-emerald-500 accent-emerald-500 cursor-pointer"
                              />
                            </label>

                            {/* Lagrange Toggle */}
                            <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl bg-slate-950/50 hover:bg-slate-950 border border-slate-800/40 transition">
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                                <span className="text-xs font-bold text-slate-200">Polinomio de Lagrange</span>
                              </div>
                              <input
                                type="checkbox"
                                checked={showLagrange}
                                onChange={(e) => setShowLagrange(e.target.checked)}
                                className="w-4 h-4 rounded text-blue-500 accent-blue-500 cursor-pointer"
                              />
                            </label>

                            {/* Newton Toggle */}
                            <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl bg-slate-950/50 hover:bg-slate-950 border border-slate-800/40 transition">
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-pink-500"></span>
                                <span className="text-xs font-bold text-slate-200">Diferencias de Newton</span>
                              </div>
                              <input
                                type="checkbox"
                                checked={showNewton}
                                onChange={(e) => setShowNewton(e.target.checked)}
                                className="w-4 h-4 rounded text-pink-500 accent-pink-500 cursor-pointer"
                              />
                            </label>
                          </div>
                        </div>

                        {/* Price Prediction Calculator */}
                        <div className="flex-grow">
                          <PricePredictionCalculator
                            points={activeProduct.points}
                            selectedDay={selectedDay}
                            setSelectedDay={setSelectedDay}
                            unit={activeProduct.unit}
                          />
                        </div>
                      </div>
                    </section>

                    {/* Section 3: Points Editor (Inline) & Step-by-Step Mathematical Procedures */}
                    <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start mt-6">
                      <DataPointsTable
                        product={activeProduct}
                        onPointsChange={handlePointsChange}
                        onReset={handleResetProduct}
                      />
                      <NumericalMethodsProcedures points={activeProduct.points} selectedDay={selectedDay} />
                    </section>

                    {/* Section 4: Secure server-side Gemini Analytical socioeconomic summary report */}
                    <section className="mb-8 mt-6">
                      <GeminiReportSection product={activeProduct} selectedDay={selectedDay} />
                    </section>
                  </>
                );

              case "escenarioD":
                return (
                  <>
                    {/* Escenario D Active Layout */}
                    <section className="space-y-6 animate-fade-in">
                      <AccumulatedCostIntegrationTab
                        product={activeProduct}
                        products={products}
                      />
                    </section>

                    {/* Let user edit data points in real-time and see immediate impact on integration */}
                    <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start mt-6">
                      <DataPointsTable
                        product={activeProduct}
                        onPointsChange={handlePointsChange}
                        onReset={handleResetProduct}
                      />
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                        <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                          📖 Guía y Teoría Económica del Escenario D
                        </h3>
                        <p className="text-xs text-slate-400 leading-relaxed text-justify">
                          El desabastecimiento de alimentos no solo eleva los precios momentáneamente, sino que drena los ahorros familiares de forma continua. La integral definida $$\int_{1}^{30} P(x) \, dx$$ mide precisamente ese efecto acumulativo a lo largo de un ciclo mensual de 29 días de adquisición diaria activa.
                        </p>
                        <div className="p-3 bg-slate-950 rounded-xl space-y-2.5 text-xs font-mono">
                          <span className="font-bold text-emerald-400 block uppercase tracking-wide">💡 Análisis del Impacto Adquisitivo:</span>
                          <ul className="space-y-2 text-[11px] text-slate-300">
                            <li className="flex gap-1.5 items-start">
                              <span className="text-emerald-500 font-bold">1.</span>
                              <span><strong>Gasto Real:</strong> Refleja el monto acumulado del consumo dinámico. En el mundo real, los trapecios o curvas parabólicas describen mejor esta transición continua.</span>
                            </li>
                            <li className="flex gap-1.5 items-start">
                              <span className="text-emerald-500 font-bold">2.</span>
                              <span><strong>Escenario Teórico:</strong> Representa un hipotético mercado con precios estables fijos en el Día 1.</span>
                            </li>
                            <li className="flex gap-1.5 items-start">
                              <span className="text-emerald-500 font-bold">3.</span>
                              <span><strong>Pérdida de Poder Adquisitivo:</strong> Es la brecha monetaria obligada que drena el presupuesto de subsistencia de las familias bolivianas.</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </section>
                  </>
                );

              case "escenarioE":
                return <EscenarioE_RaicesTab />;

              case "escenarioF":
                return <EscenarioF_SistemasTab />;

              case "escenarioG":
                return <EscenarioG_EDOTab />;

              default:
                return null;
            }
          })()}
        </div>

      </main>

      {/* Interactive Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 p-6 text-center text-xs text-slate-500 font-mono">
        <div>
          © 2026 Plataforma de Simulación del Desafío Escenario C • Proyecto de Métodos Numéricos.
        </div>
        <div className="mt-1.5 flex justify-center items-center gap-2 text-[10px] text-emerald-500/80">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Modelo de análisis matemáticamente determinista y libre de posicionamiento político.</span>
        </div>
      </footer>
    </div>
  );
}
