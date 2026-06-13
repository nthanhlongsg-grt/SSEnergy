<template>
  <admin-layout>
    <div class="px-4 sm:px-0 space-y-4 sm:space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {{ t('users.management.header.title') }}
          </h1>
          <p class="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">
            {{ t('users.management.header.subtitle') }}
          </p>
        </div>
        <div class="hidden md:flex flex-wrap gap-2">
          <button
            v-if="hasPermission(Permission.CREATE_USER)"
            @click="showImportModal = true"
            class="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors touch-manipulation min-h-[44px]"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span>{{ t('users.management.actions.importCSV') }}</span>
          </button>
          <button
            v-if="hasPermission(Permission.CREATE_USER)"
            @click="downloadCSVTemplate"
            class="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 active:bg-purple-800 transition-colors touch-manipulation min-h-[44px]"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>{{ t('users.management.actions.downloadTemplate') }}</span>
          </button>
          <button
            v-if="hasPermission(Permission.CREATE_USER)"
            @click="openAddModal"
            class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors touch-manipulation min-h-[44px]"
          >
            <PlusIcon class="h-5 w-5" />
            <span>{{ t('users.management.actions.createNew') }}</span>
          </button>
        </div>
        <!-- Mobile: Only Create New Button -->
        <div class="md:hidden">
          <button
            v-if="hasPermission(Permission.CREATE_USER)"
            @click="openAddModal"
            class="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors touch-manipulation min-h-[44px]"
          >
            <PlusIcon class="h-5 w-5" />
            <span>{{ t('users.management.actions.createNew') }}</span>
          </button>
        </div>
      </div>

      <!-- Error Message -->
      <div
        v-if="error"
        class="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 sm:p-4"
      >
        <p class="text-sm sm:text-base text-red-800 dark:text-red-200">{{ error }}</p>
      </div>

      <!-- Loading State -->
      <div v-if="loading && users.length === 0" class="flex justify-center items-center py-12">
        <div class="text-sm sm:text-base text-gray-500 dark:text-gray-400">{{ t('users.management.table.loading') }}</div>
      </div>

      <!-- Stats Cards -->
      <div v-if="!loading || users.length > 0" class="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4">
        <div
          class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 sm:p-4 shadow-sm"
        >
          <div class="flex items-center justify-between">
            <div class="flex-1 min-w-0">
              <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">{{ t('users.management.stats.totalUsers') }}</p>
              <p class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {{ stats.total }}
              </p>
            </div>
            <UserGroupIcon class="h-8 w-8 sm:h-10 sm:w-10 text-blue-500 flex-shrink-0 ml-2" />
          </div>
        </div>
        <div
          v-for="role in roleStats"
          :key="role.role"
          class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 sm:p-4 shadow-sm"
        >
          <div class="flex items-center justify-between">
            <div class="flex-1 min-w-0">
              <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                {{ getRoleLabel(role.role) }}
              </p>
              <p class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {{ role.count }}
              </p>
            </div>
            <UserCircleIcon class="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 ml-2" :class="getRoleColor(role.role)" />
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div
        class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 sm:p-4 shadow-sm"
      >
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ t('users.management.filters.search') }}
            </label>
            <input
              v-model="filters.search"
              type="text"
              :placeholder="t('users.management.filters.searchPlaceholder')"
              class="w-full px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white touch-manipulation min-h-[44px] sm:min-h-0 text-base sm:text-sm"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ t('users.management.filters.role') }}
            </label>
            <select
              v-model="filters.role"
              class="w-full px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white touch-manipulation min-h-[44px] sm:min-h-0 text-base sm:text-sm"
            >
              <option value="">{{ t('users.management.filters.all') }}</option>
              <option value="admin">{{ t('users.management.roleOptions.admin') }}</option>
              <option v-if="isDevUser" value="dev">{{ t('users.management.roleOptions.dev') }}</option>
              <option value="service_center">{{ t('users.management.roleOptions.serviceCenter') }}</option>
              <option value="technician">{{ t('users.management.roleOptions.technician') }}</option>
              <option value="accounting">{{ t('users.management.roleOptions.accounting') }}</option>
              <option value="distributor">{{ t('users.management.roleOptions.distributor') }}</option>
              <option value="end_user">{{ t('users.management.roleOptions.endUser') }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ t('users.management.filters.status') }}
            </label>
            <select
              v-model="filters.status"
              class="w-full px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white touch-manipulation min-h-[44px] sm:min-h-0 text-base sm:text-sm"
            >
              <option value="">{{ t('users.management.filters.all') }}</option>
              <option value="active">{{ t('users.management.statusOptions.active') }}</option>
              <option value="inactive">{{ t('users.management.statusOptions.inactive') }}</option>
              <option value="suspended">{{ t('users.management.statusOptions.suspended') }}</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Users Table - Desktop View -->
      <div
        class="hidden md:block rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden"
      >
        <div class="overflow-x-auto overflow-y-auto max-h-[600px]">
          <table class="w-full min-w-[760px]">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  {{ t('users.management.table.user') }}
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  {{ t('users.management.table.email') }}
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  {{ t('users.management.table.role') }}
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  {{ t('users.management.table.organization') }}
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  {{ t('users.management.table.status') }}
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  {{ t('users.management.table.createdDate') }}
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  {{ t('users.management.table.actions') }}
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr
                v-for="user in filteredUsers"
                :key="user.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div
                      class="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3"
                    >
                      <span class="text-blue-600 dark:text-blue-400 font-bold">
                        {{ user.name.charAt(0) }}
                      </span>
                    </div>
                    <div>
                      <p class="text-sm font-medium text-gray-900 dark:text-white">
                        {{ user.name }}
                      </p>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-[200px]">
                  <span class="block truncate" :title="user.email">{{ user.email }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="[
                      'px-2 py-1 text-xs font-semibold rounded-full',
                      getRoleClass(user.role),
                    ]"
                  >
                    {{ getRoleLabel(user.role) }}
                  </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-[160px]">
                  <span class="block truncate" :title="user.organization || ''">{{ user.organization || t('common.na') }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="[
                      'px-2 py-1 text-xs font-semibold rounded-full',
                      getStatusClass(user.status),
                    ]"
                  >
                    {{ getStatusLabel(user.status) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {{ formatDate(user.created_at) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm" @click.stop>
                  <div class="flex gap-2">
                    <button
                      v-if="hasPermission(Permission.EDIT_USER)"
                      @click="editUser(user.id)"
                      class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                    >
                      {{ t('users.management.table.edit') }}
                    </button>
                    <button
                      v-if="hasPermission(Permission.DELETE_USER) && user.id !== currentUserId"
                      @click="deleteUser(user.id)"
                      class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 font-medium"
                    >
                      {{ t('users.management.table.delete') }}
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="filteredUsers.length === 0">
                <td colspan="7" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  {{ t('users.management.table.noUsers') }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Mobile Card View -->
      <div class="md:hidden space-y-3">
        <!-- Loading State -->
        <div v-if="loading && users.length === 0" class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 text-center text-gray-500 dark:text-gray-400">
          {{ t('users.management.table.loading') }}
        </div>

        <!-- Empty State -->
        <div v-else-if="filteredUsers.length === 0" class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 text-center text-gray-500 dark:text-gray-400">
          {{ t('users.management.table.noUsers') }}
        </div>

        <!-- User Cards -->
        <div
          v-for="user in filteredUsers"
          :key="user.id"
          class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm active:bg-gray-50 dark:active:bg-gray-700 touch-manipulation"
        >
          <!-- Header: Avatar, Name, Code -->
          <div class="flex items-center gap-3 mb-3">
            <div
              class="h-12 w-12 flex-shrink-0 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center"
            >
              <span class="text-blue-600 dark:text-blue-400 font-bold text-lg">
                {{ user.name.charAt(0) }}
              </span>
            </div>
            <div class="min-w-0 flex-1">
              <h3 class="font-semibold text-gray-900 dark:text-white text-base truncate">
                {{ user.name }}
              </h3>
              <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
                {{ user.code || t('common.na') }}
              </p>
            </div>
          </div>

          <!-- Email -->
          <div class="mb-3 flex items-center gap-2">
            <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <p class="text-xs text-gray-500 dark:text-gray-400 truncate flex-1">
              {{ user.email }}
            </p>
          </div>

          <!-- Role and Status -->
          <div class="mb-3 flex items-center gap-2 flex-wrap">
            <span
              :class="[
                'px-2 py-1 text-xs font-semibold rounded-full',
                getRoleClass(user.role),
              ]"
            >
              {{ getRoleLabel(user.role) }}
            </span>
            <span
              :class="[
                'px-2 py-1 text-xs font-semibold rounded-full',
                getStatusClass(user.status),
              ]"
            >
              {{ getStatusLabel(user.status) }}
            </span>
          </div>

          <!-- Organization -->
          <div v-if="user.organization" class="mb-3 flex items-center gap-2">
            <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <p class="text-xs text-gray-500 dark:text-gray-400 truncate flex-1">
              {{ user.organization }}
            </p>
          </div>

          <!-- Created Date -->
          <div class="mb-3 flex items-center gap-2">
            <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p class="text-xs text-gray-500 dark:text-gray-400">{{ t('users.management.table.createdDate') }}</p>
            <p class="text-xs text-gray-900 dark:text-white">{{ formatDate(user.created_at) }}</p>
          </div>

          <!-- Footer: Actions -->
          <div class="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700" @click.stop>
            <button
              v-if="hasPermission(Permission.EDIT_USER)"
              @click="editUser(user.id)"
              class="flex-1 px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 touch-manipulation min-h-[32px] flex items-center justify-center"
            >
              {{ t('users.management.table.edit') }}
            </button>
            <button
              v-if="hasPermission(Permission.DELETE_USER) && user.id !== currentUserId"
              @click="deleteUser(user.id)"
              class="flex-1 px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 touch-manipulation min-h-[32px] flex items-center justify-center"
            >
              {{ t('users.management.table.delete') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Edit User Modal -->
      <div
        v-if="showEditModal"
        class="fixed inset-0 z-50 flex items-start justify-center bg-gray-700/45 dark:bg-gray-900/65 overflow-y-auto pt-4 sm:pt-8 pb-4 sm:pb-8"
        @click.self="closeEditModal"
      >
        <div
          class="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-lg shadow-xl w-full max-w-2xl mx-4 my-4 sm:my-8 max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-4rem)] overflow-hidden flex flex-col"
        >
          <div class="p-4 sm:p-6 overflow-y-auto flex-1">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-base sm:text-2xl font-bold text-gray-900 dark:text-white">
                {{ editingUser?.id ? t('users.management.modal.titleEdit') : t('users.management.modal.titleCreate') }}
              </h2>
              <button
                @click="closeEditModal"
                class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form @submit.prevent="saveUser">
              <!-- Error Message -->
              <div v-if="error" class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p class="text-sm text-red-800 dark:text-red-200">{{ error }}</p>
              </div>
              
              <!-- Success Message -->
              <div v-if="successMessage" class="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p class="text-sm text-green-800 dark:text-green-200">{{ successMessage }}</p>
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {{ t('users.management.modal.name') }} <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="userForm.name"
                    type="text"
                    required
                    class="w-full px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white touch-manipulation min-h-[44px] sm:min-h-0 text-base sm:text-sm"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {{ t('users.management.modal.email') }} <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="userForm.email"
                    type="email"
                    required
                    class="w-full px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white touch-manipulation min-h-[44px] sm:min-h-0 text-base sm:text-sm"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {{ t('users.management.modal.role') }} <span class="text-red-500">*</span>
                  </label>
                  <select
                    v-model="userForm.role"
                    required
                    class="w-full px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white touch-manipulation min-h-[44px] sm:min-h-0 text-base sm:text-sm"
                  >
                    <option value="">{{ t('users.management.roleOptions.selectRole') }}</option>
                    <option value="admin">{{ t('users.management.roleOptions.admin') }}</option>
                    <option
                      v-if="isDevUser"
                      value="dev"
                    >
                      {{ t('users.management.roleOptions.dev') }}
                    </option>
                    <option value="service_center">{{ t('users.management.roleOptions.serviceCenter') }}</option>
                    <option value="technician">{{ t('users.management.roleOptions.technician') }}</option>
                    <option value="accounting">{{ t('users.management.roleOptions.accounting') }}</option>
                    <option value="distributor">{{ t('users.management.roleOptions.distributor') }}</option>
                    <option value="end_user">{{ t('users.management.roleOptions.endUser') }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {{ t('users.management.modal.phone') }} <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="userForm.phone"
                    type="tel"
                    required
                    :placeholder="t('users.management.modal.phonePlaceholder')"
                    class="w-full px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white touch-manipulation min-h-[44px] sm:min-h-0 text-base sm:text-sm"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {{ t('users.management.modal.password') }}
                  </label>
                  <input
                    v-model="userForm.password"
                    type="password"
                    :placeholder="editingUser?.id ? t('users.management.modal.passwordPlaceholder') : t('users.management.modal.passwordCreatePlaceholder')"
                    class="w-full px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white touch-manipulation min-h-[44px] sm:min-h-0 text-base sm:text-sm"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {{ t('users.management.modal.status') }} <span class="text-red-500">*</span>
                  </label>
                  <select
                    v-model="userForm.status"
                    required
                    class="w-full px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white touch-manipulation min-h-[44px] sm:min-h-0 text-base sm:text-sm"
                  >
                    <option value="active">{{ t('users.management.statusOptions.active') }}</option>
                    <option value="inactive">{{ t('users.management.statusOptions.inactive') }}</option>
                    <option value="suspended">{{ t('users.management.statusOptions.suspended') }}</option>
                  </select>
                </div>
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {{ t('users.management.modal.address') }}
                  </label>
                  <input
                    v-model="userForm.address"
                    type="text"
                    :placeholder="t('users.management.modal.addressPlaceholder')"
                    class="w-full px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white touch-manipulation min-h-[44px] sm:min-h-0 text-base sm:text-sm"
                  />
                </div>

                <div class="md:col-span-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <p class="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
                    {{ t('users.management.modal.bankSection') }}
                  </p>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div class="md:col-span-2">
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {{ t('users.management.modal.bankAccountName') }}
                      </label>
                      <input
                        v-model="userForm.bank_account_name"
                        type="text"
                        :placeholder="t('users.management.modal.bankAccountNamePlaceholder')"
                        class="w-full px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white touch-manipulation min-h-[44px] sm:min-h-0 text-base sm:text-sm"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {{ t('users.management.modal.bankAccount') }}
                      </label>
                      <input
                        v-model="userForm.bank_account"
                        type="text"
                        :placeholder="t('users.management.modal.bankAccountPlaceholder')"
                        class="w-full px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white touch-manipulation min-h-[44px] sm:min-h-0 text-base sm:text-sm"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {{ t('users.management.modal.bankName') }}
                      </label>
                      <select
                        v-model="userForm.bank_name"
                        class="w-full px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white touch-manipulation min-h-[44px] sm:min-h-0 text-base sm:text-sm"
                      >
                        <option value="">{{ t('users.management.modal.selectBank') }}</option>
                        <option v-for="b in VN_BANKS" :key="b.bin" :value="b.shortName">
                          {{ b.shortName }} ({{ b.code }})
                        </option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <div class="flex flex-col sm:flex-row justify-end gap-3 mt-6">
                <button
                  type="button"
                  @click="closeEditModal"
                  class="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 active:bg-gray-400 dark:active:bg-gray-500 transition-colors touch-manipulation min-h-[44px] sm:min-h-0"
                >
                  {{ t('users.management.modal.cancel') }}
                </button>
                <button
                  type="submit"
                  class="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors touch-manipulation min-h-[44px] sm:min-h-0"
                >
                  {{ editingUser?.id ? t('users.management.modal.update') : t('users.management.modal.create') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Import CSV Modal -->
      <div
        v-if="showImportModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-gray-700/45 dark:bg-gray-900/65 p-4"
        @click.self="showImportModal = false"
      >
        <div
          class="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-lg shadow-xl w-full max-w-2xl max-h-[calc(100vh-2rem)] overflow-hidden flex flex-col"
        >
          <div class="p-4 sm:p-6 overflow-y-auto flex-1">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-base sm:text-2xl font-bold text-gray-900 dark:text-white">
                {{ t('users.management.importModal.title') }}
              </h2>
              <button
                @click="showImportModal = false"
                class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ t('users.management.importModal.selectFile') }}
              </label>
              <input
                ref="csvFileInput"
                type="file"
                accept=".csv"
                @change="handleFileSelect"
                class="w-full px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white touch-manipulation min-h-[44px] sm:min-h-0 text-base sm:text-sm"
              />
              <p class="mt-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                {{ t('users.management.importModal.csvFormat') }}
              </p>
            </div>
            <div v-if="importErrors.length > 0" class="mb-4 p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <h3 class="font-medium text-red-800 dark:text-red-200 mb-2 text-sm sm:text-base">{{ t('users.management.importModal.errors') }}</h3>
              <ul class="list-disc list-inside text-xs sm:text-sm text-red-700 dark:text-red-300">
                <li v-for="(error, index) in importErrors" :key="index">{{ error }}</li>
              </ul>
            </div>
            <div v-if="importSuccess" class="mb-4 p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p class="text-sm sm:text-base text-green-800 dark:text-green-200">
                {{ t('users.management.importModal.success', { count: importedCount }) }}
              </p>
            </div>
            <div class="flex flex-col sm:flex-row justify-end gap-3">
              <button
                @click="showImportModal = false"
                class="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 active:bg-gray-400 dark:active:bg-gray-500 transition-colors touch-manipulation min-h-[44px] sm:min-h-0"
              >
                {{ t('users.management.importModal.close') }}
              </button>
              <button
                @click="processCSV"
                :disabled="!selectedFile || isImporting"
                class="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation min-h-[44px] sm:min-h-0"
              >
                {{
                  isImporting
                    ? t('users.management.importModal.importing')
                    : t('users.management.importModal.import')
                }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </admin-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import { PlusIcon, UserGroupIcon, UserCircleIcon } from '../../../icons'
import { useAuth, UserRole, UserStatus, Permission } from '@/composables/useAuth'
import { userService, type User } from '@/services/userService'
import { VN_BANKS, matchBankSelectValue, getBankLabel } from '@/data/vnBanks'
import { useToast } from '@/composables/useToast'

const { showSuccess } = useToast()

const { t, locale } = useI18n()
const { hasPermission, getUser, getUserRole } = useAuth()
const currentUserId = computed(() => getUser.value?.id || 0)
const isDevUser = computed(() => getUserRole.value === UserRole.DEV)

const showEditModal = ref(false)
const showImportModal = ref(false)
const editingUser = ref<User | null>(null)
const selectedFile = ref<File | null>(null)
const csvFileInput = ref<HTMLInputElement | null>(null)
const importErrors = ref<string[]>([])
const importSuccess = ref(false)
const importedCount = ref(0)
const isImporting = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)

type UserFormState = {
  name: string
  email: string
  code: string
  role: UserRole | ''
  organization: string
  phone: string
  address: string
  bank_account: string
  bank_name: string
  bank_account_name: string
  password: string
  status: UserStatus
}

type CsvUserRow = {
  name?: string
  email?: string
  code?: string
  role?: string
  organization?: string
  password?: string
  status?: string
  phone?: string
  address?: string
}

const createEmptyUserForm = (): UserFormState => ({
  name: '',
  email: '',
  code: '',
  role: UserRole.END_USER,
  organization: '',
  phone: '',
  address: '',
  bank_account: '',
  bank_name: '',
  bank_account_name: '',
  password: '',
  status: UserStatus.ACTIVE,
})

const userForm = ref<UserFormState>(createEmptyUserForm())

const stats = ref({
  total: 0,
})

const roleStats = ref([
  { role: UserRole.ADMIN, count: 0 },
  { role: UserRole.TECHNICIAN, count: 0 },
  { role: UserRole.END_USER, count: 0 },
])

const filters = ref({
  search: '',
  role: '',
  status: '',
})

const users = ref<User[]>([])

// Fetch users from API
const fetchUsers = async () => {
  loading.value = true
  error.value = null
  try {
    const fetchedUsers = await userService.getAllUsers()
    users.value = fetchedUsers
    updateStats()
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('users.management.messages.loadError')
    console.error('Error fetching users:', err)
  } finally {
    loading.value = false
  }
}

// Load users on component mount
onMounted(() => {
  fetchUsers()
})

const filteredUsers = computed(() => {
  let result = users.value

  if (!isDevUser.value) {
    result = result.filter((u) => u.role !== UserRole.DEV)
  }

  if (filters.value.search) {
    const search = filters.value.search.toLowerCase()
    result = result.filter(
      (u) =>
        u.name.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search) ||
        (u.code && u.code.toLowerCase().includes(search))
    )
  }

  if (filters.value.role) {
    result = result.filter((u) => u.role === filters.value.role)
  }

  if (filters.value.status) {
    result = result.filter((u) => u.status === filters.value.status)
  }

  return result
})

const getRoleClass = (role: UserRole) => {
  const classes = {
    [UserRole.ADMIN]: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    [UserRole.DEV]: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    [UserRole.SERVICE_CENTER]:
      'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    [UserRole.TECHNICIAN]:
      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    [UserRole.ACCOUNTING]:
      'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
    [UserRole.DISTRIBUTOR]:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    [UserRole.END_USER]:
      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  }
  return classes[role] || classes[UserRole.END_USER]
}

const getRoleLabel = (role: UserRole | string) => {
  const labels: Record<string, string> = {
    [UserRole.ADMIN]: t('users.management.roleOptions.admin'),
    [UserRole.DEV]: t('users.management.roleOptions.dev'),
    [UserRole.SERVICE_CENTER]: t('users.management.roleOptions.serviceCenter'),
    [UserRole.TECHNICIAN]: t('users.management.roleOptions.technician'),
    [UserRole.ACCOUNTING]: t('users.management.roleOptions.accounting'),
    [UserRole.DISTRIBUTOR]: t('users.management.roleOptions.distributor'),
    [UserRole.END_USER]: t('users.management.roleOptions.endUser'),
  }
  return labels[role] || role
}

const getRoleColor = (role: UserRole) => {
  const colors = {
    [UserRole.ADMIN]: 'text-purple-500',
    [UserRole.DEV]: 'text-indigo-500',
    [UserRole.SERVICE_CENTER]: 'text-blue-500',
    [UserRole.TECHNICIAN]: 'text-green-500',
    [UserRole.ACCOUNTING]: 'text-teal-500',
    [UserRole.DISTRIBUTOR]: 'text-yellow-500',
    [UserRole.END_USER]: 'text-gray-500',
  }
  return colors[role] || 'text-gray-500'
}

const statusClasses: Record<UserStatus, string> = {
  [UserStatus.ACTIVE]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  [UserStatus.INACTIVE]: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  [UserStatus.SUSPENDED]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
}

const statusLabels: Record<UserStatus, string> = {
  [UserStatus.ACTIVE]: t('users.management.statusOptions.active'),
  [UserStatus.INACTIVE]: t('users.management.statusOptions.inactive'),
  [UserStatus.SUSPENDED]: t('users.management.statusOptions.suspended'),
}

const getStatusClass = (status: string | UserStatus | undefined) => {
  if (status && statusClasses[status as UserStatus]) {
    return statusClasses[status as UserStatus]
  }
  return statusClasses[UserStatus.ACTIVE]
}

const getStatusLabel = (status: string | UserStatus | undefined) => {
  if (status && statusLabels[status as UserStatus]) {
    return statusLabels[status as UserStatus]
  }
  return status || statusLabels[UserStatus.ACTIVE]
}

const formatDate = (dateString: string | Date) => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  const localeMap: Record<string, string> = {
    vi: 'vi-VN',
    en: 'en-US',
  }
  return new Intl.DateTimeFormat(localeMap[locale.value] || 'vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

const editUser = async (userId: number) => {
  try {
    error.value = null
    successMessage.value = null
    const user = await userService.getUserById(userId)
    editingUser.value = user
  userForm.value = {
    name: user.name,
    email: user.email,
    code: user.code || '',
    role: user.role,
    organization: user.organization || '',
    phone: user.phone || '',
    address: user.address || '',
    bank_account: user.bank_account || '',
    bank_name: matchBankSelectValue(user.bank_name) || '',
    bank_account_name: user.bank_account_name || '',
    password: '',
    status: user.status,
  }
    showEditModal.value = true
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('users.management.messages.editError')
    console.error('Error fetching user:', err)
  }
}

const closeEditModal = () => {
  showEditModal.value = false
  editingUser.value = null
  error.value = null
  successMessage.value = null
  userForm.value = createEmptyUserForm()
}

const saveUser = async () => {
  loading.value = true
  error.value = null
  successMessage.value = null
  
  try {
    if (userForm.value.role === UserRole.DEV && !isDevUser.value) {
      error.value = t('users.management.messages.devRoleRestricted')
      loading.value = false
      return
    }

    if (editingUser.value?.id) {
      // Update existing user
      const updateData: any = {
        name: userForm.value.name,
        email: userForm.value.email,
        code: userForm.value.code || undefined,
        role: userForm.value.role as UserRole,
        organization: userForm.value.organization || undefined,
        status: userForm.value.status,
      }
      
      // Always send phone and address, even if empty string
      if (userForm.value.phone !== undefined) {
        updateData.phone = userForm.value.phone || null
      }
      if (userForm.value.address !== undefined) {
        updateData.address = userForm.value.address || null
      }
      if (userForm.value.bank_account !== undefined) {
        updateData.bank_account = userForm.value.bank_account || null
      }
      if (userForm.value.bank_name !== undefined) {
        updateData.bank_name = userForm.value.bank_name || null
      }
      if (userForm.value.bank_account_name !== undefined) {
        updateData.bank_account_name = userForm.value.bank_account_name || null
      }
      
      if (userForm.value.password) {
        updateData.password = userForm.value.password
      }
      
      const updatedUser = await userService.updateUser(editingUser.value.id, updateData)
      
      // Update local state
      const index = users.value.findIndex((u) => u.id === updatedUser.id)
      if (index !== -1) {
        users.value[index] = updatedUser
      }
      
      successMessage.value = t('users.management.messages.updateSuccess')
      
      // Close modal after 1.5 seconds
      setTimeout(() => {
        closeEditModal()
      }, 1500)
    } else {
      if (!userForm.value.password?.trim()) {
        error.value = t('users.management.messages.passwordRequired')
        loading.value = false
        return
      }

      const newUser = await userService.createUser({
        name: userForm.value.name,
        email: userForm.value.email,
        password: userForm.value.password.trim(),
        code: userForm.value.code || undefined,
        role: userForm.value.role as UserRole,
        organization: userForm.value.organization || undefined,
        phone: userForm.value.phone || undefined,
        address: userForm.value.address || undefined,
        bank_account: userForm.value.bank_account || undefined,
        bank_name: userForm.value.bank_name || undefined,
        bank_account_name: userForm.value.bank_account_name || undefined,
        status: userForm.value.status,
      })
      
      users.value.push(newUser)
      successMessage.value = t('users.management.messages.createSuccess')
      showSuccess(t('common.messages.userCreated'))
      
      // Close modal after 1.5 seconds
      setTimeout(() => {
        closeEditModal()
      }, 1500)
    }
    
    updateStats()
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('users.management.messages.saveError')
    console.error('Error saving user:', err)
  } finally {
    loading.value = false
  }
}

const openAddModal = () => {
  editingUser.value = null
  error.value = null
  successMessage.value = null
  userForm.value = createEmptyUserForm()
  showEditModal.value = true
}

const updateStats = () => {
  stats.value.total = users.value.length
  roleStats.value = [
    { role: UserRole.ADMIN, count: users.value.filter((u) => u.role === UserRole.ADMIN).length },
    { role: UserRole.TECHNICIAN, count: users.value.filter((u) => u.role === UserRole.TECHNICIAN).length },
    { role: UserRole.END_USER, count: users.value.filter((u) => u.role === UserRole.END_USER).length },
  ]
}

const deleteUser = async (userId: number) => {
  if (!confirm(t('users.management.messages.deleteConfirm'))) {
    return
  }
  
  loading.value = true
  error.value = null
  
  try {
    await userService.deleteUser(userId)
    users.value = users.value.filter((u) => u.id !== userId)
    updateStats()
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('users.management.messages.deleteError')
    console.error('Error deleting user:', err)
  } finally {
    loading.value = false
  }
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    selectedFile.value = target.files[0]
    importErrors.value = []
    importSuccess.value = false
  }
}

const parseCSV = (csvText: string): CsvUserRow[] => {
  const sanitizedText = csvText.replace(/^\uFEFF/, '')
  const lines = sanitizedText.split(/\r?\n/).filter((line) => line.trim())
  if (lines.length < 2) return []

  // Simple CSV parser - handles quoted values
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    
    return result
  }

  const headers = parseCSVLine(lines[0])
    .map((h) => h.replace(/^"|"$/g, '').trim().toLowerCase())
    .filter(Boolean)
  const users: CsvUserRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const rawValues = parseCSVLine(lines[i])

    const user: CsvUserRow = {}
    headers.forEach((header, index) => {
      const value = rawValues[index] ?? ''
      user[header as keyof CsvUserRow] = value.replace(/^"|"$/g, '').trim()
    })
    // Skip empty lines that may have been filtered earlier
    if (Object.values(user).some((val) => val && val.length > 0)) {
      users.push(user)
    }
  }

  return users
}

const processCSV = async () => {
  if (!selectedFile.value) return

  importErrors.value = []
  importSuccess.value = false
  importedCount.value = 0
  isImporting.value = true

  try {
    const csvText = await selectedFile.value.text()
    const csvUsers = parseCSV(csvText)

    if (csvUsers.length === 0) {
      importErrors.value.push(t('users.management.messages.csvNoData'))
      return
    }

    const errors: string[] = []
    const validRoles = Object.values(UserRole)
    const validStatuses = Object.values(UserStatus)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    let successCount = 0

    for (let i = 0; i < csvUsers.length; i++) {
      const csvUser = csvUsers[i]
      const rowNumber = i + 2
      const name = csvUser.name?.trim()
      const email = csvUser.email?.trim()
      const roleValue = csvUser.role?.trim().toLowerCase() || UserRole.END_USER
      const statusValue = csvUser.status?.trim().toLowerCase() || UserStatus.ACTIVE
      const password = csvUser.password?.trim()

      if (!name || !email) {
        errors.push(t('users.management.messages.csvRowError', { row: rowNumber }))
        continue
      }

      if (!emailRegex.test(email)) {
        errors.push(t('users.management.messages.csvInvalidEmail', { row: rowNumber, email }))
        continue
      }

      if (!validRoles.includes(roleValue as UserRole)) {
        errors.push(t('users.management.messages.csvInvalidRole', { row: rowNumber, role: csvUser.role }))
        continue
      }

      if (csvUser.status && !validStatuses.includes(statusValue as UserStatus)) {
        errors.push(t('users.management.messages.csvInvalidStatus', { row: rowNumber, status: csvUser.status }))
        continue
      }

      const normalizedRole = roleValue as UserRole
      const normalizedStatus = statusValue as UserStatus

      if (normalizedRole === UserRole.DEV && !isDevUser.value) {
        errors.push(t('users.management.messages.csvDevRoleRestricted', { row: rowNumber }))
        continue
      }

      const commonPayload = {
        name,
        email,
        code: csvUser.code?.trim() || undefined,
        role: normalizedRole,
        organization: csvUser.organization?.trim() || undefined,
        phone: csvUser.phone?.trim() || undefined,
        address: csvUser.address?.trim() || undefined,
        status: normalizedStatus,
      }

      try {
        const existingUser = users.value.find((u) => u.email.toLowerCase() === email.toLowerCase())

        if (existingUser) {
          const updatedUser = await userService.updateUser(existingUser.id, {
            ...commonPayload,
            ...(password ? { password } : {}),
          })
          users.value = users.value.map((u) => (u.id === updatedUser.id ? updatedUser : u))
        } else {
          if (!password) {
            errors.push(t('users.management.messages.csvPasswordRequired', { row: rowNumber }))
            continue
          }

          const newUser = await userService.createUser({
            ...commonPayload,
            password,
          })
          users.value.push(newUser)
        }

        successCount++
      } catch (apiError) {
        const message = apiError instanceof Error ? apiError.message : String(apiError)
        errors.push(t('users.management.messages.csvApiError', { row: rowNumber, error: message }))
      }
    }

    importedCount.value = successCount

    if (successCount > 0) {
      importSuccess.value = true
      updateStats()
    }

    if (errors.length > 0) {
      importErrors.value = errors
    } else {
      if (csvFileInput.value) {
        csvFileInput.value.value = ''
      }
      selectedFile.value = null
    }
  } catch (error) {
    importErrors.value.push(t('users.management.messages.csvReadError', { error: String(error) }))
  } finally {
    isImporting.value = false
  }
}

const downloadCSVTemplate = () => {
  const headers = ['name', 'email', 'code', 'role', 'organization', 'password', 'status', 'phone', 'address']
  const example = [
    ['Nguyễn Văn A', 'user1@SGE.vn', 'USR001', 'technician', 'Phòng kỹ thuật', 'password123', 'active', '0901234567', '123 Điện Biên Phủ, Q1'],
    ['Trần Thị B', 'user2@SGE.vn', 'USR002', 'service_center', 'Trung tâm dịch vụ', 'password123', 'active', '0909876543', '456 Hai Bà Trưng, Q3'],
  ]

  let csvContent = headers.join(',') + '\n'
  example.forEach((row) => {
    csvContent += row.join(',') + '\n'
  })

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = 'user_template.csv'
  link.click()
}

// Initialize stats
updateStats()
</script>
