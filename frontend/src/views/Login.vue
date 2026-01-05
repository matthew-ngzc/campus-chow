<template>
  <div class="login-container">
    <!-- Left: White with background image -->
    <div class="login-left">
      <div class="left-content">
        <h2 class="welcome">Welcome back!</h2>
        <p class="tagline">
          <span class="tagline-continued">By students, for students.</span>
        </p>
      </div>
    </div>

    <!-- Right: Form -->
    <div class="login-right">
      <div class="right-content">
        <h1 class="logo">Campus Chow</h1>
        <h2 class="subheading">Login with your email!</h2>

        <!-- ✅ UPDATED: Added Merchant button -->
        <div class="user-type-tabs">
          <button 
            :class="{ active: selectedRole === 'user' }" 
            @click="selectedRole = 'user'"
          >
            User
          </button>
          <button 
            :class="{ active: selectedRole === 'admin' }" 
            @click="selectedRole = 'admin'"
          >
            Admin
          </button>
          <button 
            :class="{ active: selectedRole === 'merchant' }" 
            @click="selectedRole = 'merchant'"
          >
            Merchant
          </button>
        </div>

        <form @submit.prevent="handleLogin" class="form-fields">
          <div class="input-group">
            <label for="email">Email</label>
            <input 
              id="email" 
              v-model="email" 
              type="text" 
              :class="{ 'input-error': emailError }"
              placeholder="Enter your email" 
              required 
            />
            <span :class="['error-msg', { show: emailError }]">{{ emailError }}</span>
          </div>

          <div class="input-group">
            <label for="password">Password</label>
            <div class="password-input-container">
              <input 
                id="password" 
                v-model="password" 
                :type="showPassword ? 'text' : 'password'"
                :class="{ 'input-error': passwordError }"
                placeholder="Enter your password" 
                required 
              />
              <button 
                type="button" 
                class="password-toggle"
                @click="togglePassword"
                :title="showPassword ? 'Hide password' : 'Show password'"
              >
                <svg v-if="showPassword" class="eye-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                  <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/>
                </svg>
                <svg v-else class="eye-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clip-rule="evenodd"/>
                  <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z"/>
                </svg>
              </button>

              <p class="forgot-password">
                <span class="forgot-password-link" @click="showPopup = true">Forgot your password?</span>
              </p>
            </div>
            <span :class="['error-msg', { show: passwordError }]">{{ passwordError }}</span>
          </div>

          <button type="submit" class="login-btn">
            <span>Log In</span>
          </button>
        </form>

        <p class="signup-prompt">
          Don't have an account? 
          <router-link to="/signup">Sign up</router-link> now! 
        </p>
        
        <!-- Email Verification Success Message -->
        <div v-if="showVerificationSuccess" class="verification-success">
          <div class="verification-content">
            <svg class="verification-icon" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            <span>Email verified successfully! You can now log in.</span>
          </div>
        </div>

        <!-- Logout Success Message -->
        <div v-if="showLogoutSuccess" class="verification-success">
          <div class="verification-content">
            <svg class="verification-icon" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            <span>Logged out successfully!</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import http from "@/services/http";
import { parseJwt } from "@/services/jwt";

const router = useRouter();

const email = ref("");
const password = ref("");
const emailError = ref("");
const passwordError = ref("");
const showPassword = ref(false);
const showVerificationSuccess = ref(false);
const showLogoutSuccess = ref(false);
const showPopup = ref(false);
const selectedRole = ref('user'); // ✅ CHANGED: from isAdmin to selectedRole

function validateEmail() {
  if (!email.value.trim()) { emailError.value = "Email is required."; return false; }
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email.value)) { emailError.value = "Please enter a valid email format."; return false; }
  emailError.value = "";
  return true;
}

function validatePassword() {
  if (!password.value) { passwordError.value = "Password is required."; return false; }
  if (password.value.length < 8) { passwordError.value = "Password must be at least 8 characters long."; return false; }
  passwordError.value = "";
  return true;
}

function togglePassword() {
  showPassword.value = !showPassword.value;
}

