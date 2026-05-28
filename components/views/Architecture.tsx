"use client";
import { useMemo } from "react";
import Node from "../Node";
import Edge from "../Edge";
import DeploymentShell from "../DeploymentShell";
import { ARCHITECTURE } from "../../data/architecture";
import { SelectionPayload } from "../../lib/selection";

// Color by module kind (internal) / category (external)
const COLORS: Record<string, string> = {
  "frontend-page": "#6ea0ff",
  "frontend-shell": "#6ea0ff",
  "frontend-view": "#7dd685",
  "frontend-primitive": "#ffb86b",
  "frontend-style": "#b08aff",
  // external
  framework: "#ff7d9a",
  "ui-runtime": "#ff7d9a",
  graphics: "#7be9ff",
  "hosting-cdn": "#9aa6c0",
  "ci-runtime": "#9aa6c0",
  "dev-tooling": "#6b748a",
};

const SHAPES: Record<string, "box" | "sphere" | "cylinder" | "octahedron"> = {
  "frontend-page": "octahedron",
  "frontend-shell": "box",
  "frontend-view": "box",
  "frontend-primitive": "cylinder",
  "frontend-style": "cylinder",
  framework: "sphere",
  "ui-runtime": "sphere",
  graphics: "sphere",
  "hosting-cdn": "octahedron",
  "ci-runtime": "octahedron",
  "dev-tooling": "sphere",
};

// Hand-picked depth tiers for internal modules. Higher Y = "more upstream" in the import graph.
const INTERNAL_TIER: Record<string, number> = {
  "app/layout": 4,
  "app/page": 4,
  "components/Scene": 2.5,
  "components/views/Architecture": 1,
  "components/views/SessionLifecycle": 1,
  "components/views/PodLifecycle": 1,
  "components/Node": -1,
  "components/Edge": -1,
  "app/globals": 2.5,
};

// X positions for internal modules so they don't pile up
const INTERNAL_X: Record<string, number> = {
  "app/layout": -3,
  "app/page": 1,
  "components/Scene": -1,
  "components/views/Architecture": -3,
  "components/views/SessionLifecycle": -1,
  "components/views/PodLifecycle": 1,
  "components/Node": -2,
  "components/Edge": 0,
  "app/globals": -4,
};

// External rim: laid out on a wider ring around z=back
const EXTERNAL_RING_RADIUS = 8.5;
function externalPos(idx: number, total: number): [number, number, number] {
  const angle = (idx / total) * Math.PI * 2 - Math.PI / 2;
  const x = Math.cos(angle) * EXTERNAL_RING_RADIUS;
  const z = -Math.sin(angle) * EXTERNAL_RING_RADIUS * 0.5 - 3;
  // y oscillates so the ring tilts visually
  const y = Math.cos(angle * 2) * 1.5 + 1.2;
  return [x, y, z];
}

export default function Architecture() {
  const internal = ARCHITECTURE.internal_modules;
  const external = ARCHITECTURE.external_modules;

  const internalPositions = useMemo(() => {
    const m: Record<string, [number, number, number]> = {};
    for (const mod of internal) {
      const x = INTERNAL_X[mod.id] ?? 0;
      const y = INTERNAL_TIER[mod.id] ?? 0;
      m[mod.id] = [x, y, 0];
    }
    return m;
  }, [internal]);

  const externalPositions = useMemo(() => {
    const m: Record<string, [number, number, number]> = {};
    external.forEach((em, i) => {
      m[em.id] = externalPos(i, external.length);
    });
    return m;
  }, [external]);

  return (
    <group>
      {/* Deployment shell (GitHub Pages topology) wraps the internal modules */}
      <DeploymentShell />

      {/* Internal modules */}
      {internal.map((mod) => {
        const data: SelectionPayload = {
          id: mod.id,
          label: mod.label,
          kind: mod.kind,
          scope: "internal",
          path: mod.path,
          imports: mod.imports,
          imported_by: mod.imported_by,
        };
        return (
          <Node
            key={mod.id}
            position={internalPositions[mod.id]}
            label={mod.label}
            sub={mod.path.replace(/^(app|components|lib)\//, "")}
            color={COLORS[mod.kind] ?? "#6ea0ff"}
            shape={SHAPES[mod.kind] ?? "box"}
            size={0.85}
            data={data}
          />
        );
      })}

      {/* Internal → internal edges (imports) */}
      {internal.flatMap((mod) =>
        mod.imports
          .filter((target) => internalPositions[target])
          .map((target) => (
            <Edge
              key={`${mod.id}->${target}`}
              from={internalPositions[mod.id]}
              to={internalPositions[target]}
              color={COLORS[mod.kind] ?? "#6ea0ff"}
              animated={false}
            />
          ))
      )}

      {/* External nodes */}
      {external.map((em) => {
        const data: SelectionPayload = {
          id: em.id,
          label: em.label,
          kind: em.kind,
          scope: "external",
          purpose: em.purpose,
          consumed_by: em.consumed_by,
        };
        return (
          <Node
            key={em.id}
            position={externalPositions[em.id]}
            label={em.label}
            sub={em.kind}
            color={COLORS[em.kind] ?? "#7be9ff"}
            shape={SHAPES[em.kind] ?? "sphere"}
            size={0.75}
            data={data}
          />
        );
      })}

      {/* External → consumed_by dashed edges (only when consumer is an internal module) */}
      {external.flatMap((em) =>
        em.consumed_by
          .filter((c) => internalPositions[c])
          .map((c) => (
            <Edge
              key={`${em.id}->${c}`}
              from={externalPositions[em.id]}
              to={internalPositions[c]}
              color={COLORS[em.kind] ?? "#7be9ff"}
              dashed
              animated={false}
            />
          ))
      )}
    </group>
  );
}
