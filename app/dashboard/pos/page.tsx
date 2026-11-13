'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
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
  inventory_type: 'INTERNO' | 'CEDIS';
}

interface CartItem {
  product: Product;
  quantity: number;
  unit_price: number;
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
  const [posInventoryType, setPosInventoryType] = useState<'INTERNO' | 'CEDIS'>('INTERNO');
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | 'ALL'>('ALL');

  // Estados del Carrito y Selección
  const [cart, setCart] = useState<CartItem[]>([]);
  const [priceTier, setPriceTier] = useState<'PUBLIC' | 'SELLER'>('PUBLIC');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  // Estados del formulario de Venta
  const [saleType, setSaleType] = useState<'CONTADO' | 'CREDITO' | 'ANTICIPO'>('CONTADO');
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
        reference: abonoReference.trim() || 'Abono Subsecuente POS',
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

  // Filtrar productos por almacén activo, categoría y búsqueda
  const filteredProducts = products.filter((p) => {
    const matchesInventory = (p.inventory_type || 'INTERNO') === posInventoryType;
    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesInventory && matchesCategory && matchesSearch;
  });

  // Cambio de almacén (limpia carrito para no mezclar almacenes en un mismo ticket)
  const handleInventorySwitch = (type: 'INTERNO' | 'CEDIS') => {
    if (cart.length > 0 && type !== posInventoryType) {
      if (!confirm('Al cambiar de almacén se vaciará el carrito actual. ¿Continuar?')) return;
    }
    setPosInventoryType(type);
    setCart([]);
    setSearchQuery('');
  };

  // Cambio de lista de precios (recalcula los precios de los productos ya agregados al carrito)
  // Cambio de lista de precios (aplica o quita el 30% a los productos ya agregados)
  const handlePriceTierSwitch = (tier: 'PUBLIC' | 'SELLER') => {
    setPriceTier(tier);
    setCart((prev) =>
      prev.map((item) => {
        let basePrice = tier === 'PUBLIC' 
          ? parseFloat(item.product.public_price) 
          : parseFloat(item.product.seller_price);

        if (tier === 'SELLER') {
          basePrice = basePrice * 0.70; // Aplica el 30% de descuento
        }

        return {
          ...item,
          unit_price: basePrice,
        };
      })
    );
  };

