# CineMatch frontend

## Run and verify
- Post-merge setup runs `scripts/post-merge.sh`: restore locked npm dependencies, run frontend unit tests, then type-check and build. It does not provision backend data or download browsers.
- Node.js 24; dependencies are managed by npm workspaces with application code in `frontend/`.
- Install from the repository root with `npm ci`.
- Run `npm run dev` (Vite on 0.0.0.0:5000, proxied preview hosts allowed).
- Run `npm run check` for TypeScript and `npm run build` for a production build.
- Build output is `frontend/dist/`; generated output and dependencies are ignored.

## Scope and reference
The uploaded frontend ZIP is the preserved design reference. Conversion is incremental, not a redesign.
The frontend foundation, shared visual shell, API support utilities, and original SearchConsole are implemented. Search and autocomplete use the real API helpers; results and detail pages remain intentionally out of scope.
The shell preserves the reference Atmosphere and Wordmark, with reduced-motion support.
Fraunces, Inter Tight, and JetBrains Mono load from Google Fonts; network access to Google Fonts is required for the original typography.
The supplied movies-app.png is reused as the favicon. The uploaded ZIP remains unchanged.
The existing Python backend is unchanged. API/type/format helpers mirror its contracts; live integration still requires a running backend with real movie data.
Do not put secrets in browser-facing Vite environment variables.

## API support
- `VITE_API_URL` is the optional public backend origin (without `/api`). When omitted, requests use relative `/api/...` URLs and require same-origin routing to a real backend.
- The current Vite-only server does not provide an API proxy. Its HTML fallback is rejected as an API configuration error, not treated as movie data.
- Helpers throw errors rather than returning fake data. Consumers must handle failed requests and can pass `{ signal }` for cancellation.
- Run `npm test --workspace frontend` on Node.js 24 for API and formatting unit tests. Network responses are mocked only inside tests, never in application code.
- The original helper files were absent from the reference ZIP, so formatting conventions are reconstructed from their component call sites.
- Run `npm run test:search` for browser checks of autocomplete, keyboard/touch selection, controls, failures, cancellation, and stale responses. Install Chromium with `npx playwright install chromium` first. Test-only API fixtures do not supply application data.
