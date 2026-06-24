import React, { useState } from 'react';
import { AlertTriangle, Plus, Shield, Swords, Activity, ArrowRight, Trash2 } from 'lucide-react';

// ==========================================
// 1. TYPES & INTERFACES (SINCRONIZADOS AL 100% CON TU CSV)
// ==========================================

export interface CombatSkill {
  skill_code: string;
  base_name: string;
  tier_level: number;
  display_suffix: string;
  rarity: string;
  description: string;
  target_entity: string;
  stat_affected: string; // Columna real de tu DB
  math_operator: string; // Columna real de tu DB
  modifier_value: number; // Modificador decimal real (ej: 0.05)
  operation_type: string;
}

export interface ShipSeed {
  ship_id: string;
  ship_name: string;
  description: string;
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Phantom' | 'Xmas';
  avatar_url: string;
  can_level_required: number;
  blueprints_required: number;
  resistance: number;
  shield: number;
  defense: number;
  speed_boost: number;
  combat_speed: number;
  engine: string;
  damage_type: string;
  collection: string;
  ship_role: string;
  ship_size: string;
  attack_standard: number;
  attack_ionic: number;
  attack_plasma: number;
  attack_laser: number;
  attack_graviton: number;
  cargo_capacity: number;
  production_min: number;
  production_max: number;
  series: string;
  skills: string[];
  skill_requirements: string;
}

// ==========================================
// 2. PURE FUNCTIONS (MOTOR MATEMÁTICO REAL)
// ==========================================

/**
 * Motor de simulación en memoria de Sasori Labs.
 * Procesa modificadores decimales acumulativos sobre estadísticas de naves.
 */
export const calculateCombatStats = (ship: ShipSeed, skills: CombatSkill[]): ShipSeed => {
  // Inmutabilidad de grado militar: Aislamiento total en memoria profunda
  const clonedShip = structuredClone(ship);
  const statModifiers: Record<string, CombatSkill[]> = {};

  // Validación y agrupación por estadística afectada real
  skills.forEach(skill => {
    if (!skill.stat_affected || typeof skill.modifier_value !== 'number') {
      return;
    }

    // Validar que el chasis de la nave contenga la estadística numérica
    if (typeof (clonedShip as any)[skill.stat_affected] !== 'number') {
      console.warn(`[CombatSandbox] La estadística no existe en el chasis:`, skill.stat_affected);
      return;
    }

    if (!statModifiers[skill.stat_affected]) {
      statModifiers[skill.stat_affected] = [];
    }
    statModifiers[skill.stat_affected].push(skill);
  });

  // Procesamiento multiplicativo acumulativo basado en tus decimales de base de datos
  for (const [stat, mods] of Object.entries(statModifiers)) {
    let baseValue = (clonedShip as any)[stat] as number;
    let totalMultiplier = 1.0; // Factor base (100%)

    mods.forEach(mod => {
      // Como tus valores en DB son decimales (ej: 0.05 para 5%), se acumulan directamente al multiplicador
      totalMultiplier += mod.modifier_value;
    });

    // Redondeo seguro contra comas flotantes de JS y límite inferior en cero (No stats negativos)
    (clonedShip as any)[stat] = Math.max(0, Math.round(baseValue * totalMultiplier));
  }

  return clonedShip;
};

// ==========================================
// 3. PURE COMPONENTS
// ==========================================

interface StatPreviewerProps {
  label: string;
  baseValue: number;
  modifiedValue: number;
  icon?: React.ReactNode;
}

const StatPreviewer: React.FC<StatPreviewerProps> = ({ label, baseValue, modifiedValue, icon }) => {
  const isChanged = baseValue !== modifiedValue;
  const isPositive = modifiedValue > baseValue;

  return (
    <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
      <div className="flex items-center gap-3">
        <div className="text-gray-400">{icon}</div>
        <span className="text-gray-300 font-medium">{label}</span>
      </div>

      <div className="flex items-center gap-3 font-mono">
        <span className={isChanged ? "text-gray-500 line-through text-xs" : "text-emerald-400"}>
          {baseValue.toLocaleString()}
        </span>

        {isChanged && (
          <>
            <ArrowRight size={14} className="text-gray-500" />
            <span className={isPositive ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
              {modifiedValue.toLocaleString()}
            </span>
          </>
        )}
      </div>
    </div>
  );
};

// ==========================================
// 4. ERROR BOUNDARY
// ==========================================

class SandboxErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, errorMsg: string }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMsg: error.message };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[CombatSandbox Error]", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-900/20 border border-red-500/50 rounded-xl flex flex-col items-center justify-center text-center space-y-4">
          <AlertTriangle className="text-red-500 w-12 h-12" />
          <div>
            <h3 className="text-red-400 font-bold text-lg">Error Crítico en el Simulador</h3>
            <p className="text-red-300/70 text-sm mt-1">El motor de cálculo ha colapsado. Revise los datos de entrada.</p>
            <p className="text-red-400/50 text-xs mt-2 font-mono bg-black/30 p-2 rounded">{this.state.errorMsg}</p>
          </div>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors text-sm"
          >
            Reiniciar Sandbox
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ==========================================
// 5. ISOLATED TESTER COMPONENT
// ==========================================

