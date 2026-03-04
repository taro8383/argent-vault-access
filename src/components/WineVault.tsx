import { useState, useRef, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { Wine, Mountain, Star } from "lucide-react";
import WineDetailModal from "./WineDetailModal";
import { supabase } from "@/lib/supabase";
import type { Wine as WineType, Category } from "@/lib/types";

// Keep the old interface for backward compat with WineDetailModal
export interface WineItem {
  id: number | string;
  name: string;
  category: string;
  region: string;
  altitude: string;
  score: string;
  vintage: string;
  description: string;
  rationale: string;
  winemaker: string;
  color: string;
  image_url?: string | null;
}

const WineVault = () => {
  const [wines, setWines] = useState<WineItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedWine, setSelectedWine] = useState<WineItem | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    const fetchData = async () => {
      const { data: winesData } = await supabase
        .from('wines')
        .select('*, category:categories(name)')
        .order('sort_order');

      const { data: catsData } = await supabase
        .from('categories')
        .select('name')
        .order('sort_order');

      if (winesData) {
        setWines(winesData.map((w: any) => ({
          id: w.id,
          name: w.name,
          category: w.category?.name ?? '',
          region: w.region,
          altitude: w.altitude,
          score: w.score,
          vintage: w.vintage,
          description: w.description,
          rationale: w.rationale,
          winemaker: w.winemaker,
          color: w.color,
          image_url: w.image_url,
        })));
      }

      if (catsData) {
        setCategories(catsData.map((c: any) => c.name));
      }
    };

    fetchData();
  }, []);

  const allCategories = ["All", ...categories];

  const filteredWines = activeCategory === "All"
    ? wines
    : wines.filter((w) => w.category === activeCategory);

  return (
    <>
      <section id="vault" className="py-20 md:py-32 relative" ref={ref}>
        {/* Section heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 px-6"
        >
          <p className="font-sans-nav text-xs tracking-[0.4em] uppercase text-primary mb-4">
            The Portfolio
          </p>
          <h2 className="font-serif text-4xl md:text-6xl">The Curated Vault</h2>
          <div className="gold-line w-16 mx-auto mt-6" />
        </motion.div>

        {/* Category filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="flex justify-center gap-4 md:gap-8 mb-16 px-6 flex-wrap"
        >
          {allCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`font-sans-nav text-[10px] md:text-xs tracking-[0.2em] uppercase pb-1 transition-all duration-300 ${
                activeCategory === cat
                  ? "text-primary border-b border-primary"
                  : "text-muted-foreground hover:text-secondary-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </motion.div>

        {/* Horizontal scroll carousel */}
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-8 px-6 md:px-12 lg:px-24 pb-8" style={{ minWidth: "max-content" }}>
            {filteredWines.map((wine, i) => (
              <motion.div
                key={wine.id}
                initial={{ opacity: 0, y: 40 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.4 + i * 0.1, duration: 0.7 }}
                onClick={() => setSelectedWine(wine)}
                className="group cursor-pointer w-[280px] md:w-[320px] flex-shrink-0"
              >
                {/* Wine bottle visualization */}
                <div className="relative h-[380px] md:h-[440px] rounded-sm overflow-hidden bg-secondary mb-6 flex items-center justify-center glow-burgundy transition-all duration-700 group-hover:glow-gold">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/80" />

                  {wine.image_url ? (
                    /* Real bottle image */
                    <img
                      src={wine.image_url}
                      alt={wine.name}
                      className="relative z-10 h-[85%] object-contain wine-float"
                    />
                  ) : (
                    /* Stylized SVG bottle fallback */
                    <div className="wine-float relative z-10 flex flex-col items-center">
                      <div className={`w-3 h-10 ${wine.color} rounded-t-sm`} />
                      <div className="w-6 h-4 border border-primary/30 rounded-sm" />
                      <div className={`w-16 h-48 ${wine.color} rounded-b-lg relative`}>
                        <div className="absolute inset-x-2 top-8 bottom-8 border border-primary/20 rounded-sm flex flex-col items-center justify-center p-2">
                          <span className="text-primary text-[6px] tracking-[0.2em] uppercase font-sans-nav">GC</span>
                          <span className="text-foreground/80 text-[5px] tracking-wider font-sans mt-1">{wine.vintage}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col items-center justify-center p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Star size={14} className="text-primary" />
                      <span className="font-serif text-3xl text-primary">{wine.score}</span>
                      <span className="text-xs text-muted-foreground">pts</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mountain size={12} />
                      <span className="text-xs tracking-wider">{wine.region}</span>
                    </div>
                    <span className="text-[10px] tracking-wider text-muted-foreground mt-1">{wine.altitude} Altitude</span>
                    <p className="text-xs text-secondary-foreground mt-4 text-center leading-relaxed">{wine.description}</p>
                  </div>
                </div>

                {/* Wine info */}
                <div className="space-y-2">
                  <p className="font-sans-nav text-[10px] tracking-[0.3em] uppercase text-primary">
                    {wine.category}
                  </p>
                  <h3 className="font-serif text-xl group-hover:text-primary transition-colors duration-300">
                    {wine.name}
                  </h3>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Wine size={12} />
                    <span className="text-xs tracking-wider">{wine.vintage} · {wine.region}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <WineDetailModal wine={selectedWine} onClose={() => setSelectedWine(null)} />
    </>
  );
};

export default WineVault;
