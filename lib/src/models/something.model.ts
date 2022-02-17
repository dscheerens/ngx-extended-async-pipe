import { Nothing } from './nothing.model';

/** Excludes `Nothing` from type union `T`. */
export type Something<T> = T extends Nothing ? never : T;
