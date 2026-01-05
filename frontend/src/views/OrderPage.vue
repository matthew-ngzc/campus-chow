<script lang="js">
import { defineComponent, onMounted, ref } from 'vue'
import { fetchParentMerchants, getChildMerchants, getMerchantInfoById } from '@/services/orderFoodService'
// import { useOrderStore } from '@/stores/order'
import { useRouter } from 'vue-router'

export default defineComponent({
    components: {
        // ChatBar
    },
    setup() {
        const merchants = ref([])
        // const orderStore = useOrderStore()
        const router = useRouter()
        const isChatExpanded = ref(false)
        const dailyChallenge = ref(null)
        const challengeCompleted = ref(false)
        const isLoading = ref(true)
        const error = ref(null)

        const handleChatStateChange = (expanded) => {
            isChatExpanded.value = expanded
        }

        // Enhanced daily challenges with better variety and rewards
        const challenges = [
            {
                id: 1,
                title: "Merchant Explorer",
                description: "Discover a new flavor adventure",
                task: "Order from a merchant you've never tried before and leave a review",
                reward: 75,
                icon: "🗺️",
                color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                difficulty: "Easy"
            },
            {
                id: 2,
                title: "Early Riser",
                description: "Beat the breakfast rush",
                task: "Complete your first two orders before 05:30 AM",
                reward: 50,
                icon: "🌅",
                color: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                difficulty: "Easy"
            },
            {
                id: 3,
                title: "Social Connector",
                description: "Spread the Campus Chow love",
                task: "Invite a friend to join Campus Chow community",
                reward: 150,
                icon: "🤝",
                color: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                difficulty: "Medium"
            },
            {
                id: 4,
                title: "Variety Seeker",
                description: "Embrace culinary diversity",
                task: "Order from 6 different merchants today",
                reward: 320,
                icon: "🎨",
                color: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
                difficulty: "Medium"
            },
            {
                id: 5,
                title: "Weekend Warrior",
                description: "Make your weekend delicious",
                task: "Complete 2 orders this weekend",
                reward: 100,
                icon: "⚡",
                color: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
                difficulty: "Easy"
            },
            {
                id: 6,
                title: "Dino Master",
                description: "Become a legendary collector",
                task: "Unlock 2 new dino characters",
                reward: 250,
                icon: "🦕",
                color: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
                difficulty: "Hard"
            },
            {
                id: 7,
                title: "Game Champion",
                description: "Show your gaming prowess",
                task: "Spend 30 minutes in the arcade",
                reward: 200,
                icon: "🏆",
                color: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
                difficulty: "Hard"
            }
        ]

        const getDailyChallenge = () => {
            const today = new Date().getDay() // 0-6 (Sunday-Saturday)
            return challenges[today]
        }

        const completeChallenge = () => {
            if (!challengeCompleted.value) {
                challengeCompleted.value = true
                // Add visual feedback and coin animation
                setTimeout(() => {
                    alert(`🎉 Amazing! Challenge "${dailyChallenge.value.title}" completed!\n\n💰 You earned ${dailyChallenge.value.reward} Campus Chow coins!\n🏅 Keep up the great work!`)
                }, 300)
            }
        }

        onMounted(async () => {
            // Set daily challenge
            dailyChallenge.value = getDailyChallenge()

            // Fetch merchants from backend
            try {
                isLoading.value = true
                error.value = null
                
                const response = await fetchParentMerchants()
                console.log('Merchants response:', response)
                
                // Handle different response structures
                // Adjust based on your actual API response format
                if (Array.isArray(response)) {
                    merchants.value = response
                } else if (response.data && Array.isArray(response.data)) {
                    merchants.value = response.data
                } else {
                    merchants.value = []
                }
                
                console.log('Loaded merchants:', merchants.value)
            } catch (err) {
                console.error('Failed to load merchants:', err)
                error.value = 'Failed to load restaurants. Please try again later.'
                
                // Fallback to mock data for development
                console.log('Using fallback mock data...')
                merchants.value = [
                    {
                        id: 1,
                        merchant_id: 1,
                        name: "Burger Palace",
                        image_url: "https://via.placeholder.com/150?text=Burger+Palace",
                        has_children: false
                    },
                    {
                        id: 2,
                        merchant_id: 2,
                        name: "Pizza Paradise",
                        image_url: "https://via.placeholder.com/150?text=Pizza+Paradise",
                        has_children: false
                    },
                    {
                        id: 3,
                        merchant_id: 3,
                        name: "Sushi Supreme",
                        image_url: "https://via.placeholder.com/150?text=Sushi+Supreme",
                        has_children: false
                    },
                    {
                        id: 4,
                        merchant_id: 4,
                        name: "Taco Fiesta",
                        image_url: "https://via.placeholder.com/150?text=Taco+Fiesta",
                        has_children: false
                    },
                    {
                        id: 5,
                        merchant_id: 5,
                        name: "Pasta Haven",
                        image_url: "https://via.placeholder.com/150?text=Pasta+Haven",
                        has_children: false
                    },
                    {
                        id: 6,
                        merchant_id: 6,
                        name: "Cafe Delight",
                        image_url: "https://via.placeholder.com/150?text=Cafe+Delight",
                        has_children: false
                    }
                ]
            } finally {
                isLoading.value = false
            }
        })

        const goToMerchant = async (merchantId) => {
            try {
                const res = await getMerchantInfoById(merchantId)
                const merchant = res.data || res
                console.log('merchant info:', merchant)

                if (merchant.hasChildren) {
                    const childRes = await getChildMerchants(merchantId)
                    merchants.value = childRes.data || childRes
                } else {
                    // If you have an order store, uncomment this:
                    // orderStore.setMerchantId(merchantId)
                    router.push({ name: 'orderMerchant', params: { id: merchantId } })
                }
            } catch (err) {
                console.error('error handling merchant click:', err)
                // Fallback: navigate anyway
                router.push({ name: 'orderMerchant', params: { id: merchantId } })
            }
        }

        return { 
            merchants, 
            goToMerchant, 
            isChatExpanded, 
            handleChatStateChange, 
            dailyChallenge, 
            challengeCompleted, 
            completeChallenge,
            isLoading,
            error
        }
    }
})
</script>

