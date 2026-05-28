# centaur-3d

**Kind:** frontend · **Type:** typescript-package · **Manifest:** `package.json`

Interactive 3D visualization of Centaur's distributed agent architecture. Single-page Next.js 14 App Router app rendered with React Three Fiber on top of three.js. Builds as a fully-static export (`next.config.js` sets `output: "export"`, basePath `/centaur-3d`) and deploys to GitHub Pages via `.github/workflows/deploy.yml`.

## Architecture pattern

**Client-only Single-Page View with Pluggable Scene Renderers.** The App Router serves a single page (`app/page.tsx`) that mounts a dynamic-import client component `Scene` (SSR disabled because three.js needs `window`/WebGL). `Scene` is a thin Canvas + lighting + controls shell that delegates to one of three view components based on a `view` string prop. Each view component is a self-contained scene graph composed from two reusable primitives (`Node`, `Edge`). The page-level UI overlay (legend, pills, hint, credit) is plain DOM positioned over the canvas via CSS.

There is no server runtime at all — no API routes, no `getServerSideProps`, no middleware. The whole site is precomputed HTML + JS bundles.

## Key modules

| Module | Path | Description |
|---|---|---|
| `RootLayout` | `app/layout.tsx` | HTML shell. Imports `globals.css`. Sets static `<Metadata>` (title, description). |
| `Page` | `app/page.tsx` | View switcher. Holds `view` state (`architecture | session | pod`), renders overlay (title, description, pills, legend, hint, credit) and dynamically imports `Scene` with `ssr: false`. |
| `Scene` | `components/Scene.tsx` | Canvas wrapper. Sets camera, lighting (ambient + directional + 2 point lights), star backdrop, OrbitControls. Suspense-wraps the active view. |
| `Node` | `components/Node.tsx` | Reusable 3D node. Box/sphere/cylinder/octahedron geometry, emissive material, hover scale-up + spin, label/sub label via `<Html>` overlay. **No `onClick` — only `onPointerOver`/`onPointerOut`.** |
| `Edge` | `components/Edge.tsx` | Reusable 3D edge. `THREE.BufferGeometry` between two points; either solid `LineBasicMaterial` or dashed `LineDashedMaterial`. Optional animated pulse sphere lerping between endpoints in `useFrame`. |
| `Architecture` view | `components/views/Architecture.tsx` | Hardcoded static layout of Centaur subsystems: edge (Slack/Web/Other), API hub (gateway/router/workflow engine/outbox), Postgres tables, K8s pods + scheduler, tool layer, observability. Wires up edges between them. |
| `SessionLifecycle` view | `components/views/SessionLifecycle.tsx` | 9-step linear flow (user message → render reply) with an animated tool-loop dashed back-edge. Slow group `rotation.y` wobble in `useFrame`. |
| `PodLifecycle` view | `components/views/PodLifecycle.tsx` | 8-state orbit (Pending → Scheduling → … → Delivering) on a circle of radius 6, plus a central "Recycling" node that every state dashes back to. Group `rotation.y` slowly spins in `useFrame`. |
| `globals.css` | `app/globals.css` | Body reset, dark background, fixed overlay/legend/hint/credit panels, pill styling. |

## Data flows

### Page render → view selection
1. `RootLayout` injects `globals.css` and renders `<body>{children}</body>`.
2. `Page` mounts with default `view="architecture"`.
3. `dynamic(() => import("../components/Scene"), { ssr: false })` defers `Scene` import until client mount (three.js requires `window`).
4. User clicks a `.pill` → `setView(v.id)` → React re-renders → `Scene` receives new `view` prop → conditional inside `Scene` swaps which view component renders inside `<Canvas>`.

### Frame loop (per view)
1. `<Canvas>` from `@react-three/fiber` drives the requestAnimationFrame loop.
2. Each `Node` registers a `useFrame` callback that rotates and scales its mesh based on hover state.
3. Each animated `Edge` registers a `useFrame` callback that lerps the pulse sphere position between endpoints.
4. `SessionLifecycle` and `PodLifecycle` each register an additional `useFrame` on their `<group>` to wobble or spin the whole scene.

