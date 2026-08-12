import React, { useEffect, useState } from 'react';
import { getSupabaseClient } from '../lib/supabase';
import {
  Compass, ShieldAlert, Swords, Map, Plus, Trash2, Zap, Play, Search,
  TrendingUp, Award, Clock, RefreshCw, Eye, Trophy, Skull, Users, Layers,
  Gift, Flame, Info, Crosshair, Edit3, Save, Layers3, LayoutGrid, Shield, Target, Activity, X, AlertTriangle, Check
} from 'lucide-react';

// Base de Datos Táctica para el Módulo Analítico del Simulador
const MOCK_ASSETS_DATABASE: Record<string, { name: string; type: string; stats: string; skills: string; hp: number; shield: number; atk: number }> = {
  'ship-heavy-hunter': { name: 'Heavy Hunter Beta', type: 'Nave de Asalto', stats: 'HP: 4500 | Escudo: 1200 | Ataque: 650', skills: 'Fuego de Plasma Lvl 3 (Ignora 20% de escudo)', hp: 4500, shield: 1200, atk: 650 },
  'ship-explorer': { name: 'Explorer Frigate', type: 'Nave de Reconocimiento', stats: 'HP: 3000 | Escudo: 800 | Ataque: 300', skills: 'Evasión Órbital Lvl 2 (+15% Esquiva)', hp: 3000, shield: 800, atk: 300 },
  'struct-shield-gen': { name: 'Generador de Escudo Local', type: 'Estructura Defensiva', stats: 'Mitigación: +25% daño de energía', skills: 'Burbuja Cuántica (Absorbe primer impacto crítico)', hp: 1000, shield: 5000, atk: 0 },
  'tech-plasma-drive': { name: 'Propulsor de Plasma Avanzado', type: 'Tecnología de Vuelo', stats: 'Velocidad: +40% | Consumo: -10%', skills: 'Salto Hiperespacial de Emergencia (Evita destrucción fatal)', hp: 500, shield: 200, atk: 100 }
};

type TabId = 'exploration' | 'domination' | 'events' | 'generator';
type ExploreSubTab = 'monitor' | 'losses' | 'usage' | 'discoveries';
type DominationSubTab = 'realtime' | 'simulator' | 'conquest';
type EventSubTab = 'creator' | 'threats_only';
type GenRightTab = 'creation' | 'edition' | 'ami';

