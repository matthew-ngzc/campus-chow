<script setup>
import { ref, onMounted, computed } from "vue";
import { getActiveOrders, getMerchantInfoById } from "@/services/orderFoodService";
import { formatDateTime, formatStatusClass, formatStatus, formatLocation } from "@/utility/orderHelpers";

// --- State ---
const orders = ref([]);
const isLoading = ref(true);
const currentPage = ref(1);
const totalOrders = ref(0);
const pageSize = 5;

// --- Derived values ---
const totalPages = computed(() => Math.ceil(totalOrders.value / pageSize));

// --- Fetch orders ---
async function fetchActiveOrders(page = 1) {
  isLoading.value = true;

  try {
    const userId = localStorage.getItem("user_id");
    const offset = (page - 1) * pageSize;

    // ✅ Directly get backend JSON
    const res = await getActiveOrders(userId, pageSize, offset);
    console.log("Active orders response:", res); // Debug line

    // ✅ Access properties correctly
    const ordersData = res.orders || [];
    totalOrders.value = res.total || 0;

    // ✅ Enrich each order with merchant info
    const withMerchant = await Promise.all(
      ordersData.map(async (order) => {
        try {
          const merchantRes = await getMerchantInfoById(order.merchant_id);
          order.merchant = merchantRes.data || merchantRes;
        } catch {
          order.merchant = { name: "Unknown Merchant", image_url: "https://via.placeholder.com/80?text=No+Image" };
        }
        return order;
      })
    );

    console.log("Orders after merchant enrich:", withMerchant);
    // ✅ Sort by created_time (or order_id if no timestamp)
    withMerchant.sort((a, b) => (b.created_time || b.order_id) - (a.created_time || a.order_id));

    orders.value = withMerchant;
  } catch (err) {
    console.error("❌ Failed to load active orders:", err);
    orders.value = [];
  } finally {
    isLoading.value = false; // ✅ spinner disappears
  }
}


// --- Pagination controls ---
function goToPage(page) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    fetchActiveOrders(page);
  }
}

// --- Status handling ---
function getCombinedStatus(order) {
  // Handle order_status values from backend
  const status = order.order_status;
  
  if (status === "awaiting_payment") return "awaiting_payment";
  if (status === "awaiting_verification") return "awaiting_verification";
  if (status === "payment_verified" || status === "payment_confirmed") return "payment_confirmed";
  if (status === "preparing") return "preparing";
  if (status === "collected_by_runner") return "collected_by_runner";
  if (status === "delivered") return "delivered";
  if (status === "completed") return "completed";
  if (status === "refund_pending") return "refund_pending";
  if (status === "refund_complete") return "refund_complete";
  if (status === "cancelled") return "cancelled";
  
  return "awaiting_payment";
}

onMounted(() => {
  fetchActiveOrders(1);
//   window.addEventListener("order-updated", () => fetchActiveOrders(currentPage.value));
// Dispatch this event after payment (dk what this is)
// window.dispatchEvent(new CustomEvent("order-updated"));

});
</script>


<template>
    <div class="active-orders-page">
        <!-- Header Section -->
        <div class="header-section">
            <div class="header-accent"></div>
            <h1 class="page-title">Active Orders</h1>
            <p class="page-subtitle">Track your ongoing deliveries</p>
        </div>

        <!-- Orders Container -->
        <div class="orders-container">
            <!-- Loading State -->
            <div v-if="isLoading" class="loading-state">
                <div class="loading-spinner"></div>
                <p>Loading your orders...</p>
            </div>

            <!-- Empty State -->
            <div v-else-if="orders.length === 0" class="empty-state">
                <div class="empty-icon">📦</div>
                <h3>No Active Orders</h3>
                <p>You don't have any ongoing orders at the moment</p>
                <router-link to="/order">
                    <button class="order-now-btn">Order Now</button>
                </router-link>
            </div>

            <!-- Orders List -->
            <div v-else class="orders-list">
                <div v-for="order in orders" :key="order.id" class="order-card">
                    <!-- Merchant Logo -->
                    <div class="merchant-logo">
                        <img 
                            :src="order.merchant?.imageUrl || 'https://via.placeholder.com/80?text=No+Image'" 
                            :alt="order.merchant?.name || 'Merchant Logo'" 
                        />
                    </div>

                    <!-- Order Details -->
                    <div class="order-details">
                    <h3 class="order-number">Order {{ order.order_id }}</h3>
                    <p class="order-info">Destination: {{ formatLocation(order) }}</p>
                    <p class="order-info">Merchant: {{ order.merchant?.name }}</p>
                    <p class="order-info">Delivery date & time: {{ formatDateTime(order.delivery_time) }}</p>
                    <p class="order-placed">Order placed on {{ formatDateTime(order.created_time) }}</p>
                    </div>
                    <!-- <div class="order-details">
                        <h3 class="order-number">Order {{ order.orderNumber }}</h3>
                        <p class="order-info">Destination: {{ order.destination }}</p>
                        <p class="order-info">Merchant: {{ order.merchantName }}</p>
                        <p class="order-info">Delivery date & time: {{ order.deliveryDateTime }}</p>
                        <p class="order-placed">Order placed on {{ order.orderPlaced }}</p>
                    </div> -->

                    <!-- Order Summary -->
                    <div class="order-summary">
                        <p class="item-count">
                            {{ order.items?.length || 0 }}
                            {{ (order.items?.length || 0) === 1 ? 'item' : 'items' }}
                        </p>

                        <p class="order-price">
                            ${{ (order.amount_total_cents / 100).toFixed(2) }}
                        </p>

                        <div
                            class="order-status"
                            :class="formatStatusClass(getCombinedStatus(order))"
                        >
                            {{ formatStatus(getCombinedStatus(order)) }}
                        </div>
                    </div>
                    <!-- Order Summary -->
                    <!-- <div class="order-summary">
                        <p class="item-count">{{ order.itemCount }} {{ order.itemCount === 1 ? 'item' : 'items' }}</p> -->
                        <!-- <p class="order-price">${{ order.price.toFixed(2) }}</p> -->
                        <!-- <p class="order-price">
                            ${{ (order.amount_total_cents / 100).toFixed(2) }}
                        </p>
                        <div class="order-status" :class="getStatusClass(order.status)">
                            {{ order.status }}
                        </div>
                    </div> -->
                </div>

                <!-- Pagination -->
                <div class="pagination" v-if="totalPages > 1">
                    <button 
                        class="page-btn" 
                        :disabled="currentPage === 1"
                        @click="goToPage(currentPage - 1)">
                        &lt;
                    </button>
                    <button 
                        v-for="page in totalPages" 
                        :key="page"
                        class="page-btn"
                        :class="{ active: currentPage === page }"
                        @click="goToPage(page)">
                        {{ page }}
                    </button>
                    <button 
                        class="page-btn"
                        :disabled="currentPage === totalPages"
                        @click="goToPage(currentPage + 1)">
                        &gt;
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<!-- <script>
import { defineComponent, ref } from 'vue'

export default defineComponent({
    name: 'ActiveOrdersPage',
    setup() {
        const isLoading = ref(false)
        const currentPage = ref(1)
        const totalPages = ref(3)

        // Mock data
        const orders = ref([
            {
                id: 1,
                orderNumber: 312,
                merchantName: 'Brøk',
                merchantLogo: 'https://via.placeholder.com/80?text=Brøk',
                destination: 'School of Business, Group Study Room 2-19',
                deliveryDateTime: '05/11/2025, 12:00 pm',
                orderPlaced: '04/11/2025, 08:57 pm',
                itemCount: 1,
                price: 6.00,
                status: 'Awaiting verification'
            },
            {
                id: 2,
                orderNumber: 311,
                merchantName: 'Drinks',
                merchantLogo: 'https://via.placeholder.com/80?text=Drinks',
                destination: 'School of Economics, Group Study Room 3-6',
                deliveryDateTime: '25/10/2025, 12:00 pm',
                orderPlaced: '25/10/2025, 10:48 am',
                itemCount: 2,
                price: 3.00,
                status: 'Awaiting verification'
            },
            {
                id: 3,
                orderNumber: 310,
                merchantName: 'Western Food',
                merchantLogo: 'https://via.placeholder.com/80?text=Western',
                destination: 'School of Law, Group Study Room B1-08',
                deliveryDateTime: '24/10/2025, 12:00 pm',
                orderPlaced: '24/10/2025, 10:38 am',
                itemCount: 1,
                price: 7.80,
                status: 'Awaiting payment'
            }
        ])

        const getStatusClass = (status) => {
            if (status.toLowerCase().includes('verification')) {
                return 'status-verification'
            } else if (status.toLowerCase().includes('payment')) {
                return 'status-payment'
            } else if (status.toLowerCase().includes('preparing')) {
                return 'status-preparing'
            } else if (status.toLowerCase().includes('delivery')) {
                return 'status-delivery'
            }
            return ''
        }

        const goToPage = (page) => {
            if (page >= 1 && page <= totalPages.value) {
                currentPage.value = page
                // In real app, fetch orders for this page
                console.log('Loading page:', page)
            }
        }

        return {
            isLoading,
            orders,
            currentPage,
            totalPages,
            getStatusClass,
            goToPage
        }
    }
})
</script> -->

<style scoped>
.active-orders-page {
    max-width: 1400px;
    margin: 0 auto;
    padding: 50px 40px;
    padding-top: 140px;
}

.header-section {
    text-align: center;
    margin-bottom: 60px;
}

.header-accent {
    width: 80px;
    height: 4px;
    background: var(--primary-color);
    margin: 0 auto 20px;
    border-radius: 2px;
}

.page-title {
    font-family: var(--font-heading);
    font-size: 3rem;
    font-weight: 700;
    color: var(--text-color);
    margin-bottom: 12px;
}

