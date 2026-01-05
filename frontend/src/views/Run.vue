<script setup lang="js">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import http from "@/services/http"
import { getMerchantName } from "@/services/merchantService"
import { getUserNameByEmail } from "@/services/userService";

const router = useRouter()

// Current date and next day
const today = ref(new Date())
const nextDay = ref(new Date(today.value.getTime() + 24 * 60 * 60 * 1000))

// Time slots for availability
const timeSlots = [
  { id: 1, time: '7:15 AM - 8:15 AM', value: '08:15', icon: '🌅' },
  { id: 2, time: '11:00 AM - 12:00 PM', value: '12:00', icon: '☀️' },
  { id: 3, time: '2:30 PM - 3:30 PM', value: '15:30', icon: '🌆' },
  { id: 4, time: '6:00 PM - 7:00 PM', value: '19:00', icon: '🌆' }
]

// User's availability for next day
const availability = ref({
  '08:15': false,
  '12:00': false,
  '15:30': false,
  '19:00': false
})

// Notification state
const showNotification = ref(false)
const notificationMessage = ref('')

// Modal state
const showOrderModal = ref(false)
const selectedOrder = ref(null)

// Mock assigned orders
const assignedOrders = ref([
  // {
  //   id: 1,
  //   orderNumber: 'CC-2024-001',
  //   merchant: 'Burger Palace',
  //   deliveryTime: '8:15 AM',
  //   pickupLocation: 'SMU Campus Center',
  //   deliveryLocation: 'School of Business, Level 3',
  //   customerName: 'John Tan',
  //   items: ['Double Cheeseburger', 'Fries', 'Coke'],
  //   totalAmount: 15.50,
  //   deliveryFee: 1.00,
  //   status: 'pending'
  // },
  // {
  //   id: 2,
  //   orderNumber: 'CC-2024-002',
  //   merchant: 'Sushi Supreme',
  //   deliveryTime: '12:00 PM',
  //   pickupLocation: 'SMU Campus Center',
  //   deliveryLocation: 'School of Computing, Level 2',
  //   customerName: 'Sarah Lim',
  //   items: ['California Roll', 'Salmon Sashimi', 'Miso Soup'],
  //   totalAmount: 22.00,
  //   deliveryFee: 1.00,
  //   status: 'pending'
  // }
])

// Toggle availability for a time slot
const toggleAvailability = (timeValue) => {
  availability.value[timeValue] = !availability.value[timeValue]
}

// Save availability with nice notification
const saveAvailability = async () => {
  try {
    const selectedSlots = Object.entries(availability.value)
      .filter(([time, isAvailable]) => isAvailable)
      .map(([time]) => {
        switch (time) {
          case '08:15': return 'SLOT_1'
          case '12:00': return 'SLOT_2'
          case '15:30': return 'SLOT_3'
          case '19:00': return 'SLOT_4'
          default: return null
        }
      }).filter(Boolean)

    await http.post('/api/runners/availability', selectedSlots)
    
    notificationMessage.value = `Availability saved for ${nextDay.value.toLocaleDateString()}`
  } catch (err) {
    console.error("Failed to save availability:", err)
    notificationMessage.value = "Failed to save availability."
  } finally {
    showNotification.value = true
    setTimeout(() => (showNotification.value = false), 3000)
  }
}

// Format date
const formatDate = (date) => {
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
}

// Update order status
const updateOrderStatus = (orderId, newStatus) => {
  const order = assignedOrders.value.find(o => o.id === orderId)
  if (order) {
    order.status = newStatus
    console.log(`Order ${orderId} updated to ${newStatus}`)
    
    // Show notification
    notificationMessage.value = `Order ${order.orderNumber} marked as ${newStatus}`
    showNotification.value = true
    
    setTimeout(() => {
      showNotification.value = false
    }, 3000)
    
    // Here you would make an API call to update order status
    // await axiosInstance.put(`/api/orders/${orderId}/status`, { status: newStatus })
  }
}

// View order details in modal
const viewOrderDetails = (orderId) => {
  selectedOrder.value = assignedOrders.value.find(o => o.id === orderId)
  showOrderModal.value = true
}

// Close modal
const closeModal = () => {
  showOrderModal.value = false
  selectedOrder.value = null
}

// Count available slots
const availableCount = computed(() => {
  return Object.values(availability.value).filter(v => v).length
})



onMounted(async () => {
  try {
    // --- Load runner's availability ---
    const dateParam = nextDay.value.toISOString().split("T")[0];
    const { data } = await http.get(`/api/runners/availability/${dateParam}`);

    for (const key in availability.value) availability.value[key] = false;
    for (const slot of data) {
      if (slot === "SLOT_1") availability.value["08:15"] = true;
      if (slot === "SLOT_2") availability.value["12:00"] = true;
      if (slot === "SLOT_3") availability.value["15:30"] = true;
      if (slot === "SLOT_4") availability.value["19:00"] = true;
    }

    const ordersResponse = await http.get(`/api/runners/assign/my-orders?date=${dateParam}`);
    const orders = ordersResponse.data;

    assignedOrders.value = await Promise.all(
      orders.map(async (order) => {
        let items = [];
        try {
          items = JSON.parse(order.itemsJson || "[]");
        } catch (err) {
          console.error("Failed to parse itemsJson for order:", order.orderId, err);
        }

        const merchantName = await getMerchantName(order.merchantId);
        const customerName = await getUserNameByEmail(order.customerEmail);

        return {
          id: order.orderId,
          orderNumber: `CC-${String(order.orderId).padStart(4, "0")}`,
          merchant: merchantName,
          deliveryTime: new Date(order.deliveryTime).toLocaleTimeString("en-SG", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }),
          pickupLocation: "SMU Campus Center",
          deliveryLocation: [order.building, order.roomType, order.roomNumber]
            .filter(Boolean)
            .join(", "),
          customerName: customerName || "N/A",
          items: items.map((i) => i.name),
          totalAmount: order.totalAmountCents / 100,
          deliveryFee: (order.deliveryFeeCents || 200) / 100 ,
          status: order.status || "pending",
        };
      })
    );
  } catch (err) {
    console.error("Failed to load data:", err);
  }
});
</script>

