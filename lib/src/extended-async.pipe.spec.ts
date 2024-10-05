/* eslint-disable max-len */
import { ChangeDetectorRef, Type } from '@angular/core';
import { fakeAsync, flush, flushMicrotasks } from '@angular/core/testing';
import { MonoTypeOperatorFunction, NEVER, Observable, ReplaySubject, Subject, of, throwError } from 'rxjs';

import { BaseExtendedAsyncPipe, ExtendedAsyncPipe, ExtendedAsyncPipeWithUndefinedAsDefault } from './extended-async.pipe';
import { AsyncSource } from './models/async-source.model';
import { LocalChangeDetectionControlFlag } from './models/local-change-detection-control-flag.enum';
import { nothing } from './models/nothing.model';

class Component1 {} // eslint-disable-line @typescript-eslint/no-extraneous-class
class Component2 {} // eslint-disable-line @typescript-eslint/no-extraneous-class
/* eslint-disable @typescript-eslint/naming-convention */
const component1 = new Component1();
const component2 = new Component2();
/* eslint-enable @typescript-eslint/naming-convention */

defineAsyncPipeTests(ExtendedAsyncPipe, null);
defineAsyncPipeTests(ExtendedAsyncPipeWithUndefinedAsDefault, undefined);

function defineAsyncPipeTests<T extends null | undefined>(
    asyncPipeClass: Type<BaseExtendedAsyncPipe<T>>,
    defaultValue: T,
): void {
    describe(`${asyncPipeClass.name}.transform function`, withAsyncPipeTester(asyncPipeClass, (testAsyncPipe) => {
        it(`returns \`${defaultValue}\` when given \`null\` as input`, testAsyncPipe(({ pipe }) => {
            expect(pipe.transform(null)).toBe(defaultValue);
        }));

        it(`returns \`${defaultValue}\` when given \`undefined\` as input`, testAsyncPipe(({ pipe }) => {
            expect(pipe.transform(undefined)).toBe(defaultValue);
        }));

        it('throws an error when given `nothing` as initial value and an asynchronous source that does not emit synchronously', testAsyncPipe(({ pipe }) => {
            expect(() => pipe.transform(Promise.resolve('abc'), nothing)).toThrowError();
        }));

        it('does not throw a missing initial value error for succesive calls with the same asynchronous source', testAsyncPipe(({ pipe }) => {
            const source$ = new Subject<never>();
            expect(() => pipe.transform(source$, nothing)).toThrowError();
            expect(() => pipe.transform(source$, nothing)).not.toThrowError();
        }));

        it('throws a missing initial value error for succesive calls with a different asynchronous source', testAsyncPipe(({ pipe }) => {
            const sourceA$ = new Subject<never>();
            const sourceB$ = new Subject<never>();
            expect(() => pipe.transform(sourceA$, nothing)).toThrowError();
            expect(() => pipe.transform(sourceB$, nothing)).toThrowError();
        }));

        it('returns the specified initial value when given a source that does not emit synchronously', testAsyncPipe(({ pipe }) => {
            const sourceA$ = new Subject<never>();
            const sourceB$ = new Subject<never>();
            expect(pipe.transform(sourceA$, 'abc')).toBe('abc');
            expect(pipe.transform(sourceA$, 123)).toBe(123);
            expect(pipe.transform(sourceB$, 123)).toBe(123);
            expect(pipe.transform(sourceB$, 'def')).toBe('def');
            expect(pipe.transform(sourceB$, null)).toBe(null);
            expect(pipe.transform(sourceB$, undefined)).toBe(undefined);
        }));

        it('throws an error when given an invalid source', testAsyncPipe(({ pipe }) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
            expect(() => pipe.transform('bad input' as any)).toThrowError();
        }));

        it('returns the initial value when switching to another source that does not emit synchronously', testAsyncPipe(({ pipe, done }) => {
            const sourceA$ = of('abc');
            const sourceB$ = new Subject<never>();
            const sourceC$ = Promise.resolve(true);
            expect(pipe.transform(sourceA$)).toBe('abc');
            expect(pipe.transform(sourceB$)).toBe(defaultValue);
            expect(pipe.transform(sourceA$)).toBe('abc');
            expect(pipe.transform(sourceB$, 123)).toBe(123);
            expect(pipe.transform(sourceC$, false)).toBe(false);

            sourceC$.then(() => done());
        }));

        it('returns the last value emitted by the source', testAsyncPipe(({ pipe, done }) => {
            const sourceA$ = new Subject<string>();
            const sourceB$ = Promise.resolve('c');
            expect(pipe.transform(sourceA$)).toBe(defaultValue);
            sourceA$.next('a');
            expect(pipe.transform(sourceA$)).toBe('a');
            expect(pipe.transform(sourceA$)).toBe('a');
            sourceA$.next('b');
            expect(pipe.transform(sourceA$)).toBe('b');
            pipe.transform(sourceB$);
            sourceB$.then(() => {
                expect(pipe.transform(sourceB$)).toBe('c');
                done();
            });
        }));

        it('calls `markForCheck` on the change detector when the source asynchronously emits a new value', testAsyncPipe(({ pipe, markForCheckSpy }) => {
            const sourceA$ = new Subject<string>();
            const sourceB$ = new Subject<string>();

            pipe.transform(sourceA$);
            expect(markForCheckSpy.calls.count()).toBe(0);
            sourceA$.next('a');
            expect(markForCheckSpy.calls.count()).toBe(1);
            sourceA$.next('b');
            expect(markForCheckSpy.calls.count()).toBe(2);
            pipe.transform(sourceB$);
            expect(markForCheckSpy.calls.count()).toBe(2);
            sourceB$.next('c');
            expect(markForCheckSpy.calls.count()).toBe(3);
        }));

        it('does not call `markForCheck` on the change detector while the source is synchronously emitting', testAsyncPipe(({ pipe, markForCheckSpy }) => {
            const source$ = new ReplaySubject<string>();
            source$.next('a');
            source$.next('b');
            pipe.transform(source$);
            expect(markForCheckSpy.calls.count()).toBe(0);
            source$.next('c');
            expect(markForCheckSpy.calls.count()).toBe(1);
        }));

        it('throws an error when given a source that synchronously emits an error and no error value is specified', testAsyncPipe(({ pipe }) => {
            const source$ = throwError(new Error('oops'));
            expect(() => pipe.transform(source$)).toThrowError('oops');
        }));

        it('throws an error when called after a source asynchronously emitted an error', testAsyncPipe(({ pipe, done }) => {
            const sourceA$ = new Subject<never>();
            const sourceB$ = Promise.reject('paf');
            expect(() => pipe.transform(sourceA$)).not.toThrowError();
            sourceA$.error('error');
            expect(() => pipe.transform(sourceA$)).toThrowError();
            expect(() => pipe.transform(sourceB$)).not.toThrowError();
            sourceB$.catch(() => {}).finally(() => {
                expect(() => pipe.transform(sourceB$)).toThrowError();
                done();
            });
        }));

        it('does not throw an error for succesive calls with the same asynchronous source that already emitted an error', testAsyncPipe(({ pipe, done }) => {
            const sourceA$ = throwError('error');
            const sourceB$ = Promise.reject('paf');
            expect(() => pipe.transform(sourceA$)).toThrowError();
            expect(() => pipe.transform(sourceA$)).not.toThrowError();
            expect(() => pipe.transform(sourceB$)).not.toThrowError();
            sourceB$.catch(() => {}).finally(() => {
                expect(() => pipe.transform(sourceB$)).toThrowError();
                expect(() => pipe.transform(sourceB$)).not.toThrowError();
                done();
            });
        }));

        it('throws an error when switching back end forth to the same asynchronous source that already emitted an error', testAsyncPipe(({ pipe }) => {
            const sourceA$ = throwError({ toString: () => 'I am also an error!' });
            const sourceB$ = of('But I am ok :)');
            expect(() => pipe.transform(sourceA$)).toThrowError();
            expect(() => pipe.transform(sourceA$)).not.toThrowError();
            expect(() => pipe.transform(sourceB$)).not.toThrowError();
            expect(() => pipe.transform(sourceA$)).toThrowError();
            expect(() => pipe.transform(sourceA$)).not.toThrowError();
            expect(() => pipe.transform(sourceA$, defaultValue, 'error_value')).not.toThrowError();
            expect(() => pipe.transform(sourceA$)).toThrowError();
        }));

        it('returns the specified error value when the source has emitted an error', testAsyncPipe(({ pipe }) => {
            const source$ = throwError(new Error('err'));
            expect(pipe.transform(source$, defaultValue, 123)).toBe(123);
            expect(pipe.transform(source$, defaultValue, 456)).toBe(456);
            expect(pipe.transform(source$, defaultValue, undefined)).toBe(undefined);
        }));

        it('calls `markForCheck` on the change detector when the source asynchronously emits an error', testAsyncPipe(({ pipe, markForCheckSpy, done }) => {
            const sourceA$ = new Subject<never>();
            const sourceB$ = Promise.reject('paf');
            expect(() => pipe.transform(sourceA$)).not.toThrowError();
            expect(markForCheckSpy.calls.count()).toBe(0);
            sourceA$.error('poof');
            expect(markForCheckSpy.calls.count()).toBe(1);
            expect(() => pipe.transform(sourceB$)).not.toThrowError();
            expect(markForCheckSpy.calls.count()).toBe(1);
            sourceB$.catch(() => {}).finally(() => {
                expect(markForCheckSpy.calls.count()).toBe(2);
                done();
            });
        }));

        describe('with Observable source', () => {
            it('only subscribes once if the same source is used in successive calls', testAsyncPipe(({ pipe }) => {
                const subscriberCount = new SubscriberCount();
                const source$ = NEVER.pipe(countSubscribers(subscriberCount));

                pipe.transform(source$);
                expect(subscriberCount.count).toEqual({ active: 1, total: 1 });
                pipe.transform(source$);
                expect(subscriberCount.count).toEqual({ active: 1, total: 1 });
            }));

            it('unsubscribes when switching to a different source', testAsyncPipe(({ pipe }) => {
                const subscriberCount = new SubscriberCount();
                const source$ = NEVER.pipe(countSubscribers(subscriberCount));

                pipe.transform(source$);
                expect(subscriberCount.count).toEqual({ active: 1, total: 1 });
                pipe.transform(undefined);
                expect(subscriberCount.count).toEqual({ active: 0, total: 1 });
            }));
        });

        describe('with Promise source', () => {
            it('ignores a resolve event emitted after having switched to a different source', testAsyncPipe(({ pipe, markForCheckSpy, done }) => {
                const source$ = Promise.resolve('a');

                expect(pipe.transform(source$)).toBe(defaultValue);
                expect(pipe.transform(undefined)).toBe(defaultValue);

                source$.then(() => {
                    expect(markForCheckSpy.calls.count()).toBe(0);
                    done();
                });
            }));

            it('ignores a reject event emitted after having switched to a different source', testAsyncPipe(({ pipe, markForCheckSpy, done }) => {
                const source$ = Promise.reject(new Error('Kaboom!'));

                expect(pipe.transform(source$)).toBe(defaultValue);
                expect(pipe.transform(undefined)).toBe(defaultValue);

                source$.catch(() => {}).finally(() => {
                    expect(markForCheckSpy.calls.count()).toBe(0);
                    done();
                });
            }));
        });
    }));

    describe(`Multiple same context ${asyncPipeClass.name}.transform function`, withMultipleAsyncPipeTester(asyncPipeClass, [component1, component1], (fakeAsyncTestMultipleAsyncPipe) => {
        it('calls `detectChanges` on the change detector once when the source is shared for multiple pipes in the same context', fakeAsyncTestMultipleAsyncPipe(({ pipeContexts }) => {
            const source$ = new Subject<string>();

            pipeContexts.forEach(({ pipe, detectChangesSpy }) => {
                pipe.transform(source$);
                expect(detectChangesSpy.calls.count()).toBe(0);
            });

            source$.next('a');
            flushMicrotasks();
            pipeContexts.forEach(({ detectChangesSpy }) => {
                expect(detectChangesSpy.calls.count()).toBe(1);
            });

            source$.next('b');
            flushMicrotasks();
            pipeContexts.forEach(({ detectChangesSpy }) => {
                expect(detectChangesSpy.calls.count()).toBe(2);
            });

            source$.next('c');
            flushMicrotasks();
            pipeContexts.forEach(({ detectChangesSpy }) => {
                expect(detectChangesSpy.calls.count()).toBe(3);
            });
        }));

        it('calls `detectChanges` on the change detector once when the source is shared for multiple pipes in the same context with only one pipe transforming', fakeAsyncTestMultipleAsyncPipe(({ pipeContexts }) => {
            const source$ = new Subject<string>();

            const firstPipeContext = pipeContexts[0]!;
            const secondPipeContext = pipeContexts[1]!;

            firstPipeContext.pipe.transform(source$);
            expect(firstPipeContext.detectChangesSpy.calls.count()).toBe(0);
            expect(secondPipeContext.detectChangesSpy.calls.count()).toBe(0);

            source$.next('a');
            flushMicrotasks();
            pipeContexts.forEach(({ detectChangesSpy }) => {
                expect(detectChangesSpy.calls.count()).toBe(1);
            });

            source$.next('b');
            flushMicrotasks();
            pipeContexts.forEach(({ detectChangesSpy }) => {
                expect(detectChangesSpy.calls.count()).toBe(2);
            });

            source$.next('c');
            flushMicrotasks();
            pipeContexts.forEach(({ detectChangesSpy }) => {
                expect(detectChangesSpy.calls.count()).toBe(3);
            });
        }));

        it('calls `detectChanges` on the change detector once with multiple sources', fakeAsyncTestMultipleAsyncPipe(({ pipeContexts }) => {
            const sourceA$ = new Subject<string>();
            const sourceB$ = new Subject<string>();

            const firstPipeContext = pipeContexts[0]!;
            const secondPipeContext = pipeContexts[1]!;

            firstPipeContext.pipe.transform(sourceA$);
            secondPipeContext.pipe.transform(sourceB$);
            pipeContexts.forEach(({ detectChangesSpy }) => {
                expect(detectChangesSpy.calls.count()).toBe(0);
            });

            sourceA$.next('A1');
            flushMicrotasks();
            pipeContexts.forEach(({ detectChangesSpy }) => {
                expect(detectChangesSpy.calls.count()).toBe(1);
            });

            sourceB$.next('B1');
            flushMicrotasks();
            pipeContexts.forEach(({ detectChangesSpy }) => {
                expect(detectChangesSpy.calls.count()).toBe(2);
            });

            sourceA$.next('A2');
            flushMicrotasks();
            pipeContexts.forEach(({ detectChangesSpy }) => {
                expect(detectChangesSpy.calls.count()).toBe(3);
            });
        }));

        it('calls `detectChanges` on the change detector once for grouped emits', fakeAsyncTestMultipleAsyncPipe(({ pipeContexts }) => {
            const source$ = new Subject<string>();

            pipeContexts.forEach(({ pipe, detectChangesSpy }) => {
                pipe.transform(source$);
                expect(detectChangesSpy.calls.count()).toBe(0);
            });

            source$.next('a');
            source$.next('b');
            source$.next('c');
            flushMicrotasks();
            pipeContexts.forEach(({ detectChangesSpy }) => {
                expect(detectChangesSpy.calls.count()).toBe(1);
            });

            source$.next('d');
            source$.next('e');
            flushMicrotasks();
            pipeContexts.forEach(({ detectChangesSpy }) => {
                expect(detectChangesSpy.calls.count()).toBe(2);
            });
        }));

        it('does not call `markForCheck` on the change detector when the source is shared for multiple pipes in the same context', fakeAsyncTestMultipleAsyncPipe(({ pipeContexts }) => {
            const source$ = new Subject<string>();

            pipeContexts.forEach(({ pipe, markForCheckSpy }) => {
                pipe.transform(source$);
                expect(markForCheckSpy.calls.count()).toBe(0);
            });

            source$.next('a');
            flushMicrotasks();
            pipeContexts.forEach(({ markForCheckSpy }) => {
                expect(markForCheckSpy.calls.count()).toBe(0);
            });

            source$.next('b');
            flushMicrotasks();
            pipeContexts.forEach(({ markForCheckSpy }) => {
                expect(markForCheckSpy.calls.count()).toBe(0);
            });
        }));
    }));

    describe(`Multiple different context ${asyncPipeClass.name}.transform function`, withMultipleAsyncPipeTester(asyncPipeClass, [component1, component2], (fakeAsyncTestMultipleAsyncPipe) => {
        it('calls `detectChanges` on the change detector depending on the source', fakeAsyncTestMultipleAsyncPipe(({ pipeContexts }) => {
            const source$ = new Subject<string>();

            pipeContexts.forEach(({ pipe, detectChangesSpy }) => {
                pipe.transform(source$);
                expect(detectChangesSpy.calls.count()).toBe(0);
            });

            source$.next('a');
            flushMicrotasks();
            pipeContexts.forEach(({ detectChangesSpy }) => {
                expect(detectChangesSpy.calls.count()).toBe(1);
            });

            source$.next('b');
            flushMicrotasks();
            pipeContexts.forEach(({ detectChangesSpy }) => {
                expect(detectChangesSpy.calls.count()).toBe(2);
            });

            source$.next('c');
            flushMicrotasks();
            pipeContexts.forEach(({ detectChangesSpy }) => {
                expect(detectChangesSpy.calls.count()).toBe(3);
            });
        }));

        it('calls `detectChanges` on the change detector only on one context when the source is shared for multiple pipes in a different context with only one pipe transforming', fakeAsyncTestMultipleAsyncPipe(({ pipeContexts }) => {
            const source$ = new Subject<string>();

            const firstPipeContext = pipeContexts[0]!;
            const secondPipeContext = pipeContexts[1]!;

            firstPipeContext.pipe.transform(source$);
            expect(firstPipeContext.detectChangesSpy.calls.count()).toBe(0);
            expect(secondPipeContext.detectChangesSpy.calls.count()).toBe(0);

            source$.next('a');
            flushMicrotasks();
            expect(firstPipeContext.detectChangesSpy.calls.count()).toBe(1);
            expect(secondPipeContext.detectChangesSpy.calls.count()).toBe(0);

            source$.next('b');
            flushMicrotasks();
            expect(firstPipeContext.detectChangesSpy.calls.count()).toBe(2);
            expect(secondPipeContext.detectChangesSpy.calls.count()).toBe(0);

            source$.next('c');
            flushMicrotasks();
            expect(firstPipeContext.detectChangesSpy.calls.count()).toBe(3);
            expect(secondPipeContext.detectChangesSpy.calls.count()).toBe(0);
        }));

        it('calls `detectChanges` on the change detector once per context with multiple sources', fakeAsyncTestMultipleAsyncPipe(({ pipeContexts }) => {
            const sourceA$ = new Subject<string>();
            const sourceB$ = new Subject<string>();

            const firstPipeContext = pipeContexts[0]!;
            const secondPipeContext = pipeContexts[1]!;

            firstPipeContext.pipe.transform(sourceA$);
            secondPipeContext.pipe.transform(sourceB$);
            pipeContexts.forEach(({ detectChangesSpy }) => {
                expect(detectChangesSpy.calls.count()).toBe(0);
            });

            sourceA$.next('A1');
            flushMicrotasks();
            expect(firstPipeContext.detectChangesSpy.calls.count()).toBe(1);
            expect(secondPipeContext.detectChangesSpy.calls.count()).toBe(0);

            sourceB$.next('B1');
            flushMicrotasks();
            expect(firstPipeContext.detectChangesSpy.calls.count()).toBe(1);
            expect(secondPipeContext.detectChangesSpy.calls.count()).toBe(1);

            sourceA$.next('A2');
            flushMicrotasks();
            expect(firstPipeContext.detectChangesSpy.calls.count()).toBe(2);
            expect(secondPipeContext.detectChangesSpy.calls.count()).toBe(1);
        }));

        it('calls `detectChanges` on the change detector once per context for grouped emits', fakeAsyncTestMultipleAsyncPipe(({ pipeContexts }) => {
            const source$ = new Subject<string>();

            pipeContexts.forEach(({ pipe, detectChangesSpy }) => {
                pipe.transform(source$);
                expect(detectChangesSpy.calls.count()).toBe(0);
            });

            source$.next('a');
            source$.next('b');
            source$.next('c');
            flushMicrotasks();
            pipeContexts.forEach(({ detectChangesSpy }) => {
                expect(detectChangesSpy.calls.count()).toBe(1);
            });

            source$.next('d');
            source$.next('e');
            flushMicrotasks();
            pipeContexts.forEach(({ detectChangesSpy }) => {
                expect(detectChangesSpy.calls.count()).toBe(2);
            });
        }));
    }));

    describe(`With and without context ${asyncPipeClass.name}.transform function`, withMultipleAsyncPipeTester(asyncPipeClass, [component1, undefined], (fakeAsyncTestMultipleAsyncPipe) => {
        it('calls `detectChanges` or `markForCheck` on the change detector depending on the context', fakeAsyncTestMultipleAsyncPipe(({ pipeContexts }) => {
            const source$ = new Subject<string>();

            pipeContexts.forEach(({ pipe, detectChangesSpy }) => {
                pipe.transform(source$);
                expect(detectChangesSpy.calls.count()).toBe(0);
            });

            const firstPipeContext = pipeContexts[0]!;
            const secondPipeContext = pipeContexts[1]!;

            source$.next('a');
            flushMicrotasks();
            expect(firstPipeContext.detectChangesSpy.calls.count()).toBe(1);
            expect(firstPipeContext.markForCheckSpy.calls.count()).toBe(0);
            expect(secondPipeContext.detectChangesSpy.calls.count()).toBe(0);
            expect(secondPipeContext.markForCheckSpy.calls.count()).toBe(1);

            source$.next('b');
            flushMicrotasks();
            expect(firstPipeContext.detectChangesSpy.calls.count()).toBe(2);
            expect(firstPipeContext.markForCheckSpy.calls.count()).toBe(0);
            expect(secondPipeContext.detectChangesSpy.calls.count()).toBe(0);
            expect(secondPipeContext.markForCheckSpy.calls.count()).toBe(2);
        }));

        it('calls `detectChanges` on the change detector once per context for grouped emits and multiple times for missing context', fakeAsyncTestMultipleAsyncPipe(({ pipeContexts }) => {
            const source$ = new Subject<string>();

            pipeContexts.forEach(({ pipe, detectChangesSpy, markForCheckSpy }) => {
                pipe.transform(source$);
                expect(detectChangesSpy.calls.count()).toBe(0);
                expect(markForCheckSpy.calls.count()).toBe(0);
            });

            const firstPipeContext = pipeContexts[0]!;
            const secondPipeContext = pipeContexts[1]!;

            source$.next('a');
            source$.next('b');
            source$.next('c');
            flushMicrotasks();
            expect(firstPipeContext.detectChangesSpy.calls.count()).toBe(1);
            expect(firstPipeContext.markForCheckSpy.calls.count()).toBe(0);
            expect(secondPipeContext.detectChangesSpy.calls.count()).toBe(0);
            expect(secondPipeContext.markForCheckSpy.calls.count()).toBe(3);

            source$.next('d');
            source$.next('e');
            flushMicrotasks();
            expect(firstPipeContext.detectChangesSpy.calls.count()).toBe(2);
            expect(firstPipeContext.markForCheckSpy.calls.count()).toBe(0);
            expect(secondPipeContext.detectChangesSpy.calls.count()).toBe(0);
            expect(secondPipeContext.markForCheckSpy.calls.count()).toBe(5);
        }));
    }));
}

