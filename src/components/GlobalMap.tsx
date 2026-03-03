import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { MapPin } from "lucide-react";

interface Region {
  name: string;
  x: number;
  y: number;
  channels: string[];
}

const regions: Region[] = [
  {
    name: "Singapore",
    x: 72,
    y: 62,
    channels: ["Marina Bay Sands F&B Group", "Raffles Hotel Wine Program", "Private Collector Network"],
  },
  {
    name: "Tokyo",
    x: 82,
    y: 35,
    channels: ["Ginza Sommelier Alliance", "Michelin 3-Star Direct", "Premium Import Distributors"],
  },
  {
    name: "Shanghai",
    x: 75,
    y: 40,
    channels: ["Bund Luxury Hotels", "Private Wine Club Circuit", "High-Net-Worth Collectors"],
  },
  {
    name: "Montenegro",
    x: 48,
    y: 35,
    channels: ["Porto Montenegro Residences", "Adriatic Luxury Resorts", "Balkan Distribution Hub"],
  },
  {
    name: "Buenos Aires",
    x: 28,
    y: 80,
    channels: ["Source Vineyards · Mendoza", "Winemaker Partnerships", "Export Logistics Center"],
  },
];

const GlobalMap = () => {
  const [activeRegion, setActiveRegion] = useState<Region | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="operations" className="section-padding relative" ref={ref}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8 }}
        className="text-center mb-16"
      >
        <p className="font-sans-nav text-xs tracking-[0.4em] uppercase text-primary mb-4">
          Reach
        </p>
        <h2 className="font-serif text-4xl md:text-6xl">Global Operations</h2>
        <div className="gold-line w-16 mx-auto mt-6" />
      </motion.div>

      <div className="max-w-5xl mx-auto relative">
        {/* Map container */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.4, duration: 1 }}
          className="relative aspect-[2/1] bg-secondary/30 rounded-sm overflow-hidden border border-border"
        >
          {/* Stylized world map dots */}
          <svg viewBox="0 0 100 50" className="w-full h-full opacity-10">
            {/* Simple dot grid for world map feel */}
            {Array.from({ length: 50 }).map((_, row) =>
              Array.from({ length: 100 }).map((_, col) => {
                const show = Math.random() > 0.7;
                if (!show) return null;
                return (
                  <circle
                    key={`${row}-${col}`}
                    cx={col + 0.5}
                    cy={row + 0.5}
                    r="0.15"
                    fill="hsl(39 52% 56%)"
                  />
                );
              })
            )}
          </svg>

          {/* Region markers */}
          {regions.map((region, i) => (
            <motion.button
              key={region.name}
              initial={{ scale: 0 }}
              animate={isInView ? { scale: 1 } : {}}
              transition={{ delay: 0.8 + i * 0.15, type: "spring" }}
              onClick={() => setActiveRegion(activeRegion?.name === region.name ? null : region)}
              className="absolute group"
              style={{ left: `${region.x}%`, top: `${region.y}%`, transform: "translate(-50%, -50%)" }}
              aria-label={`View ${region.name} operations`}
            >
              {/* Pulse ring */}
              <span className="absolute inset-0 w-8 h-8 -m-2 rounded-full border border-primary/30 animate-pulse-glow" />
              <MapPin
                size={16}
                className={`transition-colors duration-300 ${
                  activeRegion?.name === region.name ? "text-primary" : "text-primary/60 group-hover:text-primary"
                }`}
              />
            </motion.button>
          ))}

          {/* Info panel */}
          {activeRegion && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-72 bg-glass-strong rounded-sm p-5"
            >
              <h3 className="font-serif text-xl text-primary mb-1">{activeRegion.name}</h3>
              <p className="font-sans-nav text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-4">
                GC Exclusive Channels
              </p>
              <ul className="space-y-2">
                {activeRegion.channels.map((ch) => (
                  <li key={ch} className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-primary flex-shrink-0" />
                    <span className="text-xs text-secondary-foreground tracking-wider">{ch}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default GlobalMap;
