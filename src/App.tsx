import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fieldErrors,
  passwordCriteria,
  passwordScore,
  securitySchema,
  whoSchema,
} from "./schema";
import "./styles.css";

/* ------------------------------------------------------------------ */
/* Draft persistence — local only, sessionStorage, never leaves device */
/* ------------------------------------------------------------------ */

const DRAFT_KEY = "trailhead-registration-draft";

interface Draft {
  fullName: string;
  email: string;
  password: string;
  step: number;
  startedAt: number;
}

function loadDraft(): Draft {
  const fallback: Draft = { fullName: "", email: "", password: "", step: 0, startedAt: Date.now() };
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<Draft>;
    return {
      fullName: typeof parsed.fullName === "string" ? parsed.fullName : "",
      email: typeof parsed.email === "string" ? parsed.email : "",
      password: typeof parsed.password === "string" ? parsed.password : "",
      step: typeof parsed.step === "number" ? Math.min(2, Math.max(0, parsed.step)) : 0,
      startedAt: typeof parsed.startedAt === "number" ? parsed.startedAt : Date.now(),
    };
  } catch {
    return fallback;
  }
}

/* ------------------------------------------------------------------ */
/* Theme                                                                */
/* ------------------------------------------------------------------ */

type Theme = "light" | "dark";

function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.dataset.theme === "dark" ? "dark" : "light"
  );
  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      document.documentElement.style.colorScheme = next;
      try {
        localStorage.setItem("trailhead-theme", next);
      } catch {
        /* private mode: theme just won't persist */
      }
      return next;
    });
  }, []);
  return [theme, toggle];
}

/* ------------------------------------------------------------------ */
/* Copy for the three steps (narrative rail)                            */
/* ------------------------------------------------------------------ */

const STEPS = [
  {
    kicker: "Step 1 of 3 — Who you are",
    title: "Tell us who to put on the card",
    body: "Your membership card and hut-reservation confirmations are issued in this name, exactly as you type it.",
  },
  {
    kicker: "Step 2 of 3 — Security",
    title: "Choose how you sign in",
    body: "Long beats complicated. A line from a book you love, with a number or symbol worked in, is harder to guess than Pa$$w0rd and easier to remember.",
  },
  {
    kicker: "Step 3 of 3 — Review",
    title: "Check it before we cut the card",
    body: "This demo runs entirely in your browser — nothing is sent anywhere. When you continue, your draft is cleared from this device.",
  },
] as const;

/* ------------------------------------------------------------------ */
/* Component                                                            */
/* ------------------------------------------------------------------ */

type SubmitOutcome = "idle" | "busy" | "done";

