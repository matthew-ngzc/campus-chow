<script setup>
import OrderTimeline from '../components/OrderTimeline.vue'
import { ref, watchEffect, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDeliveryStore } from '@/stores/delivery'
import { storeToRefs } from 'pinia'
import { locationMap } from '@/components/locationMap.js'

// Progress timeline
const data = {
  steps: ['order details', 'delivery location', 'order confirmation', 'payment'],
  currentStep: 2,
  activeColor: '#FCBC05',
  passiveColor: '#22201E',
}

// Delivery logic
const showValidationError = ref(false)
const router = useRouter()
const deliveryStore = useDeliveryStore()
const { building, facilityType, date, time, roomNumber } = storeToRefs(deliveryStore)

// Computed properties for dynamic options
const buildingError = ref('')
const facilityError = ref('')
const roomNumberError = ref('')

// Get minimum date (today) - FIXED VERSION
const minDate = computed(() => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
})

// Available time slots based on selected date
const availableTimeSlots = computed(() => {
  const allSlots = [
    { value: '08:15 AM', label: '08:15 AM' },
    { value: '12:00 PM', label: '12:00 PM' },
    { value: '03:30 PM', label: '03:30 PM' },
    { value: '07:00 PM', label: '07:00 PM' }
  ]

  // If no date selected, return all slots
  if (!date.value) return allSlots

  const selectedDate = new Date(date.value + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // If selected date is in the future, all slots are available
  if (selectedDate > today) {
    return allSlots
  }

  // If selected date is today, filter slots based on current time + 1 hour
  if (selectedDate.getTime() === today.getTime()) {
    const now = new Date()
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)
    const currentHour = oneHourFromNow.getHours()
    const currentMinute = oneHourFromNow.getMinutes()

    return allSlots.filter(slot => {
      const [timeStr, period] = slot.value.split(' ')
      const [hours, minutes] = timeStr.split(':').map(Number)
      
      // Convert to 24-hour format
      let slotHour = hours
      if (period === 'PM' && hours !== 12) {
        slotHour += 12
      } else if (period === 'AM' && hours === 12) {
        slotHour = 0
      }

      // Check if slot time is at least 1 hour from now
      if (slotHour > currentHour) {
        return true
      } else if (slotHour === currentHour) {
        return minutes >= currentMinute
      }
      return false
    })
  }

  return allSlots
})

// Watch for date changes and reset time if it's no longer valid
watchEffect(() => {
  if (date.value && time.value) {
    const isTimeValid = availableTimeSlots.value.some(slot => slot.value === time.value)
    if (!isTimeValid) {
      time.value = ''
    }
  }
})

// Computed property for available rooms
const availableRooms = computed(() => {
  if (!building.value || !facilityType.value) return []

  const normalisedMap = {
    business: 'LKCSB',
    law: 'YPHSL',
    economics: 'SOA',
    accounting: 'SOA',
    scis1: 'SCIS1',
    scis2: 'SCIS2'
  }

  const normalisedBuilding = normalisedMap[building.value?.toLowerCase()]
  if (!normalisedBuilding || !locationMap[normalisedBuilding]) return []

  const map = locationMap[normalisedBuilding]
  const allRooms = []
  
  Object.keys(map.floors).forEach(floor => {
    const floorData = map.floors[floor]
    if (floorData[facilityType.value]) {
      allRooms.push(...floorData[facilityType.value])
    }
  })
  
  return allRooms.sort()
})

// Computed property to check if room dropdown should be enabled
const isRoomDropdownEnabled = computed(() => {
  return building.value && facilityType.value && availableRooms.value.length > 0
})

// For facility type
watchEffect(() => {
  if (!building.value || !facilityType.value) return

  const normalisedMap = {
    business: 'LKCSB',
    law: 'YPHSL',
    economics: 'SOA',
    accounting: 'SOA',
    scis1: 'SCIS1',
    scis2: 'SCIS2'
  }

  const normalisedBuilding = normalisedMap[building.value?.toLowerCase()]
  
  if (!normalisedBuilding || !locationMap[normalisedBuilding]) {
    facilityError.value = 'Invalid building selected.'
    return
  }

  const map = locationMap[normalisedBuilding]
  const allFacilities = []
  
  Object.keys(map.floors).forEach(floor => {
    const floorData = map.floors[floor]
    Object.keys(floorData).forEach(facility => {
      if (!allFacilities.includes(facility)) {
        allFacilities.push(facility)
      }
    })
  })

  if (!allFacilities.includes(facilityType.value)) {
    facilityError.value = 'Invalid facility type for selected building.'
  } else {
    facilityError.value = ''
  }
})

