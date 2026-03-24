import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useHoverSound } from "@/hooks/use-sound";
import { ArrowRight, Lock } from "lucide-react";
import SignInModal from "./SignInModal";

// The Sommelier's Table - atmospheric tasting setup
const TASTING_TABLE_IMAGE = "/images/tasting-table.webp";

const TradePortalSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { onMouseEnter: playHoverSound } = useHoverSound();
  const { t } = useTranslation("common");
  const [showSignIn, setShowSignIn] = useState(false);

  // Parallax zoom for the table image
  const { scrollYProgress } = useScroll({
    target: imageRef,
    offset: ["start end", "end start"],
  });

  const imageScale = useTransform(scrollYProgress, [0, 0.5, 1], [1, 1.08, 1.15]);
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "10%"]);

  // Gold line draw animation
  const lineWidth = useTransform(scrollYProgress, [0.2, 0.5], ["0%", "100%"]);

  return (
    <section id="trade" className="relative min-h-screen overflow-hidden" ref={ref}>
      {/* Full-bleed atmospheric background */}
      <div className="absolute inset-0 bg-gradient-to-br from-secondary/40 via-background to-secondary/20" />

      {/* Animated ambient orb */}
      <motion.div
        className="absolute top-1/3 -right-32 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 min-h-screen flex flex-col justify-center w-full px-6 md:px-12 lg:px-24 py-32">
        <div className="w-full">

          {/* Classification Label */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="mb-8 text-center lg:text-left"
          >
            <span className="font-sans-nav text-[10px] tracking-[0.5em] uppercase text-primary/60">
              {t("trade.eyebrow")}
            </span>
          </motion.div>

          {/* Main Content - Text Left, Image Right */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-20 items-center mb-12 lg:mb-20">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-center lg:text-left"
            >
              <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[0.95] mb-8">
                {t("trade.headline")}
              </h2>

              <div className="gold-line w-16 mx-auto lg:mx-0 mb-8" />

              <p className="font-serif text-xl md:text-2xl text-muted-foreground leading-relaxed mb-8">
                {t("trade.subheadline")}
              </p>

              <p className="text-muted-foreground leading-relaxed mb-10">
                {t("trade.description")}
              </p>

              {/* Key Benefits */}
              <div className="space-y-0 max-w-md mx-auto lg:mx-0">
                {(t("trade.benefits", { returnObjects: true }) as string[]).map((benefit, i, arr) => (
                  <div key={i}>
                    <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 py-3 sm:py-0">
                      <span className="w-12 sm:w-8 h-[1px] bg-primary flex-shrink-0" />
                      <span className="text-sm text-foreground text-center sm:text-left">{benefit}</span>
                    </div>
                    {/* Gold separator line on mobile between items */}
                    {i < arr.length - 1 && (
                      <div className="sm:hidden w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent my-2" />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* The Sommelier's Table - Now visible on all screens */}
            <motion.div
              ref={imageRef}
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ duration: 1, delay: 0.4 }}
              className="relative aspect-[4/3] lg:aspect-[4/5] overflow-hidden"
              style={{
                border: "1px solid hsla(39, 52%, 56%, 0.15)",
                boxShadow: "0 0 60px hsla(0, 0%, 0%, 0.4), 0 0 20px hsla(39, 52%, 56%, 0.08)",
              }}
            >
              {/* Corner etch marks - architectural frame */}
              <div className="absolute top-4 left-4 w-8 h-8 border-t border-l border-primary/20 z-10" />
              <div className="absolute top-4 right-4 w-8 h-8 border-t border-r border-primary/20 z-10" />
              <div className="absolute bottom-4 left-4 w-8 h-8 border-b border-l border-primary/20 z-10" />
              <div className="absolute bottom-4 right-4 w-8 h-8 border-b border-r border-primary/20 z-10" />

              {/* Image with parallax zoom - disabled on mobile */}
              <motion.div
                className="absolute inset-0"
                style={{
                  scale: imageScale,
                  y: imageY,
                }}
              >
                <img
                  src={TASTING_TABLE_IMAGE}
                  alt="Sommelier's tasting table"
                  className="w-full h-full object-cover"
                />
              </motion.div>

              {/* Vignette overlay */}
              <div
                className="absolute inset-0 pointer-events-none z-[5]"
                style={{
                  background: "radial-gradient(ellipse at center, transparent 40%, hsl(0 0% 7% / 0.6) 100%)",
                }}
              />

              {/* Gold accent line that draws on scroll - desktop only */}
              <div className="hidden lg:block absolute bottom-8 left-8 right-8 h-[1px] bg-primary/20 z-10">
                <motion.div
                  className="h-full bg-primary"
                  style={{ width: lineWidth }}
                />
              </div>

              {/* Floating label */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="absolute top-8 left-8 z-10"
              >
                <span className="font-sans-nav text-[9px] tracking-[0.3em] uppercase text-primary/70">
                  Private Tasting
                </span>
              </motion.div>
            </motion.div>
          </div>

          {/* The Value Proposition Cards */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-border/30 mb-20"
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <div className="bg-background p-6 sm:p-10 text-center">
              <span className="font-serif text-3xl sm:text-4xl text-primary block mb-2 sm:mb-3">
                {t("trade.stats.portfolio")}
              </span>
              <span className="font-sans-nav text-[9px] sm:text-[10px] tracking-[0.2em] sm:tracking-[0.3em] uppercase text-muted-foreground">
                {t("trade.stats.portfolioLabel")}
              </span>
            </div>
            <div className="bg-background p-6 sm:p-10 text-center">
              <span className="font-serif text-3xl sm:text-4xl text-primary block mb-2 sm:mb-3">
                {t("trade.stats.markets")}
              </span>
              <span className="font-sans-nav text-[9px] sm:text-[10px] tracking-[0.2em] sm:tracking-[0.3em] uppercase text-muted-foreground">
                {t("trade.stats.marketsLabel")}
              </span>
            </div>
            <div className="bg-background p-6 sm:p-10 text-center">
              <span className="font-serif text-3xl sm:text-4xl text-primary block mb-2 sm:mb-3">
                {t("trade.stats.approval")}
              </span>
              <span className="font-sans-nav text-[9px] sm:text-[10px] tracking-[0.2em] sm:tracking-[0.3em] uppercase text-muted-foreground">
                {t("trade.stats.approvalLabel")}
              </span>
            </div>
          </motion.div>

          {/* The CTA Block - Luxury Redesign */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            {/* Decorative frame */}
            <div className="absolute -inset-px border border-primary/20" />
            <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

            <div className="relative bg-secondary/10 backdrop-blur-sm p-12 md:p-16">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
                {/* Left: Text */}
                <div className="text-center lg:text-left">
                  <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
                    <Lock className="w-4 h-4 text-primary" />
                    <span className="font-sans-nav text-[10px] tracking-[0.4em] uppercase text-primary">
                      {t("trade.cta.eyebrow")}
                    </span>
                  </div>
                  <h3 className="font-serif text-3xl md:text-4xl mb-3">
                    {t("trade.cta.title")}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    {t("trade.cta.subtitle")}
                  </p>
                </div>

                {/* Right: Buttons */}
                <div className="flex flex-col items-center gap-4">
                  {/* Primary Button */}
                  <Link
                    to="/trade"
                    onMouseEnter={playHoverSound}
                    className="border border-primary text-primary px-12 py-6 font-sans-nav text-xs tracking-[0.25em] uppercase hover:bg-primary hover:text-primary-foreground transition-all duration-500 flex items-center gap-4"
                  >
                    <span>{t("trade.cta.apply")}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  {/* Sign In Link - Luxury Style */}
                  <button
                    onClick={() => setShowSignIn(true)}
                    onMouseEnter={playHoverSound}
                    className="group flex flex-col items-center gap-3"
                  >
                    {/* Horizontal line with pulsing dot */}
                    <div className="relative w-16 h-[1px]">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                      <motion.div
                        className="absolute left-1/2 top-1/2 w-1.5 h-1.5 -ml-[3px] -mt-[3px] rounded-full bg-primary"
                        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      />
                    </div>
                    {/* Text with arrow */}
                    <div className="flex items-center gap-2">
                      <span className="font-sans-nav text-[10px] tracking-[0.25em] uppercase text-muted-foreground group-hover:text-primary transition-colors duration-300">
                        {t("trade.cta.signin")}
                      </span>
                      <ArrowRight className="w-3 h-3 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
                    </div>
                  </button>

                  {/* Sign In Modal */}
                  <SignInModal isOpen={showSignIn} onClose={() => setShowSignIn(false)} context="trade" />
                </div>
              </div>

              {/* Bottom accent line */}
              <div className="absolute bottom-0 left-1/3 right-1/3 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default TradePortalSection;
