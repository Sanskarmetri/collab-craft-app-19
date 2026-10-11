# Phase: CI & Quality-Check Stabilization

## Why this first
The audit confirmed the project's automated checks are currently broken: the lint check fails with 94 errors, which blocks the build and accessibility checks in CI, and the existing tests (12, all passing) are never run by CI at all. Until this is fixed, every future feature ships without a safety net.

## What will change

### 1. Fix the lint configuration (root cause of 94 errors)
- `eslint.config.js` currently lints everything, including the Deno-based backend functions and root config files, with strict frontend rules.
- Add ignore entries for `supabase/functions/**` (Deno runtime, not covered by the frontend TS config) and root config files that legitimately use `require()`.
- Fix the small number of genuine lint errors that remain in frontend source files (e.g. `any` types and empty interfaces in quiz components, hooks, `Auth.tsx`) with minimal, behavior-preserving edits.

### 2. Wire tests into CI
- Add a `"test": "vitest run"` script to `package.json` (README already tells contributors to run `npm run test`, which currently fails).
- Add a `test` job to `.github/workflows/ci.yml` so the 12 existing tests run on every push/PR and block merges on failure.

### 3. Make the accessibility check reproducible
- The accessibility job currently installs `axe-core`, `serve`, and `wait-on` ad-hoc via `npx`. Move these to devDependencies and pin them so the job is reproducible.

### 4. Documentation alignment
- Update README/CONTRIBUTING only where they describe commands that don't exist (e.g. the test script).

## What will NOT change
- No UI, layout, color, or navigation changes.
- No database schema changes.
- No changes to edge function behavior, AI prompts, rate limits, or Focus Mode.
- No new features — this phase is purely build/check health.

## Validation
- `npm run lint` exits 0.
- `npx tsc --noEmit` passes (already green).
- `npm run test` runs and all 12 tests pass.
- `npm run build` succeeds.
- Simulated CI sequence (lint → typecheck → test → build) passes end-to-end locally.

## Out of scope (flagged for later phases)
- Large JS bundle (1.56 MB, no code-splitting) — build warning only.
- Duplicated auth logic across 17 edge functions (no shared helper).
- Wide-open CORS (`*`) on edge functions.
- `fetch-upsc-news` appears to lack an auth check (needs verification).
- Quiz answer-key exposure risk in the `questions` table.
- Profile save/cancel buttons with no handlers.
