import { createBrowserRouter, Navigate, useParams } from "react-router-dom";
import { lazy } from "react";
import { ROUTES } from "@/constants";
import AuthenticatedLayout from "@/layouts/AuthenticatedLayout";
import ProtectedRoute from "./ProtectedRoute";
import RootRoute from "./RootRoute";
import { withSuspense } from "./withSuspense";

/**
 * Named importers let us both `lazy()` the component AND expose the raw
 * import fn for prefetching (on sidebar hover, idle, etc). Keep one entry
 * per route — `lazy()` dedupes the dynamic import across invocations, so the
 * same underlying chunk promise is returned whether the user hovered first
 * or clicked cold.
 */
const importers = {
  // Public
  approval: () => import("@/pages/Artwork/Approval"),
  quoteApproval: () => import("@/pages/Projects/ProjectDetail/sections/QuoteSection/QuoteApproval"),
  acceptInvitation: () => import("@/pages/AcceptInvitation"),
  poConfirmation: () => import("@/pages/Projects/ProjectDetail/sections/PurchaseOrdersSection/PoConfirmation"),
  customerPortal: () => import("@/pages/CustomerPortal"),
  publicPresentation: () => import("@/pages/Projects/ProjectDetail/sections/PresentationSection/PublicPresentation"),

  // Authenticated
  home: () => import("@/pages/Home"),
  crm: () => import("@/pages/Crm"),
  contactDetail: () => import("@/pages/Crm/Contacts/ContactDetail"),
  companyDetail: () => import("@/pages/Crm/Companies/CompanyDetail"),
  vendorDetail: () => import("@/pages/Crm/Vendors/VendorDetail"),
  projects: () => import("@/pages/Projects"),
  projectDetail: () => import("@/pages/Projects/ProjectDetail"),
  products: () => import("@/pages/Products"),
  productDetail: () => import("@/pages/Products/ProductDetail"),
  productionReport: () => import("@/pages/ProductionReport"),
  suppliers: () => import("@/pages/Suppliers"),
  reports: () => import("@/pages/Reports"),
  knowledgeBase: () => import("@/pages/KnowledgeBase"),
  settings: () => import("@/pages/Settings"),
  sequenceBuilder: () => import("@/pages/SequenceBuilder"),
  newsletter: () => import("@/pages/Newsletter"),
  teamPerformance: () => import("@/pages/TeamPerformance"),
  artwork: () => import("@/pages/Artwork"),
  mockupBuilder: () => import("@/pages/MockupBuilder"),
  aiPresentationBuilder: () => import("@/pages/AiPresentationBuilder"),
  ssActivewear: () => import("@/pages/SsActivewear"),
  errors: () => import("@/pages/Errors"),
  settingsUsers: () => import("@/pages/Settings/users"),
  profile: () => import("@/pages/Profile"),
  vendorApprovals: () => import("@/pages/VendorApprovals"),
  notifications: () => import("@/pages/Notifications"),
  notFound: () => import("@/pages/NotFound"),
  mediaLibrary: () => import("@/pages/MediaLibrary"),
} as const;

// ---- Lazy components ----
const ApprovalPage = lazy(importers.approval);
const QuoteApprovalPage = lazy(importers.quoteApproval);
const AcceptInvitation = lazy(importers.acceptInvitation);
const POConfirmationPage = lazy(importers.poConfirmation);
const CustomerPortalPage = lazy(importers.customerPortal);
const PublicPresentationPage = lazy(importers.publicPresentation);

const Home = lazy(importers.home);
const CRM = lazy(importers.crm);
const ContactDetail = lazy(importers.contactDetail);
const CompanyDetail = lazy(importers.companyDetail);
const VendorDetail = lazy(importers.vendorDetail);
const ProjectsPage = lazy(importers.projects);
const ProjectDetailPage = lazy(importers.projectDetail);
const Products = lazy(importers.products);
const ProductCatalogDetailPage = lazy(importers.productDetail);
const ProductionReport = lazy(importers.productionReport);
const Suppliers = lazy(importers.suppliers);
const Reports = lazy(importers.reports);
const KnowledgeBase = lazy(importers.knowledgeBase);
const Settings = lazy(importers.settings);
const SequenceBuilder = lazy(importers.sequenceBuilder);
const Newsletter = lazy(importers.newsletter);
const TeamPerformance = lazy(importers.teamPerformance);
const ArtworkPage = lazy(importers.artwork);
const MockupBuilderPage = lazy(importers.mockupBuilder);
const AIPresentationBuilder = lazy(importers.aiPresentationBuilder);
const SsActivewearPage = lazy(importers.ssActivewear);
const ErrorsPage = lazy(importers.errors);
const UsersPage = lazy(importers.settingsUsers);
const ProfilePage = lazy(importers.profile);
const VendorApprovals = lazy(importers.vendorApprovals);
const NotificationsPage = lazy(importers.notifications);
const NotFound = lazy(importers.notFound);
const MediaLibraryPage = lazy(importers.mediaLibrary);

