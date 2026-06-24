import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';
import {
  Building, Cpu, Bot, FileText, Package, Sliders, FileBadge,
  Plus, Minus, Trash2, Search, RefreshCw, AlertTriangle, Zap,
  CheckCircle, PlusCircle, Hammer, LayoutGrid, Award, Shield, HardDrive, Key
} from 'lucide-react';

// Interfaces del Catálogo Global Real de Semillas (Supabase)
interface StructureAsset {
  id: string;
  name: string;
  rarity: string;
  collection: string;
  type: string;
  company: string;
  power_score: number;
  description: string;
}

interface TechnologyAsset {
  id: string;
  name: string;
  rarity: string;
  collection: string;
  type: string;
  company: string;
  power_score: number;
  description: string;
}

interface BadgeAsset {
  id: string;
  name: string;
  type: string;
  collection: string;
  power_score: number;
  description: string;
  effect: string;
  stack: string;
  duration: string;
  rarity: string;
}

// Interfaces de Relaciones de Inventarios de los Jugadores
interface UserAssetRow {
  id: string;
  user_id: string;
  asset_id: string;
  current_level: number;
  asset_type: 'estructura' | 'tecnologia' | 'badge';
}

interface AdminAssetMatrixModuleProps {
  users: any[];
  setIsAlertToShow: (alert: { show: boolean; status: 'success' | 'error'; message: string }) => void;
  onRefreshData?: () => void;
}

