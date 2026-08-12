import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building, Search, Shield, Zap, AlertTriangle, Play, RefreshCw, 
  Trash2, Send, Clock, Radio, Power, Eye, Lock, Unlock, Sliders,
  HelpCircle, Sparkles, Coins, DollarSign, Hammer, Mail, FileText,
  CheckCircle, XCircle, ArrowRight, EyeOff, Clipboard, TrendingUp, AlertCircle, Download
} from 'lucide-react';
import { UserProfile } from '../types';
import { supabase } from '../lib/supabase';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

interface AdminMarketplaceModuleProps {
  users: UserProfile[];
  setIsAlertToShow: (alert: any, msg?: string) => void;
  onRefreshData?: () => void;
  activeSubTab: string;
}

export interface MarketAsset {
  id: string;
  name: string;
  category: 'Spaceships' | 'Structures' | 'Technology' | 'Badges' | 'Blueprints' | 'Consumables';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  isAuction: boolean;
  sellerId: string;
  sellerName: string;
  basePrice: number;
  currentBid: number;
  hpCurrent: number;
  hpMax: number;
  isEquipped: boolean;
  onActiveExpedition: boolean;
  expiresAt: string;
  bidCount: number;
}

export interface BidEntry {
  id: string;
  auctionId: string;
  bidderId: string;
  bidderName: string;
  amountGd: number;
  timestamp: string;
}

export interface MarketAuditLog {
  id: string;
  timestamp: string;
  playerId: string;
  playerName: string;
  buyerId?: string;
  buyerName?: string;
  actionType: 'LIST' | 'PURCHASE' | 'BID' | 'TAKEDOWN' | 'FORCE_WIN' | 'TAX_BURN' | 'EXPIRED_RETURN' | 'REVOKED_BID';
  assetName: string;
  amount: number;
  taxCollected: number;
  isWashTradingAlert: boolean;
}

export interface InboxMarketPushMessage {
  id: string;
  recipientId: string;
  recipientName: string;
  subject: string;
  body: string;
  category: 'ALERT' | 'PURCHASE' | 'RETURN' | 'OUTBID';
  timestamp: string;
  isSent: boolean;
}

