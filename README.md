# SafeGuard AI — Admin Dashboard

Governance UI: Shadow AI discovery, DLP policies, usage logs, alerts, teams & keys. Talks to the SafeGuard control-plane (:8081) and gateway (:8080).

Built with Vite + React 19 + Tailwind 4. Consumes the shared design system
`@the-safeguard/ui` from GitHub Packages (see `.npmrc`).

## Develop
```bash
cp .env.example .env   # set VITE_GATEWAY_URL / VITE_CONTROL_PLANE_URL
bun install            # needs a GitHub token with read:packages
bun run dev
```

## Build / image
`bun run build` emits static assets to `dist/`. The `Dockerfile` builds and serves
them via nginx; CI publishes a multi-arch image to `ghcr.io/the-safeguard/admin`.

## License
AGPL-3.0-only — see [LICENSE](LICENSE).
