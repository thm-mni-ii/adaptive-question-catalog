import { defineStore } from 'pinia'
import { ref } from 'vue'
import { jwtDecode } from 'jwt-decode'
import type JwtToken from '@/model/JwtToken'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null)
  const decodedToken = ref<JwtToken | null>(null)
  const clearToken = () => {
    token.value = null
    decodedToken.value = null
    sessionStorage.removeItem('aqc.token')
    sessionStorage.removeItem('aqc.refreshToken')
  }
  const setToken = (value: string) => {
    try {
      const claims = jwtDecode<JwtToken>(value)
      if (claims.id == null || !claims.exp || claims.exp * 1000 <= Date.now()) throw new Error('Invalid token')
      token.value = value
      decodedToken.value = claims
      sessionStorage.setItem('aqc.token', value)
    } catch { clearToken() }
  }
  const saved = sessionStorage.getItem('aqc.token')
  if (saved) setToken(saved)
  // Retire the former query-string/developer-token login.
  localStorage.removeItem('jsessionid')
  localStorage.removeItem('userId')
  return { token, decodedToken, setToken, clearToken }
})
