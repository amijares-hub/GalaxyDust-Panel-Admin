import { BrandConfig, WebComponent, GameRule, UserProfile, GalaxyDustConfig } from './types';

export const DEFAULT_BRAND: BrandConfig = {
  siteName: 'Sasori Arena',
  logoUrl: 'https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?q=80&w=128&auto=format&fit=crop', // A beautiful abstract gaming red portal
  primaryColor: '#EF4444', // Red-500
  accentColor: '#B91C1C', // Red-700
  typography: 'Space Grotesk',
  borderRadius: 'md',
  isDark: true,
  announcementText: '🔥 ¡Temporada 4 Activa! Torneo Clasificatorio de Sasorilabs este de fin de semana.',
  footerText: '© 2026 Sasorilabs.io. Todos los derechos reservados. Construido con tecnología de punta.'
};

export const DEFAULT_COMPONENTS: WebComponent[] = [
  // Landing Page Components
  {
    id: 'landing_header',
    name: 'Top Navigation Bar (Cabecera Global)',
    type: 'header',
    description: 'Menú principal de la plataforma. Controla el logotipo, enlaces clave, anuncios y llamadas a la acción primarias.',
    tab: 'landing',
    status: 'active',
    tooltipInfo: 'Este componente se renderiza al principio de todas las páginas de marketing. Puedes editar textos de enlaces y visibilidad de redes.',
    properties: {
      title: 'Sasori Arena',
      subtitle: 'Inicio / Torneos / Clasificación / Blog',
      ctaText: 'Acceder a la Arena',
      showSocialLinks: true,
      backgroundColor: '#09090b',
      textColor: '#ffffff',
      buttonColor: '#EF4444',
      spacing: 'cozy'
    }
  },
  {
    id: 'landing_hero',
    name: 'Hero Section (Sección Principal)',
    type: 'hero',
    description: 'La sección de impacto visual primaria al ingresar al sitio. Ideal para promocionar el juego o eventos especiales.',
    tab: 'landing',
    status: 'active',
    tooltipInfo: 'Zona de mayor conversión de usuarios interesados. Cambia el título grande, el fondo de impacto y la llamada a la acción principal.',
    properties: {
      title: 'LA NUEVA ERA DE LOS E-SPORTS DESCENTRALIZADOS',
      subtitle: 'Compite en torneos de juego rápido patrocinados por Sasorilabs. Reclama coleccionables únicos y escala en la clasificación oficial.',
      ctaText: 'Jugar Ahora Gratis',
      imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop',
      backgroundColor: '#121214',
      textColor: '#ffffff',
      buttonColor: '#EF4444',
      spacing: 'spacious'
    }
  },
  {
    id: 'landing_features',
    name: 'Features Grid (Cuadrícula de Características)',
    type: 'feature_grid',
    description: 'Muestra las mecánicas destacadas y recompensas de Sasorilabs Arena en tarjetas interactivas.',
    tab: 'landing',
    status: 'active',
    tooltipInfo: 'Ideal para explicar por qué tu juego es innovador. Se estructura en columnas dinámicas.',
    properties: {
      title: '¿Por qué elegir Sasori Arena?',
      subtitle: 'Mecánicas refinadas, transacciones instantáneas y antifraude impulsado por contratos de alta fidelidad.',
      cardCount: 3,
      backgroundColor: '#18181b',
      textColor: '#e4e4e7',
      spacing: 'cozy'
    }
  },
  // Auth Tab Components
  {
    id: 'auth_login_card',
    name: 'User Login & Auth Container (Acceso)',
    type: 'login_box',
    description: 'Formulario seguro para autenticar usuarios con métodos interactivos (Email, Supabase Auth o firmas Web3).',
    tab: 'auth',
    status: 'active',
    tooltipInfo: 'Configura la experiencia de login nativa. Puedes cambiar placeholders y forzar verificación de doble factor.',
    properties: {
      title: 'Inicia Sesión en Sasori Arena',
      subtitle: 'Ingresa tus credenciales para reclamar tus recompensas diarias.',
      ctaText: 'Ingresar a la Cuenta',
      backgroundColor: '#18181b',
      textColor: '#ffffff',
      buttonColor: '#EF4444',
      spacing: 'compact'
    }
  },
  // Game Lobby Tab Components
  {
    id: 'lobby_stats',
    name: 'Real-time Analytics Banner (Estadísticas del Servidor)',
    type: 'stats_banner',
    description: 'Muestra las estadísticas dinámicas en tiempo real del juego (Usuarios en línea, volumen de premios, latencia).',
    tab: 'game_lobby',
    status: 'active',
    tooltipInfo: 'Muestra números reales para incentivar confianza en el ecosistema. Se conecta con las métricas acumuladas de la base de datos.',
    properties: {
      title: 'Servidores Activos Sasori-X',
      subtitle: 'En línea: 14,842 jugadores | Fondo acumulado: 45,280 GEMS | Ping: 12ms',
      backgroundColor: '#09090b',
      textColor: '#22c55e', // Green indicators
      spacing: 'compact'
    }
  },
  {
    id: 'lobby_game_modes',
    name: 'Arena Games Selector (Selector de Salas)',
    type: 'game_lobby',
    description: 'Muestra las diferentes salas y modalidades de competencia disponibles para los jugadores.',
    tab: 'game_lobby',
    status: 'active',
    tooltipInfo: 'Módulos interactivos que enlazan al juego directo. Administra las alertas del selector y colores de dificultad.',
    properties: {
      title: 'Modos de Competencia Disponibles',
      subtitle: 'Sala Bronce (Normal) • Sala Escarlata (VIP) • Campo de Práctica (Demo)',
      buttonColor: '#EF4444',
      backgroundColor: '#18181b',
      textColor: '#ffffff',
      spacing: 'cozy'
    }
  },
  // Footer Component
  {
    id: 'global_footer',
    name: 'Global Footer Block (Pie de Página)',
    type: 'footer',
    description: 'El elemento final de todas las páginas que contiene políticas, links técnicos e información de derechos.',
    tab: 'landing',
    status: 'active',
    tooltipInfo: 'Introduce el aviso de copyright, enlaces legales y créditos corporativos de Sasorilabs.io.',
    properties: {
      title: 'Sasori Arena - Un Proyecto de Sasorilabs.io',
      subtitle: 'Privacidad | Términos de Servicio | Soporte Técnico | API de Integración',
      showSocialLinks: true,
      backgroundColor: '#09090b',
      textColor: '#71717a',
      spacing: 'cozy'
    }
  }
];

