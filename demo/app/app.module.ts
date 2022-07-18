import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ExtendedAsyncPipeModule } from 'ngx-extended-async-pipe';

import { AppComponent } from './app.component';

@NgModule({
    imports: [
        BrowserModule,
        CommonModule,
        ExtendedAsyncPipeModule.withUndefinedAsDefault(),
    ],
    declarations: [
        AppComponent,
    ],
    bootstrap: [
        AppComponent,
    ],
})
export class AppModule {
}
