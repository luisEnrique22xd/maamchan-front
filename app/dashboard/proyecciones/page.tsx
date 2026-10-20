'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';

interface TeamProgress {
  coordinator_id: number;
  coordinator_name: string;
  target_amount: number;
  achieved_amount: number;
  target_orders: number;
  achieved_orders: number;
  percentage: number;
  current_level: string;
  estimated_cash_bonus: number;
  estimated_free_product: number;
}

interface CampaignData {
  campaign: {
    id: number;
    code: string;
    name: string;
    start_date: string;
    end_date: string;
    global_target: number;
    total_real_sales: number;
    total_real_orders: number;
    progress_percentage: number;
  };
  teams_progress: TeamProgress[];
}

export default function ProyeccionesPage() {
  const [data, setData] = useState<CampaignData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Formulario estado
  const [form, setForm] = useState({
    name: '',
    code: '',
    start_date: '',
    end_date: '',
    global_target: 100000,
  });

  useEffect(() => {
    fetchCampaignData();
  }, []);

  const fetchCampaignData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/campaigns/active-projection/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setData(response.data);
    } catch (error) {
      console.error('Error al cargar la proyección de campaña:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('access_token');
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/campaigns/active-projection/`,
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowModal(false);
      fetchCampaignData();
    } catch (error) {
      alert('Error al guardar la campaña. Revisa los datos ingresados.');
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-slate-400 font-medium">
        Cargando proyecciones y niveles de campaña...
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-2">
      {/* Encabezado con Botón de Ingresar Datos */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="inline-block px-3 py-1 rounded-full bg-fuchsia-100 text-fuchsia-700 text-[11px] font-bold uppercase tracking-wider mb-2">
            Modulo de Proyección
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Proyección de Campaña</h1>
          <p className="text-xs text-slate-500 mt-1">
            Gestión e ingreso de metas por campaña y nivel de liderazgo
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700 text-white font-bold text-xs px-6 py-3 rounded-2xl shadow-lg shadow-pink-500/20 transition-all"
        >
          + Nueva Campaña / Ingresar Datos
        </button>
      </div>

      {!data ? (
        <div className="bg-white p-12 rounded-3xl border border-pink-100 shadow-xl shadow-pink-500/5 text-center space-y-4">
          <p className="text-slate-500 font-medium text-sm">
            No hay ninguna campaña activa registrada. Haz clic en el botón superior para ingresar los datos de la nueva campaña.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-fuchsia-50 text-fuchsia-700 font-bold text-xs px-5 py-2.5 rounded-xl border border-fuchsia-200"
          >
            Configurar Campaña Ahora
          </button>
        </div>
      ) : (
        <>
          {/* Tarjeta de Progreso General */}
          <div className="bg-white p-8 rounded-3xl border border-pink-100 shadow-xl shadow-pink-500/5 space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Campaña {data.campaign.code} - {data.campaign.name}
                </p>
                <h2 className="text-4xl font-black text-slate-900 mt-1">
                  ${data.campaign.total_real_sales.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  <span className="text-sm font-medium text-slate-400 ml-2">
                    de Meta Global: ${data.campaign.global_target.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                </h2>
              </div>
              <span className="text-2xl font-black text-fuchsia-600 bg-pink-50 px-4 py-2 rounded-2xl w-fit">
                {data.campaign.progress_percentage}% Cumplido
              </span>
            </div>

            <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden p-0.5 border border-slate-200">
              <div
                className="bg-gradient-to-r from-fuchsia-600 via-pink-600 to-rose-500 h-full rounded-full transition-all duration-1000"
                style={{ width: `${data.campaign.progress_percentage}%` }}
              />
            </div>
          </div>

          {/* Desglose por Coordinaciones */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-lg">Proyección y Ganancias por Coordinación</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {data.teams_progress.map((team) => (
                <div
                  key={team.coordinator_id}
                  className="bg-white p-6 rounded-3xl border border-pink-100 shadow-xl shadow-pink-500/5 space-y-5"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Coordinadora</p>
                      <h4 className="text-lg font-bold text-slate-900">{team.coordinator_name}</h4>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase">
                      {team.current_level}
                    </span>
                  </div>

                  <div className="space-y-2 bg-slate-50 p-4 rounded-2xl text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Pedidos Reales:</span>
                      <span className="font-bold">{team.achieved_orders}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Ventas Reales:</span>
                      <span className="font-bold text-fuchsia-600">${team.achieved_amount.toLocaleString('es-MX')}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="bg-pink-50 p-3 rounded-2xl">
                      <p className="text-[10px] font-bold text-pink-700">Ganas en Dinero</p>
                      <p className="font-black text-slate-900 mt-1">${team.estimated_cash_bonus.toLocaleString('es-MX')}</p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-2xl">
                      <p className="text-[10px] font-bold text-purple-700">Prod. Gratis</p>
                      <p className="font-black text-slate-900 mt-1">${team.estimated_free_product.toLocaleString('es-MX')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* MODAL PARA INGRESAR DATOS DE LA CAMPAÑA */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white p-8 rounded-3xl max-w-lg w-full border border-pink-100 shadow-2xl space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-900">Ingresar Datos de la Campaña</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 font-bold hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Nombre de la Campaña</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Campaña 05 - Mayo"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-fuchsia-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Código de Campaña</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. C-2026-05"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-fuchsia-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Fecha Inicio</label>
                  <input
                    type="date"
                    required
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-fuchsia-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Fecha Fin</label>
                  <input
                    type="date"
                    required
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-fuchsia-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Meta Global ($)</label>
                <input
                  type="number"
                  required
                  value={form.global_target}
                  onChange={(e) => setForm({ ...form, global_target: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-fuchsia-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white text-xs font-bold shadow-lg shadow-pink-500/20"
                >
                  Guardar Campaña
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}