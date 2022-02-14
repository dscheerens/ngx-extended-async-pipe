import { Subscribable, Unsubscribable } from 'rxjs';

import { AsyncPipeError } from './async-pipe-error.model';
import { AsyncSource } from './async-source.model';

export interface AsyncSourceSubscriptionStrategy<T> {
    subscribe(next: (value: T) => void, error: (error: unknown) => void): Unsubscribable;
}

export function createAsyncSourceSubscriptionStrategy<T>(
    asyncSource: AsyncSource<T> | undefined,
    emptyValue: T,
): AsyncSourceSubscriptionStrategy<T> {
    if (asyncSource === undefined) {
        return new NullAsyncSourceSubscriptionStrategy(emptyValue);
    }

    if (isSubscribable<T>(asyncSource)) {
        return new SubscribableAsyncSourceSubscriptionStrategy(asyncSource);
    }

    if (isPromise<T>(asyncSource)) {
        return new PromiseAsyncSourceSubscriptionStrategy(asyncSource);
    }

    throw new AsyncPipeError(`'${asyncSource}' is not a valid asynchronous data source`);
}

class SubscribableAsyncSourceSubscriptionStrategy<T> implements AsyncSourceSubscriptionStrategy<T> {
    constructor(private readonly subscribable: Subscribable<T>) {}

    public subscribe(next: (value: T) => void, error: (error: unknown) => void): Unsubscribable {
        return this.subscribable.subscribe({ next, error });
    }
}

class PromiseAsyncSourceSubscriptionStrategy<T> implements AsyncSourceSubscriptionStrategy<T> {
    private isClosed = false;

    constructor(private readonly promise: Promise<T>) {}

    public subscribe(next: (value: T) => void, error: (error: unknown) => void): Unsubscribable {
        this.promise.then(
            (value) => {
                if (!this.isClosed) {
                    next(value);
                }
            },
            (reason) => {
                if (!this.isClosed) {
                    error(reason);
                }
            },
        );

        return { unsubscribe: () => this.isClosed = true };
    }
}

class NullAsyncSourceSubscriptionStrategy<T> implements AsyncSourceSubscriptionStrategy<T> {
    constructor(private readonly emptyValue: T) {}

    public subscribe(next: (value: T) => void): Unsubscribable {
        next(this.emptyValue);

        return { unsubscribe(): void { } };
    }
}

function isSubscribable<T = unknown>(value: any): value is Subscribable<T> { // tslint:disable-line:no-any
    return !!value && typeof value.subscribe === 'function';
}

function isPromise<T = unknown>(value: any): value is Promise<T> { // tslint:disable-line:no-any
    return !!value && typeof value.then === 'function';
}
