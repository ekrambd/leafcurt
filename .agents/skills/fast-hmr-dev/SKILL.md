---
name: fast-hmr-dev
description: >-
  Fast live development workflow: prevents slow builds and unnecessary tests after code changes, ensuring instant Vite HMR updates in Chrome.
---

# Fast HMR Development Skill

## Core Principles
1. **Zero Unnecessary Builds**: Never run `npm run build` or full production packaging after making code edits. The project uses Vite dev server with instant Hot Module Replacement (HMR).
2. **Instant Browser Updates**: Edits to `.tsx`, `.ts`, and styles are hot-pushed to Chrome automatically in milliseconds.
3. **No Sluggish Checks**: Avoid slow test suites or redundant command chains that block the user. Deliver updates directly and swiftly.
