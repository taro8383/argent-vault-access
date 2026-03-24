import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

const WineBottleShowcase = () => {
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoRotateRef = useRef<number>();

  // Auto-rotate when not interacting
  useEffect(() => {
    if (!isDragging) {
      const animate = () => {
        setRotation((prev) => (prev + 0.2) % 360);
        autoRotateRef.current = requestAnimationFrame(animate);
      };
      autoRotateRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (autoRotateRef.current) {
        cancelAnimationFrame(autoRotateRef.current);
      }
    };
  }, [isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const delta = e.clientX - startX;
    setRotation((prev) => prev + delta * 0.5);
    setStartX(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const delta = e.touches[0].clientX - startX;
    setRotation((prev) => prev + delta * 0.5);
    setStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-[280px] h-[400px] cursor-grab active:cursor-grabbing select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Ambient glow behind bottle */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-40 h-64 bg-primary/10 rounded-full blur-3xl" />
      </div>

      {/* 3D Bottle Container */}
      <div
        className="relative w-full h-full"
        style={{
          perspective: "1000px",
        }}
      >
        <motion.div
          className="relative w-full h-full"
          style={{
            transformStyle: "preserve-3d",
            transform: `rotateY(${rotation}deg)`,
          }}
          transition={{ type: "spring", stiffness: 100, damping: 30 }}
        >
          {/* Bottle Body */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Main bottle shape */}
            <div
              className="relative"
              style={{
                width: "100px",
                height: "320px",
                transformStyle: "preserve-3d",
              }}
            >
              {/* Bottle Front Face */}
              <div
                className="absolute inset-0 rounded-lg overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 50%, #1a1a1a 100%)",
                  boxShadow: "inset 0 0 40px rgba(0,0,0,0.8), 0 10px 40px rgba(0,0,0,0.5)",
                  transform: "translateZ(25px)",
                }}
              >
                {/* Glass highlight */}
                <div className="absolute top-0 left-1/4 w-1/4 h-full bg-gradient-to-b from-white/5 via-white/10 to-transparent" />

                {/* Label */}
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-20 h-32 bg-[#f5f0e8] flex flex-col items-center justify-center px-2">
                  <span className="font-serif text-[8px] tracking-[0.3em] uppercase text-primary/80 mb-1">
                    GC
                  </span>
                  <div className="w-8 h-[1px] bg-primary/30 mb-2" />
                  <span className="font-serif text-[6px] tracking-[0.2em] uppercase text-foreground/60 text-center leading-tight">
                    Trade
                    <br />
                    Selection
                  </span>
                </div>

                {/* Vintage year */}
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2">
                  <span className="font-serif text-xs tracking-[0.2em] text-primary/40">
                    2022
                  </span>
                </div>
              </div>

              {/* Bottle Back Face */}
              <div
                className="absolute inset-0 rounded-lg"
                style={{
                  background: "linear-gradient(135deg, #0d0d0d 0%, #1a1a1a 50%, #0d0d0d 100%)",
                  transform: "translateZ(-25px) rotateY(180deg)",
                }}
              />

              {/* Bottle Left Face */}
              <div
                className="absolute left-0 top-0 bottom-0 w-[50px]"
                style={{
                  background: "linear-gradient(90deg, #0d0d0d, #1a1a1a)",
                  transform: "translateX(-25px) rotateY(-90deg)",
                  transformOrigin: "right center",
                }}
              />

              {/* Bottle Right Face */}
              <div
                className="absolute right-0 top-0 bottom-0 w-[50px]"
                style={{
                  background: "linear-gradient(90deg, #1a1a1a, #0d0d0d)",
                  transform: "translateX(-25px) rotateY(90deg)",
                  transformOrigin: "left center",
                }}
              />

              {/* Bottle Neck */}
              <div
                className="absolute -top-16 left-1/2 -translate-x-1/2"
                style={{
                  width: "32px",
                  height: "64px",
                  transformStyle: "preserve-3d",
                }}
              >
                {/* Neck faces */}
                <div
                  className="absolute inset-0 rounded-t-sm"
                  style={{
                    background: "linear-gradient(135deg, #1a1a1a, #0d0d0d)",
                    transform: "translateZ(16px)",
                  }}
                />
                <div
                  className="absolute inset-0 rounded-t-sm"
                  style={{
                    background: "linear-gradient(135deg, #0d0d0d, #1a1a1a)",
                    transform: "translateZ(-16px) rotateY(180deg)",
                  }}
                />

                {/* Foil capsule */}
                <div
                  className="absolute -top-8 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full"
                  style={{
                    background: "linear-gradient(135deg, hsl(39 52% 56%), hsl(39 52% 40%), hsl(39 52% 56%))",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.5)",
                    transform: "translateZ(0px)",
                  }}
                >
                  {/* Capsule shine */}
                  <div className="absolute top-1 left-1 w-3 h-3 bg-white/30 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Interaction hint */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <div className="flex gap-1">
          <span className="w-1 h-1 rounded-full bg-primary/40" />
          <span className="w-1 h-1 rounded-full bg-primary/60" />
          <span className="w-1 h-1 rounded-full bg-primary/40" />
        </div>
        <span className="font-sans-nav text-[9px] tracking-[0.2em] uppercase text-muted-foreground/50">
          Drag to rotate
        </span>
      </div>

      {/* Reflection on surface */}
      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-32 h-8 bg-gradient-to-t from-primary/5 to-transparent blur-xl rounded-full" />
    </div>
  );
};

export default WineBottleShowcase;
