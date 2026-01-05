<template>
  <div class="admin no-scroll">
    <div class="wrap">
      <!-- Header -->
      <div class="header">
        <div class="accent"></div>
        <h1 class="title">Manage Users</h1>
        <p class="subtitle">Search, review, update, or delete user accounts</p>
      </div>

      <!-- Toolbar -->
      <div class="toolbar card">
        <div class="search-wrap">
          <span class="search-icon" aria-hidden="true">🔎</span>
          <input
            v-model="search"
            @keyup.enter="onSearch"
            class="search-input"
            type="text"
            placeholder="Search by id, name, email, phone…"
          />
        </div>

        <button class="btn" @click="onSearch">Search</button>
        <div class="divider"></div>

        <label class="size-label">Rows:</label>
        <select v-model.number="size" @change="fetchUsers" class="size-select">
          <option :value="10">10</option>
          <option :value="20">20</option>
          <option :value="50">50</option>
        </select>
      </div>

      <!-- Table -->
      <div class="card table-card">
        <table class="table">
          <thead>
            <tr>
              <th class="sortable" @click="toggleSort('id')">
                ID <span class="arrow" :data-on="sortKey==='id'">{{ sortDirIcon }}</span>
              </th>
              <th class="sortable" @click="toggleSort('name')">
                Name <span class="arrow" :data-on="sortKey==='name'">{{ sortDirIcon }}</span>
              </th>
              <th class="sortable" @click="toggleSort('email')">
                Email <span class="arrow" :data-on="sortKey==='email'">{{ sortDirIcon }}</span>
              </th>
              <th class="sortable" style="width:140px" @click="toggleSort('phone')">
                Phone <span class="arrow" :data-on="sortKey==='phone'">{{ sortDirIcon }}</span>
              </th>
              <th class="sortable" style="width:120px" @click="toggleSort('role')">
                Role <span class="arrow" :data-on="sortKey==='role'">{{ sortDirIcon }}</span>
              </th>
              <th style="width:160px">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in sortedUsers" :key="u.id">
              <td>#{{ u.id }}</td>
              <td class="user-cell">
                <img :src="avatar(u)" class="avatar" alt="" />
                <div class="user-meta">
                  <div class="name">{{ u.name || '—' }}</div>
                </div>
              </td>
              <td>{{ u.email }}</td>
              <td>{{ u.phone || '—' }}</td>
              <td>
                <span class="role-badge" :data-role="(u.role || 'USER').toUpperCase()">
                  {{ (u.role || 'USER') }}
                </span>
              </td>
              <td>
                <button class="btn ghost" @click="openDetails(u)">View details</button>
              </td>
            </tr>
            <tr v-if="!loading && users.length === 0">
              <td colspan="6" class="empty">No users found.</td>
            </tr>
          </tbody>
        </table>

        <div class="pagination">
          <button class="btn ghost" :disabled="page===0 || loading" @click="prevPage">Prev</button>
          <span class="page-info">page {{ page + 1 }} • total {{ total }}</span>
          <button class="btn ghost" :disabled="(page+1) * size >= total || loading" @click="nextPage">Next</button>
        </div>
      </div>
    </div>

        <!-- Native dialog modal (no teleport needed) -->
    <dialog ref="dlg" class="umodal" @close="onDialogClosed">
        <div class="modal-header">
            <h3>User Details</h3>
            <button class="icon-btn" @click="dlgClose">✕</button>
        </div>

        <div class="modal-body">
            <div class="modal-row">
            <div class="modal-col">
                <label class="label">ID</label>
                <div class="static-box" aria-readonly="true" tabindex="-1">#{{ form.id }}</div>
            </div>
            <div class="modal-col">
                <label class="label">Role</label>
                <div class="static-box" aria-readonly="true" tabindex="-1">{{ form.role || 'USER' }}</div>
            </div>
            </div>

            <div class="grid">
            <div class="form-group">
                <label class="label">Full Name</label>
                <input v-model="form.name" class="input" type="text" />
            </div>
            <div class="form-group">
                <label class="label">Email</label>
                <input v-model="form.email" class="input" type="email" />
            </div>
            <div class="form-group">
                <label class="label">Phone</label>
                <input v-model="form.phone" class="input" type="tel" />
            </div>
            <div class="form-group">
                <label class="label">Coins</label>
                <input v-model.number="form.coins" class="input" type="number" min="0" />
            </div>
            </div>

            <div class="hint-row">
            <small>Changes here affect this user account immediately.</small>
            </div>
        </div>

        <div class="modal-actions">
            <button class="btn danger" @click="onDelete" :disabled="busy">Delete</button>
            <div class="spacer"></div>
            <button class="btn ghost" @click="dlgClose">Cancel</button>
            <button class="btn" @click="onSave" :disabled="busy">Save</button>
        </div>
    </dialog>

    <!-- Toast -->
    <div v-if="toast" class="toast">{{ toast }}</div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch, computed , nextTick} from 'vue'
