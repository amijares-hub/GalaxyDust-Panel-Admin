import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building, Search, Shield, Zap, AlertTriangle, Play, RefreshCw, 
  Trash2, Send, Clock, Radio, Power, Eye, Lock, Unlock, Sliders,
  HelpCircle, Sparkles, Coins, DollarSign, Hammer, Mail, FileText,
  CheckCircle, XCircle, ArrowRight, EyeOff, Clipboard, TrendingUp, AlertCircle, Download
} from 'lucide-react';
import { UserProfile, InventoryItem } from '../types';
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
  basePrice: number; // buy-out or base bid price
  currentBid: number; // dynamic updated bid for auctions
  hpCurrent: number;
  hpMax: number;
  isEquipped: boolean;
  onActiveExpedition: boolean;
  expiresAt: string; // ISO string Cooldown
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
  
  // 1. STATEFUL SEED DATA for published assets list
  const [marketAssets, setMarketAssets] = useState<MarketAsset[]>(() => [
    {
      id: "MKT-081",
      name: "Kalvac GalaxyBlade MK-IV",
      category: "Spaceships",
      rarity: "legendary",
      isAuction: true,
      sellerId: "usr-01",
      sellerName: "Cmdr. Roger Vance",
      basePrice: 42000,
      currentBid: 51000,
      hpCurrent: 12500,
      hpMax: 12530,
      isEquipped: false,
      onActiveExpedition: false,
      expiresAt: new Date(Date.now() + 1000 * 3600 * 18).toISOString(), // expires in 18 hrs
      bidCount: 4
    },
    {
      id: "MKT-119",
      name: "Tachyon Core Reactor",
      category: "Technology",
      rarity: "epic",
      isAuction: false,
      sellerId: "usr-02",
      sellerName: "Captain Sarah Chen",
      basePrice: 15500,
      currentBid: 0,
      hpCurrent: 800,
      hpMax: 8000, // damaged item for testing (10% HP)
      isEquipped: false,
      onActiveExpedition: false,
      expiresAt: new Date(Date.now() + 1000 * 3600 * 5).toISOString(), // expires in 5 hours
      bidCount: 0
    },
    {
      id: "MKT-234",
      name: "Orbital Siphon Alpha",
      category: "Structures",
      rarity: "rare",
      isAuction: true,
      sellerId: "usr-03",
      sellerName: "Astraeus Nova",
      basePrice: 8500,
      currentBid: 9900,
      hpCurrent: 4300,
      hpMax: 4500,
      isEquipped: false,
      onActiveExpedition: false,
      expiresAt: new Date(Date.now() + 1000 * 1800).toISOString(), // expires in 30 mins
      bidCount: 2
    },
    {
      id: "MKT-449",
      name: "AstroBot Navigator VII",
      category: "Technology",
      rarity: "epic",
      isAuction: false,
      sellerId: "usr-01",
      sellerName: "Cmdr. Roger Vance",
      basePrice: 19000,
      currentBid: 0,
      hpCurrent: 442,
      hpMax: 500,
      isEquipped: true, // Equipped to flight for testing rules
      onActiveExpedition: true,
      expiresAt: new Date(Date.now() + 1000 * 3600 * 48).toISOString(),
      bidCount: 0
    },
    {
      id: "MKT-552",
      name: "Dreadnought Hull Plating",
      category: "Blueprints",
      rarity: "uncommon",
      isAuction: false,
      sellerId: "usr-04",
      sellerName: "Zeta Devastator",
      basePrice: 3200,
      currentBid: 0,
      hpCurrent: 1400,
      hpMax: 1400,
      isEquipped: false,
      onActiveExpedition: false,
      expiresAt: new Date(Date.now() + 1000 * 3600 * 24).toISOString(),
      bidCount: 0
    }
  ]);

  // Bid tracker state for simulated bid histories
  const [bids, setBids] = useState<BidEntry[]>(() => [
    { id: "BID-a1", auctionId: "MKT-081", bidderId: "usr-02", bidderName: "Captain Sarah Chen", amountGd: 44000, timestamp: new Date(Date.now() - 3600 * 4000).toISOString() },
    { id: "BID-a2", auctionId: "MKT-081", bidderId: "usr-03", bidderName: "Astraeus Nova", amountGd: 46500, timestamp: new Date(Date.now() - 3600 * 3200).toISOString() },
    { id: "BID-a3", auctionId: "MKT-081", bidderId: "usr-02", bidderName: "Captain Sarah Chen", amountGd: 49000, timestamp: new Date(Date.now() - 3600 * 1500).toISOString() },
    { id: "BID-a4", auctionId: "MKT-081", bidderId: "usr-04", bidderName: "Zeta Devastator", amountGd: 51000, timestamp: new Date(Date.now() - 1200 * 1000).toISOString() },
    
    { id: "BID-b1", auctionId: "MKT-234", bidderId: "usr-01", bidderName: "Cmdr. Roger Vance", amountGd: 9000, timestamp: new Date(Date.now() - 3600 * 800).toISOString() },
    { id: "BID-b2", auctionId: "MKT-234", bidderId: "usr-04", bidderName: "Zeta Devastator", amountGd: 9900, timestamp: new Date(Date.now() - 1000 * 600).toISOString() }
  ]);

  // Current view selected auction item for the Bid Tracker module
  const [selectedAuctionId, setSelectedAuctionId] = useState<string>("MKT-081");

  // Input states for editing/modifying
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [editPriceValue, setEditPriceValue] = useState<number>(0);
  const [editCooldownHours, setEditCooldownHours] = useState<number>(4);

  // New states for compliance and quick views
  const [forceTakedownOnActiveExpedition, setForceTakedownOnActiveExpedition] = useState<boolean>(true);
  const [quickViewAssetId, setQuickViewAssetId] = useState<string | null>(null);

  // New filters for global search & filters in Live Market Grid
  const [rarityFilter, setRarityFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [minPriceFilter, setMinPriceFilter] = useState<number>(0);

  // 3. CORE VALIDATION RULES
  const [canLockActive, setCanLockActive] = useState<boolean>(true); // Prohibits equipped or flying assets listing
  const [durabilityFilterActive, setDurabilityFilterActive] = useState<boolean>(true); // impides listing damaged items HP <= 10%
  const [categoryLocks, setCategoryLocks] = useState<Record<string, boolean>>({
    Spaceships: false,
    Structures: false,
    Technology: false,
    Badges: false,
    Blueprints: false,
    Consumables: false
  });

  // Recycler and Container states have been moved to AdminAssetMatrixModule

  // 4. ECONOMY STATS & AUDIT LOGS WITH WASH TRADING ALERTS
  const [marketTaxPercent, setMarketTaxPercent] = useState<number>(2.5); // Default transaction tax/commission
  const [auditLogs, setAuditLogs] = useState<MarketAuditLog[]>(() => [
    {
      id: "LOG-MKT-901",
      timestamp: new Date(Date.now() - 1000 * 50).toISOString(),
      playerId: "usr-05",
      playerName: "Shadow Trader A",
      buyerId: "usr-06",
      buyerName: "Shadow Trader B",
      actionType: "PURCHASE",
      assetName: "Anomalous Laser Grid",
      amount: 49500,
      taxCollected: 1237.5,
      isWashTradingAlert: true // Highlight in yellow (frequent purchases back and forth)
    },
    {
      id: "LOG-MKT-895",
      timestamp: new Date(Date.now() - 1000 * 600).toISOString(),
      playerId: "usr-02",
      playerName: "Captain Sarah Chen",
      actionType: "LIST",
      assetName: "Tachyon Core Reactor",
      amount: 15500,
      taxCollected: 0,
      isWashTradingAlert: false
    },
    {
      id: "LOG-MKT-884",
      timestamp: new Date(Date.now() - 1000 * 1800).toISOString(),
      playerId: "usr-06",
      playerName: "Shadow Trader B",
      buyerId: "usr-05",
      buyerName: "Shadow Trader A",
      actionType: "PURCHASE",
      assetName: "Anomalous Laser Grid",
      amount: 48000,
      taxCollected: 1200,
      isWashTradingAlert: true // Wash trading match detected!
    },
    {
      id: "LOG-MKT-871",
      timestamp: new Date(Date.now() - 1000 * 3600).toISOString(),
      playerId: "usr-01",
      playerName: "Cmdr. Roger Vance",
      buyerId: "usr-03",
      buyerName: "Astraeus Nova",
      actionType: "PURCHASE",
      assetName: "Refined Lunar Crystals",
      amount: 8200,
      taxCollected: 205,
      isWashTradingAlert: false
    },
    {
      id: "LOG-MKT-860",
      timestamp: new Date(Date.now() - 1000 * 7200).toISOString(),
      playerId: "usr-03",
      playerName: "Astraeus Nova",
      actionType: "TAKEDOWN",
      assetName: "Proximity Mine-Layer Beta #1",
      amount: 4000,
      taxCollected: 0,
      isWashTradingAlert: false
    }
  ]);

  // 5. INBOX COMMUNICATION TRANSACTIONAL PUSH
  const [pushRecipientId, setPushRecipientId] = useState<string>("usr-01");
  const [pushSubject, setPushSubject] = useState<string>("ALERTA DEL SISTEMA: Transacción autorizada");
  const [pushBody, setPushBody] = useState<string>("Su nave StarStriker ha sido vendida por 25,000 GD Coins. Comisión del 2% descontada.");
  const [pushCategory, setPushCategory] = useState<'ALERT' | 'PURCHASE' | 'RETURN' | 'OUTBID'>("ALERT");
  const [pushedMessages, setPushedMessages] = useState<InboxMarketPushMessage[]>(() => [
    {
      id: "PUSH-1",
      recipientId: "usr-01",
      recipientName: "Cmdr. Roger Vance",
      subject: "Subasta Expirada sin Comprador",
      body: "Tu subasta ha finalizado sin compradores. Nave retornada a tu hangar orbital de forma segura.",
      category: "RETURN",
      timestamp: new Date(Date.now() - 1000 * 1200).toISOString(),
      isSent: true
    },
    {
      id: "PUSH-2",
      recipientId: "usr-04",
      recipientName: "Zeta Devastator",
      subject: "¡Te han superado en la puja!",
      body: "Te han superado en la puja por Kalvac GalaxyBlade MK-IV. Tus 49,000 GD Coins retenidos han sido reembolsados.",
      category: "OUTBID",
      timestamp: new Date(Date.now() - 1000 * 2400).toISOString(),
      isSent: true
    }
  ]);

  // Filter state for active list view
  const [marketFilter, setMarketFilter] = useState<'ALL' | 'DIRECT' | 'AUCTION'>('ALL');
  const [searchParam, setSearchParam] = useState<string>('');

  // Auto-fill templates inside message push module
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

  // ACTIONS DEFINED UNDER COMPLIANCE FLOW
  
  // A. Cooldown duration edit
  const handleEditExpiration = (assetId: string, action: 'ADD' | 'SUBTRACT') => {
    const hours = editCooldownHours || 1;
    setMarketAssets(prev => prev.map(a => {
      if (a.id === assetId) {
        const currentExp = new Date(a.expiresAt).getTime();
        const delta = 1000 * 3600 * hours;
        const newTime = action === 'ADD' ? currentExp + delta : currentExp - delta;
        
        setIsAlertToShow({
          show: true,
          status: 'success',
          message: `¡Se compensó el tiempo de expiración para ${a.id}: ${action === 'ADD' ? '+' : '-'}${hours} horas!`
        });
        
        return { ...a, expiresAt: new Date(newTime).toISOString() };
      }
      return a;
    }));
  };

  // B. Edit Pricing
  const handleEditPrice = (assetId: string) => {
    if (editPriceValue <= 0) {
      setIsAlertToShow({
        show: true,
        status: 'error',
        message: 'Por favor, introduce un precio válido mayor a 0 GD Coins.'
      });
      return;
    }

    setMarketAssets(prev => prev.map(a => {
      if (a.id === assetId) {
        const oldPrice = a.isAuction ? a.currentBid : a.basePrice;
        const priceLabel = a.isAuction ? "Puja Actual" : "Precio Base Directo";
        
        setIsAlertToShow({
          show: true,
          status: 'success',
          message: `Precio actualizado en ${a.id}: de ${oldPrice} ➔ ${editPriceValue} GD.`
        });

        // Trigger Log entry
        const newLog: MarketAuditLog = {
          id: `LOG-MKT-EDIT-${Date.now()}`,
          timestamp: new Date().toISOString(),
          playerId: "admin-system",
          playerName: "Amijares (Admin)",
          actionType: "LIST",
          assetName: `ALTERACIÓN DE PRECIO [${a.name}] (Prev: ${oldPrice} GD)`,
          amount: editPriceValue,
          taxCollected: 0,
          isWashTradingAlert: false
        };
        setAuditLogs(prev => [newLog, ...prev]);

        if (a.isAuction) {
          return { ...a, currentBid: editPriceValue };
        } else {
          return { ...a, basePrice: editPriceValue };
        }
      }
      return a;
    }));
    setSelectedAssetId(null);
  };

  // C. Force Cancellation and return is processed properly
  const handleForceTakedown = (assetId: string) => {
    const target = marketAssets.find(a => a.id === assetId);
    if (!target) return;

    setIsAlertToShow({
      show: true,
      status: 'error',
      message: `¡ALERTA ANTIFRAUDE! Publicación ${assetId} cancelada forzosamente. Asset devuelto de inmediato al comandante ${target.sellerName}.`
    });

    // Create log entry for audit and rollback
    const newLog: MarketAuditLog = {
      id: `LOG-MKT-BURN-${Date.now().toString(36)}`,
      timestamp: new Date().toISOString(),
      playerId: target.sellerId,
      playerName: target.sellerName,
      actionType: "TAKEDOWN",
      assetName: `TAKEDOWN FORZOSO: ${target.name}`,
      amount: target.isAuction ? target.currentBid : target.basePrice,
      taxCollected: 0,
      isWashTradingAlert: false
    };

    setAuditLogs(prev => [newLog, ...prev]);

    // Send transaction inbox msg automatic push
    const autoPush: InboxMarketPushMessage = {
      id: `PUSH-AUTO-${Date.now()}`,
      recipientId: target.sellerId,
      recipientName: target.sellerName,
      subject: "CANCELACIÓN DE MERCADO POR ADMINISTRACIÓN",
      body: `Su publicación del item '${target.name}' ha sido purgada preventivamente del mercado por auditoría interna de Sasorilabs. El activo ha sido reincorporado a su billetera.`,
      category: "RETURN",
      timestamp: new Date().toISOString(),
      isSent: true
    };
    setPushedMessages(prev => [autoPush, ...prev]);

    setMarketAssets(prev => prev.filter(a => a.id !== assetId));
  };

  // Automated compliance rule execute: Force Takedown of items with onActiveExpedition === true
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

    suspectAssets.forEach(target => {
      const newLog: MarketAuditLog = {
        id: `LOG-AUTO-TAKEDOWN-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: new Date().toISOString(),
        playerId: target.sellerId,
        playerName: target.sellerName,
        actionType: "TAKEDOWN",
        assetName: `AUTO-TAKEDOWN [En Expedición Vuelo]: ${target.name}`,
        amount: target.isAuction ? target.currentBid : target.basePrice,
        taxCollected: 0,
        isWashTradingAlert: false
      };

      const autoPush: InboxMarketPushMessage = {
        id: `PUSH-AUTO-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        recipientId: target.sellerId,
        recipientName: target.sellerName,
        subject: "MERCADO: AUTO-BAJA POR EXPEDICIÓN ACTIVA",
        body: `Su active '${target.name}' ha sido retirado automáticamente del mercado debido a que ingresó a una Expedición de Vuelo activa.`,
        category: "RETURN",
        timestamp: new Date().toISOString(),
        isSent: true
      };

      setAuditLogs(prev => [newLog, ...prev]);
      setPushedMessages(prev => [autoPush, ...prev]);
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

  // D. Cancel specific fraudlent bid without breaking entire auction
  const handleRevokeBid = (bidId: string) => {
    const targetBid = bids.find(b => b.id === bidId);
    if (!targetBid) return;

    // Remove bid entry and find parent auction to downgrade currentBid
    setBids(prev => prev.filter(b => b.id !== bidId));
    
    setMarketAssets(prev => prev.map(a => {
      if (a.id === targetBid.auctionId) {
        // Look for the next highest remaining bid
        const remainBids = bids.filter(b => b.auctionId === a.id && b.id !== bidId);
        const nextHighest = remainBids.length > 0 
          ? Math.max(...remainBids.map(b => b.amountGd)) 
          : a.basePrice;

        setIsAlertToShow({
          show: true,
          status: 'success',
          message: `Puja de ${targetBid.bidderName} por ${targetBid.amountGd} GD revocada. Balances retenidos liberados.`
        });

        return {
          ...a,
          currentBid: nextHighest,
          bidCount: Math.max(0, a.bidCount - 1)
        };
      }
      return a;
    }));

    // Save logs
    const newLog: MarketAuditLog = {
      id: `LOG-REVOKE-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      playerId: targetBid.bidderId,
      playerName: targetBid.bidderName,
      actionType: "REVOKED_BID",
      assetName: `ANULACIÓN DE PUJA - Puja revocada para subasta ID ${targetBid.auctionId}`,
      amount: targetBid.amountGd,
      taxCollected: 0,
      isWashTradingAlert: false
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // E. Force closure and reward top bidder
  const handleForceWin = (assetId: string) => {
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
    const taxAmt = Math.round(wonPrice * (marketTaxPercent / 100));

    setIsAlertToShow({
      show: true,
      status: 'success',
      message: `¡Subasta finalizada por control admin en caliente! Se liquida victoria de ${buyerLabel} por ${wonPrice} GD.`
    });

    // Logging settlement
    const newLog: MarketAuditLog = {
      id: `SETTLE-${Date.now()}`,
      timestamp: new Date().toISOString(),
      playerId: target.sellerId,
      playerName: target.sellerName,
      buyerId: highestBid ? highestBid.bidderId : undefined,
      buyerName: highestBid ? highestBid.bidderName : undefined,
      actionType: "FORCE_WIN",
      assetName: `CIERRE EXPRÉS: ${target.name}`,
      amount: wonPrice,
      taxCollected: taxAmt,
      isWashTradingAlert: false
    };
    setAuditLogs(prev => [newLog, ...prev]);

    // Send inbox push messages inside the system
    if (highestBid) {
      const winnerPush: InboxMarketPushMessage = {
        id: `PUSH-WIN-${Date.now()}`,
        recipientId: highestBid.bidderId,
        recipientName: highestBid.bidderName,
        subject: "¡Adjudicación de Subasta Exitosa!",
        body: `Felicidades: Has ganado la subasta por '${target.name}' por ${wonPrice} GD. El item ha sido inyectado a tu cabina.`,
        category: "PURCHASE",
        timestamp: new Date().toISOString(),
        isSent: true
      };
      
      const sellerPush: InboxMarketPushMessage = {
        id: `PUSH-SELL-${Date.now().toString(36)}`,
        recipientId: target.sellerId,
        recipientName: target.sellerName,
        subject: "Subasta Liquidada por Mando de Control",
        body: `Su subasta por '${target.name}' ha finalizado con éxito. Recibe ${wonPrice - taxAmt} GD (Impuestos del ${marketTaxPercent}% deducidos).`,
        category: "PURCHASE",
        timestamp: new Date().toISOString(),
        isSent: true
      };
      setPushedMessages(prev => [winnerPush, sellerPush, ...prev]);
    }

    setMarketAssets(prev => prev.filter(a => a.id !== assetId));
  };

  // F. Trigger return engine for expired items
  const handleTriggerReturnEngine = () => {
    // Process items that expired in the list
    setIsAlertToShow({
      show: true,
      status: 'success',
      message: 'Ejecutando Cron-Job manual de retornos del mercado de Sasorilabs.io...'
    });

    const nowTime = Date.now();
    const expired = marketAssets.filter(a => new Date(a.expiresAt).getTime() < nowTime);

    if (expired.length === 0) {
      setIsAlertToShow({
        show: true,
        status: 'success',
        message: 'Cron-Job Completado: Ningún item vencido sin procesar en la caché.'
      });
      return;
    }

    // Return expired items to sellers
    expired.forEach(a => {
      const newRetLog: MarketAuditLog = {
        id: `CRON-RET-${Math.random()}`,
        timestamp: new Date().toISOString(),
        playerId: a.sellerId,
        playerName: a.sellerName,
        actionType: "EXPIRED_RETURN",
        assetName: `RETORNO AUTOMÁTICO: ${a.name} (Vencido)`,
        amount: 0,
        taxCollected: 0,
        isWashTradingAlert: false
      };

      setAuditLogs(prev => [newRetLog, ...prev]);

      const returnPush: InboxMarketPushMessage = {
        id: `CRON-PUSH-${Math.random()}`,
        recipientId: a.sellerId,
        recipientName: a.sellerName,
        subject: "Publicación Expirada Procesada",
        body: `Tu item '${a.name}' no recibió ofertas o compras a tiempo. Ha sido retornado a tu hangar automáticamente por el Cron-Job de Sasorilabs.`,
        category: "RETURN",
        timestamp: new Date().toISOString(),
        isSent: true
      };
      setPushedMessages(prev => [returnPush, ...prev]);
    });

    setMarketAssets(prev => prev.filter(a => new Date(a.expiresAt).getTime() >= nowTime));
    
    setIsAlertToShow({
      show: true,
      status: 'success',
      message: `¡Transacción finalizada! Se procesó el retorno legal para ${expired.length} publicaciones expiradas.`
    });
  };

  // CSV Audit log export compliance helper
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

    setIsAlertToShow({
      show: true,
      status: 'success',
      message: '¡Historial de auditoría fiscal P2P exportado exitosamente en formato CSV!'
    });
  };

  // JSON Backup of Pushed Mail messages for bulk processing
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

    setIsAlertToShow({
      show: true,
      status: 'success',
      message: '¡Cola de notificaciones push de mercado exportada como archivo JSON exitosamente!'
    });
  };

  // Helper to scan audit logs for high-frequency trading between specific pairs of players
  const getPairTradeCount = (p1: string, p2: string) => {
    if (!p1 || !p2) return 0;
    return auditLogs.filter(log => {
      if (log.actionType !== 'PURCHASE' && log.actionType !== 'FORCE_WIN') return false;
      const s = log.playerId;
      const b = log.buyerId;
      if (!s || !b) return false;
      return (s === p1 && b === p2) || (s === p2 && b === p1);
    }).length;
  };

  // Helper to retrieve Reputation Score of a user from audit logs
  const getReputationScore = (playerId: string) => {
    // Base is 100.
    // For each wash trading alert where they are involved, subtract 22 points to identify fraudulent activity.
    let score = 100;
    const userLogs = auditLogs.filter(log => log.playerId === playerId || log.buyerId === playerId);
    const alertsCount = userLogs.filter(log => log.isWashTradingAlert).length;
    score -= alertsCount * 22;
    // Also decrease reputation if they have bids revoked which could look spammy
    const revokedBidsCount = auditLogs.filter(log => log.playerId === playerId && log.actionType === 'REVOKED_BID').length;
    score -= revokedBidsCount * 12;
    return Math.max(5, Math.min(100, score));
  };

  // G. Manually send a transactional push message
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

  // Helper calculation for total revenue and logs metrics
  const totalGdVolumeLogs = auditLogs
    .filter(l => l.actionType === 'PURCHASE' || l.actionType === 'FORCE_WIN')
    .reduce((sum, log) => sum + log.amount, 0);

  const totalCollectedTaxes = auditLogs.reduce((sum, log) => sum + log.taxCollected, 0);

  // Filter listings values
  const filteredAssets = marketAssets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchParam.toLowerCase()) || 
                          asset.id.toLowerCase().includes(searchParam.toLowerCase()) ||
                          asset.sellerName.toLowerCase().includes(searchParam.toLowerCase());
    
    if (!matchesSearch) return false;
    
    // Type of list (all/direct/auction)
    if (marketFilter === 'DIRECT' && asset.isAuction) return false;
    if (marketFilter === 'AUCTION' && !asset.isAuction) return false;
    
    // Rarity filter
    if (rarityFilter !== 'ALL' && asset.rarity !== rarityFilter) return false;
    
    // Category filter
    if (categoryFilter !== 'ALL' && asset.category !== categoryFilter) return false;
    
    // Minimum price filter
    const activePrice = asset.isAuction ? asset.currentBid : asset.basePrice;
    if (activePrice < minPriceFilter) return false;
    
    return true;
  });

  const activeUsersCount = users ? (users.length > 0 ? users.length : 5) : 5;
  const listingsCount = marketAssets.length;
  const activityRatio = listingsCount / activeUsersCount;
  const isActivityLow = activityRatio < 0.8;

  return (
    <div className="space-y-6 font-sans">
      
      {/* HEADER PANEL FOR BRAND PRESENTATION */}
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
              
              {/* Health Indicator Badge */}
              <div className={`ml-1 md:ml-3 px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 border ${
                isActivityLow 
                  ? 'bg-amber-950/40 text-amber-500 border-amber-900/40 animate-pulse' 
                  : 'bg-emerald-950/40 text-emerald-400 border-emerald-900/40'
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${isActivityLow ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                SALUD P2P: {isActivityLow ? 'BAJA ACTIVIDAD' : 'ÓPTIMA'} (RATIO: {activityRatio.toFixed(2)})
              </div>
            </div>
            <p className="text-xs text-zinc-450 mt-1 leading-relaxed">
              Consola central de supervisión militar y administración económica para el mercado lúdico de <span className="text-[#ff1e1e] font-semibold">Sasorilabs.io</span>. Control de publicaciones directas, auditoría de fraude fiscal y comunicación directa.
            </p>
          </div>

          {/* Sub diagnostic summary bar */}
          <div className="mt-3.5 flex flex-wrap items-center gap-x-5 gap-y-1 text-[10px] font-mono text-zinc-500 border-t border-zinc-900/60 pt-2.5">
            <div className="flex items-center gap-1.5">
              <span>Listados en Red:</span>
              <span className="text-white font-bold">{listingsCount}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>Comandantes Registrados:</span>
              <span className="text-white font-bold">{activeUsersCount}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>Ratio Oferta/Usuario:</span>
              <span className={`font-bold ${isActivityLow ? 'text-amber-500' : 'text-emerald-450'}`}>
                {activityRatio.toFixed(2)} / user
              </span>
            </div>
            {isActivityLow && (
              <span className="text-amber-500 font-bold flex items-center gap-1 animate-pulse select-none">
                <AlertTriangle size={11} className="shrink-0 animate-bounce" />
                La liquidez del mercado ha caído. Incentive listados con contratos de expedición.
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-row md:flex-col justify-between items-end gap-2 md:self-center font-mono text-[10.5px] border-t md:border-t-0 md:border-l border-zinc-900/60 pt-3 md:pt-0 md:pl-4 shrink-0">
          <div className="flex gap-2">
            <div className="px-3 py-1.5 bg-zinc-950 border border-zinc-900 rounded text-center">
              <span className="text-zinc-550 block text-[8px] uppercase font-bold">Volumen Auditado</span>
              <span className="text-white font-extrabold text-xs">{totalGdVolumeLogs.toLocaleString()} GD</span>
            </div>
            <div className="px-3 py-1.5 bg-zinc-950 border border-zinc-900 rounded text-center">
              <span className="text-zinc-550 block text-[8px] uppercase font-bold">Impuestos Capturados</span>
              <span className="text-red-500 font-extrabold text-xs">+{totalCollectedTaxes.toLocaleString()} GD</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleTriggerReturnEngine}
            className="w-full px-3 py-1.5 bg-red-950/40 hover:bg-[#ff1e1e] text-zinc-300 hover:text-white border border-[#ff1e1e]/35 rounded transition-all cursor-pointer flex items-center justify-center gap-1.5 font-bold font-sans text-xs mt-1"
          >
            <RefreshCw size={11} className="shrink-0 animate-spin-slow" />
            Force Cron-Job
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
                  [ MODULE.01 ]: GRID EN VIVO DE MERCADO
                </span>
              </div>

              {/* Filtering Controls */}
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
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-550 shrink-0" />
              <input
                type="text"
                value={searchParam}
                onChange={(e) => setSearchParam(e.target.value)}
                placeholder="Buscar por nombre de activo, identificador de serie o vendedor..."
                className="w-full bg-black border border-zinc-900 pl-9 pr-4 py-2 rounded text-xs text-white focus:outline-none focus:border-red-500/50 font-mono transition-all placeholder:text-zinc-650"
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
                  <span className="absolute right-2 top-1.5 text-zinc-650 font-bold text-[9px]">GD</span>
                </div>
              </div>
            </div>

            {/* List Table container */}
            <div className="overflow-x-auto rounded border border-zinc-900/60 scrollbar-thin scrollbar-thumb-zinc-800 bg-black/40">
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
                        No hay ninguna publicación que concuerda con los criterios de búsqueda.
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
                          {/* Asset Name and rarity indicator */}
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
                                <span className="text-[10px] text-zinc-550">ID: {asset.id}</span>
                                <span className={`text-[8.5px] font-bold px-1 rounded ${
                                  asset.isAuction ? 'bg-indigo-950 text-indigo-400' : 'bg-emerald-950 text-emerald-400'
                                }`}>
                                  {asset.isAuction ? 'SUBASTA' : 'VENTA DIRECTA'}
                                </span>
                                {asset.isEquipped && (
                                  <span className="text-[8px] bg-red-950 text-red-500 border border-red-950 px-1 rounded">EQUIPADO</span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Seller info */}
                          <td className="p-3 text-zinc-300">
                            <span className="block font-semibold">{asset.sellerName}</span>
                            <span className="text-[9.5px] text-zinc-550 break-all">{asset.sellerId}</span>
                          </td>

                          {/* Category and HP */}
                          <td className="p-3">
                            <span className="text-zinc-450 block text-[11.5px]">{asset.category}</span>
                            <div className="flex items-center gap-1.2 mt-0.5">
                              <span className={`text-[9.5px] font-bold ${hpPercent <= 10 ? 'text-red-500 animate-pulse font-extrabold' : 'text-zinc-500'}`}>
                                HP: {hpPercent}%
                              </span>
                              <div className="w-12 h-1.5 bg-zinc-900 border border-zinc-850 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${hpPercent <= 10 ? 'bg-red-500' : 'bg-emerald-500'}`} 
                                  style={{ width: `${hpPercent}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Top Bid Count / Quick view trigger */}
                          <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                            {asset.isAuction ? (
                              <div className="flex flex-col items-center gap-1.5">
                                <span className="text-yellow-400 font-bold text-[11px] block">
                                  {asset.bidCount} {asset.bidCount === 1 ? 'puja' : 'pujas'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setQuickViewAssetId(asset.id)}
                                  className="px-2 py-0.5 bg-zinc-900 hover:bg-[#ff1e1e] text-zinc-300 hover:text-white border border-zinc-800 rounded font-sans cursor-pointer text-[9px] font-bold flex items-center gap-1 transition-all mx-auto"
                                >
                                  <Search size={9} />
                                  Quick View
                                </button>
                              </div>
                            ) : (
                              <span className="text-zinc-650 italic text-[10px]">Venta Directa</span>
                            )}
                          </td>

                          {/* Price columns */}
                          <td className="p-3 text-right">
                            {asset.isAuction ? (
                              <div className="flex flex-col items-end">
                                <span className="text-yellow-400 font-extrabold text-[12.5px]">{asset.currentBid.toLocaleString()} GD</span>
                                <span className="text-[9.5px] text-zinc-500 block">Offer: {asset.bidCount} bids</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-end">
                                <span className="text-[#ff1e1e] font-extrabold text-[12.5px]">{asset.basePrice.toLocaleString()} GD</span>
                                <span className="text-[9.5px] text-zinc-550 block">Buyout Limit</span>
                              </div>
                            )}
                          </td>

                          {/* Expire / Cooldown Timer */}
                          <td className="p-3">
                            <div className="flex flex-col text-[11px]">
                              {isExpired ? (
                                <span className="text-red-500 font-extrabold animate-pulse uppercase">EXPIRADO</span>
                              ) : (
                                <span className="text-zinc-350">{new Date(asset.expiresAt).toLocaleTimeString()}</span>
                              )}
                              <span className="text-[9.5px] text-zinc-550">{new Date(asset.expiresAt).toLocaleDateString()}</span>
                            </div>
                          </td>

                          {/* Action panel triggers */}
                          <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1.5">
                              
                              {/* Open interactive edit popup for this row */}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedAssetId(asset.id);
                                  setEditPriceValue(asset.isAuction ? asset.currentBid : asset.basePrice);
                                }}
                                title="Editar parámetros de precio o expiración"
                                className="p-1 px-2 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-350 hover:text-white border border-zinc-850 transition-all cursor-pointer text-[10px] font-bold"
                              >
                                Editar
                              </button>

                              {/* Force Takedown trigger */}
                              <button
                                type="button"
                                onClick={() => handleForceTakedown(asset.id)}
                                title="Forzar Cancelación preventiva (Devuelve el item)"
                                className="p-1.5 rounded bg-red-950/20 hover:bg-[#ff1e1e]/20 text-red-400 hover:text-[#ff1e1e] border border-red-500/10 hover:border-[#ff1e1e]/40 transition-all cursor-pointer flex items-center justify-center"
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

            {/* EXPIRATION & PRICING EDIT MODAL INNER COMPONENT */}
            <AnimatePresence>
              {selectedAssetId && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-black border border-zinc-900 rounded p-4 mt-2 space-y-3"
                >
                  <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                    <span className="text-[10px] text-zinc-400 font-bold font-mono uppercase tracking-wider block">
                      🔧 CONTROLES EXCLUSIVOS DE ADMINISTRADOR: {selectedAssetId}
                    </span>
                    <button 
                      onClick={() => setSelectedAssetId(null)}
                      className="text-zinc-500 hover:text-white cursor-pointer font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    
                    {/* Price edit block */}
                    <div className="space-y-1.5">
                      <label className="text-zinc-550 text-[10px] uppercase font-bold font-mono">Modificar Precio / Puja:</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={editPriceValue ?? 0}
                          onChange={(e) => setEditPriceValue(parseInt(e.target.value) || 0)}
                          className="w-full bg-zinc-950 border border-zinc-900 p-2 rounded text-[11px] text-yellow-400 font-bold font-mono focus:outline-none"
                        />
                        <span className="absolute right-2 top-2 text-[10px] text-zinc-600 font-bold">GD</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleEditPrice(selectedAssetId)}
                        className="w-full py-1.5 bg-[#ff1e1e] hover:bg-red-700 text-white rounded text-[10px] font-bold font-sans cursor-pointer transition-colors"
                      >
                        Establecer Precio
                      </button>
                    </div>

                    {/* Cooldown time compensated block */}
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-zinc-550 text-[10px] uppercase font-bold font-mono block">Editar Tiempo Expiración (Cooldown):</label>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <input
                            type="number"
                            value={editCooldownHours}
                            onChange={(e) => setEditCooldownHours(Math.max(1, parseInt(e.target.value) || 1))}
                            placeholder="Horas"
                            className="w-full bg-zinc-950 border border-zinc-900 p-2 rounded text-[11px] text-white font-mono focus:outline-none"
                          />
                        </div>
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
                      <p className="text-[9px] text-zinc-650 font-mono mt-1">
                        Utiliza esta acción para resarcir caídas no programadas del servidor aumentando el cronómetro.
                      </p>
                    </div>

                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* MODULE 2: GESTIÓN ESTRICTA DE SUBASTAS (AUCTION ENGINE) */}
        {activeSubTab === 'market_auctions' && (
          <div className="admin-auction-engine bg-zinc-950 border border-zinc-900 rounded-lg p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
              <div className="flex items-center gap-2">
                <Hammer size={16} className="text-[#ff1e1e] shrink-0 animate-pulse" />
                <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider block">
                  [ MODULE.02 ]: ANÁLISIS DE SUBASTAS ACTIVA — AUCTION BID TRACKER
                </span>
              </div>
              <span className="text-[9.5px] text-zinc-500 font-mono font-bold">
                SUBASTA EN FOCO: <span className="text-yellow-400">{selectedAuctionId}</span>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Auction stats summary (col 1) */}
              <div className="md:col-span-1 space-y-3 bg-black/40 border border-zinc-900/60 p-4 rounded-lg flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono block">Especificación de Subasta:</span>
                  {(() => {
                    const focusItem = marketAssets.find(a => a.id === selectedAuctionId);
                    if (!focusItem) return <p className="text-xs text-zinc-500 mt-2 italic">Ninguna subasta seleccionada. Selecciona una en la tabla superior.</p>;
                    
                    const timeLeftMs = new Date(focusItem.expiresAt).getTime() - Date.now();
                    const secondsTotal = Math.max(0, Math.floor(timeLeftMs / 1000));
                    const hours = Math.floor(secondsTotal / 3600);
                    const minutes = Math.floor((secondsTotal % 3600) / 60);
                    const seconds = secondsTotal % 60;

                    const focusBids = bids.filter(b => b.auctionId === selectedAuctionId);
                    const sortedFocusBids = [...focusBids].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                    const mostRecentBid = sortedFocusBids[0];
                    const bidAgeMs = mostRecentBid ? Date.now() - new Date(mostRecentBid.timestamp).getTime() : Infinity;
                    const isBidPlacedWithin5Mins = bidAgeMs < 5 * 60 * 1000;
                    const isTimeUnder5Mins = secondsTotal > 0 && secondsTotal < 5 * 60;
                    const isClosingInOnAuctionEnd = mostRecentBid && (new Date(focusItem.expiresAt).getTime() - new Date(mostRecentBid.timestamp).getTime() < 5 * 60 * 1000);

                    const showPulseWarning = isBidPlacedWithin5Mins || isTimeUnder5Mins || isClosingInOnAuctionEnd;

                    return (
                      <div className="mt-3 space-y-2.5 text-xs font-mono">
                        <div>
                          <span className="text-zinc-550 block text-[9.5px]">Activo:</span>
                          <span className="text-white font-bold block">{focusItem.name}</span>
                        </div>
                        <div>
                          <span className="text-zinc-550 block text-[9.5px]">Dueño Original:</span>
                          <span className="text-zinc-300 font-medium block">{focusItem.sellerName}</span>
                        </div>
                        <div>
                          <span className="text-zinc-550 block text-[9.5px]">Oferta Máxima Admin:</span>
                          <span className="text-yellow-400 font-extrabold block text-sm">{focusItem.currentBid.toLocaleString()} GD Coins</span>
                        </div>
                        <div>
                          <span className="text-zinc-550 block text-[9.5px]">Nº de Pujadores:</span>
                          <span className="text-zinc-300 block">{focusItem.bidCount}</span>
                        </div>
                        <div className="pt-1.5 border-t border-zinc-900/60">
                          <span className="text-zinc-550 block text-[9.5px]">Cronómetro de Subasta:</span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`text-sm font-extrabold tracking-wider ${
                              showPulseWarning ? 'text-red-500 animate-pulse' : 'text-zinc-300'
                            }`}>
                              {hours.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
                            </span>
                            {showPulseWarning && (
                              <span className="px-1.5 py-0.5 bg-red-950/80 text-[#ff1e1e] border border-red-900/50 text-[8px] font-bold rounded animate-pulse inline-flex items-center gap-1 font-sans">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#ff1e1e] animate-ping" />
                                EXTENSIÓN ACTIVA
                              </span>
                            )}
                          </div>
                          {showPulseWarning && (
                            <p className="text-[8.5px] text-red-400/80 font-sans leading-snug mt-1 max-w-[190px]">
                              ⚠️ Puja en últimos 5 min detectada. El tiempo de cierre se recalibra para evitar sniping.
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="pt-3 border-t border-zinc-900 space-y-2">
                  <button
                    type="button"
                    onClick={() => handleForceWin(selectedAuctionId)}
                    className="w-full px-4 py-2 bg-[#ff1e1e] hover:bg-red-700 text-white border border-[#ff1e1e]/60 rounded text-[9.5px] font-bold uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-1 cursor-pointer font-sans"
                  >
                    <CheckCircle size={10} />
                    Forzar Cierre & Liquidar
                  </button>
                  <p className="text-[8.5px] text-zinc-600 text-center font-mono leading-relaxed">
                    Finaliza el cronómetro en el acto, declarando ganador al postor más alto en este milisegundo.
                  </p>
                </div>
              </div>

              {/* Bid Historial Tracker (col 2 & 3) */}
              <div className="md:col-span-2 space-y-3 p-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center text-[10px] text-zinc-450 font-bold font-mono">
                    <span>HISTORIAL DE PUJAS EN COLA</span>
                    <span className="text-zinc-600">ID: {selectedAuctionId}</span>
                  </div>

                  <div className="bid-tracker-list space-y-2 max-h-[195px] overflow-y-auto pr-1 mt-2">
                  {(() => {
                    const activeBids = bids.filter(b => b.auctionId === selectedAuctionId).sort((a,b) => b.amountGd - a.amountGd);
                    if (activeBids.length === 0) {
                      return (
                        <div className="p-8 text-center italic text-zinc-600 bg-black/20 border border-zinc-900 rounded font-mono text-[11px]">
                          Esta subasta aún no cuenta con pujas de exploradores en el servidor de juego.
                        </div>
                      );
                    }

                    return activeBids.map((bid, index) => (
                      <div 
                        key={bid.id} 
                        className={`p-2.5 bg-black border rounded-lg flex items-center justify-between text-xs font-mono transition-all ${
                          index === 0 ? 'border-amber-500/30 bg-amber-950/5' : 'border-zinc-900'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {index === 0 ? (
                            <span className="h-5 w-5 rounded bg-amber-500/10 text-amber-400 flex items-center justify-center text-[10px] font-extrabold border border-amber-500/20">
                              TOP
                            </span>
                          ) : (
                            <span className="h-5 w-5 rounded bg-zinc-900 text-zinc-500 flex items-center justify-center text-[10px] border border-zinc-850">
                              #{index + 1}
                            </span>
                          )}
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-white font-bold block">{bid.bidderName}</span>
                              {(() => {
                                const score = getReputationScore(bid.bidderId);
                                const isFraud = score <= 60;
                                const isWarn = score > 60 && score <= 85;
                                return (
                                  <span className={`px-1.5 py-0.2 rounded-[3px] text-[8.5px] font-mono font-bold tracking-tight inline-block ${
                                    isFraud ? 'bg-red-950/50 text-red-500 border border-red-900/35 animate-pulse' :
                                    isWarn ? 'bg-amber-950/50 text-amber-400 border border-amber-900/30' :
                                    'bg-emerald-950/50 text-emerald-400 border border-emerald-900/30'
                                  }`}>
                                    REP: {score}% {isFraud ? '🚨 FRAUDE' : isWarn ? '⚠️ SOSPECHA' : '🛡️ OK'}
                                  </span>
                                );
                              })()}
                            </div>
                            <span className="text-[8.5px] text-zinc-550 block font-mono">{new Date(bid.timestamp).toLocaleTimeString()} • {bid.bidderId}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-yellow-400 font-extrabold text-[12px]">{bid.amountGd.toLocaleString()} GD</span>
                          <button
                            type="button"
                            onClick={() => handleRevokeBid(bid.id)}
                            title="Anular esta puja específica devolviendo sus reservas"
                            className="p-1 rounded bg-[#ff1e1e]/10 hover:bg-[#ff1e1e] text-[#ff1e1e] hover:text-white border border-[#ff1e1e]/20 transition-all cursor-pointer font-sans font-bold text-[9px]"
                          >
                            Anular Puja
                          </button>
                        </div>
                      </div>
                    ));
                  })()}
                  </div>
                </div>
              </div>

            </div>

            {/* Recharts Bidding History Chart */}
            <div className="border-t border-zinc-900/60 pt-4 mt-2">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono block mb-2">GRÁFICA DE ESCALADA DE VALOR (HISTORIAL DE PUJAS)</span>
              {(() => {
                const focusBids = bids.filter(b => b.auctionId === selectedAuctionId);
                const chartData = [...focusBids]
                  .sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                  .map((bid, bidx) => ({
                    index: bidx + 1,
                    name: `P #${bidx + 1}`,
                    bidder: bid.bidderName,
                    amount: bid.amountGd,
                    time: new Date(bid.timestamp).toLocaleTimeString()
                  }));

                if (chartData.length === 0) {
                  return (
                    <div className="p-6 text-center italic text-zinc-650 bg-black/10 border border-zinc-900/40 rounded font-mono text-[10.5px]">
                      Gráfica inactiva - Registre al menos una puja para visualizar la curva de valor económico.
                    </div>
                  );
                }

                return (
                  <div className="h-44 w-full text-xs font-mono">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={chartData}
                        margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#222227" vertical={false} />
                        <XAxis 
                          dataKey="name" 
                          stroke="#71717a" 
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis 
                          stroke="#71717a" 
                          tickLine={false} 
                          axisLine={false}
                          dx={-10}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a' }}
                          itemStyle={{ color: '#ff1e1e' }}
                          labelStyle={{ color: '#a1a1aa' }}
                          formatter={(value, name, props) => [`${value.toLocaleString()} GD`, `Oferta de ${props.payload.bidder || 'Desconocido'}`]}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="amount" 
                          stroke="#ff1e1e" 
                          strokeWidth={2} 
                          activeDot={{ r: 5 }}
                          dot={{ stroke: '#ff1e1e', strokeWidth: 1.5, r: 3, fill: '#09090b' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                );
              })()}
            </div>

          </div>
        )}

        {/* MODULE 3: FILTROS E INSERCIÓN RULES */}
        {activeSubTab === 'market_rules' && (
          <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
              <Sliders size={15} className="text-[#ff1e1e] shrink-0" />
              <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider block">
                [ MODULE.03 ]: REGLAS DE CONTROL DE ADMISIÓN
              </span>
            </div>

            <p className="text-[11px] text-zinc-500 font-sans leading-relaxed">
              Mando técnico de filtros automatizados que bloquean el listing de activos según el estado del jugador y la integridad de sus naves.
            </p>

            <div className="space-y-3.5 pt-2">
              
              {/* Rule toggle A: Flight lock */}
              <div className="flex items-start justify-between p-3 bg-black/40 border border-zinc-900 rounded-lg">
                <div className="space-y-1 pr-4">
                  <span className="text-[11.5px] text-white font-bold block">Candado Equipado / C.A.N.</span>
                  <p className="text-[9.5px] text-zinc-550 leading-normal font-sans">
                    Fuerza que el frontend prohíba listar naves, astrobots o insignias que estén equipadas en expediciones de vuelo activas.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCanLockActive(!canLockActive);
                    setIsAlertToShow({
                      show: true,
                      status: !canLockActive ? 'success' : 'error',
                      message: !canLockActive ? 'Candado de equipamiento en vuelo C.A.N activado.' : '¡Atención! Desconectando regla de equipamiento en caliente.'
                    });
                  }}
                  className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-205 focus:outline-none ${
                    canLockActive ? 'bg-[#ff1e1e]' : 'bg-zinc-800'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-205 ${
                    canLockActive ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Rule toggle B: Low durability block */}
              <div className="flex items-start justify-between p-3 bg-black/40 border border-zinc-900 rounded-lg">
                <div className="space-y-1 pr-4">
                  <span className="text-[11.5px] text-white font-bold block">Filtro de Baja Durabilidad (HP ≤ 10%)</span>
                  <p className="text-[9.5px] text-zinc-550 leading-normal font-sans">
                    Impide listar activos severamente dañados. Obliga al jugador a consumir un Repair Kit de Sasorilabs previo a la subasta.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDurabilityFilterActive(!durabilityFilterActive);
                    setIsAlertToShow({
                      show: true,
                      status: !durabilityFilterActive ? 'success' : 'error',
                      message: !durabilityFilterActive ? 'Bloqueo de items dañados habilitado.' : '¡Advertencia! Se permite listar naves rotas en el mercado.'
                    });
                  }}
                  className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-205 focus:outline-none ${
                    durabilityFilterActive ? 'bg-[#ff1e1e]' : 'bg-zinc-800'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-205 ${
                    durabilityFilterActive ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Rule toggle C: Expedition active forced takedown */}
              <div className="flex items-start justify-between p-3 bg-black/40 border border-zinc-900 rounded-lg">
                <div className="space-y-2 pr-4 font-sans text-xs flex-1">
                  <span className="text-[11.5px] text-white font-bold block">Consola Regulatoria de Expedición Activa</span>
                  <p className="text-[9.5px] text-zinc-550 leading-normal">
                    Si se activa, el sistema purgará automáticamente cualquier activo listado si su estado se detecta en expedición de vuelo activa (<span className="text-red-400 font-mono">onActiveExpedition: true</span>).
                  </p>
                  <button
                    type="button"
                    onClick={handleExecuteActiveExpeditionTakedowns}
                    className="px-2 py-1 bg-zinc-900 hover:bg-[#ff1e1e] text-zinc-300 hover:text-white border border-zinc-850 hover:border-[#ff1e1e]/40 rounded text-[9px] font-mono transition-all font-bold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>🔍 Escanear & Retirar Activos en Vuelo Ahora</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !forceTakedownOnActiveExpedition;
                    handleToggleActiveExpeditionTakedown(nextVal);
                  }}
                  className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-205 focus:outline-none ${
                    forceTakedownOnActiveExpedition ? 'bg-[#ff1e1e]' : 'bg-zinc-800'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-205 ${
                    forceTakedownOnActiveExpedition ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Rule toggle Group: Restricción de Categorías (Category Lock) */}
              <div className="border-t border-zinc-900 pt-3 space-y-2">
                <span className="text-[9px] font-mono text-zinc-500 font-bold uppercase tracking-wider block">
                  🛡️ CANDADOS DE CATEGORÍA DE MERCADO (ANTI-DUPING DAPP LOCK):
                </span>
                
                <div className="grid grid-cols-2 gap-2 mt-1.5 text-[10.5px]">
                  {Object.keys(categoryLocks).map(cat => {
                    const isLocked = categoryLocks[cat];
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setCategoryLocks(prev => ({ ...prev, [cat]: !isLocked }));
                          setIsAlertToShow({
                            show: true,
                            status: !isLocked ? 'error' : 'success',
                            message: !isLocked ? `Categoría '${cat}' bloqueada temporalmente del mercado.` : `Categoría '${cat}' habilitada.`
                          });
                        }}
                        className={`p-2 rounded border font-bold tracking-wide transition-all flex items-center justify-between cursor-pointer select-none ${
                          isLocked 
                            ? 'bg-red-950/20 border-red-900 text-red-400' 
                            : 'bg-zinc-900/40 border-zinc-900 hover:border-zinc-850 text-zinc-300'
                        }`}
                      >
                        <span className="truncate">{cat}</span>
                        {isLocked ? <Lock size={10} className="shrink-0 text-red-500" /> : <Unlock size={10} className="shrink-0 text-zinc-500" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Containers and Recycler UI moved to AdminAssetMatrixModule */}

            </div>
          </div>
        )}

        {/* MODULE 4: AUDITORÍA ECONÓMICA (P2P ECONOMY AUDIT) */}
        {activeSubTab === 'market_audit' && (
          <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-5 space-y-4 font-mono text-xs">
            <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
              <div className="flex items-center gap-2">
                <Eye size={15} className="text-[#ff1e1e] shrink-0" />
                <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider block">
                  [ MODULE.04 ]: AUDITORÍA ANTIFRAUDE & IMPUESTOS
                </span>
              </div>
              <button
                type="button"
                onClick={handleExportCSV}
                className="px-2.5 py-1 bg-zinc-900 hover:bg-[#ff1e1e] text-zinc-300 hover:text-white border border-zinc-800 hover:border-[#ff1e1e]/40 rounded text-[9.5px] font-sans font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
              >
                <Download size={11} />
                Exportar CSV
              </button>
            </div>

            {/* Tax manager block */}
            <div className="bg-black/40 border border-zinc-900/60 p-3.5 rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-zinc-400 font-bold uppercase block">Impuestos de Transacción P2P:</span>
                <span className="text-[#ff1e1e] font-extrabold text-[12.5px]">{marketTaxPercent}% GD</span>
              </div>
              <p className="text-[9px] text-zinc-550 leading-relaxed font-sans">
                Porcentaje de los GD Coins intercambiados en transacciones que se deduce automáticamente. Sasorilabs estipula un límite reglamentario de 2% a 5% de comisión comercial.
              </p>
              
              <div className="space-y-2">
                <input
                  type="range"
                  min="2"
                  max="5"
                  step="0.1"
                  value={marketTaxPercent}
                  onChange={(e) => setMarketTaxPercent(parseFloat(e.target.value) || 2)}
                  className="w-full h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-red-500"
                />
                
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      step="0.1"
                      min="2"
                      max="5"
                      value={marketTaxPercent}
                      onChange={(e) => {
                        let val = parseFloat(e.target.value);
                        if (isNaN(val)) val = 2;
                        // Clamp value between 2 and 5 for strict compliance boundaries
                        if (val < 2) val = 2;
                        if (val > 5) val = 5;
                        setMarketTaxPercent(val);
                      }}
                      className="w-full bg-zinc-950 border border-zinc-900 p-2 pr-6 rounded text-[11px] text-yellow-400 font-bold focus:outline-none"
                    />
                    <span className="absolute right-2 top-2 text-zinc-550 text-[10px] font-bold">%</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAlertToShow({
                        show: true,
                        status: 'success',
                        message: `¡Regulación fiscal guardada! Se aplicará la tasa de comisión comercial del ${marketTaxPercent}% en bitácoras futuras.`
                      });
                    }}
                    className="px-3 py-2 bg-zinc-900 hover:bg-[#ff1e1e] text-zinc-300 hover:text-white border border-zinc-850 hover:border-[#ff1e1e]/40 rounded text-[10.5px] transition-all cursor-pointer font-sans font-bold block shrink-0"
                  >
                    Grabar Tasa
                  </button>
                </div>
              </div>
            </div>

            {/* Wash trading security alert system and logs queue */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[10px] text-zinc-500 font-bold">
                <span>SEGURIDAD: WASH TRADING RADAR</span>
                <span className="text-amber-500 font-extrabold animate-pulse">🟡 SCAN ACTIVE</span>
              </div>

              <div className="space-y-2.5 max-h-[190px] overflow-y-auto pr-1">
                {auditLogs.map(log => {
                  const hasPairTradeHighFreq = log.buyerId && getPairTradeCount(log.playerId, log.buyerId) >= 2;
                  const isHighFrequencyAlert = log.isWashTradingAlert || hasPairTradeHighFreq;

                  return (
                    <div 
                      key={log.id} 
                      className={`p-2.5 rounded-lg border text-[10px] leading-relaxed transition-all ${
                        isHighFrequencyAlert
                          ? 'bg-amber-950/20 border-amber-500/40 shadow-xs'
                          : 'bg-black border-zinc-900/50'
                      }`}
                    >
                      <div className="flex justify-between items-center font-bold">
                        <span className={`px-1 rounded text-[8.5px] font-mono tracking-wider font-extrabold ${
                          log.actionType === 'PURCHASE' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/40' :
                          log.actionType === 'FORCE_WIN' ? 'bg-indigo-950/60 text-indigo-400 border border-indigo-900/40' :
                          log.actionType === 'REVOKED_BID' ? 'bg-red-950/60 text-red-500 border border-red-900/50 font-bold' :
                          'bg-zinc-900 text-zinc-400 border border-zinc-800'
                        }`}>
                          {log.actionType === 'REVOKED_BID' ? 'REVOKED_BID' : log.actionType}
                        </span>
                        
                        <div className="flex items-center gap-1.5">
                          {isHighFrequencyAlert && (
                            <AlertTriangle size={12} className="text-amber-400 shrink-0 fill-amber-400/10 animate-pulse" title="Alta frecuencia de tratos detectada entre este par" />
                          )}
                          <span className="text-zinc-550 font-normal">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </div>

                      <p className="text-zinc-200 mt-1.5 font-sans leading-normal">
                        Item: <span className="text-white font-bold">{log.assetName}</span> — <span className="text-yellow-400 font-bold">{log.amount.toLocaleString()} GD Coins</span>
                      </p>

                      <div className="flex justify-between items-center text-[8.5px] border-t border-zinc-900 pt-1.5 mt-1.5 text-zinc-500">
                        <span>Origen: {log.playerName}</span>
                        {log.buyerName && <span>Destino: {log.buyerName}</span>}
                      </div>

                      {isHighFrequencyAlert && (
                        <div className="flex items-center gap-1 mt-1.5 text-[8.5px] text-amber-500 font-extrabold bg-amber-500/5 p-1 rounded border border-amber-500/10">
                          <AlertTriangle size={10} className="shrink-0 animate-bounce" />
                          <span>ALERTA DE TRANSFERENCIA CRUZADA (WASH TRADING DETECTADO)</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* MODULE 5: COMUNICACIÓN TRANSACCIONAL (INBOX MARKET PUSH) */}
        {activeSubTab === 'market_inbox' && (
          <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <div className="flex items-center gap-2">
                <Mail size={15} className="text-[#ff1e1e] shrink-0" />
                <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider block">
                  [ MODULE.05 ]: COMUNICACIÓN TRANSACCIONAL INBOX
                </span>
              </div>
              
              {/* Inbox Export JSON tool button */}
              <button
                type="button"
                onClick={handleExportInboxJSON}
                className="px-2.5 py-1 bg-zinc-900 hover:bg-[#ff1e1e] text-zinc-300 hover:text-white border border-zinc-800 hover:border-[#ff1e1e]/40 rounded text-[9.5px] font-sans font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md select-none"
              >
                <Download size={11} />
                Exportar JSON
              </button>
            </div>

            <p className="text-[11px] text-zinc-500 font-sans leading-relaxed">
              Módulo directo para notificar en vivo en el buzón transaccional de un jugador sobre compras, devoluciones o penalidades sospechosas.
            </p>

            {/* Interactive Templates */}
            <div className="space-y-1.5">
              <span className="text-[8.5px] font-mono text-zinc-500 font-extrabold uppercase block">Auto-Inyectar Plantilla Base:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => fillMessageTemplate('EXPIRED_RETURN')}
                  className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-[9px] font-bold font-mono rounded cursor-pointer border border-zinc-850"
                >
                  🔁 Retorno Vencido
                </button>
                <button
                  type="button"
                  onClick={() => fillMessageTemplate('BUYOUT_SUCCESS')}
                  className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-[9px] font-bold font-mono rounded cursor-pointer border border-zinc-850"
                >
                  🟢 Compra Exitosa
                </button>
                <button
                  type="button"
                  onClick={() => fillMessageTemplate('OUTBID')}
                  className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-[9px] font-bold font-mono rounded cursor-pointer border border-zinc-850"
                >
                  🟡 Puja Superada
                </button>
              </div>
            </div>

            {/* Push Sender Inputs */}
            <div className="space-y-3 bg-black/40 border border-zinc-900 rounded p-3 text-xs">
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-550 block mb-1 text-[8.5px] uppercase font-bold font-mono">Jugador Recipiente:</label>
                  <select
                    value={pushRecipientId}
                    onChange={(e) => setPushRecipientId(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-900 p-1.5 rounded text-[10px] text-white focus:outline-none cursor-pointer font-mono"
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.username} ({u.role})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-zinc-550 block mb-1 text-[8.5px] uppercase font-bold font-mono">Categoría visual:</label>
                  <select
                    value={pushCategory}
                    onChange={(e) => setPushCategory(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-900 p-1.5 rounded text-[10px] text-white focus:outline-none cursor-pointer font-mono font-bold"
                  >
                    <option value="ALERT">🚨 SISTEMA (ALERT)</option>
                    <option value="PURCHASE">🛒 COMPRA (PURCHASE)</option>
                    <option value="RETURN">🔄 RETORNO (RETURN)</option>
                    <option value="OUTBID">⚠️ SUPERADO (OUTBID)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-zinc-550 block mb-1 text-[8.5px] uppercase font-bold font-mono">Asunto Mensaje:</label>
                <input
                  type="text"
                  value={pushSubject}
                  onChange={(e) => setPushSubject(e.target.value)}
                  placeholder="Escribe el asunto del envío..."
                  className="w-full bg-zinc-950 border border-zinc-900 p-2 rounded text-[10.5px] text-white focus:outline-none focus:border-red-500/50 font-mono"
                />
              </div>

              <div>
                <label className="text-zinc-550 block mb-1 text-[8.5px] uppercase font-bold font-mono">Cuerpo Informativo:</label>
                <textarea
                  value={pushBody}
                  onChange={(e) => setPushBody(e.target.value)}
                  placeholder="Detalles sobre las GD Coins deducidas o devoluciones..."
                  rows={2}
                  className="w-full bg-zinc-950 border border-zinc-900 p-2 rounded text-[10.5px] text-white focus:outline-none focus:border-red-500/50 font-mono"
                />
              </div>

              <button
                type="button"
                onClick={handleSendManualPush}
                className="w-full px-4 py-2 bg-[#ff1e1e] hover:bg-red-700 text-white border border-[#ff1e1e]/60 rounded text-[9.5px] font-bold uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer font-sans"
              >
                <Send size={11} />
                Inyectar Alerta de Mercado al Buzón
              </button>
            </div>

            {/* Historical System Pushed Alerts list */}
            <div className="space-y-2 border-t border-zinc-900 pt-3">
              <span className="text-[9.5px] font-mono text-zinc-500 font-bold uppercase block mb-1">Alertas Generadas Recientes:</span>
              <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                {pushedMessages.map(msg => (
                  <div key={msg.id} className="p-2.5 bg-black border border-zinc-900/80 rounded flex justify-between items-start text-[10px] font-mono">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          msg.category === 'PURCHASE' ? 'bg-emerald-500' :
                          msg.category === 'OUTBID' ? 'bg-amber-500' :
                          msg.category === 'RETURN' ? 'bg-indigo-500' : 'bg-red-500'
                        } shrink-0`} />
                        <span className="text-white font-extrabold">{msg.subject}</span>
                      </div>
                      <p className="text-zinc-400 font-sans text-[9.5px] leading-relaxed">{msg.body}</p>
                      <span className="text-zinc-550 text-[8.5px] block">Comandante: {msg.recipientName} • {new Date(msg.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        )}

        {/* MODULE 6: MARKET ANALYTICS */}
        {activeSubTab === 'market_analytics' && (() => {
          const baseVolumeData = [
            { day: '05-10', volume: 15400, taxes: 385 },
            { day: '05-11', volume: 22100, taxes: 552.5 },
            { day: '05-12', volume: 18900, taxes: 472.5 },
            { day: '05-13', volume: 32400, taxes: 810 },
            { day: '05-14', volume: 29800, taxes: 745 },
            { day: '05-15', volume: 45000, taxes: 1125 },
            { day: '05-16', volume: 38200, taxes: 955 },
            { day: '05-17', volume: 51000, taxes: 1275 },
            { day: 'Hoy', volume: totalGdVolumeLogs || 51000, taxes: totalCollectedTaxes || 1275 }
          ];

          return (
            <div className="space-y-6">
              
              {/* Upper row KPI blocks */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-4 flex flex-col justify-between h-24">
                  <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider font-mono">Volumen GD Comerciado</span>
                  <div>
                    <span className="text-xl font-black text-white block">{(totalGdVolumeLogs + 252800).toLocaleString()} GD</span>
                    <p className="text-[9.5px] text-zinc-500 font-sans mt-0.5">Volumen global histórico auditado</p>
                  </div>
                </div>

                <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-4 flex flex-col justify-between h-24 shadow-[#ff1e1e]/5">
                  <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider font-mono text-[#ff1e1e]">Impuestos Capturados (Real-Time)</span>
                  <div>
                    <span className="text-xl font-black text-red-500 block">+{totalCollectedTaxes.toLocaleString()} GD</span>
                    <p className="text-[9.5px] text-zinc-550 font-sans mt-0.5">Pertenecientes a caja de redistribución militar</p>
                  </div>
                </div>

                <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-4 flex flex-col justify-between h-24">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono">Listados Activos / Ratio</span>
                  <div>
                    <span className="text-xl font-black text-[#ff1e1e] block">{listingsCount} / {activityRatio.toFixed(2)}</span>
                    <p className="text-[9.5px] text-zinc-500 font-sans mt-0.5">{isActivityLow ? '⚠️ Liquidez crítica en red' : '🟢 Oferta líquida suficiente'}</p>
                  </div>
                </div>

                <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-4 flex flex-col justify-between h-24">
                  <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider font-mono">Tasa de Comisión Activa</span>
                  <div>
                    <span className="text-xl font-black text-yellow-550 block">{marketTaxPercent}% GD</span>
                    <p className="text-[9.5px] text-zinc-500 font-sans mt-0.5">Controlada en Panel de Auditoría</p>
                  </div>
                </div>
              </div>

              {/* Recharts graph panel */}
              <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-5 space-y-4">
                <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={15} className="text-[#ff1e1e] shrink-0" />
                    <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider block">
                      [ ANALYTICS ]: VOLUMEN DE GD COINS COMERCIADOS A LO LARGO DEL TIEMPO
                    </span>
                  </div>
                  <span className="text-[9.5px] text-zinc-550 font-mono">PERÍODO: ÚLTIMAS 2 SEMANAS</span>
                </div>

                <p className="text-[11px] text-zinc-550 font-sans leading-relaxed">
                  Gráfico militar que visualiza el flujo transaccional neto de GD Coins (moneda vinculada 1:1 con el USDT) dentro del ecosistema mercantil regulado de Galaxy Dust.
                </p>

                <div className="h-64 mt-4 w-full text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={baseVolumeData}
                      margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#222227" vertical={false} />
                      <XAxis 
                        dataKey="day" 
                        stroke="#71717a" 
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                      />
                      <YAxis 
                        stroke="#71717a" 
                        tickLine={false} 
                        axisLine={false}
                        dx={-10}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a' }}
                        itemStyle={{ color: '#ff1e1e' }}
                        labelStyle={{ color: '#a1a1aa', fontWeight: 'bold' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="volume" 
                        name="Volumen de Transacciones (GD)"
                        stroke="#ff1e1e" 
                        strokeWidth={3} 
                        activeDot={{ r: 6, fill: '#ff1e1e', stroke: '#ffffff', strokeWidth: 1 }}
                        dot={{ stroke: '#ff1e1e', strokeWidth: 1.5, r: 3, fill: '#09090b' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="taxes" 
                        name="Impuestos Deducidos (GD)"
                        stroke="#eab308" 
                        strokeWidth={2} 
                        dot={{ stroke: '#eab308', strokeWidth: 1, r: 2, fill: '#09090b' }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '15px' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bento informational sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-5 space-y-3 font-mono text-xs">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">ANÁLISIS DE LIQUIDEZ Y CONFIANZA</span>
                  <p className="text-zinc-500 leading-relaxed font-sans text-[11px]">
                    La relación de listados activos y la salud global del P2P se basan en el ratio de intercambio. Si hay demasiados usuarios y pocas ofertas registradas, se genera alta inflación local.
                  </p>
                  <div className="space-y-2 text-[11px] pt-1">
                    <div className="flex justify-between border-b border-zinc-900/40 pb-1.5 text-zinc-400">
                      <span>Estado del Mercado:</span>
                      <span className={`font-bold ${isActivityLow ? 'text-amber-500 animate-pulse' : 'text-emerald-500'}`}>
                        {isActivityLow ? 'BAJA FLUIDEZ' : 'CONGESTIÓN SALUDABLE'}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-900/40 pb-1.5 text-zinc-400">
                      <span>Listados Actuales:</span>
                      <span className="text-white font-bold">{listingsCount} items</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Velocidad de Retorno Estimada:</span>
                      <span className="text-zinc-550">24 horas de expiración</span>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-5 space-y-3 font-mono text-xs">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">AUDITORÍA FISCAL DE IMPUESTOS</span>
                  <p className="text-zinc-500 leading-relaxed font-sans text-[11px]">
                    Las tasas capturadas son extraídas del comprador o vendedor según el modelo de transacción directa o subasta, mitigando flujos ilícitos y de wash trading.
                  </p>
                  <div className="space-y-2 text-[11px] pt-1">
                    <div className="flex justify-between border-b border-zinc-900/40 pb-1.5 text-zinc-400">
                      <span>Impuestos Recaudados Hoy:</span>
                      <span className="text-yellow-550 font-bold">{totalCollectedTaxes.toLocaleString()} GD Coins</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-900/40 pb-1.5 text-zinc-400">
                      <span>Media de Tasa Recaudada:</span>
                      <span className="text-white">{(totalCollectedTaxes / Math.max(1, auditLogs.length)).toFixed(1)} GD x Transacción</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tasa Regulada por Ley:</span>
                      <span className="text-zinc-550">{marketTaxPercent}% GD</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          );
        })()}
      </div>

      {/* QUICK VIEW BID TRACKER EXPANSION MODAL */}
      <AnimatePresence>
        {quickViewAssetId && (() => {
          const asset = marketAssets.find(a => a.id === quickViewAssetId);
          if (!asset) return null;
          const assetBids = bids.filter(b => b.auctionId === quickViewAssetId).sort((a,b) => b.amountGd - a.amountGd);
          
          return (
            <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 font-mono">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="bg-zinc-950 border border-zinc-900 rounded-lg p-6 w-full max-w-lg space-y-4 shadow-2xl"
              >
                <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
                  <div className="flex items-center gap-2">
                    <Search size={15} className="text-[#ff1e1e]" />
                    <span className="text-xs font-bold text-zinc-300 uppercase tracking-widest block">
                      [QUICK VIEW]: HISTORIAL DE PUJAS DETALLADO
                    </span>
                  </div>
                  <button
                    onClick={() => setQuickViewAssetId(null)}
                    className="text-zinc-550 hover:text-white transition-colors cursor-pointer text-xs uppercase"
                  >
                    [Cerrar ×]
                  </button>
                </div>

                <div className="bg-black/60 border border-zinc-900/80 p-3.5 rounded-lg flex items-center gap-3">
                  <div className="w-12 h-12 bg-zinc-900 rounded border border-zinc-850 flex items-center justify-center text-white font-black text-sm">
                    {asset.category[0]}
                  </div>
                  <div>
                    <h4 className="text-[12.5px] font-bold text-white uppercase">{asset.name}</h4>
                    <p className="text-[9px] text-zinc-500 font-sans mt-0.5">
                      Vendedor ID: <span className="text-zinc-300">{asset.sellerName}</span> | {asset.id}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[9px] text-zinc-500 font-bold uppercase">
                    <span>Lista de Pujas Activas ({assetBids.length})</span>
                    <span>Ordenadas de Mayor a Menor</span>
                  </div>

                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {assetBids.length === 0 ? (
                      <div className="p-6 text-center text-zinc-650 bg-black/20 border border-dashed border-zinc-900 rounded">
                        Sin ofertas activas en la red en este momento.
                      </div>
                    ) : (
                      assetBids.map((bid, index) => (
                        <div
                          key={bid.id}
                          className={`p-2.5 rounded border flex items-center justify-between text-[11px] ${
                            index === 0 
                              ? 'bg-amber-950/10 border-amber-500/30' 
                              : 'bg-black/40 border-zinc-900'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-1.5 font-bold">
                              <span className="text-white text-[11.5px]">{bid.bidderName}</span>
                              {index === 0 && (
                                <span className="text-[8px] bg-amber-500/15 text-amber-500 px-1 rounded border border-amber-500/20 uppercase font-black">LÍDER</span>
                              )}
                            </div>
                            <span className="text-[9px] text-zinc-550 block mt-0.5">
                              ID: {bid.bidderId} | {new Date(bid.timestamp).toLocaleTimeString()}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-yellow-500 text-[12px]">
                              {bid.amountGd.toLocaleString()} GD
                            </span>
                            
                            <button
                              type="button"
                              onClick={() => {
                                handleRevokeBid(bid.id);
                              }}
                              className="p-1 text-red-500 hover:text-white bg-red-950/20 hover:bg-[#ff1e1e]/20 border border-red-500/10 rounded cursor-pointer transition-all"
                              title="Revocar Puja"
                            >
                              <XCircle size={11} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="text-[9px] text-zinc-500 leading-normal font-sans border-t border-zinc-900 pt-3">
                  <span className="text-[#ff1e1e] font-bold">Consola Reguladora Sasorilabs.io:</span> Revocar pujas anula de inmediato la oferta liderada liberando el balance y notificando al comandante respectivo.
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

    </div>
  );
}
