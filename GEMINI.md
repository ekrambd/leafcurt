# Rapid Development & Live HMR Rules

## Critical Workflow Directives

1. **NEVER Run `npm run build` After Code Changes**:
   - The dev server is active and running with Vite Hot Module Replacement (HMR).
   - Any modifications to React components, styles, or logic (`.tsx`, `.ts`, `.css`) are hot-reloaded into Chrome in milliseconds without restarting or rebuilding.
   - Running `npm run build` or heavy compilation tasks after every change is strictly forbidden because it wastes time and causes unnecessary delays.

2. **NO Unnecessary Test Suites or Slow Verification Runs**:
   - Do not run long test commands, multi-step benchmarks, or slow full builds after small fixes or feature tweaks.
   - Make changes cleanly and directly so the user sees results instantly.

3. **Instant Feedback Loop**:
   - Make the required file edits cleanly and accurately.
   - Allow Vite HMR to deliver the update to the browser immediately.
   - Respond concisely and right away so the user can test in Chrome without waiting.
