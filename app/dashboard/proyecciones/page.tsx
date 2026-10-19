'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';

interface TeamProgress {
  coordinator_id: number;
  coordinator_name: string;
  target: number;
  achieved: number;
  percentage: number;
  remaining: number;
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
    progress_percentage: number;
  };
  teams_progress: TeamProgress[];
}

export default function ProyeccionesPage() {
  const [data, setData] = useState<CampaignData | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-slate-400 font-medium">
        Cargando proyecciones de la campaña...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-xs text-slate-500 font-medium">
        No se encontró ninguna campaña activa programada para la fecha actual.
      </div>
    );
  }

  const { campaign, teams_progress } = data;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="inline-block px-3 py-1 rounded-full bg-fuchsia-100 text-fuchsia-700 text-[11px] font-bold uppercase tracking-wider mb-2">
            Campaña Activa: {campaign.code}
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">{campaign.name}</h1>
          <p className="text-xs text-slate-500 mt-1">
            Vigencia: {campaign.start_date} al {campaign.end_date}
          </p>
        </div>
      </div>

      {/* Tarjeta de Progreso General de la Campaña */}
      <div className="bg-white p-8 rounded-3xl border border-pink-100 shadow-xl shadow-pink-500/5 space-y-6">
        <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avance Meta Global</p>
            <h2 className="text-4xl font-black text-slate-900 mt-1">
              ${campaign.total_real_sales.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              <span className="text-sm font-medium text-slate-400 ml-2">
                de ${campaign.global_target.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </span>
            </h2>
          </div>
          <span className="text-2xl font-black text-fuchsia-600 bg-pink-50 px-4 py-2 rounded-2xl w-fit">
            {campaign.progress_percentage}% Cumplido
          </span>
        </div>

        {/* Barra de Progreso */}
        <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden p-0.5 border border-slate-200">
          <div
            className="bg-gradient-to-r from-fuchsia-600 via-pink-600 to-rose-500 h-full rounded-full transition-all duration-1000"
            style={{ width: `${campaign.progress_percentage}%` }}
          />
        </div>
      </div>

      {/* Desglose de Avance por Equipo / Coordinadora */}
      <div className="space-y-4">
        <h3 className="font-bold text-slate-900 text-lg">Avance por Equipos de Coordinación</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {teams_progress.map((team) => (
            <div
              key={team.coordinator_id}
              className="bg-white p-6 rounded-3xl border border-pink-100 shadow-xl shadow-pink-500/5 flex flex-col justify-between space-y-4"
            >
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Equipo / Coordinadora</p>
                <h4 className="text-lg font-bold text-slate-900 mt-1">{team.coordinator_name}</h4>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-600">Venta Lograda:</span>
                  <span className="text-fuchsia-600">${team.achieved.toLocaleString('es-MX')}</span>
                </div>
                <div className="flex justify-between text-xs font-medium text-slate-400">
                  <span>Meta Asignada:</span>
                  <span>${team.target.toLocaleString('es-MX')}</span>
                </div>

                {/* Mini Barra */}
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mt-2">
                  <div
                    className="bg-fuchsia-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${team.percentage}%` }}
                  />
                </div>
                <p className="text-[10px] text-right font-bold text-slate-500">{team.percentage}% alcanzado</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}