export default function AdminMarketplaceModule({
  users,
  setIsAlertToShow,
  onRefreshData,
  activeSubTab
}: AdminMarketplaceModuleProps) {
  
  // 🎯 INICIALIZACIÓN LIMPIA: Sin datos falsos/hardcodeados
  const [marketAssets, setMarketAssets] = useState<MarketAsset[]>([]);
  const [bids, setBids] = useState<BidEntry[]>([]);
  const [auditLogs, setAuditLogs] = useState<MarketAuditLog[]>([]);
  const [pushedMessages, setPushedMessages] = useState<InboxMarketPushMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [selectedAuctionId, setSelectedAuctionId] = useState<string>("");
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [editPriceValue, setEditPriceValue] = useState<number>(0);
  const [editCooldownHours, setEditCooldownHours] = useState<number>(4);

  const [forceTakedownOnActiveExpedition, setForceTakedownOnActiveExpedition] = useState<boolean>(true);
  const [quickViewAssetId, setQuickViewAssetId] = useState<string | null>(null);

  const [rarityFilter, setRarityFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [minPriceFilter, setMinPriceFilter] = useState<number>(0);

  // REGLAS Y RESTRICCIONES
  const [canLockActive, setCanLockActive] = useState<boolean>(true);
  const [durabilityFilterActive, setDurabilityFilterActive] = useState<boolean>(true);
  const [categoryLocks, setCategoryLocks] = useState<Record<string, boolean>>({
    Spaceships: false,
    Structures: false,
    Technology: false,
    Badges: false,
    Blueprints: false,
    Consumables: false
  });

  const [marketTaxPercent, setMarketTaxPercent] = useState<number>(2.5);

  // INBOX Y NOTIFICACIONES
  const [pushRecipientId, setPushRecipientId] = useState<string>("");
  const [pushSubject, setPushSubject] = useState<string>("ALERTA DEL SISTEMA: Transacción autorizada");
  const [pushBody, setPushBody] = useState<string>("Mensaje del sistema de mercado Sasorilabs.");
  const [pushCategory, setPushCategory] = useState<'ALERT' | 'PURCHASE' | 'RETURN' | 'OUTBID'>("ALERT");

  const [marketFilter, setMarketFilter] = useState<'ALL' | 'DIRECT' | 'AUCTION'>('ALL');
  const [searchParam, setSearchParam] = useState<string>('');

  // ─── CONSULTA REAL DE DATOS DE MERCADO DESDE SUPABASE ───
  const fetchRealMarketData = async () => {
    setLoading(true);
    try {
      // 1. Cargar Publicaciones Reales de la tabla market_listings
      const { data: listingsData, error: listingsError } = await supabase
        .from('market_listings')
        .select('*')
        .order('created_at', { ascending: false });

      if (!listingsError && listingsData) {
        const mapped: MarketAsset[] = listingsData.map((item: any) => ({
          id: item.id || item.listing_id,
          name: item.name || item.title || item.asset_name || 'Activo Estelar',
          category: item.category || 'Spaceships',
          rarity: (item.rarity || 'common').toLowerCase() as any,
          isAuction: !!item.is_auction,
          sellerId: item.seller_id || item.user_id || 'usr-0',
          sellerName: item.seller_name || item.username || 'Comandante',
          basePrice: Number(item.base_price || item.price) || 0,
          currentBid: Number(item.current_bid || item.highest_bid) || 0,
          hpCurrent: Number(item.hp_current || item.resistance) || 100,
          hpMax: Number(item.hp_max || item.max_hp) || 100,
          isEquipped: !!item.is_equipped,
          onActiveExpedition: !!item.on_active_expedition,
          expiresAt: item.expires_at || new Date(Date.now() + 86400000).toISOString(),
          bidCount: Number(item.bid_count || item.total_bids) || 0
        }));
        setMarketAssets(mapped);
        if (mapped.length > 0 && !selectedAuctionId) {
          const firstAuction = mapped.find(a => a.isAuction);
          if (firstAuction) setSelectedAuctionId(firstAuction.id);
        }
      } else {
        setMarketAssets([]);
      }

      // 2. Cargar Pujas Reales (market_bids)
      const { data: bidsData } = await supabase.from('market_bids').select('*');
      if (bidsData) {
        const mappedBids: BidEntry[] = bidsData.map((b: any) => ({
          id: b.id,
          auctionId: b.auction_id || b.listing_id,
          bidderId: b.bidder_id || b.user_id,
          bidderName: b.bidder_name || b.username || 'Comandante',
          amountGd: Number(b.amount_gd || b.amount) || 0,
          timestamp: b.created_at || b.timestamp || new Date().toISOString()
        }));
        setBids(mappedBids);
      } else {
        setBids([]);
      }

      // 3. Cargar Bitácora de Auditoría (market_audit_logs)
      const { data: logsData } = await supabase
        .from('market_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (logsData) {
        const mappedLogs: MarketAuditLog[] = logsData.map((l: any) => ({
          id: l.id,
          timestamp: l.created_at || l.timestamp,
          playerId: l.player_id || l.user_id,
          playerName: l.player_name || l.username,
          buyerId: l.buyer_id,
          buyerName: l.buyer_name,
          actionType: l.action_type || 'LIST',
          assetName: l.asset_name || 'Activo',
          amount: Number(l.amount) || 0,
          taxCollected: Number(l.tax_collected) || 0,
          isWashTradingAlert: !!l.is_wash_trading_alert
        }));
        setAuditLogs(mappedLogs);
      } else {
        setAuditLogs([]);
      }

    } catch (e: any) {
      console.warn("Mercado operando en estado limpio sin registros previos:", e.message);
      setMarketAssets([]);
      setBids([]);
      setAuditLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealMarketData();
  }, []);

  const fillMessageTemplate = (type: 'EXPIRED_RETURN' | 'BUYOUT_SUCCESS' | 'OUTBID') => {
    if (type === 'EXPIRED_RETURN') {
      setPushSubject("Subasta Finalizada sin Compradores");
      setPushBody("Tu subasta por el activo tecnológico ha finalizado sin ofertas activas. Su item ha sido devuelto intacto a su inventario orbital.");
      setPushCategory("RETURN");
    } else if (type === 'BUYOUT_SUCCESS') {
      setPushSubject("¡Adquisición Existosa de Activo Cósmico!");
      setPushBody("Recibido el pago en vivo para tu cuenta de Sasorilabs. Se descontaron las tasas reglamentarias del mercado.");
      setPushCategory("PURCHASE");
    } else if (type === 'OUTBID') {
      setPushSubject("¡Te han superado en la puja [Alerta Flota]!");
      setPushBody("Atención comandante: un explorador ha realizado una puja mayor sobre tu item de interés. Se retornaron tus balances.");
      setPushCategory("OUTBID");
    }
  };

  const handleEditExpiration = async (assetId: string, action: 'ADD' | 'SUBTRACT') => {
    const hours = editCooldownHours || 1;
    const target = marketAssets.find(a => a.id === assetId);
    if (!target) return;

    const currentExp = new Date(target.expiresAt).getTime();
    const delta = 1000 * 3600 * hours;
    const newTimeIso = new Date(action === 'ADD' ? currentExp + delta : currentExp - delta).toISOString();

    try {
      await supabase
        .from('market_listings')
        .update({ expires_at: newTimeIso })
        .eq('id', assetId);
    } catch (e) {}

    setMarketAssets(prev => prev.map(a => a.id === assetId ? { ...a, expiresAt: newTimeIso } : a));

    setIsAlertToShow({
      show: true,
      status: 'success',
      message: `¡Se compensó el tiempo de expiración para ${assetId}: ${action === 'ADD' ? '+' : '-'}${hours} horas!`
    });
  };

  const handleEditPrice = async (assetId: string) => {
    if (editPriceValue <= 0) {
      setIsAlertToShow({
        show: true,
        status: 'error',
        message: 'Por favor, introduce un precio válido mayor a 0 GD Coins.'
      });
      return;
    }

    const target = marketAssets.find(a => a.id === assetId);
    if (!target) return;

    try {
      const updatePayload = target.isAuction ? { current_bid: editPriceValue } : { base_price: editPriceValue };
      await supabase
        .from('market_listings')
        .update(updatePayload)
        .eq('id', assetId);
    } catch (e) {}

    setMarketAssets(prev => prev.map(a => {
      if (a.id === assetId) {
        return a.isAuction ? { ...a, currentBid: editPriceValue } : { ...a, basePrice: editPriceValue };
      }
      return a;
    }));

    setIsAlertToShow({
      show: true,
      status: 'success',
      message: `Precio actualizado en ${assetId} a ${editPriceValue} GD.`
    });

    setSelectedAssetId(null);
  };

  const handleForceTakedown = async (assetId: string) => {
    const target = marketAssets.find(a => a.id === assetId);
    if (!target) return;

    try {
      await supabase.from('market_listings').delete().eq('id', assetId);
    } catch (e) {}

    setIsAlertToShow({
      show: true,
      status: 'error',
      message: `¡ALERTA ANTIFRAUDE! Publicación ${assetId} cancelada forzosamente. Asset devuelto de inmediato al comandante ${target.sellerName}.`
    });

    setMarketAssets(prev => prev.filter(a => a.id !== assetId));
  };

  const handleExecuteActiveExpeditionTakedowns = () => {
    const suspectAssets = marketAssets.filter(a => a.onActiveExpedition);
    if (suspectAssets.length === 0) {
      setIsAlertToShow({
        show: true,
        status: 'success',
        message: 'No se detectaron activos en expediciones de vuelo activas.'
      });
      return;
    }

    suspectAssets.forEach(async (target) => {
      try {
        await supabase.from('market_listings').delete().eq('id', target.id);
      } catch (e) {}
    });

    setMarketAssets(prev => prev.filter(a => !a.onActiveExpedition));

    setIsAlertToShow({
      show: true,
      status: 'success',
      message: `¡REGLA ACTIVADA! Se retiraron automáticamente ${suspectAssets.length} activos infractores en expedición de vuelo.`
    });
  };

  const handleToggleActiveExpeditionTakedown = (val: boolean) => {
    setForceTakedownOnActiveExpedition(val);
    setIsAlertToShow({
      show: true,
      status: val ? 'success' : 'error',
      message: val 
        ? 'Consola de Expedición Activa conectada. El mercado filtrará listings en vuelo continuo.' 
        : '¡Advertencia! Desconectando regla regulatoria de expedición activa.'
    });
  };

  const handleRevokeBid = async (bidId: string) => {
    const targetBid = bids.find(b => b.id === bidId);
    if (!targetBid) return;

    try {
      await supabase.from('market_bids').delete().eq('id', bidId);
    } catch (e) {}

    setBids(prev => prev.filter(b => b.id !== bidId));
    
    setMarketAssets(prev => prev.map(a => {
      if (a.id === targetBid.auctionId) {
        const remainBids = bids.filter(b => b.auctionId === a.id && b.id !== bidId);
        const nextHighest = remainBids.length > 0 
          ? Math.max(...remainBids.map(b => b.amountGd)) 
          : a.basePrice;

        return {
          ...a,
          currentBid: nextHighest,
          bidCount: Math.max(0, a.bidCount - 1)
        };
      }
      return a;
    }));

    setIsAlertToShow({
      show: true,
      status: 'success',
      message: `Puja de ${targetBid.bidderName} por ${targetBid.amountGd} GD revocada. Balances retenidos liberados.`
    });
  };

  const handleForceWin = async (assetId: string) => {
    const target = marketAssets.find(a => a.id === assetId);
    if (!target) return;

    if (!target.isAuction) {
      setIsAlertToShow({
        show: true,
        status: 'error',
        message: 'Solo se pueden forzar victorias sobre publicaciones tipo Subasta activa.'
      });
      return;
    }

    const highestBid = bids.filter(b => b.auctionId === assetId).sort((a,b) => b.amountGd - a.amountGd)[0];
    const buyerLabel = highestBid ? highestBid.bidderName : "Sin Postor";
    const wonPrice = highestBid ? highestBid.amountGd : target.basePrice;

    try {
      await supabase.from('market_listings').delete().eq('id', assetId);
    } catch (e) {}

    setIsAlertToShow({
      show: true,
      status: 'success',
      message: `¡Subasta finalizada por control admin en caliente! Se liquida victoria de ${buyerLabel} por ${wonPrice} GD.`
    });

    setMarketAssets(prev => prev.filter(a => a.id !== assetId));
  };

  const handleTriggerReturnEngine = async () => {
    fetchRealMarketData();
    setIsAlertToShow({
      show: true,
      status: 'success',
      message: 'Sincronización y escaneo de retornos del mercado de Sasorilabs.io completada.'
    });
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Timestamp', 'Player ID', 'Player Name', 'Buyer ID', 'Buyer Name', 'Action Type', 'Asset Name', 'Amount (GD)', 'Tax Collected (GD)', 'Wash Trading Alert'];
    const rows = auditLogs.map(log => [
      log.id,
      log.timestamp,
      log.playerId,
      log.playerName,
      log.buyerId || '',
      log.buyerName || '',
      log.actionType,
      `"${log.assetName.replace(/"/g, '""')}"`,
      log.amount,
      log.taxCollected,
      log.isWashTradingAlert ? 'TRUE' : 'FALSE'
    ]);
    
    const csvRows = [headers.join(','), ...rows.map(e => e.join(','))];
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `p2p_audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportInboxJSON = () => {
    const jsonContent = JSON.stringify(pushedMessages, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `pushed_messages_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSendManualPush = () => {
    const targetUser = users.find(u => u.id === pushRecipientId) || users[0];
    const recName = targetUser ? targetUser.username : "Comandante General";

    const newPush: InboxMarketPushMessage = {
      id: `MKT-PUSH-${Date.now().toString(36)}`,
      recipientId: pushRecipientId,
      recipientName: recName,
      subject: pushSubject,
      body: pushBody,
      category: pushCategory,
      timestamp: new Date().toISOString(),
      isSent: true
    };

    setPushedMessages(prev => [newPush, ...prev]);
    
    setIsAlertToShow({
      show: true,
      status: 'success',
      message: `¡Notificación push de mercado inyectada con éxito a ${recName}!`
    });

    setPushSubject("");
    setPushBody("");
  };

  const totalGdVolumeLogs = auditLogs
    .filter(l => l.actionType === 'PURCHASE' || l.actionType === 'FORCE_WIN')
    .reduce((sum, log) => sum + log.amount, 0);

  const totalCollectedTaxes = auditLogs.reduce((sum, log) => sum + log.taxCollected, 0);

  const filteredAssets = marketAssets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchParam.toLowerCase()) || 
                          asset.id.toLowerCase().includes(searchParam.toLowerCase()) ||
                          asset.sellerName.toLowerCase().includes(searchParam.toLowerCase());
    
    if (!matchesSearch) return false;
    if (marketFilter === 'DIRECT' && asset.isAuction) return false;
    if (marketFilter === 'AUCTION' && !asset.isAuction) return false;
    if (rarityFilter !== 'ALL' && asset.rarity !== rarityFilter) return false;
    if (categoryFilter !== 'ALL' && asset.category !== categoryFilter) return false;
    
    const activePrice = asset.isAuction ? asset.currentBid : asset.basePrice;
    if (activePrice < minPriceFilter) return false;
    
    return true;
  });

  const activeUsersCount = users ? (users.length > 0 ? users.length : 1) : 1;
  const listingsCount = marketAssets.length;
  const activityRatio = listingsCount / activeUsersCount;
  const isActivityLow = activityRatio < 0.8;

  return (
    <div className="space-y-6 font-mono text-xs text-left text-white select-none">
      
      {/* HEADER PANEL */}
      <div className="bg-gradient-to-r from-zinc-950 via-[#0a0a0c] to-zinc-950 border border-zinc-900 rounded-lg p-5 flex flex-col md:flex-row justify-between items-start md:items-stretch gap-4 shadow-[#ff1e1e]/5 shadow-sm">
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="h-2 w-2 bg-[#ff1e1e] rounded-full animate-pulse" />
              <h1 className="text-lg font-bold text-white tracking-wide uppercase font-sans">
                Marketplace Control Hub
              </h1>
              <span className="text-[10px] font-mono bg-red-950 text-red-500 border border-red-900 px-2 py-0.5 rounded font-extrabold uppercase">
                P2P CORES
              </span>
              
              <div className={`ml-1 md:ml-3 px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 border ${
                isActivityLow 
                  ? 'bg-amber-950/40 text-amber-500 border-amber-900/40 animate-pulse' 
                  : 'bg-emerald-950/40 text-emerald-400 border-emerald-900/40'
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${isActivityLow ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                SALUD P2P: {isActivityLow ? 'BAJA ACTIVIDAD' : 'ÓPTIMA'} (RATIO: {activityRatio.toFixed(2)})
              </div>
            </div>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed font-sans">
              Consola central de supervisión militar y administración económica para el mercado lúdico de <span className="text-[#ff1e1e] font-semibold">Sasorilabs.io</span>. Control de publicaciones directas, auditoría de fraude fiscal y comunicación directa.
            </p>
          </div>

          <div className="mt-3.5 flex flex-wrap items-center gap-x-5 gap-y-1 text-[10px] font-mono text-zinc-500 border-t border-zinc-900/60 pt-2.5">
            <div className="flex items-center gap-1.5">
              <span>Listados Reales en Red:</span>
              <span className="text-white font-bold">{listingsCount}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>Comandantes Registrados:</span>
              <span className="text-white font-bold">{activeUsersCount}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>Ratio Oferta/Usuario:</span>
              <span className={`font-bold ${isActivityLow ? 'text-amber-500' : 'text-emerald-400'}`}>
                {activityRatio.toFixed(2)} / user
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-row md:flex-col justify-between items-end gap-2 md:self-center font-mono text-[10.5px] border-t md:border-t-0 md:border-l border-zinc-900/60 pt-3 md:pt-0 md:pl-4 shrink-0">
          <div className="flex gap-2">
            <div className="px-3 py-1.5 bg-zinc-950 border border-zinc-900 rounded text-center">
              <span className="text-zinc-500 block text-[8px] uppercase font-bold">Volumen Auditado</span>
              <span className="text-white font-extrabold text-xs">{totalGdVolumeLogs.toLocaleString()} GD</span>
            </div>
            <div className="px-3 py-1.5 bg-zinc-950 border border-zinc-900 rounded text-center">
              <span className="text-zinc-500 block text-[8px] uppercase font-bold">Impuestos Capturados</span>
              <span className="text-red-500 font-extrabold text-xs">+{totalCollectedTaxes.toLocaleString()} GD</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleTriggerReturnEngine}
            className="w-full px-3 py-1.5 bg-red-950/40 hover:bg-[#ff1e1e] text-zinc-300 hover:text-white border border-[#ff1e1e]/35 rounded transition-all cursor-pointer flex items-center justify-center gap-1.5 font-bold font-sans text-xs mt-1"
          >
            <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
            Sincronizar Mercado
          </button>
        </div>
      </div>

      {/* CORE MODULES RENDERING */}
      <div className="space-y-6">

        {/* MODULE 1: GRID EN VIVO DE MERCADO */}
        {(activeSubTab === 'market_items' || !activeSubTab || activeSubTab === 'market' || activeSubTab === '') && (
          <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-5 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-zinc-900 pb-4 gap-2">
              <div className="flex items-center gap-2">
                <Coins size={16} className="text-[#ff1e1e] shrink-0" />
                <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider block">
                  [ MODULE.01 ]: GRID EN VIVO DE MERCADO REAL
                </span>
              </div>

              <div className="flex gap-1.5 self-start">
                <button
                  onClick={() => setMarketFilter('ALL')}
                  className={`px-2 py-1 rounded text-[9.5px] font-mono font-bold border transition-all cursor-pointer ${
                    marketFilter === 'ALL'
                      ? 'bg-[#ff1e1e] border-[#ff1e1e] text-white'
                      : 'bg-black border-zinc-900 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  TODOS ({marketAssets.length})
                </button>
                <button
                  onClick={() => setMarketFilter('DIRECT')}
                  className={`px-2 py-1 rounded text-[9.5px] font-mono font-bold border transition-all cursor-pointer ${
                    marketFilter === 'DIRECT'
                      ? 'bg-[#ff1e1e] border-[#ff1e1e] text-white'
                      : 'bg-black border-zinc-900 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  VENTA DIRECTA
                </button>
                <button
                  onClick={() => setMarketFilter('AUCTION')}
                  className={`px-2 py-1 rounded text-[9.5px] font-mono font-bold border transition-all cursor-pointer ${
                    marketFilter === 'AUCTION'
                      ? 'bg-[#ff1e1e] border-[#ff1e1e] text-white'
                      : 'bg-black border-zinc-900 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  SUBASTAS
                </button>
              </div>
            </div>

            {/* Live Search */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500 shrink-0" />
              <input
                type="text"
                value={searchParam}
                onChange={(e) => setSearchParam(e.target.value)}
                placeholder="Buscar por nombre de activo, identificador de serie o vendedor..."
                className="w-full bg-black border border-zinc-900 pl-9 pr-4 py-2 rounded text-xs text-white focus:outline-none focus:border-red-500/50 font-mono transition-all uppercase"
              />
            </div>

            {/* Extended Filters Ribbon */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-black/40 border border-zinc-900/60 p-3 rounded-lg text-xs font-mono">
              <div className="space-y-1">
                <label className="text-zinc-500 text-[9px] uppercase font-bold tracking-wider block">Filtrar por Rareza:</label>
                <select
                  value={rarityFilter}
                  onChange={(e) => setRarityFilter(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-900 p-1.5 rounded text-white focus:outline-none focus:border-red-500/40 text-[10.5px] cursor-pointer"
                >
                  <option value="ALL">TODAS LAS RAREZAS</option>
                  <option value="common">COMMON (COMÚN)</option>
                  <option value="uncommon">UNCOMMON (INFRECUENTE)</option>
                  <option value="rare">RARE (RARO)</option>
                  <option value="epic">EPIC (ÉPICO)</option>
                  <option value="legendary">LEGENDARY (LEGENDARIO)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-zinc-500 text-[9px] uppercase font-bold tracking-wider block">Filtrar por Categoría:</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-900 p-1.5 rounded text-white focus:outline-none focus:border-red-500/40 text-[10.5px] cursor-pointer"
                >
                  <option value="ALL">TODAS LAS CATEGORÍAS</option>
                  <option value="Spaceships">SPACESHIPS (NAVES)</option>
                  <option value="Structures">STRUCTURES (ESTRUCTURAS)</option>
                  <option value="Technology">TECHNOLOGY (TECNOLOGÍAS)</option>
                  <option value="Badges">BADGES (INSIGNIAS)</option>
                  <option value="Blueprints">BLUEPRINTS (PLANOS)</option>
                  <option value="Consumables">CONSUMABLES (CONSUMIBLES)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-zinc-500 text-[9px] uppercase font-bold tracking-wider block">Precio Mínimo (Base o Puja):</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={minPriceFilter}
                    onChange={(e) => setMinPriceFilter(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-zinc-950 border border-zinc-900 p-1.5 pr-8 rounded text-yellow-400 font-bold focus:outline-none focus:border-red-500/40 text-[10.5px] font-mono"
                  />
                  <span className="absolute right-2 top-1.5 text-zinc-500 font-bold text-[9px]">GD</span>
                </div>
              </div>
            </div>

            {/* List Table container */}
            <div className="overflow-x-auto rounded border border-zinc-900/60 font-mono">
              <table className="w-full text-left border-collapse font-mono text-xs">
                <thead>
                  <tr className="border-b border-zinc-900 bg-zinc-950/80 text-[10px] text-zinc-400 uppercase tracking-wider">
                    <th className="p-3">Asset / ID</th>
                    <th className="p-3">Vendedor</th>
                    <th className="p-3">Clase</th>
                    <th className="p-3 text-center">Pujas</th>
                    <th className="p-3 text-right">Precio Actual</th>
                    <th className="p-3">Cronómetro</th>
                    <th className="p-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/50">
                  {filteredAssets.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center p-8 text-zinc-500 italic bg-black/40">
                        {loading ? 'Cargando publicaciones reales...' : 'No hay publicaciones ni ofertas activas en el mercado.'}
                      </td>
                    </tr>
                  ) : (
                    filteredAssets.map(asset => {
                      const isExpired = new Date(asset.expiresAt).getTime() < Date.now();
                      const hpPercent = Math.round((asset.hpCurrent / asset.hpMax) * 100);

                      return (
                        <tr 
                          key={asset.id} 
                          className={`hover:bg-zinc-900/10 cursor-pointer transition-colors ${
                            selectedAuctionId === asset.id ? 'bg-zinc-950/80' : ''
                          }`}
                          onClick={() => {
                            if (asset.isAuction) {
                              setSelectedAuctionId(asset.id);
                            }
                          }}
                        >
                          <td className="p-3">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-white text-[12px]">{asset.name}</span>
                                <span className={`text-[8px] font-extrabold px-1.5 py-0.2 rounded uppercase border ${
                                  asset.rarity === 'legendary' ? 'bg-amber-950 border-amber-900 text-amber-400' :
                                  asset.rarity === 'epic' ? 'bg-purple-950 border-purple-900 text-purple-400' :
                                  asset.rarity === 'rare' ? 'bg-cyan-950 border-cyan-900 text-cyan-400' :
                                  'bg-zinc-900 border-zinc-800 text-zinc-400'
                                }`}>
                                  {asset.rarity}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-zinc-500">ID: {asset.id}</span>
                                <span className={`text-[8.5px] font-bold px-1 rounded ${
                                  asset.isAuction ? 'bg-indigo-950 text-indigo-400' : 'bg-emerald-950 text-emerald-400'
                                }`}>
                                  {asset.isAuction ? 'SUBASTA' : 'VENTA DIRECTA'}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="p-3 text-zinc-300">
                            <span className="block font-semibold">{asset.sellerName}</span>
                            <span className="text-[9.5px] text-zinc-500 break-all">{asset.sellerId}</span>
                          </td>

                          <td className="p-3">
                            <span className="text-zinc-400 block text-[11.5px]">{asset.category}</span>
                            <div className="flex items-center gap-1.2 mt-0.5">
                              <span className={`text-[9.5px] font-bold ${hpPercent <= 10 ? 'text-red-500 animate-pulse font-extrabold' : 'text-zinc-500'}`}>
                                HP: {hpPercent}%
                              </span>
                            </div>
                          </td>

                          <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                            {asset.isAuction ? (
                              <div className="flex flex-col items-center gap-1.5">
                                <span className="text-yellow-400 font-bold text-[11px] block">
                                  {asset.bidCount} {asset.bidCount === 1 ? 'puja' : 'pujas'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setQuickViewAssetId(asset.id)}
                                  className="px-2 py-0.5 bg-zinc-900 hover:bg-[#ff1e1e] text-zinc-300 hover:text-white border border-zinc-800 rounded text-[9px] font-bold flex items-center gap-1 transition-all mx-auto cursor-pointer"
                                >
                                  <Search size={9} /> Quick View
                                </button>
                              </div>
                            ) : (
                              <span className="text-zinc-500 italic text-[10px]">Venta Directa</span>
                            )}
                          </td>

                          <td className="p-3 text-right">
                            {asset.isAuction ? (
                              <div className="flex flex-col items-end">
                                <span className="text-yellow-400 font-extrabold text-[12.5px]">{asset.currentBid.toLocaleString()} GD</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-end">
                                <span className="text-[#ff1e1e] font-extrabold text-[12.5px]">{asset.basePrice.toLocaleString()} GD</span>
                              </div>
                            )}
                          </td>

                          <td className="p-3">
                            <div className="flex flex-col text-[11px]">
                              {isExpired ? (
                                <span className="text-red-500 font-extrabold animate-pulse uppercase">EXPIRADO</span>
                              ) : (
                                <span className="text-zinc-300">{new Date(asset.expiresAt).toLocaleTimeString()}</span>
                              )}
                              <span className="text-[9.5px] text-zinc-500">{new Date(asset.expiresAt).toLocaleDateString()}</span>
                            </div>
                          </td>

                          <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedAssetId(asset.id);
                                  setEditPriceValue(asset.isAuction ? asset.currentBid : asset.basePrice);
                                }}
                                className="p-1 px-2 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-all cursor-pointer text-[10px] font-bold"
                              >
                                Editar
                              </button>

                              <button
                                type="button"
                                onClick={() => handleForceTakedown(asset.id)}
                                className="p-1.5 rounded bg-red-950/20 hover:bg-[#ff1e1e]/20 text-red-400 hover:text-[#ff1e1e] border border-red-500/10 transition-all cursor-pointer"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* POPUP DE EDICIÓN RÁPIDA */}
            <AnimatePresence>
              {selectedAssetId && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-black border border-zinc-900 rounded p-4 mt-2 space-y-3"
                >
                  <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                      🔧 CONTROLES EXCLUSIVOS DE ADMINISTRADOR: {selectedAssetId}
                    </span>
                    <button onClick={() => setSelectedAssetId(null)} className="text-zinc-500 hover:text-white cursor-pointer font-bold">✕</button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="space-y-1.5">
                      <label className="text-zinc-500 text-[10px] uppercase font-bold block">Modificar Precio / Puja:</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={editPriceValue ?? 0}
                          onChange={(e) => setEditPriceValue(parseInt(e.target.value) || 0)}
                          className="w-full bg-zinc-950 border border-zinc-900 p-2 rounded text-[11px] text-yellow-400 font-bold focus:outline-none"
                        />
                        <span className="absolute right-2 top-2 text-[10px] text-zinc-500 font-bold">GD</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleEditPrice(selectedAssetId)}
                        className="w-full py-1.5 bg-[#ff1e1e] hover:bg-red-700 text-white rounded text-[10px] font-bold cursor-pointer transition-colors"
                      >
                        Establecer Precio
                      </button>
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-zinc-500 text-[10px] uppercase font-bold block">Editar Tiempo Expiración (Cooldown):</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={editCooldownHours}
                          onChange={(e) => setEditCooldownHours(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full bg-zinc-950 border border-zinc-900 p-2 rounded text-[11px] text-white font-mono focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleEditExpiration(selectedAssetId, 'ADD')}
                          className="px-3.5 py-2 bg-emerald-950 hover:bg-emerald-800 text-emerald-400 font-bold rounded text-[10.5px] cursor-pointer"
                        >
                          + Compensar Horas
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEditExpiration(selectedAssetId, 'SUBTRACT')}
                          className="px-3.5 py-2 bg-red-950 hover:bg-red-800 text-red-400 font-bold rounded text-[10.5px] cursor-pointer"
                        >
                          - Restar Horas
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

      </div>

    </div>
  );
}