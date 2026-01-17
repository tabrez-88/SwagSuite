import { Pool } from '@neondatabase/serverless';
import { config } from 'dotenv';

// Load environment variables
config();

async function convertSizesToArray() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const pool = new Pool({ connectionString });
  const sql = async (strings: TemplateStringsArray, ...values: any[]) => {
    const text = strings.reduce((acc, str, i) => acc + str + (values[i] !== undefined ? '$' + (i + 1) : ''), '');
    return pool.query(text, values);
  };
  sql.unsafe = async (query: string) => pool.query(query);

  try {
    console.log("Converting sizes columns from text to text[]...\n");

    // Tables that have sizes column
    const tables = [
      "products",
      "esp_products", 
      "sage_products",
      "product_search_index",
      "ss_activewear_products"
    ];

    for (const table of tables) {
      console.log(`Processing ${table}...`);
      
      // Check if column exists and get its type
      const columnCheck = await pool.query(
        `SELECT data_type 
         FROM information_schema.columns 
         WHERE table_name = $1 
         AND column_name = 'sizes'`,
        [table]
      );

      if (columnCheck.rows.length === 0) {
        console.log(`  ⚠️  No sizes column in ${table}`);
        continue;
      }

      if (columnCheck.rows[0].data_type === 'ARRAY') {
        console.log(`  ✓ Already array type in ${table}`);
        continue;
      }

      // Convert the column
      try {
        await pool.query(`
          ALTER TABLE ${table} 
          ALTER COLUMN sizes TYPE text[] 
          USING CASE 
            WHEN sizes IS NULL THEN NULL
            WHEN sizes = '' THEN ARRAY[]::text[]
            WHEN sizes LIKE '%,%' THEN string_to_array(sizes, ',')
            ELSE ARRAY[sizes]::text[]
          END
        `);
        console.log(`  ✓ Converted ${table}.sizes to text[]`);
      } catch (error: any) {
        console.log(`  ✗ Error converting ${table}: ${error.message}`);
      }
    }

    // Do the same for colors column
    console.log("\nConverting colors columns from text to text[]...\n");

    for (const table of tables) {
      console.log(`Processing ${table}...`);
      
      const columnCheck = await pool.query(
        `SELECT data_type 
         FROM information_schema.columns 
         WHERE table_name = $1 
         AND column_name = 'colors'`,
        [table]
      );

      if (columnCheck.rows.length === 0) {
        console.log(`  ⚠️  No colors column in ${table}`);
        continue;
      }

      if (columnCheck.rows[0].data_type === 'ARRAY') {
        console.log(`  ✓ Already array type in ${table}`);
        continue;
      }

      try {
        await pool.query(`
          ALTER TABLE ${table} 
          ALTER COLUMN colors TYPE text[] 
          USING CASE 
            WHEN colors IS NULL THEN NULL
            WHEN colors = '' THEN ARRAY[]::text[]
            WHEN colors LIKE '%,%' THEN string_to_array(colors, ',')
            ELSE ARRAY[colors]::text[]
          END
        `);
        console.log(`  ✓ Converted ${table}.colors to text[]`);
      } catch (error: any) {
        console.log(`  ✗ Error converting ${table}: ${error.message}`);
      }
    }

    console.log("\n✅ Conversion complete!");

  } catch (error) {
    console.error("Error:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

convertSizesToArray();
