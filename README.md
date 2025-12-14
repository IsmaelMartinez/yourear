# 👂 YourEar

**A browser-based hearing assessment tool using the Web Audio API**

> Discover your hearing capabilities with a simple, beautiful audiometric test right in your browser.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Web Audio API](https://img.shields.io/badge/Web%20Audio%20API-supported-green.svg)

## 🎯 Project Goals

1. **Hearing Assessment** - A system to determine your hearing capabilities across standard audiometric frequencies
2. **Audiogram Visualization** - Display your results in a professional-looking audiogram chart
3. **Profile Storage** - Save and compare your hearing tests over time

## ✨ Features

- 🎵 **Pure-tone audiometry** - Tests at standard frequencies (250-8000 Hz) plus inter-octave frequencies
- 🎧 **Separate ear testing** - Tests right and left ears independently
- 📊 **Standard audiogram** - Results displayed following audiological conventions
- 💾 **Local storage** - Save your hearing profiles (no account needed)
- 📄 **PDF Export** - Export your results to share with healthcare providers
- 📈 **Profile Comparison** - Compare multiple tests over time to track changes
- 📲 **PWA Support** - Install as an app, works offline
- 🔔 **Tinnitus Matcher** - Identify your tinnitus frequency and loudness
- 🌙 **Dark theme** - Easy on the eyes during testing
- 📱 **Responsive design** - Works on desktop and mobile
- ♿ **Keyboard shortcuts** - Space/Enter to respond "heard", N/Escape for "not heard"

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- Modern browser with Web Audio API support (Chrome, Firefox, Safari, Edge)
- **Headphones recommended** for accurate results

### Installation

```bash
# Clone the repository
git clone https://github.com/ISMAELMARTINEZ/yourear.git
cd yourear

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will open at `http://localhost:3000`

#### Demo Mode

To see the app with sample data, append `?demo=true` to the URL:
```
http://localhost:3000/?demo=true
```
This loads a sample hearing profile for testing the UI without running a full test.

### Building for Production

```bash
npm run build
npm run preview
```

## 🔬 How It Works

### The Test Procedure

YourEar uses a simplified **Hughson-Westlake procedure**, which is a standard method in clinical audiometry:

1. A tone is played at a clearly audible level (40 dB HL)
2. If heard, the level decreases by 10 dB
3. If not heard, the level increases by 5 dB
4. The threshold is the quietest level heard at least 2 times ascending

### Understanding Your Results

| dB HL Range | Hearing Level |
|-------------|---------------|
| -10 to 20 | ✅ Normal |
| 21 to 25 | 🟢 Slight loss |
| 26 to 40 | 🟡 Mild loss |
| 41 to 55 | 🟠 Moderate loss |
| 56 to 70 | 🟠 Moderately severe |
| 71 to 90 | 🔴 Severe loss |
| 91+ | 🔴 Profound loss |

## ⚠️ Important Limitations

### Medical Disclaimer

> **This is NOT a medical device.** Results are indicative only and cannot replace a professional audiological evaluation. If you have concerns about your hearing, please consult a qualified audiologist.

### Technical Limitations

1. **No calibration** - Consumer audio hardware isn't calibrated like professional audiometers. Results are relative, not absolute.

2. **Frequency range** - Limited to human hearing range (20 Hz - 20 kHz) due to:
   - Standard audio hardware sampling rates (44.1/48 kHz)
   - Speaker/headphone frequency response limitations

3. **No ultrasonic/infrasonic** - Cannot test frequencies used by bats (~20-200 kHz) or elephants (~5-20 Hz) without specialized hardware.

### Why No "Superhuman Hearing" Feature?

We originally planned to include frequency shifting to "hear like a bat" 🦇, but:

- **Microphones can't capture it** - Most mics top out at ~15-20 kHz
- **Speakers can't play it** - Consumer speakers roll off above 20 kHz
- **Specialized hardware is expensive** - Ultrasonic microphones cost €200-300

If you're interested in this, check out DIY bat detector kits (~£50) which use analog heterodyne circuits to shift ultrasonic frequencies to audible range.

## 🛠️ Technology Stack

- **Web Audio API** - Pure tone generation and audio processing
- **TypeScript** - Type-safe code
- **Vite** - Fast development and building
- **Canvas API** - Audiogram visualization
- **LocalStorage** - Profile persistence

No heavy frameworks - just clean, simple code.

## 📁 Project Structure

```
yourear/
├── src/
│   ├── main.ts               # Application entry point & router
│   ├── styles.css            # All styles (CSS variables, components)
│   ├── screens/              # UI screens (one file per screen)
│   │   ├── home.ts           # Landing page with test options
│   │   ├── calibration.ts    # Age input & headphone testing
│   │   ├── test.ts           # Active hearing test
│   │   ├── results.ts        # Audiogram & summary display
│   │   ├── comparison.ts     # Compare multiple tests over time
│   │   └── tinnitus.ts       # Tinnitus frequency matcher
│   ├── audio/
│   │   ├── tone-generator.ts # Pure tone synthesis (Web Audio API)
│   │   ├── tinnitus-tone.ts  # Adjustable tone for tinnitus matching
│   │   ├── hearing-test.ts   # Test logic (Hughson-Westlake procedure)
│   │   └── hearing-test.test.ts
│   ├── ui/
│   │   ├── audiogram.ts      # Canvas audiogram visualization
│   │   ├── audiogram.test.ts
│   │   └── comparison-audiogram.ts  # Multi-profile overlay chart
│   ├── storage/
│   │   ├── profile.ts        # LocalStorage management
│   │   └── profile.test.ts
│   ├── state/
│   │   └── app-state.ts      # Centralized state management
│   ├── services/
│   │   ├── test-runner.ts    # Test lifecycle management
│   │   └── pdf-export.ts     # PDF report generation
│   ├── utils/
│   │   └── dom.ts            # DOM helper utilities
│   └── types/
│       ├── index.ts          # TypeScript interfaces & utilities
│       └── index.test.ts
├── docs/
│   ├── adr/                  # Architecture Decision Records
│   └── research/             # Research & future planning
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── vitest.config.ts
```

## 🤝 Contributing

Contributions are welcome! Some ideas:

- [x] ~~Add more test frequencies (125 Hz, 750 Hz, 3000 Hz, 6000 Hz)~~ ✅ Implemented (Detailed Test mode)
- [ ] Speech audiometry (word recognition tests)
- [x] ~~Export results as PDF~~ ✅ Implemented
- [x] ~~Compare multiple profiles over time~~ ✅ Implemented
- [x] ~~PWA support (offline use, installable)~~ ✅ Implemented
- [ ] Add masking noise for more accurate testing
- [ ] Implement hearing compensation (EQ based on audiogram)

## 📜 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- Audiometric standards from ISO 8253-1
- Hearing loss classification from WHO
- Web Audio API specification from W3C

---

Made with 🎧 for the curious
