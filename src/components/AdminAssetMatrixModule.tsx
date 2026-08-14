import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import {
  Rocket, Building, Shield, Cpu, Award, FileText, Wrench, Package, Bot,
  Search, RefreshCw, UserCheck, Plus, Trash2, Layers, Zap, Info, X, Check,
  Database, Sparkles, Filter, ChevronRight, Layers3, AlertTriangle, UploadCloud
} from 'lucide-react';

export type AssetCategory = 
  | 'Naves' 
  | 'Estructuras' 
  | 'Defensas' 
  | 'Tecnologías' 
  | 'Insignias' 
  | 'Blueprints' 
  | 'Licencias' 
  | 'Tools' 
  | 'Consumibles' 
  | 'Astrobots';

// Mapeo canónico — 'Consumibles' agrupa seed_consumables, seed_bags y seed_packs
const SEED_TABLE_MAPPING: Record<AssetCategory, { seedTables: string[]; userTable: string; icon: any }> = {
  'Naves': {
    seedTables: ['seed_ships'],
    userTable: 'user_ships',
    icon: Rocket
  },
  'Estructuras': {
    seedTables: ['seed_structures'],
    userTable: 'user_structures',
    icon: Building
  },
  'Defensas': {
    seedTables: ['seed_defenses'],
    userTable: 'user_defenses',
    icon: Shield
  },
  'Tecnologías': {
    seedTables: ['seed_technologies'],
    userTable: 'user_technologies',
    icon: Cpu
  },
  'Insignias': {
    seedTables: ['seed_badges'],
    userTable: 'user_badges',
    icon: Award
  },
  'Blueprints': {
    seedTables: ['seed_blueprints'],
    userTable: 'user_blueprints',
    icon: Layers3
  },
  'Licencias': {
    seedTables: ['seed_licenses'],
    userTable: 'user_licenses',
    icon: FileText
  },
  'Tools': {
    seedTables: ['seed_tools'],
    userTable: 'user_tools',
    icon: Wrench
  },
  'Consumibles': {
    seedTables: ['seed_consumables', 'seed_bags', 'seed_packs'], // <--- Agrupa consumibles, bolsas y packs
    userTable: 'user_consumibles',
    icon: Package
  },
  'Astrobots': {
    seedTables: ['seed_astrobots'],
    userTable: 'user_astrobots',
    icon: Bot
  }
};

const resolveImageUrl = (rawUrl?: string, fallbackKey?: string, fileExt?: string) => {
  if (rawUrl && typeof rawUrl === 'string' && rawUrl.trim() !== '') {
    const clean = rawUrl.trim();
    if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
    return `https://qldjeysusithpblfrmtq.supabase.co/storage/v1/object/public/galaxy-assets/${clean.replace(/^\//, '')}`;
  }
  const ext = fileExt || 'png';
  if (fallbackKey) {
    return `https://qldjeysusithpblfrmtq.supabase.co/storage/v1/object/public/galaxy-assets/${fallbackKey}.${ext}`;
  }
  return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=300';
};

