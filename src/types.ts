export interface BrandConfig {
  siteName: string;
  logoUrl: string;
  primaryColor: string;
  accentColor: string;
  typography: 'Inter' | 'Space Grotesk' | 'Outfit' | 'JetBrains Mono';
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'full';
  isDark: boolean;
  announcementText: string;
  footerText: string;
}

export interface WebComponent {
  id: string;
  name: string;
  type: 'header' | 'hero' | 'feature_grid' | 'stats_banner' | 'login_box' | 'game_lobby' | 'footer';
  description: string;
  tab: 'landing' | 'auth' | 'dashboard' | 'game_lobby' | 'inventory';
  status: 'active' | 'draft' | 'hidden';
  tooltipInfo: string;
  properties: {
    title: string;
    subtitle?: string;
    ctaText?: string;
    showSocialLinks?: boolean;
    cardCount?: number;
    backgroundColor?: string;
    textColor?: string;
    buttonColor?: string;
    spacing: 'compact' | 'cozy' | 'spacious';
    imageUrl?: string;
  };
}

export interface GameCondition {
  id: string;
  field: 'user.level' | 'user.can_level' | 'user.gd_coins' | 'user.phantom_coins' | 'user.metal' | 'user.crystal' | 'user.deuterium' | 'user.dark_matter' | 'user.registration_days' | 'user.xp' | 'inventory.item_count';
  operator: 'greater_than' | 'less_than' | 'equals' | 'not_equals' | 'contains';
  value: string | number;
}

export interface GameAction {
  type: 'grant_item' | 'add_gd_coins' | 'add_phantom_coins' | 'multiply_xp' | 'send_custom_notification' | 'suspend_account';
  params: {
    itemId?: string;
    itemRarity?: 'common' | 'rare' | 'epic' | 'legendary';
    amount?: number;
    multiplier?: number;
    message?: string;
    durationDays?: number;
  };
}

export interface GameRule {
  id: string;
  name: string;
  description: string;
  trigger: 'on_login' | 'on_level_up' | 'on_quest_complete' | 'on_pvp_win' | 'on_transaction';
  conditions: GameCondition[];
  action: GameAction;
  isActive: boolean;
  tooltip: string;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  type: 'weapon' | 'armor' | 'consumable' | 'badge';
  quantity: number;
  durability?: number; // percentage e.g., 0 to 100
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  type: 'balance' | 'inventory' | 'status' | 'system' | 'notification';
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  level: number;
  can_level: number;
  xp: number;
  role: 'user' | 'moderator' | 'admin' | 'vip';
  status: 'active' | 'banned' | 'pending';
  avatarUrl: string;
  created_at: string;
  last_active: string;
  inventory: InventoryItem[];
  auditLogs?: AuditLogEntry[];
  
  // Normalización de las columnas atómicas de Postgres de la dApp
  metal: number;
  crystal: number;
  deuterium: number;
  dark_matter: number;
  omniplate: number;
  orichaltron: number;
  lunar_fiber: number;
  infinity_core: number;
  primal_token: number;
  xenoplasm: number;
  organium: number;
  mana: number;
  gd_coins: number;
  phantom_coins: number;
  
  // Lore Metadata
  faction?: 'Nova' | 'Osiris' | 'Alacran';
  moral_status?: 'Order' | 'Corrupted';
  
  // Temporarily banned details
  ban_duration_days?: number;
  ban_reason?: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
}

export type MainFunction = 'branding' | 'rules' | 'crm' | 'game_hud' | 'can' | 'ships' | 'matrix' | 'expediciones' | 'expediciones_vuelo' | 'market' | 'phantom_station' | 'promo' | 'alliance' | 'security' | 'sanitizer';

export type SubFunctionType = 
  | 'branding_global' | 'branding_landing' | 'branding_auth' | 'branding_lobby' | 'branding_hud'
  | 'rules_list' | 'rules_builder' | 'rules_testing'
  | 'crm_users' | 'crm_analytics' | 'crm_banned'
  | 'hud_auth' | 'hud_master' | 'hud_hangar' | 'hud_sideral' | 'hud_shop' | 'hud_phantom' | 'hud_alliance'
  | 'can_commander' | 'can_global' | 'can_alliances'
  | 'ships_atelier' | 'ships_hangar'
  | 'matrix_overview'
  | 'expediciones_dashboard' | 'expediciones_creator' | 'expediciones_rewards' | 'expediciones_events'
  | 'vuelo_telemetria' | 'vuelo_estados' | 'vuelo_rng' | 'vuelo_skills' | 'vuelo_seguridad' | 'vuelo_alertas'
  | 'market_items' | 'market_auctions' | 'market_rules' | 'market_audit' | 'market_inbox' | 'market_analytics'
  | 'phantom_store' | 'phantom_refresh' | 'phantom_cleansing' | 'phantom_events' | 'phantom_audit'
  | 'promo_main'
  | 'alliance_main'
  | 'security_main' | 'security_blackbox'
  | 'sanitizer_main';

