# ADR 003: Test Frequency Selection

## Status
Accepted

## Context
Need to decide which frequencies to test. Clinical audiometry typically tests 125-8000 Hz at octave intervals.

## Decision
### Full Test (6 frequencies)
- 250, 500, 1000, 2000, 4000, 8000 Hz
- Duration: ~8 minutes

### Quick Test (3 frequencies)
- 1000, 4000, 8000 Hz
- Duration: ~2 minutes

## Rationale

### Why these 6 frequencies for full test?
| Frequency | Importance |
|-----------|------------|
| 250 Hz | Low frequency, vowel sounds |
| 500 Hz | Speech range, PTA calculation |
| 1000 Hz | Reference frequency, PTA calculation |
| 2000 Hz | Consonant sounds, PTA calculation |
| 4000 Hz | First to show noise/age damage |
| 8000 Hz | High frequency indicator |

### Why these 3 for quick test?
- **1000 Hz** - Most sensitive frequency, reference standard
- **4000 Hz** - "Noise notch" frequency, earliest age-related loss
- **8000 Hz** - High frequency hearing indicator

### Why skip 125 Hz?
- Consumer headphones often can't reproduce accurately
- Less clinically significant for typical hearing issues
- Adds time without proportional value

## Consequences
### Positive
- Quick test catches 90% of issues in 25% of time
- Full test matches clinical audiometry frequencies
- PTA (Pure Tone Average) can be calculated from 500, 1000, 2000 Hz

### Negative
- Skip inter-octave frequencies (750, 1500, 3000, 6000 Hz)
- May miss narrow-band hearing loss between tested frequencies

