"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import SidePanel from "../components/SidePanel";

const Scene = dynamic(() => import("../components/Scene"), { ssr: false });

type View = "architecture" | "session" | "pod";

const VIEWS: { id: View; label: string }[] = [
  { id: "architecture", label: "Architecture" },
  { id: "session", label: "Session lifecycle" },
  { id: "pod", label: "Pod lifecycle" },
];

const DESCRIPTIONS: Record<View, string> = {
  architecture: "Slack/web messages hit the Centaur API, which persists state in Postgres, schedules sandbox pods on K8s, and proxies tool calls. Pods talk back through the call helper; results flow out via the final-delivery outbox.",
  session: "An inbound message is persisted, a session is found or spawned, the pod fetches context, loops over tool calls, then writes a final-delivery row that the outbox renders back to the user.",
  pod: "Pods move through Pending → Idle → Active → Recycling. Conversation context is rebuilt from chat_messages + attachments when a recycled pod is reactivated for the same thread_key.",
};

export default function Page() {
  const [view, setView] = useState<View>("architecture");
  return (
    <>
      <div className="ui-overlay">
        <h1>Centaur · 3D architecture</h1>
        <p>{DESCRIPTIONS[view]}</p>
        <div>
          {VIEWS.map((v) => (
            <span
              key={v.id}
              className={`pill ${view === v.id ? "active" : ""}`}
              onClick={() => setView(v.id)}
            >
              {v.label}
            </span>
          ))}
        </div>
      </div>
      <div className="hint">drag to orbit · scroll to zoom · click a node for details</div>
      <SidePanel />
      <div className="legend">
        <div className="row"><span className="dot" style={{ background: "#6ea0ff" }} /> API / Gateway</div>
        <div className="row"><span className="dot" style={{ background: "#b08aff" }} /> Postgres</div>
        <div className="row"><span className="dot" style={{ background: "#7dd685" }} /> K8s pods</div>
        <div className="row"><span className="dot" style={{ background: "#ffb86b" }} /> Tools</div>
        <div className="row"><span className="dot" style={{ background: "#ff7d9a" }} /> Edge / Users</div>
      </div>
      <div className="credit">built by <a href="https://github.com/shwniscool/centaur-3d" target="_blank" rel="noreferrer">@centaur</a></div>
      <Scene view={view} />
    </>
  );
}
