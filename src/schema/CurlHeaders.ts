import { Schema } from 'airtight';

export type CurlHeaders = Record<string, string | string[]>;

export const CurlHeadersSchema = new Schema<CurlHeaders>({
    type: 'object',
    properties: {},
    additionalProperties: { type: 'any' },
});
