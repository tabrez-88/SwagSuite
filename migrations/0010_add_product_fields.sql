-- Add brand and category fields to products table, and convert colors to array
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "brand" varchar(255);
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "category" varchar(255);

-- Convert colors from text to text array if it doesn't exist as array already
-- First, drop the old column and recreate it as array
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'colors' 
        AND data_type = 'text'
    ) THEN
        -- Backup data, drop column, recreate as array
        ALTER TABLE "products" RENAME COLUMN "colors" TO "colors_old";
        ALTER TABLE "products" ADD COLUMN "colors" text[];
        
        -- Migrate data if needed (parse comma-separated to array)
        UPDATE "products" 
        SET "colors" = string_to_array("colors_old", ',') 
        WHERE "colors_old" IS NOT NULL AND "colors_old" != '';
        
        ALTER TABLE "products" DROP COLUMN "colors_old";
    END IF;
END $$;
