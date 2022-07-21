/** Special value to represent the absence of a value. Useful in places where `undefined` and `null` cannot be used for this purpose. */
export const nothing = Symbol('nothing'); // eslint-disable-line @typescript-eslint/naming-convention

/** Unique type of the `nothing` value. */
export type Nothing = typeof nothing;
