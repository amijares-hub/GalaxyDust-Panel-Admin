import React, { useEffect, useState } from 'react';
import { 
  Shield, Users, Coins, RefreshCw, Trash2, UserX, 
  Crown, Award, Search, ArrowUpRight, DollarSign, History 
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Alliance {
  id: string;
  name: string;
  tag: string;
  description: string;
  leader_id: string;
  level: number;
  treasury_gd: number;
  treasury_metal: number;
  created_at: string;
  leader?: { username: string };
  member_count?: number;
}

interface AllianceMember {
  id: string;
  alliance_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  user_profiles?: { username: string; level: number };
}

interface TreasuryLog {
  id: string;
  alliance_id: string;
  user_id: string;
  resource_type: string;
  amount: number;
  created_at: string;
  user_profiles?: { username: string };
}

export const AdminAllianceCRM: React.FC = () => {
  const [alliances, setAlliances] = useState<Alliance[]>([]);
  const [selectedAlliance, setSelectedAlliance] = useState<Alliance | null>(null);
  const [members, setMembers] = useState<AllianceMember[]>([]);
  const [treasuryLogs, setTreasuryLogs] = useState<TreasuryLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  const fetchAlliancesData = async () => {
    setLoading(true);
    try {
      // 1. Obtener alianzas y datos del líder
      const { data: allianceData } = await supabase
        .from('alliances')
        .select(`
          *,
          leader:leader_id (username)
        `)
        .order('created_at', { ascending: false });

      if (allianceData) {
        // Obtener conteo de miembros por alianza
        const { data: memberCounts } = await supabase
          .from('alliance_members')
          .select('alliance_id');

        const mapped = allianceData.map((a: any) => ({
          ...a,
          treasury_gd: Number(a.treasury_gd) || 0,
          treasury_metal: Number(a.treasury_metal) || 0,
          member_count: memberCounts?.filter(m => m.alliance_id === a.id).length || 0
        }));

        setAlliances(mapped);
        if (mapped.length > 0 && !selectedAlliance) {
          handleSelectAlliance(mapped[0]);
        }
      }
    } catch (err) {
      console.error("Error al cargar alianzas:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAlliance = async (alliance: Alliance) => {
    setSelectedAlliance(alliance);
    setLoading(true);

    try {
      // Cargar miembros
      const { data: memberData } = await supabase
        .from('alliance_members')
        .select(`
          *,
          user_profiles:user_id (username, level)
        `)
        .eq('alliance_id', alliance.id);

      if (memberData) setMembers(memberData as any);

      // Cargar log de donaciones a tesorería
      const { data: logData } = await supabase
        .from('alliance_treasury_logs')
        .select(`
          *,
          user_profiles:user_id (username)
        `)
        .eq('alliance_id', alliance.id)
        .order('created_at', { ascending: false })
        .limit(25);

      if (logData) setTreasuryLogs(logData as any);

    } catch (err) {
      console.error("Error al cargar detalles de la alianza:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlliancesData();
  }, []);

  const handleKickMember = async (memberId: string, username: string) => {
    if (!window.confirm(`¿Expulsar a ${username} de la alianza?`)) return;

    const { error } = await supabase.from('alliance_members').delete().eq('id', memberId);
    if (!error) {
      setMembers(members.filter(m => m.id !== memberId));
    }
  };

  const handleDissolveAlliance = async (allianceId: string, allianceName: string) => {
    if (!window.confirm(`⚠️ ¡ACCIÓN CRÍTICA! ¿Disolver definitivamente la alianza "${allianceName}"?`)) return;

    const { error } = await supabase.from('alliances').delete().eq('id', allianceId);
    if (!error) {
      setAlliances(alliances.filter(a => a.id !== allianceId));
      setSelectedAlliance(null);
      setMembers([]);
    }
  };

  const filteredAlliances = alliances.filter(a => 
    a.name.toLowerCase().includes(search.toLowerCase()) || 
    a.tag.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 font-mono text-xs text-white p-6 animate-fadeIn">
      {/* HEADER */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 uppercase">
            <Shield className="text-red-500" size={20} /> Alliance CRM & Control de Tesorería
          </h2>
          <p className="text-zinc-500 mt-1 font-sans text-[11px]">
            Gestión militar de gremios, jerarquía de oficiales, auditoría de fondos compartidos y expulsión de infractores.
          </p>
        </div>

        <div className="relative w-full md:w-64">
          <input 
            type="text" 
            placeholder="Buscar por Nombre o TAG..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-white outline-none focus:border-red-500 uppercase"
          />
          <Search size={14} className="absolute left-3 top-2.5 text-zinc-500" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LISTA DE ALIANZAS */}
        <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              Gremios Registrados ({filteredAlliances.length})
            </span>
            <button onClick={fetchAlliancesData} className="p-1 text-zinc-500 hover:text-white cursor-pointer">
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {filteredAlliances.map(a => (
              <button
                key={a.id}
                onClick={() => handleSelectAlliance(a)}
                className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer flex justify-between items-center ${
                  selectedAlliance?.id === a.id 
                    ? 'bg-red-950/30 border-red-900/60 text-white' 
                    : 'bg-zinc-900/30 border-zinc-850 hover:bg-zinc-900/60 text-zinc-400'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-red-950 border border-red-900 text-red-400 text-[9px] font-bold">
                      [{a.tag}]
                    </span>
                    <strong className="text-white text-xs">{a.name}</strong>
                  </div>
                  <span className="text-[9px] text-zinc-500 block mt-1">Líder: {a.leader?.username || 'Sin Asignar'}</span>
                </div>

                <div className="text-right">
                  <span className="text-amber-400 font-bold block">{a.treasury_gd.toLocaleString()} GD</span>
                  <span className="text-[9px] text-zinc-500">{a.member_count} Miembros</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* DETALLE Y PANEL DE MIEMBROS */}
        {selectedAlliance ? (
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4">
              <div className="flex justify-between items-start border-b border-zinc-900 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-red-950 border border-red-900 text-red-400 text-xs font-bold">
                      [{selectedAlliance.tag}]
                    </span>
                    <h3 className="text-lg font-bold text-white uppercase">{selectedAlliance.name}</h3>
                  </div>
                  <p className="text-zinc-400 text-xs mt-1 font-sans">{selectedAlliance.description || 'Sin descripción corporativa.'}</p>
                </div>

                <button 
                  onClick={() => handleDissolveAlliance(selectedAlliance.id, selectedAlliance.name)}
                  className="px-3 py-1.5 bg-red-950/40 hover:bg-red-900 text-red-400 border border-red-900/50 rounded font-bold uppercase text-[10px] cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 size={12} /> Disolver Alianza
                </button>
              </div>

              {/* STATS DE TESORERÍA */}
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div className="p-3 bg-zinc-900/40 border border-zinc-850 rounded-lg">
                  <span className="text-[9px] text-zinc-500 uppercase font-bold block">Tesorería Principal</span>
                  <strong className="text-amber-400 text-base font-mono">+{selectedAlliance.treasury_gd.toLocaleString()} GD</strong>
                </div>
                <div className="p-3 bg-zinc-900/40 border border-zinc-850 rounded-lg">
                  <span className="text-[9px] text-zinc-500 uppercase font-bold block">Reserva de Metal</span>
                  <strong className="text-cyan-400 text-base font-mono">{selectedAlliance.treasury_metal.toLocaleString()} MT</strong>
                </div>
              </div>
            </div>

            {/* TABLA DE MIEMBROS */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                <Users size={14} className="text-red-500" /> Plantilla de Comandantes ({members.length})
              </span>

              <div className="space-y-2 pt-2">
                {members.map(m => (
                  <div key={m.id} className="p-3 bg-zinc-900/30 border border-zinc-850 rounded-lg flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {m.role === 'LEADER' ? <Crown size={14} className="text-amber-400" /> : <Shield size={14} className="text-zinc-600" />}
                      <div>
                        <strong className="text-white text-xs block">{m.user_profiles?.username || 'Comandante'}</strong>
                        <span className="text-[9px] text-zinc-500">Nivel {m.user_profiles?.level || 1} • {m.role}</span>
                      </div>
                    </div>

                    {m.role !== 'LEADER' && (
                      <button 
                        onClick={() => handleKickMember(m.id, m.user_profiles?.username || 'Miembro')}
                        className="p-1.5 bg-red-950/30 hover:bg-red-900 text-red-400 border border-red-900/40 rounded cursor-pointer"
                        title="Expulsar de la alianza"
                      >
                        <UserX size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* LOG DE DONACIONES A LA TESORERÍA */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                <History size={14} className="text-amber-500" /> Bitácora Reciente de Aportes
              </span>

              <div className="space-y-2 pt-1">
                {treasuryLogs.length === 0 ? (
                  <span className="text-zinc-600 text-xs italic block text-center py-4">No hay registro de donaciones recientes.</span>
                ) : (
                  treasuryLogs.map(log => (
                    <div key={log.id} className="p-2.5 bg-zinc-900/20 border border-zinc-850 rounded flex justify-between items-center text-[11px]">
                      <div>
                        <strong className="text-zinc-300">{log.user_profiles?.username || 'Comandante'}</strong>
                        <span className="text-[9px] text-zinc-500 block">{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                      <strong className="text-emerald-400 font-mono">+{log.amount} {log.resource_type}</strong>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 bg-zinc-950/50 border border-dashed border-zinc-900 rounded-xl p-12 text-center text-zinc-600">
            Selecciona una alianza de la izquierda para desplegar el mapa de oficiales y movimientos de la tesorería.
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAllianceCRM;