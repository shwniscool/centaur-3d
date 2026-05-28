# centaur-3d — quick reference

- **Kind:** static-export Next.js 14 frontend
- **Internal modules:** 9
- **External dependencies:** 9
- **Architecture pattern:** client-only SPA with pluggable scene renderers
- **Deploy target:** GitHub Pages (basePath `/centaur-3d`)
- **Build:** `next build` with `output: "export"`
- **Entry:** `app/page.tsx` → `<Scene />` (ssr: false) → one of three view components
- **Primitives:** `components/Node.tsx`, `components/Edge.tsx`
