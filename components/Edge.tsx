"use client";
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

type Props = {
  from: [number, number, number];
  to: [number, number, number];
  color?: string;
  animated?: boolean;
  dashed?: boolean;
};

export default function Edge({ from, to, color = "#6b758f", animated = true, dashed = false }: Props) {
  const lineRef = useRef<THREE.Line>(null!);
  const pulseRef = useRef<THREE.Mesh>(null!);
  const start = useMemo(() => new THREE.Vector3(...from), [from]);
  const end = useMemo(() => new THREE.Vector3(...to), [to]);
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry().setFromPoints([start, end]);
    return g;
  }, [start, end]);
  const material = useMemo(() => {
    if (dashed) {
      const m = new THREE.LineDashedMaterial({ color, dashSize: 0.25, gapSize: 0.18, transparent: true, opacity: 0.7 });
      return m;
    }
    return new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.55 });
  }, [color, dashed]);
  useFrame(({ clock }) => {
    if (!animated || !pulseRef.current) return;
    const t = (clock.getElapsedTime() * 0.35) % 1;
    pulseRef.current.position.lerpVectors(start, end, t);
  });
  return (
    <group>
      {/* @ts-ignore */}
      <line ref={lineRef} geometry={geometry} material={material} onUpdate={(self: any) => self.computeLineDistances?.()} />
      {animated && (
        <mesh ref={pulseRef}>
          <sphereGeometry args={[0.08, 12, 12]} />
          <meshBasicMaterial color={color} />
        </mesh>
      )}
    </group>
  );
}
