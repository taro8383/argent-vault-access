-- Create wine_translations table
CREATE TABLE IF NOT EXISTS wine_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wine_id UUID NOT NULL REFERENCES wines(id) ON DELETE CASCADE,
  language VARCHAR(5) NOT NULL,
  description TEXT,
  rationale TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(wine_id, language)
);

-- Enable RLS
ALTER TABLE wine_translations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON wine_translations
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON wine_translations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON wine_translations
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON wine_translations
  FOR DELETE USING (true);

-- Create index for faster lookups
CREATE INDEX idx_wine_translations_wine_id ON wine_translations(wine_id);
CREATE INDEX idx_wine_translations_language ON wine_translations(language);
