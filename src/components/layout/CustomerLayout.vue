<template>
  <div class="customer-layout">
    <CustomerHeader />
    <div class="customer-layout-content">
      <RouterView />
    </div>
    <AppToast />
  </div>
</template>

<script setup lang="ts">
import CustomerHeader from './CustomerHeader.vue'
import AppToast from '@/components/common/AppToast.vue'
</script>

<style scoped>
.customer-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-color, #f5f5f5);
}

.customer-layout-content {
  flex: 1;
  padding: 1rem;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
}

@media (min-width: 640px) {
  .customer-layout-content {
    padding: 1.5rem;
  }
}
</style>

