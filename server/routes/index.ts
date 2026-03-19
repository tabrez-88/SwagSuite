import type { Express } from "express";
import authRoutes from "./auth.routes";
import notificationRoutes from "./notification.routes";
import leadRoutes from "./lead.routes";
import companyRoutes from "./company.routes";
import contactRoutes from "./contact.routes";
import supplierRoutes from "./supplier.routes";
import productRoutes from "./product.routes";
import dashboardRoutes from "./dashboard.routes";
import settingsRoutes from "./settings.routes";
import activityRoutes from "./activity.routes";
import mediaLibraryRoutes from "./mediaLibrary.routes";
import userRoutes from "./user.routes";
import communicationRoutes from "./communication.routes";
import documentRoutes from "./document.routes";
import orderFileRoutes from "./orderFile.routes";
import artworkKanbanRoutes from "./artworkKanban.routes";
import shipmentRoutes from "./shipment.routes";
import vendorInvoiceRoutes from "./vendorInvoice.routes";
import approvalRoutes from "./approval.routes";
import productionRoutes from "./production.routes";
import integrationRoutes from "./integration.routes";
import dashboardExtendedRoutes from "./dashboardExtended.routes";
import invoiceRoutes from "./invoice.routes";
import vendorApprovalRoutes from "./vendorApproval.routes";
import miscRoutes from "./misc.routes";
import orderRoutes from "./order.routes";

/**
 * Register all modular route files.
 * Called from the main registerRoutes() in routes.ts.
 *
 * As routes are extracted from routes.ts, add them here.
 */
export function registerModularRoutes(app: Express) {
  // Orders & Items
  app.use(orderRoutes);

  // Auth & Users
  app.use(authRoutes);

  // CRM
  app.use(companyRoutes);
  app.use(contactRoutes);
  app.use(supplierRoutes);
  app.use(leadRoutes);

  // Products
  app.use(productRoutes);

  // Dashboard & Search
  app.use(dashboardRoutes);

  // Notifications
  app.use(notificationRoutes);

  // Settings & Branding
  app.use(settingsRoutes);

  // Activities & File Uploads
  app.use(activityRoutes);

  // Media Library
  app.use(mediaLibraryRoutes);

  // Users
  app.use(userRoutes);

  // Communications & Attachments
  app.use(communicationRoutes);

  // Documents
  app.use(documentRoutes);

  // Order Files & Proofs
  app.use(orderFileRoutes);

  // Artwork Kanban
  app.use(artworkKanbanRoutes);

  // Shipments & Portal
  app.use(shipmentRoutes);

  // Vendor Invoices (Bills)
  app.use(vendorInvoiceRoutes);

  // Approvals (Artwork, Client, Quote, PO Confirmations)
  app.use(approvalRoutes);

  // Production (Stages, Next Actions, Alerts, PO Report)
  app.use(productionRoutes);

  // Integrations (S&S, SanMar, Sage, Slack, HubSpot, etc.)
  app.use(integrationRoutes);

  // Dashboard Extended (Enhanced Stats, YTD, Team Perf, Popular/Suggested Products, Reports)
  app.use(dashboardExtendedRoutes);

  // Invoices & Payments (QuickBooks, Stripe, TaxJar)
  app.use(invoiceRoutes);

  // Vendor Approvals
  app.use(vendorApprovalRoutes);

  // Misc (Mockup Builder, Presentations, Product Comments, Cloudinary, Seed)
  app.use(miscRoutes);
}
