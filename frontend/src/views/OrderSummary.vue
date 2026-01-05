<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDeliveryStore } from '@/stores/delivery'
import { useCartStore } from '@/stores/cart'
import { useOrderStore } from '@/stores/order'
// import { useAuthStore } from '@/stores/auth'
import OrderTimeline from '../components/OrderTimeline.vue'
import { createOrder } from '@/services/orderFoodService'
import { convertToUtcISOString } from '@/utility/orderHelpers'
import { v4 as uuidv4 } from "uuid";// for idempotency key

const data = {
  steps: ['order details', 'delivery location', 'order confirmation', 'payment'],
  currentStep: 3,
  activeColor: '#FCBC05',
  passiveColor: '#22201E',
}

const router = useRouter() 
const deliveryStore = useDeliveryStore()
const orderStore = useOrderStore()
const cartStore = useCartStore()

const total = computed(() =>
  cartStore.items.reduce((sum, item) => sum + item.quantity * item.price, 0) + 1
)



const next = async () => {
  try {
    const userId = localStorage.getItem("user_id"); // from login
    const merchantId = orderStore.selectedMerchantId || cartStore.items[0]?.merchant_id;
    const deliveryFeeCents = 100; // or from env/config

    if (!merchantId) {
      alert("Missing merchant ID — cannot create order.");
      return;
    }

    const payload = {
      idempotency_key: uuidv4(), // or random string
      order: {
        customer_id: parseInt(userId),
        merchant_id: parseInt(merchantId),
        delivery_fee_cents: deliveryFeeCents,
        order_items: cartStore.items.map(item => ({
          menu_item_id: item.id,
          quantity: item.quantity,
          customisations: item.options || {},
          notes: item.notes || "",
        })),
        building: deliveryStore.building,
        room_type: deliveryStore.facilityType || "Seminar Room",
        room_number: deliveryStore.roomNumber,
        delivery_time: convertToUtcISOString(deliveryStore.date, deliveryStore.time)
      }
    };

    console.log("✅ Final payload to backend:", payload);

    const { order, qrCode, paymentReference, paynowNumber } = await createOrder(payload);

    // Store the data
    orderStore.setOrderId(order.order_id);
    orderStore.setPaymentDetails({
      qrCode: qrCode,               // already a data URI
      paymentReference: paymentReference,
      paynowNumber: paynowNumber,
    });

    router.push({ name: "payment", params: { id: order.order_id } });
  } catch (err) {
    console.error("Failed to create order:", err.response?.data || err.message);
    alert("Failed to create order. Please try again.");
  }
};


// const next = () => {
//   Mock Data
//   orderStore.setOrderId('ORDER-' + Date.now())
//   orderStore.setPaymentDetails({
//     qrCode: 'https://via.placeholder.com/300x300/FCBC05/22201E?text=QR+Code',
//     paymentReference: 'REF' + Math.random().toString(36).substr(2, 8).toUpperCase(),
//     paynowNumber: '99998888'
//   })
//   router.push({ name: 'payment' })
// }

// const next = async () => {
//     const merchantId = orderStore.selectedMerchantId
//     const customerId = authStore.userId

//     const order_items = cartStore.items.map(item => ({
//         menu_item_id: item.id,
//         quantity: item.quantity,
//         customisations: item.customisations || {},
//         notes: item.notes || ''
//     }))

//     // const delivery_time = convertToUtcISOString(deliveryStore.date, deliveryStore.time)

//     const payload = {
//         customer_id: customerId,
//         merchant_id: merchantId,
//         delivery_fee_cents: 100,
//         order_items,
//         building: deliveryStore.building,
//         room_type: deliveryStore.facilityType,
//         room_number: deliveryStore.roomNumber,
//         delivery_time
//     }

//     try {
//         console.log('Cart Items:', cartStore.items)
//         console.log('Full Payload:', payload)
//         console.log('Order Items Payload:', order_items)

//         const response = await createOrder(payload)