export const AdminAssetMatrixModule: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<AssetCategory>('Consumibles');
  const [activeTableUsed, setActiveTableUsed] = useState<string>('seed_consumables');
  const [seedAssets, setSeedAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filtros
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRarity, setSelectedRarity] = useState<string>('Todas');

  // Consola Piloto (Enlace)
  const [pilotSearchInput, setPilotSearchInput] = useState<string>('');
  const [syncedPilot, setSyncedPilot] = useState<any | null>(null);
  const [pilotUserAssets, setPilotUserAssets] = useState<any[]>([]);
  const [pilotSyncLoading, setPilotSyncLoading] = useState<boolean>(false);

  // Inspección de Asset Individual
  const [inspectAsset, setInspectAsset] = useState<any | null>(null);

  // Inyección de Activos
  const [injectQty, setInjectQty] = useState<number>(1);
  const [injectLevel, setInjectLevel] = useState<number>(1);

  // 1. Cargar Semillas de Supabase (Consulta combinada si hay múltiples tablas)
  const fetchSeedAssets = async (category: AssetCategory) => {
    setLoading(true);
    setErrorMsg(null);
    setSeedAssets([]);
    
    const { seedTables } = SEED_TABLE_MAPPING[category];
    let combinedData: any[] = [];
    let successfulTables: string[] = [];
    let errors: string[] = [];

    for (const tableName of seedTables) {
      try {
        const { data, error } = await supabase.from(tableName).select('*');
        if (!error && data) {
          if (data.length > 0) {
            data.forEach((item: any) => {
              const rawId = item.ship_id || item.id || item.name || Math.random();
              const uniqueKey = `${tableName}_${rawId}`;
              combinedData.push({ ...item, _uniqueKey: uniqueKey, _sourceTable: tableName });
            });
          }
          successfulTables.push(tableName);
        } else if (error) {
          errors.push(`${tableName}: ${error.message}`);
        }
      } catch (e: any) {
        errors.push(`${tableName}: ${e.message}`);
      }
    }

    if (successfulTables.length > 0) {
      setActiveTableUsed(successfulTables.join(' + '));
      setSeedAssets(combinedData);
    } else {
      setActiveTableUsed(seedTables.join(' + '));
      setSeedAssets([]);
      if (errors.length > 0) {
        setErrorMsg(`Consultadas las tablas [${errors.join(', ')}], pero no devolvieron registros.`);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSeedAssets(activeCategory);
  }, [activeCategory]);

  // 2. Sincronizar Piloto por Email, Username o UID
  const handleSyncPilot = async () => {
    if (!pilotSearchInput.trim()) return;
    setPilotSyncLoading(true);
    setSyncedPilot(null);
    setPilotUserAssets([]);

    try {
      const query = pilotSearchInput.trim();
      let userProfile: any = null;

      const { data: dataByUid } = await supabase.from('user_profiles').select('*').eq('id', query).maybeSingle();
      if (dataByUid) {
        userProfile = dataByUid;
      } else {
        const { data: dataByUsername } = await supabase.from('user_profiles').select('*').ilike('username', query).maybeSingle();
        if (dataByUsername) userProfile = dataByUsername;
      }

      if (userProfile) {
        setSyncedPilot(userProfile);
        fetchPilotInventory(userProfile.id, activeCategory);
      } else {
        alert("⚠️ No se encontró ningún piloto con ese UID, username o correo.");
      }
    } catch (e: any) {
      alert(`Error al buscar piloto: ${e.message}`);
    } finally {
      setPilotSyncLoading(false);
    }
  };

  // Cargar Inventario del Piloto usando el legacy_id (ID numérico de la cuenta)
  const fetchPilotInventory = async (userId: string, category: AssetCategory) => {
    const { userTable } = SEED_TABLE_MAPPING[category];
    try {
      // 1. Obtener legacy_id desde user_profiles
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('legacy_id')
        .eq('id', userId)
        .single();

      if (!profile?.legacy_id) {
        setPilotUserAssets([]);
        return;
      }

      // 2. Consultar la tabla usando id_user = legacy_id
      const { data } = await supabase
        .from(userTable)
        .select('*')
        .eq('id_user', profile.legacy_id);
        
      setPilotUserAssets(data || []);
    } catch (e) {
      setPilotUserAssets([]);
    }
  };

  useEffect(() => {
    if (syncedPilot) {
      fetchPilotInventory(syncedPilot.id, activeCategory);
    }
  }, [activeCategory, syncedPilot]);

  // 3. Inyectar Asset a Piloto
  const handleInjectAssetToPilot = async (asset: any) => {
    if (!syncedPilot) {
      alert("Debes sincronizar un piloto primero en la consola superior.");
      return;
    }

    const { userTable } = SEED_TABLE_MAPPING[activeCategory];
    const assetId = asset.ship_id || asset.id;

    try {
      // 1. Obtener el id_user (legacy_id)
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('legacy_id')
        .eq('id', syncedPilot.id)
        .single();

      if (!profile?.legacy_id) {
        alert("El piloto no posee un ID numérico válido (legacy_id).");
        return;
      }

      const payload: any = {
        id_user: profile.legacy_id,
        quantity: injectQty,
        current_level: injectLevel,
        created_at: new Date().toISOString()
      };

      if (activeCategory === 'Naves') payload.ship_id = assetId;
      else if (activeCategory === 'Estructuras') payload.structure_id = assetId;
      else if (activeCategory === 'Tools') payload.tool_id = assetId;
      else if (activeCategory === 'Tecnologías') payload.technology_id = assetId;
      else if (activeCategory === 'Defensas') payload.defense_id = assetId;
      else if (activeCategory === 'Insignias') payload.badge_id = assetId;
      else if (activeCategory === 'Blueprints') payload.blueprint_id = assetId;
      else if (activeCategory === 'Licencias') payload.license_id = assetId;
      else if (activeCategory === 'Astrobots') payload.astrobot_id = assetId;
      else payload.item_id = assetId;

      const { error } = await supabase.from(userTable).insert([payload]);
      if (error) throw error;

      alert(`✅ ¡ACTIVO INYECTADO! ${asset.name || asset.ship_name || assetId} añadido al piloto ${syncedPilot.username || syncedPilot.id}.`);
      fetchPilotInventory(syncedPilot.id, activeCategory);
    } catch (e: any) {
      alert(`Error al inyectar activo: ${e.message}`);
    }
  };

  // 4. Eliminar Asset del Piloto
  const handleRemoveUserAsset = async (userAssetId: string) => {
    if (!syncedPilot || !window.confirm("¿Confirmas la eliminación de este activo del inventario del piloto?")) return;
    const { userTable } = SEED_TABLE_MAPPING[activeCategory];

    try {
      const { error } = await supabase.from(userTable).delete().eq('id', userAssetId);
      if (error) throw error;

      alert("🗑️ Activo eliminado del inventario del piloto.");
      fetchPilotInventory(syncedPilot.id, activeCategory);
    } catch (e: any) {
      alert(`Error al eliminar: ${e.message}`);
    }
  };

  // Filtrado de Semillas
  const filteredSeedAssets = useMemo(() => {
    return seedAssets.filter(item => {
      const name = String(item.ship_name || item.name || item.id || '').toLowerCase();
      const id = String(item.ship_id || item.id || '').toLowerCase();
      const matchesSearch = name.includes(searchQuery.toLowerCase()) || id.includes(searchQuery.toLowerCase());
      
      if (selectedRarity === 'Todas') return matchesSearch;
      const rarity = String(item.rarity || '').toLowerCase();
      return matchesSearch && rarity === selectedRarity.toLowerCase();
    });
  }, [seedAssets, searchQuery, selectedRarity]);

  // Lista de Rarezas Dinámicas
  const availableRarities = useMemo(() => {
    const set = new Set<string>();
    seedAssets.forEach(a => {
      if (a.rarity) set.add(String(a.rarity).toUpperCase());
    });
    return ['Todas', ...Array.from(set)];
  }, [seedAssets]);

  return (
    <div className="p-6 bg-[#080b10] min-h-screen text-slate-100 font-mono text-xs space-y-6 rounded-xl border border-cyan-500/20 text-left select-none relative">

      {/* HEADER DE LA TABLA OPERATIVA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#05070a] p-4 border border-cyan-500/30 rounded-xl flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <Database className="text-cyan-400 animate-pulse" size={20} />
            <div>
              <span className="text-[9px] text-zinc-500 font-bold block uppercase">TABLAS OPERATIVAS POSTGRES ACTIVAS</span>
              <span className="text-cyan-300 font-black text-sm">"public"."{activeTableUsed}"</span>
            </div>
          </div>
        </div>

        <div className="bg-[#05070a] p-4 border border-cyan-500/30 rounded-xl flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <Layers className="text-emerald-400" size={20} />
            <div>
              <span className="text-[9px] text-zinc-500 font-bold block uppercase">VOLUMEN DE ASSETS EXPUESTOS</span>
              <span className="text-emerald-400 font-black text-sm">{seedAssets.length} registros vinculados</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => fetchSeedAssets(activeCategory)}
              className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-cyan-400 rounded-lg transition-colors cursor-pointer flex items-center gap-2 font-bold uppercase text-[9px]"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refrescar
            </button>
          </div>
        </div>
      </div>

      {/* BANNER DE ERROR */}
      {errorMsg && (
        <div className="p-4 bg-red-950/40 border border-red-800/60 rounded-xl text-red-400 flex items-center gap-3 animate-fadeIn">
          <AlertTriangle size={18} className="shrink-0 text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* CONSOLA DE ENLACE PILOTO */}
      <div className="bg-[#05070a] p-4 border border-cyan-500/30 rounded-xl space-y-3 shadow-xl relative z-10">
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search size={14} className="absolute left-3 top-3 text-cyan-400" />
            <input
              type="text"
              placeholder="Consola de Enlace Piloto: INGRESE UID DE CUENTA, CORREO O DAPP WALLET..."
              value={pilotSearchInput}
              onChange={e => setPilotSearchInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSyncPilot()}
              className="w-full bg-black/80 border border-cyan-950 focus:border-cyan-500 pl-9 pr-4 py-2 rounded-lg text-white font-mono text-xs outline-none uppercase"
            />
          </div>
          <button
            onClick={handleSyncPilot}
            disabled={pilotSyncLoading}
            className="w-full sm:w-auto px-6 py-2 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {pilotSyncLoading ? <RefreshCw size={14} className="animate-spin" /> : <UserCheck size={14} />}
            SINCRO_PILOTO
          </button>
        </div>

        {syncedPilot && (
          <div className="p-3 bg-cyan-950/30 border border-cyan-500/40 rounded-lg flex flex-wrap justify-between items-center text-[10.5px] animate-fadeIn">
            <div className="space-x-3">
              <span>Piloto Enlazado: <strong className="text-white">{syncedPilot.username || 'Comandante'}</strong></span>
              <span>UID: <code className="text-cyan-400">{syncedPilot.id}</code></span>
            </div>
            <span className="text-emerald-400 font-bold">● ONLINE / SINCRONIZADO</span>
          </div>
        )}
      </div>

      {/* TABS DE CATEGORÍAS DE ACTIVOS */}
      <div className="flex border-b border-cyan-950 overflow-x-auto gap-1 pb-1 scrollbar-thin">
        {(Object.keys(SEED_TABLE_MAPPING) as AssetCategory[]).map(cat => {
          const IconComp = SEED_TABLE_MAPPING[cat].icon;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2.5 font-black uppercase text-[10px] tracking-wider rounded-t-lg transition-all cursor-pointer flex items-center gap-2 border-b-2 whitespace-nowrap ${
                activeCategory === cat
                  ? 'bg-cyan-950/40 text-cyan-300 border-cyan-400 font-black shadow-md'
                  : 'text-zinc-500 border-transparent hover:text-zinc-300'
              }`}
            >
              <IconComp size={13} />
              <span>{cat}</span>
            </button>
          );
        })}
      </div>

      {/* FILTROS DE BÚSQUEDA Y RAREZA */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-[#05070a] p-3 rounded-xl border border-cyan-950">
        <div className="relative w-full sm:w-96">
          <Search size={13} className="absolute left-3 top-2.5 text-zinc-500" />
          <input
            type="text"
            placeholder={`BUSCAR EN ${activeTableUsed.toUpperCase()}...`}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-black/60 border border-zinc-800 pl-9 pr-3 py-1.5 rounded-lg text-white font-mono text-xs outline-none uppercase"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-zinc-500 text-[10px] uppercase font-bold">Rarezas:</span>
          <select
            value={selectedRarity}
            onChange={e => setSelectedRarity(e.target.value)}
            className="bg-black/60 border border-zinc-800 p-1.5 rounded-lg text-cyan-300 text-xs font-mono outline-none cursor-pointer uppercase"
          >
            {availableRarities.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>

      {/* GRID PRINCIPAL DE ASSETS & PANEL DE INYECCIÓN DE ACTIVOS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* REJILLA DE TARJETAS SEMILLA */}
        <div className="lg:col-span-2 space-y-3">
          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">
            REGISTROS SEMILLA EN "PUBLIC"."{activeTableUsed.toUpperCase()}" ({filteredSeedAssets.length})
          </span>

          {filteredSeedAssets.length === 0 ? (
            <div className="p-12 text-center text-zinc-600 italic border border-dashed border-zinc-900 rounded-xl flex flex-col items-center gap-3">
              <Database size={32} className="text-zinc-800" />
              <span>{loading ? 'Sincronizando registros semilla de Supabase...' : 'No hay datos registrados en esta tabla.'}</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[650px] overflow-y-auto pr-1 pb-4">
              {filteredSeedAssets.map((asset, idx) => {
                const id = asset.ship_id || asset.id || `asset-${idx}`;
                const cardKey = asset._uniqueKey || `asset-${id}-${idx}`;
                const name = asset.ship_name || asset.name || id;
                const rarity = String(asset.rarity || 'Common').toUpperCase();
                const rawImg = asset.image_url || asset.avatar_url || asset.avatar;
                const imgUrl = resolveImageUrl(rawImg, id, asset.file_extension || asset.fileExtension);

                return (
                  <div
                    key={cardKey}
                    className="p-3 bg-black/60 border border-cyan-950 hover:border-cyan-500/60 rounded-xl space-y-2.5 transition-all flex flex-col justify-between shadow-lg"
                  >
                    <div className="space-y-2">
                      <div className="w-full h-32 bg-black rounded-lg border border-cyan-950 overflow-hidden relative group flex items-center justify-center p-2">
                        {rawImg || asset.file_extension || asset.fileExtension ? (
                          <img src={imgUrl} className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform drop-shadow-[0_0_10px_rgba(34,211,238,0.2)]" alt={name} />
                        ) : (
                          <span className="text-zinc-800 text-[10px] font-black uppercase">Sin Imagen</span>
                        )}
                        <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/80 text-cyan-300 border border-cyan-800 rounded text-[8px] font-black uppercase shadow-md">
                          {rarity}
                        </span>
                      </div>

                      <div>
                        <span className="font-bold text-white text-[11px] block uppercase truncate" title={name}>{name}</span>
                        <span className="text-[9px] text-zinc-500 font-mono block truncate" title={String(id)}>
                          ID: {id} {asset._sourceTable ? <span className="text-cyan-400">[{asset._sourceTable}]</span> : ''}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-cyan-950">
                      <button
                        onClick={() => setInspectAsset(asset)}
                        className="flex-1 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-cyan-300 font-bold text-[9px] uppercase rounded border border-zinc-800 cursor-pointer flex items-center justify-center gap-1 transition-colors"
                      >
                        <Info size={11} /> Detalles
                      </button>

                      <button
                        onClick={() => handleInjectAssetToPilot(asset)}
                        disabled={!syncedPilot}
                        className="flex-1 py-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 font-bold text-[9px] uppercase rounded border border-emerald-800 cursor-pointer flex items-center justify-center gap-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        title={syncedPilot ? "Inyectar activo al piloto enlazado" : "Enlaza un piloto primero en la consola superior"}
                      >
                        <Plus size={11} /> Inyectar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* PANEL DERECHO: AUDITORÍA E INYECCIÓN DE ACTIVOS EN VIVO */}
        <div className="bg-[#05070a] border border-cyan-500/30 p-5 rounded-xl space-y-4 shadow-2xl flex flex-col justify-between sticky top-6 self-start max-h-[85vh]">
          <div className="space-y-4">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block border-b border-cyan-950 pb-3">
              AUDITORÍA E INYECCIÓN DE ACTIVOS EN VIVO
            </span>

            {!syncedPilot ? (
              <div className="p-8 text-center text-zinc-600 text-xs italic border border-dashed border-zinc-900 rounded-xl leading-relaxed">
                Sin piloto acoplado al módulo. Utilice la consola superior para buscar un capitán (email o ID) y auditar sus activos síncronos en caliente.
              </div>
            ) : (
              <div className="space-y-4 animate-fadeIn">
                <div className="bg-black/60 p-3 rounded-lg border border-cyan-950 space-y-2">
                  <span className="text-cyan-300 font-bold text-[10px] block uppercase">Parámetros de Inyección Directa:</span>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div>
                      <span className="text-zinc-500 block text-[8px] uppercase">Cantidad:</span>
                      <input type="number" min={1} className="w-full bg-zinc-950 border border-zinc-800 p-1.5 rounded text-white font-bold" value={injectQty} onChange={e => setInjectQty(Number(e.target.value))} />
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[8px] uppercase">Nivel (LVL):</span>
                      <input type="number" min={1} className="w-full bg-zinc-950 border border-zinc-800 p-1.5 rounded text-cyan-400 font-bold" value={injectLevel} onChange={e => setInjectLevel(Number(e.target.value))} />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-zinc-400 font-bold text-[10px] block uppercase">
                    Inventario Activo del Piloto ({pilotUserAssets.length}):
                  </span>

                  <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
                    {pilotUserAssets.length === 0 ? (
                      <span className="text-zinc-600 text-[9.5px] italic block text-center py-4">
                        El piloto no posee activos registrados en [{activeCategory}].
                      </span>
                    ) : (
                      pilotUserAssets.map((uAsset, idx) => (
                        <div key={uAsset.id || idx} className="p-2 bg-black border border-zinc-850 hover:border-red-900/50 rounded flex justify-between items-center text-[10px] transition-colors group">
                          <div className="truncate pr-2">
                            <span className="text-white font-bold block truncate max-w-[180px]">{uAsset.ship_id || uAsset.building_id || uAsset.defense_id || uAsset.technology_id || uAsset.badge_id || uAsset.blueprint_id || uAsset.license_id || uAsset.tool_id || uAsset.consumable_id || uAsset.astrobot_id || 'Activo Oculto'}</span>
                            <span className="text-[8.5px] text-cyan-400">LVL {uAsset.current_level || uAsset.level || 1} | Qty: {uAsset.quantity || uAsset.amount || 1}</span>
                          </div>
                          <button
                            onClick={() => handleRemoveUserAsset(uAsset.id)}
                            className="p-1.5 text-zinc-600 group-hover:text-red-400 cursor-pointer bg-zinc-950 rounded border border-transparent group-hover:border-red-900/50 transition-colors"
                            title="Eliminar registro"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* MODAL INSPECTOR COMPLETO DE ASSET */}
      {inspectAsset && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4 font-mono">
          <div className="w-full max-w-xl bg-[#080b10] border border-cyan-500/50 rounded-2xl p-6 space-y-4 shadow-2xl text-left max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-cyan-950 pb-3">
              <span className="text-cyan-400 font-bold text-xs uppercase flex items-center gap-2">
                <Info size={15} /> Inspección Detallada de Semilla
              </span>
              <button onClick={() => setInspectAsset(null)} className="text-zinc-500 hover:text-white cursor-pointer"><X size={18} /></button>
            </div>
            
            <div className="flex items-center gap-4 bg-black/50 p-4 rounded-xl border border-zinc-900">
              <div className="w-20 h-20 shrink-0 bg-zinc-950 border border-zinc-800 rounded-lg flex items-center justify-center p-2">
                 <img src={resolveImageUrl(inspectAsset.image_url || inspectAsset.avatar_url || inspectAsset.avatar, inspectAsset.ship_id || inspectAsset.id, inspectAsset.file_extension || inspectAsset.fileExtension)} className="max-w-full max-h-full object-contain" alt="" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white uppercase">{inspectAsset.ship_name || inspectAsset.name || inspectAsset.id}</h3>
                <code className="text-cyan-400 text-[10px]">{inspectAsset.ship_id || inspectAsset.id}</code>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px]">
              {Object.entries(inspectAsset).filter(([k]) => !['image_url', 'avatar_url', 'avatar', '_sourceTable', '_uniqueKey'].includes(k)).map(([key, val]) => (
                <div key={key} className="p-2.5 bg-black/60 border border-zinc-900 rounded-lg">
                  <span className="text-zinc-500 block text-[8px] uppercase font-bold mb-0.5">{key}</span>
                  <span className="text-zinc-200 font-bold font-mono break-words">
                    {val !== null && val !== undefined && val !== '' ? String(val) : <span className="text-zinc-700 italic">null</span>}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-cyan-950 flex justify-end">
              <button onClick={() => setInspectAsset(null)} className="px-5 py-2 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 font-bold text-xs rounded-lg uppercase cursor-pointer transition-colors shadow-lg">
                Cerrar Inspector
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminAssetMatrixModule;