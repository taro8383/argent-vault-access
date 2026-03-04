import { useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSound } from "@/hooks/use-sound";

const SoundToggle = () => {
  const { isMuted, toggleMute, volume, setVolume, isAmbientPlaying, playAmbient, pauseAmbient } = useSound();
  const [showSlider, setShowSlider] = useState(false);

  return (
    <div className="flex items-center gap-3">
      {/* Ambient toggle */}
      <motion.button
        onClick={() => {
          if (isAmbientPlaying) {
            pauseAmbient();
          } else {
            playAmbient();
          }
        }}
        className="font-sans-nav text-[10px] tracking-[0.15em] uppercase text-muted-foreground hover:text-primary transition-colors duration-300"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isAmbientPlaying ? "Pause Ambiance" : "Cellar Ambiance"}
      </motion.button>

      {/* Volume Slider - appears on hover */}
      <div
        className="relative flex items-center gap-2"
        onMouseEnter={() => setShowSlider(true)}
        onMouseLeave={() => setShowSlider(false)}
      >
        <AnimatePresence>
          {showSlider && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 100, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden flex items-center gap-2"
            >
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  const newVol = parseInt(e.target.value);
                  setVolume(newVol);
                  if (newVol > 0 && isMuted) {
                    toggleMute();
                  }
                }}
                className="w-16 h-1 bg-secondary rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, hsl(39, 52%, 56%) ${isMuted ? 0 : volume}%, hsl(0, 0%, 20%) ${isMuted ? 0 : volume}%)`
                }}
              />
              <span className="text-[10px] text-muted-foreground w-6">
                {isMuted ? 0 : volume}%
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mute toggle */}
        <motion.button
          onClick={toggleMute}
          className="p-2 rounded-full border border-border text-muted-foreground hover:text-primary hover:border-primary transition-all duration-300"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          aria-label={isMuted ? "Unmute sounds" : "Mute sounds"}
        >
          {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </motion.button>
      </div>
    </div>
  );
};

export default SoundToggle;
