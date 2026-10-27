'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name_paternal: string;
  last_name_maternal?: string;
  full_name: string;
  street: string;
  neighborhood: string;
  municipality: string;
  state: string;
  username?: string;
  nexen_user: string;
  role_primary: string; // Consultora o Coordinadora
  rank: string;         // Brillante, Zafiro, Oro, Platino
  is_active: boolean;
  created_at: string;
}

export default function UsuariasPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('Todos');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/users/'); 
      const data = Array.isArray(response.data) ? response.data : response.data.results || [];
      setUsers(data);
    } catch (error) {
      console.error('Error al cargar la red de vendedoras:', error);
    } finally {
      setLoading(false);
    }
  };
  const filteredUsers = users.filter((user) => {
    const fullName = `${user.first_name || ''} ${user.last_name_paternal || ''} ${user.last_name_maternal || ''}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.nexen_user?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole =
      selectedRole === 'Todos' || user.role_primary === selectedRole;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-8 max-w-[95%] mx-auto py-6">
      {/* Encabezado y Acción Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Red de Vendedoras</h1>
          <p className="text-xs text-slate-500 mt-0.5">Estructura jerárquica y administración de expedientes</p>
        </div>
        <button
          onClick={() => router.push('/register')}
          className="bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:opacity-95 text-white font-extrabold px-6 py-3 rounded-2xl text-xs tracking-wide transition shadow-lg shadow-fuchsia-500/20 hover:scale-[1.02] active:scale-[0.98]"
        >
          + Nueva Vendedora
        </button>
      </div>

      {/* Mini KPIs Dinámicos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-3xl border border-pink-100 shadow-xl shadow-pink-500/5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total de la Red</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{users.length} Integrantes</p>
          <span className="text-[10px] font-bold text-fuchsia-600 bg-pink-50 px-2.5 py-0.5 rounded-full mt-2 inline-block">Sincronizado</span>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-pink-100 shadow-xl shadow-pink-500/5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Coordinadoras</p>
          <p className="text-2xl font-black text-fuchsia-600 mt-1">
            {users.filter((u) => u.role_primary === 'COORDINADORA' || u.role_primary === 'GERENTE').length} Líderes
          </p>
          <span className="text-[10px] font-bold text-slate-500 mt-2 inline-block">Con permisos de gestión</span>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-pink-100 shadow-xl shadow-pink-500/5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Activas en el Sistema</p>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {users.filter((u) => u.is_active).length} Vendedoras
          </p>
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full mt-2 inline-block">Estado operativo óptimo</span>
        </div>
      </div>

      {/* Tabla Principal */}
      <div className="bg-white rounded-3xl border border-pink-100 shadow-xl shadow-pink-500/5 overflow-hidden">
        {/* Barra de Filtros */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-pink-50/30 to-transparent">
          <div className="relative w-full sm:w-80">
            <span className="absolute inset-y-0 left-3.5 flex items-center text-slate-400 text-xs">🔍</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, correo o Nexen..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-medium focus:ring-4 focus:ring-fuchsia-500/10 focus:border-fuchsia-400 outline-none transition text-slate-900"
            />
          </div>
          <div className="flex gap-2 text-xs font-bold w-full sm:w-auto">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs font-medium outline-none text-slate-900 cursor-pointer"
            >
              <option value="Todos">Todos los Niveles</option>
              <option value="VENDEDORA">Consultora / Vendedora</option>
              <option value="COORDINADORA">Coordinadora</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50/80 text-slate-400 uppercase font-bold tracking-wider border-b border-slate-100">
              <tr>
                <th className="p-4 pl-6">Nombre Completo</th>
                <th className="p-4">Dirección</th>
                <th className="p-4">Acceso / Nexen</th>
                <th className="p-4">Nivel y Rango</th>
                <th className="p-4">Creación</th>
                <th className="p-4">Estatus</th>
                <th className="p-4 text-right pr-6">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400 font-bold">
                    Cargando red de vendedoras...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400 font-bold">
                    No se encontraron registros en la base de datos.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-pink-50/30 transition">
                    {/* Nombre y Apellidos */}
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-fuchsia-600 to-pink-500 text-white font-bold flex items-center justify-center text-xs shadow-md shadow-fuchsia-500/20">
                          {user.first_name ? user.first_name.substring(0, 2).toUpperCase() : 'VR'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">
                            {user.first_name} {user.last_name_paternal} {user.last_name_maternal || ''}
                          </p>
                          <p className="text-[10px] text-slate-400 font-normal">Usuario: {user.email || user.username}</p>
                        </div>
                      </div>
                    </td>

                    {/* Dirección (Calle, Colonia, Municipio, Estado) */}
                    <td className="p-4">
                      <p className="font-bold text-slate-800">{user.street || 'S/N'}</p>
                      <p className="text-[10px] text-slate-500 font-normal">
                        {user.neighborhood}, {user.municipality}, {user.state}
                      </p>
                    </td>

                    {/* Usuario Nexen */}
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 font-mono text-[11px] font-bold">
                        {user.nexen_user || 'N/A'}
                      </span>
                    </td>

                    {/* Nivel (Consultora/Coordinadora) y Rango (Brillante/Zafiro/Oro/Platino) */}
                    <td className="p-4 space-y-1">
                      <div>
                        <span className="px-2.5 py-0.5 rounded-full bg-fuchsia-100 text-fuchsia-800 text-[10px] font-black uppercase">
                          {user.role_primary || 'CONSULTORA'}
                        </span>
                      </div>
                      <div>
                        <span className="px-2.5 py-0.5 rounded-full bg-pink-50 text-pink-700 text-[10px] font-bold uppercase border border-pink-200">
                          {user.rank || 'BRILLANTE'}
                        </span>
                      </div>
                    </td>

                    {/* Fecha de Creación */}
                    <td className="p-4 text-slate-500 text-[11px]">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString('es-MX', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      }) : 'N/A'}
                    </td>

                    {/* Activa / Inactiva */}
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                          user.is_active
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {user.is_active ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="p-4 text-right pr-6">
                      <button
                        onClick={() => router.push(`/dashboard/expediente/${user.id}`)}
                        className="text-fuchsia-600 hover:text-fuchsia-800 font-extrabold text-xs hover:underline"
                      >
                        Ver Expediente
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}