# AGENTS.md - RalphMeter

## Project Context

RalphMeter is a metering and transparency layer for AI coding agents. It measures the "energy" required to transform a PRD (intent) into a verified application.

## Key Concepts

### The 4-Gate Verification Model

Gates are **progressive** — not all gates apply to all project types.

| Gate | Name | Check | Applies When |
|------|------|-------|--------------|
| **G1** | Compiles | Syntax valid, types check | Always |
| **G2** | Correct | Tests pass | Has tests/specs |
| **G3** | Runs | Starts without crash | Has entry point |
| **G4** | Reachable | Code paths exercised | Has explorable surface |

#### Gate Applicability by Project Type

| Project Type | G1 | G2 | G3 | G4 |
|--------------|----|----|----|----|
| Library (no tests) | ✓ | — | — | — |
| Library (with tests) | ✓ | ✓ | — | — |
| CLI tool | ✓ | ✓ | ✓ | — |
| Web app / API | ✓ | ✓ | ✓ | ✓ |

### What is Verified LOC (vLOC)?

A line of code is **verified** when it passes ALL applicable gates:

```
Line 42: validateUser(input)

G1 ✓ Compiles     → TypeScript accepts it
G2 ✓ Correct      → Tests cover this line and tests 
                    covering this line pass
G3 ✓ Runs         → App starts, no crash
G4 ✓ Reachable    → AI Explorer executed this line

Result: Line 42 is 1 vLOC ✓
```

**Important**: A single line cannot be verified in isolation. Verification happens at the **story level**:
- Story passes → all LOC in that story become vLOC
- Story fails → 0 vLOC (tokens spent, nothing verified)

The gates are checked per-line, but the verification boundary is the story.

### G4 Reachability - The AI Explorer Approach
G4 is NOT test coverage. It's **actual runtime reachability from the app**.

AI Explorer:
1. Starts app with coverage instrumentation
2. AI explores ALL surfaces (clicks, forms, API calls)
3. Tracks auth barriers (401, 403, 402)
4. Lines executed = G4 PASS
5. Lines behind auth = G4 UNKNOWN (not dead, just gated)
6. Lines never hit = G4 FAIL (truly dead code)

### Reachability Categories
- **Exercised**: Lines proven reachable by AI exploration
- **Auth-gated**: Behind 401 - needs credentials to verify
- **Permission-gated**: Behind 403 - needs elevated role
- **Paywall-gated**: Behind 402 - needs payment
- **Unreached**: No barrier, but never executed = dead code

### Core Metrics
- **Synth**: Tokens per Verified LOC (lower is better) — the cost of synthesis
- **Verified LOC**: Lines of code where all applicable gates pass
- **vLOC/M**: Verified LOC per Minute — effective productivity
- **LOC/M**: Total LOC per Minute — raw output speed
- **Verification Rate**: vLOC / LOC — how much survives the gates
- **PoE-LOC**: Probability of Error per LOC
- Example: 85 vLOC produced with 4,250 tokens = 50 Synths (50 tokens per verified line)

### Synth Calculation (Per Story)
```
Story: US-003 (passes: true)
├── Iterations to complete: 2
├── Total tokens spent: 4,250
├── Verified LOC produced: 85
└── Synths = 4,250 / 85 = 50
```
Stories are the verification boundary. A passing story mints its Synth score.

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
│          AI Explorer (G4)                   │
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
