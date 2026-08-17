import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cpu, Sliders, Users, Box, Layers, Zap, Compass, ShoppingBag,
  Ghost, Gift, Shield, ShieldAlert, RefreshCw, ChevronDown, ChevronRight,
  Radio, Database, Navigation
} from 'lucide-react';

// IMPORTACIÓN DE TODOS LOS MÓDULOS DEL BACKOFFICE
import { CANManager } from './CANManager';
import ConditionEditor from './ConditionEditor';
import { UserCRM } from './UserCRM';
import AdminShipsModule from './AdminShipsModule';
import AdminAssetMatrixModule from './AdminAssetMatrixModule';
import { ComponentMatrix } from './ComponentMatrix';
import { SkillManager } from './SkillManager';
import ExpeditionsManager from './ExpeditionsManager';
import AdminMarketplaceModule from './AdminMarketplaceModule';
import AdminPhantomStationModule from './AdminPhantomStationModule';
import AdminPromoModule from './AdminPromoModule';
import AdminAllianceCRM from './AdminAllianceCRM';
import AdminSecurityModule from './AdminSecurityModule';
import AdminSanitizerModule from './AdminSanitizerModule';
import AdminSocialCRM from './AdminSocialCRM';

interface GalaxyDustHUDProps {
  gameHud?: any;
  users?: any[];
  onSaveGameHud?: (hud: any) => void;
  setIsAlertToShow?: (alert: { show: boolean; status: 'success' | 'error' | 'warning'; message: string }) => void;
}

