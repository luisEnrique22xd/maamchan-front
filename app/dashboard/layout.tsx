'use client';
import Navbar from '@/components/navbar';
import Sidebar from '@/components/sidebar';
import { useState } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
      {/* Sidebar Integrado */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Contenedor Principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar Integrado con toggle móvil */}
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        {/* Área de Contenido */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
}