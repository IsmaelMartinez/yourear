# CLAUDE.md

YourEar is a browser-based hearing test: a Vite + TypeScript PWA with no UI framework, deployed to GitHub Pages. See [CONTRIBUTING.md](CONTRIBUTING.md) for the full project tree and setup.

## Commands

Use `npm run test:run` (single run) rather than `npm test`, which starts Vitest in watch mode. Run `npm run typecheck` (`tsc --noEmit`) as well, because Vitest does not type-check. `npm run build` runs `tsc` then `vite build`, as CI does. The Node version lives in `.nvmrc`.

## Architecture

- `src/main.ts` is the router: `render()` looks up `getState().screen` in the `SCREENS` table and calls every other screen's cleanup (calibration, test, tinnitus, speech-noise) before rendering it.
- `src/screens/` has one file per route; each renders template-string HTML into the app container and wires its own handlers.
- `src/audio/` holds tone, tinnitus, speech/noise and mic noise-meter code; every module shares the singleton `AudioContext` from `audio-context.ts` (`getAudioContext()`, `ensureRunning()`), never a new one.
- `src/state/app-state.ts` owns app state and navigation; `src/services/` holds the test runner and jsPDF export; `src/storage/profile.ts` persists profiles in localStorage under `yourear_profiles`.
- `src/types/index.ts` holds the test configs (`DEFAULT_TEST_CONFIG`, `QUICK_TEST_CONFIG`, `DETAILED_TEST_CONFIG`), frequency lists, hearing-loss grading and age-based expected thresholds.

## Conventions

- No UI framework. Screen reader announcements go through `announce()` in `src/utils/dom.ts` (ADR 007).
- Vite `base` is `/yourear/` (GitHub Pages), so absolute asset paths must include it.
- Speech-in-noise word clips in `public/speech/` are generated from `WORD_LISTS` by `scripts/generate-speech-clips.sh` (espeak-ng + ffmpeg); rerun it when a word list changes (ADR 008).
- `?demo=true` seeds a demo profile, which is useful when checking the results and comparison screens.
- Tests run under jsdom. Tests that need audio use `installAudioContext()` and `stubGetUserMedia()` from `src/test/web-audio.ts`; they stub globals with `vi.stubGlobal`, which `unstubGlobals: true` undoes after each test, so never assign globals directly.
- `npm run test:coverage` enforces the coverage thresholds in `vitest.config.ts` (CI runs it). They are a ratchet: raise them when coverage grows, never lower them.

## Workflows and dependencies

`release.yml` and `osv-scanner.yml` are Repo Butler templates, so change them upstream rather than editing them by hand. `vitest` and `@vitest/*` are co-versioned and must be bumped together (Dependabot groups them). Git tags and releases are the version source of truth, and `package.json` mirrors the latest release.

## Repo Butler

This repo is monitored by [Repo Butler](https://github.com/IsmaelMartinez/repo-butler), a portfolio health agent that observes repo health daily and generates dashboards, governance proposals, and tier classifications.

**Your report:** https://ismaelmartinez.github.io/repo-butler/yourear.html
**Portfolio dashboard:** https://ismaelmartinez.github.io/repo-butler/
**Consumer guide:** https://github.com/IsmaelMartinez/repo-butler/blob/main/docs/consumer-guide.md

### Querying Reginald (the butler MCP server)

To query your repo's health tier, governance findings, and portfolio data from any Claude Code session, add the MCP server once (adjust the path to your local repo-butler checkout):

```bash
claude mcp add repo-butler node /path/to/repo-butler/src/mcp.js
```

Available tools: `get_health_tier`, `get_campaign_status`, `query_portfolio`, `get_snapshot_diff`, `get_governance_findings`, `trigger_refresh`.

When working on health improvements, check the per-repo report for the current tier checklist and use the consumer guide for fix instructions.

If this repo deploys a page, set its GitHub repository Homepage URL (the Website field in the repo's About section — not `package.json`'s `homepage`) to the canonical URL. That's how repo-butler surfaces the deployed link in dashboards and agent cards.
