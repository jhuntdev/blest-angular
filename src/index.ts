
import { Injectable, Inject, InjectionToken } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

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
  headers?: any
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
  private headers: any;

  constructor(@Inject(BLEST_SERVICE_CONFIG) config: BlestServiceConfig) {
    this.url = config.url;
    this.maxBatchSize = config.maxBatchSize && typeof config.maxBatchSize === 'number' && config.maxBatchSize > 0 && Math.round(config.maxBatchSize) === config.maxBatchSize ? config.maxBatchSize : 25;
    this.bufferDelay = config.bufferDelay && typeof config.bufferDelay === 'number' && config.bufferDelay > 0 && Math.round(config.bufferDelay) === config.bufferDelay ? config.bufferDelay : 10;
    this.headers = config.headers && typeof config.headers === 'object' ? config.headers : {};
  }

  private enqueue(id: string, route: string, parameters: any, selector: any): void {
    const newState: BlestGlobalState = { ...this.state }
    newState[id] = {
      loading: false,
      error: null,
      data: null
    };
    this.state = newState;
    this.state$.next(newState);

    this.queue.push([id, route, parameters || null, selector || null]);

    if (!this.timeout) {
      this.timeout = window.setTimeout(this.processQueue, this.bufferDelay);
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

      const newState: BlestGlobalState = { ...this.state };
      for (let i = 0; i < requestIds.length; i++) {
        const id = requestIds[i];
        newState[id] = {
          loading: true,
          error: null,
          data: null
        };
      }
      this.state = newState;
      this.state$.next(newState);

      fetch(this.url, {
        body: JSON.stringify(myQueue),
        mode: 'cors',
        method: 'POST',
        headers: {
          ...this.headers,
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

  request(route: string, parameters?: any, selector?: any): Observable<BlestRequestState> {
    const id = uuidv4();
    this.enqueue(id, route, parameters, selector);
    return this.state$.pipe(
      map((state: BlestGlobalState) => state[id]),
      map((state: BlestRequestState) => state ? ({ ...state }) : { data: null, error: null, loading: false })
    );
  }

  lazyRequest(route: string, selector?: any): [any, Observable<BlestRequestState>] {
    let id: string = '';
    const execute = (parameters: any) => {
      id = uuidv4();
      this.enqueue(id, route, parameters, selector);
    }
    return [execute, this.state$.pipe(
      map((state: BlestGlobalState) => state[id]),
      map((state: BlestRequestState) => state ? ({ ...state }) : { data: null, error: null, loading: false })
    )];
  }

  public command = this.lazyRequest;

  ngOnDestroy(): void {
    if (this.timeout) {
      window.clearTimeout(this.timeout);
    }
  }
}
