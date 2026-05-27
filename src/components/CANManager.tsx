import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Search, ShieldAlert, Award, Database, Coins, ShieldCheck, 
  Trash2, Plus, Edit, X, Save, Volume2, Shield, Sparkles, TrendingUp, BarChart2,
  GitBranch, HelpCircle, AlertTriangle, Eye, RefreshCw, Power, Zap, Hammer,
  Settings,Sliders, Anchor, ChevronRight, Activity, Cpu, Check, Layers, HardHat
} from 'lucide-react';
import { UserProfile, GameRule } from '../types';

interface CANManagerProps {
  users: UserProfile[];
  rules: GameRule[];
  onSaveUsers: (updated: UserProfile[]) => Promise<void>;
  onRefreshData?: () => Promise<void>;
  setIsAlertToShow: (alert: { show: boolean; status: 'success' | 'error'; message: string }) => void;
  activeSubTab?: 'can_commander' | 'can_global' | 'can_alliances';
}

// 12 Core Vault resources definition
const RESOURCE_KEYS = [
  { key: 'metal', label: 'Metal', color: 'text-zinc-400', barBg: 'bg-zinc-500', defaultCap: 500000 },
  { key: 'cristal', label: 'Cristal', color: 'text-cyan-400', barBg: 'bg-cyan-500', defaultCap: 300000 },
  { key: 'deuterio', label: 'Deuterio', color: 'text-sky-400', barBg: 'bg-sky-500', defaultCap: 150000 },
  { key: 'materiaOscura', label: 'Materia Oscura', color: 'text-purple-400', barBg: 'bg-purple-500', defaultCap: 50000 },
  { key: 'omniplate', label: 'Omniplate', color: 'text-zinc-300', barBg: 'bg-zinc-400', defaultCap: 100000 },
  { key: 'orichaltron', label: 'Orichaltron', color: 'text-amber-500', barBg: 'bg-amber-600', defaultCap: 40000 },
  { key: 'lunarFiber', label: 'Lunar Fiber', color: 'text-teal-400', barBg: 'bg-teal-500', defaultCap: 80000 },
  { key: 'infiniteCore', label: 'Infinite Core', color: 'text-red-400', barBg: 'bg-red-500', defaultCap: 10000 },
  { key: 'primalToken', label: 'Primal Token', color: 'text-yellow-400', barBg: 'bg-yellow-500', defaultCap: 5000 },
  { key: 'xenoplasm', label: 'Xenoplasm', color: 'text-emerald-400', barBg: 'bg-emerald-500', defaultCap: 25000 },
  { key: 'organium', label: 'Organium', color: 'text-lime-400', barBg: 'bg-lime-500', defaultCap: 35000 },
  { key: 'mana', label: 'Mana', color: 'text-fuchsia-400', barBg: 'bg-fuchsia-500', defaultCap: 12000 }
];

// Active slots template structure
interface CANSlot {
  id: string;
  name: string;
  type: 'Estructura' | 'Tecnología';
  minLevelRequired: number;
  isOverrideOff: boolean; // manually turned off by admin
  isOverrideOnBefore: boolean; // manually turned on bypass
}

// Badge equipped template info
interface CANBadge {
  slotId: number;
  name: string;
  rarity: 'epic' | 'legendary' | 'rare' | 'common';
  daysRemaining: number;
}

// Defense turret template structures
interface CANDefense {
  id: string;
  name: string;
  type: 'Torreta' | 'Escudo' | 'Plataforma';
  hp: number;
  maxHp: number;
  status: 'OPTIMO' | 'DAÑADO' | 'CRITICO' | 'INOPERATIVO';
}

// Global seed seed_production matrices
interface SeedProductionRate {
  id: string;
  resource: string;
  coeffBase: number;
  coeffMultiplier: number;
}

