import React, { useState, useEffect, useMemo } from 'react';
import { 
  Cpu, Zap, Shield, Play, Plus, Trash2, Edit3, Save, RefreshCw, 
  CheckCircle2, XCircle, Search, ToggleLeft, ToggleRight, ArrowRight, 
  Layers, Gift, AlertTriangle, ShieldAlert, Sparkles, Terminal, FileCode
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { GameRule, GameCondition, GameAction, UserProfile } from '../types';

interface ExtendedUserProfile extends UserProfile {
  legacy_id?: number;
}

interface ConditionEditorProps {
  users?: UserProfile[];
  setIsAlertToShow?: (alert: { show: boolean; status: 'success' | 'error' | 'warning'; message: string }) => void;
}

const LOCAL_STORAGE_KEY = 'galaxydust_ota_rules_cache';

const isUUID = (str?: string | null): boolean => {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
};

const loadLocalRules = (): GameRule[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn("Error leyendo cache local de reglas:", e);
  }
  return [];
};

const saveLocalRules = (rules: GameRule[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(rules));
  } catch (e) {
    console.warn("Error guardando cache local de reglas:", e);
  }
};

const CONDITION_FIELDS: { value: GameCondition['field']; label: string; type: 'number' | 'string' }[] = [
  { value: 'user.level', label: 'Nivel General (user.level)', type: 'number' },
  { value: 'user.can_level', label: 'Nivel C.A.N. (user.can_level)', type: 'number' },
  { value: 'user.xp', label: 'Puntos de Experiencia (user.xp)', type: 'number' },
  { value: 'user.gd_coins', label: 'Saldo GD Coins (user.gd_coins)', type: 'number' },
  { value: 'user.phantom_coins', label: 'Saldo Phantom Coins (user.phantom_coins)', type: 'number' },
  { value: 'user.metal', label: 'Bóveda de Metal (user.metal)', type: 'number' },
  { value: 'user.crystal', label: 'Bóveda de Cristal (user.crystal)', type: 'number' },
  { value: 'user.deuterium', label: 'Bóveda de Deuterio (user.deuterium)', type: 'number' },
  { value: 'user.dark_matter', label: 'Bóveda de Materia Oscura (user.dark_matter)', type: 'number' },
  { value: 'user.registration_days', label: 'Días de Antigüedad (user.registration_days)', type: 'number' },
  { value: 'inventory.item_count', label: 'Total Ítems en Inventario (inventory.item_count)', type: 'number' }
];

const OPERATORS: { value: GameCondition['operator']; label: string }[] = [
  { value: 'greater_than', label: '> Mayor que' },
  { value: 'less_than', label: '< Menor que' },
  { value: 'equals', label: '= Igual a' },
  { value: 'not_equals', label: '≠ Diferente de' },
  { value: 'contains', label: '∈ Contiene texto' }
];

const TRIGGERS: { value: GameRule['trigger']; label: string; desc: string }[] = [
  { value: 'on_login', label: 'Al Iniciar Sesión', desc: 'Evaluado en el instante del handshake de login' },
  { value: 'on_level_up', label: 'Al Subir de Nivel', desc: 'Disparado tras incremento de rango o CAN' },
  { value: 'on_quest_complete', label: 'Al Finalizar Misión', desc: 'Evaluado al reclamar reporte de expedición' },
  { value: 'on_pvp_win', label: 'Al Ganar Combate PvP', desc: 'Disparado tras victoria en arena espacial' },
  { value: 'on_transaction', label: 'Al Realizar Transacción', desc: 'Evaluado tras compra en mercado o Phantom' }
];

const ACTION_TYPES: { value: GameAction['type']; label: string; color: string }[] = [
  { value: 'grant_item', label: '🎁 Otorgar Ítem o Consumible', color: 'text-emerald-400' },
  { value: 'add_gd_coins', label: '🪙 Otorgar GD Coins (USD)', color: 'text-amber-400' },
  { value: 'add_phantom_coins', label: '👻 Otorgar Phantom Coins', color: 'text-purple-400' },
  { value: 'multiply_xp', label: '⚡ Multiplicar XP de Misión', color: 'text-cyan-400' },
  { value: 'send_custom_notification', label: '📢 Enviar Alerta Directa', color: 'text-blue-400' },
  { value: 'suspend_account', label: '🚨 Suspender Cuenta (Ban Temp)', color: 'text-red-400' }
];

