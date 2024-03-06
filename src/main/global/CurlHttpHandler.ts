import { HttpChain, HttpCorsHandler, HttpHandler, HttpMetricsHandler, StandardHttpHandler } from '@nodescript/http-server';
import { dep } from 'mesh-ioc';

import { CurlRequestHandler } from './CurlRequestHandler.js';

export class CurlHttpHandler extends HttpChain {

    @dep() private standardHttpHandler!: StandardHttpHandler;
    @dep() private corsHandler!: HttpCorsHandler;
    @dep() private metricsHandler!: HttpMetricsHandler;
    @dep() private curlRequestHandler!: CurlRequestHandler;

    private corsConfigHandler: HttpHandler = {
        async handle(ctx, next) {
            ctx.state.corsExposeHeaders = 'Content-Length,Date,X-Curl-Status,X-Curl-Headers';
            ctx.state.corsAllowCredentials = false;
            await next();
        },
    };

    handlers: HttpHandler[] = [
        this.standardHttpHandler,
        this.corsConfigHandler,
        this.corsHandler,
        this.metricsHandler,
        this.curlRequestHandler,
    ];

}
