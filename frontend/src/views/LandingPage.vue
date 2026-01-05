<template>
    <div>
        <!-- Logout Success Message -->
        <div v-if="showLogoutSuccess" class="logout-success-banner">
            <div class="logout-success-content">
                <svg class="logout-success-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clip-rule="evenodd" />
                </svg>
                <span>You have successfully logged out.</span>
            </div>
        </div>
        <section class="hero-image-row">
            <div class="hero-image-left">
                <img class="full-img" :src="heroImg" alt="heroImg" />
            </div>
            <div class="hero-text-right">
                <h1 class="hero-title">Campus Chow</h1>
                <p class="hero-subtitle">Connecting students with campus food delivery by fellow students.</p>
                <button class="hero-button" @click="handleHomeClick">Get Started</button>
            </div>
        </section>

        <!-- Why Use Campus Chow Section -->

        <section class="section benefits-section">
            <div class="text-center benefits-header">
                <h2 class="section-title">Why Use Campus Chow?</h2>
                <p class="section-subtitle">
                    Our platform offers unique advantages for the campus community
                </p>
            </div>
            <div class="row text-center justify-content-center">
                <div class="col-md-4 benefit">
                    <img src="../assets/images/time.svg" alt="Save Time" class="benefit-icon" />
                    <h5 class="benefit-title">Save Time</h5>
                    <p class="benefit-text">
                        No need to leave class or study spots. Get food delivered during short breaks.
                    </p>
                </div>
                <div class="col-md-4 benefit">
                    <img src="../assets/images/money.svg" alt="Earn Money" class="benefit-icon" />
                    <h5 class="benefit-title">Earn Money</h5>
                    <p class="benefit-text">
                        Turn free time between classes into an earning opportunity by delivering food.
                    </p>
                </div>
                <div class="col-md-4 benefit">
                    <img src="../assets/images/peers.svg" alt="Connect with Peers" class="benefit-icon" />
                    <h5 class="benefit-title">Connect with Peers</h5>
                    <p class="benefit-text">
                        Build community by helping fellow students and making new connections.
                    </p>
                </div>
            </div>
        </section>

        <!-- Testimonials -->
        <section class="section">
            <h2 class="testimonial-header section-title">Hear what our customers say about us!</h2>
            <Testimonials />
        </section>

        <!-- CTA Section -->
        <section class="cta-section text-center">
            <h2 class="cta-title">Ready to Get Started?</h2>
            <p class="cta-subtitle">Join <strong>Campus Chow</strong> today and transform how you get food on
                campus!</p>
            <router-link v-if="!isAuthenticated" to="/signup">
                <button class="cta-button">Sign Up Now</button>
            </router-link>
        </section>

        <!-- Footer Section -->
        <footer class="footer">
            <div class="footer-container">
                <div class="row footer-content">
                    <div class="col-md-4 mb-3">
                        <h5>Campus Chow</h5>
                        <p>
                            Connecting students with campus food delivery by fellow students.
                        </p>
                    </div>
                    <div class="col-md-4 mb-3">
                        <h5>Quick Links</h5>
                        <ul class="list-unstyled footer-links">
                            <li><a href="#" @click.prevent="handleHomeClick">Home</a></li>
                            <li><router-link to="/about">About Us</router-link></li>
                            <li><router-link to="/faq">FAQs</router-link></li>
                            <li><router-link to="/contact">Contact</router-link></li>
                        </ul>
                    </div>
                    <div class="col-md-4 mb-3">
                        <h5>Contact</h5>
                        <!-- <p>SMU Campus</p> -->
                        <p>Email: campuschow.dev@gmail.com</p>
                    </div>
                </div>
                <hr class="footer-divider" />
                <p class="text-center footer-copy">© 2025 Campus Chow. All rights reserved.</p>
            </div>
        </footer>
    </div>
    <!-- </div> -->
</template>

