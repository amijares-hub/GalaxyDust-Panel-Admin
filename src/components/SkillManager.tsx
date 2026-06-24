// ====================================================================
// GALAXY DUST ONLINE - PLAN DE APLICACIÓN DE SKILL MANAGEMENT
// PASO 4: FORMULARIO MUTABLE CONTEXTUAL (src/components/SkillManager.tsx)
// ====================================================================

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
  // Campos contextuales extendidos (no siempre presentes en BD)
  sub_type?: string;
  astrobot_role?: string;
  source_type?: string;
  scope_type?: string;
  allowed_resources?: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Invoca la Edge Function centralizada. Lanza Error si el backend responde con error. */
const invokeAdminAction = async (body: Record<string, unknown>) => {
  const { error } = await supabase.functions.invoke('save-admin-item', { body });
  if (error) throw error;
};

// ═══════════════════════════════════════════════════════════════════════════════
export const SkillManager: React.FC = () => {
  // ── Datos y carga ──────────────────────────────────────────────────────────
  const [activeTab,    setActiveTab]    = useState<AssetTabId>('ships');
  const [skills,       setSkills]       = useState<SkillRecord[]>([]);
  const [loading,      setLoading]      = useState<boolean>(true);
  const [error,        setError]        = useState<string | null>(null);

  // ── UI: búsqueda, acordeones ───────────────────────────────────────────────
  const [searchTerm,      setSearchTerm]      = useState<string>('');
  const [expandedGroups,  setExpandedGroups]  = useState<Record<string, boolean>>({});

  // ── Formulario de edición ──────────────────────────────────────────────────
  const [selectedSkill,  setSelectedSkill]  = useState<SkillRecord | null>(null);
  const [isFormOpen,     setIsFormOpen]     = useState<boolean>(false);
  const [isSubmitting,   setIsSubmitting]   = useState<boolean>(false);

  // ── PASO 4: Estado controlado del formulario ───────────────────────────────
  const emptyForm = (): Partial<SkillRecord> => ({
    skill_code: '', base_name: '', rarity: 'Common', tier_level: 1,
    display_suffix: 'I', stat_affected: '', modifier_value: 0,
    math_operator: 'add', target_entity: activeTab,
    license_group: null, duration_type: 'permanent', duration_value: null,
    outcome_config: null, sub_type: '', astrobot_role: 'Attack',
    source_type: 'Consumable', scope_type: 'Global Account',
    allowed_resources: [],
  });
  const [formData, setFormData] = useState<Partial<SkillRecord>>(emptyForm());

  // Sincroniza formData cuando cambia la selección o el modo del formulario
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

  // ── Selección múltiple ────────────────────────────────────────────────────
  const [selectedSkillCodes, setSelectedSkillCodes] = useState<string[]>([]);

  // ── Fetch ──────────────────────────────────────────────────────────────────
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

  useEffect(() => { fetchSkillsByTab(activeTab); }, [activeTab]);

  // ── REGLA DE ORO: Guardado (upsert) ───────────────────────────────────────
  const handleSaveSkill = async (formData: Partial<SkillRecord>) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await invokeAdminAction({
        action:     'upsert',
        tableName:  'matrix_skills_registry',
        recordData: { ...formData, asset_tab: activeTab },
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

  // ── REGLA DE ORO: Eliminación individual ──────────────────────────────────
  const handleDeleteSkill = async (skill: SkillRecord) => {
    if (!window.confirm(`⚠️ Eliminar "${skill.skill_code}" de forma permanente?`)) return;
    setError(null);
    try {
      await invokeAdminAction({
        action:       'delete',
        tableName:    'matrix_skills_registry',
        recordId:     skill.skill_code,
        primaryKeyCol:'skill_code',
      });
      await fetchSkillsByTab(activeTab);
    } catch (err: any) {
      setError(`[Error de Eliminación]: ${err.message}`);
    }
  };

  // ── REGLA DE ORO: Clonación individual ────────────────────────────────────
  const handleCloneSkill = async (skill: SkillRecord) => {
    setError(null);
    const cloned: SkillRecord = {
      ...skill,
      skill_code: `${skill.skill_code}_copy`,
    };
    try {
      await invokeAdminAction({
        action:     'upsert',
        tableName:  'matrix_skills_registry',
        recordData: cloned,
      });
      await fetchSkillsByTab(activeTab);
    } catch (err: any) {
      setError(`[Error de Clonación]: ${err.message}`);
    }
  };

  // ── REGLA DE ORO: Eliminación masiva ──────────────────────────────────────
  const handleBulkDelete = async () => {
    if (selectedSkillCodes.length === 0) return;
    if (!window.confirm(`🚨 Eliminar ${selectedSkillCodes.length} skill(s) seleccionados? Esta acción no se puede deshacer.`)) return;
    setError(null);
    try {
      await invokeAdminAction({
        action:       'bulk_delete',
        tableName:    'matrix_skills_registry',
        recordIds:    selectedSkillCodes,
        primaryKeyCol:'skill_code',
      });
      await fetchSkillsByTab(activeTab);
    } catch (err: any) {
      setError(`[Error Masivo]: ${err.message}`);
    }
  };

  // ── Selección: toggle tier individual ─────────────────────────────────────
  const toggleTierSelection = (code: string) => {
    setSelectedSkillCodes(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  // ── Selección: toggle grupo completo (Padre) ───────────────────────────────
  const toggleGroupSelection = (tiers: SkillRecord[]) => {
    const codes = tiers.map(t => t.skill_code);
    const allSelected = codes.every(c => selectedSkillCodes.includes(c));
    if (allSelected) {
      setSelectedSkillCodes(prev => prev.filter(c => !codes.includes(c)));
    } else {
      setSelectedSkillCodes(prev => [...new Set([...prev, ...codes])]);
    }
  };

  // ── Motor de filtrado y agrupación ────────────────────────────────────────
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

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 p-6 font-sans">

      {/* ── Encabezado ────────────────────────────────────────────────────── */}
      <header className="mb-6 border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">
          Gestor de Skills Avanzado
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Galaxy Dust Online — Consola de Mando Administrativo
        </p>
      </header>

      {/* ── Navegación de Pestañas ────────────────────────────────────────── */}
      <nav className="flex flex-wrap gap-1.5 mb-6 border-b border-slate-800/60 pb-3">
        {ASSET_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* ── Alerta de Error Global ────────────────────────────────────────── */}
      {error && (
        <div className="mb-4 p-3 bg-red-950/40 border border-red-800/50 rounded-lg text-red-200 text-xs flex items-start gap-2">
          <span className="mt-0.5 shrink-0">⛔</span>
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-200">✕</button>
        </div>
      )}

      {/* ── BARRA DE ACCIONES MASIVAS (visible sólo cuando hay selección) ─── */}
      {selectedSkillCodes.length > 0 && (
        <div className="mb-4 flex items-center justify-between gap-4 px-4 py-2.5 bg-amber-950/40 border border-amber-700/40 rounded-xl animate-pulse-once">
          <span className="text-amber-300 text-xs font-semibold">
            ⚡ {selectedSkillCodes.length} elemento{selectedSkillCodes.length > 1 ? 's' : ''} seleccionado{selectedSkillCodes.length > 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedSkillCodes([])}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-md transition-colors"
            >
              Deseleccionar todo
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1 bg-red-700 hover:bg-red-600 text-white font-bold text-xs rounded-md transition-colors shadow-lg shadow-red-900/30"
            >
              🗑 Eliminar en Masa ({selectedSkillCodes.length})
            </button>
          </div>
        </div>
      )}

      {/* ── Layout Principal ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">

        {/* ── COLUMNA IZQUIERDA: Lista jerárquica ───────────────────────── */}
        <div className="xl:col-span-2 bg-[#0d1321] border border-slate-800/80 rounded-xl p-4 shadow-xl">

          {/* Buscador + botón nuevo */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-center mb-4">
            <div className="relative w-full sm:max-w-xs">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 text-xs">🔍</span>
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar skill base o código..."
                className="w-full pl-8 pr-8 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-500 hover:text-slate-300 text-[10px]"
                >✕</button>
              )}
            </div>
            <button
              onClick={() => { setSelectedSkill(null); setIsFormOpen(true); }}
              className="w-full sm:w-auto px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-md transition-colors shadow"
            >
              + Nuevo Skill
            </button>
          </div>

          {/* Lista */}
          {loading ? (
            <div className="flex justify-center items-center h-64 text-slate-400 text-xs gap-2">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-400" />
              Sincronizando registros...
            </div>
          ) : Object.keys(groupedSkills).length === 0 ? (
            <div className="flex justify-center items-center h-48 text-slate-500 text-xs border border-dashed border-slate-800 rounded-lg">
              No se encontraron coincidencias para la categoría seleccionada.
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {Object.entries(groupedSkills).map(([baseName, tiers]) => {
                const isExpanded = !!expandedGroups[baseName];
                const tierCodes  = tiers.map(t => t.skill_code);
                const allGroupSelected = tierCodes.every(c => selectedSkillCodes.includes(c));
                const someGroupSelected = tierCodes.some(c => selectedSkillCodes.includes(c));

                return (
                  <div key={baseName} className="border border-slate-800/40 bg-slate-950/40 rounded-lg overflow-hidden">

                    {/* ── Fila Padre (base_name) ─────────────────────────── */}
                    <div className="flex items-center gap-2 p-3 bg-slate-900/40 hover:bg-slate-900/80 transition-colors border-b border-transparent">
                      {/* Checkbox del grupo */}
                      <input
                        type="checkbox"
                        checked={allGroupSelected}
                        ref={el => { if (el) el.indeterminate = someGroupSelected && !allGroupSelected; }}
                        onChange={() => toggleGroupSelection(tiers)}
                        onClick={e => e.stopPropagation()}
                        className="w-3.5 h-3.5 accent-blue-500 cursor-pointer shrink-0"
                      />
                      {/* Toggle acordeón */}
                      <div
                        onClick={() => toggleGroup(baseName)}
                        className="flex flex-1 items-center justify-between cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 text-[10px]">{isExpanded ? '▼' : '▶'}</span>
                          <span className="text-xs font-semibold text-slate-200 tracking-wide">{baseName}</span>
                        </div>
                        <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded text-[10px] font-mono">
                          {tiers.length} {tiers.length === 1 ? 'Nodo' : 'Tiers'}
                        </span>
                      </div>
                    </div>

                    {/* ── Filas Hijas (tiers) ────────────────────────────── */}
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
                              {/* Checkbox individual */}
                              <input
                                type="checkbox"
                                checked={isTierSelected}
                                onChange={() => toggleTierSelection(tier.skill_code)}
                                className="w-3 h-3 accent-blue-500 cursor-pointer shrink-0"
                              />

                              {/* Info del tier */}
                              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono text-slate-300 font-medium truncate">{tier.skill_code}</span>
                                  {tier.display_suffix && (
                                    <span className="px-1 bg-blue-950 text-blue-400 border border-blue-900/40 rounded text-[9px] shrink-0">
                                      {tier.display_suffix}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-500 italic">
                                  Rarity: {tier.rarity} | Affects: {tier.stat_affected || 'N/A'}
                                </span>
                              </div>

                              {/* Botones de Acción Rápida */}
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                {/* Editar */}
                                <button
                                  onClick={() => { setSelectedSkill(tier); setIsFormOpen(true); }}
                                  title="Editar registro"
                                  className="px-2 py-1 bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white rounded text-[10px] transition-all"
                                >
                                  ✏️
                                </button>
                                {/* Clonar */}
                                <button
                                  onClick={() => handleCloneSkill(tier)}
                                  title="Clonar registro (añade _copy al skill_code)"
                                  className="px-2 py-1 bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white rounded text-[10px] transition-all"
                                >
                                  📋
                                </button>
                                {/* Eliminar individual */}
                                <button
                                  onClick={() => handleDeleteSkill(tier)}
                                  title="Eliminar este registro"
                                  className="px-2 py-1 bg-slate-800 hover:bg-red-700 text-slate-500 hover:text-white rounded text-[10px] transition-all"
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

        {/* ── COLUMNA DERECHA: Formulario Mutable Contextual (Paso 4) ─── */}
        <div className="bg-[#0d1321] border border-slate-800/80 rounded-xl p-4 shadow-xl min-h-[350px]">
          {isFormOpen ? (
            <div className="flex flex-col gap-4">

              {/* Cabecera del formulario */}
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  {selectedSkill ? `✏️ Modificar Registro` : '✨ Nuevo Nodo Habilidad'}
                </h2>
                <button
                  onClick={() => { setIsFormOpen(false); setSelectedSkill(null); }}
                  className="text-slate-500 hover:text-slate-300 text-xs"
                >✕ Cancelar</button>
              </div>

              {/* Aviso Regla de Oro */}
              <div className="p-2 bg-amber-950/20 border border-amber-800/30 rounded text-amber-400/80 text-[10px] leading-relaxed">
                ⚠️ Guardado protegido vía <code className="font-mono">save-admin-item</code>. Sumas probabilísticas y contratos JSON son validados en el backend antes de escritura.
              </div>

              {/* ── SECCIÓN A: Campos Globales ─────────────────────────────── */}
              <fieldset className="space-y-3">
                <legend className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2 block">§ A — Identificación Global</legend>

                {/* skill_code */}
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">skill_code <span className="text-slate-600">(Clave Primaria)</span></label>
                  <input
                    type="text"
                    value={formData.skill_code ?? ''}
                    onChange={e => setField('skill_code', e.target.value)}
                    disabled={!!selectedSkill}
                    placeholder="ej: attack_boost_kinetic_t1"
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  />
                </div>

                {/* base_name */}
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">base_name</label>
                  <input
                    type="text"
                    value={formData.base_name ?? ''}
                    onChange={e => setField('base_name', e.target.value)}
                    placeholder="ej: Attack Boost Kinetic"
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* rarity */}
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">Rarity</label>
                  <select
                    value={formData.rarity ?? 'Common'}
                    onChange={e => setField('rarity', e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
                  >
                    {['Common','Uncommon','Rare','Epic','Legendary','Exclusive'].map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </fieldset>

              {/* ── SECCIÓN B: Campos Contextuales ─────────────────────────── */}
              <fieldset className="space-y-3">
                <legend className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2 block">§ B — Contexto: {ASSET_TABS.find(t => t.id === activeTab)?.icon} {ASSET_TABS.find(t => t.id === activeTab)?.label}</legend>

                {/* ─ SHIPS ─ */}
                {activeTab === 'ships' && (<>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">Tier Level</label>
                      <select value={formData.tier_level ?? 1} onChange={e => setField('tier_level', Number(e.target.value))} className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer">
                        {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>Tier {n}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">Display Suffix</label>
                      <input type="text" value={formData.display_suffix ?? ''} onChange={e => setField('display_suffix', e.target.value)} placeholder="I, II, VIII..." className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">stat_affected</label>
                    <select value={formData.stat_affected ?? ''} onChange={e => setField('stat_affected', e.target.value)} className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer">
                      {['attack_standard','shield','speed_boost','cargo_capacity','fleet_space'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">math_operator</label>
                      <select value={formData.math_operator ?? 'add'} onChange={e => setField('math_operator', e.target.value)} className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer">
                        <option value="add">add</option><option value="multiply">multiply</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">modifier_value</label>
                      <input type="number" step="0.1" value={formData.modifier_value ?? 0} onChange={e => setField('modifier_value', Number(e.target.value))} className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500" />
                    </div>
                  </div>
                </>)}

                {/* ─ STRUCTURES & TECHNOLOGIES ─ */}
                {(activeTab === 'structures' || activeTab === 'technologies') && (<>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">sub_type</label>
                      <select value={(formData as any).sub_type ?? ''} onChange={e => setFormData(p => ({ ...p, sub_type: e.target.value }))} className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer">
                        {activeTab === 'structures'
                          ? ['Production','Facility','Hybrid'].map(s => <option key={s} value={s}>{s}</option>)
                          : ['Enhancement','Combat','Science'].map(s => <option key={s} value={s}>{s}</option>)
                        }
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">scope_type</label>
                      <select value={(formData as any).scope_type ?? 'Global Account'} onChange={e => setFormData(p => ({ ...p, scope_type: e.target.value }))} className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer">
                        <option>Global Account</option><option>Specific Asset</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">stat_affected</label>
                    <select value={formData.stat_affected ?? ''} onChange={e => setField('stat_affected', e.target.value)} className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer">
                      {['production_rate','capacity','research_time_reduction','crafting_cost_reduction'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">math_operator</label>
                      <select value={formData.math_operator ?? 'add'} onChange={e => setField('math_operator', e.target.value)} className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer">
                        <option value="add">add</option><option value="multiply">multiply</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">modifier_value</label>
                      <input type="number" step="0.1" value={formData.modifier_value ?? 0} onChange={e => setField('modifier_value', Number(e.target.value))} className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500" />
                    </div>
                  </div>
                </>)}

                {/* ─ ASTROBOTS ─ */}
                {activeTab === 'astrobots' && (<>
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">astrobot_role</label>
                    <select value={(formData as any).astrobot_role ?? 'Attack'} onChange={e => setFormData(p => ({ ...p, astrobot_role: e.target.value }))} className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer">
                      {['Attack','Defense','Scout','Miner','Support','Spy','Transport'].map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">stat_affected</label>
                    <select value={formData.stat_affected ?? ''} onChange={e => setField('stat_affected', e.target.value)} className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer">
                      {['hp','fleet_capacity','travel_speed','combat_speed'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">math_operator</label>
                      <select value={formData.math_operator ?? 'add'} onChange={e => setField('math_operator', e.target.value)} className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer">
                        <option value="add">add</option><option value="multiply">multiply</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">modifier_value</label>
                      <input type="number" step="0.1" value={formData.modifier_value ?? 0} onChange={e => setField('modifier_value', Number(e.target.value))} className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500" />
                    </div>
                  </div>
                </>)}

                {/* ─ TOOLS ─ */}
                {activeTab === 'tools' && (<>
                  <div className="p-2 bg-orange-950/20 border border-orange-800/30 rounded text-orange-300 text-[10px] font-semibold">
                    🔒 Restricción de Motor: Máximo 1 Tool por Flota
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-2">allowed_resources</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Metal','Crystal','Deuterium','Dark Matter'].map(res => (
                        <label key={res} className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={((formData.allowed_resources ?? []) as string[]).includes(res)}
                            onChange={() => toggleResource(res)}
                            className="w-3.5 h-3.5 accent-blue-500"
                          />
                          <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors">{res}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">stat_affected</label>
                    <select value={formData.stat_affected ?? ''} onChange={e => setField('stat_affected', e.target.value)} className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer">
                      {['mining_yield_multiplier','fleet_space_consumed'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">math_operator</label>
                      <select value={formData.math_operator ?? 'add'} onChange={e => setField('math_operator', e.target.value)} className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer">
                        <option value="add">add</option><option value="multiply">multiply</option><option value="override">override</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">modifier_value</label>
                      <input type="number" step="0.1" value={formData.modifier_value ?? 0} onChange={e => setField('modifier_value', Number(e.target.value))} className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500" />
                    </div>
                  </div>
                </>)}

                {/* ─ BADGES ─ */}
                {activeTab === 'badges' && (<>
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">stat_affected</label>
                    <select value={formData.stat_affected ?? ''} onChange={e => setField('stat_affected', e.target.value)} className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer">
                      {['max_badge_slots','station_production_multiplier'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">math_operator</label>
                      <select value={formData.math_operator ?? 'add'} onChange={e => setField('math_operator', e.target.value)} className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer">
                        <option value="add">add</option><option value="multiply">multiply</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">modifier_value</label>
                      <input type="number" step="0.1" value={formData.modifier_value ?? 0} onChange={e => setField('modifier_value', Number(e.target.value))} className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500" />
                    </div>
                  </div>
                </>)}

                {/* ─ DEFENSES (fallback simple) ─ */}
                {activeTab === 'defenses' && (<>
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">stat_affected</label>
                    <select value={formData.stat_affected ?? ''} onChange={e => setField('stat_affected', e.target.value)} className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer">
                      {['defense_power','hp','absorption','shield_recharge'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">math_operator</label>
                      <select value={formData.math_operator ?? 'add'} onChange={e => setField('math_operator', e.target.value)} className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer">
                        <option value="add">add</option><option value="multiply">multiply</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">modifier_value</label>
                      <input type="number" step="0.1" value={formData.modifier_value ?? 0} onChange={e => setField('modifier_value', Number(e.target.value))} className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500" />
                    </div>
                  </div>
                </>)}

                {/* ─ GENERAL EFFECTS ─ */}
                {activeTab === 'general_effects' && (<>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">source_type</label>
                      <select value={(formData as any).source_type ?? 'Consumable'} onChange={e => setFormData(p => ({ ...p, source_type: e.target.value }))} className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer">
                        {['Consumable','License','Booster'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">duration_type</label>
                      <select value={formData.duration_type ?? 'permanent'} onChange={e => setField('duration_type', e.target.value)} className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer">
                        {['permanent','time_limited','transaction_based','expedition_bound'].map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* duration_value: visible sólo si aplica */}
                  {(formData.duration_type === 'time_limited' || formData.duration_type === 'transaction_based') && (
                    <div>
                      <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">duration_value</label>
                      <input type="number" step="1" value={formData.duration_value ?? 0} onChange={e => setField('duration_value', Number(e.target.value))} className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500" />
                    </div>
                  )}

                  {/* license_group: visible sólo si source_type es License */}
                  {(formData as any).source_type === 'License' && (
                    <div>
                      <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">license_group</label>
                      <input type="text" value={formData.license_group ?? ''} onChange={e => setField('license_group', e.target.value)} placeholder="ej: license_mining_alpha" className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500" />
                    </div>
                  )}

                  {/* ══ PASO 5: CONSTRUCTOR VISUAL DE outcome_config ══ */}
                  {(formData as any).source_type === 'Consumable' && (() => {
                    // ── helpers locales ──────────────────────────────────────
                    const oc = formData.outcome_config as any;
                    const configType: string = oc?.config_type ?? '';

                    const setOC = (patch: Record<string, unknown>) =>
                      setFormData(prev => ({
                        ...prev,
                        outcome_config: { ...(prev.outcome_config as any ?? {}), ...patch } as any,
                      }));

                    const initType = (type: string) => {
                      if (type === 'materializer_matrix') setFormData(p => ({ ...p, outcome_config: { config_type: 'materializer_matrix', outcomes: [] } as any }));
                      else if (type === 'weighted_drop_table') setFormData(p => ({ ...p, outcome_config: { config_type: 'weighted_drop_table', is_stackable: false, drops: [] } as any }));
                      else if (type === 'fixed_manifest') setFormData(p => ({ ...p, outcome_config: { config_type: 'fixed_manifest', is_stackable: false, items: [] } as any }));
                      else setFormData(p => ({ ...p, outcome_config: null }));
                    };

                    const ITEM_CATS = ['ships','structures','technologies','defenses','astrobots','tools','badges','general_effects'];

                    // ── materializer_matrix ──────────────────────────────────
                    const outcomes: any[] = oc?.outcomes ?? [];
                    const addOutcomeRow = () => setOC({ outcomes: [...outcomes, { chance_pct: 0, asset_multiplier: 1, consume_resources: false, consume_blueprint: true, reward_item_code: null }] });
                    const updateOutcome = (i: number, key: string, value: unknown) => setOC({ outcomes: outcomes.map((r: any, idx: number) => idx === i ? { ...r, [key]: value } : r) });
                    const removeOutcome = (i: number) => setOC({ outcomes: outcomes.filter((_: any, idx: number) => idx !== i) });

                    // ── weighted_drop_table ──────────────────────────────────
                    const drops: any[] = oc?.drops ?? [];
                    const addDropRow = () => setOC({ drops: [...drops, { chance_pct: 0, item_code: '', item_category: 'ships', quantity_min: 1, quantity_max: 1 }] });
                    const updateDrop = (i: number, key: string, value: unknown) => setOC({ drops: drops.map((r: any, idx: number) => idx === i ? { ...r, [key]: value } : r) });
                    const removeDrop = (i: number) => setOC({ drops: drops.filter((_: any, idx: number) => idx !== i) });

                    // ── fixed_manifest ───────────────────────────────────────
                    const items: any[] = oc?.items ?? [];
                    const addItemRow = () => setOC({ items: [...items, { item_code: '', item_category: 'ships', quantity: 1 }] });
                    const updateItem = (i: number, key: string, value: unknown) => setOC({ items: items.map((r: any, idx: number) => idx === i ? { ...r, [key]: value } : r) });
                    const removeItem = (i: number) => setOC({ items: items.filter((_: any, idx: number) => idx !== i) });

                    const totalChance = configType === 'materializer_matrix'
                      ? outcomes.reduce((s: number, r: any) => s + (Number(r.chance_pct) || 0), 0)
                      : drops.reduce((s: number, r: any) => s + (Number(r.chance_pct) || 0), 0);

                    // ── render ───────────────────────────────────────────────
                    return (
                      <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 space-y-3">
                        {/* Título */}
                        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                          <span className="text-[9px] font-bold uppercase tracking-widest text-violet-400">🌀 Constructor outcome_config</span>
                        </div>

                        {/* Selector de tipo */}
                        <div>
                          <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">config_type</label>
                          <select
                            value={configType}
                            onChange={e => initType(e.target.value)}
                            className="w-full px-2 py-1.5 bg-[#0b0f19] border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-violet-500 cursor-pointer"
                          >
                            <option value="">— Selecciona un tipo —</option>
                            <option value="materializer_matrix">Matriz de Materializador (Crafteo)</option>
                            <option value="weighted_drop_table">Tabla de Drops Ponderada (Packs/Bags)</option>
                            <option value="fixed_manifest">Manifiesto Fijo (Bundles/Lotes)</option>
                          </select>
                        </div>

                        {/* is_stackable (solo para drop_table y manifest) */}
                        {(configType === 'weighted_drop_table' || configType === 'fixed_manifest') && (
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!oc?.is_stackable}
                              onChange={e => setOC({ is_stackable: e.target.checked })}
                              className="w-3.5 h-3.5 accent-violet-500"
                            />
                            <span className="text-xs text-slate-400">is_stackable <span className="text-slate-600">(agrupa en un solo slot de inventario)</span></span>
                          </label>
                        )}

                        {/* ── materializer_matrix ── */}
                        {configType === 'materializer_matrix' && (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-semibold text-slate-400 uppercase">outcomes</span>
                              <button onClick={addOutcomeRow} className="px-2 py-0.5 bg-violet-700 hover:bg-violet-600 text-white text-[10px] rounded transition-colors">+ Añadir Fila</button>
                            </div>
                            {outcomes.length === 0 && <p className="text-[10px] text-slate-600 italic text-center py-2">Sin filas todavía.</p>}
                            {outcomes.map((row: any, i: number) => (
                              <div key={i} className="grid grid-cols-[40px_40px_70px_70px_1fr_22px] gap-1 items-center bg-slate-900/60 rounded-lg p-1.5 border border-slate-800/60">
                                <div>
                                  <p className="text-[8px] text-slate-600 text-center mb-0.5">chance%</p>
                                  <input type="number" min={0} max={100} value={row.chance_pct ?? 0} onChange={e => updateOutcome(i,'chance_pct',Number(e.target.value))} className="w-full px-1 py-0.5 bg-[#0b0f19] border border-slate-700 rounded text-[10px] text-center font-mono text-emerald-400 focus:outline-none focus:border-violet-500" />
                                </div>
                                <div>
                                  <p className="text-[8px] text-slate-600 text-center mb-0.5">mult.</p>
                                  <input type="number" min={0} max={2} value={row.asset_multiplier ?? 1} onChange={e => updateOutcome(i,'asset_multiplier',Number(e.target.value))} className="w-full px-1 py-0.5 bg-[#0b0f19] border border-slate-700 rounded text-[10px] text-center font-mono text-slate-300 focus:outline-none" />
                                </div>
                                <div className="flex flex-col gap-1">
                                  <label className="flex items-center gap-1 cursor-pointer">
                                    <input type="checkbox" checked={!!row.consume_resources} onChange={e => updateOutcome(i,'consume_resources',e.target.checked)} className="w-2.5 h-2.5 accent-violet-500" />
                                    <span className="text-[8px] text-slate-500">cobrar mat.</span>
                                  </label>
                                  <label className="flex items-center gap-1 cursor-pointer">
                                    <input type="checkbox" checked={!!row.consume_blueprint} onChange={e => updateOutcome(i,'consume_blueprint',e.target.checked)} className="w-2.5 h-2.5 accent-violet-500" />
                                    <span className="text-[8px] text-slate-500">quemar plano</span>
                                  </label>
                                </div>
                                <div>
                                  <p className="text-[8px] text-slate-600 mb-0.5">reward_code</p>
                                  <input type="text" value={row.reward_item_code ?? ''} onChange={e => updateOutcome(i,'reward_item_code',e.target.value || null)} placeholder="null" className="w-full px-1 py-0.5 bg-[#0b0f19] border border-slate-700 rounded text-[9px] font-mono text-slate-300 focus:outline-none placeholder-slate-700" />
                                </div>
                                <div></div>
                                <button onClick={() => removeOutcome(i)} className="text-red-700 hover:text-red-400 text-xs transition-colors">🗑</button>
                              </div>
                            ))}
                            {/* Indicador suma probabilidades */}
                            <div className={`text-[10px] font-mono text-right pr-1 ${totalChance === 100 ? 'text-emerald-500' : 'text-amber-400'}`}>
                              Suma actual: {totalChance}% {totalChance === 100 ? '✅' : '⚠️ debe ser 100%'}
                            </div>
                            <p className="text-[9px] text-slate-600 italic">💡 La Edge Function rechazará el guardado si la suma no es exactamente 100%.</p>
                          </div>
                        )}

                        {/* ── weighted_drop_table ── */}
                        {configType === 'weighted_drop_table' && (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-semibold text-slate-400 uppercase">drops</span>
                              <button onClick={addDropRow} className="px-2 py-0.5 bg-violet-700 hover:bg-violet-600 text-white text-[10px] rounded transition-colors">+ Añadir Fila</button>
                            </div>
                            {drops.length === 0 && <p className="text-[10px] text-slate-600 italic text-center py-2">Sin filas todavía.</p>}
                            {drops.map((row: any, i: number) => (
                              <div key={i} className="space-y-1 bg-slate-900/60 rounded-lg p-1.5 border border-slate-800/60">
                                <div className="grid grid-cols-[45px_1fr_22px] gap-1 items-start">
                                  <div>
                                    <p className="text-[8px] text-slate-600 mb-0.5">chance%</p>
                                    <input type="number" step="0.1" min={0} value={row.chance_pct ?? 0} onChange={e => updateDrop(i,'chance_pct',Number(e.target.value))} className="w-full px-1 py-0.5 bg-[#0b0f19] border border-slate-700 rounded text-[10px] text-center font-mono text-emerald-400 focus:outline-none focus:border-violet-500" />
                                  </div>
                                  <div>
                                    <p className="text-[8px] text-slate-600 mb-0.5">item_code</p>
                                    <input type="text" value={row.item_code ?? ''} onChange={e => updateDrop(i,'item_code',e.target.value)} placeholder="ej: drone_capacity_t5" className="w-full px-1 py-0.5 bg-[#0b0f19] border border-slate-700 rounded text-[10px] font-mono text-slate-300 focus:outline-none focus:border-violet-500 placeholder-slate-700" />
                                  </div>
                                  <button onClick={() => removeDrop(i)} className="mt-3 text-red-700 hover:text-red-400 text-xs transition-colors">🗑</button>
                                </div>
                                <div className="grid grid-cols-3 gap-1">
                                  <div className="col-span-1">
                                    <p className="text-[8px] text-slate-600 mb-0.5">item_category</p>
                                    <select value={row.item_category ?? 'ships'} onChange={e => updateDrop(i,'item_category',e.target.value)} className="w-full px-1 py-0.5 bg-[#0b0f19] border border-slate-700 rounded text-[9px] text-slate-300 focus:outline-none cursor-pointer">
                                      {ITEM_CATS.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                  </div>
                                  <div>
                                    <p className="text-[8px] text-slate-600 mb-0.5">qty_min</p>
                                    <input type="number" min={0} value={row.quantity_min ?? 1} onChange={e => updateDrop(i,'quantity_min',Number(e.target.value))} className="w-full px-1 py-0.5 bg-[#0b0f19] border border-slate-700 rounded text-[10px] text-center font-mono text-slate-300 focus:outline-none" />
                                  </div>
                                  <div>
                                    <p className="text-[8px] text-slate-600 mb-0.5">qty_max</p>
                                    <input type="number" min={0} value={row.quantity_max ?? 1} onChange={e => updateDrop(i,'quantity_max',Number(e.target.value))} className="w-full px-1 py-0.5 bg-[#0b0f19] border border-slate-700 rounded text-[10px] text-center font-mono text-slate-300 focus:outline-none" />
                                  </div>
                                </div>
                              </div>
                            ))}
                            <div className={`text-[10px] font-mono text-right pr-1 ${totalChance === 100 ? 'text-emerald-500' : 'text-slate-500'}`}>
                              Suma: {totalChance.toFixed(1)}%
                            </div>
                          </div>
                        )}

                        {/* ── fixed_manifest ── */}
                        {configType === 'fixed_manifest' && (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-semibold text-slate-400 uppercase">items</span>
                              <button onClick={addItemRow} className="px-2 py-0.5 bg-violet-700 hover:bg-violet-600 text-white text-[10px] rounded transition-colors">+ Añadir Fila</button>
                            </div>
                            {items.length === 0 && <p className="text-[10px] text-slate-600 italic text-center py-2">Sin filas todavía.</p>}
                            {items.map((row: any, i: number) => (
                              <div key={i} className="grid grid-cols-[1fr_100px_40px_22px] gap-1 items-start bg-slate-900/60 rounded-lg p-1.5 border border-slate-800/60">
                                <div>
                                  <p className="text-[8px] text-slate-600 mb-0.5">item_code</p>
                                  <input type="text" value={row.item_code ?? ''} onChange={e => updateItem(i,'item_code',e.target.value)} placeholder="ej: mining_facility_t1" className="w-full px-1 py-0.5 bg-[#0b0f19] border border-slate-700 rounded text-[10px] font-mono text-slate-300 focus:outline-none focus:border-violet-500 placeholder-slate-700" />
                                </div>
                                <div>
                                  <p className="text-[8px] text-slate-600 mb-0.5">item_category</p>
                                  <select value={row.item_category ?? 'ships'} onChange={e => updateItem(i,'item_category',e.target.value)} className="w-full px-1 py-0.5 bg-[#0b0f19] border border-slate-700 rounded text-[9px] text-slate-300 focus:outline-none cursor-pointer">
                                    {ITEM_CATS.map(c => <option key={c} value={c}>{c}</option>)}
                                  </select>
                                </div>
                                <div>
                                  <p className="text-[8px] text-slate-600 mb-0.5">qty</p>
                                  <input type="number" min={1} value={row.quantity ?? 1} onChange={e => updateItem(i,'quantity',Number(e.target.value))} className="w-full px-1 py-0.5 bg-[#0b0f19] border border-slate-700 rounded text-[10px] text-center font-mono text-slate-300 focus:outline-none" />
                                </div>
                                <button onClick={() => removeItem(i)} className="mt-3 text-red-700 hover:text-red-400 text-xs transition-colors">🗑</button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </>)}
              </fieldset>

              {/* ── SECCIÓN C: Botones de Acción ───────────────────────────── */}
              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => handleSaveSkill(formData)}
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold text-xs rounded-lg transition-colors shadow-lg shadow-blue-900/20"
                >
                  {isSubmitting ? (
                    <><div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" /> Validando...</>
                  ) : (
                    <>✅ Confirmar Guardado</>
                  )}
                </button>
                <button
                  onClick={() => { setIsFormOpen(false); setSelectedSkill(null); }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>

            </div>
          ) : (
            <div className="h-full flex flex-col justify-center items-center text-center p-6 text-slate-500 border border-dashed border-slate-800 rounded-lg min-h-[300px] text-xs gap-3">
              <span className="text-3xl">🎮</span>
              <span>Selecciona una fila para desplegar sus tiers o presiona <strong className="text-slate-400">+ Nuevo Skill</strong> para iniciar el constructor dinámico.</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};