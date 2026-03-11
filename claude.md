# SwagSuite - LSD (Laden's SwagSuite Dashboard)

## Project Overview
Full-stack monorepo SaaS for promotional apparel/merchandise business management. Handles CRM, order management, production workflows, supplier integrations, customer portals, and media library.

## Tech Stack
- **Frontend**: React 18 + Wouter (routing) + TanStack Query 5 (state) + Shadcn/ui + TailwindCSS
- **Backend**: Express 4 + Passport.js (session auth) + Multer (file uploads)
- **Database**: PostgreSQL (Neon serverless) + Drizzle ORM 0.39
- **File Storage**: Cloudinary (images/docs) + AWS S3 (Uppy)
- **External**: Stripe, QuickBooks, TaxJar, SendGrid, Slack, Claude AI (Anthropic SDK)
- **Deployment**: GCP Cloud Run, GCP Secret Manager for env vars

## Project Structure
```
client/src/
  App.tsx              # Main router (Wouter)
  types/               # Shared TypeScript types
    project-types.ts   # ProjectData, TeamMember, ProjectActivity, Communication, status maps
  components/
    ui/                # Shadcn/ui primitives
    sections/          # Shared detail sections (Activities, Products, Shipping, Files, etc.)
    modals/            # Modal/dialog components (OrderModal, FilePickerDialog, etc.)
    data-table/        # Data table utilities (column header, pagination, view options)
    documents/         # Document templates (PO, Quote, Sales Order)
    dashboard/         # Dashboard components
    integrations/      # Vendor integration components
    newsletter/        # Newsletter/email campaign components
    reports/           # Report components
    settings/          # Settings-specific components
    [root files]       # Layout, Sidebar, TopBar, FilesTab, etc.
  pages/
    projects/          # Project list components (columns, data-table, kanban-board)
    project-detail/    # Project detail page
      index.tsx        # Main page component
      ProjectHeader.tsx
      ProjectNestedSidebar.tsx
      hooks/useProjectData.ts  # Data fetching hook
      sections/        # Project-specific sections (Overview, Quote, Invoice, etc.)
      components/      # Project-specific components (StageConversionDialog)
    crm/               # CRM sub-pages (companies, contacts, leads, vendors)
    settings/          # Settings sub-pages
    [root page files]  # home, products, media-library, etc.
  hooks/               # Shared React hooks (useAuth, useMediaLibrary, useToast, etc.)
  lib/                 # Utilities (queryClient, media-library, authUtils, etc.)
  providers/           # ThemeProvider
server/
  index.ts             # Express app + middleware setup
  routes.ts            # ALL API endpoints (~9800 lines)
  storage.ts           # IStorage interface + DatabaseStorage class (~3200 lines)
  db.ts                # Neon DB connection
  auth.ts              # Passport.js config
  cloudinary.ts        # Cloudinary config
  emailService.ts      # SendGrid/Nodemailer
  *Service.ts          # Vendor integrations (sage, sanmar, ssActivewear)
shared/
  schema.ts            # Drizzle tables, relations, Zod schemas (~2100 lines)
  project-schema.ts    # Project-specific tables (activities, communications, attachments)
migrations/            # Drizzle migration SQL files
```

## Key Patterns & Conventions

### API & Data Fetching
- `apiRequest(method, url, data?)` in `client/src/lib/queryClient.ts` - centralized fetch with credentials + error handling. Use for JSON requests (not FormData).
- Default `queryFn` via `getQueryFn({ on401: "throw" })` auto-fetches from query key URL. Custom `queryFn` only needed for special cases (FormData, custom error handling).
- Global 401 handler in QueryClient: clears auth state to redirect to landing.
- `staleTime: Infinity` + `refetchOnWindowFocus: false` by default - manual invalidation via `queryClient.invalidateQueries()`.

