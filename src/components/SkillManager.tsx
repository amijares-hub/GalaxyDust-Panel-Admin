import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { OutcomeConfig } from '../types';

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
  icon: string;
}

const ASSET_TABS: TabDefinition[] = [
  { id: 'ships',           label: 'Naves',                    icon: '🚀' },
  { id: 'structures',      label: 'Estructuras',              icon: '🏢' },
  { id: 'technologies',    label: 'Tecnologías',              icon: '🔬' },
  { id: 'defenses',        label: 'Defensas',                 icon: '🛡️' },
  { id: 'astrobots',       label: 'Astrobots',                icon: '🤖' },
  { id: 'tools',           label: 'Tools (Minería)',          icon: '🔧' },
  { id: 'badges',          label: 'Badges',                   icon: '🏅' },
  { id: 'general_effects', label: 'Efectos Grales. / Consum.', icon: '🌀' },
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

/** Invoca la Edge Function centralizada de administración */
const invokeAdminAction = async (body: Record<string, unknown>) => {
  const { error } = await supabase.functions.invoke('save-admin-item', { body });
  if (error) throw error;
};

export const SkillManager: React.FC = () => {
  // Datos y estado de la vista
  const [activeTab, setActiveTab] = useState<AssetTabId>('ships');
  const [skills, setSkills] = useState<SkillRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // UI Búsqueda y acordeones
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Formulario de edición
  const [selectedSkill, setSelectedSkill] = useState<SkillRecord | null>(null);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Estado controlado del formulario
  const emptyForm = (): Partial<SkillRecord> => ({
    skill_code: '', 
    base_name: '', 
    rarity: 'Common', 
    tier_level: 1,
    display_suffix: 'I', 
    stat_affected: '', 
    modifier_value: 0,
    math_operator: 'add', 
    target_entity: activeTab,
    license_group: null, 
    duration_type: 'permanent', 
    duration_value: null,
    outcome_config: null, 
    sub_type: '', 
    astrobot_role: 'Attack',
    source_type: 'Consumable', 
    scope_type: 'Global Account',
    allowed_resources: [],
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

  // Selección múltiple
  const [selectedSkillCodes, setSelectedSkillCodes] = useState<string[]>([]);

  // Fetch de habilidades
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
      setSkills(data || []);
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

  // Guardado (upsert)
  const handleSaveSkill = async (formDataToSave: Partial<SkillRecord>) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await invokeAdminAction({
        action: 'upsert',
        tableName: 'matrix_skills_registry',
        recordData: { ...formDataToSave, asset_tab: activeTab },
      });
      await fetchSkillsByTab(activeTab);
      setIsFormOpen(false);
      setSelectedSkill(null);
    } catch (err: any) {
      setError(`[Fallo de Validación]: ${err.message || 'No se pudo guardar.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Eliminación individual
  const handleDeleteSkill = async (skill: SkillRecord) => {
    if (!window.confirm(`⚠️ ¿Eliminar "${skill.skill_code}" de forma permanente?`)) return;
    setError(null);
    try {
      await invokeAdminAction({
        action: 'delete',
        tableName: 'matrix_skills_registry',
        recordId: skill.skill_code,
        primaryKeyCol: 'skill_code',
      });
      await fetchSkillsByTab(activeTab);
    } catch (err: any) {
      setError(`[Error de Eliminación]: ${err.message}`);
    }
  };

  // Clonación individual
  const handleCloneSkill = async (skill: SkillRecord) => {
    setError(null);
    const cloned: SkillRecord = {
      ...skill,
      skill_code: `${skill.skill_code}_copy`,
    };
    try {
      await invokeAdminAction({
        action: 'upsert',
        tableName: 'matrix_skills_registry',
        recordData: cloned,
      });
      await fetchSkillsByTab(activeTab);
    } catch (err: any) {
      setError(`[Error de Clonación]: ${err.message}`);
    }
  };

  // Eliminación masiva
  const handleBulkDelete = async () => {
    if (selectedSkillCodes.length === 0) return;
    if (!window.confirm(`🚨 ¿Eliminar ${selectedSkillCodes.length} skill(s) seleccionados? Esta acción no se puede deshacer.`)) return;
    setError(null);
    try {
      await invokeAdminAction({
        action: 'bulk_delete',
        tableName: 'matrix_skills_registry',
        recordIds: selectedSkillCodes,
        primaryKeyCol: 'skill_code',
      });
      await fetchSkillsByTab(activeTab);
    } catch (err: any) {
      setError(`[Error Masivo]: ${err.message}`);
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

  // Filtrado y agrupación por base_name
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
    <div className="bg-[#0b0f19] text-slate-100 p-3 sm:p-6 font-sans text-left select-none">

      {/* Encabezado */}
      <header className="mb-6 border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-100 font-mono">
          GESTOR DE SKILLS Y MODIFICADORES C.A.N.
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Galaxy Dust Online — Consola de Mando Administrativo y Matriz de Habilidades
        </p>
      </header>

      {/* Navegación de Pestañas */}
      <nav className="flex flex-wrap gap-1.5 mb-6 border-b border-slate-800/60 pb-3">
        {ASSET_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20 font-bold'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Alerta de Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-950/40 border border-red-800/50 rounded-lg text-red-200 text-xs flex items-start gap-2 font-mono">
          <span className="mt-0.5 shrink-0">⛔</span>
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-200 cursor-pointer">✕</button>
        </div>
      )}

      {/* BARRA DE ACCIONES MASIVAS */}
      {selectedSkillCodes.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-amber-950/40 border border-amber-700/40 rounded-xl font-mono">
          <span className="text-amber-300 text-xs font-semibold">
            ⚡ {selectedSkillCodes.length} elemento{selectedSkillCodes.length > 1 ? 's' : ''} seleccionado{selectedSkillCodes.length > 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedSkillCodes([])}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-md transition-colors cursor-pointer"
            >
              Deseleccionar todo
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1 bg-red-700 hover:bg-red-600 text-white font-bold text-xs rounded-md transition-colors shadow-lg shadow-red-900/30 cursor-pointer"
            >
              🗑 Eliminar ({selectedSkillCodes.length})
            </button>
          </div>
        </div>
      )}

      {/* Layout Principal */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">

        {/* COLUMNA IZQUIERDA: Lista jerárquica */}
        <div className="xl:col-span-2 bg-[#0d1321] border border-slate-800/80 rounded-xl p-4 shadow-xl">

          {/* Buscador + botón nuevo */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-center mb-4">
            <div className="relative w-full sm:max-w-xs font-mono">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 text-xs">🔍</span>
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar skill base o código..."
                className="w-full pl-8 pr-8 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors uppercase"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-500 hover:text-slate-300 text-[10px] cursor-pointer"
                >✕</button>
              )}
            </div>
            <button
              onClick={() => { setSelectedSkill(null); setIsFormOpen(true); }}
              className="w-full sm:w-auto px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold font-mono text-xs rounded-md transition-colors shadow cursor-pointer uppercase"
            >
              + Nuevo Skill
            </button>
          </div>

          {/* Lista */}
          {loading ? (
            <div className="flex justify-center items-center h-64 text-slate-400 text-xs gap-2 font-mono">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-400" />
              Sincronizando registros...
            </div>
          ) : Object.keys(groupedSkills).length === 0 ? (
            <div className="flex justify-center items-center h-48 text-slate-500 text-xs border border-dashed border-slate-800 rounded-lg font-mono">
              No se encontraron coincidencias para la categoría seleccionada.
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1 font-mono">
              {(Object.entries(groupedSkills) as [string, SkillRecord[]][]).map(([baseName, tiers]) => {
                const isExpanded = !!expandedGroups[baseName];
                const tierCodes  = tiers.map(t => t.skill_code);
                const allGroupSelected = tierCodes.every(c => selectedSkillCodes.includes(c));
                const someGroupSelected = tierCodes.some(c => selectedSkillCodes.includes(c));

                return (
                  <div key={baseName} className="border border-slate-800/40 bg-slate-950/40 rounded-lg overflow-hidden">

                    {/* Fila Padre (base_name) */}
                    <div className="flex items-center gap-2 p-3 bg-slate-900/40 hover:bg-slate-900/80 transition-colors border-b border-transparent">
                      <input
                        type="checkbox"
                        checked={allGroupSelected}
                        ref={el => { if (el) el.indeterminate = someGroupSelected && !allGroupSelected; }}
                        onChange={() => toggleGroupSelection(tiers)}
                        onClick={e => e.stopPropagation()}
                        className="w-3.5 h-3.5 accent-blue-500 cursor-pointer shrink-0"
                      />
                      
                      <div
                        onClick={() => toggleGroup(baseName)}
                        className="flex flex-1 items-center justify-between cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 text-[10px]">{isExpanded ? '▼' : '▶'}</span>
                          <span className="text-xs font-semibold text-slate-200 tracking-wide uppercase">{baseName}</span>
                        </div>
                        <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded text-[10px] font-mono">
                          {tiers.length} {tiers.length === 1 ? 'Nodo' : 'Tiers'}
                        </span>
                      </div>
                    </div>

                    {/* Filas Hijas (tiers) */}
                    {isExpanded && (
                      <div className="bg-[#090d16] divide-y divide-slate-900/60 px-3 py-1">
                        {tiers.map(tier => {
                          const isTierSelected = selectedSkillCodes.includes(tier.skill_code);
                          return (
                            <div
                              key={tier.skill_code}
                              className={`py-2 flex items-center gap-3 text-[11px] group transition-colors ${
                                isTierSelected ? 'bg-blue-950/20' : ''
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isTierSelected}
                                onChange={() => toggleTierSelection(tier.skill_code)}
                                className="w-3 h-3 accent-blue-500 cursor-pointer shrink-0"
                              />

                              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono text-slate-300 font-medium truncate">{tier.skill_code}</span>
                                  {tier.display_suffix && (
                                    <span className="px-1 bg-blue-950 text-blue-400 border border-blue-900/40 rounded text-[9px] shrink-0 font-bold">
                                      {tier.display_suffix}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-500 italic">
                                  Rarity: {tier.rarity} | Affects: {tier.stat_affected || 'N/A'}
                                </span>
                              </div>

                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                <button
                                  onClick={() => { setSelectedSkill(tier); setIsFormOpen(true); }}
                                  title="Editar registro"
                                  className="px-2 py-1 bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white rounded text-[10px] transition-all cursor-pointer"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => handleCloneSkill(tier)}
                                  title="Clonar registro"
                                  className="px-2 py-1 bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white rounded text-[10px] transition-all cursor-pointer"
                                >
                                  📋
                                </button>
                                <button
                                  onClick={() => handleDeleteSkill(tier)}
                                  title="Eliminar este registro"
                                  className="px-2 py-1 bg-slate-800 hover:bg-red-700 text-slate-500 hover:text-white rounded text-[10px] transition-all cursor-pointer"
                                >
                                  🗑
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

        {/* COLUMNA DERECHA: Formulario Mutable Contextual */}
        <div className="bg-[#0d1321] border border-slate-800/80 rounded-xl p-4 shadow-xl min-h-[350px] font-mono">
          {isFormOpen ? (
            <div className="flex flex-col gap-4">

              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  {selectedSkill ? `✏️ Modificar Registro` : '✨ Nuevo Nodo Habilidad'}
                </h2>
                <button
                  onClick={() => { setIsFormOpen(false); setSelectedSkill(null); }}
                  className="text-slate-500 hover:text-slate-300 text-xs cursor-pointer"
                >✕ Cancelar</button>
              </div>

              {/* SECCIÓN A: Campos Globales */}
              <fieldset className="space-y-3">
                <legend className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2 block">§ A — Identificación Global</legend>

                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">skill_code (PK)</label>
                  <input
                    type="text"
                    value={formData.skill_code ?? ''}
                    onChange={e => setField('skill_code', e.target.value)}
                    disabled={!!selectedSkill}
                    placeholder="ej: attack_boost_kinetic_t1"
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 disabled:opacity-40 transition-colors uppercase"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">base_name</label>
                  <input
                    type="text"
                    value={formData.base_name ?? ''}
                    onChange={e => setField('base_name', e.target.value)}
                    placeholder="ej: Attack Boost Kinetic"
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors uppercase"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">Rarity</label>
                  <select
                    value={formData.rarity ?? 'Common'}
                    onChange={e => setField('rarity', e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    {['Common','Uncommon','Rare','Epic','Legendary','Exclusive'].map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </fieldset>

              {/* SECCIÓN B: Campos Contextuales */}
              <fieldset className="space-y-3">
                <legend className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2 block">
                  § B — Contexto: {ASSET_TABS.find(t => t.id === activeTab)?.icon} {ASSET_TABS.find(t => t.id === activeTab)?.label}
                </legend>

                {/* SHIPS */}
                {activeTab === 'ships' && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">Tier Level</label>
                        <select value={formData.tier_level ?? 1} onChange={e => setField('tier_level', Number(e.target.value))} className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none cursor-pointer">
                          {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>Tier {n}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">Display Suffix</label>
                        <input type="text" value={formData.display_suffix ?? ''} onChange={e => setField('display_suffix', e.target.value)} placeholder="I, II, VIII..." className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none uppercase" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">stat_affected</label>
                      <select value={formData.stat_affected ?? ''} onChange={e => setField('stat_affected', e.target.value)} className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none cursor-pointer">
                        {['attack_standard','shield','speed_boost','cargo_capacity','fleet_space'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">math_operator</label>
                        <select value={formData.math_operator ?? 'add'} onChange={e => setField('math_operator', e.target.value)} className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 cursor-pointer">
                          <option value="add">add</option><option value="multiply">multiply</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">modifier_value</label>
                        <input type="number" step="0.1" value={formData.modifier_value ?? 0} onChange={e => setField('modifier_value', Number(e.target.value))} className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-bold" />
                      </div>
                    </div>
                  </>
                )}

                {/* STRUCTURES & TECHNOLOGIES */}
                {(activeTab === 'structures' || activeTab === 'technologies') && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">sub_type</label>
                        <select value={(formData as any).sub_type ?? ''} onChange={e => setFormData(p => ({ ...p, sub_type: e.target.value }))} className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 cursor-pointer">
                          {activeTab === 'structures'
                            ? ['Production','Facility','Hybrid'].map(s => <option key={s} value={s}>{s}</option>)
                            : ['Enhancement','Combat','Science'].map(s => <option key={s} value={s}>{s}</option>)
                          }
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">scope_type</label>
                        <select value={(formData as any).scope_type ?? 'Global Account'} onChange={e => setFormData(p => ({ ...p, scope_type: e.target.value }))} className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 cursor-pointer">
                          <option>Global Account</option><option>Specific Asset</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}
              </fieldset>

              {/* SECCIÓN C: Botones de Acción */}
              <div className="flex gap-2 pt-2 border-t border-slate-800 font-mono">
                <button
                  onClick={() => handleSaveSkill(formData)}
                  disabled={isSubmitting}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer uppercase"
                >
                  {isSubmitting ? 'Validando...' : 'Confirmar Guardado'}
                </button>
                <button
                  onClick={() => { setIsFormOpen(false); setSelectedSkill(null); }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors cursor-pointer uppercase"
                >
                  Cancelar
                </button>
              </div>

            </div>
          ) : (
            <div className="h-full flex flex-col justify-center items-center text-center p-6 text-slate-500 border border-dashed border-slate-800 rounded-lg min-h-[300px] text-xs gap-3">
              <span className="text-3xl">🎮</span>
              <span>Selecciona un skill o presiona <strong className="text-slate-400">+ Nuevo Skill</strong> para abrir el editor.</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default SkillManager;