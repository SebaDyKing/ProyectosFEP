import React, { useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Activity, Clock, Server, Monitor, ArrowRight, Wallet, CheckCircle2, AlertCircle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Interfaces
interface SimulationResult {
  TiempoEsperaMinutos: number;
}

interface SimulationState {
  currentWait: number;
  projectedWait: number | null;
  loading: boolean;
  error: string | null;
}

const App: React.FC = () => {
  // Inputs
  const [totems, setTotems] = useState<number>(2);
  const [cajeras, setCajeras] = useState<number>(2);
  const [hour, setHour] = useState<number>(13.0);
  const [amount, setAmount] = useState<number>(3500);

  // State
  const [simulation, setSimulation] = useState<SimulationState>({
    currentWait: 25.4, // Baseline hardcoded as per requirement (High/Red)
    projectedWait: null,
    loading: false,
    error: null
  });

  // Calculate Logic
  const isPeakHour = hour >= 11.5 && hour <= 14.5;

  const handleSimulate = async () => {
    setSimulation(prev => ({ ...prev, loading: true, error: null }));

    // Logic: User requested to ALWAYS simulate with Edenred active.
    // So Canal is always 1 (Totem/Edenred).
    const canal = 1;

    // Additional Totems: The slider says "Nuevos a instalar" or "Total"?
    // Let's assume Total to be consistent with the backend model which takes absolute numbers.
    // If user says "Install 2 new", and base is 0, total is 2.
    // Let's treat the slider as "Total Totems Operativos".

    const payload = {
      Hora_Decimal: hour,
      EnHoraPunta_Num: isPeakHour ? 1 : 0,
      Cantidad_Cajeras: cajeras,
      Cantidad_Totems: totems,
      Canal_Num: canal,
      MontoCLP: amount
    };

    console.log("🚀 Enviando datos al Backend:", payload);

    try {
      // Use Env Variable or fallback to localhost
      const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
      const response = await axios.post(`${apiUrl}/simular`, payload);

      console.log("✅ Respuesta recibida del Backend:", response.data);

      // FIX: The backend seems to be returning the float directly or a different structure.
      // Based on logs: "Respuesta recibida del Backend: 20.46" -> It's a direct number.
      // Or if it's { TiempoEsperaMinutos: 20.46 } but the logged line says just "20.46".
      // Let's handle both cases safely.

      const tiempo = typeof response.data === 'object' && response.data.TiempoEsperaMinutos
        ? response.data.TiempoEsperaMinutos
        : response.data;

      console.log("⏱️ TIEMPO DE ESPERA PREDICHO (Corregido):", tiempo, "minutos");

      setSimulation(prev => ({
        ...prev,
        projectedWait: Number(tiempo), // Ensure it's a number
        loading: false,
        error: null
      }));
    } catch (err: any) {
      console.error("Error connecting to backend", err);
      const errorMsg = err.message || "Error desconocido";
      setSimulation(prev => ({
        ...prev,
        loading: false,
        error: `Error de conexión: ${errorMsg}. Verifica que el backend esté corriendo en puerto 8000.`
      }));
    }
  };

  // Automatic simulation on change
  React.useEffect(() => {
    const timer = setTimeout(() => {
      handleSimulate();
    }, 300); // 300ms debounce
    return () => clearTimeout(timer);
  }, [totems, cajeras, hour, amount]);

  // Data for chart
  const chartData = [
    {
      name: 'Situación Actual',
      tiempo: simulation.currentWait,
      fill: '#EF4444' // Red-500
    },
    {
      name: 'Proyectado',
      tiempo: simulation.projectedWait || 0,
      fill: '#22C55E' // Green-500
    }
  ];

  // Percentage reduction
  const reduction = simulation.projectedWait
    ? ((simulation.currentWait - simulation.projectedWait) / simulation.currentWait * 100).toFixed(1)
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-indigo-600" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Simulador Casino UBB
            </h1>
          </div>
          <div className="text-sm text-slate-500 font-medium">Sprint 3: Factibilidad Edenred</div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {simulation.error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 animate-in fade-in slide-in-from-top-4">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium text-sm">{simulation.error}</span>
          </div>
        )}

        {/* Top Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

          {/* Card: Current Situation */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <AlertCircle className="w-24 h-24 text-red-500" />
            </div>
            <h2 className="text-lg font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Diagnóstico Actual
            </h2>
            <p className="text-slate-500 text-sm mb-6">Sin integración tecnológica y alta congestión manual.</p>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                <div className="text-xs text-red-600 uppercase font-bold tracking-wider mb-1">Tiempo Espera</div>
                <div className="text-3xl font-bold text-red-700">{simulation.currentWait} <span className="text-base font-normal">min</span></div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Tótems Activos:</span>
                  <span className="font-semibold">0</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Medio Pago:</span>
                  <span className="font-semibold">Manual</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card: The Solution (Projected) */}
          <div className={cn(
            "bg-white rounded-2xl p-6 shadow-sm border border-slate-200 relative overflow-hidden transition-all duration-500",
            simulation.projectedWait ? "ring-2 ring-emerald-400 border-emerald-400" : ""
          )}>
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <CheckCircle2 className="w-24 h-24 text-emerald-500" />
            </div>
            <h2 className="text-lg font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              Proyección con Edenred
            </h2>
            <p className="text-slate-500 text-sm mb-6">Integrando API de pagos en Tótems de autoservicio.</p>

            {simulation.projectedWait ? (
              <div className="grid grid-cols-2 gap-4 animate-in fade-in zoom-in duration-500">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <div className="text-xs text-emerald-600 uppercase font-bold tracking-wider mb-1">Nuevo Tiempo</div>
                  <div className="text-3xl font-bold text-emerald-700">{simulation.projectedWait} <span className="text-base font-normal">min</span></div>
                </div>
                <div className="flex flex-col justify-center items-center p-3 bg-slate-50 rounded-xl">
                  <span className="text-emerald-600 font-bold text-2xl">-{reduction}%</span>
                  <span className="text-xs text-slate-500 uppercase font-bold">Reducción</span>
                </div>
              </div>
            ) : (
              <div className="h-[88px] flex items-center justify-center text-slate-400 bg-slate-50 rounded-xl border-dashed border-2 border-slate-200">
                <span>Configura y simula para ver resultados</span>
              </div>
            )}
          </div>
        </div>

        {/* Controls and Viz */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Controls Panel */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="font-semibold text-slate-800 mb-6 flex items-center gap-2 border-b pb-4">
                <Server className="w-5 h-5 text-indigo-500" />
                Variables Operativas
              </h3>

              {/* Slider: Hora */}
              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-slate-700">Hora del Día</label>
                  <span className="text-sm font-bold text-indigo-600">{hour.toFixed(1)} hrs</span>
                </div>
                <input
                  type="range" min="8" max="18" step="0.5"
                  value={hour} onChange={(e) => setHour(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="mt-1">
                  {isPeakHour ? (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                      🔥 Hora Punta
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                      🟢 Horario Normal
                    </span>
                  )}
                </div>
              </div>

              {/* Slider: Totems */}
              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-slate-700">Tótems Operativos</label>
                  <span className="text-sm font-bold text-indigo-600">{totems} u.</span>
                </div>
                <input
                  type="range" min="0" max="6" step="1"
                  value={totems} onChange={(e) => setTotems(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              {/* Slider: Cajeras */}
              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-slate-700">Cajeras Activas</label>
                  <span className="text-sm font-bold text-indigo-600">{cajeras} u.</span>
                </div>
                <input
                  type="range" min="1" max="5" step="1"
                  value={cajeras} onChange={(e) => setCajeras(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

            </div>
          </div>

          {/* Visualization Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-full min-h-[500px] flex flex-col">
              <h3 className="font-semibold text-slate-800 mb-6 flex items-center gap-2">
                <Monitor className="w-5 h-5 text-indigo-500" />
                Comparativa de Eficiencia
              </h3>

              <div className="flex-grow">
                <ResponsiveContainer width="100%" height="80%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" tick={{ fill: '#64748B' }} axisLine={false} tickLine={false} />
                    <YAxis label={{ value: 'Minutos de Espera', angle: -90, position: 'insideLeft', fill: '#94A3B8' }} tick={{ fill: '#64748B' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="tiempo" radius={[8, 8, 0, 0]} barSize={60}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {simulation.projectedWait && (
                <div className="mt-4 p-4 bg-slate-50 rounded-xl text-center text-sm text-slate-600">
                  <p>
                    La implementación de <strong>{totems} tótems con Edenred</strong> reduce la espera en
                    <strong className="text-emerald-600 mx-1">{reduction}%</strong>
                    comparado con la línea base manual.
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      </main >
    </div >
  );
}

export default App;
