import 'dotenv/config';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import fs from 'fs';
import path from 'path';

neonConfig.webSocketConstructor = ws;

async function runMigration() {
    if (!process.env.DATABASE_URL) {
        console.error("No DATABASE_URL found");
        return;
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    try {
        console.log("Running migration: 0010_dapper_wrecking_crew.sql");
        const client = await pool.connect();
        
        const migrationSQL = fs.readFileSync(
            path.join(process.cwd(), 'migrations', '0010_dapper_wrecking_crew.sql'),
            'utf-8'
        );
        
        await client.query(migrationSQL);
        console.log("✓ Migration completed successfully!");
        
        client.release();
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await pool.end();
    }
}

runMigration();
