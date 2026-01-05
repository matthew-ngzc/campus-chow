<template>
  <div class="signup-container">
    <!-- Success Notification -->
    <div v-if="showSuccessNotification" class="success-notification">
      <div class="notification-content">
        <svg class="success-icon" fill="currentColor" viewBox="0 0 20 20">
          <path
            fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clip-rule="evenodd"
          />
        </svg>
        <div class="notification-text">
          <h4>Account Created Successfully!</h4>
          <p>Please check your email and verify your account before logging in. The email verification link will expire in 1 hour.</p>
        </div>
        <button @click="hideNotification" class="close-btn">
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>

    <div class="signup-left">
      <div class="left-content">
        <h2 class="welcome">Sign up now!</h2>
        <p class="tagline">
          Too lazy to walk? Your cravings can wait —<br />
          We'll fetch your meal, you just hydrate.<br /><br />
          Skip the queue, avoid the heat,<br />
          Get your favourite bites without leaving your seat.<br /><br />
          No fuss, no rush, no lunch time race — Campus Chow brings your food, straight to your place.
          <span class="tagline-continued">By students, for students.</span>
        </p>
      </div>
    </div>

    <div class="signup-right">
      <div class="right-content">
        <h1 class="logo">Campus Chow</h1>
        <h2 class="subheading">Sign Up with your email!</h2>

        <form @submit.prevent="handleSignup" class="form-fields">
          <div class="input-group">
            <label for="email">Email</label>
            <input id="email" v-model="email" type="text" :class="{ 'input-error': emailError }" placeholder="Enter your email" required />
            <span :class="['error-msg', { show: emailError }]">{{ emailError }}</span>
          </div>

          <div class="input-group">
            <label for="name">Name</label>
            <input id="name" v-model="name" type="text" :class="{ 'input-error': nameError }" placeholder="Enter your name" required />
            <span :class="['error-msg', { show: nameError }]">{{ nameError }}</span>
          </div>

          <div class="input-group">
            <label for="phone">Phone Number</label>
            <input id="phone" v-model="phoneNo" type="text" :class="{ 'input-error': phoneError }" placeholder="Enter your phone number" required />
            <span :class="['error-msg', { show: phoneError }]">{{ phoneError }}</span>
          </div>

          <div class="input-group">
            <label for="password">Password</label>
            <div class="password-input-container">
              <input id="password" v-model="password" :type="showPassword ? 'text' : 'password'" :class="{ 'input-error': passwordError }" placeholder="Enter your password" required />
              <button type="button" class="password-toggle" @click="togglePassword" :title="showPassword ? 'Hide password' : 'Show password'">
                <svg v-if="showPassword" class="eye-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
                </svg>
                <svg v-else class="eye-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clip-rule="evenodd" />
                  <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                </svg>
              </button>
            </div>
            <span :class="['error-msg', { show: passwordError }]">{{ passwordError }}</span>
          </div>

          <!-- CAPTCHA Section - REMOVED FOR FRONTEND -->
          <!-- <div class="input-group">
            <label>Verification</label>
            <div class="cf-turnstile"></div>
            <span :class="['error-msg', { show: captchaError }]">{{ captchaError }}</span>
          </div> -->

          <button type="submit" class="signup-btn" :disabled="isSubmitting">
            <span v-if="!isSubmitting">Sign Up</span>
            <span v-else>Creating…</span>
          </button>
        </form>

        <p class="login-prompt">Have an account? <router-link to="/login">Log in</router-link></p>
      </div>
    </div>
  </div>
</template>

<script>
import http from "@/services/http";

