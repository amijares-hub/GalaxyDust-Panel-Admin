import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, Database, Trash2, ShieldAlert, FileText, 
  Terminal, Server, Activity, CheckCircle2 
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AdminSanitizerModuleProps {
  gameHud?: any;
  saveGameHud?: (hud: any) => void;
  alertTrigger?: (status: 'success' | 'error' | 'warning', msg: string) => void;
}

interface MaintenanceLog {
  id: string;
  action_type: string;
  records_affected: number;
  created_at: string;
  user_profiles?: { username: string };
}

export const AdminSanitizerModule: React.FC<AdminSanitizerModuleProps> = ({ alertTrigger }) => {
  const [isPurging, setIsPurging] = useState(false);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('maintenance_logs')
        .select(`
          *,
          user_profiles:executed_by (username)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) setMaintenanceLogs(data as any);
    } catch (e) {
      console.error("Error al cargar logs de mantenimiento:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleDeepPurge = async () => {
    if (!window.confirm("⚠️ ALERTA CRÍTICA: Estás a punto de ejecutar un DEEP PURGE en la base de datos de producción. ¿Estás seguro de querer borrar todos los historiales inactivos y subastas vencidas?")) return;

    setIsPurging(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("No autenticado.");

      const { data, error } = await supabase.rpc('execute_system_sanitization', {
        p_admin_id: userData.user.id
      });

      if (error) throw error;

      alertTrigger?.('success', `Purga completada. Registros eliminados: ${data.total_purged}`);
      fetchLogs();
    } catch (e: any) {
      alertTrigger?.('error', `Error durante la purga: ${e.message}`);
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <div className="space-y-6 font-mono text-xs text-white p-6 animate-fadeIn">
      {/* HEADER */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 uppercase text-cyan-500">
            <Database size={20} /> Data Sanitizer Sci-Fi
          </h2>
          <p className="text-zinc-500 mt-1 font-sans text-[11px]">
            Protocolo de mantenimiento automatizado para compactar la base de datos, optimizar queries y purgar basura espacial acumulada.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PANEL IZQUIERDO: CONTROLES DE PURGA */}
        <div className="space-y-6">
          <div className="bg-zinc-950 border border-red-900/30 rounded-xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Server size={120} />
            </div>
            
            <div className="relative z-10 space-y-4">
              <h3 className="text-lg font-bold text-red-500 flex items-center gap-2">
                <ShieldAlert size={18} /> PROTOCOLO: DEEP PURGE
              </h3>
              <p className="text-zinc-400 font-sans leading-relaxed">
                Este comando ejecutará una limpieza masiva a nivel de servidor (RPC) ignorando restricciones menores. 
                Eliminará definitivamente:
              </p>
              
              <ul className="space-y-2 text-zinc-500">
                <li className="flex items-center gap-2"><Trash2 size={12} className="text-red-500"/> Ofertas del mercado caducadas (&gt;48h).</li>
                <li className="flex items-center gap-2"><Trash2 size={12} className="text-red-500"/> Logs transaccionales antiguos (&gt;60 días).</li>
                <li className="flex items-center gap-2"><Trash2 size={12} className="text-red-500"/> Alertas de seguridad resueltas (&gt;30 días).</li>
                <li className="flex items-center gap-2"><Trash2 size={12} className="text-red-500"/> Restos de expediciones fantasma.</li>
              </ul>

              <button 
                onClick={handleDeepPurge}
                disabled={isPurging}
                className={`w-full py-3 mt-4 rounded-lg font-bold text-sm uppercase tracking-widest transition-all ${
                  isPurging 
                    ? 'bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed' 
                    : 'bg-red-950 hover:bg-red-900 text-red-400 border border-red-900/50 shadow-[0_0_15px_rgba(239,68,68,0.2)] hover:shadow-[0_0_25px_rgba(239,68,68,0.4)] cursor-pointer'
                }`}
              >
                {isPurging ? (
                  <span className="flex items-center justify-center gap-2">
                    <RefreshCw size={16} className="animate-spin" /> ESTERILIZANDO SERVIDORES...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Terminal size={16} /> INICIAR EXTERMINIO DE BASURA
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* PANEL DERECHO: CONSOLA DE REGISTROS DE MANTENIMIENTO */}
        <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 flex flex-col h-full min-h-[400px]">
          <div className="flex justify-between items-center border-b border-zinc-900 pb-3 mb-3">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
              <FileText size={14} className="text-cyan-500" /> Auditoría de Mantenimiento
            </span>
            <button onClick={fetchLogs} className="p-1 text-zinc-500 hover:text-white cursor-pointer">
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {maintenanceLogs.length === 0 ? (
              <div className="h-full flex items-center justify-center text-zinc-600 border border-dashed border-zinc-850 rounded-lg p-8 text-center">
                El sistema de archivos está impecable. No hay registros de mantenimiento previos.
              </div>
            ) : (
              maintenanceLogs.map(log => (
                <div key={log.id} className="p-3 bg-zinc-900/30 border border-zinc-850 rounded-lg flex items-center justify-between">
                  <div>
                    <strong className="text-cyan-400 font-bold block">{log.action_type}</strong>
                    <span className="text-[10px] text-zinc-500">
                      Ejecutado por: <span className="text-zinc-300">{log.user_profiles?.username || 'Sistema'}</span>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-red-400 flex items-center justify-end gap-1">
                      <Trash2 size={10} /> {log.records_affected} filas
                    </span>
                    <span className="text-[9px] text-zinc-600 block mt-0.5">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSanitizerModule;