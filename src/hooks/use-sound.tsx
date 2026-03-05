import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";

interface SoundContextType {
  isMuted: boolean;
  toggleMute: () => void;
  volume: number;
  setVolume: (volume: number) => void;
  playHover: () => void;
  playAmbient: () => void;
  pauseAmbient: () => void;
  isAmbientPlaying: boolean;
}

const SoundContext = createContext<SoundContextType | null>(null);

export const SoundProvider = ({ children }: { children: React.ReactNode }) => {
  const [isMuted, setIsMuted] = useState(true); // Start muted (browser policy)
  const [volume, setVolumeState] = useState(80); // Default volume 80%
  const [isAmbientPlaying, setIsAmbientPlaying] = useState(false);
  const hoverAudioRef = useRef<HTMLAudioElement | null>(null);
  const ambientAudioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio on first user interaction
  useEffect(() => {
    const handleFirstInteraction = () => {
      console.log('Initializing audio...');
      if (!hoverAudioRef.current) {
        const baseUrl = import.meta.env.BASE_URL || "/";
        hoverAudioRef.current = new Audio(`${baseUrl}assets/pop.mp3`);
        hoverAudioRef.current.volume = volume / 100;
        console.log('Hover audio loaded, volume:', volume + '%');
      }
      if (!ambientAudioRef.current) {
        const baseUrl = import.meta.env.BASE_URL || "/";
        ambientAudioRef.current = new Audio(`${baseUrl}assets/cellar.mp3`);
        ambientAudioRef.current.loop = true;
        ambientAudioRef.current.volume = volume / 100;
        console.log('Ambient audio loaded, volume:', volume + '%');
      }
      // Auto-enable after first interaction
      setIsMuted(false);
      console.log('Audio enabled - click "Cellar Ambiance" to play');
    };

    window.addEventListener("click", handleFirstInteraction, { once: true });
    return () => window.removeEventListener("click", handleFirstInteraction);
  }, [volume]);

  // Update volume when changed
  const setVolume = useCallback((newVolume: number) => {
    setVolumeState(newVolume);
    if (hoverAudioRef.current) {
      hoverAudioRef.current.volume = newVolume / 100;
    }
    if (ambientAudioRef.current) {
      ambientAudioRef.current.volume = newVolume / 100;
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const newMuted = !prev;
      if (ambientAudioRef.current) {
        ambientAudioRef.current.muted = newMuted;
      }
      return newMuted;
    });
  }, []);

  const playHover = useCallback(() => {
    if (isMuted || !hoverAudioRef.current) return;
    hoverAudioRef.current.currentTime = 0;
    hoverAudioRef.current.play().catch(() => {
      // Ignore autoplay errors
    });
  }, [isMuted]);

  const playAmbient = useCallback(() => {
    if (!ambientAudioRef.current) return;
    ambientAudioRef.current.muted = isMuted;
    ambientAudioRef.current.play().catch(() => {
      // Ignore autoplay errors
    });
    setIsAmbientPlaying(true);
  }, [isMuted]);

  const pauseAmbient = useCallback(() => {
    if (!ambientAudioRef.current) return;
    ambientAudioRef.current.pause();
    setIsAmbientPlaying(false);
  }, []);

  return (
    <SoundContext.Provider
      value={{
        isMuted,
        toggleMute,
        volume,
        setVolume,
        playHover,
        playAmbient,
        pauseAmbient,
        isAmbientPlaying,
      }}
    >
      {children}
    </SoundContext.Provider>
  );
};

export const useSound = () => {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error("useSound must be used within SoundProvider");
  }
  return context;
};

// Hook for hover sound on any element
export const useHoverSound = () => {
  const { playHover } = useSound();
  return {
    onMouseEnter: playHover,
  };
};
