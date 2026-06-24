import React, { useEffect, useState } from 'react';
import { getSupabaseClient } from '../lib/supabase';
import { Coins, Database, Zap, Cpu, RefreshCw, Save } from 'lucide-react';

// 1. Tipado estricto de las Bóvedas de Recursos
interface VaultResources {
  player_id: string;
  username?: string; // Para mostrar a quién pertenece la bóveda
  gd_coins: number;
  phantom_coins: number;
  metal: number;
  crystal: number;
  antimatter: number;
  dark_matter: number;
  quantum_chips: number;
  plasma: number;
  uranium: number;
  titanium: number;
  credits: number;
  neural_slots: number;
}

export const CANManager: React.FC = () => {
  const supabase = getSupabaseClient();
  const [vaults, setVaults] = useState<VaultResources[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editingVault, setEditingVault] = useState<VaultResources | null>(null);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    fetchVaults();

    // Sincronización en tiempo real con Supabase
    const vaultsChannel = supabase
      .channel('public:vaults')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vaults' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newVault = payload.new as VaultResources;
            setVaults((prev) => {
              if (prev.some((v) => v.player_id === newVault.player_id)) return prev;
              return [...prev, { ...newVault, username: 'Piloto Reconectando...' }];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedVault = payload.new as VaultResources;
            setVaults((prev) =>
              prev.map((v) => (v.player_id === updatedVault.player_id ? { ...v, ...updatedVault } : v))
            );
            // También actualizamos en vivo si el admin lo tiene abierto
            setEditingVault((currentEditing) => 
              currentEditing?.player_id === updatedVault.player_id 
                ? { ...currentEditing, ...updatedVault } 
                : currentEditing
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.player_id;
            setVaults((prev) => prev.filter((v) => v.player_id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(vaultsChannel);
    };
  }, []);

  // 2. Descarga combinada de recursos de la base de datos
  const fetchVaults = async () => {
    if (!supabase) return;
    
    try {
      setLoading(true);
      // Hacemos un join simple con 'profiles' para traer el nombre del piloto
      const { data, error } = await supabase
        .from('vaults')
        .select(`
          player_id,
          gd_coins, phantom_coins, metal, crystal, antimatter,
          dark_matter, quantum_chips, plasma, uranium, titanium,
          credits, neural_slots,
          profiles:player_id ( username )
        `);

      if (error) throw error;

      if (data) {
        // Mapeamos el join para aplanar el nombre de usuario de forma limpia
        const formattedVaults = data.map((v: any) => {
          let uname = 'Piloto Desconocido';
          // Manejo por si profiles retorna un array o un objeto singular en la relación 1 a 1
          if (Array.isArray(v.profiles) && v.profiles.length > 0) {
            uname = v.profiles[0].username;
          } else if (v.profiles && !Array.isArray(v.profiles)) {
            uname = v.profiles.username;
          }
          return {
            ...v,
            username: uname
          };
        });
        setVaults(formattedVaults);
      }
    } catch (error: any) {
      console.error('Error en el radar de bóvedas:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. Guardar alteraciones de recursos en Supabase
  const handleSaveChanges = async () => {
    if (!editingVault || !supabase) return;

    try {
      const { player_id, username, profiles, ...resourceData } = editingVault as any;

      // Actualización optimista
      setVaults(prev => prev.map(v => v.player_id === player_id ? editingVault : v));

      const { error } = await supabase
        .from('vaults')
        .update(resourceData) // Envía los datos actualizados en snake_case
        .eq('player_id', player_id);

      if (error) {
        // Rollback visual si falla
        fetchVaults();
        throw error;
      }

      setEditingVault(null);
    } catch (error: any) {
      alert(`Error al inyectar recursos: ${error.message}`);
    }
  };

  if (loading && vaults.length === 0) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center">
        <div className="p-6 text-center text-amber-500 animate-pulse font-mono tracking-wider">
          Escanear compartimentos de carga avanzados...
        </div>
      </div>
    );
  }

  if (!supabase) {
    return (
      <div className="p-6 text-center text-rose-400">
        Error de Conexión: Cliente Supabase no configurado.
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-900 min-h-full text-slate-100 rounded-xl border border-slate-800">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-wider text-amber-400">ADMINISTRADOR DE BÓVEDAS (CAN)</h2>
          <p className="text-sm text-slate-400">Modificación directa de suministros y ranuras neuronales del juego.</p>
        </div>
        <button onClick={fetchVaults} className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-amber-400 transition-colors flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> <span className="text-sm font-medium">Radar</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Bóvedas */}
        <div className="lg:col-span-2 space-y-4">
          {vaults.map((vault) => (
            <div key={vault.player_id} className="p-4 bg-slate-950 rounded-lg border border-slate-800 hover:border-slate-700 transition-all">
              <div className="flex justify-between items-center mb-3">
                <span className="font-semibold text-slate-300 tracking-wide flex items-center gap-2">
                  <Database className="w-4 h-4 text-slate-500" />
                  {vault.username}
                </span>
                <button
                  onClick={() => setEditingVault({ ...vault })}
                  className={`text-xs px-3 py-1.5 rounded font-medium transition-all ${
                    editingVault?.player_id === vault.player_id 
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
                  }`}
                >
                  {editingVault?.player_id === vault.player_id ? 'Modificando...' : 'Alterar Suministros'}
                </button>
              </div>
              
              {/* Grid de recursos rápido */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-slate-400">
                <div className="bg-slate-900/60 p-2 rounded flex justify-between border border-slate-800/50">
                  <span className="flex items-center gap-1"><Coins className="w-3 h-3 text-amber-500/70" /> GD:</span> 
                  <span className="text-amber-300 font-mono">{vault.gd_coins}</span>
                </div>
                <div className="bg-slate-900/60 p-2 rounded flex justify-between border border-slate-800/50">
                  <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-purple-500/70" /> PH:</span> 
                  <span className="text-purple-400 font-mono">{vault.phantom_coins}</span>
                </div>
                <div className="bg-slate-900/60 p-2 rounded flex justify-between border border-slate-800/50">
                  <span>MET:</span> <span className="text-slate-300 font-mono">{vault.metal}</span>
                </div>
                <div className="bg-slate-900/60 p-2 rounded flex justify-between border border-slate-800/50">
                  <span>CRY:</span> <span className="text-cyan-400 font-mono">{vault.crystal}</span>
                </div>
              </div>
              <div className="mt-3 text-right text-slate-500 text-[11px] flex items-center justify-end gap-1">
                <Cpu className="w-3 h-3 text-emerald-500" />
                Ranuras Neuronales Activas: <span className="text-emerald-400 font-mono font-bold text-xs ml-1">{vault.neural_slots}</span>
              </div>
            </div>
          ))}
          {vaults.length === 0 && !loading && (
             <div className="p-8 text-center text-slate-500 border border-dashed border-slate-700 rounded-lg">
               No hay bóvedas detectadas en la base de datos.
             </div>
          )}
        </div>

        {/* Panel de Edición/Inyección Forzada */}
        <div className="bg-slate-950 p-5 rounded-lg border border-slate-800 h-fit sticky top-6">
          <h3 className="text-md font-bold text-slate-200 mb-4 flex items-center gap-2 border-b border-slate-800 pb-3">
            <Database className="w-4 h-4 text-amber-400" /> CONSOLA DE INYECCIÓN
          </h3>

          {editingVault ? (
            <div className="space-y-4 text-sm animate-in fade-in duration-200">
              <p className="text-xs text-slate-400 mb-2">
                Editando la cuenta de: <strong className="text-amber-400">{editingVault.username}</strong>
              </p>
              
              <div>
                <label htmlFor="gd_coins" className="block text-[11px] uppercase tracking-wider text-slate-500 mb-1">GalaxyDust Coins (gd_coins)</label>
                <input
                  id="gd_coins"
                  type="number"
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-amber-300 font-mono focus:border-amber-500 focus:outline-none transition-colors"
                  value={editingVault.gd_coins}
                  onChange={e => setEditingVault({ ...editingVault, gd_coins: Number(e.target.value) })}
                />
              </div>

              <div>
                <label htmlFor="phantom_coins" className="block text-[11px] uppercase tracking-wider text-slate-500 mb-1">Phantom Coins (phantom_coins)</label>
                <input
                  id="phantom_coins"
                  type="number"
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-purple-400 font-mono focus:border-purple-500 focus:outline-none transition-colors"
                  value={editingVault.phantom_coins}
                  onChange={e => setEditingVault({ ...editingVault, phantom_coins: Number(e.target.value) })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                <div>
                  <label htmlFor="metal" className="block text-[11px] uppercase tracking-wider text-slate-500 mb-1">Metal</label>
                  <input
                    id="metal"
                    type="number"
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-300 font-mono focus:border-cyan-500 focus:outline-none transition-colors"
                    value={editingVault.metal}
                    onChange={e => setEditingVault({ ...editingVault, metal: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label htmlFor="crystal" className="block text-[11px] uppercase tracking-wider text-slate-500 mb-1">Crystal</label>
                  <input
                    id="crystal"
                    type="number"
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-cyan-400 font-mono focus:border-cyan-500 focus:outline-none transition-colors"
                    value={editingVault.crystal}
                    onChange={e => setEditingVault({ ...editingVault, crystal: Number(e.target.value) })}
                  />
                </div>
              </div>
              
              <div className="pt-2 border-t border-slate-800">
                <label htmlFor="neural_slots" className="block text-[11px] uppercase tracking-wider text-emerald-500/70 mb-1">Ranuras Neuronales (neural_slots)</label>
                <input
                  id="neural_slots"
                  type="number"
                  className="w-full bg-slate-900 border border-emerald-900/50 rounded p-2 text-emerald-400 font-mono focus:border-emerald-500 focus:outline-none transition-colors"
                  value={editingVault.neural_slots}
                  onChange={e => setEditingVault({ ...editingVault, neural_slots: Number(e.target.value) })}
                />
              </div>

              <button
                onClick={handleSaveChanges}
                className="w-full mt-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2.5 px-4 rounded flex items-center justify-center gap-2 transition-colors text-xs tracking-wider"
              >
                <Save className="w-4 h-4" /> REESCRIBIR BÓVEDA
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-slate-800 rounded-lg">
              <Database className="w-8 h-8 text-slate-700 mb-3" />
              <p className="text-xs text-slate-500">Selecciona una bóveda de la tripulación para abrir las compuertas de modificación.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CANManager;
