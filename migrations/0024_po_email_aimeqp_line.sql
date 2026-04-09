-- Add AIMEQP membership line to default PO email template (Katie's request)
-- Preserves all existing wording from 0023 and appends the members line before the closing.
UPDATE "email_templates"
SET "body" = 'Hi {{vendorContactName}},

Attached is our PO and related artwork for this order. Please see the PO for in-hands date and associated details.

Please do not rush-ship unless specified. If there is an issue with the in-hands date, please let us know. If you have any questions, please don''t hesitate to be in touch. When the order is ready for shipment, please make sure to send us the necessary tracking information.

Please note that we are AIMEQP members (if applicable).

Many thanks,

{{senderName}}
{{companyName}}',
    "updated_at" = NOW()
WHERE "template_type" = 'purchase_order'
  AND "name" = 'Default Purchase Order'
  AND "is_default" = true;
