import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cpu, Plus, Trash2, ToggleLeft, ToggleRight, AlertTriangle, 
  HelpCircle, Play, Sparkles, Terminal, ArrowRight, Save, Info, RefreshCw,
  Globe, Smartphone, CheckCircle2, Download, Power, Server
} from 'lucide-react';
import { getSupabaseClient } from '../lib/supabase';
import { UserProfile } from '../types';

interface GameRule {
  id: string;
  rule_code: string;
  category: string;
  name: string;
  description: string;
  trigger_event: string;
  conditions_json: any;
  action_payload: any;
  is_active: boolean;
}

interface AppSystemConfig {
  id: number;
  min_required_version: string;
  current_latest_version: string;
  is_maintenance: boolean;
  maintenance_message: string;
  download_url_android: string;
  download_url_ios: string;
  download_url_windows: string;
}

interface ConditionEditorProps {
  users: UserProfile[];
  setIsAlertToShow: (alert: { show: boolean; status: 'success' | 'error'; message: string }) => void;
}

type TabState = 'rules_manager' | 'rules_builder' | 'simulation_sandbox' | 'ota_maintenance';

export default function ConditionEditor({ users, setIsAlertToShow }: ConditionEditorProps) {
  const supabase = getSupabaseClient();
  const [activeTab, setActiveTab] = useState<TabState>('rules_manager');

  // Estados Base de Datos Reales
  const [rules, setRules] = useState<GameRule[]>([]);
  const [loadingRules, setLoadingRules] = useState<boolean>(true);
  const [otaConfig, setOtaConfig] = useState<AppSystemConfig | null>(null);
  const [savingOta, setSavingOta] = useState<boolean>(false);

  // Historial de Versiones Local (Auditoría Visual)
  const [versionHistory, setVersionHistory] = useState<Array<{
    id: string; timestamp: string; action: 'create' | 'delete' | 'toggle'; ruleName: string; description: string;
  }>>([]);

  const [ruleToDeleteId, setRuleToDeleteId] = useState<string | null>(null);

  // Formulario del Creador de Reglas
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleDescription, setNewRuleDescription] = useState('');
  const [newRuleCategory, setNewRuleCategory] = useState('onboarding');
  const [newRuleTrigger, setNewRuleTrigger] = useState('ON_LOGIN');
  const [newConditions, setNewConditions] = useState<Array<{ field: string, operator: string, value: string | number }>>([
    { field: 'user.level', operator: 'greater_than', value: 1 }
  ]);
  const [newActionType, setNewActionType] = useState('add_gd_coins');
  const [newActionParams, setNewActionParams] = useState<any>({ amount: 500 });

  // Simulador Sandbox
  const [selectedSimUser, setSelectedSimUser] = useState<string>('');
  const [selectedSimRule, setSelectedSimRule] = useState<string>('');
  const [simLog, setSimLog] = useState<Array<{ type: 'info' | 'success' | 'warning' | 'error', text: string }>>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  // --- LECTURA DE BASE DE DATOS ---
  const fetchData = async () => {
    if (!supabase) return;
    setLoadingRules(true);
    
    // Cargar Reglas
    const { data: rData } = await supabase.from('game_rules').select('*').order('created_at', { ascending: false });
    if (rData) {
      setRules(rData);
      if (rData.length > 0) setSelectedSimRule(rData[0].id);
    }
    
    // Cargar OTA
    const { data: otaData } = await supabase.from('app_system_config').select('*').eq('id', 1).single();
    if (otaData) setOtaConfig(otaData);

    setLoadingRules(false);
  };

  useEffect(() => {
    fetchData();
    if (users.length > 0) setSelectedSimUser(users[0].id);
  }, [users]);

  // --- MÉTODOS DE REGLAS ---
  const handleToggleRule = async (rule: GameRule) => {
    if (!supabase) return;
    const { error } = await supabase.from('game_rules').update({ is_active: !rule.is_active }).eq('id', rule.id);
    
    if (!error) {
      setRules(rules.map(r => r.id === rule.id ? { ...r, is_active: !rule.is_active } : r));
      logHistory('toggle', rule.name, `Estatus alternado a ${!rule.is_active ? 'ACTIVADO' : 'DESACTIVADO'}`);
    } else {
      setIsAlertToShow({ show: true, status: 'error', message: error.message });
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!supabase) return;
    const ruleRef = rules.find(r => r.id === ruleId);
    const { error } = await supabase.from('game_rules').delete().eq('id', ruleId);

    if (!error) {
      setRules(rules.filter(r => r.id !== ruleId));
      logHistory('delete', ruleRef?.name || 'Regla Desconocida', 'Regla eliminada permanentemente del motor.');
      setIsAlertToShow({ show: true, status: 'success', message: 'Regla removida correctamente.' });
    } else {
      setIsAlertToShow({ show: true, status: 'error', message: error.message });
    }
  };

  const handleCreateRuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !newRuleName || !newRuleDescription) {
      setIsAlertToShow({ show: true, status: 'error', message: 'Llena los campos básicos.' });
      return;
    }

    const compiledRule = {
      rule_code: `RULE_${Date.now()}`,
      category: newRuleCategory,
      name: newRuleName,
      description: newRuleDescription,
      trigger_event: newRuleTrigger,
      conditions_json: newConditions,
      action_payload: { type: newActionType, params: newActionParams },
      is_active: true
    };

    const { data, error } = await supabase.from('game_rules').insert([compiledRule]).select().single();

    if (!error && data) {
      setRules([data, ...rules]);
      logHistory('create', data.name, 'Regla inyectada en vivo en la base de datos.');
      setIsAlertToShow({ show: true, status: 'success', message: '¡Nueva regla inyectada con éxito!' });
      
      // Reset form
      setNewRuleName('');
      setNewRuleDescription('');
      setActiveTab('rules_manager');
    } else {
      setIsAlertToShow({ show: true, status: 'error', message: error?.message || 'Error al guardar.' });
    }
  };

  // --- MÉTODOS OTA ---
  const handleOtaChange = (field: keyof AppSystemConfig, value: any) => {
    if (otaConfig) setOtaConfig({ ...otaConfig, [field]: value });
  };

  const saveOtaConfig = async () => {
    if (!supabase || !otaConfig) return;
    setSavingOta(true);
    const { error } = await supabase.from('app_system_config').update({
      min_required_version: otaConfig.min_required_version,
      current_latest_version: otaConfig.current_latest_version,
      is_maintenance: otaConfig.is_maintenance,
      maintenance_message: otaConfig.maintenance_message,
      download_url_android: otaConfig.download_url_android,
      download_url_ios: otaConfig.download_url_ios,
      download_url_windows: otaConfig.download_url_windows
    }).eq('id', 1);

    if (error) setIsAlertToShow({ show: true, status: 'error', message: error.message });
    else setIsAlertToShow({ show: true, status: 'success', message: '¡Configuración OTA Guardada!' });
    setSavingOta(false);
  };

  // --- UTILS ---
  const logHistory = (action: 'create' | 'delete' | 'toggle', ruleName: string, desc: string) => {
    setVersionHistory(prev => [
      { id: `log_${Date.now()}`, timestamp: new Date().toISOString(), action, ruleName, description: desc },
      ...prev
    ].slice(0, 8));
  };

  const handleUpdateConditionRow = (index: number, key: string, value: any) => {
    setNewConditions(prev => prev.map((item, i) => i === index ? { ...item, [key]: value } : item));
  };

  const handleRunSimulation = () => {
    const user = users.find(u => u.id === selectedSimUser);
    const rule = rules.find(r => r.id === selectedSimRule);

    if (!user || !rule) {
      setSimLog([{ type: 'error', text: 'Error: Faltan variables de usuario o regla.' }]);
      return;
    }

    setIsSimulating(true);
    setSimLog([]);

    const log: typeof simLog = [];
    log.push({ type: 'info', text: `INICIANDO EVALUACIÓN: [Regla: ${rule.name}] vs [Usuario: ${user.username}]` });
    log.push({ type: 'info', text: `Disparador requerido: ${rule.trigger_event}` });

    let allConditionsMet = true;
    const conditions = rule.conditions_json as Array<{ field: string, operator: string, value: any }>;

    if (!conditions || conditions.length === 0) {
      log.push({ type: 'warning', text: `La regla no tiene condiciones. Se ejecutará siempre en el evento.` });
    } else {
      conditions.forEach((cond, idx) => {
        let isMet = false;
        let attributeVal: any = (user as any)[cond.field.replace('user.', '')] || 0;
        const compVal = cond.value;

        if (cond.operator === 'greater_than') isMet = Number(attributeVal) > Number(compVal);
        else if (cond.operator === 'less_than') isMet = Number(attributeVal) < Number(compVal);
        else if (cond.operator === 'equals') isMet = String(attributeVal) === String(compVal);
        else if (cond.operator === 'not_equals') isMet = String(attributeVal) !== String(compVal);

        if (isMet) {
          log.push({ type: 'success', text: ` ✓ Condición [${idx + 1}]: ${cond.field} (${attributeVal}) ${cond.operator} (${compVal}) - APROBADO` });
        } else {
          log.push({ type: 'error', text: ` ✗ Condición [${idx + 1}]: ${cond.field} (${attributeVal}) ${cond.operator} (${compVal}) - RECHAZADO` });
          allConditionsMet = false;
        }
      });
    }

    if (allConditionsMet) {
      log.push({ type: 'success', text: `>>> COMPILACIÓN DE REGLA EXITOSA. Acción Simulada: [${rule.action_payload?.type}]` });
    } else {
      log.push({ type: 'warning', text: '>>> EVALUACIÓN RECHAZADA: No se cumplieron todos los prerrequisitos.' });
    }

    setTimeout(() => {
      setSimLog(log);
      setIsSimulating(false);
    }, 600);
  };

  return (
    <div className="h-full flex flex-col space-y-6 font-mono text-xs text-left select-none text-white">

      {/* HEADER Y NAVEGACIÓN */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-950 border border-zinc-900 rounded-xl p-5 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2 font-mono">
            <Cpu className="text-red-500 animate-pulse" size={20} /> Motor Lógico y Entorno
          </h2>
          <p className="text-xs text-zinc-400 font-sans mt-0.5">
            Control absoluto sobre mecánicas in-game y versiones de clientes. (Single Source of Truth)
          </p>
        </div>

        <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-1 text-[10px] sm:text-xs select-none font-mono">
          <button
            onClick={() => setActiveTab('rules_manager')}
            className={`py-2 px-3 rounded cursor-pointer tracking-wider uppercase flex items-center gap-1.5 ${activeTab === 'rules_manager' ? 'bg-red-950/80 text-red-400 font-bold border border-red-900/50' : 'text-zinc-500 hover:text-white'}`}
          >
            <Server size={14}/> Lógica
          </button>
          <button
            onClick={() => setActiveTab('rules_builder')}
            className={`py-2 px-3 rounded cursor-pointer tracking-wider uppercase flex items-center gap-1.5 ${activeTab === 'rules_builder' ? 'bg-red-950/80 text-red-400 font-bold border border-red-900/50' : 'text-zinc-500 hover:text-white'}`}
          >
            <Plus size={14}/> Creador
          </button>
          <button
            onClick={() => setActiveTab('simulation_sandbox')}
            className={`py-2 px-3 rounded cursor-pointer tracking-wider uppercase flex items-center gap-1.5 ${activeTab === 'simulation_sandbox' ? 'bg-red-950/80 text-red-400 font-bold border border-red-900/50' : 'text-zinc-500 hover:text-white'}`}
          >
            <Terminal size={14}/> Sandbox
          </button>
          <div className="w-[1px] bg-zinc-800 mx-1"></div>
          <button
            onClick={() => setActiveTab('ota_maintenance')}
            className={`py-2 px-3 rounded cursor-pointer tracking-wider uppercase flex items-center gap-1.5 ${activeTab === 'ota_maintenance' ? 'bg-cyan-950/80 text-cyan-400 font-bold border border-cyan-900/50' : 'text-zinc-500 hover:text-white'}`}
          >
            <Globe size={14}/> Control OTA
          </button>
        </div>
      </div>

      <div className="flex-1 font-sans">
        
        {/* VIEW 1: RULES LIST MANAGER */}
        {activeTab === 'rules_manager' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
            
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden p-5 space-y-4">
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-500 font-mono flex justify-between items-center">
                  <span>REGLAS EN BASE DE DATOS ({rules.length})</span>
                  {loadingRules && <RefreshCw size={12} className="animate-spin text-red-500"/>}
                </span>

                <div className="space-y-4 pt-2">
                  {rules.length === 0 && !loadingRules ? (
                    <div className="text-center py-10 border border-dashed border-zinc-800 rounded-xl text-zinc-500 font-mono text-xs">
                      No hay condiciones en la DB. Crea una en el "Creador de Reglas".
                    </div>
                  ) : (
                    rules.map((rule) => (
                      <div key={rule.id} className={`group p-5 transition-all rounded-xl relative flex flex-col md:flex-row gap-6 md:items-center justify-between border ${rule.is_active ? 'bg-zinc-900/40 border-zinc-800' : 'bg-black opacity-60 border-zinc-900'}`}>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] font-mono font-bold text-red-400">
                              {rule.trigger_event}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-zinc-900 text-[9px] font-mono text-zinc-500 uppercase">
                              {rule.category}
                            </span>
                            <h3 className={`text-sm font-bold tracking-wide ${rule.is_active ? 'text-white' : 'text-zinc-500'}`}>
                              {rule.name}
                            </h3>
                          </div>
                          <p className="text-xs text-zinc-400 leading-normal font-sans">
                            {rule.description}
                          </p>
                          <div className="pt-2 flex items-center gap-2">
                            <ArrowRight size={13} className="text-zinc-600" />
                            <span className="text-[10px] text-zinc-500 font-mono">EJECUTA:</span>
                            <span className="px-2 py-1 rounded bg-red-650/10 border border-red-500/20 text-[10px] font-mono text-red-400 font-semibold">
                              {rule.action_payload?.type}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 border-t md:border-t-0 border-zinc-850 pt-4 md:pt-0">
                          <button
                            type="button"
                            onClick={() => handleToggleRule(rule)}
                            className="flex items-center gap-2 text-xs font-bold font-mono tracking-wider text-zinc-400 hover:text-white transition-colors cursor-pointer"
                          >
                            {rule.is_active ? (
                              <div className="flex items-center gap-1.5 text-red-500"><ToggleRight size={24} /> ACTIVA</div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-zinc-600"><ToggleLeft size={24} /> INACTIVA</div>
                            )}
                          </button>
                          <button
                            onClick={() => setRuleToDeleteId(rule.id)}
                            className="p-2 rounded bg-zinc-950 hover:bg-zinc-800 border border-zinc-850 hover:border-red-500/30 text-zinc-500 hover:text-red-500 transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-1 space-y-6">
              <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4">
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-500 font-mono flex items-center gap-1.5">
                  <Terminal size={13} className="text-red-500 shrink-0" /> Auditoría de Cambios
                </span>
                <p className="text-[11px] text-zinc-500 leading-normal font-sans">
                  Registro local de las últimas modificaciones a las reglas.
                </p>
                <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1 font-mono">
                  {versionHistory.length === 0 ? <span className="text-[10px] text-zinc-600">No hay cambios en esta sesión.</span> : null}
                  {versionHistory.map((ver) => (
                    <div key={ver.id} className="p-3 bg-zinc-900/40 border border-zinc-850 rounded-lg text-[10px] space-y-1">
                      <div className="flex justify-between items-center text-zinc-400">
                        <strong className={ver.action === 'create' ? 'text-emerald-400' : ver.action === 'delete' ? 'text-red-400' : 'text-amber-400'}>{ver.action.toUpperCase()}</strong>
                        <span className="text-[8px]">{new Date(ver.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <h4 className="text-zinc-200">{ver.ruleName}</h4>
                      <p className="text-zinc-500 text-[9px]">{ver.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: RULE BUILDER FORM */}
        {activeTab === 'rules_builder' && (
          <form onSubmit={handleCreateRuleSubmit} className="bg-zinc-950 border border-zinc-900 rounded-xl p-6 space-y-6 animate-fadeIn font-mono">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono">Constructor de Reglas SQL</h3>
              <p className="text-xs text-zinc-500 mt-1 font-sans">Se inyectará directamente en `public.game_rules`.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Nombre de la Regla</label>
                  <input type="text" required value={newRuleName} onChange={(e) => setNewRuleName(e.target.value)} className="w-full px-3.5 py-2.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-red-500" placeholder="Ej. Bono de Nivel 10"/>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Descripción</label>
                  <textarea required rows={3} value={newRuleDescription} onChange={(e) => setNewRuleDescription(e.target.value)} className="w-full px-3.5 py-2.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-red-500 resize-none font-sans" placeholder="Explica la regla..."/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Categoría</label>
                    <select value={newRuleCategory} onChange={(e) => setNewRuleCategory(e.target.value)} className="w-full px-3 py-2 text-xs bg-zinc-900 border border-zinc-800 rounded text-white outline-none cursor-pointer">
                      <option value="onboarding">Onboarding</option>
                      <option value="economy">Economy</option>
                      <option value="expeditions">Expeditions</option>
                      <option value="combat">Combat</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Trigger Event</label>
                    <input type="text" required value={newRuleTrigger} onChange={(e) => setNewRuleTrigger(e.target.value)} className="w-full px-3 py-2 text-xs bg-zinc-900 border border-zinc-800 rounded text-white outline-none uppercase" placeholder="ON_LOGIN"/>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Condiciones (JSON Array)</label>
                    <button type="button" onClick={() => setNewConditions([...newConditions, { field: 'user.metal', operator: 'greater_than', value: 0 }])} className="text-[10px] py-1 px-2 rounded border border-zinc-800 hover:bg-zinc-800 text-red-500 font-bold flex items-center gap-1 cursor-pointer"><Plus size={10}/> Añadir</button>
                  </div>
                  <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                    {newConditions.map((cond, idx) => (
                      <div key={idx} className="flex gap-2 items-center bg-zinc-900/60 p-2 rounded">
                        <input type="text" value={cond.field} onChange={e => handleUpdateConditionRow(idx, 'field', e.target.value)} className="flex-1 bg-black border border-zinc-800 text-xs px-2 py-1 rounded text-white" placeholder="user.level"/>
                        <select value={cond.operator} onChange={e => handleUpdateConditionRow(idx, 'operator', e.target.value)} className="w-24 bg-black border border-zinc-800 text-xs px-1 py-1 rounded text-white cursor-pointer">
                          <option value="greater_than">&gt;</option><option value="less_than">&lt;</option><option value="equals">==</option><option value="not_equals">!=</option>
                        </select>
                        <input type="text" value={cond.value} onChange={e => handleUpdateConditionRow(idx, 'value', e.target.value)} className="w-16 bg-black border border-zinc-800 text-xs px-2 py-1 rounded text-white text-center"/>
                        <button type="button" onClick={() => setNewConditions(newConditions.filter((_, i) => i !== idx))} className="text-zinc-600 hover:text-red-500 cursor-pointer"><Trash2 size={12}/></button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-zinc-900/20 border border-zinc-900 rounded-xl space-y-3">
                  <span className="text-xs font-bold text-red-500 uppercase flex items-center gap-1.5"><Sparkles size={12} /> Acción Resultante (Payload)</span>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-[10px] text-zinc-500 uppercase">Type</label>
                      <input type="text" required value={newActionType} onChange={(e) => setNewActionType(e.target.value)} className="w-full px-2 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded text-white mt-1"/>
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-zinc-500 uppercase">Params (JSON)</label>
                      <input type="text" required value={JSON.stringify(newActionParams)} onChange={(e) => { try { setNewActionParams(JSON.parse(e.target.value))} catch(err){} }} className="w-full px-2 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded text-white mt-1"/>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-900">
              <button type="submit" className="py-2.5 px-6 bg-red-650 hover:bg-red-500 text-white text-xs font-bold uppercase rounded-lg shadow-lg cursor-pointer flex items-center gap-1.5"><Save size={13} /> Insertar en BD</button>
            </div>
          </form>
        )}

        {/* VIEW 3: SIMULATION SANDBOX */}
        {activeTab === 'simulation_sandbox' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn font-mono">
            <div className="lg:col-span-5 bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-5 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">PARÁMETROS DEL SIMULADOR</span>
                <p className="text-xs text-zinc-500 mt-1 font-sans">Audita reglas contra perfiles reales extraídos de la base de datos.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-400 uppercase">1. Jugador Evaluado</label>
                  <select value={selectedSimUser} onChange={(e) => setSelectedSimUser(e.target.value)} className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded text-white text-xs cursor-pointer outline-none">
                    {users.map(u => <option key={u.id} value={u.id}>{u.username} (Lvl {u.level})</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-400 uppercase">2. Regla a auditar</label>
                  <select value={selectedSimRule} onChange={(e) => setSelectedSimRule(e.target.value)} className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded text-white text-xs cursor-pointer outline-none">
                    {rules.map(r => <option key={r.id} value={r.id}>{r.name} ({r.trigger_event})</option>)}
                  </select>
                </div>
              </div>

              <button onClick={handleRunSimulation} disabled={isSimulating} className="w-full py-3 bg-red-650 hover:bg-red-500 text-white text-xs font-bold uppercase rounded-lg shadow-lg flex justify-center gap-2 cursor-pointer disabled:opacity-50">
                {isSimulating ? <RefreshCw className="animate-spin" size={14} /> : <Play size={14} />} Compilar y Simular
              </button>
            </div>

            <div className="lg:col-span-7 bg-black border border-zinc-900 rounded-xl p-5 flex flex-col space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400 flex items-center gap-2"><Terminal size={14} className="text-red-500" /> compilador-sasori@console:~$</span>
                <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
              </div>
              <div className="flex-1 min-h-[280px] bg-zinc-950 p-4 rounded-lg text-xs overflow-y-auto space-y-2 border border-zinc-900 leading-normal">
                {simLog.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-600 pt-16">
                    <Terminal size={24} className="mb-2" /> <p>Listo para auditar.</p>
                  </div>
                ) : (
                  simLog.map((log, li) => (
                    <div key={li} className={`${log.type === 'success' ? 'text-emerald-400' : log.type === 'warning' ? 'text-amber-500' : log.type === 'error' ? 'text-red-500' : 'text-zinc-400'}`}>
                      {log.text}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: OTA & MAINTENANCE */}
        {activeTab === 'ota_maintenance' && otaConfig && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
            <div className="space-y-4">
              <div className={`p-5 rounded-xl border ${otaConfig.is_maintenance ? 'bg-red-950/20 border-red-900/50' : 'bg-zinc-950 border-zinc-800'}`}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2"><Power size={16} className={otaConfig.is_maintenance ? "text-red-500" : "text-zinc-500"}/> Estado Lúdico Global</h3>
                  <button onClick={() => handleOtaChange('is_maintenance', !otaConfig.is_maintenance)} className={`px-4 py-1.5 rounded font-black uppercase text-[10px] border cursor-pointer transition-all ${otaConfig.is_maintenance ? 'bg-red-600 text-white border-red-500 animate-pulse' : 'bg-zinc-900 text-zinc-400 border-zinc-700'}`}>
                    {otaConfig.is_maintenance ? 'MANTENIMIENTO ACTIVO' : 'JUEGO ONLINE (LIVE)'}
                  </button>
                </div>
                <p className="text-zinc-400 text-[10px] font-sans mb-4">Al activar el mantenimiento, todas las aplicaciones de los usuarios cerrarán sus sesiones activas.</p>
                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-500 uppercase font-bold">Mensaje en Pantalla para el Jugador:</label>
                  <textarea className="w-full bg-black border border-zinc-800 rounded p-3 text-white text-[11px] outline-none min-h-[100px]" value={otaConfig.maintenance_message} onChange={e => handleOtaChange('maintenance_message', e.target.value)} />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-5 rounded-xl bg-zinc-950 border border-zinc-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4"><Smartphone size={16} className="text-cyan-500"/> Lanzamiento y Parches Obligatorios</h3>
                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-500 uppercase font-bold flex items-center gap-1"><AlertTriangle size={10} className="text-amber-500"/> Mínima Requerida</label>
                    <input type="text" className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white outline-none font-bold" value={otaConfig.min_required_version} onChange={e => handleOtaChange('min_required_version', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-500 uppercase font-bold flex items-center gap-1"><CheckCircle2 size={10} className="text-emerald-500"/> Versión Actual (Latest)</label>
                    <input type="text" className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white outline-none font-bold" value={otaConfig.current_latest_version} onChange={e => handleOtaChange('current_latest_version', e.target.value)} />
                  </div>
                </div>
                <div className="space-y-3 pt-4 border-t border-zinc-800">
                  <h4 className="text-[10px] font-black text-zinc-500 uppercase flex items-center gap-1"><Download size={12}/> Redirecciones de Descarga (Stores)</h4>
                  <div className="space-y-2">
                    <div className="flex bg-black border border-zinc-800 rounded"><span className="bg-zinc-900 px-2 py-1.5 text-zinc-400 w-20 text-center text-[10px]">Android</span><input type="text" className="flex-1 bg-transparent px-2 text-white outline-none text-[10px]" value={otaConfig.download_url_android} onChange={e => handleOtaChange('download_url_android', e.target.value)}/></div>
                    <div className="flex bg-black border border-zinc-800 rounded"><span className="bg-zinc-900 px-2 py-1.5 text-zinc-400 w-20 text-center text-[10px]">Apple</span><input type="text" className="flex-1 bg-transparent px-2 text-white outline-none text-[10px]" value={otaConfig.download_url_ios} onChange={e => handleOtaChange('download_url_ios', e.target.value)}/></div>
                    <div className="flex bg-black border border-zinc-800 rounded"><span className="bg-zinc-900 px-2 py-1.5 text-zinc-400 w-20 text-center text-[10px]">Windows</span><input type="text" className="flex-1 bg-transparent px-2 text-white outline-none text-[10px]" value={otaConfig.download_url_windows} onChange={e => handleOtaChange('download_url_windows', e.target.value)}/></div>
                  </div>
                </div>
              </div>
              <button onClick={saveOtaConfig} disabled={savingOta} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black uppercase py-3 rounded-lg flex justify-center items-center gap-2 cursor-pointer shadow-lg shadow-cyan-900/50">
                {savingOta ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />} Implantar Directrices en Servidor
              </button>
            </div>
          </div>
        )}

      </div>

      <AnimatePresence>
        {ruleToDeleteId && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-zinc-950 border border-zinc-800 p-6 rounded-xl max-w-sm w-full space-y-4">
              <div className="flex items-center gap-2.5 text-red-500 font-bold uppercase"><AlertTriangle size={18} className="animate-bounce" /> <span>CONFIRMAR REMOCIÓN DE REGLA</span></div>
              <p className="text-xs text-zinc-400">¿Deseas eliminar permanentemente esta regla de la base de datos?</p>
              <div className="flex justify-end gap-2.5">
                <button onClick={() => setRuleToDeleteId(null)} className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 rounded-lg font-bold cursor-pointer">CONSERVAR</button>
                <button onClick={() => { if(ruleToDeleteId) { handleDeleteRule(ruleToDeleteId); setRuleToDeleteId(null); } }} className="px-3 py-1.5 bg-red-650 hover:bg-red-500 text-white font-bold rounded-lg cursor-pointer">ELIMINAR 💀</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}