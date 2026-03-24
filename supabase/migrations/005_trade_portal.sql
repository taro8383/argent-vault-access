-- ============================================================
-- Migration 005: Trade Portal tables
-- ============================================================

-- trade_applications: public form submissions (no auth required)
CREATE TABLE IF NOT EXISTS trade_applications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name         TEXT NOT NULL,
  professional_title TEXT NOT NULL,
  property_name     TEXT NOT NULL,
  property_type     TEXT NOT NULL
                      CHECK (property_type IN ('hotel','restaurant','wine_bar','retailer','distributor','other')),
  market_country    TEXT NOT NULL,
  annual_spend      TEXT NOT NULL
                      CHECK (annual_spend IN ('under_50k','50k_150k','150k_500k','over_500k')),
  referral_source   TEXT NOT NULL,
  requirements      TEXT NOT NULL,
  tos_accepted      BOOLEAN NOT NULL DEFAULT false,
  privacy_accepted  BOOLEAN NOT NULL DEFAULT false,
  status            TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','approved','rejected')),
  reviewed_by       UUID REFERENCES auth.users(id),
  reviewed_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE trade_applications ENABLE ROW LEVEL SECURITY;

-- Public inserts (application form is unauthenticated)
CREATE POLICY "trade_applications_insert_public"
  ON trade_applications FOR INSERT
  WITH CHECK (true);

-- Only admins / service role can read
CREATE POLICY "trade_applications_select_admin"
  ON trade_applications FOR SELECT
  USING (auth.jwt() ->> 'role' = 'service_role');

-- trade_orders
CREATE TABLE IF NOT EXISTS trade_orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES user_profiles(id),
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','confirmed','shipped','delivered','invoiced')),
  total_aud       NUMERIC(10,2),
  invoice_url     TEXT,
  tracking_number TEXT,
  tracking_url    TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE trade_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trade_orders_select_own"
  ON trade_orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "trade_orders_insert_own"
  ON trade_orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "trade_orders_update_service"
  ON trade_orders FOR UPDATE
  USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role');

CREATE TRIGGER trade_orders_updated_at
  BEFORE UPDATE ON trade_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- trade_order_items
CREATE TABLE IF NOT EXISTS trade_order_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES trade_orders(id) ON DELETE CASCADE,
  wine_id     UUID NOT NULL REFERENCES wines(id),
  sku         TEXT NOT NULL,
  quantity    INTEGER NOT NULL,
  unit_price  NUMERIC(10,2) NOT NULL
);

ALTER TABLE trade_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trade_order_items_select_own"
  ON trade_order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trade_orders o
      WHERE o.id = order_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "trade_order_items_insert_own"
  ON trade_order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trade_orders o
      WHERE o.id = order_id AND o.user_id = auth.uid()
    )
  );

-- tasting_events
CREATE TABLE IF NOT EXISTS tasting_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  event_date      TIMESTAMPTZ NOT NULL,
  location        TEXT NOT NULL,
  format          TEXT NOT NULL
                    CHECK (format IN ('trade_tasting','masterclass','dinner','virtual')),
  wines_json      JSONB,
  capacity        INTEGER,
  is_past         BOOLEAN DEFAULT false,
  report_url      TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE tasting_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasting_events_select_trade"
  ON tasting_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('trade','admin')
        AND p.status = 'approved'
    )
  );

-- tasting_event_invites
CREATE TABLE IF NOT EXISTS tasting_event_invites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    UUID NOT NULL REFERENCES tasting_events(id),
  user_id     UUID NOT NULL REFERENCES user_profiles(id),
  status      TEXT DEFAULT 'requested'
                CHECK (status IN ('requested','confirmed','declined')),
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE tasting_event_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasting_event_invites_select_own"
  ON tasting_event_invites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "tasting_event_invites_insert_own"
  ON tasting_event_invites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tasting_event_invites_update_service"
  ON tasting_event_invites FOR UPDATE
  USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role');

-- market_reports
CREATE TABLE IF NOT EXISTS market_reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  quarter         TEXT NOT NULL,
  description     TEXT,
  file_url        TEXT NOT NULL,
  topics_json     JSONB,
  published_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE market_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "market_reports_select_trade"
  ON market_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('trade','admin')
        AND p.status = 'approved'
    )
  );

-- education_content
CREATE TABLE IF NOT EXISTS education_content (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type            TEXT NOT NULL
                    CHECK (type IN ('regional_guide','varietal','vintage','pairing','staff_training')),
  title           TEXT NOT NULL,
  body_markdown   TEXT,
  thumbnail_url   TEXT,
  file_url        TEXT,
  duration_mins   INTEGER,
  published_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE education_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "education_content_select_trade"
  ON education_content FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('trade','admin')
        AND p.status = 'approved'
    )
  );

-- preferred_partners
CREATE TABLE IF NOT EXISTS preferred_partners (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES user_profiles(id),
  tier                TEXT NOT NULL CHECK (tier IN ('silver','gold','platinum')),
  commitment_aud      NUMERIC(10,2) NOT NULL,
  actual_spend_aud    NUMERIC(10,2) DEFAULT 0,
  period_start        DATE NOT NULL,
  period_end          DATE NOT NULL,
  account_manager_id  UUID REFERENCES user_profiles(id)
);

ALTER TABLE preferred_partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "preferred_partners_select_own"
  ON preferred_partners FOR SELECT
  USING (auth.uid() = user_id);

-- account_managers
CREATE TABLE IF NOT EXISTS account_managers (
  id           UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name    TEXT NOT NULL,
  title        TEXT NOT NULL,
  email        TEXT NOT NULL,
  phone        TEXT,
  avatar_url   TEXT,
  calendar_url TEXT
);

ALTER TABLE account_managers ENABLE ROW LEVEL SECURITY;

-- Any approved trade/society user can read account manager details
CREATE POLICY "account_managers_select_authenticated"
  ON account_managers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles p
      WHERE p.id = auth.uid()
        AND p.status = 'approved'
    )
  );

-- direct_contact_requests
CREATE TABLE IF NOT EXISTS direct_contact_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES user_profiles(id),
  type            TEXT NOT NULL
                    CHECK (type IN ('tasting','sample','question','market_report','bespoke')),
  message         TEXT,
  preferred_date  DATE,
  wine_ids        JSONB,
  status          TEXT DEFAULT 'open'
                    CHECK (status IN ('open','in_progress','closed')),
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE direct_contact_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "direct_contact_requests_select_own"
  ON direct_contact_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "direct_contact_requests_insert_own"
  ON direct_contact_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- trade_messages (for order section messaging)
CREATE TABLE IF NOT EXISTS trade_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES user_profiles(id),
  body            TEXT NOT NULL,
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE trade_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trade_messages_select_own"
  ON trade_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "trade_messages_insert_own"
  ON trade_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_trade_orders_user_id ON trade_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_order_items_order_id ON trade_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_tasting_event_invites_user_id ON tasting_event_invites(user_id);
CREATE INDEX IF NOT EXISTS idx_preferred_partners_user_id ON preferred_partners(user_id);
CREATE INDEX IF NOT EXISTS idx_direct_contact_requests_user_id ON direct_contact_requests(user_id);
