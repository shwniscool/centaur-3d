# Centaur 3D Architecture

Interactive 3D visualization of Centaur's distributed agent architecture, built with Next.js 14, React Three Fiber, and Three.js.

Three views:

- **Architecture** — Slack/web edge, Centaur API hub, Postgres, K8s sandbox pods, the tool layer, and observability.
- **Session lifecycle** — message → activation → tool loop → delivery flow as a connected 3D path with animated pulses.
- **Pod lifecycle** — Pending → Idle → Active → Recycling state machine arranged on an orbit.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Deploy

The repo is Vercel-ready — push it as a new Vercel project and the default Next.js preset works with no extra config.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fshwniscool%2Fcentaur-3d)
