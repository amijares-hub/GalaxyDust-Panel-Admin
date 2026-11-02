import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, Wrench, Sparkles, Ticket, Zap, Search, Plus, Trash2, 
  RefreshCw, Layers, Send, Database, ShieldAlert, CheckCircle2, UserCheck, X
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';

interface ExtendedUserProfile extends UserProfile {
  legacy_id?: number;
}

interface ConsumableCategoryConfig {
  id: string;
  label: string;
  table: string;
  idCol: string;
  icon: string;
  defaultUses?: number;
}

const CONSUMABLE_TABLES: ConsumableCategoryConfig[] = [
  { id: 'qmps', label: '⚡ Módulos QMP', table: 'user_qmps', idCol: 'id_qmp', icon: '⚡', defaultUses: 10 },
  { id: 'materialicers', label: '🔮 Materializadores', table: 'user_materialicers', idCol: 'id_materialicer', icon: '🔮', defaultUses: 1 },
  { id: 'repair_kits', label: '🧰 Kits de Reparación', table: 'user_repair_kits', idCol: 'id_kit', icon: '🧰' },
  { id: 'bags', label: '🎒 Bolsas de Recursos', table: 'user_bags', idCol: 'id_bag', icon: '🎒' },
  { id: 'tickets', label: '🎟️ Tickets de Evento', table: 'user_tickets', idCol: 'id_ticket', icon: '🎟️' },
  { id: 'packs', label: '📦 Packs Reclamables', table: 'user_packs', idCol: 'id_pack', icon: '📦' },
  { id: 'essentials', label: '✨ Ítems Esenciales', table: 'user_essentials', idCol: 'id_essential', icon: '✨' }
];

interface AdminConsumablesHubProps {
  setIsAlertToShow?: (alert: { show: boolean; status: 'success' | 'error' | 'warning'; message: string }) => void;
}

