import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { OutcomeConfig } from '../types';
import { 
  Zap, Search, Plus, Trash2, Edit3, Copy, RefreshCw, Layers, Shield, 
  Cpu, Rocket, Building, Wrench, Award, Bot, Sparkles, Check, X, AlertTriangle, Save 
} from 'lucide-react';

type AssetTabId =
  | 'ships'
  | 'structures'
  | 'technologies'
  | 'defenses'
  | 'astrobots'
  | 'tools'
  | 'badges'
  | 'general_effects';

interface TabDefinition {
  id: AssetTabId;
  label: string;
  icon: React.ReactNode;
}

const ASSET_TABS: TabDefinition[] = [
  { id: 'ships',           label: 'Naves',                    icon: <Rocket size={14} /> },
  { id: 'structures',      label: 'Estructuras',              icon: <Building size={14} /> },
  { id: 'technologies',    label: 'Tecnologías',              icon: <Cpu size={14} /> },
  { id: 'defenses',        label: 'Defensas',                 icon: <Shield size={14} /> },
  { id: 'astrobots',       label: 'Astrobots',                icon: <Bot size={14} /> },
  { id: 'tools',           label: 'Tools (Minería)',          icon: <Wrench size={14} /> },
  { id: 'badges',          label: 'Badges',                   icon: <Award size={14} /> },
  { id: 'general_effects', label: 'Efectos Grales. / Consum.', icon: <Sparkles size={14} /> },
];

interface SkillRecord {
  skill_code: string;
  base_name: string;
  tier_level?: number;
  display_suffix?: string;
  asset_tab: AssetTabId;
  target_entity: string;
  rarity: string;
  stat_affected: string | null;
  modifier_value: number | null;
  math_operator: string;
  license_group: string | null;
  duration_type: string | null;
  duration_value: number | null;
  outcome_config: OutcomeConfig | null;
  sub_type?: string;
  astrobot_role?: string;
  source_type?: string;
  scope_type?: string;
  allowed_resources?: string[];
}

const STAT_PRESETS: Record<AssetTabId, string[]> = {
  ships: ['attack_standard', 'attack_laser', 'attack_ionic', 'attack_plasma', 'attack_graviton', 'shield', 'defense', 'resistance', 'speed_boost', 'cargo_capacity', 'fleet_space'],
  structures: ['metal_production', 'crystal_production', 'deuterium_production', 'energy_consumption', 'building_speed', 'storage_capacity'],
  technologies: ['research_speed', 'fleet_speed_boost', 'weapon_technology_boost', 'shield_technology_boost', 'armor_technology_boost', 'resource_efficiency'],
  defenses: ['defense_resistance', 'shield', 'defense', 'interception_rate', 'counter_attack_damage'],
  astrobots: ['automation_efficiency', 'repair_rate', 'energy_efficiency', 'salvage_yield'],
  tools: ['mining_yield_metal', 'mining_yield_crystal', 'mining_yield_deuterium', 'tool_durability', 'overheat_reduction'],
  badges: ['can_slot_usage', 'expedition_luck', 'all_stats_boost', 'cooldown_reduction'],
  general_effects: ['instant_repair', 'temporary_shield_boost', 'xp_multiplier', 'credit_multiplier']
};

