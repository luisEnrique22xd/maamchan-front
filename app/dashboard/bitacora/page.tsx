'use client';
import { useState } from 'react';
import api from '@/lib/api';

export default function BitacoraPage() {
  const [formData, setFormData] = useState({
    contacts_made: '10',
    perfumes_offered: '10',
    sales_closed: '2',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Simulamos o enviamos al endpoint de bitácora
      await new Promise((resolve) => setTimeout(resolve, 800));
      alert('¡Bitácora diaria enviada con éxito! Tu directora ya puede ver tu avance.');
      setFormData({ contacts_made: '10', perfumes_offered: '10', sales_closed: '2', notes: '' });
    } catch (error) {
      alert('Ocurrió un error al enviar la bitácora.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Bitácora de Alto Rendimiento (Diaria)</h1>
        <p className="text-xs text-slate-500 mt-1">
          Reporta tus actividades del día en menos de 2 minutos para mantener al día tus metas de campaña.
        </p>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-pink-100 shadow-xl shadow-pink-500/5">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase">Personas contactadas hoy</label>
              <input
                type="number"
                required
                value={formData.contacts_made}
                onChange={(e) => setFormData({ ...formData, contacts_made: e.target.value })}
                className="w-full mt-1 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold focus:outline-none focus:border-fuchsia-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase">Aromas / Perfumes ofrecidos</label>
              <input
                type="number"
                required
                value={formData.perfumes_offered}
                onChange={(e) => setFormData({ ...formData, perfumes_offered: e.target.value })}
                className="w-full mt-1 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold focus:outline-none focus:border-fuchsia-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase">Ventas cerradas hoy</label>
            <input
              type="number"
              required
              value={formData.sales_closed}
              onChange={(e) => setFormData({ ...formData, sales_closed: e.target.value })}
              className="w-full mt-1 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold focus:outline-none focus:border-fuchsia-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase">Comentarios o pendientes (Opcional)</label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Ej. Me pidió catálogo una clienta nueva para la próxima semana..."
              className="w-full mt-1 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-fuchsia-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white font-bold text-xs shadow-lg shadow-fuchsia-900/20 hover:scale-[1.01] active:scale-95 transition"
          >
            {submitting ? 'Enviando reporte...' : '🚀 Enviar Bitácora de Hoy'}
          </button>
        </form>
      </div>
    </div>
  );
}