import { getSupabaseClient } from './supabase'; // Puente directo a Postgres

export interface PromoCodeRewards {
  metal?: number;
  crystal?: number;
  deuterium?: number;
  dark_matter?: number;
  gd_coins?: number;
  phantom_coins?: number;
  ships?: string;
}

export interface PromoCodePayload {
  code: string;
  expires_at: string;
  max_claims: number;
  rewards: PromoCodeRewards;
}

export interface MutateLeaderPayload {
  alliance_id: string;
  new_leader_id: string;
}

export interface CombatLoot {
  metal: number;
  crystal: number;
  deuterium: number;
}

export interface CombatReportPayload {
  attacker_id: string;
  defender_id: string;
  winner_id: string;
  loot_stolen: CombatLoot;
  battle_log: string[];
  raw_json: any;
}

// ─── REPARACIÓN DEL RADAR ANTI-CHEAT CON LA ECONOMÍA REAL ───
export interface AntiCheatAnomaly {
  id: string;
  username: string;
  level: number;
  gd_coins: number;      // Saneado: Moneda real de liquidez
  phantom_coins: number; // Saneado: Moneda real de quema
  metal: number;         // Saneado: Recurso core
  crystal: number;       // Saneado: Recurso core
  flag: string;
}

const API_BASE_URL = 'http://localhost:8080/api/admin';

const getClient = () => {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase client no inicializado");
  return client;
};

export const adminApi = {
  // Generador de Promo Codes
  createPromoCode: async (payload: PromoCodePayload) => {
    try {
      // Intento primario vía microservicio Deno/Go
      const response = await fetch(`${API_BASE_URL}/promo/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn('Microservicio 8080 inaccesible. Ejecutando fallback directo a Supabase RPC...');
      
      // Fallback Transaccional directo a la Base de Datos para evitar bloqueos
      const { data, error: sbError } = await getClient().rpc('admin_generate_promocode', {
        p_code: payload.code,
        p_expires_at: payload.expires_at,
        p_max_claims: payload.max_claims,
        p_rewards: payload.rewards
      });
      if (sbError) throw sbError;
      return { status: 'success', data };
    }
  },

  // Transferencia de Mando de Gremio
  mutateAllianceLeader: async (payload: MutateLeaderPayload) => {
    try {
      const response = await fetch(`${API_BASE_URL}/alliance/mutate-leader`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn('Microservicio Offline. Modificando líder en caliente vía Supabase Client...');
      
      const { error: sbError } = await getClient()
        .from('sasori_fleets') // Tabla relacional de alianzas/hangares
        .update({ user_id: payload.new_leader_id })
        .eq('id', payload.alliance_id);
      
      if (sbError) throw sbError;
      return { status: 'success', mutated: true };
    }
  },

  // Heurística Anti-Cheat con Monedas Reales
  getAntiCheatAnomalies: async (): Promise<AntiCheatAnomaly[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/security/anti-cheat-check`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn('Radar API Offline. Ejecutando escáner heurístico directo en user_profiles...');
      
      // Escaneo en caliente en Postgres buscando picos anómalos de inflación de monedas o recursos
      const { data, error: sbError } = await getClient()
        .from('user_profiles')
        .select('id, username, can_level, gd_coins, phantom_coins, metal, crystal')
        .or('gd_coins.gt.800000,metal.gt.4000000,crystal.gt.4000000') // Flags de alerta automática
        .order('gd_coins', { ascending: false });

      if (sbError) throw sbError;

      return (data || []).map((row: any) => ({
        id: row.id,
        username: row.username || 'Explorador Sospechoso',
        level: row.can_level || 1,
        gd_coins: row.gd_coins || 0,
        phantom_coins: row.phantom_coins || 0,
        metal: row.metal || 0,
        crystal: row.crystal || 0,
        flag: row.gd_coins > 800000 ? 'EXCESO_GD_COINS' : 'INFLACIÓN_BÓVEDA_SEED'
      }));
    }
  },

  // Caja Negra: Inyector de Reportes PvP
  injectBattleReport: async (payload: CombatReportPayload) => {
    try {
      const response = await fetch(`${API_BASE_URL}/security/battle-log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn('Microservicio 8080 Offline. Volcando JSON de Caja Negra en Supabase battle_logs...');
      
      const { data, error: sbError } = await getClient()
        .from('battle_logs')
        .insert({
          attacker_id: payload.attacker_id,
          defender_id: payload.defender_id,
          winner_id: payload.winner_id,
          loot: payload.loot_stolen,
          raw_log: JSON.stringify(payload.raw_json)
        });

      if (sbError) throw sbError;
      return { status: 'success', injected: true };
    }
  }
};
