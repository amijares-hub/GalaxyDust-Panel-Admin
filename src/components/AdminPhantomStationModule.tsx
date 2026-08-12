import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Ghost, RefreshCw, Hammer, Trash2, Plus, Sliders, Database,
  Shield, TrendingUp, DollarSign, Calendar, FileText, CheckCircle,
  Flame, ToggleLeft, ToggleRight, Sparkles, AlertTriangle, ShieldCheck,
  Settings, Info, Power, RefreshCcw, HelpCircle, Layers, FolderPlus,
  ArrowRightLeft, Eye, Tag, X
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import { GalaxyDustConfig, UserProfile, PhantomStationConfig } from '../types';
import { supabase } from '../lib/supabase';

interface AdminPhantomStationModuleProps {
  gameHud: GalaxyDustConfig;
  users: UserProfile[];
  onSaveGameHud: (updatedHud: GalaxyDustConfig) => void;
  setIsAlertToShow: (alert: { show: boolean; status: 'success' | 'error' | 'warning'; message: string }) => void;
}

export interface PhantomCustomItem {
  id: string;
  name: string;
  category: string;
  rarity: string;
  priceValue: number;
  currencyType: string;
  storageLeft: number;
  discountPercent: number;
}

export interface PhantomRotationList {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  items: PhantomCustomItem[];
}

export interface RealDbAsset {
  id: string;
  name: string;
  category: string;
  rarity: string;
  defaultPrice: number;
  defaultCurrency: string;
}

const RARITY_STATS = {
  Common: { color: 'text-zinc-400', bg: 'bg-zinc-900', border: 'border-zinc-700', stats: '+0% Base Stats' },
  Rare: { color: 'text-blue-400', bg: 'bg-blue-950', border: 'border-blue-800', stats: '+5% Drop Rate' },
  Epic: { color: 'text-purple-400', bg: 'bg-purple-950', border: 'border-purple-800', stats: '+15% Crit Chance' },
  Legendary: { color: 'text-amber-400', bg: 'bg-amber-950', border: 'border-amber-800', stats: '+25% All Stats' },
  Exclusive: { color: 'text-red-400', bg: 'bg-red-950', border: 'border-red-800', stats: '+35% Event Bonus' },
  Heroic: { color: 'text-cyan-400', bg: 'bg-cyan-950', border: 'border-cyan-800', stats: '+50% Boss Damage' }
};