describe(`${ExtendedAsyncPipe.name}.transform call signature`, withAsyncPipeTester(ExtendedAsyncPipe, (testAsyncPipe) => {
    it('has a return type of `null` when given `null` as input type', testAsyncPipe(({ pipe }) => {
        expectThat(typeOf(pipe.transform(null)).equals<null>());
    }));

    it('has a return type of `null` when given `undefined` as input type', testAsyncPipe(({ pipe }) => {
        expectThat(typeOf(pipe.transform(undefined)).equals<null>());
    }));

    it('has a return type of `T | null` when given a `AsyncSource<T>` as input type', testAsyncPipe(({ pipe }) => {
        expectThat(typeOf(pipe.transform(asyncSource)).equals<UniqueTypeA | null>());
    }));

    it('has a return type of `T | null` when given a `AsyncSource<T> | null` as input type', testAsyncPipe(({ pipe }) => {
        expectThat(typeOf(pipe.transform(asyncSourceOrNull)).equals<UniqueTypeA | null>());
    }));

    it('has a return type of `T | null` when given a `AsyncSource<T> | undefined` as input type', testAsyncPipe(({ pipe }) => {
        expectThat(typeOf(pipe.transform(asyncSourceOrUndefined)).equals<UniqueTypeA | null>());
    }));

    it('has a return type of `T | U` when given a `AsyncSource<T>` as input type and `U` as initial type', testAsyncPipe(({ pipe }) => {
        expectThat(typeOf(pipe.transform(asyncSource, uniqueTypeB)).equals<UniqueTypeA | UniqueTypeB>());
    }));

    it('has a return type of `T` when given a `AsyncSource<T>` as input type and `Nothing` as initial type', testAsyncPipe(({ pipe }) => {
        expectThat(typeOf(pipe.transform(asyncSource, nothing)).equals<UniqueTypeA>());
    }));

    it('has a return type of `T | U | null` when given a `AsyncSource<T> | null` as input type and `U` as initial type', testAsyncPipe(({ pipe }) => {
        expectThat(typeOf(pipe.transform(asyncSourceOrNull, uniqueTypeB)).equals<UniqueTypeA | UniqueTypeB | null>());
    }));

    it('has a return type of `T | U | null` when given a `AsyncSource<T> | undefined` as input type and `U` as initial type', testAsyncPipe(({ pipe }) => {
        expectThat(typeOf(pipe.transform(asyncSourceOrUndefined, uniqueTypeB)).equals<UniqueTypeA | UniqueTypeB | null>());
    }));

    it('has a return type of `T | U | E` when given a `AsyncSource<T>` as input type, `U` as initial type and `E` as error type', testAsyncPipe(({ pipe }) => {
        expectThat(typeOf(pipe.transform(asyncSource, uniqueTypeB, uniqueTypeC)).equals<UniqueTypeA | UniqueTypeB | UniqueTypeC>());
    }));

    it('has a return type of `T | U` when given a `AsyncSource<T>` as input type, `U` as initial type and `Nothing` as error type', testAsyncPipe(({ pipe }) => {
        expectThat(typeOf(pipe.transform(asyncSource, uniqueTypeB, nothing)).equals<UniqueTypeA | UniqueTypeB>());
    }));

    it('has a return type of `T | E` when given a `AsyncSource<T>` as input type, `Nothing` as initial type and `E` as error type', testAsyncPipe(({ pipe }) => {
        expectThat(typeOf(pipe.transform(asyncSource, nothing, uniqueTypeC)).equals<UniqueTypeA | UniqueTypeC>());
    }));

    it('has a return type of `T` when given a `AsyncSource<T>` as input type, `Nothing` as initial type and `Nothing` as error type', testAsyncPipe(({ pipe }) => {
        expectThat(typeOf(pipe.transform(asyncSource, nothing, nothing)).equals<UniqueTypeA>());
    }));

    it('has a return type of `T | U | E | null` when given a `AsyncSource<T> | null` as input type, `U` as initial type and `E` as error type', testAsyncPipe(({ pipe }) => {
        expectThat(typeOf(pipe.transform(asyncSourceOrNull, uniqueTypeB, uniqueTypeC)).equals<UniqueTypeA | UniqueTypeB | UniqueTypeC | null>());
    }));

    it('has a return type of `T | U | E | null` when given a `AsyncSource<T> | undefined` as input type, `U` as initial type and `E` as error type', testAsyncPipe(({ pipe }) => {
        expectThat(typeOf(pipe.transform(asyncSourceOrUndefined, uniqueTypeB, uniqueTypeC)).equals<UniqueTypeA | UniqueTypeB | UniqueTypeC | null>());
    }));
}));

