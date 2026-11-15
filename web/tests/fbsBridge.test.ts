import 'vue'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
const store = vi.hoisted(() => ({ token: { value: '' }, persistToken: vi.fn() }))
vi.mock('@/composables/useBearerToken', () => ({ useBearerToken: () => ({ bearerToken: store.token, persistToken: store.persistToken }) }))
let listener: (event: MessageEvent) => void
let parent: { postMessage: ReturnType<typeof vi.fn> }
beforeEach(() => {
  vi.resetModules(); vi.useFakeTimers(); store.token.value = ''
  parent = { postMessage: vi.fn() }
  vi.stubGlobal('window', { self: {}, top: {}, parent, AQC_CONFIG: { fbsOrigin: 'https://fbs.test', providerId: 'adaptive-question-catalog' }, addEventListener: (_type: string, fn: typeof listener) => { listener = fn } })
  vi.stubGlobal('document', { addEventListener: vi.fn(), visibilityState: 'visible' })
})
afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals() })
it('rejects messages from a different origin or sender window', async () => {
  const bridge = await import('../src/services/auth/fbsBridge')
  const pending = bridge.startFbsBridge()
  listener({ source: parent, origin: 'https://attacker.test', data: { type: 'FBS_AUTH_TOKEN_RESPONSE', accessToken: 'bad' } } as unknown as MessageEvent)
  listener({ source: {}, origin: 'https://fbs.test', data: { type: 'FBS_AUTH_TOKEN_RESPONSE', accessToken: 'bad' } } as MessageEvent)
  await vi.advanceTimersByTimeAsync(10000)
  expect(await pending).toBeNull(); expect(store.token.value).toBe('')
})
it('accepts the configured host token after handshake', async () => {
  const bridge = await import('../src/services/auth/fbsBridge')
  const pending = bridge.startFbsBridge()
  expect(parent.postMessage).toHaveBeenCalledWith(expect.objectContaining({ type: 'FBS_INIT_HANDSHAKE', payload: expect.objectContaining({ providerId: 'adaptive-question-catalog' }) }), 'https://fbs.test')
  listener({ source: parent, origin: 'https://fbs.test', data: { type: 'FBS_AUTH_TOKEN_RESPONSE', accessToken: 'host-token' } } as unknown as MessageEvent)
  expect(await pending).toBe('host-token'); expect(store.token.value).toBe('host-token')
})