export const GalaxyDustHUD: React.FC<GalaxyDustHUDProps> = ({
  gameHud = {} as any,
  users = [],
  onSaveGameHud = () => { },
  setIsAlertToShow = (_alert) => { }
}) => {
  // Estado de la pestaña activa en la navegación
  const [activeTab, setActiveTab] = useState<string>('assets_matrix');
  // Estado desplegable del menú "Gestor de Assets e Inventario"
  const [isAssetsDropdownOpen, setIsAssetsDropdownOpen] = useState<boolean>(true);

  const alertTrigger = (status: 'success' | 'error' | 'warning', message: string) => {
    setIsAlertToShow({ show: true, status, message });
  };

  return (
    <div className="flex h-screen bg-[#050507] text-white font-mono select-none overflow-hidden text-xs">

      {/* ========================================================= */}
      {/* 🛠️ BARRA LATERAL (SIDEBAR DE SASORI CORE V2.8)            */}
      {/* ========================================================= */}
      <aside className="w-64 bg-zinc-950 border-r border-zinc-900 flex flex-col justify-between shrink-0 font-mono">

        <div className="p-4 border-b border-zinc-900 space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-sm tracking-wider text-white flex items-center gap-1.5 font-sans">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
              SASORI CORE V2.8
            </span>
            <span className="text-[8px] bg-red-950 text-red-500 border border-red-900 px-1.5 py-0.5 rounded font-bold">
              ENTERPRISE OS
            </span>
          </div>
          <p className="text-[9.5px] text-zinc-500 font-sans">Sistema de Administración Holística</p>
        </div>

        {/* NAVEGACIÓN Y CATEGORÍAS DE MENÚ */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">

          {/* GRUPO 1: DESARROLLO */}
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest px-2 block">
              DESARROLLO
            </span>

            {/* C.A.N (Mantenimiento) */}
            <button
              onClick={() => setActiveTab('can_manager')}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer ${activeTab === 'can_manager' ? 'bg-red-950/40 text-red-400 border border-red-900/50 font-bold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
                }`}
            >
              <span className="flex items-center gap-2"><Cpu size={14} className="text-red-500" /> C.A.N. (Mantenimiento)</span>
            </button>

            {/* Condiciones y Reglas */}
            <button
              onClick={() => setActiveTab('game_rules')}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer ${activeTab === 'game_rules' ? 'bg-red-950/40 text-red-400 border border-red-900/50 font-bold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
                }`}
            >
              <span className="flex items-center gap-2"><Sliders size={14} className="text-red-500" /> Condiciones y Reglas</span>
            </button>

            {/* Gestor CRM */}
            <button
              onClick={() => setActiveTab('user_crm')}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer ${activeTab === 'user_crm' ? 'bg-red-950/40 text-red-400 border border-red-900/50 font-bold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
                }`}
            >
              <span className="flex items-center gap-2"><Users size={14} className="text-red-500" /> Gestor CRM</span>
            </button>

            {/* GESTOR DE ASSETS E INVENTARIO (DESPLEGABLE) */}
            <div className="space-y-1">
              <button
                onClick={() => setIsAssetsDropdownOpen(!isAssetsDropdownOpen)}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer ${activeTab === 'control_console' || activeTab === 'assets_matrix' ? 'text-red-400 font-bold' : 'text-zinc-400 hover:text-white'
                  }`}
              >
                <span className="flex items-center gap-2"><Box size={14} className="text-red-500" /> Gestor de Assets e Inventario</span>
                {isAssetsDropdownOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </button>

              {/* SUB-MENÚ DESPLEGADO */}
              {isAssetsDropdownOpen && (
                <div className="pl-6 space-y-1 border-l border-zinc-900 ml-3">
                  <button
                    onClick={() => setActiveTab('control_console')}
                    className={`w-full text-left py-1.5 px-2 rounded text-[10.5px] cursor-pointer transition-colors ${activeTab === 'control_console' ? 'text-red-500 font-bold bg-red-950/20' : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                  >
                    • Consola de Control
                  </button>
                  <button
                    onClick={() => setActiveTab('assets_matrix')}
                    className={`w-full text-left py-1.5 px-2 rounded text-[10.5px] cursor-pointer transition-colors ${activeTab === 'assets_matrix' ? 'text-red-500 font-bold bg-red-950/20' : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                  >
                    • Matriz de Crafteo y Componentes
                  </button>
                </div>
              )}
            </div>

            {/* Gestor de Skills */}
            <button
              onClick={() => setActiveTab('skill_manager')}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer ${activeTab === 'skill_manager' ? 'bg-red-950/40 text-red-400 border border-red-900/50 font-bold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
                }`}
            >
              <span className="flex items-center gap-2"><Zap size={14} className="text-red-500" /> Gestor de Skills</span>
            </button>

            {/* Expediciones */}
            <button
              onClick={() => setActiveTab('expeditions')}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer ${activeTab === 'expeditions' ? 'bg-red-950/40 text-red-400 border border-red-900/50 font-bold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
                }`}
            >
              <span className="flex items-center gap-2"><Compass size={14} className="text-red-500" /> Expediciones</span>
            </button>
          </div>

          {/* GRUPO 2: OPERACIONES & LIVEOPS */}
          <div className="space-y-1 pt-2 border-t border-zinc-900">
            <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest px-2 block">
              OPERACIONES & LIVEOPS
            </span>

            {/* CRM Social */}
            <button
              onClick={() => setActiveTab('social_crm')}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer ${activeTab === 'social_crm' ? 'bg-red-950/40 text-red-400 border border-red-900/50 font-bold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
                }`}
            >
              <span className="flex items-center gap-2"><Users size={14} className="text-red-500" /> CRM Social (Beta)</span>
            </button>

            {/* P2P Marketplace */}
            <button
              onClick={() => setActiveTab('marketplace')}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer ${activeTab === 'marketplace' ? 'bg-red-950/40 text-red-400 border border-red-900/50 font-bold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
                }`}
            >
              <span className="flex items-center gap-2"><ShoppingBag size={14} className="text-red-500" /> P2P Marketplace</span>
            </button>

            {/* Phantom Station */}
            <button
              onClick={() => setActiveTab('phantom_station')}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer ${activeTab === 'phantom_station' ? 'bg-red-950/40 text-red-400 border border-red-900/50 font-bold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
                }`}
            >
              <span className="flex items-center gap-2"><Ghost size={14} className="text-red-500" /> Phantom Station</span>
            </button>

            {/* Promociones P2P */}
            <button
              onClick={() => setActiveTab('promotions')}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer ${activeTab === 'promotions' ? 'bg-red-950/40 text-red-400 border border-red-900/50 font-bold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
                }`}
            >
              <span className="flex items-center gap-2"><Gift size={14} className="text-red-500" /> Promociones P2P</span>
            </button>

            {/* Alliance CRM */}
            <button
              onClick={() => setActiveTab('alliance_crm')}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer ${activeTab === 'alliance_crm' ? 'bg-red-950/40 text-red-400 border border-red-900/50 font-bold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
                }`}
            >
              <span className="flex items-center gap-2"><Shield size={14} className="text-red-500" /> Alliance CRM</span>
            </button>

            {/* Radar Anti-Cheat */}
            <button
              onClick={() => setActiveTab('anticheat')}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer ${activeTab === 'anticheat' ? 'bg-red-950/40 text-red-400 border border-red-900/50 font-bold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
                }`}
            >
              <span className="flex items-center gap-2"><ShieldAlert size={14} className="text-red-500" /> Radar Anti-Cheat</span>
            </button>

            {/* Data Sanitizer */}
            <button
              onClick={() => setActiveTab('sanitizer')}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer ${activeTab === 'sanitizer' ? 'bg-red-950/40 text-red-400 border border-red-900/50 font-bold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
                }`}
            >
              <span className="flex items-center gap-2"><RefreshCw size={14} className="text-red-500" /> Data Sanitizer Sci-Fi</span>
            </button>
          </div>

        </div>

        {/* PIE DE PÁGINA DEL USUARIO / ADMIN */}
        <div className="p-3 border-t border-zinc-900 bg-zinc-950/80 flex items-center gap-2.5">
          <div className="h-7 w-7 rounded bg-red-950 border border-red-900 flex items-center justify-center font-bold text-red-500 font-mono text-xs">
            AD
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-white font-bold block truncate text-[11px] font-sans">amijares@sasorilabs.io</span>
            <span className="text-zinc-500 text-[9px] block">Super Administrador</span>
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* 💻 ÁREA DE CONTENIDO PRINCIPAL (RENDERIZADO DINÁMICO)     */}
      {/* ========================================================= */}
      <main className="flex-1 bg-[#050507] overflow-y-auto relative">
        <AnimatePresence mode="wait">

          {/* C.A.N. MANAGER */}
          {activeTab === 'can_manager' && (
            <motion.div key="can" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
              <CANManager />
            </motion.div>
          )}

          {/* CONDICIONES Y REGLAS */}
          {activeTab === 'game_rules' && (
            <motion.div key="rules" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
              <ConditionEditor users={users} setIsAlertToShow={setIsAlertToShow} />
            </motion.div>
          )}

          {/* GESTOR CRM */}
          {activeTab === 'user_crm' && (
            <motion.div key="crm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
              <UserCRM />
            </motion.div>
          )}

          {/* CONSOLA DE CONTROL (ComponentMatrix) */}
          {activeTab === 'control_console' && (
            <motion.div key="console" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
              <ComponentMatrix users={users} setIsAlertToShow={setIsAlertToShow} onRefreshData={onSaveGameHud} />
            </motion.div>
          )}

          {/* MATRIZ DE CRAFTEO Y COMPONENTES (AdminAssetMatrixModule) */}
          {activeTab === 'assets_matrix' && (
            <motion.div key="matrix" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
              <AdminAssetMatrixModule users={users} setIsAlertToShow={setIsAlertToShow} onRefreshData={onSaveGameHud} />
            </motion.div>
          )}

          {/* GESTOR DE SKILLS */}
          {activeTab === 'skill_manager' && (
            <motion.div key="skills" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
              <SkillManager />
            </motion.div>
          )}

          {/* EXPEDICIONES */}
          {activeTab === 'expeditions' && (
            <motion.div key="expeditions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full p-6">
              <ExpeditionsManager />
            </motion.div>
          )}

          {/* P2P MARKETPLACE */}
          {activeTab === 'marketplace' && (
            <motion.div key="market" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full p-6">
              <AdminMarketplaceModule users={users} setIsAlertToShow={setIsAlertToShow} activeSubTab="market" />
            </motion.div>
          )}

          {/* PHANTOM STATION */}
          {activeTab === 'phantom_station' && (
            <motion.div key="phantom" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full p-6">
              <AdminPhantomStationModule gameHud={gameHud} users={users} onSaveGameHud={onSaveGameHud} setIsAlertToShow={(alertObj) => alertTrigger(alertObj.status, alertObj.message)} />
            </motion.div>
          )}

          {/* PROMOCIONES P2P */}
          {activeTab === 'promotions' && (
            <motion.div key="promo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full p-6">
              <AdminPromoModule setIsAlertToShow={setIsAlertToShow} />
            </motion.div>
          )}

          {/* ALLIANCE CRM */}
          {activeTab === 'alliance_crm' && (
            <motion.div key="alliance" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full p-6">
              <AdminAllianceCRM />
            </motion.div>
          )}

          {/* RADAR ANTI-CHEAT */}
          {activeTab === 'anticheat' && (
            <motion.div key="anticheat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full p-6">
              <AdminSecurityModule />
            </motion.div>
          )}

          {/* DATA SANITIZER */}
          {activeTab === 'sanitizer' && (
            <motion.div key="sanitizer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full p-6">
              <AdminSanitizerModule gameHud={gameHud} saveGameHud={onSaveGameHud} alertTrigger={(status, message) => alertTrigger(status, message)} />
            </motion.div>
          )}

          {/* SOCIAL CRM */}
          {activeTab === 'social_crm' && (
            <motion.div key="social" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
              <AdminSocialCRM users={users} />
            </motion.div>
          )}

        </AnimatePresence>
      </main>

    </div>
  );
};

export default GalaxyDustHUD;