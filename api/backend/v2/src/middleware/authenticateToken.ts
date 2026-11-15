import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { createPublicKey } from 'crypto';

export interface AuthenticatedUser { username: string; id: number; globalRole?: string }
declare global { namespace Express { interface Request { user?: AuthenticatedUser } } }
type SigningKey = { kty: string; n: string; e: string; kid?: string; alg?: string; use?: string };
let cache: { uri: string; until: number; keys: SigningKey[] } | undefined;
let loading: Promise<void> | undefined;

export async function verifyFbsToken(token: string): Promise<AuthenticatedUser> {
  // Symmetric fixtures are accepted only by the automated test process.
  const testing = process.env.NODE_ENV === 'test' && process.env.JWT_ALGORITHM === 'HS256';
  let key: string;
  const issuer = process.env.JWT_ISSUER;
  if (testing) key = process.env.JWT_SECRET || '';
  else {
    const header = jwt.decode(token, { complete: true })?.header;
    if (header?.alg !== 'RS256' || !header.kid || !issuer) throw new Error('Invalid JWT configuration or header');
    const uri = process.env.JWT_JWKS_URI || 'http://localhost:8080/oauth2/jwks';
    if (!cache || cache.uri !== uri || cache.until <= Date.now()) {
      loading ??= (async () => {
        const response = await fetch(uri, { signal: AbortSignal.timeout(5000), redirect: 'error' });
        if (!response.ok) throw new Error('JWKS unavailable');
        const body = await response.json() as { keys?: SigningKey[] };
        if (!Array.isArray(body.keys)) throw new Error('Invalid JWKS');
        cache = { uri, until: Date.now() + 60000, keys: body.keys };
      })().finally(() => { loading = undefined; });
      await loading;
    }
    const jwk = cache?.keys.find(k => k.kid === header.kid && k.kty === 'RSA' && (!k.alg || k.alg === 'RS256') && (!k.use || k.use === 'sig'));
    if (!jwk) throw new Error('Unknown signing key');
    key = createPublicKey({ key: jwk, format: 'jwk' }).export({ type: 'spki', format: 'pem' }).toString();
  }
  const audience = process.env.JWT_AUDIENCE?.split(',').map(s => s.trim()).filter(Boolean);
  const claims = jwt.verify(token, key, {
    algorithms: [testing ? 'HS256' : 'RS256'],
    ...(issuer && !testing ? { issuer } : {}),
    ...(audience?.length && !testing ? { audience: audience as [string, ...string[]] } : {}),
    clockTolerance: 5
  }) as JwtPayload;
  if (typeof claims !== 'object' || (!testing && typeof claims.exp !== 'number') ||
      !['string', 'number'].includes(typeof claims.id) || !Number.isSafeInteger(Number(claims.id)) || Number(claims.id) <= 0) throw new Error('Missing identity');
  return { id: Number(claims.id), username: String(claims.username ?? claims.sub ?? claims.id), globalRole: claims.globalRole };
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const match = /^Bearer (\S+)$/i.exec(req.headers.authorization ?? '');
  if (!match) { res.sendStatus(401); return; }
  try { req.user = await verifyFbsToken(match[1]); next(); }
  catch { res.sendStatus(401); }
};
