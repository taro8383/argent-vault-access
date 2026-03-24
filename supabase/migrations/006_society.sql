-- ============================================================
-- Migration 006: Private Allocation Society tables
-- ============================================================

-- society_applications: public multi-step form (invite-gated, no auth)
CREATE TABLE IF NOT EXISTS society_applications (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name           TEXT NOT NULL,
  email               TEXT NOT NULL,
  phone               TEXT NOT NULL,
  delivery_address    JSONB NOT NULL,
  alt_address         JSONB,
  preferred_window    TEXT,
  building_access     TEXT,
  storage_type        TEXT NOT NULL
                        CHECK (storage_type IN ('cellar','fridge','ambient','mixed')),
  birth_date          DATE NOT NULL,
  age_verified        BOOLEAN NOT NULL DEFAULT false,
  selected_tier       TEXT NOT NULL
                        CHECK (selected_tier IN ('founding','private','collector')),
  invite_token        TEXT,
  referral_source     TEXT,
  status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','approved','rejected','waitlist')),
  stripe_customer_id  TEXT,
  stripe_sub_id       TEXT,
  created_at          TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE society_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "society_applications_insert_public"
  ON society_applications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "society_applications_select_service"
  ON society_applications FOR SELECT
  USING (auth.jwt() ->> 'role' = 'service_role');

-- society_waitlist: public sign-up (no auth)
CREATE TABLE IF NOT EXISTS society_waitlist (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT NOT NULL UNIQUE,
  full_name   TEXT,
  country     TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE society_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "society_waitlist_insert_public"
  ON society_waitlist FOR INSERT
  WITH CHECK (true);

-- society_invite_tokens
CREATE TABLE IF NOT EXISTS society_invite_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token       TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  email       TEXT,
  tier        TEXT,
  used        BOOLEAN DEFAULT false,
  expires_at  TIMESTAMPTZ,
  created_by  UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE society_invite_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "society_invite_tokens_select_service"
  ON society_invite_tokens FOR SELECT
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "society_invite_tokens_update_service"
  ON society_invite_tokens FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "society_invite_tokens_insert_admin"
  ON society_invite_tokens FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- society_members: approved members with full profile
CREATE TABLE IF NOT EXISTS society_members (
  id                  UUID PRIMARY KEY REFERENCES user_profiles(id),
  tier                TEXT NOT NULL CHECK (tier IN ('founding','private','collector')),
  member_since        DATE NOT NULL DEFAULT CURRENT_DATE,
  delivery_address    JSONB NOT NULL,
  alt_address         JSONB,
  preferred_window    TEXT,
  building_access     TEXT,
  storage_type        TEXT NOT NULL,
  birth_date          DATE NOT NULL,
  stripe_customer_id  TEXT NOT NULL,
  stripe_sub_id       TEXT NOT NULL,
  annual_fee_aud      NUMERIC(10,2) NOT NULL,
  next_billing_date   DATE,
  allocation_count    INTEGER DEFAULT 0
);

ALTER TABLE society_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "society_members_select_own"
  ON society_members FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "society_members_update_own"
  ON society_members FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "society_members_insert_service"
  ON society_members FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- society_allocations
CREATE TABLE IF NOT EXISTS society_allocations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id       UUID NOT NULL REFERENCES society_members(id),
  allocation_num  INTEGER NOT NULL,
  period_label    TEXT NOT NULL,
  wines_json      JSONB NOT NULL,
  ship_date       DATE,
  tracking_number TEXT,
  tracking_url    TEXT,
  status          TEXT NOT NULL DEFAULT 'upcoming'
                    CHECK (status IN ('upcoming','shipped','delivered')),
  notes_story_url TEXT,
  total_value_aud NUMERIC(10,2),
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE society_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "society_allocations_select_own"
  ON society_allocations FOR SELECT
  USING (auth.uid() = member_id);

CREATE POLICY "society_allocations_insert_service"
  ON society_allocations FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "society_allocations_update_service"
  ON society_allocations FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'service_role');

-- society_purchases
CREATE TABLE IF NOT EXISTS society_purchases (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id       UUID NOT NULL REFERENCES society_members(id),
  wine_id         UUID NOT NULL REFERENCES wines(id),
  quantity        INTEGER NOT NULL,
  unit_price_aud  NUMERIC(10,2) NOT NULL,
  all_in_price    NUMERIC(10,2) NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','confirmed','shipped','delivered')),
  tracking_url    TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE society_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "society_purchases_select_own"
  ON society_purchases FOR SELECT
  USING (auth.uid() = member_id);

CREATE POLICY "society_purchases_insert_own"
  ON society_purchases FOR INSERT
  WITH CHECK (
    auth.uid() = member_id AND
    EXISTS (
      SELECT 1 FROM society_members m
      WHERE m.id = member_id
        AND m.tier IN ('private','collector')
    )
  );

-- society_events
CREATE TABLE IF NOT EXISTS society_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  event_date      TIMESTAMPTZ NOT NULL,
  location        TEXT NOT NULL,
  format          TEXT NOT NULL
                    CHECK (format IN ('private_tasting','annual_dinner','winemaker_dinner')),
  tier_access     TEXT[] NOT NULL,
  capacity        INTEGER,
  description     TEXT,
  image_url       TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE society_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "society_events_select_member"
  ON society_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM society_members m
      WHERE m.id = auth.uid()
    )
  );

-- society_event_rsvps
CREATE TABLE IF NOT EXISTS society_event_rsvps (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    UUID NOT NULL REFERENCES society_events(id),
  member_id   UUID NOT NULL REFERENCES society_members(id),
  status      TEXT DEFAULT 'attending'
                CHECK (status IN ('attending','declined')),
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, member_id)
);

ALTER TABLE society_event_rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "society_event_rsvps_select_own"
  ON society_event_rsvps FOR SELECT
  USING (auth.uid() = member_id);

CREATE POLICY "society_event_rsvps_insert_own"
  ON society_event_rsvps FOR INSERT
  WITH CHECK (auth.uid() = member_id);

CREATE POLICY "society_event_rsvps_update_own"
  ON society_event_rsvps FOR UPDATE
  USING (auth.uid() = member_id);

-- society_cellar_notes
CREATE TABLE IF NOT EXISTS society_cellar_notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id   UUID NOT NULL REFERENCES society_members(id),
  wine_id     UUID REFERENCES wines(id),
  note        TEXT NOT NULL,
  drink_from  DATE,
  drink_to    DATE,
  bottles     INTEGER,
  created_by  UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE society_cellar_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "society_cellar_notes_select_own"
  ON society_cellar_notes FOR SELECT
  USING (auth.uid() = member_id OR auth.uid() = created_by);

CREATE POLICY "society_cellar_notes_insert_own"
  ON society_cellar_notes FOR INSERT
  WITH CHECK (auth.uid() = member_id OR auth.jwt() ->> 'role' = 'service_role');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_society_allocations_member_id ON society_allocations(member_id);
CREATE INDEX IF NOT EXISTS idx_society_purchases_member_id ON society_purchases(member_id);
CREATE INDEX IF NOT EXISTS idx_society_event_rsvps_member_id ON society_event_rsvps(member_id);
CREATE INDEX IF NOT EXISTS idx_society_cellar_notes_member_id ON society_cellar_notes(member_id);
CREATE INDEX IF NOT EXISTS idx_society_invite_tokens_token ON society_invite_tokens(token);