export const DEFAULT_RULES: GameRule[] = [
  {
    id: 'rule_welcome_pack',
    name: 'Paquete de Bienvenida (Nuevos Usuarios)',
    description: 'Asigna monedas y gemas automáticas a usuarios recién registrados con nivel inicial para mejorar retención.',
    trigger: 'on_login',
    conditions: [
      {
        id: 'cond_w_1',
        field: 'user.level',
        operator: 'equals',
        value: 1
      },
      {
        id: 'cond_w_2',
        field: 'user.registration_days',
        operator: 'less_than',
        value: 2
      }
    ],
    action: {
      type: 'add_gd_coins',
      params: {
        amount: 500,
        message: '¡Bienvenido a Sasori Arena! Te otorgamos 500 Gold iniciales.'
      }
    },
    isActive: true,
    tooltip: 'Esta regla se dispara en el login si el usuario es nivel 1 y acaba de registrarse.',
    created_at: '2026-05-20T10:00:00Z'
  },
  {
    id: 'rule_vip_multiplier',
    name: 'Multiplicador de Experiencia Escarlata (VIP)',
    description: 'Duplica los puntos de experiencia que reciben los usuarios de rol VIP en combates ganados.',
    trigger: 'on_quest_complete',
    conditions: [
      {
        id: 'cond_v_1',
        field: 'user.level',
        operator: 'greater_than',
        value: 10
      }
    ],
    action: {
      type: 'multiply_xp',
      params: {
        multiplier: 2,
        message: '¡Bonificación Escarlata VIP Activa! XP duplicada.'
      }
    },
    isActive: true,
    tooltip: 'Regla especial para motivar la retención en usuarios de nivel superior a 10.',
    created_at: '2026-05-21T12:30:00Z'
  },
  {
    id: 'rule_cheater_ban',
    name: 'Autoban de Seguridad por Anomalías',
    description: 'Suspende inmediatamente la cuenta si se detecta posesión de gemas exorbitantes no transaccionales.',
    trigger: 'on_transaction',
    conditions: [
      {
        id: 'cond_c_1',
        field: 'user.phantom_coins',
        operator: 'greater_than',
        value: 99999
      }
    ],
    action: {
      type: 'suspend_account',
      params: {
        durationDays: 365,
        message: 'Cuenta suspendida temporalmente por auditoría presupuestal debido a excedente de gemas.'
      }
    },
    isActive: false,
    tooltip: 'Regla crítica de seguridad del servidor para prevenir exploits de inyección de recursos.',
    created_at: '2026-05-22T04:15:00Z'
  }
];

