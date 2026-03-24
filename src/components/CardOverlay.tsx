import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

interface CardOverlayProps {
  memberName?: string;
  memberId?: string;
  tier?: "founding" | "private" | "collector";
  isFlipped?: boolean;
  onFlip?: (flipped: boolean) => void;
}

const CardOverlay = ({
  memberName = "Alexandra Chen",
  memberId = "GC-2026-018",
  tier = "collector",
  isFlipped = false,
  onFlip,
}: CardOverlayProps) => {
  const { t } = useTranslation("common");
  const tierColors = {
    founding: "#c9a050",
    private: "#d4af37",
    collector: "#f5d799",
  };

  const handleClick = () => {
    onFlip?.(!isFlipped);
  };

  const accentColor = tierColors[tier];

  return (
    <div
      className="absolute inset-0 flex items-center justify-center cursor-pointer"
      onClick={handleClick}
      style={{ perspective: "1000px" }}
    >
      {/* Radiating gold glow from behind */}
      <motion.div
        className="absolute w-[450px] h-[320px] md:w-[540px] md:h-[380px] rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, ${accentColor}30 0%, ${accentColor}15 30%, ${accentColor}05 50%, transparent 70%)`,
          filter: "blur(30px)",
          transform: "translateZ(-50px)",
        }}
        animate={{
          opacity: [0.7, 1, 0.7],
          scale: [1, 1.08, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Front Face */}
      <motion.div
        initial={false}
        animate={{
          opacity: isFlipped ? 0 : 1,
          rotateY: isFlipped ? 180 : 0,
        }}
        transition={{ duration: 0.35, ease: "easeInOut" }}
        className="absolute w-[340px] h-[215px] md:w-[420px] md:h-[265px] flex flex-col justify-between p-8 md:p-10 pointer-events-none"
        style={{
          transformStyle: "preserve-3d",
          backfaceVisibility: "hidden",
          zIndex: isFlipped ? 0 : 10,
        }}
      >
        {/* Front Content - Luxury Layout */}
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <img
              src="/logo-card.svg"
              alt="GC Wines"
              className="h-8 md:h-10 w-auto"
              style={{ filter: `drop-shadow(0 2px 4px ${accentColor}20)` }}
            />
          </div>
          <div className="flex flex-col items-end">
            <span
              className="font-sans-nav text-[8px] tracking-[0.3em] uppercase"
              style={{ color: accentColor }}
            >
              {tier}
            </span>
            <div
              className="w-8 h-[1px] mt-1"
              style={{ backgroundColor: accentColor, opacity: 0.5 }}
            />
          </div>
        </div>

        <div className="flex-1 flex items-center">
          <div
            className="w-20 h-[1px]"
            style={{
              background: `linear-gradient(90deg, ${accentColor}60, transparent)`,
            }}
          />
        </div>

        <div className="flex justify-between items-end">
          <div>
            <span className="font-sans-nav text-[7px] tracking-[0.25em] uppercase text-muted-foreground/70 block mb-1">
              Member
            </span>
            <span className="font-serif text-lg md:text-xl text-foreground tracking-wide">
              {memberName}
            </span>
          </div>
          <div className="text-right">
            <span className="font-sans-nav text-[7px] tracking-[0.25em] uppercase text-muted-foreground/70 block mb-1">
              ID
            </span>
            <span
              className="font-sans-nav text-[11px] tracking-[0.15em]"
              style={{ color: accentColor }}
            >
              {memberId}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Back Face */}
      <motion.div
        initial={false}
        animate={{
          opacity: isFlipped ? 1 : 0,
          rotateY: isFlipped ? 0 : -180,
        }}
        transition={{ duration: 0.35, ease: "easeInOut" }}
        className="absolute w-[340px] h-[215px] md:w-[420px] md:h-[265px] flex flex-col p-8 md:p-10 pointer-events-none"
        style={{
          transformStyle: "preserve-3d",
          backfaceVisibility: "hidden",
          zIndex: isFlipped ? 10 : 0,
        }}
      >
        {/* Back Content */}
        <div className="flex justify-between items-start mb-6">
          <img
            src="/logo-card.svg"
            alt="GC Wines"
            className="h-6 md:h-7 w-auto"
          />
          <span
            className="font-sans-nav text-[7px] tracking-[0.2em] uppercase"
            style={{ color: accentColor }}
          >
            Private Society
          </span>
        </div>

        <div className="mb-4">
          <span className="font-sans-nav text-[7px] tracking-[0.2em] uppercase text-muted-foreground/70 block mb-2">
            Exclusive Benefits
          </span>
          <div
            className="w-12 h-[1px]"
            style={{ backgroundColor: accentColor, opacity: 0.5 }}
          />
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 flex-1">
          {[
            "Allocation Access",
            "Private Tastings",
            "Cellar Concierge",
            "Origin Programmes",
          ].map((benefit) => (
            <div key={benefit} className="flex items-center gap-2">
              <span
                className="w-1 h-1 rounded-full flex-shrink-0"
                style={{ backgroundColor: accentColor }}
              />
              <span className="text-[10px] md:text-xs text-muted-foreground tracking-wide">
                {benefit}
              </span>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-end mt-4 pt-3 border-t border-primary/10">
          <span className="font-sans-nav text-[6px] tracking-[0.15em] uppercase text-muted-foreground/50">
            Authenticated Member Card
          </span>
          <div
            className="w-6 h-[1px]"
            style={{ backgroundColor: accentColor, opacity: 0.4 }}
          />
        </div>
      </motion.div>

      {/* Interaction Hint - Luxury horizontal line style */}
      <motion.div
        className="absolute -bottom-4 left-0 right-0 flex flex-col items-center justify-center gap-2 pointer-events-none"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.5 }}
      >
        {/* Horizontal line with centered dot */}
        <div className="relative w-16 h-[1px]">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/50 to-transparent"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 1.4, duration: 0.6 }}
            style={{ transformOrigin: "center" }}
          />
          {/* Pulsing dot centered on line */}
          <motion.div
            className="absolute left-1/2 top-1/2 w-2 h-2 -ml-1 -mt-1 rounded-full bg-primary shadow-[0_0_10px_hsl(39,52%,56%,0.6)]"
            animate={{ scale: [1, 1.4, 1], opacity: [0.8, 0.4, 0.8] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1.8 }}
          />
        </div>
        {/* Text label - centered */}
        <motion.span
          className="font-sans-nav text-[10px] tracking-[0.3em] uppercase text-primary text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ delay: 1.6, duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          {t("ui.clickOrTapToFlip")}
        </motion.span>
      </motion.div>
    </div>
  );
};

export default CardOverlay;
