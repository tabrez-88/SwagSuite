-- Enable pg_trgm extension for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN indexes for trigram matching on commonly searched columns
CREATE INDEX IF NOT EXISTS idx_orders_project_name_trgm ON orders USING gin (project_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_orders_order_number_trgm ON orders USING gin (order_number gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_companies_name_trgm ON companies USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_contacts_first_name_trgm ON contacts USING gin (first_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_contacts_last_name_trgm ON contacts USING gin (last_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_suppliers_name_trgm ON suppliers USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_po_number_trgm ON purchase_orders USING gin (po_number gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking_trgm ON order_shipments USING gin (tracking_number gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_activities_description_trgm ON activities USING gin (description gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_project_activities_content_trgm ON project_activities USING gin (content gin_trgm_ops);
