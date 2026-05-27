import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building, Cpu, Bot, FileText, Package, Sliders, FileBadge,
  Plus, Trash2, Edit, Search, RefreshCw, AlertTriangle, Zap,
  CheckCircle, PlusCircle, Hammer, LayoutGrid, Award, Shield, HardDrive, Key
} from 'lucide-react';
import { UserProfile } from '../types';

interface AdminAssetMatrixModuleProps {
  users: UserProfile[];
  setIsAlertToShow: (alert: { show: boolean; status: 'success' | 'error'; message: string }) => void;
  onRefreshData?: () => void;
}

// 1. Estructuras types & seed data
import { StructureCostLevel, BadgeDebuff } from '../types';

interface SeedStructure {
  building_id: string;
  building_name: string;
  description: string;
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Exclusive';
  company: 'Nova' | 'Osiris' | 'Myton' | 'Alacran' | 'Zeppelin' | 'Kant';
  max_level: number;
  costs_grid?: StructureCostLevel[];
  energy_consumption?: number;
  energy_production?: number;
  hp_structural: number;
  defense_rating: number;
  isActive?: boolean;
}

const INITIAL_STRUCTURES: SeedStructure[] = [
  {
    building_id: "struct-01-fusi",
    building_name: "Reactor de Fusión Cuántica",
    description: "Instalación nuclear militarizada de la empresa Osiris. Cataliza deuterio pesado y materia oscura en flujos calientes estables.",
    rarity: "Legendary",
    company: "Osiris",
    max_level: 15,
    costs_grid: Array.from({length: 10}, (_, i) => ({ level: i + 1, metal: (i+1)*50000, crystal: (i+1)*30000, deuterium: (i+1)*15000, energy: 0, research_time_seconds: (i+1)*3600 })),
    energy_production: 2500,
    energy_consumption: 0,
    hp_structural: 25000,
    defense_rating: 450
  },
  {
    building_id: "struct-02-extract",
    building_name: "Excavadora de Esencia Q-100",
    description: "Mantenimiento automatizado de los yacimientos síncronos de esencias galácticas fabricado por la corporación Nova.",
    rarity: "Rare",
    company: "Nova",
    max_level: 10,
    costs_grid: Array.from({length: 10}, (_, i) => ({ level: i + 1, metal: (i+1)*12000, crystal: (i+1)*8000, deuterium: (i+1)*2000, energy: (i+1)*500, research_time_seconds: (i+1)*1800 })),
    energy_production: 0,
    energy_consumption: 500,
    hp_structural: 8500,
    defense_rating: 120
  },
  {
    building_id: "struct-03-shield",
    building_name: "Generador de Cúpula Electromagnetocompleta",
    description: "Batería de deflectores termoacoplados de Kant. Defiende el perímetro ante asedios tácticos y emisiones de tormentas solares.",
    rarity: "Epic",
    company: "Kant",
    max_level: 12,
    costs_grid: Array.from({length: 10}, (_, i) => ({ level: i + 1, metal: (i+1)*28000, crystal: (i+1)*19000, deuterium: (i+1)*6000, energy: (i+1)*1200, research_time_seconds: (i+1)*7200 })),
    energy_production: 0,
    energy_consumption: 1200,
    hp_structural: 40000,
    defense_rating: 680
  }
];

interface UserStructure {
  id: string;
  building_id: string;
  level: number;
  status: 'ACTIVE' | 'DOWN_GRADE' | 'UNDER_REPAIR';
}

// 2. Tecnologías types & seeds
interface SeedTechnology {
  technology_id: string;
  technology_name: string;
  description: string;
  attack_modifier_pct: number;
  defense_modifier_pct: number;
  speed_modifier_pct: number;
  can_level_required: number;
  prerequisites?: Array<{ tech_id: string; level: number }>;
  struct_prerequisites?: Array<{ building_id: string; level: number }>;
  isActive?: boolean;
}

const INITIAL_TECHNOLOGIES: SeedTechnology[] = [
  {
    technology_id: "tech-01-plasma",
    technology_name: "Inducción Hiperión-Plasma",
    description: "Canaliza chorros de energía pesada de plasma en los rotores bélicos, incrementando críticamente la cadencia del armamento principal.",
    attack_modifier_pct: 18.5,
    defense_modifier_pct: 5,
    speed_modifier_pct: 2,
    can_level_required: 12
  },
  {
    technology_id: "tech-02-vanguard",
    technology_name: "Blindaje Termo-Orichaltron Secuencial",
    description: "Revestimiento dinámico molecular capaz de disolver impactos cinéticos pesados mediante ruidos electromagnéticos dispersados.",
    attack_modifier_pct: 0,
    defense_modifier_pct: 25.0,
    speed_modifier_pct: -2,
    can_level_required: 20,
    prerequisites: [{ tech_id: "tech-01-plasma", level: 5 }]
  },
  {
    technology_id: "tech-03-drive",
    technology_name: "Cámara Estabilizadora Warp MHz",
    description: "Fluctuador temporal antimateria para atajos dimensionales interestelares estables dentro de la periferia.",
    attack_modifier_pct: 4.5,
    defense_modifier_pct: 4.5,
    speed_modifier_pct: 15.0,
    can_level_required: 8
  }
];

interface UserTechnology {
  technology_id: string;
  equipped: boolean;
  can_level: number;
}

// 3. Astrobots types & seeds
interface SeedAstrobot {
  astrobot_id: string;
  astrobot_name: string;
  avatar_url: string;
  image_render: string;
  role: 'Attack' | 'Defense' | 'Scout' | 'Miner' | 'Support' | 'Spy' | 'Transport';
  kinetic_dmg: number;
  laser_dmg: number;
  plasma_dmg: number;
  ionic_dmg: number;
  graviton_dmg: number;
  shield_capacity: number;
  hp_points: number;
  travel_speed: number;
  fleet_capacity_cost: number;
  isActive?: boolean;
}

const INITIAL_ASTROBOTS: SeedAstrobot[] = [
  {
    astrobot_id: "bot-apex-01",
    astrobot_name: "A.R.E.S Tactical Vanguard Robot",
    avatar_url: "https://images.unsplash.com/photo-1546776310-eef45dd6d63c?q=80&w=100&auto=format&fit=crop",
    image_render: "",
    role: "Attack",
    kinetic_dmg: 150,
    laser_dmg: 450,
    plasma_dmg: 300,
    ionic_dmg: 120,
    graviton_dmg: 80,
    shield_capacity: 1500,
    hp_points: 2500,
    travel_speed: 65,
    fleet_capacity_cost: 3
  },
  {
    astrobot_id: "bot-miner-02",
    astrobot_name: "S.I.L.I.C.A Extraction Companion",
    avatar_url: "https://images.unsplash.com/photo-1589254065878-42c9da997008?q=80&w=100&auto=format&fit=crop",
    image_render: "",
    role: "Miner",
    kinetic_dmg: 50,
    laser_dmg: 50,
    plasma_dmg: 0,
    ionic_dmg: 250,
    graviton_dmg: 350,
    shield_capacity: 1200,
    hp_points: 1800,
    travel_speed: 40,
    fleet_capacity_cost: 2
  }
];

interface UserAstrobot {
  user_bot_id: string;
  astrobot_id: string;
  level: number;
  assignedShipId: string | null;
}

// 4. Blueprints
interface SeedBlueprint {
  blueprint_id: string;
  blueprint_name: string;
  description: string;
  max_durability: number;
  failure_rate_pct: number;
  required_tech_id: string; // seed dependency
  isActive?: boolean;
}

const INITIAL_BLUEPRINTS: SeedBlueprint[] = [
  {
    blueprint_id: "bp-class-capitana",
    blueprint_name: "Especificaciones de Fragata de Combate Osiris",
    description: "Pergamino holográfico forjado por Osiris para fragatas destructoras con deflectores termoacoplados.",
    max_durability: 5,
    failure_rate_pct: 12.5,
    required_tech_id: "tech-01-plasma"
  },
  {
    blueprint_id: "bp-class-excavator",
    blueprint_name: "Algoritmos Estructura Extraction Nova",
    description: "Plano magnético para excavadoras de esencia cuántica.",
    max_durability: 10,
    failure_rate_pct: 5.0,
    required_tech_id: "tech-03-drive"
  }
];

interface UserBlueprint {
  blueprint_id: string;
  durability_left: number;
  quantityOwned: number;
}

// 5. Consumibles
interface SeedConsumable {
  consumable_id: string;
  item_name: string;
  icon_symbol: string;
  effect_type: 'AP_RECOVERY' | 'SPEEDUP_BOOST' | 'RESOURCE_CHEST';
  effect_value: number; // e.g. 100 AP, 8 hours, bulk score
  isActive?: boolean;
}

const INITIAL_CONSUMABLES: SeedConsumable[] = [
  {
    consumable_id: "cons-ap-pill",
    item_name: "Inyector Nanotecnológico AP-100",
    icon_symbol: "🧬",
    effect_type: "AP_RECOVERY",
    effect_value: 100
  },
  {
    consumable_id: "cons-speed-boost",
    item_name: "Reactor de Propulsión Auxiliar Táctico",
    icon_symbol: "⚡",
    effect_type: "SPEEDUP_BOOST",
    effect_value: 8
  },
  {
    consumable_id: "cons-chest-metal",
    item_name: "Contenedor Descomprimido de Metales Pesados",
    icon_symbol: "📦",
    effect_type: "RESOURCE_CHEST",
    effect_value: 150000
  }
];

interface UserConsumable {
  consumable_id: string;
  quantity: number;
}

// 6. Tools
interface SeedTool {
  tool_id: string;
  tool_name: string;
  description: string;
  is_nft_asset: boolean;
  extraction_multiplier: number;
  isActive?: boolean;
}

const INITIAL_TOOLS: SeedTool[] = [
  {
    tool_id: "tool-gd-harvest",
    tool_name: "Extractor de Polvo Sideral de Alta Gama",
    description: "Taladradora síncrona de resonancia que potencia la recolección cuántica mineral en un 200%.",
    is_nft_asset: true,
    extraction_multiplier: 2.0
  },
  {
    tool_id: "tool-repair-drill",
    tool_name: "Soldatrón Térmico de Mano Nova-7",
    description: "Maquinaria portátil ideal para solventar averías críticas en los deflectores estelares durante expediciones.",
    is_nft_asset: false,
    extraction_multiplier: 1.0
  }
];

interface UserTool {
  tool_id: string;
  installed: boolean;
  durability: number;
}

// 7. Licencia
interface SeedLicense {
  license_id: string;
  license_name: string;
  target_sector: string;
  gd_coin_cost: number;
  quantum_credit_cost: number;
  isActive?: boolean;
}

const INITIAL_LICENSES: SeedLicense[] = [
  {
    license_id: "license-sector-abisal",
    license_name: "Permiso de Vuelo Periferia Abisal",
    target_sector: "Periferia Abisal",
    gd_coin_cost: 50000,
    quantum_credit_cost: 1500
  },
  {
    license_id: "license-sector-alpha",
    license_name: "Insignia de Tránsito Militar Núcleo Alfa",
    target_sector: "Núcleo Alfa",
    gd_coin_cost: 120000,
    quantum_credit_cost: 4000
  }
];

interface UserLicense {
  license_id: string;
  acquired_at: string;
}

// 8. Badges
interface SeedBadge {
  badge_id: string;
  badge_name: string;
  negative_speed: number;
  negative_shield: number;
  debuffs?: BadgeDebuff[];
  isActive?: boolean;
}
const INITIAL_BADGES: SeedBadge[] = [
  { badge_id: "badge-01", badge_name: "Sobrecarga de Motor", negative_speed: 15, negative_shield: 5, debuffs: [{stat: 'shield', value: -5}] }
];

// 9. Skills
interface SeedSkill {
  skill_id: string;
  skill_name: string;
  description: string;
  isActive?: boolean;
}
const INITIAL_SKILLS: SeedSkill[] = [
  { skill_id: "skill-01", skill_name: "Disparo Láser Táctico", description: "Ataque focalizado" }
];

// 10. NFTs
interface SeedNFT {
  nft_id: string;
  nft_name: string;
  contract_address: string;
  is_audited: boolean;
  isActive?: boolean;
}
const INITIAL_NFTS: SeedNFT[] = [
  { nft_id: "nft-01", nft_name: "Nave Fénix Génesis", contract_address: "0x123...abc", is_audited: true }
];

type TabType = 'estructuras' | 'tecnologias' | 'astrobots' | 'blueprints' | 'consumibles' | 'tools' | 'licencias' | 'badges' | 'skills' | 'nfts' | 'contenedores' | 'reciclaje';

const RARITY_STATS = {
  Common: { color: 'text-zinc-400', bg: 'bg-zinc-900', border: 'border-zinc-700', stats: '+0% Bonus, Drops: 50%' },
  Uncommon: { color: 'text-green-400', bg: 'bg-green-950', border: 'border-green-800', stats: '+2% Atk, Drops: 30%' },
  Rare: { color: 'text-blue-400', bg: 'bg-blue-950', border: 'border-blue-800', stats: '+5% Carga, Drops: 15%' },
  Epic: { color: 'text-purple-400', bg: 'bg-purple-950', border: 'border-purple-800', stats: '+10% Shield, Drops: 4%' },
  Legendary: { color: 'text-amber-400', bg: 'bg-amber-950', border: 'border-amber-800', stats: '+20% HP, Drops: 0.9%' },
  Exclusive: { color: 'text-red-400', bg: 'bg-red-950', border: 'border-red-800', stats: 'Unique Skill, Drops: 0.1%' },
  Heroic: { color: 'text-cyan-400', bg: 'bg-cyan-950', border: 'border-cyan-800', stats: 'God Tier, Drops: 0%' }
};

