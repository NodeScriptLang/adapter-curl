import { HttpContext, HttpRoute, HttpRouter } from '@nodescript/http-server';
import { Logger } from '@nodescript/logger';
import { CounterMetric, HistogramMetric, metric } from '@nodescript/metrics';
import { spawn } from 'child_process';
import { config } from 'mesh-config';
import { dep } from 'mesh-ioc';
import path from 'path';

import { CurlHeaders } from '../../schema/CurlHeaders.js';
import { CurlMethod } from '../../schema/CurlMethod.js';
import { CurlRequestSpec, CurlRequestSpecSchema } from '../../schema/CurlRequestSpec.js';
import { parseJson } from '../util.js';

export class CurlHandler extends HttpRouter {

    @config({ default: 'curl' }) CURL_DEFAULT_PATH!: string;

    @dep() private logger!: Logger;

    @metric()
    private requestLatency = new HistogramMetric<{
        status: number;
        method: string;
        hostname: string;
        error?: string;
    }>('nodescript_curl_service_request_latency', 'NodeScript cURL Service request latency');

    @metric()
    private errors = new CounterMetric<{
        error: string;
        code: string;
    }>('nodescript_curl_service_errors_total', 'NodeScript cURL Service errors');

    routes: HttpRoute[] = [
        ['POST', `/request`, ctx => this.handleRequest(ctx)],
    ];

    async handleRequest(ctx: HttpContext) {
        const startedAt = Date.now();
        const request = this.parseRequestSpec(ctx);
        try {
            const args = this.prepareArgs(request);
            const curlPath = request.options.curlBinary ?
                path.join(path.dirname(this.CURL_DEFAULT_PATH), request.options.curlBinary) :
                this.CURL_DEFAULT_PATH;
            const child = spawn(curlPath, args, {
                stdio: 'pipe',
            });
            if (this.supportsBody(request.method)) {
                ctx.request.pipe(child.stdin);
                ctx.request.once('end', () => child.stdin.end());
            }
            const [stdout, stderr] = await Promise.all([
                this.readStream(child.stdout),
                this.readStderr(child.stderr),
            ]);
            ctx.responseBody = stdout;
            const duration = Date.now() - startedAt;
            ctx.status = 200;
            ctx.addResponseHeader('x-curl-status', String(stderr.response_code));
            ctx.addResponseHeader('x-curl-headers', JSON.stringify(stderr.headers));
            this.logger.info('Request served', {
                url: request.url,
                status: stderr.response_code,
                duration,
            });
            this.requestLatency.addMillis(Date.now() - ctx.startedAt, {
                status: stderr.response_code,
                method: request.method,
                hostname: this.tryParseHostname(request.url),
            });
        } catch (error: any) {
            error.stack = '';
            this.errors.incr(1, {
                error: error.name,
                code: error.code,
            });
            this.logger.warn('Request failed', {
                error,
                method: request.method,
                url: request.url,
            });
            throw new CurlError(error.message, error.code);
        }
    }

    private parseRequestSpec(ctx: HttpContext): CurlRequestSpec {
        return CurlRequestSpecSchema.create({
            method: ctx.getRequestHeader('x-curl-method') as CurlMethod,
            url: ctx.getRequestHeader('x-curl-url'),
            headers: parseJson(ctx.getRequestHeader('x-curl-headers'), {}),
            args: parseJson(ctx.getRequestHeader('x-curl-args'), []),
            options: parseJson(ctx.getRequestHeader('x-curl-options'), {}),
        });
    }

    private supportsBody(method: string) {
        return method === 'POST' || method === 'PUT';
    }

    private prepareArgs(request: CurlRequestSpec) {
        const { method, headers } = request;
        const args = [
            '-X', method,
            // Tell curl to emit response info and response headers into stderr
            // in JSON format, so that we can parse them
            '-w', '%{stderr}%{json}||||%{header_json}',
            // Since we're reading from stderr, we need curl to not emit extra noise
            '--silent',
        ];
        args.push(...this.getHeaderArgs(headers));
        if (this.supportsBody(method)) {
            // We will push request body into stdin, so curl needs to read from it
            args.push('--data-binary', '@-');
        }
        args.push(...request.args);
        args.push(request.url);
        return args;
    }

    private getHeaderArgs(headers: CurlHeaders) {
        const args: string[] = [];
        for (const [key, val] of Object.entries(headers)) {
            const values = Array.isArray(val) ? val : [val];
            for (const value of values) {
                args.push('-H');
                args.push(`${key}: ${value}`);
            }
        }
        return args;
    }

    private async readStderr(stream: NodeJS.ReadableStream) {
        const buf = await this.readStream(stream);
        return this.parseStderr(buf);
    }

    private async readStream(stream: NodeJS.ReadableStream) {
        const chunks: Buffer[] = [];
        for await (const chunk of stream) {
            chunks.push(chunk as Buffer);
        }
        return Buffer.concat(chunks);
    }

    private parseStderr(stderr: Buffer): CurlResponseInfo {
        const str = stderr.toString('utf-8');
        const [infoText, headersText] = str.split('||||');
        return {
            ...JSON.parse(infoText),
            headers: JSON.parse(headersText),
        };
    }

    private tryParseHostname(url: string) {
        try {
            const { hostname } = new URL(url);
            return hostname;
        } catch (_err) {
            return '<invalid url>';
        }
    }

}

export class CurlError extends Error {

    override name = this.constructor.name;
    status = 500;
    details = {};

    constructor(message: string, code?: string) {
        super(message || code || 'Request failed');
        this.details = {
            code,
        };
        this.stack = '';
    }

}

interface CurlResponseInfo {
    'headers': CurlHeaders;
    'url_effective': string;
    'response_code': number;
}
