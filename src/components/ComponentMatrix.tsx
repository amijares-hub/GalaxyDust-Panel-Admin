import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { 
  RefreshCw, Search, ShieldAlert, Database, Radio, Layers, Edit3, X, Save, Plus, Camera, 
  UploadCloud, Sliders, Flame, Coins, Hammer, Boxes, Trash2, PlusCircle, Award, Shield, Swords
} from 'lucide-react';
import { CombatSandboxOverlay } from './CombatSandboxTester';

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
  const id = asset.ship_id || asset.defense_id || asset.structure_id || asset.id || '';
  const name = asset.ship_name || asset.defense_name || asset.name || id || 'Sin Nombre';
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

  const [editorMode, setEditorMode] = useState<'EDIT' | 'CREATE'>('EDIT');
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [saveLoading, setSaveLoading] = useState<boolean>(false);
  const [newSkillInput, setNewSkillInput] = useState<string>('');

  // Piloto auditado e inventario
  const [playerSearchQuery, setPlayerSearchQuery] = useState('');
  const [auditedUser, setAuditedUser] = useState<any>(null);
  const [playerInventory, setPlayerInventory] = useState<UserAssetRow[]>([]);

  // Modal Combat Sandbox
  const [sandboxShip, setSandboxShip] = useState<any | null>(null);

  // Estados Blueprints
  const [bpMaterials, setBpMaterials] = useState<Record<string, number>>({});
  const [bpCurrencies, setBpCurrencies] = useState<Record<string, number>>({});
  const [targetCategoryAssets, setTargetCategoryAssets] = useState<any[]>([]);
  const [loadingTargetAssets, setLoadingTargetAssets] = useState<boolean>(false);
  const [targetAssetSearch, setTargetAssetSearch] = useState<string>('');

  const tabs = [
    { id: 'SHIPS', label: '🚀 Naves', table: 'seed_ships', userTable: 'user_ships', pk: 'ship_id', userPk: 'id_ship', nameCol: 'ship_name' },
    { id: 'STRUCTURES', label: '🏢 Estructuras', table: 'seed_structures', userTable: 'user_structures', pk: 'id', userPk: 'id_structure', nameCol: 'name' },
    { id: 'DEFENSES', label: '🛡️ Defensas', table: 'seed_defenses', userTable: 'user_defenses', pk: 'defense_id', userPk: 'id_defense', nameCol: 'defense_name' },
    { id: 'TECHNOLOGIES', label: '🔬 Tecnologías', table: 'seed_technologies', userTable: 'user_technologies', pk: 'id', userPk: 'id_technology', nameCol: 'name' },
    { id: 'BADGES', label: '🏅 Insignias', table: 'seed_badges', userTable: 'user_badges', pk: 'id', userPk: 'id_badge', nameCol: 'name' },
    { id: 'BLUEPRINTS', label: '🗺️ Planos', table: 'seed_blueprints', userTable: 'user_blueprints', pk: 'id', userPk: 'id_blueprint', nameCol: 'name' },
    { id: 'LICENSES', label: '📜 Licencias', table: 'seed_licenses', userTable: 'user_licenses', pk: 'id', userPk: 'id', nameCol: 'name' },
    { id: 'TOOLS', label: '🔧 Tools', table: 'seed_tools', userTable: 'user_tools', pk: 'id', userPk: 'id_tool', nameCol: 'name' },
    { id: 'CONSUMABLES', label: '🧪 Consumibles', table: 'seed_consumables', userTable: 'user_qmps', pk: 'id', userPk: 'id_qmp', nameCol: 'name' },
    { id: 'ASTROBOTS', label: '🤖 Astrobots', table: 'seed_astrobots', userTable: 'user_astrobots', pk: 'id', userPk: 'id_astrobot', nameCol: 'name' }
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
      if (!error && data) setMasterSkills(data);
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

  const fetchTargetAssets = async (typeId: string) => {
    const config = getTargetConfig(typeId);
    setLoadingTargetAssets(true);
    try {
      const { data } = await supabase.from(config.table).select('*');
      setTargetCategoryAssets(data || []);
    } catch {
      setTargetCategoryAssets([]);
    } finally {
      setLoadingTargetAssets(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'BLUEPRINTS' && editingItem) {
      fetchTargetAssets(editingItem.target_asset_type || 'SHIPS');
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
        setDbError(`${error.code || 'ERR'}: La tabla "${currentTabConfig.table}" no responde.`);
        return;
      }

      const sanitizedData = (data || []).map((row: any) => {
        let cleanSkills: any[] = [];
        if (Array.isArray(row.skills)) cleanSkills = row.skills;
        else if (typeof row.skills === 'string' && row.skills.trim()) {
          try {
            const parsed = JSON.parse(row.skills);
            cleanSkills = Array.isArray(parsed) ? parsed : Object.values(parsed);
          } catch {
            cleanSkills = [];
          }
        }
        return { ...row, skills: cleanSkills };
      });

      setRawPayloadCount(sanitizedData.length);
      setRawItems(sanitizedData);

      // Carga Dual de Inventario del Piloto
      if (auditedUser) {
        const userId = auditedUser.id || auditedUser.user_id;
        const legacyId = auditedUser.legacy_id ? Number(auditedUser.legacy_id) : undefined;

        let invRows: any[] = [];

        if (legacyId) {
          const { data: legData } = await supabase
            .from(currentTabConfig.userTable)
            .select('*')
            .eq('id_user', legacyId);
          if (legData) invRows = [...legData];
        }

        if (userId) {
          const { data: uuidData } = await supabase
            .from(currentTabConfig.userTable)
            .select('*')
            .eq('user_id', userId);
          if (uuidData) {
            const seen = new Set(invRows.map(r => r.id));
            uuidData.forEach(r => { if (!seen.has(r.id)) invRows.push(r); });
          }
        }

        const mapped: UserAssetRow[] = invRows.map(inv => ({
          id: String(inv.id),
          user_id: String(inv.user_id || inv.id_user),
          asset_id: String(inv[currentTabConfig.userPk] || inv.ship_id || inv.id_ship || inv.id || ''),
          current_level: Number(inv.level || inv.lvl || inv.quantity || 1),
          asset_type: currentTabConfig.id.toLowerCase()
        }));

        setPlayerInventory(mapped);
      }
    } catch (e: any) {
      setDbError(`EXCEPCIÓN CRÍTICA: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const notify = (status: 'success' | 'error', message: string) => {
    if (setIsAlertToShow) setIsAlertToShow({ show: true, status, message });
    else alert(`[${status.toUpperCase()}] ${message}`);
  };

  const handleLinkPilotTerminal = async () => {
    if (!playerSearchQuery.trim()) {
      return notify('error', 'Ingrese UID, Legacy ID o Nombre.');
    }
    const query = playerSearchQuery.trim();

    try {
      let matched: any = null;
      if (!isNaN(Number(query))) {
        const { data } = await supabase.from('user_profiles').select('*').eq('legacy_id', Number(query)).maybeSingle();
        if (data) matched = data;
      }
      if (!matched) {
        const { data } = await supabase.from('user_profiles').select('*').eq('id', query).maybeSingle();
        if (data) matched = data;
      }
      if (!matched) {
        const { data } = await supabase.from('user_profiles').select('*').ilike('username', query).maybeSingle();
        if (data) matched = data;
      }

      if (matched) {
        setAuditedUser(matched);
        notify('success', `Conectado a ${matched.username} (Legacy #${matched.legacy_id || 'N/A'})`);
      } else {
        notify('error', 'Comandante no encontrado en la base de datos.');
      }
    } catch (err: any) {
      notify('error', err.message);
    }
  };

  const handleAlterAssetLevel = async (assetId: string, delta: number) => {
    if (!auditedUser) return;
    const legacyId = auditedUser.legacy_id ? Number(auditedUser.legacy_id) : null;
    const userId = auditedUser.id || auditedUser.user_id;

    try {
      const existing = playerInventory.find(item => item.asset_id === assetId);

      if (existing) {
        const targetLvl = existing.current_level + delta;
        if (targetLvl <= 0) {
          await supabase.from(currentTabConfig.userTable).delete().eq('id', existing.id);
          notify('error', 'Activo desinstalado.');
        } else {
          await supabase.from(currentTabConfig.userTable).update({ level: targetLvl, lvl: targetLvl }).eq('id', existing.id);
          notify('success', 'Nivel actualizado.');
        }
      } else if (delta > 0) {
        const insertPayload: any = {
          user_id: userId,
          [currentTabConfig.userPk]: !isNaN(Number(assetId)) ? Number(assetId) : assetId,
          level: 1
        };
        if (legacyId) insertPayload.id_user = legacyId;

        await supabase.from(currentTabConfig.userTable).insert([insertPayload]);
        notify('success', 'Activo instalado con éxito.');
      }
      loadLiveMatrixData();
    } catch (err: any) {
      alert(`Fallo al modificar: ${err.message}`);
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
      notify('success', `${selectedIds.length} activos actualizados a ${bulkRarity}.`);
      setSelectedIds([]);
      setBulkRarity('no_change');
      loadLiveMatrixData();
    } catch (error: any) {
      notify('error', error.message);
      setLoading(false);
    }
  };

  const handleImageUploadToStorage = async (e: React.ChangeEvent<HTMLInputElement>, targetAssetId: string) => {
    const file = e.target.files?.[0];
    if (!file || !targetAssetId) return;

    try {
      setUploadingId(targetAssetId);
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
      const timestamp = Date.now();
      const customStoragePath = `${currentTabConfig.table}/${targetAssetId}_${timestamp}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('galaxy-assets')
        .upload(customStoragePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('galaxy-assets')
        .getPublicUrl(customStoragePath);

      const pubUrl = `${publicUrlData?.publicUrl}?t=${timestamp}`;

      await supabase
        .from(currentTabConfig.table)
        .update({ image_url: pubUrl, avatar_url: pubUrl })
        .eq(currentTabConfig.pk, targetAssetId);

      notify('success', `Imagen actualizada para [${targetAssetId}].`);
      loadLiveMatrixData();
    } catch (err: any) {
      notify('error', `Fallo de Storage: ${err.message}`);
    } finally {
      setUploadingId(null);
    }
  };

  const handleOpenEditor = (item: any) => {
    setEditorMode('EDIT');
    const cloned = { ...item, skills: [...(item.skills || [])] };
    setEditingItem(cloned);
  };

  const handleOpenCreator = () => {
    setEditorMode('CREATE');
    const defaultItem: any = {
      rarity: 'Common',
      description: '',
      skills: []
    };
    defaultItem[currentTabConfig.pk] = '';
    defaultItem[currentTabConfig.nameCol] = '';
    setEditingItem(defaultItem);
  };

  const updateFormKey = (key: string, value: any) => {
    setEditingItem((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSaveAssetUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const pkCol = currentTabConfig.pk;
    const currentId = editingItem[pkCol] || editingItem.id;

    if (!currentId) return alert("El ID es obligatorio.");

    try {
      setSaveLoading(true);
      const payload = { ...editingItem };

      if (editorMode === 'EDIT') {
        const { error } = await supabase
          .from(currentTabConfig.table)
          .update(payload)
          .eq(pkCol, currentId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from(currentTabConfig.table)
          .insert([payload]);
        if (error) throw error;
      }

      notify('success', `Asset [${currentId}] guardado.`);
      setEditingItem(null);
      loadLiveMatrixData();
    } catch (err: any) {
      alert(`Error al guardar: ${err.message}`);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteAsset = async (asset: any) => {
    const pkCol = currentTabConfig.pk;
    const assetId = asset[pkCol] || asset.id;
    if (!window.confirm(`¿Eliminar permanentemente "${asset[currentTabConfig.nameCol] || assetId}"?`)) return;

    try {
      const { error } = await supabase
        .from(currentTabConfig.table)
        .delete()
        .eq(pkCol, assetId);
      if (error) throw error;
      loadLiveMatrixData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const filteredItems = useMemo(() => {
    const nameCol = currentTabConfig.nameCol;
    const pkCol = currentTabConfig.pk;
    return rawItems.filter(item => {
      const matchSearch = String(item[nameCol] || '').toLowerCase().includes(searchFilter.toLowerCase()) || 
                          String(item[pkCol] || '').toLowerCase().includes(searchFilter.toLowerCase());
      const matchRarity = rarityFilter === 'Todas' || item.rarity === rarityFilter;
      return matchSearch && matchRarity;
    });
  }, [rawItems, searchFilter, rarityFilter, currentTabConfig]);

  return (
    <div className="p-4 md:p-6 space-y-6 w-full bg-[#050507] text-slate-100 min-h-screen font-mono text-xs text-left select-none">
      
      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-900 pb-4">
        <div>
          <span className="text-[10px] font-bold text-red-500 tracking-widest uppercase block flex items-center gap-1.5">
            <Radio size={12} className="animate-pulse" /> CATÁLOGO MAESTRO DE ACTIVOS (PRODUCCIÓN)
          </span>
          <h1 className="text-lg md:text-xl font-black text-white uppercase mt-1">Fuente Única de Verdad de GalaxyDust</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleOpenCreator} className="flex items-center gap-1.5 bg-red-650 hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer shadow-lg">
            <Plus size={14} /> NUEVO ASSET
          </button>
          <button onClick={loadLiveMatrixData} className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 px-3 py-1.5 rounded-lg text-xs text-zinc-300 cursor-pointer">
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> RECARGAR
          </button>
        </div>
      </div>

      {/* TELEMETRÍA DE TABLA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-zinc-950 p-3 border border-zinc-900 rounded-xl">
        <div className="flex items-center gap-2.5">
          <Database size={16} className="text-cyan-400" />
          <div>
            <p className="text-zinc-500 text-[10px]">TABLA MAESTRA ACTIVA</p>
            <p className="text-zinc-200 font-bold text-xs">"public"."{currentTabConfig.table}"</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 border-t md:border-t-0 md:border-l border-zinc-900 pt-2 md:pt-0 md:pl-4">
          <Layers size={16} className="text-emerald-400" />
          <div>
            <p className="text-zinc-500 text-[10px]">REGISTROS EN BASE</p>
            <p className="font-bold text-xs text-emerald-400">{rawPayloadCount} activos catalogados</p>
          </div>
        </div>
      </div>

      {/* CONSOLA DE AUDITORÍA DE PILOTO */}
      <div className="bg-zinc-900/40 p-3 border border-zinc-850 rounded-xl flex flex-col sm:flex-row items-center gap-3">
        <span className="text-zinc-400 font-bold flex items-center gap-1.5 whitespace-nowrap">
          <Search size={14} className="text-red-500" /> Auditar Hangar de Piloto:
        </span>
        <input
          type="text"
          placeholder="Ingrese UID, Legacy ID (#1623) o Username..."
          className="w-full bg-black border border-zinc-800 p-2 rounded-lg text-white font-mono text-xs uppercase outline-none focus:border-red-500"
          value={playerSearchQuery}
          onChange={e => setPlayerSearchQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLinkPilotTerminal()}
        />
        <button onClick={handleLinkPilotTerminal} className="px-4 py-2 bg-red-650 hover:bg-red-600 text-white rounded-lg font-bold uppercase whitespace-nowrap cursor-pointer">
          Vincular
        </button>
      </div>

      {auditedUser && (
        <div className="p-3 bg-zinc-900/40 border border-emerald-500/20 rounded-lg flex flex-wrap justify-between items-center gap-4 text-xs">
          <div>
            <span className="text-[10px] text-zinc-500 block uppercase">Piloto Acoplado:</span>
            <strong className="text-emerald-400">{auditedUser.username}</strong>
            <span className="text-zinc-500 ml-2 font-mono">({auditedUser.legacy_id ? `Legacy #${auditedUser.legacy_id}` : auditedUser.id})</span>
          </div>
          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded font-bold text-[9px]">
            ● HANGAR SINCRONIZADO
          </span>
        </div>
      )}

      {/* TABS DE ACTIVOS */}
      <div className="flex gap-1 overflow-x-auto border-b border-zinc-900 pb-2 custom-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setEditingItem(null); }}
            className={`px-3 py-2 text-[10.5px] font-extrabold tracking-wider rounded-lg whitespace-nowrap cursor-pointer transition-all ${
              activeTab === tab.id ? 'bg-red-650 text-white shadow-md' : 'text-zinc-400 hover:bg-zinc-900/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* FILTROS */}
      <div className="bg-zinc-950 p-3 border border-zinc-900 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full">
          <Search size={14} className="text-zinc-500 shrink-0" />
          <input
            type="text"
            placeholder={`Filtrar en ${currentTabConfig.table}...`}
            className="w-full bg-black border border-zinc-800 p-2 rounded-lg text-white font-mono uppercase text-xs outline-none"
            value={searchFilter}
            onChange={e => setSearchFilter(e.target.value)}
          />
        </div>
        <select
          value={rarityFilter}
          onChange={e => setRarityFilter(e.target.value)}
          className="bg-black border border-zinc-800 p-2 rounded-lg text-zinc-300 outline-none cursor-pointer w-full md:w-auto"
        >
          <option value="Todas">Rareza: Todas</option>
          {['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Phantom'].map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {/* GRID PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Catálogo Maestro (2/3) */}
        <div className="lg:col-span-2 bg-zinc-950 border border-zinc-900 p-4 rounded-xl space-y-4">
          <span className="text-[11px] font-bold text-red-500 uppercase tracking-widest block">
            REGISTROS SEMILLA EN "{currentTabConfig.table}" ({filteredItems.length})
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[650px] overflow-y-auto pr-1 custom-scrollbar">
            {filteredItems.map(item => {
              const currentId = item[currentTabConfig.pk] || item.id;
              const currentName = item[currentTabConfig.nameCol] || item.name || currentId;
              const assetImg = item.image_url || item.avatar_url;

              return (
                <div key={currentId} className="bg-black/60 border border-zinc-900 hover:border-zinc-800 p-4 rounded-xl flex flex-col justify-between space-y-3 shadow-lg">
                  <div className="space-y-2">
                    <div className="w-full h-32 bg-zinc-950 rounded-xl border border-zinc-850 flex items-center justify-center overflow-hidden relative group">
                      <input 
                        type="file" 
                        accept="image/png, image/jpeg, image/webp"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                        onChange={(e) => handleImageUploadToStorage(e, currentId)}
                        disabled={uploadingId === currentId}
                      />
                      {assetImg ? (
                        <img src={assetImg} alt={currentName} className="w-full h-full object-contain p-2" />
                      ) : (
                        <div className="text-center text-zinc-700">
                          <Camera size={22} className="mx-auto mb-1" />
                          <span className="text-[9px]">Subir Imagen</span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-white text-xs truncate max-w-[160px]">{currentName}</h3>
                        <span className="text-[9.5px] text-zinc-500 font-mono">ID: {currentId}</span>
                      </div>
                      <span className="px-1.5 py-0.5 bg-zinc-900 text-zinc-400 border border-zinc-800 rounded text-[8px] font-bold uppercase">
                        {item.rarity || 'Common'}
                      </span>
                    </div>

                    <p className="text-zinc-500 text-[10px] line-clamp-2">{item.description || 'Sin descripción técnica.'}</p>
                  </div>

                  <div className="pt-2 border-t border-zinc-900 flex gap-2">
                    {activeTab === 'SHIPS' && (
                      <button
                        onClick={() => setSandboxShip(item)}
                        className="px-2 py-1.5 bg-emerald-950/60 hover:bg-emerald-900 text-emerald-400 border border-emerald-800 rounded text-[10px] font-bold uppercase cursor-pointer flex items-center gap-1"
                        title="Simular Estadísticas de Combate"
                      >
                        <Swords size={12} /> Sandbox
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenEditor(item)}
                      className="flex-1 py-1.5 bg-zinc-900 hover:bg-red-650 text-zinc-300 hover:text-white rounded text-[10px] font-bold uppercase cursor-pointer transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteAsset(item)}
                      className="p-1.5 bg-red-950/40 hover:bg-red-900 text-red-400 border border-red-900/50 rounded cursor-pointer"
                      title="Eliminar activo"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel de Hangar Auditado en Vivo (1/3) */}
        <div className="bg-black border border-zinc-900 p-4 rounded-xl space-y-4">
          <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest block">
            AUDITORÍA EN VIVO: {auditedUser ? auditedUser.username : 'SIN PILOTO'}
          </span>

          {!auditedUser ? (
            <div className="p-8 text-center text-zinc-600 border border-dashed border-zinc-900 rounded-lg text-xs leading-relaxed">
              Usa la consola superior para buscar un comandante (Legacy ID o Nombre) y auditar su inventario en vivo.
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
              <span className="text-[10px] text-zinc-500 uppercase block border-b border-zinc-900 pb-1">
                Instancias Activas en [{activeTab}] ({playerInventory.length})
              </span>

              {filteredItems.map(seed => {
                const currentId = seed[currentTabConfig.pk] || seed.id;
                const existing = playerInventory.find(item => item.asset_id === String(currentId));
                const currentLvl = existing ? existing.current_level : 0;

                return (
                  <div key={currentId} className="p-2.5 bg-zinc-900/40 border border-zinc-850 rounded-lg flex justify-between items-center text-xs">
                    <div className="truncate pr-2">
                      <span className="font-bold text-white block truncate">{seed[currentTabConfig.nameCol] || currentId}</span>
                      <span className="text-[9px] text-zinc-500">Nivel / Cantidad: <strong className={currentLvl > 0 ? 'text-red-400' : 'text-zinc-600'}>{currentLvl}</strong></span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => handleAlterAssetLevel(String(currentId), -1)} disabled={currentLvl === 0} className="px-2 py-0.5 bg-black border border-zinc-800 rounded font-bold hover:bg-zinc-800 text-zinc-400 disabled:opacity-20 cursor-pointer">-1</button>
                      <button onClick={() => handleAlterAssetLevel(String(currentId), 1)} className="px-2 py-0.5 bg-black border border-zinc-800 rounded font-bold hover:bg-zinc-800 text-emerald-400 cursor-pointer">+1</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* MODAL SIMULADOR COMBAT SANDBOX */}
      {sandboxShip && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-zinc-950 border border-emerald-500/40 rounded-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSandboxShip(null)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white cursor-pointer"
            >
              <X size={18} />
            </button>
            <CombatSandboxOverlay ship={sandboxShip} />
          </div>
        </div>
      )}

      {/* OVERLAY DE EDICIÓN */}
      <AnimatePresence>
        {editingItem && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex justify-end z-50">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="w-full max-w-lg bg-zinc-950 h-full border-l border-zinc-900 p-6 shadow-2xl flex flex-col justify-between overflow-y-auto font-mono text-xs">
              <div className="flex justify-between items-start border-b border-zinc-900 pb-3">
                <div>
                  <span className="text-red-500 text-[10px] font-bold block uppercase">{editorMode === 'CREATE' ? 'ALTA NUEVO ASSET' : 'MODIFICAR STATS'}</span>
                  <h2 className="text-sm font-bold text-white mt-1">{editingItem[currentTabConfig.nameCol] || editingItem[currentTabConfig.pk]}</h2>
                </div>
                <button onClick={() => setEditingItem(null)} className="text-zinc-500 hover:text-white cursor-pointer"><X size={16} /></button>
              </div>

              <form onSubmit={handleSaveAssetUpdate} className="space-y-4 py-4 flex-1">
                <div>
                  <label className="text-zinc-500 text-[10px] uppercase block mb-1">ID Único ({currentTabConfig.pk}):</label>
                  <input
                    type="text"
                    disabled={editorMode === 'EDIT'}
                    value={editingItem[currentTabConfig.pk] || ''}
                    onChange={e => updateFormKey(currentTabConfig.pk, e.target.value)}
                    className="w-full bg-black border border-zinc-800 p-2 rounded text-white text-xs disabled:opacity-40 uppercase"
                  />
                </div>

                <div>
                  <label className="text-zinc-500 text-[10px] uppercase block mb-1">Nombre Oficial:</label>
                  <input
                    type="text"
                    value={editingItem[currentTabConfig.nameCol] || ''}
                    onChange={e => updateFormKey(currentTabConfig.nameCol, e.target.value)}
                    className="w-full bg-black border border-zinc-800 p-2 rounded text-white text-xs uppercase"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-zinc-500 text-[10px] uppercase block mb-1">Rareza:</label>
                    <input
                      type="text"
                      value={editingItem.rarity || 'Common'}
                      onChange={e => updateFormKey('rarity', e.target.value)}
                      className="w-full bg-black border border-zinc-800 p-2 rounded text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-500 text-[10px] uppercase block mb-1">Colección:</label>
                    <input
                      type="text"
                      value={editingItem.collection || 'Sasori Core'}
                      onChange={e => updateFormKey('collection', e.target.value)}
                      className="w-full bg-black border border-zinc-800 p-2 rounded text-white text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-zinc-500 text-[10px] uppercase block mb-1">Descripción Técnica:</label>
                  <textarea
                    rows={3}
                    value={editingItem.description || ''}
                    onChange={e => updateFormKey('description', e.target.value)}
                    className="w-full bg-black border border-zinc-800 p-2 rounded text-white text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saveLoading}
                  className="w-full bg-red-650 hover:bg-red-600 text-white font-bold py-2.5 rounded-lg uppercase tracking-wider text-xs cursor-pointer shadow-lg mt-4"
                >
                  {saveLoading ? 'Guardando...' : 'Persistir en Supabase'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default ComponentMatrix;