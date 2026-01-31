# AGENTS.md - RalphMeter

## Project Context

RalphMeter is a metering and transparency layer for AI coding agents. It measures the "energy" required to transform a PRD (intent) into a verified application.

## Key Concepts

### The 4-Gate Verification Model
1. **G1 - Compiles**: Syntax valid, types check (`tsc --noEmit`)
2. **G2 - Runs**: App starts without crash
3. **G3 - Reachable**: Code path exercised via AI exploration (not just test coverage)
4. **G4 - Correct**: Tests pass

### G3 Reachability - The AI Explorer Approach
G3 is NOT test coverage. It's **actual runtime reachability from the app**.

AI Explorer:
1. Starts app with coverage instrumentation
2. AI explores ALL surfaces (clicks, forms, API calls)
3. Tracks auth barriers (401, 403, 402)
4. Lines executed = G3 PASS
5. Lines behind auth = G3 UNKNOWN (not dead, just gated)
6. Lines never hit = G3 FAIL (truly dead code)

### Reachability Categories
- **Exercised**: Lines proven reachable by AI exploration
- **Auth-gated**: Behind 401 - needs credentials to verify
- **Permission-gated**: Behind 403 - needs elevated role
- **Paywall-gated**: Behind 402 - needs payment
- **Unreached**: No barrier, but never executed = dead code

### Core Metrics
- **Verified LOC**: Lines of code where all 4 gates pass
- **PoE-LOC-M**: Probability of Error per LOC per Minute
- **Efficiency**: Verified LOC / Total Tokens (or Joules, or $)
- **Tokens/vLOC**: Cost in tokens per verified line (lower is better)

### Architecture
```
┌─────────────────────────────────────────────┐
│           LOC-Based Metrics                 │
├─────────────────────────────────────────────┤
│         Benchmark Suite                     │
├─────────────────────────────────────────────┤
│       Transparency Dashboard                │
├─────────────────────────────────────────────┤
│          Metering Layer                     │
├─────────────────────────────────────────────┤
│          AI Explorer (G3)                   │
│   Playwright + Coverage + Auth Barriers     │
├─────────────────────────────────────────────┤
│             Ralph (or any agent)            │
└─────────────────────────────────────────────┘
```

## Tech Stack
- TypeScript + Node.js
- Express (API)
- React + TailwindCSS (Dashboard)
- SQLite (Persistence)
- Vitest (Testing)
- Playwright (AI Surface Exploration)
- c8 / V8 Coverage (Runtime instrumentation)

## Learnings

(This section will be updated as patterns are discovered)

## File Structure Conventions

```
src/
  core/           # Metering core (events, LOC counter, gates)
  api/            # Express REST API
  dashboard/      # React frontend
  benchmarks/     # Reference PRDs and comparison engine
  cli/            # CLI tool
  export/         # Open format exporter
  explorer/       # AI-driven reachability (G3)
    coverage.ts   # Runtime coverage instrumentation
    surface.ts    # AI surface exploration
    barriers.ts   # Auth barrier detection
    report.ts     # Reachability report generator
```
