import { ModuleWithProviders, NgModule } from '@angular/core';

import { ExtendedAsyncPipeWithNullAsDefault, ExtendedAsyncPipeWithUndefinedAsDefault } from './extended-async.pipe';

/**
 * Module which exposes the extended `async` pipe in the component templates that are part of the same module.
 *
 * **If you also import the `CommonModule` from `@angular/common` make sure to place the `ExtendedAsyncPipeModule` after it.**
 */
@NgModule({
    declarations: [ExtendedAsyncPipeWithNullAsDefault],
    exports: [ExtendedAsyncPipeWithNullAsDefault],
})
export class ExtendedAsyncPipeModule {
    /** This will use a different version of the extended `async` pipe that uses `undefined` instead of `null` as default value. */
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
    declarations: [ExtendedAsyncPipeWithUndefinedAsDefault],
    exports: [ExtendedAsyncPipeWithUndefinedAsDefault],
})
export class ɵExtendedAsyncPipeModuleWithUndefinedAsDefault {} // eslint-disable-line @typescript-eslint/naming-convention
