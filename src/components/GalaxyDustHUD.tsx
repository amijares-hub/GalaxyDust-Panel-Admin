import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, Cpu, Box, Rocket, ShoppingCart, Ghost, Users, Save, Info, Sparkles, 
  HelpCircle, Laptop, Smartphone, Eye, EyeOff, Radio, Plus, Trash2, ArrowRight, 
  Play, RefreshCw, Star, Search, ChevronRight, MessageSquare, Heart, Terminal, AlertCircle,
  Download, Award, Check, AlertTriangle
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { GalaxyDustConfig, HangarAsset, SideralShip, ShopBundle, ShopBundleItem, QuantumUnitShard, QuantumSupplyItem, AllianceRosterMember, COMMessage } from '../types';
import AdminSanitizerModule from './AdminSanitizerModule';

interface GalaxyDustHUDProps {
  config: GalaxyDustConfig;
  onSave: (updated: GalaxyDustConfig) => Promise<void>;
  setIsAlertToShow: (alert: { show: boolean; status: 'success' | 'error'; message: string }) => void;
}

export default function GalaxyDustHUD({ config, onSave, setIsAlertToShow }: GalaxyDustHUDProps) {
  // Local active state copy of the HUD parameters
  const [hud, setHud] = useState<GalaxyDustConfig>(() => ({ ...config }));
  const [activeTab, setActiveTab] = useState<'auth' | 'economic' | 'hangar' | 'sideral' | 'shop' | 'phantom' | 'alliance' | 'sanitizer'>('auth');
  const [isSaving, setIsSaving] = useState(false);

  // Active sub-simulation interactive states
  // Module 1 (Auth) Simulation
  const [simAuthEmail, setSimAuthEmail] = useState('');
  const [simAuthPassword, setSimAuthPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMeSim, setRememberMeSim] = useState(true);
  const [simAuthToast, setSimAuthToast] = useState<{ show: boolean; text: string; mode: 'alert' | 'correct' | 'established' }>({ show: false, text: '', mode: 'alert' });
  const [simFaseAuth, setSimFaseAuth] = useState<'portal' | 'login' | 'register' | 'recovery' | 'confirm' | 'mfa' | 'reject' | 'auth_ok'>('portal');
  const [verificationCode, setVerificationCode] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);

  // Module 2 (Economic) Simulation
  const [activeParticles, setActiveParticles] = useState<{ id: number; text: string; x: number; y: number }[]>([]);
  const [simPowerScore, setSimPowerScore] = useState(hud.hudEconomic.combat.powerScore);
  const [simAp, setSimAp] = useState(hud.hudEconomic.combat.apCurrent);
  const [simVaultOpen, setSimVaultOpen] = useState(false);

  // Module 3 (Hangar) Simulation
  const [hangarSearch, setHangarSearch] = useState('');
  const [hangarClassFilter, setHangarClassFilter] = useState('ALL');
  const [hangarCorpFilter, setHangarCorpFilter] = useState('ALL');
  const [selectedAsset, setSelectedAsset] = useState<HangarAsset | null>(null);

  // Module 4 (Sideral) Simulation
  const [selectedClusterId, setSelectedClusterId] = useState('c_01');
  const [selectedShipId, setSelectedShipId] = useState('ds_01');
  const [explorationProgress, setExplorationProgress] = useState(0);
  const [isTransitActive, setIsTransitActive] = useState(false);
  const [transitTimeRemaining, setTransitTimeRemaining] = useState(0);
  const [quantumScanning, setQuantumScanning] = useState(false);
  const [simHistory, setSimHistory] = useState<string[]>(['Sonda estacionada en Cinturón REE-B4']);

  // Module 5 (Shop) Simulation
  const [activeCategory, setActiveCategory] = useState(hud.acquisitionShop.categories[0] || 'Gift of Heartwarming [HOT]');
  const [delayCargaCompra, setDelayCargaCompra] = useState(false);
  const [compraSuccessModal, setCompraSuccessModal] = useState<ShopBundle | null>(null);

  // Module 6 (Phantom) Simulation
  const [lastHoloDescription, setLastHoloDescription] = useState('Sitúa el cursor sobre una esquirla o módulo para analizar sus atributos.');
  const [phantomFilter, setPhantomFilter] = useState<'ALL' | 'S' | 'A' | 'C' | 'E'>('ALL');
  const [refreshCountdown, setRefreshCountdown] = useState(hud.phantomStation.autoRefreshStockTimerSeconds);
  const [attemptsLeft, setAttemptsLeft] = useState(hud.phantomStation.refreshAttemptsMax - hud.phantomStation.refreshAttemptsUsed);

  // Module 7 (Alliance) Simulation
  const [simChatInput, setSimChatInput] = useState('');
  const [simMessages, setSimMessages] = useState<COMMessage[]>(hud.allianceOperations.comMessages);
  const [simTechProgress, setSimTechProgress] = useState(hud.allianceOperations.techProgressPercent);
  const [simTacticalPower, setSimTacticalPower] = useState(124500);

  // Sync config updates when main prop modifications trigger
  useEffect(() => {
    setHud({ ...config });
  }, [config]);

  // Handle countdowns / timers simulation effects
  useEffect(() => {
    const timer = setInterval(() => {
      // Phantom auto-refresh count simulation
      setRefreshCountdown(prev => (prev > 0 ? prev - 1 : hud.phantomStation.autoRefreshStockTimerSeconds));
      
      // Sideral transit simulation
      if (isTransitActive) {
        setTransitTimeRemaining(prev => {
          if (prev <= 1) {
            setIsTransitActive(false);
            setExplorationProgress(100);
            const cluster = hud.sideralExploration.starClusters.find(c => c.id === selectedClusterId);
            setSimHistory(h => [`Misión concluida en ${cluster?.name || 'Clúster Sideral'} - Recursos inyectados!`, ...h]);
            return 0;
          }
          const cluster = hud.sideralExploration.starClusters.find(c => c.id === selectedClusterId);
          const totalSec = cluster?.durationSeconds || 15;
          const currentProgress = ((totalSec - (prev - 1)) / totalSec) * 100;
          setExplorationProgress(Math.min(99, Math.round(currentProgress)));
          return prev - 1;
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isTransitActive, selectedClusterId, hud]);

  // Apply save to Supabase / Local database
  const handleSaveHud = async () => {
    setIsSaving(true);
    try {
      await onSave(hud);
      setIsAlertToShow({
        show: true,
        status: 'success',
        message: '¡Configuraciones GalaxyDust HUD guardadas correctamente en los servidores de Sasorilabs!'
      });
    } catch (err: any) {
      setIsAlertToShow({
        show: true,
        status: 'error',
        message: err.message || 'Fallo de guardado en base de datos.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Helper password strength analyzer
  const analyzePasswordStrength = (pass: string): { levelText: string; score: number } => {
    if (!pass) return { levelText: hud.authTerminal.passwordStrength.noKey, score: 0 };
    if (pass.length < 5) return { levelText: hud.authTerminal.passwordStrength.weak, score: 1 };
    if (pass.length < 8) return { levelText: hud.authTerminal.passwordStrength.average, score: 2 };
    if (/[A-Z]/.test(pass) && /[0-9]/.test(pass) && pass.length >= 10) {
      return { levelText: hud.authTerminal.passwordStrength.military, score: 4 };
    }
    return { levelText: hud.authTerminal.passwordStrength.strong, score: 3 };
  };

  const passwordEval = analyzePasswordStrength(simAuthPassword);

  // Trigger floating particle simulation effect
  const triggerParticles = (text: string) => {
    const id = Date.now() + Math.random();
    setActiveParticles(prev => [...prev, { id, text, x: 40 + Math.random() * 40, y: 30 + Math.random() * 40 }]);
    setTimeout(() => {
      setActiveParticles(prev => prev.filter(p => p.id !== id));
    }, 1000);
  };

  const handleExportJSON = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(hud, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `galaxydust_hud_config_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setIsAlertToShow({
        show: true,
        status: 'success',
        message: '¡Copia de seguridad del HUD (JSON) exportada y descargada con éxito!'
      });
    } catch (err: any) {
      setIsAlertToShow({
        show: true,
        status: 'error',
        message: 'No se pudo exportar la configuración visual'
      });
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      
      {/* HUD HEADER BOARD */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-zinc-950 border border-zinc-900 rounded-xl p-5">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Radio className="text-red-500 animate-pulse" size={20} /> Configurador General del Cliente (GalaxyDust HUD)
          </h2>
          <p className="text-xs text-zinc-400">
            Administra textos, monedas, precios, listas, fórmulas de cálculo y modales pertenecientes a la interfaz viva del juego.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-end xl:self-auto">
          {/* Download JSON Button */}
          <button
            onClick={handleExportJSON}
            type="button"
            className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 hover:border-zinc-700 active:translate-y-0.5 text-zinc-300 hover:text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-2 cursor-pointer"
            title="Descargar una copia de seguridad local del archivo de configuración JSON"
          >
            <Download size={13} className="text-red-500" />
            <span>Exportar JSON</span>
          </button>

          <button
            onClick={handleSaveHud}
            disabled={isSaving}
            className="px-6 py-2.5 bg-red-650 hover:bg-red-600 active:translate-y-0.5 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-lg hover:shadow-red-600/10 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="animate-spin" size={13} /> : <Save size={13} />}
            {isSaving ? 'Guardando...' : 'Guardar y Publicar HUD'}
          </button>
        </div>
      </div>

      {/* COMPONENT SELECTOR BUTTONS & WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT NAV BAR DE LOS 7 CAPITULOS DEL PDF */}
        <div className="lg:col-span-3 flex flex-col space-y-2 bg-zinc-950/80 border border-zinc-900 p-4 rounded-xl">
          <span className="text-[10px] font-mono font-bold tracking-wider text-zinc-500 uppercase px-2 mb-2">Componentes de Interfaz</span>
          
          {( [
            { id: 'auth', name: '1. Terminal Autenticación', icon: Shield },
            { id: 'economic', name: '2. HUD Económico Maestro', icon: Cpu },
            { id: 'hangar', name: '3. Hangar y Base Logística', icon: Box },
            { id: 'sideral', name: '4. Exploración Sideral', icon: Rocket },
            { id: 'shop', name: '5. Nodo Tienda y Adquisición', icon: ShoppingCart },
            { id: 'phantom', name: '6. Estación Fantasma', icon: Ghost },
            { id: 'alliance', name: '7. Central de la Alianza', icon: Users },
            { id: 'sanitizer', name: '8. Data Sanitizer', icon: AlertTriangle }
          ] as const).map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full text-left py-2.5 px-3 rounded-lg text-xs font-semibold tracking-wide flex items-center gap-3 transition-colors cursor-pointer ${
                  activeTab === item.id 
                    ? 'bg-red-600 text-white shadow-lg' 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
                }`}
              >
                <Icon size={14} />
                <span>{item.name}</span>
              </button>
            );
          })}

          <div className="mt-8 p-3 bg-red-650/5 border border-red-500/10 rounded-lg">
            <h4 className="text-[10px] font-bold text-red-500 uppercase flex items-center gap-1.5"><Sparkles size={11}/> Sincronización en Directo</h4>
            <p className="text-[10px] text-zinc-500 leading-normal mt-1">Cualquier cambio impactará inmediatamente las variables que consume el frontend del videojuego.</p>
          </div>
        </div>

        {/* WORKSPACE: FORM DE EDICIÓN A LA IZQUIERDA, PREVISUALIZACIÓN HOLOGRÁFICA INTERACTIVA A LA DERECHA */}
        <div className="lg:col-span-9 grid grid-cols-1 xl:grid-cols-2 gap-6">
          
          {activeTab === 'sanitizer' && (
            <div className="xl:col-span-2">
              <AdminSanitizerModule 
                gameHud={hud} 
                saveGameHud={(updated) => { setHud(updated); setIsSaving(true); onSave(updated).finally(() => setIsSaving(false)); }} 
                alertTrigger={(status, msg) => setIsAlertToShow({ show: true, status: status === 'warning' ? 'error' : status, message: msg })}
              />
            </div>
          )}

          {/* ======================= COPIED FORM EDIT PANEL ======================= */}
          {activeTab !== 'sanitizer' && (
            <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 flex flex-col space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
            
            <div className="border-b border-zinc-900 pb-3">
              <span className="text-xs font-bold text-red-500 uppercase font-mono tracking-widest">Panel de Parámetros</span>
              <h3 className="text-white text-sm font-semibold mt-1">
                {activeTab === 'auth' && 'Editar Datos de Acceso y Portal de Firma'}
                {activeTab === 'economic' && 'Editar Balances, Límites y Multiplicadores de HUD'}
                {activeTab === 'hangar' && 'Editar Métrica, Filtros y Atributos de Hangar'}
                {activeTab === 'sideral' && 'Editar Estaciones de Destino y Transbordadores'}
                {activeTab === 'shop' && 'Editar Categorías de Tienda y Paquetes de Carga'}
                {activeTab === 'phantom' && 'Editar Cuotas VIP, Auto-refrescos y Shards'}
                {activeTab === 'alliance' && 'Editar Datos de Alianza, Roster y Donaciones'}
              </h3>
            </div>

            {/* TAB 1: AUTH CONTROLS */}
            {activeTab === 'auth' && (
              <div className="space-y-4 font-sans text-xs">
                {/* 1. Headers Edit Section */}
                <div className="p-3 bg-zinc-900/35 border border-zinc-850 rounded-lg space-y-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">FASE DEL KERNEL (TEXTOS DE ENCABEZADO)</h4>
                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-zinc-500 text-[10px] uppercase">Portal de Acceso</label>
                      <input aria-label="input element"type="text" value={hud.authTerminal.headers.portal} onChange={(e) => setHud(h => ({ ...h, authTerminal: { ...h.authTerminal, headers: { ...h.authTerminal.headers, portal: e.target.value } } }))} className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-white focus:border-red-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-zinc-500 text-[10px] uppercase">Iniciar Sesión</label>
                      <input aria-label="input element"type="text" value={hud.authTerminal.headers.login} onChange={(e) => setHud(h => ({ ...h, authTerminal: { ...h.authTerminal, headers: { ...h.authTerminal.headers, login: e.target.value } } }))} className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-white focus:border-red-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-zinc-500 text-[10px] uppercase">Doble Factor 2FA</label>
                      <input aria-label="input element"type="text" value={hud.authTerminal.headers.mfaFactor} onChange={(e) => setHud(h => ({ ...h, authTerminal: { ...h.authTerminal, headers: { ...h.authTerminal.headers, mfaFactor: e.target.value } } }))} className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-white focus:border-red-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-zinc-500 text-[10px] uppercase">Firma Rechazada</label>
                      <input aria-label="input element"type="text" value={hud.authTerminal.headers.rejectSign} onChange={(e) => setHud(h => ({ ...h, authTerminal: { ...h.authTerminal, headers: { ...h.authTerminal.headers, rejectSign: e.target.value } } }))} className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-white focus:border-red-500 focus:outline-none" />
                    </div>
                  </div>
                </div>

                {/* 2. Toasts Messages */}
                <div className="p-3 bg-zinc-900/35 border border-zinc-850 rounded-lg space-y-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">MENSAJES INTERACTIVOS (TOASTS)</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="text-zinc-500 text-[10px] uppercase">Alerta de Seguridad</label>
                      <input aria-label="input element"type="text" value={hud.authTerminal.toasts.alert} onChange={(e) => setHud(h => ({ ...h, authTerminal: { ...h.authTerminal, toasts: { ...h.authTerminal.toasts, alert: e.target.value } } }))} className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-white focus:border-red-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-zinc-500 text-[10px] uppercase">Autorización Correcta</label>
                      <input aria-label="input element"type="text" value={hud.authTerminal.toasts.authCorrect} onChange={(e) => setHud(h => ({ ...h, authTerminal: { ...h.authTerminal, toasts: { ...h.authTerminal.toasts, authCorrect: e.target.value } } }))} className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-white focus:border-red-500 focus:outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-zinc-500 text-[10px] uppercase">Estilo de Barra</label>
                        <select aria-label="select element"value={hud.authTerminal.toasts.activeColor} onChange={(e) => setHud(h => ({ ...h, authTerminal: { ...h.authTerminal, toasts: { ...h.authTerminal.toasts, activeColor: e.target.value as any } } }))} className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-white focus:outline-none">
                          <option value="red">Rojo (Danger/Furia)</option>
                          <option value="emerald">Esmeralda (Seguro)</option>
                          <option value="cyan">Cian (Estable)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Password Strength Names */}
                <div className="p-3 bg-zinc-900/35 border border-zinc-850 rounded-lg space-y-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">MEDIDOR DE ENCRIPCIÓN</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="text-zinc-500 text-[10px]">SIN CLAVE</label>
                      <input aria-label="input element"type="text" value={hud.authTerminal.passwordStrength.noKey} onChange={(e) => setHud(h => ({ ...h, authTerminal: { ...h.authTerminal, passwordStrength: { ...h.authTerminal.passwordStrength, noKey: e.target.value } } }))} className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-white" />
                    </div>
                    <div>
                      <label className="text-zinc-500 text-[10px]">DÉBIL</label>
                      <input aria-label="input element"type="text" value={hud.authTerminal.passwordStrength.weak} onChange={(e) => setHud(h => ({ ...h, authTerminal: { ...h.authTerminal, passwordStrength: { ...h.authTerminal.passwordStrength, weak: e.target.value } } }))} className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-white" />
                    </div>
                    <div>
                      <label className="text-zinc-500 text-[10px]">FUERTE</label>
                      <input aria-label="input element"type="text" value={hud.authTerminal.passwordStrength.strong} onChange={(e) => setHud(h => ({ ...h, authTerminal: { ...h.authTerminal, passwordStrength: { ...h.authTerminal.passwordStrength, strong: e.target.value } } }))} className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: HUD ECONOMIC */}
            {activeTab === 'economic' && (
              <div className="space-y-4 font-sans text-xs">
                {/* Level / Rank */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-zinc-500 text-[10px] uppercase">Nivel de Cuenta</label>
                    <input aria-label="input element"type="number" value={hud.hudEconomic.pilot.level} onChange={(e) => setHud(h => ({ ...h, hudEconomic: { ...h.hudEconomic, pilot: { ...h.hudEconomic.pilot, level: parseInt(e.target.value) || 27 } } }))} className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-white" />
                  </div>
                  <div>
                    <label className="text-zinc-500 text-[10px] uppercase">Rango Visual Sobrepuesto</label>
                    <input aria-label="input element"type="text" value={hud.hudEconomic.pilot.rankLabel} onChange={(e) => setHud(h => ({ ...h, hudEconomic: { ...h.hudEconomic, pilot: { ...h.hudEconomic.pilot, rankLabel: e.target.value } } }))} className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-white" />
                  </div>
                </div>

                {/* Combates metrics */}
                <div className="p-3 bg-zinc-900/35 border border-zinc-850 rounded-lg space-y-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">MÉTRICAS COMBATE</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-zinc-500 text-[10px] uppercase">Puntuación Combat Score</label>
                      <input aria-label="input element"type="number" value={hud.hudEconomic.combat.powerScore} onChange={(e) => setHud(h => ({ ...h, hudEconomic: { ...h.hudEconomic, combat: { ...h.hudEconomic.combat, powerScore: parseInt(e.target.value) || 0 } } }))} className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-white" />
                    </div>
                    <div>
                      <label className="text-zinc-500 text-[10px] uppercase">Tope Máximo de Energía (AP)</label>
                      <input aria-label="input element"type="number" value={hud.hudEconomic.combat.apMax} onChange={(e) => setHud(h => ({ ...h, hudEconomic: { ...h.hudEconomic, combat: { ...h.hudEconomic.combat, apMax: parseInt(e.target.value) || 190 } } }))} className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-white" />
                    </div>
                  </div>
                </div>

                {/* Vertical slider of Buffs */}
                <div className="p-3 bg-zinc-900/35 border border-zinc-850 rounded-lg space-y-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">ESTADO DE BUFFS INICIALES</h4>
                  <div className="flex justify-around items-center">
                    <label className="flex items-center gap-1.5">
                      <input aria-label="input element"type="checkbox" checked={hud.hudEconomic.buffs.attackActive} onChange={(e) => setHud(h => ({ ...h, hudEconomic: { ...h.hudEconomic, buffs: { ...h.hudEconomic.buffs, attackActive: e.target.checked } } }))} />
                      <span>Buff Ataque</span>
                    </label>
                    <label className="flex items-center gap-1.5">
                      <input aria-label="input element"type="checkbox" checked={hud.hudEconomic.buffs.defenseActive} onChange={(e) => setHud(h => ({ ...h, hudEconomic: { ...h.hudEconomic, buffs: { ...h.hudEconomic.buffs, defenseActive: e.target.checked } } }))} />
                      <span>Buff Defensa</span>
                    </label>
                  </div>
                </div>

                {/* 6 core currencies edit */}
                <div className="p-3 bg-zinc-900/35 border border-zinc-850 rounded-lg space-y-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">BANCARIO: LAS 6 MONEDAS MÁSTER</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {Object.keys(hud.hudEconomic.currencies).map((curr) => (
                      <div key={curr}>
                        <label className="text-zinc-500 text-[9px] uppercase font-mono">{curr}</label>
                        <input aria-label="input element"type="number" value={(hud.hudEconomic.currencies as any)[curr]} onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setHud(h => ({ ...h, hudEconomic: { ...h.hudEconomic, currencies: { ...h.hudEconomic.currencies, [curr]: val } } }));
                        }} className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-white text-xs font-mono" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dynamic variables */}
                <div className="p-3 bg-zinc-900/35 border border-zinc-850 rounded-lg space-y-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">INTERACCIONES CLIENTE</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-zinc-500 text-[10px] uppercase">Flotante Partículas Clik</label>
                      <input aria-label="input element"type="text" value={hud.hudEconomic.streamTextOnClick} onChange={(e) => setHud(h => ({ ...h, hudEconomic: { ...h.hudEconomic, streamTextOnClick: e.target.value } }))} className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-white" />
                    </div>
                    <div>
                      <label className="text-zinc-500 text-[10px] uppercase">Bono de Compra Cristales</label>
                      <input aria-label="input element"type="number" value={hud.hudEconomic.buyCrystalsReward} onChange={(e) => setHud(h => ({ ...h, hudEconomic: { ...h.hudEconomic, buyCrystalsReward: parseInt(e.target.value) || 0 } }))} className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: HANGAR LOGISTICS */}
            {activeTab === 'hangar' && (
              <div className="space-y-4 font-sans text-xs">
                {/* Telemetry labels */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-zinc-500 text-[10px] uppercase">G. Power Score Global</label>
                    <input aria-label="input element"type="number" value={hud.hangarLogistics.metricGalacticPowerScore} onChange={(e) => setHud(h => ({ ...h, hangarLogistics: { ...h.hangarLogistics, metricGalacticPowerScore: parseInt(e.target.value) || 0 } }))} className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-white" />
                  </div>
                  <div>
                    <label className="text-zinc-500 text-[10px] uppercase">Precio Lightspeed pack</label>
                    <input aria-label="input element"type="number" value={hud.hangarLogistics.lightspeedPackPriceCrystals} onChange={(e) => setHud(h => ({ ...h, hangarLogistics: { ...h.hangarLogistics, lightspeedPackPriceCrystals: parseInt(e.target.value) || 299 } }))} className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-white" />
                  </div>
                </div>

                {/* Custom list of modular assets in hangar */}
                <div className="p-3 bg-zinc-900/35 border border-zinc-850 rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">ACTIVOS DE HANGAR (GRID 5x4)</h4>
                    <span className="text-[9px] text-zinc-500">Haz clic en la previsualización para auditarlos en detalle</span>
                  </div>
                  <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                    {hud.hangarLogistics.assets.map((asset, index) => (
                      <div key={asset.id} className="p-2.5 bg-zinc-900/60 border border-zinc-800 rounded flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                          <span className="h-5 w-5 bg-zinc-800 rounded-full overflow-hidden shrink-0">
                            <img src={asset.avatarUrl} alt="icon" className="w-full h-full object-cover" />
                          </span>
                          <div>
                            <span className="font-semibold block text-zinc-200">{asset.name}</span>
                            <span className="text-[9px] text-zinc-500 uppercase font-mono">{asset.category} • Nivel {asset.level} • {asset.rarity}</span>
                          </div>
                        </div>

                        {/* Attribute Modifier triggers */}
                        <div className="flex items-center gap-4">
                          <div>
                            <span className="text-[10px] text-zinc-500 font-mono block">HP</span>
                            <input aria-label="input element"type="number" value={asset.hp} onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              setHud(h => ({
                                ...h,
                                hangarLogistics: {
                                  ...h.hangarLogistics,
                                  assets: h.hangarLogistics.assets.map((a, i) => i === index ? { ...a, hp: val } : a)
                                }
                              }));
                            }} className="w-14 bg-zinc-950 text-center border border-zinc-905 rounded" />
                          </div>
                          <div>
                            <span className="text-[10px] text-zinc-500 font-mono block">SHIELD</span>
                            <input aria-label="input element"type="number" value={asset.shield} onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              setHud(h => ({
                                ...h,
                                hangarLogistics: {
                                  ...h.hangarLogistics,
                                  assets: h.hangarLogistics.assets.map((a, i) => i === index ? { ...a, shield: val } : a)
                                }
                              }));
                            }} className="w-14 bg-zinc-950 text-center border border-zinc-905 rounded" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: SIDERAL EXPLORATION */}
            {activeTab === 'sideral' && (
              <div className="space-y-4 font-sans text-xs">
                {/* 1. Propulsion spheres labels */}
                <div className="p-3 bg-zinc-900/35 border border-zinc-850 rounded-lg space-y-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">ESFERAS COLA DE PROPULSIÓN (FILTROS)</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {hud.sideralExploration.propulsionSpheres.map((sphere, idx) => (
                      <input aria-label="input element"key={idx} type="text" value={sphere} onChange={(e) => {
                        const updatedSpheres = [...hud.sideralExploration.propulsionSpheres];
                        updatedSpheres[idx] = e.target.value;
                        setHud(h => ({ ...h, sideralExploration: { ...h.sideralExploration, propulsionSpheres: updatedSpheres } }));
                      }} className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-white font-mono text-[10px]" />
                    ))}
                  </div>
                </div>

                {/* 2. Destination star clusters editor */}
                <div className="p-3 bg-zinc-900/35 border border-zinc-850 rounded-lg space-y-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">ESTACIONES DE DESTINO (STAR_CLUSTERS)</h4>
                  <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                    {hud.sideralExploration.starClusters.map((cluster, index) => (
                      <div key={cluster.id} className="p-2 bg-zinc-900 border border-zinc-800 rounded space-y-1">
                        <span className="text-[10px] font-mono text-red-500 block uppercase font-bold">{cluster.name}</span>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-[9px] text-zinc-500">Duración (segundos)</span>
                            <input aria-label="input element"type="number" value={cluster.durationSeconds} onChange={(e) => {
                              const val = parseInt(e.target.value) || 12;
                              setHud(h => ({
                                ...h,
                                sideralExploration: {
                                  ...h.sideralExploration,
                                  starClusters: h.sideralExploration.starClusters.map((c, i) => i === index ? { ...c, durationSeconds: val } : c)
                                }
                              }));
                            }} className="w-full bg-zinc-950 rounded border border-zinc-850 text-xs px-2 py-1 text-white text-center" />
                          </div>
                          <div>
                            <span className="text-[9px] text-zinc-500">Multiplicador Recompensa</span>
                            <input aria-label="input element"type="number" step={0.1} value={cluster.multiplier} onChange={(e) => {
                              const val = parseFloat(e.target.value) || 1.0;
                              setHud(h => ({
                                ...h,
                                sideralExploration: {
                                  ...h.sideralExploration,
                                  starClusters: h.sideralExploration.starClusters.map((c, i) => i === index ? { ...c, multiplier: val } : c)
                                }
                              }));
                            }} className="w-full bg-zinc-950 rounded border border-zinc-850 text-xs px-2 py-1 text-white text-center" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: NODE SHOP */}
            {activeTab === 'shop' && (
              <div className="space-y-4 font-sans text-xs">
                {/* 1. Category headers */}
                <div className="p-3 bg-zinc-900/35 border border-zinc-850 rounded-lg space-y-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">CATEGORÍAS DE TIENDA</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {hud.acquisitionShop.bundles.map((bundle, index) => (
                      <div key={bundle.id} className="space-y-1.5 p-2 bg-zinc-900 border border-zinc-850 rounded">
                        <label className="text-zinc-500 text-[10px] uppercase font-mono">{bundle.title}</label>
                        <input aria-label="input element"type="text" value={bundle.title} onChange={(e) => {
                          const val = e.target.value;
                          setHud(h => ({
                            ...h,
                            acquisitionShop: {
                              ...h.acquisitionShop,
                              bundles: h.acquisitionShop.bundles.map((b, i) => i === index ? { ...b, title: val } : b)
                            }
                          }));
                        }} className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-white" />
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-[9px] text-zinc-500 font-mono block">VALOR +%</span>
                            <input aria-label="input element"type="number" value={bundle.extraValuePercent} onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              setHud(h => ({
                                ...h,
                                acquisitionShop: {
                                  ...h.acquisitionShop,
                                  bundles: h.acquisitionShop.bundles.map((b, i) => i === index ? { ...b, extraValuePercent: val } : b)
                                }
                              }));
                            }} className="w-full bg-zinc-950 border border-zinc-850 rounded text-center text-xs text-white" />
                          </div>
                          <div>
                            <span className="text-[9px] text-zinc-500 font-mono block">COSTE GD</span>
                            <input aria-label="input element"type="number" value={bundle.priceGdCoins} onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              setHud(h => ({
                                ...h,
                                acquisitionShop: {
                                  ...h.acquisitionShop,
                                  bundles: h.acquisitionShop.bundles.map((b, i) => i === index ? { ...b, priceGdCoins: val } : b)
                                }
                              }));
                            }} className="w-full bg-zinc-950 border border-zinc-850 rounded text-center text-xs text-white" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: PHANTOM STATION */}
            {activeTab === 'phantom' && (
              <div className="space-y-4 font-sans text-xs">
                {/* VIP Markers */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-zinc-500 text-[10px] uppercase">Saldo Phantom Crystals VIP</label>
                    <input aria-label="input element"type="number" value={hud.phantomStation.phantomCrystalsBalance} onChange={(e) => setHud(h => ({ ...h, phantomStation: { ...h.phantomStation, phantomCrystalsBalance: parseInt(e.target.value) || 0 } }))} className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-white focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-zinc-500 text-[10px] uppercase">Coste de Recarga Manual (-Cristal)</label>
                    <input aria-label="input element"type="number" value={hud.phantomStation.refreshCostVoidCrystals} onChange={(e) => setHud(h => ({ ...h, phantomStation: { ...h.phantomStation, refreshCostVoidCrystals: parseInt(e.target.value) || 10 } }))} className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-white" />
                  </div>
                </div>

                {/* Unit catalog banners */}
                <div className="p-3 bg-zinc-900/35 border border-zinc-850 rounded-lg space-y-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">ESQUIRLAS DE UNIDADES (BANNERS SUPERIORES)</h4>
                  <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1">
                    {hud.phantomStation.unitsCatalog.map((unit, index) => (
                      <div key={unit.id} className="p-2.5 bg-zinc-900 border border-zinc-850 rounded space-y-1 text-xs">
                        <div className="flex justify-between items-center bg-zinc-950 p-1 px-2 rounded">
                          <span className="font-bold text-red-500">{unit.name}</span>
                          <span className="text-[10px] text-zinc-500 font-mono">Coste: {unit.voidCrystalCost} Void</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-[10px]">
                          <div>
                            <span className="text-zinc-650 font-mono text-[9px]">RANGO</span>
                            <select aria-label="select element"value={unit.rank} onChange={(e) => {
                              const val = e.target.value as any;
                              setHud(h => ({
                                ...h,
                                phantomStation: {
                                  ...h.phantomStation,
                                  unitsCatalog: h.phantomStation.unitsCatalog.map((u, i) => i === index ? { ...u, rank: val } : u)
                                }
                              }));
                            }} className="w-full bg-zinc-900 text-white border border-zinc-800 rounded">
                              <option value="S">S (Supremo)</option>
                              <option value="A">A (Élite)</option>
                              <option value="C">C (Común)</option>
                              <option value="E">E (Auxiliar)</option>
                            </select>
                          </div>
                          <div>
                            <span className="text-zinc-650 font-mono text-[9px]">PODER ATK</span>
                            <input aria-label="input element"type="number" value={unit.attackPower} onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              setHud(h => ({
                                ...h,
                                phantomStation: {
                                  ...h.phantomStation,
                                  unitsCatalog: h.phantomStation.unitsCatalog.map((u, i) => i === index ? { ...u, attackPower: val } : u)
                                }
                              }));
                            }} className="w-full bg-zinc-900 text-xs text-white border border-zinc-800 rounded text-center font-mono" />
                          </div>
                          <div>
                            <span className="text-zinc-650 font-mono text-[9px]">TIPO ELEMENTO</span>
                            <input aria-label="input element"type="text" value={unit.elementType} onChange={(e) => {
                              const val = e.target.value as any;
                              setHud(h => ({
                                ...h,
                                phantomStation: {
                                  ...h.phantomStation,
                                  unitsCatalog: h.phantomStation.unitsCatalog.map((u, i) => i === index ? { ...u, elementType: val } : u)
                                }
                              }));
                            }} className="w-full bg-zinc-900 text-xs text-white border border-zinc-800 rounded text-center" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 7: ALLIANCE OPERATIVE */}
            {activeTab === 'alliance' && (
              <div className="space-y-4 font-sans text-xs">
                {/* Specs */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-zinc-500 text-[10px] uppercase">Nombre Gremio / Alianza</label>
                    <input aria-label="input element"type="text" value={hud.allianceOperations.allianceName} onChange={(e) => setHud(h => ({ ...h, allianceOperations: { ...h.allianceOperations, allianceName: e.target.value } }))} className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-white" />
                  </div>
                  <div>
                    <label className="text-zinc-500 text-[10px] uppercase">Rango Miembros Límite</label>
                    <input aria-label="input element"type="number" value={hud.allianceOperations.activeMembersLimit} onChange={(e) => setHud(h => ({ ...h, allianceOperations: { ...h.allianceOperations, activeMembersLimit: parseInt(e.target.value) || 50 } }))} className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-white" />
                  </div>
                </div>

                {/* Donation and logs values */}
                <div className="p-3 bg-zinc-900/35 border border-zinc-850 rounded-lg space-y-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">AJUSTES DE DONACIÓN (BOTÓN DONAR)</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[9px] text-zinc-500">Coste de Donación (-Cryst)</span>
                      <input aria-label="input element"type="number" value={hud.allianceOperations.donateCrystalCost} onChange={(e) => setHud(h => ({ ...h, allianceOperations: { ...h.allianceOperations, donateCrystalCost: parseInt(e.target.value) || 50 } }))} className="w-full bg-zinc-950 text-center text-xs text-white rounded border border-zinc-850 py-1" />
                    </div>
                    <div>
                      <span className="text-[9px] text-zinc-500">Bono de Poder (+POW)</span>
                      <input aria-label="input element"type="number" value={hud.allianceOperations.donatePowerBonusScore} onChange={(e) => setHud(h => ({ ...h, allianceOperations: { ...h.allianceOperations, donatePowerBonusScore: parseInt(e.target.value) || 5000 } }))} className="w-full bg-zinc-950 text-center text-xs text-white rounded border border-zinc-850 py-1" />
                    </div>
                    <div>
                      <span className="text-[9px] text-zinc-500">Incremento Barra (+%)</span>
                      <input aria-label="input element"type="number" value={hud.allianceOperations.donateProgressRateIncrement} onChange={(e) => setHud(h => ({ ...h, allianceOperations: { ...h.allianceOperations, donateProgressRateIncrement: parseInt(e.target.value) || 15 } }))} className="w-full bg-zinc-950 text-center text-xs text-white rounded border border-zinc-850 py-1" />
                    </div>
                  </div>
                </div>

                {/* ALLIANCE ROSTER PERMISSION TREE */}
                <div className="p-3 bg-zinc-900/35 border border-zinc-850 rounded-lg space-y-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">ÁRBOL DE PERMISOS DE ROSTER</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {['Comandante', 'Oficial', 'Piloto'].map((role) => (
                      <div key={role} className="space-y-1.5 p-2 bg-zinc-950 border border-zinc-850 rounded">
                        <span className="text-[10px] font-bold text-red-500 uppercase block border-b border-zinc-800 pb-1 mb-1.5">{role}</span>
                        {['canStartBossEvent', 'canSpendVaultFunds', 'canKickMembers', 'canAcceptMembers'].map((permKey) => {
                          const currentVal = hud.allianceOperations.rolePermissions?.[role as 'Comandante']?.[permKey as any] || false;
                          return (
                            <label key={permKey} className="flex items-center gap-2 cursor-pointer group">
                              <div className={`w-3 h-3 rounded flex items-center justify-center border transition-colors ${currentVal ? 'bg-red-500 border-red-500' : 'bg-zinc-900 border-zinc-700 group-hover:border-zinc-500'}`}>
                                {currentVal && <Check size={8} className="text-white" />}
                              </div>
                              <input
                                aria-label="input element"type="checkbox"
                                className="hidden"
                                checked={currentVal}
                                onChange={(e) => {
                                  const baseRoles = hud.allianceOperations.rolePermissions || {
                                    Comandante: { canStartBossEvent: true, canSpendVaultFunds: true, canKickMembers: true, canAcceptMembers: true },
                                    Oficial: { canStartBossEvent: true, canSpendVaultFunds: false, canKickMembers: true, canAcceptMembers: true },
                                    Piloto: { canStartBossEvent: false, canSpendVaultFunds: false, canKickMembers: false, canAcceptMembers: false }
                                  };
                                  setHud(h => ({
                                    ...h,
                                    allianceOperations: {
                                      ...h.allianceOperations,
                                      rolePermissions: {
                                        ...baseRoles,
                                        [role]: {
                                          ...baseRoles[role as 'Comandante'],
                                          [permKey]: e.target.checked
                                        }
                                      }
                                    }
                                  }));
                                }}
                              />
                              <span className="text-[9px] text-zinc-400 group-hover:text-zinc-200 capitalize transition-colors">
                                {permKey.replace(/([A-Z])/g, ' $1').trim()}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>

                {/* INTERNAL CHAT LOGS & MENTION NOTIFIER */}
                <div className="p-3 bg-zinc-900/35 border border-zinc-850 rounded-lg space-y-2">
                  <div className="flex items-center justify-between border-b border-zinc-850 pb-1.5">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">VISOR DE LOGS DE CHAT & MENCIONES</h4>
                    <span className="text-[9px] text-zinc-500 font-mono bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800">
                      Total: {hud.allianceOperations.comMessages?.length || 0}
                    </span>
                  </div>
                  <div className="max-h-32 overflow-y-auto custom-scrollbar space-y-1.5 bg-zinc-950 p-2 rounded border border-zinc-800">
                    {hud.allianceOperations.comMessages?.map((msg, idx) => (
                      <div key={msg.id || idx} className={`flex items-start gap-2 p-1.5 rounded text-[9px] font-mono border-l-2 ${msg.isSuspicious ? 'border-amber-500 bg-amber-500/10' : msg.hasMentionAlert ? 'border-red-500 bg-red-500/5' : 'border-zinc-700 bg-zinc-900/50'}`}>
                        <span className="text-zinc-600 shrink-0">[{msg.timestamp}]</span>
                        <span className={`font-bold shrink-0 ${msg.type === 'system' ? 'text-indigo-400' : msg.type === 'combat' ? 'text-red-400' : 'text-cyan-400'}`}>
                          {msg.sender}:
                        </span>
                        <span className="text-zinc-300 break-words">{msg.text}</span>
                        {(msg.hasMentionAlert || msg.isSuspicious) && (
                          <div className="ml-auto flex gap-1 shrink-0">
                            {msg.hasMentionAlert && <span className="bg-red-500/20 text-red-500 px-1 rounded uppercase tracking-wider text-[8px]">@Mention</span>}
                            {msg.isSuspicious && <span className="bg-amber-500/20 text-amber-500 px-1 rounded uppercase tracking-wider text-[8px]">Flag</span>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end">
                    <button 
                      onClick={() => {
                        const testMsg = { id: `msg_${Date.now()}`, timestamp: new Date().toISOString().split('T')[1].substring(0, 5), sender: 'SystemAlert', text: '@Admin - posible spam en canal', type: 'system' as const, hasMentionAlert: true, isSuspicious: true };
                        setHud(h => ({ ...h, allianceOperations: { ...h.allianceOperations, comMessages: [testMsg, ...(h.allianceOperations.comMessages || [])] } }));
                      }}
                      className="text-[9px] bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-2 rounded transition-colors"
                    >
                      Simular Log Sospechoso
                    </button>
                  </div>
                </div>

                {/* Recharts PieChart: Alliance Role Distribution */}
                {(() => {
                  const roster = hud.allianceOperations?.roster || [];
                  const roleDistribution = roster.reduce((acc, m) => {
                    const roleName = m.role || 'Piloto';
                    acc[roleName] = (acc[roleName] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>);

                  const pieData = Object.entries(roleDistribution).map(([name, value]) => ({
                    name,
                    value
                  }));

                  const ROLE_COLORS: Record<string, string> = {
                    'Comandante': '#EF4444',
                    'Oficial': '#22D3EE',
                    'Piloto': '#64748B'
                  };
                  const FALLBACK = ['#EF4444', '#22D3EE', '#64748B', '#F59E0B', '#8B5CF6'];

                  return (
                    <div className="p-4 bg-zinc-900/35 border border-zinc-855 rounded-lg space-y-3">
                      <div className="flex items-center justify-between border-b border-zinc-850 pb-1.5">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                          <Award size={12} className="text-red-500" /> DISTRIBUCIÓN DE ROLES DE ALIANZA
                        </h4>
                        <span className="text-[9px] font-mono text-zinc-550">Miembros totales: {roster.length}</span>
                      </div>
                      
                      {pieData.length === 0 ? (
                        <p className="text-zinc-500 text-[10px] italic py-3 text-center">No hay miembros cargados en el roster.</p>
                      ) : (
                        <div className="h-44 w-full flex flex-col justify-center items-center">
                          <ResponsiveContainer width="100%" height={110}>
                            <PieChart>
                              <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={28}
                                outerRadius={42}
                                paddingAngle={3}
                                dataKey="value"
                              >
                                {pieData.map((entry, index) => {
                                  const clr = ROLE_COLORS[entry.name] || FALLBACK[index % FALLBACK.length];
                                  return <Cell key={`cell-${index}`} fill={clr} stroke="#09090b" strokeWidth={1} />;
                                })}
                              </Pie>
                              <RechartsTooltip 
                                contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '6px' }}
                                itemStyle={{ color: '#fff', fontSize: '10px' }}
                                labelStyle={{ color: '#888', fontSize: '9px' }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                          
                          {/* Legend inline */}
                          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2.5">
                            {pieData.map((entry, index) => {
                              const clr = ROLE_COLORS[entry.name] || FALLBACK[index % FALLBACK.length];
                              return (
                                <div key={index} className="flex items-center gap-1.5 text-[9.5px]">
                                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: clr }} />
                                  <span className="text-zinc-400 font-medium capitalize">{entry.name}</span>
                                  <span className="text-zinc-650 font-mono">({entry.value})</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

              </div>
            )}

          </div>
          )}

          {/* ======================= HOLOGRAPHIC PREVIEW INTERACTIVE SYSTEM ======================= */}
          {activeTab !== 'sanitizer' && (
            <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 flex flex-col space-y-4">
            
            <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 flex items-center gap-1.5 uppercase tracking-widest font-bold">
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping shrink-0" /> LIENZO SIMULATION GALAXYDUST HUD
                </span>
                <p className="text-[11px] text-zinc-550 mt-0.5">Demostración en tiempo real de los campos configurados</p>
              </div>
              <span className="text-[10px] font-mono bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-zinc-500 uppercase">
                {activeTab}
              </span>
            </div>

            {/* HOLOGRAPHIC CONTAINER PORT WITH SIMULATED VIRTUAL LAYOUT */}
            <div className="flex-1 bg-black rounded-lg border border-zinc-900/40 p-4 relative min-h-[430px] flex flex-col justify-between overflow-hidden bg-[radial-gradient(#15151b_1px,transparent_1px)] [background-size:16px_16px]">
              
              {/* Floating notification toaster helper inside simulation */}
              <AnimatePresence>
                {simAuthToast.show && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="absolute top-2 left-2 right-2 z-30 p-2 border rounded-md text-[11px] leading-snug flex items-center justify-between gap-2 shadow-2xl backdrop-blur-md"
                    style={{
                      backgroundColor: simAuthToast.mode === 'alert' ? '#450a0a' : simAuthToast.mode === 'correct' ? '#064e3b' : '#083344',
                      borderColor: simAuthToast.mode === 'alert' ? '#ef4444' : simAuthToast.mode === 'correct' ? '#10b981' : '#06b6d4',
                      color: simAuthToast.mode === 'alert' ? '#fca5a5' : simAuthToast.mode === 'correct' ? '#a7f3d0' : '#c5f2fc'
                    }}
                  >
                    <span className="font-mono font-bold tracking-wider">{simAuthToast.text}</span>
                    <button onClick={() => setSimAuthToast(t => ({ ...t, show: false }))} className="text-[9px] bg-black/40 rounded px-1.5 hover:text-white">OK</button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* SIM 1: TERMINAL DE AUTENTICACIÓN */}
              {activeTab === 'auth' && (
                <div className="flex-1 flex flex-col justify-between space-y-4 select-none">
                  
                  {/* Dynamic Header */}
                  <div className="text-center p-2 bg-zinc-950 border border-zinc-900 rounded-lg">
                    <span className="text-[8px] font-mono text-red-500 block animate-pulse">▲ KERNEL ACTIVE SESSION SECURE</span>
                    <h4 className="text-white text-xs font-bold font-display uppercase tracking-wide mt-1">
                      {simFaseAuth === 'portal' && hud.authTerminal.headers.portal}
                      {simFaseAuth === 'login' && hud.authTerminal.headers.login}
                      {simFaseAuth === 'register' && hud.authTerminal.headers.register}
                      {simFaseAuth === 'recovery' && hud.authTerminal.headers.recovery}
                      {simFaseAuth === 'confirm' && hud.authTerminal.headers.confirmEmail}
                      {simFaseAuth === 'mfa' && hud.authTerminal.headers.mfaFactor}
                      {simFaseAuth === 'reject' && hud.authTerminal.headers.rejectSign}
                      {simFaseAuth === 'auth_ok' && hud.authTerminal.headers.authorized}
                    </h4>
                  </div>

                  {/* Interactive form body switcher */}
                  <div className="flex-1 bg-zinc-950/60 p-4 border border-zinc-900 rounded-lg flex flex-col justify-center space-y-2.5">
                    {simFaseAuth === 'portal' && (
                      <div className="text-center space-y-3">
                        <p className="text-[11px] text-zinc-500">Conecta el portal para reclamar firma o accede con claves:</p>
                        <button onClick={() => {
                          setLoadingAction(true);
                          setTimeout(() => { setLoadingAction(false); setSimFaseAuth('login'); }, 600);
                        }} className="w-full bg-red-650 hover:bg-red-600 text-[11.5px] font-bold text-white py-2 rounded-md uppercase tracking-wide">
                          {loadingAction ? 'Cargando...' : 'Acceder con Clave'}
                        </button>
                        <div className="flex gap-1.5 justify-center py-1">
                          {hud.authTerminal.socialProviders.googleEnabled && <span className="p-1.5 bg-zinc-900 border border-zinc-800 rounded font-bold text-[9px] text-zinc-400 hover:text-white cursor-pointer">Google</span>}
                          {hud.authTerminal.socialProviders.githubEnabled && <span className="p-1.5 bg-zinc-900 border border-zinc-800 rounded font-bold text-[9px] text-zinc-400 hover:text-white cursor-pointer">GitHub</span>}
                        </div>
                      </div>
                    )}

                    {simFaseAuth === 'login' && (
                      <div className="space-y-2">
                        {/* Dynamic Email Placeholder */}
                        <input aria-label="input element"type="email" placeholder={hud.authTerminal.inputs.emailPlaceholder} value={simAuthEmail} onChange={(e) => setSimAuthEmail(e.target.value)} className="w-full px-2.5 py-1.5 text-[11px] bg-zinc-900 border border-zinc-800 rounded text-white" />
                        
                        {/* Dynamic Password Field and vis Eye Toggle */}
                        <div className="relative">
                          <input aria-label="input element"type={showPassword ? 'text' : 'password'} placeholder={hud.authTerminal.inputs.passwordPlaceholder} value={simAuthPassword} onChange={(e) => setSimAuthPassword(e.target.value)} className="w-full px-2.5 py-1.5 text-[11px] bg-zinc-900 border border-zinc-800 rounded text-white font-mono" />
                          <button onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-2 text-zinc-650 hover:text-zinc-300">
                            {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                          </button>
                        </div>

                        {/* Password strength dynamic bars */}
                        <div className="pt-1.5 space-y-1">
                          <div className="flex justify-between items-center text-[9px]">
                            <span className="text-zinc-550">Fuerza Encriptación:</span>
                            <span className="font-bold text-red-500 uppercase">{passwordEval.levelText}</span>
                          </div>
                          <div className="flex gap-1 h-1">
                            {Array.from({ length: 4 }).map((_, bi) => (
                              <div key={bi} className={`flex-1 h-full rounded-full transition-colors ${passwordEval.score > bi ? 'bg-red-550' : 'bg-zinc-900'}`} />
                            ))}
                          </div>
                        </div>

                        {/* Remember Me Checkbox Default state */}
                        <label className="flex items-center gap-2 pt-1 text-[10px] text-zinc-500 cursor-pointer">
                          <input aria-label="input element"type="checkbox" checked={rememberMeSim} onChange={(e) => setRememberMeSim(e.target.checked)} />
                          <span>Recordar credenciales</span>
                        </label>

                        {/* Main Cta Button */}
                        <button onClick={() => {
                          if (!simAuthEmail || !simAuthPassword) {
                            setSimAuthToast({ show: true, text: hud.authTerminal.toasts.alert, mode: 'alert' });
                            return;
                          }
                          setLoadingAction(true);
                          setTimeout(() => {
                            setLoadingAction(false);
                            setSimFaseAuth('mfa');
                          }, 800);
                        }} className="w-full bg-red-650 hover:bg-red-600 font-bold tracking-wide text-[10px] text-white py-1.5 rounded uppercase font-mono">
                          {loadingAction ? 'PROCESANDO FIRMA...' : hud.authTerminal.buttons.loginCta}
                        </button>
                      </div>
                    )}

                    {simFaseAuth === 'mfa' && (
                      <div className="space-y-3">
                        <p className="text-[10.5px] text-zinc-400 text-center">Ingresa el token de seguridad MFA descentralizado:</p>
                        <input aria-label="input element"type="text" maxLength={hud.authTerminal.inputs.otpDigits} placeholder="OTP de 6 dígitos" value={mfaCode} onChange={(e) => setMfaCode(e.target.value)} className="w-full bg-zinc-900 text-center font-mono py-2 border border-zinc-800 text-white rounded text-sm select-all" />
                        
                        <button onClick={() => {
                          if (mfaCode.length !== hud.authTerminal.inputs.otpDigits) {
                            setSimFaseAuth('reject');
                            setSimAuthToast({ show: true, text: 'FIRMA RECHAZADA - TOKEN MFA INVÁLIDO', mode: 'alert' });
                            return;
                          }
                          setLoadingAction(true);
                          setTimeout(() => {
                            setLoadingAction(false);
                            setSimFaseAuth('auth_ok');
                            setSimAuthToast({ show: true, text: hud.authTerminal.toasts.authCorrect, mode: 'correct' });
                          }, 900);
                        }} className="w-full bg-red-650 hover:bg-red-600 text-white text-[11px] font-bold py-1.5 rounded uppercase">
                          {loadingAction ? 'Verificando...' : hud.authTerminal.buttons.mfaCta}
                        </button>
                      </div>
                    )}

                    {simFaseAuth === 'reject' && (
                      <div className="text-center space-y-3 p-2">
                        <div className="p-2 border border-red-500/20 bg-red-550/5 text-red-500 rounded text-[10.5px] leading-relaxed">
                          La firma digital hash no coincide con la llave del sistema. Conexión cancelada temporalmente.
                        </div>
                        <button onClick={() => setSimFaseAuth('login')} className="px-3 py-1 bg-zinc-900 hover:bg-zinc-800 text-[10px] text-zinc-350 border border-zinc-800 rounded">
                          Reintentar Login
                        </button>
                      </div>
                    )}

                    {simFaseAuth === 'auth_ok' && (
                      <div className="space-y-3 pt-1">
                        {/* Dynamic Passport holograph Web3 card layout */}
                        <div className="p-3 bg-zinc-950/90 border border-red-500/20 hover:border-red-500/45 rounded-xl text-[10.5px] space-y-1.5 bg-cover relative overflow-hidden ring-1 ring-red-500/10">
                          <div className="flex justify-between items-center text-[9px] font-mono text-zinc-550 border-b border-zinc-900 pb-1">
                            <span>WEB3 HOLOGRAM PASSPORT</span>
                            <span className="text-emerald-500 font-bold">MFA {hud.authTerminal.passportWeb3.mfaEnabled ? 'ACTIVADA' : 'INACTIVA'}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="h-7 w-7 bg-zinc-800 rounded-full overflow-hidden shrink-0">
                              <img src={hud.authTerminal.passportWeb3.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                            </span>
                            <div>
                              <span className="font-extrabold text-white block">{hud.authTerminal.passportWeb3.username}</span>
                              <span className="text-[9px] text-zinc-500">{hud.authTerminal.passportWeb3.email}</span>
                            </div>
                          </div>

                          <div className="pt-2 grid grid-cols-2 gap-2 text-[9px] font-mono text-zinc-450">
                            <div>
                              <span className="text-zinc-650 block">PROVEEDOR:</span>
                              <span className="uppercase">{hud.authTerminal.passportWeb3.provider}</span>
                            </div>
                            <div>
                              <span className="text-zinc-650 block">TOKEN ASIGNADO:</span>
                              <span className="text-[8.5px] text-red-400 block truncate">{hud.authTerminal.passportWeb3.assignedToken}</span>
                            </div>
                          </div>
                        </div>

                        <button onClick={() => setSimFaseAuth('login')} className="w-full py-1 text-center font-mono text-zinc-650 hover:text-zinc-400 text-[9px] uppercase hover:underline">
                          {hud.authTerminal.links.disconnectLabel}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Flow Redirect Links */}
                  {simFaseAuth === 'login' && (
                    <div className="flex justify-between items-center text-[10px] text-zinc-500 font-medium px-1">
                      <button onClick={() => setSimFaseAuth('recovery')} className="hover:text-red-500">{hud.authTerminal.links.forgotPasswordLabel}</button>
                      <span>•</span>
                      <button onClick={() => setSimFaseAuth('portal')} className="hover:text-red-500">Volver</button>
                    </div>
                  )}

                  {simFaseAuth === 'recovery' && (
                    <div className="space-y-2 p-1">
                      <input aria-label="input element"type="email" placeholder={hud.authTerminal.inputs.resetEmailPlaceholder} className="w-full px-2 py-1.5 text-[11px] bg-zinc-900 border border-zinc-800 rounded text-white" />
                      <button onClick={() => { setSimFaseAuth('login'); setSimAuthToast({ show: true, text: 'ENLACE ENVIADO A LA BANDEJA', mode: 'established' }); }} className="w-full bg-red-650 text-white font-bold py-1 text-[10.5px] rounded">{hud.authTerminal.buttons.requestCta}</button>
                    </div>
                  )}

                </div>
              )}

              {/* SIM 2: HUD ECONÓMICO MAESTRO */}
              {activeTab === 'economic' && (
                <div className="flex-1 flex flex-col justify-between space-y-4 text-xs select-none">
                  
                  {/* Pilot Card top HUD left */}
                  <div className="flex justify-between items-center gap-2 border-b border-zinc-900 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="relative inline-block h-8 w-8 rounded-full border border-red-500/40 p-0.5 overflow-hidden shrink-0 animate-pulse">
                        <img src={hud.hudEconomic.pilot.avatarUrl} alt="avatar" className="w-full h-full object-cover rounded-full" />
                      </span>
                      <div>
                        <span className="text-[10px] text-zinc-550 block font-mono">PILOTO DE COMBATE</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-white">Nivel {hud.hudEconomic.pilot.level}</span>
                          <span className="text-[8px] bg-red-650/20 text-red-500 font-bold border border-red-500/25 px-1 rounded font-mono uppercase">{hud.hudEconomic.pilot.rankLabel}</span>
                        </div>
                      </div>
                    </div>

                    {/* Active Buffs (3 buttons toggles visual) */}
                    <div className="flex gap-1 bg-zinc-950 p-1 border border-zinc-900 rounded-md">
                      <span className={`p-1 rounded text-[9px] ${hud.hudEconomic.buffs.attackActive ? 'bg-red-650/15 text-red-500 font-bold border border-red-500/20' : 'text-zinc-650'}`} title="Buff de Ataque">⚔ ATAQUE</span>
                      <span className={`p-1 rounded text-[9px] ${hud.hudEconomic.buffs.defenseActive ? 'bg-emerald-650/15 text-emerald-500 font-bold border border-emerald-500/20' : 'text-zinc-650'}`} title="Buff de Defensa">🛡 DEFENSA</span>
                      <span className={`p-1 rounded text-[9px] ${hud.hudEconomic.buffs.speedActive ? 'bg-cyan-650/15 text-cyan-400 font-bold border border-cyan-500/20' : 'text-zinc-650'}`} title="Buff de Velocidad">⚡ COLA</span>
                    </div>
                  </div>

                  {/* Combat Stats banner & Power score trigger clicks */}
                  <div className="p-4 bg-gradient-to-r from-zinc-950 to-zinc-900 border border-zinc-850 rounded-xl space-y-3 relative overflow-hidden">
                    <div className="absolute top-1 right-2 text-[8px] font-mono text-zinc-600 uppercase">Interactive simulation</div>
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-[10px] text-zinc-500 font-mono block">SCORE POWER TÁCTICO (SURGE CLICK!)</span>
                        <span onClick={() => { setSimPowerScore(prev => prev + Math.floor(Math.random() * 80 + 30)); triggerParticles('+42 POW SCORE'); }} className="text-xl font-bold tracking-tight text-white cursor-pointer hover:text-red-500 transition-colors font-mono">
                          {simPowerScore} <span className="text-xs text-red-500 animate-pulse">▲ SFX SURGE</span>
                        </span>
                      </div>
                      
                      {/* Crystal mass buy button to add resources simulation */}
                      <button onClick={() => { triggerParticles(`+${hud.hudEconomic.buyCrystalsReward} CRISTALES`); }} className="bg-red-650 hover:bg-red-600 text-[10px] font-mono font-bold text-white px-2 py-1 rounded">
                        COMPRAR CRYSTALS
                      </button>
                    </div>

                    {/* AP points meter bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-zinc-500 font-mono uppercase">PUNTOS DE ENERGÍA COMBATE (AP):</span>
                        <span onClick={() => { setSimAp(p => Math.min(hud.hudEconomic.combat.apMax, p + 25)); triggerParticles('+25 AP RECARGADO'); }} className="text-white font-bold cursor-pointer hover:underline">{simAp} / {hud.hudEconomic.combat.apMax} AP</span>
                      </div>
                      <div className="w-full bg-zinc-950 h-2 border border-zinc-905 rounded-full overflow-hidden">
                        <div className="h-full bg-red-550 transition-all duration-300" style={{ width: `${(simAp / hud.hudEconomic.combat.apMax) * 100}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Horizontal ribbon list of 6 Master currencies */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-zinc-600 uppercase block pl-1">MONEDAS DEL REINO GENERAL (SCROLL DE CINTA):</span>
                    <div className="flex gap-2.5 overflow-x-auto pb-1.5 custom-scrollbar bg-zinc-950 p-2 border border-zinc-900 rounded-md">
                      <div className="shrink-0 text-[10.5px] font-mono bg-zinc-90 w-24">💰 GD: <strong className="text-white font-mono">{hud.hudEconomic.currencies.gdCoin}</strong></div>
                      <div className="shrink-0 text-[10.5px] font-mono bg-zinc-90 w-24">🧪 QUANT: <strong className="text-white font-mono">{hud.hudEconomic.currencies.quantumCredit}</strong></div>
                      <div className="shrink-0 text-[10.5px] font-mono bg-zinc-90 w-24">🌌 PHANT: <strong className="text-white font-mono">{hud.hudEconomic.currencies.phantomCoin}</strong></div>
                      <div className="shrink-0 text-[10.5px] font-mono bg-zinc-90 w-24">🎃 HALW: <strong className="text-white font-mono">{hud.hudEconomic.currencies.halloweenCoin}</strong></div>
                      <div className="shrink-0 text-[10.5px] font-mono bg-zinc-90 w-24">🎄 XMAS: <strong className="text-white font-mono">{hud.hudEconomic.currencies.xmasCoin}</strong></div>
                      <div className="shrink-0 text-[10.5px] font-mono bg-zinc-90 w-24">💝 VALT: <strong className="text-white font-mono">{hud.hudEconomic.currencies.valentineCoin}</strong></div>
                    </div>
                  </div>

                  {/* Vault triggers click to open 12 advanced materials matrix */}
                  <div>
                    <button onClick={() => setSimVaultOpen(!simVaultOpen)} className="w-full py-1 bg-zinc-900 border border-zinc-800 rounded text-[10px] font-mono text-zinc-400 hover:text-white uppercase flex justify-between items-center px-4">
                      <span>{simVaultOpen ? 'Cerrar' : 'Abrir'} CAJA VAULT DE RECURSOS (12 RECURSOS AVANZADOS)</span>
                      <span>{simVaultOpen ? '▲' : '▼'}</span>
                    </button>

                    <AnimatePresence>
                      {simVaultOpen && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="grid grid-cols-3 gap-1.5 p-2 bg-zinc-950 border border-zinc-900 rounded-b mt-1 text-[9.5px] max-h-[140px] overflow-y-auto">
                          {Object.keys(hud.hudEconomic.vaultResources).map((material) => (
                            <div key={material} onClick={() => triggerParticles(`${hud.hudEconomic.streamTextOnClick} de ${material.toUpperCase()}`)} className="p-1 px-2 border border-zinc-850 rounded hover:border-zinc-700 bg-zinc-900/40 flex justify-between cursor-pointer font-mono">
                              <span className="text-zinc-500 uppercase">{material.slice(0, 6)}</span>
                              <span className="text-white font-bold">{(hud.hudEconomic.vaultResources as any)[material]}</span>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Floaters absolute stream log layer */}
                  <div className="relative">
                    <AnimatePresence>
                      {activeParticles.map(p => (
                        <motion.span
                          key={p.id}
                          initial={{ opacity: 1, y: 0, scale: 0.8 }}
                          animate={{ opacity: 0, y: -45, scale: 1.2 }}
                          exit={{ opacity: 0 }}
                          className="absolute text-red-500 font-mono text-xs font-bold"
                          style={{ left: `${p.x}%`, top: `-60px` }}
                        >
                          {p.text}
                        </motion.span>
                      ))}
                    </AnimatePresence>
                  </div>

                </div>
              )}

              {/* SIM 3: HANGAR Y LOGÍSTICA */}
              {activeTab === 'hangar' && (
                <div className="flex-1 flex flex-col justify-between space-y-3 text-xs select-none">
                  
                  {/* Filter header */}
                  <div className="flex gap-2 items-center bg-zinc-950 p-2 border border-zinc-900 rounded">
                    <div className="flex bg-zinc-900 border border-zinc-850 p-0.5 rounded text-[9.5px] flex-1">
                      <select aria-label="select element"value={hangarCorpFilter} onChange={(e) => setHangarCorpFilter(e.target.value)} className="w-full bg-transparent border-none text-zinc-300 focus:outline-none">
                        <option value="ALL">Todo Corporación (LOGIC CORP)</option>
                        <option value="NOVA">Corporativo: NOVA</option>
                        <option value="OSIRIS">Corporativo: OSIRIS</option>
                        <option value="GD I">Corporativo: GD I</option>
                      </select>
                    </div>
                  </div>

                  {/* Grid of assets simulation */}
                  <div className="flex-1 overflow-y-auto max-h-[200px] bg-zinc-950/40 p-2.5 border border-zinc-900 rounded space-y-2">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {hud.hangarLogistics.assets
                        .filter(a => hangarCorpFilter === 'ALL' || a.faction === hangarCorpFilter)
                        .map(asset => (
                          <div 
                            key={asset.id} 
                            onClick={() => setSelectedAsset(asset)}
                            className="p-2 border border-zinc-850 hover:border-red-500 bg-zinc-950 rounded cursor-pointer transition-colors relative"
                          >
                            {asset.hasNotification && <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />}
                            <div className="h-10 bg-zinc-900 rounded-md overflow-hidden bg-cover bg-center mb-1">
                              <img src={asset.avatarUrl} alt="asset" className="w-full h-full object-cover" />
                            </div>
                            <span className="text-[10px] font-bold block truncate text-zinc-200">{asset.name}</span>
                            <div className="flex justify-between items-center text-[8.5px] text-zinc-650 font-mono mt-0.5">
                              <span>LVL {asset.level}</span>
                              <span className="text-yellow-500 font-bold">★ {asset.stars}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Footer telemetry */}
                  <div className="p-2 bg-zinc-950 flex justify-between items-center text-[10px] font-mono text-zinc-500 border border-zinc-900 rounded-md">
                    <span>COMPAÑEROS: {hud.hangarLogistics.metricCompanionsTotal} / 50</span>
                    <span>T-POW COMBATE MÁX: {hud.hangarLogistics.metricGalacticPowerScore}</span>
                  </div>

                  {/* Detail expandable Modal simulation */}
                  <AnimatePresence>
                    {selectedAsset && (
                      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="absolute inset-2 bg-zinc-950 border border-zinc-800 rounded-xl p-3 z-30 flex flex-col justify-between text-xs space-y-1">
                        <div className="flex justify-between items-center border-b border-zinc-900 pb-1">
                          <span className="font-extrabold text-[12px] text-red-500 uppercase flex items-center gap-1">⌺ EXPEDIENTE: {selectedAsset.name}</span>
                          <button onClick={() => setSelectedAsset(null)} className="text-zinc-500 hover:text-white font-mono text-xs cursor-pointer bg-zinc-90 w-5 text-center">X</button>
                        </div>

                        <p className="text-[10px] text-zinc-500 leading-normal italic">{selectedAsset.lore}</p>

                        {/* Combat stats editor output */}
                        <div className="grid grid-cols-2 gap-2 p-2 bg-black/60 border border-zinc-900 rounded font-mono text-[9px] text-zinc-400">
                          <div>🛡 HP INTEGRIDAD: <strong className="text-white">{selectedAsset.hp}</strong></div>
                          <div>⚔ ABSORBER DEFENSA: <strong className="text-white">{selectedAsset.absorption}%</strong></div>
                          <div>⚡ VELOCIDAD IMPULSO: <strong className="text-white">{selectedAsset.vel}</strong></div>
                          <div>☣ DAÑO TIPO: <strong className="text-white">{selectedAsset.damageType}</strong></div>
                        </div>

                        <div className="flex gap-2">
                          <button onClick={() => {
                            setHud(h => ({
                              ...h,
                              hangarLogistics: {
                                ...h.hangarLogistics,
                                assets: h.hangarLogistics.assets.map(a => a.id === selectedAsset.id ? { ...a, stars: Math.min(7, a.stars + 1) } : a)
                              }
                            }));
                            setSelectedAsset(curr => curr ? { ...curr, stars: Math.min(7, curr.stars + 1) } : null);
                            triggerParticles('+1 Estrella Rango!');
                          }} className="flex-1 py-1 text-center bg-zinc-900 hover:bg-zinc-805 rounded text-[10px] border border-zinc-800 text-yellow-500 font-bold">
                            ASCENDER RANGO estrella
                          </button>
                          <button onClick={() => {
                            setHud(h => ({
                              ...h,
                              hangarLogistics: {
                                ...h.hangarLogistics,
                                assets: h.hangarLogistics.assets.map(a => a.id === selectedAsset.id ? { ...a, level: a.level + 1 } : a)
                              }
                            }));
                            setSelectedAsset(curr => curr ? { ...curr, level: curr.level + 1 } : null);
                            triggerParticles('+1 Nivel Núcleo!');
                          }} className="flex-1 py-1 text-center bg-red-650 hover:bg-red-600 text-white rounded text-[10px] uppercase font-bold">
                            Optimizar Core (-Gold)
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </div>
              )}

              {/* SIM 4: EXPLORACIÓN SIDERAL */}
              {activeTab === 'sideral' && (
                <div className="flex-1 flex flex-col justify-between space-y-4 text-xs select-none">
                  
                  {/* Propulsion Selector base filter (6 spheres visually) */}
                  <div className="flex justify-between items-center gap-1 p-1 bg-zinc-950 border border-zinc-900 rounded-md">
                    {hud.sideralExploration.propulsionSpheres.slice(0, 4).map((prop, pi) => (
                      <span key={pi} className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded font-bold text-[8px] uppercase tracking-wide text-zinc-400">
                        ⚛ {prop.slice(0, 10)}
                      </span>
                    ))}
                  </div>

                  {/* Live circular transit map simulation */}
                  <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-md grid grid-cols-2 gap-4 items-center relative">
                    <div className="flex flex-col items-center justify-center">
                      <div className="relative h-20 w-20 flex items-center justify-center">
                        <svg className="absolute w-full h-full transform -rotate-90">
                          <circle cx="40" cy="40" r="34" stroke="#18181b" strokeWidth="4" fill="transparent" />
                          <circle cx="40" cy="40" r="34" stroke="#ef4444" strokeWidth="4" fill="transparent" strokeDasharray="213" strokeDashoffset={213 - (213 * explorationProgress) / 100} className="transition-all duration-1000" />
                        </svg>
                        <div className="text-center font-mono z-10">
                          <span className="text-[12px] font-bold block text-white">{explorationProgress}%</span>
                          <span className="text-[7.5px] text-zinc-550 uppercase">TRANSIT EXP</span>
                        </div>
                      </div>
                      
                      {isTransitActive && (
                        <span className="text-[9px] text-red-500 font-mono mt-1.5 animate-pulse">EXTRACORES ACTIVOS...</span>
                      )}
                    </div>

                    {/* Telemetry log list sideral */}
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono text-zinc-650 block border-b border-zinc-900 pb-0.5">TELEMETRÍA EXPLORACIÓN</span>
                      <div className="text-[9.5px] font-mono text-zinc-400 max-h-[85px] overflow-y-auto space-y-1">
                        {simHistory.map((h, hi) => (
                          <div key={hi} className="truncate select-none">► {h}</div>
                        ))}
                        <div className="text-[9.5px] text-zinc-650">✓ Planetas listos: {hud.sideralExploration.completedPlanets.length}</div>
                      </div>
                    </div>
                  </div>

                  {/* Trigger launch trip buttons */}
                  <div className="flex gap-2.5">
                    <select aria-label="select element"value={selectedClusterId} onChange={(e) => setSelectedClusterId(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded px-2 text-[10px] text-white">
                      {hud.sideralExploration.starClusters.map(cl => (
                        <option key={cl.id} value={cl.id}>{cl.name} ({cl.durationSeconds}s)</option>
                      ))}
                    </select>

                    <button 
                      disabled={isTransitActive}
                      onClick={() => {
                        setIsTransitActive(true);
                        const cl = hud.sideralExploration.starClusters.find(c => c.id === selectedClusterId);
                        const sec = cl?.durationSeconds || 15;
                        setTransitTimeRemaining(sec);
                        setExplorationProgress(0);
                        setSimHistory(h => [`Llegada programada en ${sec} segundos...`, ...h]);
                        triggerParticles('Viaje Sideral Iniciado!');
                      }} 
                      className="flex-1 py-1.5 bg-red-650 hover:bg-red-600 text-white font-bold rounded text-[10px] uppercase font-mono disabled:opacity-50"
                    >
                      Desplegar Viaje Sectorial 🚀
                    </button>
                  </div>

                </div>
              )}

              {/* SIM 5: ADQUISICIÓN TIENDA */}
              {activeTab === 'shop' && (
                <div className="flex-1 flex flex-col justify-between space-y-3 text-xs select-none">
                  
                  {/* Category sidebar simulated */}
                  <div className="flex gap-1 overflow-x-auto pb-1.5 border-b border-zinc-900">
                    {hud.acquisitionShop.categories.slice(0, 3).map((catName) => (
                      <button key={catName} onClick={() => setActiveCategory(catName)} className={`px-2.5 py-1 rounded text-[9px] font-mono shrink-0 ${activeCategory === catName ? 'bg-red-650/15 border border-red-500/20 text-red-500' : 'text-zinc-600 hover:text-zinc-400'}`}>
                        {catName}
                      </button>
                    ))}
                  </div>

                  {/* Horizontal scrolling load bundles cards */}
                  <div className="flex-1 flex gap-3 overflow-x-auto py-2 items-center justify-around custom-scrollbar">
                    {hud.acquisitionShop.bundles.map((bundle) => (
                      <div key={bundle.id} className={`w-44 border p-3 rounded-lg bg-zinc-950/80 space-y-2 shrink-0 ${bundle.rarityColorClass}`}>
                        <div className="flex justify-between items-center text-[9px] font-mono">
                          <span className="text-red-500 font-extrabold">+{bundle.extraValuePercent}% VALOR</span>
                          <span className="text-zinc-550">CUPO: {bundle.stockRemaining}</span>
                        </div>
                        <h5 className="text-[11px] font-bold text-white block truncate">{bundle.title}</h5>
                        
                        {/* Beige breakdown inner box list items */}
                        <div className="p-2 bg-[#1c1c16]/30 border border-[#fef08a]/5 text-[#fef08a] rounded space-y-1 text-[9px] font-mono leading-none">
                          {bundle.subItems.slice(0, 2).map((item, ii) => (
                            <div key={ii} className="flex justify-between">
                              <span>{item.name}</span>
                              <span className="font-bold">x{item.quantity}</span>
                            </div>
                          ))}
                        </div>

                        {/* CTA simulate buying trigger delay network */}
                        <button onClick={() => {
                          setDelayCargaCompra(true);
                          setTimeout(() => {
                            setDelayCargaCompra(false);
                            setCompraSuccessModal(bundle);
                          }, 900);
                        }} className="w-full py-1 text-center bg-red-650 hover:bg-red-700 font-bold text-white font-mono text-[9.5px] rounded uppercase">
                          {delayCargaCompra ? 'COMPRANDO...' : `Coste: ${bundle.priceGdCoins} GD`}
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Flash Success dialog */}
                  <AnimatePresence>
                    {compraSuccessModal && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/90 backdrop-blur-sm z-40 flex flex-col justify-center items-center p-4">
                        <div className="text-center p-5 bg-zinc-950 border border-zinc-800 rounded-xl max-w-sm space-y-4">
                          <span className="text-4xl block animate-bounce">🎁</span>
                          <h4 className="text-sm font-extrabold text-emerald-400 font-mono tracking-wide">¡SUMINISTROS ENTREGADOS!</h4>
                          <p className="text-xs text-zinc-400 leading-normal">Los sub-items de <strong>{compraSuccessModal.title}</strong> han sido inyectados de forma satisfactoria a tu hangar militar.</p>
                          <button onClick={() => setCompraSuccessModal(null)} className="py-1 px-4 bg-red-650 hover:bg-red-600 rounded text-xs text-white uppercase font-bold tracking-wide">
                            CONFIRMAR RECOLECCIÓN
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </div>
              )}

              {/* SIM 6: ESTACIÓN PHANTOM CUÁNTICA */}
              {activeTab === 'phantom' && (
                <div className="flex-1 flex flex-col justify-between space-y-3 text-xs select-none">
                  
                  {/* VIP Monetary markers purple */}
                  <div className="p-3.5 bg-[#4c1d95]/20 border border-[#c084fc]/15 rounded-lg flex justify-between items-center bg-[linear-gradient(45deg,#2e1065_25%,transparent_25%)] [background-size:24px_24px]">
                    <div>
                      <span className="text-[9px] font-mono text-[#e9d5ff] block">PHANTOM VOID CRYSTALS BALANCE VIP:</span>
                      <strong className="text-base text-[#e879f9] font-mono">{hud.phantomStation.phantomCrystalsBalance} PC</strong>
                    </div>
                    <span className="p-1 px-2 rounded-full text-[8.5px] bg-[#a855f7]/30 text-[#e9d5ff] font-bold border border-[#a855f7]/40">VIP PREMIUM ACCES</span>
                  </div>

                  {/* Active Unit list row ribbons with ELEMENT icons */}
                  <div className="grid grid-cols-4 gap-2 py-1">
                    {hud.phantomStation.unitsCatalog.slice(0, 4).map((unit) => (
                      <div 
                        key={unit.id} 
                        onMouseEnter={() => setLastHoloDescription(`${unit.name} (Rango ${unit.rank} • Elemento ${unit.elementType}): Daño combat escarlata de ${unit.attackPower} ATK.`)}
                        className="p-1 border border-zinc-900 bg-zinc-950 rounded text-center cursor-help relative group"
                      >
                        <div className="h-8 bg-zinc-900 rounded-sm overflow-hidden mb-1 relative">
                          <img src={unit.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-[8.5px] font-bold block text-white truncate leading-none">{unit.name}</span>
                        <div className="flex justify-between text-[7.5px] text-zinc-650 mt-0.5 leading-none px-0.5 font-mono">
                          <span>{unit.elementType}</span>
                          <span className="text-[#a855f7]">({unit.rank})</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Console telemetry and Analyzer holographic description */}
                  <div className="p-2.5 bg-zinc-950 border border-zinc-900 rounded font-mono text-[9px] space-y-1.5 leading-snug">
                    <span className="text-zinc-700 block text-[8px]">ANALIZADOR HOLOGRÁFICO ACTIVO:</span>
                    <p className="text-cyan-400 font-mono italic select-all select-none leading-normal">
                      &gt; {lastHoloDescription}
                    </p>
                  </div>

                  <div className="flex justify-between items-center text-[9px] font-mono text-zinc-550">
                    <span>CUENTA REFRESCOS: {attemptsLeft} / {hud.phantomStation.refreshAttemptsMax}</span>
                    <span>AUTO-REFRESCO: {refreshCountdown} s</span>
                  </div>

                </div>
              )}

              {/* SIM 7: CENTRAL DE ALIANZA */}
              {activeTab === 'alliance' && (
                <div className="flex-1 flex flex-col justify-between space-y-3.5 text-xs select-none">
                  
                  {/* Guild Header Embleme details */}
                  <div className="flex justify-between items-center gap-2 border-b border-zinc-900 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="h-7 w-7 bg-zinc-900 border border-indigo-500 rounded-md flex items-center justify-center font-extrabold text-[12px] text-indigo-400 shrink-0">
                        🛡
                      </span>
                      <div>
                        <span className="text-[10px] font-bold block text-white uppercase tracking-wide leading-none">{hud.allianceOperations.allianceName}</span>
                        <span className="text-[8px] text-zinc-550 font-mono mt-0.5 block">NÚCLEO NIVEL {hud.allianceOperations.guildCoreLevel} • miembros {hud.allianceOperations.activeMembersJoined} / {hud.allianceOperations.activeMembersLimit}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[9px] text-zinc-550 block font-mono">PROGRESO TEC TECH</span>
                      <strong className="text-xs text-indigo-400 font-mono">{simTechProgress}%</strong>
                    </div>
                  </div>

                  {/* Live scrolling encrypted chat com logs terminal */}
                  <div className="flex-1 bg-zinc-950 border border-zinc-900 rounded p-2 max-h-[140px] overflow-y-auto space-y-1.5 font-mono text-[9px] text-zinc-400">
                    {simMessages.map((msg, idx) => (
                      <div key={idx} className="leading-snug">
                        <span className="text-zinc-650">[{msg.timestamp}] </span>
                        {msg.sender === 'SYSTEM' ? (
                          <span className="text-emerald-400 font-semibold">[SISTEMA] {msg.text}</span>
                        ) : msg.sender === 'combat' ? (
                          <span className="text-indigo-400 font-semibold">[COMBAT] {msg.text}</span>
                        ) : (
                          <span><strong>{msg.sender}</strong>: {msg.text}</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Typing input form simulated */}
                  <div className="flex gap-2.5">
                    <input 
                      aria-label="input element"type="text" 
                      placeholder="Escribir al COM-LINK de Alianza..." 
                      value={simChatInput} 
                      onChange={(e) => setSimChatInput(e.target.value)} 
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && simChatInput.trim()) {
                          const newMsg: COMMessage = {
                            id: `msg_sim_${Date.now()}`,
                            timestamp: new Date().toLocaleTimeString().slice(0, 5),
                            sender: 'CyberKitsune',
                            text: simChatInput,
                            type: 'chat'
                          };
                          setSimMessages(prev => [...prev, newMsg]);
                          setSimChatInput('');
                        }
                      }}
                      className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-2 text-[10px] text-zinc-300 focus:outline-none" 
                    />

                    {/* Donación CTA subtraction and alert log trigger */}
                    <button onClick={() => {
                      setSimTechProgress(t => Math.min(100, t + hud.allianceOperations.donateProgressRateIncrement));
                      const donateLog: COMMessage = {
                        id: `msg_don_${Date.now()}`,
                        timestamp: new Date().toLocaleTimeString().slice(0, 5),
                        sender: 'SYSTEM',
                        text: `Donación activa de 50 cristales procesada. Nivel tecnológico incrementado +${hud.allianceOperations.donateProgressRateIncrement}%!`,
                        type: 'system'
                      };
                      setSimMessages(prev => [...prev, donateLog]);
                      triggerParticles(`-${hud.allianceOperations.donateCrystalCost} Cristales // +5,000 POW`);
                    }} className="px-3 py-1 bg-indigo-650 hover:bg-indigo-600 text-white font-bold rounded text-[9px] uppercase font-mono">
                      Donar 💎
                    </button>
                  </div>

                </div>
              )}

            </div>
          </div>
          )}

        </div>

      </div>

    </div>
  );
}
