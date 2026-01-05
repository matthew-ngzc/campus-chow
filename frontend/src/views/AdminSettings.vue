<template>
  <div class="wrap">
    <div class="header">
      <div class="accent"></div>
      <h1 class="title">Admin Settings</h1>
      <p class="subtitle">Manage your account details</p>
      <p class="current-email">Current email: <strong>{{ currentEmail || '—' }}</strong></p>
    </div>

    <!-- Change Email (collapsible) -->
    <section class="card">
      <button class="card-head" @click="openEmail = !openEmail" :aria-expanded="openEmail">
        <h3>Change Email</h3>
        <span class="chev" :class="{open: openEmail}">▾</span>
      </button>
      <transition name="fade">
        <form v-if="openEmail" class="body" @submit.prevent="saveEmail">
          <label class="label">Current Password</label>
          <div class="pw">
            <input :type="showPwEmail ? 'text' : 'password'"
                   v-model.trim="emailForm.currentPassword"
                   class="input" required />
            <button type="button" class="icon-btn" @click="showPwEmail = !showPwEmail">
              {{ showPwEmail ? '🙈' : '👁️' }}
            </button>
          </div>

          <label class="label">New Email</label>
          <input type="email" v-model.trim="emailForm.newEmail" class="input" required />

          <div class="actions">
            <button type="submit" class="btn" :disabled="busyEmail">Save Email</button>
          </div>
        </form>
      </transition>
    </section>

    <!-- Change Password (collapsible) -->
    <section class="card">
      <button class="card-head" @click="openPw = !openPw" :aria-expanded="openPw">
        <h3>Change Password</h3>
        <span class="chev" :class="{open: openPw}">▾</span>
      </button>
      <transition name="fade">
        <form v-if="openPw" class="body" @submit.prevent="savePassword">
          <label class="label">Current Password</label>
          <div class="pw">
            <input :type="showPw1 ? 'text' : 'password'"
                   v-model.trim="pwForm.currentPassword"
                   class="input" required />
            <button type="button" class="icon-btn" @click="showPw1 = !showPw1">
              {{ showPw1 ? '🙈' : '👁️' }}
            </button>
          </div>

          <label class="label">New Password</label>
          <div class="pw">
            <input :type="showPw2 ? 'text' : 'password'"
                   v-model.trim="pwForm.newPassword"
                   class="input" minlength="8" required />
            <button type="button" class="icon-btn" @click="showPw2 = !showPw2">
              {{ showPw2 ? '🙈' : '👁️' }}
            </button>
          </div>

          <label class="label">Confirm New Password</label>
          <input :type="showPw2 ? 'text' : 'password'"
                 v-model.trim="pwForm.confirm"
                 class="input" minlength="8" required />

          <small class="hint">Use at least 8 characters with a mix of letters and numbers.</small>

          <div class="actions">
            <button type="submit" class="btn danger" :disabled="busyPw">Save Password</button>
          </div>
        </form>
      </transition>
    </section>

    <div v-if="toast" class="toast">{{ toast }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import http from '@/services/http'

const router = useRouter()

const currentEmail = ref('')

const openEmail = ref(true)
const openPw = ref(false)

const showPwEmail = ref(false)
const showPw1 = ref(false)
const showPw2 = ref(false)

const busyEmail = ref(false)
const busyPw = ref(false)
const toast = ref('')

const emailForm = ref({ currentPassword: '', newEmail: '' })
const pwForm = ref({ currentPassword: '', newPassword: '', confirm: '' })

function say(msg){ toast.value = msg; setTimeout(()=>toast.value='', 2000) }

onMounted(async () => {
  try {
    const { data } = await http.get('/api/admin/me')
    currentEmail.value = data?.email || localStorage.getItem('user_email') || ''
  } catch {
    currentEmail.value = localStorage.getItem('user_email') || ''
  }
})

function logoutAfterDelay(msg) {
  say(msg)
  setTimeout(() => {
    localStorage.removeItem('jwt_token')
    localStorage.removeItem('user_email')
    localStorage.removeItem('user_role')
    router.push('/login')
  }, 1500)
}

function parseErr(e, fallback='❌ update failed') {
  try {
    const msg = e?.response?.data?.message || e?.response?.data?.error
    return msg ? `❌ ${msg}` : fallback
  } catch { return fallback }
}

async function saveEmail(){
  const { currentPassword, newEmail } = emailForm.value
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) { say('❌ invalid email'); return }
  if (!window.confirm(`Change email from "${currentEmail.value}" to "${newEmail}"?`)) return

  busyEmail.value = true
  try {
    const { data } = await http.patch('/api/admin/account/email', { currentPassword, newEmail })
    logoutAfterDelay('✅ email updated — please sign in again')
  } catch (e) {
    say(parseErr(e))
  } finally {
    busyEmail.value = false
  }
}

// savePassword()
async function savePassword(){
  const { currentPassword, newPassword, confirm: confirmNew } = pwForm.value  // <-- rename here
  if (newPassword !== confirmNew) { say('❌ passwords do not match'); return }
  if (newPassword.length < 8) { say('❌ password too short'); return }
  if (!window.confirm('Are you sure you want to change your password?')) return  // <-- use window.confirm

  busyPw.value = true
  try {
    await http.patch('/api/admin/account/password', { currentPassword, newPassword })
    logoutAfterDelay('✅ password updated — please sign in again')
  } catch (e) {
    say(parseErr(e))
  } finally {
    busyPw.value = false
  }
}
</script>


<style scoped>
.wrap { max-width: 720px; margin: 0 auto; padding: 120px 24px 48px; }
.header { text-align: center; margin-bottom: 18px; }
.accent { width: 80px; height: 4px; background: var(--primary-color); margin: 0 auto 12px; border-radius: 2px; }
.title { font-family: var(--font-heading); font-size: 2.2rem; font-weight: 800; color: var(--text-color); }
.subtitle { opacity: .8; color: var(--text-color); font-weight: 600; }
.current-email { margin-top: 6px; font-weight: 600; }

.card { border: 2px solid var(--text-color); border-radius: 18px; background: var(--secondary-color); box-shadow: 0 8px 24px rgba(34,32,30,.08); margin-bottom: 14px; overflow: hidden; }
.card-head {
  width: 100%; display: flex; align-items: center; justify-content: space-between;
  padding: 14px 16px; background: var(--tertiary-color); border: 0; cursor: pointer;
  font-weight: 800; text-align: left;
}
.chev { transition: transform .18s ease; }
.chev.open { transform: rotate(180deg); }

.body { padding: 16px; display: grid; gap: 12px; }
.label { font-weight: 800; }
.input {
  background: var(--tertiary-color); border: 2px solid var(--text-color);
  border-radius: 12px; padding: 10px 12px; color: var(--text-color); width: 100%;
}
.pw { display: flex; align-items: center; gap: 8px; }
.pw .input { flex: 1; }
.icon-btn { border: 2px solid var(--text-color); background: var(--tertiary-color); border-radius: 10px; padding: 8px 10px; cursor: pointer; }

.actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 4px; }
.btn { background: var(--primary-color); color: var(--text-color); border: 2px solid var(--text-color); border-radius: 10px; padding: 10px 14px; font-weight: 800; cursor: pointer; }
.btn.danger { background: #fee2e2; color: #991b1b; border-color: #991b1b; }

.toast {
  position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%);
  background: var(--primary-color); color: var(--text-color);
  border: 2px solid var(--text-color); border-radius: 12px;
  padding: 10px 16px; font-weight: 800; z-index: 1200;
}

.fade-enter-active, .fade-leave-active { transition: opacity .16s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>


