import { CounterMetric, HistogramMetric, metric } from '@nodescript/metrics';

export class Metrics {

    @metric()
    requestLatency = new HistogramMetric<{
        status: number;
        method: string;
        hostname: string;
        error?: string;
    }>('nodescript_curl_service_request_latency', 'NodeScript cURL Service request latency');

    @metric()
    errors = new CounterMetric<{
        error: string;
        code: string;
    }>('nodescript_curl_service_errors_total', 'NodeScript cURL Service errors');

}
