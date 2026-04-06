-- ShipStation Integration: Add credentials to integration_settings
ALTER TABLE "integration_settings" ADD COLUMN IF NOT EXISTS "shipstation_api_key" text;
ALTER TABLE "integration_settings" ADD COLUMN IF NOT EXISTS "shipstation_api_secret" text;
ALTER TABLE "integration_settings" ADD COLUMN IF NOT EXISTS "shipstation_connected" boolean DEFAULT false;

-- ShipStation fields on order_shipments
ALTER TABLE "order_shipments" ADD COLUMN IF NOT EXISTS "shipstation_order_id" varchar;
ALTER TABLE "order_shipments" ADD COLUMN IF NOT EXISTS "shipstation_shipment_id" varchar;
ALTER TABLE "order_shipments" ADD COLUMN IF NOT EXISTS "last_tracking_check" timestamp;
ALTER TABLE "order_shipments" ADD COLUMN IF NOT EXISTS "delay_alert_sent" boolean DEFAULT false;
ALTER TABLE "order_shipments" ADD COLUMN IF NOT EXISTS "shipstation_metadata" jsonb;

-- Phase 2: tracking email milestone tracking
ALTER TABLE "order_shipments" ADD COLUMN IF NOT EXISTS "last_tracking_email_status" varchar;

-- Shipping notifications toggle on orders
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "enable_shipping_notifications" boolean DEFAULT true;
-- Phase 2: automated tracking emails toggle (off by default)
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "enable_tracking_emails" boolean DEFAULT false;
