import { assert } from './assert';
import { deprecate } from './deprecate';
import { uuid as customRandomUUID } from '@orbit/utils';

declare const self: any;
declare const global: any;

export interface OrbitGlobal {
  globals: any;
  assert: (description: string, test: boolean) => void | never;
  deprecate: (message: string, test?: boolean | (() => boolean)) => void;
  uuid: () => string;
  debug: boolean;
}

// Establish the root object, `window` (`self`) in the browser, `global`
// on the server, or `this` in some virtual machines. We use `self`
// instead of `window` for `WebWorker` support.
//
// Source: https://github.com/jashkenas/underscore/blob/master/underscore.js#L11-L17
//     Underscore.js 1.8.3
//     http://underscorejs.org
//     (c) 2009-2017 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.
const globals =
  (typeof self == 'object' && self.self === self && self) ||
  (typeof global == 'object' && global) ||
  {};

const uuid =
  globals.crypto?.randomUUID !== undefined
    ? () => globals.crypto.randomUUID()
    : customRandomUUID;

export const Orbit: OrbitGlobal = {
  globals,
  assert,
  debug: true,
  deprecate,
  uuid
};
