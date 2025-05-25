class FormValidator {
  constructor() {
    this.form = document.getElementById("registrationForm");
    this.inputs = {
      fullName: document.getElementById("fullName"),
      email: document.getElementById("email"),
      password: document.getElementById("password"),
      confirmPassword: document.getElementById("confirmPassword"),
    };
    this.submitBtn = document.getElementById("submitBtn");
    this.validationState = {
      fullName: false,
      email: false,
      password: false,
      confirmPassword: false,
    };

    this.init();
  }
  init() {
    Object.keys(this.inputs).forEach((field) => {
      if (this.inputs[field]) {
        this.inputs[field].addEventListener("input", () =>
          this.validateField(field)
        );
        this.inputs[field].addEventListener("blur", () =>
          this.validateField(field)
        );
      }
    });
    if (this.form) {
      this.form.addEventListener("submit", (e) => this.handleSubmit(e));
    }
  }

  validateField(field) {
    const input = this.inputs[field];
    if (!input) return;
    const value = input.value.trim();
    let isValid = false;
    let errorMessage = "";
    switch (field) {
      case "fullName":
        isValid = this.validateName(value);
        errorMessage = isValid ? "" : this.getNameError(value);
        break;
      case "email":
        isValid = this.validateEmail(value);
        errorMessage = isValid ? "" : this.getEmailError(value);
        break;
      case "password":
        isValid = this.validatePassword(value);
        errorMessage = isValid ? "" : this.getPasswordError(value);
        this.updatePasswordStrength(value);
        if (this.inputs.confirmPassword && this.inputs.confirmPassword.value) {
          setTimeout(() => this.validateField("confirmPassword"), 0);
        }
        break;
      case "confirmPassword":
        isValid = this.validateConfirmPassword(value);
        errorMessage = isValid ? "" : this.getConfirmPasswordError(value);
        break;
    }
    this.updateFieldUI(field, isValid, errorMessage);
    this.validationState[field] = isValid;
    this.updateSubmitButton();
  }

  validateName(name) {
    return name.length >= 2 && /^[a-zA-Z\s]+$/.test(name);
  }
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  validatePassword(password) {
    return (
      password.length >= 8 &&
      /(?=.*[a-z])/.test(password) &&
      /(?=.*[A-Z])/.test(password) &&
      /(?=.*\d)/.test(password)
    );
  }
  validateConfirmPassword(confirmPassword) {
    return (
      confirmPassword === this.inputs.password.value &&
      confirmPassword.length > 0
    );
  }
  getNameError(name) {
    if (!name) return "Full name is required";
    if (name.length < 2) return "Name must be at least 2 characters";
    if (!/^[a-zA-Z\s]+$/.test(name))
      return "Name can only contain letters and spaces";
    return "";
  }

  getEmailError(email) {
    if (!email) return "Email address is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return "Please enter a valid email address";
    return "";
  }

  getPasswordError(password) {
    if (!password) return "Password is required";
    if (password.length < 8) return "Password must be at least 8 characters";
    if (!/(?=.*[a-z])/.test(password))
      return "Password must contain a lowercase letter";
    if (!/(?=.*[A-Z])/.test(password))
      return "Password must contain an uppercase letter";
    if (!/(?=.*\d)/.test(password)) return "Password must contain a number";
    return "";
  }
  getConfirmPasswordError(confirmPassword) {
    if (!confirmPassword) return "Please confirm your password";
    if (confirmPassword !== this.inputs.password.value)
      return "Passwords do not match";
    return "";
  }

  updateFieldUI(field, isValid, errorMessage) {
    const input = this.inputs[field];
    const errorElement = document.getElementById(`${field}Error`);
    const successElement = document.getElementById(`${field}Success`);
    if (!input || !errorElement || !successElement) return;
    input.classList.remove(styles.inputValid, styles.inputInvalid);
    if (input.value.trim()) {
      input.classList.add(isValid ? styles.inputValid : styles.inputInvalid);
    }
    const errorTextElement = errorElement.querySelector(".error-text");
    if (errorTextElement && errorMessage && input.value.trim()) {
      errorTextElement.textContent = errorMessage;
      errorElement.classList.add("show");
      successElement.classList.remove("show");
    } else if (isValid) {
      errorElement.classList.remove("show");
      successElement.classList.add("show");
    } else {
      errorElement.classList.remove("show");
      successElement.classList.remove("show");
    }
  }

  updatePasswordStrength(password) {
    const strengthFill = document.getElementById("strengthFill");
    const strengthText = document.getElementById("strengthText");
    if (!strengthFill || !strengthText) return;
    if (!password) {
      strengthFill.className = styles.strengthFill;
      strengthText.textContent = "";
      return;
    }
    let score = 0;
    let feedback = "";
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (score <= 2) {
      strengthFill.className = `${styles.strengthFill} ${styles.strengthWeak}`;
      feedback = "Weak password";
    } else if (score <= 4) {
      strengthFill.className = `${styles.strengthFill} ${styles.strengthFair}`;
      feedback = "Fair password";
    } else if (score <= 5) {
      strengthFill.className = `${styles.strengthFill} ${styles.strengthGood}`;
      feedback = "Good password";
    } else {
      strengthFill.className = `${styles.strengthFill} ${styles.strengthStrong}`;
      feedback = "Strong password";
    }
    strengthText.textContent = feedback;
  }

  updateSubmitButton() {
    if (this.submitBtn) {
      const allValid = Object.values(this.validationState).every(
        (state) => state
      );
      this.submitBtn.disabled = !allValid;
    }
  }
  handleSubmit(e) {
    e.preventDefault();
    Object.keys(this.inputs).forEach((field) => this.validateField(field));

    if (Object.values(this.validationState).every((state) => state)) {
      this.showSuccessModal();
    }
  }
  showSuccessModal() {
    const modal = document.getElementById("successModal");
    if (modal) {
      modal.classList.add("show");
    }
    setTimeout(() => {
      if (this.form) {
        this.form.reset();
      }
      Object.keys(this.validationState).forEach((key) => {
        this.validationState[key] = false;
      });
      this.updateSubmitButton();
      Object.keys(this.inputs).forEach((field) => {
        const input = this.inputs[field];
        const errorElement = document.getElementById(`${field}Error`);
        const successElement = document.getElementById(`${field}Success`);

        if (input) {
          input.classList.remove(styles.inputValid, styles.inputInvalid);
        }
        if (errorElement) {
          errorElement.classList.remove("show");
        }
        if (successElement) {
          successElement.classList.remove("show");
        }
      });
      const strengthFill = document.getElementById("strengthFill");
      const strengthText = document.getElementById("strengthText");
      if (strengthFill) {
        strengthFill.className = styles.strengthFill;
      }
      if (strengthText) {
        strengthText.textContent = "";
      }
    }, 2000);
  }
}
export function closeModal() {
  const modal = document.getElementById("successModal");
  if (modal) {
    modal.classList.remove("show");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new FormValidator();
  const modal = document.getElementById("successModal");
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target.id === "successModal") {
        closeModal();
      }
    });
  }
});
window.closeModal = closeModal;
