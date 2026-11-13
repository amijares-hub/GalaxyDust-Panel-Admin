import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database, Shield, Cpu, Users, ChevronDown, ChevronRight, CheckCircle,
  X, AlertTriangle, LayoutGrid, Clock, Wifi, WifiOff, Settings,
  Orbit, Gift, Radio, Ghost, Menu, ShieldAlert, Trophy, Monitor, Coins, Package, Globe, LogOut, Loader2
} from 'lucide-react';

import {
  BrandConfig, WebComponent, GameRule, UserProfile, SupabaseConfig,
  NavigationState, GalaxyDustConfig, SubFunctionType
} from './types';

import {
  DEFAULT_BRAND, DEFAULT_COMPONENTS, DEFAULT_RULES, DEFAULT_USERS, DEFAULT_GALAXY_DUST_HUD
} from './data';

import {
  loadSupabaseConfig, supabaseService, supabase
} from './lib/supabase';
import type { User as SupabaseUser, Session as SupabaseSession } from '@supabase/supabase-js';

// Componentes Administrativos Core
import { AdminLogin, ALLOWED_ADMIN_EMAIL } from './components/AdminLogin';
import { AccessDenied } from './components/AccessDenied';
import { SessionChallengeModal } from './components/SessionChallengeModal';
import SupabaseConfigModal from './components/SupabaseConfigModal';
import ConditionEditor from './components/ConditionEditor';
import UserCRM from './components/UserCRM';
import GalaxyDustHUD from './components/GalaxyDustHUD';
import CANManager from './components/CANManager';
import { ComponentMatrix } from './components/ComponentMatrix';
import ExpeditionsManager from './components/ExpeditionsManager';
import { SkillManager } from './components/SkillManager';
import { AdminPromoModule } from './components/AdminPromoModule';
import { AdminSecurityModule } from './components/AdminSecurityModule';
import AdminSanitizerModule from './components/AdminSanitizerModule';
import AdminSocialCRM from './components/AdminSocialCRM';
import AdminRankingsModule from './components/AdminRankingsModule';
import AdminLedgerAudit from './components/AdminLedgerAudit';
import AdminConsumablesHub from './components/AdminConsumablesHub';
import AdminClientDeployer from './components/AdminClientDeployer';

// Componentes con carga perezosa (Lazy loading)
const AdminMarketplaceModule = React.lazy(() => import('./components/AdminMarketplaceModule'));
const AdminPhantomStationModule = React.lazy(() => import('./components/AdminPhantomStationModule'));
const AdminAllianceCRM = React.lazy(() => import('./components/AdminAllianceCRM'));

