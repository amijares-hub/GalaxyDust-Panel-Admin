import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Orbit, Compass, Search, Shield, Zap, AlertTriangle, Play, RefreshCw, 
  Trash2, Send, Clock, Radio, Power, Eye, Lock, Unlock, EyeOff, Dumbbell,
  Sliders, Award, Plus, Trash, HelpCircle, Flame, Server, BatteryCharging,
  Download, Activity, FileText
} from 'lucide-react';
import { UserProfile } from '../types';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceDot 
} from 'recharts';

interface ExpedicionesVueloModuleProps {
  users: UserProfile[];
  setIsAlertToShow: (alert: any, msg?: string) => void;
  activeSubTab: string;
}

export interface InFlightFleet {
  fleetId: string;
  commander: string;
  userId: string;
  shipType: string;
  state: 'Traveling' | 'Active' | 'Returning' | 'Finished';
  totalDuration: number; // in seconds
  timeLeft: number; // in seconds
  isInstantTravelUsed: boolean;
  isQuantumStealthEvasion: boolean;
  anomalyAbsorbed: boolean;
  darkMatterGenerated: number;
  ordersLawTriggered: boolean;
  phantomCoinsPrinted: number;
  hasSupernovaPhaseDisplacement: boolean;
  speedBoost: number; // Max 75
  fleetHpMax: number;
  fleetHpCurrent: number;
  canLocked: boolean;
  expeditionActive: boolean;
}

export interface SecurityExploitLog {
  id: string;
  timestamp: string;
  userId: string;
  commander: string;
  attemptedAction: string;
  severity: 'HIGH' | 'CRITICAL';
  status: 'BLOCKED' | 'FLAGGED';
}

export interface HealingRecord {
  id: string;
  timestamp: string;
  fleetId: string;
  kitUsed: 'Small Repair Kit (+25% HP)' | 'Medium Repair Kit (+50% HP)' | 'Large Repair Kit (+100% HP)';
  hpBefore: number;
  hpAfter: number;
  isVerified: boolean;
}

export interface InFlightAnomalyLog {
  id: string;
  anomalyType: 'BLACK_HOLE' | 'SUPERNOVA' | 'WELL' | 'ASTEROID_STORM';
  fleetId: string;
  commander: string;
  timestamp: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  effectDetails: string;
}

