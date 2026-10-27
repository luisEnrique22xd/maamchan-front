'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

interface Product {
  id: number;
  sku: string;
  name: string;
  price_retail: string;
  stock: number;
}

interface Sale {
  id: number;
  customer_name: string;
  sale_type: string;
  total_amount?: string;
  status?: string;
  created_at?: string;
  items?: Array<{
    product_name: string;
    quantity: number;
  }>;
}

export default function POSPage() {
  // Estados del formulario de Venta
  const [saleType, setSaleType] = useState<'contado' | 'credito' | 'anticipo'>('contado');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | ''>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  const [quantity, setQuantity] = useState<number>(1);
  const [customerName, setCustomerName] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA'>('EFECTIVO');
  const [initialPayment, setInitialPayment] = useState<string>('');

  // Estados de interfaz y feedback
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchingProducts, setFetchingProducts] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Estados del Modal de Cancelaciones
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [fetchingSales, setFetchingSales] = useState<boolean>(false);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  // 1. Cargar Productos desde la API
  const fetchProducts = async () => {
    try {
      const response = await api.get<Product[]>('/sales/products/');
      const data = Array.isArray(response.data) ? response.data : (response.data as any).results || [];
      setProducts(data);
      if (data.length > 0 && !selectedProductId) {
        setSelectedProductId(data[0].id);
      }
    } catch (err) {
      console.error('Error al obtener productos:', err);
    } finally {
      setFetchingProducts(false);
    }
  };

  // Cargar historial de ventas recientes al abrir el modal
  const fetchRecentSales = async () => {
    setFetchingSales(true);
    try {
      const response = await api.get<Sale[]>('/sales/');
      const data = Array.isArray(response.data) ? response.data : (response.data as any).results || [];
      setRecentSales(data);
    } catch (err) {
      console.error('Error al obtener historial de ventas:', err);
    } finally {
      setFetchingSales(false);
    }
  };

  const handleOpenModal = () => {
    setIsHistoryOpen(true);
    fetchRecentSales();
  };

  // Procesar Cancelación de Venta
  const handleCancelSale = async (saleId: number) => {
    if (!confirm(`¿Estás segura de cancelar la Venta #${saleId}? El stock de los productos será devuelto automáticamente al inventario.`)) {
      return;
    }

    setCancellingId(saleId);
    try {
      // Ajusta la URL de cancelación según tu backend Django (ej. /sales/ID/cancel/ o DELETE /sales/ID/)
      await api.post(`/sales/${saleId}/cancel/`);
      
      setFeedback({
        type: 'success',
        message: `Venta #${saleId} cancelada exitosamente y stock reincorporado.`,
      });

      // Recargar lista de ventas y productos (para actualizar stocks en la interfaz)
      fetchRecentSales();
      fetchProducts();
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'No se pudo cancelar la venta.';
      alert(`Error: ${errorMsg}`);
    } finally {
      setCancellingId(null);
    }
  };

  // Filtrar productos según la búsqueda por Nombre o SKU
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 2. Cálculos en tiempo real
  const selectedProduct = products.find((p) => p.id === Number(selectedProductId));
  const unitPrice = selectedProduct ? parseFloat(selectedProduct.price_retail) : 0;
  const totalAmount = unitPrice * quantity;

  const effectivePayment =
    saleType === 'contado'
      ? totalAmount
      : Math.min(parseFloat(initialPayment) || 0, totalAmount);

  const balanceDue = Math.max(0, totalAmount - effectivePayment);

  const handleSelectProduct = (product: Product) => {
    setSelectedProductId(product.id);
    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  // 3. Procesar Venta al Backend
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!selectedProductId) {
      setFeedback({ type: 'error', message: 'Selecciona un producto para continuar.' });
      return;
    }

    if (selectedProduct && quantity > selectedProduct.stock) {
      setFeedback({
        type: 'error',
        message: `Stock insuficiente. Solo quedan ${selectedProduct.stock} unidades de ${selectedProduct.name}.`,
      });
      return;
    }

    setLoading(true);

    try {
      const payload = {
        customer_name: customerName.trim() || 'Cliente Mostrador',
        sale_type: saleType.toUpperCase(),
        input_items: [
          {
            product_id: Number(selectedProductId),
            quantity: quantity,
            unit_price: unitPrice,
          },
        ],
        initial_payment: {
          amount: effectivePayment,
          payment_method: paymentMethod,
        },
      };

      const response = await api.post('/sales/', payload);

      setFeedback({
        type: 'success',
        message: `¡Venta #${response.data.id} registrada exitosamente!`,
      });

      // Limpiar formulario tras venta exitosa
      setCustomerName('');
      setQuantity(1);
      setInitialPayment('');
      setSelectedProductId('');
      setSearchQuery('');
      setIsDropdownOpen(false);
      
      // Actualizar el stock local del producto
      setProducts((prev) =>
        prev.map((p) =>
          p.id === Number(selectedProductId)
            ? { ...p, stock: p.stock - quantity }
            : p
        )
      );
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.non_field_errors?.[0] ||
        err.response?.data?.detail ||
        'Ocurrió un error al procesar la venta.';
      setFeedback({ type: 'error', message: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Encabezado con Botón de Modal Historial */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Punto de Venta (POS)</h1>
          <p className="text-xs text-slate-500">Módulo de registro comercial inteligente</p>
        </div>
        
        <button
          onClick={handleOpenModal}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 border border-slate-200"
        >
          <span>📋</span> Historial / Cancelaciones
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold border transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          {feedback.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Panel Principal */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-pink-100 shadow-xl shadow-pink-500/5 space-y-6">
          
          {/* Modalidad de Pago */}
          <div>
            <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">
              Modalidad de Pago
            </label>
            <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100/80 rounded-2xl">
              {(['contado', 'credito', 'anticipo'] as const).map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => setSaleType(type)}
                  className={`py-3 rounded-xl text-xs font-bold capitalize transition-all duration-200 ${
                    saleType === type
                      ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow-lg shadow-fuchsia-500/25 scale-[1.02]'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Selección de Producto y Cliente */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Cliente</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nombre del cliente..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-medium text-slate-900 focus:ring-4 focus:ring-fuchsia-500/10 focus:border-fuchsia-400 outline-none transition"
              />
            </div>

            {/* Buscador de Producto */}
            <div className="relative">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Producto ({fetchingProducts ? 'Cargando...' : `${products.length} disponibles`})
              </label>
              
              <div
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-medium text-slate-900 cursor-pointer flex justify-between items-center hover:border-fuchsia-300 transition"
              >
                <span className="truncate">
                  {selectedProduct
                    ? `${selectedProduct.name} - $${selectedProduct.price_retail}`
                    : 'Seleccionar producto...'}
                </span>
                <span className="text-slate-400 text-xs">▼</span>
              </div>

              {isDropdownOpen && (
                <div className="absolute z-20 top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 space-y-2">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Buscar por nombre o SKU..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                  />
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {filteredProducts.length === 0 ? (
                      <div className="p-3 text-xs text-slate-400 text-center">Sin resultados</div>
                    ) : (
                      filteredProducts.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => handleSelectProduct(p)}
                          className={`p-2.5 rounded-xl text-xs flex justify-between items-center cursor-pointer transition ${
                            selectedProductId === p.id
                              ? 'bg-fuchsia-50 text-fuchsia-900 font-bold'
                              : 'hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <div>
                            <p className="font-semibold">{p.name}</p>
                            <p className="text-[10px] text-slate-400">SKU: {p.sku}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-fuchsia-600">${p.price_retail}</p>
                            <p className="text-[10px] text-slate-500">Stock: {p.stock}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Cantidad y Método de Pago */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Cantidad</label>
              <input
                type="number"
                min="1"
                max={selectedProduct?.stock || 1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-medium text-slate-900 focus:ring-4 focus:ring-fuchsia-500/10 focus:border-fuchsia-400 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Método de Pago</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-medium text-slate-900 focus:ring-4 focus:ring-fuchsia-500/10 focus:border-fuchsia-400 outline-none transition"
              >
                <option value="EFECTIVO">Efectivo</option>
                <option value="TRANSFERENCIA">Transferencia SPEI</option>
                <option value="TARJETA">Tarjeta Débito / Crédito</option>
              </select>
            </div>
          </div>

          {/* Subpanel para Anticipo o Crédito */}
          {(saleType === 'anticipo' || saleType === 'credito') && (
            <div className="p-5 bg-gradient-to-r from-pink-50 to-fuchsia-50 rounded-2xl border border-pink-200/60 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-extrabold text-fuchsia-900 mb-1">
                  {saleType === 'anticipo' ? 'Monto del Anticipo ($)' : 'Abono Inicial ($)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={initialPayment}
                  onChange={(e) => setInitialPayment(e.target.value)}
                  className="w-full bg-white border border-pink-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-fuchsia-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-extrabold text-fuchsia-900 mb-1">
                  Saldo Restante ($)
                </label>
                <input
                  type="text"
                  disabled
                  value={`$${balanceDue.toFixed(2)}`}
                  className="w-full bg-slate-100/80 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || fetchingProducts || !selectedProductId}
            className="w-full bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:opacity-95 disabled:opacity-50 text-white font-extrabold py-4 rounded-2xl text-xs tracking-wide transition shadow-xl shadow-fuchsia-500/20 hover:scale-[1.01] active:scale-[0.99]"
          >
            {loading ? 'PROCESANDO VENTA...' : 'PROCESAR Y GENERAR TICKET'}
          </button>
        </div>

        {/* Panel Resumen de Operación */}
        <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-xl shadow-pink-500/5 space-y-4 h-fit">
          <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-3">Resumen de Operación</h3>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Cliente:</span>
              <span className="font-bold text-slate-800">{customerName || 'Cliente Mostrador'}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Tipo Venta:</span>
              <span className="font-extrabold text-fuchsia-600 capitalize">{saleType}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Producto:</span>
              <span className="font-bold text-slate-800 truncate max-w-[120px]">
                {selectedProduct ? selectedProduct.name : '-'}
              </span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Cantidad:</span>
              <span className="font-bold text-slate-800">{quantity}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Precio Unitario:</span>
              <span className="font-bold text-slate-800">${unitPrice.toFixed(2)}</span>
            </div>

            <hr className="border-slate-100 my-2" />

            <div className="flex justify-between text-slate-800 font-bold text-sm">
              <span>Total Operación:</span>
              <span className="text-fuchsia-600">${totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Monto Abonado:</span>
              <span className="font-bold text-emerald-600">${effectivePayment.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Saldo Por Cobrar:</span>
              <span className="font-bold text-rose-500">${balanceDue.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </form>

      {/* --- MODAL DE HISTORIAL Y CANCELACIONES --- */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-150">
            
            {/* Header del Modal */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Historial de Ventas Recientes</h2>
                <p className="text-xs text-slate-500">Consulta operaciones o cancela un folio de venta</p>
              </div>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-200/60 text-slate-600 hover:bg-slate-200 font-bold text-sm transition flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Cuerpo del Modal */}
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
              {fetchingSales ? (
                <p className="text-center text-xs text-slate-400 py-8">Cargando ventas del sistema...</p>
              ) : recentSales.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-8">No hay ventas registradas aún.</p>
              ) : (
                recentSales.map((sale) => (
                  <div
                    key={sale.id}
                    className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-center justify-between hover:bg-slate-50 transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-slate-900">Venta #{sale.id}</span>
                        <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-fuchsia-100 text-fuchsia-800">
                          {sale.sale_type}
                        </span>
                        {sale.status === 'CANCELLED' && (
                          <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-rose-100 text-rose-800">
                            Cancelada
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 font-medium">Cliente: {sale.customer_name}</p>
                    </div>

                    <div className="flex items-center gap-4">
                      {sale.total_amount && (
                        <span className="font-extrabold text-sm text-slate-900">${sale.total_amount}</span>
                      )}

                      {sale.status !== 'CANCELLED' && (
                        <button
                          onClick={() => handleCancelSale(sale.id)}
                          disabled={cancellingId === sale.id}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 px-3 py-1.5 rounded-xl text-xs font-bold transition disabled:opacity-50"
                        >
                          {cancellingId === sale.id ? 'Anulando...' : 'Cancelar Venta'}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer del Modal */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 text-right">
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="bg-slate-900 text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-slate-800 transition"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}