export interface NavigationState {
  activeMain: MainFunction;
  activeSub: SubFunctionType;
}

// ==========================================
// GAME CLIENT CONFIG CONFIGURATOR UNIFIED
// ==========================================

export interface AuthTerminalConfig {
  headers: {
    portal: string;
    login: string;
    register: string;
    recovery: string;
    confirmEmail: string;
    mfaFactor: string;
    rejectSign: string;
    authorized: string;
  };
  toasts: {
    alert: string; 
    authCorrect: string; 
    connEstablished: string; 
    activeColor: 'red' | 'emerald' | 'cyan'; 
  };
  passwordStrength: {
    noKey: string;
    weak: string;
    average: string;
    strong: string;
    military: string;
  };
  passportWeb3: {
    username: string;
    email: string;
    avatarUrl: string;
    provider: string; 
    authorizeDate: string;
    mfaEnabled: boolean;
    assignedToken: string;
  };
  inputs: {
    emailPlaceholder: string;
    passwordPlaceholder: string;
    resetEmailPlaceholder: string;
    verificationDigits: number; 
    otpDigits: number; 
    rememberMeDefault: boolean;
  };
  buttons: {
    loginCta: string;
    registerCta: string;
    requestCta: string;
    confirmPinCta: string;
    mfaCta: string;
  };
  socialProviders: {
    googleEnabled: boolean;
    githubEnabled: boolean;
    facebookEnabled: boolean;
  };
  links: {
    forgotPasswordLabel: string;
    requestReminderLabel: string;
    backToLoginLabel: string;
    clearFormLabel: string;
    disconnectLabel: string;
  };
}

export interface HudEconomicConfig {
  pilot: {
    level: number;
    rankLabel: string; 
    avatarUrl: string;
  };
  combat: {
    powerScore: number;
    apCurrent: number;
    apMax: number;
  };
  buffs: {
    attackActive: boolean;
    defenseActive: boolean;
    speedActive: boolean;
  };
  currencies: {
    gd_coins: number;
    quantum_credits: number;
    phantom_coins: number;
    halloween_coins: number;
    xmas_coins: number;
    valentine_coins: number;
  };
  vaultResources: {
    metal: number;
    crystal: number;
    deuterium: number;
    dark_matter: number;
    omniplate: number;
    orichaltron: number;
    lunar_fiber: number;
    infinity_core: number;
    primal_token: number;
    xenoplasm: number;
    organium: number;
    mana: number;
  };
  streamTextOnClick: string; 
  buyCrystalsReward: number; 
}

export interface HangarAsset {
  id: string;
  name: string;
  category: 'Spaceships' | 'Structures' | 'Technology' | 'Badges';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  level: number;
  stars: number; 
  blueprintProgressPercent: number;
  blueprintsOwned: number;
  blueprintsRequired: number;
  hasNotification: boolean;
  avatarUrl: string;
  lore: string;
  hp: number;
  shield: number;
  vel: number;
  absorption: number;
  damageType: string;
  faction: string;
}

export interface HangarLogisticsConfig {
  metricCompanionsTotal: number;
  metricGalacticPowerScore: number;
  searchQueryPlaceholder: string;
  flotasEnVueloActive: boolean;
  lightspeedPackPriceCrystals: number;
  assets: HangarAsset[];
}

export interface StarCluster {
  id: string;
  name: string;
  durationSeconds: number;
  multiplier: number;
}

export interface SideralShip {
  id: string;
  name: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  powerBonus: number; 
  levelRequired: number;
  isUnlocked: boolean;
}

export interface SideralExplorationConfig {
  propulsionSpheres: string[]; 
  starClusters: StarCluster[];
  deployCarouselShips: SideralShip[];
  contratarLicenciaCostCrystals: number;
  quantumScanTimerSeconds: number; 
  quantumRewardCrystals: number; 
  completedPlanets: Array<{ name: string; concentration: number }>; 
  anomaliesPlanets: string[]; 
}

export interface ShopBundleItem {
  name: string;
  quantity: number;
  iconType: 'weapon' | 'currency' | 'material' | 'box';
  technicalLabel: string;
}

export interface ShopBundle {
  id: string;
  title: string;
  category: string;
  extraValuePercent: number; 
  rarityColorClass: string; 
  expirationHoursLeft: number; 
  stockLimitMax: number;
  stockRemaining: number;
  gemsRewardBonus: number;
  priceGdCoins: number;
  subItems: ShopBundleItem[];
}

export interface AcquisitionShopConfig {
  categories: string[]; 
  bundles: ShopBundle[];
}

export interface QuantumUnitShard {
  id: string;
  name: string;
  avatarUrl: string;
  rank: 'S' | 'A' | 'C' | 'E';
  elementType: 'Fire' | 'Ice' | 'Dark' | 'Void';
  voidCrystalCost: number;
  attackPower: number;
  fireDefense: number;
}

export interface QuantumSupplyItem {
  id: string;
  name: string;
  discountPercent: number; 
  timeReductionSeconds: number;
}

