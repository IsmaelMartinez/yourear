# ADR 008: Nominal SNR in the Speech-in-Noise Test

## Status
Accepted

## Context
The speech-in-noise test reports an SNR-50: the signal-to-noise ratio at which the user identifies half the words. Noise is pink noise played through Web Audio (`src/audio/speech-noise.ts`). Words are spoken with the Web Speech API (`speechSynthesis`), which plays through the browser's own speech output. That output cannot be routed into an `AudioContext`, so its level cannot be measured or scaled against the noise.

## Decision
Treat the SNR as nominal. Speech plays at `speechSynthesis` full volume, and each SNR step is applied by changing only the noise level (`noiseLevelDbForSNR`). One looping noise source is started per run from a cached pink-noise buffer, and level changes ramp its gain with `setTargetAtTime` rather than rebuilding the source.

## Consequences
### Positive
- No recorded speech assets to ship; works offline with any installed voice
- Steps between SNR levels are consistent, because only the noise moves
- No clicks or doubled noise from restarting sources between words

### Negative
- Absolute SNR depends on the voice, platform and OS speech volume, so scores are not comparable across devices or with clinical SNR-50 values
- The results screen states that the SNR is approximate

### Alternative
Pre-recorded, level-normalised word clips played through Web Audio would give a true SNR, at the cost of bundling audio per word list.
