import { HttpCorsHandler, HttpErrorHandler, HttpMetricsHandler, HttpServer, HttpStatusHandler } from '@nodescript/http-server';
import { Logger } from '@nodescript/logger';
import { BaseApp, StandardLogger } from '@nodescript/microframework';
import { Config, ProcessEnvConfig } from 'mesh-config';
import { dep, Mesh } from 'mesh-ioc';

import { CurlHandler } from './global/CurlHandler.js';
import { MainHttpServer } from './global/MainHttpServer.js';
import { Metrics } from './Metrics.js';

export class App extends BaseApp {

    @dep() private httpServer!: HttpServer;

    constructor() {
        super(new Mesh('App'));
        this.mesh.service(Config, ProcessEnvConfig);
        this.mesh.service(Logger, StandardLogger);
        this.mesh.service(Metrics);
        this.mesh.service(HttpServer, MainHttpServer);
        this.mesh.service(HttpErrorHandler);
        this.mesh.service(HttpCorsHandler);
        this.mesh.service(HttpMetricsHandler);
        this.mesh.service(HttpStatusHandler);
        this.mesh.service(CurlHandler);
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
