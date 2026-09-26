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
Located in `src/utils/dom.ts`:
```typescript
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  if (announcer) {
    announcer.setAttribute('aria-live', priority);
    announcer.textContent = message;
    setTimeout(() => { announcer.textContent = ''; }, 1000);
  }
}
```

### Audiogram Data
The audiogram canvases are `aria-hidden`, so `renderThresholdTable()` in `src/ui/threshold-table.ts` adds a visually hidden table inside each chart's `<figure>` listing every tested frequency with right and left thresholds (one column pair per profile on the comparison screen). The figures carry no `role="img"`, which would make their captions and tables presentational. Comparison series also differ by line pattern, not only colour.

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

