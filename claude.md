# SwagSuite - LSD (Laden's SwagSuite Dashboard)

# 1. Append Karpathy's 4-rule baseline to your CLAUDE.md
curl https://raw.githubusercontent.com/forrestchang/andrej-karpathy-skills/main/CLAUDE.md >> CLAUDE.md

These rules apply to every task in this project unless explicitly overridden.

## Rule 1 - Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## Rule 2 - Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## Rule 3 - Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## Rule 4 - Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

## Rule 5 — Use the model only for judgment calls
Use me for: classification, drafting, summarization, extraction.
Do NOT use me for: routing, retries, deterministic transforms.
If code can answer, code answers.

## Rule 6 — Token budgets are not advisory
Per-task: 4,000 tokens. Per-session: 30,000 tokens.
If approaching budget, summarize and start fresh.
Surface the breach. Do not silently overrun.

## Rule 7 — Surface conflicts, don't average them
If two patterns contradict, pick one (more recent / more tested).
Explain why. Flag the other for cleanup.
Don't blend conflicting patterns.

## Rule 8 — Read before you write
Before adding code, read exports, immediate callers, shared utilities.
"Looks orthogonal" is dangerous. If unsure why code is structured a way, ask.

## Rule 9 — Tests verify intent, not just behavior
Tests must encode WHY behavior matters, not just WHAT it does.
A test that can't fail when business logic changes is wrong.

## Rule 10 — Checkpoint after every significant step
Summarize what was done, what's verified, what's left.
Don't continue from a state you can't describe back.
If you lose track, stop and restate.

## Rule 11 — Match the codebase's conventions, even if you disagree
Conformance > taste inside the codebase.
If you genuinely think a convention is harmful, surface it. Don't fork silently.

## Rule 12 — Fail loud
"Completed" is wrong if anything was skipped silently.
"Tests pass" is wrong if any were skipped.
Default to surfacing uncertainty, not hiding it.

## Rule 13 - Session Rules
- Always use /caveman when we start a new claude session
- Before editing any file, read it first. Before modifying a function, grep for all callers. Research before you edit.
- Always to look .claude/rules because we want anything proper following these rules

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
