import React, { useState } from 'react';
import { Shield, Search, Users, AlertTriangle, MicOff, Snowflake, Flame, RefreshCw } from 'lucide-react';
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
  vaultFunds: { metal: number; crystal: number; deuterium: number };
  leaderId: string;
  matchmakingFrozen: boolean;
  members: AllianceMember[];
}

export const AdminAllianceCRM: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlliance, setSelectedAlliance] = useState<Alliance | null>(null);

  const mockAlliances: Alliance[] = [
    {
      id: 'a1',
      name: 'Vanguardia Estelar',
      tag: '[VANG]',
      coreLevel: 8,
      vaultFunds: { metal: 1500000, crystal: 800000, deuterium: 200000 },
      leaderId: 'u101',
      matchmakingFrozen: false,
      members: [
        { id: 'u101', name: 'Commander_Zod', role: 'Maestro', powerScore: 125000 },
        { id: 'u102', name: 'StarKiller', role: 'Oficial', powerScore: 95000 },
        { id: 'u103', name: 'NovaBlast', role: 'Recluta', powerScore: 15000 }
      ]
    }
  ];

  const handleSearch = () => {
    const found = mockAlliances.find(a => 
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      a.tag.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setSelectedAlliance(found || null);
    if (!found) alert('Corporación no encontrada en los registros.');
  };

  const handleMuteLeader = () => {
    if (selectedAlliance) {
      alert(`[ACCIÓN EJECUTADA]\n\nLíder Maestro (${selectedAlliance.members.find(m => m.id === selectedAlliance.leaderId)?.name}) MUTADO en canales globales por 24h.`);
    }
  };

  const handleMutateLeader = async () => {
    if (selectedAlliance) {
      const newLeaderId = prompt('Ingrese el ID del nuevo líder (Ej. u102):');
      if (newLeaderId) {
        try {
          await adminApi.mutateAllianceLeader({
            alliance_id: selectedAlliance.id,
            new_leader_id: newLeaderId
          });
          alert(`[ACCIÓN EJECUTADA]\n\nPrivilegios transferidos al nuevo líder ${newLeaderId}.`);
          setSelectedAlliance({ ...selectedAlliance, leaderId: newLeaderId });
        } catch (error) {
          alert('Error al mutar el líder en el servidor.');
        }
      }
    }
  };

  const handleToggleMatchmaking = () => {
    if (selectedAlliance) {
      setSelectedAlliance({ ...selectedAlliance, matchmakingFrozen: !selectedAlliance.matchmakingFrozen });
      alert(`[ACCIÓN EJECUTADA]\n\nMatchmaking de Guerra para ${selectedAlliance.name} está ahora ${!selectedAlliance.matchmakingFrozen ? 'CONGELADO' : 'DESCONGELADO'}.`);
    }
  };

  const handleDissolveAlliance = () => {
    if (selectedAlliance) {
      const confirm = window.confirm(`[¡ALERTA CRÍTICA!]\n\n¿Estás seguro de que deseas DISOLVER PERMANENTEMENTE la corporación ${selectedAlliance.name}?\nEsta acción expulsará a todos los miembros y purgará los fondos del Vault.`);
      if (confirm) {
        alert(`[ACCIÓN EJECUTADA]\n\nCorporación ${selectedAlliance.name} DISUELTA.`);
        setSelectedAlliance(null);
      }
    }
  };

  return (
    <div className="space-y-6 font-sans">

      {/* Header */}
      <div className="flex items-center gap-3 border-b border-zinc-900 pb-4">
        <div className="h-10 w-10 bg-purple-950/30 border border-purple-500/20 rounded flex items-center justify-center text-purple-400">
          <Shield size={20} />
        </div>
        <div>
          <h2 className="text-white font-bold text-lg font-mono tracking-wider uppercase">Alliance CRM</h2>
          <p className="text-xs text-zinc-500 font-sans mt-0.5">Buscador de corporaciones. Gestión de mando, matchmaking y disolución.</p>
        </div>
      </div>

      {/* Search bar */}
      <div className="bg-black/45 border border-zinc-900 p-5 rounded-lg">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
            <input
              type="text"
              className="w-full pl-9 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded text-zinc-200 text-xs font-mono focus:outline-none focus:border-purple-500/50 transition-colors placeholder-zinc-700"
              placeholder="Buscar corporación por nombre o TAG (ej. VANG)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-5 py-2 bg-purple-950/40 hover:bg-purple-500/20 border border-purple-500/30 hover:border-purple-500/60 text-purple-400 font-bold text-xs uppercase tracking-wider rounded transition-all"
          >
            Buscar
          </button>
        </div>
      </div>

      {/* Alliance details */}
      {selectedAlliance && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Ficha Corporativa */}
          <div className="lg:col-span-2 bg-black/45 border border-zinc-900 p-5 rounded-lg">
            <h3 className="text-sm font-bold text-purple-300 mb-4 flex items-center gap-2 font-mono uppercase tracking-wider border-b border-zinc-900 pb-3">
              <Users size={14} />
              Ficha Técnica: {selectedAlliance.name} <span className="text-zinc-500 text-xs font-sans normal-case">{selectedAlliance.tag}</span>
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              <div className="bg-zinc-950 p-3 rounded border border-zinc-900">
                <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider mb-1">Nivel de Núcleo</p>
                <p className="text-xl font-bold text-white font-mono">Lvl {selectedAlliance.coreLevel}</p>
              </div>
              <div className="bg-zinc-950 p-3 rounded border border-zinc-900">
                <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider mb-1">Miembros</p>
                <p className="text-xl font-bold text-white font-mono">{selectedAlliance.members.length}<span className="text-zinc-600 text-sm">/50</span></p>
              </div>
              <div className="bg-zinc-950 p-3 rounded border border-zinc-900 md:col-span-2">
                <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider mb-2">Fondos del Vault</p>
                <div className="flex gap-3 text-xs font-mono">
                  <span className="text-zinc-300">M: {selectedAlliance.vaultFunds.metal.toLocaleString()}</span>
                  <span className="text-cyan-400">C: {selectedAlliance.vaultFunds.crystal.toLocaleString()}</span>
                  <span className="text-emerald-400">D: {selectedAlliance.vaultFunds.deuterium.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-3 border-b border-zinc-900 pb-2">Roster de Miembros</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-900">
                    <th className="px-3 py-2 text-[10px] font-bold text-zinc-600 uppercase tracking-wider">Nombre</th>
                    <th className="px-3 py-2 text-[10px] font-bold text-zinc-600 uppercase tracking-wider">Rol</th>
                    <th className="px-3 py-2 text-[10px] font-bold text-zinc-600 uppercase tracking-wider text-right">Power Score</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedAlliance.members.map(member => (
                    <tr key={member.id} className="border-b border-zinc-900/50 hover:bg-zinc-900/20 transition-colors">
                      <td className="px-3 py-2 font-medium text-zinc-300">
                        {member.name}
                        {member.id === selectedAlliance.leaderId && (
                          <span className="text-yellow-500 text-[9px] ml-2 font-bold bg-yellow-950/30 border border-yellow-500/20 px-1 py-0.5 rounded uppercase tracking-wide">Líder</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-zinc-500">{member.role}</td>
                      <td className="px-3 py-2 text-right font-mono text-zinc-300">{member.powerScore.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mando Supremo */}
          <div className="bg-black/45 border border-red-950/40 p-5 rounded-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <AlertTriangle size={80} className="text-red-500" />
            </div>
            <h3 className="text-sm font-bold text-red-400 mb-5 flex items-center gap-2 font-mono uppercase tracking-wider border-b border-red-950/40 pb-3 relative z-10">
              <AlertTriangle size={14} />
              Mando Supremo
            </h3>
            
            <div className="space-y-3 relative z-10">
              <button
                onClick={handleMuteLeader}
                className="w-full bg-zinc-950 hover:bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 text-zinc-300 px-4 py-3 rounded font-medium text-xs transition-all flex items-center gap-3"
              >
                <MicOff size={14} className="text-zinc-500 shrink-0" />
                <div className="text-left">
                  <div className="font-bold font-mono tracking-wide">[MUTAR_LIDER_MAESTRO]</div>
                  <div className="text-[10px] text-zinc-600 mt-0.5">Restringe chat global por 24h</div>
                </div>
              </button>

              <button
                onClick={handleMutateLeader}
                className="w-full bg-zinc-950 hover:bg-yellow-950/20 border border-zinc-800 hover:border-yellow-500/30 text-yellow-400 px-4 py-3 rounded font-medium text-xs transition-all flex items-center gap-3"
              >
                <RefreshCw size={14} className="text-yellow-500 shrink-0" />
                <div className="text-left">
                  <div className="font-bold font-mono tracking-wide">[TRANSFERIR_MANDO]</div>
                  <div className="text-[10px] text-zinc-600 mt-0.5">Promover nuevo líder de corporación</div>
                </div>
              </button>

              <button
                onClick={handleToggleMatchmaking}
                className={`w-full border px-4 py-3 rounded text-xs font-medium transition-all flex items-center gap-3 ${
                  selectedAlliance.matchmakingFrozen 
                    ? 'bg-blue-950/30 hover:bg-blue-950/50 border-blue-500/40 text-blue-300' 
                    : 'bg-zinc-950 hover:bg-zinc-900/80 border-zinc-800 hover:border-blue-500/30 text-zinc-400'
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

              <div className="pt-3 mt-3 border-t border-red-950/40">
                <button
                  onClick={handleDissolveAlliance}
                  className="w-full bg-red-950/30 hover:bg-red-950/60 border border-red-800/50 hover:border-red-500/60 text-red-400 px-4 py-3 rounded font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                >
                  <Flame size={14} />
                  [DISOLVER_CORPORACION_CRÍTICA]
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
