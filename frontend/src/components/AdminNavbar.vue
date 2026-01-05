<!-- src/components/AdminNavbar.vue -->
<script setup>
import { onMounted, computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useAdminAuth } from "@/components/useAdminAuth";

const router = useRouter();
const { admin, loadAdminMe, logout } = useAdminAuth();

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";
const resolveUrl = (v) => {
  if (!v) return "";
  if (v.startsWith("http")) {
    if (v.startsWith("http://localhost/") && !v.includes("://localhost:"))
      return v.replace("http://localhost/", "http://localhost:8000/");
    return v;
  }
  return v.startsWith("/") ? `${API_BASE}${v}` : `${API_BASE}/${v}`;
};

const isOpen = ref(false);
const toggle = (e) => { e.stopPropagation(); isOpen.value = !isOpen.value; };
const close  = () => { isOpen.value = false; };
const outside = (e) => { if (!e.target.closest(".profile-wrapper")) close(); };

const name = computed(() =>
  admin.value?.name || localStorage.getItem("user_name") || "Admin"
);
const avatarFallback = computed(() =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name.value)}&background=FCBC05&color=22201E&size=200`
);
const avatarSrc = computed(() => {
  const apiVal = admin.value?.profile_picture || "";
  const stored = localStorage.getItem("user_profile_picture") || "";
  const url = resolveUrl(apiVal || stored);
  return url || avatarFallback.value;
});
function onErr(e){ if (e?.target && e.target.src !== avatarFallback.value) e.target.src = avatarFallback.value; }

function go(path){ router.push(path); }

onMounted(async () => {
  document.addEventListener("click", outside);
  await loadAdminMe();
});
</script>

<template>
  <nav class="navbar-box">
    <!-- left: brand -->
    <div class="navbar-left">
      <router-link to="/admin" class="logo-link">
        <img src="@/assets/images/campuschow_logo_landscape.png" alt="CampusChow" class="logo-image" />
      </router-link>
      <span class="admin-badge">admin</span>
    </div>

    <!-- center: admin links -->
    <div class="navbar-center">
      <router-link to="/admin">dashboard</router-link>
      <router-link to="/admin/orders/active">active orders</router-link>
      <router-link to="/admin/users">manage users</router-link>
    </div>

    <!-- right: settings + avatar -->
    <div class="navbar-right">
      <button class="icon-btn" title="Admin Settings" @click="go('/admin/settings')">
        <!-- gear icon -->
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" stroke-width="1.8"/>
          <path d="M19 12a7 7 0 0 0-.09-1.1l2.02-1.57-1.9-3.29-2.43.78A7.2 7.2 0 0 0 14.2 5l-.4-2.5h-3.6L9.8 5a7.2 7.2 0 0 0-2.4 1.8l-2.43-.78L3.07 9.3 5.1 10.9A7 7 0 0 0 5 12c0 .37.03.73.09 1.1l-2.02 1.57 1.9 3.29 2.43-.78c.7.75 1.52 1.35 2.4 1.8l.4 2.5h3.6l.4-2.5c.88-.45 1.7-1.05 2.4-1.8l2.43.78 1.9-3.29-2.02-1.57c.06-.36.09-.73.09-1.1Z" stroke="currentColor" stroke-width="1.8"/>
        </svg>
      </button>

      <div class="profile-wrapper" @click="toggle">
        <span class="user-name">{{ name }}</span>
        <div class="icon-circle">
          <img :src="avatarSrc" @error="onErr" alt="avatar" class="avatar-img" />
        </div>
      </div>
    </div>

    <!-- dropdown -->
    <div v-if="isOpen" class="profile-menu">
      <div class="menu-header">
        <div class="dropdown-user-name">hi, {{ name }}!</div>
        <div class="close" @click.stop="close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>
      <hr />
      <ul>
        <li><a @click.prevent="go('/admin')">Admin Dashboard</a></li>
        <li><a @click.prevent="go('/admin/users')">Manage Users</a></li>
        <li><a @click.prevent="go('/admin/orders/active')">Active Orders</a></li>
        <li><a @click.prevent="go('/admin/settings')">Admin Settings</a></li>
        <li style="border-top:1px solid var(--primary-color); margin:8px 0;"></li>
        <li><button class="logout-btn" @click.stop="logout">Log out</button></li>
      </ul>
    </div>
  </nav>
</template>

<style scoped>
.navbar-box{
  background: var(--secondary-color);
  padding:10px 30px;
  display:flex;justify-content:space-between;align-items:center;
  width:100%;
  position: sticky;   /* <-- changed */
  top: 0;             /* <-- added */
  z-index: 1000;
  box-shadow:0 2px 8px rgba(0,0,0,.1);
}
.navbar-left{display:flex;align-items:center;gap:8px}
.logo-link{display:flex;align-items:center}
.logo-image{height:80px;width:auto;object-fit:contain;display:block}
.admin-badge{margin-left:8px;padding:2px 8px;border-radius:999px;border:2px solid var(--primary-color);background:var(--tertiary-color);font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.04em}
.navbar-center{position:absolute;left:50%;transform:translateX(-50%);display:flex;gap:20px}
.navbar-center a{color:var(--text-color);font-weight:600;text-decoration:none;font-size:20px;padding:8px 16px;border-radius:8px;transition:.3s}
.navbar-center a:hover,.navbar-center a.router-link-active{background:var(--primary-color)}
.navbar-right{display:flex;align-items:center;gap:14px}
.icon-btn{all:unset;display:flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:10px;border:2px solid var(--primary-color);background:var(--tertiary-color);cursor:pointer}
.profile-wrapper{cursor:pointer;display:flex;align-items:center;gap:10px;padding:4px;border-radius:50%}
.icon-circle{width:36px;height:36px;background:var(--tertiary-color);border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid var(--text-color);overflow:hidden}
.avatar-img{width:100%;height:100%;object-fit:cover;border-radius:50%}
.profile-menu{position:absolute;right:0;top:70px;background:var(--secondary-color);color:var(--text-color);border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.15);width:220px;z-index:100;padding:16px;border:2px solid var(--primary-color)}
.menu-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
.dropdown-user-name{font-weight:600;font-size:16px}
.close{width:24px;height:24px;display:flex;align-items:center;justify-content:center;border-radius:50%;cursor:pointer}
.profile-menu ul{list-style:none;padding:0;margin:0}
.profile-menu li{border-radius:8px;cursor:pointer;margin:2px 0}
.profile-menu li:hover{background:var(--tertiary-color)}
.profile-menu li a, .logout-btn{all:unset;display:block;width:100%;padding:10px 12px;font-size:16px;font-weight:500;cursor:pointer}
.logout-btn{border:1px solid var(--primary-color);border-radius:8px;background:var(--tertiary-color);text-align:center}
.logout-btn:hover{background:var(--primary-color)}
@media (max-width:768px){.navbar-center{display:none}}
</style>
