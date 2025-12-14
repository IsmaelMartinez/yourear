# ADR 005: No WebAssembly for Initial Implementation

## Status
Accepted

## Context
WebAssembly (WASM) was considered for performance-critical audio processing. Evaluated for:
1. Tone generation
2. Real-time audio processing
3. Complex DSP algorithms

## Decision
**Do not use WebAssembly** for the initial implementation. Use pure TypeScript with Web Audio API.

## Rationale

### Why WASM was considered
- Near-native performance
- Could enable complex real-time audio processing
- Future-proof for advanced features

### Why we rejected it (for now)
1. **Not needed for current features**
   - `OscillatorNode` handles tone generation natively
   - No heavy DSP required for basic audiometry

2. **Integration challenges**
   - `AudioContext` cannot run in Web Workers
   - `SharedArrayBuffer` not supported by Web Audio API
   - Would require complex data copying between threads

3. **Complexity vs. value**
   - Adds build complexity (Rust/C++ toolchain)
   - Increases bundle size
   - Minimal performance gain for simple tones

## Consequences
### Positive
- Simpler build process (TypeScript only)
- Smaller bundle size
- Easier to maintain and contribute to
- Faster development iteration

### Negative
- May need to revisit for advanced features:
  - Real-time hearing compensation
  - Complex audio analysis
  - Pitch detection/shifting

## When to Reconsider
- Implementing real-time audio processing (hearing aids simulation)
- Adding speech-in-noise testing with complex filtering
- Performance issues with AudioWorklet processing

