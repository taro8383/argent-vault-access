import { useState, useRef, useEffect, useCallback } from "react";
import { motion, useInView, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { Wine, Mountain, Star, GripHorizontal, LayoutGrid, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import WineDetailModal from "./WineDetailModal";
import { useHoverSound } from "@/hooks/use-sound";
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

// 3D Tilt Card Component
interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  onMouseEnter?: () => void;
  'data-wine-card'?: string;
}

const TiltCard = ({ children, className = "", onClick, onMouseEnter, 'data-wine-card': dataWineCard }: TiltCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 20, stiffness: 300 };
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), springConfig);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), springConfig);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Normalize position from -0.5 to 0.5
    x.set((e.clientX - centerX) / rect.width);
    y.set((e.clientY - centerY) / rect.height);
  }, [x, y]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  }, [x, y]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const handleCardMouseEnter = useCallback(() => {
    setIsHovered(true);
    onMouseEnter?.();
  }, [onMouseEnter]);

  return (
    <motion.div
      ref={cardRef}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleCardMouseEnter}
      onMouseDown={handleMouseDown}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        perspective: 1000,
      }}
      animate={{
        scale: isHovered ? 1.02 : 1,
      }}
      transition={{ duration: 0.3 }}
      className={className}
      data-wine-card={dataWineCard}
    >
      {children}
    </motion.div>
  );
};

