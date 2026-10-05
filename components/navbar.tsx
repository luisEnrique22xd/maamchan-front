'use client';
import { useState } from 'react';

export default function Navbar({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-pink-100 px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2.5 text-slate-600 hover:text-fuchsia-600 hover:bg-pink-50 rounded-2xl transition"
        >
          ☰
        </button>

        {/* Buscador de Cristal */}
        <div className="relative hidden sm:block w-72 lg:w-96">
          <span className="absolute inset-y-0 left-3.5 flex items-center text-slate-400 text-xs">🔍</span>
          <input
            type="text"
            placeholder="Buscar vendedora, folio o expediente..."
            className="w-full bg-slate-100/70 hover:bg-slate-100 focus:bg-white text-slate-800 text-xs pl-10 pr-4 py-2.5 rounded-2xl border border-transparent focus:border-fuchsia-300 focus:ring-4 focus:ring-fuchsia-500/10 outline-none transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Notificaciones con indicador neón */}
        <button className="relative p-2.5 text-slate-500 hover:text-fuchsia-600 hover:bg-pink-50/60 rounded-2xl transition">
          <span className="text-lg">🔔</span>
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-fuchsia-500 rounded-full ring-2 ring-white animate-ping" />
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-fuchsia-500 rounded-full ring-2 ring-white" />
        </button>

        <div className="h-6 w-px bg-slate-200/80 mx-1" />

        {/* User Pill */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 p-1.5 pl-2.5 rounded-2xl hover:bg-pink-50/50 border border-transparent hover:border-pink-100 transition"
          >
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-900 leading-tight">María López</p>
              <p className="text-[10px] font-semibold text-fuchsia-600">Directora General</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-fuchsia-600 to-pink-500 text-white font-bold flex items-center justify-center text-xs shadow-md shadow-fuchsia-500/20">
              ML
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-3 w-52 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-pink-100/80 py-2.5 text-xs text-slate-700 z-30 space-y-1">
              <a href="#" className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-pink-50 text-slate-700 hover:text-fuchsia-600 font-medium transition">
                👤 Mi Perfil
              </a>
              <a href="#" className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-pink-50 text-slate-700 hover:text-fuchsia-600 font-medium transition">
                ⚙️ Ajustes del Sistema
              </a>
              <div className="border-t border-slate-100 my-1.5" />
              <a href="/login" className="flex items-center gap-2.5 px-4 py-2.5 text-rose-600 hover:bg-rose-50 font-semibold transition">
                🚪 Cerrar Sesión
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}