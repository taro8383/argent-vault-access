import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";

interface Region {
  name: string;
  x: number;
  y: number;
  channels: string[];
}

const regions: Region[] = [
  {
    name: "Singapore",
    x: 73,
    y: 64,
    channels: ["Marina Bay Sands F&B Group", "Raffles Hotel Wine Program", "Private Collector Network"],
  },
  {
    name: "Tokyo",
    x: 83,
    y: 38,
    channels: ["Ginza Sommelier Alliance", "Michelin 3-Star Direct", "Premium Import Distributors"],
  },
  {
    name: "Shanghai",
    x: 76,
    y: 43,
    channels: ["Bund Luxury Hotels", "Private Wine Club Circuit", "High-Net-Worth Collectors"],
  },
  {
    name: "Montenegro",
    x: 50,
    y: 38,
    channels: ["Porto Montenegro Residences", "Adriatic Luxury Resorts", "Balkan Distribution Hub"],
  },
  {
    name: "Buenos Aires",
    x: 28,
    y: 78,
    channels: ["Source Vineyards · Mendoza", "Winemaker Partnerships", "Export Logistics Center"],
  },
];

// Simplified continent outlines as SVG paths for an architectural/etched look
const continentPaths = [
  // North America
  "M10,18 L12,15 L15,14 L18,12 L22,11 L25,13 L27,16 L28,20 L30,22 L28,26 L26,30 L24,32 L22,34 L20,36 L18,38 L16,36 L14,34 L12,30 L10,26 L9,22 Z",
  // Central America
  "M18,38 L20,40 L22,42 L23,44 L22,46 L21,44 L19,42 L17,40 Z",
  // South America
  "M22,46 L24,48 L26,50 L28,54 L30,58 L32,62 L33,66 L32,70 L30,74 L28,78 L26,80 L24,82 L22,78 L21,74 L20,68 L21,62 L22,56 L22,50 Z",
  // Europe
  "M42,14 L44,12 L46,11 L48,12 L50,14 L52,16 L54,14 L52,12 L50,10 L48,9 L46,10 L44,11 L42,13 L43,16 L45,18 L47,20 L49,22 L48,24 L46,26 L44,24 L42,22 L40,20 L41,18 L42,16 Z",
  // Africa
  "M42,30 L44,28 L46,26 L48,28 L50,30 L52,34 L54,38 L55,42 L56,46 L55,50 L54,54 L52,58 L50,62 L48,66 L46,68 L44,66 L42,62 L40,58 L39,54 L38,48 L39,42 L40,36 L42,32 Z",
  // Asia
  "M54,14 L58,12 L62,10 L66,9 L70,10 L74,12 L78,14 L82,16 L84,18 L86,20 L84,22 L82,24 L80,28 L78,32 L76,36 L74,38 L72,36 L70,34 L68,32 L66,30 L64,28 L62,26 L60,24 L58,22 L56,20 L54,18 Z",
  // South/Southeast Asia
  "M64,38 L66,36 L68,38 L70,40 L72,42 L74,44 L76,46 L78,48 L76,50 L74,52 L72,54 L70,56 L68,54 L66,50 L64,46 L63,42 Z",
  // Malay peninsula & Indonesia
  "M70,56 L72,58 L74,60 L76,62 L78,64 L80,62 L82,60 L84,58 L82,56 L80,54 L78,56 L76,58 L74,56 Z",
  // Japan
  "M82,28 L83,26 L84,24 L85,26 L86,30 L85,34 L84,36 L83,34 L82,32 Z",
  // Australia
  "M76,68 L78,66 L80,64 L82,66 L84,68 L86,70 L88,72 L86,76 L84,78 L82,80 L80,78 L78,76 L76,74 L75,72 Z",
];

