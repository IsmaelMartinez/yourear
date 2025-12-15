# YourEar Documentation

## 📁 Structure

```
docs/
├── README.md              # This file
├── adr/                   # Architecture Decision Records
│   ├── 001-web-audio-api.md
│   ├── 002-hughson-westlake-procedure.md
│   ├── 003-test-frequencies.md
│   ├── 004-local-storage.md
│   ├── 005-no-wasm.md
│   ├── 006-age-based-comparison.md
│   └── 007-accessibility.md
├── research/              # Research & Future Planning
│   ├── future-features.md       # Feature roadmap
│   ├── code-improvements.md     # Technical debt (✅ completed)
│   ├── hardware-limitations.md  # Physical constraints
│   └── clinical-accuracy.md     # Comparison with clinical audiometry
└── announcements/         # Launch Materials
    ├── hacker-news.md           # Show HN post draft
    ├── product-hunt.md          # Product Hunt launch materials
    └── technical-blog-post.md   # Technical blog post
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

---

## 🔬 Research Documents

Research documents capture analysis, competitive research, and planning.

| Document | Description |
|----------|-------------|
| [Future Features](research/future-features.md) | Complete feature roadmap with priorities |
| [Code Improvements](research/code-improvements.md) | Refactoring summary ✅ completed |
| [Hardware Limitations](research/hardware-limitations.md) | Physical constraints of consumer audio |
| [Clinical Accuracy](research/clinical-accuracy.md) | Comparison with professional audiometry |

---

## 🚀 Announcements

Launch materials and marketing content.

| Document | Description |
|----------|-------------|
| [Hacker News](announcements/hacker-news.md) | Show HN post with FAQ and comments |
| [Product Hunt](announcements/product-hunt.md) | Full launch kit including social templates |
| [Technical Blog Post](announcements/technical-blog-post.md) | Deep-dive on Web Audio API implementation |

---

## 🎯 Feature Status Overview

### Implemented ✅
- Pure-tone audiometry (Hughson-Westlake)
- Speech-in-noise testing
- Tinnitus frequency matcher
- Profile history & comparison
- PDF export
- PWA/offline support
- Ambient noise detection
- Reference tone calibration
- Headphone profiles (20+ models)
- Multi-language (EN, ES, FR, DE, ZH)

### Coming Soon ⏳
- Masking noise
- Test-retest reliability mode
- Age-based normative comparison
- Enhanced results visualization

### Future 🔮
- Real-time hearing compensation
- Hearing aid simulation
- Machine learning calibration
- Telehealth integration

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

### New Announcement
1. Create file in `docs/announcements/`
2. Include target platform, content, and posting guidelines

---

## 🔗 Quick Links

### For Contributors
- See [Future Features](research/future-features.md) for what to work on next
- Check ADRs before making architectural changes
- Follow existing patterns in codebase

### For Users
- Understand [limitations](research/clinical-accuracy.md) of self-assessment
- Learn about [hardware considerations](research/hardware-limitations.md)

### For Launch
- [Hacker News](announcements/hacker-news.md) Show HN post
- [Product Hunt](announcements/product-hunt.md) launch materials
- [Technical blog](announcements/technical-blog-post.md) for dev.to

---

*Last updated: December 2024*