describe(`${ExtendedAsyncPipeWithUndefinedAsDefault.name}.transform call signature`, withAsyncPipeTester(ExtendedAsyncPipeWithUndefinedAsDefault, (testAsyncPipe) => {
    it('has a return type of `undefined` when given `null` as input type', testAsyncPipe(({ pipe }) => {
        expectThat(typeOf(pipe.transform(null)).equals<undefined>());
    }));

    it('has a return type of `undefined` when given `undefined` as input type', testAsyncPipe(({ pipe }) => {
        expectThat(typeOf(pipe.transform(undefined)).equals<undefined>());
    }));

    it('has a return type of `T | undefined` when given a `AsyncSource<T>` as input type', testAsyncPipe(({ pipe }) => {
        expectThat(typeOf(pipe.transform(asyncSource)).equals<UniqueTypeA | undefined>());
    }));

    it('has a return type of `T | undefined` when given a `AsyncSource<T> | null` as input type', testAsyncPipe(({ pipe }) => {
        expectThat(typeOf(pipe.transform(asyncSourceOrNull)).equals<UniqueTypeA | undefined>());
    }));

    it('has a return type of `T | undefined` when given a `AsyncSource<T> | undefined` as input type', testAsyncPipe(({ pipe }) => {
        expectThat(typeOf(pipe.transform(asyncSourceOrUndefined)).equals<UniqueTypeA | undefined>());
    }));

    it('has a return type of `T | U` when given a `AsyncSource<T>` as input type and `U` as initial type', testAsyncPipe(({ pipe }) => {
        expectThat(typeOf(pipe.transform(asyncSource, uniqueTypeB)).equals<UniqueTypeA | UniqueTypeB>());
    }));

    it('has a return type of `T` when given a `AsyncSource<T>` as input type and `Nothing` as initial type', testAsyncPipe(({ pipe }) => {
        expectThat(typeOf(pipe.transform(asyncSource, nothing)).equals<UniqueTypeA>());
    }));

    it('has a return type of `T | U | undefined` when given a `AsyncSource<T> | null` as input type and `U` as initial type', testAsyncPipe(({ pipe }) => {
        expectThat(typeOf(pipe.transform(asyncSourceOrNull, uniqueTypeB)).equals<UniqueTypeA | UniqueTypeB | undefined>());
    }));

    it('has a return type of `T | U | undefined` when given a `AsyncSource<T> | undefined` as input type and `U` as initial type', testAsyncPipe(({ pipe }) => {
        expectThat(typeOf(pipe.transform(asyncSourceOrUndefined, uniqueTypeB)).equals<UniqueTypeA | UniqueTypeB | undefined>());
    }));

    it('has a return type of `T | U | E` when given a `AsyncSource<T>` as input type, `U` as initial type and `E` as error type', testAsyncPipe(({ pipe }) => {
        expectThat(typeOf(pipe.transform(asyncSource, uniqueTypeB, uniqueTypeC)).equals<UniqueTypeA | UniqueTypeB | UniqueTypeC>());
    }));

    it('has a return type of `T | U` when given a `AsyncSource<T>` as input type, `U` as initial type and `Nothing` as error type', testAsyncPipe(({ pipe }) => {
        expectThat(typeOf(pipe.transform(asyncSource, uniqueTypeB, nothing)).equals<UniqueTypeA | UniqueTypeB>());
    }));

    it('has a return type of `T | E` when given a `AsyncSource<T>` as input type, `Nothing` as initial type and `E` as error type', testAsyncPipe(({ pipe }) => {
        expectThat(typeOf(pipe.transform(asyncSource, nothing, uniqueTypeC)).equals<UniqueTypeA | UniqueTypeC>());
    }));

    it('has a return type of `T` when given a `AsyncSource<T>` as input type, `Nothing` as initial type and `Nothing` as error type', testAsyncPipe(({ pipe }) => {
        expectThat(typeOf(pipe.transform(asyncSource, nothing, nothing)).equals<UniqueTypeA>());
    }));

    it('has a return type of `T | U | E | undefined` when given a `AsyncSource<T> | null` as input type, `U` as initial type and `E` as error type', testAsyncPipe(({ pipe }) => {
        expectThat(typeOf(pipe.transform(asyncSourceOrNull, uniqueTypeB, uniqueTypeC)).equals<UniqueTypeA | UniqueTypeB | UniqueTypeC | undefined>());
    }));

    it('has a return type of `T | U | E | undefined` when given a `AsyncSource<T> | undefined` as input type, `U` as initial type and `E` as error type', testAsyncPipe(({ pipe }) => {
        expectThat(typeOf(pipe.transform(asyncSourceOrUndefined, uniqueTypeB, uniqueTypeC)).equals<UniqueTypeA | UniqueTypeB | UniqueTypeC | undefined>());
    }));
}));

