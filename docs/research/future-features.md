# Future Features Research

## Overview
Prioritized list of potential features based on value vs implementation effort.

---

## 🎯 High Priority (High Value, Low-Medium Effort)

### 1. ~~PDF Export~~ ✅ IMPLEMENTED
**Value:** High | **Effort:** ~2-3 hours

Export audiogram and summary as a PDF to share with healthcare providers.

**Implementation:** Using jsPDF to generate PDFs with audiogram image, thresholds table, and summary.

---

### 2. ~~Profile Comparison (Trend View)~~ ✅ IMPLEMENTED
**Value:** High | **Effort:** ~3-4 hours

Overlay multiple audiograms to track hearing changes over time.

**Implementation:** ComparisonAudiogram class with selection UI for 2-5 profiles, PTA change summary between oldest and newest tests.

---

### 3. ~~PWA / Offline Support~~ ✅ IMPLEMENTED
**Value:** Medium-High | **Effort:** ~2-3 hours

Make the app installable and work offline.

**Implementation:** Using vite-plugin-pwa with workbox for service worker generation and asset caching.

---

### 4. ~~Extended Frequencies~~ ✅ IMPLEMENTED
**Value:** Medium | **Effort:** ~1-2 hours

Add inter-octave frequencies for more detailed testing.

**Implementation:** Added "Detailed Test" mode with 11 frequencies including 125, 750, 1500, 3000, and 6000 Hz.

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

### 6. ~~Tinnitus Frequency Matcher~~ ✅ IMPLEMENTED
**Value:** Medium | **Effort:** ~4-5 hours

Help users identify the frequency of their tinnitus.

**Implementation:** Continuous adjustable tone (100 Hz - 12 kHz) with real-time frequency and volume sliders, fine-tuning mode for precise matching.

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

| Phase | Features | Effort | Status |
|-------|----------|--------|--------|
| **Phase 1** | PDF Export, Profile Comparison | ~6 hours | ✅ DONE |
| **Phase 2** | PWA Support, Extended Frequencies | ~4 hours | ✅ DONE |
| **Phase 3** | Speech-in-Noise, Tinnitus Matcher | ~14 hours | Partial (Tinnitus ✅) |
| **Phase 4** | Hearing Compensation (if demand) | ~20 hours | Pending |

---

## 🔧 Related Documentation

- **[Hardware Limitations](./hardware-limitations.md)** - Physical constraints of consumer audio
- **[Clinical Accuracy](./clinical-accuracy.md)** - Comparison with professional audiometry

