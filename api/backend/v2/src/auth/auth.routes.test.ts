import { requestTokens } from './token-request';
jest.mock('./token-request', () => ({ requestTokens: jest.fn() }));
import { generateKeyPairSync } from 'crypto';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import express from 'express';
import { createAuthRouter } from './auth.routes';

const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const issuer = 'https://fbs.example.test';
const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'test-key', alg: 'RS256', use: 'sig' };
const app = express();
app.use(express.json());
app.use('/api_v2/auth', createAuthRouter());
const token = (claims = {}, options: jwt.SignOptions = {}) => jwt.sign({ id: 42, username: 'learner', globalRole: 'USER', ...claims }, privateKey, { algorithm: 'RS256', keyid: 'test-key', issuer, audience: 'adaptive-question-catalog', expiresIn: '1h', ...options });
let fetchMock: jest.SpyInstance;
beforeEach(() => {
  jest.mocked(requestTokens).mockReset();
  process.env.JWT_ALGORITHM = 'RS256';
  process.env.JWT_ISSUER = issuer;
  process.env.JWT_AUDIENCE = 'adaptive-question-catalog';
  process.env.JWT_JWKS_URI = issuer + '/jwks/' + Math.random();
  process.env.OIDC_REDIRECT_URIS = 'http://localhost:8086/oauth2/callback';
  fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true, json: async () => ({ keys: [jwk] }) } as Response);
});
afterEach(() => { jest.restoreAllMocks(); delete process.env.JWT_AUDIENCE; delete process.env.JWT_ISSUER; process.env.JWT_ALGORITHM = 'HS256'; });
it('accepts an FBS RS256 identity', async () => {
  expect((await request(app).get('/api_v2/auth/validate').auth(token(), { type: 'bearer' })).body).toBe(true);
});
it.each([
  ['wrong issuer', () => token({}, { issuer: 'https://attacker.test' })],
  ['wrong audience', () => token({}, { audience: 'another-app' })],
  ['expired token', () => token({}, { expiresIn: -30 })],
  ['missing identity', () => token({ id: null })],
  ['unsigned token', () => jwt.sign({ id: 42 }, '', { algorithm: 'none' })],
  ['HS confusion', () => jwt.sign({ id: 42 }, 'change-me')],
  ['unknown key', () => token({}, { keyid: 'unknown' })]
])('rejects %s', async (_name, makeToken) => {
  expect((await request(app).get('/api_v2/auth/validate').auth(makeToken(), { type: 'bearer' })).status).toBe(401);
});
it('rejects missing expiry', async () => {
  const value = jwt.sign({ id: 42 }, privateKey, { algorithm: 'RS256', keyid: 'test-key', issuer });
  expect((await request(app).get('/api_v2/auth/validate').auth(value, { type: 'bearer' })).status).toBe(401);
});
it('fails closed when JWKS is unavailable', async () => {
  fetchMock.mockRejectedValue(new Error('offline'));
  expect((await request(app).get('/api_v2/auth/validate').auth(token(), { type: 'bearer' })).status).toBe(401);
});
it('rejects unregistered callback URLs before contacting FBS', async () => {
  const res = await request(app).post('/api_v2/auth/token').send({ code: 'abc', codeVerifier: 'a'.repeat(43), redirectUri: 'https://attacker.test/callback' });
  expect(res.status).toBe(400); expect(fetchMock).not.toHaveBeenCalled();
});
it('exchanges PKCE codes server-side and validates the returned access token', async () => {
  jest.mocked(requestTokens).mockResolvedValue({ status: 200, body: { access_token: token(), expires_in: 3600 } });
  const res = await request(app).post('/api_v2/auth/token').send({ code: 'abc', codeVerifier: 'a'.repeat(43), redirectUri: 'http://localhost:8086/oauth2/callback' });
  expect(res.status).toBe(200); expect(res.body.accessToken).toBeTruthy(); expect(res.headers['cache-control']).toBe('no-store');
});
