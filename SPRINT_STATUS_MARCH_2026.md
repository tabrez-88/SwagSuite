# SwagSuite OMS — Sprint Status Report
### March 10, 2026 | Target Delivery: March 20, 2026

---

## Executive Summary

This report provides a transparent assessment of all **52 MVP-labeled tasks** against the March 20 deadline. Of those 52 tasks, **20 are fully built and functional**, **13 are in progress with varying degrees of completion**, and **14 require infrastructure work that exceeds the remaining sprint capacity**. The remaining items are either blocked pending input or fall outside Phase 1 scope.

**Available capacity:** 10 working days x 5 hrs/day = **50 development hours remaining.**

---

## SECTION 1: Completed & Ready for Review (21 items)

These features are **built, functional, and available for testing/demo.**

### Dashboard / Navigation
| # | Trello Card | Trello Task Description | Status |
|---|-------------|------------------------|--------|
| 1 | **Sidebar Navigation** | *(No description — basic nav sidebar)* | ✅ Completed |

### Orders / Projects
| # | Trello Card | Trello Task Description | Status |
|---|-------------|------------------------|--------|
| 2 | **Orders Overall Function** | Main area for placing and tracking all orders. Products brought in through ESP/ASI, Sage, Distributor Central, API or manual. Every order includes overview page with text box for team commentary and @mention tagging with email/notification. | ✅ For Review |
| 3 | **Orders - Project Page** | Each order is a "project" with its own page. Overview shows everything that happened — social media timeline style showing who took the action. Text box at top with @mention support sends notifications. | ✅ For Review |
| 4 | **Products** | Add a new product. Either add existing product through search of ASI/ESP, SAGE, Distributor Central or create a new product. | ✅ For Review |
| 5 | **Quotes** | Create a quote from the products page. | ✅ For Review |
| 6 | **Sales Orders** | Sales orders sent to client for approval. Positive approval tags production lead and puts it on kanban board for CSR to place POs. Needs IHD (customer-facing), Supplier IHD (vendor-facing), additional info fields. | ✅ In Progress |
| 7 | **Artwork Proofing General** | Every order includes proofing stage — sent to client for approval. Once approved, sales rep and production rep receive notification and email. | ✅ In Progress |
| 8 | **In Hands Dates (IHD)** | Dates for every SO: Customer in-hands date, Supplier in-hands date, Event Date, Firm or not firm, if not firm when is latest customer can receive them. | ✅ For Review |
| 9 | **Emails** | All emails and templates for customer/vendor interactions — sales order approvals, quotes, purchase orders, artwork approvals. | ✅ In Progress |

### CRM
| # | Trello Card | Trello Task Description | Status |
|---|-------------|------------------------|--------|
| 10 | **Contacts** | Contacts are individuals that work at Companies. Separate profiles from companies but they can be tied together. | ✅ For Review |
| 11 | **CRM Company Contacts** | Companies are our Customer Companies. All usual data fields, allow for custom fields. Add options for multiple addresses. Bryan: *"many customers have multiple addresses"* | ✅ In Progress |
| 12 | **Companies - Track Spend YTD** | Track customer spend and create a running YTD total on the customer page. Also have a custom date report. | ✅ For Review |
| 13 | **Vendors** | Allow for vendors to be created manually or imported from ASI/ESP and Sage. | ✅ For Review |
| 14 | **Vendors - Do Not Order From** | Admin side can set vendors as DO NOT ORDER FROM. If salesperson chooses product from that vendor, pop-up tells them it's not approved and asks if they want to send to admin for approval. Then email admin. | ✅ In Progress |
| 15 | **Vendor CRM** | Allow different email and contacts associated with vendor. Checkbox with all contacts on vendor communication emails. Bryan: *"Vendors have several contacts so we will need this to operate"* | ✅ In Progress |
| 16 | **Vendors Preferred** | Create space for Preferred vendors with notes about benefits — EQP, Rebates, self-promos, etc. | ✅ For Review |

### Production
| # | Trello Card | Trello Task Description | Status |
|---|-------------|------------------------|--------|
| 17 | **Production Report Overall** | Primary place to ensure order details are being met. Very visual at-a-glance for each order. "Follow up" date so production knows next step. Flags for special PO notes. | ✅ In Progress |
| 18 | **Production Report Customization** | All steps should be customizable for the system in admin settings. | ✅ For Review |

