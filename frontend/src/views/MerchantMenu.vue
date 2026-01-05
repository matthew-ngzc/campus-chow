<script lang="js">
import { defineComponent, ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { 
  getMenuById, 
  createMenuItem, 
  updateMenuItem
  // deleteMenuItem // Not implemented yet - no DELETE route 
} from '@/services/orderFoodService'

export default defineComponent({
  name: 'MerchantMenu',
  setup() {
    const route = useRoute()
    // ✅ UPDATED: Get merchantId from route params
    const merchantId = ref(route.params.merchantId || localStorage.getItem('merchant_id'))
    const menuItems = ref([])
    const isLoading = ref(false)
    const error = ref(null)
    const showAddForm = ref(false)
    const editingItem = ref(null)
    const uploadingImage = ref(false) // ✅ NEW: Track image upload state
    
    // Form data for new/edit item
    const formData = ref({
      name: '',
      description: '',
      priceCents: '',
      imageUrl: '',
      type: 'food',
      availabilityStatus: 'available'
    })

    // ✅ UPDATED: Image upload handling with Base64 conversion
    const handleImageUpload = async (event) => {
      const file = event.target.files[0]
      if (!file) return

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file')
        return
      }

      // Validate file size (max 2MB for Base64)
      const maxSize = 2 * 1024 * 1024 // 2MB
      if (file.size > maxSize) {
        alert('Image size must be less than 2MB')
        return
      }

      uploadingImage.value = true
      
      try {
        // Convert image to Base64
        const base64 = await convertToBase64(file)
        formData.value.imageUrl = base64
        console.log('Image converted to Base64 successfully')
      } catch (err) {
        console.error('Failed to convert image:', err)
        alert('Failed to process image. Please try again.')
      } finally {
        uploadingImage.value = false
      }
    }

    // ✅ NEW: Helper function to convert file to Base64
    const convertToBase64 = (file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => resolve(reader.result)
        reader.onerror = (error) => reject(error)
      })
    }

    // Load menu items
    const loadMenuItems = async () => {
      isLoading.value = true
      error.value = null
      
      try {
        // Pass true to include unavailable items for merchant management
        const response = await getMenuById(merchantId.value, true)
        // Handle both direct array and wrapped response
        menuItems.value = Array.isArray(response) ? response : (response.data || [])
        // Don't filter out unavailable items - merchants should see everything
        console.log('Loaded menu items (including unavailable):', menuItems.value)
      } catch (err) {
        console.error('Failed to load menu items:', err)
        error.value = 'Failed to load menu items'
        menuItems.value = []
      } finally {
        isLoading.value = false
      }
    }

    // Create new menu item
    const handleCreateItem = async () => {
      if (!validateForm()) return
      
      isLoading.value = true
      error.value = null
      
      try {
        const newItem = {
          name: formData.value.name,
          description: formData.value.description,
          priceCents: parseInt(formData.value.priceCents),
          imageUrl: formData.value.imageUrl || '', // ✅ Will be Base64 string or empty
          type: formData.value.type,
          availabilityStatus: formData.value.availabilityStatus
        }
        
        console.log('Creating menu item:', newItem)
        
        await createMenuItem(merchantId.value, newItem)
        await loadMenuItems() // Reload the list
        resetForm()
        showAddForm.value = false
        alert('Menu item created successfully!')
      } catch (err) {
        console.error('Failed to create menu item:', err)
        
        // More specific error messages
        if (err.message?.includes('Network')) {
          error.value = 'Network error: Please check if the menu service is running on port 8083'
        } else if (err.response?.status === 404) {
          error.value = 'API endpoint not found. Please check the route configuration.'
        } else if (err.response?.status === 500) {
          error.value = 'Server error. Please check the backend logs.'
        } else {
          error.value = `Failed to create menu item: ${err.message || 'Unknown error'}`
        }
      } finally {
        isLoading.value = false
      }
    }

    // Update menu item
    const handleUpdateItem = async () => {
      if (!validateForm()) return
      if (!editingItem.value) return
      
      isLoading.value = true
      error.value = null
      
      try {
        const updatedItem = {
          name: formData.value.name,
          description: formData.value.description,
          priceCents: parseInt(formData.value.priceCents),
          imageUrl: formData.value.imageUrl, // ✅ Will be Base64 string or URL
          type: formData.value.type,
          availabilityStatus: formData.value.availabilityStatus
        }
        
        await updateMenuItem(merchantId.value, editingItem.value.menuItemId, updatedItem)
        await loadMenuItems() // Reload the list
        cancelEdit()
        alert('Menu item updated successfully!')
      } catch (err) {
        console.error('Failed to update menu item:', err)
        error.value = 'Failed to update menu item'
      } finally {
        isLoading.value = false
      }
    }

    // Delete menu item - DISABLED for now
    // const handleDeleteItem = async (item) => {
    //   if (!confirm(`Are you sure you want to delete "${item.name}"?`)) return
    //   
    //   isLoading.value = true
    //   error.value = null
    //   
    //   try {
    //     await deleteMenuItem(merchantId.value, item.menuItemId)
    //     await loadMenuItems() // Reload the list
    //     alert('Menu item deleted successfully!')
    //   } catch (err) {
    //     console.error('Failed to delete menu item:', err)
    //     error.value = 'Failed to delete menu item'
    //   } finally {
    //     isLoading.value = false
    //   }
    // }

    // Start editing an item
    const startEdit = (item) => {
      editingItem.value = item
      formData.value = {
        name: item.name,
        description: item.description,
        priceCents: item.priceCents.toString(),
        imageUrl: item.imageUrl,
        type: item.type || 'food',
        availabilityStatus: item.availabilityStatus || 'available'
      }
      showAddForm.value = true
    }

    // Cancel editing
    const cancelEdit = () => {
      editingItem.value = null
      resetForm()
      showAddForm.value = false
    }

    // Validate form
    const validateForm = () => {
      if (!formData.value.name || !formData.value.description || !formData.value.priceCents) {
        alert('Please fill in all required fields')
        return false
      }
      
      if (isNaN(parseInt(formData.value.priceCents)) || parseInt(formData.value.priceCents) < 0) {
        alert('Price must be a valid positive number (in cents)')
        return false
      }
      
      return true
    }

    // Reset form
    const resetForm = () => {
      formData.value = {
        name: '',
        description: '',
        priceCents: '',
        imageUrl: '',
        type: 'food',
        availabilityStatus: 'available'
      }
      editingItem.value = null
    }

    // Toggle availability status
    const toggleAvailability = async (item) => {
      const newStatus = item.availabilityStatus === 'available' ? 'unavailable' : 'available'
      
      try {
        await updateMenuItem(merchantId.value, item.menuItemId, {
          ...item,
          availabilityStatus: newStatus
        })
        await loadMenuItems()
      } catch (err) {
        console.error('Failed to toggle availability:', err)
        error.value = 'Failed to update availability status'
      }
    }

    onMounted(async () => {
      loadMenuItems()
    })

    return {
      menuItems,
      isLoading,
      error,
      showAddForm,
      editingItem,
      formData,
      uploadingImage, // ✅ NEW: Expose upload state
      handleImageUpload,
      handleCreateItem,
      handleUpdateItem,
      // handleDeleteItem, // Disabled for now
      startEdit,
      cancelEdit,
      resetForm,
      toggleAvailability
    }
  }
})
</script>

