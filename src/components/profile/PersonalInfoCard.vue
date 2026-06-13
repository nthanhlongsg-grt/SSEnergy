<template>
  <div>
    <div class="p-5 mb-6 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div class="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 class="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            {{ t('profile.personalInfo.title') }}
          </h4>

          <div class="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            <div>
              <p class="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">{{ t('profile.personalInfo.fields.fullName') }}</p>
              <p class="text-sm font-medium text-gray-800 dark:text-white/90">
                {{ user?.name || t('profile.personalInfo.noData.noName') }}
              </p>
            </div>

            <div>
              <p class="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                {{ t('profile.personalInfo.fields.email') }}
              </p>
              <p class="text-sm font-medium text-gray-800 dark:text-white/90">
                {{ user?.email || t('profile.personalInfo.noData.noEmail') }}
              </p>
            </div>

            <div>
              <p class="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">{{ t('profile.personalInfo.fields.employeeCode') }}</p>
              <p class="text-sm font-medium text-gray-800 dark:text-white/90">
                {{ user?.code || t('profile.personalInfo.noData.noCode') }}
              </p>
            </div>

            <div>
              <p class="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">{{ t('profile.personalInfo.fields.phone') }}</p>
              <p class="text-sm font-medium text-gray-800 dark:text-white/90">
                {{ user?.phone || t('profile.personalInfo.noData.noPhone') }}
              </p>
            </div>

            <div>
              <p class="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">{{ t('profile.personalInfo.fields.organization') }}</p>
              <p class="text-sm font-medium text-gray-800 dark:text-white/90">
                {{ user?.organization || t('profile.personalInfo.noData.noOrganization') }}
              </p>
            </div>

            <div>
              <p class="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">{{ t('profile.personalInfo.fields.address') }}</p>
              <p class="text-sm font-medium text-gray-800 dark:text-white/90">
                {{ (user as any)?.address || t('profile.personalInfo.noData.noAddress') }}
              </p>
            </div>

            <div>
              <p class="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">{{ t('profile.personalInfo.fields.role') }}</p>
              <p class="text-sm font-medium text-gray-800 dark:text-white/90">
                {{ getRoleLabel(user?.role || '') }}
              </p>
            </div>
          </div>

          <div class="mt-6 pt-5 border-t border-gray-200 dark:border-gray-800">
            <h5 class="mb-4 text-sm font-semibold text-gray-800 dark:text-white/90">
              {{ t('profile.personalInfo.fields.bankSection') }}
            </h5>
            <div class="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7">
              <div>
                <p class="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">{{ t('profile.personalInfo.fields.bankAccountName') }}</p>
                <p class="text-sm font-medium text-gray-800 dark:text-white/90">
                  {{ (user as any)?.bank_account_name || t('profile.personalInfo.noData.noBankAccountName') }}
                </p>
              </div>
              <div>
                <p class="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">{{ t('profile.personalInfo.fields.bankAccount') }}</p>
                <p class="text-sm font-medium text-gray-800 dark:text-white/90">
                  {{ (user as any)?.bank_account || t('profile.personalInfo.noData.noBankAccount') }}
                </p>
              </div>
              <div>
                <p class="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">{{ t('profile.personalInfo.fields.bankName') }}</p>
                <p class="text-sm font-medium text-gray-800 dark:text-white/90">
                  {{ getBankLabel((user as any)?.bank_name) === '—' ? t('profile.personalInfo.noData.noBankName') : getBankLabel((user as any)?.bank_name) }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="flex gap-2">
          <button class="edit-button" @click="openEditModal">
          <svg
            class="fill-current"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
              fill=""
            />
          </svg>
          {{ t('profile.personalInfo.actions.edit') }}
        </button>
        <button class="edit-button" @click="openChangePasswordModal">
          <svg
            class="fill-current"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9 1C7.34315 1 6 2.34315 6 4C6 5.65685 7.34315 7 9 7C10.6569 7 12 5.65685 12 4C12 2.34315 10.6569 1 9 1Z"
              fill=""
            />
            <path
              d="M3 14C3 11.7909 4.79086 10 7 10H11C13.2091 10 15 11.7909 15 14V17H3V14Z"
              fill=""
            />
          </svg>
          {{ t('profile.personalInfo.actions.changePassword') }}
        </button>
        </div>
      </div>
    </div>
    <Modal v-if="isProfileInfoModal" @close="closeEditModal">
      <template #body>
        <div
          class="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11"
        >
          <!-- close btn -->
          <button
            @click="closeEditModal"
            class="transition-color absolute right-5 top-5 z-999 flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:bg-gray-700 dark:bg-white/[0.05] dark:text-gray-400 dark:hover:bg-white/[0.07] dark:hover:text-gray-300"
          >
            <svg
              class="fill-current"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M6.04289 16.5418C5.65237 16.9323 5.65237 17.5655 6.04289 17.956C6.43342 18.3465 7.06658 18.3465 7.45711 17.956L11.9987 13.4144L16.5408 17.9565C16.9313 18.347 17.5645 18.347 17.955 17.9565C18.3455 17.566 18.3455 16.9328 17.955 16.5423L13.4129 12.0002L17.955 7.45808C18.3455 7.06756 18.3455 6.43439 17.955 6.04387C17.5645 5.65335 16.9313 5.65335 16.5408 6.04387L11.9987 10.586L7.45711 6.04439C7.06658 5.65386 6.43342 5.65386 6.04289 6.04439C5.65237 6.43491 5.65237 7.06808 6.04289 7.4586L10.5845 12.0002L6.04289 16.5418Z"
                fill=""
              />
            </svg>
          </button>
          <div class="px-2 pr-14">
            <h4 class="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              {{ t('profile.personalInfo.editModal.title') }}
            </h4>
            <p class="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              {{ t('profile.personalInfo.editModal.description') }}
            </p>
          </div>
          <form @submit.prevent="saveProfile" class="flex flex-col">
            <div v-if="errorMessage" class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p class="text-sm text-red-800 dark:text-red-200">{{ errorMessage }}</p>
            </div>
            <div v-if="successMessage" class="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p class="text-sm text-green-800 dark:text-green-200">{{ successMessage }}</p>
            </div>
            <div class="custom-scrollbar h-[458px] overflow-y-auto p-2">
              <div class="mt-7">
                <h5 class="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                  {{ t('profile.personalInfo.editModal.personalInfo') }}
                </h5>

                <div class="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  <div class="col-span-2 lg:col-span-1">
                    <label
                      class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
                    >
                      {{ t('profile.personalInfo.editModal.fullName') }} <span class="text-red-500">*</span>
                    </label>
                    <input
                      v-model="formData.name"
                      type="text"
                      required
                      class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    />
                  </div>

                  <div class="col-span-2 lg:col-span-1">
                    <label
                      class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
                    >
                      {{ t('profile.personalInfo.editModal.email') }} <span class="text-red-500">*</span>
                    </label>
                    <input
                      v-model="formData.email"
                      type="email"
                      required
                      class="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    />
                  </div>

                  <div class="col-span-2 lg:col-span-1">
                    <label
                      class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
                    >
                      {{ t('profile.personalInfo.editModal.employeeCode') }}
                    </label>
                    <input
                      v-model="formData.code"
                      type="text"
                      class="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    />
                  </div>

                  <div class="col-span-2 lg:col-span-1">
                    <label
                      class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
                    >
                      {{ t('profile.personalInfo.editModal.phone') }}
                    </label>
                    <input
                      v-model="formData.phone"
                      type="tel"
                      class="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    />
                  </div>

                  <div class="col-span-2">
                    <label
                      class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
                    >
                      {{ t('profile.personalInfo.editModal.organization') }}
                    </label>
                    <input
                      v-model="formData.organization"
                      type="text"
                      class="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    />
                  </div>

                  <div class="col-span-2">
                    <label
                      class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
                    >
                      {{ t('profile.personalInfo.editModal.address') }}
                    </label>
                    <input
                      v-model="formData.address"
                      type="text"
                      :placeholder="t('profile.personalInfo.editModal.addressPlaceholder')"
                      class="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    />
                  </div>

                  <div class="col-span-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <h6 class="mb-4 text-sm font-semibold text-gray-800 dark:text-white/90">
                      {{ t('profile.personalInfo.editModal.bankSection') }}
                    </h6>
                    <div class="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                      <div class="col-span-2">
                        <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                          {{ t('profile.personalInfo.editModal.bankAccountName') }}
                        </label>
                        <input
                          v-model="formData.bank_account_name"
                          type="text"
                          :placeholder="t('profile.personalInfo.editModal.bankAccountNamePlaceholder')"
                          class="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                        />
                      </div>
                      <div>
                        <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                          {{ t('profile.personalInfo.editModal.bankAccount') }}
                        </label>
                        <input
                          v-model="formData.bank_account"
                          type="text"
                          :placeholder="t('profile.personalInfo.editModal.bankAccountPlaceholder')"
                          class="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                        />
                      </div>
                      <div>
                        <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                          {{ t('profile.personalInfo.editModal.bankName') }}
                        </label>
                        <select
                          v-model="formData.bank_name"
                          class="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                        >
                          <option value="">{{ t('profile.personalInfo.editModal.selectBank') }}</option>
                          <option v-for="b in VN_BANKS" :key="b.bin" :value="b.shortName">
                            {{ b.shortName }} ({{ b.code }})
                          </option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <button
                @click="closeEditModal"
                type="button"
                class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
              >
                {{ t('profile.personalInfo.editModal.cancel') }}
              </button>
              <button
                type="submit"
                :disabled="isLoading"
                class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto"
              >
                {{ isLoading ? t('profile.personalInfo.editModal.saving') : t('profile.personalInfo.editModal.save') }}
              </button>
            </div>
          </form>
        </div>
      </template>
    </Modal>

    <!-- Change Password Modal -->
    <Modal v-if="isChangePasswordModal" @close="closeChangePasswordModal">
      <template #body>
        <div
          class="no-scrollbar relative w-full max-w-[500px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11"
        >
          <!-- close btn -->
          <button
            @click="closeChangePasswordModal"
            class="transition-color absolute right-5 top-5 z-999 flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:bg-gray-700 dark:bg-white/[0.05] dark:text-gray-400 dark:hover:bg-white/[0.07] dark:hover:text-gray-300"
          >
            <svg
              class="fill-current"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M6.04289 16.5418C5.65237 16.9323 5.65237 17.5655 6.04289 17.956C6.43342 18.3465 7.06658 18.3465 7.45711 17.956L11.9987 13.4144L16.5408 17.9565C16.9313 18.347 17.5645 18.347 17.955 17.9565C18.3455 17.566 18.3455 16.9328 17.955 16.5423L13.4129 12.0002L17.955 7.45808C18.3455 7.06756 18.3455 6.43439 17.955 6.04387C17.5645 5.65335 16.9313 5.65335 16.5408 6.04387L11.9987 10.586L7.45711 6.04439C7.06658 5.65386 6.43342 5.65386 6.04289 6.04439C5.65237 6.43491 5.65237 7.06808 6.04289 7.4586L10.5845 12.0002L6.04289 16.5418Z"
                fill=""
              />
            </svg>
          </button>
          <div class="px-2 pr-14">
            <h4 class="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              {{ t('profile.personalInfo.changePasswordModal.title') }}
            </h4>
            <p class="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              {{ t('profile.personalInfo.changePasswordModal.description') }}
            </p>
          </div>
          <form @submit.prevent="savePassword" class="flex flex-col">
            <div v-if="passwordErrorMessage" class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p class="text-sm text-red-800 dark:text-red-200">{{ passwordErrorMessage }}</p>
            </div>
            <div v-if="passwordSuccessMessage" class="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p class="text-sm text-green-800 dark:text-green-200">{{ passwordSuccessMessage }}</p>
            </div>
            <div class="p-2">
              <div class="mb-4">
                <label
                  class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
                >
                  {{ t('profile.personalInfo.changePasswordModal.oldPassword') }} <span class="text-red-500">*</span>
                </label>
                <div class="relative">
                  <input
                    v-model="passwordForm.oldPassword"
                    :type="showOldPassword ? 'text' : 'password'"
                    required
                    :placeholder="t('profile.personalInfo.changePasswordModal.oldPasswordPlaceholder')"
                    class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pr-10 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                  <button
                    type="button"
                    @click="showOldPassword = !showOldPassword"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <svg v-if="showOldPassword" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                    <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </div>
              </div>

              <div class="mb-4">
                <label
                  class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
                >
                  {{ t('profile.personalInfo.changePasswordModal.newPassword') }} <span class="text-red-500">*</span>
                </label>
                <div class="relative">
                  <input
                    v-model="passwordForm.newPassword"
                    :type="showNewPassword ? 'text' : 'password'"
                    required
                    :placeholder="t('profile.personalInfo.changePasswordModal.newPasswordPlaceholder')"
                    class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pr-10 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                  <button
                    type="button"
                    @click="showNewPassword = !showNewPassword"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <svg v-if="showNewPassword" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                    <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </div>
              </div>

              <div class="mb-4">
                <label
                  class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
                >
                  {{ t('profile.personalInfo.changePasswordModal.confirmPassword') }} <span class="text-red-500">*</span>
                </label>
                <div class="relative">
                  <input
                    v-model="passwordForm.confirmPassword"
                    :type="showConfirmPassword ? 'text' : 'password'"
                    required
                    :placeholder="t('profile.personalInfo.changePasswordModal.confirmPasswordPlaceholder')"
                    class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pr-10 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                  <button
                    type="button"
                    @click="showConfirmPassword = !showConfirmPassword"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <svg v-if="showConfirmPassword" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                    <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </div>
                <p v-if="passwordForm.newPassword && passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword" class="mt-1 text-xs text-red-600 dark:text-red-400">
                  {{ t('profile.personalInfo.changePasswordModal.passwordMismatch') }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <button
                @click="closeChangePasswordModal"
                type="button"
                class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
              >
                {{ t('profile.personalInfo.changePasswordModal.cancel') }}
              </button>
              <button
                type="submit"
                :disabled="!!(isChangingPassword || (passwordForm.newPassword && passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword))"
                class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto"
              >
                {{ isChangingPassword ? t('profile.personalInfo.changePasswordModal.saving') : t('profile.personalInfo.changePasswordModal.changePassword') }}
              </button>
            </div>
          </form>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import Modal from './Modal.vue'
import { useAuth, UserRole } from '@/composables/useAuth'
import { userService } from '@/services/userService'
import { VN_BANKS, matchBankSelectValue, getBankLabel } from '@/data/vnBanks'

const { t } = useI18n()
const route = useRoute()
const { getUser, refreshUserInfo } = useAuth()
const user = computed(() => getUser.value)

const isProfileInfoModal = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const isChangePasswordModal = ref(false)
const isChangingPassword = ref(false)
const passwordErrorMessage = ref('')
const passwordSuccessMessage = ref('')
const showOldPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

const formData = ref({
  name: '',
  email: '',
  code: '',
  phone: '',
  organization: '',
  address: '',
  bank_account: '',
  bank_name: '',
  bank_account_name: '',
})

const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const getRoleLabel = (role: UserRole | string) => {
  const labels: Record<string, string> = {
    [UserRole.ADMIN]: t('users.management.roleOptions.admin'),
    [UserRole.DEV]: t('users.management.roleOptions.dev'),
    [UserRole.SERVICE_CENTER]: t('users.management.roleOptions.serviceCenter'),
    [UserRole.TECHNICIAN]: t('users.management.roleOptions.technician'),
    [UserRole.DISTRIBUTOR]: t('users.management.roleOptions.distributor'),
    [UserRole.DEALER]: t('users.management.roleOptions.dealer'),
    [UserRole.END_USER]: t('users.management.roleOptions.endUser'),
    [UserRole.WAREHOUSE]: t('users.management.roleOptions.warehouse'),
  }
  return labels[role] || role
}

const openEditModal = async () => {
  errorMessage.value = ''
  successMessage.value = ''
  
  // Refresh user data from API to ensure we have the latest phone number
  try {
    await refreshUserInfo()
  } catch (err) {
    console.error('Error refreshing user info:', err)
  }
  
  // Wait a bit for user data to be updated
  await new Promise(resolve => setTimeout(resolve, 100))
  
  if (user.value) {
    formData.value = {
      name: user.value.name || '',
      email: user.value.email || '',
      code: user.value.code || '',
      phone: user.value.phone || '',
      organization: user.value.organization || '',
      address: (user.value as any).address || '',
      bank_account: (user.value as any).bank_account || '',
      bank_name: matchBankSelectValue((user.value as any).bank_name) || '',
      bank_account_name: (user.value as any).bank_account_name || '',
    }
  }
  
  isProfileInfoModal.value = true
}

const closeEditModal = () => {
  isProfileInfoModal.value = false
  errorMessage.value = ''
  successMessage.value = ''
}

const saveProfile = async () => {
  if (!user.value) return

  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    // Use updateMyProfile for better semantics, but updateUser also works for own profile
    await userService.updateMyProfile({
      name: formData.value.name,
      email: formData.value.email,
      code: formData.value.code || undefined,
      phone: formData.value.phone || undefined,
      organization: formData.value.organization || undefined,
      address: formData.value.address || undefined,
      bank_account: formData.value.bank_account || undefined,
      bank_name: formData.value.bank_name || undefined,
      bank_account_name: formData.value.bank_account_name || undefined,
    })

    // Refresh user info in auth
    await refreshUserInfo()

    successMessage.value = t('profile.personalInfo.editModal.success')
    
    // Close modal after 1.5 seconds and remove query param
    setTimeout(() => {
      closeEditModal()
      // Remove edit query param from URL
      if (route.query.edit === 'true') {
        window.history.replaceState({}, '', '/profile')
      }
    }, 1500)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('profile.personalInfo.editModal.error')
  } finally {
    isLoading.value = false
  }
}

const openChangePasswordModal = () => {
  passwordForm.value = {
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  }
  passwordErrorMessage.value = ''
  passwordSuccessMessage.value = ''
  showOldPassword.value = false
  showNewPassword.value = false
  showConfirmPassword.value = false
  isChangePasswordModal.value = true
}

const closeChangePasswordModal = () => {
  isChangePasswordModal.value = false
  passwordForm.value = {
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  }
  passwordErrorMessage.value = ''
  passwordSuccessMessage.value = ''
  showOldPassword.value = false
  showNewPassword.value = false
  showConfirmPassword.value = false
}

const savePassword = async () => {
  if (!passwordForm.value.oldPassword || !passwordForm.value.newPassword || !passwordForm.value.confirmPassword) {
    passwordErrorMessage.value = t('profile.personalInfo.changePasswordModal.errors.fillAll')
    return
  }

  if (passwordForm.value.newPassword.length < 6) {
    passwordErrorMessage.value = t('profile.personalInfo.changePasswordModal.errors.minLength')
    return
  }

  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    passwordErrorMessage.value = t('profile.personalInfo.changePasswordModal.errors.mismatch')
    return
  }

  if (passwordForm.value.oldPassword === passwordForm.value.newPassword) {
    passwordErrorMessage.value = t('profile.personalInfo.changePasswordModal.errors.sameAsOld')
    return
  }

  isChangingPassword.value = true
  passwordErrorMessage.value = ''
  passwordSuccessMessage.value = ''

  try {
    await userService.changePassword(
      passwordForm.value.oldPassword,
      passwordForm.value.newPassword
    )

    passwordSuccessMessage.value = t('profile.personalInfo.changePasswordModal.success')

    // Clear form and close modal after 1.5 seconds
    setTimeout(() => {
      closeChangePasswordModal()
    }, 1500)
  } catch (error) {
    passwordErrorMessage.value = error instanceof Error ? error.message : t('profile.personalInfo.changePasswordModal.errors.changeError')
  } finally {
    isChangingPassword.value = false
  }
}

// Auto-open modal if edit=true in query params
onMounted(() => {
  if (route.query.edit === 'true') {
    // Wait a bit for component to fully mount
    setTimeout(() => {
      openEditModal()
    }, 300)
  }
})
</script>
