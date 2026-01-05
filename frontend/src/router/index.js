import { createRouter, createWebHistory } from "vue-router";

import LandingPage from "@/views/LandingPage.vue";
import Home from "@/views/Home.vue";
import ProfilePage from "@/views/ProfilePage.vue";
import OrderPage from "@/views/OrderPage.vue";
import ActiveOrdersPage from "@/views/ActiveOrdersPage.vue";
import OrderHistoryPage from "@/views/OrderHistoryPage.vue";
import FAQPage from "@/views/FAQPage.vue";
import ContactPage from "@/views/ContactPage.vue";
import Signup from "@/views/Signup.vue";
import Login from "@/views/Login.vue";
import Run from "@/views/Run.vue";
import OrderMerchant from '../views/OrderMerchant.vue'
import AdminDashboard from "../views/AdminDashboard.vue";
import MerchantMenu from "../views/MerchantMenu.vue";
import CartPage from '../views/CartPage.vue';
import SelectLocation from '../views/SelectLocation.vue';
import OrderSummary from '../views/OrderSummary.vue';
import PlayPage from '../views/PlayPage.vue';
import Payment from '../views/Payment.vue';
import AdminManageUsers from '../views/AdminManageUsers.vue';
import AdminActiveOrders from '../views/AdminActiveOrders.vue';
import AdminSettings from '../views/AdminSettings.vue';

const routes = [
  { path: "/", redirect: "/login" },

  // public routes
  { path: "/login", name: "login", component: Login, meta: { hideNavbar: true }},
  { path: "/signup", name: "signup", component: Signup, meta: { hideNavbar: true }},
  { path: "/order", name: "order", component: OrderPage },
  { path: "/run", name: "run", component: Run },
  { path: "/landing", name: "landing", component: LandingPage },

  // profile pages
  { path: "/profile", name: "profile", component: ProfilePage, meta: { requiresAuth: true, onlyRoles: ["USER"] }},
  { path: "/activeorders", name: "activeorders", component: ActiveOrdersPage },
  { path: "/orderhistory", name: "orderhistory", component: OrderHistoryPage },
  { path: "/faq", name: "faq", component: FAQPage },
  { path: "/contact", name: "contact", component: ContactPage },

  // ✅ NEW: Merchant route with dynamic merchantId
  { 
    path: "/merchant/menu/:merchantId", 
    name: "merchantMenu", 
    component: MerchantMenu, 
    meta: { requiresAuth: true, onlyRoles: ["MERCHANT"] } 
  },

  // PLAY
  { path: "/game", name: "play", component: PlayPage, meta: { requiresAuth: true, onlyRoles: ["USER"] }},

  // Admin routes
  { path: "/admin", name: "adminDashboard", component: AdminDashboard, meta: { requiresAuth: true, onlyRoles: ["ADMIN"], adminLayout: true, hideNavbar: true } },
  { path: '/admin/users', name: 'AdminManageUsers', component: AdminManageUsers, meta: { requiresAuth: true, onlyRoles: ["ADMIN"], adminLayout: true, hideNavbar: true } },
  { path: '/admin/orders/active', name: 'AdminActiveOrders', component: AdminActiveOrders, meta: { requiresAuth: true, onlyRoles: ["ADMIN"], adminLayout: true, hideNavbar: true } },
  { path: '/admin/settings', name: 'AdminSettings', component: AdminSettings, meta: { requiresAuth: true, onlyRoles: ["ADMIN"], adminLayout: true, hideNavbar: true } },

  // protected routes
  { path: "/home", name: "home", component: Home, meta: { requiresAuth: true, onlyRoles: ["USER"] } },
  { path: '/order/:id', name: 'orderMerchant', component: OrderMerchant, meta: { requiresAuth: true } },
  { path: '/cart', name: 'cartPage', component: CartPage, meta: { requiresAuth: true } },
  { path: '/location', name: 'selectLocation', component: SelectLocation, meta: { requiresAuth: true } },
  { path: '/summary', name: 'orderSummary', component: OrderSummary, meta: { requiresAuth: true } },
  { path: '/payment', name: 'payment', component: Payment, meta: { requiresAuth: true } },

  { path: "/:pathMatch(.*)*", redirect: "/home" },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// ✅ UPDATED: Enhanced router guard with merchant handling
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem("jwt_token");
  const role = (localStorage.getItem("user_role") || "").toUpperCase();
  const merchantId = localStorage.getItem("merchant_id");

  // ✅ CRITICAL FIX: Detect broken state
  // If user has merchant_id but NO role, they're in a broken state (logged out improperly)
  if (merchantId && !role) {
    console.warn('Broken state detected: merchant_id exists but no role. Cleaning up...');
    localStorage.removeItem("merchant_id");
    localStorage.removeItem("merchant_email");
    localStorage.removeItem("merchant_name");
    if (to.name !== "login") {
      return next({ name: "login" });
    }
  }

  // Need a token for protected routes? (merchants use merchantId instead)
  if (to.meta?.requiresAuth) {
    // For merchant routes, check merchantId
    if (role === "MERCHANT" && !merchantId) {
      return next({ name: "login" });
    }
    // For other roles, check token
    if (role !== "MERCHANT" && !token) {
      return next({ name: "login" });
    }
  }

  // Logged-in users going to /login → route by role
  if (to.name === "login") {
    if (role === "ADMIN" && token) {
      return next({ name: "adminDashboard" });
    }
    if (role === "MERCHANT" && merchantId) {
      return next({ name: "merchantMenu", params: { merchantId } });
    }
    if (role === "USER" && token) {
      return next({ name: "home" });
    }
  }

  // Fine-grained role gating with onlyRoles
  if (to.meta?.onlyRoles) {
    if (!role) return next({ name: "login" });
    if (!to.meta.onlyRoles.map(r => r.toUpperCase()).includes(role)) {
      // Bounce to that role's home
      if (role === "ADMIN") return next({ name: "adminDashboard" });
      if (role === "MERCHANT" && merchantId) return next({ name: "merchantMenu", params: { merchantId } });
      return next({ name: "home" });
    }
  }

  next();
});

export default router;