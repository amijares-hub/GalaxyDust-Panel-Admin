import React, { useState, useEffect } from 'react';
import { ShieldAlert, Terminal, Search, Ban, Flag, Loader2, AlertTriangle } from 'lucide-react';
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

  useEffect(() => {
    if (activeTab === 'anticheat') {
      const fetchAnomalies = async () => {
        setIsLoadingAnomalies(true);
        try {
          const data = await adminApi.getAntiCheatAnomalies();
          setAnomalies(data || []);
        } catch (error) {
          console.error('Error fetching anomalies:', error);
        } finally {
          setIsLoadingAnomalies(false);
        }
      };
      fetchAnomalies();
    }
  }, [activeTab]);

  const mockBattleLogs: BattleLog[] = [
    {
      id: 'BTL-X99-2026',
      timestamp: '2026-05-27T08:00:00Z',
      attackerId: 'u2',
      defenderId: 'u1',
      winnerId: 'u2',
      loot: { metal: 100000, crystal: 50000, deuterium: 10000 },
      rawLog: '{"event":"BATTLE_START","attackerFleet":[{"type":"Fighter","qty":99999}],"defenderFleet":[{"type":"Cruiser","qty":10}],"result":"ATTACKER_WIN","duration_ms":12}'
    }
  ];

  const handleBan = (userId: string, username: string) => {
    const confirm = window.confirm(`[FORENSIC BAN]\n\n¿Estás seguro de que deseas banear permanentemente a ${username}? Esta acción es irreversible.`);
    if (confirm) {
      setAnomalies(anomalies.filter(a => a.id !== userId));
      alert(`Usuario ${username} baneado.`);
    }
  };

  const sortedAnomalies = [...anomalies].sort((a, b) => b.gold - a.gold);

  const tabCls = (tab: 'anticheat' | 'blackbox') =>
    `flex items-center gap-2 px-4 py-2 text-xs font-bold font-mono uppercase tracking-wider transition-all rounded cursor-pointer ${
      activeTab === tab
        ? tab === 'anticheat'
          ? 'bg-red-950/40 text-red-400 border border-red-500/30'
          : 'bg-blue-950/40 text-blue-400 border border-blue-500/30'
        : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
    }`;

  return (
    <div className="space-y-6 font-sans">

      {/* Header */}
      <div className="flex items-center gap-3 border-b border-zinc-900 pb-4">
        <div className="h-10 w-10 bg-red-950/30 border border-red-500/20 rounded flex items-center justify-center text-red-500">
          <ShieldAlert size={20} />
        </div>
        <div>
          <h2 className="text-white font-bold text-lg font-mono tracking-wider uppercase">Seguridad Anti-Cheat</h2>
          <p className="text-xs text-zinc-500 font-sans mt-0.5">Leaderboard de anomalías detectadas y caja negra forense de batallas PvP.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-900 pb-3">
        <button onClick={() => setActiveTab('anticheat')} className={tabCls('anticheat')}>
          <ShieldAlert size={12} />
          Leaderboard Anti-Cheat
        </button>
        <button onClick={() => setActiveTab('blackbox')} className={tabCls('blackbox')}>
          <Terminal size={12} />
          Caja Negra PvP
        </button>
      </div>

      {/* Tab 1: Anti-Cheat Leaderboard */}
      {activeTab === 'anticheat' && (
        <div className="bg-black/45 border border-zinc-900 rounded-lg overflow-hidden">
          <div className="px-5 py-3 bg-zinc-950/60 border-b border-zinc-900 flex items-center gap-2">
            <AlertTriangle size={12} className="text-yellow-500" />
            <p className="text-[10px] text-zinc-500 font-mono">Analizando heurísticas de poder/nivel y riqueza anómala vs. tiempo de juego...</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-900">
                  <th className="px-4 py-3 text-[10px] font-bold text-zinc-600 uppercase tracking-wider">Rank</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-zinc-600 uppercase tracking-wider">Usuario</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-zinc-600 uppercase tracking-wider">Nivel</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-zinc-600 uppercase tracking-wider">Economía Anómala</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-zinc-600 uppercase tracking-wider">Flag</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-zinc-600 uppercase tracking-wider text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingAnomalies ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-zinc-600">
                      <Loader2 size={20} className="animate-spin mx-auto mb-2 text-red-500" />
                      <span className="text-[10px] font-mono">Obteniendo datos del servidor...</span>
                    </td>
                  </tr>
                ) : sortedAnomalies.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-zinc-600 text-[10px] font-mono">
                      — Sin anomalías detectadas en la red —
                    </td>
                  </tr>
                ) : sortedAnomalies.map((user, index) => (
                  <tr key={user.id} className="border-b border-zinc-900/60 bg-yellow-950/5 hover:bg-zinc-900/20 transition-colors">
                    <td className="px-4 py-3 text-zinc-500 font-mono font-bold">#{index + 1}</td>
                    <td className="px-4 py-3 font-bold text-zinc-200">{user.username}</td>
                    <td className="px-4 py-3 text-cyan-400 font-mono">Lvl {user.level}</td>
                    <td className="px-4 py-3 text-yellow-400 font-mono text-[11px]">
                      Oro: {user.gold.toLocaleString()} | Gemas: {user.gems.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-yellow-500 font-bold text-[10px] flex items-center gap-1 bg-yellow-950/30 border border-yellow-500/20 px-2 py-1 rounded w-max font-mono uppercase">
                        <Flag size={10} />
                        {user.flag}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleBan(user.id, user.username)}
                        className="bg-red-950/40 hover:bg-red-950/70 text-red-400 border border-red-500/20 hover:border-red-500/40 p-1.5 rounded transition-all"
                        title="Ban Forense"
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
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
              <input
                type="text"
                className="w-full pl-9 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded text-emerald-400 focus:outline-none focus:border-emerald-500/40 font-mono text-xs placeholder-zinc-700 transition-colors"
                placeholder="> INGRESE BATTLE_ID PARA DECODIFICAR (Ej. BTL-X99-2026)"
                value={searchLogId}
                onChange={(e) => setSearchLogId(e.target.value)}
              />
            </div>
            <button
              onClick={async () => {
                try {
                  await adminApi.injectBattleReport({
                    attacker_id: 'u2',
                    defender_id: 'u1',
                    winner_id: 'u2',
                    loot_stolen: { metal: 100000, crystal: 50000, deuterium: 10000 },
                    battle_log: ['Fleet engaged at coordinates [23,45,1]', 'Cruiser destroyed'],
                    raw_json: { event: 'TEST_INJECTION' }
                  });
                  alert('Reporte de batalla inyectado en el servidor Go.');
                } catch (error) {
                  alert('Error al inyectar reporte de batalla.');
                }
              }}
              className="px-4 py-2 bg-blue-950/40 hover:bg-blue-950/70 text-blue-400 border border-blue-500/30 hover:border-blue-500/50 rounded font-mono text-xs uppercase tracking-wider transition-all"
            >
              [Inject_Test]
            </button>
          </div>

          <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-4 h-[500px] overflow-y-auto custom-scrollbar">
            {mockBattleLogs
              .filter(log => log.id.toLowerCase().includes(searchLogId.toLowerCase()))
              .map(log => (
                <div key={log.id} className="mb-6 last:mb-0">
                  <div className="flex items-center gap-3 text-[10px] text-zinc-600 mb-2 border-b border-zinc-900 pb-1.5 font-mono">
                    <span className="text-blue-400">{log.timestamp}</span>
                    <span className="text-zinc-700">|</span>
                    <span className="text-purple-400">ID: {log.id}</span>
                  </div>
                  <div className="bg-black p-3 rounded border border-zinc-900 font-mono text-[11px] text-emerald-400 whitespace-pre-wrap overflow-x-auto">
                    {JSON.stringify(JSON.parse(log.rawLog), null, 2)}
                  </div>
                  <div className="mt-2 text-[10px] text-zinc-500 flex gap-4 font-mono">
                    <span>Attacker: <span className="text-zinc-300">{log.attackerId}</span></span>
                    <span>Defender: <span className="text-zinc-300">{log.defenderId}</span></span>
                    <span>Winner: <span className="text-yellow-400">{log.winnerId}</span></span>
                  </div>
                </div>
              ))}
            {mockBattleLogs.filter(log => log.id.toLowerCase().includes(searchLogId.toLowerCase())).length === 0 && (
              <div className="text-zinc-700 text-xs mt-4 font-mono">
                {'>'} ERROR_404: NO SE ENCONTRARON REGISTROS COINCIDENTES EN LA BASE DE DATOS.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