export default function App() {
  const [nav, setNav] = useState<NavigationState>({
    activeMain: 'hud',
    activeSub: 'hud_main'
  });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const [menuDropdowns, setMenuDropdowns] = useState({
    rules: false,
    crm: false,
    matrix: false,
    skills: false
  });

  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(() => loadSupabaseConfig());
  const [showConfigModal, setShowConfigModal] = useState(false);

  // ESTADOS DE SEGURIDAD Y GUARDIA ADMINISTRATIVA
  const [authStatus, setAuthStatus] = useState<'checking' | 'unauthenticated' | 'access_denied' | 'authorized'>('checking');
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
  const [currentSession, setCurrentSession] = useState<SupabaseSession | null>(null);
  const [deniedEmail, setDeniedEmail] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [showChallengeModal, setShowChallengeModal] = useState<boolean>(false);

  // Referencia en memoria para el temporizador de 10 minutos (cero persistencia en storage)
  const lastVerifiedAtRef = React.useRef<number>(Date.now());
  const activeSessionRef = React.useRef<SupabaseSession | null>(null);

  // Mantener sincronizada la referencia activa de sesión
  useEffect(() => {
    activeSessionRef.current = currentSession;
  }, [currentSession]);

  const [brand, setBrand] = useState<BrandConfig>(DEFAULT_BRAND);
  const [components, setComponents] = useState<WebComponent[]>(DEFAULT_COMPONENTS);
  const [rules, setRules] = useState<GameRule[]>(DEFAULT_RULES);
  const [users, setUsers] = useState<UserProfile[]>(DEFAULT_USERS);
  const [gameHud, setGameHud] = useState<GalaxyDustConfig>(DEFAULT_GALAXY_DUST_HUD);
  const [loading, setLoading] = useState(true);

  // Guardia de Autenticación y Autorización
  const verifyAccessGuard = async (session: SupabaseSession | null) => {
    const user = session?.user || null;
    if (!user || !session) {
      setCurrentUser(null);
      setCurrentSession(null);
      setAuthStatus('unauthenticated');
      return;
    }

    const email = user.email?.trim().toLowerCase();
    const isEmailConfirmed = Boolean(user.email_confirmed_at);
    const isAllowedEmail = email === ALLOWED_ADMIN_EMAIL;

    if (!isAllowedEmail || !isEmailConfirmed) {
      console.warn(`[SECURITY ALERT] Acceso no autorizado denegado para: ${email}. Revocando sesión...`);
      setDeniedEmail(email || 'Usuario no identificado');
      setAuthStatus('access_denied');
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Error cerrando sesión no autorizada:', err);
      }
      return;
    }

    // Usuario legítimo autorizado
    setCurrentUser(user);
    setCurrentSession(session);
    lastVerifiedAtRef.current = Date.now();
    setAuthStatus('authorized');
  };

  useEffect(() => {
    let isMounted = true;

    // 0. CERO PERSISTENCIA: Limpieza estricta de cualquier clave residual de Supabase en storage
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-')) {
          localStorage.removeItem(key);
        }
      });
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('sb-') || key === 'last_verified_at') {
          sessionStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.error('Error limpiando storage residual:', e);
    }

    // 1. REGLA CRÍTICA: Anular enlaces mágicos, recuperaciones y tokens por URL
    const urlHash = window.location.hash || '';
    const urlSearch = window.location.search || '';
    const dangerousTokensPattern = /(access_token|refresh_token|type=recovery|type=magiclink|code=)/i;

    if (dangerousTokensPattern.test(urlHash) || dangerousTokensPattern.test(urlSearch)) {
      console.warn('[SECURITY] Token o enlace mágico detectado en URL. Anulando de inmediato...');
      // Limpiar URL sin recargar
      window.history.replaceState({}, document.title, window.location.pathname);

      supabase.auth.signOut().finally(() => {
        if (isMounted) {
          setDeniedEmail('Enlace mágico o token URL no autorizado.');
          setAuthStatus('access_denied');
        }
      });
      return;
    }

    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (isMounted) {
          await verifyAccessGuard(session || null);
        }
      } catch (err) {
        console.error('Error verificando sesión de Supabase:', err);
        if (isMounted) setAuthStatus('unauthenticated');
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (isMounted) {
        await verifyAccessGuard(session || null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // 2. REGLA CRÍTICA: Revocación inmediata al cerrar pestaña, navegador o salir (keepalive: true)
  useEffect(() => {
    const handleTerminateSessionOnExit = () => {
      const activeSession = activeSessionRef.current;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (activeSession?.access_token && supabaseUrl && anonKey) {
        // Enviar baliza HTTP con keepalive para garantizar que el servidor Supabase destruya el token
        try {
          fetch(`${supabaseUrl}/auth/v1/logout`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': anonKey,
              'Authorization': `Bearer ${activeSession.access_token}`
            },
            keepalive: true
          }).catch(() => {});
        } catch (e) {
          // ignore keepalive failures on window destruction
        }
      }

      try {
        supabase.auth.signOut();
      } catch (e) {}
    };

    window.addEventListener('pagehide', handleTerminateSessionOnExit);
    window.addEventListener('beforeunload', handleTerminateSessionOnExit);

    return () => {
      window.removeEventListener('pagehide', handleTerminateSessionOnExit);
      window.removeEventListener('beforeunload', handleTerminateSessionOnExit);
    };
  }, []);

  // 3. REGLA CRÍTICA: Máximo 1 persona conectada a la vez (Verificación en tiempo real y foco)
  useEffect(() => {
    if (authStatus !== 'authorized') return;

    let isTerminating = false;

    const checkActiveSessionValidity = async () => {
      if (isTerminating) return;
      try {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user || user.email?.trim().toLowerCase() !== ALLOWED_ADMIN_EMAIL) {
          isTerminating = true;
          console.warn('[SECURITY] Sesión invalidada en servidor o sesión iniciada en otro dispositivo.');
          await supabase.auth.signOut();
          setCurrentUser(null);
          setCurrentSession(null);
          setAuthNotice('Se ha detectado un inicio de sesión en otro dispositivo. Esta sesión ha sido cerrada por seguridad.');
          setAuthStatus('unauthenticated');
        }
      } catch (err) {
        isTerminating = true;
        console.error('[SECURITY] Error validando sesión única:', err);
        await supabase.auth.signOut();
        setCurrentUser(null);
        setCurrentSession(null);
        setAuthNotice('Se ha detectado un inicio de sesión en otro dispositivo. Esta sesión ha sido cerrada por seguridad.');
        setAuthStatus('unauthenticated');
      }
    };

    // A. Verificación periódica cada 15 segundos
    const sessionCheckInterval = setInterval(checkActiveSessionValidity, 15000);

    // B. Verificación al recuperar el foco o visibilidad
    const handleFocus = () => { checkActiveSessionValidity(); };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkActiveSessionValidity();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(sessionCheckInterval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [authStatus]);

  // 4. REGLA CRÍTICA: Temporizador de 10 minutos para SessionChallengeModal (600.000 ms continuos en RAM)
  useEffect(() => {
    if (authStatus !== 'authorized') return;

    const challengeCheckTimer = setInterval(() => {
      const elapsed = Date.now() - lastVerifiedAtRef.current;
      // 10 minutos = 600,000 ms
      if (elapsed >= 600000) {
        setShowChallengeModal(true);
      }
    }, 1000);

    return () => clearInterval(challengeCheckTimer);
  }, [authStatus]);

  const handleChallengeFail = async (reason: string) => {
    setShowChallengeModal(false);
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error(e);
    }
    setCurrentUser(null);
    setCurrentSession(null);
    setAuthNotice(reason);
    setAuthStatus('unauthenticated');
  };

  const handleChallengeSuccess = (newSession: any) => {
    setShowChallengeModal(false);
    lastVerifiedAtRef.current = Date.now();
    if (newSession?.user) {
      setCurrentUser(newSession.user);
      setCurrentSession(newSession);
    }
  };

  const [alert, setAlert] = useState<{ show: boolean; status: 'success' | 'error' | 'warning'; message: string }>({
    show: false,
    status: 'success',
    message: ''
  });

  const alertTrigger = (
    statusOrData: 'success' | 'error' | 'warning' | { show: boolean; status: 'success' | 'error' | 'warning'; message: string },
    message?: string
  ) => {
    if (typeof statusOrData === 'object') {
      setAlert(statusOrData);
      if (statusOrData.show) {
        setTimeout(() => setAlert(prev => ({ ...prev, show: false })), 4000);
      }
    } else {
      setAlert({ show: true, status: statusOrData, message: message || '' });
      setTimeout(() => setAlert(prev => ({ ...prev, show: false })), 4000);
    }
  };

  const fetchAllData = async () => {
    // Si no está autorizado formalmente o el challenge modal está activo, ninguna consulta se ejecuta
    if (authStatus !== 'authorized' || showChallengeModal) return;

    setLoading(true);
    try {
      const [brandRes, compRes, rulesRes, usersRes, hudRes] = await Promise.all([
        supabaseService.getBrand(DEFAULT_BRAND),
        supabaseService.getComponents(DEFAULT_COMPONENTS),
        supabaseService.getRules(DEFAULT_RULES),
        supabaseService.getUsers(DEFAULT_USERS),
        supabaseService.getGameHud(DEFAULT_GALAXY_DUST_HUD)
      ]);

      setBrand(brandRes.data);
      setComponents(compRes.data);
      setRules(rulesRes.data);
      setUsers(usersRes.data);
      setGameHud(hudRes.data);
    } catch (err: any) {
      console.error('Error al sincronizar datos principales:', err);
      alertTrigger('error', 'Error al consultar información de los servidores.');
    } finally {
      setLoading(false);
    }
  };

  const [utcTime, setUtcTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setUtcTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getNextResetString = () => {
    if (!gameHud?.serverSettings) return '';
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
    if (authStatus === 'authorized' && !showChallengeModal) {
      fetchAllData();
    }
  }, [authStatus, supabaseConfig, showChallengeModal]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '1') {
          e.preventDefault();
          navTo('hud', 'hud_main');
        } else if (e.key === '2') {
          e.preventDefault();
          navTo('rules', 'rules_list');
        } else if (e.key === '3') {
          e.preventDefault();
          navTo('crm', 'crm_users');
        } else if (e.key === '4') {
          e.preventDefault();
          navTo('matrix', 'matrix_overview');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleDropdown = (sec: 'rules' | 'crm' | 'matrix' | 'skills') => {
    setMenuDropdowns(prev => ({ ...prev, [sec]: !prev[sec] }));
  };

  const navTo = (main: NavigationState['activeMain'], sub: SubFunctionType) => {
    setNav({ activeMain: main, activeSub: sub });
    setIsMobileMenuOpen(false);
  };

  const handleSaveGameHud = async (updatedHud: GalaxyDustConfig) => {
    await supabaseService.saveGameHud(updatedHud);
    setGameHud(updatedHud);
    fetchAllData();
  };

  // 1. Pantalla de carga mientras se evalúa el estado criptográfico de la sesión
  if (authStatus === 'checking') {
    return (
      <div className="min-h-screen w-full bg-[#050506] flex flex-col items-center justify-center space-y-4 select-none font-sans">
        <div className="relative">
          <div className="w-12 h-12 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
          <Shield size={18} className="absolute inset-0 m-auto text-red-500 animate-pulse" />
        </div>
        <div className="text-center space-y-1">
          <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-widest block">
            Verificando Guardia de Acceso...
          </span>
          <span className="text-[10px] font-mono text-zinc-550 block">
            Validando sesión y listas de control de acceso (ACL)
          </span>
        </div>
      </div>
    );
  }

  // 2. Pantalla de Acceso Denegado estricto si el usuario autenticado no está en lista blanca
  if (authStatus === 'access_denied') {
    return (
      <AccessDenied
        attemptedEmail={deniedEmail}
        onReset={() => {
          setDeniedEmail(null);
          setAuthStatus('unauthenticated');
        }}
      />
    );
  }

  // 3. Pantalla de Login si no hay sesión activa en Supabase Auth
  if (authStatus === 'unauthenticated' || !currentUser) {
    return (
      <AdminLogin
        authError={authNotice}
        onLoginSuccess={() => {
          setAuthNotice(null);
        }}
      />
    );
  }

  // 4. Renderizado EXCLUSIVO para superadministrador autorizado
  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#050506] font-sans antialiased text-zinc-300 overflow-hidden">

      {/* BARRA SUPERIOR MÓVIL */}
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-950 border-b border-zinc-900 md:hidden select-none shrink-0">
        <span className="font-bold text-xs tracking-wider text-red-500 uppercase">GALAXYDUST OS v2.8</span>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 bg-zinc-900 rounded text-zinc-300 hover:bg-zinc-800 transition-colors"
          aria-label="Abrir menú"
        >
          {isMobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* MENÚ LATERAL (SIDEBAR) */}
      <aside className={`
        fixed inset-y-0 left-0 z-50
        w-64 flex-shrink-0 bg-zinc-950 border-r border-zinc-900 flex flex-col justify-between select-none
        transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0
      `}>
        <div className="flex flex-col space-y-4 p-4 flex-1 overflow-y-auto min-h-0 custom-scrollbar">

          {/* Logo / Encabezado */}
          <div className="pb-4 border-b border-zinc-900">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 bg-red-650 rounded flex items-center justify-center text-white font-bold text-[10px] tracking-wide ring-2 ring-red-500/15 shrink-0">
                <span>GD</span>
              </div>
              <div className="min-w-0">
                <span className="text-white font-bold text-xs tracking-tight font-display uppercase block truncate">
                  GALAXYDUST CORE
                </span>
                <span className="text-[8px] px-1 py-0.2 bg-zinc-900 border border-zinc-800 text-red-500 font-mono rounded font-bold uppercase tracking-widest leading-none inline-block">
                  Enterprise Admin
                </span>
              </div>
            </div>
          </div>

          {/* Conexión Base de Datos */}
          <div
            onClick={() => setShowConfigModal(true)}
            className="p-2.5 bg-zinc-900/30 hover:bg-zinc-900/60 border border-zinc-900 hover:border-zinc-800 rounded transition-all flex items-center justify-between cursor-pointer group"
          >
            <div className="flex items-center gap-2 min-w-0">
              {supabaseConfig.isConnected ? (
                <Wifi size={12} className="text-emerald-500 animate-pulse shrink-0" />
              ) : (
                <WifiOff size={12} className="text-zinc-650 shrink-0" />
              )}
              <div className="min-w-0">
                <span className="text-[9px] font-bold text-zinc-400 block tracking-wider uppercase">
                  {supabaseConfig.isConnected ? 'Sincronizado' : 'Sin Conexión DB'}
                </span>
                <span className="text-[8px] text-zinc-550 block truncate font-mono">
                  {supabaseConfig.isConnected ? supabaseConfig.url.replace('https://', '') : 'Desconectado'}
                </span>
              </div>
            </div>
            <Settings size={12} className="text-zinc-600 group-hover:text-zinc-300 transition-colors shrink-0" />
          </div>

          {/* Navegación Principal */}
          <nav className="space-y-3 pt-1">
            <div className="space-y-1">
              <span className="text-[9px] font-bold tracking-widest text-zinc-500 font-mono uppercase block px-1 mb-1.5">
                Núcleo del Sistema
              </span>

              {/* HUD Y ECONOMÍA GLOBAL */}
              <button
                onClick={() => navTo('hud', 'hud_main')}
                className={`w-full py-1.5 px-2 rounded flex items-center text-xs font-medium tracking-wide transition-all cursor-pointer ${
                  nav.activeMain === 'hud' ? 'bg-zinc-900 text-red-500 font-semibold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/20'
                }`}
              >
                <Monitor size={13} className="shrink-0 mr-2 text-red-500" />
                <span>HUD & Parámetros Globales</span>
              </button>

              {/* MATRIZ MAESTRA DE ACTIVOS (ComponentMatrix) */}
              <button
                onClick={() => navTo('matrix', 'matrix_overview')}
                className={`w-full py-1.5 px-2 rounded flex items-center text-xs font-medium tracking-wide transition-all cursor-pointer ${
                  nav.activeMain === 'matrix' ? 'bg-zinc-900 text-red-500 font-semibold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/20'
                }`}
              >
                <LayoutGrid size={13} className="shrink-0 mr-2 text-red-500" />
                <span>Catálogo Maestro de Assets</span>
              </button>

              {/* ESTACIÓN C.A.N. */}
              <button
                onClick={() => navTo('can', 'can_global')}
                className={`w-full py-1.5 px-2 rounded flex items-center text-xs font-medium tracking-wide transition-all cursor-pointer ${
                  nav.activeMain === 'can' ? 'bg-zinc-900 text-red-500 font-semibold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/20'
                }`}
              >
                <Database size={13} className="shrink-0 mr-2 text-red-500" />
                <span>Estación C.A.N.</span>
              </button>

              {/* GESTOR DE SKILLS */}
              <button
                onClick={() => navTo('skills', 'skills_overview')}
                className={`w-full py-1.5 px-2 rounded flex items-center text-xs font-medium tracking-wide transition-all cursor-pointer ${
                  nav.activeMain === 'skills' ? 'bg-zinc-900 text-cyan-500 font-semibold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/20'
                }`}
              >
                <Cpu size={13} className="shrink-0 mr-2 text-cyan-500" />
                <span>Gestor de Skills</span>
              </button>

              {/* EXPEDICIONES Y GALAXIAS */}
              <button
                onClick={() => navTo('expediciones', 'expediciones_main')}
                className={`w-full py-1.5 px-2 rounded flex items-center text-xs font-medium tracking-wide transition-all cursor-pointer ${
                  nav.activeMain === 'expediciones' ? 'bg-zinc-900 text-red-500 font-semibold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/20'
                }`}
              >
                <Orbit size={13} className="shrink-0 mr-2 text-red-500" />
                <span>Expediciones & Mapeo</span>
              </button>

              {/* REGLAS DEL JUEGO Y ACTUALIZACIÓN OTA */}
              <button
                onClick={() => navTo('rules', 'rules_list')}
                className={`w-full py-1.5 px-2 rounded flex items-center text-xs font-medium tracking-wide transition-all cursor-pointer ${
                  nav.activeMain === 'rules' ? 'bg-zinc-900 text-red-500 font-semibold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/20'
                }`}
              >
                <Cpu size={13} className="shrink-0 mr-2" />
                <span>Reglas & Control OTA</span>
              </button>

              {/* GESTOR CRM DE PILOTOS */}
              <button
                onClick={() => navTo('crm', 'crm_users')}
                className={`w-full py-1.5 px-2 rounded flex items-center text-xs font-medium tracking-wide transition-all cursor-pointer ${
                  nav.activeMain === 'crm' ? 'bg-zinc-900 text-red-500 font-semibold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/20'
                }`}
              >
                <Users size={13} className="shrink-0 mr-2" />
                <span>CRM de Comandantes</span>
              </button>

              {/* SECCIÓN OPERACIONES Y LIVEOPS */}
              <div className="space-y-1 pt-2 border-t border-zinc-900">
                <span className="text-[9px] font-bold tracking-widest text-zinc-500 font-mono uppercase block px-1 mb-1.5">
                  Operaciones & LiveOps
                </span>

                {/* AUDITORÍA ECONÓMICA DE BÓVEDAS (LEDGER) */}
                <button
                  onClick={() => navTo('ledger_audit', 'ledger_main')}
                  className={`w-full py-1.5 px-2 rounded flex items-center text-xs font-medium tracking-wide transition-all cursor-pointer ${
                    nav.activeMain === 'ledger_audit' ? 'bg-zinc-900 text-amber-400 font-semibold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/20'
                  }`}
                >
                  <Coins size={13} className="shrink-0 mr-2 text-amber-400" />
                  <span>Auditoría de Bóvedas</span>
                </button>

                {/* HUB DE CONSUMIBLES & PACKS */}
                <button
                  onClick={() => navTo('consumables_hub', 'consumables_main')}
                  className={`w-full py-1.5 px-2 rounded flex items-center text-xs font-medium tracking-wide transition-all cursor-pointer ${
                    nav.activeMain === 'consumables_hub' ? 'bg-zinc-900 text-cyan-400 font-semibold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/20'
                  }`}
                >
                  <Package size={13} className="shrink-0 mr-2 text-cyan-400" />
                  <span>Consumibles & Packs</span>
                </button>

                {/* CONTROL DE CLIENTES & DEPLOY OTA */}
                <button
                  onClick={() => navTo('client_deployer', 'deployer_main')}
                  className={`w-full py-1.5 px-2 rounded flex items-center text-xs font-medium tracking-wide transition-all cursor-pointer ${
                    nav.activeMain === 'client_deployer' ? 'bg-zinc-900 text-cyan-400 font-semibold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/20'
                  }`}
                >
                  <Globe size={13} className="shrink-0 mr-2 text-cyan-400" />
                  <span>Despliegue & OTA</span>
                </button>

                {/* CRM SOCIAL */}
                <button
                  onClick={() => navTo('social_crm', 'social_main')}
                  className={`w-full py-1.5 px-2 rounded flex items-center text-xs font-medium tracking-wide transition-all cursor-pointer ${
                    nav.activeMain === 'social_crm' ? 'bg-zinc-900 text-red-500 font-semibold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/20'
                  }`}
                >
                  <Users size={13} className="shrink-0 mr-2 text-red-500" />
                  <span>CRM Social & DMs</span>
                </button>

                {/* MARKETPLACE P2P */}
                <button
                  onClick={() => navTo('market', 'market_items')}
                  className={`w-full py-1.5 px-2 rounded flex items-center text-xs font-medium tracking-wide transition-all cursor-pointer ${
                    nav.activeMain === 'market' ? 'bg-zinc-900 text-red-500 font-semibold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/20'
                  }`}
                >
                  <LayoutGrid size={13} className="shrink-0 mr-2 text-red-500" />
                  <span>P2P Marketplace</span>
                </button>

                {/* RANKINGS Y HALL OF FAME */}
                <button
                  onClick={() => navTo('rankings', 'rankings_main')}
                  className={`w-full py-1.5 px-2 rounded flex items-center text-xs font-medium tracking-wide transition-all cursor-pointer ${
                    nav.activeMain === 'rankings' ? 'bg-zinc-900 text-red-500 font-semibold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/20'
                  }`}
                >
                  <Trophy size={13} className="shrink-0 mr-2 text-red-500" />
                  <span>Rankings & Premios</span>
                </button>

                {/* PHANTOM STATION */}
                <button
                  onClick={() => navTo('phantom_station', 'store_manager')}
                  className={`w-full py-1.5 px-2 rounded flex items-center text-xs font-medium tracking-wide transition-all cursor-pointer ${
                    nav.activeMain === 'phantom_station' ? 'bg-zinc-900 text-red-500 font-semibold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/20'
                  }`}
                >
                  <Ghost size={13} className="shrink-0 mr-2 text-red-500" />
                  <span>Phantom Station</span>
                </button>

                {/* CÓDIGOS PROMOCIONALES */}
                <button
                  onClick={() => navTo('promo', 'promo_main')}
                  className={`w-full py-1.5 px-2 rounded flex items-center text-xs font-medium tracking-wide transition-all cursor-pointer ${
                    nav.activeMain === 'promo' ? 'bg-zinc-900 text-red-500 font-semibold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/20'
                  }`}
                >
                  <Gift size={13} className="shrink-0 mr-2 text-red-500" />
                  <span>Promociones & Broadcast</span>
                </button>

                {/* GREMIOS Y ALIANZAS */}
                <button
                  onClick={() => navTo('alliance', 'alliance_main')}
                  className={`w-full py-1.5 px-2 rounded flex items-center text-xs font-medium tracking-wide transition-all cursor-pointer ${
                    nav.activeMain === 'alliance' ? 'bg-zinc-900 text-red-500 font-semibold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/20'
                  }`}
                >
                  <Shield size={13} className="shrink-0 mr-2 text-red-500" />
                  <span>Alliance CRM</span>
                </button>

                {/* SEGURIDAD Y ANTI-CHEAT */}
                <button
                  onClick={() => navTo('security', 'anticheat')}
                  className={`w-full py-1.5 px-2 rounded flex items-center text-xs font-medium tracking-wide transition-all cursor-pointer ${
                    nav.activeMain === 'security' ? 'bg-zinc-900 text-red-500 font-semibold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/20'
                  }`}
                >
                  <ShieldAlert size={13} className="shrink-0 mr-2 text-red-500" />
                  <span>Radar Anti-Cheat</span>
                </button>

                {/* SANITIZADOR DE DATOS */}
                <button
                  onClick={() => navTo('sanitizer', 'sanitizer_main')}
                  className={`w-full py-1.5 px-2 rounded flex items-center text-xs font-medium tracking-wide transition-all cursor-pointer ${
                    nav.activeMain === 'sanitizer' ? 'bg-zinc-900 text-red-500 font-semibold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/20'
                  }`}
                >
                  <Radio size={13} className="shrink-0 mr-2 text-red-500" />
                  <span>Data Sanitizer</span>
                </button>
              </div>
            </div>
          </nav>
        </div>

        {/* PIE DE PÁGINA DEL MENÚ */}
        <div className="p-4 border-t border-zinc-900 bg-zinc-950/60">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded bg-zinc-900 border border-zinc-850 flex items-center justify-center font-extrabold text-xs text-red-500 shrink-0">
                {currentUser?.email ? currentUser.email.substring(0, 2).toUpperCase() : 'AD'}
              </div>
              <div className="min-w-0 flex flex-col">
                <span className="text-[10.5px] font-semibold text-white truncate">
                  {currentUser?.email || 'Administrador'}
                </span>
                <span className="text-[8.5px] text-zinc-550 font-mono">Super Administrator</span>
              </div>
            </div>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                setAuthStatus('unauthenticated');
              }}
              className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-900 rounded transition-colors shrink-0 cursor-pointer"
              title="Cerrar Sesión Segura"
            >
              <LogOut size={13} />
            </button>
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

      {/* ÁREA DE CONTENIDO PRINCIPAL */}
      <main className="flex-1 w-full flex flex-col min-w-0 overflow-hidden bg-[#050506]">
        {/* Cabecera Superior */}
        <header className="h-14 border-b border-zinc-900 flex-shrink-0 px-4 md:px-6 flex items-center justify-between select-none bg-zinc-950/40 backdrop-blur-md">
          <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-medium uppercase tracking-wide min-w-0">
            <span className="hidden sm:inline">GALAXYDUST OS</span>
            <ChevronRight size={11} className="text-zinc-800 shrink-0 hidden sm:block" />
            <span className="text-zinc-300 font-semibold truncate">
              {nav.activeMain === 'hud' ? 'HUD & Parámetros Globales'
                : nav.activeMain === 'rules' ? 'Reglas de Juego & Control OTA'
                : nav.activeMain === 'crm' ? 'CRM de Comandantes'
                : nav.activeMain === 'can' ? 'Calibrador C.A.N.'
                : nav.activeMain === 'matrix' ? 'Catálogo Maestro de Assets'
                : nav.activeMain === 'skills' ? 'Gestor de Skills'
                : nav.activeMain === 'expediciones' ? 'Expediciones & Mapeo'
                : nav.activeMain === 'market' ? 'P2P Marketplace'
                : nav.activeMain === 'phantom_station' ? 'Phantom Station'
                : nav.activeMain === 'promo' ? 'Promociones & Broadcast'
                : nav.activeMain === 'alliance' ? 'Alliance CRM'
                : nav.activeMain === 'security' ? 'Radar Anti-Cheat'
                : nav.activeMain === 'social_crm' ? 'CRM Social & DMs'
                : nav.activeMain === 'rankings' ? 'Rankings & Premios'
                : nav.activeMain === 'ledger_audit' ? 'Auditoría Forense de Bóvedas'
                : nav.activeMain === 'consumables_hub' ? 'Consumibles & Packs'
                : nav.activeMain === 'client_deployer' ? 'Despliegue de Clientes & OTA'
                : 'Data Sanitizer'}
            </span>
          </div>

          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            {gameHud?.serverSettings && (
              <div className="hidden lg:flex items-center gap-3 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg shadow-inner">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-red-500" />
                  <span className="text-zinc-300 font-mono text-xs font-bold">
                    {utcTime.toISOString().split('T')[1].substring(0, 8)} <span className="text-zinc-550">UTC</span>
                  </span>
                </div>
                <div className="w-[1px] h-4 bg-zinc-700"></div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-zinc-550 font-bold uppercase">Reset:</span>
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
              className="py-1 px-2.5 font-mono text-[10px] font-bold border border-zinc-800 text-zinc-350 rounded hover:text-white bg-zinc-950 transition-all flex items-center gap-1.5 cursor-pointer hover:bg-zinc-900"
            >
              <Database size={11} className="text-red-500" />
              {supabaseConfig.isConnected ? 'CONNECTED' : 'CONNECT DB'}
            </button>
          </div>
        </header>

        {/* Vista Activa */}
        <div className="flex-1 overflow-y-auto p-3 md:p-6 custom-scrollbar">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-3">
              <div className="h-8 w-8 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
              <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Sincronizando información...</span>
            </div>
          ) : (
            <React.Suspense fallback={
              <div className="flex flex-col items-center justify-center h-full space-y-3">
                <div className="w-8 h-8 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin"></div>
                <span className="text-xs font-mono text-zinc-500 tracking-widest animate-pulse">CARGANDO MÓDULO...</span>
              </div>
            }>
              {/* 1. HUD & PARÁMETROS GLOBALES */}
              {nav.activeMain === 'hud' && (
                <GalaxyDustHUD
                  config={gameHud}
                  onUpdateConfig={handleSaveGameHud}
                  setIsAlertToShow={alertTrigger}
                />
              )}

              {/* 2. REGLAS DE JUEGO Y CONTROL OTA */}
              {nav.activeMain === 'rules' && (
                <ConditionEditor
                  users={users}
                  setIsAlertToShow={alertTrigger}
                />
              )}

              {/* 3. CRM DE COMANDANTES */}
              {nav.activeMain === 'crm' && (
                <UserCRM />
              )}

              {/* 4. CALIBRADOR C.A.N. */}
              {nav.activeMain === 'can' && (
                <CANManager />
              )}

              {/* 5. CATÁLOGO MAESTRO DE ASSETS (ComponentMatrix) */}
              {nav.activeMain === 'matrix' && (
                <ComponentMatrix />
              )}

              {/* 6. GESTOR DE SKILLS */}
              {nav.activeMain === 'skills' && (
                <SkillManager />
              )}

              {/* 7. EXPEDICIONES Y GALAXIAS */}
              {nav.activeMain === 'expediciones' && (
                <ExpeditionsManager />
              )}

              {/* 8. P2P MARKETPLACE */}
              {nav.activeMain === 'market' && (
                <AdminMarketplaceModule
                  users={users}
                  setIsAlertToShow={alertTrigger}
                  onRefreshData={fetchAllData}
                  activeSubTab={nav.activeSub}
                />
              )}

              {/* 9. PHANTOM STATION */}
              {nav.activeMain === 'phantom_station' && (
                <AdminPhantomStationModule
                  gameHud={gameHud}
                  users={users}
                  onSaveGameHud={handleSaveGameHud}
                  setIsAlertToShow={(alertObj) => alertTrigger(alertObj)}
                />
              )}

              {/* 10. PROMOCIONES & BROADCAST */}
              {nav.activeMain === 'promo' && (
                <AdminPromoModule />
              )}

              {/* 11. ALLIANCE CRM */}
              {nav.activeMain === 'alliance' && (
                <AdminAllianceCRM />
              )}

              {/* 12. RADAR ANTI-CHEAT */}
              {nav.activeMain === 'security' && (
                <AdminSecurityModule />
              )}

              {/* 13. DATA SANITIZER */}
              {nav.activeMain === 'sanitizer' && (
                <AdminSanitizerModule
                  gameHud={gameHud}
                  saveGameHud={handleSaveGameHud}
                  alertTrigger={(status, message) => alertTrigger(status, message)}
                />
              )}

              {/* 14. CRM SOCIAL & DMS */}
              {nav.activeMain === 'social_crm' && (
                <AdminSocialCRM
                  users={users}
                />
              )}

              {/* 15. RANKINGS & PREMIOS */}
              {nav.activeMain === 'rankings' && (
                <AdminRankingsModule
                  users={users}
                  setIsAlertToShow={(alertObj) => alertTrigger(alertObj.status, alertObj.message)}
                />
              )}

              {/* 16. AUDITORÍA FORENSE DE BÓVEDAS (LEDGER) */}
              {nav.activeMain === 'ledger_audit' && (
                <AdminLedgerAudit setIsAlertToShow={alertTrigger} />
              )}

              {/* 17. HUB DE CONSUMIBLES & PACKS */}
              {nav.activeMain === 'consumables_hub' && (
                <AdminConsumablesHub setIsAlertToShow={alertTrigger} />
              )}

              {/* 18. CENTRO DE DESPLIEGUE DE CLIENTES & OTA */}
              {nav.activeMain === 'client_deployer' && (
                <AdminClientDeployer setIsAlertToShow={alertTrigger} />
              )}
            </React.Suspense>
          )}
        </div>
      </main>

      {/* MODAL CONFIGURACIÓN SUPABASE */}
      <AnimatePresence>
        {showConfigModal && (
          <SupabaseConfigModal
            onConfigChanged={(updatedConfig) => setSupabaseConfig(updatedConfig)}
            onClose={() => setShowConfigModal(false)}
          />
        )}
      </AnimatePresence>

      {/* POP-UP DE VERIFICACIÓN DE CLAVE CADA 10 MINUTOS (60s / 1 INTENTO) */}
      {showChallengeModal && (
        <SessionChallengeModal
          onSuccess={handleChallengeSuccess}
          onFail={handleChallengeFail}
        />
      )}

      {/* BANNER FLOTANTE DE NOTIFICACIONES */}
      <AnimatePresence>
        {alert.show && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-3 right-3 sm:bottom-6 sm:right-6 z-50 p-4 border rounded-xl flex items-start gap-3 shadow-2xl backdrop-blur-md max-w-[90vw] sm:max-w-sm ${
              alert.status === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-400'
                : alert.status === 'warning'
                ? 'bg-amber-950/80 border-amber-500/30 text-amber-500'
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
                {alert.status === 'success' ? 'Operación Exitosa' : alert.status === 'warning' ? 'Advertencia' : 'Error'}
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