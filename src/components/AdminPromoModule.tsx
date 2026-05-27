import React, { useState } from 'react';
import { Megaphone, Plus, Trash2, Gift } from 'lucide-react';

interface PromoCode {
  id: string;
  code: string;
  expiration: string;
  limit: number;
  rewards: {
    metal: number;
    crystal: number;
    deuterium: number;
    gdCoin: number;
    phantomCoin: number;
    ships: string;
  };
}

export const AdminPromoModule: React.FC = () => {
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([
    {
      id: '1',
      code: 'WELCOME2026',
      expiration: '2026-12-31',
      limit: 1000,
      rewards: { metal: 5000, crystal: 5000, deuterium: 1000, gdCoin: 100, phantomCoin: 0, ships: '' }
    }
  ]);

  const [newPromo, setNewPromo] = useState<Partial<PromoCode>>({
    rewards: { metal: 0, crystal: 0, deuterium: 0, gdCoin: 0, phantomCoin: 0, ships: '' }
  });

  const handleBroadcast = () => {
    if (!broadcastMessage) return;
    alert(`System Broadcast Sent:\n\n${broadcastMessage}`);
    setBroadcastMessage('');
  };

  const handleAddPromo = () => {
    if (!newPromo.code || !newPromo.expiration || !newPromo.limit) return;
    
    const code: PromoCode = {
      id: Date.now().toString(),
      code: newPromo.code,
      expiration: newPromo.expiration,
      limit: newPromo.limit,
      rewards: newPromo.rewards as PromoCode['rewards']
    };

    setPromoCodes([...promoCodes, code]);
    setNewPromo({ rewards: { metal: 0, crystal: 0, deuterium: 0, gdCoin: 0, phantomCoin: 0, ships: '' } });
  };

  const handleDeletePromo = (id: string) => {
    setPromoCodes(promoCodes.filter(c => c.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* System Broadcast */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 p-6 rounded-lg">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-blue-400" />
          System Broadcast
        </h2>
        <div className="space-y-4">
          <textarea
            className="w-full bg-gray-900 border border-gray-700 rounded-md p-3 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 h-24 resize-none"
            placeholder="Escribe un mensaje push global para todos los usuarios..."
            value={broadcastMessage}
            onChange={(e) => setBroadcastMessage(e.target.value)}
          />
          <button
            onClick={handleBroadcast}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
          >
            Enviar Broadcast
          </button>
        </div>
      </div>

      {/* Generador de Promo Codes */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 p-6 rounded-lg">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Gift className="w-5 h-5 text-emerald-400" />
          Generador de Promo Codes
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Código</label>
            <input
              type="text"
              className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-white focus:outline-none focus:border-emerald-500 uppercase"
              placeholder="Ej: EVENTO2026"
              value={newPromo.code || ''}
              onChange={(e) => setNewPromo({...newPromo, code: e.target.value.toUpperCase()})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Expiración</label>
            <input
              type="date"
              className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-white focus:outline-none focus:border-emerald-500"
              value={newPromo.expiration || ''}
              onChange={(e) => setNewPromo({...newPromo, expiration: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Límite de usos</label>
            <input
              type="number"
              className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-white focus:outline-none focus:border-emerald-500"
              placeholder="Ej: 1000"
              value={newPromo.limit || ''}
              onChange={(e) => setNewPromo({...newPromo, limit: parseInt(e.target.value)})}
            />
          </div>
        </div>

        <h3 className="text-md font-medium text-gray-300 mb-3 border-b border-gray-700 pb-2">Recompensas</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Metal</label>
            <input
              type="number"
              className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-white text-sm"
              value={newPromo.rewards?.metal || ''}
              onChange={(e) => setNewPromo({...newPromo, rewards: {...newPromo.rewards!, metal: parseInt(e.target.value) || 0}})}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Crystal</label>
            <input
              type="number"
              className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-white text-sm"
              value={newPromo.rewards?.crystal || ''}
              onChange={(e) => setNewPromo({...newPromo, rewards: {...newPromo.rewards!, crystal: parseInt(e.target.value) || 0}})}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Deuterium</label>
            <input
              type="number"
              className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-white text-sm"
              value={newPromo.rewards?.deuterium || ''}
              onChange={(e) => setNewPromo({...newPromo, rewards: {...newPromo.rewards!, deuterium: parseInt(e.target.value) || 0}})}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">GD Coin</label>
            <input
              type="number"
              className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-white text-sm"
              value={newPromo.rewards?.gdCoin || ''}
              onChange={(e) => setNewPromo({...newPromo, rewards: {...newPromo.rewards!, gdCoin: parseInt(e.target.value) || 0}})}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Phantom Coin</label>
            <input
              type="number"
              className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-white text-sm"
              value={newPromo.rewards?.phantomCoin || ''}
              onChange={(e) => setNewPromo({...newPromo, rewards: {...newPromo.rewards!, phantomCoin: parseInt(e.target.value) || 0}})}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Naves (Ej: "10x Fighter")</label>
            <input
              type="text"
              className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-white text-sm"
              value={newPromo.rewards?.ships || ''}
              onChange={(e) => setNewPromo({...newPromo, rewards: {...newPromo.rewards!, ships: e.target.value}})}
            />
          </div>
        </div>

        <button
          onClick={handleAddPromo}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-md font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Crear Promo Code
        </button>

        {/* Tabla Inferior */}
        <div className="mt-8 overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="text-xs text-gray-400 uppercase bg-gray-900/50">
              <tr>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Expiración</th>
                <th className="px-4 py-3">Límite</th>
                <th className="px-4 py-3">Recompensas Principales</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {promoCodes.map((code) => (
                <tr key={code.id} className="border-b border-gray-800 bg-gray-800/20 hover:bg-gray-800/40">
                  <td className="px-4 py-3 font-mono text-emerald-400 font-bold">{code.code}</td>
                  <td className="px-4 py-3">{code.expiration}</td>
                  <td className="px-4 py-3">{code.limit} usos</td>
                  <td className="px-4 py-3 text-xs">
                    M:{code.rewards.metal} C:{code.rewards.crystal} D:{code.rewards.deuterium} GD:{code.rewards.gdCoin}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDeletePromo(code.id)}
                      className="text-red-400 hover:text-red-300 transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {promoCodes.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No hay promo codes activos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
