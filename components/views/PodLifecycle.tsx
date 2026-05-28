"use client";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import Node from "../Node";
import Edge from "../Edge";

const RADIUS = 6;
const STATES: Array<{ angle: number; label: string; sub?: string; color: string }> = [
  { angle: 0,            label: "Pending",     sub: "spawn enqueued", color: "#9aa6c0" },
  { angle: Math.PI / 4,  label: "Scheduling",  sub: "node picked",    color: "#9aa6c0" },
  { angle: Math.PI / 2,  label: "Starting",    sub: "overlay + secrets", color: "#6ea0ff" },
  { angle: 3*Math.PI/4,  label: "Registering", sub: "/agent/runtime", color: "#6ea0ff" },
  { angle: Math.PI,      label: "Idle",        sub: "thread_key bound", color: "#7dd685" },
  { angle: 5*Math.PI/4,  label: "Active",      sub: "message delivered", color: "#7dd685" },
  { angle: 3*Math.PI/2,  label: "Tool calls",  sub: "via API",        color: "#ffb86b" },
  { angle: 7*Math.PI/4,  label: "Delivering",  sub: "writes outbox",  color: "#b08aff" },
];

function fromAngle(a: number): [number, number, number] {
  return [Math.cos(a) * RADIUS, Math.sin(a) * 2.2, Math.sin(a) * RADIUS];
}

export default function PodLifecycle() {
  const groupRef = useRef<THREE.Group>(null!);
  useFrame((_, dt) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += dt * 0.08;
  });
  return (
    <group ref={groupRef}>
      {STATES.map((s, i) => (
        <Node
          key={i}
          position={fromAngle(s.angle)}
          label={s.label}
          sub={s.sub}
          color={s.color}
          shape={i === 4 ? "octahedron" : "box"}
          size={0.95}
        />
      ))}
      {STATES.map((s, i) => {
        const next = STATES[(i + 1) % STATES.length];
        return <Edge key={i} from={fromAngle(s.angle)} to={fromAngle(next.angle)} color={s.color} animated />;
      })}
      {/* Recycling center */}
      <Node position={[0, -2.5, 0]} label="Recycling" sub="drain + detach" color="#ff7d9a" shape="cylinder" />
      {STATES.map((s, i) => (
        <Edge key={`r${i}`} from={fromAngle(s.angle)} to={[0, -2.5, 0]} color="#ff7d9a" dashed animated={false} />
      ))}
    </group>
  );
}
