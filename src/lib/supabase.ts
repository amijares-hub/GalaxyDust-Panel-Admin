import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseConfig, UserProfile, GameRule, BrandConfig, WebComponent, GalaxyDustConfig } from '../types';

const STORAGE_KEY_CONFIG = 'saso_supabase_config';
const STORAGE_KEY_BRAND = 'sasori_local_brand';
const STORAGE_KEY_COMPONENTS = 'sasori_local_components';
const STORAGE_KEY_RULES = 'sasori_local_rules';
const STORAGE_KEY_USERS = 'sasori_local_users';
const STORAGE_KEY_GAME_HUD = 'sasori_local_game_hud';

let activeClient: SupabaseClient | null = null;

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
    
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(newConfig));
    
    if (isConfigured) {
      try {
        activeClient = createClient(config.url, config.anonKey, {
          auth: { persistSession: false }
        });
      } catch (err) {
        console.error('Failed to instantiate Supabase client:', err);
        newConfig.isConnected = false;
        activeClient = null;
      }
    } else {
      activeClient = null;
    }
    
    return newConfig;
  } catch (e) {
    console.error('Error saving Supabase config:', e);
    return { url: config.url, anonKey: config.anonKey, isConnected: false };
  }
}

// Initalize on startup
const initialConfig = loadSupabaseConfig();
if (initialConfig.isConnected) {
  try {
    activeClient = createClient(initialConfig.url, initialConfig.anonKey, {
      auth: { persistSession: false }
    });
  } catch (e) {
    console.error('Startup Supabase client exception:', e);
  }
}

export function getSupabaseClient(): SupabaseClient | null {
  return activeClient;
}

/**
 * Generic Storage Sync Service
 * Manages operations to Supabase directly if connected, falling back beautifully to localStorage with detailed tracking.
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
    
    // Local fallback
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
        // Upsert into configuration table
        const { error } = await activeClient
          .from('sasori_brand_config')
          .upsert({ id: 'global_brand', ...brand });
        
        if (error) throw error;
      } catch (err) {
        console.error('Failed to sync brand to Supabase:', err);
        throw new Error('No se pudo guardar la configuración de branding en la base de datos Supabase remota, pero se guardó de forma local.');
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
        // Insert or Update all elements
        const { error } = await activeClient
          .from('sasori_web_components')
          .upsert(components);
        
        if (error) throw error;
      } catch (err) {
        console.error('Failed to sync web components to Supabase:', err);
        throw new Error('No se pudo sincronizar algunos componentes con Supabase. Guardado de forma local.');
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
          // In actual Supabase, conditions and actions may be stored as JSON
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
        throw new Error('Guardado localmente. Error remitiendo las reglas a la tabla sasori_game_rules.');
      }
    }
  },

  // Users CRM Sync
  async getUsers(fallback: UserProfile[]): Promise<{ data: UserProfile[]; source: 'supabase' | 'local' }> {
    if (activeClient) {
      try {
        const { data, error } = await activeClient
          .from('sasori_users')
          .select('*');
        
        if (error) throw error;
        if (data && data.length > 0) {
          return { data: data as UserProfile[], source: 'supabase' };
        }
      } catch (err) {
        console.warn('Supabase users crm loading errors. Using local caches:', err);
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
        const { error } = await activeClient
          .from('sasori_users')
          .upsert(users);
        if (error) throw error;
      } catch (err) {
        console.error('Failed to push users to Supabase table:', err);
        throw new Error('Sin sincronización. Se guardó localmente en caché debido a restricciones de política.');
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
        throw new Error('Guardado localmente. Error sincronizando con la tabla sasori_game_hud remota.');
      }
    }
  }
};
