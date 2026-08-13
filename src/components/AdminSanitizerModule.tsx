import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { 
  ShieldAlert, Activity, Terminal, RefreshCw, Loader2 
} from 'lucide-react';
import { supabase } from '../lib/supabase';
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
    { timestamp: new Date().toLocaleTimeString(), event: 'DATA SANITIZER INITIALIZED. Conectado a Supabase Main. Awaiting commands...', type: 'auto', details: null }
  ]);

  const [isProcessing, setIsProcessing] = useState(false);

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

  // ─── PURGA 1: RAREZAS ASIÁTICAS (S, A, B, C...) A FORMATO GLOBAL ───
  const handlePurgeAsianRanks = async () => {
    if (!window.confirm("¿Seguro que deseas purgar las nomenclaturas de rango asiáticas de TODAS las tablas semilla de Supabase?")) return;
    setIsProcessing(true);
    let diffData: any = { catalogRarityChanges: 0 };

    try {
      // Traer todos los items semilla para chequear y modificar en masa
      const [shipsRes, structsRes, techsRes] = await Promise.all([
        supabase.from('seed_ships').select('ship_id, rarity'),
        supabase.from('seed_structures').select('id, rarity'),
        supabase.from('seed_technologies').select('id, rarity')
      ]);

      const normalizeRarity = (rank: string) => {
        let n = (rank || 'Common').toUpperCase().trim();
        if (n === 'S') return 'Legendary';
        if (n === 'A') return 'Epic';
        if (n === 'C') return 'Rare';
        if (n === 'E') return 'Common';
        const allowed = ['Common', 'Rare', 'Epic', 'Legendary', 'Exclusive', 'Phantom', 'Xmas'];
        const formatCase = n.charAt(0) + n.slice(1).toLowerCase();
        return allowed.includes(formatCase) ? formatCase : 'Epic';
      };

      // Limpieza en Naves
      const shipsToUpdate = (shipsRes.data || []).filter((s: any) => s.rarity !== normalizeRarity(s.rarity));
      for (const ship of shipsToUpdate) {
        await supabase.from('seed_ships').update({ rarity: normalizeRarity(ship.rarity) }).eq('ship_id', ship.ship_id);
        diffData.catalogRarityChanges++;
      }

      // Limpieza en Estructuras
      const structsToUpdate = (structsRes.data || []).filter((s: any) => s.rarity !== normalizeRarity(s.rarity));
      for (const struct of structsToUpdate) {
        await supabase.from('seed_structures').update({ rarity: normalizeRarity(struct.rarity) }).eq('id', struct.id);
        diffData.catalogRarityChanges++;
      }

      // Limpieza en Tecnologías
      const techsToUpdate = (techsRes.data || []).filter((t: any) => t.rarity !== normalizeRarity(t.rarity));
      for (const tech of techsToUpdate) {
        await supabase.from('seed_technologies').update({ rarity: normalizeRarity(tech.rarity) }).eq('id', tech.id);
        diffData.catalogRarityChanges++;
      }

      addCleansingLog(`🧹 [Rarity Cleansing]: Rango asiáticos purgados en Supabase. Activos alterados: ${diffData.catalogRarityChanges}`, 'manual', diffData);
      alertTrigger('success', `🧹 [Rarity Cleansing]: ${diffData.catalogRarityChanges} registros convertidos a la nomenclatura oficial.`);
    } catch (err: any) {
      console.error(err);
      alertTrigger('error', `Error en purga de rarezas: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // ─── PURGA 2: NORMALIZAR DAÑOS MÁGICOS A SCI-FI ───
  const handlePurgeElementalDamage = async () => {
    if (!window.confirm("¿Deseas mapear y transformar todo el daño 'mágico' a daño Sci-Fi en las naves base de Supabase?")) return;
    setIsProcessing(true);
    let diffData: any = { elementalDamageChanges: 0 };

    try {
      const { data: ships, error } = await supabase.from('seed_ships').select('ship_id, damage_type');
      if (error) throw error;

      const normalizeElement = (type: string) => {
        const lower = String(type || 'Kinetic').toLowerCase().trim();
        if (lower === 'fire' || lower === 'fuego' || lower === 'dark' || lower === 'oscuridad') return 'Plasma';
        if (lower === 'ice' || lower === 'hielo' || lower === 'air' || lower === 'aire' || lower === 'light') return 'Laser';
        if (lower === 'void' || lower === 'vacio' || lower === 'water' || lower === 'agua') return 'Ionic';
        if (lower === 'earth' || lower === 'tierra' || lower === 'kinetic') return 'Kinetic';
        if (lower === 'graviton' || lower === 'gravedad') return 'Graviton';
        
        const valid = ['Kinetic', 'Laser', 'Plasma', 'Ionic', 'Graviton'];
        const formatted = lower.charAt(0).toUpperCase() + lower.slice(1);
        return valid.includes(formatted) ? formatted : 'Kinetic';
      };

      const shipsToUpdate = (ships || []).filter((s: any) => s.damage_type !== normalizeElement(s.damage_type));
      for (const ship of shipsToUpdate) {
        await supabase.from('seed_ships').update({ damage_type: normalizeElement(ship.damage_type) }).eq('ship_id', ship.ship_id);
        diffData.elementalDamageChanges++;
      }

      addCleansingLog(`🧬 [Element Normalization]: Daños mapeados a estándar Sci-Fi. Naves alteradas: ${diffData.elementalDamageChanges}`, 'manual', diffData);
      alertTrigger('success', `🧬 [Element Normalization]: ${diffData.elementalDamageChanges} naves purgadas a los 5 tipos oficiales.`);
    } catch (err: any) {
      alertTrigger('error', `Error en purga elemental: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // ─── PURGA 3: LIMPIAR NOMBRES FALSOS O DE RELLENO ───
  const handleCleanFakeResources = async () => {
    if (!window.confirm("¿Seguro que deseas eliminar los nombres 'mockup' (Carbono, Polvo Estelar) por lore oficial en todos los assets?")) return;
    setIsProcessing(true);
    let diffData: any = { resourcesCleaned: 0 };

    try {
      const [techsRes, toolsRes] = await Promise.all([
        supabase.from('seed_technologies').select('id, name'),
        supabase.from('seed_tools').select('id, name')
      ]);

      const processName = (name: string) => {
        let n = name || '';
        if (n.includes('Carbono') || n.includes('Polvo')) {
          n = n.replace('Bloque Estructural de Titanio', 'Nano-Repair Frame Kit')
               .replace('Uranio Enriquecido', 'Power Core Conductor')
               .replace('Bloque de Carbono', 'QMP Micro-Processor')
               .replace('Polvo Estelar', 'Chronos Speed Booster');
        }
        return n;
      };

      const techsToUpdate = (techsRes.data || []).filter((t: any) => t.name !== processName(t.name));
      for (const tech of techsToUpdate) {
        await supabase.from('seed_technologies').update({ name: processName(tech.name) }).eq('id', tech.id);
        diffData.resourcesCleaned++;
      }

      const toolsToUpdate = (toolsRes.data || []).filter((t: any) => t.name !== processName(t.name));
      for (const tool of toolsToUpdate) {
        await supabase.from('seed_tools').update({ name: processName(tool.name) }).eq('id', tool.id);
        diffData.resourcesCleaned++;
      }

      addCleansingLog(`🧹 [Limpieza Lore]: Descripciones de relleno eliminadas. Alteraciones: ${diffData.resourcesCleaned}`, 'manual', diffData);
      alertTrigger('success', `🧹 [Limpieza Lore]: ${diffData.resourcesCleaned} activos renombrados a su lore canónico.`);
    } catch (err: any) {
      alertTrigger('error', `Error en limpieza de descripciones: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 select-none font-mono text-left">
      {/* HEADER */}
      <div className="flex items-center gap-3 border-b border-zinc-900 pb-4">
        <div className="h-10 w-10 bg-red-950/30 border border-red-500/20 rounded-xl flex items-center justify-center text-red-500">
          <ShieldAlert size={20} />
        </div>
        <div>
          <h2 className="text-white font-bold text-lg font-mono tracking-wider uppercase">DATA SANITIZER MODULE</h2>
          <p className="text-xs text-zinc-500 font-sans mt-0.5">Purga de mockups heredados, daños mágicos y consistencia de BD en Supabase.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* BUTTONS PANEL */}
        <div className="col-span-1 space-y-4">
          <div className="p-4 bg-black/45 border border-zinc-900 rounded-xl space-y-4 font-mono shadow-xl">
            <h3 className="text-[10px] text-red-400 font-bold uppercase border-b border-zinc-900 pb-2 flex items-center gap-2">
              <RefreshCw size={12} className={isProcessing ? "animate-spin" : ""} /> Controles Maestros de Purga BD
            </h3>

            <div className="space-y-4">
              <div>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handlePurgeAsianRanks}
                  className="w-full py-2.5 bg-red-950/20 hover:bg-[#ff1e1e] text-[#ff1e1e] hover:text-white border border-[#ff1e1e]/20 hover:border-[#ff1e1e] rounded font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                >
                  Purgar Rarezas Asiáticas (S/A/C)
                </button>
                <p className="text-[9px] text-zinc-600 mt-1.5 leading-snug font-sans">Fuerza rangos canónicos en Naves y Estructuras en toda la base de datos principal.</p>
              </div>

              <div>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handlePurgeElementalDamage}
                  className="w-full py-2.5 bg-red-950/20 hover:bg-[#ff1e1e] text-[#ff1e1e] hover:text-white border border-[#ff1e1e]/20 hover:border-[#ff1e1e] rounded font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                >
                  Purgar Daño Mágico Fantasy
                </button>
                <p className="text-[9px] text-zinc-600 mt-1.5 leading-snug font-sans">Mapea daños mágicos (fuego, agua) a: Cinético, Láser, Plasma, Iónico, Gravitón.</p>
              </div>

              <div>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleCleanFakeResources}
                  className="w-full py-2.5 bg-red-950/20 hover:bg-[#ff1e1e] text-[#ff1e1e] hover:text-white border border-[#ff1e1e]/20 hover:border-[#ff1e1e] rounded font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                >
                  Limpiar Nombres Mockup
                </button>
                <p className="text-[9px] text-zinc-600 mt-1.5 leading-snug font-sans">Elimina "Polvo de Dragón" y nombres de desarrollo sustituyéndolos por lore Sci-Fi.</p>
              </div>
            </div>
          </div>
        </div>

        {/* TERMINAL & CHART */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          
          {/* TERMINAL */}
          <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl shadow-xl font-mono">
            <h3 className="text-[10px] text-zinc-400 font-bold uppercase border-b border-zinc-900 pb-2 flex items-center gap-2 mb-3">
              <Terminal size={12} /> Console Output // Supabase Log
            </h3>
            <div className="h-48 overflow-y-auto bg-black border border-zinc-900 rounded-lg p-3 text-[10px] space-y-2 custom-scrollbar">
              {isProcessing && (
                <div className="flex items-center gap-2 text-blue-400 mb-2">
                  <Loader2 size={12} className="animate-spin" />
                  <span>Procesando consulta recursiva a Supabase...</span>
                </div>
              )}
              {cleansingLog.map((log, i) => (
                <div key={i} className="space-y-1 pb-2 border-b border-zinc-900/50 last:border-0 last:pb-0">
                  <div className="flex gap-2 text-zinc-500">
                    <span className="shrink-0">[{log.timestamp}]</span>
                    <span className={log.type === 'manual' ? 'text-red-400 font-bold' : 'text-emerald-500 font-bold'}>
                      {log.event}
                    </span>
                  </div>
                  {log.details && (
                    <pre className="text-zinc-600 pl-[60px] overflow-x-auto text-[9px]">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* CHART */}
          <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl shadow-xl">
            <div className="flex justify-between items-center border-b border-zinc-900 pb-2 mb-4">
              <span className="text-[10px] text-zinc-300 font-bold uppercase flex items-center gap-2">
                <Activity size={12} className="text-red-500"/>
                TELEMETRÍA DE QUEMA EN 24 HORAS
              </span>
              <span className="text-emerald-400 text-[9px] font-bold">LIVE</span>
            </div>
            
            <div className="h-40 w-full text-xs font-mono">
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
                  <XAxis dataKey="hour" stroke="#52525b" tickLine={false} axisLine={false} />
                  <YAxis stroke="#52525b" tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a' }} labelStyle={{ color: '#a1a1aa' }} />
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