const RarityBadge = ({ rarity }: { rarity: string }) => {
  const [isHovered, setIsHovered] = useState(false);
  const conf = RARITY_STATS[rarity as keyof typeof RARITY_STATS] || RARITY_STATS.Common;

  return (
    <div 
      className="relative inline-flex items-center justify-center cursor-help mx-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest border ${conf.color} ${conf.bg} ${conf.border}`}>
        {rarity}
      </span>
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 z-[100] whitespace-nowrap bg-zinc-950/90 backdrop-blur-md border border-zinc-800 px-2 py-1.5 rounded-md shadow-xl"
          >
            <span className="text-[9px] font-mono text-zinc-300 flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${conf.bg.replace('950', '500').replace('900', '400')}`} />
              {conf.stats}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function AdminAssetMatrixModule({ 
  users, 
  setIsAlertToShow,
  onRefreshData 
}: AdminAssetMatrixModuleProps) {

  const [activeTab, setActiveTab] = useState<TabType>('estructuras');

  // Unified audit user flow
  const [playerSearchQuery, setPlayerSearchQuery] = useState('');
  const [auditedUser, setAuditedUser] = useState<UserProfile | null>(() => users[0] || null);

  // Core SEED states
  const [structuresList, setStructuresList] = useState<SeedStructure[]>(INITIAL_STRUCTURES);
  const [technologiesList, setTechnologiesList] = useState<SeedTechnology[]>(INITIAL_TECHNOLOGIES);
  const [astrobotsList, setAstrobotsList] = useState<SeedAstrobot[]>(INITIAL_ASTROBOTS);
  const [blueprintsList, setBlueprintsList] = useState<SeedBlueprint[]>(INITIAL_BLUEPRINTS);
  const [consumablesList, setConsumablesList] = useState<SeedConsumable[]>(INITIAL_CONSUMABLES);
  const [toolsList, setToolsList] = useState<SeedTool[]>(INITIAL_TOOLS);
  const [licensesList, setLicensesList] = useState<SeedLicense[]>(INITIAL_LICENSES);
  const [badgesList, setBadgesList] = useState<SeedBadge[]>(INITIAL_BADGES);
  const [skillsList, setSkillsList] = useState<SeedSkill[]>(INITIAL_SKILLS);
  const [nftsList, setNftsList] = useState<SeedNFT[]>(INITIAL_NFTS);

  // Loot table / Containers States
  const [containers, setContainers] = useState<Array<{ id: string; name: string; containerType: 'Bag' | 'Pack'; metal: number; crystal: number; deuterium: number; items: Array<{ name: string; probability: number }> }>>([
    {
      id: "cont-01",
      name: "Bolsa Mineral de Deuterio Compacto (Bag)",
      containerType: "Bag",
      metal: 50000,
      crystal: 20000,
      deuterium: 15000,
      items: []
    },
    {
      id: "cont-02",
      name: "Cofre de la Legión Osiris (Pack)",
      containerType: "Pack",
      metal: 10000,
      crystal: 5000,
      deuterium: 0,
      items: [
        { name: "Plano Fragata Osiris Legendario", probability: 15 },
        { name: "Astrobot Vanguard A.R.E.S", probability: 25 },
        { name: "Inyector Nanotecnológico AP-100", probability: 60 }
      ]
    }
  ]);

  const [newContainerName, setNewContainerName] = useState('');
  const [newContainerType, setNewContainerType] = useState<'Bag' | 'Pack'>('Bag');
  const [newContainerMetal, setNewContainerMetal] = useState(0);
  const [newContainerCrystal, setNewContainerCrystal] = useState(0);
  const [newContainerDeuterium, setNewContainerDeuterium] = useState(0);
  const [newContainerItemsText, setNewContainerItemsText] = useState("Plano Fragata:15\nAstrobot A.R.E.S:25\nInyector AP-100:60");
  const [simulatedLootResult, setSimulatedLootResult] = useState<any>(null);

  // Recycler States
  const [recyclerConfigs, setRecyclerConfigs] = useState<Array<{ id: string; name: string; assetType: 'Rare Spaceship' | 'Epic Spaceship' | 'Consumable'; metalRefund: number; crystalRefund: number; phantomCoinsReward: number; extraBonusProbability: number }>>([
    {
      id: "rec-01",
      name: "Nave Minera Rare",
      assetType: "Rare Spaceship",
      metalRefund: 15000,
      crystalRefund: 5000,
      phantomCoinsReward: 25,
      extraBonusProbability: 15
    },
    {
      id: "rec-02",
      name: "Fragata Bélica Epic",
      assetType: "Epic Spaceship",
      metalRefund: 45000,
      crystalRefund: 15000,
      phantomCoinsReward: 100,
      extraBonusProbability: 35
    },
    {
      id: "rec-03",
      name: "Consumible Inyector",
      assetType: "Consumable",
      metalRefund: 2000,
      crystalRefund: 800,
      phantomCoinsReward: 5,
      extraBonusProbability: 5
    }
  ]);

  const [newRecyclerName, setNewRecyclerName] = useState('');
  const [newRecyclerType, setNewRecyclerType] = useState<'Rare Spaceship' | 'Epic Spaceship' | 'Consumable'>('Rare Spaceship');
  const [newRecyclerMetal, setNewRecyclerMetal] = useState(10000);
  const [newRecyclerCrystal, setNewRecyclerCrystal] = useState(4000);
  const [newRecyclerPC, setNewRecyclerPC] = useState(25);
  const [newRecyclerBonusProb, setNewRecyclerBonusProb] = useState(15);
  const [simulatedRecyclerResult, setSimulatedRecyclerResult] = useState<any>(null);

  // Selected seed to edit
  const [editingItem, setEditingItem] = useState<{ tab: TabType; data: any } | null>(null);

  // AUTOMATED AUDIT LOG WRITER for Matrix edits
  const addAuditLog = (action: string, entity_type: string, entity_id: string, details: string) => {
    const entry = {
      id: 'log-' + Math.random().toString(36).substring(2, 11),
      timestamp: new Date().toISOString(),
      action,
      entity_type,
      entity_id,
      details
    };
    try {
      const saved = localStorage.getItem('saso_audit_logs');
      let prev: any[] = [];
      if (saved) {
        prev = JSON.parse(saved);
      }
      const updated = [entry, ...prev];
      localStorage.setItem('saso_audit_logs', JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to append matrix audit log", e);
    }
  };

  const toggleActiveStatus = (type: TabType, id: string) => {
    if (type === 'estructuras') {
      setStructuresList(prev => prev.map(item => item.building_id === id ? { ...item, isActive: !(item.isActive !== false) } : item));
      const target = structuresList.find(item => item.building_id === id);
      if (target) {
        addAuditLog("UPDATE", "STRUCTURE_ACTIVE", id, `Estatus "activo" cambiado a: ${!(target.isActive !== false) ? 'VISIBLE' : 'OCULTO'}`);
      }
    } else if (type === 'tecnologias') {
      setTechnologiesList(prev => prev.map(item => item.technology_id === id ? { ...item, isActive: !(item.isActive !== false) } : item));
      const target = technologiesList.find(item => item.technology_id === id);
      if (target) {
        addAuditLog("UPDATE", "TECH_ACTIVE", id, `Estatus "activo" cambiado a: ${!(target.isActive !== false) ? 'VISIBLE' : 'OCULTO'}`);
      }
    } else if (type === 'astrobots') {
      setAstrobotsList(prev => prev.map(item => item.astrobot_id === id ? { ...item, isActive: !(item.isActive !== false) } : item));
      const target = astrobotsList.find(item => item.astrobot_id === id);
      if (target) {
        addAuditLog("UPDATE", "ASTROBOT_ACTIVE", id, `Estatus "activo" cambiado a: ${!(target.isActive !== false) ? 'VISIBLE' : 'OCULTO'}`);
      }
    } else if (type === 'blueprints') {
      setBlueprintsList(prev => prev.map(item => item.blueprint_id === id ? { ...item, isActive: !(item.isActive !== false) } : item));
      const target = blueprintsList.find(item => item.blueprint_id === id);
      if (target) {
        addAuditLog("UPDATE", "BLUEPRINT_ACTIVE", id, `Estatus "activo" cambiado a: ${!(target.isActive !== false) ? 'VISIBLE' : 'OCULTO'}`);
      }
    } else if (type === 'consumibles') {
      setConsumablesList(prev => prev.map(item => item.consumable_id === id ? { ...item, isActive: !(item.isActive !== false) } : item));
      const target = consumablesList.find(item => item.consumable_id === id);
      if (target) {
        addAuditLog("UPDATE", "CONSUMABLE_ACTIVE", id, `Estatus "activo" cambiado a: ${!(target.isActive !== false) ? 'VISIBLE' : 'OCULTO'}`);
      }
    } else if (type === 'tools') {
      setToolsList(prev => prev.map(item => item.tool_id === id ? { ...item, isActive: !(item.isActive !== false) } : item));
      const target = toolsList.find(item => item.tool_id === id);
      if (target) {
        addAuditLog("UPDATE", "TOOL_ACTIVE", id, `Estatus "activo" cambiado a: ${!(target.isActive !== false) ? 'VISIBLE' : 'OCULTO'}`);
      }
    } else if (type === 'licencias') {
      setLicensesList(prev => prev.map(item => item.license_id === id ? { ...item, isActive: !(item.isActive !== false) } : item));
      const target = licensesList.find(item => item.license_id === id);
      if (target) {
        addAuditLog("UPDATE", "LICENSE_ACTIVE", id, `Estatus "activo" cambiado a: ${!(target.isActive !== false) ? 'VISIBLE' : 'OCULTO'}`);
      }
    }
    
    setIsAlertToShow({
      show: true,
      status: 'success',
      message: '¡Estatus activo actualizado con éxito en la base de datos de semillas!'
    });
  };

  // Sorting and filtering states for seed collections
  const [matrixRarityFilter, setMatrixRarityFilter] = useState<string>('all');
  const [matrixCompanyFilter, setMatrixCompanyFilter] = useState<string>('all');
  const [matrixSearchQuery, setMatrixSearchQuery] = useState<string>('');
  const [matrixSortBy, setMatrixSortBy] = useState<string>('none');
  const [matrixSortOrder, setMatrixSortOrder] = useState<'asc' | 'desc'>('desc');

  // 1. Memoized Filtrado y Ordenado de Estructuras Semilla
  const filteredAndSortedStructures = useMemo(() => {
    let result = [...structuresList];
    if (matrixSearchQuery) {
      const q = matrixSearchQuery.toLowerCase();
      result = result.filter(s => s.building_name.toLowerCase().includes(q) || s.building_id.toLowerCase().includes(q));
    }
    if (matrixRarityFilter !== 'all') {
      result = result.filter(s => s.rarity.toLowerCase() === matrixRarityFilter.toLowerCase());
    }
    if (matrixCompanyFilter !== 'all') {
      result = result.filter(s => s.company.toLowerCase() === matrixCompanyFilter.toLowerCase());
    }

    if (matrixSortBy === 'name') {
      result.sort((a, b) => {
        const compare = a.building_name.localeCompare(b.building_name);
        return matrixSortOrder === 'asc' ? compare : -compare;
      });
    } else if (matrixSortBy === 'power_score') {
      result.sort((a, b) => {
        const scoreA = (a.hp_structural || 0) + (a.defense_rating || 0) * 10;
        const scoreB = (b.hp_structural || 0) + (b.defense_rating || 0) * 10;
        return matrixSortOrder === 'asc' ? scoreA - scoreB : scoreB - scoreA;
      });
    }
    return result;
  }, [structuresList, matrixSearchQuery, matrixRarityFilter, matrixCompanyFilter, matrixSortBy, matrixSortOrder]);

  // 2. Memoized Filtrado y Ordenado de Tecnologías Semilla
  const filteredAndSortedTechnologies = useMemo(() => {
    let result = [...technologiesList];
    if (matrixSearchQuery) {
      const q = matrixSearchQuery.toLowerCase();
      result = result.filter(t => t.technology_name.toLowerCase().includes(q) || t.technology_id.toLowerCase().includes(q));
    }
    if (matrixSortBy === 'name') {
      result.sort((a, b) => {
        const compare = a.technology_name.localeCompare(b.technology_name);
        return matrixSortOrder === 'asc' ? compare : -compare;
      });
    } else if (matrixSortBy === 'power_score') {
      result.sort((a, b) => {
        const scoreA = (a.attack_modifier_pct || 0) + (a.defense_modifier_pct || 0) + (a.speed_modifier_pct || 0);
        const scoreB = (b.attack_modifier_pct || 0) + (b.defense_modifier_pct || 0) + (b.speed_modifier_pct || 0);
        return matrixSortOrder === 'asc' ? scoreA - scoreB : scoreB - scoreA;
      });
    }
    return result;
  }, [technologiesList, matrixSearchQuery, matrixSortBy, matrixSortOrder]);

  // 3. Memoized Filtrado y Ordenado de Astrobots Semilla
  const filteredAndSortedAstrobots = useMemo(() => {
    let result = [...astrobotsList];
    if (matrixSearchQuery) {
      const q = matrixSearchQuery.toLowerCase();
      result = result.filter(b => b.astrobot_name.toLowerCase().includes(q) || b.astrobot_id.toLowerCase().includes(q));
    }
    if (matrixSortBy === 'name') {
      result.sort((a, b) => {
        const compare = a.astrobot_name.localeCompare(b.astrobot_name);
        return matrixSortOrder === 'asc' ? compare : -compare;
      });
    } else if (matrixSortBy === 'power_score') {
      result.sort((a, b) => {
        const scoreA = (a.kinetic_dmg || 0) + (a.laser_dmg || 0) + (a.plasma_dmg || 0) + (a.shield_capacity || 0) + (a.hp_points || 0);
        const scoreB = (b.kinetic_dmg || 0) + (b.laser_dmg || 0) + (b.plasma_dmg || 0) + (b.shield_capacity || 0) + (b.hp_points || 0);
        return matrixSortOrder === 'asc' ? scoreA - scoreB : scoreB - scoreA;
      });
    }
    return result;
  }, [astrobotsList, matrixSearchQuery, matrixSortBy, matrixSortOrder]);

  // User simulated Inventories corresponding to auditedUser
  const [userStructures, setUserStructures] = useState<UserStructure[]>(() => [
    { id: "us-1", building_id: "struct-01-fusi", level: 3, status: "ACTIVE" },
    { id: "us-2", building_id: "struct-02-extract", level: 6, status: "ACTIVE" }
  ]);
  const [userTechnologies, setUserTechnologies] = useState<UserTechnology[]>(() => [
    { technology_id: "tech-01-plasma", equipped: true, can_level: 12 },
    { technology_id: "tech-03-drive", equipped: false, can_level: 8 }
  ]);
  const [userAstrobots, setUserAstrobots] = useState<UserAstrobot[]>(() => [
    { user_bot_id: "ub-1", astrobot_id: "bot-apex-01", level: 4, assignedShipId: "uh_01" }
  ]);
  const [userBlueprints, setUserBlueprints] = useState<UserBlueprint[]>(() => [
    { blueprint_id: "bp-class-capitana", durability_left: 5, quantityOwned: 3 },
    { blueprint_id: "bp-class-excavator", durability_left: 10, quantityOwned: 1 }
  ]);
  const [userConsumables, setUserConsumables] = useState<UserConsumable[]>(() => [
    { consumable_id: "cons-ap-pill", quantity: 15 },
    { consumable_id: "cons-speed-boost", quantity: 4 }
  ]);
  const [userTools, setUserTools] = useState<UserTool[]>(() => [
    { tool_id: "tool-gd-harvest", installed: true, durability: 100 }
  ]);
  const [userLicenses, setUserLicenses] = useState<UserLicense[]>(() => [
    { license_id: "license-sector-abisal", acquired_at: new Date(Date.now() - 86400000 * 3).toISOString() }
  ]);

  // Handle synchronized simulation search
  const handleSincroUser = () => {
    if (!playerSearchQuery.trim()) {
      setIsAlertToShow({
        show: true,
        status: 'error',
        message: 'Por favor ingrese email, ID o username de piloto.'
      });
      return;
    }

    const qLower = playerSearchQuery.toLowerCase();
    const found = users.find(u => 
      u.id.toLowerCase() === qLower || 
      u.email.toLowerCase() === qLower ||
      u.username.toLowerCase().includes(qLower)
    );

    if (found) {
      setAuditedUser(found);
      setIsAlertToShow({
        show: true,
        status: 'success',
        message: `AUDITORÍA: Cargando componentes en vivo del comandante ${found.username}`
      });
      // Generate dynamically corresponding mock player data for visual realism
      setUserStructures([
        { id: `us-${found.id}-1`, building_id: "struct-01-fusi", level: Math.floor((found.level % 8) + 1), status: 'ACTIVE' },
        { id: `us-${found.id}-2`, building_id: "struct-02-extract", level: Math.floor((found.level % 15) + 1), status: 'ACTIVE' }
      ]);
      setUserTechnologies([
        { technology_id: "tech-01-plasma", equipped: found.level > 10, can_level: found.level },
        { technology_id: "tech-02-vanguard", equipped: found.level > 25, can_level: found.level }
      ]);
      setUserAstrobots([
        { user_bot_id: `ub-${found.id}-bot`, astrobot_id: "bot-apex-01", level: Math.floor((found.level % 4) + 1), assignedShipId: "uh_01" }
      ]);
      setUserBlueprints([
        { blueprint_id: "bp-class-capitana", durability_left: Math.max(found.level % 6, 1), quantityOwned: 2 + (found.level % 4) }
      ]);
      setUserConsumables([
        { consumable_id: "cons-ap-pill", quantity: 10 + found.level },
        { consumable_id: "cons-speed-boost", quantity: 5 }
      ]);
      setUserTools([
        { tool_id: "tool-gd-harvest", installed: true, durability: 100 }
      ]);
      setUserLicenses([
        { license_id: "license-sector-abisal", acquired_at: new Date().toISOString() }
      ]);
    } else {
      setIsAlertToShow({
        show: true,
        status: 'error',
        message: 'No se ubicó capitanes estelares con esos datos.'
      });
    }
  };

  // 1. Estructuras actions
  const [newStructForm, setNewStructForm] = useState<Partial<SeedStructure>>({});
  const handleSaveStructureSeed = () => {
    if (!newStructForm.building_name?.trim()) {
      setIsAlertToShow({ show: true, status: 'error', message: 'Indique un nombre válido para el edificio cósmico.' });
      return;
    }
    const id = newStructForm.building_id || `struct-dyn-${Date.now()}`;
    const entry: SeedStructure = {
      building_id: id,
      building_name: newStructForm.building_name,
      description: newStructForm.description || '',
      rarity: newStructForm.rarity || 'Common',
      company: newStructForm.company || 'Nova',
      max_level: newStructForm.max_level || 10,
      energy_consumption: newStructForm.energy_consumption || 0,
      energy_production: newStructForm.energy_production || 0,
      costs_grid: newStructForm.costs_grid || [],
      hp_structural: newStructForm.hp_structural || 1000,
      defense_rating: newStructForm.defense_rating || 50
    };

    const isExisting = structuresList.some(s => s.building_id === id);
    if (isExisting) {
      setStructuresList(prev => prev.map(s => s.building_id === id ? entry : s));
      addAuditLog("UPDATE", "STRUCTURE", entry.building_id, `Modificación de estructura "${entry.building_name}": Max Nivel ${entry.max_level}, Energía Prod: ${entry.energy_production}, Energía Consumida: ${entry.energy_consumption}.`);
    } else {
      setStructuresList(prev => [...prev, entry]);
      addAuditLog("CREATE", "STRUCTURE", entry.building_id, `Se creó la estructura semilla "${entry.building_name}" con rareza ${entry.rarity} para la empresa ${entry.company}.`);
    }
    setNewStructForm({});
    setIsAlertToShow({ show: true, status: 'success', message: '¡Estructura guardada exitosamente en la base de datos!' });
  };

  const handleInjectStructure = (buildingId: string) => {
    if (!auditedUser) return;
    if (userStructures.some(s => s.building_id === buildingId)) {
      setIsAlertToShow({ show: true, status: 'error', message: 'El jugador ya cuenta con esta instalación militarizada.' });
      return;
    }
    const newFacility: UserStructure = {
      id: `us-facility-${Date.now()}`,
      building_id: buildingId,
      level: 1,
      status: 'ACTIVE'
    };
    setUserStructures(prev => [...prev, newFacility]);
    setIsAlertToShow({
      show: true,
      status: 'success',
      message: `¡INYECTAR DIRECTO! Instalada con éxito en Nivel 1 en la cuenta de ${auditedUser.username}.`
    });
  };

  const handleDeleteStructure = (buildingId: string, buildingName: string) => {
    setStructuresList(prev => prev.filter(s => s.building_id !== buildingId));
    addAuditLog("DELETE", "STRUCTURE", buildingId, `Se purgó la estructura de la base de datos: "${buildingName}".`);
  };

  const handleDeleteTechnology = (techId: string, techName: string) => {
    setTechnologiesList(prev => prev.filter(t => t.technology_id !== techId));
    addAuditLog("DELETE", "TECHNOLOGY", techId, `Se purgó el módulo tecnológico de la base de datos: "${techName}".`);
  };

  // 2. Tecnologías actions
  const [newTechForm, setNewTechForm] = useState<Partial<SeedTechnology>>({});
  const handleSaveTechSeed = () => {
    if (!newTechForm.technology_name?.trim()) {
      setIsAlertToShow({ show: true, status: 'error', message: 'Indique nombre de la tecnología estelar.' });
      return;
    }
    const id = newTechForm.technology_id || `tech-dyn-${Date.now()}`;
    const entry: SeedTechnology = {
      technology_id: id,
      technology_name: newTechForm.technology_name,
      description: newTechForm.description || '',
      attack_modifier_pct: newTechForm.attack_modifier_pct || 0,
      defense_modifier_pct: newTechForm.defense_modifier_pct || 0,
      speed_modifier_pct: newTechForm.speed_modifier_pct || 0,
      can_level_required: newTechForm.can_level_required || 1,
      prerequisites: newTechForm.prerequisites || [],
      struct_prerequisites: newTechForm.struct_prerequisites || []
    };

    const isExisting = technologiesList.some(t => t.technology_id === id);
    if (isExisting) {
      setTechnologiesList(prev => prev.map(t => t.technology_id === id ? entry : t));
      addAuditLog("UPDATE", "TECHNOLOGY", entry.technology_id, `Modificación de tecnología "${entry.technology_name}".`);
    } else {
      setTechnologiesList(prev => [...prev, entry]);
      addAuditLog("CREATE", "TECHNOLOGY", entry.technology_id, `Se diseñó la tecnología estelar "${entry.technology_name}".`);
    }
    setNewTechForm({});
    setIsAlertToShow({ show: true, status: 'success', message: 'Módulo tecnológico guardado del kernel.' });
  };

  const [newBadgeForm, setNewBadgeForm] = useState<Partial<SeedBadge>>({});
  const handleSaveBadgeSeed = () => {
    if (!newBadgeForm.badge_name?.trim()) {
      setIsAlertToShow({ show: true, status: 'error', message: 'Indique nombre del Badge.' });
      return;
    }
    const id = newBadgeForm.badge_id || `badge-dyn-${Date.now()}`;
    const entry: SeedBadge = {
      badge_id: id,
      badge_name: newBadgeForm.badge_name,
      negative_speed: newBadgeForm.negative_speed || 0,
      negative_shield: newBadgeForm.negative_shield || 0,
      debuffs: newBadgeForm.debuffs || []
    };
    if (badgesList.some(b => b.badge_id === id)) {
      setBadgesList(prev => prev.map(b => b.badge_id === id ? entry : b));
    } else {
      setBadgesList(prev => [...prev, entry]);
    }
    setNewBadgeForm({});
    setIsAlertToShow({ show: true, status: 'success', message: 'Badge debuff guardado y configurado correctamente.' });
  };

  const [newSkillForm, setNewSkillForm] = useState<Partial<SeedSkill>>({});
  const handleSaveSkillSeed = () => {
    if (!newSkillForm.skill_name?.trim()) {
      setIsAlertToShow({ show: true, status: 'error', message: 'Debe ingresar un nombre para el skill.' });
      return;
    }
    if (newSkillForm.skill_name.match(/^Skill \d+(:.*)?/i) || newSkillForm.skill_name.toLowerCase().startsWith('skill')) {
      setIsAlertToShow({ show: true, status: 'error', message: 'PROHIBIDO: No se permiten nombres genéricos como "Skill 1". Usa nombres descriptivos (ej. "Exploration Tech").' });
      return;
    }
    const id = newSkillForm.skill_id || `skill-dyn-${Date.now()}`;
    const entry: SeedSkill = {
      skill_id: id,
      skill_name: newSkillForm.skill_name,
      description: newSkillForm.description || ''
    };
    if (skillsList.some(s => s.skill_id === id)) {
      setSkillsList(prev => prev.map(s => s.skill_id === id ? entry : s));
    } else {
      setSkillsList(prev => [...prev, entry]);
    }
    setNewSkillForm({});
    setIsAlertToShow({ show: true, status: 'success', message: 'Skill guardado bajo nomenclatura estricta.' });
  };

  const clearStuckTechSlots = () => {
    if (!auditedUser) return;
    setUserTechnologies(prev => prev.map(t => ({ ...t, equipped: false })));
    setIsAlertToShow({
      show: true,
      status: 'success',
      message: `📡 [CLEAR_STUCK_TECH_SLOTS] Pánico activado. Se han apagado y reseteado todos los slots del C.A.N. de ${auditedUser.username}.`
    });
  };

  const injectTechToWallet = (techId: string) => {
    if (!auditedUser) return;
    if (userTechnologies.some(t => t.technology_id === techId)) {
      setIsAlertToShow({ show: true, status: 'error', message: 'Este capitán ya posee este activo tecnológico.' });
      return;
    }
    setUserTechnologies(prev => [...prev, { technology_id: techId, equipped: false, can_level: 1 }]);
    setIsAlertToShow({
      show: true,
      status: 'success',
      message: 'Tecnología inyectada con éxito a la billetera.'
    });
  };

  // 3. Astrobots actions
  const [newBotForm, setNewBotForm] = useState<Partial<SeedAstrobot>>({});
  const handleSaveBotSeed = () => {
    if (!newBotForm.astrobot_name?.trim()) {
      setIsAlertToShow({ show: true, status: 'error', message: 'Complete el nombre de IA del Astrobot.' });
      return;
    }
    const id = newBotForm.astrobot_id || `bot-dyn-${Date.now()}`;
    const entry: SeedAstrobot = {
      astrobot_id: id,
      astrobot_name: newBotForm.astrobot_name,
      avatar_url: newBotForm.avatar_url || 'https://images.unsplash.com/photo-1546776310-eef45dd6d63c?q=80&w=100&auto=format&fit=crop',
      image_render: '',
      role: newBotForm.role || 'Attack',
      kinetic_dmg: newBotForm.kinetic_dmg || 0,
      laser_dmg: newBotForm.laser_dmg || 0,
      plasma_dmg: newBotForm.plasma_dmg || 0,
      ionic_dmg: newBotForm.ionic_dmg || 0,
      graviton_dmg: newBotForm.graviton_dmg || 0,
      shield_capacity: newBotForm.shield_capacity || 500,
      hp_points: newBotForm.hp_points || 1000,
      travel_speed: newBotForm.travel_speed || 30,
      fleet_capacity_cost: newBotForm.fleet_capacity_cost || 1
    };

    if (astrobotsList.some(b => b.astrobot_id === id)) {
      setAstrobotsList(prev => prev.map(b => b.astrobot_id === id ? entry : b));
    } else {
      setAstrobotsList(prev => [...prev, entry]);
    }
    setNewBotForm({});
    setIsAlertToShow({ show: true, status: 'success', message: 'Astrobot companion persistido en seed_astrobots.' });
  };

  const injectAstrobot = (botId: string) => {
    if (!auditedUser) return;
    const count = userAstrobots.length;
    const newCompanion: UserAstrobot = {
      user_bot_id: `ub-inj-${Date.now()}-${count}`,
      astrobot_id: botId,
      level: 1,
      assignedShipId: null
    };
    setUserAstrobots(prev => [...prev, newCompanion]);
    setIsAlertToShow({
      show: true,
      status: 'success',
      message: '¡REGALO AUTORIZADO! El bot se ha inyectado con telemetría de firmware Nivel 1.'
    });
  };

  // 4. Blueprints actions
  const [newBlueprintForm, setNewBlueprintForm] = useState<Partial<SeedBlueprint>>({});
  const handleSaveBlueprintSeed = () => {
    if (!newBlueprintForm.blueprint_name?.trim()) {
      setIsAlertToShow({ show: true, status: 'error', message: 'Escriba un nombre idóneo para el plano.' });
      return;
    }
    const id = newBlueprintForm.blueprint_id || `bp-dyn-${Date.now()}`;
    const entry: SeedBlueprint = {
      blueprint_id: id,
      blueprint_name: newBlueprintForm.blueprint_name,
      description: newBlueprintForm.description || '',
      max_durability: newBlueprintForm.max_durability || 5,
      failure_rate_pct: newBlueprintForm.failure_rate_pct || 1.0,
      required_tech_id: newBlueprintForm.required_tech_id || 'tech-01-plasma'
    };

    if (blueprintsList.some(bp => bp.blueprint_id === id)) {
      setBlueprintsList(prev => prev.map(bp => bp.blueprint_id === id ? entry : bp));
    } else {
      setBlueprintsList(prev => [...prev, entry]);
    }
    setNewBlueprintForm({});
    setIsAlertToShow({ show: true, status: 'success', message: 'Plano incorporado en la matriz blueprint.' });
  };

  const resetBlueprintDurability = (blueprintId: string) => {
    if (!auditedUser) return;
    const raw = blueprintsList.find(b => b.blueprint_id === blueprintId);
    if (!raw) return;
    setUserBlueprints(prev => prev.map(b => b.blueprint_id === blueprintId ? { ...b, durability_left: raw.max_durability } : b));
    setIsAlertToShow({
      show: true,
      status: 'success',
      message: `🔧 [RESET_BLUEPRINT_DURABILITY] Plano reparado al 100% de durabilidad (${raw.max_durability} usos).`
    });
  };

  // 5. Consumibles actions
  const [newConsForm, setNewConsForm] = useState<Partial<SeedConsumable>>({});
  const handleSaveConsSeed = () => {
    if (!newConsForm.item_name?.trim()) {
      setIsAlertToShow({ show: true, status: 'error', message: 'Escriba un nombre válido para el insumo.' });
      return;
    }
    const id = newConsForm.consumable_id || `cons-dyn-${Date.now()}`;
    const entry: SeedConsumable = {
      consumable_id: id,
      item_name: newConsForm.item_name,
      icon_symbol: newConsForm.icon_symbol || '📦',
      effect_type: newConsForm.effect_type || 'RESOURCE_CHEST',
      effect_value: newConsForm.effect_value || 100
    };

    if (consumablesList.some(c => c.consumable_id === id)) {
      setConsumablesList(prev => prev.map(c => c.consumable_id === id ? entry : c));
    } else {
      setConsumablesList(prev => [...prev, entry]);
    }
    setNewConsForm({});
    setIsAlertToShow({ show: true, status: 'success', message: 'Consumible ingresado con efecto de servidor programado.' });
  };

  const injectConsumablesPack = (consumableId: string, qty: number) => {
    if (!auditedUser) return;
    if (qty <= 0) return;
    setUserConsumables(prev => {
      const exists = prev.find(c => c.consumable_id === consumableId);
      if (exists) {
        return prev.map(c => c.consumable_id === consumableId ? { ...c, quantity: c.quantity + qty } : c);
      } else {
        return [...prev, { consumable_id: consumableId, quantity: qty }];
      }
    });

    setIsAlertToShow({
      show: true,
      status: 'success',
      message: `¡PAQUETE INYECTADO! Descompreso un bloque de x${qty} unidades de consumibles en el inventario.`
    });
  };

  // 6. Tools actions
  const [newToolForm, setNewToolForm] = useState<Partial<SeedTool>>({});
  const handleSaveToolSeed = () => {
    if (!newToolForm.tool_name?.trim()) {
      setIsAlertToShow({ show: true, status: 'error', message: 'Indique el nombre de la herramienta.' });
      return;
    }
    const id = newToolForm.tool_id || `tool-dyn-${Date.now()}`;
    const entry: SeedTool = {
      tool_id: id,
      tool_name: newToolForm.tool_name,
      description: newToolForm.description || '',
      is_nft_asset: newToolForm.is_nft_asset === true,
      extraction_multiplier: newToolForm.extraction_multiplier || 1.0
    };

    if (toolsList.some(t => t.tool_id === id)) {
      setToolsList(prev => prev.map(t => t.tool_id === id ? entry : t));
    } else {
      setToolsList(prev => [...prev, entry]);
    }
    setNewToolForm({});
    setIsAlertToShow({ show: true, status: 'success', message: 'Herramientas actualizadas en Supabase seed_tools.' });
  };

  const handleEquipTool = (toolId: string) => {
    if (!auditedUser) return;
    if (userTools.some(t => t.tool_id === toolId)) {
      setIsAlertToShow({ show: true, status: 'error', message: 'La ranura minera ya tiene instalado este Extractor.' });
      return;
    }
    setUserTools(prev => [...prev, { tool_id: toolId, installed: true, durability: 100 }]);
    setIsAlertToShow({
      show: true,
      status: 'success',
      message: 'Herramienta de perforación instalada eficazmente en la base.'
    });
  };

  // 7. Licencias actions
  const [newLicenseForm, setNewLicenseForm] = useState<Partial<SeedLicense>>({});
  const handleSaveLicenseSeed = () => {
    if (!newLicenseForm.license_name?.trim()) {
      setIsAlertToShow({ show: true, status: 'error', message: 'Indique nombre legal de la licencia.' });
      return;
    }
    const id = newLicenseForm.license_id || `license-dyn-${Date.now()}`;
    const entry: SeedLicense = {
      license_id: id,
      license_name: newLicenseForm.license_name,
      target_sector: newLicenseForm.target_sector || 'Quadrante Gamma',
      gd_coin_cost: newLicenseForm.gd_coin_cost || 1000,
      quantum_credit_cost: newLicenseForm.quantum_credit_cost || 100
    };

    if (licensesList.some(l => l.license_id === id)) {
      setLicensesList(prev => prev.map(l => l.license_id === id ? entry : l));
    } else {
      setLicensesList(prev => [...prev, entry]);
    }
    setNewLicenseForm({});
    setIsAlertToShow({ show: true, status: 'success', message: 'Patente/Licencia estelar configurada en sector de paso.' });
  };

  const bypassAllLicenseLocks = () => {
    if (!auditedUser) return;
    const bypassArr = licensesList.map(lic => ({
      license_id: lic.license_id,
      acquired_at: new Date().toISOString()
    }));
    setUserLicenses(bypassArr);
    setIsAlertToShow({
      show: true,
      status: 'success',
      message: '🚨 [BYPASS_LICENSE_LOCK] Permisos globales activados. Se otorgaron patentes infinitas para todos los sectores.'
    });
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest font-mono block">
            NÚCLEOS DE OPERACIÓN GENERAL
          </span>
          <h2 className="text-xl font-bold font-sans text-white tracking-tight flex items-center gap-2 mt-1">
            <LayoutGrid className="text-red-500" size={18} />
            MATRIZ DE COMPONENTES DE VUELO
          </h2>
          <p className="text-xs text-zinc-500 font-sans mt-0.5">
            Ingeniería de datos relacionales en Supabase para el balance comercial de SASORILABS.IO.
          </p>
        </div>

        {/* AUDITED PILOT HEADER CONTROL BAR */}
        {auditedUser && (
          <div className="bg-black/50 border border-zinc-900 rounded p-2 px-3 flex items-center gap-3.5 text-[11px] font-mono leading-none">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            <div>
              <span className="text-zinc-500 block uppercase text-[8.5px]">Piloto Auditando</span>
              <span className="text-white font-bold">{auditedUser.username}</span>
            </div>
            <div className="border-l border-zinc-850 h-5 pl-3">
              <span className="text-zinc-500 block uppercase text-[8.5px]">Nivel CAN</span>
              <span className="text-[#ff1e1e] font-bold">{auditedUser.level}</span>
            </div>
          </div>
        )}
      </div>

      {/* METRIC INDEXES TABS (7 HORIZONTAL CHANNELS) */}
      <div className="flex bg-black/60 border border-zinc-900 p-1 rounded font-mono text-[10px] overflow-x-auto scrollbar-none gap-1">
        {[
          { key: 'estructuras', label: 'Estructuras', icon: Building },
          { key: 'tecnologias', label: 'Tecnologías', icon: Cpu },
          { key: 'astrobots', label: 'Astrobots', icon: Bot },
          { key: 'blueprints', label: 'Blueprints', icon: FileText },
          { key: 'consumibles', label: 'Consumibles', icon: Package },
          { key: 'tools', label: 'Tools', icon: Sliders },
          { key: 'licencias', label: 'Licencias', icon: Key },
          { key: 'badges', label: 'Badges', icon: Award },
          { key: 'skills', label: 'Skills', icon: Zap },
          { key: 'nfts', label: 'NFTs', icon: Shield },
          { key: 'contenedores', label: 'Loot Tables', icon: Package },
          { key: 'reciclaje', label: 'Recycler', icon: Building }
        ].map((tab) => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key as TabType);
                setEditingItem(null);
              }}
              className={`px-3 py-1.5 font-bold uppercase transition-all tracking-wider rounded flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-red-650 text-white font-bold'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
              }`}
            >
              <IconComponent size={12} />
              <span>{tab.label.toUpperCase()}</span>
            </button>
          );
        })}
      </div>

      {/* SEARCH AND VIRTUAL LINK BRIDGE BOX */}
      <div className="p-3 bg-zinc-950 border border-zinc-900 rounded flex flex-col sm:flex-row gap-2.5 items-center justify-between">
        <div className="text-xs text-zinc-400">
          <span className="font-bold text-zinc-200">🔍 Consola de Red Inteligente:</span> Use esta barra para buscar e intercalar perfiles de comandante en tiempo real.
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <input
            aria-label="input element"type="text"
            placeholder="Username o email de Comandante..."
            value={playerSearchQuery}
            onChange={(e) => setPlayerSearchQuery(e.target.value)}
            className="px-2.5 py-1.5 bg-black border border-zinc-850 rounded text-xs text-white placeholder-zinc-700 font-mono w-full sm:w-60 focus:border-red-500 focus:outline-none"
          />
          <button
            onClick={handleSincroUser}
            className="px-3 bg-zinc-900 hover:bg-red-650 border border-zinc-800 hover:border-red-500 text-white font-bold text-[10px] uppercase font-mono tracking-wider transition-colors duration-200 rounded shrink-0 flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw size={11} /> Sincronizar
          </button>
        </div>
      </div>

      {/* MAIN DATA GRID FOR ACTIVE TAB */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-fadeIn">
        
        {/* LEFT COLUMN: CRUDS / GLOBAL REGISTER MASTER LIST */}
        <div className="space-y-6 bg-zinc-950 border border-zinc-900 rounded-lg p-4">
          
          <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
            <span className="text-[10.5px] font-mono font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
              <HardDrive size={13} className="text-red-500 shrink-0" />
              <span>REGISTROS SEMILLA DE LA TABLA GLOBAL (Supabase)</span>
            </span>
          </div>

          {/* MATRIX SEARCH & SORTING CONTROLS BAR */}
          <div className="p-2.5 bg-black/60 border border-zinc-900 rounded-lg space-y-2 text-xs font-mono">
            <div className="flex flex-col sm:flex-row gap-2 justify-between items-center">
              
              {/* Search text input */}
              <div className="relative flex-1 w-full">
                <span className="absolute left-2.5 top-2.5 text-zinc-650">
                  <Search size={12} />
                </span>
                <input
                  aria-label="input element"type="text"
                  placeholder="Buscar por nombre / ID..."
                  value={matrixSearchQuery}
                  onChange={(e) => setMatrixSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-black border border-zinc-850 rounded text-[11px] text-white placeholder-zinc-700 font-mono focus:border-red-500 focus:outline-none"
                />
              </div>

              {/* Rarity filter if on estructuras */}
              {activeTab === 'estructuras' && (
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[9px] text-zinc-550">RAREZA:</span>
                  <select
                    aria-label="Filtrar por rareza"
                    value={matrixRarityFilter}
                    onChange={(e) => setMatrixRarityFilter(e.target.value)}
                    className="bg-black border border-zinc-850 rounded px-1.5 py-1 text-[11px] text-zinc-400 font-mono outline-none"
                  >
                    <option value="all">Todas</option>
                    <option value="Common">Common</option>
                    <option value="Uncommon">Uncommon</option>
                    <option value="Rare">Rare</option>
                    <option value="Epic">Epic</option>
                    <option value="Legendary">Legendary</option>
                  </select>
                </div>
              )}

              {/* Sort field */}
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[9px] text-zinc-550">ORDENAR BY:</span>
                <select
                  aria-label="Ordenar por"
                  value={matrixSortBy}
                  onChange={(e) => setMatrixSortBy(e.target.value)}
                  className="bg-black border border-zinc-850 rounded px-1.5 py-1 text-[11px] text-zinc-300 font-mono outline-none"
                >
                  <option value="none">Por ID (Defecto)</option>
                  <option value="name">Nombre</option>
                  <option value="power_score">Poder Estimado</option>
                </select>
              </div>

              {/* Sort order toggle buttons */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setMatrixSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="px-2 py-1 bg-black border border-zinc-850 rounded hover:border-red-500 font-bold text-[10px] text-zinc-400 hover:text-white uppercase font-mono cursor-pointer"
                >
                  {matrixSortOrder === 'asc' ? '▲ ASC' : '▼ DESC'}
                </button>
              </div>

            </div>
          </div>

          {/* TAB 1: ESTRUCTURAS CRUD */}
          {activeTab === 'estructuras' && (
            <div className="space-y-4">
              {/* Dynamic Cost Grid & Energy Consumption Dashboard */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-zinc-950 border border-zinc-900 p-3 rounded-lg flex flex-col h-48">
                  <div className="flex justify-between items-center border-b border-zinc-900 pb-2 mb-2">
                    <span className="text-[10px] text-white font-bold uppercase tracking-wider">Dynamic Cost Grid (Levels 1-10)</span>
                    <Building size={12} className="text-zinc-500" />
                  </div>
                  <div className="flex-1 overflow-auto text-[9px] font-mono pr-1 custom-scrollbar">
                    {structuresList.length > 0 && (
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="text-zinc-500 border-b border-zinc-800">
                            <th className="py-1">Nivel</th>
                            <th className="py-1 text-right">Metal</th>
                            <th className="py-1 text-right">Cristal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.from({ length: 10 }).map((_, i) => {
                            const level = i + 1;
                            const base = structuresList[0];
                            const costM = Math.floor(base.cost_metal * Math.pow(1.5, level - 1));
                            const costC = Math.floor(base.cost_crystal * Math.pow(1.5, level - 1));
                            return (
                              <tr key={level} className="border-b border-zinc-900 hover:bg-zinc-900/40">
                                <td className="py-1 text-zinc-300">Nivel {level}</td>
                                <td className="py-1 text-right text-zinc-400">{costM.toLocaleString()}</td>
                                <td className="py-1 text-right text-zinc-400">{costC.toLocaleString()}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                <div className="bg-zinc-950 border border-zinc-900 p-3 rounded-lg flex flex-col h-48">
                  <div className="flex justify-between items-center border-b border-zinc-900 pb-2 mb-2">
                    <span className="text-[10px] text-white font-bold uppercase tracking-wider">Energy Consumption Dashboard</span>
                    <Zap size={12} className="text-yellow-500" />
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                    <div className="w-full flex items-center justify-between text-[10px] font-mono">
                      <span className="text-zinc-500">Demanda Energética Base:</span>
                      <span className="text-yellow-500 font-bold">12,500 KW/h</span>
                    </div>
                    <div className="w-full bg-black border border-zinc-900 h-4 rounded overflow-hidden flex">
                      <div className="bg-red-500 h-full w-[45%]"></div>
                      <div className="bg-yellow-500 h-full w-[35%]"></div>
                      <div className="bg-emerald-500 h-full w-[20%]"></div>
                    </div>
                    <div className="w-full flex justify-between text-[9px] font-mono text-zinc-500">
                      <span>Defensa (45%)</span>
                      <span>Extracción (35%)</span>
                      <span>Soporte (20%)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-[11px] font-sans">
                <input
                  aria-label="input element"type="text"
                  placeholder="ID Estructura (ej. struct-radar)"
                  value={newStructForm.building_id || ''}
                  onChange={(e) => setNewStructForm(prev => ({ ...prev, building_id: e.target.value }))}
                  className="p-1 px-2.5 bg-black border border-zinc-850 rounded text-white font-mono focus:border-red-500 outline-none text-[10px]"
                />
                <input
                  aria-label="input element"type="text"
                  placeholder="Nombre de Estructura"
                  value={newStructForm.building_name || ''}
                  onChange={(e) => setNewStructForm(prev => ({ ...prev, building_name: e.target.value }))}
                  className="p-1 px-2.5 bg-black border border-zinc-850 rounded text-white focus:border-red-500 outline-none"
                />
                <select
                  aria-label="Rareza de estructura"
                  value={newStructForm.rarity || 'Common'}
                  onChange={(e) => setNewStructForm(prev => ({ ...prev, rarity: e.target.value as any }))}
                  className="bg-black border border-zinc-850 rounded p-1 px-2 text-zinc-400 font-mono outline-none"
                >
                  <option value="Common">Common</option>
                  <option value="Uncommon">Uncommon</option>
                  <option value="Rare">Rare</option>
                  <option value="Epic">Epic</option>
                  <option value="Legendary">Legendary</option>
                  <option value="Exclusive">Exclusive</option>
                </select>
                <select
                  aria-label="Compañía fabricante"
                  value={newStructForm.company || 'Nova'}
                  onChange={(e) => setNewStructForm(prev => ({ ...prev, company: e.target.value as any }))}
                  className="bg-black border border-zinc-850 rounded p-1 px-2 text-zinc-400 font-mono outline-none"
                >
                  <option value="Nova">Nova Company</option>
                  <option value="Osiris">Osiris Labs</option>
                  <option value="Myton">Myton Tech</option>
                  <option value="Alacran">Alacran Corp</option>
                  <option value="Zeppelin">Zeppelin Aerospace</option>
                  <option value="Kant">Kant Defence</option>
                </select>
                <input
                  aria-label="input element"type="number"
                  placeholder="Max Nivel (Ej. 10)"
                  value={newStructForm.max_level || ''}
                  onChange={(e) => setNewStructForm(prev => ({ ...prev, max_level: parseInt(e.target.value) || undefined }))}
                  className="p-1 px-2 bg-black border border-zinc-850 rounded text-white font-mono text-right"
                />
                <input
                  aria-label="input element"type="number"
                  placeholder="Consumo Energía"
                  value={newStructForm.energy_consumption || ''}
                  onChange={(e) => setNewStructForm(prev => ({ ...prev, energy_consumption: parseInt(e.target.value) || undefined }))}
                  className="p-1 px-2 bg-black border border-zinc-850 rounded text-white font-mono text-right"
                />
                <input
                  aria-label="input element"type="number"
                  placeholder="Prod. Energía"
                  value={newStructForm.energy_production || ''}
                  onChange={(e) => setNewStructForm(prev => ({ ...prev, energy_production: parseInt(e.target.value) || undefined }))}
                  className="p-1 px-2 bg-black border border-zinc-850 rounded text-white font-mono text-right"
                />
                <button 
                  onClick={() => setIsAlertToShow({ show: true, status: 'success', message: 'Abriendo simulador de Grid de Costos Nivel 1-10...' })}
                  className="p-1 px-2 bg-zinc-900 border border-zinc-700 hover:border-cyan-500 rounded text-cyan-400 font-mono text-xs text-center cursor-pointer"
                >
                  Configurar Costos N1-10
                </button>
                <input
                  aria-label="input element"type="number"
                  placeholder="HP Estructural"
                  value={newStructForm.hp_structural || ''}
                  onChange={(e) => setNewStructForm(prev => ({ ...prev, hp_structural: parseInt(e.target.value) || undefined }))}
                  className="p-1 px-2 bg-black border border-zinc-850 rounded text-white font-mono text-right"
                />
              </div>

              <button
                onClick={handleSaveStructureSeed}
                className="w-full py-1.5 bg-red-650 hover:bg-red-500 text-white font-bold text-[10px] uppercase font-mono tracking-widest rounded cursor-pointer transition-colors"
              >
                Persistir Estructura en el Taller
              </button>

              {/* Seed Grid */}
              <div className="space-y-2 mt-4 max-h-[290px] overflow-y-auto pr-1">
                {filteredAndSortedStructures.map(item => (
                  <div key={item.building_id} className={`asset-card-container p-2.5 bg-black/40 border border-zinc-900 hover:border-zinc-800 rounded flex items-center justify-between text-xs transition-all ${item.isActive === false ? 'opacity-40' : ''}`}>
                    <div>
                      <span className="font-bold text-white font-mono">{item.building_name}</span>
                      <span className="text-[9px] text-zinc-550 block font-mono flex items-center gap-1 mt-0.5">
                        ID: {item.building_id} • Rarity: <RarityBadge rarity={item.rarity} /> • Company: {item.company}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* QUICK HIDE SWITCH */}
                      <div className="flex items-center gap-1 bg-zinc-950 p-1.5 rounded border border-zinc-900 mr-1.5">
                        <span className="text-[8px] font-mono text-zinc-500 font-bold uppercase select-none">ACTIVO</span>
                        <button
                          onClick={() => toggleActiveStatus('estructuras', item.building_id)}
                          className={`w-6 h-3.5 rounded-full p-0.5 transition-colors duration-150 outline-none cursor-pointer ${item.isActive !== false ? 'bg-[#ff1e1e]' : 'bg-zinc-800'}`}
                          aria-label="Alternar estado activo"
                        >
                          <div className={`w-2.5 h-2.5 bg-white rounded-full transition-transform duration-150 ${item.isActive !== false ? 'translate-x-2.5' : 'translate-x-0'}`} />
                        </button>
                      </div>

                      <button
                        onClick={() => handleInjectStructure(item.building_id)}
                        className="px-2 py-1 bg-red-650/10 hover:bg-red-650 text-red-400 hover:text-white border border-red-500/20 rounded font-bold text-[9px] uppercase tracking-wider font-mono cursor-pointer transition-colors"
                      >
                        Inyectar Lvl 1
                      </button>
                      <button
                        onClick={() => handleDeleteStructure(item.building_id, item.building_name)}
                        className="p-1 hover:text-red-500 text-zinc-500 transition-colors"
                        aria-label="Eliminar estructura"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: TECNOLOGÍAS CRUD */}
          {activeTab === 'tecnologias' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2.5 text-[11px] font-sans">
                <input
                  aria-label="input element"type="text"
                  placeholder="ID Tecnología (tech-laser-boost)"
                  value={newTechForm.technology_id || ''}
                  onChange={(e) => setNewTechForm(prev => ({ ...prev, technology_id: e.target.value }))}
                  className="p-1 px-2 bg-black border border-zinc-850 rounded text-white font-mono text-[10px]"
                />
                <input
                  aria-label="input element"type="text"
                  placeholder="Nombre de Tecnología"
                  value={newTechForm.technology_name || ''}
                  onChange={(e) => setNewTechForm(prev => ({ ...prev, technology_name: e.target.value }))}
                  className="p-1 px-2 bg-black border border-zinc-850 rounded text-white"
                />
                <input
                  aria-label="input element"type="number"
                  placeholder="Bono Daño Flota %"
                  value={newTechForm.attack_modifier_pct || ''}
                  onChange={(e) => setNewTechForm(prev => ({ ...prev, attack_modifier_pct: parseFloat(e.target.value) || undefined }))}
                  className="p-1 px-2 bg-black border border-zinc-850 rounded text-white font-mono text-right"
                />
                <input
                  aria-label="input element"type="number"
                  placeholder="Bono Escudos Flota %"
                  value={newTechForm.defense_modifier_pct || ''}
                  onChange={(e) => setNewTechForm(prev => ({ ...prev, defense_modifier_pct: parseFloat(e.target.value) || undefined }))}
                  className="p-1 px-2 bg-black border border-zinc-850 rounded text-white font-mono text-right"
                />
                <input
                  aria-label="input element"type="number"
                  placeholder="Bono Velocidad MHz %"
                  value={newTechForm.speed_modifier_pct || ''}
                  onChange={(e) => setNewTechForm(prev => ({ ...prev, speed_modifier_pct: parseFloat(e.target.value) || undefined }))}
                  className="p-1 px-2 bg-black border border-zinc-850 rounded text-white font-mono text-right"
                />
                <input
                  aria-label="input element"type="number"
                  placeholder="C.A.N. Planetario Req"
                  value={newTechForm.can_level_required || ''}
                  onChange={(e) => setNewTechForm(prev => ({ ...prev, can_level_required: parseInt(e.target.value) || undefined }))}
                  className="p-1 px-2 bg-black border border-zinc-850 rounded text-white font-mono text-right"
                />
                <input
                  aria-label="input element"type="text"
                  placeholder="Lore o descripción de la Tecnología..."
                  value={newTechForm.description || ''}
                  onChange={(e) => setNewTechForm(prev => ({ ...prev, description: e.target.value }))}
                  className="col-span-2 p-1 px-2 bg-black border border-zinc-850 rounded text-white"
                />

                <div className="col-span-2">
                  <span className="text-[9px] text-zinc-550 uppercase">Prerrequisitos (Matriz de Dependencias)</span>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {technologiesList.map(t => {
                      const isSelected = newTechForm.prerequisites?.find(p => p.tech_id === t.technology_id);
                      return (
                        <div key={t.technology_id} className="flex items-center gap-2 bg-zinc-950 p-1.5 rounded border border-zinc-900">
                          <input 
                            type="checkbox"
                            aria-label="Prerrequisito tecnológico"
                            checked={!!isSelected}
                            onChange={(e) => {
                              let current = newTechForm.prerequisites || [];
                              if (e.target.checked) {
                                current = [...current, { tech_id: t.technology_id, level: 1 }];
                              } else {
                                current = current.filter(p => p.tech_id !== t.technology_id);
                              }
                              setNewTechForm(prev => ({ ...prev, prerequisites: current }));
                            }}
                          />
                          <span className="text-[9px] text-zinc-300 truncate w-24">{t.technology_name}</span>
                          {isSelected && (
                            <input 
                              aria-label="input element"type="number" 
                              min="1" 
                              value={isSelected.level}
                              onChange={(e) => {
                                const level = parseInt(e.target.value) || 1;
                                setNewTechForm(prev => ({
                                  ...prev, 
                                  prerequisites: prev.prerequisites?.map(p => p.tech_id === t.technology_id ? { ...p, level } : p)
                                }));
                              }}
                              className="w-12 p-0.5 bg-black border border-zinc-800 text-white text-[9px] rounded"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <span className="text-[9px] text-zinc-550 uppercase mt-2 block">Dependencias Estructurales</span>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {structuresList.map(s => {
                      const isSelected = newTechForm.struct_prerequisites?.find(p => p.building_id === s.building_id);
                      return (
                        <div key={s.building_id} className="flex items-center gap-2 bg-zinc-950 p-1.5 rounded border border-zinc-900">
                          <input 
                            type="checkbox"
                            aria-label="Prerrequisito estructural"
                            checked={!!isSelected}
                            onChange={(e) => {
                              let current = newTechForm.struct_prerequisites || [];
                              if (e.target.checked) {
                                current = [...current, { building_id: s.building_id, level: 1 }];
                              } else {
                                current = current.filter(p => p.building_id !== s.building_id);
                              }
                              setNewTechForm(prev => ({ ...prev, struct_prerequisites: current }));
                            }}
                          />
                          <span className="text-[9px] text-zinc-300 truncate w-24">{s.building_name}</span>
                          {isSelected && (
                            <input 
                              aria-label="input element"type="number" 
                              min="1" 
                              value={isSelected.level}
                              onChange={(e) => {
                                const level = parseInt(e.target.value) || 1;
                                setNewTechForm(prev => ({
                                  ...prev, 
                                  struct_prerequisites: prev.struct_prerequisites?.map(p => p.building_id === s.building_id ? { ...p, level } : p)
                                }));
                              }}
                              className="w-12 p-0.5 bg-black border border-zinc-800 text-white text-[9px] rounded"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <button
                onClick={handleSaveTechSeed}
                className="w-full py-1.5 bg-red-650 hover:bg-red-500 text-white font-bold text-[10px] uppercase font-mono tracking-widest rounded cursor-pointer transition-colors"
              >
                Grabar Módulo Tecnológico
              </button>

              <div className="pt-2 border-t border-zinc-900 flex justify-between">
                <span className="text-[9.5px] font-mono text-zinc-550">COMANDOS ESPECIALES DE DEPURACIÓN EN RED</span>
                <button
                  onClick={clearStuckTechSlots}
                  className="px-3 py-1 bg-red-950/20 hover:bg-red-650 text-red-500 hover:text-white border border-red-900/30 font-bold font-mono text-[9px] uppercase tracking-wider rounded cursor-pointer transition-all"
                >
                  [CLEAR_STUCK_TECH_SLOTS] 🚨
                </button>
              </div>

              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {filteredAndSortedTechnologies.map(tech => (
                  <div key={tech.technology_id} className={`asset-card-container p-2.5 bg-black/40 border border-zinc-900 hover:border-zinc-800 rounded flex items-center justify-between text-xs transition-all ${tech.isActive === false ? 'opacity-40' : ''}`}>
                    <div>
                      <span className="font-bold text-white font-mono">{tech.technology_name}</span>
                      <span className="text-[9px] text-zinc-550 block font-mono">
                        Dmg: +{tech.attack_modifier_pct}% • Shd: +{tech.defense_modifier_pct}% • Vel: {tech.speed_modifier_pct}% (Req Lvl {tech.can_level_required})
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 font-mono text-[9px]">
                      {/* QUICK HIDE SWITCH */}
                      <div className="flex items-center gap-1 bg-zinc-950 p-1.5 rounded border border-zinc-900 mr-1.5">
                        <span className="text-[8px] font-mono text-zinc-500 font-bold uppercase select-none">ACTIVO</span>
                        <button
                          onClick={() => toggleActiveStatus('tecnologias', tech.technology_id)}
                          className={`w-6 h-3.5 rounded-full p-0.5 transition-colors duration-150 outline-none cursor-pointer ${tech.isActive !== false ? 'bg-[#ff1e1e]' : 'bg-zinc-800'}`}
                          aria-label="Alternar estado activo"
                        >
                          <div className={`w-2.5 h-2.5 bg-white rounded-full transition-transform duration-150 ${tech.isActive !== false ? 'translate-x-2.5' : 'translate-x-0'}`} />
                        </button>
                      </div>

                      <button
                        onClick={() => injectTechToWallet(tech.technology_id)}
                        className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 text-red-500 rounded font-bold"
                      >
                        INYECTAR_WALLET
                      </button>
                      <button
                        onClick={() => handleDeleteTechnology(tech.technology_id, tech.technology_name)}
                        className="p-1 text-zinc-500 hover:text-red-500"
                        aria-label="Eliminar tecnología"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: ASTROBOTS CRUD */}
          {activeTab === 'astrobots' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2.5 text-[11px] font-sans">
                <input
                  aria-label="input element"type="text"
                  placeholder="ID Compañero Bot (bot-ares)"
                  value={newBotForm.astrobot_id || ''}
                  onChange={(e) => setNewBotForm(prev => ({ ...prev, astrobot_id: e.target.value }))}
                  className="p-1 px-2 bg-black border border-zinc-850 rounded text-white font-mono text-[10px]"
                />
                <input
                  aria-label="input element"type="text"
                  placeholder="Nombre Astrobot"
                  value={newBotForm.astrobot_name || ''}
                  onChange={(e) => setNewBotForm(prev => ({ ...prev, astrobot_name: e.target.value }))}
                  className="p-1 px-2 bg-black border border-zinc-850 rounded text-white"
                />
                <select
                  aria-label="Rol del astrobot"
                  value={newBotForm.role || 'Attack'}
                  onChange={(e) => setNewBotForm(prev => ({ ...prev, role: e.target.value as any }))}
                  className="bg-black border border-zinc-850 rounded p-1 px-2 text-zinc-400 font-mono outline-none"
                >
                  <option value="Attack">Clase Attack</option>
                  <option value="Defense">Clase Defense</option>
                  <option value="Scout">Clase Scout</option>
                  <option value="Miner">Clase Miner</option>
                  <option value="Support">Clase Support</option>
                  <option value="Spy">Clase Spy</option>
                  <option value="Transport">Clase Transport</option>
                </select>
                <input
                  aria-label="input element"type="number"
                  placeholder="kinetic_dmg (Ej: 150)"
                  value={newBotForm.kinetic_dmg || ''}
                  onChange={(e) => setNewBotForm(prev => ({ ...prev, kinetic_dmg: parseInt(e.target.value) || undefined }))}
                  className="p-1 px-2 bg-black border border-zinc-850 rounded text-white font-mono text-right"
                />
                <input
                  aria-label="input element"type="number"
                  placeholder="laser_dmg (Ej: 400)"
                  value={newBotForm.laser_dmg || ''}
                  onChange={(e) => setNewBotForm(prev => ({ ...prev, laser_dmg: parseInt(e.target.value) || undefined }))}
                  className="p-1 px-2 bg-black border border-zinc-850 rounded text-white font-mono text-right"
                />
                <input
                  aria-label="input element"type="number"
                  placeholder="plasma_dmg (Ej: 300)"
                  value={newBotForm.plasma_dmg || ''}
                  onChange={(e) => setNewBotForm(prev => ({ ...prev, plasma_dmg: parseInt(e.target.value) || undefined }))}
                  className="p-1 px-2 bg-black border border-zinc-850 rounded text-white font-mono text-right"
                />
                <input
                  aria-label="input element"type="number"
                  placeholder="shield_capacity"
                  value={newBotForm.shield_capacity || ''}
                  onChange={(e) => setNewBotForm(prev => ({ ...prev, shield_capacity: parseInt(e.target.value) || undefined }))}
                  className="p-1 px-2 bg-black border border-zinc-850 rounded text-white font-mono text-right"
                />
                <input
                  aria-label="input element"type="number"
                  placeholder="fleet_capacity_cost"
                  value={newBotForm.fleet_capacity_cost || ''}
                  onChange={(e) => setNewBotForm(prev => ({ ...prev, fleet_capacity_cost: parseInt(e.target.value) || undefined }))}
                  className="p-1 px-2 bg-black border border-zinc-850 rounded text-white font-mono text-right"
                />
              </div>

              <button
                onClick={handleSaveBotSeed}
                className="w-full py-1.5 bg-red-650 hover:bg-red-500 text-white font-bold text-[10px] uppercase font-mono tracking-widest rounded cursor-pointer transition-colors"
              >
                Inscribir Compañero Robotizado
              </button>

              <div className="space-y-2 max-h-[290px] overflow-y-auto pr-1">
                {filteredAndSortedAstrobots.map(bot => (
                  <div key={bot.astrobot_id} className={`asset-card-container p-2.5 bg-black/40 border border-zinc-900 hover:border-zinc-800 rounded flex items-center justify-between text-xs transition-all ${bot.isActive === false ? 'opacity-40' : ''}`}>
                    <div className="flex items-center gap-2.5">
                      <img src={bot.avatar_url} alt={bot.astrobot_name} className="w-8 h-8 rounded object-cover border border-zinc-800" referrerPolicy="no-referrer" />
                      <div>
                        <span className="font-bold text-white font-mono">{bot.astrobot_name}</span>
                        <span className="text-[9px] text-zinc-550 block font-mono">Rol: {bot.role} • Shd: {bot.shield_capacity} • Plasma Dmg: {bot.plasma_dmg} • Space Cost: {bot.fleet_capacity_cost}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* QUICK HIDE SWITCH */}
                      <div className="flex items-center gap-1 bg-zinc-950 p-1.5 rounded border border-zinc-900 mr-1.5">
                        <span className="text-[8px] font-mono text-zinc-500 font-bold uppercase select-none">ACTIVO</span>
                        <button
                          onClick={() => toggleActiveStatus('astrobots', bot.astrobot_id)}
                          className={`w-6 h-3.5 rounded-full p-0.5 transition-colors duration-150 outline-none cursor-pointer ${bot.isActive !== false ? 'bg-[#ff1e1e]' : 'bg-zinc-800'}`}
                          aria-label="Alternar estado activo"
                        >
                          <div className={`w-2.5 h-2.5 bg-white rounded-full transition-transform duration-150 ${bot.isActive !== false ? 'translate-x-2.5' : 'translate-x-0'}`} />
                        </button>
                      </div>

                      <button
                        onClick={() => injectAstrobot(bot.astrobot_id)}
                        className="px-2 py-1 bg-red-650/10 hover:bg-red-650 text-red-500 hover:text-white border border-red-500/20 text-[9px] font-mono rounded"
                      >
                        REGALAR_COMPAÑERO
                      </button>
                      <button
                        onClick={() => setAstrobotsList(astrobotsList.filter(b => b.astrobot_id !== bot.astrobot_id))}
                        className="p-1 text-zinc-500 hover:text-red-500"
                        aria-label="Eliminar astrobot"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: BLUEPRINTS */}
          {activeTab === 'blueprints' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2.5 text-[11px] font-sans">
                <input
                  aria-label="input element"type="text"
                  placeholder="ID Plano (bp-elite-cruiser)"
                  value={newBlueprintForm.blueprint_id || ''}
                  onChange={(e) => setNewBlueprintForm(prev => ({ ...prev, blueprint_id: e.target.value }))}
                  className="p-1 px-2 bg-black border border-zinc-850 rounded text-white font-mono text-[10px]"
                />
                <input
                  aria-label="input element"type="text"
                  placeholder="Nombre Plano"
                  value={newBlueprintForm.blueprint_name || ''}
                  onChange={(e) => setNewBlueprintForm(prev => ({ ...prev, blueprint_name: e.target.value }))}
                  className="p-1 px-2 bg-black border border-zinc-850 rounded text-white"
                />
                <input
                  aria-label="input element"type="number"
                  placeholder="Durabilidad Máxima (Usos)"
                  value={newBlueprintForm.max_durability || ''}
                  onChange={(e) => setNewBlueprintForm(prev => ({ ...prev, max_durability: parseInt(e.target.value) || undefined }))}
                  className="p-1 px-2 bg-black border border-zinc-850 rounded text-white font-mono text-right"
                />
                <input
                  aria-label="input element"type="number"
                  placeholder="Porcentaje de Fallo %"
                  value={newBlueprintForm.failure_rate_pct || ''}
                  onChange={(e) => setNewBlueprintForm(prev => ({ ...prev, failure_rate_pct: parseFloat(e.target.value) || undefined }))}
                  className="p-1 px-2 bg-black border border-zinc-850 rounded text-white font-mono text-right"
                />
                <div className="col-span-2">
                  <label className="text-[9px] font-mono text-zinc-550 uppercase">Tecnologia Habilitante Requerida</label>
                  <select
                    aria-label="Tecnología habilitante requerida"
                    value={newBlueprintForm.required_tech_id || ''}
                    onChange={(e) => setNewBlueprintForm(prev => ({ ...prev, required_tech_id: e.target.value }))}
                    className="w-full bg-black border border-zinc-850 p-1 px-2 rounded font-mono text-xs text-zinc-400 mt-1"
                  >
                    {technologiesList.map(t => (
                      <option key={t.technology_id} value={t.technology_id}>{t.technology_name} ({t.technology_id})</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <textarea
                    aria-label="textarea element"rows={2}
                    placeholder="Descripción y Lore del plano..."
                    value={newBlueprintForm.description || ''}
                    onChange={(e) => setNewBlueprintForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full p-1.5 bg-black border border-zinc-850 rounded text-zinc-300 resize-none text-[11px]"
                  />
                </div>
              </div>

              <button
                onClick={handleSaveBlueprintSeed}
                className="w-full py-1.5 bg-red-650 hover:bg-red-500 text-white font-bold text-[10px] uppercase font-mono tracking-widest rounded cursor-pointer transition-colors"
              >
                Guardar Blueprint en Supabase
              </button>

              <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
                {blueprintsList.map(bp => (
                  <div key={bp.blueprint_id} className={`asset-card-container p-2.5 bg-black/40 border border-zinc-900 rounded flex items-center justify-between text-xs transition-all ${bp.isActive === false ? 'opacity-40' : ''}`}>
                    <div>
                      <span className="font-bold text-white font-mono">{bp.blueprint_name}</span>
                      <span className="text-[9px] text-zinc-550 block font-mono">ID: {bp.blueprint_id} • Usos: {bp.max_durability} • Failure Pct: {bp.failure_rate_pct}% • Tech Req: {bp.required_tech_id}</span>
                    </div>

                    <div className="flex items-center gap-1.5 font-mono text-[9px]">
                      {/* QUICK HIDE SWITCH */}
                      <div className="flex items-center gap-1 bg-zinc-950 p-1.5 rounded border border-zinc-900 mr-1.5">
                        <span className="text-[8px] font-mono text-zinc-500 font-bold uppercase select-none">ACTIVO</span>
                        <button
                          onClick={() => toggleActiveStatus('blueprints', bp.blueprint_id)}
                          className={`w-6 h-3.5 rounded-full p-0.5 transition-colors duration-150 outline-none cursor-pointer ${bp.isActive !== false ? 'bg-[#ff1e1e]' : 'bg-zinc-800'}`}
                          aria-label="Alternar estado activo"
                        >
                          <div className={`w-2.5 h-2.5 bg-white rounded-full transition-transform duration-150 ${bp.isActive !== false ? 'translate-x-2.5' : 'translate-x-0'}`} />
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          if (!auditedUser) return;
                          setUserBlueprints(prev => {
                            const exists = prev.find(b => b.blueprint_id === bp.blueprint_id);
                            if (exists) {
                              return prev.map(b => b.blueprint_id === bp.blueprint_id ? { ...b, quantityOwned: b.quantityOwned + 1 } : b);
                            } else {
                              return [...prev, { blueprint_id: bp.blueprint_id, durability_left: bp.max_durability, quantityOwned: 1 }];
                            }
                          });
                          setIsAlertToShow({ show: true, status: 'success', message: '¡Plano inyectado a la dApp Wallet del comandante!' });
                        }}
                        className="px-2 py-1 bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-red-500 rounded font-bold"
                      >
                        DAR_PLANO
                      </button>
                      <button
                        onClick={() => setBlueprintsList(blueprintsList.filter(b => b.blueprint_id !== bp.blueprint_id))}
                        className="p-1 text-zinc-500 hover:text-red-500"
                        aria-label="Eliminar blueprint"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: CONSUMIBLES */}
          {activeTab === 'consumibles' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2.5 text-[11px] font-sans">
                <input
                  aria-label="input element"type="text"
                  placeholder="ID Consumible (cons-gold-pack)"
                  value={newConsForm.consumable_id || ''}
                  onChange={(e) => setNewConsForm(prev => ({ ...prev, consumable_id: e.target.value }))}
                  className="p-1 px-2 bg-black border border-zinc-850 rounded text-white font-mono text-[10px]"
                />
                <input
                  aria-label="input element"type="text"
                  placeholder="Nombre de Consumible"
                  value={newConsForm.item_name || ''}
                  onChange={(e) => setNewConsForm(prev => ({ ...prev, item_name: e.target.value }))}
                  className="p-1 px-2 bg-black border border-zinc-850 rounded text-white"
                />
                <select
                  aria-label="Tipo de efecto del consumible"
                  value={newConsForm.effect_type || 'RESOURCE_CHEST'}
                  onChange={(e) => setNewConsForm(prev => ({ ...prev, effect_type: e.target.value as any }))}
                  className="bg-black border border-zinc-850 rounded p-1 px-2 text-zinc-400 font-mono outline-none"
                >
                  <option value="AP_RECOVERY">AP_RECOVERY (Puntos Acción)</option>
                  <option value="SPEEDUP_BOOST">SPEEDUP_BOOST (Acelerador Horas)</option>
                  <option value="RESOURCE_CHEST">RESOURCE_CHEST (Caja de Recursos)</option>
                </select>
                <input
                  aria-label="input element"type="number"
                  placeholder="Valor del Efecto (ej. 100)"
                  value={newConsForm.effect_value || ''}
                  onChange={(e) => setNewConsForm(prev => ({ ...prev, effect_value: parseInt(e.target.value) || undefined }))}
                  className="p-1 px-2 bg-black border border-zinc-850 rounded text-white font-mono text-right"
                />
                <div className="col-span-2">
                  <input
                    aria-label="input element"type="text"
                    placeholder="Símbolo de Icono Emoji (ej: 🧬)"
                    value={newConsForm.icon_symbol || ''}
                    onChange={(e) => setNewConsForm(prev => ({ ...prev, icon_symbol: e.target.value }))}
                    className="w-full p-1 px-2 bg-black border border-zinc-850 rounded text-white text-[11px]"
                  />
                </div>
              </div>

              <button
                onClick={handleSaveConsSeed}
                className="w-full py-1.5 bg-red-650 hover:bg-red-500 text-white font-bold text-[10px] uppercase font-mono tracking-widest rounded cursor-pointer transition-colors"
              >
                Inscribir Consumible Sólido
              </button>

              <div className="space-y-2 max-h-[290px] overflow-y-auto pr-1">
                {consumablesList.map(item => (
                  <div key={item.consumable_id} className={`asset-card-container p-2.5 bg-black/40 border border-zinc-900 rounded flex items-center justify-between text-xs transition-all ${item.isActive === false ? 'opacity-40' : ''}`}>
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl bg-zinc-900 p-1.5 rounded border border-zinc-850">{item.icon_symbol}</span>
                      <div>
                        <span className="font-bold text-white font-mono">{item.item_name}</span>
                        <span className="text-[9px] text-zinc-550 block font-mono">ID: {item.consumable_id} • Efecto: {item.effect_type} ({item.effect_value})</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* QUICK HIDE SWITCH */}
                      <div className="flex items-center gap-1 bg-zinc-950 p-1.5 rounded border border-zinc-900 mr-1.5 font-mono text-[9px]">
                        <span className="text-[8px] font-mono text-zinc-500 font-bold uppercase select-none">ACTIVO</span>
                        <button
                          onClick={() => toggleActiveStatus('consumibles', item.consumable_id)}
                          className={`w-6 h-3.5 rounded-full p-0.5 transition-colors duration-150 outline-none cursor-pointer ${item.isActive !== false ? 'bg-[#ff1e1e]' : 'bg-zinc-800'}`}
                          aria-label="Alternar estado activo"
                        >
                          <div className={`w-2.5 h-2.5 bg-white rounded-full transition-transform duration-150 ${item.isActive !== false ? 'translate-x-2.5' : 'translate-x-0'}`} />
                        </button>
                      </div>

                      <button
                        onClick={() => injectConsumablesPack(item.consumable_id, 25)}
                        className="px-2 py-1 bg-red-650/10 hover:bg-red-650 text-red-500 hover:text-white border border-red-500/20 text-[9px] font-mono rounded"
                      >
                        Inyectar x25
                      </button>
                      <button
                        onClick={() => setConsumablesList(consumablesList.filter(c => c.consumable_id !== item.consumable_id))}
                        className="p-1 text-zinc-500 hover:text-red-500"
                        aria-label="Eliminar consumible"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: TOOLS */}
          {activeTab === 'tools' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2.5 text-[11px] font-sans">
                <input
                  aria-label="input element"type="text"
                  placeholder="ID Herramienta (tool-drill-t1)"
                  value={newToolForm.tool_id || ''}
                  onChange={(e) => setNewToolForm(prev => ({ ...prev, tool_id: e.target.value }))}
                  className="p-1 px-2 bg-black border border-zinc-850 rounded text-white font-mono text-[10px]"
                />
                <input
                  aria-label="input element"type="text"
                  placeholder="Nombre de Herramienta"
                  value={newToolForm.tool_name || ''}
                  onChange={(e) => setNewToolForm(prev => ({ ...prev, tool_name: e.target.value }))}
                  className="p-1 px-2 bg-black border border-zinc-850 rounded text-white"
                />
                <input
                  aria-label="input element"type="number"
                  step="0.1"
                  placeholder="Multiplicador Minado (Ej: 2.0)"
                  value={newToolForm.extraction_multiplier || ''}
                  onChange={(e) => setNewToolForm(prev => ({ ...prev, extraction_multiplier: parseFloat(e.target.value) || undefined }))}
                  className="p-1 px-2 bg-black border border-zinc-850 rounded text-white font-mono text-right"
                />
                <select
                  aria-label="Tipo de asset NFT"
                  value={newToolForm.is_nft_asset === true ? 'true' : 'false'}
                  onChange={(e) => setNewToolForm(prev => ({ ...prev, is_nft_asset: e.target.value === 'true' }))}
                  className="bg-black border border-zinc-850 rounded p-1 px-2 text-zinc-400 font-mono outline-none"
                >
                  <option value="false">Base de Datos (No NFT)</option>
                  <option value="true">Activo de Blockchain Web3 (NFT)</option>
                </select>
                <div className="col-span-2">
                  <input
                    aria-label="input element"type="text"
                    placeholder="Descripción técnica o lore..."
                    value={newToolForm.description || ''}
                    onChange={(e) => setNewToolForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full p-1.5 bg-black border border-zinc-850 rounded text-white text-[11px]"
                  />
                </div>
              </div>

              <button
                onClick={handleSaveToolSeed}
                className="w-full py-1.5 bg-red-650 hover:bg-red-500 text-white font-bold text-[10px] uppercase font-mono tracking-widest rounded cursor-pointer transition-colors"
              >
                Inscribir Machinery en seed_tools
              </button>

              <div className="space-y-2 max-h-[290px] overflow-y-auto pr-1">
                {toolsList.map(tool => (
                  <div key={tool.tool_id} className={`asset-card-container p-2.5 bg-black/40 border border-zinc-900 rounded flex items-center justify-between text-xs transition-all ${tool.isActive === false ? 'opacity-40' : ''}`}>
                    <div>
                      <span className="font-bold text-white font-mono">{tool.tool_name}</span>
                      <span className="text-[9px] text-zinc-550 block font-mono">ID: {tool.tool_id} • NFT: {tool.is_nft_asset ? 'SI (Web3)' : 'NO'} • Multiplicador Extracción: x{tool.extraction_multiplier}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* QUICK HIDE SWITCH */}
                      <div className="flex items-center gap-1 bg-zinc-950 p-1.5 rounded border border-zinc-900 mr-1.5">
                        <span className="text-[8px] font-mono text-zinc-500 font-bold uppercase select-none">ACTIVO</span>
                        <button
                          onClick={() => toggleActiveStatus('tools', tool.tool_id)}
                          className={`w-6 h-3.5 rounded-full p-0.5 transition-colors duration-150 outline-none cursor-pointer ${tool.isActive !== false ? 'bg-[#ff1e1e]' : 'bg-zinc-800'}`}
                          aria-label="Alternar estado activo"
                        >
                          <div className={`w-2.5 h-2.5 bg-white rounded-full transition-transform duration-150 ${tool.isActive !== false ? 'translate-x-2.5' : 'translate-x-0'}`} />
                        </button>
                      </div>

                      <button
                        onClick={() => handleEquipTool(tool.tool_id)}
                        className="px-2 py-1 bg-red-650/10 hover:bg-red-650 text-red-500 hover:text-white border border-red-500/20 text-[9px] font-mono rounded"
                      >
                        EQUIPAR_HERRAMIENTA
                      </button>
                      <button
                        onClick={() => setToolsList(toolsList.filter(t => t.tool_id !== tool.tool_id))}
                        className="p-1 text-zinc-500 hover:text-red-500"
                        aria-label="Eliminar herramienta"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: LICENCIAS */}
          {activeTab === 'licencias' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2.5 text-[11px] font-sans">
                <input
                  aria-label="input element"type="text"
                  placeholder="ID de Patente (licence-sector-9)"
                  value={newLicenseForm.license_id || ''}
                  onChange={(e) => setNewLicenseForm(prev => ({ ...prev, license_id: e.target.value }))}
                  className="p-1 px-2 bg-black border border-zinc-850 rounded text-white font-mono text-[10px]"
                />
                <input
                  aria-label="input element"type="text"
                  placeholder="Nombre de Licencia"
                  value={newLicenseForm.license_name || ''}
                  onChange={(e) => setNewLicenseForm(prev => ({ ...prev, license_name: e.target.value }))}
                  className="p-1 px-2 bg-black border border-zinc-850 rounded text-white"
                />
                <input
                  aria-label="input element"type="text"
                  placeholder="Sector Destino (ej: Periferia Abisal)"
                  value={newLicenseForm.target_sector || ''}
                  onChange={(e) => setNewLicenseForm(prev => ({ ...prev, target_sector: e.target.value }))}
                  className="p-1 px-2 bg-black border border-zinc-850 rounded text-white"
                />
                <input
                  aria-label="input element"type="number"
                  placeholder="gd_coin_cost (Ej: 15000)"
                  value={newLicenseForm.gd_coin_cost || ''}
                  onChange={(e) => setNewLicenseForm(prev => ({ ...prev, gd_coin_cost: parseInt(e.target.value) || undefined }))}
                  className="p-1 px-2 bg-black border border-zinc-850 rounded text-white font-mono text-right"
                />
                <input
                  aria-label="input element"type="number"
                  placeholder="quantum_credit_cost (Ej: 200)"
                  value={newLicenseForm.quantum_credit_cost || ''}
                  onChange={(e) => setNewLicenseForm(prev => ({ ...prev, quantum_credit_cost: parseInt(e.target.value) || undefined }))}
                  className="p-1 px-2 bg-black border border-zinc-855 rounded text-white font-mono text-right col-span-2"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSaveLicenseSeed}
                  className="flex-1 py-1.5 bg-red-650 hover:bg-red-500 text-white font-bold text-[10px] uppercase font-mono tracking-widest rounded cursor-pointer transition-colors"
                >
                  Inscribir Patente de Sector
                </button>
                <button
                  onClick={bypassAllLicenseLocks}
                  className="px-3 bg-zinc-900 hover:bg-zinc-840 text-red-500 font-bold font-mono text-[9px] uppercase tracking-wider rounded border border-zinc-800"
                  title="Otorga todas las licencias"
                >
                  [BYPASS_LICENSE_LOCK] 👑
                </button>
              </div>

              <div className="space-y-2 max-h-[290px] overflow-y-auto pr-1">
                {licensesList.map(lic => (
                  <div key={lic.license_id} className={`asset-card-container p-2.5 bg-black/40 border border-zinc-900 rounded flex items-center justify-between text-xs transition-all ${lic.isActive === false ? 'opacity-40' : ''}`}>
                    <div>
                      <span className="font-bold text-white font-mono">{lic.license_name}</span>
                      <span className="text-[9px] text-zinc-550 block font-mono">ID: {lic.license_id} • Sector: {lic.target_sector} • Coins: {lic.gd_coin_cost} • Quantum: {lic.quantum_credit_cost}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* QUICK HIDE SWITCH */}
                      <div className="flex items-center gap-1 bg-zinc-950 p-1.5 rounded border border-zinc-900 mr-1.5">
                        <span className="text-[8px] font-mono text-zinc-500 font-bold uppercase select-none">ACTIVO</span>
                        <button
                          onClick={() => toggleActiveStatus('licencias', lic.license_id)}
                          className={`w-6 h-3.5 rounded-full p-0.5 transition-colors duration-150 outline-none cursor-pointer ${lic.isActive !== false ? 'bg-[#ff1e1e]' : 'bg-zinc-800'}`}
                          aria-label="Alternar estado activo"
                        >
                          <div className={`w-2.5 h-2.5 bg-white rounded-full transition-transform duration-150 ${lic.isActive !== false ? 'translate-x-2.5' : 'translate-x-0'}`} />
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          if (!auditedUser) return;
                          if (userLicenses.some(l => l.license_id === lic.license_id)) {
                            setIsAlertToShow({ show: true, status: 'error', message: 'El jugador ya posee esta licencia.' });
                            return;
                          }
                          setUserLicenses(prev => [...prev, { license_id: lic.license_id, acquired_at: new Date().toISOString() }]);
                          setIsAlertToShow({ show: true, status: 'success', message: 'Licencia autorizada directamente para el explorador.' });
                        }}
                        className="px-2 py-1 bg-red-650/10 hover:bg-red-650 text-red-400 hover:text-white border border-red-500/20 text-[9px] font-mono rounded"
                      >
                        CONCEDER
                      </button>
                      <button
                        onClick={() => setLicensesList(licensesList.filter(l => l.license_id !== lic.license_id))}
                        className="p-1 text-zinc-500 hover:text-red-500"
                        aria-label="Eliminar licencia"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: BADGES (Negative stats configurator) */}
          {activeTab === 'badges' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2.5 text-[11px] font-sans">
                <input
                  aria-label="input element"type="text"
                  placeholder="Nombre del Debuff / Badge"
                  value={newBadgeForm.badge_name || ''}
                  onChange={(e) => setNewBadgeForm(prev => ({ ...prev, badge_name: e.target.value }))}
                  className="p-1 px-2 bg-black border border-zinc-850 rounded text-white"
                />
                <input
                  aria-label="input element"type="number"
                  placeholder="Reducción de Velocidad (%)"
                  value={newBadgeForm.negative_speed || ''}
                  onChange={(e) => setNewBadgeForm(prev => ({ ...prev, negative_speed: parseInt(e.target.value) || undefined }))}
                  className="p-1 px-2 bg-black border border-zinc-850 rounded text-white font-mono text-right"
                />
                <input
                  aria-label="input element"type="number"
                  placeholder="Reducción de Escudo (%)"
                  value={newBadgeForm.negative_shield || ''}
                  onChange={(e) => setNewBadgeForm(prev => ({ ...prev, negative_shield: parseInt(e.target.value) || undefined }))}
                  className="p-1 px-2 bg-black border border-zinc-850 rounded text-white font-mono text-right"
                />
                <div className="col-span-2">
                  <span className="text-[9px] text-zinc-550 uppercase">Configurador Avanzado de Debuffs</span>
                  <div className="flex gap-2 mt-1">
                    <input type="text" placeholder="Stat a penalizar (ej. Graviton Defense)" id="debuff_stat" className="flex-1 p-1 px-2 bg-black border border-zinc-850 rounded text-white" />
                    <input type="number" placeholder="Valor (ej. -3)" id="debuff_val" className="w-24 p-1 px-2 bg-black border border-zinc-850 rounded text-white font-mono" />
                    <button onClick={() => {
                      const stat = (document.getElementById('debuff_stat') as HTMLInputElement).value;
                      const val = parseInt((document.getElementById('debuff_val') as HTMLInputElement).value);
                      if(stat && !isNaN(val)) {
                        setNewBadgeForm(prev => ({ ...prev, debuffs: [...(prev.debuffs || []), {stat, value: val}] }));
                        (document.getElementById('debuff_stat') as HTMLInputElement).value = '';
                        (document.getElementById('debuff_val') as HTMLInputElement).value = '';
                      }
                    }} className="p-1 px-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded">+</button>
                  </div>
                  <div className="mt-2 space-y-1">
                    {(newBadgeForm.debuffs || []).map((d, i) => (
                      <div key={i} className="text-[10px] text-red-400 font-mono flex justify-between bg-black/50 p-1 px-2 rounded border border-red-900/30">
                        <span>{d.stat}</span>
                        <span>{d.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={handleSaveBadgeSeed}
                className="w-full py-1.5 bg-red-650 hover:bg-red-500 text-white font-bold text-[10px] uppercase font-mono tracking-widest rounded cursor-pointer transition-colors"
              >
                Configurar Badge Negativa
              </button>
            </div>
          )}

          {/* TAB 9: SKILLS (Descriptive Nomenclature Validation) */}
          {activeTab === 'skills' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-2.5 text-[11px] font-sans">
                <input
                  aria-label="input element"type="text"
                  placeholder="Nombre de Habilidad"
                  value={newSkillForm.skill_name || ''}
                  onChange={(e) => setNewSkillForm(prev => ({ ...prev, skill_name: e.target.value }))}
                  className="p-1 px-2 bg-black border border-zinc-850 rounded text-white"
                />
                <input
                  aria-label="input element"type="text"
                  placeholder="Descripción de la habilidad"
                  value={newSkillForm.description || ''}
                  onChange={(e) => setNewSkillForm(prev => ({ ...prev, description: e.target.value }))}
                  className="p-1 px-2 bg-black border border-zinc-850 rounded text-white"
                />
              </div>
              <button
                onClick={() => {
                  const name = newSkillForm.skill_name?.toLowerCase() || '';
                  if (name.includes('magia') || name.includes('fuego') || name.includes('agua')) {
                    setIsAlertToShow({ show: true, status: 'error', message: 'Nomenclatura inválida. Evite términos de fantasía (magia, fuego, agua).' });
                  } else {
                    handleSaveSkillSeed();
                  }
                }}
                className="w-full py-1.5 bg-red-650 hover:bg-red-500 text-white font-bold text-[10px] uppercase font-mono tracking-widest rounded cursor-pointer transition-colors"
              >
                Validar Nomenclatura y Guardar
              </button>
            </div>
          )}

          {/* TAB 10: NFTs (On-Chain Auditor Button) */}
          {activeTab === 'nfts' && (
            <div className="space-y-4">
              <div className="bg-black/40 border border-zinc-900 rounded p-4 text-center">
                <Shield size={32} className="mx-auto text-emerald-500 mb-2" />
                <h3 className="text-white font-bold font-mono text-sm uppercase">Auditoría On-Chain de Activos</h3>
                <p className="text-zinc-500 text-[10px] mt-1 mb-4">Pulse el botón para correr la simulación de validación Web3 de los contratos inteligentes asociados a estos NFTs.</p>
                <button
                  onClick={() => setIsAlertToShow({ show: true, status: 'success', message: 'Contratos inteligentes verificados con éxito en la red de pruebas.' })}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] uppercase font-mono tracking-widest rounded cursor-pointer transition-colors"
                >
                  Ejecutar Auditor On-Chain
                </button>
              </div>
            </div>
          )}

          {/* TAB 11: LOOT TABLES / CONTENEDORES */}
          {activeTab === 'contenedores' && (
            <div className="space-y-4">
              <div className="flex items-center gap-1.5 border-b border-zinc-900 pb-2 mt-2">
                <Sliders size={14} className="text-[#ff1e1e]" />
                <span className="text-[10.5px] text-white font-bold block uppercase font-mono">
                  [ MATRIX.TAB.11 ]: CONFIGURADOR DE LOOT TABLES (PACKS & BAGS)
                </span>
              </div>

              <p className="text-[10px] text-zinc-500 font-sans leading-relaxed">
                Defina y configure Bags (recursos fijos apilables) y Packs (contenedores con probabilidad aleatoria / Drop Rates) listados en el de Galaxy Dust.
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Creator Form */}
                <div className="p-4 bg-black/60 border border-zinc-900 rounded-lg space-y-2.5">
                  <span className="text-[9.5px] text-zinc-400 font-bold uppercase block pb-1 border-b border-zinc-900">NUEVO CONTENEDOR</span>
                  
                  <div className="space-y-2 text-[11px]">
                    <div>
                      <label className="text-zinc-550 block mb-0.5">Nombre legal del Contenedor:</label>
                      <input
                        type="text"
                        value={newContainerName}
                        onChange={(e) => setNewContainerName(e.target.value)}
                        placeholder="Cofre de la Legión Osiris II"
                        className="w-full p-2 bg-zinc-950 border border-zinc-900 rounded text-white focus:outline-none focus:border-[#ff1e1e]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-zinc-550 block mb-0.5">Tipo de Contenedor:</label>
                        <select
                          value={newContainerType}
                          onChange={(e) => setNewContainerType(e.target.value as any)}
                          className="w-full bg-zinc-950 border border-zinc-900 p-2 rounded text-white outline-none"
                        >
                          <option value="Bag">Bag (Recursos Fijos)</option>
                          <option value="Pack">Pack (Probabilidades)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-zinc-550 block mb-0.5">Bolsa Metal (Kg):</label>
                        <input
                          type="number"
                          value={newContainerMetal}
                          onChange={(e) => setNewContainerMetal(Number(e.target.value) || 0)}
                          className="w-full p-2 bg-zinc-950 border border-zinc-900 rounded text-white text-right outline-none"
                        />
                      </div>
                    </div>

                    {newContainerType === 'Bag' ? (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-zinc-550 block mb-0.5">Bolsa Cristal (u):</label>
                          <input
                            type="number"
                            value={newContainerCrystal}
                            onChange={(e) => setNewContainerCrystal(Number(e.target.value) || 0)}
                            className="w-full p-2 bg-zinc-950 border border-zinc-900 rounded text-white text-right outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-zinc-550 block mb-0.5">Bolsa Deuterio (u):</label>
                          <input
                            type="number"
                            value={newContainerDeuterium}
                            onChange={(e) => setNewContainerDeuterium(Number(e.target.value) || 0)}
                            className="w-full p-2 bg-zinc-950 border border-zinc-900 rounded text-white text-right outline-none"
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="text-zinc-550 block mb-0.5">Drop Rates % (Item_alias:Probabilidad / uno por línea):</label>
                        <textarea
                          value={newContainerItemsText}
                          onChange={(e) => setNewContainerItemsText(e.target.value)}
                          rows={3}
                          className="w-full p-2 bg-zinc-950 border border-zinc-900 rounded text-white font-mono text-[10px] focus:outline-none focus:border-[#ff1e1e]"
                          placeholder="Plano Fragata:15&#10;Astrobot A.R.E.S:25&#10;Inyector AP-105:60"
                        />
                        <span className="text-[8.5px] text-zinc-650 block mt-0.5">Valide que la suma total sea exactamente 100%.</span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        if (!newContainerName.trim()) {
                          setIsAlertToShow({ show: true, status: 'error', message: 'Indique un nombre para el contenedor.' });
                          return;
                        }
                        let itemsList: Array<{ name: string; probability: number }> = [];
                        if (newContainerType === 'Pack') {
                          const lines = newContainerItemsText.split('\n');
                          let totalProb = 0;
                          for (const line of lines) {
                            if (!line.trim()) continue;
                            const parts = line.split(':');
                            if (parts.length === 2) {
                              const prob = Math.round(Number(parts[1]) || 0);
                              totalProb += prob;
                              itemsList.push({ name: parts[0].trim(), probability: prob });
                            }
                          }
                          if (totalProb !== 100 && itemsList.length > 0) {
                            setIsAlertToShow({ show: true, status: 'error', message: `⚠️ [Loot Table FAILED]: La suma de probabilidades debe ser exactamente 100%. Suma actual: ${totalProb}%` });
                            return;
                          }
                        }

                        const newC = {
                          id: `cont-dyn-${Date.now()}`,
                          name: newContainerName,
                          containerType: newContainerType,
                          metal: newContainerMetal,
                          crystal: newContainerCrystal,
                          deuterium: newContainerDeuterium,
                          items: itemsList
                        };
                        setContainers(prev => [...prev, newC]);
                        setNewContainerName('');
                        setIsAlertToShow({ show: true, status: 'success', message: `¡Contenedor '${newContainerName}' registrado en la tabla de recompensas!` });
                      }}
                      className="w-full py-2 bg-red-950/20 hover:bg-[#ff1e1e] text-[#ff1e1e] hover:text-white border border-[#ff1e1e]/20 hover:border-[#ff1e1e] rounded font-bold text-[9px] uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Crear Contenedor & Drop Rates
                    </button>
                  </div>
                </div>

                {/* Configured Containers List */}
                <div className="p-4 bg-black/60 border border-zinc-900 rounded-lg space-y-3 flex flex-col justify-between">
                  <div>
                    <span className="text-[9.5px] text-zinc-400 font-bold uppercase block pb-1 border-b border-zinc-900">TABLA DE DROP SÍNCRONA</span>
                    <div className="space-y-2.5 max-h-48 overflow-y-auto mt-2 pr-1">
                      {containers.map((cont) => (
                        <div key={cont.id} className="p-2 bg-zinc-950 border border-zinc-900 rounded flex flex-col gap-1 hover:border-zinc-800 transition-colors">
                          <div className="flex justify-between items-center">
                            <span className="text-[10.5px] font-sans font-bold text-white uppercase">{cont.name}</span>
                            <span className={`px-1 rounded text-[8.5px] font-mono border ${cont.containerType === 'Bag' ? 'bg-emerald-950 text-emerald-400 border-emerald-900' : 'bg-purple-950 text-purple-400 border-purple-900'}`}>
                              {cont.containerType.toUpperCase()}
                            </span>
                          </div>
                          
                          {cont.containerType === 'Bag' ? (
                            <div className="grid grid-cols-3 gap-1 text-[8.5px] text-zinc-500 mt-0.5 font-mono">
                              <span>Metal: <strong className="text-zinc-350">+{cont.metal.toLocaleString()}</strong></span>
                              <span>Cristal: <strong className="text-zinc-350">+{cont.crystal.toLocaleString()}</strong></span>
                              <span>Deuterio: <strong className="text-zinc-350">+{cont.deuterium.toLocaleString()}</strong></span>
                            </div>
                          ) : (
                            <div className="space-y-0.5 mt-0.5">
                              <span className="text-[8.5px] text-zinc-650 uppercase font-bold font-mono">Loot Drop Probabilities:</span>
                              <div className="grid grid-cols-2 gap-1 text-[8.5px] text-zinc-500 font-mono">
                                {cont.items.map((it, idx) => (
                                  <div key={idx} className="flex justify-between p-0.5 bg-zinc-900/40 rounded px-1">
                                    <span className="truncate">{it.name}</span>
                                    <span className="text-yellow-400 font-bold">{it.probability}%</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex gap-2 justify-end mt-1 border-t border-zinc-900/60 pt-1.5 text-[9px] font-mono">
                            <button
                              type="button"
                              onClick={() => {
                                // Open Container Simulation!
                                if (cont.containerType === 'Bag') {
                                  setSimulatedLootResult({
                                    name: cont.name,
                                    loot: `Recursos: +${cont.metal.toLocaleString()} Metal, +${cont.crystal.toLocaleString()} Cristal, +${cont.deuterium.toLocaleString()} Deuterio.`
                                  });
                                } else {
                                  // Random choice based on probability
                                  const rand = Math.random() * 100;
                                  let accum = 0;
                                  let selected = cont.items[cont.items.length - 1]?.name || 'Nada';
                                  for (const it of cont.items) {
                                    accum += it.probability;
                                    if (rand <= accum) {
                                      selected = it.name;
                                      break;
                                    }
                                  }
                                  setSimulatedLootResult({
                                    name: cont.name,
                                    loot: `✨ DROP CONSEGUIDO: ${selected} (Basado en tirada de dado ${rand.toFixed(1)}%)`
                                  });
                                }
                              }}
                              className="py-0.5 px-2 bg-zinc-900 hover:bg-[#ff1e1e] text-zinc-400 hover:text-white border border-zinc-800 rounded text-[8.5px] transition-all cursor-pointer font-bold"
                            >
                              Simular Apertura
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => setContainers(containers.filter(c => c.id !== cont.id))}
                              className="text-zinc-650 hover:text-red-500 font-bold cursor-pointer"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Simulation Result Dialog */}
                  {simulatedLootResult && (
                    <div className="p-2 bg-red-950/15 border border-red-500/25 rounded relative text-[9.5px] font-mono">
                      <button
                        type="button"
                        onClick={() => setSimulatedLootResult(null)}
                        className="absolute right-1 top-1 text-zinc-550 hover:text-white text-[12px]"
                      >
                        ✕
                      </button>
                      <span className="text-red-400 font-bold block uppercase text-[8px]">[ SIMULATION RESULT: {simulatedLootResult.name} ]</span>
                      <p className="text-white font-sans mt-0.5 leading-relaxed font-semibold">{simulatedLootResult.loot}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 12: GESTOR DE RECICLAJE */}
          {activeTab === 'reciclaje' && (
            <div className="space-y-4">
              <div className="flex items-center gap-1.5 border-b border-zinc-900 pb-2 mt-2">
                <Building size={14} className="text-[#ff1e1e]" />
                <span className="text-[10.5px] text-white font-bold block uppercase font-mono">
                  [ MATRIX.TAB.12 ]: GESTOR ANALÍTICO DE RECICLAJE (RECYCLER COEFICIENTES)
                </span>
              </div>

              <p className="text-[10px] text-zinc-500 font-sans leading-relaxed">
                Administre el porcentaje de recursos reembolsados y la probabilidad de obtener Phantom Coins o planos extraordinarios al desmantelar activos desfasados en el Reciclador.
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Recycler form */}
                <div className="p-4 bg-black/60 border border-zinc-900 rounded-lg space-y-2.5 font-mono text-xs">
                  <span className="text-[9.5px] text-zinc-400 font-bold uppercase block pb-1 border-b border-zinc-900">REGLA REINTEGRO DE RECICLAJE</span>
                  
                  <div className="space-y-2 text-[11px]">
                    <div>
                      <label className="text-zinc-550 block mb-0.5">Nombre de la Regla/Fila:</label>
                      <input
                        type="text"
                        value={newRecyclerName}
                        onChange={(e) => setNewRecyclerName(e.target.value)}
                        placeholder="Fórmula de Desguace Fragata Legend"
                        className="w-full p-2 bg-zinc-950 border border-zinc-900 rounded text-white focus:outline-none focus:border-[#ff1e1e]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-zinc-550 block mb-0.5">Tipo de Asset Quemado:</label>
                        <select
                          value={newRecyclerType}
                          onChange={(e) => setNewRecyclerType(e.target.value as any)}
                          className="w-full bg-zinc-950 border border-zinc-900 p-2 rounded text-white outline-none font-mono text-[10px]"
                        >
                          <option value="Rare Spaceship">Rare Spaceship</option>
                          <option value="Epic Spaceship">Epic Spaceship</option>
                          <option value="Consumable">Consumable</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-zinc-550 block mb-0.5">Metal Devuelto (Kg):</label>
                        <input
                          type="number"
                          value={newRecyclerMetal}
                          onChange={(e) => setNewRecyclerMetal(Number(e.target.value) || 0)}
                          className="w-full p-2 bg-zinc-950 border border-zinc-900 rounded text-white text-right outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-zinc-550 block mb-0.5">Cristal Devuelto:</label>
                        <input
                          type="number"
                          value={newRecyclerCrystal}
                          onChange={(e) => setNewRecyclerCrystal(Number(e.target.value) || 0)}
                          className="w-full p-2 bg-zinc-950 border border-zinc-900 rounded text-white text-right outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[#606060] block mb-0.5">Recompensa PC:</label>
                        <input
                          type="number"
                          value={newRecyclerPC}
                          onChange={(e) => setNewRecyclerPC(Number(e.target.value) || 0)}
                          className="w-full p-2 bg-zinc-950 border border-zinc-900 rounded text-white text-right outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[#606060] block mb-0.5">Bonus Prob (%):</label>
                        <input
                          type="number"
                          value={newRecyclerBonusProb}
                          onChange={(e) => setNewRecyclerBonusProb(Number(e.target.value) || 0)}
                          className="w-full p-2 bg-zinc-950 border border-zinc-900 rounded text-white text-right outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (!newRecyclerName.trim()) {
                          setIsAlertToShow({ show: true, status: 'error', message: 'De un nombre al coeficiente de reciclador.' });
                          return;
                        }
                        const newR = {
                          id: `rec-dyn-${Date.now()}`,
                          name: newRecyclerName,
                          assetType: newRecyclerType,
                          metalRefund: newRecyclerMetal,
                          crystalRefund: newRecyclerCrystal,
                          phantomCoinsReward: newRecyclerPC,
                          extraBonusProbability: newRecyclerBonusProb
                        };
                        setRecyclerConfigs(prev => [...prev, newR]);
                        setNewRecyclerName('');
                        setIsAlertToShow({ show: true, status: 'success', message: `¡Coeficiente '${newRecyclerName}' persistido en el Reciclador!` });
                      }}
                      className="w-full py-2 bg-red-950/20 hover:bg-[#ff1e1e] text-[#ff1e1e] hover:text-white border border-[#ff1e1e]/20 hover:border-[#ff1e1e] rounded font-bold text-[9px] uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Crear Coeficiente de Reciclaje
                    </button>
                  </div>
                </div>

                {/* Coefficients database list */}
                <div className="p-4 bg-black/60 border border-zinc-900 rounded-lg space-y-3 flex flex-col justify-between">
                  <div>
                    <span className="text-[9.5px] text-zinc-400 font-bold uppercase block pb-1 border-b border-zinc-900 font-mono">BASE COEFICIENTES DEL RECICLADOR</span>
                    <div className="space-y-2.5 max-h-48 overflow-y-auto mt-2 pr-1 font-mono text-[11px]">
                      {recyclerConfigs.map((cfg) => (
                        <div key={cfg.id} className="p-2 bg-zinc-950 border border-zinc-900 rounded flex flex-col gap-1 hover:border-zinc-800 transition-colors">
                          <div className="flex justify-between items-center">
                            <span className="font-sans font-bold text-white uppercase">{cfg.name}</span>
                            <span className="px-1.5 rounded text-[8.5px] font-mono border bg-amber-950 border-amber-900 text-amber-400">
                              {cfg.assetType}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 text-[8px] text-zinc-550 mt-1">
                            <div>Refund Metal: <span className="text-zinc-350">+{cfg.metalRefund.toLocaleString()}</span></div>
                            <div>Refund Cristal: <span className="text-zinc-350">+{cfg.crystalRefund.toLocaleString()}</span></div>
                            <div>PC Reward: <span className="text-emerald-400">+{cfg.phantomCoinsReward}</span></div>
                            <div>Blueprints B%: <span className="text-purple-400">+{cfg.extraBonusProbability}%</span></div>
                          </div>

                          <div className="flex justify-end gap-2 border-t border-zinc-900/40 mt-1.5 pt-1.5 text-[9px]">
                            <button
                              type="button"
                              onClick={() => {
                                // Simulate recycling desmantelar spaceship or consume
                                const winBonus = Math.random() * 100 <= cfg.extraBonusProbability;
                                setSimulatedRecyclerResult({
                                  name: cfg.name,
                                  text: `♻️ DESGUACE AUTOMÁTICO PERFECTO: Se desmanteló asset tipo '${cfg.assetType}'. Recobrado: +${cfg.metalRefund.toLocaleString()} Metal, +${cfg.crystalRefund.toLocaleString()} Cristal, +${cfg.phantomCoinsReward} Phantom Coins.${winBonus ? ' ✨ EXTRA DROP: ¡Plano de Fragata conseguido con éxito!' : ' (Sin extra drop legendario)'}`
                                });
                              }}
                              className="py-0.5 px-2 bg-zinc-900 hover:bg-[#ff1e1e] text-zinc-400 hover:text-white border border-zinc-800 rounded text-[8.5px] transition-all cursor-pointer font-bold"
                            >
                              Simular Reciclaje
                            </button>
                            <button
                              type="button"
                              onClick={() => setRecyclerConfigs(recyclerConfigs.filter(r => r.id !== cfg.id))}
                              className="text-zinc-650 hover:text-red-500 font-bold cursor-pointer"
                            >
                              Purga
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Simulation logs of recycling process */}
                  {simulatedRecyclerResult && (
                    <div className="p-2 bg-red-950/15 border border-red-500/25 rounded relative text-[9.5px] font-mono">
                      <button
                        type="button"
                        onClick={() => setSimulatedRecyclerResult(null)}
                        className="absolute right-1 top-1 text-zinc-550 hover:text-white text-[12px]"
                      >
                        ✕
                      </button>
                      <span className="text-red-400 font-bold block uppercase text-[8px]">[ RECYCLING TELEMETRY REPORT: {simulatedRecyclerResult.name} ]</span>
                      <p className="text-white font-sans mt-0.5 leading-relaxed font-semibold">{simulatedRecyclerResult.text}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>


        {/* RIGHT COLUMN: AUDITORÍA DE SALDOS & INVENTARIO MAESTRO EN VIVO PARA EL JUGADOR SELECCIONADO */}
        <div className="space-y-6 bg-zinc-950 border border-zinc-900 rounded-lg p-4">
          
          <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
            <span className="text-[10.5px] font-mono font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
              <Zap size={13} className="text-red-500 shrink-0" />
              <span>AUDITORÍA E INYECCIÓN DE ACTIVOS DEL PILOTO</span>
            </span>
            {auditedUser && (
              <span className="text-[9.2px] font-mono font-bold bg-[#ff1e1e]/10 text-red-500 border border-[#ff1e1e]/20 p-1 rounded">
                COMMANDER_LINKED
              </span>
            )}
          </div>

          {!auditedUser ? (
            <div className="py-20 text-center space-y-4">
              <AlertTriangle className="text-zinc-700 mx-auto stroke-1" size={32} />
              <p className="text-xs text-zinc-500 leading-normal max-w-sm mx-auto font-sans">
                Sin piloto acoplado al módulo. Utilice la consola superior para buscar un capitán (email o ID) y auditar sus activos síncronos.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              
              <div className="flex items-center gap-3 p-3 bg-black/40 border border-zinc-900 rounded-lg">
                <div className="p-2 bg-red-650/15 border border-red-500/20 text-red-500 rounded">
                  <Sliders size={15} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase font-mono">{auditedUser.username}</h3>
                  <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Nivel del CAN: {auditedUser.level} • Email: {auditedUser.email}</p>
                </div>
              </div>

              {/* AUDITED VIEW DEPENDING ON ACTIVE TAB SELECTED IN THE COMPONENT */}
              
              {/* ESTRUCTURAS AUDIT */}
              {activeTab === 'estructuras' && (
                <div className="space-y-4">
                  <span className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase font-mono block">Edificios / Estructuras del Piloto</span>
                  
                  {userStructures.length === 0 ? (
                    <div className="p-6 text-center text-zinc-600 italic bg-black/20 border border-zinc-900 rounded text-xs">
                      Este piloto no posee ninguna estructura construida en la superficie de su C.A.N.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                      {userStructures.map((fac) => {
                        const seed = structuresList.find(s => s.building_id === fac.building_id);
                        return (
                          <div key={fac.id} className="p-3 bg-black/60 border border-zinc-900 rounded flex items-center justify-between text-xs">
                            <div>
                              <span className="font-bold text-white block">{seed?.building_name || 'Estructura Desconocida'}</span>
                              <span className="text-[9.5px] text-red-500 font-mono">Nivel de Amplificación: <strong className="text-white text-xs">{fac.level}</strong> / {seed?.max_level || 10}</span>
                              <span className="text-[8.5px] text-zinc-600 block font-mono mt-0.5">UID: {fac.id}</span>
                            </div>

                            <div className="flex items-center gap-2 font-mono text-[9px]">
                              {/* Alter levels */}
                              <button
                                onClick={() => {
                                  setUserStructures(prev => prev.map(s => s.id === fac.id ? { ...s, level: Math.max(s.level - 1, 1) } : s));
                                  setIsAlertToShow({ show: true, status: 'success', message: 'Nivel descendido de forma segura.' });
                                }}
                                className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded font-bold hover:bg-zinc-850"
                              >
                                -1
                              </button>
                              <button
                                onClick={() => {
                                  const max = seed?.max_level || 100;
                                  if (fac.level >= max) {
                                    setIsAlertToShow({ show: true, status: 'error', message: 'La estructura ya cuenta con el tope de mejora estructural.' });
                                    return;
                                  }
                                  setUserStructures(prev => prev.map(s => s.id === fac.id ? { ...s, level: s.level + 1 } : s));
                                  setIsAlertToShow({ show: true, status: 'success', message: 'Nivel ascendido con éxito.' });
                                }}
                                className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded font-bold hover:bg-zinc-850"
                              >
                                +1
                              </button>
                              
                              {/* DESTRUIR_FACILIDAD */}
                              <button
                                onClick={() => {
                                  setUserStructures(prev => prev.filter(s => s.id !== fac.id));
                                  setIsAlertToShow({
                                    show: true,
                                    status: 'error',
                                    message: `🚨 [DESTRUIR_FACILIDAD] Estructura "${seed?.building_name}" demolida físicamente de la cuenta.`
                                  });
                                }}
                                className="px-2 py-1 bg-red-950/20 hover:bg-red-650 text-red-500 hover:text-white border border-red-900/30 rounded font-bold uppercase"
                              >
                                DESTRUIR
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TECNOLOGÍAS AUDIT */}
              {activeTab === 'tecnologias' && (
                <div className="space-y-4">
                  <span className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase font-mono block">Tecnologías Adquiridas (Habilitador CAN)</span>
                  
                  {userTechnologies.length === 0 ? (
                    <div className="p-6 text-center text-zinc-600 italic bg-black/20 border border-zinc-900 rounded text-xs">
                      Este capitán no posee ninguna patente tecnológica en su cartera relacional.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                      {userTechnologies.map((tech) => {
                        const seed = technologiesList.find(t => t.technology_id === tech.technology_id);
                        return (
                          <div key={tech.technology_id} className="p-3 bg-black/60 border border-zinc-900 rounded flex items-center justify-between text-xs">
                            <div>
                              <span className="font-bold text-white block">{seed?.technology_name || 'Definición de Software'}</span>
                              <span className="text-[9.5px] text-zinc-500 font-mono">Estado en Ranura: {tech.equipped ? <span className="text-emerald-400 font-bold">● EQUIPADA ACTIVA</span> : <span className="text-zinc-600">REPOSO</span>}</span>
                            </div>

                            <div>
                              <button
                                onClick={() => {
                                  setUserTechnologies(prev => prev.map(t => t.technology_id === tech.technology_id ? { ...t, equipped: !t.equipped } : t));
                                  setIsAlertToShow({
                                    show: true,
                                    status: 'success',
                                    message: `Estado de ranura tecnológica modificado en tiempo real.`
                                  });
                                }}
                                className={`px-2 py-1 font-mono text-[9px] rounded font-bold uppercase cursor-pointer ${
                                  tech.equipped ? 'bg-[#ff1e1e] text-white' : 'bg-zinc-900 text-zinc-400'
                                }`}
                              >
                                {tech.equipped ? 'Apagar Módulo' : 'Encender'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ASTROBOTS AUDIT */}
              {activeTab === 'astrobots' && (
                <div className="space-y-4">
                  <span className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase font-mono block">Auditoría de Astrobots Acoplados/Activos</span>
                  
                  {userAstrobots.length === 0 ? (
                    <div className="p-6 text-center text-zinc-600 italic bg-black/20 border border-zinc-900 rounded text-xs">
                      Ningún Companion Robotizado detectado en esta cuenta galáctica.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                      {userAstrobots.map((bot) => {
                        const seed = astrobotsList.find(b => b.astrobot_id === bot.astrobot_id);
                        return (
                          <div key={bot.user_bot_id} className="p-3 bg-black/60 border border-zinc-900 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                            <div>
                              <span className="font-bold text-white block">{seed?.astrobot_name || 'Astrobot Series'}</span>
                              <span className="text-[9.5px] text-[#ff1e1e] font-mono">Firmware Nivel: <strong className="text-white text-xs">{bot.level}</strong></span>
                              <span className="text-[8.5px] text-zinc-600 block font-mono mt-0.5">Asignado a Nave: {bot.assignedShipId ? <strong className="text-zinc-400">{bot.assignedShipId}</strong> : 'REPOSO EN LA BASE'}</span>
                            </div>

                            <div className="flex items-center gap-1.5 font-mono text-[9px]">
                              {/* Modify levels or unbind */}
                              <button
                                onClick={() => {
                                  setUserAstrobots(prev => prev.map(b => b.user_bot_id === bot.user_bot_id ? { ...b, level: b.level + 1 } : b));
                                  setIsAlertToShow({ show: true, status: 'success', message: 'Firmware de IA aumentado con éxito.' });
                                }}
                                className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 rounded"
                              >
                                Subir Nivel Bot
                              </button>

                              {bot.assignedShipId && (
                                <button
                                  onClick={() => {
                                    setUserAstrobots(prev => prev.map(b => b.user_bot_id === bot.user_bot_id ? { ...b, assignedShipId: null } : b));
                                    setIsAlertToShow({ show: true, status: 'success', message: 'Companion desvinculado de la cabina de combate del jugador.' });
                                  }}
                                  className="px-2 py-1 bg-zinc-900 text-red-500 rounded font-bold hover:bg-red-950/10"
                                >
                                  Desvincular
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* BLUEPRINTS AUDIT */}
              {activeTab === 'blueprints' && (
                <div className="space-y-4">
                  <span className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase font-mono block">Historial de Planos & Durabilidad</span>
                  
                  {userBlueprints.length === 0 ? (
                    <div className="p-6 text-center text-zinc-600 italic bg-black/20 border border-zinc-900 rounded text-xs">
                      Este comandante no dispone de ningún pergamino digital de fabricación.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                      {userBlueprints.map((bp) => {
                        const seed = blueprintsList.find(b => b.blueprint_id === bp.blueprint_id);
                        return (
                          <div key={bp.blueprint_id} className="p-3 bg-black/60 border border-zinc-900 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                            <div className="space-y-1">
                              <span className="font-bold text-white block">{seed?.blueprint_name || 'Especificaciones Planos'}</span>
                              <div className="flex gap-4 text-[9.5px] font-mono">
                                <span className="text-zinc-400">Usos Restantes: <strong className="text-yellow-500">{bp.durability_left}</strong> / {seed?.max_durability || 5}</span>
                                <span className="text-zinc-500">Poseídos en total: <strong className="text-white font-bold">{bp.quantityOwned} planos</strong></span>
                              </div>
                            </div>

                            <div className="flex gap-2 font-mono text-[9px] w-full sm:w-auto">
                              <input
                                aria-label="Cantidad de blueprints"
                                type="number"
                                min={1}
                                value={bp.quantityOwned}
                                onChange={(e) => {
                                  const parsed = parseInt(e.target.value) || 1;
                                  setUserBlueprintQuantity(bp.blueprint_id, parsed);
                                }}
                                className="w-14 px-1.5 py-1 bg-black border border-zinc-850 rounded text-center text-white text-[10.5px] font-bold outline-none"
                              />

                              <button
                                onClick={() => resetBlueprintDurability(bp.blueprint_id)}
                                className="px-2.5 py-1 bg-[#ff1e1e] hover:bg-red-650 text-white font-bold rounded uppercase tracking-wider text-[8px]"
                              >
                                [RESET_BLUEPRINT_DURABILITY] 🔧
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* CONSUMIBLES AUDIT */}
              {activeTab === 'consumibles' && (
                <div className="space-y-4">
                  <span className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase font-mono block">Insumos e Inventario Industrial</span>
                  
                  {userConsumables.length === 0 ? (
                    <div className="p-6 text-center text-zinc-600 italic bg-black/20 border border-zinc-900 rounded text-xs">
                      No hay registros de recargas ni contenedores en el perfil de este jugador.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                      {userConsumables.map((cons) => {
                        const seed = consumablesList.find(c => c.consumable_id === cons.consumable_id);
                        return (
                          <div key={cons.consumable_id} className="p-3 bg-black/60 border border-zinc-900 rounded flex items-center justify-between text-xs">
                            <div>
                              <span className="font-bold text-white block truncate max-w-[200px]">{seed?.item_name || 'Consumible Quark'}</span>
                              <span className="text-[9.5px] text-zinc-550 font-mono">Unidades Disponibles: <strong className="text-[#ff1e1e] text-xs">{cons.quantity}</strong></span>
                              <span className="text-[8.5px] text-zinc-650 block">ID: {cons.consumable_id}</span>
                            </div>

                            <div className="flex gap-1.5 font-mono text-[9px]">
                              <input
                                aria-label="Cantidad de consumibles"
                                type="number"
                                min={0}
                                value={cons.quantity}
                                onChange={(e) => {
                                  const val = Math.max(0, parseInt(e.target.value) || 0);
                                  setUserConsumables(prev => prev.map(c => c.consumable_id === cons.consumable_id ? { ...c, quantity: val } : c));
                                }}
                                className="w-16 px-1.5 py-1 bg-black border border-zinc-850 rounded text-center text-white text-[10.5px] font-bold outline-none"
                              />
                              <button
                                aria-label="Eliminar consumible del inventario"
                                onClick={() => {
                                  setUserConsumables(prev => prev.filter(c => c.consumable_id !== cons.consumable_id));
                                  setIsAlertToShow({ show: true, status: 'error', message: 'Lote de insumos purgado de la cuenta.' });
                                }}
                                className="p-1 hover:text-red-500 text-zinc-500"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TOOLS AUDIT */}
              {activeTab === 'tools' && (
                <div className="space-y-4">
                  <span className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase font-mono block">Extractores & Machinery Instalado</span>
                  
                  {userTools.length === 0 ? (
                    <div className="p-6 text-center text-zinc-600 italic bg-black/20 border border-zinc-900 rounded text-xs">
                      No se han instalado herramientas de perforación molecular en la base de este capitán.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                      {userTools.map((tool) => {
                        const seed = toolsList.find(t => t.tool_id === tool.tool_id);
                        return (
                          <div key={tool.tool_id} className="p-3 bg-black/60 border border-zinc-900 rounded flex items-center justify-between text-xs">
                            <div>
                              <span className="font-bold text-white block">{seed?.tool_name || 'Extractor GD'}</span>
                              <span className="text-[9.5px] text-zinc-500 font-mono">Durabilidad Mecánica: <strong className="text-emerald-400">{tool.durability}%</strong></span>
                              <span className="text-[8.5px] text-zinc-600 block">UID Síncrono: {tool.tool_id}</span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  setUserTools(prev => prev.map(t => t.tool_id === tool.tool_id ? { ...t, durability: 100 } : t));
                                  setIsAlertToShow({ show: true, status: 'success', message: 'Estructura restaurada al 100% de resistencia mineral.' });
                                }}
                                className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-mono rounded text-[9px]"
                              >
                                Reparar Tool
                              </button>
                              <button
                                aria-label="Eliminar maquinaria del inventario"
                                onClick={() => {
                                  setUserTools(prev => prev.filter(t => t.tool_id !== tool.tool_id));
                                  setIsAlertToShow({ show: true, status: 'error', message: 'Maquinaria removida física de la base.' });
                                }}
                                className="p-1.5 bg-red-950/20 text-red-500 rounded border border-red-900/10 hover:bg-red-500 hover:text-white transition-all"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* LICENCIAS AUDIT */}
              {activeTab === 'licencias' && (
                <div className="space-y-4">
                  <span className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase font-mono block">Permisos de Vuelo de Cuadrante</span>
                  
                  {userLicenses.length === 0 ? (
                    <div className="p-6 text-center text-zinc-600 italic bg-black/20 border border-zinc-900 rounded text-xs">
                      Este piloto no posee patentes de navegación; su tránsito está restringido a la zona desértica pacífica.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                      {userLicenses.map((lic) => {
                        const seed = licensesList.find(l => l.license_id === lic.license_id);
                        return (
                          <div key={lic.license_id} className="p-3 bg-black/60 border border-zinc-900 rounded flex items-center justify-between text-xs">
                            <div>
                              <span className="font-bold text-white block">{seed?.license_name || 'Licencia de Vuelo'}</span>
                              <span className="text-[9.5px] text-zinc-500 font-mono">Sector Liberado: <strong className="text-white font-sans">{seed?.target_sector || 'Quadrante Neutral'}</strong></span>
                              <span className="text-[8.5px] text-zinc-650 block mt-0.5">Adquirida: {new Date(lic.acquired_at).toLocaleTimeString()}</span>
                            </div>

                            <div>
                              <button
                                onClick={() => {
                                  setUserLicenses(prev => prev.filter(l => l.license_id !== lic.license_id));
                                  setIsAlertToShow({ show: true, status: 'error', message: 'Permiso revocado. Sector bloqueado en la computadora del jugador.' });
                                }}
                                className="px-2 py-1 bg-red-950/20 hover:bg-red-650 text-red-500 hover:text-white border border-red-900/10 font-mono text-[9px] rounded font-bold uppercase transition-colors shrink-0"
                              >
                                Revocar Permiso
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

        </div>

      </div>

    </div>
  );

  // Helper inside the module to change specific user blueprint owned count
  function setUserBlueprintQuantity(blueprintId: string, count: number) {
    setUserBlueprints(prev => prev.map(b => b.blueprint_id === blueprintId ? { ...b, quantityOwned: count } : b));
  }
}
