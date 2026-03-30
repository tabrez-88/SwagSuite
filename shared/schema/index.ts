// Barrel export - re-exports everything so imports from "@shared/schema" still work

// Core
export * from './session.schema';
export * from './user.schema';

// CRM
export * from './company.schema';
export * from './company-address.schema';
export * from './contact.schema';
export * from './lead.schema';
export * from './client.schema';
export * from './supplier.schema';
export * from './supplier-address.schema';

// Products
export * from './product.schema';

// Orders
export * from './order.schema';
export * from './orderFile.schema';

// Artwork
export * from './artwork.schema';
export * from './artworkKanban.schema';
export * from './decoratorMatrix.schema';

// Documents & Approvals
export * from './document.schema';

// Invoices & Payments
export * from './invoice.schema';
export * from './vendorInvoice.schema';
export * from './vendorApproval.schema';

// Shipping
export * from './shipment.schema';

// Activities
export * from './activity.schema';
export * from './dataUpload.schema';

// Portal
export * from './portal.schema';

// Presentations
export * from './presentation.schema';

// Production
export * from './production.schema';

// Sequences
export * from './sequence.schema';

// Integration & Settings
export * from './integration.schema';
export * from './settings.schema';

// Media Library
export * from './mediaLibrary.schema';

// Weekly Reports
export * from './weeklyReport.schema';

// Errors
export * from './error.schema';

// Newsletter
export * from './newsletter.schema';

// Dashboard
export * from './dashboard.schema';

// External Integrations
export * from './esp.schema';
export * from './sage.schema';
export * from './sanmar.schema';
export * from './ssActivewear.schema';
export * from './distributorCentral.schema';

// Project Activities & Notifications
export * from './notification.schema';

// Communications
export * from './communication.schema';

// Attachments
export * from './attachment.schema';

// Misc
export * from './misc.schema';

// Relations (must be last - references all tables)
export * from './relations';
