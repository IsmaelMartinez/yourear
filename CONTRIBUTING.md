# Contributing to YourEar

Contributions are welcome! This document provides guidelines for contributing to the project.

## Getting Started

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
npm run test        # Watch mode
npm run test:run    # Single run
npm run test:coverage  # With coverage report
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
│   │   ├── tone-generator.ts # Pure tone synthesis (Web Audio API)
│   │   ├── tinnitus-tone.ts  # Adjustable tone for tinnitus matching
│   │   ├── speech-noise.ts   # Noise generator and speech synthesis
│   │   └── hearing-test.ts   # Test logic (Hughson-Westlake procedure)
│   ├── ui/
│   │   ├── audiogram.ts      # Canvas audiogram visualization
│   │   └── comparison-audiogram.ts  # Multi-profile overlay chart
│   ├── storage/
│   │   └── profile.ts        # LocalStorage management
│   ├── state/
│   │   └── app-state.ts      # Centralized state management
│   ├── services/
│   │   ├── test-runner.ts    # Test lifecycle management
│   │   └── pdf-export.ts     # PDF report generation
│   ├── utils/
│   │   └── dom.ts            # DOM helper utilities
│   └── types/
│       └── index.ts          # TypeScript interfaces & utilities
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
3. Ensure tests pass (`npm run test:run`)
4. Submit a PR to `main`

All PRs require CI to pass before merging.

