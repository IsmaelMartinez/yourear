# Building a Browser-Based Audiometer: Lessons from Web Audio API

*A technical deep-dive into creating a hearing assessment tool with vanilla TypeScript and Web Audio API*

---

## Introduction

Ten years ago, at a Web Audio hackathon, I sketched out an idea: a browser-based hearing test that could help people understand their hearing without needing specialized equipment. Back then, the Web Audio API was new, browser support was inconsistent, and building something comprehensive would have taken months.

Fast forward to today. The API is mature, browser support is excellent, and AI-assisted development let me finally build it properly. This post walks through the technical challenges and solutions in building **YourEar**, an open-source audiometry tool.

**Live demo:** https://ismaelmartinez.github.io/yourear/  
**Source:** https://github.com/ISMAELMARTINEZ/yourear

---

## The Challenge: Hearing Assessment Without Calibrated Hardware

Clinical audiometry uses:
- **Calibrated headphones** traceable to ISO standards
- **Sound-treated booths** with ambient noise <30 dB
- **Bone conduction testing** to differentiate hearing loss types
- **Masking noise** to prevent cross-hearing

We have none of this. Users have random headphones, noisy apartments, and no way to measure actual SPL output. So what can we actually do?

**The answer: Focus on relative accuracy.** If someone uses the same headphones in the same environment, tracking *changes* over time is meaningful even if absolute values aren't clinically precise.

---

## Pure Tone Generation: The Easy Part

Generating precise sine waves with Web Audio is straightforward:

```typescript
const audioContext = new AudioContext();
const oscillator = audioContext.createOscillator();
oscillator.type = 'sine';
oscillator.frequency.value = 1000; // 1 kHz
oscillator.connect(audioContext.destination);
oscillator.start();
```

But there are gotchas:

### 1. Autoplay Policy

Modern browsers block audio until user interaction. You must handle the `AudioContext` state:

```typescript
async function ensureRunning(): Promise<AudioContext> {
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }
  return audioContext;
}
```

### 2. Click Prevention

Abruptly starting/stopping oscillators creates audible clicks. Use gain envelopes:

```typescript
const gainNode = audioContext.createGain();
const RAMP_TIME = 0.02; // 20ms fade

// Fade in
gainNode.gain.setValueAtTime(0, ctx.currentTime);
gainNode.gain.linearRampToValueAtTime(targetGain, ctx.currentTime + RAMP_TIME);

// Schedule fade out before stop
const stopTime = ctx.currentTime + duration;
gainNode.gain.setValueAtTime(targetGain, stopTime - RAMP_TIME);
gainNode.gain.linearRampToValueAtTime(0, stopTime);
```

### 3. Stereo Panning

Testing each ear separately requires proper channel routing:

```typescript
const panner = audioContext.createStereoPanner();
panner.pan.value = ear === 'left' ? -1 : ear === 'right' ? 1 : 0;
oscillator.connect(gainNode).connect(panner).connect(ctx.destination);
```

---

## The Calibration Problem

This is where it gets hard. "40 dB HL" (hearing level) means something specific: the sound pressure level at which a tone is just audible to someone with normal hearing, standardized per frequency.

**We can't measure actual SPL.** We can only set a gain value relative to digital full scale (dBFS).

### My Approach: Arbitrary Reference

I chose -60 dBFS as the reference for 0 dB HL:

```typescript
const REFERENCE_DB_FS = -60;

function hearingLevelToGain(dbHL: number): number {
  const gainDb = Math.max(-80, Math.min(0, REFERENCE_DB_FS + dbHL));
  return Math.pow(10, gainDb / 20);
}
```

At 0 dB HL, output is very quiet (-60 dBFS). At 90 dB HL, output is moderate (-30 dBFS, clamped). This gives reasonable headroom without risking dangerously loud output.

### User-Adjustable Calibration

To improve accuracy, I added reference tone calibration:

1. Play a 1000 Hz tone at the default reference level
2. Ask user to adjust until it sounds like "normal conversation volume"
3. Store the offset and apply to all measurements

This isn't perfect – users' perception of "conversation volume" varies – but it provides a meaningful baseline for their specific hardware.

---

## Implementing Hughson-Westlake

The Hughson-Westlake procedure is the clinical standard for finding hearing thresholds. I implemented a simplified version:

```
START at 40 dB HL (clearly audible for most)
  ↓
HEARD → decrease 10 dB (descending)
  ↓
NOT HEARD → increase 5 dB (now ascending)
  ↓
ASCENDING + HEARD → count responses at this level
  ↓
COUNT ≥ 2 → THRESHOLD FOUND
```

In code:

```typescript
async respondHeard(): Promise<void> {
  if (this.isAscending) {
    // Count responses at this level
    if (this.lastLevelHeard === this.currentLevel) {
      this.hearCountAtLevel++;
    } else {
      this.lastLevelHeard = this.currentLevel;
      this.hearCountAtLevel = 1;
    }
    
    // Threshold found if heard twice while ascending
    if (this.hearCountAtLevel >= 2) {
      await this.recordThreshold(this.currentLevel);
      return;
    }
  }
  
  // Continue descending
  this.currentLevel -= 10;
  await this.presentTone();
}

async respondNotHeard(): Promise<void> {
  // Switch to ascending mode
  this.isAscending = true;
  this.currentLevel += 5;
  await this.presentTone();
}
```

This converges quickly – typically 4-6 tone presentations per frequency.

---

## Speech-in-Noise Testing

Pure tones test hearing sensitivity, but real-world hearing involves understanding speech in noisy environments. The Speech-in-Noise test measures this differently.

### Generating Pink Noise