export const DEFAULT_USERS: UserProfile[] = [
  {
    id: 'user_sasori_01',
    username: 'SasoriAlpha',
    email: 'alpha@sasorilabs.io',
    level: 42,
    can_level: 42,
    gd_coins: 24500,
    phantom_coins: 350,
    metal: 0, crystal: 0, deuterium: 0, dark_matter: 0, omniplate: 0, orichaltron: 0, lunar_fiber: 0, infinity_core: 0, primal_token: 0, xenoplasm: 0, organium: 0, mana: 0,
    xp: 8900,
    role: 'admin',
    status: 'active',
    avatarUrl: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=128&auto=format&fit=crop',
    created_at: '2026-01-15T08:00:00Z',
    last_active: '2026-05-22T08:30:00Z',
    inventory: [
      { id: 'inv_1', name: 'Espada de Plasma Escarlata', rarity: 'legendary', type: 'weapon', quantity: 1 },
      { id: 'inv_2', name: 'Escudo Reflector Híbrido', rarity: 'epic', type: 'armor', quantity: 1 },
      { id: 'inv_3', name: 'Poción de Hiper-Carga', rarity: 'common', type: 'consumable', quantity: 15 }
    ],
    auditLogs: [
      { id: 'sas_aud_1', timestamp: '2026-05-22T08:15:00Z', action: 'Inyección de Objeto', details: 'Añadido: "Espada de Plasma Escarlata" (Cantidad: 1)', type: 'inventory' },
      { id: 'sas_aud_2', timestamp: '2026-05-22T08:00:00Z', action: 'Actualización de Rol', details: 'Rol cambiado de "vip" a "admin"', type: 'status' },
      { id: 'sas_aud_3', timestamp: '2026-05-21T15:30:00Z', action: 'Sincronización de Balance', details: 'Balance de Oro ajustado a 24,500 (+2,000)', type: 'balance' }
    ]
  },
  {
    id: 'user_sasori_02',
    username: 'ViperByte',
    email: 'cyber_viper@test.com',
    level: 18,
    can_level: 18,
    gd_coins: 5800,
    phantom_coins: 120,
    metal: 0, crystal: 0, deuterium: 0, dark_matter: 0, omniplate: 0, orichaltron: 0, lunar_fiber: 0, infinity_core: 0, primal_token: 0, xenoplasm: 0, organium: 0, mana: 0,
    xp: 2150,
    role: 'vip',
    status: 'active',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=128&auto=format&fit=crop',
    created_at: '2026-03-02T14:22:00Z',
    last_active: '2026-05-22T07:11:00Z',
    inventory: [
      { id: 'inv_4', name: 'Capa Sombra Cuántica', rarity: 'epic', type: 'armor', quantity: 1 },
      { id: 'inv_5', name: 'Daga Célula Sónica', rarity: 'rare', type: 'weapon', quantity: 2 },
      { id: 'inv_3', name: 'Poción de Hiper-Carga', rarity: 'common', type: 'consumable', quantity: 4 }
    ],
    auditLogs: [
      { id: 'vip_aud_1', timestamp: '2026-05-22T06:45:00Z', action: 'Inyección de Objeto', details: 'Añadido: "Capa Sombra Cuántica" (Cantidad: 1)', type: 'inventory' },
      { id: 'vip_aud_2', timestamp: '2026-05-22T05:10:00Z', action: 'Actualización de Nivel', details: 'Jugador ascendido de nivel 17 a 18', type: 'balance' }
    ]
  },
  {
    id: 'user_sasori_03',
    username: 'GhostGlitch',
    email: 'glitchy_ghost@domain.com',
    level: 5,
    can_level: 5,
    gd_coins: 920,
    phantom_coins: 10,
    metal: 0, crystal: 0, deuterium: 0, dark_matter: 0, omniplate: 0, orichaltron: 0, lunar_fiber: 0, infinity_core: 0, primal_token: 0, xenoplasm: 0, organium: 0, mana: 0,
    xp: 450,
    role: 'user',
    status: 'pending',
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=128&auto=format&fit=crop',
    created_at: '2026-05-21T21:44:00Z',
    last_active: '2026-05-22T01:05:00Z',
    inventory: [
      { id: 'inv_6', name: 'Rifle Laser Oxidado', rarity: 'common', type: 'weapon', quantity: 1 },
      { id: 'inv_7', name: 'Medalla del Iniciado', rarity: 'rare', type: 'badge', quantity: 1 }
    ],
    auditLogs: [
      { id: 'ghs_aud_1', timestamp: '2026-05-22T01:02:00Z', action: 'Verificación de Acceso', details: 'Estatus cambiado a Pendiente por proceso de validación', type: 'status' }
    ]
  },
  {
    id: 'user_sasori_04',
    username: 'HackerLlama',
    email: 'exploit_lord@github.com',
    level: 99,
    can_level: 99,
    gd_coins: 999999,
    phantom_coins: 999999,
    metal: 0, crystal: 0, deuterium: 0, dark_matter: 0, omniplate: 0, orichaltron: 0, lunar_fiber: 0, infinity_core: 0, primal_token: 0, xenoplasm: 0, organium: 0, mana: 0,
    xp: 999999,
    role: 'user',
    status: 'banned',
    avatarUrl: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=128&auto=format&fit=crop',
    created_at: '2026-02-10T11:05:00Z',
    last_active: '2026-05-18T16:40:00Z',
    inventory: [
      { id: 'inv_1', name: 'Espada de Plasma Escarlata', rarity: 'legendary', type: 'weapon', quantity: 99 }
    ],
    auditLogs: [
      { id: 'chk_aud_1', timestamp: '2026-05-22T03:00:00Z', action: 'Sanción de Cuenta', details: 'Estatus cambiado a "banned". Causa: Excedente sospechoso de Gemas', type: 'status' },
      { id: 'chk_aud_2', timestamp: '2026-05-21T23:55:00Z', action: 'Alerta del Sistema', details: 'Inyección inusual detectada: 999,999 gemas', type: 'system' }
    ]
  },
  {
    id: 'user_sasori_05',
    username: 'CyberKitsune',
    email: 'neon_fox@sasorilabs.io',
    level: 27,
    can_level: 27,
    gd_coins: 14200,
    phantom_coins: 680,
    metal: 0, crystal: 0, deuterium: 0, dark_matter: 0, omniplate: 0, orichaltron: 0, lunar_fiber: 0, infinity_core: 0, primal_token: 0, xenoplasm: 0, organium: 0, mana: 0,
    xp: 4100,
    role: 'moderator',
    status: 'active',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=128&auto=format&fit=crop',
    created_at: '2026-02-28T09:15:00Z',
    last_active: '2026-05-22T08:12:00Z',
    inventory: [
      { id: 'inv_8', name: 'Arco de Pulso de Iones', rarity: 'epic', type: 'weapon', quantity: 1 },
      { id: 'inv_9', name: 'Insignia de Pacificador', rarity: 'legendary', type: 'badge', quantity: 1 },
      { id: 'inv_3', name: 'Poción de Hiper-Carga', rarity: 'common', type: 'consumable', quantity: 8 }
    ],
    auditLogs: [
      { id: 'kit_aud_1', timestamp: '2026-05-22T08:05:00Z', action: 'Sincronización de Balance', details: 'Balance de Oro ajustado a 14,200', type: 'balance' },
      { id: 'kit_aud_2', timestamp: '2026-05-22T07:50:00Z', action: 'Inyección de Objeto', details: 'Añadido: "Insignia de Pacificador" (Cantidad: 1)', type: 'inventory' }
    ]
  }
];

