import { Observable, Subscribable } from 'rxjs';

/** Asynchronous data source that be used as input for the `async` pipe. */
export type AsyncSource<T> = Observable<T> | Subscribable<T> | Promise<T>;
