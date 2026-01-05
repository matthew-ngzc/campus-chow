<script setup>
import { ref, onMounted, computed } from "vue";
import { getPastOrders, getMerchantInfoById } from "@/services/orderFoodService";
import { formatDateTime, formatLocation } from "@/utility/orderHelpers";

// --- State ---
const orders = ref([]);
const isLoading = ref(true);
const currentPage = ref(1);
const totalOrders = ref(0);
const pageSize = 5;

// --- Computed ---
const totalPages = computed(() => Math.ceil(totalOrders.value / pageSize));

// --- Fetch past orders ---
async function fetchPastOrders(page = 1) {
  isLoading.value = true;
  try {
    const userId = localStorage.getItem("user_id");
    const offset = (page - 1) * pageSize;

    // 1️⃣ Fetch from backend
    const res = await getPastOrders(userId, pageSize, offset);
    const ordersData = res.orders || res.data?.orders || [];
    totalOrders.value = res.total || res.data?.total || 0;

    // 2️⃣ Enrich with merchant info
    const withMerchant = await Promise.all(
      ordersData.map(async (order) => {
        try {
          const merchantRes = await getMerchantInfoById(order.merchant_id);
          order.merchant = merchantRes.data || merchantRes;
        } catch {
          order.merchant = {
            name: "Unknown Merchant",
            imageUrl: "https://via.placeholder.com/80?text=No+Image",
          };
        }
        return order;
      })
    );

    // 3️⃣ Sort by delivery time (latest first)
    withMerchant.sort((a, b) => new Date(b.delivery_time) - new Date(a.delivery_time));
    orders.value = withMerchant;
  } catch (err) {
    console.error("❌ Failed to load past orders:", err);
    orders.value = [];
  } finally {
    isLoading.value = false;
  }
}

// --- Pagination controls ---
function goToPage(page) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    fetchPastOrders(page);
  }
}

// --- Actions ---
function reorder(order) {
  alert(`Reordering from ${order.merchant?.name}!\n\nOrder #${order.order_id} items will be added to your cart.`);
}

function viewDetails(order) {
  alert(`Viewing details for Order #${order.order_id}`);
}

// --- Lifecycle ---
onMounted(() => {
  fetchPastOrders(1);
});
</script>

