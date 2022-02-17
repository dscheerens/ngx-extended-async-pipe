/**
 * Base class for errors that are thrown by `ExtendedAsyncPipe` instances.
 */
export class AsyncPipeError extends Error {
    constructor(
        /** Message describing what went wrong. */
        message: string,

        /** Origin of the error. This can be anything but usually is another `Error` instance. */
        public readonly cause?: unknown,
    ) {
        super(formatErrorMessage(message, cause));
    }
}

function formatErrorMessage(message: string, cause: unknown): string {
    const causeMessage =
        typeof cause === 'string'
            ? cause :
        cause instanceof Error && cause.message
            ? cause.message :
        cause !== undefined
            ? String(cause)
            : undefined;

    return `AsyncPipeError: ${causeMessage !== undefined ? `${message}, cause: ${cause}` : message}`;
}
