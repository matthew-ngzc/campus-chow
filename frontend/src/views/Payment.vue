<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCartStore } from '@/stores/cart' 
import { useRouter } from 'vue-router' 
import { useOrderStore } from '@/stores/order'
import OrderTimeline from '../components/OrderTimeline.vue'
import { updateOrderStatusAwaitingVerification } from '@/services/orderFoodService'

// Progress timeline
const data = {
  steps: ['order details', 'delivery location', 'order confirmation', 'payment'],
  currentStep: 4,
  activeColor: '#FCBC05',
  passiveColor: '#22201E',
}

const router = useRouter() 
const cart = useCartStore()
const orderStore = useOrderStore()
const orderId = orderStore.orderId

const qrCode = computed(() => orderStore.qrCode)
const paymentReference = computed(() => orderStore.paymentReference)
const paynowNumber = computed(() => orderStore.paynowNumber)

const total = computed(() =>
  cart.items.reduce((sum, item) => sum + item.quantity * item.price, 0) + 1 // +$1 delivery
)

const done = async () => {
  try {
    await updateOrderStatusAwaitingVerification(orderId) 
    // router.push({ name: 'Home' })
  } catch (err) {
    console.error('Failed to update payment status:', err)
    alert('Something went wrong while confirming payment. Please try again.')
  }

  router.push({ name: 'activeorders' })
}

// Back button functionality
function goBack() {
  router.go(-1)
}
</script>

<template>
  <div class="payment-page-wrapper">
    <div class="payment-page">
      <!-- Progress Timeline -->
      <OrderTimeline :data="data" />
  
      <div class="payment-container">
        <button class="back-button" @click="goBack">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" stroke-width="2" 
                  stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>

        <!-- Header -->
        <div class="payment-header">
          <h1 class="page-title">Complete Your Payment</h1>
          <p class="page-subtitle">Follow the steps below to finalize your order</p>
        </div>

        <!-- Payment Amount Card -->
        <div class="amount-card">
          <div class="amount-label">Total Amount</div>
          <div class="amount-value">${{ total.toFixed(2) }}</div>
        </div>

        <!-- Content Grid -->
        <div class="content-grid">
          <!-- Payment Steps -->
          <div class="steps-section">
            <div class="step-card">
              <div class="step-number">1</div>
              <div class="step-content">
                <h3 class="step-title">Transfer via PayNow</h3>
                <p class="step-description">
                  PayNow <strong class="highlight">${{ total.toFixed(2) }}</strong> via QR code or mobile number to 
                  <strong class="highlight">{{ paynowNumber }}</strong>
                </p>
                <div class="info-badge">
                  <svg class="info-icon" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                  </svg>
                  Reference: <strong>{{ paymentReference }}</strong>
                </div>
              </div>
            </div>

            <div class="step-card">
              <div class="step-number">2</div>
              <div class="step-content">
                <h3 class="step-title">Send Payment Proof</h3>
                <p class="step-description">
                  Send your payment screenshot to 
                  <strong class="highlight">@campuschow_admin</strong> via Telegram
                </p>
              </div>
            </div>

            <div class="step-card">
              <div class="step-number">3</div>
              <div class="step-content">
                <h3 class="step-title">Confirm Payment</h3>
                <p class="step-description">
                  Click the "Done" button below once your payment is complete
                </p>
              </div>
            </div>
          </div>

          <!-- QR Code Section -->
          <div class="qr-section">
            <div class="qr-card">
              <div class="qr-header">
                <svg class="qr-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="3" y="3" width="7" height="7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <rect x="14" y="3" width="7" height="7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <rect x="3" y="14" width="7" height="7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M14 14h.01M14 17h.01M14 20h.01M17 14h.01M17 17h.01M17 20h.01M20 14h.01M20 17h.01M20 20h.01" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <h3>Scan QR Code</h3>
              </div>
              
              <div class="qr-code-container">
                <!-- <img src="../assets/images/example_qr.png" alt="PayNow QR Code" class="qr-image" /> -->
                <img :src="qrCode" alt="PayNow QR Code" class="qr-image" />
              </div>
              
              <div class="qr-info">
                <div class="qr-label">Recipient Name</div>
                <div class="qr-value">Campus Chow</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Notice Banner -->
        <div class="notice-banner">
          <svg class="notice-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
          </svg>
          <div class="notice-content">
            <h4>Payment Confirmation</h4>
            <p>You will receive confirmation from Campus Chow Admin within 1-2 business days</p>
          </div>
        </div>

        <!-- Done Button -->
        <div class="button-wrapper">
          <button class="done-btn" @click="done">
            <svg class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M5 13l4 4L19 7" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>Payment Complete</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Page Layout */
.payment-page-wrapper {
  position: relative;
  width: 100vw;
  min-height: 100vh;
  background: var(--secondary-color);
  padding: 6rem 0 4rem;
}

