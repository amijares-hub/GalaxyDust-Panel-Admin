import React, { useState } from 'react';
import { Shield, Lock, Mail, AlertTriangle, Loader2, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const ALLOWED_ADMIN_EMAIL = 'amijares@sasorilabs.io';

interface AdminLoginProps {
  onLoginSuccess: () => void;
  authError?: string | null;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, authError: initialError }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError || null);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setError('Por favor introduce correo y contraseña.');
      return;
    }

    // Regla estricta: Único correo permitido
    if (cleanEmail !== ALLOWED_ADMIN_EMAIL) {
      setError('Acceso denegado: este correo no tiene privilegios de superadministrador.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password
      });

      if (signInError) {
        throw signInError;
      }

      if (data?.session) {
        sessionStorage.setItem('last_verified_at', Date.now().toString());
        onLoginSuccess();
      }
    } catch (err: any) {
      setError(err?.message || 'Error al autenticar credenciales administrativas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#050506] flex items-center justify-center p-4 relative overflow-hidden select-none font-sans">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-red-600/10 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-emerald-500/5 blur-[100px] pointer-events-none rounded-full" />

      {/* Cyber Grid Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#18181b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md bg-zinc-950 border border-zinc-900 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl">
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-3 mb-8">
          <div className="w-12 h-12 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-center text-red-500 shadow-inner">
            <Shield size={24} className="stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-wider uppercase font-display">
              GALAXYDUST OS
            </h1>
            <p className="text-[11px] font-mono tracking-widest text-zinc-500 uppercase mt-1">
              Portal de Acceso Restringido — Backoffice
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3.5 bg-red-950/40 border border-red-500/30 rounded-xl flex items-start gap-3 text-red-400">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold block tracking-wider uppercase">Fallo de Autenticación</span>
              <span className="text-zinc-300">{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handlePasswordLogin} className="space-y-4">
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-1.5">
              Correo Electrónico de Administrador
            </label>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@sasorilabs.io"
                className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-zinc-650 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-mono"
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-1.5">
              Contraseña de Seguridad
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••••••"
                className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-zinc-650 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-mono"
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-950/40"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Verificando Credenciales...</span>
              </>
            ) : (
              <>
                <span>Acceder al Backoffice</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>

          <div className="pt-4 border-t border-zinc-900 flex items-center justify-between">
            <span className="text-[10px] text-zinc-550 font-mono">Autenticación Exclusiva por Contraseña</span>
            <span className="text-[9px] text-zinc-650 font-mono">TLS 1.3</span>
          </div>
        </form>

        {/* Footer Warning */}
        <div className="mt-8 text-center border-t border-zinc-900/60 pt-4">
          <p className="text-[10px] text-zinc-600 leading-normal">
            Acceso exclusivo para el superadministrador de Sasorilabs. Los enlaces mágicos y tokens de recuperación están deshabilitados.
          </p>
        </div>
      </div>
    </div>
  );
};
