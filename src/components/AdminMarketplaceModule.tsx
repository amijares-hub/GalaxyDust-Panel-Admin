import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, RefreshCw, Trash2, DollarSign, Mail,
  Coins, ArrowRight, Download, ShieldAlert, ShoppingBag, AlertTriangle, Send, UserCheck
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
}: AdminMarketplaceModuleProps) {
  const [viewTab, setViewTab] = useState<'grid' | 'transactions' | 'siphon_radar' | 'push_notifications'>('grid');
  const [marketAssets, setMarketAssets] = useState<MarketAsset[]>([]);
  const [transactions, setTransactions] = useState<TransactionLog[]>([]);
  const [pushedMessages, setPushedMessages] = useState<InboxMarketPushMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Parámetros de Mercado
  const [marketFeePercent, setMarketFeePercent] = useState<number>(5);
  const [siphonThreshold, setSiphonThreshold] = useState<number>(50000);

  // Paginación
  const [page, setPage] = useState<number>(0);
  const [txPage, setTxPage] = useState<number>(0);
  const pageSize = 20;

  // Edición rápida
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [editPriceValue, setEditPriceValue] = useState<number>(0);
  const [editCooldownHours, setEditCooldownHours] = useState<number>(4);

  // Filtros
  const [rarityFilter, setRarityFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [minPriceFilter, setMinPriceFilter] = useState<number>(0);
  const [marketFilter, setMarketFilter] = useState<'ALL' | 'DIRECT' | 'AUCTION'>('ALL');
  const [searchParam, setSearchParam] = useState<string>('');

  // Notificaciones Push
  const [pushRecipientSearch, setPushRecipientSearch] = useState<string>('');
  const [selectedRecipient, setSelectedRecipient] = useState<UserProfile | null>(null);
  const [pushSubject, setPushSubject] = useState<string>('ALERTA DEL SISTEMA: Transacción autorizada');
  const [pushBody, setPushBody] = useState<string>('Mensaje emitido desde la consola central de mando.');
  const [pushCategory, setPushCategory] = useState<'ALERT' | 'PURCHASE' | 'RETURN' | 'OUTBID'>('ALERT');
  const [isSendingPush, setIsSendingPush] = useState<boolean>(false);

  const fetchRealMarketData = async () => {
    setLoading(true);
    try {
      // 1. Cargar Publicaciones Reales
      let listingsData: any[] = [];
      const { data: pListings } = await supabase
        .from('marketplace_listings')
        .select('*')
        .order('created_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (pListings && pListings.length > 0) {
        listingsData = pListings;
      } else {
        const { data: mListings } = await supabase
          .from('market_listings')
          .select('*')
          .order('created_at', { ascending: false })
          .range(page * pageSize, (page + 1) * pageSize - 1);
        if (mListings) listingsData = mListings;
      }

      if (listingsData.length > 0) {
        const mapped: MarketAsset[] = listingsData.map((item: any) => {
          const sellerObj = users.find(u => u.id === (item.seller_id || item.user_id));
          return {
            id: String(item.id || item.listing_id),
            name: item.name || item.title || item.asset_name || 'Activo Estelar',
            category: item.category || 'Spaceships',
            rarity: (item.rarity || 'common').toLowerCase() as any,
            isAuction: Boolean(item.is_auction),
            sellerId: item.seller_id || item.user_id || 'usr-0',
            sellerName: item.seller_name || item.username || sellerObj?.username || 'Comandante',
            basePrice: Number(item.price_gd || item.base_price || item.price) || 0,
            currentBid: Number(item.current_bid || item.highest_bid || item.price_gd) || 0,
            hpCurrent: Number(item.hp_current || item.resistance) || 100,
            hpMax: Number(item.hp_max || item.max_hp) || 100,
            isEquipped: Boolean(item.is_equipped),
            onActiveExpedition: Boolean(item.on_active_expedition),
            expiresAt: item.expires_at || new Date(Date.now() + 86400000).toISOString(),
            bidCount: Number(item.bid_count || item.total_bids) || 0,
            status: item.status || 'ACTIVE'
          };
        });
        setMarketAssets(mapped);
      } else {
        setMarketAssets([]);
      }

      // 2. Transacciones y Comisiones
      const { data: txData } = await supabase
        .from('marketplace_transactions_log')
        .select('*')
        .order('purchased_at', { ascending: false })
        .range(txPage * pageSize, (txPage + 1) * pageSize - 1);

      if (txData && txData.length > 0) {
        const mappedTx: TransactionLog[] = txData.map((tx: any) => {
          const sellerObj = users.find(u => u.id === tx.seller_id);
          const buyerObj = users.find(u => u.id === tx.buyer_id);
          const gross = Number(tx.gross_price) || 0;
          const fee = gross * (marketFeePercent / 100);
          return {
            id: String(tx.id),
            listingId: String(tx.listing_id),
            sellerId: String(tx.seller_id),
            sellerName: sellerObj?.username || 'Vendedor',
            buyerId: String(tx.buyer_id),
            buyerName: buyerObj?.username || 'Comprador',
            grossPrice: gross,
            feeApplied: fee,
            netToSeller: gross - fee,
            isSuspicious: gross >= siphonThreshold,
            purchasedAt: tx.purchased_at || new Date().toISOString()
          };
        });
        setTransactions(mappedTx);
      } else {
        setTransactions([]);
      }

      // 3. Cargar historial de push desde direct_messages
      const { data: pushData } = await supabase
        .from('direct_messages')
        .select('id, receiver_id, message_text, created_at, receiver:receiver_id(username)')
        .is('sender_id', null)
        .order('created_at', { ascending: false })
        .limit(25);

      if (pushData) {
        const mappedPushes: InboxMarketPushMessage[] = pushData.map((pm: any) => {
          const rawText = String(pm.message_text || '');
          const matchCat = rawText.match(/^\[(.*?)\]/);
          const cat = (matchCat ? matchCat[1] : 'ALERT') as any;
          return {
            id: String(pm.id),
            recipientId: String(pm.receiver_id),
            recipientName: pm.receiver?.username || 'Comandante',
            subject: 'Transmisión de Mando',
            body: rawText,
            category: cat,
            timestamp: pm.created_at,
            isSent: true
          };
        });
        setPushedMessages(mappedPushes);
      }

    } catch (e: any) {
      console.warn("Sincronización de mercado:", e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealMarketData();
  }, [page, txPage]);

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
    } catch {}

    setMarketAssets(prev => prev.map(a => a.id === assetId ? { ...a, expiresAt: newTimeIso } : a));
    setIsAlertToShow({ show: true, status: 'success', message: `Cooldown modificado: ${action === 'ADD' ? '+' : '-'}${hours}h` });
  };

  const handleEditPrice = async (assetId: string) => {
    if (editPriceValue <= 0) {
      setIsAlertToShow({ show: true, status: 'error', message: 'Introduce un precio superior a 0 GD.' });
      return;
    }

    try {
      await supabase.from('marketplace_listings').update({ price_gd: editPriceValue }).eq('id', assetId);
      await supabase.from('market_listings').update({ base_price: editPriceValue, current_bid: editPriceValue }).eq('id', assetId);
    } catch {}

    setMarketAssets(prev => prev.map(a => a.id === assetId ? { ...a, basePrice: editPriceValue, currentBid: editPriceValue } : a));
    setIsAlertToShow({ show: true, status: 'success', message: `Precio actualizado a ${editPriceValue} GD.` });
    setSelectedAssetId(null);
  };

  const handleForceTakedown = async (assetId: string) => {
    try {
      await supabase.from('marketplace_listings').update({ status: 'CANCELLED' }).eq('id', assetId);
      await supabase.from('market_listings').delete().eq('id', assetId);
    } catch {}

    setMarketAssets(prev => prev.filter(a => a.id !== assetId));
    setIsAlertToShow({ show: true, status: 'error', message: `Publicación [${assetId}] retirada del mercado.` });
  };

  const handleSendManualPush = async () => {
    if (!selectedRecipient) {
      setIsAlertToShow({ show: true, status: 'error', message: 'Selecciona un comandante destinatario.' });
      return;
    }

    setIsSendingPush(true);
    try {
      const fullMessage = `[${pushCategory}] ${pushSubject}: ${pushBody}`;

      // Inyección real en direct_messages y auditoría
      const { data, error } = await supabase.from('direct_messages').insert([{
        sender_id: null,
        receiver_id: selectedRecipient.id,
        message_text: fullMessage,
        is_read: false,
        created_at: new Date().toISOString()
      }]).select().single();

      if (error) throw error;

      await supabase.from('maintenance_logs').insert([{
        action_type: `MARKET_PUSH_${pushCategory}`,
        records_affected: 1,
        created_at: new Date().toISOString()
      }]);

      const newPushItem: InboxMarketPushMessage = {
        id: String(data?.id || Date.now()),
        recipientId: selectedRecipient.id,
        recipientName: selectedRecipient.username,
        subject: pushSubject,
        body: fullMessage,
        category: pushCategory,
        timestamp: new Date().toISOString(),
        isSent: true
      };

      setPushedMessages(prev => [newPushItem, ...prev]);
      setIsAlertToShow({ show: true, status: 'success', message: `Alerta transmitida a ${selectedRecipient.username}.` });
      setPushSubject('ALERTA DEL SISTEMA: Transacción autorizada');
      setPushBody('');
      setSelectedRecipient(null);
      setPushRecipientSearch('');
    } catch (e: any) {
      setIsAlertToShow({ show: true, status: 'error', message: `Error al transmitir push: ${e.message}` });
    } finally {
      setIsSendingPush(false);
    }
  };

  const filteredUsersForPush = useMemo(() => {
    if (!pushRecipientSearch.trim()) return [];
    const term = pushRecipientSearch.toLowerCase();
    return users.filter(u => 
      u.username.toLowerCase().includes(term) || 
      String(u.id).toLowerCase().includes(term)
    ).slice(0, 8);
  }, [users, pushRecipientSearch]);

  const filteredAssets = marketAssets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchParam.toLowerCase()) || 
                          asset.id.toLowerCase().includes(searchParam.toLowerCase()) ||
                          asset.sellerName.toLowerCase().includes(searchParam.toLowerCase());
    
    if (!matchesSearch) return false;
    if (marketFilter === 'DIRECT' && asset.isAuction) return false;
    if (marketFilter === 'AUCTION' && !asset.isAuction) return false;
    if (rarityFilter !== 'ALL' && asset.rarity !== rarityFilter.toLowerCase()) return false;
    if (categoryFilter !== 'ALL' && asset.category !== categoryFilter) return false;
    
    const activePrice = asset.isAuction ? asset.currentBid : asset.basePrice;
    if (activePrice < minPriceFilter) return false;
    
    return true;
  });

  const totalGdVolume = transactions.reduce((sum, tx) => sum + tx.grossPrice, 0);
  const totalTaxes = transactions.reduce((sum, tx) => sum + tx.feeApplied, 0);
  const flaggedTxs = transactions.filter(t => t.isSuspicious || t.grossPrice >= siphonThreshold);

  return (
    <div className="space-y-6 font-mono text-xs text-left text-white select-none p-2 md:p-6">
      
      {/* HEADER DE MÓDULO */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Coins className="text-red-500 animate-pulse" size={18} />
            <h1 className="text-lg font-bold text-white uppercase tracking-wide">
              P2P Marketplace & Auditoría de Flujos
            </h1>
          </div>
          <p className="text-xs text-zinc-500 font-sans mt-1">
            Supervisión de compras directas, subastas, retenciones de comisión ({marketFeePercent}%) y radar anti-sifón.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 font-mono">
          <div className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-center">
            <span className="text-zinc-500 block text-[8px] uppercase">Volumen Registrado</span>
            <span className="text-amber-400 font-bold">{totalGdVolume.toLocaleString('es-ES')} GD</span>
          </div>
          <div className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-center">
            <span className="text-zinc-500 block text-[8px] uppercase">Comisión Retenida</span>
            <span className="text-emerald-400 font-bold">+{totalTaxes.toLocaleString('es-ES')} GD</span>
          </div>
          <button
            onClick={fetchRealMarketData}
            className="px-3 py-2 bg-red-650 hover:bg-red-600 text-white font-bold uppercase rounded-lg transition-all cursor-pointer flex items-center gap-1.5 text-xs shadow-lg"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            Sincronizar
          </button>
        </div>
      </div>

      {/* TABS DE SECCIÓN */}
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
          <ShieldAlert size={14} className="text-amber-500" /> Radar Anti-Sifón ({flaggedTxs.length})
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

      {/* VISTA 1: CATÁLOGO EN VIVO */}
      {viewTab === 'grid' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex gap-4 w-full sm:w-auto">
              <div>
                <label className="text-[10px] text-zinc-500 font-bold block mb-1 uppercase">Comisión Sistema (%)</label>
                <input
                  type="number"
                  value={marketFeePercent}
                  onChange={e => setMarketFeePercent(Number(e.target.value))}
                  className="bg-black border border-zinc-800 text-cyan-400 font-bold text-xs px-3 py-1.5 rounded w-24 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-500 font-bold block mb-1 uppercase">Umbral Anti-Sifón (GD)</label>
                <input
                  type="number"
                  value={siphonThreshold}
                  onChange={e => setSiphonThreshold(Number(e.target.value))}
                  className="bg-black border border-zinc-800 text-amber-400 font-bold text-xs px-3 py-1.5 rounded w-32 outline-none"
                />
              </div>
            </div>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="text"
                value={searchParam}
                onChange={e => setSearchParam(e.target.value)}
                placeholder="Filtrar publicación o comandante..."
                className="w-full bg-black border border-zinc-800 pl-9 pr-4 py-2 rounded text-xs text-white uppercase outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-zinc-900 bg-zinc-950 font-mono">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-900 bg-zinc-900/60 text-[10px] text-zinc-400 uppercase">
                  <th className="p-3">Activo en Venta</th>
                  <th className="p-3">Vendedor</th>
                  <th className="p-3">Categoría</th>
                  <th className="p-3 text-right">Precio Actual</th>
                  <th className="p-3">Expiración</th>
                  <th className="p-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/50">
                {filteredAssets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center p-8 text-zinc-600 italic">
                      Sin ofertas activas en la base de datos de mercado.
                    </td>
                  </tr>
                ) : (
                  filteredAssets.map(asset => (
                    <tr key={asset.id} className="hover:bg-zinc-900/30 transition-colors">
                      <td className="p-3">
                        <span className="font-bold text-white block text-xs">{asset.name}</span>
                        <span className="text-[9px] text-zinc-500">ID: {asset.id}</span>
                      </td>
                      <td className="p-3 text-zinc-300">
                        <span className="block font-semibold">{asset.sellerName}</span>
                        <span className="text-[9px] text-zinc-500">{asset.sellerId.substring(0, 12)}...</span>
                      </td>
                      <td className="p-3 text-zinc-400 uppercase text-[11px]">{asset.category}</td>
                      <td className="p-3 text-right text-amber-400 font-bold font-mono">
                        {(asset.isAuction ? asset.currentBid : asset.basePrice).toLocaleString('es-ES')} GD
                      </td>
                      <td className="p-3 text-zinc-400 text-[11px]">
                        {new Date(asset.expiresAt).toLocaleTimeString()}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => { setSelectedAssetId(asset.id); setEditPriceValue(asset.isAuction ? asset.currentBid : asset.basePrice); }}
                            className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-[10px] font-bold cursor-pointer"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleForceTakedown(asset.id)}
                            className="p-1 rounded bg-red-950/40 hover:bg-red-900 text-red-400 border border-red-900/50 cursor-pointer"
                            title="Retirar oferta"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Modal Edición Rápida */}
          <AnimatePresence>
            {selectedAssetId && (
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-black border border-zinc-800 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase">
                    Modificar Parámetros de Publicación: {selectedAssetId}
                  </span>
                  <button onClick={() => setSelectedAssetId(null)} className="text-zinc-500 hover:text-white cursor-pointer font-bold">✕</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div className="space-y-1">
                    <label className="text-zinc-500 text-[10px] uppercase font-bold block">Nuevo Precio (GD):</label>
                    <input type="number" value={editPriceValue || ''} onChange={e => setEditPriceValue(Number(e.target.value))} className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded text-amber-400 font-bold text-xs outline-none"/>
                    <button onClick={() => handleEditPrice(selectedAssetId)} className="w-full py-1.5 bg-red-650 hover:bg-red-600 text-white rounded text-[10px] font-bold uppercase cursor-pointer mt-1">Establecer</button>
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="text-zinc-500 text-[10px] uppercase font-bold block">Compensar / Reducir Expiración (Horas):</label>
                    <div className="flex gap-2">
                      <input type="number" min={1} value={editCooldownHours} onChange={e => setEditCooldownHours(Number(e.target.value))} className="w-24 bg-zinc-950 border border-zinc-800 p-2 rounded text-white text-xs outline-none text-center font-bold"/>
                      <button onClick={() => handleEditExpiration(selectedAssetId, 'ADD')} className="px-3 py-2 bg-emerald-950 border border-emerald-800 text-emerald-400 text-[10px] font-bold rounded cursor-pointer">+ Añadir Horas</button>
                      <button onClick={() => handleEditExpiration(selectedAssetId, 'SUBTRACT')} className="px-3 py-2 bg-red-950 border border-red-800 text-red-400 text-[10px] font-bold rounded cursor-pointer">- Restar Horas</button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* VISTA 2: HISTORIAL Y COMISIONES */}
      {viewTab === 'transactions' && (
        <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4 animate-fadeIn">
          <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
            <span className="text-xs font-bold uppercase text-zinc-400">
              Bitácora de Transacciones Realizadas ({transactions.length})
            </span>
          </div>

          <div className="space-y-2">
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-zinc-600 border border-dashed border-zinc-900 rounded-lg">
                No hay transacciones registradas en el historial.
              </div>
            ) : (
              transactions.map(tx => (
                <div key={tx.id} className="p-3 bg-zinc-900/30 border border-zinc-850 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs">{tx.buyerName}</span>
                      <ArrowRight size={12} className="text-zinc-600" />
                      <span className="font-bold text-zinc-300 text-xs">{tx.sellerName}</span>
                    </div>
                    <span className="text-[9px] text-zinc-500 font-mono block mt-0.5">
                      TX: {tx.id} • {new Date(tx.purchasedAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-6 text-right font-mono text-xs">
                    <div>
                      <span className="text-[8px] text-zinc-500 uppercase block">Bruto</span>
                      <strong className="text-amber-400">{tx.grossPrice.toLocaleString('es-ES')} GD</strong>
                    </div>
                    <div>
                      <span className="text-[8px] text-zinc-500 uppercase block">Comisión</span>
                      <strong className="text-emerald-400">+{tx.feeApplied.toLocaleString('es-ES')} GD</strong>
                    </div>
                    <div>
                      <span className="text-[8px] text-zinc-500 uppercase block">Neto Vendedor</span>
                      <strong className="text-zinc-300">{tx.netToSeller.toLocaleString('es-ES')} GD</strong>
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
        <div className="bg-zinc-950 border border-amber-900/40 rounded-xl p-5 space-y-4 animate-fadeIn">
          <div className="flex items-center gap-2 text-amber-500 font-bold uppercase text-xs border-b border-zinc-900 pb-3">
            <AlertTriangle size={16} />
            <span>Operaciones de Alto Volumen (&gt;={siphonThreshold.toLocaleString('es-ES')} GD)</span>
          </div>

          <div className="space-y-3">
            {flaggedTxs.length === 0 ? (
              <div className="text-center py-8 text-zinc-600 border border-dashed border-zinc-850 rounded-lg">
                No se detectan movimientos sospechosos por encima del umbral anti-sifón.
              </div>
            ) : (
              flaggedTxs.map(tx => (
                <div key={tx.id} className="p-4 bg-amber-950/10 border border-amber-900/40 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-400 text-[8px] font-bold border border-amber-800 uppercase">
                      Alerta Sifón Activada
                    </span>
                    <h4 className="font-bold text-white mt-1 text-xs">
                      {tx.buyerName} transfirió {tx.grossPrice.toLocaleString('es-ES')} GD a {tx.sellerName}
                    </h4>
                    <span className="text-[9px] text-zinc-500 font-mono block">
                      Comisión cobrada: +{tx.feeApplied.toLocaleString('es-ES')} GD • Fecha: {new Date(tx.purchasedAt).toLocaleString()}
                    </span>
                  </div>

                  <button 
                    onClick={() => setIsAlertToShow({ show: true, status: 'warning', message: `Expediente de sanción abierto para ${tx.sellerName}` })}
                    className="px-3 py-1.5 bg-red-650 hover:bg-red-600 text-white font-bold uppercase rounded text-[10px] cursor-pointer"
                  >
                    Auditar Vendedor
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* VISTA 4: INYECTOR PUSH PERSISTENTE */}
      {viewTab === 'push_notifications' && (
        <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-5 animate-fadeIn">
          <div className="border-b border-zinc-900 pb-3">
            <span className="text-xs font-bold uppercase text-zinc-300 flex items-center gap-2">
              <Mail size={14} className="text-red-500" /> Transmisión Directa de Alertas a Jugadores (Persistente en DB)
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-1.5 relative">
                <label className="text-[10px] text-zinc-500 uppercase font-bold block">Buscar Destinatario:</label>
                <input
                  type="text"
                  placeholder="Escribe el nombre o UID del comandante..."
                  value={selectedRecipient ? `${selectedRecipient.username} (${selectedRecipient.id})` : pushRecipientSearch}
                  onChange={e => {
                    setSelectedRecipient(null);
                    setPushRecipientSearch(e.target.value);
                  }}
                  className="w-full bg-black border border-zinc-900 p-2 rounded text-white text-xs outline-none focus:border-red-500 uppercase"
                />

                {filteredUsersForPush.length > 0 && !selectedRecipient && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl z-50 divide-y divide-zinc-900">
                    {filteredUsersForPush.map(u => (
                      <div
                        key={u.id}
                        onClick={() => {
                          setSelectedRecipient(u);
                          setPushRecipientSearch('');
                        }}
                        className="p-2 hover:bg-zinc-900 cursor-pointer flex justify-between items-center text-xs"
                      >
                        <span className="font-bold text-white">{u.username}</span>
                        <span className="text-[10px] text-zinc-500 font-mono">{u.id.substring(0, 10)}...</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 uppercase font-bold block">Categoría de Mensaje:</label>
                  <select
                    value={pushCategory}
                    onChange={e => setPushCategory(e.target.value as any)}
                    className="w-full bg-black border border-zinc-900 p-2 rounded text-white text-xs cursor-pointer outline-none"
                  >
                    <option value="ALERT">🚨 Alerta Militar</option>
                    <option value="PURCHASE">🛒 Compra Realizada</option>
                    <option value="RETURN">🔄 Devolución</option>
                    <option value="OUTBID">⚡ Puja Superada</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 uppercase font-bold block">Asunto:</label>
                  <input
                    type="text"
                    value={pushSubject}
                    onChange={e => setPushSubject(e.target.value)}
                    className="w-full bg-black border border-zinc-900 p-2 rounded text-white text-xs outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-zinc-500 uppercase font-bold block">Cuerpo del Comunicado:</label>
                <textarea
                  rows={3}
                  value={pushBody}
                  onChange={e => setPushBody(e.target.value)}
                  placeholder="Detalles de la alerta..."
                  className="w-full bg-black border border-zinc-900 p-2 rounded text-white text-xs outline-none font-sans"
                />
              </div>

              <button
                onClick={handleSendManualPush}
                disabled={isSendingPush || !selectedRecipient}
                className="w-full py-2.5 bg-red-650 hover:bg-red-600 disabled:opacity-40 text-white font-bold uppercase rounded-lg text-xs cursor-pointer shadow-lg flex items-center justify-center gap-2"
              >
                {isSendingPush ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
                Transmitir Alerta a Bóveda del Jugador
              </button>
            </div>

            <div className="bg-black/50 border border-zinc-900 rounded-xl p-4 space-y-3">
              <span className="text-[10px] text-zinc-500 uppercase font-bold block border-b border-zinc-900 pb-2">
                Historial de Alertas Transmitidas en Base de Datos ({pushedMessages.length})
              </span>
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                {pushedMessages.length === 0 ? (
                  <span className="text-zinc-600 text-[10px] italic">No hay alertas recientes en el servidor.</span>
                ) : (
                  pushedMessages.map(pm => (
                    <div key={pm.id} className="p-2.5 bg-zinc-950 border border-zinc-900 rounded-lg text-[10px]">
                      <div className="flex justify-between font-bold text-zinc-300">
                        <span>Para: {pm.recipientName}</span>
                        <span className="text-red-400">[{pm.category}]</span>
                      </div>
                      <p className="text-zinc-400 font-sans mt-1">{pm.body}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}