### Build → deploy
1. CI workflow (`.github/workflows/deploy.yml`) on push to `main` runs `npm ci && NODE_ENV=production npm run build`.
2. `next build` produces `out/` (because of `output: "export"`); workflow touches `out/.nojekyll` to keep `_next/` served.
3. `actions/upload-pages-artifact@v3` + `actions/deploy-pages@v4` publish to GitHub Pages at `https://shwniscool.github.io/centaur-3d/`.

## Design decisions

- **`ssr: false` on `Scene`** — three.js touches `window`/WebGL, which is undefined at build time. Without this, `next build` fails on the static-export pass.
- **`output: "export"` + GitHub Pages** — site is fully static, no API needed; cheaper and simpler than a Vercel deploy.
- **`basePath: "/centaur-3d"` only in production** — local `npm run dev` would otherwise serve from `/centaur-3d/...` and break.
- **`Html` overlay labels (drei)** — labels stay readable from any camera angle and scale with `distanceFactor`. Alternative (`<Text>` mesh) would render in 3D but rotate with the scene.
- **No `onClick` on `Node`** — current limitation; nodes only respond to hover. The view-switcher pills are DOM-level click targets. **This is the UX issue reported by the user**: clicking a node does nothing because no pointer handler is wired.

## Tech stack

- next 14.2.18 (App Router, static export)
- react 18.3.1 / react-dom 18.3.1
- three 0.169.0
- @react-three/fiber 8.17.10 (React renderer for three.js)
- @react-three/drei 9.114.0 (OrbitControls, Stars, Html)
- typescript 5
- GitHub Actions (`actions/checkout@v4`, `actions/setup-node@v4`, `actions/configure-pages@v5`, `actions/upload-pages-artifact@v3`, `actions/deploy-pages@v4`)

## Security notes

