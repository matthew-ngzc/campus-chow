<script>
import { defineComponent, computed, ref } from 'vue'
import { useCartStore } from '@/stores/cart'
import { useRouter } from 'vue-router'
import { onMounted } from 'vue'
import OrderTimeline from '../components/OrderTimeline.vue'

export default defineComponent({
  components: { OrderTimeline },
  
  setup() {
    const cart = useCartStore()
    const router = useRouter()
    const quantities = ref({})
    const showEmptyCartWarning = ref(false)

    const hasItemsInCart = computed(() =>
      cart.items.some(item => item.quantity > 0)
    )

    const increase = (id) => {
      quantities.value[id] = (quantities.value[id] || 0) + 1
      const item = cart.items.find(i => i.id === id)
      if (item) item.quantity = quantities.value[id]
    }

    const decrease = (id) => {
      if (quantities.value[id] > 0) {
        quantities.value[id]--
        const item = cart.items.find(i => i.id === id)
        if (item) item.quantity = quantities.value[id]
      }
    }

    // Progress timeline
    const data = {
      steps: ['order details', 'delivery location', 'order confirmation', 'payment'],
      currentStep: 1,
      activeColor: '#FCBC05',
      passiveColor: '#22201E',
    }

    // Using data from previous page 
    onMounted(() => {
      cart.items.forEach(item => {
        quantities.value[item.id] = item.quantity
      })
    })

    // Routes array must line up with data.steps
    const routes = [
      { name: 'cartPage' },
      { name: 'selectLocation' },
      { name: 'orderSummary' },
      { name: 'payment' }
    ]

    // Calculates total price of items in cart 
    const total = computed(() => {
      return cart.items.reduce((sum, item) => sum + item.quantity * item.price, 0)
    })

    // Button next clicked, go to the next page
    const next = () => {
      if (!hasItemsInCart.value) {
        showEmptyCartWarning.value = true
        return
      }
      router.push({ name: 'selectLocation' })  
    }

    // Back button functionality
    const goBack = () => {
      router.go(-1)
    }

    return { 
      cart, 
      total, 
      next, 
      goBack, 
      data, 
      routes, 
      quantities, 
      increase, 
      decrease, 
      hasItemsInCart, 
      showEmptyCartWarning 
    }
  }
})
</script>

<template>
  <div class="cart-page-wrapper">
    <div class="cart-page">
      <!-- Progress Timeline -->
      <OrderTimeline :data="data" :routes="routes" />

      <div class="cart-container">
        <!-- Back Button -->
        <button class="back-button" @click="goBack">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" stroke-width="2" 
                  stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>

        <!-- Header -->
        <div class="cart-header">
          <h1 class="page-title">Your Cart</h1>
          <p class="page-subtitle">Review your order items before checkout</p>
        </div>

        <!-- Cart Content -->
        <div class="cart-content">
          <!-- Cart Items -->
          <div v-if="cart.items.length > 0" class="cart-items">
            <div v-for="item in cart.items" :key="item.id" class="cart-item">
              <div class="item-image-container">
                <img :src="item.image_url" alt="item image" class="item-image" />
              </div>
              
              <div class="item-details"> 
                <div class="item-info">
                  <h3 class="item-name">{{ item.name }}</h3>
                  <p class="item-price">${{ item.price.toFixed(2) }} each</p>
                </div>
                
                <div class="item-controls">  
                  <div class="quantity-controls">
                    <button 
                      class="control-btn decrease" 
                      @click="decrease(item.id)"
                      :disabled="quantities[item.id] === 0"
                    >
                      −
                    </button>
                    <span class="quantity">{{ quantities[item.id] }}</span>
                    <button 
                      class="control-btn increase" 
                      @click="increase(item.id)"
                    >
                      +
                    </button>
                  </div>
                  
                  <div class="item-total">${{ (item.quantity * item.price).toFixed(2) }}</div> 
                </div>
              </div>
            </div>
          </div>

          <!-- Empty Cart State -->
          <div v-else class="empty-cart">
            <div class="empty-icon">🛒</div>
            <h3>Your cart is empty</h3>
            <p>Add some delicious items to get started!</p>
            <button @click="goBack" class="browse-btn">Browse Restaurants</button>
          </div>

          <!-- Cart Summary -->
          <div v-if="cart.items.length > 0" class="cart-summary"> 
            <div class="summary-section">
              <div class="summary-row">
                <span>Subtotal</span>
                <span>${{ total.toFixed(2) }}</span>
              </div>
              <div class="summary-row">
                <span>Delivery Fee</span>
                <span>$1.00</span>
              </div>
              <div class="summary-divider"></div>
              <div class="summary-row total">
                <span>Total</span>
                <span>${{ (total + 1).toFixed(2) }}</span>
              </div>
            </div>

            <!-- Warning Banner -->
            <transition name="slide-down">
              <div v-if="showEmptyCartWarning" class="warning-banner">
                <svg class="warning-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                </svg>
                <span>Your cart is empty. Please select at least one item before proceeding.</span>
              </div>
            </transition>
          </div>
        </div>

        <!-- Next Button -->
        <div v-if="cart.items.length > 0" class="button-wrapper"> 
          <button class="next-btn" @click="next">
            <span>Next</span>
            <svg class="next-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M9 5l7 7-7 7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Page Layout */
