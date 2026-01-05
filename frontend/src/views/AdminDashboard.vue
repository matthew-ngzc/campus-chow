<!-- views/AdminDashboard.vue -->
<template>
  <div class="admin-page">
    <div class="admin-content">
      <h1 class="greeting">Welcome admin {{ userName || 'there' }}</h1>
      <p class="subtitle">What do you want to manage today?</p>

      <div class="options">
        <div class="card orders" @click="goToActiveOrders">
          <img :src="OrdersIcon" alt="active orders" class="icon" />
          <p>View Active Orders</p>
          <small class="hint">See live orders, statuses, & escalations</small>
        </div>

        <div class="card users" @click="goToManageUsers">
          <img :src="UsersIcon" alt="manage users" class="icon" />
          <p>Manage Users</p>
          <small class="hint">Create, edit, deactivate, assign roles</small>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAdminAuth } from "@/components/useAdminAuth";
import AdminNavbar from "@/components/AdminNavbar.vue";

import OrdersIcon from "@/assets/images/order.svg";
import UsersIcon from "@/assets/images/peers.svg";

const router = useRouter();
const { admin, loadAdminMe } = useAdminAuth();

const userName = computed(() =>
  admin.value?.name || localStorage.getItem("user_name") || "there"
);

const showWelcomeMessage = ref(false);

const goToActiveOrders = () => router.push("/admin/orders/active");
const goToManageUsers  = () => router.push("/admin/users");

onMounted(async () => {
  await loadAdminMe();  // <-- calls /api/admin/me via Kong

  // bounce if somehow not admin (extra safety)
  const role = (localStorage.getItem("user_role") || "").toUpperCase();
  if (role !== "ADMIN") router.push("/login");

  if (sessionStorage.getItem("justLoggedIn") === "true") {
    showWelcomeMessage.value = true;
    sessionStorage.removeItem("justLoggedIn");
    setTimeout(() => (showWelcomeMessage.value = false), 3000);
  }
});
</script>


<style scoped>
* { box-sizing: border-box; }

.admin-page {
  min-height: 100vh;
  background: var(--secondary-color);
}

.admin-content {
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;          /* center the inner container */
  padding: 2rem 1rem 3rem; /* breathing room below sticky header */
}


.admin-content {
  width: 100%;
  max-width: 1000px;
  min-height: 100%;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* welcome toast (same style language as home) */
.welcome-message {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  background: var(--primary-color);
  color: var(--text-color);
  padding: 12px 24px;
  border-radius: 12px;
  border: 2px solid var(--text-color);
  box-shadow: 0 8px 32px rgba(252, 188, 5, 0.3);
  animation: slideDown 0.5s ease-out;
}
.welcome-content {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-heading);
  font-weight: 600;
  font-size: 0.95rem;
}
.success-icon {
  width: 20px;
  height: 20px;
  color: var(--text-color);
}
@keyframes slideDown {
  from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0); }
}

.greeting {
  font-family: var(--font-heading);
  font-size: 2.6rem;
  font-weight: 800;
  color: var(--text-color);
  margin-top: 1rem;
  margin-bottom: 0.5rem;
  text-align: center;
  letter-spacing: -0.01em;
  text-shadow: 0 2px 8px rgba(34, 32, 30, 0.08);
}
.subtitle {
  color: var(--text-color);
  opacity: 0.8;
  margin-bottom: 2.2rem;
  font-weight: 600;
  font-family: var(--font-heading);
  text-align: center;
}

.options {
  display: flex;
  gap: 2.5rem;
  justify-content: center;
  align-items: stretch;
  flex-wrap: wrap;
}

.card {
  width: 290px;
  height: 260px;
  border-radius: 22px;
  box-shadow: 0 8px 32px rgba(34, 32, 30, 0.12);
  cursor: pointer;
  padding: 2rem 1.4rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--tertiary-color);
  transition: transform 0.18s, box-shadow 0.18s, background 0.18s, border 0.18s;
  border: 0;
  text-align: center;
}
.card:hover {
  transform: translateY(-10px) scale(1.04);
  box-shadow: 0 16px 48px rgba(34, 32, 30, 0.18);
  background: var(--primary-color);
}
.icon {
  width: 96px;
  height: 96px;
  margin-bottom: 1.2rem;
  filter: drop-shadow(0 2px 8px rgba(34, 32, 30, 0.10));
}
.card p {
  font-family: var(--font-heading);
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--text-color);
  margin: 0 0 0.25rem 0;
}
.hint {
  font-size: 0.85rem;
  opacity: 0.8;
  color: var(--text-color);
}

/* responsive */
@media (max-width: 900px) {
  .card { width: 90vw; max-width: 360px; height: 210px; }
  .icon { width: 80px; height: 80px; }
}
@media (max-width: 480px) {
  .greeting { font-size: 2rem; }
  .subtitle { font-size: 0.95rem; }
  .card { width: 95vw; max-width: 320px; height: 190px; padding: 1.2rem 1rem; }
  .icon { width: 70px; height: 70px; }
  .welcome-message { top: 70px; max-width: 90vw; padding: 10px 16px; }
  .welcome-content { font-size: 0.85rem; }
}
</style>
