'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';

interface UserDetail {
  id: number;
  first_name: string;
  last_name_paternal: string;
  email: string;
  nexen_user: string;
  role_primary: string;
  rank: string;
  phone?: string;
  street?: string;
  municipality?: string;
  state?: string;
  ine_document_url?: string;
  proof_of_address_url?: string;
  credit_status?: 'APROBADO' | 'PENDIENTE' | 'RECHAZADO';
}

export default function ExpedientePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id;

  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);

  useEffect(() => {
    if (userId) {
      fetchUserExpediente();
    }
  }, [userId]);

  const fetchUserExpediente = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/users/${userId}/`);
      setUser(response.data);
    } catch (err) {
      console.error('Error al cargar expediente de la consultora:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: 'ine' | 'address') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('doc_type', docType);

    setUploading(true);
    try {
      await api.post(`/users/${userId}/upload-document/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Documento subido y almacenado en Supabase exitosamente.');
      fetchUserExpediente();
    } catch (err: any) {
      alert('Error al subir el documento: ' + (err.response?.data?.detail || 'Intente de nuevo.'));
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-xs text-slate-400 font-bold">Cargando expediente digital...</div>;
  }

  if (!user) {
    return <div className="text-center py-20 text-xs text-rose-500 font-bold">No se encontró información de la consultora.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => router.back()}
            className="text-xs font-bold text-slate-400 hover:text-slate-700 mb-2 inline-flex items-center gap-1"
          >
            ← Volver a la Red
          </button>
          <h1 className="text-2xl font-black text-slate-900">
            Expediente Digital: {user.first_name} {user.last_name_paternal}
          </h1>
          <p className="text-xs text-slate-500">Gestión de identidad, documentos y validación para créditos de Madame Chantal</p>
        </div>

        <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase ${
          user.credit_status === 'APROBADO' ? 'bg-emerald-100 text-emerald-800' :
          user.credit_status === 'RECHAZADO' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
        }`}>
          Crédito: {user.credit_status || 'PENDIENTE'}
        </span>
      </div>

      {/* Información General */}
      <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-xl shadow-pink-500/5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div>
          <span className="text-slate-400 block font-bold">Correo Electrónico:</span>
          <span className="text-slate-800 font-medium">{user.email}</span>
        </div>
        <div>
          <span className="text-slate-400 block font-bold">ID / Nexen:</span>
          <span className="text-slate-800 font-medium">{user.nexen_user || 'N/A'}</span>
        </div>
        <div>
          <span className="text-slate-400 block font-bold">Ubicación:</span>
          <span className="text-slate-800 font-medium">{user.municipality || 'Tlaxcala'}, {user.state || 'Tlaxcala'}</span>
        </div>
      </div>

      {/* Bóveda de Documentos (Supabase Storage) */}
      <div className="bg-white p-8 rounded-3xl border border-pink-100 shadow-xl shadow-pink-500/5 space-y-6">
        <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-3">
          📁 Bóveda de Documentación Oficial (Supabase)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* INE / Identificación */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-bold text-xs text-slate-800">Identificación Oficial (INE)</span>
              {user.ine_document_url ? (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">Cargado</span>
              ) : (
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">Pendiente</span>
              )}
            </div>

            {user.ine_document_url ? (
              <a
                href={user.ine_document_url}
                target="_blank"
                rel="noreferrer"
                className="block text-center bg-white hover:bg-slate-100 text-fuchsia-600 font-bold text-xs py-2 rounded-xl border border-slate-200 transition"
              >
                🔍 Ver Documento INE
              </a>
            ) : (
              <p className="text-[11px] text-slate-400">No se ha cargado INE.</p>
            )}

            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">Actualizar INE:</label>
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
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">Pendiente</span>
              )}
            </div>

            {user.proof_of_address_url ? (
              <a
                href={user.proof_of_address_url}
                target="_blank"
                rel="noreferrer"
                className="block text-center bg-white hover:bg-slate-100 text-fuchsia-600 font-bold text-xs py-2 rounded-xl border border-slate-200 transition"
              >
                🔍 Ver Comprobante
              </a>
            ) : (
              <p className="text-[11px] text-slate-400">No se ha cargado comprobante.</p>
            )}

            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">Actualizar Comprobante:</label>
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