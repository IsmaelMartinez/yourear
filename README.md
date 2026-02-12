# YourEar

**Check your hearing from your browser -- no account, no install, no data leaves your device.**

> **Try it now:** [https://ismaelmartinez.github.io/yourear/](https://ismaelmartinez.github.io/yourear/)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Web Audio API](https://img.shields.io/badge/Web%20Audio%20API-supported-green.svg)

## What it does

YourEar plays pure tones through your headphones and measures the quietest level you can hear at each frequency. The result is a standard **audiogram** -- the same chart an audiologist would produce.

**Three test modes:** Quick (~2 min), Full (~8 min), or Detailed (~15 min, including inter-octave frequencies).

**Extra tools:** Tinnitus frequency matcher, speech-in-noise test, PDF export, and profile comparison over time.

All data stays in your browser's local storage. Works offline as a PWA.

Built with **TypeScript**, **Vite**, the **Web Audio API** (tone synthesis), and the **Canvas API** (audiogram charts). No heavy frameworks -- just ~450 KB of production JS.

## Getting started

Grab headphones, open the link above, and tap "Full Test". That's it.

To run locally:

```bash
git clone https://github.com/ISMAELMARTINEZ/yourear.git
cd yourear
npm install
npm run dev
```

## How the test works

YourEar uses a simplified **Hughson-Westlake procedure** (the standard clinical method):

1. A tone plays at 40 dB HL
2. If you hear it, the level drops 10 dB
3. If you don't, it rises 5 dB
4. Your threshold = the quietest level heard 2+ times while ascending

## Understanding your results

| dB HL Range | Hearing Level |
|-------------|---------------|
| -10 to 20 | Normal |
| 21 to 25 | Slight loss |
| 26 to 40 | Mild loss |
| 41 to 55 | Moderate loss |
| 56 to 70 | Moderately severe |
| 71 to 90 | Severe loss |
| 91+ | Profound loss |

## Disclaimer

**This is NOT a medical device.** Consumer headphones aren't calibrated like professional audiometers, so results are relative, not absolute. If you have concerns about your hearing, please consult a qualified audiologist.

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

MIT -- see [LICENSE](LICENSE).
