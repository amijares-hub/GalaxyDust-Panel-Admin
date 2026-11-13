import React, { useState, useEffect } from 'react';
import { ShieldAlert, Lock, AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ALLOWED_ADMIN_EMAIL } from './AdminLogin';

interface SessionChallengeModalProps {
  onSuccess: (session: any) => void;
  onFail: (reason: string) => void;
}

export const SessionChallengeModal: React.FC<SessionChallengeModalProps> = ({ onSuccess, onFail }) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);

  // Cuenta regresiva estricta de 60 segundos
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onFail('Sesión finalizada: verificación de seguridad fallida o tiempo agotado.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onFail]);

  // Prevención de escape con tecla ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || loading) return;

    setLoading(true);

    try {
      // 1 solo intento de autenticación
      const { data, error } = await supabase.auth.signInWithPassword({
        email: ALLOWED_ADMIN_EMAIL,
        password
      });

      if (error || !data?.session) {
        // Cero tolerancia: fallo en 1 intento expulsa inmediatamente
        onFail('Sesión finalizada: verificación de seguridad fallida o tiempo agotado.');
        return;
      }

      // Éxito: notifica a App.tsx para reiniciar ciclo
      onSuccess(data.session);
    } catch (err) {
      onFail('Sesión finalizada: verificación de seguridad fallida o tiempo agotado.');
    } finally {
      setLoading(false);
    }
  };

  // Cálculo del porcentaje de tiempo restante para la barra de progreso
  const progressPercent = (timeLeft / 60) * 100;

  return (
    <div
      className="fixed inset-0 z-[99999] bg-[#050506]/95 backdrop-blur-xl flex items-center justify-center p-4 select-none"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-full max-w-md bg-zinc-950 border-2 border-red-500/50 rounded-2xl shadow-2xl p-6 sm:p-8 text-center relative overflow-hidden">
        {/* Barra de progreso de tiempo restante */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-zinc-900">
          <div
            className={`h-full transition-all duration-1000 ${
              timeLeft <= 15 ? 'bg-red-500 animate-pulse' : 'bg-red-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Icono de advertencia */}
        <div className="w-14 h-14 bg-red-950/60 border border-red-500/40 rounded-2xl flex items-center justify-center text-red-500 mx-auto mb-4 shadow-inner">
          <ShieldAlert size={28} className="animate-pulse" />
        </div>

        <div className="space-y-1 mb-6">
          <span className="text-[10px] font-mono tracking-widest text-red-400 uppercase px-2 py-0.5 bg-red-950/40 border border-red-500/20 rounded-full font-bold inline-block">
            DESAFÍO DE SEGURIDAD PERIÓDICO
          </span>
          <h2 className="text-lg font-bold text-white tracking-wide uppercase font-display mt-2">
            Reverificación de Credenciales
          </h2>
          <p className="text-xs text-zinc-400">
            Han transcurrido 10 minutos de sesión activa. Confirma tu contraseña para continuar operando en el Backoffice.
          </p>
        </div>

        {/* Contador regresivo */}
        <div className="mb-6 p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2 text-zinc-400 text-xs font-mono">
            <AlertTriangle size={15} className="text-amber-400" />
            <span>Tiempo restante:</span>
          </div>
          <span className={`font-mono text-sm font-bold ${
            timeLeft <= 15 ? 'text-red-400 animate-pulse text-base' : 'text-zinc-200'
          }`}>
            {timeLeft}s
          </span>
        </div>

        {/* Formulario de 1 solo intento */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-1">
              Usuario Autorizado
            </label>
            <div className="text-xs font-mono text-zinc-300 bg-zinc-900/40 border border-zinc-850 rounded-xl px-3.5 py-2">
              {ALLOWED_ADMIN_EMAIL}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-1">
              Contraseña de Acceso (1 Único Intento)
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600" />
              <input
                type="password"
                required
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu contraseña"
                className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-zinc-650 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-mono"
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || timeLeft <= 0}
            className="w-full mt-2 py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-950/40"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Validando...</span>
              </>
            ) : (
              <span>Confirmar y Mantener Sesión</span>
            )}
          </button>
        </form>

        <p className="mt-4 text-[10px] text-zinc-550 font-mono">
          Advertencia: Si fallas o expira el tiempo, la sesión será destruida inmediatamente.
        </p>
      </div>
    </div>
  );
};

