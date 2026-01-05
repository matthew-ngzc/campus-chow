<!-- 
 REIWEN : 
    This is the root and first component that gets rendered by main.ts 
    Think of it like the master page -- every viewpage rendered through routing will be inserted in App.vue 

    What should be inside here?
    - Navbar component (because we want to use it in every page)
    - <RouterView /> 
    - Reusable global UI elements like Footers, Toasts and Modals 
    - Global error handlers / loading states 
 -->

<script setup lang="js">
import Navbar from './components/Navbar.vue'
import EmptyHeader from './components/EmptyHeader.vue'
import { RouterLink, RouterView } from 'vue-router'
// import { useAuthStore } from '@/stores/auth' // for supabase realtime
// import { globalRealtimeManager } from '@/services/globalRealtimeManager' // for supabase realtime
// import { watch } from 'vue' // for supabase realtime
import { useRoute } from 'vue-router'
import AdminNavbar from './components/AdminNavbar.vue' 

const route = useRoute()

// AUTHENTICATION - Commented out for frontend-only version
// const authStore = useAuthStore()

// Watch for authentication changes
// watch(() => authStore.isAuthenticated, (isAuthenticated) => {
//   if (isAuthenticated) {
//     globalRealtimeManager.initializeSubscriptions(authStore)
//   } else {
//     globalRealtimeManager.cleanupSubscriptions()
//   }
// }, { immediate: true })

</script>


<template>
  <div
    class="app-container"
    :class="{
      'no-global-header': $route.meta?.hideNavbar,
      'admin-layout': $route.meta?.adminLayout
    }"
  >
    <!-- normal pages -->
    <header v-if="!$route.meta?.hideNavbar && !$route.meta?.adminLayout">
      <Navbar />
    </header>

    <!-- login/signup -->
    <header v-else-if="$route.meta?.hideNavbar && !$route.meta?.adminLayout">
      <EmptyHeader />
    </header>

    <!-- admin pages -->
    <header v-else-if="$route.meta?.adminLayout">
      <AdminNavbar />  <!-- <-- render it here -->
    </header>

    <main>
      <RouterView />
    </main>
  </div>
</template>





<style scoped>
/* Full-page layout */
html,
body,
.app-container {
  min-height: 100vh;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}

/* Keep header fixed at top */
header {
  position: sticky;
  top: 0;
  width: 100%;
  background-color: #fff;
  z-index: 1000;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

/* Nav layout */
nav {
  display: flex;
  justify-content: center;
  gap: 2rem;
  padding: 1.2rem 0;
}

/* Nav links */
nav a {
  font-size: 14px;
  font-weight: 500;
  color: #444;
  text-decoration: none;
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}

nav a:hover {
  background-color: #f0f0f0;
  color: #007bff;
}

nav a.router-link-exact-active {
  color: #007bff;
  border-bottom: 2px solid #007bff;
}

/* Add spacing for page content */
main {
  width: 100%;
  margin: 0;
  padding: 0;
  flex-grow: 1;
}

/* for admin routes only */
.app-container.admin-layout .navbar-box {
  position: sticky; /* AdminNavbar sticks */
  top: 0;
  z-index: 1000;
}

/* kill global centering + padding just for admin */
.app-container.admin-layout #app,
.app-container.admin-layout main,
.app-container.admin-layout body {
  margin: 0 !important;
  padding: 0 !important;
  text-align: initial !important;
}

/* make sure admin navbar sits at top */
.app-container.admin-layout .navbar-box {
  position: sticky;
  top: 0;
  z-index: 1000;
}
</style>


