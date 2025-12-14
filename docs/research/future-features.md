# Future Features Research

## Overview
Prioritized list of potential features based on value vs implementation effort.

---

## 🎯 High Priority (High Value, Low-Medium Effort)

### 1. PDF Export
**Value:** High | **Effort:** ~2-3 hours

Export audiogram and summary as a PDF to share with healthcare providers.

**Technical approach:**
- Use `html2canvas` + `jsPDF` or `@react-pdf/renderer`
- Include audiogram image, thresholds table, summary text
- Add disclaimer and date

**Resources:**
- [jsPDF documentation](https://github.com/parallax/jsPDF)
- [html2canvas](https://html2canvas.hertzen.com/)

---

### 2. Profile Comparison (Trend View)
**Value:** High | **Effort:** ~3-4 hours

Overlay multiple audiograms to track hearing changes over time.

**Technical approach:**
- Select 2-3 profiles from history
- Draw on same audiogram with different opacity/style
- Show delta values (e.g., "+5 dB at 4kHz since last test")

**UI concept:**
```
[Profile 1: Jan 2024] ●━━━━━━━━━━━
[Profile 2: Jun 2024] ●━━━━━━━━━━━ (selected)
[Profile 3: Dec 2024] ●━━━━━━━━━━━ (selected)

[Compare Selected]
```

---

### 3. PWA / Offline Support
**Value:** Medium-High | **Effort:** ~2-3 hours

Make the app installable and work offline.

**Technical approach:**
- Add `manifest.json` with app metadata
- Implement service worker for caching
- Vite PWA plugin simplifies this

**Resources:**
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/)

---

### 4. Extended Frequencies
**Value:** Medium | **Effort:** ~1-2 hours

Add inter-octave frequencies for more detailed testing.

**Frequencies to add:**
- 125 Hz (low bass)
- 750 Hz (between 500-1000)
- 1500 Hz (between 1000-2000)
- 3000 Hz (between 2000-4000)
- 6000 Hz (between 4000-8000)

**Consideration:** Make this optional ("Detailed Test" mode)

---

## 🔬 Medium Priority (High Value, Higher Effort)

### 5. Speech-in-Noise Test
**Value:** Very High | **Effort:** ~8-10 hours

Test ability to understand speech with background noise - more practical than pure tones.

**Technical approach:**
1. Pre-record word lists (standardized like CNC or NU-6)
2. Mix with babble noise at various SNR levels
3. User types/selects what they heard
4. Score as percentage correct at each SNR

**Challenges:**
- Need high-quality recordings
- Multiple language support
- Copyright considerations for standardized lists

**Resources:**
- [QuickSIN test](https://www.etymotic.com/product/quicksin/)
- Open source word lists needed

---

### 6. Tinnitus Frequency Matcher
**Value:** Medium | **Effort:** ~4-5 hours

Help users identify the frequency of their tinnitus.

**Technical approach:**
1. Play adjustable frequency tone
2. User matches to their tinnitus pitch
3. Fine-tune with smaller steps
4. Record frequency and loudness

**UI concept:**
```
Frequency: [====●==========] 4200 Hz
           Low            High

Loudness:  [==●============] 35 dB
           Quiet          Loud

[This matches my tinnitus]
```

---

### 7. Better Calibration
**Value:** Medium-High | **Effort:** ~3-4 hours

Improve accuracy with reference-based calibration.

**Approaches:**
1. **Reference tone comparison** - "Adjust until this sounds like normal speech volume"
2. **Known headphone profiles** - Frequency response curves for popular models
3. **Microphone feedback** - Use mic to measure actual output (requires permissions)

---

## 🚀 Experimental (High Effort, Potentially High Value)

### 8. Real-time Hearing Compensation
**Value:** Very High | **Effort:** ~15-20 hours

Process audio in real-time to boost frequencies where user has hearing loss.

**Technical approach:**
1. Create AudioWorklet for real-time processing
2. Apply EQ curve based on audiogram
3. Process microphone input or media playback

**Challenges:**
- Latency must be <20ms for real-time use
- CPU usage on mobile devices
- Browser security restrictions on audio routing

**Resources:**
- [AudioWorklet specification](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorklet)
- Consider WASM for complex processing

---

### 9. Hearing Aid Simulation
**Value:** High | **Effort:** ~20+ hours

Simulate how different hearing aid settings would sound.

**Technical approach:**
- Implement common hearing aid algorithms (WDRC, NAL-NL2)
- Apply compression and frequency shaping
- A/B comparison with unprocessed audio

**Note:** This is complex and may require audio engineering expertise.

---

### 10. Ultrasonic/Infrasonic Detection (Hardware Required)
**Value:** Fun/Educational | **Effort:** N/A (hardware dependent)

Original "superhuman hearing" concept.

**Hardware options:**
| Device | Price | Frequency Range |
|--------|-------|-----------------|
| DIY Bat Detector Kit | £40-80 | Up to 100 kHz |
| Ultramic USB | €200-300 | Up to 192 kHz |
| MEMS mic + Teensy | ~$30 DIY | Up to 80 kHz |

**Limitation:** Cannot be done with standard browser/hardware.

---

## 📊 Analytics & Community (Optional)

### 11. Anonymous Aggregate Statistics
Show users how they compare to others in their age group.

**Approach:**
- Opt-in data collection
- Store only aggregate statistics (no PII)
- Display percentile ranking

### 12. Multi-language Support
Internationalization for broader reach.

**Priority languages:**
1. Spanish
2. Chinese
3. Hindi
4. French
5. German

**Effort:** ~5-6 hours with i18n library

---

## Implementation Order Recommendation

| Phase | Features | Total Effort |
|-------|----------|--------------|
| **Phase 1** | PDF Export, Profile Comparison | ~6 hours |
| **Phase 2** | PWA Support, Extended Frequencies | ~4 hours |
| **Phase 3** | Speech-in-Noise, Tinnitus Matcher | ~14 hours |
| **Phase 4** | Hearing Compensation (if demand) | ~20 hours |