import http from '@/services/http'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'
const dlg = ref(null)
const loading = ref(false)
const users   = ref([])
const total   = ref(0)
const page    = ref(0)
const size    = ref(20)
const search  = ref('')

const showModal = ref(false)
const busy = ref(false)
const toast = ref('')
const form = reactive({
  id: '', name: '', email: '', phone: '', coins: 0, role: 'USER', profile_picture: ''
})

const sortKey = ref('id')      // 'id' | 'name' | 'email' | 'phone' | 'role'
const sortDir = ref('asc')     // 'asc' | 'desc'
const sortDirIcon = computed(() => (sortDir.value === 'asc' ? '▲' : '▼'))

const sortedUsers = computed(() => {
  const arr = [...users.value]
  const key = sortKey.value
  const dir = sortDir.value === 'asc' ? 1 : -1

  return arr.sort((a, b) => {
    let va = a?.[key], vb = b?.[key]
    if (typeof va === 'string') va = va.toLowerCase()
    if (typeof vb === 'string') vb = vb.toLowerCase()
    if (va === vb) return 0
    return va > vb ? dir : -dir
  })
})

function toggleSort(k) {
  if (sortKey.value === k) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = k
    sortDir.value = 'asc'
  }
}

const avatar = (u) => {
  const p = u?.profile_picture
  if (!p) return `https://ui-avatars.com/api/?name=${encodeURIComponent(u?.name || 'U')}&background=FCBC05&color=22201E&size=64`
  const path = p.startsWith('/') ? p : `/${p}`
  return `${API_BASE}${path}`
}

async function fetchUsers() {
  loading.value = true
  try {
    const q = search.value.trim()
    const { data } = await http.get('/api/user/management', {
      params: { page: page.value, size: size.value, q }
    })
    users.value = data?.data || []
    total.value = data?.total || 0
  } finally {
    loading.value = false
  }
}

function onSearch() { page.value = 0; fetchUsers() }
function nextPage() { page.value += 1; fetchUsers() }
function prevPage() { page.value = Math.max(0, page.value - 1); fetchUsers() }

function openDetails(u) {
  // your existing form population:
  form.id = u.id
  form.name = u.name || ''
  form.email = u.email || ''
  form.phone = u.phone || ''
  form.coins = Number.isFinite(u.coins) ? u.coins : 0
  form.role = u.role || 'USER'
  form.profile_picture = u.profile_picture || ''

  // show the <dialog>
  nextTick(() => dlg.value?.showModal())
}

function dlgClose() {
  dlg.value?.close()
}

function onDialogClosed() {
  // optional: if you still track showModal elsewhere, sync it here
  // showModal.value = false
}

async function onSave() {
  if (!form.id) return
  const ok = confirm(`Are you sure you want to save changes for user #${form.id}?`)
  if (!ok) return

  busy.value = true
  try {
    const body = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      coins: form.coins
    }
    await http.patch(`/api/user/management/${form.id}`, body)
    toastNow('✅ user updated')
    showModal.value = false
    fetchUsers()
  } catch (e) {
    toastNow('❌ update failed')
  } finally {
    busy.value = false
  }
}
async function onDelete() {
  if (!form.id) return
  const ok = confirm(`Delete user #${form.id}? This cannot be undone.`)
  if (!ok) return
  busy.value = true
  try {
    await http.delete(`/api/user/management/${form.id}`)
    toastNow('🗑️ user deleted')
    showModal.value = false
    const lastPage = page.value > 0 && (page.value * size.value + 1 >= total.value)
    if (lastPage) page.value -= 1
    fetchUsers()
  } catch { toastNow('❌ delete failed') }
  finally { busy.value = false }
}

function toastNow(msg) {
  toast.value = msg
  setTimeout(() => (toast.value = ''), 1800)
}

onMounted(fetchUsers)

// debounce live search
let timer
watch(search, () => {
  clearTimeout(timer)
  timer = setTimeout(() => { page.value = 0; fetchUsers() }, 400)
})
</script>

<style scoped>
.wrap { max-width: 1200px; margin: 0 auto; padding: 120px 24px 48px; }

.header { text-align: center; margin-bottom: 24px; }
.accent { width: 80px; height: 4px; background: var(--primary-color); margin: 0 auto 14px; border-radius: 2px; }
.title { font-family: var(--font-heading); font-size: 2.2rem; font-weight: 800; color: var(--text-color); }
.subtitle { opacity: .8; color: var(--text-color); font-weight: 600; }

