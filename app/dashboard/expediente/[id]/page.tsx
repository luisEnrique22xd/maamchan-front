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
      console.error('Error al cargar expediente:', err);
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
      alert('Documento subido con éxito.');
      fetchUserExpediente();
    } catch (err: any) {
      alert('Error al subir el documento.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-xs text-slate-400 font-bold">Cargando expediente...</div>;
  if (!user) return <div className="text-center py-20 text-xs text-rose-500 font-bold">Consultora no encontrada.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6 px-4">
      <button onClick={() => router.back()} className="text-xs font-bold text-slate-400 hover:text-slate-700">
        ← Volver
      </button>

      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-pink-100 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-900">
            Expediente: {user.first_name} {user.last_name_paternal}
          </h1>
          <p className="text-xs text-slate-500">ID Nexen: {user.nexen_user || 'N/A'}</p>
        </div>
        <span className="px-3 py-1 rounded-xl text-xs font-black uppercase bg-amber-100 text-amber-800">
          Crédito: {user.credit_status || 'PENDIENTE'}
        </span>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-sm space-y-4">
        <h3 className="font-extrabold text-slate-900 text-sm">📁 Documentación Oficial</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <p className="font-bold text-slate-800">INE / Identificación</p>
            {user.ine_document_url ? (
              <a href={user.ine_document_url} target="_blank" rel="noreferrer" className="text-fuchsia-600 font-bold underline block">
                Ver INE actual
              </a>
            ) : (
              <p className="text-slate-400">Sin documento</p>
            )}
            <input type="file" onChange={(e) => handleFileUpload(e, 'ine')} disabled={uploading} className="w-full text-xs" />
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <p className="font-bold text-slate-800">Comprobante de Domicilio</p>
            {user.proof_of_address_url ? (
              <a href={user.proof_of_address_url} target="_blank" rel="noreferrer" className="text-fuchsia-600 font-bold underline block">
                Ver Comprobante actual
              </a>
            ) : (
              <p className="text-slate-400">Sin documento</p>
            )}
            <input type="file" onChange={(e) => handleFileUpload(e, 'address')} disabled={uploading} className="w-full text-xs" />
          </div>
        </div>
      </div>
    </div>
  );
}