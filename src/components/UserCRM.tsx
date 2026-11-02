import React, { useEffect, useState } from 'react';
import { getSupabaseClient } from '../lib/supabase';
import { 
  Shield, Search, Users, Coins, Database, ShieldAlert, Zap, Layers, 
  CheckSquare, Square, Eye, Trash2, RefreshCw, Ban, Package, Wrench,
  Cpu, Rocket, Building, Layers as LayersIcon, Award, Sparkles, Ticket
} from 'lucide-react';
import { UserProfile } from '../types';

interface ExtendedUserProfile extends UserProfile {
  legacy_id?: number;
  banned_until?: string | null;
}

const categoryMap: Record<string, { targetTable: string, seedTable: string, idColumn: string, label: string }> = {
  ships: { targetTable: 'user_ships', seedTable: 'seed_ships', idColumn: 'ship_id', label: '🚀 Nave (user_ships)' },
  structures: { targetTable: 'user_structures', seedTable: 'seed_structures', idColumn: 'structure_id', label: '🏢 Estructura (user_structures)' },
  defenses: { targetTable: 'user_defenses', seedTable: 'seed_defenses', idColumn: 'defense_id', label: '🛡️ Defensa (user_defenses)' },
  technologies: { targetTable: 'user_technologies', seedTable: 'seed_technologies', idColumn: 'technology_id', label: '🔬 Tecnología (user_technologies)' },
  astrobots: { targetTable: 'user_astrobots', seedTable: 'seed_astrobots', idColumn: 'astrobot_id', label: '🤖 Astrobot (user_astrobots)' },
  tools: { targetTable: 'user_tools', seedTable: 'seed_tools', idColumn: 'tool_id', label: '🔧 Herramienta (user_tools)' },
  blueprints: { targetTable: 'user_blueprints', seedTable: 'seed_blueprints', idColumn: 'blueprint_id', label: '🗺️ Blueprint (user_blueprints)' },
  badges: { targetTable: 'user_badges', seedTable: 'seed_badges', idColumn: 'badge_id', label: '🏅 Insignia (user_badges)' },
  qmps: { targetTable: 'user_qmps', seedTable: 'seed_consumables', idColumn: 'id_qmp', label: '⚡ Módulo QMP (user_qmps)' },
  repair_kits: { targetTable: 'user_repair_kits', seedTable: 'seed_consumables', idColumn: 'id_kit', label: '🧰 Kit de Reparación (user_repair_kits)' },
  materialicers: { targetTable: 'user_materialicers', seedTable: 'seed_consumables', idColumn: 'id_materialicer', label: '🔮 Materializador (user_materialicers)' },
  bags: { targetTable: 'user_bags', seedTable: 'seed_consumables', idColumn: 'id_bag', label: '🎒 Bolsa de Recursos (user_bags)' },
  tickets: { targetTable: 'user_tickets', seedTable: 'seed_consumables', idColumn: 'id_ticket', label: '🎟️ Ticket de Acceso (user_tickets)' },
  packs: { targetTable: 'user_packs', seedTable: 'seed_consumables', idColumn: 'id_pack', label: '📦 Pack Especial (user_packs)' },
  essentials: { targetTable: 'user_essentials', seedTable: 'seed_consumables', idColumn: 'id_essential', label: '✨ Esencial (user_essentials)' }
};

type SubTab = 'crm_central' | 'general_dashboard';

