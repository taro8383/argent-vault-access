import { useState, useEffect, useRef } from "react";
import type { Wine, Category } from "@/lib/types";
import { useWines, useCategories } from "@/hooks/use-wine-data";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Plus, Trash2, Save, ChevronDown, ChevronUp, Upload, X, Image, Layers, Copy, Languages, Download,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useTranslations } from "@/hooks/use-translations";

const WINE_COLORS = [
  { label: "Burgundy", value: "bg-burgundy" },
  { label: "Burgundy Light", value: "bg-burgundy-light" },
  { label: "Charcoal Light", value: "bg-charcoal-light" },
  { label: "Charcoal Lighter", value: "bg-charcoal-lighter" },
];

// Region Autocomplete Component
interface RegionAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  existingRegions: string[];
}

const RegionAutocomplete = ({ value, onChange, existingRegions }: RegionAutocompleteProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter regions based on input
  const filteredRegions = inputValue
    ? existingRegions.filter(r =>
        r.toLowerCase().includes(inputValue.toLowerCase()) &&
        r.toLowerCase() !== inputValue.toLowerCase()
      )
    : existingRegions;

  const handleSelect = (region: string) => {
    onChange(region);
    setInputValue(region);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
    setIsOpen(true);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <Input
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        placeholder="Type or select region..."
        className="w-full"
      />
      {isOpen && filteredRegions.length > 0 && (
        <div
          className="absolute z-[100] w-full mt-1 bg-background border border-primary/30 rounded-md shadow-xl max-h-48 overflow-y-auto"
          style={{ minWidth: '200px' }}
        >
          {filteredRegions.map((region) => (
            <div
              key={region}
              onClick={() => handleSelect(region)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-primary/20 cursor-pointer transition-colors"
            >
              {region}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Translations Manager Component
interface TranslationsManagerProps {
  wines: Wine[];
  categories: Category[];
  translations: import("@/hooks/use-translations").WineTranslation[];
  languages: { code: string; name: string }[];
  loading: boolean;
  onSave: (translation: Partial<import("@/hooks/use-translations").WineTranslation> & { wine_id: string; language: string }) => Promise<void>;
  onUpdateWine?: (wineId: string, data: Partial<Wine>) => Promise<void>;
}

const TranslationsManager = ({ wines, categories, translations, languages, loading, onSave, onUpdateWine }: TranslationsManagerProps) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | "">("");
  const [selectedWineId, setSelectedWineId] = useState<string | "">("");
  const [selectedLang, setSelectedLang] = useState<string>("en");
  const [editingDescription, setEditingDescription] = useState("");
  const [editingRationale, setEditingRationale] = useState("");
  const [saving, setSaving] = useState(false);

  // Filter wines by selected category
  const filteredWines = selectedCategoryId
    ? wines.filter(w => w.category_id === selectedCategoryId)
    : wines;

  const selectedWine = wines.find(w => w.id === selectedWineId);
  const existingTranslation = translations.find(t => t.wine_id === selectedWineId && t.language === selectedLang);

  // Handle category change - reset wine selection
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedWineId(""); // Reset wine when category changes
  };

  useEffect(() => {
    if (selectedLang === 'en' && selectedWine) {
      // For English, show the base wine content
      setEditingDescription(selectedWine.description || '');
      setEditingRationale(selectedWine.rationale || '');
    } else if (existingTranslation) {
      setEditingDescription(existingTranslation.description);
      setEditingRationale(existingTranslation.rationale);
    } else {
      setEditingDescription("");
      setEditingRationale("");
    }
  }, [selectedWineId, selectedLang, existingTranslation, selectedWine]);

  const handleSave = async () => {
    if (!selectedWineId) return;
    setSaving(true);

    if (selectedLang === 'en' && onUpdateWine) {
      // For English, update the base wine record
      await onUpdateWine(selectedWineId, {
        description: editingDescription,
        rationale: editingRationale,
      });
    }

    // Also save to translations table for all languages
    await onSave({
      wine_id: selectedWineId,
      language: selectedLang,
      description: editingDescription,
      rationale: editingRationale,
    });
    setSaving(false);
    toast({ title: "Translation saved" });
  };

  const getTranslationStatus = (wineId: string) => {
    const wine = wines.find(w => w.id === wineId);
    const wineTranslations = translations.filter(t => t.wine_id === wineId);
    return languages.map(lang => {
      // English is considered translated if base wine has content
      if (lang.code === 'en') {
        const hasEnglish = !!(wine?.description || wine?.rationale);
        return { ...lang, hasTranslation: hasEnglish };
      }
      // Other languages check the translations table
      return {
        ...lang,
        hasTranslation: wineTranslations.some(t => t.language === lang.code && (t.description || t.rationale)),
      };
    });
  };

  if (loading) {
    return <div className="text-center py-20 text-muted-foreground">Loading translations…</div>;
  }

  return (
    <div className="space-y-6">
      {/* Wine Selection */}
      <Card className="border-primary/10">
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Category Filter */}
            <div>
              <Label className="text-xs mb-2 block">Select Category</Label>
              <select
                value={selectedCategoryId}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">-- All Categories --</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({wines.filter(w => w.category_id === cat.id).length} wines)
                  </option>
                ))}
              </select>
            </div>

            {/* Wine Selection */}
            <div>
              <Label className="text-xs mb-2 block">Select Wine</Label>
              <select
                value={selectedWineId}
                onChange={(e) => setSelectedWineId(e.target.value)}
                disabled={!selectedCategoryId}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {selectedCategoryId ? "-- Select a wine --" : "-- First select a category --"}
                </option>
                {filteredWines.sort((a, b) => a.sort_order - b.sort_order).map(wine => (
                  <option key={wine.id} value={wine.id}>
                    {wine.name} ({wine.vintage})
                  </option>
                ))}
              </select>
            </div>

            {selectedWine && (
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="text-xs text-muted-foreground mr-2">Translation Status:</span>
                {getTranslationStatus(selectedWine.id).map(status => (
                  <span
                    key={status.code}
                    className={`text-[10px] px-2 py-0.5 rounded ${
                      status.hasTranslation
                        ? "bg-green-500/20 text-green-400"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {status.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedWine && (
        <Card className="border-primary/10">
          <CardContent className="pt-6 space-y-4">
            {/* Language Selection */}
            <div>
              <Label className="text-xs mb-2 block">Language</Label>
              <div className="flex flex-wrap gap-2">
                {languages.map(lang => (
                  <Button
                    key={lang.code}
                    variant={selectedLang === lang.code ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedLang(lang.code)}
                  >
                    {lang.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-xs">Description ({languages.find(l => l.code === selectedLang)?.name})</Label>
              <Textarea
                value={editingDescription}
                onChange={(e) => setEditingDescription(e.target.value)}
                rows={4}
                placeholder={`Enter description in ${languages.find(l => l.code === selectedLang)?.name}...`}
              />
              <p className="text-[10px] text-muted-foreground">
                Default (English): {selectedWine.description?.substring(0, 100)}...
              </p>
            </div>

            {/* Rationale */}
            <div className="space-y-2">
              <Label className="text-xs">Market Rationale ({languages.find(l => l.code === selectedLang)?.name})</Label>
              <Textarea
                value={editingRationale}
                onChange={(e) => setEditingRationale(e.target.value)}
                rows={6}
                placeholder={`Enter market rationale in ${languages.find(l => l.code === selectedLang)?.name}...`}
              />
              <p className="text-[10px] text-muted-foreground">
                Default (English): {selectedWine.rationale?.substring(0, 100)}...
              </p>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                <Save size={14} />
                {saving ? "Saving..." : "Save Translation"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Buttons */}
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            // Build export data for DESCRIPTIONS (rationale changes per category, description doesn't)
            const exportData: Record<string, any[]> = {};
            const processedWineIds = new Set<string>();

            // Group wines by normalized name+vintage to find duplicates across categories
            const normalizeKey = (name: string, vintage: string) => {
              return `${name.trim().toLowerCase()}|${vintage.trim()}`;
            };

            const wineGroups: Record<string, { id: string; catId: string; catName: string; wine: Wine }[]> = {};
            wines.forEach(wine => {
              const key = normalizeKey(wine.name, wine.vintage);
              if (!wineGroups[key]) wineGroups[key] = [];
              const cat = categories.find(c => c.id === wine.category_id);
              wineGroups[key].push({ id: wine.id, catId: wine.category_id, catName: cat?.name || 'Unknown', wine });
            });

            // Build export data - descriptions are same across categories
            categories.forEach(cat => {
              const catWines = wines
                .filter(w => w.category_id === cat.id)
                .sort((a, b) => a.sort_order - b.sort_order);

              exportData[cat.name] = catWines.map(wine => {
                const wineKey = normalizeKey(wine.name, wine.vintage);
                const group = wineGroups[wineKey];
                const isMultiCategory = group.length > 1;
                const otherCategories = isMultiCategory
                  ? group.filter(g => g.catId !== cat.id).map(g => g.catName)
                  : [];

                const isFirstAppearance = !processedWineIds.has(wineKey);

                if (isFirstAppearance) {
                  // First time we see this wine - include full description
                  processedWineIds.add(wineKey);
                  return {
                    id: wine.id,
                    name: wine.name,
                    vintage: wine.vintage,
                    description: wine.description,
                    ...(otherCategories.length > 0 && {
                      alsoInCategories: otherCategories
                    })
                  };
                } else {
                  // Wine already appeared - just reference it
                  const firstCat = group[0].catName;
                  return {
                    id: wine.id,
                    name: wine.name,
                    vintage: wine.vintage,
                    reference: true,
                    seeFullEntryIn: firstCat
                  };
                }
              });
            });

            // Build formatted text output with proper line breaks
            let textOutput = '';
            Object.entries(exportData).forEach(([category, catWines]) => {
              textOutput += `=== ${category} ===\n\n`;
              catWines.forEach((wine: any) => {
                if (wine.reference) {
                  textOutput += `[${wine.name} ${wine.vintage}]\n`;
                  textOutput += `Reference: see full entry in "${wine.seeFullEntryIn}"\n\n`;
                } else {
                  textOutput += `[${wine.name} ${wine.vintage}]\n`;
                  textOutput += `ID: ${wine.id}\n`;
                  textOutput += `${wine.description}\n`;
                  if (wine.alsoInCategories && wine.alsoInCategories.length > 0) {
                    textOutput += `\nAlso in: ${wine.alsoInCategories.join(', ')}\n`;
                  }
                  textOutput += `\n---\n\n`;
                }
              });
              textOutput += '\n';
            });

            // Download as formatted text
            const blob = new Blob([textOutput], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `wine-descriptions-export-${new Date().toISOString().split('T')[0]}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast({ title: "Descriptions exported" });
          }}
          className="gap-2"
        >
          <Download size={14} />
          Export Descriptions
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            // Build export data for RATIONALES (rationale is different per category)
            const exportData: Record<string, any[]> = {};

            // For rationale, each wine appears fully in EACH category
            // because the rationale is category-specific
            categories.forEach(cat => {
              const catWines = wines
                .filter(w => w.category_id === cat.id)
                .sort((a, b) => a.sort_order - b.sort_order);

              exportData[cat.name] = catWines.map(wine => ({
                id: wine.id,
                name: wine.name,
                vintage: wine.vintage,
                rationale: wine.rationale,
              }));
            });

            // Build formatted text output with proper line breaks
            let textOutput = '';
            Object.entries(exportData).forEach(([category, catWines]) => {
              textOutput += `=== ${category} ===\n\n`;
              catWines.forEach((wine: any) => {
                textOutput += `[${wine.name} ${wine.vintage}]\n`;
                textOutput += `ID: ${wine.id}\n\n`;
                textOutput += `${wine.rationale}\n`;
                textOutput += `\n---\n\n`;
              });
              textOutput += '\n';
            });

            // Download as formatted text
            const blob = new Blob([textOutput], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `wine-rationales-export-${new Date().toISOString().split('T')[0]}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast({ title: "Rationales exported" });
          }}
          className="gap-2"
        >
          <Download size={14} />
          Export Rationales
        </Button>
      </div>

      {/* Bulk Overview */}
      <Card className="border-primary/10">
        <CardContent className="pt-6">
          <h3 className="font-serif text-lg mb-4">Translation Overview</h3>
          <div className="space-y-2">
            {categories.map(cat => (
              <div key={cat.id} className="border-b border-primary/10 pb-2 last:border-0">
                <h4 className="font-medium text-sm text-primary mb-2">{cat.name}</h4>
                <div className="space-y-1">
                  {wines.filter(w => w.category_id === cat.id).map(wine => {
                    const status = getTranslationStatus(wine.id);
                    const translatedCount = status.filter(s => s.hasTranslation).length;
                    return (
                      <div
                        key={wine.id}
                        className="flex items-center justify-between text-xs py-1 px-2 hover:bg-secondary/50 rounded cursor-pointer"
                        onClick={() => setSelectedWineId(wine.id)}
                      >
                        <span className="truncate flex-1">{wine.name}</span>
                        <div className="flex gap-1 ml-2">
                          {status.map(s => (
                            <span
                              key={s.code}
                              className={`w-2 h-2 rounded-full ${
                                s.hasTranslation ? "bg-green-500" : "bg-muted"
                              }`}
                              title={s.name}
                            />
                          ))}
                          <span className="text-muted-foreground ml-1 w-12 text-right">
                            {translatedCount}/{languages.length}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const Admin = () => {
  const { wines, loading: winesLoading, upsert: upsertWine, remove: removeWine, reorder: reorderWines, uploadImage, removeImage } = useWines();
  const { categories, loading: catsLoading, upsert: upsertCategory, remove: removeCategory, reorder: reorderCategories } = useCategories();
  const { translations, loading: translationsLoading, upsert: upsertTranslation, languages } = useTranslations();

  const [expandedWineId, setExpandedWineId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"wines" | "categories" | "translations">("wines");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | "all">("all");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategories, setEditingCategories] = useState<Record<string, string>>({});
  const [editingWines, setEditingWines] = useState<Record<string, Partial<Wine>>>({});

  // Filter wines by selected category
  const filteredWines = selectedCategoryId === "all"
    ? wines
    : wines.filter(w => w.category_id === selectedCategoryId);

  // --- Wine handlers ---
  const handleAddWine = async () => {
    // Use selected category if not "all", otherwise use first category
    const categoryId = selectedCategoryId !== "all"
      ? selectedCategoryId
      : (categories[0]?.id ?? "");
    const newWine = await upsertWine({
      name: "New Wine",
      category_id: categoryId,
      region: "",
      altitude: "",
      score: "",
      vintage: "",
      description: "",
      rationale: "",
      winemaker: "",
      color: WINE_COLORS[0].value,
      image_url: null,
    });
    if (newWine?.id) {
      setExpandedWineId(newWine.id);
      // Pre-populate editing state so save button shows
      setEditingWines(prev => ({ ...prev, [newWine.id]: { name: "New Wine", category_id: categoryId } }));
    }
    toast({ title: "Wine added - click to edit" });
  };

  const handleWineChange = (wineId: string, field: keyof Wine, value: string) => {
    setEditingWines(prev => ({
      ...prev,
      [wineId]: { ...prev[wineId], [field]: value }
    }));
  };

  const handleSaveWine = async (wine: Wine) => {
    const changes = editingWines[wine.id];
    if (!changes) return;
    await upsertWine({ ...wine, ...changes });
    setEditingWines(prev => {
      const next = { ...prev };
      delete next[wine.id];
      return next;
    });
    toast({ title: "Wine saved" });
  };

  const getWineValue = (wine: Wine, field: keyof Wine): string => {
    return (editingWines[wine.id]?.[field] as string) ?? (wine[field] as string) ?? "";
  };

  const handleMoveWine = async (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= wines.length) return;
    const updated = [...wines];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    await reorderWines(updated);
  };

  const handleDeleteWine = async (id: string) => {
    await removeWine(id);
    toast({ title: "Wine deleted" });
  };

  const handleDuplicateWine = async (wine: Wine) => {
    const duplicated = await upsertWine({
      name: `${wine.name} (Copy)`,
      category_id: wine.category_id,
      region: wine.region,
      altitude: wine.altitude,
      score: wine.score,
      vintage: wine.vintage,
      description: wine.description,
      rationale: wine.rationale,
      winemaker: wine.winemaker,
      color: wine.color,
      image_url: null, // Don't copy image to avoid conflicts
    });
    if (duplicated?.id) {
      setExpandedWineId(duplicated.id);
      setEditingWines(prev => ({
        ...prev,
        [duplicated.id]: {
          name: `${wine.name} (Copy)`,
          category_id: wine.category_id,
          region: wine.region,
          altitude: wine.altitude,
          score: wine.score,
          vintage: wine.vintage,
          description: wine.description,
          rationale: wine.rationale,
          winemaker: wine.winemaker,
          color: wine.color,
        }
      }));
      toast({ title: "Wine duplicated - edit the copy" });
    }
  };

  const handleImageUpload = async (wineId: string, file: File) => {
    const url = await uploadImage(wineId, file);
    if (url) {
      toast({ title: "Image uploaded" });
    } else {
      toast({ title: "Upload failed", variant: "destructive" });
    }
  };

  const handleRemoveImage = async (wineId: string) => {
    await removeImage(wineId);
    toast({ title: "Image removed" });
  };

  // --- Category handlers ---
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    await upsertCategory({ name: newCategoryName.trim() });
    setNewCategoryName("");
    toast({ title: "Category added" });
  };

  const handleDeleteCategory = async (id: string) => {
    const winesInCat = wines.filter(w => w.category_id === id);
    if (winesInCat.length > 0) {
      toast({ title: "Cannot delete", description: `${winesInCat.length} wine(s) still use this category.`, variant: "destructive" });
      return;
    }
    await removeCategory(id);
    toast({ title: "Category deleted" });
  };

  const handleMoveCategory = async (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= categories.length) return;
    const updated = [...categories];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    await reorderCategories(updated);
  };

  const handleCategoryNameChange = (catId: string, value: string) => {
    setEditingCategories(prev => ({ ...prev, [catId]: value }));
  };

  const handleSaveCategory = async (cat: Category) => {
    const newName = editingCategories[cat.id];
    if (!newName || newName === cat.name) return;
    await upsertCategory({ ...cat, name: newName.trim() });
    setEditingCategories(prev => {
      const next = { ...prev };
      delete next[cat.id];
      return next;
    });
    toast({ title: "Category saved" });
  };

  const isLoading = winesLoading || catsLoading;

  return (
    <>
      <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-primary/20 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl text-primary">GC Admin</h1>
            <p className="text-xs text-muted-foreground tracking-wider">Wine Vault Manager</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={activeTab === "wines" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("wines")}
              className="gap-2"
            >
              <Layers size={14} /> Wines
            </Button>
            <Button
              variant={activeTab === "categories" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("categories")}
              className="gap-2"
            >
              <Layers size={14} /> Categories
            </Button>
            <Button
              variant={activeTab === "translations" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("translations")}
              className="gap-2"
            >
              <Languages size={14} /> Translations
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="text-center py-20 text-muted-foreground">Loading…</div>
        ) : activeTab === "categories" ? (
          /* ---------- Categories Tab ---------- */
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-xl">{categories.length} Categories</h2>
            </div>

            {/* Add new */}
            <div className="flex gap-3 mb-6">
              <Input
                placeholder="New category name…"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
              />
              <Button onClick={handleAddCategory} size="sm" className="gap-2 shrink-0">
                <Plus size={14} /> Add
              </Button>
            </div>

            {categories.map((cat, index) => (
              <Card key={cat.id} className="border-primary/10">
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleMoveCategory(index, -1)}
                      disabled={index === 0}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-20"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      onClick={() => handleMoveCategory(index, 1)}
                      disabled={index === categories.length - 1}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-20"
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>
                  <Input
                    value={editingCategories[cat.id] ?? cat.name}
                    onChange={(e) => handleCategoryNameChange(cat.id, e.target.value)}
                    className="flex-1 font-serif"
                  />
                  {editingCategories[cat.id] && editingCategories[cat.id] !== cat.name && (
                    <Button
                      onClick={() => handleSaveCategory(cat)}
                      size="sm"
                      className="gap-2 shrink-0"
                    >
                      <Save size={14} /> Save
                    </Button>
                  )}
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {wines.filter(w => w.category_id === cat.id).length} wines
                  </span>
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        ) : activeTab === "translations" ? (
          /* ---------- Translations Tab ---------- */
          <TranslationsManager
            wines={wines}
            categories={categories}
            translations={translations}
            languages={languages}
            loading={translationsLoading}
            onSave={upsertTranslation}
            onUpdateWine={async (wineId, data) => {
              const wine = wines.find(w => w.id === wineId);
              if (wine) {
                await upsertWine({ ...wine, ...data });
              }
            }}
          />
        ) : (
          /* ---------- Wines Tab ---------- */
          <div className="space-y-4">
            {/* Category Filter Tabs */}
            <div className="flex flex-wrap gap-2 mb-4">
              <Button
                variant={selectedCategoryId === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategoryId("all")}
              >
                All ({wines.length})
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  variant={selectedCategoryId === cat.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategoryId(cat.id)}
                >
                  {cat.name} ({wines.filter(w => w.category_id === cat.id).length})
                </Button>
              ))}
            </div>

            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-xl">
                {filteredWines.length} Wine{filteredWines.length !== 1 ? "s" : ""}
                {selectedCategoryId !== "all" && " in " + categories.find(c => c.id === selectedCategoryId)?.name}
              </h2>
              <Button onClick={handleAddWine} size="sm" variant="outline" className="gap-2">
                <Plus size={14} /> Add Wine
              </Button>
            </div>

            {filteredWines.map((wine) => {
              const isExpanded = expandedWineId === wine.id;
              const catName = categories.find(c => c.id === wine.category_id)?.name ?? "—";
              // Find actual index in full wines array for reordering
              const wineIndex = wines.findIndex(w => w.id === wine.id);

              return (
                <Card key={wine.id} className="border-primary/10">
                  {/* Collapsed row */}
                  <div
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-secondary/50 transition-colors"
                    onClick={() => setExpandedWineId(isExpanded ? null : wine.id)}
                  >
                    <div className="flex flex-col gap-1">
                      <button onClick={(e) => { e.stopPropagation(); handleMoveWine(wineIndex, -1); }} disabled={wineIndex === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-20">
                        <ChevronUp size={14} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleMoveWine(wineIndex, 1); }} disabled={wineIndex === wines.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-20">
                        <ChevronDown size={14} />
                      </button>
                    </div>
                    {wine.image_url ? (
                      <img src={wine.image_url} alt="" className="w-8 h-8 rounded object-cover" />
                    ) : (
                      <div className={`w-3 h-3 rounded-full ${wine.color}`} />
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="font-serif text-sm">{wine.name || "Untitled Wine"}</span>
                      <span className="text-xs text-muted-foreground ml-3">{catName} · {wine.vintage}</span>
                    </div>
                    <span className="text-xs text-primary font-mono">{wine.score}pts</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDuplicateWine(wine); }}
                      className="text-muted-foreground hover:text-primary transition-colors"
                      title="Duplicate wine"
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteWine(wine.id); }}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Expanded form */}
                  {isExpanded && (
                    <CardContent className="pt-4 border-t border-primary/10">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Image upload */}
                        <div className="space-y-2 md:col-span-2">
                          <Label className="text-xs">Bottle Image</Label>
                          <div className="flex items-center gap-4">
                            {wine.image_url ? (
                              <div className="relative group">
                                <img src={wine.image_url} alt={wine.name} className="w-20 h-28 object-cover rounded border border-primary/20" />
                                <button
                                  onClick={() => handleRemoveImage(wine.id)}
                                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X size={10} />
                                </button>
                              </div>
                            ) : (
                              <div className="w-20 h-28 border border-dashed border-primary/30 rounded flex items-center justify-center text-muted-foreground">
                                <Image size={20} />
                              </div>
                            )}
                            <label className="cursor-pointer">
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleImageUpload(wine.id, file);
                                }}
                              />
                              <div className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 transition-colors border border-primary/30 rounded px-3 py-2">
                                <Upload size={12} /> Upload Image
                              </div>
                            </label>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs">Name</Label>
                          <Input
                            value={getWineValue(wine, "name")}
                            onChange={(e) => handleWineChange(wine.id, "name", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Category</Label>
                          <select
                            value={getWineValue(wine, "category_id") || wine.category_id}
                            onChange={(e) => handleWineChange(wine.id, "category_id", e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Region</Label>
                          <RegionAutocomplete
                            value={getWineValue(wine, "region")}
                            onChange={(value) => handleWineChange(wine.id, "region", value)}
                            existingRegions={Array.from(new Set(wines.map(w => w.region).filter(Boolean)))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Altitude</Label>
                          <Input value={getWineValue(wine, "altitude")} onChange={(e) => handleWineChange(wine.id, "altitude", e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Score</Label>
                          <Input value={getWineValue(wine, "score")} onChange={(e) => handleWineChange(wine.id, "score", e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Vintage</Label>
                          <Input value={getWineValue(wine, "vintage")} onChange={(e) => handleWineChange(wine.id, "vintage", e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Bottle Color (fallback)</Label>
                          <select
                            value={getWineValue(wine, "color") || wine.color}
                            onChange={(e) => handleWineChange(wine.id, "color", e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            {WINE_COLORS.map((c) => (
                              <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Winemaker</Label>
                          <Input value={getWineValue(wine, "winemaker")} onChange={(e) => handleWineChange(wine.id, "winemaker", e.target.value)} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label className="text-xs">Description</Label>
                          <Textarea value={getWineValue(wine, "description")} onChange={(e) => handleWineChange(wine.id, "description", e.target.value)} rows={2} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label className="text-xs">Market Rationale</Label>
                          <Textarea value={getWineValue(wine, "rationale")} onChange={(e) => handleWineChange(wine.id, "rationale", e.target.value)} rows={2} />
                        </div>
                        <div className="md:col-span-2 flex justify-end">
                          <Button
                            onClick={() => handleSaveWine(wine)}
                            size="sm"
                            className="gap-2"
                            disabled={!editingWines[wine.id] || Object.keys(editingWines[wine.id]).length === 0}
                          >
                            <Save size={14} /> Save Wine
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default Admin;
