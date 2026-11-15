import { webcrypto, createHash } from 'node:crypto'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

vi.mock('@/composables/useBearerToken', () => ({ useBearerToken: vi.fn() }))
vi.mock('@/services/auth/auth.service', () => ({ default: {} }))
vi.mock('@/services/auth/fbsBridge', () => ({ expiresAt: vi.fn() }))

let assign: ReturnType<typeof vi.fn>
let setItem: ReturnType<typeof vi.fn>
beforeEach(() => {
  vi.resetModules()
  assign = vi.fn()
  setItem = vi.fn()
  vi.stubGlobal('crypto', webcrypto)
  vi.stubGlobal('window', {
    location: { origin: 'http://localhost:8086', assign },
    AQC_CONFIG: { fbsOrigin: 'http://localhost:8083', providerId: 'adaptive-question-catalog' }
  })
  vi.stubGlobal('sessionStorage', { setItem })
})
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs() })

it('redirects to the configured FBS with an S256 challenge matching the stored verifier', async () => {
  const oidc = await import('../src/services/auth/fbsOidc')
  await oidc.signInWithFeedbacksystem('/courses')
  const url = new URL(assign.mock.calls[0][0])
  const saved = JSON.parse(setItem.mock.calls[0][1])
  expect(url.origin).toBe('http://localhost:8083')
  expect(url.pathname).toBe('/oauth2/authorize')
  expect(url.searchParams.get('client_id')).toBe('adaptive-question-catalog')
  expect(url.searchParams.get('redirect_uri')).toBe('http://localhost:8086/oauth2/callback')
  expect(url.searchParams.get('state')).toBe(saved.state)
  expect(url.searchParams.get('code_challenge_method')).toBe('S256')
  expect(url.searchParams.get('code_challenge')).toBe(createHash('sha256').update(saved.verifier).digest('base64url'))
  expect(saved.returnTo).toBe('/courses')
  expect(oidc.standaloneSignInError.value).toBeNull()
})

it('explains the secure-context requirement when Web Crypto is unavailable before redirect', async () => {
  vi.stubGlobal('crypto', { getRandomValues: webcrypto.getRandomValues.bind(webcrypto) })
  const oidc = await import('../src/services/auth/fbsOidc')
  await oidc.signInWithFeedbacksystem()
  expect(oidc.standaloneSignInError.value).toContain('http://localhost:8086/login')
  expect(oidc.standaloneSigningIn.value).toBe(false)
  expect(assign).not.toHaveBeenCalled()
  expect(setItem).not.toHaveBeenCalled()
})

it('identifies missing provider configuration', async () => {
  vi.stubGlobal('window', { location: { origin: 'http://localhost:8086', assign }, AQC_CONFIG: { fbsOrigin: 'http://localhost:8083' } })
  vi.stubEnv('VITE_FBS_PROVIDER_ID', '')
  const oidc = await import('../src/services/auth/fbsOidc')
  await oidc.signInWithFeedbacksystem()
  expect(oidc.standaloneSignInError.value).toContain('VITE_FBS_PROVIDER_ID')
  expect(assign).not.toHaveBeenCalled()
})

it('identifies blocked session storage without redirecting', async () => {
  setItem.mockImplementation(() => { throw new DOMException('Blocked', 'SecurityError') })
  const oidc = await import('../src/services/auth/fbsOidc')
  await oidc.signInWithFeedbacksystem()
  expect(oidc.standaloneSignInError.value).toContain('session storage')
  expect(oidc.standaloneSigningIn.value).toBe(false)
  expect(assign).not.toHaveBeenCalled()
})
