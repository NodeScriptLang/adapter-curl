import { Schema } from 'airtight';

export interface CurlHeaders {
    [key: string]: string | string[];
}

export const CurlHeadersSchema = new Schema<CurlHeaders>({
    type: 'object',
    properties: {},
    additionalProperties: { type: 'any' },
});
