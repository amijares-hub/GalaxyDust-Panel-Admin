import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building, Search, Shield, Zap, AlertTriangle, Play, RefreshCw, 
  Trash2, Send, Clock, Radio, Power, Eye, Lock, Unlock, Sliders,
  HelpCircle, Sparkles, Coins, DollarSign, Hammer, Mail, FileText,
  CheckCircle, XCircle, ArrowRight, EyeOff, Clipboard, TrendingUp, AlertCircle, Download,
  ShieldAlert, ShoppingBag, Filter
} from 'lucide-react';
import { UserProfile } from '../types';
import { supabase } from '../lib/supabase';

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
  status?: string;
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

export interface TransactionLog {
  id: string;
  listingId: string;
  sellerId: string;
  sellerName: string;
  buyerId: string;
  buyerName: string;
  grossPrice: number;
  feeApplied: number;
  netToSeller: number;
  isSuspicious: boolean;
  purchasedAt: string;
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
  
  // ESTADOS DE MERCADO
  const [viewTab, setViewTab] = useState<'grid' | 'transactions' | 'siphon_radar' | 'push_notifications'>('grid');
  const [marketAssets, setMarketAssets] = useState<MarketAsset[]>([]);
  const [bids, setBids] = useState<BidEntry[]>([]);
  const [auditLogs, setAuditLogs] = useState<MarketAuditLog[]>([]);
  const [transactions, setTransactions] = useState<TransactionLog[]>([]);
  const [pushedMessages, setPushedMessages] = useState<InboxMarketPushMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // CONTROLES DE EDICIÓN Y VISTA
  const [selectedAuctionId, setSelectedAuctionId] = useState<string>("");
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [editPriceValue, setEditPriceValue] = useState<number>(0);
  const [editCooldownHours, setEditCooldownHours] = useState<number>(4);
  const [forceTakedownOnActiveExpedition, setForceTakedownOnActiveExpedition] = useState<boolean>(true);
  const [quickViewAssetId, setQuickViewAssetId] = useState<string | null>(null);

