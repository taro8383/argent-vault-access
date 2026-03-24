import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, ShoppingCart, X, Lock } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PriceInclusiveNote } from "@/components/PriceInclusiveNote";
import { StatusPill } from "@/components/StatusPill";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface SocietyWine {
  id:                  string;
  name:                string;
  vintage:             string;
  region:              string;
  image_url:           string | null;
  society_price_aud:   number | null;
  availability:        string | null;
}

interface DraftItem {
  wine:    SocietyWine;
  qty:     number;
}

interface Purchase {
  id:             string;
  wine_id:        string;
  quantity:       integer;
  all_in_price:   number;
  status:         string;
  tracking_url:   string | null;
  created_at:     string;
  wine_name?:     string;
}

type integer = number;

const SocietyPurchases = () => {
  const { user } = useAuth();

  const [wines, setWines]         = useState<SocietyWine[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [memberTier, setTier]     = useState<string | null>(null);
  const [draft, setDraft]         = useState<DraftItem[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [loading, setLoading]     = useState(true);
  const [submitting, setSubmit]   = useState(false);
  const [purchased, setPurchased] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [winesRes, memberRes, purchasesRes] = await Promise.all([
        supabase
          .from("wines")
          .select("id, name, vintage, region, image_url, society_price_aud, availability")
          .not("society_price_aud", "is", null)
          .order("sort_order"),
        supabase
          .from("society_members")
          .select("tier")
          .eq("id", user.id)
          .single(),
        supabase
          .from("society_purchases")
          .select("*")
          .eq("member_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      if (winesRes.data) setWines(winesRes.data as SocietyWine[]);
      if (memberRes.data) setTier(memberRes.data.tier);

      if (purchasesRes.data) {
        // Enrich with wine names
        const wineIds = [...new Set(purchasesRes.data.map((p: any) => p.wine_id))];
        let wineNames: Record<string, string> = {};
        if (wineIds.length > 0) {
          const { data: wNames } = await supabase.from("wines").select("id, name").in("id", wineIds);
          if (wNames) wNames.forEach((w: any) => { wineNames[w.id] = w.name; });
        }
        setPurchases(purchasesRes.data.map((p: any) => ({ ...p, wine_name: wineNames[p.wine_id] ?? "" })));
      }

      setLoading(false);
    };
    load();
  }, [user]);

  const canPurchase = memberTier === "private" || memberTier === "collector";

  const addToDraft = (wine: SocietyWine) => {
    if (!canPurchase) return;
    setDraft((prev) => {
      const existing = prev.find((d) => d.wine.id === wine.id);
      if (existing) return prev.map((d) => d.wine.id === wine.id ? { ...d, qty: d.qty + 1 } : d);
      return [...prev, { wine, qty: 1 }];
    });
  };

  const adjustQty = (wineId: string, delta: number) => {
    setDraft((prev) =>
      prev.map((d) => d.wine.id === wineId ? { ...d, qty: Math.max(0, d.qty + delta) } : d)
          .filter((d) => d.qty > 0)
    );
  };

  const total = draft.reduce((sum, d) => sum + (d.wine.society_price_aud ?? 0) * d.qty, 0);

  const confirmPurchase = async () => {
    if (!user || draft.length === 0) return;
    setSubmit(true);

    await Promise.all(
      draft.map((d) =>
        supabase.from("society_purchases").insert({
          member_id:     user.id,
          wine_id:       d.wine.id,
          quantity:      d.qty,
          unit_price_aud: d.wine.society_price_aud ?? 0,
          all_in_price:  (d.wine.society_price_aud ?? 0) * d.qty,
          status:        "pending",
        })
      )
    );

    setDraft([]);
    setSheetOpen(false);
    setSubmit(false);
    setPurchased(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* Order Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full max-w-lg bg-background border-l border-border overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="font-serif text-2xl text-foreground text-left">Review Order</SheetTitle>
            <div className="gold-line w-12" />
          </SheetHeader>

          {purchased ? (
            <div className="py-12 text-center">
              <p className="font-serif text-2xl text-primary mb-3">Order Confirmed</p>
              <p className="text-sm text-muted-foreground tracking-wider">
                Your order has been received. We will be in touch with dispatch details.
              </p>
            </div>
          ) : (
            <>
              <ScrollArea className="h-[calc(100vh-340px)] pr-2">
                {draft.map((item) => (
                  <div key={item.wine.id} className="flex items-center gap-4 py-4 border-b border-border">
                    <div className="flex-1 min-w-0">
                      <p className="font-serif text-base truncate">{item.wine.name}</p>
                      <p className="text-xs text-muted-foreground">{item.wine.vintage}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => adjustQty(item.wine.id, -1)} className="w-6 h-6 flex items-center justify-center border border-border hover:border-primary transition-colors">
                        <Minus size={12} />
                      </button>
                      <span className="w-6 text-center text-sm">{item.qty}</span>
                      <button onClick={() => adjustQty(item.wine.id, 1)} className="w-6 h-6 flex items-center justify-center border border-border hover:border-primary transition-colors">
                        <Plus size={12} />
                      </button>
                    </div>
                    <p className="text-sm text-primary w-24 text-right">
                      {item.wine.society_price_aud ? `AUD $${(item.wine.society_price_aud * item.qty).toFixed(2)}` : "—"}
                    </p>
                    <button onClick={() => setDraft((p) => p.filter((d) => d.wine.id !== item.wine.id))} className="text-muted-foreground hover:text-destructive transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </ScrollArea>

              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between py-3 border-t border-border">
                  <p className="font-sans-nav text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Total (all-inclusive)</p>
                  <p className="font-serif text-xl text-primary">AUD ${total.toFixed(2)}</p>
                </div>
                <p className="text-xs text-muted-foreground">No additional charges at delivery.</p>

                <PriceInclusiveNote variant="inline" />

                <button
                  onClick={confirmPurchase}
                  disabled={submitting || draft.length === 0}
                  className="w-full font-sans-nav text-xs tracking-[0.3em] uppercase border border-primary text-primary py-3 hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50"
                >
                  {submitting ? "Confirming…" : "Confirm Purchase →"}
                </button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <div>
        {/* Header */}
        <div className="mb-6">
          <p className="font-sans-nav text-[10px] tracking-[0.4em] uppercase text-primary mb-2">Additional Purchases</p>
          <h1 className="font-serif text-3xl md:text-4xl">Direct Purchase</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed max-w-2xl">
          Select further bottles from our current offerings.
          All pricing is fully inclusive — freight, duties, and delivery.
        </p>
        <div className="gold-line w-full mb-10" />

        {/* Founding member lock */}
        {!canPurchase && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-glass border border-border p-6 mb-10 flex items-center gap-4"
          >
            <Lock size={18} className="text-primary shrink-0" />
            <div>
              <p className="font-sans-nav text-[10px] tracking-[0.3em] uppercase text-primary mb-1">Founding Member Access</p>
              <p className="text-sm text-muted-foreground">
                Direct purchases are available to Private and Collector members. Upgrade your membership to access additional bottles.
              </p>
            </div>
          </motion.div>
        )}

        {/* Wine grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {wines.map((wine, i) => (
            <motion.div
              key={wine.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-glass border border-border overflow-hidden group"
            >
              <div className="aspect-[3/4] overflow-hidden relative">
                {wine.image_url ? (
                  <img src={wine.image_url} alt={wine.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full bg-secondary/40 flex items-center justify-center">
                    <span className="font-serif text-5xl text-primary/20">✦</span>
                  </div>
                )}

                {/* Trade hover overlay */}
                <motion.div
                  className="absolute inset-x-0 bottom-0 bg-glass-strong border-t border-primary/20 p-4"
                  initial={{ y: "100%" }}
                  whileHover={{ y: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                  {wine.society_price_aud && (
                    <div className="mb-3">
                      <p className="font-serif text-2xl text-primary">AUD ${wine.society_price_aud.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">Inclusive of all freight, duties & delivery</p>
                    </div>
                  )}
                  <button
                    onClick={() => addToDraft(wine)}
                    disabled={!canPurchase}
                    className={cn(
                      "w-full font-sans-nav text-[10px] tracking-[0.3em] uppercase border py-2.5 transition-colors",
                      canPurchase
                        ? "border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                        : "border-border text-muted-foreground cursor-not-allowed"
                    )}
                  >
                    {canPurchase ? "Add to Order →" : "Upgrade to Purchase"}
                  </button>
                </motion.div>
              </div>

              <div className="p-4">
                <p className="font-serif text-lg leading-tight">{wine.name}</p>
                <p className="font-sans-nav text-[10px] tracking-[0.2em] uppercase text-muted-foreground mt-0.5">
                  {wine.vintage} · {wine.region}
                </p>
                {wine.society_price_aud && (
                  <p className="font-serif text-base text-primary mt-2">AUD ${wine.society_price_aud.toFixed(2)}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Purchase history */}
        {purchases.length > 0 && (
          <div>
            <h2 className="font-serif text-2xl mb-6">Purchase History</h2>
            <div className="space-y-3">
              {purchases.map((p) => (
                <div key={p.id} className="bg-glass border border-border p-4 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-serif text-base">{p.wine_name ?? "Wine"}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString("en-AU")} · {p.quantity} bottle{p.quantity !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-sm text-primary">AUD ${p.all_in_price.toFixed(2)}</p>
                    <StatusPill status={p.status as any} />
                    {p.tracking_url && (
                      <a href={p.tracking_url} target="_blank" rel="noreferrer" className="font-sans-nav text-[10px] tracking-[0.2em] uppercase text-primary hover:underline">
                        Track →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Floating draft bar */}
      <AnimatePresence>
        {draft.length > 0 && !sheetOpen && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-glass-strong border border-primary/40 px-6 py-3 flex items-center gap-6"
          >
            <div className="flex items-center gap-2">
              <ShoppingCart size={16} className="text-primary" />
              <span className="font-sans-nav text-[11px] tracking-[0.2em] uppercase text-foreground">
                {draft.reduce((s, d) => s + d.qty, 0)} bottle{draft.reduce((s, d) => s + d.qty, 0) !== 1 ? "s" : ""} selected
              </span>
            </div>
            <button
              onClick={() => setSheetOpen(true)}
              className="font-sans-nav text-[10px] tracking-[0.3em] uppercase text-primary border border-primary/60 hover:border-primary px-4 py-2 transition-colors"
            >
              Review Order →
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SocietyPurchases;
