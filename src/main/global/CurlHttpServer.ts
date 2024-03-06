import { HttpContext, HttpNext, HttpServer } from '@nodescript/http-server';
import { dep } from 'mesh-ioc';

import { CurlHttpHandler } from './CurlHttpHandler.js';

export class CurlHttpServer extends HttpServer {

    @dep() private handler!: CurlHttpHandler;

    async handle(ctx: HttpContext, next: HttpNext) {
        await this.handler.handle(ctx, next);
    }

}