export const SkillManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AssetTabId>('ships');
  const [skills, setSkills] = useState<SkillRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const [selectedSkill, setSelectedSkill] = useState<SkillRecord | null>(null);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const emptyForm = (): Partial<SkillRecord> => ({
    skill_code: '', 
    base_name: '', 
    rarity: 'Common', 
    tier_level: 1,
    display_suffix: 'I', 
    stat_affected: STAT_PRESETS[activeTab][0] || 'attack_standard', 
    modifier_value: 0.05,
    math_operator: 'add', 
    target_entity: activeTab,
    license_group: null, 
    duration_type: 'permanent', 
    duration_value: null,
    outcome_config: null, 
    sub_type: 'Combat', 
    astrobot_role: 'Attack',
    source_type: 'Consumable', 
    scope_type: 'Global Account',
    allowed_resources: ['metal', 'crystal', 'deuterium'],
  });

  const [formData, setFormData] = useState<Partial<SkillRecord>>(emptyForm());

  useEffect(() => {
    if (isFormOpen) {
      setFormData(selectedSkill ? { ...selectedSkill } : emptyForm());
    }
  }, [isFormOpen, selectedSkill]);

  const setField = <K extends keyof SkillRecord>(key: K, value: SkillRecord[K]) =>
    setFormData(prev => ({ ...prev, [key]: value }));

  const toggleResource = (resource: string) => {
    const current = (formData.allowed_resources ?? []) as string[];
    const next = current.includes(resource)
      ? current.filter(r => r !== resource)
      : [...current, resource];
    setFormData(prev => ({ ...prev, allowed_resources: next }));
  };

  const [selectedSkillCodes, setSelectedSkillCodes] = useState<string[]>([]);

  const fetchSkillsByTab = async (tab: AssetTabId) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: supabaseError } = await supabase
        .from('matrix_skills_registry')
        .select('*')
        .eq('asset_tab', tab)
        .order('base_name',  { ascending: true })
        .order('tier_level', { ascending: true });

      if (supabaseError) throw supabaseError;
      setSkills((data || []) as SkillRecord[]);
      setSearchTerm('');
      setExpandedGroups({});
      setSelectedSkillCodes([]);
    } catch (err: any) {
      setError(err.message || 'Error al recuperar las habilidades.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchSkillsByTab(activeTab); 
  }, [activeTab]);

  const handleSaveSkill = async (formDataToSave: Partial<SkillRecord>) => {
    if (!formDataToSave.skill_code?.trim() || !formDataToSave.base_name?.trim()) {
      setError("El skill_code y el base_name son obligatorios.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const payload = {
        ...formDataToSave,
        asset_tab: activeTab,
        skill_code: formDataToSave.skill_code.trim(),
        base_name: formDataToSave.base_name.trim(),
        tier_level: Number(formDataToSave.tier_level || 1),
        rarity: formDataToSave.rarity || 'Common',
        modifier_value: Number(formDataToSave.modifier_value || 0),
        duration_value: formDataToSave.duration_value ? Number(formDataToSave.duration_value) : null
      };

      const { error: upsertError } = await supabase
        .from('matrix_skills_registry')
        .upsert([payload]);
        
      if (upsertError) throw upsertError;

      await fetchSkillsByTab(activeTab);
      setIsFormOpen(false);
      setSelectedSkill(null);
    } catch (err: any) {
      setError(`[Fallo de Guardado]: ${err.message || 'No se pudo guardar la habilidad.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSkill = async (skill: SkillRecord) => {
    if (!window.confirm(`⚠️ ¿Eliminar "${skill.skill_code}" de forma permanente?`)) return;
    setError(null);
    try {
      setLoading(true);
      const { error: deleteError } = await supabase
        .from('matrix_skills_registry')
        .delete()
        .eq('skill_code', skill.skill_code);

      if (deleteError) throw deleteError;

      if (selectedSkill?.skill_code === skill.skill_code) {
        setSelectedSkill(null);
        setIsFormOpen(false);
      }

      await fetchSkillsByTab(activeTab);
    } catch (err: any) {
      setError(`[Error de Eliminación]: ${err.message}`);
      setLoading(false);
    }
  };

  const handleCloneSkill = async (skill: SkillRecord) => {
    setError(null);
    const cloned: SkillRecord = {
      ...skill,
      skill_code: `${skill.skill_code}_copy_${Date.now().toString(36)}`,
      base_name: `${skill.base_name} (Copia)`
    };
    try {
      setLoading(true);
      const { error: cloneError } = await supabase
        .from('matrix_skills_registry')
        .upsert([cloned]);
        
      if (cloneError) throw cloneError;
      
      await fetchSkillsByTab(activeTab);
    } catch (err: any) {
      setError(`[Error de Clonación]: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedSkillCodes.length === 0) return;
    if (!window.confirm(`🚨 ¿Eliminar ${selectedSkillCodes.length} habilidad(es) seleccionadas? Esta acción no se puede deshacer.`)) return;
    setError(null);
    try {
      setLoading(true);
      const { error: bulkDeleteError } = await supabase
        .from('matrix_skills_registry')
        .delete()
        .in('skill_code', selectedSkillCodes);

      if (bulkDeleteError) throw bulkDeleteError;

      setSelectedSkillCodes([]);
      await fetchSkillsByTab(activeTab);
    } catch (err: any) {
      setError(`[Error Masivo]: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleTierSelection = (code: string) => {
    setSelectedSkillCodes(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const toggleGroupSelection = (tiers: SkillRecord[]) => {
    const codes = tiers.map(t => t.skill_code);
    const allSelected = codes.every(c => selectedSkillCodes.includes(c));
    if (allSelected) {
      setSelectedSkillCodes(prev => prev.filter(c => !codes.includes(c)));
    } else {
      setSelectedSkillCodes(prev => [...new Set([...prev, ...codes])]);
    }
  };

  const groupedSkills = useMemo(() => {
    const filtered = skills.filter(skill => {
      const s = searchTerm.toLowerCase();
      return (
        skill.base_name.toLowerCase().includes(s) ||
        skill.skill_code.toLowerCase().includes(s) ||
        (skill.stat_affected && skill.stat_affected.toLowerCase().includes(s))
      );
    });
    const groups: Record<string, SkillRecord[]> = {};
    filtered.forEach(skill => {
      if (!groups[skill.base_name]) groups[skill.base_name] = [];
      groups[skill.base_name].push(skill);
    });
    return groups;
  }, [skills, searchTerm]);

  const toggleGroup = (baseName: string) =>
    setExpandedGroups(prev => ({ ...prev, [baseName]: !prev[baseName] }));

  return (
    <div className="p-4 sm:p-6 bg-[#0b0f19] text-slate-100 font-mono text-xs text-left select-none min-h-screen">

      {/* ENCABEZADO */}
      <header className="mb-6 border-b border-slate-800 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-amber-400 flex items-center gap-2">
            <Zap className="text-amber-500 animate-pulse" size={20} />
            GESTOR DE SKILLS Y MODIFICADORES C.A.N.
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Galaxy Dust Online — Consola Central de Mando Administrativo y Matriz de Habilidades Reales
          </p>
        </div>

        <button 
          onClick={() => fetchSkillsByTab(activeTab)} 
          className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-amber-400 font-bold transition-all flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          <span>Sincronizar Tablas</span>
        </button>
      </header>

      {/* NAVEGACIÓN DE CATEGORÍAS */}
      <nav className="flex flex-wrap gap-1.5 mb-6 border-b border-slate-800/80 pb-3">
        {ASSET_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setIsFormOpen(false); setSelectedSkill(null); }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer border ${
              activeTab === tab.id
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/40 shadow-lg shadow-amber-950/20'
                : 'bg-slate-950 text-slate-500 border-slate-900 hover:bg-slate-900 hover:text-slate-300'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* ALERTAS DE ERROR */}
      {error && (
        <div className="mb-4 p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-red-300 text-xs flex items-center justify-between font-mono animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-200 cursor-pointer p-1">✕</button>
        </div>
      )}

      {/* BARRA DE ACCIONES EN LOTE */}
      {selectedSkillCodes.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-amber-950/30 border border-amber-500/40 rounded-xl font-mono animate-fadeIn">
          <span className="text-amber-300 text-xs font-bold">
            ⚡ {selectedSkillCodes.length} habilidad(es) seleccionada(s)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedSkillCodes([])}
              className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs rounded transition-colors cursor-pointer border border-slate-800"
            >
              Deseleccionar
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1 bg-red-650 hover:bg-red-500 text-white font-bold text-xs rounded transition-colors cursor-pointer shadow-lg"
            >
              🗑 Eliminar Seleccionadas
            </button>
          </div>
        </div>
      )}

      {/* LAYOUT PRINCIPAL */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">

        {/* COLUMNA IZQUIERDA: LISTA JERÁRQUICA */}
        <div className="xl:col-span-2 bg-[#090d16] border border-slate-850 rounded-xl p-4 shadow-2xl space-y-4">

          {/* BUSCADOR Y NUEVO SKILL */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-center pb-2 border-b border-slate-900">
            <div className="relative w-full sm:w-80">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar por código, nombre o stat..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-8 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500 uppercase font-mono"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300 text-[10px] cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              onClick={() => { setSelectedSkill(null); setIsFormOpen(true); }}
              className="w-full sm:w-auto px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black uppercase text-xs rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-amber-950/30"
            >
              <Plus size={14} /> Registrar Nueva Habilidad
            </button>
          </div>

          {/* CONTENIDO DE LA LISTA */}
          {loading ? (
            <div className="flex justify-center items-center h-64 text-amber-400 text-xs gap-2 font-mono">
              <RefreshCw className="animate-spin" size={16} />
              Sincronizando matriz de habilidades...
            </div>
          ) : Object.keys(groupedSkills).length === 0 ? (
            <div className="flex flex-col justify-center items-center h-48 text-slate-600 text-xs border border-dashed border-slate-800 rounded-xl font-mono gap-2">
              <Layers size={24} className="text-slate-700" />
              <span>No se encontraron habilidades en el catálogo [{activeTab.toUpperCase()}].</span>
            </div>
          ) : (
            <div className="space-y-2 max-h-[650px] overflow-y-auto pr-1 custom-scrollbar">
              {(Object.entries(groupedSkills) as [string, SkillRecord[]][]).map(([baseName, tiers]) => {
                const isExpanded = !!expandedGroups[baseName];
                const tierCodes  = tiers.map(t => t.skill_code);
                const allGroupSelected = tierCodes.every(c => selectedSkillCodes.includes(c));
                const someGroupSelected = tierCodes.some(c => selectedSkillCodes.includes(c));

                return (
                  <div key={baseName} className="border border-slate-850/80 bg-slate-950/60 rounded-xl overflow-hidden transition-all">

                    {/* Fila Padre (base_name) */}
                    <div className="flex items-center gap-3 p-3 bg-slate-900/60 hover:bg-slate-900 transition-colors border-b border-slate-900">
                      <input
                        type="checkbox"
                        checked={allGroupSelected}
                        ref={el => { if (el) el.indeterminate = someGroupSelected && !allGroupSelected; }}
                        onChange={() => toggleGroupSelection(tiers)}
                        onClick={e => e.stopPropagation()}
                        className="w-3.5 h-3.5 accent-amber-500 cursor-pointer shrink-0"
                      />
                      
                      <div
                        onClick={() => toggleGroup(baseName)}
                        className="flex flex-1 items-center justify-between cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-amber-500 text-[10px] font-bold">{isExpanded ? '▼' : '▶'}</span>
                          <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">{baseName}</span>
                        </div>
                        <span className="px-2 py-0.5 bg-slate-950 text-slate-400 border border-slate-800 rounded text-[9.5px]">
                          {tiers.length} {tiers.length === 1 ? 'Tier' : 'Tiers'}
                        </span>
                      </div>
                    </div>

                    {/* Filas Hijas (Tiers del Skill) */}
                    {isExpanded && (
                      <div className="bg-[#050811] divide-y divide-slate-900 px-3 py-1">
                        {tiers.map(tier => {
                          const isTierSelected = selectedSkillCodes.includes(tier.skill_code);
                          return (
                            <div
                              key={tier.skill_code}
                              className={`py-2 flex items-center gap-3 text-[11px] group transition-colors ${
                                isTierSelected ? 'bg-amber-950/20' : ''
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isTierSelected}
                                onChange={() => toggleTierSelection(tier.skill_code)}
                                className="w-3 h-3 accent-amber-500 cursor-pointer shrink-0"
                              />

                              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono text-cyan-300 font-bold truncate">{tier.skill_code}</span>
                                  {tier.display_suffix && (
                                    <span className="px-1.5 py-0.2 bg-amber-950 text-amber-400 border border-amber-800 rounded text-[9px] font-bold">
                                      {tier.display_suffix}
                                    </span>
                                  )}
                                  <span className="text-[9px] bg-slate-900 text-slate-400 px-1.5 py-0.2 rounded border border-slate-800 uppercase">
                                    Tier {tier.tier_level || 1}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-500 italic">
                                  Rareza: <strong className="text-slate-300">{tier.rarity}</strong> | Stat: <strong className="text-amber-400">{tier.stat_affected || 'N/A'}</strong> ({tier.math_operator} {tier.modifier_value})
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity shrink-0">
                                <button
                                  onClick={() => { setSelectedSkill(tier); setIsFormOpen(true); }}
                                  title="Editar Habilidad"
                                  className="p-1.5 bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-slate-300 rounded border border-slate-800 transition-colors cursor-pointer"
                                >
                                  <Edit3 size={12} />
                                </button>
                                <button
                                  onClick={() => handleCloneSkill(tier)}
                                  title="Clonar Habilidad"
                                  className="p-1.5 bg-slate-900 hover:bg-cyan-600 hover:text-white text-slate-300 rounded border border-slate-800 transition-colors cursor-pointer"
                                >
                                  <Copy size={12} />
                                </button>
                                <button
                                  onClick={() => handleDeleteSkill(tier)}
                                  title="Eliminar Habilidad"
                                  className="p-1.5 bg-slate-900 hover:bg-red-600 hover:text-white text-slate-500 rounded border border-slate-800 transition-colors cursor-pointer"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* COLUMNA DERECHA: FORMULARIO MUTABLE CONTEXTUAL */}
        <div className="bg-[#090d16] border border-slate-850 rounded-xl p-5 shadow-2xl space-y-4">
          {isFormOpen ? (
            <div className="space-y-4 animate-fadeIn">

              <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Edit3 size={14} />
                  {selectedSkill ? `Modificando: ${selectedSkill.skill_code}` : 'Alta de Nuevo Nodo de Habilidad'}
                </span>
                <button
                  onClick={() => { setIsFormOpen(false); setSelectedSkill(null); }}
                  className="text-slate-500 hover:text-slate-200 cursor-pointer p-1"
                >
                  <X size={14} />
                </button>
              </div>

              {/* SECCIÓN A: IDENTIFICACIÓN GENERAL */}
              <div className="space-y-3 bg-slate-950/80 p-3.5 rounded-xl border border-slate-850">
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest block border-b border-slate-900 pb-1">
                  § 1 — Identificación y Tier
                </span>

                <div>
                  <label className="block text-[9.5px] text-slate-400 uppercase font-bold mb-1">skill_code (PK Única):</label>
                  <input
                    type="text"
                    value={formData.skill_code ?? ''}
                    onChange={e => setField('skill_code', e.target.value)}
                    disabled={!!selectedSkill}
                    placeholder="ej: attack_boost_kinetic_t1"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-xs font-mono text-cyan-300 placeholder-slate-600 focus:outline-none focus:border-amber-500 disabled:opacity-40 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-[9.5px] text-slate-400 uppercase font-bold mb-1">base_name (Nombre del Grupo):</label>
                  <input
                    type="text"
                    value={formData.base_name ?? ''}
                    onChange={e => setField('base_name', e.target.value)}
                    placeholder="ej: Attack Boost Kinetic"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 uppercase"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9.5px] text-slate-400 uppercase font-bold mb-1">Tier Level:</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={formData.tier_level ?? 1}
                      onChange={e => setField('tier_level', Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-amber-400 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[9.5px] text-slate-400 uppercase font-bold mb-1">Display Suffix:</label>
                    <input
                      type="text"
                      value={formData.display_suffix ?? ''}
                      onChange={e => setField('display_suffix', e.target.value)}
                      placeholder="I, II, III..."
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-white uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9.5px] text-slate-400 uppercase font-bold mb-1">Rareza Base:</label>
                  <select
                    value={formData.rarity ?? 'Common'}
                    onChange={e => setField('rarity', e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-white focus:outline-none cursor-pointer"
                  >
                    {['Common','Uncommon','Rare','Epic','Legendary','Phantom','Exclusive'].map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* SECCIÓN B: CÁLCULO Y EFECTOS */}
              <div className="space-y-3 bg-slate-950/80 p-3.5 rounded-xl border border-slate-850">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block border-b border-slate-900 pb-1">
                  § 2 — Parámetros de Cálculo ({activeTab.toUpperCase()})
                </span>

                <div>
                  <label className="block text-[9.5px] text-slate-400 uppercase font-bold mb-1">Stat Afectado (stat_affected):</label>
                  <select
                    value={formData.stat_affected ?? ''}
                    onChange={e => setField('stat_affected', e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-amber-300 font-bold focus:outline-none cursor-pointer mb-1"
                  >
                    {(STAT_PRESETS[activeTab] || []).map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>

                  <input
                    type="text"
                    placeholder="O escribe un stat personalizado..."
                    value={formData.stat_affected ?? ''}
                    onChange={e => setField('stat_affected', e.target.value)}
                    className="w-full px-2.5 py-1 bg-slate-950 border border-slate-800 rounded text-[10px] text-slate-300 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9.5px] text-slate-400 uppercase font-bold mb-1">Operador Matemático:</label>
                    <select
                      value={formData.math_operator ?? 'add'}
                      onChange={e => setField('math_operator', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-cyan-300 font-bold cursor-pointer"
                    >
                      <option value="add">add (Suma / Decimal %)</option>
                      <option value="multiply">multiply (Multiplicador)</option>
                      <option value="override">override (Fijo)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9.5px] text-slate-400 uppercase font-bold mb-1">Valor Modificador:</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.modifier_value ?? 0}
                      onChange={e => setField('modifier_value', Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-emerald-400 font-black"
                    />
                    <span className="text-[8px] text-slate-500 block mt-0.5">Ej: 0.05 = +5% de incremento</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-900">
                  <div>
                    <label className="block text-[9.5px] text-slate-400 uppercase font-bold mb-1">Tipo de Duración:</label>
                    <select
                      value={formData.duration_type ?? 'permanent'}
                      onChange={e => setField('duration_type', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-white cursor-pointer"
                    >
                      <option value="permanent">Permanente</option>
                      <option value="temporary_seconds">Temporal (Segundos)</option>
                      <option value="temporary_hours">Temporal (Horas)</option>
                      <option value="charges">Cargas de Uso</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9.5px] text-slate-400 uppercase font-bold mb-1">Valor de Duración:</label>
                    <input
                      type="number"
                      placeholder="Ej: 3600"
                      value={formData.duration_value ?? ''}
                      onChange={e => setField('duration_value', e.target.value ? Number(e.target.value) : null)}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              {/* SECCIÓN C: RECURSOS Y ALCANCE */}
              <div className="space-y-3 bg-slate-950/80 p-3.5 rounded-xl border border-slate-850">
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block border-b border-slate-900 pb-1">
                  § 3 — Recursos Permitidos y Alcance
                </span>

                <div>
                  <label className="block text-[9.5px] text-slate-400 uppercase font-bold mb-1.5">Recursos Afectados / Habilitados:</label>
                  <div className="flex flex-wrap gap-2 text-[10px]">
                    {['metal', 'crystal', 'deuterium', 'dark_matter', 'omniplate', 'orichaltron'].map(res => {
                      const isSelected = (formData.allowed_resources || []).includes(res);
                      return (
                        <button
                          key={res}
                          type="button"
                          onClick={() => toggleResource(res)}
                          className={`px-2.5 py-1 rounded border font-bold uppercase transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-purple-950/80 border-purple-500 text-purple-300' 
                              : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          {res} {isSelected && '✓'}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[9.5px] text-slate-400 uppercase font-bold mb-1">Alcance (scope_type):</label>
                    <select
                      value={formData.scope_type ?? 'Global Account'}
                      onChange={e => setField('scope_type', e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-white cursor-pointer"
                    >
                      <option value="Global Account">Global Account</option>
                      <option value="Specific Asset">Specific Asset</option>
                      <option value="Squad Fleet">Squad Fleet</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9.5px] text-slate-400 uppercase font-bold mb-1">Sub-Categoría Táctica:</label>
                    <input
                      type="text"
                      value={formData.sub_type ?? ''}
                      onChange={e => setField('sub_type', e.target.value)}
                      placeholder="Combat, Mining, Hybrid..."
                      className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              {/* BOTONES DE GUARDADO */}
              <div className="flex gap-2 pt-2 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => handleSaveSkill(formData)}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs uppercase rounded-xl transition-all cursor-pointer shadow-lg shadow-amber-950/30 flex items-center justify-center gap-1.5"
                >
                  <Save size={14} />
                  {isSubmitting ? 'Persistiendo...' : 'Persistir en Postgres'}
                </button>

                <button
                  type="button"
                  onClick={() => { setIsFormOpen(false); setSelectedSkill(null); }}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 font-bold text-xs uppercase rounded-xl transition-colors cursor-pointer border border-slate-800"
                >
                  Cancelar
                </button>
              </div>

            </div>
          ) : (
            <div className="h-full flex flex-col justify-center items-center text-center p-8 text-slate-600 border border-dashed border-slate-850 rounded-xl min-h-[350px] space-y-3 font-sans">
              <Zap size={32} className="text-slate-800 animate-pulse" />
              <p className="text-xs text-slate-500 font-mono">
                Selecciona una habilidad de la lista izquierda o presiona <strong className="text-amber-400">+ Registrar Nueva Habilidad</strong> para desplegar la consola de parametrización.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default SkillManager;