"use client";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { Suspense } from "react";
import Architecture from "./views/Architecture";
import SessionLifecycle from "./views/SessionLifecycle";
import PodLifecycle from "./views/PodLifecycle";

export default function Scene({ view }: { view: "architecture" | "session" | "pod" }) {
  return (
    <Canvas
      camera={{ position: [14, 10, 18], fov: 50 }}
      style={{ position: "fixed", inset: 0, background: "radial-gradient(ellipse at center, #0a1024 0%, #03040a 70%)" }}
    >
      <ambientLight intensity={0.45} />
      <directionalLight position={[10, 15, 8]} intensity={0.8} />
      <pointLight position={[-12, 8, -8]} intensity={0.6} color="#6ea0ff" />
      <pointLight position={[12, -4, 6]} intensity={0.4} color="#ff7d9a" />
      <Stars radius={120} depth={50} count={2500} factor={3} fade speed={0.4} />
      <Suspense fallback={null}>
        {view === "architecture" && <Architecture />}
        {view === "session" && <SessionLifecycle />}
        {view === "pod" && <PodLifecycle />}
      </Suspense>
      <OrbitControls enableDamping dampingFactor={0.08} minDistance={6} maxDistance={60} />
    </Canvas>
  );
}
