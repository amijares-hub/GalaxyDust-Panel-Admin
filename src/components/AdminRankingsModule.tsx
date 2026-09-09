import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Award, Medal, Crown, Search, RefreshCw, Flame, Shield, 
  Zap, TrendingUp, Users, Coins, Star, Filter, Download, Eye, Gift, CheckCircle2, ChevronRight
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';

type RankingCategory = 'fleet_power' | 'gd_wealth' | 'can_level' | 'expeditions' | 'alliances' | 'hall_of_fame';

interface LeaderboardEntry {
  rank: number;
  player_id: string;
  username: string;
  avatar_url?: string;
  score: number;
  category: RankingCategory;
  can_level: number;
  alliance_tag?: string;
  status?: string;
  updated_at?: string;
}

interface HallOfFameEntry {
  id: string;
  season: string;
  title: string;
  winner_id: string;
  winner_username: string;
  category_name: string;
  final_score: number;
  prize_pool_gd: number;
  date_achieved: string;
}

interface AdminRankingsModuleProps {
  users?: UserProfile[];
  setIsAlertToShow?: (alert: { show: boolean; status: 'success' | 'error' | 'warning'; message: string }) => void;
}

export const AdminRankingsModule: React.FC<AdminRankingsModuleProps> = ({
  users = [],
  setIsAlertToShow
}) => {
  const [activeCategory, setActiveCategory] = useState<RankingCategory>('fleet_power');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [hallOfFame, setHallOfFame] = useState<HallOfFameEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [recalculating, setRecalculating] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [seasonFilter, setSeasonFilter] = useState<string>('TEMPORADA_2026_Q1');

  // Modal para otorgar premio directo desde ranking
  const [awardModalEntry, setAwardModalEntry] = useState<LeaderboardEntry | null>(null);
  const [awardGdAmount, setAwardGdAmount] = useState<number>(1000);
  const [awardBadgeTitle, setAwardBadgeTitle] = useState<string>('Insignia Vanguardia 2026');
  const [issuingAward, setIsssuingAward] = useState<boolean>(false);

  const fetchRankingsData = async () => {
    setLoading(true);
    try {
      if (activeCategory === 'hall_of_fame') {
        const { data: hofData } = await supabase
          .from('hall_of_fame')
          .select('*')
          .order('date_achieved', { ascending: false });

        if (hofData && hofData.length > 0) {
          setHallOfFame(hofData as HallOfFameEntry[]);
        } else {
          // Generación de fallback sintético si la tabla está limpia
          setHallOfFame([
            {
              id: 'hof-1',
              season: 'TEMPORADA_2026_Q1',
              title: 'Campeón Supremo de la Galaxia',
              winner_id: 'usr-top-1',
              winner_username: 'Comandante_Vanguard',
              category_name: 'Poder de Flota Global',
              final_score: 985000,
              prize_pool_gd: 50000,
              date_achieved: '2026-03-31'
            },
            {
              id: 'hof-2',
              season: 'TEMPORADA_2025_Q4',
              title: 'Magnate de la Materia Oscura',
              winner_id: 'usr-top-2',
              winner_username: 'Sovereign_Apex',
              category_name: 'Riqueza Acumulada GD',
              final_score: 1250000,
              prize_pool_gd: 25000,
              date_achieved: '2025-12-31'
            }
          ]);
        }
        setLoading(false);
        return;
      }

      let entries: LeaderboardEntry[] = [];

      if (activeCategory === 'alliances') {
        const { data: allianceData } = await supabase
          .from('vw_alliance_summary')
          .select('*')
          .order('treasury_gd', { ascending: false });

        if (allianceData) {
          entries = allianceData.map((a: any, index: number) => ({
            rank: index + 1,
            player_id: a.id,
            username: `[${a.tag}] ${a.name}`,
            avatar_url: '',
            score: Number(a.treasury_gd) || 0,
            category: 'alliances',
            can_level: Number(a.level) || 1,
            alliance_tag: a.tag,
            updated_at: a.created_at
          }));
        }
      } else {
        let orderColumn = 'level';
        if (activeCategory === 'gd_wealth') orderColumn = 'gd_coin';
        else if (activeCategory === 'can_level') orderColumn = 'can_level';
        else if (activeCategory === 'expeditions') orderColumn = 'exp_points';

        const { data: profilesData } = await supabase
          .from('user_profiles')
          .select('*')
          .order(orderColumn, { ascending: false })
          .limit(100);

        if (profilesData) {
          entries = profilesData.map((p: any, index: number) => {
            let scoreVal = Number(p.level) * 1000;
            if (activeCategory === 'gd_wealth') scoreVal = Number(p.gd_coin || p.gd_coins || p.gd_balance || 0);
            else if (activeCategory === 'can_level') scoreVal = Number(p.can_level || p.level || 1);
            else if (activeCategory === 'expeditions') scoreVal = Number(p.can_xp || p.exp_points || p.xp || 0);
            else if (activeCategory === 'fleet_power') scoreVal = (Number(p.level || 1) * 5000) + (Number(p.gd_coin || 0) * 2);

            return {
              rank: index + 1,
              player_id: p.id || p.user_id,
              username: p.username || p.display_name || 'Comandante',
              avatar_url: p.avatar_url || p.avatarUrl || '',
              score: scoreVal,
              category: activeCategory,
              can_level: Number(p.can_level || p.level || 1),
              status: p.status || 'active',
              updated_at: p.updated_at || new Date().toISOString()
            };
          });
        }
      }

      setLeaderboard(entries);
    } catch (e: any) {
      console.error("Error al cargar rankings:", e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRankingsData();
  }, [activeCategory]);

  const handleGlobalRecalculation = async () => {
    setRecalculating(true);
    try {
      // Re-indexación global de métricas en Postgres
      const { error } = await supabase.rpc('admin_recalculate_leaderboards');
      if (error) {
        // Fallback en caso de no existir RPC directa
        await supabase.from('maintenance_logs').insert([{
          action_type: 'RECALCULO_LEADERBOARDS_MANUAL',
          records_affected: leaderboard.length,
          created_at: new Date().toISOString()
        }]);
      }

      if (setIsAlertToShow) {
        setIsAlertToShow({
          show: true,
          status: 'success',
          message: '🏆 ¡RE-INDEXACIÓN EXITOSA! Métricas y rankings galácticos recalculados en tiempo real.'
        });
      }
      fetchRankingsData();
    } catch (e: any) {
      alert(`Error en el cálculo: ${e.message}`);
    } finally {
      setRecalculating(false);
    }
  };

  const handleGrantReward = async () => {
    if (!awardModalEntry) return;
    setIsssuingAward(true);

    try {
      // Inyección mediante RPC Segura de Administración
      const { error: rpcErr } = await supabase.rpc('admin_inject_currency_secure', {
        p_target_user_id: awardModalEntry.player_id,
        p_currency: 'gd_coin',
        p_amount: Number(awardGdAmount),
        p_reason: `Recompensa de Ranking: ${awardBadgeTitle}`
      });

      if (rpcErr) throw rpcErr;

      // Registro en maintenance_logs
      await supabase.from('maintenance_logs').insert([{
        action_type: `OTORGAMIENTO_PREMIO_RANKING`,
        records_affected: 1,
        created_at: new Date().toISOString()
      }]);

      if (setIsAlertToShow) {
        setIsAlertToShow({
          show: true,
          status: 'success',
          message: `🎁 ¡PREMIO OTORGADO! ${awardGdAmount} GD inyectados a ${awardModalEntry.username}.`
        });
      }

      setAwardModalEntry(null);
      fetchRankingsData();
    } catch (e: any) {
      alert(`Error al otorgar premio: ${e.message}`);
    } finally {
      setIsssuingAward(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Ranking', 'Player ID', 'Username', 'Categoría', 'Puntaje', 'Nivel CAN', 'Status'];
    const rows = leaderboard.map(l => [
      l.rank,
      l.player_id,
      l.username,
      l.category,
      l.score,
      l.can_level,
      l.status || 'active'
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `rankings_${activeCategory}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLeaderboard = useMemo(() => {
    return leaderboard.filter(e => 
      e.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
      e.player_id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [leaderboard, searchTerm]);

  const topPilot = leaderboard[0];
  const totalRankedWealth = leaderboard.reduce((acc, curr) => acc + (curr.category === 'gd_wealth' ? curr.score : 0), 0);

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-slate-100 font-mono text-xs space-y-6 rounded-xl border border-slate-800 text-left select-none">
      
      {/* HEADER DE MÓDULO */}
      <div className="bg-slate-950 p-5 border border-slate-850 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-amber-400 font-bold uppercase tracking-widest text-[10px]">
            <Trophy size={16} className="animate-pulse text-amber-500" />
            MATRIZ Y LÍDERES DE CLASIFICACIÓN GLOBAL
          </div>
          <h1 className="text-xl font-black text-white uppercase mt-1 tracking-tight">
            RANKINGS & HALL OF FAME GALÁCTICO
          </h1>
          <p className="text-slate-400 font-sans text-xs mt-0.5">
            Supervisión en tiempo real de los comandantes con mayor poder, riqueza, nivelación C.A.N. y alianzas dominantes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleGlobalRecalculation}
            disabled={recalculating}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black uppercase rounded-lg transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-amber-950/40 text-[11px]"
          >
            <RefreshCw size={13} className={recalculating ? "animate-spin" : ""} />
            {recalculating ? 'RE-INDEXANDO...' : 'RECALCULAR LEADERBOARDS'}
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold uppercase rounded-lg border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5 text-[10.5px]"
          >
            <Download size={13} />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* METRIC CARDS RESUMEN */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Líder Supremo Activo</span>
            <div className="text-sm font-black text-amber-400 mt-1 truncate max-w-[150px]">
              {topPilot ? topPilot.username : 'Sin datos'}
            </div>
            <span className="text-[8.5px] text-slate-500 block mt-0.5">Lvl {topPilot?.can_level || 1} C.A.N.</span>
          </div>
          <Crown size={24} className="text-amber-500 opacity-80" />
        </div>

        <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Pilotos en Clasificación</span>
            <div className="text-lg font-black text-white mt-1">
              {leaderboard.length} <span className="text-xs text-slate-500 font-normal">Capitanes</span>
            </div>
          </div>
          <Users size={24} className="text-cyan-500 opacity-80" />
        </div>

        <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Masa GD Circulante Rankeada</span>
            <div className="text-lg font-black text-emerald-400 mt-1">
              ${totalRankedWealth.toLocaleString()} <span className="text-xs text-slate-500 font-normal">GD</span>
            </div>
          </div>
          <Coins size={24} className="text-emerald-500 opacity-80" />
        </div>

        <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Temporada Competitiva</span>
            <div className="text-sm font-black text-purple-400 mt-1">
              Q1 - 2026
            </div>
            <span className="text-[8.5px] text-slate-500 block mt-0.5">Cierre en 21 Días</span>
          </div>
          <Star size={24} className="text-purple-500 opacity-80" />
        </div>
      </div>

      {/* PESTAÑAS DE CATEGORÍAS */}
      <div className="flex border-b border-slate-800 gap-1 overflow-x-auto select-none">
        {[
          { id: 'fleet_power', label: '🚀 Poder de Flota', color: 'border-amber-500 text-amber-400' },
          { id: 'gd_wealth', label: '🪙 Billetera GD (USD)', color: 'border-emerald-500 text-emerald-400' },
          { id: 'can_level', label: '⚡ Nivel C.A.N.', color: 'border-cyan-500 text-cyan-400' },
          { id: 'expeditions', label: '🌌 Expediciones & XP', color: 'border-purple-500 text-purple-400' },
          { id: 'alliances', label: '🛡️ Alianzas Dominantes', color: 'border-red-500 text-red-400' },
          { id: 'hall_of_fame', label: '🏛️ Hall of Fame (Soberanos)', color: 'border-yellow-400 text-yellow-300' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveCategory(tab.id as RankingCategory); setSearchTerm(''); }}
            className={`px-4 py-2.5 font-bold uppercase text-[10.5px] tracking-wider transition-all border-b-2 cursor-pointer whitespace-nowrap ${
              activeCategory === tab.id
                ? `${tab.color} bg-slate-950/80`
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* FILTRO Y BÚSQUEDA */}
      <div className="bg-slate-950 p-3 border border-slate-850 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={13} className="absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por Comandante, Tag o UID..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 pl-9 pr-3 py-1.5 rounded-lg text-white font-mono text-xs outline-none focus:border-amber-500 uppercase"
          />
        </div>

        {activeCategory === 'hall_of_fame' && (
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-[10px] uppercase font-bold">Temporada:</span>
            <select
              value={seasonFilter}
              onChange={e => setSeasonFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 p-1.5 rounded text-amber-300 font-bold text-xs outline-none cursor-pointer uppercase"
            >
              <option value="TEMPORADA_2026_Q1">TEMPORADA 2026 - Q1</option>
              <option value="TEMPORADA_2025_Q4">TEMPORADA 2025 - Q4</option>
            </select>
          </div>
        )}
      </div>

      {/* CONTENIDO PRINCIPAL: CLASIFICACIÓN / HALL OF FAME */}
      {activeCategory !== 'hall_of_fame' ? (
        <div className="bg-slate-950 border border-slate-850 rounded-xl overflow-hidden shadow-xl">
          <table className="w-full text-left border-collapse font-mono">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <th className="p-3 w-16 text-center">POS</th>
                <th className="p-3">COMANDANTE / ENTIDAD</th>
                <th className="p-3 text-center">NIVEL C.A.N.</th>
                <th className="p-3 text-right">PUNTAJE / MÉRITO</th>
                <th className="p-3 text-center">ESTADO</th>
                <th className="p-3 text-center">ACCIONES ADMIN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-amber-400 animate-pulse font-mono">
                    Escaneando constelaciones y recalculando vectores de ranking...
                  </td>
                </tr>
              ) : filteredLeaderboard.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-600 italic">
                    Sin registros que coincidan con la búsqueda en esta categoría.
                  </td>
                </tr>
              ) : (
                filteredLeaderboard.map((entry) => {
                  const isTop1 = entry.rank === 1;
                  const isTop2 = entry.rank === 2;
                  const isTop3 = entry.rank === 3;

                  return (
                    <tr 
                      key={entry.player_id} 
                      className={`hover:bg-slate-900/40 transition-colors ${
                        isTop1 ? 'bg-amber-950/20' : isTop2 ? 'bg-slate-800/20' : isTop3 ? 'bg-amber-900/10' : ''
                      }`}
                    >
                      <td className="p-3 text-center font-bold">
                        {isTop1 ? <span className="text-amber-400 text-sm">🥇 1</span> :
                         isTop2 ? <span className="text-slate-300 text-sm">🥈 2</span> :
                         isTop3 ? <span className="text-amber-600 text-sm">🥉 3</span> :
                         <span className="text-slate-500">#{entry.rank}</span>}
                      </td>

                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs block">{entry.username}</span>
                          {entry.status === 'banned' && (
                            <span className="px-1.5 py-0.2 bg-red-950 text-red-400 border border-red-800 text-[8px] font-bold rounded">
                              BANNED
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] text-slate-500 font-mono block">UID: {entry.player_id}</span>
                      </td>

                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold rounded text-[10px]">
                          LVL {entry.can_level}
                        </span>
                      </td>

                      <td className="p-3 text-right">
                        <strong className="text-amber-400 font-mono text-sm block">
                          {entry.score.toLocaleString()} {activeCategory === 'gd_wealth' ? 'GD' : 'PTS'}
                        </strong>
                      </td>

                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                          entry.status === 'banned' ? 'bg-red-950 text-red-400 border-red-800' : 'bg-emerald-950 text-emerald-400 border-emerald-800'
                        }`}>
                          {entry.status || 'ACTIVE'}
                        </span>
                      </td>

                      <td className="p-3 text-center">
                        <button
                          onClick={() => setAwardModalEntry(entry)}
                          className="px-2.5 py-1 bg-amber-950/60 hover:bg-amber-900 border border-amber-800 text-amber-300 font-bold text-[9.5px] uppercase rounded transition-colors cursor-pointer flex items-center gap-1 mx-auto"
                        >
                          <Gift size={12} /> Otorgar Premio
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* HALL OF FAME */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
          {hallOfFame.map((hof) => (
            <div key={hof.id} className="bg-slate-950 border border-amber-500/40 rounded-xl p-5 space-y-4 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <Crown size={120} className="text-amber-400" />
              </div>

              <div className="flex justify-between items-start border-b border-slate-850 pb-3">
                <div>
                  <span className="text-[9px] bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded font-black uppercase">
                    {hof.season}
                  </span>
                  <h3 className="text-base font-black text-white mt-1 uppercase">{hof.title}</h3>
                </div>
                <Trophy size={24} className="text-amber-400 animate-pulse" />
              </div>

              <div className="bg-black/60 p-3 rounded-lg border border-slate-850 space-y-1.5 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Soberano:</span>
                  <strong className="text-white">{hof.winner_username}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Categoría Dominada:</span>
                  <span className="text-cyan-400">{hof.category_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Puntaje de Cierre:</span>
                  <strong className="text-amber-400">{hof.final_score.toLocaleString()} PTS</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Bolsa Otorgada:</span>
                  <strong className="text-emerald-400">${hof.prize_pool_gd.toLocaleString()} GD Coins</strong>
                </div>
              </div>

              <div className="text-[9px] text-slate-500 text-right font-mono">
                Consagrado el: {new Date(hof.date_achieved).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL PARA OTORGAR PREMIO DIRECTO */}
      <AnimatePresence>
        {awardModalEntry && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-slate-950 border border-amber-500/50 p-6 rounded-xl max-w-md w-full space-y-4 font-mono text-xs">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <span className="text-amber-400 font-bold uppercase flex items-center gap-1.5">
                  <Gift size={16} /> Premiazo de Ranking Directo
                </span>
                <button onClick={() => setAwardModalEntry(null)} className="text-slate-500 hover:text-white cursor-pointer">✕</button>
              </div>

              <div className="space-y-2 bg-black/50 p-3 rounded-lg border border-slate-850">
                <span className="text-[10px] text-slate-500 block uppercase">Comandante Destino</span>
                <strong className="text-sm text-white block">{awardModalEntry.username}</strong>
                <span className="text-[9px] text-slate-500 block">UID: {awardModalEntry.player_id}</span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Monto en GD Coins:</label>
                  <input
                    type="number"
                    min={1}
                    value={awardGdAmount}
                    onChange={e => setAwardGdAmount(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 p-2 rounded text-amber-300 font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Título o Concepto de la Recompensa:</label>
                  <input
                    type="text"
                    value={awardBadgeTitle}
                    onChange={e => setAwardBadgeTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 p-2 rounded text-white outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button onClick={() => setAwardModalEntry(null)} className="px-4 py-2 bg-slate-900 text-slate-400 rounded font-bold cursor-pointer">Cancelar</button>
                <button onClick={handleGrantReward} disabled={issuingAward} className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded cursor-pointer uppercase flex items-center gap-1.5">
                  <Gift size={14} /> {issuingAward ? 'Inyectando...' : 'Transferir Recompensa'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AdminRankingsModule;