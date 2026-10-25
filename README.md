# Trailhead — Smart Registration Form

A three-step membership registration for a fictional alpine club, built as a study in accessible modern form UX: zod schema validation, blur-then-live error timing, an error summary, draft autosave, and spam defense without CAPTCHAs. React 19 + Vite + TypeScript, no CSS framework.

**Live demo:** https://smart-registration-form.vercel.app

<div align="center">

| Desktop | Mobile |
|---|---|
| <img src="docs/shot-desktop.png" alt="Desktop view — step 1 of the Trailhead registration" width="700"> | <img src="docs/shot-mobile.png" alt="Mobile view — step 1 of the Trailhead registration" width="290"> |

</div>

## Quick start

```bash
npm install
npm run dev      # local dev server
npm run build    # typecheck + production build
npm run preview  # serve the production build
```

## What's inside

| Concern | Approach |
|---|---|
| Validation | One zod schema per step (`src/schema.ts`) is the single source of truth for rules and messages |
| Error timing | Nothing while you type; errors appear on blur, then go live per keystroke; submit collects everything |
| Error summary | On a failed Continue, focus moves to a linked summary (NN/G pattern); each entry jumps to its field |
| Autocomplete & inputmode | `autocomplete="name" / "email" / "new-password"`, `inputMode="email"`, `autoCapitalize="words"` |
| Password guidance | 12+ chars, length-over-complexity copy, live checklist meter, Show/Hide toggle |
| Multi-step + saved progress | 3 steps with a stepper; the draft autosaves to `sessionStorage` — close the tab, come back, fields are restored |
| Spam defense | Hidden honeypot field + minimum fill-time check. No CAPTCHA, no third-party script |
| Privacy | Static demo — state is local-only (`sessionStorage`), cleared on completion; no network calls |
| Theming | System default + persisted toggle, `color-scheme` set before first paint (no flash), dark designed not inverted |
| Accessibility | Full keyboard flow, focus moved to step headings / error summary, `aria-invalid` + `role="alert"`, AA contrast, `prefers-reduced-motion` honored, ≥44px touch targets |
| Identity | Fraunces (display) + Manrope (body), warm paper/ink palette with a single terracotta accent |

## Validation timing, in one paragraph

Fields validate against the schema on blur and on every keystroke *after* the first blur or failed submit — never mid-first-typing. A red state can only appear on a field you've left or tried to submit; a green state is never announced per keystroke. Submit re-validates the whole step, and if anything fails, focus lands on the error summary rather than silently shaking the button.

## Notes

- The "Register membership" action is simulated (900 ms); nothing leaves the browser.
- The old single-screen form and its hand-rolled validators were replaced wholesale; commit history retains both eras.
