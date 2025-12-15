# YourEar

**A browser-based hearing assessment tool using the Web Audio API**

> **Try it now:** [https://ismaelmartinez.github.io/yourear/](https://ismaelmartinez.github.io/yourear/)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Web Audio API](https://img.shields.io/badge/Web%20Audio%20API-supported-green.svg)

---

## Disclaimer

> **This is NOT a medical device.** Results are indicative only and cannot replace a professional audiological evaluation. If you have concerns about your hearing, please consult a qualified audiologist.
>
> **No calibration** - Consumer audio hardware isn't calibrated like professional audiometers. Results are relative, not absolute.

---

## Features

- **Pure-tone audiometry** - Tests at standard frequencies (250-8000 Hz) plus inter-octave frequencies
- **Separate ear testing** - Tests right and left ears independently
- **Standard audiogram** - Results displayed following audiological conventions
- **Local storage** - Save your hearing profiles (no account needed)
- **PDF Export** - Export your results to share with healthcare providers
- **Profile Comparison** - Compare multiple tests over time to track changes
- **PWA Support** - Install as an app, works offline
- **Tinnitus Matcher** - Identify your tinnitus frequency and loudness
- **Speech-in-Noise Test** - Measure hearing ability in noisy environments
- **Dark theme** - Easy on the eyes during testing
- **Responsive design** - Works on desktop and mobile
- **Keyboard shortcuts** - Space/Enter to respond "heard", N/Escape for "not heard"

## Getting Started

### Prerequisites

- **Headphones recommended** for accurate results
- Modern browser with Web Audio API support (Chrome, Firefox, Safari, Edge)

### Run Locally

```bash
git clone https://github.com/ISMAELMARTINEZ/yourear.git
cd yourear
npm install
npm run dev
```

The app will open at `http://localhost:3000`

## Understanding Your Results

| dB HL Range | Hearing Level |
|-------------|---------------|
| -10 to 20 | Normal |
| 21 to 25 | Slight loss |
| 26 to 40 | Mild loss |
| 41 to 55 | Moderate loss |
| 56 to 70 | Moderately severe |
| 71 to 90 | Severe loss |
| 91+ | Profound loss |

## How It Works

YourEar uses a simplified **Hughson-Westlake procedure**, a standard method in clinical audiometry:

1. A tone is played at a clearly audible level (40 dB HL)
2. If heard, the level decreases by 10 dB
3. If not heard, the level increases by 5 dB
4. The threshold is the quietest level heard at least 2 times ascending

## Technology Stack

- **Web Audio API** - Pure tone generation and audio processing
- **TypeScript** - Type-safe code
- **Vite** - Fast development and building
- **Canvas API** - Audiogram visualization
- **LocalStorage** - Profile persistence

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- Audiometric standards from ISO 8253-1
- Hearing loss classification from WHO
- Web Audio API specification from W3C

---

Made with care for the curious
