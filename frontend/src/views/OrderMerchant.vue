<script lang="js">
import { defineComponent, ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getMenuById, getMerchantInfoById } from '@/services/orderFoodService'
import { useCartStore } from '@/stores/cart'


export default defineComponent({
    name: 'OrderMerchant',
    setup() {
        const router = useRouter()
        const route = useRoute()
        const cart = useCartStore()
        const merchantId = route.params.id
        const merchantInfo = ref({})
        const merchantMenu = ref([])
        const quantities = ref({})
        const showEmptyCartWarning = ref(false)

        watch(quantities, (newQuantities) => {
            const hasItems = Object.values(newQuantities).some(qty => qty > 0)
            if (hasItems) showEmptyCartWarning.value = false
        }, { deep: true })

        const increase = (id) => {
            quantities.value[id] = (quantities.value[id] || 0) + 1
            if (showEmptyCartWarning.value) {
                const hasItems = Object.values(quantities.value).some(qty => qty > 0)
                if (hasItems) showEmptyCartWarning.value = false
            }
        }

        const decrease = (id) => {
            if (quantities.value[id] > 0) {
                quantities.value[id]--
                if (showEmptyCartWarning.value) {
                    const hasItems = Object.values(quantities.value).some(qty => qty > 0)
                    if (hasItems) showEmptyCartWarning.value = false
                }
            }
        }

        const checkout = () => {
            const selectedItems = merchantMenu.value
                .filter(item => quantities.value[item.menuItemId] > 0)
                .map(item => ({
                    id: item.menuItemId,
                    name: item.name,
                    quantity: quantities.value[item.menuItemId],
                    price: item.priceCents / 100,
                    image_url: item.imageUrl,
                    merchant_id: merchantInfo.value.merchantId,
                    merchant_name: merchantInfo.value.name
                }))

            if (selectedItems.length === 0) {
                showEmptyCartWarning.value = true
                return
            }
            cart.setCart(selectedItems)
            router.push({ name: 'cartPage' })
        }

        onMounted(async () => {
            try {
                const [menuRes, infoRes] = await Promise.all([
                    getMenuById(merchantId),
                    getMerchantInfoById(merchantId)
                ])

                // Handle response structure - your backend returns data directly or in .data
                const menuData = menuRes.data || menuRes
                const infoData = infoRes.data || infoRes

                merchantMenu.value = menuData
                merchantInfo.value = infoData

                // Initialize quantities
                merchantMenu.value.forEach(item => {
                    quantities.value[item.menuItemId] = 0
                })
            } catch (error) {
                console.error('Error loading merchant data:', error)
            }
        })

        return {
            merchantInfo,
            merchantMenu,
            quantities,
            increase,
            decrease,
            checkout,
            showEmptyCartWarning
        }
    }
})
</script>

<template>
    <div class="merchant-page-wrapper">
        <div class="merchant-page">

            <!-- Merchant Header -->
            <div class="merchant-header">
                <div class="logo-container">
                    <img :src="merchantInfo.imageUrl" alt="Merchant Logo" class="merchant-logo" />
                </div>
                <div class="merchant-info">
                    <h1 class="merchant-name">{{ merchantInfo.name }}</h1>
                    <p class="location">📍 {{ merchantInfo.location }}</p>
                </div>
            </div>

            <!-- Menu Section -->
            <div class="menu-section">
                <h2 class="section-title">Menu</h2>

                <div class="menu-grid">
                    <div v-for="item in merchantMenu" :key="item.menuItemId" class="menu-item">
                        <div class="item-image-container">
                            <img :src="item.imageUrl" class="menu-image" alt="menu item" />
                        </div>

                        <div class="item-content">
                            <div class="item-header">
                                <h3 class="item-name">{{ item.name }}</h3>
                                <p class="item-price">${{ (item.priceCents / 100).toFixed(2) }}</p>
                            </div>

                            <p class="item-description">{{ item.description }}</p>

                            <div class="item-controls">
                                <button class="control-btn decrease" @click="decrease(item.menuItemId)"
                                    :disabled="quantities[item.menuItemId] === 0">
                                    −
                                </button>
                                <span class="quantity">{{ quantities[item.menuItemId] }}</span>
                                <button class="control-btn increase" @click="increase(item.menuItemId)">
                                    +
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Warning Banner -->
            <transition name="slide-down">
                <div v-if="showEmptyCartWarning" class="warning-banner">
                    <svg class="warning-icon" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clip-rule="evenodd" />
                    </svg>
                    <span>Your cart is empty. Please select at least one item before checking out.</span>
                </div>
            </transition>

            <!-- Checkout Button -->
            <button class="checkout-btn" @click="checkout">
                <span>Proceed to Checkout</span>
                <svg class="checkout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M9 5l7 7-7 7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
            </button>
        </div>
    </div>
</template>

<style scoped>
/* Page Layout */
.merchant-page-wrapper {
    position: relative;
    width: 100vw;
    min-height: 100vh;
    background: var(--secondary-color);
    padding: 6rem 0 4rem;
}

.merchant-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 30px;
    font-family: var(--font-body);
    animation: fadeInUp 0.6s ease-out;
}

/* Merchant Header */
.merchant-header {
    background: var(--tertiary-color);
    border-radius: 24px;
    padding: 32px;
    margin-bottom: 40px;
    display: flex;
    align-items: center;
    gap: 24px;
    border: 2px solid var(--text-color);
    box-shadow: 0 4px 12px rgba(34, 32, 30, 0.1);
    animation: fadeInUp 0.8s ease-out 0.2s both;
}

