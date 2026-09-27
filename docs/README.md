# YourEar Documentation

## 📁 Structure

```
docs/
├── README.md           # This file
├── adr/                # Architecture Decision Records
│   ├── 001-web-audio-api.md
│   ├── 002-hughson-westlake-procedure.md
│   ├── 003-test-frequencies.md
│   ├── 004-local-storage.md
│   ├── 005-no-wasm.md
│   ├── 006-age-based-comparison.md
│   └── 007-accessibility.md
└── research/           # Research & Future Planning
    ├── future-features.md
    ├── hardware-limitations.md
    └── clinical-accuracy.md
```

---

## 📋 Architecture Decision Records (ADRs)

ADRs document significant technical decisions made during development.

| ADR | Title | Status |
|-----|-------|--------|
| [001](adr/001-web-audio-api.md) | Use Web Audio API for Tone Generation | Accepted |
| [002](adr/002-hughson-westlake-procedure.md) | Simplified Hughson-Westlake Procedure | Accepted |
| [003](adr/003-test-frequencies.md) | Test Frequency Selection | Accepted |
| [004](adr/004-local-storage.md) | LocalStorage for Profile Persistence | Accepted |
| [005](adr/005-no-wasm.md) | No WebAssembly for Initial Implementation | Accepted |
| [006](adr/006-age-based-comparison.md) | Age-Based Expected Thresholds | Accepted |
| [007](adr/007-accessibility.md) | Accessibility Implementation | Accepted |
| [008](adr/008-speech-in-noise-levels.md) | SNR in the Speech-in-Noise Test | Accepted |

---

## 🔬 Research Documents

Research documents capture analysis and planning.

| Document | Description |
|----------|-------------|
| [Future Features](research/future-features.md) | Implemented features and roadmap |
| [Hardware Limitations](research/hardware-limitations.md) | Physical constraints of consumer audio hardware |
| [Clinical Accuracy](research/clinical-accuracy.md) | Comparison with professional audiometry |

---

## 🚀 Quick Links

### For Contributors
- See [Future Features](research/future-features.md) for what to work on next
- Check ADRs before making architectural changes
- Follow existing patterns in codebase

### For Users
- Understand [limitations](research/clinical-accuracy.md) of self-assessment
- Learn about [hardware considerations](research/hardware-limitations.md)

---

## 📝 Adding New Documentation

### New ADR
1. Create file: `docs/adr/NNN-title.md`
2. Use template:
   ```markdown
   # ADR NNN: Title
   
   ## Status
   Proposed | Accepted | Deprecated | Superseded
   
   ## Context
   What is the issue?
   
   ## Decision
   What was decided?
   
   ## Consequences
   What are the results?
   ```

### New Research Document
1. Create file in `docs/research/`
2. Include: Overview, Analysis, Recommendations, References