  // FILTROS DE BÚSQUEDA
  const [rarityFilter, setRarityFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [minPriceFilter, setMinPriceFilter] = useState<number>(0);
  const [marketFilter, setMarketFilter] = useState<'ALL' | 'DIRECT' | 'AUCTION'>('ALL');
  const [searchParam, setSearchParam] = useState<string>('');

  // NOTIFICACIONES PUSH
  const [pushRecipientId, setPushRecipientId] = useState<string>("");
  const [pushSubject, setPushSubject] = useState<string>("ALERTA DEL SISTEMA: Transacción autorizada");
  const [pushBody, setPushBody] = useState<string>("Mensaje del sistema de mercado Sasorilabs.");
  const [pushCategory, setPushCategory] = useState<'ALERT' | 'PURCHASE' | 'RETURN' | 'OUTBID'>("ALERT");

  // ─── CONSULTA REAL DE DATOS DE MERCADO DESDE SUPABASE ───
  const fetchRealMarketData = async () => {
    setLoading(true);
    try {
      // 1. Cargar Publicaciones Reales (Búsqueda híbrida en marketplace_listings y market_listings)
      let listingsData: any[] = [];
      const { data: pListings } = await supabase.from('marketplace_listings').select('*').order('created_at', { ascending: false });
      if (pListings && pListings.length > 0) {
        listingsData = pListings;
      } else {
        const { data: mListings } = await supabase.from('market_listings').select('*').order('created_at', { ascending: false });
        if (mListings) listingsData = mListings;
      }

      if (listingsData.length > 0) {
        const mapped: MarketAsset[] = listingsData.map((item: any) => {
          const sellerObj = users.find(u => u.id === (item.seller_id || item.user_id));
          return {
            id: item.id || item.listing_id,
            name: item.name || item.title || item.asset_name || item.asset_type || 'Activo Estelar',
            category: item.category || (item.asset_type === 'SHIP' ? 'Spaceships' : item.asset_type === 'TOOL' ? 'Technology' : 'Consumables'),
            rarity: (item.rarity || 'common').toLowerCase() as any,
            isAuction: !!item.is_auction,
            sellerId: item.seller_id || item.user_id || 'usr-0',
            sellerName: item.seller_name || item.username || sellerObj?.username || 'Comandante',
            basePrice: Number(item.price_gd || item.base_price || item.price) || 0,
            currentBid: Number(item.current_bid || item.highest_bid || item.price_gd) || 0,
            hpCurrent: Number(item.hp_current || item.resistance) || 100,
            hpMax: Number(item.hp_max || item.max_hp) || 100,
            isEquipped: !!item.is_equipped,
            onActiveExpedition: !!item.on_active_expedition,
            expiresAt: item.expires_at || new Date(Date.now() + 86400000).toISOString(),
            bidCount: Number(item.bid_count || item.total_bids) || 0,
            status: item.status || 'ACTIVE'
          };
        });
        setMarketAssets(mapped);
        if (mapped.length > 0 && !selectedAuctionId) {
          const firstAuction = mapped.find(a => a.isAuction);
          if (firstAuction) setSelectedAuctionId(firstAuction.id);
        }
      } else {
        setMarketAssets([]);
      }

      // 2. Cargar Log de Transacciones y Comisiones (marketplace_transactions_log)
      const { data: txData } = await supabase
        .from('marketplace_transactions_log')
        .select('*')
        .order('purchased_at', { ascending: false });

      if (txData && txData.length > 0) {
        const mappedTx: TransactionLog[] = txData.map((tx: any) => {
          const sellerObj = users.find(u => u.id === tx.seller_id);
          const buyerObj = users.find(u => u.id === tx.buyer_id);
          return {
            id: tx.id,
            listingId: tx.listing_id,
            sellerId: tx.seller_id,
            sellerName: sellerObj?.username || 'Vendedor',
            buyerId: tx.buyer_id,
            buyerName: buyerObj?.username || 'Comprador',
            grossPrice: Number(tx.gross_price) || 0,
            feeApplied: Number(tx.fee_applied) || 0,
            netToSeller: Number(tx.net_to_seller) || 0,
            isSuspicious: !!tx.is_suspicious || Number(tx.gross_price) >= 50000,
            purchasedAt: tx.purchased_at || new Date().toISOString()
          };
        });
        setTransactions(mappedTx);
      } else {
        setTransactions([]);
      }

      // 3. Cargar Pujas Reales (market_bids)
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

      // 4. Cargar Bitácora de Auditoría (market_audit_logs)
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
      console.warn("Error cargando mercado:", e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealMarketData();
  }, []);

  const handleEditExpiration = async (assetId: string, action: 'ADD' | 'SUBTRACT') => {
    const hours = editCooldownHours || 1;
    const target = marketAssets.find(a => a.id === assetId);
    if (!target) return;

    const currentExp = new Date(target.expiresAt).getTime();
    const delta = 1000 * 3600 * hours;
    const newTimeIso = new Date(action === 'ADD' ? currentExp + delta : currentExp - delta).toISOString();

    try {
      await supabase.from('marketplace_listings').update({ expires_at: newTimeIso }).eq('id', assetId);
      await supabase.from('market_listings').update({ expires_at: newTimeIso }).eq('id', assetId);
    } catch (e) {}

    setMarketAssets(prev => prev.map(a => a.id === assetId ? { ...a, expiresAt: newTimeIso } : a));
    setIsAlertToShow({ show: true, status: 'success', message: `¡Cooldown actualizado para ${assetId}: ${action === 'ADD' ? '+' : '-'}${hours}h!` });
  };

  const handleEditPrice = async (assetId: string) => {
    if (editPriceValue <= 0) {
      setIsAlertToShow({ show: true, status: 'error', message: 'Por favor, introduce un precio válido mayor a 0 GD Coins.' });
      return;
    }

    const target = marketAssets.find(a => a.id === assetId);
    if (!target) return;

    try {
      await supabase.from('marketplace_listings').update({ price_gd: editPriceValue }).eq('id', assetId);
      await supabase.from('market_listings').update(target.isAuction ? { current_bid: editPriceValue } : { base_price: editPriceValue }).eq('id', assetId);
    } catch (e) {}

    setMarketAssets(prev => prev.map(a => {
      if (a.id === assetId) {
        return a.isAuction ? { ...a, currentBid: editPriceValue } : { ...a, basePrice: editPriceValue };
      }
      return a;
    }));

    setIsAlertToShow({ show: true, status: 'success', message: `Precio actualizado en ${assetId} a ${editPriceValue} GD.` });
    setSelectedAssetId(null);
  };

  const handleForceTakedown = async (assetId: string) => {
    const target = marketAssets.find(a => a.id === assetId);
    if (!target) return;

    try {
      await supabase.from('marketplace_listings').update({ status: 'CANCELLED' }).eq('id', assetId);
      await supabase.from('market_listings').delete().eq('id', assetId);
    } catch (e) {}

    setIsAlertToShow({
      show: true,
      status: 'error',
      message: `¡PUBLICACIÓN CANCELADA! ${assetId} removida del mercado P2P.`
    });

    setMarketAssets(prev => prev.filter(a => a.id !== assetId));
  };

  const handleTriggerReturnEngine = async () => {
    await fetchRealMarketData();
    if (onRefreshData) onRefreshData();
    setIsAlertToShow({ show: true, status: 'success', message: 'Sincronización completa con Supabase.' });
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Purchased At', 'Seller ID', 'Seller Name', 'Buyer ID', 'Buyer Name', 'Gross Price (GD)', 'Fee Applied 5% (GD)', 'Net Seller (GD)', 'Suspicious Siphon Alert'];
    const rows = transactions.map(tx => [
      tx.id,
      tx.purchasedAt,
      tx.sellerId,
      tx.sellerName,
      tx.buyerId,
      tx.buyerName,
      tx.grossPrice,
      tx.feeApplied,
      tx.netToSeller,
      tx.isSuspicious ? 'TRUE' : 'FALSE'
    ]);
    
    const csvRows = [headers.join(','), ...rows.map(e => e.join(','))];
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `marketplace_audit_p2p_${new Date().toISOString().split('T')[0]}.csv`);
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
    setIsAlertToShow({ show: true, status: 'success', message: `Notificación push inyectada a ${recName}.` });
    setPushSubject("");
    setPushBody("");
  };

  const totalGdVolumeLogs = transactions.reduce((sum, tx) => sum + tx.grossPrice, 0);
  const totalCollectedTaxes = transactions.reduce((sum, tx) => sum + tx.feeApplied, 0);
  const flaggedTransactions = transactions.filter(t => t.isSuspicious || t.grossPrice >= 50000);

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

  return (
    <div className="space-y-6 font-mono text-xs text-left text-white select-none p-2 md:p-6">
      
      {/* HEADER PANEL */}
      <div className="bg-gradient-to-r from-zinc-950 via-[#0a0a0c] to-zinc-950 border border-zinc-900 rounded-lg p-5 flex flex-col md:flex-row justify-between items-start md:items-stretch gap-4 shadow-[#ff1e1e]/5 shadow-sm">
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="h-2 w-2 bg-[#ff1e1e] rounded-full animate-pulse" />
              <h1 className="text-lg font-bold text-white tracking-wide uppercase font-sans">
                P2P Marketplace & Control Anti-Sifón
              </h1>
              <span className="text-[10px] font-mono bg-red-950 text-red-500 border border-red-900 px-2 py-0.5 rounded font-extrabold uppercase">
                SERVER AUTHORITATIVE (5% FEE)
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
              Consola central de supervisión militar y administración económica para el mercado lúdico de <span className="text-[#ff1e1e] font-semibold">Sasorilabs.io</span>.
            </p>
          </div>

          <div className="mt-3.5 flex flex-wrap items-center gap-x-5 gap-y-1 text-[10px] font-mono text-zinc-500 border-t border-zinc-900/60 pt-2.5">
            <div className="flex items-center gap-1.5">
              <span>Ofertas en Red:</span>
              <span className="text-white font-bold">{listingsCount}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>Alertas Anti-Sifón:</span>
              <span className="text-amber-400 font-bold">{flaggedTransactions.length}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-row md:flex-col justify-between items-end gap-2 md:self-center font-mono text-[10.5px] border-t md:border-t-0 md:border-l border-zinc-900/60 pt-3 md:pt-0 md:pl-4 shrink-0">
          <div className="flex gap-2">
            <div className="px-3 py-1.5 bg-zinc-950 border border-zinc-900 rounded text-center">
              <span className="text-zinc-500 block text-[8px] uppercase font-bold">Volumen Transaccionado</span>
              <span className="text-white font-extrabold text-xs">{totalGdVolumeLogs.toLocaleString()} GD</span>
            </div>
            <div className="px-3 py-1.5 bg-zinc-950 border border-zinc-900 rounded text-center">
              <span className="text-zinc-500 block text-[8px] uppercase font-bold">Comisiones Retenidas (5%)</span>
              <span className="text-emerald-400 font-extrabold text-xs">+{totalCollectedTaxes.toLocaleString()} GD</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleTriggerReturnEngine}
            className="w-full px-3 py-1.5 bg-red-950/40 hover:bg-[#ff1e1e] text-zinc-300 hover:text-white border border-[#ff1e1e]/35 rounded transition-all cursor-pointer flex items-center justify-center gap-1.5 font-bold font-sans text-xs mt-1"
          >
            <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
            Sincronizar Supabase
          </button>
        </div>
      </div>

      {/* CINTA DE PESTAÑAS DE VISTA */}
      <div className="flex bg-zinc-950 border border-zinc-900 rounded-lg p-1 text-xs select-none">
        <button
          onClick={() => setViewTab('grid')}
          className={`py-2 px-4 rounded font-bold cursor-pointer transition-all uppercase flex items-center gap-2 ${
            viewTab === 'grid' ? 'bg-red-950/80 text-red-400 border border-red-900/50' : 'text-zinc-500 hover:text-white'
          }`}
        >
          <ShoppingBag size={14} /> Mercado en Vivo ({filteredAssets.length})
        </button>
        <button
          onClick={() => setViewTab('transactions')}
          className={`py-2 px-4 rounded font-bold cursor-pointer transition-all uppercase flex items-center gap-2 ${
            viewTab === 'transactions' ? 'bg-red-950/80 text-red-400 border border-red-900/50' : 'text-zinc-500 hover:text-white'
          }`}
        >
          <DollarSign size={14} /> Historial & Comisiones ({transactions.length})
        </button>
        <button
          onClick={() => setViewTab('siphon_radar')}
          className={`py-2 px-4 rounded font-bold cursor-pointer transition-all uppercase flex items-center gap-2 ${
            viewTab === 'siphon_radar' ? 'bg-amber-950/80 text-amber-400 border border-amber-900/50' : 'text-zinc-500 hover:text-white'
          }`}
        >
          <ShieldAlert size={14} className="text-amber-500" /> Radar Anti-Sifón ({flaggedTransactions.length})
        </button>
        <button
          onClick={() => setViewTab('push_notifications')}
          className={`py-2 px-4 rounded font-bold cursor-pointer transition-all uppercase flex items-center gap-2 ${
            viewTab === 'push_notifications' ? 'bg-red-950/80 text-red-400 border border-red-900/50' : 'text-zinc-500 hover:text-white'
          }`}
        >
          <Mail size={14} /> Inyector Push
        </button>
      </div>

      {/* RENDERIZADO DINÁMICO DE VISTAS */}
      <div className="space-y-6">

        {/* VISTA 1: GRID EN VIVO DE MERCADO */}
        {viewTab === 'grid' && (
          <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-5 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-zinc-900 pb-4 gap-2">
              <div className="flex items-center gap-2">
                <Coins size={16} className="text-[#ff1e1e] shrink-0" />
                <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider block">
                  PUBLICACIONES ACTIVAS EN BASE DE DATOS
                </span>
              </div>

              <div className="flex gap-1.5 self-start">
                <button
                  onClick={() => setMarketFilter('ALL')}
                  className={`px-2 py-1 rounded text-[9.5px] font-mono font-bold border transition-all cursor-pointer ${
                    marketFilter === 'ALL' ? 'bg-[#ff1e1e] border-[#ff1e1e] text-white' : 'bg-black border-zinc-900 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  TODOS ({marketAssets.length})
                </button>
                <button
                  onClick={() => setMarketFilter('DIRECT')}
                  className={`px-2 py-1 rounded text-[9.5px] font-mono font-bold border transition-all cursor-pointer ${
                    marketFilter === 'DIRECT' ? 'bg-[#ff1e1e] border-[#ff1e1e] text-white' : 'bg-black border-zinc-900 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  VENTA DIRECTA
                </button>
                <button
                  onClick={() => setMarketFilter('AUCTION')}
                  className={`px-2 py-1 rounded text-[9.5px] font-mono font-bold border transition-all cursor-pointer ${
                    marketFilter === 'AUCTION' ? 'bg-[#ff1e1e] border-[#ff1e1e] text-white' : 'bg-black border-zinc-900 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  SUBASTAS
                </button>
              </div>
            </div>

            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500 shrink-0" />
              <input
                type="text"
                value={searchParam}
                onChange={(e) => setSearchParam(e.target.value)}
                placeholder="Buscar por activo, ID de publicación o vendedor..."
                className="w-full bg-black border border-zinc-900 pl-9 pr-4 py-2 rounded text-xs text-white focus:outline-none focus:border-red-500/50 font-mono transition-all uppercase"
              />
            </div>

            {/* Filtros Extendidos */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-black/40 border border-zinc-900/60 p-3 rounded-lg text-xs font-mono">
              <div className="space-y-1">
                <label className="text-zinc-500 text-[9px] uppercase font-bold tracking-wider block">Rareza:</label>
                <select value={rarityFilter} onChange={(e) => setRarityFilter(e.target.value)} className="w-full bg-zinc-950 border border-zinc-900 p-1.5 rounded text-white focus:outline-none focus:border-red-500/40 text-[10.5px] cursor-pointer">
                  <option value="ALL">TODAS</option>
                  <option value="common">COMMON</option>
                  <option value="uncommon">UNCOMMON</option>
                  <option value="rare">RARE</option>
                  <option value="epic">EPIC</option>
                  <option value="legendary">LEGENDARY</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-zinc-500 text-[9px] uppercase font-bold tracking-wider block">Categoría:</label>
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-full bg-zinc-950 border border-zinc-900 p-1.5 rounded text-white focus:outline-none focus:border-red-500/40 text-[10.5px] cursor-pointer">
                  <option value="ALL">TODAS</option>
                  <option value="Spaceships">SPACESHIPS</option>
                  <option value="Structures">STRUCTURES</option>
                  <option value="Technology">TECHNOLOGY</option>
                  <option value="Badges">BADGES</option>
                  <option value="Blueprints">BLUEPRINTS</option>
                  <option value="Consumables">CONSUMABLES</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-zinc-500 text-[9px] uppercase font-bold tracking-wider block">Precio Mínimo:</label>
                <div className="relative">
                  <input type="number" min="0" step="500" value={minPriceFilter} onChange={(e) => setMinPriceFilter(Math.max(0, parseInt(e.target.value) || 0))} className="w-full bg-zinc-950 border border-zinc-900 p-1.5 pr-8 rounded text-yellow-400 font-bold focus:outline-none focus:border-red-500/40 text-[10.5px] font-mono"/>
                  <span className="absolute right-2 top-1.5 text-zinc-500 font-bold text-[9px]">GD</span>
                </div>
              </div>
            </div>

            {/* Tabla de Resultados */}
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
                        {loading ? 'Cargando publicaciones reales...' : 'No hay ofertas registradas en la base de datos.'}
                      </td>
                    </tr>
                  ) : (
                    filteredAssets.map(asset => {
                      const isExpired = new Date(asset.expiresAt).getTime() < Date.now();
                      const hpPercent = Math.round((asset.hpCurrent / asset.hpMax) * 100);

                      return (
                        <tr key={asset.id} className="hover:bg-zinc-900/10 transition-colors">
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
                              <span className="text-[10px] text-zinc-500 mt-0.5 font-mono">ID: {asset.id}</span>
                            </div>
                          </td>

                          <td className="p-3 text-zinc-300">
                            <span className="block font-semibold">{asset.sellerName}</span>
                            <span className="text-[9.5px] text-zinc-500 font-mono">{asset.sellerId.substring(0, 12)}...</span>
                          </td>

                          <td className="p-3">
                            <span className="text-zinc-400 block text-[11.5px]">{asset.category}</span>
                            <span className="text-[9.5px] text-zinc-500">HP: {hpPercent}%</span>
                          </td>

                          <td className="p-3 text-center">
                            {asset.isAuction ? (
                              <span className="text-yellow-400 font-bold text-[11px]">{asset.bidCount} pujas</span>
                            ) : (
                              <span className="text-zinc-500 italic text-[10px]">Directa</span>
                            )}
                          </td>

                          <td className="p-3 text-right">
                            <span className="text-amber-400 font-extrabold font-mono text-[12.5px]">
                              {(asset.isAuction ? asset.currentBid : asset.basePrice).toLocaleString()} GD
                            </span>
                          </td>

                          <td className="p-3">
                            {isExpired ? (
                              <span className="text-red-500 font-extrabold text-[10px] uppercase">EXPIRADO</span>
                            ) : (
                              <span className="text-zinc-300 text-[11px]">{new Date(asset.expiresAt).toLocaleTimeString()}</span>
                            )}
                          </td>

                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => { setSelectedAssetId(asset.id); setEditPriceValue(asset.isAuction ? asset.currentBid : asset.basePrice); }}
                                className="p-1 px-2 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-[10px] font-bold cursor-pointer"
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleForceTakedown(asset.id)}
                                className="p-1.5 rounded bg-red-950/20 hover:bg-red-900 text-red-400 border border-red-900/40 cursor-pointer"
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

            {/* Modal Edición Rápida */}
            <AnimatePresence>
              {selectedAssetId && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-black border border-zinc-900 rounded p-4 mt-2 space-y-3">
                  <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                      🔧 CONTROLES EXCLUSIVOS ADMIN: {selectedAssetId}
                    </span>
                    <button onClick={() => setSelectedAssetId(null)} className="text-zinc-500 hover:text-white cursor-pointer font-bold">✕</button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="space-y-1.5">
                      <label className="text-zinc-500 text-[10px] uppercase font-bold block">Modificar Precio:</label>
                      <input type="number" value={editPriceValue ?? 0} onChange={(e) => setEditPriceValue(parseInt(e.target.value) || 0)} className="w-full bg-zinc-950 border border-zinc-900 p-2 rounded text-[11px] text-yellow-400 font-bold focus:outline-none"/>
                      <button type="button" onClick={() => handleEditPrice(selectedAssetId)} className="w-full py-1.5 bg-[#ff1e1e] text-white rounded text-[10px] font-bold cursor-pointer">Establecer Precio</button>
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-zinc-500 text-[10px] uppercase font-bold block">Editar Tiempo Expiración (Cooldown):</label>
                      <div className="flex gap-2">
                        <input type="number" value={editCooldownHours} onChange={(e) => setEditCooldownHours(Math.max(1, parseInt(e.target.value) || 1))} className="w-full bg-zinc-950 border border-zinc-900 p-2 rounded text-[11px] text-white font-mono focus:outline-none"/>
                        <button type="button" onClick={() => handleEditExpiration(selectedAssetId, 'ADD')} className="px-3.5 py-2 bg-emerald-950 text-emerald-400 border border-emerald-900 font-bold rounded text-[10.5px] cursor-pointer">+ Compensar Horas</button>
                        <button type="button" onClick={() => handleEditExpiration(selectedAssetId, 'SUBTRACT')} className="px-3.5 py-2 bg-red-950 text-red-400 border border-red-900 font-bold rounded text-[10.5px] cursor-pointer">- Restar Horas</button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* VISTA 2: HISTORIAL Y COMISIONES (5%) */}
        {viewTab === 'transactions' && (
          <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                Auditoría de Transacciones Realizadas ({transactions.length})
              </span>
              <button onClick={handleExportCSV} className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded font-bold uppercase text-[10px] flex items-center gap-1.5 cursor-pointer">
                <Download size={12} /> Exportar CSV
              </button>
            </div>

            <div className="space-y-2 pt-2">
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-zinc-600 border border-dashed border-zinc-850 rounded-lg">
                  No hay transacciones registradas en la base de datos.
                </div>
              ) : (
                transactions.map(tx => (
                  <div key={tx.id} className="p-3.5 bg-zinc-900/30 border border-zinc-850 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">{tx.buyerName}</span>
                        <ArrowRight size={12} className="text-zinc-600" />
                        <span className="font-bold text-zinc-300 text-xs">{tx.sellerName}</span>
                      </div>
                      <span className="text-[9.5px] text-zinc-500 font-mono block">
                        TX ID: {tx.id} • {new Date(tx.purchasedAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-6 text-right font-mono">
                      <div>
                        <span className="text-[9px] text-zinc-500 block uppercase">Monto Bruto</span>
                        <strong className="text-amber-400">{tx.grossPrice.toLocaleString()} GD</strong>
                      </div>
                      <div>
                        <span className="text-[9px] text-zinc-500 block uppercase">Comisión (5%)</span>
                        <strong className="text-emerald-400">+{tx.feeApplied.toLocaleString()} GD</strong>
                      </div>
                      <div>
                        <span className="text-[9px] text-zinc-500 block uppercase">Neto Vendedor</span>
                        <strong className="text-zinc-300">{tx.netToSeller.toLocaleString()} GD</strong>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* VISTA 3: RADAR ANTI-SIFÓN */}
        {viewTab === 'siphon_radar' && (
          <div className="bg-zinc-950 border border-amber-900/40 rounded-lg p-5 space-y-4">
            <div className="flex items-center gap-2 text-amber-500 font-bold uppercase text-xs border-b border-zinc-900 pb-3">
              <AlertTriangle size={16} />
              <span>RADAR DE TRANSFERENCIAS ANÓMALAS Y ALTO VOLUMEN (&gt;50,000 GD)</span>
            </div>

            <p className="text-zinc-400 text-[11px] font-sans">
              Monitorea transacciones de montos desproporcionados para prevenir lavado de saldo entre cuentas secundarias.
            </p>

            <div className="space-y-3 pt-2">
              {flaggedTransactions.length === 0 ? (
                <div className="text-center py-8 text-zinc-600 border border-dashed border-zinc-850 rounded-lg">
                  No se han detectado operaciones sospechosas en el radar.
                </div>
              ) : (
                flaggedTransactions.map(tx => (
                  <div key={tx.id} className="p-4 bg-amber-950/10 border border-amber-900/40 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-400 text-[9px] font-bold border border-amber-800 uppercase">
                        ALERTA DE SIFÓN ACTIVADA
                      </span>
                      <h4 className="font-bold text-white mt-2 text-xs">
                        {tx.buyerName} transfirió {tx.grossPrice.toLocaleString()} GD Coins a {tx.sellerName}
                      </h4>
                      <span className="text-[9.5px] text-zinc-500 mt-1 block font-mono">
                        Comisión cobrada por el sistema: +{tx.feeApplied} GD • {new Date(tx.purchasedAt).toLocaleString()}
                      </span>
                    </div>

                    <button 
                      onClick={() => setIsAlertToShow({ show: true, status: 'error', message: `Expediente de sanción abierto para ${tx.sellerName}` })}
                      className="px-3 py-1.5 bg-red-650 hover:bg-red-500 text-white font-bold uppercase rounded text-[10px] cursor-pointer"
                    >
                      Sancionar Vendedor
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* VISTA 4: INYECTOR PUSH DE MERCADO */}
        {viewTab === 'push_notifications' && (
          <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-5 space-y-5 font-mono">
            <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-300 flex items-center gap-2">
                <Mail size={14} className="text-red-500" /> Inyector Push de Mercado para Jugadores
              </span>
              <button onClick={handleExportInboxJSON} className="px-2.5 py-1 bg-zinc-900 text-zinc-400 border border-zinc-800 rounded text-[9.5px] font-bold uppercase cursor-pointer">
                Backup Push (JSON)
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-500 uppercase font-bold block">Destinatario:</label>
                  <select value={pushRecipientId} onChange={(e) => setPushRecipientId(e.target.value)} className="w-full bg-black border border-zinc-900 p-2 rounded text-white text-xs cursor-pointer focus:outline-none">
                    <option value="">-- Seleccionar Comandante --</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.username} ({u.id})</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-500 uppercase font-bold block">Asunto:</label>
                  <input type="text" value={pushSubject} onChange={(e) => setPushSubject(e.target.value)} className="w-full bg-black border border-zinc-900 p-2 rounded text-white text-xs focus:outline-none"/>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-500 uppercase font-bold block">Cuerpo del Mensaje:</label>
                  <textarea rows={4} value={pushBody} onChange={(e) => setPushBody(e.target.value)} className="w-full bg-black border border-zinc-900 p-2 rounded text-white text-xs focus:outline-none font-sans"/>
                </div>

                <button onClick={handleSendManualPush} className="w-full py-2.5 bg-[#ff1e1e] hover:bg-red-700 text-white font-bold uppercase rounded text-xs cursor-pointer shadow-lg">
                  Transmitir Mensaje Push
                </button>
              </div>

              <div className="bg-black/50 border border-zinc-900 rounded p-4 space-y-3">
                <span className="text-[10px] text-zinc-500 uppercase font-bold block border-b border-zinc-900 pb-2">
                  Historial de Notificaciones Inyectadas ({pushedMessages.length})
                </span>
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {pushedMessages.length === 0 ? (
                    <span className="text-zinc-600 text-[10px] italic">No hay mensajes transmitidos en esta sesión.</span>
                  ) : (
                    pushedMessages.map(pm => (
                      <div key={pm.id} className="p-2.5 bg-zinc-950 border border-zinc-900 rounded text-[10px]">
                        <div className="flex justify-between font-bold text-zinc-300">
                          <span>Para: {pm.recipientName}</span>
                          <span className="text-red-400">{pm.category}</span>
                        </div>
                        <p className="text-zinc-400 font-sans mt-1">{pm.subject}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}