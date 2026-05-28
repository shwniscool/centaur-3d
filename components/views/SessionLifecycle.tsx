"use client";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import Node from "../Node";
import Edge from "../Edge";

const STEPS: Array<{ pos: [number, number, number]; label: string; sub: string; color: string }> = [
  { pos: [-9, 3, 0], label: "1. user message", sub: "Slack inbound", color: "#ff7d9a" },
  { pos: [-5, 2, 0], label: "2. gateway", sub: "persist + auth", color: "#6ea0ff" },
  { pos: [-2, 1, 0], label: "3. DB write", sub: "chat_messages", color: "#b08aff" },
  { pos: [1, 0, 0], label: "4. scheduler", sub: "ensure session", color: "#7dd685" },
  { pos: [4, -1, 0], label: "5. pod activates", sub: "overlay mount", color: "#7dd685" },
  { pos: [7, -1, 2], label: "6. fetch context", sub: "history + attachments", color: "#b08aff" },
  { pos: [8, 1, -2], label: "7. tool loop", sub: "call <tool> <method>", color: "#ffb86b" },
  { pos: [5, 3, -2], label: "8. write outbox", sub: "final_delivery_outbox", color: "#6ea0ff" },
  { pos: [-2, 4, 0], label: "9. render reply", sub: "Slack out", color: "#ff7d9a" },
];

export default function SessionLifecycle() {
  const groupRef = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.12) * 0.15;
  });
  return (
    <group ref={groupRef}>
      {STEPS.map((s, i) => (
        <Node key={i} position={s.pos} label={s.label} sub={s.sub} color={s.color} shape={i === 0 || i === 8 ? "sphere" : "box"} size={0.95} />
      ))}
      {STEPS.slice(0, -1).map((s, i) => (
        <Edge key={i} from={s.pos} to={STEPS[i + 1].pos} color={s.color} animated />
      ))}
      {/* Tool loop circular indicator */}
      <Edge from={[8, 1, -2]} to={[7, -1, 2]} color="#ffb86b" dashed />
    </group>
  );
}
