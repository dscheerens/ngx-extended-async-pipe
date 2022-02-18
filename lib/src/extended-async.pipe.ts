import { ChangeDetectorRef, OnDestroy, Pipe, PipeTransform } from '@angular/core';
import { Unsubscribable } from 'rxjs';

import { AsyncPipeError } from './models/async-pipe-error.model';
import { createAsyncSourceSubscriptionStrategy } from './models/async-source-strategy.model';
import { AsyncSource } from './models/async-source.model';
import { Nothing, nothing } from './models/nothing.model';
import { Something } from './models/something.model';

/**
 * A drop-in replacement for the `async` pipe from `@angular/common` with additional options.
 */
@Pipe({ name: 'async', pure: false })
export abstract class ExtendedAsyncPipe<DefaultValue extends null | undefined> implements OnDestroy, PipeTransform {
    protected abstract readonly defaultValue: DefaultValue;

    private latestValue: AsyncValue = INITIAL_VALUE;
    private lastReturnedValue: unknown;
    private initialValue: unknown;
    private errorValue: unknown;
    private currentSource: AsyncSource<unknown> | undefined | Nothing = nothing;
    private subscription?: Unsubscribable;
    private suppressMarkForCheck = false;
    private initialValueErrorThrown = false;
    private errorValueErrorThrown = false;

    constructor(private readonly changeDetectorRef: ChangeDetectorRef) {}

    public ngOnDestroy(): void {
        this.disposeSubscription();
    }

    /**
     * Unwraps the specified asynchronous data source and returns the last emitted value.
     *
     * @param source Asynchronous data source from which the values are to be obtained.
     */
    public transform(source: null | undefined): DefaultValue;

    /**
     * Unwraps the specified asynchronous data source and returns the last emitted value.
     *
     * @param source Asynchronous data source from which the values are to be obtained.
     */
    public transform<T>(source: AsyncSource<T> | null | undefined): T | DefaultValue;

    /**
     * Unwraps the specified asynchronous data source and returns the last emitted value or the specified initial value.
     *
     * @param source       Asynchronous data source from which the values are to be obtained.
     * @param initialValue Value that will be returned if the data source has not yet emitted any value yet. When this is set to `nothing`
     *                     an error will be thrown instead of returning an initial value.
     */
    public transform<T, U>(source: AsyncSource<T>, initialValue: U): T | Something<U>;

    /**
     * Unwraps the specified asynchronous data source and returns the last emitted value or the specified initial value.
     *
     * @param source       Asynchronous data source from which the values are to be obtained.
     * @param initialValue Value that will be returned if the data source has not yet emitted any value yet. When this is set to `nothing`
     *                     an error will be thrown instead of returning an initial value.
     */
    public transform<T, U>(source: AsyncSource<T> | null | undefined, initialValue: U): T | Something<U> | DefaultValue;

    /**
     * Unwraps the specified asynchronous data source and returns the last emitted value, the specified initial value or the specified error
     * value.
     *
     * @param source       Asynchronous data source from which the values are to be obtained.
     * @param initialValue Value that will be returned if the data source has not yet emitted any value yet. When this is set to `nothing`
     *                     an error will be thrown instead of returning an initial value.
     * @param errorValue   Value to return when the data source emits an error event. When this is set to `nothing` the error will be thrown
     *                     instead of returning an error value.
     */
    public transform<T, U, E>(source: AsyncSource<T>, initialValue: U, errorValue: E): T | Something<U> | Something<E>;

    /**
     * Unwraps the specified asynchronous data source and returns the last emitted value, the specified initial value or the specified error
     * value.
     *
     * @param source       Asynchronous data source from which the values are to be obtained.
     * @param initialValue Value that will be returned if the data source has not yet emitted any value yet. When this is set to `nothing`
     *                     an error will be thrown instead of returning an initial value.
     * @param errorValue   Value to return when the data source emits an error event. When this is set to `nothing` the error will be thrown
     *                     instead of returning an error value.
     */
    public transform<T, U, E>(source: AsyncSource<T> | null | undefined, initialValue: U, errorValue: E): T | Something<U> | Something<E> | DefaultValue; // tslint:disable-line:max-line-length