<script lang="js">
import { defineComponent, ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
// import { useAuthStore } from '@/stores/auth.js'  // Commented out for frontend-only
import Testimonials from '../components/Testimonials.vue'
import heroImg from '../assets/images/hero_img.jpg'

export default defineComponent({
    name: 'LandingPage',
    components: { Testimonials },
    setup() {
        const router = useRouter()
        const route = useRoute()
        // const authStore = useAuthStore()  // Commented out for frontend-only
        const showLogoutSuccess = ref(false)

        // Mock authentication state for frontend development
        const isAuthenticated = ref(false)  // Set to true to test authenticated state

        function triggerLogoutMessage() {
            showLogoutSuccess.value = true
            setTimeout(() => {
                showLogoutSuccess.value = false
            }, 3500)
        }

        function checkLogoutFlag() {
            if (sessionStorage.getItem('justLoggedOut') === 'true') {
                sessionStorage.removeItem('justLoggedOut')
                triggerLogoutMessage()
            }
        }

        onMounted(() => {
            checkLogoutFlag()
        })

        watch(() => route.fullPath, () => {
            checkLogoutFlag()
        })

        return {
            heroImg,
            showLogoutSuccess,
            isAuthenticated,
            handleHomeClick: () => {
                // Mock authentication check
                if (isAuthenticated.value) {
                    router.push('/home')
                } else {
                    router.push('/signup')
                }
            }
            // authStore  // Commented out for frontend-only
        }
    }
})
</script>

<style scoped>
/* Full-width hero */
.hero-image-row {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    background-color: var(--secondary-color);
    width: 100vw;
    margin-left: calc(-50vw + 50%);
}

/* Hero section styles */
.hero-image-left,
.hero-text-right {
    flex: 1;
    padding-left: 10rem;
    padding-top: 5rem;
    padding-bottom: 5rem;
}

.hero-title {
    font-family: var(--font-heading);
    font-size: 7rem;
    font-weight: 700;
    color: var(--text-color);
}

.hero-subtitle {
    font-family: var(--font-body);
    font-size: 2rem;
    font-weight: 600;
    color: var(--text-color);
    margin-bottom: 2rem;
}

.hero-button {
    background-color: var(--primary-color);
    color: var(--text-color);
    font-family: var(--font-body);
    font-size: 1.125rem;
    font-weight: 600;
    padding: 0.75rem 1.5rem;
    border-radius: 2rem;
    border: 0px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    cursor: pointer;
}

.hero-button:hover {
    background-color: var(--primary-dark);
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.full-img {
    max-width: 100%;
    height: auto;
    display: block;
}

/* Why Use Smunch */
.benefits-section {
    background-color: var(--secondary-color);
    width: 100vw;
}

.benefits-header {
    margin-bottom: 4rem;
}

.section-title {
    font-family: var(--font-heading);
    font-size: 2.25rem;
    font-weight: bold;
    color: var(--text-color);
}

.section-subtitle {
    font-family: var(--font-body);
    font-size: 1.25rem;
    color: var(--text-color);
    opacity: 0.8;
}

.benefit-icon {
    width: 100px;
    height: 100px;
    margin-bottom: 1rem;
}

.benefit-title {
    font-family: var(--font-heading);
    font-size: 1.2rem;
    font-weight: bold;
    color: var(--text-color);
}

.benefit-text {
    font-family: var(--font-body);
    font-size: 0.95rem;
    color: var(--text-color);
    opacity: 0.8;
}

.cta-section {
    background-color: var(--primary-color);
    color: var(--text-color);
}

.cta-title {
    font-family: var(--font-heading);
    font-size: 2rem;
    font-weight: bold;
    color: var(--text-color);
}

.cta-subtitle {
    font-family: var(--font-body);
    font-size: 1.2rem;
    margin-bottom: 2rem;
    color: var(--text-color);
}

.cta-button {
    background-color: var(--text-color);
    color: var(--primary-color);
    font-family: var(--font-body);
    border: 2px solid var(--text-color);
    padding: 0.75rem 2rem;
    font-size: 1rem;
    font-weight: 600;
    border-radius: 2rem;
    transition: all 0.3s ease;
    cursor: pointer;
}

.cta-button:hover {
    background-color: transparent;
    color: var(--text-color);
    border: 2px solid var(--text-color);
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.testimonial-header {
    text-align: center;
}

/* Footer */
.footer {
    background-color: var(--text-color);
    color: var(--secondary-color);
    padding: 3rem 1rem;
}

.footer-container {
    max-width: 1280px;
    margin: 0 auto;
}

.footer-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 2rem;
}

.footer-content>div {
    flex: 1;
    text-align: center;
}

.footer-content h5 {
    font-family: var(--font-heading);
    color: var(--primary-color);
    margin-bottom: 1rem;
}

.footer-content p {
    font-family: var(--font-body);
    color: var(--secondary-color);
}

.footer-links li {
    margin-bottom: 0.5rem;
}

.footer-links a {
    font-family: var(--font-body);
    color: var(--secondary-color);
    text-decoration: none;
    transition: all 0.3s ease;
}

.footer-links a:hover {
    color: var(--primary-color);
    text-decoration: none;
}

.footer-divider {
    border-top: 1px solid var(--primary-color);
    margin: 1.5rem 0;
}

.footer-copy {
    font-family: var(--font-body);
    font-size: 0.85rem;
    color: var(--secondary-color);
    opacity: 0.8;
}

.logout-success-banner {
    position: fixed;
    top: 70px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 2000;
    display: flex;
    justify-content: center;
    width: 100vw;
    pointer-events: none;
}

.logout-success-content {
    background: var(--primary-color);
    color: var(--text-color);
    padding: 18px 32px;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(252, 188, 5, 0.3);
    border: 2px solid var(--text-color);
    display: flex;
    align-items: center;
    gap: 12px;
    font-family: var(--font-heading);
    font-size: 1.2rem;
    font-weight: 600;
    margin: 0 auto;
    pointer-events: all;
}

.logout-success-icon {
    width: 24px;
    height: 24px;
    flex-shrink: 0;
    color: var(--text-color);
}
</style>