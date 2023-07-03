
import { Injectable, Inject, InjectionToken } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface BlestRequestState {
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
  private headers: any;

  constructor(@Inject(BLEST_SERVICE_CONFIG) config: BlestServiceConfig) {
    this.url = config.url;
    this.headers = config.headers;
  }

  private enqueue(id: string, route: string, parameters: any, selector: any): void {
    if (this.timeout) {
      window.clearTimeout(this.timeout);
    }

    const newState: BlestGlobalState = { ...this.state }
    newState[id] = {
      loading: false,
      error: null,
      data: null
    };
    this.state = newState;
    this.state$.next(newState);

    this.queue.push([id, route, parameters || null, selector || null]);

    this.timeout = window.setTimeout(() => {
      this.processQueue();
    }, 1);
  }

  private processQueue(): void {
    if (this.queue.length > 0) {

      const headers = this.headers && typeof this.headers === 'object' ? this.headers : {};

      const myQueue = this.queue.map((q) => [...q]);
      const requestIds = myQueue.map((q) => q[0]);
      this.queue = [];

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
          ...headers,
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
      map((state) => state[id]),
      map((state) => state ? ({ ...state }) : { data: null, error: null, loading: false })
    );
  }

  command(route: string, selector?: any): [any, Observable<BlestRequestState>] {
    let id: string = '';
    const execute = (parameters: any) => {
      id = uuidv4();
      this.enqueue(id, route, parameters, selector);
    }
    return [execute, this.state$.pipe(
      map((state) => state[id]),
      map((state) => state ? ({ ...state }) : { data: null, error: null, loading: false })
    )];
  }

  ngOnDestroy(): void {
    if (this.timeout) {
      window.clearTimeout(this.timeout);
    }
  }
}
