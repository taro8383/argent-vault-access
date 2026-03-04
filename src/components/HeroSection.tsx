import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

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
  const mapOpacity = useTransform(scrollYProgress, [0.15, 0.5], [0, 1]);
  const mapY = useTransform(scrollYProgress, [0.15, 0.55], ["120px", "0px"]);

  // Sequential reveals for map elements (scroll-driven)
  const usaOpacity = useTransform(scrollYProgress, [0.3, 0.42], [0, 1]);
  const pathProgress1 = useTransform(scrollYProgress, [0.38, 0.52], [0, 1]);
  const montenegroOpacity = useTransform(scrollYProgress, [0.48, 0.58], [0, 1]);
  const pathProgress2 = useTransform(scrollYProgress, [0.55, 0.68], [0, 1]);
  const asiaOpacity = useTransform(scrollYProgress, [0.64, 0.74], [0, 1]);

  // Pulse glow for nodes
  const nodeGlow1 = useTransform(scrollYProgress, [0.42, 0.5], [0, 1]);
  const nodeGlow2 = useTransform(scrollYProgress, [0.58, 0.65], [0, 1]);
  const nodeGlow3 = useTransform(scrollYProgress, [0.74, 0.8], [0, 1]);

  return (
    <section
      ref={sectionRef}
      className="relative h-[200vh]"
    >
      {/* Sticky container */}
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Parallax Wine Cellar Background */}
        <motion.div
          style={{ y: bgY, opacity: bgOpacity }}
          className="absolute inset-0 -top-20"
        >
          <img
            src={heroBg}
            alt="Wine cellar atmosphere"
            className="w-full h-[120%] object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/30 to-background/80" />
        </motion.div>

        {/* Text Content Layer - fades out on scroll */}
        <motion.div
          style={{ opacity: textOpacity, y: textY }}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center"
        >
          <p className="font-sans-nav text-xs tracking-[0.4em] uppercase text-primary mb-6">
            Argentine Heritage · Global Reach
          </p>

          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl tracking-wide leading-tight mb-8">
            The Argentine
            <br />
            <span className="text-gradient-gold">Bridge</span>
          </h1>

          <div className="gold-line w-32 mb-8" />

          <p className="font-sans text-sm md:text-base tracking-wider text-muted-foreground max-w-2xl leading-relaxed">
            Financial Security in the USA. Logistical Precision in Montenegro.
            <br className="hidden md:block" />
            Cultural Access to Asia & The Balkans.
          </p>

          {/* Scroll indicator */}
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute bottom-10 w-[1px] h-10 bg-gradient-to-b from-primary to-transparent"
          />
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
                USA
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
                Financial Hub
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
                MONTENEGRO
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
                Logistical Hub
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
                ASIA
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
                Target Markets
              </text>
            </motion.g>
          </svg>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
