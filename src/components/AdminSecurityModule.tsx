import React, { useState } from 'react';
import { ShieldAlert, Terminal, Search, Ban, Flag } from 'lucide-react';
import { supabaseService } from '../lib/supabase';

// Assuming standard user structure exists in your app
interface SecurityUser {
  id: string;
  username: string;
  level: number;
  powerScore: number;
  wallet: {
    metal: number;
    crystal: number;
    deuterium: number;
  };
  isBanned?: boolean;
}

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

  // Mock data for Security
  const [users, setUsers] = useState<SecurityUser[]>([
    { id: 'u1', username: 'NormalPlayer', level: 25, powerScore: 45000, wallet: { metal: 100000, crystal: 50000, deuterium: 10000 } },
    { id: 'u2', username: 'Suspect_99', level: 5, powerScore: 850000, wallet: { metal: 9999999, crystal: 9999999, deuterium: 9999999 } },
    { id: 'u3', username: 'ProGamer', level: 80, powerScore: 1200000, wallet: { metal: 500000, crystal: 200000, deuterium: 50000 } }
  ]);

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

  // Regla Anticheat: Nivel < 10 && PowerScore > 100k OR mucho recurso
  const isSuspect = (user: SecurityUser) => {
    return user.level < 10 && (
      user.powerScore > 100000 || 
      user.wallet.metal > 1000000 || 
      user.wallet.crystal > 1000000
    );
  };

  const handleBan = (userId: string, username: string) => {
    const confirm = window.confirm(`[FORENSIC BAN]\n\n¿Estás seguro de que deseas banear permanentemente a ${username}? Esta acción es irreversible.`);
    if (confirm) {
      setUsers(users.map(u => u.id === userId ? { ...u, isBanned: true } : u));
      alert(`Usuario ${username} baneado.`);
    }
  };

  const sortedUsers = [...users].sort((a, b) => b.powerScore - a.powerScore);

  return (
    <div className="space-y-6 font-mono">
      {/* Header Tabs */}
      <div className="flex gap-2 border-b border-gray-700 pb-4">
        <button
          onClick={() => setActiveTab('anticheat')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-bold transition-colors ${
            activeTab === 'anticheat' ? 'bg-red-900/40 text-red-400 border border-red-500/50 rounded' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          LEADERBOARD ANTI-CHEAT
        </button>
        <button
          onClick={() => setActiveTab('blackbox')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-bold transition-colors ${
            activeTab === 'blackbox' ? 'bg-blue-900/40 text-blue-400 border border-blue-500/50 rounded' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <Terminal className="w-4 h-4" />
          CAJA NEGRA PvP
        </button>
      </div>

      {/* Tab 1: Anti-Cheat */}
      {activeTab === 'anticheat' && (
        <div className="bg-gray-900/80 border border-gray-700 rounded-lg overflow-hidden">
          <div className="p-4 bg-gray-800/50 border-b border-gray-700">
            <p className="text-xs text-gray-400">Analizando heurísticas de poder/nivel y riqueza anómala...</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="text-xs text-gray-500 bg-gray-950 uppercase border-b border-gray-800">
                <tr>
                  <th className="px-4 py-3">Rank</th>
                  <th className="px-4 py-3">Usuario</th>
                  <th className="px-4 py-3">Nivel</th>
                  <th className="px-4 py-3">Power Score</th>
                  <th className="px-4 py-3">Status / Flags</th>
                  <th className="px-4 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {sortedUsers.map((user, index) => {
                  const suspect = isSuspect(user);
                  return (
                    <tr key={user.id} className={`border-b border-gray-800 ${suspect ? 'bg-yellow-900/10' : 'hover:bg-gray-800/40'}`}>
                      <td className="px-4 py-3">#{index + 1}</td>
                      <td className={`px-4 py-3 font-bold ${user.isBanned ? 'line-through text-gray-600' : 'text-white'}`}>
                        {user.username}
                      </td>
                      <td className="px-4 py-3 text-cyan-400">Lvl {user.level}</td>
                      <td className="px-4 py-3 text-purple-400">{user.powerScore.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        {user.isBanned ? (
                          <span className="text-red-500 font-bold text-xs bg-red-950 px-2 py-1 rounded">BANNED</span>
                        ) : suspect ? (
                          <span className="text-yellow-500 font-bold text-xs flex items-center gap-1 bg-yellow-950/50 px-2 py-1 rounded w-max">
                            <Flag className="w-3 h-3" />
                            [FLAG: POSIBLE HACK/EXPLOIT]
                          </span>
                        ) : (
                          <span className="text-green-500 text-xs">CLEAN</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!user.isBanned && (
                          <button
                            onClick={() => handleBan(user.id, user.username)}
                            className="bg-red-900/50 hover:bg-red-700 text-red-200 p-2 rounded transition-colors"
                            title="Ban Forense"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Caja Negra PvP */}
      {activeTab === 'blackbox' && (
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
              <input
                type="text"
                className="w-full pl-10 pr-4 py-3 bg-gray-950 border border-gray-800 rounded-md text-green-400 focus:outline-none focus:border-green-500 font-mono text-sm placeholder-gray-700"
                placeholder="> INGRESE BATTLE_ID PARA DECODIFICAR (Ej. BTL-X99-2026)"
                value={searchLogId}
                onChange={(e) => setSearchLogId(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-gray-950 border border-gray-800 rounded-lg p-4 h-[500px] overflow-y-auto">
            {mockBattleLogs
              .filter(log => log.id.toLowerCase().includes(searchLogId.toLowerCase()))
              .map(log => (
                <div key={log.id} className="mb-6 last:mb-0">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-2 border-b border-gray-800 pb-1">
                    <span className="text-blue-500">{log.timestamp}</span>
                    <span className="text-gray-400">|</span>
                    <span className="text-purple-400">ID: {log.id}</span>
                  </div>
                  <div className="bg-black p-3 rounded border border-gray-900 font-mono text-xs text-green-500 whitespace-pre-wrap overflow-x-auto">
                    {JSON.stringify(JSON.parse(log.rawLog), null, 2)}
                  </div>
                  <div className="mt-2 text-xs text-gray-400 flex gap-4">
                    <span>Attacker: <span className="text-white">{log.attackerId}</span></span>
                    <span>Defender: <span className="text-white">{log.defenderId}</span></span>
                    <span>Winner: <span className="text-yellow-500">{log.winnerId}</span></span>
                  </div>
                </div>
              ))}
            {mockBattleLogs.filter(log => log.id.toLowerCase().includes(searchLogId.toLowerCase())).length === 0 && (
              <div className="text-gray-600 text-sm mt-4">
                {">"} ERROR_404: NO SE ENCONTRARON REGISTROS COINCIDENTES EN LA BASE DE DATOS.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
