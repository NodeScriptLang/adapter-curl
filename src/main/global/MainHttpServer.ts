import { HttpChain, HttpContext, HttpCorsHandler, HttpHandler, HttpMetricsHandler, HttpNext, HttpServer, StandardHttpHandler } from '@nodescript/http-server';
import { dep } from 'mesh-ioc';

import { CurlHandler } from './CurlHandler.js';

export class MainHttpServer extends HttpServer {

    @dep() private standardHttpHandler!: StandardHttpHandler;
    @dep() private corsHandler!: HttpCorsHandler;
    @dep() private metricsHandler!: HttpMetricsHandler;
    @dep() private curlRequestHandler!: CurlHandler;

    private corsConfigHandler: HttpHandler = {
        async handle(ctx, next) {
            ctx.state.corsExposeHeaders = 'Content-Length,Date,X-Curl-Status,X-Curl-Headers';
            ctx.state.corsAllowCredentials = false;
            await next();
        },
    };

    handler = new HttpChain([
        this.standardHttpHandler,
        this.corsConfigHandler,
        this.corsHandler,
        this.metricsHandler,
        this.curlRequestHandler,
    ]);

    async handle(ctx: HttpContext, next: HttpNext) {
        await this.handler.handle(ctx, next);
    }

}
