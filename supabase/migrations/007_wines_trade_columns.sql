-- ============================================================
-- Migration 007: Extend wines table with trade portal columns
-- ============================================================

ALTER TABLE wines ADD COLUMN IF NOT EXISTS trade_price_aud  NUMERIC(10,2);
ALTER TABLE wines ADD COLUMN IF NOT EXISTS srp_aud          NUMERIC(10,2);
ALTER TABLE wines ADD COLUMN IF NOT EXISTS moq              INTEGER DEFAULT 6;
ALTER TABLE wines ADD COLUMN IF NOT EXISTS availability     TEXT DEFAULT 'in_stock'
  CHECK (availability IN ('in_stock','pre_release','allocated','out_of_stock'));
ALTER TABLE wines ADD COLUMN IF NOT EXISTS lead_time_weeks  INTEGER;
ALTER TABLE wines ADD COLUMN IF NOT EXISTS production_cases INTEGER;
ALTER TABLE wines ADD COLUMN IF NOT EXISTS tech_sheet_url   TEXT;
ALTER TABLE wines ADD COLUMN IF NOT EXISTS pairing_notes    TEXT;
ALTER TABLE wines ADD COLUMN IF NOT EXISTS society_price_aud NUMERIC(10,2);
