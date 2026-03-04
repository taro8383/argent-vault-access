import { motion, useScroll, useTransform, useSpring, useVelocity, useInView } from "framer-motion";
import { useRef } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import NarrativeSection from "@/components/NarrativeSection";
import WineVault from "@/components/WineVault";
import GlobalMap from "@/components/GlobalMap";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import CustomCursor from "@/components/CustomCursor";

// Section divider component with scroll-triggered fade in
const SectionDivider = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      className="py-8"
      initial={{ opacity: 0, scaleX: 0 }}
      animate={isInView ? { opacity: 1, scaleX: 1 } : {}}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <div
        className="h-[1px] mx-auto max-w-[200px]"
        style={{
          background: "linear-gradient(90deg, transparent, hsla(39, 52%, 56%, 0.3), transparent)",
        }}
      />
    </motion.div>
  );
};

// Scroll velocity wrapper - applies subtle skew based on scroll speed
const ScrollVelocityWrapper = ({ children }: { children: React.ReactNode }) => {
  // Track scroll position and calculate velocity
  const { scrollY } = useScroll();
  const scrollYVelocity = useVelocity(scrollY);

  // Map velocity to subtle skew (-2deg to 2deg)
  const skewY = useTransform(scrollYVelocity, [-8, 8], [-1.5, 1.5]);

  // Smooth the skew with spring physics for liquid feel
  const smoothSkewY = useSpring(skewY, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      style={{
        skewY: smoothSkewY,
        transformOrigin: "center center",
      }}
      className="will-change-transform"
    >
      {children}
    </motion.div>
  );
};

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <CustomCursor />
      <Header />
      <ScrollVelocityWrapper>
        <HeroSection />
        <SectionDivider />
        <NarrativeSection />
        <SectionDivider />
        <WineVault />
        <SectionDivider />
        <GlobalMap />
        <SectionDivider />
        <ContactSection />
        <Footer />
      </ScrollVelocityWrapper>
    </div>
  );
};

export default Index;
