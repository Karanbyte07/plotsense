# CineMatch frontend

## Run and verify
- Node.js 24; dependencies are managed by npm workspaces with application code in `frontend/`.
- Install from the repository root with `npm ci`.
- Run `npm run dev` (Vite on 0.0.0.0:5000, proxied preview hosts allowed).
- Run `npm run check` for TypeScript and `npm run build` for a production build.
- Build output is `frontend/dist/`; generated output and dependencies are ignored.

## Scope and reference
The uploaded frontend ZIP is the preserved design reference. Conversion is incremental, not a redesign.
Only frontend foundation and shared visual shell are currently approved; no search or movie data is connected.
The shell preserves the reference Atmosphere and Wordmark, with reduced-motion support.
Fraunces, Inter Tight, and JetBrains Mono load from Google Fonts; network access to Google Fonts is required for the original typography.
The supplied movies-app.png is reused as the favicon. The uploaded ZIP remains unchanged.
The existing Python backend is unchanged. Later integration requires the missing API/type/format helpers and a running backend with real movie data.
Do not put secrets in browser-facing Vite environment variables.
