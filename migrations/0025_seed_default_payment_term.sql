-- Seed "Credit Card" as the default payment term (Benji's 4/1 feedback).
-- Only inserts if no default term currently exists — preserves any existing
-- admin-configured default. Safe to re-run.

INSERT INTO "payment_terms" ("name", "is_default")
SELECT 'Credit Card', true
WHERE NOT EXISTS (
  SELECT 1 FROM "payment_terms" WHERE "is_default" = true
);
