import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { StatusPill } from "@/components/StatusPill";
import { PriceInclusiveNote } from "@/components/PriceInclusiveNote";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface AllocationWine {
  wine_id:   string;
  bottles:   number;
  notes_url: string | null;
  name?:     string;
  vintage?:  string;
  image_url?: string;
}

interface Allocation {
  id:             string;
  allocation_num: number;
  period_label:   string;
  wines_json:     AllocationWine[];
  ship_date:      string | null;
  tracking_number: string | null;
  tracking_url:   string | null;
  status:         "upcoming" | "shipped" | "delivered";
  notes_story_url: string | null;
  total_value_aud: number | null;
  created_at:     string;
}

// ─── Countdown component ─────────────────────────────────────────────────────

const Countdown = ({ shipDate }: { shipDate: string }) => {
  const days = Math.max(0, Math.ceil((new Date(shipDate).getTime() - Date.now()) / 86400000));
  return (
    <div className="flex items-baseline gap-2">
      <motion.span
        key={days}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-serif text-4xl text-primary"
      >
        {days}
      </motion.span>
      <span className="font-sans-nav text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
        days until dispatch
      </span>
    </div>
  );
};

// ─── Mini wine card ───────────────────────────────────────────────────────────

const AllocationWineCard = ({
  wine,
  onViewNotes,
}: {
  wine: AllocationWine;
  onViewNotes: (wine: AllocationWine) => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-glass hover:bg-glass-strong transition-colors duration-300 p-4 flex flex-col gap-3 group"
  >
    {wine.image_url ? (
      <div className="aspect-[3/4] overflow-hidden">
        <img src={wine.image_url} alt={wine.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      </div>
    ) : (
      <div className="aspect-[3/4] bg-secondary/50 flex items-center justify-center">
        <span className="font-serif text-4xl text-primary/20">✦</span>
      </div>
    )}
    <div>
      <p className="font-serif text-base leading-tight">{wine.name ?? "Wine TBA"}</p>
      <p className="font-sans-nav text-[10px] tracking-[0.2em] uppercase text-muted-foreground mt-0.5">
        {wine.vintage ?? ""} · {wine.bottles} bottle{wine.bottles !== 1 ? "s" : ""}
      </p>
    </div>
    {wine.notes_url && (
      <button
        onClick={() => onViewNotes(wine)}
        className="mt-auto font-sans-nav text-[10px] tracking-[0.3em] uppercase text-primary border-b border-primary/30 pb-0.5 w-fit hover:border-primary transition-colors"
      >
        Preview notes →
      </button>
    )}
  </motion.div>
);

// ─── Main component ───────────────────────────────────────────────────────────

const SocietyAllocations = () => {
  const { user } = useAuth();
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading]         = useState(true);
  const [noteSheet, setNoteSheet]     = useState<AllocationWine | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("society_allocations")
        .select("*")
        .eq("member_id", user.id)
        .order("allocation_num", { ascending: true });

      if (!data) { setLoading(false); return; }

      // Enrich with wine data
      const enriched: Allocation[] = await Promise.all(
        data.map(async (alloc: Allocation) => {
          const wines: AllocationWine[] = alloc.wines_json ?? [];
          const wineIds = wines.map((w) => w.wine_id).filter(Boolean);

          let wineMap: Record<string, { name: string; vintage: string; image_url: string | null }> = {};
          if (wineIds.length > 0) {
            const { data: winesData } = await supabase
              .from("wines")
              .select("id, name, vintage, image_url")
              .in("id", wineIds);
            if (winesData) {
              winesData.forEach((w: any) => { wineMap[w.id] = w; });
            }
          }

          return {
            ...alloc,
            wines_json: wines.map((w) => ({
              ...w,
              name:      wineMap[w.wine_id]?.name,
              vintage:   wineMap[w.wine_id]?.vintage,
              image_url: wineMap[w.wine_id]?.image_url ?? null,
            })),
          };
        })
      );

      setAllocations(enriched);
      setLoading(false);
    };
    load();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (allocations.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Your allocations will appear here once your membership is confirmed.</p>
      </div>
    );
  }

  const upcoming   = allocations.filter((a) => a.status === "upcoming");
  const historical = allocations.filter((a) => a.status !== "upcoming");
  const next       = upcoming[0] ?? null;

  return (
    <>
      {/* Tasting notes Sheet */}
      <Sheet open={!!noteSheet} onOpenChange={() => setNoteSheet(null)}>
        <SheetContent side="right" className="w-full max-w-lg bg-background border-l border-border overflow-y-auto">
          {noteSheet && (
            <>
              <SheetHeader className="mb-6">
                <SheetTitle className="font-serif text-2xl text-foreground text-left">
                  {noteSheet.name ?? "Tasting Notes"}
                </SheetTitle>
                <div className="gold-line w-12" />
              </SheetHeader>
              {noteSheet.notes_url ? (
                <a
                  href={noteSheet.notes_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 font-sans-nav text-[10px] tracking-[0.25em] uppercase border border-primary text-primary px-4 py-2.5 hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <ExternalLink size={11} />
                  View Full Notes →
                </a>
              ) : (
                <p className="text-sm text-muted-foreground">Tasting notes not yet available for this wine.</p>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>

      <div>
        {/* Header */}
        <div className="mb-6">
          <p className="font-sans-nav text-[10px] tracking-[0.4em] uppercase text-primary mb-2">Private Allocation Society</p>
          <h1 className="font-serif text-3xl md:text-4xl">Your Allocations</h1>
        </div>
        <div className="gold-line w-full mb-10" />

        {/* ── Hero: next upcoming allocation ── */}
        {next && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-glass-strong border border-primary/20 p-8 md:p-10 mb-16 glow-burgundy relative overflow-hidden"
          >
            {/* Decorative corner accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent pointer-events-none" />

            <p className="font-sans-nav text-[10px] tracking-[0.4em] uppercase text-primary mb-4">Your Next Allocation</p>

            <div className="flex flex-wrap items-start justify-between gap-6 mb-8">
              <div>
                <h2 className="font-serif text-4xl md:text-5xl mb-2">
                  #{next.allocation_num} · {next.period_label}
                </h2>
                {next.total_value_aud && (
                  <p className="font-sans-nav text-[11px] tracking-[0.3em] uppercase text-muted-foreground">
                    Allocation value: AUD ${next.total_value_aud.toLocaleString()}
                  </p>
                )}
              </div>

              {next.ship_date && (
                <div className="text-right">
                  <p className="font-sans-nav text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-2">
                    Estimated dispatch
                  </p>
                  <p className="font-serif text-lg">
                    {new Date(next.ship_date).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                  <div className="mt-3">
                    <Countdown shipDate={next.ship_date} />
                  </div>
                </div>
              )}
            </div>

            {/* Wine lineup */}
            {next.wines_json.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4 mb-8">
                {next.wines_json.map((wine, i) => (
                  <AllocationWineCard key={i} wine={wine} onViewNotes={setNoteSheet} />
                ))}
              </div>
            ) : (
              <div className="py-8 mb-8 border border-border/50 text-center">
                <p className="font-serif text-lg text-muted-foreground italic">Allocation details not yet released</p>
              </div>
            )}

            {/* Inclusive pricing note */}
            <PriceInclusiveNote variant="banner" />
          </motion.div>
        )}

        {/* ── Allocations timeline ── */}
        <div>
          <h2 className="font-serif text-2xl mb-8">Allocation History</h2>

          {allocations.length > 0 ? (
            <div className="relative">
              {/* Vertical gold line */}
              <div className="absolute left-4 top-0 bottom-0 w-[1px] bg-primary/30" />

              <div className="space-y-6 pl-12">
                {allocations.map((alloc, i) => (
                  <motion.div
                    key={alloc.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="relative"
                  >
                    {/* Timeline node */}
                    <div className={cn(
                      "absolute -left-9 top-4 w-3 h-3 rounded-full border-2 transition-colors",
                      alloc.status === "delivered" ? "bg-primary border-primary" :
                      alloc.status === "shipped"   ? "bg-primary/50 border-primary" :
                      "bg-background border-primary/40"
                    )} />

                    <div className={cn(
                      "bg-glass border border-border p-6 transition-colors",
                      alloc.status === "upcoming" && "opacity-60"
                    )}>
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="font-sans-nav text-[10px] tracking-[0.3em] uppercase text-primary mb-1">
                            {alloc.period_label}
                          </p>
                          <p className="font-serif text-xl">Allocation #{alloc.allocation_num}</p>
                          {alloc.total_value_aud && (
                            <p className="text-sm text-muted-foreground mt-0.5">
                              AUD ${alloc.total_value_aud.toLocaleString()}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-4">
                          <StatusPill status={alloc.status as any} />

                          {alloc.tracking_url && (
                            <a
                              href={alloc.tracking_url}
                              target="_blank"
                              rel="noreferrer"
                              className="font-sans-nav text-[10px] tracking-[0.2em] uppercase text-primary hover:underline flex items-center gap-1"
                            >
                              Track <ExternalLink size={10} />
                            </a>
                          )}

                          {alloc.notes_story_url && (
                            <a
                              href={alloc.notes_story_url}
                              target="_blank"
                              rel="noreferrer"
                              className="font-sans-nav text-[10px] tracking-[0.2em] uppercase text-primary hover:underline"
                            >
                              View notes →
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Wine names for delivered allocations */}
                      {alloc.status !== "upcoming" && alloc.wines_json.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {alloc.wines_json.map((w, j) => (
                            <span key={j} className="font-sans-nav text-[10px] tracking-[0.2em] uppercase border border-border px-2 py-0.5 text-muted-foreground">
                              {w.name ?? "Wine"} {w.vintage ?? ""}
                            </span>
                          ))}
                        </div>
                      )}

                      {alloc.status === "upcoming" && alloc.wines_json.length === 0 && (
                        <p className="mt-3 text-sm text-muted-foreground/60 italic font-serif">
                          Allocation details not yet released
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No allocation history yet.</p>
          )}
        </div>
      </div>
    </>
  );
};

export default SocietyAllocations;
