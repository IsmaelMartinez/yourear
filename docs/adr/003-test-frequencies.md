# ADR 003: Test Frequency Selection

## Status
Accepted

## Context
Need to decide which frequencies to test. Clinical audiometry typically tests 125–8000 Hz at octave intervals, with inter-octave frequencies (750, 1500, 3000, 6000 Hz) used when pure-tone averages fall between octaves or when more resolution is needed.

## Decision
Offer three test modes with different frequency coverage/time trade-offs.

### Quick Test (3 frequencies, ~2 min)
- 1000, 4000, 8000 Hz

### Full Test (6 frequencies, ~8 min)
- 250, 500, 1000, 2000, 4000, 8000 Hz

### Detailed Test (11 frequencies, ~15 min)
- 125, 250, 500, 750, 1000, 1500, 2000, 3000, 4000, 6000, 8000 Hz

## Rationale

### Why these frequencies?
| Frequency | Importance |
|-----------|------------|
| 125 Hz | Very low bass, reproduction quality varies by headphones |
| 250 Hz | Low frequency, vowel sounds |
| 500 Hz | Speech range, PTA calculation |
| 750 Hz | Inter-octave, detects narrow-band loss |
| 1000 Hz | Reference frequency, PTA calculation |
| 1500 Hz | Inter-octave, speech intelligibility |
| 2000 Hz | Consonant sounds, PTA calculation |
| 3000 Hz | Inter-octave, noise-induced loss indicator |
| 4000 Hz | First to show noise/age damage ("noise notch") |
| 6000 Hz | Inter-octave, high-frequency loss |
| 8000 Hz | High frequency indicator |

### Why these 3 for Quick Test?
- **1000 Hz** — Most sensitive frequency, reference standard
- **4000 Hz** — "Noise notch" frequency, earliest age-related loss
- **8000 Hz** — High frequency hearing indicator

### Why offer a Detailed Test?
- Captures narrow-band losses that fall between octave frequencies
- Better matches extended clinical audiograms
- Useful for tinnitus frequency context (tinnitus often sits between octave points)

### Why 125 Hz only in Detailed?
- Consumer headphones often can't reproduce 125 Hz accurately
- Less clinically significant for typical hearing issues
- Keeps the Full Test focused on the most diagnostic frequencies

## Consequences
### Positive
- Quick Test catches common issues in ~25% of Full Test time
- Full Test matches clinical audiometry's standard octave frequencies
- Detailed Test adds inter-octave resolution when users want it
- PTA (Pure Tone Average) can be calculated from 500, 1000, 2000 Hz in all three modes

### Negative
- More modes = more UI/UX surface to maintain
- Extended frequencies (125 Hz at the low end; 750, 1500, 3000, 6000 Hz between octaves) stress consumer hardware limits
