import React, { useState } from 'react';
import { Shield, Search, Users, AlertTriangle, MicOff, Snowflake, Flame } from 'lucide-react';

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

  // Mock Data
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

  const handleToggleMatchmaking = () => {
    if (selectedAlliance) {
      setSelectedAlliance({
        ...selectedAlliance,
        matchmakingFrozen: !selectedAlliance.matchmakingFrozen
      });
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
    <div className="space-y-6">
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 p-6 rounded-lg">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-purple-400" />
          Alliance CRM (Buscador de Gremios)
        </h2>
        
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:outline-none focus:border-purple-500"
              placeholder="Buscar por nombre o TAG (ej. VANG)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button
            onClick={handleSearch}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
          >
            Buscar
          </button>
        </div>
      </div>

      {selectedAlliance && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ficha Corporativa */}
          <div className="lg:col-span-2 bg-gray-800/50 backdrop-blur-sm border border-gray-700 p-6 rounded-lg">
            <h3 className="text-lg font-bold text-purple-300 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Ficha Técnica: {selectedAlliance.name} <span className="text-gray-400 text-sm">{selectedAlliance.tag}</span>
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-900/80 p-3 rounded border border-gray-700">
                <p className="text-xs text-gray-500">Nivel de Núcleo</p>
                <p className="text-xl font-bold text-white">Lvl {selectedAlliance.coreLevel}</p>
              </div>
              <div className="bg-gray-900/80 p-3 rounded border border-gray-700">
                <p className="text-xs text-gray-500">Miembros</p>
                <p className="text-xl font-bold text-white">{selectedAlliance.members.length}/50</p>
              </div>
              <div className="bg-gray-900/80 p-3 rounded border border-gray-700 md:col-span-2">
                <p className="text-xs text-gray-500 mb-1">Fondos del Vault</p>
                <div className="flex gap-3 text-sm font-mono">
                  <span className="text-gray-300">M: {selectedAlliance.vaultFunds.metal.toLocaleString()}</span>
                  <span className="text-cyan-300">C: {selectedAlliance.vaultFunds.crystal.toLocaleString()}</span>
                  <span className="text-green-300">D: {selectedAlliance.vaultFunds.deuterium.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <h4 className="text-sm font-bold text-gray-400 mb-3 border-b border-gray-700 pb-2">Roster de Miembros</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="text-xs text-gray-500 bg-gray-900/50">
                  <tr>
                    <th className="px-4 py-2">Nombre</th>
                    <th className="px-4 py-2">Rol</th>
                    <th className="px-4 py-2 text-right">Power Score</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedAlliance.members.map(member => (
                    <tr key={member.id} className="border-b border-gray-800 hover:bg-gray-800/40">
                      <td className="px-4 py-2 font-medium">
                        {member.name} {member.id === selectedAlliance.leaderId && <span className="text-yellow-500 text-xs ml-1">(Líder)</span>}
                      </td>
                      <td className="px-4 py-2">{member.role}</td>
                      <td className="px-4 py-2 text-right font-mono">{member.powerScore.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mando Supremo */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-red-900/30 p-6 rounded-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <AlertTriangle className="w-24 h-24 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-red-400 mb-6 flex items-center gap-2 relative z-10">
              <AlertTriangle className="w-5 h-5" />
              Mando Supremo
            </h3>
            
            <div className="space-y-4 relative z-10">
              <button
                onClick={handleMuteLeader}
                className="w-full bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-gray-500 text-gray-300 px-4 py-3 rounded-md font-medium transition-colors flex items-center gap-3"
              >
                <MicOff className="w-5 h-5 text-gray-500" />
                <div className="text-left">
                  <div className="text-sm">[MUTAR_LIDER_MAESTRO]</div>
                  <div className="text-xs text-gray-500">Restringe chat global</div>
                </div>
              </button>

              <button
                onClick={handleToggleMatchmaking}
                className={`w-full border px-4 py-3 rounded-md font-medium transition-colors flex items-center gap-3 ${
                  selectedAlliance.matchmakingFrozen 
                    ? 'bg-blue-900/40 hover:bg-blue-900/60 border-blue-500 text-blue-200' 
                    : 'bg-gray-900 hover:bg-gray-800 border-gray-700 hover:border-blue-700 text-gray-300'
                }`}
              >
                <Snowflake className={`w-5 h-5 ${selectedAlliance.matchmakingFrozen ? 'text-blue-400' : 'text-gray-500'}`} />
                <div className="text-left">
                  <div className="text-sm">[CONGELAR_MATCHMAKING]</div>
                  <div className="text-xs text-gray-500 opacity-80">
                    {selectedAlliance.matchmakingFrozen ? 'Guerra pausada (Click para resumir)' : 'Pausar guerras de alianza'}
                  </div>
                </div>
              </button>

              <div className="pt-4 mt-4 border-t border-red-900/30">
                <button
                  onClick={handleDissolveAlliance}
                  className="w-full bg-red-950/50 hover:bg-red-900 border border-red-800 hover:border-red-500 text-red-200 px-4 py-3 rounded-md font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <Flame className="w-5 h-5" />
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