### Database & Storage
- All DB operations go through `IStorage` interface in `server/storage.ts`, implemented by `DatabaseStorage` class.
- Schema defined in `shared/schema.ts` (Drizzle + Zod). Add new tables there.
- Relations defined separately with `relations()` helper.
- Migrations: `npx drizzle-kit generate` then `npx drizzle-kit migrate`.
- Dynamic imports used inside route handlers for schema/db (existing pattern, don't change).

### Authentication
- Session-based via Passport.js local strategy.
- `isAuthenticated` middleware on protected routes.
- `req.user?.claims?.sub` for current user ID.
- Dev auto-login: in development, auto-logs in first user if no session.

### File Uploads
- Multer + `multer-storage-cloudinary` for file processing.
- Upload endpoints use `upload.array("files", 10)` middleware.
- FormData uploads cannot use `apiRequest` (it sets JSON content-type).
- **IMPORTANT**: Any file upload UI must use `FilePickerDialog` (`components/modals/FilePickerDialog.tsx`) — never raw `<input type="file">`. FilePickerDialog lets users upload new files OR pick existing files from the media library. The pattern is: FilePickerDialog returns `MediaLibraryItem[]` with `cloudinaryUrl`, then pass the URL to the backend (e.g., as `filePath` in the request body).

### UI Components
- Shadcn/ui components in `client/src/components/ui/`.
- Lucide React for icons.
- date-fns for date formatting.
- Toast notifications via `useToast()` hook.

### Routing
- Wouter for client routing (not React Router). Uses `<Route path="...">` and `useLocation()`.
- Routes defined in `client/src/App.tsx`.
- Sidebar nav in `client/src/components/Sidebar.tsx`.

## Media Library System

### Architecture
Centralized file registry with dual-write pattern. All file uploads register in `mediaLibrary` table.

### Database
- `mediaLibrary` table in `shared/schema.ts` - canonical file registry
- Fields: id, cloudinaryPublicId, cloudinaryUrl, fileName, originalName, fileSize, mimeType, fileExtension, thumbnailUrl, folder, tags (jsonb), category, orderId?, companyId?, orderItemId?, sourceTable, sourceId, uploadedBy, description, timestamps

### Server
- `GET /api/media-library` - List with search/filter/pagination
- `POST /api/media-library/upload` - Upload new files (multer + Cloudinary)
- `PATCH /api/media-library/:id` - Update metadata
- `DELETE /api/media-library/:id` - Delete from Cloudinary + DB
- `POST /api/orders/:orderId/files/from-library` - Link library files to orders
- `registerInMediaLibrary()` helper in routes.ts for dual-write on existing upload endpoints

### Client
- `client/src/hooks/useMediaLibrary.ts` - React Query hooks (useMediaLibrary, useUploadToMediaLibrary, useDeleteMediaLibraryItem). Supports `enabled` option.
- `client/src/lib/media-library.ts` - Types (MediaLibraryItem, ActivityAttachment) + helpers (getCloudinaryThumbnail, isImageFile, isPdfFile, getFileTypeIcon, formatFileSize)
- `client/src/components/modals/FilePickerDialog.tsx` - Reusable file picker with "Project Files" + "All Files" tabs (when contextOrderId provided) or single library view. Upload integrated into each tab.
- `client/src/components/modals/FilePreviewModal.tsx` - Modal preview for images, PDFs, download fallback. Always use this for file preview (never redirect to Cloudinary URL).
- `client/src/pages/media-library.tsx` - Full media library page with grid/list view, select mode, bulk delete.

### Inline Attachments
- ActivitiesSection supports file attachments in internal notes.
- Attachments sent as full objects `{ fileName, mimeType, cloudinaryUrl, thumbnailUrl }` (not IDs) to avoid cross-table lookup issues.
- Stored denormalized in `projectActivities.metadata.attachments[]`.
- `AttachmentChips` component renders attachment previews, clicking opens `FilePreviewModal`.

### Backfill
- `server/scripts/backfill-media-library.ts` - Populates mediaLibrary from existing orderFiles, artworkFiles, attachments, projectActivities. Requires `import "dotenv/config"` for standalone execution.

## Order / Project System
- Orders table (`orders` in schema.ts) is the core entity.
- Per-section status fields: `quoteStatus` (DB: `quote_status`), `salesOrderStatus`, `presentationStatus`.
- Business stages: `presentation` → `quote` → `sales_order` → `invoice` (defined in `client/src/lib/businessStages.ts`).
- **Renamed**: "Estimate" was renamed to "Quote" across the entire codebase. DB column `estimate_status` → `quote_status`, Drizzle field `estimateStatus` → `quoteStatus`, stage id `"estimate"` → `"quote"`. File `EstimateSection.tsx` → `QuoteSection.tsx`. Backward compat: `businessStages.ts` maps legacy `startingStage: "estimate"` → `"quote"`.
- Project detail page at `/project/:orderId` with sections: Overview, Presentation, Quote, Sales Order, Shipping, POs, Invoice, Bills, Feedback.
- Legacy `/orders` and `/orders/:id` routes redirect to `/projects` and `/project/:id`.
- Shared sections (Activities, Products, Shipping, Files, Documents, Email, Vendor, POs) live in `components/sections/`.
- Project-specific sections (Overview, Quote, Invoice, etc.) live in `pages/project-detail/sections/`.
- Shared types (`ProjectData`, `TeamMember`, etc.) in `client/src/types/project-types.ts`.
- `projectActivities` table tracks all activity (comments, status changes, file uploads, mentions).
- Order files stored in `orderFiles` table, linked to orders.
- Artwork files in `artworkFiles` table, linked to order items.

## Auto-Lock System (CommonSKU-style)

### Architecture
Section-level auto-locking that prevents edits on finalized stages. Lock state is derived from existing status fields (no schema migration). Unlock overrides stored in `orders.stageData.unlocks` JSONB.

### Lock Rules
- **Quote**: Locked when project advances to Sales Order stage (`businessStage >= sales_order`). Unlockable.
- **Sales Order** (+ Shipping, POs): Locked when `salesOrderStatus === "ready_to_invoice"`. Unlockable.
- **Invoice**: Locked when `invoice.status === "paid"`. Unlockable.

### Key Files
- `client/src/hooks/useLockStatus.ts` — Centralized hook: `useLockStatus(data) → LockStatus` with per-section `{ isLocked, reason, canUnlock, isOverridden }`
- `client/src/components/LockBanner.tsx` — Reusable amber banner with lock icon + "Unlock" button + AlertDialog confirmation
- `server/routes.ts` — `isSectionLocked()` helper + `checkLockByOrderItemId()` for nested routes. Lock validation on PATCH/DELETE endpoints returns 403.

### Unlock Mechanism
- Unlock overrides stored in `stageData.unlocks.{quote|salesOrder|invoice}`
- Auto-relock: When `salesOrderStatus` transitions to `"ready_to_invoice"`, the `salesOrder` unlock override is cleared.
- All lock/unlock events logged in `projectActivities` as `system_action`.

### Audit Trail
- `quoteStatus`, `salesOrderStatus`, `presentationStatus` changes logged as `status_change` activities with `metadata.section`
- Lock/unlock events logged as `system_action` with `metadata.action: 'section_unlocked'`

### PO Stage Gate
- POs page requires `salesOrderStatus` to be `client_approved` or beyond (in_production, shipped, ready_to_invoice) — controlled via `requiresClientApproval` flag in `ProjectNestedSidebar.tsx`

## Order Flow Improvements (CommonSKU-inspired)

### Date Utilities
- `client/src/lib/dateUtils.ts` — Centralized date status calculations:
  - `getDateStatus(date)` → returns `{ urgency, label, color, daysRemaining }` for overdue/today/urgent/soon
  - `hasTimelineConflict(order, shipments?)` → detects conflicts: supplier date > customer date, event before in-hands, shipment ETA > in-hands
  - `isInvoiceOverdue(invoice)` → pending + past due date

### Timeline Validation
- `client/src/components/TimelineWarningBanner.tsx` — Red/orange warning banner for date conflicts (reusable, similar to LockBanner pattern)
- Shown in **SalesOrderSection** and **ShippingSection** when conflicts detected
- Conflicts: supplier deadline after customer in-hands, event date before delivery, shipment ETA exceeding deadline

### Missing Fields Surfaced
- **SalesOrderSection**: Added `supplierInHandsDate` and `eventDate` input fields with save-on-blur (`updateFieldMutation` → PATCH order)
- **ShippingSection**: Added blue date context card showing Customer In-Hands, Supplier In-Hands, and Event Date at top of section

### Overdue Indicators
- **Projects table** (`columns.tsx`): In-Hands Date column shows colored badges (Overdue/Due Today/3d left/etc.)
- **Kanban board** (`kanban-board.tsx`): Cards show red text + AlertTriangle icon when overdue
- **Production report** (`production-report.tsx`): Improved priority calc using `getDateStatus()` (overdue/today=urgent, urgent/soon=high); overdue badges on all order cards
- **OverviewSection**: In-Hands Date and Event Date display urgency badges

### Date Range Filters (Production Report)
- Filter by In-Hands Date or Next Action Date with from/to date inputs
- Quick preset buttons: "Overdue", "This Week", "This Month"
- Integrated into existing active filters display + clear all

### PO Improvements
- **Shipping validation**: PO generation blocked if no shipping address set; orange warning banner in PO section
- **Rush/Firm indicators on PO template**: "FIRM ORDER — Date cannot be adjusted" (blue) and "RUSH ORDER — Please prioritize" (red) in header + special instructions
- **Stale detection**: `buildItemsHash` now includes `isFirm` and `isRush` flags

### Auto-Overdue Invoice Detection
- `server/notificationScheduler.ts` — `processOverdueInvoices()` method runs hourly alongside next-action notifications
- Queries invoices where `status='pending'` AND `dueDate < now()`, auto-updates to `'overdue'`
- Logs `system_action` activity in `projectActivities` for each overdue invoice

## Purchase Order System (CommonSKU-style)

### PO Stages & Status
- **PO Stages** (lifecycle): Created → Submitted → Confirmed → Shipped → Ready for Billing → Billed → Closed
- **PO Status** (urgency): OK, Follow Up, Problem
- Stage/status stored in `generatedDocuments.metadata.poStage` / `metadata.poStatus` (JSONB, no schema migration)
- `PATCH /api/documents/:documentId` supports `status`, `sentAt`, and `metadata` updates
- Full stage transition buttons in PO section: Email to Vendor, Confirm, Mark Shipped, Ready for Billing, Mark as Billed, Close PO
- All PO stage changes and proofing status changes log activity via `POST /api/projects/:orderId/activities`

### PO Email to Vendor
- "Email to Vendor" button appears when PO stage is "created" (or "Resend" after first send)
- Sends via `/api/orders/:orderId/communications` with `communicationType: "vendor_email"`
- Auto-updates PO stage to "submitted" and document status to "sent"

### Proofing Workflow (in PO Section)
- Proofing lives in PO section (per vendor), NOT in SO Artwork tab
- Proof statuses: pending → awaiting_proof → proof_received → pending_approval → approved → change_requested → proofing_complete
- Actions: Request Proof from Vendor, Upload Vendor Proof (via FilePickerDialog), Send Proof to Client (with approval link), Mark Proofing Complete
- Proof files stored in `artworkItems.proofFilePath` and `artworkItems.proofFileName` columns
- SO Artwork tab is view-only (shows artwork files + status badges, no proofing actions)

### Key Files
- `client/src/components/sections/PurchaseOrdersSection.tsx` — Full PO management with stages, email, proofing
- `client/src/components/documents/PurchaseOrderTemplate.tsx` — PO PDF template

## Sales Order Document & Email

### SO Document Generation
- `useDocumentGeneration` hook extended for `sales_order` document type
- `SalesOrderTemplate` component for PDF capture (emerald header, billing/shipping, payment terms, firm/rush badges)
- `DocumentEditor` treats `sales_order` same as `quote` (shows unit prices, not vendor costs)
- Stale detection via `buildItemsHash(items, "sales_order", order)` — includes notes, IHD, eventDate, billing, shipping

### Send SO to Client
- `client/src/components/modals/SendSODialog.tsx` — Email dialog (like SendQuoteDialog)
- Reuses `quoteApprovals` table for approval tokens (same approval flow as quotes)
- Auto-sets `salesOrderStatus` to `pending_client_approval` after sending
- When reusing existing pending approval, PATCHes `documentId`/`pdfPath`/`quoteTotal` via `PATCH /api/orders/:orderId/quote-approvals/:approvalId`

### Client Approval System (Unified Quote & SO)
- **Public page**: `/client-approval/:token` — single page handles both Quote and SO approvals
- **Legacy redirect**: `/quote-approval/:token` still works (redirects to `/client-approval/`)
- **API endpoints**: `GET /api/client-approvals/:token`, `POST /api/client-approvals/:token/approve`, `POST /api/client-approvals/:token/decline`
- **Legacy API redirects**: Old `/api/quote-approvals/:token` paths redirect (307) to `/api/client-approvals/:token`
- **Document type detection**: Joins `generatedDocuments` to get `documentType`; fallback: if `documentType` is null but `order.salesOrderStatus === "pending_client_approval"`, treats as SO
- **SO approval**: Sets `salesOrderStatus: "client_approved"` on approve, `"draft"` on decline
- **Quote approval**: Converts order to Sales Order stage on approve (existing behavior)
- **PDF preview**: Uses Google Docs Viewer iframe with cache-buster (`&t={timestamp}`) + "Reload Preview" button

### Key Files
- `client/src/components/modals/SendSODialog.tsx` — Send SO email dialog
- `client/src/components/modals/SendQuoteDialog.tsx` — Send Quote email dialog (reference)
- `client/src/components/documents/SalesOrderTemplate.tsx` — SO PDF template
- `client/src/pages/quote-approval.tsx` — Public approval page (serves both `/client-approval/` and `/quote-approval/` routes)

## Important Notes
- `routes.ts` is very large (~9800 lines). Search for specific endpoint patterns rather than reading the whole file.
- `storage.ts` is also large (~3200 lines). New methods follow existing patterns.
- Pre-existing TS errors exist in `AINewsMonitor.tsx` and `HubSpotIntegration.tsx` (wrong `apiRequest` call signature) - not our changes.
- Cloudinary URL detection: use `url.includes('cloudinary.com')` consistently (not just `'cloudinary'`).
- Session cookie: `connect.sid` with `credentials: "include"` on all fetch calls.