.logo-container {
    flex-shrink: 0;
    width: 120px;
    height: 120px;
    background: var(--secondary-color);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid var(--text-color);
    overflow: hidden;
}

.merchant-logo {
    width: 100%;
    height: 100%;
    object-fit: contain;
    padding: 12px;
}

.merchant-info {
    flex: 1;
}

.merchant-name {
    font-family: var(--font-heading);
    font-size: 2.5rem;
    font-weight: 800;
    color: var(--text-color);
    margin: 0 0 8px 0;
    letter-spacing: -0.01em;
}

.location {
    font-family: var(--font-body);
    font-size: 1.1rem;
    color: var(--text-color);
    opacity: 0.8;
    margin: 0;
    font-weight: 500;
}

/* Menu Section */
.menu-section {
    animation: fadeInUp 0.8s ease-out 0.4s both;
}

.section-title {
    font-family: var(--font-heading);
    font-size: 2rem;
    font-weight: 700;
    color: var(--text-color);
    margin-bottom: 24px;
    text-align: center;
}

.menu-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 24px;
    margin-bottom: 32px;
}

/* Menu Item Card */
.menu-item {
    background: var(--tertiary-color);
    border-radius: 20px;
    padding: 20px;
    border: 2px solid var(--text-color);
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.menu-item:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(34, 32, 30, 0.15);
}

.item-image-container {
    width: 100%;
    height: 200px;
    border-radius: 16px;
    overflow: hidden;
    background: var(--secondary-color);
    border: 1px solid var(--text-color);
}

.menu-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.item-content {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.item-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
}

.item-name {
    font-family: var(--font-heading);
    font-size: 1.3rem;
    font-weight: 700;
    color: var(--text-color);
    margin: 0;
    text-transform: capitalize;
}

.item-price {
    font-family: var(--font-heading);
    font-size: 1.4rem;
    font-weight: 800;
    color: var(--primary-color);
    margin: 0;
    flex-shrink: 0;
}

.item-description {
    font-family: var(--font-body);
    font-size: 0.95rem;
    color: var(--text-color);
    opacity: 0.7;
    margin: 0;
    line-height: 1.5;
}

/* Item Controls */
.item-controls {
    display: flex;
    align-items: center;
    gap: 16px;
    justify-content: center;
    padding-top: 8px;
}

.control-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 2px solid var(--text-color);
    background: var(--primary-color);
    color: var(--text-color);
    font-size: 1.5rem;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    font-family: var(--font-heading);
}

.control-btn:hover:not(:disabled) {
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(252, 188, 5, 0.3);
}

.control-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.quantity {
    font-family: var(--font-heading);
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-color);
    min-width: 40px;
    text-align: center;
}

/* Warning Banner */
.warning-banner {
    background: #fff3cd;
    border: 2px solid var(--text-color);
    border-radius: 16px;
    padding: 16px 20px;
    margin-bottom: 24px;
    display: flex;
    align-items: center;
    gap: 12px;
    color: var(--text-color);
    font-family: var(--font-body);
    font-weight: 600;
}

.warning-icon {
    width: 24px;
    height: 24px;
    flex-shrink: 0;
}

/* Slide down animation */
.slide-down-enter-active,
.slide-down-leave-active {
    transition: all 0.4s ease;
}

.slide-down-enter-from {
    opacity: 0;
    transform: translateY(-20px);
}

.slide-down-leave-to {
    opacity: 0;
    transform: translateY(-20px);
}

/* Checkout Button */
.checkout-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    width: 100%;
    max-width: 400px;
    margin: 0 auto;
    padding: 18px 32px;
    background: var(--text-color);
    color: var(--primary-color);
    border: none;
    border-radius: 16px;
    font-family: var(--font-heading);
    font-size: 1.2rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s ease;
}

.checkout-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(34, 32, 30, 0.3);
}

.checkout-icon {
    width: 20px;
    height: 20px;
    stroke-width: 3;
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

/* Responsive Design */
@media (max-width: 768px) {
    .merchant-page {
        padding: 0 20px;
    }

    .merchant-header {
        padding: 24px;
        flex-direction: column;
        text-align: center;
    }

    .logo-container {
        width: 100px;
        height: 100px;
    }

    .merchant-name {
        font-size: 2rem;
    }

    .location {
        font-size: 1rem;
    }

    .menu-grid {
        grid-template-columns: 1fr;
        gap: 20px;
    }

    .section-title {
        font-size: 1.6rem;
    }
}

@media (max-width: 480px) {
    .merchant-page-wrapper {
        padding: 5rem 0 3rem;
    }

    .merchant-page {
        padding: 0 15px;
    }

    .merchant-header {
        padding: 20px;
    }

    .logo-container {
        width: 80px;
        height: 80px;
    }

    .merchant-name {
        font-size: 1.6rem;
    }

    .location {
        font-size: 0.9rem;
    }

    .menu-item {
        padding: 16px;
    }

    .item-image-container {
        height: 160px;
    }

    .item-name {
        font-size: 1.1rem;
    }

    .item-price {
        font-size: 1.2rem;
    }

    .item-description {
        font-size: 0.85rem;
    }

    .control-btn {
        width: 36px;
        height: 36px;
        font-size: 1.3rem;
    }

    .quantity {
        font-size: 1.3rem;
        min-width: 35px;
    }

    .checkout-btn {
        padding: 16px 24px;
        font-size: 1rem;
    }

    .warning-banner {
        padding: 12px 16px;
        font-size: 0.9rem;
    }
}
</style>