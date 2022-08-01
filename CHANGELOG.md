# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [2.1.0](https://github.com/dscheerens/ngx-extended-async-pipe/compare/v2.0.0...v2.1.0) (2022-08-01)


### Features

* collapse return type of initial and error values into the data type of the source when possible ([73f2664](https://github.com/dscheerens/ngx-extended-async-pipe/commit/73f26649035a277f3ce8dbac53ad61fcde735aea))

## [2.0.0](https://github.com/dscheerens/ngx-extended-async-pipe/compare/v1.0.1...v2.0.0) (2022-07-25)


### ⚠ BREAKING CHANGES

* this library now requires Angular 14 (or higher), older versions are no longer supported

### Features

* support direct imports of the `ExtendedAsyncPipe` in standalone components ([7484f22](https://github.com/dscheerens/ngx-extended-async-pipe/commit/7484f22b8a43aac9a7ae739d7702cb40599e524d))

### [1.0.1](https://github.com/dscheerens/ngx-extended-async-pipe/compare/v1.0.0...v1.0.1) (2022-02-18)


### Bug Fixes

* explicitly providing an initial value of undefined could be mapped to null ([0d0a5c0](https://github.com/dscheerens/ngx-extended-async-pipe/commit/0d0a5c07fc7e9fc1cbeca1345f2b0c23511d5365))
