import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import worldMap from "../assets/en.png";

interface Region {
  name: string;
  x: number;
  y: number;
  channels: string[];
}

const regions: Region[] = [
  {
    name: "Singapore",
    x: 68.5,
    y: 70,
    channels: ["Marina Bay Sands F&B Group", "Raffles Hotel Wine Program", "Private Collector Network"],
  },
  {
    name: "Tokyo",
    x: 82.2,
    y: 50,
    channels: ["Ginza Sommelier Alliance", "Michelin 3-Star Direct", "Premium Import Distributors"],
  },
  {
    name: "Shanghai",
    x: 70.6,
    y: 45,
    channels: ["Bund Luxury Hotels", "Private Wine Club Circuit", "High-Net-Worth Collectors"],
  },
  {
    name: "Montenegro",
    x: 56,
    y: 36,
    channels: ["Porto Montenegro Residences", "Adriatic Luxury Resorts", "Balkan Distribution Hub"],
  },
  {
    name: "Buenos Aires",
    x: 23.5,
    y: 80.5,
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
        <motion.div
          className="gold-line w-16 mx-auto mt-6"
          animate={{ scaleX: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
        />
      </motion.div>

      <div className="max-w-5xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.4, duration: 1 }}
          className="relative aspect-[2/1] rounded-sm overflow-hidden"
          style={{
            background: "linear-gradient(180deg, hsl(0 0% 5%), hsl(0 0% 8%) 50%, hsl(0 0% 5%))",
            border: "1px solid hsla(39, 52%, 56%, 0.15)",
            boxShadow: "inset 0 0 80px hsla(0, 0%, 0%, 0.6), 0 0 40px hsla(39, 52%, 56%, 0.05)",
          }}
        >
          {/* World map image */}
          <img
            src={worldMap}
            alt="Global Operations Map"
            className="w-full h-full object-contain"
          />

          {/* Region markers */}
          {regions.map((region, i) => (
            <motion.button
              key={`btn-${region.name}`}
              initial={{ opacity: 0, scale: 0 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.8 + i * 0.1, type: "spring" }}
              onClick={() => setActiveRegion(activeRegion?.name === region.name ? null : region)}
              className="absolute z-10 -translate-x-1/2 -translate-y-1/2 group"
              style={{ left: `${region.x}%`, top: `${region.y}%` }}
              aria-label={`View ${region.name} operations`}
            >
              {/* Pulse ring */}
              <span className="absolute inset-0 rounded-full border border-primary/30 animate-ping" />
              {/* Outer ring */}
              <span className={`block w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                activeRegion?.name === region.name
                  ? "bg-primary border-primary scale-125"
                  : "bg-background/80 border-primary/60 group-hover:border-primary group-hover:scale-110"
              }`} />
            </motion.button>
          ))}

          {/* Corner etch marks for architectural frame */}
          <div className="absolute top-3 left-3 w-6 h-6 border-t border-l" style={{ borderColor: "hsla(39, 52%, 56%, 0.15)" }} />
          <div className="absolute top-3 right-3 w-6 h-6 border-t border-r" style={{ borderColor: "hsla(39, 52%, 56%, 0.15)" }} />
          <div className="absolute bottom-3 left-3 w-6 h-6 border-b border-l" style={{ borderColor: "hsla(39, 52%, 56%, 0.15)" }} />
          <div className="absolute bottom-3 right-3 w-6 h-6 border-b border-r" style={{ borderColor: "hsla(39, 52%, 56%, 0.15)" }} />

          {/* Info panel */}
          {activeRegion && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-72 rounded-sm p-5"
              style={{
                background: "hsla(0, 0%, 5%, 0.9)",
                backdropFilter: "blur(20px)",
                border: "1px solid hsla(39, 52%, 56%, 0.12)",
                boxShadow: "0 0 30px hsla(0, 0%, 0%, 0.5)",
              }}
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
