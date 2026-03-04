import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Wine, Category } from '@/lib/types';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order');
    if (!error && data) setCategories(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const upsert = async (cat: Partial<Category> & { name: string }) => {
    if (cat.id) {
      await supabase.from('categories').update({ name: cat.name, sort_order: cat.sort_order }).eq('id', cat.id);
    } else {
      const maxOrder = categories.length > 0 ? Math.max(...categories.map(c => c.sort_order)) + 1 : 0;
      await supabase.from('categories').insert({ name: cat.name, sort_order: cat.sort_order ?? maxOrder });
    }
    await fetch();
  };

  const remove = async (id: string) => {
    await supabase.from('categories').delete().eq('id', id);
    await fetch();
  };

  const reorder = async (updatedCategories: Category[]) => {
    const updates = updatedCategories.map((c, i) => ({ id: c.id, name: c.name, sort_order: i }));
    await supabase.from('categories').upsert(updates);
    await fetch();
  };

  return { categories, loading, upsert, remove, reorder, refetch: fetch };
}

export function useWines() {
  const [wines, setWines] = useState<Wine[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('wines')
      .select('*, category:categories(*)')
      .order('sort_order');
    if (!error && data) setWines(data as Wine[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const upsert = async (wine: Partial<Wine>) => {
    const { category, ...rest } = wine;
    if (rest.id) {
      await supabase.from('wines').update(rest).eq('id', rest.id);
    } else {
      const maxOrder = wines.length > 0 ? Math.max(...wines.map(w => w.sort_order)) + 1 : 0;
      await supabase.from('wines').insert({ ...rest, sort_order: rest.sort_order ?? maxOrder });
    }
    await fetch();
  };

  const remove = async (id: string) => {
    // Delete image from storage if exists
    const wine = wines.find(w => w.id === id);
    if (wine?.image_url) {
      const path = wine.image_url.split('/wine-images/')[1];
      if (path) await supabase.storage.from('wine-images').remove([path]);
    }
    await supabase.from('wines').delete().eq('id', id);
    await fetch();
  };

  const reorder = async (updatedWines: Wine[]) => {
    const updates = updatedWines.map((w, i) => ({ id: w.id, sort_order: i }));
    for (const u of updates) {
      await supabase.from('wines').update({ sort_order: u.sort_order }).eq('id', u.id);
    }
    await fetch();
  };

  const uploadImage = async (wineId: string, file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const path = `${wineId}.${ext}`;
    
    // Remove old image first
    await supabase.storage.from('wine-images').remove([path]);
    
    const { error } = await supabase.storage.from('wine-images').upload(path, file, { upsert: true });
    if (error) return null;
    
    const { data: urlData } = supabase.storage.from('wine-images').getPublicUrl(path);
    const url = urlData.publicUrl;
    
    await supabase.from('wines').update({ image_url: url }).eq('id', wineId);
    await fetch();
    return url;
  };

  const removeImage = async (wineId: string) => {
    const wine = wines.find(w => w.id === wineId);
    if (wine?.image_url) {
      const path = wine.image_url.split('/wine-images/')[1];
      if (path) await supabase.storage.from('wine-images').remove([path]);
    }
    await supabase.from('wines').update({ image_url: null }).eq('id', wineId);
    await fetch();
  };

  return { wines, loading, upsert, remove, reorder, uploadImage, removeImage, refetch: fetch };
}
