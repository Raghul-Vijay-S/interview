import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Points } from "three";
import * as THREE from "three";

function NeuralPoints() {
  const ref = useRef<Points>(null);
  const positions = useMemo(() => {
    const values = new Float32Array(900);
    for (let index = 0; index < values.length; index += 3) {
      values[index] = (Math.random() - 0.5) * 7;
      values[index + 1] = (Math.random() - 0.5) * 4;
      values[index + 2] = (Math.random() - 0.5) * 5;
    }
    return values;
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.elapsedTime * 0.08;
    ref.current.rotation.x = Math.sin(clock.elapsedTime * 0.4) * 0.08;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.035} color="#67e8f9" transparent opacity={0.85} blending={THREE.AdditiveBlending} />
    </points>
  );
}

export function NeuralScene() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 opacity-70">
      <Canvas camera={{ position: [0, 0, 5], fov: 55 }}>
        <ambientLight intensity={0.7} />
        <NeuralPoints />
      </Canvas>
    </div>
  );
}
