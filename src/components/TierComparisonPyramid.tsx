import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, ChevronDown } from "lucide-react";
import { useHoverSound } from "@/hooks/use-sound";
import SignInModal from "./SignInModal";

interface TierData {
  id: string;
  name: string;
  price: string;
  period: string;
  features: string[];
  accent: string;
  description: string;
}

const tiersData: TierData[] = [
  {
    id: "excellence",
    name: "The Cellar Excellence Program",
    price: "$18,000",
    period: "/yr",
    features: [
      "Everything in Management",
      "Monthly portfolio reviews",
      "Dedicated WhatsApp concierge",
      "Annual private tasting event",
      "Custom label program access",
      "Client event representation",
      "Direct winemaker introductions",
    ],
    accent: "hsl(39 52% 56%)",
    description: "The pinnacle of wine collection management",
  },
  {
    id: "management",
    name: "The Cellar Management Program",
    price: "$10,000",
    period: "/yr",
    features: [
      "Everything in Essentials",
      "Personal briefing service",
      "Quarterly performance reviews",
      "Emergency bottle service",
      "Priority allocation access",
      "Exclusive trade pricing",
    ],
    accent: "hsl(39 45% 50%)",
    description: "Comprehensive stewardship for active collectors",
  },
  {
    id: "essentials",
    name: "The Cellar Essentials Program",
    price: "$5,000",
    period: "/yr",
    features: [
      "Comprehensive cellar audit & inventory",
      "Annual acquisition planning",
      "Quarterly wine recommendations",
      "Procurement management",
      "Up to 10 cases per quarter",
    ],
    accent: "hsl(39 35% 42%)",
    description: "Foundation for the discerning collector",
  },
];

// Pyramid dimensions - UPWARD pointing (wide base, narrow top)
const PYRAMID_WIDTH = 520;
const PYRAMID_HEIGHT = 440;
const CENTER_X = PYRAMID_WIDTH / 2;

// Segment dimensions - proportional to triangle slope for straight sides
const SEGMENTS = [
  { // Excellence at top (triangle)
    y: 0,
    topWidth: 0,
    bottomWidth: 175,
    height: 147,
  },
  { // Management in middle (trapezoid)
    y: 147,
    topWidth: 175,
    bottomWidth: 347,
    height: 147,
  },
  { // Essentials at bottom (widest trapezoid)
    y: 294,
    topWidth: 347,
    bottomWidth: PYRAMID_WIDTH,
    height: 146,
  },
];

