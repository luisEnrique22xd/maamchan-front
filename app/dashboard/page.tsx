import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Banner Principal con Degradado */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-fuchsia-600 via-pink-600 to-rose-500 p-8 text-white shadow-2xl shadow-fuchsia-500/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold tracking-wider mb-3">
              Panel de Control General
            </span>
            <h1 className="text-3xl font-black tracking-tight">¡Bienvenida de nuevo, María!</h1>
            <p className="text-pink-100 text-sm mt-1 max-w-md">
              Aquí tienes el resumen comercial de tu red de vendedoras en tiempo real.
            </p>
          </div>
          <Link
            href="/dashboard/pos"
            className="inline-flex items-center justify-center bg-white text-fuchsia-700 hover:bg-pink-50 font-bold px-6 py-3.5 rounded-2xl text-sm transition shadow-lg hover:scale-105 active:scale-95"
          >
            ⚡ Registrar Venta Rápida
          </Link>
        </div>
        {/* Adorno Neón de Fondo */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
      </div>

      {/* Grid de Tarjetas KPI con bordes de luz */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { title: 'Ventas del Mes', val: '$148,250', tag: '+12.5%', color: 'border-fuchsia-500/30' },
          { title: 'Cuentas x Cobrar', val: '$32,400', tag: '18 cuentas', color: 'border-pink-500/30' },
          { title: 'Expedientes x Validar', val: '7', tag: 'Acción requerida', color: 'border-fuchsia-500/30' },
          { title: 'Vendedoras Activas', val: '42', tag: '+3 esta semana', color: 'border-pink-500/30' },
        ].map((kpi, idx) => (
          <div
            key={idx}
            className={`bg-white p-6 rounded-3xl border ${kpi.color} shadow-xl shadow-pink-500/5 hover:shadow-fuchsia-500/10 hover:-translate-y-1 transition-all duration-300`}
          >
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{kpi.title}</p>
            <p className="text-3xl font-black text-slate-900 mt-2">{kpi.val}</p>
            <span className="inline-block text-[11px] font-bold text-fuchsia-600 bg-pink-50 px-3 py-1 rounded-full mt-3">
              {kpi.tag}
            </span>
          </div>
        ))}
      </div>

      {/* Tablas Modernas con Avatares */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-pink-100 shadow-xl shadow-pink-500/5 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-pink-50/40 to-transparent">
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Últimas Transacciones</h3>
              <p className="text-xs text-slate-400">Movimientos procesados en caja</p>
            </div>
            <Link href="/dashboard/pos" className="text-xs font-bold text-fuchsia-600 hover:underline">
              Ver reporte →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-400 uppercase font-bold tracking-wider">
                <tr>
                  <th className="p-4 pl-6">Vendedora</th>
                  <th className="p-4">Modalidad</th>
                  <th className="p-4">Monto</th>
                  <th className="p-4">Estatus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {[
                  { name: 'Ana Martínez', mode: 'Contado', amount: '$2,400.00', status: 'Completado', stColor: 'bg-emerald-100 text-emerald-800' },
                  { name: 'Carla Gómez', mode: 'Anticipo', amount: '$1,000.00', status: 'Pendiente', stColor: 'bg-pink-100 text-pink-800' },
                  { name: 'Lucía Hernández', mode: 'Crédito', amount: '$4,800.00', status: 'En Plazo', stColor: 'bg-amber-100 text-amber-800' },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-pink-50/30 transition">
                    <td className="p-4 pl-6 font-bold text-slate-900">{row.name}</td>
                    <td className="p-4"><span className="px-2.5 py-1 rounded-xl bg-slate-100 font-semibold text-slate-600">{row.mode}</span></td>
                    <td className="p-4 font-black text-slate-900 text-sm">{row.amount}</td>
                    <td className="p-4"><span className={`px-3 py-1 rounded-full text-[10px] font-extrabold ${row.stColor}`}>{row.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Vendedoras */}
        <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-xl shadow-pink-500/5 space-y-5">
          <h3 className="font-bold text-slate-900 text-lg border-b border-slate-100 pb-3">Líderes de Ventas</h3>
          <div className="space-y-4">
            {[
              { name: 'Ana Martínez', team: 'Equipo Norte', sales: '$28,400' },
              { name: 'Sofía Ramírez', team: 'Equipo Sur', sales: '$24,100' },
              { name: 'Carla Gómez', team: 'Equipo Centro', sales: '$19,800' },
            ].map((v, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-2xl hover:bg-pink-50/50 transition">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-fuchsia-600 to-pink-500 text-white font-black flex items-center justify-center text-xs">
                    #{i + 1}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-xs">{v.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{v.team}</p>
                  </div>
                </div>
                <span className="font-black text-fuchsia-600 text-sm">{v.sales}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}