function withAsyncPipeTester<T extends null | undefined>(
    asyncPipeClass: Type<BaseExtendedAsyncPipe<T>>,
    defineTests: (testAsyncPipe: AsyncPipeTester<T>) => void,
): () => void {
    return () => {
        function testAsyncPipe(executeTest: (context: AsyncPipeTestContext<T>) => void): (done: DoneFn) => void {
            return (done) => {
                const changeDetectorRef = {
                    markForCheck(): void {},
                } as unknown as ChangeDetectorRef;

                const markForCheckSpy = spyOn(changeDetectorRef, 'markForCheck').and.callThrough();

                const pipe = new asyncPipeClass(changeDetectorRef);

                function dispose(): void {
                    pipe.ngOnDestroy();
                    done();
                }

                let doneAccessed = false;
                try {
                    executeTest({
                        pipe,
                        markForCheckSpy,
                        get done(): () => void {
                            doneAccessed = true;

                            return dispose;
                        },
                    });
                } finally {
                    if (!doneAccessed) { // eslint-disable-line @typescript-eslint/no-unnecessary-condition
                        dispose();
                    }
                }
            };
        }

        return defineTests(testAsyncPipe);
    };
}

function withMultipleAsyncPipeTester<T extends null | undefined>(
    asyncPipeClass: Type<BaseExtendedAsyncPipe<T>>,
    contexts: unknown[],
    defineTests: (fakeAsyncTestMultipleAsyncPipe: MultipleAsyncPipeTester<T>) => void,
): () => void {
    return () => {
        function testAsyncPipe(executeTest: (context: MultipleAsyncPipeTestContext<T>) => void): () => void {
            return fakeAsync(() => {
                const uniqueContexts = Array.from(new Set(contexts));

                const changeDetectorRefByContext = new Map(
                    uniqueContexts.map((uniqueContext) => [uniqueContext, {
                        detach(): void {},
                        reattach(): void {},
                        markForCheck(): void {},
                        detectChanges(): void {},
                        context: uniqueContext,
                    } as unknown as ChangeDetectorRef] as const),
                );

                const markForCheckSpyByChangeDetectorRef = new Map(
                    [...changeDetectorRefByContext.values()].map((changeDetectorRef) => [changeDetectorRef, spyOn(changeDetectorRef, 'markForCheck').and.callThrough()] as const),
                );
                const detectChangesSpyByChangeDetectorRef = new Map(
                    [...changeDetectorRefByContext.values()].map((changeDetectorRef) => [changeDetectorRef, spyOn(changeDetectorRef, 'detectChanges').and.callThrough()] as const),
                );

                const pipeContexts = contexts.map((context) => {
                    const changeDetectorRef = changeDetectorRefByContext.get(context);
                    if (!changeDetectorRef) {
                        return undefined;
                    }

                    const markForCheckSpy = markForCheckSpyByChangeDetectorRef.get(changeDetectorRef);
                    const detectChangesSpy = detectChangesSpyByChangeDetectorRef.get(changeDetectorRef);
                    if (!markForCheckSpy || !detectChangesSpy) {
                        return undefined;
                    }

                    const pipe = new asyncPipeClass(changeDetectorRef, context !== undefined ? LocalChangeDetectionControlFlag.Self : undefined, undefined);

                    return {
                        pipe,
                        markForCheckSpy,
                        detectChangesSpy,
                        dispose: () => {
                            pipe.ngOnDestroy();
                        },
                    };
                }).filter((pipeContext): pipeContext is PipeContext<T> => pipeContext !== undefined);

                function dispose(): void {
                    pipeContexts.forEach((pipeContext) => {
                        pipeContext.dispose();
                    });

                    flush();
                }

                let doneAccessed = false;
                try {
                    executeTest({
                        pipeContexts,
                        get done(): () => void {
                            doneAccessed = true;

                            return dispose;
                        },
                    });
                } finally {
                    if (!doneAccessed) { // eslint-disable-line @typescript-eslint/no-unnecessary-condition
                        dispose();
                    }
                }
            });
        }

        return defineTests(testAsyncPipe);
    };
}

