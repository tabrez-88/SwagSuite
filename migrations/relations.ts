import { relations } from "drizzle-orm/relations";
import { users, activities, artworkColumns, artworkCards, orders, companies, artworkFiles, contacts, dataUploads, automationTasks, errors, suppliers, espProducts, distributorCentralProducts, kpiMetrics, marketingSequences, newsletterLists, newsletterCampaigns, newsletterTemplates, newsletterAutomations, knowledgeBase, newsletterForms, presentations, presentationFiles, presentationProducts, products, orderItems, productionTracking, productionNotifications, reportTemplates, productionStages, sageProducts, sequences, sequenceAnalytics, sequenceEnrollments, sequenceSteps, sequenceStepExecutions, productCategories, newsletterAnalytics, newsletterSubscribers, communications, notifications, projectActivities, integrationSettings, sageConnectSettings, sageQueryLogs } from "./schema";

export const activitiesRelations = relations(activities, ({one}) => ({
	user: one(users, {
		fields: [activities.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	activities: many(activities),
	artworkCards: many(artworkCards),
	artworkFiles: many(artworkFiles),
	dataUploads: many(dataUploads),
	automationTasks: many(automationTasks),
	errors_resolvedBy: many(errors, {
		relationName: "errors_resolvedBy_users_id"
	}),
	errors_createdBy: many(errors, {
		relationName: "errors_createdBy_users_id"
	}),
	kpiMetrics: many(kpiMetrics),
	marketingSequences: many(marketingSequences),
	newsletterCampaigns: many(newsletterCampaigns),
	newsletterAutomations: many(newsletterAutomations),
	knowledgeBases: many(knowledgeBase),
	newsletterTemplates: many(newsletterTemplates),
	newsletterLists: many(newsletterLists),
	newsletterForms: many(newsletterForms),
	orders: many(orders),
	reportTemplates: many(reportTemplates),
	communications: many(communications),
	notifications_recipientId: many(notifications, {
		relationName: "notifications_recipientId_users_id"
	}),
	notifications_senderId: many(notifications, {
		relationName: "notifications_senderId_users_id"
	}),
	projectActivities: many(projectActivities),
	integrationSettings: many(integrationSettings),
	sageConnectSettings: many(sageConnectSettings),
	sageQueryLogs: many(sageQueryLogs),
}));

export const artworkCardsRelations = relations(artworkCards, ({one}) => ({
	artworkColumn: one(artworkColumns, {
		fields: [artworkCards.columnId],
		references: [artworkColumns.id]
	}),
	order: one(orders, {
		fields: [artworkCards.orderId],
		references: [orders.id]
	}),
	company: one(companies, {
		fields: [artworkCards.companyId],
		references: [companies.id]
	}),
	user: one(users, {
		fields: [artworkCards.assignedUserId],
		references: [users.id]
	}),
}));

export const artworkColumnsRelations = relations(artworkColumns, ({many}) => ({
	artworkCards: many(artworkCards),
}));

export const ordersRelations = relations(orders, ({one, many}) => ({
	artworkCards: many(artworkCards),
	artworkFiles: many(artworkFiles),
	errors: many(errors),
	company: one(companies, {
		fields: [orders.companyId],
		references: [companies.id]
	}),
	contact: one(contacts, {
		fields: [orders.contactId],
		references: [contacts.id]
	}),
	user: one(users, {
		fields: [orders.assignedUserId],
		references: [users.id]
	}),
	supplier: one(suppliers, {
		fields: [orders.supplierId],
		references: [suppliers.id]
	}),
	orderItems: many(orderItems),
	productionTrackings: many(productionTracking),
	communications: many(communications),
	notifications: many(notifications),
	projectActivities: many(projectActivities),
}));

export const companiesRelations = relations(companies, ({many}) => ({
	artworkCards: many(artworkCards),
	artworkFiles: many(artworkFiles),
	contacts: many(contacts),
	orders: many(orders),
}));

export const artworkFilesRelations = relations(artworkFiles, ({one}) => ({
	order: one(orders, {
		fields: [artworkFiles.orderId],
		references: [orders.id]
	}),
	company: one(companies, {
		fields: [artworkFiles.companyId],
		references: [companies.id]
	}),
	user: one(users, {
		fields: [artworkFiles.uploadedBy],
		references: [users.id]
	}),
}));

export const contactsRelations = relations(contacts, ({one, many}) => ({
	company: one(companies, {
		fields: [contacts.companyId],
		references: [companies.id]
	}),
	orders: many(orders),
}));

export const dataUploadsRelations = relations(dataUploads, ({one}) => ({
	user: one(users, {
		fields: [dataUploads.uploadedBy],
		references: [users.id]
	}),
}));

export const automationTasksRelations = relations(automationTasks, ({one}) => ({
	user: one(users, {
		fields: [automationTasks.assignedTo],
		references: [users.id]
	}),
}));

export const errorsRelations = relations(errors, ({one}) => ({
	order: one(orders, {
		fields: [errors.orderId],
		references: [orders.id]
	}),
	user_resolvedBy: one(users, {
		fields: [errors.resolvedBy],
		references: [users.id],
		relationName: "errors_resolvedBy_users_id"
	}),
	user_createdBy: one(users, {
		fields: [errors.createdBy],
		references: [users.id],
		relationName: "errors_createdBy_users_id"
	}),
}));

export const espProductsRelations = relations(espProducts, ({one}) => ({
	supplier: one(suppliers, {
		fields: [espProducts.supplierId],
		references: [suppliers.id]
	}),
}));

export const suppliersRelations = relations(suppliers, ({many}) => ({
	espProducts: many(espProducts),
	distributorCentralProducts: many(distributorCentralProducts),
	orders: many(orders),
	sageProducts: many(sageProducts),
	products: many(products),
}));

export const distributorCentralProductsRelations = relations(distributorCentralProducts, ({one}) => ({
	supplier: one(suppliers, {
		fields: [distributorCentralProducts.supplierId],
		references: [suppliers.id]
	}),
}));

export const kpiMetricsRelations = relations(kpiMetrics, ({one}) => ({
	user: one(users, {
		fields: [kpiMetrics.userId],
		references: [users.id]
	}),
}));

export const marketingSequencesRelations = relations(marketingSequences, ({one}) => ({
	user: one(users, {
		fields: [marketingSequences.createdBy],
		references: [users.id]
	}),
}));

export const newsletterCampaignsRelations = relations(newsletterCampaigns, ({one, many}) => ({
	newsletterList: one(newsletterLists, {
		fields: [newsletterCampaigns.listId],
		references: [newsletterLists.id]
	}),
	newsletterTemplate: one(newsletterTemplates, {
		fields: [newsletterCampaigns.templateId],
		references: [newsletterTemplates.id]
	}),
	user: one(users, {
		fields: [newsletterCampaigns.createdBy],
		references: [users.id]
	}),
	newsletterAnalytics: many(newsletterAnalytics),
}));

export const newsletterListsRelations = relations(newsletterLists, ({one, many}) => ({
	newsletterCampaigns: many(newsletterCampaigns),
	newsletterAutomations: many(newsletterAutomations),
	user: one(users, {
		fields: [newsletterLists.createdBy],
		references: [users.id]
	}),
	newsletterForms: many(newsletterForms),
}));

export const newsletterTemplatesRelations = relations(newsletterTemplates, ({one, many}) => ({
	newsletterCampaigns: many(newsletterCampaigns),
	user: one(users, {
		fields: [newsletterTemplates.createdBy],
		references: [users.id]
	}),
}));

export const newsletterAutomationsRelations = relations(newsletterAutomations, ({one}) => ({
	newsletterList: one(newsletterLists, {
		fields: [newsletterAutomations.listId],
		references: [newsletterLists.id]
	}),
	user: one(users, {
		fields: [newsletterAutomations.createdBy],
		references: [users.id]
	}),
}));

export const knowledgeBaseRelations = relations(knowledgeBase, ({one}) => ({
	user: one(users, {
		fields: [knowledgeBase.createdBy],
		references: [users.id]
	}),
}));

export const newsletterFormsRelations = relations(newsletterForms, ({one}) => ({
	newsletterList: one(newsletterLists, {
		fields: [newsletterForms.listId],
		references: [newsletterLists.id]
	}),
	user: one(users, {
		fields: [newsletterForms.createdBy],
		references: [users.id]
	}),
}));

export const presentationFilesRelations = relations(presentationFiles, ({one}) => ({
	presentation: one(presentations, {
		fields: [presentationFiles.presentationId],
		references: [presentations.id]
	}),
}));

export const presentationsRelations = relations(presentations, ({many}) => ({
	presentationFiles: many(presentationFiles),
	presentationProducts: many(presentationProducts),
}));

export const presentationProductsRelations = relations(presentationProducts, ({one}) => ({
	presentation: one(presentations, {
		fields: [presentationProducts.presentationId],
		references: [presentations.id]
	}),
	product: one(products, {
		fields: [presentationProducts.productId],
		references: [products.id]
	}),
}));

export const productsRelations = relations(products, ({one, many}) => ({
	presentationProducts: many(presentationProducts),
	orderItems: many(orderItems),
	supplier: one(suppliers, {
		fields: [products.supplierId],
		references: [suppliers.id]
	}),
	productCategory: one(productCategories, {
		fields: [products.categoryId],
		references: [productCategories.id]
	}),
}));

export const orderItemsRelations = relations(orderItems, ({one}) => ({
	order: one(orders, {
		fields: [orderItems.orderId],
		references: [orders.id]
	}),
	product: one(products, {
		fields: [orderItems.productId],
		references: [products.id]
	}),
}));

export const productionNotificationsRelations = relations(productionNotifications, ({one}) => ({
	productionTracking: one(productionTracking, {
		fields: [productionNotifications.trackingId],
		references: [productionTracking.id]
	}),
}));

export const productionTrackingRelations = relations(productionTracking, ({one, many}) => ({
	productionNotifications: many(productionNotifications),
	order: one(orders, {
		fields: [productionTracking.orderId],
		references: [orders.id]
	}),
	productionStage: one(productionStages, {
		fields: [productionTracking.currentStageId],
		references: [productionStages.id]
	}),
}));

export const reportTemplatesRelations = relations(reportTemplates, ({one}) => ({
	user: one(users, {
		fields: [reportTemplates.createdBy],
		references: [users.id]
	}),
}));

export const productionStagesRelations = relations(productionStages, ({many}) => ({
	productionTrackings: many(productionTracking),
}));

export const sageProductsRelations = relations(sageProducts, ({one}) => ({
	supplier: one(suppliers, {
		fields: [sageProducts.supplierId],
		references: [suppliers.id]
	}),
}));

export const sequenceAnalyticsRelations = relations(sequenceAnalytics, ({one}) => ({
	sequence: one(sequences, {
		fields: [sequenceAnalytics.sequenceId],
		references: [sequences.id]
	}),
}));

export const sequencesRelations = relations(sequences, ({many}) => ({
	sequenceAnalytics: many(sequenceAnalytics),
	sequenceEnrollments: many(sequenceEnrollments),
	sequenceSteps: many(sequenceSteps),
}));

export const sequenceEnrollmentsRelations = relations(sequenceEnrollments, ({one, many}) => ({
	sequence: one(sequences, {
		fields: [sequenceEnrollments.sequenceId],
		references: [sequences.id]
	}),
	sequenceStepExecutions: many(sequenceStepExecutions),
}));

export const sequenceStepExecutionsRelations = relations(sequenceStepExecutions, ({one}) => ({
	sequenceStep: one(sequenceSteps, {
		fields: [sequenceStepExecutions.stepId],
		references: [sequenceSteps.id]
	}),
	sequenceEnrollment: one(sequenceEnrollments, {
		fields: [sequenceStepExecutions.enrollmentId],
		references: [sequenceEnrollments.id]
	}),
}));

export const sequenceStepsRelations = relations(sequenceSteps, ({one, many}) => ({
	sequenceStepExecutions: many(sequenceStepExecutions),
	sequence: one(sequences, {
		fields: [sequenceSteps.sequenceId],
		references: [sequences.id]
	}),
}));

export const productCategoriesRelations = relations(productCategories, ({many}) => ({
	products: many(products),
}));

export const newsletterAnalyticsRelations = relations(newsletterAnalytics, ({one}) => ({
	newsletterCampaign: one(newsletterCampaigns, {
		fields: [newsletterAnalytics.campaignId],
		references: [newsletterCampaigns.id]
	}),
	newsletterSubscriber: one(newsletterSubscribers, {
		fields: [newsletterAnalytics.subscriberId],
		references: [newsletterSubscribers.id]
	}),
}));

export const newsletterSubscribersRelations = relations(newsletterSubscribers, ({many}) => ({
	newsletterAnalytics: many(newsletterAnalytics),
}));

export const communicationsRelations = relations(communications, ({one}) => ({
	order: one(orders, {
		fields: [communications.orderId],
		references: [orders.id]
	}),
	user: one(users, {
		fields: [communications.userId],
		references: [users.id]
	}),
}));

export const notificationsRelations = relations(notifications, ({one}) => ({
	user_recipientId: one(users, {
		fields: [notifications.recipientId],
		references: [users.id],
		relationName: "notifications_recipientId_users_id"
	}),
	user_senderId: one(users, {
		fields: [notifications.senderId],
		references: [users.id],
		relationName: "notifications_senderId_users_id"
	}),
	order: one(orders, {
		fields: [notifications.orderId],
		references: [orders.id]
	}),
	projectActivity: one(projectActivities, {
		fields: [notifications.activityId],
		references: [projectActivities.id]
	}),
}));

export const projectActivitiesRelations = relations(projectActivities, ({one, many}) => ({
	notifications: many(notifications),
	order: one(orders, {
		fields: [projectActivities.orderId],
		references: [orders.id]
	}),
	user: one(users, {
		fields: [projectActivities.userId],
		references: [users.id]
	}),
}));

export const integrationSettingsRelations = relations(integrationSettings, ({one}) => ({
	user: one(users, {
		fields: [integrationSettings.updatedBy],
		references: [users.id]
	}),
}));

export const sageConnectSettingsRelations = relations(sageConnectSettings, ({one, many}) => ({
	user: one(users, {
		fields: [sageConnectSettings.createdBy],
		references: [users.id]
	}),
	sageQueryLogs: many(sageQueryLogs),
}));

export const sageQueryLogsRelations = relations(sageQueryLogs, ({one}) => ({
	sageConnectSetting: one(sageConnectSettings, {
		fields: [sageQueryLogs.settingsId],
		references: [sageConnectSettings.id]
	}),
	user: one(users, {
		fields: [sageQueryLogs.userId],
		references: [users.id]
	}),
}));