export const DEFAULT_GALAXY_DUST_HUD: GalaxyDustConfig = {
  authTerminal: {
    headers: {
      portal: 'PORTAL DE ACCESO',
      login: 'INICIAR SESIÓN',
      register: 'REGISTRO DE CUENTA',
      recovery: 'RECUPERACIÓN DE FIRMA',
      confirmEmail: 'CONFIRMAR CORREO ELECTRÓNICO',
      mfaFactor: 'DOBLE FACTOR DE SEGURIDAD',
      rejectSign: 'FIRMA RECHAZADA',
      authorized: 'CONEXIÓN AUTORIZADA'
    },
    toasts: {
      alert: 'ALERTA DE SEGURIDAD',
      authCorrect: 'AUTORIZACIÓN CORRECTA',
      connEstablished: 'CONEXIÓN ESTABLECIDA',
      activeColor: 'red'
    },
    passwordStrength: {
      noKey: 'SIN CLAVE DE FIRMA',
      weak: 'DÉBIL • CRIPTOGRAFÍA EXPUESTA',
      average: 'MEDIO • SEGURIDAD ESTÁNDAR',
      strong: 'FUERTE • SEGURIDAD COMPLETA',
      military: 'SÚPER SECURE • MILITAR-GRADE OK'
    },
    passportWeb3: {
      username: 'CyberKitsune_7',
      email: 'neon_fox@sasorilabs.io',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=128&auto=format&fit=crop',
      provider: 'Metamask',
      authorizeDate: '2026-05-22 08:35 UTC',
      mfaEnabled: true,
      assignedToken: 'assignedToken_0x1121d5951a8facbc0ff64bda6f70de29'
    },
    inputs: {
      emailPlaceholder: 'correo@sasorilabs.io',
      passwordPlaceholder: 'Clave de acceso cifrada',
      resetEmailPlaceholder: 'correo-recuperacion@corp.io',
      verificationDigits: 6,
      otpDigits: 6,
      rememberMeDefault: true
    },
    buttons: {
      loginCta: 'Acceder al Sistema',
      registerCta: 'Registrar Nueva Firma',
      requestCta: 'Solicitar Enlace de Firma',
      confirmPinCta: 'Confirmar Código',
      mfaCta: 'Autorizar Acceso 2FA'
    },
    socialProviders: {
      googleEnabled: true,
      githubEnabled: true,
      facebookEnabled: true
    },
    links: {
      forgotPasswordLabel: '¿Olvidaste Contraseña?',
      requestReminderLabel: 'Solicitar Recordatorio',
      backToLoginLabel: 'Volver al Login',
      clearFormLabel: 'Limpiar',
      disconnectLabel: 'Desconectar Firma'
    }
  },
  hudEconomic: {
    pilot: {
      level: 27,
      rankLabel: 'VIP 7',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=128&auto=format&fit=crop'
    },
    combat: {
      powerScore: 12450,
      apCurrent: 145,
      apMax: 190
    },
    buffs: {
      attackActive: true,
      defenseActive: false,
      speedActive: true
    },
    currencies: {
      gd_coins: 250000,
      quantum_credits: 1240,
      phantom_coins: 350,
      halloween_coins: 15,
      xmas_coins: 5,
      valentine_coins: 220
    },
    vaultResources: {
      metal: 15400,
      crystal: 8900,
      deuterium: 3200,
      dark_matter: 140,
      omniplate: 850,
      orichaltron: 240,
      lunar_fiber: 410,
      infinity_core: 5,
      primal_token: 12,
      xenoplasm: 82,
      organium: 700,
      mana: 1200
    },
    streamTextOnClick: '+15K METAL',
    buyCrystalsReward: 1000
  },
  hangarLogistics: {
    metricCompanionsTotal: 34,
    metricGalacticPowerScore: 88500,
    searchQueryPlaceholder: 'Buscar naves, propulsores o módulos...',
    flotasEnVueloActive: false,
    lightspeedPackPriceCrystals: 299,
    assets: [
      {
        id: 'asset_01',
        name: 'Vanguard Avenger-X',
        category: 'Spaceships',
        rarity: 'legendary',
        level: 24,
        stars: 6,
        blueprintProgressPercent: 80,
        blueprintsOwned: 8,
        blueprintsRequired: 10,
        hasNotification: true,
        avatarUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=128&auto=format&fit=crop',
        lore: 'Interceptora estelar insignia pesada de la clase escarlata. Construída en los astilleros flotantes de Sasorilabs para neutralizar corsarios en el sector C-40.',
        hp: 3450,
        shield: 1920,
        vel: 850,
        absorption: 34,
        damageType: 'Plasma Térmico de Alta Frecuencia',
        faction: 'NOVA'
      },
      {
        id: 'asset_02',
        name: 'Refugio de Escudo Orbital',
        category: 'Structures',
        rarity: 'epic',
        level: 18,
        stars: 5,
        blueprintProgressPercent: 60,
        blueprintsOwned: 6,
        blueprintsRequired: 10,
        hasNotification: false,
        avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=128&auto=format&fit=crop',
        lore: 'Generador magnético modular para soportar bombardeos de fragmentación orbital.',
        hp: 8500,
        shield: 9900,
        vel: 0,
        absorption: 65,
        damageType: 'Dispersión de Partículas Neutras',
        faction: 'OSIRIS'
      },
      {
        id: 'asset_03',
        name: 'Propulsión Impulse Mk-V',
        category: 'Technology',
        rarity: 'rare',
        level: 15,
        stars: 4,
        blueprintProgressPercent: 100,
        blueprintsOwned: 5,
        blueprintsRequired: 5,
        hasNotification: true,
        avatarUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=128&auto=format&fit=crop',
        lore: 'Núcleo de reacción magnética termojet que incrementa los picos de aceleración instantánea en hiperespacio en +15%.',
        hp: 1200,
        shield: 400,
        vel: 1200,
        absorption: 12,
        damageType: 'Cinética Termonuclear',
        faction: 'GD I'
      }
    ]
  },
  sideralExploration: {
    propulsionSpheres: ['Combustión', 'Impulso', 'Hiperespacio', 'Phantom Series', 'Exclusivas', 'Especial Xmas'],
    starClusters: [
      { id: 'c_01', name: 'NUBE SEC-A1', durationSeconds: 15, multiplier: 1.0 },
      { id: 'c_02', name: 'CINTURÓN REE-B4', durationSeconds: 30, multiplier: 1.5 },
      { id: 'c_03', name: 'SISTEMA ASTRAL-X', durationSeconds: 60, multiplier: 2.2 },
      { id: 'c_04', name: 'FRACTURA OMEGA', durationSeconds: 120, multiplier: 3.5 },
      { id: 'c_05', name: 'PERIFERIA ABISAL', durationSeconds: 300, multiplier: 6.8 }
    ],
    deployCarouselShips: [
      { id: 'ds_01', name: 'Apolo de Combustión', rarity: 'rare', powerBonus: 350, levelRequired: 1, isUnlocked: true },
      { id: 'ds_02', name: 'Némesis de Impulso', rarity: 'epic', powerBonus: 820, levelRequired: 5, isUnlocked: true },
      { id: 'ds_03', name: 'Artemisa Hiperespacio', rarity: 'legendary', powerBonus: 1500, levelRequired: 15, isUnlocked: true },
      { id: 'ds_04', name: 'Titán Phantom Series', rarity: 'legendary', powerBonus: 2400, levelRequired: 25, isUnlocked: false }
    ],
    contratarLicenciaCostCrystals: 500,
    quantumScanTimerSeconds: 2,
    quantumRewardCrystals: 250,
    completedPlanets: [
      { name: 'Zeta-Reticuli IV', concentration: 85 },
      { name: 'Astraea-B9', concentration: 60 },
      { name: 'Chrono-Metis', concentration: 72 }
    ],
    anomaliesPlanets: ['Pandora Prime', 'Erebus Nova']
  },
  acquisitionShop: {
    categories: [
      'Gift of Heartwarming [HOT]',
      'Recommended Immortals [NEW]',
      'Dragon Knight',
      'Special Bundles',
      'Limited to One Purchase',
      'Cultivate Immortals'
    ],
    bundles: [
      {
        id: 'bundle_01',
        title: 'Cofre del Inframundo',
        category: 'Dragon Knight',
        extraValuePercent: 800,
        rarityColorClass: 'border-red-600',
        expirationHoursLeft: 12,
        stockLimitMax: 5,
        stockRemaining: 3,
        gemsRewardBonus: 3500,
        priceGdCoins: 125000,
        subItems: [
          { name: 'Gema Escarlata Pura', quantity: 3500, iconType: 'currency', technicalLabel: 'Gema de Sincronización Directa de Ecosistema' },
          { name: 'Llave del Vacío Cuántico', quantity: 3, iconType: 'material', technicalLabel: 'Abre portales en la Estación Fantasma' },
          { name: 'Blueprint de Interceptora', quantity: 15, iconType: 'box', technicalLabel: 'Plano de ensamble avanzado clasificado' }
        ]
      },
      {
        id: 'bundle_02',
        title: 'Suministros del Iniciado',
        category: 'Gift of Heartwarming [HOT]',
        extraValuePercent: 791,
        rarityColorClass: 'border-cyan-500',
        expirationHoursLeft: 48,
        stockLimitMax: 1,
        stockRemaining: 1,
        gemsRewardBonus: 850,
        priceGdCoins: 45000,
        subItems: [
          { name: 'Gema Escarlata Ligera', quantity: 850, iconType: 'currency', technicalLabel: 'Reclamado directo del astillero' },
          { name: 'Propulsor de Iones', quantity: 1, iconType: 'weapon', technicalLabel: 'Componente tecnológico de velocidad' }
        ]
      }
    ]
  },
  phantomStation: {
    phantomCrystalsBalance: 14500,
    recentTelemetryLogs: [
      'Misión de exploración a NUBE SEC-A1 finalizada +1.2K Créditos',
      'Handshake Web3 validado: Clave criptográfica guardada con éxito',
      'Transacción del vacío completada: Adquirida esquirla de Shard_E7',
      'Servidor de operaciones calibrando telemetría sideral...'
    ],
    autoRefreshStockTimerSeconds: 680,
    refreshAttemptsUsed: 53,
    refreshAttemptsMax: 90,
    autoRefreshEnabled: true,
    refreshCostVoidCrystals: 10,
    unitsCatalog: [
      { id: 'u_01', name: 'Valquiria Escarlata', avatarUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=128&auto=format&fit=crop', rank: 'S', elementType: 'Fire', voidCrystalCost: 150, attackPower: 860, fireDefense: 450 },
      { id: 'u_02', name: 'Sombra del Impulsor', avatarUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=128&auto=format&fit=crop', rank: 'A', elementType: 'Void', voidCrystalCost: 80, attackPower: 540, fireDefense: 320 },
      { id: 'u_03', name: 'Acorazado Metis', avatarUrl: 'https://images.unsplash.com/photo-1553481187-be93c21490a9?q=80&w=128&auto=format&fit=crop', rank: 'C', elementType: 'Ice', voidCrystalCost: 40, attackPower: 310, fireDefense: 680 },
      { id: 'u_04', name: 'Satélite Espía C-4', avatarUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=128&auto=format&fit=crop', rank: 'E', elementType: 'Dark', voidCrystalCost: 15, attackPower: 110, fireDefense: 90 }
    ],
    suppliesCatalog: [
      { id: 'sup_01', name: 'Acelerador de Astilleros T1', discountPercent: 10, timeReductionSeconds: 1800 },
      { id: 'sup_02', name: 'Cargamento de Uranio Enriquecido', discountPercent: 20, timeReductionSeconds: 3600 },
      { id: 'sup_03', name: 'Bloque Estructural de Titanio', discountPercent: 0, timeReductionSeconds: 7200 },
      { id: 'sup_04', name: 'Núcleo Térmico de Fusión Flotante', discountPercent: 15, timeReductionSeconds: 14400 }
    ]
  },
  allianceOperations: {
    allianceName: 'Vanguardia Galáctica',
    emblemBorderShieldColor: 'indigo',
    activeMembersJoined: 34,
    activeMembersLimit: 50,
    guildCoreLevel: 4,
    techProgressPercent: 68,
    roster: [
      { id: 'm_01', name: 'SasoriAlpha', level: 42, tacticalPower: 124500, role: 'Comandante', avatarUrl: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=128&auto=format&fit=crop', isOnline: true },
      { id: 'm_02', name: 'ViperByte', level: 18, tacticalPower: 45200, role: 'Oficial', avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=128&auto=format&fit=crop', isOnline: true },
      { id: 'm_03', name: 'CyberKitsune', level: 27, tacticalPower: 88500, role: 'Oficial', avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=128&auto=format&fit=crop', isOnline: false },
      { id: 'm_04', name: 'GhostGlitch', level: 5, tacticalPower: 7900, role: 'Piloto', avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=128&auto=format&fit=crop', isOnline: true }
    ],
    comMessages: [
      { id: 'msg_01', timestamp: '08:42', sender: 'SasoriAlpha', text: '!Alerta! Prepárense para la incursión de hoy en el sector de la periferia.', type: 'chat' },
      { id: 'msg_02', timestamp: '08:45', sender: 'SYSTEM', text: 'El núcleo de Alianza subió formalmente a Nivel 4 tras donaciones activas.', type: 'system' },
      { id: 'msg_03', timestamp: '08:50', sender: 'combat', text: 'SasoriAlpha venció en combate PvP de zona a Pirata_Nebula [+1.4K COP]', type: 'combat' }
    ],
    donateCrystalCost: 50,
    donateProgressRateIncrement: 15,
    donatePowerBonusScore: 5000,
    rolePermissions: {
      Comandante: { canStartBossEvent: true, canSpendVaultFunds: true, canKickMembers: true, canAcceptMembers: true },
      Oficial: { canStartBossEvent: true, canSpendVaultFunds: false, canKickMembers: true, canAcceptMembers: true },
      Piloto: { canStartBossEvent: false, canSpendVaultFunds: false, canKickMembers: false, canAcceptMembers: false }
    }
  },
  serverSettings: {
    utcMasterResetHour: 0
  }
};
