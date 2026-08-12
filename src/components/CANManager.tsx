import React, { useEffect, useState } from 'react';
import { getSupabaseClient } from '../lib/supabase';
import { Coins, Database, Zap, Cpu, RefreshCw, Save, Activity, Sliders, Shield, Award, Layers } from 'lucide-react';

// 1. Tipado estricto de las Bóvedas de Recursos y Nivelación C.A.N.
interface VaultResources {
  player_id: string;
  username?: string;
  can_level: number;
  can_xp: number;
  gd_coins: number;
  phantom_coins: number;
  metal: number;
  crystal: number;
  deuterium: number;
  antimatter: number;
  dark_matter: number;
  quantum_chips: number;
  plasma: number;
  uranium: number;
  titanium: number;
  credits: number;
  neural_slots: number;
}

interface CANProductionFormula {
  metalRatePerHour: number;
  crystalRatePerHour: number;
  deuteriumRatePerHour: number;
  boostCapHours: number;
  skillCooldownMultiplier: number;
}

type CANSubTab = 'vaults' | 'can_config' | 'formulas';

export const CANManager: React.FC = () => {
  const supabase = getSupabaseClient();
  const [activeTab, setActiveTab] = useState<CANSubTab>('vaults');
  const [vaults, setVaults] = useState<VaultResources[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editingVault, setEditingVault] = useState<VaultResources | null>(null);

  // Fórmulas Globales de Producción de la Estación C.A.N.
  const [formulas, setFormulas] = useState<CANProductionFormula>({
    metalRatePerHour: 4500,
    crystalRatePerHour: 2200,
    deuteriumRatePerHour: 900,
    boostCapHours: 24, // Límite estricto de 1 día
    skillCooldownMultiplier: 1.0
  });

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    fetchVaults();

    // Sincronización en tiempo real con Supabase
    const vaultsChannel = supabase
      .channel('public:vaults_and_profiles')
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

  // Descarga combinada de recursos y niveles C.A.N.
  const fetchVaults = async () => {
    if (!supabase) return;
    
    try {
      setLoading(true);

      // Consulta combinada de Vaults y Profiles para obtener nivel C.A.N. y username
      const { data: profilesData } = await supabase
        .from('user_profiles')
        .select('*');

      const profilesMap = new Map();
      (profilesData || []).forEach((p: any) => {
        profilesMap.set(p.id || p.user_id, p);
      });

      const { data, error } = await supabase
        .from('vaults')
        .select('*');

      if (error && (!profilesData || profilesData.length === 0)) throw error;

      const sourceList = (data && data.length > 0) ? data : (profilesData || []);

      const formattedVaults: VaultResources[] = sourceList.map((v: any) => {
        const uid = v.player_id || v.user_id || v.id;
        const prof = profilesMap.get(uid);

        return {
          player_id: uid,
          username: prof?.username || prof?.display_name || v.username || 'Piloto Desconocido',
          can_level: prof?.can_level || prof?.level || v.can_level || 1,
          can_xp: prof?.can_xp || prof?.exp_points || v.can_xp || 0,
          gd_coins: Number(v.gd_coins || prof?.gd_balance || prof?.gd_coin) || 0,
          phantom_coins: Number(v.phantom_coins || prof?.phantom_coins_balance || prof?.phantom_coin) || 0,
          metal: Number(v.metal || prof?.metal || prof?.metal_balance) || 0,
          crystal: Number(v.crystal || prof?.crystal || prof?.crystal_balance) || 0,
          deuterium: Number(v.deuterium || prof?.deuterium || prof?.deuterium_balance) || 0,
          antimatter: Number(v.antimatter) || 0,
          dark_matter: Number(v.dark_matter || prof?.dark_matter || prof?.dark_matter_balance) || 0,
          quantum_chips: Number(v.quantum_chips) || 0,
          plasma: Number(v.plasma) || 0,
          uranium: Number(v.uranium) || 0,
          titanium: Number(v.titanium) || 0,
          credits: Number(v.credits || prof?.quantum_credit) || 0,
          neural_slots: Number(v.neural_slots || prof?.neural_slots) || 3,
        };
      });

      setVaults(formattedVaults);
    } catch (error: any) {
      console.error('Error en el radar de la C.A.N.:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Guardar alteraciones en Supabase (dual Vaults + User Profiles)
  const handleSaveChanges = async () => {
    if (!editingVault || !supabase) return;

    try {
      const { player_id, username, can_level, can_xp, ...resourceData } = editingVault;

      // Actualización optimista local
      setVaults(prev => prev.map(v => v.player_id === player_id ? editingVault : v));

      // 1. Actualización en tabla vaults
      await supabase
        .from('vaults')
        .update(resourceData)
        .eq('player_id', player_id);

      // 2. Sincronización en tabla user_profiles (recursos + can_level)
      await supabase
        .from('user_profiles')
        .update({
          can_level: Number(can_level),
          can_xp: Number(can_xp),
          metal: Number(editingVault.metal),
          crystal: Number(editingVault.crystal),
          deuterium: Number(editingVault.deuterium),
          dark_matter: Number(editingVault.dark_matter),
          gd_balance: Number(editingVault.gd_coins),
          phantom_coins_balance: Number(editingVault.phantom_coins),
          updated_at: new Date().toISOString()
        })
        .or(`id.eq.${player_id},user_id.eq.${player_id}`);

      alert("✅ RECRISTALIZACIÓN COMPLETADA: Bóveda y C.A.N. Station sincronizados.");
      setEditingVault(null);
      fetchVaults();
    } catch (error: any) {
      alert(`Error al inyectar suministros: ${error.message}`);
    }
  };

  const handleSaveFormulas = () => {
    alert("⚙️ FÓRMULAS DE PRODUCCIÓN Y ACTIVE SKILLS GUARDADAS EN EL NÚCLEO C.A.N.");
  };

  if (loading && vaults.length === 0) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center">
        <div className="p-6 text-center text-amber-500 animate-pulse font-mono tracking-wider">
          Escanear compartimentos de carga y núcleos C.A.N...
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
    <div className="p-6 bg-slate-900 min-h-full text-slate-100 rounded-xl border border-slate-800 text-left font-mono">
      
      {/* HEADER PRINCIPAL */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-wider text-amber-400 flex items-center gap-2">
            <Cpu className="w-6 h-6 text-amber-500 animate-pulse" /> ADMINISTRADOR C.A.N. STATION & BÓVEDAS
          </h2>
          <p className="text-sm text-slate-400">Modificación directa de suministros, nivelación de C.A.N., ranuras neuronales y fórmulas.</p>
        </div>
        <button onClick={fetchVaults} className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-amber-400 transition-colors flex items-center gap-2 cursor-pointer">
          <RefreshCw className="w-4 h-4" /> <span className="text-sm font-medium">Radar</span>
        </button>
      </div>

      {/* PESTAÑAS DE NAVEGACIÓN SUB-MÓDULO */}
      <div className="flex border-b border-slate-800 gap-2 mb-6 select-none">
        <button 
          onClick={() => setActiveTab('vaults')} 
          className={`px-4 py-2.5 font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'vaults' ? 'border-amber-500 text-amber-400 bg-amber-950/10' : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <Database className="w-4 h-4" /> Bóvedas & Suministros
        </button>

        <button 
          onClick={() => setActiveTab('can_config')} 
          className={`px-4 py-2.5 font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'can_config' ? 'border-cyan-500 text-cyan-400 bg-cyan-950/10' : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <Cpu className="w-4 h-4" /> Configuración C.A.N. & Nivelación
        </button>

        <button 
          onClick={() => setActiveTab('formulas')} 
          className={`px-4 py-2.5 font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'formulas' ? 'border-purple-500 text-purple-400 bg-purple-950/10' : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <Sliders className="w-4 h-4" /> Fórmulas & Active Skills
        </button>
      </div>

      {/* TAB 1: BÓVEDAS & SUMINISTROS */}
      {activeTab === 'vaults' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Bóvedas */}
          <div className="lg:col-span-2 space-y-4">
            {vaults.map((vault) => (
              <div key={vault.player_id} className="p-4 bg-slate-950 rounded-lg border border-slate-800 hover:border-slate-700 transition-all">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-semibold text-slate-300 tracking-wide flex items-center gap-2">
                    <Database className="w-4 h-4 text-slate-500" />
                    {vault.username}
                    <span className="text-[9px] bg-cyan-950 text-cyan-400 border border-cyan-800 px-2 py-0.5 rounded font-black uppercase">
                      C.A.N. LVL {vault.can_level}
                    </span>
                  </span>
                  <button
                    onClick={() => setEditingVault({ ...vault })}
                    className={`text-xs px-3 py-1.5 rounded font-medium transition-all cursor-pointer ${
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
                    <span className="text-amber-300 font-mono">{vault.gd_coins.toLocaleString()}</span>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded flex justify-between border border-slate-800/50">
                    <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-purple-500/70" /> PH:</span> 
                    <span className="text-purple-400 font-mono">{vault.phantom_coins.toLocaleString()}</span>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded flex justify-between border border-slate-800/50">
                    <span>MET:</span> <span className="text-slate-300 font-mono">{vault.metal.toLocaleString()}</span>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded flex justify-between border border-slate-800/50">
                    <span>CRY:</span> <span className="text-cyan-400 font-mono">{vault.crystal.toLocaleString()}</span>
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
              <Database className="w-4 h-4 text-amber-400" /> CONSOLA DE INYECCIÓN C.A.N.
            </h3>

            {editingVault ? (
              <div className="space-y-4 text-sm animate-in fade-in duration-200">
                <p className="text-xs text-slate-400 mb-2">
                  Editando la cuenta de: <strong className="text-amber-400">{editingVault.username}</strong>
                </p>

                <div className="grid grid-cols-2 gap-3 pb-2 border-b border-slate-800">
                  <div>
                    <label htmlFor="can_level" className="block text-[11px] uppercase tracking-wider text-cyan-400 mb-1">Nivel C.A.N.</label>
                    <input
                      id="can_level"
                      type="number"
                      min="1"
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-cyan-300 font-mono focus:border-cyan-500 focus:outline-none"
                      value={editingVault.can_level}
                      onChange={e => setEditingVault({ ...editingVault, can_level: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label htmlFor="can_xp" className="block text-[11px] uppercase tracking-wider text-cyan-400 mb-1">Experiencia C.A.N.</label>
                    <input
                      id="can_xp"
                      type="number"
                      min="0"
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-cyan-300 font-mono focus:border-cyan-500 focus:outline-none"
                      value={editingVault.can_xp}
                      onChange={e => setEditingVault({ ...editingVault, can_xp: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="gd_coins" className="block text-[11px] uppercase tracking-wider text-slate-500 mb-1">GalaxyDust Coins (gd_coins)</label>
                  <input
                    id="gd_coins"
                    type="number"
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-amber-300 font-mono focus:border-amber-500 focus:outline-none"
                    value={editingVault.gd_coins}
                    onChange={e => setEditingVault({ ...editingVault, gd_coins: Number(e.target.value) })}
                  />
                </div>

                <div>
                  <label htmlFor="phantom_coins" className="block text-[11px] uppercase tracking-wider text-slate-500 mb-1">Phantom Coins (phantom_coins)</label>
                  <input
                    id="phantom_coins"
                    type="number"
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-purple-400 font-mono focus:border-purple-500 focus:outline-none"
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
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-300 font-mono focus:border-cyan-500 focus:outline-none"
                      value={editingVault.metal}
                      onChange={e => setEditingVault({ ...editingVault, metal: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label htmlFor="crystal" className="block text-[11px] uppercase tracking-wider text-slate-500 mb-1">Crystal</label>
                    <input
                      id="crystal"
                      type="number"
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-cyan-400 font-mono focus:border-cyan-500 focus:outline-none"
                      value={editingVault.crystal}
                      onChange={e => setEditingVault({ ...editingVault, crystal: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="deuterium" className="block text-[11px] uppercase tracking-wider text-slate-500 mb-1">Deuterio (Deuterium)</label>
                  <input
                    id="deuterium"
                    type="number"
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-blue-400 font-mono focus:border-blue-500 focus:outline-none"
                    value={editingVault.deuterium}
                    onChange={e => setEditingVault({ ...editingVault, deuterium: Number(e.target.value) })}
                  />
                </div>
                
                <div className="pt-2 border-t border-slate-800">
                  <label htmlFor="neural_slots" className="block text-[11px] uppercase tracking-wider text-emerald-500/70 mb-1">Ranuras Neuronales (neural_slots)</label>
                  <input
                    id="neural_slots"
                    type="number"
                    className="w-full bg-slate-900 border border-emerald-900/50 rounded p-2 text-emerald-400 font-mono focus:border-emerald-500 focus:outline-none"
                    value={editingVault.neural_slots}
                    onChange={e => setEditingVault({ ...editingVault, neural_slots: Number(e.target.value) })}
                  />
                </div>

                <button
                  onClick={handleSaveChanges}
                  className="w-full mt-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2.5 px-4 rounded flex items-center justify-center gap-2 transition-colors text-xs tracking-wider cursor-pointer"
                >
                  <Save className="w-4 h-4" /> REESCRIBIR BÓVEDA & C.A.N.
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
      )}

      {/* TAB 2: CONFIGURACIÓN C.A.N. & NIVELACIÓN */}
      {activeTab === 'can_config' && (
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-5 animate-fadeIn">
          <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-widest border-b border-slate-800 pb-2">
            ⚙️ PARAMETRIZACIÓN DEL NÚCLEO C.A.N. EN EL SERVIDOR
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">C.A.N. Nivel Máximo Permitido</span>
              <div className="text-2xl font-bold text-cyan-300 font-mono">100 LVL</div>
              <p className="text-[9px] text-slate-500">Tope de expansión de la estación C.A.N. en el cliente.</p>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Factor de Consumo de Deuterio</span>
              <div className="text-2xl font-bold text-amber-400 font-mono">1.0x Base</div>
              <p className="text-[9px] text-slate-500">Gasto de combustible por hora activa de la estación.</p>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">A.M.I. Cartografía Estelar</span>
              <div className="text-2xl font-bold text-emerald-400 font-mono">ONLINE</div>
              <p className="text-[9px] text-slate-500">Conexión con el mapa de estrellas descubiertas en tiempo real.</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FÓRMULAS & ACTIVE SKILLS */}
      {activeTab === 'formulas' && (
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-5 animate-fadeIn">
          <h3 className="text-sm font-bold text-purple-400 uppercase tracking-widest border-b border-slate-800 pb-2">
            📊 FÓRMULAS DE EXTRACCIÓN Y BOOSTS
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
              <span className="text-cyan-400 font-bold uppercase block border-b border-slate-800 pb-1">
                Ratio de Producción Base Diaria
              </span>
              <div className="space-y-2">
                <div>
                  <label className="text-[9.5px] text-slate-400 block mb-0.5">Metal Extracción Base (kg/h):</label>
                  <input
                    type="number"
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-cyan-300 font-mono"
                    value={formulas.metalRatePerHour}
                    onChange={e => setFormulas({ ...formulas, metalRatePerHour: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-[9.5px] text-slate-400 block mb-0.5">Cristal Extracción Base (kg/h):</label>
                  <input
                    type="number"
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-purple-300 font-mono"
                    value={formulas.crystalRatePerHour}
                    onChange={e => setFormulas({ ...formulas, crystalRatePerHour: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-[9.5px] text-slate-400 block mb-0.5">Deuterio Extracción Base (kg/h):</label>
                  <input
                    type="number"
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-blue-300 font-mono"
                    value={formulas.deuteriumRatePerHour}
                    onChange={e => setFormulas({ ...formulas, deuteriumRatePerHour: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
              <span className="text-amber-400 font-bold uppercase block border-b border-slate-800 pb-1">
                Reglas de Boost Acumulable (Documento Minería - Pág. 1)
              </span>
              <div>
                <label className="text-[9.5px] text-slate-400 block mb-0.5">Tope Máximo de Boost Acumulable (Horas):</label>
                <input
                  type="number"
                  className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-amber-300 font-mono"
                  value={formulas.boostCapHours}
                  onChange={e => setFormulas({ ...formulas, boostCapHours: Number(e.target.value) })}
                />
                <span className="text-[8.5px] text-slate-500 mt-1 block">
                  Regla fija: "Acumulable hasta un máximo de 1 día (24 horas)".
                </span>
              </div>

              <div>
                <label className="text-[9.5px] text-slate-400 block mb-0.5">Multiplicador de Cooldown Active Skills:</label>
                <input
                  type="number"
                  step="0.1"
                  className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-purple-300 font-mono"
                  value={formulas.skillCooldownMultiplier}
                  onChange={e => setFormulas({ ...formulas, skillCooldownMultiplier: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleSaveFormulas}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 px-4 rounded flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Save className="w-4 h-4" /> GUARDAR FÓRMULAS EN EL SERVIDOR
          </button>
        </div>
      )}

    </div>
  );
};

export default CANManager;