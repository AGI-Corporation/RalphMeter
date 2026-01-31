# RalphMeter

> The physical unit for AI code synthesis.

**Verified LOC per Joule** — Measuring the energy efficiency of AI coding agents.

![RalphMeter Architecture](image.png)

## What This Measures

```
PRD (Intent) → [Agent + Energy] → Verified Application
```

RalphMeter captures the transformation from human intent to working code, measuring:

- **Verified LOC**: Lines of code that pass all 4 gates (compile, run, integrate, test)
- **PoE-LOC-M**: Probability of Error per Line of Code per Minute
- **Efficiency**: Verified LOC / Energy spent (tokens, joules, dollars)

## The 4-Gate Model

| Gate | Test | What It Proves |
|------|------|----------------|
| G1 | Compiles | Syntax valid, types check |
| G2 | Runs | No crash at runtime |
| G3 | Reachable | Code is exercised by the app |
| G4 | Passes | Tests verify behavior |

Code only counts as "verified" when all 4 gates pass.

## Quick Start

```bash
npm install
npm run dev
```

## Status

🚧 Under construction — being built by Ralph, for Ralph.

## The Vision

An open standard for measuring AI coding agent efficiency, with:
- **Open spec** for the metric format
- **Reference benchmarks** for calibration
- **Commercial tooling** for insights

---

*"We're measuring exhaust, not combustion. The actual energy is reliable intent transformation under uncertainty."*
