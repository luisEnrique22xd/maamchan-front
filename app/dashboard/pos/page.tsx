'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api'
import { downloadTicketPDF } from '@/lib/ticketPDF';

interface Category {
  id: number;
  name: string;
}

interface Product {
  id: number;
  code: string;
  name: string;
  public_price: string;   
  seller_price: string;   
  category: number;
  category_name: string;
  stock: number;
  inventory_type: 'INTERNO' | 'CEDIS'; // <--- Nuevo campo para separar almacén
}

interface Sale {
  id: number;
  customer_name: string;
  sale_type: string;
  total_amount?: string;
  paid_amount?: string;
  balance_due?: string;
  status?: string;
  created_at?: string;
  items?: Array<{
    product_name: string;
    quantity: number;
    unit_price: string;
    subtotal: string;
  }>;
}

export default function POSPage() {
  const [posInventoryType, setPosInventoryType] = useState<'INTERNO' | 'CEDIS'>('INTERNO'); // <--- Pestaña activa (Interno / CEDIS)
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | 'ALL'>('ALL');
  
  // Estados del formulario de Venta
  const [saleType, setSaleType] = useState<'CONTADO' | 'CREDITO' | 'ANTICIPO'>('CONTADO');
  const [selectedProductId, setSelectedProductId] = useState<number | ''>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  const [quantity, setQuantity] = useState<number>(1);
  const [customerName, setCustomerName] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA'>('EFECTIVO');
  const [initialPayment, setInitialPayment] = useState<string>('');

  // Estados de interfaz y feedback
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchingData, setFetchingData] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [lastCreatedSale, setLastCreatedSale] = useState<Sale | null>(null);

  // Estados del Modal de Cancelaciones / Historial
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [fetchingSales, setFetchingSales] = useState<boolean>(false);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  // Estados para el Modal de Abonos Subsecuentes
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [activeSaleForPayment, setActiveSaleForPayment] = useState<Sale | null>(null);
  const [abonoAmount, setAbonoAmount] = useState<string>('');
  const [abonoMethod, setAbonoMethod] = useState<'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA'>('EFECTIVO');
  const [abonoReference, setAbonoReference] = useState<string>('');
  const [submittingAbono, setSubmittingAbono] = useState<boolean>(false);

  // Cargar Categorías y Productos
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, prodRes] = await Promise.all([
          api.get<Category[]>('/sales/categories/'),
          api.get<Product[]>('/sales/products/'),
        ]);
        setCategories(Array.isArray(catRes.data) ? catRes.data : (catRes.data as any).results || []);
        
        const prodData = Array.isArray(prodRes.data) ? prodRes.data : (prodRes.data as any).results || [];
        setProducts(prodData);
      } catch (err) {
        console.error('Error al cargar datos iniciales del POS:', err);
      } finally {
        setFetchingData(false);
      }
    };
    fetchData();
  }, []);

  const fetchRecentSales = async () => {
    setFetchingSales(true);
    try {
      const response = await api.get<Sale[]>('/sales/sales/');
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

  const handleCancelSale = async (saleId: number) => {
    if (!confirm(`¿Estás segura de cancelar la Venta #${saleId}? El stock de los productos será devuelto automáticamente al inventario.`)) {
      return;
    }

    setCancellingId(saleId);
    try {
      await api.post(`/sales/sales/${saleId}/cancel/`);
      setFeedback({
        type: 'success',
        message: `Venta #${saleId} cancelada exitosamente y stock reincorporado.`,
      });
      fetchRecentSales();
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'No se pudo cancelar la venta.';
      alert(`Error: ${errorMsg}`);
    } finally {
      setCancellingId(null);
    }
  };

  // Registrar Abono Subsecuente
  const handleOpenPaymentModal = (sale: Sale) => {
    setActiveSaleForPayment(sale);
    setAbonoAmount('');
    setAbonoReference('');
    setIsPaymentModalOpen(true);
  };

  const handleSubmitAbono = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSaleForPayment) return;

    const amountNum = parseFloat(abonoAmount);
    const balanceDueNum = parseFloat(activeSaleForPayment.balance_due || '0');

    if (!amountNum || amountNum <= 0) {
      alert('Ingresa un monto válido para el abono.');
      return;
    }

    if (amountNum > balanceDueNum) {
      alert(`El abono no puede ser mayor al saldo pendiente ($${balanceDueNum.toFixed(2)}).`);
      return;
    }

    setSubmittingAbono(true);
    try {
      await api.post('/sales/payments/', {
        sale: activeSaleForPayment.id,
        amount: amountNum,
        payment_method: abonoMethod,
        reference: abonoReference.trim() || 'Abono Subsecuente POS'
      });

      alert(`¡Abono de $${amountNum.toFixed(2)} registrado exitosamente para la Venta #${activeSaleForPayment.id}!`);
      setIsPaymentModalOpen(false);
      setActiveSaleForPayment(null);
      fetchRecentSales();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.response?.data?.detail || 'No se pudo registrar el abono.';
      alert(`Error: ${errorMsg}`);
    } finally {
      setSubmittingAbono(false);
    }
  };

  // 1. Filtrar productos por el inventario activo (Interno o CEDIS), categoría y búsqueda
  const filteredProducts = products.filter((p) => {
    const matchesInventory = (p.inventory_type || 'INTERNO') === posInventoryType;
    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesInventory && matchesCategory && matchesSearch;
  });

  const selectedProduct = products.find((p) => p.id === Number(selectedProductId));
  const unitPrice = selectedProduct ? parseFloat(selectedProduct.public_price) : 0;
  const totalAmount = unitPrice * quantity;

  const effectivePayment =
    saleType === 'CONTADO'
      ? totalAmount
      : Math.min(parseFloat(initialPayment) || 0, totalAmount);

  const balanceDue = Math.max(0, totalAmount - effectivePayment);

  const handleSelectProduct = (product: Product) => {
    setSelectedProductId(product.id);
    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  // Cambio de almacén (Limpia el producto seleccionado para evitar mezclar almacenes)
  const handleInventorySwitch = (type: 'INTERNO' | 'CEDIS') => {
    setPosInventoryType(type);
    setSelectedProductId('');
    setSearchQuery('');
  };

  // Procesar Venta
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
        sale_type: saleType,
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
          reference: 'Pago Inicial POS',
        },
      };

      const response = await api.post<Sale>('/sales/sales/', payload);
      setLastCreatedSale(response.data);

      setFeedback({
        type: 'success',
        message: `¡Venta #${response.data.id} registrada exitosamente desde ${posInventoryType}!`,
      });

      // Limpiar formulario
      setCustomerName('');
      setQuantity(1);
      setInitialPayment('');
      setSelectedProductId('');
      
      // Actualizar stock localmente
      setProducts((prev) =>
        prev.map((p) => (p.id === Number(selectedProductId) ? { ...p, stock: p.stock - quantity } : p))
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
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Encabezado y Selector de Inventario */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Punto de Venta (POS)</h1>
          <p className="text-xs text-slate-500">
            Surtido actual desde: <strong className="text-fuchsia-600">{posInventoryType === 'INTERNO' ? 'Inventario Interno' : 'Centro de Distribución (CEDIS)'}</strong>
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Pestañas para cambiar entre Interno y CEDIS */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => handleInventorySwitch('INTERNO')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                posInventoryType === 'INTERNO' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              🏠 Interno
            </button>
            <button
              type="button"
              onClick={() => handleInventorySwitch('CEDIS')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                posInventoryType === 'CEDIS' ? 'bg-fuchsia-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              🏭 CEDIS
            </button>
          </div>

          <button
            type="button"
            onClick={handleOpenModal}
            className="bg-white hover:bg-slate-50 text-slate-700 px-4 py-3 rounded-2xl text-xs font-bold transition flex items-center gap-2 border border-slate-200 shadow-sm"
          >
            <span>📋</span> Historial
          </button>
        </div>
      </div>

      {feedback && (
        <div className={`p-4 rounded-2xl text-xs font-bold border transition-all ${
          feedback.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-rose-50 text-rose-900 border-rose-200'
        }`}>
          {feedback.message}
          {lastCreatedSale && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => downloadTicketPDF(lastCreatedSale)}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition"
              >
                📥 Descargar Ticket PDF (Venta #{lastCreatedSale.id})
              </button>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Panel Principal de Captura */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-pink-100 shadow-xl shadow-pink-500/5 space-y-6">
          
          {/* Modalidad de Venta */}
          <div>
            <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">
              Modalidad de Venta
            </label>
            <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100/80 rounded-2xl">
              {(['CONTADO', 'CREDITO', 'ANTICIPO'] as const).map((type) => (
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
                  {type.toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Cliente y Selector de Categorías de Aromas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Cliente Final</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nombre del cliente..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-medium text-slate-900 focus:border-fuchsia-400 outline-none transition"
              />
            </div>

            {/* Selector de Categorías */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Filtrar por Categoría</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-medium text-slate-900 focus:border-fuchsia-400 outline-none transition"
              >
                <option value="ALL">Todas las Categorías ({filteredProducts.length} en {posInventoryType})</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Buscador de Fragancias / Productos */}
          <div className="relative">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Seleccionar Perfume / Producto ({fetchingData ? 'Cargando...' : `${filteredProducts.length} disponibles en ${posInventoryType}`})
            </label>
            
            <div
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-medium text-slate-900 cursor-pointer flex justify-between items-center hover:border-fuchsia-300 transition"
            >
              <span className="truncate">
                {selectedProduct
                  ? `[${selectedProduct.code}] ${selectedProduct.name} - $${selectedProduct.public_price}`
                  : `Seleccionar fragancia del ${posInventoryType}...`}
              </span>
              <span className="text-slate-400 text-xs">▼</span>
            </div>

            {isDropdownOpen && (
              <div className="absolute z-20 top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl p-3 space-y-2">
                <input
                  type="text"
                  autoFocus
                  placeholder={`Buscar en ${posInventoryType} por nombre o SKU...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                />
                <div className="max-h-56 overflow-y-auto space-y-1">
                  {filteredProducts.length === 0 ? (
                    <div className="p-3 text-xs text-slate-400 text-center">No se encontraron fragancias en {posInventoryType}</div>
                  ) : (
                    filteredProducts.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => handleSelectProduct(p)}
                        className={`p-2.5 rounded-xl text-xs flex justify-between items-center cursor-pointer transition ${
                          selectedProductId === p.id ? 'bg-fuchsia-50 text-fuchsia-900 font-bold' : 'hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <div>
                          <p className="font-semibold">{p.name}</p>
                          <p className="text-[10px] text-slate-400">Código: {p.code} | {p.category_name || 'General'}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-fuchsia-600">${p.public_price}</p>
                          <p className="text-[10px] text-slate-500">Stock: {p.stock}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
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
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-medium text-slate-900 focus:border-fuchsia-400 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Método de Pago</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-medium text-slate-900 focus:border-fuchsia-400 outline-none transition"
              >
                <option value="EFECTIVO">Efectivo</option>
                <option value="TRANSFERENCIA">Transferencia SPEI</option>
                <option value="TARJETA">Tarjeta Débito / Crédito</option>
              </select>
            </div>
          </div>

          {/* Anticipo o Crédito */}
          {(saleType === 'ANTICIPO' || saleType === 'CREDITO') && (
            <div className="p-5 bg-gradient-to-r from-pink-50 to-fuchsia-50 rounded-2xl border border-pink-200/60 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-extrabold text-fuchsia-900 mb-1">
                  {saleType === 'ANTICIPO' ? 'Monto del Anticipo ($)' : 'Abono Inicial ($)'}
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
                <label className="block text-[11px] font-extrabold text-fuchsia-900 mb-1">Saldo Restante ($)</label>
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
            disabled={loading || fetchingData || !selectedProductId}
            className="w-full bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:opacity-95 disabled:opacity-50 text-white font-extrabold py-4 rounded-2xl text-xs tracking-wide transition shadow-xl shadow-fuchsia-500/20 hover:scale-[1.01]"
          >
            {loading ? 'PROCESANDO VENTA...' : `⚡ PROCESAR VENTA (${posInventoryType})`}
          </button>
        </div>

        {/* Panel Resumen de Operación */}
        <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-xl shadow-pink-500/5 space-y-4 h-fit">
          <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-3 flex justify-between items-center">
            <span>Resumen POS</span>
            <span className="text-[10px] bg-fuchsia-100 text-fuchsia-800 px-2 py-0.5 rounded-md font-black">{posInventoryType}</span>
          </h3>
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
              <span className="font-bold text-slate-800 truncate max-w-[130px]">
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

      {/* Modal de Historial y Cancelaciones */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Historial de Ventas Recientes</h2>
                <p className="text-xs text-slate-500">Control de pagos, créditos, abonos y tickets</p>
              </div>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-200/60 text-slate-600 hover:bg-slate-200 font-bold text-sm transition flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
              {fetchingSales ? (
                <p className="text-center text-xs text-slate-400 py-8">Cargando ventas...</p>
              ) : recentSales.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-8">No hay ventas registradas aún.</p>
              ) : (
                recentSales.map((sale) => (
                  <div key={sale.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs text-slate-900">Venta #{sale.id}</span>
                          <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-fuchsia-100 text-fuchsia-800">
                            {sale.sale_type}
                          </span>
                          {sale.status === 'PAGADO' ? (
                            <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">Liquidado</span>
                          ) : sale.status === 'CANCELADO' ? (
                            <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-rose-100 text-rose-800">Cancelada</span>
                          ) : (
                            <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">Pendiente</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600">Cliente: {sale.customer_name || 'General'}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => downloadTicketPDF(sale)}
                          className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-3 py-1.5 rounded-xl text-xs font-bold transition"
                          title="Descargar Ticket PDF"
                        >
                          📥 PDF
                        </button>

                        {sale.status !== 'CANCELADO' && sale.status !== 'PAGADO' && sale.sale_type !== 'CONTADO' && (
                          <button
                            type="button"
                            onClick={() => handleOpenPaymentModal(sale)}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold transition"
                          >
                            💵 Abonar
                          </button>
                        )}

                        {sale.status !== 'CANCELADO' && (
                          <button
                            type="button"
                            onClick={() => handleCancelSale(sale.id)}
                            disabled={cancellingId === sale.id}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 px-3 py-1.5 rounded-xl text-xs font-bold transition disabled:opacity-50"
                          >
                            {cancellingId === sale.id ? '...' : 'Cancelar'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Desglose de Progreso de Pago para Crédito / Anticipo */}
                    {sale.sale_type !== 'CONTADO' && (
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 text-[11px]">
                        <div>
                          <span className="text-slate-400 block">Total:</span>
                          <strong className="text-slate-800">${sale.total_amount}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Pagado:</span>
                          <strong className="text-emerald-600">${sale.paid_amount || '0.00'}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Por Cobrar:</span>
                          <strong className="text-rose-600">${sale.balance_due || '0.00'}</strong>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

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

      {/* Modal para Registrar Abono Subsecuente */}
      {isPaymentModalOpen && activeSaleForPayment && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-100 p-6 space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900">Registrar Abono</h3>
                <p className="text-xs text-slate-500">Venta #{activeSaleForPayment.id} | {activeSaleForPayment.customer_name}</p>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold text-xs flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            <div className="bg-fuchsia-50/60 p-4 rounded-2xl border border-fuchsia-100 flex justify-between text-xs font-bold text-fuchsia-900">
              <span>Saldo Pendiente Actual:</span>
              <span className="text-rose-600 text-sm">${activeSaleForPayment.balance_due}</span>
            </div>

            <form onSubmit={handleSubmitAbono} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Monto del Abono ($)</label>
                <input
                  type="number"
                  step="0.01"
                  autoFocus
                  placeholder="0.00"
                  value={abonoAmount}
                  onChange={(e) => setAbonoAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-900 outline-none focus:border-fuchsia-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Método de Pago</label>
                <select
                  value={abonoMethod}
                  onChange={(e) => setAbonoMethod(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-900 outline-none focus:border-fuchsia-500"
                >
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="TRANSFERENCIA">Transferencia SPEI</option>
                  <option value="TARJETA">Tarjeta Débito / Crédito</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Referencia o Folio (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej. Comprobante SPEI 1234"
                  value={abonoReference}
                  onChange={(e) => setAbonoReference(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-900 outline-none focus:border-fuchsia-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingAbono}
                  className="w-1/2 bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:opacity-95 text-white font-bold py-3 rounded-xl transition shadow-md disabled:opacity-50"
                >
                  {submittingAbono ? 'Guardando...' : 'Aplicar Abono'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}