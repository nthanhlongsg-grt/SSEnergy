import { useRouter } from 'vue-router'
import { getUserRole, isAuthenticated, refreshUserInfo } from '@/composables/useAuth'
import { getDefaultRouteByRole } from '@/utils/userGroups'
import { useChangeDetection } from '@/composables/useChangeDetection'

/**
 * Poll profile changes so role updates apply without forcing a full reload.
 */
export function useAuthSessionSync() {
  const router = useRouter()

  useChangeDetection({
    interval: 8000,
    onProfileChange: async () => {
      if (!isAuthenticated.value) return

      const previousRole = getUserRole.value
      await refreshUserInfo()
      const nextRole = getUserRole.value

      if (previousRole && nextRole && previousRole !== nextRole) {
        const target = getDefaultRouteByRole(nextRole, true)
        if (router.currentRoute.value.path !== target) {
          await router.replace(target)
        }
      }
    },
  })
}
