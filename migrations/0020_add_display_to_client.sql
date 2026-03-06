ALTER TABLE order_additional_charges ADD COLUMN IF NOT EXISTS display_to_client boolean DEFAULT true;
