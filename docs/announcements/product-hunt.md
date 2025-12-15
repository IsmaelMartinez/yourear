# Product Hunt Launch Materials

## Product Name
**YourEar**

## Tagline (60 characters max)
"Open-source hearing test that respects your privacy"

**Alternatives:**
- "Your hearing. Your data. Your ears."
- "Free hearing assessment, works offline, no tracking"
- "Privacy-first browser hearing test with Web Audio API"

---

## Description (260 characters for short)

YourEar is a comprehensive hearing assessment tool that runs in your browser. Test your hearing, match your tinnitus frequency, and track changes over time. No accounts, no tracking, works offline. Open source and free forever.

---

## Full Description

### The Problem

Most online hearing tests are lead generation tools for hearing aid companies. They collect your personal data and email to funnel you toward product purchases. There was no privacy-respecting, feature-complete option for people who simply want to understand and track their hearing.

### The Solution

YourEar is a comprehensive hearing assessment suite that runs entirely in your browser:

**Three Test Types:**
- **Pure-Tone Audiometry** – Tests at standard frequencies (250-8000 Hz) using the clinical Hughson-Westlake procedure
- **Speech-in-Noise Test** – Measures hearing ability in noisy environments
- **Tinnitus Frequency Matcher** – Helps identify and describe your tinnitus

**Privacy-First Architecture:**
- No accounts required
- No cloud storage – all data stays in your browser's localStorage
- No analytics or tracking
- Works offline as an installable PWA

**Useful Features:**
- Save and compare multiple hearing profiles over time
- Export results as PDF for sharing with healthcare providers
- Age-based comparison with expected thresholds
- Volume calibration for improved accuracy
- Ambient noise detection before testing
- Multi-language support (English, Spanish, French, German, Chinese)

**Important Disclaimer:**
This is NOT a medical device. Results are indicative only and cannot replace professional audiological evaluation. Consumer audio hardware isn't calibrated like clinical audiometers, so results are best used for tracking relative changes over time.

### The Story

This project started as a sketch at a Web Audio hackathon 10 years ago. Building something this comprehensive would have taken months of full-time work back then. AI-assisted development finally made it possible to tackle properly – not by replacing the work, but by accelerating iteration cycles so I could focus on the interesting problems: audio signal processing, clinical procedure implementation, and privacy architecture.

---

## Topics/Categories

- Developer Tools
- Health & Fitness
- Open Source
- Privacy
- Accessibility

---

## First Comment (Maker's Comment)

Hey Product Hunt! 👋

I'm excited to share YourEar – a project that's been in my head for a decade and finally became real.

**Why I built this:**

Like many developers and musicians, I've been curious about my hearing for years. But every online hearing test I found was either:
- A lead generation funnel for hearing aid companies
- A single-purpose tool without history tracking
- Requiring email signup and data collection

I wanted something different: a comprehensive tool that respects privacy, works offline, and helps track hearing changes over time.

**What makes it different:**

1. **Privacy-first** – No accounts, no cloud, no tracking. Your data never leaves your browser.

2. **Comprehensive** – Three test types (pure tone, speech-in-noise, tinnitus matching) vs competitors' single test.

3. **Transparent** – I'm upfront about limitations. Consumer hardware isn't calibrated, so results are best for tracking relative changes.

4. **Open source** – MIT licensed, audit the code yourself.

**Limitations I want to be honest about:**

- This is a screening tool, not a medical device
- Accuracy is ±15-25 dB from clinical measurements
- Best used for tracking changes with consistent setup
- If you have hearing concerns, please see an audiologist!

Would love feedback from:
- Audiologists or hearing specialists
- Audio engineers
- Anyone who's used other hearing tests

What features would make this more useful for you?

---

## Media Assets Needed

### Screenshots (1270x760px recommended)

1. **Home Screen** – Shows the three test options and latest results
2. **Test in Progress** – Shows the frequency/ear being tested with response buttons
3. **Audiogram Results** – Shows completed audiogram with threshold values
4. **Tinnitus Matcher** – Shows the frequency slider interface
5. **Profile Comparison** – Shows multiple audiograms overlaid

### Animated GIF (optional)

Short demo showing:
1. Starting a test
2. Responding to tones
3. Viewing the audiogram result

### Logo/Icon

The ear emoji (👂) is used as the logo. Consider creating:
- 240x240 square logo for Product Hunt
- Could be the emoji on a dark gradient background matching the app theme

---

## Hunter Notes

- **Timing:** Launch on Tuesday or Wednesday for best visibility
- **Preparation:** Have the Hacker News post ready to cross-post
- **Engagement:** Be active in comments for the first 24 hours
- **Reddit:** Cross-post to r/opensource, r/tinnitus, r/audiology, r/privacy

---

## Social Media Templates

### Twitter/X

```
🚀 Just launched @ProductHunt: YourEar

A privacy-first hearing test that runs in your browser:
✅ No accounts or tracking
✅ Works offline (PWA)
✅ Pure tone + speech-in-noise + tinnitus matching
✅ Track changes over time
✅ Open source (MIT)

Try it: https://ismaelmartinez.github.io/yourear/
```

### LinkedIn

```
Excited to share YourEar – an open-source hearing assessment tool I've been working on.

Most online hearing tests are lead generation for hearing aid companies. I wanted something different: a privacy-respecting tool for people who are simply curious about their hearing.

Features:
• Pure-tone audiometry
• Speech-in-noise testing
• Tinnitus frequency matching
• Profile tracking over time
• PDF export for healthcare providers
• Works offline as a PWA

Built with Web Audio API, TypeScript, and respect for user privacy. No accounts, no tracking, no data collection.

This idea started at a hackathon 10 years ago. AI-assisted development finally made it feasible to build properly.

Try it: https://ismaelmartinez.github.io/yourear/
Source: https://github.com/ISMAELMARTINEZ/yourear

#opensource #privacy #webaudio #healthtech
```

---

## FAQ for Comments

**Q: Is this FDA approved / medically certified?**
A: No. This is a screening tool for awareness and tracking, not a medical device. Always consult a qualified audiologist for professional evaluation.

**Q: How does it compare to Mimi / hearing aid company tests?**
A: Those are typically lead generation tools that collect your data. YourEar is open source, privacy-first, and never asks for your email or personal information.

**Q: Can I use this to fit hearing aids?**
A: No. Hearing aid fitting requires calibrated equipment and professional audiological evaluation. This tool is for screening and tracking only.

**Q: Why doesn't it work on my device?**
A: Requires a modern browser with Web Audio API support. Works best on Chrome, Firefox, Safari, or Edge. Mobile browsers may have limitations.

**Q: Can I contribute?**
A: Yes! It's MIT licensed on GitHub. Issues and PRs welcome.

