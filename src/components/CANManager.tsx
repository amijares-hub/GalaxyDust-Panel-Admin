import React, { useEffect, useState } from 'react';
import { getSupabaseClient } from '../lib/supabase';
import { 
  Cpu, RefreshCw, Save, Sliders, Shield, Award, 
  Trash2, Plus, UserCheck, Wrench, Building
} from 'lucide-react';

interface VaultUserSummary {
  player_id: string;
  username?: string;
  can_level: number;
  can_xp: number;
  neural_slots: number;
}

interface EquippedItem {
  id: string;
  user_id: string;
  item_type: 'badge' | 'technology' | 'structure';
  item_id: string;
  item_name: string;
  sub_type: string;
  equipped_at: string;
}

interface SeedCatalogItem {
  id: string;
  name: string;
  type: string;
  sub_type: string;
}

interface CANProductionFormula {
  metalRatePerHour: number;
  crystalRatePerHour: number;
  deuteriumRatePerHour: number;
  boostCapHours: number;
  skillCooldownMultiplier: number;
}

type CANSubTab = 'equipment' | 'can_config' | 'formulas';

export const CANManager: React.FC = () => {
  const supabase = getSupabaseClient();
  const [activeTab, setActiveTab] = useState<CANSubTab>('equipment');
  const [users, setUsers] = useState<VaultUserSummary[]>([]);
  const [selectedUser, setSelectedUser] = useState<VaultUserSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Equipamiento C.A.N.
  const [equippedItems, setEquippedItems] = useState<EquippedItem[]>([]);
  const [catalogBadges, setCatalogBadges] = useState<SeedCatalogItem[]>([]);
  const [catalogTechs, setCatalogTechs] = useState<SeedCatalogItem[]>([]);
  const [catalogStructures, setCatalogStructures] = useState<SeedCatalogItem[]>([]);

  // Selección para equipar
  const [selectedBadgeToEquip, setSelectedBadgeToEquip] = useState<string>('');
  const [selectedTechToEquip, setSelectedTechToEquip] = useState<string>('');
  const [selectedStructureToEquip, setSelectedStructureToEquip] = useState<string>('');

  // Fórmulas Globales de Producción
  const [formulas, setFormulas] = useState<CANProductionFormula>({
    metalRatePerHour: 4500,
    crystalRatePerHour: 2200,
    deuteriumRatePerHour: 900,
    boostCapHours: 24,
    skillCooldownMultiplier: 1.0
  });

  // Cargar fórmulas iniciales con estrategia Multi-Fallback
  const fetchFormulas = async () => {
    // 1. Intentar desde localStorage como lectura rápida
    const local = localStorage.getItem('sasori_can_formulas');
    if (local) {
      try {
        setFormulas(JSON.parse(local));
      } catch (e) {}
    }

    if (!supabase) return;

    // 2. Intentar desde sasori_game_hud
    try {
      const { data } = await supabase
        .from('sasori_game_hud')
        .select('config')
        .eq('id', 'can_formulas')
        .maybeSingle();

      if (data?.config) {
        setFormulas(data.config as CANProductionFormula);
        localStorage.setItem('sasori_can_formulas', JSON.stringify(data.config));
        return;
      }
    } catch (e) {}

    // 3. Respaldo desde game_hud
    try {
      const { data } = await supabase
        .from('game_hud')
        .select('config')
        .eq('id', 'can_formulas')
        .maybeSingle();

      if (data?.config) {
        setFormulas(data.config as CANProductionFormula);
        localStorage.setItem('sasori_can_formulas', JSON.stringify(data.config));
      }
    } catch (e) {}
  };

  const fetchUsers = async () => {
    if (!supabase) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vw_user_vaults_summary')
        .select('player_id, username, can_level, can_xp, neural_slots');

      if (error) throw error;

      if (data && data.length > 0) {
        setUsers(data as VaultUserSummary[]);
        if (!selectedUser) {
          setSelectedUser(data[0] as VaultUserSummary);
        }
      }
    } catch (error: any) {
      console.error('Error al cargar comandantes:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchEquippedAndCatalogs = async (userId: string) => {
    if (!supabase || !userId) return;
    try {
      const { data: eqData } = await supabase
        .from('can_equipped_items')
        .select('*')
        .eq('user_id', userId);

      if (eqData) setEquippedItems(eqData as EquippedItem[]);

      const [badgesRes, techsRes, structsRes] = await Promise.all([
        supabase.from('seed_badges').select('id, name, type'),
        supabase.from('seed_technologies').select('id, name, type'),
        supabase.from('seed_structures').select('id, name, type')
      ]);

      if (badgesRes.data) {
        setCatalogBadges(badgesRes.data.map((b: any) => ({
          id: b.id,
          name: b.name,
          type: 'badge',
          sub_type: b.type || 'war_badge'
        })));
      }

      if (techsRes.data) {
        setCatalogTechs(techsRes.data.map((t: any) => ({
          id: t.id,
          name: t.name,
          type: 'technology',
          sub_type: t.type || t.id
        })));
      }

      if (structsRes.data) {
        setCatalogStructures(structsRes.data.map((s: any) => ({
          id: s.id,
          name: s.name,
          type: 'structure',
          sub_type: s.type || s.id
        })));
      }
    } catch (err: any) {
      console.error('Error cargando catálogos C.A.N.:', err.message);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchFormulas();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchEquippedAndCatalogs(selectedUser.player_id);
    }
  }, [selectedUser?.player_id]);

  const handleEquipItem = async (itemType: 'badge' | 'technology' | 'structure', itemId: string) => {
    if (!selectedUser || !itemId || !supabase) return;

    let targetCatalog: SeedCatalogItem[] = [];
    if (itemType === 'badge') targetCatalog = catalogBadges;
    else if (itemType === 'technology') targetCatalog = catalogTechs;
    else if (itemType === 'structure') targetCatalog = catalogStructures;

    const itemObj = targetCatalog.find(i => i.id === itemId);
    if (!itemObj) return;

    try {
      const { error } = await supabase.rpc('equip_can_item', {
        p_user_id: selectedUser.player_id,
        p_item_type: itemType,
        p_item_id: itemObj.id,
        p_item_name: itemObj.name,
        p_sub_type: itemObj.sub_type
      });

      if (error) throw error;

      alert(`✅ MÓDULO EQUIPADO: [${itemObj.name}] sincronizado en la C.A.N.`);
      fetchEquippedAndCatalogs(selectedUser.player_id);

      if (itemType === 'badge') setSelectedBadgeToEquip('');
      if (itemType === 'technology') setSelectedTechToEquip('');
      if (itemType === 'structure') setSelectedStructureToEquip('');
    } catch (err: any) {
      alert(`🚨 RESTRICCIÓN DE C.A.N.: ${err.message}`);
    }
  };

  const handleUnequipItem = async (equippedId: string, itemName: string) => {
    if (!selectedUser || !supabase) return;
    try {
      const { error } = await supabase.rpc('unequip_can_item', {
        p_user_id: selectedUser.player_id,
        p_equipped_id: equippedId
      });

      if (error) throw error;

      alert(`🗑️ [${itemName}] desequipado de la Estación C.A.N.`);
      fetchEquippedAndCatalogs(selectedUser.player_id);
    } catch (err: any) {
      alert(`Error al desequipar: ${err.message}`);
    }
  };

  const handleSaveUserCANConfig = async () => {
    if (!selectedUser || !supabase) return;

    try {
      await supabase
        .from('user_profiles')
        .update({
          can_level: Number(selectedUser.can_level),
          can_xp: Number(selectedUser.can_xp),
          updated_at: new Date().toISOString()
        })
        .or(`id.eq.${selectedUser.player_id},user_id.eq.${selectedUser.player_id}`);

      await supabase
        .from('vaults')
        .upsert({
          player_id: selectedUser.player_id,
          neural_slots: Number(selectedUser.neural_slots)
        });

      alert("⚙️ CONFIGURACIÓN C.A.N. Y RANURAS NEURONALES ACTUALIZADAS.");
      fetchUsers();
    } catch (error: any) {
      alert(`Error al guardar configuración: ${error.message}`);
    }
  };

  // Guardado indestructible con Fallback en cadena
  const handleSaveFormulas = async () => {
    // 1. Guardar siempre en LocalStorage (Respaldo Inmediato)
    localStorage.setItem('sasori_can_formulas', JSON.stringify(formulas));

    if (!supabase) {
      alert("⚙️ FÓRMULAS GUARDADAS LOCALMENTE (Sin conexión a Supabase).");
      return;
    }

    let savedInDb = false;

    // 2. Intentar guardar en sasori_game_hud
    try {
      const { error } = await supabase
        .from('sasori_game_hud')
        .upsert({ 
          id: 'can_formulas', 
          config: formulas,
          updated_at: new Date().toISOString()
        });

      if (!error) savedInDb = true;
    } catch (err) {}

    // 3. Si falló la primera tabla, intentar en game_hud
    if (!savedInDb) {
      try {
        const { error } = await supabase
          .from('game_hud')
          .upsert({ 
            id: 'can_formulas', 
            config: formulas,
            updated_at: new Date().toISOString()
          });

        if (!error) savedInDb = true;
      } catch (err) {}
    }

    if (savedInDb) {
      alert("⚙️ FÓRMULAS DE PRODUCCIÓN Y BOOSTS GUARDADAS EN SUPABASE.");
    } else {
      alert("⚠️ FÓRMULAS GUARDADAS LOCALMENTE.\n\nRecuerda ejecutar el script SQL en Supabase para habilitar la sincronización en la nube.");
    }
  };

  const equippedBadges = equippedItems.filter(i => i.item_type === 'badge');
  const equippedTechs = equippedItems.filter(i => i.item_type === 'technology');
  const equippedStructures = equippedItems.filter(i => i.item_type === 'structure');

  if (loading && users.length === 0) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center font-mono">
        <div className="p-6 text-center text-amber-500 animate-pulse tracking-wider">
          Sincronizando Estación C.A.N. y ranuras de equipamiento...
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-900 min-h-full text-slate-100 rounded-xl border border-slate-800 text-left font-mono select-none">
      
      {/* HEADER PRINCIPAL */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-wider text-amber-400 flex items-center gap-2">
            <Cpu className="w-6 h-6 text-amber-500 animate-pulse" /> ADMINISTRADOR C.A.N. STATION & MÓDULOS
          </h2>
          <p className="text-sm text-slate-400 font-sans">
            Control de nivelación, equipamiento de Badges (Max 5), Tecnologías/Estructuras y ranuras neuronales.
          </p>
        </div>
        <button onClick={fetchUsers} className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-amber-400 transition-colors flex items-center gap-2 cursor-pointer">
          <RefreshCw className="w-4 h-4" /> <span className="text-sm font-medium">Refrescar</span>
        </button>
      </div>

      {/* PESTAÑAS DE NAVEGACIÓN */}
      <div className="flex border-b border-slate-800 gap-2 mb-6">
        <button 
          onClick={() => setActiveTab('equipment')} 
          className={`px-4 py-2.5 font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'equipment' ? 'border-amber-500 text-amber-400 bg-amber-950/10' : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <Award className="w-4 h-4" /> Equipamiento C.A.N. (Badges / Tech / Estructuras)
        </button>

        <button 
          onClick={() => setActiveTab('can_config')} 
          className={`px-4 py-2.5 font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'can_config' ? 'border-cyan-500 text-cyan-400 bg-cyan-950/10' : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <Cpu className="w-4 h-4" /> Nivel C.A.N. & Ranuras Neuronales
        </button>

        <button 
          onClick={() => setActiveTab('formulas')} 
          className={`px-4 py-2.5 font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'formulas' ? 'border-purple-500 text-purple-400 bg-purple-950/10' : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <Sliders className="w-4 h-4" /> Fórmulas & Boosts
        </button>
      </div>

      {/* SELECCIÓN DE COMANDANTE */}
      <div className="mb-6 p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-cyan-400" /> Comandante Objetivo:
        </span>
        <select
          value={selectedUser?.player_id || ''}
          onChange={e => {
            const u = users.find(usr => usr.player_id === e.target.value);
            if (u) setSelectedUser(u);
          }}
          className="bg-slate-900 border border-slate-700 text-amber-300 font-bold px-3 py-1.5 rounded text-xs outline-none cursor-pointer uppercase"
        >
          {users.map(u => (
            <option key={u.player_id} value={u.player_id}>
              {u.username || 'Comandante'} (C.A.N. LVL {u.can_level}) - ID: {u.player_id}
            </option>
          ))}
        </select>
      </div>

      {/* TAB 1: EQUIPAMIENTO DE C.A.N. */}
      {activeTab === 'equipment' && selectedUser && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* SECCIÓN A: BADGES (MÁXIMO 5) */}
          <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-2">
                  <Award className="w-4 h-4" /> BADGES EQUIPADAS EN C.A.N. ({equippedBadges.length} / 5)
                </span>
                <p className="text-[10px] text-slate-500 font-sans mt-0.5">
                  Límite estricto: Máximo 5 Badges activas a la vez. No se permiten 2 Badges del mismo tipo.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedBadgeToEquip}
                  onChange={e => setSelectedBadgeToEquip(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-slate-200 text-xs p-2 rounded outline-none cursor-pointer"
                >
                  <option value="">-- Seleccionar Badge del Catálogo --</option>
                  {catalogBadges.map(b => (
                    <option key={b.id} value={b.id}>[{b.sub_type}] {b.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => handleEquipItem('badge', selectedBadgeToEquip)}
                  disabled={!selectedBadgeToEquip || equippedBadges.length >= 5}
                  className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase rounded cursor-pointer disabled:opacity-40 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Equipar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {[0, 1, 2, 3, 4].map(slotIndex => {
                const item = equippedBadges[slotIndex];
                return (
                  <div 
                    key={slotIndex} 
                    className={`p-3 rounded-lg border text-center flex flex-col justify-between h-28 ${
                      item 
                        ? 'bg-amber-950/20 border-amber-500/50 text-amber-300' 
                        : 'bg-slate-900/40 border-dashed border-slate-800 text-slate-600'
                    }`}
                  >
                    <span className="text-[9px] font-bold uppercase text-slate-500 block">
                      RANURA {slotIndex + 1}
                    </span>

                    {item ? (
                      <div className="space-y-1 my-auto">
                        <span className="font-bold text-xs block text-amber-200 truncate">{item.item_name}</span>
                        <span className="text-[8.5px] bg-amber-950 text-amber-400 border border-amber-800/60 px-1.5 py-0.5 rounded uppercase font-bold block w-fit mx-auto">
                          {item.sub_type}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] italic my-auto block">Vacío</span>
                    )}

                    {item && (
                      <button
                        onClick={() => handleUnequipItem(item.id, item.item_name)}
                        className="text-[9px] text-red-400 hover:text-red-300 font-bold uppercase cursor-pointer flex items-center justify-center gap-1 border border-red-900/40 bg-red-950/30 py-0.5 rounded mt-1"
                      >
                        <Trash2 className="w-3 h-3" /> Desequipar
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECCIÓN B: TECNOLOGÍAS EQUIPADAS (1 POR TIPO) */}
          <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                  <Wrench className="w-4 h-4" /> TECNOLOGÍAS EQUIPADAS EN C.A.N. ({equippedTechs.length})
                </span>
                <p className="text-[10px] text-slate-500 font-sans mt-0.5">
                  Regla de Unicidad: Máximo 1 Tecnología de cada tipo activa a la vez.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedTechToEquip}
                  onChange={e => setSelectedTechToEquip(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-slate-200 text-xs p-2 rounded outline-none cursor-pointer"
                >
                  <option value="">-- Seleccionar Tecnología --</option>
                  {catalogTechs.map(t => (
                    <option key={t.id} value={t.id}>[{t.sub_type}] {t.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => handleEquipItem('technology', selectedTechToEquip)}
                  disabled={!selectedTechToEquip}
                  className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase rounded cursor-pointer disabled:opacity-40 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Equipar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {equippedTechs.length === 0 ? (
                <div className="col-span-3 p-6 text-center text-slate-600 italic border border-dashed border-slate-800 rounded-lg">
                  Sin tecnologías equipadas en C.A.N.
                </div>
              ) : (
                equippedTechs.map(tech => (
                  <div key={tech.id} className="p-3 bg-cyan-950/20 border border-cyan-800/40 rounded-lg flex justify-between items-center">
                    <div>
                      <strong className="text-cyan-200 text-xs block">{tech.item_name}</strong>
                      <span className="text-[9px] text-cyan-500 uppercase font-bold">Tipo: {tech.sub_type}</span>
                    </div>
                    <button
                      onClick={() => handleUnequipItem(tech.id, tech.item_name)}
                      className="p-1.5 text-red-400 hover:text-red-300 bg-red-950/30 border border-red-900/40 rounded cursor-pointer"
                      title="Desequipar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* SECCIÓN C: ESTRUCTURAS EQUIPADAS (1 POR TIPO) */}
          <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-bold text-purple-400 uppercase tracking-widest flex items-center gap-2">
                  <Building className="w-4 h-4" /> ESTRUCTURAS EQUIPADAS EN C.A.N. ({equippedStructures.length})
                </span>
                <p className="text-[10px] text-slate-500 font-sans mt-0.5">
                  Regla de Unicidad: Máximo 1 Estructura de cada tipo activa a la vez.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedStructureToEquip}
                  onChange={e => setSelectedStructureToEquip(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-slate-200 text-xs p-2 rounded outline-none cursor-pointer"
                >
                  <option value="">-- Seleccionar Estructura --</option>
                  {catalogStructures.map(s => (
                    <option key={s.id} value={s.id}>[{s.sub_type}] {s.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => handleEquipItem('structure', selectedStructureToEquip)}
                  disabled={!selectedStructureToEquip}
                  className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase rounded cursor-pointer disabled:opacity-40 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Equipar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {equippedStructures.length === 0 ? (
                <div className="col-span-3 p-6 text-center text-slate-600 italic border border-dashed border-slate-800 rounded-lg">
                  Sin estructuras equipadas en C.A.N.
                </div>
              ) : (
                equippedStructures.map(struct => (
                  <div key={struct.id} className="p-3 bg-purple-950/20 border border-purple-800/40 rounded-lg flex justify-between items-center">
                    <div>
                      <strong className="text-purple-200 text-xs block">{struct.item_name}</strong>
                      <span className="text-[9px] text-purple-500 uppercase font-bold">Tipo: {struct.sub_type}</span>
                    </div>
                    <button
                      onClick={() => handleUnequipItem(struct.id, struct.item_name)}
                      className="p-1.5 text-red-400 hover:text-red-300 bg-red-950/30 border border-red-900/40 rounded cursor-pointer"
                      title="Desequipar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: CONFIGURACIÓN C.A.N. & NIVELACIÓN */}
      {activeTab === 'can_config' && selectedUser && (
        <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-5 animate-fadeIn">
          <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-widest border-b border-slate-800 pb-2">
            ⚙️ NIVELACIÓN Y RANURAS NEURONALES: {selectedUser.username}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-cyan-400 block mb-1">Nivel C.A.N.</label>
              <input
                type="number"
                min="1"
                max="100"
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-cyan-300 font-mono focus:border-cyan-500 outline-none"
                value={selectedUser.can_level}
                onChange={e => setSelectedUser({ ...selectedUser, can_level: Number(e.target.value) })}
              />
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wider text-cyan-400 block mb-1">Experiencia (XP C.A.N.)</label>
              <input
                type="number"
                min="0"
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-cyan-300 font-mono focus:border-cyan-500 outline-none"
                value={selectedUser.can_xp}
                onChange={e => setSelectedUser({ ...selectedUser, can_xp: Number(e.target.value) })}
              />
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wider text-emerald-400 block mb-1">Ranuras Neuronales Activas</label>
              <input
                type="number"
                min="1"
                max="10"
                className="w-full bg-slate-900 border border-emerald-900/60 rounded p-2 text-emerald-300 font-mono focus:border-emerald-500 outline-none"
                value={selectedUser.neural_slots}
                onChange={e => setSelectedUser({ ...selectedUser, neural_slots: Number(e.target.value) })}
              />
            </div>
          </div>

          <button
            onClick={handleSaveUserCANConfig}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 px-4 rounded flex items-center justify-center gap-2 cursor-pointer transition-colors text-xs"
          >
            <Save className="w-4 h-4" /> GUARDAR PARÁMETROS EN EL SERVIDOR
          </button>
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
                Reglas de Boost Acumulable
              </span>
              <div>
                <label className="text-[9.5px] text-slate-400 block mb-0.5">Tope Máximo de Boost Acumulable (Horas):</label>
                <input
                  type="number"
                  className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-amber-300 font-mono"
                  value={formulas.boostCapHours}
                  onChange={e => setFormulas({ ...formulas, boostCapHours: Number(e.target.value) })}
                />
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