<template>
  <div class="merchant-menu-wrapper">
    <div class="merchant-menu-page">
      
      <!-- Header -->
      <div class="page-header">
        <h1 class="page-title">Manage Menu Items</h1>
        <button 
          v-if="!showAddForm"
          @click="showAddForm = true" 
          class="add-button"
        >
          + Add New Item
        </button>
      </div>

      <!-- Error Display -->
      <div v-if="error" class="error-banner">
        <strong>Error:</strong> {{ error }}
        <button @click="error = null" class="close-error">×</button>
      </div>

      <!-- Add/Edit Form -->
      <transition name="slide-down">
        <div v-if="showAddForm" class="form-card">
          <h2 class="form-title">
            {{ editingItem ? 'Edit Menu Item' : 'Create New Menu Item' }}
          </h2>
          
          <form @submit.prevent="editingItem ? handleUpdateItem() : handleCreateItem()">
            <div class="form-grid">
              <div class="form-group">
                <label>Name *</label>
                <input 
                  v-model="formData.name" 
                  type="text" 
                  placeholder="e.g., Teh-O"
                  required
                />
              </div>
              
              <div class="form-group">
                <label>Price (cents) *</label>
                <input 
                  v-model="formData.priceCents" 
                  type="number" 
                  placeholder="e.g., 600 for $6.00"
                  required
                />
              </div>
              
              <div class="form-group full-width">
                <label>Description *</label>
                <textarea 
                  v-model="formData.description" 
                  rows="3" 
                  placeholder="Describe your menu item..."
                  required
                ></textarea>
              </div>
              
              <div class="form-group">
                <label>Type</label>
                <select v-model="formData.type">
                  <option value="food">Food</option>
                  <option value="drink">Drink</option>
                  <option value="dessert">Dessert</option>
                  <option value="snack">Snack</option>
                </select>
              </div>
              
              <div class="form-group">
                <label>Availability</label>
                <select v-model="formData.availabilityStatus">
                  <option value="available">Available</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </div>
              
              <!-- ✅ UPDATED: Image upload with Base64 support -->
              <div class="form-group full-width">
                <label>Image Upload (Optional)</label>
                <div class="upload-wrapper">
                  <input 
                    id="image-upload" 
                    type="file" 
                    accept="image/*"
                    @change="handleImageUpload"
                    :disabled="uploadingImage"
                    class="styled-file-input"
                  />
                  <span v-if="uploadingImage" class="upload-status">Processing...</span>
                </div>
                <!-- ✅ NEW: Show preview if image exists -->
                <div v-if="formData.imageUrl" class="image-preview">
                  <img :src="formData.imageUrl" alt="Preview" />
                  <button 
                    type="button" 
                    @click="formData.imageUrl = ''" 
                    class="remove-image"
                  >
                    Remove Image
                  </button>
                </div>
              </div>
            </div>

            <div class="form-actions">
              <button 
                type="button" 
                @click="cancelEdit" 
                class="cancel-button"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                class="submit-button"
                :disabled="isLoading || uploadingImage"
              >
                {{ isLoading ? 'Saving...' : (editingItem ? 'Update Item' : 'Create Item') }}
              </button>
            </div>
          </form>
        </div>
      </transition>

      <!-- Loading State -->
      <div v-if="isLoading && !showAddForm" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading menu items...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="!isLoading && menuItems.length === 0" class="empty-state">
        <h3>No Menu Items Yet</h3>
        <p>Click "Add New Item" to create your first menu item</p>
      </div>

      <!-- Menu Grid -->
      <div v-else class="menu-grid">
        <div 
          v-for="item in menuItems" 
          :key="item.menuItemId"
          class="menu-item"
          :class="{ 'unavailable-item': item.availabilityStatus === 'unavailable' }"
        >
          <div class="item-image-container">
            <img 
              v-if="item.imageUrl" 
              :src="item.imageUrl" 
              :alt="item.name"
              class="menu-image"
            />
            <div v-else class="no-image-placeholder">
              No Image
            </div>
            <span 
              class="availability-badge"
              :class="item.availabilityStatus"
            >
              {{ item.availabilityStatus }}
            </span>
          </div>

          <div class="item-content">
            <div class="item-header">
              <h3 class="item-name">{{ item.name }}</h3>
              <p class="item-price">${{ (item.priceCents / 100).toFixed(2) }}</p>
            </div>

            <p class="item-description">{{ item.description }}</p>
            <p class="item-type">Type: {{ item.type }}</p>

            <div class="item-actions">
              <button 
                @click="startEdit(item)" 
                class="edit-button"
              >
                Edit
              </button>
              <button 
                @click="toggleAvailability(item)" 
                class="toggle-button"
              >
                {{ item.availabilityStatus === 'available' ? 'Mark Unavailable' : 'Mark Available' }}
              </button>
              <!-- Delete button disabled until backend supports it -->
              <!-- <button 
                @click="handleDeleteItem(item)" 
                class="delete-button"
              >
                Delete
              </button> -->
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* All existing styles remain the same */
.merchant-menu-wrapper {
  min-height: 100vh;
  background: var(--primary-color);
  padding: 40px 20px;
}