export default {
  data() {
    return {
      email: "",
      name: "",
      phoneNo: "",
      password: "",
      emailError: "",
      nameError: "",
      phoneError: "",
      passwordError: "",
      showPassword: false,
      showSuccessNotification: false,
      isSubmitting: false,
    };
  },
  methods: {
    // --- validators ---
    validateEmail() {
      const email = this.email?.trim() || "";
      if (!email) return (this.emailError = "Email is required."), false;
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!re.test(email)) return (this.emailError = "Invalid email format."), false;
      this.emailError = "";
      return true;
    },
    validateName() {
      const name = this.name?.trim() || "";
      if (!name) return (this.nameError = "Name is required."), false;
      if (name.length < 2) return (this.nameError = "Name too short."), false;
      if (name.length > 50) return (this.nameError = "Name too long."), false;
      const re = /^[a-zA-Z\s'-]+$/;
      if (!re.test(name)) return (this.nameError = "Invalid characters."), false;
      this.nameError = "";
      return true;
    },
    validatePhone() {
      const clean = (this.phoneNo || "").replace(/[\s-]/g, "");
      if (!clean) return (this.phoneError = "Phone is required."), false;
      if (!/^\d{8,15}$/.test(clean)) return (this.phoneError = "Invalid phone number."), false;
      this.phoneError = "";
      return true;
    },
    validatePassword() {
      const p = this.password || "";
      if (!p) return (this.passwordError = "Password required."), false;
      if (p.length < 8 || p.length > 128) return (this.passwordError = "Length issue."), false;
      if (!/[a-z]/.test(p)) return (this.passwordError = "Add lowercase."), false;
      if (!/[A-Z]/.test(p)) return (this.passwordError = "Add uppercase."), false;
      if (!/\d/.test(p)) return (this.passwordError = "Add number."), false;
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(p)) return (this.passwordError = "Add symbol."), false;
      this.passwordError = "";
      return true;
    },

    togglePassword() {
      this.showPassword = !this.showPassword;
    },
    showNotification() {
      this.showSuccessNotification = true;
      setTimeout(() => (this.showSuccessNotification = false), 5000);
    },

    async handleSignup() {
      // clear previous errors
      this.emailError = this.nameError = this.phoneError = this.passwordError = "";

      // validate
      if (
        ![this.validateEmail(), this.validateName(), this.validatePhone(), this.validatePassword()].every(Boolean)
      ) return;

      if (this.isSubmitting) return; // guard double-clicks
      this.isSubmitting = true;

      try {
        await http.post("/api/user/auth/register", {
          email: this.email.trim(),
          password: this.password,
          name: this.name.trim(),
          phone: (this.phoneNo || "").replace(/[\s-]/g, ""),
        });

        this.showNotification();
        setTimeout(() => this.$router.push("/login"), 2500);
      } catch (e) {
        const status = e?.response?.status;
        const msg = (e?.response?.data?.message || "signup failed").toLowerCase();

        if (status === 409 || msg.includes("already")) {
          this.emailError = "An account with this email already exists.";
        } else if (msg.includes("email")) {
          this.emailError = "Invalid email.";
        } else if (msg.includes("phone")) {
          this.phoneError = "Invalid phone.";
        } else if (msg.includes("password")) {
          this.passwordError = "Weak password.";
        } else if (msg.includes("name")) {
          this.nameError = "Invalid name.";
        } else {
          alert(e?.response?.data?.message || "Signup failed");
        }
      } finally {
        this.isSubmitting = false;
      }
    },
  },
};
</script>



<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.signup-container {
  display: flex;
  width: 100%;
  margin: 0;
  position: relative;
}

/* LEFT: off-white half */
.signup-left {
  flex: 1;
  background: var(--secondary-color);
  display: flex;
  justify-content: center;
  position: relative;
  padding: 6rem 0;
  height: auto;
}

.signup-left::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('Stark.png') no-repeat;
  background-size: cover;
  background-position: center;
  opacity: 0.07;
  z-index: 0;
}

.left-content {
  text-align: left;
  max-width: 500px;
  position: relative;
  z-index: 1;
  animation: fadeInUp 0.8s ease-out;
}

.welcome {
  font-family: var(--font-heading);
  font-size: 2.8rem;
  font-weight: 800;
  color: var(--text-color);
  margin-bottom: 1.5rem;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.tagline {
  font-family: var(--font-body);
  font-size: 1.2rem;
  color: var(--text-color);
  line-height: 1.6;
  font-weight: 400;
  opacity: 0.8;
}

.tagline-continued {
  display: block;
  font-family: var(--font-body);
  font-size: 1.2rem;
  color: var(--text-color);
  margin-top: 1.5rem;
  font-weight: 600;
}

/* RIGHT: primary color half */
.signup-right {
  flex: 1;
  background: var(--primary-color);
  display: flex;
  justify-content: center;
  align-items: center;
  color: var(--text-color);
  position: relative;
  padding: 6rem 0;
  height: auto;
}

.signup-right::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2322201e' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  opacity: 0.3;
}

.right-content {
  width: 100%;
  max-width: 450px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 1;
  animation: fadeInUp 0.8s ease-out 0.2s both;
}

