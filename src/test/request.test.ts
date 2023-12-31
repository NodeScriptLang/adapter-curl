import assert from 'assert';

import { runtime } from './runtime.js';

describe('/request', () => {

    beforeEach(() => runtime.setup());
    afterEach(() => runtime.teardown());

    it('sends GET request', async () => {
        runtime.testHttpServer.requestHandler = (req, res) => {
            assert.strictEqual(req.url, '/foo');
            assert.strictEqual(req.headers['host'], '127.0.0.1:8099');
            assert.strictEqual(req.headers['content-type'], 'text/plain');
            assert.strictEqual(req.headers['cookie'], 'foo=1; bar=2');
            assert.strictEqual(req.headers['x-foo'], 'Bar, Baz');
            res.writeHead(200, {
                'Content-Type': 'text/plain',
                'X-Response-Time': 42,
                'Cache-Control': ['private', 'no-cache'],
            });
            res.end('Hello!');
        };
        const res = await fetch(runtime.baseUrl + '/request', {
            method: 'POST',
            headers: {
                'x-curl-method': 'GET',
                'x-curl-url': 'http://127.0.0.1:8099/foo',
                'x-curl-headers': JSON.stringify({
                    'Content-Type': 'text/plain',
                    'Cookie': 'foo=1; bar=2',
                    'X-Foo': ['Bar', 'Baz'],
                })
            }
        });
        const body = await res.text();
        assert.strictEqual(res.status, 200);
        assert.strictEqual(body, 'Hello!');
        assert.strictEqual(res.headers.get('x-curl-status'), '200');
        const headers = JSON.parse(res.headers.get('x-curl-headers') ?? '');
        assert.strictEqual(headers['content-type'][0], 'text/plain');
        assert.strictEqual(headers['x-response-time'][0], '42');
        assert.strictEqual(headers['cache-control'][0], 'private');
        assert.strictEqual(headers['cache-control'][1], 'no-cache');
    });

    it('sends POST with body', async () => {
        runtime.testHttpServer.requestHandler = async (req, res) => {
            const chunks: Buffer[] = [];
            for await (const chunk of req) {
                chunks.push(chunk);
            }
            const body = Buffer.concat(chunks).toString();
            assert.strictEqual(body, 'Hello World!');
            res.writeHead(200, {});
            res.end();
        };
        const res = await fetch(runtime.baseUrl + '/request', {
            method: 'POST',
            headers: {
                'x-curl-method': 'POST',
                'x-curl-url': 'http://127.0.0.1:8099/foo',
                'x-curl-headers': JSON.stringify({
                    'Content-Type': 'text/plain',
                })
            },
            body: 'Hello World!',
        });
        assert.strictEqual(res.status, 200);
    });

    describe('redirects', () => {

        beforeEach(() => {
            runtime.testHttpServer.requestHandler = async (req, res) => {
                if (req.url === '/redirect') {
                    res.writeHead(302, {
                        location: '/bar/baz',
                    });
                    res.end();
                } else {
                    res.writeHead(200, {});
                    res.end('Hello!');
                }
            };
        });

        it('follows redirect with -L', async () => {
            const res = await fetch(runtime.baseUrl + '/request', {
                method: 'POST',
                headers: {
                    'x-curl-method': 'GET',
                    'x-curl-url': 'http://127.0.0.1:8099/redirect',
                    'x-curl-args': JSON.stringify([
                        '-L'
                    ])
                },
            });
            const body = await res.text();
            assert.strictEqual(body, 'Hello!');
            assert.strictEqual(res.headers.get('x-curl-status'), '200');
        });

        it('does not follow redirect by default', async () => {
            const res = await fetch(runtime.baseUrl + '/request', {
                method: 'POST',
                headers: {
                    'x-curl-method': 'GET',
                    'x-curl-url': 'http://127.0.0.1:8099/redirect',
                },
            });
            const body = await res.text();
            assert.strictEqual(body, '');
            assert.strictEqual(res.headers.get('x-curl-status'), '302');
        });

    });

});
