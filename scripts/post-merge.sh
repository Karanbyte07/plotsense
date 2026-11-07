#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

# Restore exactly the merged lockfile without downloading browsers or backend models.
npm ci --no-audit --no-fund
npm test --workspace frontend
npm run build
