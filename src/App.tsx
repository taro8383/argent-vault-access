import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SoundProvider } from "@/hooks/use-sound";
import { supabase } from "@/lib/supabase";
import { AuthProvider } from "@/contexts/AuthContext";
import CustomCursor from "@/components/CustomCursor";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import TradeGate from "./pages/trade/TradeGate";
import TradeDashboard from "./pages/trade/TradeDashboard";
import TradePortfolio from "./pages/trade/TradePortfolio";
import TradeEvents from "./pages/trade/TradeEvents";
import TradeIntelligence from "./pages/trade/TradeIntelligence";
import TradeEducation from "./pages/trade/TradeEducation";
import TradeOrders from "./pages/trade/TradeOrders";
import TradePartners from "./pages/trade/TradePartners";
import TradeContact from "./pages/trade/TradeContact";
import SocietyGate from "./pages/society/SocietyGate";
import SocietyApply from "./pages/society/SocietyApply";
import SocietyDashboard from "./pages/society/SocietyDashboard";
import SocietyAllocations from "./pages/society/SocietyAllocations";
import SocietyPurchases from "./pages/society/SocietyPurchases";
import SocietyEvents from "./pages/society/SocietyEvents";
import SocietyCellar from "./pages/society/SocietyCellar";
import SocietyProfile from "./pages/society/SocietyProfile";
import CorporateGate from "./pages/corporate/CorporateGate";
import logo from "./assets/logo 1.svg";
import heroBg from "./assets/hero-bg.webp";
import heroBgMobile from "./assets/hero-bg-m.webp";
import img1 from "./assets/1.webp";
import img1Es from "./assets/1es.webp";
import img1Jp from "./assets/1jp.webp";
import img1Sr from "./assets/1sr.webp";
import img1Zh from "./assets/1zh.webp";
import img2 from "./assets/2.webp";
import img2Es from "./assets/2es.webp";
import img2Jp from "./assets/2jp.webp";
import img2Sr from "./assets/2sr.webp";
import img2Zh from "./assets/2zh.webp";
import img3 from "./assets/3.webp";
import img3Es from "./assets/3es.webp";
import img3Jp from "./assets/3jp.webp";
import img3Sr from "./assets/3sr.webp";
import img3Zh from "./assets/3zh.webp";
import enImg from "./assets/en.webp";
import esImg from "./assets/es.webp";
import jpImg from "./assets/jp.webp";
import srImg from "./assets/sr.webp";
import zhImg from "./assets/zh.webp";
import completedSound from "./assets/completed.mp3";

const queryClient = new QueryClient();

// Static assets to preload (from src/assets - these get hashed)
const STATIC_ASSETS = [
  heroBg,
  heroBgMobile,
  img1,
  img1Es,
  img1Jp,
  img1Sr,
  img1Zh,
  img2,
  img2Es,
  img2Jp,
  img2Sr,
  img2Zh,
  img3,
  img3Es,
  img3Jp,
  img3Sr,
  img3Zh,
  enImg,
  esImg,
  jpImg,
  srImg,
  zhImg,
];

// Public folder assets (copied as-is to dist)
const PUBLIC_ASSETS = [
  "/images/tasting-table.webp",
  "/logo-card.svg",
  "/favicon.svg",
];

// Font files to preload (only actually used weights)
const FONT_ASSETS = [
  "/fonts/cormorant-garamond-latin-400-normal.woff2",
  "/fonts/cormorant-garamond-latin-400-italic.woff2",
];