export const UserCRM: React.FC = () => {
  const supabase = getSupabaseClient();
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('crm_central');
  const [players, setPlayers] = useState<ExtendedUserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [selectedPlayer, setSelectedPlayer] = useState<ExtendedUserProfile | null>(null);
  const [bulkSelectedIds, setBulkSelectedIds] = useState<string[]>([]);
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);

  // Estado que almacena todas las categorías de activos reales
  const [playerAssets, setPlayerAssets] = useState<{ 
    ships: any[];
    structures: any[];
    defenses: any[];
    technologies: any[];
    astrobots: any[];
    tools: any[];
    blueprints: any[];
    badges: any[];
    qmps: any[];
    repair_kits: any[];
    materialicers: any[];
    bags: any[];
    tickets: any[];
    packs: any[];
    essentials: any[];
  }>({
    ships: [],
    structures: [],
    defenses: [],
    technologies: [],
    astrobots: [],
    tools: [],
    blueprints: [],
    badges: [],
    qmps: [],
    repair_kits: [],
    materialicers: [],
    bags: [],
    tickets: [],
    packs: [],
    essentials: []
  });

  const [loadingAssets, setLoadingAssets] = useState<boolean>(false);
  const [activeAssetTab, setActiveAssetTab] = useState<string>('ships');

  // Ajuste de divisas
  const [injectAmount, setInjectAmount] = useState<number>(0);
  const [injectType, setInjectType] = useState<string>('gd_coins');

  // Inyección de activos
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

  const mapProfileRow = (row: any): ExtendedUserProfile => {
    const uid = row.id || row.user_id || crypto.randomUUID();
    const isBanned = Boolean(
      (row.banned_until && new Date(row.banned_until).getTime() > Date.now()) ||
      row.status === 'banned' ||
      row.is_banned
    );

    return {
      id: uid,
      legacy_id: row.legacy_id ? Number(row.legacy_id) : undefined,
      banned_until: row.banned_until || null,
      username: row.username || row.display_name || (row.legacy_id ? `Comandante #${row.legacy_id}` : 'Explorador'),
      email: row.email || (row.legacy_id ? `legacy_${row.legacy_id}@galaxydust.io` : `UID: ${uid.substring(0, 8)}`),
      role: row.role || (row.is_admin ? 'admin' : 'user'),
      status: isBanned ? 'banned' : 'active',
      avatarUrl: row.avatarUrl || row.avatar_url || row.avatar || '',
      created_at: row.created_at || new Date().toISOString(),
      last_active: row.updated_at || row.created_at || new Date().toISOString(),
      inventory: [],
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

  const fetchCategorySeedMaps = async () => {
    if (!supabase) return;
    const seedCategories = [
      { cat: 'ships', tbl: 'seed_ships' },
      { cat: 'structures', tbl: 'seed_structures' },
      { cat: 'defenses', tbl: 'seed_defenses' },
      { cat: 'technologies', tbl: 'seed_technologies' },
      { cat: 'astrobots', tbl: 'seed_astrobots' },
      { cat: 'tools', tbl: 'seed_tools' },
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
              row.tool_name || 
              row.blueprint_name || 
              row.badge_name || 
              row.defense_name || 
              row.title;

            if (name) {
              const keys = [
                row.id, row.ship_id, row.structure_id, row.building_id,
                row.technology_id, row.tech_id, row.astrobot_id,
                row.tool_id, row.blueprint_id, row.badge_id, row.defense_id
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
      console.error("Error al cargar mapa de semillas:", e);
    }
  };

  // Paginación continua por lotes: supera el límite de 1.000 filas de PostgREST
  const fetchPlayers = async () => {
    if (!supabase) return;
    try {
      setLoading(true);
      let allUsers: any[] = [];
      let from = 0;
      const step = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .order('legacy_id', { ascending: true, nullsFirst: false })
          .range(from, from + step - 1);

        if (error) throw error;

        if (data && data.length > 0) {
          allUsers = [...allUsers, ...data];
          if (data.length < step) {
            hasMore = false;
          } else {
            from += step;
          }
        } else {
          hasMore = false;
        }
      }

      setPlayers(allUsers.map(mapProfileRow));
    } catch (e: any) {
      console.error("Error al consultar comandantes:", e.message);
    } finally {
      setLoading(false);
    }
  };

  // Función de búsqueda dual: recupera registros tanto por id_user (legacy) como por user_id (UUID)
  const fetchAssetTable = async (tableName: string, userUuid: string, legacyId?: number) => {
    if (!supabase) return [];
    try {
      let combined: any[] = [];

      // 1. Consulta por id_user (datos históricos migrados)
      if (legacyId) {
        const { data: legacyData, error: errLegacy } = await supabase
          .from(tableName)
          .select('*')
          .eq('id_user', legacyId);

        if (!errLegacy && legacyData) {
          combined = [...legacyData];
        }
      }

      // 2. Consulta por user_id (datos generados en cliente moderno)
      if (userUuid) {
        const { data: uuidData, error: errUuid } = await supabase
          .from(tableName)
          .select('*')
          .eq('user_id', userUuid);

        if (!errUuid && uuidData) {
          const existingIds = new Set(combined.map(item => item.id));
          uuidData.forEach(item => {
            if (!existingIds.has(item.id)) {
              combined.push(item);
            }
          });
        }
      }

      return combined;
    } catch {
      return [];
    }
  };

  const fetchPlayerAssets = async (player: ExtendedUserProfile) => {
    if (!supabase || !player) return;
    try {
      setLoadingAssets(true);

      const [
        shipsRes, structsRes, defsRes, techsRes, astroRes, toolsRes, blueRes, badgeRes,
        qmpsRes, kitsRes, matRes, bagsRes, ticketsRes, packsRes, essentialsRes
      ] = await Promise.all([
        fetchAssetTable('user_ships', player.id, player.legacy_id),
        fetchAssetTable('user_structures', player.id, player.legacy_id),
        fetchAssetTable('user_defenses', player.id, player.legacy_id),
        fetchAssetTable('user_technologies', player.id, player.legacy_id),
        fetchAssetTable('user_astrobots', player.id, player.legacy_id),
        fetchAssetTable('user_tools', player.id, player.legacy_id),
        fetchAssetTable('user_blueprints', player.id, player.legacy_id),
        fetchAssetTable('user_badges', player.id, player.legacy_id),
        fetchAssetTable('user_qmps', player.id, player.legacy_id),
        fetchAssetTable('user_repair_kits', player.id, player.legacy_id),
        fetchAssetTable('user_materialicers', player.id, player.legacy_id),
        fetchAssetTable('user_bags', player.id, player.legacy_id),
        fetchAssetTable('user_tickets', player.id, player.legacy_id),
        fetchAssetTable('user_packs', player.id, player.legacy_id),
        fetchAssetTable('user_essentials', player.id, player.legacy_id)
      ]);

      setPlayerAssets({
        ships: shipsRes,
        structures: structsRes,
        defenses: defsRes,
        technologies: techsRes,
        astrobots: astroRes,
        tools: toolsRes,
        blueprints: blueRes,
        badges: badgeRes,
        qmps: qmpsRes,
        repair_kits: kitsRes,
        materialicers: matRes,
        bags: bagsRes,
        tickets: ticketsRes,
        packs: packsRes,
        essentials: essentialsRes
      });
    } catch (e) {
      console.error("Error al sincronizar inventario del comandante:", e);
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
      fetchPlayerAssets(selectedPlayer);
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
        phantom_coins: 'phantom_coin',
        dark_matter: 'dark_matter',
        deuterium: 'deuterium',
        metal: 'metal',
        crystal: 'crystal'
      };

      const targetCurrency = currencyMap[injectType] || injectType;

      let rpcSucceeded = false;
      try {
        const { error } = await supabase.rpc('admin_inject_currency_secure', {
          p_target_user_id: selectedPlayer.id,
          p_currency: targetCurrency,
          p_amount: Number(injectAmount),
          p_reason: `Ajuste manual desde UserCRM por Administrador`
        });
        if (!error) rpcSucceeded = true;
      } catch {
        rpcSucceeded = false;
      }

      // Fallback directo a user_profiles si la RPC no existe
      if (!rpcSucceeded) {
        const currentVal = Number((selectedPlayer as any)[injectType] || 0);
        const newVal = Math.max(0, currentVal + Number(injectAmount));
        const updatePayload: any = { [injectType]: newVal, updated_at: new Date().toISOString() };

        if (injectType === 'metal') updatePayload.metal_balance = newVal;
        if (injectType === 'crystal') updatePayload.crystal_balance = newVal;
        if (injectType === 'deuterium') updatePayload.deuterium_balance = newVal;
        if (injectType === 'dark_matter') updatePayload.dark_matter_balance = newVal;
        if (injectType === 'gd_coins') {
          updatePayload.gd_coin = newVal;
          updatePayload.gd_balance = newVal;
        }
        if (injectType === 'phantom_coins') {
          updatePayload.phantom_coin = newVal;
          updatePayload.phantom_coins_balance = newVal;
        }

        const { error: directErr } = await supabase
          .from('user_profiles')
          .update(updatePayload)
          .eq('id', selectedPlayer.id);

        if (directErr) throw directErr;
      }

      alert(`⚡ Balance actualizado: ${injectAmount > 0 ? '+' : ''}${injectAmount} en ${injectType}`);
      fetchPlayers();
      if (selectedPlayer) fetchPlayerAssets(selectedPlayer);
    } catch (e: any) {
      alert(`Error al inyectar recurso: ${e.message}`);
    }
  };

  const handleLiveEntityInjection = async () => {
    if (!selectedPlayer || !blueprintId.trim()) {
      alert("Selecciona un activo válido del catálogo.");
      return;
    }
    const config = categoryMap[entityGroup];
    if (!config) return;

    try {
      const cleanId = blueprintId.trim();
      const numId = parseInt(cleanId, 10);
      const lvl = Number(entityLevel || 1);

      const payload: any = {
        user_id: selectedPlayer.id,
        [config.idColumn]: isNaN(numId) ? cleanId : numId,
        level: lvl,
        created_at: new Date().toISOString()
      };

      if (selectedPlayer.legacy_id) {
        payload.id_user = selectedPlayer.legacy_id;
      }

      // Parámetros por categoría
      if (entityGroup === 'ships') {
        payload.id_ship = isNaN(numId) ? null : numId;
        payload.name_ship = allSeeds.find(s => s.id === cleanId)?.name || 'Nave';
        payload.health = 1000;
        payload.total_health = 1000;
        payload.percentage_health = 100;
      } else if (entityGroup === 'structures') {
        payload.id_structure = isNaN(numId) ? null : numId;
        payload.building_id = cleanId;
        payload.structure_id = cleanId;
        payload.lvl = lvl;
        payload.current_level = lvl;
      } else if (entityGroup === 'defenses') {
        payload.id_defense = isNaN(numId) ? null : numId;
        payload.defense_id = cleanId;
        payload.health = 100;
        payload.total_health = 100;
        payload.percentage_health = 100;
      } else if (entityGroup === 'technologies') {
        payload.id_technology = isNaN(numId) ? null : numId;
        payload.technology_id = cleanId;
        payload.lvl = lvl;
        payload.current_level = lvl;
      } else if (entityGroup === 'repair_kits') {
        payload.id_kit = isNaN(numId) ? 1 : numId;
        payload.quantity = lvl;
      } else if (entityGroup === 'qmps') {
        payload.id_qmp = isNaN(numId) ? 1 : numId;
        payload.uses = 10;
      } else if (entityGroup === 'materialicers') {
        payload.id_materialicer = isNaN(numId) ? 1 : numId;
        payload.uses = 1;
      } else if (entityGroup === 'bags') {
        payload.id_bag = isNaN(numId) ? 1 : numId;
        payload.is_sell = 0;
      } else if (entityGroup === 'tickets') {
        payload.id_ticket = isNaN(numId) ? 1 : numId;
        payload.is_sell = 0;
      } else if (entityGroup === 'packs') {
        payload.id_pack = isNaN(numId) ? 1 : numId;
        payload.status = 0;
      } else if (entityGroup === 'essentials') {
        payload.id_essential = isNaN(numId) ? 1 : numId;
      } else if (entityGroup === 'blueprints') {
        payload.id_blueprint = isNaN(numId) ? null : numId;
        payload.blueprint_id = cleanId;
        payload.uses = 5;
      }

      const { error } = await supabase.from(config.targetTable).insert([payload]);
      if (error) throw error;

      alert(`🚀 Activo inyectado con éxito en ${config.targetTable}.`);
      fetchPlayerAssets(selectedPlayer);
    } catch (e: any) {
      alert(`Error al inyectar activo: ${e.message}`);
    }
  };

  const handleDeleteEntity = async (tableName: string, record: any) => {
    if (!supabase || !selectedPlayer) return;
    const recordId = typeof record === 'object' ? record.id : record;

    if (!recordId) {
      alert("No se localizó un identificador válido para este elemento.");
      return;
    }

    if (!window.confirm("¿Confirmas la eliminación permanente de este elemento?")) return;

    try {
      const { error } = await supabase.from(tableName).delete().eq('id', recordId);
      if (error) throw error;

      alert("Elemento eliminado correctamente.");
      fetchPlayerAssets(selectedPlayer);
    } catch (e: any) {
      alert(`Error al eliminar: ${e.message}`);
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
      blueprints: 'user_blueprints',
      badges: 'user_badges',
      qmps: 'user_qmps',
      repair_kits: 'user_repair_kits',
      materialicers: 'user_materialicers',
      bags: 'user_bags',
      tickets: 'user_tickets',
      packs: 'user_packs',
      essentials: 'user_essentials'
    };

    const currentTable = targetTableMap[activeAssetTab] || 'user_ships';

    if (!window.confirm(`¿Eliminar los ${selectedAssetIds.length} elementos seleccionados de ${currentTable}?`)) return;

    try {
      const { error } = await supabase.from(currentTable).delete().in('id', selectedAssetIds);
      if (error) throw error;

      alert(`Se eliminaron ${selectedAssetIds.length} elementos.`);
      setSelectedAssetIds([]);
      fetchPlayerAssets(selectedPlayer);
    } catch (e: any) {
      alert(`Error en eliminación múltiple: ${e.message}`);
    }
  };

  const handleToggleBan = async () => {
    if (!selectedPlayer || !supabase) return;
    const isCurrentlyBanned = selectedPlayer.status === 'banned';
    const newStatus = isCurrentlyBanned ? 'active' : 'banned';
    const bannedUntil = isCurrentlyBanned ? null : new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString();

    if (!window.confirm(`¿Deseas ${isCurrentlyBanned ? 'DESBANEAR' : 'BANEAR'} al comandante ${selectedPlayer.username}?`)) return;

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          status: newStatus,
          is_banned: !isCurrentlyBanned,
          banned_until: bannedUntil,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedPlayer.id);

      if (error) throw error;

      alert(`Comandante ${selectedPlayer.username}: ${newStatus.toUpperCase()}`);
      setSelectedPlayer(prev => prev ? { ...prev, status: newStatus, banned_until: bannedUntil } : null);
      fetchPlayers();
    } catch (e: any) {
      alert(`Error al actualizar estado: ${e.message}`);
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
    p.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.legacy_id && String(p.legacy_id).includes(searchTerm))
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
      badges: 'user_badges',
      qmps: 'user_qmps',
      repair_kits: 'user_repair_kits',
      materialicers: 'user_materialicers',
      bags: 'user_bags',
      tickets: 'user_tickets',
      packs: 'user_packs',
      essentials: 'user_essentials'
    };
    const currentTable = targetTableMap[activeAssetTab] || 'user_ships';

    if (assetList.length === 0) {
      return (
        <div className="p-6 text-center text-zinc-600 text-[10px] uppercase italic font-mono border border-dashed border-zinc-900 rounded-lg">
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

    const currentSeedMap = categorySeedMaps[activeAssetTab] || {};

    return (
      <div className="space-y-2">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono">
          {assetList.map((item: any) => {
            const isSelected = selectedAssetIds.includes(item.id);
            
            const assetKey = 
              item.ship_id || item.id_ship ||
              item.building_id || item.structure_id || item.id_structure ||
              item.defense_id || item.id_defense ||
              item.technology_id || item.id_technology ||
              item.astrobot_id || item.id_astrobot ||
              item.tool_id || item.id_tool ||
              item.blueprint_id || item.id_blueprint ||
              item.badge_id || item.id_badge ||
              item.id_qmp || item.id_kit || item.id_materialicer ||
              item.id_bag || item.id_ticket || item.id_pack || item.id_essential ||
              item.id;

            const assetDisplayName = 
              item.custom_name || 
              item.name_ship || 
              item.name_defense ||
              item.name || 
              currentSeedMap[String(assetKey)] || 
              currentSeedMap[String(item.id)] ||
              (activeAssetTab === 'qmps' ? `Módulo QMP #${item.id_qmp || item.id}` :
               activeAssetTab === 'repair_kits' ? `Kit de Reparación T${item.id_kit || item.id}` :
               activeAssetTab === 'materialicers' ? `Materializador #${item.id_materialicer || item.id}` :
               activeAssetTab === 'bags' ? `Bolsa de Suministros #${item.id_bag || item.id}` :
               activeAssetTab === 'tickets' ? `Ticket de Acceso #${item.id_ticket || item.id}` :
               activeAssetTab === 'packs' ? `Pack Reclamable #${item.id_pack || item.id}` :
               activeAssetTab === 'essentials' ? `Ítem Esencial #${item.id_essential || item.id}` :
               `Activo #${assetKey}`);

            // Badges informativas de cada tipo de activo
            const infoDetail = 
              item.quantity !== undefined ? `Cant: ${item.quantity}` :
              item.uses !== undefined ? `Usos: ${item.uses}` :
              item.health !== undefined ? `HP: ${item.health}/${item.total_health || item.health}` :
              item.lvl !== undefined ? `Lvl ${item.lvl}` :
              item.current_level !== undefined ? `Lvl ${item.current_level}` :
              item.level !== undefined ? `Lvl ${item.level}` : null;

            return (
              <div 
                key={item.id} 
                onClick={() => toggleSelectAsset(item.id)}
                className={`p-2.5 bg-zinc-950 border rounded-lg flex justify-between items-center cursor-pointer transition-all ${
                  isSelected ? 'border-cyan-500 bg-cyan-950/20' : 'border-zinc-900 hover:border-zinc-800'
                }`}
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <span className="text-zinc-500 shrink-0">
                    {isSelected ? <CheckSquare size={13} className="text-cyan-400" /> : <Square size={13} />}
                  </span>
                  <div className="truncate">
                    <span className="font-bold text-white block truncate max-w-[170px]" title={assetDisplayName}>
                      {assetDisplayName}
                    </span>
                    {infoDetail && (
                      <span className="text-[9px] text-cyan-400 font-mono block">
                        {infoDetail}
                      </span>
                    )}
                  </div>
                </div>
                
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDeleteEntity(currentTable, item); }} 
                  className="text-zinc-600 hover:text-red-400 p-1.5 rounded hover:bg-zinc-900 transition-colors cursor-pointer shrink-0"
                  title="Eliminar elemento"
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
      {/* Pestañas de Vista */}
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
          {/* Barra de Filtro */}
          <div className="bg-zinc-950 p-4 border border-zinc-900 rounded-xl space-y-3">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <span className="text-zinc-500 text-[10px] uppercase font-bold">
                Consola Táctica • Total {players.length} Comandantes
              </span>
              <input 
                type="text" 
                placeholder="Filtrar por UID, Legacy ID o Nombre..." 
                className="bg-zinc-900 border border-zinc-800 text-zinc-200 px-3 py-1.5 rounded text-xs outline-none focus:border-cyan-500 w-full md:w-72 uppercase" 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
            {/* Lista de Jugadores */}
            <div className="xl:col-span-1 bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden max-h-[750px] flex flex-col">
              <table className="min-w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-900 bg-zinc-900/40 text-zinc-500 text-[10px] font-bold">
                    <th className="p-3 w-10 text-center">
                      <button onClick={toggleSelectAll} className="text-zinc-500 hover:text-white transition-colors cursor-pointer">
                        {bulkSelectedIds.length === filteredPlayers.length ? <CheckSquare size={14} className="text-cyan-400" /> : <Square size={14} />}
                      </button>
                    </th>
                    <th className="p-3">PILOTO / LEGACY</th>
                    <th className="p-3 text-right">MONITOR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900 text-zinc-300 text-[11px] overflow-y-auto">
                  {filteredPlayers.map(p => (
                    <tr 
                      key={p.id} 
                      className={`hover:bg-zinc-900/30 cursor-pointer ${selectedPlayer?.id === p.id ? 'bg-zinc-900/40 border-l-2 border-cyan-500' : ''}`} 
                      onClick={() => setSelectedPlayer(p)}
                    >
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
                        <div className="text-[9px] text-zinc-500 tracking-tight font-mono truncate max-w-[155px]">
                          {p.legacy_id ? `Legacy ID: #${p.legacy_id}` : p.email}
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <button className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded font-bold text-cyan-400 hover:bg-zinc-850 flex items-center gap-1 ml-auto text-[10px] cursor-pointer">
                          <Eye size={11} /> Auditar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Panel de Auditoría e Inventario Detallado */}
            <div className="xl:col-span-2 space-y-4">
              {selectedPlayer ? (
                <div className="bg-zinc-950 p-4 border border-zinc-900 rounded-xl space-y-5 shadow-xl animate-fadeIn">
                  {/* Cabecera del Piloto */}
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
                      <span className="text-[9px] text-zinc-500 font-mono">
                        UUID: {selectedPlayer.id} {selectedPlayer.legacy_id ? `• Legacy ID: #${selectedPlayer.legacy_id}` : ''}
                      </span>
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

                  {/* Bóveda y Recursos */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-black/50 p-3 rounded-lg border border-zinc-900 space-y-2">
                      <span className="text-[8.5px] text-zinc-500 font-bold uppercase tracking-widest block border-b border-zinc-900 pb-1 flex items-center gap-1">
                        <Database size={11} /> Recursos Core de Extracción
                      </span>
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div><span className="text-zinc-500 block text-[8px]">METAL:</span> <span className="text-zinc-200 font-bold">{selectedPlayer.metal.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 3 })}</span></div>
                        <div><span className="text-cyan-500 block text-[8px]">CRISTAL:</span> <span className="text-cyan-400 font-bold">{selectedPlayer.crystal.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 3 })}</span></div>
                        <div><span className="text-amber-500 block text-[8px]">DEUTERIO:</span> <span className="text-amber-400 font-bold">{selectedPlayer.deuterium.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 3 })}</span></div>
                        <div><span className="text-purple-500 block text-[8px]">MATERIA OSCURA:</span> <span className="text-purple-400 font-bold">{selectedPlayer.dark_matter.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 3 })}</span></div>
                      </div>
                    </div>

                    <div className="bg-black/50 p-3 rounded-lg border border-zinc-900 space-y-2">
                      <span className="text-[8.5px] text-yellow-500 font-bold uppercase tracking-widest block border-b border-zinc-900 pb-1 flex items-center gap-1">
                        <Coins size={11} /> Balances de Divisas
                      </span>
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div><span className="text-yellow-500 block text-[8px]">GD COIN (USD):</span> <span className="text-yellow-400 font-bold">${selectedPlayer.gd_coins.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 3 })}</span></div>
                        <div><span className="text-emerald-500 block text-[8px]">PHANTOM COIN:</span> <span className="text-emerald-400 font-bold">{selectedPlayer.phantom_coins.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 3 })}</span></div>
                      </div>
                    </div>
                  </div>

                  {/* Panel de Inventario con las 15 Categorías Reales */}
                  <div className="bg-zinc-900/20 p-4 border border-zinc-900 rounded-xl space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-zinc-900 pb-2.5">
                      <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                        🛸 INVENTARIO & ACTIVOS RELACIONALES DEL PILOTO
                      </span>
                      <button
                        onClick={() => { fetchPlayerAssets(selectedPlayer); }}
                        className="text-zinc-500 hover:text-white flex items-center gap-1 text-[10px] bg-zinc-950 px-2 py-1 border border-zinc-900 rounded cursor-pointer"
                      >
                        <RefreshCw size={10} className={loadingAssets ? "animate-spin text-cyan-400" : ""} /> Sincronizar Activos
                      </button>
                    </div>

                    {/* Selector de Pestañas de Activos */}
                    <div className="flex flex-wrap gap-1 bg-black/40 p-1.5 rounded-lg border border-zinc-900/60 select-none">
                      {[
                        { id: 'ships', label: '🚀 Naves', count: playerAssets.ships.length, color: 'text-cyan-400 border-cyan-800' },
                        { id: 'structures', label: '🏢 Estructuras', count: playerAssets.structures.length, color: 'text-amber-400 border-amber-800' },
                        { id: 'defenses', label: '🛡️ Defensas', count: playerAssets.defenses.length, color: 'text-red-400 border-red-800' },
                        { id: 'technologies', label: '🔬 Tecnologías', count: playerAssets.technologies.length, color: 'text-purple-400 border-purple-800' },
                        { id: 'astrobots', label: '🤖 Astrobots', count: playerAssets.astrobots.length, color: 'text-emerald-400 border-emerald-800' },
                        { id: 'tools', label: '🔧 Tools', count: playerAssets.tools.length, color: 'text-blue-400 border-blue-800' },
                        { id: 'blueprints', label: '🗺️ Planos', count: playerAssets.blueprints.length, color: 'text-indigo-400 border-indigo-800' },
                        { id: 'badges', label: '🏅 Insignias', count: playerAssets.badges.length, color: 'text-teal-400 border-teal-800' },
                        { id: 'repair_kits', label: '🧰 Kits Reparación', count: playerAssets.repair_kits.length, color: 'text-yellow-400 border-yellow-800' },
                        { id: 'qmps', label: '⚡ QMPs', count: playerAssets.qmps.length, color: 'text-cyan-300 border-cyan-700' },
                        { id: 'materialicers', label: '🔮 Materialicers', count: playerAssets.materialicers.length, color: 'text-pink-400 border-pink-800' },
                        { id: 'bags', label: '🎒 Bolsas', count: playerAssets.bags.length, color: 'text-orange-400 border-orange-800' },
                        { id: 'tickets', label: '🎟️ Tickets', count: playerAssets.tickets.length, color: 'text-emerald-300 border-emerald-700' },
                        { id: 'packs', label: '📦 Packs', count: playerAssets.packs.length, color: 'text-purple-300 border-purple-700' },
                        { id: 'essentials', label: '✨ Esenciales', count: playerAssets.essentials.length, color: 'text-amber-300 border-amber-700' }
                      ].map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => { setActiveAssetTab(tab.id); }}
                          className={`px-2.5 py-1 font-bold uppercase text-[9px] tracking-wider rounded transition-all border cursor-pointer ${
                            activeAssetTab === tab.id
                              ? `${tab.color} bg-zinc-900`
                              : 'border-transparent text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          {tab.label} <span className="opacity-50">({tab.count})</span>
                        </button>
                      ))}
                    </div>

                    {/* Listado de Activos Activo */}
                    <div className="max-h-64 overflow-y-auto pr-1 font-mono text-[11px]">
                      {renderActiveAssetList()}
                    </div>
                  </div>

                  {/* Inyector de Divisas */}
                  <div className="bg-zinc-900/30 p-3 border border-zinc-900 rounded-xl space-y-3">
                    <span className="text-[9px] text-amber-400 font-bold uppercase block tracking-wider flex items-center gap-1">
                      <ShieldAlert size={12} className="text-amber-400" /> Inyector / Deductor de Balances (+ para sumar, - para restar)
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <select 
                        className="bg-zinc-950 border border-zinc-800 p-2 rounded text-zinc-300 outline-none text-[11px] cursor-pointer" 
                        value={injectType} 
                        onChange={e => setInjectType(e.target.value)}
                      >
                        <option value="gd_coins">GD Coin (USD Real)</option>
                        <option value="phantom_coins">Phantom Coin</option>
                        <option value="metal">Metal</option>
                        <option value="crystal">Cristal</option>
                        <option value="deuterium">Deuterio</option>
                        <option value="dark_matter">Materia Oscura</option>
                        <option value="omniplate">Omniplate</option>
                        <option value="orichaltron">Orichaltron</option>
                        <option value="lunar_fiber">Lunar Fiber</option>
                        <option value="infinity_core">Infinity Core</option>
                        <option value="primal_token">Primal Token</option>
                        <option value="xenoplasm">Xenoplasm</option>
                        <option value="organium">Organium</option>
                        <option value="mana">Mana / Energía</option>
                      </select>
                      <input 
                        type="number" 
                        placeholder="Monto (+500 o -200)..." 
                        className="bg-zinc-950 border border-zinc-800 p-2 rounded font-bold text-amber-400 outline-none text-[11px]" 
                        value={injectAmount || ''} 
                        onChange={e => setInjectAmount(Number(e.target.value))} 
                      />
                      <button 
                        onClick={handleLiveAssetInjection} 
                        className="bg-amber-600 hover:bg-amber-500 text-white font-black uppercase rounded flex items-center justify-center gap-1.5 transition-all text-[10px] cursor-pointer shadow-lg"
                      >
                        <Zap size={12} /> Ejecutar Ajuste
                      </button>
                    </div>
                  </div>

                  {/* Inyector de Instancias de Activos */}
                  <div className="bg-zinc-900/30 p-3 border border-zinc-900 rounded-xl space-y-3">
                    <span className="text-[9px] text-cyan-400 font-bold uppercase block tracking-wider flex items-center gap-1">
                      <Rocket size={12} /> Inyector de Instancias a Cuenta (Asignación Directa)
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-start">
                      <select 
                        className="bg-zinc-950 border border-zinc-800 p-2 rounded text-zinc-300 outline-none text-[11px] cursor-pointer" 
                        value={entityGroup} 
                        onChange={e => setEntityGroup(e.target.value)}
                      >
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
                            <option value="">(Sin especificaciones disponibles)</option>
                          ) : (
                            allSeeds.map(s => (
                              <option key={s.id} value={s.id}>{s.name} [{s.id}]</option>
                            ))
                          )}
                        </select>
                      </div>

                      <div className="flex gap-1.5">
                        <input 
                          type="number" 
                          min={1} 
                          placeholder="Lvl/Cant" 
                          className="w-16 bg-zinc-950 border border-zinc-800 p-2 rounded text-center font-bold text-white outline-none text-[11px]" 
                          value={entityLevel} 
                          onChange={e => setEntityLevel(Number(e.target.value))} 
                        />
                        <button 
                          onClick={handleLiveEntityInjection} 
                          className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-black uppercase rounded text-[10px] tracking-wider transition-all cursor-pointer shadow-lg"
                        >
                          Inyectar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full border border-zinc-900 border-dashed rounded-xl flex flex-col items-center justify-center p-12 text-center bg-zinc-950/20">
                  <Shield size={24} className="text-zinc-800 mb-3 animate-pulse" />
                  <p className="text-zinc-600 max-w-xs text-xs font-mono">
                    Selecciona un comandante de la lista izquierda para expandir su matriz completa de inventarios, saldos y módulos activos.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Vista de Métricas Globales */}
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
                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">Masa Circulante GD Coins (USD)</span>
                <div className="text-2xl font-black text-yellow-500">${totalGDCirculating.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 3 })} <span className="text-xs text-zinc-600 font-normal">GD</span></div>
              </div>
              <Coins size={20} className="text-yellow-500 opacity-60" />
            </div>

            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 shadow-lg flex items-center justify-between">
              <div>
                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">Suma Total de Metal</span>
                <div className="text-2xl font-black text-zinc-300">{totalMetalCirculating.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 3 })} <span className="text-xs text-zinc-600 font-normal">Kg</span></div>
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