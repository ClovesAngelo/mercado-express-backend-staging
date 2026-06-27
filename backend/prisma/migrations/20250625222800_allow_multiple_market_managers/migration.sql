-- Migration: Allow multiple market managers
-- Date: 2026-06-25
-- Description: Remove unique constraint from User.marketId to allow multiple managers per market

-- Drop unique constraint on User.marketId if it exists
-- This allows multiple users (gestores) to have the same marketId
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_marketId_key";

-- Note: Market.managerId is kept for backward compatibility
-- The source of truth is now User.marketId with the relation "MarketManagers"
-- Multiple gestores can have the same marketId

-- No data migration needed - existing data remains intact