.logo {
  font-family: var(--font-heading);
  font-size: 2.5rem;
  font-weight: 900;
  margin-bottom: 0.8rem;
  letter-spacing: 0.05em;
  color: var(--text-color);
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.subheading {
  font-family: var(--font-body);
  font-size: 1.1rem;
  text-align: center;
  margin-bottom: 2rem;
  font-weight: 400;
  color: var(--text-color);
  opacity: 0.9;
}

/* Form styling */
.form-fields {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-fields label {
  font-family: var(--font-body);
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-color);
  margin-left: 0.5rem;
}

.form-fields input {
  font-family: var(--font-body);
  padding: 0.8rem 1rem;
  border-radius: 12px !important;
  font-size: 0.9rem;
  border: 0px;
  width: 100%;
  background: var(--tertiary-color);
  color: var(--text-color);
  transition: all 0.3s ease;
  box-sizing: border-box;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.form-fields input::placeholder {
  color: rgba(34, 32, 30, 0.5);
  transition: color 0.3s ease;
}

.form-fields input:focus {
  outline: none;
  border-color: var(--primary-dark);
  background: var(--secondary-color);
  box-shadow: 0 0 0 3px rgba(252, 188, 5, 0.2);
}

.form-fields input:focus::placeholder {
  color: rgba(34, 32, 30, 0.7);
}

.form-fields input.input-error {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
}

.password-input-container {
  position: relative;
  width: 100%;
}

.password-toggle {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-color);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.7;
}

.password-toggle:hover {
  opacity: 1;
  background: rgba(34, 32, 30, 0.1);
}

.eye-icon {
  width: 18px;
  height: 18px;
}

.success-notification {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  background: var(--text-color);
  color: var(--primary-color);
  padding: 16px 24px;
  border-radius: 12px;
  border: 2px solid var(--text-color);
  box-shadow: 0 8px 32px rgba(34, 32, 30, 0.3);
  animation: slideDown 0.5s ease-out;
  max-width: 500px;
  width: 90%;
}

.notification-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.success-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  margin-top: 2px;
  color: var(--primary-color);
}

.notification-text {
  flex: 1;
}

.notification-text h4 {
  font-family: var(--font-heading);
  margin: 0 0 4px 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--primary-color);
}

.notification-text p {
  font-family: var(--font-body);
  margin: 0;
  font-size: 0.9rem;
  color: var(--primary-color);
  opacity: 0.9;
  line-height: 1.4;
}

.close-btn {
  background: none;
  border: none;
  color: var(--primary-color);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.close-btn:hover {
  background: rgba(252, 188, 5, 0.2);
}

.close-btn svg {
  width: 16px;
  height: 16px;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.signup-btn {
  font-family: var(--font-body);
  margin-top: 0.8rem;
  padding: 0.8rem 1.5rem;
  background: var(--text-color);
  color: var(--primary-color);
  border: 2px solid var(--text-color);
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 700;
  width: 100%;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
  box-shadow: 0 4px 15px rgba(34, 32, 30, 0.3);
}

.signup-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(252, 188, 5, 0.2), transparent);
  transition: left 0.5s;
}

.signup-btn:hover::before {
  left: 100%;
}

.signup-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(34, 32, 30, 0.5);
  background: transparent;
  color: var(--text-color);
}

.signup-btn:active {
  transform: translateY(0);
}

/* Other */
.login-prompt {
  font-family: var(--font-body);
  margin-top: 1.5rem;
  font-size: 0.9rem;
  text-align: center;
  color: var(--text-color);
  opacity: 0.8;
}

.login-prompt a {
  color: var(--text-color);
  text-decoration: none;
  font-weight: 700;
  border-bottom: 2px solid var(--text-color);
  transition: all 0.3s ease;
}

.login-prompt a:hover {
  opacity: 0.8;
  text-decoration: none;
}

.error-msg {
  font-family: var(--font-body);
  color: #ef4444;
  font-size: 0.8rem;
  margin-left: 0.5rem;
  opacity: 0;
  transform: translateY(-10px);
  transition: all 0.3s ease;
}

.error-msg.show {
  opacity: 1;
  transform: translateY(0);
}

/* Animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive design */
@media (max-width: 768px) {
  .signup-container {
    flex-direction: column;
  }

  .signup-left,
  .signup-right {
    flex: none;
    height: 50%;
  }

  .welcome {
    font-size: 2rem;
  }

  .tagline {
    font-size: 1rem;
  }

  .logo {
    font-size: 2rem;
  }

  .right-content {
    padding: 1.5rem;
  }

  .left-content {
    padding: 1.5rem;
  }
}

@media (max-width: 480px) {
  .welcome {
    font-size: 1.8rem;
  }

  .tagline {
    font-size: 0.9rem;
  }

  .logo {
    font-size: 1.8rem;
  }

  .subheading {
    font-size: 1rem;
  }

  .form-fields input {
    padding: 0.7rem 0.8rem;
    font-size: 0.85rem;
  }

  .signup-btn {
    padding: 0.7rem 1.2rem;
    font-size: 0.9rem;
  }
}
</style>