//         orderStore.setOrderId(response.data.order.order_id)
//         orderStore.setPaymentDetails({
//             qrCode: response.data.qrCode,
//             paymentReference: response.data.payment_reference,
//             paynowNumber: response.data.paynow_number
//         })

//         await router.push({ name: 'payment' })
//         orderStore.setMerchantId(null)  // Reset merchant ID

//     } catch (error) {
//         console.error('Order submission failed:', error)
//         alert('Failed to submit order. Please try again.')
//     }
// }

const goBack = () => {
  router.go(-1)
}
</script>

<template>
    <div class="summary-page-wrapper">
        <div class="summary-page">
            <!-- Progress Timeline -->
            <OrderTimeline :data="data" />

            <!-- Summary Box -->
            <div class="summary-box">
                <button class="back-button" @click="goBack">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                            stroke-linejoin="round" />
                    </svg>
                </button>

                <div class="summary-header">
                    <h1 class="page-title">Order Summary</h1>
                    <p class="page-subtitle">Review your order before payment</p>
                </div>

                <!-- Order Items Section -->
                <div class="summary-section">
                    <h2 class="section-title">
                        <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path
                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                        Your Items
                    </h2>

                    <div class="items-table">
                        <div class="table-header">
                            <div class="header-item">Item</div>
                            <div class="header-qty">Qty</div>
                            <div class="header-price">Price</div>
                        </div>

                        <div class="table-body">
                            <div v-for="item in cartStore.items" :key="item.id" class="table-row">
                                <div class="row-item">
                                    <div class="item-name">{{ item.name }}</div>
                                    <div class="item-unit-price">${{ item.price.toFixed(2) }} each</div>
                                </div>
                                <div class="row-qty">{{ item.quantity }}</div>
                                <div class="row-price">${{ (item.quantity * item.price).toFixed(2) }}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Totals Section -->
                <div class="totals-section">
                    <div class="total-row">
                        <span>Subtotal</span>
                        <span>${{ (total - 1).toFixed(2) }}</span>
                    </div>
                    <div class="total-row">
                        <span>Delivery Fee</span>
                        <span>$1.00</span>
                    </div>
                    <div class="total-divider"></div>
                    <div class="total-row grand-total">
                        <span>Total Amount</span>
                        <span>${{ total.toFixed(2) }}</span>
                    </div>
                </div>

                <!-- Delivery Details Section -->
                <div class="summary-section">
                    <h2 class="section-title">
                        <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                            <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round" />
                        </svg>
                        Delivery Details
                    </h2>

                    <div class="delivery-grid">
                        <div class="delivery-item">
                            <div class="delivery-label">Location</div>
                            <div class="delivery-value">
                                {{ deliveryStore.building }} - {{ deliveryStore.facilityType }}
                                <span class="room-badge">{{ deliveryStore.roomNumber }}</span>
                            </div>
                        </div>

                        <div class="delivery-item">
                            <div class="delivery-label">Delivery Date</div>
                            <div class="delivery-value">{{ deliveryStore.date }}</div>
                        </div>

                        <div class="delivery-item">
                            <div class="delivery-label">Delivery Time</div>
                            <div class="delivery-value">{{ deliveryStore.time }}</div>
                        </div>
                    </div>
                </div>

                <!-- Proceed Button -->
                <div class="button-wrapper">
                    <button class="proceed-btn" @click="next">
                        <span>Proceed to Payment</span>
                        <svg class="next-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M9 5l7 7-7 7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Page Layout */
.summary-page-wrapper {
    position: relative;
    width: 100vw;
    min-height: 100vh;
    background: var(--secondary-color);
    padding: 6rem 0 4rem;
}

.summary-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 30px;
    font-family: var(--font-body);
    animation: fadeInUp 0.6s ease-out;
}

