<template>
  <FullScreenLayout>
    <div class="relative px-4 py-4 bg-white z-1 dark:bg-gray-900 sm:p-6 lg:p-0">
      <div
        class="relative flex flex-col justify-center w-full h-screen lg:flex-row dark:bg-gray-900"
      >
        <div class="flex flex-col flex-1 w-full lg:w-1/2">
          <div class="w-full max-w-md pt-4 mx-auto sm:pt-10">
            <div class="flex items-center justify-between">
              <a
                href="https://vn.growatt.com/"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <svg
                  class="stroke-current"
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                >
                  <path
                    d="M12.7083 5L7.5 10.2083L12.7083 15.4167"
                    stroke=""
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                {{ t('auth.signin.backToHome') }}
              </a>
              <LanguageSwitcher />
            </div>
          </div>
          <div class="flex flex-col justify-center flex-1 w-full max-w-md mx-auto px-2 sm:px-0">
            <div>
              <!-- Logo -->
              <div class="flex justify-center mb-8 sm:mb-10">
                <router-link to="/" class="flex items-center justify-center">
                  <img 
                    src="/images/logo/logo.png" 
                    alt="Growatt VietNam" 
                    class="object-contain h-16 w-auto sm:h-20"
                  />
                </router-link>
              </div>
              <div class="mb-5 sm:mb-8">
                <h1
                  class="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md"
                >
                  {{ t('auth.signin.title') }}
                </h1>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ t('auth.signin.subtitle') }}
                </p>
              </div>
              <div>
                <form @submit.prevent="handleSubmit">
                  <div v-if="errorMessage" class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p class="text-sm text-red-800 dark:text-red-200">{{ errorMessage }}</p>
                  </div>
                  <div class="space-y-4 sm:space-y-5">
                    <!-- Email -->
                    <div>
                      <label
                        for="email"
                        class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
                      >
                        {{ t('auth.signin.email') }}<span class="text-error-500">*</span>
                      </label>
                      <input
                        v-model="email"
                        type="email"
                        id="email"
                        name="email"
                        placeholder="info@gmail.com"
                        class="dark:bg-dark-900 h-12 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-base text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 sm:h-11 sm:text-sm sm:py-2.5"
                      />
                    </div>
                    <!-- Password -->
                    <div>
                      <label
                        for="password"
                        class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
                      >
                        {{ t('auth.signin.password') }}<span class="text-error-500">*</span>
                      </label>
                      <div class="relative">
                        <input
                          v-model="password"
                          :type="showPassword ? 'text' : 'password'"
                          id="password"
                          :placeholder="t('auth.signin.passwordPlaceholder')"
                          class="dark:bg-dark-900 h-12 w-full rounded-lg border border-gray-300 bg-transparent py-3 pl-4 pr-12 text-base text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 sm:h-11 sm:text-sm sm:py-2.5 sm:pr-11"
                        />
                        <span
                          @click="togglePasswordVisibility"
                          class="absolute z-30 text-gray-500 -translate-y-1/2 cursor-pointer right-4 top-1/2 dark:text-gray-400 p-2 -mr-2 -mt-2 touch-manipulation"
                        >
                          <svg
                            v-if="!showPassword"
                            class="fill-current"
                            width="20"
                            height="20"
                            viewBox="0 0 20 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              fill-rule="evenodd"
                              clip-rule="evenodd"
                              d="M10.0002 13.8619C7.23361 13.8619 4.86803 12.1372 3.92328 9.70241C4.86804 7.26761 7.23361 5.54297 10.0002 5.54297C12.7667 5.54297 15.1323 7.26762 16.0771 9.70243C15.1323 12.1372 12.7667 13.8619 10.0002 13.8619ZM10.0002 4.04297C6.48191 4.04297 3.49489 6.30917 2.4155 9.4593C2.3615 9.61687 2.3615 9.78794 2.41549 9.94552C3.49488 13.0957 6.48191 15.3619 10.0002 15.3619C13.5184 15.3619 16.5055 13.0957 17.5849 9.94555C17.6389 9.78797 17.6389 9.6169 17.5849 9.45932C16.5055 6.30919 13.5184 4.04297 10.0002 4.04297ZM9.99151 7.84413C8.96527 7.84413 8.13333 8.67606 8.13333 9.70231C8.13333 10.7286 8.96527 11.5605 9.99151 11.5605H10.0064C11.0326 11.5605 11.8646 10.7286 11.8646 9.70231C11.8646 8.67606 11.0326 7.84413 10.0064 7.84413H9.99151Z"
                              fill="#98A2B3"
                            />
                          </svg>
                          <svg
                            v-else
                            class="fill-current"
                            width="20"
                            height="20"
                            viewBox="0 0 20 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              fill-rule="evenodd"
                              clip-rule="evenodd"
                              d="M4.63803 3.57709C4.34513 3.2842 3.87026 3.2842 3.57737 3.57709C3.28447 3.86999 3.28447 4.34486 3.57737 4.63775L4.85323 5.91362C3.74609 6.84199 2.89363 8.06395 2.4155 9.45936C2.3615 9.61694 2.3615 9.78801 2.41549 9.94558C3.49488 13.0957 6.48191 15.3619 10.0002 15.3619C11.255 15.3619 12.4422 15.0737 13.4994 14.5598L15.3625 16.4229C15.6554 16.7158 16.1302 16.7158 16.4231 16.4229C16.716 16.13 16.716 15.6551 16.4231 15.3622L4.63803 3.57709ZM12.3608 13.4212L10.4475 11.5079C10.3061 11.5423 10.1584 11.5606 10.0064 11.5606H9.99151C8.96527 11.5606 8.13333 10.7286 8.13333 9.70237C8.13333 9.5461 8.15262 9.39434 8.18895 9.24933L5.91885 6.97923C5.03505 7.69015 4.34057 8.62704 3.92328 9.70247C4.86803 12.1373 7.23361 13.8619 10.0002 13.8619C10.8326 13.8619 11.6287 13.7058 12.3608 13.4212ZM16.0771 9.70249C15.7843 10.4569 15.3552 11.1432 14.8199 11.7311L15.8813 12.7925C16.6329 11.9813 17.2187 11.0143 17.5849 9.94561C17.6389 9.78803 17.6389 9.61696 17.5849 9.45938C16.5055 6.30925 13.5184 4.04303 10.0002 4.04303C9.13525 4.04303 8.30244 4.17999 7.52218 4.43338L8.75139 5.66259C9.1556 5.58413 9.57311 5.54303 10.0002 5.54303C12.7667 5.54303 15.1323 7.26768 16.0771 9.70249Z"
                              fill="#98A2B3"
                            />
                          </svg>
                        </span>
                      </div>
                    </div>
                    <!-- Checkbox -->
                    <div class="flex items-center justify-between">
                      <div>
                        <label
                          for="keepLoggedIn"
                          class="flex items-center text-sm font-normal text-gray-700 cursor-pointer select-none dark:text-gray-400"
                        >
                          <div class="relative">
                            <input
                              v-model="keepLoggedIn"
                              type="checkbox"
                              id="keepLoggedIn"
                              class="sr-only"
                            />
                            <div
                              :class="
                                keepLoggedIn
                                  ? 'border-brand-500 bg-brand-500'
                                  : 'bg-transparent border-gray-300 dark:border-gray-700'
                              "
                              class="mr-3 flex h-5 w-5 items-center justify-center rounded-md border-[1.25px]"
                            >
                              <span :class="keepLoggedIn ? '' : 'opacity-0'">
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 14 14"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M11.6666 3.5L5.24992 9.91667L2.33325 7"
                                    stroke="white"
                                    stroke-width="1.94437"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                  />
                                </svg>
                              </span>
                            </div>
                          </div>
                          {{ t('auth.signin.rememberMe') }}
                        </label>
                      </div>
                      <router-link
                        to="/reset-password"
                        class="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                        >{{ t('auth.signin.forgotPassword') }}</router-link
                      >
                    </div>
                    <!-- Button -->
                    <div>
                      <button
                        type="submit"
                        :disabled="isLoading"
                        class="flex items-center justify-center w-full px-4 py-3.5 text-base font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation sm:text-sm sm:py-3"
                      >
                        {{ isLoading ? t('auth.signin.loggingIn') : t('auth.signin.login') }}
                      </button>
                    </div>
                  </div>
                </form>
                <div class="mt-5">
                  <p
                    class="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start"
                  >
                    {{ t('auth.signin.noAccount') }}
                    <router-link
                      to="/signup"
                      class="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                      >{{ t('auth.signin.signup') }}</router-link
                    >
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          class="relative items-center hidden w-full h-full lg:w-1/2 lg:grid bg-cover bg-center bg-no-repeat"
          style="background-image: url('/images/background.png');"
        >
          <div class="absolute inset-0 bg-black/20 dark:bg-black/40"></div>
          <div class="relative flex items-center justify-center z-1 w-full h-full">
            <div class="flex flex-col items-center max-w-md">
              <router-link to="/" class="block mb-4">
                <img width="350" height="73" src="/images/logo/logo.png" alt="Growatt VietNam" class="object-contain" />
              </router-link>
              <p class="text-center text-gray-100 dark:text-white/90">
                {{ t('auth.signin.tagline') }}
              </p>
            </div>
          </div>
          <!-- Version -->
          <div class="absolute bottom-4 right-4 z-10">
            <span class="text-sm text-gray-200 dark:text-gray-300">V1.02</span>
          </div>
        </div>
      </div>
    </div>
  </FullScreenLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import CommonGridShape from '@/components/common/CommonGridShape.vue'
import FullScreenLayout from '@/components/layout/FullScreenLayout.vue'
import LanguageSwitcher from '@/components/common/LanguageSwitcher.vue'
import { login } from '@/composables/useAuth'

const router = useRouter()
const { t } = useI18n()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const keepLoggedIn = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

const handleSubmit = async () => {
  if (!email.value || !password.value) {
    errorMessage.value = t('auth.signin.errors.emptyFields')
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const success = await login(email.value, password.value)
    if (success) {
      router.push('/')
    } else {
      errorMessage.value = t('auth.signin.errors.invalidCredentials')
    }
  } catch (error) {
    errorMessage.value = t('auth.signin.errors.generic')
    console.error('Login error:', error)
  } finally {
    isLoading.value = false
  }
}
</script>
