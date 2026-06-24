import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseConfig, UserProfile, GameRule, BrandConfig, WebComponent, GalaxyDustConfig } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Control forense: Si las variables no existen, avisamos en consola
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("CRITICAL ERROR: Las variables de entorno de Supabase no están cargadas.");
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: { persistSession: false }
});

const STORAGE_KEY_CONFIG = 'saso_supabase_config';
const STORAGE_KEY_BRAND = 'sasori_local_brand';
const STORAGE_KEY_COMPONENTS = 'sasori_local_components';
const STORAGE_KEY_RULES = 'sasori_local_rules';
const STORAGE_KEY_USERS = 'sasori_local_users';
const STORAGE_KEY_GAME_HUD = 'sasori_local_game_hud';

// El cliente activo está SIEMPRE anclado al singleton del .env.
// No se permite override por localStorage para evitar apuntar a proyectos incorrectos.
const activeClient: SupabaseClient = supabase;

export function loadSupabaseConfig(): SupabaseConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        url: parsed.url || '',
        anonKey: parsed.anonKey || '',
        isConnected: Boolean(parsed.url && parsed.anonKey)
      };
    }
  } catch (e) {
    console.error('Error loading Supabase config from localStorage:', e);
  }
  return { url: '', anonKey: '', isConnected: false };
}

export function saveSupabaseConfig(config: Omit<SupabaseConfig, 'isConnected'>): SupabaseConfig {
  try {
    const isConfigured = Boolean(config.url && config.anonKey);
    const newConfig: SupabaseConfig = {
      ...config,
      isConnected: isConfigured
    };
    // Persiste el config en localStorage sólo para referencia de UI.
    // NUNCA reasigna activeClient — el cliente de producción viene siempre del .env.
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(newConfig));
    return newConfig;
  } catch (e) {
    console.error('Error saving Supabase config:', e);
    return { url: config.url, anonKey: config.anonKey, isConnected: false };
  }
}

// getSupabaseClient siempre devuelve el singleton anclado al .env de producción.
// El localStorage NO puede sobrescribir este cliente.
export function getSupabaseClient(): SupabaseClient {
  return activeClient;
}

/**
 * UNIVERSAL SYNC SERVICE (GALAXYDUST CORES)
 * Administra operaciones directas sobre Supabase remetiendo de forma segura al localStorage.
 */
