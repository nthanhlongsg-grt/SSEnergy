import './assets/main.css'
// Import Swiper styles
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import 'jsvectormap/dist/jsvectormap.css'
import 'flatpickr/dist/flatpickr.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import VueApexCharts from 'vue3-apexcharts'
import { initAuth } from './composables/useAuth'
import i18n from './plugins/i18n'

const app = createApp(App)

app.use(router)
app.use(VueApexCharts)
app.use(i18n)

// Initialize authentication and mount app
// Note: initAuth is also called in router to ensure it completes before navigation
initAuth().then(() => {
  app.mount('#app')
}).catch((error) => {
  console.error('Error initializing auth:', error)
  app.mount('#app')
})
