// Script to import translations from JSON files to Supabase
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Supabase credentials
const supabaseUrl = 'https://jcmmqoeugdjxdsacigwc.supabase.co';
const supabaseKey = 'sb_publishable_nxvjfYvNJNalTfwYJu_hnA_Ebec4tTs';

const supabase = createClient(supabaseUrl, supabaseKey);

const languages = ['en', 'es', 'sr', 'zh', 'ja'];

async function importTranslations() {
  console.log('Starting translation import...');

  for (const lang of languages) {
    const filePath = join(__dirname, '../src/i18n/locales', lang, 'wines.json');

    try {
      const content = readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      const wines = data.wines;

      console.log(`\nImporting ${lang} translations...`);

      for (const [wineId, translation] of Object.entries(wines)) {
        const { description, rationale, category } = translation as any;

        // Check if translation already exists
        const { data: existing } = await supabase
          .from('wine_translations')
          .select('id')
          .eq('wine_id', wineId)
          .eq('language', lang)
          .single();

        if (existing) {
          // Update existing
          const { error } = await supabase
            .from('wine_translations')
            .update({
              description: description || '',
              rationale: rationale || '',
              category: category || '',
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);

          if (error) {
            console.error(`Error updating ${wineId} (${lang}):`, error);
          } else {
            console.log(`  Updated: ${wineId} (${lang})`);
          }
        } else {
          // Insert new
          const { error } = await supabase
            .from('wine_translations')
            .insert({
              wine_id: wineId,
              language: lang,
              description: description || '',
              rationale: rationale || '',
              category: category || '',
            });

          if (error) {
            console.error(`Error inserting ${wineId} (${lang}):`, error);
          } else {
            console.log(`  Inserted: ${wineId} (${lang})`);
          }
        }
      }
    } catch (err) {
      console.error(`Error reading ${lang} translations:`, err);
    }
  }

  console.log('\nImport complete!');
}

importTranslations().catch(console.error);
