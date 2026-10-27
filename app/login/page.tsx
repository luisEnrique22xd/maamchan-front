'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Ajusta la URL '/token/' según el endpoint de autenticación en tus urls.py de Django
      // (ej. '/token/', '/users/login/' o '/auth/login/')
      const response = await api.post('/api/auth/login/', {
        email: email, // Si Django usa username por defecto en SimpleJWT
        password: password,
      });

      // Guardar los tokens devueltos por Django
      localStorage.setItem('access_token', response.data.access);
      if (response.data.refresh) {
        localStorage.setItem('refresh_token', response.data.refresh);
      }

      // Redirigir al panel
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Error al iniciar sesión:', err);
      const message =
        err.response?.data?.detail ||
        'Credenciales incorrectas o error de conexión con el servidor.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 space-y-6 border border-pink-100">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-fuchsia-600 tracking-tight">Madame Chantal Tlaxcala</h1>
          <p className="text-sm text-slate-500 mt-1">Sistema de administración</p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold p-3 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Usuario / Correo Electrónico
            </label>
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="directora@redpos.com"
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none transition"
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center text-slate-600 gap-2 cursor-pointer">
              <input type="checkbox" className="rounded text-fuchsia-600 focus:ring-fuchsia-500 border-slate-300" />
              Recordar sesión
            </label>
            <a href="#" className="text-fuchsia-600 font-semibold hover:underline">
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 disabled:opacity-50 text-white font-medium py-3 rounded-xl text-sm transition shadow-lg shadow-fuchsia-200"
          >
            {loading ? 'Validando credenciales...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="text-center border-t border-slate-100 pt-4">
          <p className="text-xs text-slate-400">Acceso restringido solo a personal autorizado</p>
        </div>
      </div>
    </div>
  );
}