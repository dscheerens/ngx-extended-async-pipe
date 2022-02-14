import { Nothing } from './nothing.model';

export type Something<T> = T extends Nothing ? never : T;
