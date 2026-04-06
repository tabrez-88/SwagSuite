ALTER TABLE "integration_settings" ADD COLUMN "shipstation_api_key" text;--> statement-breakpoint
ALTER TABLE "integration_settings" ADD COLUMN "shipstation_api_secret" text;--> statement-breakpoint
ALTER TABLE "integration_settings" ADD COLUMN "shipstation_connected" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "enable_shipping_notifications" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "enable_tracking_emails" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "order_shipments" ADD COLUMN "shipstation_order_id" varchar;--> statement-breakpoint
ALTER TABLE "order_shipments" ADD COLUMN "shipstation_shipment_id" varchar;--> statement-breakpoint
ALTER TABLE "order_shipments" ADD COLUMN "last_tracking_check" timestamp;--> statement-breakpoint
ALTER TABLE "order_shipments" ADD COLUMN "delay_alert_sent" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "order_shipments" ADD COLUMN "last_tracking_email_status" varchar;--> statement-breakpoint
ALTER TABLE "order_shipments" ADD COLUMN "shipstation_metadata" jsonb;