Pink noise (1/f spectrum) is perceptually similar to environmental noise:

```typescript
function createPinkNoise(ctx: AudioContext): AudioNode {
  const bufferSize = 2 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  
  // Pink noise algorithm using filtering
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
    b6 = white * 0.115926;
  }
  
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  return source;
}
```

### Speech Synthesis

Web Speech API provides text-to-speech, but with inconsistent voices across browsers:

```typescript
async function speakWord(word: string): Promise<void> {
  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.rate = 0.8;  // Slightly slower for clarity
    utterance.pitch = 1.0;
    utterance.onend = () => resolve();
    speechSynthesis.speak(utterance);
  });
}
```

The test adjusts the signal-to-noise ratio based on responses, finding the SNR-50 (the level at which the user correctly identifies 50% of words).

---

## Tinnitus Frequency Matching

For users with tinnitus, matching the pitch helps describe it to healthcare providers.

The challenge: tinnitus can be at any frequency, and coarse steps miss the target. Solution: two modes.

```typescript
// Coarse mode: logarithmic steps through audible range
const COARSE_FREQUENCIES = [
  100, 150, 200, 300, 400, 500, 750, 
  1000, 1500, 2000, 3000, 4000, 6000, 8000, 10000, 12000
];

// Fine mode: ±100 Hz around current frequency in small steps
function getFineFrequencies(center: number): number[] {
  const step = 10; // 10 Hz resolution
  const range = [];
  for (let f = center - 100; f <= center + 100; f += step) {
    if (f > 0) range.push(f);
  }
  return range;
}
```

The UI uses a continuous slider with real-time frequency updates:

```typescript
slider.addEventListener('input', () => {
  const frequency = parseFloat(slider.value);
  if (isPlaying) {
    oscillator.frequency.linearRampToValueAtTime(
      frequency, 
      audioContext.currentTime + 0.05
    );
  }
});
```

---

## Ambient Noise Detection

Before testing, we check if the environment is too noisy:

```typescript
async function checkAmbientNoise(): Promise<NoiseCheckResult> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    },
  });
  
  const analyser = audioContext.createAnalyser();
  const source = audioContext.createMediaStreamSource(stream);
  source.connect(analyser);
  
  // Sample for 3 seconds
  const samples = [];
  for (let i = 0; i < 30; i++) {
    const data = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(data);
    const rms = Math.sqrt(data.reduce((sum, x) => sum + x*x, 0) / data.length);
    samples.push(20 * Math.log10(rms));
    await sleep(100);
  }
  
  const averageDb = samples.reduce((a, b) => a + b) / samples.length;
  return {
    averageDb,
    isAcceptable: averageDb < -40,
    recommendation: getRecommendation(averageDb),
  };
}
```

We disable browser audio processing to get raw microphone input. The thresholds are relative (we can't know absolute SPL), but consistently noisy environments show higher values.

---

## Accessibility Considerations

The irony: building a hearing test for potentially hearing-impaired users. Key decisions:

### ARIA Labels Throughout

```html
<button aria-label="Play test tone in right ear" aria-describedby="tone-desc">
  Right Ear
</button>
```

### Keyboard Navigation

```typescript
document.addEventListener('keydown', (e) => {
  if (e.key === ' ' || e.key === 'Enter') {
    respondHeard();
  } else if (e.key === 'n' || e.key === 'Escape') {
    respondNotHeard();
  }
});
```

### Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  .sound-wave__bar {
    animation: none !important;
  }
}
```

### Screen Reader Announcements

```typescript
function announce(message: string): void {
  const announcer = document.getElementById('announcer');
  announcer.setAttribute('aria-live', 'polite');
  announcer.textContent = message;
}
```

---

## PWA for Offline Use

Hearing tests are often done in quiet places without internet. PWA support with `vite-plugin-pwa`:

```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'YourEar',
        short_name: 'YourEar',
        theme_color: '#05050a',
        icons: [/* ... */],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg}'],
      },
    }),
  ],
});
```

All profile data is in `localStorage`, so the app is fully functional offline.

---

## What Clinical Audiometry Does That We Can't

To be honest about limitations:

| Feature | Clinical | YourEar |
|---------|----------|---------|
| Calibrated transducers | ✅ Annual calibration | ❌ Consumer headphones |
| Sound booth | ✅ <30 dB ambient | ❌ User's environment |
| Bone conduction | ✅ Differentiates loss types | ❌ Not possible |
| Masking | ✅ Prevents cross-hearing | ❌ Planned feature |
| Accuracy | ±5 dB | ±15-25 dB (estimated) |

---

## Lessons Learned

1. **Embrace limitations.** Be transparent about what the tool can't do. Users appreciate honesty.

2. **Relative > Absolute.** When you can't measure absolute values, focus on tracking changes.

3. **Smooth everything.** Web Audio clicks are jarring. Ramp all gains.

4. **Test across browsers.** Safari has quirks. AudioWorklet support varies. Test early.

5. **Privacy is a feature.** Not collecting data is a conscious design choice that users value.

---

## Future Directions

- **Headphone profiles:** Compensate for known frequency response curves
- **Masking noise:** Prevent cross-hearing in asymmetric loss
- **Real-time hearing compensation:** EQ audio to boost user's weak frequencies
- **Machine learning calibration:** Train on users who have clinical audiograms

---

## Try It

**Live:** https://ismaelmartinez.github.io/yourear/  
**Source:** https://github.com/ISMAELMARTINEZ/yourear (MIT license)

Feedback welcome – especially from audiologists and audio engineers who can help improve accuracy.

---

*This project was built with vanilla TypeScript, Web Audio API, and respect for user privacy. No frameworks, no analytics, no data collection.*

