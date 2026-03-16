import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Wine } from '@/lib/types';
import { useTranslation } from 'react-i18next';

export interface WineWithTranslation extends Wine {
  translatedDescription?: string;
  translatedRationale?: string;
  translatedCategory?: string;
}

export function useWineTranslations(wines: Wine[]) {
  const { i18n } = useTranslation();
  const [translatedWines, setTranslatedWines] = useState<WineWithTranslation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTranslations = useCallback(async () => {
    if (!wines.length) {
      setTranslatedWines([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const currentLang = i18n.language;

    // For English, use base wine data
    if (currentLang === 'en') {
      setTranslatedWines(wines.map(w => ({
        ...w,
        translatedDescription: w.description,
        translatedRationale: w.rationale,
      })));
      setLoading(false);
      return;
    }

    // Fetch translations for current language
    const wineIds = wines.map(w => w.id);
    const { data: translations, error } = await supabase
      .from('wine_translations')
      .select('*')
      .in('wine_id', wineIds)
      .eq('language', currentLang);

    if (error) {
      console.error('Error fetching translations:', error);
      // Fallback to base wine data
      setTranslatedWines(wines.map(w => ({
        ...w,
        translatedDescription: w.description,
        translatedRationale: w.rationale,
      })));
      setLoading(false);
      return;
    }

    // Create translation lookup map
    const translationMap = new Map(
      translations?.map(t => [t.wine_id, t]) || []
    );

    // Merge translations with wine data
    const merged = wines.map(wine => {
      const translation = translationMap.get(wine.id);
      return {
        ...wine,
        translatedDescription: translation?.description || wine.description,
        translatedRationale: translation?.rationale || wine.rationale,
        translatedCategory: translation?.category || undefined,
      };
    });

    setTranslatedWines(merged);
    setLoading(false);
  }, [wines, i18n.language]);

  useEffect(() => {
    fetchTranslations();
  }, [fetchTranslations]);

  // Refetch when language changes
  useEffect(() => {
    const handleLanguageChanged = () => {
      fetchTranslations();
    };

    i18n.on('languageChanged', handleLanguageChanged);
    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, [i18n, fetchTranslations]);

  return { wines: translatedWines, loading, refetch: fetchTranslations };
}

// Hook to get a single wine's translation
export function useWineTranslation(wineId: string | undefined) {
  const { i18n } = useTranslation();
  const [translation, setTranslation] = useState<{
    description: string;
    rationale: string;
    category?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchTranslation = useCallback(async () => {
    if (!wineId) return;

    setLoading(true);
    const currentLang = i18n.language;

    if (currentLang === 'en') {
      // For English, fetch base wine data
      const { data, error } = await supabase
        .from('wines')
        .select('description, rationale')
        .eq('id', wineId)
        .single();

      if (!error && data) {
        setTranslation({
          description: data.description,
          rationale: data.rationale,
        });
      }
      setLoading(false);
      return;
    }

    // Fetch translation for current language
    const { data, error } = await supabase
      .from('wine_translations')
      .select('*')
      .eq('wine_id', wineId)
      .eq('language', currentLang)
      .single();

    if (!error && data) {
      setTranslation({
        description: data.description,
        rationale: data.rationale,
        category: data.category,
      });
    } else {
      // Fallback to base wine data
      const { data: wineData, error: wineError } = await supabase
        .from('wines')
        .select('description, rationale')
        .eq('id', wineId)
        .single();

      if (!wineError && wineData) {
        setTranslation({
          description: wineData.description,
          rationale: wineData.rationale,
        });
      }
    }

    setLoading(false);
  }, [wineId, i18n.language]);

  useEffect(() => {
    fetchTranslation();
  }, [fetchTranslation]);

  return { translation, loading, refetch: fetchTranslation };
}
