-- Add rush flag to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_rush boolean DEFAULT false;

-- Add next action date and notes as proper queryable columns
-- (previously stored in JSONB stageData/customNotes, but needed as real columns for notification queries)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS next_action_date timestamp;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS next_action_notes text;

-- Index for efficient daily notification queries
CREATE INDEX IF NOT EXISTS idx_orders_next_action_date ON orders(next_action_date) WHERE next_action_date IS NOT NULL;

-- Migrate existing next action data from JSONB to proper columns
UPDATE orders
SET
  next_action_date = (stage_data->>'nextActionDate')::timestamp,
  next_action_notes = custom_notes->>'nextAction'
WHERE
  next_action_date IS NULL
  AND (
    (stage_data->>'nextActionDate') IS NOT NULL
    OR (custom_notes->>'nextAction') IS NOT NULL
  );
