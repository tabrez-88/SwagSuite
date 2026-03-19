

import 'dotenv/config';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

async function testConnection() {
    console.log("DATABASE_URL:", process.env.DATABASE_URL);
    if (!process.env.DATABASE_URL) {
        console.error("No DATABASE_URL found");
        return;
    }

    console.log("Initializing Pool...");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    try {
        console.log("Connecting...");
        const client = await pool.connect();
        console.log("Connected! Querying...");
        const res = await client.query('SELECT NOW()');
        console.log("Query Result:", res.rows[0]);
        client.release();
    } catch (err) {
        console.error("Connection failed ERROR:", err);
    } finally {
        await pool.end();
        console.log("Pool ended.");
    }
}

testConnection();

