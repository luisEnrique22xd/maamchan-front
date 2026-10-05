'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: '📊' },
    { label: 'Punto de Venta', href: '/dashboard/pos', icon: '⚡' },
    { label: 'Expedientes', href: '/dashboard/expediente', icon: '📁' },
    { label: 'Red de Vendedoras', href: '/dashboard/usuarios', icon: '👑' },
  ];

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
                  Madam <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-pink-400">RED</span>
                </h1>
                <p className="text-[10px] font-semibold text-pink-200/70">Gestión de Red de Ventas</p>
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

        {/* Perfil del Usuario en el Pie del Sidebar */}
        <div className="p-4 m-3 rounded-2xl bg-neutral-950/80 border border-neutral-800/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-pink-500/10 text-pink-400 font-bold flex items-center justify-center text-xs border border-pink-500/20">
              ML
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-neutral-200 truncate">María López</p>
              <p className="text-[10px] text-fuchsia-400 font-bold">Directora General</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}