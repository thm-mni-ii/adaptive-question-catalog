import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'

export function getAuthenticatedStudentId(): string {
  const id = useAuthStore().decodedToken?.id
  if (id == null) throw new Error('Bitte zuerst über das Feedbacksystem anmelden.')
  return String(id)
}
const apiV2 = axios.create({ baseURL: '/api_v2', timeout: 15000 })
apiV2.interceptors.request.use((config) => {
  const token = useAuthStore().token
  if (token) config.headers.Authorization = 'Bearer ' + token
  return config
})
apiV2.interceptors.response.use(undefined, async (error) => {
  const config = error.config
  if (error.response?.status === 401 && config && !config.fbsRetried) {
    config.fbsRetried = true
    const { isEmbedded, requestFbsToken } = await import('./auth/fbsBridge')
    const { renewFeedbacksystemToken } = await import('./auth/fbsOidc')
    if (await (isEmbedded ? requestFbsToken() : renewFeedbacksystemToken())) return apiV2.request(config)
    useAuthStore().clearToken()
    const { default: router } = await import('@/router')
    await router.replace({ path: '/login', query: { returnTo: router.currentRoute.value.fullPath } })
  }
  return Promise.reject(error)
})
export default apiV2