/* Summary Box */
.summary-box {
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
.summary-header {
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

/* Summary Section */
.summary-section {
    margin-bottom: 32px;
}

.section-title {
    font-family: var(--font-heading);
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-color);
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 12px;
}

.section-icon {
    width: 24px;
    height: 24px;
    stroke: var(--primary-color);
    stroke-width: 2;
}

/* Items Table */
.items-table {
    background: var(--secondary-color);
    border: 2px solid var(--text-color);
    border-radius: 16px;
    overflow: hidden;
}

.table-header {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
    gap: 16px;
    padding: 16px 20px;
    background: var(--primary-color);
    border-bottom: 2px solid var(--text-color);
    font-family: var(--font-heading);
    font-weight: 700;
    font-size: 1rem;
    color: var(--text-color);
}

.table-body {
    display: flex;
    flex-direction: column;
}

.table-row {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
    gap: 16px;
    padding: 16px 20px;
    border-bottom: 1px solid rgba(34, 32, 30, 0.1);
    transition: all 0.2s ease;
}

.table-row:last-child {
    border-bottom: none;
}

.table-row:hover {
    background: rgba(252, 188, 5, 0.05);
}

.row-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.item-name {
    font-family: var(--font-heading);
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--text-color);
}

.item-unit-price {
    font-family: var(--font-body);
    font-size: 0.85rem;
    color: var(--text-color);
    opacity: 0.7;
}

.row-qty {
    font-family: var(--font-heading);
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--text-color);
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
}

.row-price {
    font-family: var(--font-heading);
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--primary-color);
    text-align: right;
    display: flex;
    align-items: center;
    justify-content: flex-end;
}

/* Totals Section */
.totals-section {
    background: var(--secondary-color);
    border: 2px solid var(--text-color);
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 32px;
}

.total-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    font-family: var(--font-body);
    font-size: 1rem;
    color: var(--text-color);
}

.total-divider {
    height: 2px;
    background: var(--text-color);
    margin: 12px 0;
}

.total-row.grand-total {
    font-family: var(--font-heading);
    font-size: 1.5rem;
    font-weight: 800;
    padding-top: 16px;
}

.total-row.grand-total span:last-child {
    color: var(--primary-color);
}

/* Delivery Details */
.delivery-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
}

.delivery-item {
    background: var(--secondary-color);
    border: 2px solid var(--text-color);
    border-radius: 12px;
    padding: 16px;
}

.delivery-label {
    font-family: var(--font-heading);
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--text-color);
    opacity: 0.7;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.delivery-value {
    font-family: var(--font-body);
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--text-color);
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}

.room-badge {
    display: inline-block;
    padding: 4px 12px;
    background: var(--primary-color);
    color: var(--text-color);
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 700;
    border: 1px solid var(--text-color);
}

/* Proceed Button */
.button-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 40px;
}

.proceed-btn {
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

.proceed-btn:hover {
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
    .summary-page {
        padding: 0 20px;
    }

    .summary-box {
        padding: 30px 24px;
    }

    .page-title {
        font-size: 2rem;
    }

    .table-header,
    .table-row {
        grid-template-columns: 2fr 80px 80px;
        gap: 12px;
        padding: 12px 16px;
    }

    .item-name {
        font-size: 1rem;
    }

    .delivery-grid {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 480px) {
    .summary-box {
        padding: 24px 20px;
    }

    .page-title {
        font-size: 1.6rem;
    }

    .section-title {
        font-size: 1.2rem;
    }

    .table-header {
        display: none;
    }

    .table-row {
        grid-template-columns: 1fr;
        gap: 8px;
        padding: 16px;
    }

    .row-qty,
    .row-price {
        justify-content: flex-start;
        text-align: left;
    }

    .row-qty::before {
        content: 'Qty: ';
        font-weight: 400;
        opacity: 0.7;
    }

    .row-price::before {
        content: 'Total: ';
        font-weight: 400;
        opacity: 0.7;
    }

    .proceed-btn {
        width: 100%;
        padding: 16px 32px;
        font-size: 1rem;
    }
}
</style>