'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import axios from 'axios';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [userName, setUserName] = useState('Cargando...');
  const [userRole, setUserRole] = useState('');
  const pathname = usePathname();

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: '📊' },
    { label: 'Punto de Venta', href: '/dashboard/pos', icon: '⚡' },
    { label: 'Expedientes', href: '/dashboard/expediente', icon: '📁' },
    { label: 'Red de Vendedoras', href: '/dashboard/usuarios', icon: '👑' },
    { label: 'Inventario', href: '/dashboard/inventario', icon: '📦' },
    { label: 'Proyecciones', href: '/dashboard/proyecciones', icon: '📈' },
    { label: 'Recursos', href: '/dashboard/recursos', icon: '📚' },
    { label: 'Bitácora', href: '/dashboard/bitacora', icon: '📝' },
  ];

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      const accessToken = localStorage.getItem('access_token');

      if (refreshToken && accessToken) {
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout/`,
          { refresh: refreshToken },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
      }
    } catch (error) {
      console.error("Error al cerrar sesión en el servidor:", error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
    }
  };
  useEffect(() => {
    const fetchUserSidebar = async () => {
      try {
        // Reutilizamos el endpoint del dashboard para obtener los datos del usuario actual
        const res = await api.get('/sales/dashboard-summary/');
        if (res.data?.user) {
          setUserName(res.data.user.first_name);
          setUserRole(res.data.user.role_display);
        }
      } catch (error) {
        console.error('Error al cargar el usuario en el sidebar:', error);
        setUserName('Usuaria Chantal');
      }
    };

    fetchUserSidebar();
  }, []);

  return (
    <>
      {/* Overlay para dispositivos móviles */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-neutral-950/70 backdrop-blur-md z-30 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar en Gris Antracita Neutro */}
      <aside
        className={`fixed md:static top-0 left-0 h-full w-64 bg-neutral-900 text-white flex flex-col justify-between z-40 transition-all duration-300 ease-out border-r border-neutral-800 ${
          isOpen ? 'translate-x-0 shadow-2xl shadow-pink-950/20' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Header / Brand Logo */}
          <div className="p-6 border-b border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-fuchsia-600 via-pink-500 to-pink-400 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-fuchsia-600/30">
                M
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-1">
                  Madame Chantal <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-pink-400">Tlaxcala</span>
                </h1>
                <p className="text-[10px] font-semibold text-pink-200/70">Sistema de administración</p>
              </div>
            </div>
            <button onClick={onClose} className="md:hidden text-neutral-400 hover:text-white">✕</button>
          </div>

          {/* Menú de Navegación */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`group relative flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-bold text-xs tracking-wide transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow-lg shadow-fuchsia-900/50 scale-[1.02]'
                      : 'text-neutral-400 hover:bg-neutral-800 hover:text-pink-300'
                  }`}
                >
                  <span className="text-lg transition-transform group-hover:scale-110">{item.icon}</span>
                  {item.label}
                  {isActive && (
                    <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sección Inferior: Perfil + Botón de Cerrar Sesión */}
        <div className="p-3 border-t border-neutral-800/80 bg-neutral-950/40 space-y-2">
          {/* Perfil del Usuario */}
          <div className="p-3 rounded-2xl bg-neutral-950/80 border border-neutral-800/80 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-pink-500/10 text-pink-400 font-bold flex items-center justify-center text-xs border border-pink-500/20">
              CR
            </div>
            <div className="overflow-hidden">
            <p className="font-bold text-slate-900 text-xs truncate text-white">{userName}</p>
          <p className="text-[10px] text-fuchsia-600 font-semibold truncate">{userRole || 'Administradora'}</p>
            </div>
          </div>

          {/* Botón de Cerrar Sesión */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-red-400 bg-red-950/20 hover:bg-red-900/40 border border-red-900/30 rounded-2xl transition-all duration-200 group shadow-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}