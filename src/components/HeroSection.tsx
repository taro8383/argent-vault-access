import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  // Hub positions (roughly on a world map)
  const hubs = [
    { label: "USA", sublabel: "Financial Hub", cx: "22%", cy: "38%" },
    { label: "Montenegro", sublabel: "Logistical Hub", cx: "52%", cy: "32%" },
    { label: "Asia", sublabel: "Target Markets", cx: "78%", cy: "42%" },
  ];

  return (
    <section ref={ref} className="relative h-screen min-h-[700px] overflow-hidden">
      {/* Parallax Background */}
      <motion.div style={{ y: bgY }} className="absolute inset-0 -top-20">
        <img
          src={heroBg}
          alt="Wine cellar atmosphere"
          className="w-full h-[120%] object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/40 to-background" />
      </motion.div>

      {/* Content */}
      <motion.div
        style={{ opacity }}
        className="relative z-10 h-full flex flex-col items-center justify-center px-6 text-center"
      >
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="font-sans-nav text-xs tracking-[0.4em] uppercase text-primary mb-6"
        >
          Argentine Heritage · Global Reach
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="font-serif text-5xl md:text-7xl lg:text-8xl tracking-wide leading-tight mb-8"
        >
          The Argentine
          <br />
          <span className="text-gradient-gold">Bridge</span>
        </motion.h1>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 1, duration: 1.2 }}
          className="gold-line w-32 mb-8"
        />

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 1 }}
          className="font-sans text-sm md:text-base tracking-wider text-muted-foreground max-w-2xl leading-relaxed"
        >
          Financial Security in the USA. Logistical Precision in Montenegro.
          <br className="hidden md:block" />
          Cultural Access to Asia & The Balkans.
        </motion.p>

        {/* Global Hubs Map */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6, duration: 1 }}
          className="mt-16 w-full max-w-3xl"
        >
          <svg viewBox="0 0 800 200" className="w-full">
            {/* Connection lines */}
            <motion.line
              x1="176" y1="76" x2="416" y2="64"
              stroke="hsl(39 52% 56%)"
              strokeWidth="1"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.4 }}
              transition={{ delay: 2, duration: 1.5 }}
            />
            <motion.line
              x1="416" y1="64" x2="624" y2="84"
              stroke="hsl(39 52% 56%)"
              strokeWidth="1"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.4 }}
              transition={{ delay: 2.5, duration: 1.5 }}
            />

            {/* Hub nodes */}
            {hubs.map((hub, i) => (
              <motion.g
                key={hub.label}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 2 + i * 0.3, duration: 0.6 }}
              >
                {/* Outer glow */}
                <circle
                  cx={hub.cx}
                  cy={hub.cy}
                  r="18"
                  fill="none"
                  stroke="hsl(39 52% 56%)"
                  strokeWidth="0.5"
                  opacity="0.3"
                  className="animate-pulse-glow"
                />
                {/* Inner dot */}
                <circle
                  cx={hub.cx}
                  cy={hub.cy}
                  r="4"
                  fill="hsl(39 52% 56%)"
                />
                {/* Label */}
                <text
                  x={hub.cx}
                  y={parseFloat(hub.cy) > 50 ? `${parseFloat(hub.cy) + 12}%` : `${parseFloat(hub.cy) - 6}%`}
                  textAnchor="middle"
                  fill="hsl(39 52% 56%)"
                  fontSize="11"
                  fontFamily="Montserrat"
                  letterSpacing="3"
                >
                  {hub.label.toUpperCase()}
                </text>
                <text
                  x={hub.cx}
                  y={parseFloat(hub.cy) > 50 ? `${parseFloat(hub.cy) + 22}%` : `${parseFloat(hub.cy) + 6}%`}
                  textAnchor="middle"
                  fill="hsl(0 0% 55%)"
                  fontSize="8"
                  fontFamily="Montserrat"
                  letterSpacing="2"
                >
                  {hub.sublabel}
                </text>
              </motion.g>
            ))}
          </svg>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3, duration: 1 }}
          className="absolute bottom-10"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-[1px] h-10 bg-gradient-to-b from-primary to-transparent"
          />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
