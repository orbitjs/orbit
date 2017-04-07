import Orbit from './main';
import Notifier from './notifier';
import { assert } from '@orbit/utils';

declare const console: any;

export const EVENTED = '__evented__';

/**
 * Has a class been decorated as `@evented`?
 * 
 * @export
 * @param {object} obj 
 * @returns {boolean} 
 */
export function isEvented(obj: object): boolean {
  return !!obj[EVENTED];
}

/**
 * A class decorated as `@evented` should also implement the `Evented` 
 * interface.
 * 
 * ```ts
 * import { evented, Evented } from '@orbit/core';
 *
 * @evented
 * class Source implements Evented {
 *   // ... Evented implementation
 * }
 * ```
 * 
 * @export
 * @interface Evented
 */
export interface Evented {
  on: (event: string, callback: Function, binding?: object) => void;
  off: (event: string, callback: Function, binding?: object) => void;
  one: (event: string, callback: Function, binding?: object) => void;
  emit: (event: string, ...args) => void;
  listeners: (event: string) => any[];
}

/**
 * Marks a class as evented.
 * 
 * An evented class should also implement the `Evented` interface.
 *
 * ```ts
 * import { evented, Evented } from '@orbit/core';
 *
 * @evented
 * class Source implements Evented {
 *   ...
 * }
 * ```
 * 
 * Listeners can then register themselves for particular events with `on`:
 *
 * ```ts
 * let source = new Source();
 * 
 * function listener1(message: string) {
 *   console.log('listener1 heard ' + message);
 * };
 * function listener2(message: string) {
 *   console.log('listener2 heard ' + message);
 * };
 *
 * source.on('greeting', listener1);
 * source.on('greeting', listener2);
 *
 * evented.emit('greeting', 'hello'); // logs "listener1 heard hello" and
 *                                    //      "listener2 heard hello"
 * ```
 *
 * Listeners can be unregistered from events at any time with `off`:
 *
 * ```ts
 * source.off('greeting', listener2);
 * ```
 * 
 * @decorator
 * @export
 * @param {*} Klass 
 */
export default function evented(Klass: any): void {
  let proto = Klass.prototype;

  if (isEvented(proto)) {
    return;
  }

  proto[EVENTED] = true;

  proto.on = function(eventName, callback, _binding) {
    const binding = _binding || this;

    notifierForEvent(this, eventName, true).addListener(callback, binding);
  };

  proto.off = function(eventName, callback, _binding) {
    const binding = _binding || this;
    const notifier = notifierForEvent(this, eventName);

    if (notifier) {
      if (callback) {
        notifier.removeListener(callback, binding);
      } else {
        removeNotifierForEvent(this, eventName);
      }
    }
  };

  proto.one = function(eventName, callback, _binding) {
    let callOnce;
    let notifier;
    let binding = _binding || this;

    notifier = notifierForEvent(this, eventName, true);

    callOnce = function() {
      callback.apply(binding, arguments);
      notifier.removeListener(callOnce, binding);
    };

    notifier.addListener(callOnce, binding);
  };

  proto.emit = function(eventName, ...args) {
    let notifier = notifierForEvent(this, eventName);

    if (notifier) {
      notifier.emit.apply(notifier, args);
    }
  };

  proto.listeners = function(eventName) {
    let notifier = notifierForEvent(this, eventName);
    return notifier ? notifier.listeners : [];
  };
}

/**
 * Settle any promises returned by event listeners in series.
 * 
 * If any errors are encountered during processing, they will be ignored.
 * 
 * @export
 * @param {Evented} obj 
 * @param {any} eventName 
 * @param {any} args 
 * @returns {Promise<void>}
 */
export function settleInSeries(obj: Evented, eventName, ...args): Promise<void> {
  const listeners = obj.listeners(eventName);

  return listeners.reduce((chain, [callback, binding]) => {
    return chain
      .then(() => callback.apply(binding, args))
      .catch(e => {});
  }, Orbit.Promise.resolve());
}

/**
 * Fulfill any promises returned by event listeners in series.
 * 
 * Processing will stop if an error is encountered and the returned promise will
 * be rejected.
 * 
 * @export
 * @param {Evented} obj 
 * @param {any} eventName 
 * @param {any} args 
 * @returns {Promise<void>}
 */
export function fulfillInSeries(obj: Evented, eventName, ...args): Promise<void> {
  const listeners = obj.listeners(eventName);

  return new Orbit.Promise((resolve, reject) => {
    fulfillEach(listeners, args, resolve, reject);
  });
}

function notifierForEvent(object, eventName, createIfUndefined = false) {
  if (object._eventedNotifiers === undefined) {
    object._eventedNotifiers = {};
  }
  let notifier = object._eventedNotifiers[eventName];
  if (!notifier && createIfUndefined) {
    notifier = object._eventedNotifiers[eventName] = new Notifier();
  }
  return notifier;
}

function removeNotifierForEvent(object, eventName) {
  if (object._eventedNotifiers && object._eventedNotifiers[eventName]) {
    delete object._eventedNotifiers[eventName];
  }
}

function fulfillEach(listeners, args, resolve, reject) {
  if (listeners.length === 0) {
    resolve();
  } else {
    let listener;
    [listener, ...listeners] = listeners;
    let [callback, binding] = listener;
    let response = callback.apply(binding, args);

    if (response) {
      return Orbit.Promise.resolve(response)
        .then(() => fulfillEach(listeners, args, resolve, reject))
        .catch(error => reject(error));
    } else {
      fulfillEach(listeners, args, resolve, reject);
    }
  }
}
