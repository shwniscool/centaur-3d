"use client";
import { Html } from "@react-three/drei";
import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Mesh } from "three";

type Props = {
  position: [number, number, number];
  label: string;
  sub?: string;
  color: string;
  shape?: "box" | "sphere" | "cylinder" | "octahedron";
  size?: number;
};

export default function Node({ position, label, sub, color, shape = "box", size = 1 }: Props) {
  const ref = useRef<Mesh>(null!);
  const [hovered, setHovered] = useState(false);
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.rotation.y += dt * (hovered ? 0.8 : 0.18);
    const target = hovered ? 1.15 : 1.0;
    ref.current.scale.x += (target - ref.current.scale.x) * 0.15;
    ref.current.scale.y = ref.current.scale.x;
    ref.current.scale.z = ref.current.scale.x;
  });
  const geo =
    shape === "sphere" ? <sphereGeometry args={[0.55 * size, 32, 32]} /> :
    shape === "cylinder" ? <cylinderGeometry args={[0.5 * size, 0.5 * size, 0.85 * size, 32]} /> :
    shape === "octahedron" ? <octahedronGeometry args={[0.7 * size, 0]} /> :
    <boxGeometry args={[1.1 * size, 0.85 * size, 1.1 * size]} />;
  return (
    <group position={position}>
      <mesh
        ref={ref}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = "auto"; }}
        castShadow
      >
        {geo}
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 0.6 : 0.25}
          roughness={0.35}
          metalness={0.4}
        />
      </mesh>
      <Html
        center
        position={[0, -1.0 * size, 0]}
        distanceFactor={10}
        style={{
          color: "#e6e9f0",
          fontSize: "12px",
          fontFamily: "-apple-system, Inter, sans-serif",
          textAlign: "center",
          pointerEvents: "none",
          textShadow: "0 1px 4px rgba(0,0,0,0.7)",
          whiteSpace: "nowrap",
        }}
      >
        <div style={{ fontWeight: 600 }}>{label}</div>
        {sub && <div style={{ fontSize: "10px", opacity: 0.7 }}>{sub}</div>}
      </Html>
    </group>
  );
}
