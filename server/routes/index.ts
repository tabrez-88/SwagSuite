import type { Express } from "express";
import authRoutes from "./auth.routes";
import notificationRoutes from "./notification.routes";
import leadRoutes from "./lead.routes";
import companyRoutes from "./company.routes";
import companyAddressRoutes from "./company-address.routes";
import contactRoutes from "./contact.routes";
import supplierRoutes from "./supplier.routes";
import supplierAddressRoutes from "./supplier-address.routes";
import productRoutes from "./product.routes";
import dashboardRoutes from "./dashboard.routes";
import settingsRoutes from "./settings.routes";
import activityRoutes from "./activity.routes";
import mediaLibraryRoutes from "./mediaLibrary.routes";
import userRoutes from "./user.routes";
import communicationRoutes from "./communication.routes";
import documentRoutes from "./document.routes";
import projectFileRoutes from "./projectFile.routes";
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
import projectRoutes from "./project.routes";
import decoratorMatrixRoutes from "./decoratorMatrix.routes";
import taxRoutes from "./tax.routes";
import paymentTermsRoutes from "./paymentTerms.routes";

/**
 * Register all modular route files.
 * Called from the main registerRoutes() in routes.ts.
 *
 * As routes are extracted from routes.ts, add them here.
 */
export function registerModularRoutes(app: Express) {
  // Projects & Items
  app.use(projectRoutes);

  // Auth & Users
  app.use(authRoutes);

  // CRM
  app.use(companyRoutes);
  app.use(companyAddressRoutes);
  app.use(contactRoutes);
  app.use(supplierRoutes);
  app.use(supplierAddressRoutes);
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

  // Project Files & Proofs
  app.use(projectFileRoutes);

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

  // Tax Codes
  app.use(taxRoutes);

  // Payment Terms
  app.use(paymentTermsRoutes);

  // Vendor Approvals
  app.use(vendorApprovalRoutes);

  // Misc (Mockup Builder, Presentations, Product Comments, Cloudinary, Seed)
  app.use(miscRoutes);

  // Decorator Matrix (pricing lookup per vendor)
  app.use(decoratorMatrixRoutes);
}
