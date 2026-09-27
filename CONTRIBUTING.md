# Contributing to YourEar

Contributions are welcome! This document provides guidelines for contributing to the project.

## Getting Started

You need Node.js at the version pinned in `.nvmrc` (run `nvm use` if you use nvm), which is the version CI uses.

```bash
# Clone the repository
git clone https://github.com/IsmaelMartinez/yourear.git
cd yourear

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will open at `http://localhost:3000`

### Demo Mode

To see the app with sample data, append `?demo=true` to the URL:
```
http://localhost:3000/?demo=true
```

### Building for Production

```bash
npm run build
npm run preview
```

### Running Tests

```bash
npm test               # Watch mode (keeps running)
npm run test:run       # Single run, as in CI
npm run test:coverage  # With coverage report
npm run typecheck      # Type-check with tsc (Vitest does not type-check)
```

## Project Structure

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
│   │   ├── tinnitus.ts       # Tinnitus frequency matcher
│   │   └── speech-noise.ts   # Speech-in-noise test
│   ├── audio/
│   │   ├── audio-context.ts  # Shared AudioContext singleton
│   │   ├── tone-generator.ts # Pure tone synthesis (Web Audio API)
│   │   ├── tinnitus-tone.ts  # Adjustable tone for tinnitus matching
│   │   ├── speech-noise.ts   # Pink noise and word-clip playback at a set SNR
│   │   ├── noise-meter.ts    # Microphone ambient noise check
│   │   └── hearing-test.ts   # Test logic (Hughson-Westlake procedure)
│   ├── ui/
│   │   ├── audiogram-base.ts # Shared audiogram canvas drawing
│   │   ├── audiogram.ts      # Canvas audiogram visualization
│   │   ├── comparison-audiogram.ts  # Multi-profile overlay chart
│   │   └── threshold-table.ts  # Screen-reader table of plotted values
│   ├── storage/
│   │   └── profile.ts        # LocalStorage management
│   ├── state/
│   │   └── app-state.ts      # Centralized state management
│   ├── services/
│   │   ├── test-runner.ts    # Test lifecycle management
│   │   └── pdf-export.ts     # PDF report generation
│   ├── utils/
│   │   └── dom.ts            # DOM helper utilities
│   ├── test/
│   │   └── web-audio.ts      # Shared Web Audio test stubs
│   └── types/
│       └── index.ts          # TypeScript interfaces & utilities
├── public/speech/            # Word clips for the speech-in-noise test
├── scripts/
│   └── generate-speech-clips.sh  # Regenerates public/speech (espeak-ng + ffmpeg)
├── docs/
│   ├── adr/                  # Architecture Decision Records
│   └── research/             # Research & future planning
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── vitest.config.ts
```

## Ideas for Contributions

### Open Tasks
- Add masking noise for more accurate testing
- Implement hearing compensation (EQ based on audiogram)

### Completed Features
- Extended test frequencies (125 Hz, 750 Hz, 3000 Hz, 6000 Hz) - Detailed Test mode
- Speech audiometry (word recognition tests) - Speech-in-Noise test
- Export results as PDF
- Compare multiple profiles over time
- PWA support (offline use, installable)
- Environmental noise check (optional microphone check on the calibration screen)

## Technical Limitations

### Hardware Constraints

1. **Frequency range** - Limited to human hearing range (20 Hz - 20 kHz) due to:
   - Standard audio hardware sampling rates (44.1/48 kHz)
   - Speaker/headphone frequency response limitations

2. **No ultrasonic/infrasonic** - Cannot test frequencies used by bats (~20-200 kHz) or elephants (~5-20 Hz) without specialized hardware.

### Why No "Superhuman Hearing" Feature?

We originally considered including frequency shifting to "hear like a bat", but:

- **Microphones can't capture it** - Most mics top out at ~15-20 kHz
- **Speakers can't play it** - Consumer speakers roll off above 20 kHz
- **Specialized hardware is expensive** - Ultrasonic microphones cost €200-300

If you're interested in this, check out DIY bat detector kits (~£50) which use analog heterodyne circuits to shift ultrasonic frequencies to audible range.

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes
3. Run `npm run test:run` and `npm run typecheck` and make sure both pass
4. Submit a PR to `main`

All PRs require CI to pass before merging. CI also runs `npm run build`.

