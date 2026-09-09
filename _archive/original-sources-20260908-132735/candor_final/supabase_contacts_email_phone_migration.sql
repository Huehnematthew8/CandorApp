-- Run this in your Supabase SQL Editor (dashboard.supabase.com → SQL Editor)
-- Adds email and phone columns to the contacts table

ALTER TABLE contacts ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS phone TEXT;
