import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Ghost, RefreshCw, Hammer, Trash2, Plus, Sliders, Database, 
  Shield, TrendingUp, DollarSign, Calendar, FileText, CheckCircle, 
  Flame, ToggleLeft, ToggleRight, Sparkles, AlertTriangle, ShieldCheck, 
  Settings, Info, Power, LineChart as ChartIcon, RefreshCcw, HelpCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import { GalaxyDustConfig, UserProfile, QuantumUnitShard, QuantumSupplyItem, PhantomStationConfig } from '../types';

interface AdminPhantomStationModuleProps {
  gameHud: GalaxyDustConfig;
  users: UserProfile[];
  onSaveGameHud: (updatedHud: GalaxyDustConfig) => void;
  setIsAlertToShow: (alert: { show: boolean; status: 'success' | 'error' | 'warning'; message: string }) => void;
}

// Predefined set of game items to enforce curated database injection
const GAME_DB_ITEMS = [
  { id: 'item_01', name: 'QMP Micro-Processor v4', category: 'Herramientas', defaultPrice: 1500, defaultCurrency: 'GD Coins' },
  { id: 'item_02', name: 'QMC Mining Core T2', category: 'Herramientas', defaultPrice: 3200, defaultCurrency: 'Quantum Tokens' },
  { id: 'item_03', name: 'Nano-Repair Frame Kit', category: 'Consumibles', defaultPrice: 450, defaultCurrency: 'Phantom Coins' },
  { id: 'item_04', name: 'Quantum Materializer Blueprint X', category: 'Blueprints', defaultPrice: 8000, defaultCurrency: 'Quantum Tokens' },
  { id: 'item_05', name: 'Chronos Time-Reduction Booster', category: 'Consumibles', defaultPrice: 1200, defaultCurrency: 'GD Coins' },
  { id: 'item_06', name: 'Exclusive Christmas Shield Blueprint', category: 'Eventos', defaultPrice: 9500, defaultCurrency: 'Quantum Tokens' },
  { id: 'item_07', name: 'Advanced Gravity Welder', category: 'Herramientas', defaultPrice: 650, defaultCurrency: 'Phantom Coins' }
];

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
      className="relative inline-flex items-center justify-center cursor-help mx-1"
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
  const [activeTab, setActiveTab] = useState<'store_manager' | 'refresh_engine' | 'events_ops' | 'economy_audit'>('store_manager');

  // Load state or fallback
  const [phantomStation, setPhantomStation] = useState<PhantomStationConfig>(() => {
    const base = gameHud.phantomStation || {} as PhantomStationConfig;
    return {
      phantomCrystalsBalance: base.phantomCrystalsBalance || 14500,
      recentTelemetryLogs: base.recentTelemetryLogs || [],
      autoRefreshStockTimerSeconds: base.autoRefreshStockTimerSeconds || 680,
      refreshAttemptsUsed: base.refreshAttemptsUsed !== undefined ? base.refreshAttemptsUsed : 53,
      refreshAttemptsMax: base.refreshAttemptsMax || 90,
      autoRefreshEnabled: base.autoRefreshEnabled !== undefined ? base.autoRefreshEnabled : true,
      refreshCostVoidCrystals: base.refreshCostVoidCrystals !== undefined ? base.refreshCostVoidCrystals : 10,
      unitsCatalog: base.unitsCatalog || [],
      suppliesCatalog: base.suppliesCatalog || [],
      // Badge / Loyalty Integration
      selectedBadgeDiscount: base.selectedBadgeDiscount || 'AO Seal I (Alpha)',
      badgeDiscountPercent: base.badgeDiscountPercent !== undefined ? base.badgeDiscountPercent : 5,
      badgeDiscountCategories: base.badgeDiscountCategories || ['Consumibles'],
      totalBlueprintsGoal: base.totalBlueprintsGoal !== undefined ? base.totalBlueprintsGoal : 50,
      loyaltyRewardType: base.loyaltyRewardType || 'Origin Box',
      // NPC Lore & Operator
      npcName: base.npcName || 'Síndico Coloidal',
      npcAvatar: base.npcAvatar || 'colloidal_syndicate',
      npcGreeting: base.npcGreeting || 'TODO TIENE UN VALOR',
      terminalStateOnline: base.terminalStateOnline !== undefined ? base.terminalStateOnline : true,
      // Auto-refresh timer interval & custom configuration
      freeRefreshCountdown: base.freeRefreshCountdown !== undefined ? base.freeRefreshCountdown : 831,
      freeRefreshIntervalType: base.freeRefreshIntervalType || '12_hours',
    };
  });

  // Keep state in sync with gameHud changes
  useEffect(() => {
    if (gameHud.phantomStation) {
      setPhantomStation(prev => ({
        ...prev,
        ...gameHud.phantomStation
      }));
    }
  }, [gameHud]);

  // LOCAL COIN BURNT TRACKER DEMO STATE
  const [burntLogs, setBurntLogs] = useState(() => {
    const saved = localStorage.getItem('phantom_burnt_logs');
    if (saved) return JSON.parse(saved);
    return [
      { hour: '04:00', burnt: 340, activePlayers: 15 },
      { hour: '08:00', burnt: 520, activePlayers: 18 },
      { hour: '12:00', burnt: 810, activePlayers: 29 },
      { hour: '16:00', burnt: 1450, activePlayers: 42 },
      { hour: '20:00', burnt: 2200, activePlayers: 54 },
      { hour: 'Ahora', burnt: 1840, activePlayers: 38 }
    ];
  });

  // CENTRAL BANK GD SYSTEM INDEX LOGS (LOG GD)
  const [gdLogs, setGdLogs] = useState<Array<{ id: string; timestamp: string; username: string; action: string; currency: string; amount: number; balanceAfter: number }>>(() => {
    const saved = localStorage.getItem('phantom_gd_logs');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'TX-GD-951', timestamp: new Date(Date.now() - 1000 * 45).toISOString(), username: 'SasoriAlpha', action: 'Inyección Suministro: QMP Micro-Processor', currency: 'Quantum Tokens', amount: 80, balanceAfter: 14420 },
      { id: 'TX-GD-948', timestamp: new Date(Date.now() - 1000 * 300).toISOString(), username: 'ViperByte', action: 'Compra Tienda: Nano-Repair Frame Kit', currency: 'Phantom Coins', amount: 450, balanceAfter: 13970 },
      { id: 'TX-GD-931', timestamp: new Date(Date.now() - 1000 * 900).toISOString(), username: 'CyberKitsune', action: 'Refresco Manual Estación (10 intentos)', currency: 'Phantom Coins', amount: 100, balanceAfter: 13870 },
      { id: 'TX-GD-910', timestamp: new Date(Date.now() - 1000 * 1800).toISOString(), username: 'GhostGlitch', action: 'Compra Tienda: Chronos Time-Booster', currency: 'GD Coins', amount: 1200, balanceAfter: 12670 }
    ];
  });

  // EVENT STORE ACTIVE STATUS
  const [eventStoreActive, setEventStoreActive] = useState<boolean>(() => {
    return localStorage.getItem('phantom_event_store_active') === 'true';
  });

  // BLUEPRINT TARGET CAP (Units Deployed Target Progress)
  const [blueprintTargetCap, setBlueprintTargetCap] = useState<number>(() => {
    const saved = localStorage.getItem('phantom_blueprint_target_cap');
    return saved ? parseInt(saved) : 50;
  });

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

  // MODULE 1 STATES: OFFER CREATORFORM
  const [showAddOfferForm, setShowAddOfferForm] = useState(false);
  const [selectedDbItemId, setSelectedDbItemId] = useState<string>(GAME_DB_ITEMS[0].id);
  const [offerPrice, setOfferPrice] = useState<number>(GAME_DB_ITEMS[0].defaultPrice);
  const [offerCurrency, setOfferCurrency] = useState<string>('GD Coins');
  const [offerStock, setOfferStock] = useState<number>(10);
  const [offerDiscount, setOfferDiscount] = useState<number>(0);

  // Sync default price/currency when selected DB item changes in form
  useEffect(() => {
    const selected = GAME_DB_ITEMS.find(i => i.id === selectedDbItemId);
    if (selected) {
      setOfferPrice(selected.defaultPrice);
      setOfferCurrency(selected.defaultCurrency);
    }
  }, [selectedDbItemId]);

  const handleAddStoreOffer = (e: React.FormEvent) => {
    e.preventDefault();
    const itemTemplate = GAME_DB_ITEMS.find(i => i.id === selectedDbItemId);
    if (!itemTemplate) return;

    // We can inject into the suppliesCatalog. Since other catalogs exist (like unitsCatalog), 
    // we support both types of listings dynamically
    const newOffer: any = {
      id: `mkt-offer-${Date.now().toString(36)}`,
      name: itemTemplate.name,
      currencyType: offerCurrency,
      priceValue: offerPrice,
      storageLeft: offerStock,
      discountPercent: offerDiscount,
      category: itemTemplate.category,
      timeReductionSeconds: 1800, // placeholder
      // For game integration fallback
      nameOriginal: itemTemplate.name
    };

    const updatedSupplies = [...phantomStation.suppliesCatalog, {
      id: newOffer.id,
      name: newOffer.name,
      discountPercent: offerDiscount,
      timeReductionSeconds: 1800,
      // Extral attributes for our enterprise admin dashboard
      currencyType: offerCurrency,
      priceValue: offerPrice,
      storageLeft: offerStock,
      category: itemTemplate.category
    } as any];

    const updatedCatalog = {
      ...phantomStation,
      suppliesCatalog: updatedSupplies
    };

    // Log this System GD central bank activity
    const newLog = {
      id: `TX-GD-${Math.floor(Math.random() * 900) + 100}`,
      timestamp: new Date().toISOString(),
      username: 'ADMINISTRADOR',
      action: `Oferta Inyectada: ${itemTemplate.name} (${offerStock} unidades)`,
      currency: offerCurrency,
      amount: offerPrice,
      balanceAfter: phantomStation.phantomCrystalsBalance
    };

    const nextLogs = [newLog, ...gdLogs];
    setGdLogs(nextLogs);
    localStorage.setItem('phantom_gd_logs', JSON.stringify(nextLogs));

    saveToGlobalAndHUD(updatedCatalog);
    setShowAddOfferForm(false);
    alertTrigger('success', `Inyectada nueva oferta oficial de ${itemTemplate.name} de forma exitosa.`);
  };

  const handleDeleteOffer = (id: string, name: string) => {
    const updatedSupplies = phantomStation.suppliesCatalog.filter((item: any) => item.id !== id);
    const updatedCatalog = {
      ...phantomStation,
      suppliesCatalog: updatedSupplies
    };
    saveToGlobalAndHUD(updatedCatalog);
    alertTrigger('warning', `Removida oferta de ${name} del catálogo de la tienda.`);
  };

  const handleFastInjectPreset = (name: string, category: string, price: number, currency: string, stock: number) => {
    const newOffer = {
      id: `mkt-preset-${Date.now().toString(36)}`,
      name,
      currencyType: currency,
      priceValue: price,
      storageLeft: stock,
      discountPercent: 0,
      category,
      timeReductionSeconds: 1800,
    };

    const updatedCatalog = {
      ...phantomStation,
      suppliesCatalog: [...phantomStation.suppliesCatalog, newOffer]
    };

    const newLog = {
      id: `TX-GD-${Math.floor(Math.random() * 900) + 100}`,
      timestamp: new Date().toISOString(),
      username: 'BANCO SIDER_OPS',
      action: `Inyección Transmutación: ${name} (${stock} unidades preset)`,
      currency,
      amount: price,
      balanceAfter: phantomStation.phantomCrystalsBalance
    };

    const nextLogs = [newLog, ...gdLogs];
    setGdLogs(nextLogs);
    localStorage.setItem('phantom_gd_logs', JSON.stringify(nextLogs));

    saveToGlobalAndHUD(updatedCatalog);
    alertTrigger('success', `⚡ [Transmutación]: Inyectado preset ${name} (${stock} u.) con costo de ${price} ${currency}.`);
  };

  const handleQuantumExclusiveInjection = (name: string, priceTokens: number) => {
    const newOffer = {
      id: `mkt-web3-${Date.now().toString(36)}`,
      name,
      currencyType: 'Quantum Tokens',
      priceValue: priceTokens,
      storageLeft: 1,
      discountPercent: 0,
      category: 'Blueprints',
      timeReductionSeconds: 3600
    };

    const updatedCatalog = {
      ...phantomStation,
      suppliesCatalog: [...phantomStation.suppliesCatalog, newOffer]
    };

    const newLog = {
      id: `TX-GD-${Math.floor(Math.random() * 900) + 100}`,
      timestamp: new Date().toISOString(),
      username: 'BANCO WEB3',
      action: `Inyección EXCLUSIVA WEB3: ${name} (1 unidad)`,
      currency: 'Quantum Tokens',
      amount: priceTokens,
      balanceAfter: phantomStation.phantomCrystalsBalance
    };

    const nextLogs = [newLog, ...gdLogs];
    setGdLogs(nextLogs);
    localStorage.setItem('phantom_gd_logs', JSON.stringify(nextLogs));

    saveToGlobalAndHUD(updatedCatalog);
    alertTrigger('success', `🌌 [Web3 Intrusion]: Publicado el plano elite '${name}' por ${priceTokens} Quantum Tokens de Gobernanza.`);
  };

  // MODULE 2 SUB_HANDLERS
  const handleUpdateRefreshLimits = (maxAttempts: number, costCoins: number, intervalSeconds: number) => {
    const updatedCatalog = {
      ...phantomStation,
      refreshAttemptsMax: maxAttempts,
      refreshCostVoidCrystals: costCoins,
      autoRefreshStockTimerSeconds: intervalSeconds
    };
    saveToGlobalAndHUD(updatedCatalog);
    alertTrigger('success', 'Configuración de peajes y límites de refresco manual actualizada en red.');
  };



  // MODULE 4 LIVE OPS
  const toggleEventStoreState = () => {
    const nextState = !eventStoreActive;
    setEventStoreActive(nextState);
    localStorage.setItem('phantom_event_store_active', String(nextState));
    
    // Aesthetic notification banner
    alertTrigger(nextState ? 'success' : 'warning', 
      nextState ? '🎄 ¡MODO EVENTO DE TEMPORADA ACTIVADO! Estética de la Estación encriptada al evento de invierno.' : '🚫 Modo Evento desactivado. Devolviendo estética de la tienda a la órbita estándar.'
    );
  };

  const handleUpdateBlueprintProgressGoal = (goal: number) => {
    setBlueprintTargetCap(goal);
    localStorage.setItem('phantom_blueprint_target_cap', String(goal));
    alertTrigger('success', `Meta de despliegue de planos y progreso configurada en ${goal} unidades.`);
  };

  const handleInjectSeasonalExclusiveItems = () => {
    const exists = phantomStation.suppliesCatalog.some((s: any) => s.id === 'evt_item_01');
    if (exists) {
      alertTrigger('warning', '¡Los ítems exclusivos navideños ya se encuentran inyectados en el rack catálogo!');
      return;
    }
    const seasonalItems = [
      {
        id: 'evt_item_01',
        name: '❄️ Crioprotector Criogénico Sub-Cero (Seasonal Exclusive)',
        priceValue: 750,
        currencyType: 'Phantom Coins',
        storageLeft: 12,
        discountPercent: 15,
        rank: 'Legendary'
      },
      {
        id: 'evt_item_02',
        name: '🎄 Núcleo Térmico Festivo T4 (Seasonal Exclusive)',
        priceValue: 1200,
        currencyType: 'GD Coins',
        storageLeft: 5,
        discountPercent: 20,
        rank: 'Exclusive'
      },
      {
        id: 'evt_item_03',
        name: '⭐️ Propulsor Cometar Constelación (Seasonal Exclusive)',
        priceValue: 35,
        currencyType: 'Quantum Tokens',
        storageLeft: 2,
        discountPercent: 0,
        rank: 'Heroic'
      }
    ];
    const updatedCatalog = {
      ...phantomStation,
      suppliesCatalog: [...phantomStation.suppliesCatalog, ...seasonalItems]
    };
    saveToGlobalAndHUD(updatedCatalog);
    alertTrigger('success', '🎅 [Live Ops]: Ítems navideños de temporada inyectados con éxito en la tienda activa.');
  };



  return (
    <div className="space-y-6">
      
      {/* PHANTOM HEAD SUMMARY AND CORES STATUS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-5 bg-zinc-950 border border-zinc-900 rounded-lg gap-4 shadow-lg shadow-black/80">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Ghost className="text-[#ff1e1e] h-5 w-5 animate-pulse shrink-0" />
            <span className="font-display font-black text-white text-md tracking-wider uppercase">PHANTOM CONTROL STATION v5.2</span>
          </div>
          <p className="text-[11px] text-zinc-500 font-sans leading-relaxed">
            Consola central de inyecciones del sistema, calibración de refresco y auditoría de la economía nacional (Log "GD") para Galaxy Dust.
          </p>
        </div>
        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="px-3 py-1.5 bg-black/45 border border-zinc-900 rounded leading-none flex flex-col items-end">
            <span className="text-[8px] text-zinc-650 uppercase">COINS IN ACTION</span>
            <strong className="text-white text-[11.5px] mt-0.5">{phantomStation.phantomCrystalsBalance.toLocaleString()} PC</strong>
          </div>
          <div className="px-3 py-1.5 bg-[#ff1e1e]/5 border border-[#ff1e1e]/20 rounded leading-none flex flex-col items-end">
            <span className="text-[8px] text-red-400 uppercase">EVENT STATUS</span>
            <strong className={`text-[11px] mt-0.5 ${eventStoreActive ? 'text-red-500 font-bold animate-ping-custom' : 'text-zinc-550'}`}>
              {eventStoreActive ? 'ACTIVO (TEMPORADA)' : 'CERRADO'}
            </strong>
          </div>
        </div>
      </div>

      {/* METRIC CARD STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-4 flex flex-col justify-between h-24">
          <span className="text-[9.5px] text-zinc-500 font-bold uppercase tracking-wider font-mono">Banca de Phantoms Quemados</span>
          <div>
            <span className="text-lg font-black text-white block">{(phantomStation.refreshAttemptsUsed * phantomStation.refreshCostVoidCrystals).toLocaleString()} PC</span>
            <p className="text-[9.5px] text-zinc-500 font-sans mt-0.5">Quema total acumulada por exploradores</p>
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-4 flex flex-col justify-between h-24 border-l-2 border-l-[#ff1e1e]">
          <span className="text-[9.5px] text-[#ff1e1e] font-bold uppercase tracking-wider font-mono">Ofertas Curadas en Stock</span>
          <div>
            <span className="text-lg font-black text-white block">{phantomStation.suppliesCatalog.length} Ítems</span>
            <p className="text-[9.5px] text-zinc-500 font-sans mt-0.5">Control de inyección de recursos directo</p>
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-4 flex flex-col justify-between h-24">
          <span className="text-[9.5px] text-zinc-550 font-bold uppercase tracking-wider font-mono">Temporizador Global de Rotación</span>
          <div>
            <span className="text-lg font-black text-yellow-500 block">{(phantomStation.autoRefreshStockTimerSeconds / 60).toFixed(1)} min</span>
            <p className="text-[9.5px] text-zinc-500 font-sans mt-0.5">Rotación automática del inventario</p>
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-4 flex flex-col justify-between h-24">
          <span className="text-[9.5px] text-zinc-500 font-bold uppercase tracking-wider font-mono">Punto de Reserva de Planos</span>
          <div>
            <span className="text-lg font-black text-emerald-400 block">{blueprintTargetCap} Planos</span>
            <p className="text-[9.5px] text-zinc-500 font-sans mt-0.5">Meta para recompensa de despliegue</p>
          </div>
        </div>
      </div>

      {/* TAB NAVIGATION PANEL */}
      <div className="flex border-b border-zinc-900 overflow-x-auto gap-1">
        <button
          onClick={() => setActiveTab('store_manager')}
          className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'store_manager'
              ? 'text-[#ff1e1e] border-[#ff1e1e] bg-zinc-900/40'
              : 'text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-zinc-950/20'
          }`}
        >
          1) Inventario Curado
        </button>
        <button
          onClick={() => setActiveTab('refresh_engine')}
          className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'refresh_engine'
              ? 'text-[#ff1e1e] border-[#ff1e1e] bg-zinc-900/40'
              : 'text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-zinc-950/20'
          }`}
        >
          2) Motor de Refrescos
        </button>

        <button
          onClick={() => setActiveTab('events_ops')}
          className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'events_ops'
              ? 'text-[#ff1e1e] border-[#ff1e1e] bg-zinc-900/40'
              : 'text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-zinc-950/20'
          }`}
        >
          4) Eventos & LiveOps
        </button>
        <button
          onClick={() => setActiveTab('economy_audit')}
          className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'economy_audit'
              ? 'text-[#ff1e1e] border-[#ff1e1e] bg-zinc-900/40'
              : 'text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-zinc-950/20'
          }`}
        >
          5) Auditoría "GD"
        </button>
      </div>

      {/* CORE MODULES RENDERING PANEL */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-5">
        
        {/* TAB 1: CURATED STORE MANAGER */}
        {activeTab === 'store_manager' && (
          <div className="space-y-6">
            {/* TERMINAL STATUS NOTICE */}
            {!phantomStation.terminalStateOnline && (
              <div className="p-4 bg-red-950/40 border border-red-500/30 rounded-lg flex items-center gap-3 text-red-400 font-mono text-xs mb-4">
                <AlertTriangle size={18} className="shrink-0 text-red-500 animate-pulse" />
                <div>
                  <strong className="block text-white">⚠️ MANTENIMIENTO DEL SISTEMA - TERMINAL OFFLINE</strong>
                  La Phantom Station se encuentra en estado OFFLINE. Los exploradores no pueden ver las ofertas ni realizar compras. Todas las inyecciones manuales se procesarán en la base de datos pero estarán retenidas en el cliente.
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-zinc-900 pb-3 gap-2">
              <div className="space-y-1">
                <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider block">
                  [ MODULE.01 ]: GESTIÓN DE INVENTARIO DICTADO (CURATED STORE ENGINE)
                </span>
                <p className="text-[10.5px] text-zinc-550 leading-normal font-sans">
                  Las inyecciones directas de ítems oficiales permiten definir escasez, limitar el acaparamiento y asignar descuentos temporales de forma centralizada.
                </p>
              </div>

              <button
                type="button"
                disabled={!phantomStation.terminalStateOnline}
                onClick={() => setShowAddOfferForm(!showAddOfferForm)}
                className={`px-3.5 py-1.5 text-white font-sans font-bold text-[10px] uppercase tracking-wider rounded border shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer self-start ${
                  !phantomStation.terminalStateOnline 
                    ? 'bg-zinc-805 border-zinc-800 text-zinc-500 cursor-not-allowed opacity-50' 
                    : 'bg-[#ff1e1e] hover:bg-red-700 border-[#ff1e1e]/40'
                }`}
              >
                <Plus size={13} />
                {showAddOfferForm ? 'Cerrar Formulario' : 'Crear Oferta de Suministro'}
              </button>
            </div>

            {/* Injected Offer Add Form */}
            <AnimatePresence>
              {showAddOfferForm && phantomStation.terminalStateOnline && (
                <motion.form 
                  onSubmit={handleAddStoreOffer}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="p-4 bg-zinc-900/40 border border-zinc-850 rounded-lg space-y-4 overflow-hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                    <div>
                      <label className="text-zinc-550 text-[10px] block uppercase mb-1">Items Reales de Base de Datos:</label>
                      <select 
                        aria-label="Items Reales de Base de Datos"
                        value={selectedDbItemId}
                        onChange={(e) => setSelectedDbItemId(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-850 text-white rounded px-2.5 py-1.5 focus:outline-none focus:border-red-500"
                        required
                      >
                        {GAME_DB_ITEMS.map((item) => (
                          <option key={item.id} value={item.id}>
                            [{item.category.toUpperCase()}] {item.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-zinc-550 text-[10px] block uppercase mb-1">Precio Unitario:</label>
                      <input 
                        aria-label="Precio Unitario"
                        type="number" 
                        value={offerPrice} 
                        onChange={(e) => setOfferPrice(Math.max(1, parseInt(e.target.value) || 0))} 
                        className="w-full bg-zinc-950 border border-zinc-850 text-white rounded px-2.5 py-1.5 focus:outline-none focus:border-red-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-zinc-550 text-[10px] block uppercase mb-1">Selector de Divisa Estricta:</label>
                      <select 
                        aria-label="Selector de Divisa Estricta"
                        value={offerCurrency}
                        onChange={(e) => setOfferCurrency(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-850 text-white rounded px-2.5 py-1.5 focus:outline-none focus:border-red-500"
                      >
                        <option value="Phantom Coins">Phantom Coins (F2P/Quema)</option>
                        <option value="GD Coins">GD Coins (Liquidez Principal)</option>
                        <option value="Quantum Tokens">Quantum Tokens (Exclusivo)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-zinc-550 text-[10px] block uppercase mb-1">Límite de Stock (storageLeft):</label>
                      <input 
                        aria-label="Límite de Stock"
                        type="number" 
                        value={offerStock} 
                        onChange={(e) => setOfferStock(Math.max(1, parseInt(e.target.value) || 0))} 
                        className="w-full bg-zinc-950 border border-zinc-850 text-white rounded px-2.5 py-1.5 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-zinc-550 text-[10px] block uppercase mb-1">Porcentaje de Descuento (discount):</label>
                      <div className="relative">
                        <input 
                          aria-label="Descuento VIP"
                          type="number" 
                          value={offerDiscount} 
                          onChange={(e) => setOfferDiscount(Math.max(0, Math.min(95, parseInt(e.target.value) || 0)))} 
                          className="w-full bg-zinc-950 border border-zinc-850 text-white rounded px-2.5 py-1.5 focus:outline-none pr-7"
                        />
                        <span className="absolute right-2.5 top-1.5 text-zinc-500 font-bold">%</span>
                      </div>
                    </div>

                    <div className="flex items-end pt-5">
                      <button
                        type="submit"
                        className="w-full h-8 px-4 bg-[#ff1e1e] hover:bg-red-700 text-white border border-[#ff1e1e]/60 rounded text-[9.5px] font-bold uppercase tracking-wider font-sans transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle size={12} />
                        Confirmar Inyección en Rack
                      </button>
                    </div>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* DIRECT SYSTEM PRESETS - TRANSMUTACION & CAJAS DE EVENTO (LOOTBOXES) & HERRAMIENTAS GEOGRAFICAS */}
            <div className="p-4 bg-zinc-900/40 border border-zinc-850 rounded-lg space-y-4">
              <div className="flex items-center gap-2 border-b border-zinc-850 pb-2">
                <Hammer size={14} className="text-[#ff1e1e] shrink-0" />
                <span className="text-[10.5px] text-white font-bold uppercase block tracking-wider font-mono">
                  [ TRANSMUTACIÓN ]: INYECCIÓN RÁPIDA DE CLUSTER BOXES, MATERIALIZADORES Y HERRAMIENTAS SECTORIALES
                </span>
              </div>
              
              <p className="text-[10.5px] text-zinc-500 leading-normal font-sans">
                Inyecte directamente cofres misteriosos, herramientas exigidas de minería geográfica, o materializadores científicos para reducir costes de hangar con un solo click.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                {/* Lootboxes Column */}
                <div className="p-3 bg-black/65 border border-zinc-900 rounded space-y-2">
                  <span className="text-[9px] text-[#ff1e1e] font-bold block uppercase tracking-wider">📦 CAJAS DE EVENTO / CLUSTER BOXES</span>
                  <div className="flex flex-col gap-1.5">
                    <button
                      type="button"
                      disabled={!phantomStation.terminalStateOnline}
                      onClick={() => handleFastInjectPreset('Inara Box I', 'Materiales', 1200, 'Phantom Coins', 15)}
                      className="w-full py-1.5 px-2.5 bg-zinc-950 hover:bg-[#ff1e1e] text-zinc-400 hover:text-white border border-zinc-900 hover:border-[#ff1e1e] rounded text-[10px] font-mono text-left transition-all flex items-center justify-between cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span>Inara Box I</span>
                      <span className="text-zinc-[600] block text-[9.5px]">1,200 PC</span>
                    </button>
                    <button
                      type="button"
                      disabled={!phantomStation.terminalStateOnline}
                      onClick={() => handleFastInjectPreset('Inara Box II', 'Materiales', 2200, 'Phantom Coins', 15)}
                      className="w-full py-1.5 px-2.5 bg-zinc-950 hover:bg-[#ff1e1e] text-zinc-400 hover:text-white border border-zinc-900 hover:border-[#ff1e1e] rounded text-[10px] font-mono text-left transition-all flex items-center justify-between cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span>Inara Box II</span>
                      <span className="text-zinc-[600] block text-[9.5px]">2,200 PC</span>
                    </button>
                    <button
                      type="button"
                      disabled={!phantomStation.terminalStateOnline}
                      onClick={() => handleFastInjectPreset('Inara Box III', 'Materiales', 3500, 'Phantom Coins', 15)}
                      className="w-full py-1.5 px-2.5 bg-zinc-950 hover:bg-[#ff1e1e] text-zinc-400 hover:text-white border border-zinc-900 hover:border-[#ff1e1e] rounded text-[10px] font-mono text-left transition-all flex items-center justify-between cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span>Inara Box III</span>
                      <span className="text-zinc-[600] block text-[9.5px]">3,500 PC</span>
                    </button>
                    <button
                      type="button"
                      disabled={!phantomStation.terminalStateOnline}
                      onClick={() => handleFastInjectPreset('Origin Box', 'Materiales', 5000, 'GD Coins', 10)}
                      className="w-full py-1.5 px-2.5 bg-zinc-950 hover:bg-[#ff1e1e] text-zinc-400 hover:text-white border border-zinc-900 hover:border-[#ff1e1e] rounded text-[10px] font-mono text-left transition-all flex items-center justify-between cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span>Origin Box</span>
                      <span className="text-zinc-[600] block text-[9.5px]">5,000 GD</span>
                    </button>
                  </div>
                </div>

                {/* Geographical tools Column */}
                <div className="p-3 bg-black/65 border border-zinc-900 rounded space-y-2">
                  <span className="text-[9px] text-[#ff1e1e] font-bold block uppercase tracking-wider">⛏️ HERRAMIENTAS GEOGRÁFICAS EXIGIDAS</span>
                  <div className="flex flex-col gap-1.5">
                    <button
                      type="button"
                      disabled={!phantomStation.terminalStateOnline}
                      onClick={() => handleFastInjectPreset('Inara Metal Tool', 'Herramientas', 900, 'Phantom Coins', 20)}
                      className="w-full py-1.5 px-2.5 bg-zinc-950 hover:bg-[#ff1e1e] text-zinc-400 hover:text-white border border-zinc-900 hover:border-[#ff1e1e] rounded text-[10px] font-mono text-left transition-all flex items-center justify-between cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span>Inara Metal Tool</span>
                      <span className="text-zinc-[600] block text-[9.5px]">900 PC</span>
                    </button>
                    <button
                      type="button"
                      disabled={!phantomStation.terminalStateOnline}
                      onClick={() => handleFastInjectPreset('Origin Crystal Tool', 'Herramientas', 1800, 'Phantom Coins', 20)}
                      className="w-full py-1.5 px-2.5 bg-zinc-950 hover:bg-[#ff1e1e] text-zinc-400 hover:text-white border border-zinc-900 hover:border-[#ff1e1e] rounded text-[10px] font-mono text-left transition-all flex items-center justify-between cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span>Origin Crystal Tool</span>
                      <span className="text-zinc-[600] block text-[9.5px]">1,800 PC</span>
                    </button>
                    <p className="text-[8.5px] text-zinc-[600] leading-relaxed font-sans pt-1">
                      *El lore de los clústeres exige estas herramientas de minería específicas para poder extraer recursos en sectores designados Inara y Origin.
                    </p>
                  </div>
                </div>

                {/* Materializers & boosters */}
                <div className="p-3 bg-black/65 border border-zinc-900 rounded space-y-2">
                  <span className="text-[9px] text-[#ff1e1e] font-bold block uppercase tracking-wider">⚛️ MATERIALIZADORES & ACELERADORES</span>
                  <div className="flex flex-col gap-1.5">
                    <button
                      type="button"
                      disabled={!phantomStation.terminalStateOnline}
                      onClick={() => handleFastInjectPreset('Quantum Materializer Blueprint X', 'Blueprints', 8000, 'Quantum Tokens', 5)}
                      className="w-full py-1.5 px-2.5 bg-zinc-950 hover:bg-[#ff1e1e] text-zinc-400 hover:text-white border border-zinc-900 hover:border-[#ff1e1e] rounded text-[10px] font-mono text-left transition-all flex items-center justify-between cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span>Materializer Blueprint X</span>
                      <span className="text-zinc-[600] block text-[9.5px]">8k QT</span>
                    </button>
                    <button
                      type="button"
                      disabled={!phantomStation.terminalStateOnline}
                      onClick={() => handleFastInjectPreset('Cluster Materializer T1', 'Consumibles', 750, 'Phantom Coins', 50)}
                      className="w-full py-1.5 px-2.5 bg-zinc-950 hover:bg-[#ff1e1e] text-zinc-400 hover:text-white border border-zinc-900 hover:border-[#ff1e1e] rounded text-[10px] font-mono text-left transition-all flex items-center justify-between cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span>Cluster Materializer T1</span>
                      <span className="text-zinc-[600] block text-[9.5px]">750 PC</span>
                    </button>
                    <button
                      type="button"
                      disabled={!phantomStation.terminalStateOnline}
                      onClick={() => handleFastInjectPreset('Hangar Speed Booster', 'Consumibles', 1500, 'GD Coins', 25)}
                      className="w-full py-1.5 px-2.5 bg-zinc-950 hover:bg-[#ff1e1e] text-zinc-400 hover:text-white border border-zinc-900 hover:border-[#ff1e1e] rounded text-[10px] font-mono text-left transition-all flex items-center justify-between cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span>Hangar Speed Booster</span>
                      <span className="text-zinc-[600] block text-[9.5px]">1.5k GD</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* QUANTUM TOKEN PREMIUM SALES SECTION */}
            <div className="p-4 bg-[#ff1e1e]/5 border border-[#ff1e1e]/15 rounded-lg space-y-3">
              <div className="flex items-center gap-2 border-b border-[#ff1e1e]/20 pb-2">
                <Sparkles size={14} className="text-[#ff1e1e] shrink-0" />
                <span className="text-[10.5px] text-white font-bold uppercase block tracking-wider font-mono">
                  [ WEB3 PREMIUM ]: SISTEMA DE ADJUDICACIÓN DE VENTAS CON QUANTUM TOKENS (GOBERNANZA)
                </span>
              </div>
              <p className="text-[10.5px] text-zinc-500 leading-normal font-sans">
                Publique ofertas que solo puedan ser adquiridas firmando transacciones con wallets Web3 externas usando el token de gobernanza <strong className="text-red-400">Quantum Token</strong>, omitiendo balanzas del juego tradicionales.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  type="button"
                  disabled={!phantomStation.terminalStateOnline}
                  onClick={() => handleQuantumExclusiveInjection('Commander Dreadnought Ship Blueprint (Exclusive)', 45)}
                  className="px-3 py-2 bg-black/65 hover:bg-[#ff1e1e]/20 text-white rounded border border-zinc-900 hover:border-[#ff1e1e]/40 transition-all font-mono text-left flex flex-col justify-between h-18 text-[11px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="font-bold">1) Commander Dreadnought</span>
                  <span className="text-red-500 font-bold block mt-1">45 Quantum Tokens</span>
                </button>
                <button
                  type="button"
                  disabled={!phantomStation.terminalStateOnline}
                  onClick={() => handleQuantumExclusiveInjection('Sovereign Fleet Alacran Carrier (Exclusive)', 120)}
                  className="px-3 py-2 bg-black/65 hover:bg-[#ff1e1e]/20 text-white rounded border border-zinc-900 hover:border-[#ff1e1e]/40 transition-all font-mono text-left flex flex-col justify-between h-18 text-[11px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="font-bold">2) Alacran Sovereign Carrier</span>
                  <span className="text-red-500 font-bold block mt-1">120 Quantum Tokens</span>
                </button>
                <button
                  type="button"
                  disabled={!phantomStation.terminalStateOnline}
                  onClick={() => handleQuantumExclusiveInjection('Origin Fleet Genesis Shield (Exclusive)', 30)}
                  className="px-3 py-2 bg-black/65 hover:bg-[#ff1e1e]/20 text-white rounded border border-zinc-900 hover:border-[#ff1e1e]/40 transition-all font-mono text-left flex flex-col justify-between h-18 text-[11px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="font-bold">3) Genesis Shield Blueprint</span>
                  <span className="text-red-500 font-bold block mt-1">30 Quantum Tokens</span>
                </button>
              </div>
            </div>

            {/* DYNAMIC DISCOUNTS AND BADGE COUPLING */}
            <div className="admin-auction-engine p-4 bg-zinc-900/40 border border-zinc-850 rounded-lg space-y-4">
              <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
                <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
                <span className="text-[10.5px] text-white font-bold uppercase block tracking-wider font-mono">
                  [ BADGE INTEGRATION ]: DESCUENTOS DINÁMICOS ACENTUADOS E INSIGNIAS
                </span>
              </div>
              <p className="text-[10.5px] text-zinc-500 leading-normal font-sans">
                Enlace insignias específicas de la base de datos empresarial de la corporación para aplicar descuentos automatizados en la Phantom Station con condiciones específicas de carrito.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
                {/* Selectors card */}
                <div className="space-y-3 p-3 bg-black/65 rounded border border-zinc-900">
                  <span className="text-[9.5px] text-zinc-400 font-bold block uppercase pb-1 border-b border-zinc-900">VINCULADOR DE INSIGNIA</span>
                  <div>
                    <label className="text-zinc-[600] text-[9.5px] block uppercase mb-1">Insignia Objetivo:</label>
                    <select
                      aria-label="Insignia Objetivo"
                      value={phantomStation.selectedBadgeDiscount}
                      onChange={(e) => {
                        const updated = { ...phantomStation, selectedBadgeDiscount: e.target.value };
                        saveToGlobalAndHUD(updated);
                        alertTrigger('success', `Insignia de descuento vinculada: ${e.target.value}`);
                      }}
                      className="w-full bg-zinc-950 border border-zinc-850 text-white rounded px-2 py-1 text-[11px] focus:outline-none"
                    >
                      <option value="AO Seal I (Alpha)">AO Seal I (Alpha) [5% Base Alacran]</option>
                      <option value="AO Seal II (Beta)">AO Seal II (Beta) [Fidelity Milestone]</option>
                      <option value="Lunar Covenant Emblem">Lunar Covenant Emblem [Exclusive]</option>
                      <option value="Viper Byte Commando Badge">Viper Byte Commando Badge</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-zinc-[600] text-[9.5px] block uppercase mb-1">Porcentaje de Rebaja:</label>
                    <div className="flex gap-2">
                      <input
                        aria-label="Ajustar Descuento de Insignia"
                        type="range"
                        min="1"
                        max="35"
                        value={phantomStation.badgeDiscountPercent}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 5;
                          const updated = { ...phantomStation, badgeDiscountPercent: val };
                          saveToGlobalAndHUD(updated);
                        }}
                        className="w-full accent-emerald-500 self-center"
                      />
                      <strong className="text-emerald-400 font-sans text-xs shrink-0 self-center">{phantomStation.badgeDiscountPercent}% OFF</strong>
                    </div>
                  </div>
                </div>

                {/* Conditions Apply Checkbox list */}
                <div className="space-y-3 p-3 bg-black/65 rounded border border-zinc-900 flex flex-col justify-between">
                  <div>
                    <span className="text-[9.5px] text-zinc-400 font-bold block uppercase pb-1 border-b border-zinc-900 mb-2">CONDICIONES EN RED (Conditions Apply)</span>
                    <span className="text-[9px] text-zinc-[600] block mb-2 leading-tight">Marque las categorías de tienda donde se aplicará este beneficio regulatorio:</span>
                    
                    <div className="space-y-1.5 font-sans">
                      {['Consumibles', 'Herramientas', 'Blueprints', 'Eventos'].map((category) => {
                        const isChecked = phantomStation.badgeDiscountCategories.includes(category);
                        return (
                          <label key={category} className="flex items-center gap-2 cursor-pointer text-zinc-300">
                            <input
                              aria-label="input element"type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                const nextCats = isChecked 
                                  ? phantomStation.badgeDiscountCategories.filter((c: string) => c !== category)
                                  : [...phantomStation.badgeDiscountCategories, category];
                                const updated = { ...phantomStation, badgeDiscountCategories: nextCats };
                                saveToGlobalAndHUD(updated);
                                alertTrigger('success', `Reglas de condiciones modificadas. Categorías de descuento: ${nextCats.join(', ') || 'Ninguna'}`);
                              }}
                              className="accent-emerald-500 rounded border-zinc-805"
                            />
                            <span className="text-[10.5px]">{category}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Context badge info display */}
                <div className="p-3 bg-emerald-950/10 border border-emerald-900/30 rounded flex flex-col justify-between text-xs">
                  <div className="space-y-1">
                    <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider block">REPORTE REBATORIO - REGULADOR</span>
                    <p className="text-[10px] font-sans leading-normal text-zinc-[500] mt-1">
                      El explorador que posea la insignia <strong className="text-white bg-zinc-900/40 px-1 rounded">{phantomStation.selectedBadgeDiscount}</strong> recibirá un descuento de <strong className="text-emerald-400 font-sans font-bold">-{phantomStation.badgeDiscountPercent}%</strong> únicamente al comprar productos de la categoría: <strong className="text-white text-[9.5px]">{phantomStation.badgeDiscountCategories.join(', ') || 'Sin Cobertura'}</strong>. Las ofertas compradas con Quantum Tokens están excluidas de esta cuota.
                    </p>
                  </div>
                  <div className="text-[8.5px] text-zinc-650 font-sans leading-none">
                    Estado en Backend: ACTIVO (BADGE_DISC_ENG)
                  </div>
                </div>
              </div>
            </div>

            {/* List of Active Supplies in Store */}
            <div className="space-y-3 pt-2">
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-mono block">
                RACK CONTROLADOR DE OFERTAS COMPILADAS SIDERALES ({phantomStation.suppliesCatalog.length}):
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {phantomStation.suppliesCatalog.map((offer: any) => {
                  // Determine stock alarm
                  const stockLeft = offer.storageLeft !== undefined ? offer.storageLeft : 5;
                  const isCriticalStock = stockLeft <= 3;
                  const itemCurrency = offer.currencyType || 'Phantom Coins';
                  const itemPrice = offer.priceValue || 500;
                  const disc = offer.discountPercent !== undefined ? offer.discountPercent : 0;

                  return (
                    <div 
                      key={offer.id} 
                      className={`p-4 bg-black/45 border rounded-lg flex flex-col justify-between font-mono text-xs relative transition-colors ${
                        isCriticalStock ? 'border-[#ff1e1e]/30 bg-[#ff1e1e]/5' : 'border-zinc-900 hover:border-zinc-800'
                      }`}
                    >
                      {/* Discount Tag */}
                      {disc > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 bg-red-650 border border-red-500 text-white text-[8px] font-black rounded font-sans tracking-wide">
                          -{disc}% OFF
                        </span>
                      )}

                      <div className="space-y-1.5 mb-3">
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-white leading-tight pr-8 block">{offer.name}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 pt-0.5">
                          {<RarityBadge rank={offer.rank || offer.category || 'Common'} />}
                          <span className="text-[9.5px] text-zinc-[500]">ID: {offer.id}</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                          <div>
                            <span className="text-zinc-[650] block text-[9px] uppercase">MONEDA</span>
                            <span className="text-zinc-300 font-bold block">{itemCurrency}</span>
                          </div>
                          <div>
                            <span className="text-zinc-[650] block text-[9px] uppercase">PRECIO COMPILADO</span>
                            <span className="text-yellow-400 font-black block">
                              {itemPrice.toLocaleString()} {offer.currencyType === 'Quantum Tokens' ? 'QT' : offer.currencyType === 'GD Coins' ? 'GD' : 'PC'}
                            </span>
                          </div>
                        </div>

                        {/* Critical stock alarm display */}
                        <div className="pt-2">
                          <span className="text-zinc-[650] block text-[9px] uppercase mb-0.5">STOCK DISPONIBLE</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-[11px] font-sans font-black ${isCriticalStock ? 'text-red-500 animate-pulse' : 'text-zinc-400'}`}>
                              {stockLeft} DISPONIBLES
                            </span>
                            {isCriticalStock && (
                              <span className="px-1 bg-red-950 border border-red-900 text-red-500 font-sans font-black text-[8px] rounded uppercase animate-pulse">
                                AGOTÁNDOSE
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2.5 border-t border-zinc-900">
                        {/* Direct Stock configuration tool */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-zinc-[650] text-[9.5px] uppercase">Ajustar Stock:</span>
                          <input 
                            aria-label="Ajustar Stock"
                            type="number"
                            min="0"
                            max="999"
                            value={stockLeft}
                            disabled={!phantomStation.terminalStateOnline}
                            onChange={(e) => {
                              const val = Math.max(0, parseInt(e.target.value) || 0);
                              const nextCatalog = {
                                ...phantomStation,
                                suppliesCatalog: phantomStation.suppliesCatalog.map((s: any) => s.id === offer.id ? { ...s, storageLeft: val } : s)
                              };
                              saveToGlobalAndHUD(nextCatalog);
                            }}
                            className="w-12 h-6 bg-zinc-950 border border-zinc-850 text-white font-bold rounded text-center text-[10px] focus:outline-none focus:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </div>

                        <button
                          aria-label="Eliminar Oferta del Suministro"
                          type="button"
                          disabled={!phantomStation.terminalStateOnline}
                          onClick={() => handleDeleteOffer(offer.id, offer.name)}
                          className="p-1 rounded bg-[#ff1e1e]/10 hover:bg-[#ff1e1e] text-[#ff1e1e] hover:text-white border border-[#ff1e1e]/25 transition-all text-[9.5px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: REFRESH ENGINE */}
        {activeTab === 'refresh_engine' && (
          <div className="space-y-6">
            {!phantomStation.terminalStateOnline && (
              <div className="p-4 bg-red-950/40 border border-red-500/30 rounded-lg flex items-center gap-3 text-red-400 font-mono text-xs mb-4">
                <AlertTriangle size={18} className="shrink-0 text-red-500 animate-pulse" />
                <div>
                  <strong className="block text-white">⚠️ MANTENIMIENTO DEL SISTEMA - TERMINAL OFFLINE</strong>
                  Para calibrar los parámetros del motor de refresco, asegúrese de que la estación no se encuentre en labores críticas, aunque los cambios se registrarán de igual forma.
                </div>
              </div>
            )}

            <div className="border-b border-zinc-900 pb-3">
              <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider block">
                [ MODULE.02 ]: CALIBRACIÓN DEL MOTOR DE ROTACIÓN Y TRANSACCIONES
              </span>
              <p className="text-[10.5px] text-zinc-550 leading-normal font-sans mt-0.5">
                Regule las tasas de refresco manual hechas por los jugadores, configure temporizadores automáticos del servidor (freeRefreshCountdown) y ajuste los costos en monedas.
              </p>
            </div>

            <div className="admin-auction-engine grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
              
              {/* Form to configure controls */}
              <div className="p-4 bg-black/45 border border-zinc-900 rounded-lg space-y-4">
                <span className="text-[10.5px] text-white font-bold block uppercase border-b border-zinc-900 pb-2">PARÁMETROS DEL MOTOR EN COLA</span>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-zinc-[500] text-[10px] block uppercase mb-1">Ajustar Límite de Refrescos Diarios (maxRefreshAttempts):</label>
                    <div className="flex flex-col sm:flex-row gap-3 sm:items-center bg-zinc-950/45 p-2 rounded border border-zinc-900">
                      <input 
                        aria-label="Intentos Máximos de Refresco (Rango)"
                        type="range"
                        min="5"
                        max="200"
                        step="1"
                        value={phantomStation.refreshAttemptsMax}
                        onChange={(e) => {
                          const val = Math.max(5, parseInt(e.target.value) || 5);
                          const updated = { ...phantomStation, refreshAttemptsMax: val };
                          saveToGlobalAndHUD(updated);
                        }}
                        className="flex-1 h-1 bg-zinc-900 rounded appearance-none cursor-pointer accent-[#ff1e1e]"
                      />
                      <div className="flex gap-2">
                        <input 
                          aria-label="Intentos Máximos de Refresco (Número)"
                          type="number" 
                          value={phantomStation.refreshAttemptsMax}
                          onChange={(e) => {
                            const val = Math.max(1, parseInt(e.target.value) || 0);
                            const updated = { ...phantomStation, refreshAttemptsMax: val };
                            saveToGlobalAndHUD(updated);
                          }}
                          className="w-16 bg-zinc-900 border border-zinc-850 text-white rounded px-2 py-1 text-center font-bold focus:outline-none focus:border-red-500"
                        />
                        <span className="text-[9.5px] text-zinc-500 self-center">Intentos</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-zinc-[500] text-[10px] block uppercase mb-1">Configurar Costo de Refresco Manual (costPerManualRefresh - Phantom Coins):</label>
                    <div className="flex flex-col sm:flex-row gap-3 sm:items-center bg-zinc-950/45 p-2 rounded border border-zinc-900">
                      <input 
                        aria-label="Costo de Refresco (Rango)"
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={phantomStation.refreshCostVoidCrystals}
                        onChange={(e) => {
                          const val = Math.max(0, parseInt(e.target.value) || 0);
                          const updated = { ...phantomStation, refreshCostVoidCrystals: val };
                          saveToGlobalAndHUD(updated);
                        }}
                        className="flex-1 h-1 bg-zinc-900 rounded appearance-none cursor-pointer accent-[#ff1e1e]"
                      />
                      <div className="flex gap-2">
                        <input 
                          aria-label="Costo de Refresco (Número)"
                          type="number" 
                          value={phantomStation.refreshCostVoidCrystals}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value) || 0);
                            const updated = { ...phantomStation, refreshCostVoidCrystals: val };
                            saveToGlobalAndHUD(updated);
                          }}
                          className="w-16 bg-zinc-900 border border-zinc-850 text-white rounded px-2 py-1 text-center font-bold focus:outline-none focus:border-red-500"
                        />
                        <span className="text-[9.5px] text-zinc-500 self-center">Coins</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-zinc-[500] text-[10px] block uppercase mb-1">Editar Intervalo de Temporizador Automático (autoRefreshGlobalInterval - segundos):</label>
                    <div className="flex flex-col sm:flex-row gap-3 sm:items-center bg-zinc-950/45 p-2 rounded border border-zinc-900">
                      <input 
                        aria-label="Cuenta regresiva de refresco gratis (Rango)"
                        type="range"
                        min="60"
                        max="86400"
                        step="60"
                        value={phantomStation.freeRefreshCountdown}
                        onChange={(e) => {
                          const val = Math.max(60, parseInt(e.target.value) || 60);
                          const updated = { ...phantomStation, freeRefreshCountdown: val };
                          saveToGlobalAndHUD(updated);
                        }}
                        className="flex-1 h-1 bg-zinc-900 rounded appearance-none cursor-pointer accent-[#ff1e1e]"
                      />
                      <div className="flex gap-2">
                        <input 
                          aria-label="Cuenta regresiva de refresco gratis (Número)"
                          type="number" 
                          value={phantomStation.freeRefreshCountdown}
                          onChange={(e) => {
                            const val = Math.max(10, parseInt(e.target.value) || 0);
                            const updated = { ...phantomStation, freeRefreshCountdown: val };
                            saveToGlobalAndHUD(updated);
                          }}
                          className="w-20 bg-zinc-900 border border-zinc-850 text-emerald-400 font-bold rounded px-2 py-1 text-center focus:outline-none focus:border-red-500"
                        />
                        <span className="text-[9.5px] text-zinc-500 self-center">Seg.</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="text-zinc-[500] text-[10px] block uppercase mb-1">Frecuencia de Auto-Refresco del Inventario Global:</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { key: '8_hours', label: '8 Horas (28k)', duration: 28800 },
                        { key: '12_hours', label: '12 Horas (43k)', duration: 43200 },
                        { key: '24_hours', label: '24 Horas (86k)', duration: 86400 }
                      ].map((preset) => (
                        <button
                          key={preset.key}
                          type="button"
                          onClick={() => {
                            const updated = { 
                              ...phantomStation, 
                              freeRefreshIntervalType: preset.key,
                              freeRefreshCountdown: preset.duration 
                            };
                            saveToGlobalAndHUD(updated);
                            alertTrigger('success', `Temporizador asignado a preset: ${preset.label}`);
                          }}
                          className={`py-1.5 px-2 rounded text-[10px] font-sans font-bold border transition-all cursor-pointer text-center ${
                            phantomStation.freeRefreshIntervalType === preset.key
                              ? 'bg-red-950/20 text-[#ff1e1e] border-[#ff1e1e]'
                              : 'bg-zinc-950 text-zinc-400 border-zinc-900 hover:text-zinc-200'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-[9.5px] text-zinc-650 leading-relaxed block">
                    *Al sincronizar la frecuencia, el backend de la Phantom Station reconfigurará los cronómetros cron de refresco de todos los clústeres globales asignados.
                  </span>
                </div>
              </div>

              {/* Engine statistics & status review */}
              <div className="p-4 bg-zinc-900/15 border border-zinc-900 rounded-lg space-y-4 flex flex-col justify-between">
                <div>
                  <span className="text-[10.5px] text-zinc-400 font-bold block uppercase border-b border-zinc-900 pb-2">ESTADO DEL MOTOR DE ROTACIÓN (ROTATION STATE)</span>
                  
                  <div className="space-y-3 pt-2 text-[11px]">
                    <div className="flex justify-between border-b border-zinc-900/60 pb-1.5 text-zinc-500">
                      <span>Refrescos Automáticos:</span>
                      <span className="text-emerald-500 font-bold">🟢 ACTIVADOS (AUTO_REF_ON)</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-900/60 pb-1.5 text-zinc-500">
                      <span>Temporizador Countdown Configurado:</span>
                      <span className="text-white font-mono font-bold">{phantomStation.freeRefreshCountdown} segundos reales</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-900/60 pb-1.5 text-zinc-500">
                      <span>Configuración Intervalo:</span>
                      <span className="text-yellow-500 font-mono font-bold uppercase">{phantomStation.freeRefreshIntervalType.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-900/60 pb-1.5 text-zinc-500">
                      <span>Intentos Quemados Promedio Hoy:</span>
                      <span className="text-yellow-500 font-mono">53 intentos / Jugador</span>
                    </div>
                    <p className="text-[11px] text-zinc-550 font-sans leading-relaxed pt-1.5">
                      Los cronómetros regulan el balance macroeconómico impidiendo la sobreinyección de naves de asalto y blueprints en el HUB. El valor de peaje previene ataques de spam de refresco manual.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!phantomStation.terminalStateOnline}
                  onClick={() => alertTrigger('success', '🔄 Forzado refresco de los 12 canales del rack de la estación.')}
                  className="w-full h-8 px-4 bg-zinc-900 hover:bg-[#ff1e1e] text-zinc-300 hover:text-white border border-zinc-800 hover:border-[#ff1e1e] rounded text-[9.5px] font-bold uppercase tracking-wider font-sans transition-all cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw size={11} className="animate-spin" />
                  Forzar Rotación Global de Stock Ahora
                </button>
              </div>
            </div>
          </div>
        )}



        {/* TAB 4: EVENTS OPS */}
        {activeTab === 'events_ops' && (
          <div className="admin-auction-engine space-y-6">
            <div className="border-b border-zinc-900 pb-3">
              <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider block">
                [ MODULE.04 ]: CONTROL DE EVENTOS ESPECIALES (LIVE OPS SYSTEM)
              </span>
              <p className="text-[10.5px] text-zinc-550 leading-normal font-sans mt-0.5">
                Regule las temporadas de eventos navideños o lunares, configure metas de recompensa de despliegues (fidelity rewards) y module la personalidad del vendedor (NPC) de la terminal.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
              
              {/* Event Switcher */}
              <div className="p-4 bg-black/45 border border-zinc-900 rounded-lg space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-[#ff1e1e]" />
                  <span className="text-[10.5px] text-white font-bold block uppercase font-mono">ACTIVADOR DE TIENDA DE EVENTO (LIVE OPS)</span>
                </div>

                <p className="text-[11px] text-zinc-500 leading-relaxed font-sans">
                  Al conmutar este conector de LiveOps, la estación Phantom reestructura su diseño de frontend para mostrar adornos navideños y activa consumibles exclusivos.
                </p>

                <div className="p-3 bg-zinc-900/60 rounded-lg flex items-center justify-between border border-zinc-850">
                  <div>
                    <span className="text-white text-[11px] font-bold block">Canal de Eventos en Caliente</span>
                    <span className="text-zinc-[600] text-[9.5px] font-sans">Forzar estética y canal de Navidad</span>
                  </div>

                  <button
                    type="button"
                    onClick={toggleEventStoreState}
                    className="p-1 cursor-pointer transition-all"
                  >
                    {eventStoreActive ? (
                      <ToggleRight size={38} className="text-[#ff1e1e]" />
                    ) : (
                      <ToggleLeft size={38} className="text-zinc-[650]" />
                    )}
                  </button>
                </div>

                <div className="pt-1.5">
                  <button
                    type="button"
                    disabled={!eventStoreActive || !phantomStation.terminalStateOnline}
                    onClick={handleInjectSeasonalExclusiveItems}
                    className="w-full py-2 px-3 bg-[#ff1e1e]/10 hover:bg-[#ff1e1e] text-[#ff1e1e] hover:text-white border border-[#ff1e1e]/30 rounded font-sans font-bold text-xs transition-all uppercase cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-center"
                  >
                    🎄 Inyectar Set de Ítems Navideños
                  </button>
                  {!eventStoreActive && (
                    <span className="text-[9px] text-zinc-600 block mt-1 text-center font-sans">
                      Active el Canal de Eventos en Caliente para desbloquear la inyección estacional.
                    </span>
                  )}
                </div>

                {/* Seasonal items preview pane */}
                <div className="mt-3 p-2.5 bg-zinc-950 border border-zinc-904 rounded font-mono text-[9.5px]">
                  <div className="flex justify-between items-center text-zinc-400 font-bold border-b border-zinc-900 pb-1 mb-1.5 uppercase">
                    <span>Estado Recipiente Seasonal</span>
                    <span className="text-[#ff1e1e] text-[8.5px]">SIDER_LIVE_OPS</span>
                  </div>
                  {phantomStation.suppliesCatalog.some((s: any) => s.id?.startsWith('evt_item')) ? (
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {phantomStation.suppliesCatalog.filter((s: any) => s.id?.startsWith('evt_item')).map((item: any) => (
                        <div key={item.id} className="flex justify-between items-center bg-zinc-900/40 p-1.5 rounded border border-zinc-850">
                          <div>
                            <span className="text-white block font-sans font-semibold text-[10px]">{item.name}</span>
                            <div className="flex gap-2 text-[8px] text-zinc-500 mt-0.5">
                              <span>Rango: <RarityBadge rank={item.rank || 'Legendary'} /></span>
                              <span>Stock: <span className="text-emerald-400 font-bold">{item.storageLeft}</span></span>
                            </div>
                          </div>
                          <span className="text-yellow-400 font-bold font-sans text-[10px]">{item.priceValue} {item.currencyType === 'GD Coins' ? 'GD' : item.currencyType === 'Quantum Tokens' ? 'QT' : 'PC'}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-2 text-zinc-650 h-12 flex items-center justify-center font-sans border border-dashed border-zinc-900 rounded bg-zinc-900/10">
                      <span>No hay items navideños inyectados en el catálogo actualmente.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Terminal State Switcher (Online / Offline) */}
              <div className="p-4 bg-black/45 border border-[#ff1e1e]/20 rounded-lg space-y-4">
                <div className="flex items-center gap-2">
                  <Power size={14} className={phantomStation.terminalStateOnline ? 'text-emerald-500' : 'text-[#ff1e1e]'} />
                  <span className="text-[10.5px] text-white font-bold block uppercase font-mono">ESTADO DE ACCESIBILIDAD DE TERMINAL (SISTEMA MAIN SWITCH)</span>
                </div>

                <p className="text-[11px] text-zinc-500 leading-relaxed font-sans">
                  Conmute para suspender temporalmente la terminal de la Phantom Station por mantenimiento en caliente. Desactivarla bloquea compras en el cliente.
                </p>

                <div className="p-3 bg-zinc-900/60 rounded-lg flex items-center justify-between border border-zinc-850">
                  <div>
                    <span className="text-white text-[11px] font-bold block">Terminal State Control</span>
                    <span className={`text-[9.5px] font-sans font-bold ${phantomStation.terminalStateOnline ? 'text-emerald-500' : 'text-[#ff1e1e]'}`}>
                      {phantomStation.terminalStateOnline ? 'ONLINE - COMPRAS HABILITADAS' : 'OFFLINE - CONSOLA EN SUSPENSO'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const updated = { ...phantomStation, terminalStateOnline: !phantomStation.terminalStateOnline };
                      saveToGlobalAndHUD(updated);
                      alertTrigger(
                        updated.terminalStateOnline ? 'success' : 'warning',
                        updated.terminalStateOnline ? '🟢 Estación restablecida. Canal de venta Online para todo el clúster.' : '🔴 Estación bloqueada en mantenimiento Offline. Transacciones en suspenso.'
                      );
                    }}
                    className="p-1 cursor-pointer transition-all"
                  >
                    {phantomStation.terminalStateOnline ? (
                      <ToggleRight size={38} className="text-emerald-500" />
                    ) : (
                      <ToggleLeft size={38} className="text-[#ff1e1e]" />
                    )}
                  </button>
                </div>
              </div>

              {/* Blueprint Goal Loyalty Program Adjuster */}
              <div className="p-4 bg-black/45 border border-zinc-900 rounded-lg space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Database size={14} className="text-[#ff1e1e]" />
                    <span className="text-[10.5px] text-white font-bold block uppercase font-mono">PROGRAMA DE LEALTAD ("UNIDADES DESPLEGADAS")</span>
                  </div>

                  <p className="text-[11px] text-zinc-500 leading-relaxed font-sans mt-2">
                    Ajuste la meta del contador de la barra de progreso "UNIDADES DESPLEGADAS" vinculada a las variables reales <code className="text-zinc-300">playerBlueprintProgress</code> y <code className="text-zinc-300">totalBlueprintsGoal</code>.
                  </p>

                  <div className="mt-4 space-y-3">
                    <div className="flex justify-between text-[11.5px]">
                      <span className="text-zinc-405">Objetivo Técnico Activo (totalBlueprintsGoal):</span>
                      <strong className="text-emerald-400">{phantomStation.totalBlueprintsGoal} Planos</strong>
                    </div>

                    <div className="flex gap-3">
                      <input 
                        aria-label="Meta de Planos de Construcción (Rango)"
                        type="range" 
                        min="10" 
                        max="200" 
                        step="5"
                        value={phantomStation.totalBlueprintsGoal}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 50;
                          const updated = { ...phantomStation, totalBlueprintsGoal: val };
                          saveToGlobalAndHUD(updated);
                        }}
                        className="w-full h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-[#ff1e1e]"
                      />
                      <input 
                        aria-label="Meta de Planos de Construcción (Número)"
                        type="number"
                        value={phantomStation.totalBlueprintsGoal}
                        onChange={(e) => {
                          const val = Math.max(10, Math.min(250, parseInt(e.target.value) || 50));
                          const updated = { ...phantomStation, totalBlueprintsGoal: val };
                          saveToGlobalAndHUD(updated);
                        }}
                        className="w-16 bg-zinc-950 border border-zinc-850 rounded px-2 text-white font-bold py-0.5 text-center text-[11.5px]"
                      />
                    </div>
                    
                    <div className="flex justify-between text-[9px] text-zinc-[650]">
                      <span>Mínimo: 10 planos</span>
                      <span>Máximo: 200 planos</span>
                    </div>

                    <div className="pt-2">
                      <label className="text-zinc-550 text-[10px] block uppercase mb-1">Configurar Recompensa por Meta Alcanzada:</label>
                      <select
                        aria-label="Configurar Recompensa por Meta Alcanzada"
                        value={phantomStation.loyaltyRewardType}
                        onChange={(e) => {
                          const updated = { ...phantomStation, loyaltyRewardType: e.target.value };
                          saveToGlobalAndHUD(updated);
                          alertTrigger('success', `Compensación de fidelidad reconfigurada a: ${e.target.value}`);
                        }}
                        className="w-full bg-zinc-950 border border-zinc-850 text-white rounded px-2 py-1.5 focus:outline-none focus:border-red-500 mt-1"
                      >
                        <option value="Origin Box">Caja Especial: Origin Box (Fidelidad Superior)</option>
                        <option value="+1000 GD Coins">Inyección de Fondos: +1000 GD Coins en Cuenta</option>
                        <option value="Insignia Exclusiva (Alacran Honor Seal)">Insignia Consular: AO Seal II (Alacran Honor)</option>
                        <option value="Materializador Elite T3">Suministro de Fabricación: Materializador Elite T3</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-900">
                  <span className="text-[9px] text-zinc-[650] leading-relaxed block">
                    *El valor se enlaza a la variable global `totalBlueprintsGoal` para recalibrar los porcentajes visuales y dispensar el premio.
                  </span>
                </div>
              </div>

              {/* Lore & Station Operator (NPC Manager) */}
              <div className="p-4 bg-black/45 border border-zinc-900 rounded-lg space-y-4">
                <div className="flex items-center gap-2">
                  <HelpCircle size={14} className="text-[#ff1e1e]" />
                  <span className="text-[10.5px] text-white font-bold block uppercase font-mono">OPERADOR DE LA TERMINAL DE CAMPAÑA (NPC LORE ENGINE)</span>
                </div>

                <p className="text-[11px] text-zinc-500 leading-normal font-sans">
                  Personalice el nombre del dependiente que atiende la Phantom Station, su avatar interactivo de temporada y el texto-tip que aparece en la bienvenida del shopping de los clústeres.
                </p>

                <div className="space-y-3 font-mono">
                  {/* Select NPC Avatar */}
                  <div>
                    <label className="text-zinc-[600] text-[9.5px] block uppercase mb-1 flex items-center gap-1">
                      <span>Selector de Perfil (Avatar):</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      {[
                        { key: 'colloidal_syndicate', label: 'Síndico Coloidal', color: 'bg-indigo-900/30 text-indigo-400 border-indigo-900' },
                        { key: 'space_christmas_claus', label: 'Santa Claus', color: 'bg-red-900/30 text-red-400 border-red-900' },
                        { key: 'grinch_hacker', label: 'El Grinch Hacker', color: 'bg-emerald-900/30 text-emerald-400 border-emerald-900' },
                        { key: 'alacran_commandant', label: 'Lord Alacrán', color: 'bg-rose-900/30 text-rose-400 border-rose-900' }
                      ].map((npc) => (
                        <button
                          key={npc.key}
                          type="button"
                          onClick={() => {
                            let nameForNpc = 'Síndico Coloidal';
                            let welcomePhrase = 'TODO TIENE UN VALOR';
                            if (npc.key === 'space_christmas_claus') {
                              nameForNpc = 'Santa Claus del Hangar';
                              welcomePhrase = '¡FELIZ HANGAR DE NAVIDAD A TODOS!';
                            } else if (npc.key === 'grinch_hacker') {
                              nameForNpc = 'El Grinch de Sombra';
                              welcomePhrase = 'LA QUEMA DE PHANTOMS ES MI EVENTO PREFERIDO';
                            } else if (npc.key === 'alacran_commandant') {
                              nameForNpc = 'Lord Comandante Alacrán';
                              welcomePhrase = 'LA ORDEN ALACRÁN DECLARA ESTADO DE BENEFICIOS';
                            }
                            const updated = { 
                              ...phantomStation, 
                              npcAvatar: npc.key, 
                              npcName: nameForNpc,
                              npcGreeting: welcomePhrase
                            };
                            saveToGlobalAndHUD(updated);
                            alertTrigger('success', `Dependiente de campaña asignado: ${nameForNpc}`);
                          }}
                          className={`p-2 rounded border text-left font-sans text-[10px] tracking-wide font-medium transition-all cursor-pointer ${
                            phantomStation.npcAvatar === npc.key
                              ? `${npc.color} bg-opacity-40 animate-pulse font-bold`
                              : 'bg-zinc-950 border-zinc-900 text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          {npc.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* NPC Custom Name Input */}
                  <div>
                    <label className="text-zinc-[650] text-[9.5px] block uppercase mb-1 flex items-center justify-between">
                      <span>Nombre Físico del Dependiente (lore):</span>
                    </label>
                    <input
                      aria-label="Nombre del NPC"
                      type="text"
                      value={phantomStation.npcName}
                      onChange={(e) => {
                        const updated = { ...phantomStation, npcName: e.target.value };
                        saveToGlobalAndHUD(updated);
                      }}
                      className="w-full bg-zinc-950 border border-zinc-850 rounded px-2 py-1 text-white text-[11px] focus:outline-none"
                    />
                  </div>

                  {/* Greeting welcome phrase Custom Greeting */}
                  <div>
                    <label className="text-zinc-[650] text-[9.5px] block uppercase mb-1">Inscripción / Frase de Bienvenida (Greeting):</label>
                    <input
                      aria-label="Frase de Bienvenida del NPC"
                      type="text"
                      value={phantomStation.npcGreeting}
                      onChange={(e) => {
                        const updated = { ...phantomStation, npcGreeting: e.target.value };
                        saveToGlobalAndHUD(updated);
                      }}
                      className="w-full bg-zinc-950 border border-zinc-850 rounded px-2 py-1 text-white text-[11px] focus:outline-none text-yellow-405"
                    />
                    <span className="text-[8.5px] text-zinc-[650] block mt-1 leading-normal font-sans">
                      *La frase de bienvenida provee sutiles sugerencias o pistas referidas a misterios o recompensas de próximas campañas.
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 5: ECONOMY AUDIT */}
        {activeTab === 'economy_audit' && (
          <div className="admin-auction-engine space-y-6">
            <div className="border-b border-zinc-900 pb-3">
              <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider block">
                [ MODULE.05 ]: MONITOR DE QUEMA DE MONEDA Y VISOR OFICIAL LOGS (GD)
              </span>
              <p className="text-[10.5px] text-zinc-550 leading-normal font-sans mt-0.5">
                Revise la quema estricta de Phantom Coins en refrescos y controle la banca central de egresos de la corporación bajo la categoría oficial "GD".
              </p>
            </div>

            {/* Recharts Area Chart for Phantom Coins burnt */}
            <div className="p-4 bg-black/45 border border-zinc-900 rounded-lg space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
                <span className="text-[10px] text-white font-bold uppercase tracking-wider block">CURVA EN TIEMPO REAL: QUEMA DE PHANTOM COINS POR REFRESCOS MANUALES</span>
                <span className="text-[9px] text-zinc-550 uppercase">Categoría: SIDER_BURNT</span>
              </div>

              <div className="h-52 w-full text-xs font-mono">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={burntLogs}
                    margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorBurnt" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ff1e1e" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#ff1e1e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1d1d21" vertical={false} />
                    <XAxis dataKey="hour" stroke="#71717a" tickLine={false} axisLine={false} />
                    <YAxis stroke="#71717a" tickLine={false} axisLine={false} dx={-10} />
                    <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a' }} labelStyle={{ color: '#a1a1aa' }} />
                    <Area type="monotone" dataKey="burnt" stroke="#ff1e1e" name="Monedas Phantoms Quemadas" fillOpacity={1} fill="url(#colorBurnt)" strokeWidth={1.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Logs Visor GD (Consumos y Central Bank) */}
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono">
                <span>RESTRICCIÓN DE LA BANCA CENTRAL - CATEGORÍA DE REGISTRO "GD"</span>
                <button
                  type="button"
                  onClick={() => {
                    const nextLogs = [
                      { id: `TX-GD-${Math.floor(Math.random() * 900) + 100}`, timestamp: new Date().toISOString(), username: 'SasoriAlpha', action: 'Inyección Suministro: Condensador de Energía T3', currency: 'Quantum Tokens', amount: 150, balanceAfter: phantomStation.phantomCrystalsBalance },
                      ...gdLogs
                    ];
                    setGdLogs(nextLogs);
                    localStorage.setItem('phantom_gd_logs', JSON.stringify(nextLogs));
                    alertTrigger('success', 'Generado un log de consumo GD simulado del usuario.');
                  }}
                  className="px-2 py-0.5 bg-zinc-900 hover:bg-[#ff1e1e] border border-zinc-800 hover:border-[#ff1e1e] text-zinc-300 hover:text-white rounded text-[8.5px] font-sans font-black flex items-center gap-1.5 cursor-pointer"
                >
                  Simular Transacción de Usuario
                </button>
              </div>

              <div className="bg-black/45 border border-zinc-900 rounded-lg overflow-hidden font-mono text-[10px] max-h-56 overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-950 border-b border-zinc-900 text-zinc-450 text-[9.5px] uppercase font-bold">
                      <th className="p-3">ID TX / TIEMPO</th>
                      <th className="p-3">EXPLORADOR (USER)</th>
                      <th className="p-3">ACCIÓN / CONSUMO DETECTADO</th>
                      <th className="p-3 text-right">MAGNITUD BANCO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gdLogs.map((log) => (
                      <tr key={log.id} className="border-b border-zinc-900/60 hover:bg-zinc-900/20 transition-all">
                        <td className="p-3 text-zinc-550 leading-relaxed">
                          <span className="text-[#ff1e1e] block font-bold">{log.id}</span>
                          <span className="text-[8.5px] text-zinc-600 block">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </td>
                        <td className="p-3 font-bold text-white max-w-[125px] truncate">{log.username}</td>
                        <td className="p-3 text-zinc-400">
                          {log.action}
                        </td>
                        <td className="p-3 text-right text-yellow-400 font-bold whitespace-nowrap">
                          {log.amount > 0 ? `-${log.amount}` : log.amount} {log.currency === 'GD Coins' ? 'GD' : log.currency === 'Quantum Tokens' ? 'QT' : 'PC'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
