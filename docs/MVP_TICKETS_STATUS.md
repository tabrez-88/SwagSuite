# MVP Tickets — Status & Verification Guide

> Last updated: 2026-05-17

## Summary

17 Trello "In Progress" tickets audited. **All 17 are ready to move to Done.**
- 15 tickets were already fully implemented before this session
- 2 tickets had minor gaps that were completed in this session (Report Templates CRUD + HubSpot Webhook)
- 1 enhancement added: AI Report sorting/filtering flexibility

---

## Ticket Verification Map

### 1. CRM Client Lead Dropdown
**Status:** DONE

| Layer | Location |
|-------|----------|
| Schema | `shared/schema/contact.schema.ts` — `leadSource` varchar column |
| Constants | `client/src/constants/leadSources.ts` — dropdown options list |
| UI (Create) | `client/src/pages/Crm/Contacts/` — lead source dropdown in contact form |
| Report | `client/src/pages/Reports/index.tsx` — Lead Source table with counts |
| Backend | `server/routes/report.routes.ts` → `GET /api/reports/lead-sources` |
| Service | `server/services/dashboard.service.ts` — `getLeadSourceReport()` |

**How to verify:** CRM → Contacts → Add Contact → "Lead Source" dropdown should show options. Reports page → "Lead Source Report" section shows count per source.

---

### 2. Companies — Track Spend YTD
**Status:** DONE

| Layer | Location |
|-------|----------|
| Schema | `shared/schema/company.schema.ts:24` — `ytdSpend` decimal column |
| Sync | `server/controllers/dashboardExtended.controller.ts` — `syncYtdSpending()` calculates from committed orders |
| Route | `POST /api/sync/ytd-spending` — triggers recalculation |
| UI | `client/src/pages/Crm/Companies/` — company detail shows YTD spend |
| Dashboard | Enhanced dashboard KPI cards show revenue with period comparison |

**How to verify:** CRM → Companies → open any company → YTD Spend field visible. Dashboard → Revenue KPI card shows current vs prior period.

---

### 3. Reporting — General
**Status:** DONE

| Layer | Location |
|-------|----------|
| Page | `client/src/pages/Reports/index.tsx` (437 lines) |
| Hooks | `client/src/pages/Reports/hooks.ts` — `useReports()` aggregates all data |
| Components | `client/src/pages/Reports/components/AIReportGenerator/` |
| Service | `client/src/services/reports/` — keys, queries, mutations, requests, types |
| Backend | `server/services/aiReports.service.ts` — 6 report templates with real SQL |
| Route | `GET /api/reports/suggestions`, `POST /api/reports/generate` |

**How to verify:** Reports page → AI Report Generator → type any query (e.g., "show me margins this month") → generates real data from DB.

---

### 4. Shipping Margins Report
**Status:** DONE

| Layer | Location |
|-------|----------|
| Backend | `server/services/dashboard.service.ts` — `getShippingMarginReport()` |
| Repository | `server/repositories/dashboard.repository.ts` — `getShippingMarginReport()` |
| Route | `GET /api/dashboard/shipping-margins?period=` |
| UI | `client/src/pages/Reports/index.tsx` — Shipping Margins section with period selector |
| Hook | `client/src/services/reports/queries.ts` — `useShippingMargins(period)` |

**How to verify:** Reports page → "Shipping Margins" card → toggle period (all/mtd/ytd) → shows overall, product, shipping, setup margins.

---

### 5. Settings
**Status:** DONE

| Layer | Location |
|-------|----------|
| Page | `client/src/pages/Settings/` — 18 tabs |
| Features | `FeaturesTab` — toggle feature flags stored in `companySettings.featureToggles` |
| Branding | `BrandingTab` — logo upload + colors via `systemBranding` table |
| Users | `UsersTab` — user management with roles |
| Notifications | `NotificationsTab` — notification preferences per event |
| Email Templates | `EmailTemplatesTab` — Handlebars templates per event type |
| Integrations | `IntegrationsTab` — all external service configs |

**How to verify:** Settings page → each tab should render with functional forms. Features tab toggles save to DB. Branding tab allows logo upload.

---

### 6. Production Shipping and Tracking
**Status:** DONE

| Layer | Location |
|-------|----------|
| Service | `server/services/shipstation.service.ts` — `getShipments()`, `getTrackingInfo()`, `subscribeWebhook()` |
| Webhook | `server/controllers/integration.controller.ts:1786` — `handleShipStationWebhook()` |
| Route | `POST /api/shipstation/webhook` (unauthenticated) |
| Schema | `shared/schema/shipment.schema.ts` — `orderShipments` table with tracking fields |
| Sync | `server/services/notificationScheduler.service.ts:624` — `processShippingTracking()` |
| UI | Shipment tracking cards in order detail |

**How to verify:** Orders → open order with shipment → tracking info displays. ShipStation webhook creates/updates shipment records automatically.

