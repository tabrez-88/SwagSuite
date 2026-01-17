# SanMar Integration Summary

## Overview
Successfully integrated SanMar's SOAP API for product catalog search and import, similar to existing S&S Activewear and SAGE integrations.

## Files Created/Modified

### Backend
1. **server/sanmarService.ts** (NEW)
   - SOAP client wrapper for SanMar Web Services API
   - Methods: searchProducts, getProductDetails, getAvailableColors, getAvailableSizes, getInventory
   - Based on SanMar Web Services Integration Guide 24.2

2. **server/routes.ts** (MODIFIED)
   - Added 4 new endpoints:
     - `POST /api/sanmar/test-connection` - Test SOAP API connection
     - `GET /api/sanmar/search?q=` - Search products by style ID or name
     - `GET /api/sanmar/product/:styleId` - Get detailed product info
     - `POST /api/sanmar/products/sync` - Sync products to catalog

3. **shared/schema.ts** (MODIFIED)
   - Added SanMar credentials to integrationSettings table:
     - sanmarCustomerId
     - sanmarUsername
     - sanmarPassword

### Frontend
1. **client/src/components/integrations/SanmarIntegration.tsx** (NEW)
   - Search interface for SanMar products
   - Product cards with details (colors, sizes, pricing)
   - Add to catalog functionality
   - Product detail modal

2. **client/src/pages/products.tsx** (MODIFIED)
   - Added "SanMar" tab (5 tabs total now)
   - Updated TabsList grid from 4 to 5 columns
   - Imported and rendered SanmarIntegration component

3. **client/src/pages/settings.tsx** (MODIFIED)
   - Added SanMar configuration section in Integrations tab
   - 3 fields: Customer ID, Username, Password (with show/hide)
   - Connection status badge

### Dependencies
4. **package.json** (MODIFIED)
   - Added: `soap@^1.1.3` - Node.js SOAP client
   - Added: `xml2js@^0.6.2` - XML parser for SOAP responses

## Database Migration Required
Run migration to add SanMar credential columns:
```sql
ALTER TABLE integration_settings 
  ADD COLUMN sanmar_customer_id VARCHAR,
  ADD COLUMN sanmar_username VARCHAR,
  ADD COLUMN sanmar_password TEXT;
```

Or use drizzle-kit:
```bash
npm run db:generate
npm run db:migrate
```

## Usage Workflow

### 1. Configure Credentials
- Go to Settings → Integrations
- Enter SanMar Customer ID, Username, Password
- Save settings

### 2. Search Products
- Navigate to Products → SanMar tab
- Enter style ID (e.g., "PC54", "ST350") or product name
- Click Search

### 3. Import to Catalog
- Review search results with colors, sizes, pricing
- Click "Add to Catalog" for individual products
- Or "Add All to Catalog" for batch import
- Products auto-assigned to "SanMar" supplier

## SanMar API Features
- **SOAP Web Services** (vs REST for S&S/SAGE)
- Product catalog search by style ID
- Available colors and sizes per style
- Pricing (piece, dozen, case)
- Inventory levels by warehouse
- Product images and specifications

## Integration Points
```
User (Products Page)
  → SanmarIntegration Component
    → API: /api/sanmar/search
      → sanmarService.searchProducts()
        → SOAP: SanMarCatalogService.GetProductByStyleID
          → Parse & return SanMarProduct[]
    → API: /api/sanmar/products/sync
      → Create/Update products in database
      → Auto-assign SanMar supplier
```

## Next Steps
1. Install dependencies: `npm install`
2. Generate migration: `npm run db:generate`
3. Apply migration: `npm run db:migrate` (production)
4. Configure SanMar credentials in Settings
5. Test search and import functionality

## Notes
- SanMar uses **SOAP API** (not REST like others)
- Requires valid SanMar customer account
- WSDL endpoints:
  - Catalog: `https://ws.sanmar.com:8080/OrderXML/SanMarCatalogService?wsdl`
  - Inventory: `https://ws.sanmar.com:8080/OrderXML/SanMarInventoryService?wsdl`