const RarityBadge = ({ rank }: { rank: string }) => {
  const [isHovered, setIsHovered] = useState(false);
  const raw = String(rank || 'Common').trim();
  let normRank = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
  if (normRank === 'S') normRank = 'Legendary';
  else if (normRank === 'A') normRank = 'Epic';
  else if (normRank === 'C') normRank = 'Rare';
  else if (normRank === 'E') normRank = 'Common';

  const conf = RARITY_STATS[normRank as keyof typeof RARITY_STATS] || RARITY_STATS.Common;

  return (
    <div
      className="relative inline-flex items-center justify-center cursor-help mx-1 font-mono"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest border ${conf.color} ${conf.bg.replace('950', '950/25').replace('900', '900/40')} ${conf.border.replace('800', '900/40')}`}>
        {normRank}
      </span>
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 z-[100] whitespace-nowrap bg-zinc-950/90 backdrop-blur-md border border-zinc-800 px-2 py-1.5 rounded-md shadow-xl flex items-center gap-1"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${conf.bg.replace('950', '500').replace('900', '400')}`} />
            <span className="text-[9px] font-mono text-zinc-300">{conf.stats}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function AdminPhantomStationModule({
  gameHud,
  users,
  onSaveGameHud,
  setIsAlertToShow
}: AdminPhantomStationModuleProps) {
  const [activeTab, setActiveTab] = useState<'rotation_lists' | 'store_manager' | 'refresh_engine' | 'events_ops' | 'economy_audit'>('rotation_lists');

  // Catálogo de assets reales consultados desde Supabase
  const [dbAssetsCatalog, setDbAssetsCatalog] = useState<RealDbAsset[]>([]);
  const [loadingDbAssets, setLoadingDbAssets] = useState<boolean>(true);

  // Cargar estado base de la estación
  const [phantomStation, setPhantomStation] = useState<PhantomStationConfig>(() => {
    const base = gameHud.phantomStation || {} as PhantomStationConfig;
    return {
      phantomCrystalsBalance: base.phantomCrystalsBalance || 14500,
      recentTelemetryLogs: base.recentTelemetryLogs || [],
      autoRefreshStockTimerSeconds: base.autoRefreshStockTimerSeconds || 680,
      refreshAttemptsUsed: base.refreshAttemptsUsed !== undefined ? base.refreshAttemptsUsed : 0,
      refreshAttemptsMax: base.refreshAttemptsMax || 90,
      autoRefreshEnabled: base.autoRefreshEnabled !== undefined ? base.autoRefreshEnabled : true,
      refreshCostVoidCrystals: base.refreshCostVoidCrystals !== undefined ? base.refreshCostVoidCrystals : 10,
      unitsCatalog: base.unitsCatalog || [],
      suppliesCatalog: base.suppliesCatalog || [],
      selectedBadgeDiscount: base.selectedBadgeDiscount || 'Insignia Nova Guardian 2026',
      badgeDiscountPercent: base.badgeDiscountPercent !== undefined ? base.badgeDiscountPercent : 5,
      badgeDiscountCategories: base.badgeDiscountCategories || ['Naves', 'Estructuras'],
      totalBlueprintsGoal: base.totalBlueprintsGoal !== undefined ? base.totalBlueprintsGoal : 50,
      loyaltyRewardType: base.loyaltyRewardType || 'Origin Box',
      npcName: base.npcName || 'Síndico Coloidal',
      npcAvatar: base.npcAvatar || 'colloidal_syndicate',
      npcGreeting: base.npcGreeting || 'TODO TIENE UN VALOR',
      terminalStateOnline: base.terminalStateOnline !== undefined ? base.terminalStateOnline : true,
      freeRefreshCountdown: base.freeRefreshCountdown !== undefined ? base.freeRefreshCountdown : 831,
      freeRefreshIntervalType: base.freeRefreshIntervalType || '12_hours',
    };
  });

  // 📦 3 COLECCIONES DE PRUEBA CON ASSETS REALES DE LA BASE DE DATOS
  const [rotationLists, setRotationLists] = useState<PhantomRotationList[]>(() => {
    const saved = localStorage.getItem('phantom_rotation_lists');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved); 
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) { console.error(e); }
    }
    return [
      {
        id: 'list-1',
        name: 'Colección 1: Armada Estelar (Naves)',
        description: 'Cazas y naves capitanas de la flota principal.',
        isActive: true,
        items: [
          { id: 'ship-1', name: 'Sasori Apex Devastator Mk1', category: 'Naves', rarity: 'Legendary', priceValue: 45000, currencyType: 'GD Coins', storageLeft: 5, discountPercent: 0 },
          { id: 'ship-2', name: 'Imperator Sovereign Prime', category: 'Naves', rarity: 'Legendary', priceValue: 38000, currencyType: 'Quantum Tokens', storageLeft: 3, discountPercent: 5 },
          { id: 'ship-3', name: 'Phantasm Void Stalker Mk5', category: 'Naves', rarity: 'Phantom', priceValue: 25000, currencyType: 'Phantom Coins', storageLeft: 8, discountPercent: 10 }
        ]
      },
      {
        id: 'list-2',
        name: 'Colección 2: Extracción & Minería',
        description: 'Estructuras mineras, recolectores y herramientas de sector.',
        isActive: false,
        items: [
          { id: 'struct-1', name: 'Mina de Orichaltron Hassac-X', category: 'Estructuras', rarity: 'Epic', priceValue: 18000, currencyType: 'GD Coins', storageLeft: 10, discountPercent: 15 },
          { id: 'ship-min-1', name: 'Helix Mining Harvester', category: 'Naves', rarity: 'Rare', priceValue: 8500, currencyType: 'Phantom Coins', storageLeft: 15, discountPercent: 0 },
          { id: 'tool-1', name: 'Inara Metal Tool', category: 'Herramientas', rarity: 'Rare', priceValue: 3200, currencyType: 'Phantom Coins', storageLeft: 20, discountPercent: 5 }
        ]
      },
      {
        id: 'list-3',
        name: 'Colección 3: Tecnología & Hiperespacio',
        description: 'Laboratorios cuánticos, propulsores e inyectores de tiempo.',
        isActive: false,
        items: [
          { id: 'struct-2', name: 'Laboratorio Cuántico Dramco', category: 'Estructuras', rarity: 'Legendary', priceValue: 32000, currencyType: 'GD Coins', storageLeft: 4, discountPercent: 10 },
          { id: 'tech-1', name: 'Propulsor de Hiperespacio Cuántico', category: 'Tecnologías', rarity: 'Legendary', priceValue: 12000, currencyType: 'Quantum Tokens', storageLeft: 6, discountPercent: 0 },
          { id: 'item-boost', name: 'Chronos Time-Booster T3', category: 'Consumibles', rarity: 'Epic', priceValue: 2400, currencyType: 'GD Coins', storageLeft: 12, discountPercent: 20 }
        ]
      }
    ];
  });

  const [activeListId, setActiveListId] = useState<string>(() => {
    const active = rotationLists.find(l => l.isActive);
    return active ? active.id : (rotationLists[0]?.id || '');
  });

  // Cargar catálogo de assets reales desde Supabase (seed_ships, seed_structures, seed_technologies, seed_tools)
  useEffect(() => {
    const fetchRealDbCatalog = async () => {
      setLoadingDbAssets(true);
      try {
        const [shipsRes, structsRes, techsRes, toolsRes] = await Promise.all([
          supabase.from('seed_ships').select('ship_id, ship_name, rarity'),
          supabase.from('seed_structures').select('id, name, rarity'),
          supabase.from('seed_technologies').select('id, name, rarity'),
          supabase.from('seed_tools').select('id, name, rarity')
        ]);

        const catalog: RealDbAsset[] = [];

        (shipsRes.data || []).forEach((s: any) => {
          catalog.push({
            id: s.ship_id,
            name: s.ship_name || 'Nave Estelar',
            category: 'Naves',
            rarity: s.rarity || 'Common',
            defaultPrice: 15000,
            defaultCurrency: 'GD Coins'
          });
        });

        (structsRes.data || []).forEach((s: any) => {
          catalog.push({
            id: s.id,
            name: s.name || 'Estructura',
            category: 'Estructuras',
            rarity: s.rarity || 'Common',
            defaultPrice: 12000,
            defaultCurrency: 'GD Coins'
          });
        });

        (techsRes.data || []).forEach((t: any) => {
          catalog.push({
            id: t.id,
            name: t.name || 'Tecnología',
            category: 'Tecnologías',
            rarity: t.rarity || 'Common',
            defaultPrice: 8000,
            defaultCurrency: 'Quantum Tokens'
          });
        });

        (toolsRes.data || []).forEach((tl: any) => {
          catalog.push({
            id: tl.id,
            name: tl.name || 'Herramienta',
            category: 'Herramientas',
            rarity: tl.rarity || 'Common',
            defaultPrice: 3500,
            defaultCurrency: 'Phantom Coins'
          });
        });

        setDbAssetsCatalog(catalog);
      } catch (err) {
        console.error("Error al cargar catálogo semilla para Phantom Station:", err);
      } finally {
        setLoadingDbAssets(false);
      }
    };

    fetchRealDbCatalog();
  }, []);

  // Formulario de Nueva Lista
  const [newListName, setNewListName] = useState('');
  const [newListDesc, setNewListDesc] = useState('');

  // Formulario de Agregar Asset Manual
  const [selectedDbAssetId, setSelectedDbAssetId] = useState<string>('');
  const [targetListId, setTargetListId] = useState<string>('');
  const [customItemName, setCustomItemName] = useState('');
  const [customCategory, setCustomCategory] = useState('Naves');
  const [customRarity, setCustomRarity] = useState('Common');
  const [customPrice, setCustomPrice] = useState<number>(1000);
  const [customCurrency, setCustomCurrency] = useState('GD Coins');
  const [customStock, setCustomStock] = useState<number>(10);
  const [customDiscount, setCustomDiscount] = useState<number>(0);

  // Auto-completar desde el catálogo DB cuando cambia la selección
  useEffect(() => {
    if (selectedDbAssetId && dbAssetsCatalog.length > 0) {
      const asset = dbAssetsCatalog.find(a => a.id === selectedDbAssetId);
      if (asset) {
        setCustomItemName(asset.name);
        setCustomCategory(asset.category);
        setCustomRarity(asset.rarity);
        setCustomPrice(asset.defaultPrice);
        setCustomCurrency(asset.defaultCurrency);
      }
    }
  }, [selectedDbAssetId, dbAssetsCatalog]);

  // Sincronización con gameHud
  useEffect(() => {
    if (gameHud.phantomStation) {
      setPhantomStation(prev => ({
        ...prev,
        ...gameHud.phantomStation
      }));
    }
  }, [gameHud]);

  // Guardado de Listas en localStorage
  useEffect(() => {
    localStorage.setItem('phantom_rotation_lists', JSON.stringify(rotationLists));
  }, [rotationLists]);

  const saveToGlobalAndHUD = (updatedPhantom: typeof phantomStation) => {
    setPhantomStation(updatedPhantom);
    onSaveGameHud({
      ...gameHud,
      phantomStation: updatedPhantom
    });
  };

  const alertTrigger = (status: 'success' | 'error' | 'warning', message: string) => {
    setIsAlertToShow({ show: true, status, message });
  };

  // ── 1. CREAR NUEVA COLECCIÓN/LISTA ──
  const handleCreateRotationList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;

    const newList: PhantomRotationList = {
      id: `list-${Date.now().toString(36)}`,
      name: newListName.trim(),
      description: newListDesc.trim() || 'Colección de rotación de activos reales.',
      isActive: rotationLists.length === 0,
      items: []
    };

    setRotationLists(prev => [...prev, newList]);
    if (rotationLists.length === 0) setActiveListId(newList.id);

    setNewListName('');
    setNewListDesc('');
    alertTrigger('success', `✅ Colección [${newList.name}] creada correctamente.`);
  };

  // ── 2. AGREGAR ÍTEM MANUALMENTE A UNA COLECCIÓN ──
  const handleAddCustomItemToList = (e: React.FormEvent) => {
    e.preventDefault();
    const destId = targetListId || activeListId || rotationLists[0]?.id;
    if (!destId || !customItemName.trim()) {
      alertTrigger('error', 'Selecciona una colección y escribe o selecciona un activo.');
      return;
    }

    const newItem: PhantomCustomItem = {
      id: selectedDbAssetId || `asset-${Date.now().toString(36)}`,
      name: customItemName.trim(),
      category: customCategory,
      rarity: customRarity,
      priceValue: Number(customPrice) || 1000,
      currencyType: customCurrency,
      storageLeft: Number(customStock) || 10,
      discountPercent: Number(customDiscount) || 0
    };

    setRotationLists(prev => prev.map(list => {
      if (list.id === destId) {
        return {
          ...list,
          items: [...list.items, newItem]
        };
      }
      return list;
    }));

    if (destId === activeListId) {
      applyListToStationOffers(destId);
    }

    setCustomItemName('');
    setSelectedDbAssetId('');
    alertTrigger('success', `➕ Activo real [${newItem.name}] agregado a la colección.`);
  };

  // ── 3. ELIMINAR ÍTEM DE UNA COLECCIÓN ──
  const handleDeleteItemFromList = (listId: string, itemId: string) => {
    setRotationLists(prev => prev.map(list => {
      if (list.id === listId) {
        return {
          ...list,
          items: list.items.filter(i => i.id !== itemId)
        };
      }
      return list;
    }));

    if (listId === activeListId) {
      applyListToStationOffers(listId);
    }
  };

  // ── 4. ELIMINAR COLECCIÓN COMPLETA ──
  const handleDeleteRotationList = (listId: string) => {
    if (rotationLists.length <= 1) {
      alertTrigger('error', 'Debe existir al menos una colección en el sistema.');
      return;
    }

    setRotationLists(prev => prev.filter(l => l.id !== listId));
    if (activeListId === listId) {
      const remaining = rotationLists.filter(l => l.id !== listId);
      if (remaining.length > 0) {
        handleSetActiveRotationList(remaining[0].id);
      }
    }
  };

  // ── 5. ACTIVAR UNA LISTA ESPECÍFICA EN LA PHANTOM STATION ──
  const handleSetActiveRotationList = (listId: string) => {
    setActiveListId(listId);
    setRotationLists(prev => prev.map(l => ({
      ...l,
      isActive: l.id === listId
    })));

    applyListToStationOffers(listId);
    alertTrigger('success', `🔄 Colección activa cambiada a [${rotationLists.find(l => l.id === listId)?.name}].`);
  };

  const applyListToStationOffers = (listId: string) => {
    const activeList = rotationLists.find(l => l.id === listId);
    if (!activeList) return;

    const mappedOffers = activeList.items.map(i => ({
      id: i.id,
      name: i.name,
      discountPercent: i.discountPercent,
      timeReductionSeconds: 1800,
      currencyType: i.currencyType,
      priceValue: i.priceValue,
      storageLeft: i.storageLeft,
      category: i.category,
      rank: i.rarity
    }));

    const updatedCatalog = {
      ...phantomStation,
      suppliesCatalog: mappedOffers as any
    };

    saveToGlobalAndHUD(updatedCatalog);
  };

  // ── 6. ROTAR AUTOMÁTICAMENTE A LA SIGUIENTE COLECCIÓN ──
  const handleRotateToNextList = () => {
    if (rotationLists.length === 0) return;

    const currentIndex = rotationLists.findIndex(l => l.id === activeListId);
    const nextIndex = (currentIndex + 1) % rotationLists.length;
    const nextList = rotationLists[nextIndex];

    handleSetActiveRotationList(nextList.id);
  };

  const [burntLogs] = useState([
    { hour: '04:00', burnt: 340, activePlayers: 15 },
    { hour: '08:00', burnt: 520, activePlayers: 18 },
    { hour: '12:00', burnt: 810, activePlayers: 29 },
    { hour: '16:00', burnt: 1450, activePlayers: 42 },
    { hour: '20:00', burnt: 2200, activePlayers: 54 },
    { hour: 'Ahora', burnt: 1840, activePlayers: 38 }
  ]);

  const [eventStoreActive, setEventStoreActive] = useState<boolean>(() => localStorage.getItem('phantom_event_store_active') === 'true');

  return (
    <div className="space-y-6 font-mono text-xs text-left text-white select-none">

      {/* CABECERA RESUMEN */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-5 bg-zinc-950 border border-zinc-900 rounded-xl gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Ghost className="text-[#ff1e1e] h-5 w-5 animate-pulse shrink-0" />
            <span className="font-bold text-white text-md tracking-wider uppercase">PHANTOM STATION // CONTROL DE ROTACIÓN Y COLECCIONES</span>
          </div>
          <p className="text-[11px] text-zinc-500 font-sans leading-relaxed">
            Consola central para agregar activos reales manualmente, crear colecciones de rotación y calibrar el motor de refrescos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRotateToNextList}
            className="px-3.5 py-2 bg-red-650 hover:bg-red-500 text-white font-bold text-[10px] uppercase rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-red-950/40 active:scale-95 font-mono"
          >
            <ArrowRightLeft size={13} />
            ROTAR A SIGUIENTE COLECCIÓN
          </button>
        </div>
      </div>

      {/* METRIC CARD STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-4 flex flex-col justify-between h-24">
          <span className="text-[9.5px] text-zinc-500 font-bold uppercase tracking-wider">Colecciones de Rotación</span>
          <div>
            <span className="text-lg font-black text-white block">{rotationLists.length} Listas</span>
            <p className="text-[9.5px] text-zinc-500 mt-0.5">Listas configuradas con assets reales</p>
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-4 flex flex-col justify-between h-24 border-l-2 border-l-[#ff1e1e]">
          <span className="text-[9.5px] text-[#ff1e1e] font-bold uppercase tracking-wider">Colección Activa en Pantalla</span>
          <div>
            <span className="text-sm font-black text-amber-400 block truncate">{rotationLists.find(l => l.id === activeListId)?.name || 'Sin Selección'}</span>
            <p className="text-[9.5px] text-zinc-500 mt-0.5">{phantomStation.suppliesCatalog.length} activos mostrándose</p>
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-4 flex flex-col justify-between h-24">
          <span className="text-[9.5px] text-zinc-500 font-bold uppercase tracking-wider">Temporizador de Rotación</span>
          <div>
            <span className="text-lg font-black text-yellow-500 block">{(phantomStation.autoRefreshStockTimerSeconds / 60).toFixed(1)} min</span>
            <p className="text-[9.5px] text-zinc-500 mt-0.5">Frecuencia de cambio automático</p>
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-4 flex flex-col justify-between h-24">
          <span className="text-[9.5px] text-zinc-500 font-bold uppercase tracking-wider">Estado de Terminal</span>
          <div>
            <span className={`text-sm font-black block ${phantomStation.terminalStateOnline ? 'text-emerald-400' : 'text-red-500'}`}>
              {phantomStation.terminalStateOnline ? 'ONLINE' : 'OFFLINE'}
            </span>
            <p className="text-[9.5px] text-zinc-500 mt-0.5">Disponibilidad en cliente</p>
          </div>
        </div>
      </div>

      {/* PESTAÑAS DE NAVEGACIÓN */}
      <div className="flex border-b border-zinc-900 overflow-x-auto gap-1">
        {[
          { id: 'rotation_lists', label: '📂 1) Listas & Colecciones de Rotación' },
          { id: 'store_manager', label: '🛒 2) Visualización de Tienda Activa' },
          { id: 'refresh_engine', label: '⚙️ 3) Motor de Refrescos & Peajes' },
          { id: 'events_ops', label: '⚡ 4) Eventos & LiveOps' },
          { id: 'economy_audit', label: '📊 5) Auditoría Económica' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'text-[#ff1e1e] border-[#ff1e1e] bg-zinc-900/40'
                : 'text-zinc-500 border-transparent hover:text-zinc-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* PANEL PRINCIPAL */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-6">

        {/* ── 🎯 PESTAÑA 1: LISTAS Y COLECCIONES DE ROTACIÓN ── */}
        {activeTab === 'rotation_lists' && (
          <div className="space-y-6 animate-fadeIn">

            {/* FORMULARIO DE AGREGAR ITEM MANUAL + CREAR LISTA */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

              {/* A. Crear Nueva Colección */}
              <form onSubmit={handleCreateRotationList} className="bg-zinc-900/40 border border-zinc-850 p-4 rounded-xl space-y-3">
                <span className="text-cyan-400 font-bold text-[10px] uppercase tracking-widest block border-b border-zinc-800 pb-2 flex items-center gap-1.5">
                  <FolderPlus size={14} /> CREAR NUEVA COLECCIÓN DE ROTACIÓN
                </span>

                <div>
                  <label className="text-zinc-500 text-[9px] uppercase font-bold block mb-1">Nombre de la Colección:</label>
                  <input
                    type="text"
                    placeholder="Ej. Colección de Evento Verano, Rotación Épica..."
                    value={newListName}
                    onChange={e => setNewListName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded text-white font-bold uppercase text-[11px] outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-zinc-500 text-[9px] uppercase font-bold block mb-1">Descripción Táctica:</label>
                  <input
                    type="text"
                    placeholder="Ej. Colección enfocada en herramientas de minería y naves..."
                    value={newListDesc}
                    onChange={e => setNewListDesc(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded text-zinc-300 text-[11px] outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black py-2 rounded text-[10px] uppercase tracking-wider transition-all cursor-pointer"
                >
                  + Fundar Nueva Colección
                </button>
              </form>

              {/* B. Agregar Activo Manualmente a una Colección (Seleccionando Assets Reales de Supabase) */}
              <form onSubmit={handleAddCustomItemToList} className="bg-zinc-900/40 border border-zinc-850 p-4 rounded-xl space-y-3">
                <span className="text-emerald-400 font-bold text-[10px] uppercase tracking-widest block border-b border-zinc-800 pb-2 flex items-center gap-1.5">
                  <Plus size={14} /> AGREGAR ACTIVO MANUAL O DESDE BD A COLECCIÓN
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-zinc-500 text-[8.5px] uppercase font-bold block mb-0.5">Colección Destino:</label>
                    <select
                      value={targetListId || activeListId}
                      onChange={e => setTargetListId(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 p-1.5 rounded text-white font-bold text-[10px] outline-none cursor-pointer"
                    >
                      {rotationLists.map(l => (
                        <option key={l.id} value={l.id}>{l.name} ({l.items.length} items)</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-zinc-500 text-[8.5px] uppercase font-bold block mb-0.5">Seleccionar de Base de Datos:</label>
                    <select
                      value={selectedDbAssetId}
                      onChange={e => setSelectedDbAssetId(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 p-1.5 rounded text-cyan-300 font-bold text-[10px] outline-none cursor-pointer uppercase"
                    >
                      <option value="">-- Autocompletar desde BD --</option>
                      {dbAssetsCatalog.map(asset => (
                        <option key={asset.id} value={asset.id}>[{asset.category}] {asset.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-zinc-500 text-[8.5px] uppercase font-bold block mb-0.5">Nombre del Activo:</label>
                  <input
                    type="text"
                    placeholder="Ej. Sasori Apex Devastator Mk1..."
                    value={customItemName}
                    onChange={e => setCustomItemName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 p-1.5 rounded text-white font-bold uppercase text-[10px] outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-zinc-500 text-[8.5px] uppercase font-bold block mb-0.5">Categoría:</label>
                    <select
                      value={customCategory}
                      onChange={e => setCustomCategory(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 p-1.5 rounded text-zinc-300 text-[10px] outline-none cursor-pointer"
                    >
                      <option value="Naves">Naves</option>
                      <option value="Estructuras">Estructuras</option>
                      <option value="Tecnologías">Tecnologías</option>
                      <option value="Herramientas">Herramientas</option>
                      <option value="Blueprints">Blueprints</option>
                      <option value="Consumibles">Consumibles</option>
                      <option value="Eventos">Eventos</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-zinc-500 text-[8.5px] uppercase font-bold block mb-0.5">Rareza:</label>
                    <select
                      value={customRarity}
                      onChange={e => setCustomRarity(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 p-1.5 rounded text-zinc-300 text-[10px] outline-none cursor-pointer"
                    >
                      <option value="Common">Common</option>
                      <option value="Rare">Rare</option>
                      <option value="Epic">Epic</option>
                      <option value="Legendary">Legendary</option>
                      <option value="Phantom">Phantom</option>
                      <option value="Exclusive">Exclusive</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-zinc-500 text-[8.5px] uppercase font-bold block mb-0.5">Moneda:</label>
                    <select
                      value={customCurrency}
                      onChange={e => setCustomCurrency(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 p-1.5 rounded text-zinc-300 text-[10px] outline-none cursor-pointer"
                    >
                      <option value="GD Coins">GD Coins</option>
                      <option value="Phantom Coins">Phantom Coins</option>
                      <option value="Quantum Tokens">Quantum Tokens</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-zinc-500 text-[8.5px] uppercase font-bold block mb-0.5">Precio Unitario:</label>
                    <input
                      type="number"
                      min={1}
                      value={customPrice}
                      onChange={e => setCustomPrice(Number(e.target.value))}
                      className="w-full bg-zinc-950 border border-zinc-800 p-1.5 rounded text-yellow-400 font-bold text-[10px] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-500 text-[8.5px] uppercase font-bold block mb-0.5">Stock Inicial:</label>
                    <input
                      type="number"
                      min={1}
                      value={customStock}
                      onChange={e => setCustomStock(Number(e.target.value))}
                      className="w-full bg-zinc-950 border border-zinc-800 p-1.5 rounded text-white text-[10px] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-500 text-[8.5px] uppercase font-bold block mb-0.5">Descuento %:</label>
                    <input
                      type="number"
                      min={0}
                      max={95}
                      value={customDiscount}
                      onChange={e => setCustomDiscount(Number(e.target.value))}
                      className="w-full bg-zinc-950 border border-zinc-800 p-1.5 rounded text-red-400 text-[10px] outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-2 rounded text-[10px] uppercase tracking-wider transition-all cursor-pointer"
                >
                  Inyectar Activo a la Colección
                </button>
              </form>

            </div>

            {/* LISTADO Y ADMINISTRADOR DE COLECCIONES EXISTENTES */}
            <div className="space-y-4 pt-2">
              <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-widest block border-b border-zinc-900 pb-2">
                📂 DIRECTORIO DE COLECCIONES DE ROTACIÓN DISPONIBLES ({rotationLists.length})
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rotationLists.map(list => {
                  const isCurrentActive = list.id === activeListId;

                  return (
                    <div
                      key={list.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isCurrentActive
                          ? 'bg-red-950/20 border-red-500/60 shadow-lg shadow-red-950/30'
                          : 'bg-zinc-900/40 border-zinc-850 hover:border-zinc-800'
                      }`}
                    >
                      <div className="flex justify-between items-start border-b border-zinc-850 pb-2.5 mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-white text-xs uppercase">{list.name}</h4>
                            {isCurrentActive && (
                              <span className="px-2 py-0.5 bg-red-600 text-white text-[8px] font-black rounded uppercase">
                                MOSTRÁNDOSE AHORA
                              </span>
                            )}
                          </div>
                          <p className="text-[9.5px] text-zinc-500 mt-0.5">{list.description}</p>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {!isCurrentActive && (
                            <button
                              onClick={() => handleSetActiveRotationList(list.id)}
                              className="px-2.5 py-1 bg-zinc-900 hover:bg-emerald-950 hover:text-emerald-400 border border-zinc-800 text-zinc-300 text-[9px] font-bold uppercase rounded cursor-pointer transition-colors"
                            >
                              ACTIVAR EN TIENDA
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteRotationList(list.id)}
                            className="p-1 bg-zinc-900 hover:bg-red-950 hover:text-red-400 border border-zinc-800 text-zinc-500 rounded cursor-pointer transition-colors"
                            title="Eliminar Colección"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      {/* ÍTEMS DENTRO DE LA LISTA */}
                      <div className="space-y-2">
                        <span className="text-[8.5px] text-zinc-500 uppercase font-bold block">
                          Contenido ({list.items.length} activos inscritos):
                        </span>

                        {list.items.length === 0 ? (
                          <div className="p-3 text-center text-zinc-600 italic border border-dashed border-zinc-850 rounded text-[9.5px]">
                            Colección vacía. Agrega activos desde el formulario superior.
                          </div>
                        ) : (
                          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                            {list.items.map(item => (
                              <div key={item.id} className="p-2 bg-black/60 border border-zinc-900 rounded flex justify-between items-center text-[10px]">
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-white uppercase">{item.name}</span>
                                    <RarityBadge rank={item.rarity} />
                                  </div>
                                  <span className="text-[8.5px] text-zinc-500">
                                    Cat: {item.category} | Stock: <strong className="text-zinc-300">{item.storageLeft} u</strong>
                                  </span>
                                </div>

                                <div className="flex items-center gap-3">
                                  <span className="text-yellow-400 font-bold">{item.priceValue} {item.currencyType === 'GD Coins' ? 'GD' : item.currencyType === 'Quantum Tokens' ? 'QT' : 'PC'}</span>
                                  <button
                                    onClick={() => handleDeleteItemFromList(list.id, item.id)}
                                    className="text-zinc-600 hover:text-red-400 cursor-pointer p-1"
                                    title="Quitar activo"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* ── 🛒 PESTAÑA 2: VISUALIZACIÓN DE TIENDA ACTIVA ── */}
        {activeTab === 'store_manager' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider block">
                  CÁTALOGO ACTUALIZADO EN LA PHANTOM STATION (MOSTRANDO COLECCIÓN ACTIVA)
                </span>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  Esta lista es la que ven los comandantes en el juego actualmente.
                </p>
              </div>

              <span className="text-amber-400 font-bold bg-amber-950/40 border border-amber-800/60 px-3 py-1 rounded uppercase text-[10px]">
                Listado: {rotationLists.find(l => l.id === activeListId)?.name}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {phantomStation.suppliesCatalog.length === 0 ? (
                <div className="col-span-3 p-12 text-center text-zinc-600 italic border border-dashed border-zinc-900 rounded-xl">
                  Sin activos en exhibición. Selecciona o inyecta ítems en la pestaña de Colecciones.
                </div>
              ) : (
                phantomStation.suppliesCatalog.map((offer: any) => (
                  <div key={offer.id} className="p-4 bg-black/60 border border-zinc-900 rounded-xl space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-white block uppercase text-xs">{offer.name}</span>
                      <RarityBadge rank={offer.rank || 'Common'} />
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono">
                      Precio: <strong className="text-yellow-400">{offer.priceValue || 1000} {offer.currencyType || 'GD Coins'}</strong>
                    </div>
                    <div className="text-[9.5px] text-zinc-500">
                      Stock Restante: <strong className="text-emerald-400">{offer.storageLeft || 10} unidades</strong>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── ⚙️ PESTAÑA 3: MOTOR DE REFRESCOS & PEAJES ── */}
        {activeTab === 'refresh_engine' && (
          <div className="space-y-5 animate-fadeIn">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-widest border-b border-zinc-900 pb-2">
              PARÁMETROS DEL MOTOR DE ROTACIÓN Y PEAJES
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="p-4 bg-black/40 border border-zinc-900 rounded-xl space-y-3">
                <span className="text-white font-bold block uppercase border-b border-zinc-850 pb-1">Configurar Frecuencia de Rotación (Segundos)</span>
                <input
                  type="number"
                  min="60"
                  max="86400"
                  value={phantomStation.autoRefreshStockTimerSeconds}
                  onChange={e => {
                    const val = Number(e.target.value) || 600;
                    saveToGlobalAndHUD({ ...phantomStation, autoRefreshStockTimerSeconds: val });
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded text-emerald-400 font-bold outline-none"
                />
                <span className="text-[9px] text-zinc-500 block">Cada {phantomStation.autoRefreshStockTimerSeconds / 60} minutos el motor cambiará automáticamente de colección.</span>
              </div>

              <div className="p-4 bg-black/40 border border-zinc-900 rounded-xl space-y-3">
                <span className="text-white font-bold block uppercase border-b border-zinc-850 pb-1">Costo de Refresco Manual en Peaje</span>
                <input
                  type="number"
                  min="0"
                  value={phantomStation.refreshCostVoidCrystals}
                  onChange={e => {
                    const val = Number(e.target.value) || 0;
                    saveToGlobalAndHUD({ ...phantomStation, refreshCostVoidCrystals: val });
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded text-purple-400 font-bold outline-none"
                />
                <span className="text-[9px] text-zinc-500 block">Monto en Phantom Coins cobrado al explorador.</span>
              </div>
            </div>
          </div>
        )}

        {/* ── ⚡ PESTAÑA 4: EVENTOS & LIVEOPS ── */}
        {activeTab === 'events_ops' && (
          <div className="space-y-4 animate-fadeIn">
            <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest border-b border-zinc-900 pb-2">
              MODO TEMPORADA Y EVENTOS ESPECIALES
            </h3>

            <div className="p-4 bg-black/40 border border-zinc-900 rounded-xl flex justify-between items-center">
              <div>
                <span className="font-bold text-white block uppercase text-xs">Modo Navideño / Temporada Activo</span>
                <span className="text-[10px] text-zinc-500">Cambia el aspecto visual y habilita ítems exclusivos</span>
              </div>
              <button onClick={() => setEventStoreActive(!eventStoreActive)} className="cursor-pointer">
                {eventStoreActive ? <ToggleRight size={38} className="text-red-500" /> : <ToggleLeft size={38} className="text-zinc-600" />}
              </button>
            </div>
          </div>
        )}

        {/* ── 📊 PESTAÑA 5: AUDITORÍA ECONÓMICA ── */}
        {activeTab === 'economy_audit' && (
          <div className="space-y-4 animate-fadeIn">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-widest border-b border-zinc-900 pb-2">
              AUDITORÍA DE QUEMA Y CONSUMO DE DIVISAS
            </h3>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={burntLogs}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="hour" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#333' }} />
                  <Area type="monotone" dataKey="burnt" stroke="#ff1e1e" fill="#ff1e1e" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}