export default function App() {
  const draft = useMemo(loadDraft, []);
  const [step, setStep] = useState(draft.step);
  const [fullName, setFullName] = useState(draft.fullName);
  const [email, setEmail] = useState(draft.email);
  const [password, setPassword] = useState(draft.password);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Error state per field, keyed like the schema paths.
  const [errors, setErrors] = useState<Record<string, string>>({});
  // A field only reports live errors once it has been blurred or a submit failed.
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [outcome, setOutcome] = useState<SubmitOutcome>("idle");
  const [honeypot, setHoneypot] = useState("");
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [theme, toggleTheme] = useTheme();

  const summaryRef = useRef<HTMLDivElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement | null>(null);

  // Autosave draft (local only).
  useEffect(() => {
    const payload: Draft = { fullName, email, password, step, startedAt: draft.startedAt };
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
      setSavedAt(Date.now());
    } catch {
      /* storage unavailable — form still works */
    }
  }, [fullName, email, password, step, draft.startedAt]);

  // Focus the step heading when the step changes (announce without modals).
  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  /* ---------------- validation ---------------- */

  const validateWho = useCallback((v: string, e: string) => {
    const result = whoSchema.safeParse({ fullName: v, email: e });
    return result.success ? {} : fieldErrors(result.error);
  }, []);

  const validateSecurity = useCallback((pw: string, cpw: string) => {
    const result = securitySchema.safeParse({ password: pw, confirmPassword: cpw });
    const errs = result.success ? {} : fieldErrors(result.error);
    if (!errs.confirmPassword && pw && cpw && pw !== cpw) {
      errs.confirmPassword = "The two passwords don't match — recheck for a stray character.";
    }
    return errs;
  }, []);

  const whoErrors = validateWho(fullName, email);
  const securityErrors = validateSecurity(password, confirmPassword);
  const stepErrors = step === 0 ? whoErrors : step === 1 ? securityErrors : {};

  // Shown = submit-failure errors, plus live schema errors on touched fields.
  const shownErrors = { ...errors } as Record<string, string>;
  for (const key of Object.keys(stepErrors)) {
    if (touched[key]) shownErrors[key] = stepErrors[key];
  }

  const markTouched = (key: string) => setTouched((prev) => ({ ...prev, [key]: true }));

  /* ---------------- navigation ---------------- */

  const goTo = (next: number) => {
    setStep(next);
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const failTo = (errs: Record<string, string>, keys: string[]) => {
    setErrors(errs);
    keys.forEach((k) => setTouched((prev) => ({ ...prev, [k]: true })));
    // Move focus to the error summary (or first bad field) so screen readers
    // announce what went wrong before anything else.
    window.setTimeout(() => {
      summaryRef.current?.focus();
      summaryRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 0);
  };

  const nextFromWho = () => {
    const errs = validateWho(fullName, email);
    if (Object.keys(errs).length > 0) failTo(errs, ["fullName", "email"]);
    else goTo(1);
  };

  const nextFromSecurity = () => {
    const errs = validateSecurity(password, confirmPassword);
    if (Object.keys(errs).length > 0) failTo(errs, ["password", "confirmPassword"]);
    else goTo(2);
  };

  const submit = () => {
    if (acceptedTerms === false) {
      failTo({ acceptedTerms: "You need to accept the club charter to continue." }, ["acceptedTerms"]);
      return;
    }
    // Spam defense without CAPTCHA: hidden honeypot + minimum fill time.
    if (honeypot !== "") return; // bot filled the trap — pretend success
    if (Date.now() - draft.startedAt < 2500) return; // inhumanly fast — ignore

    setOutcome("busy");
    // Local demo: simulate the round trip, then clear the draft.
    window.setTimeout(() => {
      setOutcome("done");
      try {
        sessionStorage.removeItem(DRAFT_KEY);
      } catch {
        /* ignore */
      }
    }, 900);
  };

  /* ---------------- render helpers ---------------- */

  const fieldProps = (key: string, invalid: boolean, describedBy?: string) => ({
    "aria-invalid": invalid || undefined,
    "aria-describedby": invalid ? (describedBy ? `${key}-error ${describedBy}` : `${key}-error`) : describedBy,
  });

  const score = passwordScore(password);
  const summaryList =
    step === 0
      ? (["fullName", "email"] as const)
      : step === 1
        ? (["password", "confirmPassword"] as const)
        : (["acceptedTerms"] as const);
  const summaryItems = summaryList.filter((k) => shownErrors[k]);

  const themeIcon = theme === "dark" ? "sun" : "moon";

  return (
    <div className="shell">
      <header className="topbar">
        <a className="wordmark" href="/">
          <svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true">
            <path d="M16 4 27 26H5z" fill="var(--accent)" />
            <path d="M12 18l4-6 4 6z" fill="var(--bg)" />
          </svg>
          Trailhead Alpine Club
        </a>
        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          title="Toggle theme"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            {themeIcon === "sun" ? (
              <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="4.2" />
                <path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M19.1 4.9l-1.7 1.7M6.6 17.4l-1.7 1.7" />
              </g>
            ) : (
              <path
                d="M20 14.5A8.5 8.5 0 1 1 9.5 4 6.8 6.8 0 0 0 20 14.5z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            )}
          </svg>
        </button>
      </header>

      <main className="layout" id="main">
        {/* Narrative rail */}
        <aside className="rail" aria-hidden={outcome === "done" || undefined}>
          <ol className="stepper" aria-label="Registration progress">
            {["Who you are", "Security", "Review"].map((label, i) => (
              <li
                key={label}
                className={`step-node${i === step ? " current" : ""}${i < step ? " done" : ""}`}
                aria-current={i === step ? "step" : undefined}
              >
                <span className="step-dot" aria-hidden="true">
                  {i < step ? (
                    <svg viewBox="0 0 24 24" width="12" height="12">
                      <path d="M4 12.5 10 18.5 20 6.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </span>
                <span className="step-label">{label}</span>
              </li>
            ))}
          </ol>
          <p className="rail-kicker">{STEPS[step].kicker}</p>
          <h1 className="rail-title" tabIndex={-1} ref={headingRef}>
            {STEPS[step].title}
          </h1>
          <p className="rail-body">{STEPS[step].body}</p>
          {savedAt && outcome !== "done" && (
            <p className="draft-note" role="status">
              Draft saved on this device
              {step > 0 || fullName || email ? " — you can close the tab and come back." : "."}
            </p>
          )}
        </aside>

        {/* Form column */}
        <section className="panel" aria-label="Registration form">
          {outcome === "done" ? (
            <div className="done" role="status">
              <svg viewBox="0 0 24 24" width="44" height="44" aria-hidden="true" className="done-mark">
                <path d="M4 12.5 10 18.5 20 6.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              <h2 tabIndex={-1}>Membership registered — welcome aboard</h2>
              <p>
                In the live product you'd get a confirmation at <strong>{email}</strong> within a few
                minutes. This demo never stored anything beyond this browser tab, and your draft has
                been cleared.
              </p>
              <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
                Start a new registration
              </button>
            </div>
          ) : (
            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                if (step === 0) nextFromWho();
                else if (step === 1) nextFromSecurity();
                else submit();
              }}
            >
              {/* Honeypot — visually and programmatically hidden from humans */}
              <div className="hp" aria-hidden="true">
                <label htmlFor="company">Company</label>
                <input
                  id="company"
                  name="company"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              {/* Error summary — shown after a failed Continue */}
              {summaryItems.length > 0 && errors && Object.keys(errors).length > 0 && (
                <div className="summary" role="alert" tabIndex={-1} ref={summaryRef}>
                  <p className="summary-title">
                    {summaryItems.length === 1
                      ? "One thing needs fixing before you continue:"
                      : `${summaryItems.length} things need fixing before you continue:`}
                  </p>
                  <ul>
                    {summaryItems.map((k) => (
                      <li key={k}>
                        <a
                          href={`#field-${k}`}
                          onClick={(e) => {
                            e.preventDefault();
                            document.getElementById(`field-${k}`)?.focus();
                          }}
                        >
                          {shownErrors[k]}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {step === 0 && (
                <fieldset className="fields">
                  <legend className="sr-only">Your details</legend>
                  <div className="field">
                    <label htmlFor="field-fullName">Full name</label>
                    <input
                      id="field-fullName"
                      name="fullName"
                      type="text"
                      autoComplete="name"
                      autoCapitalize="words"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      onBlur={() => markTouched("fullName")}
                      {...fieldProps("fullName", !!shownErrors.fullName)}
                    />
                    {shownErrors.fullName && (
                      <p className="field-error" id="fullName-error" role="alert">
                        {shownErrors.fullName}
                      </p>
                    )}
                  </div>
                  <div className="field">
                    <label htmlFor="field-email">Email address</label>
                    <input
                      id="field-email"
                      name="email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      spellCheck={false}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => markTouched("email")}
                      {...fieldProps("email", !!shownErrors.email)}
                    />
                    {shownErrors.email && (
                      <p className="field-error" id="email-error" role="alert">
                        {shownErrors.email}
                      </p>
                    )}
                    <p className="field-hint">Used for your card and hut bookings. No newsletter unless you ask.</p>
                  </div>
                </fieldset>
              )}

              {step === 1 && (
                <fieldset className="fields">
                  <legend className="sr-only">Sign-in details</legend>
                  <div className="field">
                    <label htmlFor="field-password">Password</label>
                    <div className="password-row">
                      <input
                        id="field-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onBlur={() => markTouched("password")}
                        {...fieldProps("password", !!shownErrors.password, "password-meter")}
                      />
                      <button
                        type="button"
                        className="reveal"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-pressed={showPassword}
                      >
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                    <div className="meter" id="password-meter" aria-live="polite">
                      <div className="meter-segments" aria-hidden="true" data-score={password ? score : undefined}>
                        {passwordCriteria.map((c, i) => (
                          <span key={i} className={`seg${password && c.test(password) ? " on" : ""}`} />
                        ))}
                      </div>
                      <p className="meter-text">
                        {password
                          ? score === 4
                            ? "Strong. Nothing the schema would complain about."
                            : `Still needs: ${passwordCriteria.filter((c) => !c.test(password)).map((c) => c.label.toLowerCase()).join(", ")}.`
                          : "At least 12 characters. Length beats complexity."}
                      </p>
                    </div>
                    {shownErrors.password && (
                      <p className="field-error" id="password-error" role="alert">
                        {shownErrors.password}
                      </p>
                    )}
                  </div>
                  <div className="field">
                    <label htmlFor="field-confirmPassword">Re-enter password</label>
                    <input
                      id="field-confirmPassword"
                      name="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onBlur={() => markTouched("confirmPassword")}
                      {...fieldProps("confirmPassword", !!shownErrors.confirmPassword)}
                    />
                    {shownErrors.confirmPassword && (
                      <p className="field-error" id="confirmPassword-error" role="alert">
                        {shownErrors.confirmPassword}
                      </p>
                    )}
                  </div>
                </fieldset>
              )}

              {step === 2 && (
                <fieldset className="fields">
                  <legend className="sr-only">Review and confirm</legend>
                  <dl className="review">
                    <div className="review-row">
                      <dt>Name</dt>
                      <dd>{fullName || <span className="muted">—</span>}</dd>
                    </div>
                    <div className="review-row">
                      <dt>Email</dt>
                      <dd>{email || <span className="muted">—</span>}</dd>
                    </div>
                    <div className="review-row">
                      <dt>Password</dt>
                      <dd>{password ? "•".repeat(Math.min(password.length, 24)) : <span className="muted">—</span>}</dd>
                    </div>
                  </dl>
                  <button
                    type="button"
                    className="linkish"
                    onClick={() => {
                      markTouched("fullName");
                      markTouched("email");
                      goTo(0);
                    }}
                  >
                    Edit details
                  </button>
                  <div className="field">
                    <label className="check">
                      <input
                        type="checkbox"
                        name="acceptedTerms"
                        checked={acceptedTerms}
                        onChange={(e) => {
                          setAcceptedTerms(e.target.checked);
                          markTouched("acceptedTerms");
                        }}
                        aria-invalid={!!shownErrors.acceptedTerms || undefined}
                        aria-describedby={shownErrors.acceptedTerms ? "acceptedTerms-error" : undefined}
                      />
                      <span>
                        I've read the club charter and the privacy note. Members' names appear in the
                        annual hut ledger; nothing else is shared.
                      </span>
                    </label>
                    {shownErrors.acceptedTerms && (
                      <p className="field-error" id="acceptedTerms-error" role="alert">
                        {shownErrors.acceptedTerms}
                      </p>
                    )}
                  </div>
                </fieldset>
              )}

              <div className="actions">
                {step > 0 && (
                  <button type="button" className="btn btn-ghost" onClick={() => goTo(step - 1)}>
                    Back
                  </button>
                )}
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={outcome === "busy"}
                  aria-busy={outcome === "busy" || undefined}
                >
                  {outcome === "busy" ? (
                    <>
                      <span className="spinner" aria-hidden="true" /> Registering…
                    </>
                  ) : step === 2 ? (
                    "Register membership"
                  ) : (
                    "Continue"
                  )}
                </button>
              </div>
              <p className="privacy-note">
                Demo form. Everything you type stays in this browser tab (session storage) and is
                deleted when you finish or close the tab.
              </p>
            </form>
          )}
        </section>
      </main>

      <footer className="footer">
        <p>Trailhead Alpine Club · Est. 1948 · Membership desk, Mon–Fri</p>
      </footer>
    </div>
  );
}
