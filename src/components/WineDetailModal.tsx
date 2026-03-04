import { motion, AnimatePresence } from "framer-motion";
import { X, Star, Mountain, User, Target } from "lucide-react";
import type { WineItem } from "./WineVault";

interface Props {
  wine: WineItem | null;
  onClose: () => void;
}

const WineDetailModal = ({ wine, onClose }: Props) => {
  if (!wine) return null;

  return (
    <AnimatePresence>
      {wine && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-xl bg-card border-l border-border overflow-y-auto"
          >
            <div className="p-8 md:p-12">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-6 right-6 text-muted-foreground hover:text-primary transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>

              {/* Category */}
              <p className="font-sans-nav text-[10px] tracking-[0.4em] uppercase text-primary mb-2">
                {wine.category}
              </p>

              {/* Name */}
              <h2 className="font-serif text-4xl md:text-5xl mb-2">{wine.name}</h2>
              <p className="text-sm text-muted-foreground tracking-wider mb-8">{wine.vintage} Vintage</p>

              <div className="gold-line w-full mb-8" />

              {/* Bottle + Score */}
              <div className="flex items-center gap-8 mb-10">
                {/* Bottle */}
                {wine.image_url ? (
                  <img src={wine.image_url} alt={wine.name} className="wine-float h-56 object-contain flex-shrink-0" />
                ) : (
                  <div className="wine-float flex flex-col items-center flex-shrink-0">
                    <div className={`w-4 h-12 ${wine.color} rounded-t-sm`} />
                    <div className="w-8 h-5 border border-primary/30 rounded-sm" />
                    <div className={`w-20 h-56 ${wine.color} rounded-b-lg relative`}>
                      <div className="absolute inset-x-3 top-10 bottom-10 border border-primary/20 rounded-sm flex flex-col items-center justify-center">
                        <span className="text-primary text-[8px] tracking-[0.2em] uppercase font-sans-nav">GC</span>
                        <span className="text-foreground/70 text-[7px] tracking-wider font-sans mt-1">{wine.vintage}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Details */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Star size={16} className="text-primary" />
                    <span className="font-serif text-4xl text-primary">{wine.score}</span>
                    <span className="text-sm text-muted-foreground">points</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mountain size={14} />
                    <span className="text-sm tracking-wider">{wine.region}</span>
                  </div>
                  <p className="text-xs text-muted-foreground tracking-wider">{wine.altitude} Altitude</p>
                </div>
              </div>

              {/* Terroir Snapshot */}
              <div className="bg-secondary rounded-sm p-6 mb-8">
                <h3 className="font-serif text-lg text-primary mb-3">Terroir Snapshot</h3>
                <p className="text-sm text-secondary-foreground leading-relaxed">{wine.description}</p>
              </div>

              {/* Market Rationale */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <Target size={14} className="text-primary" />
                  <h3 className="font-serif text-lg text-primary">Market Rationale</h3>
                </div>
                <div className="text-sm text-muted-foreground leading-relaxed space-y-6">
                  {(() => {
                    // Parse the structured rationale format
                    const lines = wine.rationale.split('\n');
                    const sections = [];
                    let currentSection = null;
                    let currentSubsection = null;

                    for (const line of lines) {
                      const trimmed = line.trim();
                      const indent = line.search(/\S/); // Count leading spaces

                      if (!trimmed) continue; // Skip empty lines

                      // Main section heading (no indent, no colon at end typically)
                      if (indent <= 4 && !trimmed.startsWith('•') && !trimmed.startsWith('-')) {
                        // Check if it's a main heading vs a bullet
                        if (!trimmed.includes(':') || indent === 0) {
                          if (currentSection) sections.push(currentSection);
                          currentSection = {
                            heading: trimmed,
                            subsections: []
                          };
                          currentSubsection = null;
                        } else {
                          // Subheading with colon
                          currentSubsection = {
                            heading: trimmed.replace(/:$/, ''),
                            bullets: []
                          };
                          if (currentSection) {
                            currentSection.subsections.push(currentSubsection);
                          }
                        }
                      }
                      // Bullet points (indented)
                      else if (indent > 4 || trimmed.startsWith('•') || trimmed.startsWith('-')) {
                        const bulletText = trimmed.replace(/^[•\-\s]+/, '');
                        if (currentSubsection) {
                          currentSubsection.bullets.push(bulletText);
                        } else if (currentSection) {
                          // Direct bullets under section
                          if (!currentSection.subsections.length) {
                            currentSection.subsections.push({
                              heading: '',
                              bullets: [bulletText]
                            });
                          } else {
                            currentSection.subsections[0].bullets.push(bulletText);
                          }
                        }
                      }
                      // Regular content
                      else {
                        if (currentSubsection) {
                          currentSubsection.bullets.push(trimmed);
                        }
                      }
                    }

                    if (currentSection) sections.push(currentSection);

                    return sections.map((section, i) => (
                      <div key={i} className="space-y-4">
                        {/* Main Section Heading */}
                        <h4 className="font-sans-nav text-[10px] tracking-[0.25em] uppercase text-primary font-medium">
                          {section.heading}
                        </h4>

                        {/* Subsections */}
                        {section.subsections.map((sub, j) => (
                          <div key={j} className="space-y-2 pl-1">
                            {sub.heading && (
                              <h5 className="font-sans text-xs text-primary/70 font-medium">
                                {sub.heading}
                              </h5>
                            )}
                            {sub.bullets.length > 0 && (
                              <ul className="space-y-2">
                                {sub.bullets.map((bullet, k) => (
                                  <li key={k} className="flex items-start gap-3 text-muted-foreground leading-relaxed">
                                    <span className="w-1 h-1 rounded-full bg-primary/50 mt-2 flex-shrink-0" />
                                    <span>{bullet}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Winemaker */}
              <div className="border-t border-border pt-8">
                <div className="flex items-center gap-2 mb-3">
                  <User size={14} className="text-primary" />
                  <h3 className="font-serif text-lg text-primary">The Winemaker</h3>
                </div>
                <p className="text-sm text-muted-foreground tracking-wider">{wine.winemaker}</p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default WineDetailModal;
