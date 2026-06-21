<template>
  <div class="customer-layout">
    <CustomerHeader />
    <div class="customer-layout-content">
      <slot />
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
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-color, #f5f5f5);
  overflow-x: hidden;
}

.customer-layout-content {
  flex: 1;
  padding: 0.75rem;
  padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
  overflow-x: hidden;
}

@media (min-width: 640px) {
  .customer-layout-content {
    padding: 1.25rem;
    padding-bottom: max(1.25rem, env(safe-area-inset-bottom));
  }
}

@media (min-width: 1024px) {
  .customer-layout-content {
    padding: 1.5rem;
    padding-bottom: max(1.5rem, env(safe-area-inset-bottom));
  }
}
</style>
