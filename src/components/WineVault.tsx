import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Wine, Mountain, Star } from "lucide-react";
import WineDetailModal from "./WineDetailModal";

export interface WineItem {
  id: number;
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
}

const wines: WineItem[] = [
  {
    id: 1,
    name: "Gran Reserva Malbec",
    category: "The Elite Series",
    region: "Gualtallary, Uco Valley",
    altitude: "1,500m",
    score: "97",
    vintage: "2019",
    description: "Deep violet with layers of blackberry, violet, and crushed stone. A monument to altitude winemaking.",
    rationale: "Perfectly positioned for Singapore and Tokyo's Michelin-starred dining scene. Its mineral complexity speaks to sommeliers seeking authenticity.",
    winemaker: "Elena Morales · 4th Generation · Mendoza",
    color: "bg-burgundy",
  },
  {
    id: 2,
    name: "Corte Especial Blend",
    category: "The Balkan Powerhouses",
    region: "Altamira, Mendoza",
    altitude: "1,100m",
    score: "96",
    vintage: "2020",
    description: "A bold Malbec-Cabernet Franc blend with notes of dark plum, espresso, and Mediterranean herbs.",
    rationale: "Built for the Adriatic coast's emerging luxury hospitality market. Bold enough for Montenegrin and Croatian fine dining.",
    winemaker: "Matías Castillo · Boutique Producer · Altamira",
    color: "bg-burgundy-light",
  },
  {
    id: 3,
    name: "Glaciar Pinot Noir",
    category: "Patagonian Purity",
    region: "Neuquén, Patagonia",
    altitude: "800m",
    score: "95",
    vintage: "2021",
    description: "Ethereal and precise. Wild strawberry, wet clay, and a finish that whispers of ancient glaciers.",
    rationale: "A sommelier's wine—ideal for Shanghai's growing Burgundy-obsessed clientele seeking New World alternatives.",
    winemaker: "Lucía Fernández · Pioneer of Patagonian Pinot",
    color: "bg-charcoal-lighter",
  },
  {
    id: 4,
    name: "Altitude Reserve Cabernet",
    category: "The Elite Series",
    region: "Gualtallary, Uco Valley",
    altitude: "1,450m",
    score: "96",
    vintage: "2018",
    description: "Structured and commanding. Cassis, graphite, and a backbone forged in extreme altitude conditions.",
    rationale: "Designed for Japan's precision-driven wine market. Its structure and aging potential align with long-term cellar programs.",
    winemaker: "Carlos Vega · High-Altitude Specialist",
    color: "bg-burgundy",
  },
  {
    id: 5,
    name: "Terroir Ancestral",
    category: "The Balkan Powerhouses",
    region: "Las Compuertas, Luján de Cuyo",
    altitude: "980m",
    score: "95",
    vintage: "2019",
    description: "Old-vine Malbec from centenarian vineyards. Dense, layered, and deeply historic.",
    rationale: "Perfect for Montenegro's heritage luxury segment—old-world soul from New World vineyards.",
    winemaker: "The Dominguez Family · 100+ Year Vineyards",
    color: "bg-charcoal-light",
  },
];

const categories = ["All", "The Elite Series", "The Balkan Powerhouses", "Patagonian Purity"];

const WineVault = () => {
  const [selectedWine, setSelectedWine] = useState<WineItem | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

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
          {categories.map((cat) => (
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

                  {/* Stylized bottle */}
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
