# CommonSKU Knowledge Base — Order Flow Reference

## Purpose
Reference document comparing CommonSKU's order flow with SwagSuite's implementation. Used to identify gaps and plan improvements.

---

## 1. CommonSKU Order Flow (SO → Completion)

### Sales Order
- SO confirms order details: products, sizes, colors, quantities, pricing, artwork, services, freight, discounts
- Client approval via **live interactive buttons** (approve/request change) — not just a static PDF
- SO **auto-locks upon invoicing**; unlock requires permission
- SO can be duplicated into shops or new projects for reorders
- Order types: Standard, Self-promo, Reorder, Overrun Samples, Client Samples
- Services (Freight, Fulfillment, Shipping, Other, Custom) added at order level with cost/margin tracking

### Purchase Orders
**Lifecycle (7 stages):**
1. **Created** — auto-assigned on PO generation
2. **Submitted** — PO emailed/faxed/uploaded to supplier (auto-transition)
3. **Confirmed** — supplier approves live PO form OR manual confirmation
4. **Shipped** — auto-updated when shipment dates recorded in Production Report
5. **Ready for Billing** — MANUAL only; indicates all invoicing info collected (tracking, costs, overages)
6. **Billed** — AUTO when invoice vouched against "Ready for Billing" PO
7. **Closed** — manual, for cancellations/backorders

**Status overlay (separate from stage):** OK | Follow Up | Problem

**Key automation:**
- When ALL POs in a project reach **Shipped** → parent SO auto-transitions to "Shipped"
- When ALL POs reach **Ready for Billing** → SO becomes "Ready to be Invoiced"
- "Billed" auto-set when invoice vouched against Ready for Billing PO

**Production Report filters:**
- **Open** = Created + Submitted + Confirmed + Shipped + Ready for Billing
- **In Production** = Created + Submitted + Confirmed only

### Proofing Process
**Proof statuses (6):**
1. **Awaiting Proof** — auto-set when PO created (if proof required)
2. **Proof Received** — auto when all proofs uploaded
3. **Pending Approval** — auto when approval form emailed to client
4. **Change Requested** — client selects "Request Change"
5. **Approved** — client approves
6. **Proofing Complete** — MANUAL; indicates supplier notified of approval

**Key workflow details:**
- Proof requirement set in SO → decoration location → proof type (Email Proof, Digital Photo, Pre-production)
- PO must be **regenerated** after setting proof requirement to activate proofing
- Proof approval form is a **live link** (always updating) — client can enlarge, download, comment, approve/reject
- Proofs are **private** between distributor and client (suppliers never see the live proof form)
- After client approves, distributor manually notifies supplier and marks "Proofing Complete"
- Both order rep and production rep get email notifications on client actions

### Shipping & Fulfillment
**Three fulfillment methods:**
1. **Custom Fulfillment Product** — separate POs for supplier→fulfillment and fulfillment→client
2. **Decoration Location Method** — fulfillment as imprint method with run/fixed charges
3. **Service PO** — for multi-leg chains (Supplier → Decorator → Fulfillment → Client)

**Shipping configuration (per product in SO):**
- In-hands/shipping dates (mark as "Firm" if needed)
- Shipping account type: Client's, Supplier's, Our Account, Other
- Shipping method and courier
- Destination: Client, Decorator, Other Supplier, Fulfillment warehouse
- Supplier/Decorator notes

**PO generation** creates separate POs per shipping leg automatically.

### Service Charges
- 5 types: Freight, Fulfillment, Shipping, Other Service, Custom Service
- Added at order level (not per line item)
- Each has: description, quantity, unit cost, margin/retail, tax
- Admin controls whether freight/fulfillment/shipping charges included in margin calculations

---

## 2. SwagSuite Current Implementation — What We Have

### Sales Order ✅
- SO document generation with PDF snapshot
- Client approval via public link (`/client-approval/:token`) — approve/decline
- Auto-sets `salesOrderStatus: "pending_client_approval"` after sending
- Payment terms, customer PO, firm/rush flags
- Supplier IHD + Event Date fields with timeline conflict detection
- Lock system: SO locks when `ready_to_invoice`, unlockable