// Grid lines for architectural feel
const gridLines = Array.from({ length: 9 }, (_, i) => ({
  y: (i + 1) * 10,
}));
const meridianLines = Array.from({ length: 9 }, (_, i) => ({
  x: (i + 1) * 10,
}));

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
          {/* Architectural etched map */}
          <svg viewBox="0 0 100 90" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
            {/* Grid lines - latitude */}
            {gridLines.map((line) => (
              <line
                key={`h-${line.y}`}
                x1="0" y1={line.y} x2="100" y2={line.y}
                stroke="hsla(39, 52%, 56%, 0.04)"
                strokeWidth="0.1"
                strokeDasharray="0.5 1"
              />
            ))}
            {/* Grid lines - longitude */}
            {meridianLines.map((line) => (
              <line
                key={`v-${line.x}`}
                x1={line.x} y1="0" x2={line.x} y2="90"
                stroke="hsla(39, 52%, 56%, 0.04)"
                strokeWidth="0.1"
                strokeDasharray="0.5 1"
              />
            ))}

            {/* Continent outlines - etched golden strokes */}
            {continentPaths.map((d, i) => (
              <motion.path
                key={i}
                d={d}
                fill="hsla(39, 52%, 56%, 0.03)"
                stroke="hsla(39, 52%, 56%, 0.2)"
                strokeWidth="0.25"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={isInView ? { pathLength: 1, opacity: 1 } : {}}
                transition={{ delay: 0.6 + i * 0.08, duration: 1.2, ease: "easeOut" }}
              />
            ))}

            {/* Connection lines between regions */}
            {isInView && regions.map((region, i) => {
              const origin = regions[4]; // Buenos Aires
              if (i === 4) return null;
              return (
                <motion.line
                  key={`conn-${i}`}
                  x1={origin.x} y1={origin.y}
                  x2={region.x} y2={region.y}
                  stroke="hsla(39, 52%, 56%, 0.08)"
                  strokeWidth="0.15"
                  strokeDasharray="1 0.8"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 1.5 + i * 0.2, duration: 1 }}
                />
              );
            })}

            {/* Region markers */}
            {regions.map((region, i) => (
              <motion.g
                key={region.name}
                initial={{ opacity: 0, scale: 0 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 1 + i * 0.15, type: "spring" }}
              >
                {/* Outer pulse ring */}
                <circle
                  cx={region.x} cy={region.y} r="2.5"
                  fill="none"
                  stroke="hsla(39, 52%, 56%, 0.2)"
                  strokeWidth="0.1"
                  className="animate-pulse-glow"
                />
                {/* Inner glow */}
                <circle
                  cx={region.x} cy={region.y} r="1"
                  fill="hsla(39, 52%, 56%, 0.15)"
                />
                {/* Center dot */}
                <circle
                  cx={region.x} cy={region.y} r="0.5"
                  fill={activeRegion?.name === region.name ? "hsl(39 52% 56%)" : "hsl(39 52% 56% / 0.6)"}
                  className="cursor-pointer"
                  style={{ filter: "drop-shadow(0 0 2px hsla(39, 52%, 56%, 0.4))" }}
                />
                {/* Label */}
                <text
                  x={region.x}
                  y={region.y - 3.5}
                  textAnchor="middle"
                  fill="hsla(39, 52%, 56%, 0.5)"
                  fontSize="1.8"
                  fontFamily="Montserrat, sans-serif"
                  letterSpacing="0.15"
                  style={{ textTransform: "uppercase" }}
                >
                  {region.name}
                </text>
              </motion.g>
            ))}
          </svg>

          {/* Clickable overlay buttons */}
          {regions.map((region, i) => (
            <motion.button
              key={`btn-${region.name}`}
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: 1 + i * 0.15 }}
              onClick={() => setActiveRegion(activeRegion?.name === region.name ? null : region)}
              className="absolute w-6 h-6 -ml-3 -mt-3 rounded-full z-10"
              style={{ left: `${region.x}%`, top: `${(region.y / 90) * 100}%` }}
              aria-label={`View ${region.name} operations`}
            />
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
