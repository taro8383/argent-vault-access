import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Send } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface CellarEntry {
  wine_id:     string | null;
  wine_name:   string;
  vintage:     string;
  quantity:    number;
  source:      "allocation" | "purchase";
}

interface CellarNote {
  id:          string;
  wine_id:     string | null;
  note:        string;
  drink_from:  string | null;
  drink_to:    string | null;
  bottles:     number | null;
  created_by:  string | null;
  created_at:  string;
  wine_name?:  string;
  by_manager?: boolean;
}

const inputCls = "w-full bg-transparent border-b border-border py-2.5 text-sm text-foreground tracking-wider focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/50";
const labelCls = "block font-sans-nav text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-1.5";

const SocietyCellar = () => {
  const { user } = useAuth();

  const [cellar, setCellar]       = useState<CellarEntry[]>([]);
  const [notes, setNotes]         = useState<CellarNote[]>([]);
  const [memberTier, setTier]     = useState<string | null>(null);
  const [loading, setLoading]     = useState(true);
  const [addSheet, setAddSheet]   = useState(false);
  const [bespokeSheet, setBespoke] = useState(false);

  // Add note form state
  const [noteWineId, setNoteWineId] = useState("");
  const [noteText, setNoteText]     = useState("");
  const [drinkFrom, setDrinkFrom]   = useState("");
  const [drinkTo, setDrinkTo]       = useState("");
  const [noteBottles, setNoteBottles] = useState("");
  const [saving, setSaving]         = useState(false);

  // Bespoke form state
  const [bespokeMsg, setBespokeMsg] = useState("");
  const [sendingBespoke, setSendBespoke] = useState(false);
  const [bespokeSent, setBespokeSent]   = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      // Member tier
      const { data: memberData } = await supabase
        .from("society_members")
        .select("tier")
        .eq("id", user.id)
        .single();
      if (memberData) setTier(memberData.tier);

      // Build cellar from delivered allocations + delivered purchases
      const [allocRes, purchRes] = await Promise.all([
        supabase
          .from("society_allocations")
          .select("wines_json")
          .eq("member_id", user.id)
          .eq("status", "delivered"),
        supabase
          .from("society_purchases")
          .select("wine_id, quantity, status")
          .eq("member_id", user.id)
          .in("status", ["delivered"]),
      ]);

      // Collect all wine IDs
      const wineIds = new Set<string>();
      const allocWines: { wine_id: string; bottles: number }[] = [];

      if (allocRes.data) {
        allocRes.data.forEach((a: any) => {
          (a.wines_json ?? []).forEach((w: any) => {
            if (w.wine_id) { allocWines.push({ wine_id: w.wine_id, bottles: w.bottles ?? 1 }); wineIds.add(w.wine_id); }
          });
        });
      }

      const purchWines: { wine_id: string; quantity: number }[] = [];
      if (purchRes.data) {
        purchRes.data.forEach((p: any) => {
          purchWines.push({ wine_id: p.wine_id, quantity: p.quantity });
          wineIds.add(p.wine_id);
        });
      }

      // Fetch wine metadata
      let wineMap: Record<string, { name: string; vintage: string }> = {};
      if (wineIds.size > 0) {
        const { data: winesData } = await supabase
          .from("wines")
          .select("id, name, vintage")
          .in("id", [...wineIds]);
        if (winesData) winesData.forEach((w: any) => { wineMap[w.id] = w; });
      }

      // Aggregate cellar entries by wine
      const cellarMap: Record<string, CellarEntry> = {};
      allocWines.forEach(({ wine_id, bottles }) => {
        const key = `alloc_${wine_id}`;
        if (cellarMap[key]) cellarMap[key].quantity += bottles;
        else cellarMap[key] = { wine_id, wine_name: wineMap[wine_id]?.name ?? "Unknown", vintage: wineMap[wine_id]?.vintage ?? "", quantity: bottles, source: "allocation" };
      });
      purchWines.forEach(({ wine_id, quantity }) => {
        const key = `purch_${wine_id}`;
        if (cellarMap[key]) cellarMap[key].quantity += quantity;
        else cellarMap[key] = { wine_id, wine_name: wineMap[wine_id]?.name ?? "Unknown", vintage: wineMap[wine_id]?.vintage ?? "", quantity, source: "purchase" };
      });
      setCellar(Object.values(cellarMap));

      // Fetch cellar notes
      const { data: notesData } = await supabase
        .from("society_cellar_notes")
        .select("*")
        .eq("member_id", user.id)
        .order("created_at", { ascending: false });

      if (notesData) {
        const noteWineIds = [...new Set(notesData.map((n: any) => n.wine_id).filter(Boolean))];
        let noteWineNames: Record<string, string> = { ...wineMap };
        if (noteWineIds.some((id) => !noteWineNames[id])) {
          const extra = noteWineIds.filter((id) => !noteWineNames[id]);
          if (extra.length > 0) {
            const { data: extraWines } = await supabase.from("wines").select("id, name").in("id", extra);
            if (extraWines) extraWines.forEach((w: any) => { noteWineNames[w.id] = w.name; });
          }
        }
        setNotes(notesData.map((n: any) => ({
          ...n,
          wine_name:  n.wine_id ? (noteWineNames[n.wine_id] ?? "") : null,
          by_manager: n.created_by !== user.id,
        })));
      }

      setLoading(false);
    };
    load();
  }, [user]);

  const saveNote = async () => {
    if (!user || !noteText.trim()) return;
    setSaving(true);
    const { data } = await supabase.from("society_cellar_notes").insert({
      member_id: user.id,
      wine_id:   noteWineId || null,
      note:      noteText.trim(),
      drink_from: drinkFrom || null,
      drink_to:   drinkTo || null,
      bottles:    noteBottles ? parseInt(noteBottles) : null,
      created_by: user.id,
    }).select().single();
    if (data) {
      const wEntry = cellar.find((c) => c.wine_id === noteWineId);
      setNotes((prev) => [{ ...data, wine_name: wEntry?.wine_name, by_manager: false }, ...prev]);
    }
    setNoteText(""); setNoteWineId(""); setDrinkFrom(""); setDrinkTo(""); setNoteBottles("");
    setSaving(false);
    setAddSheet(false);
  };

  const sendBespoke = async () => {
    if (!user || !bespokeMsg.trim()) return;
    setSendBespoke(true);
    await supabase.from("direct_contact_requests").insert({
      user_id: user.id,
      type: "bespoke",
      message: bespokeMsg.trim(),
    });
    setBespokeSent(true);
    setSendBespoke(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isCollector = memberTier === "collector";

  return (
    <>
      {/* Add note Sheet */}
      <Sheet open={addSheet} onOpenChange={setAddSheet}>
        <SheetContent side="right" className="w-full max-w-lg bg-background border-l border-border overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="font-serif text-2xl text-foreground text-left">Add Cellar Note</SheetTitle>
            <div className="gold-line w-12" />
          </SheetHeader>
          <div className="space-y-5">
            <div>
              <label className={labelCls}>Wine (optional)</label>
              <select
                value={noteWineId}
                onChange={(e) => setNoteWineId(e.target.value)}
                className="w-full bg-background border-b border-border py-2.5 text-sm text-foreground tracking-wider focus:outline-none focus:border-primary appearance-none"
              >
                <option value="">General note…</option>
                {cellar.map((c, i) => (
                  <option key={i} value={c.wine_id ?? ""}>{c.wine_name} {c.vintage}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Note</label>
              <Textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="bg-transparent border-border text-foreground text-sm"
                rows={4}
                placeholder="Tasting impressions, storage observations…"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Drink From</label>
                <input type="date" value={drinkFrom} onChange={(e) => setDrinkFrom(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Drink To</label>
                <input type="date" value={drinkTo} onChange={(e) => setDrinkTo(e.target.value)} className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Bottles in Cellar</label>
              <input type="number" min="0" value={noteBottles} onChange={(e) => setNoteBottles(e.target.value)} className={inputCls} placeholder="e.g. 6" />
            </div>
            <button
              onClick={saveNote}
              disabled={saving || !noteText.trim()}
              className="w-full font-sans-nav text-xs tracking-[0.3em] uppercase border border-primary text-primary py-3 hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save Note →"}
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Bespoke sourcing Sheet */}
      {isCollector && (
        <Sheet open={bespokeSheet} onOpenChange={setBespoke}>
          <SheetContent side="right" className="w-full max-w-lg bg-background border-l border-border overflow-y-auto">
            <SheetHeader className="mb-6">
              <SheetTitle className="font-serif text-2xl text-foreground text-left">Bespoke Sourcing Request</SheetTitle>
              <div className="gold-line w-12" />
            </SheetHeader>
            {bespokeSent ? (
              <div className="py-12 text-center">
                <p className="font-serif text-2xl text-primary mb-3">Request Sent</p>
                <p className="text-sm text-muted-foreground">Our team will be in touch to discuss your request.</p>
              </div>
            ) : (
              <div className="space-y-5">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Describe what you are looking for. Our team will source and present options tailored to your palate and cellar profile.
                </p>
                <div>
                  <label className={labelCls}>Your Request</label>
                  <Textarea
                    value={bespokeMsg}
                    onChange={(e) => setBespokeMsg(e.target.value)}
                    className="bg-transparent border-border text-foreground text-sm"
                    rows={5}
                    placeholder="e.g. Aged Barolo from 2010–2015, preferably Bricco Rocche or Cannubi cru…"
                  />
                </div>
                <button
                  onClick={sendBespoke}
                  disabled={sendingBespoke || !bespokeMsg.trim()}
                  className="w-full flex items-center justify-center gap-2 font-sans-nav text-xs tracking-[0.3em] uppercase border border-primary text-primary py-3 hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50"
                >
                  <Send size={12} />
                  {sendingBespoke ? "Sending…" : "Send Request →"}
                </button>
              </div>
            )}
          </SheetContent>
        </Sheet>
      )}

      <div>
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="font-sans-nav text-[10px] tracking-[0.4em] uppercase text-primary mb-2">Your Cellar</p>
            <h1 className="font-serif text-3xl md:text-4xl">Cellar</h1>
          </div>
          <button
            onClick={() => setAddSheet(true)}
            className="flex items-center gap-2 font-sans-nav text-[10px] tracking-[0.2em] uppercase border border-primary/40 text-primary px-4 py-2.5 hover:border-primary transition-colors"
          >
            <Plus size={12} />
            Add Note
          </button>
        </div>
        <div className="gold-line w-full mb-10" />

        {/* Cellar inventory */}
        {cellar.length > 0 ? (
          <div className="mb-12">
            <h2 className="font-serif text-xl mb-5">My Collection</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {["Wine", "Vintage", "Qty", "Source"].map((h) => (
                      <th key={h} className="text-left pb-3 font-sans-nav text-[10px] tracking-[0.2em] uppercase text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cellar.map((entry, i) => (
                    <motion.tr
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.04 }}
                      className="border-b border-border/50 hover:bg-primary/5 transition-colors"
                    >
                      <td className="py-4">
                        <p className="font-serif text-base">{entry.wine_name}</p>
                      </td>
                      <td className="py-4 text-sm text-muted-foreground">{entry.vintage}</td>
                      <td className="py-4 text-sm text-primary">{entry.quantity}</td>
                      <td className="py-4">
                        <span className="font-sans-nav text-[9px] tracking-[0.2em] uppercase border border-border px-2 py-0.5 text-muted-foreground">
                          {entry.source === "allocation" ? "Allocation" : "Purchase"}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="py-10 text-center mb-12">
            <p className="text-muted-foreground text-sm">Your cellar will populate as allocations are delivered.</p>
          </div>
        )}

        {/* Notes */}
        {notes.length > 0 && (
          <div className="mb-12">
            <div className="gold-line w-full mb-8" />
            <h2 className="font-serif text-xl mb-5">
              {isCollector ? "Cellar Notes & Consultations" : "My Notes"}
            </h2>
            <div className="space-y-4">
              {notes.map((note, i) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`p-6 border ${note.by_manager ? "bg-glass-strong border-primary/20" : "bg-glass border-border"}`}
                >
                  {note.by_manager && (
                    <p className="font-sans-nav text-[9px] tracking-[0.3em] uppercase text-primary mb-2">
                      Consultant Note
                    </p>
                  )}
                  {note.wine_name && (
                    <p className="font-sans-nav text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-2">
                      {note.wine_name}
                    </p>
                  )}
                  <p className="font-serif text-lg leading-relaxed mb-3">{note.note}</p>
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                    {note.drink_from && <span>Drink from {new Date(note.drink_from).getFullYear()}</span>}
                    {note.drink_to   && <span>— {new Date(note.drink_to).getFullYear()}</span>}
                    {note.bottles    && <span>· {note.bottles} bottle{note.bottles !== 1 ? "s" : ""}</span>}
                    <span className="ml-auto">{new Date(note.created_at).toLocaleDateString("en-AU")}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Bespoke sourcing — Collector only */}
        {isCollector && (
          <div>
            <div className="gold-line w-full mb-8" />
            <div className="bg-glass border border-border p-8 flex flex-wrap items-center justify-between gap-6">
              <div>
                <p className="font-sans-nav text-[10px] tracking-[0.3em] uppercase text-primary mb-2">Collector Benefit</p>
                <h3 className="font-serif text-2xl mb-1">Bespoke Sourcing</h3>
                <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
                  Describe what you are looking for and our team will source and present bespoke options tailored to your palate.
                </p>
              </div>
              <button
                onClick={() => { setBespoke(true); setBespokeSent(false); }}
                className="font-sans-nav text-[10px] tracking-[0.3em] uppercase border border-primary text-primary px-6 py-3 hover:bg-primary hover:text-primary-foreground transition-colors whitespace-nowrap"
              >
                Request a Bespoke Allocation →
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default SocietyCellar;
