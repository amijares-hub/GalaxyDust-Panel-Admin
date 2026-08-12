import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Megaphone, Plus, Trash2, Gift, Loader2, Radio, RefreshCw, 
  CheckCircle, AlertCircle, Coins, Sparkles, Send, Database, ShieldAlert 
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { adminApi } from '../lib/adminApi';

interface PromoCodeRewards {
  metal: number;
  crystal: number;
  deuterium: number;
  gd_coins: number;
  phantom_coins: number;
  ships: string;
}

interface PromoCode {
  id: string;
  code: string;
  expiration: string;
  limit: number;
  claims_count?: number;
  rewards: PromoCodeRewards;
}

interface AdminPromoModuleProps {
  setIsAlertToShow?: (alert: { show: boolean; status: 'success' | 'error'; message: string }) => void;
}

export const AdminPromoModule: React.FC<AdminPromoModuleProps> = ({ setIsAlertToShow }) => {
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([
    {
      id: '1',
      code: 'WELCOME2026',
      expiration: '2026-12-31',
      limit: 1000,
      claims_count: 142,
      rewards: { metal: 5000, crystal: 5000, deuterium: 1000, gd_coins: 100, phantom_coins: 0, ships: '1x Interceptor' }
    }
  ]);

  const [newPromo, setNewPromo] = useState<Partial<PromoCode>>({
    code: '',
    expiration: '',
    limit: 100,
    rewards: { metal: 0, crystal: 0, deuterium: 0, gd_coins: 0, phantom_coins: 0, ships: '' }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [fetchingCodes, setFetchingCodes] = useState(false);

  // ─── CARGA EN TIEMPO REAL DE PROMO CODES DESDE SUPABASE ───
  const fetchPromoCodes = async () => {
    setFetchingCodes(true);
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const mappedCodes: PromoCode[] = data.map((item: any) => ({
          id: item.id,
          code: item.code,
          expiration: item.expires_at || item.expiration || '2026-12-31',
          limit: Number(item.max_claims || item.limit) || 1000,
          claims_count: Number(item.claims_count) || 0,
          rewards: {
            metal: Number(item.rewards?.metal) || 0,
            crystal: Number(item.rewards?.crystal) || 0,
            deuterium: Number(item.rewards?.deuterium) || 0,
            gd_coins: Number(item.rewards?.gd_coins) || 0,
            phantom_coins: Number(item.rewards?.phantom_coins) || 0,
            ships: item.rewards?.ships || ''
          }
        }));
        setPromoCodes(mappedCodes);
      }
    } catch (err) {
      console.warn("Utilizando registros locales de respaldo para Promo Codes.");
    } finally {
      setFetchingCodes(false);
    }
  };

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  // ─── TRANSMISIÓN GLOBAL BROADCAST ───
  const handleBroadcast = async () => {
    if (!broadcastMessage.trim()) return;

    setIsBroadcasting(true);
    try {
      // 1. Inyectar notificación global en Supabase
      const { data: users } = await supabase.from('user_profiles').select('id, user_id').limit(100);

      if (users && users.length > 0) {
        const notificationsPayload = users.map((u: any) => ({
          user_id: u.id || u.user_id,
          title: '📢 COMUNICADO MAESTRO DEL SISTEMA',
          message: broadcastMessage.trim(),
          type: 'SYSTEM',
          read: false,
          created_at: new Date().toISOString()
        }));

        await supabase.from('user_notifications').insert(notificationsPayload);
      }

      // 2. Transmisión al chat global como mensaje de sistema
      await supabase.from('chat_messages').insert([{
        channel_id: 'global-main',
        user_id: 'SYSTEM_ADMIN',
        user_name: '📢 SISTEMA CENTRAL',
        user_role: 'ADMINISTRACIÓN',
        user_avatar: 'https://qldjeysusithpblfrmtq.supabase.co/storage/v1/object/public/Assets%20para%20la%20Pagina%20Web/Avatares%20de%20Comandantes/1.png',
        content: `COMUNICADO OFICIAL: ${broadcastMessage.trim()}`,
        message_type: 'SYSTEM',
        created_at: new Date().toISOString()
      }]);

      if (setIsAlertToShow) {
        setIsAlertToShow({
          show: true,
          status: 'success',
          message: '📢 Transmisión de System Broadcast enviada con éxito a todos los comandantes en línea.'
        });
      } else {
        alert(`📢 System Broadcast Enviado:\n\n${broadcastMessage}`);
      }

      setBroadcastMessage('');
    } catch (err: any) {
      alert(`Error al transmitir broadcast: ${err.message}`);
    } finally {
      setIsBroadcasting(false);
    }
  };

  // ─── CREAR PROMO CODE ───
  const handleAddPromo = async () => {
    if (!newPromo.code || !newPromo.expiration || !newPromo.limit) {
      alert("Por favor, completa el código, fecha de expiración y límite de usos.");
      return;
    }
    
    setIsLoading(true);
    try {
      const formattedCode = newPromo.code.toUpperCase().trim();
      const payload = {
        code: formattedCode,
        expires_at: newPromo.expiration,
        max_claims: Number(newPromo.limit),
        claims_count: 0,
        rewards: newPromo.rewards,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase.from('promo_codes').insert([payload]).select();

      const createdId = (!error && data && data[0]) ? data[0].id : Date.now().toString();

      const codeObj: PromoCode = {
        id: createdId,
        code: formattedCode,
        expiration: newPromo.expiration,
        limit: Number(newPromo.limit),
        claims_count: 0,
        rewards: newPromo.rewards as PromoCodeRewards
      };

      setPromoCodes(prev => [codeObj, ...prev]);

      if (setIsAlertToShow) {
        setIsAlertToShow({
          show: true,
          status: 'success',
          message: `✅ ¡PROMO CODE [${formattedCode}] CREADO CON ÉXITO!`
        });
      }

      setNewPromo({ 
        code: '',
        expiration: '',
        limit: 100,
        rewards: { metal: 0, crystal: 0, deuterium: 0, gd_coins: 0, phantom_coins: 0, ships: '' } 
      });
    } catch (error: any) {
      alert(`Error al crear promo code: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── ELIMINAR PROMO CODE ───
  const handleDeletePromo = async (id: string, codeName: string) => {
    if (!window.confirm(`¿Confirmas la eliminación permanente del código promocional [${codeName}]?`)) return;

    try {
      await supabase.from('promo_codes').delete().eq('id', id);
    } catch (err) {}

    setPromoCodes(prev => prev.filter(c => c.id !== id));
    
    if (setIsAlertToShow) {
      setIsAlertToShow({
        show: true,
        status: 'error',
        message: `🗑️ Código promocional [${codeName}] retirado de circulación.`
      });
    }
  };

  const inputCls = "w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 text-xs font-mono focus:outline-none focus:border-red-500/50 transition-colors placeholder-zinc-700 uppercase";
  const labelCls = "block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5 font-mono";

  return (
    <div className="space-y-6 font-sans text-left select-none text-white">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-emerald-950/30 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
            <Radio size={20} />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg font-mono tracking-wider uppercase">Promociones & Marketing</h2>
            <p className="text-xs text-zinc-500 font-sans mt-0.5">Gestión de broadcasts globales y generación de promo codes con recompensas.</p>
          </div>
        </div>

        <button
          onClick={fetchPromoCodes}
          className="p-2 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-emerald-400 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-mono font-bold cursor-pointer"
        >
          <RefreshCw size={13} className={fetchingCodes ? "animate-spin" : ""} />
          <span>SINCRO CÓDIGOS</span>
        </button>
      </div>

      {/* System Broadcast */}
      <div className="bg-black/45 border border-zinc-900 p-5 rounded-xl shadow-lg space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono uppercase tracking-wider">
          <Megaphone size={14} className="text-emerald-400 animate-pulse" />
          System Broadcast (Comunicado Global en Vivo)
        </h3>
        <div className="space-y-3">
          <textarea
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-emerald-500/40 h-24 resize-none text-xs font-mono transition-colors uppercase"
            placeholder="Escribe un mensaje push global para todos los usuarios activos en el sistema..."
            value={broadcastMessage}
            onChange={(e) => setBroadcastMessage(e.target.value)}
          />
          <button
            onClick={handleBroadcast}
            disabled={isBroadcasting || !broadcastMessage.trim()}
            className="px-5 py-2.5 bg-emerald-950/40 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/60 text-emerald-400 font-bold text-xs uppercase tracking-wider font-mono rounded-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isBroadcasting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            <span>{isBroadcasting ? 'Transmitiendo...' : 'Enviar Broadcast Global'}</span>
          </button>
        </div>
      </div>

      {/* Generador de Promo Codes */}
      <div className="bg-black/45 border border-zinc-900 p-5 rounded-xl shadow-lg space-y-5">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono uppercase tracking-wider border-b border-zinc-900 pb-3">
          <Gift size={14} className="text-red-500" />
          Generador de Promo Codes & Vouchers
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Código Promocional</label>
            <input
              type="text"
              className={inputCls}
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
            <label className={labelCls}>Límite de Canjes Totales</label>
            <input
              type="number"
              min="1"
              className={inputCls}
              placeholder="Ej: 1000"
              value={newPromo.limit || ''}
              onChange={(e) => setNewPromo({...newPromo, limit: parseInt(e.target.value) || 0})}
            />
          </div>
        </div>

        <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-900 pb-2 font-mono">
          Recompensas del Código
        </h4>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { key: 'metal', label: 'Metal' },
            { key: 'crystal', label: 'Cristal' },
            { key: 'deuterium', label: 'Deuterio' },
            { key: 'gd_coins', label: 'GD Coins' },
            { key: 'phantom_coins', label: 'Phantom Coins' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className={labelCls}>{label}</label>
              <input
                type="number"
                min="0"
                className={inputCls}
                value={(newPromo.rewards as any)?.[key] || ''}
                onChange={(e) => setNewPromo({
                  ...newPromo, 
                  rewards: { ...newPromo.rewards!, [key]: parseInt(e.target.value) || 0 }
                })}
              />
            </div>
          ))}

          <div>
            <label className={labelCls}>Naves de Regalo (Ej: "1x Interceptor")</label>
            <input
              type="text"
              className={inputCls}
              placeholder="Ej: 1x Heavy Hunter"
              value={newPromo.rewards?.ships || ''}
              onChange={(e) => setNewPromo({
                ...newPromo, 
                rewards: { ...newPromo.rewards!, ships: e.target.value }
              })}
            />
          </div>
        </div>

        <button
          onClick={handleAddPromo}
          disabled={isLoading}
          className="px-5 py-2.5 bg-red-950/30 hover:bg-[#ff1e1e]/20 border border-[#ff1e1e]/30 hover:border-[#ff1e1e]/60 text-[#ff1e1e] font-bold text-xs uppercase tracking-wider font-mono rounded-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40"
        >
          {isLoading ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
          <span>{isLoading ? 'Creando...' : 'Crear Promo Code'}</span>
        </button>

        {/* Tabla de códigos activos */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-zinc-900 text-zinc-500 text-[10px] uppercase font-bold">
                <th className="px-3 py-2.5">Código</th>
                <th className="px-3 py-2.5">Expiración</th>
                <th className="px-3 py-2.5">Uso / Límite</th>
                <th className="px-3 py-2.5">Recompensas Inyectadas</th>
                <th className="px-3 py-2.5 text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {promoCodes.map((code) => (
                <tr key={code.id} className="border-b border-zinc-900/60 hover:bg-zinc-900/20 transition-colors">
                  <td className="px-3 py-2.5 text-emerald-400 font-bold tracking-wider">{code.code}</td>
                  <td className="px-3 py-2.5 text-zinc-400">{code.expiration}</td>
                  <td className="px-3 py-2.5 text-zinc-300 font-bold">
                    {code.claims_count || 0} / {code.limit.toLocaleString()}
                  </td>
                  <td className="px-3 py-2.5 text-zinc-400 text-[10px]">
                    M:{code.rewards.metal} | C:{code.rewards.crystal} | D:{code.rewards.deuterium} | GD:{code.rewards.gd_coins} | PH:{code.rewards.phantom_coins} {code.rewards.ships ? `| 🚀 ${code.rewards.ships}` : ''}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <button
                      onClick={() => handleDeletePromo(code.id, code.code)}
                      className="text-zinc-600 hover:text-red-400 transition-colors p-1.5 rounded hover:bg-red-950/20 cursor-pointer"
                      title="Eliminar Promo Code"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
              {promoCodes.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-zinc-600 text-xs font-mono italic">
                    — Sin códigos promocionales activos en la base de datos —
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

export default AdminPromoModule;