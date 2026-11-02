import React, { useEffect, useState } from 'react';
import { 
  ShieldAlert, RefreshCw, Users, Activity, CheckCircle2, Ban
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SecurityAlert {
  id: string;
  user_id: string;
  alert_type: string;
  severity: string;
  details: any;
  is_resolved: boolean;
  created_at: string;
  user_profiles?: { username: string; status: string; banned_until: string | null };
}

interface IPOverlap {
  ip_address: string;
  user_count: number;
  users: string[];
}

export const AdminSecurityModule: React.FC = () => {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [ipOverlaps, setIpOverlaps] = useState<IPOverlap[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');

  const fetchSecurityData = async () => {
    setLoading(true);
    try {
      // 1. Cargar Alertas de Seguridad con perfiles vinculados
      const { data: alertData } = await supabase
        .from('security_alerts')
        .select(`
          *,
          user_profiles:user_id (username, status, banned_until)
        `)
        .order('created_at', { ascending: false });

      if (alertData) setAlerts(alertData as any);

      // 2. Consulta a la vista SQL de IPs compartidas
      const { data: ipData } = await supabase
        .from('vw_ip_overlaps')
        .select('*');

      if (ipData) {
        setIpOverlaps(ipData as IPOverlap[]);
      }
    } catch (err) {
      console.error("Error al cargar radar de seguridad:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const handleResolveAlert = async (alertId: string) => {
    const { error } = await supabase
      .from('security_alerts')
      .update({ is_resolved: true })
      .eq('id', alertId);

    if (!error) {
      setAlerts(alerts.map(a => a.id === alertId ? { ...a, is_resolved: true } : a));
    }
  };

  const handleToggleBanUser = async (userId: string, username: string, currentBannedUntil?: string | null) => {
    const isCurrentlyBanned = Boolean(currentBannedUntil && new Date(currentBannedUntil).getTime() > Date.now());
    const actionLabel = isCurrentlyBanned ? 'DESBANEAR' : 'BANEAR (1 año)';

    if (!window.confirm(`⚠️ ¿Confirmas ${actionLabel} al comandante "${username}"?`)) return;

    const newBannedUntil = isCurrentlyBanned ? null : new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString();
    const newStatus = isCurrentlyBanned ? 'active' : 'banned';

    const { error } = await supabase
      .from('user_profiles')
      .update({ 
        status: newStatus,
        is_banned: !isCurrentlyBanned,
        banned_until: newBannedUntil,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (!error) {
      alert(`Piloto "${username}" actualizado: ${newStatus.toUpperCase()}`);
      fetchSecurityData();
    } else {
      alert(`Error al sancionar: ${error.message}`);
    }
  };

  const filteredAlerts = alerts.filter(a => 
    filterSeverity === 'ALL' || a.severity === filterSeverity
  );

  return (
    <div className="space-y-6 font-mono text-xs text-white p-6 animate-fadeIn text-left select-none">
      <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 uppercase text-red-500">
            <ShieldAlert size={20} /> Radar Anti-Cheat & Caja Negra Forense
          </h2>
          <p className="text-zinc-500 mt-1 font-sans text-[11px]">
            Detección automática de multicuentas por IP compartida, transferencias anómalas y sanciones directas con banned_until.
          </p>
        </div>

        <button 
          onClick={fetchSecurityData}
          className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded font-bold uppercase text-[10px] flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Escanear Red
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* IPs Compartidas */}
        <div className="bg-zinc-950 border border-red-900/30 rounded-xl p-5 space-y-4">
          <span className="text-xs font-bold uppercase tracking-widest text-red-400 flex items-center gap-2">
            <Users size={14} /> IPs Compartidas ({ipOverlaps.length})
          </span>

          <div className="space-y-3 pt-1 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
            {ipOverlaps.length === 0 ? (
              <div className="text-center py-8 text-zinc-600 border border-dashed border-zinc-850 rounded-lg">
                No se detectan direcciones IP vinculadas a múltiples cuentas.
              </div>
            ) : (
              ipOverlaps.map((overlap, idx) => (
                <div key={idx} className="p-3 bg-red-950/10 border border-red-900/40 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <strong className="text-white font-mono text-xs">{overlap.ip_address}</strong>
                    <span className="px-2 py-0.5 rounded bg-red-950 text-red-400 text-[9px] font-bold border border-red-800">
                      {overlap.user_count} CUENTAS
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-500 space-y-1">
                    <span>UIDs vinculados:</span>
                    {overlap.users.map(u => (
                      <span key={u} className="block text-zinc-400 font-mono truncate">{u}</span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Registro Forense de Incidentes */}
        <div className="lg:col-span-2 bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
              <Activity size={14} className="text-amber-500" /> Registro Forense de Incidentes ({filteredAlerts.length})
            </span>

            <div className="flex gap-1.5">
              {['ALL', 'CRITICAL', 'MEDIUM'].map(sev => (
                <button
                  key={sev}
                  onClick={() => setFilterSeverity(sev)}
                  className={`px-2 py-1 rounded text-[9px] font-bold uppercase cursor-pointer border ${
                    filterSeverity === sev ? 'bg-zinc-800 text-white border-zinc-700' : 'bg-zinc-950 text-zinc-600 border-zinc-900'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-1">
            {filteredAlerts.length === 0 ? (
              <div className="text-center py-8 text-zinc-600 border border-dashed border-zinc-850 rounded-lg">
                Sin alertas de seguridad pendientes de resolución.
              </div>
            ) : (
              filteredAlerts.map(alert => {
                const isBanned = Boolean(
                  alert.user_profiles?.banned_until && 
                  new Date(alert.user_profiles.banned_until).getTime() > Date.now()
                );

                return (
                  <div 
                    key={alert.id} 
                    className={`p-4 rounded-xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                      alert.is_resolved ? 'bg-zinc-900/20 border-zinc-850 opacity-60' : 'bg-zinc-900/40 border-zinc-800'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[8.5px] font-bold uppercase ${
                          alert.severity === 'CRITICAL' ? 'bg-red-950 text-red-400 border border-red-900' : 'bg-amber-950 text-amber-400 border border-amber-900'
                        }`}>
                          {alert.severity}
                        </span>
                        <strong className="text-white text-xs">{alert.alert_type}</strong>
                        {isBanned && (
                          <span className="px-1.5 py-0.2 bg-red-950 text-red-400 border border-red-800 rounded text-[8px] font-bold">
                            SUSPENDIDO
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] text-zinc-400 block font-sans">
                        Piloto: <strong className="text-zinc-200">{alert.user_profiles?.username || alert.user_id}</strong>
                      </span>

                      <span className="text-[9px] text-zinc-600 block font-mono">
                        Detalles: {typeof alert.details === 'object' ? JSON.stringify(alert.details) : alert.details}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center">
                      {!alert.is_resolved && (
                        <button 
                          onClick={() => handleResolveAlert(alert.id)}
                          className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-emerald-400 border border-zinc-800 rounded font-bold text-[9px] cursor-pointer flex items-center gap-1"
                        >
                          <CheckCircle2 size={11} /> Resolver
                        </button>
                      )}
                      <button 
                        onClick={() => handleToggleBanUser(alert.user_id, alert.user_profiles?.username || 'Piloto', alert.user_profiles?.banned_until)}
                        className={`px-2.5 py-1 rounded font-bold text-[9px] cursor-pointer border flex items-center gap-1 ${
                          isBanned
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-800 hover:bg-emerald-900'
                            : 'bg-red-950/40 hover:bg-red-900 text-red-400 border-red-900/50'
                        }`}
                      >
                        <Ban size={11} />
                        {isBanned ? 'Desbanear' : 'Banquear'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSecurityModule;