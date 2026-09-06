import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { 
  RefreshCw, Search, ShieldAlert, Database, Radio, Layers, Edit3, X, Save, Plus, Camera, 
  UploadCloud, Sliders, Flame, Coins, Hammer, Boxes, Trash2, PlusCircle, Award
} from 'lucide-react';

interface StructureAsset {
  id: string;
  name: string;
  rarity: string;
  collection: string;
  type: string;
  company: string;
  power_score: number;
  description: string;
}

interface TechnologyAsset {
  id: string;
  name: string;
  rarity: string;
  collection: string;
  type: string;
  company: string;
  power_score: number;
  description: string;
}

interface BadgeAsset {
  id: string;
  name: string;
  type: string;
  collection: string;
  power_score: number;
  description: string;
  effect: string;
  stack: string;
  duration: string;
  duration_days?: number;
  can_slots?: number;
  rarity: string;
}

interface UserAssetRow {
  id: string;
  user_id: string;
  asset_id: string;
  current_level: number;
  asset_type: string;
}

interface ComponentMatrixProps {
  users?: any[];
  setIsAlertToShow?: (alert: { show: boolean; status: 'success' | 'error'; message: string }) => void;
  onRefreshData?: () => void;
}

const TARGET_ASSET_TYPES = [
  { id: 'SHIPS', aliases: ['SHIP', 'SHIPS', 'NAVES', 'NAVE'], label: '🚀 SHIPS (Naves)', table: 'seed_ships', pk: 'ship_id', nameCol: 'ship_name' },
  { id: 'STRUCTURES', aliases: ['STRUCTURE', 'STRUCTURES', 'ESTRUCTURAS', 'ESTRUCTURA'], label: '🏢 STRUCTURES (Estructuras)', table: 'seed_structures', pk: 'id', nameCol: 'name' },
  { id: 'DEFENSES', aliases: ['DEFENSE', 'DEFENSES', 'DEFENSAS', 'DEFENSA'], label: '🛡️ DEFENSES (Defensas)', table: 'seed_defenses', pk: 'defense_id', nameCol: 'defense_name' },
  { id: 'TECHNOLOGIES', aliases: ['TECH', 'TECHNOLOGY', 'TECHNOLOGIES', 'TECNOLOGIAS', 'TECNOLOGIA'], label: '🔬 TECHNOLOGIES (Tecnologías)', table: 'seed_technologies', pk: 'id', nameCol: 'name' },
  { id: 'BADGES', aliases: ['BADGE', 'BADGES', 'INSIGNIAS', 'INSIGNIA'], label: '🏅 BADGES (Insignias)', table: 'seed_badges', pk: 'id', nameCol: 'name' },
  { id: 'LICENSES', aliases: ['LICENSE', 'LICENSES', 'LICENCIAS', 'LICENCIA'], label: '📜 LICENSES (Licencias)', table: 'seed_licenses', pk: 'id', nameCol: 'name' },
  { id: 'TOOLS', aliases: ['TOOL', 'TOOLS', 'HERRAMIENTAS', 'HERRAMIENTA'], label: '🔧 TOOLS (Tools)', table: 'seed_tools', pk: 'id', nameCol: 'name' },
  { id: 'CONSUMABLES', aliases: ['CONSUMABLE', 'CONSUMABLES', 'CONSUMIBLES', 'CONSUMIBLE'], label: '🧪 CONSUMABLES (Consumibles)', table: 'seed_consumables', pk: 'id', nameCol: 'name' },
  { id: 'ASTROBOTS', aliases: ['ASTROBOT', 'ASTROBOTS'], label: '🤖 ASTROBOTS (Astrobots)', table: 'seed_astrobots', pk: 'id', nameCol: 'name' }
];

const MATERIAL_OPTIONS = [
  { id: 'metal', label: '🪨 Metal' },
  { id: 'crystal', label: '💎 Cristal' },
  { id: 'deuterium', label: '🧪 Deuterio' },
  { id: 'dark_matter', label: '🌌 Materia Oscura' },
  { id: 'omniplate', label: '🛡️ Omniplate' },
  { id: 'orichaltron', label: '⚡ Orichaltron' }
];

const CURRENCY_OPTIONS = [
  { id: 'gd_coins', label: '🪙 GD Coins' },
  { id: 'phantom_coins', label: '👻 Phantom Coins' },
  { id: 'void_crystals', label: '🔮 Void Crystals' }
];

const getTargetConfig = (typeStr: string) => {
  const clean = (typeStr || '').toUpperCase().trim();
  return TARGET_ASSET_TYPES.find(t => t.id === clean || t.aliases.includes(clean)) || TARGET_ASSET_TYPES[0];
};

const extractAssetDetails = (asset: any) => {
  if (!asset) return { id: '', name: 'Desconocido' };

  const id = asset.ship_id || asset.defense_id || asset.building_id || asset.structure_id || 
             asset.technology_id || asset.badge_id || asset.license_id || asset.tool_id || 
             asset.consumable_id || asset.astrobot_id || asset.id || asset.blueprint_id || '';

  const name = asset.ship_name || asset.defense_name || asset.structure_name || asset.building_name || 
               asset.name || asset.title || asset.label || id || 'Sin Nombre';

  return { id: String(id), name: String(name) };
};

