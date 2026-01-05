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
 * GET the pending payment
 */
export const getPendingPayments = async(id) => {
  try {
    const response = await apiClient.get(`/api/payments/internal/pending`)
    return response.data
  } catch (error) {
    console.error(`Error fetching pending payments:`, error)
    throw error
  }
}

/**
 * GET the pending refund payment
 */
export const getPendingRefundPayments = async(id) => {
  try {
    const response = await apiClient.get(`/api/payments/internal/pending-refunds`)
    return response.data
  } catch (error) {
    console.error(`Error fetching pending refund payments:`, error)
    throw error
  }
}

/**
 * mark payments as refunded. takes in an array of order ids
 */
export const markRefunded = async(orderIds) => {
  try {
    const response = await apiClient.post(`/api/payments/internal/mark-refunded`, 
    {
      orderIds
    })
    return response.data
  } catch (error) {
    console.error(`Error marking payments as refunded: ${orderIds} \nReason:`, error)
    throw error
  }
}

/**
 * mark payments as verified. 
 */
export const markVerified = async(orderIds) => {
  try {
    const response = await apiClient.post(`/api/payments/internal/mark-verified`,
    {
      orderIds
    })
    return response.data
  } catch (error) {
    console.error(`Error marking payments as verified:${orderIds} \nReason:`, error)
    throw error
  }
}

export default {
  getPendingPayments,
  getPendingRefundPayments,
  markRefunded,
  markVerified
}