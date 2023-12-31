import { Schema } from 'airtight';

import { CurlHeaders, CurlHeadersSchema } from './CurlHeaders.js';
import { CurlMethod, CurlMethodSchema } from './CurlMethod.js';

export interface CurlRequestSpec {
    url: string;
    method: CurlMethod;
    headers: CurlHeaders;
    args: string[];
    options: Record<string, any>;
}

export const CurlRequestSpecSchema = new Schema<CurlRequestSpec>({
    type: 'object',
    properties: {
        url: { type: 'string' },
        method: CurlMethodSchema.schema,
        headers: CurlHeadersSchema.schema,
        args: {
            type: 'array',
            items: { type: 'string' },
        },
        options: {
            type: 'object',
            properties: {},
            additionalProperties: {
                type: 'any'
            },
        },
    },
});
