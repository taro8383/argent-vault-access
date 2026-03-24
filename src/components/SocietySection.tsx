import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Sparkles, ArrowRight } from "lucide-react";
import { useHoverSound } from "@/hooks/use-sound";
import MemberCardCanvas from "./MemberCardCanvas";
import SignInModal from "./SignInModal";

const SocietySection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const { onMouseEnter: playHoverSound } = useHoverSound();
  const { t } = useTranslation("common");
  const [showSignIn, setShowSignIn] = useState(false);

  return (
    <section id="society" className="section-padding relative overflow-hidden" ref={ref}>
      {/* Atmospheric background elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-secondary/10" />
      <motion.div
        className="absolute top-1/4 -right-64 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 w-full px-6 md:px-12 lg:px-24">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="inline-flex items-center gap-2 mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="font-sans-nav text-[9px] sm:text-[10px] tracking-[0.3em] sm:tracking-[0.4em] uppercase text-primary">
              {t("society.eyebrow")}
            </span>
            <Sparkles className="w-4 h-4 text-primary" />
          </motion.div>

          <h2 className="font-serif text-4xl md:text-5xl italic mb-6">
            {t("society.title")}
          </h2>

          <motion.div
            className="gold-line w-16 mx-auto mb-8"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={isInView ? { opacity: 1, scaleX: 1 } : {}}
            transition={{ delay: 0.3, duration: 0.6 }}
          />

          <p className="text-base md:text-lg leading-relaxed text-muted-foreground max-w-2xl mx-auto">
            {t("society.description")}
          </p>
        </motion.div>

        {/* Two-Column Layout: 3D Card Left, Content Right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center mb-24">
          {/* 3D Member Card */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="flex justify-center"
          >
            <MemberCardCanvas
              memberName="Alexandra Chen"
              memberId="GC-2026-018"
              tier="collector"
            />
          </motion.div>

          {/* Content - Story & Value Proposition */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="space-y-10"
          >
            {/* Story Beats */}
            <div className="space-y-6">
              {[
                {
                  num: "01",
                  title: t("society.story.discovery.title"),
                  desc: t("society.story.discovery.desc"),
                },
                {
                  num: "02",
                  title: t("society.story.revelation.title"),
                  desc: t("society.story.revelation.desc"),
                },
                {
                  num: "03",
                  title: t("society.story.scarcity.title"),
                  desc: t("society.story.scarcity.desc"),
                },
              ].map((item, i) => (
                <motion.div
                  key={item.num}
                  className="flex gap-4 p-6 border-l border-primary/20 bg-secondary/10"
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.5 + i * 0.1, duration: 0.6 }}
                >
                  <span className="font-sans-nav text-[10px] tracking-[0.3em] text-primary flex-shrink-0">
                    {item.num}
                  </span>
                  <div>
                    <h3 className="font-serif text-lg mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Scarcity Notice */}
            <motion.div
              className="p-4 sm:p-6 border border-primary/20 bg-primary/5 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              <span className="font-sans-nav text-[9px] sm:text-[10px] tracking-[0.3em] sm:tracking-[0.4em] uppercase text-primary block mb-2">
                {t("society.scarcityNotice.eyebrow")}
              </span>
              <p className="font-serif text-base sm:text-xl">{t("society.scarcityNotice.title")}</p>
            </motion.div>
          </motion.div>
        </div>

        {/* Tier Cards - Full width */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8 mb-12 sm:mb-20">
          {["founding", "private", "collector"].map((tierKey, i) => (
            <motion.div
              key={tierKey}
              className={`relative flex flex-col p-6 sm:p-10 rounded-sm ${
                tierKey === "collector"
                  ? "border border-primary bg-primary/5"
                  : "border border-border bg-secondary/30"
              }`}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                delay: i === 0 ? 0.6 : i === 1 ? 0.75 : 0.9,
                duration: 0.8,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {tierKey === "collector" && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 font-sans-nav text-[9px] sm:text-[10px] tracking-[0.2em] sm:tracking-[0.3em] uppercase text-primary-foreground bg-primary px-3 sm:px-4 py-1 whitespace-nowrap">
                  {t("society.tiers.collector.badge")}
                </span>
              )}

              <p className="font-sans-nav text-[9px] sm:text-[10px] tracking-[0.3em] sm:tracking-[0.4em] uppercase text-primary mb-4">
                {t(`society.tiers.${tierKey}.name`)}
              </p>

              <div className="flex items-baseline gap-1 mb-2">
                <span className="font-serif text-3xl text-foreground">
                  {t(`society.tiers.${tierKey}.price`)}
                </span>
                <span className="font-sans-nav text-[10px] text-muted-foreground">
                  {t(`society.tiers.${tierKey}.period`)}
                </span>
              </div>

              <p className="font-sans-nav text-[8px] sm:text-[9px] tracking-[0.2em] sm:tracking-[0.25em] uppercase text-primary/60 mb-6">
                {t("society.tiers.scarcity")}
              </p>

              <div className="gold-line w-full mb-6" />

              <div className="space-y-4 flex-1">
                <div>
                  <p className="font-sans-nav text-[9px] sm:text-[10px] tracking-[0.15em] sm:tracking-[0.2em] uppercase text-foreground mb-1">
                    {t("society.tiers.allocationLabel")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t(`society.tiers.${tierKey}.allocation`)}
                  </p>
                  <p className="text-xs text-muted-foreground/70">
                    {t(`society.tiers.${tierKey}.bottles`)}
                  </p>
                </div>

                <div>
                  <p className="font-sans-nav text-[9px] sm:text-[10px] tracking-[0.15em] sm:tracking-[0.2em] uppercase text-foreground mb-2">
                    {t("society.tiers.experiencesLabel")}
                  </p>
                  <ul className="space-y-2">
                    {(t(`society.experiences.${tierKey}`, { returnObjects: true }) as string[]).map(
                      (exp: string) => (
                        <li key={exp} className="flex items-start gap-2">
                          <span className="w-1 h-1 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                          <span className="text-xs text-muted-foreground">{exp}</span>
                        </li>
                      )
                    )}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTAs */}
        <motion.div
          className="flex flex-col items-center gap-5"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <Link
            to="/society"
            onMouseEnter={playHoverSound}
            className="border border-primary text-primary px-8 py-3 font-sans-nav text-xs tracking-[0.2em] uppercase hover:bg-primary hover:text-primary-foreground transition-all duration-500"
          >
            {t("society.cta.request")}
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
                {t("society.cta.signin")}
              </span>
              <ArrowRight className="w-3 h-3 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
            </div>
          </button>

          {/* Sign In Modal */}
          <SignInModal isOpen={showSignIn} onClose={() => setShowSignIn(false)} context="society" />

          <p className="text-xs text-muted-foreground/60 tracking-wider text-center italic mt-3 max-w-md">
            &ldquo;{t("society.cta.quote")}&rdquo;
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default SocietySection;