.merchant-menu-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 40px;
}

/* Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
  padding-bottom: 24px;
  border-bottom: 3px solid var(--text-color);
}

.page-title {
  font-family: var(--font-heading);
  font-size: 2.8rem;
  font-weight: 900;
  color: var(--text-color);
  margin: 0;
}

.add-button {
  padding: 14px 32px;
  background: var(--text-color);
  color: var(--primary-color);
  border: 2px solid var(--text-color);
  border-radius: 12px;
  font-family: var(--font-heading);
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
}

.add-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(34, 32, 30, 0.3);
}

/* Error Banner */
.error-banner {
  background: #ffebee;
  border: 2px solid #f44336;
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 24px;
  color: #c62828;
  font-weight: 600;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.close-error {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #c62828;
  cursor: pointer;
  padding: 0;
  margin: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Form Card */
.form-card {
  background: var(--tertiary-color);
  border: 2px solid var(--text-color);
  border-radius: 20px;
  padding: 32px;
  margin-bottom: 40px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.form-title {
  font-family: var(--font-heading);
  font-size: 2rem;
  font-weight: 800;
  color: var(--text-color);
  margin-bottom: 24px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  font-family: var(--font-body);
  font-weight: 600;
  color: var(--text-color);
  font-size: 1rem;
}

.form-group input,
.form-group textarea,
.form-group select {
  font-family: var(--font-body);
  padding: 12px 16px;
  border: 2px solid var(--text-color);
  border-radius: 8px;
  font-size: 1rem;
  background: var(--secondary-color);
  color: var(--text-color);
  transition: all 0.3s ease;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(252, 188, 5, 0.2);
}

/* File input wrapper */
.upload-wrapper {
  position: relative;
  display: inline-block;
  width: 100%;
}

/* Styled file input - make it visible and attractive */
.styled-file-input {
  display: block !important;
  width: 100% !important;
  padding: 12px 16px !important;
  border: 2px solid #22201E !important;
  border-radius: 8px !important;
  background: #F5E6D3 !important;
  color: #22201E !important;
  font-family: inherit !important;
  font-size: 0.95rem !important;
  cursor: pointer !important;
  transition: all 0.3s ease !important;
}

.styled-file-input:hover:not(:disabled) {
  background: #E8D5B7 !important;
  transform: translateY(-2px) !important;
  box-shadow: 0 4px 12px rgba(34, 32, 30, 0.15) !important;
}

.styled-file-input:disabled {
  opacity: 0.6 !important;
  cursor: not-allowed !important;
}

.styled-file-input::file-selector-button {
  padding: 8px 16px !important;
  margin-right: 12px !important;
  border: 2px solid #22201E !important;
  border-radius: 6px !important;
  background: #22201E !important;
  color: #FCBC05 !important;
  font-weight: 700 !important;
  cursor: pointer !important;
  transition: all 0.3s ease !important;
}

.styled-file-input::file-selector-button:hover {
  transform: translateY(-1px) !important;
  box-shadow: 0 2px 8px rgba(34, 32, 30, 0.3) !important;
}

.upload-status {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #22201E;
  font-weight: 600;
  font-size: 0.9rem;
}

/* ✅ NEW: Image preview styles */
.image-preview {
  margin-top: 16px;
  position: relative;
  display: inline-block;
}

.image-preview img {
  max-width: 200px;
  max-height: 200px;
  border-radius: 8px;
  border: 2px solid var(--text-color);
  display: block;
}

.remove-image {
  margin-top: 8px;
  padding: 6px 12px;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 6px;
  font-family: var(--font-body);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.remove-image:hover {
  background: #d32f2f;
  transform: translateY(-1px);
}

.form-actions {
  display: flex;
  gap: 16px;
  justify-content: flex-end;
}

.cancel-button,
.submit-button {
  padding: 12px 32px;
  border: 2px solid var(--text-color);
  border-radius: 12px;
  font-family: var(--font-heading);
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-button {
  background: transparent;
  color: var(--text-color);
}

.submit-button {
  background: var(--text-color);
  color: var(--primary-color);
}

.submit-button:hover:not(:disabled),
.cancel-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(34, 32, 30, 0.3);
}

.submit-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Menu Grid */
.menu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.menu-item {
  background: var(--tertiary-color);
  border-radius: 20px;
  padding: 20px;
  border: 2px solid var(--text-color);
  transition: all 0.3s ease;
}

.menu-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(34, 32, 30, 0.15);
}

.item-image-container {
  position: relative;
  width: 100%;
  height: 200px;
  border-radius: 16px;
  overflow: hidden;
  background: var(--secondary-color);
  border: 1px solid var(--text-color);
  margin-bottom: 16px;
}

.menu-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  color: #999;
  font-family: var(--font-body);
  font-size: 1.1rem;
  font-weight: 500;
}

.availability-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 6px 14px;
  background: #4caf50;
  color: white;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.availability-badge.unavailable {
  background: #f44336;
}

/* Add visual overlay for unavailable items */
.menu-item.unavailable-item {
  opacity: 0.9;
}

.menu-item.unavailable-item .item-image-container::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 16px;
  pointer-events: none;
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
}

.item-description {
  font-family: var(--font-body);
  font-size: 0.95rem;
  color: var(--text-color);
  opacity: 0.7;
  margin: 0;
  line-height: 1.5;
}

.item-type {
  font-family: var(--font-body);
  font-size: 0.9rem;
  color: var(--text-color);
  opacity: 0.6;
  text-transform: capitalize;
}

.item-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.edit-button,
.toggle-button,
.delete-button {
  padding: 8px 16px;
  border: 2px solid var(--text-color);
  border-radius: 8px;
  font-family: var(--font-body);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.edit-button {
  background: var(--primary-color);
  color: var(--text-color);
}

.toggle-button {
  background: transparent;
  color: var(--text-color);
}

.delete-button {
  background: #f44336;
  color: white;
  border-color: #f44336;
}

.edit-button:hover,
.toggle-button:hover,
.delete-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

/* Loading State */
.loading-state {
  text-align: center;
  padding: 80px 20px;
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

/* Empty State */
.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: var(--text-color);
}

.empty-state h3 {
  font-family: var(--font-heading);
  font-size: 1.8rem;
  margin-bottom: 12px;
}

.empty-state p {
  font-family: var(--font-body);
  font-size: 1.1rem;
  opacity: 0.8;
}

/* Error State */
.error-state {
  background: #ffebee;
  border: 2px solid #f44336;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
  color: #c62828;
  font-weight: 600;
}

/* Animations */
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

/* Responsive */
@media (max-width: 768px) {
  .merchant-menu-page {
    padding: 0 20px;
  }
  
  .page-header {
    flex-direction: column;
    gap: 20px;
    align-items: stretch;
  }
  
  .page-title {
    font-size: 2rem;
    text-align: center;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .menu-grid {
    grid-template-columns: 1fr;
  }
  
  .item-actions {
    flex-direction: column;
  }
}
</style>