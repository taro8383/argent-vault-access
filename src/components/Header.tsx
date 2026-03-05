import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import SoundToggle from "./SoundToggle";
import LanguageSwitcher from "./LanguageSwitcher";
import { useHoverSound } from "@/hooks/use-sound";
import logo from "../assets/logo 1.svg";

// Magnetic Button Component for CTA
interface MagneticButtonProps {
  children: React.ReactNode;
  href: string;
  className?: string;
}

const MagneticButton = ({ children, href, className = "" }: MagneticButtonProps) => {
  const buttonRef = useRef<HTMLAnchorElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const { onMouseEnter: playHoverSound } = useHoverSound();

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 15, stiffness: 150 };
  const xSpring = useSpring(x, springConfig);
  const ySpring = useSpring(y, springConfig);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distanceX = e.clientX - centerX;
    const distanceY = e.clientY - centerY;

    // Stronger 0.15x multiplier for CTA button
    x.set(distanceX * 0.15);
    y.set(distanceY * 0.15);
  }, [x, y]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  }, [x, y]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    playHoverSound();
  }, [playHoverSound]);

  return (
    <motion.a
      ref={buttonRef}
      href={href}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      style={{ x: xSpring, y: ySpring }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      {children}
    </motion.a>
  );
};

// Magnetic Link Component - subtle pull effect for nav items
interface MagneticLinkProps {
  children: React.ReactNode;
  href: string;
  className?: string;
  isActive?: boolean;
}

const MagneticLink = ({ children, href, className = "", isActive }: MagneticLinkProps) => {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const { onMouseEnter: playHoverSound } = useHoverSound();

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 20, stiffness: 300 };
  const xSpring = useSpring(x, springConfig);
  const ySpring = useSpring(y, springConfig);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!linkRef.current) return;
    const rect = linkRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distanceX = e.clientX - centerX;
    const distanceY = e.clientY - centerY;

    // Subtler 0.1x multiplier for nav links (vs 0.15x for buttons)
    x.set(distanceX * 0.1);
    y.set(distanceY * 0.1);
  }, [x, y]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  }, [x, y]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    playHoverSound();
  }, [playHoverSound]);

  return (
    <motion.a
      ref={linkRef}
      href={href}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      style={{ x: xSpring, y: ySpring }}
      className={className}
    >
      {children}
      {isActive && (
        <motion.span
          layoutId="activeNav"
          className="absolute bottom-0 left-0 right-0 h-[1px] bg-primary"
          style={{
            background: "linear-gradient(90deg, transparent, hsl(39 52% 56%), transparent)",
          }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      )}
    </motion.a>
  );
};

const Header = () => {
  const { t } = useTranslation("common");
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");

  // Scroll to top when mobile menu opens
  useEffect(() => {
    if (mobileOpen && window.innerWidth < 768) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [mobileOpen]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scroll spy - track active section
  useEffect(() => {
    const sections = navItems.map(item => item.href.replace("#", ""));

    const observerOptions = {
      rootMargin: "-50% 0px -50% 0px",
      threshold: 0,
    };

    const observerCallback: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    sections.forEach((sectionId) => {
      const element = document.getElementById(sectionId);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, []);

  const navItems = [
    { label: t("nav.bridge"), href: "#narrative" },
    { label: t("nav.vault"), href: "#vault" },
    { label: t("nav.operations"), href: "#operations" },
    { label: t("nav.access"), href: "#contact" },
  ];

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${
        scrolled ? "bg-glass-strong py-3" : "py-6"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
        {/* Logo with magnetic effect */}
        <MagneticLink href="#" className="flex items-center">
          <img src={logo} alt="GC Wines" className="h-10 w-auto" />
        </MagneticLink>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-10">
          {navItems.map((item) => {
            const sectionId = item.href.replace("#", "");
            const isActive = activeSection === sectionId;

            return (
              <MagneticLink
                key={item.label}
                href={item.href}
                isActive={isActive}
                className={`font-sans-nav text-xs tracking-[0.2em] uppercase pb-1 transition-colors duration-300 relative ${
                  isActive
                    ? "text-primary"
                    : "text-secondary-foreground hover:text-primary gold-underline"
                }`}
              >
                {item.label}
              </MagneticLink>
            );
          })}
        </nav>

        {/* Sound Toggle - Desktop */}
        <div className="hidden md:flex items-center">
          <SoundToggle />
        </div>

        {/* Language Switcher - Desktop */}
        <div className="hidden md:flex items-center">
          <LanguageSwitcher />
        </div>

        {/* CTA */}
        <MagneticButton
          href="#contact"
          className="hidden md:inline-block font-sans-nav text-xs tracking-[0.2em] uppercase border border-primary text-primary px-6 py-2.5 transition-all duration-500 hover:bg-primary hover:text-primary-foreground"
        >
          {t("cta.privateInquiry")}
        </MagneticButton>

        {/* Mobile Toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-primary"
          aria-label={t("aria.toggleMenu")}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu - Full Screen Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
          >
            {/* Gold accent line that draws on open */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              exit={{ scaleX: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="absolute top-20 left-6 right-6 h-[1px] origin-left"
              style={{
                background: "linear-gradient(90deg, hsl(39 52% 56%), transparent)",
              }}
            />

            <div className="flex flex-col items-center justify-center h-full gap-8 px-6">
              {navItems.map((item, index) => {
                const sectionId = item.href.replace("#", "");
                const isActive = activeSection === sectionId;

                return (
                  <motion.a
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{
                      duration: 0.4,
                      delay: 0.1 + index * 0.1,
                      ease: "easeOut",
                    }}
                    className={`font-sans-nav text-lg tracking-[0.3em] uppercase transition-colors ${
                      isActive ? "text-primary" : "text-secondary-foreground hover:text-primary"
                    }`}
                  >
                    {item.label}
                    {isActive && (
                      <motion.span
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        className="block h-[1px] mt-2 origin-center"
                        style={{
                          background: "linear-gradient(90deg, transparent, hsl(39 52% 56%), transparent)",
                        }}
                      />
                    )}
                  </motion.a>
                );
              })}

              <motion.a
                href="#contact"
                onClick={() => setMobileOpen(false)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{
                  duration: 0.4,
                  delay: 0.1 + navItems.length * 0.1,
                  ease: "easeOut",
                }}
                className="font-sans-nav text-sm tracking-[0.2em] uppercase border border-primary text-primary px-8 py-4 mt-4 hover:bg-primary hover:text-primary-foreground transition-all duration-500"
              >
                {t("cta.privateInquiry")}
              </motion.a>
            </div>

            {/* Close button positioned at bottom */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.5 }}
              onClick={() => setMobileOpen(false)}
              className="absolute bottom-8 left-1/2 -translate-x-1/2 text-muted-foreground hover:text-primary transition-colors"
              aria-label={t("aria.closeMenu")}
            >
              <X size={24} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Header;
