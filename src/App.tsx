import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SoundProvider } from "@/hooks/use-sound";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import logo from "./assets/logo 1.svg";
import heroBg from "./assets/hero-bg.jpg";
import img1 from "./assets/1.png";
import img2 from "./assets/2.png";
import img3 from "./assets/3.png";
import enImg from "./assets/en.png";

const queryClient = new QueryClient();

// Critical assets to preload - using Vite processed imports
const CRITICAL_ASSETS = [
  heroBg,
  img1,
  img2,
  img3,
  enImg,
];

// Page Loader Component with asset preloading
const PageLoader = ({ onComplete }: { onComplete: () => void }) => {
  const { t } = useTranslation("loading");
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState(t("preparing"));

  useEffect(() => {
    const MIN_LOADING_TIME = 2000; // Minimum 2 seconds for animation
    const startTime = Date.now();
    let loadedCount = 0;

    const updateProgress = () => {
      const percent = Math.round((loadedCount / CRITICAL_ASSETS.length) * 100);
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

    // Preload all critical assets with timeout for mobile
    const preloadPromises = CRITICAL_ASSETS.map((src) => {
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
    });

    Promise.all(preloadPromises).then(checkComplete).catch((err) => {
      console.error('Preload error:', err);
      checkComplete();
    });
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
              <BrowserRouter basename="/argent-vault-access/">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/admin" element={<Admin />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </motion.div>
          )}
        </TooltipProvider>
      </SoundProvider>
    </QueryClientProvider>
  );
};

export default App;
