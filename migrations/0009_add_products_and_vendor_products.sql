-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  description TEXT,
  category VARCHAR,
  sku VARCHAR UNIQUE,
  base_price DECIMAL(10, 2),
  image_url VARCHAR,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create vendor_products mapping table (which vendors can supply which products)
CREATE TABLE IF NOT EXISTS vendor_products (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id VARCHAR NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  product_id VARCHAR NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  vendor_sku VARCHAR,
  unit_price DECIMAL(10, 2),
  lead_time_days INTEGER,
  minimum_order_quantity INTEGER DEFAULT 1,
  notes TEXT,
  is_preferred BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(vendor_id, product_id)
);

-- Create order_items table to replace simple order structure
CREATE TABLE IF NOT EXISTS order_items (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id VARCHAR NOT NULL REFERENCES products(id),
  vendor_id VARCHAR REFERENCES suppliers(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  product_name VARCHAR NOT NULL, -- Denormalized for history
  vendor_name VARCHAR, -- Denormalized for history
  customization_details TEXT,
  status VARCHAR DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_vendor_products_vendor ON vendor_products(vendor_id);
CREATE INDEX idx_vendor_products_product ON vendor_products(product_id);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
CREATE INDEX idx_order_items_vendor ON order_items(vendor_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_active ON products(is_active);