<template>
  <div class="runner-page-wrapper">
    <!-- Success Notification -->
    <transition name="slide-down">
      <div v-if="showNotification" class="notification-banner">
        <div class="notification-content">
          <svg class="notification-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
          </svg>
          <span>{{ notificationMessage }}</span>
        </div>
      </div>
    </transition>

    <!-- Order Details Modal -->
    <transition name="fade">
      <div v-if="showOrderModal" class="modal-overlay" @click="closeModal">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h2>Order Details</h2>
            <button class="close-modal-btn" @click="closeModal">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M6 18L18 6M6 6l12 12" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <div v-if="selectedOrder" class="modal-body">
            <div class="modal-section">
              <div class="modal-row">
                <div class="modal-info">
                  <div class="modal-label">Order Number</div>
                  <div class="modal-value">{{ selectedOrder.orderNumber }}</div>
                </div>
              </div>

              <div class="modal-row">
                <div class="modal-info">
                  <div class="modal-label">Merchant</div>
                  <div class="modal-value">{{ selectedOrder.merchant }}</div>
                </div>
              </div>

              <div class="modal-row">
                <div class="modal-info">
                  <div class="modal-label">Delivery Time</div>
                  <div class="modal-value">{{ selectedOrder.deliveryTime }}</div>
                </div>
              </div>

              <div class="modal-row">
                <div class="modal-info">
                  <div class="modal-label">Pick up from</div>
                  <div class="modal-value">{{ selectedOrder.pickupLocation }}</div>
                </div>
              </div>

              <div class="modal-row">
                <div class="modal-info">
                  <div class="modal-label">Deliver to</div>
                  <div class="modal-value">{{ selectedOrder.deliveryLocation }}</div>
                </div>
              </div>

              <div class="modal-row">
                <div class="modal-info">
                  <div class="modal-label">Customer</div>
                  <div class="modal-value">{{ selectedOrder.customerName }}</div>
                </div>
              </div>
            </div>

            <div class="modal-section items-section">
              <h3 class="items-title">
                Items to Deliver
              </h3>
              <ul class="items-list">
                <li v-for="(item, index) in selectedOrder.items" :key="index">
                  {{ item }}
                </li>
              </ul>
            </div>

            <div class="modal-footer">
              <div class="modal-row highlight">
                <div class="modal-info">
                  <div class="modal-label">Your Delivery Fee</div>
                  <div class="modal-value amount">${{ selectedOrder.deliveryFee.toFixed(2) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <div class="runner-page">
      
      <!-- Page Header -->
      <div class="page-header">
        <h1 class="page-title">Runner Dashboard</h1>
        <p class="page-subtitle">Manage your delivery schedule and view assigned orders</p>
      </div>

      <div class="runner-content">
        
        <!-- LEFT: Availability Schedule -->
        <section class="availability-section">
          <div class="section-card">
            <div class="section-header">
              <h2 class="section-title">
                Availability
              </h2>
              <span class="date-badge">{{ formatDate(nextDay) }}</span>
            </div>

            <p class="section-description">
              Select the time slots you're available to deliver tomorrow
            </p>

            <div class="time-slots">
              <div 
                v-for="slot in timeSlots" 
                :key="slot.id"
                class="time-slot"
                :class="{ active: availability[slot.value] }"
                @click="toggleAvailability(slot.value)"
              >
                <div class="slot-icon">{{ slot.icon }}</div>
                <div class="slot-info">
                  <div class="slot-time">{{ slot.time }}</div>
                  <div class="slot-status">
                    <span v-if="availability[slot.value]">✓ Available</span>
                    <span v-else class="unavailable">Not Available</span>
                  </div>
                </div>
                <div class="slot-toggle">
                  <div class="toggle-switch" :class="{ on: availability[slot.value] }">
                    <div class="toggle-knob"></div>
                  </div>
                </div>
              </div>
            </div>

            <div class="availability-summary">
              <div class="summary-card">
                <div class="summary-number">{{ availableCount }}</div>
                <div class="summary-label">Slots Available</div>
              </div>
              <div class="summary-card">
                <div class="summary-number">{{ assignedOrders.length }}</div>
                <div class="summary-label">Orders Assigned</div>
              </div>
            </div>

            <button class="save-btn" @click="saveAvailability">
              <span>Save Availability</span>
            </button>
          </div>
        </section>

        <!-- RIGHT: Assigned Orders -->
        <section class="orders-section">
          <div class="section-card">
            <div class="section-header">
              <h2 class="section-title">
                Assigned Orders
              </h2>
              <span class="orders-count">{{ assignedOrders.length }} orders</span>
            </div>

            <p class="section-description">
              Orders automatically assigned based on your availability
            </p>

            <!-- Orders List -->
            <div class="orders-list">
              <div 
                v-for="order in assignedOrders" 
                :key="order.id"
                class="order-card"
              >
                <div class="order-header">
                  <div class="order-number">{{ order.orderNumber }}</div>
                  <div class="order-status-badge" :class="order.status">
                    {{ order.status }}
                  </div>
                </div>

                <div class="order-details">
                  <div class="order-row">
                    <span class="detail-label">Merchant:</span>
                    <span class="detail-value">{{ order.merchant}}</span>
                  </div>
                  
                  <div class="order-row">
                    <span class="detail-label">Time:</span>
                    <span class="detail-value">{{ order.deliveryTime }}</span>
                  </div>

                  <div class="order-row">
                    <span class="detail-label">Customer:</span>
                    <span class="detail-value">{{ order.customerName }}</span>
                  </div>

                  <div class="order-row">
                    <span class="detail-label">Pick up from:</span>
                    <span class="detail-value">{{ order.pickupLocation }}</span>
                  </div>

                  <div class="order-row">
                    <span class="detail-label">Deliver to:</span>
                    <span class="detail-value">{{ order.deliveryLocation }}</span>
                  </div>

                  <div class="order-row highlight">
                    <span class="detail-label">Delivery Fee:</span>
                    <span class="detail-value amount">${{ order.deliveryFee.toFixed(2) }}</span>
                  </div>
                </div>

                <div class="order-actions">
                  <button 
                    v-if="order.status === 'pending'"
                    class="action-btn primary"
                    @click="updateOrderStatus(order.id, 'picked-up')"
                  >
                    ✓ Mark as Picked Up
                  </button>
                  <button 
                    v-if="order.status === 'picked-up'"
                    class="action-btn success"
                    @click="updateOrderStatus(order.id, 'delivered')"
                  >
                    ✓ Mark as Delivered
                  </button>
                  <button 
                    v-if="order.status === 'delivered'"
                    class="action-btn completed"
                    disabled
                  >
                    ✓ Completed
                  </button>
                  <button 
                    class="action-btn secondary"
                    @click="viewOrderDetails(order.id)"
                  >
                    View Details
                  </button>
                </div>
              </div>

              <!-- Empty State -->
              <div v-if="assignedOrders.length === 0" class="empty-state">
                <div class="empty-icon">📭</div>
                <h3>No Orders Assigned</h3>
                <p>Set your availability and orders will be automatically assigned to you!</p>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  </div>
</template>

<style scoped>
/* Notification Banner */
.notification-banner {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2000;
  background: var(--text-color);
  color: var(--primary-color);
  padding: 16px 32px;
  border-radius: 12px;
  border: 2px solid var(--text-color);
  box-shadow: 0 8px 32px rgba(34, 32, 30, 0.3);
  max-width: 500px;
}

.notification-content {
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: var(--font-heading);
  font-size: 1rem;
  font-weight: 600;
}

.notification-icon {
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
  transform: translateX(-50%) translateY(-20px);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}

/* Modal Overlay */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  padding: 20px;
}

.modal-content {
  background: var(--secondary-color);
  border-radius: 24px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  border: 3px solid var(--text-color);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

/* Modal animations */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.fade-enter-active .modal-content {
  animation: modalSlideUp 0.3s ease;
}

@keyframes modalSlideUp {
  from {
    transform: translateY(50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px;
  border-bottom: 2px solid var(--primary-color);
}

.modal-header h2 {
  font-family: var(--font-heading);
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text-color);
  margin: 0;
}

.close-modal-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: var(--tertiary-color);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.close-modal-btn:hover {
  background: var(--primary-color);
  transform: rotate(90deg);
}

.close-modal-btn svg {
  width: 20px;
  height: 20px;
  stroke: var(--text-color);
}

.modal-body {
  padding: 32px;
}

.modal-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.modal-row {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  background: var(--tertiary-color);
  border-radius: 12px;
  border: 1px solid var(--text-color);
}

.modal-row.highlight {
  background: var(--primary-color);
  border: 2px solid var(--text-color);
}

.modal-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.modal-info {
  flex: 1;
}

.modal-label {
  font-family: var(--font-body);
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-color);
  opacity: 0.7;
  margin-bottom: 4px;
}

.modal-value {
  font-family: var(--font-body);
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color);
}

.modal-value.amount {
  font-family: var(--font-heading);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-color);
}