const MOCK_SHIP: ShipSeed = {
  ship_id: "test-001",
  ship_name: "Test Ship Alpha",
  description: "Mock ship for testing",
  rarity: "Legendary",
  avatar_url: "",
  can_level_required: 1,
  blueprints_required: 10,
  resistance: 10000,
  shield: 5000,
  defense: 200,
  speed_boost: 500,
  combat_speed: 200,
  engine: "Impulso",
  damage_type: "Laser",
  collection: "Test",
  ship_role: "Attack",
  ship_size: "Fighter",
  attack_standard: 2000,
  attack_ionic: 0,
  attack_plasma: 0,
  attack_laser: 500,
  attack_graviton: 0,
  cargo_capacity: 10000,
  production_min: 0,
  production_max: 0,
  series: "TEST-01",
  skills: [],
  skill_requirements: ""
};

export interface CombatSandboxOverlayProps {
  ship: ShipSeed;
}

export const CombatSandboxOverlayInner: React.FC<CombatSandboxOverlayProps> = ({ ship }) => {
  const [activeSkills, setActiveSkills] = useState<CombatSkill[]>([]);

  const [testStat, setTestStat] = useState('attack_standard');
  const [testVal, setTestVal] = useState(0.05); // Equivale al 5% en decimal real de tu DB

  const computedShip = calculateCombatStats(ship, activeSkills);

  const addTestSkill = () => {
    setActiveSkills([...activeSkills, {
      skill_code: Math.random().toString(),
      name: `Simulación Skill ${activeSkills.length + 1}`,
      base_name: `Simulación Skill ${activeSkills.length + 1}`,
      stat_affected: testStat,
      math_operator: 'add',
      modifier_value: testVal,
      tier_level: 1,
      display_suffix: 'I',
      rarity: 'Common',
      description: 'Habilidad simulada en caliente',
      target_entity: 'ships',
      operation_type: 'suma'
    }]);
  };

  const removeSkill = (id: string) => {
    setActiveSkills(activeSkills.filter(s => s.skill_code !== id));
  };

  return (
    <div className="p-6 bg-gray-900 rounded-xl border border-emerald-500/30 text-white max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-gray-800 pb-4">
        <div className="flex items-center gap-3">
          <Activity className="text-emerald-500" />
          <h2 className="text-xl font-bold text-emerald-400">Combat Sandbox Test: {ship.ship_name}</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-300">Modificadores Temporales</h3>

          <div className="bg-gray-800/30 p-4 rounded-lg space-y-3">
            <div className="flex gap-2 text-sm">
              <select className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs" value={testStat} onChange={e => setTestStat(e.target.value)}>
                <option value="resistance">HP (Resistance)</option>
                <option value="shield">Shield</option>
                <option value="attack_standard">Attack Standard</option>
                <option value="speed_boost">Speed Boost</option>
                <option value="cargo_capacity">Cargo Capacity</option>
              </select>
              <input
                type="number"
                step="0.01"
                className="bg-gray-900 border border-gray-700 rounded px-2 py-1 w-24 text-xs text-right text-emerald-400 font-mono"
                value={testVal}
                onChange={e => setTestVal(Number(e.target.value))}
                placeholder="0.05 = 5%"
              />
              <button onClick={addTestSkill} className="bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 p-1 px-3 rounded text-xs font-bold font-sans">INYECTAR</button>
            </div>

            <div className="space-y-2 mt-4">
              {activeSkills.map(skill => (
                <div key={skill.skill_code} className="flex items-center justify-between bg-black/20 p-2 rounded border border-gray-700/50">
                  <div>
                    <p className="text-xs font-bold text-gray-200">{skill.name}</p>
                    <p className="text-[10px] text-emerald-400 font-mono">
                      {skill.stat_affected} • +{skill.modifier_value * 100}%
                    </p>
                  </div>
                  <button onClick={() => removeSkill(skill.skill_code)} className="text-red-400 hover:text-red-300 p-1">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {activeSkills.length === 0 && <p className="text-xs text-gray-500 text-center py-4">No hay modificadores activos</p>}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-300">Cápsula Esmeralda (Preview Atómica)</h3>

          <div className="space-y-2">
            <StatPreviewer
              label="Hull Integrity (HP)"
              baseValue={ship.resistance}
              modifiedValue={computedShip.resistance}
              icon={<Shield size={16} />}
            />
            <StatPreviewer
              label="Shield Matrix"
              baseValue={ship.shield}
              modifiedValue={computedShip.shield}
              icon={<Shield size={16} className="text-blue-400" />}
            />
            <StatPreviewer
              label="Standard Attack"
              baseValue={ship.attack_standard}
              modifiedValue={computedShip.attack_standard}
              icon={<Swords size={16} className="text-red-400" />}
            />
          </div>

          {/* Validation Checks */}
          <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700 text-[11px] font-mono text-gray-400">
            <p className="mb-2 text-white"><strong>Tests de Regresión Visual (Kernel de Sasori):</strong></p>
            <p className="flex justify-between border-b border-gray-800 py-1">
              <span>Mismo objeto si skills=0?</span>
              <span className={JSON.stringify(ship) === JSON.stringify(calculateCombatStats(ship, [])) ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                {JSON.stringify(ship) === JSON.stringify(calculateCombatStats(ship, [])) ? 'PASS' : 'FAIL'}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CombatSandboxOverlay: React.FC<CombatSandboxOverlayProps> = (props) => {
  return (
    <SandboxErrorBoundary>
      <CombatSandboxOverlayInner {...props} />
    </SandboxErrorBoundary>
  );
};

const CombatSandboxTesterInner: React.FC = () => {
  return (
    <SandboxErrorBoundary>
      <CombatSandboxOverlayInner ship={MOCK_SHIP} />
    </SandboxErrorBoundary>
  );
}

export default CombatSandboxTesterInner;