<template>
    <div class="order-page-wrapper">
        <div class="order-page" :class="{ faded: isChatExpanded }">
            <!-- Main Content -->
            <div class="order-content">
                <!-- Header Section -->
                <div class="header-section">
                    <div class="header-accent"></div>
                    <h1 class="page-title">Order with Campus Chow!</h1>
                    <p class="page-subtitle">Choose your favorite restaurant and let us handle the rest</p>
                </div>

                <!-- Loading State -->
                <div v-if="isLoading" class="loading-state">
                    <div class="loading-spinner"></div>
                    <p>Loading restaurants...</p>
                </div>

                <!-- Error State -->
                <div v-else-if="error" class="error-state">
                    <div class="error-icon">⚠️</div>
                    <h3>Oops! Something went wrong</h3>
                    <p>{{ error }}</p>
                    <button @click="$router.go(0)" class="retry-button">Try Again</button>
                </div>

                <!-- Merchant Grid -->
                <div v-else-if="merchants.length > 0" class="merchant-grid">
                    <div v-for="merchant in merchants" :key="merchant.id" class="merchant-card"
                        @click="goToMerchant(merchant.merchantId || merchant.id)">
                        <div class="card-glow"></div>
                        <div class="card-content">
                            <div class="logo-container">
                                <img :src="merchant.imageUrl" 
                                     :alt="`${merchant.name} logo`" 
                                     class="merchant-logo"
                                     @error="$event.target.src='https://via.placeholder.com/150?text=' + encodeURIComponent(merchant.name)" />
                                <div class="logo-overlay"></div>
                            </div>
                            <div class="merchant-info">
                                <h3 class="merchant-name">{{ merchant.name }}</h3>
                                <div class="delivery-info">
                                    <span class="delivery-fee">$1.00 delivery fee</span>
                                    <div class="delivery-badge">
                                        <svg class="delivery-icon" viewBox="0 0 24 24" fill="none">
                                            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2"
                                                stroke-linecap="round" stroke-linejoin="round" />
                                            <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2"
                                                stroke-linecap="round" stroke-linejoin="round" />
                                            <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2"
                                                stroke-linecap="round" stroke-linejoin="round" />
                                        </svg>
                                        <span>Fast Delivery</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="card-hover-effect"></div>
                    </div>
                </div>

                <!-- Empty State -->
                <div v-else class="empty-state">
                    <div class="empty-icon">
                        <svg viewBox="0 0 24 24" fill="none">
                            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2"
                                stroke-linecap="round" stroke-linejoin="round" />
                            <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round" />
                            <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round" />
                        </svg>
                    </div>
                    <h3>No restaurants available</h3>
                    <p>Check back later for new options!</p>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Page Layout */
