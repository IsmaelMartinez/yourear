# Hacker News Show HN Post

## Title Options (choose one)

1. **Show HN: YourEar – Open-source browser hearing test with offline support**
2. **Show HN: Privacy-first hearing assessment built with Web Audio API**
3. **Show HN: Free hearing test – no accounts, no tracking, works offline**

---

## Post Content

**YourEar** is a comprehensive hearing assessment tool that runs entirely in your browser. I built it because I wanted to track my hearing over time without creating accounts on hearing aid company websites that use tests as lead generation.

**Features:**
- Pure-tone audiometry (simplified Hughson-Westlake procedure)
- Speech-in-noise testing
- Tinnitus frequency matcher
- Profile comparison over time
- PDF export for sharing with healthcare providers
- PWA – works offline, installable
- Multi-language support (EN, ES, FR, DE, ZH)

**Privacy-first:**
- No accounts required
- No cloud storage
- All data stored in localStorage
- No analytics or tracking

**Tech:**
- Vanilla TypeScript (no framework)
- Web Audio API for tone generation
- Canvas API for audiograms
- vite-plugin-pwa for offline support

**Limitations (I'm upfront about these):**
- Consumer hardware isn't calibrated like professional audiometers
- Results may vary ±15-25 dB from clinical measurements
- This is a screening tool, not a medical device
- Best for tracking relative changes over time with consistent setup

**Backstory:** This started as an idea at a Web Audio hackathon 10 years ago. Back then, building something this comprehensive would have taken months. AI-assisted development finally made it possible – not by writing everything, but by dramatically accelerating iteration cycles so I could focus on the interesting problems: audio signal processing, clinical accuracy research, and privacy architecture.

**Live:** https://ismaelmartinez.github.io/yourear/

**Source:** https://github.com/ISMAELMARTINEZ/yourear (MIT license)

Would love feedback from anyone in audiology or audio engineering. The calibration problem is genuinely hard – any ideas for improving accuracy with uncalibrated consumer hardware?

---

## Anticipated Questions & Answers

### "How accurate is this?"

Estimated ±15-25 dB from clinical measurements. The main issues are:
1. Consumer audio hardware isn't calibrated to known SPL levels
2. User's environment isn't a sound booth
3. No bone conduction testing to differentiate hearing loss types

That said, **relative accuracy is better** – if you use the same headphones in the same environment, tracking changes over time is more reliable than absolute measurements.

### "Why not just go to an audiologist?"

You should! This is a screening tool for:
- Curious people who want to understand their hearing
- Musicians/audio professionals who want to track exposure over time
- Anyone between professional checkups who wants relative monitoring
- People in areas without easy audiologist access

### "Why vanilla TypeScript instead of React/Vue/etc?"

The app is simple enough that a framework would be overhead. The screens/ pattern works well, state management is trivial, and it keeps the bundle small. Also, it's a personal project – I used what I enjoy.

### "Could you calibrate using a reference sound?"

Yes! The app now includes reference tone calibration where users adjust a 1000 Hz tone to match "conversational speech level." It's not perfect but provides a meaningful baseline.

### "Why not use the microphone to measure actual output levels?"

I added ambient noise detection (microphone measures room noise before testing), but measuring the actual headphone output would require:
- A second device with a calibrated microphone
- Placing the microphone where the ear would be
- Most people don't have this setup

### "What about masking noise to prevent cross-hearing?"

It's on the roadmap. Currently, if someone has asymmetric hearing loss, the better ear might "help" detect tones meant for the worse ear via bone conduction. Adding narrow-band masking noise to the non-test ear would help.

---

## Best Time to Post

Tuesday or Wednesday, 9-10am PST (12-1pm EST, 5-6pm GMT)

---

## Follow-up Comments to Prepare

### Technical deep-dive comment
"For those curious about the implementation: the Hughson-Westlake procedure is a threshold-seeking algorithm. Start at 40 dB, decrease by 10 dB when heard, increase by 5 dB when not heard (ascending). Threshold is the level heard 2+ times while ascending. Web Audio's OscillatorNode with smooth gain envelopes (20ms ramps) prevents click artifacts. The tricky part is the calibration reference – I chose -60 dBFS as 0 dB HL, giving headroom up to 90 dB HL testing range."

### Accessibility comment
"Accessibility was interesting to implement for a tool targeting people with potential hearing impairment. The UI uses ARIA labels throughout, supports reduced motion preferences, has keyboard navigation (Space/Enter for 'heard', N/Escape for 'not heard'), and uses high-contrast colors. The irony of needing good vision to take a hearing test isn't lost on me."

