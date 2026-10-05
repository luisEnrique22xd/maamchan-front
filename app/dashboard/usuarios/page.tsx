export default function UsuariasPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Encabezado y Acción Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Red de Vendedoras</h1>
          <p className="text-xs text-slate-500 mt-0.5">Estructura jerárquica y administración de equipos</p>
        </div>
        <button className="bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:opacity-95 text-white font-extrabold px-6 py-3 rounded-2xl text-xs tracking-wide transition shadow-lg shadow-fuchsia-500/20 hover:scale-[1.02] active:scale-[0.98]">
          + Nueva Vendedora
        </button>
      </div>

      {/* Mini KPIs de la Red */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-3xl border border-pink-100 shadow-xl shadow-pink-500/5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total de la Red</p>
          <p className="text-2xl font-black text-slate-900 mt-1">54 Integrantes</p>
          <span className="text-[10px] font-bold text-fuchsia-600 bg-pink-50 px-2.5 py-0.5 rounded-full mt-2 inline-block">3 Zonas activas</span>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-pink-100 shadow-xl shadow-pink-500/5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Coordinadoras</p>
          <p className="text-2xl font-black text-fuchsia-600 mt-1">8 Líderes</p>
          <span className="text-[10px] font-bold text-slate-500 mt-2 inline-block">Con doble rol activo</span>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-pink-100 shadow-xl shadow-pink-500/5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nuevas este Mes</p>
          <p className="text-2xl font-black text-slate-900 mt-1">+12 Vendedoras</p>
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full mt-2 inline-block">↑ Crecimiento +18%</span>
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
              placeholder="Buscar por nombre, correo o zona..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-medium focus:ring-4 focus:ring-fuchsia-500/10 focus:border-fuchsia-400 outline-none transition"
            />
          </div>
          <div className="flex gap-2 text-xs font-bold w-full sm:w-auto">
            <select className="bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs font-medium outline-none">
              <option>Todas las Zonas</option>
              <option>Zona Norte</option>
              <option>Zona Centro</option>
              <option>Zona Sur</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-400 uppercase font-bold tracking-wider border-b border-slate-100">
              <tr>
                <th className="p-4 pl-6">Vendedora</th>
                <th className="p-4">Rol Principal</th>
                <th className="p-4">Rol Secundario</th>
                <th className="p-4">Zona / Equipo</th>
                <th className="p-4">Estatus</th>
                <th className="p-4 text-right pr-6">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {[
                { name: 'Laura Méndez', email: 'laura@redpos.com', r1: 'Gerente', r2: '-', team: 'Zona Norte', status: 'Activa' },
                { name: 'Ana Martínez', email: 'ana.m@redpos.com', r1: 'Coordinadora', r2: 'Vendedora', team: 'Equipo Alpha', status: 'Activa' },
                { name: 'Carla Gómez', email: 'carla.g@redpos.com', r1: 'Vendedora', r2: '-', team: 'Equipo Centro', status: 'Activa' },
              ].map((user, i) => (
                <tr key={i} className="hover:bg-pink-50/30 transition">
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-fuchsia-600 to-pink-500 text-white font-bold flex items-center justify-center text-xs shadow-md shadow-fuchsia-500/20">
                        {user.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{user.name}</p>
                        <p className="text-[10px] text-slate-400 font-normal">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="px-3 py-1 rounded-full bg-fuchsia-100 text-fuchsia-800 text-[10px] font-black">
                      {user.r1}
                    </span>
                  </td>
                  <td className="p-4">
                    {user.r2 !== '-' ? (
                      <span className="px-3 py-1 rounded-full bg-pink-100 text-pink-800 text-[10px] font-black">
                        {user.r2}
                      </span>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="p-4 font-bold text-slate-800">{user.team}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                      {user.status}
                    </span>
                  </td>
                  <td className="p-4 text-right pr-6">
                    <button className="text-fuchsia-600 hover:text-fuchsia-800 font-extrabold text-xs hover:underline">
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}