import React, { useEffect, useState } from 'react';
import { getSupabaseClient } from '../lib/supabase';
import { Shield, UserX, UserCheck, Search } from 'lucide-react';

interface PlayerProfile {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'moderator' | 'player';
  status: 'active' | 'banned' | 'pending'; // Sincronizado con la columna real de user_profiles
  ban_reason: string | null;
  created_at: string;
}

export const UserCRM: React.FC = () => {
  const supabase = getSupabaseClient();
  const [players, setPlayers] = useState<PlayerProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    if (!supabase) return;

    fetchPlayers();

    // Sincronización en tiempo real apuntando a la tabla verídica 'user_profiles'
    const profilesChannel = supabase
      .channel('public:user_profiles')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_profiles' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newPlayer = payload.new as PlayerProfile;
            setPlayers((prev) => {
              if (prev.some((p) => p.id === newPlayer.id)) return prev;
              return [...prev, newPlayer].sort((a, b) =>
                (a.username || '').localeCompare(b.username || '')
              );
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedPlayer = payload.new as PlayerProfile;
            setPlayers((prev) =>
              prev.map((p) => (p.id === updatedPlayer.id ? { ...p, ...updatedPlayer } : p))
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            setPlayers((prev) => prev.filter((p) => p.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
    };
  }, [supabase]);

  const fetchPlayers = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Query unificada con la tabla user_profiles solicitando la columna de control status
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, username, email, role, status, ban_reason, created_at')
        .order('username', { ascending: true });

      if (error) throw error;
      if (data) setPlayers(data as PlayerProfile[]);
    } catch (error: any) {
      console.error('Error descargando perfiles de GalaxyDust:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleBanStatus = async (playerId: string, currentStatus: 'active' | 'banned' | 'pending') => {
    if (!supabase) return;

    const isCurrentlyBanned = currentStatus === 'banned';
    const reason = !isCurrentlyBanned ? prompt('Escriba la razón del baneo orbital:') : null;

    if (!isCurrentlyBanned && reason === null) return; // Cancelado por el admin

    const nextStatus = isCurrentlyBanned ? 'active' : 'banned';

    try {
      // Modificación optimista local
      setPlayers((prev) => prev.map((p) =>
        p.id === playerId ? { ...p, status: nextStatus, ban_reason: reason } : p
      ));

      // Persistencia real sobre la columna 'status' en 'user_profiles'
      const { error } = await supabase
        .from('user_profiles')
        .update({
          status: nextStatus,
          ban_reason: reason
        })
        .eq('id', playerId);

      if (error) {
        // Revertir estado si falla la transacción
        setPlayers((prev) => prev.map((p) =>
          p.id === playerId ? { ...p, status: currentStatus } : p
        ));
        throw error;
      }
    } catch (error: any) {
      alert(`Error al cambiar estado de baneo: ${error.message}`);
    }
  };

  const filteredPlayers = players.filter(p =>
    (p.username?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (p.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  if (loading && players.length === 0) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center">
        <div className="p-6 text-center text-cyan-500 animate-pulse font-mono tracking-wider">
          Sincronizando Base de Datos Holográfica...
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-900 min-h-full text-slate-100 rounded-xl border border-slate-800 font-mono text-xs">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-wider text-cyan-400 font-sans">CONTROL DE TRIPULACIÓN (CRM)</h2>
          <p className="text-sm text-slate-400 font-sans">Auditoría de cuentas y mitigación de amenazas en tiempo real.</p>
        </div>

        {/* Buscador */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por piloto o email..."
            className="w-full bg-slate-800 text-slate-200 pl-10 pr-4 py-2 rounded-md border border-slate-700 focus:outline-none focus:border-cyan-500 transition-colors text-sm font-mono"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tabla de Control */}
      <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950">
        <table className="min-w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400 text-xs font-semibold tracking-wider select-none">
              <th className="p-4">PILOTO</th>
              <th className="p-4">RANGO (ROLE)</th>
              <th className="p-4">ESTADO</th>
              <th className="p-4">RAZÓN DE RESTRICCIÓN</th>
              <th className="p-4 text-right">ACCIONES ACCESIBLES</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-800/60 font-mono text-[11px]">
            {filteredPlayers.length > 0 ? (
              filteredPlayers.map((player) => (
                <tr key={player.id} className="hover:bg-slate-900/30 transition-colors">
                  <td className="p-4">
                    <div className="font-medium text-slate-200 font-sans text-xs">{player.username || 'Sin identificar'}</div>
                    <div className="text-xs text-slate-500">{player.email}</div>
                  </td>
                  <td className="p-4 select-none">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${player.role === 'admin' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        player.role === 'moderator' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          'bg-slate-500/10 text-slate-400 border-slate-500/20'
                      }`}>
                      {player.role === 'admin' ? <Shield className="w-3 h-3" /> : null}
                      {(player.role || 'player').toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 select-none">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${player.status === 'banned' ? 'bg-rose-500/10 text-rose-400 font-bold' : 'bg-emerald-500/10 text-emerald-400'
                      }`}>
                      {(player.status || 'active').toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 text-slate-400 text-xs max-w-xs truncate font-sans" title={player.ban_reason || ''}>
                    {player.status === 'banned' ? player.ban_reason : <span className="text-slate-600 font-mono">Ninguna</span>}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => toggleBanStatus(player.id, player.status)}
                      className={`inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded font-medium transition-all cursor-pointer ${player.status === 'banned'
                          ? 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30'
                          : 'bg-rose-600/20 text-rose-400 hover:bg-rose-600/30'
                        }`}
                    >
                      {player.status === 'banned' ? 'Levantar Baneo' : 'Baneo Orbital'}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500 font-sans">
                  No se encontraron pilotos que coincidan con la búsqueda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserCRM;