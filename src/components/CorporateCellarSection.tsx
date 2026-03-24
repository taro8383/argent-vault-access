import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useHoverSound } from "@/hooks/use-sound";

const CorporateCellarSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { onMouseEnter: playHoverSound } = useHoverSound();
  const { t } = useTranslation("common");

  const tiers = [
    { key: "essentials" },
    { key: "management" },
    { key: "excellence" },
  ];

  return (
    <section
      id="corporate"
      className="relative min-h-screen flex flex-col justify-center overflow-hidden"
      ref={ref}
    >
      {/* Full-bleed atmospheric background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/30 to-background" />

      {/* Single vertical gold line */}
      <motion.div
        className="absolute left-1/2 top-0 w-[1px] bg-gradient-to-b from-transparent via-primary/40 to-transparent"
        initial={{ height: 0 }}
        animate={isInView ? { height: "100%" } : {}}
        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 py-32">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 1, delay: 0.2 }}
        >
          {/* Classification label */}
          <motion.p
            className="font-sans-nav text-[10px] tracking-[0.5em] uppercase text-primary/60 mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {t("corporate.eyebrow")}
          </motion.p>

          {/* Headline */}
          <motion.h2
            className="font-serif text-5xl md:text-7xl lg:text-8xl leading-[0.95] mb-10"
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="block">{t("corporate.title")}</span>
            <span className="block italic text-primary">{t("corporate.titleItalic")}</span>
            <span className="block">{t("corporate.titleEnd")}</span>
          </motion.h2>

          {/* The reframe */}
          <motion.p
            className="font-serif text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-6"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.9 }}
          >
            {t("corporate.reframe")}
          </motion.p>

          {/* Divider */}
          <motion.div
            className="gold-line w-24 mx-auto mb-6"
            initial={{ scaleX: 0 }}
            animate={isInView ? { scaleX: 1 } : {}}
            transition={{ duration: 0.8, delay: 1.1 }}
          />

          {/* Scarcity statement */}
          <motion.p
            className="text-sm text-muted-foreground/80 leading-relaxed max-w-lg mx-auto"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 1.2 }}
          >
            {t("corporate.scarcity")}
          </motion.p>
        </motion.div>

        {/* Three tiers — minimal horizontal presentation */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border/50 mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 1.3 }}
        >
          {tiers.map((tier) => (
            <div
              key={tier.key}
              className="bg-background p-8 md:p-10 text-center"
            >
              <p className="font-sans-nav text-[10px] tracking-[0.4em] uppercase text-primary/70 mb-4">
                {t(`corporate.tiers.${tier.key}.name`)}
              </p>
              <div className="flex items-baseline justify-center gap-1 mb-3">
                <span className="font-serif text-3xl">{t(`corporate.tiers.${tier.key}.price`)}</span>
                <span className="font-sans-nav text-[10px] text-muted-foreground">
                  {t(`corporate.tiers.${tier.key}.period`)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground/70 max-w-[200px] mx-auto">
                {t(`corporate.tiers.${tier.key}.focus`)}
              </p>
            </div>
          ))}
        </motion.div>

        {/* The ask */}
        <motion.div
          className="flex flex-col items-center gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 1.5 }}
        >
          <Link
            to="/corporate"
            onMouseEnter={playHoverSound}
            className="border border-primary/50 text-primary px-12 py-4 font-sans-nav text-xs tracking-[0.3em] uppercase transition-all duration-700 hover:bg-primary hover:text-primary-foreground"
          >
            {t("corporate.cta.request")}
          </Link>

          <Link
            to="/corporate"
            onMouseEnter={playHoverSound}
            className="font-sans-nav text-[10px] tracking-[0.2em] uppercase text-muted-foreground/60 hover:text-primary transition-colors duration-500"
          >
            {t("corporate.cta.client")}
          </Link>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.div
        className="absolute bottom-12 left-0 right-0 flex justify-center"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.8, delay: 1.7 }}
      >
        <p className="font-sans-nav text-[9px] tracking-[0.3em] uppercase text-muted-foreground/40">
          {t("corporate.footer")}
        </p>
      </motion.div>
    </section>
  );
};

export default CorporateCellarSection;