  // Agregar producto al carrito (con 30% de descuento si es Precio Vendedora)
  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert(`"${product.name}" está agotado en ${posInventoryType}.`);
      return;
    }

    let price = priceTier === 'PUBLIC' 
      ? parseFloat(product.public_price) 
      : parseFloat(product.seller_price);

    // Si la tarifa activa es VENDEDORA, aplicamos el 30% de descuento (multiplicando por 0.70)
    if (priceTier === 'SELLER') {
      price = price * 0.70;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity + 1 > product.stock) {
          alert(`Stock máximo alcanzado (${product.stock} uds. disponibles).`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1, unit_price: price }];
    });

    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  // Modificar cantidad o quitar del carrito
  const handleUpdateCartQty = (productId: number, newQty: number) => {
    if (newQty <= 0) {
      setCart((prev) => prev.filter((item) => item.product.id !== productId));
      return;
    }

    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id !== productId) return item;
        if (newQty > item.product.stock) {
          alert(`Solo hay ${item.product.stock} unidades disponibles.`);
          return item;
        }
        return { ...item, quantity: newQty };
      })
    );
  };

  const handleRemoveFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Cálculos totales del carrito
  const totalItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalAmount = cart.reduce((acc, item) => acc + item.unit_price * item.quantity, 0);

  const effectivePayment =
    saleType === 'CONTADO'
      ? totalAmount
      : Math.min(parseFloat(initialPayment) || 0, totalAmount);

  const balanceDue = Math.max(0, totalAmount - effectivePayment);

  // Procesar Venta Multi-producto
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (cart.length === 0) {
      setFeedback({ type: 'error', message: 'Agrega al menos un producto al carrito para continuar.' });
      return;
    }

    setLoading(true);

    try {
      const payload = {
        customer_name: customerName.trim() || 'Cliente Mostrador',
        sale_type: saleType,
        input_items: cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
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
        message: `¡Venta #${response.data.id} (${totalItemsCount} piezas) registrada exitosamente desde ${posInventoryType}!`,
      });

      // Descontar stock localmente de todos los productos vendidos
      setProducts((prev) =>
        prev.map((p) => {
          const soldItem = cart.find((item) => item.product.id === p.id);
          return soldItem ? { ...p, stock: p.stock - soldItem.quantity } : p;
        })
      );

      // Limpiar carrito y formulario
      setCart([]);
      setCustomerName('');
      setInitialPayment('');
    } catch (err: any) {
      const errorData = err.response?.data;
      const errorMsg =
        (Array.isArray(errorData) && errorData[0]) ||
        errorData?.non_field_errors?.[0] ||
        errorData?.detail ||
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
            Surtido actual desde:{' '}
            <strong className="text-fuchsia-600">
              {posInventoryType === 'INTERNO' ? 'Inventario Interno' : 'Centro de Distribución (CEDIS)'}
            </strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Pestañas Interno / CEDIS */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => handleInventorySwitch('INTERNO')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                posInventoryType === 'INTERNO'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              🏠 Interno
            </button>
            <button
              type="button"
              onClick={() => handleInventorySwitch('CEDIS')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                posInventoryType === 'CEDIS'
                  ? 'bg-fuchsia-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
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
        <div
          className={`p-4 rounded-2xl text-xs font-bold border transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
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
        {/* Panel Principal de Captura y Carrito */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-pink-100 shadow-xl shadow-pink-500/5 space-y-6">
          {/* Modalidad de Venta y Lista de Precios */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                Modalidad de Venta
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-slate-100/80 rounded-2xl">
                {(['CONTADO', 'CREDITO', 'ANTICIPO'] as const).map((type) => (
                  <button
                    type="button"
                    key={type}
                    onClick={() => setSaleType(type)}
                    className={`py-2.5 rounded-xl text-xs font-bold capitalize transition-all duration-200 ${
                      saleType === type
                        ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow-md'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {type.toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                Tarifa de Precio
              </label>
              <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-slate-100/80 rounded-2xl">
                <button
                  type="button"
                  onClick={() => handlePriceTierSwitch('PUBLIC')}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                    priceTier === 'PUBLIC'
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Precio Público
                </button>
                <button
                  type="button"
                  onClick={() => handlePriceTierSwitch('SELLER')}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                    priceTier === 'SELLER'
                      ? 'bg-fuchsia-600 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Precio Vendedora
                </button>
              </div>
            </div>
          </div>

          {/* Cliente y Selector de Categorías */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Cliente / Vendedora</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nombre del cliente..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-medium text-slate-900 focus:border-fuchsia-400 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Filtrar por Categoría</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-medium text-slate-900 focus:border-fuchsia-400 outline-none transition"
              >
                <option value="ALL">Todas las Categorías ({filteredProducts.length} en {posInventoryType})</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Buscador para Agregar Múltiples Productos */}
          <div className="relative">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Agregar Producto al Carrito ({fetchingData ? 'Cargando...' : `${filteredProducts.length} disponibles`})
            </label>

            <div
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-medium text-slate-600 cursor-pointer flex justify-between items-center hover:border-fuchsia-400 transition"
            >
              <span>+ Buscar y agregar fragancia o producto...</span>
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
                    <div className="p-3 text-xs text-slate-400 text-center">
                      No se encontraron productos en {posInventoryType}
                    </div>
                  ) : (
                    filteredProducts.map((p) => {
                      const activePrice = priceTier === 'PUBLIC' ? p.public_price : p.seller_price;
                      return (
                        <div
                          key={p.id}
                          onClick={() => handleAddToCart(p)}
                          className={`p-2.5 rounded-xl text-xs flex justify-between items-center cursor-pointer transition ${
                            p.stock <= 0 ? 'opacity-50 bg-slate-50' : 'hover:bg-fuchsia-50 text-slate-800'
                          }`}
                        >
                          <div>
                            <p className="font-semibold">{p.name}</p>
                            <p className="text-[10px] text-slate-400">
                              Código: {p.code} | {p.category_name || 'General'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-fuchsia-600">${activePrice}</p>
                            <p className={`text-[10px] font-bold ${p.stock <= 0 ? 'text-rose-500' : 'text-slate-500'}`}>
                              {p.stock <= 0 ? 'Agotado' : `Stock: ${p.stock}`}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Lista de Productos Agregados (Carrito) */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-700">
                Productos en el Ticket ({cart.length} SKUs / {totalItemsCount} pzas)
              </label>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCart([])}
                  className="text-[11px] font-bold text-rose-500 hover:underline"
                >
                  Vaciar carrito
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-400">
                Aún no has agregado productos. Usa el buscador de arriba para armar la venta.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                {cart.map((item) => (
                  <div key={item.product.id} className="p-3 bg-slate-50/50 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900 truncate">{item.product.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {item.product.code} · ${item.unit_price.toFixed(2)} c/u
                      </p>
                    </div>

                    {/* Controles de Cantidad */}
                    <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1">
                      <button
                        type="button"
                        onClick={() => handleUpdateCartQty(item.product.id, item.quantity - 1)}
                        className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-slate-700"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={item.product.stock}
                        value={item.quantity}
                        onChange={(e) => handleUpdateCartQty(item.product.id, parseInt(e.target.value) || 1)}
                        className="w-10 text-center font-bold text-slate-900 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleUpdateCartQty(item.product.id, item.quantity + 1)}
                        className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-slate-700"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right w-20 font-bold text-slate-900">
                      ${(item.unit_price * item.quantity).toFixed(2)}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveFromCart(item.product.id)}
                      className="text-slate-400 hover:text-rose-600 font-bold px-1"
                      title="Quitar producto"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Método de Pago */}
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
            disabled={loading || fetchingData || cart.length === 0}
            className="w-full bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:opacity-95 disabled:opacity-50 text-white font-extrabold py-4 rounded-2xl text-xs tracking-wide transition shadow-xl shadow-fuchsia-500/20 hover:scale-[1.01]"
          >
            {loading ? 'PROCESANDO VENTA...' : `⚡ PROCESAR VENTA (${posInventoryType})`}
          </button>
        </div>

        {/* Panel Resumen de Operación */}
        <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-xl shadow-pink-500/5 space-y-4 h-fit">
          <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-3 flex justify-between items-center">
            <span>Resumen POS</span>
            <span className="text-[10px] bg-fuchsia-100 text-fuchsia-800 px-2 py-0.5 rounded-md font-black">
              {posInventoryType}
            </span>
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
              <span>Tarifa Aplicada:</span>
              <span className="font-bold text-slate-800">
                {priceTier === 'PUBLIC' ? 'Público' : 'Vendedora'}
              </span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Artículos:</span>
              <span className="font-bold text-slate-800">
                {cart.length} ({totalItemsCount} pzas)
              </span>
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
                            <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                              Liquidado
                            </span>
                          ) : sale.status === 'CANCELADO' ? (
                            <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-rose-100 text-rose-800">
                              Cancelada
                            </span>
                          ) : (
                            <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                              Pendiente
                            </span>
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
                <p className="text-xs text-slate-500">
                  Venta #{activeSaleForPayment.id} | {activeSaleForPayment.customer_name}
                </p>
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