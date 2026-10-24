import { useCallback, useEffect, useRef, useState } from "react";
import "./styles.css";

type Field = "fullName" | "email" | "password" | "confirmPassword";

interface FieldState {
  value: string;
  status: "idle" | "valid" | "invalid";
  errorMessage: string;
}

const initialField: FieldState = { value: "", status: "idle", errorMessage: "" };

function calculatePasswordStrength(password: string): {
  score: number;
  strength: "weak" | "fair" | "good" | "strong";
} {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  let strength: "weak" | "fair" | "good" | "strong" = "weak";
  if (score >= 6) strength = "strong";
  else if (score >= 4) strength = "good";
  else if (score >= 2) strength = "fair";

  return { score, strength };
}

/** Per-criterion breakdown for the segmented meter. */
const criteria = (pw: string): [boolean, string][] => [
  [pw.length >= 8, "8+ characters"],
  [pw.length >= 12, "12+ characters"],
  [/[a-z]/.test(pw), "a lowercase letter"],
  [/[A-Z]/.test(pw), "an uppercase letter"],
  [/[0-9]/.test(pw), "a number"],
  [/[^A-Za-z0-9]/.test(pw), "a symbol"],
];

function strengthHint(pw: string): string {
  if (!pw) return "Use 8+ characters with mixed case, a number and a symbol";
  const missing = criteria(pw).filter(([ok]) => !ok).map(([, label]) => label);
  if (missing.length === 0) return "All criteria met";
  const next = missing.slice(0, 2).join(" and ");
  return `Add ${next}`;
}

type SubmitState = "idle" | "busy" | "done";

