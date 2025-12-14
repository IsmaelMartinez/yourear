# ADR 001: Use Web Audio API for Tone Generation

## Status
Accepted

## Context
We need to generate precise pure tones at specific frequencies (250 Hz - 8000 Hz) for hearing assessment. Options considered:
1. Pre-recorded audio files
2. Web Audio API
3. WebAssembly audio generation

## Decision
Use the **Web Audio API** directly with `OscillatorNode` for tone generation.

## Rationale
- **Native browser support** - No external dependencies needed
- **Precise frequency control** - Can generate exact frequencies programmatically
- **Real-time control** - Volume and timing can be adjusted dynamically
- **Smooth envelopes** - `GainNode` allows fade in/out to prevent audio clicks
- **Stereo panning** - `StereoPannerNode` enables left/right ear isolation

## Consequences
### Positive
- Zero dependencies for audio
- Works offline
- Consistent across modern browsers
- Low latency

### Negative
- No calibration - consumer hardware isn't standardized
- Limited to human hearing range (~20 Hz - 20 kHz)
- Can't capture ultrasonic frequencies for "superhuman hearing" features

## Implementation
```typescript
const oscillator = ctx.createOscillator();
oscillator.type = 'sine';
oscillator.frequency.value = frequency;

const panner = ctx.createStereoPanner();
panner.pan.value = channel === 'left' ? -1 : 1;

oscillator.connect(gainNode).connect(panner).connect(ctx.destination);
```

