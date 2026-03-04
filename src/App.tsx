import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SoundProvider } from "@/hooks/use-sound";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import logo from "./assets/logo 1.svg";

const queryClient = new QueryClient();

// Page Loader Component
const PageLoader = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 1300); // Total animation time

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 0.8, delay: 0.5 }}
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
        transition={{ duration: 1, ease: "easeOut" }}
      />

      {/* Logo container with glint effect */}
      <div className="relative z-10 overflow-hidden">
        <motion.img
          src={logo}
          alt="GC Wines"
          initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-32 h-auto"
        />

        {/* Glint/shine effect across logo */}
        <motion.div
          initial={{ x: "-100%", opacity: 0 }}
          animate={{ x: "200%", opacity: [0, 0.5, 0] }}
          transition={{ duration: 1, delay: 0.3 }}
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
          animate={{ width: "100%" }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />
      </motion.div>

      {/* Loading text */}
      <motion.p
        className="absolute bottom-14 left-1/2 -translate-x-1/2 font-sans-nav text-[10px] tracking-[0.4em] uppercase text-primary/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        Loading Experience
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
          <AnimatePresence>
            {isLoading && (
              <PageLoader onComplete={() => setIsLoading(false)} />
            )}
          </AnimatePresence>

          <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/admin" element={<Admin />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
      </SoundProvider>
    </QueryClientProvider>
  );
};

export default App;
