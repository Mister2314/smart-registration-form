import { useState } from "react";
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

export default function App() {
  const [fields, setFields] = useState<Record<Field, FieldState>>({
    fullName: initialField,
    email: initialField,
    password: initialField,
    confirmPassword: initialField,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

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

  const allValid = Object.values(fields).every((f) => f.status === "valid");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
      setModalOpen(true);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setPasswordTouched(false);
    setFields({
      fullName: initialField,
      email: initialField,
      password: initialField,
      confirmPassword: initialField,
    });
  };

  const groups: {
    field: Field;
    label: string;
    type: string;
    success: string;
    id: string;
  }[] = [
    { field: "fullName", label: "Full Name", type: "text", success: "Looks good!", id: "fullName" },
    { field: "email", label: "Email Address", type: "email", success: "Valid email address!", id: "email" },
    { field: "password", label: "Password", type: "password", success: "Strong password!", id: "password" },
    { field: "confirmPassword", label: "Confirm Password", type: "password", success: "Passwords match!", id: "confirmPassword" },
  ];

  const passwordStrength = calculatePasswordStrength(fields.password.value);

  return (
    <div className="container">
      <div className="form-header">
        <h1>Create Account</h1>
        <p>Join us today and start your journey</p>
      </div>

      <form className="registration-form" noValidate onSubmit={handleSubmit}>
        {groups.map(({ field, label, type, success, id }) => {
          const f = fields[field];
          return (
            <div className="input-group" key={field}>
              <label htmlFor={id}>{label}</label>
              <input
                type={type}
                id={id}
                name={field}
                required
                className={f.status === "valid" ? "valid" : f.status === "invalid" ? "invalid" : ""}
                value={f.value}
                onChange={(e) => handleChange(field, e.target.value)}
                onBlur={(e) => {
                  if (field === "fullName") setField(field, validateFullName(e.target.value));
                  if (field === "email") setField(field, validateEmail(e.target.value));
                }}
              />
              {field === "password" && (
                <div className="password-strength">
                  <div className="strength-bar">
                    <div
                      className={`strength-fill ${
                        passwordTouched ? passwordStrength.strength : ""
                      }`}
                    />
                  </div>
                  <div className="strength-text">
                    {passwordTouched
                      ? `Password strength: ${passwordStrength.strength}`
                      : ""}
                  </div>
                </div>
              )}
              <div className={`error-message ${f.status === "invalid" ? "show" : ""}`}>
                <span className="error-icon">!</span>
                <span className="error-text">{f.errorMessage}</span>
              </div>
              <div className={`success-message ${f.status === "valid" ? "show" : ""}`}>
                <span className="success-icon">✓</span>
                <span>{success}</span>
              </div>
            </div>
          );
        })}

        <button type="submit" className="submit-btn" disabled={!allValid}>
          Create Account
        </button>
      </form>

      <div className={`success-modal ${modalOpen ? "show" : ""}`} id="successModal">
        <div className="modal-content">
          <div className="modal-icon">✓</div>
          <h2>Welcome!</h2>
          <p>
            Your account has been created successfully. Welcome to our community!
          </p>
          <button className="close-modal" onClick={closeModal}>
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}
