-- Rename estimate_status column to quote_status
ALTER TABLE orders RENAME COLUMN estimate_status TO quote_status;

-- Rename JSONB key unlocks.estimate → unlocks.quote in stageData
UPDATE orders
SET stage_data = jsonb_set(
  stage_data #- '{unlocks,estimate}',
  '{unlocks,quote}',
  stage_data->'unlocks'->'estimate'
)
WHERE stage_data->'unlocks'->'estimate' IS NOT NULL;