type AsyncPipeTester<T extends null | undefined> = (executeTest: (context: AsyncPipeTestContext<T>) => void) => (done: DoneFn) => void;
type MultipleAsyncPipeTester<T extends null | undefined> = (executeTest: (context: MultipleAsyncPipeTestContext<T>) => void) => (done: DoneFn) => void;

interface AsyncPipeTestContext<T extends null | undefined> {
    pipe: BaseExtendedAsyncPipe<T>;
    markForCheckSpy: jasmine.Spy<() => void>;
    done(): void;
}

interface MultipleAsyncPipeTestContext<T extends null | undefined> {
    pipeContexts: PipeContext<T>[];
    done(): void;
}

interface PipeContext<T extends null | undefined> {
    pipe: BaseExtendedAsyncPipe<T>;
    markForCheckSpy: jasmine.Spy<() => void>;
    detectChangesSpy: jasmine.Spy<() => void>;
    dispose(): void;
}

/* eslint-disable @typescript-eslint/naming-convention */
const uniqueTypeA = Symbol('uniqueTypeA');
const uniqueTypeB = Symbol('uniqueTypeB');
const uniqueTypeC = Symbol('uniqueTypeC');
type UniqueTypeA = typeof uniqueTypeA;
type UniqueTypeB = typeof uniqueTypeB;
type UniqueTypeC = typeof uniqueTypeC;
const asyncSource: AsyncSource<UniqueTypeA> = of(uniqueTypeA);
const asyncSourceOrNull = Math.random() < 0.5 ? asyncSource : null;
const asyncSourceOrUndefined = Math.random() < 0.5 ? asyncSource : undefined;
/* eslint-enable @typescript-eslint/naming-convention */