export const ExpeditionsManager: React.FC = () => {
  const supabase = getSupabaseClient();
  const [activeTab, setActiveTab] = useState<TabId>('exploration');
  const [loading, setLoading] = useState<boolean>(true);

  // Sub-Navegación Interna de Cuadrantes
  const [activeExploreTab, setActiveExploreTab] = useState<ExploreSubTab>('monitor');
  const [activeDomTab, setActiveDomTab] = useState<DominationSubTab>('realtime');
  const [activeEventTab, setActiveEventTab] = useState<EventSubTab>('creator');

  // Sub-Navegación de la Consola de Trabajo Derecha
  const [genRightTab, setGenRightTab] = useState<GenRightTab>('creation');

  // Telemetría de Base de Datos
  const [activeExpeditions, setActiveExpeditions] = useState<any[]>([]);
  const [lossesLog, setLossesLog] = useState<any[]>([]);
  const [discoveries, setDiscoveries] = useState<any[]>([]);
  const [eventsCatalog, setEventsCatalog] = useState<any[]>([]);

  // ── COORDENADAS DINÁMICAS DEL UNIVERSO ──
  const [dbClusters, setDbClusters] = useState<{ id: string; name: string; base_duration_minutes: number; assigned_events?: any[] }[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<string>('PELA');
  const [selectedGalaxy, setSelectedGalaxy] = useState<string>('');
  const [selectedStarCluster, setSelectedStarCluster] = useState<string>('');
  const [selectedStarSystem, setSelectedStarSystem] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');

  const [galaxies, setGalaxies] = useState<any[]>([]);
  const [starClusters, setStarClusters] = useState<any[]>([]);
  const [starSystems, setStarSystems] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);

  // Formularios del Creador Procedural
  const [newGcId, setNewGcId] = useState<string>('');
  const [newGcName, setNewGcName] = useState<string>('');
  const [newGcDuration, setNewGcDuration] = useState<number>(60);
  const [newGalaxyNum, setNewGalaxyNum] = useState<number>(1);
  const [newScNum, setNewScNum] = useState<number>(1);
  const [newSystemCode, setNewSystemCode] = useState<string>('');
  const [newLocNum, setNewLocNum] = useState<number>(1);
  const [newLocReward, setNewLocReward] = useState<string>('metal_balance');
  const [newLocRewardQty, setNewLocRewardQty] = useState<number>(1000);

  // Cantidades de creación en masa (Consola de Creación)
  const [createQtyGal, setCreateQtyGal] = useState<number>(1);
  const [createQtySc, setCreateQtySc] = useState<number>(1);
  const [createQtySys, setCreateQtySys] = useState<number>(1);
  const [createQtyLoc, setCreateQtyLoc] = useState<number>(1); 

  // PORCENTAJES DE AFECTACIÓN EN MASA (Consola de Edición)
  const [editPctCluster, setEditPctCluster] = useState<number>(100);
  const [editPctGal, setEditPctGal] = useState<number>(100);
  const [editPctSc, setEditPctSc] = useState<number>(100);
  const [editPctSys, setEditPctSys] = useState<number>(100);
  const [editPctLoc, setEditPctLoc] = useState<number>(100);

  // % DE APARICIÓN DE SUCESOS INDIVIDUALES DENTRO DE LAS TARJETAS DE EDICIÓN
  const [cardEventRateCluster, setCardEventRateCluster] = useState<number>(5);
  const [cardEventRateGal, setCardEventRateGal] = useState<number>(5);
  const [cardEventRateSc, setCardEventRateSc] = useState<number>(5);
  const [cardEventRateSys, setCardEventRateSys] = useState<number>(5);
  const [cardEventRateLoc, setCardEventRateLoc] = useState<number>(5);

  const [cardEventBindCluster, setCardEventBindCluster] = useState<string>('');
  const [cardEventBindGal, setCardEventBindGal] = useState<string>('');
  const [cardEventBindSc, setCardEventBindSc] = useState<string>('');
  const [cardEventBindSys, setCardEventBindSys] = useState<string>('');
  const [cardEventBindLoc, setCardEventBindLoc] = useState<string>('');

  // Estados de control para Planetas / Estrellas
  const [bodyType, setBodyType] = useState<'planeta' | 'estrella'>('planeta');
  const [planetSubtype, setPlanetType] = useState<string>('rocoso');
  const [starSubtype, setStarType] = useState<string>('blancas');

  // Estados para Ventana Pop-up Maestra de Edición Avanzada
  const [editingEntity, setEditingEntity] = useState<{ type: 'cluster' | 'galaxy' | 'sc' | 'system' | 'planet'; record: any } | null>(null);
  const [modalInputName, setModalInputName] = useState<string>('');
  const [modalInputTime, setModalInputDuration] = useState<number>(60);
  const [modalInputEvents, setModalInputEvents] = useState<any[]>([]);
  const [selectedEventToBind, setSelectedEventToBind] = useState<string>('');

  // ── ESTADOS EXPLICITOS PARA LOS CAMPOS EDICIÓN DIRECTA EN TARJETAS DE CONSOLA ──
  const [editClusterName, setEditClusterName] = useState<string>('');
  const [editClusterDuration, setEditClusterDuration] = useState<number>(60);
  const [editGalaxyNum, setEditGalaxyNum] = useState<number>(1);
  const [editScNum, setEditScNum] = useState<number>(1);
  const [editSystemCode, setEditSystemCode] = useState<string>('');
  const [editLocNum, setEditLocNum] = useState<number>(1);
  const [editLocRewardQty, setEditLocRewardQty] = useState<number>(1000);

  // Gestor de Eventos Avanzado (Pestaña 3)
  const [newEventName, setNewEventName] = useState<string>('');
  const [newEventDesc, setNewEventDesc] = useState<string>('');
  const [newEventEffect, setNewEventEffect] = useState<string>('negative');
  const [newEventTarget, setNewEventTarget] = useState<string>('fleet');
  const [newSpawnRate, setNewSpawnRate] = useState<number>(5);
  const [selectedTriggerSkill, setSelectedTriggerSkill] = useState<string>('Combate Alienígena Lvl 3');
  const [skillImpactFormula, setSkillImpactFormula] = useState<string>('Reduce la pérdida de casco del 20% al 5%');
  const [spawnRegion, setSpawnRegion] = useState<string>('PELA');
  const [specialCondition, setSpecialCondition] = useState<string>('Nivel CAN mínimo 10');
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [rewardAssetType, setRewardAssetType] = useState<string>('gd_balance');
  const [rewardAssetQty, setRewardAssetQty] = useState<number>(500);

  // Simulador de Batallas (Pestaña 2)
  const [p1AssetKey, setP1AssetKey] = useState<string>('ship-heavy-hunter');
  const [p2AssetKey, setP2AssetKey] = useState<string>('ship-explorer');
  const [p1Ships, setP1Ships] = useState<number>(10);
  const [p1TechLvl, setP1TechLvl] = useState<number>(5);
  const [p2Ships, setP2Ships] = useState<number>(10);
  const [p2TechLvl, setP2TechLvl] = useState<number>(5);
  const [combatLogs, setCombatLogs] = useState<string[]>([]);
  const [simResult, setSimResult] = useState<any | null>(null);

  // Inspector de Planetas Conquistados
  const [dominatedPlanets, setDominatedPlanets] = useState<any[]>([
    { id: 'dom-1', name: 'Zeta Reticuli Prime', sector: 'PELA:SC1', taxRate: 15, stability: 92, extractRate: 2450, shieldActive: true, garrison: 45 },
    { id: 'dom-2', name: 'Kepler-186f', sector: 'GC1:SC2', taxRate: 25, stability: 64, extractRate: 5800, shieldActive: false, garrison: 12 },
    { id: 'dom-3', name: 'Gorgona Alpha', sector: 'GC2:SC1', taxRate: 8, stability: 98, extractRate: 1200, shieldActive: true, garrison: 80 }
  ]);
  const [selectedDominatedPlanet, setSelectedDominatedPlanet] = useState<any | null>(dominatedPlanets[0]);

  // Cabina de Mando Fija Original
  const [missionProtocol, setMissionProtocol] = useState<'exploration' | 'mining'>('exploration');
  const [variableDuration, setVariableDuration] = useState<string>('4 Horas');

  // Derivaciones de Estado
  const activeClusterData = dbClusters.find(c => c.id === selectedCluster);
  const activeGalaxyData = galaxies.find(g => g.id === selectedGalaxy);
  const activeScData = starClusters.find(s => s.id === selectedStarCluster);
  const activeSystemData = starSystems.find(sys => sys.id === selectedStarSystem);
  const activeLocationData = locations.find(l => l.id === selectedLocation);

  // Sincronizar campos de edición al mutar selecciones
  useEffect(() => {
    if (activeClusterData) {
      setEditClusterName(activeClusterData.name);
      setEditClusterDuration(activeClusterData.base_duration_minutes);
    }
    if (activeGalaxyData) setEditGalaxyNum(activeGalaxyData.galaxy_number);
    if (activeScData) setEditScNum(activeScData.sc_number);
    if (activeSystemData) setEditSystemCode(activeSystemData.name_code);
    if (activeLocationData) setEditLocRewardQty(Object.values(activeLocationData.rewards || {})[0] as number || 1000);
  }, [selectedCluster, selectedGalaxy, selectedStarCluster, selectedStarSystem, selectedLocation, dbClusters, galaxies, starClusters, starSystems, locations]);

  // Sincronizador de Telemetría Real
  const fetchTelemetryAndCatalogs = async () => {
    if (!supabase) return;
    try {
      setLoading(true);

      // Carga dual para compatibilidad de tablas de expediciones activas
      let expData: any[] = [];
      const { data: expRes1 } = await supabase.from('active_expeditions').select('*').eq('status', 'LAUNCHED');
      if (expRes1 && expRes1.length > 0) {
        expData = expRes1;
      } else {
        const { data: expRes2 } = await supabase.from('expeditions_active').select('*');
        if (expRes2) expData = expRes2;
      }

      const [lossRes, discRes, evRes, gcRes] = await Promise.all([
        supabase.from('expedition_logs').select('*').order('created_at', { ascending: false }).limit(20),
        supabase.from('user_discovered_stars').select('*').order('discovered_at', { ascending: false }),
        supabase.from('expedition_events_catalog').select('*').order('created_at', { ascending: false }),
        supabase.from('seed_galaxy_clusters').select('*').order('name', { ascending: true })
      ]);

      setActiveExpeditions(expData);
      if (lossRes.data) setLossesLog(lossRes.data);
      if (discRes.data) setDiscoveries(discRes.data);
      if (evRes.data) setEventsCatalog(evRes.data);
      if (gcRes.data && gcRes.data.length > 0) {
        setDbClusters(gcRes.data);
        if (!selectedCluster) {
          setSelectedCluster(gcRes.data[0].id);
        }
      }
    } catch (e) { 
      console.error("Error al sincronizar telemetría:", e); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    fetchTelemetryAndCatalogs(); 
  }, []);

  // Cascadas Jerárquicas
  useEffect(() => {
    if (!supabase) return;
    const loadGalaxies = async () => {
      const { data } = await supabase.from('seed_galaxies').select('*').eq('cluster_id', selectedCluster);
      setGalaxies(data || []); setSelectedGalaxy(''); setSelectedStarCluster(''); setSelectedStarSystem(''); setSelectedLocation('');
    };
    loadGalaxies();
  }, [selectedCluster, supabase]);

  useEffect(() => {
    if (!supabase || !selectedGalaxy) { setStarClusters([]); return; }
    const loadStarClusters = async () => {
      const { data } = await supabase.from('seed_star_clusters').select('*').eq('galaxy_id', selectedGalaxy);
      setStarClusters(data || []); setSelectedStarCluster(''); setSelectedStarSystem(''); setSelectedLocation('');
    };
    loadStarClusters();
  }, [selectedGalaxy, supabase]);

  useEffect(() => {
    if (!supabase || !selectedStarCluster) { setStarSystems([]); return; }
    const loadStarSystems = async () => {
      const { data } = await supabase.from('seed_star_systems').select('*').eq('sc_id', selectedStarCluster);
      setStarSystems(data || []); setSelectedStarSystem(''); setSelectedLocation('');
    };
    loadStarSystems();
  }, [selectedStarCluster, supabase]);

  useEffect(() => {
    if (!supabase || !selectedStarSystem) { setLocations([]); return; }
    const loadLocations = async () => {
      const { data } = await supabase.from('seed_locations').select('*').eq('system_id', selectedStarSystem);
      setLocations(data || []); setSelectedLocation('');
    };
    loadLocations();
  }, [selectedStarSystem, supabase]);

  // ── ACCIONES EN TIEMPO REAL SOBRE FLOTAS EN VUELO ──
  const handleForceCompleteExpedition = async (expId: string) => {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from('active_expeditions')
        .update({ status: 'CLAIMED' })
        .eq('id', expId);

      if (error) {
        await supabase.from('expeditions_active').update({ status: 'CLAIMED' }).eq('id', expId);
      }

      alert('🚀 EXPEDICIÓN MARCADA COMO COMPLETADA. LISTA PARA RECLAMAR.');
      fetchTelemetryAndCatalogs();
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  const handleForceRecallExpedition = async (expId: string) => {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from('active_expeditions')
        .update({ status: 'SUCCESS', estimated_return_time: new Date().toISOString() })
        .eq('id', expId);

      if (error) {
        await supabase.from('expeditions_active').update({ status: 'SUCCESS' }).eq('id', expId);
      }

      alert('🛑 FLOTA RETORNADA A BASE INMEDIATAMENTE.');
      fetchTelemetryAndCatalogs();
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  const handleForceDestroyExpedition = async (expId: string) => {
    if (!supabase || !window.confirm('🚨 ADVERTENCIA MASTER: ¿Confirmas la destrucción total de esta flota en vuelo?')) return;
    try {
      const { error } = await supabase
        .from('active_expeditions')
        .update({ status: 'FAILED' })
        .eq('id', expId);

      if (error) {
        await supabase.from('expeditions_active').update({ status: 'FAILED' }).eq('id', expId);
      }

      alert('💥 FLOTA DESTRUIDA EN EL ESPACIO EXTERIOR.');
      fetchTelemetryAndCatalogs();
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  const handleGlobalInstaRecall = async () => {
    if (!supabase || !window.confirm('🚨 ¿DESPLEGAR INSTA-RECALL GLOBAL REAL A TODAS LAS EXPEDICIONES?')) return;
    try {
      await supabase
        .from('active_expeditions')
        .update({ estimated_return_time: new Date().toISOString() })
        .eq('status', 'LAUNCHED');

      alert('📢 RECALL GLOBAL IMPLEMENTADO CON ÉXITO.');
      fetchTelemetryAndCatalogs();
    } catch (e: any) {
      alert(`Error en Insta-Recall: ${e.message}`);
    }
  };

  // Pop-up Modals
  const openEditModal = (type: 'cluster' | 'galaxy' | 'sc' | 'system' | 'planet', record: any) => {
    if (!record) return;
    setEditingEntity({ type, record });
    setModalInputName(record.name || record.name_code || record.galaxy_number || record.sc_number || record.planet_star_number || '');
    setModalInputDuration(record.base_duration_minutes || record.time_minutes || 60);
    setModalInputEvents(record.assigned_events || []);
  };

  const handleSaveModalEdits = async () => {
    if (!supabase || !editingEntity) return;
    try {
      let table = '';
      let payload: any = { assigned_events: modalInputEvents };

      if (editingEntity.type === 'cluster') {
        table = 'seed_galaxy_clusters';
        payload.name = modalInputName;
        payload.base_duration_minutes = Number(modalInputTime);
      } else if (editingEntity.type === 'galaxy') {
        table = 'seed_galaxies';
        payload.galaxy_number = Number(modalInputName);
      } else if (editingEntity.type === 'sc') {
        table = 'seed_star_clusters';
        payload.sc_number = Number(modalInputName);
      } else if (editingEntity.type === 'system') {
        table = 'seed_star_systems';
        payload.name_code = modalInputName;
      } else if (editingEntity.type === 'planet') {
        table = 'seed_locations';
        payload.planet_star_number = Number(modalInputName);
        payload.time_minutes = Number(modalInputTime);
      }

      const { error } = await supabase.from(table).update(payload).eq('id', editingEntity.record.id);
      if (error) throw error;

      alert(`⚙️ TELEMETRÍA SINCRONIZADA: Datos guardados con éxito.`);
      setEditingEntity(null);
      fetchTelemetryAndCatalogs();
    } catch (e: any) { alert(`Error al guardar: ${e.message}`); }
  };

  // ── LÓGICA DE ESCRITURA MODULAR PROCEDURAL ──
  const handleCreateGalaxyCluster = async () => {
    if (!supabase || !newGcId.trim() || !newGcName.trim()) {
      alert("Introduce el código de 2 a 4 letras y el nombre del Clúster.");
      return;
    }
    const cleanId = newGcId.trim().toUpperCase();
    try {
      const { error } = await supabase.from('seed_galaxy_clusters').insert([{ id: cleanId, name: newGcName.trim(), base_duration_minutes: Number(newGcDuration) }]);
      if (error) throw error;
      alert(`GALAXY CLUSTER [${cleanId}] MAPEADO CON ÉXITO.`);
      setNewGcId(''); setNewGcName(''); fetchTelemetryAndCatalogs();
    } catch (e: any) { alert(e.message); }
  };

  const handleCreateGalaxy = async () => {
    if (!supabase || !selectedCluster) return;
    try {
      const payload = [];
      for (let i = 0; i < createQtyGal; i++) {
        payload.push({ cluster_id: selectedCluster, galaxy_number: Number(newGalaxyNum) + i });
      }
      const { error } = await supabase.from('seed_galaxies').insert(payload);
      if (error) throw error;
      alert(`Añadidas ${createQtyGal} galaxias consecutivas.`);
      fetchTelemetryAndCatalogs();
    } catch (e: any) { alert(e.message); }
  };

  const handleCreateStarCluster = async () => {
    if (!supabase || !selectedGalaxy) return;
    try {
      const payload = [];
      for (let i = 0; i < createQtySc; i++) {
        payload.push({ galaxy_id: selectedGalaxy, sc_number: Number(newScNum) + i });
      }
      const { error } = await supabase.from('seed_star_clusters').insert(payload);
      if (error) throw error;
      alert(`Sembrados ${createQtySc} Star Clusters.`);
      fetchTelemetryAndCatalogs();
    } catch (e: any) { alert(e.message); }
  };

  const handleCreateStarSystem = async () => {
    if (!supabase || !selectedStarCluster || !newSystemCode.trim()) return;
    try {
      const payload = [];
      for (let i = 0; i < createQtySys; i++) {
        const derivedCode = createQtySys > 1 ? `${newSystemCode.trim()}-${i + 1}` : newSystemCode.trim();
        payload.push({ sc_id: selectedStarCluster, name_code: derivedCode });
      }
      const { error } = await supabase.from('seed_star_systems').insert(payload);
      if (error) throw error;
      alert(`Fundados ${createQtySys} Star Systems.`);
      fetchTelemetryAndCatalogs();
    } catch (e: any) { alert(e.message); }
  };

  const handleCreateLocation = async () => {
    if (!supabase || !selectedStarSystem) return;
    try {
      const activeSubtype = bodyType === 'planeta' ? planetSubtype : starSubtype;
      const inheritedTime = activeClusterData ? Number(activeClusterData.base_duration_minutes) : 60;
      const payload = [];
      for (let i = 0; i < createQtyLoc; i++) {
        payload.push({
          system_id: selectedStarSystem,
          planet_star_number: Number(newLocNum) + i,
          time_minutes: inheritedTime,
          rewards: { [newLocReward]: newLocRewardQty },
          conditions: { body_type: bodyType, body_subtype: activeSubtype }
        });
      }
      const { error } = await supabase.from('seed_locations').insert(payload);
      if (error) throw error;
      alert(`Mapeados ${createQtyLoc} elementos.`);
      fetchTelemetryAndCatalogs();
    } catch (e: any) { alert(e.message); }
  };

  // ─── ⚡ PROCESADOR MÁSTER DE EVENTOS ───
  const handleCreateEventAdvanced = async () => {
    if (!supabase || !newEventName.trim()) {
      alert("🚨 ERROR DE PROTOCOLO: Introduce al menos el nombre del evento.");
      return;
    }
    try {
      const { error } = await supabase.from('expedition_events_catalog').insert([
        {
          name: newEventName.trim(),
          description: newEventDesc.trim(),
          effect_type: newEventEffect,
          target_type: newEventTarget,
          spawn_rate: Number(newSpawnRate),
          trigger_skill: selectedTriggerSkill,
          skill_impact_formula: skillImpactFormula,
          spawn_region: spawnRegion,
          special_condition: specialCondition,
          reward_asset_type: rewardAssetType,
          reward_asset_qty: Number(rewardAssetQty)
        }
      ]);

      if (error) throw error;

      alert(`⚡ VECTOR DE AMENAZA REGISTRADO: Evento [${newEventName.trim()}] guardado con éxito.`);
      setNewEventName('');
      setNewEventDesc('');
      fetchTelemetryAndCatalogs();
    } catch (e: any) {
      alert(`🚨 CRASH EN CATÁLOGO: ${e.message}`);
    }
  };

  // PROCESADOR DE SUCESOS COMPUESTOS
  const parseEventsPayload = (currentRaw: any, action: 'add' | 'remove', evtName?: string, customRate?: number) => {
    let list: any[] = Array.isArray(currentRaw) ? currentRaw : [];
    list = list.map(item => typeof item === 'string' ? { name: item, spawn_rate: 5 } : item);
    if (action === 'add' && evtName) {
      list = list.filter(e => e.name !== evtName);
      list.push({ name: evtName, spawn_rate: customRate || 5 });
    }
    if (action === 'remove' && evtName) list = list.filter(e => e.name !== evtName);
    return list;
  };

  // ACCIONES DEL MOTOR DE INYECTORES POR PORCENTAJE
  const handleUpdateClusterInline = async (action: 'add' | 'remove', evtName?: string) => {
    if (!supabase || !selectedCluster || !activeClusterData) return;
    try {
      const events = parseEventsPayload(activeClusterData.assigned_events, action, evtName, cardEventRateCluster);
      const sliceCount = Math.max(1, Math.round(dbClusters.length * (editPctCluster / 100)));
      const targetIds = dbClusters.slice(0, sliceCount).map(c => c.id);
      const { error } = await supabase.from('seed_galaxy_clusters').update({ name: editClusterName, base_duration_minutes: Number(editClusterDuration), assigned_events: events }).in('id', targetIds);
      if (error) throw error;
      alert(`Impactado el ${editPctCluster}% de Clústeres.`);
      setCardEventBindCluster(''); fetchTelemetryAndCatalogs();
    } catch (e: any) { alert(e.message); }
  };

  const handleUpdateGalaxyInline = async (action: 'add' | 'remove', evtName?: string) => {
    if (!supabase || !selectedGalaxy || !activeGalaxyData) return;
    try {
      const events = parseEventsPayload(activeGalaxyData.assigned_events, action, evtName, cardEventRateGal);
      const sliceCount = Math.max(1, Math.round(galaxies.length * (editPctGal / 100)));
      const targetIds = galaxies.slice(0, sliceCount).map(g => g.id);
      const { error } = await supabase.from('seed_galaxies').update({ galaxy_number: Number(editGalaxyNum), assigned_events: events }).in('id', targetIds);
      if (error) throw error;
      alert(`Impactado el ${editPctGal}% de Galaxias.`);
      setCardEventBindGal(''); fetchTelemetryAndCatalogs();
    } catch (e: any) { alert(e.message); }
  };

  const handleDeleteTier = async (table: string, id: string, label: string) => {
    if (!supabase || !window.confirm(`🚨 CONTROL DE PURGA CRÍTICO: ¿Estás seguro de desintegrar permanentemente este/a [${label}]?`)) return;
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) alert(error.message);
    else { alert(`¡${label} eliminado con éxito!`); fetchTelemetryAndCatalogs(); }
  };

  // ─── ⚔️ SIMULADOR DE BATALLAS ───
  const runMilimetricBattleSimulator = () => {
    if (p1Ships <= 0 || p2Ships <= 0) { alert("Introduce montos válidos de naves."); return; }
    
    const assetP1 = MOCK_ASSETS_DATABASE[p1AssetKey];
    const assetP2 = MOCK_ASSETS_DATABASE[p2AssetKey];
    
    const logAccumulator: string[] = [];
    logAccumulator.push(`[${new Date().toLocaleTimeString()}] ⚔️ INICIO DE COMBATE EN ÓRBITA CRÍTICA`);
    logAccumulator.push(`[DATOS] P1 Despliega: ${p1Ships}x ${assetP1.name} | P2 Despliega: ${p2Ships}x ${assetP2.name}`);

    let p1BaseAtk = assetP1.atk * p1Ships * (1 + p1TechLvl * 0.15);
    let p1BaseHp = (assetP1.hp + assetP1.shield) * p1Ships;

    let p2BaseAtk = assetP2.atk * p2Ships * (1 + p2TechLvl * 0.15);
    let p2BaseHp = (assetP2.hp + assetP2.shield) * p2Ships;

    if (p1AssetKey === 'ship-heavy-hunter') {
      logAccumulator.push(`[PASIVA P1] Fuego de Plasma Lvl 3: Se ignora parte de la mitigación defensiva.`);
      p1BaseAtk *= 1.12; 
    }
    if (p2AssetKey === 'ship-explorer') {
      logAccumulator.push(`[PASIVA P2] Evasión Orbital Lvl 2: Evasión aumentada detectada.`);
      p1BaseAtk *= 0.85; 
    }
    if (p2AssetKey === 'struct-shield-gen') {
      logAccumulator.push(`[PASIVA P2] Burbuja Cuántica: Absorción de energía crítica activada.`);
      p2BaseHp *= 1.25;
    }

    const powerTotal = p1BaseAtk + p2BaseAtk;
    const rate1 = (p1BaseAtk / (powerTotal || 1)) * 100;
    
    const lostP1 = Math.min(p1Ships, Math.round(p1Ships * (p2BaseAtk / (p1BaseAtk || 1)) * 0.6));
    const lostP2 = Math.min(p2Ships, Math.round(p2Ships * (p1BaseAtk / (p2BaseAtk || 1)) * 0.6));
    
    logAccumulator.push(`[CONCLUSIÓN] Bajas Atacante: -${lostP1} chasis de ${assetP1.name}. Bajas Defensor: -${lostP2} chasis de ${assetP2.name}.`);

    setCombatLogs(logAccumulator);
    setSimResult({
      winRate: rate1.toFixed(1),
      survivorsP1: p1Ships - lostP1,
      survivorsP2: p2Ships - lostP2,
      stolenMetal: rate1 > 50 ? (lostP2 * 3500) : 0,
      p1Power: p1BaseAtk.toFixed(0),
      p2Power: p2BaseAtk.toFixed(0)
    });
  };

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-slate-100 font-mono text-xs space-y-6 rounded-xl border border-slate-800 text-left">

      {/* HEADER CRONOMETRADO */}
      <div className="bg-slate-950/80 p-3.5 border border-slate-850 rounded-lg flex justify-between items-center select-none">
        <div className="flex items-center gap-2 text-emerald-400 font-bold tracking-wider text-[11px]">
          <Clock size={13} className="animate-pulse" /> {new Date().toUTCString().split(' ')[4]} UTC
        </div>
        <div className="flex items-center gap-1.5 text-slate-400 font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span>{activeExpeditions.length} Flotas en Tránsito Activo</span>
        </div>
      </div>

      {/* TABS NAVEGACIÓN */}
      <div className="flex flex-wrap border-b border-slate-800 gap-1 select-none">
        {[
          { id: 'exploration', label: '🚀 Exploración / Minería', icon: <Compass size={14} /> },
          { id: 'domination', label: '⚔️ Dominación & Simulador', icon: <Swords size={14} /> },
          { id: 'events', label: '⚡ Catálogo de Eventos', icon: <Zap size={14} /> },
          { id: 'generator', label: '🌌 Generador de Galaxias', icon: <Map size={14} /> }
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as TabId)} className={`px-4 py-2.5 font-bold uppercase tracking-wider flex items-center gap-2 transition-all border-b-2 cursor-pointer ${activeTab === t.id ? 'border-cyan-500 text-cyan-400 bg-cyan-950/10' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>{t.icon} {t.label}</button>
        ))}
      </div>

      {/* TAB 1: EXPLORACIÓN Y MINERÍA */}
      {activeTab === 'exploration' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl">
              <span className="text-[9px] text-slate-500 font-bold block mb-1">Flotas Activas Registradas</span>
              <div className="text-2xl font-black text-emerald-400">{activeExpeditions.length} <span className="text-xs font-normal">Expediciones</span></div>
            </div>
            <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl">
              <span className="text-[9px] text-slate-500 font-bold block mb-1">Eventos Tácticos Registrados</span>
              <div className="text-2xl font-black text-rose-500">{lossesLog.length} <span className="text-xs font-normal text-slate-400">Incidentes</span></div>
            </div>
          </div>

          <div className="flex gap-1 bg-black/40 p-1 rounded-lg border border-slate-850 select-none">
            {[{ id: 'monitor', label: '📊 Monitor Operativo' }, { id: 'losses', label: '💀 Pérdidas & Logs' }, { id: 'usage', label: '🛸 Uso de Assets' }, { id: 'discoveries', label: '🏆 Descubrimientos' }].map(sub => (
              <button key={sub.id} onClick={() => setActiveExploreTab(sub.id as ExploreSubTab)} className={`px-3 py-1.5 font-bold uppercase text-[9.5px] rounded cursor-pointer ${activeExploreTab === sub.id ? 'bg-cyan-950/40 text-cyan-400 border border-cyan-900/40' : 'text-slate-500'}`}>{sub.label}</button>
            ))}
          </div>

          {activeExploreTab === 'monitor' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-fadeIn">
              <div className="xl:col-span-2 bg-slate-950 p-5 border border-slate-850 rounded-xl space-y-4">
                <span className="text-cyan-400 font-bold text-[10px] uppercase tracking-widest flex items-center gap-1"><Compass size={12} /> RADAR GLOBAL DE FLOTAS EN VUELO (TIEMPO REAL)</span>
                
                {activeExpeditions.length === 0 ? (
                  <div className="p-8 text-center text-slate-600 text-[10px] uppercase border border-slate-850 rounded-lg">
                    No hay expediciones en vuelo registradas en este momento.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {activeExpeditions.map((exp) => (
                      <div key={exp.id} className="p-3 bg-zinc-950 border border-slate-800 rounded-lg flex flex-col md:flex-row justify-between md:items-center gap-3">
                        <div className="space-y-1">
                          <div className="font-bold text-white uppercase text-[11px]">{exp.fleet_name || 'FLOTA INDEPENDIENTE'}</div>
                          <div className="text-[9px] text-cyan-400 font-mono">
                            Ruta: {exp.galaxy_cluster || 'PELA'} &gt; {exp.sector_name || 'SECTOR'}
                          </div>
                          <div className="text-[8px] text-slate-500">
                            ID Piloto: {exp.user_id?.substring(0, 8)}... | Salida: {new Date(exp.launch_time).toLocaleTimeString()}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleForceCompleteExpedition(exp.id)}
                            className="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 font-bold text-[8.5px] uppercase rounded cursor-pointer"
                          >
                            🚀 Completar
                          </button>
                          <button
                            onClick={() => handleForceRecallExpedition(exp.id)}
                            className="px-2.5 py-1 bg-amber-950 hover:bg-amber-900 border border-amber-700 text-amber-300 font-bold text-[8.5px] uppercase rounded cursor-pointer"
                          >
                            🛑 Retornar
                          </button>
                          <button
                            onClick={() => handleForceDestroyExpedition(exp.id)}
                            className="px-2.5 py-1 bg-red-950 hover:bg-red-900 border border-red-700 text-red-300 font-bold text-[8.5px] uppercase rounded cursor-pointer"
                          >
                            💥 Destruir
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-slate-950 p-5 border border-slate-850 rounded-xl space-y-4">
                <span className="text-red-500 font-bold text-[10px] uppercase tracking-widest flex items-center gap-1"><ShieldAlert size={12} /> CONSOLA MODO DIOS</span>
                <button 
                  onClick={handleGlobalInstaRecall}
                  className="w-full bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-red-400 font-black py-2.5 rounded text-[9.5px] uppercase transition-all cursor-pointer"
                >
                  🚨 FORZAR INSTA-RECALL GLOBAL REAL
                </button>
              </div>
            </div>
          )}

          {activeExploreTab === 'losses' && (
            <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl space-y-4 animate-fadeIn">
              <span className="text-rose-500 font-bold text-[10px] uppercase tracking-widest flex items-center gap-1"><Skull size={12} /> PÉRDIDAS FORENSES Y EVENTOS DE EXPEDICIÓN</span>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {lossesLog.length === 0 ? (
                  <div className="text-center py-8 text-slate-600">Sin logs de combate ni anomalías reportadas.</div>
                ) : (
                  lossesLog.map((log) => (
                    <div key={log.id} className="p-2.5 bg-zinc-950 border border-slate-850 rounded flex justify-between items-center text-[10px]">
                      <div>
                        <span className="font-bold text-white uppercase">{log.title || 'EVENTO TÁCTICO'}</span>
                        <p className="text-slate-400 text-[9px]">{log.message}</p>
                      </div>
                      <span className="text-amber-400 font-mono font-bold">{log.damage_sustained ? `-${log.damage_sustained} HP` : 'OK'}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeExploreTab === 'usage' && (
            <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl space-y-4 animate-fadeIn">
              <span className="text-cyan-400 font-bold text-[10px] uppercase tracking-widest flex items-center gap-1"><Layers size={12} /> ESTADÍSTICAS AVANZADAS DE ITEMS</span>
              <div className="p-3 bg-zinc-900/40 border border-zinc-850 rounded text-center text-slate-400">
                Compilando mapa de calor de utilización de naves, licencias e insignias en los 4 clústeres principales...
              </div>
            </div>
          )}

          {activeExploreTab === 'discoveries' && (
            <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl space-y-3 animate-fadeIn">
              <span className="text-amber-500 font-bold text-[10px] uppercase tracking-widest flex items-center gap-1"><Trophy size={12} /> HISTORIAL DE PLANETAS Y ESTRELLAS DESCUBIERTAS</span>
              {discoveries.map(d => (
                <div key={d.id} className="p-2.5 bg-zinc-900 border border-zinc-850 rounded flex justify-between items-center">
                  <div>
                    <span className="text-white font-bold block">{d.star_name || 'PLANETA EXPLORADO'}</span>
                    <span className="text-[8.5px] text-yellow-500">Coordenadas: {d.sector_coordinates || 'PELA'}</span>
                  </div>
                  <span className="text-cyan-400 font-bold font-mono">{new Date(d.discovered_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DOMINACIÓN TERRITORIAL & SIMULADOR */}
      {activeTab === 'domination' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex gap-1 bg-black/40 p-1 rounded-lg border border-slate-850 select-none">
            {[
              { id: 'realtime', label: '🛰️ Realtime Monitor' },
              { id: 'simulator', label: '⚔️ Simulador de Activos' },
              { id: 'conquest', label: '🪐 Conquista de Sistemas' }
            ].map(sub => (
              <button key={sub.id} onClick={() => setActiveDomTab(sub.id as DominationSubTab)} className={`px-3 py-1.5 font-bold uppercase text-[9.5px] rounded cursor-pointer ${activeDomTab === sub.id ? 'bg-red-950/40 text-red-400 border border-red-900/40' : 'text-slate-500'}`}>{sub.label}</button>
            ))}
          </div>

          {activeDomTab === 'realtime' && (
            <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl space-y-4 animate-fadeIn">
              <span className="text-red-500 font-bold text-[10px] uppercase tracking-widest block">🛰️ MONITOR PVP REALTIME (EN ÓRBITA ACTIVA)</span>
              <div className="p-3 bg-red-950/10 border border-red-900/30 text-red-400 rounded-lg animate-pulse flex items-center justify-between">
                <span>Alerta: Colisión de flotas detectada en Inara Galaxy 6 (SC 3)</span>
                <span className="bg-red-600 text-white px-2 py-0.5 rounded font-black text-[9px]">LIVE CONFLICT</span>
              </div>
            </div>
          )}

          {/* SIMULADOR DE COMBATE */}
          {activeDomTab === 'simulator' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start animate-fadeIn">
              <div className="xl:col-span-2 bg-slate-950 p-5 border border-slate-850 rounded-xl space-y-5">
                <span className="text-cyan-400 font-bold text-[10px] uppercase tracking-widest flex items-center gap-1"><Swords size={12} /> MONITOR MILIMÉTRICO DE ACTIVOS</span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-900/30 p-4 rounded-xl border border-zinc-850">
                  {/* Atacante */}
                  <div className="space-y-3">
                    <span className="text-[10px] text-cyan-500 font-bold block uppercase border-b border-zinc-800 pb-1">Atacante (Player 1)</span>
                    <div>
                      <label className="text-[8.5px] text-zinc-500 block mb-1">Seleccionar Chasis / Módulo:</label>
                      <select className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded text-zinc-200 text-[11px] outline-none" value={p1AssetKey} onChange={e => setP1AssetKey(e.target.value)}>
                        {Object.entries(MOCK_ASSETS_DATABASE).map(([key, asset]) => (
                          <option key={key} value={key}>[{asset.type}] - {asset.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="text-[9px] text-zinc-400 italic bg-black/30 p-2 rounded border border-zinc-900/60">
                      <strong>Ficha:</strong> {MOCK_ASSETS_DATABASE[p1AssetKey].stats}<br/>
                      <strong className="text-purple-400">Habilidad:</strong> {MOCK_ASSETS_DATABASE[p1AssetKey].skills}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="text-[8.5px] text-zinc-500 block mb-1">CANTIDAD:</label><input type="number" className="w-full bg-zinc-950 border border-zinc-800 p-1.5 rounded text-white font-bold text-[11px]" value={p1Ships} onChange={e => setP1Ships(Number(e.target.value))} /></div>
                      <div><label className="text-[8.5px] text-zinc-500 block mb-1">NIVEL TECH:</label><input type="number" className="w-full bg-zinc-950 border border-zinc-800 p-1.5 rounded text-white font-bold text-[11px]" value={p1TechLvl} onChange={e => setP1TechLvl(Number(e.target.value))} /></div>
                    </div>
                  </div>

                  {/* Defensor */}
                  <div className="space-y-3">
                    <span className="text-[10px] text-rose-500 font-bold block uppercase border-b border-zinc-800 pb-1">Defensor (Player 2)</span>
                    <div>
                      <label className="text-[8.5px] text-zinc-500 block mb-1">Seleccionar Chasis / Módulo:</label>
                      <select className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded text-zinc-200 text-[11px] outline-none" value={p2AssetKey} onChange={e => setP2AssetKey(e.target.value)}>
                        {Object.entries(MOCK_ASSETS_DATABASE).map(([key, asset]) => (
                          <option key={key} value={key}>[{asset.type}] - {asset.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="text-[9px] text-zinc-400 italic bg-black/30 p-2 rounded border border-zinc-900/60">
                      <strong>Ficha:</strong> {MOCK_ASSETS_DATABASE[p2AssetKey].stats}<br/>
                      <strong className="text-purple-400">Habilidad:</strong> {MOCK_ASSETS_DATABASE[p2AssetKey].skills}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="text-[8.5px] text-zinc-500 block mb-1">CANTIDAD:</label><input type="number" className="w-full bg-zinc-950 border border-zinc-800 p-1.5 rounded text-white font-bold text-[11px]" value={p2Ships} onChange={e => setP2Ships(Number(e.target.value))} /></div>
                      <div><label className="text-[8.5px] text-zinc-500 block mb-1">NIVEL TECH:</label><input type="number" className="w-full bg-zinc-950 border border-zinc-800 p-1.5 rounded text-white font-bold text-[11px]" value={p2TechLvl} onChange={e => setP2TechLvl(Number(e.target.value))} /></div>
                    </div>
                  </div>
                </div>

                <button onClick={runMilimetricBattleSimulator} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black py-2.5 rounded uppercase text-[10px] transition-all cursor-pointer">Desplegar Inyección de Cálculo de Combate</button>

                {simResult && (
                  <div className="p-4 bg-zinc-900 border border-zinc-850 rounded-xl space-y-3 animate-fadeIn">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-[10.5px]">
                      <div className="bg-zinc-950 p-2 rounded border border-zinc-850"><span className="text-zinc-500 block text-[8px]">Probabilidad Victoria</span><strong className="text-cyan-400">{simResult.winRate}%</strong></div>
                      <div className="bg-zinc-950 p-2 rounded border border-zinc-850"><span className="text-zinc-500 block text-[8px]">Flota Activa P1</span><strong className="text-zinc-300">{simResult.survivorsP1} Chasis</strong></div>
                      <div className="bg-zinc-950 p-2 rounded border border-zinc-850"><span className="text-zinc-500 block text-[8px]">Flota Activa P2</span><strong className="text-zinc-300">{simResult.survivorsP2} Chasis</strong></div>
                      <div className="bg-zinc-950 p-2 rounded border border-zinc-850"><span className="text-zinc-500 block text-[8px]">Polvo / Metal Saqueado</span><strong className="text-emerald-400">{simResult.stolenMetal.toLocaleString()} Kg</strong></div>
                    </div>
                    <div className="bg-black p-2 rounded h-24 overflow-y-auto text-[9.5px] text-zinc-400 font-mono space-y-1">{combatLogs.map((log, i) => <div key={i}>{log}</div>)}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* LAYOUT CONQUEST */}
          {activeDomTab === 'conquest' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start animate-fadeIn">
              {/* Listado de Territorios Ocupados */}
              <div className="xl:col-span-2 bg-slate-950 p-5 border border-slate-850 rounded-xl space-y-4">
                <span className="text-red-400 font-bold text-[10px] uppercase tracking-widest block">// Red de Extracción y Planetas Conquistados</span>
                
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {dominatedPlanets.map((planet) => (
                    <div 
                      key={planet.id}
                      onClick={() => setSelectedDominatedPlanet(planet)}
                      className={`p-3 border rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-3 transition-all cursor-pointer ${
                        selectedDominatedPlanet?.id === planet.id 
                          ? 'bg-red-950/20 border-red-500/60 shadow-md shadow-red-950/40' 
                          : 'bg-zinc-900/40 border-zinc-850 hover:border-zinc-700'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-slate-200 flex items-center gap-2">
                          🪐 {planet.name} <span className="text-[9px] px-1.5 py-0.2 bg-zinc-800 text-zinc-400 rounded border border-zinc-700">{planet.sector}</span>
                        </div>
                        <div className="text-[9px] text-zinc-500 mt-1">
                          Tasa Tributaria: <span className="text-zinc-300 font-bold">{planet.taxRate}%</span> | Defensa: <span className="text-zinc-300 font-bold">{planet.garrison} Fragatas</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 justify-between sm:justify-end">
                        <div className="text-right">
                          <span className="text-[9px] block text-zinc-500 uppercase">Flujo Minado</span>
                          <span className="text-emerald-400 font-bold">+{planet.extractRate} DUST/h</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] block text-zinc-500 uppercase">Estabilidad</span>
                          <span className={`font-black ${planet.stability > 80 ? 'text-green-400' : planet.stability > 50 ? 'text-yellow-400' : 'text-red-500'}`}>
                            {planet.stability}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Inspector de Guarnición */}
              <div className="xl:col-span-1 bg-slate-950 p-5 border border-slate-850 rounded-xl space-y-4">
                <span className="text-cyan-400 font-bold text-[10px] uppercase tracking-widest block">// Inspector de Guarnición</span>
                
                {selectedDominatedPlanet ? (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="bg-zinc-900/60 border border-zinc-850 p-3 rounded-xl space-y-3">
                      <div className="text-sm font-bold text-white uppercase">{selectedDominatedPlanet.name}</div>
                      
                      <div className="h-px bg-zinc-800 w-full my-1"></div>

                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-zinc-500 flex items-center gap-1"><Shield size={12} /> Escudo de Plasma:</span>
                        <span className={`font-bold uppercase ${selectedDominatedPlanet.shieldActive ? 'text-emerald-400' : 'text-red-500'}`}>
                          {selectedDominatedPlanet.shieldActive ? 'Online' : 'Desactivado'}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-zinc-500 flex items-center gap-1"><Target size={12} /> Factor de Rebelión:</span>
                        <span className={`font-bold ${selectedDominatedPlanet.stability > 70 ? 'text-green-400' : 'text-red-400'}`}>
                          {selectedDominatedPlanet.stability < 70 ? 'Alto Riesgo' : 'Bajo Control'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <button className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-slate-300 font-bold py-2 rounded text-[9.5px] uppercase transition-all cursor-pointer">
                        🛡️ Reforzar Guarnición Táctica (+10 Fragatas)
                      </button>
                      <button className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-slate-300 font-bold py-2 rounded text-[9.5px] uppercase transition-all cursor-pointer">
                        ⚡ Modular Escudo Planetario Cuántico
                      </button>
                      <button className="w-full bg-red-950/40 hover:bg-red-950/60 border border-red-900/40 text-red-400 font-black py-2.5 rounded text-[9.5px] uppercase transition-all cursor-pointer">
                        🚨 Ejecutar Sanción Orbital (Sojuzgar Población)
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-40 border border-dashed border-zinc-850 rounded flex items-center justify-center text-zinc-600 italic">
                    Selecciona un vector planetario para inspeccionar
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CATÁLOGO DE EVENTOS */}
      {activeTab === 'events' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex gap-1 bg-black/40 p-1 rounded-lg border border-slate-850 select-none">
            {['creator', 'threats_only'].map(sub => (
              <button key={sub} onClick={() => setActiveEventTab(sub as EventSubTab)} className={`px-3 py-1.5 font-bold uppercase text-[9.5px] rounded cursor-pointer ${activeEventTab === sub ? 'bg-cyan-950/40 text-cyan-400 border border-cyan-900/40' : 'text-slate-500'}`}>{sub === 'creator' ? 'Gestor de Eventos' : 'Búnker de Sucesos Negativos'}</button>
            ))}
          </div>

          {activeEventTab === 'creator' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start animate-fadeIn">
              <div className="xl:col-span-1 bg-slate-950 p-4 border border-slate-850 rounded-xl space-y-4">
                <span className="text-cyan-400 font-bold text-[10px] uppercase tracking-widest block">🔮 REGISTRAR EVENTO DE EXPEDICIÓN</span>
                <div className="space-y-3 text-[11px]">
                  <input type="text" placeholder="Ej: Emboscada Mercenaria Alienígena..." className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded text-white font-bold text-[11px]" value={newEventName} onChange={e => setNewEventName(e.target.value)} />
                  <textarea placeholder="Descripción táctica..." className="w-full h-16 bg-zinc-900 border border-zinc-800 p-2 rounded text-white text-[11px]" value={newEventDesc} onChange={e => setNewEventDesc(e.target.value)} />
                  <button onClick={handleCreateEventAdvanced} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black py-2 rounded uppercase text-[10px] cursor-pointer">Inscribir Evento</button>
                </div>
              </div>

              <div className="xl:col-span-2 bg-slate-950 p-4 border border-slate-850 rounded-xl space-y-3">
                <span className="text-white font-bold text-[10px] uppercase tracking-widest block border-b border-slate-850 pb-2">📜 CATÁLOGO DE EVENTOS INSCRITOS</span>
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {eventsCatalog.length === 0 ? (
                    <div className="text-center text-slate-600 py-8">No hay eventos guardados en el catálogo.</div>
                  ) : (
                    eventsCatalog.map((ev) => (
                      <div key={ev.id} className="p-3 bg-zinc-900 border border-slate-800 rounded flex justify-between items-center text-[10px]">
                        <div>
                          <span className="font-bold text-white uppercase">{ev.name}</span>
                          <p className="text-slate-400 text-[9px]">{ev.description}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded font-bold uppercase ${ev.effect_type === 'negative' ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'}`}>
                          {ev.effect_type || 'NEUTRAL'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 🌌 TAB 4: GENERADOR DE GALAXIAS ── */}
      {activeTab === 'generator' && (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start animate-fadeIn">

          {/* PANEL DE CONTROL IZQUIERDO */}
          <div className="xl:col-span-1 space-y-4">
            <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl space-y-3 shadow-xl">
              <span className="text-cyan-400 font-bold text-[10px] uppercase tracking-widest block border-b border-zinc-900 pb-2 flex items-center gap-1"><Map size={12} /> INTERFAZ DE AUDITORÍA Y CONTROL (ESTRUCTURA)</span>
              <div><label className="text-[9px] text-zinc-500 block mb-0.5">1. Galaxy Cluster (GC):</label><select className="w-full bg-zinc-900 border border-zinc-800 p-1 rounded text-zinc-200 text-[11px]" value={selectedCluster} onChange={e => setSelectedCluster(e.target.value)}>{dbClusters.map(c => <option key={c.id} value={c.id}>{c.name} ({c.id})</option>)}</select></div>
              <div><label className="text-[9px] text-zinc-500 block mb-0.5">2. Galaxy (Número):</label><select className="w-full bg-zinc-900 border border-zinc-800 p-1 rounded text-zinc-200 text-[11px]" value={selectedGalaxy} onChange={e => setSelectedGalaxy(e.target.value)}><option value="">-- Selecciona Galaxia --</option>{galaxies.map(g => <option key={g.id} value={g.id}>Galaxy {g.galaxy_number}</option>)}</select></div>
              <div><label className="text-[9px] text-zinc-500 block mb-0.5">3. Star Cluster (SC):</label><select className="w-full bg-zinc-900 border border-zinc-800 p-1 rounded text-zinc-200 text-[11px]" value={selectedStarCluster} onChange={e => setSelectedStarCluster(e.target.value)}><option value="">-- Selecciona SC --</option>{starClusters.map(sc => <option key={sc.id} value={sc.id}>Star Cluster {sc.sc_number}</option>)}</select></div>
              <div><label className="text-[9px] text-zinc-500 block mb-0.5">4. Star System:</label><select className="w-full bg-zinc-900 border border-zinc-800 p-1 rounded text-zinc-200 text-[11px]" value={selectedStarSystem} onChange={e => setSelectedStarSystem(e.target.value)}><option value="">-- Selecciona Sistema --</option>{starSystems.map(sys => <option key={sys.id} value={sys.id}>{sys.name_code}</option>)}</select></div>
              <div><label className="text-[9px] text-zinc-500 block mb-0.5">5. Cuerpo Celeste (Planeta / Estrella):</label><select className="w-full bg-zinc-900 border border-zinc-800 p-1 rounded text-zinc-200 text-[11px]" value={selectedLocation} onChange={e => setSelectedLocation(e.target.value)}><option value="">-- Selecciona --</option>{locations.map(loc => <option key={loc.id} value={loc.id}>{loc.conditions?.body_type === 'estrella' ? '☀️' : '🪐'} Nº {loc.planet_star_number}</option>)}</select></div>
            </div>

            {/* TARJETAS VERTICALES DE PREVISUALIZACIÓN */}
            <div className="space-y-2.5">
              {activeClusterData && (
                <div className="bg-slate-950 p-3 border border-zinc-800 rounded-xl space-y-1.5 shadow-lg border-l-2 border-cyan-500 animate-fadeIn">
                  <span className="text-white font-bold text-[10px] block">🌌 GC: {activeClusterData.name} ({activeClusterData.id})</span>
                  <p className="text-[9px] text-zinc-400">Viaje Raíz: {activeClusterData.base_duration_minutes} min | Eventos: {activeClusterData.assigned_events?.length || 0}</p>
                  <div className="flex gap-2 justify-end text-[8.5px] font-black pt-1 border-t border-zinc-900/40"><button onClick={() => handleDeleteTier('seed_galaxy_clusters', activeClusterData.id, 'Galaxy Cluster')} className="text-red-400 hover:underline cursor-pointer">Eliminar</button></div>
                </div>
              )}
              {activeGalaxyData && (
                <div className="bg-slate-950 p-3 border border-zinc-800 rounded-xl space-y-1.5 shadow-md border-l-2 border-purple-500 animate-fadeIn">
                  <span className="text-white font-bold text-[10px] block">🌌 Galaxia Correlativa: {activeGalaxyData.galaxy_number}</span>
                  <p className="text-[9px] text-zinc-400">Sucesos activos: {activeGalaxyData.assigned_events?.length || 0}</p>
                  <div className="flex gap-2 justify-end text-[8.5px] font-black pt-1 border-t border-zinc-900/40"><button onClick={() => handleDeleteTier('seed_galaxies', activeGalaxyData.id, 'Galaxia')} className="text-red-400 hover:underline cursor-pointer">Eliminar</button></div>
                </div>
              )}
              {activeScData && (
                <div className="bg-slate-950 p-3 border border-zinc-800 rounded-xl space-y-1.5 shadow-md border-l-2 border-amber-500 animate-fadeIn">
                  <span className="text-white font-bold text-[10px] block">🌟 SC Número: {activeScData.sc_number}</span>
                  <p className="text-[9px] text-zinc-400">Sucesos activos: {activeScData.assigned_events?.length || 0}</p>
                  <div className="flex gap-2 justify-end text-[8.5px] font-black pt-1 border-t border-zinc-900/40"><button onClick={() => handleDeleteTier('seed_star_clusters', activeScData.id, 'Star Cluster')} className="text-red-400 hover:underline cursor-pointer">Eliminar</button></div>
                </div>
              )}
              {activeSystemData && (
                <div className="bg-slate-950 p-3 border border-zinc-800 rounded-xl space-y-1.5 shadow-md border-l-2 border-emerald-500 animate-fadeIn">
                  <span className="text-white font-bold text-[10px] block">🪐 Sistema Solar: {activeSystemData.name_code}</span>
                  <p className="text-[9px] text-zinc-400">Sucesos activos: {activeSystemData.assigned_events?.length || 0}</p>
                  <div className="flex gap-2 justify-end text-[8.5px] font-black pt-1 border-t border-zinc-900/40"><button onClick={() => handleDeleteTier('seed_star_systems', activeSystemData.id, 'Star System')} className="text-red-400 hover:underline cursor-pointer">Eliminar</button></div>
                </div>
              )}
              {activeLocationData && (
                <div className="bg-slate-950 p-3 border border-zinc-800 rounded-xl space-y-1.5 shadow-md border-l-2 border-fuchsia-500 animate-fadeIn">
                  <span className="text-white font-bold text-[10px] block">{activeLocationData.conditions?.body_type === 'estrella' ? '☀️ Estrella' : '🪐 Planeta'} Nº {activeLocationData.planet_star_number}</span>
                  <p className="text-[9px] text-zinc-400">Clase: {activeLocationData.conditions?.body_subtype} | Viaje: {activeLocationData.time_minutes} min</p>
                  <div className="flex gap-2 justify-end text-[8.5px] font-black pt-1 border-t border-zinc-900/40"><button onClick={() => handleDeleteTier('seed_locations', activeLocationData.id, 'Cuerpo Celeste')} className="text-red-400 hover:underline cursor-pointer">Eliminar</button></div>
                </div>
              )}
            </div>
          </div>

          {/* LADO DERECHO: CONSOLA DE TRABAJO MULTI-PESTÁÑICA */}
          <div className="xl:col-span-3 space-y-4">
            <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl space-y-4 shadow-2xl">

              <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                <span className="text-zinc-400 font-bold text-[10.5px] uppercase block tracking-wider">Consola de Creación y Mapeo</span>
                <div className="flex gap-1.5 bg-black/40 p-1 rounded-lg border border-zinc-850">
                  {[{ id: 'creation', label: 'Consola de Creación' }, { id: 'edition', label: 'Consola de Edición' }, { id: 'ami', label: 'Consola A.M.I.' }].map(tab => (
                    <button key={tab.id} onClick={() => setGenRightTab(tab.id as GenRightTab)} className={`px-3 py-1.5 font-bold uppercase text-[9px] rounded-md cursor-pointer transition-all ${genRightTab === tab.id ? 'bg-cyan-950/40 text-cyan-400 border border-cyan-900/30' : 'text-zinc-500'}`}>{tab.label}</button>
                  ))}
                </div>
              </div>

              {/* 1. CONSOLA DE CREACIÓN */}
              {genRightTab === 'creation' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                  {/* Tarjeta I: Cluster */}
                  <div className="bg-zinc-900/40 p-4 border border-zinc-850 rounded-xl flex flex-col justify-between space-y-3">
                    <span className="text-white font-bold text-[10px] block border-b border-zinc-800 pb-1">Crear Nuevo Galaxy Cluster</span>
                    <div className="space-y-1.5">
                      <input type="text" placeholder="ID (ej: PELA, GC1, GC2)" className="w-full bg-zinc-950 border border-zinc-800 p-1.5 rounded text-center text-white font-bold uppercase text-[11px]" value={newGcId} onChange={e => setNewGcId(e.target.value)} />
                      <input type="text" placeholder="Nombre Clúster (ej: Inara Alpha)" className="w-full bg-zinc-950 border border-zinc-800 p-1.5 rounded text-center text-white text-[11px]" value={newGcName} onChange={e => setNewGcName(e.target.value)} />
                      <div className="flex justify-between items-center bg-zinc-950 border border-zinc-800 px-2 py-1 rounded text-[11px]"><span className="text-zinc-500 text-[8px] uppercase">Minutos Viaje:</span><input type="number" className="w-20 bg-transparent text-emerald-400 font-bold text-center outline-none" value={newGcDuration} onChange={e => setNewGcDuration(Number(e.target.value))} /></div>
                    </div>
                    <div className="pt-2"><button onClick={handleCreateGalaxyCluster} className="w-full bg-cyan-600 text-white font-black py-1.5 rounded uppercase text-[10px] cursor-pointer">Fundar Clúster</button></div>
                  </div>

                  {/* Tarjeta II: Galaxia */}
                  <div className="bg-zinc-900/40 p-4 border border-zinc-850 rounded-xl flex flex-col justify-between space-y-3">
                    <span className="text-white font-bold text-[10px] block border-b border-zinc-800 pb-1">Crear Nueva Galaxia</span>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div><span className="text-zinc-500 block text-[8px] mb-0.5">NÚMERO INICIAL:</span><input type="number" className="w-full bg-zinc-950 border border-zinc-800 p-1 rounded text-center text-white font-bold text-[11px]" value={newGalaxyNum} onChange={e => setNewGalaxyNum(Number(e.target.value))} /></div>
                        <div><span className="text-cyan-400 block text-[8px] mb-0.5 font-bold">CANTIDAD A CREAR:</span><input type="number" min={1} className="w-full bg-zinc-950 border border-zinc-800 p-1 rounded text-center text-cyan-400 font-bold text-[11px]" value={createQtyGal} onChange={e => setCreateQtyGal(Number(e.target.value))} /></div>
                      </div>
                    </div>
                    <button onClick={handleCreateGalaxy} className="w-full bg-cyan-600 text-white font-black py-1.5 rounded uppercase text-[10px] cursor-pointer" disabled={!selectedCluster}>Crear Galaxia</button>
                  </div>

                  {/* Tarjeta III: SC */}
                  <div className="bg-zinc-900/40 p-4 border border-zinc-850 rounded-xl flex flex-col justify-between space-y-3">
                    <span className="text-white font-bold text-[10px] block border-b border-zinc-800 pb-1">Crear Nuevo Star Cluster</span>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div><span className="text-zinc-500 block text-[8px] mb-0.5">NÚMERO INICIAL:</span><input type="number" className="w-full bg-zinc-950 border border-zinc-800 p-1 rounded text-center text-white font-bold text-[11px]" value={newScNum} onChange={e => setNewScNum(Number(e.target.value))} /></div>
                        <div><span className="text-cyan-400 block text-[8px] mb-0.5 font-bold">CANTIDAD A CREAR:</span><input type="number" min={1} className="w-full bg-zinc-950 border border-zinc-800 p-1 rounded text-center text-cyan-400 font-bold text-[11px]" value={createQtySc} onChange={e => setCreateQtySc(Number(e.target.value))} /></div>
                      </div>
                    </div>
                    <button onClick={handleCreateStarCluster} className="w-full bg-cyan-600 text-white font-black py-1.5 rounded uppercase text-[10px] cursor-pointer" disabled={!selectedGalaxy}>Crear SC</button>
                  </div>

                  {/* Tarjeta IV: Star System */}
                  <div className="bg-zinc-900/40 p-4 border border-zinc-850 rounded-xl flex flex-col justify-between space-y-3">
                    <span className="text-white font-bold text-[10px] block border-b border-zinc-800 pb-1">Crear Nuevo Star System</span>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div><span className="text-zinc-500 block text-[8px] mb-0.5">CÓDIGO BASE SYSTEM:</span><input type="text" placeholder="ej: ASW 85" className="w-full bg-zinc-950 border border-zinc-800 p-1 rounded text-center text-white font-bold text-[11px]" value={newSystemCode} onChange={e => setNewSystemCode(e.target.value)} /></div>
                        <div><span className="text-cyan-400 block text-[8px] mb-0.5 font-bold">CANTIDAD A CREAR:</span><input type="number" min={1} className="w-full bg-zinc-950 border border-zinc-800 p-1 rounded text-center text-cyan-400 font-bold text-[11px]" value={createQtySys} onChange={e => setCreateQtySys(Number(e.target.value))} /></div>
                      </div>
                    </div>
                    <button onClick={handleCreateStarSystem} className="w-full bg-cyan-600 text-white font-black py-1.5 rounded uppercase text-[10px] cursor-pointer" disabled={!selectedStarCluster}>Crear Sistema</button>
                  </div>

                  {/* Tarjeta V: Planeta o Estrella */}
                  <div className="bg-zinc-900/40 p-4 border border-zinc-850 rounded-xl flex flex-col justify-between space-y-3 md:col-span-2">
                    <span className="text-white font-bold text-[10px] block border-b border-zinc-800 pb-1">Crear Planeta o Estrella</span>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-[11px]">
                      <div><span className="text-zinc-500 block text-[8px] mb-1 font-bold">OBJETO:</span><select className="w-full bg-zinc-950 border border-zinc-800 p-1.5 rounded text-zinc-300 outline-none text-[11px]" value={bodyType} onChange={e => setBodyType(e.target.value as 'planeta' | 'estrella')}><option value="planeta">🪐 Planeta</option><option value="estrella">☀️ Estrella</option></select></div>
                      <div><span className="text-zinc-500 block text-[8px] mb-1 font-bold">TIPO CANÓNICO:</span>{bodyType === 'planeta' ? (<select className="w-full bg-zinc-950 border border-zinc-800 p-1.5 rounded text-zinc-300 outline-none text-[11px]" value={planetSubtype} onChange={e => setPlanetType(e.target.value)}><option value="rocoso">🪨 Rocoso</option><option value="vida">🌱 Vida</option><option value="agua">💧 Agua</option></select>) : (<select className="w-full bg-zinc-950 border border-zinc-800 p-1.5 rounded text-zinc-300 outline-none text-[11px]" value={starSubtype} onChange={e => setStarType(e.target.value)}><option value="blancas">⚪ Blancas</option><option value="amarillas">🟡 Amarillas</option></select>)}</div>
                      <div><span className="text-zinc-500 block text-[8px] mb-1 font-bold">NÚMERO INDEX:</span><input type="number" min={1} className="w-full bg-zinc-950 border border-zinc-800 p-1.5 rounded text-center text-white font-bold text-[11px]" value={newLocNum} onChange={e => setNewLocNum(Number(e.target.value))} /></div>
                      <div><span className="text-cyan-400 block text-[8px] mb-1 font-bold">CANTIDAD A CREAR:</span><input type="number" min={1} className="w-full bg-zinc-950 border border-zinc-800 p-1.5 rounded text-center text-cyan-400 font-bold text-[11px]" value={createQtyLoc} onChange={e => setCreateQtyLoc(Number(e.target.value))} /></div>
                    </div>
                    <button onClick={handleCreateLocation} className="w-full bg-cyan-600 text-white font-black py-1.5 rounded uppercase text-[10px] mt-2 cursor-pointer" disabled={!selectedStarSystem}>Vincular Elemento al Sistema (Hereda tiempo base GC)</button>
                  </div>
                </div>
              )}

              {/* 2. CONSOLA DE EDICIÓN */}
              {genRightTab === 'edition' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                  {/* Tarjeta I: Edita Galaxy Cluster */}
                  <div className="bg-zinc-900/40 p-4 border border-zinc-850 rounded-xl space-y-3 flex flex-col justify-between shadow-md border-t border-amber-500/20">
                    <span className="text-white font-bold text-[10px] block border-b border-zinc-850 pb-1 text-amber-400">Edita Galaxy Cluster</span>
                    <div className="space-y-2 text-[11px]">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2"><span className="text-zinc-500 block text-[8px]">NOMBRE CLÚSTER:</span><input type="text" className="w-full bg-zinc-950 border border-zinc-800 p-1 rounded text-white" value={editClusterName} onChange={e => setEditClusterName(e.target.value)} /></div>
                        <div><span className="text-zinc-500 block text-[8px]">VIAJE BASE:</span><input type="number" className="w-full bg-zinc-950 border border-zinc-800 p-1 rounded text-emerald-400 font-bold" value={editClusterDuration} onChange={e => setEditClusterDuration(Number(e.target.value))} /></div>
                      </div>

                      <div className="bg-zinc-950 p-2 rounded border border-zinc-850 space-y-2">
                        <span className="text-purple-400 block text-[8.5px] font-bold">🔮 SUCESOS DEL CLÚSTER ({activeClusterData?.assigned_events?.length || 0})</span>
                        <div className="grid grid-cols-3 gap-1">
                          <select className="col-span-2 bg-zinc-900 border border-zinc-800 p-1 text-[10px] outline-none text-zinc-300" value={cardEventBindCluster} onChange={e => setCardEventBindCluster(e.target.value)}>
                            <option value="">-- Mapear Suceso --</option>
                            {eventsCatalog.map(ev => <option key={ev.id} value={ev.name}>{ev.name}</option>)}
                          </select>
                          <div className="flex bg-zinc-900 border border-zinc-800 p-0.5 rounded items-center"><span className="text-[7px] text-zinc-500 px-0.5">% Spawn:</span><input type="number" min={1} max={100} className="w-full bg-transparent text-center font-bold text-amber-400 text-[10px] outline-none" value={cardEventRateCluster} onChange={e => setCardEventRateCluster(Number(e.target.value))} /></div>
                        </div>
                        <button onClick={() => handleUpdateClusterInline('add', cardEventBindCluster)} className="w-full bg-purple-600 text-white py-1 rounded text-[9px] uppercase font-black cursor-pointer">Añadir Suceso</button>
                      </div>

                      <div className="bg-zinc-950 p-2 rounded border border-zinc-850 space-y-1.5">
                        <span className="text-cyan-400 text-[8.5px] font-bold block">🎯 PORCENTAJE DE AFECTACIÓN EN EL UNIVERSO:</span>
                        <div className="flex flex-wrap gap-1">
                          {[100, 75, 50, 25, 5].map(pct => (
                            <button key={pct} onClick={() => setEditPctCluster(pct)} className={`px-1.5 py-0.5 border text-[9px] rounded font-bold cursor-pointer ${editPctCluster === pct ? 'bg-cyan-950 text-cyan-400 border-cyan-800' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}>{pct}%</button>
                          ))}
                          <input type="number" min={1} max={100} className="w-14 bg-zinc-900 border border-zinc-800 text-center font-bold text-cyan-400 text-[10px] rounded outline-none ml-auto" value={editPctCluster} onChange={e => setEditPctCluster(Number(e.target.value))} />
                        </div>
                      </div>
                    </div>
                    <button onClick={() => handleUpdateClusterInline('add')} className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white font-black py-1.5 rounded uppercase text-[10px] cursor-pointer">Actualizar Clúster por %</button>
                  </div>

                  {/* Tarjeta II: Edita Galaxy */}
                  <div className="bg-zinc-900/40 p-4 border border-zinc-850 rounded-xl space-y-3 flex flex-col justify-between shadow-md">
                    <span className="text-white font-bold text-[10px] block border-b border-zinc-850 pb-1 text-amber-400">Edita Galaxy</span>
                    <div className="space-y-2 text-[11px]">
                      <div><span className="text-zinc-500 block text-[8px]">NÚMERO GALAXIA:</span><input type="number" className="w-full bg-zinc-950 border border-zinc-800 p-1 rounded text-white" value={editGalaxyNum} onChange={e => setEditGalaxyNum(Number(e.target.value))} /></div>

                      <div className="bg-zinc-950 p-2 rounded border border-zinc-850 space-y-2">
                        <span className="text-purple-400 block text-[8.5px] font-bold">🔮 SUCESOS DE LA GALAXIA ({activeGalaxyData?.assigned_events?.length || 0})</span>
                        <div className="grid grid-cols-3 gap-1">
                          <select className="col-span-2 bg-zinc-900 border border-zinc-800 p-1 text-[10px] outline-none text-zinc-300" value={cardEventBindGal} onChange={e => setCardEventBindGal(e.target.value)}>
                            <option value="">-- Mapear Suceso --</option>
                            {eventsCatalog.map(ev => <option key={ev.id} value={ev.name}>{ev.name}</option>)}
                          </select>
                          <div className="flex bg-zinc-900 border border-zinc-800 p-0.5 rounded items-center"><span className="text-[7px] text-zinc-500 px-0.5">% Spawn:</span><input type="number" min={1} max={100} className="w-full bg-transparent text-center font-bold text-amber-400 text-[10px] outline-none" value={cardEventRateGal} onChange={e => setCardEventRateGal(Number(e.target.value))} /></div>
                        </div>
                        <button onClick={() => handleUpdateGalaxyInline('add', cardEventBindGal)} className="w-full bg-purple-600 text-white py-1 rounded text-[9px] uppercase font-black cursor-pointer">Añadir Suceso</button>
                      </div>

                      <div className="bg-zinc-950 p-2 rounded border border-zinc-850 space-y-1.5">
                        <span className="text-cyan-400 text-[8.5px] font-bold block">🎯 PORCENTAJE DE AFECTACIÓN EN EL CLÚSTER:</span>
                        <div className="flex flex-wrap gap-1">
                          {[100, 75, 50, 25, 5].map(pct => (
                            <button key={pct} onClick={() => setEditPctGal(pct)} className={`px-1.5 py-0.5 border text-[9px] rounded font-bold cursor-pointer ${editPctGal === pct ? 'bg-cyan-950 text-cyan-400 border-cyan-800' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}>{pct}%</button>
                          ))}
                          <input type="number" min={1} max={100} className="w-14 bg-zinc-900 border border-zinc-800 text-center font-bold text-cyan-400 text-[10px] rounded outline-none ml-auto" value={editPctGal} onChange={e => setEditPctGal(Number(e.target.value))} />
                        </div>
                      </div>
                    </div>
                    <button onClick={() => handleUpdateGalaxyInline('add')} className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white font-black py-1.5 rounded uppercase text-[10px] cursor-pointer" disabled={!selectedCluster}>Actualizar Galaxia por %</button>
                  </div>
                </div>
              )}

              {/* 3. WORKSPACE: CONSOLA A.M.I. */}
              {genRightTab === 'ami' && (
                <div className="space-y-4 animate-fadeIn select-none">
                  <div className="space-y-1">
                    <span className="text-[9px] text-zinc-500 font-bold uppercase block tracking-wider">🃏 Álbum de Galaxy Clusters (GCs)</span>
                    <div className="flex gap-2.5 overflow-x-auto pb-2 pt-1 scrollbar-thin">{dbClusters.map(c => (<div key={c.id} onClick={() => setSelectedCluster(c.id)} className={`min-w-[160px] p-2.5 border rounded-xl cursor-pointer text-center transition-all ${selectedCluster === c.id ? 'bg-cyan-950/30 border-cyan-500/60 shadow-md shadow-cyan-950/20' : 'bg-zinc-900/60 border-zinc-850 text-zinc-400'}`}><span className="font-bold text-white block text-[10.5px]">🌌 {c.name}</span><span className="text-[8.5px] block font-mono mt-0.5">ID: {c.id} • {c.base_duration_minutes} min</span></div>))}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* POPUP MODAL EDICIÓN MAESTRA */}
      {editingEntity && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-950 border border-cyan-500/60 rounded-2xl p-5 space-y-4 shadow-2xl font-mono text-left">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <span className="text-cyan-400 font-bold text-xs uppercase flex items-center gap-1.5">
                <Edit3 size={14} /> Editar Entidad [{editingEntity.type.toUpperCase()}]
              </span>
              <button onClick={() => setEditingEntity(null)} className="text-zinc-500 hover:text-white cursor-pointer"><X size={16} /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[9px] text-zinc-400 block mb-1">Nombre / Identificador:</label>
                <input type="text" className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded text-white font-bold text-xs outline-none" value={modalInputName} onChange={e => setModalInputName(e.target.value)} />
              </div>

              {(editingEntity.type === 'cluster' || editingEntity.type === 'planet') && (
                <div>
                  <label className="text-[9px] text-zinc-400 block mb-1">Tiempo Base de Viaje (Minutos):</label>
                  <input type="number" className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded text-emerald-400 font-bold text-xs outline-none" value={modalInputTime} onChange={e => setModalInputDuration(Number(e.target.value))} />
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button onClick={() => setEditingEntity(null)} className="px-3 py-1.5 bg-zinc-900 text-zinc-400 rounded text-[10px] font-bold uppercase cursor-pointer">Cancelar</button>
              <button onClick={handleSaveModalEdits} className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-[10px] font-black uppercase cursor-pointer">Guardar Cambios</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ExpeditionsManager;