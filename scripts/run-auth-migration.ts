import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL!);

async function runMigration() {
  try {
    const migration = fs.readFileSync('migrations/0006_add_auth_tables.sql', 'utf-8');
    
    // Remove comments and split into statements
    const statements = migration
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n')
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    console.log(`Running ${statements.length} migration statements...\n`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        console.log(`${i + 1}. ${statement.substring(0, 60)}...`);
        await sql(statement);
      } catch (error: any) {
        // Ignore "already exists" errors
        if (error.code === '42P07' || error.code === '42710' || error.code === '42701') {
          console.log(`   ⚠️  Already exists, skipping`);
          continue;
        }
        throw error;
      }
    }
    
    console.log('\n✓ Authentication migration completed successfully!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
