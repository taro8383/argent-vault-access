import { useState, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import worldMap from "../assets/en.png";

interface Region {
  name: string;
  x: number;
  y: number;
  channels: string[];
}

interface Connection {
  from: string;
  to: string;
}

// Connection lines from Buenos Aires (source) to other regions
const connections: Connection[] = [
  { from: "Buenos Aires", to: "Montenegro" },
  { from: "Buenos Aires", to: "Singapore" },
  { from: "Buenos Aires", to: "Shanghai" },
  { from: "Buenos Aires", to: "Tokyo" },
];

// Region marker with tooltip component
const RegionMarker = ({
  region,
  index,
  isInView,
  activeRegion,
  hoveredRegion,
  onClick,
  onHover,
}: {
  region: Region;
  index: number;
  isInView: boolean;
  activeRegion: Region | null;
  hoveredRegion: Region | null;
  onClick: () => void;
  onHover: (region: Region | null) => void;
}) => {
  const isActive = activeRegion?.name === region.name;
  const isHovered = hoveredRegion?.name === region.name;

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ delay: 0.8 + index * 0.1, type: "spring" }}
      onClick={onClick}
      onMouseEnter={() => onHover(region)}
      onMouseLeave={() => onHover(null)}
      className="absolute z-10 group"
      style={{
        left: `${region.x}%`,
        top: `${region.y}%`,
        transform: 'translate(-50%, -50%)'
      }}
      aria-label={`View ${region.name} operations`}
    >
      {/* Tooltip - positioned above marker */}
      <AnimatePresence>
        {isHovered && !activeRegion && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-sm pointer-events-none z-30"
            style={{
              background: "hsla(0, 0%, 8%, 0.95)",
              backdropFilter: "blur(10px)",
              border: "1px solid hsla(39, 52%, 56%, 0.3)",
              boxShadow: "0 4px 20px hsla(0, 0%, 0%, 0.4), 0 0 20px hsla(39, 52%, 56%, 0.1)",
            }}
          >
            <span className="font-sans-nav text-xs tracking-wider text-primary whitespace-nowrap">
              {region.name}
            </span>
            {/* Tooltip arrow */}
            <div
              className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 rotate-45"
              style={{
                background: "hsla(0, 0%, 8%, 0.95)",
                borderRight: "1px solid hsla(39, 52%, 56%, 0.3)",
                borderBottom: "1px solid hsla(39, 52%, 56%, 0.3)",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pulse ring */}
      <span className="absolute inset-0 rounded-full border border-primary/30 animate-ping"
        style={{ width: '16px', height: '16px', left: '-4px', top: '-4px' }} />

      {/* Outer ring */}
      <span className={`block w-4 h-4 rounded-full border-2 transition-all duration-300 ${
        isActive
          ? "bg-primary border-primary scale-125"
          : "bg-background/80 border-primary/60 group-hover:border-primary group-hover:scale-110"
      }`} />

      {/* Active ripple ping effect */}
      {isActive && (
        <motion.span
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 1, repeat: Infinity }}
          className="absolute inset-0 rounded-full border border-primary"
          style={{ width: '16px', height: '16px', left: '-4px', top: '-4px' }}
        />
      )}
    </motion.button>
  );
};

// Traveling dot component using SMIL animation (more reliable than CSS offset-path)
const TravelingDot = ({ pathD, delay, isInView }: { pathD: string; delay: number; isInView: boolean }) => {
  if (!isInView) return null;

  return (
    <g>
      <circle r="0.8" fill="hsl(39, 52%, 56%)" filter="url(#line-glow)">
        <animateMotion dur="3s" repeatCount="indefinite" begin={`${delay}s`} path={pathD} />
        <animate attributeName="opacity" values="0;1;1;0" dur="3s" repeatCount="indefinite" begin={`${delay}s`} />
      </circle>
    </g>
  );
};

// Connection lines SVG overlay
const ConnectionLines = ({ regions, isInView }: { regions: Region[]; isInView: boolean }) => {
  // Generate path data for each connection
  const getPathData = (from: Region, to: Region) => {
    const x1 = from.x;
    const y1 = from.y;
    const x2 = to.x;
    const y2 = to.y;

    // Control point for curve (midpoint with slight offset for arc)
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2 - 10;

    return `M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`;
  };

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <defs>
        {/* Gradient definitions for each connection */}
        {connections.map((conn) => (
          <linearGradient
            key={`grad-${conn.from}-${conn.to}`}
            id={`gradient-${conn.from}-${conn.to}`}
            x1="0%" y1="0%" x2="100%" y2="0%"
          >
            <stop offset="0%" stopColor="hsla(39, 52%, 56%, 0.1)" />
            <stop offset="30%" stopColor="hsla(39, 52%, 56%, 0.6)" />
            <stop offset="70%" stopColor="hsla(39, 52%, 56%, 0.6)" />
            <stop offset="100%" stopColor="hsla(39, 52%, 56%, 0.1)" />
          </linearGradient>
        ))}

        {/* Glow filter */}
        <filter id="line-glow">
          <feGaussianBlur stdDeviation="0.8" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Render connection lines */}
      {connections.map((conn, i) => {
        const fromRegion = regions.find((r) => r.name === conn.from);
        const toRegion = regions.find((r) => r.name === conn.to);

        if (!fromRegion || !toRegion) return null;

        const pathD = getPathData(fromRegion, toRegion);
        const gradientId = `gradient-${conn.from}-${conn.to}`;

        return (
          <g key={`${conn.from}-${conn.to}`}>
            {/* Base visible line */}
            <motion.path
              d={pathD}
              fill="none"
              stroke="hsla(39, 52%, 56%, 0.4)"
              strokeWidth="0.5"
              vectorEffect="non-scaling-stroke"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={isInView ? { pathLength: 1, opacity: 1 } : {}}
              transition={{ delay: 0.5 + i * 0.15, duration: 0.8, ease: "easeOut" }}
            />

            {/* Brighter center line */}
            <motion.path
              d={pathD}
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth="0.6"
              vectorEffect="non-scaling-stroke"
              filter="url(#line-glow)"
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 0.8 } : {}}
              transition={{ delay: 0.8 + i * 0.15, duration: 0.5 }}
            />

            {/* Traveling pulse dot using SMIL */}
            <TravelingDot pathD={pathD} delay={1 + i * 0.4} isInView={isInView} />
          </g>
        );
      })}
    </svg>
  );
};

