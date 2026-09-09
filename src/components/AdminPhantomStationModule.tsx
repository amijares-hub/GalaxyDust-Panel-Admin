import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Ghost, RefreshCw, Trash2, Plus, Sliders, Database,
  TrendingUp, DollarSign, Calendar, FileText, CheckCircle,
  Flame, ToggleLeft, ToggleRight, Sparkles, AlertTriangle, ShieldCheck,
  Settings, Info, Power, Layers, FolderPlus, ArrowRightLeft,
  Search, Shuffle, ListOrdered, LayoutGrid, Check, X
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
  displaySlots: number;
  selectionMode: 'sequential' | 'random';
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

  // Catálogo completo de las 10 categorías de assets
  const [dbAssetsCatalog, setDbAssetsCatalog] = useState<RealDbAsset[]>([]);
  const [loadingDbAssets, setLoadingDbAssets] = useState<boolean>(true);

  // Estado base de la estación
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

  // Colecciones con lectura híbrida (LocalStorage + Supabase)
  const [rotationLists, setRotationLists] = useState<PhantomRotationList[]>(() => {
    const local = localStorage.getItem('sasori_phantom_rotation_lists');
    if (local) {
      try { return JSON.parse(local); } catch (e) {}
    }
    return [];
  });
  const [loadingRotationLists, setLoadingRotationLists] = useState<boolean>(true);

  const syncLocalToStorage = (lists: PhantomRotationList[]) => {
    localStorage.setItem('sasori_phantom_rotation_lists', JSON.stringify(lists));
  };

  useEffect(() => {
    const fetchRotationLists = async () => {
      setLoadingRotationLists(true);
      try {
        const { data, error } = await supabase.from('phantom_rotation_config').select('*').order('created_at', { ascending: true });
        if (!error && data && data.length > 0) {
          const parsed = data
            .filter((row: any) => row.id !== 'global_store_settings')
            .map((row: any) => ({
              id: row.id,
              name: row.name,
              description: row.description || '',
              isActive: row.is_active || false,
              items: row.items || [],
              displaySlots: row.display_slots || row.displaySlots || 8,
              selectionMode: row.selection_mode || row.selectionMode || 'sequential'
            }));
          setRotationLists(parsed);
          syncLocalToStorage(parsed);
        }
      } catch (err) {
        console.warn("Utilizando respaldo LocalStorage para Colecciones de Rotación.");
      } finally {
        setLoadingRotationLists(false);
      }
    };

    fetchRotationLists();
  }, []);

  const saveRotationListToDB = async (list: PhantomRotationList) => {
    try {
      const payload = {
        id: list.id,
        name: list.name,
        description: list.description,
        is_active: list.isActive,
        items: list.items,
        display_slots: list.displaySlots,
        selection_mode: list.selectionMode,
        updated_at: new Date().toISOString()
      };
      await supabase.from('phantom_rotation_config').upsert(payload, { onConflict: 'id' });
    } catch (err) {
      console.warn("No se pudo conectar con la tabla de Supabase, guardado en LocalStorage.");
    }
  };

  const deleteRotationListFromDB = async (listId: string) => {
    try {
      await supabase.from('phantom_rotation_config').delete().eq('id', listId);
    } catch (err) {}
  };

  const [activeListId, setActiveListId] = useState<string>(() => {
    const active = rotationLists.find(l => l.isActive);
    return active ? active.id : (rotationLists[0]?.id || '');
  });

  // Carga total de catálogos semilla
  useEffect(() => {
    const fetchRealDbCatalog = async () => {
      setLoadingDbAssets(true);
      try {
        const [
          shipsRes, structsRes, defRes, techsRes, badgesRes,
          bpRes, licRes, toolsRes, consRes, astroRes
        ] = await Promise.all([
          supabase.from('seed_ships').select('ship_id, ship_name, rarity'),
          supabase.from('seed_structures').select('id, name, rarity'),
          supabase.from('seed_defenses').select('defense_id, defense_name, rarity'),
          supabase.from('seed_technologies').select('id, name, rarity'),
          supabase.from('seed_badges').select('id, name, rarity'),
          supabase.from('seed_blueprints').select('id, name, rarity'),
          supabase.from('seed_licenses').select('id, name, rarity'),
          supabase.from('seed_tools').select('id, name, rarity'),
          supabase.from('seed_consumables').select('id, name, rarity'),
          supabase.from('seed_astrobots').select('id, name, rarity')
        ]);

        const catalog: RealDbAsset[] = [];

        (shipsRes.data || []).forEach((s: any) => catalog.push({ id: s.ship_id || s.id, name: s.ship_name || s.name || 'Nave Estelar', category: 'Naves', rarity: s.rarity || 'Common', defaultPrice: 15000, defaultCurrency: 'GD Coins' }));
        (structsRes.data || []).forEach((s: any) => catalog.push({ id: s.id, name: s.name || 'Estructura', category: 'Estructuras', rarity: s.rarity || 'Common', defaultPrice: 12000, defaultCurrency: 'GD Coins' }));
        (defRes.data || []).forEach((d: any) => catalog.push({ id: d.defense_id || d.id, name: d.defense_name || d.name || 'Sistema Defensivo', category: 'Defensas', rarity: d.rarity || 'Common', defaultPrice: 9000, defaultCurrency: 'GD Coins' }));
        (techsRes.data || []).forEach((t: any) => catalog.push({ id: t.id, name: t.name || 'Tecnología', category: 'Tecnologías', rarity: t.rarity || 'Common', defaultPrice: 8000, defaultCurrency: 'Quantum Tokens' }));
        (badgesRes.data || []).forEach((b: any) => catalog.push({ id: b.id, name: b.name || 'Insignia / Badge', category: 'Insignias', rarity: b.rarity || 'Epic', defaultPrice: 5000, defaultCurrency: 'Phantom Coins' }));
        (bpRes.data || []).forEach((bp: any) => catalog.push({ id: bp.id, name: bp.name || 'Blueprint / Plano', category: 'Blueprints', rarity: bp.rarity || 'Rare', defaultPrice: 10000, defaultCurrency: 'GD Coins' }));
        (licRes.data || []).forEach((l: any) => catalog.push({ id: l.id, name: l.name || 'Licencia Estelar', category: 'Licencias', rarity: l.rarity || 'Common', defaultPrice: 6000, defaultCurrency: 'GD Coins' }));
        (toolsRes.data || []).forEach((tl: any) => catalog.push({ id: tl.id, name: tl.name || 'Herramienta de Minería', category: 'Tools', rarity: tl.rarity || 'Common', defaultPrice: 3500, defaultCurrency: 'Phantom Coins' }));
        (consRes.data || []).forEach((c: any) => catalog.push({ id: c.id, name: c.name || 'Consumible', category: 'Consumibles', rarity: c.rarity || 'Common', defaultPrice: 1500, defaultCurrency: 'Phantom Coins' }));
        (astroRes.data || []).forEach((a: any) => catalog.push({ id: a.id, name: a.name || 'Astrobot', category: 'Astrobots', rarity: a.rarity || 'Rare', defaultPrice: 7500, defaultCurrency: 'Quantum Tokens' }));

        setDbAssetsCatalog(catalog);
      } catch (err) {
        console.error("Error cargando catálogos semilla:", err);
      } finally {
        setLoadingDbAssets(false);
      }
    };

    fetchRealDbCatalog();
  }, []);

  // Formulario de Nueva Lista
  const [newListName, setNewListName] = useState('');
  const [newListDesc, setNewListDesc] = useState('');
  const [newListSlots, setNewListSlots] = useState<number>(8);
  const [newListSelectionMode, setNewListSelectionMode] = useState<'sequential' | 'random'>('sequential');

  // Buscador Predictivo Autocomplete
  const [assetSearchQuery, setAssetSearchQuery] = useState<string>('');
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState<boolean>(false);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  const [selectedDbAssetId, setSelectedDbAssetId] = useState<string>('');
  const [targetListId, setTargetListId] = useState<string>('');
  const [customItemName, setCustomItemName] = useState('');
  const [customCategory, setCustomCategory] = useState('Naves');
  const [customRarity, setCustomRarity] = useState('Common');
  const [customPrice, setCustomPrice] = useState<number>(1000);
  const [customCurrency, setCustomCurrency] = useState('GD Coins');
  const [customStock, setCustomStock] = useState<number>(10);
  const [customDiscount, setCustomDiscount] = useState<number>(0);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(e.target as Node)) {
        setIsAutocompleteOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredAutocompleteAssets = useMemo(() => {
    if (!assetSearchQuery.trim()) return dbAssetsCatalog.slice(0, 10);
    const query = assetSearchQuery.toLowerCase();
    return dbAssetsCatalog.filter(a =>
      a.name.toLowerCase().includes(query) ||
      a.id.toLowerCase().includes(query) ||
      a.category.toLowerCase().includes(query)
    ).slice(0, 15);
  }, [dbAssetsCatalog, assetSearchQuery]);

  const handleSelectAutocompleteAsset = (asset: RealDbAsset) => {
    setSelectedDbAssetId(asset.id);
    setCustomItemName(asset.name);
    setCustomCategory(asset.category);
    setCustomRarity(asset.rarity);
    setCustomPrice(asset.defaultPrice);
    setCustomCurrency(asset.defaultCurrency);
    setAssetSearchQuery(`[${asset.category}] ${asset.name}`);
    setIsAutocompleteOpen(false);
  };

  useEffect(() => {
    if (gameHud.phantomStation) {
      setPhantomStation(prev => ({ ...prev, ...gameHud.phantomStation }));
    }
  }, [gameHud]);

  const saveToGlobalAndHUD = (updatedPhantom: typeof phantomStation) => {
    setPhantomStation(updatedPhantom);
    onSaveGameHud({ ...gameHud, phantomStation: updatedPhantom });
  };

  const alertTrigger = (status: 'success' | 'error' | 'warning', message: string) => {
    setIsAlertToShow({ show: true, status, message });
  };

  // ── 1. CREAR NUEVA COLECCIÓN ──
  const handleCreateRotationList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;

    const newList: PhantomRotationList = {
      id: `list-${Date.now().toString(36)}`,
      name: newListName.trim(),
      description: newListDesc.trim() || 'Colección de rotación de activos reales.',
      isActive: rotationLists.length === 0,
      items: [],
      displaySlots: newListSlots,
      selectionMode: newListSelectionMode
    };

    const updated = [...rotationLists, newList];
    setRotationLists(updated);
    syncLocalToStorage(updated);
    saveRotationListToDB(newList);

    if (rotationLists.length === 0) setActiveListId(newList.id);

    setNewListName('');
    setNewListDesc('');
    alertTrigger('success', `✅ Colección [${newList.name}] creada con éxito.`);
  };

  // ── 2. AGREGAR ÍTEM A COLECCIÓN ──
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

    const updatedLists = rotationLists.map(list => {
      if (list.id === destId) {
        const updatedList = { ...list, items: [...list.items, newItem] };
        saveRotationListToDB(updatedList);
        return updatedList;
      }
      return list;
    });

    setRotationLists(updatedLists);
    syncLocalToStorage(updatedLists);

    if (destId === activeListId) {
      applyListToStationOffers(destId, updatedLists);
    }

    setCustomItemName('');
    setSelectedDbAssetId('');
    setAssetSearchQuery('');
    alertTrigger('success', `➕ Activo [${newItem.name}] agregado a la colección.`);
  };

  // ── 3. ELIMINAR ÍTEM DE COLECCIÓN ──
  const handleDeleteItemFromList = (listId: string, itemId: string) => {
    const updatedLists = rotationLists.map(list => {
      if (list.id === listId) {
        const updatedList = { ...list, items: list.items.filter(i => i.id !== itemId) };
        saveRotationListToDB(updatedList);
        return updatedList;
      }
      return list;
    });

    setRotationLists(updatedLists);
    syncLocalToStorage(updatedLists);

    if (listId === activeListId) {
      applyListToStationOffers(listId, updatedLists);
    }
  };

  // ── 4. ELIMINAR COLECCIÓN ──
  const handleDeleteRotationList = (listId: string) => {
    const updatedLists = rotationLists.filter(l => l.id !== listId);
    setRotationLists(updatedLists);
    syncLocalToStorage(updatedLists);
    deleteRotationListFromDB(listId);

    if (activeListId === listId && updatedLists.length > 0) {
      handleSetActiveRotationList(updatedLists[0].id);
    }
  };

  // ── 5. ACTUALIZAR CONFIGURACIÓN DE COLECCIÓN ──
  const handleUpdateCollectionSettings = (listId: string, slots: number, mode: 'sequential' | 'random') => {
    const updatedLists = rotationLists.map(list => {
      if (list.id === listId) {
        const updated = { ...list, displaySlots: slots, selectionMode: mode };
        saveRotationListToDB(updated);
        return updated;
      }
      return list;
    });

    setRotationLists(updatedLists);
    syncLocalToStorage(updatedLists);

    if (listId === activeListId) {
      applyListToStationOffers(listId, updatedLists);
    }
    alertTrigger('success', `⚙️ Colección actualizada (${slots} Tarjetas | Modo: ${mode.toUpperCase()}).`);
  };

  // ── 6. ACTIVAR COLECCIÓN EN TIENDA ──
  const handleSetActiveRotationList = (listId: string) => {
    setActiveListId(listId);
    const updatedLists = rotationLists.map(l => {
      const updated = { ...l, isActive: l.id === listId };
      saveRotationListToDB(updated);
      return updated;
    });

    setRotationLists(updatedLists);
    syncLocalToStorage(updatedLists);

    applyListToStationOffers(listId, updatedLists);
    alertTrigger('success', `🔄 Colección activa cambiada a [${rotationLists.find(l => l.id === listId)?.name}].`);
  };

  const applyListToStationOffers = (listId: string, currentLists = rotationLists) => {
    const activeList = currentLists.find(l => l.id === listId);
    if (!activeList || activeList.items.length === 0) {
      saveToGlobalAndHUD({ ...phantomStation, suppliesCatalog: [] });
      return;
    }

    const slotCount = Math.min(8, Math.max(1, activeList.displaySlots || 8));
    let selectedItems: PhantomCustomItem[] = [];

    if (activeList.selectionMode === 'random') {
      const shuffled = [...activeList.items].sort(() => Math.random() - 0.5);
      selectedItems = shuffled.slice(0, slotCount);
    } else {
      selectedItems = activeList.items.slice(0, slotCount);
    }

    const mappedOffers = selectedItems.map(i => ({
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

    saveToGlobalAndHUD({ ...phantomStation, suppliesCatalog: mappedOffers as any });
  };

  const handleRotateToNextList = () => {
    if (rotationLists.length === 0) return;
    const currentIndex = rotationLists.findIndex(l => l.id === activeListId);
    const nextIndex = (currentIndex + 1) % rotationLists.length;
    handleSetActiveRotationList(rotationLists[nextIndex].id);
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
  const activeCollectionObj = rotationLists.find(l => l.id === activeListId);

  return (
    <div className="space-y-6 font-mono text-xs text-left text-white select-none p-2 md:p-6">

      {/* CABECERA RESUMEN */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-5 bg-zinc-950 border border-zinc-900 rounded-xl gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Ghost className="text-[#ff1e1e] h-5 w-5 animate-pulse shrink-0" />
            <span className="font-bold text-white text-md tracking-wider uppercase">PHANTOM STATION // CONTROL DE ROTACIÓN & CATALOGACIÓN</span>
          </div>
          <p className="text-[11px] text-zinc-500 font-sans leading-relaxed">
            Administración completa de colecciones, asignación de tarjetas de la tienda (1 a 8 slots) y buscador predictivo de assets.
          </p>
        </div>

        <button
          onClick={handleRotateToNextList}
          className="px-3.5 py-2 bg-red-650 hover:bg-red-500 text-white font-bold text-[10px] uppercase rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-red-950/40 font-mono"
        >
          <ArrowRightLeft size={13} /> ROTAR A SIGUIENTE COLECCIÓN
        </button>
      </div>

      {/* METRIC CARD STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-4 flex flex-col justify-between h-24">
          <span className="text-[9.5px] text-zinc-500 font-bold uppercase tracking-wider">Colecciones Registradas</span>
          <div>
            <span className="text-lg font-black text-white block">{rotationLists.length} Listas</span>
            <p className="text-[9.5px] text-zinc-500 mt-0.5">Persistencia garantizada</p>
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-4 flex flex-col justify-between h-24 border-l-2 border-l-[#ff1e1e]">
          <span className="text-[9.5px] text-[#ff1e1e] font-bold uppercase tracking-wider">Colección Activa en Tienda</span>
          <div>
            <span className="text-sm font-black text-amber-400 block truncate">{activeCollectionObj?.name || 'Sin Selección'}</span>
            <p className="text-[9.5px] text-zinc-500 mt-0.5">
              {phantomStation.suppliesCatalog.length} de {activeCollectionObj?.displaySlots || 8} slots ocupados
            </p>
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-4 flex flex-col justify-between h-24">
          <span className="text-[9.5px] text-zinc-500 font-bold uppercase tracking-wider">Modo de Rotación</span>
          <div>
            <span className="text-sm font-black text-cyan-400 block uppercase">
              {activeCollectionObj?.selectionMode === 'random' ? '🔀 Aleatorio' : '📋 Secuencial'}
            </span>
            <p className="text-[9.5px] text-zinc-500 mt-0.5">Estrategia de selección de ítems</p>
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-4 flex flex-col justify-between h-24">
          <span className="text-[9.5px] text-zinc-500 font-bold uppercase tracking-wider">Catálogo Semilla Cargado</span>
          <div>
            <span className="text-sm font-black text-emerald-400 block">
              {loadingDbAssets ? 'Cargando...' : `${dbAssetsCatalog.length} Assets (10 Tablas)`}
            </span>
            <p className="text-[9.5px] text-zinc-500 mt-0.5">Listos para autocompletado</p>
          </div>
        </div>
      </div>

      {/* PESTAÑAS DE NAVEGACIÓN */}
      <div className="flex border-b border-zinc-900 overflow-x-auto gap-1">
        {[
          { id: 'rotation_lists', label: '📂 1) Colecciones & Slots en Tienda' },
          { id: 'store_manager', label: '🛒 2) Vista de Cuadrícula (Grid 2x4)' },
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

        {/* ── 🎯 PESTAÑA 1: COLECCIONES, SLOTS Y BUSCADOR PREDICTIVO ── */}
        {activeTab === 'rotation_lists' && (
          <div className="space-y-6 animate-fadeIn">

            {/* FORMULARIO DE AGREGAR ITEM + CREAR LISTA */}
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

                <div className="grid grid-cols-2 gap-3 bg-black/40 p-2.5 rounded-lg border border-zinc-850">
                  <div>
                    <label className="text-zinc-400 text-[8.5px] uppercase font-bold block mb-1">Slots en Grid (Tarjetas):</label>
                    <select
                      value={newListSlots}
                      onChange={e => setNewListSlots(Number(e.target.value))}
                      className="w-full bg-zinc-950 border border-zinc-800 p-1.5 rounded text-amber-400 font-bold text-[10px] outline-none cursor-pointer"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                        <option key={num} value={num}>{num} {num === 1 ? 'Tarjeta' : 'Tarjetas'}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-zinc-400 text-[8.5px] uppercase font-bold block mb-1">Modo de Selección:</label>
                    <select
                      value={newListSelectionMode}
                      onChange={e => setNewListSelectionMode(e.target.value as any)}
                      className="w-full bg-zinc-950 border border-zinc-800 p-1.5 rounded text-cyan-300 font-bold text-[10px] outline-none cursor-pointer"
                    >
                      <option value="sequential">📋 Secuencial (Orden Fijo)</option>
                      <option value="random">🔀 Aleatorio (Random)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black py-2 rounded text-[10px] uppercase tracking-wider transition-all cursor-pointer"
                >
                  + Fundar Nueva Colección
                </button>
              </form>

              {/* B. Agregar Activo con Buscador Predictivo */}
              <form onSubmit={handleAddCustomItemToList} className="bg-zinc-900/40 border border-zinc-850 p-4 rounded-xl space-y-3">
                <span className="text-emerald-400 font-bold text-[10px] uppercase tracking-widest block border-b border-zinc-800 pb-2 flex items-center gap-1.5">
                  <Plus size={14} /> AGREGAR ACTIVO (BUSCADOR PREDICTIVO AUTOCOMPLETE)
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

                  <div className="relative" ref={autocompleteRef}>
                    <label className="text-zinc-500 text-[8.5px] uppercase font-bold block mb-0.5">Buscador de Assets:</label>
                    <div className="relative">
                      <Search size={12} className="absolute left-2.5 top-2 text-zinc-500" />
                      <input
                        type="text"
                        placeholder="Escribe para autocompletar..."
                        value={assetSearchQuery}
                        onFocus={() => setIsAutocompleteOpen(true)}
                        onChange={e => {
                          setAssetSearchQuery(e.target.value);
                          setIsAutocompleteOpen(true);
                        }}
                        className="w-full bg-zinc-950 border border-zinc-800 pl-8 pr-2 py-1.5 rounded text-cyan-300 font-bold text-[10px] outline-none uppercase"
                      />
                    </div>

                    <AnimatePresence>
                      {isAutocompleteOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="absolute left-0 right-0 top-full mt-1 bg-black border border-cyan-500/40 rounded-lg shadow-2xl z-[150] max-h-56 overflow-y-auto divide-y divide-zinc-900 text-[10px]"
                        >
                          {filteredAutocompleteAssets.length === 0 ? (
                            <div className="p-3 text-zinc-500 italic text-center">No se encontraron assets.</div>
                          ) : (
                            filteredAutocompleteAssets.map((asset) => (
                              <div
                                key={`${asset.category}-${asset.id}`}
                                onClick={() => handleSelectAutocompleteAsset(asset)}
                                className="p-2 hover:bg-cyan-950/80 hover:text-cyan-300 cursor-pointer flex justify-between items-center transition-colors"
                              >
                                <div>
                                  <span className="font-bold text-white block uppercase">[{asset.category}] {asset.name}</span>
                                  <span className="text-[8.5px] text-zinc-500 font-mono">ID: {asset.id}</span>
                                </div>
                                <RarityBadge rank={asset.rarity} />
                              </div>
                            ))
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
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
                      <option value="Defensas">Defensas</option>
                      <option value="Tecnologías">Tecnologías</option>
                      <option value="Insignias">Insignias</option>
                      <option value="Blueprints">Blueprints</option>
                      <option value="Licencias">Licencias</option>
                      <option value="Tools">Tools</option>
                      <option value="Consumibles">Consumibles</option>
                      <option value="Astrobots">Astrobots</option>
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

            {/* LISTADO DE COLECCIONES */}
            <div className="space-y-4 pt-2">
              <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-widest block border-b border-zinc-900 pb-2 flex justify-between items-center">
                <span>📂 DIRECTORIO DE COLECCIONES DE ROTACIÓN DISPONIBLES ({rotationLists.length})</span>
                {loadingRotationLists && <span className="text-cyan-400 text-[8px] animate-pulse">Sincronizando...</span>}
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rotationLists.map(list => {
                  const isCurrentActive = list.id === activeListId;

                  return (
                    <div
                      key={list.id}
                      className={`p-4 rounded-xl border transition-all space-y-3 ${
                        isCurrentActive
                          ? 'bg-red-950/20 border-red-500/60 shadow-lg shadow-red-950/30'
                          : 'bg-zinc-900/40 border-zinc-850 hover:border-zinc-800'
                      }`}
                    >
                      <div className="flex justify-between items-start border-b border-zinc-850 pb-2.5">
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

                      <div className="p-2.5 bg-black/60 border border-zinc-850 rounded-lg flex flex-wrap items-center justify-between gap-2 text-[10px]">
                        <div className="flex items-center gap-2">
                          <LayoutGrid size={13} className="text-amber-400" />
                          <span className="text-zinc-400 font-bold uppercase">Slots Asignados:</span>
                          <select
                            value={list.displaySlots || 8}
                            onChange={e => handleUpdateCollectionSettings(list.id, Number(e.target.value), list.selectionMode || 'sequential')}
                            className="bg-zinc-950 border border-zinc-800 text-amber-400 font-bold px-2 py-0.5 rounded outline-none cursor-pointer"
                          >
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                              <option key={n} value={n}>{n} {n === 1 ? 'Tarjeta' : 'Tarjetas'}</option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-zinc-400 font-bold uppercase">Modo:</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateCollectionSettings(list.id, list.displaySlots || 8, list.selectionMode === 'random' ? 'sequential' : 'random')}
                            className={`px-2 py-0.5 rounded border text-[9px] font-bold uppercase cursor-pointer flex items-center gap-1 ${
                              list.selectionMode === 'random'
                                ? 'bg-purple-950 text-purple-300 border-purple-800'
                                : 'bg-cyan-950 text-cyan-300 border-cyan-800'
                            }`}
                          >
                            {list.selectionMode === 'random' ? <Shuffle size={10} /> : <ListOrdered size={10} />}
                            {list.selectionMode === 'random' ? 'Aleatorio' : 'Secuencial'}
                          </button>
                        </div>
                      </div>

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
                            {list.items.map((item, idx) => (
                              <div key={item.id || idx} className="p-2 bg-black/60 border border-zinc-900 rounded flex justify-between items-center text-[10px]">
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

        {/* ── 🛒 PESTAÑA 2: VISTA PREVIA GRID 2x4 ── */}
        {activeTab === 'store_manager' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider block">
                  VISTA PREVIA DEL GRID EN TIENDA (2 FILAS X 4 COLUMNAS - 8 CARDS)
                </span>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  Visualización exacta de la Phantom Station según la colección activa.
                </p>
              </div>

              <span className="text-amber-400 font-bold bg-amber-950/40 border border-amber-800/60 px-3 py-1 rounded uppercase text-[10px]">
                Listado: {activeCollectionObj?.name || 'Sin Selección'} ({phantomStation.suppliesCatalog.length} Tarjetas en Exhibición)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-black/80 border border-cyan-500/20 rounded-2xl">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((slotIndex) => {
                const offer: any = phantomStation.suppliesCatalog[slotIndex];
                const isAssignedSlot = slotIndex < (activeCollectionObj?.displaySlots || 8);

                return (
                  <div
                    key={slotIndex}
                    className={`p-3.5 rounded-xl border flex flex-col justify-between h-40 transition-all ${
                      offer
                        ? 'bg-zinc-950/90 border-cyan-500/50 shadow-lg shadow-cyan-950/20'
                        : isAssignedSlot
                        ? 'bg-zinc-900/30 border-dashed border-zinc-800 text-zinc-600'
                        : 'bg-black/40 border-zinc-900 opacity-40'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-[8.5px] font-black text-zinc-500 uppercase">
                        SLOT #{slotIndex + 1}
                      </span>
                      {offer && <RarityBadge rank={offer.rank || 'Common'} />}
                    </div>

                    {offer ? (
                      <div className="space-y-1.5 my-auto">
                        <span className="font-bold text-white text-xs block uppercase truncate">{offer.name}</span>
                        <span className="text-[9px] text-cyan-400 font-bold uppercase block">{offer.category || 'Módulo'}</span>
                        <span className="text-yellow-400 font-extrabold text-xs block">
                          {offer.priceValue || 1000} {offer.currencyType || 'GD Coins'}
                        </span>
                      </div>
                    ) : (
                      <div className="my-auto text-center">
                        <span className="text-[9.5px] text-zinc-600 italic block">
                          {isAssignedSlot ? 'Sin ítem asignado' : 'Slot Desactivado por Configuración'}
                        </span>
                      </div>
                    )}

                    <div className="text-[8px] text-zinc-500 text-right">
                      {offer ? `Stock: ${offer.storageLeft || 10} u` : `Slot ${isAssignedSlot ? 'Libre' : 'Inactivo'}`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── ⚙️ PESTAÑA 3: MOTOR DE REFRESCOS ── */}
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
                    const val = Number(e.target.value);
                    setPhantomStation(prev => ({ ...prev, autoRefreshStockTimerSeconds: val }));
                    onSaveGameHud({
                      ...gameHud,
                      phantomStation: { ...phantomStation, autoRefreshStockTimerSeconds: val }
                    });
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
                    const val = Number(e.target.value);
                    setPhantomStation(prev => ({ ...prev, refreshCostVoidCrystals: val }));
                    onSaveGameHud({
                      ...gameHud,
                      phantomStation: { ...phantomStation, refreshCostVoidCrystals: val }
                    });
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded text-purple-400 font-bold outline-none"
                />
                <span className="text-[9px] text-zinc-500 block">Monto en Phantom Coins cobrado al explorador.</span>
              </div>
            </div>
          </div>
        )}

        {/* ── ⚡ PESTAÑA 4: LIVEOPS ── */}
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

        {/* ── 📊 PESTAÑA 5: AUDITORÍA ── */}
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