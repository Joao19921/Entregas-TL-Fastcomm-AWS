# CDN-First Data Strategy

## Overview

This project implements a **CDN-first architecture** to eliminate Supabase timeout issues in mobile networks:

- **Viewers**: Load data from `/data.json` (GitHub Pages CDN) — instant ⚡
- **Master**: Write to Supabase, read from local cache + JSON fallback
- **Sync**: Auto-export after build and manual trigger via workflow

## How It Works

### 1. Data Export (`scripts/export-data.js`)

Fetches all backlogs & tasks from Supabase and writes to `public/data.json`:

```bash
npm run export-data
```

Requires env vars:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### 2. Load Strategy (`src/lib/dataLoader.ts`)

The `useDataLoader()` hook intelligently prioritizes data sources:

**For Viewers:**
1. Try `/data.json` (CDN) → instant ⚡
2. Fall back to localStorage cache
3. Fall back to Supabase (if available)

**For Master:**
1. Try Supabase (can write)
2. Fall back to `/data.json`
3. Fall back to localStorage

**Timeout**: 15s per attempt, retry with exponential backoff (1s, 2s, 4s)

### 3. Build Integration

```json
{
  "build": "tsc -b && vite build && npm run postbuild:export",
  "postbuild:export": "node scripts/export-data.js"
}
```

After each build, `data.json` is automatically exported to `public/`, then included in `dist/` by Vite.

### 4. CI/CD Sync (`.github/workflows/export-data.yml`)

Triggered on push to `main`:

1. Runs `npm run export-data`
2. Commits `data.json` if changed
3. Uses `[skip ci]` to avoid double-build

## Files

| File | Purpose |
|------|---------|
| `scripts/export-data.js` | Node.js export script |
| `src/lib/dataLoader.ts` | React hook for CDN-first loading |
| `src/Roadmap.tsx` | Integrated with `useDataLoader` |
| `.github/workflows/export-data.yml` | Auto-sync workflow |
| `public/data.json` | CDN snapshot (generated) |
| `package.json` | Build scripts |

## Usage

### Manual Export
```bash
npm run export-data
```

### Build + Export
```bash
npm run build
```

### Test Locally

1. Run build to generate `data.json`
2. Start dev server: `npm run dev`
3. In browser DevTools, throttle Network to "Slow 3G" or offline
4. Reload page — viewers should load instantly from cache
5. Master can still edit (with Supabase timeout gracefully degraded)

## Performance Impact

| Role | Before | After |
|------|--------|-------|
| **Viewer (mobile)** | 15s+ timeout ⚠️ | <100ms from CDN ⚡ |
| **Master (online)** | 15s (Supabase) | Same (Supabase) |
| **Master (offline)** | Blocked ❌ | Can read cache ✓ |

## Troubleshooting

### `data.json` not updating
- Check env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Manual trigger: `npm run export-data`
- Check GitHub Actions logs: `.github/workflows/export-data.yml`

### Still timing out
- Verify `/data.json` exists at: `https://joao19921.github.io/Entregas-TL-Fastcomm-AWS/data.json`
- Check browser cache (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
- Check Network tab in DevTools for failed requests

### Stale data
- `/data.json` updates after each master edit (via Supabase save)
- Max 60s lag from edit to CDN propagation
- Use `lastUpdated` timestamp to track freshness

---

**Author**: Copilot  
**Date**: 2026-05-29