.page-subtitle {
    font-family: var(--font-body);
    font-size: 1.2rem;
    color: var(--text-color);
    opacity: 0.8;
}

.orders-container {
    max-width: 1200px;
    margin: 0 auto;
}

/* Loading State */
.loading-state {
    text-align: center;
    padding: 80px 20px;
}

.loading-spinner {
    width: 50px;
    height: 50px;
    margin: 0 auto 20px;
    border: 4px solid var(--secondary-color);
    border-top: 4px solid var(--primary-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

/* Empty State */
.empty-state {
    text-align: center;
    padding: 80px 40px;
    background: var(--secondary-color);
    border: 2px solid var(--text-color);
    border-radius: 24px;
}

.empty-icon {
    font-size: 5rem;
    margin-bottom: 20px;
}

.empty-state h3 {
    font-family: var(--font-heading);
    font-size: 1.8rem;
    color: var(--text-color);
    margin-bottom: 12px;
}

.empty-state p {
    font-family: var(--font-body);
    font-size: 1.1rem;
    color: var(--text-color);
    opacity: 0.7;
    margin-bottom: 28px;
}

.order-now-btn {
    background: var(--primary-color);
    color: var(--text-color);
    font-family: var(--font-body);
    font-size: 1.1rem;
    font-weight: 600;
    padding: 14px 40px;
    border: 2px solid var(--text-color);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.order-now-btn:hover {
    background: var(--primary-dark);
    transform: translateY(-2px);
}

/* Orders List */
.orders-list {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.order-card {
    display: grid;
    grid-template-columns: 80px 1fr auto;
    gap: 24px;
    align-items: center;
    background: var(--secondary-color);
    border: 2px solid var(--text-color);
    border-radius: 20px;
    padding: 28px;
    box-shadow: 0 4px 16px rgba(34, 32, 30, 0.08);
    transition: all 0.3s ease;
}

.order-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(34, 32, 30, 0.12);
}

/* Merchant Logo */
.merchant-logo {
    width: 80px;
    height: 80px;
    border-radius: 12px;
    border: 2px solid var(--text-color);
    overflow: hidden;
    background: var(--tertiary-color);
    display: flex;
    align-items: center;
    justify-content: center;
}

.merchant-logo img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

/* Order Details */
.order-details {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.order-number {
    font-family: var(--font-heading);
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-color);
    margin: 0 0 4px 0;
}

.order-info {
    font-family: var(--font-body);
    font-size: 0.95rem;
    color: var(--text-color);
    margin: 0;
}

.order-placed {
    font-family: var(--font-body);
    font-size: 0.9rem;
    color: var(--text-color);
    opacity: 0.5;
    margin: 4px 0 0 0;
}

/* Order Summary */
.order-summary {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
    min-width: 180px;
}

.item-count {
    font-family: var(--font-body);
    font-size: 0.95rem;
    color: var(--text-color);
    opacity: 0.7;
    margin: 0;
}

.order-price {
    font-family: var(--font-heading);
    font-size: 1.8rem;
    font-weight: 700;
    color: var(--text-color);
    margin: 0;
}

.order-status {
    font-family: var(--font-body);
    font-size: 0.9rem;
    font-weight: 600;
    padding: 8px 20px;
    border-radius: 20px;
    border: 2px solid var(--text-color);
    text-align: center;
}

.status-verification {
    background: #e0e7ff;
    color: #3730a3;
}

.status-payment {
    background: #fef3c7;
    color: #92400e;
}

.status-preparing {
    background: #dbeafe;
    color: #1e40af;
}

.status-delivery {
    background: #d1fae5;
    color: #065f46;
}

/* Pagination */
.pagination {
    display: flex;
    justify-content: center;
    gap: 12px;
    margin-top: 40px;
    padding-top: 40px;
    border-top: 2px solid var(--text-color);
    opacity: 0.2;
}

.page-btn {
    font-family: var(--font-body);
    font-size: 1rem;
    font-weight: 600;
    min-width: 44px;
    height: 44px;
    padding: 8px 12px;
    background: var(--tertiary-color);
    color: var(--text-color);
    border: 2px solid var(--text-color);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.page-btn:hover:not(:disabled) {
    background: var(--primary-color);
    transform: translateY(-2px);
}

.page-btn.active {
    background: var(--primary-color);
    border-color: var(--text-color);
}

.page-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
}

/* Responsive Design */
@media (max-width: 768px) {
    .active-orders-page {
        padding: 30px 20px;
        padding-top: 120px;
    }

    .page-title {
        font-size: 2.2rem;
    }

    .order-card {
        grid-template-columns: 1fr;
        gap: 20px;
    }

    .merchant-logo {
        width: 60px;
        height: 60px;
        margin: 0 auto;
    }

    .order-summary {
        align-items: flex-start;
        width: 100%;
    }

    .order-status {
        width: 100%;
    }

    .pagination {
        flex-wrap: wrap;
    }
}
</style>