export const ComponentMatrix: React.FC<ComponentMatrixProps> = ({
  users = [],
  setIsAlertToShow,
  onRefreshData
}) => {
  const [rawItems, setRawItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('SHIPS');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [rarityFilter, setRarityFilter] = useState<string>('Todas');

  const [dbError, setDbError] = useState<string | null>(null);
  const [rawPayloadCount, setRawPayloadCount] = useState<number>(-1);
  const [masterSkills, setMasterSkills] = useState<any[]>([]);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkRarity, setBulkRarity] = useState<string>('no_change');
  const [selectedMatrixItem, setSelectedMatrixItem] = useState<any | null>(null);

  const [editorMode, setEditorMode] = useState<'EDIT' | 'CREATE'>('EDIT');
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [saveLoading, setSaveLoading] = useState<boolean>(false);
  const [newSkillInput, setNewSkillInput] = useState<string>('');

  const [playerSearchQuery, setPlayerSearchQuery] = useState('');
  const [auditedUser, setAuditedUser] = useState<any>(null);
  const [playerInventory, setPlayerInventory] = useState<UserAssetRow[]>([]);

  // Estados para gestión interactiva de Blueprints
  const [bpMaterials, setBpMaterials] = useState<Record<string, number>>({});
  const [bpCurrencies, setBpCurrencies] = useState<Record<string, number>>({});
  const [targetCategoryAssets, setTargetCategoryAssets] = useState<any[]>([]);
  const [loadingTargetAssets, setLoadingTargetAssets] = useState<boolean>(false);
  const [targetAssetSearch, setTargetAssetSearch] = useState<string>('');

  const tabs = [
    { id: 'SHIPS', label: '🚀 Naves', table: 'seed_ships', userTable: 'user_ships', pk: 'ship_id', userPk: 'ship_id', nameCol: 'ship_name' },
    { id: 'STRUCTURES', label: '🏢 Estructuras', table: 'seed_structures', userTable: 'user_structures', pk: 'id', userPk: 'building_id', nameCol: 'name' },
    { id: 'DEFENSES', label: '🛡️ Defensas', table: 'seed_defenses', userTable: 'user_defenses', pk: 'defense_id', userPk: 'defense_id', nameCol: 'defense_name' },
    { id: 'TECHNOLOGIES', label: '🔬 Tecnologías', table: 'seed_technologies', userTable: 'user_technologies', pk: 'id', userPk: 'technology_id', nameCol: 'name' },
    { id: 'BADGES', label: '🏅 Insignias', table: 'seed_badges', userTable: 'user_badges', pk: 'id', userPk: 'badge_id', nameCol: 'name' },
    { id: 'BLUEPRINTS', label: '🗺️ Blueprints', table: 'seed_blueprints', userTable: 'user_blueprints', pk: 'id', userPk: 'blueprint_id', nameCol: 'name' },
    { id: 'LICENSES', label: '📜 Licencias', table: 'seed_licenses', userTable: 'user_licenses', pk: 'id', userPk: 'license_id', nameCol: 'name' },
    { id: 'TOOLS', label: '🔧 Tools', table: 'seed_tools', userTable: 'user_tools', pk: 'id', userPk: 'tool_id', nameCol: 'name' },
    { id: 'CONSUMABLES', label: '🧪 Consumibles', table: 'seed_consumables', userTable: 'user_consumibles', pk: 'id', userPk: 'consumable_id', nameCol: 'name' },
    { id: 'ASTROBOTS', label: '🤖 Astrobots', table: 'seed_astrobots', userTable: 'user_astrobots', pk: 'id', userPk: 'astrobot_id', nameCol: 'name' }
  ];

  const currentTabConfig = useMemo(() => {
    return tabs.find(t => t.id === activeTab) || tabs[0];
  }, [activeTab]);

  useEffect(() => {
    fetchMasterSkills();
  }, []);

  const fetchMasterSkills = async () => {
    try {
      const { data, error } = await supabase.from('matrix_skills_registry').select('*');
      if (!error && data) {
        setMasterSkills(data);
      }
    } catch (e) {
      console.warn("Fallo cargando matrix_skills_registry:", e);
    }
  };

  const skillCache = useMemo(() => {
    return new Map(masterSkills.map(s => [s.skill_code, s]));
  }, [masterSkills]);

  useEffect(() => {
    loadLiveMatrixData();
  }, [activeTab, auditedUser]);

  // Carga de activos correspondientes a la categoría seleccionada en el Blueprint
  const fetchTargetAssets = async (typeId: string) => {
    const config = getTargetConfig(typeId);
    setLoadingTargetAssets(true);
    try {
      const { data } = await supabase.from(config.table).select('*');
      setTargetCategoryAssets(data || []);
    } catch (err) {
      console.warn("Error consultando activos semilla para blueprint:", err);
      setTargetCategoryAssets([]);
    } finally {
      setLoadingTargetAssets(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'BLUEPRINTS' && editingItem) {
      const targetType = editingItem.target_asset_type || 'SHIPS';
      fetchTargetAssets(targetType);
    }
  }, [activeTab, editingItem?.target_asset_type]);

  const filteredTargetAssets = useMemo(() => {
    if (!targetAssetSearch.trim()) return targetCategoryAssets;
    const query = targetAssetSearch.toLowerCase().trim();
    return targetCategoryAssets.filter(asset => {
      const { id, name } = extractAssetDetails(asset);
      return id.toLowerCase().includes(query) || name.toLowerCase().includes(query);
    });
  }, [targetCategoryAssets, targetAssetSearch]);

  const loadLiveMatrixData = async () => {
    try {
      setLoading(true);
      setDbError(null);
      setRawItems([]);
      setSelectedIds([]);

      const { data, error } = await supabase.from(currentTabConfig.table).select('*');

      if (error) {
        setDbError(`${error.code || 'ERR'}: La tabla "${currentTabConfig.table}" no responde. Verifica su existencia en Supabase.`);
        return;
      }

      const sanitizedData = (data || []).map((row: any) => {
        let cleanSkills: any[] = [];
        if (Array.isArray(row.skills)) {
          cleanSkills = row.skills;
        } else if (typeof row.skills === 'string' && row.skills.trim() !== '') {
          try {
            const parsed = JSON.parse(row.skills);
            cleanSkills = Array.isArray(parsed) ? parsed : Object.values(parsed);
          } catch (e) {
            cleanSkills = [];
          }
        } else if (row.skills && typeof row.skills === 'object') {
          cleanSkills = Object.values(row.skills);
        }
        return { ...row, skills: cleanSkills };
      });

      setRawPayloadCount(sanitizedData.length);
      setRawItems(sanitizedData);

      if (auditedUser) {
        const userId = auditedUser.id || auditedUser.user_id;
        
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('legacy_id')
          .eq('id', userId)
          .single();

        if (profile?.legacy_id) {
          const { data: invData } = await supabase
            .from(currentTabConfig.userTable)
            .select('*')
            .eq('id_user', profile.legacy_id);

          if (invData) {
            const mappedInventory: UserAssetRow[] = invData.map((inv: any) => ({
              id: inv.id,
              user_id: String(inv.id_user),
              asset_id: inv[currentTabConfig.userPk] || inv.asset_id || inv.building_id || inv.ship_id,
              current_level: Number(inv.level) || 1,
              asset_type: currentTabConfig.id.toLowerCase()
            }));
            setPlayerInventory(mappedInventory);
          } else {
            setPlayerInventory([]);
          }
        } else {
          setPlayerInventory([]);
        }
      }

    } catch (e: any) {
      setDbError(`EXCEPCIÓN CRÍTICA DE RED: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const notify = (status: 'success' | 'error', message: string) => {
    if (setIsAlertToShow) {
      setIsAlertToShow({ show: true, status, message });
    } else {
      alert(`[${status.toUpperCase()}] ${message}`);
    }
  };

  const handleLinkPilotTerminal = () => {
    if (!playerSearchQuery.trim()) {
      return notify('error', 'Ingrese email, username o identificador de piloto.');
    }
    const query = playerSearchQuery.toLowerCase();
    const match = users.find(u => 
      (u.id && u.id.toLowerCase() === query) || 
      (u.user_id && u.user_id.toLowerCase() === query) ||
      (u.email && u.email.toLowerCase() === query) || 
      (u.username && u.username.toLowerCase().includes(query))
    );

    if (match) {
      setAuditedUser(match);
      notify('success', `AUDITORÍA: Enlazando bitácora en vivo de ${match.username || match.email}`);
    } else {
      notify('error', 'No se localizó ningún capitán estelar en los registros.');
    }
  };

  const handleAlterAssetLevel = async (assetId: string, delta: number) => {
    if (!auditedUser) return;
    const userId = auditedUser.id || auditedUser.user_id;

    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('legacy_id')
        .eq('id', userId)
        .single();

      if (!profile?.legacy_id) {
        notify('error', 'El piloto no posee un ID numérico válido (legacy_id).');
        return;
      }

      const existing = playerInventory.find(item => item.asset_id === assetId);

      if (existing) {
        const targetLvl = existing.current_level + delta;
        if (targetLvl <= 0) {
          await supabase.from(currentTabConfig.userTable).delete().eq('id', existing.id);
          notify('error', 'Activo desmantelado y purgado de la cuenta.');
        } else {
          await supabase.from(currentTabConfig.userTable).update({ level: targetLvl }).eq('id', existing.id);
          notify('success', 'Módulo de nivelación modificado con éxito.');
        }
      } else if (delta > 0) {
        const insertPayload: any = {
          id_user: profile.legacy_id,
          [currentTabConfig.userPk]: assetId,
          level: 1
        };
        await supabase.from(currentTabConfig.userTable).insert([insertPayload]);
        notify('success', '¡INYECTAR DIRECTO! Elemento instalado en Nivel 1.');
      }
      loadLiveMatrixData();
    } catch (err: any) {
      alert(`Fallo al modificar activo: ${err.message}`);
    }
  };

  const handleApplyBulkMatrix = async () => {
    if (selectedIds.length === 0 || bulkRarity === 'no_change') return;
    try {
      setLoading(true);
      const { error } = await supabase
        .from(currentTabConfig.table)
        .update({ rarity: bulkRarity })
        .in(currentTabConfig.pk, selectedIds);

      if (error) throw error;
      
      notify('success', `Actualización masiva exitosa: ${selectedIds.length} assets marcados como ${bulkRarity}.`);
      setSelectedIds([]);
      setBulkRarity('no_change');
      loadLiveMatrixData();
    } catch (error: any) {
      notify('error', `Error en actualización masiva: ${error.message}`);
      setLoading(false);
    }
  };

  // Subida de imagen infallible multi-columna (image_url, avatar_url, badge_url)
  const handleImageUploadToStorage = async (e: React.ChangeEvent<HTMLInputElement>, targetAssetId: string) => {
    const file = e.target.files?.[0];
    if (!file || !targetAssetId) return;

    try {
      setUploadingId(targetAssetId);

      // Eliminar foto anterior para no acumular basura y aplicar cambio de inmediato
      const currentItem = rawItems.find(item => (item[currentTabConfig.pk] || item.id) === targetAssetId);
      const oldUrl = currentItem?.image_url || currentItem?.avatar_url || currentItem?.badge_url;
      
      if (oldUrl && oldUrl.includes('galaxy-assets/')) {
        const urlParts = oldUrl.split('galaxy-assets/');
        if (urlParts.length > 1) {
          const oldPath = urlParts[1].split('?')[0]; // quitar query params si existieran
          await supabase.storage.from('galaxy-assets').remove([oldPath]);
        }
      }

      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const timestamp = Date.now();
      // Agregamos timestamp al nombre para asegurar que la URL cambia y limpia la caché
      const customStoragePath = `${currentTabConfig.table}/${targetAssetId}_${timestamp}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('galaxy-assets')
        .upload(customStoragePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('galaxy-assets')
        .getPublicUrl(customStoragePath);

      const pubUrl = `${publicUrlData?.publicUrl}?t=${timestamp}`;

      if (pubUrl) {
        // Intenta actualizar todas las columnas posibles
        const multiColumnPayload: any = {
          image_url: pubUrl,
          avatar_url: pubUrl,
          badge_url: pubUrl
        };

        const { error: err1 } = await supabase
          .from(currentTabConfig.table)
          .update(multiColumnPayload)
          .eq(currentTabConfig.pk, targetAssetId);

        if (err1) {
          // Fallback a columnas individuales por si la tabla no tiene 'badge_url' o 'avatar_url'
          await supabase.from(currentTabConfig.table).update({ image_url: pubUrl }).eq(currentTabConfig.pk, targetAssetId);
          await supabase.from(currentTabConfig.table).update({ avatar_url: pubUrl }).eq(currentTabConfig.pk, targetAssetId);
          await supabase.from(currentTabConfig.table).update({ badge_url: pubUrl }).eq(currentTabConfig.pk, targetAssetId);
        }

        setRawItems(prev => prev.map(item => {
          const itemId = item[currentTabConfig.pk] || item.id;
          if (itemId === targetAssetId) {
            return { ...item, image_url: pubUrl, avatar_url: pubUrl, badge_url: pubUrl };
          }
          return item;
        }));
      }

      notify('success', `[CONSOLA MULTIMEDIA]: Imagen subida y asociada a ${targetAssetId}.`);
      loadLiveMatrixData();
    } catch (err: any) {
      notify('error', `FALLO DE STORAGE: ${err.message}`);
    } finally {
      setUploadingId(null);
    }
  };

  const handleOpenEditor = (item: any) => {
    setEditorMode('EDIT');
    const cloned = { ...item, skills: [...(item.skills || [])] };
    if (activeTab === 'SHIPS') {
      cloned.stack = 'Stackeable';
    }
    
    if (activeTab === 'BLUEPRINTS') {
      let matsObj: Record<string, number> = {};
      let currsObj: Record<string, number> = {};
      try {
        if (typeof item.required_materials === 'string') {
          matsObj = JSON.parse(item.required_materials || '{}');
        } else if (typeof item.required_materials === 'object' && item.required_materials) {
          matsObj = item.required_materials;
        }
      } catch (e) { matsObj = {}; }

      try {
        if (typeof item.required_currencies === 'string') {
          currsObj = JSON.parse(item.required_currencies || '{}');
        } else if (typeof item.required_currencies === 'object' && item.required_currencies) {
          currsObj = item.required_currencies;
        }
      } catch (e) { currsObj = {}; }

      setBpMaterials(matsObj);
      setBpCurrencies(currsObj);
      setTargetAssetSearch('');
    }

    if (activeTab === 'BADGES') {
      if (cloned.duration_days === undefined || cloned.duration_days === null) {
        cloned.duration_days = Number(cloned.duration) || 30;
      }
      if (cloned.can_slots === undefined || cloned.can_slots === null) {
        cloned.can_slots = 1;
      }
    }

    setEditingItem(cloned);
    setNewSkillInput('');
  };

  const handleOpenCreator = () => {
    setEditorMode('CREATE');
    setNewSkillInput('');

    const defaultItem: any = {
      rarity: 'Common',
      description: '',
      image_url: '',
      avatar_url: '',
      badge_url: '',
      collection: 'NOVA',
      set_skills: '',
      duration: 'Permanent',
      stack: activeTab === 'SHIPS' ? 'Stackeable' : 'No Stackeable',
      max_stack: activeTab === 'SHIPS' ? 999 : 1,
      fleet_slots: 1,
      is_nft: false,
      skills: []
    };

    const pkCol = currentTabConfig.pk;
    const nameCol = currentTabConfig.nameCol;
    defaultItem[pkCol] = '';
    defaultItem[nameCol] = '';

    if (activeTab === 'SHIPS') {
      defaultItem.collection = 'NOVA SHIPS';
      defaultItem.ship_role = 'Attack';
      defaultItem.ship_size = 'Fighter';
      defaultItem.engine = 'Combustión';
      defaultItem.series = 'F-001';
      defaultItem.shield = 0;
      defaultItem.defense = 0;
      defaultItem.resistance = 1000;
      defaultItem.speed_boost = 400;
      defaultItem.attack_standard = 500;
      defaultItem.attack_laser = 250;
      defaultItem.attack_ionic = 100;
      defaultItem.attack_plasma = 50;
      defaultItem.attack_graviton = 0;
      defaultItem.cargo_capacity = 3500;
      defaultItem.production_min = 1.0;
      defaultItem.production_max = 1.0;
    }

    if (activeTab === 'BLUEPRINTS') {
      defaultItem.target_asset_type = 'SHIPS';
      defaultItem.target_asset_id = '';
      defaultItem.default_max_uses = 1;
      setBpMaterials({});
      setBpCurrencies({});
      setTargetAssetSearch('');
    }

    if (activeTab === 'BADGES') {
      defaultItem.duration_days = 30;
      defaultItem.can_slots = 1;
    }

    setEditingItem(defaultItem);
  };

  const updateFormKey = (key: string, value: any) => {
    setEditingItem((prev: any) => {
      if (!prev) return null;
      return { ...prev, [key]: value };
    });
  };

  // Manejadores para filas de Materiales Requeridos
  const handleAddMaterialRow = () => {
    const unused = MATERIAL_OPTIONS.find(m => !(m.id in bpMaterials));
    const keyToAdd = unused ? unused.id : 'metal';
    setBpMaterials(prev => ({ ...prev, [keyToAdd]: 1000 }));
  };

  const handleUpdateMaterialRow = (oldKey: string, newKey: string, qty: number) => {
    setBpMaterials(prev => {
      const updated = { ...prev };
      if (oldKey !== newKey) {
        delete updated[oldKey];
      }
      updated[newKey] = qty;
      return updated;
    });
  };

  const handleRemoveMaterialRow = (keyToRemove: string) => {
    setBpMaterials(prev => {
      const updated = { ...prev };
      delete updated[keyToRemove];
      return updated;
    });
  };

  // Manejadores para filas de Monedas Requeridas
  const handleAddCurrencyRow = () => {
    const unused = CURRENCY_OPTIONS.find(c => !(c.id in bpCurrencies));
    const keyToAdd = unused ? unused.id : 'gd_coins';
    setBpCurrencies(prev => ({ ...prev, [keyToAdd]: 50 }));
  };

  const handleUpdateCurrencyRow = (oldKey: string, newKey: string, qty: number) => {
    setBpCurrencies(prev => {
      const updated = { ...prev };
      if (oldKey !== newKey) {
        delete updated[oldKey];
      }
      updated[newKey] = qty;
      return updated;
    });
  };

  const handleRemoveCurrencyRow = (keyToRemove: string) => {
    setBpCurrencies(prev => {
      const updated = { ...prev };
      delete updated[keyToRemove];
      return updated;
    });
  };

  const addSkillTag = () => {
    if (!newSkillInput.trim() || !editingItem) return;
    const currentSkills = Array.isArray(editingItem.skills) ? [...editingItem.skills] : [];

    const MAX_SKILLS = 4;
    if (currentSkills.length >= MAX_SKILLS) {
      alert(`⚠️ Límite Operativo Superado: No se pueden equipar más de ${MAX_SKILLS} habilidades.`);
      return;
    }

    const skillObj = skillCache.get(newSkillInput.trim());
    if (skillObj) {
      currentSkills.push(skillObj.skill_code);
    } else {
      currentSkills.push(newSkillInput.trim());
    }

    updateFormKey('skills', currentSkills);
    setNewSkillInput('');
  };

  const removeSkillTag = (indexToRemove: number) => {
    if (!editingItem || !Array.isArray(editingItem.skills)) return;
    const filtered = editingItem.skills.filter((_: any, idx: number) => idx !== indexToRemove);
    updateFormKey('skills', filtered);
  };

  const handleSaveAssetUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const pkCol = currentTabConfig.pk;
    // Resolver ID dinámico (Soporte dual id / blueprint_id / ship_id / defense_id)
    const currentId = editingItem[pkCol] || editingItem.id || editingItem.blueprint_id || editingItem.ship_id || editingItem.defense_id;

    if (editorMode === 'CREATE' && (!currentId || !currentId.trim())) {
      return alert("El ID único del activo es obligatorio.");
    }

    try {
      setSaveLoading(true);
      const table = currentTabConfig.table;
      const payload = { ...editingItem };

      // --- MEJORA 1: Auto-equipar skill pendiente en newSkillInput ---
      if (newSkillInput.trim()) {
        const currentSkills = Array.isArray(payload.skills) ? [...payload.skills] : [];
        const MAX_SKILLS = 4;
        if (currentSkills.length < MAX_SKILLS) {
          const skillObj = skillCache.get(newSkillInput.trim());
          currentSkills.push(skillObj ? skillObj.skill_code : newSkillInput.trim());
          payload.skills = currentSkills;
          setNewSkillInput('');
        }
      }

      // Limpieza de campos volátiles o no soportados
      delete payload.skill_requirements;
      delete payload.effect;

      if (activeTab === 'BLUEPRINTS') {
        payload.required_materials = bpMaterials;
        payload.required_currencies = bpCurrencies;
        // Normalizar ID único en ambas columnas por compatibilidad
        payload.id = currentId;
        payload.blueprint_id = currentId;
      }

      // --- MEJORA 2: Dual sync de clave primaria para TOOLS (y otros con pk != 'id') ---
      // Asigna currentId a 'id' y al pkCol específico para evitar conflictos en seed_tools y similares
      payload.id = currentId;
      if (pkCol !== 'id') {
        payload[pkCol] = currentId;
      }

      // Limpiar propiedades nulas o no numéricas según corresponda
      Object.keys(payload).forEach(f => {
        if (payload[f] === null || payload[f] === undefined) {
          delete payload[f];
        } else if (
          typeof payload[f] === 'string' && 
          payload[f] !== '' && 
          !isNaN(payload[f] as any) && 
          f !== pkCol && 
          f !== 'id' &&
          f !== 'blueprint_id' &&
          f !== 'target_asset_id' && 
          f !== 'required_materials' && 
          f !== 'required_currencies'
        ) {
          payload[f] = Number(payload[f]);
        }
      });

      // Asegurar el formato adecuado para columnas JSONB
      if (Array.isArray(payload.skills)) {
        payload.skills = payload.skills;
      }

      if (editorMode === 'EDIT') {
        // --- MEJORA 3: Validación de UPDATE estricta con fallback a upsert ---
        const { data: updatedData, error } = await supabase
          .from(table)
          .update(payload)
          .or(`${pkCol}.eq.${currentId},id.eq.${currentId}`)
          .select();

        if (error) throw error;

        if (!updatedData || updatedData.length === 0) {
          // Fallback a Upsert si el registro fue creado con una columna primaria alternativa
          const { error: upsertErr } = await supabase
            .from(table)
            .upsert([payload]);

          if (upsertErr) throw upsertErr;
        }
      } else {
        const { error } = await supabase
          .from(table)
          .insert([payload]);

        if (error) throw error;
      }

      notify('success', `¡Guardado exitoso! Asset [${currentId}] actualizado en Postgres.`);
      setEditingItem(null);
      loadLiveMatrixData();
    } catch (err: any) {
      alert(`FALLO TRANSACCIONAL EN POSTGRES: ${err.message}`);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteAsset = async (asset: any) => {
    const pkCol = currentTabConfig.pk;
    const assetId = asset[pkCol] || asset.id;
    const assetName = asset[currentTabConfig.nameCol] || asset.name || assetId;
    
    if (!window.confirm(`¿Estás seguro de eliminar el activo "${assetName}" (ID: ${assetId}) de la tabla ${currentTabConfig.table}?`)) return;

    try {
      const { error } = await supabase
        .from(currentTabConfig.table)
        .delete()
        .eq(pkCol, assetId);

      if (error) {
        alert('Error al eliminar: ' + error.message);
      } else {
        loadLiveMatrixData();
      }
    } catch (e: any) {
      alert('Error al eliminar: ' + e.message);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`¿Deseas eliminar permanentemente los ${selectedIds.length} activos seleccionados de ${currentTabConfig.table}?`)) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from(currentTabConfig.table)
        .delete()
        .in(currentTabConfig.pk, selectedIds);

      if (error) {
        alert('Error en borrado masivo: ' + error.message);
        setLoading(false);
      } else {
        notify('success', `Se eliminaron ${selectedIds.length} activos correctamente.`);
        setSelectedIds([]);
        loadLiveMatrixData();
      }
    } catch (e: any) {
      alert('Error en borrado masivo: ' + e.message);
      setLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    const nameCol = currentTabConfig.nameCol;
    const pkCol = currentTabConfig.pk;
    return rawItems.filter(item => {
      const matchSearch = String(item[nameCol] || item.name || '').toLowerCase().includes(searchFilter.toLowerCase()) || String(item[pkCol] || item.id || '').toLowerCase().includes(searchFilter.toLowerCase());
      const matchRarity = rarityFilter === 'Todas' || item.rarity === rarityFilter;
      return matchSearch && matchRarity;
    });
  }, [rawItems, searchFilter, rarityFilter, currentTabConfig]);

  const renderStatInput = (label: string, field: string) => {
    return (
      <div>
        <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">{label}</label>
        <input 
          type="number" 
          value={editingItem[field] ?? 0} 
          onChange={(e) => updateFormKey(field, e.target.value)} 
          className="w-full bg-black border border-zinc-800 p-1.5 rounded text-white text-right font-mono text-xs focus:outline-none focus:border-red-500" 
        />
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-6 w-full bg-[#050507] text-slate-100 min-h-screen font-mono text-xs text-left relative overflow-hidden select-none">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-900 pb-4 relative z-10">
        <div>
          <span className="text-[10px] font-bold text-red-500 tracking-widest uppercase block flex items-center gap-1.5">
            <Radio size={12} className="animate-ping text-red-500" /> CONSOLA MAESTRA DE BALANCES v4.5
          </span>
          <h1 className="text-lg md:text-xl font-black text-white uppercase mt-1 font-sans">Panel de Control Atómico Semilla</h1>
          <p className="text-xs text-zinc-400 font-sans mt-0.5">Gestión de inventarios y sinergias de flota reales de Sasori.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button onClick={handleOpenCreator} className="flex items-center gap-1.5 bg-red-650 hover:bg-red-700 text-white font-bold font-sans px-3 py-1.5 rounded-lg text-[11px] transition-all cursor-pointer shadow-lg">
            <Plus size={14} /> REGISTRAR ASSET DESDE CERO
          </button>
          <button onClick={loadLiveMatrixData} className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 px-3 py-1.5 rounded-lg text-[11px] text-zinc-350 transition-all cursor-pointer">
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> RE-MUESTREAR BASE
          </button>
        </div>
      </div>

      {/* MONITOR TELEMÉTRICO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-zinc-950 p-3 border border-zinc-900 rounded-xl z-10 relative">
        <div className="flex items-center gap-2.5">
          <Database size={16} className="text-cyan-400" />
          <div>
            <p className="text-zinc-500 text-[10px]">TABLA OPERATIVA POSTGRES ACTIVA</p>
            <p className="text-zinc-200 font-bold text-xs">"public"."{currentTabConfig.table}"</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 border-t md:border-t-0 md:border-l border-zinc-900 pt-2 md:pt-0 md:pl-4">
          <Layers size={16} className="text-emerald-400" />
          <div>
            <p className="text-zinc-500 text-[10px]">VOLUMEN DE ASSETS EXPUESTOS</p>
            <p className="font-bold text-xs text-emerald-400">{rawPayloadCount === -1 ? 'Leyendo trazas...' : `${rawPayloadCount} registros vinculados`}</p>
          </div>
        </div>
      </div>

      {dbError && (
        <div className="bg-red-950/20 border border-red-900/40 rounded-xl p-4 flex gap-3 text-red-400 font-sans z-10 relative">
          <ShieldAlert size={20} className="shrink-0 text-red-500 mt-0.5" />
          <div>
            <h4 className="font-bold text-xs font-mono uppercase text-red-400">Error de Enlace Central</h4>
            <code className="block bg-black px-3 py-1.5 rounded mt-2 border border-zinc-900 text-[11px] font-mono text-red-300">{dbError}</code>
          </div>
        </div>
      )}

      {/* ENLACE COGNITIVO DEL PILOTO */}
      <div className="bg-zinc-900/40 p-3 border border-zinc-850 rounded-xl flex flex-col sm:flex-row items-center gap-3 z-10 relative">
        <span className="text-zinc-400 font-bold flex items-center gap-1.5 whitespace-nowrap"><Search className="w-4 h-4 text-red-500" /> Consola de Enlace Piloto:</span>
        <input
          type="text"
          placeholder="Ingrese UID de cuenta, Correo o dApp Wallet..."
          className="w-full bg-black border border-zinc-800 p-2 rounded-lg text-white focus:outline-none focus:border-red-500 font-mono text-xs uppercase"
          value={playerSearchQuery}
          onChange={e => setPlayerSearchQuery(e.target.value)}
        />
        <button onClick={handleLinkPilotTerminal} className="px-4 py-2 bg-red-650 hover:bg-red-600 text-white rounded-lg font-bold uppercase whitespace-nowrap transition-colors cursor-pointer">
          SINCRO_PILOTO
        </button>
      </div>

      {/* METADATA BANNER DEL PILOTO DETECTADO */}
      {auditedUser && (
        <div className="p-3 bg-zinc-900/20 border border-red-500/10 rounded-lg flex flex-wrap justify-between items-center gap-4 z-10 relative">
          <div>
            <span className="text-[10px] text-zinc-500 block uppercase">Comandante Auditando</span>
            <strong className="text-sm text-red-500 font-sans">{auditedUser.username || auditedUser.display_name || 'Piloto'}</strong>
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 block uppercase">Correo Vinculado</span>
            <span className="text-zinc-300">{auditedUser.email || 'N/A'}</span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 block uppercase">Nivel C.A.N.</span>
            <span className="text-amber-400 font-bold">{auditedUser.can_level || auditedUser.level || 1}</span>
          </div>
          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-bold text-[9px]">CONNECTED_DB</span>
        </div>
      )}

      {/* PESTAÑAS */}
      <div className="flex gap-1 overflow-x-auto border-b border-zinc-900 pb-2 no-scrollbar z-10 relative">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); setEditingItem(null); }} className={`px-3 py-2 text-[10.5px] font-extrabold tracking-wider transition-all rounded-lg whitespace-nowrap cursor-pointer ${activeTab === tab.id ? 'bg-red-650 text-white shadow-md' : 'text-zinc-400 hover:bg-zinc-900/40 hover:text-zinc-200'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* FILTROS */}
      <div className="bg-zinc-950 p-3 border border-zinc-900 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 text-xs z-10 relative">
        <div className="flex items-center gap-2 w-full">
          <Search size={14} className="text-red-500 shrink-0" />
          <input type="text" placeholder={`Buscar en ${currentTabConfig.table}...`} className="w-full bg-black border border-zinc-800 p-2 rounded-lg text-zinc-200 focus:outline-none focus:border-red-500 font-mono uppercase" value={searchFilter} onChange={e => setSearchFilter(e.target.value)} />
        </div>
        <select value={rarityFilter} onChange={e => setRarityFilter(e.target.value)} className="bg-black border border-zinc-850 p-2 rounded-lg font-mono text-zinc-400 outline-none cursor-pointer shrink-0 w-full md:w-auto">
          <option value="Todas">Rarezas: Todas</option>
          <option value="Common">Common</option>
          <option value="Uncommon">Uncommon</option>
          <option value="Rare">Rare</option>
          <option value="Epic">Epic</option>
          <option value="Legendary">Legendary</option>
        </select>
      </div>

      {/* ACCIONES EN LOTE */}
      {selectedIds.length > 0 && (
        <div className="p-3 bg-red-950/20 border border-red-500/30 rounded-lg flex flex-col md:flex-row items-center justify-between gap-3 text-xs animate-fadeIn z-10 relative">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            <span className="font-mono text-zinc-300">
              Modificación masiva: <strong className="text-red-500 font-bold">{selectedIds.length}</strong> assets marcados en {currentTabConfig.table}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <select
              value={bulkRarity}
              onChange={(e) => setBulkRarity(e.target.value)}
              className="bg-black border border-zinc-800 rounded p-1.5 text-zinc-300 font-mono outline-none cursor-pointer"
            >
              <option value="no_change">Sin alterar Rareza</option>
              <option value="Common">Common</option>
              <option value="Uncommon">Uncommon</option>
              <option value="Rare">Rare</option>
              <option value="Epic">Epic</option>
              <option value="Legendary">Legendary</option>
            </select>

            <button
              onClick={handleApplyBulkMatrix}
              className="px-3 py-1.5 bg-red-650 hover:bg-red-600 text-white font-bold uppercase font-mono rounded transition-colors cursor-pointer"
            >
              Aplicar a la Base Semilla ({selectedIds.length})
            </button>

            <button
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded shadow-lg flex items-center gap-2 text-xs uppercase cursor-pointer"
            >
              <Trash2 size={13} /> ELIMINAR SELECCIONADOS ({selectedIds.length})
            </button>
          </div>
        </div>
      )}

      {/* REJILLA Y AUDITORÍA COMPUESTA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start z-10 relative">
        
        {/* COLUMNA IZQUIERDA: REGISTROS SEMILLA (2/3) */}
        <div className="lg:col-span-2 bg-zinc-900/10 border border-zinc-900 p-4 rounded-xl space-y-4">
          <span className="text-[11px] font-bold text-red-500 uppercase tracking-widest block">REGISTROS SEMILLA EN "public"."{currentTabConfig.table}"</span>

          {loading ? (
            <div className="p-16 text-center text-zinc-500 animate-pulse tracking-widest font-mono">MINANDO MANIFIESTOS REALES...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredItems.map((item) => {
                const currentId = item[currentTabConfig.pk] || item.id || item.blueprint_id;
                const currentName = item[currentTabConfig.nameCol] || item.name || 'Asset Sin Nombre';
                const isSelected = selectedIds.includes(currentId);
                const assetImg = item.image_url || item.avatar_url || item.badge_url || item.icon_url;

                return (
                  <div key={currentId} className={`bg-black/40 border ${isSelected ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.15)]' : 'border-zinc-900'} p-4 rounded-xl flex flex-col justify-between space-y-4 hover:border-zinc-800 transition-all relative cursor-pointer`} onClick={() => setSelectedMatrixItem(item)}>
                    
                    <div className="absolute top-2 right-2 z-30" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="w-4 h-4 accent-red-600 rounded bg-black border-zinc-800 cursor-pointer"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedIds(prev => [...prev, currentId]);
                          else setSelectedIds(prev => prev.filter(id => id !== currentId));
                        }}
                      />
                    </div>
                    
                    <div className="space-y-2.5">
                      <div className="w-full h-32 bg-zinc-950/60 rounded-xl border border-zinc-850 flex items-center justify-center overflow-hidden relative group">
                        <input 
                          type="file" 
                          accept="image/webp,image/png,image/jpeg"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                          title="Subir imagen WebP"
                          onChange={(e) => handleImageUploadToStorage(e, currentId)}
                          disabled={uploadingId === currentId}
                        />

                        {uploadingId === currentId ? (
                          <div className="text-center text-cyan-500 flex flex-col items-center gap-1.5 animate-pulse font-mono z-10">
                            <RefreshCw size={22} className="animate-spin" />
                            <span className="text-[10px]">Subiendo...</span>
                          </div>
                        ) : assetImg ? (
                          <>
                            <img src={assetImg} alt={currentName} loading="lazy" className="w-full h-full object-contain scale-95 z-0" />
                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                              <UploadCloud size={24} className="text-white mb-1" />
                              <span className="text-white text-[10px] font-bold">Reemplazar Asset</span>
                            </div>
                          </>
                        ) : (
                          <div className="text-center text-zinc-700 flex flex-col items-center gap-1.5 font-mono group-hover:text-zinc-400 transition-colors z-10 pointer-events-none">
                            <Camera size={22} />
                            <span className="text-[10px]">Sin Imagen WebP</span>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between items-start gap-2 pt-0.5">
                        <div className="min-w-0">
                          <h3 className="text-white text-xs font-bold font-sans tracking-wide truncate">{currentName}</h3>
                          <span className="text-[9.5px] text-zinc-500 font-mono block truncate">ID: {currentId}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[8.5px] font-bold uppercase bg-zinc-900 text-zinc-400 border border-zinc-800">{item.rarity || 'Common'}</span>
                      </div>

                      <p className="text-zinc-400 font-sans leading-relaxed text-[11px] line-clamp-2">{item.description || 'Sin manifiesto registrado.'}</p>
                    </div>

                    <div className="pt-2 z-10 relative border-t border-zinc-900 flex gap-2">
                      <button onClick={(e) => { e.stopPropagation(); handleOpenEditor(item); }} className="flex-1 flex items-center justify-center gap-1.5 bg-zinc-900 hover:bg-red-650 border border-zinc-800 text-zinc-300 hover:text-white transition-all py-1.5 rounded-lg text-[11px] font-bold font-sans cursor-pointer">
                        <Edit3 size={12} /> CONFIGURAR STATS
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteAsset(item); }}
                        className="bg-red-950/40 hover:bg-red-800/60 text-red-400 border border-red-700/50 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Eliminar Asset"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* COLUMNA DERECHA: AUDITORÍA DEL PILOTO (1/3) */}
        <div className="bg-black border border-zinc-900 p-4 rounded-xl space-y-4 h-fit">
          <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest block">AUDITORÍA E INYECCIÓN DE ACTIVOS EN VIVO</span>

          {!auditedUser ? (
            <div className="p-6 text-center text-zinc-600 border border-dashed border-zinc-850 rounded-lg leading-relaxed text-[11px] font-sans">
              Sin piloto acoplado al módulo. Utilice la consola superior para buscar un capitán (email o ID) y auditar sus activos síncronos en caliente.
            </div>
          ) : (
            <div className="space-y-3">
              <span className="text-[10px] text-zinc-500 block border-b border-zinc-900 pb-1 uppercase">Módulos en Órbita ({playerInventory.length})</span>

              {filteredItems.map(seed => {
                const currentId = seed[currentTabConfig.pk] || seed.id || seed.blueprint_id;
                const userAsset = playerInventory.find(item => item.asset_id === currentId);
                const currentLevel = userAsset ? userAsset.current_level : 0;

                return (
                  <div key={currentId} className="p-2.5 bg-zinc-900/60 border border-zinc-850 rounded-md flex justify-between items-center gap-3 text-xs">
                    <div className="max-w-[60%]">
                      <span className="font-bold text-zinc-200 block truncate">{seed[currentTabConfig.nameCol] || seed.name || currentId}</span>
                      <span className="text-[10px] font-mono text-zinc-500">Nivel: <strong className={currentLevel > 0 ? 'text-red-500' : 'text-zinc-600'}>{currentLevel}</strong></span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => handleAlterAssetLevel(currentId, -1)} disabled={currentLevel === 0} className="p-1 px-2 bg-black border border-zinc-800 rounded font-bold hover:bg-zinc-800 text-zinc-400 disabled:opacity-20 cursor-pointer">-1</button>
                      <button onClick={() => handleAlterAssetLevel(currentId, 1)} className="p-1 px-2 bg-black border border-zinc-800 rounded font-bold hover:bg-zinc-800 text-emerald-400 cursor-pointer">+1</button>
                      <button onClick={() => handleAlterAssetLevel(currentId, -currentLevel)} disabled={currentLevel === 0} className="p-1 px-1.5 bg-red-950/20 border border-red-900/30 text-red-500 rounded font-bold hover:bg-red-600 hover:text-white disabled:opacity-20 cursor-pointer">✕</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* OVERLAY DE EDICIÓN / CREACIÓN */}
      <AnimatePresence>
        {editingItem && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex justify-end z-50 font-sans">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="w-full max-w-xl bg-[#09090c] h-full border-l border-zinc-900 p-6 shadow-2xl flex flex-col justify-between overflow-y-auto font-mono text-xs text-left">
              <div className="flex justify-between items-start border-b border-zinc-900 pb-3">
                <div>
                  <span className="text-red-500 text-[10px] font-bold block uppercase tracking-widest">{editorMode === 'CREATE' ? '🚀 NUEVA INYECCIÓN SEMILLA' : '📡 CONSOLA DE BALANCE OPERATIVO'}</span>
                  <h2 className="text-sm font-bold text-white mt-1 font-sans truncate">{editorMode === 'CREATE' ? `Alta en ${currentTabConfig.table}` : `Modificando: ${editingItem[currentTabConfig.nameCol] || editingItem[currentTabConfig.pk] || editingItem.id}`}</h2>
                </div>
                <button type="button" onClick={() => setEditingItem(null)} className="p-1 rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"><X size={14} /></button>
              </div>

              <form onSubmit={handleSaveAssetUpdate} className="space-y-4 py-4 flex-1 overflow-y-auto pr-1">
                <div className="grid grid-cols-2 gap-3 text-zinc-400">
                  <div className="col-span-2">
                    <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1">ID del Asset ({currentTabConfig.pk})</label>
                    <input type="text" disabled={editorMode === 'EDIT'} value={editingItem[currentTabConfig.pk] || editingItem.id || ''} onChange={(e) => updateFormKey(currentTabConfig.pk, e.target.value)} className="w-full bg-black border border-zinc-850 p-2 rounded text-white font-mono font-bold text-xs disabled:opacity-45 focus:outline-none focus:border-red-500 uppercase" />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1">Nombre del Componente ({currentTabConfig.nameCol})</label>
                    <input type="text" value={editingItem[currentTabConfig.nameCol] || editingItem.name || ''} onChange={(e) => updateFormKey(currentTabConfig.nameCol, e.target.value)} className="w-full bg-black border border-zinc-850 p-2 rounded text-white focus:outline-none focus:border-red-500 font-sans text-xs uppercase" />
                  </div>

                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1">Rareza Base</label>
                    <input type="text" value={editingItem.rarity || ''} onChange={(e) => updateFormKey('rarity', e.target.value)} className="w-full bg-black border border-zinc-850 p-2 rounded text-white focus:outline-none" />
                  </div>

                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1">Colección (collection)</label>
                    <input type="text" value={editingItem.collection || ''} onChange={(e) => updateFormKey('collection', e.target.value)} className="w-full bg-black border border-zinc-850 p-2 rounded text-white focus:outline-none" />
                  </div>

                  {activeTab === 'SHIPS' && (
                    <>
                      <div className="col-span-2 grid grid-cols-2 gap-3 bg-zinc-950 p-3 rounded-xl border border-zinc-900">
                        <span className="col-span-2 text-[9.5px] text-cyan-400 font-bold uppercase block border-b border-zinc-900 pb-1">Atributos de Protección y Ataque</span>
                        {renderStatInput('Shield', 'shield')}
                        {renderStatInput('Defense', 'defense')}
                        {renderStatInput('Resistance', 'resistance')}
                        {renderStatInput('Speed Boost %', 'speed_boost')}
                        {renderStatInput('Attack Standard', 'attack_standard')}
                        {renderStatInput('Cargo Capacity', 'cargo_capacity')}
                      </div>
                    </>
                  )}

                  {activeTab === 'BADGES' && (
                    <div className="col-span-2 grid grid-cols-2 gap-3 bg-zinc-950 p-3.5 rounded-xl border border-zinc-900">
                      <span className="col-span-2 text-[10.5px] text-amber-400 font-bold uppercase block border-b border-zinc-900 pb-1 flex items-center gap-1.5">
                        <Award size={14} /> PARÁMETROS OPERATIVOS DE LA INSIGNIA (BADGE)
                      </span>
                      <div>
                        {renderStatInput('Duración en Días (duration_days)', 'duration_days')}
                        <span className="text-[8.5px] text-zinc-500 mt-1 block">Días de validez tras equiparse</span>
                      </div>
                      <div>
                        {renderStatInput('Slots Ocupados en C.A.N. (can_slots)', 'can_slots')}
                        <span className="text-[8.5px] text-zinc-500 mt-1 block">Capacidad consumida en C.A.N.</span>
                      </div>
                    </div>
                  )}

                  {activeTab === 'BLUEPRINTS' && (
                    <div className="col-span-2 space-y-4 bg-zinc-950 p-3.5 rounded-xl border border-zinc-900">
                      <span className="text-[10.5px] text-cyan-400 font-bold uppercase block border-b border-zinc-900 pb-1">
                        🗺️ CONFIGURACIÓN DEL BLUEPRINT (PLANOS DE CRAFTEO)
                      </span>

                      {/* TIPO Y SELECCIÓN DE ACTIVO RESULTANTE */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">
                            Tipo de Activo Resultante
                          </label>
                          <select
                            value={editingItem.target_asset_type || 'SHIPS'}
                            onChange={(e) => {
                              updateFormKey('target_asset_type', e.target.value);
                              updateFormKey('target_asset_id', '');
                              setTargetAssetSearch('');
                            }}
                            className="w-full bg-black border border-zinc-800 p-2 rounded text-white text-xs focus:outline-none focus:border-red-500 cursor-pointer font-mono uppercase"
                          >
                            {TARGET_ASSET_TYPES.map(cat => (
                              <option key={`target-cat-${cat.id}`} value={cat.id}>{cat.label}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">
                              Activo Resultante ({targetCategoryAssets.length} Disponibles)
                            </label>
                            {loadingTargetAssets && (
                              <span className="text-[9px] text-cyan-400 animate-pulse font-mono">Cargando...</span>
                            )}
                          </div>

                          {/* BUSCADOR RÁPIDO DENTRO DE LOS ACTIVOS DE LA CATEGORÍA */}
                          <input
                            type="text"
                            placeholder="🔍 Filtrar activos por nombre o ID..."
                            value={targetAssetSearch}
                            onChange={(e) => setTargetAssetSearch(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 p-1.5 rounded text-zinc-200 font-mono text-[10px] focus:outline-none focus:border-red-500 mb-1.5"
                          />

                          <select
                            value={editingItem.target_asset_id || ''}
                            onChange={(e) => updateFormKey('target_asset_id', e.target.value)}
                            className="w-full bg-black border border-zinc-800 p-2 rounded text-cyan-300 font-mono text-xs focus:outline-none focus:border-red-500 cursor-pointer uppercase"
                          >
                            <option value="">-- SELECCIONAR ACTIVO EXISTENTE --</option>
                            {filteredTargetAssets.map(asset => {
                              const { id: assetId, name: assetName } = extractAssetDetails(asset);
                              return (
                                <option key={`target-asset-${assetId}`} value={assetId}>
                                  {assetName} [{assetId}]
                                </option>
                              );
                            })}
                          </select>

                          <div className="mt-1.5">
                            <label className="text-[8.5px] text-zinc-500 uppercase font-mono block mb-0.5">
                              ID de Activo Vinculado (O Ingrese ID Manual):
                            </label>
                            <input
                              type="text"
                              placeholder="ID de Activo Resultante..."
                              value={editingItem.target_asset_id || ''}
                              onChange={(e) => updateFormKey('target_asset_id', e.target.value)}
                              className="w-full bg-black border border-zinc-900 p-1.5 rounded text-amber-300 font-mono text-[10px] focus:outline-none focus:border-red-500 uppercase font-bold"
                            />
                          </div>
                        </div>
                      </div>

                      {/* USOS POR DEFECTO */}
                      <div>
                        {renderStatInput('Usos por Defecto (Max Uses)', 'default_max_uses')}
                      </div>

                      {/* MATERIALES REQUERIDOS */}
                      <div className="space-y-2 border-t border-zinc-900 pt-3">
                        <div className="flex justify-between items-center">
                          <label className="text-[9px] text-amber-400 font-bold uppercase tracking-wider block">
                            🪨 Materiales Requeridos para Crafteo
                          </label>
                          <button
                            type="button"
                            onClick={handleAddMaterialRow}
                            className="px-2 py-1 bg-amber-950/60 hover:bg-amber-900 border border-amber-800/60 text-amber-300 font-bold text-[9px] uppercase rounded flex items-center gap-1 cursor-pointer"
                          >
                            <Plus size={12} /> Añadir Material
                          </button>
                        </div>

                        {Object.keys(bpMaterials).length === 0 ? (
                          <p className="text-[10px] text-zinc-600 italic py-1">Sin costo de materiales registrado (Crafteo gratuito en recursos).</p>
                        ) : (
                          <div className="space-y-2">
                            {Object.entries(bpMaterials).map(([matKey, matQty]) => (
                              <div key={`bp-mat-${matKey}`} className="flex items-center gap-2 bg-black/60 p-2 rounded-lg border border-zinc-850">
                                <select
                                  value={matKey}
                                  onChange={(e) => handleUpdateMaterialRow(matKey, e.target.value, Number(matQty))}
                                  className="bg-zinc-950 border border-zinc-800 p-1.5 rounded text-amber-300 font-mono text-xs outline-none cursor-pointer flex-1"
                                >
                                  {MATERIAL_OPTIONS.map(m => (
                                    <option key={`mat-opt-${m.id}`} value={m.id}>{m.label}</option>
                                  ))}
                                </select>
                                <input
                                  type="number"
                                  min={0}
                                  value={matQty}
                                  onChange={(e) => handleUpdateMaterialRow(matKey, matKey, Number(e.target.value) || 0)}
                                  className="bg-zinc-950 border border-zinc-800 p-1.5 rounded text-white font-mono text-xs outline-none w-28 text-right font-bold"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMaterialRow(matKey)}
                                  className="p-1.5 text-zinc-500 hover:text-red-400 cursor-pointer"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* MONEDAS REQUERIDAS */}
                      <div className="space-y-2 border-t border-zinc-900 pt-3">
                        <div className="flex justify-between items-center">
                          <label className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider block">
                            🪙 Monedas / Divisas Requeridas
                          </label>
                          <button
                            type="button"
                            onClick={handleAddCurrencyRow}
                            className="px-2 py-1 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-800/60 text-emerald-300 font-bold text-[9px] uppercase rounded flex items-center gap-1 cursor-pointer"
                          >
                            <Plus size={12} /> Añadir Moneda
                          </button>
                        </div>

                        {Object.keys(bpCurrencies).length === 0 ? (
                          <p className="text-[10px] text-zinc-600 italic py-1">Sin costo en monedas registrado.</p>
                        ) : (
                          <div className="space-y-2">
                            {Object.entries(bpCurrencies).map(([currKey, currQty]) => (
                              <div key={`bp-curr-${currKey}`} className="flex items-center gap-2 bg-black/60 p-2 rounded-lg border border-zinc-850">
                                <select
                                  value={currKey}
                                  onChange={(e) => handleUpdateCurrencyRow(currKey, e.target.value, Number(currQty))}
                                  className="bg-zinc-950 border border-zinc-800 p-1.5 rounded text-emerald-400 font-mono text-xs outline-none cursor-pointer flex-1"
                                >
                                  {CURRENCY_OPTIONS.map(c => (
                                    <option key={`curr-opt-${c.id}`} value={c.id}>{c.label}</option>
                                  ))}
                                </select>
                                <input
                                  type="number"
                                  min={0}
                                  value={currQty}
                                  onChange={(e) => handleUpdateCurrencyRow(currKey, currKey, Number(e.target.value) || 0)}
                                  className="bg-zinc-950 border border-zinc-800 p-1.5 rounded text-white font-mono text-xs outline-none w-28 text-right font-bold"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveCurrencyRow(currKey)}
                                  className="p-1.5 text-zinc-500 hover:text-red-400 cursor-pointer"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* MÓDULOS DE HABILIDAD (OCULTO EN BLUEPRINTS) */}
                  {activeTab !== 'BLUEPRINTS' ? (
                    <div className="col-span-2 border-t border-zinc-900 pt-3">
                      <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1">Módulos de Habilidad (Skills)</label>
                      <div className="flex gap-2">
                        <select
                          value={newSkillInput}
                          onChange={(e) => setNewSkillInput(e.target.value)}
                          className="flex-1 bg-black border border-zinc-850 p-2 rounded text-zinc-200 text-xs font-mono outline-none focus:border-red-500 cursor-pointer"
                        >
                          <option value="">-- Seleccionar Skill --</option>
                          {masterSkills.map(sk => (
                            <option key={`sk-opt-${sk.skill_code}`} value={sk.skill_code}>
                              {sk.base_name} (T{sk.tier_level})
                            </option>
                          ))}
                        </select>
                        <button type="button" onClick={addSkillTag} className="bg-red-650 hover:bg-red-700 text-white font-bold px-3 py-2 rounded text-xs transition-all flex items-center gap-1 cursor-pointer"><PlusCircle size={14} /> EQUIPAR</button>
                      </div>

                      {Array.isArray(editingItem.skills) && editingItem.skills.length > 0 && (
                        <div className="mt-2.5 space-y-1.5">
                          {editingItem.skills.map((sk: any, idx: number) => (
                            <div key={`equipped-sk-${idx}`} className="flex justify-between items-center bg-black/40 border border-zinc-850 p-1.5 px-2 rounded-lg">
                              <span className="text-[10px] font-mono text-cyan-300">{typeof sk === 'string' ? sk : sk?.skill_id}</span>
                              <button type="button" onClick={() => removeSkillTag(idx)} className="text-red-500 hover:text-red-400 p-1 cursor-pointer"><Trash2 size={12} /></button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="col-span-2 border-t border-zinc-900 pt-3">
                      <div className="p-2.5 bg-zinc-950/80 border border-zinc-900 rounded-lg text-zinc-500 text-[10px] font-mono italic">
                        ℹ️ Los Blueprints son esquemas de ensamblaje estáticos. Su función única es fabricar el activo resultante indicado utilizando recursos y monedas.
                      </div>
                    </div>
                  )}

                  <div className="col-span-2">
                    <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1">Descripción</label>
                    <textarea rows={2} value={editingItem.description || ''} onChange={(e) => updateFormKey('description', e.target.value)} className="w-full bg-black border border-zinc-850 p-2 rounded text-white font-sans text-xs" />
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-900">
                  <button type="submit" disabled={saveLoading} className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold font-sans py-2.5 rounded-xl uppercase tracking-wider text-[11px] transition-all cursor-pointer shadow-lg">
                    <Save size={14} /> {saveLoading ? 'Procesando en Postgres...' : 'Persistir Modificaciones'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default ComponentMatrix;