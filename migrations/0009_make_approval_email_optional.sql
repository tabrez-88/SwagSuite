-- Make client_email and client_name optional in artwork_approvals
-- This allows auto-generated approval links without requiring email/name upfront

ALTER TABLE artwork_approvals 
ALTER COLUMN client_email DROP NOT NULL;

ALTER TABLE artwork_approvals 
ALTER COLUMN client_name DROP NOT NULL;