// Page Loader Component with asset preloading
const PageLoader = ({ onComplete }: { onComplete: () => void }) => {
  const { t } = useTranslation("loading");
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState(t("preparing"));
  const [soundPlayed, setSoundPlayed] = useState(false);

  // Play completion sound when progress reaches 100%
  useEffect(() => {
    if (progress === 100 && !soundPlayed) {
      setSoundPlayed(true);
      const audio = new Audio(completedSound);
      audio.volume = 0.5;
      audio.play().catch((err) => {
        // Autoplay may be blocked by browser - that's fine
        console.log("Sound playback prevented:", err);
      });
    }
  }, [progress, soundPlayed]);

  useEffect(() => {
    const MIN_LOADING_TIME = 2000; // Minimum 2 seconds for animation
    const startTime = Date.now();
    let loadedCount = 0;
    let totalAssets = STATIC_ASSETS.length;

    const updateProgress = () => {
      const percent = Math.round((loadedCount / totalAssets) * 100);
      setProgress(percent);

      // Update text based on progress
      if (percent < 30) setLoadingText(t("loadingAssets"));
      else if (percent < 60) setLoadingText(t("optimizing"));
      else if (percent < 90) setLoadingText(t("finalizing"));
      else setLoadingText(t("welcome"));
    };

    const checkComplete = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, MIN_LOADING_TIME - elapsed);

      setTimeout(() => {
        onComplete();
      }, remaining);
    };

    const preloadImage = (src: string): Promise<void> => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        const timeout = setTimeout(() => {
          console.warn('Image load timeout:', src);
          loadedCount++;
          updateProgress();
          resolve();
        }, 10000); // 10 second timeout for slow mobile

        img.onload = () => {
          clearTimeout(timeout);
          loadedCount++;
          updateProgress();
          resolve();
        };
        img.onerror = () => {
          clearTimeout(timeout);
          console.error('Failed to load:', src);
          loadedCount++;
          updateProgress();
          resolve();
        };
        img.src = src;
      });
    };

    // Preload fonts using FontFace API
    const preloadFonts = (): Promise<void>[] => {
      return FONT_ASSETS.map((fontUrl) => {
        return new Promise<void>((resolve) => {
          const fontName = fontUrl.split('/').pop()?.replace('.woff2', '') || 'font';
          const timeout = setTimeout(() => {
            console.warn('Font load timeout:', fontUrl);
            loadedCount++;
            updateProgress();
            resolve();
          }, 8000);

          // Use fetch to preload the font file
          fetch(fontUrl)
            .then(() => {
              clearTimeout(timeout);
              loadedCount++;
              updateProgress();
              resolve();
            })
            .catch(() => {
              clearTimeout(timeout);
              console.warn('Font load failed:', fontUrl);
              loadedCount++;
              updateProgress();
              resolve();
            });
        });
      });
    };

    // Fetch wines from Supabase and preload their images
    const fetchAndPreloadWines = async () => {
      const { data: winesData, error } = await supabase
        .from('wines')
        .select('image_url');

      if (error) {
        console.error('Error fetching wines:', error);
        return [];
      }

      // Get unique wine image URLs
      const wineImages = winesData
        ?.map((w: any) => w.image_url)
        .filter((url: string | null) => url) || [];

      return wineImages;
    };

    // Start preloading everything
    const startPreloading = async () => {
      const wineImages = await fetchAndPreloadWines();
      const allAssets = [...STATIC_ASSETS, ...PUBLIC_ASSETS, ...wineImages];
      totalAssets = allAssets.length + FONT_ASSETS.length;

      const imagePromises = allAssets.map(preloadImage);
      const fontPromises = preloadFonts();

      Promise.all([...imagePromises, ...fontPromises]).then(checkComplete).catch((err) => {
        console.error('Preload error:', err);
        checkComplete();
      });
    };

    startPreloading();
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-[100] bg-background flex items-center justify-center"
      style={{
        pointerEvents: "none",
      }}
    >
      {/* Gold gradient glow behind logo */}
      <motion.div
        className="absolute w-48 h-48 rounded-full"
        style={{
          background: "radial-gradient(circle, hsla(39, 52%, 56%, 0.3) 0%, transparent 70%)",
        }}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: [0.8, 1.2, 1], opacity: [0, 0.8, 0] }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />

      {/* Logo container with glint effect */}
      <div className="relative z-10 overflow-hidden">
        <motion.img
          src={logo}
          alt="GC Wines"
          initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="w-32 h-auto"
        />

        {/* Glint/shine effect across logo */}
        <motion.div
          initial={{ x: "-100%", opacity: 0 }}
          animate={{ x: "200%", opacity: [0, 0.5, 0] }}
          transition={{ duration: 1.2, delay: 0.4 }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 pointer-events-none"
        />
      </div>

      {/* Loading bar at bottom */}
      <motion.div
        className="absolute bottom-20 left-1/2 -translate-x-1/2 h-[1px] bg-primary/30 overflow-hidden"
        style={{ width: "200px" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <motion.div
          className="h-full bg-primary"
          initial={{ width: "0%" }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </motion.div>

      {/* Loading text */}
      <motion.p
        className="absolute bottom-14 left-1/2 -translate-x-1/2 font-sans-nav text-[10px] tracking-[0.4em] uppercase text-primary/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {loadingText}
      </motion.p>

      {/* Progress percentage */}
      <motion.p
        className="absolute bottom-24 left-1/2 -translate-x-1/2 font-serif text-xs text-primary/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {progress}%
      </motion.p>
    </motion.div>
  );
};

const App = () => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <QueryClientProvider client={queryClient}>
      <SoundProvider>
        <TooltipProvider>
          <AuthProvider>
            <CustomCursor />
            <Toaster />
            <Sonner />

            {/* Page Load Animation */}
            <AnimatePresence mode="wait">
              {isLoading && (
                <PageLoader onComplete={() => setIsLoading(false)} />
              )}
            </AnimatePresence>

            {/* Main content - only render after loading complete */}
            {!isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <BrowserRouter>
                  <Routes>
                    {/* ── Public routes ─────────────────────────── */}
                    <Route path="/" element={<Index />} />
                    <Route path="/admin" element={<Admin />} />

                    {/* ── Trade Portal ───────────────────────────── */}
                    <Route path="/trade" element={<TradeGate />} />
                    <Route path="/trade/dashboard" element={<TradeDashboard />}>
                      <Route index element={<Navigate to="portfolio" replace />} />
                      <Route path="portfolio"    element={<TradePortfolio />} />
                      <Route path="events"       element={<TradeEvents />} />
                      <Route path="intelligence" element={<TradeIntelligence />} />
                      <Route path="education"    element={<TradeEducation />} />
                      <Route path="orders"       element={<TradeOrders />} />
                      <Route path="partners"     element={<TradePartners />} />
                      <Route path="contact"      element={<TradeContact />} />
                    </Route>

                    {/* ── Private Allocation Society ─────────────── */}
                    <Route path="/society" element={<SocietyGate />} />
                    <Route path="/society/apply" element={<SocietyApply />} />
                    <Route path="/society/dashboard" element={<SocietyDashboard />}>
                      <Route index element={<Navigate to="allocations" replace />} />
                      <Route path="allocations" element={<SocietyAllocations />} />
                      <Route path="purchases"   element={<SocietyPurchases />} />
                      <Route path="events"      element={<SocietyEvents />} />
                      <Route path="cellar"      element={<SocietyCellar />} />
                      <Route path="profile"     element={<SocietyProfile />} />
                    </Route>

                    {/* ── Corporate Services ─────────────────────── */}
                    <Route path="/corporate" element={<CorporateGate />} />

                    {/* ── Catch-all ──────────────────────────────── */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </motion.div>
            )}
          </AuthProvider>
        </TooltipProvider>
      </SoundProvider>
    </QueryClientProvider>
  );
};

export default App;
