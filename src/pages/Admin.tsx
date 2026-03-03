import { useState, useEffect } from "react";
import { WineItem } from "@/components/WineVault";
import { getWines, saveWines, resetWines, WINE_COLORS, WINE_CATEGORIES } from "@/lib/wineStore";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Save, RotateCcw, GripVertical, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const emptyWine = (): WineItem => ({
  id: Date.now(),
  name: "",
  category: WINE_CATEGORIES[0],
  region: "",
  altitude: "",
  score: "",
  vintage: "",
  description: "",
  rationale: "",
  winemaker: "",
  color: WINE_COLORS[0].value,
});

const Admin = () => {
  const [wines, setWines] = useState<WineItem[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    setWines(getWines());
  }, []);

  const handleSave = () => {
    saveWines(wines);
    toast({ title: "Saved", description: "Wine vault updated. Refresh the homepage to see changes." });
  };

  const handleReset = () => {
    const defaults = resetWines();
    setWines(defaults);
    toast({ title: "Reset", description: "Restored to default wines." });
  };

  const addWine = () => {
    const newWine = emptyWine();
    setWines((prev) => [...prev, newWine]);
    setExpandedId(newWine.id);
  };

  const removeWine = (id: number) => {
    setWines((prev) => prev.filter((w) => w.id !== id));
  };

  const updateWine = (id: number, field: keyof WineItem, value: string) => {
    setWines((prev) =>
      prev.map((w) => (w.id === id ? { ...w, [field]: value } : w))
    );
  };

  const moveWine = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= wines.length) return;
    const updated = [...wines];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setWines(updated);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-primary/20 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl text-primary">GC Admin</h1>
            <p className="text-xs text-muted-foreground tracking-wider">Wine Vault Manager</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={handleReset} className="gap-2">
              <RotateCcw size={14} /> Reset
            </Button>
            <Button size="sm" onClick={handleSave} className="gap-2">
              <Save size={14} /> Save Changes
            </Button>
          </div>
        </div>
      </div>

      {/* Wine List */}
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-xl">{wines.length} Wine{wines.length !== 1 ? "s" : ""} in Vault</h2>
          <Button onClick={addWine} size="sm" variant="outline" className="gap-2">
            <Plus size={14} /> Add Wine
          </Button>
        </div>

        {wines.map((wine, index) => {
          const isExpanded = expandedId === wine.id;
          return (
            <Card key={wine.id} className="border-primary/10">
              {/* Collapsed row */}
              <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-secondary/50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : wine.id)}
              >
                <div className="flex flex-col gap-1">
                  <button onClick={(e) => { e.stopPropagation(); moveWine(index, -1); }} disabled={index === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-20">
                    <ChevronUp size={14} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); moveWine(index, 1); }} disabled={index === wines.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-20">
                    <ChevronDown size={14} />
                  </button>
                </div>
                <div className={`w-3 h-3 rounded-full ${wine.color}`} />
                <div className="flex-1 min-w-0">
                  <span className="font-serif text-sm">{wine.name || "Untitled Wine"}</span>
                  <span className="text-xs text-muted-foreground ml-3">{wine.category} · {wine.vintage}</span>
                </div>
                <span className="text-xs text-primary font-mono">{wine.score}pts</span>
                <button
                  onClick={(e) => { e.stopPropagation(); removeWine(wine.id); }}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Expanded form */}
              {isExpanded && (
                <CardContent className="pt-4 border-t border-primary/10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Name</Label>
                      <Input value={wine.name} onChange={(e) => updateWine(wine.id, "name", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Category</Label>
                      <select
                        value={wine.category}
                        onChange={(e) => updateWine(wine.id, "category", e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        {WINE_CATEGORIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Region</Label>
                      <Input value={wine.region} onChange={(e) => updateWine(wine.id, "region", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Altitude</Label>
                      <Input value={wine.altitude} onChange={(e) => updateWine(wine.id, "altitude", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Score</Label>
                      <Input value={wine.score} onChange={(e) => updateWine(wine.id, "score", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Vintage</Label>
                      <Input value={wine.vintage} onChange={(e) => updateWine(wine.id, "vintage", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Bottle Color</Label>
                      <select
                        value={wine.color}
                        onChange={(e) => updateWine(wine.id, "color", e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        {WINE_COLORS.map((c) => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Winemaker</Label>
                      <Input value={wine.winemaker} onChange={(e) => updateWine(wine.id, "winemaker", e.target.value)} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-xs">Description</Label>
                      <Textarea value={wine.description} onChange={(e) => updateWine(wine.id, "description", e.target.value)} rows={2} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-xs">Market Rationale</Label>
                      <Textarea value={wine.rationale} onChange={(e) => updateWine(wine.id, "rationale", e.target.value)} rows={2} />
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Admin;
