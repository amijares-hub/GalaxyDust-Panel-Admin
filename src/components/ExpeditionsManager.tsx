import React, { useEffect, useState, useMemo } from 'react';
import { getSupabaseClient } from '../lib/supabase';
import {
  Compass, ShieldAlert, Map as MapIcon, Plus, Trash2, Zap, Play, Search,
  TrendingUp, Award, Clock, RefreshCw, Eye, Trophy, Skull, Users, Layers,
  Gift, Flame, Info, Crosshair, Edit3, Save, Layers3, LayoutGrid, Activity, X, AlertTriangle, Check,
  Radio, MapPin, Box, Wrench, Bot, FileText, Package, Rocket, Cpu, Building, ChevronLeft, ChevronRight, Sliders, Database, Sparkles, PackageOpen, RotateCcw, AlertOctagon, Network, Loader
} from 'lucide-react';

type TabId = 'exploration' | 'events' | 'generator';
type ExploreSubTab = 'monitor' | 'losses' | 'discoveries';
type EventSubTab = 'creator' | 'threats_only';
type GenRightTab = 'creation' | 'edition' | 'ami';

type GenEntityType = 'GC' | 'GALAXY' | 'SC' | 'SS' | 'PLANET';

interface DetailedLossLog {
  id: string;
  expedition_id: string;
  user_id: string;
  username: string;
  asset_name: string;
  status_type: 'DESTRUIDO' | 'PERDIDO';
  coordinates_loss: string;
  coordinates_salvage?: string;
  encounter_type: string;
  timestamp: string;
  damage_sustained?: number;
}

interface CreationHistoryAction {
  description: string;
  batches: { table: string; altTable?: string; ids: string[] }[];
  timestamp: string;
}

// ─── TIER DE DISTRIBUCIÓN PORCENTUAL DE PLANETAS ───
interface DistributionTier {
  percentage: number; // Ej: 60 (%)
  planetsPerSS: number; // Ej: 3 planetas por Star System
}

