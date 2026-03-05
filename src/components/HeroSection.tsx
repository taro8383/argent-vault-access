import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useMemo, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSound } from "@/hooks/use-sound";
import heroBg from "@/assets/hero-bg.jpg";

// Ambient dust particles component
const DustParticles = () => {
  // Generate random particles
  const particles = useMemo(() => {
    return Array.from({ length: 25 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 20 + 15,
      delay: Math.random() * 10,
      opacity: Math.random() * 0.4 + 0.1,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-primary"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            opacity: particle.opacity,
            filter: "blur(1px)",
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [particle.opacity, particle.opacity * 1.5, particle.opacity],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

const HeroSection = () => {
  const { t } = useTranslation("hero");
  const sectionRef = useRef<HTMLDivElement>(null);
  const { playAmbient } = useSound();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  // Auto-play ambient sound when hero mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      playAmbient();
    }, 1000);
    return () => clearTimeout(timer);
  }, [playAmbient]);

  // Track scroll over 2x viewport height for the parallax effect
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  // Background: slow parallax up + fade out
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const bgOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0.15]);

  // Text content fades out as we scroll
  const textOpacity = useTransform(scrollYProgress, [0, 0.35], [1, 0]);
  const textY = useTransform(scrollYProgress, [0, 0.4], ["0px", "-60px"]);

  // Map: fades in and rises from bottom
  const mapOpacity = useTransform(scrollYProgress, [0.1, 0.35, 0.8, 0.95], [0, 1, 1, 0]);
  const mapY = useTransform(scrollYProgress, [0.1, 0.4], ["120px", "0px"]);

  // Sequential reveals for map elements
  const usaOpacity = useTransform(scrollYProgress, [0.2, 0.32], [0, 1]);
  const pathProgress1 = useTransform(scrollYProgress, [0.28, 0.42], [0, 1]);
  const montenegroOpacity = useTransform(scrollYProgress, [0.38, 0.48], [0, 1]);
  const pathProgress2 = useTransform(scrollYProgress, [0.45, 0.58], [0, 1]);
  const asiaOpacity = useTransform(scrollYProgress, [0.52, 0.64], [0, 1]);

  // Pulse glow for nodes
  const nodeGlow1 = useTransform(scrollYProgress, [0.32, 0.4], [0, 1]);
  const nodeGlow2 = useTransform(scrollYProgress, [0.48, 0.55], [0, 1]);
  const nodeGlow3 = useTransform(scrollYProgress, [0.64, 0.72], [0, 1]);

  return (
    <section
      ref={sectionRef}
      className="relative h-[280vh]"
    >
      {/* Sticky container */}
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Wine Cellar Background - Mobile: simple, Desktop: parallax */}
        {isMobile ? (
          // Mobile: Static background without motion transforms
          <div className="absolute inset-0 -top-20">
            <img
              src={heroBg}
              alt="Wine cellar atmosphere"
              className="w-full h-full object-cover"
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
              loading="eager"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/30 to-background/80" />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "radial-gradient(ellipse at center, transparent 0%, hsl(0 0% 7% / 0.4) 100%)"
              }}
            />
          </div>
        ) : (
          // Desktop: Parallax background with motion
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{ y: bgY, opacity: bgOpacity }}
            className="absolute inset-0 -top-20"
          >
            <img
              src={heroBg}
              alt="Wine cellar atmosphere"
              className="w-full h-[120%] object-cover"
              loading="eager"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/30 to-background/80" />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "radial-gradient(ellipse at center, transparent 0%, hsl(0 0% 7% / 0.4) 100%)"
              }}
            />
            <DustParticles />
          </motion.div>
        )}

        {/* Text Content Layer - fades out on scroll */}
        <motion.div
          style={{ opacity: textOpacity, y: textY }}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center"
        >
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
            className="font-sans-nav text-xs tracking-[0.4em] uppercase text-primary mb-6"
          >
            {t("tagline")}
          </motion.p>

          <motion.h1 className="font-serif text-5xl md:text-7xl lg:text-8xl tracking-wide leading-tight mb-8">
            {t("title.line1").split("").map((char, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 + i * 0.03, ease: "easeOut" }}
              >
                {char === " " ? "\u00A0" : char}
              </motion.span>
            ))}
            <br />
            <motion.span
              className="text-gradient-gold inline-block"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.4, ease: "easeOut" }}
            >
              {t("title.line2")}
            </motion.span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.6, delay: 1.6, ease: "easeOut" }}
            className="gold-line w-32 mb-8 origin-center"
          >
            <motion.div
              className="w-full h-full"
              style={{
                background: "linear-gradient(90deg, transparent, hsl(39 52% 56%), transparent)",
              }}
              animate={{ scaleX: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut", delay: 1.8 }}
            />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.9, ease: "easeOut" }}
            className="font-sans text-sm md:text-base tracking-wider text-muted-foreground max-w-2xl leading-relaxed"
          >
            {t("subtitle")}
          </motion.p>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.8 }}
            className="absolute bottom-10"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 2, delay: 2 }}
              className="w-[1px] h-10 bg-gradient-to-b from-primary to-transparent"
            />
          </motion.div>
        </motion.div>

        {/* Map Layer - fades in from bottom on scroll */}
        <motion.div
          style={{ opacity: mapOpacity, y: mapY }}
          className="absolute inset-0 z-20 flex items-center justify-center px-4 md:px-12"
        >
          <svg
            viewBox="0 0 1000 400"
            className="w-full max-w-5xl"
            style={{ filter: "drop-shadow(0 0 40px hsla(39, 52%, 56%, 0.12))" }}
          >
            <defs>
              {/* Golden glow filter */}
              <filter id="goldGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feFlood floodColor="hsl(39, 52%, 56%)" floodOpacity="0.6" result="color" />
                <feComposite in2="blur" operator="in" result="glow" />
                <feMerge>
                  <feMergeNode in="glow" />
                  <feMergeNode in="glow" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Pulse glow for nodes */}
              <filter id="nodeGlow" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feFlood floodColor="hsl(39, 52%, 56%)" floodOpacity="0.8" result="color" />
                <feComposite in2="blur" operator="in" result="glow" />
                <feMerge>
                  <feMergeNode in="glow" />
                  <feMergeNode in="glow" />
                  <feMergeNode in="glow" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Gradient for the path light trail */}
              <linearGradient id="pathGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(39, 52%, 56%)" stopOpacity="0.3" />
                <stop offset="70%" stopColor="hsl(39, 52%, 70%)" stopOpacity="0.8" />
                <stop offset="100%" stopColor="hsl(39, 52%, 56%)" stopOpacity="1" />
              </linearGradient>
            </defs>

            {/* Subtle world outline - dotted equator */}
            <line
              x1="50" y1="200" x2="950" y2="200"
              stroke="hsl(39, 52%, 56%)"
              strokeWidth="0.3"
              strokeDasharray="2 8"
              opacity="0.15"
            />

            {/* === PATH 1: USA to Montenegro (curved) === */}
            <motion.path
              d="M 200 160 Q 400 80 520 140"
              fill="none"
              stroke="url(#pathGrad1)"
              strokeWidth="2"
              strokeLinecap="round"
              style={{ pathLength: pathProgress1 }}
              filter="url(#goldGlow)"
            />
            {/* Dim base path */}
            <path
              d="M 200 160 Q 400 80 520 140"
              fill="none"
              stroke="hsl(39, 52%, 56%)"
              strokeWidth="0.5"
              opacity="0.1"
            />

            {/* === PATH 2: Montenegro to Asia (curved) === */}
            <motion.path
              d="M 520 140 Q 650 90 800 170"
              fill="none"
              stroke="url(#pathGrad1)"
              strokeWidth="2"
              strokeLinecap="round"
              style={{ pathLength: pathProgress2 }}
              filter="url(#goldGlow)"
            />
            <path
              d="M 520 140 Q 650 90 800 170"
              fill="none"
              stroke="hsl(39, 52%, 56%)"
              strokeWidth="0.5"
              opacity="0.1"
            />

            {/* === USA Node === */}
            <motion.g style={{ opacity: usaOpacity }}>
              {/* Outer pulse ring */}
              <motion.circle
                cx="200" cy="160" r="22"
                fill="none"
                stroke="hsl(39, 52%, 56%)"
                strokeWidth="0.8"
                style={{ opacity: nodeGlow1 }}
                className="animate-pulse-glow"
              />
              <motion.circle
                cx="200" cy="160" r="14"
                fill="none"
                stroke="hsl(39, 52%, 56%)"
                strokeWidth="0.5"
                opacity="0.4"
              />
              {/* Core dot */}
              <circle
                cx="200" cy="160" r="5"
                fill="hsl(39, 52%, 56%)"
                filter="url(#nodeGlow)"
              />
              {/* Label */}
              <text
                x="200" y="125"
                textAnchor="middle"
                fill="hsl(39, 52%, 70%)"
                fontSize="14"
                fontFamily="Montserrat, sans-serif"
                fontWeight="500"
                letterSpacing="4"
              >
                {t("map.usa.label")}
              </text>
              <text
                x="200" y="200"
                textAnchor="middle"
                fill="hsl(0, 0%, 55%)"
                fontSize="9"
                fontFamily="Montserrat, sans-serif"
                fontWeight="300"
                letterSpacing="2"
              >
                {t("map.usa.description")}
              </text>
            </motion.g>

            {/* === Montenegro Node === */}
            <motion.g style={{ opacity: montenegroOpacity }}>
              <motion.circle
                cx="520" cy="140" r="22"
                fill="none"
                stroke="hsl(39, 52%, 56%)"
                strokeWidth="0.8"
                style={{ opacity: nodeGlow2 }}
                className="animate-pulse-glow"
              />
              <motion.circle
                cx="520" cy="140" r="14"
                fill="none"
                stroke="hsl(39, 52%, 56%)"
                strokeWidth="0.5"
                opacity="0.4"
              />
              <circle
                cx="520" cy="140" r="5"
                fill="hsl(39, 52%, 56%)"
                filter="url(#nodeGlow)"
              />
              <text
                x="520" y="105"
                textAnchor="middle"
                fill="hsl(39, 52%, 70%)"
                fontSize="14"
                fontFamily="Montserrat, sans-serif"
                fontWeight="500"
                letterSpacing="4"
              >
                {t("map.montenegro.label")}
              </text>
              <text
                x="520" y="180"
                textAnchor="middle"
                fill="hsl(0, 0%, 55%)"
                fontSize="9"
                fontFamily="Montserrat, sans-serif"
                fontWeight="300"
                letterSpacing="2"
              >
                {t("map.montenegro.description")}
              </text>
            </motion.g>

            {/* === Asia Node === */}
            <motion.g style={{ opacity: asiaOpacity }}>
              <motion.circle
                cx="800" cy="170" r="22"
                fill="none"
                stroke="hsl(39, 52%, 56%)"
                strokeWidth="0.8"
                style={{ opacity: nodeGlow3 }}
                className="animate-pulse-glow"
              />
              <motion.circle
                cx="800" cy="170" r="14"
                fill="none"
                stroke="hsl(39, 52%, 56%)"
                strokeWidth="0.5"
                opacity="0.4"
              />
              <circle
                cx="800" cy="170" r="5"
                fill="hsl(39, 52%, 56%)"
                filter="url(#nodeGlow)"
              />
              <text
                x="800" y="135"
                textAnchor="middle"
                fill="hsl(39, 52%, 70%)"
                fontSize="14"
                fontFamily="Montserrat, sans-serif"
                fontWeight="500"
                letterSpacing="4"
              >
                {t("map.asia.label")}
              </text>
              <text
                x="800" y="210"
                textAnchor="middle"
                fill="hsl(0, 0%, 55%)"
                fontSize="9"
                fontFamily="Montserrat, sans-serif"
                fontWeight="300"
                letterSpacing="2"
              >
                {t("map.asia.description")}
              </text>
            </motion.g>
          </svg>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
