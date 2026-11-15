import { request as httpRequest } from 'http';
import { request as httpsRequest } from 'https';

// Node fetch overrides Host. Native HTTP preserves the public FBS origin when
// Docker connects through host.docker.internal; never follow token redirects.
export function requestTokens(form: URLSearchParams): Promise<{ status: number; body: Record<string, unknown> }> {
  return new Promise((resolve, reject) => {
    const url = new URL(process.env.OIDC_TOKEN_URI || 'http://localhost:8083/oauth2/token');
    if (!['http:', 'https:'].includes(url.protocol)) { reject(new Error('Invalid OIDC URL')); return; }
    const data = form.toString();
    const request = (url.protocol === 'https:' ? httpsRequest : httpRequest)(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(data),
        ...(process.env.OIDC_TOKEN_HOST ? { Host: process.env.OIDC_TOKEN_HOST } : {})
      }
    }, response => {
      const chunks: Buffer[] = [];
      let size = 0;
      response.on('data', (chunk: Buffer) => {
        size += chunk.length;
        if (size > 65536) { response.destroy(new Error('OIDC response too large')); return; }
        chunks.push(chunk);
      });
      response.on('error', reject);
      response.on('end', () => {
        try { resolve({ status: response.statusCode || 503, body: JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}') }); }
        catch { reject(new Error('Invalid OIDC response')); }
      });
    });
    const timer = setTimeout(() => request.destroy(new Error('OIDC timeout')), 15000);
    request.on('close', () => clearTimeout(timer));
    request.on('error', reject);
    request.end(data);
  });
}
