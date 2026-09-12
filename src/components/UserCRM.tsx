import React, { useEffect, useState } from 'react';
import { getSupabaseClient } from '../lib/supabase';
import { 
  Shield, Search, Users, Coins, Database, ShieldAlert, Zap, Layers, 
  CheckSquare, Square, Eye, Trash2, RefreshCw, Ban
} from 'lucide-react';
import { UserProfile } from '../types';

const categoryMap: Record<string, { targetTable: string, seedTable: string, idColumn: string, label: string }> = {
  ships: { targetTable: 'user_ships', seedTable: 'seed_ships', idColumn: 'ship_id', label: '🚀 Nueva Nave (user_ships)' },
  structures: { targetTable: 'user_structures', seedTable: 'seed_structures', idColumn: 'building_id', label: '🏢 Nueva Estructura (user_structures)' },
  defenses: { targetTable: 'user_defenses', seedTable: 'seed_defenses', idColumn: 'defense_id', label: '🛡️ Nueva Defensa (user_defenses)' },
  technologies: { targetTable: 'user_technologies', seedTable: 'seed_technologies', idColumn: 'technology_id', label: '🔬 Nueva Tecnología (user_technologies)' },
  astrobots: { targetTable: 'user_astrobots', seedTable: 'seed_astrobots', idColumn: 'astrobot_id', label: '🤖 Nuevo Astrobot (user_astrobots)' },
  licenses: { targetTable: 'user_licenses', seedTable: 'seed_licenses', idColumn: 'license_id', label: '📜 Nueva Licencia (user_licenses)' },
  badges: { targetTable: 'user_badges', seedTable: 'seed_badges', idColumn: 'badge_id', label: '🏅 Nueva Insignia (user_badges)' },
  consumibles: { targetTable: 'user_consumibles', seedTable: 'seed_consumables', idColumn: 'consumable_id', label: '🧪 Nuevo Consumible (user_consumibles)' },
  blueprints: { targetTable: 'user_blueprints', seedTable: 'seed_blueprints', idColumn: 'blueprint_id', label: '🗺️ Nuevo Blueprint (user_blueprints)' },
  tools: { targetTable: 'user_tools', seedTable: 'seed_tools', idColumn: 'tool_id', label: '🔧 Nueva Herramienta (user_tools)' },
};

type SubTab = 'crm_central' | 'general_dashboard';

