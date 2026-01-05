<template>
  <div class="profile-page">
    <!-- Header Section -->
    <div class="header-section">
      <div class="header-accent"></div>
      <h1 class="page-title">My Profile</h1>
      <p class="page-subtitle">Manage your account and preferences</p>
    </div>

    <!-- Profile Content -->
    <div class="profile-container">
      <!-- Profile Card -->
      <div class="profile-card">
        <!-- Avatar Section -->
        <div class="avatar-section">
          <div class="avatar-wrapper">
            <img :src="profileData.avatar" alt="Profile Avatar" class="avatar-image" />
            <button class="edit-avatar-btn" @click="editAvatar">
              <svg class="camera-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd"
                      d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z"
                      clip-rule="evenodd" />
              </svg>
            </button>
            <!-- Hidden file input -->
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              class="hidden"
              @change="onAvatarPicked"
            />
          </div>
          <h2 class="user-name">{{ profileData.name || "User" }}</h2>
          <p class="user-email">{{ profileData.email }}</p>
          <div class="member-badge">{{ profileData.memberSince }}</div>
        </div>

        <!-- Stats Grid -->
        <div class="stats-grid">
          <div class="stat-box">
            <div class="stat-icon">🛒</div>
            <div class="stat-value">{{ profileData.stats.totalOrders }}</div>
            <div class="stat-label">Total Orders</div>
          </div>
          <div class="stat-box">
            <div class="stat-icon">⭐</div>
            <div class="stat-value">{{ profileData.stats.rating }}</div>
            <div class="stat-label">Average Rating</div>
          </div>
          <div class="stat-box">
            <div class="stat-icon">💰</div>
            <div class="stat-value">${{ profileData.stats.totalSpent }}</div>
            <div class="stat-label">Total Spent</div>
          </div>
          <div class="stat-box">
            <div class="stat-icon">🎁</div>
            <div class="stat-value">{{ profileData.stats.rewardPoints }}</div>
            <div class="stat-label">Coins Balance</div>
          </div>
        </div>
      </div>

      <!-- Account Information -->
      <div class="info-card">
        <h3 class="card-title">Account Information</h3>
        <form @submit.prevent="saveAccountInfo">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Full Name</label>
              <input v-model="profileData.name" type="text" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">Email Address</label>
              <input v-model="profileData.email" type="email" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">Phone Number</label>
              <input v-model="profileData.phone" type="tel" class="form-input" />
            </div>
          </div>
          <button type="submit" class="save-button">Save Changes</button>
        </form>
      </div>
    
      <!-- Update Password -->
      <div class="info-card">
        <h3 class="card-title">Update Password</h3>
        <form @submit.prevent="savePassword">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Current Password</label>
              <div class="pw-field">
                <input
                  :type="showCur ? 'text' : 'password'"
                  v-model.trim="pw.current"
                  class="form-input"
                  required
                />
                <button type="button" class="eye" @click="showCur = !showCur">
                  {{ showCur ? '🙈' : '👁️' }}
                </button>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">New Password</label>
              <div class="pw-field">
                <input
                  :type="showNew ? 'text' : 'password'"
                  v-model.trim="pw.next"
                  minlength="8"
                  class="form-input"
                  required
                />
                <button type="button" class="eye" @click="showNew = !showNew">
                  {{ showNew ? '🙈' : '👁️' }}
                </button>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Confirm Password</label>
              <div class="pw-field">
                <input
                  :type="showConf ? 'text' : 'password'"
                  v-model.trim="pw.confirm"
                  minlength="8"
                  class="form-input"
                  required
                />
                <button type="button" class="eye" @click="showConf = !showConf">
                  {{ showConf ? '🙈' : '👁️' }}
                </button>
              </div>
            </div>
          </div>

          <small class="hint">use at least 8 characters.</small>
          <button type="submit" class="save-button" :disabled="busyPw">Save Password</button>
        </form>
      </div>
      <!-- Delivery Preferences (local-only for now) -->
      <div class="info-card">
        <h3 class="card-title">Preferences</h3>
        <div class="preferences-list">
          <div class="preference-item">
            <div class="preference-left">
              <div class="preference-icon">🔔</div>
              <div class="preference-info">
                <div class="preference-name">Order Notifications</div>
                <div class="preference-desc">Get updates via SMS and email</div>
              </div>
            </div>
            <label class="toggle-switch">
              <input v-model="profileData.preferences.notifications" type="checkbox" />
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div class="preference-item">
            <div class="preference-left">
              <div class="preference-icon">📧</div>
              <div class="preference-info">
                <div class="preference-name">Promotional Emails</div>
                <div class="preference-desc">Receive special offers and deals</div>
              </div>
            </div>
            <label class="toggle-switch">
              <input v-model="profileData.preferences.promotions" type="checkbox" />
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="js">
import { defineComponent, ref, onMounted, computed } from 'vue'
import http from '@/services/http'
import { useRouter } from 'vue-router'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'
const originalEmail = ref('')

const resolveUrl = (v) => {
  if (!v) return ''
  if (v.startsWith('http')) {
    if (v.startsWith('http://localhost/') && !v.includes('://localhost:'))
      return v.replace('http://localhost/', 'http://localhost:8000/')
    return v
  }
  const right = v.startsWith('/') ? v : `/${v}`
  return `${API_BASE}${right}`
}

export default defineComponent({
  name: 'ProfilePage',
  setup() {
    const router = useRouter()

    const fileInput = ref(null)
    const cacheBust = ref(Date.now())

    // password form state
    const pw = ref({ current: '', next: '', confirm: '' })
    const showCur = ref(false)
    const showNew = ref(false)
    const showConf = ref(false)
    const busyPw  = ref(false)

    const profileData = ref({
      name: '',
      email: '',
      phone: '',
      campus: '',
      avatar: '',
      memberSince: '',
      stats: {
        totalOrders: 0,
        rating: 0,
        totalSpent: 0,
        rewardPoints: Number(localStorage.getItem('user_coins') || 0),
      },
      preferences: { defaultLocation: '', notifications: true, promotions: false },
      paymentMethods: [],
    })

    const defaultAvatar = (name) =>
      `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=FCBC05&color=22201E&size=200`

    const avatarUrl = computed(() => {
      const url = profileData.value.avatar
      if (!url) return defaultAvatar(profileData.value.name)
      const sep = url.includes('?') ? '&' : '?'
      return `${url}${sep}v=${cacheBust.value}`
    })

    const onAvatarError = (e) => {
      if (e?.target) e.target.src = defaultAvatar(profileData.value.name)
    }

    const formatMemberSince = (dateStr) => {
      if (!dateStr) return ''
      const d = new Date(dateStr)
      if (Number.isNaN(d.getTime())) return ''
      return `Member since ${new Intl.DateTimeFormat('en-SG', { month: 'long', year: 'numeric' }).format(d)}`
    }

    onMounted(async () => {
      try {
        const { data } = await http.get('/api/users/me')
        profileData.value.name  = data?.name || ''
        profileData.value.email = data?.email || ''
        originalEmail.value = profileData.value.email
        profileData.value.phone = data?.phone || ''
        profileData.value.avatar = resolveUrl(data?.profile_picture) || defaultAvatar(data?.name)
        profileData.value.stats.rewardPoints = Number(data?.coins ?? 0)
        profileData.value.memberSince = data?.created_at ? formatMemberSince(data.created_at) : ''
        cacheBust.value = Date.now()
      } catch (e) {
        // token may be expired; interceptor will redirect. Swallow error to avoid Vue warnings.
      }
    })

    function hardLogout(msg = 'You’ve been signed out') {
      try {
        localStorage.removeItem('jwt_token')
        localStorage.removeItem('user_role')
        localStorage.removeItem('user_name')
        localStorage.removeItem('user_email')
        localStorage.removeItem('user_coins')
        localStorage.removeItem('user_profile_picture')
        sessionStorage.clear()
        window.dispatchEvent(new CustomEvent('session-updated', { detail: { coins: 0 } }))
      } finally {
        alert(msg)
        router.replace({ name: 'login' })
      }
    }

    const saveAccountInfo = async () => {
      const ok = confirm('Save changes to your profile?')
      if (!ok) return
      const body = {
        name: profileData.value.name,
        phone: profileData.value.phone,
        email: profileData.value.email,
      }
      await http.patch('/api/users/me', body)
      localStorage.setItem('user_name', body.name || '')
      localStorage.setItem('user_coins', String(profileData.value.stats.rewardPoints || 0))
      window.dispatchEvent(new CustomEvent('session-updated', {
        detail: { coins: Number(profileData.value.stats.rewardPoints || 0) },
      }))

      const changedEmail =
        (originalEmail.value || '').toLowerCase().trim() !== (body.email || '').toLowerCase().trim()
      if (changedEmail) {
        originalEmail.value = body.email
        hardLogout('✅ Email updated. Please sign in again.')
        return
      }
      alert('✅ Profile updated successfully!')
    }

    const editAvatar = () => fileInput.value?.click()
    const onAvatarPicked = async (e) => {
      const file = e.target.files?.[0]
      if (!file) return
      const fd = new FormData()
      fd.append('avatar', file)
      const { data } = await http.post('/api/users/me/avatar', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const resolved = resolveUrl(data?.profile_picture)
      profileData.value.avatar = resolved || profileData.value.avatar
      localStorage.setItem('user_profile_picture', data?.profile_picture || '')
      cacheBust.value = Date.now()
      alert('✅ Profile picture updated!')
    }

    const savePassword = async () => {
      if (pw.value.next !== pw.value.confirm) {
        alert('❌ passwords do not match'); return
      }
      if (pw.value.next.length < 8) {
        alert('❌ password too short (min 8)'); return
      }
      if (!confirm('Change your password now?')) return

      busyPw.value = true
      try {
        await http.patch('/api/users/me/password', {
          currentPassword: pw.value.current,
          newPassword: pw.value.next,
        })
        pw.value = { current: '', next: '', confirm: '' }
        hardLogout('✅ Password updated. Please sign in again.')
      } catch (e) {
        const msg = e?.response?.data?.error || 'update failed'
        alert(`❌ ${msg}`)
      } finally {
        busyPw.value = false
      }
    }

    const storageHandler = (ev) => {
      if (ev.key === 'user_profile_picture') {
        profileData.value.avatar = resolveUrl(ev.newValue)
        cacheBust.value = Date.now()
      }
    }
    window.addEventListener('storage', storageHandler)

    return {
      fileInput,
      profileData,
      avatarUrl,
      onAvatarError,
      saveAccountInfo,
      editAvatar,
      onAvatarPicked,
      // password form
      pw, showCur, showNew, showConf, busyPw, savePassword,
    }
  },
})
</script>





<style scoped>
/* keep your existing styles; this is just to show placeholders if needed */
.hidden { display: none; }
</style>


<style scoped>
.profile-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 50px 40px;
    padding-top: 140px;
}

.header-section {
    text-align: center;
    margin-bottom: 60px;
}

.header-accent {
    width: 80px;
    height: 4px;
    background: var(--primary-color);
    margin: 0 auto 20px;
    border-radius: 2px;
}

.page-title {
    font-family: var(--font-heading);
    font-size: 3rem;
    font-weight: 700;
    color: var(--text-color);
    margin-bottom: 12px;
}

.page-subtitle {
    font-family: var(--font-body);
    font-size: 1.2rem;
    color: var(--text-color);
    opacity: 0.8;
}

.profile-container {
    display: flex;
    flex-direction: column;
    gap: 32px;
}

/* Profile Card */
.profile-card {
    background: var(--secondary-color);
    border: 2px solid var(--text-color);
    border-radius: 24px;
    padding: 40px;
    box-shadow: 0 8px 24px rgba(34, 32, 30, 0.1);
}

.avatar-section {
    text-align: center;
    margin-bottom: 40px;
}

.avatar-wrapper {
    position: relative;
    display: inline-block;
    margin-bottom: 20px;
}

.avatar-image {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    border: 4px solid var(--primary-color);
    object-fit: cover;
}

.edit-avatar-btn {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 40px;
    height: 40px;
    background: var(--primary-color);
    border: 2px solid var(--text-color);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
}

.edit-avatar-btn:hover {
    transform: scale(1.1);
    background: var(--primary-dark);
}

.camera-icon {
    width: 20px;
    height: 20px;
    color: var(--text-color);
}

.user-name {
    font-family: var(--font-heading);
    font-size: 2rem;
    font-weight: 700;
    color: var(--text-color);
    margin-bottom: 8px;
}

.user-email {
    font-family: var(--font-body);
    font-size: 1.05rem;
    color: var(--text-color);
    opacity: 0.7;
    margin-bottom: 12px;
}

.member-badge {
    display: inline-block;
    background: var(--primary-color);
    color: var(--text-color);
    font-family: var(--font-body);
    font-size: 0.9rem;
    font-weight: 600;
    padding: 8px 20px;
    border-radius: 20px;
    border: 2px solid var(--text-color);
}

/* Stats Grid */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
}

.stat-box {
    background: var(--tertiary-color);
    border: 2px solid var(--text-color);
    border-radius: 16px;
    padding: 24px;
    text-align: center;
    transition: all 0.3s ease;
}

.stat-box:hover {
    transform: translateY(-4px);
    background: var(--primary-color);
}

.stat-icon {
    font-size: 2.5rem;
    margin-bottom: 12px;
}

.stat-value {
    font-family: var(--font-heading);
    font-size: 1.8rem;
    font-weight: 700;
    color: var(--text-color);
    margin-bottom: 4px;
}

.stat-label {
    font-family: var(--font-body);
    font-size: 0.9rem;
    color: var(--text-color);
    opacity: 0.7;
}

/* Info Cards */
.info-card {
    background: var(--secondary-color);
    border: 2px solid var(--text-color);
    border-radius: 24px;
    padding: 36px;
    box-shadow: 0 8px 24px rgba(34, 32, 30, 0.1);
}

.card-title {
    font-family: var(--font-heading);
    font-size: 1.6rem;
    font-weight: 700;
    color: var(--text-color);
    margin-bottom: 28px;
}

/* Form Elements */
.form-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
    margin-bottom: 28px;
}

.form-group {
    display: flex;
    flex-direction: column;
}

.form-label {
    font-family: var(--font-body);
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--text-color);
    margin-bottom: 8px;
}

.form-input {
    font-family: var(--font-body);
    font-size: 1rem;
    padding: 12px 16px;
    border: 2px solid var(--text-color);
    border-radius: 12px;
    background: var(--tertiary-color);
    color: var(--text-color);
    transition: all 0.3s ease;
}

.form-input:focus {
    outline: none;
    border-color: var(--primary-color);
    background: var(--secondary-color);
}

.save-button {
    width: 100%;
    background: var(--primary-color);
    color: var(--text-color);
    font-family: var(--font-body);
    font-size: 1.1rem;
    font-weight: 600;
    padding: 14px 32px;
    border: 2px solid var(--text-color);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.save-button:hover {
    background: var(--primary-dark);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(252, 188, 5, 0.3);
}

/* Preferences List */
.preferences-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.preference-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    background: var(--tertiary-color);
    border: 2px solid var(--text-color);
    border-radius: 12px;
}

