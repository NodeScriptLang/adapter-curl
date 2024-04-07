import { HttpServer } from '@nodescript/http-server';
import { BaseApp } from '@nodescript/microframework';
import { dep, Mesh } from 'mesh-ioc';

import { CurlHandler } from './global/CurlHandler.js';
import { MainHttpServer } from './global/MainHttpServer.js';

export class App extends BaseApp {

    @dep() private httpServer!: HttpServer;

    constructor() {
        super(new Mesh('App'));
        this.mesh.service(HttpServer, MainHttpServer);
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
