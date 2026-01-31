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
- **Verification Rate**: vLOC / LOC — how much survives the gates
- **PoE-LOC**: Probability of Error per Line of Code

For true energy accounting, Synth can be converted to Joules using provider-specific token-to-watt estimates.

## Measurement Hierarchy

```
Session (full Ralph run)
├── Story 1 (may take N iterations)
│   ├── Iteration 1: +1,200 tokens
│   ├── Iteration 2: +1,400 tokens  
│   └── Iteration 3: PASSES
├── Story 2 (1 iteration)
│   └── Iteration 1: +800 tokens, PASSES
└── Story 3 (stuck)
    └── Iterations 1-5: +10,000 tokens, no pass
```

**Cumulative Synth** — recalculated after each story:

```
After Story 1:  3,600 tokens,  100 LOC → Synth = 36
After Story 2:  4,400 tokens,  180 LOC → Synth = 24 ✓ improving
After Story 3: 14,400 tokens,  180 LOC → Synth = 80 ⚠️ spike!
```

| Signal | Meaning |
|--------|--------|
| Synth trending down | Healthy convergence |
| Synth spike | Problem story — tokens burned, little LOC added |
| Synth flat | Steady progress |

**Key insight:** LOC is measured as a codebase snapshot (not deltas). Synth = cumulative tokens / current LOC. Spikes reveal problem stories without complex delta math.

## The 3-Gate Model

Each gate provides **line-level verification** through different mechanisms:

| Gate | What It Checks | Line-Level How | Applies When |
|------|----------------|----------------|--------------|
| G1 | Compiles | Compiler errors point to specific lines | Always |
| G2 | Correct | Test coverage maps passing tests to lines | Has tests |
| G3 | Reachable | Runtime coverage shows executed lines | Has explorable surface |

A line is **verified** when it passes all applicable gates:

```typescript
Line 42: validateUser(input)
  G1 ✓ No compile error
  G2 ✓ Covered by passing test  
  G3 ✓ Executed during exploration
  → Verified ✓

Line 87: unusedHelper()
  G1 ✓ Compiles fine
  G2 ✗ Not covered by any passing test
  G3 ✗ Never executed
  → NOT verified (dead code)
```

### Configurable Thresholds

Story success can depend on gate thresholds:

```json
{
  "gates": {
    "G1": { "required": true },
    "G2": { "required": true, "threshold": 0.80 },
    "G3": { "skip": true }
  }
}
```

- **required**: Must pass for story to complete
- **threshold**: Minimum % of lines that must pass this gate
- **skip**: Gate is not evaluated (e.g., no tests yet, no explorable surface)

Code is **verified** when all *applicable* gates pass at the line level.

## Extensibility

The 3-gate model is the default, but gates are **pluggable**:

- Add custom gates (security scans, performance budgets, accessibility)
- Skip gates that don't apply to your project
- Configure pass thresholds per gate

See [Quality Gate Plugins](#) for the extension API.

## Session Metadata

Sessions support optional tags for arbitrary metadata:

```json
{
  "sessionId": "abc-123",
  "tags": {
    "mode": "DEVELOP",
    "methodology": "ralph-wiggum",
    "human_intervention": "false"
  }
}
```

Use tags to:
- Track different methodologies (Josh Mandel's modes, custom workflows)
- A/B test agent configurations
- Compare human-assisted vs fully autonomous sessions

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
