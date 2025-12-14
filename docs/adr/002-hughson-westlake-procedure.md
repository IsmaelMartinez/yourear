# ADR 002: Simplified Hughson-Westlake Procedure

## Status
Accepted

## Context
Need a method to determine hearing thresholds at each frequency. Options:
1. Fixed level presentation (simple but inaccurate)
2. Full Hughson-Westlake procedure (clinical standard)
3. Simplified Hughson-Westlake (balance of accuracy and simplicity)

## Decision
Implement a **simplified Hughson-Westlake procedure**:
1. Start at 40 dB HL (clearly audible for most)
2. Decrease by 10 dB when heard (descending)
3. Increase by 5 dB when not heard (ascending)
4. Threshold = level heard twice while ascending

## Rationale
- **Clinical basis** - Based on ISO 8253-1 standard
- **Adaptive** - Adjusts to user's hearing level
- **Efficient** - Converges quickly (~4-6 presentations per frequency)
- **Simple to implement** - Clear state machine logic

## Consequences
### Positive
- Reasonable accuracy for self-assessment
- Familiar to audiologists reviewing results
- ~8 minutes for full test (6 frequencies × 2 ears)

### Negative
- Not as accurate as full clinical procedure (2/3 ascending responses)
- No masking noise for cross-hearing prevention
- Results are relative, not absolute dB SPL

## Algorithm
```
START at 40 dB
  ↓ HEARD → decrease 10 dB
  ↓ NOT HEARD → increase 5 dB (now ASCENDING)
  ↓ ASCENDING + HEARD → count responses at this level
  ↓ COUNT ≥ 2 → THRESHOLD FOUND
```

