import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Database, Shield, Cpu, Users, ChevronDown, ChevronRight, LogOut, CheckCircle, 
  X, AlertTriangle, Play, HelpCircle, Palette, LayoutGrid, Clock, Wifi, WifiOff, Settings,
  Compass, Navigation, Orbit, Gift, Radio, Ghost
} from 'lucide-react';

import { 
  BrandConfig, WebComponent, GameRule, UserProfile, SupabaseConfig, 
  MainFunction, SubFunctionType, NavigationState, GalaxyDustConfig 
} from './types';

import { 
  DEFAULT_BRAND, DEFAULT_COMPONENTS, DEFAULT_RULES, DEFAULT_USERS, DEFAULT_GALAXY_DUST_HUD 
} from './data';

import { 
  loadSupabaseConfig, supabaseService 
} from './lib/supabase';

// Importing admin sub-views
import SupabaseConfigModal from './components/SupabaseConfigModal';
import ConditionEditor from './components/ConditionEditor';
import UserCRM from './components/UserCRM';
import GalaxyDustHUD from './components/GalaxyDustHUD';
import CANManager from './components/CANManager';
import AdminShipsModule from './components/AdminShipsModule';
import AdminAssetMatrixModule from './components/AdminAssetMatrixModule';
import ExpedisionesModule from './components/ExpedicionesModule';
import ExpedicionesVueloModule from './components/ExpedicionesVueloModule';
import AdminMarketplaceModule from './components/AdminMarketplaceModule';
import AdminPhantomStationModule from './components/AdminPhantomStationModule';
import { AdminPromoModule } from './components/AdminPromoModule';
import { AdminAllianceCRM } from './components/AdminAllianceCRM';
import { AdminSecurityModule } from './components/AdminSecurityModule';