.cart-page-wrapper {
  position: relative;
  width: 100vw;
  min-height: 100vh;
  background: var(--secondary-color);
  padding: 6rem 0 4rem;
}

.cart-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 30px;
  font-family: var(--font-body);
  animation: fadeInUp 0.6s ease-out;
}

/* Cart Container */
.cart-container {
  background: var(--tertiary-color);
  border-radius: 24px;
  padding: 40px;
  border: 2px solid var(--text-color);
  box-shadow: 0 4px 12px rgba(34, 32, 30, 0.1);
  position: relative;
  margin-top: 24px;
}

/* Back Button */
.back-button {
  position: absolute;
  top: 20px;
  left: 20px;
  width: 44px;
  height: 44px;
  background: var(--secondary-color);
  border: 2px solid var(--text-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-color);
  transition: all 0.3s ease;
  z-index: 10;
}

.back-button:hover {
  background: var(--primary-color);
  transform: scale(1.05);
}

/* Header */
.cart-header {
  text-align: center;
  margin-bottom: 40px;
  padding-top: 20px;
}

.page-title {
  font-family: var(--font-heading);
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--text-color);
  margin-bottom: 12px;
  letter-spacing: -0.01em;
}

.page-subtitle {
  font-family: var(--font-body);
  font-size: 1.1rem;
  color: var(--text-color);
  opacity: 0.8;
  margin: 0;
}

/* Cart Content */
.cart-content {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

/* Cart Items */
.cart-items {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 500px;
}

.cart-item {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  background: var(--secondary-color);
  border: 2px solid var(--text-color);
  border-radius: 16px;
}

.item-image-container {
  width: 80px;
  height: 80px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--text-color);
  flex-shrink: 0;
}

.item-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-details {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1;
  gap: 20px;
}

.item-info {
  flex: 1;
}

.item-name {
  font-family: var(--font-heading);
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text-color);
  margin: 0 0 4px 0;
}

.item-price {
  font-family: var(--font-body);
  font-size: 0.9rem;
  color: var(--text-color);
  opacity: 0.7;
  margin: 0;
}

.item-controls {
  display: flex;
  align-items: center;
  gap: 24px;
}

/* Quantity Controls */
.quantity-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.control-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid var(--text-color);
  background: var(--primary-color);
  color: var(--text-color);
  font-size: 1.3rem;
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
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text-color);
  min-width: 30px;
  text-align: center;
}

.item-total {
  font-family: var(--font-heading);
  font-size: 1.3rem;
  font-weight: 800;
  color: var(--primary-color);
  min-width: 80px;
  text-align: right;
}

/* Empty Cart */
.empty-cart {
  text-align: center;
  padding: 80px 20px;
}

.empty-icon {
  font-size: 5rem;
  margin-bottom: 20px;
}

.empty-cart h3 {
  font-family: var(--font-heading);
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-color);
  margin-bottom: 12px;
}

.empty-cart p {
  font-family: var(--font-body);
  color: var(--text-color);
  opacity: 0.7;
  margin-bottom: 24px;
  font-size: 1.1rem;
}

.browse-btn {
  padding: 14px 32px;
  background: var(--text-color);
  color: var(--primary-color);
  border: none;
  border-radius: 12px;
  font-family: var(--font-heading);
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
}

.browse-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(34, 32, 30, 0.3);
}

/* Cart Summary */
.cart-summary {
  background: var(--secondary-color);
  border: 2px solid var(--text-color);
  border-radius: 16px;
  padding: 24px;
}

.summary-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: var(--font-body);
  font-size: 1rem;
  color: var(--text-color);
}

.summary-divider {
  height: 2px;
  background: var(--text-color);
  margin: 8px 0;
}

.summary-row.total {
  font-family: var(--font-heading);
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text-color);
}

.summary-row.total span:last-child {
  color: var(--primary-color);
}

/* Warning Banner */
.warning-banner {
  background: #fff3cd;
  border: 2px solid var(--text-color);
  border-radius: 12px;
  padding: 16px 20px;
  margin-top: 16px;
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
.slide-down-enter-active, .slide-down-leave-active {
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

/* Next Button */
.button-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 32px;
}

.next-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 18px 48px;
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

.next-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(34, 32, 30, 0.3);
}

.next-icon {
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
  .cart-page {
    padding: 0 20px;
  }

  .cart-container {
    padding: 30px 24px;
  }

  .page-title {
    font-size: 2rem;
  }

  .cart-items {
    max-height: 400px;
  }

  .item-details {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .item-controls {
    width: 100%;
    justify-content: space-between;
  }
}

@media (max-width: 480px) {
  .cart-container {
    padding: 24px 20px;
  }

  .page-title {
    font-size: 1.6rem;
  }

  .cart-item {
    padding: 16px;
    flex-direction: column;
    align-items: flex-start;
  }

  .item-image-container {
    width: 100%;
    height: 150px;
  }

  .item-details {
    width: 100%;
  }

  .next-btn {
    width: 100%;
    padding: 16px 32px;
    font-size: 1rem;
  }
}
</style>