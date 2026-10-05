'use client';
import { useState } from 'react';

export default function ExpedientesPage() {
  const [filter, setFilter] = useState<'todos' | 'pendientes' | 'aprobados'>('pendientes');

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Encabezado Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Expedientes Digitales</h1>
          <p className="text-xs text-slate-500 mt-0.5">Gestión, validación y archivo de documentación de vendedoras</p>
        </div>
        <button className="bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:opacity-95 text-white font-extrabold px-6 py-3 rounded-2xl text-xs tracking-wide transition shadow-lg shadow-fuchsia-500/20 hover:scale-[1.02] active:scale-[0.98]">
          + Subir Documento
        </button>
      </div>

      {/* Zona Drag & Drop Modernizada */}
      <div className="relative group overflow-hidden rounded-3xl border-2 border-dashed border-pink-300 hover:border-fuchsia-500 bg-gradient-to-b from-pink-50/60 via-white to-white p-8 text-center transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-pink-500/10 cursor-pointer">
        <div className="max-w-md mx-auto space-y-3">
          <div className="w-14 h-14 bg-gradient-to-tr from-fuchsia-600 to-pink-500 text-white rounded-2xl flex items-center justify-center mx-auto text-2xl font-black shadow-lg shadow-fuchsia-500/30 group-hover:scale-110 transition-transform">
            ↑
          </div>
          <div>
            <p className="text-sm font-extrabold text-slate-900">
              Arrastra tus archivos aquí o <span className="text-fuchsia-600 hover:underline">explora tu equipo</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Soporta INE, Comprobante de Domicilio y Contratos (PDF, PNG, JPG hasta 10MB)</p>
          </div>
        </div>
      </div>

      {/* Contenedor de Tabla con Filtros Pill */}
      <div className="bg-white rounded-3xl border border-pink-100 shadow-xl shadow-pink-500/5 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-pink-50/30 to-transparent">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Documentos en Sistema</h3>
            <p className="text-xs text-slate-400">Revisa y aprueba la documentación pendiente</p>
          </div>

          {/* Filtros Neón */}
          <div className="flex gap-1.5 bg-slate-100/80 p-1.5 rounded-2xl text-xs font-bold self-start sm:self-auto">
            {(['todos', 'pendientes', 'aprobados'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-4 py-2 rounded-xl capitalize transition-all duration-200 ${
                  filter === tab
                    ? 'bg-white text-fuchsia-600 shadow-md shadow-pink-500/10 font-black'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-400 uppercase font-bold tracking-wider border-b border-slate-100">
              <tr>
                <th className="p-4 pl-6">Vendedora</th>
                <th className="p-4">Tipo de Documento</th>
                <th className="p-4">Fecha de Carga</th>
                <th className="p-4">Estado</th>
                <th className="p-4 text-right pr-6">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {[
                { name: 'María Fernanda Ruiz', email: 'mf.ruiz@redpos.com', doc: 'INE (Frente y Vuelta)', date: '27 Sep 2026', status: 'Pendiente', stBg: 'bg-pink-100 text-pink-800' },
                { name: 'Carla Gómez', email: 'carla.g@redpos.com', doc: 'Comprobante Domicilio', date: '26 Sep 2026', status: 'Aprobado', stBg: 'bg-emerald-100 text-emerald-800' },
                { name: 'Sofía Ramírez', email: 'sofia.r@redpos.com', doc: 'Contrato Firmado', date: '25 Sep 2026', status: 'Aprobado', stBg: 'bg-emerald-100 text-emerald-800' },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-pink-50/30 transition">
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-fuchsia-600 to-pink-500 text-white font-bold flex items-center justify-center text-xs shadow-md shadow-fuchsia-500/20">
                        {row.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{row.name}</p>
                        <p className="text-[10px] text-slate-400 font-normal">{row.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 font-bold">{row.doc}</span>
                  </td>
                  <td className="p-4 text-slate-400 font-medium">{row.date}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black ${row.stBg}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="p-4 text-right pr-6 space-x-2">
                    <button className="px-3.5 py-1.5 bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:opacity-95 text-white rounded-xl text-[11px] font-extrabold transition shadow-md shadow-fuchsia-500/20">
                      Aprobar
                    </button>
                    <button className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-[11px] font-extrabold transition">
                      Rechazar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}