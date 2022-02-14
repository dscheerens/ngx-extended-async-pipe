import { ModuleWithProviders, NgModule } from '@angular/core';

import { ExtendedAsyncPipeWithNullAsDefault, ExtendedAsyncPipeWithUndefinedAsDefault } from './extended-async.pipe';

@NgModule({
    declarations: [ExtendedAsyncPipeWithNullAsDefault],
    exports: [ExtendedAsyncPipeWithNullAsDefault],
})
export class ExtendedAsyncPipeModule {
    public static withUndefinedAsDefault(): ModuleWithProviders<ɵExtendedAsyncPipeModuleWithUndefinedAsDefault> {
        return {
            ngModule: ɵExtendedAsyncPipeModuleWithUndefinedAsDefault,
        };
    }
}

@NgModule({
    declarations: [ExtendedAsyncPipeWithUndefinedAsDefault],
    exports: [ExtendedAsyncPipeWithUndefinedAsDefault],
})
export class ɵExtendedAsyncPipeModuleWithUndefinedAsDefault {} // tslint:disable-line:class-name
