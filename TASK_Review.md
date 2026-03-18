TABREZ TO DO (4 task) — Semua memang belum

  ┌────────────────────────┬────────────┬──────────────────────────────────────────────────────────────────────────┐
  │          Task          │   Status   │                                  Detail                                  │
  ├────────────────────────┼────────────┼──────────────────────────────────────────────────────────────────────────┤
  │ Backing up Data     B  │ ❌ Belum │ Z│ Zero implnmentasi           │                                            │
  ├────────────────────────┼────────────┼──────────────────────────────────────────────────────────────────────────┤
  │ Shipping Notifications │ ❌ Belum │ T│ Tidak  da notkfikasi ke client                                           │
  ├────────────────────────┼────────────┼──────────────────────────────────────────────────────────────────────────┤
  │ Shipping Automations   │ ❌ Belum │ T│ Tidak  da AI tracking       │                                            │
  ├────────────────────────┼────────────┼──────────────────────────────────────────────────────────────────────────┤
  │ Reporting              │ ⚠️ Partial │ Production report ada, tapi export Excel/PDF belum jalan, AR aging belum │
  └────────────────────────┴────────────┴──────────────────────────────────────────────────────────────────────────┘

  ---
  IN PROGRESS (22 task) — Revisi besar-besaran

  Benar-benar sudah FULL ✅

  ┌───────────────────────────┬─────────────────────────────────────────────────────────────┐
  │           Task            │                         Keterangan                          │
  ├───────────────────────────┼─────────────────────────────────────────────────────────────┤
  │ Replicate CommonSKU Setup │ Sales workflow, PO stages, proofing, approval — semua jalan │
  ├───────────────────────────┼─────────────────────────────────────────────────────────────┤
  │ CRM Company Contacts      │ Company pages, multiple addresses, custom fields — jalan    │
  ├───────────────────────────┼─────────────────────────────────────────────────────────────┤
  │ Sales Orders              │ SO → client approval → production — full end-to-end         │
  ├───────────────────────────┼─────────────────────────────────────────────────────────────┤
  │ Artwork Proofing General  │ Proofing workflow, client approval page, zoom/rotate — full │
  ├───────────────────────────┼─────────────────────────────────────────────────────────────┤
  │ Production Report Overall │ Visual report, priority badges, date filters — jalan        │
  └───────────────────────────┴─────────────────────────────────────────────────────────────┘

  TERNYATA PARTIAL / BROKEN ⚠️ (sebelumnya saya bilang full)

  ┌───────────────┬───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐   
  │     Task      │                                                          Masalah                                                          │   
  ├───────────────┼───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤   
  │ Vendors - Do  │ ⚠️ Field & UI ada, tapi ZERO enforcement! Toggle doNotOrder ada, vendor approval page ada, tapi waktu add product dari    │   
  │ Not Order     │ vendor yg di-block → tidak ada warning/blocking sama sekali. Endpoint /api/vendor-approvals/check/:supplierId ada tapi    │   
  │               │ tidak pernah dipanggil dari client. Fitur ini orphaned.                                                                   │   
  ├───────────────┼───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤   
  │ Photo Avatars │ ⚠️ Upload & display di beberapa tempat jalan, tapi TIDAK tampil di Production Report, PDF documents (Quote/SO/PO), dan    │   
  │               │ Kanban cards. Type TeamMember juga missing profileImageUrl. Belum sesuai requirement.                                     │   
  ├───────────────┼───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤   
  │ Settings      │ ⚠️ Branding & Integration settings jalan, tapi Feature Toggles BROKEN — endpoint /api/admin/settings tidak exist,         │   
  │               │ perubahan hilang saat refresh. General settings (timezone, currency, margin) tidak persist.                               │   
  ├───────────────┼───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤   
  │ Production    │ ✅ DONE — Unified with PO stages (CommonSKU-style). useProductionStages() hook used in PurchaseOrdersSection, PODetailPanel,  │
  │ Stages        │ production-report, OverviewSection. Admin Settings UI with proper dialogs (add/edit/reset). Stages customizable.           │
  │               │ Overview derives progress from PO documents. → FOR REVIEW                                                                 │   
  ├───────────────┼───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤   
  │ Vendor CRM    │ ✅ DONE — Unified EmailComposer + vendor contact checkbox, ad-hoc email, multi-contact per vendor. → FOR REVIEW           │
  │               │                                                                                                                           │
  ├───────────────┼───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤   
  │ Universal     │ ⚠️ BUKAN AI search walaupun endpoint namanya /api/search/ai. Cuma substring matching biasa. Anthropic SDK imported tapi   │   
  │ Search        │ tidak dipakai untuk search. UI misleading ("Try natural language queries...") tapi tidak support NLP.                     │   
  ├───────────────┼───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤   
  │ Emails        │ ✅ DONE — All 9 email points use unified EmailComposer (From/To/CC/BCC/Subject/Body + contacts). → FOR REVIEW             │
  ├───────────────┼───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤   
  │               │ ⚠️ Create invoice jalan, tapi: tidak ada Invoice PDF template, tidak ada Send Invoice email, tidak ada payment UI (Stripe │   
  │ Invoicing     │  endpoint ada tapi button-nya tidak ada di InvoiceSection), manual payment recording ada di API tapi tidak ada UI, AR     │   
  │               │ aging 30/60/90 tidak ada                                                                                                  │   
  ├───────────────┼───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤   
  │ Reports       │ ⚠️ AIReportGenerator ada tapi bukan AI sebenarnya                                                                         │   
  │ Overall       │                                                                                                                           │   
  ├───────────────┼───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤   
  │ Finances      │ ⚠️ YTD/MTD/WTD revenue dashboard belum ada                                                                                │   
  └───────────────┴───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘   

  Belum Terimplementasi ❌                                                                                                                       ─

  ┌──────────────────────────────┬─────────────────────────────────────────────────────────────────────────────────┐
  │             Task             │                                     Detail                                      │
  ├──────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
  │ Settings - Min Margin     T  │ ❌ Tidak ada enforcement, field tidak persist │                                  │
  ├──────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
  │ Reporting - Shipping Margins │ ❌ Tidak ada                                  │                                  │
  ├──────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
  │ CRM Client Lead Dropdown     │ ❌ Backend MOCK data — leads endpoint return hardcoded data, tidak ada DB table │
  ├──────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
  │ Invoicing Communication      │ ❌ Scheduled reminders tidak ada, no "Send Reminder" button                     │
  ├──────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
  │ 2FA                          │ ❌ Zero implementasi                                                            │
  ├──────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
  │ Reporting - General          │ ❌ Margin include/exclude shipping belum                                        │
  └──────────────────────────────┴─────────────────────────────────────────────────────────────────────────────────┘

  ---
  FOR REVIEW (16 task) — Revisi status

  Benar-benar FULL ✅

  ┌─────────────────────────────┬──────────────────────────────────────────────────────────────────────────────────┐
  │            Task             │                                    Keterangan                                    │
  ├─────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────┤
  │ Easter Egg     P         P  │ ✅ Pac-Man game full (548 lines!), 2 levels, leaderboard, wired ke logo click │   │
  ├─────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────┤
  │ Address Verification     G  │ ✅ Geoapify API, dipakai di 11 lokasi (company, vendor, order, contact)       │   │
  ├─────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────┤
  │ Companies - Track Spend YTD │ ✅ Calculated dari actual orders, tampil di company page                      │   │
  ├─────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────┤
  │ Contacts                    │ ✅ Full CRUD, tied to companies                                               │   │
  ├─────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────┤
  │ Vendors                     │ ✅ Manual + import                                                            │   │
  ├─────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────┤
  │ Vendors Preferred           │ ✅ isPreferred toggle, benefits tracking (EQP, rebates, 11 field), dedicated tab │
  ├─────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────┤
  │ Orders Overall Function     │ ✅ Projects page, list/kanban, integrations                                      │
  ├─────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────┤
  │ Orders - Project Page       │ ✅ Full project detail, overview, semua sections                                 │
  ├─────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────┤
  │ Products                    │ ✅ Search + manual + sync                                                        │
  ├─────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────┤
  │ Quotes                      │ ✅ Quote creation, PDF, client approval                                          │
  ├─────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────┤
  │ In Hands Dates (IHD)        │ ✅ Customer/Supplier IHD, Event Date, Firm/Rush, timeline warnings               │
  └─────────────────────────────┴──────────────────────────────────────────────────────────────────────────────────┘

  BELUM FULL — Jangan pindah ke Completed ⚠️❌                                                                                                    ─

  ┌────────────────────┬─────────┬───────────────────────────────────────────────────────────────────────────────────────────────────────────┐    
  ┌────────────────────────┬──────────┬───────────────────────────────────────────────────────────────────────────────────────────────────────┐   
  ┌────────────────────────┬────────────┬────────────────────────────────────────────────────────────────────────────────────────────────────┐    
  ┌─────────────────────────┬─────────────┬───────────────────────────────────────────────────────────────────────────────────────────────────┐   
  │          Task           │   Status    │                                              Masalah                                              │   
  ├─────────────────────────┼─────────────┼───────────────────────────────────────────────────────────────────────────────────────────────────┤   
  │ Slack Integration       │ ⚠️ BROKEN   │ UI (SlackSidebar, SlackPanel) ada tapi endpoint mismatch — client panggil /api/slack/* yang tidak │    
  │                         │             │  exist, backend punya /api/integrations/slack/*. Tidak bisa kirim/terima pesan.                   │   
  ├─────────────────────────┼─────────────┼───────────────────────────────────────────────────────────────────────────────────────────────────┤   
  │ Slack Integration       │ ❌ Belum│  ││ Notffication scheduler tida  krrim ke Slack                                                       │     │ Workflow               │            │                                                                                                    │    
  │ Workflow                │             │                                                                                                   │   
  ├─────────────────────────┼─────────────┼───────────────────────────────────────────────────────────────────────────────────────────────────┤   
  │ Invoicing - Sending and │ ⚠️ Partial  │ Create invoice ✓, tapi tidak bisa send email, tidak ada PDF, tidak bisa collect payment dari UI   │    
  │  Collecting             │             │                                                                                                   │   
  ├─────────────────────────┼─────────────┼───────────────────────────────────────────────────────────────────────────────────────────────────┤   
  │ Invoicing Integrations  │ ⚠️ Backend  │ stripeService.ts full tapi tidak ada payment UI, tidak ada 3% CC fee, tidak ada ACH               │    
  │ Stripe                  │ only        │                                                                                                   │   
  ├─────────────────────────┼─────────────┼───────────────────────────────────────────────────────────────────────────────────────────────────┤   
  │ Production Report       │ ✅ DONE     │ Unified stages, dynamic from DB, used in production report + PO section + Overview → FOR REVIEW    │   ─  │ Customization           │             │                                                                                                   │   
  └─────────────────────────┴─────────────┴───────────────────────────────────────────────────────────────────────────────────────────────────┘   

  ---
  RINGKASAN FINAL (Akurat)

  ┌─────────────────────────────────────────┬──────────┐
  │                Kategori                 │  Jumlah  │
  ├─────────────────────────────────────────┼──────────┤
  │ ✅ Benar-benar implemented & functional │ ~18 task │
  ├─────────────────────────────────────────┼──────────┤
  │ ⚠️ Partial / Broken / Orphaned          │ ~16 task │
  ├─────────────────────────────────────────┼──────────┤
  │ ❌ Belum implemented                    │ ~8 task  │
  └─────────────────────────────────────────┴──────────┘

  Yang paling kritis untuk di-fix (ada infrastructure tapi broken/disconnected):

  1. Vendor Do Not Order — enforcement belum connected ke add product flow
  2. Settings Feature Toggles — endpoint tidak exist, perubahan hilang
  3. Slack Integration — endpoint path mismatch
  4. Invoice system — tidak bisa send/collect dari UI
  5. Production Stages — full infra tapi never used
  6. Universal Search — bukan AI, cuma substring match


  ---
  Lokasi Changes

  Files Baru:

  1. client/src/components/modals/SendInvoiceDialog.tsx — Dialog kirim invoice via email
  2. migrations/0029_add_company_settings.sql — Migration tabel company_settings
  3. migrations/0030_add_leads_table.sql — Migration tabel leads
  4. client/src/hooks/useNextActionTypes.ts — Hook + types untuk Next Action Types (CRUD + query)
  5. migrations/0033_next_action_types.sql — Migration tabel next_action_types + orders.next_action_type
  6. client/src/lib/productionStages.ts — Rewritten: unified PO stage IDs, dynamic helpers

  Files Yang Di-edit:

  ┌──────────────────────────────────────────────────────────────┬──────────────────────────────────────────────────────────────────────────┐     
  │                             File                             │                                Perubahan                                 │     
  ├──────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────┤     
  │ client/src/pages/project-detail/sections/InvoiceSection.tsx  │ Full rewrite — PDF generation, send invoice, manual payment, Stripe link │     
  ├──────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────┤     
  │ client/src/components/documents/InvoiceTemplate.tsx          │ Invoice PDF template (sudah dibuat sebelumnya)                           │     
  ├──────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────┤     
  │ client/src/hooks/useDocumentGeneration.ts                    │ Support "invoice" document type + invoiceDocuments                       │     
  ├──────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────┤     
  │ server/routes.ts                                             │ PATCH /api/orders/:id/invoice endpoint baru                              │     
  ├──────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────┤     
  │ server/storage.ts                                            │ Methods: companySettings, leads CRUD                                     │     
  ├──────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────┤     
  │ shared/schema.ts                                             │ Tables: companySettings, leads                                           │     
  ├──────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────┤     
  │ client/src/pages/settings.tsx                                │ Production stages + Next Action Types admin UI (dialogs)                 │
  ├──────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────┤
  │ client/src/pages/project-detail/sections/OverviewSection.tsx │ PO-derived production progress, dynamic stages                           │
  ├──────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────┤
  │ client/src/pages/production-report.tsx                       │ Dynamic stages, Next Action column, avatars, unified layout               │
  ├──────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────┤
  │ client/src/components/production/PODetailPanel.tsx           │ Dynamic stages, editable Next Action card (type/date/notes)               │
  ├──────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────┤
  │ client/src/components/sections/PurchaseOrdersSection.tsx     │ Dynamic stages from useProductionStages hook                              │
  ├──────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────┤
  │ server/routes.ts                                             │ Next Action Types CRUD, nextActionType in PO report, production endpoint  │
  ├──────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────┤
  │ server/storage.ts                                            │ Next Action Types CRUD + seed defaults (9 types)                          │
  ├──────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────┤
  │ shared/schema.ts                                             │ next_action_types table, orders.nextActionType column                     │     
  ├──────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────┤     
  │ client/src/components/sections/AddProductPage.tsx            │ supplierId propagation untuk vendor do-not-order                         │     
  ├──────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────┤     
  │ client/src/pages/crm/leads.tsx*                              │ Pakai real DB (bukan mock lagi)                                          │     
  └──────────────────────────────────────────────────────────────┴──────────────────────────────────────────────────────────────────────────┘     

  ---
  Cara Testing

  1. Jalankan Migrations Dulu

  npx drizzle-kit migrate
  Ini apply 0029_add_company_settings.sql dan 0030_add_leads_table.sql.

  2. Start Dev Server

  npm run dev

  3. Test Per Feature:

  Invoice PDF + Send Invoice (Task #6 & #7)

  1. Buka project yang sudah punya Sales Order → masuk ke tab Invoice
  2. Klik "Create Invoice" — harusnya bikin invoice dengan kalkulasi tax + total
  3. Setelah invoice muncul, klik "Generate Invoice PDF" — harusnya generate PDF dengan template ungu
  4. Setelah PDF ada: test Preview, Download, Regenerate
  5. Klik "Send Invoice" — dialog email muncul, isi email dan send
  6. Di bagian Payment:
    - Klik "Generate Stripe Payment Link" — (butuh Stripe configured, kalau gak ada harusnya muncul error "Stripe not configured")
    - Klik "Record Manual Payment" — pilih method (Check/Wire/dll), isi reference, klik Record Payment → invoice status harusnya jadi PAID        

  Production Stages + Next Action Types (Task #5)

  1. Buka Settings → tab Production
  2. Production Stages: ada list stages (unified PO stages), bisa add/edit/delete/reset
  3. Next Action Types: ada list action types di bawah stages, bisa add/edit/delete/reset
  4. Buka project detail → Overview section → harusnya ada progress bar dari PO documents
  5. Buka Production Report → klik row PO → side panel "Next Action" card:
     - Pilih Action Type dari dropdown → harusnya tersimpan
     - Set Action Date → harusnya tersimpan + badge overdue kalau lewat
     - Isi Notes → blur → harusnya tersimpan
  6. Di tabel Production Report → kolom "Next Action" harusnya tampil badge + date

  Feature Toggles & Settings (Task #4)

  1. Buka Settings → tab Features
  2. Toggle on/off features → refresh page → harusnya tetap saved
  3. Tab General → ubah settings → harusnya persist setelah refresh

  CRM Leads (Task #8)

  1. Buka CRM → Leads
  2. Add new lead → harusnya tersimpan di DB (bukan mock)
  3. Refresh page → data harusnya masih ada
  4. Edit dan delete lead → harusnya working

  Vendor Do Not Order (Task #3)

  1. Set vendor/supplier sebagai "Do Not Order" di vendor settings
  2. Coba tambah product dari vendor tersebut ke order → harusnya di-block dengan error 403

  User Avatars (Task #2)

  1. Buka Production Report → harusnya ada kolom "Assigned" dengan avatar user

  Slack Bridge (Task #1)

  1. Buka project detail → Slack sidebar → harusnya bisa sync/send messages (butuh Slack configured)

  ---
  Quick Smoke Test (Yang Paling Penting):

  Yang paling berdampak besar dan gampang di-test tanpa external services:

  1. Invoice flow: Create Invoice → Generate PDF → Preview → Record Manual Payment ✅
  2. CRM Leads: Add → Edit → Delete → Refresh (data persists) ✅
  3. Settings persistence: Toggle features → Refresh → Still saved ✅
  4. Production Stages: Settings > Production tab → Overview section progress bar ✅



  Berdasarkan deskripsi Trello yang sudah saya baca dan cross-check dengan implementasi:

  Bisa Move ke For Review:

  ┌────────────────────────┬──────────────┬──────────────────────────────────────────────────────────────────────────────────────────────────┐    
  │         Tiket          │    List      │                                              Alasan                                              │    
  │                        │   Sekarang   │                                                                                                  │    
  ├────────────────────────┼──────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────┤    
  │ Invoicing              │ In Progress  │ Create, PDF, send email, manual payment, Stripe link, 3% CC surcharge, aging indicator — core    │    
  │                        │              │ flow lengkap                                                                                     │    
  ├────────────────────────┼──────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────┤    
  │ Photo Avatars          │ In Progress  │ Upload UI di settings, tampil di SO/Quote PDF, production report                                 │    
  ├────────────────────────┼──────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────┤    
  │ Vendors - Do Not Order │ In Progress  │ Popup dialog approval request ke admin, server enforcement                                       │    
  ├────────────────────────┼──────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────┤    
  │ Production Stages      │ In Progress  │ Unified with PO stages (CommonSKU-style), customizable in admin settings, dynamic in Overview,   │
  │                        │              │ production report, PO section, PODetailPanel. Next Action Types: customizable dropdown + date +  │
  │                        │              │ notes per PO, editable in side panel, shown in report table, admin CRUD in Settings.             │    
  ├────────────────────────┼──────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────┤    
  │ Invoicing              │ In Progress  │ Template-based follow-up reminders otomatis untuk pending approvals                              │    
  │ Communication          │              │                                                                                                  │    
  ├────────────────────────┼──────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────┤    
  │ CRM Client Lead        │ In Progress  │ Real DB, CRUD, source field                                                                      │
  │ Dropdown               │              │                                                                                                  │
  ├────────────────────────┼──────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ Vendor CRM             │ For Review   │ Unified EmailComposer + vendor contact checkbox selection, ad-hoc email, multi-contact per       │
  │                        │              │ vendor. PO email fetches vendor contacts, pre-checks receiveOrderEmails.                         │
  ├────────────────────────┼──────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ Emails (Unified)       │ In Progress  │ All 9 email sending points refactored to unified EmailComposer — full fields (From/FromName/    │
  │                        │              │ To/ToName/CC/BCC/Subject/Body), contact selection checkboxes, ad-hoc email, compose/preview.    │
  ├────────────────────────┼──────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ Sales Orders           │ In Progress  │ Full end-to-end: SO → client approval → notifications → kanban → IHD/Event Date/Supplier Notes  │
  │                        │              │ — semua requirement verified complete                                                            │
  └────────────────────────┴──────────────┴──────────────────────────────────────────────────────────────────────────────────────────────────┘

  Belum Bisa Move (masih ada gap):

  ┌──────────────────────────────┬────────────────────────────────────────────────────────────────────────────────────┐
  │            Tiket             │                                        Gap                                         │
  ├──────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────┤
  │ Settings                     │ Baru feature toggles — belum per-user toggle, custom form fields, user permissions │
  ├──────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────┤
  │ Settings - Min Margin        │ Ada field di DB/UI tapi belum ada enforcement (block/approval kalau margin rendah) │
  ├──────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────┤
  │ Reporting - General          │ Belum ada reporting exclude/include shipping/setup dari margin                     │
  ├──────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────┤
  │ Reporting - Shipping Margins │ Belum ada breakdown report shipping/setup margin terpisah                          │
  ├──────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────┤
  │ Finances                     │ Belum ada revenue/margin dashboard YTD/MTD/WTD                                     │
  └──────────────────────────────┴────────────────────────────────────────────────────────────────────────────────────┘

  Mau saya move 6 tiket itu ke For Review via Trello sekarang?


   Invoice System

  - Invoice PDF generation + send to client via email
  - Manual payment recording (check/wire/ACH/card/cash/credit)
  - Stripe payment link with automatic 3% credit card surcharge
  - Invoice aging indicator (30/60/90+ days overdue color-coded)

  Vendor Do Not Order

  - Approval popup dialog when adding product from a blocked vendor
  - "Request Approval" flow to admin instead of hard block

  Photo Avatars

  - Profile photo upload in Settings
  - Sales Rep photo + name displayed on Quote & Sales Order PDFs

  Production Stages (CommonSKU-style Unified)

  - Production stages = PO stages (unified, single source of truth)
  - Customizable in admin Settings (add/edit/delete/reset) with proper dialogs
  - Dynamic stages used in: Overview progress bar, PO section, PODetailPanel, Production Report
  - Next Action Types: customizable follow-up action dropdown per PO (admin CRUD in Settings)
  - Next Action editable in PODetailPanel side panel (type dropdown + date picker + notes)
  - Next Action column in Production Report table (badge + date + overdue indicator)
  - Existing notification scheduler sends reminders when action date is due
  - DB: next_action_types table + orders.next_action_type column (migration 0033)

  Follow-up Reminders

  - Automated follow-up emails for pending quote/SO/proof approvals after 3 days with no response

  CRM Leads

  - Replaced mock data with real database — full CRUD operations

  Settings

  - Feature toggles with database persistence

  Slack

  - Server bridge endpoints wired up to existing Slack sidebar/panel UI