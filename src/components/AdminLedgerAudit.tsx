import React, { useState, useEffect, useMemo } from 'react';
import { 
  Coins, Database, ShieldAlert, TrendingUp, Search, Download, 
  RefreshCw, Filter, AlertTriangle, ArrowUpDown, Eye, CheckCircle2, 
  Ban, ShieldCheck, Zap, UserCheck, X
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';

interface ExtendedUserProfile extends UserProfile {
  legacy_id?: number;
  banned_until?: string | null;
}

interface AdminLedgerAuditProps {
  setIsAlertToShow?: (alert: { show: boolean; status: 'success' | 'error' | 'warning'; message: string }) => void;
}

type AnomalyFilter = 'all' | 'whales_gd' | 'high_metals' | 'negative_balance' | 'banned_only';

export const AdminLedgerAudit: React.FC<AdminLedgerAuditProps> = ({ setIsAlertToShow }) => {
  const [users, setUsers] = useState<ExtendedUserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [anomalyFilter, setAnomalyFilter] = useState<AnomalyFilter>('all');
  const [selectedUser, setSelectedUser] = useState<ExtendedUserProfile | null>(null);

  // Estados de ajuste rápido directo desde auditoría
  const [quickAdjustAmount, setQuickAdjustAmount] = useState<number>(0);
  const [quickAdjustResource, setQuickAdjustResource] = useState<string>('gd_coins');
  const [isAdjusting, setIsAdjusting] = useState<boolean>(false);

  // Ordenamiento de tabla
  const [sortField, setSortField] = useState<keyof ExtendedUserProfile>('gd_coins');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Carga masiva de todos los usuarios superando el límite de 1.000 filas de PostgREST
  const fetchAllUsers = async () => {
    setLoading(true);
    try {
      let allUsers: any[] = [];
      let from = 0;
      const step = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .order('legacy_id', { ascending: true, nullsFirst: false })
          .range(from, from + step - 1);

        if (error) throw error;

        if (data && data.length > 0) {
          allUsers = [...allUsers, ...data];
          if (data.length < step) hasMore = false;
          else from += step;
        } else {
          hasMore = false;
        }
      }

      const parseNum = (row: any, ...keys: string[]) => {
        for (const k of keys) {
          if (row && row[k] !== undefined && row[k] !== null) {
            const val = Number(row[k]);
            if (!isNaN(val)) return val;
          }
        }
        return 0;
      };

      const mapped: ExtendedUserProfile[] = allUsers.map((row: any) => {
        const uid = row.id || row.user_id;
        const isBanned = Boolean(
          (row.banned_until && new Date(row.banned_until).getTime() > Date.now()) ||
          row.status === 'banned' ||
          row.is_banned
        );

        return {
          id: uid,
          legacy_id: row.legacy_id ? Number(row.legacy_id) : undefined,
          banned_until: row.banned_until || null,
          username: row.username || row.display_name || (row.legacy_id ? `Comandante #${row.legacy_id}` : 'Explorador'),
          email: row.email || (row.legacy_id ? `legacy_${row.legacy_id}@galaxydust.io` : `UID: ${uid.substring(0, 8)}`),
          role: row.role || (row.is_admin ? 'admin' : 'user'),
          status: isBanned ? 'banned' : 'active',
          avatarUrl: row.avatar_url || '',
          created_at: row.created_at || new Date().toISOString(),
          last_active: row.updated_at || row.created_at || new Date().toISOString(),
          inventory: [],
          level: parseNum(row, 'level', 'can_level') || 1,
          can_level: parseNum(row, 'can_level', 'level') || 1,
          xp: parseNum(row, 'xp', 'can_xp', 'exp_points'),
          metal: parseNum(row, 'metal', 'metal_balance'),
          crystal: parseNum(row, 'crystal', 'crystal_balance'),
          deuterium: parseNum(row, 'deuterium', 'deuterium_balance'),
          dark_matter: parseNum(row, 'dark_matter', 'dark_matter_balance'),
          gd_coins: parseNum(row, 'gd_coin', 'gd_coins', 'gd_balance'),
          phantom_coins: parseNum(row, 'phantom_coin', 'phantom_coins', 'phantom_coins_balance'),
          omniplate: parseNum(row, 'omniplate'),
          orichaltron: parseNum(row, 'orichaltron'),
          lunar_fiber: parseNum(row, 'lunar_fiber'),
          infinity_core: parseNum(row, 'infinity_core', 'infinite_core'),
          primal_token: parseNum(row, 'primal_token'),
          xenoplasm: parseNum(row, 'xenoplasm'),
          organium: parseNum(row, 'organium'),
          mana: parseNum(row, 'mana', 'energy'),
        };
      });

      setUsers(mapped);
    } catch (err: any) {
      console.error("Error al cargar censo económico:", err.message);
      if (setIsAlertToShow) setIsAlertToShow({ show: true, status: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllUsers();
  }, []);

  // Métricas Macroeconómicas Agregadas
  const macroStats = useMemo(() => {
    const totalGD = users.reduce((acc, u) => acc + (u.gd_coins || 0), 0);
    const totalPhantom = users.reduce((acc, u) => acc + (u.phantom_coins || 0), 0);
    const totalMetal = users.reduce((acc, u) => acc + (u.metal || 0), 0);
    const totalCrystal = users.reduce((acc, u) => acc + (u.crystal || 0), 0);
    const totalDeuterium = users.reduce((acc, u) => acc + (u.deuterium || 0), 0);
    const totalDarkMatter = users.reduce((acc, u) => acc + (u.dark_matter || 0), 0);

    const whalesCount = users.filter(u => u.gd_coins >= 10000).length;
    const negativeBalanceCount = users.filter(u => 
      u.gd_coins < 0 || u.metal < 0 || u.crystal < 0 || u.deuterium < 0
    ).length;
    const bannedCount = users.filter(u => u.status === 'banned').length;

    return {
      totalGD,
      totalPhantom,
      totalMetal,
      totalCrystal,
      totalDeuterium,
      totalDarkMatter,
      whalesCount,
      negativeBalanceCount,
      bannedCount,
      totalUsers: users.length
    };
  }, [users]);

  // Filtrado y ordenamiento de comandantes
  const filteredAndSortedUsers = useMemo(() => {
    let result = users.filter(u => {
      const q = searchTerm.toLowerCase();
      const matchesSearch = 
        u.username.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q) ||
        (u.legacy_id && String(u.legacy_id).includes(q));

      if (!matchesSearch) return false;

      if (anomalyFilter === 'whales_gd') return u.gd_coins >= 10000;
      if (anomalyFilter === 'high_metals') return u.metal >= 40000000 || u.crystal >= 20000000;
      if (anomalyFilter === 'negative_balance') return u.gd_coins < 0 || u.metal < 0 || u.crystal < 0 || u.deuterium < 0;
      if (anomalyFilter === 'banned_only') return u.status === 'banned';

      return true;
    });

    result.sort((a, b) => {
      let valA = a[sortField] ?? 0;
      let valB = b[sortField] ?? 0;

      if (typeof valA === 'string') valA = (valA as string).toLowerCase();
      if (typeof valB === 'string') valB = (valB as string).toLowerCase();

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

    return result;
  }, [users, searchTerm, anomalyFilter, sortField, sortAsc]);

  const handleSort = (field: keyof ExtendedUserProfile) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  // Ajuste rápido de saldo directamente desde el inspector
  const handleQuickAdjust = async () => {
    if (!selectedUser || quickAdjustAmount === 0) return;
    setIsAdjusting(true);

    try {
      const currentVal = Number((selectedUser as any)[quickAdjustResource] || 0);
      const newVal = Math.max(0, currentVal + Number(quickAdjustAmount));
      const updatePayload: any = { 
        [quickAdjustResource]: newVal,
        updated_at: new Date().toISOString()
      };

      if (quickAdjustResource === 'metal') updatePayload.metal_balance = newVal;
      if (quickAdjustResource === 'crystal') updatePayload.crystal_balance = newVal;
      if (quickAdjustResource === 'deuterium') updatePayload.deuterium_balance = newVal;
      if (quickAdjustResource === 'dark_matter') updatePayload.dark_matter_balance = newVal;
      if (quickAdjustResource === 'gd_coins') {
        updatePayload.gd_coin = newVal;
        updatePayload.gd_balance = newVal;
      }
      if (quickAdjustResource === 'phantom_coins') {
        updatePayload.phantom_coin = newVal;
        updatePayload.phantom_coins_balance = newVal;
      }

      const { error } = await supabase
        .from('user_profiles')
        .update(updatePayload)
        .eq('id', selectedUser.id);

      if (error) throw error;

      await supabase.from('maintenance_logs').insert([{
        action_type: `LEDGER_AUDIT_ADJUST_${quickAdjustResource.toUpperCase()}`,
        records_affected: 1,
        created_at: new Date().toISOString()
      }]);

      if (setIsAlertToShow) {
        setIsAlertToShow({
          show: true,
          status: 'success',
          message: `Saldo actualizado para ${selectedUser.username}: ${quickAdjustAmount > 0 ? '+' : ''}${quickAdjustAmount} en ${quickAdjustResource}.`
        });
      }

      setSelectedUser(prev => prev ? { ...prev, [quickAdjustResource]: newVal } : null);
      setQuickAdjustAmount(0);
      fetchAllUsers();
    } catch (err: any) {
      if (setIsAlertToShow) setIsAlertToShow({ show: true, status: 'error', message: err.message });
    } finally {
      setIsAdjusting(false);
    }
  };

  // Exportar censo económico íntegro a CSV
  const handleExportCSV = () => {
    const headers = [
      'Legacy_ID', 'UUID', 'Username', 'Status', 'GD_Coins', 'Phantom_Coins',
      'Metal', 'Crystal', 'Deuterium', 'Dark_Matter', 'Omniplate', 'Orichaltron',
      'Lunar_Fiber', 'Infinity_Core', 'Primal_Token', 'Xenoplasm', 'Organium', 'Mana'
    ];

    const rows = filteredAndSortedUsers.map(u => [
      u.legacy_id || 'N/A',
      u.id,
      `"${u.username.replace(/"/g, '""')}"`,
      u.status,
      u.gd_coins,
      u.phantom_coins,
      u.metal,
      u.crystal,
      u.deuterium,
      u.dark_matter,
      u.omniplate,
      u.orichaltron,
      u.lunar_fiber,
      u.infinity_core,
      u.primal_token,
      u.xenoplasm,
      u.organium,
      u.mana
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `galaxydust_economic_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 font-mono text-xs text-left text-white select-none animate-fadeIn">
      
      {/* CABECERA */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Coins className="text-amber-400 animate-pulse" size={18} />
            <h1 className="text-lg font-bold text-white uppercase tracking-wide">
              Auditoría Forense de Bóvedas & Ledger Económico
            </h1>
          </div>
          <p className="text-xs text-zinc-500 font-sans mt-1">
            Control de masa monetaria global, detección de anomalías y conciliación de saldos en los {macroStats.totalUsers.toLocaleString('es-ES')} comandantes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 font-bold uppercase rounded-lg text-xs cursor-pointer flex items-center gap-1.5 transition-colors"
          >
            <Download size={13} /> Exportar CSV
          </button>
          <button
            onClick={fetchAllUsers}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black uppercase rounded-lg text-xs cursor-pointer flex items-center gap-1.5 shadow-lg shadow-amber-950/40 transition-all"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Recalcular
          </button>
        </div>
      </div>

      {/* TARJETAS MACROECONÓMICAS (KPIS) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="p-3.5 bg-zinc-950 border border-zinc-900 rounded-xl space-y-1">
          <span className="text-[9px] text-zinc-500 uppercase font-bold block">Circulante GD (USD)</span>
          <strong className="text-amber-400 text-sm font-bold block truncate">
            ${macroStats.totalGD.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </strong>
          <span className="text-[8.5px] text-zinc-600 block">Paridad 1:1 Fija</span>
        </div>

        <div className="p-3.5 bg-zinc-950 border border-zinc-900 rounded-xl space-y-1">
          <span className="text-[9px] text-zinc-500 uppercase font-bold block">Circulante Phantom</span>
          <strong className="text-emerald-400 text-sm font-bold block truncate">
            {macroStats.totalPhantom.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} PC
          </strong>
          <span className="text-[8.5px] text-zinc-600 block">Moneda de Consumo</span>
        </div>

        <div className="p-3.5 bg-zinc-950 border border-zinc-900 rounded-xl space-y-1">
          <span className="text-[9px] text-zinc-500 uppercase font-bold block">Reserva de Metal</span>
          <strong className="text-zinc-200 text-sm font-bold block truncate">
            {macroStats.totalMetal.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </strong>
          <span className="text-[8.5px] text-zinc-600 block">Bóvedas combinadas</span>
        </div>

        <div className="p-3.5 bg-zinc-950 border border-zinc-900 rounded-xl space-y-1">
          <span className="text-[9px] text-zinc-500 uppercase font-bold block">Reserva de Cristal</span>
          <strong className="text-cyan-400 text-sm font-bold block truncate">
            {macroStats.totalCrystal.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </strong>
          <span className="text-[8.5px] text-zinc-600 block">Bóvedas combinadas</span>
        </div>

        <div className="p-3.5 bg-zinc-950 border border-zinc-900 rounded-xl space-y-1">
          <span className="text-[9px] text-zinc-500 uppercase font-bold block">Ballenas GD (&gt;=10k)</span>
          <strong className="text-purple-400 text-sm font-bold block">
            {macroStats.whalesCount.toLocaleString('es-ES')} <span className="text-xs font-normal text-zinc-500">Pilotos</span>
          </strong>
          <span className="text-[8.5px] text-zinc-600 block">Cuentas dominantes</span>
        </div>

        <div className="p-3.5 bg-zinc-950 border border-zinc-900 rounded-xl space-y-1">
          <span className="text-[9px] text-zinc-500 uppercase font-bold block">Balances Negativos</span>
          <strong className={`text-sm font-bold block ${macroStats.negativeBalanceCount > 0 ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`}>
            {macroStats.negativeBalanceCount.toLocaleString('es-ES')} <span className="text-xs font-normal text-zinc-500">Alertas</span>
          </strong>
          <span className="text-[8.5px] text-zinc-600 block">Posibles inconsistencias</span>
        </div>
      </div>

      {/* FILTROS Y BÚSQUEDA */}
      <div className="bg-zinc-950 p-4 border border-zinc-900 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div className="relative w-full md:w-80">
          <Search size={14} className="absolute left-3 top-2.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar por UID, Legacy ID (#1623) o Nombre..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-black border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white outline-none focus:border-amber-500 uppercase"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 select-none">
          <span className="text-[10px] text-zinc-500 uppercase font-bold mr-1 flex items-center gap-1">
            <Filter size={12} /> Filtro Forense:
          </span>
          {[
            { id: 'all', label: 'Todos' },
            { id: 'whales_gd', label: '🐋 Ballenas GD' },
            { id: 'high_metals', label: '💎 Metales Altos' },
            { id: 'negative_balance', label: '🚨 Negativos' },
            { id: 'banned_only', label: '🚫 Sancionados' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setAnomalyFilter(f.id as AnomalyFilter)}
              className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all cursor-pointer border ${
                anomalyFilter === f.id
                  ? 'bg-amber-950 text-amber-300 border-amber-800'
                  : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* TABLA PRINCIPAL DEL CENSO ECONÓMICO */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        
        {/* Tabla (2/3 de pantalla) */}
        <div className="xl:col-span-2 bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead className="sticky top-0 bg-zinc-900 border-b border-zinc-800 text-[10px] text-zinc-400 uppercase tracking-wider z-10">
                <tr>
                  <th className="p-3 cursor-pointer hover:text-white" onClick={() => handleSort('legacy_id')}>
                    <span className="flex items-center gap-1">Legacy <ArrowUpDown size={10} /></span>
                  </th>
                  <th className="p-3 cursor-pointer hover:text-white" onClick={() => handleSort('username')}>
                    <span className="flex items-center gap-1">Comandante <ArrowUpDown size={10} /></span>
                  </th>
                  <th className="p-3 text-right cursor-pointer hover:text-white" onClick={() => handleSort('gd_coins')}>
                    <span className="flex items-center justify-end gap-1">GD Coin <ArrowUpDown size={10} /></span>
                  </th>
                  <th className="p-3 text-right cursor-pointer hover:text-white" onClick={() => handleSort('phantom_coins')}>
                    <span className="flex items-center justify-end gap-1">Phantom <ArrowUpDown size={10} /></span>
                  </th>
                  <th className="p-3 text-right cursor-pointer hover:text-white" onClick={() => handleSort('metal')}>
                    <span className="flex items-center justify-end gap-1">Metal <ArrowUpDown size={10} /></span>
                  </th>
                  <th className="p-3 text-right cursor-pointer hover:text-white" onClick={() => handleSort('crystal')}>
                    <span className="flex items-center justify-end gap-1">Cristal <ArrowUpDown size={10} /></span>
                  </th>
                  <th className="p-3 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-[11px]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-amber-400 animate-pulse font-mono">
                      Calculando bóvedas del universo...
                    </td>
                  </tr>
                ) : filteredAndSortedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-zinc-600 italic">
                      No hay registros que coincidan con el filtro forense.
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedUsers.map(user => {
                    const isSelected = selectedUser?.id === user.id;
                    const hasNegative = user.gd_coins < 0 || user.metal < 0 || user.crystal < 0;

                    return (
                      <tr 
                        key={user.id} 
                        onClick={() => setSelectedUser(user)}
                        className={`hover:bg-zinc-900/40 transition-colors cursor-pointer ${
                          isSelected ? 'bg-amber-950/20 border-l-2 border-amber-500' : hasNegative ? 'bg-red-950/20' : ''
                        }`}
                      >
                        <td className="p-3 font-bold text-zinc-400">
                          {user.legacy_id ? `#${user.legacy_id}` : '—'}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white block truncate max-w-[140px]">{user.username}</span>
                            {user.status === 'banned' && (
                              <span className="px-1 py-0.2 bg-red-950 text-red-400 border border-red-800 text-[7.5px] rounded font-bold">
                                BAN
                              </span>
                            )}
                          </div>
                          <span className="text-[9px] text-zinc-500 font-mono block truncate max-w-[140px]">{user.id}</span>
                        </td>
                        <td className={`p-3 text-right font-bold ${user.gd_coins < 0 ? 'text-red-400' : 'text-amber-400'}`}>
                          ${user.gd_coins.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 3 })}
                        </td>
                        <td className="p-3 text-right font-bold text-emerald-400">
                          {user.phantom_coins.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 3 })}
                        </td>
                        <td className={`p-3 text-right font-bold ${user.metal < 0 ? 'text-red-400' : 'text-zinc-200'}`}>
                          {user.metal.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 3 })}
                        </td>
                        <td className={`p-3 text-right font-bold ${user.crystal < 0 ? 'text-red-400' : 'text-cyan-400'}`}>
                          {user.crystal.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 3 })}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedUser(user); }}
                            className="p-1 px-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded font-bold text-[10px] cursor-pointer"
                          >
                            <Eye size={11} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel Inspector Forense Individual (1/3 de pantalla) */}
        <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4 shadow-xl">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block border-b border-zinc-900 pb-2 flex items-center justify-between">
            <span>🔍 Ficha Forense de Bóveda</span>
            {selectedUser && (
              <button onClick={() => setSelectedUser(null)} className="text-zinc-600 hover:text-white cursor-pointer">
                <X size={14} />
              </button>
            )}
          </span>

          {!selectedUser ? (
            <div className="p-12 text-center text-zinc-600 text-xs italic border border-dashed border-zinc-900 rounded-lg">
              Selecciona un comandante de la tabla para desplegar la composición total de sus 14 recursos y ejecutar ajustes de conciliación.
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-bold text-sm uppercase">{selectedUser.username}</h3>
                  <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold uppercase border ${
                    selectedUser.status === 'banned' ? 'bg-red-950 text-red-400 border-red-800' : 'bg-emerald-950 text-emerald-400 border-emerald-800'
                  }`}>
                    {selectedUser.status}
                  </span>
                </div>
                <span className="text-[9.5px] text-zinc-500 font-mono block">
                  UID: {selectedUser.id} {selectedUser.legacy_id ? `• Legacy ID: #${selectedUser.legacy_id}` : ''}
                </span>
              </div>

              {/* Matriz Completa de Recursos */}
              <div className="grid grid-cols-2 gap-2 text-[10.5px] bg-black/60 p-3 rounded-xl border border-zinc-850">
                <div><span className="text-zinc-500 block text-[8px]">GD COIN (USD):</span><strong className="text-amber-400">${selectedUser.gd_coins.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 3 })}</strong></div>
                <div><span className="text-zinc-500 block text-[8px]">PHANTOM COIN:</span><strong className="text-emerald-400">{selectedUser.phantom_coins.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 3 })}</strong></div>
                <div><span className="text-zinc-500 block text-[8px]">METAL:</span><strong className="text-zinc-200">{selectedUser.metal.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 3 })}</strong></div>
                <div><span className="text-zinc-500 block text-[8px]">CRISTAL:</span><strong className="text-cyan-400">{selectedUser.crystal.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 3 })}</strong></div>
                <div><span className="text-zinc-500 block text-[8px]">DEUTERIO:</span><strong className="text-amber-500">{selectedUser.deuterium.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 3 })}</strong></div>
                <div><span className="text-zinc-500 block text-[8px]">MATERIA OSCURA:</span><strong className="text-purple-400">{selectedUser.dark_matter.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 3 })}</strong></div>
                <div><span className="text-zinc-500 block text-[8px]">OMNIPLATE:</span><strong className="text-zinc-400">{selectedUser.omniplate.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 3 })}</strong></div>
                <div><span className="text-zinc-500 block text-[8px]">ORICHALTRON:</span><strong className="text-zinc-400">{selectedUser.orichaltron.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 3 })}</strong></div>
                <div><span className="text-zinc-500 block text-[8px]">LUNAR FIBER:</span><strong className="text-zinc-400">{selectedUser.lunar_fiber.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 3 })}</strong></div>
                <div><span className="text-zinc-500 block text-[8px]">INFINITY CORE:</span><strong className="text-red-400">{selectedUser.infinity_core.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 3 })}</strong></div>
                <div><span className="text-zinc-500 block text-[8px]">PRIMAL TOKEN:</span><strong className="text-purple-300">{selectedUser.primal_token.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 3 })}</strong></div>
                <div><span className="text-zinc-500 block text-[8px]">MANA / ENERGY:</span><strong className="text-cyan-300">{selectedUser.mana.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 3 })}</strong></div>
              </div>

              {/* Ajuste de Conciliación Rápida */}
              <div className="bg-zinc-900/40 p-3 rounded-xl border border-zinc-850 space-y-2.5">
                <span className="text-[9px] text-amber-400 font-bold uppercase block tracking-wider flex items-center gap-1">
                  <Zap size={11} /> Ajuste Forense (+ para sumar, - para deducir)
                </span>

                <div className="space-y-2">
                  <select
                    value={quickAdjustResource}
                    onChange={e => setQuickAdjustResource(e.target.value)}
                    className="w-full bg-black border border-zinc-800 p-2 rounded text-zinc-300 text-xs outline-none cursor-pointer"
                  >
                    <option value="gd_coins">GD Coin (USD Real)</option>
                    <option value="phantom_coins">Phantom Coin</option>
                    <option value="metal">Metal</option>
                    <option value="crystal">Cristal</option>
                    <option value="deuterium">Deuterio</option>
                    <option value="dark_matter">Materia Oscura</option>
                  </select>

                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Monto (+/-)..."
                      value={quickAdjustAmount || ''}
                      onChange={e => setQuickAdjustAmount(Number(e.target.value))}
                      className="w-full bg-black border border-zinc-800 p-2 rounded text-amber-400 font-bold text-xs outline-none font-mono"
                    />
                    <button
                      onClick={handleQuickAdjust}
                      disabled={isAdjusting || quickAdjustAmount === 0}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-slate-950 font-bold uppercase rounded text-xs cursor-pointer transition-all whitespace-nowrap shadow-lg"
                    >
                      {isAdjusting ? 'Aplicando...' : 'Conciliar'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default AdminLedgerAudit;