import axios from 'axios'

// Configure your API base URL - adjust this to match your Kong gateway URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

// Add request interceptor for debugging and add JWT token
apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem("jwt_token");
    const protectedPaths = ["/api/orders", "/api/payments", "/api/users"];

    // Only add Authorization header for protected routes
    if (token && protectedPaths.some((path) => config.url.startsWith(path))) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('API Request:', config.method.toUpperCase(), config.url)
    return config
  },
  error => {
    console.error('API Request Error:', error)
    return Promise.reject(error)
  }
)

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  response => {
    console.log('API Response:', response.status, response.config.url)
    return response
  },
  error => {
    console.error('API Response Error:', error.response?.status, error.config?.url)
    return Promise.reject(error)
  }
)

/**
 * Fetch all parent merchants
 * Route: GET /api/merchants
 */
export const fetchParentMerchants = async () => {
  try {
    const response = await apiClient.get('/api/merchants')
    return response.data
  } catch (error) {
    console.error('Error fetching parent merchants:', error)
    throw error
  }
}

/**
 * Get merchant info by ID
 * Route: GET /api/merchants/:id
 */
export const getMerchantInfoById = async (merchantId) => {
  try {
    const response = await apiClient.get(`/api/merchants/${merchantId}`)
    return response.data
  } catch (error) {
    console.error(`Error fetching merchant ${merchantId}:`, error)
    throw error
  }
}

/**
 * Get child merchants (if parent has children)
 * This would need to be implemented on your backend
 * For now, assuming it follows the same pattern
 */
export const getChildMerchants = async (parentMerchantId) => {
  try {
    // Adjust this endpoint based on your actual backend implementation
    const response = await apiClient.get(`/api/merchants/${parentMerchantId}/children`)
    return response.data
  } catch (error) {
    console.error(`Error fetching child merchants for ${parentMerchantId}:`, error)
    throw error
  }
}

/**
 * Get menu items by merchant ID
 * Route: GET /api/merchants/:id/menu
 * @param {number} merchantId - The merchant ID
 * @param {boolean} includeUnavailable - Whether to include unavailable items (default: false)
 */
export const getMenuById = async (merchantId, includeUnavailable = false) => {
  try {
    // Add query parameter if we want to include unavailable items
    const url = includeUnavailable 
      ? `/api/merchants/${merchantId}/menu?includeUnavailable=true`
      : `/api/merchants/${merchantId}/menu`
    
    const response = await apiClient.get(url)
    return response.data
  } catch (error) {
    console.warn(`Backend menu not available for merchant ${merchantId}`)
    // Return empty array - no mock data
    return []
  }
}

/**
 * Create a new menu item for a merchant
 * Route: POST /api/merchants/:id/menu
 */
export const createMenuItem = async (merchantId, menuItem) => {
  try {
    const response = await apiClient.post(`/api/merchants/${merchantId}/menu`, menuItem)
    return response.data
  } catch (error) {
    console.error(`Error creating menu item for merchant ${merchantId}:`, error)
    throw error
  }
}

/**
 * Update an existing menu item
 * Route: PUT /api/merchants/:merchantId/menu/:menuItemId
 */
export const updateMenuItem = async (merchantId, menuItemId, menuItem) => {
  try {
    const response = await apiClient.put(`/api/merchants/${merchantId}/menu/${menuItemId}`, menuItem)
    return response.data
  } catch (error) {
    console.error(`Error updating menu item ${menuItemId}:`, error)
    throw error
  }
}

/**
 * Create an order (POST)
 */
export const createOrder = async(payload) => {
  try {
    const response = await apiClient.post('/api/orders', payload)
    return response.data
  } catch (error) {
    console.error(`Error creating order ${payload}:`, error)
    throw error
  }
}

// get user's active orders
export const getActiveOrders = async(userId, limit = 5, offset = 0) => {
  try {
    const response = await apiClient.get(`/api/orders/user/${userId}?type=active&limit=${limit}&offset=${offset}`)
    return response.data
  } catch (error) {
    console.error(`Error fetching active orders for userId ${userId}:`, error)
    throw error
  }
}

// get user's past orders
export const getPastOrders = async(userId, limit = 5, offset = 0) => {
    try {
    const response = await apiClient.get(`/api/orders/user/${userId}?type=history&limit=${limit}&offset=${offset}`)
    return response.data
  } catch (error) {
    console.error(`Error fetching past orders for userId ${userId}:`, error)
    throw error
  }
}

/**
 * Update payment status on screenshot submission
 */
export const updateOrderStatusAwaitingVerification = async(id) => {
  try {
    const response = await apiClient.put(`/api/orders/${id}/order-status`, { 
      status: 'awaiting_verification'
    })
    return response.data
  } catch (error) {
    console.error(`Error updating status to awaiting_verification for order ${id}:`, error)
    throw error
  }
}

/**
 * refresh order status
 */
export const refreshOrderStatus = async(orderId) => {
  try {
    const response = await apiClient.get(`/api/orders/${orderId}/order-status`)
    return response.data
  } catch (error) {
    console.error(`Error fetching status for order ${orderId}:`, error)
    throw error
  }
}


/**
 * GET the payment info
 */
export const getPaymentInfo = async(id) => {
  try {
    const response = await apiClient.get(`/api/payments/${id}`)
    return response.data
  } catch (error) {
    console.error(`Error fetching payment info for order ${id}:`, error)
    throw error
  }
}

/**
 * Delete a menu item - NOT IMPLEMENTED YET
 * Route: DELETE /api/merchants/:merchantId/menu/:menuItemId
 * This endpoint needs to be added to kong.yml before it can be used
 */
// export const deleteMenuItem = async (merchantId, menuItemId) => {
//   try {
//     const response = await apiClient.delete(`/api/merchants/${merchantId}/menu/${menuItemId}`)
//     return response.data
//   } catch (error) {
//     console.error(`Error deleting menu item ${menuItemId}:`, error)
//     throw error
//   }
// }

export default {
  fetchParentMerchants,
  getMerchantInfoById,
  getMenuById,
  getChildMerchants,
  createMenuItem,
  updateMenuItem,
  createOrder,
  getActiveOrders,
  getPastOrders,
  getPaymentInfo,
  updateOrderStatusAwaitingVerification,
  refreshOrderStatus
  // deleteMenuItem - not available yet
}