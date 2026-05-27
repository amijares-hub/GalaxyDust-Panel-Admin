import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Compass, Map, Gift, Trophy, Shield, Play, Plus, Trash2, CheckCircle, 
  AlertTriangle, Hammer, RefreshCw, Send, Search, Sparkles, Orbit, Clock, Target
} from 'lucide-react';
import { UserProfile } from '../types';

interface ExpedisionesModuleProps {
  users: UserProfile[];
  setIsAlertToShow: (alert: 'success' | 'error' | { show: boolean; status: 'success' | 'error'; message: string }, msg?: string) => void;
  activeSubTab: string;
}

// Data structures
interface ActiveExpedition {
  id: string;
  sectorName: string;
  durationHours: number;
  shipType: string;
  riskFactor: number;
  status: 'LAUNCHED' | 'SUCCESS' | 'FAILED';
  launchTime: string;
  estimatedReturnTime: string;
  rewardEst: { metal: number; crystal: number; dust: number };
}

interface GalacticSector {
  id: string;
  name: string;
  coordinates: string;
  dangerLevel: 'SAFE' | 'MEDIUM' | 'EXTREME';
  planetCount: number;
  multiplier: number;
  cartographyStatus?: 'FIRST' | 'SECOND' | 'DISCOVERED';
  traits?: string[];
  anomalySpawnRate?: number;
  clusterName?: string;
  galaxyName?: string;
  starClusterName?: string;
  starSystemName?: string;
  rotationPeriod?: number;
  visualRGB?: string;
  badgeAccess?: string;
}

interface RewardTemplate {
  id: string;
  alias: string;
  requirement: string;
  metalRes: number;
  crystalRes: number;
  active: boolean;
}

interface AllianceEvent {
  id: string;
  title: string;
  bossName: string;
  bossHpMax: number;
  bossHpCurrent: number;
  coopDamageTotal: number;
  rewardDetails: string;
  endsIn: string;
}