export const AdminConsumablesHub: React.FC<AdminConsumablesHubProps> = ({ setIsAlertToShow }) => {
  const [activeCategory, setActiveCategory] = useState<string>('qmps');
  const [globalCounts, setGlobalCounts] = useState<Record<string, number>>({});
  const [loadingStats, setLoadingStats] = useState<boolean>(true);

  // Piloto seleccionado
  const [pilotSearchQuery, setPilotSearchQuery] = useState<string>('');
  const [syncedPilot, setSyncedPilot] = useState<ExtendedUserProfile | null>(null);
  const [pilotItems, setPilotItems] = useState<any[]>([]);
  const [loadingPilotItems, setLoadingPilotItems] = useState<boolean>(false);

  // Parámetros de inyección
  const [injectItemId, setInjectItemId] = useState<number>(1);
  const [injectQuantity, setInjectQuantity] = useState<number>(1);
  const [injectUses, setInjectUses] = useState<number>(10);
  const [isInjecting, setIsInjecting] = useState<boolean>(false);

  const currentConfig = useMemo(() => {
    return CONSUMABLE_TABLES.find(c => c.id === activeCategory) || CONSUMABLE_TABLES[0];
  }, [activeCategory]);

  // Censo macroeconómico de los 85.000 consumibles en la base de datos
  const fetchGlobalStats = async () => {
    setLoadingStats(true);
    try {
      const counts: Record<string, number> = {};

      await Promise.all(
        CONSUMABLE_TABLES.map(async (c) => {
          const { count, error } = await supabase
            .from(c.table)
            .select('*', { count: 'exact', head: true });
          counts[c.id] = (!error && count !== null) ? count : 0;
        })
      );

      setGlobalCounts(counts);
    } catch (e: any) {
      console.error("Error al censar consumibles:", e.message);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchGlobalStats();
  }, []);

  // Búsqueda de piloto por UID, Legacy ID o Nombre
  const handleLinkPilot = async () => {
    if (!pilotSearchQuery.trim()) return;
    const query = pilotSearchQuery.trim();

    try {
      let matched: any = null;
      if (!isNaN(Number(query))) {
        const { data } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('legacy_id', Number(query))
          .maybeSingle();
        if (data) matched = data;
      }
      if (!matched) {
        const { data } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', query)
          .maybeSingle();
        if (data) matched = data;
      }
      if (!matched) {
        const { data } = await supabase
          .from('user_profiles')
          .select('*')
          .ilike('username', query)
          .maybeSingle();
        if (data) matched = data;
      }

      if (matched) {
        const mappedPilot: ExtendedUserProfile = {
          id: matched.id,
          legacy_id: matched.legacy_id ? Number(matched.legacy_id) : undefined,
          username: matched.username || `Piloto #${matched.legacy_id}`,
          email: matched.email || '',
          level: matched.can_level || 1,
          can_level: matched.can_level || 1,
          xp: matched.can_xp || 0,
          role: matched.role || 'user',
          status: matched.status || 'active',
          avatarUrl: matched.avatar_url || '',
          created_at: matched.created_at || '',
          last_active: matched.updated_at || '',
          inventory: [],
          metal: matched.metal_balance || 0,
          crystal: matched.crystal_balance || 0,
          deuterium: matched.deuterium_balance || 0,
          dark_matter: matched.dark_matter_balance || 0,
          gd_coins: matched.gd_balance || 0,
          phantom_coins: matched.phantom_coin || 0,
          omniplate: 0, orichaltron: 0, lunar_fiber: 0, infinity_core: 0,
          primal_token: 0, xenoplasm: 0, organium: 0, mana: 0
        };

        setSyncedPilot(mappedPilot);
        fetchPilotCategoryItems(mappedPilot, activeCategory);
      } else {
        if (setIsAlertToShow) {
          setIsAlertToShow({ show: true, status: 'error', message: 'Comandante no localizado en la base de datos.' });
        }
      }
    } catch (err: any) {
      if (setIsAlertToShow) setIsAlertToShow({ show: true, status: 'error', message: err.message });
    }
  };

  // Consulta dual para cargar los consumibles del piloto seleccionado
  const fetchPilotCategoryItems = async (pilot: ExtendedUserProfile, categoryId: string) => {
    const config = CONSUMABLE_TABLES.find(c => c.id === categoryId) || CONSUMABLE_TABLES[0];
    setLoadingPilotItems(true);

    try {
      let combined: any[] = [];

      if (pilot.legacy_id) {
        const { data: legacyRows } = await supabase
          .from(config.table)
          .select('*')
          .eq('id_user', pilot.legacy_id);
        if (legacyRows) combined = [...legacyRows];
      }

      if (pilot.id) {
        const { data: uuidRows } = await supabase
          .from(config.table)
          .select('*')
          .eq('user_id', pilot.id);
        if (uuidRows) {
          const seen = new Set(combined.map(r => r.id));
          uuidRows.forEach(r => { if (!seen.has(r.id)) combined.push(r); });
        }
      }

      setPilotItems(combined);
    } catch {
      setPilotItems([]);
    } finally {
      setLoadingPilotItems(false);
    }
  };

  useEffect(() => {
    if (syncedPilot) {
      fetchPilotCategoryItems(syncedPilot, activeCategory);
    }
  }, [activeCategory, syncedPilot]);

  // Inyección directa de consumible al inventario del piloto
  const handleInject = async () => {
    if (!syncedPilot) {
      if (setIsAlertToShow) setIsAlertToShow({ show: true, status: 'error', message: 'Acopla un comandante primero.' });
      return;
    }

    setIsInjecting(true);
    try {
      const payload: any = {
        user_id: syncedPilot.id,
        [currentConfig.idCol]: Number(injectItemId) || 1,
        created_at: new Date().toISOString()
      };

      if (syncedPilot.legacy_id) {
        payload.id_user = syncedPilot.legacy_id;
      }

      if (activeCategory === 'qmps') {
        payload.uses = Number(injectUses) || 10;
        payload.on_air = 0;
      } else if (activeCategory === 'materialicers') {
        payload.uses = Number(injectUses) || 1;
      } else if (activeCategory === 'repair_kits') {
        payload.quantity = Number(injectQuantity) || 1;
      } else if (activeCategory === 'bags' || activeCategory === 'tickets') {
        payload.is_sell = 0;
      } else if (activeCategory === 'packs') {
        payload.status = 0;
      }

      const { error } = await supabase.from(currentConfig.table).insert([payload]);
      if (error) throw error;

      await supabase.from('maintenance_logs').insert([{
        action_type: `INJECT_${currentConfig.table.toUpperCase()}`,
        records_affected: 1,
        created_at: new Date().toISOString()
      }]);

      if (setIsAlertToShow) {
        setIsAlertToShow({
          show: true,
          status: 'success',
          message: `Inyección completada: ${currentConfig.label} agregado a ${syncedPilot.username}.`
        });
      }

      fetchPilotCategoryItems(syncedPilot, activeCategory);
      fetchGlobalStats();
    } catch (e: any) {
      if (setIsAlertToShow) setIsAlertToShow({ show: true, status: 'error', message: e.message });
    } finally {
      setIsInjecting(false);
    }
  };

  // Eliminación de consumible individual
  const handleDeleteItem = async (rowId: string | number) => {
    if (!window.confirm(`¿Confirmas la desintegración de este elemento de ${currentConfig.table}?`)) return;

    try {
      const { error } = await supabase.from(currentConfig.table).delete().eq('id', rowId);
      if (error) throw error;

      if (syncedPilot) fetchPilotCategoryItems(syncedPilot, activeCategory);
      fetchGlobalStats();
    } catch (e: any) {
      alert(`Error al eliminar: ${e.message}`);
    }
  };

  const totalConsumablesCount = Object.values(globalCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6 font-mono text-xs text-left text-white select-none animate-fadeIn">
      
      {/* CABECERA */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Package className="text-cyan-400 animate-pulse" size={18} />
            <h1 className="text-lg font-bold text-white uppercase tracking-wide">
              Centro de Mando de Consumibles, Módulos & Packs
            </h1>
          </div>
          <p className="text-xs text-zinc-500 font-sans mt-1">
            Gestión de las 7 tablas de suministros reales: QMPs, kits de reparación, materializadores y bolsas de recursos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-center font-mono">
            <span className="text-zinc-500 block text-[8px] uppercase">Censo Global</span>
            <span className="text-cyan-300 font-bold">{totalConsumablesCount.toLocaleString('es-ES')} Ítems</span>
          </div>
          <button
            onClick={fetchGlobalStats}
            className="px-3 py-2 bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 font-bold uppercase rounded-lg text-xs cursor-pointer flex items-center gap-1.5 transition-all"
          >
            <RefreshCw size={12} className={loadingStats ? "animate-spin" : ""} />
            Sincronizar
          </button>
        </div>
      </div>

      {/* MÉTRICAS DE LAS 7 TABLAS MIESTRADAS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {CONSUMABLE_TABLES.map(c => (
          <div
            key={c.id}
            onClick={() => setActiveCategory(c.id)}
            className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
              activeCategory === c.id
                ? 'bg-cyan-950/30 border-cyan-500 text-cyan-300 shadow-lg shadow-cyan-950/30'
                : 'bg-zinc-950 border-zinc-900 hover:border-zinc-800 text-zinc-400'
            }`}
          >
            <div className="flex justify-between items-center mb-1">
              <span className="text-base">{c.icon}</span>
              <span className="text-[8px] bg-black/60 px-1.5 py-0.2 rounded font-mono text-zinc-500">
                {c.table.replace('user_', '')}
              </span>
            </div>
            <strong className="text-sm font-black text-white block">
              {(globalCounts[c.id] || 0).toLocaleString('es-ES')}
            </strong>
            <span className="text-[8.5px] uppercase font-bold text-zinc-500 block truncate mt-0.5">
              {c.label.split(' ')[1]}
            </span>
          </div>
        ))}
      </div>

      {/* CONSOLA DE BÚSQUEDA Y ACOPLAMIENTO DE PILOTO */}
      <div className="bg-zinc-900/40 p-3.5 border border-zinc-850 rounded-xl flex flex-col sm:flex-row items-center gap-3">
        <span className="text-zinc-400 font-bold flex items-center gap-1.5 whitespace-nowrap">
          <Search size={14} className="text-cyan-400" /> Acoplar Comandante:
        </span>
        <input
          type="text"
          placeholder="Buscar por UID, Legacy ID (#1623) o Nombre de usuario..."
          className="w-full bg-black border border-zinc-800 p-2 rounded-lg text-white font-mono text-xs uppercase outline-none focus:border-cyan-500"
          value={pilotSearchQuery}
          onChange={e => setPilotSearchQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLinkPilot()}
        />
        <button
          onClick={handleLinkPilot}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold uppercase whitespace-nowrap cursor-pointer transition-colors"
        >
          Acoplar
        </button>
      </div>

      {syncedPilot && (
        <div className="p-3 bg-zinc-900/40 border border-cyan-500/30 rounded-xl flex flex-wrap justify-between items-center gap-4 text-xs">
          <div>
            <span className="text-[9.5px] text-zinc-500 block uppercase">Comandante Activo:</span>
            <strong className="text-white text-sm">{syncedPilot.username}</strong>
            <span className="text-cyan-400 font-mono ml-2">
              (Legacy ID #{syncedPilot.legacy_id || 'N/A'} • UID: {syncedPilot.id.substring(0, 10)}...)
            </span>
          </div>
          <button
            onClick={() => setSyncedPilot(null)}
            className="text-zinc-500 hover:text-white p-1 rounded hover:bg-zinc-800 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* PANEL PRINCIPAL: INYECCIÓN Y AUDITORÍA DE INVENTARIO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Consola de Inyección (1/3) */}
        <div className="bg-zinc-950 border border-zinc-900 p-5 rounded-xl space-y-4 shadow-xl">
          <span className="text-xs font-bold uppercase text-cyan-400 block border-b border-zinc-900 pb-2">
            🚀 Inyección a Cuenta: [{currentConfig.label}]
          </span>

          {!syncedPilot ? (
            <div className="p-8 text-center text-zinc-600 text-xs italic border border-dashed border-zinc-900 rounded-lg">
              Acopla un comandante en la consola superior para habilitar los controles de inyección directa.
            </div>
          ) : (
            <div className="space-y-3.5">
              <div>
                <label className="text-[9.5px] text-zinc-500 uppercase font-bold block mb-1">
                  ID del Ítem / Tipo ({currentConfig.idCol}):
                </label>
                <input
                  type="number"
                  min={1}
                  value={injectItemId}
                  onChange={e => setInjectItemId(Number(e.target.value))}
                  className="w-full bg-black border border-zinc-800 p-2 rounded text-white font-mono text-xs outline-none focus:border-cyan-500 font-bold"
                />
              </div>

              {activeCategory === 'repair_kits' ? (
                <div>
                  <label className="text-[9.5px] text-zinc-500 uppercase font-bold block mb-1">
                    Cantidad a Otorgar:
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={injectQuantity}
                    onChange={e => setInjectQuantity(Number(e.target.value))}
                    className="w-full bg-black border border-zinc-800 p-2 rounded text-amber-400 font-mono text-xs outline-none font-bold"
                  />
                </div>
              ) : (activeCategory === 'qmps' || activeCategory === 'materialicers') ? (
                <div>
                  <label className="text-[9.5px] text-zinc-500 uppercase font-bold block mb-1">
                    Usos Restantes:
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={injectUses}
                    onChange={e => setInjectUses(Number(e.target.value))}
                    className="w-full bg-black border border-zinc-800 p-2 rounded text-cyan-300 font-mono text-xs outline-none font-bold"
                  />
                </div>
              ) : null}

              <button
                onClick={handleInject}
                disabled={isInjecting}
                className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-bold uppercase rounded-lg text-xs cursor-pointer shadow-lg transition-all flex items-center justify-center gap-1.5 mt-2"
              >
                {isInjecting ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
                Inyectar a la Bóveda del Piloto
              </button>
            </div>
          )}
        </div>

        {/* Listado de Consumibles del Piloto (2/3) */}
        <div className="lg:col-span-2 bg-zinc-950 border border-zinc-900 p-5 rounded-xl space-y-4 shadow-xl">
          <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
            <span className="text-xs font-bold uppercase text-zinc-300">
              Instancias Activas en [{currentConfig.table}] ({pilotItems.length})
            </span>
            {syncedPilot && (
              <button
                onClick={() => fetchPilotCategoryItems(syncedPilot, activeCategory)}
                className="p-1 text-zinc-500 hover:text-white cursor-pointer"
              >
                <RefreshCw size={12} className={loadingPilotItems ? "animate-spin" : ""} />
              </button>
            )}
          </div>

          {!syncedPilot ? (
            <div className="p-12 text-center text-zinc-600 text-xs italic border border-dashed border-zinc-900 rounded-lg">
              Sin comandante acoplado. Busca un piloto para visualizar y moderar sus consumibles activos.
            </div>
          ) : pilotItems.length === 0 ? (
            <div className="p-10 text-center text-zinc-600 text-xs italic border border-dashed border-zinc-900 rounded-lg">
              El piloto {syncedPilot.username} no posee instancias registradas en {currentConfig.table}.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
              {pilotItems.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-3 bg-black/60 border border-zinc-900 hover:border-zinc-800 rounded-lg flex justify-between items-center"
                >
                  <div>
                    <span className="font-bold text-white block text-xs">
                      {currentConfig.label.split(' ')[1]} #{item[currentConfig.idCol] || item.id}
                    </span>
                    <span className="text-[9px] text-zinc-500 font-mono block">
                      ID Fila: {item.id}
                      {item.uses !== undefined && ` • Usos: ${item.uses}`}
                      {item.quantity !== undefined && ` • Cantidad: ${item.quantity}`}
                      {item.is_sell !== undefined && ` • En Venta: ${item.is_sell ? 'Sí' : 'No'}`}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-zinc-900 rounded cursor-pointer transition-colors"
                    title="Eliminar elemento"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default AdminConsumablesHub;