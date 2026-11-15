import { createServer, Server } from 'http';
import { AddressInfo } from 'net';
import { requestTokens } from './token-request';
let server: Server;
afterEach(async () => { if (server) await new Promise<void>(resolve => server.close(() => resolve())); delete process.env.OIDC_TOKEN_URI; delete process.env.OIDC_TOKEN_HOST; });
it('preserves the public Host when the transport uses an internal address', async () => {
  let receivedHost: string | undefined;
  let receivedBody = '';
  server = createServer((req, res) => {
    receivedHost = req.headers.host;
    req.on('data', chunk => { receivedBody += chunk; });
    req.on('end', () => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ access_token: 'issued-token' })); });
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  process.env.OIDC_TOKEN_URI = 'http://127.0.0.1:' + (server.address() as AddressInfo).port + '/oauth2/token';
  process.env.OIDC_TOKEN_HOST = 'localhost:8083';
  const response = await requestTokens(new URLSearchParams({ code: 'test-code', grant_type: 'authorization_code' }));
  expect(receivedHost).toBe('localhost:8083');
  expect(receivedBody).toContain('code=test-code');
  expect(response.body.access_token).toBe('issued-token');
});
