'use client';
import { useState } from 'react';

interface Resource {
  id: number;
  title: string;
  category: 'Video' | 'Guía' | 'Manual' | 'Tips';
  durationOrPages: string;
  url: string;
  viewsCount: number;
}

export default function RecursosPage() {
  const [resources, setResources] = useState<Resource[]>([
    { id: 1, title: 'Campaña 1: Cómo arrancar con éxito y vender 20 aromas', category: 'Video', durationOrPages: '12 min', url: '#', viewsCount: 14 },
    { id: 2, title: 'Manual de Procesos y Cierre de Campaña (21 Días)', category: 'Manual', durationOrPages: '8 págs', url: '#', viewsCount: 22 },
    { id: 3, title: 'Tips de Venta Directa en Campo para Perfumería', category: 'Tips', durationOrPages: '5 min lectura', url: '#', viewsCount: 30 },
    { id: 4, title: 'Estrategia de Reactivación de Clientes Inactivos', category: 'Video', durationOrPages: '15 min', url: '#', viewsCount: 9 },
  ]);

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const filteredResources = selectedCategory === 'ALL' 
    ? resources 
    : resources.filter(r => r.category === selectedCategory);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Centro de Recursos y Capacitación</h1>
          <p className="text-xs text-slate-500 mt-1">
            Materiales de apoyo, manuales de proceso y videos motivacionales para impulsar a tu red.
          </p>
        </div>
      </div>

      {/* Filtros por Categoría */}
      <div className="flex flex-wrap gap-2">
        {['ALL', 'Video', 'Manual', 'Tips'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition ${
              selectedCategory === cat 
                ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow-lg shadow-fuchsia-900/20' 
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-pink-50'
            }`}
          >
            {cat === 'ALL' ? 'Todos los Recursos' : cat}
          </button>
        ))}
      </div>

      {/* Grid de Recursos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
        {filteredResources.map((res) => (
          <div key={res.id} className="bg-white p-6 rounded-3xl border border-pink-100 shadow-xl shadow-pink-500/5 flex flex-col justify-between hover:border-fuchsia-300 transition">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black ${
                  res.category === 'Video' ? 'bg-fuchsia-100 text-fuchsia-800' :
                  res.category === 'Manual' ? 'bg-pink-100 text-pink-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {res.category} • {res.durationOrPages}
                </span>
                <span className="text-[11px] font-bold text-slate-400">
                  👀 {res.viewsCount} vendedoras lo vieron
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">{res.title}</h3>
              <p className="text-xs text-slate-500">
                Aprende las mejores técnicas actualizadas para esta campaña y comparte el conocimiento con tu equipo.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                Disponible en la Red
              </span>
              <a
                href={res.url}
                onClick={(e) => { e.preventDefault(); alert('Abriendo material de capacitación...'); }}
                className="inline-flex items-center justify-center bg-slate-900 text-white hover:bg-fuchsia-600 font-bold px-4 py-2 rounded-xl text-xs transition"
              >
                Ver Material →
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}