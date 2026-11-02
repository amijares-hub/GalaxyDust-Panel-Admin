import React, { useState, useEffect } from 'react';
import { 
  Globe, Smartphone, Monitor, AlertTriangle, CheckCircle2, 
  Save, RefreshCw, Power, Download, Shield, Terminal, Radio,
  Layers, Plus, Trash2, FileText, ExternalLink
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AppSystemConfig {
  id: number;
  min_required_version: string;
  current_latest_version: string;
  is_maintenance: boolean;
  maintenance_message: string;
  download_url_windows: string;
  download_url_android: string;
  download_url_ios: string;
  force_update?: boolean;
  patch_notes?: Array<{
    version: string;
    date: string;
    title: string;
    highlights: string[];
  }>;
}

interface AdminClientDeployerProps {
  setIsAlertToShow?: (alert: { show: boolean; status: 'success' | 'error' | 'warning'; message: string }) => void;
}

export const AdminClientDeployer: React.FC<AdminClientDeployerProps> = ({ setIsAlertToShow }) => {
  const [config, setConfig] = useState<AppSystemConfig>({
    id: 1,
    min_required_version: '1.1.2',
    current_latest_version: '1.1.2',
    is_maintenance: false,
    maintenance_message: 'Servidores de GalaxyDust en calibración militar. Regresamos en breve.',
    download_url_windows: 'https://galaxydust.io/downloads/GalaxyDust_Setup_v1.1.2.exe',
    download_url_android: 'https://galaxydust.io/downloads/GalaxyDust_v1.1.2.apk',
    download_url_ios: '',
    force_update: true,
    patch_notes: [
      {
        version: '1.1.2',
        date: '2026-05-20',
        title: 'Parche de Sincronización Estelar',
        highlights: [
          'Sincronización completa con Supabase PostgreSQL.',
          'Corrección en cálculo de resistencia y combate de naves.',
          'Habilitación de las 15 categorías de inventario y consumibles QMP.'
        ]
      }
    ]
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'versions' | 'maintenance' | 'patch_notes'>('versions');

  // Formulario nuevo parche
  const [newVersion, setNewVersion] = useState<string>('1.1.3');
  const [newTitle, setNewTitle] = useState<string>('');
  const [newHighlight, setNewHighlight] = useState<string>('');
  const [currentHighlights, setCurrentHighlights] = useState<string[]>([]);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('app_system_config')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setConfig({
          ...data,
          patch_notes: Array.isArray(data.patch_notes) ? data.patch_notes : (config.patch_notes || [])
        });
      } else {
        // Inicializar fila 1 si no existe en producción
        await supabase.from('app_system_config').insert([config]);
      }
    } catch (err: any) {
      console.warn("Aviso al consultar app_system_config:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      const payload = {
        ...config,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('app_system_config')
        .upsert(payload);

      if (error) throw error;

      await supabase.from('maintenance_logs').insert([{
        action_type: config.is_maintenance ? 'MAINTENANCE_MODE_ENABLED' : 'CONFIG_OTA_UPDATED',
        records_affected: 1,
        created_at: new Date().toISOString()
      }]);

      if (setIsAlertToShow) {
        setIsAlertToShow({
          show: true,
          status: 'success',
          message: '🚀 ¡DIRECTRICES OTA DESPLEGADAS! Clientes de juego sincronizados.'
        });
      }
    } catch (err: any) {
      if (setIsAlertToShow) {
        setIsAlertToShow({
          show: true,
          status: 'error',
          message: `Error al persistir OTA: ${err.message}`
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAddHighlight = () => {
    if (!newHighlight.trim()) return;
    setCurrentHighlights([...currentHighlights, newHighlight.trim()]);
    setNewHighlight('');
  };

  const handleAddPatchNote = () => {
    if (!newVersion.trim() || !newTitle.trim()) {
      alert("Introduce la versión y el título del parche.");
      return;
    }

    const note = {
      version: newVersion.trim(),
      date: new Date().toISOString().split('T')[0],
      title: newTitle.trim(),
      highlights: currentHighlights.length > 0 ? currentHighlights : ['Actualizaciones de estabilidad y balance general.']
    };

    const updatedNotes = [note, ...(config.patch_notes || [])];
    setConfig(prev => ({
      ...prev,
      current_latest_version: newVersion.trim(),
      patch_notes: updatedNotes
    }));

    setNewTitle('');
    setCurrentHighlights([]);
    alert(`Nota de parche v${note.version} agregada. Recuerda pulsar "Desplegar Directrices".`);
  };

  const handleDeletePatchNote = (index: number) => {
    const updated = (config.patch_notes || []).filter((_, i) => i !== index);
    setConfig(prev => ({ ...prev, patch_notes: updated }));
  };

  return (
    <div className="space-y-6 font-mono text-xs text-left text-white select-none animate-fadeIn">
      {/* CABECERA */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="text-cyan-400 animate-pulse" size={18} />
            <h1 className="text-lg font-bold text-white uppercase tracking-wide">
              Centro de Despliegue de Clientes & Control OTA
            </h1>
          </div>
          <p className="text-xs text-zinc-500 font-sans mt-1">
            Administración centralizada de ejecutables de PC/Windows, APKs Android, control de versiones mínimas y switch global de mantenimiento.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchConfig}
            className="px-3 py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 font-bold uppercase rounded-lg text-xs cursor-pointer flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Sincronizar
          </button>
          <button
            onClick={handleSaveConfig}
            disabled={saving}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-black uppercase rounded-lg text-xs cursor-pointer flex items-center gap-1.5 shadow-lg shadow-cyan-950/50 transition-all"
          >
            <Save size={13} /> {saving ? 'Desplegando...' : 'Desplegar Directrices'}
          </button>
        </div>
      </div>

      {/* TARJETAS DE ESTADO RÁPIDO */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className={`p-4 rounded-xl border flex justify-between items-center ${
          config.is_maintenance 
            ? 'bg-red-950/30 border-red-800/80 text-red-300' 
            : 'bg-zinc-950 border-zinc-900 text-emerald-400'
        }`}>
          <div>
            <span className="text-[9px] uppercase font-bold text-zinc-500 block">Estado Global del Juego</span>
            <strong className="text-sm font-black uppercase block mt-0.5">
              {config.is_maintenance ? '🔴 En Mantenimiento' : '🟢 Servidores Online'}
            </strong>
          </div>
          <Power size={22} className={config.is_maintenance ? 'text-red-500 animate-pulse' : 'text-emerald-500'} />
        </div>

        <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl flex justify-between items-center">
          <div>
            <span className="text-[9px] uppercase font-bold text-zinc-500 block">Versión Mínima Requerida</span>
            <strong className="text-amber-400 text-sm font-black block mt-0.5">v{config.min_required_version}</strong>
            <span className="text-[8.5px] text-zinc-600 block">Bloquea builds viejas</span>
          </div>
          <AlertTriangle size={20} className="text-amber-500" />
        </div>

        <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl flex justify-between items-center">
          <div>
            <span className="text-[9px] uppercase font-bold text-zinc-500 block">Última Versión Publicada</span>
            <strong className="text-cyan-400 text-sm font-black block mt-0.5">v{config.current_latest_version}</strong>
            <span className="text-[8.5px] text-zinc-600 block">Build oficial activa</span>
          </div>
          <CheckCircle2 size={20} className="text-cyan-500" />
        </div>

        <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl flex justify-between items-center">
          <div>
            <span className="text-[9px] uppercase font-bold text-zinc-500 block">Notas de Parche</span>
            <strong className="text-purple-400 text-sm font-black block mt-0.5">
              {(config.patch_notes || []).length} Publicaciones
            </strong>
            <span className="text-[8.5px] text-zinc-600 block">En launcher y clientes</span>
          </div>
          <FileText size={20} className="text-purple-500" />
        </div>
      </div>

      {/* PESTAÑAS */}
      <div className="flex border-b border-zinc-900 gap-1 select-none">
        <button
          onClick={() => setActiveTab('versions')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'versions' ? 'bg-cyan-950/20 text-cyan-400 border-cyan-500' : 'text-zinc-500 border-transparent hover:text-zinc-300'
          }`}
        >
          <Monitor size={13} /> Versiones y Enlaces de Descarga
        </button>

        <button
          onClick={() => setActiveTab('maintenance')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'maintenance' ? 'bg-red-950/20 text-red-400 border-red-500' : 'text-zinc-500 border-transparent hover:text-zinc-300'
          }`}
        >
          <Power size={13} /> Switch de Mantenimiento
        </button>

        <button
          onClick={() => setActiveTab('patch_notes')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'patch_notes' ? 'bg-purple-950/20 text-purple-400 border-purple-500' : 'text-zinc-500 border-transparent hover:text-zinc-300'
          }`}
        >
          <FileText size={13} /> Notas de Parche (Changelog)
        </button>
      </div>

      {/* TAB 1: VERSIONES Y ENLACES DE DESCARGA */}
      {activeTab === 'versions' && (
        <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-5 animate-fadeIn">
          <span className="text-xs font-bold uppercase text-cyan-400 block border-b border-zinc-900 pb-2">
            ⚙️ Parametrización de Versiones de Ejecutables
          </span>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 bg-black/60 p-3.5 rounded-xl border border-zinc-850">
              <label className="text-[10px] text-zinc-400 uppercase font-bold block">
                Versión Mínima Requerida (Obligatoria):
              </label>
              <input
                type="text"
                value={config.min_required_version}
                onChange={e => setConfig({ ...config, min_required_version: e.target.value.trim() })}
                className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded text-amber-400 font-bold text-xs outline-none focus:border-cyan-500"
                placeholder="1.1.2"
              />
              <span className="text-[8.5px] text-zinc-500 block">
                Cualquier cliente con versión inferior recibirá la pantalla obligatoria de actualización.
              </span>
            </div>

            <div className="space-y-1.5 bg-black/60 p-3.5 rounded-xl border border-zinc-850">
              <label className="text-[10px] text-zinc-400 uppercase font-bold block">
                Última Versión Publicada (Build Actual):
              </label>
              <input
                type="text"
                value={config.current_latest_version}
                onChange={e => setConfig({ ...config, current_latest_version: e.target.value.trim() })}
                className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded text-cyan-300 font-bold text-xs outline-none focus:border-cyan-500"
                placeholder="1.1.2"
              />
              <span className="text-[8.5px] text-zinc-500 block">
                Número de build recomendado que se mostrará en el launcher oficial.
              </span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <span className="text-[10px] text-zinc-400 uppercase font-bold block">
              🌐 Enlaces de Descarga Directa de Servidor
            </span>

            <div className="space-y-2.5">
              <div className="flex bg-black border border-zinc-850 rounded-lg overflow-hidden">
                <span className="bg-zinc-900 px-3 py-2 text-zinc-400 font-bold text-[10px] w-28 flex items-center gap-1 shrink-0">
                  <Monitor size={12} /> Windows PC
                </span>
                <input
                  type="text"
                  value={config.download_url_windows}
                  onChange={e => setConfig({ ...config, download_url_windows: e.target.value.trim() })}
                  className="w-full bg-transparent px-3 text-white text-xs outline-none font-mono"
                  placeholder="https://servidor.com/GalaxyDust_PC.exe"
                />
              </div>

              <div className="flex bg-black border border-zinc-850 rounded-lg overflow-hidden">
                <span className="bg-zinc-900 px-3 py-2 text-zinc-400 font-bold text-[10px] w-28 flex items-center gap-1 shrink-0">
                  <Smartphone size={12} /> Android APK
                </span>
                <input
                  type="text"
                  value={config.download_url_android}
                  onChange={e => setConfig({ ...config, download_url_android: e.target.value.trim() })}
                  className="w-full bg-transparent px-3 text-white text-xs outline-none font-mono"
                  placeholder="https://servidor.com/GalaxyDust.apk"
                />
              </div>

              <div className="flex bg-black border border-zinc-850 rounded-lg overflow-hidden">
                <span className="bg-zinc-900 px-3 py-2 text-zinc-400 font-bold text-[10px] w-28 flex items-center gap-1 shrink-0">
                  <Smartphone size={12} /> Apple iOS
                </span>
                <input
                  type="text"
                  value={config.download_url_ios || ''}
                  onChange={e => setConfig({ ...config, download_url_ios: e.target.value.trim() })}
                  className="w-full bg-transparent px-3 text-white text-xs outline-none font-mono"
                  placeholder="https://apps.apple.com/app/id..."
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SWITCH DE MANTENIMIENTO */}
      {activeTab === 'maintenance' && (
        <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-5 animate-fadeIn">
          <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
            <div>
              <span className="text-xs font-bold uppercase text-red-400 block">
                🚨 Protocolo de Mantenimiento Global
              </span>
              <p className="text-[11px] text-zinc-500 font-sans mt-0.5">
                Al activar el switch de mantenimiento, todas las aplicaciones y lanzadores cerrarán sesiones activas y desplegarán la pantalla de calibración.
              </p>
            </div>

            <button
              onClick={() => setConfig({ ...config, is_maintenance: !config.is_maintenance })}
              className={`px-4 py-2 rounded-lg font-black uppercase text-xs border transition-all cursor-pointer flex items-center gap-2 ${
                config.is_maintenance
                  ? 'bg-red-650 text-white border-red-500 animate-pulse shadow-lg shadow-red-950/60'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
              }`}
            >
              <Power size={14} />
              {config.is_maintenance ? 'MANTENIMIENTO ACTIVADO' : 'SISTEMA ONLINE (NORMAL)'}
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-zinc-400 uppercase font-bold block">
              Mensaje en Pantalla para los Jugadores:
            </label>
            <textarea
              rows={4}
              value={config.maintenance_message}
              onChange={e => setConfig({ ...config, maintenance_message: e.target.value })}
              className="w-full bg-black border border-zinc-850 rounded-lg p-3 text-white text-xs font-mono outline-none focus:border-red-500"
              placeholder="Escribe el comunicado..."
            />
          </div>
        </div>
      )}

      {/* TAB 3: NOTAS DE PARCHE (CHANGELOG) */}
      {activeTab === 'patch_notes' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4 shadow-xl">
            <span className="text-xs font-bold uppercase text-purple-400 block border-b border-zinc-900 pb-2">
              📝 Publicar Nueva Nota de Parche
            </span>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-[9.5px] text-zinc-500 uppercase font-bold block mb-1">Versión:</label>
                <input
                  type="text"
                  value={newVersion}
                  onChange={e => setNewVersion(e.target.value)}
                  className="w-full bg-black border border-zinc-800 p-2 rounded text-white text-xs outline-none"
                  placeholder="1.1.3"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-[9.5px] text-zinc-500 uppercase font-bold block mb-1">Título del Parche:</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full bg-black border border-zinc-800 p-2 rounded text-white text-xs outline-none"
                  placeholder="Ej: Calibración de Motores & Nuevos Nodos"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9.5px] text-zinc-500 uppercase font-bold block">Puntos Destacados:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newHighlight}
                  onChange={e => setNewHighlight(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddHighlight())}
                  placeholder="Añadir punto destacado..."
                  className="w-full bg-black border border-zinc-800 p-2 rounded text-white text-xs outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddHighlight}
                  className="px-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-bold uppercase text-[10px] rounded cursor-pointer"
                >
                  + Añadir
                </button>
              </div>

              {currentHighlights.length > 0 && (
                <div className="space-y-1 pt-1">
                  {currentHighlights.map((hl, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-black/60 p-2 rounded text-[10px] border border-zinc-850">
                      <span>• {hl}</span>
                      <button onClick={() => setCurrentHighlights(currentHighlights.filter((_, i) => i !== idx))} className="text-zinc-600 hover:text-red-400 cursor-pointer">
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleAddPatchNote}
              className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold uppercase rounded-lg text-xs cursor-pointer shadow-lg transition-all"
            >
              Registrar Nota de Parche
            </button>
          </div>

          {/* Historial de Notas de Parche */}
          <div className="space-y-3">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
              Historial de Parches Publicados ({(config.patch_notes || []).length})
            </span>

            {(config.patch_notes || []).map((pn, idx) => (
              <div key={idx} className="bg-zinc-950 border border-zinc-900 rounded-xl p-4 space-y-2">
                <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-purple-950 text-purple-300 border border-purple-800 rounded font-bold text-[9px]">
                      v{pn.version}
                    </span>
                    <strong className="text-white text-xs">{pn.title}</strong>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] text-zinc-500">{pn.date}</span>
                    <button
                      onClick={() => handleDeletePatchNote(idx)}
                      className="text-zinc-600 hover:text-red-400 cursor-pointer"
                      title="Eliminar nota"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                <ul className="space-y-1 text-zinc-400 text-[10.5px] font-sans pl-2">
                  {(pn.highlights || []).map((h, hIdx) => (
                    <li key={hIdx} className="flex items-start gap-1.5">
                      <span className="text-purple-400">•</span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminClientDeployer;