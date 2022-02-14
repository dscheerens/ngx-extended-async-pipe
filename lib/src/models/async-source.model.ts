import { Observable, Subscribable } from 'rxjs';

export type AsyncSource<T> = Observable<T> | Subscribable<T> | Promise<T>;
