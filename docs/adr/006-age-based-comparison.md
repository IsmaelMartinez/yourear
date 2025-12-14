# ADR 006: Age-Based Expected Thresholds

## Status
Accepted

## Context
Users want to know if their hearing is "normal for their age." Need a reference for age-expected hearing thresholds.

## Decision
Implement age-based expected thresholds based on **ISO 7029** standard, displayed as:
1. Median line (dashed yellow)
2. 90th percentile range (shaded yellow area)

## Rationale

### Why ISO 7029?
- International standard for age-related hearing changes
- Based on otologically normal populations
- Widely cited in audiological research

### Simplified model used
```typescript
// Offset from age 20 (baseline)
const ageOffset = Math.max(0, age - 20);

// Higher frequencies show more age-related loss
return {
  250:  { median: ageOffset * 0.1 },
  1000: { median: ageOffset * 0.2 },
  4000: { median: ageOffset * 0.7 },
  8000: { median: ageOffset * 1.0 },
};
```

### Example: 43-year-old
| Frequency | Expected Median | 90th Percentile |
|-----------|-----------------|-----------------|
| 250 Hz | ~2 dB | ~15 dB |
| 1000 Hz | ~5 dB | ~18 dB |
| 4000 Hz | ~16 dB | ~40 dB |
| 8000 Hz | ~23 dB | ~55 dB |

## Consequences
### Positive
- Users understand their results in context
- Reduces anxiety about "abnormal" age-related decline
- Educational about hearing and aging

### Negative
- Simplified model, not full ISO 7029 calculation
- Assumes male thresholds (females typically better)
- Individual variation is large

## Future Improvements
- Add gender selection for more accurate expectations
- Include confidence intervals
- Link to sources explaining age-related hearing loss