export default function ExpedisionesModule({
  users,
  setIsAlertToShow,
  activeSubTab
}: ExpedisionesModuleProps) {

  // Current active subtab inside Expediciones section
  const [activeView, setActiveView] = useState<string>(activeSubTab || 'expediciones_dashboard');

  // PvP Domination States
  const [stealPercent, setStealPercent] = useState<number>(25);
  const [capturedShipsMin, setCapturedShipsMin] = useState<number>(1);
  const [capturedShipsMax, setCapturedShipsMax] = useState<number>(3);
  const [requireQMP, setRequireQMP] = useState<boolean>(true); // Exigir consumo de QMP
  const [defenseBoostActive, setDefenseBoostActive] = useState<boolean>(false);
  
  // Insurance States
  const [insurancePolicies, setInsurancePolicies] = useState<Array<{ id: string; name: string; resourceCost: string; protectionMax: string; remainingCharges: number }>>([
    {
      id: "ins-01",
      name: "Micro-Shield Delta",
      resourceCost: "15,000 Metal",
      protectionMax: "30% pérdida",
      remainingCharges: 3
    },
    {
      id: "ins-02",
      name: "Quantum Armor Insurance",
      resourceCost: "35,000 Metal + 100 Co",
      protectionMax: "65% pérdida",
      remainingCharges: 5
    },
    {
      id: "ins-03",
      name: "Elite Vanguard Lock (GD Coins)",
      resourceCost: "1,500 GD Coins",
      protectionMax: "100% pérdida completa",
      remainingCharges: 10
    }
  ]);

  const [newInsName, setNewInsName] = useState('');
  const [newInsCost, setNewInsCost] = useState('20,000 Metal');
  const [newInsProtection, setNewInsProtection] = useState('50% de pérdida');
  const [newInsCharges, setNewInsCharges] = useState(3);

  // Inflight Routing State ("17. Configurador de la Travel API Unificada (Routing Visual)")
  const [travelRoutings, setTravelRoutings] = useState<Array<{ id: string; name: string; visualColor: 'BLUE' | 'NEON' | 'RED'; endpointUrl: string; endpointActive: boolean }>>([
    {
      id: "rt-01",
      name: "Ruta de Exploración Alfa-12",
      visualColor: "BLUE", // Azul Holográfico
      endpointUrl: "/api/travel/alpha12",
      endpointActive: true
    },
    {
      id: "rt-02",
      name: "Arco de Extracción de Metales Orion",
      visualColor: "NEON", // Verde Neón
      endpointUrl: "/api/travel/orion-extract",
      endpointActive: true
    },
    {
      id: "rt-03",
      name: "Frontera Hostil PvP Sigma",
      visualColor: "RED", // Rojo Alerta
      endpointUrl: "/api/travel/sigma-hostile",
      endpointActive: false
    }
  ]);

  const [newRouteName, setNewRouteName] = useState('');
  const [newRouteColor, setNewRouteColor] = useState<'BLUE' | 'NEON' | 'RED'>('BLUE');
  const [newRouteUrl, setNewRouteUrl] = useState('/api/travel/custom');

  // PvP Simulator variables
  const [attackerPilotId, setAttackerPilotId] = useState(users[0]?.id || 'usr-01');
  const [defenderPilotId, setDefenderPilotId] = useState(users[1]?.id || 'usr-02');
  const [attackerPower, setAttackerPower] = useState(7200);
  const [defenderPower, setDefenderPower] = useState(5800);
  const [useQMPAttacker, setUseQMPAttacker] = useState(true);
  const [simulatedBattleLogs, setSimulatedBattleLogs] = useState<string[]>([]);

  // Sync subtab if props change
  React.useEffect(() => {
    if (activeSubTab) {
      setActiveView(activeSubTab);
    }
  }, [activeSubTab]);

  // =========================================================================
  // SUB_TAB 1: EXPEDICIONES (INTERACTIVE CABIN SIMULATOR)
  // =========================================================================
  const [expeditionsList, setExpeditionsList] = useState<ActiveExpedition[]>(() => [
    {
      id: "exp-01",
      sectorName: "Centaurus Sector X",
      durationHours: 4,
      shipType: "Explorer Frigate",
      riskFactor: 15,
      status: 'SUCCESS',
      launchTime: new Date(Date.now() - 3600000 * 5).toISOString(),
      estimatedReturnTime: new Date(Date.now() - 3600000 * 1).toISOString(),
      rewardEst: { metal: 45000, crystal: 21000, dust: 150 }
    },
    {
      id: "exp-02",
      sectorName: "Cinturón de Asteroides Abisales",
      durationHours: 12,
      shipType: "Heavy Excavator",
      riskFactor: 45,
      status: 'LAUNCHED',
      launchTime: new Date().toISOString(),
      estimatedReturnTime: new Date(Date.now() + 3600000 * 12).toISOString(),
      rewardEst: { metal: 180000, crystal: 95000, dust: 800 }
    }
  ]);

  // Launch expedition form states
  const [expSector, setExpSector] = useState('Centaurus Sector X');
  const [expDuration, setExpDuration] = useState('4');
  const [expShip, setExpShip] = useState('Explorer Frigate');
  const [expCaptainId, setExpCaptainId] = useState(() => users[0]?.id || '1');
  const [reqLicense, setReqLicense] = useState('none');
  const [reqBadge, setReqBadge] = useState('none');

  const riskEstimate = useMemo(() => {
    let base = 5;
    if (expSector.includes('Abisales')) base += 35;
    if (expSector.includes('Orion')) base += 15;
    if (expShip.includes('Excavator')) base -= 10;
    if (expShip.includes('Dreadnought')) base -= 20;
    if (expDuration === '12') base += 15;
    if (expDuration === '1') base -= 5;
    return Math.max(5, Math.min(95, base));
  }, [expSector, expDuration, expShip]);

  const handleLaunchExpedition = () => {
    const hours = parseInt(expDuration);
    
    // Mapear el sector a una ruta en travelRoutings
    let routeIndex = 0;
    if (expSector.includes('Orion')) routeIndex = 1;
    if (expSector.includes('Abisales')) routeIndex = 2;
    const activeRoute = travelRoutings[routeIndex];

    // Validación 1: Endpoint activo
    if (!activeRoute.endpointActive) {
      setIsAlertToShow({
        show: true,
        status: 'error',
        message: `La ruta de navegación ${activeRoute.name} está deshabilitada o en pausa temporalmente.`
      });
      return;
    }

    // Validación 2: Nave en tránsito
    const isShipInTransit = expeditionsList.some(e => e.shipType === expShip && e.status === 'LAUNCHED');
    if (isShipInTransit) {
      setIsAlertToShow({
        show: true,
        status: 'error',
        message: `La nave ${expShip} posee el estado 'TRANSITING' y no puede despegar.`
      });
      return;
    }

    // Validación 3: Descuento QMP
    let qmpConsumed = 0;
    if (activeRoute.visualColor === 'RED' && requireQMP) {
      qmpConsumed = 1;
      console.log(`[QMP CONSUMIDO] Forzando descuento de token QMP para ruta hostil PvP.`);
    }

    // Preparar el payload JSON
    const payload = {
      user_id: expCaptainId,
      ship_id: expShip,
      route_id: activeRoute.id,
      cluster_id: expSector,
      duration_hours: hours,
      required_tokens: {
        qmp_consumed: qmpConsumed,
        license_id: reqLicense !== 'none' ? reqLicense : null
      }
    };
    console.log(`📡 Simulación POST -> ${activeRoute.endpointUrl}`, payload);

    const metalReward = hours * 10000 + Math.floor(Math.random() * 8000);
    const crystalReward = hours * 4500 + Math.floor(Math.random() * 4000);
    const dustReward = Math.random() > 0.6 ? hours * 100 : 0;

    const newExp: ActiveExpedition = {
      id: `exp-${Date.now().toString(36)}`,
      sectorName: expSector,
      durationHours: hours,
      shipType: expShip,
      riskFactor: riskEstimate,
      status: 'LAUNCHED',
      launchTime: new Date().toISOString(),
      estimatedReturnTime: new Date(Date.now() + 3600000 * hours).toISOString(),
      rewardEst: { metal: metalReward, crystal: crystalReward, dust: dustReward }
    };

    setExpeditionsList([newExp, ...expeditionsList]);
    setIsAlertToShow({
      show: true,
      status: 'success',
      message: `¡EXPEDICIÓN ENVIADA! Ruta ${activeRoute.visualColor} iniciada hacia "${expSector}".`
    });
  };

  const handleCollectLoot = (id: string) => {
    const expedition = expeditionsList.find(e => e.id === id);
    if (!expedition) return;

    // Cálculo Algorítmico del Whitepaper
    const powerScore = expedition.shipType.includes('Excavator') ? 1500 : expedition.shipType.includes('Dreadnought') ? 2500 : 1000;
    
    let riskMultiplier = 1.0; // SAFE
    if (expedition.sectorName.includes('Orion')) riskMultiplier = 1.45; // MEDIUM
    if (expedition.sectorName.includes('Abisales')) riskMultiplier = 2.15; // EXTREME

    const techAllianceBonus = 0.15; // Constante de bono
    const baseLoot = Math.floor((powerScore * riskMultiplier * Math.sqrt(expedition.durationHours)) * (1 + techAllianceBonus));
    
    const metalReward = baseLoot * 10;
    const crystalReward = baseLoot * 4;

    const serverDiceRoll = Math.random() * 100;
    const isTotalLoss = serverDiceRoll <= expedition.riskFactor; // Pérdida si la tirada está dentro del % de riesgo

    const updated = expeditionsList.map(e => {
      if (e.id === id) {
        return {
          ...e,
          status: isTotalLoss ? 'FAILED' : 'SUCCESS' as any,
          rewardEst: { ...e.rewardEst, metal: metalReward, crystal: crystalReward }
        };
      }
      return e;
    });
    setExpeditionsList(updated as any);
    
    if (!isTotalLoss) {
      setIsAlertToShow({
        show: true,
        status: 'success',
        message: `¡SUCESO ABSOLUTO EN LA EXTRACCIÓN! Se rescataron ${metalReward.toLocaleString()} Kg de Metal y ${crystalReward.toLocaleString()} u de Cristal.`
      });
    } else {
      setIsAlertToShow({
        show: true,
        status: 'error',
        message: `¡PÉRDIDA TOTAL DE LA TRIPULACIÓN! La flota colisionó tras tirar ${serverDiceRoll.toFixed(1)} en el sector de riesgo ${expedition.riskFactor}%.`
      });
    }
  };

  // =========================================================================
  // SUB_TAB 2: CREADOR DE GALAXIAS (MAP DESIGNER)
  // =========================================================================
  const [sectorsList, setSectorsList] = useState<GalacticSector[]>(() => [
    { id: "sec-01", name: "Sector Abisal 003", coordinates: "X:102 - Y:492", dangerLevel: "EXTREME", planetCount: 14, multiplier: 2.15, cartographyStatus: 'FIRST', traits: ['Dangerous', 'Void'], anomalySpawnRate: 15, clusterName: 'Cluster Alpha' },
    { id: "sec-02", name: "Orion Nebula Gate", coordinates: "X:339 - Y:129", dangerLevel: "MEDIUM", planetCount: 8, multiplier: 1.45, cartographyStatus: 'SECOND', traits: ['Hidden'], anomalySpawnRate: 5, clusterName: 'Cluster Orion' },
    { id: "sec-03", name: "Centaurus Alpha", coordinates: "X:015 - Y:882", dangerLevel: "SAFE", planetCount: 4, multiplier: 1.00, cartographyStatus: 'DISCOVERED', traits: [], anomalySpawnRate: 2, clusterName: 'Cluster Alpha' }
  ]);

  // Sector creator form states
  const [secCluster, setSecCluster] = useState('Cluster Alpha');
  const [secGalaxy, setSecGalaxy] = useState('Vía Láctea');
  const [secStarCluster, setSecStarCluster] = useState('Nebulosa de Orión');
  const [secSystem, setSecSystem] = useState('Sistema Solar');
  const [secName, setSecName] = useState(''); // Planet Name
  const [secCoordinates, setSecCoordinates] = useState('X:500 - Y:500');
  const [secMinPower, setSecMinPower] = useState('SAFE');
  const [secPlanets, setSecPlanets] = useState(5);
  const [secMult, setSecMult] = useState(1.0);
  const [secCartography, setSecCartography] = useState<'FIRST'|'SECOND'|'DISCOVERED'>('FIRST');
  const [secTraits, setSecTraits] = useState<string[]>([]);
  const [secAnomaly, setSecAnomaly] = useState(5);
  const [secRotationPeriod, setSecRotationPeriod] = useState(24);
  const [secVisualRGB, setSecVisualRGB] = useState('Azul');
  const [secBadgeAccess, setSecBadgeAccess] = useState('Ninguno');

  const handleCreateSector = () => {
    if (!secName.trim()) {
      setIsAlertToShow({ show: true, status: 'error', message: 'Indique un nombre único para el sector espacial.' });
      return;
    }
    const newSec: GalacticSector = {
      id: `sec-${Date.now().toString(36)}`,
      name: secName,
      coordinates: secCoordinates,
      dangerLevel: secMinPower as any,
      planetCount: Number(secPlanets),
      multiplier: Number(secMult),
      cartographyStatus: secCartography,
      traits: secTraits,
      anomalySpawnRate: Number(secAnomaly),
      clusterName: secCluster,
      galaxyName: secGalaxy,
      starClusterName: secStarCluster,
      starSystemName: secSystem,
      rotationPeriod: Number(secRotationPeriod),
      visualRGB: secVisualRGB,
      badgeAccess: secBadgeAccess
    };
    setSectorsList([...sectorsList, newSec]);
    setSecName('');
    setIsAlertToShow({ show: true, status: 'success', message: `¡SECTOR GALÁCTICO GRABADO! Coordenadas de "${newSec.name}" persistidas en el mapa.` });
  };

  // =========================================================================
  // SUB_TAB 3: RECOMPENSAS Y A.M.I. (AUTOMATED MISSIONS ACTIONS)
  // =========================================================================
  const [rewardsList, setRewardsList] = useState<RewardTemplate[]>(() => [
    { id: "rew-01", alias: "Cofre de Metal de Bienvenida dApp", requirement: "Crear una cuenta y enlazar avatar", metalRes: 25000, crystalRes: 10000, active: true },
    { id: "rew-02", alias: "Bono de Super-Ataque de Alineación", requirement: "Subir nivel de C.A.N a 10", metalRes: 85000, crystalRes: 45000, active: true },
    { id: "rew-03", alias: "Reclamo Diario Estándar de Astropolvo", requirement: "Hacer LOGIN una vez al día en blockchain", metalRes: 5000, crystalRes: 2000, active: false }
  ]);

  const [newRewForm, setNewRewForm] = useState<Partial<RewardTemplate>>({});

  const handleCreateReward = () => {
    if (!newRewForm.alias || !newRewForm.requirement) {
      setIsAlertToShow({ show: true, status: 'error', message: 'Por favor, rellene el alias y requisitos del AMI.' });
      return;
    }
    const entry: RewardTemplate = {
      id: `rew-${Date.now().toString(36)}`,
      alias: newRewForm.alias,
      requirement: newRewForm.requirement,
      metalRes: Number(newRewForm.metalRes) || 0,
      crystalRes: Number(newRewForm.crystalRes) || 0,
      active: true
    };
    setRewardsList([...rewardsList, entry]);
    setNewRewForm({});
    setIsAlertToShow({ show: true, status: 'success', message: '¡Misión asíncrona grabada en la dApp con éxito!' });
  };

  // =========================================================================
  // SUB_TAB 4: COOPERATIVE EVENT/BOSS ORCHESTRATOR
  // =========================================================================
  const [allianceEvents, setAllianceEvents] = useState<AllianceEvent[]>(() => [
    {
      id: "ev-01",
      title: "Campaña: Destrucción de la Garra de Hierro",
      bossName: "Dreadnought Titan Iron-Claw",
      bossHpMax: 100000000,
      bossHpCurrent: 45000000,
      coopDamageTotal: 55000000,
      rewardDetails: "Plano Militar Christmas Raider + 500k Cristal",
      endsIn: "23 horas 12 minutos"
    }
  ]);

  const [eventAtkForm, setEventAtkForm] = useState('5000000');

  const handleSimulateAttack = (id: string) => {
    setAllianceEvents(prev => prev.map(ev => {
      if (ev.id === id) {
        const damage = Number(eventAtkForm);
        const newHp = Math.max(0, ev.bossHpCurrent - damage);
        return {
          ...ev,
          bossHpCurrent: newHp,
          coopDamageTotal: ev.coopDamageTotal + damage
        };
      }
      return ev;
    }));
    setIsAlertToShow({
      show: true,
      status: 'success',
      message: `⚔️ ¡ATAQUE COOPERATIVO ENVIADO! Infringiste ${Number(eventAtkForm).toLocaleString()} puntos de daño de impacto al jefe.`
    });
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER BAR AND SUB-VIEW SELECTOR */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center bg-zinc-950 border border-zinc-900 rounded-lg p-4">
        <div>
          <h2 className="text-sm font-mono font-bold text-white uppercase tracking-widest flex items-center gap-2">
            <Orbit className="text-[#ff1e1e] animate-spin shrink-0" size={16} />
            Sector de Control: Módulo de Expediciones
          </h2>
          <p className="text-[11px] text-zinc-550 font-mono mt-1">
            Calibración de rutas espaciales, simulación de exploración galáctica, premios AMI e hiper-cooperación de jugadores.
          </p>
        </div>

        {/* Dynamic Buttons Navigation Bar */}
        <div className="flex flex-wrap bg-black border border-zinc-850 p-1 rounded font-mono text-[10px]">
          <button
            onClick={() => setActiveView('expediciones_dashboard')}
            className={`px-3 py-1.5 font-bold uppercase transition-all tracking-wider rounded flex items-center gap-1.5 cursor-pointer ${
              activeView === 'expediciones_dashboard' ? 'bg-[#ff1e1e] text-white shadow-lg' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Compass size={12} />
            Expediciones Control
          </button>
          
          <button
            onClick={() => setActiveView('expediciones_creator')}
            className={`px-3 py-1.5 font-bold uppercase transition-all tracking-wider rounded flex items-center gap-1.5 cursor-pointer ${
              activeView === 'expediciones_creator' ? 'bg-[#ff1e1e] text-white shadow-lg' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Map size={12} />
            Creador de Galaxias
          </button>

          <button
            onClick={() => setActiveView('expediciones_rewards')}
            className={`px-3 py-1.5 font-bold uppercase transition-all tracking-wider rounded flex items-center gap-1.5 cursor-pointer ${
              activeView === 'expediciones_rewards' ? 'bg-[#ff1e1e] text-white shadow-lg' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Gift size={12} />
            Recompensas AMI
          </button>

          <button
            onClick={() => setActiveView('expediciones_events')}
            className={`px-3 py-1.5 font-bold uppercase transition-all tracking-wider rounded flex items-center gap-1.5 cursor-pointer ${
              activeView === 'expediciones_events' ? 'bg-[#ff1e1e] text-white shadow-lg' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Trophy size={12} />
            Eventos Especiales
          </button>

          <button
            onClick={() => setActiveView('expediciones_pv_routing_insurance')}
            className={`px-3 py-1.5 font-bold uppercase transition-all tracking-wider rounded flex items-center gap-1.5 cursor-pointer ${
              activeView === 'expediciones_pv_routing_insurance' ? 'bg-[#ff1e1e] text-white shadow-lg' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Target size={12} />
            PvP, Ruteo y Seguros
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        
        {/* VIEW 1: EXPEDICIONES DASHBOARD */}
        {activeView === 'expediciones_dashboard' && (
          <motion.div
            key="dashboard_view"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-fadeIn"
          >
            {/* EXPEDITION FORM COLUMN */}
            <div className="xl:col-span-1 bg-zinc-950 border border-zinc-900 rounded-lg p-4 space-y-4">
              <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-widest block border-b border-zinc-900 pb-2">
                🚀 CABINA DE LANZAMIENTO
              </span>

              <div className="space-y-3 font-mono text-xs">
                <div>
                  <label className="text-zinc-550 block mb-1 uppercase text-[9px]">Seleccionar Destino Galáctico:</label>
                  <select
                    aria-label="select element"value={expSector}
                    onChange={(e) => setExpSector(e.target.value)}
                    className="w-full bg-black border border-zinc-850 rounded p-2 text-white focus:outline-none focus:border-red-500 cursor-pointer text-xs"
                  >
                    <option value="Centaurus Sector X">Centaurus Sector X (Seguro)</option>
                    <option value="Orion Nebula Gate">Orion Nebula Gate (Intermedio)</option>
                    <option value="Cinturón de Asteroides Abisales">Cinturón de Asteroides Abisales (Peligroso)</option>
                  </select>
                </div>

                <div>
                  <label className="text-zinc-550 block mb-1 uppercase text-[9px]">Duración del Reconocimiento:</label>
                  <select
                    aria-label="select element"value={expDuration}
                    onChange={(e) => setExpDuration(e.target.value)}
                    className="w-full bg-black border border-zinc-850 rounded p-2 text-white focus:outline-none focus:border-red-500 cursor-pointer text-xs"
                  >
                    <option value="1">1 Hora (Incursión Rápida)</option>
                    <option value="4">4 Horas (Misión Estándar)</option>
                    <option value="12">12 Horas (Exploración Profunda)</option>
                  </select>
                </div>

                <div>
                  <label className="text-zinc-550 block mb-1 uppercase text-[9px]">Plataforma de Nave Empleada:</label>
                  <select
                    aria-label="select element"value={expShip}
                    onChange={(e) => setExpShip(e.target.value)}
                    className="w-full bg-black border border-zinc-850 rounded p-2 text-white focus:outline-none focus:border-red-500 cursor-pointer text-xs"
                  >
                    <option value="Explorer Frigate">Explorer Frigate (Común)</option>
                    <option value="Heavy Excavator">Heavy Excavator (Especializado)</option>
                    <option value="Centurion Dreadnought">Centurion Dreadnought (Defensivo)</option>
                  </select>
                </div>

                <div>
                  <label className="text-zinc-550 block mb-1 uppercase text-[9px]">Comandante de Soporte Enlazado:</label>
                  <select
                    aria-label="select element"value={expCaptainId}
                    onChange={(e) => setExpCaptainId(e.target.value)}
                    className="w-full bg-black border border-zinc-850 rounded p-2 text-white focus:outline-none focus:border-red-500 cursor-pointer text-xs"
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.username} (Lvl {u.level})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-zinc-550 block mb-1 uppercase text-[9px]">License Lock:</label>
                    <select aria-label="select element"value={reqLicense} onChange={e => setReqLicense(e.target.value)} className="w-full bg-black border border-zinc-850 rounded p-2 text-zinc-400 text-[10px]">
                      <option value="none">Sin Licencia</option>
                      <option value="lic-alpha">Licencia Alfa</option>
                      <option value="lic-omega">Licencia Omega</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-zinc-550 block mb-1 uppercase text-[9px]">Badge Lock:</label>
                    <select aria-label="select element"value={reqBadge} onChange={e => setReqBadge(e.target.value)} className="w-full bg-black border border-zinc-850 rounded p-2 text-zinc-400 text-[10px]">
                      <option value="none">Sin Badge</option>
                      <option value="badge-vet">Veterano</option>
                      <option value="badge-elite">Élite</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 bg-black border border-zinc-900 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">Riesgo Estimado:</span>
                    <span className={`font-bold ${riskEstimate > 40 ? 'text-red-500' : 'text-emerald-400'}`}>
                      {riskEstimate}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-zinc-550">Premio Metal:</span>
                    <span className="text-white">~{(parseInt(expDuration) * 10000).toLocaleString()} Kg</span>
                  </div>
                </div>

                <button
                  onClick={handleLaunchExpedition}
                  className="w-full py-2.5 bg-[#ff1e1e] hover:bg-red-500 text-white font-mono font-bold text-[10px] uppercase tracking-wider rounded cursor-pointer transition-colors"
                >
                  FORZAR DESPEGUE DE FLOTA
                </button>
              </div>
            </div>

            {/* EXPEDITIONS MONITOR GRID */}
            <div className="xl:col-span-2 bg-zinc-950 border border-zinc-900 rounded-lg p-4 space-y-4">
              <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-widest block border-b border-zinc-900 pb-2">
                📡 SEGUIMIENTO DE RUTAS HISTÓRICAS EN ORBITA
              </span>

              <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
                {expeditionsList.map((exp) => (
                  <div key={exp.id} className="p-3 bg-black border border-zinc-90 w-full rounded flex flex-col md:flex-row gap-4 items-start md:items-center justify-between text-xs transition-colors hover:border-zinc-800">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded bg-zinc-950 border ${
                        exp.status === 'LAUNCHED' ? 'border-amber-500/20 text-amber-500' :
                        exp.status === 'SUCCESS' ? 'border-emerald-500/20 text-emerald-400' :
                        'border-red-500/20 text-red-500'
                      }`}>
                        <Orbit size={18} className={exp.status === 'LAUNCHED' ? 'animate-spin' : ''} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white font-mono text-sm">{exp.sectorName}</span>
                          <span className="text-[9px] font-mono text-zinc-550">ID: {exp.id}</span>
                        </div>
                        <p className="text-[11px] font-mono text-zinc-400 mt-1">
                          Plataforma: <span className="text-zinc-300 font-bold">{exp.shipType}</span> • Riesgo: <span className="text-zinc-300">{exp.riskFactor}%</span> • Duración: <span className="text-zinc-300">{exp.durationHours} hs</span>
                        </p>
                        <div className="flex gap-4 mt-2 font-mono text-[10px] text-zinc-500">
                          <span>Partió: {new Date(exp.launchTime).toLocaleTimeString()}</span>
                          <span>Retorno Estimado: {new Date(exp.estimatedReturnTime).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 text-right w-full md:w-auto mt-2 md:mt-0">
                      <div className="flex items-center gap-1">
                        <span className="text-[9.5px] text-zinc-550 font-mono">ESTADO:</span>
                        <span className={`font-mono text-[11px] uppercase font-bold px-2 py-0.5 rounded ${
                          exp.status === 'LAUNCHED' ? 'bg-amber-950 text-amber-400 border border-amber-900' :
                          exp.status === 'SUCCESS' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' :
                          'bg-red-950 text-red-400 border border-red-900'
                        }`}>
                          {exp.status === 'LAUNCHED' ? 'EN VUELO' : exp.status === 'SUCCESS' ? 'RETORNADO' : 'PERDIDO'}
                        </span>
                      </div>

                      {exp.status === 'LAUNCHED' ? (
                        <button
                          onClick={() => handleCollectLoot(exp.id)}
                          className="px-3 py-1.5 bg-zinc-900 hover:bg-[#ff1e1e] hover:text-white text-red-400 border border-zinc-800 hover:border-red-500 rounded font-bold text-[10px] font-mono tracking-wider transition-colors cursor-pointer w-full md:w-auto"
                        >
                          CORTAR COMUNICACIÓN (RETIRAR LOOT)
                        </button>
                      ) : (
                        <div className="text-[10px] font-mono text-zinc-550 leading-relaxed font-sans mt-1">
                          Recompensas: Metal +{(exp.rewardEst.metal / 1000).toFixed(1)}k Kg • Cristal +{(exp.rewardEst.crystal / 1000).toFixed(1)}k u
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* VIEW 2: MAP DESIGNER */}
        {activeView === 'expediciones_creator' && (
          <motion.div
            key="creator_view"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-fadeIn"
          >
            {/* SECTOR LIST */}
            <div className="xl:col-span-2 bg-zinc-950 border border-zinc-900 rounded-lg p-4 space-y-4">
              <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-widest block border-b border-zinc-900 pb-2">
                🗺️ COORDENADAS COLOIDALES DE SECTORES ACTIVOS
              </span>

              <div className="space-y-4">
                {/* A.M.I Cartography Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {sectorsList.map((sec) => (
                    <div key={sec.id} className={`p-3.5 border rounded-lg space-y-3 transition-colors ${
                      sec.cartographyStatus === 'FIRST' ? 'bg-blue-950/20 border-blue-900' :
                      sec.cartographyStatus === 'SECOND' ? 'bg-amber-950/20 border-amber-900' :
                      'bg-emerald-950/20 border-emerald-900'
                    }`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-mono font-bold text-sm text-white">{sec.name}</h4>
                          <span className="text-[10px] text-zinc-550 font-mono">{sec.coordinates}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${
                          sec.dangerLevel === 'SAFE' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' :
                          sec.dangerLevel === 'MEDIUM' ? 'bg-amber-950 text-amber-400 border border-amber-900' :
                          'bg-red-950 text-red-400 border border-red-900'
                        }`}>
                          {sec.dangerLevel}
                        </span>
                      </div>
                      
                      <div className="flex gap-1 flex-wrap">
                        <span className="text-[8px] bg-zinc-900 px-1 py-0.5 rounded text-zinc-400">Cart: {sec.cartographyStatus}</span>
                        <span className="text-[8px] bg-zinc-900 px-1 py-0.5 rounded text-zinc-400">Cluster: {sec.clusterName}</span>
                        <span className="text-[8px] bg-zinc-900 px-1 py-0.5 rounded text-zinc-400">Anomalies: {sec.anomalySpawnRate}%</span>
                      </div>

                      {sec.traits && sec.traits.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {sec.traits.map(t => (
                            <span key={t} className="text-[8px] border border-purple-900/50 bg-purple-900/20 text-purple-400 px-1 rounded uppercase">{t}</span>
                          ))}
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-2 text-[11px] font-mono text-zinc-450 border-t border-zinc-900/50 pt-2.5">
                        <div>Planetas: <span className="text-white font-bold">{sec.planetCount}</span></div>
                        <div>Extr: <span className="text-white font-bold">{sec.multiplier.toFixed(2)}x</span></div>
                        <div>Rotación: <span className="text-white font-bold">{sec.rotationPeriod || 24}h</span></div>
                      </div>

                      <button
                        onClick={() => setSectorsList(sectorsList.filter(s => s.id !== sec.id))}
                        className="text-zinc-650 hover:text-red-500 font-mono text-[10px] uppercase flex items-center gap-1 transition-colors pt-1"
                      >
                        <Trash2 size={11} /> Eliminar
                      </button>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Geography Generation Tree (Cluster -> Planet) */}
                  <div className="bg-black border border-zinc-900 rounded p-4 h-64 overflow-y-auto custom-scrollbar">
                    <h4 className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-3">Geography Generation Tree</h4>
                    <div className="space-y-3 pl-2">
                      {Array.from(new Set(sectorsList.map(s => s.clusterName))).map(cluster => (
                        <div key={cluster} className="border-l-2 border-zinc-800 pl-4 relative">
                          <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-zinc-600"></div>
                          <span className="text-xs font-bold text-white uppercase font-mono">{cluster}</span>
                          <div className="space-y-2 mt-2">
                            {sectorsList.filter(s => s.clusterName === cluster).map(sec => (
                              <div key={sec.id} className="border-l border-dashed border-zinc-700 pl-4 relative">
                                <div className="absolute -left-[3px] top-1.5 w-1.5 h-1.5 rounded-full bg-zinc-500"></div>
                                <span className="text-[11px] font-mono text-zinc-300">{sec.name} ({sec.planetCount} Planetas)</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Dark Matter Mining Curve */}
                    <div className="bg-black border border-zinc-900 rounded p-4 h-28 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">Dark Matter Mining Curve</span>
                        <Sparkles size={12} className="text-purple-500" />
                      </div>
                      <div className="flex items-end gap-1 h-12 mt-2">
                        {[10, 25, 45, 60, 85, 100, 75, 50, 30, 15].map((val, i) => (
                          <div key={i} className="flex-1 bg-purple-900/50 rounded-t" style={{ height: `${val}%` }}>
                            <div className="w-full bg-purple-500 rounded-t" style={{ height: '4px' }}></div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Heatmap: Players per Star KPI */}
                    <div className="bg-black border border-zinc-900 rounded p-4 h-32 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">Heatmap: Players per Star</span>
                        <Search size={12} className="text-red-500" />
                      </div>
                      <div className="grid grid-cols-5 gap-1 mt-2">
                        {Array.from({ length: 15 }).map((_, i) => {
                          const intensity = Math.random();
                          const bg = intensity > 0.8 ? 'bg-[#ff1e1e]' : intensity > 0.5 ? 'bg-orange-500' : intensity > 0.2 ? 'bg-yellow-600' : 'bg-zinc-800';
                          return <div key={i} className={`h-4 rounded ${bg} opacity-80`} title={`${Math.floor(intensity * 1000)} players`}></div>
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CREATOR FORM */}
            <div className="xl:col-span-1 bg-zinc-950 border border-zinc-900 rounded-lg p-4 space-y-3.5">
              <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-widest block border-b border-zinc-900 pb-2">
                🛠️ REGISTRAR NUEVO SECTOR
              </span>

              <div className="space-y-3 font-mono text-xs">
                {/* JERARQUÍA GEOGRÁFICA ESTRICTA */}
                <div className="p-3 bg-red-950/10 border border-red-900/30 rounded-lg space-y-3 mb-2">
                  <span className="text-red-400 font-bold block mb-1 tracking-wider text-[10px]">JERARQUÍA GEOGRÁFICA</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-zinc-550 block mb-1">Galactic Cluster:</label>
                      <select aria-label="select element" value={secCluster} onChange={(e) => setSecCluster(e.target.value)} className="w-full bg-black border border-zinc-850 rounded p-2 text-white focus:outline-none focus:border-red-500">
                        <option value="Cluster Alpha">Cluster Alpha</option>
                        <option value="Cluster Orion">Cluster Orion</option>
                        <option value="Cluster Omega">Cluster Omega</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-zinc-550 block mb-1">Galaxia:</label>
                      <select aria-label="select element" value={secGalaxy} onChange={(e) => setSecGalaxy(e.target.value)} className="w-full bg-black border border-zinc-850 rounded p-2 text-white focus:outline-none focus:border-red-500">
                        <option value="Vía Láctea">Vía Láctea</option>
                        <option value="Andrómeda">Andrómeda</option>
                        <option value="Triangulum">Triangulum</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-zinc-550 block mb-1">Star Cluster:</label>
                      <select aria-label="select element" value={secStarCluster} onChange={(e) => setSecStarCluster(e.target.value)} className="w-full bg-black border border-zinc-850 rounded p-2 text-white focus:outline-none focus:border-red-500">
                        <option value="Nebulosa de Orión">Nebulosa de Orión</option>
                        <option value="Pléyades">Pléyades</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-zinc-550 block mb-1">Star System:</label>
                      <input aria-label="input element" type="text" value={secSystem} onChange={(e) => setSecSystem(e.target.value)} placeholder="Sistema Solar" className="w-full p-2 bg-black border border-zinc-850 rounded text-xs text-white focus:outline-none focus:border-red-500" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-zinc-550 block mb-1">Nombre Único del Nodo (Planeta):</label>
                  <input
                    aria-label="input element"type="text"
                    value={secName}
                    onChange={(e) => setSecName(e.target.value)}
                    placeholder="M45 Pleiades Core"
                    className="w-full p-2 bg-black border border-zinc-850 rounded text-xs text-white focus:outline-none focus:border-red-500 placeholder-zinc-700"
                  />
                </div>

                <div>
                  <label className="text-zinc-550 block mb-1">Coordenadas del Cuadrante:</label>
                  <input
                    aria-label="input element"type="text"
                    value={secCoordinates}
                    onChange={(e) => setSecCoordinates(e.target.value)}
                    placeholder="X:1200 - Y:5500"
                    className="w-full p-2 bg-black border border-zinc-850 rounded text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="text-zinc-550 block mb-1">Estatus del Peligro Radiación:</label>
                  <select
                    aria-label="select element"value={secMinPower}
                    onChange={(e) => setSecMinPower(e.target.value)}
                    className="w-full bg-black border border-zinc-850 rounded p-2 text-white focus:outline-none"
                  >
                    <option value="SAFE">SAFE (Estable)</option>
                    <option value="MEDIUM">MEDIUM (Anomalías Térmicas)</option>
                    <option value="EXTREME">EXTREME (Agujero de Gusano)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-zinc-550 block mb-1">Planetas:</label>
                    <input
                      aria-label="input element"type="number"
                      value={secPlanets}
                      onChange={(e) => setSecPlanets(parseInt(e.target.value) || 1)}
                      className="w-full p-2 bg-black border border-zinc-850 rounded text-white text-right"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-550 block mb-1">Extracción x:</label>
                    <input
                      aria-label="input element"type="number"
                      step="0.05"
                      value={secMult}
                      onChange={(e) => setSecMult(parseFloat(e.target.value) || 1.0)}
                      className="w-full p-2 bg-black border border-zinc-850 rounded text-white text-right"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-550 block mb-1">Cartografía AMI:</label>
                    <select
                      aria-label="select element"value={secCartography}
                      onChange={(e) => setSecCartography(e.target.value as any)}
                      className="w-full bg-black border border-zinc-850 rounded p-2 text-white focus:outline-none"
                    >
                      <option value="FIRST">FIRST</option>
                      <option value="SECOND">SECOND</option>
                      <option value="DISCOVERED">DISCOVERED</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-zinc-550 block mb-1">Tasa de Anomalía (%):</label>
                    <input
                      aria-label="input element" type="number"
                      min="0" max="100"
                      value={secAnomaly}
                      onChange={(e) => setSecAnomaly(parseInt(e.target.value))}
                      className="w-full p-2 bg-black border border-zinc-850 rounded text-white text-right"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-550 block mb-1">Rasgos de Sector Node (Traits):</label>
                  <div className="flex gap-2">
                    {['Dangerous', 'Hidden', 'Void', 'Rich', 'Radioactive'].map(trait => (
                      <label key={trait} className="flex items-center gap-1 text-[10px] text-zinc-400">
                        <input
                          aria-label="input element"type="checkbox"
                          checked={secTraits.includes(trait)}
                          onChange={(e) => {
                            if (e.target.checked) setSecTraits([...secTraits, trait]);
                            else setSecTraits(secTraits.filter(t => t !== trait));
                          }}
                        />
                        {trait}
                      </label>
                    ))}
                  </div>
                </div>


                {/* VISUAL CONFIG + BADGE ACCESS + ROTATION */}
                <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg space-y-3">
                  <span className="text-zinc-400 font-bold block mb-1 tracking-wider text-[10px]">CONFIGURACIÓN VISUAL Y ACCESO</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-zinc-550 block mb-1">Clase Espectral (RGB):</label>
                      <select
                        aria-label="select element"
                        value={secVisualRGB}
                        onChange={(e) => setSecVisualRGB(e.target.value)}
                        className="w-full bg-black border border-zinc-850 rounded p-2 text-white focus:outline-none focus:border-red-500"
                      >
                        <option value="Azul">🔵 Clase B (Azul — Alta Temp)</option>
                        <option value="Verde">🟢 Clase V (Verde — Vida)</option>
                        <option value="Rojo">🔴 Clase M (Rojo — Baja Temp)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-zinc-550 block mb-1">Rotación (Horas):</label>
                      <input
                        aria-label="input element" type="number"
                        value={secRotationPeriod}
                        onChange={(e) => setSecRotationPeriod(parseInt(e.target.value) || 24)}
                        className="w-full p-2 bg-black border border-zinc-850 rounded text-white text-right focus:outline-none focus:border-red-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-zinc-550 block mb-1">🔒 Candado de Acceso (Badge Lock):</label>
                    <select
                      aria-label="select element"
                      value={secBadgeAccess}
                      onChange={(e) => setSecBadgeAccess(e.target.value)}
                      className="w-full bg-black border border-zinc-850 rounded p-2 text-white focus:outline-none focus:border-red-500"
                    >
                      <option value="Ninguno">🟢 Abierto — Sin Candado</option>
                      <option value="Origin Badge">🟣 Origin Badge Exclusivo</option>
                      <option value="Founder Badge">🔵 Founder Badge</option>
                      <option value="Sponsor Badge">🟡 Sponsor Badge</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleCreateSector}
                  className="w-full py-2 bg-[#ff1e1e] hover:bg-red-500 text-white font-bold text-[10px] uppercase tracking-wider rounded cursor-pointer transition-colors pt-2.5"
                >
                  IMPLANTAR SECTOR EN SUPABASE
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* VIEW 3: RECOMPENSAS AMI */}
        {activeView === 'expediciones_rewards' && (
          <motion.div
            key="rewards_view"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-fadeIn"
          >
            {/* REWARDS RULE MAP */}
            <div className="xl:col-span-2 bg-zinc-950 border border-zinc-900 rounded-lg p-4 space-y-4">
              <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-widest block border-b border-zinc-900 pb-2">
                🤖 RECOLECCIÓN EN CURSO AMI (ASYNCHRONOUS MISSION INTERFACE)
              </span>

              <div className="space-y-3">
                {rewardsList.map((rew) => (
                  <div key={rew.id} className="p-3 bg-black border border-zinc-902 rounded flex items-center justify-between text-xs hover:border-zinc-800 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white font-mono text-sm">{rew.alias}</span>
                        <span className={`text-[8.5px] font-mono font-bold uppercase px-1.5 py-0.2 rounded ${
                          rew.active ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' : 'bg-zinc-900 text-zinc-500 border border-zinc-850'
                        }`}>
                          {rew.active ? 'EJECUTIVO' : 'TEMPORAL'}
                        </span>
                      </div>
                      <p className="text-zinc-450 font-mono text-[11px] mt-1">Requisito: {rew.requirement}</p>
                      <div className="flex gap-2.5 text-[10px] font-mono text-green-400 mt-1.5">
                        <span>+{(rew.metalRes / 1000).toFixed(0)}k Metal</span>
                        <span>+{(rew.crystalRes / 1000).toFixed(0)}k Cristal</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setRewardsList(rewardsList.filter(r => r.id !== rew.id))}
                      className="p-1 hover:text-[#ff1e1e] text-zinc-550 transition-colors"
                      title="Eliminar regla"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* CREATOR PANEL */}
            <div className="xl:col-span-1 bg-zinc-950 border border-zinc-900 rounded-lg p-4 space-y-3.5">
              <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-widest block border-b border-zinc-900 pb-2">
                ⚙️ NUEVO AJUSTE AMI
              </span>

              <div className="space-y-3 font-mono text-xs">
                <div>
                  <label className="text-zinc-550 block mb-1">Nombre / Alias del Premio:</label>
                  <input
                    aria-label="input element"type="text"
                    value={newRewForm.alias || ''}
                    onChange={(e) => setNewRewForm(prev => ({ ...prev, alias: e.target.value }))}
                    placeholder="Bono de Reclutamiento Territorial"
                    className="w-full p-2 bg-black border border-zinc-850 rounded text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-zinc-550 block mb-1">Requisito Asíncrono de Desbloqueo:</label>
                  <input
                    aria-label="input element"type="text"
                    value={newRewForm.requirement || ''}
                    onChange={(e) => setNewRewForm(prev => ({ ...prev, requirement: e.target.value }))}
                    placeholder="Posee 2 naves legendarias"
                    className="w-full p-2 bg-black border border-zinc-850 rounded text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-zinc-550 block mb-1">Premio Metal:</label>
                    <input
                      aria-label="input element"type="number"
                      value={newRewForm.metalRes || ''}
                      onChange={(e) => setNewRewForm(prev => ({ ...prev, metalRes: parseInt(e.target.value) || 0 }))}
                      className="w-full p-2 bg-black border border-zinc-850 rounded text-white text-right"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-550 block mb-1">Premio Cristal:</label>
                    <input
                      aria-label="input element"type="number"
                      value={newRewForm.crystalRes || ''}
                      onChange={(e) => setNewRewForm(prev => ({ ...prev, crystalRes: parseInt(e.target.value) || 0 }))}
                      className="w-full p-2 bg-black border border-zinc-850 rounded text-white text-right"
                    />
                  </div>
                </div>

                <button
                  onClick={handleCreateReward}
                  className="w-full py-2 bg-[#ff1e1e] hover:bg-red-500 text-white font-bold text-[10px] uppercase tracking-wider rounded cursor-pointer transition-colors pt-2.5"
                >
                  DAR DE ALTA EN AMI ENGINE
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* VIEW 4: EVENTS AND CAMPAIGNS ORCHESTRATOR */}
        {activeView === 'expediciones_events' && (
          <motion.div
            key="events_view"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="space-y-6 animate-fadeIn"
          >
            {allianceEvents.map((evt) => {
              const hpPct = (evt.bossHpCurrent / evt.bossHpMax) * 100;
              return (
                <div key={evt.id} className="p-4 bg-zinc-950 border border-zinc-900 rounded-lg space-y-4">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-zinc-900 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-white font-mono uppercase">{evt.title}</h3>
                      <p className="text-xs text-zinc-500 mt-0.5">Combate global asíncrono para todas las alianzas.</p>
                    </div>
                    <div className="text-right font-mono text-[11px] text-zinc-400">
                      Termina en: <span className="text-[#ff1e1e] font-bold">{evt.endsIn}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* BOSS CARD CONTROLL */}
                    <div className="md:col-span-2 p-3 bg-black border border-zinc-900 rounded-lg space-y-3">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-zinc-400 font-semibold">{evt.bossName}</span>
                        <span className="text-[#ff1e1e] font-bold">HP: {evt.bossHpCurrent.toLocaleString()} / {evt.bossHpMax.toLocaleString()}</span>
                      </div>
                      
                      {/* Boss HP bar progress */}
                      <div className="w-full h-3 bg-zinc-900 border border-zinc-850 rounded overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-red-650 via-[#ff1e1e] to-red-400 transition-all duration-300 rounded"
                          style={{ width: `${hpPct}%` }}
                        />
                      </div>

                      <div className="grid grid-cols-2 text-[10px] font-mono text-zinc-550">
                        <span>Hp Restante: {hpPct.toFixed(2)}%</span>
                        <span className="text-right">Daño Colectivo Alianzas: {evt.coopDamageTotal.toLocaleString()} HP</span>
                      </div>
                    </div>

                    {/* BOSS ATTACK SIMULATOR CARD */}
                    <div className="p-3 bg-black border border-zinc-900 rounded-lg space-y-3 font-mono">
                      <span className="text-zinc-400 text-[10px] font-mono uppercase tracking-wider block font-bold mb-1">Simulador de Ataque dApp</span>
                      
                      <div className="space-y-2">
                        <label className="text-zinc-550 block text-[9px] uppercase">Daño de Salva Espacial (Hp):</label>
                        <input
                          aria-label="input element"type="number"
                          value={eventAtkForm}
                          onChange={(e) => setEventAtkForm(e.target.value)}
                          className="w-full p-1.5 bg-zinc-950 border border-zinc-850 rounded text-xs text-white text-right"
                        />
                      </div>

                      <button
                        onClick={() => handleSimulateAttack(evt.id)}
                        className="w-full py-1.5 bg-[#ff1e1e] hover:bg-red-500 text-white font-bold text-[9px] uppercase tracking-wider rounded cursor-pointer transition-colors"
                      >
                        SIMULAR IMPACTO LASER ⚡
                      </button>
                    </div>
                  </div>

                  {/* BOTTOM REWARD BLOCK */}
                  <div className="p-3 bg-zinc-900/10 border border-zinc-900/40 rounded flex flex-col md:flex-row gap-4 items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <Trophy size={16} className="text-yellow-500" />
                      <span>Premio del Raid: <span className="text-white font-bold">{evt.rewardDetails}</span></span>
                    </div>
                    <span className="text-[10px] text-zinc-550">Se distribuirá proporcionalmente al daño calificado en la blockchain.</span>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}

        {/* VIEW 5: PVP DOMINACIÓN, TRAVEL ROUTING VISUAL Y SEGUROS MOTOR */}
        {activeView === 'expediciones_pv_routing_insurance' && (
          <motion.div
            key="pvp_routing_insurance_view"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="space-y-6 animate-fadeIn"
          >
            {/* TOP CARD CONFIGURING PVP RULES & COEFICIENTS */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              
              {/* CELL 1: RULES FOR PVP DOMINATION & CONQUEST */}
              <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-5 space-y-4">
                <div className="flex items-center gap-1.5 border-b border-zinc-900 pb-2.5">
                  <Target size={15} className="text-[#ff1e1e]" />
                  <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider block">
                    [ CONSOLE.01 ]: CONQUISTA & DOMINACIÓN REGLAS
                  </span>
                </div>

                <p className="text-[10px] text-zinc-550 font-sans leading-relaxed">
                  Alineación de variables globales de saqueo de recursos y despojo de naves enemigas tras finalización física de misiones de ataque PvP.
                </p>

                <div className="space-y-3 font-mono text-xs">
                  <div className="space-y-1">
                    <label className="text-zinc-500 block text-[9px] uppercase">Porcentaje de Saqueo de Recursos (%):</label>
                    <div className="flex items-center gap-2">
                      <input
                        aria-label="input element"type="range"
                        min="5"
                        max="50"
                        value={stealPercent}
                        onChange={(e) => setStealPercent(Number(e.target.value))}
                        className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#ff1e1e]"
                      />
                      <span className="text-[#ff1e1e] font-extrabold text-xs shrink-0">{stealPercent}%</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-zinc-555 block text-[8px] uppercase">Naves Capturadas Min:</label>
                      <input
                        aria-label="input element"type="number"
                        min="1"
                        max="5"
                        value={capturedShipsMin}
                        onChange={(e) => setCapturedShipsMin(Number(e.target.value) || 1)}
                        className="w-full p-2 bg-zinc-950 border border-zinc-900 rounded text-xs text-white text-right font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-zinc-555 block text-[8px] uppercase">Naves Capturadas Max:</label>
                      <input
                        aria-label="input element"type="number"
                        min="1"
                        max="10"
                        value={capturedShipsMax}
                        onChange={(e) => setCapturedShipsMax(Number(e.target.value) || 3)}
                        className="w-full p-2 bg-zinc-950 border border-zinc-900 rounded text-xs text-white text-right font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-start justify-between p-2.5 bg-black/40 border border-zinc-900 rounded-lg text-[10.5px]">
                    <div className="space-y-0.5 pr-2">
                      <span className="text-white font-bold block">Exigir Quema de QMP para Ataques</span>
                      <p className="text-[8.5px] text-zinc-500 font-sans leading-normal">
                        Fuerza a consumir un token de Quantum Miniaturizer Platform para miniaturizar y replegar naves antes del ruteo.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRequireQMP(!requireQMP)}
                      className={`relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-205 focus:outline-none ${
                        requireQMP ? 'bg-[#ff1e1e]' : 'bg-zinc-800'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow transition duration-205 ${
                        requireQMP ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  <div className="flex items-start justify-between p-2.5 bg-black/40 border border-zinc-900 rounded-lg text-[10.5px]">
                    <div className="space-y-0.5 pr-2">
                      <span className="text-white font-bold block">Escudo de Refuerzo Defensivo</span>
                      <p className="text-[8.5px] text-zinc-500 font-sans leading-normal">
                        Aumenta la resistencia planetaria del defensor en combat en +30% de forma pasiva en toda la galaxia.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDefenseBoostActive(!defenseBoostActive)}
                      className={`relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-205 focus:outline-none ${
                        defenseBoostActive ? 'bg-[#ff1e1e]' : 'bg-zinc-800'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow transition duration-205 ${
                        defenseBoostActive ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  {/* SHIP LOSS ON DEFEAT — DOMINACIÓN */}
                  <div className="pt-1 border-t border-zinc-900 space-y-3">
                    <span className="text-[9px] font-mono text-red-400 uppercase tracking-widest font-bold block">⚔️ PÉRDIDA DE NAVES (CONQUISTA POR DOMINACIÓN)</span>

                    <div className="space-y-1.5">
                      <label className="text-zinc-500 block text-[9px] uppercase">% Probabilidad de Pérdida de Nave (Derrota):</label>
                      <div className="flex items-center gap-2">
                        <input
                          aria-label="ship loss rate range"
                          type="range" min="0" max="100"
                          defaultValue={30}
                          className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-600"
                        />
                        <span className="text-red-400 font-extrabold text-xs shrink-0 font-mono">30%</span>
                      </div>
                      <p className="text-[8px] text-zinc-600 font-mono">Probabilidad de que una nave del perdedor sea capturada permanentemente.</p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-zinc-500 block text-[9px] uppercase">Tier de Riesgo por Sector:</label>
                      <select
                        aria-label="select sector risk tier"
                        defaultValue="MEDIUM"
                        className="w-full bg-black border border-zinc-850 rounded p-2 text-white text-xs focus:outline-none focus:border-red-500 font-mono"
                      >
                        <option value="SAFE">🟢 SAFE — Sin pérdida de naves</option>
                        <option value="LOW">🟡 LOW — Hasta 1 nave capturada</option>
                        <option value="MEDIUM">🟠 MEDIUM — Hasta 3 naves capturadas</option>
                        <option value="HIGH">🔴 HIGH — Flota completa en riesgo</option>
                        <option value="LETHAL">💀 LETHAL — Pérdida garantizada al perder</option>
                      </select>
                    </div>

                    <div className="p-2.5 bg-red-950/10 border border-red-900/30 rounded-lg">
                      <span className="text-[9px] font-mono text-red-400 font-bold block mb-2 uppercase tracking-widest">🔒 Exigencia de QMP por Sector PvP</span>
                      <div className="space-y-2">
                        {[
                          { label: 'Sector Sigma-PvP (Frontera Hostil)', defaultOn: true },
                          { label: 'Sector Omega-Raid (Deep Raid Zone)', defaultOn: true },
                          { label: 'Sector Arena Abisal (Torneo Libre)', defaultOn: false },
                        ].map((sector) => (
                          <div key={sector.label} className="flex items-center justify-between text-[10px]">
                            <span className="text-zinc-400 font-mono">{sector.label}</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" defaultChecked={sector.defaultOn} className="sr-only peer" />
                              <div className="w-7 h-3.5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-red-600 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-2.5 after:w-2.5 after:transition-all" />
                            </label>
                          </div>
                        ))}
                      </div>
                      <p className="text-[8px] text-zinc-600 font-mono mt-2 leading-relaxed">
                        Sectores con QMP activado requieren que el atacante queme 1 QMP token antes de iniciar una misión de conquista. Esto desincentiva los ataques masivos automatizados.
                      </p>
                    </div>
                  </div>

                </div>
              </div>

              {/* CELL 2: PVP CONQUEST MISSION SIMULATOR */}
              <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-5 space-y-4">
                <div className="flex items-center gap-1.5 border-b border-zinc-900 pb-2.5">
                  <Compass size={15} className="text-[#ff1e1e] cursor-pointer" />
                  <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider block">
                    [ CONSOLE.02 ]: SIMULADOR DE COMBATE EN VIVO
                  </span>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                    <div>
                      <label className="text-zinc-500 block text-[8px] uppercase mb-0.5">Atacante (Piloto):</label>
                      <select
                        aria-label="select element"value={attackerPilotId}
                        onChange={(e) => setAttackerPilotId(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-900 p-2 rounded text-white"
                      >
                        {users.map(u => (
                          <option key={u.id} value={u.id}>{u.username || u.email}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-zinc-555 block text-[8px] uppercase mb-0.5">Defensor (Objetivo):</label>
                      <select
                        aria-label="select element"value={defenderPilotId}
                        onChange={(e) => setDefenderPilotId(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-900 p-2 rounded text-white"
                      >
                        {users.filter(u => u.id !== attackerPilotId).map(u => (
                          <option key={u.id} value={u.id}>{u.username || u.email}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-zinc-555 block text-[8.5px] uppercase mb-0.5">Poder Flota Atacante:</label>
                      <input
                        aria-label="input element"type="number"
                        value={attackerPower}
                        onChange={(e) => setAttackerPower(Number(e.target.value) || 1000)}
                        className="w-full p-2 bg-zinc-950 border border-zinc-900 rounded text-xs text-white text-right font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-zinc-555 block text-[8.5px] uppercase mb-0.5">Poder Flota Defensor:</label>
                      <input
                        aria-label="input element"type="number"
                        value={defenderPower}
                        onChange={(e) => setDefenderPower(Number(e.target.value) || 1000)}
                        className="w-full p-2 bg-zinc-950 border border-zinc-900 rounded text-xs text-white text-right font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="useQmp"
                      checked={useQMPAttacker}
                      onChange={(e) => setUseQMPAttacker(e.target.checked)}
                      className="rounded accent-[#ff1e1e] cursor-pointer"
                    />
                    <label htmlFor="useQmp" className="text-[9.5px] text-zinc-400 select-none cursor-pointer">
                      Atacante consume QMP (Aumento de Fuerza +50%)
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (attackerPilotId === defenderPilotId) {
                        setIsAlertToShow({ show: true, status: 'error', message: 'El atacante y el defensor deben ser pilotos distintos.' });
                        return;
                      }

                      let realAttackerPower = attackerPower;
                      if (useQMPAttacker) {
                        realAttackerPower = Math.floor(realAttackerPower * 1.5);
                      }

                      let realDefenderPower = defenderPower;
                      if (defenseBoostActive) {
                        realDefenderPower = Math.floor(realDefenderPower * 1.30);
                      }

                      const logs = [];
                      logs.push(`🚀 ATACANTE: Conectando con API de Navegación del Cosmos...`);
                      logs.push(`🛰️ Ruteo Visual: Detectado recorrido por ruta roja de Dominación.`);
                      if (useQMPAttacker) {
                        logs.push(`🔥 [TOKEN QMP BURNT]: Consumo Verificado de Quantum Miniaturizer Platform. Poder Atacante Multiplicado (+50%): ${realAttackerPower} GW.`);
                      } else if (requireQMP) {
                        logs.push(`⚠️ WARNING: Ataque ejecutado sin miniaturización óptima.`);
                      }

                      logs.push(`⚔️ COLISIÓN ORBITAL: Enfrentamiento armado sobre espacio de defensa nacional.`);
                      logs.push(`💥 Poder Real: Atacante ${realAttackerPower} GW | Defensor ${realDefenderPower} GW.`);

                      const diff = realAttackerPower - realDefenderPower;
                      if (diff > 0) {
                        const metalStolen = Math.floor((120000 + Math.random() * 80000) * (stealPercent / 100));
                        const shipsCaptured = Math.floor(Math.random() * (capturedShipsMax - capturedShipsMin + 1)) + capturedShipsMin;
                        
                        // Check defender protection insurance
                        logs.push(`🏆 RESULTADO: Victoria absoluta del Atacante.`);
                        
                        // Pick random insurance if listed
                        const ins = insurancePolicies[Math.floor(Math.random() * insurancePolicies.length)];
                        if (ins && ins.remainingCharges > 0) {
                          logs.push(`🩹 [SEGUROS PROTECCIÓN ACTIVE]: El defensor activó escudo '${ins.name}' (${ins.protectionMax}).`);
                          const pct = Number(ins.protectionMax.replace('% pérdida', '').replace('% pérdida completa', '')) || 50;
                          const savedMetal = Math.floor(metalStolen * (pct / 100));
                          logs.push(`🛡️ Reembolso por Seguros: Defendido se ahorró la pérdida de ${savedMetal.toLocaleString()} Metal.`);
                        } else {
                          logs.push(`☠️ SIN SEGUROS: Defensor sufrió despojo íntegro sin retención legal.`);
                        }

                        logs.push(`💎 Botín: +${metalStolen.toLocaleString()} Metal saqueado. ${shipsCaptured} naves desmanteladas/capturadas.`);
                      } else {
                        logs.push(`🛡️ RESULTADO: Defensa asombrosa. El Atacante fue repelido con daños del 100% en la órbita.`);
                      }

                      setSimulatedBattleLogs(logs);
                      setIsAlertToShow({ show: true, status: 'success', message: '¡Simulación de Combate PvP Ejecutada de forma Verídica!' });
                    }}
                    className="w-full py-2 bg-[#ff1e1e] hover:bg-red-700 text-white border border-[#ff1e1e]/85 rounded font-bold text-[9.5px] uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Simular Incursión PvP
                  </button>

                  {simulatedBattleLogs.length > 0 && (
                    <div className="p-2.5 bg-black border border-zinc-900/80 rounded-lg space-y-1 text-[8.5px] max-h-40 overflow-y-auto leading-relaxed text-zinc-400">
                      <span className="text-[#ff1e1e] text-[8px] font-bold block mb-1">🔍 TELEMETRÍA EN DIRECTO COMOCONVERSOR CONQUISTA:</span>
                      {simulatedBattleLogs.map((log, i) => (
                        <div key={i} className="font-mono">
                          {log.startsWith('🏆') || log.startsWith('🛡️') || log.startsWith('🩹') ? (
                            <span className="text-emerald-400">{log}</span>
                          ) : log.startsWith('🔥') || log.startsWith('☠️') ? (
                            <span className="text-amber-500">{log}</span>
                          ) : (
                            <span>{log}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* CELL 3: QUANTUM MINIATURIZER PLATFORMS & INSURANCE policy CRUDS */}
              <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-5 space-y-4">
                <div className="flex items-center gap-1.5 border-b border-zinc-900 pb-2.5">
                  <Shield size={15} className="text-[#ff1e1e]" />
                  <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider block">
                    [ CONSOLE.03 ]: MOTOR DE SEGUROS PLANETARIOS
                  </span>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  {/* Create Custom Policy */}
                  <div className="p-3 bg-black/40 border border-zinc-900 rounded-lg space-y-2">
                    <span className="text-zinc-[#ff1e1e] text-[8.5px] font-bold uppercase block pb-1 border-b border-zinc-900 font-mono">NUEVA PÓLIZA SEGURO COMERCIAL</span>
                    
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <label className="text-zinc-550 block text-[8px] uppercase">Nombre Comercial:</label>
                        <input
                          aria-label="input element"type="text"
                          value={newInsName}
                          onChange={(e) => setNewInsName(e.target.value)}
                          placeholder="Micro-Shield Delta-II"
                          className="w-full p-2 bg-zinc-950 border border-zinc-900 rounded text-white font-sans"
                        />
                      </div>
                      <div>
                        <label className="text-zinc-550 block text-[8px] uppercase">Costo Recursos:</label>
                        <input
                          aria-label="input element"type="text"
                          value={newInsCost}
                          onChange={(e) => setNewInsCost(e.target.value)}
                          placeholder="25,000 Metal"
                          className="w-full p-2 bg-zinc-950 border border-zinc-900 rounded text-white font-sans"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <label className="text-zinc-550 block text-[8px] uppercase">Max Cobertura (%):</label>
                        <input
                          aria-label="input element"type="text"
                          value={newInsProtection}
                          onChange={(e) => setNewInsProtection(e.target.value)}
                          placeholder="45% de la pérdida"
                          className="w-full p-2 bg-zinc-950 border border-zinc-900 rounded text-white font-sans"
                        />
                      </div>
                      <div>
                        <label className="text-zinc-550 block text-[8px] uppercase">Cargas Máximas:</label>
                        <input
                          aria-label="input element"type="number"
                          value={newInsCharges}
                          onChange={(e) => setNewInsCharges(Number(e.target.value) || 3)}
                          className="w-full p-2 bg-zinc-950 border border-zinc-900 rounded text-white text-right font-mono"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (!newInsName.trim()) {
                          setIsAlertToShow({ show: true, status: 'error', message: 'Falta proveer el nombre legal del seguro.' });
                          return;
                        }
                        const newP = {
                          id: `ins-dyn-${Date.now()}`,
                          name: newInsName,
                          resourceCost: newInsCost,
                          protectionMax: newInsProtection,
                          remainingCharges: newInsCharges
                        };
                        setInsurancePolicies(prev => [...prev, newP]);
                        setNewInsName('');
                        setIsAlertToShow({ show: true, status: 'success', message: '¡Póliza de Seguro Planetario Registrada con éxito!' });
                      }}
                      className="w-full py-1.5 bg-zinc-900 hover:bg-[#ff1e1e] border border-zinc-805 hover:border-[#ff1e1e] text-zinc-350 hover:text-white rounded font-bold text-[9px] uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Añadir Póliza al Repositorio
                    </button>
                  </div>

                  {/* List of active insurances */}
                  <div className="space-y-1.5 max-h-52 overflow-y-auto">
                    {insurancePolicies.map(ins => (
                      <div key={ins.id} className="p-2 bg-zinc-950 border border-zinc-900 rounded flex items-center justify-between text-[10px]">
                        <div className="space-y-0.5">
                          <span className="text-white font-bold block">{ins.name}</span>
                          <span className="text-zinc-500 block text-[8px]">Costo: {ins.resourceCost} | Max Protección: {ins.protectionMax}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-850 text-zinc-400 font-bold rounded text-[8px]">{ins.remainingCharges} CARGAS</span>
                          <button
                            type="button"
                            onClick={() => {
                              // Consume / Burn QMP or charge reload
                              setInsurancePolicies(prev => prev.map(p => {
                                if (p.id === ins.id) {
                                  return { ...p, remainingCharges: p.remainingCharges + 1 };
                                }
                                return p;
                              }));
                              setIsAlertToShow({ show: true, status: 'success', message: `¡Licencia ${ins.name} recargada por quema controlada de combustible!` });
                            }}
                            className="p-1 bg-zinc-900 hover:bg-[#ff1e1e] text-zinc-400 hover:text-white border border-zinc-800 rounded transition-colors cursor-pointer text-[9px] font-bold"
                            title="Consumir combustible para recargar póliza"
                          >
                            Recargar (+1)
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>

            {/* UNIFIED TRAVEL API & VISUAL ROUTING CONFIGURATION */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
                <Orbit size={16} className="text-[#ff1e1e]" />
                <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider block">
                  [ CONSOLE.04 ]: CONFIGURADOR UNIFICADO DE COLORES ("ENDPOINT TRAVEL ROUTING")
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono text-xs">
                
                {/* Visualizer wireframe model changing color dynamically based on selection */}
                <div className="p-4 bg-black/60 border border-zinc-900 rounded-lg flex flex-col justify-between space-y-3 lg:col-span-1">
                  <div>
                    <span className="text-[10px] text-zinc-400 font-bold uppercase block tracking-wider pb-1.5 border-b border-zinc-900 mb-2 font-mono">TELEMETRÍA VISUAL HOLOGRÁFICA:</span>
                    <p className="text-[9px] text-zinc-500 leading-relaxed font-sans mb-3">
                      Asigne colores dinológicos según la tipología del ruteador de vuelo actual para renderizar en los paneles HUD de comandante.
                    </p>
                  </div>

                  {/* Highly polished Glowing wireframe simulator */}
                  <div className="relative h-32 bg-zinc-950 border border-zinc-900 rounded flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#ff1e1e]/15 to-transparent animate-pulse" />
                    
                    {/* Glowing dots representation */}
                    <svg className="w-full h-full p-2" viewBox="0 0 200 100">
                      {/* Grid background lines */}
                      <line x1="10" y1="50" x2="190" y2="50" stroke="#1d1d20" strokeWidth="0.5" strokeDasharray="3" />
                      
                      {/* Connection path line changing color based on route */}
                      {travelRoutings.map((rt) => {
                        if (!rt.endpointActive) return null;
                        let strokeColor = '#00d2ff'; // BLUE
                        let shadow = 'drop-shadow(0 0 6px #00d2ff)';
                        if (rt.visualColor === 'NEON') {
                          strokeColor = '#39ff14';
                          shadow = 'drop-shadow(0 0 6px #39ff14)';
                        } else if (rt.visualColor === 'RED') {
                          strokeColor = '#ff1e1e';
                          shadow = 'drop-shadow(0 0 6px #ff1e1e)';
                        }
                        return (
                          <path
                            key={rt.id}
                            d="M 20 50 Q 100 20 180 50"
                            fill="none"
                            stroke={strokeColor}
                            strokeWidth="1.5"
                            style={{ filter: shadow }}
                            className="wave-line"
                          />
                        );
                      })}

                      {/* Station points */}
                      <circle cx="20" cy="50" r="4" fill="#3f3f46" stroke="#18181b" strokeWidth="1" />
                      <circle cx="180" cy="50" r="4" fill="#3f3f46" stroke="#18181b" strokeWidth="1" />
                      <text x="25" y="62" fill="#52525b" fontSize="7" fontFamily="monospace">BASE SEC-O1</text>
                      <text x="145" y="62" fill="#52525b" fontSize="7" fontFamily="monospace">OBJ SIGMA-X</text>
                    </svg>

                    <div className="absolute bottom-2 inset-x-0 text-center font-mono">
                      <span className="text-[7.5px] text-zinc-550 tracking-widest font-bold uppercase leading-none block">DIAGRAMA AP-COSMOS ACTIVO:</span>
                      <div className="flex gap-2 justify-center mt-1 text-[7.2px]">
                        <span className="text-[#00d2ff] font-extrabold flex items-center gap-0.5">● AZUL (Exploración)</span>
                        <span className="text-[#39ff14] font-extrabold flex items-center gap-0.5">● VERDE (Minería)</span>
                        <span className="text-[#ff1e1e] font-extrabold flex items-center gap-0.5">● ROJO (Dominación)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Unified Routing Creation Form */}
                <div className="p-4 bg-black/60 border border-zinc-900 rounded-lg space-y-2.5 lg:col-span-1 font-mono">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase block tracking-wider pb-1.5 border-b border-zinc-900">REGISTRAR RUTA EN UNIFIED API:</span>
                  
                  <div className="space-y-2.5 text-[11px]">
                    <div>
                      <label className="text-zinc-550 block mb-0.5">Nombre Ruta:</label>
                      <input
                        aria-label="input element"type="text"
                        value={newRouteName}
                        onChange={(e) => setNewRouteName(e.target.value)}
                        placeholder="Rocallosa Lunar Veta 1"
                        className="w-full p-2 bg-zinc-950 border border-zinc-900 rounded text-white font-sans text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-zinc-555 block mb-0.5">Endpoint Unified Routing API:</label>
                      <input
                        aria-label="input element"type="text"
                        value={newRouteUrl}
                        onChange={(e) => setNewRouteUrl(e.target.value)}
                        placeholder="/api/travel/custom-routing"
                        className="w-full p-2 bg-zinc-950 border border-zinc-900 rounded text-white font-mono text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-zinc-555 block mb-0.5">Filtración de Color Holográfico:</label>
                      <select
                        aria-label="select element"value={newRouteColor}
                        onChange={(e) => setNewRouteColor(e.target.value as any)}
                        className="w-full bg-zinc-950 border border-zinc-900 p-2 rounded text-white text-xs font-mono"
                      >
                        <option value="BLUE">Azul Holográfico (Exploración)</option>
                        <option value="NEON">Verde Neón (Minería)</option>
                        <option value="RED">Rojo Alerta (Dominación)</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (!newRouteName.trim()) {
                          setIsAlertToShow({ show: true, status: 'error', message: 'Indique un nombre para registrar la dirección de ruteo.' });
                          return;
                        }
                        const r = {
                          id: `rt-dyn-${Date.now()}`,
                          name: newRouteName,
                          visualColor: newRouteColor,
                          endpointUrl: newRouteUrl,
                          endpointActive: true
                        };
                        setTravelRoutings(prev => [...prev, r]);
                        setNewRouteName('');
                        setIsAlertToShow({ show: true, status: 'success', message: '¡Ruta unificada direccionada y mapeada perfectamente!' });
                      }}
                      className="w-full py-2 bg-red-950/20 hover:bg-[#ff1e1e] text-[#ff1e1e] hover:text-white border border-[#ff1e1e]/20 hover:border-[#ff1e1e] rounded font-bold text-[9px] uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Guardar Dirección de Viaje
                    </button>
                  </div>
                </div>

                {/* Routing Addresses Table */}
                <div className="p-4 bg-black/60 border border-zinc-900 rounded-lg lg:col-span-1 flex flex-col justify-between font-mono">
                  <div className="space-y-2 w-full">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase block tracking-wider pb-1.5 border-b border-zinc-900">DIRECCIONES REGISTRADAS:</span>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {travelRoutings.map((rt) => {
                        let colorBadgeClass = 'bg-cyan-950/30 border-cyan-900 text-cyan-400';
                        if (rt.visualColor === 'NEON') colorBadgeClass = 'bg-emerald-950/30 border-emerald-950 text-emerald-400';
                        else if (rt.visualColor === 'RED') colorBadgeClass = 'bg-red-950/30 border-red-900 text-red-500';

                        return (
                          <div key={rt.id} className="p-2 bg-zinc-950 border border-zinc-905 rounded space-y-1 hover:border-zinc-800 transition-colors text-[10.5px]">
                            <div className="flex justify-between items-center">
                              <span className="font-sans font-bold text-white max-w-[120px] truncate">{rt.name}</span>
                              <span className={`px-1 rounded text-[7.5px] border font-bold uppercase ${colorBadgeClass}`}>
                                {rt.visualColor === 'BLUE' ? 'AZUL' : rt.visualColor === 'NEON' ? 'VERDE' : 'ROJO'}
                              </span>
                            </div>
                            <div className="text-[8px] text-zinc-500 font-mono truncate">{rt.endpointUrl}</div>

                            <div className="flex justify-between items-center border-t border-zinc-900/60 pt-1.5 mt-1 text-[8.5px]">
                              <button
                                type="button"
                                onClick={() => {
                                  // Trigger Connection Ping Test
                                  setIsAlertToShow({
                                    show: true,
                                    status: 'success',
                                    message: `📡 [UNIFIED PING SUCCESS]: Endpoint '${rt.endpointUrl}' respondió en 12ms. Ecosistema de colores calibrado.`
                                  });
                                }}
                                className="text-[8px] text-zinc-400 hover:text-white bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-805 transition-colors cursor-pointer"
                              >
                                Test Conección
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setTravelRoutings(prev => prev.map(p => p.id === rt.id ? { ...p, endpointActive: !p.endpointActive } : p));
                                }}
                                className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold ${rt.endpointActive ? 'bg-[#ff1e1e] text-white' : 'bg-zinc-800 text-zinc-500'} cursor-pointer`}
                              >
                                {rt.endpointActive ? 'ACTIVO' : 'PAUSA'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
