import { useState, useEffect, useRef, useCallback } from "react";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { LayoutGrid, List, X, Star, Mountain, Download, Package, Clock } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SignedDownload } from "@/components/SignedDownload";
import { StatusPill } from "@/components/StatusPill";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

// Extended wine type with trade columns
interface TradeWine {
  id: string;
  name: string;
  category: string;
  region: string;
  altitude: string;
  score: string;
  vintage: string;
  description: string;
  winemaker: string;
  color: string;
  image_url: string | null;
  // Trade columns
  trade_price_aud: number | null;
  srp_aud: number | null;
  moq: number | null;
  availability: string | null;
  lead_time_weeks: number | null;
  production_cases: number | null;
  tech_sheet_url: string | null;
  pairing_notes: string | null;
}

// ─── TiltCard ────────────────────────────────────────────────────────────────

const TiltCard = ({ children, className = "", onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sp = { damping: 20, stiffness: 300 };
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), sp);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), sp);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - (rect.left + rect.width / 2)) / rect.width);
    y.set((e.clientY - (rect.top + rect.height / 2)) / rect.height);
  }, [x, y]);

  return (
    <motion.div
      ref={ref}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { setIsHovered(false); x.set(0); y.set(0); }}
      onMouseEnter={() => setIsHovered(true)}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d", perspective: 1000 }}
      animate={{ scale: isHovered ? 1.02 : 1 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// ─── Trade Wine Modal ─────────────────────────────────────────────────────────

const TradeWineModal = ({ wine, onClose }: { wine: TradeWine | null; onClose: () => void }) => {
  if (!wine) return null;

  const availLabel: Record<string, string> = {
    in_stock:    "In Stock",
    pre_release: "Pre-Release",
    allocated:   "Allocated",
    out_of_stock: "Out of Stock",
  };

  return createPortal(
    <AnimatePresence>
      {wine && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[90] bg-background/90 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, x: 80 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 80 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-[100] w-full max-w-xl overflow-y-auto border-l border-border"
            style={{ background: "#1a1a1a", boxShadow: "-10px 0 50px rgba(0,0,0,0.8)" }}
          >
            <ScrollArea className="h-full">
              <div className="p-8 md:p-12">
                <button onClick={onClose} className="absolute top-6 right-6 text-muted-foreground hover:text-primary transition-colors">
                  <X size={20} />
                </button>

                <p className="font-sans-nav text-[10px] tracking-[0.4em] uppercase text-primary mb-2">{wine.category}</p>
                <h2 className="font-serif text-4xl mb-1">{wine.name}</h2>
                <p className="text-sm text-muted-foreground tracking-wider mb-6">{wine.vintage}</p>
                <div className="gold-line w-full mb-8" />

                {/* Image + score */}
                <div className="flex items-center gap-8 mb-8">
                  {wine.image_url ? (
                    <img src={wine.image_url} alt={wine.name} className="wine-float h-48 object-contain flex-shrink-0" />
                  ) : (
                    <div className="wine-float flex flex-col items-center flex-shrink-0">
                      <div className="w-3 h-10 bg-[hsl(var(--accent))] rounded-t-sm" />
                      <div className="w-6 h-4 border border-primary/30 rounded-sm" />
                      <div className="w-14 h-44 bg-[hsl(var(--accent))] rounded-b-lg" />
                    </div>
                  )}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Star size={14} className="text-primary" />
                      <span className="font-serif text-3xl text-primary">{wine.score}</span>
                      <span className="text-xs text-muted-foreground">pts</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mountain size={13} />
                      <span className="text-sm tracking-wider">{wine.region}</span>
                    </div>
                    <p className="text-sm text-muted-foreground italic">{wine.winemaker}</p>
                  </div>
                </div>

                {/* Description */}
                <div className="bg-secondary p-5 mb-8">
                  <p className="text-sm text-secondary-foreground leading-relaxed">{wine.description}</p>
                </div>

                {/* ── Trade Section ───────────────────────────────── */}
                <div className="gold-line w-full mb-6" />
                <p className="font-sans-nav text-[10px] tracking-[0.4em] uppercase text-primary mb-6">Trade Information</p>

                {/* Pricing & Availability */}
                <div className="space-y-4 mb-8">
                  <h4 className="font-serif text-lg">Pricing & Availability</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      ["Trade Price (AUD)", wine.trade_price_aud ? `$${wine.trade_price_aud.toFixed(2)} / btl` : "On request"],
                      ["Suggested Retail",  wine.srp_aud ? `$${wine.srp_aud.toFixed(2)} / btl` : "—"],
                      ["Min. Order Qty",    wine.moq ? `${wine.moq} bottles` : "6 bottles"],
                      ["Availability",      wine.availability ? availLabel[wine.availability] ?? wine.availability : "—"],
                      ["Lead Time",         wine.lead_time_weeks ? `${wine.lead_time_weeks} weeks` : "—"],
                      ["Production",        wine.production_cases ? `${wine.production_cases.toLocaleString()} cases` : "—"],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <p className="font-sans-nav text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-0.5">{label}</p>
                        <p className="text-sm text-foreground">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Food Pairing */}
                {wine.pairing_notes && (
                  <div className="mb-8">
                    <h4 className="font-serif text-lg mb-3">Food Pairing</h4>
                    <p className="font-serif text-sm italic text-foreground/80 leading-relaxed">{wine.pairing_notes}</p>
                  </div>
                )}

                {/* Download tech sheet */}
                {wine.tech_sheet_url && (
                  <SignedDownload
                    bucket="tech-sheets"
                    path={wine.tech_sheet_url}
                    label="Download Technical Sheet"
                    className="mt-4"
                  />
                )}
              </div>
            </ScrollArea>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

// ─── TradePortfolio ───────────────────────────────────────────────────────────

const TradePortfolio = () => {
  const [wines, setWines] = useState<TradeWine[]>([]);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selectedWine, setSelectedWine] = useState<TradeWine | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase
        .from("wines")
        .select(`
          id, name, region, altitude, score, vintage, description,
          winemaker, color, image_url,
          trade_price_aud, srp_aud, moq, availability,
          lead_time_weeks, production_cases, tech_sheet_url, pairing_notes,
          categories ( name )
        `)
        .order("sort_order");

      if (!error && data) {
        setWines(data.map((w: any) => ({
          ...w,
          category: w.categories?.name ?? "Wine",
        })));
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const availColor = (avail: string | null) => {
    if (!avail || avail === "in_stock") return "text-primary";
    if (avail === "out_of_stock") return "text-destructive";
    return "text-muted-foreground";
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
      <TradeWineModal wine={selectedWine} onClose={() => setSelectedWine(null)} />

      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="font-sans-nav text-[10px] tracking-[0.4em] uppercase text-primary mb-2">Portfolio</p>
            <h1 className="font-serif text-3xl md:text-4xl">Current Offerings</h1>
          </div>
          <ToggleGroup type="single" value={view} onValueChange={(v) => { if (v) setView(v as "grid" | "list"); }}>
            <ToggleGroupItem value="grid" className="data-[state=on]:text-primary" aria-label="Grid view">
              <LayoutGrid size={16} />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" className="data-[state=on]:text-primary" aria-label="List view">
              <List size={16} />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="gold-line w-full mb-10" />

        {/* Grid View */}
        <AnimatePresence mode="wait">
          {view === "grid" ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"
            >
              {wines.map((wine, i) => (
                <motion.div
                  key={wine.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.5 }}
                  className="group cursor-pointer"
                >
                  <TiltCard
                    onClick={() => setSelectedWine(wine)}
                    className="relative h-[360px] bg-secondary overflow-hidden flex items-center justify-center glow-burgundy transition-all duration-700 group-hover:glow-gold"
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/80" />

                    {wine.image_url ? (
                      <img src={wine.image_url} alt={wine.name} className="relative z-10 h-[75%] object-contain wine-float" />
                    ) : (
                      <div className="wine-float relative z-10 flex flex-col items-center">
                        <div className="w-3 h-10 bg-[hsl(var(--accent))] rounded-t-sm" />
                        <div className="w-6 h-4 border border-primary/30 rounded-sm" />
                        <div className="w-14 h-44 bg-[hsl(var(--accent))] rounded-b-lg" />
                      </div>
                    )}

                    {/* Trade data overlay — slides up on hover */}
                    <motion.div
                      initial={{ y: "100%" }}
                      whileHover={{ y: 0 }}
                      transition={{ type: "spring", stiffness: 200, damping: 28 }}
                      className="absolute bottom-0 left-0 right-0 bg-glass-strong p-4 z-20"
                    >
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-3">
                        <div>
                          <p className="font-sans-nav text-[9px] tracking-[0.2em] uppercase text-muted-foreground">Trade Price</p>
                          <p className="font-serif text-sm text-primary">
                            {wine.trade_price_aud ? `AUD $${wine.trade_price_aud.toFixed(2)}` : "On request"}
                          </p>
                        </div>
                        <div>
                          <p className="font-sans-nav text-[9px] tracking-[0.2em] uppercase text-muted-foreground">SRP</p>
                          <p className="font-serif text-sm">
                            {wine.srp_aud ? `AUD $${wine.srp_aud.toFixed(2)}` : "—"}
                          </p>
                        </div>
                        <div>
                          <p className="font-sans-nav text-[9px] tracking-[0.2em] uppercase text-muted-foreground">MOQ</p>
                          <p className="text-xs">{wine.moq ?? 6} btls</p>
                        </div>
                        <div>
                          <p className="font-sans-nav text-[9px] tracking-[0.2em] uppercase text-muted-foreground">Availability</p>
                          <p className={cn("text-xs", availColor(wine.availability))}>
                            {wine.availability === "in_stock" ? "In Stock"
                              : wine.availability === "pre_release" ? "Pre-Release"
                              : wine.availability === "allocated" ? "Allocated"
                              : wine.availability === "out_of_stock" ? "Out of Stock"
                              : "—"}
                          </p>
                        </div>
                      </div>
                      <p className="font-sans-nav text-[10px] tracking-[0.2em] uppercase text-primary text-center">
                        View Full Sheet →
                      </p>
                    </motion.div>
                  </TiltCard>

                  <div className="mt-4 space-y-1">
                    <p className="font-sans-nav text-[10px] tracking-[0.3em] uppercase text-primary">{wine.category}</p>
                    <h3 className="font-serif text-xl group-hover:text-primary transition-colors duration-300">{wine.name}</h3>
                    <p className="text-xs text-muted-foreground tracking-wider">{wine.vintage} · {wine.region}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            // List View
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    {["Wine", "Vintage", "Region", "Trade Price", "SRP", "MOQ", "Availability", ""].map((h) => (
                      <TableHead key={h} className="font-sans-nav text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
                        {h}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {wines.map((wine) => (
                    <TableRow
                      key={wine.id}
                      className="border-border cursor-pointer hover:bg-primary/5 transition-colors duration-150"
                    >
                      <TableCell>
                        <div>
                          <p className="font-serif text-base">{wine.name}</p>
                          <p className="font-sans-nav text-[10px] tracking-wider text-primary uppercase">{wine.category}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{wine.vintage}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{wine.region}</TableCell>
                      <TableCell className="text-sm text-primary font-medium">
                        {wine.trade_price_aud ? `AUD $${wine.trade_price_aud.toFixed(2)}` : "On request"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {wine.srp_aud ? `AUD $${wine.srp_aud.toFixed(2)}` : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{wine.moq ?? 6}</TableCell>
                      <TableCell>
                        <span className={cn("text-xs", availColor(wine.availability))}>
                          {wine.availability === "in_stock" ? "In Stock"
                            : wine.availability === "pre_release" ? "Pre-Release"
                            : wine.availability === "allocated" ? "Allocated"
                            : wine.availability === "out_of_stock" ? "Out of Stock"
                            : "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => setSelectedWine(wine)}
                          className="font-sans-nav text-[10px] tracking-[0.2em] uppercase text-primary hover:text-primary/80 transition-colors border-b border-primary/30 hover:border-primary pb-0.5"
                        >
                          Details
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default TradePortfolio;