export default function App() {
  // Navigation State
  const [nav, setNav] = useState<NavigationState>({
    activeMain: 'hud',
    activeSub: 'hud_main'
  });

  // Sidebar subfunctions dropdown visibility states
  const [menuDropdowns, setMenuDropdowns] = useState({
    rules: false,
    crm: false,
    hud: false,
    can: false,
    ships: false,
    matrix: false,
    expediciones: false,
    expediciones_vuelo: false,
    market: false,
    phantom_station: false,
    promo: false,
    alliance: false,
    security: false
  });

  // Database Connection State
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(() => loadSupabaseConfig());
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Core Data States (Prepopulated / Loaded from local or remote DB)
  const [brand, setBrand] = useState<BrandConfig>(DEFAULT_BRAND);
  const [components, setComponents] = useState<WebComponent[]>(DEFAULT_COMPONENTS);
  const [rules, setRules] = useState<GameRule[]>(DEFAULT_RULES);
  const [users, setUsers] = useState<UserProfile[]>(DEFAULT_USERS);
  const [gameHud, setGameHud] = useState<GalaxyDustConfig>(DEFAULT_GALAXY_DUST_HUD);

  // Technical tracking states
  const [dataSources, setDataSources] = useState<Record<string, 'supabase' | 'local'>>({
    brand: 'local',
    components: 'local',
    rules: 'local',
    users: 'local',
    gameHud: 'local'
  });
  const [loading, setLoading] = useState(true);

  // Dynamic success/error alert visual system
  const [alert, setAlert] = useState<{ show: boolean; status: 'success' | 'error'; message: string }>({
    show: false,
    status: 'success',
    message: ''
  });

  // Trigger alert helper with standard timing
  const alertTrigger = (
    statusOrData: 'success' | 'error' | { show: boolean; status: 'success' | 'error'; message: string },
    message?: string
  ) => {
    if (typeof statusOrData === 'object') {
      setAlert(statusOrData);
      if (statusOrData.show) {
        setTimeout(() => {
          setAlert(prev => ({ ...prev, show: false }));
        }, 4000);
      }
    } else {
      setAlert({ show: true, status: statusOrData, message: message || '' });
      setTimeout(() => {
        setAlert(prev => ({ ...prev, show: false }));
      }, 4000);
    }
  };

  // Synchronized fetch of all assets
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const brandRes = await supabaseService.getBrand(DEFAULT_BRAND);
      const compRes = await supabaseService.getComponents(DEFAULT_COMPONENTS);
      const rulesRes = await supabaseService.getRules(DEFAULT_RULES);
      const usersRes = await supabaseService.getUsers(DEFAULT_USERS);
      const hudRes = await supabaseService.getGameHud(DEFAULT_GALAXY_DUST_HUD);

      setBrand(brandRes.data);
      setComponents(compRes.data);
      setRules(rulesRes.data);
      setUsers(usersRes.data);
      setGameHud(hudRes.data);

      setDataSources({
        brand: brandRes.source,
        components: compRes.source,
        rules: rulesRes.source,
        users: usersRes.source,
        gameHud: hudRes.source
      });
    } catch (err: any) {
      console.error('Core fetching parameters issue:', err);
      alertTrigger('error', 'Ocurrió un error consultando información lúdica de los servidores de Sasorilabs.');
    } finally {
      setLoading(false);
    }
  };

  // UTC Master Clock State
  const [utcTime, setUtcTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setUtcTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate Next Reset
  const getNextResetString = () => {
    if (!gameHud || !gameHud.serverSettings) return '';
    const resetHour = gameHud.serverSettings.utcMasterResetHour || 0;
    const now = utcTime;
    let nextReset = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), resetHour, 0, 0));
    if (now.getTime() >= nextReset.getTime()) {
      nextReset.setUTCDate(nextReset.getUTCDate() + 1);
    }
    const diff = nextReset.getTime() - now.getTime();
    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);
    return `${h}h ${m}m ${s}s`;
  };

  useEffect(() => {
    fetchAllData();
  }, [supabaseConfig]);

  // Global Keyboard Shortcuts Ctrl+1, Ctrl+2, Ctrl+3
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '1') {
          e.preventDefault();
          setNav({ activeMain: 'hud', activeSub: 'hud_main' });
          alertTrigger('success', 'Acceso Directo: GalaxyDust HUD (Ctrl+1)');
        } else if (e.key === '2') {
          e.preventDefault();
          setNav({ activeMain: 'rules', activeSub: 'rules_conditions' });
          alertTrigger('success', 'Acceso Directo: Condiciones y Atributos (Ctrl+2)');
        } else if (e.key === '3') {
          e.preventDefault();
          setNav({ activeMain: 'crm', activeSub: 'crm_users' });
          alertTrigger('success', 'Acceso Directo: CRM y Panel de Control (Ctrl+3)');
        } else if (e.key === '4') {
          e.preventDefault();
          setNav({ activeMain: 'game_hud', activeSub: 'hud_auth' });
          alertTrigger('success', 'Acceso Directo: Configurador de Cliente Juego HUD (Ctrl+4)');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Expand / collapse sidebar sections
  const [menuDropdownsState, setMenuDropdownsState] = useState<any>(); // Just in case, replacing toggleDropdown signature below
  const toggleDropdown = (sec: 'rules' | 'crm' | 'hud' | 'can' | 'ships' | 'matrix' | 'expediciones' | 'expediciones_vuelo' | 'market' | 'phantom_station' | 'promo' | 'alliance' | 'security') => {
    setMenuDropdowns(prev => ({
      ...prev,
      [sec]: !prev[sec]
    }));
  };

  // Global Sync Hooks to update state databases
  const handleSaveBrand = async (updatedBrand: BrandConfig) => {
    await supabaseService.saveBrand(updatedBrand);
    setBrand(updatedBrand);
    fetchAllData(); // reload
  };

  const handleSaveComponents = async (updatedComponents: WebComponent[]) => {
    await supabaseService.saveComponents(updatedComponents);
    setComponents(updatedComponents);
    fetchAllData(); // reload
  };

  const handleSaveRules = async (updatedRules: GameRule[]) => {
    await supabaseService.saveRules(updatedRules);
    setRules(updatedRules);
    fetchAllData(); // reload
  };

  const handleSaveUsers = async (updatedUsers: UserProfile[]) => {
    await supabaseService.saveUsers(updatedUsers);
    setUsers(updatedUsers);
    fetchAllData(); // reload
  };

  const handleSaveGameHud = async (updatedHud: GalaxyDustConfig) => {
    await supabaseService.saveGameHud(updatedHud);
    setGameHud(updatedHud);
    fetchAllData(); // reload
  };

  return (
    <div className="h-screen flex overflow-hidden bg-[#050506] font-sans antialiased text-zinc-300">
      
      {/* 1. LEFT SIDEBAR MENU - HIGH DENSITY DESCENT */}
      <aside className="w-64 flex-shrink-0 bg-zinc-950 border-r border-zinc-900 flex flex-col justify-between select-none">
        
        {/* Navigation Head Section */}
        <div className="flex flex-col space-y-4 p-4 flex-1 overflow-y-auto min-h-0 custom-scrollbar">
          
          {/* Brand header */}
          <div className="pb-4 border-b border-zinc-900">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 bg-red-650 rounded flex items-center justify-center text-white font-bold text-[10px] tracking-wide ring-2 ring-red-500/15 shrink-0">
                <span>SL</span>
              </div>
              <div className="min-w-0">
                <span className="text-white font-bold text-xs tracking-tight font-display uppercase block truncate">
                  SASORI CORE v2.8
                </span>
                <span className="text-[8px] px-1 py-0.2 bg-zinc-900 border border-zinc-800 text-red-500 font-mono rounded font-bold uppercase tracking-widest leading-none inline-block">
                  Enterprise OS
                </span>
              </div>
            </div>
          </div>

          {/* Connected database tiny tracker block */}
          <div 
            onClick={() => setShowConfigModal(true)}
            className="p-2.5 bg-zinc-900/30 hover:bg-zinc-900/60 border border-zinc-900 hover:border-zinc-805 rounded transition-all flex items-center justify-between cursor-pointer group"
          >
            <div className="flex items-center gap-2 min-w-0">
              {supabaseConfig.isConnected ? (
                <Wifi size={12} className="text-emerald-500 animate-pulse shrink-0" />
              ) : (
                <WifiOff size={12} className="text-zinc-650 shrink-0" />
              )}
              <div className="min-w-0">
                <span className="text-[9px] font-bold text-zinc-400 block tracking-wider uppercase">
                  {supabaseConfig.isConnected ? 'Sincronizado' : 'Modo Simulador'}
                </span>
                <span className="text-[8px] text-zinc-550 block truncate font-mono">
                  {supabaseConfig.isConnected ? supabaseConfig.url.replace('https://', '') : 'Local DB_PROD'}
                </span>
              </div>
            </div>
            <Settings size={12} className="text-zinc-600 group-hover:text-zinc-300 transition-colors shrink-0" />
          </div>

          {/* MENU FUNCTIONS AND SUBFUNCTIONS */}
          <nav className="space-y-3 pt-1">
            
            <div className="space-y-1">
              <span className="text-[9px] font-bold tracking-widest text-zinc-500 font-mono uppercase block px-1 mb-1.5">
                Desarrollo
              </span>

              {/* FUNCTION C.A.N: Control de Perfil, Semillas de Servidores, Alianzas */}
              <div className="space-y-0.5">
                <button
                  onClick={() => toggleDropdown('can')}
                  className={`w-full py-1.5 px-2 rounded flex items-center justify-between text-xs font-medium tracking-wide transition-all cursor-pointer ${
                    nav.activeMain === 'can' 
                      ? 'bg-zinc-900/65 text-red-500 font-semibold' 
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900/20'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Database size={13} className="shrink-0 text-red-500" />
                    <span className="truncate">C.A.N (Mantenimiento)</span>
                  </div>
                  {menuDropdowns.can ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                </button>

                <AnimatePresence initial={false}>
                  {menuDropdowns.can && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-zinc-950/40 flex flex-col gap-0.5 pl-3 border-l border-zinc-900 ml-3.5 mt-0.5"
                    >
                      <button
                        onClick={() => setNav({ activeMain: 'can', activeSub: 'can_commander' })}
                        className={`py-1 text-left text-[10.5px] transition-colors cursor-pointer block border-l pl-3 ${
                          nav.activeMain === 'can' && nav.activeSub === 'can_commander'
                            ? 'text-red-500 border-red-500 font-semibold'
                            : 'text-zinc-550 hover:text-zinc-300 border-zinc-900'
                        }`}
                      >
                        Auditoría de Comandante
                      </button>
                      <button
                        onClick={() => setNav({ activeMain: 'can', activeSub: 'can_global' })}
                        className={`py-1 text-left text-[10.5px] transition-colors cursor-pointer block border-l pl-3 ${
                          nav.activeMain === 'can' && nav.activeSub === 'can_global'
                            ? 'text-red-500 border-red-500 font-semibold'
                            : 'text-zinc-550 hover:text-zinc-300 border-zinc-900'
                        }`}
                      >
                        Configuración Global
                      </button>
                      <button
                        onClick={() => setNav({ activeMain: 'can', activeSub: 'can_alliances' })}
                        className={`py-1 text-left text-[10.5px] transition-colors cursor-pointer block border-l pl-3 ${
                          nav.activeMain === 'can' && nav.activeSub === 'can_alliances'
                            ? 'text-red-500 border-red-500 font-semibold'
                            : 'text-zinc-550 hover:text-zinc-300 border-zinc-900'
                        }`}
                      >
                        Monitoreo de Alianzas
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* FUNCTION 2: Conditions and Rules */}
              <div className="space-y-0.5">
                <button
                  onClick={() => toggleDropdown('rules')}
                  className={`w-full py-1.5 px-2 rounded flex items-center justify-between text-xs font-medium tracking-wide transition-all cursor-pointer ${
                    nav.activeMain === 'rules' 
                      ? 'bg-zinc-900/65 text-red-500 font-semibold' 
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900/20'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Cpu size={13} className="shrink-0" />
                    <span className="truncate">Condiciones y Reglas</span>
                  </div>
                  {menuDropdowns.rules ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                </button>

                <AnimatePresence initial={false}>
                  {menuDropdowns.rules && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-zinc-950/40 flex flex-col gap-0.5 pl-3 border-l border-zinc-900 ml-3.5 mt-0.5"
                    >
                      <button
                        onClick={() => setNav({ activeMain: 'rules', activeSub: 'rules_list' })}
                        className={`py-1 text-left text-[10.5px] transition-colors cursor-pointer block border-l pl-3 ${
                          nav.activeMain === 'rules' && nav.activeSub === 'rules_list'
                            ? 'text-red-500 border-red-500 font-semibold'
                            : 'text-zinc-550 hover:text-zinc-300 border-zinc-900'
                        }`}
                      >
                        Reglas Activas
                      </button>
                      <button
                        onClick={() => setNav({ activeMain: 'rules', activeSub: 'rules_builder' })}
                        className={`py-1 text-left text-[10.5px] transition-colors cursor-pointer block border-l pl-3 ${
                          nav.activeMain === 'rules' && nav.activeSub === 'rules_builder'
                            ? 'text-red-500 border-red-500 font-semibold'
                            : 'text-zinc-550 hover:text-zinc-300 border-zinc-900'
                        }`}
                      >
                        Constructor Lógico
                      </button>
                      <button
                        onClick={() => setNav({ activeMain: 'rules', activeSub: 'rules_testing' })}
                        className={`py-1 text-left text-[10.5px] transition-colors cursor-pointer block border-l pl-3 ${
                          nav.activeMain === 'rules' && nav.activeSub === 'rules_testing'
                            ? 'text-red-500 border-red-500 font-semibold'
                            : 'text-zinc-550 hover:text-zinc-300 border-zinc-900'
                        }`}
                      >
                        Sandbox Unitario
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* FUNCTION 3: Users CRM */}
              <div className="space-y-0.5">
                <button
                  onClick={() => toggleDropdown('crm')}
                  className={`w-full py-1.5 px-2 rounded flex items-center justify-between text-xs font-medium tracking-wide transition-all cursor-pointer ${
                    nav.activeMain === 'crm' 
                      ? 'bg-zinc-900/65 text-red-500 font-semibold' 
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900/20'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Users size={13} className="shrink-0" />
                    <span className="truncate">Gestor CRM</span>
                  </div>
                  {menuDropdowns.crm ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                </button>

                <AnimatePresence initial={false}>
                  {menuDropdowns.crm && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-zinc-950/40 flex flex-col gap-0.5 pl-3 border-l border-zinc-900 ml-3.5 mt-0.5"
                    >
                      <button
                        onClick={() => setNav({ activeMain: 'crm', activeSub: 'crm_users' })}
                        className={`py-1 text-left text-[10.5px] transition-colors cursor-pointer block border-l pl-3 ${
                          nav.activeMain === 'crm' && nav.activeSub === 'crm_users'
                            ? 'text-red-500 border-red-500 font-semibold'
                            : 'text-zinc-550 hover:text-zinc-300 border-zinc-900'
                        }`}
                      >
                        CRM Central
                      </button>
                      <button
                        onClick={() => setNav({ activeMain: 'crm', activeSub: 'crm_analytics' })}
                        className={`py-1 text-left text-[10.5px] transition-colors cursor-pointer block border-l pl-3 ${
                          nav.activeMain === 'crm' && nav.activeSub === 'crm_analytics'
                            ? 'text-red-500 border-red-500 font-semibold'
                            : 'text-zinc-550 hover:text-zinc-300 border-zinc-900'
                        }`}
                      >
                        Paneles de Control
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* FUNCTION 4: Flotas y Naves */}
              <div className="space-y-0.5">
                <button
                  onClick={() => toggleDropdown('ships')}
                  className={`w-full py-1.5 px-2 rounded flex items-center justify-between text-xs font-medium tracking-wide transition-all cursor-pointer ${
                    nav.activeMain === 'ships' 
                      ? 'bg-zinc-900/65 text-red-500 font-semibold' 
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900/20'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Navigation size={13} className="shrink-0 text-red-500 rotate-45" />
                    <span className="truncate">Flotas y Naves</span>
                  </div>
                  {menuDropdowns.ships ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                </button>

                <AnimatePresence initial={false}>
                  {menuDropdowns.ships && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-zinc-950/40 flex flex-col gap-0.5 pl-3 border-l border-zinc-900 ml-3.5 mt-0.5"
                    >
                      <button
                        onClick={() => setNav({ activeMain: 'ships', activeSub: 'ships_atelier' })}
                        className={`py-1 text-left text-[10.5px] transition-colors cursor-pointer block border-l pl-3 ${
                          nav.activeMain === 'ships' && nav.activeSub === 'ships_atelier'
                            ? 'text-red-500 border-red-500 font-semibold'
                            : 'text-zinc-550 hover:text-zinc-300 border-zinc-900'
                        }`}
                      >
                        Taller Estelar (SEED)
                      </button>
                      <button
                        onClick={() => setNav({ activeMain: 'ships', activeSub: 'ships_hangar' })}
                        className={`py-1 text-left text-[10.5px] transition-colors cursor-pointer block border-l pl-3 ${
                          nav.activeMain === 'ships' && nav.activeSub === 'ships_hangar'
                            ? 'text-red-500 border-red-500 font-semibold'
                            : 'text-zinc-550 hover:text-zinc-300 border-zinc-900'
                        }`}
                      >
                        Hangar del Comandante
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* FUNCTION 5: Matriz de Componentes */}
              <div className="space-y-0.5">
                <button
                  onClick={() => toggleDropdown('matrix')}
                  className={`w-full py-1.5 px-2 rounded flex items-center justify-between text-xs font-medium tracking-wide transition-all cursor-pointer ${
                    nav.activeMain === 'matrix' 
                      ? 'bg-zinc-900/65 text-red-500 font-semibold' 
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900/20'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <LayoutGrid size={13} className="shrink-0 text-red-500" />
                    <span className="truncate">Matriz de Componentes</span>
                  </div>
                  {menuDropdowns.matrix ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                </button>

                <AnimatePresence initial={false}>
                  {menuDropdowns.matrix && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-zinc-950/40 flex flex-col gap-0.5 pl-3 border-l border-zinc-900 ml-3.5 mt-0.5"
                    >
                      <button
                        onClick={() => setNav({ activeMain: 'matrix', activeSub: 'matrix_overview' })}
                        className={`py-1 text-left text-[10.5px] transition-colors cursor-pointer block border-l pl-3 ${
                          nav.activeMain === 'matrix' && nav.activeSub === 'matrix_overview'
                            ? 'text-red-500 border-red-500 font-semibold'
                            : 'text-zinc-550 hover:text-zinc-300 border-zinc-900'
                        }`}
                      >
                        Consola de Control
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* FUNCTION 6: Expediciones (Sasorilabs) */}
              <div className="space-y-0.5">
                <button
                  onClick={() => toggleDropdown('expediciones')}
                  className={`w-full py-1.5 px-2 rounded flex items-center justify-between text-xs font-medium tracking-wide transition-all cursor-pointer ${
                    nav.activeMain === 'expediciones' 
                      ? 'bg-zinc-900/65 text-red-500 font-semibold' 
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900/20'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Orbit size={13} className="shrink-0 text-red-500 animate-spin" />
                    <span className="truncate">Expediciones</span>
                  </div>
                  {menuDropdowns.expediciones ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                </button>

                <AnimatePresence initial={false}>
                  {menuDropdowns.expediciones && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-zinc-950/40 flex flex-col gap-0.5 pl-3 border-l border-zinc-900 ml-3.5 mt-0.5"
                    >
                      <button
                        onClick={() => setNav({ activeMain: 'expediciones', activeSub: 'expediciones_dashboard' })}
                        className={`py-1 text-left text-[10.5px] transition-colors cursor-pointer block border-l pl-3 ${
                          nav.activeMain === 'expediciones' && nav.activeSub === 'expediciones_dashboard'
                            ? 'text-red-500 border-red-500 font-semibold'
                            : 'text-zinc-550 hover:text-zinc-300 border-zinc-900'
                        }`}
                      >
                        1) Expediciones
                      </button>
                      <button
                        onClick={() => setNav({ activeMain: 'expediciones', activeSub: 'expediciones_creator' })}
                        className={`py-1 text-left text-[10.5px] transition-colors cursor-pointer block border-l pl-3 ${
                          nav.activeMain === 'expediciones' && nav.activeSub === 'expediciones_creator'
                            ? 'text-red-500 border-red-500 font-semibold'
                            : 'text-zinc-550 hover:text-zinc-300 border-zinc-900'
                        }`}
                      >
                        2) Creador de Galaxias
                      </button>
                      <button
                        onClick={() => setNav({ activeMain: 'expediciones', activeSub: 'expediciones_rewards' })}
                        className={`py-1 text-left text-[10.5px] transition-colors cursor-pointer block border-l pl-3 ${
                          nav.activeMain === 'expediciones' && nav.activeSub === 'expediciones_rewards'
                            ? 'text-red-500 border-red-500 font-semibold'
                            : 'text-zinc-550 hover:text-zinc-300 border-zinc-900'
                        }`}
                      >
                        3) Recompensas y A.M.I.
                      </button>
                      <button
                        onClick={() => setNav({ activeMain: 'expediciones', activeSub: 'expediciones_events' })}
                        className={`py-1 text-left text-[10.5px] transition-colors cursor-pointer block border-l pl-3 ${
                          nav.activeMain === 'expediciones' && nav.activeSub === 'expediciones_events'
                            ? 'text-red-500 border-red-500 font-semibold'
                            : 'text-zinc-550 hover:text-zinc-300 border-zinc-900'
                        }`}
                      >
                        4) Eventos de Alianzas
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* FUNCTION 7: Expediciones en Vuelo (Sasorilabs) */}
              <div className="space-y-0.5">
                <button
                  onClick={() => toggleDropdown('expediciones_vuelo')}
                  className={`w-full py-1.5 px-2 rounded flex items-center justify-between text-xs font-medium tracking-wide transition-all cursor-pointer ${
                    nav.activeMain === 'expediciones_vuelo' 
                      ? 'bg-zinc-900/65 text-red-500 font-semibold' 
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900/20'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Radio size={13} className="shrink-0 text-[#ff1e1e] animate-pulse" />
                    <span className="truncate">Expediciones en Vuelo</span>
                  </div>
                  {menuDropdowns.expediciones_vuelo ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                </button>

                <AnimatePresence initial={false}>
                  {menuDropdowns.expediciones_vuelo && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-zinc-950/40 flex flex-col gap-0.5 pl-3 border-l border-zinc-900 ml-3.5 mt-0.5"
                    >
                      <button
                        onClick={() => setNav({ activeMain: 'expediciones_vuelo', activeSub: 'vuelo_telemetria' })}
                        className={`py-1 text-left text-[10.5px] transition-colors cursor-pointer block border-l pl-3 ${
                          nav.activeMain === 'expediciones_vuelo' && nav.activeSub === 'vuelo_telemetria'
                            ? 'text-red-500 border-red-500 font-semibold'
                            : 'text-zinc-550 hover:text-zinc-300 border-zinc-900'
                        }`}
                      >
                        1) Telemetría Táctica
                      </button>
                      <button
                        onClick={() => setNav({ activeMain: 'expediciones_vuelo', activeSub: 'vuelo_estados' })}
                        className={`py-1 text-left text-[10.5px] transition-colors cursor-pointer block border-l pl-3 ${
                          nav.activeMain === 'expediciones_vuelo' && nav.activeSub === 'vuelo_estados'
                            ? 'text-red-500 border-red-500 font-semibold'
                            : 'text-zinc-550 hover:text-zinc-300 border-zinc-900'
                        }`}
                      >
                        2) Control de Estados
                      </button>
                      <button
                        onClick={() => setNav({ activeMain: 'expediciones_vuelo', activeSub: 'vuelo_rng' })}
                        className={`py-1 text-left text-[10.5px] transition-colors cursor-pointer block border-l pl-3 ${
                          nav.activeMain === 'expediciones_vuelo' && nav.activeSub === 'vuelo_rng'
                            ? 'text-red-500 border-red-500 font-semibold'
                            : 'text-zinc-550 hover:text-zinc-300 border-zinc-900'
                        }`}
                      >
                        3) Motor RNG en Vuelo
                      </button>
                      <button
                        onClick={() => setNav({ activeMain: 'expediciones_vuelo', activeSub: 'vuelo_skills' })}
                        className={`py-1 text-left text-[10.5px] transition-colors cursor-pointer block border-l pl-3 ${
                          nav.activeMain === 'expediciones_vuelo' && nav.activeSub === 'vuelo_skills'
                            ? 'text-red-500 border-red-500 font-semibold'
                            : 'text-zinc-550 hover:text-zinc-300 border-zinc-900'
                        }`}
                      >
                        4) Interacción de Skills
                      </button>
                      <button
                        onClick={() => setNav({ activeMain: 'expediciones_vuelo', activeSub: 'vuelo_seguridad' })}
                        className={`py-1 text-left text-[10.5px] transition-colors cursor-pointer block border-l pl-3 ${
                          nav.activeMain === 'expediciones_vuelo' && nav.activeSub === 'vuelo_seguridad'
                            ? 'text-red-500 border-red-500 font-semibold'
                            : 'text-zinc-550 hover:text-zinc-300 border-zinc-900'
                        }`}
                      >
                        5) Anti-Exploit & Seg.
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* FUNCTION 8: Mercado P2P */}
              <div className="space-y-0.5">
                <button
                  onClick={() => toggleDropdown('market')}
                  className={`w-full py-1.5 px-2 rounded flex items-center justify-between text-xs font-medium tracking-wide transition-all cursor-pointer ${
                    nav.activeMain === 'market' 
                      ? 'bg-zinc-900/65 text-red-500 font-semibold' 
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900/20'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Gift size={13} className="shrink-0 text-red-500" />
                    <span className="truncate">Mercado P2P</span>
                  </div>
                  {menuDropdowns.market ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                </button>

                <AnimatePresence initial={false}>
                  {menuDropdowns.market && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-zinc-950/40 flex flex-col gap-0.5 pl-3 border-l border-zinc-900 ml-3.5 mt-0.5"
                    >
                      <button
                        onClick={() => setNav({ activeMain: 'market', activeSub: 'market_items' })}
                        className={`py-1 text-left text-[10.5px] transition-colors cursor-pointer block border-l pl-3 ${
                          nav.activeMain === 'market' && nav.activeSub === 'market_items'
                            ? 'text-red-500 border-red-500 font-semibold'
                            : 'text-zinc-550 hover:text-zinc-300 border-zinc-900'
                        }`}
                      >
                        1) Ventas de Items
                      </button>
                      <button
                        onClick={() => setNav({ activeMain: 'market', activeSub: 'market_auctions' })}
                        className={`py-1 text-left text-[10.5px] transition-colors cursor-pointer block border-l pl-3 ${
                          nav.activeMain === 'market' && nav.activeSub === 'market_auctions'
                            ? 'text-red-500 border-red-500 font-semibold'
                            : 'text-zinc-550 hover:text-zinc-300 border-zinc-900'
                        }`}
                      >
                        2) Historial Pujas
                      </button>
                      <button
                        onClick={() => setNav({ activeMain: 'market', activeSub: 'market_rules' })}
                        className={`py-1 text-left text-[10.5px] transition-colors cursor-pointer block border-l pl-3 ${
                          nav.activeMain === 'market' && nav.activeSub === 'market_rules'
                            ? 'text-red-500 border-red-500 font-semibold'
                            : 'text-zinc-550 hover:text-zinc-300 border-zinc-900'
                        }`}
                      >
                        3) Reglas del Mercado
                      </button>
                      <button
                        onClick={() => setNav({ activeMain: 'market', activeSub: 'market_audit' })}
                        className={`py-1 text-left text-[10.5px] transition-colors cursor-pointer block border-l pl-3 ${
                          nav.activeMain === 'market' && nav.activeSub === 'market_audit'
                            ? 'text-red-500 border-red-500 font-semibold'
                            : 'text-zinc-550 hover:text-zinc-300 border-zinc-900'
                        }`}
                      >
                        4) Auditoría Fiscal
                      </button>
                      <button
                        onClick={() => setNav({ activeMain: 'market', activeSub: 'market_inbox' })}
                        className={`py-1 text-left text-[10.5px] transition-colors cursor-pointer block border-l pl-3 ${
                          nav.activeMain === 'market' && nav.activeSub === 'market_inbox'
                            ? 'text-red-500 border-red-500 font-semibold'
                            : 'text-zinc-550 hover:text-zinc-300 border-zinc-900'
                        }`}
                      >
                        5) Buzón In-Game
                      </button>
                      <button
                        onClick={() => setNav({ activeMain: 'market', activeSub: 'market_analytics' })}
                        className={`py-1 text-left text-[10.5px] transition-colors cursor-pointer block border-l pl-3 ${
                          nav.activeMain === 'market' && nav.activeSub === 'market_analytics'
                            ? 'text-red-500 border-red-500 font-semibold'
                            : 'text-zinc-550 hover:text-zinc-300 border-zinc-900'
                        }`}
                      >
                        6) Análisis de Mercado
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* FUNCTION 9: Phantom Station Admin */}
              <div className="space-y-0.5">
                <button
                  onClick={() => {
                    toggleDropdown('phantom_station');
                    setNav({ activeMain: 'phantom_station', activeSub: 'phantom_store' });
                  }}
                  className={`w-full py-1.5 px-2 rounded flex items-center justify-between text-xs font-medium tracking-wide transition-all cursor-pointer ${
                    nav.activeMain === 'phantom_station' 
                      ? 'bg-zinc-900/65 text-red-500 font-semibold' 
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900/20'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Ghost size={13} className="shrink-0 text-red-500 animate-pulse" />
                    <span className="truncate">Phantom Station</span>
                  </div>
                  {menuDropdowns.phantom_station ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                </button>

                <AnimatePresence initial={false}>
                  {menuDropdowns.phantom_station && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-zinc-950/40 flex flex-col gap-0.5 pl-3 border-l border-zinc-900 ml-3.5 mt-0.5"
                    >
                      <button
                        onClick={() => setNav({ activeMain: 'phantom_station', activeSub: 'phantom_store' })}
                        className={`py-1 text-left text-[10.5px] transition-colors cursor-pointer block border-l pl-3 ${
                          nav.activeMain === 'phantom_station' && nav.activeSub === 'phantom_store'
                            ? 'text-red-500 border-red-500 font-semibold'
                            : 'text-zinc-550 hover:text-zinc-300 border-zinc-900'
                        }`}
                      >
                        1) Suministro Curado
                      </button>
                      <button
                        onClick={() => setNav({ activeMain: 'phantom_station', activeSub: 'phantom_refresh' })}
                        className={`py-1 text-left text-[10.5px] transition-colors cursor-pointer block border-l pl-3 ${
                          nav.activeMain === 'phantom_station' && nav.activeSub === 'phantom_refresh'
                            ? 'text-red-500 border-red-500 font-semibold'
                            : 'text-zinc-550 hover:text-zinc-300 border-zinc-900'
                        }`}
                      >
                        2) Motor de Refrescos
                      </button>
                      <button
                        onClick={() => setNav({ activeMain: 'phantom_station', activeSub: 'phantom_cleansing' })}
                        className={`py-1 text-left text-[10.5px] transition-colors cursor-pointer block border-l pl-3 ${
                          nav.activeMain === 'phantom_station' && nav.activeSub === 'phantom_cleansing'
                            ? 'text-red-500 border-red-500 font-semibold'
                            : 'text-zinc-550 hover:text-zinc-300 border-zinc-900'
                        }`}
                      >
                        3) Data Cleansing
                      </button>
                      <button
                        onClick={() => setNav({ activeMain: 'phantom_station', activeSub: 'phantom_events' })}
                        className={`py-1 text-left text-[10.5px] transition-colors cursor-pointer block border-l pl-3 ${
                          nav.activeMain === 'phantom_station' && nav.activeSub === 'phantom_events'
                            ? 'text-red-500 border-red-500 font-semibold'
                            : 'text-zinc-550 hover:text-zinc-300 border-zinc-900'
                        }`}
                      >
                        4) Eventos & LiveOps
                      </button>
                      <button
                        onClick={() => setNav({ activeMain: 'phantom_station', activeSub: 'phantom_audit' })}
                        className={`py-1 text-left text-[10.5px] transition-colors cursor-pointer block border-l pl-3 ${
                          nav.activeMain === 'phantom_station' && nav.activeSub === 'phantom_audit'
                            ? 'text-red-500 border-red-500 font-semibold'
                            : 'text-zinc-550 hover:text-zinc-300 border-zinc-900'
                        }`}
                      >
                        5) Auditoría "GD"
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* FUNCTION 10: Promociones & Marketing */}
              <div className="space-y-0.5">
                <button
                  onClick={() => {
                    toggleDropdown('promo');
                    setNav({ activeMain: 'promo', activeSub: 'promo_main' });
                  }}
                  className={`w-full py-1.5 px-2 rounded flex items-center justify-between text-xs font-medium tracking-wide transition-all cursor-pointer ${
                    nav.activeMain === 'promo' 
                      ? 'bg-zinc-900/65 text-red-500 font-semibold' 
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900/20'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Radio size={13} className="shrink-0 text-emerald-500" />
                    <span className="truncate">Promociones & Marketing</span>
                  </div>
                  {menuDropdowns.promo ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                </button>
              </div>

              {/* FUNCTION 11: Moderación (CRM Alianzas) */}
              <div className="space-y-0.5">
                <button
                  onClick={() => {
                    toggleDropdown('alliance');
                    setNav({ activeMain: 'alliance', activeSub: 'alliance_main' });
                  }}
                  className={`w-full py-1.5 px-2 rounded flex items-center justify-between text-xs font-medium tracking-wide transition-all cursor-pointer ${
                    nav.activeMain === 'alliance' 
                      ? 'bg-zinc-900/65 text-red-500 font-semibold' 
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900/20'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Shield size={13} className="shrink-0 text-purple-500" />
                    <span className="truncate">Moderación de Alianzas</span>
                  </div>
                  {menuDropdowns.alliance ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                </button>
              </div>

              {/* FUNCTION 12: Seguridad & Anti-Cheat */}
              <div className="space-y-0.5">
                <button
                  onClick={() => {
                    toggleDropdown('security');
                    setNav({ activeMain: 'security', activeSub: 'security_main' });
                  }}
                  className={`w-full py-1.5 px-2 rounded flex items-center justify-between text-xs font-medium tracking-wide transition-all cursor-pointer ${
                    nav.activeMain === 'security' 
                      ? 'bg-zinc-900/65 text-red-500 font-semibold' 
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900/20'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <AlertTriangle size={13} className="shrink-0 text-red-600 animate-pulse" />
                    <span className="truncate">Seguridad Anti-Cheat</span>
                  </div>
                  {menuDropdowns.security ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                </button>
              </div>

            </div>

          </nav>

        </div>

        {/* BOTTOM SIDEBAR FOOTER - Session info and real-time clock */}
        <div className="p-4 border-t border-zinc-900 bg-zinc-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-zinc-900 border border-zinc-850 flex items-center justify-center font-extrabold text-xs text-red-500 shrink-0">
               AD
            </div>
            <div className="min-w-0 flex flex-col">
              <span className="text-[10.5px] font-semibold text-white truncate">amijares@sasorilabs.io</span>
              <span className="text-[8.5px] text-zinc-500 font-mono">Super Administrator</span>
            </div>
          </div>
          
          <div className="mt-2.5 flex items-center gap-1.5 p-1.5 bg-[#0a0a0c] border border-zinc-900 rounded text-[9px] text-zinc-500 font-mono">
            <Clock size={10} className="text-red-500 flex-shrink-0" />
            <div className="flex-1 flex justify-between">
              <span>{utcTime.toISOString().split('T')[0]}</span>
              <span>{utcTime.toISOString().split('T')[1].substring(0, 5)} UTC</span>
            </div>
          </div>
        </div>

      </aside>

      {/* 2. CENTRAL FRAME DISPLAY WRAPPER WITH SCBAR */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#050506]">
        
        {/* Core Frame Header Bar */}
        <header className="h-14 border-b border-zinc-900 flex-shrink-0 px-6 flex items-center justify-between select-none bg-zinc-950/40 backdrop-blur-md">
          
          <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-medium uppercase tracking-wide">
            <span>PROYECTOS</span>
            <ChevronRight size={11} className="text-zinc-800 shrink-0" />
            <span>SaaS Engine Alpha</span>
            <ChevronRight size={11} className="text-zinc-800 shrink-0" />
            <span className="text-zinc-300 font-semibold">
              {nav.activeMain === 'rules' ? 'Reglas de Juego' 
                : nav.activeMain === 'crm' ? 'CRM de Usuarios' 
                : nav.activeMain === 'can' ? 'Calibrador C.A.N' 
                : nav.activeMain === 'ships' ? 'Flotas y Naves'
                : nav.activeMain === 'matrix' ? 'Matriz de Componentes'
                : nav.activeMain === 'expediciones' ? 'Expediciones Colectoras'
                : nav.activeMain === 'expediciones_vuelo' ? 'Expediciones en Vuelo'
                : nav.activeMain === 'phantom_station' ? 'Phantom Station Admin'
                : nav.activeMain === 'promo' ? 'Promociones & Marketing'
                : nav.activeMain === 'alliance' ? 'Moderación de Alianzas'
                : nav.activeMain === 'security' ? 'Seguridad Anti-Cheat'
                : 'Configurador Juego'}
            </span>
            <span className="text-zinc-750 font-sans text-xs shrink-0">/</span>
            <span className="text-[9px] font-mono bg-zinc-900 border border-zinc-850 text-red-500 px-2 py-0.5 rounded capitalize shrink-0">
              {nav.activeSub.replace('branding_', '').replace('rules_', '').replace('crm_', '').replace('hud_', '').replace('can_', '').replace('ships_', '').replace('matrix_', '').replace('expediciones_', '').replace('vuelo_', '').replace('promo_', '').replace('alliance_', '').replace('security_', '').replace('_', ' ')}
            </span>
          </div>

          <div className="flex items-center gap-4">
            
            {/* UTC Master Clock */}
            {gameHud?.serverSettings && (
              <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg shadow-inner">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-red-500" />
                  <span className="text-zinc-300 font-mono text-xs font-bold">
                    {utcTime.toISOString().split('T')[1].substring(0, 8)} <span className="text-zinc-500">UTC</span>
                  </span>
                </div>
                <div className="w-[1px] h-4 bg-zinc-700"></div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-zinc-500 font-bold uppercase">Reset Hour:</span>
                  <select 
                    aria-label="Hora de reset UTC"
                    value={gameHud.serverSettings.utcMasterResetHour}
                    onChange={(e) => {
                      const updated = {
                        ...gameHud,
                        serverSettings: {
                          ...gameHud.serverSettings,
                          utcMasterResetHour: parseInt(e.target.value) || 0
                        }
                      };
                      handleSaveGameHud(updated);
                      alertTrigger('success', 'Hora de Reset UTC actualizada');
                    }}
                    className="bg-zinc-950 text-red-500 text-xs font-mono border border-zinc-800 rounded px-1 cursor-pointer focus:outline-none"
                  >
                    {[...Array(24)].map((_, i) => (
                      <option key={i} value={i}>{i.toString().padStart(2, '0')}:00 UTC</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-zinc-500 font-bold uppercase">Next in:</span>
                  <span className="text-emerald-400 font-mono text-xs font-bold tracking-tight">{getNextResetString()}</span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/5 text-emerald-400 text-[10px] font-bold border border-emerald-500/15 rounded">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              LIVE SYSTEM
            </div>
            <div className="w-[1px] h-4 bg-zinc-800"></div>
            <button
              onClick={() => setShowConfigModal(true)}
              className="py-1 px-2.5 font-mono text-[10px] font-bold border border-zinc-800 hover:border-red-500/30 text-zinc-350 rounded hover:text-white bg-zinc-950 transition-all flex items-center gap-1.5 cursor-pointer hover:bg-zinc-900"
            >
              <Database size={11} className="text-red-500" />
              {supabaseConfig.isConnected ? 'CONNECTED' : 'CONNECT DB'}
            </button>
          </div>

        </header>

        {/* CORE VIEWS CONTAINER */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-3">
              <div className="h-8 w-8 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
              <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Sincronizando información...</span>
            </div>
          ) : (
            <>
              {/* PAGES MOVED OR REMOVED */}

              {/* RULES AND GAME CONDITIONS */}
              {nav.activeMain === 'rules' && (
                <ConditionEditor
                  rules={rules}
                  users={users}
                  onSaveRules={handleSaveRules}
                  setIsAlertToShow={alertTrigger}
                />
              )}

              {/* USER CRM */}
              {nav.activeMain === 'crm' && (
                <UserCRM
                  users={users}
                  rules={rules}
                  onSaveUsers={handleSaveUsers}
                  setIsAlertToShow={alertTrigger}
                />
              )}

              {/* C.A.N. MAINTENANCE AREA */}
              {nav.activeMain === 'can' && (
                <CANManager
                  users={users}
                  rules={rules}
                  onSaveUsers={handleSaveUsers}
                  onRefreshData={fetchAllData}
                  setIsAlertToShow={alertTrigger}
                  activeSubTab={nav.activeSub as any}
                />
              )}

              {/* FLOTAS Y NAVES MODULE */}
              {nav.activeMain === 'ships' && (
                <AdminShipsModule
                  users={users}
                  setIsAlertToShow={alertTrigger}
                  onRefreshData={fetchAllData}
                />
              )}

              {/* MATRIX OF COMPONENTS MODULE */}
              {nav.activeMain === 'matrix' && (
                <AdminAssetMatrixModule
                  users={users}
                  setIsAlertToShow={alertTrigger}
                  onRefreshData={fetchAllData}
                />
              )}

              {/* EXPEDICIONES MODULE */}
              {nav.activeMain === 'expediciones' && (
                <ExpedisionesModule
                  users={users}
                  setIsAlertToShow={alertTrigger}
                  activeSubTab={nav.activeSub}
                />
              )}

              {/* EXPEDICIONES EN VUELO MODULE */}
              {nav.activeMain === 'expediciones_vuelo' && (
                <ExpedicionesVueloModule
                  users={users}
                  setIsAlertToShow={alertTrigger}
                  activeSubTab={nav.activeSub}
                />
              )}

              {/* MERCADO P2P MODULE */}
              {nav.activeMain === 'market' && (
                <AdminMarketplaceModule
                  users={users}
                  setIsAlertToShow={alertTrigger}
                  onRefreshData={fetchAllData}
                  activeSubTab={nav.activeSub}
                />
              )}

              {/* PHANTOM STATION MODULE */}
              {nav.activeMain === 'phantom_station' && (
                <AdminPhantomStationModule
                  gameHud={gameHud}
                  users={users}
                  onSaveGameHud={async (updatedHud) => {
                    await supabaseService.saveGameHud(updatedHud);
                    setGameHud(updatedHud);
                    fetchAllData();
                  }}
                  setIsAlertToShow={(al) => {
                    const mappedStatus = al.status === 'warning' ? 'error' : al.status;
                    alertTrigger(mappedStatus, al.message);
                  }}
                />
              )}

              {/* NEW MODULES */}
              {nav.activeMain === 'promo' && <AdminPromoModule />}
              {nav.activeMain === 'alliance' && <AdminAllianceCRM />}
              {nav.activeMain === 'security' && <AdminSecurityModule />}
            </>
          )}

        </div>

      </main>

      {/* 3. MODAL FOR SUPABASE CONNECTION CONFIGURATION */}
      <AnimatePresence>
        {showConfigModal && (
          <SupabaseConfigModal
            onConfigChanged={(updatedConfig) => {
              setSupabaseConfig(updatedConfig);
            }}
            onClose={() => setShowConfigModal(false)}
          />
        )}
      </AnimatePresence>

      {/* 4. NOTIFICATION BANNER SYSTEM FOR ACTIONS ACCORD */}
      <AnimatePresence>
        {alert.show && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-6 right-6 z-50 p-4 border rounded-xl flex items-start gap-3 shadow-2xl backdrop-blur-md max-w-sm ${
              alert.status === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-400'
                : 'bg-red-950/80 border-red-500/30 text-red-500'
            }`}
          >
            {alert.status === 'success' ? (
              <CheckCircle className="flex-shrink-0 mt-0.5" size={16} />
            ) : (
              <AlertTriangle className="flex-shrink-0 mt-0.5" size={16} />
            )}
            <div className="text-xs leading-normal">
              <span className="font-bold uppercase tracking-wider block mb-0.5">
                {alert.status === 'success' ? 'Notificación Éxito' : 'Error en el Servidor'}
              </span>
              <span>{alert.message}</span>
            </div>
            <button
              onClick={() => setAlert(prev => ({ ...prev, show: false }))}
              className="text-zinc-400 hover:text-white self-center cursor-pointer p-0.5 rounded hover:bg-black/30"
              aria-label="Cerrar notificación"
            >
              <X size={13} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