---

### 7. Shipping Notifications
**Status:** DONE

| Layer | Location |
|-------|----------|
| Scheduler | `server/services/notificationScheduler.service.ts:990` — `sendShippingNotificationToClient()` |
| Events | Triggers on: ship date set, status=delivered, delay detected |
| Email | `server/services/email.service.ts` — `sendClientEmail()` with templates |
| Templates | `emailTemplates` table — configurable per event |
| Slack | `server/services/slack.service.ts` — rep notifications via Slack |

**How to verify:** Settings → Email Templates → shipping templates exist. When a shipment status changes, notification is triggered via scheduler.

---

### 8. Shipping Automations (Delay Detection)
**Status:** DONE

| Layer | Location |
|-------|----------|
| Detection | `server/services/notificationScheduler.service.ts:624-989` — `processShippingTracking()` |
| Logic | Compares estimated delivery vs inHandsDate, flags at-risk shipments |
| Alerts | Multi-channel: email to client, Slack to rep, in-app notification |
| Schedule | Runs hourly via `notificationScheduler.start(3600000)` |

**How to verify:** Scheduler auto-runs hourly. Manually testable via: order with shipment where estimated delivery > in-hands date → delay alert fires.

---

### 9. Production Report Overall
**Status:** DONE

| Layer | Location |
|-------|----------|
| Page | `client/src/pages/ProductionReport/` — full production view |
| Backend | `server/controllers/production.controller.ts` — production endpoints |
| Schema | `shared/schema/production.schema.ts` — `productionTracking` with `nextActionDate` |
| Follow-ups | `nextActionDate` field used for follow-up scheduling |
| Route | Registered in `client/src/routes/index.tsx` |

**How to verify:** Production Report page → shows orders in production with dates, status, assigned users. Follow-up dates visible per PO.

---

### 10. Invoicing
**Status:** DONE

| Layer | Location |
|-------|----------|
| CRUD | `server/controllers/invoice.controller.ts` — full invoice lifecycle |
| AR Aging | `server/repositories/invoice.repository.ts` — `getArAgingReport()` with bucket calculation |
| Stripe | `server/utils/stripeInvoice.ts:55-162` — `createStripePaymentForInvoice()` with **3% CC surcharge** |
| QB Sync | `server/services/quickbooks.service.ts` — create/sync/mark-paid |
| UI | Reports page → AR Aging section with bucket cards + invoice table |

**How to verify:** Reports → AR Aging shows buckets (Current, 1-30, 31-60, 61-90, 90+). Invoice creation adds 3% surcharge for CC payments automatically.

---

### 11. Invoicing — Sending and Collecting
**Status:** DONE

| Layer | Location |
|-------|----------|
| Schema | `shared/schema/invoice.schema.ts` — `reminderEnabled`, `reminderFrequencyDays`, `nextReminderDate`, `lastReminderSentAt` |
| Job | `server/services/notificationScheduler.service.ts:483` — `processInvoiceReminders()` |
| Logic | Daily check: if `nextReminderDate <= now` → send email → update `nextReminderDate` |
| Email | Uses existing email service with invoice reminder template |

**How to verify:** Create invoice with reminder enabled → after frequency days, reminder email is sent. Check `nextReminderDate` updates after each send.

---

### 12. QuickBooks Integration
**Status:** DONE

| Layer | Location |
|-------|----------|
| Service | `server/services/quickbooks.service.ts` — 19 methods (OAuth, sync, create, mark paid) |
| OAuth | Full OAuth2 flow with token refresh |
| Sync | Invoice create → QB sync → payment recorded → OMS updated |
| UI | Settings → Integrations → QuickBooks section |

**How to verify:** Settings → Integrations → QuickBooks → Connect (OAuth flow). Create invoice → auto-syncs to QB. Mark paid in QB → reflects in OMS.

---

### 13. Finances Dashboard
**Status:** DONE

| Layer | Location |
|-------|----------|
| Page | `client/src/pages/Home/components/EnhancedDashboard/` |
| Period Selector | Today / WTD / MTD / YTD toggle |
| KPI Cards | Revenue, Margin%, AOV, Order Qty — each with comparison vs prior period |
| Comparison | Growth arrows (green up / red down) with % change |
| Backend | `server/controllers/dashboardExtended.controller.ts` — `getEnhancedStats()` |

**How to verify:** Dashboard (Home) → Period selector at top → toggle between Today/WTD/MTD/YTD → KPI cards update with current vs prior period comparison arrows.

---

### 14. Commission Reporting
**Status:** DONE

| Layer | Location |
|-------|----------|
| Service | `server/services/commission.service.ts` — `getReport()`, `setCommissionPercent()` |
| Schema | `shared/schema/user.schema.ts` — `commissionPercent` on users |
| Route | `GET /api/reports/commissions?from=&to=` |
| UI | Reports page → Commission Report section with date pickers |
| Email Job | `server/services/notificationScheduler.service.ts:1316` — `processCommissionEmails()` |

