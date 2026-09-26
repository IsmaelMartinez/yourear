# Hardware Limitations Research

## Overview
Understanding the physical constraints of consumer audio hardware for hearing assessment.

---

## 🎧 Headphones/Speakers

### Frequency Response
| Device Type | Typical Range | Notes |
|-------------|---------------|-------|
| Earbuds (cheap) | 100 Hz - 16 kHz | Weak bass, rolled-off highs |
| Consumer headphones | 20 Hz - 20 kHz | Claimed, not flat |
| Audiophile headphones | 10 Hz - 40 kHz | Extended but not useful for hearing |
| Laptop speakers | 200 Hz - 15 kHz | Very limited |

### Key Issue: No Calibration
- Same "60 dB" signal sounds different on every device
- No way to know absolute SPL without measurement
- **Mitigation:** Use relative measurements, not absolute

### Recommendations for Users
1. Use over-ear headphones (not earbuds)
2. Use same headphones for all tests
3. Avoid Bluetooth (adds latency, may compress)

---

## 🎤 Microphones

### Built-in Microphone Limitations
| Device | Typical Range | Issues |
|--------|---------------|--------|
| MacBook | 80 Hz - 15 kHz | Optimized for voice |
| iPhone | 100 Hz - 16 kHz | AGC can interfere |
| USB podcasting mic | 20 Hz - 20 kHz | Better but still limited |

### For Ultrasonic Detection
Standard microphones cannot capture frequencies above ~20 kHz.

**Specialized options:**
| Microphone | Price | Max Frequency |
|------------|-------|---------------|
| Ultramic UM192K | €200 | 96 kHz |
| SMM-U1 | €294 | 190 kHz |
| SPU0410LR5H MEMS | $5 | 80 kHz (DIY) |

---

## 📊 Audio Interface / DAC

### Sampling Rate Constraints
| Sampling Rate | Max Frequency (Nyquist) |
|---------------|-------------------------|
| 44.1 kHz | 22.05 kHz |
| 48 kHz | 24 kHz |
| 96 kHz | 48 kHz |
| 192 kHz | 96 kHz |

**Browser default:** Usually 44.1 kHz or 48 kHz

### Bit Depth
- 16-bit: ~96 dB dynamic range
- 24-bit: ~144 dB dynamic range

**For audiometry:** 16-bit is sufficient (human hearing ~120 dB range)

---

## 🔊 Volume/Gain Considerations

### Safe Listening Levels
| Duration | Max Level |
|----------|-----------|
| 8 hours | 85 dB |
| 2 hours | 91 dB |
| 15 min | 100 dB |
| Seconds | 110 dB |

### Our Test Configuration
- Max level: 90 dB HL
- Tone duration: 1-1.5 seconds
- **Safe for extended testing**

### Output Level Mapping
`src/audio/tone-generator.ts` maps hearing level to digital output with a fixed reference of 0 dB HL = -90 dBFS, one dB of output per dB HL. The test range therefore runs from -100 dBFS at -10 dB HL to 0 dBFS at 90 dB HL, so every 5 dB step up to the maximum is a distinct, louder tone and nothing in the range clips. An earlier reference of -60 dBFS reached full scale at 60 dB HL, which made 60-90 dB HL sound identical (issue #89).

Because the mapping is linear, every level sits a fixed distance from the 40 dB HL calibration tone (-50 dBFS): 90 dB HL is always 50 dB louder than the tone the user sets a comfortable volume against, and results recorded under the old reference remain comparable below 60 dB HL. The trade-off is that the calibration tone is 30 dB quieter at a given system volume, so users turn the device volume up further during calibration. On 16-bit outputs the quietest levels (around -10 to 0 dB HL) sit near the ~-96 dBFS quantisation floor; Web Audio renders in 32-bit float and most current DACs are 24-bit, and those levels are below where consumer hardware can be trusted anyway.

---

## 🌐 Browser Constraints

### Web Audio API Limitations
1. **Autoplay policy** - Requires user interaction before playing audio
2. **AudioContext states** - Must handle suspended/running states
3. **No AudioContext in Workers** - Limits parallel processing options
4. **Mobile throttling** - Background tabs may pause audio

### Cross-Browser Differences
| Feature | Chrome | Firefox | Safari |
|---------|--------|---------|--------|
| OscillatorNode | ✅ | ✅ | ✅ |
| StereoPannerNode | ✅ | ✅ | ✅ |
| AudioWorklet | ✅ | ✅ | ✅ (14.1+) |
| High sample rates | ✅ | ✅ | Limited |

---

## 🆚 Professional Audiometry Comparison

| Aspect | Clinical | YourEar |
|--------|----------|---------|
| Calibration | dB SPL traceable to ISO | None |
| Environment | Sound booth (<30 dB) | User's room |
| Transducers | Calibrated headphones | Consumer devices |
| Bone conduction | Yes | No |
| Masking | Yes | No |
| Accuracy | ±5 dB | ±10-15 dB (estimated) |

---

## 💡 Practical Recommendations

### For Users
1. **Use headphones, not speakers** - Better isolation
2. **Find quiet environment** - Background noise affects results
3. **Same setup each time** - For consistent comparison
4. **Don't trust absolute values** - Focus on relative changes

### For Development
1. **Acknowledge limitations** in UI
2. **Don't claim medical accuracy**
3. **Focus on tracking changes** over time
4. **Consider "calibration reference"** sounds in future

---

## 🔬 Future Hardware Research

### Potential Projects
1. **DIY Ultrasonic Mic** - ESP32 + MEMS mic for bat detection
2. **Calibrated USB Device** - Arduino with known speaker for reference
3. **Mobile App with Calibration** - Use phone's sensors for room noise measurement

### Commercial Partnerships
- Could partner with headphone manufacturers for device-specific calibration profiles
- Some hearing aid companies have APIs for integration

