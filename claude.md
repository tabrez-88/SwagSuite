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
    documents/         # Document templates (PO, Quote)
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
      sections/        # Project-specific sections (Overview, Estimate, Invoice, etc.)
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
- Project detail page at `/project/:orderId` with sections: Overview, Presentation, Estimate, Sales Order, Shipping, POs, Invoice, Bills, Feedback.
- Legacy `/orders` and `/orders/:id` routes redirect to `/projects` and `/project/:id`.
- Shared sections (Activities, Products, Shipping, Files, Documents, Email, Vendor, POs) live in `components/sections/`.
- Project-specific sections (Overview, Estimate, Invoice, etc.) live in `pages/project-detail/sections/`.
- Shared types (`ProjectData`, `TeamMember`, etc.) in `client/src/types/project-types.ts`.
- `projectActivities` table tracks all activity (comments, status changes, file uploads, mentions).
- Order files stored in `orderFiles` table, linked to orders.
- Artwork files in `artworkFiles` table, linked to order items.

## Important Notes
- `routes.ts` is very large (~9800 lines). Search for specific endpoint patterns rather than reading the whole file.
- `storage.ts` is also large (~3200 lines). New methods follow existing patterns.
- Pre-existing TS errors exist in `AINewsMonitor.tsx` and `HubSpotIntegration.tsx` (wrong `apiRequest` call signature) - not our changes.
- Cloudinary URL detection: use `url.includes('cloudinary.com')` consistently (not just `'cloudinary'`).
- Session cookie: `connect.sid` with `credentials: "include"` on all fetch calls.
