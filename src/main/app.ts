import { HttpCorsHandler, HttpMetricsHandler, HttpServer, StandardHttpHandler } from '@nodescript/http-server';
import { Logger } from '@nodescript/logger';
import { BaseApp, StandardLogger } from '@nodescript/microframework';
import { Config, ProcessEnvConfig } from 'mesh-config';
import { dep, Mesh } from 'mesh-ioc';

import { CurlHttpHandler } from './global/CurlHttpHandler.js';
import { CurlHttpServer } from './global/CurlHttpServer.js';
import { CurlRequestHandler } from './global/CurlRequestHandler.js';
import { Metrics } from './Metrics.js';

export class App extends BaseApp {

    @dep() private httpServer!: HttpServer;

    constructor() {
        super(new Mesh('App'));
        this.mesh.service(Config, ProcessEnvConfig);
        this.mesh.service(Logger, StandardLogger);
        this.mesh.service(HttpServer, CurlHttpServer);
        this.mesh.service(Metrics);
        this.mesh.service(CurlHttpHandler);
        this.mesh.service(CurlRequestHandler);
        this.mesh.service(HttpCorsHandler);
        this.mesh.service(HttpMetricsHandler);
        this.mesh.service(StandardHttpHandler);
    }

    override async start() {
        await super.start();
        await this.httpServer.start();
    }

    override async stop() {
        await super.stop();
        await this.httpServer.stop();
    }

}
