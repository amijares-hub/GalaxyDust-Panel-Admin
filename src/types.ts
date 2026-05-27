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
  field: 'user.level' | 'user.gold' | 'user.gems' | 'user.registration_days' | 'user.xp' | 'inventory.item_count';
  operator: 'greater_than' | 'less_than' | 'equals' | 'not_equals' | 'contains';
  value: string | number;
}

export interface GameAction {
  type: 'grant_item' | 'add_gold' | 'add_gems' | 'multiply_xp' | 'send_custom_notification' | 'suspend_account';
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
  gold: number;
  gems: number;
  xp: number;
  role: 'user' | 'moderator' | 'admin' | 'vip';
  status: 'active' | 'banned' | 'pending';
  avatarUrl: string;
  created_at: string;
  last_active: string;
  inventory: InventoryItem[];
  auditLogs?: AuditLogEntry[];
  
  // 12 CAN specialized resources
  metal?: number;
  deuterium?: number;
  dark_matter?: number;
  organium?: number;
  mana?: number;
  xenoplasm?: number;
  omniplate?: number;
  lunar_fiber?: number;
  infinite_core?: number;
  
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

export type MainFunction = 'branding' | 'rules' | 'crm' | 'game_hud' | 'can' | 'ships' | 'matrix' | 'expediciones' | 'expediciones_vuelo' | 'market' | 'phantom_station';

export type SubFunctionType = 
  | 'branding_global' | 'branding_landing' | 'branding_auth' | 'branding_lobby' | 'branding_hud'
  | 'rules_list' | 'rules_builder' | 'rules_testing'
  | 'crm_users' | 'crm_analytics' | 'crm_banned'
  | 'hud_auth' | 'hud_master' | 'hud_hangar' | 'hud_sideral' | 'hud_shop' | 'hud_phantom' | 'hud_alliance'
  | 'can_commander' | 'can_global' | 'can_alliances'
  | 'ships_atelier' | 'ships_hangar'
  | 'matrix_overview'
  | 'expediciones_dashboard' | 'expediciones_creator' | 'expediciones_rewards' | 'expediciones_events'
  | 'vuelo_telemetria' | 'vuelo_estados' | 'vuelo_rng' | 'vuelo_skills' | 'vuelo_seguridad'
  | 'market_items' | 'market_auctions' | 'market_rules' | 'market_audit' | 'market_inbox'
  | 'phantom_store' | 'phantom_refresh' | 'phantom_cleansing' | 'phantom_events' | 'phantom_audit';

export interface NavigationState {
  activeMain: MainFunction;
  activeSub: SubFunctionType;
}

// ==========================================
// NEW: GALAXYDUST GAME CLIENT CONFIG TYPE
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
    alert: string; // Safety alert text
    authCorrect: string; // Correct Auth
    connEstablished: string; // Conn OK
    activeColor: 'red' | 'emerald' | 'cyan'; // Dynamic active color bar
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
    provider: string; // canal de entrada
    authorizeDate: string;
    mfaEnabled: boolean;
    assignedToken: string;
  };
  inputs: {
    emailPlaceholder: string;
    passwordPlaceholder: string;
    resetEmailPlaceholder: string;
    verificationDigits: number; // 6
    otpDigits: number; // 6
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
    rankLabel: string; // VIP 7
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
    gdCoin: number;
    quantumCredit: number;
    phantomCoin: number;
    halloweenCoin: number;
    xmasCoin: number;
    valentineCoin: number;
  };
  vaultResources: {
    metal: number;
    cristal: number;
    deuterio: number;
    materiaOscura: number;
    omniplate: number;
    orichaltron: number;
    lunarFiber: number;
    infiniteCore: number;
    primalToken: number;
    xenoplasm: number;
    organium: number;
    mana: number;
  };
  streamTextOnClick: string; // default e.g. "+15K METAL"
  buyCrystalsReward: number; // default +1000
}

export interface HangarAsset {
  id: string;
  name: string;
  category: 'Spaceships' | 'Structures' | 'Technology' | 'Badges';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  level: number;
  stars: number; // 1 to 7
  blueprintProgressPercent: number;
  blueprintsOwned: number;
  blueprintsRequired: number;
  hasNotification: boolean;
  avatarUrl: string;
  lore: string;
  // Attributes
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
  powerBonus: number; // e.g. +POW EXP
  levelRequired: number;
  isUnlocked: boolean;
}

export interface SideralExplorationConfig {
  propulsionSpheres: string[]; // e.g. ["Combustión", "Impulso", "Hiperespacio", "Phantom Series", "Exclusivas", "Xmas"]
  starClusters: StarCluster[];
  deployCarouselShips: SideralShip[];
  contratarLicenciaCostCrystals: number;
  quantumScanTimerSeconds: number; // 2 seconds
  quantumRewardCrystals: number; // +250
  completedPlanets: Array<{ name: string; concentration: number }>; // e.g. ["Zeta-Reticuli IV", "Astraea-B9"]
  anomaliesPlanets: string[]; // ["Pandora Prime", "Erebus Nova"]
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
  extraValuePercent: number; // e.g. 800
  rarityColorClass: string; // border coloring
  expirationHoursLeft: number; // countdown
  stockLimitMax: number;
  stockRemaining: number;
  gemsRewardBonus: number;
  priceGdCoins: number;
  subItems: ShopBundleItem[];
}

export interface AcquisitionShopConfig {
  categories: string[]; // e.g. ["Gift of Heartwarming [HOT]", "Recommended Immortals [NEW]", etc.]
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
  discountPercent: number; // e.g. 10 or 20
  timeReductionSeconds: number;
}

export interface PhantomStationConfig {
  phantomCrystalsBalance: number;
  recentTelemetryLogs: string[];
  autoRefreshStockTimerSeconds: number;
  refreshAttemptsUsed: number;
  refreshAttemptsMax: number; // e.g. 90
  autoRefreshEnabled: boolean;
  refreshCostVoidCrystals: number;
  unitsCatalog: QuantumUnitShard[];
  suppliesCatalog: QuantumSupplyItem[];
  // Extended fields for admin station panel
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
  canStartBossEvent: boolean;
  canSpendVaultFunds: boolean;
  canKickMembers: boolean;
  canAcceptMembers: boolean;
}

export interface AllianceOperationsConfig {
  allianceName: string;
  emblemBorderShieldColor: string; // border code
  activeMembersJoined: number;
  activeMembersLimit: number; // 50
  guildCoreLevel: number;
  techProgressPercent: number;
  roster: AllianceRosterMember[];
  comMessages: COMMessage[];
  donateCrystalCost: number; // 50
  donateProgressRateIncrement: number; // 15
  donatePowerBonusScore: number; // 5000
  rolePermissions: {
    Comandante: AllianceRolePermissions;
    Oficial: AllianceRolePermissions;
    Piloto: AllianceRolePermissions;
  };
}

export interface ServerSettingsConfig {
  utcMasterResetHour: number; // 0-23 UTC
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
// NEW SYSTEM FIELDS FOR SASORILABS
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
  value: number; // usually negative
}

export interface TechPrerequisite {
  tech_id: string;
  level: number;
}
