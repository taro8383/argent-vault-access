import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { gsap } from "gsap";

interface MembershipCardProps {
  onFlip?: (flipped: boolean) => void;
}

const MembershipCard = ({ onFlip }: MembershipCardProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [hovered, setHovered] = useState(false);

  // Card dimensions (credit card ratio 85.6mm x 53.98mm)
  const cardWidth = 4.5;
  const cardHeight = 2.8;
  const cardThickness = 0.05;

  // Floating animation
  useFrame((state) => {
    if (groupRef.current && !hovered) {
      const time = state.clock.getElapsedTime();
      groupRef.current.position.y = Math.sin(time * 0.6) * 0.05;
    }
  });

  // Mouse move handler for parallax tilt
  const handlePointerMove = (e: THREE.Event<PointerEvent>) => {
    if (!groupRef.current || isFlipped) return;

    const { x, y } = e.pointer;
    const targetRotationX = y * 0.2;
    const targetRotationY = x * 0.2;

    gsap.to(groupRef.current.rotation, {
      x: targetRotationX,
      y: targetRotationY,
      duration: 0.3,
      ease: "power2.out",
    });
  };

  const handlePointerLeave = () => {
    setHovered(false);
    if (!groupRef.current) return;

    if (!isFlipped) {
      gsap.to(groupRef.current.rotation, {
        x: 0,
        y: 0,
        duration: 0.5,
        ease: "elastic.out(1, 0.5)",
      });
    }
  };

  const handlePointerEnter = () => {
    setHovered(true);
  };

  // Flip card on click
  const handleClick = () => {
    if (!groupRef.current) return;

    const newFlipped = !isFlipped;
    setIsFlipped(newFlipped);
    onFlip?.(newFlipped);

    gsap.to(groupRef.current.rotation, {
      y: newFlipped ? Math.PI : 0,
      x: 0,
      duration: 0.7,
      ease: "power3.inOut",
    });
  };

  // Brushed black metal material
  const metalMaterial = new THREE.MeshStandardMaterial({
    color: "#0d0d0d",
    metalness: 0.9,
    roughness: 0.4,
    envMapIntensity: 1,
  });

  // Gold accent material
  const goldMaterial = new THREE.MeshStandardMaterial({
    color: "#c9a050",
    metalness: 1,
    roughness: 0.2,
    emissive: "#c9a050",
    emissiveIntensity: 0.05,
  });

  return (
    <group
      ref={groupRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerEnter={handlePointerEnter}
      onClick={handleClick}
    >
      {/* Main Card Body - Clean black metal */}
      <mesh material={metalMaterial} castShadow receiveShadow>
        <boxGeometry args={[cardWidth, cardHeight, cardThickness]} />
      </mesh>
    </group>
  );
};

export default MembershipCard;
