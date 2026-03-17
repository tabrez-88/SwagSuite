-- Task 1: invoices — notes + sentAt
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP;

-- Task 2: invoice reminders
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS reminder_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS reminder_frequency_days INTEGER;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS next_reminder_date TIMESTAMP;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS last_reminder_sent_at TIMESTAMP;

-- Task 3: contacts lead source
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS lead_source VARCHAR;

-- Task 4: companies custom fields
ALTER TABLE companies ADD COLUMN IF NOT EXISTS custom_fields JSONB;
