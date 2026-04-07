-- Add error_message column to videos table for storing failure details
ALTER TABLE videos ADD COLUMN IF NOT EXISTS error_message TEXT;
