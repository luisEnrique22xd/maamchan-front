'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

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

  const handleCancelSale = async (saleId: number) => {
    if (!confirm(`¿Estás segura de cancelar la Venta #${saleId}? El stock de los productos será devuelto automáticamente al inventario.`)) {
      return;
    }

    setCancellingId(saleId);
    try {
      await api.post(`/sales/${saleId}/cancel/`);
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

  // Filtrado de productos por categoría y búsqueda
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
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

      const response = await api.post<Sale>('/sales/', payload);
      setLastCreatedSale(response.data);

      setFeedback({
        type: 'success',
        message: `¡Venta #${response.data.id} registrada exitosamente!`,
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

  // Generador de Ticket imprimible / PDF simulado
  const handlePrintTicket = (sale: Sale) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Ticket de Venta #${sale.id} - Madame Chantal</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; font-size: 12px; width: 300px; margin: 0 auto; padding: 20px; color: #000; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .line { border-bottom: 1px dashed #000; margin: 10px 0; }
            table { width: 100%; border-collapse: collapse; }
            th, td { text-align: left; padding: 4px 0; }
            .right { text-align: right; }
          </style>
        </head>
        <body>
          <div class="center">
            <h2 style="margin:0;">MADAME CHANTAL</h2>
            <p style="margin:2px 0;">Red de Distribución de Fragancias</p>
            <p style="margin:2px 0; font-size: 10px;">Huamantla, Tlaxcala</p>
          </div>
          <div class="line"></div>
          <p><strong>Folio Venta:</strong> #${sale.id}</p>
          <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Cliente:</strong> ${sale.customer_name || 'General'}</p>
          <p><strong>Tipo:</strong> ${sale.sale_type}</p>
          <div class="line"></div>
          <table>
            <thead>
              <tr>
                <th>Cant / Prod</th>
                <th class="right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${sale.items?.map(item => `
                <tr>
                  <td>${item.quantity}x ${item.product_name}</td>
                  <td class="right">$${item.subtotal}</td>
                </tr>
              `).join('') || ''}
            </tbody>
          </table>
          <div class="line"></div>
          <div class="right">
            <p style="margin:2px 0;"><strong>Total: $${sale.total_amount}</strong></p>
            <p style="margin:2px 0;">Pagado: $${sale.paid_amount || '0.00'}</p>
            <p style="margin:2px 0;">Saldo Pendiente: $${sale.balance_due || '0.00'}</p>
          </div>
          <div class="line"></div>
          <div class="center" style="font-size: 10px; margin-top: 15px;">
            <p>¡Gracias por su preferencia!</p>
            <p>Conserve este comprobante para cualquier aclaración.</p>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Encabezado */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Punto de Venta (POS)</h1>
          <p className="text-xs text-slate-500">Selección de aromas y control de transacciones en tiempo real</p>
        </div>
        
        <button
          onClick={handleOpenModal}
          className="bg-white hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 border border-slate-200 shadow-sm"
        >
          <span>📋</span> Historial y Cancelaciones
        </button>
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
                onClick={() => handlePrintTicket(lastCreatedSale)}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition"
              >
                🖨️ Imprimir / Descargar Ticket PDF (Venta #{lastCreatedSale.id})
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
                <option value="ALL">Todas las Categorías ({products.length} SKUs)</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Buscador de Fragancias / Productos */}
          <div className="relative">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Seleccionar Perfume / Producto ({fetchingData ? 'Cargando...' : `${filteredProducts.length} disponibles`})
            </label>
            
            <div
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-medium text-slate-900 cursor-pointer flex justify-between items-center hover:border-fuchsia-300 transition"
            >
              <span className="truncate">
                {selectedProduct
                  ? `[${selectedProduct.code}] ${selectedProduct.name} - $${selectedProduct.public_price}`
                  : 'Seleccionar fragancia del catálogo...'}
              </span>
              <span className="text-slate-400 text-xs">▼</span>
            </div>

            {isDropdownOpen && (
              <div className="absolute z-20 top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl p-3 space-y-2">
                <input
                  type="text"
                  autoFocus
                  placeholder="Buscar por nombre o SKU de fragancia..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                />
                <div className="max-h-56 overflow-y-auto space-y-1">
                  {filteredProducts.length === 0 ? (
                    <div className="p-3 text-xs text-slate-400 text-center">No se encontraron fragancias</div>
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
                          <p className="text-[10px] text-slate-400">Código: {p.code} • {p.category_name || 'General'}</p>
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
            {loading ? 'PROCESANDO VENTA...' : '⚡ PROCESAR Y GENERAR TICKET'}
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
                <p className="text-xs text-slate-500">Consulta operaciones y reimprime o cancela folios</p>
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
                  <div key={sale.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-slate-900">Venta #{sale.id}</span>
                        <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-fuchsia-100 text-fuchsia-800">
                          {sale.sale_type}
                        </span>
                        {sale.status === 'CANCELADO' && (
                          <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-rose-100 text-rose-800">
                            Cancelada
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600">Cliente: {sale.customer_name || 'General'}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-sm text-slate-900">${sale.total_amount}</span>
                      
                      <button
                        type="button"
                        onClick={() => handlePrintTicket(sale)}
                        className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-3 py-1.5 rounded-xl text-xs font-bold transition"
                      >
                        🖨️ Ticket
                      </button>

                      {sale.status !== 'CANCELADO' && (
                        <button
                          type="button"
                          onClick={() => handleCancelSale(sale.id)}
                          disabled={cancellingId === sale.id}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 px-3 py-1.5 rounded-xl text-xs font-bold transition disabled:opacity-50"
                        >
                          {cancellingId === sale.id ? 'Anulando...' : 'Cancelar'}
                        </button>
                      )}
                    </div>
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
    </div>
  );
}