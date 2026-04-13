# Future Features

## ✅ Implemented Features

| Feature | Description |
|---------|-------------|
| **PDF Export** | Export audiogram and summary as PDF using jsPDF |
| **Profile Comparison** | Overlay 2-5 profiles to track hearing changes over time |
| **PWA Support** | Installable app with offline support via vite-plugin-pwa |
| **Extended Frequencies** | Detailed test with 11 frequencies including inter-octave |
| **Speech-in-Noise Test** | Measure hearing in noise using Web Speech API + pink noise |
| **Tinnitus Matcher** | Identify tinnitus frequency (100Hz-12kHz) and loudness |
| **TypeScript 6** | Major toolchain upgrade (final JS-based compiler release) |

---

## 🗺️ Visual Roadmap

```
                         YOUREAR ROADMAP — April 2026
 ═══════════════════════════════════════════════════════════════════════

 PHASE 0 — FOUNDATIONS (Done)                                    ✅
 ├── Core hearing test (Quick / Full / Detailed)
 ├── Audiogram visualization & PDF export
 ├── Profile history & comparison
 ├── Tinnitus frequency matcher
 ├── Speech-in-noise test
 ├── PWA offline support
 └── TypeScript 6

 ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─

 PHASE 1 — ACCURACY & TRUST          ~8-10 hrs        🎯 Next up
 │
 │  ⏳ Vite 8 upgrade blocked on vite-plugin-pwa peer dep support
 │
 ├─► Environmental Noise Check                         ~2 hrs
 │   Use microphone to detect background noise
 │   and warn if environment is too loud (>40 dB).
 │
 ├─► Reference Tone Calibration                        ~3-4 hrs
 │   "Adjust until this matches conversational speech"
 │   + headphone profiles for popular models.
 │
 └─► Masking Noise                                     ~3-4 hrs
     Narrow-band noise to non-test ear to prevent
     cross-hearing via bone conduction.

 ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─

 PHASE 2 — REACH & ACCESSIBILITY     ~10-11 hrs
 │
 ├─► Multi-language Support (i18n)                     ~5-6 hrs
 │   Spanish, Chinese, Hindi, French, German
 │
 └─► Anonymous Aggregate Statistics                    ~4-5 hrs
     Opt-in age-group comparisons
     ("Your hearing vs. others your age")

 ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─

 PHASE 3 — ADVANCED AUDIO            ~35-40 hrs       🔬 Research
 │
 ├─► Real-time Hearing Compensation                    ~15-20 hrs
 │   AudioWorklet EQ based on audiogram,
 │   process mic input or media playback.
 │
 └─► Hearing Aid Simulation                            ~20+ hrs
     WDRC & NAL-NL2 algorithms,
     A/B comparison with unprocessed audio.

 ═══════════════════════════════════════════════════════════════════════
  Legend:  ✅ Done   🎯 Planned   🔬 Research needed
```

---

## 🔮 Feature Details

### Phase 1 — Accuracy & Trust

#### Environmental Noise Check
**Effort:** ~2 hours

Use the browser microphone API to sample ambient noise before testing:
- Warn if background noise exceeds ~40 dB
- Suggest quieter environment or time of day
- Optional: continuous monitoring during test

#### Reference Tone Calibration
**Effort:** ~3-4 hours

Improve accuracy with reference-based calibration:
- Reference tone comparison ("adjust until this sounds like normal speech")
- Known headphone profiles for popular models
- Microphone feedback to measure actual output

#### Masking Noise
**Effort:** ~3-4 hours

Present narrow-band noise to the non-test ear:
- Prevents cross-hearing via bone conduction
- Particularly important for asymmetric hearing loss
- Standard clinical practice currently missing from the tool

### Phase 2 — Reach & Accessibility

#### Multi-language Support
**Effort:** ~5-6 hours

Internationalization with priority languages: Spanish, Chinese, Hindi, French, German.

#### Anonymous Aggregate Statistics
**Effort:** ~4-5 hours

Show users how they compare to others in their age group with opt-in data collection.

### Phase 3 — Advanced Audio

#### Real-time Hearing Compensation
**Effort:** ~15-20 hours

Process audio in real-time to boost frequencies where user has hearing loss.

**Technical approach:**
- AudioWorklet for real-time processing
- Apply EQ curve based on audiogram
- Process microphone input or media playback

**Challenges:** Latency (<20ms required), CPU usage, browser security restrictions.

#### Hearing Aid Simulation
**Effort:** ~20+ hours

Simulate how different hearing aid settings would sound.

**Technical approach:**
- Implement WDRC and NAL-NL2 algorithms
- Compression and frequency shaping
- A/B comparison with unprocessed audio

---

## 🔧 Related Documentation

- **[Hardware Limitations](./hardware-limitations.md)** - Physical constraints of consumer audio
- **[Clinical Accuracy](./clinical-accuracy.md)** - Comparison with professional audiometry
- **[Code Improvements](./code-improvements.md)** - Completed refactoring summary