.items-section {
  background: var(--tertiary-color);
  border: 2px solid var(--text-color);
  border-radius: 12px;
  padding: 20px;
}

.items-title {
  font-family: var(--font-heading);
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--text-color);
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.items-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.items-list li {
  padding: 12px 16px;
  background: var(--secondary-color);
  border-radius: 8px;
  border: 1px solid var(--text-color);
  font-family: var(--font-body);
  font-weight: 500;
  color: var(--text-color);
}

.items-list li:before {
  content: "• ";
  color: var(--primary-color);
  font-weight: bold;
  margin-right: 8px;
}

.modal-footer {
  padding-top: 20px;
  border-top: 2px solid var(--primary-color);
}

/* Page Layout */
.runner-page-wrapper {
  position: relative;
  width: 100vw;
  height: auto;
  background: var(--secondary-color);
  padding: 6rem 0;
}

.runner-page {
  max-width: 1400px;
  margin: 0 auto;
  font-family: var(--font-body);
  animation: fadeInUp 0.6s ease-out;
}

/* Page Header */
.page-header {
  text-align: center;
  margin-bottom: 40px;
  animation: fadeInUp 0.8s ease-out 0.2s both;
}

.page-title {
  font-family: var(--font-heading);
  font-size: 3rem;
  font-weight: 800;
  color: var(--text-color);
  margin-bottom: 12px;
}

.page-subtitle {
  font-size: 1.2rem;
  color: var(--text-color);
  opacity: 0.8;
}

/* Main Content Layout */
.runner-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
}

/* Section Cards */
.availability-section {
  animation: fadeInUp 0.8s ease-out 0.4s both;
}

.orders-section {
  animation: fadeInUp 0.8s ease-out 0.6s both;
}

.section-card {
  background: var(--tertiary-color);
  border-radius: 24px;
  padding: 32px;
  border: 2px solid var(--text-color);
  box-shadow: 0 4px 12px rgba(34, 32, 30, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-family: var(--font-heading);
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text-color);
  display: flex;
  align-items: center;
  gap: 12px;
}

.section-description {
  color: var(--text-color);
  opacity: 0.7;
  margin-bottom: 24px;
  font-size: 0.95rem;
}

.date-badge {
  background: var(--primary-color);
  color: var(--text-color);
  padding: 8px 16px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
  border: 1px solid var(--text-color);
}

.orders-count {
  background: var(--primary-color);
  color: var(--text-color);
  padding: 6px 14px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
}

/* Time Slots */
.time-slots {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.time-slot {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: var(--secondary-color);
  border: 2px solid var(--text-color);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.time-slot:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(252, 188, 5, 0.2);
}

.time-slot.active {
  background: var(--primary-color);
  border-color: var(--text-color);
}

.slot-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.slot-info {
  flex: 1;
}

.slot-time {
  font-family: var(--font-heading);
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--text-color);
  margin-bottom: 4px;
}

