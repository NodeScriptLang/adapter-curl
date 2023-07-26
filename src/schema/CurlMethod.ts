import { Schema } from 'airtight';

export enum CurlMethod {
    GET = 'GET',
    POST = 'POST',
    PUT = 'PUT',
    PATCH = 'PATCH',
    DELETE = 'DELETE',
}

export const CurlMethodSchema = new Schema<CurlMethod>({
    type: 'string',
    enum: Object.values(CurlMethod),
});
