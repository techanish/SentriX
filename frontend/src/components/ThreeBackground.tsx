"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";

function RotatingGlobe() {
  const globeRef = useRef<any>();
  useFrame((_, delta) => {
    if (globeRef.current) {
      globeRef.current.rotation.y += delta * 0.1;
      globeRef.current.rotation.x += delta * 0.05;
    }
  });
  return (
    <group ref={globeRef} position={[0, 0, 0]}>
      <mesh>
        <sphereGeometry args={[2.5, 16, 16]} />
        <meshBasicMaterial color="#000000" wireframe={true} transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

export function ThreeBackground() {
  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none opacity-20 dark:opacity-40 dark:invert flex items-center justify-center overflow-hidden">
      <Canvas camera={{ position: [0, 0, 6], fov: 60 }}>
        <fog attach="fog" args={["#fafafa", 2, 12]} />
        <RotatingGlobe />
      </Canvas>
    </div>
  );
}
