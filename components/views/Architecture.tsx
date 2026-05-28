"use client";
import Node from "../Node";
import Edge from "../Edge";

const COLORS = {
  edge: "#ff7d9a",
  api: "#6ea0ff",
  pg: "#b08aff",
  pod: "#7dd685",
  tool: "#ffb86b",
  obs: "#7be9ff",
};

export default function Architecture() {
  return (
    <group>
      {/* Edge / users (front) */}
      <Node position={[-9, 0, 6]} label="Slack" sub="user inbound" color={COLORS.edge} shape="sphere" />
      <Node position={[-9, 2.2, 4]} label="Web" sub="dev console" color={COLORS.edge} shape="sphere" size={0.85} />
      <Node position={[-9, -2.2, 4]} label="Other" sub="integrations" color={COLORS.edge} shape="sphere" size={0.85} />

      {/* Centaur API hub (center) */}
      <Node position={[-3, 1.5, 0]} label="HTTP gateway" sub="auth + routing" color={COLORS.api} />
      <Node position={[-3, -1.5, 0]} label="Router" sub="thread_key → session" color={COLORS.api} />
      <Node position={[0, 3, 0]} label="Workflow engine" sub="durable, hot-reload" color={COLORS.api} shape="octahedron" />
      <Node position={[0, -3, 0]} label="Final outbox" sub="delivery" color={COLORS.api} shape="cylinder" />

      {/* Postgres (back-left) */}
      <Node position={[-3, 1.5, -6]} label="chat_messages" color={COLORS.pg} shape="cylinder" size={0.9} />
      <Node position={[-3, -0.2, -6]} label="attachments" color={COLORS.pg} shape="cylinder" size={0.9} />
      <Node position={[-3, -1.9, -6]} label="sandbox_sessions" color={COLORS.pg} shape="cylinder" size={0.9} />
      <Node position={[-1, -3.6, -6]} label="agent_execution_*" color={COLORS.pg} shape="cylinder" size={0.9} />

      {/* K8s pods (right) */}
      <Node position={[5, 2.5, 0]} label="Pod A" sub="overlay mount" color={COLORS.pod} />
      <Node position={[6, 0, 0]} label="Pod B" color={COLORS.pod} />
      <Node position={[5, -2.5, 0]} label="Pod C" color={COLORS.pod} />
      <Node position={[3, 4, -2]} label="Scheduler" sub="K8s sandbox" color={COLORS.pod} shape="octahedron" />

      {/* Tool layer (far right) */}
      <Node position={[10, 2.5, 2]} label="websearch" color={COLORS.tool} shape="sphere" size={0.8} />
      <Node position={[11, 0.5, 2]} label="slack" color={COLORS.tool} shape="sphere" size={0.8} />
      <Node position={[11, -1.5, 2]} label="linear / notion" color={COLORS.tool} shape="sphere" size={0.8} />
      <Node position={[10, -3.5, 2]} label="vlogs / vmetrics" color={COLORS.tool} shape="sphere" size={0.8} />

      {/* Observability (back-right) */}
      <Node position={[9, 3, -5]} label="VictoriaLogs" color={COLORS.obs} shape="octahedron" size={0.85} />
      <Node position={[9, 0.5, -5]} label="VictoriaMetrics" color={COLORS.obs} shape="octahedron" size={0.85} />

      {/* Edges: Edge -> Gateway */}
      <Edge from={[-9, 0, 6]} to={[-3, 1.5, 0]} color={COLORS.edge} />
      <Edge from={[-9, 2.2, 4]} to={[-3, 1.5, 0]} color={COLORS.edge} />
      <Edge from={[-9, -2.2, 4]} to={[-3, 1.5, 0]} color={COLORS.edge} />

      {/* Gateway -> Router */}
      <Edge from={[-3, 1.5, 0]} to={[-3, -1.5, 0]} color={COLORS.api} />

      {/* Router -> Postgres */}
      <Edge from={[-3, -1.5, 0]} to={[-3, 1.5, -6]} color={COLORS.pg} />
      <Edge from={[-3, -1.5, 0]} to={[-3, -0.2, -6]} color={COLORS.pg} />
      <Edge from={[-3, -1.5, 0]} to={[-3, -1.9, -6]} color={COLORS.pg} />
      <Edge from={[-3, -1.5, 0]} to={[-1, -3.6, -6]} color={COLORS.pg} />

      {/* Router -> Scheduler -> Pods */}
      <Edge from={[-3, -1.5, 0]} to={[3, 4, -2]} color={COLORS.pod} />
      <Edge from={[3, 4, -2]} to={[5, 2.5, 0]} color={COLORS.pod} />
      <Edge from={[3, 4, -2]} to={[6, 0, 0]} color={COLORS.pod} />
      <Edge from={[3, 4, -2]} to={[5, -2.5, 0]} color={COLORS.pod} />

      {/* Pods <-> tools via gateway */}
      <Edge from={[5, 2.5, 0]} to={[10, 2.5, 2]} color={COLORS.tool} />
      <Edge from={[6, 0, 0]} to={[11, 0.5, 2]} color={COLORS.tool} />
      <Edge from={[6, 0, 0]} to={[11, -1.5, 2]} color={COLORS.tool} />
      <Edge from={[5, -2.5, 0]} to={[10, -3.5, 2]} color={COLORS.tool} />

      {/* Pods -> outbox -> edge */}
      <Edge from={[5, 2.5, 0]} to={[0, -3, 0]} color={COLORS.api} />
      <Edge from={[6, 0, 0]} to={[0, -3, 0]} color={COLORS.api} />
      <Edge from={[5, -2.5, 0]} to={[0, -3, 0]} color={COLORS.api} />
      <Edge from={[0, -3, 0]} to={[-9, 0, 6]} color={COLORS.edge} />

      {/* Workflow engine -> router */}
      <Edge from={[0, 3, 0]} to={[-3, 1.5, 0]} color={COLORS.api} dashed />

      {/* Observability dashed */}
      <Edge from={[5, 2.5, 0]} to={[9, 3, -5]} color={COLORS.obs} dashed />
      <Edge from={[6, 0, 0]} to={[9, 3, -5]} color={COLORS.obs} dashed />
      <Edge from={[5, -2.5, 0]} to={[9, 3, -5]} color={COLORS.obs} dashed />
      <Edge from={[-3, 1.5, 0]} to={[9, 0.5, -5]} color={COLORS.obs} dashed />
    </group>
  );
}
