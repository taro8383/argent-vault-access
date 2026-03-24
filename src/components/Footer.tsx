import { motion } from "framer-motion";
import { Mail, Volume2, VolumeX } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSound } from "@/hooks/use-sound";
import { languages, type LanguageCode } from "@/i18n";
import logo from "../assets/logo 1.svg";

const Footer = () => {
  const { t, i18n } = useTranslation("footer");
  const { isMuted, toggleMute } = useSound();

  const handleLanguageChange = (code: LanguageCode) => {
    i18n.changeLanguage(code);
  };

  return (
    <footer className="section-padding pt-12 pb-12 border-t border-border">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center text-center md:text-left md:items-start gap-2">
          <motion.img
            src={logo}
            alt="GC Wines"
            className="h-8 w-auto cursor-pointer"
            whileHover={{ scale: 1.05, filter: "brightness(1.2)" }}
            transition={{ duration: 0.3 }}
          />
          {/* Contact email with hover reveal */}
          <motion.a
            href={`mailto:${t("email")}`}
            className="group flex items-center gap-2 text-[10px] tracking-wider text-muted-foreground hover:text-primary transition-colors duration-300"
            initial={{ opacity: 0.6 }}
            whileHover={{ opacity: 1 }}
          >
            <Mail size={12} className="opacity-50 group-hover:opacity-100 transition-opacity" />
            <span>{t("email")}</span>
          </motion.a>
        </div>

        {/* Center — Language & Sound */}
        <div className="flex items-center gap-8">
          {/* Language Selector — Minimal text links */}
          <div className="flex items-center gap-3">
            {languages.map((lang) => (
              <motion.button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`font-sans-nav text-[10px] tracking-[0.15em] uppercase transition-colors duration-300 ${
                  i18n.language === lang.code
                    ? "text-primary"
                    : "text-muted-foreground hover:text-primary"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {lang.code.toUpperCase()}
              </motion.button>
            )).reduce((acc: React.ReactNode[], curr, index, arr) => {
              acc.push(curr);
              if (index < arr.length - 1) {
                acc.push(
                  <span key={`sep-${index}`} className="text-muted-foreground/30 text-[10px]">·</span>
                );
              }
              return acc;
            }, [])}
          </div>

          {/* Divider */}
          <div className="w-[1px] h-4 bg-border" />

          {/* Sound Toggle — Simple icon */}
          <motion.button
            onClick={toggleMute}
            className="text-muted-foreground hover:text-primary transition-colors duration-300"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </motion.button>
        </div>

        <p className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
          {t("copyright", { year: new Date().getFullYear() })}
        </p>
      </div>
    </footer>
  );
};

export default Footer;
