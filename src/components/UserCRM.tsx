import React, { useEffect, useState } from 'react';
import { getSupabaseClient } from '../lib/supabase';
import { 
  Shield, Search, Users, Coins, Database, ShieldAlert, Zap, Layers, 
  CheckSquare, Square, Eye, Trash2, RefreshCw, Ban, VolumeX, UserX, AlertOctagon, RotateCcw
} from 'lucide-react';

interface PlayerProfile {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'player';
  status: 'active' | 'banned' | 'muted';
  created_at: string;
  wallet_address: string;
  avatar_url?: string;
  can_level: number;
  can_xp: number;
  metal_balance: number;
  crystal_balance: number;
  deuterium_balance: number;
  dark_matter_balance: number;
  gd_balance: number;
  phantom_coins_balance: number;
  gd_coin: number;
  quantum_credit: number;
  halloween_coin: number;
  phantom_coin: number;
  xmas_coin: number;
  valentine_coin: number;
  omniplate: number;
  orichaltron: number;
  lunar_fiber: number;
  infinite_core: number;
  primal_token: number;
  xenoplasm: number;
  organium: number;
  mana: number;
  is_admin: boolean;
}

const categoryMap: Record<string, { targetTable: string, seedTable: string, idColumn: string, label: string }> = {
  ships: { targetTable: 'user_ships', seedTable: 'seed_ships', idColumn: 'ship_id', label: '🚀 Nueva Nave (user_ships)' },
  structures: { targetTable: 'user_structures', seedTable: 'seed_structures', idColumn: 'building_id', label: '🏢 Nueva Estructura (user_structures)' },
  defenses: { targetTable: 'user_defenses', seedTable: 'seed_defenses', idColumn: 'defense_id', label: '🛡️ Nueva Defensa (user_defenses)' },
  technologies: { targetTable: 'user_technologies', seedTable: 'seed_technologies', idColumn: 'technology_id', label: '🔬 Nueva Tecnología (user_technologies)' },
  astrobots: { targetTable: 'user_astrobots', seedTable: 'seed_astrobots', idColumn: 'astrobot_id', label: '🤖 Nuevo Astrobot (user_astrobots)' },
  licenses: { targetTable: 'user_licenses', seedTable: 'seed_licenses', idColumn: 'license_id', label: '📜 Nueva Licencia (user_licenses)' },
  badges: { targetTable: 'user_badges', seedTable: 'seed_badges', idColumn: 'badge_id', label: '🏅 Nueva Insignia (user_badges)' },
  consumibles: { targetTable: 'user_consumibles', seedTable: 'seed_consumibles', idColumn: 'consumable_id', label: '🧪 Nuevo Consumible (user_consumibles)' },
  blueprints: { targetTable: 'user_blueprints', seedTable: 'seed_blueprints', idColumn: 'blueprint_id', label: '🗺️ Nuevo Blueprint (user_blueprints)' },
  tools: { targetTable: 'user_tools', seedTable: 'seed_tools', idColumn: 'tool_id', label: '🔧 Nueva Herramienta (user_tools)' },
};

type SubTab = 'crm_central' | 'general_dashboard';

