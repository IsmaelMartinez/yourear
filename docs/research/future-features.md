# Future Features

## ✅ Implemented Features

### Phase 1: Core Features (Original Release)

| Feature | Description |
|---------|-------------|
| **PDF Export** | Export audiogram and summary as PDF using jsPDF |
| **Profile Comparison** | Overlay 2-5 profiles to track hearing changes over time |
| **PWA Support** | Installable app with offline support via vite-plugin-pwa |
| **Extended Frequencies** | Detailed test with 11 frequencies including inter-octave |
| **Speech-in-Noise Test** | Measure hearing in noise using Web Speech API + pink noise |
| **Tinnitus Matcher** | Identify tinnitus frequency (100Hz-12kHz) and loudness |

### Phase 2: Accuracy & Internationalization (December 2024)

| Feature | Description |
|---------|-------------|
| **Ambient Noise Detection** | Microphone-based room noise check before testing |
| **Reference Tone Calibration** | User-adjustable calibration to improve accuracy |
| **Headphone Profiles** | Frequency response compensation for 20+ popular models |
| **Multi-language Support** | i18n with EN, ES, FR, DE, ZH translations |
| **Language Selector** | Dropdown to switch languages, persists across sessions |

---

## 🚀 Roadmap

### Priority 1: Enhanced Accuracy (Q1 2025)

#### Masking Noise
**Effort:** ~4-6 hours | **Impact:** High for asymmetric hearing loss

Present narrow-band noise to the non-test ear to prevent cross-hearing via bone conduction.

**Technical approach:**
- Generate narrow-band noise centered on test frequency
- Present to contralateral ear during tone presentation
- Implement clinical masking rules (e.g., 40 dB effective masking)

**Why it matters:** Without masking, someone with asymmetric hearing loss may "hear" tones in their worse ear via bone conduction through the better ear. This is a significant source of error.

---

#### Test-Retest Reliability Mode
**Effort:** ~3-4 hours | **Impact:** Medium

Require multiple test runs and flag inconsistencies.

**Features:**
- Option to require 2+ runs before showing final results
- Flag frequencies where thresholds differ by >10 dB
- Show averaged results with confidence indicators
- Store reliability metrics with profile

---

#### Extended Hughson-Westlake
**Effort:** ~2-3 hours | **Impact:** Low-Medium

Implement full 2/3 ascending responses per ISO 8253-1.

**Current:** Threshold = heard 2x while ascending  
**Full procedure:** Threshold = heard at least 2/3 times at same level while ascending

---

### Priority 2: User Experience (Q1-Q2 2025)

#### Age-Based Results Comparison
**Effort:** ~4-5 hours | **Impact:** High for user understanding

Show expected thresholds for user's age group alongside their results.

**Data sources:**
- ISO 7029 age-related hearing loss data
- Display as shaded "normal range" on audiogram
- Personalized interpretation based on age

**Why it matters:** A 60-year-old with 25 dB thresholds at 4000 Hz is normal; a 25-year-old is not. Context matters.

---

#### Enhanced Results Visualization
**Effort:** ~6-8 hours | **Impact:** Medium

Improve audiogram with:
- Animated drawing of threshold lines
- Hover/tap for detailed frequency information
- Classification zones (normal, mild, moderate, etc.) as colored bands
- High-contrast mode for accessibility
- Bone conduction symbol placeholders (for future expansion)

---

#### Guided Test Mode
**Effort:** ~3-4 hours | **Impact:** Medium

Step-by-step instructions throughout the test for first-time users.

- Tutorial overlay explaining what to expect
- Voice prompts (optional) using Web Speech API
- Progress celebration at milestones
- "You're doing great!" encouragement

---

### Priority 3: Advanced Features (Q2-Q3 2025)

#### Real-time Hearing Compensation Demo
**Effort:** ~15-20 hours | **Impact:** High for awareness

Process audio in real-time to boost frequencies where user has hearing loss.

**Technical approach:**
```
AudioSource → AudioWorklet(EQ based on audiogram) → Output
```

**Use cases:**
- "Hear what you're missing" demonstration with sample audio
- Process microphone input (live conversation)
- Process media playback (YouTube, Spotify via MediaSession)

**Challenges:**
- Latency (<20ms required for natural feel)
- CPU usage on mobile devices
- Browser security restrictions for some audio sources

---

#### Hearing Aid Simulation
**Effort:** ~20+ hours | **Impact:** High for education

Simulate how different hearing aid settings would sound.

**Algorithms to implement:**
- WDRC (Wide Dynamic Range Compression)
- NAL-NL2 prescription fitting formula
- Frequency lowering/transposition
- Noise reduction simulation

**Use cases:**
- Demonstrate benefit of hearing aids to hesitant users
- A/B comparison with unprocessed audio
- Educational tool for audiology students

---

#### Speech Recognition Accuracy Test
**Effort:** ~10-12 hours | **Impact:** Medium

Test word/sentence recognition using standardized word lists.

**Approach:**
- Use standardized word lists (CNC, NU-6)
- Text-to-speech for stimulus
- Multiple choice or type response
- Calculate word recognition score (WRS)

**Benefits:**
- More ecologically valid than pure tones
- Better predictor of real-world hearing ability
- Identifies central auditory processing issues

---

