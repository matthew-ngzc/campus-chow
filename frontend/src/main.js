/**
 * REIWEN: 
 * This is the starting file when the Vue app runs. It is responsible for 
 *      1) creating the Vue app instance
 *      2) registering global plugins 
 *      3) mounting the app
 */

// to use bootstrap
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
// REIWEN: you import the router here so that your entire app is using the router instance you have created in the router directory
import router from './router'

const app = createApp(App)

app.use(createPinia()) // Pinia is to help the Vue instance for state management 
app.use(router)        // Help Vue instance for routing 

app.mount('#app')