export interface PhantomStationConfig {
  phantomCrystalsBalance: number;
  recentTelemetryLogs: string[];
  autoRefreshStockTimerSeconds: number;
  refreshAttemptsUsed: number;
  refreshAttemptsMax: number; 
  autoRefreshEnabled: boolean;
  refreshCostVoidCrystals: number;
  unitsCatalog: QuantumUnitShard[];
  suppliesCatalog: QuantumSupplyItem[];
  selectedBadgeDiscount?: string;
  badgeDiscountPercent?: number;
  badgeDiscountCategories?: string[];
  totalBlueprintsGoal?: number;
  loyaltyRewardType?: string;
  npcName?: string;
  npcAvatar?: string;
  npcGreeting?: string;
  terminalStateOnline?: boolean;
  freeRefreshCountdown?: number;
  freeRefreshIntervalType?: string;
}

export interface AllianceRosterMember {
  id: string;
  name: string;
  level: number;
  tacticalPower: number;
  role: 'Comandante' | 'Oficial' | 'Piloto';
  avatarUrl: string;
  isOnline: boolean;
}

export interface COMMessage {
  id: string;
  timestamp: string;
  sender: string;
  text: string;
  type: 'chat' | 'system' | 'combat';
  hasMentionAlert?: boolean;
  isSuspicious?: boolean;
}

export interface AllianceRolePermissions {
  sidebarOpen?: boolean;
  canStartBossEvent: boolean;
  canSpendVaultFunds: boolean;
  canKickMembers: boolean;
  canAcceptMembers: boolean;
}

export interface AllianceOperationsConfig {
  allianceName: string;
  emblemBorderShieldColor: string; 
  activeMembersJoined: number;
  activeMembersLimit: number; 
  guildCoreLevel: number;
  techProgressPercent: number;
  roster: AllianceRosterMember[];
  comMessages: COMMessage[];
  donateCrystalCost: number; 
  donateProgressRateIncrement: number; 
  donatePowerBonusScore: number; 
  rolePermissions: {
    Comandante: AllianceRolePermissions;
    Oficial: AllianceRolePermissions;
    Piloto: AllianceRolePermissions;
  };
}

export interface ServerSettingsConfig {
  utcMasterResetHour: number; 
}

export interface GalaxyDustConfig {
  authTerminal: AuthTerminalConfig;
  hudEconomic: HudEconomicConfig;
  hangarLogistics: HangarLogisticsConfig;
  sideralExploration: SideralExplorationConfig;
  acquisitionShop: AcquisitionShopConfig;
  phantomStation: PhantomStationConfig;
  allianceOperations: AllianceOperationsConfig;
  serverSettings: ServerSettingsConfig;
}

// ==========================================
// CORE STRUCTS FOR SYSTEM COHESION
// ==========================================

export type ShipSize = 'Fighter' | 'Mighty' | 'Massive' | 'Commander' | 'Mini';

export type ShipRole = 'Attack' | 'Hybrid' | 'Transport' | 'Explorer' | 'Miner' | 'Defense' | 'Spy' | 'Racing' | 'Carrier';

export interface StructureCostLevel {
  level: number;
  metal: number;
  crystal: number;
  deuterium: number;
  energy: number;
  research_time_seconds: number;
}

export interface BadgeDebuff {
  stat: string;
  value: number; 
}

export interface TechPrerequisite {
  tech_id: string;
  level: number;
}

// ==========================================
// OUTCOME CONFIG CONTRACTS (Materializers, Packs, Bundles)
// ==========================================

export interface MaterializerOutcome {
  chance_pct: number;           // Probabilidad entera entre 1 y 100
  asset_multiplier: number;     // Cuántos assets se crean (0 = fallo, 1 = normal, 2 = doble)
  consume_resources: boolean;   // ¿Se cobran los materiales y GD al jugador?
  consume_blueprint: boolean;   // ¿Se gasta/quema el Blueprint de la mochila?
  reward_item_code: string | null; // ID de un ítem extra si se requiere
}

export interface MaterializerConfig {
  config_type: "materializer_matrix";
  outcomes: MaterializerOutcome[];
}

export interface DropItem {
  chance_pct: number;          // Probabilidad de obtención (soporta decimales ej: 0.5)
  item_code: string;           // Identificador del asset premiado
  item_category: "ships" | "structures" | "technologies" | "astrobots" | "tools" | "badges" | "general_effects";
  quantity_min: number;        // Cantidad mínima que puede salir
  quantity_max: number;        // Cantidad máxima que puede salir
}

export interface DropTableConfig {
  config_type: "weighted_drop_table";
  is_stackable: boolean;       // Control para agrupar el pack en un solo slot
  drops: DropItem[];
}

export interface ManifestItem {
  item_code: string;
  item_category: "ships" | "structures" | "technologies" | "astrobots" | "tools" | "badges" | "general_effects";
  quantity: number;
}

export interface FixedManifestConfig {
  config_type: "fixed_manifest";
  is_stackable: boolean;
  items: ManifestItem[];
}

export type OutcomeConfig = MaterializerConfig | DropTableConfig | FixedManifestConfig;
