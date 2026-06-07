<template>
  <admin-layout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />

    <div
      class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6"
    >
      <div class="max-w-2xl mx-auto">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Hỗ trợ
        </h1>

        <div class="space-y-6">
          <div class="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-6">
            <h2 class="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-4">
              Thông tin liên hệ hỗ trợ
            </h2>
            <div class="space-y-3">
              <div class="flex items-start gap-3">
                <svg class="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <div>
                  <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Liên hệ</p>
                  <p class="text-base font-semibold text-gray-900 dark:text-white">Thành Long</p>
                </div>
              </div>

              <div class="flex items-start gap-3">
                <svg class="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <div>
                  <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Số điện thoại</p>
                  <a href="tel:0961481195" class="text-base font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
                    0961481195
                  </a>
                </div>
              </div>

              <div class="flex items-start gap-3">
                <svg class="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <div>
                  <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Email</p>
                  <a href="mailto:nguyenthanhlong@SGE.com" class="text-base font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
                    nguyenthanhlong@SGE.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div class="rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-6">
            <h3 class="text-md font-semibold text-gray-900 dark:text-white mb-3">
              Bạn cần hỗ trợ gì?
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Nếu bạn gặp vấn đề hoặc có câu hỏi về hệ thống, vui lòng liên hệ với chúng tôi qua số điện thoại hoặc email bên trên. Chúng tôi sẽ hỗ trợ bạn trong thời gian sớm nhất.
            </p>
          </div>
        </div>
      </div>
    </div>
  </admin-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'

const currentPageTitle = ref('Hỗ trợ')
</script>