export const supabaseService = {
  // Brand Configuration Sync
  async getBrand(fallback: BrandConfig): Promise<{ data: BrandConfig; source: 'supabase' | 'local' }> {
    if (activeClient) {
      try {
        const { data, error } = await activeClient
          .from('sasori_brand_config')
          .select('*')
          .maybeSingle();
        
        if (error) throw error;
        if (data) {
          return { data: data as BrandConfig, source: 'supabase' };
        }
      } catch (err) {
        console.warn('Supabase fetched brand configuration failed. Using local storage:', err);
      }
    }
    
    try {
      const cached = localStorage.getItem(STORAGE_KEY_BRAND);
      if (cached) {
        return { data: JSON.parse(cached), source: 'local' };
      }
    } catch (e) {
      console.error(e);
    }
    return { data: fallback, source: 'local' };
  },

  async saveBrand(brand: BrandConfig): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEY_BRAND, JSON.stringify(brand));
    } catch (e) {
      console.error(e);
    }

    if (activeClient) {
      try {
        const { error } = await activeClient
          .from('sasori_brand_config')
          .upsert({ id: 'global_brand', ...brand });
        
        if (error) throw error;
      } catch (err) {
        console.error('Failed to sync brand to Supabase:', err);
        throw new Error('No se pudo guardar el branding en Supabase. Cambios guardados localmente.');
      }
    }
  },

  // Components Configuration Sync
  async getComponents(fallback: WebComponent[]): Promise<{ data: WebComponent[]; source: 'supabase' | 'local' }> {
    if (activeClient) {
      try {
        const { data, error } = await activeClient
          .from('sasori_web_components')
          .select('*');
        
        if (error) throw error;
        if (data && data.length > 0) {
          return { data: data as WebComponent[], source: 'supabase' };
        }
      } catch (err) {
        console.warn('Supabase components load failed. Using local store:', err);
      }
    }

    try {
      const cached = localStorage.getItem(STORAGE_KEY_COMPONENTS);
      if (cached) {
        return { data: JSON.parse(cached), source: 'local' };
      }
    } catch (e) {
      console.error(e);
    }
    return { data: fallback, source: 'local' };
  },

  async saveComponents(components: WebComponent[]): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEY_COMPONENTS, JSON.stringify(components));
    } catch (e) {
      console.error(e);
    }

    if (activeClient) {
      try {
        const { error } = await activeClient
          .from('sasori_web_components')
          .upsert(components);
        
        if (error) throw error;
      } catch (err) {
        console.error('Failed to sync web components to Supabase:', err);
        throw new Error('Sincronización de componentes fallida. Guardado local activo.');
      }
    }
  },

  // Game Rules / Conditions Sync
  async getRules(fallback: GameRule[]): Promise<{ data: GameRule[]; source: 'supabase' | 'local' }> {
    if (activeClient) {
      try {
        const { data, error } = await activeClient
          .from('sasori_game_rules')
          .select('*');
        
        if (error) throw error;
        if (data && data.length > 0) {
          return { data: data as GameRule[], source: 'supabase' };
        }
      } catch (err) {
        console.warn('Supabase rules fetch failure. Using local:', err);
      }
    }

    try {
      const cached = localStorage.getItem(STORAGE_KEY_RULES);
      if (cached) {
        return { data: JSON.parse(cached), source: 'local' };
      }
    } catch (e) {
      console.error(e);
    }
    return { data: fallback, source: 'local' };
  },

  async saveRules(rules: GameRule[]): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEY_RULES, JSON.stringify(rules));
    } catch (e) {
      console.error(e);
    }

    if (activeClient) {
      try {
        const { error } = await activeClient
          .from('sasori_game_rules')
          .upsert(rules);
        
        if (error) throw error;
      } catch (err) {
        console.error('Failed to sync game rules to Supabase:', err);
        throw new Error('Error remitiendo las reglas a Supabase. Persistencia local salvada.');
      }
    }
  },

  // ─── ⚔️ REFACTORIZACIÓN MAESTRA: SINCRO EN CALIENTE DE PILOTOS (USER_PROFILES) ───
  async getUsers(fallback: UserProfile[]): Promise<{ data: UserProfile[]; source: 'supabase' | 'local' }> {
    if (activeClient) {
      try {
        const { data, error } = await activeClient
          .from('user_profiles')
          .select('*');
        
        if (error) throw error;
        if (data && data.length > 0) {
          // Hidratamos las propiedades requeridas por el frontend mapeando desde las columnas reales de Postgres
          const mappedUsers: UserProfile[] = data.map((row: any) => ({
            id: row.id,
            username: row.username || 'Explorador Anónimo',
            email: row.email || 'sin-correo@sasorilabs.io',
            level: row.can_level || 1, // Mapeo de can_level hacia level del UI
            can_level: row.can_level || 1,
            xp: row.xp || 0,
            role: row.role || 'user',
            status: row.status || 'active',
            avatarUrl: row.avatar_url || 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=128',
            created_at: row.created_at || new Date().toISOString(),
            last_active: row.last_active || new Date().toISOString(),
            // Evitamos crasheos inyectando arrays vacíos para elementos relacionales dinámicos
            inventory: row.inventory || [],
            auditLogs: row.audit_logs || [],
            metal: Number(row.metal) || 0,
            crystal: Number(row.crystal) || 0,
            deuterium: Number(row.deuterium) || 0,
            dark_matter: Number(row.dark_matter) || 0,
            omniplate: Number(row.omniplate) || 0,
            orichaltron: Number(row.orichaltron) || 0,
            lunar_fiber: Number(row.lunar_fiber) || 0,
            infinity_core: Number(row.infinite_core) || 0,
            primal_token: Number(row.primal_token) || 0,
            xenoplasm: Number(row.xenoplasm) || 0,
            organium: Number(row.organium) || 0,
            mana: Number(row.mana) || 0,
            gd_coins: Number(row.gd_coins) || 0,
            phantom_coins: Number(row.phantom_coins) || 0,
            faction: row.faction || 'Nova',
            moral_status: row.moral_status || 'Order',
            ban_duration_days: row.ban_duration_days || 0,
            ban_reason: row.ban_reason || ''
          }));
          return { data: mappedUsers, source: 'supabase' };
        }
      } catch (err) {
        console.warn('Supabase profiles loading errors. Using local caches:', err);
      }
    }

    try {
      const cached = localStorage.getItem(STORAGE_KEY_USERS);
      if (cached) {
        return { data: JSON.parse(cached), source: 'local' };
      }
    } catch (e) {
      console.error(e);
    }
    return { data: fallback, source: 'local' };
  },

  async saveUsers(users: UserProfile[]): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    } catch (e) {
      console.error(e);
    }

    if (activeClient) {
      try {
        // 🔥 FILTRO MAESTRO: Limpiamos y sanitizamos las columnas antes de subirlas.
        // Postgres abortaría la transacción si le enviamos arrays o campos de interfaz como 'inventory' o 'email'
        const sanitizedRows = users.map(u => ({
          id: u.id,
          username: u.username,
          can_level: u.level, // Guardamos la variable level del UI en can_level de Postgres
          role: u.role,
          status: u.status,
          metal: u.metal,
          crystal: u.crystal,
          deuterium: u.deuterium,
          dark_matter: u.dark_matter,
          omniplate: u.omniplate,
          orichaltron: u.orichaltron,
          lunar_fiber: u.lunar_fiber,
          infinite_core: u.infinity_core, // Note: DB column is infinite_core, TS interface is infinity_core
          primal_token: u.primal_token,
          xenoplasm: u.xenoplasm,
          organium: u.organium,
          mana: u.mana,
          gd_coins: u.gd_coins,
          phantom_coins: u.phantom_coins,
          faction: u.faction,
          moral_status: u.moral_status,
          ban_duration_days: u.ban_duration_days,
          ban_reason: u.ban_reason
        }));

        const { error } = await activeClient
          .from('user_profiles')
          .upsert(sanitizedRows);
        
        if (error) throw error;
      } catch (err) {
        console.error('Failed to push users to Supabase user_profiles table:', err);
        throw new Error('Error al sincronizar con user_profiles. Cambios resguardados localmente.');
      }
    }
  },

  // Game Client HUD configurations (7 PDF Components)
  async getGameHud(fallback: GalaxyDustConfig): Promise<{ data: GalaxyDustConfig; source: 'supabase' | 'local' }> {
    if (activeClient) {
      try {
        const { data, error } = await activeClient
          .from('sasori_game_hud')
          .select('*')
          .maybeSingle();
        
        if (error) throw error;
        if (data && data.config) {
          return { data: data.config as GalaxyDustConfig, source: 'supabase' };
        }
      } catch (err) {
        console.warn('Supabase game HUD fetch failed. Using local storage Fallback:', err);
      }
    }
    
    try {
      const cached = localStorage.getItem(STORAGE_KEY_GAME_HUD);
      if (cached) {
        return { data: JSON.parse(cached), source: 'local' };
      }
    } catch (e) {
      console.error(e);
    }
    return { data: fallback, source: 'local' };
  },

  async saveGameHud(config: GalaxyDustConfig): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEY_GAME_HUD, JSON.stringify(config));
    } catch (e) {
      console.error(e);
    }

    if (activeClient) {
      try {
        const { error } = await activeClient
          .from('sasori_game_hud')
          .upsert({ id: 'global_hud', config });
        
        if (error) throw error;
      } catch (err) {
        console.error('Failed to sync game HUD to Supabase:', err);
        throw new Error('Fallo al sincronizar sasori_game_hud. Persistencia local salvada.');
      }
    }
  }
};