### Purchase Orders ✅
- Same 7 stages as CommonSKU: Created → Submitted → Confirmed → Shipped → Ready for Billing → Billed → Closed
- Status overlay: OK / Follow Up / Problem
- Email to vendor with auto-transition to "submitted"
- Manual stage transitions via dropdown
- Stale detection with items hash (includes firm/rush flags)
- Shipping address validation before PO generation

### Proofing ✅
- 7 statuses: Pending → Awaiting Proof → Proof Received → Pending Approval → Approved → Change Requested → Proofing Complete
- Proof upload via FilePickerDialog
- Send proof to client with approval link
- SO Artwork tab is view-only; proofing actions live in PO section

### Shipping ✅
- Shipment CRUD per order
- Carrier tracking (UPS, FedEx, USPS, DHL, Freight, Local, Other)
- Status tracking: Pending → Shipped → In Transit → Delivered → Returned
- Date context card showing Customer IHD, Supplier IHD, Event Date
- Timeline conflict warnings

### Invoice ✅
- Auto-creation with tax calculation (TaxJar)
- QuickBooks sync
- Statuses: Pending → Paid / Overdue / Cancelled
- Auto-overdue detection (hourly scheduler)
- Stripe payment integration

### Auto-Lock ✅
- Quote locks at SO stage, SO locks at invoice, Invoice locks when paid
- Unlock overrides in JSONB, auto-relock on certain transitions
- Server-side enforcement with 403 responses

---

## 3. GAP ANALYSIS — What's Different / Missing

### 🔴 Critical Gaps

#### 3.1 PO → SO Auto-Transition (NOT IMPLEMENTED)
**CommonSKU**: When ALL POs reach "Shipped" → SO auto-becomes "Shipped". When ALL POs reach "Ready for Billing" → SO becomes "Ready to be Invoiced".
**SwagSuite**: SO status transitions are ALL manual. No automation based on aggregate PO state.
**Impact**: User must manually track when all vendors have shipped and update SO status. Error-prone.

#### 3.2 PO "Billed" Auto-Transition (NOT IMPLEMENTED)
**CommonSKU**: PO auto-transitions to "Billed" when an invoice is vouched (matched) against it.
**SwagSuite**: "Billed" is a manual transition. No invoice↔PO vouching system exists. The Bills section exists but isn't linked to PO stage transitions.
**Impact**: No automatic reconciliation between vendor bills and POs.

#### 3.3 Proof Requirement at SO Level (NOT IMPLEMENTED)
**CommonSKU**: Proof types (Email Proof, Digital Photo, Pre-production) set per decoration location in the SO. PO must be regenerated to activate proofing.
**SwagSuite**: Proofing is always available in PO section regardless of SO configuration. No formal "proof required" flag per decoration.
**Impact**: No way to distinguish which items need proofs vs. which don't. All items show proofing controls.

#### 3.4 Live Proof Approval Form (PARTIALLY IMPLEMENTED)
**CommonSKU**: Proof approval is a **live, always-updating link** — client can enlarge images, download files, view comments, and approve/reject all in real-time.
**SwagSuite**: Proof approval uses a basic approval token → approve/decline flow. No live updating, no comment system, no image enlargement.
**Impact**: Less interactive client experience for proof review.

### 🟡 Important Gaps

#### 3.5 Service Charges System ✅ IMPLEMENTED
**CommonSKU**: Dedicated service types (Freight, Fulfillment, Shipping, Other, Custom) with cost/margin tracking, tax support, admin margin controls.
**SwagSuite**: `orderServiceCharges` table with 6 charge types, cost/price/margin tracking, taxable flag, margin inclusion control. CRUD endpoints + UI in SalesOrderSection "Services" tab. Included in SO and Quote PDF templates.

#### 3.6 Multi-Leg Shipping / Fulfillment POs (NOT IMPLEMENTED)
**CommonSKU**: Supports multi-leg shipping chains (Supplier → Decorator → Fulfillment → Client) with separate POs per leg, auto-generated.
**SwagSuite**: Single-leg shipping only. One PO per vendor. No fulfillment routing or multi-destination PO generation.
**Impact**: Can't handle orders that go through decoration or fulfillment before reaching client.

#### 3.7 Per-Product Shipping Configuration ✅ IMPLEMENTED
**CommonSKU**: Each product in SO has individual shipping config: destination, account type, courier, ship method, dates.
**SwagSuite**: `shippingDestination`, `shippingAccountType`, `shippingMethodOverride`, `shippingNotes` fields on orderItems. Editable in ProductsSection edit dialog.