.card { background: var(--secondary-color); border: 2px solid var(--text-color); border-radius: 18px; padding: 16px; box-shadow: 0 8px 24px rgba(34,32,30,.08); }

.toolbar { display: flex; align-items: center; gap: 12px; padding: 12px 14px; margin: 20px 0; }
.search-wrap { position: relative; display: flex; align-items: center; flex: 1; max-width: 520px; }
.search-icon { position: absolute; left: 10px; pointer-events: none; opacity: .8; }
.search-input { width: 100%; padding: 10px 12px 10px 34px; background: var(--tertiary-color); border: 2px solid var(--text-color); border-radius: 12px; color: var(--text-color); }
.divider { flex: 1; }
.size-label { font-weight: 700; }
.size-select { background: var(--tertiary-color); border: 2px solid var(--text-color); border-radius: 12px; padding: 8px 10px; color: var(--text-color); }

.btn { background: var(--primary-color); color: var(--text-color); border: 2px solid var(--text-color); border-radius: 10px; padding: 10px 14px; font-weight: 700; cursor: pointer; transition: transform .12s; }
.btn:hover { transform: translateY(-2px); }
.btn.ghost { background: var(--tertiary-color); }
.btn.danger { background: #fee2e2; color: #991b1b; border-color: #991b1b; }

.table-card { padding: 0; overflow: hidden; }
.table { width: 100%; border-collapse: collapse; }
.table th, .table td { padding: 14px 16px; border-bottom: 1px solid rgba(34,32,30,.15); }
.table thead th { background: var(--tertiary-color); text-align: left; font-weight: 800; }
.sortable { cursor: pointer; user-select: none; }
.arrow { opacity: .25; margin-left: 6px; }
.arrow[data-on="true"] { opacity: 1; }

.user-cell { display: flex; align-items: center; gap: 10px; }
.avatar { width: 36px; height: 36px; border-radius: 50%; border: 2px solid var(--primary-color); object-fit: cover; }
.user-meta .name { font-weight: 800; }

.role-badge { display: inline-block; padding: 6px 10px; border-radius: 999px; border: 2px solid var(--text-color); background: var(--tertiary-color); font-weight: 800; text-transform: lowercase; }
.role-badge[data-role="ADMIN"] { background: var(--primary-color); }

.empty { text-align: center; opacity: .7; padding: 28px 0; }

.pagination { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 12px; background: var(--secondary-color); }
.page-info { font-weight: 700; }

/* dialog panel */
/* Center the native <dialog> perfectly and keep it scrollable */
.umodal[open] {
  position: fixed;            /* ignore normal flow */
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);  /* true center */
  margin: 0;                  /* kill default UA margins */
  width: 720px;
  max-width: 92vw;
  max-height: 85vh;
  overflow: auto;

  background: #fff;
  color: #111;
  border: 2px solid var(--text-color, #22201E);
  border-radius: 18px;
  box-shadow: 0 24px 64px rgba(0,0,0,.35);
  padding: 0;                 /* we’ll pad sections, not the shell */
}

/* darker backdrop for contrast */
.umodal::backdrop { background: rgba(0,0,0,.45); }

/* section paddings */
.modal-header,
.modal-body,
.modal-actions { padding: 16px; }

/* keep footer actions aligned */
.modal-actions { display: flex; gap: 10px; align-items: center; }
.spacer { flex: 1; }

/* inputs look like your theme */
.readonly,
.input {
  background: var(--tertiary-color);
  color: var(--text-color);
  border: 2px solid var(--text-color);
  border-radius: 10px;
  padding: 10px 12px;
}
.static-box {
  background: #f6f6f6;                 /* neutral grey */
  color: #555;
  border: 1.5px solid #d3d3d3;         /* lighter border than inputs */
  border-radius: 10px;
  padding: 10px 12px;
  cursor: default;                     /* not clickable */
  box-shadow: none;                    /* no focus style */
}
.static-box:focus { outline: none; }

.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 12px; }

@media (max-width: 720px) { .grid { grid-template-columns: 1fr; } }
.readonly { background: var(--tertiary-color); border: 2px solid var(--text-color); border-radius: 10px; padding: 10px 12px; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 12px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.label { font-weight: 800; }
.input { background: var(--tertiary-color); color: var(--text-color); border: 2px solid var(--text-color); border-radius: 10px; padding: 10px 12px; }
.hint-row { margin-top: 6px; opacity: .7; }

@media (max-width: 720px) { .grid { grid-template-columns: 1fr; } }

.toast { position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%); background: var(--primary-color); color: var(--text-color); border: 2px solid var(--text-color); border-radius: 12px; padding: 10px 16px; font-weight: 800; z-index: 1200; }
</style>

