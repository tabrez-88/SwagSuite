import 'dotenv/config';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import fs from 'fs';

neonConfig.webSocketConstructor = ws;

async function runMigration() {
    console.log("DATABASE_URL:", process.env.DATABASE_URL ? "Configured" : "Missing");
    if (!process.env.DATABASE_URL) {
        console.error("No DATABASE_URL found");
        return;
    }

    console.log("Initializing Pool...");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    try {
        console.log("Connecting...");
        const client = await pool.connect();
        console.log("Connected! Running migration...");
        
        const migration = fs.readFileSync('migrations/0009_add_colors_to_sage_products.sql', 'utf8');
        console.log("Migration SQL:", migration);
        
        await client.query(migration);
        console.log("✅ Migration successful!");
        
        // Verify the column was added
        const verify = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'sage_products' 
            AND column_name = 'colors'
        `);
        
        if (verify.rows.length > 0) {
            console.log("✅ Verified: colors column exists:", verify.rows[0]);
        } else {
            console.log("⚠️ Warning: colors column not found after migration");
        }
        
        client.release();
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await pool.end();
        console.log("Pool ended.");
    }
}

runMigration();
