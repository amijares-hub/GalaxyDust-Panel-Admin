import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Shield, Zap, Radio, Terminal, Settings, Volume2, VolumeX, 
  Eye, RefreshCw, Globe, Sliders, Database, Sparkles, Cpu, Coins, 
  Flame, Bell, Power, Monitor, CheckCircle2, Save, AlertTriangle 
} from 'lucide-react';
import { GalaxyDustConfig } from '../types';
import { supabase } from '../lib/supabase';

interface GalaxyDustHUDProps {
  config: GalaxyDustConfig;
  onUpdateConfig?: (updatedConfig: GalaxyDustConfig) => void;
  activeUsersCount?: number;
  serverLatencyMs?: number;
  setIsAlertToShow?: (alert: { show: boolean; status: 'success' | 'error' | 'warning'; message: string }) => void;
}

export const GalaxyDustHUD: React.FC<GalaxyDustHUDProps> = ({
  config,
  onUpdateConfig,
  activeUsersCount = 42,
  serverLatencyMs = 24,
  setIsAlertToShow
}) => {
  const [hudConfig, setHudConfig] = useState<GalaxyDustConfig>(config);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'telemetry' | 'economy_rates' | 'liveops_overlay' | 'hud_theme'>('telemetry');
  
  // HUD Visual Toggles
  const [crtEffect, setCrtEffect] = useState<boolean>(true);
  const [audioFeedback, setAudioFeedback] = useState<boolean>(true);
  const [hudThemeColor, setHudThemeColor] = useState<'red' | 'cyan' | 'amber' | 'emerald'>('red');
  
  // Realtime Rates Ticker
  const [metalRate, setMetalRate] = useState<number>(config.metalMultiplier || 1.0);
  const [crystalRate, setCrystalRate] = useState<number>(config.crystalMultiplier || 1.0);
  const [deuteriumRate, setDeuteriumRate] = useState<number>(config.deuteriumMultiplier || 1.0);
  const [gdExchangeRate, setGdExchangeRate] = useState<number>(1.00); // 1 GD = 1.00 USD
  
  // LiveOps Banners
  const [emergencyBanner, setEmergencyBanner] = useState<string>('ALERTA: Tormenta Solar Detectada en Sector Alpha. Boost de Extracción +20%.');
  const [bannerActive, setBannerActive] = useState<boolean>(true);

  useEffect(() => {
    setHudConfig(config);
    if (config.metalMultiplier) setMetalRate(config.metalMultiplier);
    if (config.crystalMultiplier) setCrystalRate(config.crystalMultiplier);
    if (config.deuteriumMultiplier) setDeuteriumRate(config.deuteriumMultiplier);
  }, [config]);

  const handleSaveHUDConfig = async () => {
    setIsSaving(true);
    try {
      const updated: GalaxyDustConfig = {
        ...hudConfig,
        metalMultiplier: Number(metalRate),
        crystalMultiplier: Number(crystalRate),
        deuteriumMultiplier: Number(deuteriumRate)
      };

      const { error } = await supabase
        .from('sasori_game_hud')
        .upsert({
          id: 'global_hud_config',
          config: updated,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      if (onUpdateConfig) onUpdateConfig(updated);

      if (setIsAlertToShow) {
        setIsAlertToShow({
          show: true,
          status: 'success',
          message: '🖥️ CONFIGURACIÓN HUD DGN: Parámetros del cliente e interfaz sincronizados en Supabase.'
        });
      }
    } catch (e: any) {
      if (setIsAlertToShow) {
        setIsAlertToShow({
          show: true,
          status: 'error',
          message: `Error al guardar HUD: ${e.message}`
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const themeBorderColor = {
    red: 'border-red-900/60 shadow-red-950/20 text-red-400',
    cyan: 'border-cyan-900/60 shadow-cyan-950/20 text-cyan-400',
    amber: 'border-amber-900/60 shadow-amber-950/20 text-amber-400',
    emerald: 'border-emerald-900/60 shadow-emerald-950/20 text-emerald-400'
  }[hudThemeColor];

  const themeBgAccent = {
    red: 'bg-red-950/40 text-red-400 border-red-900',
    cyan: 'bg-cyan-950/40 text-cyan-400 border-cyan-900',
    amber: 'bg-amber-950/40 text-amber-400 border-amber-900',
    emerald: 'bg-emerald-950/40 text-emerald-400 border-emerald-900'
  }[hudThemeColor];

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-slate-100 font-mono text-xs space-y-6 rounded-xl border border-slate-800 text-left select-none relative overflow-hidden">
      
      {/* OVERLAY CRT OPCIONAL */}
      {crtEffect && (
        <div className="pointer-events-none absolute inset-0 z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-20" />
      )}

      {/* BANNER LIVEOPS SUPERIOR */}
      <AnimatePresence>
        {bannerActive && emergencyBanner && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl flex items-center justify-between gap-3 text-red-200 text-[11px] shadow-lg shadow-red-950/50"
          >
            <div className="flex items-center gap-2">
              <Radio size={14} className="text-red-400 animate-pulse shrink-0" />
              <span className="font-bold tracking-wider uppercase font-mono">{emergencyBanner}</span>
            </div>
            <button 
              onClick={() => setBannerActive(false)}
              className="text-red-400 hover:text-white text-[10px] font-bold uppercase cursor-pointer"
            >
              Cerrar Banner
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BARRA SUPERIOR DE TELEMETRÍA Y ESTADO */}
      <div className={`p-4 bg-slate-950 rounded-xl border shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all ${themeBorderColor}`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Monitor size={18} className="animate-pulse" />
            <span className="font-black text-white text-sm uppercase tracking-wider">
              SASORI DGN // GALAXY DUST HUD & OVERLAY ENGINE
            </span>
          </div>
          <p className="text-slate-400 font-sans text-xs">
            Consola central de parametrización del HUD del cliente, multiplicadores de recursos y overlays tácticos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg flex items-center gap-2">
            <Activity size={12} className="text-emerald-400 animate-ping" />
            <span>PING: <strong className="text-emerald-400">{serverLatencyMs}ms</strong></span>
          </div>

          <div className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg flex items-center gap-2">
            <Globe size={12} className="text-cyan-400" />
            <span>PILOTOS: <strong className="text-cyan-300">{activeUsersCount} ONLINE</strong></span>
          </div>

          <button
            onClick={handleSaveHUDConfig}
            disabled={isSaving}
            className="px-4 py-2 bg-red-650 hover:bg-red-500 text-white font-black uppercase text-[11px] rounded-lg shadow-lg shadow-red-950/40 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            {isSaving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
            <span>{isSaving ? 'PERSISTIENDO...' : 'GUARDAR PARÁMETROS'}</span>
          </button>
        </div>
      </div>

      {/* PESTAÑAS DE SECCIÓN */}
      <div className="flex border-b border-slate-800 gap-1 overflow-x-auto select-none">
        {[
          { id: 'telemetry', label: '📊 Telemetría y Monitor Global', icon: <Activity size={14} /> },
          { id: 'economy_rates', label: '🪙 Tasa de Recurso & Multiplicadores', icon: <Coins size={14} /> },
          { id: 'liveops_overlay', label: '📢 Banners LiveOps & Alertas', icon: <Bell size={14} /> },
          { id: 'hud_theme', label: '🎨 Estilo Visual & CRT', icon: <Sliders size={14} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 font-bold uppercase text-[10.5px] tracking-wider transition-all border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-red-500 text-red-400 bg-slate-950/80'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* VISTA 1: TELEMETRÍA Y MONITOR GLOBAL */}
      {activeTab === 'telemetry' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-2">
              <span className="text-[9.5px] text-slate-500 font-bold uppercase tracking-wider block">Estado del Servidor</span>
              <div className="text-lg font-black text-emerald-400 flex items-center gap-2">
                <CheckCircle2 size={16} /> ONLINE (PRODUCTION)
              </div>
              <p className="text-[9.5px] text-slate-500">Nodo Supabase PostgreSQL conectado sin latencia atípica.</p>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-2">
              <span className="text-[9.5px] text-slate-500 font-bold uppercase tracking-wider block">Paridad GD Coins (Ledger)</span>
              <div className="text-lg font-black text-amber-400 flex items-center gap-2">
                <Coins size={16} /> $1.00 USD = 1.00 GD
              </div>
              <p className="text-[9.5px] text-slate-500">Paridad fija autoritativa de la billetera.</p>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-2">
              <span className="text-[9.5px] text-slate-500 font-bold uppercase tracking-wider block">Estación C.A.N. Terminal</span>
              <div className="text-lg font-black text-cyan-400 flex items-center gap-2">
                <Cpu size={16} /> OPERATIVA
              </div>
              <p className="text-[9.5px] text-slate-500">Frecuencia de refresco activa a nivel de cliente.</p>
            </div>
          </div>
        </div>
      )}

      {/* VISTA 2: TASA DE RECURSOS Y MULTIPLICADORES */}
      {activeTab === 'economy_rates' && (
        <div className="bg-slate-950 p-6 border border-slate-850 rounded-xl space-y-6 animate-fadeIn">
          <div className="border-b border-slate-850 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Coins size={16} className="text-amber-400" /> Multiplicadores Globales de Extracción
            </h3>
            <p className="text-slate-400 text-xs mt-1 font-sans">
              Ajusta los factores de producción en tiempo real. Estos valores afectan directamente el cálculo de expediciones y minería.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
              <label className="text-xs font-bold text-slate-300 uppercase block">🪨 Metal Multiplier</label>
              <input
                type="number"
                step="0.05"
                min="0.1"
                max="10.0"
                value={metalRate}
                onChange={e => setMetalRate(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded text-white font-bold text-sm outline-none focus:border-red-500"
              />
              <span className="text-[9.5px] text-slate-500 block">Factor actual: {metalRate.toFixed(2)}x base</span>
            </div>

            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
              <label className="text-xs font-bold text-cyan-400 uppercase block">💎 Cristal Multiplier</label>
              <input
                type="number"
                step="0.05"
                min="0.1"
                max="10.0"
                value={crystalRate}
                onChange={e => setCrystalRate(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded text-cyan-300 font-bold text-sm outline-none focus:border-cyan-500"
              />
              <span className="text-[9.5px] text-slate-500 block">Factor actual: {crystalRate.toFixed(2)}x base</span>
            </div>

            <div className="p-4 bg-slate-900/60 border border-slate-850 rounded-xl space-y-3">
              <label className="text-xs font-bold text-amber-400 uppercase block">🧪 Deuterio Multiplier</label>
              <input
                type="number"
                step="0.05"
                min="0.1"
                max="10.0"
                value={deuteriumRate}
                onChange={e => setDeuteriumRate(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded text-amber-300 font-bold text-sm outline-none focus:border-amber-500"
              />
              <span className="text-[9.5px] text-slate-500 block">Factor actual: {deuteriumRate.toFixed(2)}x base</span>
            </div>
          </div>
        </div>
      )}

      {/* VISTA 3: BANNERS LIVEOPS & ALERTAS */}
      {activeTab === 'liveops_overlay' && (
        <div className="bg-slate-950 p-6 border border-slate-850 rounded-xl space-y-6 animate-fadeIn">
          <div className="border-b border-slate-850 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Bell size={16} className="text-red-500" /> Banners Emergentes en Vivo
            </h3>
            <p className="text-slate-400 text-xs mt-1 font-sans">
              Modifica la marquesina de noticias y eventos especiales transmitida a la interfaz del usuario.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase block mb-2">Mensaje del Banner Táctico:</label>
              <textarea
                rows={3}
                value={emergencyBanner}
                onChange={e => setEmergencyBanner(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 p-3 rounded text-white text-xs font-mono outline-none focus:border-red-500"
                placeholder="Escribe el mensaje del comunicado..."
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setBannerActive(!bannerActive)}
                className={`px-4 py-2 font-bold uppercase text-xs rounded-lg transition-all cursor-pointer border ${
                  bannerActive
                    ? 'bg-red-950 text-red-400 border-red-800'
                    : 'bg-slate-900 text-slate-500 border-slate-800'
                }`}
              >
                {bannerActive ? '● BANNER VISIBLE EN CLIENTE' : '○ BANNER OCULTO'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VISTA 4: ESTILO VISUAL & CRT */}
      {activeTab === 'hud_theme' && (
        <div className="bg-slate-950 p-6 border border-slate-850 rounded-xl space-y-6 animate-fadeIn">
          <div className="border-b border-slate-850 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sliders size={16} className="text-cyan-400" /> Personalización del Interfaz (HUD)
            </h3>
            <p className="text-slate-400 text-xs mt-1 font-sans">
              Ajusta los efectos retro-futuristas de la terminal y los esquemas de color dominantes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase block">Efecto CRT Scanline</span>
              <button
                onClick={() => setCrtEffect(!crtEffect)}
                className={`w-full py-2.5 font-bold uppercase text-xs rounded-lg border transition-all cursor-pointer ${
                  crtEffect
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
                    : 'bg-slate-950 text-slate-500 border-slate-800'
                }`}
              >
                {crtEffect ? '⚡ EFECTO CRT ACTIVO' : 'EFECTO DESACTIVADO'}
              </button>
            </div>

            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase block">Esquema de Color Dominante</span>
              <div className="grid grid-cols-4 gap-2">
                {(['red', 'cyan', 'amber', 'emerald'] as const).map(color => (
                  <button
                    key={color}
                    onClick={() => setHudThemeColor(color)}
                    className={`py-2 rounded font-bold uppercase text-[10px] border transition-all cursor-pointer ${
                      hudThemeColor === color
                        ? 'bg-slate-800 text-white border-white shadow-md'
                        : 'bg-slate-950 text-slate-500 border-slate-900'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default GalaxyDustHUD;