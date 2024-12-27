
import { Injectable, Inject, InjectionToken } from '@angular/core';
import { v1 as uuid } from 'uuid';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import isEqual from 'lodash/isEqual';

export interface BlestRequestState {
  loading: boolean;
  error: any;
  data: any;
}

interface BlestGlobalState {
  [id: string]: BlestRequestState;
}

type BlestQueueItem = [string, string, any?, any?]

interface BlestServiceConfig {
  url: string
  maxBatchSize?: number
  bufferDelay?: number
  httpHeaders?: any
}

export type BlestSelector = Array<string | BlestSelector>

export interface BlestRequestOptions {
  skip?: boolean
  select?: BlestSelector
}

export interface BlestLazyRequestOptions {
  select?: BlestSelector
}

const BLEST_SERVICE_CONFIG = new InjectionToken<BlestServiceConfig>('blestServiceConfig');

@Injectable({
  providedIn: 'root'
})
export class BlestService {
  private queue: BlestQueueItem[] = [];
  private state: { [id: string]: BlestRequestState } = {};
  private state$ = new BehaviorSubject<{ [id: string]: BlestRequestState }>({});
  private timeout: number | null = null;
  private url: string;
  private maxBatchSize: number;
  private bufferDelay: number;
  private httpHeaders: any;

  constructor(@Inject(BLEST_SERVICE_CONFIG) config: BlestServiceConfig) {
    this.url = config.url;
    this.maxBatchSize = config.maxBatchSize && typeof config.maxBatchSize === 'number' && config.maxBatchSize > 0 && Math.round(config.maxBatchSize) === config.maxBatchSize ? config.maxBatchSize : 25;
    this.bufferDelay = config.bufferDelay && typeof config.bufferDelay === 'number' && config.bufferDelay > 0 && Math.round(config.bufferDelay) === config.bufferDelay ? config.bufferDelay : 10;
    this.httpHeaders = config.httpHeaders && typeof config.httpHeaders === 'object' ? config.httpHeaders : {};
  }

  private enqueue(id: string, route: string, body: any, headers: any): void {
    const newState: BlestGlobalState = { ...this.state }
    newState[id] = {
      loading: true,
      error: null,
      data: null
    };
    this.state = newState;
    this.state$.next(newState);

    this.queue.push([id, route, body || null, headers || null]);

    if (!this.timeout) {
      this.timeout = window.setTimeout(() => { this.processQueue() }, this.bufferDelay);
    }
  }

  private processQueue(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    if (!this.queue.length) {
      return;
    }
    
    const copyQueue: BlestQueueItem[] = this.queue.map((q: BlestQueueItem) => [...q])
    this.queue = [];

    const batchCount = Math.ceil(copyQueue.length / this.maxBatchSize);

    for (let i = 0; i < batchCount; i++) {
      const myQueue = copyQueue.slice(i * this.maxBatchSize, (i + 1) * this.maxBatchSize);
      const requestIds = myQueue.map((q: BlestQueueItem) => q[0]);

      // const newState: BlestGlobalState = { ...this.state };
      // for (let i = 0; i < requestIds.length; i++) {
      //   const id = requestIds[i];
      //   newState[id] = {
      //     loading: true,
      //     error: null,
      //     data: null
      //   };
      // }
      // this.state = newState;
      // this.state$.next(newState);

      fetch(this.url, {
        body: JSON.stringify(myQueue),
        mode: 'cors',
        method: 'POST',
        headers: {
          ...this.httpHeaders,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        }
      })
        .then(async (result) => {
          const results = await result.json();
          const newState: BlestGlobalState = { ...this.state };
          for (let i = 0; i < results.length; i++) {
            const item = results[i];
            newState[item[0]] = {
              loading: false,
              error: item[3],
              data: item[2]
            };
          }
          this.state = newState;
          this.state$.next(newState);
        })
        .catch((error) => {
          const newState: BlestGlobalState = { ...this.state };
          for (let i = 0; i < myQueue.length; i++) {
            const id = requestIds[i];
            newState[id] = {
              loading: false,
              error: error,
              data: null
            };
          }
          this.state = newState;
          this.state$.next(newState);
        });
    }
  }

  makeBlestHeaders = (options?: BlestRequestOptions|BlestLazyRequestOptions) => {
    const headers:any = {}
    if (!options) return headers;
    if (options.select && Array.isArray(options.select)) {
      headers._s = options.select
    }
    return headers
  }

  request(route: string, body?: any, options?: any): Observable<BlestRequestState> {
    let id = uuid();
    if (!options?.skip) {
      const headers = this.makeBlestHeaders(options);
      this.enqueue(id, route, body, headers);
    }
    const refresh = () => {
      id = uuid();
      const headers = this.makeBlestHeaders(options);
      this.enqueue(id, route, body, headers);
    }
    return this.state$.pipe(
      map((state: BlestGlobalState) => state[id]),
      map((state: BlestRequestState) => state ? ({ ...state, refresh }) : { data: null, error: null, loading: false, refresh }),
      distinctUntilChanged(isEqual)
    );
  }

  lazyRequest(route: string, options?: any): [any, Observable<BlestRequestState>] {
    let id: string = '';
    const headers = this.makeBlestHeaders(options);
    const execute = (body: any) => {
      id = uuid();
      this.enqueue(id, route, body, headers);
    }
    return [execute, this.state$.pipe(
      map((state: BlestGlobalState) => state[id]),
      map((state: BlestRequestState) => state ? ({ ...state }) : { data: null, error: null, loading: false }),
      distinctUntilChanged(isEqual)
    )];
  }
  
  ngOnDestroy(): void {
    if (this.timeout) {
      window.clearTimeout(this.timeout);
    }
  }
}
