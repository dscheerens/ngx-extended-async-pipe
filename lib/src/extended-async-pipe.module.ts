import { ModuleWithProviders, NgModule } from '@angular/core';

import { ExtendedAsyncPipe, ExtendedAsyncPipeWithUndefinedAsDefault } from './extended-async.pipe';

/**
 * Module which exposes the extended `async` pipe in the component templates that are part of the same module.
 *
 * Inside standalone components import `ExtendedAsyncPipe` instead.
 *
 * **If you also import the `CommonModule` from `@angular/common` make sure to place the `ExtendedAsyncPipeModule` after it.**
 */
@NgModule({
    imports: [ExtendedAsyncPipe],
    exports: [ExtendedAsyncPipe],
})
export class ExtendedAsyncPipeModule {
    /**
     * This will use a different version of the extended `async` pipe that uses `undefined` instead of `null` as default value.
     *
     * Inside standalone components import `ExtendedAsyncPipeWithUndefinedAsDefault` instead.
     */
    public static withUndefinedAsDefault(): ModuleWithProviders<ɵExtendedAsyncPipeModuleWithUndefinedAsDefault> {
        return {
            ngModule: ɵExtendedAsyncPipeModuleWithUndefinedAsDefault,
        };
    }
}

/**
 * **Not to be used directly!**
 *
 * Use the following import expression instead: `ExtendedAsyncPipeModule.withUndefinedAsDefault()`
 */
@NgModule({
    imports: [ExtendedAsyncPipeWithUndefinedAsDefault],
    exports: [ExtendedAsyncPipeWithUndefinedAsDefault],
})
export class ɵExtendedAsyncPipeModuleWithUndefinedAsDefault {} // eslint-disable-line @typescript-eslint/naming-convention