.payment-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 30px;
  font-family: var(--font-body);
  animation: fadeInUp 0.6s ease-out;
}

/* Payment Container */
.payment-container {
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
.payment-header {
  text-align: center;
  margin-bottom: 32px;
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

/* Amount Card */
.amount-card {
  background: var(--primary-color);
  border: 2px solid var(--text-color);
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  margin-bottom: 32px;
}

.amount-label {
  font-family: var(--font-heading);
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-color);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.amount-value {
  font-family: var(--font-heading);
  font-size: 3rem;
  font-weight: 800;
  color: var(--text-color);
  letter-spacing: -0.02em;
}

/* Content Grid */
.content-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 32px;
  margin-bottom: 32px;
}

/* Steps Section */
.steps-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.step-card {
  background: var(--secondary-color);
  border: 2px solid var(--text-color);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  gap: 16px;
  transition: all 0.3s ease;
}

.step-card:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(252, 188, 5, 0.2);
}

.step-number {
  width: 48px;
  height: 48px;
  background: var(--primary-color);
  border: 2px solid var(--text-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-heading);
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text-color);
  flex-shrink: 0;
}

.step-content {
  flex: 1;
}

.step-title {
  font-family: var(--font-heading);
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text-color);
  margin: 0 0 8px 0;
}

.step-description {
  font-family: var(--font-body);
  font-size: 1rem;
  color: var(--text-color);
  line-height: 1.6;
  margin: 0;
}

.highlight {
  color: var(--primary-color);
  font-weight: 700;
}

.info-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--tertiary-color);
  border: 1px solid var(--text-color);
  border-radius: 8px;
  padding: 8px 12px;
  margin-top: 12px;
  font-family: var(--font-body);
  font-size: 0.9rem;
  color: var(--text-color);
}

.info-icon {
  width: 18px;
  height: 18px;
  fill: var(--primary-color);
  flex-shrink: 0;
}

/* QR Section */
.qr-section {
  display: flex;
  align-items: flex-start;
}

.qr-card {
  background: var(--secondary-color);
  border: 2px solid var(--text-color);
  border-radius: 16px;
  padding: 24px;
  width: 100%;
  text-align: center;
}

.qr-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.qr-icon {
  width: 32px;
  height: 32px;
  stroke: var(--primary-color);
  stroke-width: 2;
}

.qr-header h3 {
  font-family: var(--font-heading);
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--text-color);
  margin: 0;
}

.qr-code-container {
  background: white;
  border: 2px solid var(--text-color);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
}

.qr-image {
  width: 100%;
  max-width: 220px;
  display: block;
  margin: 0 auto;
}

.qr-info {
  background: var(--tertiary-color);
  border: 1px solid var(--text-color);
  border-radius: 8px;
  padding: 12px;
}

.qr-label {
  font-family: var(--font-body);
  font-size: 0.85rem;
  color: var(--text-color);
  opacity: 0.7;
  margin-bottom: 4px;
}

.qr-value {
  font-family: var(--font-heading);
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-color);
}

/* Notice Banner */
.notice-banner {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: #dbeafe;
  border: 2px solid var(--text-color);
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 32px;
}

.notice-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  fill: #2563eb;
}

.notice-content h4 {
  font-family: var(--font-heading);
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-color);
  margin: 0 0 4px 0;
}

.notice-content p {
  font-family: var(--font-body);
  font-size: 0.9rem;
  color: var(--text-color);
  opacity: 0.8;
  margin: 0;
}

/* Done Button */
.button-wrapper {
  display: flex;
  justify-content: center;
}

.done-btn {
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

.done-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(34, 32, 30, 0.3);
}

.check-icon {
  width: 24px;
  height: 24px;
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
@media (max-width: 968px) {
  .content-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .qr-section {
    order: -1;
  }
}

@media (max-width: 768px) {
  .payment-page {
    padding: 0 20px;
  }

  .payment-container {
    padding: 30px 24px;
  }

  .page-title {
    font-size: 2rem;
  }

  .amount-value {
    font-size: 2.5rem;
  }
}

@media (max-width: 480px) {
  .payment-container {
    padding: 24px 20px;
  }

  .page-title {
    font-size: 1.6rem;
  }

  .amount-card {
    padding: 20px;
  }

  .amount-value {
    font-size: 2rem;
  }

  .step-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .step-number {
    width: 40px;
    height: 40px;
    font-size: 1.2rem;
  }

  .step-title {
    font-size: 1.1rem;
  }

  .step-description {
    font-size: 0.9rem;
  }

  .qr-code-container {
    padding: 12px;
  }

  .qr-image {
    max-width: 180px;
  }

  .done-btn {
    width: 100%;
    padding: 16px 32px;
    font-size: 1rem;
  }
}
</style>