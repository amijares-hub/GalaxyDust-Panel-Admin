import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Database, Shield, Check, AlertTriangle, X, RefreshCw, Copy, ExternalLink } from 'lucide-react';
import { SupabaseConfig } from '../types';
import { loadSupabaseConfig, saveSupabaseConfig } from '../lib/supabase';

interface SupabaseConfigModalProps {
  onConfigChanged: (config: SupabaseConfig) => void;
  onClose: () => void;
}

export default function SupabaseConfigModal({ onConfigChanged, onClose }: SupabaseConfigModalProps) {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [config, setConfig] = useState<SupabaseConfig>(() => {
    const current = loadSupabaseConfig();
    setUrl(current.url);
    setAnonKey(current.anonKey);
    return current;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ status: 'success' | 'error' | null; message: string }>({ status: null, message: '' });
  const [copied, setCopied] = useState(false);

  // ─── REPARACIÓN EN SINTAXIS Y ALINEACIÓN DE TABLAS MAESTRAS GALAXYDUST ───
  const sqlBlueprint = `-- SQL BLUEPRINT PARA CONFIGURAR TU SERVIDOR SUPABASE
-- Ejecuta este bloque completo en el SQL Editor de tu proyecto en la nube

-- 1. TABLA CORE: PERFILES DE USUARIOS (12 MATERIALES Y MONEDAS CANÓNICAS)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT,
    can_level INT DEFAULT 1,
    metal NUMERIC DEFAULT 500000,
    crystal NUMERIC DEFAULT 500000,
    deuterium NUMERIC DEFAULT 50,
    dark_matter NUMERIC DEFAULT 10,
    omniplate NUMERIC DEFAULT 10,
    orichaltron NUMERIC DEFAULT 10,
    lunar_fiber NUMERIC DEFAULT 50,
    infinity_core NUMERIC DEFAULT 10,
    primal_token NUMERIC DEFAULT 100,
    xenoplasm NUMERIC DEFAULT 100,
    organium NUMERIC DEFAULT 1000,
    mana NUMERIC DEFAULT 10,
    gd_coins INT DEFAULT 1000,
    phantom_coins INT DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABLA CORE: HANGAR DE FLOTAS (SASORI FLEETS)
CREATE TABLE IF NOT EXISTS public.sasori_fleets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    total_power_score INT DEFAULT 0,
    ships JSONB DEFAULT '[]'::jsonb,
    astrobots JSONB DEFAULT '[]'::jsonb,
    tools JSONB DEFAULT '[]'::jsonb,
    consumables JSONB DEFAULT '[]'::jsonb,
    badges JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABLA CORE: MONITOR DE EXPEDICIONES EN VUELO
CREATE TABLE IF NOT EXISTS public.active_expeditions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    fleet_id UUID REFERENCES public.sasori_fleets(id) ON DELETE SET NULL,
    fleet_name TEXT NOT NULL,
    sector_name TEXT NOT NULL,
    galaxy_cluster TEXT NOT NULL,
    star_cluster TEXT NOT NULL,
    duration_hours INT NOT NULL DEFAULT 2,
    risk_factor NUMERIC NOT NULL DEFAULT 0.20,
    is_adrift BOOLEAN DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'LAUNCHED' CHECK (status IN ('LAUNCHED', 'SUCCESS', 'FAILED', 'CLAIMED')),
    launch_time TIMESTAMP WITH TIME ZONE NOT NULL,
    estimated_return_time TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABLA AUXILIAR: HISTORIAL PROGRESO DE CÚMULOS (GC HISTORY)
CREATE TABLE IF NOT EXISTS public.expedition_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    galaxy_cluster TEXT NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar replicación síncrona en tiempo real para el radar de vuelos
ALTER TABLE public.active_expeditions REPLICA IDENTITY FULL;
`;

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFeedback({ status: null, message: '' });

    if (!url || !anonKey) {
      const emptyConfig = saveSupabaseConfig({ url: '', anonKey: '' });
      setConfig(emptyConfig);
      onConfigChanged(emptyConfig);
      setIsLoading(false);
      setFeedback({ status: 'success', message: 'Conexión restablecida a Modo Demo Local.' });
      return;
    }

    try {
      const testUrl = url.trim();
      const testKey = anonKey.trim();
      
      if (!testUrl.startsWith('https://')) {
        throw new Error('La URL de Supabase debe comenzar con el protocolo seguro https://');
      }

      const updated = saveSupabaseConfig({ url: testUrl, anonKey: testKey });
      setConfig(updated);
      onConfigChanged(updated);
      setFeedback({
        status: 'success',
        message: '¡Conexión guardada con éxito! La plataforma ahora sincroniza el radar en tiempo real.'
      });
    } catch (err: any) {
      setFeedback({
        status: 'error',
        message: err.message || 'Error al validar los parámetros de Supabase'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlBlueprint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl flex flex-col custom-scrollbar"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-900 bg-black">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-red-600/10 border border-red-500/20 text-red-500">
              <Database size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold font-sans tracking-tight text-white uppercase">
                Configuración del Servidor Central
              </h2>
              <p className="text-xs text-zinc-500 font-mono mt-0.5">
                Sincroniza tus credenciales de API de Supabase para enlazar la telemetría, crafteo y CRM.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-900 border border-transparent hover:border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form & Code Split */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-y-auto">
          {/* Left panel: Form */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 p-3 bg-zinc-900/40 border border-zinc-800/60 rounded-lg text-xs leading-relaxed text-zinc-400 font-mono">
              <Shield className="text-red-500 flex-shrink-0" size={16} />
              <span>
                <strong>PROTOCOLO DE SEGURIDAD:</strong> Las credenciales se persisten localmente encriptadas en `localStorage`. Las peticiones viajan por cifrado SSL directo al SDK.
              </span>
            </div>

            <form onSubmit={handleTestAndSave} className="space-y-4">
              <div>
                <label htmlFor="url" className="block text-[10px] font-bold font-mono uppercase tracking-wider text-zinc-500 mb-2">
                  SUPABASE_PROJECT_URL
                </label>
                <input
                  id="url"
                  type="text"
                  placeholder="https://tu-proyecto.supabase.co"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-900 text-white placeholder-zinc-700 rounded-lg border border-zinc-800 focus:outline-none focus:border-red-500 text-xs transition-colors font-mono"
                />
              </div>

              <div>
                <label htmlFor="anonKey" className="block text-[10px] font-bold font-mono uppercase tracking-wider text-zinc-500 mb-2">
                  SUPABASE_ANON_KEY (CLIENT PUBLIC KEY)
                </label>
                <textarea
                  id="anonKey"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  rows={4}
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-900 text-white placeholder-zinc-700 rounded-lg border border-zinc-800 focus:outline-none focus:border-red-500 text-[11px] transition-colors font-mono resize-none custom-scrollbar"
                />
              </div>

              {feedback.status && (
                <div
                  className={`p-4 rounded-lg flex gap-3 text-xs border font-mono ${
                    feedback.status === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      : 'bg-red-500/10 border-red-500/20 text-red-500'
                  }`}
                >
                  {feedback.status === 'success' ? (
                    <Check className="flex-shrink-0 mt-0.5" size={16} />
                  ) : (
                    <AlertTriangle className="flex-shrink-0 mt-0.5" size={16} />
                  )}
                  <span>{feedback.message}</span>
                </div>
              )}

              <div className="flex gap-4 pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-3 px-4 bg-zinc-900 hover:bg-red-650 border border-zinc-800 hover:border-red-500 text-white text-xs font-bold font-mono uppercase tracking-widest rounded transition-all shadow-lg cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <RefreshCw className="animate-spin text-white" size={14} />
                  ) : (
                    <Database size={14} className="text-red-500" />
                  )}
                  <span>{url && anonKey ? 'Verificar & Acoplar Red' : 'Revertir a Modo Local'}</span>
                </button>
              </div>
            </form>

            <div className="pt-4 border-t border-zinc-900 font-mono">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-3">
                Estado del Espectro de Red
              </h4>
              <div className="p-4 bg-zinc-900/40 border border-zinc-900 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      config.isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                    }`}
                  />
                  <div>
                    <span className="text-xs font-bold text-white uppercase block">
                      {config.isConnected ? 'LINK_REMOTE_ACTIVE' : 'MODO DEMO STANDALONE'}
                    </span>
                    <p className="text-[11px] text-zinc-500 font-sans mt-0.5 leading-tight">
                      {config.isConnected ? 'Transmitiendo eventos síncronos por WebSockets.' : 'Persistiendo datos volátiles por memoria de sesión local.'}
                    </p>
                  </div>
                </div>
                {config.isConnected && (
                  <button
                    onClick={() => {
                      const emptyConfig = saveSupabaseConfig({ url: '', anonKey: '' });
                      setConfig(emptyConfig);
                      onConfigChanged(emptyConfig);
                      setUrl('');
                      setAnonKey('');
                      setFeedback({ status: 'success', message: 'Desconectado del servidor central. Revertido a entorno local.' });
                    }}
                    className="text-[10px] font-bold text-red-500 hover:text-red-400 underline cursor-pointer"
                  >
                    DISCONNECT
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right panel: SQL Console */}
          <div className="flex flex-col bg-zinc-900/20 border border-zinc-900 rounded-xl p-5 space-y-4 font-mono text-xs">
            <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
              <span className="text-[10px] font-bold tracking-wide uppercase text-zinc-500 flex items-center gap-1.5">
                <Shield size={13} className="text-red-500" /> ESTRUCTURA DEL CATALOGO SEMILLA
              </span>
              <button
                onClick={handleCopySql}
                className="text-[10px] py-1 px-2.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 flex items-center gap-1.5 transition-colors cursor-pointer font-bold uppercase"
              >
                {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                {copied ? '¡Copiado!' : 'Copiar Blueprint'}
              </button>
            </div>

            <div className="flex-1 relative bg-black border border-zinc-900 rounded-lg overflow-hidden p-1">
              <textarea
                aria-label="Código SQL Blueprint"
                readOnly
                value={sqlBlueprint}
                className="w-full h-[290px] p-3 text-[11px] font-mono text-zinc-500 bg-transparent resize-none focus:outline-none custom-scrollbar select-all leading-normal"
              />
            </div>

            <div className="text-[11px] text-zinc-500 leading-relaxed font-sans space-y-2">
              <p>
                <strong>Guía de Despliegue en 3 pasos:</strong>
              </p>
              <ul className="list-disc pl-4 space-y-1.5 text-zinc-500">
                <li>Crea una base de datos en tu panel oficial de <a href="https://supabase.com" target="_blank" rel="noreferrer noopener" className="text-red-500 hover:underline inline-flex items-center gap-0.5">Supabase.com <ExternalLink size={10} /></a>.</li>
                <li>Pega el código de arriba en el <b>SQL Editor</b> de Supabase y presiona <b>Run</b> para crear el puente.</li>
                <li>Extrae tus claves públicas en la sección <b>Settings ➔ API</b> de tu proyecto y pégalas a la izquierda.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-900 flex justify-end gap-3 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-white font-mono text-[10px] font-bold uppercase rounded-lg cursor-pointer"
          >
            Seguir en Modo Actual
          </button>
        </div>
      </motion.div>
    </div>
  );
}
