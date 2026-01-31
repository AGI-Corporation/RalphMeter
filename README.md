# RalphMeter

> The physical unit for AI code synthesis.

**Synth** — Tokens per Verified LOC. Lower is better.

![RalphMeter Architecture](image.png)

## What This Measures

```
PRD (Intent) → [Agent + Energy] → Verified Application
```

RalphMeter captures the transformation from human intent to working code, measuring:

- **Verified LOC (vLOC)**: Lines of code that pass all applicable gates
- **Synth**: Tokens per Verified LOC (lower is better) — the cost of synthesis
- **vLOC/M**: Verified LOC per Minute — effective productivity
- **LOC/M**: Total LOC per Minute — raw output speed
- **Verification Rate**: vLOC / LOC — how much survives the gates
- **PoE-LOC**: Probability of Error per Line of Code

For true energy accounting, Synth can be converted to Joules using provider-specific token-to-watt estimates.

## The 4-Gate Model

Gates are **progressive** — not all gates apply to all project types.

| Gate | Test | What It Proves | Applies When |
|------|------|----------------|---------------|
| G1 | Compiles | Syntax valid, types check | Always |
| G2 | Correct | Tests pass | Has tests |
| G3 | Runs | Starts without crash | Has entry point |
| G4 | Reachable | Code exercised by AI Explorer | Has explorable surface |

Code is **verified** when all *applicable* gates pass.

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
