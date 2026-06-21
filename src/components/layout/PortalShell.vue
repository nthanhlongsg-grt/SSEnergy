<template>
  <customer-layout v-if="isCustomerRoute">
    <slot />
  </customer-layout>
  <admin-layout v-else>
    <slot />
  </admin-layout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import CustomerLayout from './CustomerLayout.vue'
import AdminLayout from './AdminLayout.vue'

const route = useRoute()
const isCustomerRoute = computed(() => route.path.startsWith('/customer'))
</script>