### Priority 4: Platform & Integration (Q3-Q4 2025)

#### Anonymous Aggregate Statistics
**Effort:** ~8-10 hours | **Impact:** Medium

Show users how they compare to others in their age group.

**Privacy-preserving approach:**
- 100% opt-in with clear consent
- Only aggregate, never individual data
- Store only: age bracket, thresholds, device type
- No PII, no tracking, no analytics IDs
- Use differential privacy techniques

**Display:**
- "Your hearing is better than 65% of people your age"
- Percentile charts by frequency
- Population trends visualization

---

#### Telehealth Integration
**Effort:** ~15-20 hours | **Impact:** Medium-High

Allow audiologists to use YourEar as a remote screening tool.

**Features:**
- Shareable result links (encrypted, expiring)
- FHIR-compatible export format
- Audiologist dashboard (separate app)
- Secure video call integration for counseling

**Considerations:**
- HIPAA compliance implications
- Liability and disclaimers
- Professional licensing requirements vary by jurisdiction

---

#### Browser Extension for Safe Listening
**Effort:** ~8-10 hours | **Impact:** Medium

Monitor and protect hearing during media consumption.

**Features:**
- Track cumulative daily listening exposure
- Warn when approaching safe exposure limits
- Auto-reduce volume for hearing protection
- Weekly exposure reports

---

### Priority 5: Research & Experimental (2025+)

#### Machine Learning Calibration
**Effort:** ~40+ hours | **Impact:** High if successful

Train a model to predict calibration offset from device/environment characteristics.

**Data needed:**
- Users who have both clinical audiograms and YourEar results
- Device fingerprints (user-agent, audio hardware)
- Ambient noise measurements
- Headphone profile selections

**Approach:**
- Collect paired data with informed consent
- Train regression model to predict offset
- Apply predicted calibration automatically
- Continuously improve with more data

**Challenges:**
- Requires significant user data
- Privacy implications
- Model generalization across devices

---

#### Otoacoustic Emissions (OAE) Screening
**Effort:** ~30+ hours | **Impact:** High (experimental)

Use device microphone to detect OAEs (sounds produced by healthy cochlea).

**Technical approach:**
- Play stimulus tone through headphones
- Record via earphone microphone (requires compatible earphones)
- Detect DPOAE or TEOAE responses
- Requires very low noise floor

**Challenges:**
- Consumer earphone microphones may not be sensitive enough
- Ambient noise interference
- Calibration extremely difficult
- May not be feasible with current consumer hardware

---

#### Auditory Processing Disorder Screening
**Effort:** ~25+ hours | **Impact:** Medium

Screen for central auditory processing issues beyond peripheral hearing.

**Tests to implement:**
- Dichotic listening (different sounds to each ear)
- Temporal gap detection
- Frequency pattern recognition
- Competing sentences

**Considerations:**
- Normative data needed for interpretation
- Higher cognitive demands on users
- Less standardized than pure-tone audiometry

---

## 🌐 Localization Expansion

### Additional Languages Planned

| Language | Priority | Native Speakers |
|----------|----------|-----------------|
| Hindi | High | 600M+ |
| Portuguese | High | 250M+ |
| Japanese | Medium | 125M |
| Korean | Medium | 80M |
| Arabic | Medium | 400M+ (multiple dialects) |
| Russian | Medium | 150M |
| Italian | Low | 65M |
| Dutch | Low | 25M |

### Localization Improvements
- RTL (right-to-left) support for Arabic
- Cultural adaptation of medical disclaimers
- Region-specific audiological standards references

---

## 📱 Platform Expansion

### Native Mobile Apps (Considered, Lower Priority)
**Status:** PWA is sufficient for most use cases

If native apps become necessary:
- React Native for cross-platform
- Better audio hardware access on iOS
- Push notifications for test reminders
- HealthKit/Google Fit integration

**Reasons to stick with PWA:**
- Single codebase
- Instant updates
- No app store approval process
- Privacy (no store data collection)

---

## 🔬 Related Documentation

- **[Hardware Limitations](./hardware-limitations.md)** - Physical constraints of consumer audio
- **[Clinical Accuracy](./clinical-accuracy.md)** - Comparison with professional audiometry
- **[Code Improvements](./code-improvements.md)** - Completed refactoring summary

---

## 💡 Community Requested Features

*Features suggested by users (to be prioritized based on demand):*

| Feature | Votes | Status |
|---------|-------|--------|
| Dark/light theme toggle | - | Considering (currently dark-only) |
| Keyboard-only mode | - | Partially implemented |
| Voice-guided test | - | Planned |
| Result sharing via QR code | - | Considering |
| Family/multi-user profiles | - | Considering |
| Wear OS / watchOS companion | - | Low priority |

---

## 📊 Feature Prioritization Matrix

```
                    HIGH IMPACT
                        │
    Masking Noise       │    Real-time Compensation
    Age Comparison      │    ML Calibration
                        │    Hearing Aid Sim
    ────────────────────┼────────────────────────
                        │
    Test-Retest         │    OAE Screening
    Extended HW         │    APD Screening
    Guided Mode         │    Telehealth
                        │
                    LOW IMPACT
    
    LOW EFFORT ──────────────────────── HIGH EFFORT
```

---

*Last updated: December 2024*
