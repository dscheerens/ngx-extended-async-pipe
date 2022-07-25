[![Build Status](https://github.com/dscheerens/ngx-extended-async-pipe/actions/workflows/main.yml/badge.svg?branch=main)](https://github.com/dscheerens/ngx-extended-async-pipe/actions/workflows/main.yml) [![NPM Version](https://img.shields.io/npm/v/ngx-extended-async-pipe.svg)](https://www.npmjs.com/package/ngx-extended-async-pipe)

# ngx-extended-async-pipe

**Angular's async pipe on steroids!**

As the name suggests `ngx-extended-async-pipe` provides an alternative to the standard [`async` pipe](https://angular.io/api/common/AsyncPipe) that comes with the `@angular/common` package.
It can be used as a drop-in replacement with extra options.
These options make the async pipe more convenient to use in certain cases, especially when you have cranked up the compiler strictness settings.

The features which make `ngx-extended-async-pipe` worth your while are:

* Optionally making `undefined` the default return value instead of `null`.
* Being able to override the default initial value (`null` / `undefined`) with any value of your choosing.
* A special `nothing` value that can be used as initial value which is excluded from the return type. This is useful for observables that are guaranteed to synchronously emit one or more values, so no initial value is needed.
* An option to specify the value that should be returned if the asynchronous source emits an error instead of throwing a runtime error.

## Installation

First you will need to install the `ngx-extended-async-pipe` package and add it as a dependency to your project.

```shell
npm i ngx-extended-async-pipe
```

### Angular version compatibility matrix

Use the compatibility matrix below to determine which version of this module works with your project's Angular version.

| Library version                       | Angular version |
| ------------------------------------- | --------------- |
| `ngx-extended-async-pipe` - **1.x.x** | >= **13.0.0**   |
| `ngx-extended-async-pipe` - **2.x.x** | >= **14.0.0**   |

## Usage

After having installed the package `ngx-extended-async-pipe`, simply import the `ExtendedAsyncPipeModule` in the modules where you wish to use it:

```typescript
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ExtendedAsyncPipeModule } from 'ngx-extended-async-pipe';

@NgModule({
  imports: [
    CommonModule,
    ExtendedAsyncPipeModule,
  ],
  // ...
})
export class MyModule { }
```

**Always make sure to place the `ExtendedAsyncPipeModule` after the `CommonModule` from `@angular/common`.**

This ensures that the `async` pipe in your templates resolves to the version from this library instead of the default one that ships with Angular itself.
Note that _you don't need to import the `CommonModule`_.
That is only necessary if you wish to make use of the other pipes and directives from that module.

Importing the `ExtendedAsyncPipeModule` as shown above this will not change any of the existing behavior.
The following sections explain how to make use of all extra features this library has to offer.

### Usage in standalone components

Since Angular 14 it is possible to define [standalone components](https://angular.io/guide/standalone-components).
For such components rather than using `ExtendedAsyncPipeModule` opt for importing `ExtendedAsyncPipe`:

```typescript
import { Component } from '@angular/core';
import { ExtendedAsyncPipe } from 'ngx-extended-async-pipe';

@Component({
  // ...
  standalone: true,
  imports: [
    ExtendedAsyncPipe,
  ],
})
export class MyComponent { }
```

## Features

### Returning `undefined` instead of `null` by default

An inconvenience of Angular's async pipe that it returns `null` by default.
If you have the [`strictNullChecks`](https://www.typescriptlang.org/tsconfig#strictNullChecks) and [`strictTemplates`](https://angular.io/guide/template-typecheck) compiler options enabled (both of which are highly recommended!) this often leads to conflicts.
A common example is when it is used when binding (optional) input properties where you frequently end up with expressions such as:

```
(data$ | async) ?? undefined
```

In fact, this happens so frequently that it might make sense for your project to have a version of the async pipe that uses `undefined` as default value rather than `null`.
With `ngx-extended-async-pipe` this is as simple as importing the module in the following way:

```typescript
import { NgModule } from '@angular/core';
import { ExtendedAsyncPipeModule } from 'ngx-extended-async-pipe';

@NgModule({
  imports: [
    ExtendedAsyncPipeModule.withUndefinedAsDefault(),
  ],
})
export class MyModule { }
```

Note that the above does not work for [standalone components](https://angular.io/guide/standalone-components).
Instead use `ExtendedAsyncPipeWithUndefinedAsDefault`:

```typescript
import { Component } from '@angular/core';
import { ExtendedAsyncPipeWithUndefinedAsDefault } from 'ngx-extended-async-pipe';

@Component({
  // ...
  standalone: true,
  imports: [
    ExtendedAsyncPipeWithUndefinedAsDefault,
  ],
})
export class MyComponent { }
```

### Overriding the initial value

Since the async pipe needs to synchronously return a value it must have some default initial value to return in case the asynchronous data source does not directly emit a value.
This initial value is `null` or `undefined` by default.
Often these values are incorrect which can lead to both compile and runtime errors.
One solution is to make use of the [nullish coalescing operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing_operator):

```
(data$ | async) ?? initialValue
```

The `ngx-extended-async-pipe` makes this more convenient by allowing you to specify this initial value as parameter of the async pipe itself.
For example, in case you want the default to be an empty array, you could write the following:

```
data$ | async:[]
```

### Removing the initial value

What if you don't need an initial value?
If you pass in an `Observable` as input to the async pipe that directly emits one or more values after subscribing, then there is no need for an initial value.
For example, this can be the case if the observable is based on a [`BehaviorSubject`](https://rxjs.dev/api/index/class/BehaviorSubject) or contains a [`startWith`](https://rxjs.dev/api/operators/startWith) operator at the right place.
In those situations, the initial value is never returned by the async pipe, but is still included in the return type.
That can lead to compile errors that need be resolved, which can be quite a nuisance.

To cater for this situation `ngx-extended-async-pipe` provides a special `nothing` value that can be used as initial value:

```
data$ | async:nothing
```

The special type of the `nothing` constant is excluded from the return type, so it will not lead to compile errors.
Usage of this value signals that you expect the asynchronous data source to always emit at least one value synchronously (otherwise an initial value would still required).
So in addition to excluding it from the return type, `ngx-extended-async-pipe` will also verify that the data source did indeed emit a value.
If this is not the case then it will throw a runtime error, allowing you to fix the situation, either by:
 * making sure the observable always emits at least one value synchronously
 * finding a suitable initial value

Note that the `nothing` value needs to be exposed to your template, which can be done in the following way:

```typescript
import { Component } from '@angular/core';
import { Nothing, nothing } from 'ngx-extended-async-pipe';

@Component({ /* ... */ })
export class MyComponent {
  public readonly nothing: Nothing = nothing;
}
```

As an alternative to the `nothing` value you might be tempted to use a non-null assertion instead:

```
(data$ | async)!
```

While this is slightly less verbose it does have one big drawback: it doesn't report an error if the source observable doesn't emit synchronously.
That can lead to bugs which might be hard to trace.

### Defining an error value

Observables and promises have a separate error channel from which they can signal an error event.
When these events are left unhandled a runtime error is thrown.
That also happens for such events in case of async pipe.
To prevent these runtime errors, you can transform your asynchronous data source and define a fallback, e.g., by using the [`catchError`](https://rxjs.dev/api/operators/catchError) operator for observables and the [`catch`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/catch) function for promises.
Since proper error handling is an important aspect of software development, it would also be nice if the async pipe has a way of dealing with them.

The default error behavior of the async pipe from `ngx-extended-async-pipe` is the same as Angular's standard async pipe: it will throw a runtime error for unhandled error events.
However, you can optionally specify a fallback value that is to be returned in case of such events.
This value is provided as an argument after the initial value:

```
data$ | async:initialValue:errorValue
```

No runtime error will be thrown when an error value is specified (unless you use the special value `nothing`).
