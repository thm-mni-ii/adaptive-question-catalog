import { computed } from 'vue'
import { useAuthStore } from '@/stores/authStore'

// Adapter for the shared FBS bridge/OIDC implementation from Modeling Copilot.
export const useBearerToken = () => {
  const auth = useAuthStore()
  const bearerToken = computed({ get: () => auth.token ?? '', set: (token: string) => auth.setToken(token) })
  return { bearerToken, persistToken: () => {}, clearToken: auth.clearToken }
}
