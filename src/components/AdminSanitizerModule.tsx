import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { 
  ShieldAlert, Activity, GitBranch, Terminal, Shield, RefreshCw
} from 'lucide-react';
import { GalaxyDustConfig } from '../types';

interface AdminSanitizerModuleProps {
  gameHud: GalaxyDustConfig;
  saveGameHud: (hud: GalaxyDustConfig) => void;
  alertTrigger: (status: 'success' | 'error' | 'warning', message: string) => void;
}

export default function AdminSanitizerModule({ gameHud, saveGameHud, alertTrigger }: AdminSanitizerModuleProps) {
  const phantomStation = gameHud.phantomStation || {
    unitsCatalog: [],
    suppliesCatalog: []
  } as any;

  const [cleansingLog, setCleansingLog] = useState<Array<{ timestamp: string; event: string; type: 'auto' | 'manual'; details: any }>>([
    { timestamp: new Date().toLocaleTimeString(), event: 'DATA SANITIZER INITIALIZED. Awaiting commands...', type: 'auto', details: null }
  ]);

  const burntLogs = [
    { hour: '00:00', burnt: 120 }, { hour: '04:00', burnt: 210 },
    { hour: '08:00', burnt: 800 }, { hour: '12:00', burnt: 430 },
    { hour: '16:00', burnt: 1050 }, { hour: '20:00', burnt: 600 },
    { hour: '23:59', burnt: 350 }
  ];

  const addCleansingLog = (eventStr: string, type: 'auto' | 'manual' = 'manual', details: any = null) => {
    setCleansingLog(prev => [{
      timestamp: new Date().toLocaleTimeString(),
      event: eventStr,
      type,
      details
    }, ...prev].slice(0, 30));
  };

  const handlePurgeAsianRanks = () => {
    let diffData: any = { catalogRarityChanges: 0, suppliesRarityChanges: 0 };
    const updatedUnits = phantomStation.unitsCatalog.map((unit: any) => {
      let nextRank = unit.rank || 'Common';
      const prevRank = unit.rank || 'Common';
      const upperRank = nextRank.toUpperCase().trim();
      if (upperRank === 'S') nextRank = 'Legendary';
      else if (upperRank === 'A') nextRank = 'Epic';
      else if (upperRank === 'C') nextRank = 'Rare';
      else if (upperRank === 'E') nextRank = 'Common';
      
      const allowed = ['Common', 'Rare', 'Epic', 'Legendary', 'Exclusive', 'Heroic'];
      if (!allowed.includes(nextRank)) nextRank = 'Epic';

      if (prevRank !== nextRank) {
         diffData[`Unit[${unit.id}]`] = `${prevRank} -> ${nextRank}`;
         diffData.catalogRarityChanges++;
      }
      return { ...unit, rank: nextRank };
    });

    const updatedSupplies = phantomStation.suppliesCatalog.map((sup: any) => {
      let nextRank = sup.rank || sup.category || 'Common';
      const prevRank = sup.rank || 'Common';
      const upperRank = String(nextRank).toUpperCase().trim();
      if (upperRank === 'S') nextRank = 'Legendary';
      else if (upperRank === 'A') nextRank = 'Epic';
      else if (upperRank === 'C') nextRank = 'Rare';
      else if (upperRank === 'E') nextRank = 'Common';
      else nextRank = 'Epic';

      if (prevRank !== nextRank) {
         diffData[`Supply[${sup.id}]`] = `${prevRank} -> ${nextRank}`;
         diffData.suppliesRarityChanges++;
      }
      return { ...sup, rank: nextRank };
    });

    saveGameHud({ ...gameHud, phantomStation: { ...phantomStation, unitsCatalog: updatedUnits, suppliesCatalog: updatedSupplies } });
    addCleansingLog(`🧹 [Rarity Cleansing]: Rango asiáticos purgados. Unidades mod: ${diffData.catalogRarityChanges}`, 'manual', diffData);
    alertTrigger('success', '🧹 [Rarity Cleansing]: Rango asiáticos purgados a la nomenclatura legal.');
  };

  const handlePurgeElementalDamage = () => {
    let diffData: any = { elementalDamageChanges: 0 };
    const updatedUnits = phantomStation.unitsCatalog.map((unit: any) => {
      let nextType = unit.elementType || 'Cinético';
      const prevType = unit.elementType || 'Cinético';
      const lowerType = String(nextType).toLowerCase().trim();
      if (lowerType === 'fire' || lowerType === 'fuego' || lowerType === 'dark' || lowerType === 'oscuridad') nextType = 'Plasma';
      else if (lowerType === 'ice' || lowerType === 'hielo' || lowerType === 'air' || lowerType === 'aire' || lowerType === 'light') nextType = 'Láser';
      else if (lowerType === 'void' || lowerType === 'vacio' || lowerType === 'water' || lowerType === 'agua') nextType = 'Iónico';
      else if (lowerType === 'earth' || lowerType === 'tierra' || lowerType === 'kinetic') nextType = 'Cinético';
      else if (lowerType === 'graviton' || lowerType === 'gravedad') nextType = 'Gravitón';
      else {
        const valid = ['Cinético', 'Láser', 'Plasma', 'Iónico', 'Gravitón'];
        if (!valid.includes(nextType)) nextType = 'Cinético';
      }
      if (prevType !== nextType) {
         diffData[`Unit[${unit.id}]`] = `${prevType} -> ${nextType}`;
         diffData.elementalDamageChanges++;
      }
      return { ...unit, elementType: nextType };
    });

    saveGameHud({ ...gameHud, phantomStation: { ...phantomStation, unitsCatalog: updatedUnits } });
    addCleansingLog(`🧬 [Element Normalization]: Daños mapeados. Unidades mod: ${diffData.elementalDamageChanges}`, 'manual', diffData);
    alertTrigger('success', '🧬 [Element Normalization]: Todos los daños de naves purgados a los 5 tipos oficiales.');
  };

  const handleCleanFakeResources = () => {
    let diffData: any = { resourcesCleaned: 0 };
    const updatedStore = phantomStation.suppliesCatalog.map((sup: any) => {
      let nextName = sup.name;
      const prevName = sup.name;
      if (sup.name.includes('Carbono') || sup.name.includes('Polvo')) {
        nextName = sup.name.replace('Bloque Estructural de Titanio', 'Nano-Repair Frame Kit')
                            .replace('Uranio Enriquecido', 'Power Core Conductor')
                            .replace('Bloque de Carbono', 'QMP Micro-Processor')
                            .replace('Polvo Estelar', 'Chronos Speed Booster');
      }
      if (prevName !== nextName) {
         diffData[`Supply[${sup.id}]`] = `${prevName} -> ${nextName}`;
         diffData.resourcesCleaned++;
      }
      return { ...sup, name: nextName };
    });

    saveGameHud({ ...gameHud, phantomStation: { ...phantomStation, suppliesCatalog: updatedStore } });
    addCleansingLog(`🧹 [Limpieza Recursos]: Descripciones de relleno eliminadas. Mods: ${diffData.resourcesCleaned}`, 'manual', diffData);
    alertTrigger('success', '🧹 [Limpieza Recursos]: Descripciones y nombres de relleno eliminados.');
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center gap-3 border-b border-zinc-900 pb-4">
        <div className="h-10 w-10 bg-red-950/30 border border-red-500/20 rounded flex items-center justify-center text-red-500">
          <ShieldAlert size={20} />
        </div>
        <div>
          <h2 className="text-white font-bold text-lg font-mono tracking-wider uppercase">DATA SANITIZER MODULE</h2>
          <p className="text-xs text-zinc-500 font-sans mt-0.5">Purga de mockups heredados, daños mágicos y consistencia de DB.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* BUTTONS PANEL */}
        <div className="col-span-1 space-y-4">
          <div className="p-4 bg-black/45 border border-zinc-900 rounded-lg space-y-4 font-mono">
            <h3 className="text-[10px] text-red-400 font-bold uppercase border-b border-zinc-900 pb-2 flex items-center gap-2">
              <RefreshCw size={12} /> Controles Maestros de Purga
            </h3>

            <div className="space-y-3">
              <div>
                <button
                  type="button"
                  onClick={handlePurgeAsianRanks}
                  className="w-full py-2.5 bg-red-950/20 hover:bg-[#ff1e1e] text-[#ff1e1e] hover:text-white border border-[#ff1e1e]/20 hover:border-[#ff1e1e] rounded font-bold text-[10px] uppercase tracking-wider transition-all"
                >
                  Purgar Rarezas (S/A/C/E)
                </button>
                <p className="text-[9px] text-zinc-600 mt-1.5 leading-snug">Fuerza rangos: Common, Rare, Epic, Legendary, Exclusive, Heroic.</p>
              </div>

              <div>
                <button
                  type="button"
                  onClick={handlePurgeElementalDamage}
                  className="w-full py-2.5 bg-red-950/20 hover:bg-[#ff1e1e] text-[#ff1e1e] hover:text-white border border-[#ff1e1e]/20 hover:border-[#ff1e1e] rounded font-bold text-[10px] uppercase tracking-wider transition-all"
                >
                  Purgar Daño Mágico
                </button>
                <p className="text-[9px] text-zinc-600 mt-1.5 leading-snug">Mapea daños de fantasía a: Cinético, Láser, Plasma, Iónico, Gravitón.</p>
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleCleanFakeResources}
                  className="w-full py-2.5 bg-red-950/20 hover:bg-[#ff1e1e] text-[#ff1e1e] hover:text-white border border-[#ff1e1e]/20 hover:border-[#ff1e1e] rounded font-bold text-[10px] uppercase tracking-wider transition-all"
                >
                  Limpiar Recursos Falsos
                </button>
                <p className="text-[9px] text-zinc-600 mt-1.5 leading-snug">Elimina "Polvo de Dragón" y nombres genéricos por lore Sci-Fi.</p>
              </div>
            </div>
          </div>
        </div>

        {/* TERMINAL & CHART */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          
          {/* TERMINAL */}
          <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-lg font-mono">
            <h3 className="text-[10px] text-zinc-400 font-bold uppercase border-b border-zinc-900 pb-2 flex items-center gap-2 mb-3">
              <Terminal size={12} /> Console Output
            </h3>
            <div className="h-48 overflow-y-auto bg-black border border-zinc-900 rounded p-3 text-[10px] space-y-2 custom-scrollbar">
              {cleansingLog.map((log, i) => (
                <div key={i} className="space-y-1 pb-2 border-b border-zinc-900/50 last:border-0 last:pb-0">
                  <div className="flex gap-2 text-zinc-500">
                    <span className="shrink-0">[{log.timestamp}]</span>
                    <span className={log.type === 'manual' ? 'text-red-400' : 'text-emerald-500'}>
                      {log.event}
                    </span>
                  </div>
                  {log.details && (
                    <pre className="text-zinc-600 pl-[60px] overflow-x-auto">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* CHART */}
          <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-lg">
            <div className="flex justify-between items-center border-b border-zinc-900 pb-2 mb-4">
              <span className="text-[10px] text-zinc-300 font-bold uppercase flex items-center gap-2">
                <Activity size={12} className="text-red-500"/>
                TELEMETRÍA DE QUEMA EN 24 HORAS
              </span>
              <span className="text-emerald-400 text-[9px] font-bold">LIVE</span>
            </div>
            
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={burntLogs}
                  margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="miniColorBurnt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff1e1e" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#ff1e1e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#141417" vertical={false} />
                  <XAxis dataKey="hour" stroke="#52525b" fontSize={8} tickLine={false} />
                  <YAxis stroke="#52525b" fontSize={8} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', fontSize: 10 }} labelStyle={{ color: '#a1a1aa' }} />
                  <Area type="monotone" dataKey="burnt" stroke="#ff1e1e" name="Burn / Hr" fillOpacity={1} fill="url(#miniColorBurnt)" strokeWidth={1.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