// For room number
watchEffect(() => {
  if (!roomNumber.value) {
    roomNumberError.value = ''
    return
  }

  const isValid = availableRooms.value.includes(roomNumber.value)

  if (!isValid) {
    roomNumberError.value = 'Invalid room number for selected building/facility.'
  } else {
    roomNumberError.value = ''
  }
})

function validateRoomNumber(buildingVal, facilityVal, roomVal) {
  if (!buildingVal || !facilityVal || !roomVal) {
    return false
  }

  const normalisedMap = {
    business: "LKCSB",
    law: "YPHSL",
    economics: "SOA",
    accounting: "SOA",
    scis1: "SCIS1",
    scis2: "SCIS2",
  }

  const normalisedBuilding = normalisedMap[buildingVal?.toLowerCase()]
  if (!normalisedBuilding || !locationMap[normalisedBuilding]) {
    return false
  }

  const map = locationMap[normalisedBuilding]
  const allRooms = []
  
  Object.keys(map.floors).forEach(floor => {
    const floorData = map.floors[floor]
    if (floorData[facilityVal]) {
      allRooms.push(...floorData[facilityVal])
    }
  })
  
  return allRooms.includes(roomVal.trim())
}

async function goToSummary() {
  if (!building.value || !facilityType.value || !date.value || !time.value || !roomNumber.value) {
    showValidationError.value = true
    return
  }

  const isRoomValid = validateRoomNumber(building.value, facilityType.value, roomNumber.value)

  if (!isRoomValid) {
    buildingError.value = ''
    facilityError.value = ''
    roomNumberError.value = ''

    const normalisedMap = {
      business: 'LKCSB',
      law: 'YPHSL',
      economics: 'SOA',
      accounting: 'SOA',
      scis1: 'SCIS1',
      scis2: 'SCIS2'
    }

    const normalisedBuilding = normalisedMap[building.value?.toLowerCase()]

    if (!normalisedBuilding || !locationMap[normalisedBuilding]) {
      buildingError.value = 'Invalid building selected.'
    } else if (!availableRooms.value.length) {
      facilityError.value = 'Invalid facility for this building.'
    } else {
      roomNumberError.value = 'Invalid room number for selected building/facility.'
    }

    return
  }

  showValidationError.value = false
  roomNumberError.value = ''
  router.push('/summary')
}

function goBack() {
  router.go(-1)
}
</script>

<template>
  <div class="select-location-page-wrapper">
    <div class="select-location-page">
      <OrderTimeline :data="data" />

      <div class="delivery-form-container">
        <button class="back-button" @click="goBack">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" stroke-width="2" 
                  stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>

        <div class="form-header">
          <h1 class="page-title">Delivery Location</h1>
          <p class="page-subtitle">Where should we deliver your order?</p>
        </div>

        <div class="form-grid">
          <!-- Building Selection -->
          <div class="form-section">
            <label class="form-label">Building</label>
            <div class="select-wrapper">
              <select v-model="building" class="modern-select">
                <option value="" disabled selected hidden>Choose your building</option>
                <option value="Business">School of Business</option>
                <option value="Law">School of Law</option>
                <option value="Economics">School of Economics</option>
                <option value="Accounting">School of Accounting</option>
                <option value="Scis1">School of Computing and Information Systems 1</option>
                <option value="Scis2">School of Computing and Information Systems 2</option>
              </select>
              <svg class="select-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M6 9l6 6 6-6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div v-if="buildingError" class="error-message">
              <svg class="error-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
              </svg>
              {{ buildingError }}
            </div>
          </div>

          <!-- Facility Type -->
          <div class="form-section">
            <label class="form-label">Facility Type</label>
            <div class="select-wrapper">
              <select v-model="facilityType" class="modern-select">
                <option value="" disabled selected hidden>Choose facility type</option>
                <option value="Classroom">Classroom</option>
                <option value="Group Study Room">Group Study Room</option>
                <option value="Meeting Pod">Meeting Pod</option>
                <option value="Seminar Room">Seminar Room</option>
              </select>
              <svg class="select-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M6 9l6 6 6-6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div v-if="facilityError" class="error-message">
              <svg class="error-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
              </svg>
              {{ facilityError }}
            </div>
          </div>

          <!-- Room Number -->
          <div class="form-section">
            <label class="form-label">Room Number</label>
            <div class="select-wrapper">
              <select v-model="roomNumber" class="modern-select" :disabled="!isRoomDropdownEnabled">
                <option value="" disabled selected hidden>
                  {{ !isRoomDropdownEnabled ? 'Select building and facility first' : 'Choose room number' }}
                </option>
                <option v-for="room in availableRooms" :key="room" :value="room">
                  {{ room }}
                </option>
              </select>
              <svg class="select-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M6 9l6 6 6-6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div v-if="roomNumberError" class="error-message">
              <svg class="error-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
              </svg>
              {{ roomNumberError }}
            </div>
          </div>

          <!-- Date -->
          <div class="form-section">
            <label class="form-label">Delivery Date</label>
            <div class="input-wrapper">
              <input 
                type="date" 
                v-model="date" 
                :min="minDate"
                class="modern-input"
              />
            </div>
          </div>

          <!-- Time -->
          <div class="form-section">
            <label class="form-label">Delivery Time</label>
            <div class="select-wrapper">
              <select v-model="time" class="modern-select" :disabled="!date">
                <option value="" disabled selected hidden>
                  {{ !date ? 'Select a date first' : 'Choose delivery time' }}
                </option>
                <option 
                  v-for="slot in availableTimeSlots" 
                  :key="slot.value" 
                  :value="slot.value"
                >
                  {{ slot.label }}
                </option>
              </select>
              <svg class="select-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M6 9l6 6 6-6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div v-if="date && availableTimeSlots.length === 0" class="info-message">
              <svg class="info-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
              </svg>
              No available time slots today. Please select a future date.
            </div>
          </div>
        </div>

        <!-- Validation Error -->
        <transition name="slide-down">
          <div v-if="showValidationError" class="validation-banner">
            <svg class="warning-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
            </svg>
            <div class="banner-content">
              <h4>Incomplete Information</h4>
              <p>Please fill in all fields to continue with your order</p>
            </div>
          </div>
        </transition>

        <!-- Next Button -->
        <div class="button-wrapper">
          <button class="next-btn" @click="goToSummary">
            <span>Continue to Summary</span>
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
/* All previous styles remain the same */
/* Page Layout */
.select-location-page-wrapper {
  position: relative;
  width: 100vw;
  min-height: 100vh;
  background: var(--secondary-color);
  padding: 6rem 0 4rem;
}