export const UserCRM: React.FC = () => {
  const supabase = getSupabaseClient();
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('crm_central');
  const [players, setPlayers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [selectedPlayer, setSelectedPlayer] = useState<UserProfile | null>(null);
  const [bulkSelectedIds, setBulkSelectedIds] = useState<string[]>([]);
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);

  const [playerAssets, setPlayerAssets] = useState<{ 
    ships: any[], 
    structures: any[], 
    defenses: any[],
    technologies: any[], 
    astrobots: any[],
    tools: any[],
    licenses: any[],
    consumibles: any[],
    blueprints: any[],
    badges: any[]
  }>({
    ships: [], structures: [], defenses: [], technologies: [], astrobots: [], tools: [], licenses: [], consumibles: [], blueprints: [], badges: []
  });
  const [loadingAssets, setLoadingAssets] = useState<boolean>(false);

  const [activeAssetTab, setActiveAssetTab] = useState<string>('ships');

  const [injectAmount, setInjectAmount] = useState<number>(0);
  const [injectType, setInjectType] = useState<keyof UserProfile>('gd_coins');

  const [entityGroup, setEntityGroup] = useState<string>('ships');
  const [blueprintId, setBlueprintId] = useState<string>('');
  const [entityLevel, setEntityLevel] = useState<number>(1);

  const [allSeeds, setAllSeeds] = useState<{ id: string; name: string }[]>([]);
  const [categorySeedMaps, setCategorySeedMaps] = useState<Record<string, Record<string, string>>>({});

  const parseNum = (row: any, ...keys: string[]) => {
    for (const k of keys) {
      if (row && row[k] !== undefined && row[k] !== null) {
        const val = Number(row[k]);
        if (!isNaN(val)) return val;
      }
    }
    return 0;
  };

  const mapProfileRow = (row: any): UserProfile => {
    const uid = row.id || row.user_id || crypto.randomUUID();
    return {
      id: uid,
      username: row.username || row.display_name || 'Explorador',
      email: row.email || `UID: ${uid.substring(0, 8).toUpperCase()}`,
      role: row.role || (row.is_admin ? 'admin' : 'user'),
      status: row.status || (row.is_banned ? 'banned' : 'active'),
      avatarUrl: row.avatarUrl || row.avatar_url || row.avatar || '',
      created_at: row.created_at || new Date().toISOString(),
      last_active: row.last_active || new Date().toISOString(),
      inventory: row.inventory || [],
      level: parseNum(row, 'level', 'can_level') || 1,
      can_level: parseNum(row, 'can_level', 'level') || 1,
      xp: parseNum(row, 'xp', 'can_xp', 'exp_points'),
      
      metal: parseNum(row, 'metal', 'metal_balance'),
      crystal: parseNum(row, 'crystal', 'crystal_balance'),
      deuterium: parseNum(row, 'deuterium', 'deuterium_balance'),
      dark_matter: parseNum(row, 'dark_matter', 'dark_matter_balance'),
      gd_coins: parseNum(row, 'gd_coin', 'gd_coins', 'gd_balance'),
      phantom_coins: parseNum(row, 'phantom_coin', 'phantom_coins', 'phantom_coins_balance'),
      
      omniplate: parseNum(row, 'omniplate'),
      orichaltron: parseNum(row, 'orichaltron'),
      lunar_fiber: parseNum(row, 'lunar_fiber'),
      infinity_core: parseNum(row, 'infinity_core', 'infinite_core'),
      primal_token: parseNum(row, 'primal_token'),
      xenoplasm: parseNum(row, 'xenoplasm'),
      organium: parseNum(row, 'organium'),
      mana: parseNum(row, 'mana', 'energy'),
    };
  };

  // Carga mapa aislado por categoría para evitar que blueprints sobreescriban a astrobots
  const fetchCategorySeedMaps = async () => {
    if (!supabase) return;
    const seedCategories = [
      { cat: 'ships', tbl: 'seed_ships' },
      { cat: 'structures', tbl: 'seed_structures' },
      { cat: 'defenses', tbl: 'seed_defenses' },
      { cat: 'technologies', tbl: 'seed_technologies' },
      { cat: 'astrobots', tbl: 'seed_astrobots' },
      { cat: 'tools', tbl: 'seed_tools' },
      { cat: 'licenses', tbl: 'seed_licenses' },
      { cat: 'consumibles', tbl: 'seed_consumables' },
      { cat: 'blueprints', tbl: 'seed_blueprints' },
      { cat: 'badges', tbl: 'seed_badges' }
    ];

    try {
      const results = await Promise.all(
        seedCategories.map(c => supabase.from(c.tbl).select('*'))
      );

      const newCategoryMaps: Record<string, Record<string, string>> = {};

      seedCategories.forEach((c, index) => {
        const res = results[index];
        const catMap: Record<string, string> = {};

        if (res.data) {
          res.data.forEach((row: any) => {
            const name = 
              row.name || 
              row.ship_name || 
              row.structure_name || 
              row.technology_name || 
              row.tech_name || 
              row.astrobot_name || 
              row.bot_name || 
              row.tool_name || 
              row.license_name || 
              row.consumable_name || 
              row.blueprint_name || 
              row.badge_name || 
              row.insignia_name || 
              row.defense_name || 
              row.title;

            if (name) {
              const keys = [
                row.id, row.ship_id, row.structure_id, row.building_id,
                row.technology_id, row.tech_id, row.astrobot_id, row.bot_id,
                row.tool_id, row.license_id, row.consumable_id, row.blueprint_id,
                row.badge_id, row.insignia_id, row.defense_id
              ];
              keys.forEach(k => {
                if (k !== undefined && k !== null && String(k).trim() !== '') {
                  catMap[String(k)] = String(name);
                }
              });
            }
          });
        }
        newCategoryMaps[c.cat] = catMap;
      });

      setCategorySeedMaps(newCategoryMaps);
    } catch (e) {
      console.error("Error cargando mapa de semillas por categoría:", e);
    }
  };

  const fetchPlayers = async () => {
    if (!supabase) return;
    try {
      setLoading(true);
      const { data, error } = await supabase.from('user_profiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      if (data) {
        setPlayers(data.map(mapProfileRow));
      }
    } catch (e: any) {
      console.error("Error al cargar jugadores en UserCRM:", e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlayerAssets = async (userId: string) => {
    if (!supabase) return;
    try {
      setLoadingAssets(true);

      const { data: freshProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (freshProfile) {
        setSelectedPlayer(mapProfileRow(freshProfile));
      }

      const fetchAssetTable = async (tableName: string) => {
        try {
          const { data } = await supabase.from(tableName).select('*').eq('user_id', userId);
          return data || [];
        } catch {
          return [];
        }
      };

      const [shipsRes, structsRes, defsRes, techsRes, astroRes, toolsRes, licsRes, consRes, blueRes, badgeRes] = await Promise.all([
        fetchAssetTable('user_ships'),
        fetchAssetTable('user_structures'),
        fetchAssetTable('user_defenses'),
        fetchAssetTable('user_technologies'),
        fetchAssetTable('user_astrobots'),
        fetchAssetTable('user_tools'),
        fetchAssetTable('user_licenses'),
        fetchAssetTable('user_consumibles'),
        fetchAssetTable('user_blueprints'),
        fetchAssetTable('user_badges'),
      ]);

      setPlayerAssets({
        ships: shipsRes,
        structures: structsRes,
        defenses: defsRes,
        technologies: techsRes,
        astrobots: astroRes,
        tools: toolsRes,
        licenses: licsRes,
        consumibles: consRes,
        blueprints: blueRes,
        badges: badgeRes
      });
    } catch (e) {
      console.error("Error sincronizando hangar relacional:", e);
    } finally {
      setLoadingAssets(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
    fetchCategorySeedMaps();
  }, []);

  useEffect(() => {
    if (selectedPlayer) {
      fetchPlayerAssets(selectedPlayer.id);
    }
  }, [selectedPlayer?.id]);

  useEffect(() => {
    setSelectedAssetIds([]);
  }, [activeAssetTab, selectedPlayer?.id]);

  useEffect(() => {
    if (!supabase) return;
    const fetchActiveSeedCatalog = async () => {
      const config = categoryMap[entityGroup];
      if (!config) return;
      try {
        const { data, error } = await supabase.from(config.seedTable).select('*');
        if (!error && data) {
          const mappedSeeds = data.map((row: any) => {
            const actualId = row.id || row[config.idColumn] || row.structure_id || row.ship_id || row.tool_id || '';
            const actualName = row.name || row.structure_name || row.ship_name || row.title || row.tool_name || `Asset #${actualId}`;
            return { id: String(actualId), name: String(actualName) };
          }).filter(item => item.id);
          setAllSeeds(mappedSeeds);
          if (mappedSeeds.length > 0) {
            setBlueprintId(mappedSeeds[0].id);
          } else {
            setBlueprintId('');
          }
        } else {
          setAllSeeds([]);
          setBlueprintId('');
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchActiveSeedCatalog();
  }, [entityGroup, supabase]);

  const handleLiveAssetInjection = async () => {
    if (!selectedPlayer || injectAmount === 0 || !supabase) return;

    try {
      const currencyMap: Record<string, string> = {
        gd_coins: 'gd_coin',
        gd_coin: 'gd_coin',
        phantom_coins: 'phantom_coin',
        phantom_coin: 'phantom_coin',
        dark_matter: 'dark_matter',
        deuterium: 'deuterium',
        metal: 'metal',
        crystal: 'crystal'
      };

      const targetCurrency = currencyMap[injectType as string] || (injectType as string);

      const { error } = await supabase.rpc('admin_inject_currency_secure', {
        p_target_user_id: selectedPlayer.id,
        p_currency: targetCurrency,
        p_amount: Number(injectAmount),
        p_reason: `Ajuste manual desde UserCRM por Administrador`
      });

      if (error) throw error;

      alert(`⚡ Ajuste de Billetera Exitoso: ${injectAmount > 0 ? '+' : ''}${injectAmount} en ${String(injectType)}`);
      
      await fetchPlayerAssets(selectedPlayer.id);
      await fetchPlayers();
    } catch (e: any) {
      alert(`Error en inyección: ${e.message}`);
    }
  };

  const handleLiveEntityInjection = async () => {
    if (!selectedPlayer || !blueprintId.trim()) {
      alert("Por favor, selecciona una especificación válida del catálogo.");
      return;
    }
    const config = categoryMap[entityGroup];
    if (!config) return;

    try {
      const cleanId = blueprintId.trim();
      const lvl = Number(entityLevel || 1);

      const payload = {
        user_id: selectedPlayer.id,
        [config.idColumn]: cleanId,
        level: lvl
      };

      const { error } = await supabase.from(config.targetTable).insert([payload]);
      if (error) throw error;

      const selectedSeed = allSeeds.find(s => s.id === cleanId);
      alert(`🚀 TRANSMISIÓN COMPLETADA: Instancia de [${selectedSeed?.name || cleanId}] inyectada con éxito.`);
      fetchPlayerAssets(selectedPlayer.id);
    } catch (e: any) {
      alert(`Fallo en la inyección: ${e.message}`);
    }
  };

  const handleDeleteEntity = async (tableName: string, record: any) => {
    if (!supabase || !selectedPlayer) return;
    const recordId = typeof record === 'object' ? record.id : record;

    if (!recordId) {
      alert("🚨 No se encontró un identificador válido para eliminar este registro.");
      return;
    }

    if (!window.confirm("¿🚨 ADVERTENCIA MASTER: Estás seguro de desintegrar permanentemente este asset del inventario del jugador?")) return;

    try {
      const { error } = await supabase.from(tableName).delete().eq('id', recordId);
      if (error) throw error;

      alert("¡Asset desintegrado del servidor con éxito!");
      fetchPlayerAssets(selectedPlayer.id);
    } catch (e: any) {
      alert(`Fallo al eliminar: ${e.message}`);
    }
  };

  const handleBulkDeleteAssets = async () => {
    if (!supabase || !selectedPlayer || selectedAssetIds.length === 0) return;

    const targetTableMap: Record<string, string> = {
      ships: 'user_ships',
      structures: 'user_structures',
      defenses: 'user_defenses',
      technologies: 'user_technologies',
      astrobots: 'user_astrobots',
      tools: 'user_tools',
      licenses: 'user_licenses',
      consumibles: 'user_consumibles',
      blueprints: 'user_blueprints',
      badges: 'user_badges'
    };
    const currentTable = targetTableMap[activeAssetTab] || 'user_ships';

    if (!window.confirm(`¿🚨 ADVERTENCIA MASTER: Estás seguro de eliminar permanentemente los ${selectedAssetIds.length} activos seleccionados?`)) return;

    try {
      const { error } = await supabase.from(currentTable).delete().in('id', selectedAssetIds);
      if (error) throw error;

      alert(`✅ ¡Operación en Lote Exitosa! ${selectedAssetIds.length} activos desintegrados.`);
      setSelectedAssetIds([]);
      fetchPlayerAssets(selectedPlayer.id);
    } catch (e: any) {
      alert(`Fallo en eliminación masiva: ${e.message}`);
    }
  };

  const handleToggleBan = async () => {
    if (!selectedPlayer || !supabase) return;
    const newStatus = selectedPlayer.status === 'banned' ? 'active' : 'banned';
    if (!window.confirm(`¿Confirmas ${newStatus === 'banned' ? 'BANEAR' : 'DESBANEAR'} al comandante ${selectedPlayer.username}?`)) return;

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ status: newStatus, is_banned: newStatus === 'banned' })
        .eq('id', selectedPlayer.id);

      if (error) throw error;
      alert(`✅ Piloto ${selectedPlayer.username} marcado como ${newStatus.toUpperCase()}`);
      setSelectedPlayer(prev => prev ? { ...prev, status: newStatus } : null);
      fetchPlayers();
    } catch (e: any) {
      alert(`Error en sanción: ${e.message}`);
    }
  };

  const toggleSelectAll = () => {
    if (bulkSelectedIds.length === filteredPlayers.length) setBulkSelectedIds([]);
    else setBulkSelectedIds(filteredPlayers.map(p => p.id));
  };

  const toggleSelectRow = (id: string) => {
    setBulkSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const toggleSelectAsset = (assetRowId: string) => {
    setSelectedAssetIds(prev => 
      prev.includes(assetRowId) ? prev.filter(id => id !== assetRowId) : [...prev, assetRowId]
    );
  };

  const filteredPlayers = players.filter(p =>
    p.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCommanders = players.length;
  const totalGDCirculating = players.reduce((acc, p) => acc + (p.gd_coins || 0), 0);
  const totalMetalCirculating = players.reduce((acc, p) => acc + (p.metal || 0), 0);

  const renderActiveAssetList = () => {
    const assetList = (playerAssets as any)[activeAssetTab] || [];
    const targetTableMap: Record<string, string> = {
      ships: 'user_ships',
      structures: 'user_structures',
      defenses: 'user_defenses',
      technologies: 'user_technologies',
      astrobots: 'user_astrobots',
      tools: 'user_tools',
      licenses: 'user_licenses',
      consumibles: 'user_consumibles',
      blueprints: 'user_blueprints',
      badges: 'user_badges'
    };
    const currentTable = targetTableMap[activeAssetTab] || 'user_ships';

    if (assetList.length === 0) {
      return (
        <div className="p-4 text-center text-zinc-600 text-[10px] uppercase italic font-mono">
          Sin registros en [{activeAssetTab.toUpperCase()}] para este piloto.
        </div>
      );
    }

    const isAllAssetsSelected = assetList.length > 0 && selectedAssetIds.length === assetList.length;

    const toggleSelectAllAssets = () => {
      if (isAllAssetsSelected) {
        setSelectedAssetIds([]);
      } else {
        setSelectedAssetIds(assetList.map((item: any) => item.id));
      }
    };

    // Mapa específico de la pestaña activa para evitar cruce entre categorías
    const currentSeedMap = categorySeedMaps[activeAssetTab] || {};

    return (
      <div className="space-y-2">
        {/* ACCIONES EN LOTE */}
        <div className="flex items-center justify-between bg-zinc-950 p-2 rounded border border-zinc-900 text-[10px]">
          <button 
            onClick={toggleSelectAllAssets}
            className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            {isAllAssetsSelected ? <CheckSquare size={13} className="text-cyan-400" /> : <Square size={13} />}
            <span className="font-bold uppercase">Seleccionar Todos ({assetList.length})</span>
          </button>

          {selectedAssetIds.length > 0 && (
            <button
              onClick={handleBulkDeleteAssets}
              className="px-2.5 py-1 bg-red-950 hover:bg-red-900 border border-red-800 text-red-300 font-bold rounded flex items-center gap-1 transition-all cursor-pointer"
            >
              <Trash2 size={11} /> Eliminar Seleccionados ({selectedAssetIds.length})
            </button>
          )}
        </div>

        {/* LISTADO CON MAPEO BÚSQUEDA AISLADO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono">
          {assetList.map((item: any) => {
            const isSelected = selectedAssetIds.includes(item.id);
            
            const assetKey = 
              item.ship_id || 
              item.building_id || 
              item.structure_id || 
              item.defense_id ||
              item.technology_id || 
              item.astrobot_id || 
              item.tool_id || 
              item.license_id || 
              item.consumable_id || 
              item.blueprint_id || 
              item.badge_id || 
              item.id;

            const assetDisplayName = 
              item.custom_name || 
              currentSeedMap[String(assetKey)] || 
              currentSeedMap[String(item.id)] || 
              item.ship_name || 
              item.astrobot_name ||
              item.name || 
              item.structure_name || 
              item.title || 
              `Activo: ${assetKey}`;

            return (
              <div 
                key={item.id} 
                onClick={() => toggleSelectAsset(item.id)}
                className={`p-2.5 bg-zinc-950 border rounded-lg flex justify-between items-center cursor-pointer transition-all ${
                  isSelected ? 'border-cyan-500 bg-cyan-950/20' : 'border-zinc-900 hover:border-zinc-800'
                }`}
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <span className="text-zinc-500">
                    {isSelected ? <CheckSquare size={13} className="text-cyan-400" /> : <Square size={13} />}
                  </span>
                  <span className="font-bold text-white block truncate max-w-[170px]">
                    {assetDisplayName}
                  </span>
                </div>
                
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDeleteEntity(currentTable, item); }} 
                  className="text-zinc-600 hover:text-red-400 p-1.5 rounded hover:bg-zinc-900 transition-colors cursor-pointer"
                  title="Eliminar activo individual"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 font-mono text-xs text-left text-white select-none">

      <div className="flex border-b border-zinc-800 gap-2 select-none">
        <button onClick={() => setActiveSubTab('crm_central')} className={`px-4 py-2.5 font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${activeSubTab === 'crm_central' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}>
          🛰️ CRM Central de Pilotos
        </button>
        <button onClick={() => setActiveSubTab('general_dashboard')} className={`px-4 py-2.5 font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${activeSubTab === 'general_dashboard' ? 'border-purple-500 text-purple-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}>
          📊 Dashboard General de Operaciones
        </button>
      </div>

      {activeSubTab === 'crm_central' && (
        <div className="space-y-4">

          <div className="bg-zinc-950 p-4 border border-zinc-900 rounded-xl space-y-3">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <span className="text-zinc-500 text-[10px] uppercase font-bold">Consola Táctica Perimetral</span>
              <input type="text" placeholder="Filtrar por UID o Nombre..." className="bg-zinc-900 border border-zinc-800 text-zinc-200 px-3 py-1.5 rounded text-xs outline-none focus:border-cyan-500 w-full md:w-64 uppercase" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">

            <div className="xl:col-span-1 bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden">
              <table className="min-w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-900 bg-zinc-900/40 text-zinc-500 text-[10px] font-bold">
                    <th className="p-3 w-10 text-center">
                      <button onClick={toggleSelectAll} className="text-zinc-500 hover:text-white transition-colors cursor-pointer">
                        {bulkSelectedIds.length === filteredPlayers.length ? <CheckSquare size={14} className="text-cyan-400" /> : <Square size={14} />}
                      </button>
                    </th>
                    <th className="p-3">PILOTO / EMAIL</th>
                    <th className="p-3 text-right">MONITOR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900 text-zinc-300 text-[11px]">
                  {filteredPlayers.map(p => (
                    <tr key={p.id} className={`hover:bg-zinc-900/30 cursor-pointer ${selectedPlayer?.id === p.id ? 'bg-zinc-900/40 border-l-2 border-cyan-500' : ''}`} onClick={() => setSelectedPlayer(p)}>
                      <td className="p-3 text-center" onClick={e => e.stopPropagation()}>
                        <button onClick={() => toggleSelectRow(p.id)} className="text-zinc-600 hover:text-white cursor-pointer">
                          {bulkSelectedIds.includes(p.id) ? <CheckSquare size={14} className="text-cyan-400" /> : <Square size={14} />}
                        </button>
                      </td>
                      <td className="p-3">
                        <div className="text-white font-sans font-bold text-xs flex items-center gap-1.5">
                          <span className="truncate">{p.username}</span>
                          {p.status === 'banned' && <span className="px-1 bg-red-950 text-red-400 text-[7.5px] border border-red-800 rounded">BAN</span>}
                        </div>
                        <div className="text-[9px] text-zinc-500 tracking-tight font-mono truncate max-w-[155px]">{p.email || p.id}</div>
                      </td>
                      <td className="p-3 text-right">
                        <button className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded font-bold text-cyan-400 hover:bg-zinc-850 flex items-center gap-1 ml-auto text-[10px] cursor-pointer"><Eye size={11} /> Auditar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="xl:col-span-2 space-y-4">
              {selectedPlayer ? (
                <div className="bg-zinc-950 p-4 border border-zinc-900 rounded-xl space-y-5 shadow-xl animate-fadeIn">

                  <div className="border-b border-zinc-900 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-bold text-sm tracking-wide uppercase">{selectedPlayer.username}</h3>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-black border uppercase ${
                          selectedPlayer.status === 'banned' ? 'bg-red-950 text-red-400 border-red-800' : 'bg-emerald-950 text-emerald-400 border-emerald-800'
                        }`}>
                          {selectedPlayer.status}
                        </span>
                      </div>
                      <span className="text-[9px] text-zinc-500 font-mono">UUID: {selectedPlayer.id}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        onClick={handleToggleBan}
                        className={`px-2.5 py-1 rounded text-[8.5px] font-mono font-bold uppercase border cursor-pointer transition-colors flex items-center gap-1 ${
                          selectedPlayer.status === 'banned'
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-700'
                            : 'bg-red-950 text-red-400 border-red-700'
                        }`}
                      >
                        <Ban size={11} />
                        {selectedPlayer.status === 'banned' ? 'Desbanear' : 'Banear Piloto'}
                      </button>
                    </div>
                  </div>

                  {/* RECURSOS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-black/50 p-3 rounded-lg border border-zinc-900 space-y-2">
                      <span className="text-[8.5px] text-zinc-500 font-bold uppercase tracking-widest block border-b border-zinc-900 pb-1 flex items-center gap-1"><Database size={11} /> Recursos Core de Extracción</span>
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div><span className="text-zinc-500 block text-[8px]">METAL:</span> <span className="text-zinc-200 font-bold">{selectedPlayer.metal.toLocaleString()}</span></div>
                        <div><span className="text-cyan-500 block text-[8px]">CRYSTAL:</span> <span className="text-cyan-400 font-bold">{selectedPlayer.crystal.toLocaleString()}</span></div>
                        <div><span className="text-amber-500 block text-[8px]">DEUTERIUM:</span> <span className="text-amber-400 font-bold">{selectedPlayer.deuterium.toLocaleString()}</span></div>
                        <div><span className="text-purple-500 block text-[8px]">DARK_MATTER:</span> <span className="text-purple-400 font-bold">{selectedPlayer.dark_matter.toLocaleString()}</span></div>
                      </div>
                    </div>

                    <div className="bg-black/50 p-3 rounded-lg border border-zinc-900 space-y-2">
                      <span className="text-[8.5px] text-yellow-500 font-bold uppercase tracking-widest block border-b border-zinc-900 pb-1 flex items-center gap-1"><Coins size={11} /> Divisas del Ledger (Billetera Real)</span>
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div><span className="text-yellow-500 block text-[8px]">GD_COIN (USD 1:1):</span> <span className="text-yellow-400 font-bold">${selectedPlayer.gd_coins.toLocaleString()}</span></div>
                        <div><span className="text-emerald-500 block text-[8px]">PHANTOM_COIN:</span> <span className="text-emerald-400 font-bold">{selectedPlayer.phantom_coins.toLocaleString()}</span></div>
                      </div>
                    </div>

                    <div className="bg-black/50 p-3 rounded-lg border border-zinc-900 space-y-2">
                      <span className="text-[8.5px] text-cyan-400 font-bold uppercase tracking-widest block border-b border-zinc-900 pb-1 flex items-center gap-1"><Layers size={11} /> Aleaciones Estructurales Semilla</span>
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div><span className="text-zinc-500 block text-[8px]">OMNIPLATE:</span> <span className="text-zinc-300">{selectedPlayer.omniplate}</span></div>
                        <div><span className="text-zinc-500 block text-[8px]">ORICHALTRON:</span> <span className="text-zinc-300">{selectedPlayer.orichaltron}</span></div>
                        <div><span className="text-zinc-500 block text-[8px]">LUNAR_FIBER:</span> <span className="text-zinc-300">{selectedPlayer.lunar_fiber}</span></div>
                        <div><span className="text-red-400 block text-[8px]">INFINITY_CORE:</span> <span className="text-red-400 font-bold">{selectedPlayer.infinity_core}</span></div>
                      </div>
                    </div>

                    <div className="bg-black/50 p-3 rounded-lg border border-zinc-900 space-y-2">
                      <span className="text-[8.5px] text-purple-400 font-bold uppercase tracking-widest block border-b border-zinc-900 pb-1 flex items-center gap-1"><Zap size={11} /> Frecuencias Cuánticas</span>
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div><span className="text-purple-400 block text-[8px]">PRIMAL_TOKEN:</span> <span className="text-purple-300">{selectedPlayer.primal_token}</span></div>
                        <div><span className="text-fuchsia-400 block text-[8px]">XENOPLASM:</span> <span className="text-fuchsia-300">{selectedPlayer.xenoplasm}</span></div>
                        <div><span className="text-emerald-400 block text-[8px]">ORGANIUM:</span> <span className="text-emerald-300">{selectedPlayer.organium}</span></div>
                        <div><span className="text-cyan-400 block text-[8px]">MANA / ENERGY:</span> <span className="text-cyan-300">{selectedPlayer.mana}</span></div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-zinc-900/20 p-4 border border-zinc-900 rounded-xl space-y-4">

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-zinc-900 pb-2.5">
                      <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                        🛸 EQUIPAMIENTO E INVENTARIO EN VIVO DEL PILOTO
                      </span>
                      <button
                        onClick={() => { fetchPlayerAssets(selectedPlayer.id); }}
                        className="text-zinc-500 hover:text-white flex items-center gap-1 text-[10px] bg-zinc-950 px-2 py-1 border border-zinc-900 rounded cursor-pointer"
                      >
                        <RefreshCw size={10} className={loadingAssets ? "animate-spin text-cyan-400" : ""} /> Recargar Hangar
                      </button>
                    </div>

                    {/* LAS 10 PESTAÑAS DE CATEGORÍAS COMPLETAS */}
                    <div className="flex flex-wrap gap-1 bg-black/40 p-1 rounded-lg border border-zinc-900/60 select-none">
                      {[
                        { id: 'ships', label: '🚀 Naves', count: playerAssets.ships.length, color: 'border-cyan-500 text-cyan-400 bg-cyan-950/10' },
                        { id: 'structures', label: '🏢 Estructuras', count: playerAssets.structures.length, color: 'border-amber-500 text-amber-400 bg-amber-950/10' },
                        { id: 'defenses', label: '🛡️ Defensas', count: playerAssets.defenses.length, color: 'border-red-500 text-red-400 bg-red-950/10' },
                        { id: 'technologies', label: '🔬 Tecnologías', count: playerAssets.technologies.length, color: 'border-purple-500 text-purple-400 bg-purple-950/10' },
                        { id: 'astrobots', label: '🤖 Astrobots', count: playerAssets.astrobots.length, color: 'border-emerald-500 text-emerald-400 bg-emerald-500/10' },
                        { id: 'tools', label: '🔧 Tools', count: playerAssets.tools.length, color: 'border-blue-500 text-blue-400 bg-blue-500/10' },
                        { id: 'licenses', label: '📜 Licencias', count: playerAssets.licenses.length, color: 'border-yellow-500 text-yellow-400 bg-yellow-500/10' },
                        { id: 'consumibles', label: '🧪 Consumibles', count: playerAssets.consumibles.length, color: 'border-pink-500 text-pink-400 bg-pink-500/10' },
                        { id: 'blueprints', label: '🗺️ Blueprints', count: playerAssets.blueprints.length, color: 'border-indigo-500 text-indigo-400 bg-indigo-500/10' },
                        { id: 'badges', label: '🏅 Insignias', count: playerAssets.badges.length, color: 'border-teal-500 text-teal-400 bg-teal-500/10' }
                      ].map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => { setActiveAssetTab(tab.id); }}
                          className={`px-3 py-1.5 font-bold uppercase text-[9.5px] tracking-wider rounded transition-all border cursor-pointer ${
                            activeAssetTab === tab.id
                              ? `${tab.color} border-zinc-800`
                              : 'border-transparent text-zinc-500 hover:text-zinc-400'
                          }`}
                        >
                          {tab.label} <span className="opacity-40 font-normal">({tab.count})</span>
                        </button>
                      ))}
                    </div>

                    <div className="max-h-60 overflow-y-auto pr-1 font-mono text-[11px]">
                      {renderActiveAssetList()}
                    </div>
                  </div>

                  {/* INYECTOR MANUAL BILLETERA */}
                  <div className="bg-zinc-900/30 p-3 border border-zinc-900 rounded-xl space-y-3">
                    <span className="text-[9px] text-amber-400 font-bold uppercase block tracking-wider flex items-center gap-1">
                      <ShieldAlert size={12} className="text-amber-400" /> INYECTOR Y DEDUCTOR MANUAL DE BILLETERA (+ PARA SUMAR, - PARA RESTAR)
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <select className="bg-zinc-950 border border-zinc-800 p-2 rounded text-zinc-300 outline-none text-[11px] cursor-pointer" value={injectType as string} onChange={e => setInjectType(e.target.value as keyof UserProfile)}>
                        <option value="gd_coins">GD COIN (REAL USD 1:1)</option>
                        <option value="phantom_coins">Phantom Coin (phantom_coin)</option>
                        <option value="dark_matter">Materia Oscura (dark_matter)</option>
                        <option value="deuterium">Deuterio (deuterium)</option>
                        <option value="metal">Metal (metal)</option>
                        <option value="crystal">Cristal (crystal)</option>
                        <option value="omniplate">Omniplate (omniplate)</option>
                        <option value="orichaltron">Orichaltron (orichaltron)</option>
                        <option value="lunar_fiber">Lunar Fiber (lunar_fiber)</option>
                        <option value="infinity_core">Infinity Core (infinity_core)</option>
                        <option value="primal_token">Primal Token (primal_token)</option>
                        <option value="xenoplasm">Xenoplasm (xenoplasm)</option>
                        <option value="organium">Organium (organium)</option>
                        <option value="mana">Mana / Energy (mana)</option>
                      </select>
                      <input type="number" placeholder="Monto (+50 o -100)..." className="bg-zinc-950 border border-zinc-800 p-2 rounded font-bold text-amber-400 outline-none text-[11px]" value={injectAmount || ''} onChange={e => setInjectAmount(Number(e.target.value))} />
                      <button onClick={handleLiveAssetInjection} className="bg-amber-600 hover:bg-amber-500 text-white font-black uppercase rounded flex items-center justify-center gap-1.5 transition-all text-[10px] cursor-pointer shadow-lg"><Zap size={12} /> Ejecutar Ajuste de Billetera</button>
                    </div>
                  </div>

                  {/* INYECTOR ENTIDADES */}
                  <div className="bg-zinc-900/30 p-3 border border-zinc-900 rounded-xl space-y-3 relative">
                    <span className="text-[9px] text-cyan-400 font-bold uppercase block tracking-wider flex items-center gap-1">
                      🚀 INYECTOR DE INSTANCIAS Y ENTIDADES (DESPLEGANDO NOMBRES OFICIALES)
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-start">
                      <select className="bg-zinc-950 border border-zinc-800 p-2 rounded text-zinc-300 outline-none text-[11px] cursor-pointer" value={entityGroup} onChange={e => { setEntityGroup(e.target.value); }}>
                        {Object.entries(categoryMap).map(([key, value]) => (
                          <option key={key} value={key}>{value.label}</option>
                        ))}
                      </select>

                      <div className="md:col-span-2">
                        <select 
                          className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded text-zinc-200 outline-none text-[11px] uppercase cursor-pointer"
                          value={blueprintId}
                          onChange={e => setBlueprintId(e.target.value)}
                        >
                          {allSeeds.length === 0 ? (
                            <option value="">(Sin activos registrados en esta categoría)</option>
                          ) : (
                            allSeeds.map(s => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))
                          )}
                        </select>
                      </div>

                      <div className="flex gap-1.5">
                        <input type="number" min="1" placeholder="Lvl" className="w-14 bg-zinc-950 border border-zinc-800 p-2 rounded text-center font-bold text-white outline-none text-[11px]" value={entityLevel} onChange={e => setEntityLevel(Number(e.target.value))} />
                        <button onClick={handleLiveEntityInjection} className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-black uppercase rounded text-[10px] tracking-wider transition-all cursor-pointer shadow-lg shadow-cyan-950/40">Inyectar Ítem</button>
                      </div>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="h-full border border-zinc-900 border-dashed rounded-xl flex flex-col items-center justify-center p-12 text-center bg-zinc-950/20">
                  <Shield size={24} className="text-zinc-800 mb-3 animate-pulse" />
                  <p className="text-zinc-600 max-w-xs text-xs font-mono">Selecciona un comandante de la lista izquierda para expandir su matriz completa de assets y desplegar la consola de inyección.</p>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {activeSubTab === 'general_dashboard' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 shadow-lg flex items-center justify-between">
              <div>
                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">Censo Total de Pilotos</span>
                <div className="text-2xl font-black text-white">{totalCommanders} <span className="text-xs text-zinc-600 font-normal">Cuentas</span></div>
              </div>
              <Users size={20} className="text-cyan-500 opacity-60" />
            </div>

            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 shadow-lg flex items-center justify-between">
              <div>
                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">Masa Circulante GD Coins REAL (USD)</span>
                <div className="text-2xl font-black text-yellow-500">${totalGDCirculating.toLocaleString()} <span className="text-xs text-zinc-600 font-normal">GD</span></div>
              </div>
              <Coins size={20} className="text-yellow-500 opacity-60" />
            </div>

            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 shadow-lg flex items-center justify-between">
              <div>
                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">Suma Total Metal en Bóvedas</span>
                <div className="text-2xl font-black text-zinc-300">{totalMetalCirculating.toLocaleString()} <span className="text-xs text-zinc-600 font-normal">Kg</span></div>
              </div>
              <Database size={20} className="text-zinc-400 opacity-60" />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default UserCRM;