.slot-status {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-color);
}

.slot-status .unavailable {
  opacity: 0.5;
}

/* Toggle Switch */
.slot-toggle {
  flex-shrink: 0;
}

.toggle-switch {
  width: 50px;
  height: 26px;
  background: var(--text-color);
  border-radius: 13px;
  position: relative;
  transition: all 0.3s ease;
  opacity: 0.3;
}

.toggle-switch.on {
  background: var(--text-color);
  opacity: 1;
}

.toggle-knob {
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  position: absolute;
  top: 3px;
  left: 3px;
  transition: all 0.3s ease;
}

.toggle-switch.on .toggle-knob {
  left: 27px;
}

/* Availability Summary */
.availability-summary {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

.summary-card {
  background: var(--secondary-color);
  border: 2px solid var(--text-color);
  border-radius: 16px;
  padding: 20px;
  text-align: center;
}

.summary-number {
  font-family: var(--font-heading);
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--primary-color);
}

.summary-label {
  font-size: 0.9rem;
  color: var(--text-color);
  opacity: 0.7;
  margin-top: 4px;
}

/* Save Button */
.save-btn {
  width: 100%;
  padding: 16px;
  background: var(--text-color);
  color: var(--primary-color);
  border: none;
  border-radius: 16px;
  font-family: var(--font-heading);
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
}

.save-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(34, 32, 30, 0.3);
}

/* Orders List */
.orders-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-height: 600px;
  overflow-y: auto;
  padding-right: 8px;
}

.order-card {
  background: var(--secondary-color);
  border: 2px solid var(--text-color);
  border-radius: 16px;
  padding: 20px;
  transition: all 0.3s ease;
}

.order-card:hover {
  box-shadow: 0 6px 16px rgba(34, 32, 30, 0.1);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--tertiary-color);
}

.order-number {
  font-family: var(--font-heading);
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-color);
}

.order-status-badge {
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.order-status-badge.pending {
  background: #ffd700;
  color: var(--text-color);
}

.order-status-badge.picked-up {
  background: #4a90e2;
  color: white;
}

.order-status-badge.delivered {
  background: #7ed321;
  color: white;
}

.order-details {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}

.order-row {
  display: grid;
  grid-template-columns: 100px 1fr;
  gap: 8px;
  align-items: center;
  font-size: 0.9rem;
}

.order-row.highlight {
  background: var(--primary-color);
  padding: 8px;
  border-radius: 8px;
  margin-top: 8px;
}

.detail-label {
  font-weight: 600;
  color: var(--text-color);
}

.detail-value {
  color: var(--text-color);
}

.detail-value.amount {
  font-family: var(--font-heading);
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text-color);
}

/* Order Actions */
.order-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 12px;
  font-family: var(--font-body);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-btn.primary {
  background: var(--primary-color);
  color: var(--text-color);
  border: 2px solid var(--text-color);
}

.action-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(252, 188, 5, 0.3);
}

.action-btn.success {
  background: #7ed321;
  color: white;
}

.action-btn.success:hover {
  background: #6ec41a;
  transform: translateY(-2px);
}

.action-btn.completed {
  background: var(--text-color);
  color: var(--primary-color);
  cursor: not-allowed;
  opacity: 0.7;
}

.action-btn.secondary {
  background: var(--tertiary-color);
  color: var(--text-color);
  border: 2px solid var(--text-color);
}

.action-btn.secondary:hover {
  background: var(--primary-color);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  animation: fadeInUp 0.8s ease-out 0.8s both;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 16px;
}

.empty-state h3 {
  font-family: var(--font-heading);
  font-size: 1.5rem;
  color: var(--text-color);
  margin-bottom: 8px;
}

.empty-state p {
  color: var(--text-color);
  opacity: 0.7;
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
@media (max-width: 1024px) {
  .runner-content {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .runner-page {
    padding: 24px 16px;
  }

  .page-title {
    font-size: 2.2rem;
  }

  .section-card {
    padding: 24px;
  }

  .section-title {
    font-size: 1.5rem;
  }

  .availability-summary {
    grid-template-columns: 1fr;
  }

  .order-actions {
    flex-direction: column;
  }

  .modal-content {
    max-width: 95%;
  }

  .modal-header {
    padding: 20px;
  }

  .modal-body {
    padding: 20px;
  }
}
</style>