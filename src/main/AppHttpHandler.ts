import { HttpChain, HttpCorsHandler, HttpHandler, HttpMetricsHandler, StandardHttpHandler } from '@nodescript/http-server';
import { dep } from 'mesh-ioc';

import { HttpCurlHandler } from './HttpCurlHandler.js';

export class AppHttpHandler extends HttpChain {

    @dep() private standardHttpHandler!: StandardHttpHandler;
    @dep() private corsHandler!: HttpCorsHandler;
    @dep() private metricsHandler!: HttpMetricsHandler;
    @dep() private httpCurlHandler!: HttpCurlHandler;

    handlers: HttpHandler[] = [
        this.standardHttpHandler,
        this.corsHandler,
        this.metricsHandler,
        this.httpCurlHandler,
    ];

}
