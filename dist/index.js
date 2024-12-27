import { __awaiter, __decorate, __param } from "tslib";
import { Injectable, Inject, InjectionToken } from '@angular/core';
import { v1 as uuid } from 'uuid';
import { BehaviorSubject } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import isEqual from 'lodash/isEqual';
const BLEST_SERVICE_CONFIG = new InjectionToken('blestServiceConfig');
let BlestService = class BlestService {
    constructor(config) {
        this.queue = [];
        this.state = {};
        this.state$ = new BehaviorSubject({});
        this.timeout = null;
        this.makeBlestHeaders = (options) => {
            const headers = {};
            if (!options)
                return headers;
            if (options.select && Array.isArray(options.select)) {
                headers._s = options.select;
            }
            return headers;
        };
        this.url = config.url;
        this.maxBatchSize = config.maxBatchSize && typeof config.maxBatchSize === 'number' && config.maxBatchSize > 0 && Math.round(config.maxBatchSize) === config.maxBatchSize ? config.maxBatchSize : 25;
        this.bufferDelay = config.bufferDelay && typeof config.bufferDelay === 'number' && config.bufferDelay > 0 && Math.round(config.bufferDelay) === config.bufferDelay ? config.bufferDelay : 10;
        this.httpHeaders = config.httpHeaders && typeof config.httpHeaders === 'object' ? config.httpHeaders : {};
    }
    enqueue(id, route, body, headers) {
        const newState = Object.assign({}, this.state);
        newState[id] = {
            loading: true,
            error: null,
            data: null
        };
        this.state = newState;
        this.state$.next(newState);
        this.queue.push([id, route, body || null, headers || null]);
        if (!this.timeout) {
            this.timeout = window.setTimeout(() => { this.processQueue(); }, this.bufferDelay);
        }
    }
    processQueue() {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
        if (!this.queue.length) {
            return;
        }
        const copyQueue = this.queue.map((q) => [...q]);
        this.queue = [];
        const batchCount = Math.ceil(copyQueue.length / this.maxBatchSize);
        for (let i = 0; i < batchCount; i++) {
            const myQueue = copyQueue.slice(i * this.maxBatchSize, (i + 1) * this.maxBatchSize);
            const requestIds = myQueue.map((q) => q[0]);
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
                headers: Object.assign(Object.assign({}, this.httpHeaders), { 'Content-Type': 'application/json', Accept: 'application/json' })
            })
                .then((result) => __awaiter(this, void 0, void 0, function* () {
                const results = yield result.json();
                const newState = Object.assign({}, this.state);
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
            }))
                .catch((error) => {
                const newState = Object.assign({}, this.state);
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
    request(route, body, options) {
        let id = uuid();
        if (!(options === null || options === void 0 ? void 0 : options.skip)) {
            const headers = this.makeBlestHeaders(options);
            this.enqueue(id, route, body, headers);
        }
        const refresh = () => {
            id = uuid();
            const headers = this.makeBlestHeaders(options);
            this.enqueue(id, route, body, headers);
        };
        return this.state$.pipe(map((state) => state[id]), map((state) => state ? (Object.assign(Object.assign({}, state), { refresh })) : { data: null, error: null, loading: false, refresh }), distinctUntilChanged(isEqual));
    }
    lazyRequest(route, options) {
        let id = '';
        const headers = this.makeBlestHeaders(options);
        const execute = (body) => {
            id = uuid();
            this.enqueue(id, route, body, headers);
        };
        return [execute, this.state$.pipe(map((state) => state[id]), map((state) => state ? (Object.assign({}, state)) : { data: null, error: null, loading: false }), distinctUntilChanged(isEqual))];
    }
    ngOnDestroy() {
        if (this.timeout) {
            window.clearTimeout(this.timeout);
        }
    }
};
BlestService = __decorate([
    Injectable({
        providedIn: 'root'
    }),
    __param(0, Inject(BLEST_SERVICE_CONFIG))
], BlestService);
export { BlestService };
