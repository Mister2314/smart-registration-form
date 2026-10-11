# Smart Registration Form

**A registration form with real-time validation written from scratch — no validation library, no browser default popups.**

[![Live Demo](https://img.shields.io/badge/Live_Demo-elegant--pastelito--6c3353.netlify.app-2ea44f?style=flat-square&logo=vercel&logoColor=white)](https://elegant-pastelito-6c3353.netlify.app/)
![HTML5](https://img.shields.io/badge/HTML5-e34f26?style=flat-square&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572b6?style=flat-square&logoColor=white)
![Vanilla JS](https://img.shields.io/badge/Vanilla_JS-f7df1e?style=flat-square&logoColor=white)

<p align="center">
  <a href="https://elegant-pastelito-6c3353.netlify.app/">
    <img src="docs/preview.png" alt="Smart Registration Form — desktop preview" width="100%">
  </a>
</p>

## Overview

A sign-up form where every rule is written by hand in a separate validator module. The form is marked `novalidate` on purpose — instead of letting the browser throw its own tooltips, validation runs on input and renders inline error messages under the relevant field.

`formValidator.js` holds the rules for each field: name shape, email format, password strength and confirmation matching. Errors appear and clear as you type, and the submit button only proceeds once every field is valid.

## Features

- Real-time validation on every field as the user types
- Inline, per-field error messages instead of browser tooltips
- Email format checking and name validation
- Password strength rules plus confirm-password matching
- Submit blocked until the form is fully valid
- Validation rules isolated in a reusable `formValidator.js` module
- Clean card layout with a soft pastel palette

## Tech Stack

| Layer | Technology |
| --- | --- |
| Markup | HTML5 (`novalidate` form) |
| Styling | CSS3 |
| Logic | Vanilla JavaScript validation module |
| Deploy | Netlify |

## Screenshots

| Desktop | Mobile |
| :---: | :---: |
| <img src="docs/preview.png" alt="Desktop view"> | <img src="docs/preview-mobile.png" alt="Mobile view" width="230"> |

## Getting Started

No build step and no dependencies — clone the repo and open the entry file, or serve the folder locally:

```bash
git clone https://github.com/Mister2314/smart-registration-form.git
cd smart-registration-form

# Option 1 — open it directly
start index.html      # Windows
open  index.html      # macOS

# Option 2 — serve it locally
npx serve .
```

## Project Structure

```
index.html — form markup with data- hooks for the validator
formValidator.js — field rules and validation orchestration
styles.css — card layout and error-state styling
```

## Notes

Turning off the browser's own validation was the point of the exercise — it is the only way to control what the user actually sees when a field is wrong.

## Author

**Xəyal Hüseynli** — Junior Front-End Developer

[Portfolio](https://hypnosdev.vercel.app) · [GitHub](https://github.com/Mister2314) · [LinkedIn](https://www.linkedin.com/in/x%C9%99yal-h%C3%BCseynli-3487b91ba/) · [xeyalhuseynli06@gmail.com](mailto:xeyalhuseynli06@gmail.com)
