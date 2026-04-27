-- One-time data fix: Update shipToAddress.companyName for decorator-destination items
-- Problem: companyName was set to addressName (e.g. "Main Address") instead of
-- the actual decorator company name from the suppliers table.
--
-- Run this ONCE after deploying the code fix.
-- Safe to re-run (idempotent).

-- Preview affected rows first:
-- SELECT
--   oi.id,
--   oi.shipping_destination,
--   oi.ship_to_address->>'companyName' AS current_company_name,
--   s.name AS correct_company_name
-- FROM order_items oi
-- JOIN suppliers s ON oi.decorator_id = s.id
-- WHERE oi.shipping_destination = 'decorator'
--   AND oi.ship_to_address IS NOT NULL
--   AND oi.decorator_id IS NOT NULL
--   AND (
--     oi.ship_to_address->>'companyName' IS DISTINCT FROM s.name
--   );

-- Apply fix:
UPDATE order_items oi
SET ship_to_address = jsonb_set(
  oi.ship_to_address,
  '{companyName}',
  to_jsonb(s.name)
)
FROM suppliers s
WHERE oi.decorator_id = s.id
  AND oi.shipping_destination = 'decorator'
  AND oi.ship_to_address IS NOT NULL
  AND oi.decorator_id IS NOT NULL
  AND (
    oi.ship_to_address->>'companyName' IS DISTINCT FROM s.name
  );
