import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Rocket, ShieldAlert, RefreshCw, Map, Pickaxe, Crosshair, Wrench, Bot, AlertTriangle, Clock, Users, FileText, Globe, Target, Activity, Lock, Search, Zap, Terminal, Gift } from 'lucide-react';

interface StarNode {
  id: string;
  name: string;
}

interface Expedition {
  id: string;
  target_node_id: string;
  expedition_type: string;
  duration_hours: number;
  status: string;
  arrives_at: string;
  fleet_payload?: any[];
  star_nodes?: {
    name: string;
  };
}

type SubTab = 'exploration_mining' | 'domination' | 'expedition_events' | 'galaxy_generator';

export const ExpeditionsManager: React.FC = () => {
  const [expeditions, setExpeditions] = useState<Expedition[]>([]);
  const [starNodes, setStarNodes] = useState<StarNode[]>([]);
  
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('exploration_mining');
  const [nodeId, setNodeId] = useState<string>('');
  const [expeditionType, setExpeditionType] = useState<'exploration' | 'mining' | 'domination'>('exploration');
  const [duration, setDuration] = useState<number>(4);
  const [loading, setLoading] = useState<boolean>(true);
  const [launching, setLaunching] = useState<boolean>(false);
  const [utcTime, setUtcTime] = useState<string>('');
  const [activePlayers, setActivePlayers] = useState<number>(0);

  // MODO DIOS STATES (Minería)
  const [globalExtractionRate, setGlobalExtractionRate] = useState<number>(42105.84);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dropRate, setDropRate] = useState<number>(1.0);
  const [techBypass, setTechBypass] = useState<boolean>(false);

  // MODO DIOS STATES (Dominación)
  const [lootPercentage, setLootPercentage] = useState<number>(25);
  const [boostDuration, setBoostDuration] = useState<number>(100);
  const [qmpBypass, setQmpBypass] = useState<boolean>(false);

  // MODO DIOS STATES (Eventos e Inyección)
  const [eventsSearchQuery, setEventsSearchQuery] = useState<string>('');
  const [eventsTab, setEventsTab] = useState<'economy' | 'combat'>('combat');
  const [claimTargetUuid, setClaimTargetUuid] = useState<string>('');
  const [claimItemType, setClaimItemType] = useState<string>('Metal');
  const [claimAmount, setClaimAmount] = useState<number>(1000);
  const [liveStreamLogs, setLiveStreamLogs] = useState<string[]>([
    "[11:32:01 UTC] SYSTEM_INIT: Conexión segura establecida con la red de balizas."
  ]);
  const streamEndRef = useRef<HTMLDivElement>(null);

  // Mocks interactivos para la sección de slots
  const fleetPayload = [{ shipId: "mock-ship-1", name: "Explorer Frigate (Común)", qty: 1 }];
  const equippedAstrobots = [{ id: "astro-1", role: "Support" }];
  const equippedTools = [{ id: "exp_qmp_platform", name: "QMP Platform Nv.1" }, { id: "tool-1", name: "Laser Minero Nv.1" }];

  useEffect(() => {
    fetchStarNodes();
    fetchExpeditions();
    fetchActivePlayers();

    const timer = setInterval(() => {
      const now = new Date();
      setUtcTime(now.toLocaleTimeString('en-US', {
        timeZone: 'UTC',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }) + ' UTC');
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Simulación del flujo de extracción global
  useEffect(() => {
    if (activeSubTab !== 'exploration_mining') return;
    const interval = setInterval(() => {
      setGlobalExtractionRate(prev => prev + (Math.random() * 5));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeSubTab]);

  // Simulación de Live Incident Stream
  useEffect(() => {
    if (activeSubTab !== 'expedition_events') return;
    const interval = setInterval(() => {
      const msgs = [
        "Comandante AF-99 atravesó tormenta de plasma - HP -4%",
        "Extracción completada en Sector Orion Alpha. +4500 Metal.",
        "Alerta de proximidad pirata en Próxima B. Motores al 120%.",
        "Astrobot Q-77 reparando fallos térmicos en Acorazado principal.",
        "Firma cuántica detectada (Posible Lif Marauder en vector 7.7)."
      ];
      const randomMsg = msgs[Math.floor(Math.random() * msgs.length)];
      const now = new Date();
      const timeStr = now.toISOString().split('T')[1].substring(0, 8);
      
      setLiveStreamLogs(prev => {
        const newLogs = [...prev, `[${timeStr} UTC] ${randomMsg}`];
        if (newLogs.length > 50) return newLogs.slice(newLogs.length - 50);
        return newLogs;
      });
    }, 3500);
    return () => clearInterval(interval);
  }, [activeSubTab]);

  useEffect(() => {
    if (streamEndRef.current) {
      streamEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [liveStreamLogs]);

  // Efecto secundario: cuando cambiamos de pestaña, forzamos el tipo de expedición correcto
  useEffect(() => {
    if (activeSubTab === 'domination') {
      setExpeditionType('domination');
    } else if (activeSubTab === 'exploration_mining' && expeditionType === 'domination') {
      setExpeditionType('exploration');
    }
  }, [activeSubTab]);

  const fetchActivePlayers = async () => {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60000).toISOString();
      const { count, error } = await supabase
        .from('player_heartbeats')
        .select('*', { count: 'exact', head: true })
        .gt('last_ping', fiveMinutesAgo);

      if (error) throw error;
      setActivePlayers(count || 0);
    } catch (e: any) {
      console.error("Error al contar comandantes activos:", e.message);
    }
  };

  const fetchStarNodes = async () => {
    try {
      const { data, error } = await supabase
        .from('star_nodes')
        .select('id, name')
        .not('discovered_by', 'is', null);

      if (error) throw error;
      if (data) {
        setStarNodes(data);
        if (data.length > 0 && !nodeId) setNodeId(data[0].id);
      }
    } catch (e: any) {
      console.error("Error al cargar destinos descubiertos:", e.message);
    }
  };

  const fetchExpeditions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('expeditions')
        .select(`
          id,
          target_node_id,
          expedition_type,
          duration_hours,
          status,
          arrives_at,
          fleet_payload,
          star_nodes (
            name
          )
        `)
        .order('arrives_at', { ascending: false });

      if (error) throw error;
      if (data) setExpeditions(data as unknown as Expedition[]);
    } catch (e: any) {
      console.error("Error al leer radares de flotas:", e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLaunchFleet = async () => {
    if (!nodeId) {
      alert("Debes seleccionar un destino.");
      return;
    }
    
    try {
      setLaunching(true);
      
      const payload = {
        nodeId,
        expeditionType,
        durationHours: Number(duration),
        fleetPayload,
        equippedAstrobots,
        equippedTools: expeditionType === 'exploration' ? [] : equippedTools
      };

      const { data, error } = await supabase.functions.invoke('launch-expedition', {
        body: payload
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      alert("¡Flota despachada con éxito al espacio profundo!");
      fetchExpeditions(); 
    } catch (e: any) {
      alert(`Fallo en el despegue: ${e.message}`);
    } finally {
      setLaunching(false);
    }
  };

  const renderStatus = (status: string) => {
    switch (status) {
      case 'traveling': return <span className="px-2 py-0.5 rounded text-[10px] font-black tracking-wider bg-amber-500/10 text-amber-400">EN VUELO</span>;
      case 'active': return <span className="px-2 py-0.5 rounded text-[10px] font-black tracking-wider bg-emerald-500/10 text-emerald-400">ACTIVA</span>;
      case 'combat': return <span className="px-2 py-0.5 rounded text-[10px] font-black tracking-wider bg-red-500/10 text-red-400">EN COMBATE</span>;
      case 'returning': return <span className="px-2 py-0.5 rounded text-[10px] font-black tracking-wider bg-cyan-500/10 text-cyan-400">RETORNANDO</span>;
      case 'finished': return <span className="px-2 py-0.5 rounded text-[10px] font-black tracking-wider bg-slate-500/10 text-slate-400">FINALIZADA</span>;
      default: return <span className="px-2 py-0.5 rounded text-[10px] font-black tracking-wider bg-slate-500/10 text-slate-400">{status.toUpperCase()}</span>;
    }
  };

  const getMissionIcon = (type: string) => {
    switch (type) {
      case 'exploration': return <Map className="w-4 h-4 text-cyan-400" />;
      case 'mining': return <Pickaxe className="w-4 h-4 text-emerald-400" />;
      case 'domination': return <Crosshair className="w-4 h-4 text-red-400" />;
      default: return <Rocket className="w-4 h-4 text-slate-400" />;
    }
  };

  // =====================================================================
  // VISTAS PARCIALES
  // =====================================================================

  const renderExplorationMiningDashboard = () => {
    return (
      <div className="col-span-1 lg:col-span-3 space-y-6">
        
        {/* SECCIÓN A: GADGETS DE TELEMETRÍA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 shadow-lg flex items-center justify-between">
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Flujo de Extracción Global</div>
              <div className="text-xl font-mono text-emerald-400 font-bold">{globalExtractionRate.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} <span className="text-xs text-slate-500 font-sans">kg/h</span></div>
            </div>
            <div className="flex flex-col items-end">
              <Activity className="w-5 h-5 text-emerald-500 mb-1 animate-pulse" />
              <span className="text-[9px] text-emerald-500/70 uppercase font-bold">⚡ Rendimiento Óptimo</span>
            </div>
          </div>
          
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 shadow-lg flex items-center justify-between">
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Bloqueo Tecnológico Activo</div>
              <div className="text-xl font-mono text-red-400 font-bold">18 <span className="text-xs text-slate-500 font-sans">Cuentas Selladas</span></div>
            </div>
            <div className="flex flex-col items-end">
              <Lock className="w-5 h-5 text-red-500 mb-1" />
              <span className="text-[9px] text-red-500/70 uppercase font-bold">Investigación Congelada</span>
            </div>
          </div>
        </div>

        {/* SECCIÓN B y C */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* SECCIÓN B: CABINA CIVIL (col-span-2) */}
          <div className="lg:col-span-2 bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-4 shadow-lg shadow-black/40">
            <h3 className="text-xs font-bold text-cyan-500 uppercase tracking-widest flex items-center gap-2 border-b border-slate-900 pb-2">
              <Rocket className="w-4 h-4" /> Cabina de Exploración y Minería
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Protocolo y Destino */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] text-slate-500 uppercase font-bold mb-2">Protocolo de Misión</label>
                  <div className="flex bg-slate-900 p-1 rounded-md border border-slate-800">
                    <button 
                      onClick={() => setExpeditionType('exploration')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded flex items-center justify-center gap-1.5 transition-all ${expeditionType === 'exploration' ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>
                      <Map className="w-3 h-3" /> Exploración
                    </button>
                    <button 
                      onClick={() => setExpeditionType('mining')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded flex items-center justify-center gap-1.5 transition-all ${expeditionType === 'mining' ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>
                      <Pickaxe className="w-3 h-3" /> Minería
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="destination_civ" className="block text-[11px] text-slate-500 uppercase font-bold mb-1">Destino Galáctico (Descubierto)</label>
                  <select 
                    id="destination_civ" 
                    value={nodeId} 
                    onChange={e => setNodeId(e.target.value)} 
                    className="w-full bg-slate-900 border border-slate-800 p-2 rounded text-xs focus:ring-1 focus:ring-cyan-500 outline-none text-slate-200"
                    disabled={starNodes.length === 0}
                  >
                    {starNodes.length === 0 ? (
                      <option value="">Buscando destinos seguros...</option>
                    ) : (
                      starNodes.map(star => (
                        <option key={star.id} value={star.id}>{star.name}</option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* Duración y Filtro */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="duration_adv" className="block text-[11px] text-slate-500 uppercase font-bold mb-1">Duración Variable Avanzada</label>
                  <select 
                    id="duration_adv" 
                    value={duration} 
                    onChange={e => setDuration(Number(e.target.value))} 
                    className="w-full bg-slate-900 border border-slate-800 p-2 rounded text-xs focus:ring-1 focus:ring-cyan-500 outline-none text-slate-200"
                  >
                    <option value={0.016}>1 Minuto (Test Rápido)</option>
                    <option value={0.166}>10 Minutos</option>
                    <option value={1}>1 Hora</option>
                    <option value={4}>4 Horas</option>
                    <option value={12}>12 Horas</option>
                    <option value={24}>24 Horas</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="searchFleet" className="block text-[11px] text-slate-500 uppercase font-bold mb-1">Buscador / Inspector de Flotas</label>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-500" />
                    <input 
                      type="text"
                      id="searchFleet"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="ID Comandante o Recurso..."
                      className="w-full bg-slate-900 border border-slate-800 p-2 pl-9 rounded text-xs focus:ring-1 focus:ring-cyan-500 outline-none text-slate-200 placeholder-slate-600"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SLOTS DE EQUIPAMIENTO */}
            <div className="pt-3 border-t border-slate-800/50 space-y-3">
              <label className="block text-[11px] text-slate-500 uppercase font-bold">Asignación de Activos</label>
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2 bg-slate-900/50 border border-slate-800 border-dashed rounded p-2 flex items-center gap-3 hover:bg-slate-800/30 transition-colors">
                  <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center">
                    <Rocket className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Nave Comprometida</div>
                    <div className="text-xs text-slate-300 font-medium">1x Explorer Frigate</div>
                  </div>
                  <button className="text-[10px] text-cyan-500 hover:text-cyan-400 px-2 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 rounded transition-colors font-bold tracking-wide">EDITAR</button>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded p-2 flex items-center gap-2 hover:bg-slate-800/30 transition-colors">
                  <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center shrink-0">
                    <Bot className="w-3 h-3 text-purple-400" />
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-[9px] text-slate-500 font-bold uppercase">Astrobot de Soporte</div>
                    <div className="text-[10px] text-slate-300 truncate font-medium">Astro-1</div>
                  </div>
                </div>

                {expeditionType !== 'exploration' ? (
                  <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded p-2 flex items-center gap-2 hover:bg-slate-800/30 transition-colors">
                    <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center shrink-0">
                      <Wrench className="w-3 h-3 text-amber-400" />
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-[9px] text-slate-500 font-bold uppercase">Herramienta Minería</div>
                      <div className="text-[10px] text-slate-300 truncate font-medium">Láser Minero Nv.1</div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-900/30 border border-slate-800/50 border-dashed rounded p-2 flex items-center justify-center opacity-50">
                    <div className="text-[10px] text-slate-600 font-bold uppercase">No requerido</div>
                  </div>
                )}
              </div>
            </div>

            <button 
              onClick={handleLaunchFleet} 
              disabled={launching || !nodeId}
              className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed py-2.5 rounded text-xs font-bold uppercase tracking-wider transition-all mt-4 shadow-lg shadow-cyan-900/20 hover:shadow-cyan-900/40"
            >
              {launching ? 'INICIANDO PROTOCOLO...' : 'FORZAR DESPEGUE CIVIL'}
            </button>
          </div>

          {/* SECCIÓN C: CONSOLA MODO DIOS (col-span-1) */}
          <div className="bg-red-950/10 p-4 rounded-lg border border-red-900/30 space-y-6 h-fit shadow-lg shadow-black/40">
            <div className="flex items-center gap-2 border-b border-red-900/30 pb-2">
              <Zap className="w-4 h-4 text-red-500" />
              <h3 className="text-xs font-bold text-red-500 uppercase tracking-widest">Consola Modo Dios</h3>
            </div>

            <div className="space-y-5">
              {/* Insta-Recall */}
              <div>
                <p className="text-[10px] text-slate-400 mb-2 leading-relaxed">Intervención de emergencia. Retorna todas las flotas civiles al instante sin perder carga útil.</p>
                <button onClick={() => alert('¡SIMULACIÓN: Flotas forzadas a retornar al C.A.N!')} className="w-full bg-red-600 hover:bg-red-500 py-2.5 rounded text-[10px] font-black uppercase tracking-wider text-white transition-colors flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(220,38,38,0.2)] hover:shadow-[0_0_20px_rgba(220,38,38,0.4)]">
                  <AlertTriangle className="w-3 h-3" /> Forzar Insta-Recall Global
                </button>
              </div>

              {/* Tasa Drop */}
              <div className="bg-slate-900/50 p-3 rounded border border-slate-800/50">
                <label className="block text-[10px] text-slate-300 uppercase font-bold mb-2">Manipulador Tasa de Drop</label>
                <div className="flex gap-2">
                  <input type="number" step="0.01" min="0" max="5.0" value={dropRate} onChange={e => setDropRate(parseFloat(e.target.value))} className="w-20 bg-slate-950 border border-slate-800 p-1.5 rounded text-xs font-mono text-cyan-400 text-center outline-none focus:border-cyan-500" />
                  <button onClick={() => alert(`Tasa de drop configurada a ${dropRate}x`)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-[10px] font-bold uppercase rounded transition-colors border border-slate-700 text-slate-300">Configurar</button>
                </div>
              </div>

              {/* Bypass Toggle */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-slate-300 uppercase font-bold">Bypass Seguridad Tech</span>
                  <div 
                    onClick={() => setTechBypass(!techBypass)}
                    className={`w-10 h-5 flex items-center rounded-full p-1 cursor-pointer transition-colors ${techBypass ? 'bg-red-500' : 'bg-slate-700'}`}
                  >
                    <div className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${techBypass ? 'translate-x-5' : ''}`} />
                  </div>
                </div>
                {techBypass && (
                  <div className="text-[9px] bg-amber-500/10 border border-amber-500/20 text-amber-500 p-2 rounded flex items-start gap-1.5 animate-pulse mt-2">
                    <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                    <p><strong>ATENCIÓN:</strong> Desactivando validación perimetral. Cuentas selladas podrán reemplazar tecnologías libremente.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
        </div>
      </div>
    );
  };

  const renderDominationDashboard = () => {
    return (
      <div className="col-span-1 lg:col-span-3 space-y-6">
        
        {/* SECCIÓN A: TELEMETRÍA MILITAR */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 shadow-lg flex flex-col justify-center">
            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Mapa de Calor de Hostilidades</div>
            <div className="text-sm text-amber-500 font-bold animate-pulse flex items-center gap-2 mt-1">
              <AlertTriangle className="w-5 h-5 shrink-0" /> 
              <span>⚠️ ALERTA: 3 Sistemas en disputa simultánea (Frenesí Bélico)</span>
            </div>
          </div>
          
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 shadow-lg flex flex-col justify-center">
            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-2">Métrica de Dominio Absoluto</div>
            <div className="flex w-full h-3 rounded-full overflow-hidden bg-slate-900 border border-slate-800">
              <div className="bg-emerald-500 h-full" style={{ width: '45%' }}></div>
              <div className="bg-red-500 h-full" style={{ width: '35%' }}></div>
              <div className="bg-slate-600 h-full" style={{ width: '20%' }}></div>
            </div>
            <div className="flex justify-between text-[9px] font-bold mt-2 uppercase tracking-wide">
              <span className="text-emerald-500">Comandantes: 45%</span>
              <span className="text-red-500">LIF Marauders: 35%</span>
              <span className="text-slate-500">Neutros: 20%</span>
            </div>
          </div>
        </div>

        {/* SECCIÓN B y C */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* SECCIÓN B: CABINA MILITAR (col-span-2) */}
          <div className="lg:col-span-2 bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-4 shadow-lg shadow-black/40">
            <h3 className="text-xs font-bold text-red-500 uppercase tracking-widest flex items-center gap-2 border-b border-slate-900 pb-2">
              <ShieldAlert className="w-4 h-4" /> Cabina de Aseguramiento Militar e Inspector
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Selector y Poder */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="destination_mil" className="block text-[11px] text-slate-500 uppercase font-bold mb-1">Destino Galáctico (Descubierto)</label>
                  <select 
                    id="destination_mil" 
                    value={nodeId} 
                    onChange={e => setNodeId(e.target.value)} 
                    className="w-full bg-slate-900 border border-slate-800 p-2 rounded text-xs focus:ring-1 focus:ring-red-500 outline-none text-slate-200"
                    disabled={starNodes.length === 0}
                  >
                    {starNodes.length === 0 ? (
                      <option value="">Buscando destinos seguros...</option>
                    ) : (
                      starNodes.map(star => (
                        <option key={star.id} value={star.id}>{star.name}</option>
                      ))
                    )}
                  </select>
                </div>

                <div className="bg-red-950/40 border border-red-900/50 rounded p-3 text-center">
                  <div className="text-[10px] text-red-400 uppercase font-bold tracking-wider mb-1">Poder Estimado de Flota</div>
                  <div className="text-lg font-black text-red-500">1250 <span className="text-xs text-red-400/70">ATK</span> / <span className="text-slate-500">???</span> <span className="text-xs text-slate-500/70">DEF</span></div>
                </div>
              </div>

              {/* Visor de Producción Espejo e Inspector QMP */}
              <div className="space-y-4">
                <div className="bg-slate-900/50 border border-slate-800 rounded p-3 relative overflow-hidden">
                  <label className="block text-[10px] text-slate-500 uppercase font-bold mb-2 flex items-center gap-1.5 z-10 relative"><Activity className="w-3 h-3 text-cyan-500" /> Visor de Producción Espejo</label>
                  <div className="text-lg font-mono text-cyan-400 font-bold mb-1 z-10 relative">📦 145,200 <span className="text-[9px] font-sans text-slate-400">Unidades Acumuladas</span></div>
                  <div className="text-[9px] text-emerald-500 uppercase font-bold tracking-wide z-10 relative bg-slate-950/80 inline-block px-1 rounded">Estimación de Robo ({lootPercentage}%): <span className="font-mono">{(145200 * (lootPercentage/100)).toLocaleString()}</span> ud.</div>
                  <div className="absolute top-1/2 right-4 transform -translate-y-1/2 opacity-5"><Globe className="w-16 h-16 text-cyan-500" /></div>
                </div>

                <div>
                  <label htmlFor="duration_mil_adv" className="block text-[11px] text-slate-500 uppercase font-bold mb-1">Duración del Asedio (Horas)</label>
                  <input 
                    type="number"
                    id="duration_mil_adv" 
                    value={duration} 
                    onChange={e => setDuration(Number(e.target.value))} 
                    className="w-full bg-slate-900 border border-slate-800 p-2 rounded text-xs focus:ring-1 focus:ring-red-500 outline-none text-slate-200"
                    min={1}
                    max={72}
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN DE SLOTS (INSPECTOR DE ASEDIO) */}
            <div className="pt-3 border-t border-slate-800/50 space-y-3">
              <label className="block text-[11px] text-slate-500 uppercase font-bold">Inspector de Ranuras de Asedio</label>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2 bg-slate-900/50 border border-slate-800 border-dashed rounded p-2 flex items-center gap-3 hover:bg-slate-800/30 transition-colors">
                  <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center shadow-inner">
                    <Rocket className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Acorazado (Flota Principal)</div>
                    <div className="text-xs text-slate-300 font-medium">1x Battleship V2</div>
                  </div>
                  <button className="text-[10px] text-red-500 hover:text-red-400 px-2 py-1 bg-red-500/10 hover:bg-red-500/20 rounded transition-colors font-bold tracking-wide">REASIGNAR</button>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded p-2 flex items-center gap-2 relative overflow-hidden group hover:bg-slate-800/30 transition-colors">
                  <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center shrink-0">
                    <Bot className="w-3 h-3 text-purple-400" />
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-[9px] text-slate-500 font-bold uppercase">Astrobot Asedio</div>
                    <div className="text-[10px] text-slate-300 truncate font-medium">Astro-War (Artillería)</div>
                  </div>
                  <div className="absolute inset-0 border-2 border-amber-500/50 rounded pointer-events-none animate-pulse"></div>
                  <div className="absolute top-0 right-0 bg-amber-500 text-black text-[8px] font-black uppercase px-1 rounded-bl shadow">
                    🔒 QMP Activado
                  </div>
                </div>

                <div className="bg-slate-900/30 border border-slate-800/50 border-dashed rounded p-2 flex items-center justify-center opacity-50">
                  <div className="text-[10px] text-slate-600 font-bold uppercase">Herramienta N/A</div>
                </div>
              </div>
            </div>

            <button 
              onClick={handleLaunchFleet} 
              disabled={launching || !nodeId}
              className="w-full bg-red-600 hover:bg-red-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed py-2.5 rounded text-xs font-bold uppercase tracking-wider transition-all mt-4 shadow-lg shadow-red-900/20 hover:shadow-red-900/40"
            >
              {launching ? 'VERIFICANDO PROTOCOLOS...' : 'INICIAR ASEDIO MILITAR'}
            </button>
          </div>

          {/* SECCIÓN C: CONSOLA MODO DIOS BÉLICA (col-span-1) */}
          <div className="bg-orange-950/10 p-4 rounded-lg border border-orange-900/30 space-y-6 h-fit shadow-lg shadow-black/40">
            <div className="flex items-center gap-2 border-b border-orange-900/30 pb-2">
              <ShieldAlert className="w-4 h-4 text-orange-500" />
              <h3 className="text-xs font-bold text-orange-500 uppercase tracking-widest">Consola Modo Dios Bélica</h3>
            </div>

            <div className="space-y-5">
              {/* Botones de Acción MODO DIOS */}
              <div className="space-y-3">
                <button onClick={() => alert('¡SIMULACIÓN: Batallas congeladas en el sector seleccionado. Estado combat ha sido mitigado!')} className="w-full bg-orange-600 hover:bg-orange-500 py-2.5 rounded text-[10px] font-black uppercase tracking-wider text-white transition-colors flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(234,88,12,0.2)] hover:shadow-[0_0_20px_rgba(234,88,12,0.4)]">
                  🛑 Tregua Divina (Congelar Combate)
                </button>
                <button onClick={() => alert('¡SIMULACIÓN: owner_id ha sido modificado instantáneamente. Conquista Forzada ejecutada!')} className="w-full bg-cyan-600 hover:bg-cyan-500 py-2.5 rounded text-[10px] font-black uppercase tracking-wider text-white transition-colors flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(8,145,178,0.2)] hover:shadow-[0_0_20px_rgba(8,145,178,0.4)]">
                  👑 Orden de Conquista Forzada
                </button>
              </div>

              {/* Loot & Boost Override */}
              <div className="bg-slate-900/50 p-3 rounded border border-slate-800/50 space-y-3">
                <h4 className="text-[10px] text-slate-300 uppercase font-bold mb-2 border-b border-slate-800/50 pb-1">Loot & Boost Override</h4>
                
                <div className="flex items-center justify-between gap-2">
                  <label className="text-[10px] text-slate-400 uppercase font-bold">Porcentaje Robo</label>
                  <div className="relative">
                    <input type="number" min={0} max={100} value={lootPercentage} onChange={e => setLootPercentage(Number(e.target.value))} className="w-16 bg-slate-950 border border-slate-800 p-1.5 rounded text-xs font-mono text-emerald-400 text-center outline-none focus:border-emerald-500" />
                    <span className="absolute right-2 top-1.5 text-[10px] text-slate-500 font-bold">%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <label className="text-[10px] text-slate-400 uppercase font-bold">Boost Defensa</label>
                  <div className="relative">
                    <input type="number" min={0} max={500} value={boostDuration} onChange={e => setBoostDuration(Number(e.target.value))} className="w-16 bg-slate-950 border border-slate-800 p-1.5 rounded text-xs font-mono text-cyan-400 text-center outline-none focus:border-cyan-500" />
                    <span className="absolute right-2 top-1.5 text-[10px] text-slate-500 font-bold">%</span>
                  </div>
                </div>
              </div>

              {/* Bypass Toggle */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-slate-300 uppercase font-bold">Bypass Captura QMP</span>
                  <div 
                    onClick={() => setQmpBypass(!qmpBypass)}
                    className={`w-10 h-5 flex items-center rounded-full p-1 cursor-pointer transition-colors ${qmpBypass ? 'bg-orange-500' : 'bg-slate-700'}`}
                  >
                    <div className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${qmpBypass ? 'translate-x-5' : ''}`} />
                  </div>
                </div>
                {qmpBypass && (
                  <div className="text-[9px] bg-amber-500/10 border border-amber-500/20 text-amber-500 p-2 rounded flex items-start gap-1.5 animate-pulse mt-2">
                    <Zap className="w-3 h-3 mt-0.5 shrink-0" />
                    <p><strong>MODO DIOS ACTIVO:</strong> El atacante/defensor capturará de 1 a 3 naves enemigas aleatorias sin necesidad de quemar o poseer un ítem QMP.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
        </div>
      </div>
    );
  };

  const renderCabinLeftCol = () => {
    return (
      <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-4 h-fit shadow-lg shadow-black/40">
        <h3 className="text-xs font-bold text-red-500 uppercase tracking-widest flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" /> Cabina de Lanzamiento Militar
        </h3>

        {/* Indicador Militar Exclusivo */}
        <div className="bg-red-950/40 border border-red-900/50 rounded p-3 text-center">
          <div className="text-[10px] text-red-400 uppercase font-bold tracking-wider mb-1">Poder Estimado de Flota</div>
          <div className="text-lg font-black text-red-500">1250 <span className="text-xs text-red-400/70">ATK</span> / <span className="text-slate-500">???</span> <span className="text-xs text-slate-500/70">DEF</span></div>
        </div>

        {/* Selector de Destino Galáctico */}
        <div>
          <label htmlFor="destination_mil" className="block text-[11px] text-slate-500 uppercase font-bold mb-1">Destino Galáctico (Descubierto)</label>
          <select 
            id="destination_mil" 
            value={nodeId} 
            onChange={e => setNodeId(e.target.value)} 
            className="w-full bg-slate-900 border border-slate-800 p-2 rounded text-xs focus:ring-1 focus:ring-cyan-500 outline-none text-slate-200"
            disabled={starNodes.length === 0}
          >
            {starNodes.length === 0 ? (
              <option value="">Buscando destinos seguros...</option>
            ) : (
              starNodes.map(star => (
                <option key={star.id} value={star.id}>{star.name}</option>
              ))
            )}
          </select>
        </div>

        {/* Input de Duración */}
        <div>
          <label htmlFor="duration_mil" className="block text-[11px] text-slate-500 uppercase font-bold mb-1">Duración (Horas)</label>
          <input 
            type="number"
            id="duration_mil" 
            value={duration} 
            onChange={e => setDuration(Number(e.target.value))} 
            className="w-full bg-slate-900 border border-slate-800 p-2 rounded text-xs focus:ring-1 focus:ring-cyan-500 outline-none text-slate-200"
            min={1}
            max={72}
          />
        </div>

        {/* SECCIÓN DE SLOTS */}
        <div className="pt-3 border-t border-slate-800/50 space-y-3">
          <label className="block text-[11px] text-slate-500 uppercase font-bold">Asignación de Activos</label>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2 bg-slate-900/50 border border-slate-800 border-dashed rounded p-2 flex items-center gap-3 hover:bg-slate-800/30 transition-colors">
              <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center">
                <Rocket className="w-4 h-4 text-slate-400" />
              </div>
              <div className="flex-1">
                <div className="text-[10px] text-slate-500 font-bold uppercase">Flota Principal</div>
                <div className="text-xs text-slate-300 font-medium">1x Explorer Frigate</div>
              </div>
              <button className="text-[10px] text-cyan-500 hover:text-cyan-400 px-2 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 rounded transition-colors font-bold tracking-wide">EDITAR</button>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded p-2 flex items-center gap-2 hover:bg-slate-800/30 transition-colors">
              <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center shrink-0">
                <Bot className="w-3 h-3 text-purple-400" />
              </div>
              <div className="overflow-hidden">
                <div className="text-[9px] text-slate-500 font-bold uppercase">Astrobot</div>
                <div className="text-[10px] text-slate-300 truncate font-medium">Astro-1 (Soporte)</div>
              </div>
            </div>

            <div className="bg-slate-900/30 border border-slate-800/50 border-dashed rounded p-2 flex items-center justify-center opacity-50">
              <div className="text-[10px] text-slate-600 font-bold uppercase">No requerido</div>
            </div>
          </div>
        </div>

        {/* Advertencia QMP */}
        <div className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-500 p-2 rounded flex items-start gap-2">
          <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
          <p><strong>ATENCIÓN TÁCTICA:</strong> Asegúrate de equipar plataformas QMP. Sin ellas, no podrás capturar naves enemigas en caso de victoria.</p>
        </div>

        <button 
          onClick={handleLaunchFleet} 
          disabled={launching || !nodeId}
          className="w-full bg-red-600 hover:bg-red-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed py-2.5 rounded text-xs font-bold uppercase tracking-wider transition-all mt-4 shadow-lg shadow-red-900/20 hover:shadow-red-900/40"
        >
          {launching ? 'INICIANDO PROTOCOLO...' : 'INICIAR ASEDIO MILITAR'}
        </button>
      </div>
    );
  };

  const renderRadarRightCol = () => {
    const isMilitary = activeSubTab === 'domination';
    const filteredExpeditions = expeditions.filter(exp => isMilitary ? exp.expedition_type === 'domination' : exp.expedition_type !== 'domination');

    return (
      <div className="lg:col-span-2 bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-4 shadow-lg shadow-black/40">
        <div className="flex justify-between items-center border-b border-slate-900 pb-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Target className="w-4 h-4" /> Radar Táctico Orbital {isMilitary ? '(Militar)' : '(Civil)'}
          </h3>
          <button aria-label="Actualizar radar" onClick={() => { fetchExpeditions(); fetchActivePlayers(); }} className="text-slate-500 hover:text-cyan-400 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-500' : ''}`} />
          </button>
        </div>

        <div className="space-y-2">
          {filteredExpeditions.length === 0 && !loading ? (
            <div className="text-center py-12 border border-slate-800 border-dashed rounded-lg bg-slate-900/50">
              <Map className="w-8 h-8 text-slate-700 mx-auto mb-3" />
              <p className="text-xs text-slate-500 font-medium">No hay flotas transmitiendo coordenadas en este cuadrante.</p>
            </div>
          ) : (
            filteredExpeditions.map((exp) => {
              const destinationName = exp.star_nodes?.name || exp.target_node_id;
              // Alerta lógica
              const isInDanger = isMilitary && (exp.status === 'combat' || (exp.status === 'traveling' && Math.random() > 0.85));
              
              return (
                <div key={exp.id} className="p-3 bg-slate-900 border border-slate-800 rounded flex flex-col gap-2 hover:border-slate-700 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-slate-950 border border-slate-800 flex items-center justify-center shadow-inner">
                        {getMissionIcon(exp.expedition_type)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-200">{destinationName}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          T: {exp.duration_hours}H | ETA: {new Date(exp.arrives_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </div>
                    </div>
                    {renderStatus(exp.status)}
                  </div>
                  
                  {/* Alertas Contextuales */}
                  {(exp.status === 'active' && exp.expedition_type === 'mining') && (
                    <div className="text-[10px] text-emerald-400/90 bg-emerald-500/10 py-1 px-2 rounded font-mono border border-emerald-500/20 mt-1 flex items-center gap-1.5">
                      ⛏️ Minando recursos... Boost acumulado +15%
                    </div>
                  )}

                  {isInDanger && (
                    <div className="text-[10px] text-red-400 bg-red-500/10 py-1 px-2 rounded font-bold border border-red-500/20 mt-1 flex items-center gap-1.5 animate-pulse">
                      <AlertTriangle className="w-3 h-3" /> 
                      ALERTA: Flota en peligro (HP &lt;= 10%)
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  const renderExpeditionEvents = () => {
    const combatLogs = [
      { id: 1, attacker: "Comandante Alpha", defender: "LIF Marauder Base", winner: true, stolen: 1250.50, captured: 2, qmp: true },
      { id: 2, attacker: "Pirata-X9", defender: "Comandante Zeta", winner: false, stolen: 0, lost: 1, qmp: false }
    ];

    const economyLogs = [
      { id: 1, time: "12:01 UTC", msg: "Extracción minera completada. +12,400 Cristal depositados en Hangar.", type: "success" },
      { id: 2, time: "11:45 UTC", msg: "Fallo en herramienta minera. Rendimiento reducido al 80%.", type: "warning" },
      { id: 3, time: "10:30 UTC", msg: "Anomalía espacial escaneada. Datos científicos recolectados.", type: "info" }
    ];

    return (
      <div className="col-span-1 lg:col-span-3 space-y-6">
        
        {/* SECCIÓN A: STREAM EN VIVO Y BUSQUEDA */}
        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 shadow-lg shadow-black/40 space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-900 pb-3">
            <h3 className="text-xs font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-2">
              <Terminal className="w-4 h-4" /> Centro de Trazabilidad Live
            </h3>
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-500" />
              <input 
                type="text"
                value={eventsSearchQuery}
                onChange={e => setEventsSearchQuery(e.target.value)}
                placeholder="Filtrar por UUID o ID Expedición..."
                className="w-full bg-slate-900 border border-slate-800 p-2 pl-9 rounded text-xs font-mono focus:ring-1 focus:ring-emerald-500 outline-none text-slate-200 placeholder-slate-600"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-[10px] text-slate-500 uppercase font-bold mb-2">Live Incident Stream</label>
            <div className="bg-black text-xs font-mono text-emerald-400 p-3 rounded h-32 overflow-y-auto border border-slate-800 shadow-inner">
              {liveStreamLogs.map((log, index) => (
                <div key={index} className="opacity-90 hover:opacity-100">{log}</div>
              ))}
              <div ref={streamEndRef} />
            </div>
          </div>
        </div>

        {/* SECCIÓN B y C */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* SECCIÓN B: FILTRADO DE BITÁCORAS Y COMBAT LOGS */}
          <div className="lg:col-span-2 bg-slate-950 p-4 rounded-lg border border-slate-800 shadow-lg shadow-black/40 h-fit space-y-4">
            <div className="flex bg-slate-900 p-1 rounded-md border border-slate-800">
              <button 
                onClick={() => setEventsTab('combat')}
                className={`flex-1 py-1.5 text-xs font-bold rounded uppercase tracking-wider transition-all ${eventsTab === 'combat' ? 'bg-slate-800 text-red-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>
                ⚔️ Resultados Bélicos
              </button>
              <button 
                onClick={() => setEventsTab('economy')}
                className={`flex-1 py-1.5 text-xs font-bold rounded uppercase tracking-wider transition-all ${eventsTab === 'economy' ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>
                ⛏️ Economía / Recursos
              </button>
            </div>

            <div className="space-y-3 pt-2">
              {eventsTab === 'combat' ? (
                combatLogs.map(c => (
                  <div key={c.id} className={`p-3 rounded border ${c.winner ? 'bg-emerald-950/20 border-emerald-900/50 hover:bg-emerald-950/30' : 'bg-red-950/20 border-red-900/50 hover:bg-red-950/30'} transition-colors`}>
                    <div className="flex justify-between items-center mb-2 border-b border-slate-800/50 pb-2">
                      <div className="font-bold text-xs text-slate-200 font-mono"><span className="text-red-400">ATK:</span> {c.attacker} <span className="text-slate-500 mx-2">vs</span> <span className="text-cyan-400">DEF:</span> {c.defender}</div>
                      <div className={`text-[10px] font-black tracking-wider px-2 py-0.5 rounded ${c.winner ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                        {c.winner ? 'VICTORIA (ATK)' : 'DERROTA (ATK)'}
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-400 grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      <div><span className="text-slate-500 font-bold uppercase">Botín Robado:</span> <span className="text-emerald-400 font-mono">+{c.stolen.toFixed(2)}</span></div>
                      <div>
                        <span className="text-slate-500 font-bold uppercase">Destrucción / Captura:</span> 
                        {c.winner ? <span className="text-cyan-400"> +{c.captured} Chasis (Captura)</span> : <span className="text-red-400"> -{c.lost} Chasis (Pérdida)</span>}
                      </div>
                      <div className="col-span-1 sm:col-span-2">
                        <span className="text-slate-500 font-bold uppercase">Estado QMP:</span> {c.qmp ? <span className="text-amber-400 bg-amber-500/10 px-1 rounded font-bold">Consumido Exitosamente</span> : <span>Sin QMP (Naves vaporizadas)</span>}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                economyLogs.map(log => (
                  <div key={log.id} className="flex gap-3 text-sm p-3 bg-slate-900 rounded border border-slate-800/50 hover:bg-slate-800/50 transition-colors">
                    <div className="text-slate-500 font-mono text-xs mt-0.5 shrink-0 bg-slate-950 px-1.5 py-0.5 rounded">{log.time}</div>
                    <div className={`text-xs font-medium ${log.type === 'warning' ? 'text-amber-400' : log.type === 'success' ? 'text-emerald-400' : 'text-slate-300'}`}>
                      {log.msg}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* SECCIÓN C: CONSOLA MODO DIOS INYECTOR (col-span-1) */}
          <div className="bg-purple-950/10 p-4 rounded-lg border border-purple-900/30 space-y-6 h-fit shadow-lg shadow-black/40">
            <div className="flex items-center gap-2 border-b border-purple-900/30 pb-2">
              <Gift className="w-4 h-4 text-purple-500" />
              <h3 className="text-xs font-bold text-purple-500 uppercase tracking-widest">Inyector de Recompensas</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-3 bg-slate-900/50 p-3 rounded border border-slate-800/50">
                <p className="text-[10px] text-slate-400 leading-relaxed font-medium">Inyecta assets directamente al inventario de un comandante o habilita un reclamo (Claim) global para todos los jugadores activos.</p>
                
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Destinatario UUID</label>
                  <input 
                    type="text" 
                    value={claimTargetUuid} 
                    onChange={e => setClaimTargetUuid(e.target.value)} 
                    placeholder="UUID o 'GLOBAL'" 
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-xs font-mono text-purple-400 focus:border-purple-500 outline-none" 
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Tipo de Item / Recurso</label>
                  <select 
                    value={claimItemType} 
                    onChange={e => setClaimItemType(e.target.value)} 
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-xs focus:ring-1 focus:ring-purple-500 outline-none text-slate-200"
                  >
                    <option value="Metal">Metal Puro (Recurso)</option>
                    <option value="Cristal">Cristal Estelar (Recurso)</option>
                    <option value="Explorer Frigate">Explorer Frigate (Nave)</option>
                    <option value="Heavy Excavator">Heavy Excavator (Nave)</option>
                    <option value="Dreadnought Titan">Dreadnought Titan (Nave)</option>
                    <option value="Quantum Miniaturizer Platform">QMP (Consumible)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Cantidad</label>
                  <input 
                    type="number" 
                    min={1} 
                    value={claimAmount} 
                    onChange={e => setClaimAmount(Number(e.target.value))} 
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-xs font-mono text-emerald-400 focus:border-emerald-500 outline-none" 
                  />
                </div>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={() => alert(`¡SIMULACIÓN: Inyectado ${claimAmount}x ${claimItemType} al destinatario: ${claimTargetUuid || 'DESCONOCIDO'}!`)} 
                  className="w-full bg-purple-600 hover:bg-purple-500 py-3 rounded text-[10px] font-black uppercase tracking-wider text-white transition-all shadow-[0_0_15px_rgba(147,51,234,0.2)] hover:shadow-[0_0_20px_rgba(147,51,234,0.4)] flex items-center justify-center gap-2"
                >
                  <Zap className="w-3 h-3" /> Disparar Inyector de Claim
                </button>

                <button 
                  onClick={() => alert('¡SIMULACIÓN: Flotas congeladas han sido retornadas al hangar con estado reseteado!')} 
                  className="w-full bg-slate-800 hover:bg-slate-700 py-2.5 rounded text-[10px] font-bold uppercase tracking-wider text-slate-300 border border-slate-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Wrench className="w-3 h-3 text-slate-400" /> Desbloquear Flotas Dañadas
                </button>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    );
  };

  const renderGalaxyGenerator = () => {
    return (
      <div className="col-span-3 bg-slate-950 p-4 rounded-lg border border-slate-800 shadow-lg">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
          <Globe className="w-4 h-4 text-purple-400" /> Generador de Galaxias (Nodos Locales)
        </h3>
        
        <div className="flex items-center gap-4 text-[10px] uppercase font-bold text-slate-500 mb-6 bg-slate-900 p-2 rounded inline-flex">
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Propia</div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500"></div> Enemiga</div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Disputa</div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.5)]"></div> Minable</div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {starNodes.map((node, i) => {
            const statusType = i % 4 === 0 ? 'own' : i % 4 === 1 ? 'enemy' : i % 4 === 2 ? 'disputed' : 'minable';
            const borderClass = statusType === 'own' ? 'border-emerald-500/50 bg-emerald-950/10' :
                                statusType === 'enemy' ? 'border-red-500/50 bg-red-950/10' :
                                statusType === 'disputed' ? 'border-amber-500/50 bg-amber-950/10' :
                                'border-cyan-500/50 bg-cyan-950/10 shadow-[0_0_15px_rgba(34,211,238,0.1)]';
            
            return (
              <div key={node.id} className={`p-3 rounded border ${borderClass} flex flex-col items-center justify-center text-center gap-2 hover:bg-slate-800/50 transition-colors cursor-pointer`}>
                <Globe className={`w-6 h-6 ${statusType === 'own' ? 'text-emerald-400' : statusType === 'enemy' ? 'text-red-400' : statusType === 'disputed' ? 'text-amber-400' : 'text-cyan-400'}`} />
                <div className="text-xs font-bold text-slate-200 truncate w-full">{node.name}</div>
                <div className="text-[9px] text-slate-500 font-mono truncate w-full">{node.id.split('-')[0]}</div>
              </div>
            )
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-slate-100 flex flex-col">
      
      {/* Módulo de Telemetría Global (Inamovible) */}
      <div className="mb-4 shrink-0 flex flex-col sm:flex-row items-center justify-between bg-slate-950 p-4 rounded-lg border border-slate-800 shadow-lg shadow-black/40">
        <div className="flex items-center gap-2 text-emerald-400 font-mono text-sm tracking-wider">
          <Clock className="w-4 h-4" />
          <span>{utcTime || 'SINCRONIZANDO...'}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300 text-sm font-bold mt-2 sm:mt-0">
          <Users className="w-4 h-4 text-slate-500" />
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            {activePlayers} Comandantes en Órbita
          </span>
        </div>
      </div>

      {/* Navegación de Sub-Pestañas */}
      <div className="mb-6 flex border-b border-slate-800 shrink-0 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setActiveSubTab('exploration_mining')}
          className={`px-4 py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 whitespace-nowrap transition-colors border-b-2 ${
            activeSubTab === 'exploration_mining' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <Pickaxe className="w-4 h-4" /> Exploración / Minería
        </button>
        <button
          onClick={() => setActiveSubTab('domination')}
          className={`px-4 py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 whitespace-nowrap transition-colors border-b-2 ${
            activeSubTab === 'domination' ? 'border-red-500 text-red-400' : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <Crosshair className="w-4 h-4" /> Dominación Territorial
        </button>
        <button
          onClick={() => setActiveSubTab('expedition_events')}
          className={`px-4 py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 whitespace-nowrap transition-colors border-b-2 ${
            activeSubTab === 'expedition_events' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <FileText className="w-4 h-4" /> Eventos de Expediciones
        </button>
        <button
          onClick={() => setActiveSubTab('galaxy_generator')}
          className={`px-4 py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 whitespace-nowrap transition-colors border-b-2 ${
            activeSubTab === 'galaxy_generator' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <Globe className="w-4 h-4" /> Generador de Galaxias
        </button>
      </div>

      {/* Contenido Principal de Pestañas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 items-start">
        {activeSubTab === 'exploration_mining' && renderExplorationMiningDashboard()}
        
        {activeSubTab === 'domination' && renderDominationDashboard()}

        {activeSubTab === 'expedition_events' && renderExpeditionEvents()}
        
        {activeSubTab === 'galaxy_generator' && renderGalaxyGenerator()}
      </div>

    </div>
  );
};