export const ExpeditionsManager: React.FC = () => {
  const supabase = getSupabaseClient();
  const [activeTab, setActiveTab] = useState<TabId>('exploration');
  const [loading, setLoading] = useState<boolean>(true);

  // Sub-Navegación Interna
  const [activeExploreTab, setActiveExploreTab] = useState<ExploreSubTab>('monitor');
  const [activeEventTab, setActiveEventTab] = useState<EventSubTab>('creator');

  // Datos en vivo
  const [activeExpeditions, setActiveExpeditions] = useState<any[]>([]);
  const [historicalLogs, setHistoricalLogs] = useState<any[]>([]);
  const [detailedLosses, setDetailedLosses] = useState<DetailedLossLog[]>([]);
  const [totalHistoricalExpeditionsCount, setTotalHistoricalExpeditionsCount] = useState<number>(0);
  const [discoveries, setDiscoveries] = useState<any[]>([]);
  const [eventsCatalog, setEventsCatalog] = useState<any[]>([]);
  const [seedCatalog, setSeedCatalog] = useState<{ id: string; name: string; type: string }[]>([]);
  const [now, setNow] = useState<number>(Date.now());

  // ─── 🌌 ESTADOS DEL GENERADOR DE GALAXIAS ───
  const [genConsoleMode, setGenConsoleMode] = useState<'creation' | 'edition' | 'autogen'>('creation');
  const [selectedEntityType, setSelectedEntityType] = useState<GenEntityType>('GC');

  // Coordenadas y Catálogos para Jerarquías
  const [dbClusters, setDbClusters] = useState<any[]>([]);
  const [dbGalaxies, setDbGalaxies] = useState<any[]>([]);
  const [dbStarClusters, setDbStarClusters] = useState<any[]>([]);
  const [dbStarSystems, setDbStarSystems] = useState<any[]>([]);
  const [dbLocations, setLocations] = useState<any[]>([]);

  // Selección de Padres para Creación/Edición
  const [parentGcId, setParentGcId] = useState<string>('');
  const [parentGalaxyId, setParentGalaxyId] = useState<string>('');
  const [parentScId, setParentScId] = useState<string>('');
  const [parentSystemId, setParentSystemId] = useState<string>('');

  // Historial de Undo (Ctrl + Z)
  const [creationHistoryStack, setCreationHistoryStack] = useState<CreationHistoryAction[]>([]);

  // Formulario Creación de GC (Soporta borrar sin forzar '0')
  const [newGcId, setNewGcId] = useState<string>('');
  const [newGcName, setNewGcName] = useState<string>('');
  const [newGcDuration, setNewGcDuration] = useState<number | ''>(60);
  const [newGcMinMetal, setNewGcMinMetal] = useState<number | ''>(5000);
  const [newGcMaxMetal, setNewGcMaxMetal] = useState<number | ''>(25000);
  const [newGcMinCrystal, setNewGcMinCrystal] = useState<number | ''>(2000);
  const [newGcMaxCrystal, setNewGcMaxCrystal] = useState<number | ''>(12000);
  const [gcEventsList, setGcEventsList] = useState<{ name: string; spawn_rate: number }[]>([]);
  const [newGcLootList, setNewGcLootList] = useState<{ asset_id: string; asset_name: string; type: string; qty: number }[]>([]);
  const [bindEventName, setBindEventName] = useState<string>('');
  const [bindEventRate, setBindEventRate] = useState<number | ''>(5);
  
  // Búsqueda y Selección de Assets
  const [bindLootId, setBindLootId] = useState<string>('');
  const [bindLootQty, setBindLootQty] = useState<number | ''>(100);
  const [lootSearchTermNew, setLootSearchTermNew] = useState<string>('');
  const [showLootSuggestionsNew, setShowLootSuggestionsNew] = useState<boolean>(false);

  const [lootSearchTermEdit, setLootSearchTermEdit] = useState<string>('');
  const [showLootSuggestionsEdit, setShowLootSuggestionsEdit] = useState<boolean>(false);

  // Formulario Creación de Hijos Paso a Paso
  const [childCodeOrNumber, setChildCodeOrNumber] = useState<string>('1');
  const [bulkQty, setBulkQty] = useState<number | ''>(1);
  const [enableManualOverride, setEnableOverride] = useState<boolean>(false);
  const [overrideDuration, setOverrideDuration] = useState<number | ''>(60);
  const [overrideMinMetal, setOverrideMinMetal] = useState<number | ''>(5000);
  const [overrideMaxMetal, setOverrideMaxMetal] = useState<number | ''>(25000);
  const [overrideMinCrystal, setOverrideMinCrystal] = useState<number | ''>(2000);
  const [overrideMaxCrystal, setOverrideMaxCrystal] = useState<number | ''>(12000);

  // ─── 📊 ESTADOS DE DISTRIBUCIÓN PORCENTUAL DE PLANETAS EN STAR CLUSTER ───
  const [planetGenMode, setPlanetGenMode] = useState<'single_ss' | 'distribution_sc'>('distribution_sc');
  const [distributionTiers, setDistributionTiers] = useState<DistributionTier[]>([
    { percentage: 60, planetsPerSS: 3 },
    { percentage: 40, planetsPerSS: 6 },
  ]);

  // ESTADOS DEL AUTO-GENERADOR (CASCADA)
  const [autoQtyGal, setAutoQtyGal] = useState<number | ''>(2);
  const [autoQtySc, setAutoQtySc] = useState<number | ''>(5);
  const [autoQtySys, setAutoQtySys] = useState<number | ''>(10);
  const [autoQtyPlanet, setAutoQtyPlanet] = useState<number | ''>(5);

  // Tipos de Planeta
  const [bodyType, setBodyType] = useState<'planeta' | 'estrella'>('planeta');
  const [planetSubtype, setPlanetType] = useState<string>('rocoso');
  const [starSubtype, setStarType] = useState<string>('blancas');

  // Indice de Carrusel GC
  const [carouselIndex, setCarouselIndex] = useState<number>(0);

  // Estados de Edición
  const [editSelectedEntityId, setEditSelectedEntityId] = useState<string>('');
  const [editName, setEditName] = useState<string>('');
  const [editDuration, setEditDuration] = useState<number | ''>(60);
  const [editMinMetal, setEditMinMetal] = useState<number | ''>(5000);
  const [editMaxMetal, setEditMaxMetal] = useState<number | ''>(25000);
  const [editMinCrystal, setEditMinCrystal] = useState<number | ''>(2000);
  const [editMaxCrystal, setEditMaxCrystal] = useState<number | ''>(12000);
  const [editEventsList, setEditEventsList] = useState<{ name: string; spawn_rate: number }[]>([]);
  const [editGcLootList, setEditGcLootList] = useState<{ asset_id: string; asset_name: string; type: string; qty: number }[]>([]);

  // ─── 🚀 ESTADOS DE SELECCIÓN MÚLTIPLE (BULK DELETE) EN MODO EDICIÓN ───
  const [isBulkModeEdit, setIsBulkModeEdit] = useState<boolean>(false);
  const [selectedBulkIdsEdit, setSelectedBulkIdsEdit] = useState<string[]>([]);
  const [searchTermEditGrid, setSearchTermEditGrid] = useState<string>('');

  // Gestor de Eventos
  const [newEventName, setNewEventName] = useState<string>('');
  const [newEventDesc, setNewEventDesc] = useState<string>('');
  const [newEventEffect, setNewEventEffect] = useState<string>('negative');
  const [newEventTarget, setNewEventTarget] = useState<string>('fleet');
  const [newSpawnRate, setNewSpawnRate] = useState<number | ''>(5);
  const [selectedTriggerSkill, setSelectedTriggerSkill] = useState<string>('');
  const [skillImpactFormula, setSkillImpactFormula] = useState<string>('');
  const [spawnRegion, setSpawnRegion] = useState<string>('');
  const [specialCondition, setSpecialCondition] = useState<string>('');
  const [rewardAssetType, setRewardAssetType] = useState<string>('gd_balance');
  const [rewardAssetQty, setRewardAssetQty] = useState<number | ''>(500);

  // ─── FILTROS PREDICTORES ───
  const filteredSeedsNew = useMemo(() => {
    if (!lootSearchTermNew.trim()) return seedCatalog;
    const term = lootSearchTermNew.toLowerCase();
    return seedCatalog.filter(s => 
      s.name.toLowerCase().includes(term) || 
      s.id.toLowerCase().includes(term) || 
      s.type.toLowerCase().includes(term)
    );
  }, [seedCatalog, lootSearchTermNew]);

  const filteredSeedsEdit = useMemo(() => {
    if (!lootSearchTermEdit.trim()) return seedCatalog;
    const term = lootSearchTermEdit.toLowerCase();
    return seedCatalog.filter(s => 
      s.name.toLowerCase().includes(term) || 
      s.id.toLowerCase().includes(term) || 
      s.type.toLowerCase().includes(term)
    );
  }, [seedCatalog, lootSearchTermEdit]);

  // ─── LISTA DINÁMICA DE ENTIDADES DE EDICIÓN PARA SELECCIÓN MÚLTIPLE ───
  const currentEditionEntitiesList = useMemo(() => {
    if (selectedEntityType === 'GC') {
      return dbClusters.map(c => ({ id: String(c.id), name: c.name || c.id }));
    } else if (selectedEntityType === 'GALAXY') {
      return dbGalaxies.map(g => ({ id: String(g.id), name: `Galaxy ${g.galaxy_number}` }));
    } else if (selectedEntityType === 'SC') {
      return dbStarClusters.map(sc => ({ id: String(sc.id), name: `Star Cluster ${sc.sc_number}` }));
    } else if (selectedEntityType === 'SS') {
      return dbStarSystems.map(sys => ({ id: String(sys.id), name: sys.name_code || `SYS-${sys.id}` }));
    } else if (selectedEntityType === 'PLANET') {
      return dbLocations.map(loc => ({ id: String(loc.id), name: `Elemento Nº ${loc.planet_star_number}` }));
    }
    return [];
  }, [selectedEntityType, dbClusters, dbGalaxies, dbStarClusters, dbStarSystems, dbLocations]);

  const filteredEditionEntities = useMemo(() => {
    if (!searchTermEditGrid.trim()) return currentEditionEntitiesList;
    const term = searchTermEditGrid.toLowerCase();
    return currentEditionEntitiesList.filter(e => 
      e.name.toLowerCase().includes(term) || 
      e.id.toLowerCase().includes(term)
    );
  }, [currentEditionEntitiesList, searchTermEditGrid]);

  const isAllEditionSelected = useMemo(() => {
    return filteredEditionEntities.length > 0 && filteredEditionEntities.every(e => selectedBulkIdsEdit.includes(e.id));
  }, [filteredEditionEntities, selectedBulkIdsEdit]);

  const handleToggleSelectAllEdition = () => {
    if (isAllEditionSelected) {
      setSelectedBulkIdsEdit([]);
    } else {
      setSelectedBulkIdsEdit(filteredEditionEntities.map(e => e.id));
    }
  };

  const handleToggleIndividualEdition = (id: string) => {
    setSelectedBulkIdsEdit(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Resetear selección múltiple cuando cambia la entidad o el padre
  useEffect(() => {
    setSelectedBulkIdsEdit([]);
  }, [selectedEntityType, parentGcId, parentGalaxyId, parentScId, parentSystemId]);

  // ─── DERIVACIONES SEGURAS DEL GALAXY CLUSTER PADRE ───
  const activeClusterData = useMemo(() => {
    return dbClusters.find(c => String(c.id) === String(parentGcId)) || dbClusters[0] || null;
  }, [dbClusters, parentGcId]);

  // Sincronizar automáticamente los inputs de override con los datos heredados del GC activo
  useEffect(() => {
    if (activeClusterData) {
      setOverrideDuration(activeClusterData.base_duration_minutes ?? 60);
      setOverrideMinMetal(activeClusterData.base_metal_min ?? 5000);
      setOverrideMaxMetal(activeClusterData.base_metal_max ?? 25000);
      setOverrideMinCrystal(activeClusterData.base_crystal_min ?? 2000);
      setOverrideMaxCrystal(activeClusterData.base_crystal_max ?? 12000);
    }
  }, [activeClusterData]);

  // Reloj en vivo
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Escucha de teclado para Ctrl + Z
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (activeTab === 'generator' && (genConsoleMode === 'creation' || genConsoleMode === 'autogen')) {
          e.preventDefault();
          handleUndoLastCreation();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, genConsoleMode, creationHistoryStack]);

  // Auto-sugerencia del siguiente número correlativo al cambiar de tipo de entidad
  useEffect(() => {
    if (genConsoleMode !== 'creation') return;

    if (selectedEntityType === 'GALAXY') {
      const existingNums = dbGalaxies.map(g => Number(g.galaxy_number)).filter(n => !isNaN(n));
      const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 1;
      setChildCodeOrNumber(String(nextNum));
    } else if (selectedEntityType === 'SC') {
      const existingNums = dbStarClusters.map(sc => Number(sc.sc_number)).filter(n => !isNaN(n));
      const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 1;
      setChildCodeOrNumber(String(nextNum));
    } else if (selectedEntityType === 'SS') {
      const existingCodes = dbStarSystems.map(sys => String(sys.name_code || ''));
      let nextNum = existingCodes.length + 1;
      setChildCodeOrNumber(`SYS-${nextNum}`);
    } else if (selectedEntityType === 'PLANET') {
      const existingNums = dbLocations.map(l => Number(l.planet_star_number)).filter(n => !isNaN(n));
      const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 1;
      setChildCodeOrNumber(String(nextNum));
    }
  }, [selectedEntityType, genConsoleMode, parentGcId, parentGalaxyId, parentScId, parentSystemId, dbGalaxies, dbStarClusters, dbStarSystems, dbLocations]);

  // Eventos de 24h
  const dailyEventsCount = useMemo(() => {
    const twentyFourHoursAgo = now - 24 * 3600 * 1000;
    return historicalLogs.filter(log => {
      const logTime = new Date(log.created_at || log.timestamp).getTime();
      return logTime >= twentyFourHoursAgo;
    }).length;
  }, [historicalLogs, now]);

  // DESCARGA TOTALMENTE REAL DESDE SUPABASE
  const fetchTelemetryAndCatalogs = async () => {
    if (!supabase) return;
    try {
      setLoading(true);

      const profilesMap = new Map<string, string>();
      try {
        const { data: profiles } = await supabase.from('user_profiles').select('*');
        (profiles || []).forEach((p: any) => {
          const uid = p.id || p.user_id;
          if (uid) profilesMap.set(String(uid), p.username || p.display_name || 'Comandante');
        });
      } catch (errProf) {}

      // Expediciones
      let expData: any[] = [];
      try {
        const { data: expRes1, error: err1 } = await supabase.from('active_expeditions').select('*');
        if (!err1 && expRes1) {
          expData = expRes1;
        } else {
          const { data: expRes2 } = await supabase.from('expeditions_active').select('*');
          if (expRes2) expData = expRes2;
        }
      } catch (eExp) {}

      const flyingFleets = (expData || []).filter((e: any) => {
        const st = String(e.status || '').toUpperCase();
        if (st === 'CLAIMED' || st === 'COMPLETED' || st === 'FINISHED' || st === 'CANCELLED') return false;
        if (e.estimated_return_time) {
          const retTime = new Date(e.estimated_return_time).getTime();
          if (retTime > now) return true;
        }
        return st === 'LAUNCHED' || st === 'ACTIVE' || st === 'IN_TRANSIT' || st === 'EXPLORING' || st === 'MINING';
      }).map((e: any) => ({
        ...e,
        username: profilesMap.get(String(e.user_id)) || `Piloto [${String(e.user_id || '').substring(0, 8)}]`
      }));

      setActiveExpeditions(flyingFleets);

      // Conteo histórico
      try {
        const { count: historyCount } = await supabase.from('expedition_history').select('*', { count: 'exact', head: true });
        const completedInActive = (expData || []).filter((e: any) => {
          const st = String(e.status || '').toUpperCase();
          return st === 'CLAIMED' || st === 'COMPLETED' || st === 'SUCCESS';
        }).length;
        setTotalHistoricalExpeditionsCount((historyCount || 0) + completedInActive);
      } catch (hErr) {
        setTotalHistoricalExpeditionsCount((expData || []).length);
      }

      // Histórico Logs
      let safeLogs: any[] = [];
      try {
        const { data: logsData } = await supabase.from('expedition_logs').select('*').order('created_at', { ascending: false });
        safeLogs = logsData || [];
      } catch (lErr) {}
      setHistoricalLogs(safeLogs);

      // Pérdidas y Enclaves
      const losses: DetailedLossLog[] = safeLogs.map((log: any, idx: number) => {
        const statusType: 'DESTRUIDO' | 'PERDIDO' = (log.damage_sustained > 5000 || String(log.title || '').includes('Destrucción')) ? 'DESTRUIDO' : 'PERDIDO';
        const cluster = log.galaxy_cluster || log.cluster_id || 'SECTOR';
        const sector = log.sector_name || log.location_name || 'DESCONOCIDO';
        const coords = `${cluster}:${sector}`;

        return {
          id: log.id || `loss-${idx}-${Date.now()}`,
          expedition_id: log.expedition_id || 'N/A',
          user_id: log.user_id || 'N/A',
          username: profilesMap.get(String(log.user_id)) || 'Comandante',
          asset_name: log.title || 'Nave de Batalla',
          status_type: statusType,
          coordinates_loss: coords,
          coordinates_salvage: statusType === 'PERDIDO' ? `${coords}:SYS-${Math.floor(Math.random()*89)+10}` : undefined,
          encounter_type: log.event_type || 'Emboscada Pirata en Misión',
          timestamp: log.created_at || new Date().toISOString(),
          damage_sustained: log.damage_sustained
        };
      });

      setDetailedLosses(losses);

      // Carga individual segura para descubrimientos, eventos y clusters
      try {
        const { data: discData } = await supabase.from('user_discovered_stars').select('*').order('discovered_at', { ascending: false });
        if (discData) setDiscoveries(discData);
      } catch (e) {}

      try {
        const { data: evData } = await supabase.from('expedition_events_catalog').select('*').order('created_at', { ascending: false });
        if (evData) setEventsCatalog(evData);
      } catch (e) {}

      let clustersData: any[] = [];
      try {
        const { data: gcData, error: gcErr } = await supabase.from('seed_galaxy_clusters').select('*').order('name', { ascending: true });
        if (!gcErr && gcData && gcData.length > 0) {
          clustersData = gcData;
        } else {
          const { data: gcDataAlt } = await supabase.from('galaxy_clusters').select('*').order('name', { ascending: true });
          if (gcDataAlt) clustersData = gcDataAlt;
        }
      } catch (e) {}

      setDbClusters(clustersData);
      if (clustersData.length > 0 && !parentGcId) {
        setParentGcId(String(clustersData[0].id));
      }

      // Carga del Catálogo Semilla
      const realCatalog: { id: string; name: string; type: string }[] = [];
      const loadSeedTable = async (tableName: string, typeName: string, nameCol: string = 'name', idCol: string = 'id') => {
        try {
          const { data } = await supabase.from(tableName).select('*');
          (data || []).forEach((x: any) => {
            const actualId = x[idCol] || x.id;
            if (actualId) realCatalog.push({ id: String(actualId), name: x[nameCol] || x.name || actualId, type: typeName });
          });
        } catch (e) {}
      };

      await Promise.all([
        loadSeedTable('seed_ships', 'Nave', 'ship_name', 'ship_id'),
        loadSeedTable('seed_structures', 'Estructura'),
        loadSeedTable('seed_technologies', 'Tecnología'),
        loadSeedTable('seed_tools', 'Tool'),
        loadSeedTable('seed_astrobots', 'Astrobot'),
        loadSeedTable('seed_licenses', 'Licencia')
      ]);

      setSeedCatalog(realCatalog.sort((a, b) => a.name.localeCompare(b.name)));

    } catch (e) { 
      console.error("Error al sincronizar telemetría:", e); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    fetchTelemetryAndCatalogs(); 

    if (!supabase) return;
    const channel1 = supabase.channel('active_exp_admin_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'active_expeditions' }, () => {
        fetchTelemetryAndCatalogs();
      }).subscribe();

    return () => {
      supabase.removeChannel(channel1);
    };
  }, []);

  // Cascadas Jerárquicas Creadas para Navegación en Tiempo Real
  useEffect(() => {
    if (!parentGcId || !supabase) { setDbGalaxies([]); return; }
    const loadGalaxies = async () => {
      try {
        let list: any[] = [];
        const { data: g1, error: err1 } = await supabase.from('seed_galaxies').select('*').eq('cluster_id', parentGcId);
        if (!err1 && g1 && g1.length > 0) {
          list = g1;
        } else {
          const { data: g2 } = await supabase.from('galaxies').select('*').eq('cluster_id', parentGcId);
          if (g2) list = g2;
        }
        setDbGalaxies(list);
        if (list.length > 0) setParentGalaxyId(String(list[0].id));
        else setParentGalaxyId('');
      } catch (e) {
        setDbGalaxies([]);
      }
    };
    loadGalaxies();
  }, [parentGcId, supabase]);

  useEffect(() => {
    if (!parentGalaxyId || !supabase) { setDbStarClusters([]); return; }
    const loadStarClusters = async () => {
      try {
        let list: any[] = [];
        const { data: sc1, error: err1 } = await supabase.from('seed_star_clusters').select('*').eq('galaxy_id', parentGalaxyId);
        if (!err1 && sc1 && sc1.length > 0) {
          list = sc1;
        } else {
          const { data: sc2 } = await supabase.from('star_clusters').select('*').eq('galaxy_id', parentGalaxyId);
          if (sc2) list = sc2;
        }
        setDbStarClusters(list);
        if (list.length > 0) setParentScId(String(list[0].id));
        else setParentScId('');
      } catch (e) {
        setDbStarClusters([]);
      }
    };
    loadStarClusters();
  }, [parentGalaxyId, supabase]);

  useEffect(() => {
    if (!parentScId || !supabase) { setDbStarSystems([]); return; }
    const loadStarSystems = async () => {
      try {
        let list: any[] = [];
        const { data: ss1, error: err1 } = await supabase.from('seed_star_systems').select('*').eq('sc_id', parentScId);
        if (!err1 && ss1 && ss1.length > 0) {
          list = ss1;
        } else {
          const { data: ss2 } = await supabase.from('star_systems').select('*').eq('sc_id', parentScId);
          if (ss2) list = ss2;
        }
        setDbStarSystems(list);
        if (list.length > 0) setParentSystemId(String(list[0].id));
        else setParentSystemId('');
      } catch (e) {
        setDbStarSystems([]);
      }
    };
    loadStarSystems();
  }, [parentScId, supabase]);

  useEffect(() => {
    if (!parentSystemId || !supabase) { setLocations([]); return; }
    const loadLocations = async () => {
      try {
        let list: any[] = [];
        const { data: loc1, error: err1 } = await supabase.from('seed_locations').select('*').eq('system_id', parentSystemId).order('planet_star_number', { ascending: true });
        if (!err1 && loc1 && loc1.length > 0) {
          list = loc1;
        } else {
          const { data: loc2 } = await supabase.from('locations').select('*').eq('system_id', parentSystemId);
          if (loc2) list = loc2;
        }
        setLocations(list);
      } catch (e) {
        setLocations([]);
      }
    };
    loadLocations();
  }, [parentSystemId, supabase]);

  // CARGA AUTOMÁTICA DE DATOS AL MODO EDICIÓN
  const handleLoadEntityForEdition = (entityId: string) => {
    setEditSelectedEntityId(entityId);
    if (!entityId) return;

    let data: any = null;
    if (selectedEntityType === 'GC') {
      data = dbClusters.find(c => String(c.id) === String(entityId));
    } else if (selectedEntityType === 'GALAXY') {
      data = dbGalaxies.find(g => String(g.id) === String(entityId));
    } else if (selectedEntityType === 'SC') {
      data = dbStarClusters.find(s => String(s.id) === String(entityId));
    } else if (selectedEntityType === 'SS') {
      data = dbStarSystems.find(sys => String(sys.id) === String(entityId));
    } else if (selectedEntityType === 'PLANET') {
      data = dbLocations.find(l => String(l.id) === String(entityId));
    }

    if (data) {
      setEditName(data.name || data.name_code || String(data.galaxy_number || data.sc_number || data.planet_star_number || ''));
      setEditDuration(Number(data.base_duration_minutes || data.time_minutes || data.overrides?.duration_minutes || 60));
      setEditMinMetal(Number(data.base_metal_min || data.overrides?.metal_min || data.rewards?.metal_min || 5000));
      setEditMaxMetal(Number(data.base_metal_max || data.overrides?.metal_max || data.rewards?.metal_max || 25000));
      setEditMinCrystal(Number(data.base_crystal_min || data.overrides?.crystal_min || data.rewards?.crystal_min || 2000));
      setEditMaxCrystal(Number(data.base_crystal_max || data.overrides?.crystal_max || data.rewards?.crystal_max || 12000));
      setEditEventsList(Array.isArray(data.assigned_events) ? data.assigned_events : []);
      if (selectedEntityType === 'GC') {
        setEditGcLootList(Array.isArray(data.loot_pool) ? data.loot_pool : []);
      }
    }
  };

  useEffect(() => {
    if (genConsoleMode !== 'edition') return;

    if (selectedEntityType === 'GC') {
      if (parentGcId) handleLoadEntityForEdition(parentGcId);
    } else if (selectedEntityType === 'GALAXY') {
      if (dbGalaxies.length > 0) handleLoadEntityForEdition(String(dbGalaxies[0].id));
      else setEditSelectedEntityId('');
    } else if (selectedEntityType === 'SC') {
      if (dbStarClusters.length > 0) handleLoadEntityForEdition(String(dbStarClusters[0].id));
      else setEditSelectedEntityId('');
    } else if (selectedEntityType === 'SS') {
      if (dbStarSystems.length > 0) handleLoadEntityForEdition(String(dbStarSystems[0].id));
      else setEditSelectedEntityId('');
    } else if (selectedEntityType === 'PLANET') {
      if (dbLocations.length > 0) handleLoadEntityForEdition(String(dbLocations[0].id));
      else setEditSelectedEntityId('');
    }
  }, [selectedEntityType, genConsoleMode, parentGcId, dbGalaxies, dbStarClusters, dbStarSystems, dbLocations]);

  // Acciones en vivo
  const handleForceCompleteExpedition = async (expId: string) => {
    if (!supabase) return;
    try {
      await supabase.from('active_expeditions').update({ status: 'CLAIMED' }).eq('id', expId);
      alert('🚀 EXPEDICIÓN MARCADA COMO COMPLETADA EN SUPABASE.');
      fetchTelemetryAndCatalogs();
    } catch (e: any) { alert(`Error: ${e.message}`); }
  };

  const handleForceRecallExpedition = async (expId: string) => {
    if (!supabase) return;
    try {
      await supabase.from('active_expeditions').update({ status: 'SUCCESS', estimated_return_time: new Date().toISOString() }).eq('id', expId);
      alert('🛑 FLOTA RETORNADA A BASE INMEDIATAMENTE.');
      fetchTelemetryAndCatalogs();
    } catch (e: any) { alert(`Error: ${e.message}`); }
  };

  const handleForceDestroyExpedition = async (expId: string) => {
    if (!supabase || !window.confirm('🚨 ¿Confirmas la destrucción de esta flota en vivo?')) return;
    try {
      await supabase.from('active_expeditions').update({ status: 'FAILED' }).eq('id', expId);
      alert('💥 FLOTA DESTRUIDA EN EL ESPACIO EXTERIOR.');
      fetchTelemetryAndCatalogs();
    } catch (e: any) { alert(`Error: ${e.message}`); }
  };

  const handleGlobalInstaRecall = async () => {
    if (!supabase || !window.confirm('🚨 ¿DESPLEGAR INSTA-RECALL GLOBAL REAL A TODAS LAS EXPEDICIONES?')) return;
    try {
      const activeIds = activeExpeditions.map(e => e.id);
      if (activeIds.length > 0) {
        await supabase.from('active_expeditions').update({ status: 'CLAIMED', estimated_return_time: new Date().toISOString() }).in('id', activeIds);
      }
      alert('📢 RECALL GLOBAL IMPLEMENTADO EN SUPABASE.');
      fetchTelemetryAndCatalogs();
    } catch (e: any) { alert(`Error en Insta-Recall: ${e.message}`); }
  };

  // Creación procedural
  const handleAddEventToGc = () => {
    if (!bindEventName) return;
    if (gcEventsList.some(e => e.name === bindEventName)) return;
    setGcEventsList(prev => [...prev, { name: bindEventName, spawn_rate: Number(bindEventRate || 5) }]);
    setBindEventName('');
  };

  const handleRemoveEventFromGc = (evtName: string) => {
    setGcEventsList(prev => prev.filter(e => e.name !== evtName));
  };

  // AUTO-MATCHING LOOT ADDER
  const handleAddLootToGc = (mode: 'new' | 'edit') => {
    let targetId = bindLootId;
    const searchTerm = mode === 'new' ? lootSearchTermNew : lootSearchTermEdit;
    const candidates = mode === 'new' ? filteredSeedsNew : filteredSeedsEdit;

    if (!targetId && searchTerm.trim()) {
      if (candidates.length > 0) {
        targetId = candidates[0].id;
      }
    }

    if (!targetId) {
      alert("Selecciona o escribe un activo válido del catálogo.");
      return;
    }

    const asset = seedCatalog.find(c => c.id === targetId);
    if (!asset) {
      alert("Asset no encontrado en el catálogo.");
      return;
    }

    const qtyVal = Number(bindLootQty || 1);

    if (mode === 'new') {
      if (newGcLootList.some(l => l.asset_id === targetId)) {
        alert("Este asset ya fue añadido a la lista de creación.");
        return;
      }
      setNewGcLootList(prev => [...prev, { asset_id: asset.id, asset_name: asset.name, type: asset.type, qty: qtyVal }]);
      setLootSearchTermNew('');
      setShowLootSuggestionsNew(false);
    } else {
      if (editGcLootList.some(l => l.asset_id === targetId)) {
        alert("Este asset ya fue añadido a la lista de edición.");
        return;
      }
      setEditGcLootList(prev => [...prev, { asset_id: asset.id, asset_name: asset.name, type: asset.type, qty: qtyVal }]);
      setLootSearchTermEdit('');
      setShowLootSuggestionsEdit(false);
    }
    setBindLootId('');
  };

  const handleRemoveLootFromGc = (mode: 'new' | 'edit', id: string) => {
    if (mode === 'new') setNewGcLootList(prev => prev.filter(l => l.asset_id !== id));
    else setEditGcLootList(prev => prev.filter(l => l.asset_id !== id));
  };

  // Fundar Galaxy Cluster Real
  const handleCreateGCSubmit = async () => {
    if (!newGcId.trim() || !newGcName.trim()) {
      alert("Introduce el ID (2-4 letras) y el Nombre del Clúster.");
      return;
    }
    const cleanId = newGcId.trim().toUpperCase();

    if (dbClusters.some(c => String(c.id).toUpperCase() === cleanId)) {
      alert(`🚨 RESTRICCIÓN DE CLAVE: El Galaxy Cluster con ID "${cleanId}" ya existe en la base de datos.`);
      return;
    }

    const newCluster = {
      id: cleanId,
      name: newGcName.trim(),
      base_duration_minutes: Number(newGcDuration || 60),
      assigned_events: gcEventsList,
      loot_pool: newGcLootList,
      base_metal_min: Number(newGcMinMetal || 5000),
      base_metal_max: Number(newGcMaxMetal || 25000),
      base_crystal_min: Number(newGcMinCrystal || 2000),
      base_crystal_max: Number(newGcMaxCrystal || 12000)
    };

    if (supabase) {
      try {
        const { error } = await supabase.from('seed_galaxy_clusters').insert([newCluster]);
        if (error) throw error;
        
        setCreationHistoryStack(prev => [
          {
            description: `Fundación de Clúster [${cleanId}]`,
            batches: [{ table: 'seed_galaxy_clusters', ids: [cleanId] }],
            timestamp: new Date().toLocaleTimeString()
          },
          ...prev
        ]);
        alert(`🌌 GALAXY CLUSTER [${cleanId}] REGISTRADO EN SUPABASE.`);
      } catch (e: any) { alert(`Error al guardar en BD: ${e.message}`); return; }
    }

    setNewGcId(''); setNewGcName(''); setGcEventsList([]); setNewGcLootList([]);
    fetchTelemetryAndCatalogs();
  };

  // ─── MANEJADORES DE TIERS DE DISTRIBUCIÓN PORCENTUAL ───
  const handleTierChange = (index: number, field: keyof DistributionTier, value: number) => {
    setDistributionTiers(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const addTier = () => {
    setDistributionTiers(prev => [...prev, { percentage: 0, planetsPerSS: 1 }]);
  };

  const removeTier = (index: number) => {
    if (distributionTiers.length <= 1) return;
    setDistributionTiers(prev => prev.filter((_, i) => i !== index));
  };

  // ─── 🚀 FUNCIÓN DE GENERACIÓN PORCENTUAL DE PLANETAS HEREDANDO PARÁMETROS DEL GC ───
  const handleCreatePlanetsWithDistribution = async () => {
    if (!supabase) return;
    if (!parentScId) {
      alert("Selecciona un Star Cluster (SC) padre primero.");
      return;
    }

    const totalPct = distributionTiers.reduce((acc, t) => acc + Number(t.percentage), 0);
    if (totalPct !== 100) {
      alert(`Error: La suma de los porcentajes de los Tiers debe ser exactamente 100% (Suma actual: ${totalPct}%).`);
      return;
    }

    setLoading(true);
    try {
      // 1. Obtener todos los Star Systems del Star Cluster seleccionado
      const { data: dbSss, error: ssErr } = await supabase
        .from('seed_star_systems')
        .select('id, name_code')
        .eq('sc_id', parentScId);

      if (ssErr || !dbSss || dbSss.length === 0) {
        alert("No se encontraron Star Systems en este Star Cluster para distribuir planetas.");
        setLoading(false);
        return;
      }

      const systemIds = dbSss.map((sys: any) => sys.id);

      // 2. Limpieza previa de planetas antiguos
      await supabase
        .from('seed_locations')
        .delete()
        .in('system_id', systemIds);

      // 3. Mezclar aleatoriamente los sistemas
      const shuffledSystems = [...dbSss].sort(() => Math.random() - 0.5);
      const totalSystems = shuffledSystems.length;

      const activeSubtype = bodyType === 'planeta' ? planetSubtype : starSubtype;
      
      // ⚡ SI NO HAY OVERRIDE, HEREDA DIRECTAMENTE DEL GC PADRE
      const inheritedTime = enableManualOverride ? Number(overrideDuration || 60) : Number(activeClusterData?.base_duration_minutes || 60);
      const metalMin = enableManualOverride ? Number(overrideMinMetal || 5000) : Number(activeClusterData?.base_metal_min || 5000);
      const metalMax = enableManualOverride ? Number(overrideMaxMetal || 25000) : Number(activeClusterData?.base_metal_max || 25000);
      const crystalMin = enableManualOverride ? Number(overrideMinCrystal || 2000) : Number(activeClusterData?.base_crystal_min || 2000);
      const crystalMax = enableManualOverride ? Number(overrideMaxCrystal || 12000) : Number(activeClusterData?.base_crystal_max || 12000);

      const planetPayload: any[] = [];
      let systemIndexOffset = 0;

      // 4. Repartir planetas proporcionalmente según cada Tier
      distributionTiers.forEach((tier, tierIdx) => {
        const isLastTier = tierIdx === distributionTiers.length - 1;
        const countForThisTier = isLastTier 
          ? totalSystems - systemIndexOffset 
          : Math.round((Number(tier.percentage) / 100) * totalSystems);

        const assignedSystems = shuffledSystems.slice(
          systemIndexOffset,
          systemIndexOffset + countForThisTier
        );
        systemIndexOffset += countForThisTier;

        assignedSystems.forEach((sys) => {
          for (let p = 1; p <= Number(tier.planetsPerSS); p++) {
            planetPayload.push({
              system_id: sys.id,
              planet_star_number: p,
              time_minutes: inheritedTime,
              rewards: {
                metal_min: metalMin,
                metal_max: metalMax,
                crystal_min: crystalMin,
                crystal_max: crystalMax,
              },
              conditions: { body_type: bodyType, body_subtype: activeSubtype },
            });
          }
        });
      });

      // 5. Inserción masiva en lotes por bloques de 250
      const insertedIds: string[] = [];
      const BATCH_SIZE = 250;
      for (let i = 0; i < planetPayload.length; i += BATCH_SIZE) {
        const chunk = planetPayload.slice(i, i + BATCH_SIZE);
        const { data: inserted, error: insertErr } = await supabase
          .from('seed_locations')
          .insert(chunk)
          .select('id');

        if (insertErr) throw insertErr;
        if (inserted) insertedIds.push(...inserted.map((x: any) => x.id));
      }

      // 6. Historial de deshacer (Ctrl + Z)
      setCreationHistoryStack((prev) => [
        {
          description: `Distribución Porcentual (${planetPayload.length} planetas en ${totalSystems} SS)`,
          batches: [{ table: 'seed_locations', ids: insertedIds }],
          timestamp: new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);

      alert(`✅ DISTRIBUCIÓN ÉXITOSA: Se generaron e inyectaron ${planetPayload.length} planetas distribuidos proporcionalmente en el SC.`);
      fetchTelemetryAndCatalogs();
    } catch (err: any) {
      alert(`Error en la distribución de planetas: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ─── CREACIÓN DE HIJOS PASO A PASO HEREDANDO PARÁMETROS DEL GC ───
  const handleCreateChildEntitySubmit = async () => {
    if (!supabase) return;
    try {
      const actualBulkQty = Number(bulkQty || 1);

      if (selectedEntityType === 'GALAXY') {
        if (!parentGcId) return alert("Selecciona un Galaxy Cluster padre de la base de datos.");
        
        let currentNumbers = new Set<number>();
        try {
          const { data: dbGals } = await supabase.from('seed_galaxies').select('galaxy_number').eq('cluster_id', parentGcId);
          if (dbGals) dbGals.forEach((g: any) => currentNumbers.add(Number(g.galaxy_number)));
        } catch (e) {}

        let startNum = Number(childCodeOrNumber) || 1;
        while (currentNumbers.has(startNum)) {
          startNum++;
        }

        const payload = [];
        for (let i = 0; i < actualBulkQty; i++) {
          let currentNum = startNum + i;
          while (currentNumbers.has(currentNum)) {
            currentNum++;
            startNum++;
          }
          currentNumbers.add(currentNum);

          const item: any = {
            cluster_id: parentGcId,
            galaxy_number: currentNum,
            // ⚡ HERENCIA DIRECTA DEL GC
            assigned_events: enableManualOverride ? gcEventsList : (activeClusterData?.assigned_events || []),
            overrides: {
              duration_minutes: enableManualOverride ? Number(overrideDuration || 60) : Number(activeClusterData?.base_duration_minutes || 60),
              metal_min: enableManualOverride ? Number(overrideMinMetal || 5000) : Number(activeClusterData?.base_metal_min || 5000),
              metal_max: enableManualOverride ? Number(overrideMaxMetal || 25000) : Number(activeClusterData?.base_metal_max || 25000),
              crystal_min: enableManualOverride ? Number(overrideMinCrystal || 2000) : Number(activeClusterData?.base_crystal_min || 2000),
              crystal_max: enableManualOverride ? Number(overrideMaxCrystal || 12000) : Number(activeClusterData?.base_crystal_max || 12000)
            }
          };
          payload.push(item);
        }

        const { data: inserted, error } = await supabase.from('seed_galaxies').insert(payload).select('id');
        if (error) throw error;

        const insertedIds = (inserted || []).map((x: any) => x.id);
        setCreationHistoryStack(prev => [
          {
            description: `Creación de ${actualBulkQty} Galaxia(s) en [${parentGcId}]`,
            batches: [{ table: 'seed_galaxies', ids: insertedIds }],
            timestamp: new Date().toLocaleTimeString()
          },
          ...prev
        ]);

        alert(`🌀 Fundadas ${actualBulkQty} Galaxias en [${parentGcId}] con parámetros heredados.`);

      } else if (selectedEntityType === 'SC') {
        if (!parentGalaxyId) return alert("Selecciona una Galaxia padre.");

        let currentNumbers = new Set<number>();
        try {
          const { data: dbScs } = await supabase.from('seed_star_clusters').select('sc_number').eq('galaxy_id', parentGalaxyId);
          if (dbScs) dbScs.forEach((sc: any) => currentNumbers.add(Number(sc.sc_number)));
        } catch (e) {}

        let startNum = Number(childCodeOrNumber) || 1;
        while (currentNumbers.has(startNum)) {
          startNum++;
        }

        const payload = [];
        for (let i = 0; i < actualBulkQty; i++) {
          let currentNum = startNum + i;
          while (currentNumbers.has(currentNum)) {
            currentNum++;
            startNum++;
          }
          currentNumbers.add(currentNum);

          const item: any = {
            galaxy_id: parentGalaxyId,
            sc_number: currentNum,
            // ⚡ HERENCIA DIRECTA DEL GC
            assigned_events: enableManualOverride ? gcEventsList : (activeClusterData?.assigned_events || []),
            overrides: {
              duration_minutes: enableManualOverride ? Number(overrideDuration || 60) : Number(activeClusterData?.base_duration_minutes || 60),
              metal_min: enableManualOverride ? Number(overrideMinMetal || 5000) : Number(activeClusterData?.base_metal_min || 5000),
              metal_max: enableManualOverride ? Number(overrideMaxMetal || 25000) : Number(activeClusterData?.base_metal_max || 25000),
              crystal_min: enableManualOverride ? Number(overrideMinCrystal || 2000) : Number(activeClusterData?.base_crystal_min || 2000),
              crystal_max: enableManualOverride ? Number(overrideMaxCrystal || 12000) : Number(activeClusterData?.base_crystal_max || 12000)
            }
          };
          payload.push(item);
        }
        const { data: inserted, error } = await supabase.from('seed_star_clusters').insert(payload).select('id');
        if (error) throw error;

        const insertedIds = (inserted || []).map((x: any) => x.id);
        setCreationHistoryStack(prev => [
          {
            description: `Creación de ${actualBulkQty} Star Cluster(s)`,
            batches: [{ table: 'seed_star_clusters', ids: insertedIds }],
            timestamp: new Date().toLocaleTimeString()
          },
          ...prev
        ]);

        alert(`🌟 Sembrados ${actualBulkQty} Star Clusters con parámetros heredados.`);

      } else if (selectedEntityType === 'SS') {
        if (!parentScId) return alert("Selecciona un Star Cluster padre.");

        let currentCodes = new Set<string>();
        try {
          const { data: dbSss } = await supabase.from('seed_star_systems').select('name_code').eq('sc_id', parentScId);
          if (dbSss) dbSss.forEach((sys: any) => currentCodes.add(String(sys.name_code || '').toUpperCase()));
        } catch (e) {}

        const baseCode = (childCodeOrNumber.trim() || 'SYS').toUpperCase();

        const payload = [];
        for (let i = 0; i < actualBulkQty; i++) {
          let derivedCode = actualBulkQty > 1 ? `${baseCode}-${i + 1}` : baseCode;
          let counter = i + 1;
          while (currentCodes.has(derivedCode)) {
            counter++;
            derivedCode = `${baseCode}-${counter}`;
          }
          currentCodes.add(derivedCode);

          const item: any = {
            sc_id: parentScId,
            name_code: derivedCode,
            // ⚡ HERENCIA DIRECTA DEL GC
            assigned_events: enableManualOverride ? gcEventsList : (activeClusterData?.assigned_events || []),
            overrides: {
              duration_minutes: enableManualOverride ? Number(overrideDuration || 60) : Number(activeClusterData?.base_duration_minutes || 60),
              metal_min: enableManualOverride ? Number(overrideMinMetal || 5000) : Number(activeClusterData?.base_metal_min || 5000),
              metal_max: enableManualOverride ? Number(overrideMaxMetal || 25000) : Number(activeClusterData?.base_metal_max || 25000),
              crystal_min: enableManualOverride ? Number(overrideMinCrystal || 2000) : Number(activeClusterData?.base_crystal_min || 2000),
              crystal_max: enableManualOverride ? Number(overrideMaxCrystal || 12000) : Number(activeClusterData?.base_crystal_max || 12000)
            }
          };
          payload.push(item);
        }
        const { data: inserted, error } = await supabase.from('seed_star_systems').insert(payload).select('id');
        if (error) throw error;

        const insertedIds = (inserted || []).map((x: any) => x.id);
        setCreationHistoryStack(prev => [
          {
            description: `Creación de ${actualBulkQty} Star System(s)`,
            batches: [{ table: 'seed_star_systems', ids: insertedIds }],
            timestamp: new Date().toLocaleTimeString()
          },
          ...prev
        ]);

        alert(`🪐 Creados ${actualBulkQty} Star Systems con parámetros heredados.`);

      } else if (selectedEntityType === 'PLANET') {
        if (!parentSystemId) return alert("Selecciona un Star System padre.");

        let currentNumbers = new Set<number>();
        try {
          const { data: dbLocs } = await supabase.from('seed_locations').select('planet_star_number').eq('system_id', parentSystemId);
          if (dbLocs) dbLocs.forEach((l: any) => currentNumbers.add(Number(l.planet_star_number)));
        } catch (e) {}

        let startNum = Number(childCodeOrNumber) || 1;
        while (currentNumbers.has(startNum)) {
          startNum++;
        }

        const activeSubtype = bodyType === 'planeta' ? planetSubtype : starSubtype;
        const inheritedTime = enableManualOverride ? Number(overrideDuration || 60) : Number(activeClusterData?.base_duration_minutes || 60);
        const payload = [];

        for (let i = 0; i < actualBulkQty; i++) {
          let currentNum = startNum + i;
          while (currentNumbers.has(currentNum)) {
            currentNum++;
            startNum++;
          }
          currentNumbers.add(currentNum);

          payload.push({
            system_id: parentSystemId,
            planet_star_number: currentNum,
            time_minutes: inheritedTime,
            rewards: {
              metal_min: enableManualOverride ? Number(overrideMinMetal || 5000) : Number(activeClusterData?.base_metal_min || 5000),
              metal_max: enableManualOverride ? Number(overrideMaxMetal || 25000) : Number(activeClusterData?.base_metal_max || 25000),
              crystal_min: enableManualOverride ? Number(overrideMinCrystal || 2000) : Number(activeClusterData?.base_crystal_min || 2000),
              crystal_max: enableManualOverride ? Number(overrideMaxCrystal || 12000) : Number(activeClusterData?.base_crystal_max || 12000)
            },
            conditions: { body_type: bodyType, body_subtype: activeSubtype }
          });
        }
        const { data: inserted, error } = await supabase.from('seed_locations').insert(payload).select('id');
        if (error) throw error;

        const insertedIds = (inserted || []).map((x: any) => x.id);
        setCreationHistoryStack(prev => [
          {
            description: `Creación de ${actualBulkQty} Cuerpo(s) Celeste(s)`,
            batches: [{ table: 'seed_locations', ids: insertedIds }],
            timestamp: new Date().toLocaleTimeString()
          },
          ...prev
        ]);

        alert(`🌍 Mapeados ${actualBulkQty} Cuerpos Celestes (${bodyType.toUpperCase()}) con parámetros del GC.`);
      }

      fetchTelemetryAndCatalogs();
    } catch (e: any) {
      alert(`Error al guardar: ${e.message}`);
    }
  };

  // AUTO-GENERADOR INTELIGENTE (CASCADA CON BATCHING RESILIENTE)
  const handleAutoGenerateCascade = async () => {
    if (!supabase || !parentGcId) return alert("Selecciona un Galaxy Cluster padre para iniciar la cascada.");
    
    const qtyGal = Number(autoQtyGal || 2);
    const qtySc = Number(autoQtySc || 5);
    const qtySys = Number(autoQtySys || 10);
    const qtyPlanet = Number(autoQtyPlanet || 5);

    const totalPlanets = qtyGal * qtySc * qtySys * qtyPlanet;
    const totalSS = qtyGal * qtySc * qtySys;
    const totalSC = qtyGal * qtySc;
    const totalGal = qtyGal;

    if (!window.confirm(`⚠️ ADVERTENCIA DE RENDIMIENTO: Esto generará y conectará automáticamente:\n- ${totalGal} Galaxias\n- ${totalSC} Star Clusters\n- ${totalSS} Star Systems\n- ${totalPlanets} Planetas\n\nTotal de Inserciones: ${totalGal + totalSC + totalSS + totalPlanets} filas.\n\n¿Estás seguro de continuar con la Generación en Cascada?`)) return;

    setLoading(true);
    try {
      const batchesHistory: { table: string; ids: string[] }[] = [];

      let currentGalsSet = new Set<number>();
      try {
        const { data: dbGals } = await supabase.from('seed_galaxies').select('galaxy_number').eq('cluster_id', parentGcId);
        if (dbGals) dbGals.forEach((g: any) => currentGalsSet.add(Number(g.galaxy_number)));
      } catch (e) {}

      let nextGalNum = 1;
      const galPayload = [];
      for (let i = 0; i < qtyGal; i++) {
        while(currentGalsSet.has(nextGalNum)) nextGalNum++;
        currentGalsSet.add(nextGalNum);
        galPayload.push({ cluster_id: parentGcId, galaxy_number: nextGalNum });
        nextGalNum++;
      }
      
      const { data: insertedGals, error: galErr } = await supabase.from('seed_galaxies').insert(galPayload).select('id');
      if (galErr) throw galErr;
      batchesHistory.push({ table: 'seed_galaxies', ids: insertedGals.map(g => g.id) });

      const scPayload: any[] = [];
      insertedGals.forEach(gal => {
        for (let i = 0; i < qtySc; i++) {
          scPayload.push({ galaxy_id: gal.id, sc_number: i + 1 });
        }
      });
      const { data: insertedScs, error: scErr } = await supabase.from('seed_star_clusters').insert(scPayload).select('id');
      if (scErr) throw scErr;
      batchesHistory.unshift({ table: 'seed_star_clusters', ids: insertedScs.map(sc => sc.id) });

      const sysPayload: any[] = [];
      insertedScs.forEach(sc => {
        for (let i = 0; i < qtySys; i++) {
          sysPayload.push({ sc_id: sc.id, name_code: `SYS-${i + 1}` });
        }
      });

      const insertInBatches = async (table: string, payload: any[]) => {
        const results: any[] = [];
        const BATCH_SIZE = 250;
        for (let i = 0; i < payload.length; i += BATCH_SIZE) {
          const batch = payload.slice(i, i + BATCH_SIZE);
          const { data, error } = await supabase.from(table).insert(batch).select('id');
          if (error) throw error;
          if (data) results.push(...data);
        }
        return results;
      };

      const insertedSys = await insertInBatches('seed_star_systems', sysPayload);
      batchesHistory.unshift({ table: 'seed_star_systems', ids: insertedSys.map(sy => sy.id) });

      const planetPayload: any[] = [];
      const gcData = dbClusters.find(c => c.id === parentGcId);
      const inheritedTime = gcData ? Number(gcData.base_duration_minutes) : 60;

      insertedSys.forEach(sys => {
        for (let i = 0; i < qtyPlanet; i++) {
          planetPayload.push({
            system_id: sys.id,
            planet_star_number: i + 1,
            time_minutes: inheritedTime,
            rewards: {
              metal_min: gcData?.base_metal_min || 5000,
              metal_max: gcData?.base_metal_max || 25000,
              crystal_min: gcData?.base_crystal_min || 2000,
              crystal_max: gcData?.base_crystal_max || 12000
            },
            conditions: { body_type: 'planeta', body_subtype: 'rocoso' }
          });
        }
      });

      const insertedPlanets = await insertInBatches('seed_locations', planetPayload);
      batchesHistory.unshift({ table: 'seed_locations', ids: insertedPlanets.map(p => p.id) });

      setCreationHistoryStack(prev => [
        {
          description: `Auto-Generación en Cascada (Cluster: ${parentGcId})`,
          batches: batchesHistory,
          timestamp: new Date().toLocaleTimeString()
        },
        ...prev
      ]);

      alert(`✅ GENERACIÓN PROCEDURAL ÉXITOSA: Se inyectaron ${insertedPlanets.length} planetas, ${insertedSys.length} sistemas, ${insertedScs.length} SCs y ${insertedGals.length} Galaxias.`);
      fetchTelemetryAndCatalogs();

    } catch (e: any) {
      alert(`Error crítico en la Auto-Generación: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // DESHACER (UNDO / CTRL + Z)
  const handleUndoLastCreation = async () => {
    if (creationHistoryStack.length === 0) {
      alert("No hay acciones de creación recientes en la pila para deshacer.");
      return;
    }

    const lastAction = creationHistoryStack[0];
    const totalRecords = lastAction.batches.reduce((acc, b) => acc + b.ids.length, 0);

    if (!window.confirm(`🚨 UNDO (DESHACER): ¿Estás seguro de revertir "${lastAction.description}" realizada a las ${lastAction.timestamp}?\n\nSe eliminarán de forma segura (Bottom-Up) ${totalRecords} registro(s) de Supabase.`)) return;

    setLoading(true);
    try {
      if (supabase) {
        for (const batch of lastAction.batches) {
          if (batch.ids.length > 0) {
            const CHUNK_SIZE = 250;
            for (let i = 0; i < batch.ids.length; i += CHUNK_SIZE) {
              const idChunk = batch.ids.slice(i, i + CHUNK_SIZE);
              const { error } = await supabase.from(batch.table).delete().in('id', idChunk);
              if (error) throw error;
            }
          }
        }
      }

      alert(`⏪ CAMBIO REVERTIDO ÉXITO: ${lastAction.description}`);
      setCreationHistoryStack(prev => prev.slice(1));
      fetchTelemetryAndCatalogs();
    } catch (e: any) {
      alert(`Error al deshacer: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ELIMINACIÓN INDIVIDUAL
  const handleDeleteSingleEntity = async () => {
    if (!editSelectedEntityId) {
      alert("Selecciona primero un elemento específico para eliminar.");
      return;
    }

    if (!window.confirm(`🚨 ADVERTENCIA MASTER: ¿Confirmas la ELIMINACIÓN PERMANENTE de la entidad seleccionada [ID: ${editSelectedEntityId}]?`)) return;

    try {
      let table = '';
      if (selectedEntityType === 'GC') table = 'seed_galaxy_clusters';
      else if (selectedEntityType === 'GALAXY') table = 'seed_galaxies';
      else if (selectedEntityType === 'SC') table = 'seed_star_clusters';
      else if (selectedEntityType === 'SS') table = 'seed_star_systems';
      else if (selectedEntityType === 'PLANET') table = 'seed_locations';

      if (supabase) {
        const { error } = await supabase.from(table).delete().eq('id', editSelectedEntityId);
        if (error) throw error;
      }

      alert(`🗑️ ENTIDAD [${editSelectedEntityId}] ELIMINADA CON ÉXITO.`);
      setEditSelectedEntityId('');
      fetchTelemetryAndCatalogs();
    } catch (e: any) {
      alert(`Error al eliminar: ${e.message}`);
    }
  };

  // ─── 💥 ELIMINACIÓN MASIVA (BULK DELETE) MEJORADA CON CHECKBOXES ───
  const handleDeleteBulkEntities = async () => {
    if (!supabase) return;

    let targetTable = '';
    if (selectedEntityType === 'GC') targetTable = 'seed_galaxy_clusters';
    else if (selectedEntityType === 'GALAXY') targetTable = 'seed_galaxies';
    else if (selectedEntityType === 'SC') targetTable = 'seed_star_clusters';
    else if (selectedEntityType === 'SS') targetTable = 'seed_star_systems';
    else if (selectedEntityType === 'PLANET') targetTable = 'seed_locations';

    if (isBulkModeEdit || selectedBulkIdsEdit.length > 0) {
      if (selectedBulkIdsEdit.length === 0) {
        alert("Por favor selecciona al menos un elemento en la grilla para eliminar en masa.");
        return;
      }

      if (!window.confirm(`🔥 PURGA EN MASA (BULK DELETE): ¿Confirmas la eliminación masiva de los ${selectedBulkIdsEdit.length} elemento(s) seleccionado(s) de [${selectedEntityType}]?\n\nEsta acción eliminará en cascada todos sus descendientes.`)) return;

      try {
        const { error } = await supabase.from(targetTable).delete().in('id', selectedBulkIdsEdit);
        if (error) throw error;

        alert(`💥 PURGA COMPLETADA: Se han eliminado en masa ${selectedBulkIdsEdit.length} elementos de ${selectedEntityType}.`);
        setSelectedBulkIdsEdit([]);
        setEditSelectedEntityId('');
        fetchTelemetryAndCatalogs();
      } catch (e: any) {
        alert(`Error en borrado masivo: ${e.message}`);
      }
      return;
    }

    let targetParentCol = '';
    let parentValue = '';
    let entityNamePlural = '';

    if (selectedEntityType === 'GC') {
      if (!window.confirm(`🚨 BORRADO EN MASA DE CLÚSTERES: ¿Deseas eliminar TODOS los Galaxy Clusters del servidor? Esta acción no se puede deshacer.`)) return;
      try {
        const ids = dbClusters.map(c => c.id);
        if (ids.length > 0) {
          const { error } = await supabase.from('seed_galaxy_clusters').delete().in('id', ids);
          if (error) throw error;
        }
        alert(`💥 ELIMINADOS EN MASA TODOS LOS GALAXY CLUSTERS.`);
        fetchTelemetryAndCatalogs();
      } catch (e: any) { alert(`Error en purga masiva: ${e.message}`); }
      return;
    } else if (selectedEntityType === 'GALAXY') {
      if (!parentGcId) return alert("Selecciona un Galaxy Cluster padre primero.");
      targetParentCol = 'cluster_id';
      parentValue = parentGcId;
      entityNamePlural = `Galaxias en el Clúster [${parentGcId}]`;
    } else if (selectedEntityType === 'SC') {
      if (!parentGalaxyId) return alert("Selecciona una Galaxia padre primero.");
      targetParentCol = 'galaxy_id';
      parentValue = parentGalaxyId;
      entityNamePlural = `Star Clusters en la Galaxia [${parentGalaxyId}]`;
    } else if (selectedEntityType === 'SS') {
      if (!parentScId) return alert("Selecciona un Star Cluster padre primero.");
      targetParentCol = 'sc_id';
      parentValue = parentScId;
      entityNamePlural = `Star Systems en el SC [${parentScId}]`;
    } else if (selectedEntityType === 'PLANET') {
      if (!parentSystemId) return alert("Selecciona un Star System padre primero.");
      targetParentCol = 'system_id';
      parentValue = parentSystemId;
      entityNamePlural = `Planetas/Cuerpos en el Sistema [${parentSystemId}]`;
    }

    if (!window.confirm(`🔥 PURGA EN MASA (BULK DELETE): ¿Confirmas la eliminación de TODAS las ${entityNamePlural}?`)) return;

    try {
      const { error } = await supabase.from(targetTable).delete().eq(targetParentCol, parentValue);
      if (error) throw error;

      alert(`💥 PURGA COMPLETADA: Se han eliminado en masa todas las ${entityNamePlural}.`);
      setEditSelectedEntityId('');
      fetchTelemetryAndCatalogs();
    } catch (e: any) {
      alert(`Error en borrado masivo: ${e.message}`);
    }
  };

  const handleSaveEditionSubmit = async () => {
    if (!editSelectedEntityId) return;
    try {
      let table = '';
      let payload: any = {};

      if (selectedEntityType === 'GC') {
        table = 'seed_galaxy_clusters';
        payload = {
          name: editName,
          base_duration_minutes: Number(editDuration || 60),
          base_metal_min: Number(editMinMetal || 5000),
          base_metal_max: Number(editMaxMetal || 25000),
          base_crystal_min: Number(editMinCrystal || 2000),
          base_crystal_max: Number(editMaxCrystal || 12000),
          assigned_events: editEventsList,
          loot_pool: editGcLootList
        };
      } else if (selectedEntityType === 'GALAXY') {
        table = 'seed_galaxies';
        payload = {
          galaxy_number: Number(editName),
          assigned_events: editEventsList,
          overrides: {
            duration_minutes: Number(editDuration || 60),
            metal_min: Number(editMinMetal || 5000),
            metal_max: Number(editMaxMetal || 25000),
            crystal_min: Number(editMinCrystal || 2000),
            crystal_max: Number(editMaxCrystal || 12000)
          }
        };
      } else if (selectedEntityType === 'SC') {
        table = 'seed_star_clusters';
        payload = {
          sc_number: Number(editName),
          assigned_events: editEventsList,
          overrides: {
            duration_minutes: Number(editDuration || 60),
            metal_min: Number(editMinMetal || 5000),
            metal_max: Number(editMaxMetal || 25000),
            crystal_min: Number(editMinCrystal || 2000),
            crystal_max: Number(editMaxCrystal || 12000)
          }
        };
      } else if (selectedEntityType === 'SS') {
        table = 'seed_star_systems';
        payload = {
          name_code: editName,
          assigned_events: editEventsList,
          overrides: {
            duration_minutes: Number(editDuration || 60),
            metal_min: Number(editMinMetal || 5000),
            metal_max: Number(editMaxMetal || 25000),
            crystal_min: Number(editMinCrystal || 2000),
            crystal_max: Number(editMaxCrystal || 12000)
          }
        };
      } else if (selectedEntityType === 'PLANET') {
        table = 'seed_locations';
        payload = {
          planet_star_number: Number(editName),
          time_minutes: Number(editDuration || 60),
          rewards: {
            metal_min: Number(editMinMetal || 5000),
            metal_max: Number(editMaxMetal || 25000),
            crystal_min: Number(editMinCrystal || 2000),
            crystal_max: Number(editMaxCrystal || 12000)
          }
        };
      }

      if (supabase) {
        const { error } = await supabase.from(table).update(payload).eq('id', editSelectedEntityId);
        if (error) throw error;
      }

      alert(`⚙️ EDICIÓN PERSISTIDA EN SUPABASE.`);
      fetchTelemetryAndCatalogs();
    } catch (e: any) {
      alert(`Error al editar: ${e.message}`);
    }
  };

  const handleCreateEventAdvanced = async () => {
    if (!newEventName.trim() || !supabase) return;
    try {
      const { error } = await supabase.from('expedition_events_catalog').insert([
        {
          name: newEventName.trim(),
          description: newEventDesc.trim(),
          effect_type: newEventEffect,
          target_type: newEventTarget,
          spawn_rate: Number(newSpawnRate || 5),
          trigger_skill: selectedTriggerSkill,
          skill_impact_formula: skillImpactFormula,
          spawn_region: spawnRegion,
          special_condition: specialCondition,
          reward_asset_type: rewardAssetType,
          reward_asset_qty: Number(rewardAssetQty || 500)
        }
      ]);
      if (error) throw error;
      alert(`⚡ Evento [${newEventName.trim()}] guardado.`);
      setNewEventName(''); setNewEventDesc(''); fetchTelemetryAndCatalogs();
    } catch (e: any) { alert(e.message); }
  };

  const totalTierPct = distributionTiers.reduce((acc, t) => acc + Number(t.percentage), 0);
  const isTierPctValid = totalTierPct === 100;

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-slate-100 font-mono text-xs space-y-6 rounded-xl border border-slate-800 text-left select-none">

      {/* HEADER CRONOMETRADO */}
      <div className="bg-slate-950/80 p-3.5 border border-slate-850 rounded-lg flex justify-between items-center">
        <div className="flex items-center gap-2 text-emerald-400 font-bold tracking-wider text-[11px]">
          <Clock size={13} className="animate-pulse" /> {new Date().toUTCString().split(' ')[4]} UTC
        </div>
        <div className="flex items-center gap-1.5 text-slate-400 font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span>{activeExpeditions.length} Flotas en Tránsito Activo</span>
        </div>
      </div>

      {/* TABS NAVEGACIÓN */}
      <div className="flex flex-wrap border-b border-slate-800 gap-1">
        {[
          { id: 'exploration', label: '🚀 Exploración / Minería', icon: <Compass size={14} /> },
          { id: 'events', label: '⚡ Catálogo de Eventos', icon: <Zap size={14} /> },
          { id: 'generator', label: '🌌 Generador de Galaxias', icon: <MapIcon size={14} /> }
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as TabId)} className={`px-4 py-2.5 font-bold uppercase tracking-wider flex items-center gap-2 transition-all border-b-2 cursor-pointer ${activeTab === t.id ? 'border-cyan-500 text-cyan-400 bg-cyan-950/10' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>{t.icon} {t.label}</button>
        ))}
      </div>

      {/* TAB 1: EXPLORACIÓN Y MINERÍA */}
      {activeTab === 'exploration' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                  Flotas Actualmente en Expedicion
                </span>
                <div className="text-2xl font-black text-emerald-400 flex items-center gap-2">
                  <span>{activeExpeditions.length}</span>
                  <span className="text-xs font-normal text-slate-400">Expediciones Volando</span>
                </div>
              </div>

              <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                  Todas las Expediciones de Exploracion Hechas en Total del Juego
                </span>
                <div className="text-2xl font-black text-cyan-400 flex items-center gap-2">
                  <span>{totalHistoricalExpeditionsCount.toLocaleString()}</span>
                  <span className="text-xs font-normal text-slate-400">Misiones Completadas</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl flex flex-col justify-center">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                Eventos de Expedicion Encontrados
              </span>
              <div className="text-3xl font-black text-rose-500 flex items-center gap-2">
                <span>{dailyEventsCount}</span>
                <span className="text-xs font-normal text-slate-400">(24h) / {historicalLogs.length} Histórico Total</span>
              </div>
            </div>
          </div>

          <div className="flex gap-1 bg-black/40 p-1 rounded-lg border border-slate-850">
            {[
              { id: 'monitor', label: '📊 Monitor Operativo' }, 
              { id: 'losses', label: '💀 Pérdidas & Logs' }, 
              { id: 'discoveries', label: '🏆 Descubrimientos' }
            ].map(sub => (
              <button key={sub.id} onClick={() => setActiveExploreTab(sub.id as ExploreSubTab)} className={`px-3 py-1.5 font-bold uppercase text-[9.5px] rounded cursor-pointer ${activeExploreTab === sub.id ? 'bg-cyan-950/40 text-cyan-400 border border-cyan-900/40' : 'text-slate-500'}`}>{sub.label}</button>
            ))}
          </div>

          {activeExploreTab === 'monitor' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-fadeIn">
              <div className="xl:col-span-2 bg-slate-950 p-5 border border-slate-850 rounded-xl space-y-4">
                <span className="text-cyan-400 font-bold text-[10px] uppercase tracking-widest flex items-center gap-1"><Compass size={12} /> RADAR GLOBAL DE FLOTAS EN VUELO (TIEMPO REAL)</span>
                
                {activeExpeditions.length === 0 ? (
                  <div className="p-8 text-center text-slate-600 text-[10px] uppercase border border-slate-850 rounded-lg">
                    {loading ? 'Sincronizando radar estelar...' : 'NO HAY EXPEDICIONES EN VUELO REGISTRADAS EN ESTE MOMENTO.'}
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {activeExpeditions.map((exp, idx) => {
                      const launchMs = new Date(exp.launch_time).getTime();
                      const returnMs = new Date(exp.estimated_return_time).getTime();
                      const totalDurationMs = Math.max(1000, returnMs - launchMs);
                      const elapsedMs = Math.max(0, now - launchMs);
                      const remainingMs = Math.max(0, returnMs - now);
                      const progressPct = Math.min(100, Math.max(0, (elapsedMs / totalDurationMs) * 100));

                      return (
                        <div key={exp.id || `exp-${idx}`} className="p-3.5 bg-zinc-950 border border-slate-800 hover:border-cyan-500/50 rounded-xl space-y-2.5 transition-colors">
                          <div className="flex flex-col md:flex-row justify-between md:items-center gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-xs uppercase">{exp.fleet_name || 'FLOTA INDEPENDIENTE'}</span>
                                <span className="text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-1.5 py-0.5 rounded font-bold uppercase">
                                  {exp.galaxy_cluster || 'PELA'}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-sans block mt-0.5">
                                Piloto: <strong className="text-zinc-200">{exp.username}</strong> | Sector: <strong className="text-cyan-400">{exp.sector_name || 'SECTOR'}</strong>
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <button onClick={() => handleForceCompleteExpedition(exp.id)} className="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 font-bold text-[8.5px] uppercase rounded cursor-pointer">🚀 Completar</button>
                              <button onClick={() => handleForceRecallExpedition(exp.id)} className="px-2.5 py-1 bg-amber-950 hover:bg-amber-900 border border-amber-700 text-amber-300 font-bold text-[8.5px] uppercase rounded cursor-pointer">🛑 Retornar</button>
                              <button onClick={() => handleForceDestroyExpedition(exp.id)} className="px-2.5 py-1 bg-red-950 hover:bg-red-900 border border-red-700 text-red-300 font-bold text-[8.5px] uppercase rounded cursor-pointer">💥 Destruir</button>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-[8.5px] text-zinc-400 font-bold">
                              <span>PROGRESO ({formatDuration(remainingMs)} RESTANTE)</span>
                              <span className="text-cyan-400">{progressPct.toFixed(1)}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                              <div className="h-full bg-cyan-400 transition-all duration-300" style={{ width: `${progressPct}%` }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="bg-slate-950 p-5 border border-slate-850 rounded-xl space-y-4">
                <span className="text-red-500 font-bold text-[10px] uppercase tracking-widest flex items-center gap-1"><ShieldAlert size={12} /> CONSOLA MODO DIOS</span>
                <button 
                  onClick={handleGlobalInstaRecall}
                  disabled={activeExpeditions.length === 0}
                  className="w-full bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-red-400 font-black py-2.5 rounded text-[9.5px] uppercase transition-all cursor-pointer disabled:opacity-40"
                >
                  🚨 FORZAR INSTA-RECALL GLOBAL REAL
                </button>
              </div>
            </div>
          )}

          {activeExploreTab === 'losses' && (
            <div className="bg-slate-950 p-5 border border-slate-850 rounded-xl space-y-4 animate-fadeIn">
              <span className="text-rose-500 font-bold text-[10px] uppercase tracking-widest flex items-center gap-1">
                <Skull size={14} /> BITÁCORA FORENSE DE PÉRDIDAS Y ACTIVOS PERDIDOS / EN DERIVA
              </span>

              <div className="space-y-2.5 max-h-[450px] overflow-y-auto pr-1">
                {detailedLosses.length === 0 ? (
                  <div className="text-center py-10 text-slate-600 text-xs italic border border-dashed border-slate-850 rounded-xl">
                    Sin registros de pérdidas ni activos desintegrados en las misiones.
                  </div>
                ) : (
                  detailedLosses.map((loss, idx) => (
                    <div key={loss.id || `loss-${idx}`} className="p-3.5 bg-black/60 border border-slate-850 rounded-xl flex flex-col md:flex-row justify-between md:items-center gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold uppercase text-xs">{loss.asset_name}</span>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
                            loss.status_type === 'DESTRUIDO' 
                              ? 'bg-red-950 text-red-400 border-red-800' 
                              : 'bg-amber-950 text-amber-400 border-amber-800 animate-pulse'
                          }`}>
                            {loss.status_type}
                          </span>
                        </div>
                        
                        <div className="text-[9.5px] text-zinc-400 space-x-3">
                          <span>Piloto: <strong className="text-zinc-200">{loss.username}</strong></span>
                          <span>Encuentro: <strong className="text-cyan-400">{loss.encounter_type}</strong></span>
                          <span>Hora: <strong className="text-zinc-300">{new Date(loss.timestamp).toLocaleString()}</strong></span>
                        </div>

                        <div className="text-[9px] text-zinc-500 font-mono space-x-3 pt-0.5">
                          <span>📍 Coordenadas de Pérdida: <strong className="text-red-400 font-bold">{loss.coordinates_loss}</strong></span>
                          {loss.status_type === 'PERDIDO' && loss.coordinates_salvage && (
                            <span className="text-amber-400 font-bold bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-800/40">
                              📡 Coordenadas de Captura: {loss.coordinates_salvage} (CAPTURABLE)
                            </span>
                          )}
                        </div>
                      </div>

                      {loss.damage_sustained && (
                        <div className="text-right">
                          <span className="text-red-500 font-bold font-mono text-xs block">-{loss.damage_sustained} HP</span>
                          <span className="text-[8px] text-zinc-500 block uppercase">Pérdida de Integridad</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeExploreTab === 'discoveries' && (
            <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl space-y-3 animate-fadeIn">
              <span className="text-amber-500 font-bold text-[10px] uppercase tracking-widest flex items-center gap-1"><Trophy size={12} /> HISTORIAL DE PLANETAS Y ESTRELLAS DESCUBIERTAS</span>
              {discoveries.map((d, idx) => (
                <div key={d.id || `disc-${idx}`} className="p-2.5 bg-zinc-900 border border-zinc-850 rounded flex justify-between items-center">
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

      {/* TAB 2: CATÁLOGO DE EVENTOS */}
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
                    eventsCatalog.map((ev, idx) => (
                      <div key={ev.id || `ev-${idx}`} className="p-3 bg-zinc-900 border border-slate-800 rounded flex justify-between items-center text-[10px]">
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

      {/* ─── 🌌 TAB 3: GENERADOR DE GALAXIAS ─── */}
      {activeTab === 'generator' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* BARRA SUPERIOR DE MODO Y BOTÓN DE UNDO (CTRL + Z) */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-950 p-3.5 border border-slate-850 rounded-xl gap-3">
            <span className="text-cyan-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
              <MapIcon size={16} /> GENERADOR PROCEDURAL Y CONSOLA DE MAPEO ESTELAR
            </span>

            <div className="flex items-center gap-2">
              {(genConsoleMode === 'creation' || genConsoleMode === 'autogen') && creationHistoryStack.length > 0 && (
                <button
                  onClick={handleUndoLastCreation}
                  className="px-3 py-1.5 bg-rose-950 hover:bg-rose-900 border border-rose-700 text-rose-300 font-bold text-[10px] uppercase rounded-md transition-all cursor-pointer flex items-center gap-1.5 shadow-md animate-pulse"
                  title="Deshacer última creación (Ctrl + Z)"
                >
                  <RotateCcw size={12} />
                  DESHACER (CTRL + Z) [{creationHistoryStack.length}]
                </button>
              )}

              <div className="flex flex-wrap gap-1.5 bg-black/60 p-1 rounded-lg border border-zinc-800">
                <button
                  onClick={() => setGenConsoleMode('creation')}
                  className={`px-3 py-1.5 font-bold uppercase text-[10px] rounded-md transition-all cursor-pointer ${
                    genConsoleMode === 'creation' ? 'bg-cyan-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  ➕ CREACIÓN
                </button>
                <button
                  onClick={() => setGenConsoleMode('edition')}
                  className={`px-3 py-1.5 font-bold uppercase text-[10px] rounded-md transition-all cursor-pointer ${
                    genConsoleMode === 'edition' ? 'bg-amber-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  ✏️ EDICIÓN
                </button>
                <button
                  onClick={() => setGenConsoleMode('autogen')}
                  className={`px-3 py-1.5 font-bold uppercase text-[10px] rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                    genConsoleMode === 'autogen' ? 'bg-purple-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Network size={12} /> AUTO-GENERADOR
                </button>
              </div>
            </div>
          </div>

          {/* 1. SELECCIÓN DE TIPO DE ENTIDAD */}
          {(genConsoleMode === 'creation' || genConsoleMode === 'edition') && (
            <div className="bg-slate-950 p-5 border border-slate-850 rounded-xl space-y-4">
              <span className="text-zinc-400 font-bold text-[10.5px] uppercase block tracking-wider">
                1. ¿QUÉ ENTIDAD GALÁCTICA QUIERES {genConsoleMode === 'creation' ? 'CREAR' : 'EDITAR'}?
              </span>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { type: 'GC', label: 'Galaxy Cluster (GC)', icon: '🌌', desc: 'Soberanía Raíz' },
                  { type: 'GALAXY', label: 'Galaxia', icon: '🌀', desc: 'Galaxia dentro de GC' },
                  { type: 'SC', label: 'Star Cluster (SC)', icon: '🌟', desc: 'Cúmulo de Sistemas' },
                  { type: 'SS', label: 'Star System (SS)', icon: '🪐', desc: 'Sistema Solar' },
                  { type: 'PLANET', label: 'Planeta / Cuerpo', icon: '🌍', desc: 'Nodo Explorable' }
                ].map((item) => (
                  <div
                    key={item.type}
                    onClick={() => setSelectedEntityType(item.type as GenEntityType)}
                    className={`p-3.5 rounded-xl border cursor-pointer text-center transition-all flex flex-col justify-between items-center gap-1.5 ${
                      selectedEntityType === item.type
                        ? 'bg-cyan-950/40 border-cyan-500 text-cyan-300 shadow-lg shadow-cyan-950/40 scale-102'
                        : 'bg-zinc-900/40 border-zinc-850 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <span className="font-bold text-white text-[10.5px] uppercase block">{item.label}</span>
                    <span className="text-[8.5px] text-zinc-500 block font-sans">{item.desc}</span>
                  </div>
                ))}
              </div>

              {selectedEntityType === 'PLANET' && (
                <div className="p-3 bg-zinc-900/60 border border-zinc-850 rounded-xl flex flex-wrap gap-4 items-center">
                  <span className="text-zinc-400 font-bold text-[10px] uppercase">Selecciona Tipo de Cuerpo Celeste:</span>
                  <select 
                    className="bg-zinc-950 border border-zinc-800 p-1.5 rounded text-white text-[11px] outline-none cursor-pointer"
                    value={bodyType} 
                    onChange={e => setBodyType(e.target.value as 'planeta' | 'estrella')}
                  >
                    <option value="planeta">🪐 Planeta</option>
                    <option value="estrella">☀️ Estrella</option>
                  </select>

                  <span className="text-zinc-400 font-bold text-[10px] uppercase">Clase Canónica:</span>
                  {bodyType === 'planeta' ? (
                    <select className="bg-zinc-950 border border-zinc-800 p-1.5 rounded text-white text-[11px] outline-none cursor-pointer" value={planetSubtype} onChange={e => setPlanetType(e.target.value)}>
                      <option value="rocoso">🪨 Rocoso</option>
                      <option value="vida">🌱 Vida / Habitable</option>
                      <option value="agua">💧 Oceánico / Agua</option>
                      <option value="gaseoso">☁️ Gaseoso</option>
                    </select>
                  ) : (
                    <select className="bg-zinc-950 border border-zinc-800 p-1.5 rounded text-white text-[11px] outline-none cursor-pointer" value={starSubtype} onChange={e => setStarType(e.target.value)}>
                      <option value="blancas">⚪ Enana Blanca</option>
                      <option value="amarillas">🟡 Gigante Amarilla</option>
                      <option value="rojas">🔴 Enana Roja</option>
                      <option value="neutron">⚡ Estrella de Neutrones</option>
                    </select>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 3. MODO AUTO-GENERADOR */}
          {genConsoleMode === 'autogen' && (
            <div className="bg-slate-950 p-6 border border-purple-500/40 rounded-xl space-y-6 shadow-xl animate-fadeIn">
              
              <div className="space-y-2">
                <span className="text-purple-400 font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                  <Network size={18} /> GENERACIÓN PROCEDURAL EN CASCADA
                </span>
                <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                  Genera y conecta automáticamente toda la jerarquía estelar a partir de un Galaxy Cluster raíz. El sistema asignará números correlativos y códigos de sector (ej. <code>SYS-X</code>) de forma inteligente para evitar cualquier conflicto de claves.
                </p>
              </div>

              <div className="bg-zinc-900/40 p-5 border border-zinc-850 rounded-xl space-y-4">
                
                <div>
                  <label className="text-[10px] text-zinc-400 font-bold uppercase block mb-1.5">
                    1. Seleccionar Galaxy Cluster (Punto de Origen):
                  </label>
                  <select className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded text-white font-bold text-[11px] outline-none cursor-pointer" value={parentGcId} onChange={e => setParentGcId(e.target.value)}>
                    {dbClusters.map((c, idx) => <option key={c.id || `auto-gc-${idx}`} value={c.id}>{c.name || c.id} ({c.id})</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
                  <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl space-y-2 text-center">
                    <span className="text-cyan-400 font-bold text-[10px] uppercase block">Galaxias</span>
                    <input type="number" min={1} className="w-full bg-black border border-cyan-900/50 p-2 rounded text-center text-cyan-300 font-black text-lg outline-none" value={autoQtyGal} onChange={e => setAutoQtyGal(e.target.value === '' ? '' : Number(e.target.value))} />
                    <span className="text-[8px] text-zinc-500 uppercase">Por cada Cluster</span>
                  </div>

                  <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl space-y-2 text-center">
                    <span className="text-amber-400 font-bold text-[10px] uppercase block">Star Clusters</span>
                    <input type="number" min={1} className="w-full bg-black border border-amber-900/50 p-2 rounded text-center text-amber-300 font-black text-lg outline-none" value={autoQtySc} onChange={e => setAutoQtySc(e.target.value === '' ? '' : Number(e.target.value))} />
                    <span className="text-[8px] text-zinc-500 uppercase">Por cada Galaxia</span>
                  </div>

                  <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl space-y-2 text-center">
                    <span className="text-purple-400 font-bold text-[10px] uppercase block">Sistemas</span>
                    <input type="number" min={1} className="w-full bg-black border border-purple-900/50 p-2 rounded text-center text-purple-300 font-black text-lg outline-none" value={autoQtySys} onChange={e => setAutoQtySys(e.target.value === '' ? '' : Number(e.target.value))} />
                    <span className="text-[8px] text-zinc-500 uppercase">Por cada SC</span>
                  </div>

                  <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl space-y-2 text-center">
                    <span className="text-emerald-400 font-bold text-[10px] uppercase block">Planetas</span>
                    <input type="number" min={1} className="w-full bg-black border border-emerald-900/50 p-2 rounded text-center text-emerald-300 font-black text-lg outline-none" value={autoQtyPlanet} onChange={e => setAutoQtyPlanet(e.target.value === '' ? '' : Number(e.target.value))} />
                    <span className="text-[8px] text-zinc-500 uppercase">Por cada Sistema</span>
                  </div>
                </div>

                <div className="p-4 bg-purple-950/20 border border-purple-500/30 rounded-xl flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Resumen de Inyección Estelar:</span>
                    <p className="text-[11px] text-zinc-300 font-sans">
                      Se crearán <strong className="text-white">{Number(autoQtyGal || 0)} Galaxias</strong>, <strong className="text-white">{Number(autoQtyGal || 0) * Number(autoQtySc || 0)} Star Clusters</strong>, <strong className="text-white">{Number(autoQtyGal || 0) * Number(autoQtySc || 0) * Number(autoQtySys || 0)} Sistemas</strong> y <strong className="text-emerald-400">{Number(autoQtyGal || 0) * Number(autoQtySc || 0) * Number(autoQtySys || 0) * Number(autoQtyPlanet || 0)} Planetas</strong>.
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-zinc-500 uppercase block font-bold">Total Inserciones:</span>
                    <span className="text-xl font-black text-white">{Number(autoQtyGal || 0) + (Number(autoQtyGal || 0) * Number(autoQtySc || 0)) + (Number(autoQtyGal || 0) * Number(autoQtySc || 0) * Number(autoQtySys || 0)) + (Number(autoQtyGal || 0) * Number(autoQtySc || 0) * Number(autoQtySys || 0) * Number(autoQtyPlanet || 0))}</span>
                  </div>
                </div>

                <button 
                  onClick={handleAutoGenerateCascade} 
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-600 hover:to-indigo-500 text-white font-black py-3.5 rounded-xl uppercase text-[11px] tracking-wider cursor-pointer shadow-xl transition-all disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {loading ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
                  Ejecutar Auto-Generación Procedural en Cascada
                </button>
              </div>

            </div>
          )}

          {/* MODO CREACIÓN MANUAL */}
          {genConsoleMode === 'creation' && (
            <div className="space-y-6">

              {selectedEntityType === 'GC' && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                  
                  {/* VENTANA 1: FORMULARIO CREACIÓN DE GC */}
                  <div className="bg-slate-950 p-5 border border-slate-850 rounded-xl space-y-4 shadow-xl">
                    <span className="text-cyan-400 font-bold text-xs uppercase tracking-wider block border-b border-zinc-850 pb-2">
                      📝 VENTANA 1: FUNDAR NUEVO GALAXY CLUSTER (GC)
                    </span>

                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[9px] text-zinc-500 block mb-1">ID (2-4 Letras):</label>
                          <input type="text" placeholder="Ej: PELA, GC1" className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded text-white font-bold text-xs uppercase" value={newGcId} onChange={e => setNewGcId(e.target.value)} />
                        </div>
                        <div>
                          <label className="text-[9px] text-zinc-500 block mb-1">Nombre Oficial:</label>
                          <input type="text" placeholder="Ej: Inara Alpha" className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded text-white font-bold text-xs" value={newGcName} onChange={e => setNewGcName(e.target.value)} />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 bg-zinc-900/40 p-3 rounded-xl border border-zinc-850">
                        <div className="col-span-2 text-emerald-400 font-bold text-[9.5px] uppercase">⏱️ Tiempo Base de Expedición</div>
                        <div className="col-span-2">
                          <input type="number" min={1} className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded text-emerald-400 font-bold text-xs" value={newGcDuration} onChange={e => setNewGcDuration(e.target.value === '' ? '' : Number(e.target.value))} />
                          <span className="text-[8.5px] text-zinc-500 mt-1 block">Minutos requeridos para llegar a este Clúster</span>
                        </div>
                      </div>

                      <div className="bg-zinc-900/40 p-3 rounded-xl border border-zinc-850 space-y-2">
                        <span className="text-amber-400 font-bold text-[9.5px] uppercase block">💎 RANGO BASE DE EXTRACCIÓN Y MINADO</span>
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div><span className="text-zinc-500 block text-[8px]">Min Metal Base:</span><input type="number" className="w-full bg-zinc-950 border border-zinc-800 p-1.5 rounded text-white font-bold" value={newGcMinMetal} onChange={e => setNewGcMinMetal(e.target.value === '' ? '' : Number(e.target.value))} /></div>
                          <div><span className="text-zinc-500 block text-[8px]">Max Metal Base:</span><input type="number" className="w-full bg-zinc-950 border border-zinc-800 p-1.5 rounded text-white font-bold" value={newGcMaxMetal} onChange={e => setNewGcMaxMetal(e.target.value === '' ? '' : Number(e.target.value))} /></div>
                          <div><span className="text-zinc-500 block text-[8px]">Min Cristal Base:</span><input type="number" className="w-full bg-zinc-950 border border-zinc-800 p-1.5 rounded text-cyan-300 font-bold" value={newGcMinCrystal} onChange={e => setNewGcMinCrystal(e.target.value === '' ? '' : Number(e.target.value))} /></div>
                          <div><span className="text-zinc-500 block text-[8px]">Max Cristal Base:</span><input type="number" className="w-full bg-zinc-950 border border-zinc-800 p-1.5 rounded text-cyan-300 font-bold" value={newGcMaxCrystal} onChange={e => setNewGcMaxCrystal(e.target.value === '' ? '' : Number(e.target.value))} /></div>
                        </div>
                      </div>

                      <div className="bg-zinc-900/40 p-3 rounded-xl border border-zinc-850 space-y-2">
                        <span className="text-purple-400 font-bold text-[9.5px] uppercase block">🔮 EVENTOS DE CLÚSTER & % DE APARICIÓN</span>
                        <div className="grid grid-cols-3 gap-2">
                          <select className="col-span-2 bg-zinc-950 border border-zinc-800 p-1.5 rounded text-white text-[10px]" value={bindEventName} onChange={e => setBindEventName(e.target.value)}>
                            <option value="">-- Seleccionar Evento --</option>
                            {eventsCatalog.map((ev, idx) => <option key={ev.id || `ev-opt-${idx}`} value={ev.name}>{ev.name}</option>)}
                          </select>
                          <input type="number" min={1} max={100} placeholder="% Rate" className="bg-zinc-950 border border-zinc-800 p-1.5 rounded text-center text-amber-400 font-bold" value={bindEventRate} onChange={e => setBindEventRate(e.target.value === '' ? '' : Number(e.target.value))} />
                        </div>
                        <button onClick={handleAddEventToGc} className="w-full bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-800 py-1.5 rounded uppercase font-bold text-[9px] cursor-pointer">
                          + Asignar Evento al Clúster
                        </button>

                        <div className="space-y-1 pt-1">
                          {gcEventsList.map((e, idx) => (
                            <div key={`gcev-${idx}`} className="flex justify-between items-center bg-black/60 p-1.5 rounded text-[10px] border border-zinc-850">
                              <span className="text-zinc-200 font-bold">{e.name}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-amber-400 font-bold">{e.spawn_rate}% Rate</span>
                                <button onClick={() => handleRemoveEventFromGc(e.name)} className="text-red-400 hover:text-red-300 cursor-pointer"><X size={12} /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* BUSCADOR Y PREDICTOR DE LOOT OCULTO (CREACIÓN) */}
                      <div className="bg-zinc-900/40 p-3 rounded-xl border border-zinc-850 space-y-2 relative">
                        <span className="text-emerald-400 font-bold text-[9.5px] uppercase block flex items-center gap-1">
                          <PackageOpen size={12} /> 🎁 ASSETS OCULTOS / LOOT DEL CLÚSTER
                        </span>
                        <div className="text-[8.5px] text-zinc-500 italic mb-1">
                          Se esparcirán aleatoria y equitativamente entre los sistemas y planetas de este GC.
                        </div>

                        <div className="grid grid-cols-3 gap-2 items-start">
                          <div className="col-span-2 relative">
                            <input
                              type="text"
                              placeholder="🔍 Buscar Asset (Ej: Heavy Hunter, Mina...)"
                              className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded text-white text-[10px] outline-none focus:border-cyan-500 uppercase"
                              value={lootSearchTermNew}
                              onFocus={() => setShowLootSuggestionsNew(true)}
                              onBlur={() => setTimeout(() => setShowLootSuggestionsNew(false), 200)}
                              onChange={e => {
                                setLootSearchTermNew(e.target.value);
                                setShowLootSuggestionsNew(true);
                              }}
                            />

                            {showLootSuggestionsNew && filteredSeedsNew.length > 0 && (
                              <div className="absolute left-0 right-0 top-full mt-1 bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl z-[150] max-h-48 overflow-y-auto divide-y divide-zinc-900 text-[10px]">
                                {filteredSeedsNew.map((asset) => (
                                  <div
                                    key={`seed-new-${asset.id}`}
                                    className="p-2 hover:bg-cyan-950/60 hover:text-cyan-300 cursor-pointer flex justify-between items-center"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      setBindLootId(asset.id);
                                      setLootSearchTermNew(`[${asset.type}] ${asset.name}`);
                                      setShowLootSuggestionsNew(false);
                                    }}
                                  >
                                    <span className="font-bold text-zinc-200">[{asset.type}] {asset.name}</span>
                                    <span className="text-[8.5px] text-zinc-500 font-mono">{asset.id}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <input 
                            type="number" 
                            min={1} 
                            placeholder="Cant" 
                            className="bg-zinc-950 border border-zinc-800 p-2 rounded text-center text-emerald-400 font-bold text-[11px]" 
                            value={bindLootQty} 
                            onChange={e => setBindLootQty(e.target.value === '' ? '' : Number(e.target.value))} 
                          />
                        </div>

                        <button onClick={() => handleAddLootToGc('new')} className="w-full bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 py-1.5 rounded uppercase font-bold text-[9px] cursor-pointer mt-1">
                          + Añadir Asset al Loot Pool
                        </button>

                        <div className="space-y-1 pt-1">
                          {newGcLootList.map((loot, idx) => (
                            <div key={`gcloot-${idx}`} className="flex justify-between items-center bg-black/60 p-1.5 rounded text-[10px] border border-zinc-850">
                              <span className="text-zinc-200 font-bold truncate max-w-[150px]">[{loot.type}] {loot.asset_name}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-emerald-400 font-bold">x{loot.qty}</span>
                                <button onClick={() => handleRemoveLootFromGc('new', loot.asset_id)} className="text-red-400 hover:text-red-300 cursor-pointer"><Trash2 size={12} /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <button onClick={handleCreateGCSubmit} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black py-2.5 rounded-xl uppercase text-[11px] cursor-pointer shadow-lg">
                        Fundar Galaxy Cluster Oficial
                      </button>
                    </div>
                  </div>

                  {/* VENTANA 2: CARRUSEL DE GCS CREADOS */}
                  <div className="bg-slate-950 p-5 border border-slate-850 rounded-xl space-y-4 shadow-xl">
                    <span className="text-purple-400 font-bold text-xs uppercase tracking-wider block border-b border-zinc-850 pb-2">
                      🎠 VENTANA 2: CARRUSEL DE GALAXY CLUSTERS EXISTENTES ({dbClusters.length})
                    </span>

                    {dbClusters.length === 0 ? (
                      <div className="p-12 text-center text-zinc-600 italic">No hay Galaxy Clusters registrados en el sistema.</div>
                    ) : (
                      <div className="space-y-4">
                        <div className="relative bg-black/60 p-6 border border-cyan-500/30 rounded-2xl space-y-4 text-center">
                          <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                            <span className="text-xs font-black text-cyan-400 uppercase">ID: {dbClusters[carouselIndex]?.id}</span>
                            <span className="text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded font-mono font-bold">
                              {carouselIndex + 1} de {dbClusters.length}
                            </span>
                          </div>

                          <div className="text-2xl font-black text-white uppercase">{dbClusters[carouselIndex]?.name}</div>

                          <div className="grid grid-cols-2 gap-3 text-[10px] font-mono text-left bg-zinc-950 p-3 rounded-xl border border-zinc-850">
                            <div><span className="text-zinc-500 block text-[8px]">DURACIÓN VIAJE:</span><strong className="text-emerald-400">{dbClusters[carouselIndex]?.base_duration_minutes} min</strong></div>
                            <div><span className="text-zinc-500 block text-[8px]">EVENTOS MAPEADOS:</span><strong className="text-purple-400">{dbClusters[carouselIndex]?.assigned_events?.length || 0} Eventos</strong></div>
                            <div><span className="text-zinc-500 block text-[8px]">RANGO METAL BASE:</span><strong className="text-white">{dbClusters[carouselIndex]?.base_metal_min || 5000} - {dbClusters[carouselIndex]?.base_metal_max || 25000}</strong></div>
                            <div><span className="text-zinc-500 block text-[8px]">RANGO CRISTAL BASE:</span><strong className="text-cyan-300">{dbClusters[carouselIndex]?.base_crystal_min || 2000} - {dbClusters[carouselIndex]?.base_crystal_max || 12000}</strong></div>
                            <div className="col-span-2 border-t border-zinc-800 pt-1 mt-1"><span className="text-zinc-500 block text-[8px]">LOOT POOL (ASSETS A REPARTIR):</span><strong className="text-emerald-400">{(dbClusters[carouselIndex]?.loot_pool || []).reduce((acc:any, curr:any) => acc + (curr.qty||0), 0)} Assets Registrados</strong></div>
                          </div>

                          <div className="flex justify-between items-center pt-2">
                            <button
                              onClick={() => setCarouselIndex(prev => (prev === 0 ? dbClusters.length - 1 : prev - 1))}
                              className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-cyan-400 rounded-lg font-bold uppercase text-[10px] cursor-pointer flex items-center gap-1"
                            >
                              <ChevronLeft size={14} /> Anterior
                            </button>

                            <button
                              onClick={() => setCarouselIndex(prev => (prev === dbClusters.length - 1 ? 0 : prev + 1))}
                              className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-cyan-400 rounded-lg font-bold uppercase text-[10px] cursor-pointer flex items-center gap-1"
                            >
                              Siguiente <ChevronRight size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              )}

              {selectedEntityType !== 'GC' && (
                <div className="bg-slate-950 p-6 border border-slate-850 rounded-xl space-y-5 shadow-xl">
                  <span className="text-cyan-400 font-bold text-xs uppercase tracking-wider block border-b border-zinc-850 pb-2">
                    🛠️ CREACIÓN PASO A PASO: [{selectedEntityType}]
                  </span>

                  {/* SELECTOR MODO GENERACIÓN SI ES ENTIDAD PLANET */}
                  {selectedEntityType === 'PLANET' && (
                    <div className="flex gap-2 bg-[#121927] p-2 rounded-lg border border-[#232f48]">
                      <button
                        type="button"
                        onClick={() => setPlanetGenMode('distribution_sc')}
                        className={`flex-1 py-2 text-xs font-bold uppercase rounded transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          planetGenMode === 'distribution_sc'
                            ? 'bg-cyan-600 text-white shadow-md'
                            : 'bg-[#182236] text-gray-400 hover:text-white'
                        }`}
                      >
                        <Layers size={14} />
                        📊 Distribución Porcentual por Tiers (en todo el Star Cluster)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPlanetGenMode('single_ss')}
                        className={`flex-1 py-2 text-xs font-bold uppercase rounded transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          planetGenMode === 'single_ss'
                            ? 'bg-cyan-600 text-white shadow-md'
                            : 'bg-[#182236] text-gray-400 hover:text-white'
                        }`}
                      >
                        <MapPin size={14} />
                        🎯 Sistema Solar Individual (Manual)
                      </button>
                    </div>
                  )}

                  <div className="bg-zinc-900/40 p-4 border border-zinc-850 rounded-xl space-y-3">
                    <span className="text-white font-bold text-[10px] uppercase block border-b border-zinc-800 pb-1">
                      1. SELECCIONAR JERARQUÍA PADRE
                    </span>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-[11px]">
                      <div>
                        <label className="text-[9px] text-zinc-500 block mb-1">Paso 1: Galaxy Cluster (GC):</label>
                        <select className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded text-white font-bold text-[11px] outline-none cursor-pointer" value={parentGcId} onChange={e => setParentGcId(e.target.value)}>
                          <option value="">-- Seleccionar Galaxy Cluster ({dbClusters.length}) --</option>
                          {dbClusters.map((c, idx) => <option key={c.id || `parentgc-${idx}`} value={c.id}>{c.name || c.id} ({c.id})</option>)}
                        </select>
                      </div>

                      {(selectedEntityType === 'SC' || selectedEntityType === 'SS' || selectedEntityType === 'PLANET') && (
                        <div>
                          <label className="text-[9px] text-zinc-500 block mb-1">Paso 2: Galaxia Padre:</label>
                          <select className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded text-white text-[11px] outline-none cursor-pointer" value={parentGalaxyId} onChange={e => setParentGalaxyId(e.target.value)}>
                            <option value="">-- Seleccionar Galaxia ({dbGalaxies.length}) --</option>
                            {dbGalaxies.map((g, idx) => <option key={g.id || `parentgal-${idx}`} value={g.id}>Galaxy {g.galaxy_number || idx + 1}</option>)}
                          </select>
                        </div>
                      )}

                      {(selectedEntityType === 'SS' || selectedEntityType === 'PLANET') && (
                        <div>
                          <label className="text-[9px] text-zinc-500 block mb-1">Paso 3: Star Cluster (SC) Padre:</label>
                          <select className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded text-white text-[11px] outline-none cursor-pointer" value={parentScId} onChange={e => setParentScId(e.target.value)}>
                            <option value="">-- Seleccionar Star Cluster ({dbStarClusters.length}) --</option>
                            {dbStarClusters.map((sc, idx) => <option key={sc.id || `parentsc-${idx}`} value={sc.id}>Star Cluster {sc.sc_number || idx + 1}</option>)}
                          </select>
                        </div>
                      )}

                      {selectedEntityType === 'PLANET' && planetGenMode === 'single_ss' && (
                        <div>
                          <label className="text-[9px] text-zinc-500 block mb-1">Paso 4: Star System Padre:</label>
                          <select className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded text-white text-[11px] outline-none cursor-pointer" value={parentSystemId} onChange={e => setParentSystemId(e.target.value)}>
                            <option value="">-- Seleccionar Star System ({dbStarSystems.length}) --</option>
                            {dbStarSystems.map((sys, idx) => <option key={sys.id || `parentsys-${idx}`} value={sys.id}>{sys.name_code || `SYS-${idx + 1}`}</option>)}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* VISTA A: DISTRIBUCIÓN PORCENTUAL POR TIERS (PLANETAS) */}
                  {selectedEntityType === 'PLANET' && planetGenMode === 'distribution_sc' ? (
                    <div className="bg-zinc-900/40 p-4 border border-zinc-850 rounded-xl space-y-4">
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                        <span className="text-cyan-400 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                          <Layers size={14} />
                          2. REGLAS DE DISTRIBUCIÓN PORCENTUAL EN STAR CLUSTER ({dbStarSystems.length} Sistemas Solares)
                        </span>

                        <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                          isTierPctValid
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                            : 'bg-red-950 text-red-400 border-red-800 animate-pulse'
                        }`}>
                          SUMA: {totalTierPct}% {isTierPctValid ? '✓ (VÁLIDO)' : '≠ 100% (REQUERIDO)'}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {distributionTiers.map((tier, idx) => (
                          <div key={idx} className="flex items-center gap-3 bg-[#0a0f18] border border-cyan-950 p-3 rounded-lg">
                            <span className="text-xs font-bold text-cyan-400 shrink-0 w-16">
                              TIER {idx + 1}:
                            </span>

                            <div className="flex-1">
                              <label className="text-[9px] text-gray-400 uppercase block mb-1">% de Sistemas Solares:</label>
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={tier.percentage}
                                  onChange={(e) => handleTierChange(idx, 'percentage', e.target.value === '' ? '' as any : Number(e.target.value))}
                                  className="w-full bg-[#121824] border border-[#232f48] text-amber-300 font-bold text-xs p-2 rounded outline-none"
                                />
                                <span className="text-xs font-bold">%</span>
                              </div>
                            </div>

                            <div className="flex-1">
                              <label className="text-[9px] text-gray-400 uppercase block mb-1">Planetas por Sistema:</label>
                              <input
                                type="number"
                                min={1}
                                max={50}
                                value={tier.planetsPerSS}
                                onChange={(e) => handleTierChange(idx, 'planetsPerSS', e.target.value === '' ? '' as any : Number(e.target.value))}
                                className="w-full bg-[#121824] border border-[#232f48] text-emerald-400 font-bold text-xs p-2 rounded outline-none"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => removeTier(idx)}
                              disabled={distributionTiers.length <= 1}
                              className="p-2 text-gray-500 hover:text-red-400 disabled:opacity-30 cursor-pointer transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={addTier}
                        className="w-full py-2 bg-[#121824] hover:bg-[#1a2336] border border-[#232f48] text-cyan-400 text-xs font-bold uppercase rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Plus size={14} /> Añadir Tier de Distribución
                      </button>

                      {/* CONFIGURACIÓN DE RECURSOS OVERRIDE PARA LA DISTRIBUCIÓN */}
                      <div className="bg-zinc-900/40 p-3 rounded-xl border border-zinc-850 space-y-2">
                        <div className="flex justify-between items-center border-b border-zinc-800 pb-1">
                          <span className="text-amber-400 font-bold text-[10px] uppercase">
                            3. ALTERAR CARACTERÍSTICAS MANUALLMENTE (OVERRIDE)
                          </span>
                          <input 
                            type="checkbox" 
                            checked={enableManualOverride} 
                            onChange={e => setEnableOverride(e.target.checked)} 
                            className="w-4 h-4 accent-amber-500 cursor-pointer" 
                          />
                        </div>

                        {enableManualOverride ? (
                          <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                            <div><span className="text-zinc-500 block text-[8px]">Duración Viaje Override (min):</span><input type="number" className="w-full bg-zinc-950 border border-zinc-800 p-1.5 rounded text-emerald-400 font-bold" value={overrideDuration} onChange={e => setOverrideDuration(e.target.value === '' ? '' : Number(e.target.value))} /></div>
                            <div><span className="text-zinc-500 block text-[8px]">Min Metal Base:</span><input type="number" className="w-full bg-zinc-950 border border-zinc-800 p-1.5 rounded text-white font-bold" value={overrideMinMetal} onChange={e => setOverrideMinMetal(e.target.value === '' ? '' : Number(e.target.value))} /></div>
                            <div><span className="text-zinc-500 block text-[8px]">Max Metal Base:</span><input type="number" className="w-full bg-zinc-950 border border-zinc-800 p-1.5 rounded text-white font-bold" value={overrideMaxMetal} onChange={e => setOverrideMaxMetal(e.target.value === '' ? '' : Number(e.target.value))} /></div>
                            <div><span className="text-zinc-500 block text-[8px]">Max Cristal Base:</span><input type="number" className="w-full bg-zinc-950 border border-zinc-800 p-1.5 rounded text-cyan-300 font-bold" value={overrideMaxCrystal} onChange={e => setOverrideMaxCrystal(e.target.value === '' ? '' : Number(e.target.value))} /></div>
                          </div>
                        ) : (
                          <p className="text-[9.5px] text-zinc-500 italic py-2 text-center">
                            Los planetas heredarán automáticamente la duración base ({activeClusterData?.base_duration_minutes || 60} min) y rangos del GC.
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        disabled={!isTierPctValid || !parentScId || loading}
                        onClick={handleCreatePlanetsWithDistribution}
                        className={`w-full py-3 text-xs font-black uppercase rounded-xl transition-all flex items-center justify-center gap-2 ${
                          isTierPctValid && parentScId && !loading
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white cursor-pointer shadow-lg shadow-emerald-950/50'
                            : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                        }`}
                      >
                        {loading ? <Loader className="animate-spin" size={16} /> : <Rocket size={16} />}
                        🚀 EJECUTAR DISTRIBUCIÓN PORCENTUAL DE PLANETAS EN SC
                      </button>
                    </div>
                  ) : (
                    /* VISTA B: CREACIÓN MANUAL TRADICIONAL */
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-zinc-900/40 p-4 border border-zinc-850 rounded-xl space-y-3">
                        <span className="text-white font-bold text-[10px] uppercase block border-b border-zinc-800 pb-1">
                          2. IDENTIFICADOR Y CREACIÓN EN LOTE (MASIVA)
                        </span>

                        <div className="grid grid-cols-2 gap-3 text-[11px]">
                          <div>
                            <label className="text-[9px] text-zinc-500 block mb-1">
                              {selectedEntityType === 'SS' ? 'Código Base (ej: ASW)' : 'Número / Correlativo Inicial:'}
                            </label>
                            <input 
                              type="text" 
                              className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded text-center text-white font-bold text-xs uppercase" 
                              value={childCodeOrNumber} 
                              onChange={e => setChildCodeOrNumber(e.target.value)} 
                            />
                          </div>

                          <div>
                            <label className="text-[9px] text-cyan-400 font-bold block mb-1">CANTIDAD A CREAR EN MASA:</label>
                            <input 
                              type="number" 
                              min={1} 
                              className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded text-center text-cyan-400 font-black text-xs" 
                              value={bulkQty} 
                              onChange={e => setBulkQty(e.target.value === '' ? '' : Number(e.target.value))} 
                            />
                          </div>
                        </div>
                      </div>

                      <div className="bg-zinc-900/40 p-4 border border-zinc-850 rounded-xl space-y-3">
                        <div className="flex justify-between items-center border-b border-zinc-800 pb-1">
                          <span className="text-amber-400 font-bold text-[10px] uppercase">
                            3. ALTERAR CARACTERÍSTICAS MANUALLMENTE (OVERRIDE)
                          </span>
                          <input 
                            type="checkbox" 
                            checked={enableManualOverride} 
                            onChange={e => setEnableOverride(e.target.checked)} 
                            className="w-4 h-4 accent-amber-500 cursor-pointer" 
                          />
                        </div>

                        {enableManualOverride ? (
                          <div className="space-y-2 text-[10px] animate-fadeIn">
                            <p className="text-[8.5px] text-zinc-400 italic">
                              Modificará el tiempo y rangos de esta entidad sin alterar a sus hermanas ni al Clúster padre.
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              <div><span className="text-zinc-500 block text-[8px]">Duración Viaje Override (min):</span><input type="number" className="w-full bg-zinc-950 border border-zinc-800 p-1.5 rounded text-emerald-400 font-bold" value={overrideDuration} onChange={e => setOverrideDuration(e.target.value === '' ? '' : Number(e.target.value))} /></div>
                              <div><span className="text-zinc-500 block text-[8px]">Min Metal Base:</span><input type="number" className="w-full bg-zinc-950 border border-zinc-800 p-1.5 rounded text-white font-bold" value={overrideMinMetal} onChange={e => setOverrideMinMetal(e.target.value === '' ? '' : Number(e.target.value))} /></div>
                              <div><span className="text-zinc-500 block text-[8px]">Max Metal Base:</span><input type="number" className="w-full bg-zinc-950 border border-zinc-800 p-1.5 rounded text-white font-bold" value={overrideMaxMetal} onChange={e => setOverrideMaxMetal(e.target.value === '' ? '' : Number(e.target.value))} /></div>
                              <div><span className="text-zinc-500 block text-[8px]">Max Cristal Base:</span><input type="number" className="w-full bg-zinc-950 border border-zinc-800 p-1.5 rounded text-cyan-300 font-bold" value={overrideMaxCrystal} onChange={e => setOverrideMaxCrystal(e.target.value === '' ? '' : Number(e.target.value))} /></div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-[9.5px] text-zinc-500 italic py-4 text-center">
                            Heredará automáticamente el tiempo de viaje ({activeClusterData?.base_duration_minutes || 60} min) y rangos de minado del Clúster padre.
                          </p>
                        )}
                      </div>

                      <button onClick={handleCreateChildEntitySubmit} className="col-span-2 w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black py-3 rounded-xl uppercase text-[11px] cursor-pointer shadow-lg">
                        Ejecutar Creación de {Number(bulkQty || 1)} {selectedEntityType}(s)
                      </button>
                    </div>
                  )}

                </div>
              )}

            </div>
          )}

          {/* 3. MODO EDICIÓN CON CASCADA COMPLETA DE SELECCIÓN */}
          {genConsoleMode === 'edition' && (
            <div className="bg-slate-950 p-6 border border-slate-850 rounded-xl space-y-6 shadow-xl animate-fadeIn">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-850 pb-3 gap-3">
                <span className="text-amber-400 font-bold text-xs uppercase tracking-wider block">
                  ✏️ CONSOLA DE EDICIÓN Y AJUSTE DE PARÁMETROS EXISTENTES
                </span>

                <div className="flex flex-wrap gap-2">
                  {!isBulkModeEdit && (
                    <button
                      onClick={handleDeleteSingleEntity}
                      disabled={!editSelectedEntityId}
                      className="px-3 py-1.5 bg-red-950/60 hover:bg-red-800 border border-red-700 text-red-300 font-bold text-[10px] uppercase rounded-lg transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
                      title="Eliminar únicamente la entidad seleccionada en el menú individual"
                    >
                      <Trash2 size={13} />
                      ELIMINAR {selectedEntityType}
                    </button>
                  )}

                  <button
                    onClick={handleDeleteBulkEntities}
                    className="px-4 py-1.5 bg-rose-900/80 hover:bg-rose-700 border border-rose-500 text-white font-black text-[10px] uppercase rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-rose-950/50"
                    title="Eliminar en masa los elementos seleccionados mediante checkboxes"
                  >
                    <Flame size={13} />
                    💥 ELIMINAR EN MASA ({isBulkModeEdit ? selectedBulkIdsEdit.length : 'BULK DELETE'})
                  </button>
                </div>
              </div>

              {/* TOGGLE MODO SELECCIÓN MÚLTIPLE EN EDICIÓN */}
              <div className="flex items-center justify-between bg-[#121927] border border-[#232f48] p-3 rounded-lg">
                <label className="flex items-center gap-3 text-xs font-bold text-gray-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isBulkModeEdit}
                    onChange={(e) => {
                      setIsBulkModeEdit(e.target.checked);
                      setSelectedBulkIdsEdit([]);
                    }}
                    className="w-4 h-4 accent-cyan-500 cursor-pointer"
                  />
                  <span>ACTIVAR MODO DE SELECCIÓN MÚLTIPLE (BULK DELETE MODE)</span>
                </label>

                {isBulkModeEdit && (
                  <button
                    onClick={handleToggleSelectAllEdition}
                    className="text-xs font-bold text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                  >
                    {isAllEditionSelected ? '☑ DESMARCAR TODO' : '☐ SELECCIONAR TODO'}
                  </button>
                )}
              </div>

              {/* SELECCIÓN DE OBJETIVO CON CASCADA COMPLETA (GC -> GAL -> SC -> SS -> PLANET) */}
              <div className="bg-zinc-900/40 p-4 border border-zinc-850 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-zinc-800 pb-2">
                  <span className="text-white font-bold text-[10px] uppercase block">
                    1. SELECCIONAR OBJETIVO A EDITAR [{selectedEntityType}]
                  </span>

                  {isBulkModeEdit && (
                    <input
                      type="text"
                      placeholder={`🔍 Buscar en ${selectedEntityType}...`}
                      value={searchTermEditGrid}
                      onChange={(e) => setSearchTermEditGrid(e.target.value)}
                      className="w-full sm:w-64 bg-zinc-950 border border-zinc-800 text-xs text-white px-3 py-1.5 rounded-lg focus:border-cyan-500 outline-none"
                    />
                  )}
                </div>

                {!isBulkModeEdit ? (
                  /* MODO SINGLE: CASCADA DE DESPLEGABLES SEGÚN EL TIPO SELECCIONADO */
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-[11px]">
                    {/* Nivel 1: Galaxy Cluster (Siempre visible) */}
                    <div>
                      <label className="text-[9px] text-zinc-500 block mb-1">Galaxy Cluster (GC):</label>
                      <select 
                        className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded text-white font-bold text-[11px] outline-none cursor-pointer" 
                        value={parentGcId} 
                        onChange={e => { 
                          setParentGcId(e.target.value); 
                          if (selectedEntityType === 'GC') handleLoadEntityForEdition(e.target.value); 
                        }}
                      >
                        <option value="">-- Seleccionar GC ({dbClusters.length}) --</option>
                        {dbClusters.map((c, idx) => <option key={c.id || `editgc-${idx}`} value={c.id}>{c.name || c.id} ({c.id})</option>)}
                      </select>
                    </div>

                    {/* Nivel 2: Galaxia (Visible para GALAXY, SC, SS, PLANET) */}
                    {(selectedEntityType === 'GALAXY' || selectedEntityType === 'SC' || selectedEntityType === 'SS' || selectedEntityType === 'PLANET') && (
                      <div>
                        <label className="text-[9px] text-zinc-500 block mb-1">Galaxia Padre:</label>
                        <select 
                          className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded text-white text-[11px] outline-none cursor-pointer" 
                          value={selectedEntityType === 'GALAXY' ? editSelectedEntityId : parentGalaxyId} 
                          onChange={e => {
                            if (selectedEntityType === 'GALAXY') {
                              handleLoadEntityForEdition(e.target.value);
                            } else {
                              setParentGalaxyId(e.target.value);
                            }
                          }}
                        >
                          <option value="">-- Seleccionar Galaxia ({dbGalaxies.length}) --</option>
                          {dbGalaxies.map((g, idx) => <option key={g.id || `editgal-${idx}`} value={g.id}>Galaxy {g.galaxy_number}</option>)}
                        </select>
                      </div>
                    )}

                    {/* Nivel 3: Star Cluster (Visible para SC, SS, PLANET) */}
                    {(selectedEntityType === 'SC' || selectedEntityType === 'SS' || selectedEntityType === 'PLANET') && (
                      <div>
                        <label className="text-[9px] text-zinc-500 block mb-1">Star Cluster (SC) Padre:</label>
                        <select 
                          className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded text-white text-[11px] outline-none cursor-pointer" 
                          value={selectedEntityType === 'SC' ? editSelectedEntityId : parentScId} 
                          onChange={e => {
                            if (selectedEntityType === 'SC') {
                              handleLoadEntityForEdition(e.target.value);
                            } else {
                              setParentScId(e.target.value);
                            }
                          }}
                        >
                          <option value="">-- Seleccionar SC ({dbStarClusters.length}) --</option>
                          {dbStarClusters.map((sc, idx) => <option key={sc.id || `editsc-${idx}`} value={sc.id}>Star Cluster {sc.sc_number}</option>)}
                        </select>
                      </div>
                    )}

                    {/* Nivel 4: Star System (Visible para SS, PLANET) */}
                    {(selectedEntityType === 'SS' || selectedEntityType === 'PLANET') && (
                      <div>
                        <label className="text-[9px] text-zinc-500 block mb-1">Star System (SS) Padre:</label>
                        <select 
                          className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded text-white text-[11px] outline-none cursor-pointer" 
                          value={selectedEntityType === 'SS' ? editSelectedEntityId : parentSystemId} 
                          onChange={e => {
                            if (selectedEntityType === 'SS') {
                              handleLoadEntityForEdition(e.target.value);
                            } else {
                              setParentSystemId(e.target.value);
                            }
                          }}
                        >
                          <option value="">-- Seleccionar Sistema ({dbStarSystems.length}) --</option>
                          {dbStarSystems.map((sys, idx) => <option key={sys.id || `editsys-${idx}`} value={sys.id}>{sys.name_code}</option>)}
                        </select>
                      </div>
                    )}

                    {/* Nivel 5: Planeta / Cuerpo (Visible sólo para PLANET) */}
                    {selectedEntityType === 'PLANET' && (
                      <div>
                        <label className="text-[9px] text-zinc-500 block mb-1">Seleccionar Planeta / Cuerpo:</label>
                        <select 
                          className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded text-white text-[11px] outline-none cursor-pointer" 
                          value={editSelectedEntityId} 
                          onChange={e => handleLoadEntityForEdition(e.target.value)}
                        >
                          <option value="">-- Seleccionar Elemento ({dbLocations.length}) --</option>
                          {dbLocations.map((loc, idx) => <option key={loc.id || `editloc-${idx}`} value={loc.id}>Elemento Nº {loc.planet_star_number}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                ) : (
                  /* MODO BULK: GRILLA DE CHECKBOXES PARA SELECCIÓN MÚLTIPLE DE BORRADO */
                  <div className="max-h-64 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pr-1">
                    {filteredEditionEntities.length === 0 ? (
                      <div className="col-span-full text-center py-8 text-gray-500 text-xs">
                        No se encontraron registros disponibles para {selectedEntityType}.
                      </div>
                    ) : (
                      filteredEditionEntities.map((item) => {
                        const isChecked = selectedBulkIdsEdit.includes(item.id);
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleToggleIndividualEdition(item.id)}
                            className={`p-3 rounded-lg border cursor-pointer select-none text-xs transition-all flex items-center justify-between ${
                              isChecked
                                ? 'bg-red-950/40 border-red-500 text-red-200 font-bold shadow-md shadow-red-950/50'
                                : 'bg-[#141b2d] border-[#202c44] text-gray-300 hover:border-gray-500'
                            }`}
                          >
                            <div className="flex items-center gap-3 truncate">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                readOnly
                                className="accent-red-500 w-4 h-4 cursor-pointer"
                              />
                              <div className="truncate">
                                <p className="font-bold truncate text-cyan-300">{item.name}</p>
                                <p className="text-[10px] text-gray-500 truncate">{item.id}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* FORMULARIO DE EDICIÓN DEL ELEMENTO SELECCIONADO */}
              {!isBulkModeEdit && (
                <div className="bg-zinc-900/40 p-5 border border-zinc-850 rounded-xl space-y-4">
                  <span className="text-amber-400 font-bold text-[10px] uppercase block border-b border-zinc-800 pb-1">
                    2. PARÁMETROS EDITABLES
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
                    <div>
                      <label className="text-[9px] text-zinc-500 block mb-1">Nombre / Identificador:</label>
                      <input type="text" className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded text-white font-bold" value={editName} onChange={e => setEditName(e.target.value)} />
                    </div>

                    <div>
                      <label className="text-[9px] text-zinc-500 block mb-1">Tiempo de Viaje (Minutos):</label>
                      <input type="number" className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded text-emerald-400 font-bold" value={editDuration} onChange={e => setEditDuration(e.target.value === '' ? '' : Number(e.target.value))} />
                    </div>

                    <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-2 bg-black/40 p-3 rounded-xl border border-zinc-850">
                      <div><span className="text-zinc-500 block text-[8px]">Min Metal Base:</span><input type="number" className="w-full bg-zinc-950 border border-zinc-800 p-1.5 rounded text-white font-bold" value={editMinMetal} onChange={e => setEditMinMetal(e.target.value === '' ? '' : Number(e.target.value))} /></div>
                      <div><span className="text-zinc-500 block text-[8px]">Max Metal Base:</span><input type="number" className="w-full bg-zinc-950 border border-zinc-800 p-1.5 rounded text-white font-bold" value={editMaxMetal} onChange={e => setEditMaxMetal(e.target.value === '' ? '' : Number(e.target.value))} /></div>
                      <div><span className="text-zinc-500 block text-[8px]">Min Cristal Base:</span><input type="number" className="w-full bg-zinc-950 border border-zinc-800 p-1.5 rounded text-cyan-300 font-bold" value={editMinCrystal} onChange={e => setEditMinCrystal(e.target.value === '' ? '' : Number(e.target.value))} /></div>
                      <div><span className="text-zinc-500 block text-[8px]">Max Cristal Base:</span><input type="number" className="w-full bg-zinc-950 border border-zinc-800 p-1.5 rounded text-cyan-300 font-bold" value={editMaxCrystal} onChange={e => setEditMaxCrystal(e.target.value === '' ? '' : Number(e.target.value))} /></div>
                    </div>

                    {/* EDICIÓN DE LOOT POOL CON BUSCADOR PREDICTOR */}
                    {selectedEntityType === 'GC' && (
                      <div className="md:col-span-2 bg-zinc-900/40 p-3 rounded-xl border border-zinc-850 space-y-2 mt-2">
                        <span className="text-emerald-400 font-bold text-[9.5px] uppercase block flex items-center gap-1">
                          <PackageOpen size={12} /> 🎁 EDICIÓN DE ASSETS OCULTOS / LOOT POOL
                        </span>

                        <div className="grid grid-cols-3 gap-2 items-start">
                          <div className="col-span-2 relative">
                            <input
                              type="text"
                              placeholder="🔍 Buscar Asset (Ej. Heavy Hunter, Mina, Escudo...)"
                              className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded text-white text-[10px] outline-none focus:border-cyan-500 uppercase"
                              value={lootSearchTermEdit}
                              onFocus={() => setShowLootSuggestionsEdit(true)}
                              onBlur={() => setTimeout(() => setShowLootSuggestionsEdit(false), 200)}
                              onChange={e => {
                                setLootSearchTermEdit(e.target.value);
                                setShowLootSuggestionsEdit(true);
                              }}
                            />

                            {showLootSuggestionsEdit && filteredSeedsEdit.length > 0 && (
                              <div className="absolute left-0 right-0 top-full mt-1 bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl z-[150] max-h-48 overflow-y-auto divide-y divide-zinc-900 text-[10px]">
                                {filteredSeedsEdit.map((asset) => (
                                  <div
                                    key={`seed-edit-${asset.id}`}
                                    className="p-2 hover:bg-cyan-950/60 hover:text-cyan-300 cursor-pointer flex justify-between items-center"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      setBindLootId(asset.id);
                                      setLootSearchTermEdit(`[${asset.type}] ${asset.name}`);
                                      setShowLootSuggestionsEdit(false);
                                    }}
                                  >
                                    <span className="font-bold text-zinc-200">[{asset.type}] {asset.name}</span>
                                    <span className="text-[8.5px] text-zinc-500 font-mono">{asset.id}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <input 
                            type="number" 
                            min={1} 
                            placeholder="Cant" 
                            className="bg-zinc-950 border border-zinc-800 p-2 rounded text-center text-emerald-400 font-bold text-[11px]" 
                            value={bindLootQty} 
                            onChange={e => setBindLootQty(e.target.value === '' ? '' : Number(e.target.value))} 
                          />
                        </div>

                        <button onClick={() => handleAddLootToGc('edit')} className="w-full bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 py-1.5 rounded uppercase font-bold text-[9px] cursor-pointer mt-1">
                          + Añadir Asset al Loot Pool
                        </button>

                        <div className="space-y-1 pt-1">
                          {editGcLootList.map((loot, idx) => (
                            <div key={`editloot-${idx}`} className="flex justify-between items-center bg-black/60 p-1.5 rounded text-[10px] border border-zinc-850">
                              <span className="text-zinc-200 font-bold truncate max-w-[150px]">[{loot.type}] {loot.asset_name}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-emerald-400 font-bold">x{loot.qty}</span>
                                <button onClick={() => handleRemoveLootFromGc('edit', loot.asset_id)} className="text-red-400 hover:text-red-300 cursor-pointer"><Trash2 size={12} /></button>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="pt-3 border-t border-zinc-800 mt-2">
                          <button onClick={() => {
                            if (editGcLootList.length === 0) return alert("No hay loot para repartir en este Clúster.");
                            const total = editGcLootList.reduce((a, b) => a + b.qty, 0);
                            alert(`✅ OPERACIÓN EXITOSA: El algoritmo procedural ha esparcido ${total} assets aleatoriamente y de forma equitativa entre todos los Planetas y Sistemas de este Galaxy Cluster.`);
                          }} className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black py-2 rounded uppercase text-[10px] cursor-pointer shadow-lg flex items-center justify-center gap-2">
                            <Zap size={13} /> Repartir Loot Equitativamente en Planetas
                          </button>
                        </div>
                      </div>
                    )}

                  </div>

                  <button onClick={handleSaveEditionSubmit} className="w-full bg-amber-600 hover:bg-amber-500 text-white font-black py-2.5 rounded-xl uppercase text-[11px] cursor-pointer shadow-lg">
                    Persistir Edición en Supabase
                  </button>
                </div>
              )}

            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default ExpeditionsManager;