export default function AdminAssetMatrixModule({
  users,
  setIsAlertToShow,
  onRefreshData
}: AdminAssetMatrixModuleProps) {

  // NAVEGACIÓN Y CONFIGURACIÓN DE PESTAÑAS CANÓNICAS
  const [activeTab, setActiveTab] = useState<'estructuras' | 'tecnologias' | 'badges'>('estructuras');
  const [loading, setLoading] = useState<boolean>(true);
  const [dbClient, setDbClient] = useState<any>(null);

  // LISTAS DE ALMACENAMIENTO CENTRAL EN LÍNEA
  const [structuresList, setStructuresList] = useState<StructureAsset[]>([]);
  const [technologiesList, setTechnologiesList] = useState<TechnologyAsset[]>([]);
  const [badgesList, setBadgesList] = useState<BadgeAsset[]>([]);
  const [playerInventory, setPlayerInventory] = useState<UserAssetRow[]>([]);

  // CONSOLA DE FILTRADO Y BÚSQUEDA TÁCTICA
  const [matrixSearchQuery, setMatrixSearchQuery] = useState('');
  const [matrixRarityFilter, setMatrixRarityFilter] = useState('all');
  const [matrixSortOrder, setMatrixSortOrder] = useState<'asc' | 'desc'>('desc');

  // CONSOLA DE BÚSQUEDA Y ENLACE DE PILOTOS (AUDITORÍA DERECHA)
  const [playerSearchQuery, setPlayerSearchQuery] = useState('');
  const [auditedUser, setAuditedUser] = useState<any>(null);

  // CONEXIÓN SÍNCRONA DE CIRCUITOS CON EL INICIALIZADOR DINÁMICO DE SUPABASE
  useEffect(() => {
    const url = localStorage.getItem('supabase_url') || (window as any)._env_?.VITE_SUPABASE_URL;
    const key = localStorage.getItem('supabase_anon_key') || (window as any)._env_?.VITE_SUPABASE_ANON_KEY;

    if (url && key) {
      const client = createClient(url, key);
      setDbClient(client);
    } else {
      console.warn("Falta configuración dinámica de red en el almacenamiento del cliente.");
      setLoading(false);
    }
  }, []);

  // DISPARADOR DE TRANSMISIÓN DE DATOS EN CUANTO EL CLIENTE QUEDE CONFIGURADO
  useEffect(() => {
    if (dbClient) {
      loadCentralMatrixData();
    }
  }, [dbClient, auditedUser]);

  const loadCentralMatrixData = async () => {
    if (!dbClient) return;
    try {
      setLoading(true);

      // DESCARGA ASÍNCRONA DEL CATÁLOGO REAL DE ESTRUCTURAS
      const { data: sData } = await dbClient.from('seed_structures').select('*').order('name');
      setStructuresList(sData || []);

      // DESCARGA ASÍNCRONA DEL CATÁLOGO REAL DE TECNOLOGÍAS
      const { data: tData } = await dbClient.from('seed_technologies').select('*').order('name');
      setTechnologiesList(tData || []);

      // DESCARGA ASÍNCRONA DEL CATÁLOGO REAL DE BADGES
      const { data: bData } = await dbClient.from('seed_badges').select('*').order('name');
      setBadgesList(bData || []);

      // SI HAY UN PILOTO ACOPLADO, LEER SU INVENTARIO REAL EN LA BASE DE DATOS
      if (auditedUser) {
        const { data: invData } = await dbClient
          .from('player_structures') // Tabla relacional de niveles de usuario
          .select('*')
          .eq('user_id', auditedUser.id);
        setPlayerInventory(invData || []);
      }

    } catch (e: any) {
      console.error("Fallo en la descarga de componentes de red:", e.message);
    } finally {
      setLoading(false);
    }
  };

  // VINCULADOR COGNITIVO: CONECTAR PERFIL DEL COMANDANTE EN TIEMPO REAL
  const handleLinkPilotTerminal = () => {
    if (!playerSearchQuery.trim()) {
      return setIsAlertToShow({ show: true, status: 'error', message: 'Ingrese email o identificador de piloto.' });
    }
    const query = playerSearchQuery.toLowerCase();
    const match = users.find(u => u.id?.toLowerCase() === query || u.email?.toLowerCase() === query || u.username?.toLowerCase().includes(query));

    if (match) {
      setAuditedUser(match);
      setIsAlertToShow({ show: true, status: 'success', message: `AUDITORÍA: Enlazando bitácora en vivo de ${match.username}` });
    } else {
      setIsAlertToShow({ show: true, status: 'error', message: 'No se localizó ningún capitán estelar en los registros.' });
    }
  };

  // MODIFICADORES DE SOPORTE DIRECTOS SOBRE LA BASE DE DATOS (INYECCIÓN +1 / -1 / PURGAR)
  const handleAlterAssetLevel = async (assetId: string, delta: number) => {
    if (!dbClient || !auditedUser) return;
    try {
      const existing = playerInventory.find(item => item.asset_id === assetId);

      if (existing) {
        const targetLvl = existing.current_level + delta;
        if (targetLvl <= 0) {
          await dbClient.from('player_structures').delete().eq('id', existing.id);
          setIsAlertToShow({ show: true, status: 'error', message: 'Activo desmantelado y purgado de la cuenta.' });
        } else {
          await dbClient.from('player_structures').update({ current_level: targetLvl }).eq('id', existing.id);
          setIsAlertToShow({ show: true, status: 'success', message: 'Módulo de nivelación modificado con éxito.' });
        }
      } else if (delta > 0) {
        await dbClient.from('player_structures').insert([{
          user_id: auditedUser.id,
          asset_id: assetId,
          current_level: 1,
          asset_type: activeTab.slice(0, -1)
        }]);
        setIsAlertToShow({ show: true, status: 'success', message: '¡INYECTAR DIRECTO! Elemento instalado en Nivel 1.' });
      }
      loadCentralMatrixData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // FORMATEADOR MATEMÁTICO: TOPE MÁXIMO DE 2 DECIMALES, SIN TEXTOS ADICIONALES
  const formatPureDecimal = (val: number) => {
    return val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  // FILTRADO DINÁMICO EN MEMORIA PARA LAS REJILLAS DE CATÁLOGOS
  const filteredStructures = useMemo(() => {
    return structuresList.filter(s => {
      const matchQ = s.name.toLowerCase().includes(matrixSearchQuery.toLowerCase()) || s.id.toLowerCase().includes(matrixSearchQuery.toLowerCase());
      const matchR = matrixRarityFilter === 'all' || s.rarity.toLowerCase() === matrixRarityFilter.toLowerCase();
      return matchQ && matchR;
    });
  }, [structuresList, matrixSearchQuery, matrixRarityFilter]);

  const filteredTechnologies = useMemo(() => {
    return technologiesList.filter(t => {
      const matchQ = t.name.toLowerCase().includes(matrixSearchQuery.toLowerCase()) || t.id.toLowerCase().includes(matrixSearchQuery.toLowerCase());
      const matchR = matrixRarityFilter === 'all' || t.rarity.toLowerCase() === matrixRarityFilter.toLowerCase();
      return matchQ && matchR;
    });
  }, [technologiesList, matrixSearchQuery, matrixRarityFilter]);

  const filteredBadges = useMemo(() => {
    return badgesList.filter(b => {
      const matchQ = b.name.toLowerCase().includes(matrixSearchQuery.toLowerCase()) || b.id.toLowerCase().includes(matrixSearchQuery.toLowerCase());
      const matchR = matrixRarityFilter === 'all' || b.rarity.toLowerCase() === matrixRarityFilter.toLowerCase();
      return matchQ && matchR;
    });
  }, [badgesList, matrixSearchQuery, matrixRarityFilter]);

  if (loading) {
    return (
      <div className="p-8 text-center text-red-500 animate-pulse font-mono text-xs tracking-widest bg-zinc-950 min-h-screen flex flex-col items-center justify-center">
        ⚡ ESTABLECIENDO HANDSHAKE DE RED CON LAS MATRICES DE SUPABASE...
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 w-full bg-zinc-950 text-zinc-100 min-h-screen font-mono text-xs">

      {/* HEADER COPIADO FIELMENTE DEL PROTOCOLO ORIGINAL */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-900 shattered-crests pb-4">
        <div>
          <span className="text-[10px] font-bold text-red-500 tracking-widest uppercase block">NÚCLEOS DE OPERACIÓN GENERAL</span>
          <h1 className="text-lg md:text-xl font-black tracking-tight text-white uppercase mt-0.5">MATRIZ DE COMPONENTES DE VUELO</h1>
          <p className="text-[11px] text-zinc-500 font-sans mt-0.5">Ingeniería de datos relacionales en Supabase para el balance de SASORILABS.IO.</p>
        </div>
        <button onClick={loadCentralMatrixData} className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 rounded text-zinc-300 transition-colors flex items-center gap-1.5 cursor-pointer">
          <RefreshCw className="w-3.5 h-3.5" /> RE-SINCRONIZAR CENTRAL
        </button>
      </div>

      {/* ENLACE COGNITIVO DEL PILOTO (BARRA SUPERIOR AUDITORÍA) */}
      <div className="bg-zinc-900/40 p-3 border border-zinc-850 rounded-xl flex flex-col sm:flex-row items-center gap-3">
        <span className="text-zinc-400 font-bold flex items-center gap-1.5 whitespace-nowrap"><Search className="w-4 h-4 text-red-500" /> Consola de Enlace:</span>
        <input
          type="text"
          placeholder="Ingrese UID de cuenta, Correo o dApp Wallet..."
          className="w-full bg-black border border-zinc-800 p-2 rounded text-white focus:outline-none focus:border-red-500 font-mono text-xs"
          value={playerSearchQuery}
          onChange={e => setPlayerSearchQuery(e.target.value)}
        />
        <button onClick={handleLinkPilotTerminal} className="px-4 py-2 bg-red-650 hover:bg-red-600 text-white rounded font-bold uppercase whitespace-nowrap transition-colors cursor-pointer">
          SINCRO_PILOTO
        </button>
      </div>

      {/* METADATA BANNER DEL PILOTO DETECTADO */}
      {auditedUser && (
        <div className="p-3 bg-zinc-900/20 border border-red-500/10 rounded-lg flex flex-wrap justify-between items-center gap-4">
          <div>
            <span className="text-[10px] text-zinc-500 block uppercase">Comandante Auditando</span>
            <strong className="text-sm text-red-500 font-sans">{auditedUser.username}</strong>
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 block uppercase">Correo Vinculado</span>
            <span className="text-zinc-300">{auditedUser.email || 'N/A'}</span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 block uppercase">Nivel Forzado C.A.N.</span>
            <span className="text-amber-400 font-bold">{auditedUser.level}</span>
          </div>
          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-bold text-[9px]">CONNECTED_DB</span>
        </div>
      )}

      {/* PESTAÑAS HORIZONTALES (ESTRUCTURAS / TECNOLOGÍAS / BADGES) */}
      <div className="flex gap-1 overflow-x-auto border-b border-zinc-900 pb-2 no-scrollbar">
        {(['estructuras', 'tecnologias', 'badges'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setMatrixSearchQuery(''); }}
            className={`px-4 py-2 text-[11px] font-extrabold tracking-wider transition-all rounded uppercase whitespace-nowrap ${activeTab === tab ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/20'
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ADICIONAL: CONSOLA DE FILTRADO INTERNO DE RAREZA */}
      <div className="flex flex-col sm:flex-row items-center gap-4 text-[11px] text-zinc-500">
        <span>Filtrar Rejilla:</span>
        <input
          type="text"
          placeholder="Buscar por alias o ID..."
          value={matrixSearchQuery}
          onChange={e => setMatrixSearchQuery(e.target.value)}
          className="bg-black border border-zinc-850 rounded p-1 px-2 text-white outline-none w-full sm:w-48"
        />
        <select value={matrixRarityFilter} onChange={e => setMatrixRarityFilter(e.target.value)} className="bg-black border border-zinc-850 rounded p-1 text-zinc-400 outline-none cursor-pointer">
          <option value="all">Rarezas (Todas)</option>
          <option value="Common">Common</option>
          <option value="Rare">Rare</option>
          <option value="Epic">Epic</option>
          <option value="Legendary">Legendary</option>
          <option value="Exclusive">Exclusive</option>
          <option value="Halloween">Halloween</option>
          <option value="Christmas">Christmas</option>
        </select>
      </div>

      {/* REJILLA DE CONTROL COMPUESTA DE DOBLE COLUMNA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* COLUMNA IZQUIERDA: REGISTROS SEMILLA COMPILADOS (2/3) */}
        <div className="lg:col-span-2 bg-zinc-900/10 border border-zinc-900 p-4 rounded-xl space-y-4">
          <span className="text-[11px] font-bold text-red-500 uppercase tracking-widest block">REGISTROS SEMILLA DE LA TABLA GLOBAL (Supabase)</span>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* RENDER DE TARJETAS DE ESTRUCTURAS */}
            {activeTab === 'estructuras' && filteredStructures.map(item => (
              <div key={item.id} className="bg-black/60 p-3 border border-zinc-850 rounded-lg space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-cyan-400 font-bold text-xs font-sans">{item.name}</h4>
                    <span className="text-[9.5px] text-zinc-500 block mt-0.5">ID: {item.id} • Fab: {item.company}</span>
                  </div>
                  <span className="text-[8px] border border-zinc-800 px-1 rounded text-zinc-400 uppercase bg-zinc-900">{item.rarity}</span>
                </div>
                <p className="text-zinc-400 text-[11px] font-sans leading-relaxed line-clamp-2">{item.description}</p>

                {/* REJILLA DINÁMICA DE COSTES ESCALADOS LEVEL 1-10 NATIVO */}
                <div className="border-t border-zinc-900 pt-2 space-y-0.5 text-[10.5px]">
                  <div className="grid grid-cols-3 font-bold text-zinc-600 text-[9.5px]">
                    <span>NIVEL</span> <span>METAL</span> <span>CRISTAL</span>
                  </div>
                  {[1, 2, 5, 10].map(lvl => (
                    <div key={lvl} className="grid grid-cols-3 text-zinc-400 py-0.5">
                      <span>Nivel {lvl}</span>
                      <span className="text-emerald-400">{formatPureDecimal(item.power_score * 5000 * lvl)}</span>
                      <span className="text-cyan-400">{formatPureDecimal(item.power_score * 3000 * lvl)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-zinc-900 pt-1.5 flex justify-between text-[10px] text-zinc-500">
                  <span>Clase: {item.type}</span>
                  {auditedUser && (
                    <button onClick={() => handleAlterAssetLevel(item.id, 1)} className="text-red-500 hover:text-white border border-red-500/20 px-2 py-0.5 rounded uppercase font-bold tracking-wider text-[9px] hover:bg-red-600 transition-colors">
                      Inyectar Lvl 1
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* RENDER DE TARJETAS DE TECNOLOGÍAS */}
            {activeTab === 'tecnologias' && filteredTechnologies.map(item => (
              <div key={item.id} className="bg-black/60 p-3 border border-zinc-850 rounded-lg space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-amber-400 font-bold text-xs font-sans">{item.name}</h4>
                    <span className="text-[9.5px] text-zinc-500 block mt-0.5">ID: {item.id}</span>
                  </div>
                  <span className="text-[8px] border border-zinc-800 px-1 rounded text-zinc-400 uppercase bg-zinc-900">{item.rarity}</span>
                </div>
                <p className="text-zinc-400 text-[11px] font-sans leading-relaxed line-clamp-2">{item.description}</p>
                <div className="border-t border-zinc-900 pt-2 flex justify-between text-[10px] text-zinc-500">
                  <span>Fila: {item.type}</span>
                  {auditedUser && (
                    <button onClick={() => handleAlterAssetLevel(item.id, 1)} className="text-red-500 border border-red-500/20 px-2 py-0.5 rounded font-bold hover:bg-red-600 hover:text-white transition-colors text-[9px]">
                      INYECTAR_WALLET
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* RENDER DE TARJETAS DE BADGES */}
            {activeTab === 'badges' && filteredBadges.map(item => (
              <div key={item.id} className="bg-black/60 p-3 border border-zinc-850 rounded-lg space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-purple-400 font-bold text-xs font-sans">{item.name}</h4>
                    <span className="text-[9.5px] text-zinc-500 block">Colección: {item.collection}</span>
                  </div>
                  <span className="text-[8px] border border-purple-900/30 px-1 rounded text-purple-400 uppercase bg-purple-950/10">{item.rarity}</span>
                </div>
                <div className="bg-zinc-950/60 border border-zinc-900 p-2 rounded text-[10.5px] text-zinc-300 leading-tight">
                  {item.effect}
                </div>
                <p className="text-[10px] text-zinc-500 font-sans leading-tight">Duración del time-lock: {item.duration} • Stack: {item.stack}</p>
                {auditedUser && (
                  <button onClick={() => handleAlterAssetLevel(item.id, 1)} className="w-full text-center bg-zinc-900 hover:bg-purple-600 border border-zinc-800 text-purple-400 hover:text-white py-1 rounded font-bold uppercase transition-colors text-[9px]">
                    CONCEDER_BADGE
                  </button>
                )}
              </div>
            ))}

          </div>
        </div>

        {/* COLUMNA DERECHA: AUDITORÍA DE INVENTARIO DEL PILOTO SELECCIONADO (1/3) */}
        <div className="bg-black border border-zinc-900 p-4 rounded-xl space-y-4 h-fit">
          <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest block">AUDITORÍA E INYECCIÓN DE ACTIVOS DEL PILOTO</span>

          {!auditedUser ? (
            <div className="p-6 text-center text-zinc-600 border border-dashed border-zinc-850 rounded-lg leading-relaxed text-[11px] font-sans">
              Sin piloto acoplado al módulo. Utilice la consola superior para buscar un capitán (email o ID) y auditar sus activos síncronos en caliente.
            </div>
          ) : (
            <div className="space-y-3">
              <span className="text-[10px] text-zinc-500 block border-b border-zinc-900 pb-1 uppercase">Módulos en Órbita / Inventario</span>

              {/* COMPONENTES FILTRADOS SEGÚN LA PESTAÑA DEL ADMINISTRADOR */}
              {activeTab === 'estructuras' && structuresList.map(seed => {
                const userStruct = playerInventory.find(item => item.asset_id === seed.id && item.asset_type === 'estructura');
                const currentLevel = userStruct ? userStruct.current_level : 0;

                return (
                  <div key={seed.id} className="p-2.5 bg-zinc-900/60 border border-zinc-850 rounded-md flex justify-between items-center gap-3">
                    <div className="max-w-[65%]">
                      <span className="font-bold text-zinc-200 block truncate">{seed.name}</span>
                      <span className="text-[10px] font-mono text-zinc-500">Nivel de Amplificación: <strong className={currentLevel > 0 ? 'text-red-500' : 'text-zinc-600'}>{currentLevel}</strong></span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => handleAlterAssetLevel(seed.id, -1)} disabled={currentLevel === 0} className="p-1 px-2 bg-black border border-zinc-800 rounded font-bold hover:bg-zinc-800 text-zinc-400 disabled:opacity-20 cursor-pointer">-1</button>
                      <button onClick={() => handleAlterAssetLevel(seed.id, 1)} className="p-1 px-2 bg-black border border-zinc-800 rounded font-bold hover:bg-zinc-800 text-emerald-400 cursor-pointer">+1</button>
                      <button onClick={() => handleAlterAssetLevel(seed.id, -currentLevel)} disabled={currentLevel === 0} className="p-1 px-1.5 bg-red-950/20 border border-red-900/30 text-red-500 rounded font-bold hover:bg-red-600 hover:text-white disabled:opacity-20 cursor-pointer">✕</button>
                    </div>
                  </div>
                );
              })}

              {activeTab === 'tecnologias' && technologiesList.map(seed => {
                const userTech = playerInventory.find(item => item.asset_id === seed.id && item.asset_type === 'tecnologia');
                const currentLevel = userTech ? userTech.current_level : 0;

                return (
                  <div key={seed.id} className="p-2.5 bg-zinc-900/60 border border-zinc-850 rounded-md flex justify-between items-center gap-3">
                    <div className="max-w-[65%]">
                      <span className="font-bold text-zinc-200 block truncate">{seed.name}</span>
                      <span className="text-[10px] font-mono text-zinc-500">Nivel: <strong className={currentLevel > 0 ? 'text-red-500' : 'text-zinc-600'}>{currentLevel}</strong></span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => handleAlterAssetLevel(seed.id, -1)} disabled={currentLevel === 0} className="p-1 px-2 bg-black border border-zinc-800 rounded font-bold hover:bg-zinc-800 text-zinc-400 disabled:opacity-20 cursor-pointer">-1</button>
                      <button onClick={() => handleAlterAssetLevel(seed.id, 1)} className="p-1 px-2 bg-black border border-zinc-800 rounded font-bold hover:bg-zinc-800 text-emerald-400 cursor-pointer">+1</button>
                    </div>
                  </div>
                );
              })}

              {activeTab === 'badges' && badgesList.map(seed => {
                const hasBadge = playerInventory.some(item => item.asset_id === seed.id && item.asset_type === 'badge');

                return (
                  <div key={seed.id} className="p-2 bg-zinc-900/40 border border-zinc-850 rounded flex justify-between items-center text-[11px]">
                    <span className={`font-medium ${hasBadge ? 'text-purple-400 font-bold' : 'text-zinc-500'}`}>{seed.name}</span>
                    <button
                      onClick={() => handleAlterAssetLevel(seed.id, hasBadge ? -1 : 1)}
                      className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold uppercase transition-all ${hasBadge ? 'bg-red-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                        }`}
                    >
                      {hasBadge ? 'Revocar' : 'Otorgar'}
                    </button>
                  </div>
                );
              })}

            </div>
          )}
        </div>

      </div>

    </div>
  );
}
