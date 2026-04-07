-- Seed default email templates for each type
-- Only inserts if no templates exist yet (idempotent)

INSERT INTO "email_templates" ("id", "template_type", "name", "subject", "body", "is_default", "is_active")
SELECT gen_random_uuid(), 'quote', 'Default Quote', 'Quote #{{orderNumber}} from {{companyName}}',
  'Hi {{recipientFirstName}},

Thank you for your interest! Please find the quote for your project attached.

Click the link below to review and approve the quote. If you have any questions or need changes, please don''t hesitate to reach out.

Best regards,
{{senderName}}
{{companyName}}', true, true
WHERE NOT EXISTS (SELECT 1 FROM "email_templates" WHERE "template_type" = 'quote');

INSERT INTO "email_templates" ("id", "template_type", "name", "subject", "body", "is_default", "is_active")
SELECT gen_random_uuid(), 'sales_order', 'Default Sales Order', 'Sales Order #{{orderNumber}} from {{companyName}}',
  'Hi {{recipientFirstName}},

Please find the sales order for your project. Click the link below to review and approve.

If you have any questions or need changes, please don''t hesitate to reach out.

Best regards,
{{senderName}}
{{companyName}}', true, true
WHERE NOT EXISTS (SELECT 1 FROM "email_templates" WHERE "template_type" = 'sales_order');

INSERT INTO "email_templates" ("id", "template_type", "name", "subject", "body", "is_default", "is_active")
SELECT gen_random_uuid(), 'invoice', 'Default Invoice', 'Invoice #{{invoiceNumber}} — {{companyName}}',
  'Hi {{recipientFirstName}},

Please find the invoice for your recent order #{{orderNumber}}. The total amount due is {{totalAmount}}.

Payment is due by {{dueDate}}. Please let us know if you have any questions.

Best regards,
{{senderName}}
{{companyName}}', true, true
WHERE NOT EXISTS (SELECT 1 FROM "email_templates" WHERE "template_type" = 'invoice');

INSERT INTO "email_templates" ("id", "template_type", "name", "subject", "body", "is_default", "is_active")
SELECT gen_random_uuid(), 'purchase_order', 'Default Purchase Order', 'Purchase Order {{poNumber}} — {{companyName}}',
  'Hi {{vendorContactName}},

Attached is our PO and related artwork for this order. Please see the PO for in-hands date and associated details.

Please do not rush-ship unless specified. If there is an issue with the in-hands date, please let us know. If you have any questions, please don''t hesitate to be in touch. When the order is ready for shipment, please make sure to send us the necessary tracking information.

Many thanks,

{{senderName}}
{{companyName}}', true, true
WHERE NOT EXISTS (SELECT 1 FROM "email_templates" WHERE "template_type" = 'purchase_order');

INSERT INTO "email_templates" ("id", "template_type", "name", "subject", "body", "is_default", "is_active")
SELECT gen_random_uuid(), 'presentation', 'Default Presentation', 'Product Presentation — {{companyName}}',
  'Hi {{recipientFirstName}},

We''ve put together a product presentation for your upcoming project. Please take a look and let us know your thoughts.

We''re happy to make any changes or suggest alternatives.

Best regards,
{{senderName}}
{{companyName}}', true, true
WHERE NOT EXISTS (SELECT 1 FROM "email_templates" WHERE "template_type" = 'presentation');

INSERT INTO "email_templates" ("id", "template_type", "name", "subject", "body", "is_default", "is_active")
SELECT gen_random_uuid(), 'proof', 'Default Proof Approval', 'Artwork Proofs for Approval — Order #{{orderNumber}}',
  'Hi {{recipientFirstName}},

Your artwork proofs are ready for review. Please click the links below to view each proof and approve or request changes.

{{artworkList}}

Please review carefully and let us know if any changes are needed.

Best regards,
{{senderName}}
{{companyName}}', true, true
WHERE NOT EXISTS (SELECT 1 FROM "email_templates" WHERE "template_type" = 'proof');
