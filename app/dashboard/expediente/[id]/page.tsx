'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';

interface SaleItem {
  product_name: string;
  quantity: number;
  subtotal: string;
}

interface Sale {
  id: number;
  customer_name: string;
  sale_type: string;
  total_amount: string;
  paid_amount: string;
  balance_due: string;
  status: string;
  created_at: string;
  items?: SaleItem[];
}

export default function UserCarteraPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id;

  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<'PENDIENTE' | 'PAGADO' | 'ALL'>('PENDIENTE');

  useEffect(() => {
    if (userId) {
      fetchUserSales();
    }
  }, [userId]);

  const fetchUserSales = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/sales/sales/?seller=${userId}`);
      const data = Array.isArray(response.data) ? response.data : (response.data as any).results || [];
      setSales(data);
    } catch (err) {
      console.error('Error al cargar cartera de la consultora:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredSales = sales.filter((s) => {
    if (filterTab === 'ALL') return true;
    return s.status === filterTab;
  });

  const totalPorCobrar = sales
    .filter((s) => s.status === 'PENDIENTE')
    .reduce((acc, s) => acc + parseFloat(s.balance_due || '0'), 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-6">
      <div>
        <button
          onClick={() => router.back()}
          className="text-xs font-bold text-slate-400 hover:text-slate-700 mb-2 inline-flex items-center gap-1"
        >
          ← Volver a la Red
        </button>
        <h1 className="text-2xl font-black text-slate-900">Cartera y Cuentas por Cobrar</h1>
        <p className="text-xs text-slate-500">Seguimiento de abonos, créditos y ventas de la consultora seleccionada</p>
      </div>

      {/* KPI de Cartera Activa */}
      <div className="bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white p-6 rounded-3xl shadow-xl shadow-fuchsia-500/20 flex justify-between items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-pink-100">Saldo Total Pendiente por Cobrar</p>
          <p className="text-3xl font-black mt-1">${totalPorCobrar.toFixed(2)}</p>
        </div>
        <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl text-xs font-extrabold">
          {sales.filter(s => s.status === 'PENDIENTE').length} Créditos Activos
        </div>
      </div>

      {/* Pestañas de Filtrado */}
      <div className="flex gap-2">
        {(['PENDIENTE', 'PAGADO', 'ALL'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterTab(tab)}
            className={`px-5 py-2.5 rounded-2xl text-xs font-extrabold transition ${
              filterTab === tab
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {tab === 'PENDIENTE' ? '🟡 Por Cobrar / En Abonos' : tab === 'PAGADO' ? '🟢 Liquidadas' : '📋 Todas las Ventas'}
          </button>
        ))}
      </div>

      {/* Lista de Ventas de la Cartera */}
      <div className="bg-white rounded-3xl border border-pink-100 shadow-xl shadow-pink-500/5 overflow-hidden p-6">
        {loading ? (
          <p className="text-center text-xs text-slate-400 py-12">Cargando cartera...</p>
        ) : filteredSales.length === 0 ? (
          <p className="text-center text-xs text-slate-400 py-12">No hay registros en esta categoría.</p>
        ) : (
          <div className="space-y-4">
            {filteredSales.map((sale) => (
              <div key={sale.id} className="p-5 rounded-2xl border border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs text-slate-900">Venta #{sale.id}</span>
                    <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-fuchsia-100 text-fuchsia-800">
                      {sale.sale_type}
                    </span>
                    <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-md ${
                      sale.status === 'PAGADO' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {sale.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">Cliente: <strong className="text-slate-800">{sale.customer_name || 'General'}</strong></p>
                  <p className="text-[10px] text-slate-400">Fecha: {new Date(sale.created_at).toLocaleDateString()}</p>
                </div>

                <div className="flex items-center gap-6 text-xs">
                  <div>
                    <span className="text-slate-400 block">Total:</span>
                    <strong className="text-slate-900">${sale.total_amount}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Pagado:</span>
                    <strong className="text-emerald-600">${sale.paid_amount || '0.00'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Restante:</span>
                    <strong className="text-rose-600">${sale.balance_due || '0.00'}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}