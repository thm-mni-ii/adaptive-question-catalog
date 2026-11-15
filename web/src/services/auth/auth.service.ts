import axios from 'axios'
import type { FbsTokens } from '@/services/api/types/auth'
import { useAuthStore } from '@/stores/authStore'
const client = axios.create({ baseURL: '/api_v2/auth', timeout: 15000 })
export default {
  validateToken: () => client.get<boolean>('/validate', { headers: { Authorization: 'Bearer ' + useAuthStore().token } }),
  exchangeCode: (code: string, codeVerifier: string, redirectUri: string) => client.post<FbsTokens>('/token', { code, codeVerifier, redirectUri }),
  refreshTokens: (refreshToken: string) => client.post<FbsTokens>('/refresh', { refreshToken })
}
