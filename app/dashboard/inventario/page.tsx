'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Category {
  id: number;
  name: string;
}

interface Product {
  id: number;
  code: string;
  name: string;
  category: number;
  category_name: string;
  public_price: string;
  seller_price: string;
  stock: number;
  min_stock: number;
  is_low_stock: boolean;
}

export default function InventarioPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Estado para el Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: '',
    public_price: '',
    seller_price: '',
    stock: '',
    min_stock: '5',
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get('/sales/products/'),
        api.get('/sales/categories/'),
      ]);

      const prodData = Array.isArray(prodRes.data) ? prodRes.data : prodRes.data.results;
      const catData = Array.isArray(catRes.data) ? catRes.data : catRes.data.results;

      setProducts(prodData || []);
      setCategories(catData || []);
    } catch (error) {
      console.error('Error al obtener el inventario:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        code: product.code,
        name: product.name,
        category: product.category.toString(),
        public_price: product.public_price,
        seller_price: product.seller_price,
        stock: product.stock.toString(),
        min_stock: product.min_stock.toString(),
      });
    } else {
      setEditingProduct(null);
      setFormData({
        code: '',
        name: '',
        category: categories.length > 0 ? categories[0].id.toString() : '',
        public_price: '',
        seller_price: '',
        stock: '0',
        min_stock: '5',
      });
    }
    setIsModalOpen(true);
  };

  // Única función correcta usando la instancia 'api'
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        code: formData.code,
        name: formData.name,
        category: parseInt(formData.category),
        public_price: parseFloat(formData.public_price),
        seller_price: parseFloat(formData.seller_price),
        stock: parseInt(formData.stock),
        min_stock: parseInt(formData.min_stock),
      };

      if (editingProduct) {
        await api.patch(`/sales/products/${editingProduct.id}/`, payload);
      } else {
        await api.post('/sales/products/', payload);
      }

      setIsModalOpen(false);
      fetchInventory();
    } catch (error: any) {
      console.error('Error al guardar el producto:', error.response?.data || error);
      alert('Ocurrió un error al guardar el producto. Revisa los campos.');
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'ALL' || p.category.toString() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Catálogo e Inventario</h1>
          <p className="text-xs text-slate-500 mt-1">
            Gestión de productos, existencias y precios del almacén Tlaxcala.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center justify-center bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white font-bold px-5 py-3 rounded-2xl text-xs shadow-lg shadow-fuchsia-900/20 hover:scale-105 active:scale-95 transition"
        >
          + Agregar Nuevo Producto
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white p-4 rounded-3xl border border-pink-100 shadow-xl shadow-pink-500/5 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Buscar por código o producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-fuchsia-500 transition"
          />
          <span className="absolute left-3.5 top-3 text-slate-400 text-xs">🔍</span>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:border-fuchsia-500"
          >
            <option value="ALL">Todas las Categorías</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id.toString()}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla de Productos */}
      <div className="bg-white rounded-3xl border border-pink-100 shadow-xl shadow-pink-500/5 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400 font-medium">
              Cargando catálogo de productos...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 font-medium">
              No se encontraron productos registrados.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-400 uppercase font-bold tracking-wider">
                <tr>
                  <th className="p-4 pl-6">Código / SKU</th>
                  <th className="p-4">Producto</th>
                  <th className="p-4">Categoría</th>
                  <th className="p-4">P. Público</th>
                  <th className="p-4">P. Vendedora</th>
                  <th className="p-4">Stock</th>
                  <th className="p-4 text-right pr-6">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-pink-50/30 transition">
                    <td className="p-4 pl-6 font-mono font-bold text-slate-900">{p.code}</td>
                    <td className="p-4 font-bold text-slate-900">{p.name}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-xl bg-slate-100 font-semibold text-slate-600">
                        {p.category_name || 'Sin Categ.'}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-900">
                      ${Number(p.public_price).toFixed(2)}
                    </td>
                    <td className="p-4 font-bold text-fuchsia-600">
                      ${Number(p.seller_price).toFixed(2)}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-black ${
                          p.stock <= 0
                            ? 'bg-rose-100 text-rose-800'
                            : p.is_low_stock
                            ? 'bg-amber-100 text-amber-800 animate-pulse'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {p.stock <= 0
                          ? 'Agotado'
                          : p.is_low_stock
                          ? `Bajo: ${p.stock}`
                          : `${p.stock} uds.`}
                      </span>
                    </td>
                    <td className="p-4 text-right pr-6">
                      <button
                        onClick={() => handleOpenModal(p)}
                        className="text-fuchsia-600 font-bold hover:underline"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal para Crear / Editar Producto */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-pink-100 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-black text-slate-900 mb-4">
              {editingProduct ? 'Editar Producto' : 'Agregar Nuevo Producto'}
            </h3>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase">Código / SKU</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full mt-1 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono focus:outline-none focus:border-fuchsia-500"
                  placeholder="EJ: MC-101"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase">Nombre del Producto</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full mt-1 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-fuchsia-500"
                  placeholder="Perfume Madame Rosé 100ml"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase">Categoría</label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full mt-1 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-fuchsia-500"
                >
                  <option value="" disabled>Selecciona una categoría...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase">P. Público</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.public_price}
                    onChange={(e) => setFormData({ ...formData, public_price: e.target.value })}
                    className="w-full mt-1 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-fuchsia-500"
                    placeholder="350.00"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase">P. Vendedora</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.seller_price}
                    onChange={(e) => setFormData({ ...formData, seller_price: e.target.value })}
                    className="w-full mt-1 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-fuchsia-500"
                    placeholder="210.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Stock Inicial</label>
                  <input
                    type="number"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full mt-1 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-fuchsia-500"
                    placeholder="15"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Stock Mínimo</label>
                  <input
                    type="number"
                    required
                    value={formData.min_stock}
                    onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                    className="w-full mt-1 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-fuchsia-500"
                    placeholder="5"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/2 py-3 rounded-2xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-3 rounded-2xl bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white font-bold text-xs shadow-lg shadow-fuchsia-900/20 hover:scale-105 active:scale-95 transition"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}