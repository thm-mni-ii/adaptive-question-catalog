import { requestTokens } from './token-request';
import { Router } from 'express';
import { authenticateToken, verifyFbsToken } from '../middleware/authenticateToken';

export function createAuthRouter(): Router {
  const router = Router();
  router.use((_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });
  router.get('/validate', authenticateToken, (_req, res) => { res.json(true); });
  const text = (value: unknown): value is string => typeof value === 'string' && value.length > 0 && value.length <= 8192;
  async function tokens(form: Record<string, string>, res: import('express').Response) {
    try {
      const clientId = process.env.OIDC_CLIENT_ID || 'adaptive-question-catalog';
      const secret = process.env.OIDC_CLIENT_SECRET;
      const body = new URLSearchParams({ ...form, client_id: clientId, ...(secret ? { client_secret: secret } : {}) });
      const response = await requestTokens(body);
      if (response.status !== 200) { res.status(response.status === 400 ? 401 : 503).json({ error: 'FBS-Anmeldung abgelehnt. Bitte Client-Konfiguration prüfen oder erneut anmelden.' }); return; }
      const result = response.body as { access_token?: string; refresh_token?: string; expires_in?: number };
      if (!result.access_token) throw new Error('Missing access token');
      await verifyFbsToken(result.access_token);
      res.json({ accessToken: result.access_token, refreshToken: result.refresh_token, expiresIn: result.expires_in });
    } catch { res.status(503).json({ error: 'FBS nicht erreichbar oder Tokenprüfung fehlgeschlagen.' }); }
  }
  router.post('/token', async (req, res) => {
    const { code, codeVerifier, redirectUri } = req.body ?? {};
    const allowed = (process.env.OIDC_REDIRECT_URIS || 'http://localhost:8086/oauth2/callback').split(',').map(s => s.trim());
    if (!text(code) || !text(codeVerifier) || !/^[A-Za-z0-9._~-]{43,128}$/.test(codeVerifier) || !allowed.includes(redirectUri)) { res.sendStatus(400); return; }
    await tokens({ grant_type: 'authorization_code', code, code_verifier: codeVerifier, redirect_uri: redirectUri }, res);
  });
  router.post('/refresh', async (req, res) => {
    if (!text(req.body?.refreshToken)) { res.sendStatus(400); return; }
    if (!process.env.OIDC_CLIENT_SECRET) { res.status(400).json({ error: 'PUBLIC-Clients erneuern per PKCE, nicht per Refresh-Token.' }); return; }
    await tokens({ grant_type: 'refresh_token', refresh_token: req.body.refreshToken }, res);
  });
  return router;
}