const WineVault = () => {
  const { t, i18n } = useTranslation(["vault", "wines"]);
  const [wines, setWines] = useState<WineItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedWine, setSelectedWine] = useState<WineItem | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [viewMode, setViewMode] = useState<"carousel" | "grid">("carousel");
  const ref = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { onMouseEnter: playHoverSound } = useHoverSound();

  // Drag to scroll state with momentum
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [showHint, setShowHint] = useState(true);
  const velocityRef = useRef(0);
  const lastXRef = useRef(0);
  const lastTimeRef = useRef(0);
  const momentumRef = useRef<number | null>(null);

  // Use ref to track drag distance - only count as drag if moved significantly
  const dragStartPosRef = useRef(0);
  const hasDraggedRef = useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!carouselRef.current || viewMode !== "carousel") return;
    // Don't capture if clicking on a wine card
    const target = e.target as HTMLElement;
    if (target.closest('.group') || target.closest('[data-wine-card]')) {
      return;
    }
    // Cancel any ongoing momentum
    if (momentumRef.current) {
      cancelAnimationFrame(momentumRef.current);
      momentumRef.current = null;
    }
    dragStartPosRef.current = e.pageX;
    hasDraggedRef.current = false;
    setIsDragging(true);
    setStartX(e.pageX - carouselRef.current.offsetLeft);
    setScrollLeft(carouselRef.current.scrollLeft);
    setShowHint(false);
    velocityRef.current = 0;
    lastXRef.current = e.pageX;
    lastTimeRef.current = Date.now();
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    // Apply momentum
    applyMomentum();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !carouselRef.current) return;
    // Check if we've moved enough to count as a drag
    const moveDistance = Math.abs(e.pageX - dragStartPosRef.current);
    if (moveDistance > 5) {
      hasDraggedRef.current = true;
    }
    e.preventDefault();
    const x = e.pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    carouselRef.current.scrollLeft = scrollLeft - walk;

    // Calculate velocity
    const now = Date.now();
    const dt = now - lastTimeRef.current;
    if (dt > 0) {
      velocityRef.current = (e.pageX - lastXRef.current) / dt;
    }
    lastXRef.current = e.pageX;
    lastTimeRef.current = now;
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      applyMomentum();
    }
  };

  // Keyboard navigation
  const scrollToCard = (direction: "left" | "right") => {
    if (!carouselRef.current || viewMode !== "carousel") return;
    const cardWidth = 328; // 280px + 48px gap
    const scrollAmount = direction === "left" ? -cardWidth : cardWidth;
    carouselRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewMode !== "carousel") return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        scrollToCard("left");
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        scrollToCard("right");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewMode]);

  // Momentum scrolling
  const applyMomentum = () => {
    if (!carouselRef.current) return;
    const carousel = carouselRef.current;
    const velocity = velocityRef.current;
    const friction = 0.95;
    const minVelocity = 0.1;

    let currentVelocity = -velocity * 15; // Reverse and amplify

    const animate = () => {
      if (Math.abs(currentVelocity) < minVelocity) {
        momentumRef.current = null;
        return;
      }

      carousel.scrollLeft += currentVelocity;
      currentVelocity *= friction;
      momentumRef.current = requestAnimationFrame(animate);
    };

    momentumRef.current = requestAnimationFrame(animate);
  };

  // Touch support with momentum
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!carouselRef.current || viewMode !== "carousel") return;
    // Cancel any ongoing momentum
    if (momentumRef.current) {
      cancelAnimationFrame(momentumRef.current);
      momentumRef.current = null;
    }
    setStartX(e.touches[0].pageX - carouselRef.current.offsetLeft);
    setScrollLeft(carouselRef.current.scrollLeft);
    setShowHint(false);
    velocityRef.current = 0;
    lastXRef.current = e.touches[0].pageX;
    lastTimeRef.current = Date.now();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!carouselRef.current) return;
    const x = e.touches[0].pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    carouselRef.current.scrollLeft = scrollLeft - walk;

    // Calculate velocity for momentum
    const now = Date.now();
    const dt = now - lastTimeRef.current;
    if (dt > 0) {
      velocityRef.current = (e.touches[0].pageX - lastXRef.current) / dt;
    }
    lastXRef.current = e.touches[0].pageX;
    lastTimeRef.current = now;
  };

  const handleTouchEnd = () => {
    applyMomentum();
  };

  // Reset hint when section comes back into view
  useEffect(() => {
    if (isInView) {
      setShowHint(true);
      const timer = setTimeout(() => setShowHint(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isInView]);

  // Scroll progress tracker
  const [scrollProgress, setScrollProgress] = useState(0);

  const handleScroll = () => {
    if (!carouselRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
    const progress = scrollLeft / (scrollWidth - clientWidth);
    setScrollProgress(progress);
  };

  useEffect(() => {
    const carousel = carouselRef.current;
    if (carousel) {
      carousel.addEventListener("scroll", handleScroll, { passive: true });
      return () => carousel.removeEventListener("scroll", handleScroll);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch wines without the join syntax that might be causing issues
        const { data: winesData, error: winesError } = await supabase
          .from('wines')
          .select('*')
          .order('sort_order');

        if (winesError) {
          console.error('Wines fetch error:', winesError);
        }

        // Fetch categories separately
        const { data: catsData, error: catsError } = await supabase
          .from('categories')
          .select('*')
          .order('sort_order');

        if (catsError) {
          console.error('Categories fetch error:', catsError);
        }

        // Create a map of category id to name
        const categoryMap = new Map();
        if (catsData) {
          catsData.forEach((cat: any) => {
            categoryMap.set(cat.id, cat.name);
          });
          setCategories(catsData.map((c: any) => c.name));
        }

        if (winesData) {
          // Get wine translations function
          const getWineTranslation = (wineId: string, field: string, defaultValue: string) => {
            const key = `wines:wines.${wineId}.${field}`;
            const translated = t(key, { defaultValue: '' });
            return translated || defaultValue;
          };

          setWines(winesData.map((w: any) => {
            const categoryName = categoryMap.get(w.category_id) ?? 'Uncategorized';
            return {
              id: w.id,
              name: w.name,
              category: getWineTranslation(w.id, 'category', categoryName),
              region: w.region,
              altitude: w.altitude,
              score: w.score,
              vintage: w.vintage,
              description: getWineTranslation(w.id, 'description', w.description),
              rationale: getWineTranslation(w.id, 'rationale', w.rationale),
              winemaker: w.winemaker,
              color: w.color,
              image_url: w.image_url,
            };
          }));
        }
      } catch (err) {
        console.error('Fetch error:', err);
      }
    };

    fetchData();
  }, [i18n.language]);

  // Helper to get translated category name for display
  const getCategoryTranslation = (dbCategoryName: string): string => {
    const categoryMap: Record<string, string> = {
      "The Balkan Powerhouses": "categories.balkan",
      "The Washoku Series (Japan)": "categories.washoku",
      "The French Connection Series (China)": "categories.french",
      "The Tropical Series (Singapore)": "categories.tropical",
    };
    const key = categoryMap[dbCategoryName];
    return key ? t(key, dbCategoryName) : dbCategoryName;
  };

  // Store raw category names internally, translate only for display
  const allCategoriesRaw = ["All", ...categories];
  const allCategoriesDisplay = allCategoriesRaw.map(cat =>
    cat === "All" ? t("categories.all") : getCategoryTranslation(cat)
  );

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
            {t("sectionTag")}
          </p>
          <h2 className="font-serif text-4xl md:text-6xl">{t("sectionTitle")}</h2>
          <motion.div
            className="gold-line w-16 mx-auto mt-6"
            animate={{ scaleX: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
          />
        </motion.div>

        {/* Category filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="flex justify-center gap-4 md:gap-8 mb-12 px-6 flex-wrap"
        >
          {allCategoriesRaw.map((rawCat, index) => (
            <button
              key={rawCat}
              onClick={() => setActiveCategory(rawCat)}
              onMouseEnter={playHoverSound}
              className={`font-sans-nav text-[10px] md:text-xs tracking-[0.2em] uppercase pb-1 transition-all duration-300 ${
                activeCategory === rawCat
                  ? "text-primary border-b border-primary"
                  : "text-muted-foreground hover:text-secondary-foreground"
              }`}
            >
              {allCategoriesDisplay[index]}
            </button>
          ))}
        </motion.div>

        {/* View Mode Toggle - Centered below categories */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="flex items-center justify-center gap-6 mb-12"
        >
          <button
            onClick={() => setViewMode(viewMode === "carousel" ? "grid" : "carousel")}
            onMouseEnter={playHoverSound}
            className="flex items-center gap-2 font-sans-nav text-[10px] tracking-[0.2em] uppercase text-muted-foreground hover:text-primary transition-colors duration-300 border-b border-transparent hover:border-primary pb-1"
          >
            <LayoutGrid size={14} />
            {viewMode === "carousel" ? t("viewMode.grid") : t("viewMode.carousel")}
          </button>

          {/* Keyboard Navigation (only in carousel mode) */}
          <AnimatePresence>
            {viewMode === "carousel" && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-2"
              >
                <span className="text-[10px] text-muted-foreground tracking-wider mr-2">{t("viewMode.navigate")}</span>
                <button
                  onClick={() => scrollToCard("left")}
                  onMouseEnter={playHoverSound}
                  className="p-2 rounded-full border border-border text-muted-foreground hover:text-primary hover:border-primary transition-all duration-300"
                  aria-label="Scroll left"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  onClick={() => scrollToCard("right")}
                  onMouseEnter={playHoverSound}
                  className="p-2 rounded-full border border-border text-muted-foreground hover:text-primary hover:border-primary transition-all duration-300"
                  aria-label="Scroll right"
                >
                  <ChevronRight size={14} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Carousel View */}
        <AnimatePresence mode="wait">
          {viewMode === "carousel" ? (
            <motion.div
              key="carousel"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Horizontal scroll carousel - Drag to explore */}
              <div
                ref={carouselRef}
                className={`overflow-x-hidden select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onScroll={handleScroll}
              >
                {/* Drag hint */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: showHint && isInView ? 1 : 0, y: showHint && isInView ? 0 : 10 }}
                  transition={{ delay: 1, duration: 0.6 }}
                  className="flex items-center justify-center gap-3 mb-6 text-primary/60"
                >
                  <GripHorizontal size={16} className="animate-pulse" />
                  <span className="font-sans-nav text-[10px] tracking-[0.3em] uppercase">
                    {t("viewMode.dragHint")}
                  </span>
                </motion.div>

                <div className="flex gap-8 px-6 md:px-12 lg:px-24 pb-8" style={{ minWidth: "max-content" }}>
                  {filteredWines.map((wine, i) => (
                    <motion.div
                      key={wine.id}
                      initial={{ opacity: 0, y: 40 }}
                      animate={isInView ? { opacity: 1, y: 0 } : {}}
                      transition={{ delay: 0.4 + i * 0.1, duration: 0.7 }}
                      className="group w-[280px] md:w-[320px] flex-shrink-0"
                    >
                      {/* Wine bottle visualization with 3D tilt */}
                      <TiltCard
                        onClick={() => {
                          if (!hasDraggedRef.current) {
                            setSelectedWine(wine);
                          }
                        }}
                        onMouseEnter={playHoverSound}
                        className="relative h-[380px] md:h-[440px] rounded-sm overflow-hidden bg-secondary mb-6 flex items-center justify-center glow-burgundy transition-all duration-700 group-hover:glow-gold"
                        data-wine-card="true"
                      >
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
                        <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100 group-hover:scale-[1.02] flex flex-col items-center justify-center p-6">
                          <div className="flex items-center gap-2 mb-3">
                            <Star size={14} className="text-primary" />
                            <span className="font-serif text-3xl text-primary">{wine.score}</span>
                            <span className="text-xs text-muted-foreground">{t("wine.points")}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mountain size={12} />
                            <span className="text-xs tracking-wider">{wine.region}</span>
                          </div>
                          <span className="text-[10px] tracking-wider text-muted-foreground mt-1">
                            {(() => {
                              // Parse altitude to translate "meters" if present
                              const altitudeStr = wine.altitude || '';
                              const match = altitudeStr.match(/^([\d,\s–\-]+)\s*(meters?|metres?|m)?$/i);
                              if (match) {
                                const number = match[1].trim();
                                const unit = match[2];
                                if (unit) {
                                  return `${number} ${t("wine.meters", "meters")}`;
                                }
                                return number;
                              }
                              return altitudeStr;
                            })()}
                          </span>
                          <p className="text-xs text-secondary-foreground mt-4 text-center leading-relaxed">{wine.description}</p>
                        </div>
                      </TiltCard>

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

              {/* Scroll progress indicator - Outside carousel to stay fixed */}
              <div className="px-6 md:px-12 lg:px-24 pb-4 mt-2">
                <div className="max-w-md mx-auto">
                  <div className="h-[2px] bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background: "linear-gradient(90deg, hsl(39 52% 40%), hsl(39 52% 56%), hsl(39 52% 70%))",
                        width: `${Math.max(scrollProgress * 100, 5)}%`,
                      }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: isInView ? 1 : 0 }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="px-6 md:px-12 lg:px-24"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-8">
                {filteredWines.map((wine, i) => (
                  <motion.div
                    key={wine.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: i * 0.05, duration: 0.5 }}
                    onClick={() => setSelectedWine(wine)}
                    onMouseEnter={playHoverSound}
                    className="group cursor-pointer"
                  >
                    {/* Wine bottle visualization */}
                    <div className="relative h-[300px] md:h-[340px] rounded-sm overflow-hidden bg-secondary mb-4 flex items-center justify-center glow-burgundy transition-all duration-700 group-hover:glow-gold">
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/80" />

                      {wine.image_url ? (
                        <img
                          src={wine.image_url}
                          alt={wine.name}
                          className="relative z-10 h-[75%] object-contain wine-float"
                        />
                      ) : (
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
                      <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100 group-hover:scale-[1.02] flex flex-col items-center justify-center p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Star size={14} className="text-primary" />
                          <span className="font-serif text-2xl text-primary">{wine.score}</span>
                          <span className="text-xs text-muted-foreground">{t("wine.points")}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mountain size={12} />
                          <span className="text-xs tracking-wider">{wine.region}</span>
                        </div>
                        <span className="text-[10px] tracking-wider text-muted-foreground mt-1">
                          {(() => {
                            // Parse altitude to translate "meters" if present
                            const altitudeStr = wine.altitude || '';
                            const match = altitudeStr.match(/^(\d[,\s–\-]+)\s*(meters?|metres?|m)?$/i);
                            if (match) {
                              const number = match[1].trim();
                              const unit = match[2];
                              if (unit) {
                                return `${number} ${t("wine.meters", "meters")}`;
                              }
                              return number;
                            }
                            return altitudeStr;
                          })()}
                        </span>
                      </div>
                    </div>

                    {/* Wine info */}
                    <div className="space-y-1">
                      <p className="font-sans-nav text-[10px] tracking-[0.3em] uppercase text-primary">
                        {wine.category}
                      </p>
                      <h3 className="font-serif text-lg group-hover:text-primary transition-colors duration-300">
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
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <WineDetailModal wine={selectedWine} onClose={() => setSelectedWine(null)} />
    </>
  );
};

export default WineVault;