- No secrets, no auth, no runtime — fully static export means no attack surface beyond the CDN.
- Single outbound link in UI to the repo URL (`app/page.tsx:48`), uses `rel="noreferrer"`.
- `npm ci` produces a noticed deprecation warning for `next@14.2.18` (security advisory, see <https://nextjs.org/blog/security-update-2025-12-11>) — upgrade path open but not blocking for a static-export site without server routes.

## Performance notes

- All geometries created inline per `Node`/`Edge` render — fine for the current ~10-30 node scenes, but every state change re-creates BufferGeometry for unchanged edges. For a larger graph, memoize geometries by endpoint pair or batch into `InstancedMesh`.
- `useFrame` runs every animation frame on **every** node + edge; with ~30 nodes that's ~30 closures per frame. Acceptable; would need re-architecting past ~500 nodes.
- `Stars` count is 2500 (`components/Scene.tsx:19`) — fine on desktop, may matter on low-end mobile.

## Scalability notes

- Adding a fourth "view" requires: a new `views/Whatever.tsx`, a new entry in `VIEWS` in `app/page.tsx:9`, a new entry in `DESCRIPTIONS` (`app/page.tsx:15`), and a new conditional branch in `Scene` (`components/Scene.tsx:21`). Coupling is high — three places to touch per view. A registry would be cleaner.
- The Architecture view's positions are hardcoded magic numbers — refactoring to a data-driven graph (positions + edges) would let the same view consume external sources (e.g., the flashlight artifacts in this very repo).

## External integrations

- **GitHub Pages** (static hosting CDN) — via `actions/deploy-pages@v4`.
- **GitHub Actions runner** — build environment, deploys on `push` to `main` + `workflow_dispatch`.
- No third-party API calls, no analytics, no telemetry.

## Citations

```json
[
  {"file_path": "package.json",                                    "start_line": 5,  "end_line": 10, "claim": "Build uses next dev/build/start/lint scripts (no custom build wrapper)", "section": "Architecture pattern"},
  {"file_path": "package.json",                                    "start_line": 11, "end_line": 18, "claim": "Runtime deps: next, react, react-dom, three, @react-three/fiber, @react-three/drei", "section": "Tech stack"},
  {"file_path": "package.json",                                    "start_line": 19, "end_line": 25, "claim": "Dev deps: @types/node, @types/react, @types/react-dom, @types/three, typescript", "section": "Tech stack"},
  {"file_path": "next.config.js",                                  "start_line": 1,  "end_line": 11, "claim": "Static export with basePath /centaur-3d in production only, images unoptimized", "section": "Design decisions"},
  {"file_path": "app/layout.tsx",                                  "start_line": 1,  "end_line": 15, "claim": "RootLayout imports globals.css and sets static Metadata", "section": "Key modules"},
  {"file_path": "app/page.tsx",                                    "start_line": 5,  "end_line": 5,  "claim": "Scene is dynamic-imported with ssr: false (three.js requires window)", "section": "Design decisions"},
  {"file_path": "app/page.tsx",                                    "start_line": 9,  "end_line": 13, "claim": "VIEWS registry of three view ids: architecture | session | pod", "section": "Data flows"},
  {"file_path": "app/page.tsx",                                    "start_line": 15, "end_line": 19, "claim": "DESCRIPTIONS map provides the overlay copy for each view", "section": "Data flows"},
  {"file_path": "app/page.tsx",                                    "start_line": 21, "end_line": 52, "claim": "Page holds view state and renders overlay + Scene", "section": "Data flows"},
  {"file_path": "app/page.tsx",                                    "start_line": 48, "end_line": 48, "claim": "Single outbound link to repo URL with rel='noreferrer'", "section": "Security notes"},
  {"file_path": "components/Scene.tsx",                            "start_line": 9,  "end_line": 28, "claim": "Canvas + lighting + Stars + OrbitControls, view-conditional render inside Suspense", "section": "Key modules"},
  {"file_path": "components/Scene.tsx",                            "start_line": 19, "end_line": 19, "claim": "Stars uses count=2500", "section": "Performance notes"},
  {"file_path": "components/Node.tsx",                             "start_line": 16, "end_line": 67, "claim": "Node renders one of four geometries with emissive material and useFrame hover animation", "section": "Key modules"},
  {"file_path": "components/Node.tsx",                             "start_line": 34, "end_line": 39, "claim": "Node has onPointerOver/onPointerOut but no onClick handler — root cause of the click-into-component bug", "section": "Design decisions"},
  {"file_path": "components/Edge.tsx",                             "start_line": 14, "end_line": 47, "claim": "Edge renders a THREE.Line (solid or dashed) with optional animated pulse sphere", "section": "Key modules"},
  {"file_path": "components/views/Architecture.tsx",               "start_line": 14, "end_line": 92, "claim": "Architecture view: hardcoded positions and edges for edge/api/postgres/k8s/tool/observability layers", "section": "Key modules"},
  {"file_path": "components/views/SessionLifecycle.tsx",           "start_line": 8,  "end_line": 38, "claim": "SessionLifecycle: 9-step linear flow with wobble", "section": "Key modules"},
  {"file_path": "components/views/PodLifecycle.tsx",               "start_line": 8,  "end_line": 54, "claim": "PodLifecycle: 8-state circular orbit with central Recycling node and slow group spin", "section": "Key modules"},
  {"file_path": "app/globals.css",                                 "start_line": 1,  "end_line": 73, "claim": "Body reset + fixed overlay/legend/hint/credit panels + pill styling", "section": "Key modules"},
  {"file_path": ".github/workflows/deploy.yml",                    "start_line": 19, "end_line": 33, "claim": "Build job: npm ci → next build (NODE_ENV=production) → touch .nojekyll → upload Pages artifact", "section": "Data flows"},
  {"file_path": ".github/workflows/deploy.yml",                    "start_line": 35, "end_line": 44, "claim": "Deploy job: actions/deploy-pages@v4 publishes to github-pages environment", "section": "Data flows"}
]
```

## Analysis Data

```json
{
  "summary": "Static-exported Next.js 14 App Router app rendering three React-Three-Fiber scenes (architecture, session lifecycle, pod lifecycle) over a shared Node/Edge primitive layer. No server runtime; deploys to GitHub Pages.",
  "architecture_pattern": "client-only SPA with pluggable scene renderers",
  "tech_stack": ["next@14.2.18", "react@18.3.1", "three@0.169.0", "@react-three/fiber@8.17.10", "@react-three/drei@9.114.0", "typescript@5", "github-pages", "github-actions"],
  "internal_modules": [
    { "id": "app/layout",                  "label": "RootLayout",             "kind": "frontend-shell",   "path": "app/layout.tsx",                  "imports": ["app/globals.css"],                                                                            "imported_by": [] },
    { "id": "app/page",                    "label": "Page",                   "kind": "frontend-page",    "path": "app/page.tsx",                    "imports": ["components/Scene"],                                                                          "imported_by": [] },
    { "id": "app/globals",                 "label": "globals.css",            "kind": "frontend-style",   "path": "app/globals.css",                 "imports": [],                                                                                              "imported_by": ["app/layout"] },
    { "id": "components/Scene",            "label": "Scene",                  "kind": "frontend-shell",   "path": "components/Scene.tsx",            "imports": ["components/views/Architecture","components/views/SessionLifecycle","components/views/PodLifecycle"], "imported_by": ["app/page"] },
    { "id": "components/Node",             "label": "Node",                   "kind": "frontend-primitive","path": "components/Node.tsx",             "imports": [],                                                                                              "imported_by": ["components/views/Architecture","components/views/SessionLifecycle","components/views/PodLifecycle"] },
    { "id": "components/Edge",             "label": "Edge",                   "kind": "frontend-primitive","path": "components/Edge.tsx",             "imports": [],                                                                                              "imported_by": ["components/views/Architecture","components/views/SessionLifecycle","components/views/PodLifecycle"] },
    { "id": "components/views/Architecture",   "label": "Architecture view",  "kind": "frontend-view",    "path": "components/views/Architecture.tsx",     "imports": ["components/Node","components/Edge"], "imported_by": ["components/Scene"] },
    { "id": "components/views/SessionLifecycle","label": "SessionLifecycle view","kind": "frontend-view", "path": "components/views/SessionLifecycle.tsx", "imports": ["components/Node","components/Edge"], "imported_by": ["components/Scene"] },
    { "id": "components/views/PodLifecycle",   "label": "PodLifecycle view",  "kind": "frontend-view",    "path": "components/views/PodLifecycle.tsx",     "imports": ["components/Node","components/Edge"], "imported_by": ["components/Scene"] }
  ],
  "external_modules": [
    { "id": "ext/next",               "label": "next",               "kind": "framework",     "purpose": "App Router + static export",         "consumed_by": ["app/page", "app/layout"] },
    { "id": "ext/react",              "label": "react",              "kind": "ui-runtime",    "purpose": "Component model + hooks",            "consumed_by": ["app/page","components/Scene","components/Node","components/Edge","components/views/Architecture","components/views/SessionLifecycle","components/views/PodLifecycle"] },
    { "id": "ext/react-dom",          "label": "react-dom",          "kind": "ui-runtime",    "purpose": "DOM reconciler (transitive via next)","consumed_by": [] },
    { "id": "ext/three",              "label": "three",              "kind": "graphics",      "purpose": "WebGL renderer + math primitives",   "consumed_by": ["components/Edge","components/views/SessionLifecycle","components/views/PodLifecycle"] },
    { "id": "ext/r3f",                "label": "@react-three/fiber", "kind": "graphics",      "purpose": "React renderer for three.js, Canvas, useFrame", "consumed_by": ["components/Scene","components/Node","components/Edge","components/views/SessionLifecycle","components/views/PodLifecycle"] },
    { "id": "ext/drei",               "label": "@react-three/drei",  "kind": "graphics",      "purpose": "OrbitControls, Stars, Html overlay", "consumed_by": ["components/Scene","components/Node"] },
    { "id": "ext/typescript",         "label": "typescript",         "kind": "dev-tooling",   "purpose": "Type checking", "consumed_by": [] },
    { "id": "ext/github-pages",       "label": "GitHub Pages",       "kind": "hosting-cdn",   "purpose": "Static hosting target", "consumed_by": ["centaur-3d"] },
    { "id": "ext/github-actions",     "label": "GitHub Actions",     "kind": "ci-runtime",    "purpose": "Build + deploy runner",  "consumed_by": ["centaur-3d"] }
  ]
}
```