.order-page-wrapper {
    position: relative;
    width: 100vw;
    height: auto;
    background: var(--secondary-color);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 4rem 0;
}

.order-page {
    font-family: var(--font-body);
    position: relative;
    width: 100%;
    max-width: 1400px;
    animation: fadeInUp 0.6s ease-out;
}

/* Header Section */
.header-section {
    text-align: center;
    margin-bottom: 60px;
    animation: fadeInUp 0.8s ease-out 0.2s both;
}

.header-accent {
    width: 60px;
    height: 4px;
    background: var(--primary-color);
    margin: 0 auto 24px;
    border-radius: 2px;
    box-shadow: 0 2px 8px rgba(252, 188, 5, 0.3);
}

.page-title {
    font-family: var(--font-heading);
    font-size: 3.2rem;
    font-weight: 800;
    color: var(--text-color);
    margin-bottom: 16px;
    letter-spacing: -0.02em;
    text-shadow: 0 2px 8px rgba(34, 32, 30, 0.08);
}

.page-subtitle {
    font-family: var(--font-body);
    font-size: 1.2rem;
    color: var(--text-color);
    font-weight: 500;
    margin: 0;
    opacity: 0.8;
}

/* Loading State */
.loading-state {
    text-align: center;
    padding: 80px 20px;
    animation: fadeInUp 0.8s ease-out;
}

.loading-spinner {
    width: 60px;
    height: 60px;
    margin: 0 auto 24px;
    border: 4px solid var(--secondary-color);
    border-top: 4px solid var(--primary-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.loading-state p {
    font-family: var(--font-body);
    font-size: 1.2rem;
    color: var(--text-color);
    font-weight: 500;
}

/* Error State */
.error-state {
    text-align: center;
    padding: 80px 20px;
    animation: fadeInUp 0.8s ease-out;
}

.error-icon {
    font-size: 4rem;
    margin-bottom: 24px;
}

.error-state h3 {
    font-family: var(--font-heading);
    font-size: 1.8rem;
    color: var(--text-color);
    font-weight: 600;
    margin-bottom: 12px;
}

.error-state p {
    font-family: var(--font-body);
    color: var(--text-color);
    font-size: 1.1rem;
    margin-bottom: 24px;
    opacity: 0.8;
}

.retry-button {
    padding: 12px 32px;
    background: var(--primary-color);
    color: var(--text-color);
    border: 2px solid var(--text-color);
    border-radius: 12px;
    font-family: var(--font-heading);
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s ease;
}

.retry-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(252, 188, 5, 0.3);
}

/* Merchant Grid */
.merchant-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 32px;
    margin-top: 40px;
    animation: fadeInUp 0.8s ease-out 0.4s both;
}

/* Merchant Card */
.merchant-card {
    position: relative;
    background: var(--tertiary-color);
    border-radius: 24px;
    padding: 32px 24px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: 0px;
    backdrop-filter: blur(20px);
    overflow: hidden;
    min-height: 320px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

.merchant-card:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: 0 20px 60px rgba(34, 32, 30, 0.15);
    background: var(--primary-color);
}

