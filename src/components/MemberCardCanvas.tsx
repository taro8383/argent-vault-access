import { Canvas } from "@react-three/fiber";
import { Suspense, useState } from "react";
import { Environment, PerspectiveCamera } from "@react-three/drei";
import MembershipCard from "./MembershipCard";
import CardOverlay from "./CardOverlay";

interface MemberCardCanvasProps {
  memberName?: string;
  memberId?: string;
  tier?: "founding" | "private" | "collector";
}

const MemberCardCanvas = ({
  memberName = "Alexandra Chen",
  memberId = "GC-2026-018",
  tier = "collector",
}: MemberCardCanvasProps) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div className="relative w-full h-[420px] md:h-[540px] flex items-center justify-center">
      {/* 3D Canvas */}
      <Canvas
        className="absolute inset-0 cursor-pointer"
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        dpr={[1, 2]}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 7]} fov={40} />

        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} color="#ffffff" />
        <directionalLight position={[-5, -5, 2]} intensity={0.6} color="#c9a050" />
        <pointLight position={[0, 0, 5]} intensity={0.5} color="#ffffff" />

        {/* Environment for reflections */}
        <Environment preset="city" background={false} blur={0.3} />

        <Suspense fallback={null}>
          <MembershipCard onFlip={setIsFlipped} />
        </Suspense>
      </Canvas>

      {/* HTML Overlay for crisp typography */}
      <CardOverlay
        memberName={memberName}
        memberId={memberId}
        tier={tier}
        isFlipped={isFlipped}
        onFlip={setIsFlipped}
      />
    </div>
  );
};

export default MemberCardCanvas;