function checkForVerificationSuccess() {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("verified") === "true") {
    showVerificationSuccess.value = true;
    setTimeout(() => (showVerificationSuccess.value = false), 5000);
  }
}

function checkForLogoutSuccess() {
  if (sessionStorage.getItem("justLoggedOut") === "true") {
    showLogoutSuccess.value = true;
    sessionStorage.removeItem("justLoggedOut");
    setTimeout(() => (showLogoutSuccess.value = false), 3500);
  }
}

onMounted(() => {
  checkForVerificationSuccess();
  checkForLogoutSuccess();
});

// ✅ UPDATED: Complete handleLogin function with merchant support using existing endpoint
async function handleLogin() {
  emailError.value = "";
  passwordError.value = "";
  if (!validateEmail() || !validatePassword()) return;

  // ✅ WORKAROUND: MERCHANT LOGIN FLOW - Fetch all merchants and match by email
  if (selectedRole.value === 'merchant') {
    try {
      // Fetch all merchants from existing endpoint
      const { data } = await http.get('/api/merchants');
      
      // Find merchant by email (case-insensitive)
      // ✅ FIXED: Using merchantId field from your API response
      const merchant = data.find(m => m.email?.toLowerCase() === email.value.trim().toLowerCase());
      
      if (!merchant || !merchant.merchantId) {
        emailError.value = 'Merchant not found with this email';
        return;
      }

      // Store merchant info in localStorage
      localStorage.setItem('merchant_id', merchant.merchantId);
      localStorage.setItem('merchant_email', merchant.email);
      localStorage.setItem('merchant_name', merchant.name || 'Merchant');
      localStorage.setItem('user_role', 'MERCHANT');
      
      sessionStorage.setItem("justLoggedIn", "true");
      
      // Redirect to merchant menu page
      router.push({ name: 'merchantMenu', params: { merchantId: merchant.merchantId } });
      
    } catch (error) {
      console.error('Merchant login error:', error);
      emailError.value = 'Failed to login. Please try again.';
    }
    return;
  }

  // ADMIN FLOW
  if (selectedRole.value === 'admin') {
    try {
      const { data } = await http.post("/api/admin/auth/login", {
        email: email.value.trim(),
        password: password.value,
      });
      const token = data.accessToken;
      const payload = parseJwt(token);
      const name   = payload?.email?.split("@")[0] || "admin";
      const role   = (payload?.role || "ADMIN").toUpperCase();

      localStorage.setItem("jwt_token", token);
      localStorage.setItem("user_id", payload?.sub || "");
      localStorage.setItem("user_name", name);
      localStorage.setItem("user_role", role);

      sessionStorage.setItem("justLoggedIn", "true");
      router.push("/admin");
    } catch (e) {
      const msg = e?.response?.data?.message || "Login failed";
      if (msg.toLowerCase().includes("email")) emailError.value = msg; else passwordError.value = msg;
    }
    return;
  }

  // USER FLOW
  try {
    const { data } = await http.post("/api/user/auth/login", {
      email: email.value.trim(),
      password: password.value,
    });
    localStorage.setItem("jwt_token", data.accessToken);
    localStorage.setItem("user_id", String(data.user?.id ?? ""));
    localStorage.setItem("user_name", data.user?.name ?? "");
    localStorage.setItem("user_role", (data.user?.role ?? "USER").toUpperCase());
    localStorage.setItem("user_coins", String(data.user?.coins ?? 0));
    if (data.user?.profile_picture) {
      localStorage.setItem("user_profile_picture", data.user.profile_picture);
      window.dispatchEvent(new CustomEvent("session-updated", {
        detail: { profile_picture: data.user.profile_picture }
      }));
    }
    window.dispatchEvent(new CustomEvent("session-updated", {
     detail: { coins: Number(data.user?.coins ?? 0) }
   }));

    sessionStorage.setItem("justLoggedIn", "true");
    router.push("/home");
  } catch (e) {
    const msg = e?.response?.data?.message || "Login failed";
    if (msg.toLowerCase().includes("email")) emailError.value = msg; else passwordError.value = msg;
  }
}
</script>