export default function ExpedicionesVueloModule({
  users,
  setIsAlertToShow,
  activeSubTab
}: ExpedicionesVueloModuleProps) {

  // Selected view corresponding to deep sub-actions (telemetry, state, rng, skills, security)
  const [activeView, setActiveView] = useState<string>('vuelo_telemetria');

  // Sync subtab from parent config
  useEffect(() => {
    if (activeSubTab) {
      if (activeSubTab.includes('telemetria')) setActiveView('vuelo_telemetria');
      else if (activeSubTab.includes('estados')) setActiveView('vuelo_estados');
      else if (activeSubTab.includes('rng')) setActiveView('vuelo_rng');
      else if (activeSubTab.includes('skills')) setActiveView('vuelo_skills');
      else if (activeSubTab.includes('seguridad')) setActiveView('vuelo_seguridad');
    }
  }, [activeSubTab]);

  // Global Pausa state (Server Freeze)
  const [serverFreeze, setServerFreeze] = useState<boolean>(false);

  // Encounter rate sliders state
  const [encounterRateShort, setEncounterRateShort] = useState<number>(15); // 1-3 hrs
  const [encounterRateMedium, setEncounterRateMedium] = useState<number>(35); // 4-8 hrs
  const [encounterRateLong, setEncounterRateLong] = useState<number>(65); // 10-16 hrs

  // Phase displacement speed modifier edit value
  const [phaseDisplacementReduction, setPhaseDisplacementReduction] = useState<number>(40);

  // Security locks constraint switch
  const [canLocksEnforced, setCanLocksEnforced] = useState<boolean>(true);

  // Exploit logs state (loaded with initial high-fidelity mock alerts for security)
  const [exploitLogs, setExploitLogs] = useState<SecurityExploitLog[]>(() => [
    {
      id: "exp-x1123",
      timestamp: new Date(Date.now() - 1000 * 600).toISOString(),
      userId: "user-uuid-99a2",
      commander: "Cmdr. Alistair Osaria",
      attemptedAction: "Inyección de Badges de C.A.N mientras expeditionActive=true",
      severity: "CRITICAL",
      status: "BLOCKED"
    },
    {
      id: "exp-x3439",
      timestamp: new Date(Date.now() - 1000 * 200).toISOString(),
      userId: "user-uuid-8812",
      commander: "Cmdr. Roger Vance",
      attemptedAction: "Reemplazo de motor Hyperdrive durante fase Returning",
      severity: "HIGH",
      status: "BLOCKED"
    }
  ]);

  // Healing Logs state
  const [healingLogs, setHealingLogs] = useState<HealingRecord[]>(() => [
    {
      id: "he-1",
      timestamp: new Date(Date.now() - 120000).toISOString(),
      fleetId: "FLT-9821-X",
      kitUsed: "Medium Repair Kit (+50% HP)",
      hpBefore: 7800,
      hpAfter: 12000,
      isVerified: true
    },
    {
      id: "he-2",
      timestamp: new Date().toISOString(),
      fleetId: "FLT-0435-D",
      kitUsed: "Large Repair Kit (+100% HP)",
      hpBefore: 12000,
      hpAfter: 35000,
      isVerified: true
    }
  ]);

  // Persistent anomaly logs state
  const [anomalyLogs, setAnomalyLogs] = useState<InFlightAnomalyLog[]>(() => [
    {
      id: "anom-092",
      anomalyType: "BLACK_HOLE",
      fleetId: "FLT-0435-D",
      commander: "Cmdr. Elara Vance",
      timestamp: new Date(Date.now() - 1000 * 1800).toISOString(),
      severity: "HIGH",
      effectDetails: "Superado Agujero Negro usando propulsor de anomalías. Generó +0.4 Materia Oscura en C.A.N."
    },
    {
      id: "anom-075",
      anomalyType: "SUPERNOVA",
      fleetId: "FLT-5512-Y",
      commander: "Cmdr. Roger Vance",
      timestamp: new Date(Date.now() - 1000 * 3600).toISOString(),
      severity: "MEDIUM",
      effectDetails: "Phase Displacement redujo tiempo de vuelo por 40%"
    }
  ]);

  // Chart and bulk interaction states
  const [selectedChartFleetId, setSelectedChartFleetId] = useState<string>('FLT-9821-X');
  const [bulkSelectedFleets, setBulkSelectedFleets] = useState<string[]>([]);
  const [bulkHealingKit, setBulkHealingKit] = useState<'SMALL' | 'MED' | 'LARGE'>('MED');

  // Fleet custom notification thresholds and alerts State
  const [fleetAlertConfigs, setFleetAlertConfigs] = useState<Record<string, { thresholdPercent: number; customMessage: string }>>(() => ({
    'FLT-9821-X': { thresholdPercent: 40, customMessage: "ALERTA CRÍTICA: Comandante Alistair Osaria, la integridad de su Ghost Recon Cruiser ha caído por debajo del {THRESHOLD}%!" },
    'FLT-0435-D': { thresholdPercent: 30, customMessage: "ADVERTENCIA DE COLAPSO: Comandante Elara Vance, reactor en peligro - HP inferior al {THRESHOLD}%!" },
    'FLT-5512-Y': { thresholdPercent: 45, customMessage: "RETORNO PRIORITARIO: Comandante Roger Vance, casco inestable. Límites de seguridad violados: {THRESHOLD}% HP." },
    'FLT-2211-P': { thresholdPercent: 25, customMessage: "CRITICAL NOTIFICATION: Commander Nova Sparks, hull warning critical ({THRESHOLD}%)." },
  }));

  const [sentPushLogs, setSentPushLogs] = useState<Array<{ id: string; timestamp: string; commander: string; message: string; status: 'DELIVERED' | 'QUEUED' }>>(() => [
    {
      id: "PUSH-LOG-1",
      timestamp: new Date(Date.now() - 1000 * 1800).toISOString(),
      commander: "Cmdr. Elara Vance",
      message: "Reactor cuántico en peligro - HP inferior al 30%!",
      status: "DELIVERED"
    }
  ]);

  // Unified PDF Audit Report Generator
  const handleExportUnifiedAuditReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      setIsAlertToShow({
        show: true,
        status: 'error',
        message: 'El navegador bloqueó la popup de impresión. Habilita permisos de popups para Sasorilabs.'
      });
      return;
    }

    const htmlContent = `
      <html>
        <head>
          <title>Sasorilabs Audit Report - Unified Fleet Flight Logs</title>
          <style>
            body {
              font-family: 'JetBrains Mono', Courier, monospace;
              background-color: #030304;
              color: #ececec;
              padding: 40px;
              margin: 0;
            }
            .header {
              border-bottom: 3px double #ff1e1e;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .title {
              font-size: 24px;
              font-weight: bold;
              color: #ff1e1e;
              margin: 0;
              text-transform: uppercase;
              letter-spacing: 2px;
            }
            .subtitle {
              font-size: 11px;
              color: #a1a1aa;
              margin-top: 5px;
            }
            .meta-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 20px;
              margin-bottom: 30px;
              background-color: #09090b;
              border: 1px solid #27272a;
              padding: 15px;
              border-radius: 4px;
            }
            .meta-item {
              font-size: 11px;
            }
            .meta-item strong {
              color: #ff1e1e;
              display: block;
              font-size: 9px;
              text-transform: uppercase;
              margin-bottom: 3px;
            }
            h2 {
              font-size: 14px;
              color: #ff1e1e;
              border-bottom: 1px solid #333;
              padding-bottom: 5px;
              margin-top: 35px;
              text-transform: uppercase;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
              font-size: 11px;
            }
            th {
              background-color: #181c20;
              border: 1px solid #27272a;
              padding: 10px;
              color: #ff1e1e;
              text-align: left;
              font-weight: bold;
            }
            td {
              border: 1px solid #27272a;
              padding: 10px;
              color: #d4d4d8;
            }
            tr:nth-child(even) {
              background-color: #0c0c0e;
            }
            .badge {
              font-size: 9px;
              font-weight: bold;
              padding: 3px 6px;
              border-radius: 3px;
              text-transform: uppercase;
            }
            .badge-danger {
              background-color: #7f1d1d;
              color: #fca5a5;
              border: 1px solid #b91c1c;
            }
            .badge-warning {
              background-color: #78350f;
              color: #fde047;
              border: 1px solid #b45309;
            }
            .badge-success {
              background-color: #064e3b;
              color: #6ee7b7;
              border: 1px solid #047857;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">SASORILABS CRITICAL AUDIT REPORT</div>
            <div class="subtitle">AUTOMATED TECHNICAL EXPEDITIONS & THREAT DIAGNOSTICS LOG • COMPLIANCE STACK v4.0</div>
          </div>

          <div class="meta-grid">
            <div class="meta-item">
              <strong>OPERATOR</strong>
              amijares@sasorilabs.io (Super Admin)
            </div>
            <div class="meta-item">
              <strong>GENERATION TIMESTAMP</strong>
              ${new Date().toISOString()}
            </div>
            <div class="meta-item">
              <strong>SYSTEM STACK STATUS</strong>
              LIVE THREAT SCANNING ACTIVE
            </div>
          </div>

          <h2>1. Anomalías Gravitacionales Detectadas (${anomalyLogs.length})</h2>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Tipo</th>
                <th>Flota</th>
                <th>Comandante</th>
                <th>Severidad</th>
                <th>Detalles Efecto</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              ${anomalyLogs.map(a => `
                <tr>
                  <td>${a.id}</td>
                  <td><span class="badge ${a.anomalyType === 'BLACK_HOLE' ? 'badge-danger' : 'badge-warning'}">${a.anomalyType}</span></td>
                  <td>${a.fleetId}</td>
                  <td>${a.commander}</td>
                  <td><strong>${a.severity}</strong></td>
                  <td>${a.effectDetails}</td>
                  <td>${new Date(a.timestamp).toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <h2>2. Registro de Curaciones y Reparaciones (${healingLogs.length})</h2>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Flota ID</th>
                <th>Kit Utilizado</th>
                <th>HP Previo</th>
                <th>HP Posterior</th>
                <th>Autorización</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              ${healingLogs.map(h => `
                <tr>
                  <td>${h.id}</td>
                  <td>${h.fleetId}</td>
                  <td>${h.kitUsed}</td>
                  <td>${h.hpBefore} HP</td>
                  <td>${h.hpAfter} HP</td>
                  <td><span class="badge badge-success">LEGÍTIMO</span></td>
                  <td>${new Date(h.timestamp).toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <h2>3. Alertas Rojas & Exploit Logs (${exploitLogs.length})</h2>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Comandante</th>
                <th>Billetera UUID</th>
                <th>Acción Sospechosa</th>
                <th>Severidad</th>
                <th>Estatus Respuesta</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              ${exploitLogs.map(e => `
                <tr>
                  <td>${e.id}</td>
                  <td>${e.commander}</td>
                  <td>${e.userId}</td>
                  <td><span style="color:#f87171">${e.attemptedAction}</span></td>
                  <td><span class="badge badge-danger">${e.severity}</span></td>
                  <td><span class="badge badge-danger">${e.status}</span></td>
                  <td>${new Date(e.timestamp).toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div style="margin-top: 50px; border-top: 1px dashed #3f3f46; padding-top: 20px; font-size: 9px; text-align: center; color: #a1a1aa;">
            ESTE REPORTE CONTIENE INFORMACIÓN TECNOLÓGICA DE AUDITORÍA CRÍTICA ENCRIPTADA PARA SASORILABS.IO. SU DIFUSIÓN NO AUTORIZADA ESTÁ SANCIONADA BAJO LEYES SIDERALES.
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    setIsAlertToShow({
      show: true,
      status: 'success',
      message: 'Compilando datos... ¡Informe técnico unificado abierto con éxito en una pestaña lista para guardar como PDF!'
    });
  };

  // Fleet list seed data with real time variables
  const [fleets, setFleets] = useState<InFlightFleet[]>(() => [
    {
      fleetId: "FLT-9821-X",
      commander: "Cmdr. Alistair Osaria",
      userId: "user-uuid-99a2",
      shipType: "Ghost Recon Cruiser",
      state: "Traveling",
      totalDuration: 7200,
      timeLeft: 3450,
      isInstantTravelUsed: false,
      isQuantumStealthEvasion: true,
      anomalyAbsorbed: false,
      darkMatterGenerated: 0,
      ordersLawTriggered: false,
      phantomCoinsPrinted: 0,
      hasSupernovaPhaseDisplacement: false,
      speedBoost: 35,
      fleetHpMax: 12000,
      fleetHpCurrent: 9200,
      canLocked: true,
      expeditionActive: true
    },
    {
      fleetId: "FLT-0435-D",
      commander: "Cmdr. Elara Vance",
      userId: "user-uuid-11f8",
      shipType: "Osiris Harvester v8",
      state: "Active",
      totalDuration: 14400,
      timeLeft: 12400,
      isInstantTravelUsed: false,
      isQuantumStealthEvasion: false,
      anomalyAbsorbed: true,
      darkMatterGenerated: 0.4,
      ordersLawTriggered: true,
      phantomCoinsPrinted: 2,
      hasSupernovaPhaseDisplacement: true,
      speedBoost: 55,
      fleetHpMax: 35000,
      fleetHpCurrent: 28500,
      canLocked: true,
      expeditionActive: true
    },
    {
      fleetId: "FLT-5512-Y",
      commander: "Cmdr. Roger Vance",
      userId: "user-uuid-8812",
      shipType: "Centurion Raider Pro",
      state: "Returning",
      totalDuration: 10800,
      timeLeft: 2150,
      isInstantTravelUsed: false,
      isQuantumStealthEvasion: false,
      anomalyAbsorbed: false,
      darkMatterGenerated: 0,
      ordersLawTriggered: false,
      phantomCoinsPrinted: 0,
      hasSupernovaPhaseDisplacement: true,
      speedBoost: 70,
      fleetHpMax: 20000,
      fleetHpCurrent: 18500,
      canLocked: true,
      expeditionActive: true
    },
    {
      fleetId: "FLT-2211-P",
      commander: "Cmdr. Nova Sparks",
      userId: "user-929-a",
      shipType: "Star Explorer III",
      state: "Finished",
      totalDuration: 3600,
      timeLeft: 0,
      isInstantTravelUsed: true,
      isQuantumStealthEvasion: false,
      anomalyAbsorbed: false,
      darkMatterGenerated: 0.1,
      ordersLawTriggered: false,
      phantomCoinsPrinted: 0,
      hasSupernovaPhaseDisplacement: false,
      speedBoost: 75,
      fleetHpMax: 8000,
      fleetHpCurrent: 8000,
      canLocked: false,
      expeditionActive: false
    }
  ]);

  // Search input for tactical telemetry tracker
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Real-Time Decrement interval loop simulation
  useEffect(() => {
    const timer = setInterval(() => {
      // Do nothing if Server Freeze is toggled on!
      if (serverFreeze) return;

      setFleets(prevFleets => 
        prevFleets.map(fleet => {
          if (fleet.state === 'Finished' || fleet.timeLeft <= 0) {
            return {
              ...fleet,
              timeLeft: 0,
              state: 'Finished',
              canLocked: false,
              expeditionActive: false
            };
          }

          const newTime = Math.max(0, fleet.timeLeft - 1);
          let newState = fleet.state;

          // Simple dynamic state transitions based on timeLeft percentage remaining (simulation)
          if (newTime === 0) {
            newState = 'Finished';
          } else if (fleet.state === 'Traveling' && newTime < fleet.totalDuration * 0.7 && newTime > fleet.totalDuration * 0.3) {
            newState = 'Active';
          } else if (fleet.state === 'Active' && newTime < fleet.totalDuration * 0.3) {
            newState = 'Returning';
          }

          return {
            ...fleet,
            timeLeft: newTime,
            state: newState
          };
        })
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [serverFreeze]);

  // Filter and Search telemetry fleets
  const filteredFleets = useMemo(() => {
    return fleets.filter(f => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        f.fleetId.toLowerCase().includes(query) ||
        f.commander.toLowerCase().includes(query) ||
        f.userId.toLowerCase().includes(query) ||
        f.shipType.toLowerCase().includes(query);
      
      const matchesFilter = statusFilter === 'ALL' || f.state.toUpperCase() === statusFilter;

      return matchesSearch && matchesFilter;
    });
  }, [fleets, searchQuery, statusFilter]);

  // RNG interaction action log states
  const [rngLogs, setRngLogs] = useState<string[]>(() => [
    "[RNG-INFO]: In-Flight Events Engine initialized.",
    "[RNG-TACTICAL]: Quantum fields are operating within standard tolerance."
  ]);

  const addRngLog = (msg: string) => {
    setRngLogs(prev => [`[${new Date().toLocaleTimeString()}]: ${msg}`, ...prev.slice(0, 40)]);
  };

  // State Manipulation - FORCE NEXT STATE
  const handleForceNextState = (fleetId: string) => {
    setFleets(prevFleets => 
      prevFleets.map(f => {
        if (f.fleetId !== fleetId) return f;
        
        let next: InFlightFleet['state'] = f.state;
        let tLeft = f.timeLeft;

        if (f.state === 'Traveling') {
          next = 'Active';
          tLeft = Math.floor(f.totalDuration * 0.6);
        } else if (f.state === 'Active') {
          next = 'Returning';
          tLeft = Math.floor(f.totalDuration * 0.25);
        } else if (f.state === 'Returning') {
          next = 'Finished';
          tLeft = 0;
        }

        return {
          ...f,
          state: next,
          timeLeft: tLeft,
          canLocked: next !== 'Finished',
          expeditionActive: next !== 'Finished'
        };
      })
    );

    const match = fleets.find(f => f.fleetId === fleetId);
    if (match) {
      setIsAlertToShow({
        status: 'success',
        message: `Estado de flota "${fleetId}" forzado hacia la siguiente fase: ${match.state} -> Transición exitosa.`
      });
      addRngLog(`ADMIN FORCED state modification on fleet: ${fleetId}`);
    }
  };

  // State Manipulation - TRIGGER INSTANT TRAVEL
  const handleInstantTravel = (fleetId: string) => {
    setFleets(prevFleets => 
      prevFleets.map(f => {
        if (f.fleetId !== fleetId) return f;
        return {
          ...f,
          timeLeft: 0,
          state: 'Finished',
          canLocked: false,
          expeditionActive: false,
          isInstantTravelUsed: true
        };
      })
    );

    setIsAlertToShow({
      status: 'success',
      message: `⚡ ¡INSTANT TRAVEL GATILLADO! Cronómetro de flota "${fleetId}" fijado a 0 segundos.`
    });
    addRngLog(`Instant Travel activated for fleet ID: ${fleetId}. Returned to home base.`);
  };

  // State Manipulation - EMERGENCY RETURNING / CANCEL MISSION
  const handleAbortMission = (fleetId: string) => {
    setFleets(prevFleets => 
      prevFleets.map(f => {
        if (f.fleetId !== fleetId) return f;
        // recalculate returning time as elapsed traveled time / 2
        const elapsed = f.totalDuration - f.timeLeft;
        const returnTime = Math.max(60, Math.floor(elapsed / 2));
        return {
          ...f,
          state: 'Returning',
          timeLeft: returnTime,
          canLocked: true,
          expeditionActive: true
        };
      })
    );

    setIsAlertToShow({
      status: 'error',
      message: `🛡️ ¡RECONOCIMIENTO CANCELADO! Retorno de emergencia forzado sobre Flota "${fleetId}".`
    });
    addRngLog(`Emergency return triggered on ${fleetId}. Distance-calculated hyperdrive return in progress.`);
  };

  // RNG Events Engine - FORCE PV HOSTILE ATTACK
  const handleTriggerPveIncursion = (fleetId: string, enemyType: 'LIF' | 'XENOGON') => {
    const target = fleets.find(f => f.fleetId === fleetId);
    if (!target) return;

    // calculations
    let logMsg = "";
    let damage = 0;
    let avoided = false;

    if (target.isQuantumStealthEvasion && Math.random() > 0.3) {
      avoided = true;
      logMsg = `⚠️ Incursión de ${enemyType === 'LIF' ? 'LIF Marauders' : 'Xenogon Swarm'} evadida gracias al Quantum Stealth (Sigilo Activo) de la nave.`;
    } else if (target.ordersLawTriggered && enemyType === 'LIF' && Math.random() > 0.4) {
      logMsg = `🛡️ Ataque pirata repelido mediante ley de orden "Order's Law". ¡Se imprimió 1 Moneda Phantom en blockchain!`;
      setFleets(prev => prev.map(f => f.fleetId === fleetId ? { ...f, phantomCoinsPrinted: f.phantomCoinsPrinted + 1 } : f));
    } else {
      damage = enemyType === 'LIF' ? Math.floor(target.fleetHpMax * 0.25) : Math.floor(target.fleetHpMax * 0.4);
      logMsg = `💥 Impacto enemigo registrado por flota ${fleetId}. Se redujo la salud del casco en ${damage.toLocaleString()} HP.`;
      
      setFleets(prev => prev.map(f => {
        if (f.fleetId === fleetId) {
          const newHp = Math.max(120, f.fleetHpCurrent - damage);
          return { ...f, fleetHpCurrent: newHp };
        }
        return f;
      }));
    }

    addRngLog(`HOSTILE INJECTED [${enemyType}] -> ${logMsg}`);
    setIsAlertToShow({
      status: avoided ? 'success' : 'error',
      message: avoided ? `Incursión evantada por Quantum Stealth en ${fleetId}` : `Ataque hostil finalizado. Impacto recibido: -${damage} HP.`
    });
  };

  // RNG Events Engine - FORCE PEACEFUL NPC ENCOUNTER
  const handleTriggerNpcEncounter = (fleetId: string, alliance: 'TARYN' | 'GUILD') => {
    const target = fleets.find(f => f.fleetId === fleetId);
    if (!target) return;

    const bonusCreds = alliance === 'TARYN' ? 50000 : 150000;
    addRngLog(`PEACEFUL ENCOUNTER [${alliance}] -> Tripulación de ${fleetId} asistió a la flota aliada. Se concedió un bono estimado de ${bonusCreds.toLocaleString()} Kg Metal.`);
    setIsAlertToShow({
      status: 'success',
      message: `¡Simulacro de encuentro pacífico exitoso con la facción ${alliance}!`
    });
  };

  // RNG Events Engine - DEPLOY ENVIRONMENT ANOMALY
  const handleTriggerAnomaly = (fleetId: string, anomalyType: 'BLACK_HOLE' | 'SUPERNOVA' | 'WELL') => {
    const target = fleets.find(f => f.fleetId === fleetId);
    if (!target) return;

    let logMsg = "";
    if (anomalyType === 'BLACK_HOLE' && target.anomalyAbsorbed) {
      logMsg = `🌀 Superado Agujero Negro usando propulsor de anomalías. Generó +0.1 Materia Oscura en C.A.N.`;
      setFleets(prev => prev.map(f => f.fleetId === fleetId ? { ...f, darkMatterGenerated: Number((f.darkMatterGenerated + 0.1).toFixed(2)) } : f));
    } else if (anomalyType === 'SUPERNOVA' && target.hasSupernovaPhaseDisplacement) {
      // reduce Travel Time by phaseDisplacementReduction%
      const reduction = Math.floor(target.timeLeft * (phaseDisplacementReduction / 100));
      logMsg = `☀️ Supernova abordada. Phase Displacement redujo el tiempo de vuelo en un ${phaseDisplacementReduction}% (-${reduction} s).`;
      setFleets(prev => prev.map(f => f.fleetId === fleetId ? { ...f, timeLeft: Math.max(10, f.timeLeft - reduction) } : f));
    } else {
      const dmg = Math.floor(target.fleetHpMax * 0.3);
      logMsg = `☄️ Anomalía desatada. Flota no equipada recibió daño térmico de gravedad, casco: -${dmg} HP.`;
      setFleets(prev => prev.map(f => f.fleetId === fleetId ? { ...f, fleetHpCurrent: Math.max(100, f.fleetHpCurrent - dmg) } : f));
    }

    addRngLog(`ANOMALY DEPLOYED [${anomalyType}] -> ${logMsg}`);

    // Persistent log of detected in-flight anomalies
    const newAnom: InFlightAnomalyLog = {
      id: `anom-${Date.now().toString(36)}`,
      anomalyType: anomalyType as any,
      fleetId,
      commander: target.commander,
      timestamp: new Date().toISOString(),
      severity: anomalyType === 'BLACK_HOLE' ? 'HIGH' : anomalyType === 'SUPERNOVA' ? 'MEDIUM' : 'LOW',
      effectDetails: logMsg
    };
    setAnomalyLogs(prev => [newAnom, ...prev]);

    setIsAlertToShow({
      show: true,
      status: 'success',
      message: `Anomalía desplegada y procesada dinámicamente en vivo sobre la flota ${fleetId}.`
    });
  };

  // Tech lock override troubleshooting tool
  const handleOverrideLocks = (fleetId: string) => {
    setFleets(prev => prev.map(f => f.fleetId === fleetId ? { ...f, canLocked: false, expeditionActive: false, state: 'Finished', timeLeft: 0 } : f));
    setIsAlertToShow({
      status: 'success',
      message: `⚙️ ANULACIÓN DE BLOQUEO: Desbloqueo forzado de la CAN y finalización de vuelo para la flota ${fleetId} exitoso.`
    });
    addRngLog(`OVERRIDE C.A.N. executed by support admin for fleet: ${fleetId}. State cleaned.`);
  };

  // Trigger manual healing injection
  const handleInFlightHeal = (fleetId: string, size: 'SMALL' | 'MED' | 'LARGE') => {
    let healingHp = 0;
    let label = '';
    if (size === 'SMALL') {
      healingHp = 2500;
      label = "Small Repair Kit (+25% HP)";
    } else if (size === 'MED') {
      healingHp = 5000;
      label = "Medium Repair Kit (+50% HP)";
    } else {
      healingHp = 10000;
      label = "Large Repair Kit (+100% HP)";
    }

    let before = 0;
    let after = 0;

    setFleets(prev => prev.map(f => {
      if (f.fleetId === fleetId) {
        before = f.fleetHpCurrent;
        after = Math.min(f.fleetHpMax, f.fleetHpCurrent + healingHp);
        return {
          ...f,
          fleetHpCurrent: after
        };
      }
      return f;
    }));

    // Record verified health log
    const newLog: HealingRecord = {
      id: `he-${Date.now().toString(36)}`,
      timestamp: new Date().toISOString(),
      fleetId,
      kitUsed: label as any,
      hpBefore: before,
      hpAfter: after,
      isVerified: true
    };
    setHealingLogs(prev => [newLog, ...prev]);

    setIsAlertToShow({
      status: 'success',
      message: `Inyección de Reparación Verificada: +${healingHp} HP aplicados a mitad de recorrido en ${fleetId}.`
    });
    addRngLog(`Healing kit used in progress for fleet: ${fleetId}. HP updated legally.`);
  };

  // Bulk healing for multiple fleets administrative action
  const handleBulkHeal = () => {
    if (bulkSelectedFleets.length === 0) {
      setIsAlertToShow({
        show: true,
        status: 'error',
        message: 'Por favor, selecciona al menos una flota espacial para la reparación masiva.'
      });
      return;
    }

    let kitLabel = '';
    let multiplier = 0.25;
    if (bulkHealingKit === 'SMALL') {
      kitLabel = 'Small Repair Kit (+25% HP)';
      multiplier = 0.25;
    } else if (bulkHealingKit === 'MED') {
      kitLabel = 'Medium Repair Kit (+50% HP)';
      multiplier = 0.50;
    } else {
      kitLabel = 'Large Repair Kit (+100% HP)';
      multiplier = 1.00;
    }

    const newRecords: HealingRecord[] = [];
    let healedCount = 0;

    setFleets(prev => prev.map(f => {
      if (bulkSelectedFleets.includes(f.fleetId)) {
        const hpBonus = Math.floor(f.fleetHpMax * multiplier);
        const hpAfter = Math.min(f.fleetHpMax, f.fleetHpCurrent + hpBonus);
        
        newRecords.push({
          id: `he-bulk-${Date.now().toString(36)}-${f.fleetId}`,
          timestamp: new Date().toISOString(),
          fleetId: f.fleetId,
          kitUsed: kitLabel as any,
          hpBefore: f.fleetHpCurrent,
          hpAfter: hpAfter,
          isVerified: true
        });
        healedCount++;
        return { ...f, fleetHpCurrent: hpAfter };
      }
      return f;
    }));

    setHealingLogs(prev => [...newRecords, ...prev]);
    setBulkSelectedFleets([]);

    setIsAlertToShow({
      show: true,
      status: 'success',
      message: `¡Reparación en bloque aplicada con éxito con el kit de curación sobre ${healedCount} flotas!`
    });

    addRngLog(`BULK_HEALING executed: Applied ${kitLabel} on fleets ${bulkSelectedFleets.join(', ')}.`);
  };

  // Export exploit log entries to JSON or CSV for threat diagnostics
  const handleExportExploitLogs = (format: 'CSV' | 'JSON') => {
    let content = '';
    let mimeType = '';
    let fileName = `exploit-logs-${Date.now()}`;

    if (format === 'JSON') {
      content = JSON.stringify(exploitLogs, null, 2);
      mimeType = 'application/json';
      fileName += '.json';
    } else {
      const headers = ['ID', 'Timestamp', 'UserID', 'Commander', 'AttemptedAction', 'Severity', 'Status'];
      const rows = exploitLogs.map(log => [
        log.id,
        log.timestamp,
        log.userId,
        log.commander.replace(/,/g, ' '),
        log.attemptedAction.replace(/,/g, ' '),
        log.severity,
        log.status
      ]);
      content = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
      mimeType = 'text/csv';
      fileName += '.csv';
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setIsAlertToShow({
      show: true,
      status: 'success',
      message: `Logs de vulnerabilidad C.A.N exportados exitosamente en formato ${format}.`
    });
  };

  return (
    <div className="space-y-6 font-sans">

      {/* PARENT TOP BANNER & SERVER CONTROL HUB */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-4 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          <div>
            <h2 className="text-sm font-mono font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <Radio className="text-[#ff1e1e] animate-pulse shrink-0" size={15} />
              Centro de Comando: Expediciones en Vuelo (In-Flight Operations)
            </h2>
            <p className="text-[11px] text-zinc-500 font-mono mt-1">
              Monitoreo asíncrono en vivo, ajuste de disparos RNG, simulación anti-trampas e interacción táctica de modulos espaciales.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* UNIFIED AUDIT PDF TOOL */}
            <button
              type="button"
              onClick={handleExportUnifiedAuditReport}
              className="p-1.5 px-3 rounded border border-red-900 bg-red-950/25 text-red-400 hover:text-white hover:bg-red-900/40 font-mono text-[10px] uppercase font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-[#ff1e1e]/5 shadow-sm"
              title="Compilar todos los registros en un informe PDF técnico para auditorías de Sasorilabs"
            >
              <FileText size={11} className="text-red-500 animate-pulse" />
              <span>Unified Audit Report (PDF)</span>
            </button>

            {/* SERVER FREEZE SWITCH BUTTON */}
            <div className={`p-1.5 px-3 rounded border font-mono text-[10px] uppercase font-bold flex items-center gap-2 transition-all ${
              serverFreeze 
                ? 'bg-amber-950/40 border-amber-500/40 text-amber-500 animate-pulse' 
                : 'bg-zinc-900/40 border-zinc-900 text-zinc-400'
            }`}>
              <Server size={11} className={serverFreeze ? 'animate-bounce text-amber-500' : 'text-zinc-550'} />
              <span>PAUSA GLOBAL (FREEZE):</span>
              <button
                onClick={() => {
                  setServerFreeze(!serverFreeze);
                  setIsAlertToShow({
                    status: !serverFreeze ? 'error' : 'success',
                    message: !serverFreeze 
                      ? '❄️ CONGELACIÓN GLOBAL DE SERVIDOR ACTIVADA! Temporizadores espaciales suspendidos.' 
                      : '🔥 SISTEMA REANUDADO. Continuación del conteo de telemetría de flotas.'
                  });
                  addRngLog(`Server FREEZE state modified to: ${!serverFreeze}`);
                }}
                className={`px-2 py-0.5 rounded text-[9px] font-extrabold cursor-pointer transition-colors ${
                  serverFreeze 
                    ? 'bg-amber-500 text-black hover:bg-amber-400' 
                    : 'bg-zinc-950 text-white hover:bg-zinc-800'
                }`}
              >
                {serverFreeze ? 'PAUSADO (ON)' : 'ACTIVAR PAUSA'}
              </button>
            </div>

            {/* SECTIONS DROPDOWN CONTAINER GIMBAL NAV */}
            <div className="flex flex-wrap bg-black border border-zinc-900 p-1 rounded font-mono text-[10px] gap-1">
              <button
                onClick={() => setActiveView('vuelo_telemetria')}
                className={`px-2.5 py-1.5 font-bold uppercase transition-all rounded flex items-center gap-1.5 ${
                  activeView === 'vuelo_telemetria' ? 'bg-[#ff1e1e] text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Radio size={11} />
                Telemetría
              </button>

              <button
                onClick={() => setActiveView('vuelo_estados')}
                className={`px-2.5 py-1.5 font-bold uppercase transition-all rounded flex items-center gap-1.5 ${
                  activeView === 'vuelo_estados' ? 'bg-[#ff1e1e] text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Power size={11} />
                Estados
              </button>

              <button
                onClick={() => setActiveView('vuelo_rng')}
                className={`px-2.5 py-1.5 font-bold uppercase transition-all rounded flex items-center gap-1.5 ${
                  activeView === 'vuelo_rng' ? 'bg-[#ff1e1e] text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Sliders size={11} />
                RNG
              </button>

              <button
                onClick={() => setActiveView('vuelo_skills')}
                className={`px-2.5 py-1.5 font-bold uppercase transition-all rounded flex items-center gap-1.5 ${
                  activeView === 'vuelo_skills' ? 'bg-[#ff1e1e] text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Award size={11} />
                Habilidades
              </button>

              <button
                onClick={() => setActiveView('vuelo_seguridad')}
                className={`px-2.5 py-1.5 font-bold uppercase transition-all rounded flex items-center gap-1.5 ${
                  activeView === 'vuelo_seguridad' ? 'bg-[#ff1e1e] text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Lock size={11} />
                Seguridad
              </button>

              <button
                onClick={() => setActiveView('vuelo_alertas')}
                className={`px-2.5 py-1.5 font-bold uppercase transition-all rounded flex items-center gap-1.5 ${
                  activeView === 'vuelo_alertas' ? 'bg-[#ff1e1e] text-[#fff]' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Activity size={11} />
                Alertas
              </button>
            </div>
          </div>
        </div>

        {/* Global Warning overlay indicating Server Freeze is state active */}
        {serverFreeze && (
          <div className="bg-amber-950/20 border border-amber-900/60 p-3 rounded flex items-center gap-3 text-amber-500 font-mono text-xs">
            <AlertTriangle className="animate-pulse flex-shrink-0" size={16} />
            <div>
              <span className="font-bold uppercase block">[SERVIDOR EN CONGELACIÓN PREVENTIVA]</span>
              <span>Todos los cronómetros de las naves en vuelo han sido suspendidos a nivel de middleware. Las naves no avanzarán ruta para evitar colisiones involuntarias.</span>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">

        {/* VIEW 1: TELEMETRIA Grid and Search (Módulo de Telemetría Táctica) */}
        {activeView === 'vuelo_telemetria' && (
          <motion.div
            key="vuelo_telemetria"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-6"
          >
            {/* RACK CONTROLS AND SEARCH */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-zinc-950 border border-zinc-900 rounded-lg p-4 font-mono text-xs">
              <div className="col-span-1 md:col-span-2 relative">
                <label className="text-zinc-550 block mb-1 text-[9px] uppercase tracking-wider font-bold">Rastrear Identificador Flota, UUID, Commander o Nave:</label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por UUID 'user-uuid-99a2' o Flota ID..."
                    className="w-full bg-black border border-zinc-850 p-2 pl-9 rounded text-white text-xs"
                  />
                  <Search size={14} className="absolute left-3 top-3 text-zinc-600" />
                </div>
              </div>

              <div>
                <label className="text-zinc-550 block mb-1 text-[9px] uppercase tracking-wider font-bold">Filtrar por Estado de Vuelo:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-black border border-zinc-850 p-2 rounded text-xs text-white focus:outline-none cursor-pointer"
                >
                  <option value="ALL">TODOS LOS ESTADOS</option>
                  <option value="TRAVELING">TRAVELING (IDA)</option>
                  <option value="ACTIVE">ACTIVE (MINANDO/DOMINANDO)</option>
                  <option value="RETURNING">RETURNING (VUELTA)</option>
                  <option value="FINISHED">FINISHED (FINALIZADO)</option>
                </select>
              </div>
            </div>

            {/* LIVE TELEMETRY RADAR GRID & HULL LINE CHART */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* RADAR LIST (Left 2 cols) */}
              <div className="lg:col-span-2 bg-zinc-950 border border-zinc-900 rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
                  <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-widest block">
                    🌐 RADAR ESPACIAL: TELEMETRÍA TÁCTICA PARA SASORILABS.IO
                  </span>
                  <span className="font-mono text-[10px] text-zinc-550">
                    Mostrando {filteredFleets.length} de {fleets.length} naves orbitales detectadas
                  </span>
                </div>

                {filteredFleets.length === 0 ? (
                  <div className="p-10 text-center italic text-zinc-650 bg-black/40 rounded border border-zinc-900/60 font-mono text-xs">
                    Ninguna flota orbital concuerda con los parámetros de la búsqueda en la Travel API.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredFleets.map((fleet) => {
                      const elapsed = fleet.totalDuration - fleet.timeLeft;
                      const progressPct = Math.min(100, Math.max(0, (elapsed / fleet.totalDuration) * 100));
                      const isSelectedChart = selectedChartFleetId === fleet.fleetId;
                      return (
                        <div 
                          key={fleet.fleetId} 
                          onClick={() => setSelectedChartFleetId(fleet.fleetId)}
                          className={`p-3.5 rounded-lg border transition-all cursor-pointer select-none ${
                            isSelectedChart
                              ? 'bg-red-950/20 border-[#ff1e1e]'
                              : fleet.state === 'Finished' 
                                ? 'bg-zinc-950/40 border-zinc-900 opacity-60 hover:opacity-100' 
                                : 'bg-black border-zinc-900 hover:border-zinc-850'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-sm text-white">{fleet.fleetId}</span>
                                <span className={`text-[8.5px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                  fleet.state === 'Traveling' ? 'bg-indigo-950 text-indigo-400 border border-indigo-900' :
                                  fleet.state === 'Active' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' :
                                  fleet.state === 'Returning' ? 'bg-purple-950 text-purple-400 border border-purple-900' :
                                  'bg-zinc-900 text-zinc-500 border border-zinc-800'
                                }`}>
                                  {fleet.state === 'Traveling' ? 'TRAVELING' : 
                                   fleet.state === 'Active' ? 'ACTIVE' : 
                                   fleet.state === 'Returning' ? 'RETURNING' : 'FINISHED'}
                                </span>
                              </div>
                              <span className="text-[10px] text-zinc-550 block font-mono mt-1">
                                Commander: <span className="text-zinc-300 font-bold">{fleet.commander}</span>
                              </span>
                            </div>

                            <div className="text-right font-mono">
                              <span className="text-[9px] text-zinc-550 block">UUID JUGADOR</span>
                              <span className="text-[10px] text-zinc-400 block font-mono">{fleet.userId.slice(0, 10)}...</span>
                            </div>
                          </div>

                          {/* TELEMETRY SPECIFIC TIMERS (TimeLeft Watcher) */}
                          <div className="mt-4 p-2.5 bg-zinc-950/80 border border-zinc-900 rounded font-mono text-[11px] space-y-2">
                            <div className="flex justify-between items-center text-[10px] text-zinc-500">
                              <span>Velocidad Boost: (+{fleet.speedBoost}%)</span>
                              <span className="font-bold">Total: {fleet.totalDuration}s</span>
                            </div>

                            {/* Interactive status bar */}
                            <div className="w-full h-2 bg-zinc-900 border border-zinc-850 rounded overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-300 rounded ${
                                  fleet.state === 'Traveling' ? 'bg-gradient-to-r from-indigo-600 to-cyan-500' :
                                  fleet.state === 'Active' ? 'bg-gradient-to-r from-emerald-600 to-teal-400' :
                                  fleet.state === 'Returning' ? 'bg-gradient-to-r from-purple-600 to-fuchsia-500' :
                                  'bg-zinc-700'
                                }`}
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>

                            <div className="flex justify-between items-center mt-1">
                              <span className="text-zinc-550 text-[10px]">TIME LEFT:</span>
                              <span className={`font-bold font-sans text-xs ${fleet.timeLeft > 0 ? 'text-red-400 animate-pulse' : 'text-zinc-500'}`}>
                                {fleet.timeLeft > 0 ? `${fleet.timeLeft} segundos` : 'VUELO COMPLETADO'}
                              </span>
                            </div>
                          </div>

                          <div className="flex justify-between items-center mt-3 text-[10.5px] font-mono text-zinc-450 border-t border-zinc-900/60 pt-2.5">
                            <span>Nave: <span className="text-white font-bold">{fleet.shipType}</span></span>
                            <span className={`flex items-center gap-1 ${fleet.fleetHpCurrent < fleet.fleetHpMax * 0.4 ? 'text-red-500 animate-pulse font-extrabold' : 'text-emerald-400'}`}>
                              Hull integrity: {((fleet.fleetHpCurrent / fleet.fleetHpMax) * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* INTEGRITY LINE CHART PANEL (Right 1 col) */}
              <div className="lg:col-span-1 bg-zinc-950 border border-zinc-900 rounded-lg p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 border-b border-zinc-900 pb-3 mb-4">
                    <Activity size={16} className="text-[#ff1e1e] shrink-0" />
                    <span className="text-xs font-mono text-zinc-450 font-bold uppercase tracking-widest block">
                      DEGRADACIÓN CASCO EN MISIÓN
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-500 font-mono mb-4 leading-relaxed">
                    Mapeo visual en tiempo real de la integridad del casco de la flota espacial. Selecciona una tarjeta de nave a la izquierda para visualizar su trayectoria.
                  </p>

                  <div className="mb-4">
                    <label className="text-zinc-550 block mb-1 text-[9px] uppercase tracking-wider font-bold font-mono">Flota Analizada:</label>
                    <select
                      value={selectedChartFleetId}
                      onChange={(e) => setSelectedChartFleetId(e.target.value)}
                      className="w-full bg-black border border-zinc-850 p-2 rounded text-xs text-white focus:outline-none cursor-pointer font-mono"
                    >
                      {fleets.map(f => (
                        <option key={f.fleetId} value={f.fleetId}>
                          {f.fleetId} — {f.commander} ({Math.round((f.fleetHpCurrent / f.fleetHpMax) * 105)}% HP)
                        </option>
                      ))}
                    </select>
                  </div>
                  {(() => {
                    const selectedFleet = fleets.find(f => f.fleetId === selectedChartFleetId) || fleets[0];
                    if (!selectedFleet) return <div className="text-[11px] text-zinc-600 italic">No hay datos de flota</div>;

                    const maxHp = selectedFleet.fleetHpMax;
                    const currHp = selectedFleet.fleetHpCurrent;
                    const diff = 100 - (currHp / maxHp) * 100;

                    // Generate Line Chart Data points dynamically
                    const data = [
                      { name: '0%', 'Integridad': 100 },
                      { name: '20%', 'Integridad': Math.round(Math.max(0, 100 - diff * 0.2)) },
                      { name: '40%', 'Integridad': Math.round(Math.max(0, 100 - diff * 0.45)) },
                      { name: '60%', 'Integridad': Math.round(Math.max(0, 100 - diff * 0.7)) },
                      { name: '80%', 'Integridad': Math.round(Math.max(0, 100 - diff * 0.9)) },
                      { name: 'En Vivo', 'Integridad': Math.round((currHp / maxHp) * 100) }
                    ];

                    // Map all historical & runtime anomalies for this fleet
                    const fleetAnomalies = anomalyLogs.filter(a => a.fleetId === selectedFleet.fleetId);
                    const anomalyPoints = fleetAnomalies.map((anom) => {
                      let xVal = '40%';
                      let indexCoord = 2; // matches 40% index
                      let ptColor = '#ff3b30'; // Violet/Red default for Black Hole

                      if (anom.anomalyType === 'BLACK_HOLE') {
                        xVal = '40%';
                        indexCoord = 2;
                        ptColor = '#f43f5e';
                      } else if (anom.anomalyType === 'SUPERNOVA') {
                        xVal = '60%';
                        indexCoord = 3;
                        ptColor = '#f59e0b';
                      } else {
                        xVal = '20%';
                        indexCoord = 1;
                        ptColor = '#10b981';
                      }

                      const integrityValue = data[indexCoord] ? data[indexCoord]['Integridad'] : 80;
                      return {
                        id: anom.id,
                        type: anom.anomalyType,
                        x: xVal,
                        y: integrityValue,
                        color: ptColor,
                        label: anom.anomalyType
                      };
                    });

                    return (
                      <div className="space-y-3">
                        {/* GALAXY MAP EVENTS RADAR LEGEND */}
                        <div className="bg-black/60 border border-zinc-900 rounded p-2.5 font-mono text-[9px] space-y-1.5 shadow-inner">
                          <span className="text-zinc-500 font-extrabold uppercase tracking-widest block text-[8px] border-b border-zinc-900 pb-1">
                            🌌 GALAXY EVENT RADAR — SECTORES CRÍTICOS
                          </span>
                          <div className="grid grid-cols-2 gap-2 text-zinc-400">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-[#f43f5e] inline-block animate-ping shrink-0" />
                              <span>[SECTOR 40%] AGUJERO NEGRO</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-[#f59e0b] inline-block shrink-0" />
                              <span>[SECTOR 60%] SUPERNOVA</span>
                            </div>
                          </div>
                          {anomalyPoints.length > 0 && (
                            <div className="mt-1 pt-1.5 border-t border-zinc-900 text-[8.5px] text-red-400 leading-normal flex items-start gap-1">
                              <span>⚠️</span>
                              <span className="font-semibold uppercase">Impactos detectados en trayectoria de vuelo para {selectedFleet.fleetId} ({anomalyPoints.length}).</span>
                            </div>
                          )}
                        </div>

                        <div className="h-44 w-full font-mono text-[9px] mt-2 relative bg-black/60 border border-zinc-900 rounded p-1">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data} margin={{ top: 15, right: 15, left: -25, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#161617" />
                              <XAxis dataKey="name" stroke="#52525b" tickLine={false} />
                              <YAxis domain={[0, 100]} stroke="#52525b" tickLine={false} />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: '#09090b',
                                  borderColor: '#27272a',
                                  borderRadius: '4px',
                                  color: '#fff',
                                  fontFamily: 'monospace',
                                  fontSize: '10px'
                                }}
                                itemStyle={{ color: '#ff1e1e' }}
                                labelStyle={{ color: '#a1a1aa' }}
                              />
                              <Line
                                type="monotone"
                                dataKey="Integridad"
                                stroke="#ff1e1e"
                                strokeWidth={2}
                                activeDot={{ r: 4 }}
                                dot={{ r: 2 }}
                              />

                              {/* OVERLAY ANOMALIES GALAXY EVENTS */}
                              {anomalyPoints.map(pt => (
                                <ReferenceDot
                                  key={pt.id}
                                  x={pt.x}
                                  y={pt.y}
                                  r={6}
                                  fill={pt.color}
                                  stroke="#000"
                                  strokeWidth={2}
                                  isFront={true}
                                />
                              ))}
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="mt-4 p-3 bg-black/80 border border-zinc-900 rounded font-mono text-[10px] space-y-1.5">
                  {(() => {
                    const selectedFleet = fleets.find(f => f.fleetId === selectedChartFleetId) || fleets[0];
                    if (!selectedFleet) return null;
                    return (
                      <>
                        <div className="flex justify-between items-center text-[8px] text-zinc-550 border-b border-zinc-900 pb-1 font-bold">
                          <span>METRIC DATA PANEL</span>
                          <span>{selectedFleet.fleetId}</span>
                        </div>
                        <div className="flex justify-between items-center text-zinc-400">
                          <span>Integridad:</span>
                          <span className="text-white font-bold">{Math.round((selectedFleet.fleetHpCurrent / selectedFleet.fleetHpMax) * 100)}%</span>
                        </div>
                        <div className="flex justify-between items-center text-zinc-400">
                          <span>Casco:</span>
                          <span className="text-[#ff1e1e] font-bold">{selectedFleet.fleetHpCurrent.toLocaleString()} / {selectedFleet.fleetHpMax.toLocaleString()} HP</span>
                        </div>
                        <div className="flex justify-between items-center text-zinc-400">
                          <span>Estado de Vuelo:</span>
                          <span className="text-cyan-400 font-semibold uppercase">{selectedFleet.state}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* VIEW 2: STATE MANIPULATION CONSOLE */}
        {activeView === 'vuelo_estados' && (
          <motion.div
            key="vuelo_estados"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-6"
          >
            <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-4 space-y-4">
              <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-widest block border-b border-zinc-900 pb-2">
                🕹️ CONTROLES ADMINISTRATIVOS DE ESTADOS (STATE MANIPULATION)
              </span>

              <div className="space-y-4">
                {fleets.map((fleet) => (
                  <div key={fleet.fleetId} className="p-3 bg-black border border-zinc-900 rounded-lg flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded bg-zinc-950 border border-zinc-900 text-[#ff1e1e]">
                        <Orbit size={16} className={fleet.timeLeft > 0 && !serverFreeze ? "animate-spin" : ""} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white text-sm">{fleet.fleetId}</span>
                          <span className="text-[10px] text-zinc-550">({fleet.commander})</span>
                        </div>
                        <p className="text-[11px] font-mono mt-1 text-zinc-400">
                          Estado en Servidor: <span className="text-cyan-400 font-bold underline bg-cyan-950/20 px-1 rounded uppercase text-[10px]">{fleet.state}</span> • Tiempo Restante: {fleet.timeLeft}s
                        </p>
                      </div>
                    </div>

                    {/* ACTIONS DENSE SHELTER PANEL */}
                    <div className="flex flex-wrap items-center gap-1.5 w-full xl:w-auto font-mono text-[9px] font-extrabold uppercase mt-2 xl:mt-0 pt-2 xl:pt-0 border-t xl:border-t-0 border-zinc-900">
                      <button
                        onClick={() => handleForceNextState(fleet.fleetId)}
                        disabled={fleet.state === 'Finished'}
                        className="px-2.5 py-1.5 bg-indigo-950/20 hover:bg-[#ff1e1e] hover:text-white text-indigo-400 border border-indigo-900/40 rounded transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                        title="Forzar transición Traveling -> Active -> Returning -> Finished"
                      >
                        Force Next State
                      </button>

                      <button
                        onClick={() => handleInstantTravel(fleet.fleetId)}
                        disabled={fleet.state === 'Finished'}
                        className="px-2.5 py-1.5 bg-yellow-950/20 hover:bg-yellow-600 hover:text-black text-yellow-400 border border-yellow-900/40 rounded transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                        title="Fijar tiempo restante a 0 s"
                      >
                        Instant Travel ⚡
                      </button>

                      <button
                        onClick={() => handleAbortMission(fleet.fleetId)}
                        disabled={fleet.state === 'Finished' || fleet.state === 'Returning'}
                        className="px-2.5 py-1.5 bg-red-950/20 hover:bg-[#ff1e1e] hover:text-white text-red-400 border border-red-900/40 rounded transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                        title="Forzar retorno con tiempo proporcional"
                      >
                        Abortar Misión
                      </button>

                      <button
                        onClick={() => handleOverrideLocks(fleet.fleetId)}
                        className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded transition-all cursor-pointer"
                        title="Limpiar variables de bloqueo para liberar la CAN del jugador"
                      >
                        Override CAN
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* VIEW 3: RNG IN-FLIGHT EVENTS ENGINE */}
        {activeView === 'vuelo_rng' && (
          <motion.div
            key="vuelo_rng"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="grid grid-cols-1 xl:grid-cols-3 gap-6"
          >
            {/* EVENT TRIGGER FLIGHT MATRIX COLUMN */}
            <div className="xl:col-span-2 bg-zinc-950 border border-zinc-900 rounded-lg p-4 space-y-4">
              <div className="border-b border-zinc-900 pb-3">
                <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-widest block">
                  🎰 GATILLADORES DEL MOTOR DE ENCUENTROS RNG EN VIVO
                </span>
                <span className="text-[10px] text-zinc-550 block font-mono mt-0.5">
                  Selecciona una flota activa abajo para forzarle la inyección inmediata de un peligro, combate o beneficio.
                </span>
              </div>

              <div className="space-y-4">
                {fleets.filter(f => f.state !== 'Finished').map((fleet) => (
                  <div key={fleet.fleetId} className="p-3 bg-black border border-zinc-900 rounded-lg space-y-3">
                    <div className="flex justify-between items-center border-b border-zinc-900/70 pb-2">
                      <span className="font-mono text-xs font-bold text-white">{fleet.fleetId} ({fleet.shipType})</span>
                      <span className="font-mono text-[10px] text-amber-500">Estado: {fleet.state}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[9px] uppercase font-semibold">
                      {/* HOSTILE ATTACKS Column */}
                      <div className="p-2 bg-zinc-950 border border-zinc-900 rounded flex flex-col gap-1.5">
                        <span className="text-zinc-500 text-[8px] font-bold block mb-1">⚔️ COMBATES HOSTILES</span>
                        <button
                          onClick={() => handleTriggerPveIncursion(fleet.fleetId, 'LIF')}
                          className="w-full py-1 text-left px-2 bg-red-950/20 hover:bg-red-900 text-red-400 border border-red-900/30 rounded"
                        >
                          + Iniciar Piratas (LIF)
                        </button>
                        <button
                          onClick={() => handleTriggerPveIncursion(fleet.fleetId, 'XENOGON')}
                          className="w-full py-1 text-left px-2 bg-red-950/20 hover:bg-red-900 text-red-400 border border-red-900/30 rounded"
                        >
                          + Xenogon Swarm
                        </button>
                      </div>

                      {/* PEACEFUL INCIDENTS Column */}
                      <div className="p-2 bg-zinc-950 border border-zinc-900 rounded flex flex-col gap-1.5">
                        <span className="text-zinc-500 text-[8px] font-bold block mb-1">🤝 ENCUENTROS PACÍFICOS</span>
                        <button
                          onClick={() => handleTriggerNpcEncounter(fleet.fleetId, 'TARYN')}
                          className="w-full py-1 text-left px-2 bg-emerald-950/20 hover:bg-emerald-900 text-emerald-400 border border-emerald-900/30 rounded"
                        >
                          + Taryn Coalition
                        </button>
                        <button
                          onClick={() => handleTriggerNpcEncounter(fleet.fleetId, 'GUILD')}
                          className="w-full py-1 text-left px-2 bg-emerald-950/20 hover:bg-emerald-900 text-emerald-400 border border-emerald-900/30 rounded"
                        >
                          + Traders Guild
                        </button>
                      </div>

                      {/* ENVIRONMENTAL HAZARDS Column */}
                      <div className="p-2 bg-zinc-950 border border-zinc-900 rounded flex flex-col gap-1.5">
                        <span className="text-zinc-500 text-[8px] font-bold block mb-1">☄️ ANOMALÍAS ASTROFILICAS</span>
                        <button
                          onClick={() => handleTriggerAnomaly(fleet.fleetId, 'BLACK_HOLE')}
                          className="w-full py-1 text-left px-2 bg-purple-950/20 hover:bg-purple-950 text-purple-400 border border-purple-900/30 rounded"
                        >
                          + Agujero Negro
                        </button>
                        <button
                          onClick={() => handleTriggerAnomaly(fleet.fleetId, 'SUPERNOVA')}
                          className="w-full py-1 text-left px-2 bg-purple-950/20 hover:bg-purple-950 text-purple-400 border border-purple-900/30 rounded"
                        >
                          + Supernova
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RNG LOGS MONITOR AND SLIDERS */}
            <div className="xl:col-span-1 space-y-4">
              {/* ACCIDENT TATE SLIDERS */}
              <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-4 space-y-4 font-mono text-xs">
                <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-widest block border-b border-zinc-900 pb-2">
                  🎚️ VELOCIDAD DE ENCUENTROS RNG (ENCOUNTER RATE)
                </span>

                <div className="space-y-3 text-[11px]">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-zinc-500">Corta (1-3h) Rate:</span>
                      <span className="text-white font-bold">{encounterRateShort}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={encounterRateShort}
                      onChange={(e) => setEncounterRateShort(Number(e.target.value))}
                      className="w-full outline-none accent-red-500 bg-zinc-900 h-1 rounded-lg"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-zinc-550">Media (4-8h) Rate:</span>
                      <span className="text-white font-bold">{encounterRateMedium}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={encounterRateMedium}
                      onChange={(e) => setEncounterRateMedium(Number(e.target.value))}
                      className="w-full outline-none accent-red-500 bg-zinc-900 h-1 rounded-lg"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-zinc-550 font-sans">Larga (10-16h) Rate:</span>
                      <span className="text-white font-bold">{encounterRateLong}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={encounterRateLong}
                      onChange={(e) => setEncounterRateLong(Number(e.target.value))}
                      className="w-full outline-none accent-red-00 h-1 rounded bg-zinc-900"
                    />
                  </div>
                </div>
              </div>

              {/* EVENT LOGS */}
              <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-4 space-y-3 font-mono text-[11px]">
                <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                  <span className="text-zinc-400 font-bold">HISTORIAL DE ENCUENTROS RNG</span>
                  <button 
                    onClick={() => setRngLogs(["[RNG-INFO]: Console logs wiped."])}
                    className="text-[9px] text-[#ff1e1e] hover:underline"
                  >
                    WIPE
                  </button>
                </div>

                <div className="bg-black/90 rounded border border-zinc-900 p-2.5 h-[230px] overflow-y-auto space-y-1.5 scrollbar-thin text-xs text-zinc-400 font-mono">
                  {rngLogs.map((log, i) => (
                    <div key={i} className="leading-5 border-b border-zinc-950 pb-1 last:border-0">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* VIEW 4: MODULO INTERACCION HABILIDADES (IN-FLIGHT SKILLS) */}
        {activeView === 'vuelo_skills' && (
          <motion.div
            key="vuelo_skills"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="grid grid-cols-1 xl:grid-cols-2 gap-6"
          >
            {/* QUANTUM EVASION AND ABSORPTION AUDITOR */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-4 space-y-4">
              <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-widest block border-b border-zinc-900 pb-2">
                🎛️ DETECTOR DE SKILLS ESTANDARIZADOS (IN-FLIGHT INTEGRITY)
              </span>

              <div className="space-y-3 font-mono text-xs">
                {fleets.map(f => (
                  <div key={f.fleetId} className="bg-black border border-zinc-900/60 p-3 rounded-lg space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-bold">{f.fleetId} ({f.commander})</span>
                      <span className="text-zinc-550 text-[10px]">Habilidad en Escaneo</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                      {/* EVASION */}
                      <div className="p-2 bg-zinc-950 rounded border border-zinc-900 flex justify-between items-center">
                        <span className="text-zinc-500">Quantum Stealth:</span>
                        <span className={`px-1.5 py-0.2 rounded font-bold ${f.isQuantumStealthEvasion ? 'text-emerald-400 bg-emerald-950/20 border border-emerald-900/50' : 'text-zinc-650'}`}>
                          {f.isQuantumStealthEvasion ? 'EVADE_ON' : 'DEACTIVATED'}
                        </span>
                      </div>

                      {/* ABSORPTION */}
                      <div className="p-2 bg-zinc-950 rounded border border-zinc-900 flex justify-between items-center">
                        <span className="text-zinc-500">Anomaly Absorb:</span>
                        <span className={`px-1.5 py-0.2 rounded font-bold ${f.anomalyAbsorbed ? 'text-indigo-400 bg-indigo-950/20 border border-indigo-900/50' : 'text-zinc-650'}`}>
                          {f.anomalyAbsorbed ? 'ABSORB_OK' : 'DEACTIVATED'}
                        </span>
                      </div>

                      {/* ORDERS LAW */}
                      <div className="p-2 bg-zinc-950 rounded border border-zinc-900 flex justify-between items-center">
                        <span className="text-zinc-500">Order's Law Math:</span>
                        <span className={`px-1.5 py-0.2 rounded font-bold ${f.ordersLawTriggered ? 'text-yellow-400 bg-yellow-950/20 border border-yellow-904' : 'text-zinc-650'}`}>
                          {f.ordersLawTriggered ? 'ACTIVE' : 'DEACTIVATED'}
                        </span>
                      </div>

                      {/* FUEL MULTIPLIERS */}
                      <div className="p-2 bg-zinc-950 rounded border border-zinc-900 flex justify-between items-center">
                        <span className="text-zinc-500 font-sans">Supernova Gas:</span>
                        <span className={`px-1.5 py-0.2 rounded font-bold ${f.hasSupernovaPhaseDisplacement ? 'text-red-400 bg-red-950/20 border border-red-900' : 'text-zinc-650'}`}>
                          {f.hasSupernovaPhaseDisplacement ? 'ENABLED' : 'DEACTIVATED'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* DARK MATTER PRODUCTION / LAWS STAT MONITOR */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-4 space-y-4">
              <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-widest block border-b border-zinc-900 pb-2">
                ⚙️ MULTIPLICADOR DE PHASE DISPLACEMENT & ESTADÍSTICAS REAL-TIME
              </span>

              <div className="space-y-4 font-mono text-xs">
                {/* SLIDER CONFIGURATION */}
                <div className="p-3 bg-black border border-zinc-900 rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Ajustar Reducción "Phase Displacement":</span>
                    <span className="text-[#ff1e1e] font-bold">{phaseDisplacementReduction}% menos tiempo</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={90}
                    value={phaseDisplacementReduction}
                    onChange={(e) => {
                      setPhaseDisplacementReduction(Number(e.target.value));
                      addRngLog(`ADMIN modified Phase Displacement parameter to ${e.target.value}%`);
                    }}
                    className="w-full accent-[#ff1e1e] cursor-pointer"
                  />
                  <p className="text-[10px] text-zinc-550 italic leading-relaxed">
                    Valor estándar del servidor: 40%. Cambiar este parámetro alterará instantáneamente el descuento aplicado al ocurrir una Supernova.
                  </p>
                </div>

                {/* METRIC CARD BOX GROUPS */}
                <div className="grid grid-cols-2 gap-4">
                  {/* METRIC 1 */}
                  <div className="p-3 bg-black border border-zinc-900 rounded-lg space-y-1">
                    <span className="text-zinc-500 font-bold block text-[10px]">TOTAL DARK MATTER GENERATED</span>
                    <span className="text-emerald-400 text-lg font-bold">
                      {fleets.reduce((acc, f) => acc + f.darkMatterGenerated, 0).toFixed(2)} DM_COIN
                    </span>
                    <span className="text-[9px] text-zinc-600 block mt-1">Acero líquido fundido por motores de agujero negro</span>
                  </div>

                  {/* METRIC 2 */}
                  <div className="p-3 bg-black border border-zinc-900 rounded-lg space-y-1">
                    <span className="text-zinc-500 font-bold block text-[10px]">PRINTED PHANTOM COINS</span>
                    <span className="text-yellow-400 text-lg font-bold">
                      {fleets.reduce((acc, f) => acc + f.phantomCoinsPrinted, 0)} PHNTM
                    </span>
                    <span className="text-[9px] text-zinc-650 block mt-1">Monedas blockchain acuñadas vía Order's Law contra maras</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* VIEW 5: FLIGHT SECURITY & ANTI-EXPLOIT MONITOR */}
        {activeView === 'vuelo_seguridad' && (
          <motion.div
            key="vuelo_seguridad"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="grid grid-cols-1 xl:grid-cols-3 gap-6"
          >
            {/* LOCKS MONITOR SEC */}
            <div className="xl:col-span-2 bg-zinc-950 border border-zinc-900 rounded-lg p-4 space-y-4 font-mono text-xs">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-zinc-900 pb-2.5 gap-2">
                <div>
                  <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-widest block">
                    ⛔ BLOQUEO DE C.A.N. Y RESTRICCIONES DE VUELOS
                  </span>
                  <span className="text-[9.5px] text-zinc-550 block font-normal mt-0.5">
                    Evita que jugadores desactiven, reemplacen o modifiquen cualquier tecnología, estructura o insignia en la C.A.N. si la flota está transitando.
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[9px] text-zinc-500">REGLA DE ORO ACTIVADA:</span>
                  <button
                    onClick={() => {
                      setCanLocksEnforced(!canLocksEnforced);
                      setIsAlertToShow({
                        show: true,
                        status: !canLocksEnforced ? 'success' : 'error',
                        message: !canLocksEnforced ? 'Seguridad C.A.N Bloqueda firmemente.' : '¡Atención! Desbloqueando la C.A.N del servidor en caliente.'
                      });
                      addRngLog(`Security Rule "GOLDEN_LOCK_RULE" toggled to: ${!canLocksEnforced}`);
                    }}
                    className={`px-3 py-1 text-[9.5px] font-bold rounded cursor-pointer ${
                      canLocksEnforced ? 'bg-[#ff1e1e] text-white' : 'bg-zinc-800 text-zinc-450'
                    }`}
                  >
                    {canLocksEnforced ? 'SECURED (ON)' : 'BYPASSED'}
                  </button>
                </div>
              </div>

              {/* LIVE ACTIVE MONITORS FOR EQUIPMENT OVERRIDES */}
              <div className="space-y-3">
                {fleets.map(f => (
                  <div key={f.fleetId} className="p-3 bg-black border border-zinc-900 rounded flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold">{f.fleetId}</span>
                        <span className="text-zinc-650 text-[10px]">({f.commander})</span>
                      </div>
                      <span className="text-[9.5px] text-zinc-500 block mt-1">
                        expeditionActive: <span className="text-white font-bold">{f.expeditionActive ? 'TRUE (VUELO)' : 'FALSE'}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* RED ALERT FOR CAN REPLACEMENT ATTEMPTS */}
                      {f.expeditionActive && canLocksEnforced ? (
                        <div className="px-2 py-0.5 bg-red-950/40 border border-red-900 text-red-500 font-extrabold text-[8.5px] rounded tracking-wider animate-pulse flex items-center gap-1">
                          <EyeOff size={10} />
                          <span>C.A.N. LOCKED / BLOCKED</span>
                        </div>
                      ) : (
                        <div className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-500 text-[8.5px] rounded flex items-center gap-1">
                          <Eye size={10} />
                          <span>FREE STATE / EDITS ALLOWED</span>
                        </div>
                      )}

                      <button
                        onClick={() => handleForceNextState(f.fleetId)}
                        className="px-2 py-1 bg-zinc-900 hover:bg-red-650 hover:text-white rounded text-[9px] text-zinc-400 cursor-pointer"
                      >
                        Pasar Turno
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* HERRAMIENTA DE CURACIÓN EN BLOQUE / MASIVA */}
              <div className="border-t border-zinc-900 pt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-[#ff1e1e]/10 text-[#ff1e1e]">
                    <BatteryCharging size={13} />
                  </div>
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                    🩹 HERRAMIENTA DE CURACIÓN EN BLOQUE (BULK-HEALING TOOL)
                  </span>
                </div>

                <div className="bg-black/60 border border-zinc-900 rounded p-3 space-y-3">
                  <div className="space-y-1.5">
                    <span className="text-[9px] text-zinc-500 font-bold uppercase block">1. Seleccionar Flotas Espaciales para Reparar:</span>
                    <div className="flex flex-wrap gap-2">
                      {fleets.map(f => {
                        const isSelected = bulkSelectedFleets.includes(f.fleetId);
                        return (
                          <button
                            key={f.fleetId}
                            type="button"
                            onClick={() => {
                              if (bulkSelectedFleets.includes(f.fleetId)) {
                                setBulkSelectedFleets(prev => prev.filter(id => id !== f.fleetId));
                              } else {
                                setBulkSelectedFleets(prev => [...prev, f.fleetId]);
                              }
                            }}
                            className={`px-2 py-1.5 rounded border text-[9.5px] font-mono transition-all flex items-center gap-1.5 select-none ${
                              isSelected
                                ? 'bg-[#ff1e1e]/20 border-[#ff1e1e] text-white font-bold'
                                : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-855'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              readOnly
                              className="accent-[#ff1e1e] h-3 w-3 shrink-0 cursor-pointer"
                            />
                            <span>{f.fleetId}</span>
                            <span className="text-[8px] opacity-70">({Math.round((f.fleetHpCurrent / f.fleetHpMax) * 100)}% HP)</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
                    <div>
                      <span className="text-[9px] text-zinc-500 font-bold uppercase block mb-1">2. Kit de Reparación Autorizado:</span>
                      <select
                        value={bulkHealingKit}
                        onChange={(e) => setBulkHealingKit(e.target.value as any)}
                        className="w-full bg-zinc-950 border border-zinc-900 p-2 rounded text-[10px] text-white focus:outline-none cursor-pointer font-bold font-mono"
                      >
                        <option value="SMALL">Small Repair Kit (+25% HP)</option>
                        <option value="MED">Medium Repair Kit (+50% HP)</option>
                        <option value="LARGE">Large Repair Kit (+100% HP)</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={handleBulkHeal}
                      className="w-full px-4 py-2 bg-[#ff1e1e] hover:bg-red-700 text-white border border-[#ff1e1e]/80 rounded text-[9.5px] font-bold uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer font-sans"
                    >
                      <Zap size={12} />
                      Aplicar Reparación Masiva
                    </button>
                  </div>
                </div>
              </div>

              {/* HEALING CONTROL AND HEALTH CHECK */}
              <div className="border-t border-zinc-900 pt-4 space-y-3">
                <span className="text-[10px] text-zinc-400 font-bold block">🩹 REGISTRO HISTÓRICO DE CURACIONES (HP CHECK)</span>
                
                <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                  {healingLogs.map(h => (
                    <div key={h.id} className="p-2 bg-zinc-950 border border-zinc-900/60 rounded flex items-center justify-between text-[11px]">
                      <div>
                        <span className="text-zinc-300 font-bold">{h.fleetId}</span> inyectó <span className="text-emerald-400 font-bold">{h.kitUsed}</span>.
                        <p className="text-[8.5px] text-zinc-500 mt-1">Timestamp: {new Date(h.timestamp).toLocaleTimeString()} • ID: {h.id}</p>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className="text-zinc-450 block text-[10px]">HP: {h.hpBefore} ➔ {h.hpAfter}</span>
                        <span className="px-1 py-0.2 bg-emerald-950 text-emerald-400 text-[8.5px] font-bold rounded border border-emerald-950 block mt-0.5 text-center">LEGÍTIMO</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* EXPLOIT LOGS */}
            <div className="xl:col-span-1 flex flex-col gap-6">
              
              <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-4 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-red-950/40 pb-2">
                  <span className="text-[10px] font-mono text-red-500 font-extrabold uppercase tracking-widest block">
                    🔴 RED ALERTS: CAN EXPLOIT LOGS
                  </span>

                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleExportExploitLogs('CSV')}
                      title="Exportar como CSV"
                      className="p-1 rounded bg-zinc-900 hover:bg-[#ff1e1e] hover:text-white text-zinc-400 border border-zinc-800 transition-all cursor-pointer flex items-center gap-1 font-sans font-bold text-[9px]"
                    >
                      <Download size={11} />
                      <span>CSV</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExportExploitLogs('JSON')}
                      title="Exportar como JSON"
                      className="p-1 rounded bg-zinc-900 hover:bg-[#ff1e1e] hover:text-white text-zinc-400 border border-zinc-800 transition-all cursor-pointer flex items-center gap-1 font-sans font-bold text-[9px]"
                    >
                      <Download size={11} />
                      <span>JSON</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-3.5 max-h-[190px] overflow-y-auto pr-1">
                  {exploitLogs.map(log => (
                    <div key={log.id} className="p-3 bg-red-950/10 border border-red-950/35 rounded-lg space-y-2">
                      <div className="flex justify-between items-center text-[10px] text-red-400 font-bold">
                        <span className="bg-red-950 border border-red-900 px-1 rounded">{log.severity}</span>
                        <span>{log.status}</span>
                      </div>

                      <p className="text-zinc-200 font-semibold leading-relaxed text-[11px]">
                        {log.attemptedAction}
                      </p>

                      <div className="text-[9.5px] text-zinc-500 leading-relaxed border-t border-red-950/20 pt-2">
                        <span className="block">Comandante: {log.commander}</span>
                        <span className="block break-all mt-0.5">Jugador: {log.userId.slice(0, 15)}...</span>
                        <span className="block mt-0.5">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* PERSISTENT IN-FLIGHT ANOMALIES LOG */}
              <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-4 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-indigo-950/40 pb-2">
                  <span className="text-[10px] font-mono text-indigo-400 font-extrabold uppercase tracking-widest block">
                    🌀 DETECTED IN-FLIGHT ANOMALIES
                  </span>
                  <span className="text-[8.5px] text-zinc-550 font-bold bg-indigo-950/40 border border-indigo-900/60 px-1.5 py-0.2 rounded font-mono">
                    LOGS: {anomalyLogs.length}
                  </span>
                </div>

                <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
                  {anomalyLogs.length === 0 ? (
                    <div className="p-4 text-center italic text-zinc-650 bg-black/40 rounded border border-zinc-900/60 font-mono text-xs">
                      No se han detectado anomalías gravitacionales en vuelo.
                    </div>
                  ) : (
                    anomalyLogs.map(anom => (
                      <div key={anom.id} className="p-2.5 bg-indigo-950/10 border border-indigo-950/40 rounded space-y-1 text-[10px]">
                        <div className="flex justify-between items-center font-bold">
                          <span className={`px-1 py-0.5 rounded text-[8.5px] border ${
                            anom.anomalyType === 'BLACK_HOLE' ? 'bg-indigo-950 border-indigo-900 text-indigo-400' :
                            anom.anomalyType === 'SUPERNOVA' ? 'bg-amber-950 border-amber-900 text-amber-500' :
                            'bg-emerald-950 border-emerald-900 text-emerald-400'
                          }`}>
                            {anom.anomalyType}
                          </span>
                          <span className="text-[8.5px] text-zinc-550 font-normal">{new Date(anom.timestamp).toLocaleTimeString()}</span>
                        </div>

                        <p className="text-zinc-350 leading-normal font-sans text-[10.5px]">
                          {anom.effectDetails}
                        </p>

                        <div className="flex justify-between items-center text-[8.5px] text-zinc-550 border-t border-indigo-950/20 pt-1.5 mt-1.5 font-mono">
                          <span>Flota: <span className="text-zinc-400 font-bold">{anom.fleetId}</span></span>
                          <span>Comandante: {anom.commander.split(' ')[1] || anom.commander}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* VIEW 6: ALERTAS DE FLOTA PANEL */}
        {activeView === 'vuelo_alertas' && (
          <motion.div
            key="vuelo_alertas"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="grid grid-cols-1 xl:grid-cols-3 gap-6"
          >
            {/* Left side: Configuration details per fleet */}
            <div className="xl:col-span-2 bg-zinc-950 border border-zinc-900 rounded-lg p-5 space-y-4 font-mono text-xs">
              <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
                <Sliders size={15} className="text-[#ff1e1e] shrink-0 animate-pulse" />
                <span className="text-[11px] font-mono font-bold text-zinc-300 uppercase tracking-wider block">
                  🛡️ CONFIGURACIÓN DE UMBRALES DE INTEGRIDAD CASCO (FLEET THRESHOLDS)
                </span>
              </div>
              
              <p className="text-[11px] text-zinc-500 font-sans leading-relaxed">
                Define umbrales críticos de <span className="text-[#ff1e1e] font-semibold font-mono">hull_integrity</span> para cada explorador estelar. Si la integridad de la nave desciende por debajo de este límite durante su expedición en vivo, el sistema activará flujos de evacuación estricta y alertas HUD tácticas.
              </p>

              <div className="space-y-4 pt-2">
                {fleets.map(f => {
                  const hasAlertConfig = fleetAlertConfigs[f.fleetId];
                  const currentHpPercent = Math.round((f.fleetHpCurrent / f.fleetHpMax) * 100);
                  const isTriggered = hasAlertConfig && currentHpPercent < hasAlertConfig.thresholdPercent;

                  return (
                    <div 
                      key={f.fleetId} 
                      className={`p-4 bg-black border rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                        isTriggered ? 'border-red-500/40 bg-red-950/10' : 'border-zinc-900 bg-zinc-950/40'
                      }`}
                    >
                      <div className="space-y-2 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-white text-xs">{f.fleetId}</span>
                          <span className="text-zinc-500 font-mono text-[10px]">({f.commander})</span>
                          
                          {isTriggered ? (
                            <span className="text-[8.5px] font-mono font-extrabold bg-red-950 text-red-500 border border-red-900 px-2 py-0.5 rounded animate-pulse">
                              🚨 ALERTA ACTIVA: HP {currentHpPercent}% &lt; {hasAlertConfig.thresholdPercent}%
                            </span>
                          ) : (
                            <span className="text-[8.5px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-900 px-2 py-0.5 rounded">
                              NORMAL: HP {currentHpPercent}%
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="text-zinc-400 font-mono">Mensaje actual:</span>
                          <span className="text-zinc-500 font-mono truncate max-w-md block italic">
                            {hasAlertConfig ? hasAlertConfig.customMessage.replace('{THRESHOLD}', hasAlertConfig.thresholdPercent.toString()) : 'Default alert'}
                          </span>
                        </div>

                        {/* Interactive edit block */}
                        <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-zinc-550 block text-[9px] uppercase font-bold font-mono">Umbral de Integridad Crítica (%):</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="range"
                                min="10"
                                max="85"
                                value={hasAlertConfig ? hasAlertConfig.thresholdPercent : 30}
                                onChange={(e) => {
                                  const newVal = parseInt(e.target.value) || 30;
                                  setFleetAlertConfigs(prev => ({
                                    ...prev,
                                    [f.fleetId]: {
                                      ...prev[f.fleetId],
                                      thresholdPercent: newVal
                                    }
                                  }));
                                }}
                                className="flex-1 accent-[#ff1e1e] cursor-pointer"
                              />
                              <span className="text-yellow-400 font-extrabold text-[10px] shrink-0 font-mono">
                                {hasAlertConfig ? hasAlertConfig.thresholdPercent : 30}% HP
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-zinc-550 block text-[9px] uppercase font-bold font-mono">Template de Alerta:</label>
                            <input
                              type="text"
                              value={hasAlertConfig ? hasAlertConfig.customMessage : ''}
                              onChange={(e) => {
                                const newTxt = e.target.value;
                                setFleetAlertConfigs(prev => ({
                                  ...prev,
                                  [f.fleetId]: {
                                    ...prev[f.fleetId],
                                    customMessage: newTxt
                                  }
                                }));
                              }}
                              className="w-full bg-black border border-zinc-850 p-1 rounded font-mono text-[10px] text-zinc-200 focus:outline-none focus:border-[#ff1e1e]"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-row md:flex-col gap-1.5 self-end md:self-center shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setIsAlertToShow({
                              show: true,
                              status: 'success',
                              message: `Umbral de alerta grabado con éxito en el servidor de Sasorilabs para ${f.fleetId}.`
                            });
                          }}
                          className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold font-mono rounded text-[9.5px] border border-zinc-850 cursor-pointer transition-colors"
                        >
                          Grabar Config.
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const conf = fleetAlertConfigs[f.fleetId];
                            const msgText = conf ? conf.customMessage.replace('{THRESHOLD}', conf.thresholdPercent.toString()) : "Alerta de sistema";
                            
                            const newPushLog = {
                              id: `PUSH-LOG-${Date.now()}`,
                              timestamp: new Date().toISOString(),
                              commander: f.commander,
                              message: msgText,
                              status: 'DELIVERED' as const
                            };

                            setSentPushLogs(prev => [newPushLog, ...prev]);

                            setIsAlertToShow({
                              show: true,
                              status: 'success',
                              message: `🔔 NOTIFICACIÓN TRANSMITIDA: Se envió un push de prueba al HUD del comandante ${f.commander}.`
                            });
                          }}
                          className="px-2.5 py-1.5 bg-red-950/25 hover:bg-[#ff1e1e] hover:text-white text-red-500 border border-red-950/60 rounded text-[9.5px] font-bold font-mono cursor-pointer transition-all"
                        >
                          Test Push 🔔
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right side: Push Notification Terminal logs */}
            <div className="xl:col-span-1 space-y-6">
              <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-4 space-y-4 font-mono text-xs">
                <div className="flex justify-between items-center border-b border-zinc-900 pb-2 flex-wrap gap-2">
                  <span className="text-[9.5px] font-mono text-zinc-400 font-bold uppercase tracking-widest block">
                    📡 COLA BROADCAST (HUD PUSH LOGS)
                  </span>
                  <span className="text-[8.5px] text-zinc-550 font-bold bg-zinc-900 border border-zinc-850 px-1.5 py-0.2 rounded font-mono">
                    SENT: {sentPushLogs.length}
                  </span>
                </div>

                <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                  {sentPushLogs.map(log => (
                    <div key={log.id} className="p-3 bg-black border border-zinc-900 rounded-lg space-y-1.5 text-[10px] leading-relaxed">
                      <div className="flex justify-between items-center text-[8.5px] text-zinc-500 font-bold">
                        <span className="text-zinc-400">{log.commander}</span>
                        <span className="text-emerald-400 flex items-center gap-1 font-mono uppercase">
                          <Zap size={9} className="text-emerald-500" />
                          {log.status}
                        </span>
                      </div>

                      <p className="text-zinc-300 font-sans leading-relaxed text-[10px]">
                        {log.message}
                      </p>

                      <div className="text-[8.5px] text-zinc-650 pt-1 border-t border-zinc-900/60">
                        {new Date(log.timestamp).toLocaleTimeString()} - Broadcast Sideral
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
