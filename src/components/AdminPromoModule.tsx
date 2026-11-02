import React, { useState, useEffect, useMemo } from 'react';
import { 
  Gift, Tag, Radio, Plus, Trash2, Copy, CheckCircle2, 
  Clock, RefreshCw, Search, Send, Calendar, AlertTriangle, 
  Users, ToggleLeft, ToggleRight, Coins, Sparkles, X, ShieldAlert
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export interface PromoCode {
  id: string;
  code: string;
  description: string;
  reward_type: 'gd_coins' | 'phantom_coins' | 'materials_pack' | 'item';
  reward_amount: number;
  reward_item_id?: string;
  max_uses: number;
  current_uses: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

export interface PromoRedemptionLog {
  id: string;
  code: string;
  user_id: string;
  username?: string;
  reward_summary: string;
  claimed_at: string;
}

interface AdminPromoModuleProps {
  setIsAlertToShow?: (alert: { show: boolean; status: 'success' | 'error' | 'warning'; message: string }) => void;
}

export const AdminPromoModule: React.FC<AdminPromoModuleProps> = ({ setIsAlertToShow }) => {
  const [activeTab, setActiveTab] = useState<'promo_codes' | 'broadcast' | 'redemptions'>('promo_codes');
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [redemptions, setRedemptions] = useState<PromoRedemptionLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Formulario Nuevo Código
  const [newCode, setNewCode] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newRewardType, setNewRewardType] = useState<PromoCode['reward_type']>('phantom_coins');
  const [newRewardAmount, setNewRewardAmount] = useState<number>(1000);
  const [newRewardItemId, setNewRewardItemId] = useState<string>('qmp_repair_nano');
  const [newMaxUses, setNewMaxUses] = useState<number>(100);
  const [newExpiresDays, setNewExpiresDays] = useState<number>(7);
  const [isCreatingCode, setIsCreatingCode] = useState<boolean>(false);

  // Formulario Broadcast
  const [broadcastTitle, setBroadcastTitle] = useState<string>('');
  const [broadcastMessage, setBroadcastMessage] = useState<string>('');
  const [broadcastPriority, setBroadcastPriority] = useState<'info' | 'warning' | 'critical'>('info');
  const [broadcastDurationMinutes, setBroadcastDurationMinutes] = useState<number>(60);
  const [isSendingBroadcast, setIsSendingBroadcast] = useState<boolean>(false);
  const [activeBroadcastNotice, setActiveBroadcastNotice] = useState<any | null>(null);

  // Copiado rápido
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const fetchPromoData = async () => {
    setLoading(true);
    try {
      // 1. Cargar códigos promocionales
      const { data: codesData, error: codesErr } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (!codesErr && codesData) {
        setPromoCodes(codesData.map((c: any) => ({
          id: String(c.id),
          code: c.code || '',
          description: c.description || '',
          reward_type: c.reward_type || 'phantom_coins',
          reward_amount: Number(c.reward_amount) || 0,
          reward_item_id: c.reward_item_id || undefined,
          max_uses: Number(c.max_uses) || 0,
          current_uses: Number(c.current_uses) || 0,
          is_active: Boolean(c.is_active ?? true),
          expires_at: c.expires_at || null,
          created_at: c.created_at || new Date().toISOString()
        })));
      } else {
        setPromoCodes([]);
      }

      // 2. Cargar historial de canjes
      const { data: redData } = await supabase
        .from('promo_redemptions')
        .select('*')
        .order('claimed_at', { ascending: false })
        .limit(50);

      if (redData) {
        setRedemptions(redData.map((r: any) => ({
          id: String(r.id),
          code: r.code || r.promo_code || 'PROMO',
          user_id: r.user_id || 'N/A',
          username: r.username || `Piloto #${String(r.user_id).substring(0, 8)}`,
          reward_summary: r.reward_summary || 'Recompensa estándar',
          claimed_at: r.claimed_at || r.created_at || new Date().toISOString()
        })));
      }

      // 3. Consultar aviso de broadcast activo
      const { data: broadcastData } = await supabase
        .from('global_broadcasts')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (broadcastData) {
        setActiveBroadcastNotice(broadcastData);
      } else {
        setActiveBroadcastNotice(null);
      }
    } catch (e: any) {
      console.warn("Aviso al consultar promociones:", e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromoData();
  }, []);

  const handleGenerateRandomCode = () => {
    const prefixes = ['GD', 'VOID', 'NOVA', 'GALAXY', 'SOLAR'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const year = '2026';
    setNewCode(`${prefix}-${year}-${randomHex}`);
  };

  const handleCreatePromoCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim()) {
      alert("Introduce o genera un código de canje.");
      return;
    }

    setIsCreatingCode(true);
    try {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + Number(newExpiresDays || 7));

      const payload = {
        code: newCode.trim().toUpperCase(),
        description: newDescription.trim(),
        reward_type: newRewardType,
        reward_amount: Number(newRewardAmount) || 0,
        reward_item_id: newRewardType === 'item' ? newRewardItemId.trim() : null,
        max_uses: Number(newMaxUses) || 1,
        current_uses: 0,
        is_active: true,
        expires_at: expirationDate.toISOString(),
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('promo_codes')
        .insert([payload]);

      if (error) throw error;

      await supabase.from('maintenance_logs').insert([{
        action_type: `PROMO_CODE_CREATED_${payload.code}`,
        records_affected: 1,
        created_at: new Date().toISOString()
      }]);

      if (setIsAlertToShow) {
        setIsAlertToShow({
          show: true,
          status: 'success',
          message: `Código [${payload.code}] emitido y listo para canje.`
        });
      }

      setNewCode('');
      setNewDescription('');
      fetchPromoData();
    } catch (err: any) {
      alert(`Error al registrar cupón: ${err.message}`);
    } finally {
      setIsCreatingCode(false);
    }
  };

  const handleToggleCodeActive = async (id: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    try {
      const { error } = await supabase
        .from('promo_codes')
        .update({ is_active: nextStatus })
        .eq('id', id);

      if (error) throw error;

      setPromoCodes(prev => prev.map(c => c.id === id ? { ...c, is_active: nextStatus } : c));
    } catch (e: any) {
      alert(`Error al actualizar estado: ${e.message}`);
    }
  };

  const handleDeleteCode = async (id: string, codeStr: string) => {
    if (!window.confirm(`¿Confirmas la anulación y eliminación definitiva del código "${codeStr}"?`)) return;

    try {
      const { error } = await supabase
        .from('promo_codes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPromoCodes(prev => prev.filter(c => c.id !== id));
      if (setIsAlertToShow) {
        setIsAlertToShow({ show: true, status: 'success', message: `Código ${codeStr} eliminado.` });
      }
    } catch (e: any) {
      alert(`Error al eliminar: ${e.message}`);
    }
  };

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      alert("Completa el título y el cuerpo del mensaje de transmisión.");
      return;
    }

    setIsSendingBroadcast(true);
    try {
      const expires = new Date();
      expires.setMinutes(expires.getMinutes() + Number(broadcastDurationMinutes || 60));

      const payload = {
        title: broadcastTitle.trim(),
        message: broadcastMessage.trim(),
        priority: broadcastPriority,
        is_active: true,
        expires_at: expires.toISOString(),
        created_at: new Date().toISOString()
      };

      // Desactivar transmisiones anteriores
      await supabase
        .from('global_broadcasts')
        .update({ is_active: false })
        .eq('is_active', true);

      const { error } = await supabase
        .from('global_broadcasts')
        .insert([payload]);

      if (error) throw error;

      await supabase.from('maintenance_logs').insert([{
        action_type: `BROADCAST_SENT_${broadcastPriority.toUpperCase()}`,
        records_affected: 1,
        created_at: new Date().toISOString()
      }]);

      if (setIsAlertToShow) {
        setIsAlertToShow({
          show: true,
          status: 'success',
          message: `📢 Mensaje transmitido en vivo a todos los cuadrantes del juego.`
        });
      }

      setBroadcastTitle('');
      setBroadcastMessage('');
      fetchPromoData();
    } catch (err: any) {
      alert(`Error al emitir broadcast: ${err.message}`);
    } finally {
      setIsSendingBroadcast(false);
    }
  };

  const handleCancelBroadcast = async (broadcastId: string) => {
    try {
      await supabase
        .from('global_broadcasts')
        .update({ is_active: false })
        .eq('id', broadcastId);

      setActiveBroadcastNotice(null);
      if (setIsAlertToShow) {
        setIsAlertToShow({ show: true, status: 'success', message: 'Transmisión cancelada.' });
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const filteredPromoCodes = useMemo(() => {
    if (!searchTerm.trim()) return promoCodes;
    const term = searchTerm.toLowerCase();
    return promoCodes.filter(c => 
      c.code.toLowerCase().includes(term) ||
      c.description.toLowerCase().includes(term) ||
      c.reward_type.toLowerCase().includes(term)
    );
  }, [promoCodes, searchTerm]);

  return (
    <div className="space-y-6 font-mono text-xs text-left text-white select-none animate-fadeIn">
      {/* CABECERA */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Gift className="text-red-500 animate-pulse" size={18} />
            <h1 className="text-lg font-bold text-white uppercase tracking-wide">
              Centro de Códigos Promocionales & Transmisión Broadcast
            </h1>
          </div>
          <p className="text-xs text-zinc-500 font-sans mt-1">
            Emisión de cupones con recompensas directas y avisos globales emergentes a las dApps y ejecutables.
          </p>
        </div>

        <button
          onClick={fetchPromoData}
          className="px-3 py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 font-bold uppercase rounded-lg text-xs cursor-pointer flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Sincronizar
        </button>
      </div>

      {/* PESTAÑAS */}
      <div className="flex border-b border-zinc-900 gap-1 select-none">
        <button
          onClick={() => setActiveTab('promo_codes')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'promo_codes' ? 'bg-red-950/20 text-red-400 border-red-500' : 'text-zinc-500 border-transparent hover:text-zinc-300'
          }`}
        >
          <Tag size={13} /> Cupones & Códigos de Canje ({promoCodes.length})
        </button>

        <button
          onClick={() => setActiveTab('broadcast')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'broadcast' ? 'bg-cyan-950/20 text-cyan-400 border-cyan-500' : 'text-zinc-500 border-transparent hover:text-zinc-300'
          }`}
        >
          <Radio size={13} /> Transmisión Global (Broadcast)
        </button>

        <button
          onClick={() => setActiveTab('redemptions')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'redemptions' ? 'bg-amber-950/20 text-amber-400 border-amber-500' : 'text-zinc-500 border-transparent hover:text-zinc-300'
          }`}
        >
          <Users size={13} /> Historial de Reclamos ({redemptions.length})
        </button>
      </div>

      {/* TAB 1: CÓDIGOS DE CANJE */}
      {activeTab === 'promo_codes' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Creador de Códigos */}
          <form onSubmit={handleCreatePromoCode} className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-zinc-900 pb-2.5">
              <span className="text-xs font-bold uppercase text-red-500 flex items-center gap-1.5">
                <Plus size={14} /> Emitir Nuevo Código Promocional
              </span>

              <button
                type="button"
                onClick={handleGenerateRandomCode}
                className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-[9px] uppercase font-bold rounded cursor-pointer flex items-center gap-1"
              >
                <Sparkles size={11} className="text-amber-400" /> Generar Código Aleatorio
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div className="md:col-span-2">
                <label className="text-[9px] text-zinc-400 uppercase font-bold block mb-1">Código de Activación:</label>
                <input
                  type="text"
                  placeholder="Ej: GD-2026-TITAN"
                  value={newCode}
                  onChange={e => setNewCode(e.target.value.toUpperCase())}
                  className="w-full bg-black border border-zinc-800 p-2 rounded text-white font-bold uppercase text-xs outline-none focus:border-red-500"
                  required
                />
              </div>

              <div>
                <label className="text-[9px] text-zinc-400 uppercase font-bold block mb-1">Tipo de Recompensa:</label>
                <select
                  value={newRewardType}
                  onChange={e => setNewRewardType(e.target.value as any)}
                  className="w-full bg-black border border-zinc-800 p-2 rounded text-zinc-300 text-xs outline-none cursor-pointer"
                >
                  <option value="phantom_coins">👻 Phantom Coins</option>
                  <option value="gd_coins">🪙 GD Coins (USD)</option>
                  <option value="item">🎁 Módulo / Consumible</option>
                  <option value="materials_pack">📦 Pack de Materiales</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] text-zinc-400 uppercase font-bold block mb-1">
                  {newRewardType === 'item' ? 'ID del Ítem / Módulo' : 'Cantidad:'}
                </label>
                {newRewardType === 'item' ? (
                  <input
                    type="text"
                    value={newRewardItemId}
                    onChange={e => setNewRewardItemId(e.target.value)}
                    className="w-full bg-black border border-zinc-800 p-2 rounded text-white text-xs outline-none"
                    placeholder="qmp_repair_nano"
                  />
                ) : (
                  <input
                    type="number"
                    min={1}
                    value={newRewardAmount}
                    onChange={e => setNewRewardAmount(Number(e.target.value))}
                    className="w-full bg-black border border-zinc-800 p-2 rounded text-amber-400 font-bold text-xs outline-none"
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="text-[9px] text-zinc-400 uppercase font-bold block mb-1">Descripción del Evento / Motivo:</label>
                <input
                  type="text"
                  placeholder="Ej: Bonificación por apertura de temporada militar..."
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  className="w-full bg-black border border-zinc-800 p-2 rounded text-zinc-300 text-xs outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] text-zinc-400 uppercase font-bold block mb-1">Usos Máximos:</label>
                  <input
                    type="number"
                    min={1}
                    value={newMaxUses}
                    onChange={e => setNewMaxUses(Number(e.target.value))}
                    className="w-full bg-black border border-zinc-800 p-2 rounded text-white text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-zinc-400 uppercase font-bold block mb-1">Expira en (días):</label>
                  <input
                    type="number"
                    min={1}
                    value={newExpiresDays}
                    onChange={e => setNewExpiresDays(Number(e.target.value))}
                    className="w-full bg-black border border-zinc-800 p-2 rounded text-white text-xs outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isCreatingCode}
              className="w-full py-2.5 bg-red-650 hover:bg-red-600 disabled:opacity-40 text-white font-black uppercase rounded-lg text-xs cursor-pointer shadow-lg transition-all"
            >
              {isCreatingCode ? 'Emitiendo en Servidor...' : 'Crear & Habilitar Código de Canje'}
            </button>
          </form>

          {/* Listado de Códigos */}
          <div className="space-y-3">
            <div className="flex justify-between items-center bg-zinc-950 p-3 rounded-xl border border-zinc-900">
              <div className="relative w-72">
                <Search size={13} className="absolute left-3 top-2.5 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Buscar código o motivo..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-black border border-zinc-800 pl-9 pr-3 py-1.5 rounded text-white text-xs outline-none uppercase font-mono"
                />
              </div>

              <span className="text-[10px] text-zinc-500 uppercase font-bold">
                {filteredPromoCodes.length} Códigos Registrados
              </span>
            </div>

            {filteredPromoCodes.length === 0 ? (
              <div className="p-12 text-center text-zinc-600 border border-dashed border-zinc-900 rounded-xl">
                No hay códigos activos creados.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredPromoCodes.map(code => (
                  <div
                    key={code.id}
                    className={`p-4 rounded-xl border space-y-3 transition-all ${
                      code.is_active
                        ? 'bg-zinc-950 border-zinc-850 hover:border-zinc-750 shadow-xl'
                        : 'bg-zinc-950/40 border-zinc-900 opacity-60'
                    }`}
                  >
                    <div className="flex justify-between items-start border-b border-zinc-900 pb-2">
                      <div className="flex items-center gap-1.5">
                        <strong className="text-white text-xs font-mono font-bold tracking-wider">{code.code}</strong>
                        <button
                          onClick={() => handleCopyCode(code.id, code.code)}
                          className="p-1 text-zinc-500 hover:text-white cursor-pointer"
                          title="Copiar código"
                        >
                          {copiedCodeId === code.id ? <CheckCircle2 size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        </button>
                      </div>

                      <button
                        onClick={() => handleToggleCodeActive(code.id, code.is_active)}
                        className="cursor-pointer"
                        title={code.is_active ? 'Desactivar' : 'Activar'}
                      >
                        {code.is_active ? <ToggleRight size={24} className="text-emerald-500" /> : <ToggleLeft size={24} className="text-zinc-600" />}
                      </button>
                    </div>

                    <p className="text-[10px] text-zinc-400 font-sans line-clamp-2">
                      {code.description || 'Sin descripción registrada.'}
                    </p>

                    <div className="bg-black/60 p-2.5 rounded-lg border border-zinc-900 space-y-1 text-[10px]">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Recompensa:</span>
                        <strong className="text-amber-400 font-mono">
                          {code.reward_type === 'item' ? code.reward_item_id : `${code.reward_amount.toLocaleString('es-ES')} ${code.reward_type.toUpperCase()}`}
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Canjes:</span>
                        <span className="text-cyan-400 font-bold font-mono">{code.current_uses} / {code.max_uses}</span>
                      </div>
                      {code.expires_at && (
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Expira:</span>
                          <span className="text-zinc-400 font-mono text-[9px]">{new Date(code.expires_at).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => handleDeleteCode(code.id, code.code)}
                        className="text-zinc-600 hover:text-red-400 p-1 cursor-pointer transition-colors"
                        title="Eliminar código"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: BROADCAST GLOBAL */}
      {activeTab === 'broadcast' && (
        <div className="space-y-6 animate-fadeIn">
          {activeBroadcastNotice && (
            <div className={`p-4 rounded-xl border flex justify-between items-center ${
              activeBroadcastNotice.priority === 'critical'
                ? 'bg-red-950/30 border-red-500/60 shadow-lg shadow-red-950/40 text-red-300'
                : 'bg-cyan-950/30 border-cyan-500/60 text-cyan-300'
            }`}>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Radio size={14} className="animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">TRANSMISIÓN EN VIVO ACTIVA</span>
                </div>
                <strong className="text-white text-sm block">{activeBroadcastNotice.title}</strong>
                <p className="text-[11px] font-sans">{activeBroadcastNotice.message}</p>
                <span className="text-[9px] text-zinc-500 block font-mono">
                  Expira: {new Date(activeBroadcastNotice.expires_at).toLocaleTimeString()} UTC
                </span>
              </div>

              <button
                onClick={() => handleCancelBroadcast(activeBroadcastNotice.id)}
                className="px-3 py-1.5 bg-zinc-900 hover:bg-red-950 hover:text-red-400 border border-zinc-800 text-zinc-400 text-[10px] font-bold uppercase rounded cursor-pointer transition-colors"
              >
                Cerrar Transmisión
              </button>
            </div>
          )}

          <form onSubmit={handleSendBroadcast} className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4 shadow-xl">
            <span className="text-xs font-bold uppercase text-cyan-400 block border-b border-zinc-900 pb-2 flex items-center gap-1.5">
              <Send size={14} /> Nueva Emisión de Mensaje Emergente (In-Game Overlay)
            </span>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="md:col-span-2">
                <label className="text-[9px] text-zinc-400 uppercase font-bold block mb-1">Título de la Transmisión:</label>
                <input
                  type="text"
                  placeholder="Ej: ALERTA TÁCTICA: Apertura de Sector Oscuro"
                  value={broadcastTitle}
                  onChange={e => setBroadcastTitle(e.target.value)}
                  className="w-full bg-black border border-zinc-800 p-2 rounded text-white font-bold text-xs outline-none focus:border-cyan-500 uppercase"
                  required
                />
              </div>

              <div>
                <label className="text-[9px] text-zinc-400 uppercase font-bold block mb-1">Nivel de Prioridad:</label>
                <select
                  value={broadcastPriority}
                  onChange={e => setBroadcastPriority(e.target.value as any)}
                  className="w-full bg-black border border-zinc-800 p-2 rounded text-zinc-300 text-xs outline-none cursor-pointer"
                >
                  <option value="info">🔵 Informativo (Cyan)</option>
                  <option value="warning">🟡 Advertencia (Ámbar)</option>
                  <option value="critical">🔴 Crítico / Alerta Militar (Rojo)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[9px] text-zinc-400 uppercase font-bold block mb-1">Cuerpo del Comunicado:</label>
              <textarea
                rows={3}
                placeholder="Escribe el mensaje que verán los jugadores en sus pantallas..."
                value={broadcastMessage}
                onChange={e => setBroadcastMessage(e.target.value)}
                className="w-full bg-black border border-zinc-800 p-2 rounded text-white text-xs outline-none focus:border-cyan-500 font-sans"
                required
              />
            </div>

            <div>
              <label className="text-[9px] text-zinc-400 uppercase font-bold block mb-1">Duración en Pantalla (Minutos):</label>
              <input
                type="number"
                min={5}
                max={1440}
                value={broadcastDurationMinutes}
                onChange={e => setBroadcastDurationMinutes(Number(e.target.value))}
                className="w-48 bg-black border border-zinc-800 p-2 rounded text-cyan-300 font-bold text-xs outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSendingBroadcast}
              className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-black uppercase rounded-lg text-xs cursor-pointer shadow-lg transition-all"
            >
              {isSendingBroadcast ? 'Transmitiendo...' : 'Emitir Comunicado a Todo el Servidor'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: HISTORIAL DE RECLAMOS */}
      {activeTab === 'redemptions' && (
        <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4 shadow-xl animate-fadeIn">
          <span className="text-xs font-bold uppercase text-amber-400 block border-b border-zinc-900 pb-2">
            Bitácora de Códigos Canjeados Recientes ({redemptions.length})
          </span>

          {redemptions.length === 0 ? (
            <div className="p-12 text-center text-zinc-600 border border-dashed border-zinc-900 rounded-xl">
              No se han registrado canjes de cupones recientemente.
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
              {redemptions.map(r => (
                <div key={r.id} className="p-3 bg-black/60 border border-zinc-850 rounded-lg flex justify-between items-center text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-amber-950 text-amber-300 border border-amber-800 rounded font-bold text-[9px]">
                        {r.code}
                      </span>
                      <strong className="text-white">{r.username}</strong>
                    </div>
                    <span className="text-[9px] text-zinc-500 font-mono block mt-0.5">UID: {r.user_id}</span>
                  </div>

                  <div className="text-right">
                    <span className="text-emerald-400 font-bold block">{r.reward_summary}</span>
                    <span className="text-[8.5px] text-zinc-500">{new Date(r.claimed_at).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPromoModule;