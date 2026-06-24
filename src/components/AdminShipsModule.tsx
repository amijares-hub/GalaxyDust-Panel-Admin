import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Edit, Trash2, Search, Sliders, Shield, Zap, RefreshCw, 
  Settings, Save, Copy, Power, AlertTriangle, User, Compass, HelpCircle, HardDrive,
  TrendingUp, Star, Filter, Heart, ChevronLeft, ChevronRight, X, Clock, Navigation,
  Download
} from 'lucide-react';
import { UserProfile } from '../types';
import { supabase } from '../lib/supabase';
import { 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import CombatSandboxTester, { CombatSandboxOverlay } from './CombatSandboxTester';

interface ShipSeed {
  ship_id: string; // ID único de la nave (base)
  ship_name: string;
  description: string;
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Phantom' | 'Xmas';
  avatar_url: string;
  can_level_required: number;
  blueprints_required: number;
  resistance: number; // HP base
  shield: number; // Shield base
  defense: number; // Defense base
  speed_boost: number; // Travel Speed
  combat_speed: number; // Combat Speed
  engine: 'Combustión' | 'Impulso' | 'Hiperespacio' | 'Phantom' | 'Exclusive' | 'Xmas';
  damage_type: 'Kinetic' | 'Laser' | 'Plasma' | 'Ionic' | 'Graviton';
  
  // NEW SYSTEM FIELDS FOR SASORILABS
  collection: string; // Colección
  ship_role: 'Attack' | 'Hybrid' | 'Transport' | 'Explorer' | 'Miner' | 'Defense' | 'Spy' | 'Racing' | 'Carrier' | string; // Tipo de Nave / Rol
  ship_size: 'Fighter' | 'Mighty' | 'Massive' | 'Commander' | 'Mini'; // Tamaño
  attack_standard: number; // Ataque Estándar
  attack_ionic: number; // Ataque Iónico
  attack_plasma: number; // Ataque de Plasma
  attack_laser: number; // Ataque Láser
  attack_graviton: number; // Ataque Gravitón
  cargo_capacity: number; // Capacidad de Carga (Cargo)
  production_min: number; // Producción Mínima
  production_max: number; // Producción Máxima
  series: string; // Serie
  skills: string[]; // Skill set
  skill_requirements: string; // Skill set requirements

  // BLOCKCHAIN AND INDIVIDUAL OVERRIDES
  blockchain_asset_id?: string; // ID del Asset individual en la blockchain
  user_asset_id?: string; // ID de el Asset en posesión del usuario
  required_metal?: number; // Metal requerido individualizado
  required_crystal?: number; // Cristal requerido individualizado
}

interface StructureAsset {
  id: string;
  name: string;
  avatar_url: string;
  description: string;
  company: string; // Hassac, Dramco, Monsur
  collection: string;
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Exclusive';
  type: 'Producción' | 'Instalaciones/Facilities' | 'Híbridas' | 'Misceláneas';
  production_rate: number;
  capacity: number;
  efficiency: number;
  durability: number; // Hit points/mantenimiento
  power_score: number;
  skills: string[]; // up to 10 strings representing skills/bonuses per level
  costs: {
    metal: number;
    crystal: number;
    deuterium: number;
    wood: number;
    dark_matter: number;
    gd_coins: number;
    phantom_coins: number;
    research_time: string;
    req_technologies: string[];
    req_structures: string[];
  }[]; // index 0-9 represents levels 1-10 costs
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
  effectiveness: number; // fuerza del bono %
  scope: string; // "Nave específica" o "Toda la flota"
  resource_efficiency: number;
  power_score: number;
  skills: string[]; // level 1 to 10 bonuses
  costs: {
    metal: number;
    crystal: number;
    deuterium: number;
    wood: number;
    dark_matter: number;
    gd_coins: number;
    phantom_coins: number;
    research_time: string;
    req_technologies: string[];
    req_structures: string[];
  }[]; // index 0-9 for level 1-10
}

interface BadgeAsset {
  id: string;
  name: string;
  description: string;
  collection: string; // Nova, Xmas, Eventos, Halloween, etc.
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Exclusive';
  type: 'Producción' | 'Guerra/War' | 'Expedición' | 'Flota/Fleet' | 'Híbrido';
  effect: string; // descripción técnica
  stack: 'No Stackeable' | 'Stackeable' | 'Stack x2' | 'Stack x5';
  duration: 'Permanent' | '1 Semana' | '1 Mes' | '3 Meses' | '1 Año';
  badge_slot: string; // p. ej. "Consume 1 espacio" o "Añade +2 espacios (Badge Inventory +2)"
  power_score: number; // PS
}

const INITIAL_SEED_STRUCTURES: StructureAsset[] = [
  {
    id: "str_01",
    name: "Mina de Orichaltron Hassac-X",
    avatar_url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=200&auto=format&fit=crop",
    description: "Unidad minera pesada automatizada diseñada por Hassac para fracturar los filones polimétlicos profundos de dunas silíceas.",
    company: "Hassac",
    collection: "Sasori Core",
    rarity: "Epic",
    type: "Producción",
    production_rate: 1850,
    capacity: 250000,
    efficiency: 94,
    durability: 8500,
    power_score: 1200,
    skills: [
      "Extracción Alfa: +10% metal base",
      "Compresión de Sólidos: +15% producción diaria",
      "Ventilación Sónica: reduce mantenimiento en 5%",
      "Criba Automática: +5% de metal puro obtenido",
      "Escaner Geofísico: duplica velocidad de prospección",
      "Excavador Láser: +20% producción diaria de cristal",
      "Resiliencia Térmica: inmune a erupciones solares",
      "Silo Presurizado: +10% de límite para almacenamiento",
      "Bucle Magnético: reduce consumo de energía en 15%",
      "Eficacia Suprema: +40% de producción total global"
    ],
    costs: Array.from({ length: 10 }, (_, i) => ({
      metal: (i + 1) * 8000,
      crystal: (i + 1) * 5000,
      deuterium: (i + 1) * 2000,
      wood: (i + 1) * 3500,
      dark_matter: (i + 1) * 150,
      gd_coins: (i + 1) * 1000,
      phantom_coins: (i + 1) * 50,
      research_time: `${i + 1}h`,
      req_technologies: ["Extracción Geológica Nivel " + Math.max(1, i)],
      req_structures: ["Estación Energética Nivel " + Math.max(1, i)]
    }))
  },
  {
    id: "str_02",
    name: "Laboratorio Cuántico Dramco",
    avatar_url: "https://images.unsplash.com/photo-1507668077129-56e32842fceb?q=80&w=200&auto=format&fit=crop",
    description: "Complejo de investigación avanzada de Dramco centrado en simular interacciones de deuterio inestable e hiperespacios redundantes.",
    company: "Dramco",
    collection: "Nova Division",
    rarity: "Legendary",
    type: "Instalaciones/Facilities",
    production_rate: 0,
    capacity: 0,
    efficiency: 98,
    durability: 12000,
    power_score: 2500,
    skills: [
      "Investigación Base: Reduce tiempo en 10%",
      "Simulación de Partículas: +10% efectividad militar",
      "Fecundación de Teorías: Desbloquea nanotecnologías",
      "Enlace P2P Cuántico: Comparte logs con toda la alianza",
      "I+D Sin Pérdida: reembolsa 5% de recursos al fallar",
      "Estabilidad Singular: reduce costo de deuterio en 15%",
      "Analista Artificial: autocompleta microinvestigaciones",
      "Escudo Antiproyectiles: protege dependencias en un 30%",
      "Hiperfocalización: racha investigativa acelerada (2x)",
      "Sabiduría Absoluta: reduce todos los tiempos de investigación en 50%"
    ],
    costs: Array.from({ length: 10 }, (_, i) => ({
      metal: (i + 1) * 15000,
      crystal: (i + 1) * 20000,
      deuterium: (i + 1) * 12000,
      wood: (i + 1) * 1000,
      dark_matter: (i + 1) * 600,
      gd_coins: (i + 1) * 2500,
      phantom_coins: (i + 1) * 250,
      research_time: `${(i + 1) * 3}h`,
      req_technologies: ["Computación Avanzada Nivel " + Math.max(1, i)],
      req_structures: ["Centro de Mando Nivel " + Math.max(1, i)]
    }))
  }
];

const INITIAL_SEED_TECHNOLOGIES: TechnologyAsset[] = [
  {
    id: "tech_01",
    name: "Propulsor de Hiperespacio Cuático",
    avatar_url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=200&auto=format&fit=crop",
    description: "Fórmula de empuje sub-molecular que minimiza la distorsión del campo magnético galáctico facilitando atajos espaciales.",
    company: "Monsur",
    collection: "Sasori Core",
    rarity: "Legendary",
    type: "Transporte",
    effectiveness: 15,
    scope: "Toda la flota",
    resource_efficiency: 92,
    power_score: 1800,
    skills: [
      "Velocidad Warp I: +15% de Travel Speed en toda la flota.",
      "Velocidad Warp II: +30% de Travel Speed e inmunidad a ráfagas.",
      "Consumo Integrado: -5% costo de deuterio en viajes.",
      "Ruta Eficiente: reduce tiempos de viaje interplanetarios en 10%",
      "Desvío de Agujero: 5% probabilidad de viaje instantáneo.",
      "Salto de Flota: permite acoplar +1 nave pesada de carga.",
      "Anulador de Roce: +40% efectividad de combustible.",
      "Estabilizador de Casco: disipa microbaches gravitatorios.",
      "Atracción Singular: dobla velocidad en expediciones lejanas.",
      "Omnipresencia: reduce a la mitad cualquier tiempo de transito estelar."
    ],
    costs: Array.from({ length: 10 }, (_, i) => ({
      metal: (i + 1) * 10000,
      crystal: (i + 1) * 12000,
      deuterium: (i + 1) * 9000,
      wood: (i + 1) * 1000,
      dark_matter: (i + 1) * 400,
      gd_coins: (i + 1) * 1500,
      phantom_coins: (i + 1) * 100,
      research_time: `${(i + 1) * 2}h`,
      req_technologies: ["Física Gravitacional Nivel " + Math.max(1, i)],
      req_structures: ["Laboratorio Cuántico Nivel " + Math.max(1, i)]
    }))
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
    effect: "+8% de escudo a toda la armada, +12% de ataque iónico en fragatas y +1 espacio máximo de combate.",
    stack: "No Stackeable",
    duration: "Permanent",
    badge_slot: "Consume 1 ranura en C.A.N.",
    power_score: 1500
  },
  {
    id: "badge_02",
    name: "Insignia del Copo de Navidad",
    description: "Insignia helada del evento navideño de Sasorilabs que otorga bendiciones de minería bajo cero.",
    collection: "Xmas Event 2026",
    rarity: "Rare",
    type: "Producción",
    effect: "Otorga +15% de producción diaria de metal y cristal planetario.",
    stack: "Stack x2",
    duration: "3 Meses",
    badge_slot: "Consume 1 ranura, añade +1 espacio de inventario estático",
    power_score: 650
  }
];

interface UserHangarShip {
  userShipId: string;
  shipId: string;
  name: string;
  stars: number; // 1 to 7
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

// Generamos una colección inicial majestuosa de naves seed galácticas (nuestra simulación del kernel de Supabase seed_ships)
const INITIAL_SEED_SHIPS: ShipSeed[] = [
  {
    ship_id: "8c772e0a-0da0-457c-9b62-11ecdf2d8a01",
    ship_name: "Sasori Apex Devastator Mk1",
    description: "Nave capitana del comando de élite de Sasorilabs. Sus núcleos de fusión cuántica superan el umbral térmico de las envolturas convencionales, canalizando ráfagas plasma destructoras.",
    rarity: "Legendary",
    avatar_url: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=200&auto=format&fit=crop",
    can_level_required: 45,
    blueprints_required: 150,
    resistance: 12500,
    shield: 8500,
    defense: 350,
    speed_boost: 950,
    combat_speed: 350,
    engine: "Hiperespacio",
    damage_type: "Plasma",
    collection: "Sartorius Elite",
    ship_role: "Attack",
    ship_size: "Commander",
    attack_standard: 4500,
    attack_ionic: 1800,
    attack_plasma: 5500,
    attack_laser: 2000,
    attack_graviton: 1200,
    cargo_capacity: 45000,
    production_min: 150,
    production_max: 680,
    series: "APEX-XII-S",
    skills: ["Ráfaga de Fusión Supernova", "Escudo Deflector Absoluto"],
    skill_requirements: "Requiere Computador Cuántico de Can-45 y Núcleo de Hiperespacio",
    blockchain_asset_id: "0xSasoriApex#883",
    user_asset_id: "user_item_883"
  },
  {
    ship_id: "16af93cd-6750-4df7-809c-efb9195d8202",
    ship_name: "Imperator Sovereign Prime",
    description: "Construida bajo la heráldica militar del Núcleo Alfa. El blindaje exterior está forjado con capas termoacopladas de Orichaltron puro capaces de disipar flujos gravitorios intensos.",
    rarity: "Legendary",
    avatar_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=200&auto=format&fit=crop",
    can_level_required: 30,
    blueprints_required: 100,
    resistance: 9800,
    shield: 6000,
    defense: 280,
    speed_boost: 720,
    combat_speed: 240,
    engine: "Impulso",
    damage_type: "Graviton",
    collection: "Alpha Fleet Onyx",
    ship_role: "Attack",
    ship_size: "Massive",
    attack_standard: 3800,
    attack_ionic: 900,
    attack_plasma: 1500,
    attack_laser: 3200,
    attack_graviton: 4500,
    cargo_capacity: 28000,
    production_min: 110,
    production_max: 500,
    series: "IMP-SOV-09",
    skills: ["Pulso Gravitatorio Inverso", "Blindaje Orichaltron Activo"],
    skill_requirements: "Requiere Nivel 30 CAN y Licencia de Capitán Imperial",
    blockchain_asset_id: "0xSovereign#12",
    user_asset_id: "user_item_12"
  },
  {
    ship_id: "77d24ab9-9941-477d-8de5-7ee5bb5f2103",
    ship_name: "Phantasm Void Stalker Mk5",
    description: "Prototipo sigiloso de la serie Phantom. Sus aspas deflectores emiten microfrecuencias electromagnéticas que le permiten desmaterializarse en el espacio profundo de las dunas.",
    rarity: "Phantom",
    avatar_url: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=200&auto=format&fit=crop",
    can_level_required: 50,
    blueprints_required: 200,
    resistance: 6500,
    shield: 14000,
    defense: 120,
    speed_boost: 1200,
    combat_speed: 400,
    engine: "Phantom",
    damage_type: "Ionic",
    collection: "Shadow Division",
    ship_role: "Spy",
    ship_size: "Mighty",
    attack_standard: 2500,
    attack_ionic: 6000,
    attack_plasma: 800,
    attack_laser: 1500,
    attack_graviton: 3000,
    cargo_capacity: 12000,
    production_min: 80,
    production_max: 350,
    series: "V-STK-PH",
    skills: ["Ocultación Cuántica Espectral", "Drenaje de Escudo Electrónico"],
    skill_requirements: "Requiere Propulsor Phantom de Nivel 50 y Módulo de Camuflaje Optoelectrónico",
    blockchain_asset_id: "0xPhantasm#88",
    user_asset_id: "user_item_88"
  },
  {
    ship_id: "b45a9992-d901-4475-b82d-ccd0cb0b8204",
    ship_name: "Glacier Nebula Comet Xmas",
    description: "Nave especial conmemorativa construida con condensadores criogénicos que liberan una estela cristalina de hidrógeno polarizado al activar el embudo de hiperespacio.",
    rarity: "Xmas",
    avatar_url: "https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?q=80&w=200&auto=format&fit=crop",
    can_level_required: 15,
    blueprints_required: 40,
    resistance: 4500,
    shield: 3500,
    defense: 180,
    speed_boost: 650,
    combat_speed: 200,
    engine: "Xmas",
    damage_type: "Laser",
    collection: "Holiday Event 2026",
    ship_role: "Transport",
    ship_size: "Mighty",
    attack_standard: 1200,
    attack_ionic: 500,
    attack_plasma: 100,
    attack_laser: 2500,
    attack_graviton: 200,
    cargo_capacity: 18000,
    production_min: 40,
    production_max: 180,
    series: "GLC-XM-26",
    skills: ["Ventisca Criogénica Estelar", "Regalo del Vacío (Bonus Drop)"],
    skill_requirements: "Evento de Navidad Sasorilabs",
    blockchain_asset_id: "0xGlacier#25",
    user_asset_id: "user_item_25"
  },
  {
    ship_id: "c45f91ae-ab32-45e3-9cf9-7f394c8bfa05",
    ship_name: "Excalibur Interceptor Mk4",
    description: "Diseño aerodinámico optimizado para combates de baja altura atmosférica. Sus cañones láser de focalización instantánea garantizan el desmantelamiento de interceptores rebeldes ligeros.",
    rarity: "Epic",
    avatar_url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=200&auto=format&fit=crop",
    can_level_required: 25,
    blueprints_required: 80,
    resistance: 7200,
    shield: 4500,
    defense: 220,
    speed_boost: 820,
    combat_speed: 420,
    engine: "Combustión",
    damage_type: "Laser",
    collection: "Stellar Royal Guard",
    ship_role: "Attack",
    ship_size: "Fighter",
    attack_standard: 2800,
    attack_ionic: 1200,
    attack_plasma: 500,
    attack_laser: 4000,
    attack_graviton: 100,
    cargo_capacity: 6500,
    production_min: 50,
    production_max: 220,
    series: "EXC-INT",
    skills: ["Fijación de Blancos Hipersónica", "Sobrecarga de Sistema de Láseres"],
    skill_requirements: "Sistema de Armas Nivel 4 y Motor de Combustión Excalibur",
    blockchain_asset_id: "0xExcalibur#50",
    user_asset_id: "user_item_52"
  },
  {
    ship_id: "da67bc1e-ff88-467d-99f2-2bcca63bfa06",
    ship_name: "Anubis Heavy Dreadnought",
    description: "Plataforma bélica móvil armada con baterías cinéticas pesadas de riel electromagnético. Su peso reduce la velocidad de impulso orbital pero posee la mayor regeneración de integridad estructural.",
    rarity: "Epic",
    avatar_url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=200&auto=format&fit=crop",
    can_level_required: 35,
    blueprints_required: 120,
    resistance: 15000,
    shield: 5000,
    defense: 450,
    speed_boost: 400,
    combat_speed: 150,
    engine: "Impulso",
    damage_type: "Kinetic",
    collection: "Necro-Pharaoh Fleet",
    ship_role: "Defense",
    ship_size: "Massive",
    attack_standard: 4800,
    attack_ionic: 800,
    attack_plasma: 2200,
    attack_laser: 1000,
    attack_graviton: 1800,
    cargo_capacity: 35000,
    production_min: 120,
    production_max: 480,
    series: "ANB-DREAD-8",
    skills: ["Fuego de Riel Destructor", "Protocolo de Auto-Reparación de Nano-Células"],
    skill_requirements: "Requiere Blindaje Tipo IV y Controladores de Impulso de Fisión",
    blockchain_asset_id: "0xAnubis#11",
    user_asset_id: "user_item_11"
  },
  {
    ship_id: "f3408bcf-61f2-4bd5-aed1-4dcb9167fa07",
    ship_name: "Helix Mining Harvester",
    description: "Buque extractor robusto programado para la fractura mecánica de asteroides en órbita. Equipado con un núcleo recolector omniplate y bahías de carga presurizadas térmicamente.",
    rarity: "Rare",
    avatar_url: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=200&auto=format&fit=crop",
    can_level_required: 10,
    blueprints_required: 30,
    resistance: 5500,
    shield: 2500,
    defense: 160,
    speed_boost: 480,
    combat_speed: 120,
    engine: "Combustión",
    damage_type: "Kinetic",
    collection: "Industrial Outpost",
    ship_role: "Miner",
    ship_size: "Massive",
    attack_standard: 1500,
    attack_ionic: 1000,
    attack_plasma: 900,
    attack_laser: 850,
    attack_graviton: 300,
    cargo_capacity: 80000,
    production_min: 250,
    production_max: 1200,
    series: "HLX-MIN-02",
    skills: ["Láser de Perforación Sísmica", "Compactación Hidráulica de Cargo"],
    skill_requirements: "Requiere Nivel 10 CAN e Inhibidores de Presión Hidráulica",
    blockchain_asset_id: "0xHelix#02",
    user_asset_id: "user_item_02"
  },
  {
    ship_id: "cc407421-4bcf-46d8-9df2-2f349cd7ba08",
    ship_name: "Hermes Scout Messenger V3",
    description: "Sonda de alta velocidad ideal para Handshakes de reconocimiento espaciotemporal. El chasis ultraligero limita el armamento ofensivo pero maximiza el resguardo óptico de anomalías.",
    rarity: "Uncommon",
    avatar_url: "https://images.unsplash.com/photo-1461360370896-922624d12aa1?q=80&w=200&auto=format&fit=crop",
    can_level_required: 5,
    blueprints_required: 20,
    resistance: 3200,
    shield: 1800,
    defense: 80,
    speed_boost: 1100,
    combat_speed: 380,
    engine: "Impulso",
    damage_type: "Ionic",
    collection: "Ranger Corp",
    ship_role: "Explorer",
    ship_size: "Fighter",
    attack_standard: 800,
    attack_ionic: 2200,
    attack_plasma: 100,
    attack_laser: 1200,
    attack_graviton: 50,
    cargo_capacity: 4000,
    production_min: 30,
    production_max: 110,
    series: "HMS-SCT",
    skills: ["Escaner Críptico Espacial", "Bono de Impulsor de Supercarga"],
    skill_requirements: "Requiere Nivel 5 CAN y Antena de Banda Ultra Alta",
    blockchain_asset_id: "0xHermes#03",
    user_asset_id: "user_item_03"
  },
  {
    ship_id: "ee30114f-ca8a-442c-a2b1-12ec9f123a09",
    ship_name: "Centurion Frontier Vanguard",
    description: "Caza patrullero estandarizado asignado a la protección perimetral de colonias agrícolas Sasori. Barato de inyectar pero con una fiabilidad mecánica formidable contra xenoplasmas hostiles.",
    rarity: "Common",
    avatar_url: "https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?q=80&w=200&auto=format&fit=crop",
    can_level_required: 1,
    blueprints_required: 10,
    resistance: 2400,
    shield: 1000,
    defense: 60,
    speed_boost: 580,
    combat_speed: 210,
    engine: "Combustión",
    damage_type: "Laser",
    collection: "Federation Patrol",
    ship_role: "Defense",
    ship_size: "Fighter",
    attack_standard: 1000,
    attack_ionic: 100,
    attack_plasma: 50,
    attack_laser: 1800,
    attack_graviton: 0,
    cargo_capacity: 5000,
    production_min: 20,
    production_max: 75,
    series: "CNT-VAN-1",
    skills: ["Patrullaje Automatizado", "Reforzar Blindaje Estándar"],
    skill_requirements: "Ningún requisito comercial previo",
    blockchain_asset_id: "0xCenturion#01",
    user_asset_id: "user_item_01"
  }
];

export default function AdminShipsModule({ 
  users, 
  setIsAlertToShow,
  onRefreshData 
}: AdminShipsModuleProps) {

  // Active Main Tab State
  const [activeTab, setActiveTab] = useState<'atelier' | 'hangar' | 'fabricacion' | 'bitacora' | 'sandbox'>('atelier');

  // Bulk Selection State for Taller Estelar
  const [bulkSelectedShipIds, setBulkSelectedShipIds] = useState<string[]>([]);

  // Manufacturing Multipliers State
  const [globalMetalMultiplier, setGlobalMetalMultiplier] = useState<number>(1.2);
  const [globalCrystalMultiplier, setGlobalCrystalMultiplier] = useState<number>(1.15);

  // Construction Blueprint Simulator Slider
  const [simulatedBlueprintCount, setSimulatedBlueprintCount] = useState<number>(50);

  // ========================================================
  // SUBPESTAÑA 1: TALLER ESTELAR (SEED CRUD) STATE
  // ========================================================
  // 1. Inicializar el catálogo vacío o con un array de carga
  const [shipsList, setShipsList] = useState<ShipSeed[]>([]);
  const [loadingKernel, setLoadingKernel] = useState(true);

  // 2. Disparar el gancho de conexión en caliente al montar el módulo
  useEffect(() => {
    fetchRealShipsCatalog();
  }, []);

  const fetchRealShipsCatalog = async () => {
    try {
      setLoadingKernel(true);
      
      // Consultamos la tabla real que acabamos de poblar con el éxito del SQL
      const { data, error } = await supabase
        .from('seed_ships')
        .select('*')
        .order('ship_name', { ascending: true });

      if (error) throw error;

      if (data) {
        // Mapeamos los campos del backend hacia el tipado estricto que exige tu interfaz
        const formattedShips = data.map((dbShip: any) => ({
          ship_id: dbShip.ship_id,
          ship_name: dbShip.ship_name,
          description: dbShip.description,
          rarity: dbShip.rarity,
          avatar_url: dbShip.avatar_url || "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=200",
          can_level_required: dbShip.can_level_required || 1,
          blueprints_required: dbShip.blueprints_required || 10,
          resistance: Number(dbShip.resistance),
          shield: Number(dbShip.shield),
          defense: Number(dbShip.defense),
          speed_boost: dbShip.speed_boost,
          combat_speed: dbShip.combat_speed || 200,
          engine: dbShip.engine,
          damage_type: dbShip.damage_type,
          collection: dbShip.collection,
          ship_role: dbShip.ship_role,
          ship_size: dbShip.ship_size,
          attack_standard: Number(dbShip.attack_standard),
          attack_laser: Number(dbShip.attack_laser),
          attack_ionic: Number(dbShip.attack_ionic),
          attack_plasma: Number(dbShip.attack_plasma),
          attack_graviton: Number(dbShip.attack_graviton),
          cargo_capacity: Number(dbShip.cargo_capacity),
          production_min: Number(dbShip.production_min),
          production_max: Number(dbShip.production_max),
          skills: dbShip.skills || [],
          skill_requirements: dbShip.skill_requirements
        }));

        setShipsList(formattedShips);
      }
    } catch (err: any) {
      console.error("Fallo de enlace con seed_ships en la dApp:", err.message);
    } finally {
      setLoadingKernel(false);
    }
  };

  // Fleet Average Statistics for Radar Chart comparison
  const fleetAverages = useMemo(() => {
    if (shipsList.length === 0) return { hp: 5000, shield: 3000, defense: 150, travel_speed: 600, combat_speed: 200, attack: 2000 };
    const total = shipsList.reduce((acc, s) => {
      acc.hp += s.resistance || 0;
      acc.shield += s.shield || 0;
      acc.defense += s.defense || 0;
      acc.travel_speed += s.speed_boost || 0;
      acc.combat_speed += s.combat_speed || 200;
      acc.attack += s.attack_standard || 0;
      return acc;
    }, { hp: 0, shield: 0, defense: 0, travel_speed: 0, combat_speed: 0, attack: 0 });

    const len = shipsList.length;
    return {
      hp: Math.round(total.hp / len),
      shield: Math.round(total.shield / len),
      defense: Math.round(total.defense / len),
      travel_speed: Math.round(total.travel_speed / len),
      combat_speed: Math.round(total.combat_speed / len),
      attack: Math.round(total.attack / len)
    };
  }, [shipsList]);

  const [compareShipId, setCompareShipId] = useState<string>('fleet_average');

  // Derived comparison stats for side-by-side radar comparison
  const comparisonValues = useMemo(() => {
    const compShip = shipsList.find(s => s.ship_id === compareShipId);
    if (compShip) {
      return {
        name: compShip.ship_name,
        hp: compShip.resistance || 0,
        shield: compShip.shield || 0,
        defense: compShip.defense || 0,
        travel_speed: compShip.speed_boost || 0,
        combat_speed: compShip.combat_speed || 200,
        attack: compShip.attack_standard || 0,
      };
    }
    return {
      name: 'Promedio de Flota',
      hp: fleetAverages.hp,
      shield: fleetAverages.shield,
      defense: fleetAverages.defense,
      travel_speed: fleetAverages.travel_speed,
      combat_speed: fleetAverages.combat_speed,
      attack: fleetAverages.attack,
    };
  }, [shipsList, compareShipId, fleetAverages]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEngine, setFilterEngine] = useState<string>('all');
  const [filterRarity, setFilterRarity] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('none');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Selected Ship in Editor Drawer
  const [selectedShip, setSelectedShip] = useState<ShipSeed | null>(null);
  
  // Combat Sandbox Integration
  const [showSandboxModal, setShowSandboxModal] = useState(false);
  
  // Bulk state actions
  const [bulkRarity, setBulkRarity] = useState<string>('no_change');
  const [bulkEngine, setBulkEngine] = useState<string>('no_change');

  // AUTOMATED AUDIT LOG ENGINE (Captures modifications)
  const [auditLogs, setAuditLogs] = useState<any[]>(() => {
    const saved = localStorage.getItem('saso_audit_logs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      {
        id: "log-init-ship",
        timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
        action: "INITIALIZE",
        entity_type: "SHIP_DAPP",
        entity_id: "SYSTEM",
        details: "Servicio de bitácoras de cambios tácticos de Sasorilabs inicializado."
      }
    ];
  });

  const addAuditLog = (action: string, entity_type: string, entity_id: string, details: string) => {
    const entry = {
      id: 'log-' + Math.random().toString(36).substring(2, 11),
      timestamp: new Date().toISOString(),
      action,
      entity_type,
      entity_id,
      details
    };
    setAuditLogs(prev => {
      const updated = [entry, ...prev];
      localStorage.setItem('saso_audit_logs', JSON.stringify(updated));
      return updated;
    });
  };

  const downloadAuditLogsCSV = () => {
    // Generate CSV content with standard formatting
    const headers = ["ID", "Timestamp", "Action", "Entity Type", "Entity ID", "Details"];
    const rows = auditLogs.map(log => [
      log.id,
      log.timestamp,
      log.action,
      log.entity_type,
      log.entity_id,
      `"${(log.details || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `historial_modificaciones_naves_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setIsAlertToShow({
      show: true,
      status: 'success',
      message: '¡Historial de modificaciones de naves exportado correctamente como CSV!'
    });
  };

  // ========================================================
  // CORE NEW SUBTAB & SUBMODULE ASSETS STATES
  // ========================================================
  const [activeAssetSubTab, setActiveAssetSubTab] = useState<'ships' | 'structures' | 'technologies' | 'badges'>('ships');

  // STRUCTURES STATE
  const [structuresList, setStructuresList] = useState<StructureAsset[]>(INITIAL_SEED_STRUCTURES);
  const [structuresSearch, setStructuresSearch] = useState('');
  const [structuresFilterRarity, setStructuresFilterRarity] = useState<string>('all');
  const [structuresFilterType, setStructuresFilterType] = useState<string>('all');
  const [selectedStructure, setSelectedStructure] = useState<StructureAsset | null>(null);
  const [editedStructureForm, setEditedStructureForm] = useState<Partial<StructureAsset>>({});
  const [isNewStructure, setIsNewStructure] = useState(false);

  // TECHNOLOGIES STATE
  const [technologiesList, setTechnologiesList] = useState<TechnologyAsset[]>(INITIAL_SEED_TECHNOLOGIES);
  const [technologiesSearch, setTechnologiesSearch] = useState('');
  const [technologiesFilterRarity, setTechnologiesFilterRarity] = useState<string>('all');
  const [technologiesFilterType, setTechnologiesFilterType] = useState<string>('all');
  const [selectedTechnology, setSelectedTechnology] = useState<TechnologyAsset | null>(null);
  const [editedTechnologyForm, setEditedTechnologyForm] = useState<Partial<TechnologyAsset>>({});
  const [isNewTechnology, setIsNewTechnology] = useState(false);

  // BADGES STATE
  const [badgesList, setBadgesList] = useState<BadgeAsset[]>(INITIAL_SEED_BADGES);
  const [badgesSearch, setBadgesSearch] = useState('');
  const [badgesFilterRarity, setBadgesFilterRarity] = useState<string>('all');
  const [badgesFilterType, setBadgesFilterType] = useState<string>('all');
  const [selectedBadge, setSelectedBadge] = useState<BadgeAsset | null>(null);
  const [editedBadgeForm, setEditedBadgeForm] = useState<Partial<BadgeAsset>>({});
  const [isNewBadge, setIsNewBadge] = useState(false);

  const handleApplyBulkChanges = () => {
    if (bulkSelectedShipIds.length === 0) {
      setIsAlertToShow({
        show: true,
        status: 'error',
        message: 'No hay ninguna nave seleccionada para cambios en lote.'
      });
      return;
    }

    if (bulkRarity === 'no_change' && bulkEngine === 'no_change') {
      setIsAlertToShow({
        show: true,
        status: 'error',
        message: 'Selecciona al menos una propiedad (Rareza o Motor) para aplicar cambios en lote.'
      });
      return;
    }

    setShipsList(prev => prev.map(ship => {
      if (bulkSelectedShipIds.includes(ship.ship_id)) {
        const updated = { ...ship };
        if (bulkRarity !== 'no_change') {
          updated.rarity = bulkRarity as any;
        }
        if (bulkEngine !== 'no_change') {
          updated.engine = bulkEngine as any;
        }
        return updated;
      }
      return ship;
    }));

    addAuditLog(
      "BULK_UPDATE",
      "SHIP",
      bulkSelectedShipIds.join(", "),
      `Modificación masiva de ${bulkSelectedShipIds.length} naves. Nuevos valores aplicados: Rareza: [${bulkRarity}], Motor: [${bulkEngine}]`
    );

    setIsAlertToShow({
      show: true,
      status: 'success',
      message: `¡EDICIÓN EN LOTE COMPLETADA! Se actualizó la configuración de ${bulkSelectedShipIds.length} naves seleccionadas con éxito.`
    });

    setBulkSelectedShipIds([]);
    setBulkRarity('no_change');
    setBulkEngine('no_change');
  };
  
  // Create / Clone State Toggle
  const [isNewShip, setIsNewShip] = useState(false);
  const [editedShipForm, setEditedShipForm] = useState<Partial<ShipSeed>>({});

  // Confirmation Modals State
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [shipIdToDelete, setShipIdToDelete] = useState<string | null>(null);

  // Pagination for full 119 simulation
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Filtered and searched base seeds
  const filteredShips = useMemo(() => {
    let result = shipsList.filter(ship => {
      const matchSearch = ship.ship_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          ship.ship_id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchEngine = filterEngine === 'all' || ship.engine === filterEngine;
      const matchRarity = filterRarity === 'all' || ship.rarity.toLowerCase() === filterRarity.toLowerCase();
      
      return matchSearch && matchEngine && matchRarity;
    });

    if (sortBy !== 'none') {
      result.sort((a, b) => {
        let valA: any = 0;
        let valB: any = 0;
        if (sortBy === 'name') {
          valA = a.ship_name.toLowerCase();
          valB = b.ship_name.toLowerCase();
        } else if (sortBy === 'rarity') {
          const rarities: Record<string, number> = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5 };
          valA = rarities[a.rarity.toLowerCase()] || 0;
          valB = rarities[b.rarity.toLowerCase()] || 0;
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

  // Paginated Results
  const paginatedShips = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredShips.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredShips, currentPage]);

  const totalPages = Math.ceil(filteredShips.length / itemsPerPage);

  // Open asset in stellar editor form
  const handleOpenShipTaller = (ship: ShipSeed) => {
    setSelectedShip(ship);
    setIsNewShip(false);
    setEditedShipForm({ ...ship });
  };

  // Open blank stellar form for creating new assets
  const handleOpenBlankTaller = () => {
    const randomUuid = 'ship_sc_' + Math.floor(Math.random() * 100000000);
    setSelectedShip(null);
    setIsNewShip(true);
    setEditedShipForm({
      ship_id: randomUuid,
      ship_name: '',
      description: '',
      rarity: 'Common',
      avatar_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=200&auto=format&fit=crop',
      can_level_required: 1,
      blueprints_required: 10,
      resistance: 1000,
      shield: 500,
      defense: 25,
      speed_boost: 400,
      engine: 'Combustión',
      damage_type: 'Laser',
      
      // NEW SYSTEMS FIELDS INITIALIZATION FOR CREATION
      collection: 'Generis Core',
      ship_role: 'Attack',
      ship_size: 'Fighter',
      attack_standard: 500,
      attack_ionic: 100,
      attack_plasma: 50,
      attack_laser: 250,
      attack_graviton: 0,
      cargo_capacity: 3500,
      production_min: 15,
      production_max: 60,
      series: "S-GEN-01",
      skills: ["Sistemas Auxiliares"],
      skill_requirements: "Requiere Nivel 1 CAN"
    });
  };

  // Save changes back to our system state
  const handleSaveShipKernel = () => {
    if (!editedShipForm.ship_name?.trim()) {
      setIsAlertToShow({
        show: true,
        status: 'error',
        message: 'Acción rechazada: El campo "Nombre de Nave" es obligatorio.'
      });
      return;
    }

    const rarity = editedShipForm.rarity || 'Common';
    const blueprints = Number(editedShipForm.blueprints_required) || 0;
    
    // Cohesion limits check - Now any ship of any rarity requires only 1 blueprint minimum
    let minRequired = 1;
    if (blueprints < minRequired) {
      setIsAlertToShow({
        show: true,
        status: 'error',
        message: `VALIDACIÓN DE COHERENCIA RECHAZADA: Un asset requiere al menos ${minRequired} plano (Blueprint).`
      });
      return;
    }

    if (isNewShip) {
      // Create new asset
      const createdItem = editedShipForm as ShipSeed;
      setShipsList(prev => [createdItem, ...prev]);
      addAuditLog(
        "CREATE",
        "SHIP",
        createdItem.ship_id,
        `Se creó el plano de nave "${createdItem.ship_name}" con rareza ${createdItem.rarity}, ataque ${createdItem.attack_standard}, velocidad ${createdItem.speed_boost}.`
      );
      setIsAlertToShow({
        show: true,
        status: 'success',
        message: `¡PLANO DE NAVE CREADO! "${createdItem.ship_name}" se inyectó con éxito en el catálogo seed_ships.`
      });
    } else {
      // Update existing asset
      const updatedItem = editedShipForm as ShipSeed;
      setShipsList(prev => prev.map(s => s.ship_id === updatedItem.ship_id ? updatedItem : s));
      addAuditLog(
        "UPDATE",
        "SHIP",
        updatedItem.ship_id,
        `Se actualizó el kernel semilla de "${updatedItem.ship_name}": Ataque: ${updatedItem.attack_standard}, Escudo: ${updatedItem.shield}, Defensa: ${updatedItem.defense}, Vel: ${updatedItem.speed_boost}.`
      );
      setIsAlertToShow({
        show: true,
        status: 'success',
        message: `¡KERNEL SEMILLA ACTUALIZADO! Parámetros de "${updatedItem.ship_name}" guardados en BD.`
      });
    }

    // Reset view
    setSelectedShip(null);
    setIsNewShip(false);
    setEditedShipForm({});
  };

  // Clone active blueprint asset
  const handleCloneShipKernel = () => {
    const randomUuid = 'ship_cloned_' + Math.floor(Math.random() * 100000000);
    setIsNewShip(true);
    setSelectedShip(null);
    setEditedShipForm(prev => ({
      ...prev,
      ship_id: randomUuid,
      ship_name: `${prev.ship_name || 'Nave'} Clón Matrix`
    }));

    setIsAlertToShow({
      show: true,
      status: 'success',
      message: 'Matriz estequiométrica del asset clonada en borrador. Asigne un nuevo nombre para persistir.'
    });
  };

  // Delete ship with confirmation
  const handleTriggerDeleteShip = (id: string) => {
    setShipIdToDelete(id);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDeleteShip = () => {
    if (!shipIdToDelete) return;

    const shipToRem = shipsList.find(s => s.ship_id === shipIdToDelete);
    setShipsList(prev => prev.filter(s => s.ship_id !== shipIdToDelete));
    if (shipToRem) {
      addAuditLog(
        "DELETE",
        "SHIP",
        shipToRem.ship_id,
        `Se eliminó el plano de nave "${shipToRem.ship_name}" con rareza ${shipToRem.rarity} del catálogo global.`
      );
    }
    setIsDeleteConfirmOpen(false);
    setShipIdToDelete(null);
    setSelectedShip(null);
    setEditedShipForm({});

    setIsAlertToShow({
      show: true,
      status: 'error',
      message: `¡Nave deletreada de la galaxia! Registro del plano "${shipToRem?.ship_name || 'Plano'}" borrado del kernel.`
    });
  };

  // ========================================================
  // STRUCTURES CRUD HANDLERS
  // ========================================================
  const handleOpenStructureEditor = (struct: StructureAsset) => {
    setSelectedStructure(struct);
    setIsNewStructure(false);
    setEditedStructureForm({ ...struct });
  };

  const handleOpenBlankStructure = () => {
    setSelectedStructure(null);
    setIsNewStructure(true);
    setEditedStructureForm({
      id: 'str_' + Math.floor(Math.random() * 10000000),
      name: '',
      avatar_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=200&auto=format&fit=crop',
      description: '',
      company: 'Hassac',
      collection: 'Sasori Core',
      rarity: 'Common',
      type: 'Producción',
      production_rate: 100,
      capacity: 10000,
      efficiency: 80,
      durability: 5000,
      power_score: 500,
      skills: Array.from({ length: 10 }, (_, idx) => `Habilidad Nivel ${idx + 1}: Desbloqueo base`),
      costs: Array.from({ length: 10 }, (_, idx) => ({
        metal: (idx + 1) * 2000,
        crystal: (idx + 1) * 1200,
        deuterium: (idx + 1) * 500,
        wood: (idx + 1) * 800,
        dark_matter: 0,
        gd_coins: (idx + 1) * 100,
        phantom_coins: 0,
        research_time: `${idx + 1}h`,
        req_technologies: [],
        req_structures: []
      }))
    });
  };

  const handleSaveStructure = () => {
    if (!editedStructureForm.name?.trim()) {
      setIsAlertToShow({
        show: true,
        status: 'error',
        message: 'Acción rechazada: El campo "Nombre de la Estructura" es obligatorio.'
      });
      return;
    }

    if (isNewStructure) {
      setStructuresList(prev => [editedStructureForm as StructureAsset, ...prev]);
      setIsAlertToShow({
        show: true,
        status: 'success',
        message: `¡ESTRUCTURA CREADA! "${editedStructureForm.name}" añadida con éxito.`
      });
    } else {
      setStructuresList(prev => prev.map(s => s.id === editedStructureForm.id ? (editedStructureForm as StructureAsset) : s));
      setIsAlertToShow({
        show: true,
        status: 'success',
        message: `¡ESTRUCTURA ACTUALIZADA! Parámetros de "${editedStructureForm.name}" guardados.`
      });
    }
    setSelectedStructure(null);
  };

  const handleDeleteStructure = (id: string) => {
    setStructuresList(prev => prev.filter(s => s.id !== id));
    setIsAlertToShow({
      show: true,
      status: 'success',
      message: 'Estructura eliminada con éxito.'
    });
  };

  // ========================================================
  // TECHNOLOGIES CRUD HANDLERS
  // ========================================================
  const handleOpenTechnologyEditor = (tech: TechnologyAsset) => {
    setSelectedTechnology(tech);
    setIsNewTechnology(false);
    setEditedTechnologyForm({ ...tech });
  };

  const handleOpenBlankTechnology = () => {
    setSelectedTechnology(null);
    setIsNewTechnology(true);
    setEditedTechnologyForm({
      id: 'tech_' + Math.floor(Math.random() * 10000000),
      name: '',
      avatar_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=200&auto=format&fit=crop',
      description: '',
      company: 'Monsur',
      collection: 'Sasori Core',
      rarity: 'Common',
      type: 'Producción',
      effectiveness: 5,
      scope: 'Toda la flota',
      resource_efficiency: 85,
      power_score: 400,
      skills: Array.from({ length: 10 }, (_, idx) => `Bono Nivel ${idx + 1}: +${(idx + 1) * 2}%`),
      costs: Array.from({ length: 10 }, (_, idx) => ({
        metal: (idx + 1) * 3000,
        crystal: (idx + 1) * 2000,
        deuterium: (idx + 1) * 1000,
        wood: (idx + 1) * 500,
        dark_matter: 0,
        gd_coins: (idx + 1) * 150,
        phantom_coins: 0,
        research_time: `${idx + 1}h`,
        req_technologies: [],
        req_structures: []
      }))
    });
  };

  const handleSaveTechnology = () => {
    if (!editedTechnologyForm.name?.trim()) {
      setIsAlertToShow({
        show: true,
        status: 'error',
        message: 'Acción rechazada: El campo "Nombre de la Tecnología" es obligatorio.'
      });
      return;
    }

    if (isNewTechnology) {
      setTechnologiesList(prev => [editedTechnologyForm as TechnologyAsset, ...prev]);
      setIsAlertToShow({
        show: true,
        status: 'success',
        message: `¡TECNOLOGÍA CREADA! "${editedTechnologyForm.name}" añadida con éxito.`
      });
    } else {
      setTechnologiesList(prev => prev.map(t => t.id === editedTechnologyForm.id ? (editedTechnologyForm as TechnologyAsset) : t));
      setIsAlertToShow({
        show: true,
        status: 'success',
        message: `¡TECNOLOGÍA ACTUALIZADA! Parámetros de "${editedTechnologyForm.name}" guardados.`
      });
    }
    setSelectedTechnology(null);
  };

  const handleDeleteTechnology = (id: string) => {
    setTechnologiesList(prev => prev.filter(t => t.id !== id));
    setIsAlertToShow({
      show: true,
      status: 'success',
      message: 'Tecnología eliminada con éxito.'
    });
  };

  // ========================================================
  // BADGES CRUD HANDLERS
  // ========================================================
  const handleOpenBadgeEditor = (badge: BadgeAsset) => {
    setSelectedBadge(badge);
    setIsNewBadge(false);
    setEditedBadgeForm({ ...badge });
  };

  const handleOpenBlankBadge = () => {
    setSelectedBadge(null);
    setIsNewBadge(true);
    setEditedBadgeForm({
      id: 'badge_' + Math.floor(Math.random() * 10000000),
      name: '',
      description: '',
      collection: 'Sasori Core',
      rarity: 'Common',
      type: 'Producción',
      effect: '+5% producción regional',
      stack: 'No Stackeable',
      duration: 'Permanent',
      badge_slot: 'Consume 1 ranura',
      power_score: 300
    });
  };

  const handleSaveBadge = () => {
    if (!editedBadgeForm.name?.trim()) {
      setIsAlertToShow({
        show: true,
        status: 'error',
        message: 'Acción rechazada: El campo "Nombre de la Insignia" es obligatorio.'
      });
      return;
    }

    if (isNewBadge) {
      setBadgesList(prev => [editedBadgeForm as BadgeAsset, ...prev]);
      setIsAlertToShow({
        show: true,
        status: 'success',
        message: `¡INSIGNIA CREADA! "${editedBadgeForm.name}" añadida con éxito.`
      });
    } else {
      setBadgesList(prev => prev.map(b => b.id === editedBadgeForm.id ? (editedBadgeForm as BadgeAsset) : b));
      setIsAlertToShow({
        show: true,
        status: 'success',
        message: `¡INSIGNIA ACTUALIZADA! Parámetros de "${editedBadgeForm.name}" guardados.`
      });
    }
    setSelectedBadge(null);
  };

  const handleDeleteBadge = (id: string) => {
    setBadgesList(prev => prev.filter(b => b.id !== id));
    setIsAlertToShow({
      show: true,
      status: 'success',
      message: 'Insignia eliminada con éxito.'
    });
  };

  // ========================================================
  // SUBPESTAÑA 2: REGISTRO DE HANGAR (AUDITORÍA JUGADOR) STATE
  // ========================================================
  const [playerSearchQuery, setPlayerSearchQuery] = useState('');
  const [auditedUser, setAuditedUser] = useState<UserProfile | null>(() => users[0] || null);
  
  // Audited User's Hangar state
  const [userHangarList, setUserHangarList] = useState<UserHangarShip[]>(() => [
    {
      userShipId: "uh_01",
      shipId: "8c772e0a-0da0-457c-9b62-11ecdf2d8a01",
      name: "Sasori Apex Devastator Mk1",
      stars: 5,
      level: 18,
      blueprintsOwned: 15,
      blueprintsRequired: 150,
      flightState: "INFINITE_LOCK",
      lastLog: "Ruta comercial Sector-9 interceptada. Error de redundancia temporal en hyperdrive de Go."
    },
    {
      userShipId: "uh_02",
      shipId: "77d24ab9-9941-477d-8de5-7ee5bb5f2103",
      name: "Phantasm Void Stalker Mk5",
      stars: 7,
      level: 42,
      blueprintsOwned: 200,
      blueprintsRequired: 200,
      flightState: "SAFE",
      lastLog: "Buque en órbita síncrona en Sasori Headquarters. Integridad defensiva estable."
    },
    {
      userShipId: "uh_03",
      shipId: "c45f91ae-ab32-45e3-9cf9-7f394c8bfa05",
      name: "Excalibur Interceptor Mk4",
      stars: 3,
      level: 5,
      blueprintsOwned: 45,
      blueprintsRequired: 80,
      flightState: "TRANSITING",
      lastLog: "Exploración en curso. Expedición activa en cinturón de Orichaltron-Beta."
    }
  ]);

  // Selected ship index to inject
  const [selectedShipIdToInject, setSelectedShipIdToInject] = useState<string>(INITIAL_SEED_SHIPS[0]?.ship_id || '');

  // Sincro hangar player trigger (search user hangar)
  const handleSincroHangarPlayer = () => {
    if (!playerSearchQuery.trim()) {
      setIsAlertToShow({
        show: true,
        status: 'error',
        message: 'Soporte: Ingrese un email, ID o Wallet para enlazar hangar.'
      });
      return;
    }

    const qLower = playerSearchQuery.toLowerCase();
    const foundUser = users.find(u => 
      u.id.toLowerCase() === qLower || 
      u.email.toLowerCase() === qLower ||
      u.username.toLowerCase().includes(qLower)
    );

    if (foundUser) {
      setAuditedUser(foundUser);
      // Simular naves aleatorias del usuario para darle dinamismo realista
      const seedRarity = foundUser.level % 3;
      const computedMockHangar = shipsList.slice(0, 3 + seedRarity).map((seed, idx) => ({
        userShipId: `uh_${foundUser.id}_${idx}`,
        shipId: seed.ship_id,
        name: seed.ship_name,
        stars: Math.min(((idx + foundUser.level) % 7) + 1, 7),
        level: Math.max((foundUser.level + idx * 4) % 50, 1),
        blueprintsOwned: Math.floor(foundUser.level * 1.5 + idx * 8),
        blueprintsRequired: seed.blueprints_required,
        flightState: (idx % 3 === 0) ? "INFINITE_LOCK" as const : (idx % 3 === 1) ? "SAFE" as const : "TRANSITING" as const,
        lastLog: (idx % 3 === 0) 
          ? "Transito trunco. Error síncrono. Bloqueo temporal en motor warp." 
          : "Servicio regular de patrullaje."
      }));

      setUserHangarList(computedMockHangar);

      setIsAlertToShow({
        show: true,
        status: 'success',
        message: `SINCRO EXITOSA: Se han cargado las ${computedMockHangar.length} naves asociadas a ${foundUser.username}`
      });
    } else {
      setIsAlertToShow({
        show: true,
        status: 'error',
        message: 'No se encontró ningún jugador con ese identificador de cuenta.'
      });
    }
  };

  // Export hangar fleet report as JSON for audited player
  const handleExportHangarReportJSON = () => {
    if (userHangarList.length === 0) {
      setIsAlertToShow({
        show: true,
        status: 'error',
        message: 'No hay naves en el hangar de este usuario para exportar.'
      });
      return;
    }

    const reportData = {
      timestamp: new Date().toISOString(),
      auditedUser: auditedUser ? {
        id: auditedUser.id,
        username: auditedUser.username,
        email: auditedUser.email,
        level: auditedUser.level,
        status: auditedUser.status
      } : 'No user loaded',
      fleet: userHangarList.map(ship => ({
        userShipId: ship.userShipId,
        shipId: ship.shipId,
        name: ship.name,
        stars: ship.stars,
        level: ship.level,
        blueprintsOwned: ship.blueprintsOwned,
        blueprintsRequired: ship.blueprintsRequired,
        flightState: ship.flightState,
        lastLog: ship.lastLog,
        estimatedPowerScore: Math.round(
          ship.level * 150 + 
          ship.stars * 800 + 
          (shipsList.find(s => s.ship_id === ship.shipId)?.damage_factor || 1) * 2000
        )
      }))
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(reportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `fleet_report_${auditedUser?.username || 'user'}_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setIsAlertToShow({
      show: true,
      status: 'success',
      message: '¡REPORTE DE FLOTA EXPORTADO! El archivo JSON se ha descargado exitosamente.'
    });
  };

  // Export hangar fleet report as CSV for audited player
  const handleExportHangarReportCSV = () => {
    if (userHangarList.length === 0) {
      setIsAlertToShow({
        show: true,
        status: 'error',
        message: 'No hay naves en el hangar de este usuario para exportar.'
      });
      return;
    }

    const headers = [
      'ID de Hangar',
      'ID de Nave',
      'Nombre de la Nave',
      'Estrellas',
      'Nivel',
      'Planos en Posesion',
      'Planos Requeridos',
      'Estado de Vuelo',
      'Puntaje de Poder Estimado',
      'Ultimo Registro'
    ];

    const rows = userHangarList.map(ship => {
      const powerScore = Math.round(
        ship.level * 150 + 
        ship.stars * 800 + 
        (shipsList.find(s => s.ship_id === ship.shipId)?.damage_factor || 1) * 2000
      );
      return [
        `"${ship.userShipId}"`,
        `"${ship.shipId}"`,
        `"${ship.name}"`,
        ship.stars,
        ship.level,
        ship.blueprintsOwned,
        ship.blueprintsRequired,
        `"${ship.flightState}"`,
        powerScore,
        `"${ship.lastLog.replace(/"/g, '""')}"`
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", encodeURI(csvContent));
    downloadAnchor.setAttribute("download", `fleet_report_${auditedUser?.username || 'user'}_${Date.now()}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setIsAlertToShow({
      show: true,
      status: 'success',
      message: '¡REPORTE DE FLOTA EXPORTADO! El archivo CSV se ha descargado exitosamente.'
    });
  };

  // Direct cell modifier triggers
  const handleUpdateHangarCell = (userShipId: string, field: 'level' | 'blueprintsOwned' | 'stars', val: number) => {
    setUserHangarList(prev => prev.map(ship => {
      if (ship.userShipId === userShipId) {
        return { ...ship, [field]: val };
      }
      return ship;
    }));
  };

  const handleForceAnchorSupport = async (userShipId: string) => {
    // Simulación de disparo de emergencia a la API / Supabase
    const payload = {
      action: 'FORCE_SAFE_ANCHOR',
      target_ship_id: userShipId,
      timestamp: new Date().toISOString(),
      admin_override: true,
      unlock_can_modules: true
    };
    
    console.log(`[API EMERGENCY POST] -> /api/admin/ships/anchor`, payload);
    
    // Simular latencia de red
    await new Promise(resolve => setTimeout(resolve, 600));

    setUserHangarList(prev => prev.map(ship => {
      if (ship.userShipId === userShipId) {
        return {
          ...ship,
          flightState: 'SAFE',
          lastLog: '[RESCATE TÉCNICO] Anclaje forzado por consola. Candados de C.A.N. descongelados y vuelo cancelado.'
        };
      }
      return ship;
    }));

    setIsAlertToShow({
      show: true,
      status: 'success',
      message: '🚨 ¡OPERACIÓN DE EMERGENCIA! Interceptación de BD exitosa. Nave SAFE y C.A.N. descongelada.'
    });
  };

  // Delete ship from active user Hangar
  const handleDeleteShipFromHangar = (userShipId: string) => {
    const matched = userHangarList.find(s => s.userShipId === userShipId);
    setUserHangarList(prev => prev.filter(s => s.userShipId !== userShipId));
    setIsAlertToShow({
      show: true,
      status: 'success',
      message: `Plano eliminado de hangar: "${matched?.name || 'Nave'}" remendada de la cuenta celular.`
    });
  };

  // Injection of new base ship directly to player Hangar
  const handleInjectNewShipToHangar = () => {
    if (!auditedUser) {
      setIsAlertToShow({
        show: true,
        status: 'error',
        message: 'Imposible inyectar: Ninguna cuenta de comandante vinculada al enlace de hangar.'
      });
      return;
    }

    const baseShip = shipsList.find(s => s.ship_id === selectedShipIdToInject);
    if (!baseShip) return;

    // Check if already has it
    if (userHangarList.some(s => s.shipId === baseShip.ship_id)) {
      setIsAlertToShow({
        show: true,
        status: 'error',
        message: `El comandante ya posee un plano de "${baseShip.ship_name}". Ajuste sus niveles directamente en la tabla de soporte.`
      });
      return;
    }

    const injected: UserHangarShip = {
      userShipId: `uh_inj_${Date.now()}`,
      shipId: baseShip.ship_id,
      name: baseShip.ship_name,
      stars: 1,
      level: 1,
      blueprintsOwned: 5,
      blueprintsRequired: baseShip.blueprints_required,
      flightState: 'SAFE',
      lastLog: 'Nave de soporte inyectada por el Panel Administrativo Sasorilabs.'
    };

    setUserHangarList(prev => [...prev, injected]);

    setIsAlertToShow({
      show: true,
      status: 'success',
      message: `¡INYECCION AL ESTRELLA ACCIDENTAL! Se ha regalado la nave "${baseShip.ship_name}" al hangar de ${auditedUser.username}.`
    });
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER SEGMENT BAR */}
      <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest font-mono block">
            NÚCLEO MAESTRO KERNEL
          </span>
          <h2 className="text-xl font-bold font-display text-white tracking-tight flex items-center gap-2 mt-1">
            <Navigation className="text-red-500 animate-pulse rotate-45" size={18} />
            MÓDULO FLOTAS Y NAVES ESTELARES
          </h2>
          <p className="text-xs text-zinc-500 font-sans mt-0.5">
            Calibración directa sobre de la base de datos seed_ships de Supabase e inventario matricial de capitanes.
          </p>
        </div>

        {/* Tab Selection buttons (Military Compact Ribbon) */}
        <div className="flex bg-black/60 border border-zinc-850 p-1 rounded font-mono text-[10.5px]">
          <button
            onClick={() => setActiveTab('atelier')}
            className={`px-3 py-1.5 font-bold uppercase transition-all tracking-wider rounded flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'atelier'
                ? 'bg-red-650 text-white shadow-lg'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Compass size={13} />
            Taller Estelar (SEED CRUD)
          </button>
          
          <button
            onClick={() => setActiveTab('hangar')}
            className={`px-3 py-1.5 font-bold uppercase transition-all tracking-wider rounded flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'hangar'
                ? 'bg-red-650 text-white shadow-lg'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <User size={13} />
            Hangar (Auditoría Piloto)
          </button>

          <button
            onClick={() => setActiveTab('fabricacion')}
            className={`px-3 py-1.5 font-bold uppercase transition-all tracking-wider rounded flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'fabricacion'
                ? 'bg-red-650 text-white shadow-lg'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Settings size={13} />
            Reglas de Fabricación
          </button>

          <button
            onClick={() => setActiveTab('bitacora')}
            className={`px-3 py-1.5 font-bold uppercase transition-all tracking-wider rounded flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'bitacora'
                ? 'bg-red-650 text-white shadow-lg'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Clock size={16} className="mr-2" />
            Bitácora
          </button>
          
          <button
            onClick={() => setActiveTab('sandbox')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center ${
              activeTab === 'sandbox' 
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10' 
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
            }`}
          >
            <Shield size={16} className="mr-2" />
            Combat Sandbox
          </button>
        </div>
      </div>

      {/* CORE WRAPPERS AND PANELS */}
      <AnimatePresence mode="wait">
        
        {/* SUBPESTAÑA 1: TALLER ESTELAR (SEED CRUD CATALOG) */}
        {activeTab === 'atelier' && (
          <motion.div
            key="atelier_section"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="grid grid-cols-1 xl:grid-cols-3 gap-6"
          >
            
            {/* CATALOG VIEW LISTING WITH ADVANCED GRID */}
            <div className="xl:col-span-2 space-y-4 p-4 bg-zinc-950 border border-zinc-900 rounded-lg">
              
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between pb-3 border-b border-zinc-900">
                <span className="text-[11px] font-mono text-zinc-400 font-bold uppercase tracking-widest">
                  Planos de Naves Registrados ({filteredShips.length} naves en kernel)
                </span>
                
                <button
                  onClick={handleOpenBlankTaller}
                  className="w-full sm:w-auto px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] uppercase font-mono tracking-wider rounded flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus size={13} /> CREAR NAVE ASSET
                </button>
              </div>

              {/* SEARCH & FILTERS BOX */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div className="relative">
                  <div className="absolute left-2.5 top-2.5 text-zinc-650">
                    <Search size={14} />
                  </div>
                  <input
                    aria-label="input element"type="text"
                    placeholder="Buscador de Planos..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    className="w-full pl-8 pr-3 py-1.5 bg-black border border-zinc-850 rounded text-xs text-white placeholder-zinc-700 tracking-wide font-mono focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>

                <div className="flex gap-2">
                  <div className="text-[9.5px] font-mono text-zinc-550 flex items-center shrink-0">PROPULSIÓN:</div>
                  <select
                    aria-label="Filtrar por Sistema Prorropulsor"
                    value={filterEngine}
                    onChange={(e) => { setFilterEngine(e.target.value); setCurrentPage(1); }}
                    className="w-full bg-black border border-zinc-850 rounded px-2.5 text-xs text-zinc-400 focus:outline-none focus:border-red-500 cursor-pointer font-mono"
                  >
                    <option value="all">Sistemas (Todas)</option>
                    <option value="Combustión">Combustión</option>
                    <option value="Impulso">Impulso</option>
                    <option value="Hiperespacio">Hiperespacio</option>
                    <option value="Phantom">Phantom Series</option>
                    <option value="Exclusive">Exclusive</option>
                    <option value="Xmas">Xmas Event</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <div className="text-[9.5px] font-mono text-zinc-550 flex items-center shrink-0">RAREZA:</div>
                  <select
                    aria-label="Filtrar por rareza"
                    value={filterRarity}
                    onChange={(e) => { setFilterRarity(e.target.value); setCurrentPage(1); }}
                    className="w-full bg-black border border-zinc-850 rounded px-2.5 text-xs text-zinc-400 focus:outline-none focus:border-red-500 cursor-pointer font-mono"
                  >
                    <option value="all">Rarezas (Todas)</option>
                    <option value="Common">Common</option>
                    <option value="Uncommon">Uncommon</option>
                    <option value="Rare">Rare</option>
                    <option value="Epic">Epic</option>
                    <option value="Legendary">Legendary</option>
                    <option value="Phantom">Phantom</option>
                    <option value="Xmas">Xmas</option>
                  </select>
                </div>
              </div>

              {/* ADVANCED SORTING BLOCK */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-zinc-950/30 border border-zinc-900 rounded-lg text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-500 uppercase">ORDENAR CATÁLOGO:</span>
                  <select
                    aria-label="Ordenar por"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-black border border-zinc-850 rounded px-2 py-1 text-xs text-zinc-300 focus:outline-none focus:border-red-500 cursor-pointer font-mono"
                  >
                    <option value="none">Por ID (Por Defecto)</option>
                    <option value="name">Por Nombre de Nave</option>
                    <option value="rarity">Por Rarity (Grado)</option>
                    <option value="power">Por Puntaje de Poder Estimado</option>
                  </select>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setSortOrder('asc')}
                    className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all select-none cursor-pointer ${
                      sortOrder === 'asc' ? 'bg-red-950 border border-red-500/30 text-red-500' : 'bg-black border border-zinc-850 text-zinc-400 hover:text-white hover:bg-zinc-900'
                    }`}
                  >
                    Ascendente
                  </button>
                  <button
                    onClick={() => setSortOrder('desc')}
                    className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all select-none cursor-pointer ${
                      sortOrder === 'desc' ? 'bg-red-950 border border-red-500/30 text-red-500' : 'bg-black border border-zinc-850 text-zinc-400 hover:text-white hover:bg-zinc-900'
                    }`}
                  >
                    Descendente
                  </button>
                </div>
              </div>

              {/* BULK ACTIONS BAR */}
              <div className="p-3 bg-red-950/20 border border-red-500/30 rounded-lg flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0"></span>
                  <span className="font-mono text-zinc-300">
                    Cambios en Lote: <strong className="text-red-500 font-bold">{bulkSelectedShipIds.length}</strong> marcados
                  </span>
                  {bulkSelectedShipIds.length > 0 && (
                    <button
                      onClick={() => setBulkSelectedShipIds([])}
                      className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded text-[9px] font-mono font-bold uppercase transition-colors cursor-pointer"
                    >
                      Limpiar
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (bulkSelectedShipIds.length === paginatedShips.length) {
                        setBulkSelectedShipIds([]);
                      } else {
                        setBulkSelectedShipIds(paginatedShips.map(s => s.ship_id));
                      }
                    }}
                    className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded text-[9px] font-mono font-bold uppercase transition-colors cursor-pointer"
                  >
                    {bulkSelectedShipIds.length === paginatedShips.length ? 'Deseleccionar Visibles' : 'Seleccionar Visibles'}
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase">Rareza:</span>
                    <select
                      aria-label="select element"value={bulkRarity}
                      onChange={(e) => setBulkRarity(e.target.value)}
                      className="bg-black border border-zinc-850 rounded px-1.5 py-1 text-[11px] text-zinc-350 focus:outline-none focus:border-red-500 cursor-pointer font-mono"
                    >
                      <option value="no_change">Sin alterar</option>
                      <option value="Common">Common</option>
                      <option value="Uncommon">Uncommon</option>
                      <option value="Rare">Rare</option>
                      <option value="Epic">Epic</option>
                      <option value="Legendary">Legendary</option>
                      <option value="Phantom">Phantom</option>
                      <option value="Xmas">Xmas</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-zinc-550 uppercase">Motor:</span>
                    <select
                      aria-label="Filtrar por Clase de Nave"
                      value={bulkEngine}
                      onChange={(e) => setBulkEngine(e.target.value)}
                      className="bg-black border border-zinc-850 rounded px-1.5 py-1 text-[11px] text-zinc-350 focus:outline-none focus:border-red-500 cursor-pointer font-mono"
                    >
                      <option value="no_change">Sin alterar</option>
                      <option value="Combustión">Combustión</option>
                      <option value="Impulso">Impulso</option>
                      <option value="Hiperespacio">Hiperespacio</option>
                      <option value="Phantom">Phantom Series</option>
                      <option value="Exclusive">Exclusive</option>
                      <option value="Xmas">Xmas Event</option>
                    </select>
                  </div>

                  <button
                    onClick={handleApplyBulkChanges}
                    disabled={bulkSelectedShipIds.length === 0}
                    className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-[10px] uppercase font-mono tracking-wider rounded transition-colors cursor-pointer"
                  >
                    Aplicar Lote ({bulkSelectedShipIds.length})
                  </button>
                </div>
              </div>

              {/* GRID DISPLAYS */}
              {paginatedShips.length === 0 ? (
                <div className="p-12 text-center text-zinc-550 italic bg-black/40 border border-zinc-900 rounded font-sans leading-relaxed">
                  No se localizaron planos espaciales con los coeficientes de filtro asignados en la query.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {paginatedShips.map((ship) => (
                    <div 
                      key={ship.ship_id}
                      className={`p-3 bg-black/60 border hover:border-zinc-700 rounded-lg flex gap-3 transition-all relative group ${
                        selectedShip?.ship_id === ship.ship_id ? 'ring-1 ring-red-500/60 border-red-500/20' : 'border-zinc-900'
                      }`}
                    >
                      {/* Checkbox for bulk select */}
                      <div className="absolute top-2.5 right-2 px-1 z-10 flex items-center">
                        <input
                          aria-label="input element"type="checkbox"
                          checked={bulkSelectedShipIds.includes(ship.ship_id)}
                          onChange={() => {
                            setBulkSelectedShipIds(prev =>
                              prev.includes(ship.ship_id)
                                ? prev.filter(id => id !== ship.ship_id)
                                : [...prev, ship.ship_id]
                            );
                          }}
                          className="accent-red-600 cursor-pointer w-4 h-4 rounded border-zinc-800 bg-black focus:ring-0 focus:ring-offset-0"
                        />
                      </div>

                      <img 
                        src={ship.avatar_url} 
                        alt={ship.ship_name} 
                        className="w-16 h-16 rounded object-cover border border-zinc-850 bg-zinc-900 flex-shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-start justify-between gap-1">
                          <span className="font-bold text-xs text-white uppercase tracking-tight block truncate" title={ship.ship_name}>
                            {ship.ship_name}
                          </span>
                          <span className={`px-1.5 py-0.2 shrink-0 rounded text-[7.5px] uppercase font-mono font-bold ${
                            ship.rarity === 'Legendary' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                            ship.rarity === 'Phantom' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/10' :
                            ship.rarity === 'Xmas' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/10' :
                            ship.rarity === 'Epic' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/10' :
                            ship.rarity === 'Rare' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/10' :
                            'bg-zinc-850 text-zinc-400 border border-zinc-850'
                          }`}>
                            {ship.rarity}
                          </span>
                        </div>

                        {/* Colección, Rol, Serie y Tamaño */}
                        <div className="flex flex-wrap gap-1 text-[8.5px] font-mono text-zinc-550 font-semibold leading-tight">
                          <span className="bg-zinc-950 px-1.5 py-0.5 rounded text-zinc-400 border border-zinc-900">{ship.collection || 'Sasori Core'}</span>
                          <span className="bg-zinc-950 px-1.5 py-0.5 rounded text-red-400 border border-zinc-900">{ship.ship_role || 'Interceptor'}</span>
                          <span className="bg-zinc-950 px-1.5 py-0.5 rounded text-zinc-400 border border-zinc-900">{ship.series || 'Series'}</span>
                          <span className="bg-zinc-950 px-1.5 py-0.5 rounded text-cyan-400 border border-zinc-900">{ship.ship_size || 'Pequeña'}</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-x-2 text-[9px] font-mono text-zinc-400 pt-0.5">
                          <div>HP: <span className="font-bold text-white">{ship.resistance?.toLocaleString() || 0}</span></div>
                          <div>Escudo: <span className="font-bold text-cyan-400">{ship.shield?.toLocaleString() || 0}</span></div>
                          <div>Ataque Estd: <span className="font-bold text-amber-500">{ship.attack_standard?.toLocaleString() || 0}</span></div>
                          <div>Motor: <span className="font-bold text-zinc-300">{ship.engine}</span></div>
                          <div>Carga: <span className="font-bold text-emerald-400">{(ship.cargo_capacity || 0).toLocaleString()}</span></div>
                          <div>Prod: <span className="font-bold text-pink-500 font-mono">{ship.production_min || 0}-{ship.production_max || 0}</span></div>
                        </div>

                        {/* Skills inline */}
                        {ship.skills && ship.skills.length > 0 && (
                          <div className="text-[8.5px] font-mono text-zinc-550 truncate" title={ship.skills.join(', ')}>
                            Skills: <span className="text-zinc-400 font-semibold">{ship.skills.join(', ')}</span>
                          </div>
                        )}


                        <div className="pt-1.5 flex items-center justify-between border-t border-zinc-900 w-full">
                          <span className="text-[8.5px] text-zinc-500 font-mono">Req: Lvl {ship.can_level_required}</span>
                          <button
                            onClick={() => handleOpenShipTaller(ship)}
                            className="text-[8.5px] font-mono font-bold text-red-500 hover:text-red-400 uppercase tracking-widest flex items-center gap-1 cursor-pointer"
                          >
                            <Settings size={10} /> ABRIR EN TALLER
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* PAGINADOR RECTANGULAR COMPACTO */}
              {totalPages > 1 && (
                <div className="pt-3 border-t border-zinc-900 flex justify-between items-center text-[10.5px] font-mono text-zinc-500">
                  <span>Página {currentPage} de {totalPages}</span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="p-1 px-2.5 bg-zinc-900 hover:bg-zinc-850 rounded border border-zinc-850 disabled:opacity-30 disabled:hover:bg-zinc-900"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="p-1 px-2.5 bg-zinc-900 hover:bg-zinc-850 rounded border border-zinc-850 disabled:opacity-30 disabled:hover:bg-zinc-900"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* CONSOLA DE MODIFICATION AVANZADA (EDITOR / RECURSIVE BLOCKS FORM) */}
            <div className="space-y-4">
              <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-lg space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-2.5">
                  <span className="text-[10px] font-mono text-zinc-300 tracking-wider font-bold uppercase flex items-center gap-2">
                    <Sliders size={12} className="text-red-500" />
                    {isNewShip ? 'REGISTRAR PLANO NUEVO' : 'CONSOLA DE MODIFICACIÓN EXCEL'}
                  </span>
                  
                  {(selectedShip || isNewShip) && (
                    <button
                      onClick={() => { setSelectedShip(null); setIsNewShip(false); setEditedShipForm({}); }}
                      className="text-zinc-500 hover:text-white transition-colors"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {!selectedShip && !isNewShip ? (
                  <div className="py-20 text-center space-y-3.5 bg-black/30 border border-zinc-900 rounded-lg p-5">
                    <Compass size={32} className="text-zinc-700 mx-auto stroke-1" />
                    <p className="text-xs text-zinc-500 font-sans leading-relaxed">
                      Seleccione una estructura o nave de la rejilla de displays utilizando el hipervínculo <strong className="text-zinc-400">"ABRIR EN TALLER"</strong> para cargar sus especificaciones térmicas.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[640px] overflow-y-auto pr-1">

                    {/* Bloque 1: Identificación y Lore */}
                    <div className="space-y-3">
                      <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest block border-b border-zinc-900 pb-1">
                        MÉTRICAS BASE Y LORE
                      </span>

                      <div className="space-y-1">
                        <label className="text-[9px] font-mono text-zinc-500 uppercase">technical ship_id (Readonly)</label>
                        <input
                          aria-label="input element"type="text"
                          readOnly
                          value={editedShipForm.ship_id || ''}
                          className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-850 rounded text-zinc-500 text-xs font-mono focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-mono text-zinc-500 uppercase">Nombre de la Nave</label>
                        <input
                          aria-label="Nombre de la Nave"
                          type="text"
                          value={editedShipForm.ship_name || ''}
                          onChange={(e) => setEditedShipForm(prev => ({ ...prev, ship_name: e.target.value }))}
                          className="w-full px-2.5 py-1.5 bg-black border border-zinc-800 rounded text-white text-xs focus:outline-none focus:border-red-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-mono text-zinc-500 uppercase block">Clase / Catalogación de Rareza</label>
                        <select
                          aria-label="Clase de Rareza"
                          value={editedShipForm.rarity || 'Common'}
                          onChange={(e) => setEditedShipForm(prev => ({ ...prev, rarity: e.target.value as any }))}
                          className="w-full bg-black border border-zinc-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-red-500 font-mono cursor-pointer"
                        >
                          <option value="Common">Common</option>
                          <option value="Uncommon">Uncommon</option>
                          <option value="Rare">Rare</option>
                          <option value="Epic">Epic</option>
                          <option value="Legendary">Legendary</option>
                          <option value="Phantom">Phantom Series</option>
                          <option value="Xmas">Xmas Event</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-mono text-zinc-500 uppercase">Lore de la nave (Descripción)</label>
                        <textarea
                          aria-label="Lore de la Nave"
                          rows={3}
                          value={editedShipForm.description || ''}
                          onChange={(e) => setEditedShipForm(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full px-2.5 py-1.5 bg-black border border-zinc-800 rounded text-zinc-300 text-xs focus:outline-none focus:border-red-500 resize-none font-sans leading-normal"
                        />
                      </div>
                    </div>

                    {/* Bloque 2: Enlaces Multimedia */}
                    <div className="space-y-3 pt-2 border-t border-zinc-900">
                      <span className="text-[9px] text-zinc-550 font-bold uppercase tracking-widest block">
                        ENLACES MULTIMEDIA
                      </span>

                      <div className="space-y-2">
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-zinc-500">avatar_url (Bucket Postgres Path)</label>
                          <input
                            aria-label="URL del Avatar"
                            type="text"
                            value={editedShipForm.avatar_url || ''}
                            onChange={(e) => setEditedShipForm(prev => ({ ...prev, avatar_url: e.target.value }))}
                            className="w-full px-2.5 py-1.5 bg-black border border-zinc-800 rounded text-zinc-300 text-xs font-mono focus:outline-none focus:border-red-500"
                          />
                        </div>
                        <div className="flex items-center gap-2.5 p-2 bg-black/40 border border-zinc-900 rounded">
                          <img 
                            src={editedShipForm.avatar_url} 
                            alt="Pre-Render" 
                            className="w-12 h-12 rounded object-cover bg-zinc-950 border border-zinc-850"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              // Fallback placeholder url
                              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=200&auto=format&fit=crop";
                            }}
                          />
                          <span className="text-[8.5px] text-zinc-650 font-mono">Previsualización inmediata del Render Estructural 3D.</span>
                        </div>
                      </div>
                    </div>

                    {/* Bloque 3: Requisitos de Fábrica (requirements) */}
                    <div className="space-y-3 pt-2 border-t border-zinc-900">
                      <span className="text-[9px] text-zinc-550 font-bold uppercase tracking-widest block">
                        REQUISITOS DE FÁBRICA (REQUIREMENTS JSONB)
                      </span>

                      <div className="grid grid-cols-2 gap-3.5">
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-zinc-550">LEVEL REQ CAN</label>
                          <input
                            aria-label="Nivel Requerido CAN"
                            type="number"
                            min={1}
                            max={60}
                            value={editedShipForm.can_level_required || 1}
                            onChange={(e) => setEditedShipForm(prev => ({ ...prev, can_level_required: parseInt(e.target.value) || 1 }))}
                            className="w-full px-2.5 py-1.5 bg-black border border-zinc-800 rounded text-white text-xs font-mono text-right focus:outline-none focus:border-red-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-zinc-550 font-bold text-red-400">BLUEPRINTS OBLIGATORIOS</label>
                          <input
                            aria-label="Blueprints Obligatorios"
                            type="number"
                            min={1}
                            value={editedShipForm.blueprints_required || 10}
                            onChange={(e) => setEditedShipForm(prev => ({ ...prev, blueprints_required: parseInt(e.target.value) || 10 }))}
                            className="w-full px-2.5 py-1.5 bg-black border border-zinc-800 rounded text-red-400 text-xs font-mono text-right focus:outline-none focus:border-red-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bloque 4: Modificadores de Combate (skills_modifiers) */}
                    <div className="space-y-3 pt-2 border-t border-zinc-900">
                      <span className="text-[9px] text-zinc-550 font-bold uppercase tracking-widest block">
                        MODIFICADORES DE INTEGRIDAD (MUTANTS JSONB)
                      </span>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-zinc-500">RESISTENCE (HP Base)</label>
                          <input
                            aria-label="Resistencia HP Base"
                            type="number"
                            min={100}
                            value={editedShipForm.resistance || 1000}
                            onChange={(e) => setEditedShipForm(prev => ({ ...prev, resistance: parseInt(e.target.value) || 1000 }))}
                            className="w-full px-2.5 py-1.5 bg-black border border-zinc-800 rounded text-white text-xs font-mono text-right focus:outline-none focus:border-red-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-zinc-550">SHIELD</label>
                          <input
                            aria-label="Escudo"
                            type="number"
                            min={0}
                            value={editedShipForm.shield || 500}
                            onChange={(e) => setEditedShipForm(prev => ({ ...prev, shield: parseInt(e.target.value) || 0 }))}
                            className="w-full px-2.5 py-1.5 bg-black border border-zinc-800 rounded text-white text-xs font-mono text-right focus:outline-none focus:border-red-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-zinc-500">DEFENSE</label>
                          <input
                            aria-label="Defensa"
                            type="number"
                            min={0}
                            value={editedShipForm.defense || 25}
                            onChange={(e) => setEditedShipForm(prev => ({ ...prev, defense: parseInt(e.target.value) || 0 }))}
                            className="w-full px-2.5 py-1.5 bg-black border border-zinc-800 rounded text-white text-xs font-mono text-right focus:outline-none focus:border-red-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-zinc-550">TRAVEL SPEED</label>
                          <input
                            aria-label="Velocidad de Viaje"
                            type="number"
                            min={10}
                            value={editedShipForm.speed_boost || 400}
                            onChange={(e) => setEditedShipForm(prev => ({ ...prev, speed_boost: parseInt(e.target.value) || 10 }))}
                            className="w-full px-2.5 py-1.5 bg-black border border-zinc-800 rounded text-white text-xs font-mono text-right focus:outline-none focus:border-red-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-zinc-500">COMBAT SPEED</label>
                          <input
                            aria-label="Velocidad de Combate"
                            type="number"
                            min={5}
                            value={editedShipForm.combat_speed || 200}
                            onChange={(e) => setEditedShipForm(prev => ({ ...prev, combat_speed: parseInt(e.target.value) || 5 }))}
                            className="w-full px-2.5 py-1.5 bg-black border border-zinc-800 rounded text-white text-xs font-mono text-right focus:outline-none focus:border-red-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bloque 5: Matriz Analítica de Telemetría */}
                    <div className="space-y-3 pt-2 border-t border-zinc-900">
                      <span className="text-[9px] text-zinc-550 font-bold uppercase tracking-widest block">
                        MATRIZ ANALÍTICA DE TELEMETRÍA
                      </span>

                      <div className="grid grid-cols-2 gap-3.5">
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-zinc-500">Sistema Prorropulsor</label>
                          <select
                            aria-label="Sistema Prorropulsor"
                            value={editedShipForm.engine || 'Combustión'}
                            onChange={(e) => setEditedShipForm(prev => ({ ...prev, engine: e.target.value as any }))}
                            className="w-full bg-black border border-zinc-800 rounded py-1 px-2 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
                          >
                            <option value="Combustión">Combustión</option>
                            <option value="Impulso">Impulso</option>
                            <option value="Hiperespacio">Hiperespacio</option>
                            <option value="Phantom font-bold">Phantom Series</option>
                            <option value="Exclusive">Exclusive</option>
                            <option value="Xmas">Xmas Event</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-zinc-500">Tipo de Ataque</label>
                          <select
                            aria-label="Tipo de Ataque"
                            value={editedShipForm.damage_type || 'Laser'}
                            onChange={(e) => setEditedShipForm(prev => ({ ...prev, damage_type: e.target.value as any }))}
                            className="w-full bg-black border border-zinc-800 rounded py-1 px-2 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
                          >
                            <option value="Kinetic">Kinetic</option>
                            <option value="Laser">Laser</option>
                            <option value="Plasma">Plasma</option>
                            <option value="Ionic">Ionic</option>
                            <option value="Graviton">Graviton</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Bloque 6: Identidad y Clasificación Estelar */}
                    <div className="space-y-3 pt-2 border-t border-zinc-900">
                      <span className="text-[9px] text-zinc-550 font-bold uppercase tracking-widest block">
                        CLASIFICACIÓN Y REGISTRO (IDENTITY)
                      </span>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-zinc-500 uppercase">Colección</label>
                          <input
                            aria-label="input element"type="text"
                            value={editedShipForm.collection || ''}
                            onChange={(e) => setEditedShipForm(prev => ({ ...prev, collection: e.target.value }))}
                            className="w-full px-2.5 py-1.5 bg-black border border-zinc-805 rounded text-white text-xs focus:outline-none focus:border-red-500"
                            placeholder="Ej. Sasori Elite"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-zinc-500 uppercase">Serie</label>
                          <input
                            aria-label="input element"type="text"
                            value={editedShipForm.series || ''}
                            onChange={(e) => setEditedShipForm(prev => ({ ...prev, series: e.target.value }))}
                            className="w-full px-2.5 py-1.5 bg-black border border-zinc-805 rounded text-white text-xs focus:outline-none focus:border-red-500"
                            placeholder="Ej. APEX-MK1"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-zinc-400 font-medium">Clase / Tamaño Canónico</label>
                          <select 
                            aria-label="Clase o Tamaño Canónico"
                            className="w-full bg-zinc-900 border border-zinc-800 text-white rounded p-2 text-sm focus:border-cyan-500 outline-none"
                            value={editedShipForm.ship_size || 'Fighter'}
                            onChange={(e) => setEditedShipForm(prev => ({ ...prev, ship_size: e.target.value as any }))}
                          >
                            <option value="Fighter">Fighter</option>
                            <option value="Mighty">Mighty</option>
                            <option value="Massive">Massive</option>
                            <option value="Commander">Commander</option>
                            <option value="Mini">Mini</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs text-zinc-400 font-medium">Rol Estricto</label>
                          <select
                            aria-label="Rol Estricto"
                            className="w-full bg-zinc-900 border border-zinc-800 text-white rounded p-2 text-sm focus:border-cyan-500 outline-none"
                            value={editedShipForm.ship_role || 'Attack'}
                            onChange={(e) => setEditedShipForm(prev => ({ ...prev, ship_role: e.target.value }))}
                          >
                            <option value="Attack">Attack</option>
                            <option value="Hybrid">Hybrid</option>
                            <option value="Transport">Transport</option>
                            <option value="Explorer">Explorer</option>
                            <option value="Miner">Miner</option>
                            <option value="Defense">Defense</option>
                            <option value="Spy">Spy</option>
                            <option value="Racing">Racing</option>
                            <option value="Carrier">Carrier</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Bloque 7: Arsenal De Ataques Elementales */}
                    <div className="space-y-3 pt-2 border-t border-zinc-900">
                      <span className="text-[9px] text-zinc-550 font-bold uppercase tracking-widest block">
                        ARSENAL OFENSIVO Y DAÑO ELEMENTAL
                      </span>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-zinc-500">ATAQUE ESTÁNDAR</label>
                          <input
                            aria-label="Ataque Estándar"
                            type="number"
                            min={0}
                            value={editedShipForm.attack_standard || 0}
                            onChange={(e) => setEditedShipForm(prev => ({ ...prev, attack_standard: parseInt(e.target.value) || 0 }))}
                            className="w-full px-2.5 py-1.5 bg-black border border-zinc-805 rounded text-white text-xs font-mono text-right focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-cyan-400">ATAQUE LÁSER</label>
                          <input
                            aria-label="Ataque Láser"
                            type="number"
                            min={0}
                            value={editedShipForm.attack_laser || 0}
                            onChange={(e) => setEditedShipForm(prev => ({ ...prev, attack_laser: parseInt(e.target.value) || 0 }))}
                            className="w-full px-2.5 py-1.5 bg-black border border-zinc-805 rounded text-cyan-400 text-xs font-mono text-right focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-blue-400">ATAQUE IÓNICO</label>
                          <input
                            aria-label="Ataque Iónico"
                            type="number"
                            min={0}
                            value={editedShipForm.attack_ionic || 0}
                            onChange={(e) => setEditedShipForm(prev => ({ ...prev, attack_ionic: parseInt(e.target.value) || 0 }))}
                            className="w-full px-2.5 py-1.5 bg-black border border-zinc-805 rounded text-blue-400 text-xs font-mono text-right focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-red-400">ATAQUE PLASMA</label>
                          <input
                            aria-label="Ataque Plasma"
                            type="number"
                            min={0}
                            value={editedShipForm.attack_plasma || 0}
                            onChange={(e) => setEditedShipForm(prev => ({ ...prev, attack_plasma: parseInt(e.target.value) || 0 }))}
                            className="w-full px-2.5 py-1.5 bg-black border border-zinc-805 rounded text-red-500 text-xs font-mono text-right focus:outline-none"
                          />
                        </div>

                        <div className="col-span-2 space-y-1">
                          <label className="text-[9px] font-mono text-pink-400">ATAQUE GRAVITÓN</label>
                          <input
                            aria-label="Ataque Gravitón"
                            type="number"
                            min={0}
                            value={editedShipForm.attack_graviton || 0}
                            onChange={(e) => setEditedShipForm(prev => ({ ...prev, attack_graviton: parseInt(e.target.value) || 0 }))}
                            className="w-full px-2.5 py-1.5 bg-black border border-zinc-805 rounded text-pink-400 text-xs font-mono text-right focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bloque 8: Almacenamiento y Producción */}
                    <div className="space-y-3 pt-2 border-t border-zinc-900">
                      <span className="text-[9px] text-zinc-550 font-bold uppercase tracking-widest block">
                        CAPACIDAD OPERATIVA Y PRODUCCIÓN
                      </span>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1 col-span-2">
                          <label className="text-[9px] font-mono text-zinc-500">CAPACIDAD DE CARGA (KGs / Unidades)</label>
                          <input
                            aria-label="Capacidad de Carga"
                            type="number"
                            min={0}
                            value={editedShipForm.cargo_capacity || 0}
                            onChange={(e) => setEditedShipForm(prev => ({ ...prev, cargo_capacity: parseInt(e.target.value) || 0 }))}
                            className="w-full px-2.5 py-1.5 bg-black border border-zinc-805 rounded text-white text-xs font-mono text-right focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-zinc-500">PRODUCCIÓN MÍNIMA</label>
                          <input
                            aria-label="Producción Mínima"
                            type="number"
                            min={0}
                            value={editedShipForm.production_min || 0}
                            onChange={(e) => setEditedShipForm(prev => ({ ...prev, production_min: parseInt(e.target.value) || 0 }))}
                            className="w-full px-2.5 py-1.5 bg-black border border-zinc-805 rounded text-white text-xs font-mono text-right focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-zinc-500">PRODUCCIÓN MÁXIMA</label>
                          <input
                            aria-label="input element"type="number"
                            min={0}
                            value={editedShipForm.production_max || 0}
                            onChange={(e) => setEditedShipForm(prev => ({ ...prev, production_max: parseInt(e.target.value) || 0 }))}
                            className="w-full px-2.5 py-1.5 bg-black border border-zinc-805 rounded text-white text-xs font-mono text-right focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bloque 9: Skills Habilidades y Condiciones */}
                    <div className="space-y-3 pt-2 border-t border-zinc-900">
                      <span className="text-[9px] text-zinc-555 font-bold uppercase tracking-widest block">
                        SKILL SET Y REQUISITOS DE HABILIDAD
                      </span>
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-zinc-500 uppercase">Skill Set (Separados por coma)</label>
                          <input
                            aria-label="input element"type="text"
                            value={(editedShipForm.skills || []).join(', ')}
                            onChange={(e) => {
                              const arr = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                              setEditedShipForm(prev => ({ ...prev, skills: arr }));
                            }}
                            className="w-full px-2.5 py-1.5 bg-black border border-zinc-805 rounded text-zinc-305 text-xs focus:outline-none"
                            placeholder="Ej: Impulso Quántico, Teletransporte"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-zinc-500 uppercase">Requisitos para Habilidades (Skill Set Requirements)</label>
                          <input
                            aria-label="input element"type="text"
                            value={editedShipForm.skill_requirements || ''}
                            onChange={(e) => setEditedShipForm(prev => ({ ...prev, skill_requirements: e.target.value }))}
                            className="w-full px-2.5 py-1.5 bg-black border border-zinc-805 rounded text-white text-xs focus:outline-none"
                            placeholder="Ej: Requiere Nivel 25 CAN y Motor de Hiperespacio"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bloque 10: Registro Blockchain y Costes Directos */}
                    <div className="space-y-3 pt-2 border-t border-zinc-900">
                      <span className="text-[9px] text-red-500 font-bold uppercase tracking-widest block font-mono">
                        NATIVO BLOCKCHAIN Y REQUISITOS DE RECURSOS
                      </span>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2 space-y-1">
                          <label className="text-[9px] font-mono text-zinc-500">ID ÚNICO DE LA NAVE (BASE)</label>
                          <input
                            aria-label="ID Único de la Nave"
                            type="text"
                            value={editedShipForm.ship_id || ''}
                            onChange={(e) => setEditedShipForm(prev => ({ ...prev, ship_id: e.target.value }))}
                            disabled={!isNewShip}
                            className="w-full px-2.5 py-1.5 bg-black/40 border border-zinc-850 rounded text-zinc-400 text-xs font-mono disabled:opacity-50"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-zinc-500">ID ASSET BLOCKCHAIN</label>
                          <input
                            aria-label="input element"type="text"
                            value={editedShipForm.blockchain_asset_id || ''}
                            onChange={(e) => setEditedShipForm(prev => ({ ...prev, blockchain_asset_id: e.target.value }))}
                            className="w-full px-2.5 py-1.5 bg-black border border-zinc-805 rounded text-white text-xs font-mono"
                            placeholder="Ej. 0xSasoriApex#883"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-zinc-500">ID ASSET POSESIÓN JUGADOR</label>
                          <input
                            aria-label="input element"type="text"
                            value={editedShipForm.user_asset_id || ''}
                            onChange={(e) => setEditedShipForm(prev => ({ ...prev, user_asset_id: e.target.value }))}
                            className="w-full px-2.5 py-1.5 bg-black border border-zinc-805 rounded text-white text-xs font-mono"
                            placeholder="Ej. user_item_883"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-zinc-500">MÍNIMO METAL PROPIO (KG)</label>
                          <input
                            aria-label="input element"type="number"
                            min={0}
                            value={editedShipForm.required_metal !== undefined ? editedShipForm.required_metal : ''}
                            onChange={(e) => setEditedShipForm(prev => ({ ...prev, required_metal: e.target.value === '' ? undefined : parseInt(e.target.value) || 0 }))}
                            className="w-full px-2.5 py-1.5 bg-black border border-zinc-805 rounded text-white text-xs font-mono text-right"
                            placeholder="Calcular de Rarity"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-zinc-500">MÍNIMO CRISTAL PROPIO (u)</label>
                          <input
                            aria-label="input element"type="number"
                            min={0}
                            value={editedShipForm.required_crystal !== undefined ? editedShipForm.required_crystal : ''}
                            onChange={(e) => setEditedShipForm(prev => ({ ...prev, required_crystal: e.target.value === '' ? undefined : parseInt(e.target.value) || 0 }))}
                            className="w-full px-2.5 py-1.5 bg-black border border-zinc-805 rounded text-white text-xs font-mono text-right"
                            placeholder="Calcular de Rarity"
                          />
                        </div>
                      </div>
                    </div>

                    {/* RADAR DE ATRIBUTOS DE COMBATE Y RESISTENCIA */}
                    <div className="space-y-2 pt-2 border-t border-zinc-900">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-zinc-450 font-bold uppercase tracking-widest block font-mono">
                          CONSOLA DE COMPARATIVA TÁCTICA
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[8px] font-mono text-zinc-500 uppercase">VS</span>
                          <select
                            aria-label="Nave a comparar"
                            value={compareShipId}
                            onChange={(e) => setCompareShipId(e.target.value)}
                            className="bg-black border border-zinc-800 text-[10px] text-zinc-300 px-2 py-0.5 rounded focus:outline-none focus:border-red-500 font-mono"
                          >
                            <option value="fleet_average">Promedio de Flota</option>
                            {shipsList
                              .filter(s => s.ship_id !== editedShipForm.ship_id)
                              .map(s => (
                                <option key={s.ship_id} value={s.ship_id}>
                                  {s.ship_name}
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>
                      <div className="h-56 bg-black/60 border border-zinc-900 rounded-lg flex flex-col items-center justify-center p-1.5 overflow-hidden">
                        <ResponsiveContainer width="100%" height="90%">
                          <RadarChart 
                            cx="50%" 
                            cy="50%" 
                            outerRadius="75%" 
                            data={[
                              { subject: 'HP / Resist', Nave: Math.min(((editedShipForm.resistance || 0) / 150000) * 100, 100), Flota: Math.min(((comparisonValues.hp) / 150000) * 100, 100) },
                              { subject: 'Shield', Nave: Math.min(((editedShipForm.shield || 0) / 120000) * 100, 100), Flota: Math.min(((comparisonValues.shield) / 120000) * 100, 100) },
                              { subject: 'Defense', Nave: Math.min(((editedShipForm.defense || 0) / 450) * 100, 100), Flota: Math.min(((comparisonValues.defense) / 450) * 100, 100) },
                              { subject: 'Travel Spd', Nave: Math.min(((editedShipForm.speed_boost || 0) / 1200) * 100, 100), Flota: Math.min(((comparisonValues.travel_speed) / 1200) * 100, 100) },
                              { subject: 'Combat Spd', Nave: Math.min(((editedShipForm.combat_speed || 200) / 450) * 100, 100), Flota: Math.min(((comparisonValues.combat_speed) / 450) * 100, 100) },
                              { subject: 'Std Attack', Nave: Math.min(((editedShipForm.attack_standard || 0) / 5500) * 100, 100), Flota: Math.min(((comparisonValues.attack) / 5500) * 100, 100) },
                            ]}
                          >
                            <PolarGrid stroke="#27272a" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#71717a', fontSize: 8, fontFamily: 'monospace' }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                            <Radar 
                              name="Esta Nave" 
                              dataKey="Nave" 
                              stroke="#dc2626" 
                              fill="#dc2626" 
                              fillOpacity={0.3} 
                            />
                            <Radar 
                              name={comparisonValues.name} 
                              dataKey="Flota" 
                              stroke="#06b6d4" 
                              fill="#0891b2" 
                              strokeDasharray="3 3"
                              fillOpacity={0.15}
                            />
                            <Legend verticalAlign="bottom" height={24} iconSize={8} wrapperStyle={{ fontSize: '9px', fontFamily: 'monospace', color: '#a1a1aa' }} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* RECURSOS ESTIMADOS DE FABRICACIÓN SEGÚN PLANOS O BLUEPRINTS */}
                    <div className="space-y-2 pt-2 border-t border-zinc-900">
                      <div className="flex justify-between items-center text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-bold">
                        <span>SIMULADOR DE RECURSOS REQUERIDOS</span>
                        <span className="text-red-500 font-bold">{simulatedBlueprintCount} u</span>
                      </div>
                      
                      <div className="bg-zinc-900/50 hover:bg-zinc-900/80 p-3 rounded-lg border border-zinc-900 space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-zinc-400">Requisitos de Blueprints:</span>
                          <span className="text-xs text-white font-bold bg-black px-1.5 py-0.5 border border-zinc-800 rounded">
                            {simulatedBlueprintCount} u
                          </span>
                        </div>
                        
                        <input
                          aria-label="input element"type="range"
                          min="1"
                          max="250"
                          value={simulatedBlueprintCount}
                          onChange={(e) => setSimulatedBlueprintCount(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full accent-red-650 h-1 bg-zinc-850 rounded-lg cursor-pointer"
                        />

                        {/* Calculated material costs */}
                        <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[10px]">
                          <div className="bg-black/60 p-1.5 rounded border border-zinc-900">
                            <span className="text-[7.5px] text-zinc-500 uppercase block font-semibold font-mono">METAL REQ ({globalMetalMultiplier}x)</span>
                            <span className="text-white font-bold block mt-0.5">
                              {Math.round(
                                simulatedBlueprintCount * 
                                (editedShipForm.required_metal !== undefined ? editedShipForm.required_metal :
                                 editedShipForm.rarity === 'Legendary' ? 120000 :
                                 editedShipForm.rarity === 'Phantom' ? 180000 :
                                 editedShipForm.rarity === 'Xmas' ? 90000 :
                                 editedShipForm.rarity === 'Epic' ? 55000 :
                                 editedShipForm.rarity === 'Rare' ? 25000 :
                                 editedShipForm.rarity === 'Uncommon' ? 12000 : 5000) * 
                                globalMetalMultiplier
                              ).toLocaleString()} Kg
                            </span>
                          </div>

                          <div className="bg-black/60 p-1.5 rounded border border-zinc-900">
                            <span className="text-[7.5px] text-zinc-500 uppercase block font-semibold font-mono">CRISTAL REQ ({globalCrystalMultiplier}x)</span>
                            <span className="text-cyan-400 font-bold block mt-0.5">
                              {Math.round(
                                simulatedBlueprintCount * 
                                (editedShipForm.required_crystal !== undefined ? editedShipForm.required_crystal :
                                 editedShipForm.rarity === 'Legendary' ? 75000 :
                                 editedShipForm.rarity === 'Phantom' ? 110000 :
                                 editedShipForm.rarity === 'Xmas' ? 55000 :
                                 editedShipForm.rarity === 'Epic' ? 35000 :
                                 editedShipForm.rarity === 'Rare' ? 15000 :
                                 editedShipForm.rarity === 'Uncommon' ? 8000 : 3000) * 
                                globalCrystalMultiplier
                              ).toLocaleString()} u
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Execution buttons */}
                    <div className="pt-3 border-t border-zinc-900 space-y-2">
                      <button
                        onClick={() => setShowSandboxModal(true)}
                        className="w-full py-2 bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/50 text-emerald-400 font-bold uppercase text-[10px] tracking-wider rounded transition-colors flex items-center justify-center gap-2 cursor-pointer mb-2"
                      >
                        <Shield size={13} /> TESTEAR EN COMBAT SANDBOX
                      </button>

                      <button
                        onClick={handleSaveShipKernel}
                        className="w-full py-2 bg-red-650 hover:bg-red-500 text-white font-bold uppercase text-[10px] tracking-wider rounded transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Save size={13} /> GUARDAR CAMBIOS EN EL KERNEL
                      </button>

                      <div className="grid grid-cols-2 gap-2">
                        {!isNewShip && (
                          <>
                            <button
                              onClick={handleCloneShipKernel}
                              className="py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 text-zinc-300 hover:text-white font-bold uppercase text-[9px] rounded flex items-center justify-center gap-1 cursor-pointer transition-colors"
                            >
                              <Copy size={11} /> CLONAR MATRIZ
                            </button>

                            <button
                              onClick={() => handleTriggerDeleteShip(editedShipForm.ship_id!)}
                              className="py-1.5 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 text-red-500 font-bold uppercase text-[9px] rounded flex items-center justify-center gap-1 cursor-pointer transition-colors"
                            >
                              <Trash2 size={11} /> ELIMINAR ASSET
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                  </div>
                )}
              </div>
            </div>

          </motion.div>
        )}

        {/* SUBPESTAÑA 2: REGISTRO DE HANGAR (AUDITORÍA JUGADOR) */}
        {activeTab === 'hangar' && (
          <motion.div
            key="hangar_section"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            
            {/* CONSOLA DE ENLACE DE CLIENTE / BUSCADOR */}
            <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-lg space-y-4">
              <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-widest block">
                👥 ENLAZAR AUDITORÍA DE HANGAR GENERAL (SOPORTE JUGADORES)
              </span>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  aria-label="input element"type="text"
                  placeholder="Ingrese UID de cuenta, Correo o dApp Wallet del comandante..."
                  value={playerSearchQuery}
                  onChange={(e) => setPlayerSearchQuery(e.target.value)}
                  className="flex-1 px-3 py-2 bg-zinc-900/60 border border-zinc-850 rounded text-xs text-white placeholder-zinc-750 font-mono focus:border-red-500 focus:outline-none transition-colors"
                />
                
                <button
                  onClick={handleSincroHangarPlayer}
                  className="px-5 py-2 bg-red-650 hover:bg-red-500 text-white font-bold text-[10.5px] uppercase tracking-wider rounded transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-95"
                >
                  <RefreshCw size={13} className="animate-spin" />
                  SINCRO_HANGAR_PLAYER
                </button>
              </div>

              {auditedUser && (
                <div className="p-3 bg-black/40 border border-zinc-900 rounded flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-red-650/15 border border-red-500/20 text-red-500 rounded font-mono font-bold text-[10.5px]">
                      PILOTO_LINK
                    </div>
                    <div>
                      <span className="text-white font-bold font-mono">{auditedUser.username}</span>
                      <span className="text-zinc-500 block text-[10px]">{auditedUser.email} • ID: {auditedUser.id}</span>
                    </div>
                  </div>

                  <div className="flex gap-4 font-mono text-zinc-400">
                    <div>Nivel C.A.N: <span className="text-white font-bold">{auditedUser.level}</span></div>
                    <div>Estatus: <span className="text-emerald-400 font-bold uppercase">{auditedUser.status}</span></div>
                  </div>
                </div>
              )}
            </div>

            {/* GRÁFICO DE DISPERSIÓN: RELACIÓN NIVEL VS POTENCIA DE COMBATE */}
            {userHangarList.length > 0 && (
              <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-lg space-y-4">
                <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-widest block border-b border-zinc-900 pb-2">
                  📊 DIAGRAMA DE DISPERSIÓN DE FLOTA: RELACIÓN NIVEL VS POTENCIA DE COMBATE (POWER SCORE)
                </span>
                
                <div className="h-60 bg-black/60 border border-zinc-900 rounded-lg p-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart
                      margin={{ top: 10, right: 20, bottom: 5, left: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis 
                        type="number" 
                        dataKey="level" 
                        name="Nivel" 
                        unit=" lvl" 
                        stroke="#71717a"
                        tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }}
                      />
                      <YAxis 
                        type="number" 
                        dataKey="powerScore" 
                        name="Power Score" 
                        unit=" pts" 
                        stroke="#71717a"
                        tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }}
                      />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-zinc-950 border border-zinc-900 p-2.5 rounded-md shadow-2xl font-mono text-xs text-zinc-300">
                                <p className="font-bold text-red-500 uppercase">{data.name}</p>
                                <p className="text-white mt-1">Nivel: <span className="font-semibold text-zinc-400">{data.level}</span></p>
                                <p className="text-white">Estrellas: <span className="font-semibold text-yellow-500">{"★".repeat(data.stars)}</span></p>
                                <p className="text-white">Power Score: <span className="font-bold text-red-400">{data.powerScore.toLocaleString()} pts</span></p>
                                <p className="text-zinc-500 mt-0.5 text-[10px]">Estatus: <span className="text-emerald-400 font-bold">{data.flightState}</span></p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Scatter 
                        name="Flota" 
                        data={userHangarList.map(ship => {
                          const baseSeed = shipsList.find(s => s.ship_id === ship.shipId);
                          const basePower = baseSeed ? ((baseSeed.damage_factor || 1) * 2000 + (baseSeed.resistance || 5000) / 20) : 3000;
                          const powerScore = Math.round(ship.level * 150 + ship.stars * 800 + basePower);
                          return {
                            name: ship.name,
                            level: ship.level,
                            powerScore: powerScore,
                            stars: ship.stars,
                            flightState: ship.flightState
                          };
                        })} 
                        fill="#dc2626" 
                      />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* LIVE HANGAR MANAGER TABLE */}
            <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-lg space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-zinc-900 pb-2 gap-2">
                <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-widest">
                  🛸 MATRIZ DE GESTIÓN DE FLOTA ACTIVA DEL USUARIO
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleExportHangarReportJSON}
                    className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 font-mono font-bold text-[9px] uppercase tracking-wider rounded transition-colors flex items-center gap-1 cursor-pointer active:scale-95"
                  >
                    <Download size={11} /> EXPORTAR JSON
                  </button>
                  <button
                    onClick={handleExportHangarReportCSV}
                    className="px-2.5 py-1 bg-red-650 hover:bg-red-500 text-white font-mono font-bold text-[9px] uppercase tracking-wider rounded transition-colors flex items-center gap-1 cursor-pointer active:scale-95"
                  >
                    <Download size={11} /> EXPORTAR CSV
                  </button>
                </div>
              </div>

              {userHangarList.length === 0 ? (
                <div className="p-12 text-center text-zinc-550 italic leading-relaxed">
                  El hangar asociado a este comandante se encuentra vacío en su perfil de base de datos. Use el panel inferior para inyectar una nave.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-zinc-300">
                    <thead>
                      <tr className="border-b border-zinc-900 text-zinc-500 text-[10px] font-mono uppercase tracking-wider">
                        <th className="pb-3 text-left">Plano / Nave Sideral</th>
                        <th className="pb-3 text-center">Nivel</th>
                        <th className="pb-3 text-center">Fragmentos (Plano)</th>
                        <th className="pb-3 text-center">Rango (Estrellas)</th>
                        <th className="pb-3 text-center">Estado de Viaje de Go</th>
                        <th className="pb-3 text-right">Comandos de Soporte</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900 font-sans">
                      {userHangarList.map((ship) => (
                        <tr key={ship.userShipId} className="hover:bg-zinc-900/10 transition-colors">
                          
                          {/* Ship Profile */}
                          <td className="py-3">
                            <div>
                              <span className="font-bold text-white block truncate max-w-[180px]">{ship.name}</span>
                              <span className="text-[9px] text-zinc-550 font-mono">ID: {ship.shipId.slice(0, 15)}...</span>
                            </div>
                          </td>

                          {/* Training level input direct editable */}
                          <td className="py-3 text-center">
                            <input
                              aria-label="input element"type="number"
                              min={1}
                              max={100}
                              value={ship.level}
                              onChange={(e) => handleUpdateHangarCell(ship.userShipId, 'level', parseInt(e.target.value) || 1)}
                              className="w-16 px-1.5 py-1 bg-black border border-zinc-850 rounded text-center font-mono focus:outline-none focus:border-red-500 text-white font-bold"
                            />
                          </td>

                          {/* Blueprints count */}
                          <td className="py-3 text-center">
                            <div className="flex items-center gap-1 justify-center">
                              <input
                                aria-label="input element"type="number"
                                min={0}
                                value={ship.blueprintsOwned}
                                onChange={(e) => handleUpdateHangarCell(ship.userShipId, 'blueprintsOwned', parseInt(e.target.value) || 0)}
                                className="w-16 px-1.5 py-1 bg-black border border-zinc-850 rounded text-center font-mono focus:outline-none focus:border-red-500 text-white font-bold"
                              />
                              <span className="text-zinc-650 font-mono text-[10.5px]">/ {ship.blueprintsRequired}</span>
                            </div>
                          </td>

                          {/* Level stars count (1-7 range selector click or numeric) */}
                          <td className="py-3 text-center">
                            <select
                              aria-label="select element"value={ship.stars}
                              onChange={(e) => handleUpdateHangarCell(ship.userShipId, 'stars', parseInt(e.target.value) || 1)}
                              className="bg-black border border-zinc-850 rounded px-1.5 py-1 font-mono text-yellow-500 font-bold focus:outline-none focus:border-red-500 text-xs text-center cursor-pointer"
                            >
                              <option value="1">⭐ 1</option>
                              <option value="2">⭐⭐ 2</option>
                              <option value="3">⭐⭐⭐ 3</option>
                              <option value="4">⭐⭐⭐⭐ 4</option>
                              <option value="5">⭐⭐⭐⭐⭐ 5</option>
                              <option value="6">⭐⭐⭐⭐⭐⭐ 6</option>
                              <option value="7">👑 7 Estrellas</option>
                            </select>
                          </td>

                          {/* Flight status */}
                          <td className="py-3 text-center">
                            <div className="inline-block">
                              <span className={`px-2 py-0.5 rounded text-[9.5px] font-mono font-bold tracking-wider ${
                                ship.flightState === 'SAFE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' :
                                ship.flightState === 'TRANSITING' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/10' :
                                'bg-red-500/10 text-red-500 border border-red-500/10 animate-pulse'
                              }`}>
                                {ship.flightState}
                              </span>
                              
                              {ship.flightState === 'INFINITE_LOCK' && (
                                <p className="text-[8px] text-red-500 mt-1 max-w-[140px] leading-tight text-center mx-auto truncate" title={ship.lastLog}>
                                  Go Server Stuck!
                                </p>
                              )}
                            </div>
                          </td>

                          {/* Action Button supports */}
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5 font-mono text-[9px]">
                              {ship.flightState === 'INFINITE_LOCK' ? (
                                <button
                                  onClick={() => handleForceAnchorSupport(ship.userShipId)}
                                  className="px-2.5 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold uppercase rounded cursor-pointer transition-colors flex items-center gap-1"
                                >
                                  🚨 FORZAR ANCLAJE
                                </button>
                              ) : (
                                <span className="text-[8px] text-zinc-550 border border-zinc-900 p-1 rounded font-normal italic mr-1">Estatus Seguro</span>
                              )}

                              <button
                                onClick={() => handleDeleteShipFromHangar(ship.userShipId)}
                                className="p-1 bg-zinc-900 border border-zinc-850 hover:bg-red-950/20 text-zinc-500 hover:text-red-500 rounded transition-colors"
                                title="Desmantelar nave"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* MÓDULO INFERIOR DE INYECCIÓN GENERAL */}
            <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-widest block">
                  🚀 INYECTOR DIRECTO DE FLOTA AL JUGADOR (CONSOLA MILITAR)
                </span>
                <p className="text-xs text-zinc-500 font-sans leading-relaxed">
                  Permite inyectar cualquier nave en nivel 1 directo al inventario relacional del comandante auditado sin consumir materiales ni planos del juego, ideal para entrega de soporte directo de dApps.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 items-end justify-end">
                <div className="w-full sm:flex-1 space-y-1">
                  <label className="text-[9px] font-mono text-zinc-500 uppercase">Seleccione nave base del Catálogo Kernel</label>
                  <select
                    aria-label="select element"value={selectedShipIdToInject}
                    onChange={(e) => setSelectedShipIdToInject(e.target.value)}
                    className="w-full bg-black border border-zinc-850 rounded p-2 text-xs text-white focus:outline-none focus:border-red-500 cursor-pointer font-mono"
                  >
                    {shipsList.map(s => (
                      <option key={s.ship_id} value={s.ship_id}>
                        {s.ship_name} ({s.rarity} - Lvl Req: {s.can_level_required})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleInjectNewShipToHangar}
                  className="w-full sm:w-auto px-5 py-2.5 bg-red-650 hover:bg-red-500 text-white font-bold text-[10px] uppercase font-mono tracking-wider rounded transition-colors cursor-pointer"
                >
                  INYECTAR NAVE AL JUGADOR
                </button>
              </div>
            </div>

          </motion.div>
        )}

        {/* SUBPESTAÑA 3: REGLAS DE FABRICACIÓN (MULTIPLICADORES GLOBALES) */}
        {activeTab === 'fabricacion' && (
          <motion.div
            key="fabricacion_section"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            {/* CONFIGURATION PANEL */}
            <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-lg space-y-4 font-sans">
              <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-widest block border-b border-zinc-900 pb-2">
                ⚙️ CONTROL GLOBAL DE MULTIPLICADORES DE MATERIALES (FABRICACIÓN)
              </span>
              <p className="text-xs text-zinc-400">
                Ajuste el factor de escala global para el consumo de metal y cristal empleado en la dApp para la fundición de naves y reabastecimiento en el Taller Estelar.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-zinc-900/40 p-3 rounded-lg border border-zinc-900 space-y-2 font-mono">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-400">Multiplicador de Metal:</span>
                    <span className="text-red-500 font-bold">{globalMetalMultiplier.toFixed(2)}x</span>
                  </div>
                  <input
                    aria-label="input element"type="range"
                    min="0.5"
                    max="5"
                    step="0.05"
                    value={globalMetalMultiplier}
                    onChange={(e) => setGlobalMetalMultiplier(parseFloat(e.target.value) || 1.0)}
                    className="w-full accent-red-650 h-1 bg-zinc-850 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-zinc-650">
                    <span>Ahorro (0.5x)</span>
                    <span>Hiper-Metal (5.0x)</span>
                  </div>
                </div>

                <div className="bg-zinc-900/40 p-3 rounded-lg border border-zinc-900 space-y-2 font-mono">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-400">Multiplicador de Cristal:</span>
                    <span className="text-cyan-400 font-bold">{globalCrystalMultiplier.toFixed(2)}x</span>
                  </div>
                  <input
                    aria-label="input element"type="range"
                    min="0.5"
                    max="5"
                    step="0.05"
                    value={globalCrystalMultiplier}
                    onChange={(e) => setGlobalCrystalMultiplier(parseFloat(e.target.value) || 1.0)}
                    className="w-full accent-cyan-500 h-1 bg-zinc-850 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-zinc-650">
                    <span>Ahorro (0.5x)</span>
                    <span>Hiper-Cristal (5.0x)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SIMULATED IMPACT TABLE */}
            <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-lg space-y-4">
              <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-widest block border-b border-zinc-900 pb-2">
                🔮 IMPACTO ESTIMADO DE CONSTRUCCIÓN POR RAREZA DEL KERNEL
              </span>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead>
                    <tr className="border-b border-zinc-900 text-zinc-500 text-[10px] font-mono uppercase">
                      <th className="pb-3 text-left">Rareza Clave</th>
                      <th className="pb-3 text-center">Material Requerido Promedio (Base)</th>
                      <th className="pb-3 text-center">Metal Escalado (Con Multiplicador)</th>
                      <th className="pb-3 text-center">Cristal Escalado (Con Multiplicador)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900 font-mono text-[11px]">
                    {[
                      { rarity: 'Common', metal: 5000, crystal: 3000 },
                      { rarity: 'Uncommon', metal: 12000, crystal: 8000 },
                      { rarity: 'Rare', metal: 25000, crystal: 15000 },
                      { rarity: 'Epic', metal: 55000, crystal: 35000 },
                      { rarity: 'Legendary', metal: 120000, crystal: 75000 },
                      { rarity: 'Phantom', metal: 180000, crystal: 110000 },
                      { rarity: 'Xmas', metal: 90000, crystal: 55000 },
                    ].map((row) => (
                      <tr key={row.rarity} className="hover:bg-zinc-900/10">
                        <td className="py-2.5 text-white font-bold">{row.rarity}</td>
                        <td className="py-2.5 text-center text-zinc-500">{row.metal.toLocaleString()} Kg / {row.crystal.toLocaleString()} u</td>
                        <td className="py-2.5 text-center text-red-400 font-semibold">{Math.round(row.metal * globalMetalMultiplier).toLocaleString()} Kg</td>
                        <td className="py-2.5 text-center text-cyan-400 font-semibold">{Math.round(row.crystal * globalCrystalMultiplier).toLocaleString()} u</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* SUBPESTAÑA 4: BITÁCORA DE AUDITORÍA GLOBAL */}
        {activeTab === 'bitacora' && (
          <motion.div
            key="bitacora_section"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            <div className="audit-log-viewer p-4 bg-zinc-950 border border-zinc-900 rounded-lg space-y-4 font-sans col-span-1">
              <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
                <div className="flex items-center gap-2">
                  <HardDrive size={18} className="text-red-500" />
                  <div>
                    <span className="text-xs font-mono font-bold text-white uppercase tracking-widest block">
                      Bitácora de Seguridad del Sistema dApp (Audit Logs)
                    </span>
                    <span className="text-[10px] text-zinc-550 block font-mono mt-0.5">
                      Monitorea modificaciones directas en tiempo real de naves, estructuras y tecnologías para coherencia criptográfica de Sasorilabs.
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={downloadAuditLogsCSV}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white border border-red-500 text-[10.5px] font-mono rounded cursor-pointer transition-all uppercase tracking-wider font-extrabold shadow-lg shadow-red-600/10"
                  >
                    <Download size={11} className="shrink-0" />
                    CSV
                  </button>
                  <button
                    onClick={() => {
                      localStorage.removeItem('saso_audit_logs');
                      setAuditLogs([
                        {
                          id: "log-init-ship",
                          timestamp: new Date().toISOString(),
                          action: "INITIALIZE",
                          entity_type: "SHIP_DAPP",
                          entity_id: "SYSTEM",
                          details: "Reset de bitácoras ejecutado de forma manual."
                        }
                      ]);
                    }}
                    className="px-2.5 py-1.5 bg-red-950/20 hover:bg-red-650 text-red-500 hover:text-white border border-red-950 text-[10.5px] font-mono rounded cursor-pointer transition-colors"
                  >
                    LIMPIAR BITÁCORAS
                  </button>
                </div>
              </div>

              {/* LOG ENTRIES MAIN SHELL CONTAINER */}
              <div className="bg-black/80 border border-zinc-900 rounded-lg p-3 font-mono text-[11px] h-[500px] overflow-y-auto space-y-2">
                {auditLogs.length === 0 ? (
                  <p className="text-zinc-650 text-center py-10 italic">Sin registros de auditorías síncronas en esta dApp.</p>
                ) : (
                  auditLogs.map((log) => (
                    <div key={log.id} className="p-2.5 bg-zinc-950 border border-zinc-900/60 rounded flex flex-col md:flex-row gap-3 md:items-center text-xs justify-between hover:border-zinc-850 transition-colors">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            log.action === 'CREATE' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900' :
                            log.action === 'UPDATE' ? 'bg-amber-950/40 text-amber-400 border border-amber-900' :
                            log.action === 'DELETE' ? 'bg-red-950/40 text-red-400 border border-red-900' :
                            log.action === 'BULK_UPDATE' ? 'bg-cyan-950 text-cyan-400 border border-cyan-900' :
                            'bg-zinc-900 text-zinc-400'
                          }`}>
                            {log.action}
                          </span>
                          <span className="text-zinc-500 font-mono text-[10px]">
                            [{new Date(log.timestamp).toLocaleTimeString()}]
                          </span>
                          <span className="text-zinc-400 font-bold font-sans">
                            {log.entity_type} : <span className="text-purple-400 font-mono">{log.entity_id}</span>
                          </span>
                        </div>
                        <p className="text-zinc-300 font-sans mt-1 leading-relaxed">
                          {log.details}
                        </p>
                      </div>
                      <span className="text-[9.5px] text-zinc-650 shrink-0 select-all font-mono">
                        ID: {log.id}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* CONFIRMATION DIALOG MODAL (DOUBLE HANDSHAKE CHECK) */}
      <AnimatePresence>
        {isDeleteConfirmOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-950 border border-zinc-800 p-6 rounded-lg max-w-md w-full space-y-4"
            >
              <div className="flex items-center gap-3 text-red-500">
                <AlertTriangle size={24} className="animate-bounce" />
                <h3 className="text-base font-bold font-mono uppercase tracking-wider">¡Doble Confirmación Crítica!</h3>
              </div>
              
              <p className="text-xs text-zinc-400 leading-normal">
                Esta acción eliminará de forma irreversible el plano estallado del kernel de datos maestro en Supabase. Las cuentas de los jugadores perderán la capacidad de construir o volar esta nave inmediatamente si persisten.
              </p>

              <div className="p-3 bg-red-500/5 border border-red-500/10 rounded text-[10.5px] font-mono text-zinc-500 leading-normal">
                <span className="text-white block font-bold mb-1">REGISTRO DE IMPACTO:</span>
                • Tabla: seed_ships <br />
                • ID: {shipIdToDelete}
              </div>

              <div className="flex items-center justify-end gap-3 font-mono text-[10px]">
                <button
                  onClick={() => setIsDeleteConfirmOpen(false)}
                  className="px-4 py-2 bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-zinc-400 rounded"
                >
                  ABORTAR OPERACIÓN
                </button>
                <button
                  onClick={handleConfirmDeleteShip}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded"
                >
                  CONFIRMAR BORRADO COLOIDE
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {activeTab === 'sandbox' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <CombatSandboxTester />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSandboxModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <div className="relative w-full max-w-5xl max-h-screen overflow-y-auto bg-gray-900 rounded-xl border border-emerald-500/30">
              <button 
                onClick={() => setShowSandboxModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white p-2 z-10"
              >
                <X size={20} />
              </button>
              <CombatSandboxOverlay ship={editedShipForm as ShipSeed} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
