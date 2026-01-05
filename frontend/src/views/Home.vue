<template>
  <div class="home">

    <!-- Welcome Message -->
    <transition name="slide-down">
      <div v-if="showWelcomeMessage" class="welcome-message">
        <div class="welcome-content">
          <svg class="success-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
          </svg>
          <span>Welcome back, {{ userName }}! You've successfully logged in.</span>
        </div>
      </div>
    </transition>
    
    <div class="home-content">
      <h1 class="greeting">Hi {{ userName || 'there' }}, what would you like to do today?</h1>
      <div class="options">
        <div class="card order" @click="goToOrder">
          <img :src="OrderIcon" alt="order icon" class="icon" />
          <p>Order with Campus Chow!</p>
        </div>
        <div class="card run" @click="goToRun">
          <img :src="RunIcon" alt="run icon" class="icon" />
          <p>Run with Campus Chow!</p>
        </div>
      </div>
    </div>
    <!-- <DinoWeather v-if="weatherLoaded && weather" :raining="weather.raining" :message="weather.message" /> -->
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "@/components/useAuth";
import OrderIcon from "../assets/images/order.svg";
import RunIcon from "../assets/images/deliver.svg";

const router = useRouter();

// auth: grab user + loader
const { user, loadMe } = useAuth();
const userName = computed(() => user.value?.name || localStorage.getItem("user_name") || "there");

// ui state
const showWelcomeMessage = ref(false);

// nav
const goToOrder = () => router.push("/order");
const goToRun = () => router.push("/run");

onMounted(async () => {
  // show “welcome back” if just logged in
  if (sessionStorage.getItem("justLoggedIn") === "true") {
    showWelcomeMessage.value = true;
    sessionStorage.removeItem("justLoggedIn");
    setTimeout(() => (showWelcomeMessage.value = false), 3000);
  }

  // load from backend (/api/users/me). falls back to cached name if offline
  await loadMe();
});
</script>

<style scoped>
* { box-sizing: border-box; }

.home {
  width: 100vw;
  height: auto;
  background: var(--secondary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 6rem 0;
}

.home-content {
  width: 100%;
  max-width: 900px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  animation: fadeInUp 0.6s ease-out;
}

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
  flex-shrink: 0;
  color: var(--text-color);
}

/* Slide down animation for welcome message */
.slide-down-enter-active, .slide-down-leave-active {
  transition: all 0.4s ease;
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}

.greeting {
  font-family: var(--font-heading);
  font-size: 2.6rem;
  font-weight: 800;
  color: var(--text-color);
  margin-bottom: 2.5rem;
  text-align: center;
  letter-spacing: -0.01em;
  text-shadow: 0 2px 8px rgba(34, 32, 30, 0.08);
  animation: fadeInUp 0.8s ease-out 0.2s both;
}

.options {
  display: flex;
  gap: 3rem;
  justify-content: center;
  align-items: center;
}

.card {
  width: 270px;
  height: 270px;
  border-radius: 22px;
  box-shadow: 0 8px 32px rgba(34, 32, 30, 0.12);
  cursor: pointer;
  padding: 2.5rem 1.5rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: var(--tertiary-color);
  transition: transform 0.18s, box-shadow 0.18s, background 0.18s;
  border: 0px;
}

.card.order {
  animation: fadeInUp 0.8s ease-out 0.4s both;
}

.card.run {
  animation: fadeInUp 0.8s ease-out 0.6s both;
}

.card:hover {
  transform: translateY(-10px) scale(1.04);
  box-shadow: 0 16px 48px rgba(34, 32, 30, 0.18);
  background: var(--primary-color);
}

.icon {
  width: 100px;
  height: 100px;
  margin-bottom: 1.5rem;
  filter: drop-shadow(0 2px 8px rgba(34, 32, 30, 0.10));
  transition: transform 0.3s ease;
}

.card:hover .icon {
  transform: scale(1.1);
}

.card p {
  font-family: var(--font-heading);
  font-size: 1.3rem;
  font-weight: 700;
  margin: 0;
  text-align: center;
  color: var(--text-color);
}

/* Fade in up animation */
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

@media (max-width: 900px) {
  .options {
    flex-direction: column;
    gap: 2rem;
  }
  .card {
    width: 90vw;
    max-width: 350px;
    height: 200px;
    padding: 1.5rem 1rem;
  }
}

@media (max-width: 480px) {
  .home-content {
    padding: 1rem;
  }
  
  .greeting {
    font-size: 2rem;
    margin-bottom: 2rem;
  }
  
  .options {
    gap: 1.5rem;
  }
  
  .card {
    width: 95vw;
    max-width: 300px;
    height: 180px;
    padding: 1.2rem 0.8rem;
  }
  
  .icon {
    width: 70px;
    height: 70px;
    margin-bottom: 1rem;
  }
  
  .card p {
    font-size: 1.1rem;
  }
  
  .welcome-message {
    top: 70px;
    left: 50%;
    transform: translateX(-50%);
    max-width: 90vw;
    padding: 10px 16px;
  }
  
  .welcome-content {
    font-size: 0.85rem;
  }
  
  .home-content {
    position: relative;
    padding: 60px 1rem 1rem;
  }
}
</style>