.card-glow {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--primary-color);
    opacity: 0;
    transition: opacity 0.3s ease;
    border-radius: 24px;
}

.merchant-card:hover .card-glow {
    opacity: 0.3;
}

.card-content {
    position: relative;
    z-index: 2;
    height: 100%;
    display: flex;
    flex-direction: column;
}

.logo-container {
    position: relative;
    height: 140px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 24px;
    border-radius: 16px;
    background: var(--secondary-color);
    border: 1px solid var(--text-color);
    transition: all 0.3s ease;
}

.merchant-card:hover .logo-container {
    background: var(--tertiary-color);
    border-color: var(--primary-dark);
}

.merchant-logo {
    max-height: 100px;
    max-width: 100%;
    object-fit: contain;
    filter: drop-shadow(0 4px 12px rgba(34, 32, 30, 0.15));
    transition: all 0.3s ease;
}

.merchant-card:hover .merchant-logo {
    transform: scale(1.05);
    filter: drop-shadow(0 6px 16px rgba(34, 32, 30, 0.2));
}

.logo-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
    border-radius: 16px;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.merchant-card:hover .logo-overlay {
    opacity: 1;
}

.merchant-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

.merchant-name {
    font-family: var(--font-heading);
    font-size: 1.4rem;
    color: var(--text-color);
    font-weight: 700;
    margin: 0 0 16px 0;
    line-height: 1.3;
    text-align: center;
}

.delivery-info {
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: center;
}

.delivery-fee {
    font-family: var(--font-body);
    font-size: 1rem;
    color: var(--text-color);
    font-weight: 600;
    background: var(--secondary-color);
    padding: 8px 16px;
    border-radius: 20px;
    border: 1px solid var(--text-color);
}

.delivery-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.85rem;
    color: var(--text-color);
    font-weight: 600;
    font-family: var(--font-body);
}

.delivery-icon {
    width: 16px;
    height: 16px;
}

.card-hover-effect {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(252, 188, 5, 0.1) 0%, rgba(252, 188, 5, 0.05) 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
    border-radius: 24px;
    pointer-events: none;
}

.merchant-card:hover .card-hover-effect {
    opacity: 1;
}

/* Empty State */
.empty-state {
    text-align: center;
    padding: 80px 20px;
    animation: fadeInUp 0.8s ease-out 0.6s both;
}

.empty-icon {
    width: 80px;
    height: 80px;
    margin: 0 auto 24px;
    color: var(--text-color);
    opacity: 0.6;
}

.empty-state h3 {
    font-family: var(--font-heading);
    font-size: 1.5rem;
    color: var(--text-color);
    font-weight: 600;
    margin-bottom: 8px;
}

.empty-state p {
    font-family: var(--font-body);
    color: var(--text-color);
    font-size: 1rem;
    margin: 0;
    opacity: 0.8;
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

/* Responsive Design */
@media (max-width: 1200px) {
    .merchant-grid {
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        gap: 24px;
    }
}

@media (max-width: 768px) {
    .order-page {
        padding: 30px 20px;
        padding-top: 120px;
    }

    .page-title {
        font-size: 2.4rem;
    }

    .page-subtitle {
        font-size: 1.1rem;
    }

    .merchant-grid {
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 20px;
    }

    .merchant-card {
        padding: 24px 20px;
        min-height: 280px;
    }

    .logo-container {
        height: 120px;
        margin-bottom: 20px;
    }

    .merchant-logo {
        max-height: 80px;
    }

    .merchant-name {
        font-size: 1.2rem;
    }
}

@media (max-width: 480px) {
    .order-page {
        padding: 20px 15px;
        padding-top: 100px;
    }

    .merchant-grid {
        grid-template-columns: 1fr;
        gap: 16px;
    }

    .merchant-card {
        padding: 20px 16px;
        min-height: 260px;
    }

    .page-title {
        font-size: 2rem;
    }

    .page-subtitle {
        font-size: 1rem;
    }

    .header-section {
        margin-bottom: 40px;
    }
}
</style>