<style scoped>
/* All your existing styles remain the same */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.forgot-password-link {
  cursor: pointer;
  color: var(--text-color);
  font-size: 0.85rem;
  transition: color 0.3s ease;
  margin-left: 236px;
  margin-top: 20px; 
}

.forgot-password-link:hover {
  color: rgba(255, 255, 255, 0.9);
  text-decoration-line: underline;
}

.login-container {
  height: auto;
  width: 100%;
  display: flex;
  flex-direction: row;
  overflow: hidden;
  margin: 0;
  padding: 0;
  position: relative;
}

.login-left {
  background: var(--secondary-color);
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  padding: 6rem 0;
  height: 100%;
}

.login-left::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0.07;
  z-index: 0;
}

.left-content {
  text-align: center;
  padding: 2rem;
  max-width: 500px;
  position: relative;
  z-index: 1;
  animation: fadeInUp 0.8s ease-out;
}

.welcome {
  font-family: var(--font-heading);
  color: var(--text-color);
  font-size: 2.8rem;
  font-weight: 800;
  margin-bottom: 1.5rem;
  line-height: 1.1;
}

.tagline {
  font-family: var(--font-body);
  color: var(--text-color);
  font-size: 1.2rem;
  opacity: 0.9;
}

.login-right {
  flex: 1;
  background: var(--primary-color);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4rem 2rem;
}

.right-content {
  width: 100%;
  max-width: 480px;
  animation: fadeInUp 0.8s ease-out;
}

.logo {
  font-family: var(--font-heading);
  font-size: 2.8rem;
  font-weight: 900;
  margin-bottom: 0.8rem;
  text-align: center;
  color: var(--text-color);
  letter-spacing: -0.5px;
}

.subheading {
  font-family: var(--font-body);
  color: var(--text-color);
  text-align: center;
  font-size: 1.1rem;
  margin-bottom: 2rem;
  font-weight: 500;
  opacity: 0.8;
}

.input-group {
  margin-bottom: 1.5rem;
  width: 100%;
}

.form-fields {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
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
  outline: none;
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
  top: 38%;
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

.verification-success {
  margin-top: 1rem;
  background: var(--text-color);
  color: var(--primary-color);
  padding: 12px 16px;
  border-radius: 8px;
  border: 2px solid var(--text-color);
  box-shadow: 0 4px 12px rgba(34, 32, 30, 0.2);
  animation: fadeIn 0.5s ease-out;
}

.verification-content {
  font-family: var(--font-body);
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  font-weight: 600;
}

.verification-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-btn {
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

.login-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(252, 188, 5, 0.2), transparent);
  transition: left 0.5s;
}

.login-btn:hover::before {
  left: 100%;
}

.login-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(34, 32, 30, 0.5);
  background: transparent;
  color: var(--text-color);
}

.login-btn:active {
  transform: translateY(0);
}

.signup-prompt {
  font-family: var(--font-body);
  margin-top: 1.5rem;
  font-size: 0.9rem;
  text-align: center;
  color: var(--text-color);
  opacity: 0.8;
}

.signup-prompt a {
  color: var(--text-color);
  text-decoration: none;
  font-weight: 700;
  transition: all 0.3s ease;
  border-bottom: 2px solid var(--text-color);
}

.signup-prompt a:hover {
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

.user-type-tabs {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 1rem;
  background: rgba(34, 32, 30, 0.1);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.user-type-tabs button {
  flex: 1;
  padding: 0.8rem 1rem;
  font-family: var(--font-body);
  font-size: 0.95rem;
  font-weight: 700;
  border: none;
  background: transparent;
  color: var(--text-color);
  cursor: pointer;
  transition: all 0.3s ease;
}

.user-type-tabs button:hover {
  background: rgba(34, 32, 30, 0.15);
}

.user-type-tabs button.active {
  background: var(--text-color);
  color: var(--primary-color);
  box-shadow: inset 0 0 5px rgba(0,0,0,0.2);
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
  .login-container {
    flex-direction: column;
  }
  
  .login-left, .login-right {
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
  
  .login-btn {
    padding: 0.7rem 1.2rem;
    font-size: 0.9rem;
  }
}
</style>