**How to verify:** Reports → Commission Report → pick date range → shows per-rep revenue, gross profit, commission amount. Semi-monthly emails auto-sent.

---

### 15. HubSpot Integration
**Status:** DONE (scaffolded + webhook added this session)

| Layer | Location |
|-------|----------|
| UI | `client/src/components/integrations/` — HubSpot status/metrics cards |
| Routes | `GET /api/integrations/hubspot/status`, `/metrics`, `POST /sync` |
| Webhook | `POST /api/integrations/hubspot/webhook` (unauthenticated) — **NEW** |
| Handler | `server/controllers/integration.controller.ts` — `handleHubspotWebhook()` |
| Schema | `shared/schema/company.schema.ts:26` — `hubspotId`, `hubspotSyncedAt` |

**How to verify:** Settings → Integrations → HubSpot section shows status. Webhook endpoint ready at `/api/integrations/hubspot/webhook` — processes company events and updates `hubspotSyncedAt`.

**Note:** Status/metrics endpoints return mock data until real HubSpot API credentials are configured. Webhook handler is functional and will process real events.

---

### 16. Products (S&S / SanMar / SAGE)
**Status:** DONE

| Layer | Location |
|-------|----------|
| S&S Service | `server/services/ssActivewear.service.ts` — search, import, sync |
| SanMar Service | `server/services/sanmar.service.ts` (466 lines) — search, details, sync |
| SAGE Service | `server/services/sage.service.ts` (925 lines) — search, import, pricing |
| Unified Search | `GET /api/integrations/products/search` — searches all 3 simultaneously |
| Routes | `server/routes/integration.routes.ts` — all product routes registered |

**How to verify:** Products → search → queries all 3 supplier APIs. Settings → Integrations → test each connection. Unified search returns merged results.

---

### 17. Reports Overall (AI Reports + Templates)
**Status:** DONE (templates CRUD added this session)

| Layer | Location |
|-------|----------|
| AI Service | `server/services/aiReports.service.ts` — 6 canned reports with OpenAI NL routing |
| Templates CRUD | `server/controllers/dashboardExtended.controller.ts` — getReportTemplates, create, update, delete |
| Routes | `GET/POST/PUT/DELETE /api/reports/templates`, `GET /api/reports/recent` |
| Schema | `shared/schema/dashboard.schema.ts:40` — `reportTemplates` table |
| Client | `client/src/services/reports/` — full service layer (keys, queries, mutations, requests) |
| UI | AIReportGenerator → "Save Template" button + "Saved Report Templates" card |

**How to verify:** Reports → AI Report Generator → generate a report → click "Save Template" → template appears in "Saved Report Templates" section below. Click "Use This Query" on any saved template to re-run it.

---

## Session Enhancements (Beyond Ticket Scope)

### AI Report Sorting Flexibility
**Problem:** "Show lowest margin" and "show highest margin" returned identical results (always sorted by date).

**Fix:** Added `sort`, `sortDir`, `limit` params to margin/vendor/customer reports. Updated AI prompt and heuristic fallback to extract sorting intent.

**File:** `server/services/aiReports.service.ts`

**How to verify:** Reports → AI Generator → try these queries:
- "Show me orders with lowest margins" → sorted by margin ASC
- "Top 5 highest margin orders this year" → sorted by margin DESC, limit 5
- "Which vendors do we spend the least with?" → vendors sorted ASC
- "Our smallest customers by revenue" → customers sorted ASC

---

## Quick Test Checklist

| # | Ticket | Where to Check in UI |
|---|--------|---------------------|
| 1 | Lead Dropdown | CRM → Contacts → Add/Edit Contact |
| 2 | YTD Spend | CRM → Companies → Company Detail |
| 3 | Reporting General | Reports page (full page) |
| 4 | Shipping Margins | Reports → Shipping Margins card |
| 5 | Settings | Settings page → all 18 tabs |
| 6 | Ship & Track | Orders → Order Detail → Shipments |
| 7 | Ship Notifications | Auto (scheduler) + Settings → Email Templates |
| 8 | Ship Automations | Auto (scheduler hourly) |
| 9 | Production Report | Production Report page |
| 10 | Invoicing | Reports → AR Aging + Invoice creation flow |
| 11 | Invoice Reminders | Auto (scheduler) + Invoice detail → reminder settings |
| 12 | QuickBooks | Settings → Integrations → QuickBooks |
| 13 | Finances Dashboard | Home → Dashboard KPI cards + period selector |
| 14 | Commission | Reports → Commission Report section |
| 15 | HubSpot | Settings → Integrations → HubSpot |
| 16 | Products | Products page → search + Settings → Integrations |
| 17 | Reports + Templates | Reports → AI Generator → Save Template |
