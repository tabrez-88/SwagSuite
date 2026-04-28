# SwagSuite - LSD (Laden's SwagSuite Dashboard)

Full-stack monorepo SaaS for promotional apparel/merchandise business management.

## Tech Stack
- **Frontend**: React 18 + Wouter (routing) + TanStack Query 5 (state) + Shadcn/ui + TailwindCSS
- **Backend**: Express 4 + Passport.js (session auth) + Multer (file uploads)
- **Database**: PostgreSQL (Neon serverless) + Drizzle ORM 0.39
- **File Storage**: Cloudinary (images/docs) + AWS S3 (Uppy)
- **External**: Stripe, QuickBooks, TaxJar, SendGrid, Slack, OPEN AI
- **Deployment**: GCP Cloud Run, GCP Secret Manager for env vars

## Architecture Rules

### Backend: Route → Controller → Storage
- Routes (`server/routes/*.routes.ts`): thin, only path + middleware + controller call
- Controllers (`server/controllers/`): static methods, parse req, call storage/services
- `asyncHandler()` wraps async handlers. `getUserId(req)` for user ID.
- New routes via `registerModularRoutes(app)` in `server/routes/index.ts`
- Schema in `shared/schema.ts` (Drizzle + Zod). Migrations: `npx drizzle-kit generate && npx drizzle-kit migrate`
- Dynamic imports inside route handlers for schema/db (existing pattern, don't change)

### Frontend Patterns
- `apiRequest(method, url, data?)` — centralized fetch with credentials. NOT for FormData.
- `getQueryFn({ on401: "throw" })` — default queryFn from query key URL
- Hooks must be inside hooks.ts, not directly into the index.tsx or ui place
- Mutation or request must be from services folder
- each ui must be on his own file, so dont create new components in the page directly, must use create in separate component file then import it to the page
- `staleTime: Infinity` + manual invalidation via `queryClient.invalidateQueries()`
- Wouter routing (NOT React Router): `<Route path="...">`, `useLocation()`
- Shadcn/ui + Lucide icons + date-fns + `useToast()` hook

### Auth
- Session-based Passport.js. `isAuthenticated` middleware. `req.user?.claims?.sub` for user ID.
- Dev auto-login: first user if no session.

## Critical Gotchas (DO NOT VIOLATE)
- **File uploads**: ALWAYS use `FilePickerDialog` — never raw `<input type="file">`. Returns `MediaLibraryItem[]` with `cloudinaryUrl`.
- **Cloudinary detection**: `url.includes('cloudinary.com')` (not just `'cloudinary'`)
- **FormData uploads**: cannot use `apiRequest` (sets JSON content-type)
- **Image CORS**: Use `proxyImg()` from `@/lib/imageUtils` on external image URLs in PDF templates. NO `crossOrigin="anonymous"`.
- **FilePickerDialog scroll**: Use plain `<div className="flex-1 min-h-0 overflow-y-auto">` NOT Radix ScrollArea
- **Private notes**: `orderItems.privateNotes` — NEVER on client-facing PDFs
- **Estimate→Quote rename**: DB `estimate_status`→`quote_status`, field `estimateStatus`→`quoteStatus`, stage `"estimate"`→`"quote"`. Legacy compat in `businessStages.ts`.
- Pre-existing TS errors in `AINewsMonitor.tsx` and `HubSpotIntegration.tsx` — not our changes.

## Business Domain Quick Reference
- **Stages**: presentation → quote → sales_order → invoice (see `constants/businessStages.ts`)
- **PO lifecycle**: Created → Submitted → Confirmed → Shipped → Ready for Billing → Billed → Closed
- **Proofing**: Lives in PO section (per vendor), NOT SO Artwork tab. SO Artwork = view-only.
- **Lock system**: Quote locked at SO stage, SO locked at ready_to_invoice, Invoice locked when paid. Unlocks in `stageData.unlocks` JSONB.
- **Charges**: Run (per unit) vs Fixed (one-time). `includeInUnitPrice` bakes into unit price. `displayToClient` for PDF visibility.
- **Client approval**: Unified page `/client-approval/:token` handles both Quote & SO. Legacy `/quote-approval/` redirects.

## Deep Reference Docs
For detailed system docs (media library, PO system, SO/approval, image proxy, lock system, charges, dates), see `.claude/docs/`:
- `.claude/docs/media-library.md` — Media library architecture, API, client hooks
- `.claude/docs/po-system.md` — PO stages, email, proofing workflow
- `.claude/docs/approval-system.md` — SO/Quote approval, document generation, client page
- `.claude/docs/lock-system.md` — Auto-lock rules, unlock mechanism, audit trail
- `.claude/docs/charges-products.md` — Run/Fixed charges, price lock, product fields, PDF layout
- `.claude/docs/dates-timeline.md` — Date utilities, timeline validation, overdue detection

## Session Rules
- Always use /caveman when we start a new claude session
- Before editing any file, read it first. Before modifying a function, grep for all callers. Research before you edit.
- Always to look .claude/rules because we want anything proper following these rules