const GlobalMap = () => {
  const { t } = useTranslation("map");
  const [activeRegion, setActiveRegion] = useState<Region | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<Region | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  // Translated regions data
  const regions: Region[] = [
    {
      name: t("regions.singapore.name"),
      x: 68.5,
      y: 70,
      channels: [
        t("regions.singapore.channels.0"),
        t("regions.singapore.channels.1"),
        t("regions.singapore.channels.2"),
      ],
    },
    {
      name: t("regions.tokyo.name"),
      x: 82.2,
      y: 50,
      channels: [
        t("regions.tokyo.channels.0"),
        t("regions.tokyo.channels.1"),
        t("regions.tokyo.channels.2"),
      ],
    },
    {
      name: t("regions.shanghai.name"),
      x: 70.6,
      y: 45,
      channels: [
        t("regions.shanghai.channels.0"),
        t("regions.shanghai.channels.1"),
        t("regions.shanghai.channels.2"),
      ],
    },
    {
      name: t("regions.montenegro.name"),
      x: 56,
      y: 36,
      channels: [
        t("regions.montenegro.channels.0"),
        t("regions.montenegro.channels.1"),
        t("regions.montenegro.channels.2"),
      ],
    },
    {
      name: t("regions.buenosaires.name"),
      x: 23.5,
      y: 80.5,
      channels: [
        t("regions.buenosaires.channels.0"),
        t("regions.buenosaires.channels.1"),
        t("regions.buenosaires.channels.2"),
      ],
    },
  ];

  return (
    <section id="operations" className="section-padding relative" ref={ref}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8 }}
        className="text-center mb-16"
      >
        <p className="font-sans-nav text-xs tracking-[0.4em] uppercase text-primary mb-4">
          {t("sectionTag")}
        </p>
        <h2 className="font-serif text-4xl md:text-6xl">{t("sectionTitle")}</h2>
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
            className="absolute inset-0 w-full h-full object-contain z-[1]"
          />

          {/* Connection lines SVG layer - above map, below markers */}
          <div className="absolute inset-0 z-[5] pointer-events-none">
            <ConnectionLines regions={regions} isInView={isInView} />
          </div>

          {/* Region markers with tooltips */}
          {regions.map((region, i) => (
            <RegionMarker
              key={region.name}
              region={region}
              index={i}
              isInView={isInView}
              activeRegion={activeRegion}
              hoveredRegion={hoveredRegion}
              onClick={() => setActiveRegion(activeRegion?.name === region.name ? null : region)}
              onHover={setHoveredRegion}
            />
          ))}

          {/* Corner etch marks for architectural frame */}
          <div className="absolute top-3 left-3 w-6 h-6 border-t border-l z-[5]" style={{ borderColor: "hsla(39, 52%, 56%, 0.15)" }} />
          <div className="absolute top-3 right-3 w-6 h-6 border-t border-r z-[5]" style={{ borderColor: "hsla(39, 52%, 56%, 0.15)" }} />
          <div className="absolute bottom-3 left-3 w-6 h-6 border-b border-l z-[5]" style={{ borderColor: "hsla(39, 52%, 56%, 0.15)" }} />
          <div className="absolute bottom-3 right-3 w-6 h-6 border-b border-r z-[5]" style={{ borderColor: "hsla(39, 52%, 56%, 0.15)" }} />

          {/* Info panel */}
          <AnimatePresence>
            {activeRegion && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-72 rounded-sm p-5 z-[20]"
                style={{
                  background: "hsla(0, 0%, 5%, 0.95)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid hsla(39, 52%, 56%, 0.2)",
                  boxShadow: "0 0 40px hsla(0, 0%, 0%, 0.6), 0 0 20px hsla(39, 52%, 56%, 0.1)",
                }}
              >
                <h3 className="font-serif text-xl text-primary mb-1">{activeRegion.name}</h3>
                <p className="font-sans-nav text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-4">
                  {t("infoPanel.title")}
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
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
};

export default GlobalMap;
