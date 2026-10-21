'use client';
import { useState } from 'react';

// Tabla de Ganancias Nivel Bronce (Regla de Negocio)
const BRONZE_LEVELS = [
  { level: 'Coor. Brillante', orders: 5, earningsPerOrder: 600, cashBonus: 3000, freeProduct: 9000 },
  { level: 'Coor. Zafiro', orders: 15, earningsPerOrder: 800, cashBonus: 12000, freeProduct: 27000 },
  { level: 'Coor. Oro', orders: 20, earningsPerOrder: 1000, cashBonus: 20000, freeProduct: 36000 },
  { level: 'Ger. zona Platino', orders: 50, earningsPerOrder: 1200, cashBonus: 60000, freeProduct: 90000 },
  { level: 'Esmeralda', orders: 150, earningsPerOrder: 1400, cashBonus: 0, freeProduct: 0 },
  { level: 'Diamante Black', orders: 300, earningsPerOrder: 1600, cashBonus: 0, freeProduct: 0 },
];

export default function ProyeccionesPage() {
  // Estados para la calculadora/simulador
  const [targetOrders, setTargetOrders] = useState<number>(15);
  const [campaignName, setCampaignName] = useState<string>('Campaña Activa');

  // Calcular nivel y ganancias en tiempo real en el cliente
  const getProjections = (orders: number) => {
    let currentLvl = BRONZE_LEVELS[0];

    for (const lvl of BRONZE_LEVELS) {
      if (orders >= lvl.orders) {
        currentLvl = lvl;
      }
    }

    const totalOrderEarnings = orders * currentLvl.earningsPerOrder;

    return {
      levelName: currentLvl.level,
      earningsPerOrder: currentLvl.earningsPerOrder,
      totalOrderEarnings,
      cashBonus: currentLvl.cashBonus,
      freeProduct: currentLvl.freeProduct,
    };
  };

  const projection = getProjections(targetOrders);

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-2">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="inline-block px-3 py-1 rounded-full bg-fuchsia-100 text-fuchsia-700 text-[11px] font-bold uppercase tracking-wider mb-2">
            Simulador y Consulta de Proyecciones
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Tabla de Ganancias - Nivel Bronce
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Calcula incentivos, bonos en dinero y producto gratis en tiempo real según el volumen de pedidos.
          </p>
        </div>
      </div>

      {/* Panel Interactivo de Simulación */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controles de Ingreso de Datos */}
        <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-xl shadow-pink-500/5 space-y-6">
          <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">
            Parámetros de Consulta
          </h3>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">
                Nombre / Identificador de Campaña
              </label>
              <input
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-fuchsia-500 outline-none font-medium"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-600">
                  Número de Pedidos Estimados
                </label>
                <span className="text-xs font-black text-fuchsia-600 bg-fuchsia-50 px-2 py-0.5 rounded-lg">
                  {targetOrders} pedidos
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="300"
                value={targetOrders}
                onChange={(e) => setTargetOrders(Number(e.target.value))}
                className="w-full accent-fuchsia-600 cursor-pointer"
              />
              <input
                type="number"
                min="1"
                value={targetOrders}
                onChange={(e) => setTargetOrders(Math.max(1, Number(e.target.value)))}
                className="w-full mt-2 px-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-fuchsia-500 outline-none font-bold text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Tarjetas de Resultados Simulados */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 rounded-3xl text-white shadow-2xl flex flex-col justify-between space-y-6">
          <div className="flex justify-between items-start gap-4 border-b border-slate-700/60 pb-6">
            <div>
              <p className="text-xs font-bold text-fuchsia-400 uppercase tracking-wider">
                {campaignName}
              </p>
              <h2 className="text-3xl font-black mt-1">Nivel Alcanzado: {projection.levelName}</h2>
            </div>
            <span className="px-4 py-2 rounded-2xl bg-fuchsia-500/20 border border-fuchsia-400/30 text-fuchsia-300 font-bold text-xs uppercase tracking-wider">
              {targetOrders} Pedidos
            </span>
          </div>

          {/* Desglose de Ganancias */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/50">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Ganas Por Pedido
              </p>
              <p className="text-xl font-black text-amber-400 mt-1">
                ${projection.earningsPerOrder.toLocaleString('es-MX')}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                Total por pedidos: ${projection.totalOrderEarnings.toLocaleString('es-MX')}
              </p>
            </div>

            <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/50">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Ganas En Dinero
              </p>
              <p className="text-2xl font-black text-emerald-400 mt-1">
                {projection.cashBonus > 0
                  ? `$${projection.cashBonus.toLocaleString('es-MX')}`
                  : '—'}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">Bono directo en efectivo</p>
            </div>

            <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/50">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Ganas En Producto Gratis
              </p>
              <p className="text-2xl font-black text-pink-400 mt-1">
                {projection.freeProduct > 0
                  ? `$${projection.freeProduct.toLocaleString('es-MX')}`
                  : '—'}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">Valor comercial en catálogo</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla Referencial Nivel Bronce */}
      <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-xl shadow-pink-500/5 space-y-4">
        <h3 className="font-bold text-slate-900 text-base">Tabla de Referencia Oficial (Nivel Bronce)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="p-3">Nivel</th>
                <th className="p-3 text-center">Pedidos</th>
                <th className="p-3 text-right">Ganas por Pedido</th>
                <th className="p-3 text-right">Ganas en Dinero</th>
                <th className="p-3 text-right">Ganas en Producto Gratis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {BRONZE_LEVELS.map((lvl) => {
                const isCurrent = targetOrders >= lvl.orders;
                return (
                  <tr
                    key={lvl.level}
                    className={isCurrent ? 'bg-fuchsia-50/60 font-bold text-slate-900' : 'text-slate-600'}
                  >
                    <td className="p-3">{lvl.level}</td>
                    <td className="p-3 text-center">{lvl.orders}</td>
                    <td className="p-3 text-right">${lvl.earningsPerOrder.toLocaleString('es-MX')}</td>
                    <td className="p-3 text-right">
                      {lvl.cashBonus > 0 ? `$${lvl.cashBonus.toLocaleString('es-MX')}` : '—'}
                    </td>
                    <td className="p-3 text-right">
                      {lvl.freeProduct > 0 ? `$${lvl.freeProduct.toLocaleString('es-MX')}` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}