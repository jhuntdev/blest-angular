import { Observable } from 'rxjs';
export interface BlestRequestState {
    loading: boolean;
    error: any;
    data: any;
}
interface BlestServiceConfig {
    url: string;
    maxBatchSize?: number;
    bufferDelay?: number;
    httpHeaders?: any;
}
export type BlestSelector = Array<string | BlestSelector>;
export interface BlestRequestOptions {
    skip?: boolean;
    select?: BlestSelector;
}
export interface BlestLazyRequestOptions {
    select?: BlestSelector;
}
export declare class BlestService {
    private queue;
    private state;
    private state$;
    private timeout;
    private url;
    private maxBatchSize;
    private bufferDelay;
    private httpHeaders;
    constructor(config: BlestServiceConfig);
    private enqueue;
    private processQueue;
    makeBlestHeaders: (options?: BlestRequestOptions | BlestLazyRequestOptions) => any;
    request(route: string, body?: any, options?: any): Observable<BlestRequestState>;
    lazyRequest(route: string, options?: any): [any, Observable<BlestRequestState>];
    ngOnDestroy(): void;
}
export {};
