import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface WineTranslation {
  id: string;
  wine_id: string;
  language: string;
  description: string;
  rationale: string;
  category: string;
  created_at: string;
  updated_at: string;
}

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'sr', name: 'Serbian' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
];

export function useTranslations() {
  const [translations, setTranslations] = useState<WineTranslation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('wine_translations')
      .select('*')
      .order('language');
    if (!error && data) setTranslations(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const upsert = async (translation: Partial<WineTranslation> & { wine_id: string; language: string }) => {
    const existing = translations.find(
      t => t.wine_id === translation.wine_id && t.language === translation.language
    );

    if (existing) {
      await supabase
        .from('wine_translations')
        .update({
          description: translation.description,
          rationale: translation.rationale,
          category: translation.category,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      await supabase.from('wine_translations').insert({
        wine_id: translation.wine_id,
        language: translation.language,
        description: translation.description || '',
        rationale: translation.rationale || '',
        category: translation.category || '',
      });
    }
    await fetch();
  };

  const remove = async (id: string) => {
    await supabase.from('wine_translations').delete().eq('id', id);
    await fetch();
  };

  const getTranslation = (wineId: string, language: string): WineTranslation | undefined => {
    return translations.find(t => t.wine_id === wineId && t.language === language);
  };

  return {
    translations,
    loading,
    upsert,
    remove,
    getTranslation,
    refetch: fetch,
    languages: SUPPORTED_LANGUAGES,
  };
}
