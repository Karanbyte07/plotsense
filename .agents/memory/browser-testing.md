---
name: Browser testing environment
description: Nix-specific browser launch constraint for frontend verification.
---

Prefer the environment-supplied Chromium when running browser tests on Replit.

**Why:** Playwright's downloaded Chromium failed to launch because its expected shared libraries were unavailable in the Nix environment. The supplied browser already has a working runtime.

**How to apply:** Check for an installed Chromium before downloading browsers or adding system packages. Keep a normal Playwright fallback for other development environments.
