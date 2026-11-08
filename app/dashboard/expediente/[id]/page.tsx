'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';

interface UserDetail {
  id: number;
  first_name: string;
  last_name_paternal: string;
  last_name_maternal?: string;
  email: string;
  nexen_user: string;
  phone?: string;
  street?: string;
  neighborhood?: string;
  municipality?: string;
  state?: string;
  role_primary: string;
  rank: string;
  is_active: boolean;
  ine_document_url?: string;
  proof_of_address_url?: string;
  expediente_status?: 'COMPLETO' | 'PENDIENTE' | 'REVISIÓN';
  consignment_limit?: string; // Límite de producto/consignación asignado
}

export default function ExpedientePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id;

  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Formulario con datos propios de la Vendedora
  const [formData, setFormData] = useState({
    first_name: '',
    last_name_paternal: '',
    last_name_maternal: '',
    phone: '',
    street: '',
    neighborhood: '',
    municipality: '',
    state: '',
    rank: 'BRILLANTE',
    role_primary: 'VENDEDORA',
    consignment_limit: '0.00',
    is_active: true,
  });

  useEffect(() => {
    if (userId) {
      fetchUserExpediente();
    }
  }, [userId]);

  const fetchUserExpediente = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/users/${userId}/`);
      const data = response.data;
      setUser(data);
      setFormData({
        first_name: data.first_name || '',
        last_name_paternal: data.last_name_paternal || '',
        last_name_maternal: data.last_name_maternal || '',
        phone: data.phone || '',
        street: data.street || '',
        neighborhood: data.neighborhood || '',
        municipality: data.municipality || '',
        state: data.state || '',
        rank: data.rank || 'BRILLANTE',
        role_primary: data.role_primary || 'VENDEDORA',
        consignment_limit: data.consignment_limit || '0.00',
        is_active: data.is_active ?? true,
      });
    } catch (err) {
      console.error('Error al cargar expediente:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      await api.patch(`/users/${userId}/`, formData);
      setFeedback({ type: 'success', message: '¡Datos de la consultora actualizados exitosamente!' });
      fetchUserExpediente();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.response?.data?.detail || 'No se pudieron guardar los cambios.' });
    } finally {
      setSaving(false);
    }
  };

 const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: 'ine' | 'address') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const dataForm = new FormData();
    dataForm.append('file', file);
    dataForm.append('doc_type', docType);

    try {
      // Pasamos 'Content-Type': undefined para que Axios no fuerce JSON y deje actuar al FormData
      const response = await api.post(`/users/${userId}/upload-document/`, dataForm, {
        headers: {
          'Content-Type': undefined,
        },
      });
      
      alert('¡Documento guardado de forma segura en Supabase!');
      fetchUserExpediente(); // Recargar datos para mostrar el nuevo enlace
    } catch (err: any) {
      console.error('Error al subir:', err.response?.data || err);
      alert('Error al subir el archivo: ' + (err.response?.data?.error || 'Error desconocido'));
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-xs text-slate-400 font-bold">Cargando expediente digital...</div>;
  if (!user) return <div className="text-center py-20 text-xs text-rose-500 font-bold">No se encontró a la consultora.</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            onClick={() => router.back()}
            className="text-xs font-bold text-slate-400 hover:text-slate-700 mb-2 inline-flex items-center gap-1"
          >
            ← Volver a la Red
          </button>
          <h1 className="text-2xl font-black text-slate-900">
            Expediente de Consultora: {user.first_name} {user.last_name_paternal}
          </h1>
          <p className="text-xs text-slate-500">ID Nexen: <strong className="text-slate-800">{user.nexen_user || 'N/A'}</strong> | Correo: {user.email}</p>
        </div>

        <span className={`px-4 py-1.5 rounded-2xl text-xs font-black uppercase shadow-sm ${
          user.expediente_status === 'COMPLETO' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
        }`}>
          Expediente: {user.expediente_status || 'PENDIENTE'}
        </span>
      </div>

      {feedback && (
        <div className={`p-4 rounded-2xl text-xs font-bold border transition-all ${
          feedback.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-rose-50 text-rose-900 border-rose-200'
        }`}>
          {feedback.message}
        </div>
      )}

      {/* SECCIÓN 1: Formulario de Datos Generales y Asignación de Red */}
      <div className="bg-white p-8 rounded-3xl border border-pink-100 shadow-xl shadow-pink-500/5 space-y-6">
        <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
          <h3 className="font-extrabold text-slate-900 text-sm">👤 Perfil Comercial y Dirección</h3>
          <span className="text-[10px] text-slate-400">Edita la información de la consultora</span>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nombre(s)</label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-900 font-medium focus:border-fuchsia-400 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Apellido Paterno</label>
              <input
                type="text"
                value={formData.last_name_paternal}
                onChange={(e) => setFormData({ ...formData, last_name_paternal: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-900 font-medium focus:border-fuchsia-400 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Apellido Materno</label>
              <input
                type="text"
                value={formData.last_name_maternal}
                onChange={(e) => setFormData({ ...formData, last_name_maternal: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-900 font-medium focus:border-fuchsia-400 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono / Celular</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-900 font-medium focus:border-fuchsia-400 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Rol en la Red</label>
              <select
                value={formData.role_primary}
                onChange={(e) => setFormData({ ...formData, role_primary: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-900 font-medium focus:border-fuchsia-400 outline-none cursor-pointer"
              >
                <option value="VENDEDORA">Consultora / Vendedora</option>
                <option value="COORDINADORA">Coordinadora de Equipo</option>
                <option value="DIRECTORA">Directora</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Rango Comercial</label>
              <select
                value={formData.rank}
                onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-900 font-medium focus:border-fuchsia-400 outline-none cursor-pointer"
              >
                <option value="BRILLANTE">Brillante</option>
                <option value="ZAFIRO">Zafiro</option>
                <option value="ORO">Oro</option>
                <option value="PLATINO">Platino</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Límite de Consignación ($)</label>
              <input
                type="number"
                step="0.01"
                value={formData.consignment_limit}
                onChange={(e) => setFormData({ ...formData, consignment_limit: e.target.value })}
                placeholder="0.00"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-900 font-medium focus:border-fuchsia-400 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Calle y Número</label>
              <input
                type="text"
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-900 font-medium focus:border-fuchsia-400 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Colonia</label>
              <input
                type="text"
                value={formData.neighborhood}
                onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-900 font-medium focus:border-fuchsia-400 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Municipio / Estado</label>
              <input
                type="text"
                value={formData.municipality}
                onChange={(e) => setFormData({ ...formData, municipality: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-900 font-medium focus:border-fuchsia-400 outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold px-6 py-3 rounded-2xl text-xs transition shadow-md disabled:opacity-50"
            >
              {saving ? 'Guardando cambios...' : '💾 Guardar Datos del Perfil'}
            </button>
          </div>
        </form>
      </div>

      {/* SECCIÓN 2: Bóveda de Documentación Oficial */}
      <div className="bg-white p-8 rounded-3xl border border-pink-100 shadow-xl shadow-pink-500/5 space-y-6">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="font-extrabold text-slate-900 text-sm">📁 Bóveda de Identificación de la Consultora</h3>
          <p className="text-xs text-slate-500">Documentación para validar la asignación de consignación y pedidos</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* INE */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-bold text-xs text-slate-800">Identificación Oficial (INE)</span>
              {user.ine_document_url ? (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">Cargado</span>
              ) : (
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">Sin documento</span>
              )}
            </div>

            {user.ine_document_url && (
              <a
                href={user.ine_document_url}
                target="_blank"
                rel="noreferrer"
                className="block text-center bg-white hover:bg-slate-100 text-fuchsia-600 font-bold text-xs py-2 rounded-xl border border-slate-200 transition shadow-sm"
              >
                🔍 Ver INE Actual
              </a>
            )}

            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">Subir / Reemplazar INE:</label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => handleFileUpload(e, 'ine')}
                disabled={uploading}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-fuchsia-50 file:text-fuchsia-700 hover:file:bg-fuchsia-100 cursor-pointer"
              />
            </div>
          </div>

          {/* Comprobante de Domicilio */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-bold text-xs text-slate-800">Comprobante de Domicilio</span>
              {user.proof_of_address_url ? (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">Cargado</span>
              ) : (
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">Sin documento</span>
              )}
            </div>

            {user.proof_of_address_url && (
              <a
                href={user.proof_of_address_url}
                target="_blank"
                rel="noreferrer"
                className="block text-center bg-white hover:bg-slate-100 text-fuchsia-600 font-bold text-xs py-2 rounded-xl border border-slate-200 transition shadow-sm"
              >
                🔍 Ver Comprobante Actual
              </a>
            )}

            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">Subir / Reemplazar Comprobante:</label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => handleFileUpload(e, 'address')}
                disabled={uploading}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-fuchsia-50 file:text-fuchsia-700 hover:file:bg-fuchsia-100 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}