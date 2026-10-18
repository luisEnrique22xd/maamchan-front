'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';

interface Sale {
  id: number;
  seller_name: string;
  coordinator_name: string;
  customer_name: string;
  sale_type: string;
  total_amount: string;
  status: string;
  created_at: string;
}

interface DashboardSummary {
  user: {
    first_name: string;
    role_display: string;
  };
  kpis: {
    monthly_sales: string;
    accounts_receivable_total: string;
    accounts_receivable_count: string;
    pending_expedientes: number;
    active_sellers: number;
  };
  top_sellers: {
    name: string;
    team: string;
    sales: string;
  }[];
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [transactions, setTransactions] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const headers = { Authorization: `Bearer ${token}` };

        const [summaryRes, salesRes] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/sales/dashboard-summary/`, { headers }),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/sales/`, { headers }),
        ]);

        setSummary(summaryRes.data);

        const salesData = Array.isArray(salesRes.data) ? salesRes.data : salesRes.data.results;
        setTransactions(salesData || []);
      } catch (error) {
        console.error('Error al cargar datos del dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const kpis = [
    {
      title: 'Ventas del Mes',
      val: summary?.kpis.monthly_sales || '$0.00',
      tag: 'Corte al mes actual',
      color: 'border-fuchsia-500/30',
      href: '/dashboard/pos',
    },
    {
      title: 'Cuentas x Cobrar',
      val: summary?.kpis.accounts_receivable_total || '$0.00',
      tag: summary?.kpis.accounts_receivable_count || '0 cuentas',
      color: 'border-pink-500/30',
      href: '/dashboard/expediente?tab=deudas',
    },
    {
      title: 'Expedientes x Validar',
      val: summary?.kpis.pending_expedientes ?? 0,
      tag: 'Acción requerida',
      color: 'border-fuchsia-500/30',
      href: '/dashboard/expediente?tab=pendientes',
    },
    {
      title: 'Vendedoras Activas',
      val: summary?.kpis.active_sellers ?? 0,
      tag: 'En tu red de ventas',
      color: 'border-pink-500/30',
      href: '/dashboard/usuarios?estado=activas',
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PAGADO':
      case 'COMPLETADO':
        return 'bg-emerald-100 text-emerald-800';
      case 'PENDIENTE':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-amber-100 text-amber-800';
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Banner Principal dinámico */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-fuchsia-600 via-pink-600 to-rose-500 p-8 text-white shadow-2xl shadow-fuchsia-500/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold tracking-wider mb-3">
              Panel de Control General {summary?.user.role_display ? `• ${summary.user.role_display}` : ''}
            </span>
            <h1 className="text-3xl font-black tracking-tight">
              ¡Bienvenida de nuevo, {summary?.user.first_name || 'Usuaria'}!
            </h1>
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
        <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
      </div>

      {/* Grid de Tarjetas KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((kpi, idx) => (
          <Link
            key={idx}
            href={kpi.href}
            className={`group block bg-white p-6 rounded-3xl border ${kpi.color} shadow-xl shadow-pink-500/5 hover:shadow-fuchsia-500/15 hover:-translate-y-1 transition-all duration-300 relative cursor-pointer`}
          >
            <div className="flex justify-between items-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{kpi.title}</p>
              <span className="text-[10px] font-bold text-fuchsia-600 opacity-0 group-hover:opacity-100 transition-opacity">
                Ver detalle ➔
              </span>
            </div>
            <p className="text-3xl font-black text-slate-900 mt-2">
              {loading ? '...' : kpi.val}
            </p>
            <span className="inline-block text-[11px] font-bold text-fuchsia-600 bg-pink-50 px-3 py-1 rounded-full mt-3">
              {kpi.tag}
            </span>
          </Link>
        ))}
      </div>

      {/* Tablas con Datos Reales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-pink-100 shadow-xl shadow-pink-500/5 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-pink-50/40 to-transparent">
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Últimas Transacciones</h3>
              <p className="text-xs text-slate-400">Movimientos en vivo de tu red de ventas</p>
            </div>
            <Link href="/dashboard/pos" className="text-xs font-bold text-fuchsia-600 hover:underline">
              Ver reporte →
            </Link>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400 font-medium">
                Cargando datos del servidor...
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 font-medium">
                No hay transacciones registradas todavía.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-400 uppercase font-bold tracking-wider">
                  <tr>
                    <th className="p-4 pl-6">Vendedora</th>
                    <th className="p-4">Coordinadora</th>
                    <th className="p-4">Modalidad</th>
                    <th className="p-4">Monto</th>
                    <th className="p-4">Estatus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {transactions.slice(0, 5).map((row) => (
                    <tr key={row.id} className="hover:bg-pink-50/30 transition">
                      <td className="p-4 pl-6">
                        <p className="font-bold text-slate-900">{row.seller_name || 'Vendedora'}</p>
                        <p className="text-[10px] text-slate-400 font-normal">Cliente: {row.customer_name || 'General'}</p>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-xl bg-fuchsia-50 font-semibold text-fuchsia-700 border border-fuchsia-200/50">
                          {row.coordinator_name || 'Venta Directa'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-xl bg-slate-100 font-semibold text-slate-600">
                          {row.sale_type || 'Contado'}
                        </span>
                      </td>
                      <td className="p-4 font-black text-slate-900 text-sm">
                        ${Number(row.total_amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold ${getStatusBadge(row.status)}`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Top Vendedoras dinámico */}
        <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-xl shadow-pink-500/5 space-y-5">
          <h3 className="font-bold text-slate-900 text-lg border-b border-slate-100 pb-3">Líderes de Ventas</h3>
          <div className="space-y-4">
            {loading ? (
              <p className="text-xs text-slate-400 text-center py-4">Cargando líderes...</p>
            ) : !summary?.top_sellers || summary.top_sellers.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">Sin datos de ventas este mes.</p>
            ) : (
              summary.top_sellers.map((v, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-2xl hover:bg-pink-50/50 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-fuchsia-600 to-pink-500 text-white font-black flex items-center justify-center text-xs">
                      #{i + 1}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-xs">{v.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium">Coord: {v.team}</p>
                    </div>
                  </div>
                  <span className="font-black text-fuchsia-600 text-sm">{v.sales}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}