export const UserCRM: React.FC = () => {
  const supabase = getSupabaseClient();
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('crm_central');
  const [players, setPlayers] = useState<PlayerProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Estados de Selección
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerProfile | null>(null);
  const [bulkSelectedIds, setBulkSelectedIds] = useState<string[]>([]);

  // Estado de los Assets Físicos reales en Supabase
  const [playerAssets, setPlayerAssets] = useState<{ 
    ships: any[], 
    structures: any[], 
    technologies: any[], 
    astrobots: any[],
    tools: any[],
    licenses: any[],
    consumibles: any[]
  }>({
    ships: [], structures: [], technologies: [], astrobots: [], tools: [], licenses: [], consumibles: []
  });
  const [loadingAssets, setLoadingAssets] = useState<boolean>(false);

  // Estados para el control y filtrado del Hangar interno segmentado
  const [activeAssetTab, setActiveAssetTab] = useState<string>('ships');
  const [assetSearchTerm, setAssetSearchTerm] = useState<string>('');

  // Formulario de Inyección
  const [injectAmount, setInjectAmount] = useState<number>(0);
  const [injectType, setInjectType] = useState<string>('gd_balance');

  // Formulario de Entidades y Autocomplete
  const [entityGroup, setEntityGroup] = useState<string>('ships');
  const [blueprintId, setBlueprintId] = useState<string>('');
  const [entityLevel, setEntityLevel] = useState<number>(1);
  const [allSeeds, setAllSeeds] = useState<{ id: string; name: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);

  // Estados de Modificación Masiva
  const [bulkLevel, setBulkLevel] = useState<number>(1);
  const [bulkRole, setBulkRole] = useState<string>('no_change');

  const fetchPlayers = async () => {
    if (!supabase) return;
    try {
      setLoading(true);
      const { data, error } = await supabase.from('user_profiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      if (data) {
        const mapped: PlayerProfile[] = data.map((row: any) => {
          const uid = row.user_id || row.id || crypto.randomUUID();
          return {
            id: uid,
            username: row.username || row.display_name || (row.wallet_address ? `${row.wallet_address.slice(0, 6)}...${row.wallet_address.slice(-4)}` : 'Explorador'),
            email: `UID: ${uid.substring(0, 8).toUpperCase()}`,
            role: row.is_admin ? 'admin' : 'player',
            status: row.status || (row.is_banned ? 'banned' : row.is_muted ? 'muted' : 'active'),
            created_at: row.created_at || new Date().toISOString(),
            wallet_address: row.wallet_address || '',
            avatar_url: row.avatar_url || row.avatar || '',
            can_level: row.can_level || row.level || 1,
            can_xp: Number(row.can_xp || row.exp_points) || 0,
            metal_balance: Number(row.metal_balance || row.metal) || 0,
            crystal_balance: Number(row.crystal_balance || row.crystal) || 0,
            deuterium_balance: Number(row.deuterium_balance || row.deuterium) || 0,
            dark_matter_balance: Number(row.dark_matter_balance || row.dark_matter) || 0,
            gd_balance: Number(row.gd_balance || row.gd_coin) || 0,
            phantom_coins_balance: Number(row.phantom_coins_balance || row.phantom_coin) || 0,
            gd_coin: Number(row.gd_coin) || 0,
            quantum_credit: Number(row.quantum_credit) || 0,
            halloween_coin: Number(row.halloween_coin) || 0,
            phantom_coin: Number(row.phantom_coin) || 0,
            xmas_coin: Number(row.xmas_coin) || 0,
            valentine_coin: Number(row.valentine_coin) || 0,
            omniplate: Number(row.omniplate) || 0,
            orichaltron: Number(row.orichaltron) || 0,
            lunar_fiber: Number(row.lunar_fiber) || 0,
            infinite_core: Number(row.infinite_core) || 0,
            primal_token: Number(row.primal_token) || 0,
            xenoplasm: Number(row.xenoplasm) || 0,
            organium: Number(row.organium) || 0,
            mana: Number(row.mana) || 0,
            is_admin: !!row.is_admin
          };
        });
        setPlayers(mapped);
      }
    } catch (e: any) {
      console.error("Error al cargar jugadores en UserCRM:", e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── 📡 EXTRACTOR DE ASSETS FÍSICOS REALES EN SUPABASE ──
  // ── 📡 EXTRACTOR DE ASSETS FÍSICOS REALES EN SUPABASE ──
  const fetchPlayerAssets = async (userId: string) => {
    if (!supabase) return;
    try {
      setLoadingAssets(true);

      // 1. Obtener legacy_id desde user_profiles
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('legacy_id')
        .eq('id', userId)
        .single();

      if (!profile?.legacy_id) {
        setPlayerAssets({
          ships: [],
          structures: [],
          technologies: [],
          astrobots: [],
          tools: [],
          licenses: [],
          consumibles: []
        });
        return;
      }

      const legacyId = profile.legacy_id;

      // 2. Consultar las naves y demás usando el id_user numérico (legacy_id)
      const [shipsRes, structsRes, techsRes, astroRes, toolsRes, licsRes, consRes] = await Promise.all([
        supabase.from('user_ships').select('*', { count: 'exact' }).eq('id_user', legacyId).range(0, 2000),
        supabase.from('user_structures').select('*').eq('id_user', legacyId),
        supabase.from('user_technologies').select('*').eq('id_user', legacyId),
        supabase.from('user_astrobots').select('*').eq('id_user', legacyId),
        supabase.from('user_tools').select('*').eq('id_user', legacyId),
        supabase.from('user_licenses').select('*').eq('id_user', legacyId),
        supabase.from('user_consumibles').select('*').eq('id_user', legacyId),
      ]);

      setPlayerAssets({
        ships: shipsRes.data || [],
        structures: structsRes.data || [],
        technologies: techsRes.data || [],
        astrobots: astroRes.data || [],
        tools: toolsRes.data || [],
        licenses: licsRes.data || [],
        consumibles: consRes.data || []
      });
    } catch (e) {
      console.error("Error sincronizando hangar relacional:", e);
    } finally {
      setLoadingAssets(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  // Escucha cuando seleccionas un piloto para jalar sus naves e inventario real
  useEffect(() => {
    if (selectedPlayer) {
      fetchPlayerAssets(selectedPlayer.id);
    }
  }, [selectedPlayer]);

  // Cargador del predictor semilla
  useEffect(() => {
    if (!supabase) return;
    const fetchActiveSeedCatalog = async () => {
      const config = categoryMap[entityGroup];
      if (!config) return;
      try {
        const { data, error } = await supabase.from(config.seedTable).select('*');
        if (!error && data) {
          const mappedSeeds = data.map((row: any) => {
            const actualId = row.id || row[config.idColumn] || '';
            const actualName = row.name || row.title || row.ship_name || row.structure_name || actualId;
            return { id: String(actualId), name: String(actualName) };
          }).filter(item => item.id);
          setAllSeeds(mappedSeeds);
        } else {
          setAllSeeds([]);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchActiveSeedCatalog();
  }, [entityGroup, supabase]);

  // ── 1. INYECTOR MONETARIO INDIVIDUAL ──
  const handleLiveAssetInjection = async () => {
    if (!selectedPlayer || injectAmount <= 0) return;
    try {
      const currentVal = (selectedPlayer as any)[injectType] || 0;
      const newVal = currentVal + Number(injectAmount);
      
      const { error } = await supabase
        .from('user_profiles')
        .update({ [injectType]: newVal })
        .or(`id.eq.${selectedPlayer.id},user_id.eq.${selectedPlayer.id}`);

      if (error) throw error;
      alert(`⚡ Inyección Exitosa: +${injectAmount} agregados a ${injectType}`);
      fetchPlayers();
      setSelectedPlayer(null);
    } catch (e: any) {
      alert(`Error en inyección: ${e.message}`);
    }
  };

  // ── 2. INYECTOR DE INSTANCIAS (BLUEPRINTS REALES) ──
  const handleLiveEntityInjection = async () => {
    if (!selectedPlayer || !blueprintId.trim()) {
      alert("Por favor, introduce o selecciona una especificación válida.");
      return;
    }
    const config = categoryMap[entityGroup];
    if (!config) return;
    try {
      // 1. Obtener legacy_id del piloto usando su UUID
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('legacy_id')
        .eq('id', selectedPlayer.id)
        .single();

      if (!profile?.legacy_id) {
        alert("No se encontró el ID numérico (legacy_id) para este perfil.");
        return;
      }

      const insertPayload: any = {
        id_user: profile.legacy_id,
        [config.idColumn]: blueprintId.trim(),
        level: Number(entityLevel)
      };
      const { error } = await supabase.from(config.targetTable).insert([insertPayload]);
      if (error) throw error;
      alert(`🚀 TRANSMISIÓN COMPLETADA: Instancia de [${blueprintId}] inyectada con éxito.`);
      setBlueprintId('');
      setShowSuggestions(false);
      fetchPlayerAssets(selectedPlayer.id);
    } catch (e: any) {
      alert(`Fallo en la inyección: ${e.message}`);
    }
  };

  // ── 3. ELIMINADOR DE INSTANCIAS (DESINTEGRADOR ROOT) ──
  const handleDeleteEntity = async (tableName: string, recordId: string) => {
    if (!supabase || !selectedPlayer || !window.confirm("¿🚨 ADVERTENCIA MASTER: Estás seguro de desintegrar permanentemente este asset del inventario del jugador?")) return;
    try {
      const { error } = await supabase.from(tableName).delete().eq('id', recordId);
      if (error) throw error;
      alert("¡Asset desintegrado del servidor con éxito!");
      fetchPlayerAssets(selectedPlayer.id);
    } catch (e: any) {
      alert(`Fallo al eliminar: ${e.message}`);
    }
  };

  // ── 4. SANCIONES Y MODERACIÓN EN TIEMPO REAL (BAN / MUTE / RESET AVATAR) ──
  const handleToggleBan = async () => {
    if (!selectedPlayer || !supabase) return;
    const newStatus = selectedPlayer.status === 'banned' ? 'active' : 'banned';
    if (!window.confirm(`¿Confirmas ${newStatus === 'banned' ? 'BANEAR' : 'DESBANEAR'} al comandante ${selectedPlayer.username}?`)) return;

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ status: newStatus, is_banned: newStatus === 'banned' })
        .or(`id.eq.${selectedPlayer.id},user_id.eq.${selectedPlayer.id}`);

      if (error) throw error;
      alert(`✅ Piloto ${selectedPlayer.username} marcado como ${newStatus.toUpperCase()}`);
      setSelectedPlayer(prev => prev ? { ...prev, status: newStatus } : null);
      fetchPlayers();
    } catch (e: any) {
      alert(`Error en sanción: ${e.message}`);
    }
  };

  const handleToggleMute = async () => {
    if (!selectedPlayer || !supabase) return;
    const newStatus = selectedPlayer.status === 'muted' ? 'active' : 'muted';
    if (!window.confirm(`¿Confirmas ${newStatus === 'muted' ? 'SILENCIAR (MUTE)' : 'REACTIVAR'} al comandante ${selectedPlayer.username}?`)) return;

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ status: newStatus, is_muted: newStatus === 'muted' })
        .or(`id.eq.${selectedPlayer.id},user_id.eq.${selectedPlayer.id}`);

      if (error) throw error;
      alert(`✅ Piloto ${selectedPlayer.username} marcado como ${newStatus.toUpperCase()}`);
      setSelectedPlayer(prev => prev ? { ...prev, status: newStatus } : null);
      fetchPlayers();
    } catch (e: any) {
      alert(`Error en moderación: ${e.message}`);
    }
  };

  const handleResetAvatar = async () => {
    if (!selectedPlayer || !supabase) return;
    const defaultAvatar = "https://qldjeysusithpblfrmtq.supabase.co/storage/v1/object/public/Assets%20para%20la%20Pagina%20Web/Avatares%20de%20Comandantes/1.png";
    if (!window.confirm(`¿Resetear el avatar de ${selectedPlayer.username} al valor oficial por defecto?`)) return;

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ avatar_url: defaultAvatar, avatar: defaultAvatar })
        .or(`id.eq.${selectedPlayer.id},user_id.eq.${selectedPlayer.id}`);

      if (error) throw error;
      alert("✅ Avatar reseteado correctamente.");
      fetchPlayers();
    } catch (e: any) {
      alert(`Error al resetear avatar: ${e.message}`);
    }
  };

  // ── 5. MOTOR EN LOTE ──
  const handleApplyBulkChanges = async () => {
    if (bulkSelectedIds.length === 0) return;
    try {
      const updatePayload: any = { can_level: Number(bulkLevel) };
      if (bulkRole !== 'no_change') updatePayload.is_admin = bulkRole === 'admin';
      
      const { error } = await supabase
        .from('user_profiles')
        .update(updatePayload)
        .in('user_id', bulkSelectedIds);

      if (error) throw error;
      alert(`¡Operación masiva completada! ${bulkSelectedIds.length} pilotos actualizados.`);
      setBulkSelectedIds([]);
      fetchPlayers();
    } catch (e: any) {
      alert(`Error masivo: ${e.message}`);
    }
  };

  const toggleSelectAll = () => {
    if (bulkSelectedIds.length === filteredPlayers.length) setBulkSelectedIds([]);
    else setBulkSelectedIds(filteredPlayers.map(p => p.id));
  };

  const toggleSelectRow = (id: string) => {
    setBulkSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const filteredPlayers = players.filter(p =>
    p.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.wallet_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSuggestions = allSeeds.filter(s =>
    s.id.toLowerCase().includes(blueprintId.toLowerCase()) || s.name.toLowerCase().includes(blueprintId.toLowerCase())
  ).slice(0, 5);

  const totalCommanders = players.length;
  const totalGDCirculating = players.reduce((acc, p) => acc + p.gd_balance, 0);
  const totalMetalCirculating = players.reduce((acc, p) => acc + p.metal_balance, 0);

  return (
    <div className="space-y-6 font-mono text-xs text-left text-white select-none">

      {/* NAVEGACIÓN SUB-PESTAÑAS */}
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

          {/* CONSOLE SUPERIOR */}
          <div className="bg-zinc-950 p-4 border border-zinc-900 rounded-xl space-y-3">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <span className="text-zinc-500 text-[10px] uppercase font-bold">Consola Táctica Perimetral</span>
              <input type="text" placeholder="Filtrar por UID, Wallet o Nombre..." className="bg-zinc-900 border border-zinc-800 text-zinc-200 px-3 py-1.5 rounded text-xs outline-none focus:border-cyan-500 w-full md:w-64 uppercase" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>

            {bulkSelectedIds.length > 0 && (
              <div className="pt-3 border-t border-zinc-900/60 flex flex-col md:flex-row items-center justify-between gap-3 bg-red-950/10 p-3 rounded border border-red-500/20 animate-fadeIn">
                <span className="text-red-400 font-bold text-[10px] uppercase">⚡ MODIFICACIÓN EN LOTE: {bulkSelectedIds.length} PILOTOS SELECCIONADOS</span>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-500 text-[9px]">Nivel CAN:</span>
                    <input type="number" min="1" className="bg-zinc-900 border border-zinc-800 p-1 rounded w-14 text-center text-white font-bold" value={bulkLevel} onChange={e => setBulkLevel(Number(e.target.value))} />
                  </div>
                  <select className="bg-zinc-900 border border-zinc-800 p-1 rounded text-zinc-300 outline-none cursor-pointer" value={bulkRole} onChange={e => setBulkRole(e.target.value)}>
                    <option value="no_change">No alterar Rango</option>
                    <option value="player">Degradar a PLAYER</option>
                    <option value="admin">Promover a ADMIN</option>
                  </select>
                  <button onClick={handleApplyBulkChanges} className="bg-red-600 hover:bg-red-500 text-white font-black px-3 py-1 rounded text-[10px] uppercase tracking-wider transition-colors cursor-pointer">Ejecutar Cambios masivos</button>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">

            {/* LADO IZQUIERDO DE LISTA DE PILOTOS */}
            <div className="xl:col-span-1 bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden">
              <table className="min-w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-900 bg-zinc-900/40 text-zinc-500 text-[10px] font-bold">
                    <th className="p-3 w-10 text-center">
                      <button onClick={toggleSelectAll} className="text-zinc-500 hover:text-white transition-colors cursor-pointer">
                        {bulkSelectedIds.length === filteredPlayers.length ? <CheckSquare size={14} className="text-cyan-400" /> : <Square size={14} />}
                      </button>
                    </th>
                    <th className="p-3">PILOTO / WALLET</th>
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
                          {p.status === 'muted' && <span className="px-1 bg-amber-950 text-amber-400 text-[7.5px] border border-amber-800 rounded">MUTE</span>}
                        </div>
                        <div className="text-[9px] text-zinc-500 tracking-tight font-mono truncate max-w-[155px]">{p.wallet_address || p.id}</div>
                      </td>
                      <td className="p-3 text-right">
                        <button className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded font-bold text-cyan-400 hover:bg-zinc-850 flex items-center gap-1 ml-auto text-[10px] cursor-pointer"><Eye size={11} /> Auditar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* LADO DERECHO EXPANSIVO CON ACCIONES DISCIPLINARIAS */}
            <div className="xl:col-span-2 space-y-4">
              {selectedPlayer ? (
                <div className="bg-zinc-950 p-4 border border-zinc-900 rounded-xl space-y-5 shadow-xl animate-fadeIn">

                  {/* HEADER CON BOTONES DE DISCIPLINA (BAN/MUTE/RESET) */}
                  <div className="border-b border-zinc-900 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-bold text-sm tracking-wide uppercase">{selectedPlayer.username}</h3>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-black border uppercase ${
                          selectedPlayer.status === 'banned' ? 'bg-red-950 text-red-400 border-red-800' :
                          selectedPlayer.status === 'muted' ? 'bg-amber-950 text-amber-400 border-amber-800' :
                          'bg-emerald-950 text-emerald-400 border-emerald-800'
                        }`}>
                          {selectedPlayer.status}
                        </span>
                      </div>
                      <span className="text-[9px] text-zinc-500 font-mono">UUID: {selectedPlayer.id}</span>
                    </div>

                    {/* ACCIONES TÁCTICAS DISCIPLINARIAS */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        onClick={handleToggleBan}
                        className={`px-2.5 py-1 rounded text-[8.5px] font-mono font-bold uppercase border cursor-pointer transition-colors flex items-center gap-1 ${
                          selectedPlayer.status === 'banned'
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-700 hover:bg-emerald-900'
                            : 'bg-red-950 text-red-400 border-red-700 hover:bg-red-900'
                        }`}
                      >
                        <Ban size={11} />
                        {selectedPlayer.status === 'banned' ? 'Desbanear' : 'Banear Piloto'}
                      </button>

                      <button
                        onClick={handleToggleMute}
                        className={`px-2.5 py-1 rounded text-[8.5px] font-mono font-bold uppercase border cursor-pointer transition-colors flex items-center gap-1 ${
                          selectedPlayer.status === 'muted'
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-700 hover:bg-emerald-900'
                            : 'bg-amber-950 text-amber-400 border-amber-700 hover:bg-amber-900'
                        }`}
                      >
                        <VolumeX size={11} />
                        {selectedPlayer.status === 'muted' ? 'Desmutear' : 'Mute Chat'}
                      </button>

                      <button
                        onClick={handleResetAvatar}
                        className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-cyan-300 rounded text-[8.5px] font-mono font-bold uppercase cursor-pointer transition-colors flex items-center gap-1"
                      >
                        <RotateCcw size={11} />
                        Reset Avatar
                      </button>
                    </div>
                  </div>

                  {/* 📊 BALANCES (4 CUADRANTES) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-black/50 p-3 rounded-lg border border-zinc-900 space-y-2">
                      <span className="text-[8.5px] text-zinc-500 font-bold uppercase tracking-widest block border-b border-zinc-900 pb-1 flex items-center gap-1"><Database size={11} /> Recursos Core de Extracción</span>
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div><span className="text-zinc-500 block text-[8px]">METAL_BALANCE:</span> <span className="text-zinc-200 font-bold">{selectedPlayer.metal_balance.toLocaleString()}</span></div>
                        <div><span className="text-cyan-500 block text-[8px]">CRYSTAL_BALANCE:</span> <span className="text-cyan-400 font-bold">{selectedPlayer.crystal_balance.toLocaleString()}</span></div>
                        <div><span className="text-amber-500 block text-[8px]">DEUTERIUM_BALANCE:</span> <span className="text-amber-400 font-bold">{selectedPlayer.deuterium_balance.toLocaleString()}</span></div>
                        <div><span className="text-purple-500 block text-[8px]">DARK_MATTER_BALANCE:</span> <span className="text-purple-400 font-bold">{selectedPlayer.dark_matter_balance.toLocaleString()}</span></div>
                      </div>
                    </div>

                    <div className="bg-black/50 p-3 rounded-lg border border-zinc-900 space-y-2">
                      <span className="text-[8.5px] text-yellow-500 font-bold uppercase tracking-widest block border-b border-zinc-900 pb-1 flex items-center gap-1"><Coins size={11} /> Divisas y Monedas del Ledger</span>
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div><span className="text-yellow-500 block text-[8px]">GD_BALANCE:</span> <span className="text-yellow-400 font-bold">{selectedPlayer.gd_balance.toLocaleString()}</span></div>
                        <div><span className="text-emerald-500 block text-[8px]">PHANTOM_COINS:</span> <span className="text-emerald-400 font-bold">{selectedPlayer.phantom_coins_balance.toLocaleString()}</span></div>
                        <div><span className="text-zinc-500 block text-[8px]">GD_COIN (RAW):</span> <span className="text-zinc-300">{selectedPlayer.gd_coin}</span></div>
                        <div><span className="text-zinc-500 block text-[8px]">PHANTOM (RAW):</span> <span className="text-zinc-300">{selectedPlayer.phantom_coin}</span></div>
                      </div>
                    </div>

                    <div className="bg-black/50 p-3 rounded-lg border border-zinc-900 space-y-2">
                      <span className="text-[8.5px] text-cyan-400 font-bold uppercase tracking-widest block border-b border-zinc-900 pb-1 flex items-center gap-1"><Layers size={11} /> Aleaciones Estructurales Semilla</span>
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div><span className="text-zinc-500 block text-[8px]">OMNIPLATE:</span> <span className="text-zinc-300">{selectedPlayer.omniplate}</span></div>
                        <div><span className="text-zinc-500 block text-[8px]">ORICHALTRON:</span> <span className="text-zinc-300">{selectedPlayer.orichaltron}</span></div>
                        <div><span className="text-zinc-500 block text-[8px]">LUNAR_FIBER:</span> <span className="text-zinc-300">{selectedPlayer.lunar_fiber}</span></div>
                        <div><span className="text-red-400 block text-[8px]">INFINITE_CORE:</span> <span className="text-red-400 font-bold">{selectedPlayer.infinite_core}</span></div>
                      </div>
                    </div>

                    <div className="bg-black/50 p-3 rounded-lg border border-zinc-900 space-y-2">
                      <span className="text-[8.5px] text-purple-400 font-bold uppercase tracking-widest block border-b border-zinc-900 pb-1 flex items-center gap-1"><Zap size={11} /> Frecuencias Cuánticas y Eventos</span>
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div><span className="text-purple-400 block text-[8px]">PRIMAL_TOKEN:</span> <span className="text-purple-300">{selectedPlayer.primal_token}</span></div>
                        <div><span className="text-fuchsia-400 block text-[8px]">XENOPLASM:</span> <span className="text-fuchsia-300">{selectedPlayer.xenoplasm}</span></div>
                        <div><span className="text-emerald-400 block text-[8px]">ORGANIUM:</span> <span className="text-emerald-300">{selectedPlayer.organium}</span></div>
                        <div><span className="text-cyan-400 block text-[8px]">MANA / ENERGY:</span> <span className="text-cyan-300">{selectedPlayer.mana}</span></div>
                      </div>
                    </div>
                  </div>

                  {/* 📦 🛰️ COMPONENTE: INVENTARIO Y HANGAR EN ÓRBITA SEGMENTADO POR PESTAÑAS */}
                  <div className="bg-zinc-900/20 p-4 border border-zinc-900 rounded-xl space-y-4">

                    {/* CABECERA Y ACCIÓN DE RECARGA */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-zinc-900 pb-2.5">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                          🛸 EQUIPAMIENTO E INVENTARIO EN VIVO DEL PILOTO
                        </span>
                        <p className="text-[9.5px] text-zinc-500 font-sans">Gestión, auditoría y desintegración atómica de instancias en Supabase.</p>
                      </div>
                      <button
                        onClick={() => { fetchPlayerAssets(selectedPlayer.id); setAssetSearchTerm(''); }}
                        className="text-zinc-500 hover:text-white flex items-center gap-1 text-[10px] bg-zinc-950 px-2 py-1 border border-zinc-900 rounded cursor-pointer transition-colors"
                      >
                        <RefreshCw size={10} className={loadingAssets ? "animate-spin text-cyan-400" : ""} /> Recargar Hangar
                      </button>
                    </div>

                    {/* BARRA TÁCTICA: SUB-PESTAÑAS DE ASSETS CON CONTADORES DINÁMICOS */}
                    <div className="flex flex-wrap gap-1 bg-black/40 p-1 rounded-lg border border-zinc-900/60 select-none">
                      {[
                        { id: 'ships', label: '🚀 Naves', count: playerAssets.ships.length, color: 'border-cyan-500 text-cyan-400 bg-cyan-950/10' },
                        { id: 'structures', label: '🏢 Estructuras', count: playerAssets.structures.length, color: 'border-amber-500 text-amber-400 bg-amber-950/10' },
                        { id: 'technologies', label: '🔬 Tecnologías', count: playerAssets.technologies.length, color: 'border-purple-500 text-purple-400 bg-purple-950/10' },
                        { id: 'astrobots', label: '🤖 Astrobots', count: playerAssets.astrobots.length, color: 'border-emerald-500 text-emerald-400 bg-emerald-500/10' },
                        { id: 'tools', label: '🔧 Tools', count: playerAssets.tools.length, color: 'border-blue-500 text-blue-400 bg-blue-500/10' },
                        { id: 'licenses', label: '📜 Licencias', count: playerAssets.licenses.length, color: 'border-yellow-500 text-yellow-400 bg-yellow-500/10' }
                      ].map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => { setActiveAssetTab(tab.id); setAssetSearchTerm(''); }}
                          className={`px-3 py-1.5 font-bold uppercase text-[9.5px] tracking-wider rounded transition-all border cursor-pointer ${
                            activeAssetTab === tab.id
                              ? `${tab.color} border-zinc-800`
                              : 'border-transparent text-zinc-500 hover:text-zinc-400 hover:bg-zinc-900/30'
                          }`}
                        >
                          {tab.label} <span className="opacity-40 font-normal">({tab.count})</span>
                        </button>
                      ))}
                    </div>

                    {/* BUSCADOR FILTRADO INTERNO */}
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-zinc-600" />
                      <input
                        type="text"
                        placeholder={`Buscar en ${activeAssetTab}...`}
                        className="w-full bg-zinc-950 border border-zinc-900 pl-8 pr-3 py-1.5 rounded font-mono text-zinc-300 outline-none text-[10.5px] focus:border-zinc-800 transition-colors uppercase"
                        value={assetSearchTerm}
                        onChange={e => setAssetSearchTerm(e.target.value)}
                      />
                    </div>

                    {/* VENTANA DE CONTENEDORES CONDICIONALES */}
                    <div className="max-h-60 overflow-y-auto pr-1 font-mono text-[11px]">

                      {/* PESTAÑA: NAVES */}
                      {activeAssetTab === 'ships' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {playerAssets.ships.filter((s: any) => (s.ship_id || '').toLowerCase().includes(assetSearchTerm.toLowerCase())).length > 0 ? (
                            playerAssets.ships
                              .filter((s: any) => (s.ship_id || '').toLowerCase().includes(assetSearchTerm.toLowerCase()))
                              .map((ship: any) => (
                                <div key={ship.id} className="p-2.5 bg-zinc-950 border border-zinc-900 rounded-lg flex justify-between items-center hover:border-zinc-800 transition-all">
                                  <div>
                                    <span className="font-bold text-white block truncate max-w-[180px]">
                                      {ship.custom_name || ship.name_ship || ship.ship_id || "Nave sin nombre"}
                                    </span>
                                    <span className="text-[8.5px] text-zinc-500">Estado: <strong className="text-emerald-500 font-normal">{ship.flight_state || 'IDLE'}</strong></span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="px-1.5 py-0.5 bg-cyan-950/40 text-cyan-400 border border-cyan-900/60 rounded text-[9px] font-black">LVL {ship.level || 1}</span>
                                    <button onClick={() => handleDeleteEntity('user_ships', ship.id)} className="text-zinc-600 hover:text-red-400 p-1.5 rounded hover:bg-zinc-900 transition-colors cursor-pointer" title="Desintegrar Nave"><Trash2 size={12} /></button>
                                  </div>
                                </div>
                              ))
                          ) : (
                            <div className="col-span-2 text-center py-6 text-zinc-600 italic">No se detectaron naves en este registro.</div>
                          )}
                        </div>
                      )}

                      {/* PESTAÑA: ESTRUCTURAS */}
                      {activeAssetTab === 'structures' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {playerAssets.structures.filter((s: any) => (s.building_id || s.structure_id || '').toLowerCase().includes(assetSearchTerm.toLowerCase())).length > 0 ? (
                            playerAssets.structures
                              .filter((s: any) => (s.building_id || s.structure_id || '').toLowerCase().includes(assetSearchTerm.toLowerCase()))
                              .map((struct: any) => (
                                <div key={struct.id} className="p-2.5 bg-zinc-950 border border-zinc-900 rounded-lg flex justify-between items-center hover:border-zinc-800 transition-all">
                                  <span className="font-bold text-zinc-200 truncate max-w-[180px]" title={struct.building_id || struct.structure_id}>{struct.building_id || struct.structure_id}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="px-1.5 py-0.5 bg-amber-950/40 text-amber-400 border border-amber-900/60 rounded text-[9px] font-black">LVL {struct.level || 1}</span>
                                    <button onClick={() => handleDeleteEntity('user_structures', struct.id)} className="text-zinc-600 hover:text-red-400 p-1.5 rounded hover:bg-zinc-900 transition-colors cursor-pointer" title="Derribar Estructura"><Trash2 size={12} /></button>
                                  </div>
                                </div>
                              ))
                          ) : (
                            <div className="col-span-2 text-center py-6 text-zinc-600 italic">No se detectaron estructuras en este registro.</div>
                          )}
                        </div>
                      )}

                      {/* PESTAÑA: TECNOLOGÍAS */}
                      {activeAssetTab === 'technologies' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {playerAssets.technologies.filter((s: any) => (s.technology_id || '').toLowerCase().includes(assetSearchTerm.toLowerCase())).length > 0 ? (
                            playerAssets.technologies
                              .filter((s: any) => (s.technology_id || '').toLowerCase().includes(assetSearchTerm.toLowerCase()))
                              .map((tech: any) => (
                                <div key={tech.id} className="p-2.5 bg-zinc-950 border border-zinc-900 rounded-lg flex justify-between items-center hover:border-zinc-800 transition-all">
                                  <span className="font-bold text-zinc-200 truncate max-w-[180px]" title={tech.technology_id}>{tech.technology_id}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="px-1.5 py-0.5 bg-purple-950/40 text-purple-400 border border-purple-900/60 rounded text-[9px] font-black">LVL {tech.level || 1}</span>
                                    <button onClick={() => handleDeleteEntity('user_technologies', tech.id)} className="text-zinc-600 hover:text-red-400 p-1.5 rounded hover:bg-zinc-900 transition-colors cursor-pointer" title="Remover Conocimiento"><Trash2 size={12} /></button>
                                  </div>
                                </div>
                              ))
                          ) : (
                            <div className="col-span-2 text-center py-6 text-zinc-600 italic">No se detectaron tecnologías en este registro.</div>
                          )}
                        </div>
                      )}

                      {/* PESTAÑA: ASTROBOTS */}
                      {activeAssetTab === 'astrobots' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {playerAssets.astrobots.filter((s: any) => (s.astrobot_id || '').toLowerCase().includes(assetSearchTerm.toLowerCase())).length > 0 ? (
                            playerAssets.astrobots
                              .filter((s: any) => (s.astrobot_id || '').toLowerCase().includes(assetSearchTerm.toLowerCase()))
                              .map((astro: any) => (
                                <div key={astro.id} className="p-2.5 bg-zinc-950 border border-zinc-900 rounded-lg flex justify-between items-center hover:border-zinc-800 transition-all">
                                  <span className="font-bold text-zinc-200 truncate max-w-[180px]" title={astro.astrobot_id}>{astro.astrobot_id}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="px-1.5 py-0.5 bg-emerald-950/40 text-emerald-400 border border-emerald-900/60 rounded text-[9px] font-black">LVL {astro.level || 1}</span>
                                    <button onClick={() => handleDeleteEntity('user_astrobots', astro.id)} className="text-zinc-600 hover:text-red-400 p-1.5 rounded hover:bg-zinc-900 transition-colors cursor-pointer" title="Desactivar Astrobot"><Trash2 size={12} /></button>
                                  </div>
                                </div>
                              ))
                          ) : (
                            <div className="col-span-2 text-center py-6 text-zinc-600 italic">No se detectaron astrobots en este registro.</div>
                          )}
                        </div>
                      )}

                      {/* PESTAÑA: TOOLS */}
                      {activeAssetTab === 'tools' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {playerAssets.tools.filter((s: any) => (s.tool_id || '').toLowerCase().includes(assetSearchTerm.toLowerCase())).length > 0 ? (
                            playerAssets.tools
                              .filter((s: any) => (s.tool_id || '').toLowerCase().includes(assetSearchTerm.toLowerCase()))
                              .map((tool: any) => (
                                <div key={tool.id} className="p-2.5 bg-zinc-950 border border-zinc-900 rounded-lg flex justify-between items-center hover:border-zinc-800 transition-all">
                                  <span className="font-bold text-zinc-200 truncate max-w-[180px]" title={tool.tool_id}>{tool.tool_id}</span>
                                  <div className="flex items-center gap-2">
                                    <button onClick={() => handleDeleteEntity('user_tools', tool.id)} className="text-zinc-600 hover:text-red-400 p-1.5 rounded hover:bg-zinc-900 transition-colors cursor-pointer" title="Eliminar Herramienta"><Trash2 size={12} /></button>
                                  </div>
                                </div>
                              ))
                          ) : (
                            <div className="col-span-2 text-center py-6 text-zinc-600 italic">No se detectaron herramientas en este registro.</div>
                          )}
                        </div>
                      )}

                      {/* PESTAÑA: LICENCIAS */}
                      {activeAssetTab === 'licenses' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {playerAssets.licenses.filter((s: any) => (s.license_id || '').toLowerCase().includes(assetSearchTerm.toLowerCase())).length > 0 ? (
                            playerAssets.licenses
                              .filter((s: any) => (s.license_id || '').toLowerCase().includes(assetSearchTerm.toLowerCase()))
                              .map((lic: any) => (
                                <div key={lic.id} className="p-2.5 bg-zinc-950 border border-zinc-900 rounded-lg flex justify-between items-center hover:border-zinc-800 transition-all">
                                  <span className="font-bold text-zinc-200 truncate max-w-[180px]" title={lic.license_id}>{lic.license_id}</span>
                                  <div className="flex items-center gap-2">
                                    <button onClick={() => handleDeleteEntity('user_licenses', lic.id)} className="text-zinc-600 hover:text-red-400 p-1.5 rounded hover:bg-zinc-900 transition-colors cursor-pointer" title="Revocar Licencia"><Trash2 size={12} /></button>
                                  </div>
                                </div>
                              ))
                          ) : (
                            <div className="col-span-2 text-center py-6 text-zinc-600 italic">No se detectaron licencias en este registro.</div>
                          )}
                        </div>
                      )}

                    </div>
                  </div>

                  {/* 🧪 INYECTOR FINANCIERO */}
                  <div className="bg-zinc-900/30 p-3 border border-zinc-900 rounded-xl space-y-3">
                    <span className="text-[9px] text-zinc-400 font-bold uppercase block tracking-wider flex items-center gap-1"><ShieldAlert size={12} className="text-red-500" /> INYECTOR MAESTRO DE ASSETS EN CALIENTE</span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <select className="bg-zinc-950 border border-zinc-800 p-2 rounded text-zinc-300 outline-none text-[11px] cursor-pointer" value={injectType} onChange={e => setInjectType(e.target.value)}>
                        <option value="metal_balance">Metal Puro (Recurso Core)</option>
                        <option value="crystal_balance">Cristal Estelar (Recurso Core)</option>
                        <option value="deuterium_balance">Deuterio (Recurso Core)</option>
                        <option value="dark_matter_balance">Materia Oscura (Recurso Core)</option>
                        <option value="gd_balance">Galaxy Dust Coins (GD Balance)</option>
                        <option value="phantom_coins_balance">Phantom Coins (PH Balance)</option>
                        <option value="gd_coin">GD Coin (Raw Divisa)</option>
                        <option value="phantom_coin">Phantom Coin (Raw Divisa)</option>
                        <option value="omniplate">Omniplate (Aleación)</option>
                        <option value="orichaltron">Orichaltron (Aleación)</option>
                        <option value="lunar_fiber">Lunar Fiber (Componente)</option>
                        <option value="infinite_core">Infinite Core (Plano Core)</option>
                        <option value="primal_token">Primal Token (Esencia)</option>
                        <option value="xenoplasm">Xenoplasm (Muestra de Evento)</option>
                        <option value="organium">Organium (Biomasa)</option>
                        <option value="mana">Mana / Energy (Frecuencia)</option>
                      </select>
                      <input type="number" placeholder="Cantidad..." className="bg-zinc-950 border border-zinc-800 p-2 rounded font-bold text-emerald-400 outline-none text-[11px]" value={injectAmount || ''} onChange={e => setInjectAmount(Number(e.target.value))} />
                      <button onClick={handleLiveAssetInjection} className="bg-cyan-600 hover:bg-cyan-500 text-white font-black uppercase rounded flex items-center justify-center gap-1.5 transition-all text-[10px] cursor-pointer shadow-lg shadow-cyan-950/40"><Zap size={12} /> Ejecutar Inyección</button>
                    </div>
                  </div>

                  {/* 🚀 INYECTOR DE INSTANCIAS (CON PREDICTOR) */}
                  <div className="bg-zinc-900/30 p-3 border border-zinc-900 rounded-xl space-y-3 relative">
                    <span className="text-[9px] text-cyan-400 font-bold uppercase block tracking-wider flex items-center gap-1">
                      🚀 INYECTOR DE INSTANCIAS Y ENTIDADES (BLUEPRINTS CON PREDICTOR)
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-start">
                      <select className="bg-zinc-950 border border-zinc-800 p-2 rounded text-zinc-300 outline-none text-[11px] cursor-pointer" value={entityGroup} onChange={e => { setEntityGroup(e.target.value); setBlueprintId(''); }}>
                        {Object.entries(categoryMap).map(([key, value]) => (
                          <option key={key} value={key}>{value.label}</option>
                        ))}
                      </select>

                      <div className="md:col-span-2 relative">
                        <input type="text" placeholder="Escribe para buscar en el catálogo semilla..." className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded text-zinc-300 outline-none text-[11px] uppercase" value={blueprintId} onFocus={() => setShowSuggestions(true)} onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} onChange={e => { setBlueprintId(e.target.value); setShowSuggestions(true); }} />
                        {showSuggestions && blueprintId && filteredSuggestions.length > 0 && (
                          <div className="absolute left-0 right-0 top-full mt-1 bg-zinc-950 border border-zinc-800 rounded-md shadow-2xl z-50 max-h-48 overflow-y-auto divide-y divide-zinc-900/80 text-[11px]">
                            {filteredSuggestions.map(s => (
                              <div key={s.id} className="p-2 hover:bg-cyan-950/40 hover:text-cyan-400 cursor-pointer flex justify-between items-center" onMouseDown={() => { setBlueprintId(s.id); setShowSuggestions(false); }}>
                                <span className="font-bold text-zinc-200">{s.name}</span>
                                <span className="text-[9px] text-zinc-500 bg-black/40 px-1 rounded select-all">{s.id}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-1.5">
                        <input type="number" min="1" placeholder="Lvl" className="w-14 bg-zinc-950 border border-zinc-800 p-2 rounded text-center font-bold text-white outline-none text-[11px]" value={entityLevel} onChange={e => setEntityLevel(Number(e.target.value))} />
                        <button onClick={handleLiveEntityInjection} className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-black uppercase rounded text-[10px] tracking-wider transition-all cursor-pointer shadow-lg shadow-cyan-950/40">Inyectar Ítem</button>
                      </div>
                    </div>
                  </div>

                  {/* BOTTOM PRIVILEGES */}
                  <div className="pt-3 border-t border-zinc-900 flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <span className="text-zinc-500 text-[9px] uppercase font-bold">Rango Actual:</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-black ${selectedPlayer.is_admin ? 'bg-red-500/10 text-red-400' : 'bg-zinc-800 text-zinc-400'}`}>{selectedPlayer.role}</span>
                    </div>
                    <div className="w-[1px] h-4 bg-zinc-800"></div>
                    <button onClick={async () => {
                      if (!window.confirm(`¿Alterar rango root de ${selectedPlayer.username}?`)) return;
                      const { error } = await supabase.from('user_profiles').update({ is_admin: !selectedPlayer.is_admin }).or(`id.eq.${selectedPlayer.id},user_id.eq.${selectedPlayer.id}`);
                      if (error) alert(error.message);
                      else { alert("¡Rango modificado con éxito!"); fetchPlayers(); setSelectedPlayer(null); }
                    }} className="text-zinc-400 hover:text-white underline text-[10px] cursor-pointer">Alternar Privilegios Root</button>
                  </div>

                </div>
              ) : (
                <div className="h-full border border-zinc-900 border-dashed rounded-xl flex flex-col items-center justify-center p-12 text-center bg-zinc-950/20">
                  <Shield size={24} className="text-zinc-800 mb-3 animate-pulse" />
                  <p className="text-zinc-600 max-w-xs text-xs">Selecciona un comandante de la lista izquierda para expandir su matriz completa de assets y desplegar la consola de inyección.</p>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* DASHBOARD GENERAL */}
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
                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">Masa Circulante GD Coins</span>
                <div className="text-2xl font-black text-yellow-500">{totalGDCirculating.toLocaleString()} <span className="text-xs text-zinc-600 font-normal">GD</span></div>
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