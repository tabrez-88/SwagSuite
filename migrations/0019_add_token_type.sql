ALTER TABLE customer_portal_tokens ADD COLUMN IF NOT EXISTS token_type varchar DEFAULT 'order_tracking';