export default function App() {
  const [fields, setFields] = useState<Record<Field, FieldState>>({
    fullName: initialField,
    email: initialField,
    password: initialField,
    confirmPassword: initialField,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");

  const inputRefs = useRef<Record<Field, HTMLInputElement | null>>({
    fullName: null,
    email: null,
    password: null,
    confirmPassword: null,
  });
  const submitRef = useRef<HTMLButtonElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  const validateFullName = (value: string): FieldState => {
    const v = value.trim();
    if (v.length < 2) {
      return { value, status: "invalid", errorMessage: "Name must be at least 2 characters" };
    }
    if (!/^[a-zA-Z\s]+$/.test(v)) {
      return { value, status: "invalid", errorMessage: "Name can only contain letters and spaces" };
    }
    return { value, status: "valid", errorMessage: "" };
  };

  const validateEmail = (value: string): FieldState => {
    const v = value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(v)) {
      return { value, status: "invalid", errorMessage: "Please enter a valid email address" };
    }
    return { value, status: "valid", errorMessage: "" };
  };

  const validatePassword = (value: string): FieldState => {
    const strength = calculatePasswordStrength(value);
    if (value.length < 8) {
      return { value, status: "invalid", errorMessage: "Password must be at least 8 characters" };
    }
    if (strength.score < 3) {
      return { value, status: "invalid", errorMessage: "Password is too weak" };
    }
    return { value, status: "valid", errorMessage: "" };
  };

  const validateConfirmPassword = (
    value: string,
    password: string
  ): FieldState => {
    if (value !== password) {
      return { value, status: "invalid", errorMessage: "Passwords do not match" };
    }
    if (value.length === 0) {
      return { value, status: "idle", errorMessage: "" };
    }
    return { value, status: "valid", errorMessage: "" };
  };

  const setField = (field: Field, next: FieldState) => {
    setFields((prev) => {
      const updated = { ...prev, [field]: next };
      if (field === "password" && prev.confirmPassword.value) {
        updated.confirmPassword = validateConfirmPassword(
          prev.confirmPassword.value,
          next.value
        );
      }
      return updated;
    });
  };

  const handleChange = (field: Field, raw: string) => {
    if (field === "fullName") setField(field, validateFullName(raw));
    else if (field === "email") setField(field, validateEmail(raw));
    else if (field === "password") {
      setPasswordTouched(true);
      setField(field, validatePassword(raw));
    } else setField(field, validateConfirmPassword(raw, fields.password.value));
  };

  const handleBlur = (field: Field, value: string) => {
    if (field === "fullName") setField(field, validateFullName(value));
    else if (field === "email") setField(field, validateEmail(value));
    else if (field === "password") setField(field, validatePassword(value));
    else setField(field, validateConfirmPassword(value, fields.password.value));
  };

  const allValid = Object.values(fields).every((f) => f.status === "valid");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submitState !== "idle") return;
    // Re-validate everything at submit time, like the original.
    const next: Record<Field, FieldState> = {
      fullName: validateFullName(fields.fullName.value),
      email: validateEmail(fields.email.value),
      password: validatePassword(fields.password.value),
      confirmPassword: validateConfirmPassword(
        fields.confirmPassword.value,
        fields.password.value
      ),
    };
    setFields(next);
    if (Object.values(next).every((f) => f.status === "valid")) {
      setSubmitState("busy");
      window.setTimeout(() => {
        setSubmitState("done");
        window.setTimeout(() => {
          setModalOpen(true);
          setSubmitState("idle");
        }, 450);
      }, 700);
    } else {
      const firstInvalid = (Object.keys(next) as Field[]).find(
        (k) => next[k].status === "invalid"
      );
      if (firstInvalid) {
        const el = inputRefs.current[firstInvalid];
        el?.scrollIntoView({ block: "center", behavior: "smooth" });
        el?.focus({ preventScroll: true });
      }
    }
  };

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setPasswordTouched(false);
    setFields({
      fullName: initialField,
      email: initialField,
      password: initialField,
      confirmPassword: initialField,
    });
    // The button becomes disabled after reset and cannot hold focus;
    // return focus to the first field once the reset has rendered.
    window.setTimeout(() => inputRefs.current.fullName?.focus(), 0);
  }, []);

  // Escape closes the modal; focus returns via closeModal.
  useEffect(() => {
    if (!modalOpen) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeModal();
        return;
      }
      if (e.key === "Tab" && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll<HTMLElement>(
          "button, [href], input, [tabindex]:not([tabindex='-1'])"
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [modalOpen, closeModal]);

  const groups: {
    field: Field;
    label: string;
    type: string;
    success: string;
    id: string;
    autoComplete: string;
  }[] = [
    { field: "fullName", label: "Full Name", type: "text", success: "Looks good!", id: "fullName", autoComplete: "name" },
    { field: "email", label: "Email Address", type: "email", success: "Valid email address!", id: "email", autoComplete: "email" },
    { field: "password", label: "Password", type: "password", success: "Strong password!", id: "password", autoComplete: "new-password" },
    { field: "confirmPassword", label: "Confirm Password", type: "password", success: "Passwords match!", id: "confirmPassword", autoComplete: "new-password" },
  ];

  const passwordStrength = calculatePasswordStrength(fields.password.value);
  const pwCriteria = criteria(fields.password.value);
  const pwHint = strengthHint(fields.password.value);

  return (
    <div className="container">
      <div className="form-header">
        <h1>Create Account</h1>
        <p>Join us today and start your journey</p>
      </div>

      <form className="registration-form" noValidate onSubmit={handleSubmit}>
        {groups.map(({ field, label, type, success, id, autoComplete }) => {
          const f = fields[field];
          const hasError = f.status === "invalid";
          return (
            <div className="input-group" key={field}>
              <label htmlFor={id} data-state={f.status}>{label}</label>
              <input
                type={type}
                id={id}
                name={field}
                required
                autoComplete={autoComplete}
                className={f.status === "valid" ? "valid" : hasError ? "invalid" : ""}
                value={f.value}
                ref={(el) => { inputRefs.current[field] = el; }}
                aria-invalid={hasError || undefined}
                aria-describedby={
                  field === "password"
                    ? hasError ? "password-error strength-meter" : "strength-meter"
                    : hasError ? `${field}-error` : undefined
                }
                onChange={(e) => handleChange(field, e.target.value)}
                onBlur={(e) => handleBlur(field, e.target.value)}
              />
              {field === "password" && (
                <div className="password-strength" id="strength-meter" aria-live="polite">
                  <div className="strength-segments" data-band={passwordTouched && f.value ? passwordStrength.strength : undefined} aria-hidden="true">
                    {pwCriteria.map(([ok], i) => (
                      <span key={i} className={`segment${ok ? " on" : ""}`} data-criterion={i} />
                    ))}
                  </div>
                  <div className={`strength-text${passwordTouched && f.value ? " has-hint" : ""}`}>
                    {passwordTouched && f.value
                      ? `Password strength: ${passwordStrength.strength} — ${pwHint}`
                      : "Use 8+ characters with mixed case, a number and a symbol"}
                  </div>
                </div>
              )}
              <div
                className={`error-message ${hasError ? "show" : ""}`}
                id={hasError ? `${field}-error` : undefined}
                role={hasError ? "alert" : undefined}
              >
                <span className="error-icon" aria-hidden="true">!</span>
                <span className="error-text">{f.errorMessage}</span>
              </div>
              <div
                className={`success-message ${f.status === "valid" ? "show" : ""}`}
                aria-live="polite"
              >
                <span className="success-icon" aria-hidden="true">✓</span>
                <span>{success}</span>
              </div>
            </div>
          );
        })}

        <button
          type="submit"
          className={`submit-btn ${submitState}`}
          disabled={!allValid || submitState !== "idle"}
          ref={submitRef}
          aria-busy={submitState === "busy" || undefined}
        >
          {submitState === "idle" && <span className="btn-label">Create Account</span>}
          {submitState === "busy" && (
            <>
              <span className="btn-spinner" aria-hidden="true" />
              <span className="btn-label">Creating…</span>
            </>
          )}
          {submitState === "done" && (
            <>
              <svg className="btn-check" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 12.5 10 18.5 20 6.5" />
              </svg>
              <span className="btn-label">Created</span>
            </>
          )}
        </button>
      </form>

      <div
        className={`success-modal ${modalOpen ? "show" : ""}`}
        id="successModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        ref={modalRef}
      >
        <div className="modal-content">
          <div className="modal-icon" aria-hidden="true">✓</div>
          <h2 id="modal-title">Welcome!</h2>
          <p>
            Your account has been created successfully. Welcome to our community!
          </p>
          <button className="close-modal" onClick={closeModal} ref={closeRef}>
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}
