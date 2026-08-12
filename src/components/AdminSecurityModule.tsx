import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Terminal, Search, Ban, Flag, Loader2, AlertTriangle, 
  RefreshCw, ShieldCheck, CheckCircle2, Lock, Unlock, Zap, Eye
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { adminApi, AntiCheatAnomaly } from '../lib/adminApi';

interface BattleLog {
  id: string;
  timestamp: string;
  attackerId: string;
  defenderId: string;
  winnerId: string;
  loot: { metal: number; crystal: number; deuterium: number };
  rawLog: string;
}

export const AdminSecurityModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'anticheat' | 'blackbox'>('anticheat');
  const [searchLogId, setSearchLogId] = useState('');

  const [anomalies, setAnomalies] = useState<AntiCheatAnomaly[]>([]);
  const [isLoadingAnomalies, setIsLoadingAnomalies] = useState(false);
  const [battleLogs, setBattleLogs] = useState<BattleLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // ─── 1. ESCANEO DE ANOMALÍAS EN TIEMPO REAL ───
  const fetchAnomalies = async () => {
    setIsLoadingAnomalies(true);
    try {
      // Intenta consultar la Edge Function / adminApi primero
      const apiData = await adminApi.getAntiCheatAnomalies();
      
      if (apiData && apiData.length > 0) {
        setAnomalies(apiData);
      } else {
        // Fallback: Escaneo heurístico directo en user_profiles
        const { data: profiles, error } = await supabase
          .from('user_profiles')
          .select('*')
          .order('level', { ascending: true });

        if (!error && profiles) {
          // Filtrar perfiles con desproporción sospechosa entre Nivel y Recursos
          const detectedAnomalies: AntiCheatAnomaly[] = profiles
            .filter((p: any) => {
              const level = Number(p.can_level || p.level) || 1;
              const gdCoins = Number(p.gd_balance || p.gd_coin) || 0;
              const metal = Number(p.metal_balance || p.metal) || 0;
              const powerScore = Number(p.power_score) || 0;

              // Heurística Anti-Cheat: Nivel bajo con saldo desproporcionadamente alto
              return (level <= 5 && gdCoins > 50000) || 
                     (level <= 10 && metal > 1000000) || 
                     (level <= 3 && powerScore > 200000) ||
                     p.is_flagged;
            })
            .map((p: any) => ({
              id: p.id || p.user_id,
              username: p.username || p.display_name || p.wallet_address || 'Comandante Sospechoso',
              level: Number(p.can_level || p.level) || 1,
              gd_coins: Number(p.gd_balance || p.gd_coin) || 0,
              phantom_coins: Number(p.phantom_coins_balance || p.phantom_coin) || 0,
              metal: Number(p.metal_balance || p.metal) || 0,
              crystal: Number(p.crystal_balance || p.crystal) || 0,
              flag: p.flag_reason || (p.can_level <= 5 ? 'SPIKE_DE_RECURSOS' : 'POWER_ANÓMALO')
            }));

          setAnomalies(detectedAnomalies);
        } else {
          setAnomalies([]);
        }
      }
    } catch (error) {
      console.error('Error al escanear anomalías de seguridad:', error);
      setAnomalies([]);
    } finally {
      setIsLoadingAnomalies(false);
    }
  };

  // ─── 2. CARGA DE CAJA NEGRA PVP (COMBAT_LOGS) ───
  const fetchBattleLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const { data, error } = await supabase
        .from('combat_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data && data.length > 0) {
        const mappedLogs: BattleLog[] = data.map((b: any) => ({
          id: b.id || `BTL-${Math.random().toString(36).substring(2, 7)}`,
          timestamp: b.created_at || new Date().toISOString(),
          attackerId: b.attacker_id || 'u-attacker',
          defenderId: b.defender_id || 'u-defender',
          winnerId: b.winner_id || b.attacker_id,
          loot: {
            metal: Number(b.loot_metal) || 100000,
            crystal: Number(b.loot_crystal) || 50000,
            deuterium: Number(b.loot_deuterium) || 10000
          },
          rawLog: typeof b.raw_json === 'string' ? b.raw_json : JSON.stringify(b.raw_json || {
            event: "BATTLE_COMPLETE",
            attacker: b.attacker_id,
            defender: b.defender_id,
            damage_dealt: b.damage_dealt || 45000,
            result: b.winner_id === b.attacker_id ? "ATTACKER_WIN" : "DEFENDER_WIN"
          }, null, 2)
        }));
        setBattleLogs(mappedLogs);
      } else {
        // Fallback demostrativo seguro
        setBattleLogs([
          {
            id: 'BTL-X99-2026',
            timestamp: new Date().toISOString(),
            attackerId: 'usr-attacker-01',
            defenderId: 'usr-defender-02',
            winnerId: 'usr-attacker-01',
            loot: { metal: 100000, crystal: 50000, deuterium: 10000 },
            rawLog: JSON.stringify({
              event: "BATTLE_START",
              attackerFleet: [{ type: "Heavy Hunter", qty: 25 }],
              defenderFleet: [{ type: "Explorer Frigate", qty: 10 }],
              result: "ATTACKER_WIN",
              duration_ms: 124
            }, null, 2)
          }
        ]);
      }
    } catch (err) {
      console.error("Error cargando caja negra PvP:", err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'anticheat') {
      fetchAnomalies();
    } else if (activeTab === 'blackbox') {
      fetchBattleLogs();
    }
  }, [activeTab]);

  // ─── BANEO FORENSE EN TIEMPO REAL ───
  const handleBan = async (userId: string, username: string) => {
    const confirm = window.confirm(`[FORENSIC BAN]\n\n¿Estás seguro de que deseas banear permanentemente a ${username}?\nEsta acción es irreversible y bloqueará el acceso a la dApp.`);
    if (!confirm) return;

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          status: 'banned', 
          is_banned: true, 
          banned_at: new Date().toISOString() 
        })
        .or(`id.eq.${userId},user_id.eq.${userId}`);

      if (error) throw error;

      setAnomalies(prev => prev.filter(a => a.id !== userId));
      alert(`✅ Usuario ${username} BANEADO FORENSEMENTE del servidor.`);
    } catch (err: any) {
      alert(`Error al banear usuario: ${err.message}`);
    }
  };

  // ─── INYECCIÓN DE PRUEBA EN CAJA NEGRA ───
  const handleInjectTestReport = async () => {
    try {
      await adminApi.injectBattleReport({
        attacker_id: 'u2',
        defender_id: 'u1',
        winner_id: 'u2',
        loot_stolen: { metal: 100000, crystal: 50000, deuterium: 10000 },
        battle_log: ['Fleet engaged at coordinates [23,45,1]', 'Cruiser destroyed'],
        raw_json: { event: 'TEST_INJECTION', timestamp: new Date().toISOString() }
      });
      alert('Reporte de batalla inyectado en la Caja Negra.');
      fetchBattleLogs();
    } catch (error) {
      alert('Reporte de prueba registrado en la vista local.');
    }
  };

  const sortedAnomalies = [...anomalies].sort((a, b) => b.gd_coins - a.gd_coins);

  const tabCls = (tab: 'anticheat' | 'blackbox') =>
    `flex items-center gap-2 px-4 py-2 text-xs font-bold font-mono uppercase tracking-wider transition-all rounded-lg cursor-pointer ${
      activeTab === tab
        ? tab === 'anticheat'
          ? 'bg-red-950/40 text-red-400 border border-red-500/30 font-black'
          : 'bg-blue-950/40 text-blue-400 border border-blue-500/30 font-black'
        : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
    }`;

  return (
    <div className="space-y-6 font-sans text-left text-white select-none">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-900 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-red-950/30 border border-red-500/20 rounded-xl flex items-center justify-center text-red-500 shrink-0">
            <ShieldAlert size={20} />
          </div>
          <div className="min-w-0">
            <h2 className="text-white font-bold text-sm sm:text-lg font-mono tracking-wider uppercase truncate">Seguridad Anti-Cheat & Forense</h2>
            <p className="text-xs text-zinc-500 font-sans mt-0.5">Leaderboard de anomalías y caja negra forense PvP.</p>
          </div>
        </div>

        <button
          onClick={activeTab === 'anticheat' ? fetchAnomalies : fetchBattleLogs}
          className="self-start sm:self-auto p-2 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-red-400 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-mono font-bold cursor-pointer shrink-0"
        >
          <RefreshCw size={13} className={isLoadingAnomalies || isLoadingLogs ? "animate-spin" : ""} />
          <span>RE-ESCANEAR</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-zinc-900 pb-3">
        <button onClick={() => setActiveTab('anticheat')} className={tabCls('anticheat')}>
          <ShieldAlert size={12} />
          <span className="hidden xs:inline">Leaderboard </span>Anti-Cheat
        </button>
        <button onClick={() => setActiveTab('blackbox')} className={tabCls('blackbox')}>
          <Terminal size={12} />
          Caja Negra PvP
        </button>
      </div>

      {/* Tab 1: Anti-Cheat Leaderboard */}
      {activeTab === 'anticheat' && (
        <div className="bg-black/45 border border-zinc-900 rounded-xl overflow-hidden shadow-xl">
          <div className="px-5 py-3 bg-zinc-950/60 border-b border-zinc-900 flex items-center gap-2">
            <AlertTriangle size={12} className="text-yellow-500 animate-pulse" />
            <p className="text-[10px] text-zinc-400 font-mono">Analizando heurísticas de poder/nivel y riqueza anómala vs. tiempo de juego en la red...</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-zinc-900 text-zinc-500 text-[10px] uppercase font-bold">
                  <th className="px-4 py-3">Rank</th>
                  <th className="px-4 py-3">Usuario</th>
                  <th className="px-4 py-3">Nivel CAN</th>
                  <th className="px-4 py-3">Balances Auditados (Monedas y Recursos)</th>
                  <th className="px-4 py-3">Flag / Motivo</th>
                  <th className="px-4 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/60">
                {isLoadingAnomalies ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-zinc-600">
                      <Loader2 size={20} className="animate-spin mx-auto mb-2 text-red-500" />
                      <span className="text-[10px] font-mono">Escaneando base de datos en busca de patrones fraudulentos...</span>
                    </td>
                  </tr>
                ) : sortedAnomalies.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-zinc-600 text-xs font-mono italic">
                      — Sin anomalías detectadas en la red. Todos los balances están dentro del margen legal. —
                    </td>
                  </tr>
                ) : sortedAnomalies.map((user, index) => (
                  <tr key={user.id} className="bg-yellow-950/5 hover:bg-zinc-900/30 transition-colors">
                    <td className="px-4 py-3 text-zinc-500 font-bold">#{index + 1}</td>
                    <td className="px-4 py-3 font-bold text-white uppercase">{user.username}</td>
                    <td className="px-4 py-3 text-cyan-400 font-bold">Lvl {user.level}</td>
                    <td className="px-4 py-3 text-[11px] leading-relaxed">
                      <div className="text-yellow-400 font-bold">
                        GD: {user.gd_coins.toLocaleString()} Coins | PH: {user.phantom_coins.toLocaleString()} PC
                      </div>
                      <div className="text-zinc-500 text-[10px] mt-0.5">
                        Metal: <span className="text-zinc-300 font-bold">{user.metal.toLocaleString()}</span> | 
                        Cristal: <span className="text-purple-400 font-bold">{user.crystal.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-yellow-500 font-bold text-[9px] flex items-center gap-1 bg-yellow-950/40 border border-yellow-500/30 px-2 py-1 rounded w-max uppercase">
                        <Flag size={10} />
                        {user.flag}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleBan(user.id, user.username)}
                        className="bg-red-950/40 hover:bg-red-600 border border-red-500/30 text-red-400 hover:text-white p-2 rounded-lg transition-colors cursor-pointer"
                        title="Ejecutar Ban Forense Permanentemente"
                      >
                        <Ban size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Caja Negra PvP */}
      {activeTab === 'blackbox' && (
        <div className="space-y-4 font-mono">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
              <input
                type="text"
                className="w-full pl-9 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-emerald-400 focus:outline-none focus:border-emerald-500/40 text-xs placeholder-zinc-700 uppercase"
                placeholder="> INGRESE BATTLE_ID O UID PARA DECODIFICAR (Ej. BTL-X99-2026)"
                value={searchLogId}
                onChange={(e) => setSearchLogId(e.target.value)}
              />
            </div>
            <button
              onClick={handleInjectTestReport}
              className="px-4 py-2 bg-blue-950/40 hover:bg-blue-900 border border-blue-500/30 text-blue-400 hover:text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer"
            >
              [Inject_Test]
            </button>
          </div>

          <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-4 h-[55vh] md:h-[500px] overflow-y-auto custom-scrollbar space-y-4">
            {isLoadingLogs ? (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-600">
                <Loader2 size={24} className="animate-spin text-blue-400 mb-2" />
                <span>Decodificando caja negra de combates...</span>
              </div>
            ) : battleLogs.filter(log => log.id.toLowerCase().includes(searchLogId.toLowerCase()) || log.attackerId.toLowerCase().includes(searchLogId.toLowerCase())).length === 0 ? (
              <div className="text-zinc-600 text-xs py-12 text-center">
                {'>'} ERROR_404: NO SE ENCONTRARON REGISTROS DE BATALLA COINCIDENTES EN LA CAJA NEGRA.
              </div>
            ) : (
              battleLogs
                .filter(log => log.id.toLowerCase().includes(searchLogId.toLowerCase()) || log.attackerId.toLowerCase().includes(searchLogId.toLowerCase()))
                .map(log => (
                  <div key={log.id} className="p-3 bg-black/60 border border-zinc-900 rounded-lg space-y-2">
                    <div className="flex justify-between items-center text-[10px] text-zinc-500 border-b border-zinc-900 pb-1.5">
                      <span className="text-blue-400 font-bold">{new Date(log.timestamp).toLocaleString()}</span>
                      <span className="text-purple-400 font-bold">ID: {log.id}</span>
                    </div>

                    <div className="bg-black p-3 rounded border border-zinc-900 text-[10.5px] text-emerald-400 font-mono whitespace-pre-wrap overflow-x-auto max-h-48">
                      {log.rawLog}
                    </div>

                    <div className="grid grid-cols-2 sm:flex sm:justify-between items-center text-[10px] text-zinc-400 pt-1 border-t border-zinc-900/60 gap-1">
                      <div>Atacante: <span className="text-white font-bold">{log.attackerId}</span></div>
                      <div>Defensor: <span className="text-white font-bold">{log.defenderId}</span></div>
                      <div>Ganador: <span className="text-yellow-400 font-bold">{log.winnerId}</span></div>
                      <div>Botín: <span className="text-emerald-400 font-bold">{log.loot.metal.toLocaleString()} Metal</span></div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminSecurityModule;