ALTER TABLE "order_item_lines" ADD COLUMN "sort_order" integer DEFAULT 0;

-- Backfill: assign sort_order based on creation order within each order item
UPDATE "order_item_lines" oil
SET "sort_order" = sub.rn - 1
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY order_item_id ORDER BY created_at) AS rn
  FROM "order_item_lines"
) sub
WHERE oil.id = sub.id;

-- Backfill: assign sort_order for order_items based on creation order within each order
UPDATE "order_items" oi
SET "sort_order" = sub.rn - 1
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY created_at) AS rn
  FROM "order_items"
) sub
WHERE oi.id = sub.id;