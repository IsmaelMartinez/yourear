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

---

## 🔮 Future Possibilities

### Better Calibration
**Effort:** ~3-4 hours

Improve accuracy with reference-based calibration:
- Reference tone comparison ("adjust until this sounds like normal speech")
- Known headphone profiles for popular models
- Microphone feedback to measure actual output

---

### Real-time Hearing Compensation
**Effort:** ~15-20 hours

Process audio in real-time to boost frequencies where user has hearing loss.

**Technical approach:**
- AudioWorklet for real-time processing
- Apply EQ curve based on audiogram
- Process microphone input or media playback

**Challenges:** Latency (<20ms required), CPU usage, browser security restrictions.

---

### Hearing Aid Simulation
**Effort:** ~20+ hours

Simulate how different hearing aid settings would sound.

**Technical approach:**
- Implement WDRC and NAL-NL2 algorithms
- Compression and frequency shaping
- A/B comparison with unprocessed audio

---

### Multi-language Support
**Effort:** ~5-6 hours

Internationalization with priority languages: Spanish, Chinese, Hindi, French, German.

---

### Anonymous Aggregate Statistics
**Effort:** ~4-5 hours

Show users how they compare to others in their age group with opt-in data collection.

---

## 🔧 Related Documentation

- **[Hardware Limitations](./hardware-limitations.md)** - Physical constraints of consumer audio
- **[Clinical Accuracy](./clinical-accuracy.md)** - Comparison with professional audiometry
- **[Code Improvements](./code-improvements.md)** - Completed refactoring summary