<template>
  <div class="order-history-page">
    <!-- Header Section -->
    <div class="header-section">
      <div class="header-accent"></div>
      <h1 class="page-title">Order History</h1>
      <p class="page-subtitle">View your past orders and reorder favorites</p>
    </div>

    <!-- Orders Container -->
    <div class="orders-container">
      <!-- Loading -->
      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading your order history...</p>
      </div>

      <!-- Empty -->
      <div v-else-if="orders.length === 0" class="empty-state-card">
        <h2 class="empty-title">No Order History</h2>
        <p class="empty-text">You haven't placed any orders yet.</p>
        <router-link to="/order">
          <button class="start-ordering-btn">Start Ordering</button>
        </router-link>
      </div>

      <!-- Orders List -->
      <div v-else class="orders-list">
        <div v-for="order in orders" :key="order.order_id" class="order-card">
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
            <p class="order-info">
              Delivered on:
              {{ order.delivery_completion_time ? formatDateTime(order.delivery_completion_time) : "—" }}
            </p>
            <p class="order-placed">
              Order placed on {{ formatDateTime(order.created_time) }}
            </p>
          </div>

          <!-- Order Summary -->
          <div class="order-summary">
            <p class="item-count">
              {{ order.items?.length || 0 }}
              {{ (order.items?.length || 0) === 1 ? "item" : "items" }}
            </p>
            <p class="order-price">
              ${{ (order.amount_total_cents / 100).toFixed(2) }}
            </p>

            <div class="order-actions">
              <button class="action-btn reorder-btn" @click="reorder(order)">
                Reorder
              </button>
              <button class="action-btn details-btn" @click="viewDetails(order)">
                View Details
              </button>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div class="pagination" v-if="totalPages > 1">
          <button
            class="page-btn"
            :disabled="currentPage === 1"
            @click="goToPage(currentPage - 1)"
          >
            &lt;
          </button>
          <button
            v-for="page in totalPages"
            :key="page"
            class="page-btn"
            :class="{ active: currentPage === page }"
            @click="goToPage(page)"
          >
            {{ page }}
          </button>
          <button
            class="page-btn"
            :disabled="currentPage === totalPages"
            @click="goToPage(currentPage + 1)"
          >
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
    name: 'OrderHistoryPage',
    setup() {
        const isLoading = ref(false)
        const currentPage = ref(1)
        const totalPages = ref(2)

        // Mock data
        // we can change this to an empty array for our empty state behavior
        const orders = ref([
            {
                id: 1,
                orderNumber: 305,
                merchantName: 'Burger Palace',
                merchantLogo: 'https://via.placeholder.com/80?text=Burger',
                destination: 'School of Computing, Level 3',
                deliveredOn: '01/11/2025, 1:30 pm',
                orderPlaced: '01/11/2025, 12:15 pm',
                itemCount: 2,
                price: 12.50
            },
            {
                id: 2,
                orderNumber: 298,
                merchantName: 'Sushi Supreme',
                merchantLogo: 'https://via.placeholder.com/80?text=Sushi',
                destination: 'School of Business, Level 2',
                deliveredOn: '28/10/2025, 6:45 pm',
                orderPlaced: '28/10/2025, 5:30 pm',
                itemCount: 1,
                price: 15.80
            },
            {
                id: 3,
                orderNumber: 287,
                merchantName: 'Pizza Paradise',
                merchantLogo: 'https://via.placeholder.com/80?text=Pizza',
                destination: 'School of Economics, Study Room 4-2',
                deliveredOn: '25/10/2025, 8:00 pm',
                orderPlaced: '25/10/2025, 7:15 pm',
                itemCount: 3,
                price: 24.90
            },
            {
                id: 4,
                orderNumber: 276,
                merchantName: 'Cafe Delight',
                merchantLogo: 'https://via.placeholder.com/80?text=Cafe',
                destination: 'Library, Level 5',
                deliveredOn: '20/10/2025, 10:30 am',
                orderPlaced: '20/10/2025, 9:45 am',
                itemCount: 1,
                price: 5.50
            },
            {
                id: 5,
                orderNumber: 265,
                merchantName: 'Pasta Haven',
                merchantLogo: 'https://via.placeholder.com/80?text=Pasta',
                destination: 'School of Law, Room B1-05',
                deliveredOn: '18/10/2025, 7:15 pm',
                orderPlaced: '18/10/2025, 6:30 pm',
                itemCount: 2,
                price: 18.00
            }
        ])

        // Uncomment to see empty state
        // orders.value = []

        const goToPage = (page) => {
            if (page >= 1 && page <= totalPages.value) {
                currentPage.value = page
                console.log('Loading page:', page)
            }
        }

        const reorder = (order) => {
            alert(`Reordering from ${order.merchantName}!\n\nOrder #${order.orderNumber} items will be added to your cart.`)
        }

        const viewDetails = (order) => {
            alert(`Viewing details for Order #${order.orderNumber}`)
        }

        return {
            isLoading,
            orders,
            currentPage,
            totalPages,
            goToPage,
            reorder,
            viewDetails
        }
    }
})
</script> -->

<style scoped>
.order-history-page {
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
.empty-state-card {
    background: var(--secondary-color);
    border: 2px solid var(--text-color);
    border-radius: 24px;
    padding: 100px 60px;
    text-align: center;
    box-shadow: 0 8px 24px rgba(34, 32, 30, 0.1);
}

.empty-title {
    font-family: var(--font-heading);
    font-size: 2rem;
    font-weight: 700;
    color: var(--text-color);
    margin-bottom: 16px;
}

.empty-text {
    font-family: var(--font-body);
    font-size: 1.1rem;
    color: var(--text-color);
    opacity: 0.7;
    margin-bottom: 32px;
    max-width: 500px;
    margin-left: auto;
    margin-right: auto;
}

.start-ordering-btn {
    background: #10b981;
    color: white;
    font-family: var(--font-body);
    font-size: 1.1rem;
    font-weight: 600;
    padding: 14px 40px;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.start-ordering-btn:hover {
    background: #059669;
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
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
    gap: 12px;
    min-width: 200px;
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

.order-actions {
    display: flex;
    gap: 8px;
    margin-top: 8px;
}

.action-btn {
    font-family: var(--font-body);
    font-size: 0.9rem;
    font-weight: 600;
    padding: 8px 16px;
    border: 2px solid var(--text-color);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.reorder-btn {
    background: var(--primary-color);
    color: var(--text-color);
}

.reorder-btn:hover {
    background: var(--primary-dark);
    transform: translateY(-2px);
}

.details-btn {
    background: transparent;
    color: var(--text-color);
}

.details-btn:hover {
    background: var(--tertiary-color);
    transform: translateY(-2px);
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
    .order-history-page {
        padding: 30px 20px;
        padding-top: 120px;
    }

    .page-title {
        font-size: 2.2rem;
    }

    .empty-state-card {
        padding: 60px 30px;
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

    .order-actions {
        width: 100%;
        flex-direction: column;
    }

    .action-btn {
        width: 100%;
    }

    .pagination {
        flex-wrap: wrap;
    }
}
</style>