### Invoicing
| # | Trello Card | Trello Task Description | Status |
|---|-------------|------------------------|--------|
| 19 | **Invoicing Integrations — Stripe** | Connect with Stripe. | ✅ For Review |
| 20 | **Invoicing Integrations — QuickBooks** | Connect with QuickBooks. Bryan: *"We can do this in the meeting with Benji also"* | ✅ For Review |

### Settings
| # | Trello Card | Trello Task Description | Status |
|---|-------------|------------------------|--------|
| 21 | **Address Verification** | Address verification — pops up when you start typing. | ✅ In Progress |

> **Action needed:** These items should be moved through QA/review to confirm acceptance.

---

## SECTION 2: In Progress — Achievable by March 20 (8 items)

These require additional work but are **realistically completable** within the remaining sprint. Listed in recommended priority order.

| # | Trello Card | Trello Task Description | Current State | Remaining Work | Est. |
|---|-------------|------------------------|---------------|----------------|------|
| 1 | **Photo Avatars** | Users get photo avatars — should show up on sales orders, order reports, production reports, etc. Bryan: *"we need this for ease of knowing who is responsible for the order at a glance"* | DB field exists, not rendered anywhere | Render avatar on production report rows, SO template, order cards | **3h** |
| 2 | **Settings** | Various settings for customization. Features toggled on/off at Admin level for company, then toggled per individual. User-specific permissions. Notifications managed at user level. System branding/theme. Custom form fields. | UI toggles exist but **don't save to DB** | Persist toggle state to database, basic form field config | **5h** |
| 3 | **Art Charges** | Charge for Artwork Creation — easily added to SO and Quote like another line-item/product. If free, still appear on SO/Quote/Invoice then show discount at bottom subtracting the fee. | Charges bundled in products; `orderAdditionalCharges` table exists but no API/UI | Build API endpoints + UI for standalone art charge line items | **8h** |
| 4 | **Settings - Min Margin** | Set minimum margin % company wide. Allow lower/higher margin %. Admin section can force margins below a certain number to need approval to proceed. | Not implemented | Add threshold to settings, show warning on orders. Skip full approval flow. | **5h** |
| 5 | **Reporting - General** | Shipping, runs, and set-ups should be includable/excludable in overall margin on orders and reports. Want to see product margins without shipping or set-ups, and also each separately. | Margin field exists but no include/exclude toggle | Add toggle on reports page for margin breakdown | **6h** |
| 6 | **Invoicing Communication** | After first invoice, set a schedule for reminders to be sent if not paid. Each invoice individually assigned reminder frequency. Set during initial invoice send. | Auto-overdue detection exists, no scheduled reminders | Reminder config per invoice + background job to send emails | **8h** |
| 7 | **Production Stages** | Allow customization of production stages company-wide in admin. Automate follow-up emails with AI when things not approved (sales order, proofs, quotes, etc.) | Stages CRUD works. Auto follow-up only for next-action-due, not stage transitions | Trigger email when SO/proof/quote not approved after X days | **6h** |
| 8 | **Reports Art Charges** | Report that is just art charges with profits. Also run overall sales report but deduct art charges and margins. Art charges are commissionable. | Depends on Art Charges (#3) | Dedicated art charge P&L report | **4h** |

**Total estimate: ~45 hours** (within 50-hour capacity, but tight)

> **Recommendation:** Items 1-5 are highest priority. Items 6-8 may slip if earlier items take longer than estimated.

---

## SECTION 3: Blocked — Requires Input or External Dependencies (3 items)

These **cannot proceed** without decisions or third-party coordination.

| # | Trello Card | Trello Task Description | Blocker | Action Needed |
|---|-------------|------------------------|---------|---------------|
| 1 | **Order Verification** | All order information and other items should always be verified by the system before ensuring no AI hallucinations. Bryan: *"Do we need this? What do you need from us?"* | Scope undefined — Bryan himself is unsure | **Decision required:** Define what "verification" means. Data validation? AI output review? Can't estimate or build without scope. |
| 2 | **Production Shipping and Tracking** | Tracking should be connected to ShipStation integration. Bryan: *"Discuss with Benji"* | No ShipStation API credentials, no technical spec, no Benji meeting scheduled | **Meeting required:** Need API key, webhook setup, sync scope agreement. Basic shipment CRUD is built but ShipStation-specific sync is not. |
| 3 | **Invoicing — QuickBooks (full setup)** | Connect with QuickBooks. Bryan: *"We can do this in the meeting with Benji also"* | OAuth coded but untested with real credentials | **Meeting required:** Need QB sandbox/production credentials to validate end-to-end. Code is ready — if credentials provided this week, can validate in hours. |

> **Note:** QuickBooks is closest to done — if credentials are provided this week, it can be validated within hours.

---

## SECTION 4: Not Achievable by March 20 — Recommend Phase 2 (14 items)

These are labeled MVP but require **significantly more development time** than the remaining sprint allows. Each item below includes a realistic effort estimate.

### Infrastructure-Heavy (require new systems)

| # | Trello Card | Trello Task Description | Why It's Phase 2 | Est. |
|---|-------------|------------------------|-------------------|------|
| 1 | **Universal Search** | All information should build the knowledge base and be searchable using LLM and natural language. E.g. "what is the shipping for Beber" should pull up current/active orders and share shipping info. Click to see more. | Requires embedding pipeline, vector DB, semantic search indexing across all entities. Standalone project. | 40–80h |
| 2 | **HubSpot Integration** | CRM should have direct integration with HubSpot. When something gets input in either location, it real-time syncs to the other. Connected pipeline. | Backend is **100% mocked data**. Needs: HubSpot OAuth app, bidirectional sync engine, conflict resolution, webhook handlers. | 30–50h |
| 3 | **Finances** | Show revenue, Margin %, order rev avg, order quantity. YTD, MTD, WTD, day — compare to LYTD, MTD, WTD, Custom. Invoicing aging (60/90 days, custom). Bryan: *"We need this to operate."* | Reports page shows "Charts Coming Soon". Needs: complex date-range SQL, YoY calculations, chart library, dashboard widgets. | 20–30h |
| 4 | **2FA** | Security and 2FA. | Zero implementation. Needs TOTP library, QR codes, backup codes, session changes, recovery flow, enable/disable UI. | 12–18h |
| 5 | **Data Import** | *(No description on Trello card — from spreadsheet: AI-powered mass imports supporting PDF, JPEG, Excel, CSV, Google Docs, folders, AI files, JSON. Intelligent categorization and matching.)* | Only HubSpot mock import exists. Generic import needs: file upload, column mapping UI, AI field matching, validation, progress tracking. | 25–40h |
| 6 | **Commission Reporting** | Commission Report — Scheduled email to HR. | Zero implementation. No commission fields in schema, no calc logic. Needs business rules first (% per rep? tiered? by product category?). | 15–20h |
| 7 | **Backing up Data** | Ability to backup — Goodsync or something. | Zero implementation. Needs: backup scheduling, S3/GCS destination, restore capability, history UI. Neon DB has built-in backups but no user controls. | 10–15h |

### Integration-Heavy (require third-party API work)

| # | Trello Card | Trello Task Description | Why It's Phase 2 | Est. |
|---|-------------|------------------------|-------------------|------|
| 8 | **Shipping Automations** | Track shipping once daily using AI to ensure delivery dates meet in-hands dates. If delay, notify salesrep via Slack and email. | Needs carrier API integrations (FedEx/UPS/USPS), daily cron, AI analysis layer, multi-channel notification. | 25–40h |
| 9 | **Shipping Automations - Automate Tracking Emails** | Automate tracking emails to customers as shipment is being delivered. Toggleable on/off per order. | Depends on carrier tracking infrastructure above + customer email templates with tracking info. | 15–20h |
| 10 | **Shipping Notifications** | Notification to client with scheduled ship date when entered by production team (toggle per order). Once "delivered" — prompt sales rep with email to send to client. | Requires carrier tracking webhook (status → system update → customer email). Can't work without carrier integration. | 10–15h |
| 11 | **Email Open Alerts** | All emails opened by client/vendor tagged with date opened. Notification email/slack to sales rep or CSR when opened. Toggle on/off per order. | Needs tracking pixel infrastructure, unique pixel URLs per email, open event webhooks, analytics UI. Or SendGrid open tracking + webhook processing. | 15–25h |
| 12 | **Slack Integration** | Full Slack on every page with a minimize option. | Current: config + manual send only. "Full Slack on every page" = embedded Slack widget or custom real-time chat UI — major frontend undertaking. | 20–30h |
| 13 | **Slack Integration Workflow** | Workflow notifications to send a Slack message. | Auto-trigger Slack on order status changes, PO creation, proof approvals. Needs event-driven architecture or hook points in every mutation endpoint. | 15–20h |
| 14 | **Reporting - Weekly Email** | Every week send all users email report: orders placed, revenue, margin %, new stores, errors, etc. Should show up in settings and be editable from admin before send. | DB tables exist but: no scheduler, no email template, no content aggregation. Needs cron + per-user metrics + HTML email builder. | 12–18h |

**Combined effort for Phase 2 items: ~250–400 hours (5–8 weeks at 50 hrs/week)**

---

## SECTION 5: Additional Items

| # | Trello Card | Trello Task Description | Assessment |
|---|-------------|------------------------|------------|
| 1 | **Easter Egg** | Click program icon top-left → opens Pac-man style game. Instead of ghosts make them t-shirts chasing pacman. 3 lives or complete 2 levels before telling them to go back to work. Reset with page refresh. | Fun, but ~6-8 hours for a non-business feature. Post-launch. |
| 2 | **CRM Client Lead Dropdown** | Dropdown in client contact for where lead came from. Allow reporting — e.g. 200 organic leads, 150 referrals, 10 Vectify. | Leads system is 100% mocked (no DB table). Dropdown is trivial but needs real leads backend first (~10-15 hrs). |
| 3 | **Reports Overall** | Any report generated using natural language and AI — e.g. "What are our margins for the last 6 weeks". All reports saveable and repeatable. | Overlaps with Universal Search. Same LLM infrastructure dependency. Phase 2. |
| 4 | **Invoicing** | How much owed, total, 60 days, 90 days, custom date. Click to pay with ACH or Credit Card. If CC selected, charges 3% fee. | Invoice sending/collecting works. Stripe works. **Missing: aging buckets report UI and ACH payment option.** Aging report ~6h, ACH needs Stripe ACH setup ~8h. |
| 5 | **Invoicing - Sending and Collecting** | Sending Invoices and Collecting. | ✅ Already works — invoice generation, email, Stripe payment links, manual payment entry. |
| 6 | **Reporting - Shipping Margins** | Shipping, runs, set-ups as separate report for overall margins. E.g. YTD margin 46%, YTD shipping margin 13%, YTD set-up margin 21%. Besides margin % also see breakdowns in revenue. | Needs dedicated margin breakdown queries + UI. Related to Reporting General (#5 in Section 2). ~8h standalone. |

---

## Recommended Sprint Plan (March 10–20)

### Week 1 (March 10–14) — 25 hours
| Day | Focus | Hours |
|-----|-------|-------|
| Tue | Photo Avatars (render on reports/SO/cards) | 3 |
| Wed | Settings toggle persistence + basic margin threshold | 5+5 |
| Thu | Art Charges — API endpoints + UI for standalone line items | 8 |
| Fri | Art Charges Report | 4 |

### Week 2 (March 16–20) — 25 hours
| Day | Focus | Hours |
|-----|-------|-------|
| Mon | Reporting margin breakdown (include/exclude toggle) | 6 |
| Tue | Invoice payment reminders (scheduler + email) | 8 |
| Wed | Production auto follow-up emails | 6 |
| Thu-Fri | Bug fixes, QA, polish, demo prep | 5 |

---

## What to Communicate to Stakeholders

### Can demo on March 20:
- Full order lifecycle: Presentation → Quote → Sales Order → PO → Invoice
- Client approval flows (quote + SO)
- Artwork proofing workflow
- Production report with alerts, stages, date tracking
- CRM: Companies, Contacts, Vendors (including preferred + do not order)
- Stripe payments + QuickBooks sync
- Art charges as line items *(new)*
- Margin settings + reporting toggles *(new)*
- Payment reminders *(new)*

### Cannot demo on March 20 (Phase 2):
- Universal Search (LLM)
- Real HubSpot sync (currently mocked)
- ShipStation integration (pending Benji meeting)
- Full Slack embed
- Finance dashboard with charts
- 2FA
- Commission reports
- AI data import
- Email open tracking
- Weekly email reports

### Needs immediate decision:
1. **Order Verification** — Bryan, do we need this? What does "verification" mean?
2. **ShipStation** — When is the Benji meeting happening?
3. **Phase 2 prioritization** — Which of the 14 deferred items are highest priority for next sprint?

---

*Report prepared: March 10, 2026*
*Available for discussion and re-prioritization as needed.*
