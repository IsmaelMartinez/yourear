# ADR 007: Accessibility (A11y) Implementation

## Status
Accepted

## Context
A hearing test app should be accessible to users with various abilities, including those using screen readers or keyboard navigation.

## Decision
Implement comprehensive accessibility features:
1. Semantic HTML with ARIA attributes
2. Screen reader announcements
3. Keyboard navigation
4. Focus management
5. Text alternatives for visual elements

## Implementation

### Screen Reader Support
```typescript
function announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  announcer.setAttribute('aria-live', priority);
  announcer.textContent = message;
}
```

### Audiogram Description
```typescript
function generateAudiogramDescription(profile: HearingProfile): string {
  return profile.thresholds.map(t => 
    `At ${t.frequency} hertz: Right ear ${t.rightEar} decibels, Left ear ${t.leftEar} decibels`
  ).join('. ');
}
```

### Key Accessibility Features
| Feature | Implementation |
|---------|----------------|
| Landmarks | `<main>`, `<nav>`, `<header>`, `<footer>` |
| Headings | Proper `h1`→`h2`→`h3` hierarchy |
| Buttons | Descriptive `aria-label` attributes |
| Icons | `aria-hidden="true"` on decorative emojis |
| Progress | `role="progressbar"` with `aria-valuenow` |
| Focus | `tabindex="-1"` on main content for focus management |

## Consequences
### Positive
- Usable by screen reader users
- Keyboard-only navigation works
- Meets WCAG 2.1 AA guidelines
- Better for all users (clear structure)

### Negative
- More verbose HTML
- Requires testing with actual screen readers
- Announcements need careful timing

## Testing Checklist
- [ ] VoiceOver (macOS/iOS)
- [ ] NVDA (Windows)
- [ ] Keyboard-only navigation
- [ ] Color contrast (4.5:1 minimum)
- [ ] Focus visible indicators

