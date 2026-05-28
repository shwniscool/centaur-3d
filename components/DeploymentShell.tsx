"use client";
import { useMemo } from "react";
import * as THREE from "three";
import Node from "./Node";
import Edge from "./Edge";
import { SelectionPayload } from "../lib/selection";

/**
 * Deployment topology around the centaur-3d source modules.
 *
 * The viz repo deploys to GitHub Pages (CDN), not Kubernetes — this shell renders
 * what's actually deployed (Pages CDN + Actions runner + browser client), styled
 * like a k8s-namespace boundary so the inside/outside split is visually obvious.
 *
 * - Translucent box = "GitHub Pages site boundary" (the static export bundle)
 * - Top-left node = Actions runner (CI that builds it)
 * - Top-right node = Pages CDN edge (where it's served from)
 * - Bottom node = Browser client (who runs it)
 * - Dashed edges show the build → publish → fetch flow
 */

const SITE_HALF_X = 5.5;
const SITE_HALF_Y = 5.5;
const SITE_HALF_Z = 2;

const CI: [number, number, number] = [-8, 6, -1];
const CDN: [number, number, number] = [8, 6, -1];
const BROWSER: [number, number, number] = [0, -5.5, 4];

const CI_DATA: SelectionPayload = {
  id: "deploy/actions",
  label: "GitHub Actions",
  kind: "ci-runtime",
  scope: "deployment",
  purpose: "Builds the static export on push to main (.github/workflows/deploy.yml) and uploads the Pages artifact",
  consumed_by: ["deploy/pages"],
};
const CDN_DATA: SelectionPayload = {
  id: "deploy/pages",
  label: "GitHub Pages CDN",
  kind: "hosting-cdn",
  scope: "deployment",
  purpose: "Serves the static bundle at https://shwniscool.github.io/centaur-3d/",
  consumed_by: ["deploy/browser"],
};
const BROWSER_DATA: SelectionPayload = {
  id: "deploy/browser",
  label: "Browser client",
  kind: "ui-runtime",
  scope: "deployment",
  purpose: "Runs the WebGL canvas + React tree against three.js. No server, no API calls.",
};
const SITE_DATA: SelectionPayload = {
  id: "deploy/site",
  label: "Static bundle",
  kind: "hosting-cdn",
  scope: "deployment",
  purpose: "next build (output: 'export') → out/ → uploaded as Pages artifact (basePath /centaur-3d).",
};

export default function DeploymentShell() {
  const boundaryGeo = useMemo(
    () => new THREE.BoxGeometry(SITE_HALF_X * 2, SITE_HALF_Y * 2, SITE_HALF_Z * 2),
    []
  );
  const boundaryEdges = useMemo(() => new THREE.EdgesGeometry(boundaryGeo), [boundaryGeo]);

  return (
    <group>
      {/* Translucent fill */}
      <mesh geometry={boundaryGeo} position={[0, 1, -1]}>
        <meshBasicMaterial color="#6ea0ff" transparent opacity={0.025} />
      </mesh>
      {/* Wireframe boundary */}
      <lineSegments geometry={boundaryEdges} position={[0, 1, -1]}>
        <lineBasicMaterial color="#6ea0ff" transparent opacity={0.2} />
      </lineSegments>

      {/* Boundary handle node (click for shell info) */}
      <Node
        position={[-SITE_HALF_X + 0.3, SITE_HALF_Y + 1.5, -1]}
        label="centaur-3d (static bundle)"
        sub="GitHub Pages basePath /centaur-3d"
        color="#6ea0ff"
        shape="octahedron"
        size={0.6}
        data={SITE_DATA}
      />

      {/* CI + CDN + browser */}
      <Node position={CI} label="GitHub Actions" sub="build + publish" color="#9aa6c0" shape="octahedron" size={0.8} data={CI_DATA} />
      <Node position={CDN} label="GitHub Pages" sub="CDN edge" color="#9aa6c0" shape="octahedron" size={0.8} data={CDN_DATA} />
      <Node position={BROWSER} label="Browser" sub="WebGL canvas" color="#ff7d9a" shape="sphere" size={0.85} data={BROWSER_DATA} />

      {/* Build → publish */}
      <Edge from={CI} to={CDN} color="#9aa6c0" dashed animated={false} />
      {/* Publish → site boundary */}
      <Edge from={CDN} to={[SITE_HALF_X - 0.3, SITE_HALF_Y + 0.5, -1]} color="#9aa6c0" dashed animated={false} />
      {/* Browser → fetch site bundle */}
      <Edge from={BROWSER} to={[0, -SITE_HALF_Y + 1, -1]} color="#ff7d9a" dashed animated />
    </group>
  );
}
