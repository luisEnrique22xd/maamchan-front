'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function RegisterUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name_paternal: '',
    last_name_maternal: '',
    street: '',
    neighborhood: '',
    municipality: '',
    state: '',
    email: '',
    nexen_user: '',
    password: '',
    role_primary: 'VENDEDORA',
    rank: 'BRILLANTE',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

 const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setLoading(true);

    try {
      // Enviamos email también como username por compatibilidad con Django AbstractUser
      const payload = {
        ...formData,
        username: formData.email,
      };

      const response = await api.post('/users/', payload);

      setFeedback({
        type: 'success',
        message: `¡Usuaria "${formData.first_name}" registrada con éxito!`,
      });

      // Limpiar el formulario tras guardar
      setFormData({
        first_name: '',
        last_name_paternal: '',
        last_name_maternal: '',
        street: '',
        neighborhood: '',
        municipality: '',
        state: '',
        email: '',
        nexen_user: '',
        password: '',
        role_primary: 'VENDEDORA',
        rank: 'BRILLANTE',
      });

    } catch (err: any) {
      console.error('Error detallado del servidor:', err.response?.data);
      
      // Si Django devuelve un objeto de errores por campo, mostramos el detalle
      let errorMsg = 'Ocurrió un error al registrar el usuario.';
      if (err.response?.data) {
        const errors = err.response.data;
        if (typeof errors === 'object') {
          const firstKey = Object.keys(errors)[0];
          const firstVal = Array.isArray(errors[firstKey]) ? errors[firstKey][0] : errors[firstKey];
          errorMsg = `Error en [${firstKey}]: ${firstVal}`;
        } else if (typeof errors === 'string') {
          errorMsg = errors;
        }
      }
      
      setFeedback({ type: 'error', message: errorMsg });
    } finally {
      setLoading(false);
      setTimeout(() => {
  router.push('/dashboard/usuarios'); // Asegúrate de que esta carpeta exista en app/dashboard/expediente/page.tsx
}, 1500);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] py-10 px-4 flex flex-col justify-center items-center">
      <div className="w-full max-w-3xl space-y-6">
        
        {/* Tarjeta Blanca Principal (Mismo estilo que el Login) */}
        <div className="bg-white p-8 md:p-10 rounded-3xl shadow-2xl border border-slate-100 space-y-8">
          
          {/* Encabezado IDÉNTICO al Login */}
          <div className="flex justify-between items-center border-b border-slate-100 pb-6">
            <div>
              <h1 className="text-2xl font-black text-fuchsia-600 tracking-tight">Madam RED</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Registro de Nueva Vendedora / Alta de Expediente</p>
            </div>
            <button
              type="button"
              onClick={() => router.back()}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1"
            >
              <span>←</span> Volver
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

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* SECCIÓN 1: DATOS PERSONALES */}
            <div className="space-y-3">
              <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider border-l-4 border-fuchsia-600 pl-2">
                1. Datos Personales
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Nombre(s) *</label>
                  <input
                    type="text"
                    name="first_name"
                    required
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="Ej. María"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-fuchsia-500 focus:bg-white outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Apellido Paterno *</label>
                  <input
                    type="text"
                    name="last_name_paternal"
                    required
                    value={formData.last_name_paternal}
                    onChange={handleChange}
                    placeholder="Ej. López"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-fuchsia-500 focus:bg-white outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Apellido Materno</label>
                  <input
                    type="text"
                    name="last_name_maternal"
                    value={formData.last_name_maternal}
                    onChange={handleChange}
                    placeholder="Ej. Pérez"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-fuchsia-500 focus:bg-white outline-none transition"
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: DIRECCIÓN */}
            <div className="space-y-3 pt-2">
              <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider border-l-4 border-fuchsia-600 pl-2">
                2. Dirección de Residencia
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Calle y Número *</label>
                  <input
                    type="text"
                    name="street"
                    required
                    value={formData.street}
                    onChange={handleChange}
                    placeholder="Ej. Av. Juárez #123"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-fuchsia-500 focus:bg-white outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Colonia / Localidad *</label>
                  <input
                    type="text"
                    name="neighborhood"
                    required
                    value={formData.neighborhood}
                    onChange={handleChange}
                    placeholder="Ej. Centro"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-fuchsia-500 focus:bg-white outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Municipio / Alcaldía *</label>
                  <input
                    type="text"
                    name="municipality"
                    required
                    value={formData.municipality}
                    onChange={handleChange}
                    placeholder="Ej. Huamantla"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-fuchsia-500 focus:bg-white outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Estado *</label>
                  <input
                    type="text"
                    name="state"
                    required
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="Ej. Tlaxcala"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-fuchsia-500 focus:bg-white outline-none transition"
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN 3: CUENTA E IDENTIFICADORES */}
            <div className="space-y-3 pt-2">
              <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider border-l-4 border-fuchsia-600 pl-2">
                3. Cuenta de Acceso e Identificadores
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Correo Electrónico *</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="ejemplo@madamred.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-fuchsia-500 focus:bg-white outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Usuario Nexen *</label>
                  <input
                    type="text"
                    name="nexen_user"
                    required
                    value={formData.nexen_user}
                    onChange={handleChange}
                    placeholder="Ej. NX-88402"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-fuchsia-500 focus:bg-white outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Contraseña Inicial *</label>
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-fuchsia-500 focus:bg-white outline-none transition"
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN 4: CLASIFICACIÓN EN LA RED */}
            <div className="space-y-3 pt-2">
              <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider border-l-4 border-fuchsia-600 pl-2">
                4. Nivel y Rango en Madam RED
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Nivel Operativo *</label>
                  <select
                    name="role_primary"
                    value={formData.role_primary}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-fuchsia-500 focus:bg-white outline-none transition cursor-pointer"
                  >
                    <option value="VENDEDORA">Consultora / Vendedora</option>
                    <option value="COORDINADORA">Coordinadora de Equipo</option>
                    <option value="GERENTE">Gerente de Zona</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Tipo / Rango *</label>
                  <select
                    name="rank"
                    value={formData.rank}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-fuchsia-500 focus:bg-white outline-none transition cursor-pointer"
                  >
                    <option value="BRILLANTE">💎 Brillante</option>
                    <option value="ZAFIRO">🔮 Zafiro</option>
                    <option value="ORO">⭐ Oro</option>
                    <option value="PLATINO">✨ Platino</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Botón idéntico al botón de Iniciar Sesión */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold py-3.5 rounded-xl text-xs tracking-wide transition shadow-lg shadow-fuchsia-600/25 disabled:opacity-50"
              >
                {loading ? 'GUARDANDO EXPEDIENTE...' : 'Registrar y dar de alta'}
              </button>
            </div>
          </form>
        </div>

        {/* Pie de página sutil idéntico al login */}
        <div className="text-center">
          <p className="text-[11px] text-slate-500 font-medium">Acceso restringido solo a personal autorizado</p>
        </div>
      </div>
    </div>
  );
}