// Mobile Tier Card Component
const MobileTierCard = ({ tier, index, isExpanded, onToggle, isInView }: {
  tier: TierData;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  isInView: boolean;
}) => {
  const { t } = useTranslation("common");

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{
        delay: 0.3 + index * 0.15,
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="relative"
    >
      <button
        onClick={onToggle}
        className="w-full text-left"
      >
        <div
          className="relative p-5 border transition-all duration-300"
          style={{
            borderColor: isExpanded ? tier.accent : "hsla(39, 52%, 56%, 0.2)",
            background: isExpanded ? `linear-gradient(180deg, ${tier.accent.replace(')', ', 0.05)')} 0%, transparent 100%)` : 'transparent',
          }}
        >
          {/* Tier badge */}
          <div className="flex items-center justify-between mb-3">
            <span
              className="font-sans-nav text-[10px] tracking-[0.3em] uppercase"
              style={{ color: tier.accent }}
            >
              {t(`corporateTiers.${tier.id}`)}
            </span>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronDown size={16} style={{ color: tier.accent }} />
            </motion.div>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-2 mb-2">
            <span className="font-serif text-2xl" style={{ color: tier.accent }}>
              {tier.price}
            </span>
            <span className="font-sans-nav text-xs text-muted-foreground">
              {tier.period}
            </span>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground italic">
            {t(`corporateTiers.${tier.id}Desc`)}
          </p>

          {/* Expanded content */}
          <motion.div
            initial={false}
            animate={{
              height: isExpanded ? "auto" : 0,
              opacity: isExpanded ? 1 : 0,
            }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div
              className="w-full h-[1px] my-4"
              style={{ background: `linear-gradient(90deg, ${tier.accent}, transparent)` }}
            />
            <ul className="space-y-3">
              {tier.features.map((_, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={isExpanded ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.2, delay: i * 0.05 }}
                  className="flex items-start gap-3"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                    style={{ backgroundColor: tier.accent }}
                  />
                  <span className="text-sm text-foreground/80">
                    {t(`corporateTiers.${tier.id}Features.${i}`)}
                  </span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>
      </button>
    </motion.div>
  );
};

const TierComparisonPyramid = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [activeTier, setActiveTier] = useState<string | null>(null);
  const [expandedMobileTier, setExpandedMobileTier] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const { onMouseEnter: playHoverSound } = useHoverSound();
  const { t } = useTranslation("common");
  const [showSignIn, setShowSignIn] = useState(false);

  // Detect mobile screens
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleTierHover = (tierId: string | null) => {
    if (tierId && tierId !== activeTier) {
      playHoverSound();
    }
    setActiveTier(tierId);
  };

  const toggleMobileTier = (tierId: string) => {
    setExpandedMobileTier(expandedMobileTier === tierId ? null : tierId);
  };

  return (
    <section
      id="corporate"
      className="relative min-h-screen flex flex-col justify-center overflow-hidden py-20 md:py-32"
      ref={ref}
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/20 to-background" />

      <div className="relative z-10 w-full">
        {/* MOBILE LAYOUT: Stacked Cards */}
        {isMobile && (
          <div className="w-full px-6">
            {/* Header */}
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
            >
              <motion.p
                className="font-sans-nav text-[9px] sm:text-[10px] tracking-[0.4em] sm:tracking-[0.5em] uppercase text-primary/60 mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                {t("corporate.eyebrow")}
              </motion.p>

              <motion.h2
                className="font-serif text-3xl sm:text-4xl md:text-5xl leading-[1.1] mb-6"
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                <span className="block">{t("corporate.title")}</span>
                <span className="block italic text-primary">{t("corporate.titleItalic")}</span>
                <span className="block">{t("corporate.titleEnd")}</span>
              </motion.h2>

              <motion.div
                className="gold-line w-16 mx-auto mb-6"
                initial={{ scaleX: 0 }}
                animate={isInView ? { scaleX: 1 } : {}}
                transition={{ duration: 0.8, delay: 0.5 }}
              />

              <motion.p
                className="font-serif text-lg sm:text-xl text-muted-foreground leading-relaxed mb-4 max-w-lg mx-auto"
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                {t("corporate.reframe")}
              </motion.p>

              <motion.p
                className="text-sm text-muted-foreground/80 leading-relaxed max-w-md mx-auto"
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ duration: 0.8, delay: 0.7 }}
              >
                {t("corporate.scarcity")}
              </motion.p>
            </motion.div>

            {/* Mobile Tier Cards - Reverse order (Essentials first, Excellence last) */}
            <div className="space-y-4 max-w-md mx-auto mb-12">
              {[...tiersData].reverse().map((tier, index) => (
                <MobileTierCard
                  key={tier.id}
                  tier={tier}
                  index={index}
                  isExpanded={expandedMobileTier === tier.id}
                  onToggle={() => toggleMobileTier(tier.id)}
                  isInView={isInView}
                />
              ))}
            </div>

            {/* Tap instruction */}
            <motion.p
              className="text-center font-sans-nav text-[9px] tracking-[0.3em] uppercase text-muted-foreground/60 mb-8"
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.8 }}
            >
              {t("ui.tap")} {t("ui.explore")}
            </motion.p>
          </div>
        )}

        {/* DESKTOP LAYOUT: Two-column with Pyramid */}
        {!isMobile && (
          <div className="w-full px-6 md:px-12 lg:px-16 xl:px-24">
            <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 items-center justify-between">

              {/* LEFT COLUMN: Header Text with Hover Overlay */}
              <div className="flex-1 w-full lg:max-w-xl">
                <div className="relative min-h-[540px]">
                  {/* Base Content - fades out on hover */}
                  <motion.div
                    className="transition-opacity duration-300"
                    style={{ opacity: activeTier ? 0 : 1 }}
                  >
                    <motion.p
                      className="font-sans-nav text-[10px] tracking-[0.5em] uppercase text-primary/60 mb-6"
                      initial={{ opacity: 0, y: 20 }}
                      animate={isInView ? { opacity: 1, y: 0 } : {}}
                      transition={{ duration: 0.8, delay: 0.4 }}
                    >
                      {t("corporate.eyebrow")}
                    </motion.p>

                    <motion.h2
                      className="font-serif text-5xl md:text-6xl lg:text-7xl leading-[1] mb-8"
                      initial={{ opacity: 0, y: 30 }}
                      animate={isInView ? { opacity: 1, y: 0 } : {}}
                      transition={{ duration: 1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <span className="block">{t("corporate.title")}</span>
                      <span className="block italic text-primary">{t("corporate.titleItalic")}</span>
                      <span className="block">{t("corporate.titleEnd")}</span>
                    </motion.h2>

                    <motion.p
                      className="font-serif text-xl md:text-2xl text-muted-foreground leading-relaxed mb-6"
                      initial={{ opacity: 0 }}
                      animate={isInView ? { opacity: 1 } : {}}
                      transition={{ duration: 0.8, delay: 0.7 }}
                    >
                      {t("corporate.reframe")}
                    </motion.p>

                    <motion.div
                      className="gold-line w-24 mb-6"
                      initial={{ scaleX: 0 }}
                      animate={isInView ? { scaleX: 1 } : {}}
                      transition={{ duration: 0.8, delay: 0.9 }}
                    />

                    <motion.p
                      className="text-base text-muted-foreground/80 leading-relaxed"
                      initial={{ opacity: 0 }}
                      animate={isInView ? { opacity: 1 } : {}}
                      transition={{ duration: 0.8, delay: 1 }}
                    >
                      {t("corporate.scarcity")}
                    </motion.p>
                  </motion.div>

                  {/* Hover Overlay - appears on top */}
                  <div className="absolute inset-0 pointer-events-none">
                    {tiersData.map((tier) => {
                      const isActive = activeTier === tier.id;
                      return (
                        <motion.div
                          key={tier.id}
                          className="absolute inset-0"
                          initial={{ opacity: 0 }}
                          animate={{
                            opacity: isActive ? 1 : 0,
                          }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="border-l-2 pl-8 pt-24" style={{ borderColor: tier.accent }}>
                            <p
                              className="font-sans-nav text-xs tracking-[0.4em] uppercase mb-3"
                              style={{ color: tier.accent }}
                            >
                              {t(`corporateTiers.${tier.id}`)}
                            </p>
                            <h3 className="font-serif text-2xl lg:text-3xl mb-3 leading-tight">
                              {t(`corporateTiers.${tier.id}Name`)}
                            </h3>
                            <div className="flex items-baseline gap-2 mb-3">
                              <span className="font-serif text-3xl lg:text-4xl" style={{ color: tier.accent }}>
                                {tier.price}
                              </span>
                              <span className="font-sans-nav text-xs text-muted-foreground">
                                {tier.period}
                              </span>
                            </div>
                            <p className="text-base text-muted-foreground italic mb-6">
                              {t(`corporateTiers.${tier.id}Desc`)}
                            </p>

                            <div
                              className="w-full h-[1px] mb-6"
                              style={{ background: `linear-gradient(90deg, ${tier.accent}, transparent)` }}
                            />

                            <ul className="space-y-3">
                              {tier.features.map((_, i) => (
                                <motion.li
                                  key={i}
                                  className="flex items-start gap-3"
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={isActive ? { opacity: 1, x: 0 } : {}}
                                  transition={{ duration: 0.2, delay: i * 0.03 }}
                                >
                                  <span
                                    className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                                    style={{ backgroundColor: tier.accent }}
                                  />
                                  <span className="text-base text-foreground/80">
                                    {t(`corporateTiers.${tier.id}Features.${i}`)}
                                  </span>
                                </motion.li>
                              ))}
                            </ul>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Pyramid Visualization - Desktop only */}
              <motion.div
                className="flex-shrink-0 flex justify-center items-center"
                initial={{ opacity: 0, x: 40 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <div
                  className="relative"
                  style={{ width: PYRAMID_WIDTH, height: PYRAMID_HEIGHT }}
                >
                  {/* SVG Pyramid - UPWARD pointing */}
                  <svg
                    width={PYRAMID_WIDTH}
                    height={PYRAMID_HEIGHT}
                    viewBox={`0 0 ${PYRAMID_WIDTH} ${PYRAMID_HEIGHT}`}
                    className="absolute inset-0"
                  >
                    <defs>
                      <linearGradient id="grad-essentials" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="hsla(39, 30%, 32%, 0.6)" />
                        <stop offset="100%" stopColor="hsla(39, 25%, 25%, 0.4)" />
                      </linearGradient>
                      <linearGradient id="grad-management" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="hsla(39, 45%, 45%, 0.7)" />
                        <stop offset="100%" stopColor="hsla(39, 40%, 38%, 0.5)" />
                      </linearGradient>
                      <linearGradient id="grad-excellence" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="hsla(39, 52%, 55%, 0.8)" />
                        <stop offset="100%" stopColor="hsla(39, 48%, 45%, 0.6)" />
                      </linearGradient>
                      <filter id="pyramid-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="5" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>

                    {/* Render segments from top to bottom */}
                    {tiersData.map((tier, index) => {
                      const seg = SEGMENTS[index];
                      const y = seg.y;
                      const topY = y;
                      const bottomY = y + seg.height;
                      const topLeft = CENTER_X - seg.topWidth / 2;
                      const topRight = CENTER_X + seg.topWidth / 2;
                      const bottomLeft = CENTER_X - seg.bottomWidth / 2;
                      const bottomRight = CENTER_X + seg.bottomWidth / 2;

                      const path = seg.topWidth === 0
                        ? `M ${CENTER_X} ${topY} L ${bottomRight} ${bottomY} L ${bottomLeft} ${bottomY} Z`
                        : `M ${topLeft} ${topY} L ${topRight} ${topY} L ${bottomRight} ${bottomY} L ${bottomLeft} ${bottomY} Z`;

                      const isActive = activeTier === tier.id;

                      return (
                        <motion.path
                          key={tier.id}
                          d={path}
                          fill={`url(#grad-${tier.id})`}
                          stroke={isActive ? tier.accent : "hsla(39, 52%, 56%, 0.4)"}
                          strokeWidth={isActive ? 2 : 1}
                          filter={isActive ? "url(#pyramid-glow)" : undefined}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: isActive ? 1 : 0.5 }}
                          transition={{ duration: 0.3 }}
                          className="cursor-pointer"
                          onMouseEnter={() => handleTierHover(tier.id)}
                          onMouseLeave={() => handleTierHover(null)}
                        />
                      );
                    })}

                    {/* Outer pyramid border */}
                    <motion.path
                      d={`M ${CENTER_X} 0 L ${PYRAMID_WIDTH} ${PYRAMID_HEIGHT} L 0 ${PYRAMID_HEIGHT} Z`}
                      fill="none"
                      stroke="hsla(39, 52%, 56%, 0.25)"
                      strokeWidth={1}
                      initial={{ pathLength: 0 }}
                      animate={isInView ? { pathLength: 1 } : {}}
                      transition={{ duration: 1.5, delay: 0.3, ease: "easeInOut" }}
                    />

                    {/* Horizontal dividers */}
                    <line
                      x1={CENTER_X - 88}
                      y1={SEGMENTS[0].height}
                      x2={CENTER_X + 88}
                      y2={SEGMENTS[0].height}
                      stroke="hsla(39, 52%, 56%, 0.4)"
                      strokeWidth={1}
                    />
                    <line
                      x1={CENTER_X - 173}
                      y1={SEGMENTS[0].height + SEGMENTS[1].height}
                      x2={CENTER_X + 173}
                      y2={SEGMENTS[0].height + SEGMENTS[1].height}
                      stroke="hsla(39, 52%, 56%, 0.4)"
                      strokeWidth={1}
                    />

                    {/* Labels inside each segment */}
                    {tiersData.map((tier, index) => {
                      const seg = SEGMENTS[index];
                      const isActive = activeTier === tier.id;
                      const bottomY = seg.y + seg.height - 20;

                      return (
                        <g key={`label-${tier.id}`}>
                          <text
                            x={CENTER_X}
                            y={bottomY - 18}
                            textAnchor="middle"
                            fill={isActive ? tier.accent : "hsl(0 0% 60%)"}
                            fontSize="12"
                            fontFamily="Montserrat, sans-serif"
                            letterSpacing="0.1em"
                            style={{ pointerEvents: "none" }}
                          >
                            {tier.price}
                          </text>
                          <text
                            x={CENTER_X}
                            y={bottomY}
                            textAnchor="middle"
                            fill={isActive ? "hsl(39 52% 80%)" : "hsl(39 40% 90%)"}
                            fontSize="13"
                            fontFamily="Montserrat, sans-serif"
                            letterSpacing="0.25em"
                            fontWeight={600}
                            style={{ pointerEvents: "none", textTransform: "uppercase" }}
                          >
                            {t(`corporateTiers.${tier.id}`)}
                          </text>
                        </g>
                      );
                    })}
                  </svg>

                  {/* Floating Orbital Labels - interactive hint */}
                  <div className="absolute -left-28 top-1/2 -translate-y-1/2 h-48 w-24 pointer-events-none hidden xl:block">
                    <motion.div
                      className="absolute left-0 top-4 bottom-4 w-[1px] bg-gradient-to-b from-transparent via-primary/40 to-transparent"
                      initial={{ scaleY: 0, opacity: 0 }}
                      animate={isInView ? { scaleY: 1, opacity: 1 } : {}}
                      transition={{ delay: 1.2, duration: 0.8 }}
                      style={{ transformOrigin: "center" }}
                    />
                    <motion.div
                      className="absolute left-0 top-1/2 w-2 h-2 -ml-[3px] rounded-full bg-primary shadow-[0_0_8px_hsl(39,52%,56%,0.6)]"
                      animate={{ scale: [1, 1.4, 1], opacity: [0.8, 0.4, 0.8] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
                    />
                    {[
                      { text: t("ui.hover"), y: -40, delay: 0 },
                      { text: t("ui.explore"), y: 0, delay: 0.3 },
                      { text: t("ui.tap"), y: 40, delay: 0.6 },
                    ].map((item, i) => (
                      <motion.span
                        key={i}
                        className="absolute left-4 font-sans-nav text-[10px] tracking-[0.3em] uppercase text-primary"
                        initial={{ opacity: 0, x: -5 }}
                        animate={isInView ? {
                          opacity: [0.6, 1, 0.6],
                          x: 0,
                        } : {}}
                        transition={{
                          delay: item.delay + 1.4,
                          duration: 2.5,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        style={{ top: `calc(50% + ${item.y}px)`, transform: 'translateY(-50%)' }}
                      >
                        {item.text}
                      </motion.span>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}

        {/* CTAs - centered at bottom */}
        <motion.div
          className="flex flex-col items-center gap-5 mt-12 sm:mt-20 px-6"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 1.3 }}
        >
          <Link
            to="/corporate"
            onMouseEnter={playHoverSound}
            className="border border-primary/50 text-primary px-8 sm:px-10 py-3 sm:py-4 font-sans-nav text-xs sm:text-sm tracking-[0.2em] sm:tracking-[0.25em] uppercase transition-all duration-700 hover:bg-primary hover:text-primary-foreground text-center"
          >
            {t("corporate.cta.request")}
          </Link>

          {/* Client Access Link - Luxury Style */}
          <button
            onClick={() => setShowSignIn(true)}
            onMouseEnter={playHoverSound}
            className="group flex flex-col items-center gap-3"
          >
            <div className="relative w-16 h-[1px]">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
              <motion.div
                className="absolute left-1/2 top-1/2 w-1.5 h-1.5 -ml-[3px] -mt-[3px] rounded-full bg-primary"
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-sans-nav text-[9px] sm:text-[10px] tracking-[0.2em] sm:tracking-[0.25em] uppercase text-muted-foreground group-hover:text-primary transition-colors duration-300">
                {t("corporate.cta.client")}
              </span>
              <ArrowRight className="w-3 h-3 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
            </div>
          </button>

          {/* Sign In Modal */}
          <SignInModal isOpen={showSignIn} onClose={() => setShowSignIn(false)} context="corporate" />
        </motion.div>

        {/* Footer */}
        <motion.div
          className="text-center mt-16 sm:mt-24 px-6"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 1.5 }}
        >
          <div className="flex flex-col items-center gap-3">
            {t("corporate.footer").split(" · ").map((part, i, arr) => (
              <div key={i} className="flex flex-col items-center gap-3">
                <span className="font-sans-nav text-[9px] sm:text-[10px] tracking-[0.25em] sm:tracking-[0.3em] uppercase text-muted-foreground">
                  {part}
                </span>
                {/* Gold separator line between items on mobile */}
                {i < arr.length - 1 && (
                  <div className="sm:hidden w-16 h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TierComparisonPyramid;
