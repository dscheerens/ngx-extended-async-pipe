import { ChangeDetectionStrategy, Component } from '@angular/core';
import { interval, of, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AsyncSource, Nothing, nothing } from 'ngx-extended-async-pipe';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
    public source$: AsyncSource<number> | null | undefined;

    public initialValue: null | undefined | number | string | Nothing;

    public errorValue: null | undefined | number | string | Nothing = nothing;

    public readonly nothing: Nothing = nothing;

    public readonly observableSource$ = interval(1000).pipe(
        switchMap((value) => value < 10 ? of(value) : throwError(new Error('Value is too high!'))),
    );

    public triggerChangeDetection(): void {
    }

    public setAsyncSource(value: typeof this['source$']): void {
        this.source$ = value;
    }

    public setInitialValue(value: typeof this['initialValue']): void {
        this.initialValue = value;
    }

    public setErrorValue(value: typeof this['errorValue']): void {
        this.errorValue = value;
    }

    public get promiseSource$(): Promise<number> {
        return new Promise((resolve, reject) => {
            setTimeout(
                () => {
                    if (Math.random() < 0.5) {
                        resolve(Date.now());
                    } else {
                        reject('Promise rejected!');
                    }
                },
                5000,
            );
        });
    }

}
