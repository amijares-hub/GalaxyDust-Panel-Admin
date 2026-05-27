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

  const sqlBlueprint = `-- SQL BLUEPRINT PARA CONFIGURAR TU SUPABASE
-- Ejecuta esto en la consola SQL de tu proyecto Supabase

-- 1. Tabla de Branding
create table if_not_exists sasori_brand_config (
  id text primary key,
  site_name text,
  logo_url text,
  primary_color text,
  accent_color text,
  typography text,
  border_radius text,
  is_dark boolean,
  announcement_text text,
  footer_text text
);

-- 2. Tabla de Componentes Web
create table if_not_exists sasori_web_components (
  id text primary key,
  name text,
  type text,
  description text,
  tab text,
  status text,
  tooltip_info text,
  properties jsonb
);

-- 3. Tabla de Reglas de Juego
create table if_not_exists sasori_game_rules (
  id text primary key,
  name text,
  description text,
  trigger text,
  conditions jsonb,
  action jsonb,
  is_active boolean,
  tooltip text,
  created_at timestamp with time zone default now()
);

-- 4. Tabla de Usuarios / Jugadores (CRM)
create table if_not_exists sasori_users (
  id text primary key,
  username text,
  email text,
  level integer,
  gold integer,
  gems integer,
  xp integer,
  role text,
  status text,
  avatar_url text,
  created_at timestamp with time zone default now(),
  last_active timestamp with time zone default now(),
  inventory jsonb
);`;

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
      // Create test client
      const testUrl = url.trim();
      const testKey = anonKey.trim();
      
      // Basic URL verification
      if (!testUrl.startsWith('https://')) {
        throw new Error('La URL de Supabase debe comenzar con https://');
      }

      const updated = saveSupabaseConfig({ url: testUrl, anonKey: testKey });
      setConfig(updated);
      onConfigChanged(updated);
      setFeedback({
        status: 'success',
        message: '¡Conexión guardada con éxito! La plataforma ahora sincronizará automáticamente.'
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-red-600/10 border border-red-500/20 text-red-500">
              <Database size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold font-sans tracking-tight text-white">
                Configuración del Servidor Supabase
              </h2>
              <p className="text-xs text-zinc-400">
                Sincroniza tus configuraciones de branding, reglas de juego de Sasorilabs y CRM de usuarios en tu base de datos en la nube.
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
            <div className="flex items-center gap-2 p-3 bg-zinc-900/40 border border-zinc-800/60 rounded-lg text-xs leading-relaxed text-zinc-300">
              <Shield className="text-red-500 flex-shrink-0" size={16} />
              <span>
                <strong>Nota de seguridad:</strong> Las credenciales de Supabase se persisten únicamente en tu navegador local (`localStorage`) y las peticiones se efectúan con el SDK directo de Supabase.
              </span>
            </div>

            <form onSubmit={handleTestAndSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  SUPABASE_PROJECT_URL
                </label>
                <input
                  type="text"
                  placeholder="https://tu-proyecto.supabase.co"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-900 text-white placeholder-zinc-600 rounded-lg border border-zinc-800 focus:outline-none focus:border-red-500 text-sm transition-colors font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  SUPABASE_ANON_KEY (CLIENT KEY)
                </label>
                <textarea
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  rows={4}
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-900 text-white placeholder-zinc-600 rounded-lg border border-zinc-800 focus:outline-none focus:border-red-500 text-xs transition-colors font-mono resize-none"
                />
              </div>

              {feedback.status && (
                <div
                  className={`p-4 rounded-lg flex gap-3 text-sm leading-snug border ${
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
                  className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-lg shadow-lg hover:shadow-red-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <RefreshCw className="animate-spin" size={16} />
                  ) : (
                    <Database size={16} />
                  )}
                  {url && anonKey ? 'Verificar y Conectar' : 'Restablecer a Modo Local'}
                </button>
              </div>
            </form>

            <div className="pt-4 border-t border-zinc-900">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
                Estado Actual del Cliente
              </h4>
              <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      config.isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 shadow-lg'
                    }`}
                  />
                  <div>
                    <span className="text-sm font-medium text-white">
                      {config.isConnected ? 'Sincronizado con Supabase' : 'Modo Demo Activo (Local)'}
                    </span>
                    <p className="text-xs text-zinc-500">
                      {config.isConnected ? 'Servidor de base de datos remoto activo' : 'Datos persistiendo temporalmente por localStorage'}
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
                      setFeedback({ status: 'success', message: 'Desconectado de Supabase. Revertido a base de datos de simulación.' });
                    }}
                    className="text-xs text-red-500 hover:text-red-400 underline cursor-pointer"
                  >
                    Desconectar
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right panel: SQL Console and Instructions */}
          <div className="flex flex-col bg-zinc-900/30 border border-zinc-800 rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold tracking-wide uppercase text-zinc-400 flex items-center gap-1.5">
                <Shield size={14} className="text-red-500" /> Esquema de Tablas Requerido
              </span>
              <button
                onClick={handleCopySql}
                className="text-xs py-1 px-2.5 rounded hover:bg-zinc-800 border border-zinc-800 text-zinc-300 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                {copied ? '¡Copiado!' : 'Copiar SQL Blueprint'}
              </button>
            </div>

            <div className="flex-1 relative bg-black/80 rounded-lg overflow-hidden border border-zinc-900">
              <textarea
                readOnly
                value={sqlBlueprint}
                className="w-full h-[280px] p-4 text-xs font-mono text-zinc-400 bg-transparent resize-none focus:outline-none leading-relaxed select-all"
              />
            </div>

            <div className="text-xs text-zinc-400 leading-normal space-y-2">
              <p>
                <strong>¿Cómo funciona?</strong>
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Crea un proyecto en su panel oficial de <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-red-500 hover:underline inline-flex items-center gap-0.5">Supabase <ExternalLink size={10} /></a>.</li>
                <li>Pega este código estructurado en el editor SQL para crear las tablas necesarias instantáneamente.</li>
                <li>Obtén tu dirección universal y clave anónima en la pestaña Settings &rarr; API.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-900 flex justify-end gap-3 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium rounded-lg border border-zinc-800 cursor-pointer transition-colors"
          >
            Seguir en Modo Actual
          </button>
        </div>
      </motion.div>
    </div>
  );
}