    public transform(
        source: AsyncSource<unknown> | null | undefined,
        initialValue?: unknown,
        errorValue?: unknown,
    ): unknown {
        this.updateInitialValue(arguments.length >= 2 ? initialValue : this.defaultValue);
        this.updateErrorValue(arguments.length >= 3 ? errorValue : nothing);
        this.updateSource(source);

        return this.lastReturnedValue = this.resolveLatestValue();
    }

    private updateInitialValue(newInitialValue: unknown): void {
        if (this.initialValue !== newInitialValue) {
            this.initialValue = newInitialValue;
            this.initialValueErrorThrown = false;
        }
    }

    private updateErrorValue(newErrorValue: unknown): void {
        if (this.errorValue !== newErrorValue) {
            this.errorValue = newErrorValue;
            this.errorValueErrorThrown = false;
        }
    }

    private updateSource(source: AsyncSource<unknown> | null | undefined): void {
        const newSource = source ?? undefined;

        if (newSource === this.currentSource) {
            return;
        }

        this.disposeSubscription();

        this.initialValueErrorThrown = false;
        this.errorValueErrorThrown = false;

        this.currentSource = newSource;

        this.runWithMarkForCheckSuppressed(() => {
            const subscriptionStrategy = createAsyncSourceSubscriptionStrategy(newSource, this.defaultValue);

            this.subscription = subscriptionStrategy.subscribe(
                (value) => this.updateLatestValue({ value }),
                (error) => this.updateLatestValue({ error }),
            );
        });
    }

    private resolveLatestValue(): unknown {
        if ('initial' in this.latestValue) {
            if (this.initialValue === nothing) {
                if (this.initialValueErrorThrown) {
                    return this.lastReturnedValue;
                }

                this.initialValueErrorThrown = true;
                throw new AsyncPipeError('Asynchronous data source did not emit a value, but no initial value is specified');
            }

            return this.initialValue;
        }

        if ('error' in this.latestValue) {
            if (this.errorValue === nothing) {
                if (this.errorValueErrorThrown) {
                    return this.lastReturnedValue;
                }

                this.errorValueErrorThrown = true;
                const error = this.latestValue.error instanceof Error
                    ? this.latestValue.error
                    : new AsyncPipeError('Asynchronous data source emitted an error', this.latestValue.error);
                throw error;
            }

            return this.errorValue;
        }

        return this.latestValue.value;
    }

    private updateLatestValue(newValue: AsyncValue): void {
        this.latestValue = newValue;

        if (!this.suppressMarkForCheck) {
            this.changeDetectorRef.markForCheck();
        }
    }

    private runWithMarkForCheckSuppressed(runTask: () => void): void {
        this.suppressMarkForCheck = true;
        try {
            runTask();
        } finally {
            this.suppressMarkForCheck = false;
        }
    }

    private disposeSubscription(): void {
        this.subscription?.unsubscribe();
        this.subscription = undefined;
        this.currentSource = undefined;
        this.latestValue = INITIAL_VALUE;
    }
}

@Pipe({ name: 'async', pure: false })
export class ExtendedAsyncPipeWithNullAsDefault extends ExtendedAsyncPipe<null> implements PipeTransform {
    protected readonly defaultValue = null;
}

@Pipe({ name: 'async', pure: false })
export class ExtendedAsyncPipeWithUndefinedAsDefault extends ExtendedAsyncPipe<undefined> implements PipeTransform {
    protected readonly defaultValue = undefined;
}

type AsyncValue =
    | { readonly initial: true }
    | { error: unknown }
    | { value: unknown }
    ;

const INITIAL_VALUE = { initial: true } as const;