// Seed structures assets
interface CatalogAsset {
  id: string;
  name: string;
  category: 'Estructura' | 'Tecnología' | 'Insignia' | 'Nave';
  baseCostMetal: number;
  baseCostCristal: number;
  basePowerScore: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

// Alliance mirrors template info
interface AllianceMirror {
  id: string;
  name: string;
  emblemColor: string;
  coreLevel: number;
  sharedMetalVault: number;
  sharedCristalVault: number;
  sharedDeuterioVault: number;
  membersCount: number;
  totalDonationScore: number;
  taxRate: number;
}

export default function CANManager({
  users,
  rules,
  onSaveUsers,
  onRefreshData,
  setIsAlertToShow,
  activeSubTab = 'can_commander'
}: CANManagerProps) {

  // Search input query
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected user loaded state inside commander terminal audit
  const [selectedUser, setSelectedUser] = useState<UserProfile>(() => users[0] || {} as UserProfile);

  // Flight lock active override switch state
  const [bypassFlightLock, setBypassFlightLock] = useState<boolean>(false);

  // Manual override level for calculated active C.A.N
  const [levelOverrideInput, setLevelOverrideInput] = useState<number>(0);

  // User Vault values & Storage Caps
  const [userVaultValues, setUserVaultValues] = useState<Record<string, number>>({
    metal: 180000, cristal: 45000, deuterio: 23100, materiaOscura: 1400,
    omniplate: 8900, orichaltron: 320, lunarFiber: 4600, infiniteCore: 12,
    primalToken: 0, xenoplasm: 110, organium: 240, mana: 850
  });

  const [userVaultCaps, setUserVaultCaps] = useState<Record<string, number>>({
    metal: 500000, cristal: 300000, deuterio: 150000, materiaOscura: 50000,
    omniplate: 100000, orichaltron: 40000, lunarFiber: 80000, infiniteCore: 10000,
    primalToken: 5000, xenoplasm: 25000, organium: 35000, mana: 12000
  });

  // Active terminal structures slots simulation
  const [activeSlots, setActiveSlots] = useState<(CANSlot & { durabilityHp?: number })[]>([
    { id: 'slot_1', name: 'Planta de Fusión Solar', type: 'Estructura', minLevelRequired: 5, isOverrideOff: false, isOverrideOnBefore: false, durabilityHp: 100 },
    { id: 'slot_2', name: 'Laboratorio Cuántico', type: 'Tecnología', minLevelRequired: 15, isOverrideOff: false, isOverrideOnBefore: false, durabilityHp: 85 },
    { id: 'slot_3', name: 'Cañón de Iones Orbital', type: 'Estructura', minLevelRequired: 25, isOverrideOff: false, isOverrideOnBefore: false, durabilityHp: 8 },
    { id: 'slot_4', name: 'Blindaje Bio-Materia', type: 'Tecnología', minLevelRequired: 35, isOverrideOff: false, isOverrideOnBefore: false, durabilityHp: 75 },
    { id: 'slot_5', name: 'Propulsor Gravitacional', type: 'Tecnología', minLevelRequired: 40, isOverrideOff: false, isOverrideOnBefore: false, durabilityHp: 5 }
  ]);

  // Skills for Dynamic Badge Slots
  const [unlockedSlotsSkills, setUnlockedSlotsSkills] = useState({
    assetMastery: true,
    quantumSignals: false
  });

  // Badges equipped matrix simulation
  const [equippedBadges, setEquippedBadges] = useState<CANBadge[]>([
    { slotId: 1, name: 'Medalla de Vanguardia Sideral', rarity: 'legendary', daysRemaining: 12 },
    { slotId: 2, name: 'Cruz Combatiente de Orión', rarity: 'epic', daysRemaining: 6 },
    { slotId: 3, name: 'Sello de Fundador Sasori', rarity: 'legendary', daysRemaining: 15 },
    { slotId: 4, name: 'Insignia de Piloto Estelar', rarity: 'rare', daysRemaining: 2 },
    { slotId: 5, name: 'Emblema Explorador Cosmos', rarity: 'common', daysRemaining: 9 },
    { slotId: 6, name: 'Insignia de Suscriptor Discord Booster III', rarity: 'legendary', daysRemaining: 30 },
    { slotId: 7, name: 'Subscriber Badge I (Ttv)', rarity: 'epic', daysRemaining: 14 },
    { slotId: 8, name: 'Pase Virtual Twitch Golden Booster', rarity: 'legendary', daysRemaining: 45 }
  ]);

  // Defenses list simulation
  const [defenses, setDefenses] = useState<CANDefense[]>(() => [
    { id: 'def_1', name: 'Torreta Láser de Focalización', type: 'Torreta', hp: 240, maxHp: 1000, status: 'DAÑADO' },
    { id: 'def_2', name: 'Escudo de Energía de Plasma', type: 'Escudo', hp: 10, maxHp: 2500, status: 'CRITICO' },
    { id: 'def_3', name: 'Plataforma Orbital de Artillería', type: 'Plataforma', hp: 0, maxHp: 5000, status: 'INOPERATIVO' }
  ]);

  // ==========================================
  // PESTAÑA 2: SEED GLOBAL SECTIONS STATE
  // ==========================================
  const [productionRates, setProductionRates] = useState<SeedProductionRate[]>([
    { id: 'pr_1', resource: 'Metal', coeffBase: 120, coeffMultiplier: 1.5 },
    { id: 'pr_2', resource: 'Cristal', coeffBase: 80, coeffMultiplier: 1.4 },
    { id: 'pr_3', resource: 'Deuterio', coeffBase: 40, coeffMultiplier: 1.3 },
    { id: 'pr_4', resource: 'Materia Oscura', coeffBase: 5, coeffMultiplier: 1.1 }
  ]);

  // Industrial scalability multipliers
  const [costMultiplier, setCostMultiplier] = useState<number>(1.6);

  // Catalog assets list
  const [catalogAssets, setCatalogAssets] = useState<CatalogAsset[]>([
    { id: 'cat_01', name: 'Tractor Ray Sideral', category: 'Nave', baseCostMetal: 150000, baseCostCristal: 45000, basePowerScore: 890, rarity: 'rare' },
    { id: 'cat_02', name: 'Crucero Antigravedad Mk2', category: 'Nave', baseCostMetal: 650000, baseCostCristal: 180000, basePowerScore: 2400, rarity: 'epic' },
    { id: 'cat_03', name: 'Escudo de Sincronía Gravitacional', category: 'Estructura', baseCostMetal: 220000, baseCostCristal: 95000, basePowerScore: 1100, rarity: 'rare' },
    { id: 'cat_04', name: 'Placa Blindada Orichaltron', category: 'Tecnología', baseCostMetal: 80000, baseCostCristal: 40000, basePowerScore: 500, rarity: 'common' },
    { id: 'cat_05', name: 'Insignia de Veterano Cósmico', category: 'Insignia', baseCostMetal: 450000, baseCostCristal: 250000, basePowerScore: 3500, rarity: 'legendary' }
  ]);

  // CRUD mod states
  const [isAddingAsset, setIsAddingAsset] = useState(false);
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [newAsset, setNewAsset] = useState<Partial<CatalogAsset>>({
    name: '',
    category: 'Nave',
    baseCostMetal: 10000,
    baseCostCristal: 5000,
    basePowerScore: 100,
    rarity: 'common'
  });

  // ==========================================
  // PESTAÑA 3: ALLIANCE C.A.N. SEC STATE
  // ==========================================
  const [allianceSearchQuery, setAllianceSearchQuery] = useState('');
  const [activeAlliance, setActiveAlliance] = useState<AllianceMirror>({
    id: 'all_01',
    name: 'Vanguardia Galáctica',
    emblemColor: 'indigo',
    coreLevel: 4,
    sharedMetalVault: 3450000,
    sharedCristalVault: 1840000,
    sharedDeuterioVault: 920000,
    membersCount: 34,
    totalDonationScore: 124500
  });

  // Calculate dynamic active level based on algorithm formula
  const calculatedLevel = useMemo(() => {
    // Elegant system algorithm calculation mimicking the backend rules engine
    const base = Math.floor(Math.sqrt((userVaultValues.metal * 0.05) + (userVaultValues.cristal * 0.15) + (userVaultValues.deuterio * 0.3)) / 25) + 1;
    return Math.min(Math.max(base, 1), 60);
  }, [userVaultValues]);

  // Handle master user search binding
  const handleBindCognitiveTerminal = () => {
    if (!searchQuery.trim()) {
      setIsAlertToShow({
        show: true,
        status: 'error',
        message: 'Por favor, ingrese un UID, correo o Wallet válido para enlazar.'
      });
      return;
    }

    // Try finding in active user lists
    const qLower = searchQuery.toLowerCase();
    const foundUser = users.find(u => 
      u.id.toLowerCase() === qLower || 
      u.email.toLowerCase() === qLower ||
      u.username.toLowerCase().includes(qLower)
    );

    if (foundUser) {
      setSelectedUser(foundUser);
      // Hydrate custom mock states associated with selected user
      setBypassFlightLock(false);
      setLevelOverrideInput(foundUser.level);

      // Mutate mock resource levels to represent user state variability
      const randomSeed = foundUser.level * 450;
      setUserVaultValues({
        metal: Math.floor(randomSeed * 1.5 + 45000),
        cristal: Math.floor(randomSeed * 0.8 + 12000),
        deuterio: Math.floor(randomSeed * 0.4 + 5000),
        materiaOscura: Math.floor(foundUser.gems * 10),
        omniplate: Math.floor(randomSeed * 0.2 + 1500),
        orichaltron: Math.floor(foundUser.level * 8),
        lunarFiber: Math.floor(randomSeed * 0.25),
        infiniteCore: Math.floor(foundUser.level / 5),
        primalToken: foundUser.role === 'admin' ? 12 : 0,
        xenoplasm: Math.floor(foundUser.level * 3),
        organium: Math.floor(randomSeed * 0.05),
        mana: foundUser.level > 20 ? 1200 : 80
      });

      setIsAlertToShow({
        show: true,
        status: 'success',
        message: `¡TERMINAL COGNITIVO ENLAZADO CON EXITO! Perfil encendido: ${foundUser.username}`
      });
    } else {
      setIsAlertToShow({
        show: true,
        status: 'error',
        message: 'No se localizó ningún comandante con ese identificador. Cargando terminal simulado de contingencia.'
      });
    }
  };

  // Switch manual level overrides
  const handleApplyLevelOverride = () => {
    if (levelOverrideInput < 1 || levelOverrideInput > 100) {
      setIsAlertToShow({
        show: true,
        status: 'error',
        message: 'El nivel de override debe estar entre 1 y 100.'
      });
      return;
    }

    // Save level override in user profile rows
    const updatedUsers = users.map(u => {
      if (u.id === selectedUser.id) {
        return { ...u, level: levelOverrideInput };
      }
      return u;
    });

    onSaveUsers(updatedUsers);
    setSelectedUser(prev => ({ ...prev, level: levelOverrideInput }));
    
    setIsAlertToShow({
      show: true,
      status: 'success',
      message: `Override de Nivel aplicado. C.A.N forzado a nivel ${levelOverrideInput}.`
    });
  };

  // Recomponer saldo handler
  const handleUpdateResourceValue = (key: string) => {
    const newVal = userVaultValues[key];
    const cap = userVaultCaps[key];

    if (newVal > cap) {
      // Over storage cap warning
      setIsAlertToShow({
        show: true,
        status: 'success',
        message: `¡ALERTA DE CAPACIDAD SUPERADA! Registrado: ${newVal.toLocaleString()} superando límite de ${cap.toLocaleString()}`
      });
    } else {
      setIsAlertToShow({
        show: true,
        status: 'success',
        message: `Saldo recomcompuesto: ${key.toUpperCase()} puesto a ${newVal.toLocaleString()}`
      });
    }
  };

  // Trigger Bypass flight lock toggle
  const handleBypassFlightLockChange = () => {
    const updated = !bypassFlightLock;
    setBypassFlightLock(updated);
    setIsAlertToShow({
      show: true,
      status: updated ? 'error' : 'success',
      message: updated 
        ? '¡ADVERTENCIA DE SOPORTE! Bypass de Vuelo encendido. Restricciones en órbita desactivadas para el jugador.'
        : 'Handshake restaurado. Restricciones de órbita espaciotemporal reactivadas.'
    });
  };

  // Slots controls
  const handleToggleSlot = (slotId: string, action: 'ON' | 'OFF') => {
    setActiveSlots(prev => prev.map(slot => {
      if (slot.id === slotId) {
        return {
          ...slot,
          isOverrideOnBefore: action === 'ON' ? true : false,
          isOverrideOff: action === 'OFF' ? true : false
        };
      }
      return slot;
    }));

    setIsAlertToShow({
      show: true,
      status: 'success',
      message: `Forzado de ranura [${slotId}] modificado a: ${action}`
    });
  };

  // Break badge usage lock before 15 days obligation
  const handleBreakBadgeLock = (slotId: number) => {
    setEquippedBadges(prev => prev.map(b => {
      if (b.slotId === slotId) {
        return { ...b, daysRemaining: 0 };
      }
      return b;
    }));

    setIsAlertToShow({
      show: true,
      status: 'success',
      message: `¡CANDADO DE INSPECCION SIDERAL ROTO! Insignia del slot ${slotId} lista para desequipar.`
    });
  };

  // Defence turret fully reconstitute hp
  const handleRepairDefense = (defId: string) => {
    setDefenses(prev => prev.map(def => {
      if (def.id === defId) {
        return {
          ...def,
          hp: def.maxHp,
          status: 'OPTIMO'
        };
      }
      return def;
    }));

    setIsAlertToShow({
      show: true,
      status: 'success',
      message: 'Reconstitución integral al 100% completada con éxito. Integridad defensiva restaurada.'
    });
  };

  // ==========================================
  // PESTAÑA 2: SEED MATRICES CRUD ACTIONS
  // ==========================================
  const handleUpdateSeedProductionValue = (id: string, field: 'coeffBase' | 'coeffMultiplier', val: number) => {
    setProductionRates(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, [field]: val };
      }
      return p;
    }));
  };

  const handleSaveSeedProduction = () => {
    setIsAlertToShow({
      show: true,
      status: 'success',
      message: 'Coeficientes y variables de la tabla seed_production resguardados globalmente.'
    });
  };

  const handleSaveScalabilityMultiplier = () => {
    setIsAlertToShow({
      show: true,
      status: 'success',
      message: `Fórmula exponencial global re-calibrada con factor standard = ${costMultiplier}`
    });
  };

  // Asset CRUD functions
  const handleAddAsset = () => {
    if (!newAsset.name?.trim()) {
      setIsAlertToShow({
        show: true,
        status: 'error',
        message: 'Falta nombre del objeto a catalogar.'
      });
      return;
    }

    const nItem: CatalogAsset = {
      id: `cat_${Date.now()}`,
      name: newAsset.name,
      category: newAsset.category || 'Nave',
      baseCostMetal: Number(newAsset.baseCostMetal) || 0,
      baseCostCristal: Number(newAsset.baseCostCristal) || 0,
      basePowerScore: Number(newAsset.basePowerScore) || 0,
      rarity: newAsset.rarity || 'common'
    };

    setCatalogAssets(prev => [nItem, ...prev]);
    setIsAddingAsset(false);
    setNewAsset({
      name: '',
      category: 'Nave',
      baseCostMetal: 10000,
      baseCostCristal: 5000,
      basePowerScore: 100,
      rarity: 'common'
    });

    setIsAlertToShow({
      show: true,
      status: 'success',
      message: `¡OBJETO AGREGADO AL KERNEL DE COCO DE DATOS! Añadido: "${nItem.name}"`
    });
  };

  const handleRemoveAsset = (id: string) => {
    setCatalogAssets(prev => prev.filter(c => c.id !== id));
    setIsAlertToShow({
      show: true,
      status: 'success',
      message: 'Objeto eliminado del kernel maestro del juego.'
    });
  };

  // ==========================================
  // PESTAÑA 3: ALLIANCE MIRRORS ACTIONS
  // ==========================================
  const handleSearchAlliance = () => {
    if (!allianceSearchQuery.trim()) {
      setIsAlertToShow({
        show: true,
        status: 'error',
        message: 'Especifique un nombre o código de alianza a consultar'
      });
      return;
    }

    // Just mock search simulation
    setActiveAlliance({
      id: 'all_searched',
      name: allianceSearchQuery,
      emblemColor: 'rose',
      coreLevel: 5,
      sharedMetalVault: 14500000,
      sharedCristalVault: 8200000,
      sharedDeuterioVault: 4500000,
      membersCount: 48,
      totalDonationScore: 890000,
      taxRate: 5
    });

    setIsAlertToShow({
      show: true,
      status: 'success',
      message: `Perfil de alianza cargado: ${allianceSearchQuery}`
    });
  };

  const handleUpdateAllianceCoreLevel = (lvl: number) => {
    setActiveAlliance(prev => ({
      ...prev,
      coreLevel: lvl
    }));

    setIsAlertToShow({
      show: true,
      status: 'success',
      message: `¡INYECCIÓN EXITOSA DE NÚCLEO DE ALIANZA! Nivel de la corporación fijado a Lvl ${lvl}`
    });
  };

  const handleSaveAllianceVault = () => {
    setIsAlertToShow({
      show: true,
      status: 'success',
      message: 'Almacenes compartidos de la alianza calibrados con éxito en la Base de Datos.'
    });
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION PANEL */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-zinc-900 gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-white tracking-tight flex items-center gap-2">
            <Cpu className="text-red-500 animate-pulse" size={20} />
            CONSOLA DE CONTROL ANALÍTICO (C.A.N.)
          </h2>
          <p className="text-xs text-zinc-500 font-sans mt-1">
            Administración avanzada de Sasorilabs para calibración de balances de usuarios y variables de kernels seed.
          </p>
        </div>
        
        {onRefreshData && (
          <button
            onClick={onRefreshData}
            className="self-end md:self-auto px-4 py-2 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-700 text-zinc-300 hover:text-white text-xs font-bold font-mono tracking-wider rounded uppercase flex items-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <RefreshCw size={13} />
            RECARGAR DATOS SEED
          </button>
        )}
      </div>

      {/* CORE ACTIVE WORKSPACE SPLITS */}
      <AnimatePresence mode="wait">
        {activeSubTab === 'can_commander' && (
          <motion.div
            key="commander_audit"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            {/* BUSCADOR MAESTRO DE USUARIO PANEL */}
            <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-lg space-y-4">
              <span className="text-[10px] font-mono text-zinc-400 block tracking-widest font-bold uppercase">
                ⚙️ ENLAZAR TERMINAL COGNITIVO DE COMANDANTES
              </span>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="flex-1 relative">
                  <div className="absolute left-3 top-2.5 text-zinc-650">
                    <Search size={14} />
                  </div>
                  <input
                    type="text"
                    placeholder="Ingrese UID de cuenta, Correo o Dirección de Wallet dApp..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-zinc-900/60 border border-zinc-850 focus:border-red-500 rounded text-xs text-white focus:outline-none placeholder-zinc-700 font-mono transition-colors"
                  />
                </div>
                <button
                  onClick={handleBindCognitiveTerminal}
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 hover:shadow-lg active:translate-y-0.5 text-white font-bold text-[10.5px] uppercase tracking-wider rounded transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Zap size={13} className="text-white animate-pulse" />
                  ENLAZAR TERMINAL COGNITIVO
                </button>
              </div>

              {/* Connected User HUD snapshot */}
              <div className="p-3 bg-[#08080a] border border-zinc-900 rounded flex flex-col md:flex-row justify-between items-start md:items-center gap-3.5">
                <div className="flex items-center gap-3">
                  <img 
                    src={selectedUser.avatarUrl || 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=128&auto=format&fit=crop'} 
                    alt={selectedUser.username} 
                    className="w-9 h-9 rounded-full ring-2 ring-red-500/20 object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold text-xs font-mono">{selectedUser.username}</span>
                      <span className="text-[8px] bg-red-600/10 border border-red-500/30 text-red-500 font-bold px-1.5 py-0.2 rounded font-mono uppercase tracking-wide">
                        {selectedUser.role}
                      </span>
                    </div>
                    <span className="text-[9.5px] text-zinc-550 block font-mono mt-0.5">{selectedUser.email || 'N/A Email'} • ID: {selectedUser.id}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                  <div className="py-1 px-2.5 bg-zinc-900 border border-zinc-850 rounded">
                    <span className="text-[8px] text-zinc-500 block uppercase font-bold">Nivel Forzado</span>
                    <span className="text-white font-bold text-xs">{selectedUser.level}</span>
                  </div>
                  <div className="py-1 px-2.5 bg-zinc-900 border border-zinc-850 rounded">
                    <span className="text-[8px] text-zinc-500 block uppercase font-bold">Estatus Handshake</span>
                    <span className={`text-xs font-bold ${selectedUser.status === 'active' ? 'text-emerald-400' : 'text-red-500'}`}>
                      {selectedUser.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="py-1 px-2.5 bg-zinc-900 border border-zinc-850 rounded">
                    <span className="text-[8px] text-zinc-500 block uppercase font-bold">Registro Sideral</span>
                    <span className="text-zinc-400 text-xs">{new Date(selectedUser.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* HANDSHAKE OVERRIDES AND EMERGENCY BUTTONS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* MODIFICADORES DE NIVEL Y BYPASS */}
              <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-lg space-y-4">
                <span className="text-[10px] font-mono text-zinc-400 block tracking-widest font-bold uppercase border-b border-zinc-900 pb-1.5 flex items-center gap-2">
                  <Activity size={12} className="text-red-500" /> REGLAS DE NIVELACION Y OVERRIDES
                </span>

                <div className="bg-zinc-900/30 border border-zinc-850/60 p-3 rounded space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10.5px] text-zinc-400">Nivel Dinámico (C.A.N. Calculado)</span>
                    <span className="text-xs font-mono font-bold text-red-500">{calculatedLevel}</span>
                  </div>
                  <p className="text-[9px] text-zinc-550 leading-normal">
                    Algoritmo de calibración pasiva: Calculado a partir del peso bruto de recursos estratégicos en vault.
                  </p>
                  <div className="text-[8.5px] text-zinc-650 font-mono text-right truncate bg-black/40 p-1 border border-zinc-900 rounded">
                    f(x) = sqrt(M*0.05 + C*0.15 + D*0.3)/25 + 1
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">Forzar Override de Nivel</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={levelOverrideInput}
                      onChange={(e) => setLevelOverrideInput(parseInt(e.target.value) || 1)}
                      className="w-full px-2.5 py-1.5 text-xs bg-zinc-900 text-white rounded border border-zinc-800 focus:outline-none focus:border-red-500 font-mono"
                    />
                    <button
                      onClick={handleApplyLevelOverride}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] uppercase rounded transition-colors whitespace-nowrap cursor-pointer"
                    >
                      Aplicar Forzado
                    </button>
                  </div>
                  <p className="text-[8.5px] text-zinc-600 italic">
                    Ideal para bypass temporal y resolver problemas de visualización por soporte.
                  </p>
                </div>

                {/* Switch button: BYPASS_FLIGHT_LOCK */}
                <div className="border-t border-zinc-900 pt-4 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-zinc-300 block font-mono">⚡ BYPASS_FLIGHT_LOCK</span>
                    <span className="text-[9px] text-zinc-550 block leading-tight">Desactiva restricciones orbitales espaciales</span>
                  </div>
                  <button
                    onClick={handleBypassFlightLockChange}
                    className={`px-4 py-2 text-[9.5px] font-bold font-mono uppercase tracking-wider rounded transition-all cursor-pointer ${
                      bypassFlightLock 
                        ? 'bg-red-500/20 text-red-500 border border-red-500 animate-pulse' 
                        : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:bg-zinc-800'
                    }`}
                  >
                    {bypassFlightLock ? 'BYPASS_ACTIVE' : 'BYPASS_OFF'}
                  </button>
                </div>
              </div>

              {/* TERMINAL DE REPARACION DE DEFENSAS */}
              <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-lg space-y-4 lg:col-span-2">
                <span className="text-[10px] font-mono text-zinc-400 block tracking-widest font-bold uppercase border-b border-zinc-900 pb-1.5 flex items-center gap-2">
                  <ShieldCheck size={12} className="text-emerald-500" /> TERMINAL DE REPARACIÓN DE DEFENSAS
                </span>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px]">
                    <thead>
                      <tr className="border-b border-zinc-900 text-zinc-500 text-[9px] font-mono uppercase tracking-wider">
                        <th className="pb-2">Defensa</th>
                        <th className="pb-2">Categoría</th>
                        <th className="pb-2 text-center">Salud Actual (HP) / Max HP</th>
                        <th className="pb-2 text-center">Estado</th>
                        <th className="pb-2 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900">
                      {defenses.map((def) => (
                        <tr key={def.id} className="hover:bg-zinc-900/10">
                          <td className="py-2.5 font-bold text-white shrink-0 font-mono">{def.name}</td>
                          <td className="py-2.5 text-zinc-400">{def.type}</td>
                          <td className="py-2.5 text-center font-mono font-bold text-zinc-300">
                            <span className="text-red-500">{def.hp}</span> / {def.maxHp}
                          </td>
                          <td className="py-2.5 text-center">
                            <span className={`px-2 py-0.5 rounded text-[8.5px] font-mono font-bold ${
                              def.status === 'OPTIMO' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' :
                              def.status === 'DAÑADO' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/10' :
                              def.status === 'CRITICO' ? 'bg-orange-500/15 text-orange-400 border border-orange-500/15' :
                              'bg-red-500/10 text-red-500 border border-red-500/10 animate-pulse'
                            }`}>
                              {def.status}
                            </span>
                          </td>
                          <td className="py-2.5 text-right font-mono">
                            <button
                              onClick={() => handleRepairDefense(def.id)}
                              className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white font-semibold text-[8px] uppercase tracking-wider rounded transition-colors cursor-pointer"
                            >
                              Parchear 100%
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* CONSOLA DE INYECCION DE BOVEDA (VAULT MATERIAL) */}
            <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-lg space-y-4">
              <span className="text-[10px] font-mono text-zinc-400 block tracking-widest font-bold uppercase border-b border-zinc-900 pb-1.5 flex items-center justify-between">
                <span>💰 VAULT MATERIAL CONSOLE & STORAGE RE-WRITER</span>
                <span className="text-[8px] font-mono text-red-500 lowercase bg-red-950/15 border border-red-500/20 px-1.5 py-0.5 rounded">
                  soporte nivel 3
                </span>
              </span>

              {/* Responsive grid for 12 resource elements */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {RESOURCE_KEYS.map(({ key, label, color, defaultCap }) => (
                  <div key={key} className="p-3 bg-zinc-900/35 border border-zinc-850/80 rounded space-y-2">
                    
                    {/* Header Resource key labels */}
                    <div className="flex items-center justify-between">
                      <span className={`text-[10.5px] font-bold font-mono ${color}`}>{label}</span>
                      <span className="text-[8px] text-zinc-550 font-mono">Cap Estándar: {defaultCap.toLocaleString()}</span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className="text-[9.5px] text-zinc-500 uppercase font-bold shrink-0 font-mono">QTY:</div>
                        <input
                          type="number"
                          value={userVaultValues[key]}
                          onChange={(e) => setUserVaultValues(prev => ({
                            ...prev,
                            [key]: parseInt(e.target.value) || 0
                          }))}
                          className="w-full bg-black/60 border border-zinc-800 rounded px-2 py-1 text-xs font-mono font-bold text-white focus:outline-none focus:border-red-500 text-right"
                        />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <div className="text-[9.5px] text-zinc-500 uppercase font-bold shrink-0 font-mono">CAP:</div>
                        <input
                          type="number"
                          value={userVaultCaps[key]}
                          onChange={(e) => setUserVaultCaps(prev => ({
                            ...prev,
                            [key]: parseInt(e.target.value) || 0
                          }))}
                          className="w-full bg-black/30 border border-zinc-850 rounded px-2 py-0.5 text-[10.5px] font-mono text-zinc-400 focus:outline-none focus:border-red-500 text-right"
                          placeholder={`${defaultCap}`}
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => handleUpdateResourceValue(key)}
                      className="w-full py-1 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-[9px] hover:text-white font-bold uppercase font-mono rounded tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Save size={10} className="text-red-500" />
                      <span>Recomponer Saldo</span>
                    </button>
                    
                  </div>
                ))}
              </div>
            </div>

            {/* ADVERTENCIA DE ASSETS/SLOTS CRÍTICOS - HP <= 10% (SECCIÓN SEPARADA CON ENFOQUE ROJO) */}
            {activeSlots.some(s => (s.durabilityHp ?? 100) <= 10) && (
              <div className="p-4 bg-red-950/20 border border-red-500 rounded-lg space-y-3">
                <div className="flex items-center gap-2 text-red-500 font-bold text-xs uppercase font-mono">
                  <ShieldAlert size={14} className="animate-bounce" />
                  <span>⚠️ ALERTA DE DAÑO EN C.A.N: ASSETS CRÍTICOS (DURABILIDAD Y HP Y CORES &le; 10%)</span>
                </div>
                <p className="text-[10.5px] text-zinc-400">
                  Los siguientes módulos orbitales integrados en el reactor de {selectedUser.username} se encuentran por debajo del umbral mínimo de integridad estructural. Requieren reparación urgente antes de causar un apagón total en la C.A.N.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {activeSlots.filter(s => (s.durabilityHp ?? 100) <= 10).map(slot => (
                    <div 
                      key={slot.id} 
                      className="p-3 bg-red-950/30 border border-red-500/45 rounded flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <span className="text-white font-bold text-xs block">{slot.name}</span>
                        <div className="flex items-center gap-2 mt-1 text-[9px] font-mono text-red-400">
                          <span>HP ACTUAL: {slot.durabilityHp}%</span>
                          <span>•</span>
                          <span className="uppercase font-bold tracking-wider">CRÍTICO EN RIEGOS</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          setActiveSlots(prev => prev.map(s => s.id === slot.id ? { ...s, durabilityHp: 100 } : s));
                          setIsAlertToShow({
                            show: true,
                            status: 'success',
                            message: `Módulo estrella [${slot.name}] reparado al 100% de manera exitosa.`
                          });
                        }}
                        className="px-2.5 py-1 bg-red-650 hover:bg-red-600 border border-red-500 text-white font-mono text-[8px] uppercase tracking-wider rounded transition-all cursor-pointer"
                      >
                        Reparar HP
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TERMINAL DE SLOTS ACTIVOS & GESTOR DE INSIGNIAS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* TERMINAL DE SLOTS ACTIVOS (ESTRUCTURAS Y TECNOLOGIAS) */}
              <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-lg space-y-4">
                <span className="text-[10px] font-mono text-zinc-400 block tracking-widest font-bold uppercase border-b border-zinc-900 pb-1.5 flex items-center justify-between">
                  <span>🛰️ TERMINAL DE SLOTS ACTIVOS (MÓDULOS DE ORBITA)</span>
                  <span className="text-[8px] font-mono text-zinc-550">Nivel de Usuario: {selectedUser.level}</span>
                </span>

                <div className="space-y-2">
                  {activeSlots.filter(s => (s.durabilityHp ?? 100) > 10).map((slot) => {
                    // Check if disabled because calculation requirements fall below current user level
                    const isLevelTooLow = selectedUser.level < slot.minLevelRequired && !slot.isOverrideOnBefore;
                    const isDisabled = isLevelTooLow || slot.isOverrideOff;
                    
                    return (
                      <div 
                        key={slot.id}
                        className={`p-3 rounded border flex items-center justify-between gap-3 ${
                          isDisabled 
                            ? 'bg-orange-500/5 border-orange-500/25' 
                            : 'bg-emerald-500/5 border-emerald-500/25'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white tracking-tight">{slot.name}</span>
                            <span className={`text-[8px] font-mono font-bold px-1 rounded uppercase ${
                              slot.type === 'Estructura' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'
                            }`}>
                              {slot.type}
                            </span>
                            <span className="text-[9px] font-mono text-zinc-500">HP: {slot.durabilityHp}%</span>
                          </div>
                          
                          <div className="flex items-center gap-2 mt-1 text-[9px] text-zinc-500 font-mono">
                            <span>Lvl Req: {slot.minLevelRequired}</span>
                            <span>•</span>
                            {isLevelTooLow ? (
                              <span className="text-orange-400 font-bold flex items-center gap-0.5 animate-pulse">
                                <AlertTriangle size={9} /> Inhabilitado por caída de nivel
                              </span>
                            ) : slot.isOverrideOff ? (
                              <span className="text-zinc-650 italic">Forzador apagado</span>
                            ) : (
                              <span className="text-emerald-400 font-bold">Activo y Operativo</span>
                            )}
                          </div>
                        </div>

                        {/* Action controllers ON/OFF override */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleToggleSlot(slot.id, 'ON')}
                            className={`p-1 px-2 text-[8px] uppercase font-bold font-mono rounded transition-colors cursor-pointer ${
                              slot.isOverrideOnBefore 
                                ? 'bg-emerald-600 text-white' 
                                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                            }`}
                            title="Forzar encendido de módulo"
                          >
                            Forzar On
                          </button>
                          <button
                            onClick={() => handleToggleSlot(slot.id, 'OFF')}
                            className={`p-1 px-2 text-[8px] uppercase font-bold font-mono rounded transition-colors cursor-pointer ${
                              slot.isOverrideOff 
                                ? 'bg-orange-600 text-white' 
                                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                            }`}
                            title="Forzar apagado de módulo"
                          >
                            Forzar Off
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* INTEGRACIÓN VISUAL: INVENTARIO DE LA C.A.N */}
              <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-lg space-y-4">
                <span className="text-[10px] font-mono text-zinc-400 block tracking-widest font-bold uppercase border-b border-zinc-900 pb-1.5 flex items-center justify-between">
                  <span>📦 INVENTARIO INTEGRADO DE LA C.A.N. (BIENES SIDERALES)</span>
                  <span className="text-[8px] font-mono text-red-500 font-bold uppercase">Vista integrada en C.A.N.</span>
                </span>

                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                  {!selectedUser.inventory || selectedUser.inventory.length === 0 ? (
                    <div className="p-6 text-center border border-dashed border-zinc-905 rounded">
                      <p className="text-xs text-zinc-500 italic">No hay assets identificados en el silo del comandante.</p>
                    </div>
                  ) : (
                    selectedUser.inventory.map((item) => {
                      // Color coding strict rules also mapped directly for inventory assets
                      const isLowQuantity = item.quantity <= 1;
                      const badgeClass = 
                        item.rarity === 'legendary' ? 'border-red-500/20 text-red-400 bg-red-950/10' :
                        item.rarity === 'epic' ? 'border-purple-500/20 text-purple-400 bg-purple-950/10' :
                        item.rarity === 'rare' ? 'border-blue-500/20 text-blue-400 bg-blue-950/10' :
                        'border-zinc-800 text-zinc-400 bg-zinc-900';

                      return (
                        <div 
                          key={item.id}
                          className={`p-2.5 rounded border text-xs flex items-center justify-between gap-3 ${
                            isLowQuantity 
                              ? 'border-orange-500/30 bg-orange-950/5 text-orange-400' 
                              : 'border-emerald-500/25 bg-emerald-950/5 text-emerald-300'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white capitalize">{item.name}</span>
                              <span className={`text-[8.5px] px-1 font-mono uppercase border rounded ${badgeClass}`}>
                                {item.rarity}
                              </span>
                            </div>
                            <div className="text-[9px] text-zinc-500 font-mono mt-0.5">
                              ID: {item.id} • Categoría: <span className="uppercase text-zinc-400">{item.type}</span>
                            </div>
                          </div>
                          <div className="text-right font-mono">
                            <span className="text-[9.5px] text-zinc-500 block uppercase font-bold">Cantidad</span>
                            <span className="text-white font-bold">{item.quantity} units</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* GESTOR DE INSIGNIAS Y LIMITADOR DINÁMICO (C.A.N. EXPANSION) */}
              <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-lg space-y-4">
                <span className="text-[10px] font-mono text-zinc-400 block tracking-widest font-bold uppercase border-b border-zinc-900 pb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Award size={12} className="text-red-500 animate-pulse" /> RANURAS DE INSIGNIAS Y TIMELOCK DINÁMICO</span>
                  <span className="text-[8.5px] font-mono text-white bg-red-600/30 px-1.5 py-0.2 rounded font-bold uppercase">
                    LÍMITE COMPATIBLE: {5 + (unlockedSlotsSkills.assetMastery ? 1 : 0) + (unlockedSlotsSkills.quantumSignals ? 2 : 0)} RANURAS
                  </span>
                </span>

                {/* Desbloqueador de slots por Skills */}
                <div className="p-2.5 bg-zinc-900/40 border border-zinc-900 rounded space-y-2">
                  <span className="text-[8.5px] font-bold text-zinc-500 font-mono block uppercase tracking-widest">
                    ⚡ DESBLOQUEADOR DE RANURAS POR SKILLS (C.A.N EXPANSION)
                  </span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                    <label className="flex items-center gap-2.5 p-1 px-2 bg-zinc-950 border border-zinc-850 rounded hover:border-zinc-800 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={unlockedSlotsSkills.assetMastery}
                        onChange={(e) => setUnlockedSlotsSkills(prev => ({ ...prev, assetMastery: e.target.checked }))}
                        className="rounded border-zinc-800 text-red-600 focus:ring-0 bg-black"
                      />
                      <div className="min-w-0">
                        <span className="font-bold text-zinc-300 block">Asset Mastery II</span>
                        <span className="text-[8px] text-emerald-400 font-mono">+1 ranura de insignia</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-2.5 p-1 px-2 bg-zinc-950 border border-zinc-850 rounded hover:border-zinc-800 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={unlockedSlotsSkills.quantumSignals}
                        onChange={(e) => setUnlockedSlotsSkills(prev => ({ ...prev, quantumSignals: e.target.checked }))}
                        className="rounded border-zinc-800 text-red-600 focus:ring-0 bg-black"
                      />
                      <div className="min-w-0">
                        <span className="font-bold text-zinc-300 block">Quantum Signals III</span>
                        <span className="text-[8px] text-emerald-400 font-mono">+2 ranuras de insignia</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {equippedBadges
                    .filter(badge => badge.slotId <= (5 + (unlockedSlotsSkills.assetMastery ? 1 : 0) + (unlockedSlotsSkills.quantumSignals ? 2 : 0)))
                    .map((badge) => (
                      <div 
                        key={badge.slotId}
                        className="p-3 bg-zinc-900/35 border border-zinc-850 rounded flex items-center justify-between gap-3 text-[11px]"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[9.5px] font-mono text-zinc-550 font-bold shrink-0">SLOT #{badge.slotId}</span>
                            <span className="text-white font-bold truncate max-w-[160px]">{badge.name}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[9px] font-mono">
                            <span className={`capitalize ${
                              badge.rarity === 'legendary' ? 'text-red-500 font-bold' :
                              badge.rarity === 'epic' ? 'text-purple-400 font-bold' : 'text-zinc-500'
                            }`}>
                              {badge.rarity}
                            </span>
                            <span className="text-zinc-700 font-sans">•</span>
                            {badge.daysRemaining > 0 ? (
                              <span className="text-yellow-500 font-medium font-mono">Bloqueado: {badge.daysRemaining} días restantes</span>
                            ) : (
                              <span className="text-zinc-500 italic">Desbloqueado</span>
                            )}
                          </div>
                        </div>

                        {badge.daysRemaining > 0 && (
                          <button
                            onClick={() => handleBreakBadgeLock(badge.slotId)}
                            className="px-2.5 py-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-500/20 font-bold text-[8px] uppercase tracking-wider rounded transition-colors cursor-pointer text-center"
                          >
                            Romper Candado
                          </button>
                        )}
                      </div>
                    ))}
                </div>
              </div>

              {/* MULTIPLICADORES ACTIVOS ("ACTIVE BONUS" PANEL) */}
              <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-lg space-y-4">
                <span className="text-[10px] font-mono text-zinc-400 block tracking-widest font-bold uppercase border-b border-zinc-900 pb-1.5 flex items-center justify-between">
                  <span>⚡ MULTIPLICADORES ACTIVOS (ACTIVE BONUS AUDITING)</span>
                  <span className="text-[8px] font-mono text-emerald-400 bg-emerald-950/35 border border-emerald-900 px-1 py-0.5 rounded">
                    Sueldo Pasivo Activo
                  </span>
                </span>

                <div className="space-y-3 font-mono text-xs">
                  <p className="text-[11px] text-zinc-400 font-sans">
                    Resumen agregado de multiplicadores de producción y protección en órbita extraídos de las licencias y las insignias activas:
                  </p>

                  <div className="bg-[#08080c] border border-zinc-900 p-3 rounded-lg space-y-3.5">
                    
                    {/* Multiplier 1 */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10.5px]">
                        <span className="text-zinc-400">Extractor de Mineral (Metal/Cristal):</span>
                        <span className="text-emerald-400 font-bold font-mono">x1.45 MULTIPLIER</span>
                      </div>
                      <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: '85%' }}></div>
                      </div>
                      <div className="flex justify-between text-[8px] text-zinc-650">
                        <span>Origen: Sello Sasori + Medalla Vanguardia</span>
                        <span>12 días restantes</span>
                      </div>
                    </div>

                    {/* Multiplier 2 */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10.5px]">
                        <span className="text-zinc-400">Bono de Exp. Combate Sideral:</span>
                        <span className="text-purple-400 font-bold font-mono">x1.15 MULTIPLIER</span>
                      </div>
                      <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-purple-500 h-full rounded-full" style={{ width: '40%' }}></div>
                      </div>
                      <div className="flex justify-between text-[8px] text-zinc-650">
                        <span>Origen: Cruz Combatiente de Orión</span>
                        <span>6 días restantes</span>
                      </div>
                    </div>

                    {/* Multiplier 3 */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10.5px]">
                        <span className="text-zinc-400">Bono de Minado de Deuterio (Core):</span>
                        <span className="text-sky-400 font-bold font-mono">x1.20 MULTIPLIER</span>
                      </div>
                      <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-sky-400 h-full rounded-full" style={{ width: '60%' }}></div>
                      </div>
                      <div className="flex justify-between text-[8px] text-zinc-650">
                        <span>Origen: Emblema Explorador Cosmos</span>
                        <span>9 días restantes</span>
                      </div>
                    </div>

                    {/* Multiplier 4 */}
                    <div className="space-y-1 border-t border-zinc-900 pt-3">
                      <div className="flex justify-between items-center text-[10.5px]">
                        <span className="text-white font-bold font-sans">Discord Booster Members Bonus:</span>
                        <span className="text-red-500 font-bold font-mono">x1.50 MULTIPLIER</span>
                      </div>
                      <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden mt-1">
                        <div className="bg-red-500 h-full rounded-full" style={{ width: '75%' }}></div>
                      </div>
                      <div className="flex justify-between text-[8px] text-zinc-650 mt-1">
                        <span>Origen: Discord Booster III Pase</span>
                        <span>30 días restantes</span>
                      </div>
                    </div>

                  </div>
                </div>
              </div>

            </div>

          </motion.div>
        )}

        {activeSubTab === 'can_global' && (
          <motion.div
            key="global_seed"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            {/* BASE GAME PASSIVE PRODUCTION DEFAULTS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* MATRIZ DE DEFAULTS PRODUCCION COEFFS */}
              <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-lg space-y-4">
                <span className="text-[10px] font-mono text-zinc-400 block tracking-widest font-bold uppercase border-b border-zinc-900 pb-1.5 flex items-center justify-between">
                  <span>🌾 MATRIZ DE PRODUCCIÓN BASE PASIVA (TABLA seed_production)</span>
                  <span className="text-[8px] text-zinc-550 uppercase">factor por nivel</span>
                </span>

                <div className="space-y-3.5">
                  {productionRates.map((rate) => (
                    <div key={rate.id} className="p-3 bg-zinc-900/35 border border-zinc-850 rounded text-xs space-y-2.5">
                      <div className="font-bold text-white uppercase font-mono tracking-wider">{rate.resource}</div>
                      
                      <div className="grid grid-cols-2 gap-3.5">
                        <div className="space-y-1">
                          <label className="text-[9.5px] font-mono text-zinc-550 block">Coeficiente Base (Fijo)</label>
                          <input
                            type="number"
                            step="any"
                            value={rate.coeffBase}
                            onChange={(e) => handleUpdateSeedProductionValue(rate.id, 'coeffBase', parseFloat(e.target.value) || 0)}
                            className="w-full bg-black border border-zinc-800 rounded p-1.5 text-xs text-white font-mono text-right"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9.5px] font-mono text-zinc-550 block">Exponente Multiplicador</label>
                          <input
                            type="number"
                            step="any"
                            value={rate.coeffMultiplier}
                            onChange={(e) => handleUpdateSeedProductionValue(rate.id, 'coeffMultiplier', parseFloat(e.target.value) || 0)}
                            className="w-full bg-black border border-zinc-800 rounded p-1.5 text-xs text-white font-mono text-right"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <button
                    onClick={handleSaveSeedProduction}
                    className="w-full py-2.5 bg-red-650 hover:bg-red-600 text-white font-bold uppercase text-[10px] tracking-wider rounded transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Save size={13} />
                    Guardar Variables de Producción Pasiva
                  </button>
                </div>
              </div>

              {/* INDUSTRIAL SCALE EXPONENTIAL FORMULA CALIBRATION */}
              <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-lg space-y-4 self-start">
                <span className="text-[10px] font-mono text-zinc-400 block tracking-widest font-bold uppercase border-b border-zinc-900 pb-1.5 flex items-center justify-between">
                  <span>📉 ECUACIÓN DE ESCALABILIDAD INDUSTRIAL</span>
                  <span className="text-[8px] text-red-500 uppercase font-mono">fórmula de costo</span>
                </span>

                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  El factor exponencial controla la progresión geométrica de recursos necesarios para el ascenso de nivel de naves y colonias espaciales en órbita.
                </p>

                <div className="bg-[#08080a] border border-zinc-905 p-3 rounded space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-zinc-550 block uppercase tracking-wider">Multiplicador Estándar Exponencial</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.05"
                        min="1.0"
                        max="2.5"
                        value={costMultiplier}
                        onChange={(e) => setCostMultiplier(parseFloat(e.target.value) || 1.6)}
                        className="w-full bg-black border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white font-mono text-right focus:outline-none focus:border-red-500"
                      />
                      <button
                        onClick={handleSaveScalabilityMultiplier}
                        className="px-3 bg-red-600 hover:bg-red-500 text-white font-bold text-[9.5px] uppercase rounded cursor-pointer whitespace-nowrap transition-colors"
                      >
                        Actualizar Factor
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1 pt-1.5 border-t border-zinc-900 text-[10px] leading-normal text-zinc-500 font-mono">
                    <span className="text-white font-medium block mb-1">PROYECCIÓN DE IMPACTOS EN KERNEL ACTIVO:</span>
                    <div className="grid grid-cols-2 gap-2 text-right">
                      <div className="text-left font-sans">Costo Standard (Lvl 10) x1.6 Exponente:</div>
                      <span className="text-zinc-400">{(Math.pow(10, 1.6) * 1000).toLocaleString([], { maximumFractionDigits: 0 })} Oro / Metal</span>
                      
                      <div className="text-left font-sans">Costo en Evento (Lvl 10) con multiplier x{costMultiplier}:</div>
                      <span className="text-red-400 font-bold">{(Math.pow(10, costMultiplier) * 1000).toLocaleString([], { maximumFractionDigits: 0 })} Oro / Metal</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-2 bg-red-500/5 border border-red-500/10 rounded text-[9.5px] text-zinc-500 leading-normal">
                  <AlertTriangle size={13} className="text-red-500 shrink-0 mt-0.5" />
                  <p>
                    ¡Tenga cuidado! Bajar el multiplicador por debajo de 1.4 abaratará excesivamente el coste de flotas acelerando hyperinversiones, lo que podría desestabilizar el balance global del juego.
                  </p>
                </div>
              </div>

            </div>

            {/* DARK MATTER MINING CURVE DASHBOARD */}
            <div className="p-4 bg-zinc-950 border border-purple-900/40 rounded-lg space-y-4">
              <span className="text-[10px] font-mono text-purple-400 block tracking-widest font-bold uppercase border-b border-purple-900/30 pb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">🌑 CURVA DE MINADO — MATERIA OSCURA (DARK MATTER ENGINE)</span>
                <span className="text-[8px] text-purple-500 bg-purple-950/40 border border-purple-900/30 px-1.5 py-0.5 rounded font-bold uppercase">recurso escaso</span>
              </span>

              <p className="text-[10.5px] text-zinc-400 leading-relaxed font-sans">
                La Materia Oscura es el recurso más escaso del ecosistema. Controla la tasa base de generación y el coeficiente de aceleración exponencial que determina cuán rápido los jugadores avanzan en su curva de minado orbital.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 bg-purple-950/10 border border-purple-900/30 rounded-lg space-y-2">
                  <label className="text-[9px] font-mono text-purple-400 block uppercase tracking-widest font-bold">Coeficiente Base (Unidades/Hora)</label>
                  <input
                    type="number" step="0.5" min="0.5" max="50"
                    value={productionRates.find(r => r.resource === 'Materia Oscura')?.coeffBase ?? 5}
                    onChange={(e) => {
                      const id = productionRates.find(r => r.resource === 'Materia Oscura')?.id;
                      if (id) handleUpdateSeedProductionValue(id, 'coeffBase', parseFloat(e.target.value) || 5);
                    }}
                    className="w-full bg-black border border-purple-900/50 rounded p-2 text-purple-300 font-mono text-right text-sm focus:outline-none focus:border-purple-500"
                  />
                  <span className="text-[8px] text-zinc-600 font-mono block">Base de generación pasiva por hora de juego activo</span>
                </div>
                <div className="p-3 bg-purple-950/10 border border-purple-900/30 rounded-lg space-y-2">
                  <label className="text-[9px] font-mono text-purple-400 block uppercase tracking-widest font-bold">Exponente Multiplicador (Nivel)</label>
                  <input
                    type="number" step="0.01" min="1.0" max="2.0"
                    value={productionRates.find(r => r.resource === 'Materia Oscura')?.coeffMultiplier ?? 1.1}
                    onChange={(e) => {
                      const id = productionRates.find(r => r.resource === 'Materia Oscura')?.id;
                      if (id) handleUpdateSeedProductionValue(id, 'coeffMultiplier', parseFloat(e.target.value) || 1.1);
                    }}
                    className="w-full bg-black border border-purple-900/50 rounded p-2 text-purple-300 font-mono text-right text-sm focus:outline-none focus:border-purple-500"
                  />
                  <span className="text-[8px] text-zinc-600 font-mono block">Factor exponencial de escalado por nivel de C.A.N.</span>
                </div>
                <div className="p-3 bg-purple-950/10 border border-purple-900/30 rounded-lg space-y-2">
                  <label className="text-[9px] font-mono text-purple-400 block uppercase tracking-widest font-bold">Cap Máximo Global (Unidades)</label>
                  <input
                    type="number" step="1000" min="5000" max="500000" defaultValue={50000}
                    className="w-full bg-black border border-purple-900/50 rounded p-2 text-purple-300 font-mono text-right text-sm focus:outline-none focus:border-purple-500"
                  />
                  <span className="text-[8px] text-zinc-600 font-mono block">Límite máximo almacenable en bóveda orbital</span>
                </div>
              </div>

              {/* Projected yield curve table */}
              <div className="bg-black/60 border border-purple-900/20 rounded-lg overflow-hidden">
                <div className="px-3 py-2 border-b border-purple-900/20 flex items-center justify-between">
                  <span className="text-[9px] font-mono text-purple-400 font-bold uppercase tracking-widest">PROYECCIÓN DE YIELD POR NIVEL</span>
                  <span className="text-[8px] text-zinc-600 font-mono">Base × Multiplicador^Nivel</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px] font-mono">
                    <thead>
                      <tr className="border-b border-purple-900/20 text-purple-600 text-[8px] uppercase tracking-wider">
                        <th className="px-3 py-2 text-left">Nivel C.A.N</th>
                        <th className="px-3 py-2 text-right">Yield/Hora</th>
                        <th className="px-3 py-2 text-right">Yield/Día</th>
                        <th className="px-3 py-2 text-right">Días al Cap</th>
                        <th className="px-3 py-2 text-center">Progreso Curva</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-900/10">
                      {[1, 2, 3, 5, 8, 10, 15, 20].map(level => {
                        const base = productionRates.find(r => r.resource === 'Materia Oscura')?.coeffBase ?? 5;
                        const mult = productionRates.find(r => r.resource === 'Materia Oscura')?.coeffMultiplier ?? 1.1;
                        const maxLevel20Yield = base * Math.pow(mult, 19);
                        const yieldHr = base * Math.pow(mult, level - 1);
                        const yieldDay = yieldHr * 24;
                        const daysToCapFull = Math.ceil(50000 / yieldDay);
                        const progWidth = Math.min(100, (yieldHr / maxLevel20Yield) * 100);
                        return (
                          <tr key={level} className="hover:bg-purple-950/10 transition-colors">
                            <td className="px-3 py-2 text-purple-300 font-bold">Lvl {level}</td>
                            <td className="px-3 py-2 text-right text-zinc-300">{yieldHr.toFixed(2)}</td>
                            <td className="px-3 py-2 text-right text-zinc-300">{yieldDay.toFixed(1)}</td>
                            <td className="px-3 py-2 text-right text-zinc-500">{daysToCapFull}d</td>
                            <td className="px-3 py-2">
                              <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-gradient-to-r from-purple-700 to-purple-400 h-full rounded-full transition-all duration-300" style={{ width: `${progWidth}%` }} />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex items-start gap-2 p-2 bg-purple-500/5 border border-purple-500/10 rounded text-[9.5px] text-zinc-500 leading-normal">
                <span className="text-purple-400 shrink-0">🔮</span>
                <p>La Materia Oscura no debe superar el 8% de la producción diaria de Metal para mantener el balance. Coeficiente recomendado: <strong className="text-purple-400">5 × 1.1^Nivel</strong>.</p>
              </div>
            </div>

            {/* CATALOG STRUCTURES & ASSETS FULL CRUD */}
            <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-lg space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-zinc-900 pb-1.5">
                <span className="text-[10px] font-mono text-zinc-400 block tracking-widest font-bold uppercase">
                  📦 EDITOR DEL CATÁLOGO BASE DE ESTRUCTURAS Y TECNOLOGÍAS (TABLAS seed_)
                </span>
                
                <button
                  onClick={() => setIsAddingAsset(true)}
                  className="px-3 py-1 bg-red-650 hover:bg-red-600 active:translate-y-0.5 text-white font-mono font-bold text-[9px] uppercase tracking-wide rounded flex items-center gap-1 cursor-pointer transition-all"
                >
                  <Plus size={11} />
                  <span>AGREGAR NUEVO ASSET</span>
                </button>
              </div>

              {/* Inline dynamic adder form container */}
              <AnimatePresence>
                {isAddingAsset && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden bg-[#09090c] border border-zinc-900 rounded p-4 space-y-4"
                  >
                    <div className="flex justify-between items-center pb-1.5 border-b border-zinc-900">
                      <h4 className="text-[11px] font-bold text-white uppercase font-mono">Catalogar Nuevo Asset en Kernel</h4>
                      <button onClick={() => setIsAddingAsset(false)} className="text-zinc-550 hover:text-white">
                        <X size={12} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-500 uppercase">Nombre</label>
                        <input
                          type="text"
                          value={newAsset.name}
                          onChange={(e) => setNewAsset(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full bg-zinc-950 border border-zinc-850 rounded px-2 py-1 text-white text-xs focus:outline-none"
                          placeholder="Crucero Vanguardia, Mina Solar..."
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-500 uppercase">Categoría</label>
                        <select
                          value={newAsset.category}
                          onChange={(e) => setNewAsset(prev => ({ ...prev, category: e.target.value as any }))}
                          className="w-full bg-zinc-950 border border-zinc-850 text-zinc-400 rounded px-2 py-1 text-xs focus:outline-none cursor-pointer"
                        >
                          <option value="Nave">Nave</option>
                          <option value="Estructura">Estructura</option>
                          <option value="Tecnología">Tecnología</option>
                          <option value="Insignia">Insignia</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-500 uppercase">Rareza</label>
                        <select
                          value={newAsset.rarity}
                          onChange={(e) => setNewAsset(prev => ({ ...prev, rarity: e.target.value as any }))}
                          className="w-full bg-zinc-950 border border-zinc-850 text-zinc-400 rounded px-2 py-1 text-xs focus:outline-none cursor-pointer"
                        >
                          <option value="common">Común</option>
                          <option value="rare">Rara</option>
                          <option value="epic">Épico</option>
                          <option value="legendary">Legendario</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-500 uppercase">Costo Base Metal</label>
                        <input
                          type="number"
                          value={newAsset.baseCostMetal}
                          onChange={(e) => setNewAsset(prev => ({ ...prev, baseCostMetal: parseInt(e.target.value) || 0 }))}
                          className="w-full bg-zinc-950 border border-zinc-850 rounded px-2 py-1 text-white text-xs focus:outline-none text-right"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-500 uppercase">Costo Base Cristal</label>
                        <input
                          type="number"
                          value={newAsset.baseCostCristal}
                          onChange={(e) => setNewAsset(prev => ({ ...prev, baseCostCristal: parseInt(e.target.value) || 0 }))}
                          className="w-full bg-zinc-950 border border-zinc-850 rounded px-2 py-1 text-white text-xs focus:outline-none text-right"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-500 uppercase">Tactical Power Score</label>
                        <input
                          type="number"
                          value={newAsset.basePowerScore}
                          onChange={(e) => setNewAsset(prev => ({ ...prev, basePowerScore: parseInt(e.target.value) || 0 }))}
                          className="w-full bg-zinc-950 border border-zinc-850 rounded px-2 py-1 text-white text-xs focus:outline-none text-right"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setIsAddingAsset(false)}
                        className="px-3.5 py-1.5 bg-zinc-900 border border-zinc-850 text-zinc-400 hover:text-white rounded"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleAddAsset}
                        className="px-5 py-1.5 bg-red-650 hover:bg-red-600 text-white font-bold rounded"
                      >
                        Confirmar Guardado
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Grid-table catalog representation */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] font-mono">
                  <thead>
                    <tr className="border-b border-zinc-900 text-zinc-500 text-[9px] uppercase tracking-wider">
                      <th className="pb-2">ID</th>
                      <th className="pb-2">Nombre Asset</th>
                      <th className="pb-2">Categoría</th>
                      <th className="pb-2 text-right">Costo Metal</th>
                      <th className="pb-2 text-right">Costo Cristal</th>
                      <th className="pb-2 text-center">Power Score</th>
                      <th className="pb-2 text-center">Rango Rarity</th>
                      <th className="pb-2 text-right">Mantenimiento</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900 font-mono">
                    {catalogAssets.map((asset) => (
                      <tr key={asset.id} className="hover:bg-zinc-900/15">
                        <td className="py-2.5 text-zinc-650 font-bold">{asset.id}</td>
                        <td className="py-2.5 text-white font-bold">{asset.name}</td>
                        <td className="py-2.5">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                            asset.category === 'Nave' ? 'bg-cyan-950 text-cyan-400 border border-cyan-900/40' :
                            asset.category === 'Estructura' ? 'bg-purple-950 text-purple-400 border border-purple-900/40' :
                            'bg-amber-950 text-amber-500 border border-amber-900/40'
                          }`}>
                            {asset.category}
                          </span>
                        </td>
                        <td className="py-2.5 text-right font-medium text-zinc-400">{asset.baseCostMetal.toLocaleString()}</td>
                        <td className="py-2.5 text-right font-medium text-zinc-400">{asset.baseCostCristal.toLocaleString()}</td>
                        <td className="py-2.5 text-center font-bold text-red-500">+{asset.basePowerScore} POW</td>
                        <td className="py-2.5 text-center">
                          <span className={`px-2 py-0.2 rounded text-[7.5px] font-bold uppercase ${
                            asset.rarity === 'legendary' ? 'bg-red-500/10 text-red-500' :
                            asset.rarity === 'epic' ? 'bg-purple-500/10 text-purple-400' :
                            asset.rarity === 'rare' ? 'bg-blue-500/10 text-blue-400' : 'bg-zinc-800 text-zinc-400'
                          }`}>
                            {asset.rarity}
                          </span>
                        </td>
                        <td className="py-2.5 text-right space-x-1.5">
                          <button
                            onClick={() => handleRemoveAsset(asset.id)}
                            className="p-1 text-zinc-600 hover:text-red-500 hover:bg-red-600/5 border border-transparent hover:border-red-500/10 rounded transition-all"
                            title="Eliminar de Kernel"
                          >
                            <Trash2 size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>

          </motion.div>
        )}

        {activeSubTab === 'can_alliances' && (
          <motion.div
            key="alliance_can"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            {/* ALLIANCE BUSCADOR MAESTRO */}
            <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-lg space-y-4">
              <span className="text-[10px] font-mono text-zinc-400 block tracking-widest font-bold uppercase">
                🛡️ BUSCADOR Y ENLAZADOR ESPEJO DE CORPORACIONES (ALLIANCE C.A.N)
              </span>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="flex-1 relative">
                  <div className="absolute left-3 top-2.5 text-zinc-650">
                    <Search size={14} />
                  </div>
                  <input
                    type="text"
                    placeholder="Escriba el nombre exacto de la Alianza..."
                    value={allianceSearchQuery}
                    onChange={(e) => setAllianceSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-zinc-900/60 border border-zinc-850 focus:border-red-500 rounded text-xs text-white focus:outline-none placeholder-zinc-700 font-mono transition-colors"
                  />
                </div>
                <button
                  onClick={handleSearchAlliance}
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 hover:shadow-lg active:translate-y-0.5 text-white font-bold text-[10.5px] uppercase tracking-wider rounded transition-all cursor-pointer"
                >
                  CARGAR PERFIL ESPEJO
                </button>
              </div>

              {/* Alliance visual mirror stats hud banner */}
              <div className="p-4 bg-zinc-900/25 border border-zinc-900 rounded-lg grid grid-cols-1 md:grid-cols-4 gap-4">
                
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded border-2 border-indigo-500 flex items-center justify-center font-bold text-white text-xs`}>
                    🛡️
                  </div>
                  <div>
                    <span className="text-white font-bold text-xs tracking-tight block uppercase">{activeAlliance.name}</span>
                    <span className="text-[8.5px] text-zinc-500 font-mono mt-0.5 block">NÚCLEO REGISTRADO ID: {activeAlliance.id}</span>
                  </div>
                </div>

                <div className="p-2.5 bg-black/60 rounded border border-zinc-850 text-center font-mono">
                  <span className="text-[8px] text-zinc-550 block uppercase font-bold">Nivel del Núcleo</span>
                  <span className="text-red-500 font-extrabold text-sm">{activeAlliance.coreLevel}</span>
                </div>

                <div className="p-2.5 bg-black/60 rounded border border-zinc-850 text-center font-mono">
                  <span className="text-[8px] text-zinc-550 block uppercase font-bold">Miembros Registrados</span>
                  <span className="text-zinc-300 font-bold text-sm">{activeAlliance.membersCount} / {activeAlliance.coreLevel * 10}</span>
                </div>

                <div className="p-2.5 bg-black/60 rounded border border-zinc-850 text-center font-mono">
                  <span className="text-[8px] text-zinc-550 block uppercase font-bold">Total Donaciones</span>
                  <span className="text-yellow-500 font-bold text-sm">+{activeAlliance.totalDonationScore.toLocaleString()}</span>
                </div>

              </div>
            </div>

            {/* INYECTOR DE NUCLEO Y BALANCES COMPARTIDOS CLAN */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* CONTROL DE INYECTOR DE NUCLEO */}
              <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-lg space-y-4 self-start">
                <span className="text-[10px] font-mono text-zinc-400 block tracking-widest font-bold uppercase border-b border-zinc-900 pb-1.5 flex items-center gap-2">
                  <TrendingUp size={12} className="text-red-500 shrink-0" />
                  <span>INYECTOR DE NÚCLEO DE ALIANZA (FORZADO MASIVO)</span>
                </span>

                <p className="text-[10.5px] text-zinc-400 leading-normal font-sans">
                  Fuerza instantáneamente el nivel general del clan. Esto recalibra la expansión máxima del roster y los multiplicadores de bonos tácticos orbitales del gremio.
                </p>

                <div className="space-y-3 pt-1">
                  <div className="flex justify-between font-mono text-xs text-zinc-500">
                    <span>Nivel Núcleo Objetivo:</span>
                    <span className="text-red-400 font-bold">Lvl {activeAlliance.coreLevel}</span>
                  </div>
                  
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={activeAlliance.coreLevel}
                    onChange={(e) => handleUpdateAllianceCoreLevel(parseInt(e.target.value))}
                    className="w-full accent-red-600 cursor-pointer h-1.5 bg-zinc-900 rounded-lg appearance-none"
                  />
                  
                  <div className="flex justify-between text-[8px] font-mono text-zinc-600">
                    <span>Lvl 1 (Base)</span>
                    <span>Lvl 5 (Avanzado)</span>
                    <span>Lvl 10 (Titán)</span>
                  </div>
                </div>

                <div className="p-2.5 bg-zinc-900/30 border border-zinc-850 rounded text-[9.5px] leading-relaxed text-zinc-500">
                  ⚠️ <b>ALERTA DE SEGURIDAD:</b> El forzado de nivel de alianza recalibra de manera forzada el kernel de donaciones activas de todos los submiembros federados.
                </div>
              </div>

              {/* ALMACENES COMPARTIDOS DEL CLAN SEC */}
              <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-lg space-y-4 lg:col-span-2">
                <span className="text-[10px] font-mono text-zinc-400 block tracking-widest font-bold uppercase border-b border-zinc-900 pb-1.5 flex items-center gap-2">
                  <Database size={12} className="text-red-500 shrink-0" />
                  <span>INYECTOR DE BÓVEDA COLECTIVA (RECURSOS COMPARTIDOS CLAN)</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4">
                  
                  <div className="p-3 bg-zinc-900/35 border border-zinc-850 rounded space-y-2">
                    <span className="text-[10.5px] font-bold font-mono text-zinc-400 block">Metal de Clan</span>
                    <input
                      type="number"
                      value={activeAlliance.sharedMetalVault}
                      onChange={(e) => setActiveAlliance(prev => ({
                        ...prev,
                        sharedMetalVault: parseInt(e.target.value) || 0
                      }))}
                      className="w-full bg-black border border-zinc-800 rounded px-2.5 py-1 text-xs text-white text-right font-mono font-bold"
                    />
                    <span className="text-[8.5px] text-zinc-550 block font-mono text-right">Límite: 50M de Metal</span>
                  </div>

                  <div className="p-3 bg-zinc-900/35 border border-zinc-850 rounded space-y-2">
                    <span className="text-[10.5px] font-bold font-mono text-cyan-400 block">Cristal de Clan</span>
                    <input
                      type="number"
                      value={activeAlliance.sharedCristalVault}
                      onChange={(e) => setActiveAlliance(prev => ({
                        ...prev,
                        sharedCristalVault: parseInt(e.target.value) || 0
                      }))}
                      className="w-full bg-black border border-zinc-800 rounded px-2.5 py-1 text-xs text-white text-right font-mono font-bold"
                    />
                    <span className="text-[8.5px] text-zinc-550 block font-mono text-right">Límite: 30M de Cristal</span>
                  </div>

                  <div className="p-3 bg-zinc-900/35 border border-zinc-850 rounded space-y-2">
                    <span className="text-[10.5px] font-bold font-mono text-sky-400 block">Deuterio de Clan</span>
                    <input
                      type="number"
                      value={activeAlliance.sharedDeuterioVault}
                      onChange={(e) => setActiveAlliance(prev => ({
                        ...prev,
                        sharedDeuterioVault: parseInt(e.target.value) || 0
                      }))}
                      className="w-full bg-black border border-zinc-800 rounded px-2.5 py-1 text-xs text-white text-right font-mono font-bold"
                    />
                    <span className="text-[8.5px] text-zinc-550 block font-mono text-right">Límite: 15M de Deuterio</span>
                  </div>

                </div>

                <div className="flex justify-end pt-2 border-t border-zinc-900">
                  <button
                    onClick={handleSaveAllianceVault}
                    className="px-6 py-2 bg-red-600 hover:bg-red-500 active:translate-y-0.5 text-white font-bold text-xs uppercase tracking-wider rounded transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Save size={13} />
                    <span>Inyectar Variables en Bóveda</span>
                  </button>
                </div>

              </div>

              {/* CORPORATE TAXATION (SISTEMA DE IMPUESTOS) */}
              <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-lg space-y-4">
                <span className="text-[10px] font-mono text-zinc-400 block tracking-widest font-bold uppercase border-b border-zinc-900 pb-1.5 flex items-center justify-between">
                  <span>💰 IMPUESTOS DE CORPORACIÓN (TAX RATE)</span>
                  <span className="text-[8px] text-zinc-500 uppercase font-mono">Retención Automática</span>
                </span>
                
                <p className="text-[10.5px] text-zinc-400 font-sans leading-relaxed">
                  Configura el porcentaje de recolección de minería de cada miembro que es redirigido directamente al Vault Compartido de la corporación.
                </p>

                <div className="pt-2">
                  <div className="flex justify-between text-xs font-mono text-zinc-400 mb-2">
                    <span>Tasa de Retención Actual:</span>
                    <span className="text-emerald-400 font-bold">{activeAlliance.taxRate ?? 0}%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={activeAlliance.taxRate ?? 0}
                      onChange={(e) => setActiveAlliance(prev => ({ ...prev, taxRate: parseInt(e.target.value) }))}
                      className="w-full h-1.5 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>
                  <div className="flex justify-between text-[8px] font-mono text-zinc-600 mt-2">
                    <span>0% (Libre Mercado)</span>
                    <span>10% (Equilibrado)</span>
                    <span>20% (Régimen Autoritario)</span>
                  </div>
                </div>

                <div className="p-2.5 bg-emerald-950/10 border border-emerald-900/30 rounded text-[9.5px] text-zinc-500 leading-normal">
                  <span className="text-emerald-400 font-bold">Proyección Diaria Est.:</span> Con {activeAlliance.membersCount} miembros activos, un impuesto del {activeAlliance.taxRate ?? 0}% generará aprox. +{((activeAlliance.taxRate ?? 0) * 125000).toLocaleString()} Metal por día al Vault.
                </div>
              </div>

            </div>

            {/* ASYNCHRONOUS WAR CONSOLE */}
            <div className="p-4 bg-zinc-950 border border-red-900/30 rounded-lg space-y-4 mt-6">
              <span className="text-[10px] font-mono text-red-400 block tracking-widest font-bold uppercase border-b border-red-900/20 pb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-2">⚔️ CONSOLA DE GUERRA ASÍNCRONA (MATCHMAKING)</span>
                <span className="text-[8px] text-red-500 bg-red-950/40 px-1.5 py-0.5 rounded uppercase border border-red-900/40">Conflicto Táctico</span>
              </span>

              <p className="text-[10.5px] text-zinc-400 font-sans leading-relaxed">
                Forzar o simular la resolución de un conflicto bélico asíncrono entre dos corporaciones. El motor de batalla en Deno calculará las bajas basándose en el Poder Táctico Global de ambos bandos.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                
                {/* ALIANZA A (ACTUAL) */}
                <div className="p-4 bg-zinc-900/40 border border-zinc-800 rounded-lg text-center space-y-2">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">Defensor</span>
                  <span className="text-white font-bold block truncate">{activeAlliance.name}</span>
                  <span className="text-xs text-blue-400 font-mono block">Poder Táctico: {(activeAlliance.coreLevel * 1450000).toLocaleString()}</span>
                </div>

                {/* VS CONTROLS */}
                <div className="text-center space-y-4">
                  <div className="text-2xl font-black italic text-zinc-700">VS</div>
                  <button
                    onClick={() => setIsAlertToShow({
                      show: true,
                      status: 'success',
                      message: '⚔️ Payload enviado a Supabase Edge Functions. Guerra calculada. Resultado: Victoria de ' + activeAlliance.name
                    })}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-[10px] uppercase font-bold tracking-wider rounded transition-colors w-full cursor-pointer"
                  >
                    Resolver Conflicto
                  </button>
                </div>

                {/* ALIANZA B (ENEMIGO) */}
                <div className="p-4 bg-zinc-900/40 border border-zinc-800 rounded-lg text-center space-y-2">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">Agresor Objetivo</span>
                  <input
                    type="text"
                    placeholder="ID o Nombre Corporación"
                    className="w-full bg-black border border-zinc-800 text-center text-xs text-white p-1.5 rounded focus:border-red-500 focus:outline-none"
                  />
                  <span className="text-[9px] text-red-400 font-mono block animate-pulse mt-2">Consultando tácticas...</span>
                </div>

              </div>

            </div>

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
