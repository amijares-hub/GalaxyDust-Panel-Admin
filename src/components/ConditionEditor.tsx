import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cpu, Plus, Trash2, ToggleLeft, ToggleRight, Check, AlertTriangle, 
  HelpCircle, Play, Sparkles, Terminal, ArrowRight, Save, Info, RefreshCw
} from 'lucide-react';
import { GameRule, GameCondition, GameAction, UserProfile } from '../types';

interface ConditionEditorProps {
  rules: GameRule[];
  users: UserProfile[];
  onSaveRules: (updated: GameRule[]) => Promise<void>;
  setIsAlertToShow: (alert: { show: boolean; status: 'success' | 'error'; message: string }) => void;
}

export default function ConditionEditor({ rules, users, onSaveRules, setIsAlertToShow }: ConditionEditorProps) {
  // Local rules array
  const [localRules, setLocalRules] = useState<GameRule[]>(() => 
    rules.map(r => ({ ...r, conditions: r.conditions.map(c => ({ ...c })) }))
  );

  // Interface view switching
  const [activeTab, setActiveTab] = useState<'rules_manager' | 'rules_builder' | 'simulation_sandbox'>('rules_manager');

  // Multi-version snapshots system
  const [versionHistory, setVersionHistory] = useState<Array<{
    id: string;
    timestamp: string;
    action: 'create' | 'delete' | 'toggle' | 'rollback';
    ruleName: string;
    snapshot: GameRule[];
    description: string;
  }>>([
    {
      id: 'v_init_1',
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      action: 'toggle',
      ruleName: 'Incentivo de Transacción Segura',
      description: 'Se deshabilitó temporalmente debido a mantenimiento de pasarela.',
      snapshot: rules.map(r => r.id === 'rule_3' ? { ...r, isActive: false } : { ...r })
    },
    {
      id: 'v_init_2',
      timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
      action: 'create',
      ruleName: 'Bono Especial de Login Dorado',
      description: 'Se inyectó en vivo recompensa de +500 de oro diario.',
      snapshot: [...rules]
    }
  ]);

  // Global system-wide telemetry alerts state
  const [globalAlerts, setGlobalAlerts] = useState([
    {
      id: 'alert_cpu',
      name: 'Sobrecarga de Servidor (>90% CPU)',
      metric: 'Capacidad de Servidor',
      threshold: '90%',
      isEnabled: true,
      channels: ['push', 'email'],
      lastTriggered: '2026-05-21T18:40:02Z'
    },
    {
      id: 'alert_trx',
      name: 'Pico de Transacciones Sospechosas',
      metric: 'Operaciones / min',
      threshold: '>150 trx/min',
      isEnabled: true,
      channels: ['push', 'slack'],
      lastTriggered: 'Nunca'
    },
    {
      id: 'alert_con',
      name: 'Intentos Fallidos de Conexión',
      metric: 'Login Rate-Limit',
      threshold: '>30 fallos/ip',
      isEnabled: false,
      channels: ['push'],
      lastTriggered: '2026-05-20T10:15:30Z'
    }
  ]);

  // Double confirmation deletion stage buffers
  const [ruleToDeleteId, setRuleToDeleteId] = useState<string | null>(null);

  // Rule Builder Form States
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleDescription, setNewRuleDescription] = useState('');
  const [newRuleTrigger, setNewRuleTrigger] = useState<GameRule['trigger']>('on_login');
  const [newConditions, setNewConditions] = useState<Omit<GameCondition, 'id'>[]>([
    { field: 'user.level', operator: 'greater_than', value: 10 }
  ]);
  const [newActionType, setNewActionType] = useState<GameAction['type']>('add_gold');
  const [newActionParams, setNewActionParams] = useState<GameAction['params']>({
    amount: 100,
    message: 'Premio por cumplir condiciones'
  });

  // Simulator sandboxed states
  const [selectedSimUser, setSelectedSimUser] = useState<string>(users[0]?.id || '');
  const [selectedSimRule, setSelectedSimRule] = useState<string>(rules[0]?.id || '');
  const [simLog, setSimLog] = useState<Array<{ type: 'info' | 'success' | 'warning' | 'error', text: string }>>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  // Helper arrays for visual selections
  const triggersList = [
    { key: 'on_login', name: 'Inicio de Sesion (on_login)' },
    { key: 'on_level_up', name: 'Al Subir de Nivel (on_level_up)' },
    { key: 'on_quest_complete', name: 'Mision Completada (on_quest_complete)' },
    { key: 'on_pvp_win', name: 'Victoria PvP (on_pvp_win)' },
    { key: 'on_transaction', name: 'Transaccion Realizada (on_transaction)' },
  ];

  const fieldsList = [
    { key: 'user.level', name: 'Nivel del Jugador (user.level)' },
    { key: 'user.gold', name: 'Oro en Balance (user.gold)' },
    { key: 'user.gems', name: 'Gemas en Balance (user.gems)' },
    { key: 'user.registration_days', name: 'Dias desde Registro (user.registration_days)' },
    { key: 'user.xp', name: 'Experiencia Acumulada (user.xp)' },
  ];

  const operatorsList = [
    { key: 'greater_than', name: 'Mayor que (>)' },
    { key: 'less_than', name: 'Menor que (<)' },
    { key: 'equals', name: 'Igual a (=)' },
    { key: 'not_equals', name: 'Diferente de (!=)' },
  ];

  const actionsList = [
    { key: 'add_gold', name: 'Otorgar Oro (add_gold)' },
    { key: 'add_gems', name: 'Otorgar Gemas (add_gems)' },
    { key: 'grant_item', name: 'Otorgar Item Inventario (grant_item)' },
    { key: 'multiply_xp', name: 'Multiplicar Experiencia (multiply_xp)' },
    { key: 'suspend_account', name: 'Baneo Temporal (suspend_account)' },
  ];

  // Conflict scanner helper
  const detectConflicts = (rule: GameRule, allRules: GameRule[]): { hasConflict: boolean; reason?: string } => {
    if (!rule.isActive) return { hasConflict: false };

    for (const other of allRules) {
      if (other.id === rule.id || !other.isActive) continue;

      if (other.trigger === rule.trigger) {
        const condFieldsRule = rule.conditions.map(c => `${c.field}-${c.operator}-${c.value}`).sort().join('|');
        const condFieldsOther = other.conditions.map(c => `${c.field}-${c.operator}-${c.value}`).sort().join('|');

        if (condFieldsRule === condFieldsOther) {
          if (other.action.type === rule.action.type) {
            const valRule = (rule.action.params as any).amount || (rule.action.params as any).quantity || (rule.action.params as any).multiplier;
            const valOther = (other.action.params as any).amount || (other.action.params as any).quantity || (other.action.params as any).multiplier;
            if (valRule !== valOther) {
              return {
                hasConflict: true,
                reason: `Conflicto con "${other.name}": mismo disparador y requisitos lógicos, pero otorga montos incompatibles (${valRule} vs ${valOther}).`
              };
            }
          } else {
            return {
              hasConflict: true,
              reason: `Conflicto con "${other.name}": mismo disparador y requisitos lógicos, pero ejecuta acciones divergentes (${rule.action.type.toUpperCase()} vs ${other.action.type.toUpperCase()}).`
            };
          }
        }

        if (rule.action.type === 'grant_item' && other.action.type === 'grant_item') {
          const itemRule = (rule.action.params as any).itemId;
          const itemOther = (other.action.params as any).itemId;
          if (itemRule && itemRule === itemOther) {
            const qtyRule = (rule.action.params as any).quantity;
            const qtyOther = (other.action.params as any).quantity;
            if (qtyRule !== qtyOther) {
              return {
                hasConflict: true,
                reason: `Conflicto de Objeto con "${other.name}": ambos otorgan el item "${itemRule}" al dispararse "${rule.trigger}" pero con cantidades incongruentes (${qtyRule} vs ${qtyOther}).`
              };
            }
          }
        }
      }
    }
    return { hasConflict: false };
  };

  const handleToggleRule = async (ruleId: string) => {
    const prevSnapshot = [...localRules];
    const ruleRef = localRules.find(r => r.id === ruleId);

    const updated = localRules.map(r => {
      if (r.id === ruleId) {
        return { ...r, isActive: !r.isActive };
      }
      return r;
    });
    setLocalRules(updated);

    setVersionHistory(prev => [
      {
        id: `v_act_${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'toggle',
        ruleName: ruleRef?.name || 'Regla',
        description: `Estatus alternado para "${ruleRef?.name}" a ${!ruleRef?.isActive ? 'ACTIVADO' : 'DESACTIVADO'}`,
        snapshot: prevSnapshot
      },
      ...prev
    ].slice(0, 5));

    try {
      await onSaveRules(updated);
    } catch (e: any) {
      setIsAlertToShow({ show: true, status: 'error', message: e.message || 'Error al guardar regla' });
    }
  };

  const handleAddConditionRow = () => {
    setNewConditions(prev => [...prev, { field: 'user.level', operator: 'greater_than', value: 10 }]);
  };

  const handleRemoveConditionRow = (index: number) => {
    setNewConditions(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateConditionRow = (index: number, key: keyof Omit<GameCondition, 'id'>, value: any) => {
    setNewConditions(prev => prev.map((item, i) => {
      if (i === index) {
        return { ...item, [key]: value };
      }
      return item;
    }));
  };

  const handleActionTypeChange = (type: GameAction['type']) => {
    setNewActionType(type);
    if (type === 'add_gold' || type === 'add_gems') {
      setNewActionParams({ amount: 100, message: 'Premio por cumplir condiciones' });
    } else if (type === 'grant_item') {
      setNewActionParams({ itemId: 'inv_1', itemRarity: 'epic', quantity: 1, message: '¡Has recibido un objeto formidable!' } as any);
    } else if (type === 'multiply_xp') {
      setNewActionParams({ multiplier: 1.5, message: 'Bono multiplicador de XP activo' });
    } else if (type === 'suspend_account') {
      setNewActionParams({ durationDays: 7, message: 'Actividades anomalas reportadas en el servidor.' });
    }
  };

  const handleActionParamChange = (key: string, value: any) => {
    setNewActionParams(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleCreateRuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName || !newRuleDescription) {
      setIsAlertToShow({ show: true, status: 'error', message: 'Por favor, llena los campos básicos de la regla.' });
      return;
    }

    const compiledConditions: GameCondition[] = newConditions.map((cond, idx) => ({
      id: `cond_${Date.now()}_${idx}`,
      field: cond.field as any,
      operator: cond.operator as any,
      value: isNaN(Number(cond.value)) ? cond.value : Number(cond.value)
    }));

    const compiledRule: GameRule = {
      id: `rule_custom_${Date.now()}`,
      name: newRuleName,
      description: newRuleDescription,
      trigger: newRuleTrigger,
      conditions: compiledConditions,
      action: {
        type: newActionType,
        params: newActionParams
      },
      isActive: true,
      tooltip: `Creado el ${new Date().toLocaleDateString()}. Disparado por ${newRuleTrigger}.`,
      created_at: new Date().toISOString()
    };

    const prevSnapshot = [...localRules];
    const updated = [...localRules, compiledRule];
    setLocalRules(updated);

    setVersionHistory(prev => [
      {
        id: `v_act_${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'create',
        ruleName: compiledRule.name,
        description: `Creador: se configuró exitosamente la nueva regla "${compiledRule.name}"`,
        snapshot: prevSnapshot
      },
      ...prev
    ].slice(0, 5));
    
    try {
      await onSaveRules(updated);
      setIsAlertToShow({ show: true, status: 'success', message: '¡Nueva regla inyectada con éxito en el motor lúdico!' });
      
      // Reset form & go to list
      setNewRuleName('');
      setNewRuleDescription('');
      setNewConditions([{ field: 'user.level', operator: 'greater_than', value: 10 }]);
      setActiveTab('rules_manager');
    } catch (err: any) {
      setIsAlertToShow({ show: true, status: 'error', message: err.message || 'Fallo de sincronización' });
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    const prevSnapshot = [...localRules];
    const ruleRef = localRules.find(r => r.id === ruleId);
    const updated = localRules.filter(r => r.id !== ruleId);
    setLocalRules(updated);

    setVersionHistory(prev => [
      {
        id: `v_act_${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'delete',
        ruleName: ruleRef?.name || 'Regla',
        description: `Destrucción: se removió la regla "${ruleRef?.name}" por orden administrativa`,
        snapshot: prevSnapshot
      },
      ...prev
    ].slice(0, 5));

    try {
      await onSaveRules(updated);
      setIsAlertToShow({ show: true, status: 'success', message: 'Regla removida correctamente.' });
    } catch (e: any) {
      setIsAlertToShow({ show: true, status: 'error', message: e.message || 'Error al remover' });
    }
  };

  const handleRollbackVersion = async (versionIndex: number) => {
    const targetVersion = versionHistory[versionIndex];
    if (!targetVersion) return;

    const currentSnapshot = [...localRules];
    setLocalRules(targetVersion.snapshot);
    
    try {
      await onSaveRules(targetVersion.snapshot);
      
      setVersionHistory(prev => [
        {
          id: `v_rollback_${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'rollback',
          ruleName: targetVersion.ruleName,
          description: `Rollback: Se revirtió el motor lúdico al estado de "${targetVersion.ruleName}"`,
          snapshot: currentSnapshot
        },
        ...prev
      ].slice(0, 5));

      setIsAlertToShow({
        show: true,
        status: 'success',
        message: '¡REVERTIDO CON ÉXITO! Las reglas lúdicas han regresado a la configuración seleccionada.'
      });
    } catch (err: any) {
      setIsAlertToShow({ show: true, status: 'error', message: err.message || 'Fallo militar al restaurar' });
    }
  };

  const handleTriggerSimulatedAlert = (alertName: string) => {
    setIsAlertToShow({
      show: true,
      status: 'success',
      message: `[ALERTA TELEMETRÍA PUSH] Transmisión efectuada sobre canal principal: "${alertName}" superó parámetros seguros.`
    });
    setGlobalAlerts(prev => prev.map(a => a.name === alertName ? { ...a, lastTriggered: new Date().toISOString() } : a));
  };

  // Run Rule Simulation sandbox triggers
  const handleRunSimulation = () => {
    const user = users.find(u => u.id === selectedSimUser);
    const rule = localRules.find(r => r.id === selectedSimRule);

    if (!user || !rule) {
      setSimLog([{ type: 'error', text: 'Error de entrada: Faltan variables de usuario o regla.' }]);
      return;
    }

    setIsSimulating(true);
    setSimLog([]);

    const log: typeof simLog = [];
    log.push({ type: 'info', text: `INICIANDO EVALUACIÓN: [Regla: ${rule.name}] vs [Usuario: ${user.username}]` });
    log.push({ type: 'info', text: `Verificando disparador: ${rule.trigger.toUpperCase()}` });
    log.push({ type: 'info', text: `Atributos usuario: Lvl:${user.level} | Gold:${user.gold} | Gems:${user.gems} | Rol:${user.role} | Estatus:${user.status}` });

    let allConditionsMet = true;

    rule.conditions.forEach((cond, idx) => {
      let isMet = false;
      let attributeVal: any = null;

      if (cond.field === 'user.level') attributeVal = user.level;
      else if (cond.field === 'user.gold') attributeVal = user.gold;
      else if (cond.field === 'user.gems') attributeVal = user.gems;
      else if (cond.field === 'user.xp') attributeVal = user.xp;
      else if (cond.field === 'user.registration_days') {
        const regDate = new Date(user.created_at).getTime();
        const diffDays = Math.floor((Date.now() - regDate) / (1000 * 3600 * 24));
        attributeVal = diffDays;
      }

      const compVal = cond.value;

      if (cond.operator === 'greater_than') isMet = Number(attributeVal) > Number(compVal);
      else if (cond.operator === 'less_than') isMet = Number(attributeVal) < Number(compVal);
      else if (cond.operator === 'equals') isMet = String(attributeVal) === String(compVal);
      else if (cond.operator === 'not_equals') isMet = String(attributeVal) !== String(compVal);

      if (isMet) {
        log.push({ type: 'success', text: `  ✓ Condición [${idx + 1}]: Campo ${cond.field} (${attributeVal}) ${cond.operator} valor (${compVal}) - APROBADO` });
      } else {
        log.push({ type: 'error', text: `  ✗ Condición [${idx + 1}]: Campo ${cond.field} (${attributeVal}) ${cond.operator} valor (${compVal}) - RECHAZADO` });
        allConditionsMet = false;
      }
    });

    if (allConditionsMet) {
      log.push({ type: 'success', text: `>>> COMPILACIÓN DE REGLA EXITOSA. Disparando acción: [${rule.action.type}]` });
      
      const p = rule.action.params;
      if (rule.action.type === 'add_gold') {
        log.push({ type: 'success', text: `RECOMPENSA: Se otorgó +${p.amount} Oro a ${user.username}. Mensaje: "${p.message}"` });
      } else if (rule.action.type === 'add_gems') {
        log.push({ type: 'success', text: `RECOMPENSA: Se otorgó +${p.amount} Gemas Escarlata a ${user.username}.` });
      } else if (rule.action.type === 'grant_item') {
        log.push({ type: 'success', text: `INVENTARIO: Objeto inyectado [ID: ${p.itemId || 'objeto'}] rareza [${p.itemRarity || 'rare'}].` });
      } else if (rule.action.type === 'multiply_xp') {
        log.push({ type: 'success', text: `EXPERIENCIA: Modificador de combate ajustado a x${p.multiplier || 1.0}.` });
      } else if (rule.action.type === 'suspend_account') {
        log.push({ type: 'warning', text: `SEGURIDAD: Suspensión por ${p.durationDays || 'N/A'} días a la cuenta. Razón: "${p.message}"` });
      }
    } else {
      log.push({ type: 'warning', text: '>>> EVALUACIÓN RECHAZADA: No se cumplieron todos los prerrequisitos de evaluación.' });
    }

    setTimeout(() => {
      setSimLog(log);
      setIsSimulating(false);
    }, 850);
  };

  return (
    <div className="h-full flex flex-col space-y-6">

      {/* Top Section Nav & Summary */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-950 border border-zinc-900 rounded-xl p-5">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Cpu className="text-red-500 animate-pulse" size={20} /> Motor de Funciones y Condiciones de Juego
          </h2>
          <p className="text-xs text-zinc-400">
            Define la lógica, desencadenantes de logros, recompensas dinámicas y seguridad perimetral de Sasorilabs.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-1 text-xs select-none">
          <button
            onClick={() => setActiveTab('rules_manager')}
            className={`py-2 px-4 rounded-md font-semibold cursor-pointer tracking-wider transition-all uppercase ${
              activeTab === 'rules_manager' ? 'bg-red-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Lógica del Servidor
          </button>
          <button
            onClick={() => setActiveTab('rules_builder')}
            className={`py-2 px-4 rounded-md font-semibold cursor-pointer tracking-wider transition-all uppercase ${
              activeTab === 'rules_builder' ? 'bg-red-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Creador de Reglas
          </button>
          <button
            onClick={() => {
              setActiveTab('simulation_sandbox');
              if (localRules.length > 0) setSelectedSimRule(localRules[0].id);
            }}
            className={`py-2 px-4 rounded-md font-semibold cursor-pointer tracking-wider transition-all uppercase ${
              activeTab === 'simulation_sandbox' ? 'bg-red-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Simulador Sandbox
          </button>
        </div>
      </div>

      {/* RENDER ACTIVE VIEWS DETAILS */}
      <div className="flex-1 font-sans">
        
        {/* VIEW 1: RULES LIST MANAGER */}
        {activeTab === 'rules_manager' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
            
            {/* Left Column: Rules listing with conflict scanner */}
            <div className="lg:col-span-2 space-y-6">
              {/* Disclaimer info banner */}
              <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl flex items-start gap-3.5">
                <Info className="text-red-500 flex-shrink-0 mt-0.5" size={16} />
                <div className="text-xs text-zinc-450 leading-relaxed">
                  <span className="font-bold text-zinc-200">¿Cómo actúan estas condiciones?</span> El motor escucha eventos transaccionales, logins o combates. Al activarse, evalúa secuencialmente los criterios declarados en la tabla inferior contra el contexto del jugador que causó el evento. Si el resultado es favorable, ejecuta la acción inmediata programada. Puedes activar/desactivar reglas en tiempo real.
                </div>
              </div>

              <div className="bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden p-5 space-y-4">
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-500 font-mono">
                  REGLAS ACTIVAS EN BASE DE DATOS ({localRules.length})
                </span>

                <div className="space-y-4 pt-2">
                  {localRules.length === 0 ? (
                    <div className="text-center py-10 border border-dashed border-zinc-800 rounded-xl text-zinc-500">
                      No hay condiciones configuradas en el sistema. Crea una usando el "Creador de Reglas".
                    </div>
                  ) : (
                    localRules.map((rule) => {
                      const conflictInfo = detectConflicts(rule, localRules);
                      return (
                        <div
                          key={rule.id}
                          className={`group p-5 bg-zinc-900/40 hover:bg-zinc-900/90 border transition-all rounded-xl relative flex flex-col md:flex-row gap-6 md:items-center justify-between ${
                            conflictInfo.hasConflict ? 'border-red-950/40 bg-red-950/5' : 'border-zinc-850 hover:border-zinc-800'
                          }`}
                        >
                          {/* Left: Metadata */}
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3 flex-wrap">
                              <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] font-mono font-bold text-red-150">
                                {rule.trigger.toUpperCase()}
                              </span>
                              <h3 className="text-sm font-bold text-white tracking-wide">
                                {rule.name}
                              </h3>
                              {conflictInfo.hasConflict && (
                                <span 
                                  className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-650/15 border border-red-500/20 text-red-500 text-[9.5px] font-mono font-semibold animate-pulse cursor-help"
                                  title={conflictInfo.reason}
                                >
                                  <AlertTriangle size={11} />
                                  <span>LOGIC_CONFLICT</span>
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-zinc-400 leading-normal max-w-2xl">
                              {rule.description}
                            </p>

                            {conflictInfo.hasConflict && (
                              <p className="text-[10px] font-mono text-red-400/80 bg-red-950/10 p-2 rounded border border-red-900/10 mb-2 leading-relaxed">
                                <strong>Advertencia:</strong> {conflictInfo.reason}
                              </p>
                            )}

                            {/* Conditions and actions nested specs */}
                            <div className="pt-2 flex flex-wrap items-center gap-2">
                              <span className="text-[10px] text-zinc-500 font-mono">SI</span>
                              {rule.conditions.map((cond, ci) => (
                                <span 
                                  key={cond.id || ci} 
                                  className="px-2 py-1 rounded bg-black border border-zinc-800 text-[10px] sm:text-xs font-mono text-zinc-300 flex items-center gap-1 hover:border-red-500/30 cursor-help"
                                  title="Condición requerida"
                                >
                                  <strong>{cond.field.replace('user.', '')}</strong>
                                  <span className="text-red-500 font-bold">
                                    {cond.operator === 'greater_than' ? '>' : cond.operator === 'less_than' ? '<' :cond.operator === 'equals' ? '==' : '!='}
                                  </span>
                                  <span>{cond.value}</span>
                                </span>
                              ))}
                              
                              <ArrowRight size={13} className="text-zinc-650" />
                              <span className="text-[10px] text-zinc-500 font-mono">ENTONCES</span>
                              <span 
                                className="px-2 py-1 rounded bg-red-650/10 border border-red-500/20 text-[10px] sm:text-xs font-mono text-red-400 font-semibold cursor-help"
                                  title="Acción inmediata"
                              >
                                <strong>{rule.action.type.toUpperCase()}</strong>: {JSON.stringify(rule.action.params)}
                              </span>
                            </div>
                          </div>

                          {/* Right: Actions (Toggle, Delete) */}
                          <div className="flex items-center gap-4 border-t md:border-t-0 border-zinc-850 pt-4 md:pt-0">
                            {/* Toggle active / inactive switch */}
                            <button
                              type="button"
                              onClick={() => handleToggleRule(rule.id)}
                              className="flex items-center gap-2 text-xs font-bold font-mono tracking-wider text-zinc-400 hover:text-white transition-colors cursor-pointer"
                            >
                              {rule.isActive ? (
                                <div className="flex items-center gap-1.5 text-red-500">
                                  <span>ACTIVA</span>
                                  <ToggleRight size={24} />
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 text-zinc-650">
                                  <span>INACTIVA</span>
                                  <ToggleLeft size={24} />
                                </div>
                              )}
                            </button>

                            <button
                              onClick={() => setRuleToDeleteId(rule.id)}
                              className="p-2 rounded bg-zinc-950 hover:bg-zinc-800 border border-zinc-850 hover:border-red-500/30 text-zinc-500 hover:text-red-500 transition-colors cursor-pointer"
                              title="Eliminar regla"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>

                          {/* Floating tooltip icon */}
                          <div className="absolute top-2.5 right-2 px-1 rounded hover:bg-zinc-800 cursor-help text-zinc-500 text-[10px]" title={rule.tooltip}>
                            <HelpCircle size={13} />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Version snaps rollback & Global alerts engine */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* VERSION SNAPSHOTS COMPONENT */}
              <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4">
                <span className="text-xs font-bold uppercase tracking-widest text-red-500 font-mono flex items-center gap-1.5">
                  <RefreshCw size={13} className="animate-spin text-red-500 shrink-0" />
                  <span>Historial de Versiones (Rollback)</span>
                </span>
                
                <p className="text-[11px] text-zinc-500 leading-normal">
                  Consola de reversión instantánea lúdica. Registra los últimos 5 cambios realizados en las políticas lúdicas del servidor celular.
                </p>

                <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                  {versionHistory.map((ver, idx) => (
                    <div key={ver.id || idx} className="p-3 bg-zinc-900/40 border border-zinc-850 rounded-lg text-[10px] space-y-2 hover:border-zinc-800 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className={`px-1.5 py-0.5 rounded-[2px] font-mono text-[8.5px] font-bold uppercase ${
                          ver.action === 'create' ? 'bg-emerald-500/10 text-emerald-400' :
                          ver.action === 'delete' ? 'bg-red-500/10 text-red-400' :
                          ver.action === 'rollback' ? 'bg-purple-500/10 text-purple-400 font-bold' :
                          'bg-amber-500/10 text-amber-400'
                        }`}>
                          {ver.action.toUpperCase()}
                        </span>
                        <span className="text-[8px] text-zinc-600 font-mono">
                          {new Date(ver.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                      
                      <div>
                        <h4 className="text-zinc-200 font-semibold">{ver.ruleName}</h4>
                        <p className="text-zinc-500 mt-1 leading-normal">{ver.description}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRollbackVersion(idx)}
                        className="w-full py-1 bg-red-950/20 hover:bg-red-650 hover:text-white border border-red-900/30 text-red-500 font-bold tracking-wider text-[8.5px] rounded uppercase cursor-pointer transition-all"
                      >
                        REVERTIR A ESTA VERSIÓN
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* GLOBAL METRICS TELEMETRY CONTROL */}
              <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4">
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 font-mono flex items-center gap-1.5">
                  <Terminal size={13} className="text-red-500" />
                  <span>Telecom / Alertas Globales</span>
                </span>

                <p className="text-[11px] text-zinc-550 leading-normal">
                  Configura contingencias automáticas e integra el motor de notificaciones push para notificar anomalías de red o abusos de recursos del jugador.
                </p>

                <div className="space-y-3">
                  {globalAlerts.map(alert => (
                    <div key={alert.id} className="p-3 bg-zinc-900/40 border border-zinc-850 rounded-lg text-[10px] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-zinc-200">{alert.name}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setGlobalAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, isEnabled: !a.isEnabled } : a));
                            setIsAlertToShow({
                              show: true,
                              status: 'success',
                              message: `Alerta "${alert.name}" ha sido ${!alert.isEnabled ? 'REESTABLECIDA Y COMPILADA' : 'TEMPORALMENTE DESACTUADA'}.`
                            });
                          }}
                          className={`px-1.5 py-0.5 rounded-[2px] font-mono text-[8px] font-bold ${
                            alert.isEnabled ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-zinc-800 text-zinc-650 hover:bg-zinc-800/80'
                          } cursor-pointer transition-colors`}
                        >
                          {alert.isEnabled ? 'ACTIVA' : 'APAGADA'}
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-[8.5px] text-zinc-550 font-mono">
                        <span>Límite: <strong className="text-zinc-400">{alert.threshold}</strong></span>
                        <span>Métrica: <strong className="text-zinc-400">{alert.metric}</strong></span>
                      </div>

                      <div className="flex items-center justify-between text-[8px] text-zinc-600 font-mono">
                        <span>Canales: {alert.channels.join(', ').toUpperCase()}</span>
                        <span>Último: {alert.lastTriggered === 'Nunca' ? 'Nunca' : new Date(alert.lastTriggered).toLocaleTimeString()}</span>
                      </div>

                      {alert.isEnabled && (
                        <button
                          type="button"
                          onClick={() => handleTriggerSimulatedAlert(alert.name)}
                          className="w-full py-1.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-red-500 font-bold tracking-wider text-[8px] rounded uppercase cursor-pointer transition-colors"
                        >
                          Disparar Simulación Push 📡
                        </button>
                      )}
                    </div>
                  ))}
                  
                  {/* Quick ADD Global Alert Mini-Form */}
                  <div className="pt-2.5 border-t border-zinc-900 space-y-2">
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest font-mono">Agregar Alerta de Contingencia</span>
                    <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                      <input
                        type="text"
                        id="newAlertName"
                        placeholder="Nombre Alerta"
                        className="p-1 px-2 bg-black border border-zinc-800 rounded text-white focus:outline-none focus:border-red-500 h-7 text-[10px]"
                      />
                      <input
                        type="text"
                        id="newAlertMetric"
                        placeholder="Métrica"
                        className="p-1 px-2 bg-black border border-zinc-800 rounded text-white focus:outline-none focus:border-red-500 h-7 text-[10px]"
                      />
                      <input
                        type="text"
                        id="newAlertThreshold"
                        placeholder="Umbral"
                        className="p-1 px-2 bg-black border border-zinc-800 rounded text-white focus:outline-none focus:border-red-500 h-7 text-[10px] col-span-2"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const nameEl = document.getElementById('newAlertName') as HTMLInputElement;
                        const metricEl = document.getElementById('newAlertMetric') as HTMLInputElement;
                        const threshEl = document.getElementById('newAlertThreshold') as HTMLInputElement;
                        if (nameEl && metricEl && threshEl && nameEl.value && metricEl.value && threshEl.value) {
                          const newAlert = {
                            id: `alert_dyn_${Date.now()}`,
                            name: nameEl.value,
                            metric: metricEl.value,
                            threshold: threshEl.value,
                            isEnabled: true,
                            channels: ['push'],
                            lastTriggered: 'Nunca'
                          };
                          setGlobalAlerts(prev => [...prev, newAlert]);
                          setIsAlertToShow({
                            show: true,
                            status: 'success',
                            message: `¡ALERTA GLOBAL PROGRAMADA! Se creó la contingencia fiscal "${nameEl.value}".`
                          });
                          nameEl.value = '';
                          metricEl.value = '';
                          threshEl.value = '';
                        } else {
                          setIsAlertToShow({
                            show: true,
                            status: 'error',
                            message: 'Por favor complete todos los datos para la alerta de telemetría.'
                          });
                        }
                      }}
                      className="w-full py-1.5 bg-red-650 hover:bg-red-500 text-white text-[8px] font-bold tracking-wider rounded uppercase cursor-pointer transition-colors"
                    >
                      Compilar Directriz de Contingencia
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* VIEW 2: RULE BUILDER FORM */}
        {activeTab === 'rules_builder' && (
          <form onSubmit={handleCreateRuleSubmit} className="bg-zinc-950 border border-zinc-900 rounded-xl p-6 space-y-6 animate-fadeIn">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Constructor Lógico (Creador de Condiciones)
              </h3>
              <p className="text-xs text-zinc-500 mt-1">Conecta disparadores con condiciones personalizadas para accionar comportamientos.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Basic Name/Trigger info */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Nombre del Regulador</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Recompensa de Nivel 50"
                    value={newRuleName}
                    onChange={(e) => setNewRuleName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Descripción del Comportamiento</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe exactamente qué hace la regla de forma técnica y humana."
                    value={newRuleDescription}
                    onChange={(e) => setNewRuleDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-red-500 resize-none leading-relaxed"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Disparador del Servidor (Trigger)</label>
                  <select
                    value={newRuleTrigger}
                    onChange={(e) => setNewRuleTrigger(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-red-500 font-sans"
                  >
                    {triggersList.map(t => (
                      <option key={t.key} value={t.key}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Right Column: Conditions Rows Builder */}
              <div className="space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-1">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Condiciones Requeridas (Operación AND)</label>
                    <button
                      type="button"
                      onClick={handleAddConditionRow}
                      className="text-[11px] py-1 px-2.5 rounded hover:bg-zinc-900 border border-zinc-800 text-red-500 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer animate-pulse"
                    >
                      <Plus size={11} /> Añadir Criterio
                    </button>
                  </div>

                  <div className="space-y-2.5 max-h-[210px] overflow-y-auto pr-1">
                    {newConditions.map((cond, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center bg-zinc-900/60 border border-zinc-850 p-2.5 rounded-lg">
                        <select
                          value={cond.field}
                          onChange={(e) => handleUpdateConditionRow(idx, 'field', e.target.value)}
                          className="flex-1 px-2 py-1 text-xs bg-black text-zinc-300 rounded border border-zinc-800 focus:outline-none"
                        >
                          {fieldsList.map(f => (
                            <option key={f.key} value={f.key}>{f.name.replace('user.', '')}</option>
                          ))}
                        </select>

                        <select
                          value={cond.operator}
                          onChange={(e) => handleUpdateConditionRow(idx, 'operator', e.target.value)}
                          className="w-28 px-2 py-1 text-xs bg-black text-zinc-300 rounded border border-zinc-800 focus:outline-none"
                        >
                          {operatorsList.map(o => (
                            <option key={o.key} value={o.key}>{o.name}</option>
                          ))}
                        </select>

                        <input
                          type="text"
                          required
                          value={cond.value}
                          onChange={(e) => handleUpdateConditionRow(idx, 'value', e.target.value)}
                          className="w-20 px-2 py-1 text-xs bg-black text-zinc-300 rounded border border-zinc-800 text-center font-mono focus:outline-none focus:border-red-500"
                        />

                        {newConditions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveConditionRow(idx)}
                            className="p-1 px-2.5 bg-zinc-950 hover:bg-zinc-800 rounded border border-zinc-850 hover:border-red-500/30 text-zinc-500 hover:text-red-500 transition-colors cursor-pointer text-xs"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom section of form: Action Selector */}
                <div className="p-4 bg-zinc-900/20 border border-zinc-900 rounded-xl space-y-4">
                  <span className="text-xs font-bold text-red-500 uppercase flex items-center gap-1.5 leading-none">
                    <Sparkles size={12} /> Acción resultante a ejecutar
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Tipo de Acción</label>
                      <select
                        value={newActionType}
                        onChange={(e) => handleActionTypeChange(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs bg-zinc-900 border border-zinc-800 rounded text-white focus:outline-none"
                      >
                        {actionsList.map(ac => (
                          <option key={ac.key} value={ac.key}>{ac.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Render parameters inputs according to action selected */}
                    <div className="space-y-1.5">
                      {newActionType === 'add_gold' || newActionType === 'add_gems' ? (
                        <>
                          <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Cantidad numérica</label>
                          <input
                            type="number"
                            min={1}
                            required
                            value={newActionParams.amount || 100}
                            onChange={(e) => handleActionParamChange('amount', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 text-xs bg-zinc-900 border border-zinc-800 rounded text-white focus:outline-none focus:border-red-500"
                          />
                        </>
                      ) : newActionType === 'grant_item' ? (
                        <>
                          <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">ID de Item e Inventario</label>
                          <select
                            value={newActionParams.itemId || 'inv_1'}
                            onChange={(e) => handleActionParamChange('itemId', e.target.value)}
                            className="w-full px-3 py-2 text-xs bg-zinc-900 border border-zinc-800 rounded text-white focus:outline-none"
                          >
                            <option value="inv_1">Espada de Plasma Escarlata (Legendario)</option>
                            <option value="inv_2">Escudo Reflector (Épico)</option>
                            <option value="inv_7">Medalla del Iniciado (Raro)</option>
                          </select>
                        </>
                      ) : newActionType === 'multiply_xp' ? (
                        <>
                          <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Factor multiplicador</label>
                          <input
                            type="number"
                            step={0.1}
                            min={1}
                            max={5}
                            required
                            value={newActionParams.multiplier || 1.1}
                            onChange={(e) => handleActionParamChange('multiplier', parseFloat(e.target.value) || 1.1)}
                            className="w-full px-3 py-2 text-xs bg-zinc-900 border border-zinc-800 rounded text-white focus:outline-none"
                          />
                        </>
                      ) : (
                        <>
                          <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Días de bann</label>
                          <input
                            type="number"
                            min={1}
                            required
                            value={newActionParams.durationDays || 7}
                            onChange={(e) => handleActionParamChange('durationDays', parseInt(e.target.value) || 1)}
                            className="w-full px-3 py-2 text-xs bg-zinc-900 border border-zinc-800 rounded text-white focus:outline-none"
                          />
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Mensaje de Alerta al Jugador (Log de Inyectores)</label>
                    <input
                      type="text"
                      placeholder="Ej. ¡Felicidades! Se inyectó +500 Gold"
                      value={newActionParams.message || ''}
                      onChange={(e) => handleActionParamChange('message', e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-zinc-900 border border-zinc-800 rounded text-white focus:outline-none"
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* Bottom Form CTA Buttons */}
            <div className="flex justify-end gap-3 pt-2 border-t border-zinc-900">
              <button
                type="button"
                onClick={() => setActiveTab('rules_manager')}
                className="py-2.5 px-5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-bold rounded-lg border border-zinc-800 cursor-pointer transition-colors"
              >
                Cancelar Carga
              </button>
              <button
                type="submit"
                className="py-2.5 px-6 bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-lg hover:shadow-red-600/10 cursor-pointer flex items-center gap-1.5"
              >
                <Save size={13} /> Registrar en el Motor
              </button>
            </div>
          </form>
        )}

        {/* VIEW 3: SIMULATION SANDBOX REGISTRY */}
        {activeTab === 'simulation_sandbox' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
            
            {/* Simulation controls card */}
            <div className="lg:col-span-5 bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-5 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-500 font-mono">
                  PARÁMETROS DEL SIMULADOR
                </span>
                <p className="text-xs text-zinc-500 mt-1">
                  Ejecuta auditorías y pruebas unitarias de tus reglas analizando las propiedades de tus usuarios reales registrados.
                </p>
              </div>

              {/* User Picker */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                  1. Seleccionar Jugador Evaluado
                </label>
                <select
                  value={selectedSimUser}
                  onChange={(e) => setSelectedSimUser(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white font-sans text-xs focus:outline-none focus:border-red-500"
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.username} (Nivel {u.level} • {u.role.toUpperCase()} • {u.status.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Rule Picker */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                  2. Seleccionar Regla a auditar
                </label>
                <select
                  value={selectedSimRule}
                  onChange={(e) => setSelectedSimRule(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white font-sans text-xs focus:outline-none focus:border-red-500"
                >
                  {localRules.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.trigger.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Guide Note */}
              <div className="p-3 bg-red-600/5 border border-red-500/10 rounded-lg text-[11px] text-zinc-450 leading-relaxed flex gap-2">
                <HelpCircle className="text-red-500 flex-shrink-0 mt-0.5 animate-bounce" size={14} />
                <span>
                  El simulador emula el compilador nativo del servidor del juego de Sasorilabs. No alterará la base de datos real a menos que guardes los cambios en el CRM.
                </span>
              </div>

              {/* Run CTA trigger */}
              <button
                onClick={handleRunSimulation}
                disabled={isSimulating}
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-lg hover:shadow-red-900/10 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSimulating ? (
                  <RefreshCw className="animate-spin" size={14} />
                ) : (
                  <Play size={14} />
                )}
                {isSimulating ? 'Compilando Reglas...' : 'Compilar y Simular Regla'}
              </button>
            </div>

            {/* Simulated compiler visual terminal stdout */}
            <div className="lg:col-span-7 bg-black border border-zinc-900 rounded-xl p-5 flex flex-col space-y-4">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-zinc-400 flex items-center gap-2">
                  <Terminal size={14} className="text-red-500" /> compilador-sasori@console:~$
                </span>
                <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
              </div>

              {/* Console log workspace */}
              <div className="flex-1 min-h-[280px] bg-zinc-950 p-4 rounded-lg font-mono text-xs overflow-y-auto space-y-2 text-zinc-300 border border-zinc-900 leading-normal">
                {simLog.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-650 pt-16">
                    <Terminal size={24} className="mb-2" />
                    <p>Listo para auditar.</p>
                    <p className="text-[10px]">Configura los parámetros y presiona "Simular".</p>
                  </div>
                ) : (
                  simLog.map((log, li) => (
                    <div
                      key={li}
                      className={`
                        ${log.type === 'success' ? 'text-emerald-400 font-semibold' : ''}
                        ${log.type === 'warning' ? 'text-amber-500 font-semibold' : ''}
                        ${log.type === 'error' ? 'text-red-500 font-semibold' : ''}
                        ${log.type === 'info' ? 'text-zinc-500' : ''}
                      `}
                    >
                      {log.text}
                    </div>
                  ))
                )}
              </div>

              {/* Clear console controls */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setSimLog([])}
                  className="text-[10px] font-mono hover:text-white transition-colors text-zinc-600 cursor-pointer"
                >
                  Limpiar Consola [clear]
                </button>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* ELIMINAR REGLA CONFIRMATION MODAL */}
      <AnimatePresence>
        {ruleToDeleteId && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-950 border border-zinc-800 p-6 rounded-lg max-w-sm w-full space-y-4 font-sans"
            >
              <div className="flex items-center gap-2.5 text-red-500 font-mono font-bold uppercase tracking-wider text-xs">
                <AlertTriangle size={18} className="animate-bounce" />
                <span>CONFIRMAR REMOCIÓN DE REGLA</span>
              </div>
              
              <p className="text-xs text-zinc-400 leading-normal">
                ¿Está seguro de que desea eliminar permanentemente la regla <strong>{localRules.find(r => r.id === ruleToDeleteId)?.name}</strong>? Las recompensas o contingencias asociadas dejarán de dispararse en el motor lúdico en vivo.
              </p>

              <div className="flex items-center justify-end gap-2.5 font-mono text-[9px]">
                <button
                  onClick={() => setRuleToDeleteId(null)}
                  className="px-3 py-1.5 bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-zinc-400 rounded cursor-pointer"
                >
                  CONSERVAR REGLA
                </button>
                <button
                  onClick={async () => {
                    if (ruleToDeleteId) {
                      await handleDeleteRule(ruleToDeleteId);
                      setRuleToDeleteId(null);
                    }
                  }}
                  className="px-3 py-1.5 bg-red-650 hover:bg-red-500 text-white font-bold rounded cursor-pointer"
                >
                  ELIMINAR REGLA 💀
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
