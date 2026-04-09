-- Add Goodsync folder URL to companies for file archive hyperlink (Bryan 3/17 import scope)
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "goodsync_folder_url" varchar;
