export * from './businessStages';
export * from './poStages';
export * from './productionStages';
export * from './imprintOptions';
export * from './leadSources';

export const ROUTES = {
  // Public
  LANDING: '/',
  APPROVAL: '/approval/:token',
  CLIENT_APPROVAL: '/client-approval/:token',
  QUOTE_APPROVAL_LEGACY: '/quote-approval/:token',
  ACCEPT_INVITATION: '/accept-invitation',
  PO_CONFIRMATION: '/po-confirmation/:token',
  CUSTOMER_PORTAL: '/portal/:token',
  PUBLIC_PRESENTATION: '/presentation/:token',

  // Auth setup
  TWO_FACTOR_SETUP: '/2fa-setup',

  // Authenticated — core
  HOME: '/home',
  CRM: '/crm',
  CRM_CONTACT_DETAIL: '/crm/contacts/:id',
  CRM_COMPANY_DETAIL: '/crm/companies/:id',
  CRM_VENDOR_DETAIL: '/crm/vendors/:id',

  // Projects
  PROJECTS: '/projects',
  PROJECT_DETAIL: '/projects/:projectId',
  PROJECT_DETAIL_WILDCARD: '/projects/:projectId/*',

  // Legacy redirect targets
  ORDERS_LEGACY: '/orders',
  ORDER_DETAIL_LEGACY: '/orders/:id',

  // Production / reports
  PRODUCTION_REPORT: '/production-report',
  REPORTS: '/reports',
  TEAM_PERFORMANCE: '/team-performance',

  // Products
  PRODUCTS: '/products',
  PRODUCT_DETAIL: '/products/:id',
  MEDIA_LIBRARY: '/media-library',

  // Suppliers & vendors
  SUPPLIERS: '/suppliers',
  SS_ACTIVEWEAR: '/ss-activewear',
  VENDOR_APPROVALS: '/vendor-approvals',

  // Search
  SEARCH: '/search',

  // Tools
  ARTWORK: '/artwork',
  MOCKUP_BUILDER: '/mockup-builder',
  AI_PRESENTATION_BUILDER: '/ai-presentation-builder',
  SEQUENCE_BUILDER: '/sequence-builder',
  NEWSLETTER: '/newsletter',
  KNOWLEDGE_BASE: '/knowledge-base',

  // Settings & account
  SETTINGS: '/settings',
  SETTINGS_USERS: '/settings/users',
  PROFILE: '/profile',
  NOTIFICATIONS: '/notifications',
  ERRORS: '/errors',
} as const;

export type RouteKey = keyof typeof ROUTES;
