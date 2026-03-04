import { useState } from "react";
import type { Wine, Category } from "@/lib/types";
import { useWines, useCategories } from "@/hooks/use-wine-data";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Plus, Trash2, Save, ChevronDown, ChevronUp, Upload, X, Image, Layers,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

const WINE_COLORS = [
  { label: "Burgundy", value: "bg-burgundy" },
  { label: "Burgundy Light", value: "bg-burgundy-light" },
  { label: "Charcoal Light", value: "bg-charcoal-light" },
  { label: "Charcoal Lighter", value: "bg-charcoal-lighter" },
];

const Admin = () => {
  const { wines, loading: winesLoading, upsert: upsertWine, remove: removeWine, reorder: reorderWines, uploadImage, removeImage } = useWines();
  const { categories, loading: catsLoading, upsert: upsertCategory, remove: removeCategory, reorder: reorderCategories } = useCategories();

  const [expandedWineId, setExpandedWineId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"wines" | "categories">("wines");
  const [newCategoryName, setNewCategoryName] = useState("");

  // --- Wine handlers ---
  const handleAddWine = async () => {
    const defaultCat = categories[0];
    await upsertWine({
      name: "New Wine",
      category_id: defaultCat?.id ?? "",
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
    toast({ title: "Wine added" });
  };

  const handleUpdateWine = async (wine: Wine, field: keyof Wine, value: string) => {
    await upsertWine({ ...wine, [field]: value });
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

  const isLoading = winesLoading || catsLoading;

  return (
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
                    value={cat.name}
                    onChange={(e) => upsertCategory({ ...cat, name: e.target.value })}
                    className="flex-1 font-serif"
                  />
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
        ) : (
          /* ---------- Wines Tab ---------- */
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-xl">{wines.length} Wine{wines.length !== 1 ? "s" : ""} in Vault</h2>
              <Button onClick={handleAddWine} size="sm" variant="outline" className="gap-2">
                <Plus size={14} /> Add Wine
              </Button>
            </div>

            {wines.map((wine, index) => {
              const isExpanded = expandedWineId === wine.id;
              const catName = categories.find(c => c.id === wine.category_id)?.name ?? "—";

              return (
                <Card key={wine.id} className="border-primary/10">
                  {/* Collapsed row */}
                  <div
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-secondary/50 transition-colors"
                    onClick={() => setExpandedWineId(isExpanded ? null : wine.id)}
                  >
                    <div className="flex flex-col gap-1">
                      <button onClick={(e) => { e.stopPropagation(); handleMoveWine(index, -1); }} disabled={index === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-20">
                        <ChevronUp size={14} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleMoveWine(index, 1); }} disabled={index === wines.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-20">
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
                            value={wine.name}
                            onChange={(e) => handleUpdateWine(wine, "name", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Category</Label>
                          <select
                            value={wine.category_id}
                            onChange={(e) => handleUpdateWine(wine, "category_id", e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Region</Label>
                          <Input value={wine.region} onChange={(e) => handleUpdateWine(wine, "region", e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Altitude</Label>
                          <Input value={wine.altitude} onChange={(e) => handleUpdateWine(wine, "altitude", e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Score</Label>
                          <Input value={wine.score} onChange={(e) => handleUpdateWine(wine, "score", e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Vintage</Label>
                          <Input value={wine.vintage} onChange={(e) => handleUpdateWine(wine, "vintage", e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Bottle Color (fallback)</Label>
                          <select
                            value={wine.color}
                            onChange={(e) => handleUpdateWine(wine, "color", e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            {WINE_COLORS.map((c) => (
                              <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Winemaker</Label>
                          <Input value={wine.winemaker} onChange={(e) => handleUpdateWine(wine, "winemaker", e.target.value)} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label className="text-xs">Description</Label>
                          <Textarea value={wine.description} onChange={(e) => handleUpdateWine(wine, "description", e.target.value)} rows={2} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label className="text-xs">Market Rationale</Label>
                          <Textarea value={wine.rationale} onChange={(e) => handleUpdateWine(wine, "rationale", e.target.value)} rows={2} />
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
  );
};

export default Admin;
