/*
 * Why do we need a src/stores/cart.js ?
 * ANS: Our app has multiple pages: 
 *      - Menu page
 *      - Cart Page
 *      - Confirmation/Payment page
 *     Hence we need a single source of truth to 
 *      - Remember what the user added to cart
 *      - Share that cart state across multiple pages/components
 *      - Allow updates/removals from anywhere
 */ 

import { defineStore } from 'pinia'

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: []  // Each item = { id, name, quantity, price }
  }),
  actions: { // Actions are methods you define to modify the state 

    /* 
     * Check if the item already exists in the cart by comparing id. If exist, increase quantity by new amount. Else, add it 
     */ 
    addItem(item) {
      const existing = this.items.find(i => i.id === item.id)
      if (existing) {
        existing.quantity += item.quantity
      } else {
        this.items.push({ ...item })
      }
    },

    /* 
     * This method directly sets the quantity of a specific item in the cart based on id
     */ 
    updateQuantity(id, quantity) {
      const item = this.items.find(i => i.id === id)
      if (item) item.quantity = quantity
    },

    /* 
     * Replaces the current cart with an entirely new one. 
     * Useful when importing a cart from another page (e.g. from checkout setup).
     */ 
    setCart(newCart) {
      this.items = newCart
    },

    /* 
     * Clears the cart — used after order confirmation, user logout, etc.
     */ 
    clearCart() {
      this.items = []
    }
  }
})
