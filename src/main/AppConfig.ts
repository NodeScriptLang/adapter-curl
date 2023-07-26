import { ProcessEnvConfig } from 'mesh-config';

export class AppConfig extends ProcessEnvConfig {

    constructor() {
        super();
        this.map.set('CORS_EXPOSE_HEADERS', [
            'Content-Length',
            'Date',
            'X-Curl-Status',
            'X-Curl-Headers',
        ].join(','));
    }

}
