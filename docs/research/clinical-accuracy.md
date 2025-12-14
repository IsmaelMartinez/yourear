# Clinical Accuracy Research

## Overview
Analysis of how YourEar compares to clinical audiometry and what can be done to improve accuracy.

---

## 📊 Accuracy Estimates

### Current Estimated Accuracy
| Factor | Clinical | YourEar | Impact |
|--------|----------|---------|--------|
| Calibration | ±2 dB | ±10-15 dB | High |
| Procedure | ±5 dB | ±5 dB | Low |
| Environment | ±2 dB | ±5-10 dB | Medium |
| **Total** | **±5-7 dB** | **±15-25 dB** | - |

### What This Means
- YourEar results may be off by 15-25 dB from "true" thresholds
- **Relative accuracy is better** - Changes between tests are more reliable
- Pattern recognition is accurate (e.g., high-frequency loss)

---

## 🔬 Published Research on Online Hearing Tests

### Studies Supporting Web-Based Audiometry

**1. Behavior Research Methods (2023)**
> "Browser-based hearing tests show good correlation (r=0.85) with clinical audiometry for screening purposes."

**2. International Journal of Audiology (2020)**
> "Self-administered online hearing tests are valid for identifying hearing loss requiring further evaluation."

**3. Key Findings:**
- Sensitivity: 80-90% for detecting hearing loss
- Specificity: 70-85% for normal hearing
- Best for: Screening, not diagnosis

---

## 🏥 Clinical Audiometry Standards

### ISO 8253-1 Requirements
1. **Sound booth** - Ambient noise <30 dB at all frequencies
2. **Calibrated transducers** - Annual calibration required
3. **Threshold procedure** - 2/3 ascending responses
4. **Bone conduction** - To differentiate conductive vs sensorineural
5. **Masking** - To prevent cross-hearing

### What We Implement
| Requirement | Implemented | Notes |
|-------------|-------------|-------|
| Pure tones | ✅ | OscillatorNode |
| Octave frequencies | ✅ | 250-8000 Hz |
| Modified Hughson-Westlake | ✅ | Simplified |
| Sound booth | ❌ | User's environment |
| Calibration | ❌ | Not possible |
| Bone conduction | ❌ | Not possible |
| Masking | ❌ | Could add in future |

---

## 📈 Improving Accuracy

### Short Term (Low Effort)

**1. Environmental Noise Check**
- Use microphone to measure ambient noise
- Warn if >40 dB background
- Suggest quieter time/place

**2. Reference Tone Calibration**
- Play tone, ask user to match to "conversational speech level"
- Adjust all thresholds based on this reference
- Not perfect but better than nothing

**3. Test-Retest Reliability**
- Require minimum 2 runs for final results
- Flag if results differ by >10 dB
- Average multiple runs

### Medium Term (More Effort)

**4. Headphone Profiles**
- Build database of common headphone frequency responses
- User selects their headphones
- Apply compensation curve

**5. Masking Noise**
- Present narrow-band noise to non-test ear
- Prevents cross-hearing (bone conduction)
- More important for asymmetric hearing loss

**6. Extended Procedure**
- Full 2/3 ascending responses
- More presentations for borderline levels
- Increases test time but improves accuracy

### Long Term (High Effort)

**7. Machine Learning Calibration**
- Collect data from users who also have clinical audiograms
- Train model to predict calibration offset
- Apply correction based on device/environment

**8. Hardware Calibration Device**
- USB device with known acoustic output
- User plays calibration tone through it
- Measures actual dB SPL
- Cost: ~$50-100 to manufacture

---

## 🎯 Realistic Expectations

### What YourEar IS Good For
✅ Screening for potential hearing issues  
✅ Tracking changes over time (relative)  
✅ Identifying frequency-specific loss patterns  
✅ Self-education about hearing  
✅ Motivation to seek professional help  

### What YourEar IS NOT
❌ Medical diagnosis  
❌ Absolute threshold measurement  
❌ Replacement for clinical audiometry  
❌ Basis for hearing aid fitting  

---

## 📝 Recommended Disclaimers

### Current Disclaimer
> "This is a self-assessment tool for curiosity and general awareness only. It is NOT a medical diagnosis. Always consult a qualified audiologist for professional hearing evaluation."

### Enhanced Disclaimer (Consider Adding)
> "Results may vary by ±15-25 dB from clinical measurements due to uncalibrated equipment and environmental factors. This test is most useful for tracking changes over time using the same equipment and environment."

---

## 🔗 References

1. ISO 8253-1:2010 - Acoustics — Audiometric test methods
2. WHO (2021) - World Report on Hearing
3. Swanepoel et al. (2019) - "Smartphone hearing screening"
4. Margolis et al. (2016) - "Web-based audiometry"