.preference-left {
    display: flex;
    align-items: center;
    gap: 16px;
    flex: 1;
}

.preference-icon {
    font-size: 2rem;
}

.preference-info {
    display: flex;
    flex-direction: column;
}

.preference-name {
    font-family: var(--font-body);
    font-size: 1.05rem;
    font-weight: 600;
    color: var(--text-color);
    margin-bottom: 4px;
}

.preference-desc {
    font-family: var(--font-body);
    font-size: 0.9rem;
    color: var(--text-color);
    opacity: 0.7;
}

.edit-btn {
    background: var(--primary-color);
    color: var(--text-color);
    font-family: var(--font-body);
    font-size: 0.9rem;
    font-weight: 600;
    padding: 8px 20px;
    border: 2px solid var(--text-color);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.edit-btn:hover {
    background: var(--primary-dark);
    transform: translateY(-2px);
}

/* Toggle Switch */
.toggle-switch {
    position: relative;
    display: inline-block;
    width: 60px;
    height: 32px;
}

.toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
}

.toggle-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--text-color);
    transition: 0.3s;
    border-radius: 34px;
    border: 2px solid var(--text-color);
}

.toggle-slider:before {
    position: absolute;
    content: "";
    height: 20px;
    width: 20px;
    left: 4px;
    bottom: 4px;
    background-color: var(--secondary-color);
    transition: 0.3s;
    border-radius: 50%;
}

input:checked + .toggle-slider {
    background-color: var(--primary-color);
}

input:checked + .toggle-slider:before {
    transform: translateX(28px);
}

/* Payment Methods */
.payment-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.payment-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px;
    background: var(--tertiary-color);
    border: 2px solid var(--text-color);
    border-radius: 12px;
}

.card-icon {
    font-size: 2rem;
}

.card-info {
    flex: 1;
}

.card-name {
    font-family: var(--font-body);
    font-size: 1.05rem;
    font-weight: 600;
    color: var(--text-color);
    margin-bottom: 4px;
}

.card-expiry {
    font-family: var(--font-body);
    font-size: 0.9rem;
    color: var(--text-color);
    opacity: 0.6;
}

.remove-btn {
    background: transparent;
    color: var(--text-color);
    font-family: var(--font-body);
    font-size: 0.9rem;
    font-weight: 600;
    padding: 8px 16px;
    border: 2px solid var(--text-color);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.remove-btn:hover {
    background: #fee2e2;
    color: #991b1b;
    border-color: #991b1b;
}

.add-payment-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: var(--primary-color);
    color: var(--text-color);
    font-family: var(--font-body);
    font-size: 1rem;
    font-weight: 600;
    padding: 16px 24px;
    border: 2px dashed var(--text-color);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.add-payment-btn:hover {
    background: var(--primary-dark);
    transform: translateY(-2px);
}

.plus-icon {
    width: 20px;
    height: 20px;
}

/* Password field: keep toggle icon inside the input, right-aligned */
.pw-field {
  position: relative;
  display: block;
  width: 100%;
}

.pw-field > .form-input {
  width: 100%;
  padding-right: 44px; /* make room for the eye */
}

.pw-field .eye {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: 0;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  padding: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
}

.pw-field .eye:focus {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

/* Responsive Design */
@media (max-width: 768px) {
    .profile-page {
        padding: 30px 20px;
        padding-top: 120px;
    }

    .page-title {
        font-size: 2.2rem;
    }

    .profile-card,
    .info-card {
        padding: 24px;
    }

    .stats-grid {
        grid-template-columns: repeat(2, 1fr);
    }

    .form-grid {
        grid-template-columns: 1fr;
    }

    .preference-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
    }

    .edit-btn,
    .toggle-switch {
        width: 100%;
    }

    .payment-card {
        flex-wrap: wrap;
    }

    .remove-btn {
        width: 100%;
    }
}
</style>
