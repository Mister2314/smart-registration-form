# Smart Registration Form

Registration form with real-time, hand-written validation — no validation library, no browser default popups. Every rule, error message and state transition lives in the app itself, so the form controls exactly what the user sees when something is wrong.

**Live demo:** https://smart-registration-form.vercel.app

<div align="center">

<img src="docs/demo.gif" alt="Smart Registration Form — animated demo" width="700">

| Desktop | Mobile |
|---|---|
| <img src="docs/shot-desktop.png" alt="Desktop view" width="700"> | <img src="docs/shot-mobile.png" alt="Mobile view" width="290"> |

<details>
<summary>More screenshots</summary>

| Desktop | Mobile |
|---|---|
| <img src="docs/preview.png" alt="Desktop, alternate view" width="700"> | <img src="docs/preview-mobile.png" alt="Mobile, alternate view" width="290"> |

</details>

</div>

## How validation works

The form is marked `novalidate` on purpose — the browser's unstyleable tooltips are exactly what this project avoids. Validation runs on `input` and `blur` for all four fields: name shape (`/^[a-zA-Z\s]+$/`, min 2 chars), email format, password strength (six scored criteria) and confirm-password matching. Submit re-validates everything in one pass; the button stays disabled until every field passes.

## Field feedback

- **Errors** slide in under the failing field with an icon and the exact cause — announced to screen readers via `role="alert"` and wired to each input with `aria-describedby` + `aria-invalid`.
- **Success ticks** scale in per field once a rule passes (`aria-live="polite"`).
- **The strength meter is real feedback, not a bar**: six segments map 1:1 to the six password criteria, and the reason text names what is still missing — "Add an uppercase letter and a number" — instead of a bare label.
- **Submit micro-states**: idle → busy (spinner + "Creating…") → done (checkmark draw) → success modal.

## Accessibility & focus

On success the modal is a `role="dialog"` with a manual focus trap: `Escape` or a backdrop click closes it, focus returns to the first field, and `Tab` cycles inside the dialog. Inputs keep a visible focus ring, 16px font size (no iOS zoom-on-focus) and correct `autocomplete` attributes (`name`, `email`, `new-password`). All motion is disabled under `prefers-reduced-motion` — the static page is the complete page.

## Tech stack

React 19 · TypeScript · Vite — zero runtime dependencies beyond React itself.

## Run locally

```bash
git clone https://github.com/Mister2314/smart-registration-form.git
cd smart-registration-form
npm install
npm run dev
```

## What I learned

Turning off the browser's own validation was the point of the exercise — it is the only way to control what the user actually sees when a field is wrong. The second lesson came later: a strength meter that only shows a colour tells the user *that* they failed, not *what to fix*; six honest segments with a reason line does the job a single bar never could.
