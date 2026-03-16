// Script to create the wine_translations table
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jcmmqoeugdjxdsacigwc.supabase.co';
const supabaseKey = 'sb_publishable_nxvjfYvNJNalTfwYJu_hnA_Ebec4tTs';

const supabase = createClient(supabaseUrl, supabaseKey);

const createTableSQL = `
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
CREATE INDEX IF NOT EXISTS idx_wine_translations_wine_id ON wine_translations(wine_id);
CREATE INDEX IF NOT EXISTS idx_wine_translations_language ON wine_translations(language);
`;

async function createTable() {
  console.log('Creating wine_translations table...');

  // Use Supabase's rpc to execute raw SQL
  const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL });

  if (error) {
    console.error('Error creating table:', error);

    // Try alternative: use REST API directly
    console.log('\nTrying alternative method...');

    // Just try to insert and see what happens
    const { error: insertError } = await supabase
      .from('wine_translations')
      .select('count')
      .limit(1);

    if (insertError && insertError.code === 'PGRST205') {
      console.error('\nTable does not exist!');
      console.log('\nPlease run this SQL manually in your Supabase SQL Editor:');
      console.log(createTableSQL);
    } else {
      console.log('Table already exists or another error occurred.');
    }
  } else {
    console.log('Table created successfully!');
  }
}

createTable().catch(console.error);
