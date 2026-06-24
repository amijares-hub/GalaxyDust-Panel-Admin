import React, { useState } from 'react';
import { Megaphone, Plus, Trash2, Gift, Loader2, Radio } from 'lucide-react';
import { adminApi } from '../lib/adminApi';

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
  const [isLoading, setIsLoading] = useState(false);

  const handleBroadcast = () => {
    if (!broadcastMessage) return;
    alert(`System Broadcast Sent:\n\n${broadcastMessage}`);
    setBroadcastMessage('');
  };

  const handleAddPromo = async () => {
    if (!newPromo.code || !newPromo.expiration || !newPromo.limit) return;
    
    setIsLoading(true);
    try {
      await adminApi.createPromoCode({
        code: newPromo.code,
        expires_at: newPromo.expiration,
        max_claims: newPromo.limit,
        rewards: newPromo.rewards
      });

      const code: PromoCode = {
        id: Date.now().toString(),
        code: newPromo.code,
        expiration: newPromo.expiration,
        limit: newPromo.limit,
        rewards: newPromo.rewards as PromoCode['rewards']
      };

      setPromoCodes([...promoCodes, code]);
      setNewPromo({ rewards: { metal: 0, crystal: 0, deuterium: 0, gdCoin: 0, phantomCoin: 0, ships: '' } });
    } catch (error) {
      alert('Error al crear promo code en el servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePromo = (id: string) => {
    setPromoCodes(promoCodes.filter(c => c.id !== id));
  };

  const inputCls = "w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-200 text-xs font-mono focus:outline-none focus:border-red-500/50 transition-colors placeholder-zinc-700";
  const labelCls = "block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5";

  return (
    <div className="space-y-6 font-sans">

      {/* Header */}
      <div className="flex items-center gap-3 border-b border-zinc-900 pb-4">
        <div className="h-10 w-10 bg-emerald-950/30 border border-emerald-500/20 rounded flex items-center justify-center text-emerald-400">
          <Radio size={20} />
        </div>
        <div>
          <h2 className="text-white font-bold text-lg font-mono tracking-wider uppercase">Promociones & Marketing</h2>
          <p className="text-xs text-zinc-500 font-sans mt-0.5">Gestión de broadcasts globales y generación de promo codes con recompensas.</p>
        </div>
      </div>

      {/* System Broadcast */}
      <div className="bg-black/45 border border-zinc-900 p-5 rounded-lg">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2 font-mono uppercase tracking-wider">
          <Megaphone size={14} className="text-emerald-400" />
          System Broadcast
        </h3>
        <div className="space-y-3">
          <textarea
            className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2.5 text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-emerald-500/40 h-24 resize-none text-xs font-mono transition-colors"
            placeholder="Escribe un mensaje push global para todos los usuarios activos en el sistema..."
            value={broadcastMessage}
            onChange={(e) => setBroadcastMessage(e.target.value)}
          />
          <button
            onClick={handleBroadcast}
            className="px-5 py-2 bg-emerald-950/40 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/60 text-emerald-400 font-bold text-xs uppercase tracking-wider rounded transition-all flex items-center gap-2"
          >
            <Megaphone size={12} />
            Enviar Broadcast Global
          </button>
        </div>
      </div>

      {/* Generador de Promo Codes */}
      <div className="bg-black/45 border border-zinc-900 p-5 rounded-lg">
        <h3 className="text-sm font-bold text-white mb-5 flex items-center gap-2 font-mono uppercase tracking-wider border-b border-zinc-900 pb-3">
          <Gift size={14} className="text-red-500" />
          Generador de Promo Codes
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          <div>
            <label className={labelCls}>Código</label>
            <input
              type="text"
              className={inputCls + " uppercase"}
              placeholder="Ej: EVENTO2026"
              value={newPromo.code || ''}
              onChange={(e) => setNewPromo({...newPromo, code: e.target.value.toUpperCase()})}
            />
          </div>
          <div>
            <label className={labelCls}>Fecha Expiración</label>
            <input
              type="date"
              className={inputCls}
              value={newPromo.expiration || ''}
              onChange={(e) => setNewPromo({...newPromo, expiration: e.target.value})}
            />
          </div>
          <div>
            <label className={labelCls}>Límite de usos</label>
            <input
              type="number"
              className={inputCls}
              placeholder="Ej: 1000"
              value={newPromo.limit || ''}
              onChange={(e) => setNewPromo({...newPromo, limit: parseInt(e.target.value)})}
            />
          </div>
        </div>

        <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-3 border-b border-zinc-900 pb-2">
          Recompensas del Código
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
          {[
            { key: 'metal', label: 'Metal' },
            { key: 'crystal', label: 'Crystal' },
            { key: 'deuterium', label: 'Deuterium' },
            { key: 'gdCoin', label: 'GD Coin' },
            { key: 'phantomCoin', label: 'Phantom Coin' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className={labelCls}>{label}</label>
              <input
                type="number"
                className={inputCls}
                value={(newPromo.rewards as any)?.[key] || ''}
                onChange={(e) => setNewPromo({...newPromo, rewards: {...newPromo.rewards!, [key]: parseInt(e.target.value) || 0}})}
              />
            </div>
          ))}
          <div>
            <label className={labelCls}>Naves (Ej: "10x Fighter")</label>
            <input
              type="text"
              className={inputCls}
              value={newPromo.rewards?.ships || ''}
              onChange={(e) => setNewPromo({...newPromo, rewards: {...newPromo.rewards!, ships: e.target.value}})}
            />
          </div>
        </div>

        <button
          onClick={handleAddPromo}
          disabled={isLoading}
          className="px-5 py-2 bg-red-950/30 hover:bg-[#ff1e1e]/20 border border-[#ff1e1e]/30 hover:border-[#ff1e1e]/60 text-[#ff1e1e] font-bold text-xs uppercase tracking-wider rounded transition-all flex items-center gap-2 disabled:opacity-40"
        >
          {isLoading ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
          {isLoading ? 'Creando...' : 'Crear Promo Code'}
        </button>

        {/* Tabla de códigos activos */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-900">
                <th className="px-3 py-2.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Código</th>
                <th className="px-3 py-2.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Expiración</th>
                <th className="px-3 py-2.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Límite</th>
                <th className="px-3 py-2.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Recompensas</th>
                <th className="px-3 py-2.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {promoCodes.map((code) => (
                <tr key={code.id} className="border-b border-zinc-900/60 hover:bg-zinc-900/20 transition-colors">
                  <td className="px-3 py-2.5 font-mono text-emerald-400 font-bold tracking-wider">{code.code}</td>
                  <td className="px-3 py-2.5 text-zinc-400 font-mono">{code.expiration}</td>
                  <td className="px-3 py-2.5 text-zinc-400">{code.limit.toLocaleString()} usos</td>
                  <td className="px-3 py-2.5 text-zinc-500 font-mono text-[10px]">
                    M:{code.rewards.metal} C:{code.rewards.crystal} D:{code.rewards.deuterium} GD:{code.rewards.gdCoin}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <button
                      onClick={() => handleDeletePromo(code.id)}
                      className="text-zinc-600 hover:text-red-400 transition-colors p-1 rounded hover:bg-red-950/20"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
              {promoCodes.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-zinc-600 text-xs font-mono">
                    — Sin promo codes activos —
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
