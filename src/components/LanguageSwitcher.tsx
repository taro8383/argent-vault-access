import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { languages, type LanguageCode } from "@/i18n";
import { useHoverSound } from "@/hooks/use-sound";

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { onMouseEnter: playHoverSound } = useHoverSound();

  const currentLanguage = languages.find((lang) => lang.code === i18n.language) || languages[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLanguageChange = (code: LanguageCode) => {
    i18n.changeLanguage(code);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={playHoverSound}
        className="flex items-center gap-2 font-sans-nav text-[10px] tracking-[0.2em] uppercase text-muted-foreground hover:text-primary transition-colors duration-300"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Globe size={14} />
        <span className="hidden md:inline">{currentLanguage.flag}</span>
        <span className="md:hidden">{currentLanguage.code.toUpperCase()}</span>
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-full right-0 mt-3 min-w-[140px] rounded-sm overflow-hidden z-50"
            style={{
              background: "hsla(0, 0%, 8%, 0.98)",
              backdropFilter: "blur(20px)",
              border: "1px solid hsla(39, 52%, 56%, 0.2)",
              boxShadow: "0 10px 40px hsla(0, 0%, 0%, 0.5), 0 0 20px hsla(39, 52%, 56%, 0.1)",
            }}
          >
            {languages.map((lang) => (
              <motion.button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                onMouseEnter={playHoverSound}
                className={`w-full flex items-center justify-between px-4 py-3 text-left transition-all duration-200 ${
                  i18n.language === lang.code
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                }`}
                whileHover={{ x: 2 }}
              >
                <span className="font-sans-nav text-[10px] tracking-[0.15em] uppercase">
                  {lang.flag}
                </span>
                <span className="text-[10px] ml-3 opacity-60">
                  {lang.name}
                </span>
                {i18n.language === lang.code && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="ml-2"
                  >
                    <Check size={10} className="text-primary" />
                  </motion.div>
                )}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LanguageSwitcher;