/**
 * Map of URL path → list of importer keys to warm.
 * Dynamic segments like `:id` are dropped when matching so a hover on
 * `/projects` warms projects, and hovering `/crm/companies/abc` warms both
 * crm and companyDetail. Order matters: list primary chunks first.
 */
const pathPrefetchMap: Array<{ test: (path: string) => boolean; keys: Array<keyof typeof importers> }> = [
  { test: (p) => p === "/" || p === "/home", keys: ["home"] },
  { test: (p) => p.startsWith("/crm/companies/"), keys: ["companyDetail"] },
  { test: (p) => p.startsWith("/crm/contacts/"), keys: ["contactDetail"] },
  { test: (p) => p.startsWith("/crm/vendors/"), keys: ["vendorDetail"] },
  { test: (p) => p === "/crm" || p.startsWith("/crm"), keys: ["crm"] },
  { test: (p) => p === "/projects", keys: ["projects"] },
  { test: (p) => p.startsWith("/projects/"), keys: ["projectDetail"] },
  { test: (p) => p === "/production-report", keys: ["productionReport"] },
  { test: (p) => p === "/products", keys: ["products"] },
  { test: (p) => p.startsWith("/products/"), keys: ["productDetail"] },
  { test: (p) => p === "/media-library", keys: ["mediaLibrary"] },
  { test: (p) => p === "/suppliers", keys: ["suppliers"] },
  { test: (p) => p === "/artwork", keys: ["artwork"] },
  { test: (p) => p === "/mockup-builder", keys: ["mockupBuilder"] },
  { test: (p) => p === "/ai-presentation-builder", keys: ["aiPresentationBuilder"] },
  { test: (p) => p === "/reports", keys: ["reports"] },
  { test: (p) => p === "/knowledge-base", keys: ["knowledgeBase"] },
  { test: (p) => p === "/sequence-builder", keys: ["sequenceBuilder"] },
  { test: (p) => p === "/newsletter", keys: ["newsletter"] },
  { test: (p) => p === "/team-performance", keys: ["teamPerformance"] },
  { test: (p) => p === "/ss-activewear", keys: ["ssActivewear"] },
  { test: (p) => p === "/errors", keys: ["errors"] },
  { test: (p) => p === "/notifications", keys: ["notifications"] },
  { test: (p) => p === "/vendor-approvals", keys: ["vendorApprovals"] },
  { test: (p) => p === "/settings/users", keys: ["settingsUsers"] },
  { test: (p) => p.startsWith("/settings"), keys: ["settings"] },
  { test: (p) => p === "/profile", keys: ["profile"] },
];

/**
 * Trigger the dynamic import for whichever route `path` resolves to. Cheap
 * to call repeatedly — the module loader dedupes in-flight imports.
 */
export function prefetchRoute(path: string): void {
  for (const entry of pathPrefetchMap) {
    if (entry.test(path)) {
      entry.keys.forEach((k) => {
        // Fire-and-forget; swallow errors so a stray network blip doesn't
        // bubble to the user — the suspense fallback will show if they click.
        importers[k]().catch(() => { /* ignore */ });
      });
      return;
    }
  }
}

/**
 * Warm the most-frequently-visited chunks once the browser is idle after
 * first paint. Keeps the critical path cheap but pre-populates the disk
 * cache so the next navigation is instant.
 */
export function warmCommonRoutes(): void {
  const run = () => {
    importers.home().catch(() => {});
    importers.projects().catch(() => {});
    importers.crm().catch(() => {});
  };
  if (typeof window === "undefined") return;
  const ric = (window as any).requestIdleCallback as
    | ((cb: () => void, opts?: { timeout?: number }) => number)
    | undefined;
  if (ric) ric(run, { timeout: 2000 });
  else setTimeout(run, 1500);
}