#### 3.8 Supplier Live PO Confirmation (NOT IMPLEMENTED)
**CommonSKU**: Suppliers can approve POs via live forms (auto-confirms). For non-integrated suppliers, manual confirmation.
**SwagSuite**: All PO confirmations are manual. No vendor portal or live PO acceptance.
**Impact**: Extra manual work to track vendor confirmations.

#### 3.9 Production Report PO Filters (PARTIALLY IMPLEMENTED)
**CommonSKU**: Two composite filters: "Open" (all non-closed/billed) and "In Production" (created+submitted+confirmed).
**SwagSuite**: Production report has date range filters and priority sorting, but no PO-stage-based filters like "Open" and "In Production".
**Impact**: Harder to filter production report by PO lifecycle state.

#### 3.10 PO "Shipped" Auto-Detection (NOT IMPLEMENTED)
**CommonSKU**: PO auto-transitions to "Shipped" when shipment dates are recorded in Production Report.
**SwagSuite**: PO "Shipped" is a manual dropdown transition. No link between shipment records and PO stage.
**Impact**: Shipment tracking and PO stage are disconnected — must update both manually.

### 🟢 Minor Gaps / Nice-to-Haves

#### 3.11 Order Types (NOT IMPLEMENTED)
**CommonSKU**: Multiple SO types (Standard, Self-promo, Reorder, Overrun Samples, Client Samples).
**SwagSuite**: Single order type. Could be useful for internal sample orders.

#### 3.12 SO Copy/Reorder (NOT IMPLEMENTED)
**CommonSKU**: Duplicate SO into shops or new projects for reorders.
**SwagSuite**: No order duplication feature.

#### 3.13 Invoice Vouching (NOT IMPLEMENTED)
**CommonSKU**: Invoices vouched against POs (matching vendor bills to POs).
**SwagSuite**: Bills section exists but operates independently from PO stages.

#### 3.14 Custom Service Type (Admin Setting)
**CommonSKU**: Admin can configure one custom service type available as standard option.
**SwagSuite**: No admin-configurable service types.

---

## 4. RECOMMENDED IMPROVEMENTS (Priority Order)

### Phase 1 — Core Automation (High Impact, Moderate Effort)
1. **PO → SO auto-transition**: When all POs hit "Shipped" → auto-set SO to "Shipped". When all POs hit "Ready for Billing" → auto-set SO to "Ready to be Invoiced". This is the single most impactful improvement.
2. **PO → Shipment link**: When a shipment is created/marked as shipped for a vendor, auto-update that vendor's PO to "Shipped" stage.
3. **Bill → PO "Billed" link**: When a vendor bill is recorded against a PO, auto-transition PO to "Billed".

### Phase 2 — Proofing Improvements (Medium Impact)
4. **Proof required flag**: Add proof type selector per decoration location in SO. Only show proofing controls in PO section for items that require proofs.
5. **Enhanced proof approval page**: Upgrade the approval page with image zoom, comment thread, and real-time updates.

### Phase 3 — Service Charges & Shipping (Medium Impact, Higher Effort)
6. **Service charges system**: Add formal service line items (Freight, Fulfillment, Shipping, Other) with cost/margin tracking.
7. **Per-product shipping config**: Allow different products to ship to different destinations.
8. **Multi-leg PO generation**: Support Supplier → Decorator → Client routing.

### Phase 4 — Quality of Life
9. **Production Report PO filters**: Add "Open" and "In Production" composite filters.
10. **SO duplication/reorder**: Copy existing SO to new project.
11. **Vendor portal for PO confirmation**: Allow vendors to confirm POs via link.

---

## 5. REFERENCE: Status/Stage Maps

### SO Status Flow
```
new → pending_client_approval → client_approved → in_production → shipped → ready_to_invoice
                               ↘ client_change_requested → (back to pending_client_approval)
```

### PO Stage Flow
```
created → submitted → confirmed → shipped → ready_for_billing → billed → closed
```

### Proofing Status Flow
```
pending → awaiting_proof → proof_received → pending_approval → approved → proofing_complete
                                           ↘ change_requested ↗ (cycle)
```

### Invoice Status Flow
```
pending → paid
        → overdue (auto, hourly) → paid
        → cancelled
```

### Business Stage Pipeline
```
presentation → quote → sales_order → invoice
```
