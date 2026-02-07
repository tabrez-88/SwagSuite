import 'dotenv/config';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

async function runMigration() {
    if (!process.env.DATABASE_URL) {
        console.error("No DATABASE_URL found");
        return;
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    try {
        console.log("Running migrations...");
        const client = await pool.connect();
        
        // Add receive_order_emails to contacts
        console.log("1. Adding receive_order_emails column to contacts table...");
        await client.query(`
            ALTER TABLE contacts 
            ADD COLUMN IF NOT EXISTS receive_order_emails boolean DEFAULT true
        `);
        
        // Create vendor_approval_requests table
        console.log("2. Creating vendor_approval_requests table...");
        await client.query(`
            CREATE TABLE IF NOT EXISTS vendor_approval_requests (
                id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
                supplier_id VARCHAR NOT NULL REFERENCES suppliers(id),
                product_id VARCHAR REFERENCES products(id),
                order_id VARCHAR REFERENCES orders(id),
                requested_by VARCHAR NOT NULL REFERENCES users(id),
                reason TEXT,
                status VARCHAR NOT NULL DEFAULT 'pending',
                reviewed_by VARCHAR REFERENCES users(id),
                reviewed_at TIMESTAMP,
                review_notes TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);
        
        console.log("✓ All migrations completed successfully!");
        
        client.release();
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await pool.end();
    }
}

runMigration();