class SubscriberCount {
    private readonly internal = {
        total: 0,
        active: 0,
    };

    public get total(): number {
        return this.internal.total;
    }

    public get active(): number {
        return this.internal.active;
    }

    public increment(): void {
        this.internal.total++;
        this.internal.active++;
    }

    public decrement(): void {
        this.internal.active--;
    }

    public get count(): { total: number; active: number } {
        return {
            total: this.total,
            active: this.active,
        };
    }
}

function countSubscribers<T>(subscriberCount: SubscriberCount): MonoTypeOperatorFunction<T> {
    return (source$) =>
        new Observable<T>((subscriber) => {
            subscriberCount.increment();

            const subscription = source$.subscribe(subscriber);

            subscription.add(() => subscriberCount.decrement());

            return subscription;
        });
}

function expectThat<T extends true>(value: T): void {
    expect(value as unknown).toBe(true);
}

function typeOf<T>(value: T): TypeOfAssertion<T> { // eslint-disable-line @typescript-eslint/no-unused-vars
    return { equals: <U>() => true as IsTypeEqual<T, U> };
}

interface TypeOfAssertion<T> {
    equals<U>(): IsTypeEqual<T, U>;
}

type IsTypeEqual<A, B> = IsNotAny<A> extends false ? false : (
    IsNotAny<B> extends false ? false : (
        [A] extends [B] ? ([B] extends [A] ? true : false) : false
    )
);

type IsNotAny<T> = 0 extends (1 & T) ? false : true;
