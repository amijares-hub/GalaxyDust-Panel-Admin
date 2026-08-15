import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Edit, Trash2, Search, Sliders, Shield, Zap, RefreshCw, 
  Settings, Save, Copy, Power, AlertTriangle, User, Compass, HelpCircle, HardDrive,
  TrendingUp, Star, Filter, Heart, ChevronLeft, ChevronRight, X, Clock, Navigation,
  Download, Building, Award, Cpu, BookOpen
} from 'lucide-react';
import { UserProfile } from '../types';
import { supabase } from '../lib/supabase';
import { 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import CombatSandboxTester, { CombatSandboxOverlay } from './CombatSandboxTester';

// ─── INTERFACES DE MODELO ───
interface ShipSeed {
  ship_id: string;
  ship_name: string;
  description: string;
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Phantom' | 'Xmas';
  avatar_url: string;
  can_level_required: number;
  blueprints_required: number;
  resistance: number;
  shield: number;
  defense: number;
  speed_boost: number;
  combat_speed: number;
  engine: 'Combustión' | 'Impulso' | 'Hiperespacio' | 'Phantom' | 'Exclusive' | 'Xmas';
  damage_type: 'Kinetic' | 'Laser' | 'Plasma' | 'Ionic' | 'Graviton';
  collection: string;
  ship_role: 'Attack' | 'Hybrid' | 'Transport' | 'Explorer' | 'Miner' | 'Defense' | 'Spy' | 'Racing' | 'Carrier' | string;
  ship_size: 'Fighter' | 'Mighty' | 'Massive' | 'Commander' | 'Mini';
  attack_standard: number;
  attack_ionic: number;
  attack_plasma: number;
  attack_laser: number;
  attack_graviton: number;
  cargo_capacity: number;
  production_min: number;
  production_max: number;
  series: string;
  skills: string[];
  skill_requirements: string;
  blockchain_asset_id?: string;
  user_asset_id?: string;
  required_metal?: number;
  required_crystal?: number;
  damage_factor?: number;
}

interface StructureAsset {
  id: string;
  name: string;
  avatar_url: string;
  description: string;
  company: string;
  collection: string;
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Exclusive';
  type: 'Producción' | 'Instalaciones/Facilities' | 'Híbridas' | 'Misceláneas';
  production_rate: number;
  capacity: number;
  efficiency: number;
  durability: number;
  power_score: number;
  skills: string[];
}

interface TechnologyAsset {
  id: string;
  name: string;
  avatar_url: string;
  description: string;
  company: string;
  collection: string;
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Exclusive';
  type: 'Transporte' | 'Tecnología Militar/MiliTech' | 'Producción' | 'Espionaje' | 'Otros';
  effectiveness: number;
  scope: string;
  resource_efficiency: number;
  power_score: number;
  skills: string[];
}

interface BadgeAsset {
  id: string;
  name: string;
  description: string;
  collection: string;
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Exclusive';
  type: 'Producción' | 'Guerra/War' | 'Expedición' | 'Flota/Fleet' | 'Híbrido';
  effect: string;
  stack: 'No Stackeable' | 'Stackeable' | 'Stack x2' | 'Stack x5';
  duration: 'Permanent' | '1 Semana' | '1 Mes' | '3 Meses' | '1 Año';
  badge_slot: string;
  power_score: number;
}

interface UserHangarShip {
  userShipId: string;
  shipId: string;
  name: string;
  stars: number;
  level: number;
  blueprintsOwned: number;
  blueprintsRequired: number;
  flightState: 'SAFE' | 'TRANSITING' | 'INFINITE_LOCK';
  lastLog: string;
}

interface AdminShipsModuleProps {
  users: UserProfile[];
  setIsAlertToShow: (alert: { show: boolean; status: 'success' | 'error'; message: string }) => void;
  onRefreshData?: () => void;
}

// ─── INITIAL SEED MOCKS (FALLBACK) ───
const INITIAL_SEED_STRUCTURES: StructureAsset[] = [
  {
    id: "str_01",
    name: "Mina de Orichaltron Hassac-X",
    avatar_url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=200&auto=format&fit=crop",
    description: "Unidad minera pesada automatizada diseñada por Hassac para fracturar los filones polimétlicos profundos.",
    company: "Hassac",
    collection: "Sasori Core",
    rarity: "Epic",
    type: "Producción",
    production_rate: 1850,
    capacity: 250000,
    efficiency: 94,
    durability: 8500,
    power_score: 1200,
    skills: ["Extracción Alfa: +10% metal base", "Compresión de Sólidos: +15% producción diaria"]
  },
  {
    id: "str_02",
    name: "Laboratorio Cuántico Dramco",
    avatar_url: "https://images.unsplash.com/photo-1507668077129-56e32842fceb?q=80&w=200&auto=format&fit=crop",
    description: "Complejo de investigación avanzada centrado en simular interacciones de deuterio inestable.",
    company: "Dramco",
    collection: "Nova Division",
    rarity: "Legendary",
    type: "Instalaciones/Facilities",
    production_rate: 0,
    capacity: 0,
    efficiency: 98,
    durability: 12000,
    power_score: 2500,
    skills: ["Investigación Base: Reduce tiempo en 10%", "Simulación de Partículas: +10% efectividad militar"]
  }
];

const INITIAL_SEED_TECHNOLOGIES: TechnologyAsset[] = [
  {
    id: "tech_01",
    name: "Propulsor de Hiperespacio Cuántico",
    avatar_url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=200&auto=format&fit=crop",
    description: "Fórmula de empuje sub-molecular que minimiza la distorsión del campo magnético galáctico.",
    company: "Monsur",
    collection: "Sasori Core",
    rarity: "Legendary",
    type: "Transporte",
    effectiveness: 15,
    scope: "Toda la flota",
    resource_efficiency: 92,
    power_score: 1800,
    skills: ["Velocidad Warp I: +15% Travel Speed", "Consumo Integrado: -5% deuterio"]
  }
];

const INITIAL_SEED_BADGES: BadgeAsset[] = [
  {
    id: "badge_01",
    name: "Insignia Nova Guardian 2026",
    description: "Insignia conmemorativa forjada para los comandantes sobrevivientes al asedio del Núcleo Alfa.",
    collection: "Nova Series",
    rarity: "Legendary",
    type: "Guerra/War",
    effect: "+8% de escudo a toda la armada, +12% de ataque iónico.",
    stack: "No Stackeable",
    duration: "Permanent",
    badge_slot: "Consume 1 ranura en C.A.N.",
    power_score: 1500
  }
];

export default function AdminShipsModule({ 
  users, 
  setIsAlertToShow,
  onRefreshData 
}: AdminShipsModuleProps) {

  // Pestaña Principal
  const [activeTab, setActiveTab] = useState<'atelier' | 'hangar' | 'fabricacion' | 'bitacora' | 'sandbox'>('atelier');
  // Subpestaña de Assets en el Taller Estelar
  const [activeAssetSubTab, setActiveAssetSubTab] = useState<'ships' | 'structures' | 'technologies' | 'badges'>('ships');

  // Estados de Selección en Lote y Fabricación
  const [bulkSelectedShipIds, setBulkSelectedShipIds] = useState<string[]>([]);
  const [globalMetalMultiplier, setGlobalMetalMultiplier] = useState<number>(1.2);
  const [globalCrystalMultiplier, setGlobalCrystalMultiplier] = useState<number>(1.15);
  const [simulatedBlueprintCount, setSimulatedBlueprintCount] = useState<number>(50);

  // ─── 🚀 ESTADOS Y MÉTODOS DE NAVES ───
  const [shipsList, setShipsList] = useState<ShipSeed[]>([]);
  const [loadingKernel, setLoadingKernel] = useState(true);

  const fetchRealShipsCatalog = async () => {
    try {
      setLoadingKernel(true);
      const { data, error } = await supabase.from('seed_ships').select('*').order('ship_name', { ascending: true });
      if (error) throw error;
      if (data) {
        const formattedShips: ShipSeed[] = data.map((dbShip: any) => ({
          ship_id: dbShip.ship_id,
          ship_name: dbShip.ship_name,
          description: dbShip.description || '',
          rarity: dbShip.rarity || 'Common',
          avatar_url: dbShip.avatar_url || "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=200",
          can_level_required: dbShip.can_level_required || 1,
          blueprints_required: dbShip.blueprints_required || 10,
          resistance: Number(dbShip.resistance) || 1000,
          shield: Number(dbShip.shield) || 500,
          defense: Number(dbShip.defense) || 25,
          speed_boost: dbShip.speed_boost || 400,
          combat_speed: dbShip.combat_speed || 200,
          engine: dbShip.engine || 'Combustión',
          damage_type: dbShip.damage_type || 'Laser',
          collection: dbShip.collection || 'Sasori Core',
          ship_role: dbShip.ship_role || 'Attack',
          ship_size: dbShip.ship_size || 'Fighter',
          attack_standard: Number(dbShip.attack_standard) || 500,
          attack_laser: Number(dbShip.attack_laser) || 250,
          attack_ionic: Number(dbShip.attack_ionic) || 100,
          attack_plasma: Number(dbShip.attack_plasma) || 50,
          attack_graviton: Number(dbShip.attack_graviton) || 0,
          cargo_capacity: Number(dbShip.cargo_capacity) || 3500,
          production_min: Number(dbShip.production_min) || 15,
          production_max: Number(dbShip.production_max) || 60,
          series: dbShip.series || 'SERIES-I',
          skills: dbShip.skills || [],
          skill_requirements: dbShip.skill_requirements || ''
        }));
        setShipsList(formattedShips);
      }
    } catch (err: any) {
      console.error("Fallo de enlace con seed_ships:", err.message);
    } finally {
      setLoadingKernel(false);
    }
  };

  useEffect(() => {
    fetchRealShipsCatalog();
  }, []);

  // ─── 🏢 ESTADOS DE ESTRUCTURAS, TECNOLOGÍAS E INSIGNIAS ───
  const [structuresList, setStructuresList] = useState<StructureAsset[]>(INITIAL_SEED_STRUCTURES);
  const [technologiesList, setTechnologiesList] = useState<TechnologyAsset[]>(INITIAL_SEED_TECHNOLOGIES);
  const [badgesList, setBadgesList] = useState<BadgeAsset[]>(INITIAL_SEED_BADGES);

  const [selectedStructure, setSelectedStructure] = useState<StructureAsset | null>(null);
  const [selectedTechnology, setSelectedTechnology] = useState<TechnologyAsset | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<BadgeAsset | null>(null);

  const [editedStructureForm, setEditedStructureForm] = useState<Partial<StructureAsset>>({});
  const [editedTechnologyForm, setEditedTechnologyForm] = useState<Partial<TechnologyAsset>>({});
  const [editedBadgeForm, setEditedBadgeForm] = useState<Partial<BadgeAsset>>({});

  const [isNewStructure, setIsNewStructure] = useState(false);
  const [isNewTechnology, setIsNewTechnology] = useState(false);
  const [isNewBadge, setIsNewBadge] = useState(false);

  // ─── BUSCADORES Y FILTROS ───
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEngine, setFilterEngine] = useState<string>('all');
  const [filterRarity, setFilterRarity] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('none');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [selectedShip, setSelectedShip] = useState<ShipSeed | null>(null);
  const [showSandboxModal, setShowSandboxModal] = useState(false);
  
  const [bulkRarity, setBulkRarity] = useState<string>('no_change');
  const [bulkEngine, setBulkEngine] = useState<string>('no_change');

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<any[]>(() => {
    const saved = localStorage.getItem('saso_audit_logs');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [{
      id: "log-init-ship",
      timestamp: new Date().toISOString(),
      action: "INITIALIZE",
      entity_type: "SYSTEM_DAPP",
      entity_id: "SYSTEM",
      details: "Servicio de auditoría integral de activos en dApp inicializado."
    }];
  });

  const addAuditLog = (action: string, entity_type: string, entity_id: string, details: string) => {
    const entry = { id: 'log-' + Math.random().toString(36).substring(2, 11), timestamp: new Date().toISOString(), action, entity_type, entity_id, details };
    setAuditLogs(prev => {
      const updated = [entry, ...prev];
      localStorage.setItem('saso_audit_logs', JSON.stringify(updated));
      return updated;
    });
  };

  const downloadAuditLogsCSV = () => {
    const headers = ["ID", "Timestamp", "Action", "Entity Type", "Entity ID", "Details"];
    const rows = auditLogs.map(log => [log.id, log.timestamp, log.action, log.entity_type, log.entity_id, `"${(log.details || '').replace(/"/g, '""')}"`]);
    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `historial_modificaciones_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [isNewShip, setIsNewShip] = useState(false);
  const [editedShipForm, setEditedShipForm] = useState<Partial<ShipSeed>>({});
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [shipIdToDelete, setShipIdToDelete] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const filteredShips = useMemo(() => {
    let result = shipsList.filter(ship => {
      const matchSearch = ship.ship_name.toLowerCase().includes(searchQuery.toLowerCase()) || ship.ship_id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchEngine = filterEngine === 'all' || ship.engine === filterEngine;
      const matchRarity = filterRarity === 'all' || ship.rarity.toLowerCase() === filterRarity.toLowerCase();
      return matchSearch && matchEngine && matchRarity;
    });

    if (sortBy !== 'none') {
      result.sort((a, b) => {
        let valA: any = 0; let valB: any = 0;
        if (sortBy === 'name') { valA = a.ship_name.toLowerCase(); valB = b.ship_name.toLowerCase(); }
        else if (sortBy === 'rarity') {
          const rarities: Record<string, number> = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5, phantom: 6, xmas: 7 };
          valA = rarities[a.rarity.toLowerCase()] || 0; valB = rarities[b.rarity.toLowerCase()] || 0;
        } else if (sortBy === 'power') {
          valA = (a.resistance || 0) + (a.shield || 0) + (a.attack_standard || 0) * 5;
          valB = (b.resistance || 0) + (b.shield || 0) + (b.attack_standard || 0) * 5;
        }
        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [shipsList, searchQuery, filterEngine, filterRarity, sortBy, sortOrder]);

  const paginatedShips = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredShips.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredShips, currentPage]);

  const totalPages = Math.ceil(filteredShips.length / itemsPerPage);

  // ─── NAVES HANDLERS ───
  const handleOpenShipTaller = (ship: ShipSeed) => {
    setSelectedShip(ship); setIsNewShip(false); setEditedShipForm({ ...ship });
  };

  const handleOpenBlankTaller = () => {
    const randomUuid = 'ship_sc_' + Math.floor(Math.random() * 100000000);
    setSelectedShip(null); setIsNewShip(true);
    setEditedShipForm({
      ship_id: randomUuid, ship_name: '', description: '', rarity: 'Common',
      avatar_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=200&auto=format&fit=crop',
      can_level_required: 1, blueprints_required: 10, resistance: 1000, shield: 500, defense: 25,
      speed_boost: 400, engine: 'Combustión', damage_type: 'Laser', collection: 'Sasori Core',
      ship_role: 'Attack', ship_size: 'Fighter', attack_standard: 500, attack_ionic: 100,
      attack_plasma: 50, attack_laser: 250, attack_graviton: 0, cargo_capacity: 3500,
      production_min: 15, production_max: 60, series: "S-GEN-01", skills: ["Sistemas Auxiliares"],
      skill_requirements: "Requiere Nivel 1 CAN"
    });
  };

  const handleSaveShipKernel = async () => {
    if (!editedShipForm.ship_name?.trim()) {
      setIsAlertToShow({ show: true, status: 'error', message: 'Nombre de Nave obligatorio.' });
      return;
    }
    try {
      const payload: any = { ...editedShipForm };
      const numericFields = ['can_level_required', 'blueprints_required', 'resistance', 'shield', 'defense', 'speed_boost', 'combat_speed', 'attack_standard', 'attack_ionic', 'attack_plasma', 'attack_laser', 'attack_graviton', 'cargo_capacity', 'production_min', 'production_max'];
      numericFields.forEach(field => { if (payload[field] !== undefined) payload[field] = Number(payload[field]) || 0; });

      if (isNewShip) {
        const { error } = await supabase.from('seed_ships').insert([payload]);
        if (error) throw error;
        addAuditLog("CREATE", "SHIP", payload.ship_id!, `Creado plano de nave "${payload.ship_name}".`);
      } else {
        const id = payload.ship_id; delete payload.ship_id;
        const { error } = await supabase.from('seed_ships').update(payload).eq('ship_id', id);
        if (error) throw error;
        addAuditLog("UPDATE", "SHIP", id!, `Actualizada nave "${payload.ship_name}".`);
      }

      setIsAlertToShow({ show: true, status: 'success', message: '¡Nave guardada con éxito en Supabase!' });
      setSelectedShip(null); setIsNewShip(false); setEditedShipForm({}); fetchRealShipsCatalog();
    } catch (err: any) { alert(`Error al guardar nave: ${err.message}`); }
  };

  const handleConfirmDeleteShip = async () => {
    if (!shipIdToDelete) return;
    try {
      const { error } = await supabase.from('seed_ships').delete().eq('ship_id', shipIdToDelete);
      if (error) throw error;
      addAuditLog("DELETE", "SHIP", shipIdToDelete, "Nave eliminada.");
      setIsDeleteConfirmOpen(false); setShipIdToDelete(null); setSelectedShip(null); fetchRealShipsCatalog();
      setIsAlertToShow({ show: true, status: 'error', message: 'Plano de nave borrado.' });
    } catch (err: any) { alert(`Error al purgar: ${err.message}`); }
  };

  // ─── ESTRUCTURAS, TECNOLOGÍAS E INSIGNIAS HANDLERS ───
  const handleOpenBlankStructure = () => {
    setSelectedStructure(null); setIsNewStructure(true);
    setEditedStructureForm({
      id: 'str_' + Math.floor(Math.random() * 10000000), name: '',
      avatar_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=200',
      description: '', company: 'Hassac', collection: 'Sasori Core', rarity: 'Common',
      type: 'Producción', production_rate: 100, capacity: 10000, efficiency: 80, durability: 5000, power_score: 500, skills: []
    });
  };

  const handleSaveStructure = () => {
    if (!editedStructureForm.name?.trim()) return;
    if (isNewStructure) {
      setStructuresList(prev => [editedStructureForm as StructureAsset, ...prev]);
    } else {
      setStructuresList(prev => prev.map(s => s.id === editedStructureForm.id ? (editedStructureForm as StructureAsset) : s));
    }
    addAuditLog(isNewStructure ? "CREATE" : "UPDATE", "STRUCTURE", editedStructureForm.id!, `Estructura "${editedStructureForm.name}".`);
    setSelectedStructure(null);
    setIsAlertToShow({ show: true, status: 'success', message: 'Estructura guardada con éxito.' });
  };

  const handleOpenBlankTechnology = () => {
    setSelectedTechnology(null); setIsNewTechnology(true);
    setEditedTechnologyForm({
      id: 'tech_' + Math.floor(Math.random() * 10000000), name: '',
      avatar_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=200',
      description: '', company: 'Monsur', collection: 'Sasori Core', rarity: 'Common',
      type: 'Producción', effectiveness: 5, scope: 'Toda la flota', resource_efficiency: 85, power_score: 400, skills: []
    });
  };

  const handleSaveTechnology = () => {
    if (!editedTechnologyForm.name?.trim()) return;
    if (isNewTechnology) {
      setTechnologiesList(prev => [editedTechnologyForm as TechnologyAsset, ...prev]);
    } else {
      setTechnologiesList(prev => prev.map(t => t.id === editedTechnologyForm.id ? (editedTechnologyForm as TechnologyAsset) : t));
    }
    addAuditLog(isNewTechnology ? "CREATE" : "UPDATE", "TECHNOLOGY", editedTechnologyForm.id!, `Tecnología "${editedTechnologyForm.name}".`);
    setSelectedTechnology(null);
    setIsAlertToShow({ show: true, status: 'success', message: 'Tecnología guardada con éxito.' });
  };

  const handleOpenBlankBadge = () => {
    setSelectedBadge(null); setIsNewBadge(true);
    setEditedBadgeForm({
      id: 'badge_' + Math.floor(Math.random() * 10000000), name: '',
      description: '', collection: 'Sasori Core', rarity: 'Common', type: 'Producción',
      effect: '+5% producción', stack: 'No Stackeable', duration: 'Permanent', badge_slot: 'Consume 1 ranura', power_score: 300
    });
  };

  const handleSaveBadge = () => {
    if (!editedBadgeForm.name?.trim()) return;
    if (isNewBadge) {
      setBadgesList(prev => [editedBadgeForm as BadgeAsset, ...prev]);
    } else {
      setBadgesList(prev => prev.map(b => b.id === editedBadgeForm.id ? (editedBadgeForm as BadgeAsset) : b));
    }
    addAuditLog(isNewBadge ? "CREATE" : "UPDATE", "BADGE", editedBadgeForm.id!, `Insignia "${editedBadgeForm.name}".`);
    setSelectedBadge(null);
    setIsAlertToShow({ show: true, status: 'success', message: 'Insignia guardada con éxito.' });
  };

  // AUDITORÍA DE HANGAR DE JUGADOR
  const [auditedUser, setAuditedUser] = useState<UserProfile | null>(() => users[0] || null);
  const [userHangarList, setUserHangarList] = useState<UserHangarShip[]>([]);

  return (
    <div className="space-y-6 font-mono text-xs text-left text-white select-none">
      
      {/* HEADER DE MÓDULO */}
      <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest font-mono block">
            NÚCLEO MAESTRO KERNEL DE ASSETS
          </span>
          <h2 className="text-xl font-bold font-display text-white tracking-tight flex items-center gap-2 mt-1">
            <Navigation className="text-red-500 animate-pulse rotate-45" size={18} />
            CONSOLA CENTRAL DE CATALOGACIÓN DE RECURSOS
          </h2>
          <p className="text-xs text-zinc-500 font-sans mt-0.5">
            Gestión integral de Naves, Estructuras, Tecnologías, Insignias e Inventarios en Supabase.
          </p>
        </div>

        {/* PESTAÑAS PRINCIPALES */}
        <div className="flex bg-black/60 border border-zinc-850 p-1 rounded font-mono text-[10.5px]">
          <button onClick={() => setActiveTab('atelier')} className={`px-3 py-1.5 font-bold uppercase transition-all rounded flex items-center gap-1.5 cursor-pointer ${activeTab === 'atelier' ? 'bg-red-650 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}>
            <Compass size={13} /> Taller Estelar (SEED CRUD)
          </button>
          <button onClick={() => setActiveTab('hangar')} className={`px-3 py-1.5 font-bold uppercase transition-all rounded flex items-center gap-1.5 cursor-pointer ${activeTab === 'hangar' ? 'bg-red-650 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}>
            <User size={13} /> Hangar (Auditoría Piloto)
          </button>
          <button onClick={() => setActiveTab('fabricacion')} className={`px-3 py-1.5 font-bold uppercase transition-all rounded flex items-center gap-1.5 cursor-pointer ${activeTab === 'fabricacion' ? 'bg-red-650 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}>
            <Settings size={13} /> Reglas de Fabricación
          </button>
          <button onClick={() => setActiveTab('bitacora')} className={`px-3 py-1.5 font-bold uppercase transition-all rounded flex items-center gap-1.5 cursor-pointer ${activeTab === 'bitacora' ? 'bg-red-650 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}>
            <Clock size={16} /> Bitácora
          </button>
          <button onClick={() => setActiveTab('sandbox')} className={`px-3 py-1.5 font-bold uppercase transition-all rounded flex items-center gap-1.5 cursor-pointer ${activeTab === 'sandbox' ? 'bg-emerald-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}>
            <Shield size={13} /> Combat Sandbox
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        
        {/* SUBPESTAÑA 1: TALLER ESTELAR (CON SUB-NAVEGACIÓN DE 4 CATEGORÍAS) */}
        {activeTab === 'atelier' && (
          <motion.div key="atelier_section" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            
            {/* SUB-PESTAÑAS DE CATEGORÍAS */}
            <div className="flex gap-2 bg-zinc-950 p-2 rounded-lg border border-zinc-900 select-none">
              <button onClick={() => setActiveAssetSubTab('ships')} className={`px-3 py-1.5 font-bold uppercase text-[10px] rounded cursor-pointer ${activeAssetSubTab === 'ships' ? 'bg-red-650 text-white' : 'text-zinc-400 hover:text-white'}`}>
                🚀 Naves ({shipsList.length})
              </button>
              <button onClick={() => setActiveAssetSubTab('structures')} className={`px-3 py-1.5 font-bold uppercase text-[10px] rounded cursor-pointer ${activeAssetSubTab === 'structures' ? 'bg-amber-600 text-white' : 'text-zinc-400 hover:text-white'}`}>
                🏢 Estructuras ({structuresList.length})
              </button>
              <button onClick={() => setActiveAssetSubTab('technologies')} className={`px-3 py-1.5 font-bold uppercase text-[10px] rounded cursor-pointer ${activeAssetSubTab === 'technologies' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'}`}>
                🔬 Tecnologías ({technologiesList.length})
              </button>
              <button onClick={() => setActiveAssetSubTab('badges')} className={`px-3 py-1.5 font-bold uppercase text-[10px] rounded cursor-pointer ${activeAssetSubTab === 'badges' ? 'bg-cyan-600 text-white' : 'text-zinc-400 hover:text-white'}`}>
                🏅 Insignias ({badgesList.length})
              </button>
            </div>

            {/* VISTA 1: NAVES */}
            {activeAssetSubTab === 'ships' && (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 space-y-4 p-4 bg-zinc-950 border border-zinc-900 rounded-lg">
                  <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
                    <span className="font-bold text-zinc-400 uppercase">Catálogo de Naves Semilla</span>
                    <button onClick={handleOpenBlankTaller} className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] uppercase rounded cursor-pointer"><Plus size={12} /> Nueva Nave</button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {paginatedShips.map(ship => (
                      <div key={ship.ship_id} className="p-3 bg-black/60 border border-zinc-900 rounded-lg flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <img src={ship.avatar_url} alt={ship.ship_name} className="w-12 h-12 rounded object-cover border border-zinc-800" />
                          <div>
                            <span className="font-bold text-white block truncate max-w-[150px]">{ship.ship_name}</span>
                            <span className="text-[9px] text-zinc-500 font-mono">{ship.rarity} • Lvl {ship.can_level_required}</span>
                          </div>
                        </div>
                        <button onClick={() => handleOpenShipTaller(ship)} className="text-[9px] text-red-400 hover:text-red-300 font-bold uppercase cursor-pointer">Editar</button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* FORMULARIO EDITOR DE NAVES */}
                <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-lg space-y-3">
                  <span className="font-bold text-cyan-400 uppercase block border-b border-zinc-900 pb-2">Editor de Naves</span>
                  {(selectedShip || isNewShip) ? (
                    <div className="space-y-3 text-[11px]">
                      <div><label className="text-zinc-500 block">Nombre Nave:</label><input type="text" value={editedShipForm.ship_name || ''} onChange={e => setEditedShipForm({ ...editedShipForm, ship_name: e.target.value })} className="w-full bg-black border border-zinc-800 p-1.5 rounded text-white uppercase" /></div>
                      <div className="grid grid-cols-2 gap-2">
                        <div><label className="text-zinc-500 block">HP Base:</label><input type="number" value={editedShipForm.resistance || 1000} onChange={e => setEditedShipForm({ ...editedShipForm, resistance: Number(e.target.value) })} className="w-full bg-black border border-zinc-800 p-1.5 rounded text-white" /></div>
                        <div><label className="text-zinc-500 block">Escudo:</label><input type="number" value={editedShipForm.shield || 500} onChange={e => setEditedShipForm({ ...editedShipForm, shield: Number(e.target.value) })} className="w-full bg-black border border-zinc-800 p-1.5 rounded text-cyan-400 font-bold" /></div>
                      </div>
                      <button onClick={handleSaveShipKernel} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2 rounded uppercase cursor-pointer">Guardar Nave en Supabase</button>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-zinc-600 italic">Selecciona una nave para editar o crea una nueva.</div>
                  )}
                </div>
              </div>
            )}

            {/* VISTA 2: ESTRUCTURAS */}
            {activeAssetSubTab === 'structures' && (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 space-y-4 p-4 bg-zinc-950 border border-zinc-900 rounded-lg">
                  <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
                    <span className="font-bold text-amber-400 uppercase">Catálogo de Estructuras Semilla</span>
                    <button onClick={handleOpenBlankStructure} className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-[10px] uppercase rounded cursor-pointer"><Plus size={12} /> Nueva Estructura</button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {structuresList.map(struct => (
                      <div key={struct.id} className="p-3 bg-black/60 border border-zinc-900 rounded-lg flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <img src={struct.avatar_url} alt={struct.name} className="w-12 h-12 rounded object-cover border border-zinc-800" />
                          <div>
                            <span className="font-bold text-white block truncate max-w-[150px]">{struct.name}</span>
                            <span className="text-[9px] text-amber-400 font-mono">{struct.type} • Rate: {struct.production_rate}</span>
                          </div>
                        </div>
                        <button onClick={() => { setSelectedStructure(struct); setIsNewStructure(false); setEditedStructureForm({ ...struct }); }} className="text-[9px] text-amber-400 hover:text-amber-300 font-bold uppercase cursor-pointer">Editar</button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-lg space-y-3">
                  <span className="font-bold text-amber-400 uppercase block border-b border-zinc-900 pb-2">Editor de Estructuras</span>
                  {(selectedStructure || isNewStructure) ? (
                    <div className="space-y-3 text-[11px]">
                      <div><label className="text-zinc-500 block">Nombre Estructura:</label><input type="text" value={editedStructureForm.name || ''} onChange={e => setEditedStructureForm({ ...editedStructureForm, name: e.target.value })} className="w-full bg-black border border-zinc-800 p-1.5 rounded text-white" /></div>
                      <div><label className="text-zinc-500 block">Ratio Producción Base:</label><input type="number" value={editedStructureForm.production_rate || 0} onChange={e => setEditedStructureForm({ ...editedStructureForm, production_rate: Number(e.target.value) })} className="w-full bg-black border border-zinc-800 p-1.5 rounded text-amber-400 font-bold" /></div>
                      <button onClick={handleSaveStructure} className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 rounded uppercase cursor-pointer">Guardar Estructura</button>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-zinc-600 italic">Selecciona una estructura para editar.</div>
                  )}
                </div>
              </div>
            )}

            {/* VISTA 3: TECNOLOGÍAS */}
            {activeAssetSubTab === 'technologies' && (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 space-y-4 p-4 bg-zinc-950 border border-zinc-900 rounded-lg">
                  <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
                    <span className="font-bold text-purple-400 uppercase">Catálogo de Tecnologías Semilla</span>
                    <button onClick={handleOpenBlankTechnology} className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] uppercase rounded cursor-pointer"><Plus size={12} /> Nueva Tecnología</button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {technologiesList.map(tech => (
                      <div key={tech.id} className="p-3 bg-black/60 border border-zinc-900 rounded-lg flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <img src={tech.avatar_url} alt={tech.name} className="w-12 h-12 rounded object-cover border border-zinc-800" />
                          <div>
                            <span className="font-bold text-white block truncate max-w-[150px]">{tech.name}</span>
                            <span className="text-[9px] text-purple-400 font-mono">{tech.type} • Bono: +{tech.effectiveness}%</span>
                          </div>
                        </div>
                        <button onClick={() => { setSelectedTechnology(tech); setIsNewTechnology(false); setEditedTechnologyForm({ ...tech }); }} className="text-[9px] text-purple-400 hover:text-purple-300 font-bold uppercase cursor-pointer">Editar</button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-lg space-y-3">
                  <span className="font-bold text-purple-400 uppercase block border-b border-zinc-900 pb-2">Editor de Tecnologías</span>
                  {(selectedTechnology || isNewTechnology) ? (
                    <div className="space-y-3 text-[11px]">
                      <div><label className="text-zinc-500 block">Nombre Tecnología:</label><input type="text" value={editedTechnologyForm.name || ''} onChange={e => setEditedTechnologyForm({ ...editedTechnologyForm, name: e.target.value })} className="w-full bg-black border border-zinc-800 p-1.5 rounded text-white" /></div>
                      <div><label className="text-zinc-500 block">Efectividad Bono %:</label><input type="number" value={editedTechnologyForm.effectiveness || 0} onChange={e => setEditedTechnologyForm({ ...editedTechnologyForm, effectiveness: Number(e.target.value) })} className="w-full bg-black border border-zinc-800 p-1.5 rounded text-purple-400 font-bold" /></div>
                      <button onClick={handleSaveTechnology} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded uppercase cursor-pointer">Guardar Tecnología</button>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-zinc-600 italic">Selecciona una tecnología para editar.</div>
                  )}
                </div>
              </div>
            )}

            {/* VISTA 4: INSIGNIAS */}
            {activeAssetSubTab === 'badges' && (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 space-y-4 p-4 bg-zinc-950 border border-zinc-900 rounded-lg">
                  <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
                    <span className="font-bold text-cyan-400 uppercase">Catálogo de Insignias Semilla</span>
                    <button onClick={handleOpenBlankBadge} className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[10px] uppercase rounded cursor-pointer"><Plus size={12} /> Nueva Insignia</button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {badgesList.map(badge => (
                      <div key={badge.id} className="p-3 bg-black/60 border border-zinc-900 rounded-lg flex justify-between items-center">
                        <div>
                          <span className="font-bold text-cyan-300 block truncate max-w-[180px]">{badge.name}</span>
                          <span className="text-[9px] text-zinc-500 font-mono">{badge.collection} • {badge.duration}</span>
                        </div>
                        <button onClick={() => { setSelectedBadge(badge); setIsNewBadge(false); setEditedBadgeForm({ ...badge }); }} className="text-[9px] text-cyan-400 hover:text-cyan-300 font-bold uppercase cursor-pointer">Editar</button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-lg space-y-3">
                  <span className="font-bold text-cyan-400 uppercase block border-b border-zinc-900 pb-2">Editor de Insignias</span>
                  {(selectedBadge || isNewBadge) ? (
                    <div className="space-y-3 text-[11px]">
                      <div><label className="text-zinc-500 block">Nombre Insignia:</label><input type="text" value={editedBadgeForm.name || ''} onChange={e => setEditedBadgeForm({ ...editedBadgeForm, name: e.target.value })} className="w-full bg-black border border-zinc-800 p-1.5 rounded text-white" /></div>
                      <div><label className="text-zinc-500 block">Efecto Técnico:</label><input type="text" value={editedBadgeForm.effect || ''} onChange={e => setEditedBadgeForm({ ...editedBadgeForm, effect: e.target.value })} className="w-full bg-black border border-zinc-800 p-1.5 rounded text-cyan-300 font-mono" /></div>
                      <button onClick={handleSaveBadge} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 rounded uppercase cursor-pointer">Guardar Insignia</button>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-zinc-600 italic">Selecciona una insignia para editar.</div>
                  )}
                </div>
              </div>
            )}

          </motion.div>
        )}

        {/* SUBPESTAÑA 2: HANGAR AUDITORÍA */}
        {activeTab === 'hangar' && (
          <motion.div key="hangar_section" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-lg space-y-3">
              <span className="text-[10px] font-bold text-zinc-400 uppercase">👥 AUDITORÍA DE HANGAR DE COMANDANTE</span>
              <div className="p-3 bg-black/40 border border-zinc-900 rounded flex justify-between items-center text-xs">
                <span>Comandante Auditado: <strong className="text-white">{auditedUser?.username || 'Sin seleccionar'}</strong></span>
                <span className="text-emerald-400 font-bold">Nivel C.A.N: {auditedUser?.level || 1}</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* SUBPESTAÑA 3: REGLAS DE FABRICACIÓN */}
        {activeTab === 'fabricacion' && (
          <motion.div key="fabricacion_section" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4 bg-zinc-950 border border-zinc-900 rounded-lg space-y-4 font-mono">
            <span className="text-[10px] font-bold text-zinc-400 uppercase block border-b border-zinc-900 pb-2">⚙️ MULTIPLICADORES DE MATERIALES EN FÁBRICA</span>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-zinc-400 block mb-1">Multiplicador Metal: <strong className="text-red-500">{globalMetalMultiplier.toFixed(2)}x</strong></label>
                <input type="range" min="0.5" max="5" step="0.05" value={globalMetalMultiplier} onChange={e => setGlobalMetalMultiplier(parseFloat(e.target.value) || 1.0)} className="w-full accent-red-600" />
              </div>
              <div>
                <label className="text-zinc-400 block mb-1">Multiplicador Cristal: <strong className="text-cyan-400">{globalCrystalMultiplier.toFixed(2)}x</strong></label>
                <input type="range" min="0.5" max="5" step="0.05" value={globalCrystalMultiplier} onChange={e => setGlobalCrystalMultiplier(parseFloat(e.target.value) || 1.0)} className="w-full accent-cyan-500" />
              </div>
            </div>
          </motion.div>
        )}

        {/* SUBPESTAÑA 4: BITÁCORA */}
        {activeTab === 'bitacora' && (
          <motion.div key="bitacora_section" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4 bg-zinc-950 border border-zinc-900 rounded-lg space-y-3 font-mono">
            <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
              <span className="font-bold text-white uppercase">Bitácora de Auditoría</span>
              <button onClick={downloadAuditLogsCSV} className="px-3 py-1 bg-red-600 text-white font-bold text-[10px] uppercase rounded cursor-pointer"><Download size={11} /> CSV</button>
            </div>
            <div className="bg-black p-3 rounded h-96 overflow-y-auto space-y-2">
              {auditLogs.map(log => (
                <div key={log.id} className="p-2 bg-zinc-950 border border-zinc-900 text-[10px] rounded flex justify-between">
                  <div>
                    <span className="text-red-400 font-bold uppercase">{log.action}</span> • <span className="text-white">{log.entity_type}</span>: {log.details}
                  </div>
                  <span className="text-zinc-600">{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* SUBPESTAÑA 5: COMBAT SANDBOX */}
        {activeTab === 'sandbox' && (
          <motion.div key="sandbox_section" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <CombatSandboxTester />
          </motion.div>
        )}

      </AnimatePresence>

      {/* CONFIRMACIÓN DE BORRADO DE NAVE */}
      <AnimatePresence>
        {isDeleteConfirmOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-lg max-w-md w-full space-y-4">
              <div className="flex items-center gap-3 text-red-500">
                <AlertTriangle size={24} className="animate-bounce" />
                <h3 className="text-base font-bold uppercase">Confirmar Borrado de Nave</h3>
              </div>
              <p className="text-xs text-zinc-400">Esta acción eliminará el plano de la nave en la base de datos maestra de Supabase.</p>
              <div className="flex justify-end gap-3 text-[10px]">
                <button onClick={() => setIsDeleteConfirmOpen(false)} className="px-4 py-2 bg-zinc-900 text-zinc-400 rounded cursor-pointer">ABORTAR</button>
                <button onClick={handleConfirmDeleteShip} className="px-4 py-2 bg-red-600 text-white font-bold rounded cursor-pointer">BORRAR NAVE</button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}