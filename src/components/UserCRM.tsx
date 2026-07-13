import React, { useEffect, useState } from 'react';
import { getSupabaseClient } from '../lib/supabase';
import { Shield, Search, Users, Coins, Database, ShieldAlert, Zap, Layers, CheckSquare, Square, Eye, Trash2, RefreshCw } from 'lucide-react';

interface PlayerProfile {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'player';
  status: 'active' | 'banned';
  created_at: string;
  wallet_address: string;
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
  const [playerAssets, setPlayerAssets] = useState<{ ships: any[], structures: any[], technologies: any[], astrobots: any[] }>({
    ships: [], structures: [], technologies: [], astrobots: []
  });
  const [loadingAssets, setLoadingAssets] = useState<boolean>(false);

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
        const mapped: PlayerProfile[] = data.map((row: any) => ({
          id: row.user_id,
          username: row.wallet_address ? `${row.wallet_address.slice(0, 6)}...${row.wallet_address.slice(-4)}` : 'Explorador',
          email: `UID: ${row.user_id.substring(0, 8).toUpperCase()}`,
          role: row.is_admin ? 'admin' : 'player',
          status: 'active',
          created_at: row.created_at,
          wallet_address: row.wallet_address || '',
          can_level: row.can_level || 1,
          can_xp: Number(row.can_xp) || 0,
          metal_balance: Number(row.metal_balance) || 0,
          crystal_balance: Number(row.crystal_balance) || 0,
          deuterium_balance: Number(row.deuterium_balance) || 0,
          dark_matter_balance: Number(row.dark_matter_balance) || 0,
          gd_balance: Number(row.gd_balance) || 0,
          phantom_coins_balance: Number(row.phantom_coins_balance) || 0,
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
        }));
        setPlayers(mapped);
      }
    } catch (e: any) {
      console.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── 📡 EXTRACTOR DE ASSETS FÍSICOS REALES EN SUPABASE ──
  const fetchPlayerAssets = async (userId: string) => {
    if (!supabase) return;
    try {
      setLoadingAssets(true);
      const [shipsRes, structsRes, techsRes, astroRes] = await Promise.all([
        supabase.from('user_ships').select('*').eq('user_id', userId),
        supabase.from('user_structures').select('*').eq('user_id', userId),
        supabase.from('user_technologies').select('*').eq('user_id', userId),
        supabase.from('user_astrobots').select('*').eq('user_id', userId),
      ]);

      setPlayerAssets({
        ships: shipsRes.data || [],
        structures: structsRes.data || [],
        technologies: techsRes.data || [],
        astrobots: astroRes.data || []
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
            const actualName = row.name || row.title || actualId;
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
      const { error } = await supabase.from('user_profiles').update({ [injectType]: newVal }).eq('user_id', selectedPlayer.id);
      if (error) throw error;
      alert(`⚡ Inyección Exitosa: +${injectAmount} agregados a ${injectType}`);
      fetchPlayers();
      setSelectedPlayer(null);
    } catch (e: any) {
      alert(`Error: ${e.message}`);
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
      const insertPayload: any = {
        user_id: selectedPlayer.id,
        [config.idColumn]: blueprintId.trim(),
        level: Number(entityLevel)
      };
      const { error } = await supabase.from(config.targetTable).insert([insertPayload]);
      if (error) throw error;
      alert(`🚀 TRANSMISIÓN COMPLETADA: Instancia de [${blueprintId}] inyectada con éxito.`);
      setBlueprintId('');
      setShowSuggestions(false);
      fetchPlayerAssets(selectedPlayer.id); // 🔥 Recarga el hangar en pantalla automáticamente
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

  // ── 4. MOTOR EN LOTE ──
  const handleApplyBulkChanges = async () => {
    if (bulkSelectedIds.length === 0) return;
    try {
      const updatePayload: any = { can_level: Number(bulkLevel) };
      if (bulkRole !== 'no_change') updatePayload.is_admin = bulkRole === 'admin';
      const { error } = await supabase.from('user_profiles').update(updatePayload).in('user_id', bulkSelectedIds);
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
    p.id.toLowerCase().includes(searchTerm.toLowerCase()) || p.wallet_address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSuggestions = allSeeds.filter(s =>
    s.id.toLowerCase().includes(blueprintId.toLowerCase()) || s.name.toLowerCase().includes(blueprintId.toLowerCase())
  ).slice(0, 5);

  const totalCommanders = players.length;
  const totalGDCirculating = players.reduce((acc, p) => acc + p.gd_balance, 0);
  const totalMetalCirculating = players.reduce((acc, p) => acc + p.metal_balance, 0);

  return (
    <div className="space-y-6 font-mono text-xs">

      {/* NAVEGACIÓN SUB-PESTAÑAS */}
      <div className="flex border-b border-zinc-800 gap-2 select-none">
        <button onClick={() => setActiveSubTab('crm_central')} className={`px-4 py-2.5 font-bold uppercase tracking-wider transition-all border-b-2 ${activeSubTab === 'crm_central' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}>
          🛰️ CRM Central de Pilotos
        </button>
        <button onClick={() => setActiveSubTab('general_dashboard')} className={`px-4 py-2.5 font-bold uppercase tracking-wider transition-all border-b-2 ${activeSubTab === 'general_dashboard' ? 'border-purple-500 text-purple-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}>
          📊 Dashboard General de Operaciones
        </button>
      </div>

      {activeSubTab === 'crm_central' && (
        <div className="space-y-4">

          {/* CONSOLE SUPERIOR */}
          <div className="bg-zinc-950 p-4 border border-zinc-900 rounded-xl space-y-3">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <span className="text-zinc-500 text-[10px] uppercase font-bold">Consola Táctica Perimetral</span>
              <input type="text" placeholder="Filtrar por UID o Wallet..." className="bg-zinc-900 border border-zinc-800 text-zinc-200 px-3 py-1.5 rounded text-xs outline-none focus:border-cyan-500 w-full md:w-64" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>

            {bulkSelectedIds.length > 0 && (
              <div className="pt-3 border-t border-zinc-900/60 flex flex-col md:flex-row items-center justify-between gap-3 bg-red-950/10 p-3 rounded border border-red-500/20 animate-fadeIn">
                <span className="text-red-400 font-bold text-[10px] uppercase">⚡ MODIFICACIÓN EN LOTE: {bulkSelectedIds.length} PILOTOS SELECCIONADOS</span>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-500 text-[9px]">Nivel CAN:</span>
                    <input type="number" min="1" className="bg-zinc-900 border border-zinc-800 p-1 rounded w-14 text-center text-white font-bold" value={bulkLevel} onChange={e => setBulkLevel(Number(e.target.value))} />
                  </div>
                  <select className="bg-zinc-900 border border-zinc-800 p-1 rounded text-zinc-300 outline-none" value={bulkRole} onChange={e => setBulkRole(e.target.value)}>
                    <option value="no_change">No alterar Rango</option>
                    <option value="player">Degradar a PLAYER</option>
                    <option value="admin">Promover a ADMIN</option>
                  </select>
                  <button onClick={handleApplyBulkChanges} className="bg-red-600 hover:bg-red-500 text-white font-black px-3 py-1 rounded text-[10px] uppercase tracking-wider transition-colors">Ejecutar Cambios masivos</button>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">

            {/* LADO IZQUIERDO */}
            <div className="xl:col-span-1 bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden">
              <table className="min-w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-900 bg-zinc-900/40 text-zinc-500 text-[10px] font-bold">
                    <th className="p-3 w-10 text-center">
                      <button onClick={toggleSelectAll} className="text-zinc-500 hover:text-white transition-colors">
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
                        <button onClick={() => toggleSelectRow(p.id)} className="text-zinc-600 hover:text-white">
                          {bulkSelectedIds.includes(p.id) ? <CheckSquare size={14} className="text-cyan-400" /> : <Square size={14} />}
                        </button>
                      </td>
                      <td className="p-3">
                        <div className="text-white font-sans font-bold text-xs select-all">{p.wallet_address}</div>
                        <div className="text-[9px] text-zinc-500 tracking-tight font-mono truncate max-w-[155px]">{p.id}</div>
                      </td>
                      <td className="p-3 text-right">
                        <button className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded font-bold text-cyan-400 hover:bg-zinc-850 flex items-center gap-1 ml-auto text-[10px]"><Eye size={11} /> Auditar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* LADO DERECHO EXPANSIVO */}
            <div className="xl:col-span-2 space-y-4">
              {selectedPlayer ? (
                <div className="bg-zinc-950 p-4 border border-zinc-900 rounded-xl space-y-5 shadow-xl animate-fadeIn">

                  {/* HEADER */}
                  <div className="border-b border-zinc-900 pb-2 flex justify-between items-center">
                    <div>
                      <h3 className="text-white font-bold text-sm tracking-wide">MATRIZ DE BALANCE: {selectedPlayer.wallet_address}</h3>
                      <span className="text-[9px] text-zinc-500 font-mono">UUID: {selectedPlayer.id}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[9px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold font-mono">CAN Lvl {selectedPlayer.can_level}</span>
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

                  {/* 📦 🔥 NUEVA SECCIÓN: INVENTARIO Y HANGAR EN ÓRBITA EN VIVO ── */}
                  <div className="bg-zinc-900/20 p-4 border border-zinc-900 rounded-xl space-y-3">
                    <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                      <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                        🛸 EQUIPAMIENTO E INVENTARIO EN VIVO DEL PILOTO
                      </span>
                      <button onClick={() => fetchPlayerAssets(selectedPlayer.id)} className="text-zinc-500 hover:text-white flex items-center gap-1 text-[10px] cursor-pointer">
                        <RefreshCw size={10} className={loadingAssets ? "animate-spin" : ""} /> Recargar Hangar
                      </button>
                    </div>

                    <div className="space-y-4 max-h-56 overflow-y-auto pr-1">
                      {/* SUB-REJILLA: NAVES */}
                      {playerAssets.ships.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[9px] text-zinc-500 font-bold uppercase">🚀 Naves en Hangar ({playerAssets.ships.length})</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {playerAssets.ships.map((ship) => (
                              <div key={ship.id} className="p-2 bg-zinc-950 border border-zinc-900 rounded flex justify-between items-center text-[10px]">
                                <div>
                                  <span className="font-bold text-zinc-200 block truncate">{ship.ship_id}</span>
                                  <span className="text-[8px] text-zinc-500">Estado: <strong className="text-emerald-500 font-normal">{ship.flight_state}</strong></span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="px-1.5 py-0.5 bg-cyan-950/40 text-cyan-400 border border-cyan-900 rounded text-[9px] font-bold">Lvl {ship.level}</span>
                                  <button onClick={() => handleDeleteEntity('user_ships', ship.id)} className="text-zinc-600 hover:text-red-400 p-1 transition-colors cursor-pointer" title="Desintegrar Nave"><Trash2 size={12} /></button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* SUB-REJILLA: ESTRUCTURAS */}
                      {playerAssets.structures.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[9px] text-zinc-500 font-bold uppercase">🏢 Complejos y Estructuras ({playerAssets.structures.length})</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {playerAssets.structures.map((struct) => (
                              <div key={struct.id} className="p-2 bg-zinc-950 border border-zinc-900 rounded flex justify-between items-center text-[10px]">
                                <span className="font-bold text-zinc-200 truncate">{struct.building_id || struct.structure_id}</span>
                                <div className="flex items-center gap-2">
                                  <span className="px-1.5 py-0.5 bg-amber-950/40 text-amber-400 border border-amber-900 rounded text-[9px] font-bold">Lvl {struct.level}</span>
                                  <button onClick={() => handleDeleteEntity('user_structures', struct.id)} className="text-zinc-600 hover:text-red-400 p-1 transition-colors cursor-pointer" title="Derribar Estructura"><Trash2 size={12} /></button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* SUB-REJILLA: TECNOLOGÍAS */}
                      {playerAssets.technologies.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[9px] text-zinc-500 font-bold uppercase">🔬 Árbol de Tecnologías ({playerAssets.technologies.length})</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {playerAssets.technologies.map((tech) => (
                              <div key={tech.id} className="p-2 bg-zinc-950 border border-zinc-900 rounded flex justify-between items-center text-[10px]">
                                <span className="font-bold text-zinc-200 truncate">{tech.technology_id}</span>
                                <div className="flex items-center gap-2">
                                  <span className="px-1.5 py-0.5 bg-purple-950/40 text-purple-400 border border-purple-900 rounded text-[9px] font-bold">Lvl {tech.level}</span>
                                  <button onClick={() => handleDeleteEntity('user_technologies', tech.id)} className="text-zinc-600 hover:text-red-400 p-1 transition-colors cursor-pointer" title="Remover Tecnología"><Trash2 size={12} /></button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* FALLBACK SI ESTÁ VACÍO */}
                      {playerAssets.ships.length === 0 && playerAssets.structures.length === 0 && playerAssets.technologies.length === 0 && (
                        <div className="text-center p-3 text-zinc-600 italic text-[11px]">
                          — El hangar de este comandante se encuentra completamente vacío en este cuadrante —
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 🧪 INYECTOR FINANCIERO */}
                  <div className="bg-zinc-900/30 p-3 border border-zinc-900 rounded-xl space-y-3">
                    <span className="text-[9px] text-zinc-400 font-bold uppercase block tracking-wider flex items-center gap-1"><ShieldAlert size={12} className="text-red-500" /> INYECTOR MAESTRO DE ASSETS EN CALIENTE</span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <select className="bg-zinc-950 border border-zinc-800 p-2 rounded text-zinc-300 outline-none text-[11px]" value={injectType} onChange={e => setInjectType(e.target.value)}>
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
                      <select className="bg-zinc-950 border border-zinc-800 p-2 rounded text-zinc-300 outline-none text-[11px]" value={entityGroup} onChange={e => { setEntityGroup(e.target.value); setBlueprintId(''); }}>
                        {Object.entries(categoryMap).map(([key, value]) => (
                          <option key={key} value={key}>{value.label}</option>
                        ))}
                      </select>

                      <div className="md:col-span-2 relative">
                        <input type="text" placeholder="Escribe para buscar en el catálogo semilla..." className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded text-zinc-300 outline-none text-[11px]" value={blueprintId} onFocus={() => setShowSuggestions(true)} onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} onChange={e => { setBlueprintId(e.target.value); setShowSuggestions(true); }} />
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
                      if (!window.confirm(`¿Alterar rango root?`)) return;
                      const { error } = await supabase.from('user_profiles').update({ is_admin: !selectedPlayer.is_admin }).eq('user_id', selectedPlayer.id);
                      if (error) alert(error.message);
                      else { alert("¡Rango modificado!"); fetchPlayers(); setSelectedPlayer(null); }
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