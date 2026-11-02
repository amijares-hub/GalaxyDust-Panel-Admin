import { getSupabaseClient } from './supabase';

export interface ForceReturnPayload {
  expedition_id: string;
  force_timestamp: string;
}

export interface InjectEventPayload {
  user_id: string;
  expedition_id: string;
  event_type: 'hostile' | 'anomaly' | 'discovery';
  title: string;
  message: string;
  damage_sustained: number;
  rewards_looted: {
    metal?: number;
    crystal?: number;
    dark_matter?: number;
    phantom_coins?: number;
  };
}

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

export interface AntiCheatAnomaly {
  id: string;
  username: string;
  level: number;
  gd_coins: number;
  phantom_coins: number;
  metal: number;
  crystal: number;
  flag: string;
}

const getClient = () => {
  const client = getSupabaseClient();
  if (!client) throw new Error("Cliente Supabase no inicializado.");
  return client;
};

export const adminApi = {
  // Retorno forzado e inmediato de expediciones en vuelo
  forceExpeditionReturn: async (payload: ForceReturnPayload) => {
    const client = getClient();
    const returnTime = payload.force_timestamp || new Date().toISOString();

    const { data, error } = await client
      .from('active_expeditions')
      .update({ 
        status: 'CLAIMED',
        estimated_return_time: returnTime
      })
      .eq('id', payload.expedition_id)
      .select();

    if (error) {
      // Fallback a tabla legacy si existiera
      const { error: fallbackErr } = await client
        .from('expeditions')
        .update({ 
          status: 'finished',
          arrives_at: returnTime
        })
        .eq('id', payload.expedition_id);

      if (fallbackErr) throw fallbackErr;
    }

    return { status: 'success', data };
  },

  // Inyección directa de eventos de misión a la bitácora
  injectExpeditionEvent: async (payload: InjectEventPayload) => {
    const client = getClient();

    const { data, error } = await client
      .from('expedition_logs')
      .insert({
        user_id: payload.user_id,
        expedition_id: payload.expedition_id,
        event_type: payload.event_type,
        title: payload.title,
        message: payload.message,
        damage_sustained: payload.damage_sustained,
        rewards_looted: payload.rewards_looted,
        created_at: new Date().toISOString()
      })
      .select();

    if (error) throw error;
    return { status: 'success', data };
  },

  // Creación y registro de Promo Codes
  createPromoCode: async (payload: PromoCodePayload) => {
    const client = getClient();

    const formattedCode = payload.code.toUpperCase().trim();
    const insertData = {
      code: formattedCode,
      expires_at: payload.expires_at,
      max_claims: Number(payload.max_claims) || 100,
      claims_count: 0,
      rewards: payload.rewards,
      created_at: new Date().toISOString()
    };

    const { data, error } = await client
      .from('promo_codes')
      .insert([insertData])
      .select();

    if (error) {
      // Intento por RPC si la tabla tuviese disparador de seguridad
      const { data: rpcData, error: rpcErr } = await client.rpc('admin_generate_promocode', {
        p_code: formattedCode,
        p_expires_at: payload.expires_at,
        p_max_claims: payload.max_claims,
        p_rewards: payload.rewards
      });

      if (rpcErr) throw rpcErr;
      return { status: 'success', data: rpcData };
    }

    return { status: 'success', data };
  },

  // Transferencia de liderazgo de Alianza
  mutateAllianceLeader: async (payload: MutateLeaderPayload) => {
    const client = getClient();

    // 1. Actualizar el líder en la tabla alliances
    const { error: allianceErr } = await client
      .from('alliances')
      .update({ leader_id: payload.new_leader_id })
      .eq('id', payload.alliance_id);

    if (allianceErr) throw allianceErr;

    // 2. Degradar a oficiales anteriores y promover al nuevo líder
    await client
      .from('alliance_members')
      .update({ role: 'OFFICER' })
      .eq('alliance_id', payload.alliance_id)
      .eq('role', 'LEADER');

    await client
      .from('alliance_members')
      .update({ role: 'LEADER' })
      .eq('alliance_id', payload.alliance_id)
      .eq('user_id', payload.new_leader_id);

    return { status: 'success', mutated: true };
  },

  // Escaneo heurístico en caliente de anomalías económicas
  getAntiCheatAnomalies: async (): Promise<AntiCheatAnomaly[]> => {
    const client = getClient();

    const { data, error } = await client
      .from('user_profiles')
      .select('id, username, can_level, level, gd_coins, gd_coin, phantom_coins, phantom_coin, metal, crystal')
      .or('gd_coins.gt.800000,gd_coin.gt.800000,metal.gt.50000000,crystal.gt.30000000')
      .order('gd_coins', { ascending: false })
      .limit(50);

    if (error) throw error;

    return (data || []).map((row: any) => {
      const gd = Number(row.gd_coins || row.gd_coin || 0);
      const metal = Number(row.metal || 0);
      return {
        id: row.id,
        username: row.username || `Piloto #${row.id}`,
        level: Number(row.can_level || row.level || 1),
        gd_coins: gd,
        phantom_coins: Number(row.phantom_coins || row.phantom_coin || 0),
        metal: metal,
        crystal: Number(row.crystal || 0),
        flag: gd > 800000 ? 'EXCESO_GD_COINS' : 'INFLACIÓN_METALES_ANÓMALA'
      };
    });
  },

  // Registro en caja negra de combates PvP
  injectBattleReport: async (payload: CombatReportPayload) => {
    const client = getClient();

    const { data, error } = await client
      .from('combat_logs')
      .insert({
        attacker_id: payload.attacker_id,
        defender_id: payload.defender_id,
        winner_id: payload.winner_id,
        resources_stolen: payload.loot_stolen,
        battle_log: payload.battle_log,
        raw_json: payload.raw_json,
        created_at: new Date().toISOString()
      })
      .select();

    if (error) {
      const { error: fallbackErr } = await client
        .from('battle_logs')
        .insert({
          attacker_id: payload.attacker_id,
          defender_id: payload.defender_id,
          winner_id: payload.winner_id,
          loot: payload.loot_stolen,
          raw_log: JSON.stringify(payload.raw_json)
        });

      if (fallbackErr) throw fallbackErr;
    }

    return { status: 'success', injected: true, data };
  }
};