---
name: Frontend working rules
description: User's standing branch, design-fidelity, incremental delivery, and Git push requirements.
---

All frontend work must stay on the existing `frontend` branch tracking `origin/frontend`. Never change main/master for this work or merge frontend into main. Before implementation inspect Git state, fetch origin, and protect uncommitted work.

Use the uploaded frontend as the primary design and behavior reference, converted to React + Vite; do not redesign or remove features. Preserve the backend and its API contracts, use real data, and keep API configuration in environment variables.

Develop incrementally. Present the plan and wait for approval before the first implementation. Wait for the user's instructions before each subsequent component, page, or feature.

After every completed unit, inspect and review changes, run appropriate checks, stage only related files, create a descriptive separate commit, and immediately push to origin/frontend. Verify the push and report any failures; do not accumulate completed units into one large commit.

**Why:** The user explicitly supplied these development guidelines and requested that all future frontend work use this branch.

**How to apply:** Enforce these constraints in frontend plans and implementation handoffs. A broad roadmap does not authorize completing every feature at once.