.select-location-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 30px;
  font-family: var(--font-body);
  animation: fadeInUp 0.6s ease-out;
}

/* Form Container */
.delivery-form-container {
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

/* Form Header */
.form-header {
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

/* Form Grid */
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  margin-bottom: 32px;
}

/* Form Section */
.form-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.form-label {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 1rem;
  color: var(--text-color);
}

/* Select Wrapper */
.select-wrapper, .input-wrapper {
  position: relative;
}

.modern-select, .modern-input {
  width: 100%;
  padding: 14px 16px;
  border: 2px solid var(--text-color);
  border-radius: 12px;
  font-size: 1rem;
  font-family: var(--font-body);
  background: var(--secondary-color);
  color: var(--text-color);
  font-weight: 500;
  transition: all 0.3s ease;
  appearance: none;
  cursor: pointer;
}

.modern-select:focus, .modern-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(252, 188, 5, 0.2);
  background: var(--secondary-color);
}

.modern-select:hover:not(:disabled), .modern-input:hover {
  border-color: var(--primary-color);
}

.modern-select:disabled {
  background: #f5f5f0;
  color: #a0aec0;
  cursor: not-allowed;
  opacity: 0.6;
}

.select-icon {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  stroke: var(--text-color);
  pointer-events: none;
  transition: all 0.3s ease;
}

.modern-select:focus + .select-icon {
  stroke: var(--primary-color);
  transform: translateY(-50%) rotate(180deg);
}

/* Date Input Custom Styling */
.modern-input[type="date"]::-webkit-calendar-picker-indicator {
  cursor: pointer;
  filter: invert(0.2);
}

/* Error Message */
.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #c53030;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 8px 12px;
  background: #fff5f5;
  border: 1px solid #feb2b2;
  border-radius: 8px;
  font-family: var(--font-body);
}

.error-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

/* Info Message */
.info-message {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #2563eb;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 8px 12px;
  background: #dbeafe;
  border: 1px solid #93c5fd;
  border-radius: 8px;
  font-family: var(--font-body);
}

.info-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

/* Validation Banner */
.validation-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fff3cd;
  border: 2px solid var(--text-color);
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 24px;
}

.warning-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  fill: var(--text-color);
}

.banner-content h4 {
  font-family: var(--font-heading);
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-color);
  margin: 0 0 4px 0;
}

.banner-content p {
  font-family: var(--font-body);
  font-size: 0.9rem;
  color: var(--text-color);
  opacity: 0.8;
  margin: 0;
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
  .select-location-page {
    padding: 0 20px;
  }

  .delivery-form-container {
    padding: 30px 24px;
  }

  .page-title {
    font-size: 2rem;
  }

  .form-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
}

@media (max-width: 480px) {
  .delivery-form-container {
    padding: 24px 20px;
  }

  .page-title {
    font-size: 1.6rem;
  }

  .form-grid {
    gap: 16px;
  }

  .modern-select, .modern-input {
    padding: 12px 14px;
    font-size: 0.9rem;
  }

  .next-btn {
    width: 100%;
    padding: 16px 32px;
    font-size: 1rem;
  }
}
</style>