function LegacyOrderRedirect() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/projects/${id}`} replace />;
}

export const router = createBrowserRouter([
  // ---- Public routes (no auth required) ----
  { path: ROUTES.LANDING, element: <RootRoute /> },
  { path: ROUTES.APPROVAL, element: withSuspense(ApprovalPage) },
  { path: ROUTES.CLIENT_APPROVAL, element: withSuspense(QuoteApprovalPage) },
  { path: ROUTES.QUOTE_APPROVAL_LEGACY, element: withSuspense(QuoteApprovalPage) },
  { path: ROUTES.ACCEPT_INVITATION, element: withSuspense(AcceptInvitation) },
  { path: ROUTES.PO_CONFIRMATION, element: withSuspense(POConfirmationPage) },
  { path: ROUTES.CUSTOMER_PORTAL, element: withSuspense(CustomerPortalPage) },
  { path: ROUTES.PUBLIC_PRESENTATION, element: withSuspense(PublicPresentationPage) },

  // ---- Authenticated routes ----
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AuthenticatedLayout />,
        children: [
          { path: ROUTES.HOME, element: withSuspense(Home) },
          { path: ROUTES.CRM, element: withSuspense(CRM) },
          { path: ROUTES.CRM_CONTACT_DETAIL, element: withSuspense(ContactDetail) },
          { path: ROUTES.CRM_COMPANY_DETAIL, element: withSuspense(CompanyDetail) },
          { path: ROUTES.CRM_VENDOR_DETAIL, element: withSuspense(VendorDetail) },
          { path: ROUTES.PROJECTS, element: withSuspense(ProjectsPage) },
          { path: ROUTES.PROJECT_DETAIL, element: withSuspense(ProjectDetailPage) },
          { path: ROUTES.PROJECT_DETAIL_WILDCARD, element: withSuspense(ProjectDetailPage) },
          { path: ROUTES.PRODUCTION_REPORT, element: withSuspense(ProductionReport) },
          { path: ROUTES.PRODUCT_DETAIL, element: withSuspense(ProductCatalogDetailPage) },
          { path: ROUTES.PRODUCTS, element: withSuspense(Products) },
          { path: ROUTES.MEDIA_LIBRARY, element: withSuspense(MediaLibraryPage) },
          { path: ROUTES.SUPPLIERS, element: withSuspense(Suppliers) },
          { path: ROUTES.ARTWORK, element: withSuspense(ArtworkPage) },
          { path: ROUTES.MOCKUP_BUILDER, element: withSuspense(MockupBuilderPage) },
          { path: ROUTES.AI_PRESENTATION_BUILDER, element: withSuspense(AIPresentationBuilder) },
          { path: ROUTES.REPORTS, element: withSuspense(Reports) },
          { path: ROUTES.KNOWLEDGE_BASE, element: withSuspense(KnowledgeBase) },
          { path: ROUTES.SEQUENCE_BUILDER, element: withSuspense(SequenceBuilder) },
          { path: ROUTES.NEWSLETTER, element: withSuspense(Newsletter) },
          { path: ROUTES.TEAM_PERFORMANCE, element: withSuspense(TeamPerformance) },
          { path: ROUTES.SS_ACTIVEWEAR, element: withSuspense(SsActivewearPage) },
          { path: ROUTES.ERRORS, element: withSuspense(ErrorsPage) },
          { path: ROUTES.NOTIFICATIONS, element: withSuspense(NotificationsPage) },
          { path: ROUTES.VENDOR_APPROVALS, element: withSuspense(VendorApprovals) },
          { path: ROUTES.SETTINGS, element: withSuspense(Settings) },
          { path: ROUTES.SETTINGS_USERS, element: withSuspense(UsersPage) },
          { path: ROUTES.PROFILE, element: withSuspense(ProfilePage) },

          // Legacy redirects
          { path: ROUTES.ORDERS_LEGACY, element: <Navigate to={ROUTES.PROJECTS} replace /> },
          { path: ROUTES.ORDER_DETAIL_LEGACY, element: <LegacyOrderRedirect /> },
        ],
      },
    ],
  },

  // Catch-all
  { path: "*", element: withSuspense(NotFound) },
]);
