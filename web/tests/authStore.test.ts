import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '../src/stores/authStore'
function storage() { const data = new Map<string, string>(); return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => data.set(k, v), removeItem: (k: string) => data.delete(k) } }
const token = (claims: object) => 'e30.' + Buffer.from(JSON.stringify(claims)).toString('base64url') + '.signature'
beforeEach(() => { vi.stubGlobal('sessionStorage', storage()); vi.stubGlobal('localStorage', storage()); setActivePinia(createPinia()) })
describe('FBS session identity', () => {
  it('uses the FBS identity and role', () => { const auth = useAuthStore(); auth.setToken(token({ id: 42, exp: Date.now() / 1000 + 3600, globalRole: 'ADMIN' })); expect(auth.decodedToken?.id).toBe(42); expect(auth.decodedToken?.globalRole).toBe('ADMIN') })
  it('clears malformed and expired tokens without crashing', () => { const auth = useAuthStore(); auth.setToken('invalid'); expect(auth.token).toBeNull(); auth.setToken(token({ id: 1, exp: 1 })); expect(auth.decodedToken).toBeNull() })
  it('clears refresh credentials on logout', () => { sessionStorage.setItem('aqc.refreshToken', 'secret'); useAuthStore().clearToken(); expect(sessionStorage.getItem('aqc.refreshToken')).toBeNull() })
})
