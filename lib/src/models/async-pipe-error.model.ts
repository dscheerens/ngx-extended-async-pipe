export class AsyncPipeError extends Error {
    constructor(message: string, public readonly cause?: unknown) {
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
