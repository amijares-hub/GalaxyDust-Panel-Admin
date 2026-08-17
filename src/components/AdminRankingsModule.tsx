import React, { useEffect, useState } from 'react';
import { 
  Trophy, Medal, Award, RefreshCw, Plus, Trash2, 
  Users, BarChart3, CheckCircle2, ShieldAlert, Gift, Layers 
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';

interface RankingCategory {
  id: string;
  code: string;
  name: string;
  description: string;
  cycle_type: string;
  is_active: boolean;
}

interface RewardConfig {
  id: string;
  category_id: string;
  min_rank: number;
  max_rank: number;
  reward_gd_coins: number;
  reward_phantom_coins: number;
}

interface AuditLog {
  id: string;
  rank_achieved: number;
  score_achieved: number;
  reward_payload: any;
  distributed_by: string;
  created_at: string;
  user_profiles?: { username: string };
  ranking_categories?: { name: string };
}

interface AdminRankingsModuleProps {
  users?: UserProfile[];
  setIsAlertToShow?: (alert: { show: boolean; status: 'success' | 'error' | 'warning'; message: string }) => void;
}

export const AdminRankingsModule: React.FC<AdminRankingsModuleProps> = ({ setIsAlertToShow }) => {
  const [activeSubTab, setActiveSubTab] = useState<'categories' | 'rewards' | 'audit'>('categories');
  const [categories, setCategories] = useState<RankingCategory[]>([]);
  const [rewards, setRewards] = useState<RewardConfig[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Formulario nueva categoría
  const [newCatCode, setNewCatCode] = useState('');
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatCycle, setNewCatCycle] = useState('WEEKLY');

  // Formulario nuevo premio
  const [selectedCatId, setSelectedCatId] = useState<string>('');
  const [minRank, setMinRank] = useState<number>(1);
  const [maxRank, setMaxRank] = useState<number>(3);
  const [gdReward, setGdReward] = useState<number>(1000);
  const [phantomReward, setPhantomReward] = useState<number>(50);

  const fetchRankingsData = async () => {
    setLoading(true);
    try {
      const { data: catData } = await supabase.from('ranking_categories').select('*').order('created_at');
      if (catData) setCategories(catData);

      const { data: rewData } = await supabase.from('ranking_rewards_config').select('*');
      if (rewData) setRewards(rewData);

      const { data: logData } = await supabase
        .from('ranking_audit_logs')
        .select(`
          id, rank_achieved, score_achieved, reward_payload, distributed_by, created_at,
          user_profiles(username),
          ranking_categories(name)
        `)
        .order('created_at', { ascending: false })
        .limit(30);
      if (logData) setAuditLogs(logData as any);

    } catch (err: any) {
      console.error('Error al cargar rankings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRankingsData();
  }, []);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatCode || !newCatName) return;

    const { data, error } = await supabase
      .from('ranking_categories')
      .insert([{ code: newCatCode.toUpperCase(), name: newCatName, description: newCatDesc, cycle_type: newCatCycle }])
      .select()
      .single();

    if (!error && data) {
      setCategories([...categories, data]);
      setNewCatCode('');
      setNewCatName('');
      setNewCatDesc('');
      setIsAlertToShow?.({ show: true, status: 'success', message: 'Categoría de ranking creada con éxito.' });
    } else {
      setIsAlertToShow?.({ show: true, status: 'error', message: error?.message || 'Error al crear la categoría.' });
    }
  };

  const handleCreateReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCatId) return;

    const { data, error } = await supabase
      .from('ranking_rewards_config')
      .insert([{
        category_id: selectedCatId,
        min_rank: minRank,
        max_rank: maxRank,
        reward_gd_coins: gdReward,
        reward_phantom_coins: phantomReward
      }])
      .select()
      .single();

    if (!error && data) {
      setRewards([...rewards, data]);
      setIsAlertToShow?.({ show: true, status: 'success', message: 'Regla de recompensa guardada.' });
    } else {
      setIsAlertToShow?.({ show: true, status: 'error', message: error?.message || 'Error al guardar recompensa.' });
    }
  };

  const handleDeleteReward = async (id: string) => {
    const { error } = await supabase.from('ranking_rewards_config').delete().eq('id', id);
    if (!error) {
      setRewards(rewards.filter(r => r.id !== id));
      setIsAlertToShow?.({ show: true, status: 'success', message: 'Recompensa eliminada.' });
    }
  };

  return (
    <div className="space-y-6 font-mono text-xs text-white p-6 animate-fadeIn">
      {/* HEADER */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Trophy className="text-amber-500" size={20} /> rankings, Temporadas y Auditoría de Premios
          </h2>
          <p className="text-zinc-500 mt-1 font-sans">
            Configura los ciclos de competición, asigna las bolsas de premios por rangos y audita las entregas automatizadas.
          </p>
        </div>

        <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-1">
          <button
            onClick={() => setActiveSubTab('categories')}
            className={`px-3 py-1.5 rounded cursor-pointer transition-colors uppercase ${activeSubTab === 'categories' ? 'bg-amber-950/80 text-amber-400 font-bold border border-amber-900/50' : 'text-zinc-500 hover:text-white'}`}
          >
            Categorías
          </button>
          <button
            onClick={() => setActiveSubTab('rewards')}
            className={`px-3 py-1.5 rounded cursor-pointer transition-colors uppercase ${activeSubTab === 'rewards' ? 'bg-amber-950/80 text-amber-400 font-bold border border-amber-900/50' : 'text-zinc-500 hover:text-white'}`}
          >
            Premios por Rango
          </button>
          <button
            onClick={() => setActiveSubTab('audit')}
            className={`px-3 py-1.5 rounded cursor-pointer transition-colors uppercase ${activeSubTab === 'audit' ? 'bg-amber-950/80 text-amber-400 font-bold border border-amber-900/50' : 'text-zinc-500 hover:text-white'}`}
          >
            Auditoría de Entregas
          </button>
        </div>
      </div>

      {/* PESTAÑA 1: CATEGORÍAS */}
      {activeSubTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex justify-between items-center">
              <span>Métricas de Competición Activas ({categories.length})</span>
              {loading && <RefreshCw size={12} className="animate-spin text-amber-500" />}
            </span>

            <div className="space-y-3 pt-2">
              {categories.map((cat) => (
                <div key={cat.id} className="p-4 bg-zinc-900/40 border border-zinc-850 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-amber-950/50 border border-amber-900 text-amber-400 text-[10px] font-bold">
                        {cat.code}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-zinc-800 text-[9px] text-zinc-400 font-bold uppercase">
                        {cat.cycle_type}
                      </span>
                      <h3 className="font-bold text-white text-sm">{cat.name}</h3>
                    </div>
                    <p className="text-xs text-zinc-400 font-sans mt-1">{cat.description}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-[9px] font-bold ${cat.is_active ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' : 'bg-zinc-900 text-zinc-600'}`}>
                    {cat.is_active ? 'ONLINE' : 'PAUSADO'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* FORMULARIO CREADOR DE CATEGORÍA */}
          <form onSubmit={handleCreateCategory} className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold uppercase text-white flex items-center gap-1.5">
              <Plus size={14} className="text-amber-500" /> Nueva Métrica / Ranking
            </h3>

            <div className="space-y-2">
              <label className="text-[10px] text-zinc-500 uppercase font-bold block">Código Único</label>
              <input type="text" required placeholder="EJ: PVP_KILLS" value={newCatCode} onChange={e => setNewCatCode(e.target.value)} className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white uppercase outline-none focus:border-amber-500" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-zinc-500 uppercase font-bold block">Nombre</label>
              <input type="text" required placeholder="Asesino Intergaláctico" value={newCatName} onChange={e => setNewCatName(e.target.value)} className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white outline-none focus:border-amber-500" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-zinc-500 uppercase font-bold block">Descripción</label>
              <textarea placeholder="Puntuación acumulada por naves enemigas destruidas..." value={newCatDesc} onChange={e => setNewCatDesc(e.target.value)} className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white outline-none focus:border-amber-500 min-h-[70px] font-sans" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-zinc-500 uppercase font-bold block">Ciclo de Reset</label>
              <select value={newCatCycle} onChange={e => setNewCatCycle(e.target.value)} className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white outline-none cursor-pointer">
                <option value="DAILY">Diario</option>
                <option value="WEEKLY">Semanal</option>
                <option value="SEASONAL">Temporada (Mensual)</option>
              </select>
            </div>

            <button type="submit" className="w-full bg-amber-600 hover:bg-amber-500 text-black font-bold uppercase py-2.5 rounded transition-all cursor-pointer">
              Registrar Categoría
            </button>
          </form>
        </div>
      )}

      {/* PESTAÑA 2: CONFIGURACIÓN DE PREMIOS POR RANGO */}
      {activeSubTab === 'rewards' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">
              Escalas de Premios Configuradas
            </span>

            <div className="space-y-3 pt-2">
              {rewards.map((rew) => {
                const cat = categories.find(c => c.id === rew.category_id);
                return (
                  <div key={rew.id} className="p-4 bg-zinc-900/40 border border-zinc-850 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-amber-400 uppercase block">{cat?.name || 'Métrica General'}</span>
                      <h4 className="text-sm font-bold text-white mt-1">
                        Posiciones #{rew.min_rank} al #{rew.max_rank}
                      </h4>
                      <div className="flex gap-4 mt-2 text-xs">
                        <span className="text-zinc-400">GD Coins: <strong className="text-amber-400 font-mono">+{rew.reward_gd_coins}</strong></span>
                        <span className="text-zinc-400">Phantom Coins: <strong className="text-cyan-400 font-mono">+{rew.reward_phantom_coins}</strong></span>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteReward(rew.id)} className="p-2 bg-zinc-900 hover:bg-red-950/50 text-zinc-500 hover:text-red-400 border border-zinc-800 rounded cursor-pointer transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* FORMULARIO DE ASIGNACIÓN DE PREMIO */}
          <form onSubmit={handleCreateReward} className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold uppercase text-white flex items-center gap-1.5">
              <Gift size={14} className="text-amber-500" /> Configurar Bolsa de Premios
            </h3>

            <div className="space-y-2">
              <label className="text-[10px] text-zinc-500 uppercase font-bold block">Categoría de Ranking</label>
              <select value={selectedCatId} onChange={e => setSelectedCatId(e.target.value)} className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white outline-none cursor-pointer">
                <option value="">-- Seleccionar Métrica --</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] text-zinc-500 uppercase font-bold block">Rango Mínimo (#)</label>
                <input type="number" min={1} value={minRank} onChange={e => setMinRank(parseInt(e.target.value) || 1)} className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white font-mono" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-zinc-500 uppercase font-bold block">Rango Máximo (#)</label>
                <input type="number" min={1} value={maxRank} onChange={e => setMaxRank(parseInt(e.target.value) || 1)} className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white font-mono" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-zinc-500 uppercase font-bold block">Premio GD Coins</label>
              <input type="number" min={0} value={gdReward} onChange={e => setGdReward(parseInt(e.target.value) || 0)} className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-amber-400 font-mono font-bold" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-zinc-500 uppercase font-bold block">Premio Phantom Coins</label>
              <input type="number" min={0} value={phantomReward} onChange={e => setPhantomReward(parseInt(e.target.value) || 0)} className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-cyan-400 font-mono font-bold" />
            </div>

            <button type="submit" className="w-full bg-amber-600 hover:bg-amber-500 text-black font-bold uppercase py-2.5 rounded transition-all cursor-pointer">
              Vincular Recompensa
            </button>
          </form>
        </div>
      )}

      {/* PESTAÑA 3: AUDITORÍA DE ENTREGAS */}
      {activeSubTab === 'audit' && (
        <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4">
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-500" /> Historial Reciente de Premios Entregados
          </span>

          <div className="space-y-2 pt-2">
            {auditLogs.length === 0 ? (
              <div className="text-center py-8 text-zinc-600 border border-dashed border-zinc-800 rounded-lg">
                No hay entregas registradas en los logs.
              </div>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="p-3 bg-zinc-900/30 border border-zinc-850 rounded-lg flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white font-mono">{log.user_profiles?.username || 'Usuario Desconocido'}</span>
                    <span className="text-[10px] text-zinc-500 block">
                      Obtuvo Rango #{log.rank_achieved} en {log.ranking_categories?.name || 'Métrica'} con {log.score_achieved} pts.
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-400 font-bold font-mono block">
                      {JSON.stringify(log.reward_payload)}
                    </span>
                    <span className="text-[9px] text-zinc-600 block">
                      {new Date(log.created_at).toLocaleString()} • {log.distributed_by}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRankingsModule;
