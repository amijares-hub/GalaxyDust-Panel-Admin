import React, { useEffect, useState, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { RefreshCw, Search, ShieldAlert, Database, Radio, Layers, Edit3, X, Save, Plus, Camera, Activity, Box, Puzzle, BadgePercent, UploadCloud, PlusCircle, Sliders, Flame, Shield, Anchor, Wrench, Cpu, Coins, Hammer, Boxes, Trash2 } from 'lucide-react';
import { calculateCombatStats } from './CombatSandboxTester';

export const ComponentMatrix: React.FC = () => {
  const [rawItems, setRawItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('SHIPS');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [rarityFilter, setRarityFilter] = useState<string>('Todas');

  // Consola de Telemetría de Base de Datos
  const [dbError, setDbError] = useState<string | null>(null);
  const [rawPayloadCount, setRawPayloadCount] = useState<number>(-1);
  const [masterSkills, setMasterSkills] = useState<any[]>([]);

  // Estados del Motor Bimodal Alternable
  const [editorMode, setEditorMode] = useState<'EDIT' | 'CREATE'>('EDIT');
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [saveLoading, setSaveLoading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auxiliar para inyección rápida en arrays de habilidades (skills)
  const [newSkillInput, setNewSkillInput] = useState<string>('');

  // CONFIGURACIÓN DE TABLAS DE PRODUCCIÓN GALAXYDUST
  const tabs = [
    { id: 'SHIPS', label: '🚀 Naves', table: 'seed_ships', pk: 'ship_id', nameCol: 'ship_name' },
    { id: 'STRUCTURES', label: '🏢 Estructuras', table: 'seed_structures', pk: 'id', nameCol: 'name' },
    { id: 'DEFENSES', label: '🛡️ Defensas', table: 'seed_defenses', pk: 'defense_id', nameCol: 'defense_name' },
    { id: 'TECHNOLOGIES', label: '🔬 Tecnologías', table: 'seed_technologies', pk: 'id', nameCol: 'name' },
    { id: 'BADGES', label: '🏅 Insignias', table: 'seed_badges', pk: 'id', nameCol: 'name' },
    { id: 'BLUEPRINTS', label: '📜 Blueprints', table: 'seed_blueprints', pk: 'id', nameCol: 'name' },
    { id: 'LICENSES', label: '📜 Licencias', table: 'seed_licenses', pk: 'id', nameCol: 'name' },
    { id: 'TOOLS', label: '🔧 Tools', table: 'seed_tools', pk: 'id', nameCol: 'name' },
    { id: 'CONSUMABLES', label: '🧪 Consumibles', table: 'seed_consumables', pk: 'id', nameCol: 'name' },
    { id: 'ASTROBOTS', label: '🤖 Astrobots', table: 'seed_astrobots', pk: 'id', nameCol: 'name' }
  ];

  const currentTabConfig = useMemo(() => {
    return tabs.find(t => t.id === activeTab) || tabs[0];
  }, [activeTab]);

  useEffect(() => {
    fetchMasterSkills();
  }, []);

  const fetchMasterSkills = async () => {
    const { data, error } = await supabase.from('matrix_skills_registry').select('*');
    if (!error && data) {
      setMasterSkills(data);
    }
  };

  const skillCache = useMemo(() => {
    return new Map(masterSkills.map(s => [s.skill_code, s]));
  }, [masterSkills]);

  useEffect(() => {
    loadLiveMatrixData();
  }, [activeTab]);

  const loadLiveMatrixData = async () => {
    try {
      setLoading(true);
      setDbError(null);
      setRawItems([]);

      const { data, error } = await supabase.from(currentTabConfig.table).select('*');

      if (error) {
        setDbError(`${error.code || 'ERR'}: La tabla "${currentTabConfig.table}" no responde. Verifica su existencia en Supabase.`);
        return;
      }

      // 📡 SANITIZADOR UNIVERSAL DE HABILIDADES
      const sanitizedData = (data || []).map((row: any) => {
        let cleanSkills: any[] = [];
        if (Array.isArray(row.skills)) {
          cleanSkills = row.skills;
        } else if (typeof row.skills === 'string' && row.skills.trim() !== '') {
          try {
            const parsed = JSON.parse(row.skills);
            cleanSkills = Array.isArray(parsed) ? parsed : Object.values(parsed);
          } catch (e) {
            console.error(`Error procesando skills para ID ${row[currentTabConfig.pk]}:`, e);
            cleanSkills = [];
          }
        } else if (row.skills && typeof row.skills === 'object') {
          cleanSkills = Object.values(row.skills);
        }
        return { ...row, skills: cleanSkills };
      });

      setRawPayloadCount(sanitizedData.length);
      setRawItems(sanitizedData);
    } catch (e: any) {
      setDbError(`EXCEPCIÓN CRÍTICA DE RED: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUploadToStorage = async (e: React.ChangeEvent<HTMLInputElement>, targetAssetId: string) => {
    const file = e.target.files?.[0];
    if (!file || !targetAssetId) return;

    try {
      setUploadingId(targetAssetId);
      const fileExt = file.name.split('.').pop();
      const customStoragePath = `${currentTabConfig.table}/${targetAssetId}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('galaxy-assets')
        .upload(customStoragePath, file, { cacheControl: '3600', ...({ upsert: true } as any) });

      if (uploadError) throw uploadError;

      alert(`[CONSOLA MULTIMEDIA]: Imagen recibida. Sincronizando optimización WebP.`);
      setTimeout(() => loadLiveMatrixData(), 1200);
    } catch (err: any) {
      alert(`FALLO DE STORAGE: ${err.message}`);
    } finally {
      setUploadingId(null);
    }
  };

  const handleOpenEditor = (item: any) => {
    setEditorMode('EDIT');
    const cloned = { ...item, skills: [...(item.skills || [])] };
    if (activeTab === 'SHIPS') {
      cloned.stack = 'Stackeable';
    }
    setEditingItem(cloned);
    setNewSkillInput('');
  };

  const handleOpenCreator = () => {
    setEditorMode('CREATE');
    setNewSkillInput('');

    const defaultItem: any = {
      rarity: 'Common',
      description: '',
      image_url: null,
      avatar_url: '',
      collection: 'NOVA',
      set_skills: '',
      duration: 'Permanent',
      stack: activeTab === 'SHIPS' ? 'Stackeable' : 'No Stackeable',
      max_stack: activeTab === 'SHIPS' ? 999 : 1,
      fleet_slots: 1,
      is_nft: false,
      skills: []
    };

    const pkCol = currentTabConfig.pk;
    const nameCol = currentTabConfig.nameCol;
    defaultItem[pkCol] = '';
    defaultItem[nameCol] = '';

    if (activeTab === 'SHIPS') {
      defaultItem.collection = 'NOVA SHIPS';
      defaultItem.ship_role = 'Attack';
      defaultItem.ship_size = 'Fighter';
      defaultItem.engine = 'Combustion';
      defaultItem.series = 'F-001';
      defaultItem.shield = 0;
      defaultItem.defense = 0;
      defaultItem.resistance = 0;
      defaultItem.speed_boost = 0;
      defaultItem.attack_standard = 0;
      defaultItem.attack_laser = 0;
      defaultItem.attack_ionic = 0;
      defaultItem.attack_plasma = 0;
      defaultItem.attack_graviton = 0;
      defaultItem.cargo_capacity = 0;
      defaultItem.production_min = 1.0;
      defaultItem.production_max = 1.0;
    } else if (activeTab === 'DEFENSES') {
      defaultItem.defense_type = 'Kinetic';
      defaultItem.company = 'Kant';
      defaultItem.power_score = 1.0;
      defaultItem.levels_config = {
        prereqs: { shipyard_lvl: 1 },
        base_costs: { metal: 0, crystal: 0, deuterium: 0, gd_token: 0 },
        combat_stats: { hull: 0, attack: 0, shield: 0 }
      };
    } else if (activeTab === 'BLUEPRINTS') {
      defaultItem.max_uses = 1;
      defaultItem.req_metal = 0;
      defaultItem.req_crystal = 0;
      defaultItem.req_gd = 0;
      defaultItem.req_phantom_coin = 0;
      defaultItem.total_existing = 0;
      defaultItem.total_used = 0;
    } else {
      defaultItem.type = 'General';
      defaultItem.power_score = 1.0;
      defaultItem.company = 'Nova Company';
      if (['ASTROBOTS', 'LICENSES', 'TOOLS', 'CONSUMABLES'].includes(activeTab)) {
        defaultItem.base_metal_cost = 0;
        defaultItem.base_crystal_cost = 0;
      }
    }

    setEditingItem(defaultItem);
  };

  const updateFormKey = (key: string, value: any) => {
    setEditingItem((prev: any) => {
      if (!prev) return null;
      return { ...prev, [key]: value };
    });
  };

  const updateNestedConfig = (section: string, field: string, value: any) => {
    setEditingItem((prev: any) => {
      if (!prev || !prev.levels_config) return prev;
      const copy = { ...prev };
      if (!copy.levels_config[section]) copy.levels_config[section] = {};
      copy.levels_config[section][field] = isNaN(value) || value === '' ? value : Number(value);
      return copy;
    });
  };

  const addSkillTag = () => {
    if (!newSkillInput.trim() || !editingItem) return;
    const currentSkills = Array.isArray(editingItem.skills) ? [...editingItem.skills] : [];

    const MAX_SKILLS = 4;
    if (currentSkills.length >= MAX_SKILLS) {
      alert(`⚠️ Límite Operativo Superado: No se pueden equipar más de ${MAX_SKILLS} habilidades.`);
      return;
    }

    const skillObj = skillCache.get(newSkillInput.trim());
    if (skillObj) {
      currentSkills.push(skillObj.skill_code);
    } else {
      currentSkills.push(newSkillInput.trim());
    }

    updateFormKey('skills', currentSkills);
    setNewSkillInput('');
  };

  const removeSkillTag = (indexToRemove: number) => {
    if (!editingItem || !Array.isArray(editingItem.skills)) return;
    const filtered = editingItem.skills.filter((_: any, idx: number) => idx !== indexToRemove);
    updateFormKey('skills', filtered);
  };

  const handleSaveAssetUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const pkCol = currentTabConfig.pk;
    const currentId = editingItem[pkCol];

    if (editorMode === 'CREATE' && (!currentId || !currentId.trim())) {
      return alert("El ID único es obligatorio.");
    }

    try {
      setSaveLoading(true);
      const table = currentTabConfig.table;
      const payload = { ...editingItem };

      delete payload.skill_requirements;
      delete payload.effect;

      Object.keys(payload).forEach(f => {
        if (typeof payload[f] === 'string' && payload[f] !== '' && !isNaN(payload[f] as any) && f !== pkCol) {
          payload[f] = Number(payload[f]);
        }
      });

      if (editorMode === 'EDIT') {
        delete payload[pkCol];
        const { error } = await supabase.from(table).update(payload).eq(pkCol, currentId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from(table).insert([payload]);
        if (error) throw error;
      }

      alert("Balance central sincronizado con éxito.");
      setEditingItem(null);
      loadLiveMatrixData();
    } catch (err: any) {
      alert(`FALLO TRANSACCIONAL: ${err.message}`);
    } finally {
      setSaveLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    const nameCol = currentTabConfig.nameCol;
    const pkCol = currentTabConfig.pk;
    return rawItems.filter(item => {
      const matchSearch = String(item[nameCol] || '').toLowerCase().includes(searchFilter.toLowerCase()) || String(item[pkCol] || '').toLowerCase().includes(searchFilter.toLowerCase());
      const matchRarity = rarityFilter === 'Todas' || item.rarity === rarityFilter;
      return matchSearch && matchRarity;
    });
  }, [rawItems, searchFilter, rarityFilter, currentTabConfig]);

  // ==========================================
  // PUENTE DEL MOTOR DE SIMULACIÓN (COMBAT SANDBOX)
  // ==========================================
  const simulatedShip = useMemo(() => {
    if (!editingItem || activeTab !== 'SHIPS') return null;

    const skillsParaSimular = (editingItem.skills || [])
      .map((sk: any) => {
        const skillId = typeof sk === 'string' ? sk : sk?.skill_id;
        return skillCache.get(skillId);
      })
      .filter(Boolean);

    return calculateCombatStats(editingItem, skillsParaSimular);
  }, [editingItem, activeTab, skillCache]);

  const renderSandboxStat = (label: string, field: string, isPercentage: boolean = false) => {
    const baseValue = Number(editingItem[field]) || 0;
    const computedValue = simulatedShip ? Number((simulatedShip as any)[field]) || 0 : baseValue;
    const isModified = computedValue !== baseValue;

    return (
      <div>
        <label className="text-[9px] text-zinc-550 font-bold uppercase tracking-wider">{label}</label>
        <div className="flex items-center gap-1">
          <input type="number" value={editingItem[field] ?? 0} onChange={(e) => updateFormKey(field, e.target.value)} className={`w-full bg-black border border-zinc-850 p-1.5 rounded text-white text-right font-mono text-xs focus:outline-none focus:border-red-500 ${isModified ? 'text-zinc-500 border-zinc-900' : ''}`} />
          {isModified && (
            <div className="text-[10px] text-emerald-400 font-bold whitespace-nowrap bg-emerald-950/30 px-2 py-1 rounded border border-emerald-900/40 flex flex-col justify-center font-mono animate-fadeIn">
              → {isPercentage ? `${computedValue.toFixed(1)}%` : Math.round(computedValue).toLocaleString()}
            </div>
          )}
        </div>
      </div>
    );
  };

  const getDynamicFields = (item: any) => {
    const coreKeys = ['id', 'ship_id', 'defense_id', 'name', 'ship_name', 'defense_name', 'description', 'image_url', 'avatar_url', 'rarity', 'skills', 'levels_config', 'set_skills', 'stack', 'duration', 'skill_requirements', 'effect'];
    return Object.keys(item).filter(k => !coreKeys.includes(k));
  };

  return (
    <div className="p-4 md:p-6 space-y-6 w-full bg-[#050507] text-slate-100 min-h-screen font-mono text-xs relative overflow-hidden">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-900 pb-4 select-none relative z-10">
        <div>
          <span className="text-[10px] font-bold text-red-500 tracking-widest uppercase block flex items-center gap-1.5">
            <Radio size={12} className="animate-ping text-red-500" /> CONSOLA MAESTRA DE BALANCES v4.5
          </span>
          <h1 className="text-lg md:text-xl font-black text-white uppercase mt-1 font-sans">Panel de Control Atómico Semilla</h1>
          <p className="text-xs text-zinc-400 font-sans mt-0.5">Gestión de inventarios y sinergias de flota reales de Sasori.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button onClick={handleOpenCreator} className="flex items-center gap-1.5 bg-red-650 hover:bg-red-700 text-white font-bold font-sans px-3 py-1.5 rounded text-[11px] transition-all cursor-pointer shadow-lg">
            <Plus size={14} /> REGISTRAR ASSET DESDE CERO
          </button>
          <button onClick={loadLiveMatrixData} className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 px-3 py-1.5 rounded text-[11px] text-zinc-350 transition-all cursor-pointer">
            <RefreshCw size={12} /> RE-MUESTREAR BASE
          </button>
        </div>
      </div>

      {/* MONITOR TELEMÉTRICO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-zinc-950 p-3 border border-zinc-900 rounded-xl select-none z-10 relative">
        <div className="flex items-center gap-2.5">
          <Database size={16} className="text-cyan-400" />
          <div>
            <p className="text-zinc-500 text-[10px]">TABLA OPERATIVA POSTGRES ACTIVA</p>
            <p className="text-zinc-200 font-bold text-xs">"public"."{currentTabConfig.table}"</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 border-t md:border-t-0 md:border-l border-zinc-900 pt-2 md:pt-0 md:pl-4">
          <Layers size={16} className="text-emerald-400" />
          <div>
            <p className="text-zinc-500 text-[10px]">VOLUMEN DE ASSETS EXPUESTOS</p>
            <p className="font-bold text-xs text-emerald-400">{rawPayloadCount === -1 ? 'Leyendo trazas...' : `${rawPayloadCount} registros vinculados`}</p>
          </div>
        </div>
      </div>

      {dbError && (
        <div className="bg-red-950/20 border border-red-900/40 rounded-xl p-4 flex gap-3 text-red-400 font-sans z-10 relative">
          <ShieldAlert size={20} className="shrink-0 text-red-500 mt-0.5" />
          <div>
            <h4 className="font-bold text-xs font-mono uppercase text-red-400">Error de Enlace Central</h4>
            <code className="block bg-black px-3 py-1.5 rounded mt-2 border border-zinc-900 text-[11px] font-mono text-red-300">{dbError}</code>
          </div>
        </div>
      )}

      {/* PESTAÑAS */}
      <div className="flex gap-1 overflow-x-auto border-b border-zinc-900 pb-2 no-scrollbar select-none z-10 relative">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); setEditingItem(null); }} className={`px-3 py-2 text-[10.5px] font-extrabold tracking-wider transition-all rounded whitespace-nowrap cursor-pointer ${activeTab === tab.id ? 'bg-red-650 text-white shadow-md' : 'text-zinc-400 hover:bg-zinc-900/40 hover:text-zinc-200'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* FILTROS */}
      <div className="bg-zinc-950 p-3 border border-zinc-900 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 text-xs select-none z-10 relative">
        <div className="flex items-center gap-2 w-full">
          <Search size={14} className="text-red-500 shrink-0" />
          <input type="text" placeholder={`Buscar en ${currentTabConfig.table}...`} className="w-full bg-black border border-zinc-850 p-2 rounded text-zinc-200 focus:outline-none focus:border-red-500 font-mono" value={searchFilter} onChange={e => setSearchFilter(e.target.value)} />
        </div>
        <select value={rarityFilter} onChange={e => setRarityFilter(e.target.value)} className="bg-black border border-zinc-850 p-2 rounded font-mono text-zinc-400 outline-none cursor-pointer shrink-0 w-full md:w-auto" >
          <option value="Todas">Rarezas: Todas</option>
          <option value="Common">Common</option>
          <option value="Uncommon">Uncommon</option>
          <option value="Rare">Rare</option>
          <option value="Epic">Epic</option>
          <option value="Legendary">Legendary</option>
        </select>
      </div>

      {/* REJILLA DE TARJETAS */}
      {loading ? (
        <div className="p-16 text-center text-zinc-500 animate-pulse tracking-widest font-mono z-10 relative">MINANDO MANIFIESTOS REALES...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 z-10 relative pr-1 pb-16">
          {filteredItems.map((item) => {
            const currentId = item[currentTabConfig.pk];
            const currentName = item[currentTabConfig.nameCol] || 'Asset Sin Nombre';

            return (
              <div key={currentId} className="bg-black/40 border border-zinc-900 p-4 rounded-xl flex flex-col justify-between space-y-4 hover:border-zinc-800 transition-all relative">
                <div className="space-y-2.5">
                  <div className="w-full h-36 bg-zinc-950/60 rounded-xl border border-zinc-850 flex items-center justify-center overflow-hidden relative select-none group cursor-pointer">
                    <input 
                      type="file" 
                      accept="image/webp,image/png,image/jpeg"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                      title="Subir imagen WebP"
                      onChange={(e) => handleImageUploadToStorage(e, currentId)}
                      disabled={uploadingId === currentId}
                    />

                    {uploadingId === currentId ? (
                      <div className="text-center text-cyan-500 flex flex-col items-center gap-1.5 animate-pulse font-mono z-10">
                        <RefreshCw size={22} className="animate-spin" />
                        <span className="text-[10px]">Subiendo...</span>
                      </div>
                    ) : item.image_url ? (
                      <>
                        <img src={item.image_url} alt={currentName} loading="lazy" decoding="async" className="w-full h-full object-contain scale-95 z-0" />
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                          <UploadCloud size={24} className="text-white mb-1" />
                          <span className="text-white text-[10px] font-bold">Reemplazar Asset</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-center text-zinc-700 flex flex-col items-center gap-1.5 font-mono group-hover:text-zinc-400 transition-colors z-10 pointer-events-none">
                        <Camera size={22} className={uploadingId ? '' : 'animate-pulse'} />
                        <span className="text-[10px]">Sin Imagen WebP</span>
                        <span className="text-[8px] text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded-full mt-1">Clic para subir</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none z-0"></div>
                  </div>

                  <div className="flex justify-between items-start gap-2 pt-0.5">
                    <div className="min-w-0">
                      <h3 className="text-white text-xs font-bold font-sans tracking-wide truncate">{currentName}</h3>
                      <span className="text-[9.5px] text-zinc-550 font-mono block truncate">ID: {currentId}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[8.5px] font-bold uppercase bg-zinc-900 text-zinc-400 border border-zinc-800 tracking-wider">{item.rarity}</span>
                  </div>

                  <p className="text-zinc-400 font-sans leading-relaxed text-[11px] text-justify pt-0.5">{item.description || 'Sin manifiesto registrado.'}</p>
                </div>

                {/* DESPLIEGUE ATÓMICO EN TARJETA */}
                <div className="bg-zinc-950 p-2.5 rounded-lg text-[10px] text-zinc-500 border border-zinc-900/60 font-mono space-y-2">
                  {activeTab === 'SHIPS' && (
                    <div className="space-y-1.5">
                      <span className="text-zinc-400 font-bold block text-[9px] border-b border-zinc-900 pb-0.5 uppercase tracking-wider flex items-center gap-1"><Sliders size={10} className="text-red-400" /> Especificaciones del Chasis</span>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-zinc-400">
                        <div>Clase: <span className="text-white font-sans">{item.ship_size}</span></div>
                        <div>Rol: <span className="text-white font-sans">{item.ship_role}</span></div>
                        <div>Motor: <span className="text-white font-sans">{item.engine}</span></div>
                        <div>Serie: <span className="text-zinc-300">{item.series}</span></div>
                        <div className="border-t border-zinc-900/60 mt-1 pt-1">Escudo: <span className="text-cyan-400 font-bold">{item.shield}</span></div>
                        <div className="border-t border-zinc-900/60 mt-1 pt-1">Defensa: <span className="text-cyan-400 font-bold">{item.defense}</span></div>
                        <div>Resistencia: <span className="text-cyan-400 font-bold">{item.resistance}</span></div>
                        <div>Speed Boost: <span className="text-cyan-400 font-bold">{item.speed_boost}%</span></div>
                      </div>
                    </div>
                  )}

                  {/* VISUALIZADOR SECTORIZADO UNIVERSAL UNO POR UNO DE SKILLS */}
                  {Array.isArray(item.skills) && item.skills.length > 0 && (
                    <div className="border-t border-zinc-900/60 pt-1.5 space-y-1 select-none text-[9.5px]">
                      <span className="text-[9px] text-cyan-400 font-bold uppercase tracking-wider block flex items-center gap-1">📡 Habilidades Activas (Sasori Labs)</span>
                      <div className="flex flex-col gap-1 bg-black/30 p-1.5 rounded border border-zinc-900/40">
                        {item.skills.map((sk: any, idx: number) => {
                          const skillId = typeof sk === 'string' ? sk : sk?.skill_id;
                          const resolvedSkill = skillCache.get(skillId);

                          return (
                            <div key={idx} className="text-zinc-200 text-[10px] font-sans flex items-start gap-1.5 border-b border-zinc-900/20 pb-1 pt-0.5">
                              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full shrink-0 mt-1"></span>
                              <div className="flex flex-col gap-0.5">
                                {resolvedSkill ? (
                                  <>
                                    <span className="font-bold text-cyan-300">{resolvedSkill.base_name} <span className="text-zinc-500 font-mono text-[9px] ml-1">T{resolvedSkill.tier_level}</span></span>
                                    <span className="text-zinc-400 text-[9px] leading-tight">{resolvedSkill.description || 'Habilidad pasiva operativa.'}</span>
                                    <span className="text-emerald-400 text-[8.5px] mt-0.5 font-mono">+{resolvedSkill.modifier_value * 100}% en {resolvedSkill.stat_affected}</span>
                                  </>
                                ) : (
                                  <span className="text-zinc-400 italic">{skillId} (Legacy Text)</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2 z-10 relative">
                  <button onClick={() => handleOpenEditor(item)} className="w-full flex items-center justify-center gap-1.5 bg-zinc-900 hover:bg-red-650 border border-zinc-800 text-zinc-300 hover:text-white transition-all py-1.5 rounded-lg text-[11px] font-bold font-sans cursor-pointer">
                    <Edit3 size={12} /> CONFIGURAR STATS UNO POR UNO
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PANEL OVERLAY DE CONFIGURACIÓN MOLECULAR */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex justify-end z-50 animate-fadeIn font-sans">
          <div className="w-full max-w-xl bg-[#09090c] h-full border-l border-zinc-900 p-6 shadow-2xl flex flex-col justify-between overflow-y-auto font-mono text-xs select-text desert-scrollbar">
            <div className="flex justify-between items-start border-b border-zinc-900 pb-3 select-none">
              <div>
                <span className="text-red-500 text-[10px] font-bold block uppercase tracking-widest font-mono">{editorMode === 'CREATE' ? '🛰️ NUEVA INYECCIÓN SEMILLA' : '📡 CONSOLA DE BALANCE OPERATIVO'}</span>
                <h2 className="text-sm font-bold text-white mt-1 font-sans truncate">{editorMode === 'CREATE' ? `Alta en ${currentTabConfig.table}` : `Modificando: ${editingItem[currentTabConfig.nameCol] || editingItem[currentTabConfig.pk]}`}</h2>
              </div>
              <button type="button" onClick={() => setEditingItem(null)} className="p-1 rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"><X size={14} /></button>
            </div>

            <form onSubmit={handleSaveAssetUpdate} className="space-y-5 py-4 flex-1 overflow-y-auto pr-1 desert-scrollbar">
              <div className="grid grid-cols-2 gap-3 text-zinc-400 select-text">
                <div className="col-span-2">
                  <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1 select-none">ID de la Semilla ({currentTabConfig.pk})</label>
                  <input type="text" disabled={editorMode === 'EDIT'} value={editingItem[currentTabConfig.pk] || ''} onChange={(e) => updateFormKey(currentTabConfig.pk, e.target.value)} className="w-full bg-black border border-zinc-850 p-2 rounded text-white font-mono font-bold text-xs disabled:opacity-45 focus:outline-none focus:border-red-500" />
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1 select-none">Nombre del Componente ({currentTabConfig.nameCol})</label>
                  <input type="text" value={editingItem[currentTabConfig.nameCol] || ''} onChange={(e) => updateFormKey(currentTabConfig.nameCol, e.target.value)} className="w-full bg-black border border-zinc-850 p-2 rounded text-white focus:outline-none focus:border-red-500 font-sans text-xs" />
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1 select-none">Rareza Base</label>
                  <input type="text" value={editingItem.rarity || ''} onChange={(e) => updateFormKey('rarity', e.target.value)} className="w-full bg-black border border-zinc-850 p-2 rounded text-white focus:outline-none" />
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1 select-none">Colección (collection)</label>
                  <input type="text" value={editingItem.collection || ''} onChange={(e) => updateFormKey('collection', e.target.value)} className="w-full bg-black border border-zinc-850 p-2 rounded text-white focus:outline-none" />
                </div>

                {/* FORMULARIO EXCLUSIVO DE NAVES */}
                {activeTab === 'SHIPS' && (
                  <>
                    <div className="col-span-2 text-zinc-500 text-[10px] uppercase font-bold tracking-wider select-none border-b border-zinc-900 pb-1 mt-2">Parámetros del Chasis</div>
                    <div><label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1">Tipo de Motor (engine)</label><input type="text" value={editingItem.engine || ''} onChange={(e) => updateFormKey('engine', e.target.value)} className="w-full bg-black border border-zinc-850 p-2 rounded text-white" /></div>
                    <div><label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1">Serie Técnica (series)</label><input type="text" value={editingItem.series || ''} onChange={(e) => updateFormKey('series', e.target.value)} className="w-full bg-black border border-zinc-850 p-2 rounded text-white" /></div>
                    <div><label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1">Rol Operativo (ship_role)</label><input type="text" value={editingItem.ship_role || ''} onChange={(e) => updateFormKey('ship_role', e.target.value)} className="w-full bg-black border border-zinc-850 p-2 rounded text-white" /></div>
                    <div><label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1">Tamaño de Chasis (ship_size)</label><input type="text" value={editingItem.ship_size || ''} onChange={(e) => updateFormKey('ship_size', e.target.value)} className="w-full bg-black border border-zinc-850 p-2 rounded text-white" /></div>

                    <div className="col-span-2 grid grid-cols-2 lg:grid-cols-3 gap-3 bg-zinc-950/80 p-3 rounded-xl border border-zinc-900 mt-1 shadow-inner relative">
                      <span className="col-span-full text-[9.5px] text-cyan-400 font-bold uppercase block border-b border-zinc-900 pb-1 flex items-center gap-1 select-none"><Sliders size={12} /> Atributos de Protección (Sandbox Activo)</span>
                      {renderSandboxStat('Shield', 'shield')}
                      {renderSandboxStat('Defense', 'defense')}
                      {renderSandboxStat('Resistance', 'resistance')}
                      {renderSandboxStat('Speed Boost %', 'speed_boost', true)}
                      {renderSandboxStat('Cargo Capacity', 'cargo_capacity')}
                      <div><label className="text-[9px] text-zinc-500">Slots Flota</label><input type="number" value={editingItem.fleet_slots ?? 1} onChange={(e) => updateFormKey('fleet_slots', e.target.value)} className="w-full bg-black border border-zinc-850 p-1.5 rounded text-white text-right" /></div>
                    </div>

                    <div className="col-span-2 grid grid-cols-2 lg:grid-cols-3 gap-3 bg-zinc-950/80 p-3 rounded-xl border border-zinc-900 shadow-inner relative">
                      <span className="col-span-full text-[9.5px] text-red-400 font-bold uppercase block border-b border-zinc-900 pb-1 flex items-center gap-1 select-none"><Flame size={12} /> Calibración de Daños (Sandbox Activo)</span>
                      {renderSandboxStat('Standard', 'attack_standard')}
                      {renderSandboxStat('Laser', 'attack_laser')}
                      {renderSandboxStat('Ionic', 'attack_ionic')}
                      {renderSandboxStat('Plasma', 'attack_plasma')}
                      {renderSandboxStat('Graviton', 'attack_graviton')}
                    </div>

                    <div className="grid grid-cols-2 gap-3 col-span-2">
                      <div><label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1">Production Min Rate</label><input type="number" step="any" value={editingItem.production_min ?? 1.0} onChange={(e) => updateFormKey('production_min', e.target.value)} className="w-full bg-black border border-zinc-850 p-2 rounded text-emerald-400 font-bold" /></div>
                      <div><label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1">Production Max Rate</label><input type="number" step="any" value={editingItem.production_max ?? 3.0} onChange={(e) => updateFormKey('production_max', e.target.value)} className="w-full bg-black border border-zinc-850 p-2 rounded text-emerald-400 font-bold" /></div>
                    </div>
                  </>
                )}

                {/* FORMULARIO EXCLUSIVO DE DEFENSAS */}
                {activeTab === 'DEFENSES' && (
                  <>
                    <div className="col-span-2 text-zinc-500 text-[10px] uppercase font-bold tracking-wider select-none border-b border-zinc-900 pb-1 mt-2">Estructura de Defensas</div>
                    <div><label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1">Tipo de Defensa (defense_type)</label><input type="text" value={editingItem.defense_type || ''} onChange={(e) => updateFormKey('defense_type', e.target.value)} className="w-full bg-black border border-zinc-850 p-2 rounded text-white" /></div>
                    <div><label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1">Power Score</label><input type="number" step="any" value={editingItem.power_score ?? 1.0} onChange={(e) => updateFormKey('power_score', e.target.value)} className="w-full bg-black border border-zinc-850 p-2 rounded text-cyan-400 font-bold" /></div>
                    <div className="col-span-2 grid grid-cols-3 gap-2 bg-zinc-950 p-3 rounded-xl border border-zinc-900">
                      <span className="col-span-3 text-[9.5px] text-cyan-400 font-bold uppercase block border-b border-zinc-900 pb-1">Costes Base de Construcción</span>
                      <div><label className="text-[9px] text-zinc-500">Metal</label><input type="number" value={editingItem.levels_config?.base_costs?.metal ?? 0} onChange={(e) => updateNestedConfig('base_costs', 'metal', e.target.value)} className="w-full bg-black border border-zinc-850 p-1.5 rounded text-white text-right" /></div>
                      <div><label className="text-[9px] text-zinc-500">Cristal</label><input type="number" value={editingItem.levels_config?.base_costs?.crystal ?? 0} onChange={(e) => updateNestedConfig('base_costs', 'crystal', e.target.value)} className="w-full bg-black border border-zinc-850 p-1.5 rounded text-white text-right" /></div>
                      <div><label className="text-[9px] text-zinc-500">GD Token</label><input type="number" value={editingItem.levels_config?.base_costs?.gd_token ?? 0} onChange={(e) => updateNestedConfig('base_costs', 'gd_token', e.target.value)} className="w-full bg-black border border-zinc-850 p-1.5 rounded text-white text-right" /></div>
                    </div>
                  </>
                )}

                {/* FORMULARIO EXCLUSIVO DE BLUEPRINTS */}
                {activeTab === 'BLUEPRINTS' && (
                  <>
                    <div className="col-span-2 text-zinc-500 text-[10px] uppercase font-bold tracking-wider select-none border-b border-zinc-900 pb-1 mt-2">Propiedades del Blueprint</div>
                    <div><label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1">Usos del Blueprint</label><input type="number" value={editingItem.max_uses ?? 1} onChange={(e) => updateFormKey('max_uses', e.target.value)} className="w-full bg-black border border-zinc-850 p-2 rounded text-white font-bold" /></div>
                    <div><label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1">Firma Corporativa (company)</label><input type="text" value={editingItem.company || ''} onChange={(e) => updateFormKey('company', e.target.value)} className="w-full bg-black border border-zinc-850 p-2 rounded text-white font-sans" /></div>

                    <div className="col-span-2 grid grid-cols-2 gap-2 bg-zinc-950 p-3 rounded-xl border border-zinc-900">
                      <span className="col-span-2 text-[9.5px] text-cyan-400 font-bold uppercase block border-b border-zinc-900 pb-1 flex items-center gap-1 select-none"><Coins size={12} /> Costos de Creación Blueprint</span>
                      <div><label className="text-[9px] text-zinc-500">Metal Req</label><input type="number" value={editingItem.req_metal ?? 0} onChange={(e) => updateFormKey('req_metal', e.target.value)} className="w-full bg-black border border-zinc-850 p-1.5 rounded text-white text-right" /></div>
                      <div><label className="text-[9px] text-zinc-500">Crystal Req</label><input type="number" value={editingItem.req_crystal ?? 0} onChange={(e) => updateFormKey('req_crystal', e.target.value)} className="w-full bg-black border border-zinc-850 p-1.5 rounded text-white text-right" /></div>
                      <div><label className="text-[9px] text-zinc-500">GD Token Req</label><input type="number" value={editingItem.req_gd ?? 0} onChange={(e) => updateFormKey('req_gd', e.target.value)} className="w-full bg-black border border-zinc-850 p-1.5 rounded text-emerald-400 font-bold text-right" /></div>
                      <div><label className="text-[9px] text-zinc-500">Phantom Coin Req</label><input type="number" value={editingItem.req_phantom_coin ?? 0} onChange={(e) => updateFormKey('req_phantom_coin', e.target.value)} className="w-full bg-black border border-zinc-850 p-1.5 rounded text-purple-400 font-bold text-right" /></div>
                    </div>

                    <div className="col-span-2 grid grid-cols-2 gap-2 bg-zinc-950 p-3 rounded-xl border border-zinc-900">
                      <span className="col-span-2 text-[9.5px] text-amber-500 font-bold uppercase block border-b border-zinc-900 pb-1 flex items-center gap-1 select-none"><Hammer size={12} /> Existencias del Ledger</span>
                      <div><label className="text-[9px] text-zinc-500">Existentes en Circulación</label><input type="number" value={editingItem.total_existing ?? 0} onChange={(e) => updateFormKey('total_existing', e.target.value)} className="w-full bg-black border border-zinc-850 p-1.5 rounded text-cyan-400 font-bold text-right" /></div>
                      <div><label className="text-[9px] text-zinc-500">Utilizados</label><input type="number" value={editingItem.total_used ?? 0} onChange={(e) => updateFormKey('total_used', e.target.value)} className="w-full bg-black border border-zinc-850 p-1.5 rounded text-amber-400 font-bold text-right" /></div>
                    </div>
                  </>
                )}

                {/* MAPEADOR COMPENSADO DE COLUMNAS HOMOGÉNEAS COMPROBADAS */}
                {['ASTROBOTS', 'LICENSES', 'TOOLS', 'CONSUMABLES'].includes(activeTab) && (
                  <>
                    <div className="col-span-2 text-zinc-500 text-[10px] uppercase font-bold tracking-wider select-none border-b border-zinc-900 pb-1 mt-2">Costes de Manufactura</div>
                    <div><label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1">Base Metal Cost</label><input type="number" value={editingItem.base_metal_cost ?? 0} onChange={(e) => updateFormKey('base_metal_cost', e.target.value)} className="w-full bg-black border border-zinc-850 p-2 rounded text-white" /></div>
                    <div><label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1">Base Crystal Cost</label><input type="number" value={editingItem.base_crystal_cost ?? 0} onChange={(e) => updateFormKey('base_crystal_cost', e.target.value)} className="w-full bg-black border border-zinc-850 p-2 rounded text-white" /></div>
                  </>
                )}

                {/* CAMPOS GLOBALES DE LÍNEAS GENERALES */}
                {activeTab !== 'SHIPS' && activeTab !== 'BLUEPRINTS' && activeTab !== 'DEFENSES' && (
                  <>
                    <div className="col-span-2 text-zinc-500 text-[10px] uppercase font-bold tracking-wider select-none border-b border-zinc-900 pb-1 mt-2">Especificaciones Generales</div>
                    <div><label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1 select-none">Sub-Tipo Línea (type)</label><input type="text" value={editingItem.type || ''} onChange={(e) => updateFormKey('type', e.target.value)} className="w-full bg-black border border-zinc-850 p-2 rounded text-white font-sans text-xs focus:outline-none" /></div>
                    <div><label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1 select-none">Power Score Weight</label><input type="number" step="any" value={editingItem.power_score ?? 1.0} onChange={(e) => updateFormKey('power_score', e.target.value)} className="w-full bg-black border border-zinc-850 p-2 rounded text-cyan-400 font-bold" /></div>
                    {activeTab !== 'BADGES' && (
                      <div className="col-span-2"><label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1 select-none">Corporación Fabricante (company)</label><input type="text" value={editingItem.company || ''} onChange={(e) => updateFormKey('company', e.target.value)} className="w-full bg-black border border-zinc-850 p-2 rounded text-white font-sans text-xs" /></div>
                    )}
                  </>
                )}

                {/* SELECTOR MAESTRO DE SKILLS */}
                <div className="col-span-2 border-t border-zinc-900 pt-3 mt-2 mb-2">
                  <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1 select-none">Módulos de Habilidad (Sasori Registry)</label>
                  <div className="flex gap-2">
                    <select
                      value={newSkillInput}
                      onChange={(e) => setNewSkillInput(e.target.value)}
                      className="flex-1 bg-black border border-zinc-850 p-2 rounded text-zinc-200 text-xs font-mono outline-none focus:border-red-500 cursor-pointer"
                    >
                      <option value="">-- Seleccionar Skill desde Registry --</option>
                      {masterSkills.map(sk => (
                        <option key={sk.skill_code} value={sk.skill_code}>
                          {sk.base_name} (T{sk.tier_level}) {sk.modifier_value > 0 ? `[+${sk.modifier_value * 100}% ${sk.stat_affected}]` : ''}
                        </option>
                      ))}
                    </select>
                    <button type="button" onClick={addSkillTag} className="bg-red-650 hover:bg-red-700 text-white font-bold px-3 py-2 rounded text-xs transition-all flex items-center gap-1 cursor-pointer"><PlusCircle size={14} /> EQUIPAR</button>
                  </div>

                  {Array.isArray(editingItem.skills) && editingItem.skills.length > 0 && (
                    <div className="mt-2.5 space-y-1.5">
                      {editingItem.skills.map((sk: any, idx: number) => {
                        const skillId = typeof sk === 'string' ? sk : sk?.skill_id;
                        const resolved = skillCache.get(skillId);

                        return (
                          <div key={idx} className="flex justify-between items-center bg-black/40 border border-zinc-850 p-1.5 px-2 rounded-lg">
                            <span className="text-[10px] font-mono text-cyan-300">
                              {resolved ? `${resolved.base_name} [T${resolved.tier_level}]` : `${skillId} (Legacy)`}
                            </span>
                            <button type="button" onClick={() => removeSkillTag(idx)} className="text-red-500 hover:text-red-400 p-1 cursor-pointer"><Trash2 size={12} /></button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* INVENTARIOS Y STACK (FORZADO STACKEABLE EN NAVES) */}
                <div className="col-span-2 grid grid-cols-2 gap-3 border-t border-zinc-900 pt-3 select-none">
                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1">Estructura Stack</label>
                    <input type="text" value={activeTab === 'SHIPS' ? 'Stackeable' : (editingItem.stack || '')} disabled={activeTab === 'SHIPS'} onChange={(e) => updateFormKey('stack', e.target.value)} className="w-full bg-black border border-zinc-850 p-2 rounded text-white text-xs disabled:opacity-40" />
                  </div>
                  <div><label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1">Max Stack Slots</label><input type="number" value={editingItem.max_stack ?? 1} onChange={(e) => updateFormKey('max_stack', e.target.value)} className="w-full bg-black border border-zinc-850 p-2 rounded text-white text-right" /></div>
                  <div><label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1">Duración Catálogo</label><input type="text" value={editingItem.duration || ''} onChange={(e) => updateFormKey('duration', e.target.value)} className="w-full bg-black border border-zinc-850 p-2 rounded text-white text-xs" /></div>
                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1">¿Tokenizado (is_nft)?</label>
                    <select value={editingItem.is_nft ? 'true' : 'false'} onChange={(e) => updateFormKey('is_nft', e.target.value === 'true')} className="w-full bg-black border border-zinc-850 p-2 rounded text-white outline-none text-xs">
                      <option value="false">FALSO (Off-Chain)</option><option value="true">VERDADERO (NFT)</option>
                    </select>
                  </div>
                </div>

                {/* GESTOR DE DEPENDENCIAS DE FLOTA */}
                <div className="col-span-2">
                  <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1 select-none flex items-center gap-1"><Boxes size={12} className="text-amber-400" /> Composición Requerida en Flota Activa (set_skills)</label>
                  <input type="text" placeholder="Ej: Requiere ship-light-hunter x2 para activar" value={editingItem.set_skills || ''} onChange={(e) => updateFormKey('set_skills', e.target.value)} className="w-full bg-black border border-zinc-850 p-2 rounded text-amber-400 font-mono font-bold text-xs focus:border-amber-500 focus:outline-none" />
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1 select-none">Manifiesto Descriptivo (description)</label>
                  <textarea rows={2} value={editingItem.description || ''} onChange={(e) => updateFormKey('description', e.target.value)} className="w-full bg-black border border-zinc-850 p-2 rounded text-white font-sans text-xs" />
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-900 select-none">
                <button type="submit" disabled={saveLoading} className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-zinc-800 text-white font-bold font-sans py-2.5 rounded-xl uppercase tracking-wider text-[11px] transition-all cursor-pointer shadow-lg" >
                  <Save size={14} /> {saveLoading ? 'Procesando Transacción en Postgres...' : editorMode === 'CREATE' ? 'Insertar Nueva Semilla' : 'Persistir Modificaciones de Balance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="text-[11px] font-mono text-zinc-750 border-t border-zinc-900 pt-3 flex justify-between select-none relative z-10">
        <span>Filtro de visualización activo:</span>
        <span className="text-red-500 font-bold">{filteredItems.length} registros listados</span>
      </div>
    </div>
  );
};