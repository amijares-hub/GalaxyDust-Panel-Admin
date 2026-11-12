import React from 'react';
import { ShieldAlert, LogOut, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AccessDeniedProps {
  attemptedEmail?: string | null;
  onReset: () => void;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({ attemptedEmail, onReset }) => {
  const handleExit = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Error signing out:', e);
    } finally {
      onReset();
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#050506] flex items-center justify-center p-4 relative overflow-hidden select-none font-sans">
      {/* Red Alert Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-red-600/15 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg bg-zinc-950 border border-red-500/30 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl text-center">
        <div className="w-16 h-16 bg-red-950/60 border border-red-500/50 rounded-2xl flex items-center justify-center text-red-500 mx-auto mb-6 shadow-inner animate-pulse">
          <ShieldAlert size={34} className="stroke-[2.2]" />
        </div>

        <span className="text-[10px] font-mono tracking-widest text-red-500 uppercase px-2.5 py-1 bg-red-950/40 border border-red-500/20 rounded-full font-bold">
          403 FORBIDDEN — PRIVILEGIOS INSUFICIENTES
        </span>

        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wider uppercase font-display mt-4">
          ACCESO DENEGADO — ÁREA RESTRINGIDA
        </h1>

        <div className="my-6 p-4 bg-zinc-900/40 border border-zinc-800 rounded-xl text-left space-y-2 font-mono text-xs text-zinc-400">
          <div className="flex justify-between items-center text-zinc-500 border-b border-zinc-800/60 pb-2">
            <span>USUARIO DETECTADO:</span>
            <span className="text-red-400 font-semibold">{attemptedEmail || 'Usuario No Autorizado'}</span>
          </div>
          <div className="flex justify-between items-center text-zinc-500 border-b border-zinc-800/60 pb-2">
            <span>ESTADO DE SESIÓN:</span>
            <span className="text-amber-400 font-semibold">TERMINADA INMEDIATAMENTE</span>
          </div>
          <p className="text-[11px] text-zinc-500 pt-1 leading-relaxed">
            Esta cuenta no pertenece a la lista blanca administrativa de Sasorilabs ni posee privilegios de superadministrador. Se ha revocado el token de sesión y registrado el intento de acceso no autorizado.
          </p>
        </div>

        <button
          onClick={handleExit}
          className="w-full py-3 px-4 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-white rounded-xl text-xs font-semibold tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
        >
          <LogOut size={14} className="text-red-500" />
          <span>Volver a la Pantalla de Login</span>
        </button>
      </div>
    </div>
  );
};

