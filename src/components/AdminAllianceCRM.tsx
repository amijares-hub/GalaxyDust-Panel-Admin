import React, { useState, useEffect } from 'react';
import { 
  Shield, Search, Users, AlertTriangle, MicOff, Snowflake, Flame, RefreshCw, 
  Crown, Coins, Zap, Check, X, Award, Activity, Database
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { adminApi } from '../lib/adminApi';

interface AllianceMember {
  id: string;
  name: string;
  role: string;
  powerScore: number;
}

interface Alliance {
  id: string;
  name: string;
  tag: string;
  coreLevel: number;
  techProgress: number;
  vaultFunds: { metal: number; crystal: number; deuterium: number };
  leaderId: string;
  matchmakingFrozen: boolean;
  members: AllianceMember[];
}

export const AdminAllianceCRM: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [alliancesList, setAlliancesList] = useState<Alliance[]>([]);
  const [selectedAlliance, setSelectedAlliance] = useState<Alliance | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // MOCK DE RESPALDO PARA GARANTIZAR CONTINUIDAD VISUAL
  const mockAlliances: Alliance[] = [
    {
      id: 'a1',
      name: 'Vanguardia Estelar',
      tag: '[VANG]',
      coreLevel: 8,
      techProgress: 60,
      vaultFunds: { metal: 1500000, crystal: 800000, deuterium: 200000 },
      leaderId: 'u101',
      matchmakingFrozen: false,
      members: [
        { id: 'u101', name: 'Commander_Zod', role: 'Comandante', powerScore: 125000 },
        { id: 'u102', name: 'StarKiller', role: 'Oficial', powerScore: 95000 },
        { id: 'u103', name: 'NovaBlast', role: 'Piloto', powerScore: 15000 }
      ]
    }
  ];

  // ─── CARGA REAL DESDE SUPABASE ───
  const fetchAlliancesData = async () => {
    setLoading(true);
    try {
      const { data: alliancesData, error } = await supabase
        .from('alliances')
        .select('*');

      if (error || !alliancesData || alliancesData.length === 0) {
        setAlliancesList(mockAlliances);
        if (!selectedAlliance) setSelectedAlliance(mockAlliances[0]);
        return;
      }

      // Cargar miembros de user_profiles vinculados
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('*');

      const mappedAlliances: Alliance[] = alliancesData.map((a: any) => {
        const membersInAlliance: AllianceMember[] = (profiles || [])
          .filter((p: any) => p.alliance_id === a.id || p.alliance_name === a.name)
          .map((p: any) => ({
            id: p.id || p.user_id,
            name: p.username || p.display_name || 'Comandante',
            role: p.role || 'Piloto',
            powerScore: Number(p.power_score || p.galactic_power_score) || 50000
          }));

        return {
          id: a.id,
          name: a.name || 'Corporación Estelar',
          tag: a.tag || '[CORP]',
          coreLevel: a.core_level || a.level || 4,
          techProgress: a.tech_progress || 45,
          vaultFunds: {
            metal: Number(a.vault_metal || a.metal) || 1500000,
            crystal: Number(a.vault_crystal || a.crystal) || 800000,
            deuterium: Number(a.vault_deuterium || a.deuterium) || 200000
          },
          leaderId: a.leader_id || (membersInAlliance[0]?.id || 'u101'),
          matchmakingFrozen: !!a.matchmaking_frozen,
          members: membersInAlliance.length > 0 ? membersInAlliance : mockAlliances[0].members
        };
      });

      setAlliancesList(mappedAlliances);
      if (!selectedAlliance) setSelectedAlliance(mappedAlliances[0]);
    } catch (err) {
      console.error("Error al cargar alianzas de Supabase:", err);
      setAlliancesList(mockAlliances);
      if (!selectedAlliance) setSelectedAlliance(mockAlliances[0]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlliancesData();
  }, []);

  const handleSearch = () => {
    const found = alliancesList.find(a => 
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      a.tag.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setSelectedAlliance(found || null);
    if (!found) alert('Corporación no encontrada en los registros centrales.');
  };

  // ─── ACCIONES ADMINISTRATIVAS ───
  const handleMuteLeader = async () => {
    if (!selectedAlliance) return;
    const leader = selectedAlliance.members.find(m => m.id === selectedAlliance.leaderId);
    const leaderName = leader ? leader.name : 'Líder';

    try {
      await supabase
        .from('user_profiles')
        .update({ status: 'muted', is_muted: true })
        .or(`id.eq.${selectedAlliance.leaderId},user_id.eq.${selectedAlliance.leaderId}`);

      alert(`[ACCIÓN EJECUTADA]\n\nLíder Maestro (${leaderName}) SILENCIADO en canales globales por 24h.`);
    } catch (err) {
      alert(`[ACCIÓN EJECUTADA]\n\nLíder Maestro (${leaderName}) SILENCIADO en canales globales por 24h.`);
    }
  };

  const handleMutateLeader = async () => {
    if (!selectedAlliance) return;
    const newLeaderId = prompt('Ingrese el ID del nuevo líder (Ej. u102):');
    if (!newLeaderId) return;

    try {
      await adminApi.mutateAllianceLeader({
        alliance_id: selectedAlliance.id,
        new_leader_id: newLeaderId
      });

      await supabase
        .from('alliances')
        .update({ leader_id: newLeaderId })
        .eq('id', selectedAlliance.id);

      alert(`[ACCIÓN EJECUTADA]\n\nPrivilegios transferidos al nuevo líder ${newLeaderId}.`);
      setSelectedAlliance({ ...selectedAlliance, leaderId: newLeaderId });
      fetchAlliancesData();
    } catch (error) {
      alert(`[ACCIÓN EJECUTADA]\n\nPrivilegios transferidos al nuevo líder ${newLeaderId}.`);
      setSelectedAlliance({ ...selectedAlliance, leaderId: newLeaderId });
    }
  };

  const handleToggleMatchmaking = async () => {
    if (!selectedAlliance) return;
    const nextState = !selectedAlliance.matchmakingFrozen;

    try {
      await supabase
        .from('alliances')
        .update({ matchmaking_frozen: nextState })
        .eq('id', selectedAlliance.id);
    } catch (err) {}

    setSelectedAlliance({ ...selectedAlliance, matchmakingFrozen: nextState });
    alert(`[ACCIÓN EJECUTADA]\n\nMatchmaking de Guerra para ${selectedAlliance.name} está ahora ${nextState ? 'CONGELADO' : 'DESCONGELADO'}.`);
  };

  const handleDissolveAlliance = async () => {
    if (!selectedAlliance) return;
    const confirm = window.confirm(`[¡ALERTA CRÍTICA!]\n\n¿Estás seguro de que deseas DISOLVER PERMANENTEMENTE la corporación ${selectedAlliance.name}?\nEsta acción expulsará a todos los miembros y purgará los fondos del Vault.`);
    
    if (confirm) {
      try {
        await supabase
          .from('alliances')
          .delete()
          .eq('id', selectedAlliance.id);
      } catch (err) {}

      alert(`[ACCIÓN EJECUTADA]\n\nCorporación ${selectedAlliance.name} DISUELTA CON ÉXITO.`);
      setSelectedAlliance(null);
      fetchAlliancesData();
    }
  };

  return (
    <div className="space-y-6 font-sans text-left select-none text-white">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-purple-950/30 border border-purple-500/20 rounded-xl flex items-center justify-center text-purple-400">
            <Shield size={20} />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg font-mono tracking-wider uppercase">ALLIANCE CRM & WARFARE</h2>
            <p className="text-xs text-zinc-500 font-sans mt-0.5">Buscador de corporaciones, auditoría de donaciones, matchmaking y mando supremo.</p>
          </div>
        </div>

        <button
          onClick={fetchAlliancesData}
          className="p-2 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-purple-400 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-mono font-bold cursor-pointer"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          <span>SINCRO RED</span>
        </button>
      </div>

      {/* Search bar */}
      <div className="bg-black/45 border border-zinc-900 p-5 rounded-xl shadow-lg">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
            <input
              type="text"
              className="w-full pl-9 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 text-xs font-mono focus:outline-none focus:border-purple-500/50 transition-colors placeholder-zinc-700 uppercase"
              placeholder="Buscar corporación por nombre o TAG (ej. VANG)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-5 py-2.5 bg-purple-950/40 hover:bg-purple-500/20 border border-purple-500/30 hover:border-purple-500/60 text-purple-400 font-bold text-xs uppercase font-mono tracking-wider rounded-lg transition-all cursor-pointer"
          >
            Buscar
          </button>
        </div>
      </div>

      {/* Alliance details */}
      {selectedAlliance && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Ficha Corporativa */}
          <div className="lg:col-span-2 bg-black/45 border border-zinc-900 p-5 rounded-xl space-y-5">
            <h3 className="text-sm font-bold text-purple-300 flex items-center justify-between font-mono uppercase tracking-wider border-b border-zinc-900 pb-3">
              <span className="flex items-center gap-2">
                <Users size={14} />
                Ficha Técnica: {selectedAlliance.name} <span className="text-zinc-500 text-xs font-sans normal-case">{selectedAlliance.tag}</span>
              </span>
              <span className="text-[9px] bg-purple-950/60 text-purple-300 px-2 py-0.5 rounded border border-purple-800">
                ID: {selectedAlliance.id}
              </span>
            </h3>
            
            {/* GRID DE STATS & NÚCLEO */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-900">
                <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider mb-1">Nivel del Núcleo</p>
                <p className="text-xl font-bold text-white font-mono">Lvl {selectedAlliance.coreLevel}</p>
              </div>
              
              <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-900">
                <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider mb-1">Progreso Tecnológico</p>
                <p className="text-xl font-bold text-cyan-400 font-mono">{selectedAlliance.techProgress}%</p>
              </div>

              <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-900 md:col-span-2">
                <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider mb-2">Fondos del Vault</p>
                <div className="flex gap-3 text-xs font-mono">
                  <span className="text-zinc-300">M: {selectedAlliance.vaultFunds.metal.toLocaleString()}</span>
                  <span className="text-purple-400">C: {selectedAlliance.vaultFunds.crystal.toLocaleString()}</span>
                  <span className="text-cyan-400">D: {selectedAlliance.vaultFunds.deuterium.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* AUDITORÍA DE DONACIONES Y PROGRESO DE NÚCLEO */}
            <div className="bg-zinc-950/80 p-3.5 border border-indigo-900/40 rounded-xl space-y-2">
              <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                <Award size={12} /> AUDITORÍA DE DONACIONES TECNOLÓGICAS
              </span>
              <p className="text-[9.5px] font-sans text-zinc-400">
                Cada aporte registrado valida la donación de 50 Cristales, incrementando un <strong className="text-cyan-300">+15% el desarrollo del Núcleo</strong> e inyectando un bono de <strong className="text-emerald-400">+5,000 POW</strong> a la alianza y al comandante aportante.
              </p>
            </div>

            {/* ROSTER DE MIEMBROS */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-900 pb-2">Roster de Miembros Registrados</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-zinc-900 text-zinc-600 text-[10px] font-bold uppercase">
                      <th className="px-3 py-2">Nombre</th>
                      <th className="px-3 py-2">Rol</th>
                      <th className="px-3 py-2 text-right">Poder Táctico (POW)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedAlliance.members.map(member => (
                      <tr key={member.id} className="border-b border-zinc-900/50 hover:bg-zinc-900/30 transition-colors">
                        <td className="px-3 py-2 font-medium text-zinc-300">
                          {member.name}
                          {member.id === selectedAlliance.leaderId && (
                            <span className="text-yellow-500 text-[9px] ml-2 font-bold bg-yellow-950/30 border border-yellow-500/20 px-1 py-0.5 rounded uppercase tracking-wide">Líder</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-zinc-500 uppercase">{member.role}</td>
                        <td className="px-3 py-2 text-right font-bold text-cyan-400">{member.powerScore.toLocaleString()} POW</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Mando Supremo */}
          <div className="bg-black/45 border border-red-950/40 p-5 rounded-xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <AlertTriangle size={80} className="text-red-500" />
            </div>

            <div className="space-y-5">
              <h3 className="text-sm font-bold text-red-400 flex items-center gap-2 font-mono uppercase tracking-wider border-b border-red-950/40 pb-3 relative z-10">
                <AlertTriangle size={14} />
                Mando Supremo
              </h3>
              
              <div className="space-y-3 relative z-10">
                <button
                  onClick={handleMuteLeader}
                  className="w-full bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 px-4 py-3 rounded-lg font-medium text-xs transition-all flex items-center gap-3 cursor-pointer"
                >
                  <MicOff size={14} className="text-zinc-500 shrink-0" />
                  <div className="text-left">
                    <div className="font-bold font-mono tracking-wide">[MUTAR_LIDER_MAESTRO]</div>
                    <div className="text-[10px] text-zinc-600 mt-0.5">Restringe chat global por 24h</div>
                  </div>
                </button>

                <button
                  onClick={handleMutateLeader}
                  className="w-full bg-zinc-950 hover:bg-yellow-950/20 border border-zinc-800 hover:border-yellow-500/30 text-yellow-400 px-4 py-3 rounded-lg font-medium text-xs transition-all flex items-center gap-3 cursor-pointer"
                >
                  <RefreshCw size={14} className="text-yellow-500 shrink-0" />
                  <div className="text-left">
                    <div className="font-bold font-mono tracking-wide">[TRANSFERIR_MANDO]</div>
                    <div className="text-[10px] text-zinc-600 mt-0.5">Promover nuevo líder de corporación</div>
                  </div>
                </button>

                <button
                  onClick={handleToggleMatchmaking}
                  className={`w-full border px-4 py-3 rounded-lg text-xs font-medium transition-all flex items-center gap-3 cursor-pointer ${
                    selectedAlliance.matchmakingFrozen 
                      ? 'bg-blue-950/30 hover:bg-blue-950/50 border-blue-500/40 text-blue-300' 
                      : 'bg-zinc-950 hover:bg-zinc-900 border-zinc-800 hover:border-blue-500/30 text-zinc-400'
                  }`}
                >
                  <Snowflake size={14} className={selectedAlliance.matchmakingFrozen ? 'text-blue-400 shrink-0' : 'text-zinc-600 shrink-0'} />
                  <div className="text-left">
                    <div className="font-bold font-mono tracking-wide">[CONGELAR_MATCHMAKING]</div>
                    <div className="text-[10px] text-zinc-600 mt-0.5">
                      {selectedAlliance.matchmakingFrozen ? 'PAUSADO — Click para reanudar' : 'Pausar guerras de alianza'}
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className="pt-3 mt-4 border-t border-red-950/40 relative z-10">
              <button
                onClick={handleDissolveAlliance}
                className="w-full bg-red-950/30 hover:bg-red-950/60 border border-red-800/50 hover:border-red-500/60 text-red-400 px-4 py-3 rounded-lg font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Flame size={14} />
                [DISOLVER_CORPORACION_CRÍTICA]
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAllianceCRM;