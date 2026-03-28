import { relations } from 'drizzle-orm';

// Table imports
import { users } from './user.schema';
import { companies } from './company.schema';
import { companyAddresses } from './company-address.schema';
import { contacts } from './contact.schema';
import { suppliers } from './supplier.schema';
import { supplierAddresses } from './supplier-address.schema';
import { productCategories } from './product.schema';
import { products } from './product.schema';
import { orders, orderItems, orderItemLines, orderAdditionalCharges, orderServiceCharges } from './order.schema';
import { orderFiles } from './orderFile.schema';
import { artworkItems, artworkFiles } from './artwork.schema';
import { artworkColumns, artworkCards } from './artworkKanban.schema';
import { generatedDocuments } from './document.schema';
import { invoices } from './invoice.schema';
import { vendorInvoices } from './vendorInvoice.schema';
import { activities } from './activity.schema';
import { errors } from './error.schema';
import { userEmailSettings, systemBranding, companySettings } from './settings.schema';
import { integrationSettings } from './integration.schema';
import { sequences, sequenceSteps, sequenceEnrollments, sequenceStepExecutions, sequenceAnalytics } from './sequence.schema';
import { newsletterSubscribers, newsletterLists, newsletterTemplates, newsletterCampaigns, newsletterAnalytics, newsletterForms, newsletterAutomations } from './newsletter.schema';
import { orderShipments } from './shipment.schema';
import { customerPortalTokens } from './portal.schema';
import { mediaLibrary } from './mediaLibrary.schema';
import { projectActivities, notifications } from './notification.schema';
import { communications } from './communication.schema';
import { attachments } from './attachment.schema';

// ── User Relations ──
export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  activities: many(activities),
  emailSettings: many(userEmailSettings),
}));

// ── CRM Relations ──
export const companiesRelations = relations(companies, ({ many }) => ({
  contacts: many(contacts),
  orders: many(orders),
  artworkFiles: many(artworkFiles),
  addresses: many(companyAddresses),
}));

export const companyAddressesRelations = relations(companyAddresses, ({ one }) => ({
  company: one(companies, {
    fields: [companyAddresses.companyId],
    references: [companies.id],
  }),
}));

export const contactsRelations = relations(contacts, ({ one, many }) => ({
  company: one(companies, {
    fields: [contacts.companyId],
    references: [companies.id],
  }),
  supplier: one(suppliers, {
    fields: [contacts.supplierId],
    references: [suppliers.id],
  }),
  orders: many(orders),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  products: many(products),
  contacts: many(contacts),
  addresses: many(supplierAddresses),
}));

export const supplierAddressesRelations = relations(supplierAddresses, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [supplierAddresses.supplierId],
    references: [suppliers.id],
  }),
}));

// ── Product Relations ──
export const productCategoriesRelations = relations(productCategories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  supplier: one(suppliers, {
    fields: [products.supplierId],
    references: [suppliers.id],
  }),
  category: one(productCategories, {
    fields: [products.categoryId],
    references: [productCategories.id],
  }),
  orderItems: many(orderItems),
}));

// ── Order Relations ──
export const ordersRelations = relations(orders, ({ one, many }) => ({
  company: one(companies, {
    fields: [orders.companyId],
    references: [companies.id],
  }),
  contact: one(contacts, {
    fields: [orders.contactId],
    references: [contacts.id],
  }),
  assignedUser: one(users, {
    fields: [orders.assignedUserId],
    references: [users.id],
  }),
  items: many(orderItems),
  artworkFiles: many(artworkFiles),
  errors: many(errors),
}));

export const orderItemsRelations = relations(orderItems, ({ one, many }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
  artworkItems: many(artworkItems),
}));

export const orderItemLinesRelations = relations(orderItemLines, ({ one }) => ({
  orderItem: one(orderItems, {
    fields: [orderItemLines.orderItemId],
    references: [orderItems.id],
  }),
}));

export const orderAdditionalChargesRelations = relations(orderAdditionalCharges, ({ one }) => ({
  orderItem: one(orderItems, {
    fields: [orderAdditionalCharges.orderItemId],
    references: [orderItems.id],
  }),
}));

export const orderServiceChargesRelations = relations(orderServiceCharges, ({ one }) => ({
  order: one(orders, {
    fields: [orderServiceCharges.orderId],
    references: [orders.id],
  }),
  vendor: one(suppliers, {
    fields: [orderServiceCharges.vendorId],
    references: [suppliers.id],
  }),
}));

export const orderShipmentsRelations = relations(orderShipments, ({ one }) => ({
  order: one(orders, {
    fields: [orderShipments.orderId],
    references: [orders.id],
  }),
}));

// ── Artwork Relations ──
export const artworkItemsRelations = relations(artworkItems, ({ one }) => ({
  orderItem: one(orderItems, {
    fields: [artworkItems.orderItemId],
    references: [orderItems.id],
  }),
}));

export const artworkFilesRelations = relations(artworkFiles, ({ one }) => ({
  order: one(orders, {
    fields: [artworkFiles.orderId],
    references: [orders.id],
  }),
  company: one(companies, {
    fields: [artworkFiles.companyId],
    references: [companies.id],
  }),
  uploadedByUser: one(users, {
    fields: [artworkFiles.uploadedBy],
    references: [users.id],
  }),
}));

export const artworkColumnsRelations = relations(artworkColumns, ({ many }) => ({
  cards: many(artworkCards),
}));

export const artworkCardsRelations = relations(artworkCards, ({ one }) => ({
  column: one(artworkColumns, {
    fields: [artworkCards.columnId],
    references: [artworkColumns.id],
  }),
  order: one(orders, {
    fields: [artworkCards.orderId],
    references: [orders.id],
  }),
  company: one(companies, {
    fields: [artworkCards.companyId],
    references: [companies.id],
  }),
  assignedUser: one(users, {
    fields: [artworkCards.assignedUserId],
    references: [users.id],
  }),
}));

// ── Document Relations ──
export const generatedDocumentsRelations = relations(generatedDocuments, ({ one }) => ({
  order: one(orders, {
    fields: [generatedDocuments.orderId],
    references: [orders.id],
  }),
  vendor: one(suppliers, {
    fields: [generatedDocuments.vendorId],
    references: [suppliers.id],
  }),
  generatedByUser: one(users, {
    fields: [generatedDocuments.generatedBy],
    references: [users.id],
  }),
}));

// ── Invoice Relations ──
export const vendorInvoicesRelations = relations(vendorInvoices, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [vendorInvoices.supplierId],
    references: [suppliers.id],
  }),
  order: one(orders, {
    fields: [vendorInvoices.orderId],
    references: [orders.id],
  }),
}));

// ── Activity Relations ──
export const activitiesRelations = relations(activities, ({ one }) => ({
  user: one(users, {
    fields: [activities.userId],
    references: [users.id],
  }),
}));

// ── Error Relations ──
export const errorsRelations = relations(errors, ({ one }) => ({
  order: one(orders, {
    fields: [errors.orderId],
    references: [orders.id],
  }),
  createdByUser: one(users, {
    fields: [errors.createdBy],
    references: [users.id],
  }),
  resolvedByUser: one(users, {
    fields: [errors.resolvedBy],
    references: [users.id],
  }),
}));

// ── Settings Relations ──
export const integrationSettingsRelations = relations(integrationSettings, ({ one }) => ({
  updatedByUser: one(users, {
    fields: [integrationSettings.updatedBy],
    references: [users.id],
  }),
}));

export const userEmailSettingsRelations = relations(userEmailSettings, ({ one }) => ({
  user: one(users, {
    fields: [userEmailSettings.userId],
    references: [users.id],
  }),
}));

export const systemBrandingRelations = relations(systemBranding, ({ one }) => ({
  updatedByUser: one(users, {
    fields: [systemBranding.updatedBy],
    references: [users.id],
  }),
}));

export const companySettingsRelations = relations(companySettings, ({ one }) => ({
  updatedByUser: one(users, {
    fields: [companySettings.updatedBy],
    references: [users.id],
  }),
}));

// ── Sequence Relations ──
export const sequencesRelations = relations(sequences, ({ many }) => ({
  steps: many(sequenceSteps),
  enrollments: many(sequenceEnrollments),
  analytics: many(sequenceAnalytics),
}));

export const sequenceStepsRelations = relations(sequenceSteps, ({ one, many }) => ({
  sequence: one(sequences, {
    fields: [sequenceSteps.sequenceId],
    references: [sequences.id],
  }),
  executions: many(sequenceStepExecutions),
}));

export const sequenceEnrollmentsRelations = relations(sequenceEnrollments, ({ one, many }) => ({
  sequence: one(sequences, {
    fields: [sequenceEnrollments.sequenceId],
    references: [sequences.id],
  }),
  executions: many(sequenceStepExecutions),
}));

export const sequenceStepExecutionsRelations = relations(sequenceStepExecutions, ({ one }) => ({
  enrollment: one(sequenceEnrollments, {
    fields: [sequenceStepExecutions.enrollmentId],
    references: [sequenceEnrollments.id],
  }),
  step: one(sequenceSteps, {
    fields: [sequenceStepExecutions.stepId],
    references: [sequenceSteps.id],
  }),
}));

export const sequenceAnalyticsRelations = relations(sequenceAnalytics, ({ one }) => ({
  sequence: one(sequences, {
    fields: [sequenceAnalytics.sequenceId],
    references: [sequences.id],
  }),
}));

// ── Newsletter Relations ──
export const newsletterSubscribersRelations = relations(newsletterSubscribers, ({ many }) => ({
  analytics: many(newsletterAnalytics),
}));

export const newsletterListsRelations = relations(newsletterLists, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [newsletterLists.createdBy],
    references: [users.id],
  }),
  campaigns: many(newsletterCampaigns),
  forms: many(newsletterForms),
  automations: many(newsletterAutomations),
}));

export const newsletterTemplatesRelations = relations(newsletterTemplates, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [newsletterTemplates.createdBy],
    references: [users.id],
  }),
  campaigns: many(newsletterCampaigns),
}));

export const newsletterCampaignsRelations = relations(newsletterCampaigns, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [newsletterCampaigns.createdBy],
    references: [users.id],
  }),
  list: one(newsletterLists, {
    fields: [newsletterCampaigns.listId],
    references: [newsletterLists.id],
  }),
  template: one(newsletterTemplates, {
    fields: [newsletterCampaigns.templateId],
    references: [newsletterTemplates.id],
  }),
  analytics: many(newsletterAnalytics),
}));

export const newsletterAnalyticsRelations = relations(newsletterAnalytics, ({ one }) => ({
  campaign: one(newsletterCampaigns, {
    fields: [newsletterAnalytics.campaignId],
    references: [newsletterCampaigns.id],
  }),
  subscriber: one(newsletterSubscribers, {
    fields: [newsletterAnalytics.subscriberId],
    references: [newsletterSubscribers.id],
  }),
}));

export const newsletterFormsRelations = relations(newsletterForms, ({ one }) => ({
  createdBy: one(users, {
    fields: [newsletterForms.createdBy],
    references: [users.id],
  }),
  list: one(newsletterLists, {
    fields: [newsletterForms.listId],
    references: [newsletterLists.id],
  }),
}));

export const newsletterAutomationsRelations = relations(newsletterAutomations, ({ one }) => ({
  createdBy: one(users, {
    fields: [newsletterAutomations.createdBy],
    references: [users.id],
  }),
  list: one(newsletterLists, {
    fields: [newsletterAutomations.listId],
    references: [newsletterLists.id],
  }),
}));

// ── Portal Relations ──
export const customerPortalTokensRelations = relations(customerPortalTokens, ({ one }) => ({
  order: one(orders, {
    fields: [customerPortalTokens.orderId],
    references: [orders.id],
  }),
}));

// ── Media Library Relations ──
export const mediaLibraryRelations = relations(mediaLibrary, ({ one }) => ({
  order: one(orders, {
    fields: [mediaLibrary.orderId],
    references: [orders.id],
  }),
  company: one(companies, {
    fields: [mediaLibrary.companyId],
    references: [companies.id],
  }),
  orderItem: one(orderItems, {
    fields: [mediaLibrary.orderItemId],
    references: [orderItems.id],
  }),
  uploadedByUser: one(users, {
    fields: [mediaLibrary.uploadedBy],
    references: [users.id],
  }),
}));

// ── Project Activity Relations ──
export const projectActivitiesRelations = relations(projectActivities, ({ one }) => ({
  order: one(orders, {
    fields: [projectActivities.orderId],
    references: [orders.id],
  }),
  user: one(users, {
    fields: [projectActivities.userId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  recipient: one(users, {
    fields: [notifications.recipientId],
    references: [users.id],
  }),
  sender: one(users, {
    fields: [notifications.senderId],
    references: [users.id],
  }),
  order: one(orders, {
    fields: [notifications.orderId],
    references: [orders.id],
  }),
  activity: one(projectActivities, {
    fields: [notifications.activityId],
    references: [projectActivities.id],
  }),
}));

// ── Communication Relations ──
export const communicationsRelations = relations(communications, ({ one }) => ({
  order: one(orders, {
    fields: [communications.orderId],
    references: [orders.id],
  }),
  user: one(users, {
    fields: [communications.userId],
    references: [users.id],
  }),
}));

// ── Attachment Relations ──
export const attachmentsRelations = relations(attachments, ({ one }) => ({
  order: one(orders, {
    fields: [attachments.orderId],
    references: [orders.id],
  }),
  communication: one(communications, {
    fields: [attachments.communicationId],
    references: [communications.id],
  }),
  user: one(users, {
    fields: [attachments.uploadedBy],
    references: [users.id],
  }),
}));