export const ConditionEditor: React.FC<ConditionEditorProps> = ({ users = [], setIsAlertToShow }) => {
  const [rules, setRules] = useState<GameRule[]>(() => loadLocalRules());
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'rules_list' | 'builder' | 'sandbox'>('rules_list');

  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [ruleName, setRuleName] = useState<string>('');
  const [ruleDesc, setRuleDesc] = useState<string>('');
  const [ruleTrigger, setRuleTrigger] = useState<GameRule['trigger']>('on_login');
  const [ruleTooltip, setRuleTooltip] = useState<string>('');
  const [ruleIsActive, setRuleIsActive] = useState<boolean>(true);

  const [conditions, setConditions] = useState<GameCondition[]>([
    { id: 'cond-1', field: 'user.can_level', operator: 'greater_than', value: 1 }
  ]);

  const [actionType, setActionType] = useState<GameAction['type']>('add_phantom_coins');
  const [actionAmount, setActionAmount] = useState<number>(500);
  const [actionItemId, setActionItemId] = useState<string>('qmp_t1_speed');
  const [actionItemRarity, setActionItemRarity] = useState<'common' | 'rare' | 'epic' | 'legendary'>('rare');
  const [actionMultiplier, setActionMultiplier] = useState<number>(1.5);
  const [actionMessage, setActionMessage] = useState<string>('¡Bonificación por mérito militar otorgada!');
  const [actionDurationDays, setActionDurationDays] = useState<number>(3);

  const [testUserSearch, setTestUserSearch] = useState<string>('');
  const [selectedTestUser, setSelectedTestUser] = useState<ExtendedUserProfile | null>(null);
  const [simulationResult, setSimulationResult] = useState<{
    evaluated: boolean;
    ruleName: string;
    conditionResults: { field: string; expected: string; actual: string; passed: boolean }[];
    allPassed: boolean;
    actionPreview: string;
  } | null>(null);

  const fetchRules = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      // Consulta directa sin .order('created_at') para no fallar con error 400 si la columna falta
      const { data, error } = await supabase
        .from('game_rules')
        .select('*');

      if (!error && data) {
        const mapped: GameRule[] = data.map((r: any) => {
          const rawAction = r.action || r.actions || (typeof r.action_type === 'string' ? { type: r.action_type, params: r.action_params || {} } : { type: 'add_phantom_coins', params: { amount: 100 } });

          return {
            id: String(r.id),
            name: r.name || 'Regla sin título',
            description: r.description || '',
            trigger: r.trigger || 'on_login',
            conditions: Array.isArray(r.conditions) ? r.conditions : [],
            action: typeof rawAction === 'object' ? rawAction : { type: 'add_phantom_coins', params: { amount: 100 } },
            isActive: Boolean(r.is_active ?? r.isActive ?? true),
            tooltip: r.tooltip || '',
            created_at: r.created_at || new Date().toISOString()
          };
        });

        // Sincronizar estado y caché local
        setRules(mapped);
        saveLocalRules(mapped);
      }
    } catch (e: any) {
      console.warn("Aviso al consultar game_rules de Supabase:", e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleAddCondition = () => {
    const newCond: GameCondition = {
      id: `cond-${Date.now()}`,
      field: 'user.can_level',
      operator: 'greater_than',
      value: 1
    };
    setConditions(prev => [...prev, newCond]);
  };

  const handleRemoveCondition = (condId: string) => {
    if (conditions.length <= 1) return;
    setConditions(prev => prev.filter(c => c.id !== condId));
  };

  const handleUpdateCondition = (condId: string, updates: Partial<GameCondition>) => {
    setConditions(prev => prev.map(c => c.id === condId ? { ...c, ...updates } : c));
  };

  const handleOpenEditRule = (rule: GameRule) => {
    setEditingRuleId(rule.id);
    setRuleName(rule.name);
    setRuleDesc(rule.description);
    setRuleTrigger(rule.trigger);
    setRuleTooltip(rule.tooltip);
    setRuleIsActive(rule.isActive);
    setConditions(rule.conditions.length > 0 ? rule.conditions : [{ id: 'cond-1', field: 'user.can_level', operator: 'greater_than', value: 1 }]);
    
    setActionType(rule.action.type);
    if (rule.action.params.amount !== undefined) setActionAmount(rule.action.params.amount);
    if (rule.action.params.itemId) setActionItemId(rule.action.params.itemId);
    if (rule.action.params.itemRarity) setActionItemRarity(rule.action.params.itemRarity);
    if (rule.action.params.multiplier !== undefined) setActionMultiplier(rule.action.params.multiplier);
    if (rule.action.params.message) setActionMessage(rule.action.params.message);
    if (rule.action.params.durationDays !== undefined) setActionDurationDays(rule.action.params.durationDays);

    setActiveTab('builder');
  };

  const handleOpenCreateRule = () => {
    setEditingRuleId(null);
    setRuleName('');
    setRuleDesc('');
    setRuleTrigger('on_login');
    setRuleTooltip('');
    setRuleIsActive(true);
    setConditions([{ id: `cond-${Date.now()}`, field: 'user.can_level', operator: 'greater_than', value: 1 }]);
    setActionType('add_phantom_coins');
    setActionAmount(500);
    setActionItemId('qmp_t1_speed');
    setActiveTab('builder');
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim()) {
      alert("Por favor introduce un nombre oficial para la regla.");
      return;
    }

    // Asegurar SIEMPRE un UUID canónico para evitar el error 400 de sintaxis UUID en PostgreSQL
    const targetId = isUUID(editingRuleId) ? editingRuleId! : crypto.randomUUID();

    const compiledAction: GameAction = {
      type: actionType,
      params: {
        ...(actionType === 'grant_item' ? { itemId: actionItemId, itemRarity: actionItemRarity } : {}),
        ...(actionType === 'add_gd_coins' || actionType === 'add_phantom_coins' ? { amount: Number(actionAmount) } : {}),
        ...(actionType === 'multiply_xp' ? { multiplier: Number(actionMultiplier) } : {}),
        ...(actionType === 'send_custom_notification' ? { message: actionMessage } : {}),
        ...(actionType === 'suspend_account' ? { durationDays: Number(actionDurationDays) } : {})
      }
    };

    const newRuleObj: GameRule = {
      id: targetId,
      name: ruleName.trim(),
      description: ruleDesc.trim(),
      trigger: ruleTrigger,
      conditions: conditions,
      action: compiledAction,
      isActive: ruleIsActive,
      tooltip: ruleTooltip.trim() || ruleName.trim(),
      created_at: new Date().toISOString()
    };

    // 1. Guardar de inmediato en estado y en localStorage para que NO se pierda al cambiar de pestaña
    const updatedRulesList = editingRuleId
      ? rules.map(r => r.id === editingRuleId ? newRuleObj : r)
      : [newRuleObj, ...rules.filter(r => r.id !== targetId)];

    setRules(updatedRulesList);
    saveLocalRules(updatedRulesList);

    // 2. Persistir en Supabase con tolerancia a nombres de columna (action / actions / action_type)
    const basePayload: any = {
      id: targetId,
      name: ruleName.trim(),
      description: ruleDesc.trim(),
      trigger: ruleTrigger,
      conditions: conditions,
      is_active: ruleIsActive,
      tooltip: ruleTooltip.trim() || ruleName.trim()
    };

    let savedToRemote = false;
    if (supabase) {
      try {
        // Intento 1: columna 'action'
        let { error } = await supabase
          .from('game_rules')
          .upsert({ ...basePayload, action: compiledAction });

        // Intento 2: columna 'actions' (plural)
        if (error && (error.message.includes("'action'") || error.code === 'PGRST204')) {
          const fallbackRes = await supabase
            .from('game_rules')
            .upsert({ ...basePayload, actions: compiledAction });
          error = fallbackRes.error;
        }

        // Intento 3: columnas planas 'action_type' y 'action_params'
        if (error && (error.message.includes("'actions'") || error.code === 'PGRST204')) {
          const fallbackFlat = await supabase
            .from('game_rules')
            .upsert({
              ...basePayload,
              action_type: actionType,
              action_params: compiledAction.params
            });
          error = fallbackFlat.error;
        }

        if (!error) {
          savedToRemote = true;
          try {
            await supabase.from('maintenance_logs').insert([{
              action_type: isUUID(editingRuleId) ? 'GAME_RULE_UPDATED_OTA' : 'GAME_RULE_CREATED_OTA',
              records_affected: 1,
              created_at: new Date().toISOString()
            }]);
          } catch {}
        } else {
          console.warn("Supabase upsert warning:", error.message);
        }
      } catch (err: any) {
        console.warn("Supabase exception:", err.message);
      }
    }

    if (setIsAlertToShow) {
      setIsAlertToShow({
        show: true,
        status: 'success',
        message: savedToRemote
          ? `✅ Regla [${ruleName}] guardada en Supabase y desplegada vía OTA.`
          : `⚠️ Regla [${ruleName}] guardada localmente.`
      });
    }

    setActiveTab('rules_list');
  };

  const handleToggleRuleActive = async (ruleId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    const updated = rules.map(r => r.id === ruleId ? { ...r, isActive: newStatus } : r);
    setRules(updated);
    saveLocalRules(updated);

    if (supabase && isUUID(ruleId)) {
      try {
        await supabase
          .from('game_rules')
          .update({ is_active: newStatus })
          .eq('id', ruleId);
      } catch (e: any) {
        console.warn(e.message);
      }
    }

    if (setIsAlertToShow) {
      setIsAlertToShow({
        show: true,
        status: 'success',
        message: `Regla ${newStatus ? 'ACTIVADA' : 'DESACTIVADA'} correctamente.`
      });
    }
  };

  const handleDeleteRule = async (ruleId: string, ruleTitle: string) => {
    if (!window.confirm(`¿Confirmas la eliminación permanente de la regla "${ruleTitle}"?`)) return;

    // Actualizar estado y caché local inmediatamente
    const updated = rules.filter(r => r.id !== ruleId);
    setRules(updated);
    saveLocalRules(updated);

    // Si tiene UUID válido, eliminar de Supabase
    if (supabase && isUUID(ruleId)) {
      try {
        await supabase.from('game_rules').delete().eq('id', ruleId);
      } catch (e: any) {
        console.warn("Error al borrar en Supabase:", e.message);
      }
    }

    if (setIsAlertToShow) {
      setIsAlertToShow({ show: true, status: 'success', message: 'Regla eliminada correctamente.' });
    }
  };

  const filteredUsersForTest = useMemo(() => {
    if (!testUserSearch.trim()) return [];
    const term = testUserSearch.toLowerCase();
    return users.filter(u => 
      u.username.toLowerCase().includes(term) ||
      u.id.toLowerCase().includes(term) ||
      (u as any).legacy_id && String((u as any).legacy_id).includes(term)
    ).slice(0, 8);
  }, [users, testUserSearch]);

  const handleRunSimulation = (ruleToTest: GameRule) => {
    if (!selectedTestUser) {
      alert("Selecciona un comandante para correr la simulación en el Sandbox.");
      return;
    }

    const u = selectedTestUser;
    const condResults = ruleToTest.conditions.map(cond => {
      let actualVal: any = 0;
      if (cond.field === 'user.level') actualVal = u.level || 1;
      else if (cond.field === 'user.can_level') actualVal = u.can_level || 1;
      else if (cond.field === 'user.xp') actualVal = u.xp || 0;
      else if (cond.field === 'user.gd_coins') actualVal = u.gd_coins || 0;
      else if (cond.field === 'user.phantom_coins') actualVal = u.phantom_coins || 0;
      else if (cond.field === 'user.metal') actualVal = u.metal || 0;
      else if (cond.field === 'user.crystal') actualVal = u.crystal || 0;
      else if (cond.field === 'user.deuterium') actualVal = u.deuterium || 0;
      else if (cond.field === 'user.dark_matter') actualVal = u.dark_matter || 0;
      else if (cond.field === 'user.registration_days') {
        const regMs = new Date(u.created_at).getTime();
        actualVal = Math.floor((Date.now() - regMs) / (1000 * 3600 * 24));
      } else if (cond.field === 'inventory.item_count') {
        actualVal = (u.inventory || []).length;
      }

      const expectedVal = Number(cond.value);
      let passed = false;

      if (cond.operator === 'greater_than') passed = Number(actualVal) > expectedVal;
      else if (cond.operator === 'less_than') passed = Number(actualVal) < expectedVal;
      else if (cond.operator === 'equals') passed = Number(actualVal) === expectedVal;
      else if (cond.operator === 'not_equals') passed = Number(actualVal) !== expectedVal;
      else if (cond.operator === 'contains') passed = String(actualVal).toLowerCase().includes(String(cond.value).toLowerCase());

      return {
        field: cond.field,
        expected: `${cond.operator} ${cond.value}`,
        actual: String(actualVal),
        passed
      };
    });

    const allPassed = condResults.every(r => r.passed);
    const act = ruleToTest.action;
    let actDesc = '';
    if (act.type === 'add_phantom_coins') actDesc = `Inyectar ${act.params.amount?.toLocaleString('es-ES')} Phantom Coins`;
    else if (act.type === 'add_gd_coins') actDesc = `Inyectar $${act.params.amount?.toLocaleString('es-ES')} GD Coins`;
    else if (act.type === 'grant_item') actDesc = `Otorgar ítem [${act.params.itemId}] (${act.params.itemRarity})`;
    else if (act.type === 'multiply_xp') actDesc = `Multiplicador de XP x${act.params.multiplier}`;
    else if (act.type === 'send_custom_notification') actDesc = `Alerta: "${act.params.message}"`;
    else if (act.type === 'suspend_account') actDesc = `Sanción por ${act.params.durationDays} días`;

    setSimulationResult({
      evaluated: true,
      ruleName: ruleToTest.name,
      conditionResults: condResults,
      allPassed,
      actionPreview: actDesc
    });
  };

  return (
    <div className="space-y-6 font-mono text-xs text-left text-white select-none animate-fadeIn">
      {/* CABECERA */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="text-red-500 animate-pulse" size={18} />
            <h1 className="text-lg font-bold text-white uppercase tracking-wide">
              Motor de Reglas de Juego & Control OTA
            </h1>
          </div>
          <p className="text-xs text-zinc-500 font-sans mt-1">
            Programación de lógica condicional en caliente: disparadores por eventos, validación de saldos y ejecución reactiva sobre clientes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchRules}
            className="px-3 py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 font-bold uppercase rounded-lg text-xs cursor-pointer flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Sincronizar
          </button>
          <button
            onClick={handleOpenCreateRule}
            className="px-4 py-2 bg-red-650 hover:bg-red-600 text-white font-black uppercase rounded-lg text-xs cursor-pointer flex items-center gap-1.5 shadow-lg shadow-red-950/40 transition-all"
          >
            <Plus size={14} /> Nueva Regla OTA
          </button>
        </div>
      </div>

      {/* PESTAÑAS */}
      <div className="flex border-b border-zinc-900 gap-1 select-none">
        <button
          onClick={() => setActiveTab('rules_list')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'rules_list' ? 'bg-red-950/20 text-red-400 border-red-500' : 'text-zinc-500 border-transparent hover:text-zinc-300'
          }`}
        >
          <Layers size={13} /> Directorio de Reglas ({rules.length})
        </button>

        <button
          onClick={() => setActiveTab('builder')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'builder' ? 'bg-red-950/20 text-red-400 border-red-500' : 'text-zinc-500 border-transparent hover:text-zinc-300'
          }`}
        >
          <Edit3 size={13} /> {editingRuleId ? 'Editando Regla' : 'Constructor de Reglas'}
        </button>

        <button
          onClick={() => setActiveTab('sandbox')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'sandbox' ? 'bg-cyan-950/20 text-cyan-400 border-cyan-500' : 'text-zinc-500 border-transparent hover:text-zinc-300'
          }`}
        >
          <Terminal size={13} /> Sandbox Evaluador en Vivo
        </button>
      </div>

      {/* VISTA 1: LISTA DE REGLAS */}
      {activeTab === 'rules_list' && (
        <div className="space-y-4 animate-fadeIn">
          {rules.length === 0 ? (
            <div className="p-12 text-center text-zinc-600 border border-dashed border-zinc-900 rounded-xl">
              No hay reglas creadas. Pulsa "Nueva Regla OTA" para añadir una.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rules.map(rule => {
                const triggerConf = TRIGGERS.find(t => t.value === rule.trigger) || TRIGGERS[0];
                const actionConf = ACTION_TYPES.find(a => a.value === rule.action.type) || ACTION_TYPES[0];

                return (
                  <div
                    key={rule.id}
                    className={`p-4 rounded-xl border transition-all space-y-3 ${
                      rule.isActive 
                        ? 'bg-zinc-950 border-zinc-850 hover:border-zinc-750 shadow-xl' 
                        : 'bg-zinc-950/40 border-zinc-900 opacity-60'
                    }`}
                  >
                    <div className="flex justify-between items-start border-b border-zinc-900 pb-2.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-white text-xs uppercase">{rule.name}</strong>
                          <span className="px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 text-[8px] font-bold">
                            {rule.id.substring(0, 8)}...
                          </span>
                        </div>
                        <p className="text-zinc-400 text-[10px] font-sans mt-0.5 line-clamp-2">
                          {rule.description || 'Sin descripción técnica.'}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleToggleRuleActive(rule.id, rule.isActive)}
                          className="text-zinc-500 hover:text-white cursor-pointer p-0.5"
                          title={rule.isActive ? 'Desactivar regla' : 'Activar regla'}
                        >
                          {rule.isActive ? <ToggleRight size={26} className="text-emerald-500" /> : <ToggleLeft size={26} className="text-zinc-600" />}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] bg-black/60 p-2.5 rounded-lg border border-zinc-900">
                      <div>
                        <span className="text-[8px] text-zinc-500 uppercase block font-bold">Disparador (Trigger)</span>
                        <span className="text-cyan-400 font-bold block truncate">{triggerConf.label}</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-zinc-500 uppercase block font-bold">Acción Ejecutable</span>
                        <span className={`font-bold block truncate ${actionConf.color}`}>{actionConf.label}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[8.5px] text-zinc-500 uppercase font-bold block">
                        Condiciones Requeridas ({rule.conditions.length}):
                      </span>
                      <div className="space-y-1 max-h-20 overflow-y-auto custom-scrollbar">
                        {rule.conditions.map((c, idx) => (
                          <div key={idx} className="p-1.5 bg-black/40 rounded border border-zinc-900 text-[9.5px] flex justify-between">
                            <span className="text-zinc-300 font-mono">{c.field}</span>
                            <strong className="text-amber-400 font-mono">{c.operator} {c.value}</strong>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-zinc-900 flex justify-between items-center text-[10px]">
                      <span className="text-zinc-600 font-mono text-[9px]">
                        ID: {rule.id.substring(0, 8)}...
                      </span>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedTestUser(users[0] || null);
                            handleRunSimulation(rule);
                            setActiveTab('sandbox');
                          }}
                          className="px-2.5 py-1 bg-cyan-950/40 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 font-bold uppercase rounded text-[9px] cursor-pointer flex items-center gap-1"
                        >
                          <Play size={10} /> Probar
                        </button>
                        <button
                          onClick={() => handleOpenEditRule(rule)}
                          className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-bold uppercase rounded text-[9px] cursor-pointer"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteRule(rule.id, rule.name)}
                          className="p-1 bg-red-950/40 hover:bg-red-900 text-red-400 border border-red-900/40 rounded cursor-pointer"
                          title="Eliminar regla"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VISTA 2: CONSTRUCTOR / BUILDER DE REGLAS */}
      {activeTab === 'builder' && (
        <form onSubmit={handleSaveRule} className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-5 animate-fadeIn">
          <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
            <div>
              <span className="text-xs font-bold uppercase text-red-500 block">
                {editingRuleId ? `Editando Regla [${editingRuleId.substring(0, 8)}...]` : 'Constructor de Nueva Regla OTA'}
              </span>
              <p className="text-[10px] text-zinc-500 font-sans mt-0.5">
                Define disparadores, condiciones lógicas en serie (AND) y la recompensa o sanción resultante.
              </p>
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-red-650 hover:bg-red-600 text-white font-black uppercase rounded-lg text-xs cursor-pointer shadow-lg flex items-center gap-1.5 transition-all"
            >
              <Save size={13} /> Guardar & Desplegar OTA
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] text-zinc-400 uppercase font-bold block">Nombre de la Regla:</label>
              <input
                type="text"
                placeholder="Ej. Recompensa por Ascenso a Oficial..."
                value={ruleName}
                onChange={e => setRuleName(e.target.value)}
                className="w-full bg-black border border-zinc-800 p-2 rounded text-white text-xs outline-none focus:border-red-500 uppercase font-bold"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-400 uppercase font-bold block">Disparador de Ejecución:</label>
              <select
                value={ruleTrigger}
                onChange={e => setRuleTrigger(e.target.value as any)}
                className="w-full bg-black border border-zinc-800 p-2 rounded text-cyan-400 font-bold text-xs outline-none cursor-pointer"
              >
                {TRIGGERS.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-400 uppercase font-bold block">Descripción Funcional:</label>
            <textarea
              rows={2}
              placeholder="Explica qué evalúa y qué otorga esta regla..."
              value={ruleDesc}
              onChange={e => setRuleDesc(e.target.value)}
              className="w-full bg-black border border-zinc-800 p-2 rounded text-white text-xs outline-none font-sans"
            />
          </div>

          {/* CONDICIONES EN CADENA */}
          <div className="space-y-3 bg-zinc-900/30 p-4 rounded-xl border border-zinc-850">
            <div className="flex justify-between items-center border-b border-zinc-850 pb-2">
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <Shield size={12} /> Condiciones Evaluadas en Serie (Lógica AND)
              </span>

              <button
                type="button"
                onClick={handleAddCondition}
                className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-amber-300 font-bold text-[9px] uppercase rounded cursor-pointer flex items-center gap-1"
              >
                <Plus size={11} /> Añadir Condición
              </button>
            </div>

            <div className="space-y-2">
              {conditions.map((cond, idx) => (
                <div key={cond.id || idx} className="grid grid-cols-1 md:grid-cols-7 gap-2 bg-black/60 p-2.5 rounded-lg border border-zinc-900 items-center">
                  <div className="md:col-span-3">
                    <label className="text-[8px] text-zinc-500 uppercase block mb-0.5">Parámetro / Columna:</label>
                    <select
                      value={cond.field}
                      onChange={e => handleUpdateCondition(cond.id, { field: e.target.value as any })}
                      className="w-full bg-zinc-950 border border-zinc-800 p-1.5 rounded text-white text-[10px] outline-none cursor-pointer"
                    >
                      {CONDITION_FIELDS.map(f => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-[8px] text-zinc-500 uppercase block mb-0.5">Operador:</label>
                    <select
                      value={cond.operator}
                      onChange={e => handleUpdateCondition(cond.id, { operator: e.target.value as any })}
                      className="w-full bg-zinc-950 border border-zinc-800 p-1.5 rounded text-cyan-300 font-bold text-[10px] outline-none cursor-pointer"
                    >
                      {OPERATORS.map(op => (
                        <option key={op.value} value={op.value}>{op.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[8px] text-zinc-500 uppercase block mb-0.5">Valor Umbral:</label>
                    <input
                      type="text"
                      value={cond.value}
                      onChange={e => handleUpdateCondition(cond.id, { value: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 p-1.5 rounded text-amber-400 font-bold text-center text-[10px] outline-none font-mono"
                    />
                  </div>

                  <div className="text-center pt-2 md:pt-0">
                    <button
                      type="button"
                      onClick={() => handleRemoveCondition(cond.id)}
                      disabled={conditions.length <= 1}
                      className="p-1.5 text-zinc-600 hover:text-red-400 disabled:opacity-20 cursor-pointer"
                      title="Eliminar condición"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ACCIÓN EJECUTABLE */}
          <div className="space-y-3 bg-zinc-900/30 p-4 rounded-xl border border-zinc-850">
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block border-b border-zinc-850 pb-2 flex items-center gap-1">
              <Zap size={12} /> Acción Consecuente si Pasa la Verificación
            </span>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-[9px] text-zinc-400 uppercase font-bold block mb-1">Tipo de Acción:</label>
                <select
                  value={actionType}
                  onChange={e => setActionType(e.target.value as any)}
                  className="w-full bg-black border border-zinc-800 p-2 rounded text-emerald-400 font-bold text-xs outline-none cursor-pointer"
                >
                  {ACTION_TYPES.map(a => (
                    <option key={a.value} value={a.value}>{a.label}</option>
                  ))}
                </select>
              </div>

              {(actionType === 'add_phantom_coins' || actionType === 'add_gd_coins') && (
                <div>
                  <label className="text-[9px] text-zinc-400 uppercase font-bold block mb-1">Monto a Inyectar:</label>
                  <input
                    type="number"
                    min={1}
                    value={actionAmount}
                    onChange={e => setActionAmount(Number(e.target.value))}
                    className="w-full bg-black border border-zinc-800 p-2 rounded text-amber-400 font-bold text-xs outline-none"
                  />
                </div>
              )}

              {actionType === 'grant_item' && (
                <>
                  <div>
                    <label className="text-[9px] text-zinc-400 uppercase font-bold block mb-1">ID de Ítem / Módulo:</label>
                    <input
                      type="text"
                      value={actionItemId}
                      onChange={e => setActionItemId(e.target.value)}
                      className="w-full bg-black border border-zinc-800 p-2 rounded text-white text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-zinc-400 uppercase font-bold block mb-1">Rareza:</label>
                    <select
                      value={actionItemRarity}
                      onChange={e => setActionItemRarity(e.target.value as any)}
                      className="w-full bg-black border border-zinc-800 p-2 rounded text-white text-xs outline-none cursor-pointer"
                    >
                      <option value="common">Common</option>
                      <option value="rare">Rare</option>
                      <option value="epic">Epic</option>
                      <option value="legendary">Legendary</option>
                    </select>
                  </div>
                </>
              )}

              {actionType === 'multiply_xp' && (
                <div>
                  <label className="text-[9px] text-zinc-400 uppercase font-bold block mb-1">Multiplicador (ej: 1.5):</label>
                  <input
                    type="number"
                    step="0.1"
                    min={1}
                    value={actionMultiplier}
                    onChange={e => setActionMultiplier(Number(e.target.value))}
                    className="w-full bg-black border border-zinc-800 p-2 rounded text-cyan-300 font-bold text-xs outline-none"
                  />
                </div>
              )}

              {actionType === 'send_custom_notification' && (
                <div className="md:col-span-2">
                  <label className="text-[9px] text-zinc-400 uppercase font-bold block mb-1">Texto de la Alerta:</label>
                  <input
                    type="text"
                    value={actionMessage}
                    onChange={e => setActionMessage(e.target.value)}
                    className="w-full bg-black border border-zinc-800 p-2 rounded text-white text-xs outline-none"
                  />
                </div>
              )}

              {actionType === 'suspend_account' && (
                <div>
                  <label className="text-[9px] text-zinc-400 uppercase font-bold block mb-1">Días de Suspensión:</label>
                  <input
                    type="number"
                    min={1}
                    value={actionDurationDays}
                    onChange={e => setActionDurationDays(Number(e.target.value))}
                    className="w-full bg-black border border-zinc-800 p-2 rounded text-red-400 font-bold text-xs outline-none"
                  />
                </div>
              )}
            </div>
          </div>
        </form>
      )}

      {/* VISTA 3: SANDBOX EVALUADOR EN VIVO */}
      {activeTab === 'sandbox' && (
        <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-5 animate-fadeIn">
          <div className="border-b border-zinc-900 pb-3">
            <span className="text-xs font-bold uppercase text-cyan-400 block flex items-center gap-1.5">
              <Terminal size={14} /> Simulador Táctico de Reglas en Caliente
            </span>
            <p className="text-[10px] text-zinc-500 font-sans mt-0.5">
              Prueba cualquier regla del juego contra el perfil real de un comandante para verificar si dispararía o rechazaría la acción.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Selector de Comandante */}
            <div className="space-y-3">
              <span className="text-[10px] text-zinc-400 font-bold uppercase block">1. Seleccionar Piloto de Prueba:</span>
              
              <div className="relative">
                <Search size={13} className="absolute left-3 top-2.5 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Escribe para buscar piloto..."
                  value={selectedTestUser ? `${selectedTestUser.username} (#${selectedTestUser.legacy_id || 'N/A'})` : testUserSearch}
                  onChange={e => {
                    setSelectedTestUser(null);
                    setTestUserSearch(e.target.value);
                  }}
                  className="w-full bg-black border border-zinc-800 pl-9 pr-3 py-2 rounded text-white text-xs outline-none focus:border-cyan-500 uppercase font-mono"
                />

                {filteredUsersForTest.length > 0 && !selectedTestUser && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl z-50 divide-y divide-zinc-900">
                    {filteredUsersForTest.map(u => (
                      <div
                        key={u.id}
                        onClick={() => {
                          setSelectedTestUser(u as any);
                          setTestUserSearch('');
                        }}
                        className="p-2 hover:bg-zinc-900 cursor-pointer flex justify-between items-center text-xs"
                      >
                        <span className="font-bold text-white">{u.username}</span>
                        <span className="text-[10px] text-cyan-400 font-mono">
                          {(u as any).legacy_id ? `#${(u as any).legacy_id}` : u.id.substring(0, 8)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedTestUser && (
                <div className="bg-black/60 p-3 rounded-lg border border-zinc-850 space-y-1.5 text-[10px]">
                  <div className="flex justify-between"><span className="text-zinc-500">Nivel CAN:</span><strong className="text-cyan-400">{selectedTestUser.can_level}</strong></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Saldo GD Coins:</span><strong className="text-amber-400">${selectedTestUser.gd_coins.toLocaleString('es-ES')}</strong></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Phantom Coins:</span><strong className="text-purple-400">{selectedTestUser.phantom_coins.toLocaleString('es-ES')}</strong></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Metal en Bóveda:</span><strong className="text-zinc-200">{selectedTestUser.metal.toLocaleString('es-ES')}</strong></div>
                </div>
              )}
            </div>

            {/* Selector de Regla y Ejecución */}
            <div className="lg:col-span-2 space-y-4">
              <span className="text-[10px] text-zinc-400 font-bold uppercase block">2. Seleccionar Regla a Evaluar:</span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {rules.map(r => (
                  <div
                    key={r.id}
                    onClick={() => handleRunSimulation(r)}
                    className="p-3 bg-zinc-900/40 border border-zinc-850 hover:border-cyan-500 rounded-lg cursor-pointer transition-all flex justify-between items-center"
                  >
                    <div>
                      <strong className="text-white text-xs uppercase block">{r.name}</strong>
                      <span className="text-[9px] text-zinc-500">{r.conditions.length} condiciones • {r.trigger}</span>
                    </div>
                    <Play size={13} className="text-cyan-400 shrink-0" />
                  </div>
                ))}
              </div>

              {/* Resultado de la Simulación */}
              {simulationResult && (
                <div className={`p-4 rounded-xl border space-y-3 animate-fadeIn ${
                  simulationResult.allPassed 
                    ? 'bg-emerald-950/20 border-emerald-500/50' 
                    : 'bg-red-950/20 border-red-500/50'
                }`}>
                  <div className="flex justify-between items-center border-b border-zinc-850 pb-2">
                    <div>
                      <span className="text-[9px] text-zinc-500 uppercase block font-bold">Diagnóstico Sandbox:</span>
                      <strong className="text-white text-xs">{simulationResult.ruleName}</strong>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {simulationResult.allPassed ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-black uppercase text-[9px] flex items-center gap-1">
                          <CheckCircle2 size={11} /> CUMPLE (DISPARARÍA)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 font-black uppercase text-[9px] flex items-center gap-1">
                          <XCircle size={11} /> RECHAZADO (NO APLICA)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[8.5px] text-zinc-400 uppercase font-bold block">Desglose de Condiciones:</span>
                    {simulationResult.conditionResults.map((cr, idx) => (
                      <div key={idx} className="p-2 bg-black/60 rounded border border-zinc-900 flex justify-between items-center text-[10px]">
                        <div>
                          <span className="font-mono text-zinc-300">{cr.field}</span>
                          <span className="text-zinc-500 ml-2">({cr.expected})</span>
                        </div>
                        <div className="flex items-center gap-2 font-mono font-bold">
                          <span>Valor Real: {cr.actual}</span>
                          <span className={cr.passed ? 'text-emerald-400' : 'text-red-400'}>
                            {cr.passed ? '✓ PASA' : '✕ FALLA'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-zinc-850 flex justify-between items-center text-[10px]">
                    <span className="text-zinc-400">Acción Resultante:</span>
                    <strong className={simulationResult.allPassed ? 'text-emerald-300' : 'text-zinc-600 line-through'}>
                      {simulationResult.actionPreview}
                    </strong>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConditionEditor;